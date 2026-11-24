// O mapa das áreas de uma página de pintar, para montar o gabarito da
// pintura por números (src/game/pinturaNumeros.js): o desenho com o número
// de cada área escrito no meio dela. Se o desenho já tem gabarito, cada área
// sai pintada com a cor dele — dá para conferir o gabarito de olho.
//
//   node scripts/mapa-areas.mjs uni-campo > _mapa.svg
//
// e abra o _mapa.svg no navegador (ele aponta para o PNG em assets/pintar/,
// então salve na raiz do projeto). Números em vermelho são de áreas
// pequenas: confira de perto o que elas são (o brilho do olho, uma fresta).
import { fileURLToPath } from 'node:url';
import { lerPng } from './png.mjs';
import { DESENHO, dividirEmAreas, centrosDasAreas } from '../src/game/pintura.js';
import { GABARITOS, gabarito, conferirGabarito } from '../src/game/pinturaNumeros.js';

const id = process.argv[2];
const desenho = DESENHO[id];
if (!desenho) {
  console.error(`uso: node scripts/mapa-areas.mjs <id>   (ids: ${Object.keys(DESENHO).join(', ')})`);
  process.exit(1);
}
const { largura: L, altura: A, pixels } = lerPng(fileURLToPath(new URL(`../${desenho.arquivo}`, import.meta.url)));
const pagina = dividirEmAreas(pixels, L, A);
const { centro, raio } = centrosDasAreas(pagina);
const g = GABARITOS[id] ? gabarito(id, pagina.areas) : null;
const erros = g ? conferirGabarito(id, pagina.areas) : [];

// As áreas com cor viram retângulos de 1 linha (uma "corrida" de pixels
// seguidos da mesma área): um SVG grande, mas que abre em qualquer lugar.
let corridas = '';
if (g && !erros.length) {
  for (let y = 0; y < A; y++) {
    let x = 0;
    while (x < L) {
      const a = pagina.regiao[y * L + x];
      let fim = x + 1;
      while (fim < L && pagina.regiao[y * L + fim] === a) fim++;
      if (a >= 0) corridas += `<rect x="${x}" y="${y}" width="${fim - x}" height="1" fill="${g.cores[g.alvo[a]]}"/>`;
      x = fim;
    }
  }
}
const numeros = [...centro].map((c, a) => {
  const x = c % L; const y = Math.floor(c / L);
  const cor = raio[a] < 16 ? '#c00' : '#003';
  const rotulo = g && !erros.length ? `${a}·${g.nomes[g.alvo[a]]}` : String(a);
  return `<text x="${x}" y="${y}" fill="${cor}">${rotulo}</text>`;
}).join('');

console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}">`
  + `<rect width="${L}" height="${A}" fill="#fff"/>${corridas}`
  + `<image href="${desenho.arquivo}" width="${L}" height="${A}" style="mix-blend-mode:multiply"/>`
  + `<g font-family="sans-serif" font-weight="700" font-size="20" text-anchor="middle" dominant-baseline="middle" stroke="#fff" stroke-width="4" paint-order="stroke">${numeros}</g></svg>`);
console.error(`${id}: ${pagina.areas} áreas${g ? (erros.length ? `; gabarito com problema: ${erros.join(' | ')}` : '; gabarito ok') : '; sem gabarito ainda'}`);
