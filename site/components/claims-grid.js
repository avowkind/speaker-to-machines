import { LitElement, html, nothing } from 'lit';
import { safeLink } from '../core/links.js';
import { levelInfo } from '../core/framework.js';
import { evidenceNeeded } from '../core/logbook.js';

/**
 * The skill-by-level grid. Shows each skill's level range, with one tickable
 * level per skill, and lets a skill be opened to read its description,
 * descriptors and examples. Renders in the light DOM.
 *
 * Fires `claim-change` with detail { code, level } (level null to withdraw a claim).
 */
export class ClaimsGrid extends LitElement {
  static properties = {
    framework: { attribute: false },
    claims: { attribute: false },
    labels: {},
    readonly: { type: Boolean },
    practice: { attribute: false },
    status: { attribute: false },
    target: { attribute: false },
    priorities: { attribute: false },
    open: { state: true },
  };

  constructor() {
    super();
    /** @type {import('../core/framework.js').Framework | undefined} */
    this.framework = undefined;
    /** @type {Record<string, number>} code to claimed level */
    this.claims = {};
    /** @type {'name' | 'title'} */
    this.labels = 'title';
    this.readonly = false;
    /** @type {((code: string) => import('../core/logbook.js').PracticeDates) | undefined} first used and last practised, in a logbook */
    this.practice = undefined;
    /** @type {Record<string, import('../core/logbook.js').ClaimStatus> | undefined} badges, in a logbook */
    this.status = undefined;
    /** @type {Record<string, import('../core/logbook.js').TargetLevel> | undefined} a target to overlay */
    this.target = undefined;
    /** @type {Record<string, import('../core/logbook.js').Priority> | undefined} set when the grid edits a target */
    this.priorities = undefined;
    /** @type {Set<string>} codes whose details are open */
    this.open = new Set();
  }

  createRenderRoot() {
    return this;
  }

  /** @param {number} level */
  levelLabel(level) {
    const info = this.framework && levelInfo(this.framework, level);
    return info ? (this.labels === 'name' ? info.name : info.title) : String(level);
  }

  render() {
    const fw = this.framework;
    if (!fw) return nothing;
    return html`${fw.categories.map(
      (cat) => html`
        <details class="category" open>
          <summary><h2>${cat.name}</h2></summary>
          ${cat.subcategories.map(
            (sub) => html`
              <details class="subcategory" open>
                <summary><h3>${sub.name}</h3></summary>
                <table class="grid">
                  <thead>
                    <tr>
                      <th scope="col" class="skill-col">Skill</th>
                      ${fw.levels.map(
                        (l) => html`<th scope="col" title=${l.description}>
                          <span class="level-num">${l.level}</span>
                          <span class="level-label">${this.levelLabel(l.level)}</span>
                        </th>`,
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    ${sub.skills.map((s) => this.renderSkill(s))}
                  </tbody>
                </table>
              </details>
            `,
          )}
        </details>
      `,
    )}`;
  }

  /** @param {import('../core/framework.js').Skill} s */
  renderSkill(s) {
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    const [lo, hi] = s.level_range;
    const claimed = this.claims[s.code];
    const isOpen = this.open.has(s.code);
    return html`
      <tr class=${claimed ? 'claimed' : ''}>
        <th scope="row" class="skill-col">
          <button
            type="button"
            class="skill-toggle"
            aria-expanded=${isOpen ? 'true' : 'false'}
            @click=${() => this.toggle(s.code)}
          >
            <span class="code">${s.code}</span> ${s.name}
          </button>
          ${this.priorities && claimed
            ? html`<select
                class="priority"
                aria-label=${`Priority of ${s.code}`}
                ?disabled=${this.readonly}
                @change=${(/** @type {Event} */ e) =>
                  this.dispatchEvent(
                    new CustomEvent('priority-change', { detail: { code: s.code, priority: /** @type {HTMLSelectElement} */ (e.target).value }, bubbles: true }),
                  )}
              >
                <option value="essential" ?selected=${this.priorities[s.code] === 'essential'}>essential</option>
                <option value="desirable" ?selected=${this.priorities[s.code] !== 'essential'}>desirable</option>
              </select>`
            : nothing}
        </th>
        ${fw.levels.map(({ level }) => {
          if (level < lo || level > hi) return html`<td class="out-of-range" aria-hidden="true"></td>`;
          const checked = claimed === level;
          return html`<td class=${this.cellClass(s.code, level)} title=${s.levels[String(level)]}>
            <input
              type="checkbox"
              .checked=${checked}
              ?disabled=${this.readonly}
              aria-label=${`${s.code} level ${level} ${this.levelLabel(level)}`}
              @change=${(/** @type {Event} */ e) => this.tick(s.code, level, /** @type {HTMLInputElement} */ (e.target).checked)}
            />
            ${this.renderCellMarks(s.code, level)}
          </td>`;
        })}
      </tr>
      ${isOpen ? this.renderDetail(s) : nothing}
    `;
  }

  /**
   * Extra classes for a cell. Subclasses and later views add overlays here.
   * @param {string} code
   * @param {number} level
   */
  cellClass(code, level) {
    const classes = ['in-range'];
    if (this.claims[code] === level) classes.push('ticked');
    const st = this.status?.[code];
    if (st?.badge?.level === level) classes.push('badged');
    if (st?.unevidenced.includes(level)) classes.push('unevidenced');
    const t = this.target?.[code];
    if (t?.level === level) classes.push('target', t.priority);
    return classes.join(' ');
  }

  /**
   * @param {string} code
   * @param {number} level
   */
  renderCellMarks(code, level) {
    const t = this.target?.[code];
    const targetMark = t?.level === level ? html`<span class="mark target">target · ${t.priority}</span>` : nothing;
    const st = this.status?.[code];
    if (!st) return targetMark;
    return html`${targetMark}${st.badge?.level === level
      ? html`<span class="mark badge">${this.labels === 'name' ? st.badge.name : st.badge.title}</span>`
      : nothing}${st.level === level && st.unevidenced.length
      ? html`<span class="mark unevidenced">${st.badge ? 'beyond evidence' : 'no evidence'}</span>`
      : nothing}${st.level === level && st.stale
      ? html`<span class="mark stale" title=${`Last practised ${st.last_practised}`}>stale</span>`
      : nothing}`;
  }

  /** @param {import('../core/framework.js').Skill} s */
  renderBadge(s) {
    const st = this.status?.[s.code];
    if (!st) return nothing;
    const label = (/** @type {number} */ l) => `${l} ${this.levelLabel(l)}`;
    return html`<div class="badge-detail">
      ${st.badge
        ? html`<p>
              <span class="badge-pill">${this.labels === 'name' ? st.badge.name : st.badge.title} in ${s.code}</span>
              Badge at level ${label(st.badge.level)}, resting on:
            </p>
            <ul class="cited">
              ${st.badge.evidence.map((e) => html`<li>${e.date} · ${e.type}: ${e.note}${safeLink(e.link) ? html` (<a href=${safeLink(e.link)} rel="noopener noreferrer" target="_blank">link</a>)` : nothing}</li>`)}
            </ul>`
        : html`<p>No badge yet: no qualifying evidence for this claim.</p>`}
      ${st.stale
        ? html`<p class="stale-flag">Stale: last practised ${st.last_practised}, more than 12 months before this snapshot.</p>`
        : nothing}
      ${st.unevidenced.length
        ? html`<p><span class="unevidenced-pill">Unevidenced</span> ${st.unevidenced.map(label).join(', ')}.
            ${this.evidenceHint(st.unevidenced[0])}</p>`
        : nothing}
    </div>`;
  }

  /** @param {number} level */
  evidenceHint(level) {
    const info = this.framework && levelInfo(this.framework, level);
    const needs = evidenceNeeded(level);
    return `Level ${level} needs ${needs}${info ? ` (for example: ${info.evidence.replace(/\.$/, '').toLowerCase()})` : ''}.`;
  }

  /** @param {import('../core/framework.js').Skill} s */
  renderDetail(s) {
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    return html`<tr class="skill-detail">
      <td colspan=${fw.levels.length + 1}>
        <p class="description">${s.description}</p>
        <dl class="descriptors">
          ${Object.entries(s.levels).map(
            ([level, text]) => html`<dt>${level} ${this.levelLabel(Number(level))}</dt>
              <dd>${text}</dd>`,
          )}
        </dl>
        ${s.examples.items.length
          ? html`<p class="examples">
              <strong>Examples (as of ${s.examples.as_of}):</strong> ${s.examples.items.join(', ')}
            </p>`
          : nothing}
        ${this.renderBadge(s)} ${this.renderDetailExtra(s)}
      </td>
    </tr>`;
  }

  /**
   * First used and last practised, with overrides, when showing a logbook.
   * Fires `override-change` with detail { code, first_used?, last_practised? } (null clears).
   * @param {import('../core/framework.js').Skill} s
   */
  renderDetailExtra(s) {
    if (!this.practice) return nothing;
    const p = this.practice(s.code);
    /** @param {'first_used' | 'last_practised'} field @param {string} label */
    const field = (field, label) => html`<label
      >${label}${p.overridden[field] ? ' (your override)' : p[field] ? ' (from evidence)' : ''}
      <span>
        <input
          size="11"
          placeholder="none yet"
          .value=${p[field] ?? ''}
          aria-label=${`${label} for ${s.code}: type a date to override`}
          @change=${(/** @type {Event} */ e) => {
            const v = /** @type {HTMLInputElement} */ (e.target).value.trim();
            this.dispatchEvent(new CustomEvent('override-change', { detail: { code: s.code, [field]: v || null }, bubbles: true }));
          }}
        />
        ${p.overridden[field]
          ? html`<button type="button" class="link" @click=${() => this.dispatchEvent(new CustomEvent('override-change', { detail: { code: s.code, [field]: null }, bubbles: true }))}>use evidence</button>`
          : nothing}
      </span>
    </label>`;
    return html`<div class="practice">
      ${field('first_used', 'First used')} ${field('last_practised', 'Last practised')}
      <button type="button" @click=${() => this.dispatchEvent(new CustomEvent('add-evidence', { detail: { code: s.code }, bubbles: true }))}>
        Add evidence for ${s.code}
      </button>
    </div>`;
  }

  /** @param {string} code */
  toggle(code) {
    const open = new Set(this.open);
    if (open.has(code)) open.delete(code);
    else open.add(code);
    this.open = open;
  }

  /**
   * @param {string} code
   * @param {number} level
   * @param {boolean} checked
   */
  tick(code, level, checked) {
    this.dispatchEvent(
      new CustomEvent('claim-change', { detail: { code, level: checked ? level : null }, bubbles: true }),
    );
  }
}

customElements.define('stm-claims-grid', ClaimsGrid);
