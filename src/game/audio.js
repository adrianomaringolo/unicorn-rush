// Efeitos sonoros simples gerados na hora (sem arquivos de áudio).
let ctx = null;

export function getContext() {
  return ensure();
}

// O contexto que já existe, sem criar nem retomar.
//
// `getContext()` retoma de propósito — é o que faz o som voltar quando a
// criança toca na tela. Mas quem roda em laço (o agendador da música) não
// pode usá-lo: chamar de dentro do laço fazia o áudio suspenso voltar
// sozinho, e a música continuava tocando com o app minimizado.
export function peekContext() {
  return ctx;
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
  // O segundo pulo sobe de tom: dá para ouvir que foi a asa batendo de novo.
  doubleJump: safe(() => {
    blip(tom(700), 0.12, 'triangle', 0.1);
    setTimeout(() => blip(tom(1050), 0.16, 'triangle', 0.11), 70);
  }),
  key: safe(() => [784, 988, 1319].forEach((f, i) => setTimeout(() => blip(tom(f), 0.18, 'sine', 0.14), i * 60))),
  power: safe(() => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(tom(f), 0.16, 'triangle', 0.13), i * 70))),
  gameOver: safe(() => [440, 350, 260].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle'), i * 160))),

  // Fase completa: uma fanfarra curta subindo (dó–mi–sol–dó) com a última
  // nota segurada, e um brilhinho por cima. É o som mais comprido do jogo de
  // propósito — é o único momento em que a criança "ganhou" alguma coisa.
  win: safe(() => {
    const notas = [523, 659, 784, 1047];
    notas.forEach((f, i) => setTimeout(() => {
      blip(tom(f), i === notas.length - 1 ? 0.55 : 0.18, 'triangle', 0.14);
    }, i * 130));
    // O brilho vem em cima da última nota, não junto com a subida.
    setTimeout(() => blip(tom(1568), 0.4, 'sine', 0.1), 390);
    setTimeout(() => blip(tom(2093), 0.35, 'sine', 0.07), 520);
  }),
  resume: safe(() => ensure()),

  // Trovão da Tempestade: um estrondo baixo e arrastado.
  thunder: safe(() => {
    blip(70, 0.7, 'sawtooth', 0.1);
    setTimeout(() => blip(55, 0.9, 'triangle', 0.09), 90);
    setTimeout(() => blip(90, 0.5, 'sawtooth', 0.05), 220);
  }),

  // Sons dos menus. Criança precisa ouvir que o toque funcionou: sem isso,
  // um toque que "não fez nada" parece defeito.
  tap: safe(() => blip(660, 0.07, 'sine', 0.07)),
  pick: safe(() => { blip(tom(784), 0.1); setTimeout(() => blip(tom(1175), 0.12), 60); }),
  deny: safe(() => { blip(300, 0.1, 'triangle', 0.09); setTimeout(() => blip(240, 0.14, 'triangle', 0.09), 90); }),
};
