/** A static file server for trying the site locally: node scripts/serve.js [port] */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../site/', import.meta.url));
const port = Number(process.argv[2] ?? 8080);
/** @type {Record<string, string>} */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  const file = join(site, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(site)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    // Like GitHub Pages, allow other origins, so badge.js can be embedded elsewhere.
    res
      .writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'access-control-allow-origin': '*' })
      .end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Serving site/ at http://localhost:${port}/`));
