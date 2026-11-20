// Ícones de objetos, pessoas e bandeiras.
import {
  O, W, st, brilho, traco, uniao, estrela, faisca,
} from './base.mjs';

export const OBJETOS = {
  key: {
    emoji: '🔑',
    // A moeda do jogo: a chave mágica, dourada, deitada na diagonal.
    desenho: (c) => `<g transform="rotate(-40 64 64)">`
      + uniao('<rect x="90" y="66" width="11" height="20" rx="3"/><rect x="74" y="66" width="11" height="14" rx="3"/>'
        + '<rect x="52" y="56" width="62" height="15" rx="6"/>'
        + '<path fill-rule="evenodd" d="M36 38 A26 26 0 1 1 35.9 38 Z M36 54 A10 10 0 1 0 36.1 54 Z"/>', c.g('ouro', 30, 100))
      + brilho(26, 52, 7, 4, -30, 0.7) + brilho(84, 60, 10, 2.5, 0, 0.6) + '</g>',
  },
  locked: {
    emoji: '🔒',
    desenho: (c) => traco('M40 60 V44 Q40 18 64 18 Q88 18 88 44 V60', c.g('cinza', 14, 60), 12)
      + `<rect x="24" y="56" width="80" height="60" rx="16" fill="${c.g('ouro', 56, 116)}" ${st()}/>`
      + `<circle cx="64" cy="80" r="9" fill="${O}"/><rect x="59" y="82" width="10" height="20" rx="4" fill="${O}"/>`
      + brilho(42, 68, 10, 4, -15, 0.7),
  },
  crown: {
    emoji: '👑',
    desenho: (c) => `<path d="M18 94 L12 38 L40 62 L64 22 L88 62 L116 38 L110 94 Z" fill="${c.g('ouro', 22, 94)}" ${st()}/>`
      + `<rect x="16" y="88" width="96" height="22" rx="8" fill="${c.g(['#ffd04a', '#e58e00'], 88, 110)}" ${st()}/>`
      + `<circle cx="12" cy="36" r="8" fill="#ff5d8f" ${st(4)}/><circle cx="64" cy="18" r="9" fill="#3fa9f5" ${st(4)}/><circle cx="116" cy="36" r="8" fill="#ff5d8f" ${st(4)}/>`
      + `<circle cx="40" cy="99" r="5" fill="#46c97a" ${st(3)}/><circle cx="64" cy="99" r="6" fill="#b07cf5" ${st(3)}/><circle cx="88" cy="99" r="5" fill="#46c97a" ${st(3)}/>`
      + brilho(40, 72, 8, 4, -40, 0.6),
  },
  trophy: {
    emoji: '🏆',
    desenho: (c) => traco('M36 34 H22 Q16 34 18 46 Q22 62 40 64', c.g('ouro', 30, 66), 7)
      + traco('M92 34 H106 Q112 34 110 46 Q106 62 88 64', c.g('ouro', 30, 66), 7)
      + `<rect x="56" y="80" width="16" height="20" fill="${c.g('ouro', 80, 100)}" ${st()}/>`
      + `<rect x="34" y="96" width="60" height="20" rx="6" fill="${c.g(['#c98a4a', '#7a4520'], 96, 116)}" ${st()}/>`
      + `<path d="M34 20 H94 V50 Q94 84 64 86 Q34 84 34 50 Z" fill="${c.g('ouro', 20, 86)}" ${st()}/>`
      + `<polygon points="${estrela(64, 50, 15, 7)}" fill="#fff" opacity=".85"/>`
      + brilho(44, 34, 4, 9, 0, 0.7),
  },
  '1st_place_medal': {
    emoji: '🥇',
    desenho: (c) => `<path d="M30 8 H52 L72 52 L56 60 Z" fill="${c.g('azul', 8, 60)}" ${st()}/>`
      + `<path d="M98 8 H76 L56 52 L72 60 Z" fill="${c.g('vermelho', 8, 60)}" ${st()}/>`
      + `<circle cx="64" cy="84" r="34" fill="${c.g('ouro', 50, 118)}" ${st()}/>`
      + `<circle cx="64" cy="84" r="23" fill="none" stroke="#e59400" stroke-width="4" opacity=".6"/>`
      + `<path d="M57 76 L67 70 V100 M57 100 H77" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
      + brilho(48, 68, 7, 4, -40, 0.7),
  },
  chequered_flag: {
    emoji: '🏁',
    desenho: (c) => {
      const pano = 'M34 20 Q54 12 74 20 Q94 28 114 20 V74 Q94 82 74 74 Q54 66 34 74 Z';
      const recorte = c.clip(`<path d="${pano}"/>`);
      const casas = [];
      for (let col = 0; col < 4; col++) {
        for (let lin = 0; lin < 4; lin++) {
          if ((col + lin) % 2) casas.push(`<rect x="${34 + col * 20}" y="${10 + lin * 18}" width="20" height="18"/>`);
        }
      }
      return `<rect x="22" y="14" width="10" height="106" rx="5" fill="${c.g('cinza')}" ${st()}/>`
        + `<path d="${pano}" fill="#fff"/><g clip-path="${recorte}" fill="${O}">${casas.join('')}</g>`
        + `<path d="${pano}" fill="none" ${st()}/>`;
    },
  },
  balloon: {
    emoji: '🎈',
    desenho: (c) => `<path d="M64 96 Q54 106 64 114 Q72 120 64 126" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`
      + `<path d="M58 96 L64 88 L70 96 Z" fill="#e22d3d" ${st(4)}/>`
      + `<path d="M64 90 C34 86 22 62 26 42 C30 20 48 8 64 8 C80 8 98 20 102 42 C106 62 94 86 64 90 Z" fill="${c.g('vermelho', 8, 90)}" ${st()}/>`
      + brilho(46, 34, 7, 14, 25, 0.6),
  },
  party_popper: {
    emoji: '🎉',
    desenho: (c) => {
      const confete = [[74, 22, '#ff5d8f', 20], [100, 34, '#3fa9f5', -30], [92, 60, '#46c97a', 40], [112, 76, '#ffc13c', 10], [60, 12, '#b07cf5', -20]]
        .map(([x, y, cor, r]) => `<rect x="${x - 5}" y="${y - 3}" width="10" height="6" rx="2" fill="${cor}" ${st(3)} transform="rotate(${r} ${x} ${y})"/>`).join('');
      const recorte = c.clip('<path d="M14 116 L44 46 L84 86 Z"/>');
      return traco('M70 52 Q80 30 104 18', '#ff9a3c', 5) + traco('M78 64 Q98 52 116 56', '#b07cf5', 5) + confete
        + `<path d="M14 116 L44 46 L84 86 Z" fill="${c.g('ouro', 46, 116)}"/>`
        + `<g clip-path="${recorte}" fill="#ff5d8f"><path d="M30 60 L80 110 L72 118 L22 68 Z"/><path d="M40 40 L96 96 L90 102 L34 46 Z"/></g>`
        + `<path d="M14 116 L44 46 L84 86 Z" fill="none" ${st()}/>`;
    },
  },
  wrapped_gift: {
    emoji: '🎁',
    desenho: (c) => `<ellipse cx="48" cy="30" rx="18" ry="11" fill="${c.g('ouro', 18, 42)}" ${st()} transform="rotate(25 48 30)"/>`
      + `<ellipse cx="80" cy="30" rx="18" ry="11" fill="${c.g('ouro', 18, 42)}" ${st()} transform="rotate(-25 80 30)"/>`
      + `<rect x="22" y="58" width="84" height="58" rx="8" fill="${c.g('rosa', 58, 116)}" ${st()}/>`
      + `<rect x="14" y="40" width="100" height="24" rx="8" fill="${c.g(['#ffc8dc', '#ff6f9f'], 40, 64)}" ${st()}/>`
      + `<rect x="55" y="40" width="18" height="76" fill="${c.g('ouro', 40, 116)}" ${st()}/>`
      + `<circle cx="64" cy="38" r="8" fill="${c.g('ouro', 30, 46)}" ${st(4)}/>`
      + brilho(32, 48, 7, 3, 0, 0.7),
  },
  circus_tent: {
    emoji: '🎪',
    desenho: (c) => {
      const teto = 'M64 22 L114 66 H14 Z';
      const parede = 'M20 66 H108 L112 114 H16 Z';
      const listras = (recorte) => `<g clip-path="${recorte}" fill="#e22d3d">${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M64 20 L${i * 26 - 14} 120 L${i * 26 - 2} 120 Z"/>`).join('')}</g>`;
      return `<path d="M64 24 V6" stroke="${O}" stroke-width="4" stroke-linecap="round"/>` + `<path d="M64 8 L82 13 L64 18 Z" fill="#46c97a" ${st(4)}/>`
        + `<path d="${parede}" fill="#fff"/>` + listras(c.clip(`<path d="${parede}"/>`)) + `<path d="${parede}" fill="none" ${st()}/>`
        + `<path d="M50 114 Q50 86 64 84 Q78 86 78 114 Z" fill="${c.g('escuro', 84, 114)}" ${st(4)}/>`
        + `<path d="${teto}" fill="#fff"/>` + listras(c.clip(`<path d="${teto}"/>`)) + `<path d="${teto}" fill="none" ${st()}/>`;
    },
  },
  musical_note: {
    emoji: '🎵',
    desenho: (c) => `<path d="M60 22 Q92 28 100 56 Q88 44 66 44 Z" fill="${c.g('roxo', 22, 56)}" ${st()}/>`
      + `<rect x="58" y="20" width="10" height="78" rx="4" fill="${c.g('roxo', 20, 98)}" ${st()}/>`
      + `<ellipse cx="46" cy="96" rx="20" ry="15" fill="${c.g('roxo', 80, 112)}" ${st()} transform="rotate(-20 46 96)"/>`
      + brilho(40, 90, 6, 3, -30, 0.7),
  },
  speaker_high_volume: {
    emoji: '🔊',
    desenho: (c) => alto(c) + traco('M82 48 Q92 64 82 80', '#3fa9f5', 6) + traco('M96 36 Q114 64 96 92', '#3fa9f5', 6),
  },
  speaker_low_volume: {
    emoji: '🔈',
    desenho: (c) => alto(c) + traco('M82 52 Q90 64 82 76', '#3fa9f5', 6),
  },
  muted_speaker: {
    emoji: '🔇',
    desenho: (c) => alto(c) + traco('M84 50 L110 78 M110 50 L84 78', '#ff4f6a', 7),
  },
  bar_chart: {
    emoji: '📊',
    desenho: (c) => `<rect x="14" y="16" width="100" height="96" rx="16" fill="${c.g('branco', 16, 112)}" ${st()}/>`
      + `<rect x="30" y="64" width="18" height="32" rx="4" fill="${c.g('verde', 64, 96)}" ${st(4)}/>`
      + `<rect x="55" y="38" width="18" height="58" rx="4" fill="${c.g('azul', 38, 96)}" ${st(4)}/>`
      + `<rect x="80" y="52" width="18" height="44" rx="4" fill="${c.g('rosa', 52, 96)}" ${st(4)}/>`
      + `<path d="M26 98 H102" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`,
  },
  open_book: {
    emoji: '📖',
    desenho: (c) => `<path d="M64 40 Q42 30 8 34 V108 Q42 102 64 112 Q86 102 120 108 V34 Q86 30 64 40 Z" fill="${c.g('roxo', 30, 112)}" ${st()}/>`
      + `<path d="M64 34 Q44 22 16 26 V98 Q44 94 64 104 Z" fill="${c.g('branco', 22, 104)}" ${st()}/>`
      + `<path d="M64 34 Q84 22 112 26 V98 Q84 94 64 104 Z" fill="${c.g('branco', 22, 104)}" ${st()}/>`
      + '<g stroke="#b9a6e0" stroke-width="3.5" stroke-linecap="round"><path d="M26 44 Q40 42 54 48 M26 58 Q40 56 54 62 M26 72 Q40 70 54 76 M74 48 Q88 42 102 44 M74 62 Q88 56 102 58 M74 76 Q88 70 102 72"/></g>',
  },
  mobile_phone_with_arrow: {
    emoji: '📲',
    desenho: (c) => `<rect x="54" y="10" width="54" height="108" rx="14" fill="${c.g('escuro', 10, 118)}" ${st()}/>`
      + `<rect x="62" y="22" width="38" height="78" rx="6" fill="${c.g('azul', 22, 100)}"/>`
      + `<circle cx="81" cy="108" r="4" fill="#fff" opacity=".7"/>`
      + traco('M12 62 H52', c.g('verde', 44, 80), 9) + traco('M38 46 L54 62 L38 78', c.g('verde', 44, 80), 9)
      + brilho(72, 34, 4, 9, 20, 0.5),
  },
  test_tube: {
    emoji: '🧪',
    desenho: (c) => {
      const vidro = c.clip('<rect x="50" y="14" width="28" height="100" rx="14"/>');
      return `<g transform="rotate(30 64 64)">`
        + `<rect x="50" y="14" width="28" height="100" rx="14" fill="#eef8ff"/>`
        + `<rect x="40" y="62" width="48" height="60" clip-path="${vidro}" fill="${c.g(['#9ff0a0', '#2fb05a'], 62, 114)}"/>`
        + '<circle cx="60" cy="80" r="4" fill="#fff" opacity=".8"/><circle cx="68" cy="94" r="3" fill="#fff" opacity=".8"/>'
        + `<rect x="50" y="14" width="28" height="100" rx="14" fill="none" ${st()}/>`
        + `<rect x="44" y="10" width="40" height="12" rx="6" fill="${c.g('cinza', 10, 22)}" ${st()}/>`
        + brilho(58, 44, 2.5, 12, 0, 0.8) + '</g>';
    },
  },
  magnet: {
    emoji: '🧲',
    desenho: (c) => `<path d="M36 22 V66 Q36 100 64 100 Q92 100 92 66 V22" fill="none" stroke="${O}" stroke-width="${26 + 2 * W}" stroke-linejoin="round"/>`
      + `<path d="M36 28 V66 Q36 94 64 94 Q92 94 92 66 V28" fill="none" stroke="${c.g('vermelho', 28, 108)}" stroke-width="26"/>`
      + `<path d="M36 28 V48 M92 28 V48" stroke="${c.g('cinza', 28, 48)}" stroke-width="26"/>`
      + `<path d="M23 48 H49 M79 48 H105" stroke="${O}" stroke-width="4"/>`
      + brilho(32, 70, 3, 9, 0, 0.6) + `<path d="${faisca(64, 22, 10)}" fill="#ffe680" ${st(3)}/>`,
  },
  broom: {
    emoji: '🧹',
    desenho: (c) => traco('M100 10 L62 66', c.g('marrom', 10, 66), 8)
      + `<path d="M50 60 L76 78 Q74 102 60 120 Q36 116 16 100 Q34 84 50 60 Z" fill="${c.g(['#ffe9a0', '#e8b23c'], 60, 120)}" ${st()}/>`
      + '<g stroke="#b9822a" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M52 74 L32 104 M60 78 L46 112 M68 82 L60 114"/></g>'
      + `<path d="M48 58 L80 80 L74 88 L42 66 Z" fill="${c.g('vermelho', 58, 88)}" ${st(5)}/>`,
  },
  shield: {
    emoji: '🛡️',
    desenho: (c) => `<path d="M64 10 L108 26 V60 Q108 98 64 118 Q20 98 20 60 V26 Z" fill="${c.g('azul', 10, 118)}" ${st()}/>`
      + '<path d="M64 24 L96 36 V60 Q96 88 64 104 Z" fill="#fff" opacity=".22"/>'
      + `<polygon points="${estrela(64, 62, 22, 10)}" fill="#fff" ${st(4)}/>`
      + brilho(40, 34, 8, 4, -20, 0.6),
  },
  crystal_ball: {
    emoji: '🔮',
    desenho: (c) => `<path d="M34 98 H94 L102 118 H26 Z" fill="${c.g('marrom', 98, 118)}" ${st()}/>`
      + `<circle cx="64" cy="58" r="44" fill="${c.g(['#e6d4ff', '#7d4fd8'], 14, 102)}" ${st()}/>`
      + `<path d="${faisca(78, 66, 12)}" fill="#fff" opacity=".85"/><path d="${faisca(56, 80, 7)}" fill="#fff" opacity=".7"/>`
      + brilho(46, 36, 12, 6, -40, 0.7),
  },
  gem_stone: {
    emoji: '💎',
    desenho: (c) => `<path d="M34 24 H94 L118 52 L64 116 L10 52 Z" fill="${c.g(['#c8f6ff', '#2fb4e0'], 24, 116)}" ${st()}/>`
      + '<path d="M10 52 H118 M34 24 L48 52 L64 24 L80 52 L94 24 M48 52 L64 116 L80 52" fill="none" stroke="#45276a" stroke-width="3" stroke-linejoin="round" opacity=".45"/>'
      + '<path d="M48 52 L64 24 L80 52 Z" fill="#fff" opacity=".45"/><path d="M10 52 L34 24 L48 52 Z" fill="#fff" opacity=".3"/>',
  },
  top_hat: {
    emoji: '🎩',
    desenho: (c) => {
      const copa = 'M34 30 Q64 22 94 30 L90 98 Q64 104 38 98 Z';
      return `<ellipse cx="64" cy="100" rx="56" ry="14" fill="${c.g('escuro', 86, 114)}" ${st()}/>`
        + `<path d="${copa}" fill="${c.g('escuro', 22, 104)}"/>`
        + `<rect x="30" y="74" width="68" height="16" clip-path="${c.clip(`<path d="${copa}"/>`)}" fill="${c.g('rosa', 74, 90)}"/>`
        + `<path d="${copa}" fill="none" ${st()}/>` + `<ellipse cx="64" cy="29" rx="30" ry="7" fill="#5d5780" ${st(4)}/>`
        + brilho(46, 52, 3, 12, 0, 0.35);
    },
  },
  rocket: {
    emoji: '🚀',
    desenho: (c) => `<g transform="rotate(45 64 64)">`
      + `<path d="M50 92 Q64 128 78 92 Z" fill="${c.g(['#ffe680', '#ff7124'], 92, 124)}" ${st()}/>`
      + `<path d="M42 70 L24 94 V106 L44 94 Z" fill="${c.g('vermelho', 70, 106)}" ${st()}/>`
      + `<path d="M86 70 L104 94 V106 L84 94 Z" fill="${c.g('vermelho', 70, 106)}" ${st()}/>`
      + `<path d="M64 6 Q88 26 88 64 V94 H40 V64 Q40 26 64 6 Z" fill="${c.g('branco', 6, 94)}" ${st()}/>`
      + `<path d="M64 6 Q76 16 82 30 H46 Q52 16 64 6 Z" fill="${c.g('vermelho', 6, 30)}" ${st(4)}/>`
      + `<circle cx="64" cy="54" r="12" fill="${c.g('azul', 42, 66)}" ${st()}/>` + brilho(60, 50, 4, 2.5, -40, 0.8)
      + '</g>',
  },
  bubbles: {
    emoji: '🫧',
    desenho: (c) => [[48, 72, 36], [96, 36, 19], [98, 94, 14]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.g(['#f2fbff', '#9fd6ff'], y - r, y + r)}" fill-opacity=".9" ${st()}/>`
        + brilho(x - r * 0.38, y - r * 0.38, r * 0.3, r * 0.16, -40, 0.85)).join(''),
  },
  house: {
    emoji: '🏠',
    desenho: (c) => `<rect x="80" y="22" width="14" height="30" fill="${c.g('vermelho', 22, 52)}" ${st()}/>`
      + `<rect x="26" y="58" width="76" height="58" rx="6" fill="${c.g('creme', 58, 116)}" ${st()}/>`
      + `<path d="M12 66 L64 18 L116 66" fill="${c.g('vermelho', 18, 66)}" ${st(W + 2)}/>`
      + `<rect x="52" y="80" width="24" height="36" rx="5" fill="${c.g('marrom', 80, 116)}" ${st()}/>`
      + `<rect x="82" y="72" width="16" height="16" rx="3" fill="${c.g('azul', 72, 88)}" ${st(4)}/>`
      + `<circle cx="70" cy="99" r="2.5" fill="${O}"/>`,
  },
  beach_with_umbrella: {
    emoji: '🏖️',
    desenho: (c) => {
      const lona = 'M18 58 Q64 4 110 58 Z';
      return `<path d="M8 86 Q64 76 120 86 V100 H8 Z" fill="${c.g('azul', 76, 100)}"/>`
        + `<path d="M8 96 Q64 84 120 96 V118 Q64 124 8 118 Z" fill="${c.g('ouro', 84, 124)}" ${st()}/>`
        + traco('M64 50 L58 110', '#fff', 5)
        + `<path d="${lona}" fill="#fff"/>`
        + `<g clip-path="${c.clip(`<path d="${lona}"/>`)}" fill="#ff5d8f"><path d="M64 0 L20 70 L40 70 Z"/><path d="M64 0 L74 70 L94 70 Z"/></g>`
        + `<path d="${lona}" fill="none" ${st()}/>`;
    },
  },
  feather: {
    emoji: '🪶',
    desenho: (c) => `<g transform="rotate(35 64 64)">`
      + `<path d="M64 8 Q94 34 86 78 Q80 100 64 116 Q48 100 42 78 Q34 34 64 8 Z" fill="${c.g(['#e2f4ff', '#79b8f5'], 8, 116)}" ${st()}/>`
      + '<path d="M44 62 L56 70 M84 50 L72 58" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
      + traco('M64 30 V124', c.g('branco', 30, 124), 4) + '</g>',
  },
  pencil: {
    emoji: '✏️',
    desenho: (c) => `<g transform="rotate(45 64 64)">`
      + `<path d="M52 94 H76 L64 120 Z" fill="${c.g('creme', 94, 120)}" ${st()}/>`
      + `<path d="M60 112 H68 L64 120 Z" fill="${O}"/>`
      + `<rect x="52" y="22" width="24" height="74" fill="${c.g('ouro', 22, 96)}" ${st()}/>`
      + '<path d="M64 26 V92" stroke="#e59400" stroke-width="3" opacity=".6"/>'
      + `<rect x="52" y="6" width="24" height="16" rx="6" fill="${c.g('rosa', 6, 22)}" ${st()}/>`
      + `<rect x="50" y="18" width="28" height="9" rx="2" fill="${c.g('cinza', 18, 27)}" ${st(4)}/>`
      + '</g>',
  },
  wastebasket: {
    emoji: '🗑️',
    desenho: (c) => `<path d="M28 40 H100 L92 116 H36 Z" fill="${c.g('cinza', 40, 116)}" ${st()}/>`
      + '<path d="M50 54 L54 104 M64 54 V104 M78 54 L74 104" stroke="#7d87a1" stroke-width="5" stroke-linecap="round"/>'
      + `<rect x="18" y="28" width="92" height="16" rx="7" fill="${c.g(['#e6eaf3', '#8e98b0'], 28, 44)}" ${st()}/>`
      + traco('M52 28 V20 H76 V28', '#c4cbdb', 5)
      + brilho(40, 60, 3, 12, 0, 0.6),
  },

  // --- gente e mãos ---
  speaking_head: {
    emoji: '🗣️',
    desenho: (c) => `<path d="M28 118 V98 Q14 92 16 70 Q16 28 54 24 Q84 22 86 50 L96 64 Q98 70 92 72 L88 72 V84 Q88 94 76 94 H68 V118 Z" fill="${c.g('roxo', 22, 118)}" ${st()}/>`
      + traco('M102 44 Q112 54 104 66', '#ff5d8f', 5) + traco('M108 30 Q126 54 112 80', '#ff5d8f', 5)
      + brilho(38, 40, 10, 5, -30, 0.5),
  },
  waving_hand: {
    emoji: '👋',
    desenho: (c) => '<g fill="none" stroke="#ffc13c" stroke-width="5" stroke-linecap="round"><path d="M18 30 Q14 40 18 50"/><path d="M8 26 Q2 40 8 56"/><path d="M104 104 Q114 104 118 94"/></g>'
      + `<g transform="rotate(-20 64 70)">${uniao(
        '<rect x="34" y="20" width="15" height="52" rx="7.5"/><rect x="51" y="12" width="15" height="58" rx="7.5"/>'
        + '<rect x="68" y="16" width="15" height="56" rx="7.5"/><rect x="85" y="28" width="14" height="46" rx="7"/>'
        + '<path d="M34 58 H99 V84 Q99 116 66 116 Q38 116 30 92 L18 66 Q14 56 22 54 Q28 52 34 62 Z"/>', c.g('pele', 12, 116))}</g>`,
  },
  backhand_index_pointing_up: {
    emoji: '👆',
    // O indicador fica na beirada da mão, com as juntas dos outros dedos
    // dobrados aparecendo ao lado e o polegar por cima: com o dedo no meio de
    // um punho liso, a figura lia como outro gesto — num jogo de criança.
    desenho: (c) => uniao('<rect x="30" y="6" width="22" height="72" rx="11"/>'
      + '<rect x="30" y="50" width="70" height="70" rx="24"/>'
      + '<circle cx="64" cy="56" r="12"/><circle cx="86" cy="60" r="12"/>', c.g('pele', 6, 120))
      + '<path d="M75 50 Q76 60 74 68 M54 52 Q55 60 53 68" fill="none" stroke="#c9822a" stroke-width="3" stroke-linecap="round" opacity=".75"/>'
      + `<rect x="18" y="74" width="48" height="20" rx="10" fill="${c.g('pele', 74, 94)}" ${st()} transform="rotate(-28 42 84)"/>`
      + brilho(38, 22, 2.5, 9, 0, 0.7),
  },
  person_running: {
    emoji: '🏃',
    desenho: (c) => traco('M58 74 L42 92 L22 92', c.g('roxo', 70, 96), 11) + traco('M62 46 L46 56 L36 48', c.g('pele', 40, 60), 9)
      + traco('M60 72 L64 46', c.g('azul', 40, 80), 20)
      + traco('M58 74 L76 90 L72 114', c.g('roxo', 70, 116), 11) + traco('M64 50 L82 62 L96 54', c.g('pele', 44, 66), 9)
      + `<circle cx="74" cy="26" r="13" fill="${c.g('pele', 13, 39)}" ${st()}/>`
      + `<path d="M62 22 Q66 10 80 12 Q90 16 86 26 Q78 18 64 26 Z" fill="${c.g('marrom', 10, 28)}"/>`,
  },

  // --- bandeiras (a troca de idioma) ---
  flag_brazil: {
    emoji: '🇧🇷',
    desenho: (c) => `<rect x="8" y="24" width="112" height="80" rx="14" fill="${c.g('verde', 24, 104)}" ${st()}/>`
      + `<path d="M64 32 L110 64 L64 96 L18 64 Z" fill="${c.g('ouro', 32, 96)}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`
      + `<circle cx="64" cy="64" r="20" fill="${c.g(['#3b6fd8', '#1d3f9a'], 44, 84)}" stroke="${O}" stroke-width="3"/>`
      + `<path d="M45 60 Q64 54 83 66" fill="none" stroke="#fff" stroke-width="4" clip-path="${c.clip('<circle cx="64" cy="64" r="20"/>')}"/>`
      + brilho(26, 36, 8, 3, -10, 0.5),
  },
  flag_united_states: {
    emoji: '🇺🇸',
    desenho: (c) => {
      const pano = c.clip('<rect x="8" y="24" width="112" height="80" rx="14"/>');
      const listras = [0, 2, 4, 6].map((i) => `<rect x="8" y="${24 + i * 11.43}" width="112" height="11.43" fill="#e22d3d"/>`).join('');
      const estrelinhas = [];
      for (let lin = 0; lin < 3; lin++) for (let col = 0; col < 4; col++) estrelinhas.push(`<circle cx="${18 + col * 11}" cy="${33 + lin * 11}" r="2.6" fill="#fff"/>`);
      return `<rect x="8" y="24" width="112" height="80" rx="14" fill="#fff"/>`
        + `<g clip-path="${pano}">${listras}<rect x="8" y="24" width="52" height="40" fill="#2b58c4"/>${estrelinhas.join('')}</g>`
        + `<rect x="8" y="24" width="112" height="80" rx="14" fill="none" ${st()}/>` + brilho(80, 32, 10, 3, -5, 0.35);
    },
  },
};

// O alto-falante dos três ícones de som.
function alto(c) {
  return `<path d="M14 50 H36 L64 26 V102 L36 78 H14 Z" fill="${c.g('cinza', 26, 102)}" ${st()}/>`
    + `<rect x="14" y="50" width="22" height="28" fill="${c.g(['#c9d0e0', '#7d87a1'], 50, 78)}" ${st()}/>`;
}
