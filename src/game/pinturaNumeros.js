// Os gabaritos da pintura por números (ver pintura.js): para cada desenho,
// que cor vai em cada área. A paleta da página sai daqui, na ordem em que
// as cores aparecem — a primeira é o número 1, a segunda o 2, e assim por
// diante —, e `branco` (sem número) é o que fica do jeito que está: o
// brilho do olho, o corpo da Uni, as nuvens.
//
// As áreas são as de `dividirEmAreas`, pelo número (o índice): o mesmo PNG
// dá sempre as mesmas áreas. Se o desenho mudar, o `npm run check` avisa
// (toda área tem de aparecer uma vez, nem mais nem menos) e o gabarito
// precisa ser refeito — a receita está no README, em "Pintar".

// As cores de todos os gabaritos. Cada página usa só algumas.
export const TINTAS = {
  ceu: '#c9ecff',
  noite: '#5a63c8',
  rosa: '#ff8fbf',
  vermelho: '#ff5a5f',
  laranja: '#ff9a3c',
  dourado: '#ffc93c',
  amarelo: '#fff07a',
  creme: '#fff1c9',
  cremeClaro: '#fff8e6',
  areia: '#f3d6a0',
  verdeClaro: '#b6ec9a',
  verde: '#4fc46c',
  azulClaro: '#9fd9ff',
  azul: '#4f8ff0',
  lilasClaro: '#efe6ff',
  lilas: '#d4b8ff',
  roxo: '#a46cf0',
  cinza: '#c3c6d4',
  cinzaEscuro: '#6a6d80',
  marrom: '#b0703c',
};

export const GABARITOS = {
  uni: {
    // 32 é o fundo aparecendo entre a cauda e a perna, não uma mecha.
    ceu: [0, 32],
    cremeClaro: [5, 35, 36],
    rosa: [9, 12, 16, 24, 29],
    laranja: [10, 27],
    amarelo: [2, 6, 7, 11, 23, 28, 30],
    verde: [4, 19, 31],
    azul: [8, 14],
    roxo: [22, 26],
    dourado: [1, 3, 37, 38, 39, 40],
    lilas: [13, 15, 25],
    branco: [17, 18, 20, 21, 33, 34],
  },
  'uni-arco-iris': {
    ceu: [0],
    rosa: [2, 4, 7, 12, 16, 24, 27, 31, 33, 35],
    vermelho: [46, 48, 51],
    laranja: [9, 21, 32, 42, 50],
    amarelo: [3, 8, 11, 28, 38, 52],
    verde: [13, 15, 53],
    azul: [18, 25, 36, 56],
    roxo: [20, 22, 30, 37],
    lilas: [6, 23, 29],
    dourado: [1, 5, 41, 44, 47, 49],
    branco: [10, 14, 17, 19, 26, 34, 39, 40, 43, 45, 54, 55, 57],
  },
  'uni-campo': {
    ceu: [0],
    amarelo: [6, 7, 11, 18, 34, 47, 51, 72, 80, 81, 88],
    laranja: [1, 3, 4, 8, 9, 14, 15, 16, 19, 39],
    dourado: [5, 10, 44, 66, 68, 70],
    rosa: [12, 21, 30, 32, 36, 40, 43, 46, 49, 61, 65, 67, 69, 77, 79],
    vermelho: [35],
    verdeClaro: [28, 38, 62, 87, 93, 98, 100, 101, 102, 103, 106],
    verde: [17, 26, 50, 52, 90, 91, 94, 96, 97, 99, 104, 105],
    azul: [20, 25, 27, 54, 82, 83, 89, 92, 95],
    roxo: [22, 41, 45, 56, 71, 74, 76, 84, 85],
    lilas: [23, 33, 37, 48, 73, 75, 78, 86],
    branco: [2, 13, 24, 29, 31, 42, 53, 55, 57, 58, 59, 60, 63, 64],
  },
  'sol-amanhecer': {
    ceu: [0],
    rosa: [17, 50, 54, 56, 63, 65],
    vermelho: [16, 20, 22, 26, 41],
    laranja: [1, 5, 6, 9, 11, 18, 21, 27, 30, 32, 34, 39],
    dourado: [25, 35, 38, 44, 46, 48],
    amarelo: [3, 7, 8, 12, 13, 15, 19, 24, 29, 31, 33, 45, 58, 59, 60],
    creme: [10, 28, 36, 37, 40],
    verdeClaro: [47, 73, 74, 75],
    verde: [42, 43, 67, 68, 69, 70, 71, 72],
    azul: [14, 49, 52, 53, 61, 62],
    roxo: [23, 51, 55, 57, 64, 66],
    branco: [2, 4],
  },
  'sol-pomar': {
    ceu: [0, 17, 32, 61],
    rosa: [43],
    vermelho: [9, 22, 24, 26, 49, 51, 57, 76],
    laranja: [10, 16, 25, 28, 29, 38, 44, 45, 53, 56],
    dourado: [37, 60, 80, 81, 84, 86, 87, 88, 90, 92, 95],
    amarelo: [8, 12, 21, 23, 30, 31, 35, 47, 50, 54, 58, 62, 75],
    creme: [19, 27, 52, 65, 66, 74],
    verdeClaro: [4, 7, 11, 13, 14, 36, 40, 73, 82],
    verde: [2, 39, 42, 46, 55, 63, 68, 69, 70, 77, 78],
    azul: [33],
    roxo: [67],
    lilas: [48],
    marrom: [5, 6, 15, 18, 20, 41, 59, 64, 71, 72, 79, 83, 85, 89, 91, 93, 94],
    branco: [1, 3, 34],
  },
  'lua-ceu': {
    noite: [0],
    creme: [1, 32],
    amarelo: [3, 4, 12, 35, 43, 45],
    lilasClaro: [14, 36],
    cinza: [5, 7, 40, 41, 42],
    azul: [8, 15, 25, 26, 34],
    azulClaro: [11, 21, 28, 30, 38],
    roxo: [9, 17, 20, 22, 29, 37, 39],
    lilas: [2, 13, 18, 23, 31, 33, 44, 46],
    rosa: [16, 24, 27],
    branco: [6, 10, 19],
  },
  'lua-sonhos': {
    noite: [0],
    amarelo: [1, 2, 3, 45, 46],
    azulClaro: [10, 11, 15, 17, 25, 26, 28, 36, 61],
    rosa: [16, 23, 27, 37, 47, 56],
    cinza: [4, 7, 14, 63, 64, 65],
    azul: [6, 19, 29, 34, 38, 41, 42, 57],
    roxo: [8, 20, 21, 30, 31, 48, 52],
    lilas: [12, 18, 24, 35, 50, 60, 62, 66],
    lilasClaro: [13, 40, 44, 58, 59],
    marrom: [33, 39, 43, 51, 54],
    creme: [32, 49, 55],
    branco: [5, 9, 22, 53],
  },
  'brasa-vulcao': {
    ceu: [0],
    cinza: [1, 42, 43, 44, 45],
    cinzaEscuro: [10, 27, 34, 37],
    marrom: [14],
    vermelho: [5, 12, 18, 20, 25, 26],
    laranja: [8, 9, 6, 13, 15, 23, 28, 29, 30],
    dourado: [3, 16, 33, 35, 39, 40],
    amarelo: [7, 11, 19, 22, 32],
    verde: [24, 31, 36, 46],
    verdeClaro: [38],
    rosa: [21],
    areia: [41],
    branco: [2, 4, 17],
  },
  'brasa-fogueira': {
    noite: [0],
    amarelo: [1, 2, 5, 7, 8, 9, 13, 21, 31, 32],
    dourado: [3, 14, 36, 38, 40],
    vermelho: [4, 12, 16, 20, 22, 25, 33],
    laranja: [6, 11, 17, 24, 29, 30, 42],
    cinzaEscuro: [10, 26],
    rosa: [18, 19],
    verde: [23, 27, 28],
    verdeClaro: [34],
    marrom: [35, 37, 39],
    areia: [41, 43, 44],
    branco: [15],
  },
};

// O gabarito de um desenho pronto para a tela: `cores` é a paleta (hex, na
// ordem dos números) e `alvo[área]` o índice da cor certa, ou -1 para as
// que ficam brancas. `null` se o desenho não tem gabarito.
export function gabarito(id, areas) {
  const g = GABARITOS[id];
  if (!g) return null;
  const nomes = Object.keys(g).filter((n) => n !== 'branco');
  const alvo = new Int8Array(areas).fill(-1);
  nomes.forEach((nome, i) => { for (const a of g[nome]) alvo[a] = i; });
  return { cores: nomes.map((n) => TINTAS[n]), nomes, alvo };
}

// Confere um gabarito contra o número de áreas do desenho: cada área tem de
// aparecer exatamente uma vez. Devolve a lista de problemas (vazia = ok).
export function conferirGabarito(id, areas) {
  const g = GABARITOS[id];
  if (!g) return [`${id}: sem gabarito`];
  const erros = [];
  const vistas = new Map();
  for (const [nome, lista] of Object.entries(g)) {
    if (nome !== 'branco' && !TINTAS[nome]) erros.push(`${id}: tinta "${nome}" não existe`);
    for (const a of lista) {
      if (a < 0 || a >= areas) erros.push(`${id}: área ${a} não existe (são ${areas})`);
      else if (vistas.has(a)) erros.push(`${id}: área ${a} em "${vistas.get(a)}" e em "${nome}"`);
      else vistas.set(a, nome);
    }
  }
  const faltam = [];
  for (let a = 0; a < areas; a++) if (!vistas.has(a)) faltam.push(a);
  if (faltam.length) erros.push(`${id}: áreas sem cor: ${faltam.join(', ')}`);
  return erros;
}
