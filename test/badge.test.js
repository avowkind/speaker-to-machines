import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { LEVELS, badgeFromAttributes, badgeFromProfile } from '../site/badge-data.js';
import { exportProfile } from '../site/core/files.js';
import { addEvidence, buildProfile, startLogbook } from '../site/core/logbook.js';
import { build } from '../scripts/build.js';
import { fixtureFramework } from './helpers/fixtures.js';

test('the badge knows the same level names and titles as the framework', () => {
  const { framework } = build({ validateOnly: true });
  assert.deepEqual(LEVELS, framework?.levels.map((l) => ({ level: l.level, name: l.name, title: l.title })));
});

test('a badge from attributes shows its skill, level, title and cited evidence', () => {
  assert.deepEqual(
    badgeFromAttributes({ code: 'INST', level: '4', skill: 'Instructing AI', evidence: 'Team prompt library', 'evidence-link': 'https://example.org/lib' }),
    {
      ok: true,
      badge: {
        code: 'INST',
        skill: 'Instructing AI',
        level: 4,
        title: 'Shaper',
        name: 'Integrator',
        evidence: [{ note: 'Team prompt library', link: 'https://example.org/lib' }],
        person: '',
        as_of: '',
      },
    },
  );
});

test('a badge from attributes with a bad code or level is refused', () => {
  assert.deepEqual(badgeFromAttributes({ code: 'inst', level: '4' }), { ok: false, error: 'code must be four capital letters' });
  assert.deepEqual(badgeFromAttributes({ code: 'INST', level: '9' }), { ok: false, error: 'level must be a number from 1 to 7' });
});

test('a badge from a YAML profile shows the badge the evidence supports', () => {
  const fw = fixtureFramework('logbook');
  let lb = startLogbook(fw, { date: '2026-09-30', claims: [{ code: 'LEAD', level: 5 }] }, { person: 'Ana' });
  lb = addEvidence(fw, lb, { date: '2026-02', codes: ['LEAD'], type: 'taught', note: 'Ran a workshop', link: 'https://example.org/w' });
  const profile = parse(exportProfile(buildProfile(fw, lb)));
  assert.deepEqual(badgeFromProfile(profile, 'LEAD'), {
    ok: true,
    badge: {
      code: 'LEAD',
      skill: 'Leading with AI',
      level: 5,
      title: 'Maker',
      name: 'Designer',
      evidence: [{ date: '2026-02', type: 'taught', note: 'Ran a workshop', link: 'https://example.org/w' }],
      person: 'Ana',
      as_of: '2026-09-30',
    },
  });
  assert.deepEqual(badgeFromProfile(profile, 'INST'), { ok: false, error: 'the profile has no claim for INST' });
  assert.deepEqual(badgeFromProfile({ schema: 'something-else' }, 'LEAD'), { ok: false, error: 'not a Speaker-to-Machines profile' });
});

test('a profile claim without a badge is shown as unevidenced, not as a badge', () => {
  const fw = fixtureFramework('logbook');
  const lb = startLogbook(fw, { date: '2026-09-30', claims: [{ code: 'LEAD', level: 3 }] });
  const profile = parse(exportProfile(buildProfile(fw, lb)));
  assert.deepEqual(badgeFromProfile(profile, 'LEAD'), { ok: false, error: 'LEAD is claimed at level 3 but has no evidenced badge' });
});

test('only http and https links are kept', async () => {
  const { safeLink } = await import('../site/badge-data.js');
  assert.equal(safeLink('https://example.org/a'), 'https://example.org/a');
  assert.equal(safeLink('http://example.org/'), 'http://example.org/');
  assert.equal(safeLink('javascript:alert(1)'), undefined);
  assert.equal(safeLink('JaVaScRiPt:alert(1)'), undefined);
  assert.equal(safeLink('data:text/html,hi'), undefined);
  assert.equal(safeLink('not a url'), undefined);
});
