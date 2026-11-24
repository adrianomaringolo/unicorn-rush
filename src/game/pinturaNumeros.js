// Os gabaritos da pintura por números (ver pintura.js): para cada desenho,
// que cor vai em cada área. A paleta da página sai daqui, na ordem em que
// as cores aparecem — a primeira é o número 1, a segunda o 2, e assim por
// diante. Toda área ganha cor, até a branca: `branco` é um branco quase
// puro, com número como as outras (o brilho do olho, a parte branca do
// olho, as nuvens), para a página terminar inteira pintada.
//
// As áreas miúdas, que só dariam para pintar com muito zoom, não pedem
// toque: já abrem pintadas com a cor do gabarito (ver `automaticas`).
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
  rosaClaro: '#ffd0e4',
  pink: '#ff4fa0',
  coral: '#ff8f7a',
  caramelo: '#d4a373',
  verdeMusgo: '#d8efc8',
  verdeEscuro: '#2f8a3a',
  lima: '#d6ea6a',
  agua: '#6fd6cf',
  turquesa: '#2ec4b6',
  gelo: '#b9d8f5',
  azulEscuro: '#2b4fa8',
  branco: '#f7f4fd',
};

// Área com o maior círculo de dentro menor que isso (fração da largura do
// desenho) é miúda: num celular, o número dela só aparece com uns 3× de
// zoom. Ela abre já pintada.
const MIUDA = 0.0065;

export const GABARITOS = {
  uni: {
    // 34 é o fundo aparecendo entre a cauda e a perna, não uma mecha.
    ceu: [0, 34],
    cremeClaro: [5, 37, 38],
    rosa: [9, 12, 16, 26, 31],
    laranja: [10, 29],
    amarelo: [2, 6, 7, 11, 25, 30, 32],
    verde: [4, 20, 33],
    azul: [8, 14, 21, 22],
    roxo: [24, 28],
    dourado: [1, 3, 39, 40, 41, 42],
    lilas: [13, 15, 27],
    branco: [17, 18, 19, 23, 35, 36],
  },
  'uni-arco-iris': {
    ceu: [0],
    rosa: [2, 4, 7, 12, 16, 26, 29, 33, 35, 37],
    vermelho: [48, 50, 53],
    laranja: [9, 23, 34, 44, 52],
    amarelo: [3, 8, 11, 30, 40, 54],
    verde: [13, 15, 55],
    azul: [18, 20, 27, 38, 58],
    roxo: [22, 24, 32, 39],
    lilas: [6, 25, 31],
    dourado: [1, 5, 43, 46, 49, 51],
    branco: [10, 14, 17, 19, 21, 28, 36, 41, 42, 45, 47, 56, 57, 59],
  },
  'uni-campo': {
    ceu: [0],
    cremeClaro: [21, 62, 67, 71, 74],
    rosa: [20, 24, 42, 43, 45, 54, 59, 63, 72],
    laranja: [1, 3, 4, 8, 9, 12, 13, 15, 19, 44, 69, 77],
    amarelo: [6, 10, 16, 17, 22, 23, 25, 26, 36, 37, 41, 53, 65, 76, 79, 81, 85],
    dourado: [7, 11, 58, 75, 78, 80],
    verdeClaro: [28, 55, 70],
    verde: [30, 61, 64, 68, 83, 84, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95],
    azul: [29, 31, 34, 35, 66, 82],
    roxo: [14, 33, 46, 48, 49, 51, 57, 60],
    lilas: [18, 39, 40, 52, 56, 73],
    vermelho: [47],
    branco: [2, 5, 27, 32, 38, 50],
  },
  'sol-amanhecer': {
    ceu: [0],
    rosa: [19, 52, 56, 58, 64],
    vermelho: [18, 22, 24, 28, 43],
    laranja: [1, 5, 6, 9, 11, 20, 23, 29, 32, 34, 36, 41],
    dourado: [27, 37, 40, 46, 48, 50],
    amarelo: [3, 7, 8, 12, 13, 17, 21, 26, 31, 33, 35, 47, 60, 61, 62],
    creme: [10, 30, 38, 39, 42],
    verdeClaro: [49, 72, 73, 74],
    verde: [44, 45, 66, 67, 68, 69, 70, 71],
    azul: [51, 54, 55, 63],
    roxo: [25, 53, 57, 59, 65],
    marrom: [15, 16],
    branco: [2, 4, 14],
  },
  'sol-pomar': {
    ceu: [0, 60],
    rosa: [42],
    vermelho: [9, 21, 23, 25, 48, 50, 56, 75],
    laranja: [10, 16, 24, 27, 28, 36, 43, 44, 52, 55],
    dourado: [37, 59, 79, 80, 83, 85, 86, 87, 89, 91, 94],
    amarelo: [8, 12, 20, 22, 29, 30, 34, 46, 49, 53, 57, 61, 74],
    creme: [18, 26, 51, 64, 65, 73],
    verdeClaro: [4, 7, 11, 13, 14, 35, 39, 72, 81],
    verde: [1, 38, 41, 45, 54, 62, 67, 68, 69, 76, 77],
    roxo: [66],
    lilas: [47],
    marrom: [5, 6, 15, 17, 19, 33, 40, 58, 63, 70, 71, 78, 82, 84, 88, 90, 92, 93],
    branco: [2, 3, 31, 32],
  },
  'lua-ceu': {
    noite: [0],
    creme: [1, 34],
    amarelo: [3, 4, 12, 36, 44, 46],
    lilasClaro: [14, 37],
    cinza: [5, 7, 41, 42, 43],
    azul: [8, 15, 26, 27, 35],
    azulClaro: [11, 22, 29, 31, 39],
    roxo: [9, 20, 21, 23, 30, 38, 40],
    lilas: [2, 13, 18, 24, 32, 33, 45, 47],
    rosa: [16, 25, 28],
    branco: [6, 10, 17, 19],
  },
  'lua-sonhos': {
    noite: [0],
    amarelo: [1, 2, 3, 46, 47],
    azulClaro: [10, 11, 15, 17, 26, 27, 29, 37, 62],
    rosa: [16, 23, 28, 38, 48, 57],
    cinza: [4, 7, 13, 64, 65, 66],
    azul: [6, 19, 30, 35, 39, 42, 43, 58],
    roxo: [8, 20, 24, 31, 32, 49, 53],
    lilas: [12, 18, 25, 36, 51, 61, 63, 67],
    lilasClaro: [14, 41, 45, 59, 60],
    marrom: [34, 40, 44, 52, 55],
    creme: [33, 50, 56],
    branco: [5, 9, 21, 22, 54],
  },
  'brasa-vulcao': {
    ceu: [0],
    cinza: [1, 42, 43, 44, 45],
    cinzaEscuro: [10, 27, 34, 37],
    marrom: [14],
    vermelho: [5, 12, 18, 20, 25, 26],
    laranja: [6, 8, 9, 13, 15, 23, 28, 29, 30],
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
    amarelo: [1, 2, 5, 7, 8, 9, 13, 22, 32, 33],
    dourado: [3, 17, 37, 39, 41],
    vermelho: [4, 12, 16, 21, 23, 26, 34],
    laranja: [6, 11, 18, 25, 30, 31, 43],
    cinzaEscuro: [10, 27],
    rosa: [19, 20],
    verde: [24, 28, 29],
    verdeClaro: [35],
    marrom: [36, 38, 40],
    areia: [42, 44, 45],
    branco: [14, 15],
  },
  'lulu-soneca': {
    noite: [0],
    dourado: [1, 3, 7],
    amarelo: [2, 4, 9, 21],
    rosa: [5, 16, 27],
    rosaClaro: [6, 12, 19, 22, 28, 29, 30, 32],
    lilas: [8, 20, 24, 31],
    azulClaro: [10, 14, 15, 26],
    creme: [13, 17],
    lilasClaro: [18, 25],
    branco: [11, 23],
  },
  'lulu-voo': {
    ceu: [0],
    dourado: [2, 7],
    amarelo: [4],
    lilas: [5, 20, 30, 37],
    rosaClaro: [6, 15, 27, 29, 31, 34, 35],
    azulClaro: [8, 10, 23, 25],
    creme: [9, 19],
    azul: [12, 18],
    rosa: [14, 21, 24, 28],
    lilasClaro: [22],
    verdeClaro: [36],
    branco: [1, 3, 11, 13, 16, 17, 26, 32, 33, 38, 39, 40],
  },
  'estrela-cadente': {
    ceu: [0, 15, 25, 33, 35, 36],
    dourado: [1, 6, 29, 32, 34, 37, 40, 44, 45],
    azulClaro: [2, 8, 20, 26],
    amarelo: [3, 4, 10, 23, 24, 30],
    lilasClaro: [5],
    rosa: [7, 11, 16, 22, 31, 38, 39, 43],
    cremeClaro: [9, 27],
    rosaClaro: [12, 13, 21, 28],
    creme: [14],
    roxo: [19],
    lilas: [41],
    vermelho: [42],
    branco: [17, 18, 46, 47],
  },
  'estrela-espaco': {
    noite: [0, 19, 23],
    dourado: [1, 7, 17, 39, 40, 42, 47],
    amarelo: [2, 4, 12, 18, 29, 30, 32, 34, 49, 50],
    laranja: [3, 20],
    cinza: [5],
    lilas: [6, 10, 45],
    cinzaEscuro: [8, 13, 14, 21],
    azulClaro: [9, 11, 24, 33, 36, 46],
    rosaClaro: [15, 28, 38],
    rosa: [16, 31, 35, 41, 48],
    cremeClaro: [22, 37, 43, 44],
    roxo: [27],
    branco: [25, 26],
  },
  'chiclete-doces': {
    ceu: [0],
    rosa: [1, 3, 6, 9, 22, 30, 37, 38, 44, 48, 51, 56, 58, 61, 64, 85],
    lilas: [2, 7, 20, 29, 31, 41, 75],
    pink: [5, 12, 16, 65, 66, 67, 68],
    amarelo: [8, 24, 32, 34, 47, 54],
    rosaClaro: [10, 21, 23, 53, 57],
    verdeClaro: [13, 33, 46, 50, 70, 73, 80],
    roxo: [19],
    azulClaro: [26, 28, 36, 39, 40, 45, 71, 77, 78],
    vermelho: [27, 35, 43],
    laranja: [42, 69, 82],
    creme: [55, 63],
    branco: [4, 11, 14, 15, 17, 18, 25, 49, 52, 59, 60, 62, 72, 74, 76, 79, 81, 83, 84, 86, 87, 88],
  },
  'chiclete-baloes': {
    ceu: [0, 20, 25, 28],
    rosa: [1, 14, 18, 19, 21, 39, 40, 49, 55, 59, 63],
    lilas: [2, 3, 5, 6, 7, 12, 17, 23, 29, 35, 62],
    azulClaro: [8, 30],
    amarelo: [11, 27, 33, 38, 41, 42, 44, 47, 48, 53, 57, 64, 67, 68],
    pink: [22, 37, 43, 45, 54, 56, 58, 65],
    rosaClaro: [31, 46, 52, 61],
    branco: [4, 9, 10, 13, 15, 16, 24, 26, 32, 34, 36, 50, 51, 60, 66, 69, 70],
  },
  'musgo-cochilo': {
    ceu: [0, 24, 48, 49],
    verde: [1, 2, 8, 9, 13, 18, 37, 38, 43, 44, 50, 51, 55, 56, 59, 63, 64, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
    verdeClaro: [3, 4, 5, 6, 15, 19, 25, 34, 36, 41, 42, 47, 53, 60],
    marrom: [7, 27, 30, 35],
    amarelo: [10, 11, 14, 16, 17, 20, 21, 22, 23, 68, 69, 70],
    azulClaro: [12, 26, 28, 33, 67],
    areia: [29, 31],
    verdeMusgo: [32, 61],
    verdeEscuro: [39, 40, 45, 46, 52, 54, 57, 62],
    lilas: [65],
    rosa: [66],
    lima: [58],
  },
  'musgo-selva': {
    ceu: [0, 23, 25, 27],
    verde: [1, 3, 18, 19, 30, 35, 42, 48, 49, 55, 62, 70, 77, 81, 90, 93],
    verdeClaro: [2, 6, 11, 14, 15, 16, 21, 22, 32, 33, 45, 50, 52, 56, 65, 86],
    verdeEscuro: [4, 5, 10, 13, 24, 26, 44, 51, 54, 59, 73],
    marrom: [7, 9, 38, 39, 41],
    areia: [8, 12, 53, 67, 69, 74, 75],
    lima: [17, 28, 36, 43, 68, 82, 83, 84, 87, 88, 89],
    verdeMusgo: [20, 64],
    rosa: [46, 47, 79, 80, 85, 92],
    vermelho: [57],
    creme: [66, 71, 72, 76, 78],
    cinza: [91, 94, 95],
    branco: [29, 31, 34, 37, 40, 58, 60, 61, 63],
  },
  'onda-mar': {
    ceu: [0],
    coral: [1, 16, 22, 37, 58, 62],
    turquesa: [2, 15, 24, 40, 57, 87],
    azul: [3, 8, 12, 19, 45, 56, 83],
    azulEscuro: [4, 5, 20, 26, 46, 51, 54, 61, 66, 86],
    azulClaro: [6, 7, 10, 13, 18, 25, 28, 41, 47, 48, 49, 50, 63, 71, 73, 75, 77, 79, 85],
    agua: [9, 23, 29, 33, 52, 55],
    rosa: [17],
    lilasClaro: [21, 27, 35],
    amarelo: [30, 34, 36, 39, 68, 70, 72, 78, 82],
    laranja: [31, 32, 42, 43, 44, 59, 60, 64, 67, 69, 74],
    branco: [11, 14, 38, 53, 65, 76, 80, 81, 84],
  },
  'onda-corais': {
    azulClaro: [0],
    coral: [1, 2, 17, 27, 32, 70],
    azulEscuro: [3, 9, 13, 18, 20, 33, 41, 50, 61, 64, 67],
    turquesa: [4, 8, 10, 11, 14, 28, 31, 37, 38],
    azul: [7, 19, 24, 26, 34, 35],
    agua: [15, 42, 55],
    rosa: [29, 43, 71],
    verde: [39, 40, 44, 49, 51, 56, 57, 62, 66, 69, 73],
    amarelo: [46, 58, 75],
    areia: [47, 48, 60, 74, 79, 83],
    verdeClaro: [52, 53, 54, 59, 63, 65, 68, 72, 78],
    cinza: [76, 77, 80, 81, 82, 84],
    branco: [5, 6, 12, 16, 21, 22, 23, 25, 30, 36, 45],
  },
  'floco-neve': {
    ceu: [0, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 29, 30, 32, 33, 34, 35, 36, 37, 39, 40, 42, 43, 73],
    azulClaro: [9, 50, 58, 65, 72, 94],
    lilasClaro: [21, 28, 38, 44, 84, 89, 92],
    lilas: [22, 25, 54, 64, 79],
    azul: [24, 41, 47, 49, 55, 56, 83, 96],
    azulEscuro: [26, 45],
    gelo: [31, 52, 53, 57, 62],
    rosa: [46],
    vermelho: [48, 60, 61, 66, 74, 77, 81, 86, 93, 98, 99, 101, 102, 103, 104, 105, 106],
    amarelo: [59, 63, 69, 76, 78, 82, 87, 91, 97],
    laranja: [70],
    marrom: [71, 75, 90, 100],
    branco: [1, 2, 3, 23, 27, 51, 67, 68, 80, 85, 88, 95],
  },
  'floco-gelo': {
    ceu: [0, 2, 3, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 49, 50, 55],
    azulClaro: [10, 44, 65, 74],
    lilasClaro: [21, 27, 38, 53, 56, 60, 72],
    lilas: [22, 25, 45, 62, 71, 76],
    verde: [23, 37, 43],
    azul: [24, 33, 35, 40, 46, 52, 57],
    azulEscuro: [26, 41, 61],
    verdeClaro: [28, 34, 48],
    gelo: [29, 30, 31, 42, 47, 58, 63, 64, 66, 67, 69, 70],
    rosa: [36],
    marrom: [51, 54],
    cinza: [73, 75, 78],
    branco: [1, 4, 5, 32, 39, 59, 68, 77, 79, 80],
  },
  'coco-coqueiro': {
    ceu: [0, 25],
    verde: [1, 6, 15, 18, 43, 51, 57, 58, 61, 62, 70],
    verdeClaro: [2, 4, 16, 23, 38, 45, 47, 55, 56, 66],
    laranja: [3, 7, 8, 11, 12, 20, 21, 22, 72],
    verdeEscuro: [5, 14, 46, 50, 54, 67],
    amarelo: [9, 27, 36],
    caramelo: [10, 13, 17, 19, 35, 63, 69],
    marrom: [24, 28, 42, 60, 64, 65, 68],
    areia: [26, 31, 48, 49, 52, 71],
    azul: [29, 32],
    azulClaro: [33, 34, 39],
    rosa: [73, 75],
    branco: [30, 37, 40, 41, 44, 53, 59, 74],
  },
  'coco-praia': {
    ceu: [0, 22],
    verde: [1, 11, 12, 30, 34, 50, 54, 57, 67, 76],
    verdeClaro: [2, 4, 16, 17, 32, 39, 42, 53, 74, 85],
    amarelo: [3, 6, 7, 9, 13, 14, 19, 20, 23, 26, 31, 69, 77, 78, 79, 91, 96, 104],
    verdeEscuro: [5, 21, 33, 40, 62, 82],
    caramelo: [10, 15, 18, 37, 60, 72, 73, 81],
    areia: [24, 29, 47, 49, 61, 75, 89, 92],
    marrom: [27, 36, 43, 58, 63, 64, 71, 83, 84, 86, 87, 88, 90],
    azul: [35, 38, 41, 52, 56, 93, 97, 106],
    azulClaro: [44, 46, 48],
    vermelho: [45, 65, 68, 98, 100],
    rosa: [66, 80, 94, 102, 105],
    branco: [8, 25, 28, 51, 55, 59, 70, 95, 99, 101, 103],
  },
};

// O gabarito de um desenho pronto para a tela: `cores` é a paleta (hex, na
// ordem dos números) e `alvo[área]` o índice da cor certa. `null` se o
// desenho não tem gabarito.
export function gabarito(id, areas) {
  const g = GABARITOS[id];
  if (!g) return null;
  const nomes = Object.keys(g);
  const alvo = new Int8Array(areas).fill(-1);
  nomes.forEach((nome, i) => { for (const a of g[nome]) alvo[a] = i; });
  return { cores: nomes.map((n) => TINTAS[n]), nomes, alvo };
}

// As áreas miúdas de uma página (o `raio` de centrosDasAreas, `L` a largura
// do desenho), já com a cor certa: `{ [área]: índice }`, para juntar às
// cores pintadas.
export function automaticas(g, raio, L) {
  const cores = {};
  for (let a = 0; a < g.alvo.length; a++) if (raio[a] < L * MIUDA) cores[a] = g.alvo[a];
  return cores;
}

// Confere um gabarito contra o número de áreas do desenho: cada área tem de
// aparecer exatamente uma vez. Devolve a lista de problemas (vazia = ok).
export function conferirGabarito(id, areas) {
  const g = GABARITOS[id];
  if (!g) return [`${id}: sem gabarito`];
  const erros = [];
  const vistas = new Map();
  for (const [nome, lista] of Object.entries(g)) {
    if (!TINTAS[nome]) erros.push(`${id}: tinta "${nome}" não existe`);
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
