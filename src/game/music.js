// Música tema de cada pista.
//
// Nada de arquivo de áudio: as melodias são notas MIDI tocadas com
// osciladores do WebAudio, num laço que fica se repetindo. Cada pista tem o
// seu tema, com andamento, timbre e escala próprios.
//
// A única entrada que **não** é de uma pista é a `historia`: a música do
// livro (ver STORY_THEME, no fim do arquivo).
import { getContext, peekContext } from './audio.js';
import { getSave, update } from './storage.js';

const noteHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// `melody` tem uma nota por colcheia; `bass`, uma por semínima.
// null = silêncio. Os temas repetem em laço.
export const THEMES = {
  campo: {
    name: 'Passeio no campo',
    bpm: 124, wave: 'triangle', bassWave: 'sine', gain: 0.075,
    melody: [
      72, 76, 79, 76, 74, 76, 72, null,
      71, 74, 79, 77, 76, 72, 74, null,
      72, 76, 79, 84, 81, 79, 76, null,
      77, 76, 74, 72, 71, 74, 72, null,
    ],
    bass: [48, 55, 53, 55, 47, 55, 50, 55],
  },

  doces: {
    name: 'Valsa de açúcar',
    bpm: 142, wave: 'square', bassWave: 'triangle', gain: 0.055,
    melody: [
      77, 81, 84, 81, 77, 84, 81, null,
      79, 82, 86, 82, 79, 86, 82, null,
      77, 81, 84, 88, 86, 84, 81, 84,
      79, 82, 79, 77, 76, 77, null, null,
    ],
    bass: [53, 60, 55, 62, 53, 60, 52, 59],
  },

  ceu: {
    name: 'Sonho de nuvem',
    bpm: 98, wave: 'sine', bassWave: 'sine', gain: 0.08,
    melody: [
      74, 78, 81, 86, 81, 78, null, null,
      76, 79, 83, 88, 83, 79, null, null,
      74, 81, 78, 86, 83, 81, null, null,
      73, 78, 81, 85, 81, 78, null, null,
    ],
    bass: [50, 50, 45, 45, 43, 43, 45, 47],
  },

  frutas: {
    name: 'Suco de melancia',
    bpm: 132, wave: 'square', bassWave: 'triangle', gain: 0.06,
    melody: [
      76, 79, 83, 79, 76, 83, 79, null,
      74, 78, 81, 78, 74, 81, 78, null,
      76, 79, 83, 86, 88, 86, 83, 79,
      81, 79, 78, 76, 74, 76, null, null,
    ],
    bass: [52, 59, 55, 62, 50, 57, 53, 60],
  },

  oceano: {
    name: 'Fundo do mar',
    bpm: 92, wave: 'sine', bassWave: 'sine', gain: 0.085,
    melody: [
      64, 67, 71, 74, 71, 67, null, null,
      66, 69, 73, 76, 73, 69, null, null,
      64, 71, 67, 74, 78, 74, null, null,
      62, 66, 69, 73, 69, 66, null, null,
    ],
    bass: [40, 40, 42, 42, 38, 38, 40, 45],
  },

  vilarejo: {
    name: 'Rua de pedra',
    bpm: 92, wave: 'triangle', bassWave: 'sine', gain: 0.075,
    melody: [
      67, null, 69, null, 71, null, 72, null,
      71, null, 67, null, 64, null, null, null,
      65, null, 67, null, 69, null, 71, null,
      67, null, 64, null, 60, null, null, null,
    ],
    bass: [43, 43, 48, 48, 41, 41, 36, 36],
  },

  parque: {
    name: 'Marcha do parque',
    bpm: 132, wave: 'square', bassWave: 'square', gain: 0.06,
    melody: [
      72, null, 72, 74, 76, null, 76, 74,
      72, null, 76, null, 79, null, null, null,
      77, null, 77, 76, 74, null, 74, 72,
      71, null, 74, null, 72, null, null, null,
    ],
    bass: [48, 43, 48, 43, 47, 43, 48, 43],
  },

  tempestade: {
    name: 'Trovoada',
    bpm: 116, wave: 'sawtooth', bassWave: 'square', gain: 0.06,
    melody: [
      64, null, 67, 70, 71, null, 70, 67,
      64, null, 62, null, 64, null, null, null,
      70, null, 72, 70, 67, null, 65, 64,
      62, null, 64, null, 59, null, null, null,
    ],
    bass: [40, 40, 43, 43, 38, 38, 35, 35],
  },

  bruma: {
    name: 'Neblina',
    bpm: 68, wave: 'sine', bassWave: 'sine', gain: 0.07,
    melody: [
      69, null, null, null, 72, null, null, 71,
      69, null, null, 67, 66, null, null, null,
      71, null, null, null, 74, null, null, 72,
      71, null, null, 69, 67, null, null, null,
    ],
    bass: [45, 45, 45, 45, 42, 42, 40, 40],
  },

  caverna: {
    name: 'Eco de cristal',
    bpm: 88, wave: 'triangle', bassWave: 'triangle', gain: 0.065,
    melody: [
      76, null, 79, null, 83, null, 79, null,
      76, null, 74, null, 71, null, null, null,
      78, null, 81, null, 85, null, 81, null,
      78, null, 76, null, 74, null, null, null,
    ],
    bass: [35, 35, 40, 40, 33, 33, 38, 38],
  },

  praia: {
    name: 'Onda na areia',
    bpm: 104, wave: 'triangle', bassWave: 'sine', gain: 0.075,
    melody: [
      72, null, 76, null, 79, null, 76, null,
      74, null, 71, null, 72, null, null, null,
      69, null, 72, null, 76, null, 74, null,
      72, null, 69, null, 67, null, null, null,
    ],
    bass: [48, 48, 52, 52, 45, 45, 47, 47],
  },

  geada: {
    name: 'Neve devagar',
    bpm: 76, wave: 'sine', bassWave: 'sine', gain: 0.07,
    melody: [
      76, null, null, 79, 81, null, null, 79,
      76, null, 74, null, 72, null, null, null,
      74, null, null, 76, 79, null, null, 76,
      74, null, 72, null, 71, null, null, null,
    ],
    bass: [40, 40, 45, 45, 43, 43, 38, 38],
  },

  espaco: {
    name: 'Poeira de estrela',
    bpm: 96, wave: 'square', bassWave: 'triangle', gain: 0.055,
    melody: [
      69, null, 74, null, 76, null, 81, null,
      79, null, 76, null, 74, null, null, null,
      71, null, 76, null, 78, null, 83, null,
      81, null, 78, null, 76, null, null, null,
    ],
    bass: [33, 33, 38, 38, 35, 35, 40, 40],
  },

  vulcao: {
    name: 'Tambor da montanha',
    bpm: 128, wave: 'sawtooth', bassWave: 'square', gain: 0.065,
    melody: [
      57, null, 60, 62, 63, null, 62, 60,
      57, null, 55, null, 57, null, null, null,
      63, null, 65, 63, 62, null, 60, 58,
      57, null, 60, null, 57, null, null, null,
    ],
    bass: [33, 33, 36, 36, 34, 34, 29, 31],
  },

  noite: {
    name: 'Canção de ninar',
    bpm: 84, wave: 'triangle', bassWave: 'sine', gain: 0.08,
    melody: [
      69, null, 72, null, 76, null, 74, null,
      72, null, 69, null, 67, null, null, null,
      65, null, 69, null, 72, null, 71, null,
      69, null, 67, null, 69, null, null, null,
    ],
    bass: [45, 45, 41, 41, 40, 40, 45, 43],
  },

  // O livro da história. Não é de pista nenhuma: toca enquanto o livro está
  // aberto e sai de cena quando ele fecha (ver Game.showStory).
  //
  // É a mais lenta e a mais quieta de todas de propósito — a criança está
  // lendo (ou ouvindo a voz do aparelho ler), e a música só precisa segurar
  // o clima de "era uma vez". Caixinha de música em fá maior: triângulo
  // macio, uma nota por semínima e um baixo que anda de fá a si bemol.
  historia: {
    name: 'Era uma vez',
    bpm: 80, wave: 'triangle', bassWave: 'sine', gain: 0.055,
    melody: [
      77, null, 81, null, 84, null, 81, null,
      79, null, 84, null, 82, null, 79, null,
      77, null, 81, null, 86, null, 84, null,
      81, null, 79, null, 77, null, null, null,
    ],
    bass: [41, 48, 36, 43, 38, 45, 34, 41],
  },
};

// Quando a aba sai de foco (a criança troca de app, minimiza, bloqueia a
// tela…), o áudio inteiro para — música e efeitos — e volta ao reaparecer.
//
// Suspender o contexto não bastava: o agendador continuava rodando e o
// contexto voltava sozinho (ver `tick`). Então aqui o timer é desligado
// junto, que é o que garante silêncio de verdade com o app no fundo.
function silenciarNoFundo() {
  clearInterval(timer);
  timer = null;
  peekContext()?.suspend?.();
}

function voltarDoFundo() {
  const ctx = peekContext();
  if (!ctx || !theme) return;
  ctx.resume?.();
  // O relógio do contexto não anda enquanto suspenso, mas se ele tiver
  // andado — ou se o navegador tiver derrubado o áudio no meio —, retomar
  // de onde parou dispararia todas as notas atrasadas de uma vez.
  if (nextNoteTime < ctx.currentTime) nextNoteTime = ctx.currentTime + 0.1;
  if (!timer) timer = setInterval(tick, LOOKAHEAD_MS);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!theme) return;               // nem começou a tocar ainda
    document.hidden ? silenciarNoFundo() : voltarDoFundo();
  });

  // No iPhone o `visibilitychange` não é confiável ao trocar de app; o
  // `pagehide` pega esse caso.
  addEventListener('pagehide', () => { if (theme) silenciarNoFundo(); });
  addEventListener('pageshow', () => { if (theme) voltarDoFundo(); });
}

const LOOKAHEAD_MS = 60;
const SCHEDULE_AHEAD = 0.28;   // segundos de música já agendados no futuro

let theme = null;
let timer = null;
let master = null;
let step = 0;
let nextNoteTime = 0;
let muted = getSave().muted;
let pending = null;            // tema esperando o primeiro toque do usuário

function voice(ctx, freq, start, duration, wave, level) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function scheduleStep(ctx, time) {
  const eighth = 30 / theme.bpm;

  const note = theme.melody[step % theme.melody.length];
  if (note !== null && note !== undefined) {
    voice(ctx, noteHz(note), time, eighth * 1.7, theme.wave, 0.5);
    // Oitava acima bem baixinho, só para dar brilho.
    voice(ctx, noteHz(note + 12), time, eighth * 1.1, 'sine', 0.12);
  }

  if (step % 2 === 0) {
    const bassNote = theme.bass[(step / 2) % theme.bass.length];
    if (bassNote !== null && bassNote !== undefined) {
      voice(ctx, noteHz(bassNote), time, eighth * 2.6, theme.bassWave, 0.55);
    }
  }

  step += 1;
  nextNoteTime += eighth;
}

function tick() {
  // `peekContext` e não `getContext`: aqui não se retoma nada. Com o app
  // minimizado o navegador continua chamando este timer (mais devagar), e
  // retomar aqui era o que fazia a música voltar por trás.
  const ctx = peekContext();
  if (!ctx || !theme || ctx.state !== 'running') return;
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) scheduleStep(ctx, nextNoteTime);
}

// O navegador só deixa tocar som depois que a criança toca na tela.
function waitForGesture() {
  if (pending === null) return;
  const retry = () => {
    const wanted = pending;
    pending = null;
    removeEventListener('pointerdown', retry);
    removeEventListener('keydown', retry);
    play(wanted);
  };
  addEventListener('pointerdown', retry, { once: true });
  addEventListener('keydown', retry, { once: true });
}

export function play(trackId) {
  const next = THEMES[trackId];
  if (!next) return;
  if (theme === next && timer) return;

  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state !== 'running') {
    ctx.resume?.();
    if (ctx.state !== 'running') {
      pending = trackId;
      waitForGesture();
      return;
    }
  }

  stop();
  theme = next;
  step = 0;
  nextNoteTime = ctx.currentTime + 0.1;

  master = ctx.createGain();
  master.gain.value = muted ? 0 : theme.gain;
  master.connect(ctx.destination);

  tick();
  timer = setInterval(tick, LOOKAHEAD_MS);
}

export function stop() {
  clearInterval(timer);
  timer = null;
  if (master) {
    const ctx = getContext();
    // Desliga suave, para não estalar.
    master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
    const old = master;
    setTimeout(() => old.disconnect(), 400);
    master = null;
  }
  theme = null;
}

export function setMuted(value) {
  muted = value;
  update((save) => { save.muted = value; });
  if (master && theme) {
    const ctx = getContext();
    master.gain.setTargetAtTime(muted ? 0.0001 : theme.gain, ctx.currentTime, 0.08);
  }
}

export function isMuted() {
  return muted;
}

export function themeName(trackId) {
  return THEMES[trackId]?.name || '';
}

// A música do livro da história. Fica aqui, e não solta no Game, para o
// nome do tema e a tabela nunca saírem de sincronia.
export const STORY_THEME = 'historia';
