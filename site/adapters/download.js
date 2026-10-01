/** Save text as a file on the person's own machine. Nothing is uploaded. */

/**
 * @param {string} filename
 * @param {string} text
 * @param {string} [type]
 */
export function saveFile(filename, text, type = 'text/yaml') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
