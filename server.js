// Servidor estático mínimo (sem dependências) para abrir o jogo no navegador.
// Uso: npm start  ->  http://localhost:5173
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  // Pasta serve o index.html dela, como na Vercel: é assim que /modelos abre.
  const relative = normalize(urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath)
    .replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, relative);

  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      // Servidor de desenvolvimento: sempre a versão mais nova do arquivo.
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - não encontrado');
  }
}).listen(PORT, () => {
  console.log(`🦄 UnicornRush rodando em http://localhost:${PORT}`);
});
