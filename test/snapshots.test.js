import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addEvidence,
  addSnapshot,
  claimStatus,
  deleteSnapshot,
  history,
  isEditable,
  newSnapshot,
  setClaim,
  setOverride,
  startLogbook,
} from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');

function logbook() {
  let lb = startLogbook(fw, { date: '2025-03-01', claims: [{ code: 'INST', level: 2 }, { code: 'LEAD', level: 3 }] });
  lb = addEvidence(fw, lb, { date: '2024-06', codes: ['LEAD'], type: 'used', note: 'Used it' });
  lb = addEvidence(fw, lb, { date: '2025-01', codes: ['LEAD'], type: 'used', note: 'Used it again' });
  lb = addEvidence(fw, lb, { date: '2026-06', codes: ['LEAD'], type: 'built', note: 'Built a thing' });
  return lb;
}

test('a new snapshot starts as a copy of the latest, dated today', () => {
  const lb = newSnapshot(fw, logbook(), '2026-09-30');
  assert.deepEqual(lb.snapshots, [
    { date: '2025-03-01', claims: [{ code: 'INST', level: 2 }, { code: 'LEAD', level: 3 }] },
    { date: '2026-09-30', claims: [{ code: 'INST', level: 2 }, { code: 'LEAD', level: 3 }] },
  ]);
  assert.notEqual(lb.snapshots[1].claims, lb.snapshots[0].claims, 'a copy, not the same list');
});

test('only one snapshot is made per day', () => {
  const lb = newSnapshot(fw, logbook(), '2026-09-30');
  assert.throws(() => newSnapshot(fw, lb, '2026-09-30'), /already a snapshot dated 2026-09-30/);
});

test('claims in today\'s snapshot can be changed, and a skill left out is not claimed', () => {
  let lb = newSnapshot(fw, logbook(), '2026-09-30');
  lb = setClaim(fw, lb, '2026-09-30', 'LEAD', 4, '2026-09-30');
  lb = setClaim(fw, lb, '2026-09-30', 'INST', null, '2026-09-30');
  assert.deepEqual(lb.snapshots[1].claims, [{ code: 'LEAD', level: 4 }]);
  assert.equal(claimStatus(fw, lb, { code: 'LEAD', level: 4 }, '2026-09-30').badge?.level, 4);
  assert.deepEqual(history(fw, lb).find((h) => h.code === 'INST')?.entries.map((e) => e.level), [2, null]);
});

test('once its date has passed, a snapshot\'s claims are fixed', () => {
  const lb = logbook();
  assert.equal(isEditable(lb.snapshots[0], '2025-03-01'), true);
  assert.equal(isEditable(lb.snapshots[0], '2025-03-02'), false);
  assert.throws(
    () => setClaim(fw, lb, '2025-03-01', 'INST', 3, '2025-03-02'),
    /The snapshot of 2025-03-01 is fixed: make a new snapshot to change a claim/,
  );
  assert.throws(() => setClaim(fw, lb, '2024-01-01', 'INST', 3, '2025-03-02'), /no snapshot dated 2024-01-01/);
});

test('a snapshot can be deleted, but a logbook keeps at least one', () => {
  const lb = newSnapshot(fw, logbook(), '2026-09-30');
  const fewer = deleteSnapshot(lb, '2025-03-01');
  assert.deepEqual(fewer.snapshots.map((s) => s.date), ['2026-09-30']);
  assert.throws(() => deleteSnapshot(fewer, '2026-09-30'), /at least one snapshot/);
});

test('history shows each skill\'s level and badge at each snapshot\'s date', () => {
  let lb = newSnapshot(fw, logbook(), '2026-09-30');
  lb = setClaim(fw, lb, '2026-09-30', 'LEAD', 5, '2026-09-30');
  lb = addSnapshot(fw, lb, { date: '2025-09', claims: [{ code: 'LEAD', level: 3 }, { code: 'WRIT', level: 2 }] });
  assert.deepEqual(history(fw, lb), [
    {
      code: 'INST',
      entries: [
        { date: '2025-03-01', level: 2, badge: null, stale: false },
        { date: '2025-09', level: null, badge: null, stale: false },
        { date: '2026-09-30', level: 2, badge: null, stale: false },
      ],
    },
    {
      code: 'WRIT',
      entries: [
        { date: '2025-03-01', level: null, badge: null, stale: false },
        { date: '2025-09', level: 2, badge: null, stale: false },
        { date: '2026-09-30', level: null, badge: null, stale: false },
      ],
    },
    {
      code: 'LEAD',
      entries: [
        { date: '2025-03-01', level: 3, badge: 3, stale: false },
        { date: '2025-09', level: 3, badge: 3, stale: false },
        // The year of use reached 3 and the building in 2026-06 reaches 5.
        { date: '2026-09-30', level: 5, badge: 5, stale: false },
      ],
    },
  ]);
});

test('a claim is stale when its skill was last practised more than 12 months before the snapshot', () => {
  let lb = startLogbook(fw, { date: '2026-09-30', claims: [] });
  lb = addEvidence(fw, lb, { date: '2025-09-30', codes: ['LEAD'], type: 'used', note: 'Last use' });
  lb = addEvidence(fw, lb, { date: '2026-08', codes: ['LEAD'], type: 'learned', note: 'A course' });
  const claim = { code: 'LEAD', level: 2 };
  assert.equal(claimStatus(fw, lb, claim, '2026-09-30').stale, false, 'exactly 12 months');
  assert.equal(claimStatus(fw, lb, claim, '2026-10-01').stale, true, 'a day more; learning does not refresh it');
  assert.equal(claimStatus(fw, lb, claim, '2026-10-01').last_practised, '2025-09-30');
});

test('staleness in an old snapshot is measured from that snapshot\'s date', () => {
  let lb = startLogbook(fw, { date: '2024-01-01', claims: [{ code: 'LEAD', level: 2 }] });
  lb = addEvidence(fw, lb, { date: '2022-06', codes: ['LEAD'], type: 'used', note: 'Old use' });
  lb = addEvidence(fw, lb, { date: '2026-01', codes: ['LEAD'], type: 'used', note: 'Recent use' });
  lb = addSnapshot(fw, lb, { date: '2026-09-30', claims: [{ code: 'LEAD', level: 2 }] });
  assert.deepEqual(history(fw, lb)[0].entries.map((e) => e.stale), [true, false]);
});

test('an override of last practised counts in staleness', () => {
  let lb = startLogbook(fw, { date: '2026-09-30', claims: [{ code: 'LEAD', level: 2 }] });
  lb = addEvidence(fw, lb, { date: '2024-01', codes: ['LEAD'], type: 'used', note: 'Old use' });
  assert.equal(claimStatus(fw, lb, { code: 'LEAD', level: 2 }, '2026-09-30').stale, true);
  lb = setOverride(fw, lb, 'LEAD', { last_practised: '2026-08' });
  assert.equal(claimStatus(fw, lb, { code: 'LEAD', level: 2 }, '2026-09-30').stale, false);
});

test('a claim with no practice recorded is not flagged stale', () => {
  const lb = startLogbook(fw, { date: '2026-09-30', claims: [{ code: 'LEAD', level: 1 }] });
  assert.equal(claimStatus(fw, lb, { code: 'LEAD', level: 1 }, '2026-09-30').stale, false);
});
