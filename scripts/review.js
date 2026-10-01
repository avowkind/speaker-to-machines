/** Render the review document: every skill with its levels, for human review. */

/** @param {import('../site/core/framework.js').Framework} fw */
export function renderReview(fw) {
  const title = Object.fromEntries(fw.levels.map((l) => [String(l.level), l.title]));
  const out = [
    `# ${fw.framework.name}: skills and level descriptions (review copy)`,
    '',
    'Generated from the YAML files in data/ by `npm run build`. Do not edit here.',
    '',
  ];
  for (const cat of fw.categories) {
    out.push(`## ${cat.name}`, '');
    for (const sub of cat.subcategories) {
      for (const s of sub.skills) {
        const [lo, hi] = s.level_range;
        out.push(`### ${s.code} ${s.name} (levels ${lo}-${hi})`, '', s.description, '');
        for (const [k, text] of Object.entries(s.levels)) out.push(`- ${k} ${title[k]}: ${text}`);
        if (s.examples.items.length) {
          out.push('', `Examples (${s.examples.as_of}): ${s.examples.items.join(', ')}`);
        }
        out.push('');
      }
    }
  }
  return out.join('\n');
}
