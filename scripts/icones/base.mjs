// Kit de desenho dos ícones do UnicornRush.
//
// Todo ícone é um SVG 128×128 com a mesma receita: forma gordinha, contorno
// roxo-escuro arredondado, gradiente de cima (mais claro) para baixo e um
// reflexo branco no alto à esquerda — a mesma "bala de goma" das bolhas e
// figurinhas do lobby.

export const O = '#45276a';   // o contorno de tudo
export const W = 6;           // a espessura do contorno

export const COR = {
  rosa: ['#ffb8d2', '#ff4f88'],
  ouro: ['#ffe680', '#ffab14'],
  azul: ['#a9e1ff', '#2e9bf0'],
  verde: ['#b8f2a8', '#34b25a'],
  roxo: ['#dcc8ff', '#8c5fe6'],
  laranja: ['#ffc794', '#ff7124'],
  vermelho: ['#ffa6a6', '#e22d3d'],
  cinza: ['#f2f4f9', '#a2acc1'],
  branco: ['#ffffff', '#e4dcf4'],
  marrom: ['#e3b27f', '#8f552a'],
  creme: ['#fff9e3', '#f0cf93'],
  escuro: ['#7d779c', '#302b47'],
  ciano: ['#d4fcff', '#33c6dc'],
  pele: ['#ffe4b5', '#f6b052'],
};

// Monta um ícone. `desenhar` recebe o contexto `c`, que cria gradientes e
// recortes com id único dentro do arquivo, e devolve o miolo do SVG.
export function icone(desenhar) {
  const defs = [];
  let n = 0;
  const c = {
    // Gradiente vertical em coordenadas do ícone (userSpaceOnUse): funciona
    // igual em preenchimento e em traço, até numa linha reta, onde o
    // gradiente "da caixa do objeto" não teria altura para se espalhar.
    g(cor, y1 = 14, y2 = 114) {
      const [a, b] = Array.isArray(cor) ? cor : COR[cor];
      const id = `g${n++}`;
      defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">`
        + `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);
      return `url(#${id})`;
    },
    clip(formas) {
      const id = `c${n++}`;
      defs.push(`<clipPath id="${id}">${formas}</clipPath>`);
      return `url(#${id})`;
    },
  };
  const miolo = desenhar(c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`
    + `${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${miolo}</svg>`;
}

// Atributos de contorno para uma forma preenchida.
export const st = (w = W) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// O reflexo de bala de goma.
export const brilho = (cx, cy, rx, ry, rot = -30, op = 0.6) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;

// Traço grosso com contorno: o contorno largo embaixo, a cor por cima.
export const traco = (d, cor, w, { cap = 'round', extra = '' } = {}) =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 2 * W}" stroke-linecap="${cap}" stroke-linejoin="round" ${extra}/>`
  + `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round" ${extra}/>`;

// Silhueta unida: várias formas (sem `fill` próprio) com um contorno só em
// volta do conjunto — dedos de uma mão, braços de um cacto, bolinhas de
// pipoca. Primeiro tudo em contorno grosso, depois tudo na cor por cima.
export const uniao = (formas, fill) =>
  `<g fill="${O}" stroke="${O}" stroke-width="${2 * W}" stroke-linejoin="round" stroke-linecap="round">${formas}</g>`
  + `<g fill="${fill}">${formas}</g>`;

export const coracao = 'M64 110 C30 88 12 66 14 45 C16 27 34 18 49 22 C57 24 61 30 64 36 C67 30 71 24 79 22 C94 18 112 27 114 45 C116 66 98 88 64 110 Z';

// Estrela de `pontas` pontas, centro (cx, cy), raios externo e interno.
export function estrela(cx, cy, R, r, pontas = 5, giro = -90) {
  const pts = [];
  for (let i = 0; i < pontas * 2; i++) {
    const a = ((giro + (i * 180) / pontas) * Math.PI) / 180;
    const raio = i % 2 ? r : R;
    pts.push(`${(cx + Math.cos(a) * raio).toFixed(1)},${(cy + Math.sin(a) * raio).toFixed(1)}`);
  }
  return pts.join(' ');
}

// Brilhinho de quatro pontas, de lados curvos.
export function faisca(x, y, s) {
  const k = s * 0.2;
  return `M${x} ${y - s} Q${x + k} ${y - k} ${x + s} ${y} Q${x + k} ${y + k} ${x} ${y + s}`
    + ` Q${x - k} ${y + k} ${x - s} ${y} Q${x - k} ${y - k} ${x} ${y - s} Z`;
}

// Espiral de Arquimedes, do centro para fora, como polilinha.
export function espiral(cx, cy, voltas, raio, passos = 90, giro = 0) {
  const pts = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const a = t * voltas * Math.PI * 2 + giro;
    pts.push(`${(cx + Math.cos(a) * raio * t).toFixed(1)},${(cy + Math.sin(a) * raio * t).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
}

// Lua crescente: o círculo (c1, r1) menos o círculo (c2, r2), como um caminho
// só — para o contorno seguir a borda do crescente.
export function crescente([x1, y1], r1, [x2, y2], r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const mx = x1 + (a * dx) / d;
  const my = y1 + (a * dy) / d;
  const p1 = [mx + (h * dy) / d, my - (h * dx) / d];
  const p2 = [mx - (h * dy) / d, my + (h * dx) / d];
  const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return `M${f(p1)} A${r1} ${r1} 0 1 0 ${f(p2)} A${r2} ${r2} 0 0 1 ${f(p1)} Z`;
}

// O botão quadradinho das setas, do play, do pause…
export const botao = (c, cor, miolo) =>
  `<rect x="12" y="12" width="104" height="104" rx="28" fill="${c.g(cor)}" ${st()}/>`
  + brilho(40, 31, 16, 7, -12, 0.5) + miolo;

// Folha: elipse pontuda com nervura, centrada em (cx, cy), girada `giro`.
export const folha = (c, cx, cy, comp, larg, giro, cor = 'verde') => {
  const m = comp / 2;
  return `<g transform="translate(${cx} ${cy}) rotate(${giro})">`
    + `<path d="M${-m} 0 Q0 ${-larg} ${m} 0 Q0 ${larg} ${-m} 0 Z" fill="${c.g(cor, -larg, larg)}" ${st()}/>`
    + `<path d="M${-m + 6} 0 Q0 ${-larg * 0.12} ${m - 8} 0" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`
    + `</g>`;
};
