import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from '../scripts/build.js';
import { fixtureDir } from './helpers/fixtures.js';

const repoData = new URL('../data/', import.meta.url).pathname;

test('the base fixture builds a bundle and a review document', () => {
  const dir = fixtureDir();
  const out = { bundlePath: join(dir, 'out.json'), reviewPath: join(dir, 'review.md') };
  const result = build({ dataDir: dir, ...out });
  assert.deepEqual(result.errors, []);
  const bundle = JSON.parse(readFileSync(out.bundlePath, 'utf8'));
  assert.equal(bundle.framework.name, 'Test framework');
  assert.deepEqual(
    bundle.categories.map((c) => c.subcategories.map((s) => s.skills.map((k) => k.code))),
    [[['INST'], ['WRIT']]],
  );
  assert.match(readFileSync(out.reviewPath, 'utf8'), /### INST Instructing AI \(levels 1-3\)/);
});

test('a skill with a level missing from its range fails, naming file, field and rule', () => {
  const dir = fixtureDir('missing-level');
  const bundlePath = join(dir, 'out.json');
  const result = build({ dataDir: dir, bundlePath, reviewPath: join(dir, 'review.md') });
  assert.deepEqual(result.errors, [
    {
      file: 'skills/INST.yaml',
      path: 'levels',
      rule: 'descriptors-cover-range',
      message: 'level_range is 1-3 but level 2 has no descriptor',
    },
  ]);
  assert.equal(existsSync(bundlePath), false, 'no bundle is written when validation fails');
});

test('the real framework data builds without errors', () => {
  const result = build({ dataDir: repoData, validateOnly: true });
  assert.deepEqual(result.errors, []);
  assert.equal(result.framework?.categories.flatMap((c) => c.subcategories).flatMap((s) => s.skills).length, 53);
});
