// One-off check that moving the framework from Python to YAML changed no
// content. The fixture was captured from the Python build before it was
// deleted. Delete this test and its fixture at the first deliberate content change.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from '../scripts/build.js';

const python = (/** @type {string} */ f) =>
  JSON.parse(readFileSync(new URL(`./fixtures/python-build/${f}`, import.meta.url), 'utf8'));

test('the YAML-built bundle holds the same skills as the Python build', () => {
  const { framework } = build({ validateOnly: true });
  assert.ok(framework);
  /** @type {Record<string, Record<string, Record<string, unknown>>>} */
  const tree = {};
  for (const c of framework.categories) {
    tree[c.name] = {};
    for (const s of c.subcategories) {
      tree[c.name][s.name] = Object.fromEntries(
        s.skills.map(({ name, category, subcategory, ...record }) => [name, record]),
      );
    }
  }
  assert.deepStrictEqual(tree, python('skills.json'));
});

test('the YAML-built bundle holds the same levels as the Python build', () => {
  const { framework } = build({ validateOnly: true });
  assert.ok(framework);
  assert.deepStrictEqual(
    { framework: framework.framework, levels: framework.levels },
    python('levels.json'),
  );
});
