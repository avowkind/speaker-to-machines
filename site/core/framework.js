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

/**
 * @param {Record<string, any>} files parsed file contents keyed by path relative
 *   to the data directory: levels.yaml, taxonomy.yaml, examples.yaml, skills/CODE.yaml
 * @returns {LoadResult}
 */
export function loadFramework(files) {
  /** @type {FrameworkError[]} */
  const errors = [];
  const levelsFile = files['levels.yaml'];
  const taxonomy = files['taxonomy.yaml'];
  const examples = files['examples.yaml'];
  const skillFiles = Object.keys(files)
    .filter((f) => f.startsWith('skills/'))
    .sort();

  for (const file of skillFiles) checkCoverage(file, files[file], errors);
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
      retired: (levelsFile.retired ?? []).map((/** @type {RetiredCode} */ r) => ({ ...r })),
      categories,
    },
  };
}

/**
 * @param {string} file
 * @param {any} skill
 * @param {FrameworkError[]} errors
 */
function checkCoverage(file, skill, errors) {
  const [lo, hi] = skill.level_range;
  const described = new Set(Object.keys(skill.levels ?? {}).map(Number));
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
