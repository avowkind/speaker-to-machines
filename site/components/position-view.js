import { LitElement, html, nothing } from 'lit';

/**
 * A role template as a print-ready position description, using plain level
 * names, essential skills before desirable ones. Needs no logbook. Renders in
 * the light DOM so print styles reach it.
 */
export class PositionView extends LitElement {
  static properties = {
    pd: { attribute: false },
  };

  constructor() {
    super();
    /** @type {import('../core/logbook.js').PositionDescription | undefined} */
    this.pd = undefined;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const pd = this.pd;
    if (!pd) return nothing;
    /** @param {'essential' | 'desirable'} priority @param {string} heading */
    const group = (priority, heading) => {
      const levels = pd.levels.filter((l) => l.priority === priority);
      if (!levels.length) return nothing;
      return html`<h2 class="section-title">${heading}</h2>
        ${levels.map(
          (l) => html`<section class="skill">
            <h3>${l.name} (${l.code}): ${l.level_name}, level ${l.level}</h3>
            <p>${l.descriptor}</p>
            <p class="meta">${l.description}</p>
          </section>`,
        )}`;
    };
    return html`<article class="document position-description">
      <h1>${pd.name}</h1>
      <p class="meta">AI skills for this role, described with the ${pd.framework.name} framework (version ${pd.framework.version}).</p>
      ${pd.levels.length ? nothing : html`<p>This role template has no target levels yet.</p>`}
      ${group('essential', 'Essential AI skills')} ${group('desirable', 'Desirable AI skills')}
    </article>`;
  }
}

customElements.define('stm-position', PositionView);
