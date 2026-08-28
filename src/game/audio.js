// Efeitos sonoros simples gerados na hora (sem arquivos de áudio).
let ctx = null;

export function getContext() {
  return ensure();
}

function ensure() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, duration, type = 'sine', volume = 0.12) {
  const ac = ensure();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

const safe = (fn) => (...args) => { try { fn(...args); } catch { /* áudio é opcional */ } };

// Cada personagem tem a sua "voz": a Lulu, que é bebê, pega os itens com um
// som mais agudo. 1 = tom normal.
let pitch = 1;
const tom = (freq) => freq * pitch;

export const sfx = {
  // O tom dos sons de coleta acompanha o personagem escolhido.
  setPitch: (value) => { pitch = value || 1; },

  collect: safe(() => { blip(tom(880), 0.12); setTimeout(() => blip(tom(1320), 0.14), 70); }),
  star: safe(() => [0, 90, 180].forEach((d, i) => setTimeout(() => blip(tom(660 + i * 330), 0.15, 'triangle'), d))),
  hit: safe(() => blip(160, 0.3, 'sawtooth', 0.16)),
  jump: safe(() => blip(520, 0.15, 'triangle', 0.1)),
  key: safe(() => [784, 988, 1319].forEach((f, i) => setTimeout(() => blip(tom(f), 0.18, 'sine', 0.14), i * 60))),
  power: safe(() => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(tom(f), 0.16, 'triangle', 0.13), i * 70))),
  gameOver: safe(() => [440, 350, 260].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle'), i * 160))),
  resume: safe(() => ensure()),
};
