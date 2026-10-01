import { LitElement, html, nothing } from 'lit';
import { withClaim } from '../core/logbook.js';
import { localToday } from '../core/dates.js';
import * as link from '../adapters/url.js';
import './claims-grid.js';

/**
 * The site's root element. Holds the state, passes it to views, and sends user
 * actions to the logbook core. Renders in the light DOM.
 */
export class App extends LitElement {
  static properties = {
    framework: { state: true },
    loadError: { state: true },
    quick: { state: true },
    fromLink: { state: true },
    linkProblems: { state: true },
    labels: { state: true },
    copied: { state: true },
  };

  constructor() {
    super();
    /** @type {import('../core/framework.js').Framework | undefined} */
    this.framework = undefined;
    /** @type {string} */
    this.loadError = '';
    /** @type {import('../core/url.js').Snapshot} the quick-claims snapshot the URL holds */
    this.quick = { date: localToday(), claims: [] };
    this.fromLink = false;
    /** @type {string[]} */
    this.linkProblems = [];
    /** @type {'name' | 'title'} */
    this.labels = 'title';
    this.copied = false;
  }

  createRenderRoot() {
    return this;
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
    this.readLink();
    link.onLinkChange(() => this.readLink());
  }

  readLink() {
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    const decoded = link.readLink(fw);
    if (decoded.kind === 'snapshot') {
      this.quick = decoded.snapshot;
      this.fromLink = true;
      this.linkProblems = decoded.problems;
    } else if (decoded.kind === 'invalid') {
      this.linkProblems = decoded.problems;
    }
  }

  /** @param {CustomEvent<{ code: string, level: number | null }>} e */
  onClaimChange(e) {
    const fw = /** @type {import('../core/framework.js').Framework} */ (this.framework);
    const { code, level } = e.detail;
    this.quick = withClaim(fw, { ...this.quick, date: localToday() }, code, level);
    this.fromLink = false;
    this.linkProblems = [];
    link.writeSnapshotLink(this.quick);
  }

  async copyLink() {
    link.writeSnapshotLink(this.quick);
    await navigator.clipboard?.writeText(link.currentLink());
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  render() {
    if (this.loadError) {
      return html`<p class="error">Could not load the framework (${this.loadError}). Run <code>npm run build</code> first.</p>`;
    }
    const fw = this.framework;
    if (!fw) return html`<p class="loading">Loading the framework…</p>`;
    return html`
      <header class="site-header">
        <h1>${fw.framework.name}<span class="subtitle">: ${fw.framework.subtitle}</span></h1>
        <p class="version">Framework version ${fw.framework.version} · ${fw.framework.licence}</p>
      </header>
      ${this.renderToolbar()} ${this.renderNotices()}
      <stm-claims-grid
        .framework=${fw}
        .claims=${Object.fromEntries(this.quick.claims.map((c) => [c.code, c.level]))}
        .labels=${this.labels}
        @claim-change=${this.onClaimChange}
      ></stm-claims-grid>
    `;
  }

  renderToolbar() {
    return html`<div class="toolbar">
      <fieldset class="label-toggle">
        <legend>Show levels as</legend>
        <label
          ><input
            type="radio"
            name="labels"
            .checked=${this.labels === 'title'}
            @change=${() => (this.labels = 'title')}
          />
          Titles</label
        >
        <label
          ><input
            type="radio"
            name="labels"
            .checked=${this.labels === 'name'}
            @change=${() => (this.labels = 'name')}
          />
          Plain names</label
        >
      </fieldset>
      <p class="claims-date">
        ${this.quick.claims.length} claim${this.quick.claims.length === 1 ? '' : 's'} as of ${this.quick.date}
      </p>
      <button type="button" @click=${this.copyLink}>${this.copied ? 'Link copied' : 'Copy link to these claims'}</button>
    </div>`;
  }

  renderNotices() {
    return html`
      ${this.fromLink
        ? html`<p class="notice plain-claims" role="status">
            These claims come from a link. They are plain claims as of ${this.quick.date}: a link never
            carries evidence, so no badges are shown.
          </p>`
        : nothing}
      ${this.linkProblems.length
        ? html`<div class="notice warning" role="alert">
            <p>Parts of the link could not be used:</p>
            <ul>
              ${this.linkProblems.map((p) => html`<li>${p}</li>`)}
            </ul>
          </div>`
        : nothing}
    `;
  }
}

customElements.define('stm-app', App);
