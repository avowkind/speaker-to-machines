# Node for the build, Lit web components for the site

The build (validation, bundling, the review document) is written in Node rather than kept in Python. The site and the validator then share one module that loads and checks framework data, so the rules for a valid skill file exist once, and a future maintenance interface can validate in the browser with the same code.

The site is built from Lit web components, served as plain ES modules with vendored dependencies and no build step. Types are JSDoc annotations checked by tsc in CI. We chose web components over React, Preact or Svelte because a badge or profile can then be embedded in anyone's page with one script tag, and because standard custom elements fit a static site meant to last for years. Print views and forms render in the light DOM, because shadow DOM scoping gets in the way of print styles and native form participation. Shadow DOM is kept for embeddable components.
