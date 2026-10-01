/**
 * Data for the embeddable badge: pure, with no bare imports, so the badge
 * element can load on any page. A test keeps LEVELS in step with data/levels.yaml.
 */
export { safeLink } from './core/links.js';

export const LEVELS = [
  { level: 1, name: 'Aware', title: 'Listener' },
  { level: 2, name: 'Assisted', title: 'Caller' },
  { level: 3, name: 'Practitioner', title: 'Speaker' },
  { level: 4, name: 'Integrator', title: 'Shaper' },
  { level: 5, name: 'Designer', title: 'Maker' },
  { level: 6, name: 'Authority', title: 'Keeper' },
  { level: 7, name: 'Field shaper', title: 'Namer' },
];

/**
 * @typedef {{ date?: string, type?: string, note: string, link?: string }} BadgeEvidence
 * @typedef {{ code: string, skill: string, level: number, title: string, name: string,
 *   evidence: BadgeEvidence[], person: string, as_of: string }} BadgeData
 * @typedef {{ ok: true, badge: BadgeData } | { ok: false, error: string }} BadgeResult
 */

/**
 * A badge described in the element's attributes.
 * @param {Record<string, string | null | undefined>} attrs
 * @returns {BadgeResult}
 */
export function badgeFromAttributes(attrs) {
  const code = attrs.code ?? '';
  if (!/^[A-Z]{4}$/.test(code)) return { ok: false, error: 'code must be four capital letters' };
  const info = LEVELS.find((l) => String(l.level) === attrs.level);
  if (!info) return { ok: false, error: 'level must be a number from 1 to 7' };
  /** @type {BadgeEvidence[]} */
  const evidence = attrs.evidence ? [{ note: attrs.evidence, ...(attrs['evidence-link'] ? { link: attrs['evidence-link'] } : {}) }] : [];
  return {
    ok: true,
    badge: {
      code,
      skill: attrs.skill ?? '',
      level: info.level,
      title: info.title,
      name: info.name,
      evidence,
      person: attrs.person ?? '',
      as_of: attrs['as-of'] ?? '',
    },
  };
}

/**
 * The badge for one skill in a parsed profile (stm-profile/0.1).
 * @param {any} profile
 * @param {string} code
 * @returns {BadgeResult}
 */
export function badgeFromProfile(profile, code) {
  if (profile?.schema !== 'stm-profile/0.1' || !Array.isArray(profile.skills)) {
    return { ok: false, error: 'not a Speaker-to-Machines profile' };
  }
  const skill = profile.skills.find((/** @type {any} */ s) => s.code === code);
  if (!skill) return { ok: false, error: `the profile has no claim for ${code}` };
  if (!skill.badge) return { ok: false, error: `${code} is claimed at level ${skill.claim?.level} but has no evidenced badge` };
  return {
    ok: true,
    badge: {
      code,
      skill: skill.name ?? '',
      level: skill.badge.level,
      title: skill.badge.title,
      name: skill.badge.name,
      evidence: (skill.badge.evidence ?? []).map((/** @type {any} */ e) => ({
        date: e.date,
        type: e.type,
        note: e.note,
        ...(e.link ? { link: e.link } : {}),
      })),
      person: profile.person ?? '',
      as_of: profile.as_of ?? '',
    },
  };
}

