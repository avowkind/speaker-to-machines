/**
 * The framework module: turns parsed framework files into a framework, or a
 * list of errors. Pure: no file system, no DOM. Shared by the build and the site.
 */

/**
 * @typedef {{ file: string, path: string, rule: string, message: string }} FrameworkError
 * @typedef {{ level: number, name: string, title: string, mode: string, description: string, evidence: string }} Level
 * @typedef {{ code: string, replaced_by: string }} RetiredCode
 * @typedef {{
 *   code: string, name: string, category: string, subcategory: string, description: string,
 *   level_range: [number, number], levels: Record<string, string>,
 *   examples: { as_of: string, items: string[] },
 *   map: { sfia: string[], appliedai: string[] }, url: string
 * }} Skill
 * @typedef {{ name: string, skills: Skill[] }} Subcategory
 * @typedef {{ name: string, subcategories: Subcategory[] }} Category
 * @typedef {{
 *   framework: { name: string, subtitle: string, version: string, licence: string, title_note: string },
 *   levels: Level[], retired: RetiredCode[], categories: Category[]
 * }} Framework
 * @typedef {{ ok: true, framework: Framework } | { ok: false, errors: FrameworkError[] }} LoadResult
 */

import { validateSchema } from './schema.js';
import levelsSchema from '../schemas/levels.schema.json' with { type: 'json' };
import taxonomySchema from '../schemas/taxonomy.schema.json' with { type: 'json' };
import examplesSchema from '../schemas/examples.schema.json' with { type: 'json' };
import skillSchema from '../schemas/skill.schema.json' with { type: 'json' };
import sfiaCodesSchema from '../schemas/sfia-codes.schema.json' with { type: 'json' };

const SCHEMAS = {
  'levels.yaml': levelsSchema,
  'taxonomy.yaml': taxonomySchema,
  'examples.yaml': examplesSchema,
  'sfia-codes.yaml': sfiaCodesSchema,
};
const REQUIRED_FILES = Object.keys(SCHEMAS);
const CODE = /^[A-Z]{4}$/;

/**
 * @param {Record<string, any>} files parsed file contents keyed by path relative
 *   to the data directory: levels.yaml, taxonomy.yaml, examples.yaml,
 *   sfia-codes.yaml and skills/CODE.yaml
 * @returns {LoadResult}
 */
export function loadFramework(files) {
  /** @type {FrameworkError[]} */
  const errors = [];
  const skillFiles = Object.keys(files)
    .filter((f) => f.startsWith('skills/'))
    .sort();

  for (const file of REQUIRED_FILES) {
    if (!(file in files)) {
      errors.push({ file, path: '', rule: 'file-exists', message: `${file} is missing` });
    } else {
      checkSchema(file, files[file], SCHEMAS[/** @type {keyof SCHEMAS} */ (file)], errors);
    }
  }
  for (const file of skillFiles) checkSchema(file, files[file], skillSchema, errors);
  if (errors.length) return { ok: false, errors };

  const levelsFile = files['levels.yaml'];
  const taxonomy = files['taxonomy.yaml'];
  const examples = files['examples.yaml'];
  for (const file of skillFiles) checkCoverage(file, files[file], errors);
  checkCodes(files, skillFiles, errors);
  checkTaxonomy(files, skillFiles, errors);
  checkExamples(files, skillFiles, errors);
  checkProductNames(files, skillFiles, errors);
  if (errors.length) return { ok: false, errors };

  /** @type {Category[]} */
  const categories = taxonomy.categories.map((/** @type {any} */ c) => ({
    name: c.name,
    subcategories: c.subcategories.map((/** @type {any} */ s) => ({ name: s.name, skills: [] })),
  }));
  const sorted = skillFiles
    .map((f) => files[f])
    .sort((a, b) => a.order - b.order || (a.code < b.code ? -1 : 1));
  for (const s of sorted) {
    const sub = categories
      .find((c) => c.name === s.category)
      ?.subcategories.find((x) => x.name === s.subcategory);
    sub?.skills.push(toSkill(s, examples));
  }

  return {
    ok: true,
    framework: {
      framework: { ...levelsFile.framework },
      levels: levelsFile.levels.map((/** @type {Level} */ l) => ({ ...l })),
      retired: levelsFile.retired.map((/** @type {RetiredCode} */ r) => ({ ...r })),
      categories,
    },
  };
}

/**
 * @param {string} file
 * @param {unknown} data
 * @param {object} schema
 * @param {FrameworkError[]} errors
 */
function checkSchema(file, data, schema, errors) {
  for (const e of validateSchema(schema, data)) {
    errors.push({ file, path: e.path, rule: 'schema', message: e.message });
  }
}

/**
 * @param {string} file
 * @param {any} skill
 * @param {FrameworkError[]} errors
 */
function checkCoverage(file, skill, errors) {
  const [lo, hi] = skill.level_range;
  if (lo > hi) {
    errors.push({ file, path: 'level_range', rule: 'descriptors-cover-range', message: `level_range ${lo}-${hi} runs backwards` });
    return;
  }
  const described = new Set(Object.keys(skill.levels).map(Number));
  for (let l = lo; l <= hi; l++) {
    if (!described.has(l)) {
      errors.push({
        file,
        path: 'levels',
        rule: 'descriptors-cover-range',
        message: `level_range is ${lo}-${hi} but level ${l} has no descriptor`,
      });
    }
  }
  for (const l of [...described].sort()) {
    if (l < lo || l > hi) {
      errors.push({
        file,
        path: `levels.${l}`,
        rule: 'descriptors-cover-range',
        message: `level ${l} has a descriptor but level_range is ${lo}-${hi}`,
      });
    }
  }
}

/**
 * Codes are four capital letters, unique, named after their file, clear of
 * SFIA codes, and never a retired code; every retired code has a live
 * replacement; every SFIA mapping names a real SFIA code.
 * @param {Record<string, any>} files
 * @param {string[]} skillFiles
 * @param {FrameworkError[]} errors
 */
function checkCodes(files, skillFiles, errors) {
  const sfia = new Set(files['sfia-codes.yaml'].codes);
  /** @type {Map<string, string>} code to the first file using it */
  const owner = new Map();
  for (const file of skillFiles) {
    const { code } = files[file];
    if (!CODE.test(code)) {
      errors.push({ file, path: 'code', rule: 'code-format', message: `code "${code}" must be four capital letters` });
    }
    const base = file.slice('skills/'.length);
    if (CODE.test(code) && base !== `${code}.yaml`) {
      errors.push({ file, path: 'code', rule: 'code-matches-file', message: `code "${code}" does not match the file name ${base}` });
    }
    const first = owner.get(code);
    if (first) {
      errors.push({ file, path: 'code', rule: 'code-unique', message: `code "${code}" is also used by ${first}` });
    } else {
      owner.set(code, file);
    }
    if (sfia.has(code)) {
      errors.push({ file, path: 'code', rule: 'no-sfia-collision', message: `code "${code}" is an SFIA 7–9 skill code` });
    }
    files[file].map.sfia.forEach((/** @type {string} */ ref, /** @type {number} */ i) => {
      if (!sfia.has(ref)) {
        errors.push({ file, path: `map.sfia.${i}`, rule: 'sfia-reference-exists', message: `"${ref}" is not an SFIA 7–9 skill code` });
      }
    });
  }
  files['levels.yaml'].retired.forEach((/** @type {RetiredCode} */ r, /** @type {number} */ i) => {
    const user = owner.get(r.code);
    if (user) {
      errors.push({
        file: 'levels.yaml',
        path: `retired.${i}.code`,
        rule: 'retired-code-not-reused',
        message: `retired code "${r.code}" is used by ${user}; retired codes are never reused`,
      });
    }
    if (!owner.has(r.replaced_by)) {
      errors.push({
        file: 'levels.yaml',
        path: `retired.${i}.replaced_by`,
        rule: 'replacement-exists',
        message: `retired code "${r.code}" is replaced by "${r.replaced_by}", which is not a current skill`,
      });
    }
  });
}

/**
 * @param {Record<string, any>} files
 * @param {string[]} skillFiles
 * @param {FrameworkError[]} errors
 */
function checkTaxonomy(files, skillFiles, errors) {
  const categories = new Map(
    files['taxonomy.yaml'].categories.map((/** @type {any} */ c) => [
      c.name,
      new Set(c.subcategories.map((/** @type {any} */ s) => s.name)),
    ]),
  );
  for (const file of skillFiles) {
    const { category, subcategory } = files[file];
    const subs = categories.get(category);
    if (!subs) {
      errors.push({ file, path: 'category', rule: 'category-in-taxonomy', message: `category "${category}" is not in taxonomy.yaml` });
    } else if (!subs.has(subcategory)) {
      errors.push({
        file,
        path: 'subcategory',
        rule: 'subcategory-in-taxonomy',
        message: `subcategory "${subcategory}" is not in category "${category}" in taxonomy.yaml`,
      });
    }
  }
}

/**
 * @param {Record<string, any>} files
 * @param {string[]} skillFiles
 * @param {FrameworkError[]} errors
 */
function checkExamples(files, skillFiles, errors) {
  const codes = new Set(skillFiles.map((f) => files[f].code));
  for (const code of Object.keys(files['examples.yaml'].items)) {
    if (!codes.has(code)) {
      errors.push({
        file: 'examples.yaml',
        path: `items.${code}`,
        rule: 'examples-code-exists',
        message: `examples are given for "${code}", which is not a current skill`,
      });
    }
  }
}

/**
 * No skill description or descriptor may name a product from the examples
 * layer (case-insensitive, whole word), unless it is listed as a generic term.
 * @param {Record<string, any>} files
 * @param {string[]} skillFiles
 * @param {FrameworkError[]} errors
 */
function checkProductNames(files, skillFiles, errors) {
  const examples = files['examples.yaml'];
  const generic = new Set((examples.generic_terms ?? []).map((/** @type {string} */ t) => t.toLowerCase()));
  /** @type {Map<string, string>} lower-cased name to the name as written */
  const products = new Map();
  for (const items of Object.values(examples.items)) {
    for (const item of /** @type {string[]} */ (items)) {
      if (!generic.has(item.toLowerCase()) && !products.has(item.toLowerCase())) products.set(item.toLowerCase(), item);
    }
  }
  const patterns = [...products.values()].map((name) => ({
    name,
    re: new RegExp(`(?<![\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu'),
  }));
  for (const file of skillFiles) {
    const skill = files[file];
    const texts = [['description', skill.description], ...Object.entries(skill.levels).map(([k, v]) => [`levels.${k}`, v])];
    for (const [path, text] of texts) {
      for (const { name, re } of patterns) {
        if (re.test(text)) {
          errors.push({ file, path, rule: 'no-product-names', message: `names "${name}" from the examples layer; put products in examples.yaml` });
        }
      }
    }
  }
}

/**
 * @param {any} s a parsed skill file
 * @param {any} examples the parsed examples file
 * @returns {Skill}
 */
function toSkill(s, examples) {
  return {
    code: s.code,
    name: s.name,
    category: s.category,
    subcategory: s.subcategory,
    description: s.description,
    level_range: [s.level_range[0], s.level_range[1]],
    levels: Object.fromEntries(
      Object.entries(s.levels).sort(([a], [b]) => Number(a) - Number(b)),
    ),
    examples: { as_of: examples.as_of, items: [...(examples.items?.[s.code] ?? [])] },
    map: { sfia: [...s.map.sfia], appliedai: [...s.map.appliedai] },
    url: `#/skill/${s.code}`,
  };
}

/**
 * Every skill in taxonomy order.
 * @param {Framework} fw
 * @returns {Skill[]}
 */
export function allSkills(fw) {
  return fw.categories.flatMap((c) => c.subcategories.flatMap((s) => s.skills));
}

/**
 * @param {Framework} fw
 * @param {string} code
 * @returns {Skill | undefined}
 */
export function skillByCode(fw, code) {
  return allSkills(fw).find((s) => s.code === code);
}

/**
 * @param {Framework} fw
 * @param {number} level
 * @returns {Level | undefined}
 */
export function levelInfo(fw, level) {
  return fw.levels.find((l) => l.level === level);
}
