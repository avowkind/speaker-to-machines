import { LitElement, html, nothing } from 'lit';
import {
  addEvidence,
  addSnapshot,
  addTarget,
  deleteEvidence,
  deleteSnapshot,
  isEditable,
  latestSnapshot,
  newSnapshot,
  practiceDates,
  removeTarget,
  replaceTarget,
  setClaim,
  setOverride,
  snapshotStatus,
  startLogbook,
  updateEvidence,
  withClaim,
  withTargetLevel,
} from '../core/logbook.js';
import { localToday } from '../core/dates.js';
import { exportLogbook, exportTarget, importLogbook, importTarget } from '../core/files.js';
import * as link from '../adapters/url.js';
import * as storage from '../adapters/storage.js';
import { saveFile } from '../adapters/download.js';
import './claims-grid.js';
import './evidence-log.js';
import './files-view.js';
import './history-view.js';
import './targets-view.js';

/**
 * @typedef {import('../core/framework.js').Framework} Framework
 * @typedef {import('../core/logbook.js').Logbook} Logbook
 * @typedef {import('../core/logbook.js').Target} Target
 * @typedef {import('../core/url.js').Snapshot} Snapshot
 * @typedef {'claims' | 'evidence' | 'history' | 'targets' | 'files'} View
 */

/** @type {ReadonlyArray<[View, string]>} */
const LOGBOOK_VIEWS = [
  ['claims', 'Claims'],
  ['evidence', 'Evidence log'],
  ['history', 'History'],
  ['targets', 'Targets and gaps'],
  ['files', 'Import and export'],
];
/** @type {ReadonlyArray<[View, string]>} */
const QUICK_VIEWS = [
  ['claims', 'Quick claims'],
  ['targets', 'Build a target'],
  ['files', 'Import a logbook'],
];

/** @param {string} name */
const fileSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';

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
    draftTarget: { state: true },
    linked: { state: true },
    linkedTarget: { state: true },
    linkProblems: { state: true },
    view: { state: true },
    labels: { state: true },
    message: { state: true },
    person: { state: true },
    importErrors: { state: true },
    targetErrors: { state: true },
    selectedDate: { state: true },
    targetName: { state: true },
    overlay: { state: true },
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
    /** @type {Target} a target being built without a logbook */
    this.draftTarget = { name: 'New role', levels: [] };
    /** @type {Snapshot | null} a snapshot opened from a link, while a logbook exists */
    this.linked = null;
    /** @type {Target | null} a target opened from a link, while a logbook exists */
    this.linkedTarget = null;
    /** @type {string[]} */
    this.linkProblems = [];
    /** @type {View} */
    this.view = 'claims';
    /** @type {'name' | 'title'} */
    this.labels = 'title';
    this.message = '';
    this.person = '';
    /** @type {string[]} */
    this.importErrors = [];
    /** @type {string[]} */
    this.targetErrors = [];
    /** @type {string | null} the snapshot shown on the grid; null for the latest */
    this.selectedDate = null;
    /** @type {string | null} the logbook target being edited */
    this.targetName = null;
    /** @type {string | null} the logbook target overlaid on the claims grid */
    this.overlay = null;
    /** Whether the quick claims came from a link and haven't been changed. */
    this.quickFromLink = false;
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

  /** Show what the link in the address holds, if anything. */
  readLink() {
    const decoded = link.readLink(this.fw);
    this.linkProblems = decoded.kind === 'none' ? [] : decoded.problems;
    if (decoded.kind === 'snapshot') {
      if (this.logbook) {
        this.linked = decoded.snapshot;
        this.linkedTarget = null;
      } else {
        this.quick = decoded.snapshot;
        this.quickFromLink = true;
      }
      this.view = 'claims';
    } else if (decoded.kind === 'target') {
      if (this.logbook) {
        this.linkedTarget = decoded.target;
        this.linked = null;
      } else {
        this.draftTarget = decoded.target;
      }
      this.view = 'targets';
    }
    const mapped = decoded.kind === 'snapshot' || decoded.kind === 'target' ? decoded.mapped : [];
    if (mapped.length) {
      this.message = `Retired codes in the link were mapped to their replacements: ${mapped.map((m) => `${m.from} → ${m.to}`).join(', ')}.`;
    }
  }

  /**
   * Make a change to the logbook through the core, save it, and report problems.
   * @param {(lb: Logbook) => Logbook} change
   * @param {string} [done] a message to show once it has worked
   * @returns {boolean} whether the change was made
   */
  change(change, done = '') {
    if (!this.logbook) return false;
    try {
      this.logbook = change(this.logbook);
    } catch (e) {
      this.message = /** @type {Error} */ (e).message;
      return false;
    }
    const stored = storage.saveLogbook(this.logbook);
    this.unexported = stored.unexported;
    this.message = done;
    return true;
  }

  /** @param {View} view */
  go(view) {
    this.view = view;
    this.message = '';
    if (!this.logbook) {
      // Without a logbook, the address holds what the view shows.
      if (view === 'claims' && this.quick.claims.length) link.writeSnapshotLink(this.quick);
      else if (view === 'targets' && this.draftTarget.levels.length) link.writeTargetLink(this.draftTarget);
    }
  }

  // Quick claims

  /** @param {CustomEvent<{ code: string, level: number | null }>} e */
  onQuickClaim(e) {
    const { code, level } = e.detail;
    this.quick = withClaim(this.fw, { ...this.quick, date: localToday() }, code, level);
    this.quickFromLink = false;
    this.linkProblems = [];
    link.writeSnapshotLink(this.quick);
  }

  startLogbook() {
    let lb = startLogbook(this.fw, this.quick, { person: this.person.trim() });
    if (this.draftTarget.levels.length) lb = addTarget(this.fw, lb, this.draftTarget);
    this.logbook = lb;
    const stored = storage.saveLogbook(lb);
    this.unexported = stored.unexported;
    link.clearLink();
    this.view = 'claims';
    this.message = 'Logbook started. Your claims are its first snapshot; add evidence to earn badges.';
  }

  // Snapshots and claims in a logbook

  /** @param {Logbook} lb */
  shownSnapshot(lb) {
    return lb.snapshots.find((s) => s.date === this.selectedDate) ?? latestSnapshot(lb);
  }

  /** @param {CustomEvent<{ code: string, level: number | null }>} e */
  onLogbookClaim(e) {
    const { code, level } = e.detail;
    if (!this.logbook) return;
    const date = this.shownSnapshot(this.logbook).date;
    this.change((lb) => setClaim(this.fw, lb, date, code, level, localToday()));
  }

  makeSnapshot() {
    const today = localToday();
    if (this.change((lb) => newSnapshot(this.fw, lb, today), `Made the snapshot of ${today}, copied from your latest. Change only what has moved.`)) {
      this.selectedDate = today;
    }
  }

  /** @param {string} date */
  removeSnapshot(date) {
    if (!confirm(`Delete the snapshot of ${date}? Its claims are removed from your history; evidence is kept.`)) return;
    this.change((lb) => deleteSnapshot(lb, date), `Deleted the snapshot of ${date}.`);
    this.selectedDate = null;
  }

  importLinkedSnapshot() {
    const snapshot = this.linked;
    if (!snapshot) return;
    if (this.change((lb) => addSnapshot(this.fw, lb, snapshot), `The claims from the link were added to your logbook as the snapshot of ${snapshot.date}.`)) {
      this.leaveLink();
      this.selectedDate = snapshot.date;
    }
  }

  leaveLink() {
    this.linked = null;
    this.linkedTarget = null;
    this.linkProblems = [];
    link.clearLink();
  }

  /** @param {Snapshot} snapshot */
  async copySnapshotLink(snapshot) {
    await this.copy(link.snapshotLink(snapshot), 'Link copied. It holds the claims and their date, never evidence.');
  }

  /**
   * @param {string} text
   * @param {string} done
   */
  async copy(text, done) {
    try {
      await navigator.clipboard.writeText(text);
      this.message = done;
    } catch {
      this.message = `Copy this link: ${text}`;
    }
  }

  // Logbook files

  exportLogbook() {
    if (!this.logbook) return;
    const who = this.logbook.person ? `${fileSlug(this.logbook.person)}-` : '';
    saveFile(`${who}logbook-${localToday()}.yaml`, exportLogbook(this.logbook));
    const stored = storage.saveExported(this.logbook, new Date().toISOString());
    this.lastExported = stored.lastExported;
    this.unexported = false;
    this.message = 'Logbook exported. Keep the file somewhere safe.';
  }

  /** @param {CustomEvent<{ text: string, name: string }>} e */
  importFile(e) {
    const result = importLogbook(this.fw, e.detail.text);
    if (!result.ok) {
      this.importErrors = result.errors;
      return;
    }
    if (this.logbook && !confirm(`Replace the logbook in this browser with ${e.detail.name}?`)) return;
    this.importErrors = [];
    this.logbook = result.logbook;
    const stored = storage.saveExported(result.logbook, new Date().toISOString());
    this.lastExported = stored.lastExported;
    this.unexported = false;
    this.selectedDate = null;
    this.targetName = null;
    this.overlay = null;
    const mapped = result.mapped.map((m) => `${m.from} → ${m.to}`).join(', ');
    this.message = `Imported ${e.detail.name}.${mapped ? ` Retired codes were mapped to their replacements: ${mapped}.` : ''}`;
    this.view = 'claims';
  }

  forgetLogbook() {
    if (!confirm('Remove the logbook from this browser? This cannot be undone unless you have exported it.')) return;
    storage.clear();
    this.logbook = null;
    this.lastExported = null;
    this.unexported = false;
    this.view = 'claims';
    this.message = 'The logbook was removed from this browser.';
  }

  // Targets

  /** The target the targets view is showing, if any. */
  currentTarget() {
    if (this.linkedTarget) return this.linkedTarget;
    if (!this.logbook) return this.draftTarget;
    return this.logbook.targets.find((t) => t.name === this.targetName) ?? this.logbook.targets[0] ?? null;
  }

  /**
   * Change the current target: the draft without a logbook, or the selected
   * logbook target.
   * @param {(t: Target) => Target} change
   */
  changeTarget(change) {
    const current = this.currentTarget();
    if (!current || this.linkedTarget) return;
    let next;
    try {
      next = change(current);
    } catch (e) {
      this.message = /** @type {Error} */ (e).message;
      return;
    }
    if (!this.logbook) {
      this.draftTarget = next;
      link.writeTargetLink(next);
      return;
    }
    if (this.change((lb) => replaceTarget(lb, current.name, next))) this.targetName = next.name;
  }

  newTarget() {
    const name = prompt('Name the target (a role, or a personal goal):', '')?.trim();
    if (!name) return;
    if (this.change((lb) => addTarget(this.fw, lb, { name, levels: [] }), `Made the target "${name}". Tick its target levels below.`)) {
      this.targetName = name;
    }
  }

  deleteTarget() {
    const t = this.currentTarget();
    if (!t || !confirm(`Delete the target "${t.name}"?`)) return;
    if (this.change((lb) => removeTarget(lb, t.name), `Deleted the target "${t.name}".`)) {
      this.targetName = null;
      if (this.overlay === t.name) this.overlay = null;
    }
  }

  /** @param {CustomEvent<{ text: string, name: string }>} e */
  importTargetFile(e) {
    const result = importTarget(this.fw, e.detail.text);
    if (!result.ok) {
      this.targetErrors = result.errors;
      return;
    }
    this.targetErrors = [];
    const mapped = result.mapped.length
      ? ` Retired codes were mapped to their replacements: ${result.mapped.map((m) => `${m.from} → ${m.to}`).join(', ')}.`
      : '';
    this.addTargetFromOutside(result.target, `Imported the target "${result.target.name}".${mapped}`);
  }

  /**
   * @param {Target} target
   * @param {string} done
   */
  addTargetFromOutside(target, done) {
    if (!this.logbook) {
      this.draftTarget = target;
      link.writeTargetLink(target);
      this.message = done;
      return;
    }
    if (this.change((lb) => addTarget(this.fw, lb, target), done)) {
      this.targetName = target.name;
      this.leaveLink();
    }
  }

  copyTargetLink() {
    const t = this.currentTarget();
    if (t) this.copy(link.targetLink(t), 'Link to the target copied.');
  }

  exportTarget() {
    const t = this.currentTarget();
    if (t) saveFile(`target-${fileSlug(t.name)}.yaml`, exportTarget(t));
  }

  // Rendering

  render() {
    if (this.loadError) {
      return html`<p class="error">Could not load the framework (${this.loadError}). Run <code>npm run build</code> first.</p>`;
    }
    if (!this.framework) return html`<p class="loading">Loading the framework…</p>`;
    const fw = this.framework;
    const lb = this.logbook;
    const views = lb ? LOGBOOK_VIEWS : QUICK_VIEWS;
    return html`
      <header class="site-header no-print">
        <h1>${fw.framework.name}<span class="subtitle">: ${fw.framework.subtitle}</span></h1>
        <p class="version">Framework version ${fw.framework.version} · ${fw.framework.licence}</p>
      </header>
      <nav class="views no-print" aria-label="Views">
        ${views.map(
          ([id, label]) => html`<button type="button" aria-current=${this.view === id ? 'page' : 'false'} @click=${() => this.go(id)}>${label}</button>`,
        )}
      </nav>
      ${this.message ? html`<p class="notice" role="status">${this.message}</p>` : nothing}
      ${this.linkProblems.length
        ? html`<div class="notice warning" role="alert">
            <p>Parts of the link could not be used:</p>
            <ul>${this.linkProblems.map((p) => html`<li>${p}</li>`)}</ul>
          </div>`
        : nothing}
      ${lb && this.unexported && this.view !== 'files'
        ? html`<p class="notice warning no-print">
            You have changes that are not in an exported file. If this browser's storage is cleared they are lost.
            <button type="button" class="link" @click=${this.exportLogbook}>Export now</button>
          </p>`
        : nothing}
      ${this.renderView()}
    `;
  }

  renderView() {
    const lb = this.logbook;
    switch (this.view) {
      case 'evidence':
        return lb ? this.renderEvidence(lb) : nothing;
      case 'history':
        return lb
          ? html`<div class="toolbar">${this.renderLabelToggle()}</div>
              <stm-history .framework=${this.fw} .logbook=${lb} .labels=${this.labels}></stm-history>`
          : nothing;
      case 'targets':
        return this.renderTargets();
      case 'files':
        return this.renderFiles(lb);
      default:
        if (this.linked && lb) return this.renderLinked(this.linked);
        return lb ? this.renderClaims(lb) : this.renderQuick();
    }
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
        <button type="button" @click=${() => this.copySnapshotLink(q)}>Copy link to these claims</button>
      </div>
      ${this.quickFromLink ? this.plainClaimsNotice(q) : nothing}
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
        <button type="button" class="primary" @click=${this.importLinkedSnapshot}>Add to my logbook as a snapshot</button>
        <button type="button" @click=${this.leaveLink}>Back to my logbook</button>
      </div>
      ${this.plainClaimsNotice(snapshot)}
      <stm-claims-grid .framework=${this.fw} .claims=${this.claimMap(snapshot)} .labels=${this.labels} readonly></stm-claims-grid>
    `;
  }

  /** @param {Logbook} lb */
  renderClaims(lb) {
    const shown = this.shownSnapshot(lb);
    const latest = latestSnapshot(lb);
    const today = localToday();
    const editable = isEditable(shown, today);
    const overlay = lb.targets.find((t) => t.name === this.overlay);
    return html`
      <div class="toolbar">
        ${this.renderLabelToggle()}
        <label
          >Snapshot
          <select @change=${(/** @type {Event} */ e) => (this.selectedDate = /** @type {HTMLSelectElement} */ (e.target).value)}>
            ${[...lb.snapshots].reverse().map(
              (s) => html`<option value=${s.date} ?selected=${s === shown}>${s.date}${s === latest ? ' (latest)' : ''}</option>`,
            )}
          </select>
        </label>
        ${lb.targets.length
          ? html`<label
              >Compare with
              <select @change=${(/** @type {Event} */ e) => (this.overlay = /** @type {HTMLSelectElement} */ (e.target).value || null)}>
                <option value="">no target</option>
                ${lb.targets.map((t) => html`<option ?selected=${t.name === this.overlay}>${t.name}</option>`)}
              </select>
            </label>`
          : nothing}
        <p class="claims-date">${lb.person ? `${lb.person}: ` : ''}${shown.claims.length} claim${shown.claims.length === 1 ? '' : 's'}</p>
        ${lb.snapshots.some((s) => s.date === today)
          ? nothing
          : html`<button type="button" class="primary" @click=${this.makeSnapshot}>New snapshot for today</button>`}
        <button type="button" @click=${() => this.copySnapshotLink(shown)}>Copy link to these claims</button>
        ${lb.snapshots.length > 1 ? html`<button type="button" class="link" @click=${() => this.removeSnapshot(shown.date)}>Delete this snapshot</button>` : nothing}
      </div>
      ${editable
        ? nothing
        : html`<p class="notice" role="status">
            The snapshot of ${shown.date} is fixed: its claims stand as they were made. To change a claim, make a new snapshot for
            today; it starts as a copy of your latest.
          </p>`}
      <p class="legend muted">
        <span class="badge-pill">Badge</span> a level your evidence supports ·
        <span class="unevidenced-pill">Unevidenced</span> claimed levels your evidence doesn't yet reach${overlay
          ? html` · <span class="mark target">outlined</span>: the target level`
          : nothing}. Open a skill to see the evidence behind its badge.
      </p>
      <stm-claims-grid
        .framework=${this.fw}
        .claims=${this.claimMap(shown)}
        .labels=${this.labels}
        ?readonly=${!editable}
        .practice=${(/** @type {string} */ code) => practiceDates(this.fw, lb, code)}
        .status=${Object.fromEntries(snapshotStatus(this.fw, lb, shown).map((st) => [st.code, st]))}
        .target=${overlay ? Object.fromEntries(overlay.levels.map((l) => [l.code, l])) : undefined}
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

  renderTargets() {
    const linked = this.linkedTarget;
    return html`
      ${linked
        ? html`<div class="toolbar">
            <p>This target comes from a link.</p>
            <button type="button" class="primary" @click=${() => this.addTargetFromOutside(linked, `Added the target "${linked.name}" to your logbook.`)}>
              Add to my logbook as a target
            </button>
            <button type="button" @click=${this.leaveLink}>Back to my logbook</button>
          </div>`
        : nothing}
      <div class="toolbar">${this.renderLabelToggle()}</div>
      <stm-targets
        .framework=${this.fw}
        .logbook=${linked ? null : this.logbook}
        .target=${this.currentTarget()}
        .labels=${this.labels}
        .errors=${this.targetErrors}
        ?readonly=${Boolean(linked)}
        @target-level=${(/** @type {CustomEvent<{ code: string, level: number | null }>} */ e) =>
          this.changeTarget((t) =>
            withTargetLevel(this.fw, t, e.detail.code, e.detail.level, t.levels.find((l) => l.code === e.detail.code)?.priority ?? 'essential'),
          )}
        @target-priority=${(/** @type {CustomEvent<{ code: string, priority: 'essential' | 'desirable' }>} */ e) =>
          this.changeTarget((t) => ({ ...t, levels: t.levels.map((l) => (l.code === e.detail.code ? { ...l, priority: e.detail.priority } : l)) }))}
        @target-rename=${(/** @type {CustomEvent<{ name: string }>} */ e) => {
          const name = e.detail.name.trim();
          if (name) this.changeTarget((t) => ({ ...t, name }));
        }}
        @target-select=${(/** @type {CustomEvent<{ name: string }>} */ e) => (this.targetName = e.detail.name)}
        @target-new=${this.newTarget}
        @target-delete=${this.deleteTarget}
        @target-link=${this.copyTargetLink}
        @target-export=${this.exportTarget}
        @target-import=${this.importTargetFile}
      ></stm-targets>
    `;
  }

  /** @param {Logbook | null} lb */
  renderFiles(lb) {
    return html`<stm-files
      .framework=${this.fw}
      .logbook=${lb}
      .lastExported=${this.lastExported}
      .unexported=${this.unexported}
      .errors=${this.importErrors}
      @export-logbook=${this.exportLogbook}
      @import-file=${this.importFile}
      @forget-logbook=${this.forgetLogbook}
    ></stm-files>`;
  }
}

customElements.define('stm-app', App);
