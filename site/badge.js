/**
 * <stm-badge>: a Speaker-to-Machines badge to embed in any page with one
 * script tag and one element. It renders in shadow DOM, from attributes:
 *
 *   <stm-badge code="INST" level="4" skill="Instructing AI"
 *     evidence="Team prompt library" evidence-link="https://…"></stm-badge>
 *
 * or from a YAML profile exported from a logbook:
 *
 *   <stm-badge src="profile.yaml" code="INST"></stm-badge>
 *
 * Besides its own code, the only thing it fetches is the profile named in
 * src. It sends no cookies and reports nothing anywhere.
 */
import { badgeFromAttributes, badgeFromProfile, safeLink } from './badge-data.js';

const STYLE = `
  :host { display: inline-block; font: 14px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1d232a; }
  .badge { border: 1px solid #2e7d4f; border-radius: 8px; padding: 0.6em 0.8em; max-width: 26em; background: #fff; }
  .head { display: flex; gap: 0.6em; align-items: center; }
  .mark { flex: none; display: grid; place-items: center; width: 3em; height: 3em; border-radius: 50%;
    background: #e2f2e8; color: #2e7d4f; font-weight: 700; font-size: 0.85em; text-align: center; line-height: 1.1; }
  .title { font-weight: 700; color: #2e7d4f; }
  .skill { font-weight: 600; }
  .level, .meta, .note { color: #5b6672; font-size: 0.9em; }
  ul { margin: 0.4em 0 0.2em; padding-left: 1.2em; }
  li { margin: 0.15em 0; }
  a { color: #1f5f8b; }
  .error { color: #a01d1d; font-size: 0.9em; }
`;

const ATTRS = ['code', 'level', 'skill', 'evidence', 'evidence-link', 'person', 'as-of', 'src'];

class StmBadge extends HTMLElement {
  static observedAttributes = ATTRS;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    /** Increments with each render, so a slow fetch can't overwrite a newer one. */
    this.generation = 0;
  }

  connectedCallback() {
    this.update();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.update();
  }

  async update() {
    const generation = ++this.generation;
    const src = this.getAttribute('src');
    /** @type {import('./badge-data.js').BadgeResult} */
    let result;
    if (src) {
      result = await this.fromProfile(src);
      if (generation !== this.generation) return;
    } else {
      result = badgeFromAttributes(Object.fromEntries(ATTRS.map((a) => [a, this.getAttribute(a)])));
    }
    this.show(result);
  }

  /**
   * @param {string} src
   * @returns {Promise<import('./badge-data.js').BadgeResult>}
   */
  async fromProfile(src) {
    const code = this.getAttribute('code') ?? '';
    try {
      const res = await fetch(new URL(src, document.baseURI), { credentials: 'omit' });
      if (!res.ok) return { ok: false, error: `could not load the profile (${res.status})` };
      const text = await res.text();
      // The YAML parser is loaded from beside this script, only when a profile is used.
      /** @type {typeof import('yaml')} */
      const { parse } = await import(new URL('./vendor/yaml/index.js', import.meta.url).href);
      return badgeFromProfile(parse(text), code);
    } catch (e) {
      return { ok: false, error: `could not read the profile: ${/** @type {Error} */ (e).message}` };
    }
  }

  /** @param {import('./badge-data.js').BadgeResult} result */
  show(result) {
    const el = (/** @type {string} */ tag, /** @type {string} */ cls = '', /** @type {string} */ text = '') => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    };
    const style = el('style');
    style.textContent = STYLE;
    const box = el('div', 'badge');
    if (!result.ok) {
      box.append(el('div', 'error', `Badge unavailable: ${result.error}.`));
      this.root.replaceChildren(style, box);
      return;
    }
    const b = result.badge;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', `${b.title} in ${b.code}${b.skill ? `, ${b.skill}` : ''}: level ${b.level}, ${b.name}`);
    const head = el('div', 'head');
    head.append(el('div', 'mark', b.code));
    const text = el('div');
    const line = el('div');
    line.append(el('span', 'title', `${b.title} in ${b.code}`));
    text.append(line);
    if (b.skill) text.append(el('div', 'skill', b.skill));
    text.append(el('div', 'level', `Level ${b.level}, ${b.name}`));
    head.append(text);
    box.append(head);
    if (b.evidence.length) {
      box.append(el('div', 'meta', 'Evidence cited:'));
      const list = el('ul');
      for (const e of b.evidence) {
        const item = el('li');
        const prefix = [e.date, e.type].filter(Boolean).join(' · ');
        item.append(document.createTextNode(prefix ? `${prefix}: ${e.note}` : e.note));
        const href = safeLink(e.link);
        if (href) {
          item.append(' ');
          const a = /** @type {HTMLAnchorElement} */ (el('a', '', 'link'));
          a.href = href;
          a.rel = 'noopener noreferrer';
          a.target = '_blank';
          item.append(a);
        }
        list.append(item);
      }
      box.append(list);
    } else {
      box.append(el('div', 'note', 'No evidence is cited with this badge.'));
    }
    const who = [b.person, b.as_of ? `as of ${b.as_of}` : ''].filter(Boolean).join(', ');
    box.append(el('div', 'note', `Self-issued ${who ? `by ${who} ` : ''}from a Speaker-to-Machines logbook: its credibility rests on the evidence cited.`));
    this.root.replaceChildren(style, box);
  }
}

if (!customElements.get('stm-badge')) customElements.define('stm-badge', StmBadge);
