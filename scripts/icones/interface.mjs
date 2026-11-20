// Ícones de interface: botões, corações, estrelas, céu e tempo.
import {
  O, W, st, brilho, traco, coracao, estrela, faisca, crescente, botao,
} from './base.mjs';

const seta = '<path d="M30 64 L60 36 L60 52 L96 52 L96 76 L60 76 L60 92 Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>';
const branco = (d, w = 10) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const INTERFACE = {
  left_arrow: { emoji: '⬅️', desenho: (c) => botao(c, 'azul', seta) },
  right_arrow: { emoji: '➡️', desenho: (c) => botao(c, 'azul', `<g transform="matrix(-1 0 0 1 128 0)">${seta}</g>`) },
  up_arrow: { emoji: '⬆️', desenho: (c) => botao(c, 'azul', `<g transform="rotate(90 64 64)">${seta}</g>`) },
  play_button: {
    emoji: '▶️',
    desenho: (c) => botao(c, 'verde', '<path d="M50 38 L92 64 L50 90 Z" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>'),
  },
  pause_button: {
    emoji: '⏸️',
    desenho: (c) => botao(c, 'azul', '<rect x="40" y="38" width="17" height="52" rx="7" fill="#fff"/><rect x="71" y="38" width="17" height="52" rx="7" fill="#fff"/>'),
  },
  repeat_button: {
    emoji: '🔁',
    desenho: (c) => botao(c, 'roxo',
      branco('M36 62 V54 Q36 42 48 42 H86') + branco('M78 32 L89 42 L78 52')
      + branco('M92 66 V74 Q92 86 80 86 H42') + branco('M50 76 L39 86 L50 96')),
  },
  counterclockwise_arrows_button: {
    emoji: '🔄',
    desenho: (c) => botao(c, 'azul',
      branco('M40 58 A26 26 0 0 1 86 48') + branco('M74 44 L87 48 L88 34')
      + branco('M88 70 A26 26 0 0 1 42 80') + branco('M54 84 L41 80 L40 94')),
  },
  shuffle_tracks_button: {
    emoji: '🔀',
    desenho: (c) => botao(c, 'roxo',
      branco('M32 44 H46 C64 44 64 84 82 84 H94') + branco('M32 84 H46 C64 84 64 44 82 44 H94')
      + branco('M86 34 L96 44 L86 54') + branco('M86 74 L96 84 L86 94')),
  },
  check_mark_button: { emoji: '✅', desenho: (c) => botao(c, 'verde', branco('M36 66 L56 86 L94 42', 14)) },
  plus: { emoji: '➕', desenho: (c) => botao(c, 'rosa', branco('M64 36 V92 M36 64 H92', 15)) },
  information: {
    emoji: 'ℹ️',
    desenho: (c) => botao(c, 'azul', '<circle cx="64" cy="38" r="9" fill="#fff"/><rect x="55" y="54" width="18" height="40" rx="9" fill="#fff"/>'),
  },
  red_question_mark: {
    emoji: '❓',
    desenho: (c) => traco('M42 46 Q42 22 64 22 Q88 22 88 44 Q88 58 72 64 Q64 68 64 78', c.g('rosa', 20, 80), 20)
      + `<circle cx="64" cy="102" r="12" fill="${c.g('rosa', 90, 114)}" ${st()}/>`
      + brilho(52, 30, 7, 4, -40, 0.7),
  },
  warning: {
    emoji: '⚠️',
    desenho: (c) => `<path d="M64 16 L116 106 H12 Z" fill="${c.g('ouro')}" ${st(W + 4)}/>`
      + `<path d="M64 16 L116 106 H12 Z" fill="none" stroke="${c.g('ouro')}" stroke-width="2" stroke-linejoin="round"/>`
      + `<rect x="57" y="44" width="14" height="36" rx="7" fill="${O}"/><circle cx="64" cy="93" r="8" fill="${O}"/>`
      + brilho(56, 40, 8, 4, -60, 0.5),
  },

  // --- corações ---
  growing_heart: {
    emoji: '💗',
    // O anel em volta é o "crescendo": o coração pulsando para fora.
    desenho: (c) => `<path d="${coracao}" fill="none" stroke="#ff8fb4" stroke-width="5" opacity=".8" transform="translate(64 66) scale(1.13) translate(-64 -66)"/>`
      + `<path d="${coracao}" fill="${c.g('rosa', 20, 110)}" ${st()} transform="translate(64 66) scale(.9) translate(-64 -66)"/>`
      + `<path d="${coracao}" fill="#fff" opacity=".35" transform="translate(64 66) scale(.42) translate(-64 -62)"/>`
      + brilho(41, 43, 10, 5, -40),
  },
  sparkling_heart: {
    emoji: '💖',
    desenho: (c) => `<path d="${coracao}" fill="${c.g('rosa', 20, 110)}" ${st()}/>` + brilho(38, 40, 11, 6, -40)
      + `<path d="${faisca(104, 26, 16)}" fill="${c.g('ouro', 10, 42)}" ${st(4)}/>`
      + `<path d="${faisca(22, 20, 10)}" fill="${c.g('ouro', 10, 30)}" ${st(4)}/>`
      + `<path d="${faisca(70, 76, 9)}" fill="#fff" opacity=".9"/>`,
  },
  black_heart: {
    emoji: '🖤',
    desenho: (c) => `<path d="${coracao}" fill="${c.g('escuro', 20, 110)}" ${st()}/>` + brilho(38, 40, 11, 6, -40, 0.35),
  },
  white_heart: {
    emoji: '🤍',
    desenho: (c) => `<path d="${coracao}" fill="${c.g('branco', 20, 110)}" ${st()}/>` + brilho(38, 40, 11, 6, -40, 0.9),
  },

  // --- estrelas e brilhos ---
  star: {
    emoji: '⭐',
    desenho: (c) => `<polygon points="${estrela(64, 68, 54, 25)}" fill="${c.g('ouro')}" ${st(W + 2)}/>`
      + brilho(50, 50, 9, 5, -35, 0.7),
  },
  sparkles: {
    emoji: '✨',
    desenho: (c) => `<path d="${faisca(54, 72, 40)}" fill="${c.g('ouro', 32, 112)}" ${st(5)}/>`
      + `<path d="${faisca(96, 32, 20)}" fill="${c.g('ouro', 12, 52)}" ${st(5)}/>`
      + `<path d="${faisca(100, 94, 13)}" fill="${c.g('ouro', 80, 108)}" ${st(4)}/>`
      + brilho(48, 60, 5, 3, -45, 0.7),
  },
  dizzy: {
    emoji: '💫',
    desenho: (c) => traco('M22 108 Q12 70 46 66 Q72 64 70 86 Q68 100 54 96', c.g('ouro', 60, 110), 8)
      + `<polygon points="${estrela(82, 44, 34, 15, 5, -100)}" fill="${c.g('ouro', 10, 80)}" ${st()}/>`
      + brilho(74, 32, 6, 3, -35, 0.7),
  },

  // --- céu e tempo ---
  sun: {
    emoji: '☀️',
    desenho: (c) => {
      const raios = Array.from({ length: 8 }, (_, i) =>
        `<rect x="57" y="4" width="14" height="24" rx="7" fill="${c.g('laranja', 4, 28)}" ${st(5)} transform="rotate(${i * 45} 64 64)"/>`).join('');
      return raios + `<circle cx="64" cy="64" r="33" fill="${c.g('ouro', 31, 97)}" ${st()}/>` + brilho(52, 50, 9, 5, -40, 0.7);
    },
  },
  sun_with_face: {
    emoji: '🌞',
    desenho: (c) => {
      const raios = Array.from({ length: 8 }, (_, i) =>
        `<rect x="57" y="4" width="14" height="24" rx="7" fill="${c.g('laranja', 4, 28)}" ${st(5)} transform="rotate(${i * 45 + 22.5} 64 64)"/>`).join('');
      const olho = (x) => `<path d="M${x - 6} 62 Q${x} 54 ${x + 6} 62" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>`;
      return raios + `<circle cx="64" cy="64" r="35" fill="${c.g('ouro', 29, 99)}" ${st()}/>`
        + olho(52) + olho(76)
        + `<path d="M52 74 Q64 88 76 74" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>`
        + '<circle cx="43" cy="73" r="6" fill="#ff7aa2" opacity=".55"/><circle cx="85" cy="73" r="6" fill="#ff7aa2" opacity=".55"/>'
        + brilho(50, 44, 8, 4, -40, 0.7);
    },
  },
  crescent_moon: {
    emoji: '🌙',
    desenho: (c) => `<path d="${crescente([58, 66], 46, [84, 46], 38)}" fill="${c.g('ouro')}" ${st()}/>`
      + brilho(30, 66, 5, 12, 10, 0.6)
      + `<path d="${faisca(100, 92, 9)}" fill="${c.g('ouro', 80, 104)}" ${st(4)}/>`,
  },
  cloud: {
    emoji: '☁️',
    desenho: (c) => `<path d="M32 96 Q12 96 12 78 Q12 60 32 60 Q34 34 58 34 Q76 34 82 50 Q90 42 100 46 Q116 52 112 70 Q120 74 118 84 Q116 96 102 96 Z" fill="${c.g('branco', 34, 96)}" ${st()}/>`
      + brilho(52, 48, 10, 5, -20, 0.9),
  },
  rainbow: {
    emoji: '🌈',
    desenho: (c) => {
      const arco = (r) => `M${64 - r} 98 A${r} ${r} 0 0 1 ${64 + r} 98`;
      const faixas = [[54, '#ff5d6c'], [45, '#ffa63c'], [36, '#ffd93c'], [27, '#5fcf6f'], [18, '#4aa8f5']]
        .map(([r, cor]) => `<path d="${arco(r)}" fill="none" stroke="${cor}" stroke-width="9.5"/>`).join('');
      const nuvem = (x) => `<path d="M${x - 18} 106 Q${x - 24} 106 ${x - 24} 99 Q${x - 24} 90 ${x - 14} 91 Q${x - 10} 82 ${x} 84 Q${x + 12} 82 ${x + 14} 92 Q${x + 24} 92 ${x + 22} 101 Q${x + 20} 106 ${x + 14} 106 Z" fill="${c.g('branco', 82, 106)}" ${st(5)}/>`;
      return `<path d="${arco(36)}" fill="none" stroke="${O}" stroke-width="${5 * 9.5 + 2 * W}"/>`
        + faixas + nuvem(22) + nuvem(106);
    },
  },
  fog: {
    emoji: '🌫️',
    desenho: (c) => traco('M30 40 H104', c.g('cinza', 30, 100), 13) + traco('M18 64 H92', c.g('cinza', 30, 100), 13)
      + traco('M36 88 H110', c.g('cinza', 30, 100), 13),
  },
  snowflake: {
    emoji: '❄️',
    desenho: (c) => {
      const braco = 'M64 64 V18 M64 34 L52 24 M64 34 L76 24 M64 50 L55 43 M64 50 L73 43';
      const d = Array.from({ length: 6 }, (_, i) => `<path d="${braco}" transform="rotate(${i * 60} 64 64)"/>`).join('');
      return `<g fill="none" stroke="${O}" stroke-width="${8 + 2 * W}" stroke-linecap="round" stroke-linejoin="round">${d}</g>`
        + `<g fill="none" stroke="${c.g('azul', 10, 118)}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${d}</g>`
        + `<circle cx="64" cy="64" r="9" fill="#fff" ${st(4)}/>`;
    },
  },
  ice: {
    emoji: '🧊',
    desenho: (c) => `<path d="M22 88 V44 L64 66 V112 Z" fill="${c.g(['#9eeefa', '#45c8e0'], 44, 112)}" ${st()}/>`
      + `<path d="M106 88 V44 L64 66 V112 Z" fill="${c.g(['#6fdcef', '#2aa6c6'], 44, 112)}" ${st()}/>`
      + `<path d="M64 22 L106 44 L64 66 L22 44 Z" fill="${c.g(['#ffffff', '#c8f6ff'], 22, 66)}" ${st()}/>`
      + '<path d="M32 58 V78" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>'
      + brilho(56, 38, 9, 4, 25, 0.9),
  },
  water_wave: {
    emoji: '🌊',
    desenho: (c) => `<path d="M10 112 V82 Q16 50 44 40 Q70 30 92 40 Q112 50 112 68 Q102 58 90 62 Q78 68 84 82 Q94 96 118 88 V112 Z" fill="${c.g('azul', 34, 112)}" ${st()}/>`
      + traco('M24 70 Q40 46 70 44 Q92 44 104 56', '#fff', 6)
      + '<circle cx="104" cy="74" r="5" fill="#fff"/><circle cx="114" cy="80" r="3.5" fill="#fff"/>',
  },
  fire: {
    emoji: '🔥',
    desenho: (c) => `<path d="M64 118 C34 118 20 98 22 76 C24 54 40 46 42 22 C56 32 62 44 60 60 C66 52 70 44 70 30 C92 44 108 64 106 84 C104 104 90 118 64 118 Z" fill="${c.g(['#ffb03c', '#ff3d2e'], 22, 118)}" ${st()}/>`
      + `<path d="M64 110 C50 110 44 100 46 90 C48 80 56 76 58 66 C66 72 70 78 70 86 C74 82 76 78 76 74 C84 82 86 92 82 100 C78 106 72 110 64 110 Z" fill="${c.g(['#fff3a0', '#ffc22e'], 66, 110)}"/>`
      + brilho(40, 62, 5, 10, 20, 0.45),
  },
  high_voltage: {
    emoji: '⚡',
    desenho: (c) => `<path d="M76 8 L28 70 H60 L48 120 L100 52 H68 L84 8 Z" fill="${c.g('ouro', 8, 120)}" ${st()}/>`
      + brilho(66, 26, 4, 10, 35, 0.7),
  },
};
