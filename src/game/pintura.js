// A área de pintar: páginas de colorir em PNG (assets/pintar/), pintadas
// por toque. Aqui fica o que não depende de tela — a lista de desenhos, a
// paleta e a divisão do desenho em áreas —, para o `npm run check` testar
// fora do navegador. A tela fica em telaPintura.js.
//
// Como uma página funciona:
//   1. O PNG é lido pixel a pixel. Pixel escuro é **linha**; o resto é papel.
//   2. O papel é dividido em **áreas**: pedaços ligados entre si, cercados
//      de linha (o balde de tinta de qualquer programa de desenho, só que
//      calculado uma vez, na abertura). O fundo em volta do desenho é uma
//      área também, e dá para pintar.
//   3. Cada área "invade" a linha em volta por alguns pixels, para a cor
//      chegar até o meio do traço: sem isso sobrava uma franja branca entre
//      a cor e a borda suavizada da linha.
//   4. Na tela, a cor vai embaixo e o PNG por cima, em multiplicar: o branco
//      do papel deixa a cor aparecer e a linha preta continua preta.
//
// A divisão é determinística: o mesmo PNG dá sempre as mesmas áreas, na
// mesma ordem. É o que deixa o save guardar só "área 12 = cor 3".

// Os desenhos. `personagem` (opcional) liga a página a um unicórnio: ela só
// abre para quem já tem ele. Sem `personagem`, é de todo mundo.
export const DESENHOS = [
  { id: 'uni', personagem: 'uni', nome: 'Uni de asas abertas', arquivo: './assets/pintar/uni.png' },
  { id: 'uni-arco-iris', personagem: 'uni', nome: 'Uni no arco-íris', arquivo: './assets/pintar/uni-arco-iris.png' },
  { id: 'uni-campo', personagem: 'uni', nome: 'Uni e a borboleta', arquivo: './assets/pintar/uni-campo.png' },
  { id: 'sol-amanhecer', personagem: 'sol', nome: 'Sol e o amanhecer', arquivo: './assets/pintar/sol-amanhecer.png' },
  { id: 'sol-pomar', personagem: 'sol', nome: 'Sol no pomar', arquivo: './assets/pintar/sol-pomar.png' },
  { id: 'lua-ceu', personagem: 'lua', nome: 'Lua na lua', arquivo: './assets/pintar/lua-ceu.png' },
  { id: 'lua-sonhos', personagem: 'lua', nome: 'Lua e os sonhos', arquivo: './assets/pintar/lua-sonhos.png' },
  { id: 'brasa-vulcao', personagem: 'brasa', nome: 'Brasa e o vulcão', arquivo: './assets/pintar/brasa-vulcao.png' },
  { id: 'brasa-fogueira', personagem: 'brasa', nome: 'Brasa na fogueira', arquivo: './assets/pintar/brasa-fogueira.png' },
  { id: 'lulu-soneca', personagem: 'lulu', nome: 'Lulu tirando uma soneca', arquivo: './assets/pintar/lulu-soneca.png' },
  { id: 'lulu-voo', personagem: 'lulu', nome: 'Lulu aprendendo a voar', arquivo: './assets/pintar/lulu-voo.png' },
  { id: 'estrela-cadente', personagem: 'estrela', nome: 'Estrela cadente', arquivo: './assets/pintar/estrela-cadente.png' },
  { id: 'estrela-espaco', personagem: 'estrela', nome: 'Estrela no espaço', arquivo: './assets/pintar/estrela-espaco.png' },
  { id: 'chiclete-doces', personagem: 'chiclete', nome: 'Chiclete na terra dos doces', arquivo: './assets/pintar/chiclete-doces.png' },
  { id: 'chiclete-baloes', personagem: 'chiclete', nome: 'Chiclete e os balões', arquivo: './assets/pintar/chiclete-baloes.png' },
  { id: 'musgo-cochilo', personagem: 'musgo', nome: 'Musgo cochilando', arquivo: './assets/pintar/musgo-cochilo.png' },
  { id: 'musgo-selva', personagem: 'musgo', nome: 'Musgo na selva', arquivo: './assets/pintar/musgo-selva.png' },
  { id: 'onda-mar', personagem: 'onda', nome: 'Onda no mar', arquivo: './assets/pintar/onda-mar.png' },
  { id: 'onda-corais', personagem: 'onda', nome: 'Onda e os corais', arquivo: './assets/pintar/onda-corais.png' },
  { id: 'floco-neve', personagem: 'floco', nome: 'Floco e o boneco de neve', arquivo: './assets/pintar/floco-neve.png' },
  { id: 'floco-gelo', personagem: 'floco', nome: 'Floco patinando no gelo', arquivo: './assets/pintar/floco-gelo.png' },
  { id: 'coco-coqueiro', personagem: 'coco', nome: 'Coco no coqueiro', arquivo: './assets/pintar/coco-coqueiro.png' },
  { id: 'coco-praia', personagem: 'coco', nome: 'Coco na praia', arquivo: './assets/pintar/coco-praia.png' },
  { id: 'cereja-bolo', personagem: 'cereja', nome: 'Cereja e o bolo', arquivo: './assets/pintar/cereja-bolo.png' },
  { id: 'cereja-parque', personagem: 'cereja', nome: 'Cereja no parque', arquivo: './assets/pintar/cereja-parque.png' },
  { id: 'cometa-espaco', personagem: 'cometa', nome: 'Cometa no espaço', arquivo: './assets/pintar/cometa-espaco.png' },
  { id: 'cometa-pedido', personagem: 'cometa', nome: 'Cometa e o pedido', arquivo: './assets/pintar/cometa-pedido.png' },
  { id: 'limao-frutas', personagem: 'limao', nome: 'Limão no meio das frutas', arquivo: './assets/pintar/limao-frutas.png' },
  { id: 'limao-pulo', personagem: 'limao', nome: 'Limão dando um pulo', arquivo: './assets/pintar/limao-pulo.png' },
  { id: 'violeta-flutua', personagem: 'violeta', nome: 'Violeta flutuando', arquivo: './assets/pintar/violeta-flutua.png' },
  { id: 'violeta-bruma', personagem: 'violeta', nome: 'Violeta no bosque da bruma', arquivo: './assets/pintar/violeta-bruma.png' },
  { id: 'cristal-caverna', personagem: 'cristal', nome: 'Cristal na caverna de cristais', arquivo: './assets/pintar/cristal-caverna.png' },
  { id: 'cristal-lago', personagem: 'cristal', nome: 'Cristal e o arco-íris no gelo', arquivo: './assets/pintar/cristal-lago.png' },
  { id: 'vovo-vilarejo', personagem: 'vovo', nome: 'Vovô no vilarejo', arquivo: './assets/pintar/vovo-vilarejo.png' },
  { id: 'vovo-mapa', personagem: 'vovo', nome: 'Vovô e o mapa', arquivo: './assets/pintar/vovo-mapa.png' },
  { id: 'sombra-caverna', personagem: 'sombra', nome: 'Sombra na caverna', arquivo: './assets/pintar/sombra-caverna.png' },
  { id: 'sombra-lua', personagem: 'sombra', nome: 'Sombra e a lua cheia', arquivo: './assets/pintar/sombra-lua.png' },
];
export const DESENHO = Object.fromEntries(DESENHOS.map((d) => [d.id, d]));

// A paleta do modo livre: 33 cores e o branco, que faz de borracha. O save
// guarda o índice, então **só acrescente no fim** — mudar a ordem repinta
// os desenhos já guardados com outras cores. A ordem em que as bolinhas
// aparecem na tela é outra, a de `ORDEM_PALETA`.
export const CORES = [
  '#ff5d8f', '#ff9fc6', '#ff8a3c', '#ffd43b', '#7bd88f', '#2fb36a',
  '#5cc1ff', '#2e6fd8', '#b197fc', '#8c5fe6', '#a0522d', '#4a4a5a',
  '#ffffff',
  // v0.55: mais tons, para a criança achar a cor que imaginou.
  '#e63946', '#9d2449', '#ff3fa4', '#ffc2d6', '#ffb4a2', '#f6c7a1',
  '#fff1c9', '#fff59d', '#c6e85a', '#b6ec9a', '#1e7a46', '#9ff0d0',
  '#2ec4b6', '#c9ecff', '#283a8c', '#e4d4ff', '#5b2a9e', '#d9a066',
  '#f3d6a0', '#c3c6d4', '#16161d',
];
export const BORRACHA = CORES.indexOf('#ffffff');

// As bolinhas na tela, pelo índice em CORES: a borracha primeiro e depois as
// cores em arco-íris — vermelhos, rosas, laranjas e marrons, amarelos,
// verdes, azuis, roxos —, e os cinzas e o preto no fim.
export const ORDEM_PALETA = [
  12,
  13, 14, 15, 0, 1, 16, 17, 18,
  2, 30, 10, 31, 19,
  20, 3, 21,
  22, 4, 5, 23, 24, 25,
  26, 6, 7, 27,
  28, 8, 9, 29,
  32, 11, 33,
];

const ESCURO = 170;       // luminância abaixo disso é linha
const MIN_AREA = 80;      // área menor que isso vira linha (o brilho do olho, sujeira)
const INVADE = 4;         // quantos pixels a cor entra por baixo da linha
const PERDAO = 14;        // raio, em pixels, que vale para um toque em cima da linha

// Divide o desenho em áreas. `px` são os pixels RGBA (como os de um
// ImageData), `L` × `A` o tamanho. Devolve:
//   regiao  — a área de cada pixel de papel (-1 = linha);
//   pixels  — para cada área, os pixels que a cor pinta (o papel e a linha
//             invadida), num Int32Array só por área;
//   areas   — quantas áreas há.
export function dividirEmAreas(px, L, A) {
  const N = L * A;

  // 1. Linha ou papel.
  const linha = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const k = i * 4;
    if (0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2] < ESCURO) linha[i] = 1;
  }

  // 2. As áreas: papel ligado pelos vizinhos de cima, baixo e lados. O
  // desenho é lido como ele é: brecha no contorno se corrige no PNG (ver
  // docs/desenhos-personagens.md), não aqui — adivinhar onde fechar acabava
  // fechando o que era aberto de propósito, como a antena da borboleta.
  const regiao = new Int32Array(N).fill(-1);
  const tamanhos = [];
  const pilha = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    if (linha[i] || regiao[i] !== -1) continue;
    const n = tamanhos.length;
    let topo = 0;
    let conta = 0;
    pilha[topo++] = i;
    regiao[i] = n;
    while (topo) {
      const j = pilha[--topo];
      conta++;
      const x = j % L;
      if (j >= L && !linha[j - L] && regiao[j - L] === -1) { regiao[j - L] = n; pilha[topo++] = j - L; }
      if (j < N - L && !linha[j + L] && regiao[j + L] === -1) { regiao[j + L] = n; pilha[topo++] = j + L; }
      if (x > 0 && !linha[j - 1] && regiao[j - 1] === -1) { regiao[j - 1] = n; pilha[topo++] = j - 1; }
      if (x < L - 1 && !linha[j + 1] && regiao[j + 1] === -1) { regiao[j + 1] = n; pilha[topo++] = j + 1; }
    }
    tamanhos.push(conta);
  }

  // Os pedacinhos pequenos demais viram linha, e as áreas que sobram são
  // renumeradas de 0 em diante, sem buracos.
  const novo = new Int32Array(tamanhos.length).fill(-1);
  let areas = 0;
  tamanhos.forEach((t, n) => { if (t >= MIN_AREA) novo[n] = areas++; });
  const miudo = [];        // o papel dos pedacinhos que viraram linha
  const pedaco = [];       // e de qual pedacinho cada um era
  for (let i = 0; i < N; i++) {
    if (regiao[i] < 0) continue;
    const antes = regiao[i];
    regiao[i] = novo[antes];
    if (regiao[i] < 0) { linha[i] = 1; miudo.push(i); pedaco.push(antes); }
  }

  // 3. A cor entra por baixo da linha: cada pixel de linha fica com a área
  // mais perto, até INVADE pixels (busca em largura a partir de todo o
  // papel ao mesmo tempo).
  const dono = Int32Array.from(regiao);
  let borda = [];
  for (let i = 0; i < N; i++) if (dono[i] >= 0) borda.push(i);
  for (let passo = 0; passo < INVADE && borda.length; passo++) {
    const proxima = [];
    for (const j of borda) {
      const x = j % L;
      const vizinhos = [j - L, j + L, x > 0 ? j - 1 : -1, x < L - 1 ? j + 1 : -1];
      for (const v of vizinhos) {
        if (v < 0 || v >= N || dono[v] !== -1) continue;
        dono[v] = dono[j];
        proxima.push(v);
      }
    }
    borda = proxima;
  }

  // 4. Papel órfão: um pedacinho entre linhas grossas (o triângulo entre a
  // folha e o caule) fica longe demais para a invasão chegar, e sairia
  // branco puro no meio do desenho pintado. Ele fica inteiro com uma área
  // só: a que está mais perto da maior parte dele, atravessando a linha.
  // A linha continua de quem já era.
  if (miudo.some((i) => dono[i] === -1)) {
    const perto = Int32Array.from(dono);
    let fila = [];
    for (let i = 0; i < N; i++) if (perto[i] >= 0) fila.push(i);
    for (let passo = 0; passo < 40 && fila.length; passo++) {
      const proxima = [];
      for (const j of fila) {
        const x = j % L;
        const vizinhos = [j - L, j + L, x > 0 ? j - 1 : -1, x < L - 1 ? j + 1 : -1];
        for (const v of vizinhos) {
          if (v < 0 || v >= N || perto[v] !== -1) continue;
          perto[v] = perto[j];
          proxima.push(v);
        }
      }
      fila = proxima;
    }
    const votos = new Map();   // pedacinho → Map(área → pixels)
    miudo.forEach((i, k) => {
      if (dono[i] !== -1 || perto[i] < 0) return;
      if (!votos.has(pedaco[k])) votos.set(pedaco[k], new Map());
      const v = votos.get(pedaco[k]);
      v.set(perto[i], (v.get(perto[i]) || 0) + 1);
    });
    const vencedora = new Map();
    for (const [n, v] of votos) vencedora.set(n, [...v].sort((a, b) => b[1] - a[1])[0][0]);
    miudo.forEach((i, k) => { if (dono[i] === -1 && vencedora.has(pedaco[k])) dono[i] = vencedora.get(pedaco[k]); });
  }

  // Os pixels de cada área, num bloco só por área: contar, separar, encher.
  const quantos = new Int32Array(areas);
  for (let i = 0; i < N; i++) if (dono[i] >= 0) quantos[dono[i]]++;
  const pixels = Array.from(quantos, (q) => new Int32Array(q));
  const enchidos = new Int32Array(areas);
  for (let i = 0; i < N; i++) {
    const a = dono[i];
    if (a >= 0) pixels[a][enchidos[a]++] = i;
  }

  return { regiao, pixels, areas, L, A };
}

// A área tocada em (x, y). Caiu em cima da linha? Vale a área mais perto,
// num raio pequeno: dedo de criança é grosso. -1 = nenhuma.
export function areaNoPonto({ regiao, L, A }, x, y) {
  if (x < 0 || y < 0 || x >= L || y >= A) return -1;
  let n = regiao[y * L + x];
  for (let raio = 1; n < 0 && raio <= PERDAO; raio++) {
    for (let dy = -raio; dy <= raio && n < 0; dy++) {
      for (let dx = -raio; dx <= raio && n < 0; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
        const xx = x + dx; const yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < L && yy < A) n = regiao[yy * L + xx];
      }
    }
  }
  return n;
}

// O que o save guarda de uma página: `{ areas, cores: { [área]: índice } }`.
// `areas` é a conferência: se o PNG mudar (outro número de áreas), a pintura
// antiga não serve mais, e a página volta em branco em vez de sair com as
// cores nos lugares errados.
export function coresGuardadas(guardado, areas) {
  if (!guardado || guardado.areas !== areas) return {};
  return { ...guardado.cores };
}

// Onde escrever o número de cada área, no modo por números: o ponto mais
// longe da borda (o centro do maior círculo que cabe dentro dela), e o raio
// desse círculo, que dá o tamanho do número. Uma busca em largura a partir
// da borda de todas as áreas ao mesmo tempo.
export function centrosDasAreas({ regiao, areas, L, A }) {
  const N = L * A;
  const dist = new Int32Array(N).fill(-1);
  let fila = [];
  for (let i = 0; i < N; i++) {
    const a = regiao[i];
    if (a < 0) continue;
    const x = i % L;
    if (x === 0 || x === L - 1 || i < L || i >= N - L
      || regiao[i - 1] !== a || regiao[i + 1] !== a || regiao[i - L] !== a || regiao[i + L] !== a) {
      dist[i] = 0;
      fila.push(i);
    }
  }
  for (let d = 1; fila.length; d++) {
    const proxima = [];
    for (const j of fila) {
      const x = j % L;
      const vizinhos = [x > 0 ? j - 1 : -1, x < L - 1 ? j + 1 : -1, j - L, j + L];
      for (const v of vizinhos) {
        if (v < 0 || v >= N || dist[v] !== -1 || regiao[v] !== regiao[j]) continue;
        dist[v] = d;
        proxima.push(v);
      }
    }
    fila = proxima;
  }
  const centro = new Int32Array(areas).fill(-1);
  const raio = new Int32Array(areas);
  for (let i = 0; i < N; i++) {
    const a = regiao[i];
    if (a >= 0 && dist[i] > raio[a]) { raio[a] = dist[i]; centro[a] = i; }
  }
  for (let a = 0; a < areas; a++) if (centro[a] < 0) centro[a] = regiao.indexOf(a);
  return { centro, raio };
}
