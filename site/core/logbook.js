/**
 * The logbook core: the only place domain rules live. Pure functions of the
 * framework, a logbook (or a snapshot) and today's date; no DOM, no storage.
 */
import { allSkills, levelInfo, skillByCode } from './framework.js';
import { addMonths, compareDates, isDate } from './dates.js';
import { safeLink } from './links.js';

export const LOGBOOK_SCHEMA = 'stm-logbook/0.1';
export const EVIDENCE_TYPES = /** @type {const} */ (['learned', 'used', 'built', 'taught', 'published']);

/**
 * @typedef {import('./framework.js').Framework} Framework
 * @typedef {import('./url.js').Claim} Claim
 * @typedef {import('./url.js').Snapshot} Snapshot
 * @typedef {typeof EVIDENCE_TYPES[number]} EvidenceType
 * @typedef {{ date: string, codes: string[], type: EvidenceType, note: string, link?: string, tools?: string[] }} EvidenceInput
 * @typedef {EvidenceInput & { id: string }} EvidenceItem
 * @typedef {'essential' | 'desirable'} Priority
 * @typedef {{ code: string, level: number, priority: Priority }} TargetLevel
 * @typedef {{ name: string, levels: TargetLevel[] }} Target
 * @typedef {{ code: string, first_used?: string, last_practised?: string }} Override
 * @typedef {{
 *   schema: string, person: string, framework_version: string,
 *   evidence: EvidenceItem[], snapshots: Snapshot[], targets: Target[], overrides: Override[]
 * }} Logbook
 * @typedef {{ code?: string, type?: EvidenceType, from?: string, to?: string }} EvidenceFilter
 * @typedef {{ first_used: string | null, last_practised: string | null,
 *   overridden: { first_used: boolean, last_practised: boolean } }} PracticeDates
 * @typedef {{ level: number, title: string, name: string, evidence: EvidenceItem[] }} Badge
 * @typedef {{ code: string, level: number, badge: Badge | null, unevidenced: number[],
 *   last_practised: string | null, stale: boolean }} ClaimStatus
 * @typedef {{ date: string, level: number | null, badge: number | null, stale: boolean }} HistoryEntry
 * @typedef {{ code: string, entries: HistoryEntry[] }} SkillHistory
 * @typedef {{ code: string, target: number, priority: Priority, claim: number, size: number }} Gap
 * @typedef {{ code: string, target: number, priority: Priority, claim: number, badge: number | null }} EvidenceGap
 * @typedef {{ date: string, type: EvidenceType, note: string, link?: string, tools?: string[] }} CitedEvidence
 * @typedef {{
 *   code: string, name: string, category: string, subcategory: string,
 *   claim: { level: number, name: string, title: string, descriptor: string },
 *   badge: { level: number, name: string, title: string, evidence: CitedEvidence[] } | null,
 *   unevidenced: number[], first_used: string | null, last_practised: string | null, stale: boolean,
 *   changes: Array<{ date: string, level: number, name: string, title: string }>
 * }} ProfileSkill
 * @typedef {{
 *   schema: string, person: string, as_of: string,
 *   framework: { name: string, version: string }, skills: ProfileSkill[]
 * }} Profile
 */

export const PROFILE_SCHEMA = 'stm-profile/0.1';

/** A claim is stale when its skill was last practised more than this many months before the snapshot. */
export const STALE_AFTER_MONTHS = 12;

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

/**
 * The code a skill goes by now: a retired code maps to its replacement (ADR 0004).
 * @param {Framework} fw
 * @param {string} code
 * @returns {string}
 */
export function currentCode(fw, code) {
  const seen = new Set();
  let c = code;
  while (!seen.has(c)) {
    seen.add(c);
    const r = fw.retired.find((x) => x.code === c);
    if (!r) return c;
    c = r.replaced_by;
  }
  return c;
}

/**
 * Start a logbook from quick claims, which become its first snapshot.
 * @param {Framework} fw
 * @param {Snapshot} quick
 * @param {{ person?: string }} [options]
 * @returns {Logbook}
 */
export function startLogbook(fw, quick, { person = '' } = {}) {
  return {
    schema: LOGBOOK_SCHEMA,
    person,
    framework_version: fw.framework.version,
    evidence: [],
    snapshots: [{ date: quick.date, claims: inFrameworkOrder(fw, quick.claims.map((c) => ({ ...c }))) }],
    targets: [],
    overrides: [],
  };
}

/**
 * What is wrong with an evidence item, if anything.
 * @param {Framework} fw
 * @param {EvidenceInput} item
 * @returns {string[]}
 */
export function evidenceProblems(fw, item) {
  /** @type {string[]} */
  const problems = [];
  if (!item.date) problems.push('an evidence item needs a date');
  else if (!isDate(item.date)) problems.push(`"${item.date}" is not a date (YYYY-MM or YYYY-MM-DD)`);
  if (!item.codes?.length) problems.push('an evidence item needs at least one skill');
  for (const code of item.codes ?? []) {
    if (!skillByCode(fw, currentCode(fw, code))) problems.push(`${code} is not a skill in this framework`);
  }
  if (!EVIDENCE_TYPES.includes(item.type)) problems.push(`type must be one of ${EVIDENCE_TYPES.join(', ')}`);
  if (!item.note?.trim()) problems.push('an evidence item needs a note saying what was done');
  if (item.link?.trim() && !safeLink(item.link.trim())) problems.push('a link must be a web address starting http:// or https://');
  return problems;
}

/**
 * @param {Framework} fw
 * @param {EvidenceInput} item
 * @param {string} id
 * @returns {EvidenceItem}
 */
function toEvidenceItem(fw, item, id) {
  const problems = evidenceProblems(fw, item);
  if (problems.length) throw new Error(problems.join('; '));
  /** @type {EvidenceItem} */
  const out = { id, date: item.date, codes: [...new Set(item.codes)], type: item.type, note: item.note.trim() };
  if (item.link?.trim()) out.link = item.link.trim();
  const tools = (item.tools ?? []).map((t) => t.trim()).filter(Boolean);
  if (tools.length) out.tools = [...new Set(tools)];
  return out;
}

/**
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {EvidenceInput} item
 * @returns {Logbook}
 */
export function addEvidence(fw, lb, item) {
  const next = 1 + Math.max(0, ...lb.evidence.map((e) => Number(/^e(\d+)$/.exec(e.id)?.[1] ?? 0)));
  return { ...lb, evidence: [...lb.evidence, toEvidenceItem(fw, item, `e${next}`)] };
}

/**
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {string} id
 * @param {EvidenceInput} item
 * @returns {Logbook}
 */
export function updateEvidence(fw, lb, id, item) {
  if (!lb.evidence.some((e) => e.id === id)) throw new Error(`there is no evidence item ${id}`);
  return { ...lb, evidence: lb.evidence.map((e) => (e.id === id ? toEvidenceItem(fw, item, id) : e)) };
}

/**
 * @param {Logbook} lb
 * @param {string} id
 * @returns {Logbook}
 */
export function deleteEvidence(lb, id) {
  return { ...lb, evidence: lb.evidence.filter((e) => e.id !== id) };
}

/**
 * Evidence that counts for a skill: items tagged with its code, or with a
 * retired code it replaced. Items keep the codes they were logged under.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {string} code
 * @param {string} [asOf] only items dated on or before this date
 */
export function evidenceFor(fw, lb, code, asOf) {
  return lb.evidence.filter(
    (e) =>
      e.codes.some((c) => currentCode(fw, c) === code) && (asOf === undefined || compareDates(e.date, asOf) <= 0),
  );
}

/**
 * The evidence log, newest first, filtered by skill, type and date range (inclusive).
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {EvidenceFilter} filter
 * @returns {EvidenceItem[]}
 */
export function filterEvidence(fw, lb, { code, type, from, to }) {
  return lb.evidence
    .filter(
      (e) =>
        (!code || e.codes.some((c) => currentCode(fw, c) === code)) &&
        (!type || e.type === type) &&
        (!from || compareDates(e.date, from) >= 0) &&
        (!to || compareDates(e.date, to) <= 0),
    )
    .map((e, i) => /** @type {const} */ ([e, i]))
    .sort(([a, i], [b, j]) => compareDates(b.date, a.date) || j - i)
    .map(([e]) => e);
}

/**
 * First used and last practised for a skill: the earliest and latest evidence
 * of any type but learned, unless the person has overridden them.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {string} code
 * @param {string} [asOf] as things stood on this date
 * @returns {PracticeDates}
 */
export function practiceDates(fw, lb, code, asOf) {
  const practice = evidenceFor(fw, lb, code, asOf).filter((e) => e.type !== 'learned');
  /** @type {string | null} */
  let first = null;
  /** @type {string | null} */
  let last = null;
  for (const e of practice) {
    if (first === null || compareDates(e.date, first) < 0) first = e.date;
    if (last === null || compareDates(e.date, last) > 0) last = e.date;
  }
  const o = lb.overrides.find((x) => x.code === code);
  const usable = (/** @type {string | undefined} */ d) => d !== undefined && (asOf === undefined || compareDates(d, asOf) <= 0);
  const firstOverridden = usable(o?.first_used);
  const lastOverridden = usable(o?.last_practised);
  return {
    first_used: firstOverridden ? /** @type {string} */ (o?.first_used) : first,
    last_practised: lastOverridden ? /** @type {string} */ (o?.last_practised) : last,
    overridden: { first_used: firstOverridden, last_practised: lastOverridden },
  };
}

/**
 * Override first used or last practised for a skill. Pass null to clear an
 * override; leave a field out to keep it as it is.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {string} code
 * @param {{ first_used?: string | null, last_practised?: string | null }} change
 * @returns {Logbook}
 */
export function setOverride(fw, lb, code, change) {
  if (!skillByCode(fw, code)) throw new Error(`${code} is not a skill in this framework`);
  for (const d of [change.first_used, change.last_practised]) {
    if (d != null && !isDate(d)) throw new Error(`"${d}" is not a date (YYYY-MM or YYYY-MM-DD)`);
  }
  const old = lb.overrides.find((o) => o.code === code) ?? { code };
  /** @type {Override} */
  const next = { code };
  const first = change.first_used === undefined ? old.first_used : change.first_used;
  const last = change.last_practised === undefined ? old.last_practised : change.last_practised;
  if (first) next.first_used = first;
  if (last) next.last_practised = last;
  const others = lb.overrides.filter((o) => o.code !== code);
  const overrides = next.first_used || next.last_practised ? [...others, next] : others;
  return { ...lb, overrides: inFrameworkOrder(fw, overrides) };
}

/**
 * The most recent snapshot: the latest date, and of snapshots on the same
 * date, the last one made.
 * @param {Logbook} lb
 * @returns {Snapshot}
 */
export function latestSnapshot(lb) {
  if (!lb.snapshots.length) throw new Error('the logbook has no snapshots');
  return lb.snapshots.reduce((latest, s) => (compareDates(s.date, latest.date) >= 0 ? s : latest));
}

const PRACTICE = new Set(['used', 'built', 'taught', 'published']);
const BUILDING = new Set(['built', 'taught']);
const LEADING = new Set(['taught', 'published']);

/**
 * What evidence a level's badge needs, in words, for telling a person what to add.
 * @param {number} level
 * @returns {string}
 */
export function evidenceNeeded(level) {
  if (level === 1) return 'any evidence';
  if (level === 2) return 'used, built, taught or published evidence';
  if (level === 3) return 'used, built, taught or published evidence spanning at least three months';
  if (level <= 5) return 'built or taught evidence';
  return 'taught or published evidence';
}

/**
 * The evidence that meets a level's rule (ADR 0003), or none if the rule is
 * not met: any type at 1; used, built, taught or published at 2-3, spanning at
 * least three months at 3; built or taught at 4-5; taught or published at 6-7.
 * @param {number} level
 * @param {EvidenceItem[]} items evidence for the skill, already limited by date
 * @returns {EvidenceItem[]}
 */
function qualifying(level, items) {
  if (level === 1) return items;
  if (level === 2) return items.filter((e) => PRACTICE.has(e.type));
  if (level === 3) {
    const practice = items.filter((e) => PRACTICE.has(e.type));
    if (!practice.length) return [];
    const dates = practice.map((e) => e.date).sort(compareDates);
    const spans = compareDates(/** @type {string} */ (dates.at(-1)), addMonths(dates[0], 3)) >= 0;
    return spans ? practice : [];
  }
  if (level <= 5) return items.filter((e) => BUILDING.has(e.type));
  return items.filter((e) => LEADING.has(e.type));
}

/**
 * A claim's badge and unevidenced levels as of a date. The badge is at the
 * highest level, up to the claim and within the skill's range, whose rule is
 * met by evidence for the skill dated on or before that date.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {Claim} claim
 * @param {string} asOf usually the snapshot's date
 * @returns {ClaimStatus}
 */
export function claimStatus(fw, lb, claim, asOf) {
  const skill = skillByCode(fw, claim.code);
  const lo = skill ? skill.level_range[0] : 1;
  const items = evidenceFor(fw, lb, claim.code, asOf).sort((a, b) => compareDates(a.date, b.date));
  /** @type {Badge | null} */
  let badge = null;
  for (let level = claim.level; level >= lo; level--) {
    const evidence = qualifying(level, items);
    if (evidence.length) {
      const info = levelInfo(fw, level);
      badge = { level, title: info?.title ?? '', name: info?.name ?? '', evidence };
      break;
    }
  }
  const unevidenced = [];
  for (let level = badge ? badge.level + 1 : lo; level <= claim.level; level++) unevidenced.push(level);
  const { last_practised } = practiceDates(fw, lb, claim.code, asOf);
  const stale = last_practised !== null && compareDates(last_practised, addMonths(asOf, -STALE_AFTER_MONTHS)) < 0;
  return { code: claim.code, level: claim.level, badge, unevidenced, last_practised, stale };
}

/**
 * Every claim in a snapshot with its badge, as of the snapshot's date.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {Snapshot} snapshot
 * @returns {ClaimStatus[]}
 */
export function snapshotStatus(fw, lb, snapshot) {
  return snapshot.claims.map((c) => claimStatus(fw, lb, c, snapshot.date));
}

/**
 * Add a snapshot, such as one from a claims link, keeping snapshots in date
 * order. A logbook has one snapshot per date.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {Snapshot} snapshot
 * @returns {Logbook}
 */
export function addSnapshot(fw, lb, snapshot) {
  if (!isDate(snapshot.date)) throw new Error(`"${snapshot.date}" is not a date (YYYY-MM or YYYY-MM-DD)`);
  if (lb.snapshots.some((s) => s.date === snapshot.date)) {
    throw new Error(`there is already a snapshot dated ${snapshot.date}`);
  }
  const seen = new Set();
  for (const c of snapshot.claims) {
    const problem = levelProblem(fw, c.code, c.level);
    if (problem) throw new Error(problem);
    if (seen.has(c.code)) throw new Error(`${c.code} is claimed more than once`);
    seen.add(c.code);
  }
  const added = { date: snapshot.date, claims: inFrameworkOrder(fw, snapshot.claims.map((c) => ({ ...c }))) };
  const snapshots = [...lb.snapshots, added].sort((a, b) => compareDates(a.date, b.date));
  return { ...lb, snapshots };
}

/**
 * A snapshot's claims are fixed once its date has passed (CONTEXT.md): a
 * changed claim goes in a new snapshot.
 * @param {Snapshot} snapshot
 * @param {string} today
 */
export function isEditable(snapshot, today) {
  return compareDates(today, snapshot.date) <= 0;
}

/**
 * Make today's snapshot, starting as a copy of the latest one.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {string} today
 * @returns {Logbook}
 */
export function newSnapshot(fw, lb, today) {
  const claims = lb.snapshots.length ? latestSnapshot(lb).claims : [];
  return addSnapshot(fw, lb, { date: today, claims });
}

/**
 * Change one claim in a snapshot that is still open: claim a level, or
 * withdraw the claim with null.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {string} date the snapshot's date
 * @param {string} code
 * @param {number | null} level
 * @param {string} today
 * @returns {Logbook}
 */
export function setClaim(fw, lb, date, code, level, today) {
  const snapshot = lb.snapshots.find((s) => s.date === date);
  if (!snapshot) throw new Error(`there is no snapshot dated ${date}`);
  if (!isEditable(snapshot, today)) {
    throw new Error(`The snapshot of ${date} is fixed: make a new snapshot to change a claim.`);
  }
  const updated = withClaim(fw, snapshot, code, level);
  return { ...lb, snapshots: lb.snapshots.map((s) => (s === snapshot ? updated : s)) };
}

/**
 * @param {Logbook} lb
 * @param {string} date
 * @returns {Logbook}
 */
export function deleteSnapshot(lb, date) {
  if (!lb.snapshots.some((s) => s.date === date)) throw new Error(`there is no snapshot dated ${date}`);
  if (lb.snapshots.length === 1) throw new Error('a logbook keeps at least one snapshot');
  return { ...lb, snapshots: lb.snapshots.filter((s) => s.date !== date) };
}

/**
 * Each claimed skill's level, badge and staleness at every snapshot, in
 * framework order. A skill missing from a snapshot has no claim there.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @returns {SkillHistory[]}
 */
export function history(fw, lb) {
  const snapshots = [...lb.snapshots].sort((a, b) => compareDates(a.date, b.date));
  const codes = new Set(snapshots.flatMap((s) => s.claims.map((c) => c.code)));
  return inFrameworkOrder(fw, [...codes].map((code) => ({ code }))).map(({ code }) => ({
    code,
    entries: snapshots.map((s) => {
      const claim = s.claims.find((c) => c.code === code);
      if (!claim) return { date: s.date, level: null, badge: null, stale: false };
      const st = claimStatus(fw, lb, claim, s.date);
      return { date: s.date, level: claim.level, badge: st.badge?.level ?? null, stale: st.stale };
    }),
  }));
}

/**
 * The target with one skill's target level set, or removed when level is null.
 * @param {Framework} fw
 * @param {Target} target
 * @param {string} code
 * @param {number | null} level
 * @param {Priority} priority
 * @returns {Target}
 */
export function withTargetLevel(fw, target, code, level, priority) {
  if (level !== null) {
    const problem = levelProblem(fw, code, level);
    if (problem) throw new Error(problem);
  }
  const others = target.levels.filter((l) => l.code !== code);
  const levels = level === null ? others : [...others, { code, level, priority }];
  return { ...target, levels: inFrameworkOrder(fw, levels) };
}

/**
 * Keep a target in the logbook. Targets are known by name.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {Target} target
 * @returns {Logbook}
 */
export function addTarget(fw, lb, target) {
  const name = target.name.trim();
  if (!name) throw new Error('a target needs a name');
  if (lb.targets.some((t) => t.name === name)) throw new Error(`there is already a target named "${name}"`);
  const levels = target.levels.reduce((t, l) => withTargetLevel(fw, t, l.code, l.level, l.priority), { name, levels: /** @type {TargetLevel[]} */ ([]) }).levels;
  return { ...lb, targets: [...lb.targets, { name, levels }] };
}

/**
 * Replace a target in the logbook, for example after editing its levels.
 * @param {Logbook} lb
 * @param {string} name
 * @param {Target} target
 * @returns {Logbook}
 */
export function replaceTarget(lb, name, target) {
  if (!lb.targets.some((t) => t.name === name)) throw new Error(`there is no target named "${name}"`);
  if (target.name !== name && lb.targets.some((t) => t.name === target.name)) {
    throw new Error(`there is already a target named "${target.name}"`);
  }
  return { ...lb, targets: lb.targets.map((t) => (t.name === name ? target : t)) };
}

/**
 * @param {Logbook} lb
 * @param {string} name
 * @returns {Logbook}
 */
export function removeTarget(lb, name) {
  return { ...lb, targets: lb.targets.filter((t) => t.name !== name) };
}

const PRIORITY_RANK = { essential: 0, desirable: 1 };

/**
 * Compare the latest claims with a target. Gaps are target levels above the
 * claim (no claim counts as 0), ranked essential first and then by size.
 * Evidence gaps are where the claim meets the target but its badge does not,
 * listed separately: there evidence is missing, not learning.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @param {Target} target
 * @returns {{ gaps: Gap[], evidenceGaps: EvidenceGap[] }}
 */
export function findGaps(fw, lb, target) {
  const latest = latestSnapshot(lb);
  const order = new Map(allSkills(fw).map((s, i) => [s.code, i]));
  const byOrder = (/** @type {{ code: string }} */ a, /** @type {{ code: string }} */ b) => (order.get(a.code) ?? 0) - (order.get(b.code) ?? 0);
  /** @type {Gap[]} */
  const gaps = [];
  /** @type {EvidenceGap[]} */
  const evidenceGaps = [];
  for (const t of target.levels) {
    const claim = latest.claims.find((c) => c.code === t.code);
    const claimed = claim?.level ?? 0;
    if (claimed < t.level) {
      gaps.push({ code: t.code, target: t.level, priority: t.priority, claim: claimed, size: t.level - claimed });
    } else if (claim) {
      const badge = claimStatus(fw, lb, claim, latest.date).badge?.level ?? null;
      if ((badge ?? 0) < t.level) evidenceGaps.push({ code: t.code, target: t.level, priority: t.priority, claim: claimed, badge });
    }
  }
  gaps.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.size - a.size || byOrder(a, b));
  evidenceGaps.sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.target - (b.badge ?? 0) - (a.target - (a.badge ?? 0)) || byOrder(a, b),
  );
  return { gaps, evidenceGaps };
}

/**
 * The profile: for each skill claimed in the latest snapshot, the claim, its
 * badge and the evidence the badge rests on, staleness, and the earlier
 * snapshots where the level changed. Drives both the HTML and YAML profile.
 * @param {Framework} fw
 * @param {Logbook} lb
 * @returns {Profile}
 */
export function buildProfile(fw, lb) {
  const latest = latestSnapshot(lb);
  const past = history(fw, lb);
  const named = (/** @type {number} */ level) => {
    const info = levelInfo(fw, level);
    return { level, name: info?.name ?? '', title: info?.title ?? '' };
  };
  const skills = inFrameworkOrder(fw, latest.claims).map((claim) => {
    const skill = /** @type {import('./framework.js').Skill} */ (skillByCode(fw, claim.code));
    const st = claimStatus(fw, lb, claim, latest.date);
    const entries = (past.find((h) => h.code === claim.code)?.entries ?? []).filter((e) => compareDates(e.date, latest.date) < 0);
    /** @type {ProfileSkill['changes']} */
    const changes = [];
    entries.forEach((e, i) => {
      if (e.level !== null && e.level !== (entries[i - 1]?.level ?? null)) changes.push({ date: e.date, ...named(e.level) });
    });
    return {
      code: claim.code,
      name: skill.name,
      category: skill.category,
      subcategory: skill.subcategory,
      claim: { ...named(claim.level), descriptor: skill.levels[String(claim.level)] ?? '' },
      badge: st.badge
        ? {
            ...named(st.badge.level),
            evidence: st.badge.evidence.map(({ date, type, note, link, tools }) => ({
              date,
              type,
              note,
              ...(link ? { link } : {}),
              ...(tools?.length ? { tools } : {}),
            })),
          }
        : null,
      unevidenced: st.unevidenced,
      ...(({ first_used, last_practised }) => ({ first_used, last_practised }))(practiceDates(fw, lb, claim.code, latest.date)),
      stale: st.stale,
      changes,
    };
  });
  return {
    schema: PROFILE_SCHEMA,
    person: lb.person,
    as_of: latest.date,
    framework: { name: fw.framework.name, version: fw.framework.version },
    skills,
  };
}

/**
 * @typedef {{ code: string, name: string, description: string, level: number,
 *   level_name: string, descriptor: string, priority: Priority }} PositionLevel
 * @typedef {{ name: string, framework: { name: string, version: string }, levels: PositionLevel[] }} PositionDescription
 */

/**
 * A role template as a position description: each skill with its target
 * level, the level's plain name and descriptor, essential before desirable.
 * Needs no logbook.
 * @param {Framework} fw
 * @param {Target} target
 * @returns {PositionDescription}
 */
export function buildPositionDescription(fw, target) {
  const ordered = inFrameworkOrder(fw, target.levels);
  const levels = [...ordered.filter((l) => l.priority === 'essential'), ...ordered.filter((l) => l.priority !== 'essential')].map((l) => {
    const skill = skillByCode(fw, l.code);
    return {
      code: l.code,
      name: skill?.name ?? l.code,
      description: skill?.description ?? '',
      level: l.level,
      level_name: levelInfo(fw, l.level)?.name ?? String(l.level),
      descriptor: skill?.levels[String(l.level)] ?? '',
      priority: l.priority,
    };
  });
  return { name: target.name, framework: { name: fw.framework.name, version: fw.framework.version }, levels };
}

/**
 * The target with one target level's priority changed.
 * @param {Target} target
 * @param {string} code
 * @param {Priority} priority
 * @returns {Target}
 */
export function withTargetPriority(target, code, priority) {
  if (!target.levels.some((l) => l.code === code)) throw new Error(`the target has no level for ${code}`);
  return { ...target, levels: target.levels.map((l) => (l.code === code ? { ...l, priority } : l)) };
}
