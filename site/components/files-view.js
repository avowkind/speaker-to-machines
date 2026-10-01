import { LitElement, html, nothing } from 'lit';

/**
 * Import and export of logbook files. Renders in the light DOM.
 *
 * Fires `export-logbook`, `import-file` { text, name } and `forget-logbook`.
 */
export class FilesView extends LitElement {
  static properties = {
    framework: { attribute: false },
    logbook: { attribute: false },
    lastExported: {},
    unexported: { type: Boolean },
    errors: { attribute: false },
  };

  constructor() {
    super();
    /** @type {import('../core/framework.js').Framework | undefined} */
    this.framework = undefined;
    /** @type {import('../core/logbook.js').Logbook | null} */
    this.logbook = null;
    /** @type {string | null} */
    this.lastExported = null;
    this.unexported = false;
    /** @type {string[]} errors from the last import, if it failed */
    this.errors = [];
  }

  createRenderRoot() {
    return this;
  }

  /** @param {Event} e */
  async onFile(e) {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    input.value = '';
    this.dispatchEvent(new CustomEvent('import-file', { detail: { text, name: file.name }, bubbles: true }));
  }

  /** @param {string} name */
  fire(name) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true }));
  }

  render() {
    const fw = this.framework;
    const lb = this.logbook;
    if (!fw) return nothing;
    return html`
      ${lb
        ? html`<section>
            <h2>Export</h2>
            <p>
              Your logbook lives only in this browser. Export it as a YAML file to keep a backup you can read, edit, move to
              another browser or hand to an agent.
            </p>
            <p>
              ${this.lastExported ? html`Last exported ${formatWhen(this.lastExported)}.` : 'Not exported yet.'}
              ${this.unexported ? html`<strong>You have changes that are not in an exported file.</strong>` : nothing}
            </p>
            <button type="button" class="primary" @click=${() => this.fire('export-logbook')}>Export logbook file</button>
            <p class="muted">
              This logbook was made against framework version ${lb.framework_version}; the current framework is version
              ${fw.framework.version}.
              ${lb.framework_version !== fw.framework.version
                ? html`<strong>The framework has changed since: review your claims against the current descriptors.</strong>`
                : nothing}
            </p>
          </section>`
        : nothing}
      <section>
        <h2>Import</h2>
        <p>
          Import a logbook file to restore it or bring it from another browser.
          ${lb ? html`<strong>It replaces the logbook in this browser</strong>, so export first if you want to keep it.` : nothing}
        </p>
        <label class="button">Choose a logbook file… <input type="file" accept=".yaml,.yml,text/yaml" class="visually-hidden" @change=${this.onFile} /></label>
        ${this.errors.length
          ? html`<div class="notice warning" role="alert">
              <p>The file was not imported${lb ? '; your current logbook is unchanged' : ''}:</p>
              <ul>${this.errors.map((e) => html`<li>${e}</li>`)}</ul>
            </div>`
          : nothing}
      </section>
      ${lb
        ? html`<section>
            <h2>Forget this logbook</h2>
            <p>Remove the logbook from this browser. Export it first if you want to keep it.</p>
            <button type="button" @click=${() => this.fire('forget-logbook')}>Remove logbook from this browser</button>
          </section>`
        : nothing}
    `;
  }
}

/** @param {string} iso */
function formatWhen(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

customElements.define('stm-files', FilesView);
