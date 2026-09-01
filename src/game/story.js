// A história do jogo, em forma de livro infantil.
//
// Por que a Uni corre? O jogo inteiro — as chaves 🔑, os unicórnios
// trancados na loja, as pistas fechadas — fica muito mais fácil de entender
// quando a criança sabe o começo: os amigos sumiram, e cada chave traz um
// de volta.
//
// Cada página é `{ id, title, text, image, art }`:
//
//   `image` é a ilustração de verdade, em `assets/story/` (WebP, 1280px de
//   largura, ~90 KB cada). É o que a criança vê.
//
//   `art()` devolve a mesma cena desenhada por código, em SVG — do tempo em
//   que ainda não havia ilustração. Continua aqui como **rede de segurança**:
//   se o arquivo da imagem faltar (deploy pela metade, cache estragado), a
//   página mostra o desenho em vez de um buraco. Nunca é baixado nada: o SVG
//   já está neste arquivo.
//
// As duas versões usam o mesmo enquadramento 16:10 (`viewBox="0 0 320 200"`,
// e as imagens em 1280×800), então o CSS escala qualquer uma sem fazer conta.

import { LEVEL_COUNT } from './levels.js';

const OURO = '#ffd166';
const TRACO = 'rgba(90,60,130,.28)';
const GRAMA = { clara: '#9de8a4', escura: '#6fcf7f', triste: '#b9c9ba', tristeEscura: '#a2b6a4' };
const ARCO = ['#ff7b9d', '#ffb26b', '#ffe36b', '#8ce99a', '#74c0fc', '#c09cff'];

// Ids de gradiente numerados: dois SVGs na mesma página não podem repetir id,
// e um número que só sobe é mais previsível que um sorteio.
let proximoId = 0;

// --- peças de desenho, reaproveitadas pelas páginas --------------------

// Um unicórnio de perfil, olhando para a direita, numa caixa de 110×80.
// As páginas só dizem onde ele fica e de que tamanho.
//
// A ordem de desenho é o segredo do desenho ficar bom: rabo, pernas de trás,
// corpo, pernas da frente, a crina *por baixo* do pescoço, o pescoço, a
// crina *por cima* dele e só então a cabeça — que assim nunca fica coberta.
function unicornio({
  x = 0, y = 0, s = 1, corpo = '#fffaff', focinho = '#ff9dc0',
  crina = ARCO, chifre = OURO, olhando = 1, triste = false, asa = null,
  silhueta = null, opacidade = 1, correndo = false,
} = {}) {
  // Silhueta: a mesma forma pintada de uma cor só, sem contorno nem olho.
  // É como o amigo trancado aparece atrás da porta.
  const cor = silhueta || corpo;
  const traco = silhueta ? 'none' : TRACO;
  const c = silhueta ? [silhueta, silhueta, silhueta, silhueta] : [
    crina[0], crina[1] || crina[0], crina[2] || crina[0], crina[3] || crina[1] || crina[0],
  ];
  const larguraTraco = silhueta ? 0 : 1.7;
  // Uma perna galopando é uma linha grossa dobrada no joelho — desenhada
  // duas vezes, a de baixo mais larga, que é o contorno.
  const perna = (d) => (silhueta ? '' : `<path d="${d}" fill="none" stroke="${traco}"
      stroke-width="${9 + larguraTraco * 2}" stroke-linecap="round" stroke-linejoin="round"/>`)
    + `<path d="${d}" fill="none" stroke="${cor}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Galope: as de trás esticadas para trás, as da frente lançadas à frente,
  // as quatro no ar. Parada: as quatro plantadas no chão.
  const pernas = correndo
    ? perna('M38 50 L26 62 L16 66') + perna('M44 52 L31 67 L21 73')
    : `<rect x="26" y="52" width="9" height="26" rx="4.5" fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}"/>
       <rect x="38" y="53" width="9" height="25" rx="4.5" fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}"/>`;
  const pernasFrente = correndo
    ? perna('M60 49 L72 57 L84 58') + perna('M66 52 L77 63 L89 66')
    : `<rect x="57" y="53" width="9" height="25" rx="4.5" fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}"/>
       <rect x="67" y="52" width="9" height="26" rx="4.5" fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}"/>`;

  return `
  <g transform="translate(${x} ${y}) scale(${s * olhando} ${s})" opacity="${opacidade}">
    <!-- rabo, atrás de tudo -->
    <path d="M24 34 C8 34 2 52 8 70" stroke="${c[0]}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M25 37 C12 38 7 52 13 68" stroke="${c[1]}" stroke-width="6.5" stroke-linecap="round" fill="none"/>
    <path d="M26 40 C16 42 12 53 17 66" stroke="${c[2]}" stroke-width="4" stroke-linecap="round" fill="none"/>
    ${pernas}
    <ellipse cx="49" cy="40" rx="28" ry="18" fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}"/>
    ${pernasFrente}
    ${asa ? `
      <path d="M59 26 C55 10 44 2 36 7 C30 11 31 21 35 29 L40 24 L45 31 L50 25 L54 32 Z"
            fill="${asa}" stroke="rgba(122,78,199,.4)" stroke-width="1.5" stroke-linejoin="round"/>
      <g stroke="rgba(122,78,199,.3)" stroke-width="1.2" fill="none" stroke-linecap="round">
        <path d="M38 25 C36 17 39 11 44 9"/>
        <path d="M46 27 C44 19 47 13 52 12"/>
      </g>` : ''}
    <!-- crina por baixo do pescoço: é a parte que fica esvoaçando atrás -->
    <path d="M85 -3 C69 4 61 19 57 36" stroke="${c[0]}" stroke-width="13" stroke-linecap="round" fill="none"/>
    <!-- pescoço -->
    <path d="M60 34 C62 19 70 7 82 1 L96 9 C91 24 80 34 71 41 Z"
          fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}" stroke-linejoin="round"/>
    <!-- crina por cima do pescoço -->
    <path d="M84 0 C71 7 64 20 61 35" stroke="${c[1]}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M83 3 C72 10 66 21 64 34" stroke="${c[2]}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <path d="M82 6 C74 12 69 22 67 33" stroke="${c[3]}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <!-- orelha e chifre, atrás da cabeça -->
    <path d="M83 0 L79 -12 L89 -4 Z" fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}" stroke-linejoin="round"/>
    <path d="M91 -3 L96 -21 L100 -1 Z" fill="${silhueta || chifre}"
          stroke="${silhueta ? 'none' : 'rgba(150,110,20,.45)'}" stroke-width="1.3" stroke-linejoin="round"/>
    <!-- cabeça, por último: nada cobre o rosto -->
    <path d="M82 -1 C93 -6 105 -2 108 7 C111 16 106 23 97 24 C89 25 83 19 81 11 Z"
          fill="${cor}" stroke="${traco}" stroke-width="${larguraTraco}" stroke-linejoin="round"/>
    <ellipse cx="105" cy="16" rx="6" ry="5" fill="${silhueta || focinho}" opacity="${silhueta ? 1 : 0.55}"/>
    <!-- topete -->
    <path d="M87 -2 C93 2 96 6 96 11" stroke="${c[0]}" stroke-width="4" stroke-linecap="round" fill="none"/>
    ${silhueta ? '' : (triste
      ? `<path d="M92 8 C94 5 98 5 100 8" stroke="#5a3c82" stroke-width="2.2" fill="none" stroke-linecap="round"/>
         <path d="M96 12 C96 16 94 18 94 21 C94 23 98 23 98 21 C98 18 96 16 96 12 Z" fill="#74c0fc"/>`
      : `<circle cx="96" cy="9" r="2.6" fill="#5a3c82"/>
         <circle cx="97" cy="8" r=".9" fill="#fff"/>`)}
    <circle cx="107" cy="15" r="1.1" fill="${silhueta ? 'none' : 'rgba(90,60,130,.45)'}"/>
  </g>`;
}

// Os morrinhos do fundo: a mesma silhueta em todas as páginas, para o lugar
// parecer sempre o mesmo lugar.
function morros(clara = GRAMA.clara, escura = GRAMA.escura) {
  return `
    <path d="M0 148 C40 122 78 124 108 142 C140 160 168 128 204 132 C244 136 274 118 320 140 L320 200 L0 200 Z" fill="${escura}"/>
    <path d="M0 164 C46 146 88 152 126 166 C168 180 206 156 250 160 C284 163 300 170 320 164 L320 200 L0 200 Z" fill="${clara}"/>`;
}

function nuvem(x, y, s = 1, cor = '#ffffff', op = 0.9) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}">
    <ellipse cx="0" cy="0" rx="18" ry="11" fill="${cor}"/>
    <ellipse cx="14" cy="3" rx="13" ry="9" fill="${cor}"/>
    <ellipse cx="-14" cy="4" rx="12" ry="8" fill="${cor}"/>
  </g>`;
}

function arcoIris(x, y, r = 78, op = 1, largura = 8) {
  return `<g opacity="${op}" fill="none" stroke-linecap="round">
    ${ARCO.map((c, i) => {
      const raio = r - i * largura;
      return `<path d="M${x - raio} ${y} A${raio} ${raio} 0 0 1 ${x + raio} ${y}" stroke="${c}" stroke-width="${largura}"/>`;
    }).join('')}
  </g>`;
}

function estrela(x, y, r = 5, cor = OURO, op = 1) {
  const pontos = Array.from({ length: 10 }, (_, i) => {
    const raio = i % 2 ? r * 0.42 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + Math.cos(a) * raio).toFixed(1)},${(y + Math.sin(a) * raio).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pontos}" fill="${cor}" opacity="${op}"/>`;
}

function coracao(x, y, s = 1, cor = '#ff8fb1', op = 1) {
  return `<path transform="translate(${x} ${y}) scale(${s})" opacity="${op}" fill="${cor}"
    d="M0 9 C-9 2 -11 -5 -6 -8 C-2.5 -10.5 0 -7.5 0 -5 C0 -7.5 2.5 -10.5 6 -8 C11 -5 9 2 0 9 Z"/>`;
}

function chave(x, y, s = 1, giro = 0, cor = OURO) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${giro})">
    <circle cx="0" cy="-9" r="8.5" fill="none" stroke="${cor}" stroke-width="5"/>
    <rect x="-2.5" y="-2" width="5" height="22" rx="2.5" fill="${cor}"/>
    <rect x="2" y="8" width="9" height="4.5" rx="2" fill="${cor}"/>
    <rect x="2" y="15" width="7" height="4.5" rx="2" fill="${cor}"/>
  </g>`;
}

// A porta trancada, plantada na grama: é assim que a criança vê o amigo
// "preso" — a silhueta dele aparece lá dentro, no escuro.
function porta(x, y, s = 1, { aberta = false, amigo = '#7a4ec7' } = {}) {
  const id = `luz${proximoId++}`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="2" rx="30" ry="6" fill="rgba(70,45,110,.18)"/>
    <path d="M-26 0 L-26 -34 A26 30 0 0 1 26 -34 L26 0 Z" fill="#5b3c96"/>
    ${aberta ? `
      <defs><radialGradient id="${id}" cx=".5" cy=".75" r=".85">
        <stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ffc94f"/>
      </radialGradient></defs>
      <path d="M-20 -2 L-20 -34 A20 24 0 0 1 20 -34 L20 -2 Z" fill="url(#${id})"/>
      <ellipse cx="0" cy="4" rx="42" ry="9" fill="#fff3b0" opacity=".55"/>
      <g stroke="${OURO}" stroke-width="3.4" stroke-linecap="round" opacity=".75">
        <path d="M24 -42 L40 -50"/><path d="M27 -28 L45 -30"/><path d="M24 -14 L40 -8"/>
      </g>`
    : `
      <path d="M-20 -2 L-20 -34 A20 24 0 0 1 20 -34 L20 -2 Z" fill="#2c1c50"/>
      ${unicornio({ x: -24, y: -44, s: 0.34, silhueta: amigo, opacidade: 0.55 })}
      <g transform="translate(0 -20)">
        <rect x="-9" y="-1" width="18" height="14" rx="3.5" fill="${OURO}"/>
        <path d="M-5 -1 L-5 -6 A5 5.5 0 0 1 5 -6 L5 -1" fill="none" stroke="${OURO}" stroke-width="3.4"/>
        <circle cx="0" cy="5" r="2" fill="#b98a18"/>
      </g>`}
  </g>`;
}

// O selo de preço: quantas chaves aquela porta pede. É o número que a
// criança vai reencontrar na loja, embaixo de cada unicórnio e de cada pista.
function selo(x, y, s = 1, quantas = 4) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-23" y="-11" width="46" height="22" rx="11" fill="#fffdf7" stroke="${OURO}" stroke-width="2.5"/>
    ${chave(-11, 1, 0.42, -8)}
    <text x="6" y="6" text-anchor="middle" font-family="Fredoka, sans-serif"
          font-size="15" font-weight="700" fill="#b07a12">${quantas}</text>
  </g>`;
}

// Um portal para outra pista: uma janela em arco com um pedaço daquele lugar
// dentro, e o preço em chaves embaixo.
function portal(x, y, s = 1, { ceu, chao, dentro = '', chaves = 5, aberto = false } = {}) {
  const id = `portal${proximoId++}`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="4" rx="30" ry="6" fill="rgba(70,45,110,.16)"/>
    <defs><clipPath id="${id}">
      <path d="M-24 0 L-24 -32 A24 28 0 0 1 24 -32 L24 0 Z"/>
    </clipPath></defs>
    <path d="M-30 2 L-30 -34 A30 34 0 0 1 30 -34 L30 2 Z" fill="#5b3c96"/>
    <g clip-path="url(#${id})">
      <rect x="-24" y="-62" width="48" height="62" fill="${ceu}"/>
      <rect x="-24" y="-14" width="48" height="14" fill="${chao}"/>
      ${dentro}
    </g>
    ${aberto ? '' : `<g opacity=".28"><path d="M-24 0 L-24 -32 A24 28 0 0 1 24 -32 L24 0 Z" fill="#2c1c50"/></g>
      <g stroke="#5b3c96" stroke-width="2.4" stroke-linecap="round" opacity=".6">
        <path d="M-10 -4 L-10 -46"/><path d="M10 -4 L10 -46"/>
      </g>
      <g transform="translate(0 -10)">
        <rect x="-8" y="-1" width="16" height="12.5" rx="3" fill="${OURO}" stroke="#8a6410" stroke-width="1.4"/>
        <path d="M-4.4 -1 L-4.4 -5.4 A4.4 5 0 0 1 4.4 -5.4 L4.4 -1" fill="none" stroke="${OURO}" stroke-width="3"/>
        <circle cx="0" cy="5.5" r="1.7" fill="#8a6410"/>
      </g>`}
    ${selo(0, 18, 0.78, chaves)}
  </g>`;
}

// A torre lá no alto, onde mora a resposta. Fica sempre longe e na neblina:
// é o único lugar do livro que a criança ainda não pode visitar.
function torre(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="2" rx="26" ry="5" fill="rgba(70,45,110,.2)"/>
    <path d="M-16 0 L-16 -46 L16 -46 L16 0 Z" fill="#5b4a86"/>
    <path d="M-23 -46 L0 -76 L23 -46 Z" fill="#463870"/>
    <path d="M0 -76 L0 -88" stroke="#463870" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M0 -87 L14 -82 L0 -77 Z" fill="#7a4ec7"/>
    <!-- a janelinha acesa: tem alguém ali -->
    <path d="M-14 -26 L-6 -44 L6 -44 L14 -26 Z" fill="${OURO}" opacity=".16"/>
    <path d="M-6 -28 L-6 -38 A6 6 0 0 1 6 -38 L6 -28 Z" fill="${OURO}"/>
    <path d="M0 -28 L0 -43 M-6 -34 L6 -34" stroke="#5b4a86" stroke-width="1.6"/>
    <!-- a porta, trancada como todas as outras -->
    <path d="M-7 0 L-7 -13 A7 8 0 0 1 7 -13 L7 0 Z" fill="#2c1c50"/>
    <g transform="translate(0 -7) scale(.62)">
      <rect x="-8" y="-1" width="16" height="12.5" rx="3" fill="${OURO}"/>
      <path d="M-4.4 -1 L-4.4 -5.4 A4.4 5 0 0 1 4.4 -5.4 L4.4 -1" fill="none" stroke="${OURO}" stroke-width="3"/>
    </g>
  </g>`;
}

// O caminho até a torre, em doze pedras: é o mesmo mini-mapa das doze fases
// que aparece no card do modo Fases — cheia = feita, contornada = a de agora,
// apagada = ainda fechada.
function caminhoDasFases(feitas = 3) {
  return Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const t = i / (LEVEL_COUNT - 1);
    const x = 52 + 166 * t;
    const y = 182 - 46 * Math.pow(t, 1.35);
    const r = 7.4 - 2.9 * t;
    if (i < feitas) return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.62).toFixed(1)}" fill="${OURO}"/>`;
    if (i === feitas) {
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.62).toFixed(1)}"`
        + ` fill="#fffdf7" stroke="#ff5d8f" stroke-width="2.4"/>`;
    }
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.62).toFixed(1)}"`
      + ` fill="#bdaddf"/>`;
  }).join('');
}

function brilho(x, y, s = 1, cor = '#fff6bf', op = 0.9) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}">
    <path d="M0 -11 L2.6 -2.6 L11 0 L2.6 2.6 L0 11 L-2.6 2.6 L-11 0 L-2.6 -2.6 Z" fill="${cor}"/>
  </g>`;
}

// O rastro de arco-íris que a Uni deixa: sai de trás dela e se afina.
function rastro(x, y, comprimento = 96, op = 0.85) {
  const id = `rastro${proximoId++}`;
  return `<defs>
    <linearGradient id="${id}g" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset=".55" stop-color="#fff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${id}"><rect x="${x - comprimento}" y="${y - 14}" width="${comprimento}" height="46" fill="url(#${id}g)"/></mask>
  </defs>
  <g opacity="${op}" fill="none" stroke-linecap="round" mask="url(#${id})">
    ${ARCO.map((c, i) => (
      `<path d="M${x} ${y + i * 4} C${x - comprimento * 0.35} ${y + i * 4 - 5}`
      + ` ${x - comprimento * 0.68} ${y + i * 4 + 6} ${x - comprimento} ${y + i * 4 - 1}"`
      + ` stroke="${c}" stroke-width="${4.6 - i * 0.42}"/>`
    )).join('')}
  </g>`;
}

// O céu de cada página: um degradê, sempre com o horizonte na mesma altura.
function moldura(dentro, cima = '#bfe9ff', baixo = '#ffe3f4') {
  const id = `ceu${proximoId++}`;
  return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${cima}"/><stop offset="1" stop-color="${baixo}"/>
  </linearGradient></defs>
  <rect width="320" height="200" fill="url(#${id})"/>
  ${dentro}
</svg>`;
}

// --- as páginas --------------------------------------------------------

export const STORY = [
  {
    id: 'terras',
    image: './assets/story/1.webp',
    title: 'As Terras Mágicas',
    text: 'Muito longe daqui existe um reino onde o céu é cor-de-rosa e o '
      + 'arco-íris encosta no chão. Ali viviam todos os unicórnios do mundo, '
      + 'correndo juntos o dia inteiro.',
    art: () => moldura(`
      ${arcoIris(160, 158, 92, 0.85)}
      ${nuvem(44, 30, 1)}
      ${nuvem(276, 26, 0.85)}
      ${estrela(298, 64, 5, '#ffe36b', 0.8)}
      ${morros()}
      ${unicornio({ x: 16, y: 104, s: 0.56, corpo: '#fff1d6', focinho: '#ffa96b', crina: ['#ffb02e', '#ffd75e', '#ff7a3c', '#ffe9a3'], chifre: '#ffab1f' })}
      ${unicornio({ x: 316, y: 106, s: 0.54, corpo: '#e9e6ff', focinho: '#b9aef5', crina: ['#6d7fe0', '#9a7ae0', '#bcaef5', '#5b6bd6'], chifre: '#d7dcff', olhando: -1 })}
      ${unicornio({ x: 116, y: 118, s: 0.76 })}
      ${coracao(104, 92, 1.1)}
      ${coracao(206, 84, 0.85, '#ffb4cd')}
      ${brilho(28, 76, 0.7)}
      ${brilho(292, 118, 0.6)}
    `),
  },

  {
    id: 'sumico',
    image: './assets/story/2.webp',
    title: 'A manhã silenciosa',
    text: 'Uma manhã, Uni acordou e não ouviu ninguém. Nem um galope, nem uma '
      + 'risada. Ela chamou pelos amigos até o sol se pôr — mas as Terras '
      + 'Mágicas estavam vazias.',
    art: () => moldura(`
      ${nuvem(72, 40, 1.1, '#e6ebf2', 0.9)}
      ${nuvem(232, 32, 0.95, '#e6ebf2', 0.85)}
      ${nuvem(150, 64, 0.7, '#eef2f7', 0.6)}
      ${arcoIris(160, 152, 96, 0.14)}
      ${morros(GRAMA.triste, GRAMA.tristeEscura)}
      <!-- só as pegadas de quem foi embora -->
      <g opacity=".45" fill="#8fa791">
        <ellipse cx="42" cy="180" rx="6" ry="3.5"/>
        <ellipse cx="62" cy="186" rx="6" ry="3.5"/>
        <ellipse cx="84" cy="179" rx="6" ry="3.5"/>
        <ellipse cx="106" cy="185" rx="6" ry="3.5"/>
        <ellipse cx="128" cy="178" rx="5.4" ry="3.2"/>
      </g>
      ${unicornio({ x: 150, y: 106, s: 0.86, triste: true })}
      <g fill="#7c8d99" font-family="Fredoka, sans-serif" font-weight="600">
        <text x="96" y="96" font-size="22" opacity=".6">?</text>
        <text x="72" y="74" font-size="15" opacity=".45">?</text>
        <text x="118" y="68" font-size="12" opacity=".35">?</text>
      </g>
    `, '#cfd6e2', '#e6dee6'),
  },

  {
    id: 'chave',
    image: './assets/story/3.webp',
    title: 'A primeira chave',
    text: 'No meio da grama, uma coisinha brilhava. Era uma chave dourada, '
      + 'quentinha, girando sozinha no ar. Uni chegou pertinho — e a chave '
      + 'brilhou mais forte.',
    art: () => moldura(`
      ${nuvem(52, 32, 0.9, '#ffffff', 0.8)}
      ${nuvem(266, 40, 0.8, '#ffffff', 0.75)}
      ${morros()}
      <ellipse cx="232" cy="98" rx="46" ry="46" fill="#fff3b0" opacity=".35"/>
      <ellipse cx="232" cy="98" rx="28" ry="28" fill="#fff6d0" opacity=".45"/>
      ${brilho(206, 62, 1.2, '#fff3b0')}
      ${brilho(262, 74, 0.8)}
      ${brilho(198, 122, 0.7)}
      ${brilho(266, 124, 0.55)}
      ${chave(232, 100, 1.6, -12)}
      ${unicornio({ x: 62, y: 100, s: 0.9 })}
      ${coracao(150, 62, 0.8, '#ffb4cd', 0.85)}
      <ellipse cx="234" cy="178" rx="30" ry="6" fill="#fff3b0" opacity=".5"/>
    `, '#bfe9ff', '#ffeccd'),
  },

  {
    id: 'portas',
    image: './assets/story/4.webp',
    title: 'O segredo do arco-íris',
    text: 'O arco-íris se abaixou e contou o segredo: cada amigo estava atrás '
      + 'de uma porta trancada. E cada porta pede o seu tanto de chaves — '
      + 'umas poucas, outras muitas.',
    art: () => moldura(`
      ${arcoIris(160, 128, 92, 0.8, 7)}
      ${nuvem(34, 26, 0.7, '#ffffff', 0.65)}
      ${nuvem(292, 30, 0.65, '#ffffff', 0.65)}
      ${morros()}
      ${porta(54, 176, 0.86, { amigo: '#ffc46b' })}
      ${porta(160, 180, 0.94, { amigo: '#ff8fb1' })}
      ${porta(266, 176, 0.86, { amigo: '#9aa8ee' })}
      ${selo(54, 188, 0.82, 4)}
      ${selo(160, 192, 0.9, 12)}
      ${selo(266, 188, 0.82, 26)}
      ${brilho(108, 146, 0.55)}
      ${brilho(212, 144, 0.55)}
    `),
  },

  {
    id: 'corrida',
    image: './assets/story/5.webp',
    title: 'Correr, correr, correr!',
    text: 'As chaves estavam espalhadas pelas pistas do reino, e só apareciam '
      + 'para quem corria depressa. Então Uni respirou fundo, abriu as asas… '
      + 'e disparou.',
    art: () => moldura(`
      ${nuvem(44, 26, 0.85, '#ffffff', 0.8)}
      ${nuvem(258, 22, 0.75, '#ffffff', 0.75)}
      ${arcoIris(160, 138, 88, 0.38)}
      ${morros()}
      <!-- a pista, uma fita cor-de-rosa atravessando a grama -->
      <path d="M0 158 C60 148 120 148 180 154 C238 160 286 158 320 150 L320 200 L0 200 Z" fill="#f7d9ff"/>
      <path d="M0 158 C60 148 120 148 180 154 C238 160 286 158 320 150" fill="none" stroke="#fff0fb" stroke-width="4"/>
      <g stroke="#ffffff" stroke-width="4" opacity=".6" stroke-linecap="round">
        <path d="M24 178 L54 176"/><path d="M96 180 L126 181"/><path d="M176 184 L206 183"/><path d="M258 180 L288 177"/>
      </g>
      ${rastro(108, 142, 92)}
      <ellipse cx="140" cy="176" rx="40" ry="7" fill="rgba(122,78,199,.14)"/>
      ${unicornio({ x: 92, y: 96, s: 0.96, asa: '#f0e2ff', correndo: true })}
      <!-- o que vem pela frente: uma pedra para desviar, corações e a chave -->
      <ellipse cx="252" cy="172" rx="16" ry="10" fill="#b0a0c8"/>
      <ellipse cx="248" cy="167" rx="10" ry="6.5" fill="#c6b8dc"/>
      ${coracao(230, 112, 0.9)}
      ${coracao(272, 94, 0.75, '#ffb4cd')}
      ${chave(298, 124, 0.9, 14)}
      ${brilho(296, 98, 0.6)}
    `),
  },

  {
    id: 'reencontro',
    image: './assets/story/6.webp',
    title: 'Uma chave, um amigo',
    text: 'A porta do Sol pedia quatro chaves. Uni juntou as quatro, girou a '
      + 'fechadura… e ele saiu correndo para abraçá-la! Depois veio a Lua, que '
      + 'pedia seis. E o reino foi ficando colorido de novo.',
    art: () => moldura(`
      ${arcoIris(160, 140, 100, 0.8)}
      ${nuvem(42, 26, 0.8)}
      ${nuvem(280, 30, 0.75)}
      ${morros()}
      ${porta(44, 192, 0.94, { aberta: true })}
      ${chave(96, 122, 0.95, -28)}
      ${unicornio({ x: 100, y: 118, s: 0.6, corpo: '#fff1d6', focinho: '#ffa96b', crina: ['#ffb02e', '#ffd75e', '#ff7a3c', '#ffe9a3'], chifre: '#ffab1f', correndo: true })}
      ${unicornio({ x: 296, y: 114, s: 0.7, olhando: -1 })}
      ${coracao(196, 78, 1.3)}
      ${coracao(166, 98, 0.85, '#ffb4cd')}
      ${coracao(226, 100, 0.7)}
      ${brilho(134, 70, 0.85)}
      ${estrela(262, 58, 6)}
      ${estrela(30, 62, 5, '#ffe36b')}
    `),
  },

  {
    id: 'caminhos',
    image: './assets/story/7.webp',
    title: 'E os caminhos também!',
    text: 'Não eram só os amigos: os outros cantos do reino também estavam '
      + 'fechados. O País dos Doces, a Praia, a Noite — cada caminho pede as '
      + 'suas chaves para abrir.',
    art: () => moldura(`
      ${nuvem(40, 26, 0.8, '#ffffff', 0.75)}
      ${nuvem(282, 30, 0.75, '#ffffff', 0.75)}
      ${morros()}
      ${portal(56, 168, 0.94, {
        ceu: '#ffc3e2', chao: '#ffabd4', chaves: 5,
        dentro: `<rect x="-15" y="-38" width="4" height="22" rx="2" fill="#fff0cf"/>
                 <circle cx="-13" cy="-42" r="9" fill="#ff8fb1"/>
                 <circle cx="-13" cy="-42" r="4.5" fill="#fff6fb"/>
                 <circle cx="-13" cy="-42" r="1.8" fill="#ff8fb1"/>
                 <path d="M5 -30 L21 -30 L18 -16 L8 -16 Z" fill="#ffe9b8"/>
                 <circle cx="9" cy="-33" r="6" fill="#fff6fb"/>
                 <circle cx="16" cy="-33" r="5.5" fill="#fff6fb"/>
                 <circle cx="13" cy="-38" r="6" fill="#fff6fb"/>
                 <circle cx="13" cy="-43" r="2.6" fill="#ff5d8f"/>`,
      })}
      ${portal(160, 172, 1.02, {
        ceu: '#bfe9ff', chao: '#ffe3a8', chaves: 18,
        dentro: `<circle cx="13" cy="-46" r="8.5" fill="#fff3c4"/>
                 <rect x="-24" y="-22" width="48" height="10" fill="#74c0fc"/>
                 <path d="M-24 -22 C-14 -25 -4 -19 6 -22 C14 -24 20 -20 24 -22 L24 -18 L-24 -18 Z" fill="#a5daff"/>
                 <rect x="-14" y="-40" width="4" height="22" rx="1.6" fill="#b0855e"/>
                 <path d="M-12 -40 C-20 -46 -24 -44 -25 -38 C-20 -41 -16 -41 -12 -40 Z" fill="#6fcf7f"/>
                 <path d="M-12 -40 C-4 -47 0 -45 1 -39 C-4 -42 -8 -42 -12 -40 Z" fill="#8ce99a"/>
                 <path d="M-12 -41 C-13 -50 -10 -53 -6 -52 C-9 -48 -11 -45 -12 -41 Z" fill="#6fcf7f"/>`,
      })}
      ${portal(266, 168, 0.94, {
        ceu: '#2f2a5e', chao: '#3f3a72', chaves: 30,
        dentro: `<circle cx="11" cy="-44" r="8.5" fill="#e9e6ff"/>
                 <circle cx="15" cy="-47" r="7" fill="#2f2a5e"/>
                 ${estrela(-13, -38, 3.6, '#ffe36b')}
                 ${estrela(-3, -50, 2.8, '#fff6bf')}
                 ${estrela(-18, -25, 2.6, '#ffe36b')}
                 ${estrela(6, -28, 2.4, '#fff6bf')}
                 <path d="M-24 -18 C-14 -24 -6 -20 2 -24 C10 -27 18 -22 24 -24 L24 -12 L-24 -12 Z" fill="#4b4590"/>`,
      })}
      ${brilho(108, 138, 0.55)}
      ${brilho(212, 136, 0.55)}
    `),
  },

  {
    id: 'misterio',
    image: './assets/story/8.webp',
    title: 'Mas quem foi?',
    text: 'E ainda falta a Uni descobrir uma coisa: quem foi que trancou os '
      + 'amigos dela? Ninguém sabe. Dizem que a resposta mora lá em cima, na '
      + 'torre da neblina — e que ela só abre para quem vencer todas as fases '
      + 'do reino.',
    art: () => moldura(`
      ${estrela(46, 34, 4.5, '#fff3b0', 0.75)}
      ${estrela(276, 26, 3.8, '#fff3b0', 0.6)}
      ${nuvem(84, 40, 0.9, '#e8ddf7', 0.7)}
      ${nuvem(292, 44, 0.7, '#e8ddf7', 0.5)}
      <!-- o morro de trás, mais alto e mais frio: é lá que a torre fica -->
      <path d="M150 200 C168 132 208 104 244 104 C282 104 316 134 320 200 Z" fill="#9d90c8"/>
      <path d="M168 200 C184 146 214 122 244 122 C276 122 304 150 310 200 Z" fill="#b3a7d8"/>
      ${torre(246, 136, 0.92)}
      <!-- a pergunta pairando sobre a torre -->
      <text x="204" y="66" text-anchor="middle" font-family="Fredoka, sans-serif"
            font-size="46" font-weight="700" fill="#5b3c96" opacity=".34">?</text>
      <text x="286" y="88" text-anchor="middle" font-family="Fredoka, sans-serif"
            font-size="26" font-weight="700" fill="#5b3c96" opacity=".22">?</text>
      <!-- neblina: a torre está sempre longe demais para se ver direito -->
      <g fill="#ffffff">
        <ellipse cx="238" cy="126" rx="66" ry="7" opacity=".5"/>
        <ellipse cx="282" cy="138" rx="48" ry="6" opacity=".42"/>
        <ellipse cx="206" cy="146" rx="40" ry="5" opacity=".35"/>
      </g>
      ${morros()}
      <!-- as doze fases, uma pedra cada, subindo até a torre -->
      ${caminhoDasFases(3)}
      ${unicornio({ x: 4, y: 112, s: 0.72 })}
      ${brilho(120, 122, 0.55)}
      ${coracao(88, 92, 0.7, '#ffb4cd', 0.8)}
    `, '#b4c8f2', '#ffd8e8'),
  },

  {
    id: 'convite',
    image: './assets/story/9.webp',
    title: 'Falta você!',
    text: 'Muito amigo trancado, muito caminho fechado e um mistério lá em '
      + 'cima — e a Uni não dá conta sozinha. Corre com ela, junta as chaves, '
      + 'vence as fases… e traz todo mundo de volta para casa. Vamos?',
    art: () => moldura(`
      ${arcoIris(160, 146, 104)}
      ${nuvem(38, 26, 0.85)}
      ${nuvem(284, 28, 0.8)}
      ${morros()}
      ${unicornio({ x: 92, y: 100, s: 0.98, asa: '#f3e6ff' })}
      ${chave(276, 96, 1.15, 16)}
      ${chave(38, 104, 0.9, -16)}
      ${coracao(232, 60, 1.2)}
      ${coracao(72, 62, 0.85, '#ffb4cd')}
      ${estrela(298, 52, 6)}
      ${estrela(20, 48, 5, '#ffe36b')}
      ${brilho(198, 40, 0.8)}
      ${brilho(300, 132, 0.6)}
    `),
  },
];

export const STORY_PAGES = STORY.length;

// O SVG de uma página. É uma função (e não uma string pronta) porque os ids
// dos gradientes têm de ser diferentes a cada vez que a figura entra na tela.
export function storyArt(indice) {
  return STORY[indice].art();
}
