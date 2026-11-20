// Gera os ícones do jogo em SVG (assets/icones/) e, se pedido, uma folha de
// prova com todos eles: `node scripts/icones/gerar.mjs [folha.html]`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icone } from './base.mjs';
import { INTERFACE } from './interface.mjs';
import { NATUREZA } from './natureza.mjs';
import { OBJETOS } from './objetos.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PASTA = join(RAIZ, 'assets/icones');

export const GRUPOS = [
  ['Interface', INTERFACE],
  ['Natureza, comida e bichos', NATUREZA],
  ['Objetos, gente e bandeiras', OBJETOS],
];

mkdirSync(PASTA, { recursive: true });
let total = 0;
for (const [, grupo] of GRUPOS) {
  for (const [nome, { desenho }] of Object.entries(grupo)) {
    writeFileSync(join(PASTA, `${nome}.svg`), icone(desenho));
    total++;
  }
}
console.log(`${total} ícones em ${relative(RAIZ, PASTA)}/`);

const folha = process.argv[2];
if (folha) {
  const src = (nome) => `${relative(dirname(resolve(folha)), PASTA)}/${nome}.svg`;
  const todos = GRUPOS.flatMap(([, grupo]) => Object.keys(grupo));
  const secoes = GRUPOS.map(([titulo, grupo]) => `
    <h2>${titulo} <small>${Object.keys(grupo).length}</small></h2>
    <div class="grade">${Object.entries(grupo).map(([nome, { emoji }]) => `
      <figure><img src="${src(nome)}" alt="${emoji}"><figcaption>${emoji} <span>${nome}</span></figcaption></figure>`).join('')}
    </div>`).join('');
  writeFileSync(folha, `<!doctype html><meta charset="utf-8"><title>Ícones UnicornRush</title>
<style>
  body { margin: 0; padding: 28px 32px 40px; font-family: 'Fredoka', system-ui, sans-serif; background: #fff6fb; color: #45276a; }
  h1 { margin: 0 0 4px; font-size: 30px; color: #ff4f88; }
  h1 + p { margin: 0 0 18px; opacity: .7; }
  h2 { margin: 26px 0 10px; font-size: 18px; } h2 small { opacity: .5; font-weight: 500; }
  .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 12px; }
  figure { margin: 0; background: #fff; border: 3px solid #f3dcef; border-radius: 18px; padding: 12px 6px 8px; text-align: center; }
  figure img { width: 76px; height: 76px; display: block; margin: 0 auto 6px; }
  figcaption { font-size: 15px; } figcaption span { display: block; font-size: 10px; opacity: .55; word-break: break-all; }
  .real { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 16px; border-radius: 18px; background: #fff; border: 3px solid #f3dcef; }
  .real.roxo { background: #7a4ec7; border-color: #7a4ec7; margin-top: 10px; }
  .real img { width: 28px; height: 28px; }
</style>
<h1>Ícones do UnicornRush</h1>
<p>${total} ícones · SVG 128×128 · contorno roxo, gradiente e reflexo de bala de goma</p>
${secoes}
<h2>No tamanho do jogo <small>28px</small></h2>
<div class="real">${todos.map((n) => `<img src="${src(n)}">`).join('')}</div>
<div class="real roxo">${todos.map((n) => `<img src="${src(n)}">`).join('')}</div>`);
  console.log(`folha de prova: ${folha}`);
}
