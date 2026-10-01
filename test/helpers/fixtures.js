import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../fixtures/framework/', import.meta.url).pathname;

/**
 * Copy the base framework fixture to a temporary directory and lay the named
 * fixture's files over it, so each fixture holds only what it breaks.
 * @param {string} [name]
 */
export function fixtureDir(name) {
  const dir = mkdtempSync(join(tmpdir(), 'stm-fixture-'));
  cpSync(join(root, 'base'), dir, { recursive: true });
  if (name) cpSync(join(root, name), dir, { recursive: true });
  return dir;
}
