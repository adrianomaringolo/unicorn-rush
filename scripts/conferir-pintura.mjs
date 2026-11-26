// Conferência da pintura por números: pinta cada página inteira com o
// gabarito (como ela fica pronta, já com as áreas miúdas automáticas) e
// procura o que dá para achar sem olhar. Rode sempre que entrar ou mudar um
// desenho (ver CLAUDE.md, "Desenho novo de pintar"):
//
//   node scripts/conferir-pintura.mjs              (todas as páginas)
//   node scripts/conferir-pintura.mjs uni-campo    (só essas)
//
// Grava em _conferencia/ (fora do git):
//   <id>.png    — a página pronta, com um círculo vermelho em cada ponto
//                 suspeito;
//   todas.png   — todas as páginas lado a lado, pequenas.
//
// O que ele acha sozinho:
//   - gabarito que não fecha (área sem cor, repetida, tinta que não existe);
//   - papel sem cor: um pedaço de papel que não é área de ninguém (um
//     fiapo menor que MIN_AREA longe das vizinhas) e fica branco puro no
//     desenho pronto;
//   - vazamento: uma área que não é o fundo e cobre um pedaço enorme da
//     página — sinal de brecha no contorno;
//   - (só para conferir) área automática grande: fina, pinta sozinha, mas
//     comprida — normal num palito ou na parte branca do olho;
//   - paleta com mais de 15 cores (as prontas somem da fileira, então ela encolhe).
// O que só se vê olhando — cor certa no lugar errado, olho sem cor, nuvem
// verde — fica para a conferência de olho nas imagens.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lerPng, escreverPng } from './png.mjs';
import { DESENHOS, DESENHO, dividirEmAreas, centrosDasAreas } from '../src/game/pintura.js';
import { gabarito, conferirGabarito, automaticas } from '../src/game/pinturaNumeros.js';

const PASTA = fileURLToPath(new URL('../_conferencia/', import.meta.url));
const ESCURO = 170;            // o mesmo de pintura.js: abaixo disso é linha
const PAPEL_SEM_COR = 15;      // pixels juntos de papel sem dono que já aparecem
const VAZAMENTO = 0.2;         // área (fora o fundo) com mais que isso da página
const AUTO_GRANDE = 1500;      // área automática com mais pixels que isso

const rgb = (hex) => { const v = parseInt(hex.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };

function conferirPagina(id) {
  const desenho = DESENHO[id];
  const { largura: L, altura: A, pixels } = lerPng(fileURLToPath(new URL(`../${desenho.arquivo}`, import.meta.url)));
  const p = dividirEmAreas(pixels, L, A);
  const avisos = [];
  const pontos = [];           // [x, y] dos círculos vermelhos
  const conferir = [];         // não é erro, mas vale um olhar
  const erros = conferirGabarito(id, p.areas);
  if (erros.length) return { id, avisos: erros.map((e) => `gabarito: ${e}`), pontos, L, A, imagem: null };

  const g = gabarito(id, p.areas);
  const { centro, raio } = centrosDasAreas(p);
  const auto = automaticas(g, raio, L);
  if (g.cores.length > 15) avisos.push(`paleta com ${g.cores.length} cores (máximo 15)`);

  // A página pronta: a cor embaixo, o desenho por cima, multiplicando.
  const dono = new Int32Array(L * A).fill(-1);
  p.pixels.forEach((lista, a) => { for (const j of lista) dono[j] = a; });
  const img = new Uint8Array(L * A * 3);
  for (let i = 0; i < L * A; i++) {
    const c = dono[i] >= 0 ? rgb(g.cores[g.alvo[dono[i]]]) : [255, 255, 255];
    for (let k = 0; k < 3; k++) img[i * 3 + k] = (pixels[i * 4 + k] * c[k]) / 255;
  }

  // Papel sem cor: pixel claro sem área, em grupos.
  const visto = new Uint8Array(L * A);
  for (let i = 0; i < L * A; i++) {
    if (visto[i] || dono[i] >= 0) continue;
    const k = i * 4;
    if (0.299 * pixels[k] + 0.587 * pixels[k + 1] + 0.114 * pixels[k + 2] < ESCURO) continue;
    const pilha = [i]; visto[i] = 1;
    let n = 0; let sx = 0; let sy = 0;
    while (pilha.length) {
      const j = pilha.pop(); n++; sx += j % L; sy += Math.floor(j / L);
      const x = j % L;
      for (const v of [j - L, j + L, x > 0 ? j - 1 : -1, x < L - 1 ? j + 1 : -1]) {
        if (v < 0 || v >= L * A || visto[v] || dono[v] >= 0) continue;
        const kv = v * 4;
        if (0.299 * pixels[kv] + 0.587 * pixels[kv + 1] + 0.114 * pixels[kv + 2] < ESCURO) continue;
        visto[v] = 1; pilha.push(v);
      }
    }
    if (n >= PAPEL_SEM_COR) {
      const x = Math.round(sx / n); const y = Math.round(sy / n);
      avisos.push(`papel sem cor: ${n} px em (${x}, ${y})`);
      pontos.push([x, y]);
    }
  }

  // Vazamento: área que não é o fundo (a 0) e cobre um pedação da página.
  for (let a = 1; a < p.areas; a++) {
    if (p.pixels[a].length > VAZAMENTO * L * A) {
      const x = centro[a] % L; const y = Math.floor(centro[a] / L);
      avisos.push(`área ${a} (${g.nomes[g.alvo[a]]}) cobre ${Math.round((100 * p.pixels[a].length) / (L * A))}% da página: vazou?`);
      pontos.push([x, y]);
    }
  }

  // Área automática grande: fina, mas comprida.
  for (const a of Object.keys(auto).map(Number)) {
    if (p.pixels[a].length > AUTO_GRANDE) {
      const x = centro[a] % L; const y = Math.floor(centro[a] / L);
      conferir.push(`área ${a} (${g.nomes[g.alvo[a]]}) em (${x}, ${y}) pinta sozinha e tem ${p.pixels[a].length} px: faixa fina e comprida — ok se for detalhe`);
    }
  }

  // Os círculos vermelhos.
  for (const [cx, cy] of pontos) {
    for (let t = 0; t < 360; t += 0.5) {
      for (const r of [26, 27, 28, 29]) {
        const x = Math.round(cx + r * Math.cos((t * Math.PI) / 180));
        const y = Math.round(cy + r * Math.sin((t * Math.PI) / 180));
        if (x >= 0 && y >= 0 && x < L && y < A) img.set([230, 0, 0], (y * L + x) * 3);
      }
    }
  }
  return { id, avisos, conferir, pontos, L, A, imagem: img, areas: p.areas, cores: g.cores.length, automaticas: Object.keys(auto).length };
}

// Todas lado a lado, cada uma reduzida para caber num quadrado de LADO px.
function mosaico(resultados) {
  const LADO = 400; const COLS = 4;
  const lin = Math.ceil(resultados.length / COLS);
  const W = LADO * COLS; const H = LADO * lin;
  const out = new Uint8Array(W * H * 3).fill(255);
  resultados.forEach((r, n) => {
    if (!r.imagem) return;
    const esc = Math.max(r.L, r.A) / (LADO - 8);
    const ox = (n % COLS) * LADO + 4; const oy = Math.floor(n / COLS) * LADO + 4;
    for (let y = 0; y < Math.floor(r.A / esc); y++) {
      for (let x = 0; x < Math.floor(r.L / esc); x++) {
        // média de um bloquinho de pixels: reduz sem serrilhar
        let s0 = 0; let s1 = 0; let s2 = 0; let q = 0;
        for (let yy = Math.floor(y * esc); yy < Math.floor((y + 1) * esc); yy++) {
          for (let xx = Math.floor(x * esc); xx < Math.floor((x + 1) * esc); xx++) {
            const k = (yy * r.L + xx) * 3; s0 += r.imagem[k]; s1 += r.imagem[k + 1]; s2 += r.imagem[k + 2]; q++;
          }
        }
        out.set([s0 / q, s1 / q, s2 / q], ((oy + y) * W + ox + x) * 3);
      }
    }
  });
  escreverPng(`${PASTA}todas.png`, W, H, out);
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : DESENHOS.map((d) => d.id);
const desconhecido = ids.find((id) => !DESENHO[id]);
if (desconhecido) {
  console.error(`não conheço "${desconhecido}" (ids: ${DESENHOS.map((d) => d.id).join(', ')})`);
  process.exit(1);
}
mkdirSync(PASTA, { recursive: true });
const resultados = ids.map(conferirPagina);
let problemas = 0;
for (const r of resultados) {
  if (r.imagem) escreverPng(`${PASTA}${r.id}.png`, r.L, r.A, r.imagem);
  const cabeca = r.imagem ? `${r.areas} áreas, ${r.cores} cores, ${r.automaticas} automáticas` : 'sem imagem';
  console.log(`${r.avisos.length ? '⚠️ ' : '✅'} ${r.id}: ${cabeca}`);
  for (const a of r.avisos) console.log(`     ${a}`);
  for (const a of r.conferir || []) console.log(`     (confira) ${a}`);
  problemas += r.avisos.length;
}
mosaico(resultados);
console.log(`\nimagens em _conferencia/ — confira de olho cada página (cor no lugar certo, olhos, nada branco puro).`);
if (problemas) console.log(`${problemas} aviso(s) automático(s) acima.`);
