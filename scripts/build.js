/**
 * The framework build. Validates the YAML files in data/, then writes the site
 * bundle and regenerates the review document.
 *
 *   node scripts/build.js             validate, write bundle and review document
 *   node scripts/build.js --validate  validate only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { loadFramework } from '../site/core/framework.js';
import { renderReview } from './review.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Read and parse every framework file under a data directory.
 * @param {string} dataDir
 * @returns {{ files: Record<string, any>, errors: import('../site/core/framework.js').FrameworkError[] }}
 */
export function readFrameworkFiles(dataDir) {
  /** @type {Record<string, any>} */
  const files = {};
  /** @type {import('../site/core/framework.js').FrameworkError[]} */
  const errors = [];
  const names = [
    'levels.yaml',
    'taxonomy.yaml',
    'examples.yaml',
    'sfia-codes.yaml',
    ...(existsSync(join(dataDir, 'skills')) ? readdirSync(join(dataDir, 'skills')) : [])
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => `skills/${f}`),
  ];
  for (const name of names) {
    if (!existsSync(join(dataDir, name))) continue; // reported by the framework module
    try {
      files[name] = parse(readFileSync(join(dataDir, name), 'utf8'));
    } catch (e) {
      errors.push({ file: name, path: '', rule: 'yaml-syntax', message: /** @type {Error} */ (e).message });
    }
  }
  return { files, errors };
}

/**
 * @param {{ dataDir?: string, bundlePath?: string, reviewPath?: string, validateOnly?: boolean }} [options]
 */
export function build({
  dataDir = join(root, 'data'),
  bundlePath = join(root, 'site', 'framework.json'),
  reviewPath = join(root, 'docs', 'skills-review.md'),
  validateOnly = false,
} = {}) {
  const read = readFrameworkFiles(dataDir);
  if (read.errors.length) return { errors: read.errors, framework: undefined };
  const result = loadFramework(read.files);
  if (!result.ok) return { errors: result.errors, framework: undefined };
  if (!validateOnly) {
    mkdirSync(dirname(bundlePath), { recursive: true });
    writeFileSync(bundlePath, JSON.stringify(result.framework, null, 2) + '\n');
    writeFileSync(reviewPath, renderReview(result.framework));
  }
  return { errors: [], framework: result.framework };
}

/** @param {import('../site/core/framework.js').FrameworkError} e */
export function formatError(e) {
  return `data/${e.file}: ${e.path || '(file)'}: ${e.rule}: ${e.message}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const validateOnly = process.argv.includes('--validate');
  const { errors, framework } = build({ validateOnly });
  if (errors.length) {
    for (const e of errors) console.error(formatError(e));
    console.error(`${errors.length} error${errors.length === 1 ? '' : 's'}`);
    process.exit(1);
  }
  const count = framework?.categories.flatMap((c) => c.subcategories).flatMap((s) => s.skills).length;
  console.log(validateOnly ? `${count} skills valid` : `${count} skills built`);
}
