// Tudo o que o jogo lembra entre uma sessão e outra fica aqui, num único
// registro no localStorage: escolhas, recordes, vitórias e as contagens.
//
// Guardar tudo junto (em vez de uma chave por assunto) facilita crescer o
// save sem espalhar `localStorage.getItem` pelo código.

const KEY = 'unicornrush-save';

const DEFAULTS = {
  version: 1,
  choices: { character: 'uni', track: 'campo', mode: 'baby', difficulty: 'medio' },
  muted: false,
  babyLevel: 1,          // sobe a cada vitória no modo Livre e aumenta a meta
  levels: {
    unlocked: 1,         // até que fase o modo Fases foi liberado
    done: {},            // fases já concluídas
  },
  stats: {
    runs: 0,             // corridas começadas
    wins: 0,             // metas do modo Livre completadas
    hearts: 0,           // corações somados em todas as corridas
    items: 0,            // itens (corações + estrelas) coletados
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

function read() {
  try {
    const save = merge(DEFAULTS, JSON.parse(localStorage.getItem(KEY)));
    return migrateOldKeys(save);
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
export function update(change) {
  change(save);
  persist();
}

export function resetSave() {
  Object.assign(save, clone(DEFAULTS));
  persist();
}
