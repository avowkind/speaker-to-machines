/**
 * Files a person holds: the logbook file, and later targets and profiles, as
 * YAML. Dates and codes (and every other string) are written quoted, so that
 * no YAML parser reads 2026-09 as a date or a code such as TRUE as a boolean
 * (ADR 0005). Imports are checked against the schema and the framework, with
 * readable errors, and never half-applied.
 */
import { parse, stringify } from 'yaml';
import { validateSchema } from './schema.js';
import { isDate, compareDates } from './dates.js';
import { LOGBOOK_SCHEMA, currentCode, inFrameworkOrder, levelProblem } from './logbook.js';
import { skillByCode } from './framework.js';
import { safeLink } from './links.js';
import logbookSchema from '../schemas/logbook.schema.json' with { type: 'json' };
import targetSchema from '../schemas/target.schema.json' with { type: 'json' };

/**
 * @typedef {import('./framework.js').Framework} Framework
 * @typedef {import('./logbook.js').Logbook} Logbook
 * @typedef {import('./url.js').MappedCode} MappedCode
 * @typedef {{ ok: true, logbook: Logbook, mapped: MappedCode[] } | { ok: false, errors: string[] }} LogbookImport
 * @typedef {{ ok: true, target: import('./logbook.js').Target, mapped: MappedCode[] } | { ok: false, errors: string[] }} TargetImport
 */

export const TARGET_SCHEMA = 'stm-target/0.1';

/**
 * YAML with every string double-quoted and keys plain.
 * @param {unknown} data
 * @param {string} [comment] a comment for the top of the file
 */
export function toYaml(data, comment) {
  const body = stringify(data, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN', lineWidth: 0 });
  return comment ? `${comment.split('\n').map((l) => `# ${l}`.trimEnd()).join('\n')}\n${body}` : body;
}

/**
 * Parse YAML text as YAML 1.2.
 * @param {string} text
 * @returns {{ ok: true, data: any } | { ok: false, errors: string[] }}
 */
export function fromYaml(text) {
  try {
    return { ok: true, data: parse(text, { version: '1.2', prettyErrors: true }) };
  } catch (e) {
    return { ok: false, errors: [`The file is not valid YAML: ${/** @type {Error} */ (e).message.split('\n')[0]}`] };
  }
}

/**
 * The whole logbook as a logbook file.
 * @param {Logbook} lb
 * @returns {string}
 */
export function exportLogbook(lb) {
  return toYaml(
    {
      schema: lb.schema,
      person: lb.person,
      framework_version: lb.framework_version,
      evidence: lb.evidence,
      snapshots: lb.snapshots,
      targets: lb.targets,
      overrides: lb.overrides,
    },
    'Speaker-to-Machines logbook file. Dates and codes are quoted strings; keep them that way if you edit by hand.',
  );
}

/**
 * Read a logbook file. Retired codes in claims, targets and overrides are
 * mapped to their replacements; evidence keeps the codes it was logged under.
 * @param {Framework} fw
 * @param {string} text
 * @returns {LogbookImport}
 */
export function importLogbook(fw, text) {
  const parsed = fromYaml(text);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const schemaErrors = validateSchema(logbookSchema, data);
  if (schemaErrors.length) return { ok: false, errors: schemaErrors.map((e) => `${e.path || '(file)'}: ${e.message}`) };

  /** @type {MappedCode[]} */
  const mapped = [];
  const map = mapper(fw, mapped);
  /** @type {string[]} */
  const errors = [];
  const ids = new Set();
  data.evidence.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    if (!isDate(e.date)) errors.push(`evidence.${i}.date: "${e.date}" is not a date`);
    e.codes.forEach((/** @type {string} */ c, /** @type {number} */ j) => {
      if (!skillByCode(fw, currentCode(fw, c))) errors.push(`evidence.${i}.codes.${j}: ${c} is not a skill in this framework`);
    });
    if (!e.note.trim()) errors.push(`evidence.${i}.note: an evidence item needs a note saying what was done`);
    if (e.link !== undefined && !safeLink(e.link)) errors.push(`evidence.${i}.link: a link must be a web address starting http:// or https://`);
    if (ids.has(e.id)) errors.push(`evidence.${i}.id: ${e.id} is used by more than one evidence item`);
    ids.add(e.id);
  });

  const dates = new Set();
  const snapshots = data.snapshots.map((/** @type {any} */ s, /** @type {number} */ i) => {
    if (!isDate(s.date)) errors.push(`snapshots.${i}.date: "${s.date}" is not a date`);
    else if (dates.has(s.date)) errors.push(`snapshots.${i}.date: there is already a snapshot dated ${s.date}`);
    dates.add(s.date);
    return { date: s.date, claims: checkLevels(fw, s.claims, `snapshots.${i}.claims`, 'claimed more than once in this snapshot', map, errors) };
  });

  const names = new Set();
  const targets = (data.targets ?? []).map((/** @type {any} */ t, /** @type {number} */ i) => {
    if (names.has(t.name)) errors.push(`targets.${i}.name: there is already a target named "${t.name}"`);
    names.add(t.name);
    return { name: t.name, levels: checkLevels(fw, t.levels, `targets.${i}.levels`, 'given more than once in this target', map, errors) };
  });

  const overridden = new Set();
  const overrides = (data.overrides ?? []).map((/** @type {any} */ o, /** @type {number} */ i) => {
    const code = map(o.code);
    if (!skillByCode(fw, code)) errors.push(`overrides.${i}.code: ${o.code} is not a skill in this framework`);
    if (overridden.has(code)) errors.push(`overrides.${i}.code: ${o.code} is overridden more than once`);
    overridden.add(code);
    for (const f of ['first_used', 'last_practised']) {
      if (o[f] !== undefined && !isDate(o[f])) errors.push(`overrides.${i}.${f}: "${o[f]}" is not a date`);
    }
    return { ...o, code };
  });
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    logbook: {
      schema: LOGBOOK_SCHEMA,
      person: data.person ?? '',
      framework_version: data.framework_version,
      evidence: data.evidence,
      snapshots: snapshots.sort((/** @type {any} */ a, /** @type {any} */ b) => compareDates(a.date, b.date)),
      targets,
      overrides: inFrameworkOrder(fw, overrides),
    },
    mapped,
  };
}

/**
 * The profile as YAML, for agents or a person's own repository.
 * @param {import('./logbook.js').Profile} profile
 * @returns {string}
 */
export function exportProfile(profile) {
  return toYaml(
    profile,
    `${profile.framework.name} profile${profile.person ? ` of ${profile.person}` : ''}, as of ${profile.as_of}.\nClaims are self-assessed; each badge cites the evidence it rests on.`,
  );
}

/**
 * A target (a role template or a personal goal) as a target file.
 * @param {import('./logbook.js').Target} target
 * @returns {string}
 */
export function exportTarget(target) {
  return toYaml(
    { schema: TARGET_SCHEMA, name: target.name, levels: target.levels },
    'Speaker-to-Machines target file: target levels, each essential or desirable.',
  );
}

/**
 * Read a target file, mapping retired codes to their replacements.
 * @param {Framework} fw
 * @param {string} text
 * @returns {TargetImport}
 */
export function importTarget(fw, text) {
  const parsed = fromYaml(text);
  if (!parsed.ok) return parsed;
  const schemaErrors = validateSchema(targetSchema, parsed.data);
  if (schemaErrors.length) return { ok: false, errors: schemaErrors.map((e) => `${e.path || '(file)'}: ${e.message}`) };
  /** @type {MappedCode[]} */
  const mapped = [];
  /** @type {string[]} */
  const errors = [];
  const levels = checkLevels(fw, /** @type {import('./logbook.js').TargetLevel[]} */ (parsed.data.levels), 'levels', 'given more than once in this target', mapper(fw, mapped), errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, target: { name: parsed.data.name, levels }, mapped };
}

/**
 * A function mapping retired codes to current ones, recording each mapping once.
 * @param {Framework} fw
 * @param {MappedCode[]} mapped
 */
function mapper(fw, mapped) {
  return (/** @type {string} */ code) => {
    const to = currentCode(fw, code);
    if (to !== code && !mapped.some((m) => m.from === code)) mapped.push({ from: code, to });
    return to;
  };
}

/**
 * Map retired codes in a list of claims or target levels, and check each
 * against the framework.
 * @template {{ code: string, level: number }} T
 * @param {Framework} fw
 * @param {T[]} items
 * @param {string} path
 * @param {string} duplicate how to describe a repeated code
 * @param {(code: string) => string} map
 * @param {string[]} errors
 * @returns {T[]}
 */
function checkLevels(fw, items, path, duplicate, map, errors) {
  const seen = new Set();
  const out = items.map((item, j) => {
    const code = map(item.code);
    const problem = levelProblem(fw, code, item.level);
    if (problem) errors.push(`${path}.${j}: ${problem}`);
    else if (seen.has(code)) errors.push(`${path}.${j}: ${code} is ${duplicate}`);
    seen.add(code);
    return { ...item, code };
  });
  return inFrameworkOrder(fw, out);
}
