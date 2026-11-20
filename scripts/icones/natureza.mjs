// Ícones de natureza, comida e bichos.
import {
  O, W, st, brilho, traco, uniao, estrela, faisca, espiral, folha,
} from './base.mjs';

const olho = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.38}" fill="#fff"/>`;
const bochecha = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff7aa2" opacity=".5"/>`;

export const NATUREZA = {
  leaf_fluttering_in_wind: {
    emoji: '🍃',
    desenho: (c) => '<g fill="none" stroke="#8fd0ff" stroke-width="5" stroke-linecap="round"><path d="M12 92 Q30 84 42 92"/><path d="M84 24 Q98 16 112 22"/><path d="M96 34 Q106 30 114 34"/></g>'
      + folha(c, 50, 56, 74, 30, -35) + folha(c, 82, 88, 58, 24, 20),
  },
  fallen_leaf: {
    emoji: '🍂',
    desenho: (c) => folha(c, 50, 54, 74, 30, -40, 'laranja') + folha(c, 80, 82, 64, 26, 25, 'vermelho')
      + folha(c, 40, 92, 46, 18, 10, 'ouro'),
  },
  cactus: {
    emoji: '🌵',
    desenho: (c) => `<ellipse cx="64" cy="112" rx="42" ry="9" fill="${c.g('creme', 100, 122)}" ${st()}/>`
      + uniao('<rect x="50" y="16" width="28" height="98" rx="14"/>'
        + '<path d="M50 78 H38 Q28 78 28 68 V50 Q28 42 36 42 Q44 42 44 50 V64 H50 Z"/>'
        + '<path d="M78 66 H90 Q100 66 100 56 V40 Q100 32 92 32 Q84 32 84 40 V52 H78 Z"/>', c.g('verde'))
      + '<g stroke="#1f7a3c" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M64 30 V100"/><path d="M57 40 l-4 -3 M71 56 l4 -3 M57 72 l-4 -3 M71 88 l4 -3"/></g>'
      + `<circle cx="64" cy="16" r="8" fill="${c.g('rosa', 8, 24)}" ${st(4)}/>`
      + brilho(57, 32, 3, 9, 0, 0.5),
  },
  rock: {
    emoji: '🪨',
    // Pedra de facetas — a mesma pedra low-poly que aparece nas pistas.
    desenho: () => {
      const f = (pts, cor) => `<polygon points="${pts}" fill="${cor}" stroke="${O}" stroke-width="2" stroke-linejoin="round" stroke-opacity=".35"/>`;
      return f('30,58 56,32 62,64', '#d7dce8') + f('56,32 90,36 62,64', '#eef1f7') + f('90,36 110,68 62,64', '#b9c0d1')
        + f('16,98 30,58 62,64 46,100', '#a3abbf') + f('46,100 62,64 110,68 106,100', '#8790a8')
        + `<polygon points="16,98 30,58 56,32 90,36 110,68 106,100" fill="none" ${st()}/>`
        + brilho(60, 44, 9, 4, -10, 0.7);
    },
  },
  volcano: {
    emoji: '🌋',
    desenho: (c) => `<circle cx="50" cy="22" r="10" fill="${c.g('cinza', 12, 32)}" ${st(4)}/><circle cx="70" cy="14" r="8" fill="${c.g('cinza', 6, 22)}" ${st(4)}/>`
      + `<path d="M12 112 L46 42 H82 L116 112 Z" fill="${c.g('marrom', 42, 112)}" ${st()}/>`
      + `<path d="M46 42 H82 L78 50 Q72 58 74 72 Q68 66 66 80 Q60 70 56 78 Q54 60 50 50 Z" fill="${c.g(['#ffd23c', '#ff5a1f'], 42, 80)}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`
      + `<ellipse cx="64" cy="42" rx="18" ry="5" fill="#ff7a24" ${st(4)}/>`,
  },
  comet: {
    emoji: '☄️',
    desenho: (c) => `<path d="M28 76 Q70 34 122 6 Q94 54 54 102 Z" fill="${c.g(['#ffe9a0', '#ff8a3c'], 6, 102)}" ${st()}/>`
      + traco('M76 46 L104 22', '#fff6c8', 4) + traco('M64 70 L92 44', '#fff6c8', 4)
      + `<circle cx="42" cy="88" r="25" fill="${c.g(['#ffe680', '#ff8a24'], 63, 113)}" ${st()}/>` + brilho(34, 78, 7, 4, -40, 0.7),
  },
  globe_with_meridians: {
    emoji: '🌐',
    desenho: (c) => `<circle cx="64" cy="64" r="48" fill="${c.g('azul')}"/>`
      + '<g fill="none" stroke="#fff" stroke-width="4.5" opacity=".9"><ellipse cx="64" cy="64" rx="20" ry="48"/><path d="M64 16 V112 M16 64 H112 M24 40 H104 M24 88 H104"/></g>'
      + `<circle cx="64" cy="64" r="48" fill="none" ${st()}/>` + brilho(44, 36, 10, 5, -40, 0.6),
  },
  globe_showing_americas: {
    emoji: '🌍',
    desenho: (c) => {
      const terra = c.clip('<circle cx="64" cy="64" r="48"/>');
      return `<circle cx="64" cy="64" r="48" fill="${c.g('azul')}"/>`
        + `<g clip-path="${terra}" fill="${c.g('verde')}" stroke="${O}" stroke-width="3" stroke-linejoin="round">`
        + '<path d="M30 26 Q50 18 60 30 Q66 42 54 48 Q48 52 52 62 Q56 72 46 76 Q38 70 36 58 Q26 52 22 42 Z"/>'
        + '<path d="M62 78 Q76 74 82 84 Q86 98 74 112 Q64 108 62 96 Q58 86 62 78 Z"/>'
        + '<path d="M82 30 Q98 30 106 44 Q100 50 92 46 Q84 42 82 30 Z"/></g>'
        + `<circle cx="64" cy="64" r="48" fill="none" ${st()}/>` + brilho(44, 34, 10, 5, -40, 0.6);
    },
  },
  world_map: {
    emoji: '🗺️',
    desenho: (c) => `<path d="M12 30 L46 18 L82 32 L116 20 V100 L82 112 L46 98 L12 110 Z" fill="${c.g(['#c4ecff', '#7cc8f5'])}" ${st()}/>`
      + '<path d="M46 18 V98 L82 112 V32 Z" fill="#000" opacity=".08"/>'
      + `<g fill="${c.g('verde')}" stroke="${O}" stroke-width="3" stroke-linejoin="round"><path d="M22 44 Q34 36 42 46 Q44 58 34 62 Q26 60 22 44 Z"/><path d="M56 60 Q70 52 76 64 Q74 80 62 84 Q54 76 56 60 Z"/><path d="M88 40 Q102 34 108 46 Q104 58 92 56 Q86 50 88 40 Z"/></g>`
      + '<path d="M90 76 l10 10 M100 76 l-10 10" stroke="#e22d3d" stroke-width="5" stroke-linecap="round"/>'
      + `<path d="M46 18 V98 M82 32 V112" stroke="${O}" stroke-width="3" opacity=".5"/>`,
  },

  // --- comida ---
  strawberry: {
    emoji: '🍓',
    desenho: (c) => {
      const sementes = [[50, 58], [70, 56], [88, 62], [42, 74], [60, 74], [80, 78], [52, 92], [70, 94]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="4" fill="#ffe680"/>`).join('');
      return `<path d="M64 118 C36 110 18 80 22 58 C26 42 44 38 64 42 C84 38 102 42 106 58 C110 80 92 110 64 118 Z" fill="${c.g('vermelho', 38, 118)}" ${st()}/>`
        + sementes + brilho(40, 60, 5, 10, 20, 0.5)
        + `<path d="M64 44 L44 30 L56 30 L50 16 L64 26 L78 16 L72 30 L84 30 Z" fill="${c.g('verde', 14, 46)}" ${st(5)}/>`;
    },
  },
  cherries: {
    emoji: '🍒',
    desenho: (c) => traco('M42 82 Q48 46 78 22', '#5a9a3a', 5) + traco('M88 88 Q82 52 78 22', '#5a9a3a', 5)
      + folha(c, 92, 24, 34, 13, -20)
      + `<circle cx="40" cy="88" r="23" fill="${c.g('vermelho', 65, 111)}" ${st()}/>`
      + `<circle cx="88" cy="94" r="22" fill="${c.g('vermelho', 72, 116)}" ${st()}/>`
      + brilho(32, 80, 6, 4, -40, 0.7) + brilho(80, 86, 6, 4, -40, 0.7),
  },
  lemon: {
    emoji: '🍋',
    desenho: (c) => `<g transform="rotate(-18 64 70)"><path d="M8 70 Q12 61 21 61 Q36 38 64 38 Q92 38 107 61 Q116 61 120 70 Q116 79 107 79 Q92 102 64 102 Q36 102 21 79 Q12 79 8 70 Z" fill="${c.g('ouro', 38, 102)}" ${st()}/>`
      + '<g fill="#e09a00" opacity=".45"><circle cx="78" cy="84" r="2"/><circle cx="90" cy="76" r="2"/><circle cx="70" cy="92" r="2"/><circle cx="96" cy="86" r="1.8"/></g>'
      + `${brilho(44, 54, 13, 5, -5, 0.7)}</g>` + folha(c, 86, 26, 40, 15, -30),
  },
  coconut: {
    emoji: '🥥',
    desenho: (c) => `<path d="M18 62 A46 46 0 0 0 110 62 Z" fill="${c.g('marrom', 60, 110)}" ${st()}/>`
      + '<path d="M30 86 l6 -4 M50 98 l4 -6 M78 98 l-4 -6 M98 86 l-6 -4" stroke="#5a3418" stroke-width="3" stroke-linecap="round" opacity=".7"/>'
      + `<ellipse cx="64" cy="62" rx="46" ry="18" fill="#fff" ${st()}/>`
      + `<ellipse cx="64" cy="62" rx="32" ry="10" fill="${c.g('creme', 52, 72)}"/>`
      + `<ellipse cx="64" cy="62" rx="32" ry="10" fill="none" stroke="${O}" stroke-width="2.5" opacity=".35"/>`,
  },
  lollipop: {
    emoji: '🍭',
    desenho: (c) => `<rect x="58" y="70" width="12" height="52" rx="6" fill="${c.g('branco', 70, 122)}" ${st()}/>`
      + `<circle cx="64" cy="50" r="40" fill="${c.g('rosa', 10, 90)}"/>`
      + `<path d="${espiral(64, 50, 3, 38, 120, 0.5)}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`
      + `<circle cx="64" cy="50" r="40" fill="none" ${st()}/>` + brilho(44, 30, 9, 5, -40, 0.7),
  },
  popcorn: {
    emoji: '🍿',
    desenho: (c) => {
      const caixa = c.clip('<path d="M28 54 H100 L92 118 H36 Z"/>');
      return uniao(['<circle cx="38" cy="48" r="13"/>', '<circle cx="58" cy="36" r="15"/>', '<circle cx="80" cy="38" r="14"/>',
        '<circle cx="96" cy="50" r="12"/>', '<circle cx="66" cy="20" r="11"/>', '<circle cx="46" cy="24" r="10"/>'].join(''), c.g('creme', 8, 62))
        + '<circle cx="58" cy="32" r="4" fill="#ffd56b" opacity=".8"/><circle cx="82" cy="34" r="3.5" fill="#ffd56b" opacity=".8"/>'
        + `<path d="M28 54 H100 L92 118 H36 Z" fill="#fff"/>`
        + `<g clip-path="${caixa}" fill="${c.g('vermelho', 54, 118)}"><rect x="34" y="50" width="13" height="72"/><rect x="58" y="50" width="13" height="72"/><rect x="82" y="50" width="13" height="72"/></g>`
        + `<path d="M28 54 H100 L92 118 H36 Z" fill="none" ${st()}/>`;
    },
  },
  baby_bottle: {
    emoji: '🍼',
    desenho: (c) => {
      const frasco = c.clip('<rect x="38" y="46" width="52" height="70" rx="16"/>');
      return `<path d="M50 38 Q48 22 58 18 Q64 6 70 18 Q80 22 78 38 Z" fill="${c.g(['#ffe9c2', '#f5c06a'], 8, 38)}" ${st()}/>`
        + `<rect x="38" y="46" width="52" height="70" rx="16" fill="#e8f6ff"/>`
        + `<rect x="30" y="80" width="68" height="40" clip-path="${frasco}" fill="#fff"/>`
        + `<rect x="38" y="46" width="52" height="70" rx="16" fill="none" ${st()}/>`
        + '<path d="M78 62 H86 M78 74 H86 M78 86 H86" stroke="#8fb6d9" stroke-width="3" stroke-linecap="round"/>'
        + `<rect x="34" y="34" width="60" height="16" rx="7" fill="${c.g('rosa', 34, 50)}" ${st()}/>`
        + brilho(50, 60, 3, 9, 0, 0.8);
    },
  },

  // --- bichos ---
  unicorn: {
    emoji: '🦄',
    // De perfil, olhando para a esquerda, com a crina de mechas do arco-íris
    // descendo pelo pescoço — as mesmas cores do rastro da Uni.
    desenho: (c) => {
      const mechas = [[84, 34, '#ff6f9f'], [96, 50, '#ff9a3c'], [104, 68, '#ffd23c'], [108, 86, '#46c97a'], [108, 104, '#3fa9f5']]
        .map(([x, y, cor]) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="11" fill="${cor}" ${st()} transform="rotate(62 ${x} ${y})"/>`)
        .join('');
      return mechas
        + `<path d="M90 120 L92 84 Q94 62 82 50 L72 42 Q56 36 44 48 L22 70 Q14 80 20 90 Q26 98 38 94 L52 88 Q60 104 56 120 Z" fill="${c.g('branco', 36, 120)}" ${st()}/>`
        + `<path d="M74 40 L84 14 L90 46 Z" fill="${c.g('branco', 14, 46)}" ${st(5)}/>`
        + '<path d="M80 26 L84 20 L86 38" fill="#ffc4da"/>'
        + `<ellipse cx="66" cy="42" rx="13" ry="9" fill="#b07cf5" ${st(5)} transform="rotate(-25 66 42)"/>`
        + `<path d="M56 36 L42 4 L68 32 Z" fill="${c.g('ouro', 4, 36)}" ${st(5)}/>`
        + '<path d="M48 18 L58 15 M52 27 L62 23" stroke="#c98a10" stroke-width="3" stroke-linecap="round"/>'
        + olho(50, 62, 6) + bochecha(38, 80) + `<circle cx="26" cy="82" r="2.8" fill="${O}"/>`
        + brilho(66, 98, 4, 10, 10, 0.7);
    },
  },
  turtle: {
    emoji: '🐢',
    desenho: (c) => `<ellipse cx="104" cy="74" rx="15" ry="13" fill="${c.g(['#c8f2a8', '#5fc46a'], 60, 88)}" ${st()}/>`
      + `<rect x="30" y="80" width="18" height="22" rx="8" fill="${c.g(['#c8f2a8', '#5fc46a'], 80, 102)}" ${st()}/>`
      + `<rect x="74" y="80" width="18" height="22" rx="8" fill="${c.g(['#c8f2a8', '#5fc46a'], 80, 102)}" ${st()}/>`
      + `<path d="M18 86 Q20 34 62 34 Q102 34 104 86 Z" fill="${c.g('verde', 34, 86)}" ${st()}/>`
      + '<path d="M44 52 L62 44 L80 52 L80 70 L62 78 L44 70 Z M18 76 L44 70 M80 70 L104 76 M62 78 V86 M44 52 L34 44 M80 52 L90 44" fill="none" stroke="#1f7a3c" stroke-width="3" stroke-linejoin="round" opacity=".55"/>'
      + `<rect x="12" y="80" width="98" height="12" rx="6" fill="${c.g('creme', 80, 92)}" ${st()}/>`
      + olho(108, 70, 3.5) + brilho(44, 46, 9, 4, -30, 0.6),
  },
  tropical_fish: {
    emoji: '🐠',
    desenho: (c) => {
      const corpo = c.clip('<ellipse cx="58" cy="64" rx="42" ry="32"/>');
      return `<path d="M92 64 L120 38 Q114 64 120 90 Z" fill="${c.g('azul', 38, 90)}" ${st()}/>`
        + `<path d="M40 36 Q58 12 80 36 Z" fill="${c.g('azul', 16, 36)}" ${st()}/>`
        + `<ellipse cx="58" cy="64" rx="42" ry="32" fill="${c.g('ouro', 32, 96)}"/>`
        + `<g clip-path="${corpo}" fill="${c.g('azul', 32, 96)}"><rect x="40" y="20" width="12" height="90"/><rect x="68" y="20" width="12" height="90"/></g>`
        + `<ellipse cx="58" cy="64" rx="42" ry="32" fill="none" ${st()}/>`
        + olho(32, 58, 6) + brilho(46, 44, 9, 4, -15, 0.6);
    },
  },
  octopus: {
    emoji: '🐙',
    desenho: (c) => {
      const cor = c.g(['#ffb8e0', '#e05fb0'], 16, 118);
      const tentaculos = ['M36 72 Q24 92 14 100', 'M48 78 Q42 100 34 114', 'M64 80 Q64 102 62 118', 'M80 78 Q86 100 94 114', 'M92 72 Q104 92 114 100']
        .map((d) => `<path d="${d}"/>`).join('');
      return `<g fill="none" stroke="${O}" stroke-width="${14 + 2 * W}" stroke-linecap="round">${tentaculos}</g>`
        + `<g fill="none" stroke="${cor}" stroke-width="14" stroke-linecap="round">${tentaculos}</g>`
        + `<path d="M24 74 Q20 16 64 14 Q108 16 104 74 Q64 88 24 74 Z" fill="${cor}" ${st()}/>`
        + olho(50, 54, 7) + olho(78, 54, 7) + bochecha(40, 68, 5) + bochecha(88, 68, 5)
        + `<path d="M58 70 Q64 76 70 70" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`
        + brilho(46, 28, 11, 5, -20, 0.6);
    },
  },
  bat: {
    emoji: '🦇',
    desenho: (c) => `<path d="M64 50 Q52 38 36 42 Q24 30 6 38 Q18 54 12 72 Q26 64 36 72 Q44 60 54 68 L64 80 L74 68 Q84 60 92 72 Q102 64 116 72 Q110 54 122 38 Q104 30 92 42 Q76 38 64 50 Z" fill="${c.g(['#8b7ab8', '#3b2f5e'], 30, 80)}" ${st()}/>`
      + `<path d="M50 50 L48 30 L58 42 L70 42 L80 30 L78 50 Q78 76 64 78 Q50 76 50 50 Z" fill="${c.g(['#9b8ac8', '#4a3d70'], 30, 78)}" ${st()}/>`
      + '<circle cx="57" cy="54" r="5" fill="#fff"/><circle cx="71" cy="54" r="5" fill="#fff"/>'
      + `<circle cx="58" cy="55" r="2.6" fill="${O}"/><circle cx="72" cy="55" r="2.6" fill="${O}"/>`
      + '<path d="M60 66 L62 70 L64 66 L66 70 L68 66" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>',
  },
  parrot: {
    emoji: '🦜',
    desenho: (c) => `<path d="M60 92 Q58 110 48 124 Q70 116 76 94 Z" fill="${c.g('azul', 90, 124)}" ${st()}/>`
      + `<path d="M74 90 Q84 108 84 124 Q98 104 86 86 Z" fill="${c.g('ouro', 86, 124)}" ${st()}/>`
      + `<path d="M40 40 Q38 18 60 16 Q82 16 84 44 Q90 74 76 98 Q60 104 50 88 Q38 68 40 40 Z" fill="${c.g('vermelho', 16, 104)}" ${st()}/>`
      + `<path d="M62 54 Q84 54 84 80 Q78 96 66 92 Q56 76 62 54 Z" fill="${c.g(['#8fe08a', '#2e9e4e'], 54, 96)}" ${st()}/>`
      + '<path d="M66 64 Q76 68 78 80 M64 74 Q72 78 72 88" fill="none" stroke="#1d6b34" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      + `<path d="M42 32 Q24 30 22 46 Q22 56 32 58 Q30 48 42 46 Z" fill="${c.g(['#fff2c4', '#f0b43c'], 30, 58)}" ${st()}/>`
      + '<circle cx="54" cy="32" r="8" fill="#fff"/>' + olho(55, 32, 4) + brilho(68, 26, 6, 3, -30, 0.6),
  },
  spiral_shell: {
    emoji: '🐚',
    desenho: (c) => `<path d="M20 98 Q12 56 42 30 Q66 12 92 28 Q114 44 106 72 Q98 98 66 104 Q40 110 20 98 Z" fill="${c.g(['#fff0e6', '#ffb8a0'], 14, 108)}" ${st()}/>`
      + `<path d="${espiral(72, 62, 2.4, 34, 100, 3.6)}" fill="none" stroke="#e0806a" stroke-width="5" stroke-linecap="round"/>`
      + `<path d="M20 98 Q38 86 58 96" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round" opacity=".5"/>`
      + brilho(48, 36, 10, 5, -35, 0.7),
  },
};

// Usados por mais de um grupo.
export { olho, bochecha, faisca, estrela };
