import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEvidence, claimStatus, startLogbook } from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');

/**
 * A logbook with evidence for LEAD (levels 1-7), and the badge for a claim.
 * @param {number} claimed
 * @param {Array<[string, import('../site/core/logbook.js').EvidenceType]>} items date and type
 * @param {{ asOf?: string, code?: string }} [options]
 */
function badgeFor(claimed, items, { asOf = '2026-09-30', code = 'LEAD' } = {}) {
  let lb = startLogbook(fw, { date: asOf, claims: [] });
  for (const [date, type] of items) lb = addEvidence(fw, lb, { date, codes: [code], type, note: `${type} ${date}` });
  return claimStatus(fw, lb, { code, level: claimed }, asOf);
}

const yearOfUse = /** @type {Array<[string, 'used']>} */ (
  ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => [`2025-${m}`, 'used'])
);

test('a claim with no evidence has no badge, and every level up to it is unevidenced', () => {
  assert.deepEqual(badgeFor(3, []), { code: 'LEAD', level: 3, badge: null, unevidenced: [1, 2, 3] });
});

test('any type of evidence earns a badge at level 1', () => {
  const s = badgeFor(1, [['2026-01', 'learned']]);
  assert.equal(s.badge?.level, 1);
  assert.equal(s.badge?.title, 'Listener');
  assert.deepEqual(s.unevidenced, []);
});

test('learning alone earns no more than level 1', () => {
  const s = badgeFor(3, [['2025-01', 'learned'], ['2026-01', 'learned']]);
  assert.equal(s.badge?.level, 1);
  assert.deepEqual(s.unevidenced, [2, 3]);
});

test('level 2 needs used, built, taught or published evidence', () => {
  for (const type of /** @type {const} */ (['used', 'built', 'taught', 'published'])) {
    assert.equal(badgeFor(2, [['2026-01', type]]).badge?.level, 2, type);
  }
});

test('level 3 needs such evidence spanning at least three months', () => {
  assert.equal(badgeFor(3, [['2026-01-15', 'used'], ['2026-04-14', 'used']]).badge?.level, 2, 'a day short');
  assert.equal(badgeFor(3, [['2026-01-15', 'used'], ['2026-04-15', 'used']]).badge?.level, 3, 'exactly three months');
  assert.equal(badgeFor(3, [['2026-01', 'used'], ['2026-04', 'used']]).badge?.level, 3, 'year-months as the first of the month');
  assert.equal(badgeFor(3, [['2026-01', 'learned'], ['2026-06', 'used']]).badge?.level, 2, 'learning does not count towards the span');
});

test('built evidence counts no less than used at level 3', () => {
  assert.equal(badgeFor(3, [['2025-01', 'built'], ['2025-05', 'used']]).badge?.level, 3);
  assert.equal(badgeFor(3, [['2025-01', 'built'], ['2025-05', 'built']]).badge?.level, 3);
});

test('a claim of 5 backed only by a year of use shows a badge at 3', () => {
  const s = badgeFor(5, yearOfUse);
  assert.equal(s.badge?.level, 3);
  assert.equal(s.badge?.title, 'Speaker');
  assert.equal(s.badge?.evidence.length, 12);
  assert.deepEqual(s.unevidenced, [4, 5]);
});

test('levels 4 and 5 need built or taught evidence', () => {
  assert.equal(badgeFor(5, [['2026-01', 'built']]).badge?.level, 5);
  assert.equal(badgeFor(4, [['2026-01', 'taught']]).badge?.level, 4);
  assert.equal(badgeFor(4, [['2026-01', 'published']]).badge?.level, 2, 'published alone does not reach 4');
});

test('levels 6 and 7 need taught or published evidence', () => {
  assert.equal(badgeFor(7, [['2026-01', 'published']]).badge?.level, 7);
  assert.equal(badgeFor(6, [['2026-01', 'taught']]).badge?.level, 6);
  assert.equal(badgeFor(7, [...yearOfUse, ['2026-01', 'built']]).badge?.level, 5, 'building reaches 5, not 6');
});

test('a badge is never higher than the claim', () => {
  const s = badgeFor(2, [['2026-01', 'published']]);
  assert.equal(s.badge?.level, 2);
  assert.deepEqual(s.unevidenced, []);
});

test('a badge cites the evidence that meets its level', () => {
  const s = badgeFor(4, [['2025-01', 'used'], ['2025-06', 'built'], ['2026-02', 'learned']]);
  assert.equal(s.badge?.level, 4);
  assert.deepEqual(s.badge?.evidence.map((e) => e.note), ['built 2025-06']);
});

test('only evidence dated on or before the snapshot counts', () => {
  assert.equal(badgeFor(4, [['2026-09-30', 'built']]).badge?.level, 4, 'on the day');
  assert.equal(badgeFor(4, [['2026-10-01', 'built']]).badge, null, 'the day after');
});

test('a badge is only given at a level within the skill\'s range', () => {
  // WRIT is defined at levels 2-3, so learning (level 1 evidence) earns nothing.
  const s = badgeFor(3, [['2026-01', 'learned']], { code: 'WRIT' });
  assert.deepEqual(s, { code: 'WRIT', level: 3, badge: null, unevidenced: [2, 3] });
});
