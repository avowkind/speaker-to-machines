import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../scripts/build.js';
import { fixtureDir } from './helpers/fixtures.js';

/** @param {string} [fixture] */
const errorsFor = (fixture) => build({ dataDir: fixtureDir(fixture), validateOnly: true }).errors;

test('a code that is not four capital letters fails', () => {
  assert.deepEqual(errorsFor('five-letter-code'), [
    { file: 'skills/INSTR.yaml', path: 'code', rule: 'code-format', message: 'code "INSTR" must be four capital letters' },
  ]);
});

test('a code used by two skills fails, and so does a file not named after its code', () => {
  assert.deepEqual(errorsFor('duplicate-code'), [
    { file: 'skills/WRITE.yaml', path: 'code', rule: 'code-matches-file', message: 'code "WRIT" does not match the file name WRITE.yaml' },
    { file: 'skills/WRITE.yaml', path: 'code', rule: 'code-unique', message: 'code "WRIT" is also used by skills/WRIT.yaml' },
  ]);
});

test('a code that collides with an SFIA code fails', () => {
  assert.deepEqual(errorsFor('sfia-collision'), [
    { file: 'skills/PROG.yaml', path: 'code', rule: 'no-sfia-collision', message: 'code "PROG" is an SFIA 7–9 skill code' },
  ]);
});

test('a retired code replaced by a code that does not exist fails', () => {
  assert.deepEqual(errorsFor('dangling-replaced-by'), [
    { file: 'levels.yaml', path: 'retired.0.replaced_by', rule: 'replacement-exists', message: 'retired code "DRFT" is replaced by "WRTE", which is not a current skill' },
  ]);
});

test('a retired code used by a current skill fails', () => {
  assert.deepEqual(errorsFor('retired-code-reused'), [
    { file: 'levels.yaml', path: 'retired.0.code', rule: 'retired-code-not-reused', message: 'retired code "WRIT" is used by skills/WRIT.yaml; retired codes are never reused' },
  ]);
});

test('a descriptor naming a product from the examples layer fails, case-insensitively', () => {
  assert.deepEqual(errorsFor('product-name'), [
    { file: 'skills/WRIT.yaml', path: 'levels.3', rule: 'no-product-names', message: 'names "Chatbot Pro" from the examples layer; put products in examples.yaml' },
  ]);
});

test('a generic term listed in the examples layer may appear in skill text', () => {
  // The base fixture's INST level 3 mentions "project instructions", a generic term.
  assert.deepEqual(errorsFor(), []);
});

test('a skill in a subcategory missing from the taxonomy fails', () => {
  assert.deepEqual(errorsFor('unknown-subcategory'), [
    { file: 'skills/EDIT.yaml', path: 'subcategory', rule: 'subcategory-in-taxonomy', message: 'subcategory "Editing with AI" is not in category "Working with AI" in taxonomy.yaml' },
  ]);
});

test('a skill in a category missing from the taxonomy fails', () => {
  assert.deepEqual(errorsFor('unknown-category'), [
    { file: 'skills/MEDI.yaml', path: 'category', rule: 'category-in-taxonomy', message: 'category "Making media" is not in taxonomy.yaml' },
  ]);
});

test('examples for a code that is not a skill fail', () => {
  assert.deepEqual(errorsFor('unknown-examples-code'), [
    { file: 'examples.yaml', path: 'items.WRTI', rule: 'examples-code-exists', message: 'examples are given for "WRTI", which is not a current skill' },
  ]);
});

test('a skill file that breaks the schema fails, naming each field', () => {
  assert.deepEqual(errorsFor('schema-violation'), [
    { file: 'skills/WRIT.yaml', path: 'name', rule: 'schema', message: 'missing required field "name"' },
    { file: 'skills/WRIT.yaml', path: 'level_range.1', rule: 'schema', message: '9 is greater than 7.' },
    { file: 'skills/WRIT.yaml', path: 'owner', rule: 'schema', message: 'unknown field "owner"' },
  ]);
});

test('a file that is not valid YAML fails, naming the file', () => {
  const errors = errorsFor('yaml-syntax');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].file, 'taxonomy.yaml');
  assert.equal(errors[0].rule, 'yaml-syntax');
});
