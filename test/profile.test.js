import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { buildProfile } from '../site/core/logbook.js';
import { exportProfile } from '../site/core/files.js';
import { validateSchema } from '../site/core/schema.js';
import { addEvidence, addSnapshot, startLogbook } from '../site/core/logbook.js';
import profileSchema from '../site/schemas/profile.schema.json' with { type: 'json' };
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');

function logbook() {
  let lb = startLogbook(fw, { date: '2024-01-01', claims: [{ code: 'LEAD', level: 2 }, { code: 'INST', level: 1 }] }, { person: 'Ana' });
  lb = addSnapshot(fw, lb, { date: '2025-01-01', claims: [{ code: 'LEAD', level: 2 }, { code: 'INST', level: 2 }] });
  lb = addSnapshot(fw, lb, { date: '2026-09-30', claims: [{ code: 'LEAD', level: 4 }, { code: 'INST', level: 2 }, { code: 'TRUE', level: 1 }] });
  lb = addEvidence(fw, lb, { date: '2023-11', codes: ['LEAD'], type: 'learned', note: 'Course' });
  lb = addEvidence(fw, lb, { date: '2026-03', codes: ['LEAD', 'INST'], type: 'built', note: 'Team toolkit', link: 'https://example.org/kit', tools: ['Chatbot Pro'] });
  lb = addEvidence(fw, lb, { date: '2024-06', codes: ['INST'], type: 'used', note: 'Drafting' });
  return lb;
}

test('the profile gives each currently claimed skill its claim, badge, evidence and earlier changes', () => {
  const p = buildProfile(fw, logbook());
  assert.equal(p.person, 'Ana');
  assert.equal(p.as_of, '2026-09-30');
  assert.deepEqual(p.framework, { name: 'Test framework', version: '0.1' });
  assert.deepEqual(p.skills.map((s) => s.code), ['INST', 'TRUE', 'LEAD'], 'framework order, claimed skills only');
  assert.deepEqual(p.skills[2], {
    code: 'LEAD',
    name: 'Leading with AI',
    category: 'Working with AI',
    subcategory: 'Applying AI to work',
    claim: { level: 4, name: 'Integrator', title: 'Shaper', descriptor: 'Builds for the team.' },
    badge: {
      level: 4,
      name: 'Integrator',
      title: 'Shaper',
      evidence: [{ date: '2026-03', type: 'built', note: 'Team toolkit', link: 'https://example.org/kit', tools: ['Chatbot Pro'] }],
    },
    unevidenced: [],
    first_used: '2026-03',
    last_practised: '2026-03',
    stale: false,
    changes: [{ date: '2024-01-01', level: 2, name: 'Assisted', title: 'Caller' }],
  });
});

test('earlier snapshots appear only where the level changed', () => {
  const inst = buildProfile(fw, logbook()).skills[0];
  assert.deepEqual(inst.changes.map((c) => [c.date, c.level]), [['2024-01-01', 1], ['2025-01-01', 2]]);
  assert.equal(inst.badge?.level, 2);
});

test('a claim without qualifying evidence has no badge, and its unevidenced levels are listed', () => {
  const t = buildProfile(fw, logbook()).skills[1];
  assert.equal(t.badge, null);
  assert.deepEqual(t.unevidenced, [1]);
  assert.deepEqual(t.changes, []);
});

test('the profile exports as YAML with quoted dates and codes, fitting the profile schema', () => {
  const text = exportProfile(buildProfile(fw, logbook()));
  assert.match(text, /schema: "stm-profile\/0.1"/);
  assert.match(text, /code: "TRUE"/);
  assert.match(text, /as_of: "2026-09-30"/);
  const data = parse(text, { version: '1.1' });
  assert.equal(data.skills[1].code, 'TRUE');
  assert.deepEqual(validateSchema(profileSchema, parse(text)), []);
});
