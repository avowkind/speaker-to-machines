/**
 * The URL encoding of a snapshot or a target. A link carries a date (or a
 * target's name) and code-level pairs, never evidence (ADR 0002). A decoded
 * link is a plain snapshot or target.
 *
 *   snapshot  date=2026-09-30&claims=INST-4,AISD-5
 *   target    target=Senior%20engineer&levels=INST-4!,AISD-3   ("!" marks essential)
 */
import { isDate } from './dates.js';
import { currentCode, inFrameworkOrder, levelProblem } from './logbook.js';

/**
 * @typedef {{ code: string, level: number }} Claim
 * @typedef {{ date: string, claims: Claim[] }} Snapshot
 * @typedef {{ from: string, to: string }} MappedCode
 * @typedef {{ kind: 'none' }
 *   | { kind: 'invalid', problems: string[] }
 *   | { kind: 'snapshot', snapshot: Snapshot, mapped: MappedCode[], problems: string[] }
 *   | { kind: 'target', target: import('./logbook.js').Target, mapped: MappedCode[], problems: string[] }} DecodedHash
 */

/**
 * @param {Snapshot} snapshot
 * @returns {string} the hash, without the leading "#"
 */
export function encodeSnapshot(snapshot) {
  const pairs = snapshot.claims.map((c) => `${c.code}-${c.level}`).join(',');
  return `date=${snapshot.date}&claims=${pairs}`;
}

/**
 * @param {string} hash the location hash, with or without its leading "#"
 * @param {import('./framework.js').Framework} fw
 * @returns {DecodedHash}
 */
export function decodeHash(hash, fw) {
  const params = parseParams(hash.replace(/^#/, ''));
  if (params.has('date')) return decodeSnapshot(params, fw);
  if (params.has('target')) return decodeTarget(params, fw);
  return { kind: 'none' };
}

/**
 * @param {import('./logbook.js').Target} target
 * @returns {string} the hash, without the leading "#"
 */
export function encodeTarget(target) {
  const pairs = target.levels.map((l) => `${l.code}-${l.level}${l.priority === 'essential' ? '!' : ''}`).join(',');
  return `target=${encodeURIComponent(target.name)}&levels=${pairs}`;
}

/**
 * @param {Map<string, string>} params
 * @param {import('./framework.js').Framework} fw
 * @returns {DecodedHash}
 */
function decodeTarget(params, fw) {
  const name = (params.get('target') ?? '').trim();
  if (!name) return { kind: 'invalid', problems: ['a target link needs a name'] };
  /** @type {string[]} */
  const problems = [];
  /** @type {MappedCode[]} */
  const mapped = [];
  /** @type {Map<string, import('./logbook.js').TargetLevel>} */
  const levels = new Map();
  for (const pair of splitPairs(params.get('levels'))) {
    const m = /^([A-Z]{4})-([1-7])(!?)$/.exec(pair);
    if (!m) {
      problems.push(`"${pair}" is not a code-level pair`);
      continue;
    }
    const code = mapCode(fw, m[1], mapped);
    const level = Number(m[2]);
    const problem = levelProblem(fw, code, level);
    if (problem) problems.push(problem);
    else if (levels.has(code)) problems.push(`${code} is given more than once; the first is kept`);
    else levels.set(code, { code, level, priority: m[3] ? 'essential' : 'desirable' });
  }
  return { kind: 'target', target: { name, levels: inFrameworkOrder(fw, [...levels.values()]) }, mapped, problems };
}

/**
 * A retired code's replacement (ADR 0004), recording the mapping once.
 * @param {import('./framework.js').Framework} fw
 * @param {string} code
 * @param {MappedCode[]} mapped
 */
function mapCode(fw, code, mapped) {
  const to = currentCode(fw, code);
  if (to !== code && !mapped.some((m) => m.from === code)) mapped.push({ from: code, to });
  return to;
}

/**
 * @param {Map<string, string>} params
 * @param {import('./framework.js').Framework} fw
 * @returns {DecodedHash}
 */
function decodeSnapshot(params, fw) {
  const date = params.get('date') ?? '';
  if (!isDate(date)) return { kind: 'invalid', problems: [`"${date}" is not a date (YYYY-MM or YYYY-MM-DD)`] };
  /** @type {string[]} */
  const problems = [];
  /** @type {MappedCode[]} */
  const mapped = [];
  /** @type {Map<string, number>} */
  const levels = new Map();
  for (const pair of splitPairs(params.get('claims'))) {
    const m = /^([A-Z]{4})-([1-7])$/.exec(pair);
    if (!m) {
      problems.push(`"${pair}" is not a code-level pair`);
      continue;
    }
    const code = mapCode(fw, m[1], mapped);
    const level = Number(m[2]);
    const problem = levelProblem(fw, code, level);
    if (problem) problems.push(problem);
    else if (levels.has(code)) problems.push(`${code} is claimed more than once; the first claim is kept`);
    else levels.set(code, level);
  }
  const claims = inFrameworkOrder(fw, [...levels].map(([code, level]) => ({ code, level })));
  return { kind: 'snapshot', snapshot: { date, claims }, mapped, problems };
}

/** @param {string | undefined} s */
function splitPairs(s) {
  return (s ?? '').split(',').filter(Boolean);
}

/** @param {string} s */
function parseParams(s) {
  /** @type {Map<string, string>} */
  const params = new Map();
  for (const part of s.split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const key = i < 0 ? part : part.slice(0, i);
    const value = i < 0 ? '' : part.slice(i + 1);
    params.set(decodeComponent(key), decodeComponent(value));
  }
  return params;
}

/** @param {string} s */
function decodeComponent(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
