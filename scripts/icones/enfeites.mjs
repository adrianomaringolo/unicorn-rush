// Ícones dos enfeites (laço, óculos, colar…) e do álbum de figurinhas.
//
// Cada enfeite tem o seu emoji em `src/models/accessories.js`, e ele aparece
// na tela (o toast de "é seu!", o título da tela de enfeites): sem o ícone
// aqui, a tela voltava a mostrar o emoji do aparelho.
import {
  O, st, brilho, traco, estrela, coracao,
} from './base.mjs';

// As quatro asas da borboleta, de um lado; o outro é o espelho.
const ASA_CIMA = 'M62 58 Q40 14 18 22 Q4 30 14 50 Q24 66 62 64 Z';
const ASA_BAIXO = 'M62 66 Q30 68 26 88 Q24 106 42 104 Q58 100 62 72 Z';

// Flor de cinco pétalas redondas (🌼, 🌺): `cor` é a das pétalas.
function florRedonda(c, cor, miolo, raio = 22, dist = 30) {
  return [0, 72, 144, 216, 288].map((a) => `<ellipse cx="64" cy="${64 - dist}" rx="${raio * 0.85}" ry="${raio}" fill="${c.g(cor, 64 - dist - raio, 64 - dist + raio)}" ${st()} transform="rotate(${a} 64 64)"/>`).join('')
    + `<circle cx="64" cy="64" r="17" fill="${c.g(miolo, 47, 81)}" ${st()}/>`;
}

// Pétala do 🌸: arredondada, com o chanfro na ponta.
const PETALA = 'M64 64 Q44 46 48 26 Q52 14 60 18 L64 24 L68 18 Q76 14 80 26 Q84 46 64 64 Z';

export const ENFEITES = {
  ribbon: {
    emoji: '🎀',
    desenho: (c) => `<path d="M58 70 L40 112 L52 108 L58 118 L64 76 Z" fill="${c.g(['#ff8fb8', '#d9306a'], 70, 118)}" ${st()}/>`
      + `<path d="M70 70 L88 112 L76 108 L70 118 L64 76 Z" fill="${c.g(['#ff8fb8', '#d9306a'], 70, 118)}" ${st()}/>`
      + `<path d="M64 60 Q40 26 18 34 Q6 40 8 60 Q10 82 28 84 Q46 84 64 66 Z" fill="${c.g('rosa', 30, 86)}" ${st()}/>`
      + `<path d="M64 60 Q88 26 110 34 Q122 40 120 60 Q118 82 100 84 Q82 84 64 66 Z" fill="${c.g('rosa', 30, 86)}" ${st()}/>`
      + `<path d="M30 50 Q42 52 52 62 M98 50 Q86 52 76 62" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>`
      + `<rect x="52" y="50" width="24" height="28" rx="10" fill="${c.g(['#ff9cc2', '#e8417c'], 50, 78)}" ${st()}/>`
      + brilho(26, 46, 8, 4, -30, 0.7) + brilho(58, 56, 3, 5, 0, 0.6),
  },
  ledger: {
    emoji: '📒',
    // O álbum: capa azul (a cor da bolha do lobby), argolas do lado e uma
    // figurinha dourada colada na frente.
    desenho: (c) => `<rect x="26" y="12" width="84" height="104" rx="12" fill="${c.g(['#7fd0ff', '#2a7fbf'], 12, 116)}" ${st()}/>`
      + `<rect x="34" y="18" width="70" height="92" rx="8" fill="${c.g('azul', 18, 110)}"/>`
      + [30, 52, 74, 96].map((y) => `<rect x="14" y="${y}" width="26" height="10" rx="5" fill="${c.g('cinza', y, y + 10)}" ${st(4)}/>`).join('')
      + `<rect x="50" y="34" width="44" height="54" rx="7" fill="${c.g('creme', 34, 88)}" ${st(5)} transform="rotate(6 72 61)"/>`
      + `<polygon points="${estrela(72, 62, 16, 7)}" fill="${c.g('ouro', 46, 78)}" ${st(4)} transform="rotate(6 72 61)"/>`
      + brilho(48, 24, 10, 3.5, 0, 0.55),
  },
  butterfly: {
    emoji: '🦋',
    desenho: (c) => {
      const lado = (espelho) => `<g ${espelho ? 'transform="translate(128 0) scale(-1 1)"' : ''}>`
        + `<path d="${ASA_BAIXO}" fill="${c.g('roxo', 66, 106)}" ${st()}/>`
        + `<path d="${ASA_CIMA}" fill="${c.g('azul', 16, 66)}" ${st()}/>`
        + `<circle cx="32" cy="38" r="7" fill="#fff" opacity=".85" ${st(3)}/>`
        + `<circle cx="42" cy="88" r="5" fill="#ffd166" ${st(3)}/>`
        + '</g>';
      return lado(false) + lado(true)
        + `<path d="M60 30 Q54 14 44 10 M68 30 Q74 14 84 10" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`
        + `<rect x="56" y="28" width="16" height="78" rx="8" fill="${c.g('escuro', 28, 106)}" ${st()}/>`
        + brilho(26, 34, 7, 3.5, -30, 0.7);
    },
  },
  cherry_blossom: {
    emoji: '🌸',
    desenho: (c) => [0, 72, 144, 216, 288]
      .map((a) => `<path d="${PETALA}" fill="${c.g(['#ffe0ec', '#ff7fae'], 14, 64)}" ${st()} transform="rotate(${a} 64 64) translate(0 2)"/>`).join('')
      + `<circle cx="64" cy="64" r="15" fill="${c.g('ouro', 49, 79)}" ${st()}/>`
      + [0, 72, 144, 216, 288].map((a) => `<circle cx="64" cy="45" r="3.5" fill="#ff4f88" transform="rotate(${a} 64 64)"/>`).join('')
      + brilho(52, 30, 6, 3, -20, 0.7),
  },
  dark_sunglasses: {
    emoji: '🕶️',
    desenho: (c) => traco('M12 46 Q8 40 4 42 M116 46 Q120 40 124 42', c.g('escuro', 38, 50), 5)
      + traco('M54 52 Q64 44 74 52', c.g('escuro', 44, 56), 7)
      + `<path d="M8 48 H56 Q58 84 34 86 Q10 86 8 60 Z" fill="${c.g('escuro', 46, 88)}" ${st()}/>`
      + `<path d="M72 48 H120 Q118 84 94 86 Q70 84 72 48 Z" fill="${c.g('escuro', 46, 88)}" ${st()}/>`
      + `<path d="M16 56 L30 56 L20 72 Z M80 56 L94 56 L84 72 Z" fill="#fff" opacity=".45"/>`,
  },
  prayer_beads: {
    emoji: '📿',
    // No jogo é o colar de pérolas: um anel de pérolas com um pingente cor
    // de rosa embaixo.
    desenho: (c) => {
      const n = 14;
      const perolas = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = 64 + Math.cos(a) * 42;
        const y = 56 + Math.sin(a) * 38;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${c.g('branco', y - 10, y + 10)}" ${st(4)}/>`
          + brilho(x - 3, y - 3, 3, 2, -30, 0.9);
      }).join('');
      return perolas
        + `<path d="M64 92 L52 106 L64 122 L76 106 Z" fill="${c.g('rosa', 92, 122)}" ${st(5)}/>`
        + brilho(60, 102, 2.5, 4, 30, 0.8);
    },
  },
  scarf: {
    emoji: '🧣',
    desenho: (c) => {
      const listras = (recorte, y0) => `<g clip-path="${recorte}" fill="#fff4ec">`
        + [0, 1, 2, 3].map((i) => `<rect x="0" y="${y0 + i * 22}" width="128" height="9"/>`).join('') + '</g>';
      const ponta1 = 'M66 58 L84 60 L82 112 L64 110 Z';
      const ponta2 = 'M80 56 L100 52 L108 104 L90 108 Z';
      const gola = 'M12 40 Q64 66 116 40 L114 60 Q64 88 14 60 Z';
      return `<path d="${ponta2}" fill="${c.g('vermelho', 52, 108)}"/>` + listras(c.clip(`<path d="${ponta2}"/>`), 66) + `<path d="${ponta2}" fill="none" ${st()}/>`
        + `<path d="${ponta1}" fill="${c.g('vermelho', 58, 112)}"/>` + listras(c.clip(`<path d="${ponta1}"/>`), 74) + `<path d="${ponta1}" fill="none" ${st()}/>`
        + `<path d="M64 110 V120 M70 111 V121 M76 112 V122 M82 112 V120 M90 108 V118 M97 107 V117 M104 105 V115" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`
        + `<path d="${gola}" fill="${c.g('vermelho', 40, 84)}"/>`
        + `<path d="M10 50 Q64 76 118 50" fill="none" stroke="#fff4ec" stroke-width="8" clip-path="${c.clip(`<path d="${gola}"/>`)}"/>`
        + `<path d="${gola}" fill="none" ${st()}/>`
        + brilho(30, 50, 8, 3, 20, 0.6);
    },
  },
  smiling_face_with_heart_eyes: {
    emoji: '😍',
    desenho: (c) => `<circle cx="64" cy="66" r="50" fill="${c.g('ouro', 16, 116)}" ${st()}/>`
      + [42, 86].map((x) => `<path d="${coracao}" fill="${c.g('vermelho', 40, 70)}" ${st(4)} transform="translate(${x - 64 * 0.24} 40) scale(0.24)"/>`).join('')
      + `<path d="M38 80 Q64 108 90 80 Z" fill="${O}" ${st(4)}/>`
      + `<path d="M48 90 Q64 100 80 90 Q72 98 64 98 Q56 98 48 90 Z" fill="#ff8fa8"/>`
      + brilho(40, 34, 10, 5, -30, 0.6),
  },
  sports_medal: {
    emoji: '🏅',
    desenho: (c) => `<path d="M34 6 H56 L72 54 L54 60 Z" fill="${c.g('azul', 6, 60)}" ${st()}/>`
      + `<path d="M94 6 H72 L56 54 L74 60 Z" fill="${c.g('azul', 6, 60)}" ${st()}/>`
      + `<path d="M45 6 L63 57" stroke="#fff" stroke-width="5" opacity=".6"/>`
      + `<circle cx="64" cy="84" r="34" fill="${c.g('ouro', 50, 118)}" ${st()}/>`
      + `<circle cx="64" cy="84" r="23" fill="none" stroke="#e58e00" stroke-width="4" opacity=".6"/>`
      + `<polygon points="${estrela(64, 85, 15, 7)}" fill="#fff" opacity=".9"/>`
      + brilho(46, 68, 7, 4, -40, 0.7),
  },
  blossom: {
    emoji: '🌼',
    desenho: (c) => florRedonda(c, ['#fff8d6', '#ffd23d'], ['#ffb347', '#e0700a'])
      + brilho(52, 24, 7, 3.5, -20, 0.7) + brilho(58, 58, 4, 2.5, -30, 0.7),
  },
  hibiscus: {
    emoji: '🌺',
    desenho: (c) => florRedonda(c, ['#ff8fae', '#e5304a'], ['#ffe07a', '#ffb000'], 24, 30)
      + `<path d="M64 64 L86 38" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`
      + `<circle cx="88" cy="36" r="7" fill="${c.g('ouro', 29, 43)}" ${st(4)}/>`
      + brilho(50, 22, 8, 4, -20, 0.6),
  },
  socks: {
    emoji: '🧦',
    // As polainas: listradas rosa e lilás, com o punho fofo em cima.
    desenho: (c) => {
      const meia = 'M40 30 H82 V78 Q82 84 88 88 L106 98 Q118 106 110 116 Q104 122 92 118 L54 104 Q40 98 40 84 Z';
      const recorte = c.clip(`<path d="${meia}"/>`);
      return `<path d="${meia}" fill="${c.g('rosa', 30, 120)}"/>`
        + `<g clip-path="${recorte}" fill="${c.g('roxo', 30, 120)}">${[44, 70, 96].map((y) => `<rect x="20" y="${y}" width="110" height="13"/>`).join('')}</g>`
        + `<path d="${meia}" fill="none" ${st()}/>`
        + `<rect x="34" y="12" width="54" height="24" rx="10" fill="${c.g('branco', 12, 36)}" ${st()}/>`
        + brilho(50, 56, 4, 12, 0, 0.5);
    },
  },
  santa_claus: {
    emoji: '🎅',
    // O gorro de Papai Noel sozinho — é o que o enfeite é.
    desenho: (c) => `<path d="M22 92 Q30 30 72 18 Q100 14 108 44 L112 66 L98 62 Q94 40 80 40 Q64 44 106 92 Z" fill="${c.g('vermelho', 14, 92)}" ${st()}/>`
      + `<circle cx="104" cy="72" r="13" fill="${c.g('branco', 59, 85)}" ${st()}/>`
      + `<rect x="12" y="86" width="104" height="28" rx="14" fill="${c.g('branco', 86, 114)}" ${st()}/>`
      + brilho(44, 50, 5, 13, 30, 0.45) + brilho(100, 68, 3, 2.5, -30, 0.9),
  },
  deer: {
    emoji: '🦌',
    // Os chifres de rena com o nariz vermelho embaixo.
    desenho: (c) => {
      const chifre = 'M54 92 Q50 60 34 40 Q24 28 14 26 M40 48 Q30 50 22 58 M46 62 Q34 64 26 76 M36 36 Q40 22 34 10';
      const espelho = 'transform="translate(128 0) scale(-1 1)"';
      return traco(chifre, c.g('marrom', 10, 92), 9) + `<g ${espelho}>${traco(chifre, c.g('marrom', 10, 92), 9)}</g>`
        + `<circle cx="64" cy="100" r="20" fill="${c.g('vermelho', 80, 120)}" ${st()}/>`
        + brilho(57, 93, 6, 4, -30, 0.8);
    },
  },
  christmas_tree: {
    emoji: '🎄',
    desenho: (c) => `<rect x="54" y="98" width="20" height="22" rx="4" fill="${c.g('marrom', 98, 120)}" ${st()}/>`
      + `<path d="M64 14 L104 102 Q64 112 24 102 Z" fill="${c.g('verde', 14, 106)}" ${st()}/>`
      + `<path d="M40 66 Q64 80 90 62 M32 88 Q64 102 98 84" fill="none" stroke="#ffd23d" stroke-width="4" stroke-linecap="round"/>`
      + [[52, 56, '#ff3b4f'], [76, 72, '#4fc3ff'], [46, 84, '#b455ff'], [84, 94, '#ff3b4f'], [62, 92, '#ffd23d']]
        .map(([x, y, cor]) => `<circle cx="${x}" cy="${y}" r="6" fill="${cor}" ${st(3)}/>`).join('')
      + `<polygon points="${estrela(64, 16, 15, 7)}" fill="${c.g('ouro', 1, 31)}" ${st(4)}/>`
      + brilho(54, 40, 3, 8, 25, 0.5),
  },
  // A cabeça de um dragãozinho de perfil, verde, de chifrinhos e focinho
  // comprido — para as asas de dragão.
  athletic_shoe: {
    emoji: '👟',
    desenho: (c) => `<path d="M14 92 L14 74 Q14 62 26 60 L50 54 Q60 40 72 44 L80 60 Q104 64 112 78 Q116 92 106 96 L18 98 Z" fill="${c.g('branco', 44, 98)}" ${st()}/>`
      + `<path d="M14 90 H112 Q114 104 104 106 H20 Q12 104 14 90 Z" fill="${c.g('roxo', 90, 106)}" ${st()}/>`
      + `<path d="M84 64 Q104 68 110 80 Q100 84 84 80 Z" fill="${c.g('rosa', 64, 84)}" ${st(4)}/>`
      + `<path d="M54 58 L66 70 M60 52 L72 64 M66 48 L76 58" fill="none" stroke="#ff4f88" stroke-width="5" stroke-linecap="round"/>`
      + `<path d="M28 80 Q46 70 66 80" fill="none" stroke="#33c6dc" stroke-width="6" stroke-linecap="round"/>`
      + brilho(30, 68, 8, 3, -15, 0.6),
  },
  womans_boot: {
    emoji: '👢',
    desenho: (c) => `<path d="M38 14 H76 V72 Q100 74 110 88 Q114 100 102 102 H30 Q24 102 26 92 L38 70 Z" fill="${c.g('ouro', 14, 102)}" ${st()}/>`
      + `<path d="M26 96 H112 Q112 112 100 112 H32 Q24 112 26 96 Z" fill="${c.g('laranja', 96, 112)}" ${st()}/>`
      + `<rect x="32" y="10" width="50" height="16" rx="8" fill="${c.g(['#fff6c4', '#ffe066'], 10, 26)}" ${st(5)}/>`
      + `<circle cx="58" cy="54" r="9" fill="#fff" ${st(4)}/><circle cx="58" cy="54" r="4" fill="#ff8fc6"/>`
      + brilho(48, 40, 4, 12, 0, 0.55),
  },
  ballet_shoes: {
    emoji: '🩰',
    desenho: (c) => traco('M56 18 Q40 40 50 58', '#ff9fc6', 6) + traco('M74 18 Q90 40 80 58', '#ff9fc6', 6)
      + `<path d="M24 64 Q24 54 36 54 H58 Q70 58 70 72 Q70 108 46 110 Q22 108 24 64 Z" fill="${c.g('rosa', 54, 110)}" ${st()}/>`
      + `<path d="M60 64 Q60 54 72 54 H94 Q106 58 106 72 Q106 108 82 110 Q58 108 60 64 Z" fill="${c.g(['#ffd6e6', '#ff8fc0'], 54, 110)}" ${st()}/>`
      + `<ellipse cx="46" cy="70" rx="12" ry="8" fill="#e8457e" opacity=".55"/><ellipse cx="82" cy="70" rx="12" ry="8" fill="#e8457e" opacity=".55"/>`
      + brilho(34, 84, 4, 10, 0, 0.55) + brilho(70, 84, 4, 10, 0, 0.55),
  },
  roller_skate: {
    emoji: '🛼',
    desenho: (c) => `<path d="M34 16 H70 V60 Q98 62 106 76 Q110 88 100 90 H28 Q22 88 24 78 L34 58 Z" fill="${c.g('roxo', 16, 90)}" ${st()}/>`
      + `<rect x="20" y="86" width="90" height="12" rx="6" fill="${c.g('branco', 86, 98)}" ${st()}/>`
      + [[34, 'rosa'], [58, 'ouro'], [82, 'verde']].map(([x, cor]) => `<circle cx="${x}" cy="106" r="11" fill="${c.g(cor, 95, 117)}" ${st()}/><circle cx="${x}" cy="106" r="3.5" fill="#fff"/>`).join('')
      + `<path d="M104 84 Q116 86 114 98 L104 96 Z" fill="${c.g('rosa', 84, 98)}" ${st(4)}/>`
      + `<path d="M44 30 L60 40 M44 42 L60 52" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`
      + brilho(42, 26, 8, 3, -10, 0.6),
  },
  fox: {
    emoji: '🦊',
    desenho: (c) => `<path d="M20 18 L50 40 L78 40 L108 18 L104 62 Q100 98 64 112 Q28 98 24 62 Z" fill="${c.g('laranja', 18, 112)}" ${st()}/>`
      + `<path d="M30 30 L46 44 L32 52 Z M98 30 L82 44 L96 52 Z" fill="#4a2a1a" opacity=".7"/>`
      + `<path d="M30 64 Q46 72 64 70 Q82 72 98 64 Q92 96 64 108 Q36 96 30 64 Z" fill="${c.g('branco', 64, 108)}" ${st(4)}/>`
      + `<circle cx="46" cy="58" r="6" fill="${O}"/><circle cx="82" cy="58" r="6" fill="${O}"/>`
      + `<ellipse cx="64" cy="90" rx="8" ry="6" fill="${O}"/>`
      + brilho(40, 40, 8, 4, -30, 0.5),
  },
  lion: {
    emoji: '🦁',
    desenho: (c) => `<circle cx="64" cy="64" r="50" fill="${c.g(['#e39a3b', '#a3521c'], 14, 114)}" ${st()}/>`
      + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const a = (i / 12) * Math.PI * 2;
        return `<circle cx="${(64 + Math.cos(a) * 44).toFixed(1)}" cy="${(64 + Math.sin(a) * 44).toFixed(1)}" r="10" fill="#c46a26"/>`;
      }).join('')
      + `<circle cx="64" cy="66" r="32" fill="${c.g('ouro', 34, 98)}" ${st()}/>`
      + `<circle cx="38" cy="40" r="8" fill="${c.g('ouro', 32, 48)}" ${st(4)}/><circle cx="90" cy="40" r="8" fill="${c.g('ouro', 32, 48)}" ${st(4)}/>`
      + `<circle cx="52" cy="60" r="5" fill="${O}"/><circle cx="76" cy="60" r="5" fill="${O}"/>`
      + `<path d="M56 74 H72 L64 82 Z" fill="${O}" ${st(3)}/>`
      + `<path d="M64 82 Q58 90 50 86 M64 82 Q70 90 78 86" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`
      + brilho(48, 48, 7, 3, -30, 0.55),
  },
  knot: {
    emoji: '🪢',
    desenho: (c) => {
      // Uma trança de três mechas, de cima para baixo, com o laço no fim.
      const cores = ['rosa', 'roxo', 'azul'];
      let tranca = '';
      for (let i = 0; i < 6; i++) {
        const y = 18 + i * 14;
        const lado = i % 2 ? 1 : -1;
        tranca += `<ellipse cx="${64 + lado * 9}" cy="${y + 7}" rx="15" ry="10" fill="${c.g(cores[i % 3], y - 3, y + 17)}" transform="rotate(${lado * -30} ${64 + lado * 9} ${y + 7})" ${st(4)}/>`;
      }
      return tranca
        + `<path d="M56 100 L44 120 M64 102 V122 M72 100 L84 120" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round"/>`
        + `<path d="M56 100 L44 120" stroke="#ff8fc6" stroke-width="6" stroke-linecap="round"/><path d="M64 102 V122" stroke="#b197fc" stroke-width="6" stroke-linecap="round"/><path d="M72 100 L84 120" stroke="#5cc1ff" stroke-width="6" stroke-linecap="round"/>`
        + `<path d="M64 98 L42 86 L44 108 Z M64 98 L86 86 L84 108 Z" fill="${c.g('rosa', 86, 108)}" ${st(4)}/><circle cx="64" cy="98" r="6" fill="#ff4f88" ${st(3)}/>`;
    },
  },
  peacock: {
    emoji: '🦚',
    desenho: (c) => {
      let leque = '';
      for (let i = 0; i < 7; i++) {
        const a = (-70 + i * (140 / 6)) * Math.PI / 180;
        const x = 64 + Math.sin(a) * 48;
        const y = 92 - Math.cos(a) * 48;
        leque += traco(`M64 96 L${x.toFixed(1)} ${y.toFixed(1)}`, '#3fbf7f', 5)
          + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="${c.g('ouro', y - 11, y + 11)}" ${st(4)}/>`
          + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#2fbf9a"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#2a5fd6"/>`;
      }
      return leque
        + `<path d="M50 112 Q46 86 60 76 Q60 60 70 58 Q80 60 76 70 L84 72 L76 76 Q80 96 74 112 Z" fill="${c.g('azul', 58, 112)}" ${st()}/>`
        + `<circle cx="70" cy="64" r="2.5" fill="${O}"/>`
        + brilho(60, 92, 3, 9, 0, 0.5);
    },
  },
  dragon: {
    emoji: '🐉',
    desenho: (c) => `<path d="M42 36 L34 10 L56 30 Z" fill="${c.g('creme', 10, 36)}" ${st()}/>`
      + `<path d="M70 30 L84 8 L82 36 Z" fill="${c.g('creme', 8, 36)}" ${st()}/>`
      + `<path d="M20 70 Q16 34 56 30 Q84 28 96 48 Q118 56 116 76 Q114 96 90 96 L42 98 Q22 94 20 70 Z" fill="${c.g('verde', 30, 98)}" ${st()}/>`
      + `<path d="M58 84 Q84 90 108 80" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`
      + `<path d="M24 72 L12 64 L22 82 Z" fill="${c.g('verde', 64, 82)}" ${st(4)}/>`
      + `<ellipse cx="56" cy="56" rx="11" ry="13" fill="${c.g('branco', 43, 69)}" ${st(4)}/>`
      + `<circle cx="59" cy="58" r="6" fill="${O}"/>`
      + `<circle cx="96" cy="64" r="3.5" fill="${O}"/><circle cx="106" cy="66" r="3.5" fill="${O}"/>`
      + brilho(40, 44, 9, 4, -30, 0.55),
  },
  headphone: {
    emoji: '🎧',
    desenho: (c) => traco('M22 76 V62 Q22 18 64 18 Q106 18 106 62 V76', c.g('roxo', 14, 76), 11)
      + [[14, 'rosa'], [86, 'rosa']].map(([x, cor]) => `<rect x="${x}" y="62" width="28" height="48" rx="12" fill="${c.g(cor, 62, 110)}" ${st()}/>`).join('')
      + `<rect x="34" y="68" width="10" height="36" rx="5" fill="${c.g('branco', 68, 104)}" ${st(4)}/>`
      + `<rect x="84" y="68" width="10" height="36" rx="5" fill="${c.g('branco', 68, 104)}" ${st(4)}/>`
      + `<path d="M60 92 V70 L74 66 V86" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<ellipse cx="56" cy="92" rx="6" ry="5" fill="${c.g('ouro', 87, 97)}" ${st(3)}/><ellipse cx="70" cy="86" rx="6" ry="5" fill="${c.g('ouro', 81, 91)}" ${st(3)}/>`
      + brilho(22, 72, 3, 9, 0, 0.6) + brilho(94, 72, 3, 9, 0, 0.6) + brilho(40, 30, 7, 3, -30, 0.5),
  },
  bell: {
    emoji: '🔔',
    desenho: (c) => `<circle cx="64" cy="104" r="11" fill="${c.g(['#d9a020', '#8a5a00'], 93, 115)}" ${st()}/>`
      + `<path d="M64 14 Q34 16 32 54 Q30 78 18 90 Q16 98 26 98 H102 Q112 98 110 90 Q98 78 96 54 Q94 16 64 14 Z" fill="${c.g('ouro', 14, 98)}" ${st()}/>`
      + `<path d="M64 6 V14" stroke="${O}" stroke-width="7" stroke-linecap="round"/>`
      + brilho(46, 44, 5, 14, 15, 0.6),
  },
};
