import { LitElement, html, nothing } from 'lit';
import { safeLink } from '../core/links.js';

/**
 * The profile as a print-ready document: each claimed skill's current claim and
 * badge with its evidence, stale flags and earlier changes. Uses titles by
 * default, or plain level names for formal use. Renders in the light DOM so
 * print styles reach it.
 */
export class ProfileView extends LitElement {
  static properties = {
    profile: { attribute: false },
    labels: {},
  };

  constructor() {
    super();
    /** @type {import('../core/logbook.js').Profile | undefined} */
    this.profile = undefined;
    /** @type {'name' | 'title'} */
    this.labels = 'title';
  }

  createRenderRoot() {
    return this;
  }

  /** @param {{ level: number, name: string, title: string }} l */
  label(l) {
    return this.labels === 'name' ? `${l.name} (level ${l.level})` : `${l.title} (level ${l.level})`;
  }

  render() {
    const p = this.profile;
    if (!p) return nothing;
    const categories = [...new Set(p.skills.map((s) => s.category))];
    return html`<article class="document profile">
      <h1>${p.person ? `${p.person}: ` : ''}AI skills profile</h1>
      <p class="meta">
        As of ${p.as_of} · ${p.framework.name} framework version ${p.framework.version}. Claims are self-assessed; a badge
        marks the level the cited evidence supports.
      </p>
      ${p.skills.length ? nothing : html`<p>No skills are claimed in the latest snapshot.</p>`}
      ${categories.map(
        (cat) => html`<h2 class="section-title">${cat}</h2>
          ${p.skills
            .filter((s) => s.category === cat)
            .map(
              (s) => html`<section class="skill">
                <h3>${s.code} ${s.name}: ${this.label(s.claim)}</h3>
                <p>${s.claim.descriptor}</p>
                <p>
                  ${s.badge
                    ? html`<span class="badge-pill">${this.labels === 'name' ? s.badge.name : s.badge.title} in ${s.code}</span>
                        Badge at ${this.label(s.badge)}.`
                    : html`No badge: no qualifying evidence recorded.`}
                  ${s.unevidenced.length ? html`Unevidenced: level${s.unevidenced.length === 1 ? '' : 's'} ${s.unevidenced.join(', ')}.` : nothing}
                  ${s.stale ? html`<span class="stale-flag">Stale: last practised ${s.last_practised}.</span>` : nothing}
                </p>
                ${s.badge?.evidence.length
                  ? html`<ul class="cited">
                      ${s.badge.evidence.map(
                        (e) => html`<li>
                          ${e.date} · ${e.type}: ${e.note}${e.tools?.length ? ` (${e.tools.join(', ')})` : ''}
                          ${safeLink(e.link) ? html`<a href=${safeLink(e.link)}>link</a>` : nothing}
                        </li>`,
                      )}
                    </ul>`
                  : nothing}
                <p class="meta">
                  ${s.first_used ? `First used ${s.first_used}. ` : ''}${s.last_practised ? `Last practised ${s.last_practised}. ` : ''}
                  ${s.changes.length ? `Earlier: ${s.changes.map((c) => `${c.date} ${this.label(c)}`).join('; ')}.` : ''}
                </p>
              </section>`,
            )}`,
      )}
    </article>`;
  }
}

customElements.define('stm-profile', ProfileView);
