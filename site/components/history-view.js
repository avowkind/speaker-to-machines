import { LitElement, html, nothing } from 'lit';
import { history } from '../core/logbook.js';
import { levelInfo, skillByCode } from '../core/framework.js';

/**
 * Each skill's claimed level across snapshots, with badges as they stood at
 * each snapshot's date and stale claims flagged. Renders in the light DOM.
 */
export class HistoryView extends LitElement {
  static properties = {
    framework: { attribute: false },
    logbook: { attribute: false },
    labels: {},
  };

  constructor() {
    super();
    /** @type {import('../core/framework.js').Framework | undefined} */
    this.framework = undefined;
    /** @type {import('../core/logbook.js').Logbook | undefined} */
    this.logbook = undefined;
    /** @type {'name' | 'title'} */
    this.labels = 'title';
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const fw = this.framework;
    const lb = this.logbook;
    if (!fw || !lb) return nothing;
    const rows = history(fw, lb);
    const dates = rows[0]?.entries.map((e) => e.date) ?? [];
    if (!rows.length) return html`<p class="muted">No claims in any snapshot yet.</p>`;
    /** @param {number} level */
    const label = (level) => {
      const info = levelInfo(fw, level);
      return info ? (this.labels === 'name' ? info.name : info.title) : String(level);
    };
    return html`<table class="list history">
      <thead>
        <tr>
          <th scope="col">Skill</th>
          ${dates.map((d) => html`<th scope="col">${d}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (row) => html`<tr>
            <th scope="row"><span class="code">${row.code}</span> ${skillByCode(fw, row.code)?.name ?? ''}</th>
            ${row.entries.map((e, i) => {
              const prev = row.entries[i - 1];
              const changed = i > 0 && prev.level !== e.level;
              if (e.level === null) return html`<td class="muted">${changed ? 'withdrawn' : '–'}</td>`;
              return html`<td class=${changed ? 'changed' : ''}>
                <strong>${e.level}</strong> ${label(e.level)}
                ${e.badge ? html`<span class="badge-pill" title="Badge as it stood on ${e.date}">${label(e.badge)}</span>` : html`<span class="muted">no badge</span>`}
                ${e.stale ? html`<span class="stale-flag" title="Last practised more than 12 months before ${e.date}">stale</span>` : nothing}
              </td>`;
            })}
          </tr>`,
        )}
      </tbody>
    </table>`;
  }
}

customElements.define('stm-history', HistoryView);
