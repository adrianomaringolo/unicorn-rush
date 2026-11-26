// Servidor estático mínimo (sem dependências) para abrir o jogo no navegador.
// Uso: npm start  ->  http://localhost:5173
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
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

// As correções dos gabaritos de pintar, marcadas na ferramenta /corrigir.
// Só este servidor sabe gravar (na Vercel o arquivo é estático e a página
// avisa que não funciona); e só aceita pedido vindo do próprio computador.
//
// O arquivo: { "<id do desenho>": { "areas": 69, "correcoes": {
//   "<área>": { "cor": "lilasClaro" | "hex": "#aabbcc", "antes": "branco",
//               "nota": "…", "quando": "2026-11-26T…" } } } }
// Quem aplica no pinturaNumeros.js é o Claude (ver README, "Corrigir").
const CORRECOES = join(ROOT, 'pintar', 'correcoes.json');
const local = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

async function lerCorrecoes() {
  try { return JSON.parse(await readFile(CORRECOES, 'utf8')); } catch { return {}; }
}

async function correcoes(req, res) {
  const responder = (status, corpo) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(corpo));
  };
  if (!local(req)) return responder(403, { erro: 'só no computador' });
  if (req.method === 'GET') return responder(200, await lerCorrecoes());
  if (req.method !== 'POST') return responder(405, { erro: 'GET ou POST' });

  let texto = '';
  for await (const parte of req) { texto += parte; if (texto.length > 1e5) return responder(413, { erro: 'grande demais' }); }
  let p;
  try { p = JSON.parse(texto); } catch { return responder(400, { erro: 'JSON inválido' }); }
  const { id, areas, area, cor, hex, antes, nota } = p;
  if (!/^[a-z0-9-]+$/.test(id || '') || !Number.isInteger(area) || area < 0) return responder(400, { erro: 'id/área' });
  if (hex !== undefined && !/^#[0-9a-f]{6}$/i.test(hex)) return responder(400, { erro: 'hex' });

  const tudo = await lerCorrecoes();
  const pagina = tudo[id] ||= { areas, correcoes: {} };
  if (areas && pagina.areas !== areas) {
    // O PNG mudou: as áreas de antes não são mais as mesmas.
    pagina.areas = areas;
    pagina.correcoes = {};
  }
  if (!cor && !hex) delete pagina.correcoes[area];          // desfazer a correção
  else {
    pagina.correcoes[area] = {
      ...(cor ? { cor } : { hex: hex.toLowerCase() }),
      ...(antes ? { antes } : {}),
      ...(nota ? { nota: String(nota).slice(0, 300) } : {}),
      quando: new Date().toISOString(),
    };
  }
  // Áreas em ordem numérica, para o arquivo ler bem.
  pagina.correcoes = Object.fromEntries(Object.entries(pagina.correcoes).sort((a, b) => a[0] - b[0]));
  if (!Object.keys(pagina.correcoes).length) delete tudo[id];
  await writeFile(CORRECOES, `${JSON.stringify(tudo, null, 2)}\n`);
  return responder(200, tudo);
}

createServer(async (req, res) => {
  if (req.url.split('?')[0] === '/__correcoes') return correcoes(req, res);
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
