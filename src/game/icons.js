// Os ícones do jogo.
//
// Emoji é desenhado pela fonte do aparelho: o mesmo 🔑 tem uma cara no
// Android, outra no iPhone e outra no Windows — e os mais novos (o 🫧 é de
// 2021) viram quadradinho em aparelho velho. Como o jogo é para instalar no
// celular, cada criança acabava vendo um jogo um pouco diferente.
//
// Aqui os ícones são arquivos nossos: Fluent Emoji, da Microsoft, na versão
// 3D — que combina com o low-poly do jogo — reduzidos para 128px e guardados
// em `assets/emoji/`. Licença MIT (ver assets/emoji/LICENSE).
//
// O texto do código continua escrito com emoji de verdade: quem escreve lê
// `🔑 10` no fonte, e a troca acontece na hora de desenhar (`withIcons`).
// Se uma imagem faltar, o `alt` é o próprio emoji — volta ao que era antes,
// sem buraco na tela.

const PASTA = './assets/emoji/';

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
  '🐠': 'tropical_fish',
  '🐢': 'turtle',
  '🦄': 'unicorn',
  '⬆️': 'up_arrow',
  '⚠️': 'warning',
  '🧊': 'ice',
  '🥥': 'coconut',
  '☄️': 'comet',
  '❄️': 'snowflake',
  '🚀': 'rocket',
  '🏖️': 'beach_with_umbrella',
  '🌋': 'volcano',
  '🌊': 'water_wave',
  '🤍': 'white_heart',
  '🗺️': 'world_map',
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
  return arquivo ? `${PASTA}${arquivo}.png` : null;
}

// Troca todo emoji conhecido de um texto pela imagem correspondente.
export function withIcons(texto) {
  if (texto === null || texto === undefined || texto === '') return texto;
  return String(texto).replace(PADRAO, (emoji) =>
    `<img class="fi" src="${PASTA}${MAPA.get(emoji)}.png" alt="${emoji}" draggable="false" />`);
}

// A lista dos arquivos, para o service worker guardar todos.
export const ICON_FILES = [...new Set(Object.values(ARQUIVOS))].map((a) => `${PASTA}${a}.png`);
