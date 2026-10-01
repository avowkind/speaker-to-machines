import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { exportLogbook, importLogbook } from '../site/core/files.js';
import { addEvidence, addSnapshot, setOverride, startLogbook } from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');

function sample() {
  let lb = startLogbook(fw, { date: '2025-03-01', claims: [{ code: 'INST', level: 2 }, { code: 'TRUE', level: 1 }] }, { person: 'Ana' });
  lb = addEvidence(fw, lb, { date: '2025-02', codes: ['INST', 'NULL'], type: 'used', note: 'Briefed: "drafts" for clients', tools: ['Chatbot Pro'] });
  lb = addEvidence(fw, lb, { date: '2026-05-04', codes: ['TRUE'], type: 'learned', note: 'yes', link: 'https://example.org/a?b=1' });
  lb = setOverride(fw, lb, 'INST', { first_used: '2023-01' });
  lb = addSnapshot(fw, lb, { date: '2026-09-30', claims: [{ code: 'INST', level: 3 }, { code: 'NULL', level: 2 }, { code: 'LEAD', level: 4 }] });
  return { ...lb, targets: [{ name: 'Senior engineer', levels: [{ code: 'LEAD', level: 5, priority: /** @type {const} */ ('essential') }] }] };
}

test('a logbook round-trips through YAML', () => {
  const lb = sample();
  const result = importLogbook(fw, exportLogbook(lb));
  assert.deepEqual(result, { ok: true, logbook: lb, mapped: [] });
});

test('dates and codes are written as quoted strings, so even a YAML 1.1 parser keeps them', () => {
  const text = exportLogbook(sample());
  assert.match(text, /code: "TRUE"/);
  assert.match(text, /date: "2025-03-01"/);
  assert.match(text, /- "NULL"/);
  const old = parse(text, { version: '1.1' });
  assert.equal(old.snapshots[0].claims[1].code, 'TRUE');
  assert.equal(old.snapshots[0].date, '2025-03-01');
  assert.equal(old.evidence[0].codes[1], 'NULL');
  assert.equal(old.evidence[1].note, 'yes');
  assert.equal(old.framework_version, '0.1');
});

test('a hand-written file with unquoted dates and ordinary codes still imports, as YAML 1.2', () => {
  const text = [
    'schema: stm-logbook/0.1',
    'framework_version: "0.1"',
    'evidence:',
    '  - { id: e1, date: 2026-01, codes: [INST], type: used, note: Did it }',
    'snapshots:',
    '  - date: 2026-09-30',
    '    claims: [ { code: INST, level: 2 } ]',
  ].join('\n');
  const result = importLogbook(fw, text);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.logbook, {
    schema: 'stm-logbook/0.1',
    person: '',
    framework_version: '0.1',
    evidence: [{ id: 'e1', date: '2026-01', codes: ['INST'], type: 'used', note: 'Did it' }],
    snapshots: [{ date: '2026-09-30', claims: [{ code: 'INST', level: 2 }] }],
    targets: [],
    overrides: [],
  });
});

test('an unquoted code that YAML reads as a boolean is refused, not misread', () => {
  const text = 'schema: stm-logbook/0.1\nframework_version: "0.1"\nevidence: []\nsnapshots:\n  - { date: "2026-09", claims: [ { code: TRUE, level: 1 } ] }\n';
  const result = importLogbook(fw, text);
  assert.deepEqual(result.ok ? [] : result.errors, ['snapshots.0.claims.0.code: Instance type "boolean" is invalid. Expected "string".']);
});

test('a file that is not YAML is refused with the line of the problem', () => {
  const result = importLogbook(fw, 'schema: stm-logbook/0.1\nsnapshots: [ { date: "2026-09"\n');
  assert.equal(result.ok, false);
  assert.match(result.ok ? '' : result.errors[0], /^The file is not valid YAML: .*line \d+/);
});

test('a file that breaks the logbook schema is refused with readable errors', () => {
  const text = [
    'schema: stm-profile/0.1',
    'framework_version: 0.1',
    'evidence:',
    '  - { id: e1, date: "2026-13", codes: [], type: watched, note: x, extra: 1 }',
    'snapshots: []',
  ].join('\n');
  const result = importLogbook(fw, text);
  assert.deepEqual(result.ok ? [] : result.errors, [
    'schema: must be "stm-logbook/0.1"',
    'framework_version: Instance type "number" is invalid. Expected "string".',
    'evidence.0.date: "2026-13" does not match the pattern for a date (YYYY-MM or YYYY-MM-DD)',
    'evidence.0.codes: Array has too few items (0 < 1).',
    'evidence.0.type: must be one of learned, used, built, taught, published',
    'evidence.0.extra: unknown field "extra"',
  ]);
});

test('a file that fits the schema but not the framework is refused', () => {
  const text = [
    'schema: stm-logbook/0.1',
    'framework_version: "0.1"',
    'evidence:',
    '  - { id: e1, date: "2026-02-30", codes: [ZZZZ], type: used, note: x }',
    '  - { id: e1, date: "2026-01", codes: [INST], type: used, note: " ", link: "javascript:alert(1)" }',
    'snapshots:',
    '  - { date: "2026-09-30", claims: [ { code: WRIT, level: 1 }, { code: INST, level: 2 }, { code: INST, level: 3 } ] }',
    '  - { date: "2026-09-30", claims: [] }',
  ].join('\n');
  const result = importLogbook(fw, text);
  assert.deepEqual(result.ok ? [] : result.errors, [
    'evidence.0.date: "2026-02-30" is not a date',
    'evidence.0.codes.0: ZZZZ is not a skill in this framework',
    'evidence.1.note: an evidence item needs a note saying what was done',
    'evidence.1.link: a link must be a web address starting http:// or https://',
    'evidence.1.id: e1 is used by more than one evidence item',
    'snapshots.0.claims.0: WRIT has no level 1 (its levels are 2-3)',
    'snapshots.0.claims.2: INST is claimed more than once in this snapshot',
    'snapshots.1.date: there is already a snapshot dated 2026-09-30',
  ]);
});

test('a snapshot from a link is added to the logbook in date order', () => {
  const lb = sample();
  const added = addSnapshot(fw, lb, { date: '2025-09', claims: [{ code: 'INST', level: 3 }] });
  assert.deepEqual(added.snapshots.map((s) => s.date), ['2025-03-01', '2025-09', '2026-09-30']);
  assert.throws(() => addSnapshot(fw, lb, { date: '2026-09-30', claims: [] }), /already a snapshot dated 2026-09-30/);
});
