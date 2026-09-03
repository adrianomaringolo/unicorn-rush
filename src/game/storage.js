// Tudo o que o jogo lembra entre uma sessão e outra fica aqui, num único
// registro no localStorage: escolhas, recordes, vitórias e as contagens.
//
// Guardar tudo junto (em vez de uma chave por assunto) facilita crescer o
// save sem espalhar `localStorage.getItem` pelo código.

const KEY = 'unicornrush-save';

const DEFAULTS = {
  version: 1,
  choices: { character: 'uni', track: 'campo', mode: 'baby', difficulty: 'medio' },
  // `null` = ainda não escolheu. É o que faz a tela de idioma aparecer uma
  // vez só, na primeira abertura (ver Game.showFirstScreen).
  idioma: null,
  // A versão que a pessoa mandou ignorar no convite de atualização. Guardar
  // *qual* (e não só "ignorou") é o que faz o convite voltar quando sair
  // uma versão mais nova ainda.
  updateIgnorada: null,
  muted: false,
  speech: false,         // ler os nomes em voz alta (para quem ainda não lê)
  // A voz escolhida pelo adulto, por idioma: { 'pt-BR': 'Luciana' }. Vazio
  // = a melhor que o aparelho tiver (ver speech.js).
  vozes: {},
  testMode: false,       // modo teste: tudo liberado e nada é guardado
  storySeen: false,      // a história já foi contada uma vez?
  storyEndSeen: false,   // e o fim dela, que só abre depois das 12 fases?
  babyLevel: 1,          // sobe a cada vitória no modo Livre e aumenta a meta
  // Progresso das fases, uma entrada por pista: { campo: { unlocked, done } }.
  // Cada pista tem o seu caminho de doze fases, então comprar uma pista nova
  // abre um caminho inteiro.
  levels: {},
  shop: {
    characters: [],      // unicórnios já trocados por chaves mágicas
    tracks: [],          // pistas já trocadas por chaves mágicas
  },
  stats: {
    runs: 0,             // corridas começadas
    wins: 0,             // metas do modo Livre completadas
    hearts: 0,           // corações somados em todas as corridas
    items: 0,            // itens (corações + estrelas) coletados
    keys: 0,             // chaves mágicas guardadas (a moeda do jogo)
    heartsToKey: 0,      // corações juntados para a próxima chave (0…49)
    bests: {},           // melhor pontuação por modo
    distances: {},       // maior distância por modo (vira a faixa do recorde)
    plays: {},           // corridas por pista
    chars: {},           // corridas por personagem
    powers: {},          // power-ups pegos, por tipo
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

// Junta o que está salvo com os valores padrão, para um save antigo
// continuar funcionando quando aparece um campo novo.
function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return clone(base);
  const out = clone(base);
  for (const [key, value] of Object.entries(saved)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(base[key] ?? {}, value)
      : value;
  }
  return out;
}

// Versões antigas do jogo guardavam uma chave por assunto.
function migrateOldKeys(save) {
  const old = {
    character: localStorage.getItem('unicornrush-character'),
    track: localStorage.getItem('unicornrush-track'),
    mode: localStorage.getItem('unicornrush-mode'),
    muted: localStorage.getItem('unicornrush-muted'),
    bests: localStorage.getItem('unicornrush-bests'),
  };
  if (!Object.values(old).some(Boolean)) return save;

  if (old.character) save.choices.character = old.character;
  if (old.track) save.choices.track = old.track;
  if (old.mode) save.choices.mode = old.mode;
  if (old.muted) save.muted = old.muted === '1';
  if (old.bests) {
    try { save.stats.bests = { ...save.stats.bests, ...JSON.parse(old.bests) }; } catch { /* ignora */ }
  }
  for (const key of ['character', 'track', 'mode', 'muted', 'bests', 'best']) {
    localStorage.removeItem(`unicornrush-${key}`);
  }
  return save;
}

// Antes as fases eram uma sequência só, sem pista: { unlocked, done }. Quem
// já tinha progresso fica com ele no Campo, que é a pista que vem liberada.
function migrateFlatLevels(save) {
  const levels = save.levels || {};
  if (typeof levels.unlocked !== 'number') return save;
  save.levels = { campo: { unlocked: levels.unlocked, done: levels.done || {} } };
  return save;
}

function read() {
  try {
    const save = merge(DEFAULTS, JSON.parse(localStorage.getItem(KEY)));
    return migrateFlatLevels(migrateOldKeys(save));
  } catch {
    return clone(DEFAULTS);   // aba anônima, save corrompido…
  }
}

const save = read();

export function getSave() {
  return save;
}

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch { /* sem espaço ou modo anônimo: o jogo continua, só não lembra */ }
}

// Uso: update((s) => { s.stats.runs += 1; })
// No modo teste o save da sessão continua mudando — chaves entram, fases
// abrem, a corrida funciona igual —, mas nada disso é escrito no aparelho.
// Ao recarregar, tudo volta a ser o que era.
let testMode = !!save.testMode;

export function isTestMode() {
  return testMode;
}

// A chave do modo teste é a única coisa que ele grava. E ela é escrita
// direto no que está guardado, sem passar pelo `save` da sessão — que no
// modo teste está sujo de propósito e não pode ir para o disco.
export function setTestMode(on) {
  let guardado = {};
  try { guardado = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* save novo */ }
  guardado.testMode = !!on;
  try { localStorage.setItem(KEY, JSON.stringify(guardado)); } catch { /* sem espaço */ }
  testMode = !!on;
  return testMode;
}

export function update(change) {
  change(save);
  if (testMode) return;
  persist();
}

export function resetSave() {
  Object.assign(save, clone(DEFAULTS));
  persist();
}
