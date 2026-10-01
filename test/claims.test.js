import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withClaim } from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework();
const empty = { date: '2026-09-30', claims: [] };

test('ticking a level claims it, in framework order', () => {
  let s = withClaim(fw, empty, 'WRIT', 2);
  s = withClaim(fw, s, 'INST', 3);
  assert.deepEqual(s.claims, [{ code: 'INST', level: 3 }, { code: 'WRIT', level: 2 }]);
});

test('ticking another level of the same skill replaces the claim: at most one level per skill', () => {
  const s = withClaim(fw, withClaim(fw, empty, 'INST', 1), 'INST', 3);
  assert.deepEqual(s.claims, [{ code: 'INST', level: 3 }]);
});

test('unticking withdraws the claim', () => {
  const s = withClaim(fw, withClaim(fw, empty, 'INST', 1), 'INST', null);
  assert.deepEqual(s.claims, []);
});

test('a level outside the skill\'s level range cannot be claimed', () => {
  assert.throws(() => withClaim(fw, empty, 'WRIT', 1), /WRIT has no level 1/);
  assert.throws(() => withClaim(fw, empty, 'NOPE', 1), /NOPE is not a skill/);
});

test('claiming leaves the original snapshot untouched', () => {
  withClaim(fw, empty, 'INST', 2);
  assert.deepEqual(empty.claims, []);
});
