import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHash, encodeTarget } from '../site/core/url.js';
import { exportTarget, importTarget } from '../site/core/files.js';
import {
  addEvidence,
  addTarget,
  findGaps,
  removeTarget,
  startLogbook,
  withTargetLevel,
  withTargetPriority,
} from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');

/** @type {import('../site/core/logbook.js').Target} */
const role = {
  name: 'Senior engineer & lead',
  levels: [
    { code: 'INST', level: 3, priority: 'essential' },
    { code: 'WRIT', level: 2, priority: 'desirable' },
    { code: 'LEAD', level: 5, priority: 'essential' },
  ],
};

test('a target is built by ticking target levels and marking each essential or desirable', () => {
  let t = /** @type {import('../site/core/logbook.js').Target} */ ({ name: 'Analyst', levels: [] });
  t = withTargetLevel(fw, t, 'LEAD', 4, 'desirable');
  t = withTargetLevel(fw, t, 'INST', 2, 'essential');
  t = withTargetLevel(fw, t, 'LEAD', 4, 'essential');
  assert.deepEqual(t.levels, [
    { code: 'INST', level: 2, priority: 'essential' },
    { code: 'LEAD', level: 4, priority: 'essential' },
  ]);
  assert.deepEqual(withTargetLevel(fw, t, 'INST', null, 'essential').levels.map((l) => l.code), ['LEAD']);
  assert.throws(() => withTargetLevel(fw, t, 'WRIT', 1, 'essential'), /WRIT has no level 1/);
  assert.deepEqual(withTargetPriority(t, 'LEAD', 'desirable').levels[1], { code: 'LEAD', level: 4, priority: 'desirable' });
  assert.throws(() => withTargetPriority(t, 'WRIT', 'desirable'), /no level for WRIT/);
});

test('a target encodes as its name and code-level pairs, with essential levels marked', () => {
  assert.equal(encodeTarget(role), 'target=Senior%20engineer%20%26%20lead&levels=INST-3!,WRIT-2,LEAD-5!');
});

test('a target round-trips through the URL', () => {
  assert.deepEqual(decodeHash(`#${encodeTarget(role)}`, fw), { kind: 'target', target: role, mapped: [], problems: [] });
});

test('bad pairs in a target link are dropped and reported', () => {
  assert.deepEqual(decodeHash('#target=Role&levels=INST-3!,INST-2,WRIT-9,LEAD-5?', fw), {
    kind: 'target',
    target: { name: 'Role', levels: [{ code: 'INST', level: 3, priority: 'essential' }] },
    mapped: [],
    problems: ['INST is given more than once; the first is kept', '"WRIT-9" is not a code-level pair', '"LEAD-5?" is not a code-level pair'],
  });
  assert.deepEqual(decodeHash('#target=&levels=INST-3', fw), { kind: 'invalid', problems: ['a target link needs a name'] });
});

test('a target round-trips through YAML, with codes quoted', () => {
  const t = { name: 'True north', levels: [{ code: 'TRUE', level: 2, priority: /** @type {const} */ ('essential') }] };
  const text = exportTarget(t);
  assert.match(text, /schema: "stm-target\/0.1"/);
  assert.match(text, /code: "TRUE"/);
  assert.deepEqual(importTarget(fw, text), { ok: true, target: t, mapped: [] });
});

test('an invalid target file is refused with readable errors', () => {
  const result = importTarget(fw, 'schema: stm-target/0.1\nname: X\nlevels:\n  - { code: INST, level: 3, priority: vital }\n  - { code: WRIT, level: 1, priority: essential }\n');
  assert.deepEqual(result.ok ? [] : result.errors, ['levels.0.priority: must be one of essential, desirable']);
  const result2 = importTarget(fw, 'schema: stm-target/0.1\nname: X\nlevels:\n  - { code: WRIT, level: 1, priority: essential }\n');
  assert.deepEqual(result2.ok ? [] : result2.errors, ['levels.0: WRIT has no level 1 (its levels are 2-3)']);
});

test('a logbook keeps several targets, each with its own name', () => {
  let lb = startLogbook(fw, { date: '2026-09-30', claims: [] });
  lb = addTarget(fw, lb, role);
  lb = addTarget(fw, lb, { name: '2027 goals', levels: [] });
  assert.deepEqual(lb.targets.map((t) => t.name), ['Senior engineer & lead', '2027 goals']);
  assert.throws(() => addTarget(fw, lb, { name: '2027 goals', levels: [] }), /already a target named "2027 goals"/);
  assert.deepEqual(removeTarget(lb, '2027 goals').targets.map((t) => t.name), ['Senior engineer & lead']);
});

test('gaps rank essential before desirable, then by size, against the latest claims', () => {
  let lb = startLogbook(fw, { date: '2025-01-01', claims: [{ code: 'INST', level: 3 }] });
  lb = { ...lb, snapshots: [...lb.snapshots, { date: '2026-09-30', claims: [{ code: 'INST', level: 1 }, { code: 'LEAD', level: 4 }] }] };
  const target = {
    name: 'Role',
    levels: /** @type {import('../site/core/logbook.js').TargetLevel[]} */ ([
      { code: 'WRIT', level: 3, priority: 'desirable' },
      { code: 'INST', level: 3, priority: 'essential' },
      { code: 'LEAD', level: 5, priority: 'essential' },
      { code: 'TRUE', level: 2, priority: 'desirable' },
    ]),
  };
  assert.deepEqual(findGaps(fw, lb, target).gaps, [
    { code: 'INST', target: 3, priority: 'essential', claim: 1, size: 2 },
    { code: 'LEAD', target: 5, priority: 'essential', claim: 4, size: 1 },
    { code: 'WRIT', target: 3, priority: 'desirable', claim: 0, size: 3 },
    { code: 'TRUE', target: 2, priority: 'desirable', claim: 0, size: 2 },
  ]);
});

test('evidence gaps list claims that meet the target where the badge does not', () => {
  let lb = startLogbook(fw, { date: '2026-09-30', claims: [{ code: 'INST', level: 3 }, { code: 'LEAD', level: 5 }, { code: 'WRIT', level: 3 }] });
  for (const m of ['01', '06', '12']) lb = addEvidence(fw, lb, { date: `2025-${m}`, codes: ['LEAD'], type: 'used', note: 'use' });
  lb = addEvidence(fw, lb, { date: '2025-06', codes: ['WRIT'], type: 'used', note: 'drafts' });
  lb = addEvidence(fw, lb, { date: '2025-09', codes: ['WRIT'], type: 'used', note: 'more drafts' });
  const target = {
    name: 'Role',
    levels: /** @type {import('../site/core/logbook.js').TargetLevel[]} */ ([
      { code: 'WRIT', level: 3, priority: 'desirable' },
      { code: 'INST', level: 2, priority: 'desirable' },
      { code: 'LEAD', level: 4, priority: 'essential' },
    ]),
  };
  const { gaps, evidenceGaps } = findGaps(fw, lb, target);
  assert.deepEqual(gaps, []);
  assert.deepEqual(evidenceGaps, [
    { code: 'LEAD', target: 4, priority: 'essential', claim: 5, badge: 3 },
    { code: 'INST', target: 2, priority: 'desirable', claim: 3, badge: null },
  ]);
});
