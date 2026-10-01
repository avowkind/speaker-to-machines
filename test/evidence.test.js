import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addEvidence,
  deleteEvidence,
  filterEvidence,
  practiceDates,
  setOverride,
  startLogbook,
  updateEvidence,
} from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');
const quick = { date: '2026-09-30', claims: [{ code: 'INST', level: 3 }] };
const fresh = () => startLogbook(fw, quick, { person: 'Ana' });

/** @param {Partial<import('../site/core/logbook.js').EvidenceInput>} item */
const ev = (item) => ({ date: '2026-01', codes: ['INST'], type: /** @type {const} */ ('used'), note: 'Did a thing', ...item });

test('a logbook starts from the quick claims, which become its first snapshot', () => {
  assert.deepEqual(fresh(), {
    schema: 'stm-logbook/0.1',
    person: 'Ana',
    framework_version: '0.1',
    evidence: [],
    snapshots: [quick],
    targets: [],
    overrides: [],
  });
});

test('an evidence item is added with an id, and can carry several codes, a link and tools', () => {
  const lb = addEvidence(fw, fresh(), ev({ codes: ['INST', 'WRIT'], link: 'https://example.org', tools: ['Chatbot Pro', 'my own script'] }));
  assert.deepEqual(lb.evidence, [
    { id: 'e1', date: '2026-01', codes: ['INST', 'WRIT'], type: 'used', note: 'Did a thing', link: 'https://example.org', tools: ['Chatbot Pro', 'my own script'] },
  ]);
  assert.equal(addEvidence(fw, lb, ev({})).evidence[1].id, 'e2');
});

test('an evidence item with a bad date, no codes, an unknown code, a bad type or no note is refused', () => {
  assert.throws(() => addEvidence(fw, fresh(), ev({ date: '2026-02-30' })), /"2026-02-30" is not a date/);
  assert.throws(() => addEvidence(fw, fresh(), ev({ codes: [] })), /at least one skill/);
  assert.throws(() => addEvidence(fw, fresh(), ev({ codes: ['ZZZZ'] })), /ZZZZ is not a skill/);
  assert.throws(() => addEvidence(fw, fresh(), ev({ type: /** @type {any} */ ('watched') })), /type must be one of learned, used, built, taught, published/);
  assert.throws(() => addEvidence(fw, fresh(), ev({ note: '  ' })), /needs a note/);
  assert.throws(() => addEvidence(fw, fresh(), ev({ link: 'javascript:alert(1)' })), /a link must be a web address/);
});

test('an evidence item can be edited and deleted', () => {
  const lb = addEvidence(fw, addEvidence(fw, fresh(), ev({})), ev({ note: 'Second' }));
  const edited = updateEvidence(fw, lb, 'e1', ev({ note: 'Fixed', type: 'built' }));
  assert.deepEqual(edited.evidence.map((e) => [e.id, e.note, e.type]), [['e1', 'Fixed', 'built'], ['e2', 'Second', 'used']]);
  assert.deepEqual(deleteEvidence(edited, 'e1').evidence.map((e) => e.id), ['e2']);
  assert.throws(() => updateEvidence(fw, lb, 'e9', ev({})), /no evidence item e9/);
});

test('first used and last practised come from the earliest and latest non-learned evidence', () => {
  let lb = fresh();
  for (const item of [
    ev({ date: '2024-03-15', type: 'learned' }),
    ev({ date: '2024-06', type: 'used' }),
    ev({ date: '2025-11-02', type: 'built' }),
    ev({ date: '2026-02', type: 'learned' }),
    ev({ date: '2025-01', codes: ['WRIT'], type: 'taught' }),
  ]) lb = addEvidence(fw, lb, item);
  assert.deepEqual(practiceDates(fw, lb, 'INST'), { first_used: '2024-06', last_practised: '2025-11-02', overridden: { first_used: false, last_practised: false } });
  assert.deepEqual(practiceDates(fw, lb, 'WRIT'), { first_used: '2025-01', last_practised: '2025-01', overridden: { first_used: false, last_practised: false } });
});

test('learning alone gives no first used or last practised', () => {
  const lb = addEvidence(fw, fresh(), ev({ type: 'learned' }));
  assert.deepEqual(practiceDates(fw, lb, 'INST'), { first_used: null, last_practised: null, overridden: { first_used: false, last_practised: false } });
});

test('a year-month compares as the first of its month', () => {
  let lb = addEvidence(fw, fresh(), ev({ date: '2026-03-01' }));
  lb = addEvidence(fw, lb, ev({ date: '2026-03' }));
  // Same day: the earlier-entered item stands for both.
  assert.equal(practiceDates(fw, lb, 'INST').first_used, '2026-03-01');
  lb = addEvidence(fw, lb, ev({ date: '2026-02-28' }));
  assert.equal(practiceDates(fw, lb, 'INST').first_used, '2026-02-28');
});

test('overrides of first used and last practised win, and can be cleared', () => {
  let lb = addEvidence(fw, fresh(), ev({ date: '2025-06' }));
  lb = setOverride(fw, lb, 'INST', { first_used: '2021-01' });
  assert.deepEqual(practiceDates(fw, lb, 'INST'), { first_used: '2021-01', last_practised: '2025-06', overridden: { first_used: true, last_practised: false } });
  lb = setOverride(fw, lb, 'INST', { last_practised: '2026-09' });
  assert.deepEqual(lb.overrides, [{ code: 'INST', first_used: '2021-01', last_practised: '2026-09' }]);
  lb = setOverride(fw, lb, 'INST', { first_used: null, last_practised: null });
  assert.deepEqual(lb.overrides, []);
  assert.deepEqual(practiceDates(fw, lb, 'INST').first_used, '2025-06');
  assert.throws(() => setOverride(fw, lb, 'INST', { first_used: 'last year' }), /not a date/);
});

test('the evidence log filters by skill, type and date range', () => {
  let lb = fresh();
  for (const item of [
    ev({ date: '2025-01', codes: ['INST'], type: 'used' }),
    ev({ date: '2025-06', codes: ['WRIT', 'INST'], type: 'built' }),
    ev({ date: '2026-02-10', codes: ['WRIT'], type: 'learned' }),
  ]) lb = addEvidence(fw, lb, item);
  const ids = (/** @type {import('../site/core/logbook.js').EvidenceFilter} */ f) => filterEvidence(fw, lb, f).map((e) => e.id);
  assert.deepEqual(ids({}), ['e3', 'e2', 'e1'], 'newest first');
  assert.deepEqual(ids({ code: 'INST' }), ['e2', 'e1']);
  assert.deepEqual(ids({ type: 'built' }), ['e2']);
  assert.deepEqual(ids({ from: '2025-06', to: '2026-01' }), ['e2']);
  assert.deepEqual(ids({ from: '2026-02' }), ['e3']);
});
