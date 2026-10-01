import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHash } from '../site/core/url.js';
import { importLogbook, importTarget } from '../site/core/files.js';
import { claimStatus, evidenceFor, practiceDates } from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

// This framework retired WRTE; WRIT replaced it.
const fw = fixtureFramework('retired');
const mapped = [{ from: 'WRTE', to: 'WRIT' }];

test('a claims link naming a retired code is mapped to the replacement', () => {
  assert.deepEqual(decodeHash('#date=2025-01-01&claims=WRTE-3,INST-2', fw), {
    kind: 'snapshot',
    snapshot: { date: '2025-01-01', claims: [{ code: 'INST', level: 2 }, { code: 'WRIT', level: 3 }] },
    mapped,
    problems: [],
  });
});

test('a target link naming a retired code is mapped to the replacement', () => {
  assert.deepEqual(decodeHash('#target=Writer&levels=WRTE-3!', fw), {
    kind: 'target',
    target: { name: 'Writer', levels: [{ code: 'WRIT', level: 3, priority: 'essential' }] },
    mapped,
    problems: [],
  });
});

test('a link naming both a retired code and its replacement keeps the first', () => {
  const result = decodeHash('#date=2025-01-01&claims=WRTE-3,WRIT-2', fw);
  assert.deepEqual(result.kind === 'snapshot' && result.snapshot.claims, [{ code: 'WRIT', level: 3 }]);
  assert.deepEqual(result.kind === 'snapshot' && result.problems, ['WRIT is claimed more than once; the first claim is kept']);
});

const oldLogbook = `
schema: stm-logbook/0.1
person: Ana
framework_version: "0.1"
evidence:
  - { id: e1, date: "2025-01", codes: [WRTE], type: used, note: Drafted reports }
  - { id: e2, date: "2025-06", codes: [WRTE, INST], type: built, note: Report templates }
snapshots:
  - { date: "2025-07-01", claims: [ { code: WRTE, level: 3 } ] }
targets:
  - { name: Editor, levels: [ { code: WRTE, level: 3, priority: essential } ] }
overrides:
  - { code: WRTE, first_used: "2023-05" }
`;

test('a logbook file has retired codes in claims, targets and overrides mapped, and says so', () => {
  const result = importLogbook(fw, oldLogbook);
  assert.ok(result.ok);
  assert.deepEqual(result.mapped, mapped);
  assert.deepEqual(result.logbook.snapshots[0].claims, [{ code: 'WRIT', level: 3 }]);
  assert.deepEqual(result.logbook.targets[0].levels, [{ code: 'WRIT', level: 3, priority: 'essential' }]);
  assert.deepEqual(result.logbook.overrides, [{ code: 'WRIT', first_used: '2023-05' }]);
});

test('evidence keeps the code it was logged under but counts for the replacement skill', () => {
  const result = importLogbook(fw, oldLogbook);
  assert.ok(result.ok);
  const lb = result.logbook;
  assert.deepEqual(lb.evidence.map((e) => e.codes), [['WRTE'], ['WRTE', 'INST']]);
  assert.deepEqual(evidenceFor(fw, lb, 'WRIT').map((e) => e.id), ['e1', 'e2']);
  assert.equal(claimStatus(fw, lb, { code: 'WRIT', level: 3 }, '2025-07-01').badge?.level, 3);
  assert.deepEqual(practiceDates(fw, lb, 'WRIT'), {
    first_used: '2023-05',
    last_practised: '2025-06',
    overridden: { first_used: true, last_practised: false },
  });
});

test('a target file naming a retired code is mapped to the replacement', () => {
  const result = importTarget(fw, 'schema: stm-target/0.1\nname: Editor\nlevels:\n  - { code: WRTE, level: 2, priority: desirable }\n');
  assert.deepEqual(result, { ok: true, target: { name: 'Editor', levels: [{ code: 'WRIT', level: 2, priority: 'desirable' }] }, mapped });
});
