// Aplica nos gabaritos as correções marcadas na ferramenta /corrigir
// (pintar/correcoes.json, ver README, "Corrigir um gabarito").
//
//   node scripts/aplicar-correcoes.mjs            # todas as páginas
//   node scripts/aplicar-correcoes.mjs uni lua-ceu # só estas
//
// Para cada área: tira da tinta em que está e põe na tinta pedida, no
// bloco da página em src/game/pinturaNumeros.js. Os comentários do bloco
// ficam; uma tinta que fica sem área sai; uma que entra vai para o fim (é a
// ordem dos números no jogo). Um `hex` precisa ser o de uma tinta de
// `TINTAS` — cor nova se acrescenta lá antes, com nome.
//
// Correção cujo `antes` não bate com o gabarito de hoje é pulada com aviso
// (o gabarito mudou depois da marcação). As páginas aplicadas saem do
// correcoes.json. Depois: npm run check e scripts/conferir-pintura.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GABARITOS, TINTAS } from '../src/game/pinturaNumeros.js';

const RAIZ = join(import.meta.dirname, '..');
const ARQ_CORR = join(RAIZ, 'pintar', 'correcoes.json');
const ARQ_GAB = join(RAIZ, 'src', 'game', 'pinturaNumeros.js');

const todas = JSON.parse(readFileSync(ARQ_CORR, 'utf8'));
const pedidas = process.argv.slice(2);
const ids = pedidas.length ? pedidas : Object.keys(todas);
const porHex = Object.fromEntries(Object.entries(TINTAS).map(([n, h]) => [h.toLowerCase(), n]));

let fonte = readFileSync(ARQ_GAB, 'utf8');
const problemas = [];
const aplicadas = [];

for (const id of ids) {
  const pagina = todas[id];
  const g = GABARITOS[id];
  if (!pagina) { problemas.push(`${id}: sem correções`); continue; }
  if (!g) { problemas.push(`${id}: sem gabarito`); continue; }

  const listas = Object.fromEntries(Object.entries(g).map(([n, l]) => [n, [...l]]));
  const ondeEsta = (a) => Object.keys(listas).find((n) => listas[n].includes(a));
  const feitas = [];
  let falhou = false;
  for (const [txt, c] of Object.entries(pagina.correcoes)) {
    const a = Number(txt);
    const para = c.cor || porHex[c.hex?.toLowerCase()];
    if (!para || !TINTAS[para]) {
      problemas.push(`${id} área ${a}: ${c.hex || c.cor} não é tinta de TINTAS — acrescente lá antes`);
      falhou = true;
      continue;
    }
    const de = ondeEsta(a);
    if (c.antes && c.antes !== 'sem cor' && de !== c.antes) {
      problemas.push(`${id} área ${a}: marcada sobre "${c.antes}", hoje está em "${de}" — pulei`);
      continue;
    }
    if (de) listas[de] = listas[de].filter((x) => x !== a);
    (listas[para] ||= []).push(a);
    listas[para].sort((x, y) => x - y);
    feitas.push(`${a}: ${de || '—'} → ${para}`);
  }
  if (falhou) continue;

  // Reescreve o bloco da página, linha a linha.
  const chave = /^[a-z]+$/.test(id) ? id : `'${id}'`;
  const inicio = fonte.indexOf(`\n  ${chave}: {\n`);
  const fim = fonte.indexOf('\n  },', inicio + 1);
  if (inicio < 0 || fim < 0) { problemas.push(`${id}: não achei o bloco no pinturaNumeros.js`); continue; }
  const usadas = new Set();
  const linhas = fonte.slice(inicio + 1, fim).split('\n').flatMap((linha) => {
    const m = linha.match(/^ {4}([A-Za-z]+): \[[0-9, ]*\],$/);
    if (!m) return [linha];
    usadas.add(m[1]);
    const l = listas[m[1]];
    return l?.length ? [`    ${m[1]}: [${l.join(', ')}],`] : [];
  });
  for (const [nome, l] of Object.entries(listas)) {
    if (!usadas.has(nome) && l.length) linhas.push(`    ${nome}: [${l.join(', ')}],`);
  }
  fonte = fonte.slice(0, inicio + 1) + linhas.join('\n') + fonte.slice(fim);
  delete todas[id];
  aplicadas.push(`${id}\n    ${feitas.join('\n    ')}`);
}

writeFileSync(ARQ_GAB, fonte);
writeFileSync(ARQ_CORR, `${JSON.stringify(todas, null, 2)}\n`);
if (aplicadas.length) console.log(`aplicadas:\n  ${aplicadas.join('\n  ')}`);
if (problemas.length) console.log(`\n⚠️ ${problemas.join('\n⚠️ ')}`);
