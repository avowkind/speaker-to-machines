import { LitElement, html, nothing } from 'lit';
import { findGaps } from '../core/logbook.js';
import { levelInfo, skillByCode } from '../core/framework.js';
import './claims-grid.js';

/**
 * @typedef {import('../core/logbook.js').Target} Target
 */

/**
 * Targets: build or edit one by ticking target levels and marking each
 * essential or desirable, share it, and (in a logbook) see the ranked gaps.
 * Renders in the light DOM.
 *
 * Fires `target-level` { code, level }, `target-priority` { code, priority },
 * `target-rename` { name }, `target-select` { name }, `target-new`,
 * `target-delete`, `target-link`, `target-export`, `target-import` { text, name }
 * and `target-document`.
 */
export class TargetsView extends LitElement {
  static properties = {
    framework: { attribute: false },
    logbook: { attribute: false },
    target: { attribute: false },
    labels: {},
    readonly: { type: Boolean },
    errors: { attribute: false },
  };

  constructor() {
    super();
    /** @type {import('../core/framework.js').Framework | undefined} */
    this.framework = undefined;
    /** @type {import('../core/logbook.js').Logbook | null} */
    this.logbook = null;
    /** @type {Target | null} */
    this.target = null;
    /** @type {'name' | 'title'} */
    this.labels = 'title';
    this.readonly = false;
    /** @type {string[]} */
    this.errors = [];
  }

  createRenderRoot() {
    return this;
  }

  /**
   * @param {string} name
   * @param {unknown} [detail]
   */
  fire(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }

  /** @param {Event} e */
  async onFile(e) {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    input.value = '';
    this.fire('target-import', { text, name: file.name });
  }

  /** @param {number} level */
  label(level) {
    const info = this.framework && levelInfo(this.framework, level);
    return info ? (this.labels === 'name' ? info.name : info.title) : String(level);
  }

  render() {
    const fw = this.framework;
    if (!fw) return nothing;
    const lb = this.logbook;
    const t = this.target;
    return html`
      <div class="toolbar">
        ${lb && lb.targets.length
          ? html`<label
              >Target
              <select @change=${(/** @type {Event} */ e) => this.fire('target-select', { name: /** @type {HTMLSelectElement} */ (e.target).value })}>
                ${lb.targets.map((x) => html`<option ?selected=${x.name === t?.name}>${x.name}</option>`)}
              </select>
            </label>`
          : nothing}
        ${lb ? html`<button type="button" @click=${() => this.fire('target-new')}>New target</button>` : nothing}
        <label class="button">Import a target file… <input type="file" accept=".yaml,.yml,text/yaml" class="visually-hidden" @change=${this.onFile} /></label>
      </div>
      ${this.errors.length
        ? html`<div class="notice warning" role="alert">
            <p>The target was not imported:</p>
            <ul>${this.errors.map((e) => html`<li>${e}</li>`)}</ul>
          </div>`
        : nothing}
      ${t ? this.renderTarget(t) : html`<p class="muted">No targets yet. Make one for a role you're considering or a personal goal, or import one.</p>`}
    `;
  }

  /** @param {Target} t */
  renderTarget(t) {
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    const lb = this.logbook;
    return html`
      <div class="toolbar">
        <label
          >Name
          <input
            .value=${t.name}
            ?disabled=${this.readonly}
            @change=${(/** @type {Event} */ e) => this.fire('target-rename', { name: /** @type {HTMLInputElement} */ (e.target).value })}
          />
        </label>
        <p>${t.levels.length} target level${t.levels.length === 1 ? '' : 's'} (${t.levels.filter((l) => l.priority === 'essential').length} essential)</p>
        <button type="button" @click=${() => this.fire('target-link')}>Copy link to this target</button>
        <button type="button" @click=${() => this.fire('target-export')}>Export target file</button>
        <button type="button" @click=${() => this.fire('target-document')}>Position description</button>
        ${lb && !this.readonly ? html`<button type="button" class="link" @click=${() => this.fire('target-delete')}>Delete target</button>` : nothing}
      </div>
      ${lb && lb.snapshots.length ? this.renderGaps(lb, t) : nothing}
      <h2 class="section-title">Target levels</h2>
      <p class="muted">Tick the level the role or goal asks for in each skill, then mark it essential or desirable.</p>
      <stm-claims-grid
        .framework=${fw}
        .claims=${Object.fromEntries(t.levels.map((l) => [l.code, l.level]))}
        .priorities=${Object.fromEntries(t.levels.map((l) => [l.code, l.priority]))}
        .labels=${this.labels}
        ?readonly=${this.readonly}
        @claim-change=${(/** @type {CustomEvent} */ e) => {
          e.stopPropagation();
          this.fire('target-level', e.detail);
        }}
        @priority-change=${(/** @type {CustomEvent} */ e) => {
          e.stopPropagation();
          this.fire('target-priority', e.detail);
        }}
      ></stm-claims-grid>
    `;
  }

  /**
   * @param {import('../core/logbook.js').Logbook} lb
   * @param {Target} t
   */
  renderGaps(lb, t) {
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    const { gaps, evidenceGaps } = findGaps(fw, lb, t);
    const name = (/** @type {string} */ code) => skillByCode(fw, code)?.name ?? '';
    return html`<section class="gaps">
      <h2 class="section-title">Gaps against your latest claims</h2>
      ${gaps.length
        ? html`<table class="list">
            <thead><tr><th>#</th><th>Skill</th><th>Priority</th><th>Target</th><th>Your claim</th><th>Gap</th></tr></thead>
            <tbody>
              ${gaps.map(
                (g, i) => html`<tr>
                  <td>${i + 1}</td>
                  <td><span class="code">${g.code}</span> ${name(g.code)}</td>
                  <td>${g.priority}</td>
                  <td>${g.target} ${this.label(g.target)}</td>
                  <td>${g.claim ? `${g.claim} ${this.label(g.claim)}` : 'none'}</td>
                  <td>${g.size} level${g.size === 1 ? '' : 's'}</td>
                </tr>`,
              )}
            </tbody>
          </table>`
        : html`<p>Your claims meet every target level.</p>`}
      <h2 class="section-title">Evidence gaps</h2>
      <p class="muted">Your claim meets the target here, but your badge doesn't: evidence is missing, not learning.</p>
      ${evidenceGaps.length
        ? html`<table class="list">
            <thead><tr><th>Skill</th><th>Priority</th><th>Target</th><th>Your claim</th><th>Your badge</th></tr></thead>
            <tbody>
              ${evidenceGaps.map(
                (g) => html`<tr>
                  <td><span class="code">${g.code}</span> ${name(g.code)}</td>
                  <td>${g.priority}</td>
                  <td>${g.target} ${this.label(g.target)}</td>
                  <td>${g.claim} ${this.label(g.claim)}</td>
                  <td>${g.badge ? html`<span class="badge-pill">${this.label(g.badge)}</span>` : 'none'}</td>
                </tr>`,
              )}
            </tbody>
          </table>`
        : html`<p>No evidence gaps.</p>`}
    </section>`;
  }
}

customElements.define('stm-targets', TargetsView);
