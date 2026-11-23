// Os ícones do jogo.
//
// Emoji é desenhado pela fonte do aparelho: o mesmo 🔑 tem uma cara no
// Android, outra no iPhone e outra no Windows — e os mais novos (o 🫧 é de
// 2021) viram quadradinho em aparelho velho. Como o jogo é para instalar no
// celular, cada criança acabava vendo um jogo um pouco diferente.
//
// Aqui os ícones são arquivos nossos, desenhados para o jogo: SVG em
// `assets/icones/`, todos no mesmo estilo do lobby (contorno roxo, gradiente,
// reflexo de bala de goma). Quem desenha é `scripts/icones/` — para mudar um
// ícone, mexa lá e rode `node scripts/icones/gerar.mjs`.
//
// O texto do código continua escrito com emoji de verdade: quem escreve lê
// `🔑 10` no fonte, e a troca acontece na hora de desenhar (`withIcons`).
// Se uma imagem faltar, o `alt` é o próprio emoji — volta ao que era antes,
// sem buraco na tela.

const PASTA = './assets/icones/';

const ARQUIVOS = {
  '🥇': '1st_place_medal',
  '🍼': 'baby_bottle',
  '👆': 'backhand_index_pointing_up',
  '🎈': 'balloon',
  '📊': 'bar_chart',
  '🖤': 'black_heart',
  '🧹': 'broom',
  '🫧': 'bubbles',
  '🌵': 'cactus',
  '✅': 'check_mark_button',
  '🏁': 'chequered_flag',
  '☁️': 'cloud',
  '🌙': 'crescent_moon',
  '👑': 'crown',
  '💫': 'dizzy',
  '🔥': 'fire',
  '🌐': 'globe_with_meridians',
  '💗': 'growing_heart',
  '⚡': 'high_voltage',
  '🏠': 'house',
  '🔑': 'key',
  '🍃': 'leaf_fluttering_in_wind',
  '⬅️': 'left_arrow',
  '🔒': 'locked',
  '🍭': 'lollipop',
  '🧲': 'magnet',
  '📲': 'mobile_phone_with_arrow',
  '🎵': 'musical_note',
  '🔇': 'muted_speaker',
  '🐙': 'octopus',
  '🍿': 'popcorn',
  '📖': 'open_book',
  '🎉': 'party_popper',
  '⏸️': 'pause_button',
  '🏃': 'person_running',
  '▶️': 'play_button',
  '🌈': 'rainbow',
  '🔁': 'repeat_button',
  '➡️': 'right_arrow',
  '🪨': 'rock',
  '🛡️': 'shield',
  '✨': 'sparkles',
  '💖': 'sparkling_heart',
  '🔊': 'speaker_high_volume',
  '🔈': 'speaker_low_volume',
  '⭐': 'star',
  '🍓': 'strawberry',
  '☀️': 'sun',
  '🌞': 'sun_with_face',
  '🏆': 'trophy',
  '🎯': 'direct_hit',
  '🐠': 'tropical_fish',
  '🐢': 'turtle',
  '🦄': 'unicorn',
  '⬆️': 'up_arrow',
  '⚠️': 'warning',
  '🧪': 'test_tube',
  '🎪': 'circus_tent',
  '🌫️': 'fog',
  '🍒': 'cherries',
  '🍋': 'lemon',
  '🔮': 'crystal_ball',
  '💎': 'gem_stone',
  '🎩': 'top_hat',
  '🦇': 'bat',
  '🧊': 'ice',
  '🥥': 'coconut',
  '☄️': 'comet',
  '❄️': 'snowflake',
  '🚀': 'rocket',
  '🏖️': 'beach_with_umbrella',
  '🌋': 'volcano',
  '🐚': 'spiral_shell',
  '🌊': 'water_wave',
  '🤍': 'white_heart',
  '🗺️': 'world_map',
  '🔄': 'counterclockwise_arrows_button',
  '🔀': 'shuffle_tracks_button',
  'ℹ️': 'information',
  '❓': 'red_question_mark',
  '➕': 'plus',
  '✏️': 'pencil',
  '🗑️': 'wastebasket',
  '🗣️': 'speaking_head',
  '👋': 'waving_hand',
  '🎁': 'wrapped_gift',
  '🌍': 'globe_showing_americas',
  '🍂': 'fallen_leaf',
  '🦜': 'parrot',
  '🪶': 'feather',
  '🇧🇷': 'flag_brazil',
  '🇺🇸': 'flag_united_states',
  // Enfeites e álbum
  '🎀': 'ribbon',
  '📒': 'ledger',
  '🦋': 'butterfly',
  '🌸': 'cherry_blossom',
  '🕶️': 'dark_sunglasses',
  '📿': 'prayer_beads',
  '🧣': 'scarf',
  '😍': 'smiling_face_with_heart_eyes',
  '🏅': 'sports_medal',
  '🌼': 'blossom',
  '🌺': 'hibiscus',
  '🧦': 'socks',
  '🎅': 'santa_claus',
  '🦌': 'deer',
  '🎄': 'christmas_tree',
  '🔔': 'bell',
  '🎧': 'headphone',
  '🐉': 'dragon',
  '👟': 'athletic_shoe',
  '👢': 'womans_boot',
  '🩰': 'ballet_shoes',
  '🛼': 'roller_skate',
  '🦊': 'fox',
  '🦁': 'lion',
  '🪢': 'knot',
  '🦚': 'peacock',
};

// O mesmo emoji aparece com e sem o seletor de variação (U+FE0F) dependendo
// de como foi digitado; as duas formas apontam para o mesmo arquivo.
const MAPA = new Map();
for (const [emoji, arquivo] of Object.entries(ARQUIVOS)) {
  MAPA.set(emoji, arquivo);
  const semSeletor = emoji.replace(/\uFE0F/g, '');
  if (semSeletor !== emoji) MAPA.set(semSeletor, arquivo);
}

// Os mais compridos primeiro, senão a forma sem seletor casaria antes e
// deixaria o U+FE0F sobrando na tela.
const PADRAO = new RegExp(
  [...MAPA.keys()].sort((a, b) => b.length - a.length).join('|'),
  'gu'
);

export function iconUrl(emoji) {
  const arquivo = MAPA.get(emoji);
  return arquivo ? `${PASTA}${arquivo}.svg` : null;
}

// Troca todo emoji conhecido de um texto pela imagem correspondente.
export function withIcons(texto) {
  if (texto === null || texto === undefined || texto === '') return texto;
  return String(texto).replace(PADRAO, (emoji) =>
    `<img class="fi" src="${PASTA}${MAPA.get(emoji)}.svg" alt="${emoji}" draggable="false" />`);
}

// A lista dos arquivos, para o service worker guardar todos.
export const ICON_FILES = [...new Set(Object.values(ARQUIVOS))].map((a) => `${PASTA}${a}.svg`);
