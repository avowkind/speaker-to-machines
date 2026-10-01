import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHash, encodeSnapshot } from '../site/core/url.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework();

test('a snapshot encodes as its date and code-level pairs', () => {
  const hash = encodeSnapshot({ date: '2026-09-30', claims: [{ code: 'INST', level: 3 }, { code: 'WRIT', level: 2 }] });
  assert.equal(hash, 'date=2026-09-30&claims=INST-3,WRIT-2');
});

test('a snapshot round-trips through the URL', () => {
  const snapshot = { date: '2026-09', claims: [{ code: 'INST', level: 1 }, { code: 'WRIT', level: 3 }] };
  assert.deepEqual(decodeHash(`#${encodeSnapshot(snapshot)}`, fw), {
    kind: 'snapshot',
    snapshot,
    mapped: [],
    problems: [],
  });
});

test('a snapshot with no claims round-trips', () => {
  const snapshot = { date: '2026-09-30', claims: [] };
  assert.deepEqual(decodeHash(encodeSnapshot(snapshot), fw), { kind: 'snapshot', snapshot, mapped: [], problems: [] });
});

test('decoded claims come back in framework order, whatever order the link gives', () => {
  const result = decodeHash('#date=2026-09-30&claims=WRIT-2,INST-3', fw);
  assert.equal(result.kind, 'snapshot');
  assert.deepEqual(result.kind === 'snapshot' && result.snapshot.claims, [{ code: 'INST', level: 3 }, { code: 'WRIT', level: 2 }]);
});

test('an empty hash is no snapshot', () => {
  assert.deepEqual(decodeHash('', fw), { kind: 'none' });
  assert.deepEqual(decodeHash('#', fw), { kind: 'none' });
});

test('unknown codes, levels outside a skill\'s range and malformed pairs are dropped and reported', () => {
  const result = decodeHash('#date=2026-09-30&claims=INST-3,ZZZZ-2,WRIT-1,WRIT-x,INST-2', fw);
  assert.deepEqual(result, {
    kind: 'snapshot',
    snapshot: { date: '2026-09-30', claims: [{ code: 'INST', level: 3 }] },
    mapped: [],
    problems: [
      'ZZZZ is not a skill in this framework',
      'WRIT has no level 1 (its levels are 2-3)',
      '"WRIT-x" is not a code-level pair',
      'INST is claimed more than once; the first claim is kept',
    ],
  });
});

test('a link with a bad date is reported and not decoded', () => {
  assert.deepEqual(decodeHash('#date=2026-13-01&claims=INST-3', fw), {
    kind: 'invalid',
    problems: ['"2026-13-01" is not a date (YYYY-MM or YYYY-MM-DD)'],
  });
});
