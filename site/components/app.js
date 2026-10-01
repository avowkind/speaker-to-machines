import { LitElement, html, nothing } from 'lit';
import {
  addEvidence,
  deleteEvidence,
  latestSnapshot,
  practiceDates,
  setOverride,
  startLogbook,
  updateEvidence,
  withClaim,
} from '../core/logbook.js';
import { localToday } from '../core/dates.js';
import * as link from '../adapters/url.js';
import * as storage from '../adapters/storage.js';
import './claims-grid.js';
import './evidence-log.js';

/**
 * @typedef {import('../core/framework.js').Framework} Framework
 * @typedef {import('../core/logbook.js').Logbook} Logbook
 * @typedef {import('../core/url.js').Snapshot} Snapshot
 * @typedef {'claims' | 'evidence'} View
 */

const VIEWS = /** @type {const} */ ([
  ['claims', 'Claims'],
  ['evidence', 'Evidence log'],
]);

/**
 * The site's root element. Holds the state, passes it to views, and sends user
 * actions to the logbook core. Renders in the light DOM.
 */
export class App extends LitElement {
  static properties = {
    framework: { state: true },
    loadError: { state: true },
    logbook: { state: true },
    lastExported: { state: true },
    unexported: { state: true },
    quick: { state: true },
    linked: { state: true },
    linkProblems: { state: true },
    view: { state: true },
    labels: { state: true },
    message: { state: true },
    person: { state: true },
  };

  constructor() {
    super();
    /** @type {Framework | undefined} */
    this.framework = undefined;
    this.loadError = '';
    /** @type {Logbook | null} */
    this.logbook = null;
    /** @type {string | null} */
    this.lastExported = null;
    this.unexported = false;
    /** @type {Snapshot} quick claims, when there is no logbook */
    this.quick = { date: localToday(), claims: [] };
    /** @type {Snapshot | null} a snapshot opened from a link, being looked at */
    this.linked = null;
    /** @type {string[]} */
    this.linkProblems = [];
    /** @type {View} */
    this.view = 'claims';
    /** @type {'name' | 'title'} */
    this.labels = 'title';
    this.message = '';
    this.person = '';
  }

  createRenderRoot() {
    return this;
  }

  get fw() {
    return /** @type {Framework} */ (this.framework);
  }

  async connectedCallback() {
    super.connectedCallback();
    try {
      const res = await fetch(new URL('../framework.json', import.meta.url));
      if (!res.ok) throw new Error(`framework.json: ${res.status} ${res.statusText}`);
      this.framework = await res.json();
    } catch (e) {
      this.loadError = /** @type {Error} */ (e).message;
      return;
    }
    const stored = storage.load();
    this.logbook = stored.logbook;
    this.lastExported = stored.lastExported;
    this.unexported = stored.unexported;
    this.readLink();
    link.onLinkChange(() => this.readLink());
  }

  readLink() {
    const decoded = link.readLink(this.fw);
    this.linkProblems = decoded.kind === 'snapshot' || decoded.kind === 'invalid' ? decoded.problems : [];
    if (decoded.kind !== 'snapshot') {
      this.linked = null;
    } else if (this.logbook) {
      this.linked = decoded.snapshot;
    } else {
      this.quick = decoded.snapshot;
      this.linked = decoded.snapshot;
    }
  }

  /**
   * Make a change to the logbook through the core, save it, and report problems.
   * @param {(lb: Logbook) => Logbook} change
   * @param {string} [done] a message to show once it has worked
   */
  change(change, done = '') {
    if (!this.logbook) return;
    try {
      this.logbook = change(this.logbook);
    } catch (e) {
      this.message = /** @type {Error} */ (e).message;
      return;
    }
    const stored = storage.saveLogbook(this.logbook);
    this.unexported = stored.unexported;
    this.message = done;
  }

  /** @param {CustomEvent<{ code: string, level: number | null }>} e */
  onQuickClaim(e) {
    const { code, level } = e.detail;
    this.quick = withClaim(this.fw, { ...this.quick, date: localToday() }, code, level);
    this.linked = null;
    this.linkProblems = [];
    link.writeSnapshotLink(this.quick);
  }

  /** @param {CustomEvent<{ code: string, level: number | null }>} e */
  onLogbookClaim(e) {
    const { code, level } = e.detail;
    this.change((lb) => {
      const latest = latestSnapshot(lb);
      const updated = withClaim(this.fw, latest, code, level);
      return { ...lb, snapshots: lb.snapshots.map((s) => (s === latest ? updated : s)) };
    });
  }

  startLogbook() {
    this.logbook = startLogbook(this.fw, this.quick, { person: this.person.trim() });
    const stored = storage.saveLogbook(this.logbook);
    this.unexported = stored.unexported;
    this.linked = null;
    link.clearLink();
    this.message = 'Logbook started. Your claims are its first snapshot; add evidence to earn badges.';
  }

  leaveLink() {
    this.linked = null;
    this.linkProblems = [];
    link.clearLink();
  }

  /** @param {Snapshot} snapshot */
  async copyLink(snapshot) {
    const href = link.snapshotLink(snapshot);
    try {
      await navigator.clipboard.writeText(href);
      this.message = 'Link copied. It holds your claims and their date, never your evidence.';
    } catch {
      this.message = `Copy this link: ${href}`;
    }
  }

  render() {
    if (this.loadError) {
      return html`<p class="error">Could not load the framework (${this.loadError}). Run <code>npm run build</code> first.</p>`;
    }
    if (!this.framework) return html`<p class="loading">Loading the framework…</p>`;
    const fw = this.framework;
    return html`
      <header class="site-header">
        <h1>${fw.framework.name}<span class="subtitle">: ${fw.framework.subtitle}</span></h1>
        <p class="version">Framework version ${fw.framework.version} · ${fw.framework.licence}</p>
      </header>
      ${this.message ? html`<p class="notice" role="status">${this.message}</p>` : nothing}
      ${this.linkProblems.length
        ? html`<div class="notice warning" role="alert">
            <p>Parts of the link could not be used:</p>
            <ul>${this.linkProblems.map((p) => html`<li>${p}</li>`)}</ul>
          </div>`
        : nothing}
      ${this.linked && this.logbook ? this.renderLinked(this.linked) : this.logbook ? this.renderLogbook(this.logbook) : this.renderQuick()}
    `;
  }

  renderLabelToggle() {
    return html`<fieldset class="label-toggle">
      <legend>Show levels as</legend>
      <label><input type="radio" name="labels" .checked=${this.labels === 'title'} @change=${() => (this.labels = 'title')} /> Titles</label>
      <label><input type="radio" name="labels" .checked=${this.labels === 'name'} @change=${() => (this.labels = 'name')} /> Plain names</label>
    </fieldset>`;
  }

  /** @param {Snapshot} snapshot */
  claimMap(snapshot) {
    return Object.fromEntries(snapshot.claims.map((c) => [c.code, c.level]));
  }

  /** @param {Snapshot} snapshot */
  plainClaimsNotice(snapshot) {
    return html`<p class="notice plain-claims" role="status">
      These claims come from a link. They are plain claims as of ${snapshot.date}: a link never carries evidence, so no
      badges are shown.
    </p>`;
  }

  renderQuick() {
    const q = this.quick;
    return html`
      <div class="toolbar">
        ${this.renderLabelToggle()}
        <p class="claims-date">${q.claims.length} claim${q.claims.length === 1 ? '' : 's'} as of ${q.date}</p>
        <button type="button" @click=${() => this.copyLink(q)}>Copy link to these claims</button>
      </div>
      ${this.linked ? this.plainClaimsNotice(this.linked) : nothing}
      <stm-claims-grid .framework=${this.fw} .claims=${this.claimMap(q)} .labels=${this.labels} @claim-change=${this.onQuickClaim}></stm-claims-grid>
      <section class="start-logbook no-print">
        <h2>Keep a logbook</h2>
        <p>
          A logbook keeps these claims as a dated snapshot and lets you record evidence over time. Evidenced claims earn
          badges. It is saved in this browser only; export it as a file to keep a copy.
        </p>
        <form class="row" @submit=${(/** @type {Event} */ e) => { e.preventDefault(); this.startLogbook(); }}>
          <label>Your name (optional) <input .value=${this.person} @input=${(/** @type {Event} */ e) => (this.person = /** @type {HTMLInputElement} */ (e.target).value)} /></label>
          <button type="submit" class="primary">Start a logbook from these claims</button>
        </form>
      </section>
    `;
  }

  /** @param {Snapshot} snapshot */
  renderLinked(snapshot) {
    return html`
      <div class="toolbar">
        ${this.renderLabelToggle()}
        <button type="button" @click=${this.leaveLink}>Back to my logbook</button>
      </div>
      ${this.plainClaimsNotice(snapshot)}
      <stm-claims-grid .framework=${this.fw} .claims=${this.claimMap(snapshot)} .labels=${this.labels} readonly></stm-claims-grid>
    `;
  }

  /** @param {Logbook} lb */
  renderLogbook(lb) {
    return html`
      <nav class="views" aria-label="Logbook views">
        ${VIEWS.map(
          ([id, label]) => html`<button type="button" aria-current=${this.view === id ? 'page' : 'false'} @click=${() => (this.view = id)}>${label}</button>`,
        )}
      </nav>
      ${this.view === 'evidence' ? this.renderEvidence(lb) : this.renderClaims(lb)}
    `;
  }

  /** @param {Logbook} lb */
  renderClaims(lb) {
    const latest = latestSnapshot(lb);
    return html`
      <div class="toolbar">
        ${this.renderLabelToggle()}
        <p class="claims-date">
          ${lb.person ? `${lb.person}: ` : ''}${latest.claims.length} claim${latest.claims.length === 1 ? '' : 's'} in the snapshot of ${latest.date}
        </p>
        <button type="button" @click=${() => this.copyLink(latest)}>Copy link to these claims</button>
      </div>
      <stm-claims-grid
        .framework=${this.fw}
        .claims=${this.claimMap(latest)}
        .labels=${this.labels}
        .practice=${(/** @type {string} */ code) => practiceDates(this.fw, lb, code)}
        @claim-change=${this.onLogbookClaim}
        @override-change=${(/** @type {CustomEvent<{ code: string }>} */ e) => {
          const { code, ...change } = e.detail;
          this.change((l) => setOverride(this.fw, l, code, change));
        }}
        @add-evidence=${(/** @type {CustomEvent<{ code: string }>} */ e) => this.openEvidenceForm([e.detail.code])}
      ></stm-claims-grid>
    `;
  }

  /** @param {string[]} codes */
  async openEvidenceForm(codes) {
    this.view = 'evidence';
    await this.updateComplete;
    /** @type {import('./evidence-log.js').EvidenceLog | null} */ (this.querySelector('stm-evidence-log'))?.startNew(codes);
  }

  /** @param {Logbook} lb */
  renderEvidence(lb) {
    return html`<stm-evidence-log
      .framework=${this.fw}
      .logbook=${lb}
      @evidence-add=${(/** @type {CustomEvent} */ e) => this.change((l) => addEvidence(this.fw, l, e.detail.item), 'Evidence added.')}
      @evidence-update=${(/** @type {CustomEvent} */ e) => this.change((l) => updateEvidence(this.fw, l, e.detail.id, e.detail.item), 'Evidence updated.')}
      @evidence-delete=${(/** @type {CustomEvent} */ e) => this.change((l) => deleteEvidence(l, e.detail.id), 'Evidence deleted.')}
    ></stm-evidence-log>`;
  }
}

customElements.define('stm-app', App);
