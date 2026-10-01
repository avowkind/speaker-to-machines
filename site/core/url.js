/**
 * The URL encoding of a snapshot or a target. A link carries a date (or a
 * target's name) and code-level pairs, never evidence (ADR 0002). A decoded
 * link is a plain snapshot or target.
 *
 *   snapshot  date=2026-09-30&claims=INST-4,AISD-5
 */
import { isDate } from './dates.js';
import { inFrameworkOrder, levelProblem } from './logbook.js';

/**
 * @typedef {{ code: string, level: number }} Claim
 * @typedef {{ date: string, claims: Claim[] }} Snapshot
 * @typedef {{ from: string, to: string }} MappedCode
 * @typedef {{ kind: 'none' }
 *   | { kind: 'invalid', problems: string[] }
 *   | { kind: 'snapshot', snapshot: Snapshot, mapped: MappedCode[], problems: string[] }} DecodedHash
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
  return { kind: 'none' };
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
  /** @type {Map<string, number>} */
  const levels = new Map();
  for (const pair of splitPairs(params.get('claims'))) {
    const m = /^([A-Z]{4})-([1-7])$/.exec(pair);
    if (!m) {
      problems.push(`"${pair}" is not a code-level pair`);
      continue;
    }
    const code = m[1];
    const level = Number(m[2]);
    const problem = levelProblem(fw, code, level);
    if (problem) problems.push(problem);
    else if (levels.has(code)) problems.push(`${code} is claimed more than once; the first claim is kept`);
    else levels.set(code, level);
  }
  const claims = inFrameworkOrder(fw, [...levels].map(([code, level]) => ({ code, level })));
  return { kind: 'snapshot', snapshot: { date, claims }, mapped: [], problems };
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
