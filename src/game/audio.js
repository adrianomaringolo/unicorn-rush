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

// Todos os efeitos passam por aqui, e não direto na saída: é este volume que
// o botão 🔇 fecha. Antes ele só calava a música, e o pai que desligava o
// som continuava ouvindo cada coração pego.
let efeitos = null;
let efeitosMudos = false;

function saida(ac) {
  if (!efeitos) {
    efeitos = ac.createGain();
    efeitos.gain.value = efeitosMudos ? 0 : 1;
    efeitos.connect(ac.destination);
  }
  return efeitos;
}

export function setSfxMuted(value) {
  efeitosMudos = Boolean(value);
  if (efeitos) efeitos.gain.setTargetAtTime(efeitosMudos ? 0 : 1, ctx.currentTime, 0.03);
}

// Ruído branco filtrado — o que um oscilador não faz. É com isto que o
// trovão estala: um estouro de banda larga que fecha o filtro enquanto
// desaparece, como um som que se afasta.
function ruido(duracao, corte, volume) {
  const ac = ensure();
  if (!ac) return;
  const amostras = Math.floor(ac.sampleRate * duracao);
  const buffer = ac.createBuffer(1, amostras, ac.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < amostras; i++) dados[i] = Math.random() * 2 - 1;

  const fonte = ac.createBufferSource();
  fonte.buffer = buffer;

  const filtro = ac.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(corte, ac.currentTime);
  filtro.frequency.exponentialRampToValueAtTime(Math.max(80, corte * 0.12), ac.currentTime + duracao);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duracao);

  fonte.connect(filtro).connect(gain).connect(saida(ac));
  fonte.start();
  fonte.stop(ac.currentTime + duracao);
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
  osc.connect(gain).connect(saida(ac));
  osc.start();
  osc.stop(ac.currentTime + duration);
}

// Áudio é opcional: um navegador sem som, ou com o contexto suspenso, não
// pode derrubar o jogo. Mas engolir o erro **em silêncio** esconde som
// quebrado — daí o aviso no console, que só quem está desenvolvendo vê.
const safe = (fn) => (...args) => {
  try {
    fn(...args);
  } catch (erro) {
    console.warn('som falhou:', erro);
  }
};

// Cada personagem tem a sua "voz": a Lulu, que é bebê, pega os itens com um
// som mais agudo. 1 = tom normal.
let pitch = 1;
const tom = (freq) => freq * pitch;

// A tonalidade da música que está tocando (ver music.js, `setKey`): os sons
// de coleta tocam notas do acorde da tônica dela, para cada coração pego
// soar como parte da música, e não por cima dela.
let tonica = null;               // { raiz: 0–11, notas: [0, 3|4, 7, …] }
export function setKey(chave) { tonica = chave; }

// Quem toca a música se inscreve aqui para abaixar sob os efeitos fortes
// (ducking). Fica assim, e não um import, porque o music.js já importa este
// arquivo.
let aoSomForte = () => {};
export function onLoudSfx(fn) { aoSomForte = fn; }
const forte = (segundos) => { try { aoSomForte(segundos); } catch { /* sem música */ } };

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// As notas de um arpejo na tonalidade. `base` é a nota MIDI do som
// original; a voz do unicórnio desloca essa base, e o arpejo começa na nota
// do acorde da tônica mais perto dela — a Lulu continua mais aguda e o
// Brasa mais grave, só que sempre dentro da escala. `passos` conta notas
// do acorde a partir dessa: [0, 2] é "esta e duas acima" (fundamental e
// quinta, se começar na fundamental). `maior` força o acorde maior: a
// fanfarra de vitória não fica triste numa pista em tom menor. `daRaiz`
// faz o arpejo começar na tônica, e não na nota do acorde mais perto — uma
// fanfarra que começa na terça soa como se tivesse entrado no meio.
//
// Sem tonalidade (nenhuma música tocou ainda), vale o som de sempre.
function notas(original, base, passos, { maior = false, daRaiz = false } = {}) {
  if (!tonica) return original.map(tom);
  const acorde = maior ? [0, 4, 7] : tonica.notas.slice(0, 3);
  const lista = [];
  for (let m = 48; m <= 112; m++) {
    if (acorde.includes(((m - tonica.raiz) % 12 + 12) % 12)) lista.push(m);
  }
  const alvo = base + 12 * Math.log2(pitch);
  let i = 0;
  const raiz = (m) => ((m - tonica.raiz) % 12 + 12) % 12 === 0;
  if (daRaiz) i = lista.findIndex(raiz);
  lista.forEach((m, j) => {
    if (daRaiz && !raiz(m)) return;
    if (Math.abs(m - alvo) < Math.abs(lista[i] - alvo)) i = j;
  });
  return passos.map((p) => hz(lista[Math.min(i + p, lista.length - 1)]));
}

export const sfx = {
  // O tom dos sons de coleta acompanha o personagem escolhido.
  setPitch: (value) => { pitch = value || 1; },

  collect: safe(() => {
    const [a, b] = notas([880, 1320], 81, [0, 2]);
    blip(a, 0.12);
    setTimeout(() => blip(b, 0.14), 70);
  }),
  star: safe(() => {
    notas([660, 990, 1320], 76, [0, 2, 3])
      .forEach((f, i) => setTimeout(() => blip(f, 0.15, 'triangle'), i * 90));
  }),
  hit: safe(() => blip(160, 0.3, 'sawtooth', 0.16)),
  jump: safe(() => blip(520, 0.15, 'triangle', 0.1)),
  // O segundo pulo sobe de tom: dá para ouvir que foi a asa batendo de novo.
  doubleJump: safe(() => {
    blip(tom(700), 0.12, 'triangle', 0.1);
    setTimeout(() => blip(tom(1050), 0.16, 'triangle', 0.11), 70);
  }),
  key: safe(() => {
    notas([784, 988, 1319], 79, [0, 1, 2])
      .forEach((f, i) => setTimeout(() => blip(f, 0.18, 'sine', 0.14), i * 60));
  }),
  power: safe(() => {
    forte(0.5);
    notas([523, 659, 784, 1047], 72, [0, 1, 2, 3])
      .forEach((f, i) => setTimeout(() => blip(f, 0.16, 'triangle', 0.13), i * 70));
  }),
  // 🌈 A Bomba Arco-Íris: um estouro, e não o arpejo de power-up que tocava
  // antes — aquele soava como "peguei um item", e não como "explodiu".
  //
  // Três camadas, que é o que faz um estouro soar como estouro: o estalo
  // (ruído de corte alto caindo depressa), o corpo grave (um oscilador
  // descendo de 140 para 38 Hz, que é o "buum" que se sente no peito) e, um
  // quarto de segundo depois, um chuvisco de brilhos subindo.
  //
  // A terceira camada é o que mantém o som deste jogo: é uma bomba de
  // arco-íris para criança pequena, então ela estoura e **vira purpurina**,
  // não escombro.
  bomb: safe(() => {
    forte(0.8);
    ruido(0.5, 3200, 0.34);

    const ac = ensure();
    if (ac) {
      const grave = ac.createOscillator();
      const volume = ac.createGain();
      grave.type = 'sine';
      grave.frequency.setValueAtTime(140, ac.currentTime);
      grave.frequency.exponentialRampToValueAtTime(38, ac.currentTime + 0.45);
      volume.gain.setValueAtTime(0.3, ac.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.52);
      grave.connect(volume).connect(saida(ac));
      grave.start();
      grave.stop(ac.currentTime + 0.52);
    }

    [1046, 1318, 1568, 2093].forEach((f, i) => {
      setTimeout(() => blip(f, 0.14, 'triangle', 0.075), 250 + i * 55);
    });
  }),

  // A largada: três toques iguais e um último que sobe. É o mesmo desenho
  // de qualquer contagem — o que muda no fim avisa que acabou.
  contagem: safe(() => blip(tom(620), 0.16, 'triangle', 0.13)),
  vai: safe(() => {
    [880, 1320].forEach((f, i) => setTimeout(() => blip(tom(f), 0.24, 'triangle', 0.15), i * 90));
  }),

  gameOver: safe(() => [440, 350, 260].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle'), i * 160))),

  // Fase completa: uma fanfarra curta subindo (dó–mi–sol–dó) com a última
  // nota segurada, e um brilhinho por cima. É o som mais comprido do jogo de
  // propósito — é o único momento em que a criança "ganhou" alguma coisa.
  //
  // Toca na tonalidade da pista (sempre em maior), então soa como o fim da
  // música que estava tocando.
  win: safe(() => {
    forte(1.1);
    const [d, m, s, d2, brilho1, brilho2] = notas(
      [523, 659, 784, 1047, 1568, 2093], 72, [0, 1, 2, 3, 5, 6], { maior: true, daRaiz: true },
    );
    const subida = [d, m, s, d2];
    subida.forEach((f, i) => setTimeout(() => {
      blip(f, i === subida.length - 1 ? 0.55 : 0.18, 'triangle', 0.14);
    }, i * 130));
    // O brilho vem em cima da última nota, não junto com a subida.
    setTimeout(() => blip(brilho1, 0.4, 'sine', 0.1), 390);
    setTimeout(() => blip(brilho2, 0.35, 'sine', 0.07), 520);
  }),
  resume: safe(() => ensure()),

  // Trovão da Tempestade: um estrondo baixo e arrastado.
  // Trovão. A primeira versão era só grave (55–90 Hz) e sumia em
  // alto-falante de celular, que não reproduz essas frequências: dava para
  // ver o clarão e não ouvir nada. Agora tem duas partes — o **estalo**, um
  // ruído com corpo médio, que é o que se ouve em qualquer aparelho, e o
  // **rugido** grave que vem depois e some rolando.
  thunder: safe(() => {
    forte(1.6);
    ruido(0.5, 1800, 0.22);                       // o estalo, logo de cara
    setTimeout(() => ruido(1.5, 420, 0.16), 70);  // e o rugido se afastando
    blip(88, 0.8, 'sawtooth', 0.07);
    setTimeout(() => blip(62, 1.1, 'triangle', 0.06), 120);
  }),

  // Sons dos menus. Criança precisa ouvir que o toque funcionou: sem isso,
  // um toque que "não fez nada" parece defeito.
  tap: safe(() => blip(660, 0.07, 'sine', 0.07)),
  pick: safe(() => { blip(tom(784), 0.1); setTimeout(() => blip(tom(1175), 0.12), 60); }),
  // "Acertou!" da lição: dois acordes curtos subindo, mais cheios que o
  // `pick` do menu e mais curtos que a fanfarra de fase — este som só quer
  // dizer "isso mesmo", sem parecer que acabou alguma coisa.
  correct: safe(() => {
    [[659, 0], [988, 70], [1319, 140]].forEach(([f, atraso]) => {
      setTimeout(() => {
        blip(tom(f), 0.16, 'triangle', 0.13);
        blip(tom(f * 1.5), 0.13, 'sine', 0.06);
      }, atraso);
    });
  }),

  deny: safe(() => { blip(300, 0.1, 'triangle', 0.09); setTimeout(() => blip(240, 0.14, 'triangle', 0.09), 90); }),
};
