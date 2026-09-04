// Tudo o que o jogo lembra entre uma sessão e outra fica aqui, num único
// registro no localStorage: escolhas, recordes, vitórias e as contagens.
//
// Guardar tudo junto (em vez de uma chave por assunto) facilita crescer o
// save sem espalhar `localStorage.getItem` pelo código.
//
// Mais de uma criança pode dividir o mesmo aparelho, e cada uma tem o seu
// save — ver "Perfis", mais abaixo.

import { CHARACTERS, CHARACTER_LIST } from '../models/characters.js';

const LEGACY_KEY = 'unicornrush-save';       // de antes de existirem perfis
const PROFILES_KEY = 'unicornrush-profiles';
const saveKeyFor = (id) => `unicornrush-save:${id}`;

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
  // O nível de evolução de cada power-up (nunca desce, sem teto) — o jeito
  // de continuar gastando chaves depois de já ter todo mundo (ver
  // Game.showPowerShop e POWER_LEVEL_PERCENT em models/powerups.js).
  powerLevels: { shield: 0, magnet: 0, boost: 0, feather: 0, bomb: 0 },
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

function readFrom(key) {
  try {
    const save = merge(DEFAULTS, JSON.parse(localStorage.getItem(key)));
    return migrateFlatLevels(migrateOldKeys(save));
  } catch {
    return clone(DEFAULTS);   // aba anônima, save corrompido…
  }
}

// --- Perfis -------------------------------------------------------------
//
// Cada perfil é só um nome e um avatar (`{ id, name, avatar }`) guardados à
// parte do save de verdade — trocar de perfil não lê nem escreve o save, só
// diz qual dos vários usar. Quem lê o save de fato é `readFrom`, acima, na
// chave `unicornrush-save:<id>`.
//
// Ninguém precisa digitar nada antes de jogar: assim que o jogo abre e não
// existe nenhum perfil ainda, um perfil **padrão** nasce sozinho, logo
// abaixo, adotando o que já estava na chave antiga — progresso de verdade,
// se havia, ou só os padrões, se o jogo era novo. `name: null` marca que
// ele ainda não tem um nome de verdade escolhido; a tela mostra um
// nome-modelo traduzido até alguém editar (ver `Game.showCreateProfile`).
// O avatar padrão é o do personagem que já estava escolhido — para quem já
// jogava, é literalmente "ele mesmo".
//
// Editar nome e avatar, criar mais perfis (irmãos, no mesmo aparelho) e
// trocar entre eles é tudo coisa de depois, pelo trocador no hub — nunca
// obrigatório.
function readProfiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILES_KEY));
    if (parsed && Array.isArray(parsed.list)) return parsed;
  } catch { /* nenhum perfil ainda */ }
  return { activeId: null, list: [] };
}

function writeProfiles(data) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(data)); } catch { /* sem espaço */ }
}

const novoId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Um tablet muda de mão entre irmãos, não entre uma sala de aula inteira —
// seis já cobre famílias grandes sem a grade do trocador virar uma lista
// para rolar.
export const MAX_PROFILES = 6;

let profiles = readProfiles();

if (profiles.list.length === 0) {
  const id = novoId();
  const dados = readFrom(LEGACY_KEY);
  try { localStorage.setItem(saveKeyFor(id), JSON.stringify(dados)); } catch { /* sem espaço */ }
  try { localStorage.removeItem(LEGACY_KEY); } catch { /* nada a apagar */ }
  const avatar = CHARACTERS[dados.choices?.character]?.emoji || CHARACTER_LIST[0].emoji;
  profiles = { activeId: id, list: [{ id, name: null, avatar }] };
  writeProfiles(profiles);
}

export function listProfiles() {
  return profiles.list;
}

export function activeProfile() {
  return profiles.list.find((p) => p.id === profiles.activeId) || null;
}

// Cria um perfil novo (um irmão) e já deixa ele ativo, começando de um save
// limpo — é gente diferente. Precisa de `location.reload()` logo depois —
// ver o comentário em `switchProfile`.
export function createProfile(name, avatar) {
  const id = novoId();
  try { localStorage.setItem(saveKeyFor(id), JSON.stringify(clone(DEFAULTS))); } catch { /* sem espaço */ }
  profiles = { activeId: id, list: [...profiles.list, { id, name, avatar }] };
  writeProfiles(profiles);
  return id;
}

// Muda nome e/ou avatar de um perfil que já existe. Não mexe no save dele
// nem precisa de `location.reload()` — nada além do registro de perfis
// muda, e quem chama já pode remontar a tela na hora.
export function updateProfile(id, { name, avatar } = {}) {
  const i = profiles.list.findIndex((p) => p.id === id);
  if (i === -1) return false;
  const lista = [...profiles.list];
  lista[i] = {
    ...lista[i],
    ...(name !== undefined ? { name } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
  };
  profiles = { ...profiles, list: lista };
  writeProfiles(profiles);
  return true;
}

// Só troca qual perfil está ativo — não muda nada no save de ninguém. Quem
// chama isto precisa dar um `location.reload()` em seguida: o `save`
// carregado abaixo é fixado na abertura do jogo, e um perfil novo tem um
// save diferente por completo (progresso, idioma, tudo) — remontar tudo
// em cima do que já estava na tela seria pedir para algo ficar por
// atualizar. Um recarregamento de verdade, e não a cortina de mentira que
// a troca de idioma usa, é o que garante que nada do perfil antigo
// sobra por engano.
export function switchProfile(id) {
  if (!profiles.list.some((p) => p.id === id)) return false;
  profiles = { ...profiles, activeId: id };
  writeProfiles(profiles);
  return true;
}

// A chave de onde este save vem: a do perfil ativo — sempre existe um a
// esta altura, por causa do perfil padrão logo acima.
const KEY = saveKeyFor(profiles.activeId);

const save = readFrom(KEY);

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
