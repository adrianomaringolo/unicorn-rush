// Música tema de cada pista.
//
// Nada de arquivo de áudio: as melodias são notas MIDI tocadas com
// osciladores do WebAudio, num laço que fica se repetindo. Cada pista tem o
// seu tema, com andamento, timbre e escala próprios.
import { getContext } from './audio.js';
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
};

// Quando a aba sai de foco (a criança troca de app, bloqueia a tela…), o
// áudio inteiro é suspenso — música e efeitos — e volta ao reaparecer.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!theme) return;               // nem começou a tocar ainda
    const ctx = getContext();
    if (!ctx) return;
    if (document.hidden) ctx.suspend?.();
    else if (!muted) ctx.resume?.();
  });
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
  const ctx = getContext();
  if (!ctx || !theme) return;
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
