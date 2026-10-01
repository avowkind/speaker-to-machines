/**
 * The logbook core: the only place domain rules live. Pure functions of the
 * framework, a logbook (or a snapshot) and today's date; no DOM, no storage.
 */
import { allSkills, skillByCode } from './framework.js';

/**
 * @typedef {import('./framework.js').Framework} Framework
 * @typedef {import('./url.js').Claim} Claim
 * @typedef {import('./url.js').Snapshot} Snapshot
 */

/**
 * Why a skill can't be claimed at a level, if it can't.
 * @param {Framework} fw
 * @param {string} code
 * @param {number} level
 * @returns {string | undefined}
 */
export function levelProblem(fw, code, level) {
  const skill = skillByCode(fw, code);
  if (!skill) return `${code} is not a skill in this framework`;
  const [lo, hi] = skill.level_range;
  if (!Number.isInteger(level) || level < lo || level > hi) {
    return `${code} has no level ${level} (its levels are ${lo}-${hi})`;
  }
  return undefined;
}

/**
 * Sort claims, or anything with a code, into framework order.
 * @template {{ code: string }} T
 * @param {Framework} fw
 * @param {T[]} items
 * @returns {T[]}
 */
export function inFrameworkOrder(fw, items) {
  const order = new Map(allSkills(fw).map((s, i) => [s.code, i]));
  const rank = (/** @type {string} */ code) => order.get(code) ?? Number.MAX_SAFE_INTEGER;
  return [...items].sort((a, b) => rank(a.code) - rank(b.code) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
}

/**
 * The snapshot with one skill claimed at a level, or its claim withdrawn when
 * level is null. A skill has at most one claim.
 * @param {Framework} fw
 * @param {Snapshot} snapshot
 * @param {string} code
 * @param {number | null} level
 * @returns {Snapshot}
 */
export function withClaim(fw, snapshot, code, level) {
  if (level !== null) {
    const problem = levelProblem(fw, code, level);
    if (problem) throw new Error(problem);
  }
  const others = snapshot.claims.filter((c) => c.code !== code);
  const claims = level === null ? others : [...others, { code, level }];
  return { ...snapshot, claims: inFrameworkOrder(fw, claims) };
}
