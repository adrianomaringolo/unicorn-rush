// Grava a animação da tela de carregamento.
//
// Abre `scripts/gravar-uni.html` num Chrome sem janela, pede um quadro por
// vez do modelo 3D da Uni galopando e junta tudo num WebP animado —
// `assets/loading/uni.webp`, que o index.html mostra enquanto o jogo carrega.
//
// Uso: npm run gravar-uni     (precisa do Google Chrome e do img2webp)
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..');
const SAIDA = join(RAIZ, 'assets/loading/uni.webp');
const TEMP = join(RAIZ, '.quadros-uni');
const PORTA = 5199;
const FPS = 24;
const QUALIDADE = 72;

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
].find(existsSync);

if (!CHROME) {
  console.error('❌ Chrome não encontrado — é ele que renderiza os quadros.');
  process.exit(1);
}

// Servidor só para esta gravação: o HTML usa módulos, e módulo não abre por
// file:// (o navegador barra por CORS).
const servidor = spawn(process.execPath, [join(RAIZ, 'server.js')], {
  env: { ...process.env, PORT: String(PORTA) },
  stdio: 'ignore',
});
const parar = () => servidor.kill();
process.on('exit', parar);

await new Promise((r) => setTimeout(r, 700));

rmSync(TEMP, { recursive: true, force: true });
mkdirSync(TEMP, { recursive: true });

// A própria página monta os quadros num <div> escondido (ver o ?gravar
// em scripts/gravar-uni.html); aqui é só ler o HTML que o Chrome imprime.
console.log('🎬 renderizando os quadros…');
const chrome = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--enable-unsafe-swiftshader',
  '--virtual-time-budget=30000', '--dump-dom',
  `http://localhost:${PORTA}/scripts/gravar-uni.html?gravar`,
], { encoding: 'buffer', maxBuffer: 512 * 1024 * 1024 });

parar();

const html = chrome.stdout.toString('utf8');
const bruto = html.match(/<div id="quadros"[^>]*>([^<]*)<\/div>/);
if (!bruto) {
  console.error('❌ o Chrome não devolveu os quadros. Saída:\n', html.slice(0, 800));
  process.exit(1);
}

const quadros = bruto[1].split('|').filter(Boolean);
console.log(`   ${quadros.length} quadros`);
quadros.forEach((b64, i) => {
  writeFileSync(join(TEMP, `${String(i).padStart(3, '0')}.png`), Buffer.from(b64, 'base64'));
});

mkdirSync(join(RAIZ, 'assets/loading'), { recursive: true });
const atraso = Math.round(1000 / FPS);
const arquivos = quadros.map((_, i) => join(TEMP, `${String(i).padStart(3, '0')}.png`));
const webp = spawnSync('img2webp', [
  '-loop', '0', '-lossy', '-q', String(QUALIDADE), '-m', '6',
  '-d', String(atraso), ...arquivos, '-o', SAIDA,
], { encoding: 'utf8' });

if (webp.status !== 0) {
  console.error('❌ img2webp falhou:', webp.stderr || webp.error?.message);
  process.exit(1);
}

rmSync(TEMP, { recursive: true, force: true });
const { size } = await import('node:fs').then((fs) => fs.statSync(SAIDA));
console.log(`✅ assets/loading/uni.webp — ${quadros.length} quadros, ${Math.round(size / 1024)} KB`);
