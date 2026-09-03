// Gera a imagem de anúncio do jogo: os 22 unicórnios posando atrás do
// letreiro, cada um numa pose diferente.
//
// Abre `scripts/anuncio.html` num Chrome sem janela, deixa a cena montar e
// pede o PNG do próprio canvas — não uma foto da janela, senão o tamanho da
// imagem passaria a depender do tamanho da janela do navegador.
//
// Uso: npm run anuncio            (2400x1350)
//      npm run anuncio -- 3840x2160
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..');
const TAMANHO = process.argv.find((a) => /^\d+x\d+$/.test(a)) || '2400x1350';
// A cena empresta o céu e o chão de uma pista do jogo: `npm run anuncio --
// noite` dá o mesmo anúncio de madrugada.
const PISTA = process.argv.slice(2).find((a) => !/^\d+x\d+$/.test(a)) || 'campo';
const SAIDA = join(RAIZ, `assets/anuncio/unicornrush-${PISTA}.png`);
const PORTA = 5198;

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
].find(existsSync);

if (!CHROME) {
  console.error('❌ Chrome não encontrado — é ele que renderiza a cena.');
  process.exit(1);
}

// Servidor só para esta geração: a página usa módulos, e módulo não abre
// por file:// (o navegador barra por CORS).
const servidor = spawn(process.execPath, [join(RAIZ, 'server.js')], {
  env: { ...process.env, PORT: String(PORTA) },
  stdio: 'ignore',
});
const parar = () => servidor.kill();
process.on('exit', parar);

await new Promise((r) => setTimeout(r, 700));

console.log(`🎨 montando a cena na pista ${PISTA}, em ${TAMANHO}…`);
const chrome = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--enable-unsafe-swiftshader',
  '--virtual-time-budget=40000', '--dump-dom',
  `http://localhost:${PORTA}/scripts/anuncio.html?exportar&tamanho=${TAMANHO}&pista=${PISTA}`,
], { encoding: 'buffer', maxBuffer: 512 * 1024 * 1024 });

parar();

const html = chrome.stdout.toString('utf8');

// A página anuncia no `<title>` as duas coisas que dão errado sem parecer
// erro: a fonte do jogo não carregar e um unicórnio novo ficar de fora.
const titulo = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
if (titulo.includes('FALTOU')) {
  console.error(`❌ a fonte Fredoka não carregou — o nome sairia com outra letra (${titulo})`);
  process.exit(1);
}
const [, naFoto, total] = titulo.match(/unicornios:(\d+)\/(\d+)/) || [];
if (naFoto !== total) {
  console.error(`❌ ${total - naFoto} unicórnio(s) ficaram de fora da foto (${titulo})`);
  process.exit(1);
}

const b64 = html.match(/<div id="png"[^>]*>([^<]*)<\/div>/)?.[1];
if (!b64) {
  console.error('❌ o Chrome não devolveu a imagem. Saída:\n', html.slice(0, 700));
  process.exit(1);
}

mkdirSync(join(RAIZ, 'assets/anuncio'), { recursive: true });
writeFileSync(SAIDA, Buffer.from(b64, 'base64'));
console.log(`✅ assets/anuncio/unicornrush-${PISTA}.png — ${TAMANHO}, ${Math.round(statSync(SAIDA).size / 1024)} KB`);
console.log(`   ${titulo}`);
