import { LitElement, html, nothing } from 'lit';
import { allSkills, skillByCode } from '../core/framework.js';
import { EVIDENCE_TYPES, currentCode, evidenceProblems, filterEvidence } from '../core/logbook.js';

/**
 * @typedef {import('../core/logbook.js').EvidenceInput} EvidenceInput
 * @typedef {import('../core/logbook.js').EvidenceItem} EvidenceItem
 */

/** @returns {EvidenceInput} */
const blank = () => ({ date: '', codes: [], type: 'used', note: '', link: '', tools: [] });

/**
 * The evidence log: add, edit, delete and filter evidence items. Renders in
 * the light DOM so the form takes part in the page natively.
 *
 * Fires `evidence-add` { item }, `evidence-update` { id, item } and
 * `evidence-delete` { id }.
 */
export class EvidenceLog extends LitElement {
  static properties = {
    framework: { attribute: false },
    logbook: { attribute: false },
    draft: { state: true },
    editing: { state: true },
    problems: { state: true },
    toolText: { state: true },
    filter: { state: true },
    showForm: { state: true },
  };

  constructor() {
    super();
    /** @type {import('../core/framework.js').Framework | undefined} */
    this.framework = undefined;
    /** @type {import('../core/logbook.js').Logbook | undefined} */
    this.logbook = undefined;
    this.draft = blank();
    /** @type {string | null} the id being edited, if any */
    this.editing = null;
    /** @type {string[]} */
    this.problems = [];
    this.toolText = '';
    /** @type {import('../core/logbook.js').EvidenceFilter} */
    this.filter = {};
    this.showForm = false;
  }

  createRenderRoot() {
    return this;
  }

  /**
   * Open the form, empty or pre-filled with some skill codes.
   * @param {string[]} [codes]
   */
  startNew(codes = []) {
    this.editing = null;
    this.draft = { ...blank(), codes };
    this.problems = [];
    this.showForm = true;
  }

  /** @param {EvidenceItem} item */
  startEdit(item) {
    this.editing = item.id;
    this.draft = { date: item.date, codes: [...item.codes], type: item.type, note: item.note, link: item.link ?? '', tools: [...(item.tools ?? [])] };
    this.problems = [];
    this.showForm = true;
  }

  /** @param {Partial<EvidenceInput>} change */
  changeDraft(change) {
    this.draft = { ...this.draft, ...change };
  }

  addTool() {
    const t = this.toolText.trim();
    if (t && !this.draft.tools?.includes(t)) this.changeDraft({ tools: [...(this.draft.tools ?? []), t] });
    this.toolText = '';
  }

  /** @param {Event} e */
  submit(e) {
    e.preventDefault();
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    if (this.toolText.trim()) this.addTool();
    const problems = evidenceProblems(fw, this.draft);
    if (problems.length) {
      this.problems = problems;
      return;
    }
    const detail = this.editing ? { id: this.editing, item: this.draft } : { item: this.draft };
    this.dispatchEvent(new CustomEvent(this.editing ? 'evidence-update' : 'evidence-add', { detail, bubbles: true }));
    this.showForm = false;
    this.editing = null;
    this.draft = blank();
  }

  /** @param {EvidenceItem} item */
  removeItem(item) {
    if (!confirm(`Delete the evidence item "${item.note}"? Badges will be recomputed.`)) return;
    this.dispatchEvent(new CustomEvent('evidence-delete', { detail: { id: item.id }, bubbles: true }));
  }

  render() {
    const fw = this.framework;
    const lb = this.logbook;
    if (!fw || !lb) return nothing;
    const items = filterEvidence(fw, lb, this.filter);
    return html`
      <div class="toolbar">
        <p>${lb.evidence.length} evidence item${lb.evidence.length === 1 ? '' : 's'}</p>
        ${this.showForm ? nothing : html`<button type="button" class="primary" @click=${() => this.startNew()}>Add evidence</button>`}
      </div>
      ${this.showForm ? this.renderForm(fw) : nothing} ${this.renderFilters(fw)}
      ${items.length
        ? html`<table class="list evidence">
            <thead>
              <tr><th>Date</th><th>Skills</th><th>Type</th><th>What was done</th><th>Tools</th><th><span class="visually-hidden">Actions</span></th></tr>
            </thead>
            <tbody>
              ${items.map(
                (item) => html`<tr>
                  <td>${item.date}</td>
                  <td>${item.codes.map((c) => this.renderCode(fw, c))}</td>
                  <td>${item.type}</td>
                  <td>${item.note}${item.link ? html` <a href=${item.link} rel="noopener noreferrer" target="_blank">link</a>` : nothing}</td>
                  <td>${(item.tools ?? []).join(', ')}</td>
                  <td class="actions">
                    <button type="button" class="link" @click=${() => this.startEdit(item)}>Edit</button>
                    <button type="button" class="link" @click=${() => this.removeItem(item)}>Delete</button>
                  </td>
                </tr>`,
              )}
            </tbody>
          </table>`
        : html`<p class="muted">${lb.evidence.length ? 'No evidence matches these filters.' : 'No evidence yet. Add what you have learned, used, built, taught or published.'}</p>`}
    `;
  }

  /**
   * @param {import('../core/framework.js').Framework} fw
   * @param {string} code
   */
  renderCode(fw, code) {
    const now = currentCode(fw, code);
    const skill = skillByCode(fw, now);
    const label = now === code ? code : `${code} (now ${now})`;
    return html`<span class="chip" title=${skill?.name ?? ''}>${label}</span> `;
  }

  /** @param {import('../core/framework.js').Framework} fw */
  renderFilters(fw) {
    const f = this.filter;
    return html`<div class="filters" role="search">
      <label>Skill
        <select @change=${(/** @type {Event} */ e) => (this.filter = { ...f, code: /** @type {HTMLSelectElement} */ (e.target).value || undefined })}>
          <option value="">All skills</option>
          ${allSkills(fw).map((s) => html`<option value=${s.code} ?selected=${f.code === s.code}>${s.code} ${s.name}</option>`)}
        </select>
      </label>
      <label>Type
        <select @change=${(/** @type {Event} */ e) => (this.filter = { ...f, type: /** @type {any} */ (/** @type {HTMLSelectElement} */ (e.target).value) || undefined })}>
          <option value="">All types</option>
          ${EVIDENCE_TYPES.map((t) => html`<option ?selected=${f.type === t}>${t}</option>`)}
        </select>
      </label>
      <label>From
        <input size="10" placeholder="YYYY-MM" .value=${f.from ?? ''} @change=${(/** @type {Event} */ e) => (this.filter = { ...f, from: validOrUndefined(e) })} />
      </label>
      <label>To
        <input size="10" placeholder="YYYY-MM" .value=${f.to ?? ''} @change=${(/** @type {Event} */ e) => (this.filter = { ...f, to: validOrUndefined(e) })} />
      </label>
      ${f.code || f.type || f.from || f.to ? html`<button type="button" class="link" @click=${() => (this.filter = {})}>Clear filters</button>` : nothing}
    </div>`;
  }

  /** @param {import('../core/framework.js').Framework} fw */
  renderForm(fw) {
    const d = this.draft;
    const suggestions = [
      ...new Set((d.codes.length ? d.codes.map((c) => skillByCode(fw, currentCode(fw, c))) : allSkills(fw)).flatMap((s) => s?.examples.items ?? [])),
    ];
    return html`<form class="stacked" @submit=${this.submit} novalidate>
      <h2>${this.editing ? 'Edit evidence' : 'Add evidence'}</h2>
      ${this.problems.length
        ? html`<ul class="field-error" role="alert">${this.problems.map((p) => html`<li>${p}</li>`)}</ul>`
        : nothing}
      <div class="row">
        <label>Date (YYYY-MM or YYYY-MM-DD)
          <input required size="12" placeholder="2026-09" .value=${d.date} @input=${(/** @type {Event} */ e) => this.changeDraft({ date: inputValue(e).trim() })} />
        </label>
        <label>Type
          <select @change=${(/** @type {Event} */ e) => this.changeDraft({ type: /** @type {any} */ (inputValue(e)) })}>
            ${EVIDENCE_TYPES.map((t) => html`<option ?selected=${d.type === t}>${t}</option>`)}
          </select>
        </label>
      </div>
      <label>Skills (choose one or more)
        <select multiple size="8" @change=${(/** @type {Event} */ e) => this.changeDraft({ codes: [.../** @type {HTMLSelectElement} */ (e.target).selectedOptions].map((o) => o.value) })}>
          ${fw.categories.map(
            (c) => html`<optgroup label=${c.name}>
              ${c.subcategories.flatMap((s) => s.skills).map((s) => html`<option value=${s.code} ?selected=${d.codes.includes(s.code)}>${s.code} ${s.name}</option>`)}
            </optgroup>`,
          )}
        </select>
      </label>
      <label>What you did
        <textarea rows="3" .value=${d.note} @input=${(/** @type {Event} */ e) => this.changeDraft({ note: inputValue(e) })}></textarea>
      </label>
      <label>Link (optional)
        <input type="url" placeholder="https://" .value=${d.link ?? ''} @input=${(/** @type {Event} */ e) => this.changeDraft({ link: inputValue(e) })} />
      </label>
      <div>
        <label>Tools (optional: pick from the examples or type your own, then press Enter)
          <input
            list="tool-suggestions"
            .value=${this.toolText}
            @input=${(/** @type {Event} */ e) => (this.toolText = inputValue(e))}
            @keydown=${(/** @type {KeyboardEvent} */ e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addTool();
              }
            }}
          />
        </label>
        <datalist id="tool-suggestions">${suggestions.map((t) => html`<option value=${t}></option>`)}</datalist>
        <div class="chips">
          ${(d.tools ?? []).map(
            (t) => html`<span class="chip">${t}
              <button type="button" class="link" aria-label=${`Remove ${t}`} @click=${() => this.changeDraft({ tools: d.tools?.filter((x) => x !== t) })}>×</button></span>`,
          )}
        </div>
      </div>
      <div class="actions">
        <button type="submit" class="primary">${this.editing ? 'Save changes' : 'Add evidence'}</button>
        <button type="button" @click=${() => { this.showForm = false; this.editing = null; }}>Cancel</button>
      </div>
    </form>`;
  }
}

/** @param {Event} e */
function inputValue(e) {
  return /** @type {HTMLInputElement} */ (e.target).value;
}

/** @param {Event} e */
function validOrUndefined(e) {
  const v = inputValue(e).trim();
  return /^\d{4}-\d{2}(-\d{2})?$/.test(v) ? v : undefined;
}

customElements.define('stm-evidence-log', EvidenceLog);
