/**
 * Copy the site's runtime dependencies from node_modules into site/vendor as
 * plain ES modules. The site has no bundler: index.html maps bare imports such
 * as "lit" and "yaml" to these copies with an import map. Run after changing a
 * dependency version, and commit the result.
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'site', 'vendor');

/** [package, directory within the package to copy] */
const PACKAGES = [
  ['lit', '.'],
  ['lit-html', '.'],
  ['lit-element', '.'],
  ['@lit/reactive-element', '.'],
  ['yaml', 'browser/dist'],
  ['@cfworker/json-schema', 'dist/esm'],
];
const SKIP_DIRS = new Set(['development', 'node', 'node_modules']);

rmSync(vendor, { recursive: true, force: true });
const versions = [];
for (const [pkg, dir] of PACKAGES) {
  const from = join(root, 'node_modules', pkg);
  const { version, license } = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8'));
  cpSync(join(from, dir), join(vendor, pkg), {
    recursive: true,
    filter: (src) => {
      const name = basename(src);
      if (SKIP_DIRS.has(name)) return false;
      if (/\.(map|ts)$/.test(name) || name === 'package.json' || name.endsWith('.md')) return false;
      return true;
    },
  });
  for (const f of ['LICENSE', 'LICENSE.md']) {
    if (existsSync(join(from, f))) cpSync(join(from, f), join(vendor, pkg, f));
  }
  versions.push(`${pkg} ${version} (${license})`);
}
writeFileSync(join(vendor, 'VERSIONS.txt'), versions.join('\n') + '\n');
console.log(versions.join('\n'));
