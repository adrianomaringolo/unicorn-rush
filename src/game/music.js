// Música tema de cada pista.
//
// Nada de arquivo de áudio: as melodias são notas MIDI tocadas com
// osciladores do WebAudio, num laço que fica se repetindo. Cada pista tem o
// seu tema, com andamento, timbre e escala próprios.
//
// A única entrada que **não** é de uma pista é a `historia`: a música do
// livro (ver STORY_THEME, no fim do arquivo).
import { getContext, peekContext, setKey, onLoudSfx, setSfxMuted } from './audio.js';
import { getSave, update } from './storage.js';

const noteHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// `melody` tem uma nota por colcheia; `bass`, uma por semínima.
// null = silêncio. Os temas repetem em laço.
export const THEMES = {
  // Os temas com `form` são os da segunda geração (ver "Temas com forma",
  // mais abaixo): têm partes A/B, acordes, percussão e reverb. `melody` e
  // `bass` deles são montados a partir das partes, quando o módulo carrega.
  campo: {
    name: 'Passeio no campo',
    bpm: 124, wave: 'triangle', bassWave: 'sine', gain: 0.062,
    reverb: 0.2, cutoff: 5200, pad: 'sine', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      // A pergunta: termina "no ar", em sol.
      A: {
        groove: 'leve',
        chords: ['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'G'],
        melody: [
          72, 76, 79, 76, 74, 76, 72, null,
          71, 74, 79, 77, 76, 72, 74, null,
          72, 76, 79, 84, 81, 79, 76, null,
          77, 76, 74, 72, 71, 74, 72, null,
        ],
      },
      // A resposta: o mesmo começo, e um fim que pousa em dó.
      A2: {
        groove: 'cheio',
        chords: ['C', 'C', 'G', 'G', 'Am', 'Am', 'G7', 'C'],
        melody: [
          72, 76, 79, 76, 74, 76, 72, null,
          71, 74, 79, 77, 76, 72, 74, null,
          72, 76, 79, 84, 81, 79, 76, null,
          77, 74, 71, 74, 72, null, null, null,
        ],
      },
      // O meio: sai para fá, com arpejo por baixo, e volta por sol.
      B: {
        groove: 'cheio', arp: true,
        chords: ['F', 'F', 'C', 'C', 'Dm', 'Dm', 'G', 'G'],
        melody: [
          81, null, 81, 79, 77, 79, 81, null,
          79, null, 76, null, 72, null, 76, 79,
          77, null, 77, 76, 74, 76, 77, null,
          79, null, 74, null, 71, 74, 79, null,
        ],
      },
    },
    grooves: {
      leve: { k: 'x.......x.......', h: '..o...o...o...o.' },
      cheio: { k: 'x.......x..o....', s: '....x.......x...', h: 'o.x.o.x.o.x.o.x.' },
      virada: { k: 'x.......x.......', s: '....x.......x.oo', h: 'o.x.o.x.o.x.....' },
    },
    fill: 'virada',
  },

  doces: {
    name: 'Valsa de açúcar',
    bpm: 142, wave: 'square', bassWave: 'triangle', gain: 0.05,
    reverb: 0.18, cutoff: 3000, pad: 'triangle', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'leve',
        chords: ['F', 'F', 'Gm', 'Gm', 'Fmaj7', 'Dm', 'C7', 'C7'],
        melody: [
          77, 81, 84, 81, 77, 84, 81, null,
          79, 82, 86, 82, 79, 86, 82, null,
          77, 81, 84, 88, 86, 84, 81, 84,
          79, 82, 79, 77, 76, null, 72, null,
        ],
      },
      A2: {
        groove: 'doce',
        chords: ['F', 'F', 'Gm', 'Gm', 'Fmaj7', 'Dm', 'C7', 'F'],
        melody: [
          77, 81, 84, 81, 77, 84, 81, null,
          79, 82, 86, 82, 79, 86, 82, null,
          77, 81, 84, 88, 86, 84, 81, 84,
          79, 82, 79, 76, 77, null, null, null,
        ],
      },
      // O meio vai para si bemol e volta pelo dó com sétima.
      B: {
        groove: 'doce', arp: true,
        chords: ['Bb', 'Bb', 'F', 'F', 'Gm', 'C7', 'C7', 'C7'],
        melody: [
          86, null, 82, null, 77, null, 82, 86,
          84, null, 81, null, 77, null, 81, 84,
          82, null, 79, null, 72, null, 76, 79,
          82, null, 79, null, 76, null, 72, null,
        ],
      },
    },
    grooves: {
      leve: { k: 'x.......x.......', h: '..o...o...o...o.' },
      doce: { k: 'x.......x.......', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' },
      virada: { k: 'x.......x.......', s: '....o.......o.oo', h: 'o.o.o.o.o.o.....' },
    },
    fill: 'virada',
  },

  ceu: {
    name: 'Sonho de nuvem',
    bpm: 98, wave: 'sine', bassWave: 'sine', gain: 0.08,
    reverb: 0.38, cutoff: 6000, pad: 'sine', bassStyle: 'long',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        chords: ['D', 'D', 'Em', 'Em', 'D', 'Bm7', 'F#m', 'F#m'],
        melody: [
          74, 78, 81, 86, 81, 78, null, null,
          76, 79, 83, 88, 83, 79, null, null,
          74, 81, 78, 86, 83, 81, null, null,
          73, 78, 81, 85, 81, 78, null, null,
        ],
      },
      A2: {
        groove: 'nuvem', arp: true,
        chords: ['D', 'D', 'Em', 'Em', 'D', 'Bm7', 'A7', 'D'],
        melody: [
          74, 78, 81, 86, 81, 78, null, null,
          76, 79, 83, 88, 83, 79, null, null,
          74, 81, 78, 86, 83, 81, null, null,
          73, 76, 79, 76, 74, null, null, null,
        ],
      },
      B: {
        groove: 'nuvem', arp: true,
        chords: ['G', 'G', 'A', 'A', 'Bm', 'G', 'A7', 'A7'],
        melody: [
          79, 83, 86, 91, 86, 83, null, null,
          81, 85, 88, 93, 88, 85, null, null,
          78, 83, 86, 90, 86, 83, 79, null,
          81, null, 79, null, 76, null, 73, null,
        ],
      },
    },
    grooves: {
      nuvem: { k: 'o.......o.......', h: '....o.......o...' },
    },
  },

  frutas: {
    name: 'Suco de melancia',
    bpm: 132, wave: 'square', bassWave: 'triangle', gain: 0.052,
    reverb: 0.16, cutoff: 3000, pad: 'triangle', stabs: true, bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'leve',
        chords: ['Em', 'Em', 'D', 'D', 'Em', 'Em7', 'D', 'D'],
        melody: [
          76, 79, 83, 79, 76, 83, 79, null,
          74, 78, 81, 78, 74, 81, 78, null,
          76, 79, 83, 86, 88, 86, 83, 79,
          81, 79, 78, 76, 74, null, 78, null,
        ],
      },
      A2: {
        groove: 'fruta',
        chords: ['Em', 'Em', 'D', 'D', 'Em', 'Em7', 'D', 'Em7'],
        melody: [
          76, 79, 83, 79, 76, 83, 79, null,
          74, 78, 81, 78, 74, 81, 78, null,
          76, 79, 83, 86, 88, 86, 83, 79,
          81, 79, 78, 76, 74, 76, null, null,
        ],
      },
      // O meio clareia em dó e sol, e volta pelo si com sétima.
      B: {
        groove: 'fruta', arp: true,
        chords: ['C', 'C', 'G', 'G', 'Am', 'B7', 'Em', 'B7'],
        melody: [
          79, null, 84, null, 88, null, 84, 79,
          79, null, 83, null, 86, null, 83, 79,
          81, null, 84, 81, 83, null, 78, 75,
          76, null, 79, null, 78, null, 75, null,
        ],
      },
    },
    grooves: {
      leve: { k: 'x.......x.......', h: 'o.o.o.o.o.o.o.o.' },
      fruta: { k: 'x.....x.x.......', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.' },
      virada: { k: 'x.....x.x.......', s: '....x.......x.xx', h: 'o.o.o.o.o.o.....' },
    },
    fill: 'virada',
  },

  // Fundo do mar: acordes com sétima, que boiam sem resolver, muito reverb
  // e uma bolha de bumbo de vez em quando.
  oceano: {
    name: 'Fundo do mar',
    bpm: 92, wave: 'sine', bassWave: 'sine', gain: 0.075,
    reverb: 0.42, cutoff: 6000, pad: 'sine', bassStyle: 'long',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        chords: ['Em7', 'Em7', 'F#m7', 'F#m7', 'Em7', 'Bm', 'Dmaj7', 'Dmaj7'],
        melody: [
          64, 67, 71, 74, 71, 67, null, null,
          66, 69, 73, 76, 73, 69, null, null,
          64, 71, 67, 74, 78, 74, null, null,
          62, 66, 69, 73, 69, 66, null, null,
        ],
      },
      A2: {
        groove: 'bolha', arp: true,
        chords: ['Em7', 'Em7', 'F#m7', 'F#m7', 'Em7', 'Bm', 'Dmaj7', 'Em7'],
        melody: [
          64, 67, 71, 74, 71, 67, null, null,
          66, 69, 73, 76, 73, 69, null, null,
          64, 71, 67, 74, 78, 74, null, null,
          62, 66, 69, 73, 71, null, 64, null,
        ],
      },
      B: {
        groove: 'bolha', arp: true,
        chords: ['Cmaj7', 'Cmaj7', 'Bm7', 'Bm7', 'Am7', 'D', 'B7', 'B7'],
        melody: [
          64, 67, 71, 76, 71, 67, null, null,
          62, 66, 69, 74, 69, 66, null, null,
          60, 64, 67, 72, 69, 66, null, null,
          66, 71, 75, 78, 75, 71, null, null,
        ],
      },
    },
    grooves: {
      bolha: { k: 'o.......o.......', h: '..o.......o.o...' },
    },
  },

  vilarejo: {
    name: 'Rua de pedra',
    bpm: 92, wave: 'triangle', bassWave: 'sine', gain: 0.07,
    reverb: 0.22, cutoff: 5000, pad: 'triangle', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'passo',
        chords: ['G', 'G', 'G', 'C', 'F', 'Am', 'C', 'G'],
        melody: [
          67, null, 69, null, 71, null, 72, null,
          71, null, 67, null, 64, null, null, null,
          65, null, 67, null, 69, null, 71, null,
          67, null, 64, null, 62, null, null, null,
        ],
      },
      A2: {
        groove: 'passo',
        chords: ['G', 'G', 'G', 'C', 'F', 'Am', 'C', 'C'],
        melody: [
          67, null, 69, null, 71, null, 72, null,
          71, null, 67, null, 64, null, null, null,
          65, null, 67, null, 69, null, 71, null,
          67, null, 64, null, 60, null, null, null,
        ],
      },
      // O meio desce para lá menor, como uma rua que vira esquina.
      B: {
        groove: 'praca', arp: true,
        chords: ['Am', 'Am', 'Em', 'Em', 'F', 'G', 'C', 'G7'],
        melody: [
          69, null, 72, null, 76, null, 72, null,
          71, null, 67, null, 64, null, 67, null,
          69, null, 65, null, 67, null, 71, null,
          72, null, 67, null, 65, null, 62, null,
        ],
      },
    },
    grooves: {
      passo: { k: 'x.......x.......', s: '....o.......o...' },
      praca: { k: 'x.......x.......', s: '....o.......o...', h: '..o...o...o...o.' },
    },
  },

  // Marcha de verdade: baixo no 1 e no 3, acorde curtinho no 2 e no 4
  // (o "um-pá" de banda de coreto) e caixa com rufo.
  parque: {
    name: 'Marcha do parque',
    bpm: 132, wave: 'square', bassWave: 'square', gain: 0.06,
    reverb: 0.15, cutoff: 3200, pad: 'triangle', stabs: true, bassStyle: 'march',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'marcha',
        chords: ['C', 'C', 'C', 'C', 'G7', 'G7', 'G', 'G'],
        melody: [
          72, null, 72, 74, 76, null, 76, 74,
          72, null, 76, null, 79, null, null, null,
          77, null, 77, 76, 74, null, 74, 72,
          71, null, 74, null, 79, null, null, null,
        ],
      },
      A2: {
        groove: 'marcha',
        chords: ['C', 'C', 'C', 'C', 'G7', 'G7', 'G7', 'C'],
        melody: [
          72, null, 72, 74, 76, null, 76, 74,
          72, null, 76, null, 79, null, null, null,
          77, null, 77, 76, 74, null, 74, 72,
          71, null, 74, null, 72, null, null, null,
        ],
      },
      // O "trio" da marcha: vai para fá e volta passando por ré.
      B: {
        groove: 'trio',
        chords: ['F', 'F', 'C', 'C', 'D7', 'D7', 'G7', 'G7'],
        melody: [
          81, null, 81, 79, 77, null, 72, null,
          79, null, 79, 77, 76, null, 72, null,
          78, null, 78, 76, 74, null, 72, null,
          74, null, 77, null, 79, null, 83, null,
        ],
      },
    },
    grooves: {
      marcha: { k: 'x.......x.......', s: '....x..o....x.oo' },
      trio: { k: 'x...o...x...o...', s: '....x..o....x..o', h: '..o...o...o...o.' },
      rufo: { k: 'x.......x.......', s: 'o.o.o.o.oooox.x.' },
    },
    fill: 'rufo',
  },

  // Trovoada: começa só com a chuva no chimbal e engrossa. A virada do fim
  // é a mais cheia do jogo — é o trovão chegando.
  tempestade: {
    name: 'Trovoada',
    bpm: 116, wave: 'sawtooth', bassWave: 'square', gain: 0.052,
    reverb: 0.25, cutoff: 2400, pad: 'triangle', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'chuva',
        chords: ['Em', 'Em', 'Em', 'Em', 'C7', 'C7', 'Em7', 'B7'],
        melody: [
          64, null, 67, 70, 71, null, 70, 67,
          64, null, 62, null, 64, null, null, null,
          70, null, 72, 70, 67, null, 65, 64,
          62, null, 64, null, 59, null, null, null,
        ],
      },
      A2: {
        groove: 'temporal',
        chords: ['Em', 'Em', 'Em', 'Em', 'C7', 'C7', 'B7', 'Em'],
        melody: [
          64, null, 67, 70, 71, null, 70, 67,
          64, null, 62, null, 64, null, null, null,
          70, null, 72, 70, 67, null, 65, 64,
          63, null, 59, null, 64, null, null, null,
        ],
      },
      B: {
        groove: 'temporal', arp: true,
        chords: ['Am', 'Am', 'Em', 'Em', 'C', 'D', 'B7', 'B7'],
        melody: [
          69, null, 72, null, 76, null, 72, 69,
          71, null, 67, null, 64, null, 67, 71,
          72, null, 76, null, 74, null, 78, null,
          75, null, 71, null, 69, null, 66, null,
        ],
      },
    },
    grooves: {
      chuva: { k: 'x.......x.......', h: 'o.o.o.o.o.o.o.o.' },
      temporal: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.o.x.o.x.o.x.o.' },
      trovao: { k: 'x.x.x.x.x...x...', s: '........xoxoxxxx' },
    },
    fill: 'trovao',
  },

  // Neblina: quase sem bateria — só um chimbal perdido no meio. O que segura
  // a música é o acorde de fundo e a harpinha, num reverb bem grande.
  bruma: {
    name: 'Neblina',
    bpm: 68, wave: 'sine', bassWave: 'sine', gain: 0.07,
    reverb: 0.45, cutoff: 6000, pad: 'sine', bassStyle: 'long',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        chords: ['Am', 'Am', 'Am', 'D', 'Em', 'G', 'Em', 'Em'],
        melody: [
          69, null, null, null, 72, null, null, 71,
          69, null, null, 67, 66, null, null, null,
          71, null, null, null, 74, null, null, 72,
          71, null, null, 69, 67, null, null, null,
        ],
      },
      A2: {
        arp: true,
        chords: ['Am', 'Am', 'Am', 'D', 'Em', 'G', 'Em', 'Am'],
        melody: [
          69, null, null, null, 72, null, null, 71,
          69, null, null, 67, 66, null, null, null,
          71, null, null, null, 74, null, null, 72,
          71, null, null, 72, 69, null, null, null,
        ],
      },
      B: {
        groove: 'nevoa', arp: true,
        chords: ['Fmaj7', 'Fmaj7', 'C', 'C', 'Dm', 'Dm', 'E7', 'E7'],
        melody: [
          77, null, null, null, 76, null, null, 72,
          76, null, null, null, 72, null, null, 67,
          74, null, null, null, 77, null, null, 76,
          74, null, null, 71, 68, null, null, null,
        ],
      },
    },
    grooves: {
      nevoa: { h: '........o.......' },
    },
  },

  // Caverna: a harpinha está em todas as partes (são os cristais) e o reverb
  // é o maior do jogo. A percussão são gotas.
  caverna: {
    name: 'Eco de cristal',
    bpm: 88, wave: 'triangle', bassWave: 'triangle', gain: 0.078,
    reverb: 0.5, cutoff: 5000, pad: 'sine', bassStyle: 'long',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        arp: true,
        chords: ['Em', 'Em', 'Em7', 'Em7', 'F#m', 'F#m', 'D', 'Bm'],
        melody: [
          76, null, 79, null, 83, null, 79, null,
          76, null, 74, null, 71, null, null, null,
          78, null, 81, null, 85, null, 81, null,
          78, null, 76, null, 74, null, null, null,
        ],
      },
      A2: {
        groove: 'gota', arp: true,
        chords: ['Em', 'Em', 'Em7', 'Em7', 'F#m', 'F#m', 'B7', 'Em'],
        melody: [
          76, null, 79, null, 83, null, 79, null,
          76, null, 74, null, 71, null, null, null,
          78, null, 81, null, 85, null, 81, null,
          78, null, 75, null, 76, null, null, null,
        ],
      },
      B: {
        groove: 'gota', arp: true,
        chords: ['C', 'C', 'G', 'G', 'Am', 'B7', 'B7', 'B7'],
        melody: [
          79, null, 84, null, 88, null, 84, null,
          79, null, 83, null, 86, null, 83, null,
          81, null, 84, null, 83, null, 78, null,
          75, null, 78, null, 81, null, 83, null,
        ],
      },
    },
    grooves: {
      gota: { k: 'o.......o.......', h: '......o.......o.' },
    },
  },

  // Praia: o acorde de fundo toca no contratempo, curtinho, como num
  // calipso.
  praia: {
    name: 'Onda na areia',
    bpm: 104, wave: 'triangle', bassWave: 'sine', gain: 0.07,
    reverb: 0.22, cutoff: 5000, pad: 'triangle', stabs: true, bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'areia',
        chords: ['C', 'C', 'G', 'C', 'Am', 'Am', 'F', 'G'],
        melody: [
          72, null, 76, null, 79, null, 76, null,
          74, null, 71, null, 72, null, null, null,
          69, null, 72, null, 76, null, 74, null,
          72, null, 69, null, 67, null, null, null,
        ],
      },
      A2: {
        groove: 'onda',
        chords: ['C', 'C', 'G', 'C', 'Am', 'Am', 'G7', 'C'],
        melody: [
          72, null, 76, null, 79, null, 76, null,
          74, null, 71, null, 72, null, null, null,
          69, null, 72, null, 76, null, 74, null,
          74, null, 71, null, 72, null, null, null,
        ],
      },
      B: {
        groove: 'onda', arp: true,
        chords: ['F', 'F', 'C', 'C', 'Dm', 'G', 'G7', 'G7'],
        melody: [
          77, null, 81, null, 84, null, 81, null,
          79, null, 76, null, 72, null, 76, null,
          74, null, 77, null, 79, null, 74, null,
          77, null, 74, null, 71, null, 67, null,
        ],
      },
    },
    grooves: {
      areia: { k: 'x.......x.......', h: '..o...o...o...o.' },
      onda: { k: 'x.....x...x.....', s: '....o.......o...', h: '..o...o...o...o.' },
    },
  },

  geada: {
    name: 'Neve devagar',
    bpm: 76, wave: 'sine', bassWave: 'sine', gain: 0.07,
    reverb: 0.4, cutoff: 6000, pad: 'sine', bassStyle: 'long',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        chords: ['C', 'Am7', 'Em', 'Am', 'G', 'Em', 'D7', 'D7'],
        melody: [
          76, null, null, 79, 81, null, null, 79,
          76, null, 74, null, 72, null, null, null,
          74, null, null, 76, 79, null, null, 76,
          74, null, 72, null, 74, null, null, null,
        ],
      },
      // O chimbal em semínimas faz o guizo de trenó.
      A2: {
        groove: 'tren', arp: true,
        chords: ['C', 'Am7', 'Em', 'Am', 'G', 'Em', 'D7', 'G'],
        melody: [
          76, null, null, 79, 81, null, null, 79,
          76, null, 74, null, 72, null, null, null,
          74, null, null, 76, 79, null, null, 76,
          74, null, 72, null, 71, null, null, null,
        ],
      },
      B: {
        groove: 'tren', arp: true,
        chords: ['Am', 'Am', 'Em', 'Em', 'F', 'C', 'D7', 'G7'],
        melody: [
          69, null, null, 72, 76, null, null, 72,
          71, null, null, 67, 64, null, null, null,
          72, null, null, 69, 72, null, null, 76,
          74, null, null, 78, 71, null, null, 74,
        ],
      },
    },
    grooves: {
      tren: { h: 'o...o...o...o...' },
    },
  },

  espaco: {
    name: 'Poeira de estrela',
    bpm: 96, wave: 'square', bassWave: 'triangle', gain: 0.065,
    reverb: 0.35, cutoff: 2600, pad: 'triangle', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        arp: true,
        chords: ['D', 'A', 'A7', 'D', 'Em', 'Bm', 'D', 'A'],
        melody: [
          69, null, 74, null, 76, null, 81, null,
          79, null, 76, null, 74, null, null, null,
          71, null, 76, null, 78, null, 83, null,
          81, null, 78, null, 76, null, null, null,
        ],
      },
      A2: {
        groove: 'orbita',
        chords: ['D', 'A', 'A7', 'D', 'Em', 'Bm', 'D', 'D'],
        melody: [
          69, null, 74, null, 76, null, 81, null,
          79, null, 76, null, 74, null, null, null,
          71, null, 76, null, 78, null, 83, null,
          81, null, 78, null, 74, null, null, null,
        ],
      },
      B: {
        groove: 'orbita', arp: true,
        chords: ['Bm', 'Bm', 'G', 'G', 'Em', 'A', 'A7', 'A7'],
        melody: [
          74, null, 78, null, 83, null, 78, null,
          79, null, 83, null, 86, null, 83, null,
          79, null, 76, null, 76, null, 73, null,
          79, null, 76, null, 73, null, 69, null,
        ],
      },
    },
    grooves: {
      orbita: { k: 'x.......x.......', s: '....o.......o...', h: '..o...o...o...o.' },
    },
  },

  // Tambor da montanha: a melodia é grave, então o baixo desce uma oitava
  // e não há acorde de fundo — quem enche é o tambor.
  vulcao: {
    name: 'Tambor da montanha',
    bpm: 128, wave: 'sawtooth', bassWave: 'square', gain: 0.048,
    reverb: 0.2, cutoff: 2200, bassStyle: 'root-fifth', bassShift: -12,
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'tambor',
        chords: ['Am', 'Am', 'Am', 'Am', 'F7', 'Dm7', 'Am', 'E7'],
        melody: [
          57, null, 60, 62, 63, null, 62, 60,
          57, null, 55, null, 57, null, null, null,
          63, null, 65, 63, 62, null, 60, 58,
          57, null, 60, null, 64, null, null, null,
        ],
      },
      A2: {
        groove: 'tribo',
        chords: ['Am', 'Am', 'Am', 'Am', 'F7', 'Dm7', 'Am', 'Am'],
        melody: [
          57, null, 60, 62, 63, null, 62, 60,
          57, null, 55, null, 57, null, null, null,
          63, null, 65, 63, 62, null, 60, 58,
          57, null, 60, null, 57, null, null, null,
        ],
      },
      B: {
        groove: 'tribo', arp: true,
        chords: ['F', 'F', 'G', 'G', 'Am', 'G', 'E7', 'E7'],
        melody: [
          60, null, 65, null, 69, null, 65, 60,
          62, null, 67, null, 71, null, 67, 62,
          64, null, 69, null, 67, null, 62, null,
          64, null, 68, null, 71, null, 74, null,
        ],
      },
    },
    grooves: {
      tambor: { k: 'x..x..x.x..x..x.', s: '....x.......x...' },
      tribo: { k: 'x..x..x.x.x.x...', s: '....x..o....x.oo', h: 'o.o.o.o.o.o.o.o.' },
      erupcao: { k: 'x.x.x.x.x.x.x.x.', s: '........xoxoxxxx' },
    },
    fill: 'erupcao',
  },

  // Canção de ninar: lá menor, o baixo só no tempo forte e uma harpinha em
  // colcheias por baixo da melodia. A percussão é um chocalho e quase
  // nada mais — é a pista de dormir.
  noite: {
    name: 'Canção de ninar',
    bpm: 84, wave: 'triangle', bassWave: 'sine', gain: 0.08,
    reverb: 0.35, cutoff: 4200, pad: 'sine', bassStyle: 'long',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        chords: ['Am', 'Am', 'F', 'G', 'F', 'G', 'Am', 'Am'],
        melody: [
          69, null, 72, null, 76, null, 74, null,
          72, null, 69, null, 67, null, null, null,
          65, null, 69, null, 72, null, 71, null,
          69, null, 67, null, 69, null, null, null,
        ],
      },
      A2: {
        arp: true,
        chords: ['Am', 'Am', 'F', 'G', 'F', 'F', 'E7', 'Am'],
        melody: [
          69, null, 72, null, 76, null, 74, null,
          72, null, 69, null, 67, null, null, null,
          65, null, 69, null, 72, null, 76, null,
          74, null, 71, null, 69, null, null, null,
        ],
      },
      // O meio clareia para dó maior e volta pelo mi com sol sustenido.
      B: {
        groove: 'ninar', arp: true,
        chords: ['C', 'C', 'G', 'G', 'F', 'F', 'E7', 'E7'],
        melody: [
          76, null, 79, null, 84, null, 79, null,
          74, null, 71, null, 67, null, null, null,
          72, null, 77, null, 81, null, 77, null,
          76, null, 74, null, 71, null, 68, null,
        ],
      },
    },
    grooves: {
      ninar: { k: 'o...............', h: '....o.......o...' },
    },
  },

  outono: {
    name: 'Folhas ao vento',
    bpm: 100, wave: 'triangle', bassWave: 'sine', gain: 0.068,
    reverb: 0.28, cutoff: 5000, pad: 'sine', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'folha',
        chords: ['Am', 'Dm', 'G', 'Am', 'Am', 'Dm', 'G', 'E7'],
        melody: [
          69, null, 72, null, 74, 72, 69, null,
          67, null, 69, null, 72, 69, 67, null,
          69, null, 72, 76, 74, 72, 69, null,
          67, 69, 67, 65, 64, null, null, null,
        ],
      },
      A2: {
        groove: 'vento',
        chords: ['Am', 'Dm', 'G', 'Am', 'Am', 'Dm', 'G', 'Am'],
        melody: [
          69, null, 72, null, 74, 72, 69, null,
          67, null, 69, null, 72, 69, 67, null,
          69, null, 72, 76, 74, 72, 69, null,
          67, 69, 67, 65, 64, null, 69, null,
        ],
      },
      // O meio clareia em dó maior e volta pelo mi com sol sustenido.
      B: {
        groove: 'vento', arp: true,
        chords: ['C', 'C', 'G', 'G', 'F', 'Dm', 'E7', 'E7'],
        melody: [
          72, null, 76, null, 79, 76, 72, null,
          71, null, 74, null, 79, 74, 71, null,
          69, null, 72, 77, 74, 72, 69, null,
          68, null, 71, null, 74, null, 76, null,
        ],
      },
    },
    grooves: {
      folha: { k: 'o.......o.......', h: '..o...o...o...o.' },
      vento: { k: 'x.......x.......', s: '....o.......o...', h: '..o...o...o...o.' },
    },
  },

  selva: {
    name: 'Batida da selva',
    bpm: 128, wave: 'square', bassWave: 'triangle', gain: 0.05,
    reverb: 0.2, cutoff: 2800, pad: 'triangle', bassStyle: 'root-fifth',
    form: ['A', 'A2', 'B', 'A2'],
    parts: {
      A: {
        groove: 'tribo',
        chords: ['Dm', 'Gm', 'C', 'Dm', 'Dm', 'Gm', 'F', 'C'],
        melody: [
          74, null, 77, null, 79, 77, 74, null,
          72, null, 74, null, 77, null, null, null,
          74, null, 77, 81, 79, 77, 74, null,
          72, 74, 72, 69, 67, null, null, null,
        ],
      },
      A2: {
        groove: 'selva',
        chords: ['Dm', 'Gm', 'C', 'Dm', 'Dm', 'Gm', 'C', 'Dm'],
        melody: [
          74, null, 77, null, 79, 77, 74, null,
          72, null, 74, null, 77, null, null, null,
          74, null, 77, 81, 79, 77, 74, null,
          72, 74, 72, 69, 74, null, null, null,
        ],
      },
      B: {
        groove: 'selva', arp: true,
        chords: ['Bb', 'Bb', 'F', 'F', 'Gm', 'C', 'A7', 'A7'],
        melody: [
          74, null, 77, null, 82, null, 77, null,
          72, null, 77, null, 81, null, 77, null,
          74, null, 79, null, 76, null, 72, null,
          73, null, 76, null, 79, null, 81, null,
        ],
      },
    },
    grooves: {
      tribo: { k: 'x..x....x..x....', h: '..o...o...o...o.' },
      selva: { k: 'x..x....x..x....', s: '....x..o....x...', h: 'o.ox.o.o.o.xo.o.' },
      tambores: { k: 'x.x.x.x.x.x.x.x.', s: '........o.o.xxxx' },
    },
    fill: 'tambores',
  },

  // A fanfarra de vencer uma pista inteira — as doze fases, uma atrás da
  // outra (ver Game.trackComplete). Mais rápida e mais brilhante que
  // qualquer tema de pista, para não se confundir com "só mais uma fase":
  // é o único troféu do jogo que não é por pontuação. Toca só na tela de
  // vitória; a próxima corrida já troca de volta para o tema da pista.
  vitoria: {
    name: 'Fanfarra da vitória',
    bpm: 150, wave: 'square', bassWave: 'triangle', gain: 0.07, key: 'C',
    melody: [
      72, 76, 79, 84, 79, 84, 88, null,
      86, 84, 79, 84, 88, 91, null, null,
      72, 76, 79, 84, 79, 84, 88, 91,
      91, null, 88, 84, 79, null, null, null,
    ],
    bass: [48, 48, 55, 55, 60, 60, 55, 55],
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
    bpm: 80, wave: 'triangle', bassWave: 'sine', gain: 0.055, key: 'F',
    melody: [
      77, null, 81, null, 84, null, 81, null,
      79, null, 84, null, 82, null, 79, null,
      77, null, 81, null, 86, null, 84, null,
      81, null, 79, null, 77, null, null, null,
    ],
    bass: [41, 48, 36, 43, 38, 45, 34, 41],
  },
};

// --- Temas com forma ------------------------------------------------------
//
// Os primeiros temas eram um laço de 4 compassos — uns 8 segundos que se
// repetiam a fase inteira. Os temas com `form` têm partes (A, A2, B…) de 4
// compassos cada, tocadas na ordem de `form`: A–A2–B–A2 dá 16 compassos,
// meio minuto antes de repetir.
//
// Cada parte tem:
//   melody  32 notas MIDI, uma por colcheia (null = silêncio)
//   chords  8 acordes, um por meio compasso ('C', 'Am', 'G7', 'Fmaj7', 'Bb'…)
//   groove  o nome do padrão de percussão (em `grooves`); sem ele, sem bateria
//   arp     true = harpinha em colcheias tocando as notas do acorde
//
// No tema:
//   grooves  padrões de 16 semicolcheias por compasso, um por peça —
//            k (bumbo), s (caixa), h (chimbal); 'x' forte, 'o' fraco, '.' nada
//   fill     o padrão do último compasso da forma (a virada antes de repetir)
//   bassStyle  'root-fifth' (fundamental e quinta a cada tempo), 'march'
//            (no 1 e no 3) ou 'long' (só no tempo forte de cada acorde)
//   pad      onda do acorde de fundo; com `stabs`, o acorde vira um toque
//            curto no 2 e no 4, como numa marcha
//   reverb   quanto de sala (0 a 1); cutoff  o filtro que tira a aspereza
//   bassShift  semitons para mover o baixo (-12 = uma oitava abaixo), para
//            quando a melodia é grave e encostaria nele
//
// `melody` e `bass` são montados daqui, no formato dos temas antigos, para
// quem só lê esses dois campos (o vídeo do anúncio) continuar funcionando.
const NOTA = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function parseChord(nome) {
  const m = /^([A-G])([#b]?)(m(?!aj))?(maj7|7)?$/.exec(nome);
  if (!m) throw new Error(`acorde que não sei ler: ${nome}`);
  const raiz = (NOTA[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  const notas = [0, m[3] ? 3 : 4, 7];
  if (m[4] === '7') notas.push(10);
  if (m[4] === 'maj7') notas.push(11);
  return { raiz, notas };
}

// Fundamental do baixo entre sol 2 e fá♯ 3 (43–54), a região dos temas antigos.
const graveDe = (raiz) => 43 + ((raiz - 7 + 12) % 12);
const quintaDe = (grave) => (grave + 7 <= 57 ? grave + 7 : grave - 5);

// As notas do acorde arrumadas a partir de `base`, subindo: é o que o pad e
// o arpejo tocam.
function voicing({ raiz, notas }, base) {
  return notas.map((i) => base + ((raiz + i - base) % 12 + 12) % 12).sort((a, b) => a - b);
}

function baixoDoCompasso(acordes, estilo) {
  const [a1, a2] = acordes.map((c) => graveDe(parseChord(c).raiz));
  if (estilo === 'march') return [a1, null, quintaDe(a2), null];
  if (estilo === 'long') return [a1, null, a2, null];
  return [a1, quintaDe(a1), a2, quintaDe(a2)];
}

function montar(id, tema) {
  if (!tema.form) return;
  const melody = [];
  const bass = [];
  const chords = [];
  const grooves = [];
  const arps = [];
  tema.form.forEach((nomeParte, iParte) => {
    const parte = tema.parts[nomeParte];
    if (!parte) throw new Error(`música/${id}: parte ${nomeParte} não existe`);
    if (parte.melody.length !== 32) throw new Error(`música/${id}/${nomeParte}: melody precisa de 32 colcheias`);
    if (parte.chords.length !== 8) throw new Error(`música/${id}/${nomeParte}: chords precisa de 8 acordes`);
    melody.push(...parte.melody);
    for (let compasso = 0; compasso < 4; compasso++) {
      const par = parte.chords.slice(compasso * 2, compasso * 2 + 2);
      const desvio = tema.bassShift || 0;
      bass.push(...baixoDoCompasso(par, tema.bassStyle).map((n) => (n === null ? null : n + desvio)));
      chords.push(...par.map(parseChord));
      const ultimo = iParte === tema.form.length - 1 && compasso === 3;
      const nome = ultimo && tema.fill ? tema.fill : parte.groove;
      const groove = nome ? tema.grooves?.[nome] : null;
      if (nome && !groove) throw new Error(`música/${id}: groove ${nome} não existe`);
      Object.entries(groove || {}).forEach(([peca, padrao]) => {
        if (padrao.length !== 16) throw new Error(`música/${id}/${nome}.${peca}: precisa de 16 semicolcheias`);
      });
      grooves.push(groove);
      arps.push(Boolean(parte.arp));
    }
  });
  Object.assign(tema, { melody, bass, chords, grooveByBar: grooves, arpByBar: arps });
}

Object.entries(THEMES).forEach(([id, tema]) => montar(id, tema));

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
  if (nextStepTime < ctx.currentTime) nextStepTime = ctx.currentTime + 0.1;
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
let master = null;             // o volume do tema (é nele que o mudo mexe)
let tone = null;               // filtro das vozes com nota (não da bateria)
let saidas = [];               // nós do fim da cadeia, para desligar no `stop`
let pausa = null;              // volume da pausa (ver setPaused)
let abafa = null;              // filtro da pausa
let ducker = null;             // volume que abaixa sob os efeitos fortes
let step = 0;                  // em semicolcheias
let nextStepTime = 0;
let muted = getSave().muted;
let pending = null;            // tema esperando o primeiro toque do usuário

// --- A mesa de som ----------------------------------------------------------
//
// Cada tema toca numa cadeia própria:
//
//   vozes ─▶ filtro ─┐
//   bateria ─────────┴▶ master ─┬─▶ compressor ─▶ saída
//                               └─▶ reverb ─────▶ compressor
//
// O compressor segura os picos quando bumbo, baixo e melodia caem juntos.
// O reverb é uma "sala" feita de ruído que vai sumindo — sem arquivo de
// impulso, como o resto do som do jogo. Os temas antigos têm reverb 0 e
// nenhum filtro, e soam como sempre soaram.
let ruidoBuffer = null;
let salaBuffer = null;

function ruidoDe(ctx) {
  if (!ruidoBuffer) {
    ruidoBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruidoBuffer;
}

function salaDe(ctx) {
  if (!salaBuffer) {
    // 1,6 s: o reverb é a peça mais cara da mesa (medido: mais que as vozes
    // todas juntas), e o fim de uma cauda de 2,2 s já estava 30 dB abaixo —
    // não se ouvia, só se pagava.
    const dur = 1.6;
    const n = Math.floor(ctx.sampleRate * dur);
    salaBuffer = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = salaBuffer.getChannelData(canal);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
    }
  }
  return salaBuffer;
}

// --- Modo leve ---------------------------------------------------------------
//
// Num aparelho fraco a música alivia o arranjo: sem reverb, sem a oitava de
// brilho, sem harpinha e sem chimbal, e o acorde de fundo com duas notas em
// vez de três. A melodia, o baixo, o bumbo e a caixa ficam — a música
// continua a mesma, só mais magra.
//
// Liga sozinho de dois jeitos: o navegador conta que o aparelho tem 2 GB de
// memória ou menos (`deviceMemory`, só no Chrome), ou o agendador se atrasa
// — o timer dispara tarde porque a página está engasgando — três vezes em
// vinte segundos. Uma vez ligado, fica ligado até recarregar.
// `musicaLeve()` no console liga e desliga à mão.
let leve = typeof navigator !== 'undefined' && (navigator.deviceMemory ?? 8) <= 2;
let atrasos = [];
let salaNos = null;            // [convolver, molhado], para tirar o reverb

export function setLight(value) {
  leve = Boolean(value);
  if (leve && salaNos) {
    salaNos.forEach((n) => n.disconnect());
    salaNos = null;
  }
  return leve;
}

export const isLight = () => leve;

function anotarAtraso(agora) {
  atrasos = atrasos.filter((t) => agora - t < 20);
  atrasos.push(agora);
  if (!leve && atrasos.length >= 3) {
    setLight(true);
    console.info('música: o aparelho está engasgando, modo leve ligado');
  }
}

function montarCadeia(ctx, tema) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 3;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  comp.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = muted ? 0 : tema.gain;

  // Depois do volume do tema, três controles que o jogo mexe: a pausa
  // (volume e filtro) e o ducking. Ficam em nós separados para um não
  // desfazer o outro — um trovão durante a pausa não "despausa" a música.
  pausa = ctx.createGain();
  ducker = ctx.createGain();
  abafa = ctx.createBiquadFilter();
  abafa.type = 'lowpass';
  abafa.frequency.value = 20000;
  master.connect(pausa).connect(ducker).connect(abafa).connect(comp);
  saidas = [comp, pausa, ducker, abafa];

  salaNos = null;
  if (tema.reverb && !leve) {
    const sala = ctx.createConvolver();
    sala.buffer = salaDe(ctx);
    const molhado = ctx.createGain();
    molhado.gain.value = tema.reverb;
    abafa.connect(sala).connect(molhado).connect(comp);
    saidas.push(sala, molhado);
    salaNos = [sala, molhado];
  }

  if (tema.cutoff) {
    tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = tema.cutoff;
    tone.Q.value = 0.5;
    tone.connect(master);
  } else {
    tone = master;
  }
}

// --- As vozes -------------------------------------------------------------

function voice(ctx, freq, start, duration, wave, level, attack = 0.02, dest = tone) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// Bumbo: um seno que despenca de tom. Começa em 160 Hz e não em 60 para
// aparecer no alto-falante de celular, que não toca grave de verdade.
function bumbo(ctx, t, nivel) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  g.gain.setValueAtTime(0.9 * nivel, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.3);
}

function ruidoFiltrado(ctx, t, tipo, freq, dur, nivel) {
  const fonte = ctx.createBufferSource();
  fonte.buffer = ruidoDe(ctx);
  const f = ctx.createBiquadFilter();
  f.type = tipo;
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(nivel, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  fonte.connect(f).connect(g).connect(master);
  // Começa num ponto qualquer do buffer, para dois toques não soarem iguais.
  fonte.start(t, Math.random() * 0.5, dur + 0.02);
}

// Caixa: o chiado do esteirinha mais um "tum" curto de corpo.
function caixa(ctx, t, nivel) {
  ruidoFiltrado(ctx, t, 'bandpass', 1800, 0.14, 0.32 * nivel);
  voice(ctx, 190, t, 0.08, 'triangle', 0.22 * nivel, 0.002, master);
}

const chimbal = (ctx, t, nivel) => ruidoFiltrado(ctx, t, 'highpass', 7000, 0.04, 0.16 * nivel);

const PECAS = { k: bumbo, s: caixa, h: chimbal };
const FORCA = { x: 1, o: 0.5 };

// --- O agendador ------------------------------------------------------------
//
// Anda em semicolcheias. A melodia toca nas pares (colcheias), o baixo a
// cada quatro (semínimas) — exatamente como era quando o passo era a
// colcheia, então os temas antigos não mudam.
function scheduleStep(ctx, time) {
  const sixteenth = 15 / theme.bpm;
  const eighth = sixteenth * 2;
  const s = step;

  if (s % 2 === 0) {
    const i = s / 2;
    const note = theme.melody[i % theme.melody.length];
    if (note !== null && note !== undefined) {
      voice(ctx, noteHz(note), time, eighth * 1.7, theme.wave, 0.5);
      // Oitava acima bem baixinho, só para dar brilho.
      if (!leve) voice(ctx, noteHz(note + 12), time, eighth * 1.1, 'sine', 0.12);
    }
  }

  if (s % 4 === 0) {
    const bassNote = theme.bass[(s / 4) % theme.bass.length];
    if (bassNote !== null && bassNote !== undefined) {
      voice(ctx, noteHz(bassNote), time, eighth * 2.6, theme.bassWave, 0.55);
    }
  }

  if (theme.form) {
    const compassos = theme.grooveByBar.length;
    const compasso = Math.floor(s / 16) % compassos;
    const noCompasso = s % 16;
    const acorde = theme.chords[Math.floor(s / 8) % theme.chords.length];

    // O acorde de fundo: segurado o meio compasso inteiro, entrando devagar;
    // ou, numa marcha, um toque curto no 2 e no 4.
    if (theme.pad) {
      const todas = voicing(acorde, 57);
      // No modo leve, fundamental e terça: é o que diz se o acorde é maior
      // ou menor.
      const notas = leve ? todas.filter((n) => {
        const i = ((n - acorde.raiz) % 12 + 12) % 12;
        return i === 0 || i === 3 || i === 4;
      }) : todas;
      if (theme.stabs) {
        if (noCompasso === 4 || noCompasso === 12) {
          notas.forEach((n) => voice(ctx, noteHz(n), time, eighth * 0.9, theme.pad, 0.11, 0.005));
        }
      } else if (s % 8 === 0) {
        notas.forEach((n) => voice(ctx, noteHz(n), time, eighth * 4.2, theme.pad, 0.07, eighth));
      }
    }

    // A harpinha: sobe e desce pelas notas do acorde, uma por colcheia.
    if (!leve && theme.arpByBar[compasso] && s % 2 === 0) {
      const notas = voicing(acorde, 67);
      const ordem = [0, 1, 2, 1];
      const n = notas[ordem[(s / 2) % 4]];
      voice(ctx, noteHz(n), time, eighth * 1.4, 'sine', 0.15, 0.005);
    }

    if (brilho && (!leve || s % 2 === 0)) {
      const notas = voicing(acorde, 79);
      const n = notas[[0, 1, 2, 1][s % 4]];
      voice(ctx, noteHz(n), time, sixteenth * 1.6, 'triangle', 0.09, 0.004);
    }

    const groove = theme.grooveByBar[compasso];
    if (groove) {
      Object.entries(groove).forEach(([peca, padrao]) => {
        const forca = FORCA[padrao[noCompasso]];
        if (forca && !(leve && peca === 'h')) PECAS[peca]?.(ctx, time, forca);
      });
    }
  }

  step += 1;
  nextStepTime += sixteenth;
}

function tick() {
  // `peekContext` e não `getContext`: aqui não se retoma nada. Com o app
  // minimizado o navegador continua chamando este timer (mais devagar), e
  // retomar aqui era o que fazia a música voltar por trás.
  const ctx = peekContext();
  if (!ctx || !theme || ctx.state !== 'running') return;
  // Atrasado: o timer devia ter agendado estas notas antes de a hora delas
  // chegar. Em vez de tocar todas de uma vez, atrasadas e emboladas, pula
  // para a próxima semicolcheia — e conta, para o modo leve.
  if (nextStepTime < ctx.currentTime) {
    const sixteenth = 15 / theme.bpm;
    const perdidos = Math.ceil((ctx.currentTime - nextStepTime) / sixteenth);
    step += perdidos;
    nextStepTime += perdidos * sixteenth;
    anotarAtraso(ctx.currentTime);
  }
  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) scheduleStep(ctx, nextStepTime);
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
  // Qualquer pedido de tema é "o jogo voltou": começar de novo, sair para
  // o menu e continuar, todos passam por aqui.
  setPaused(false);
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

  // Troca suave: o tema que sai desce em meio segundo enquanto o novo sobe
  // no mesmo tempo, em vez de um corte seco (lobby → livro → pista).
  const trocando = Boolean(master);
  stop(trocando ? 0.15 : 0.05);
  theme = next;
  step = 0;
  nextStepTime = ctx.currentTime + 0.1;
  montarCadeia(ctx, theme);
  setKey(tonalidadeDe(theme));
  if (trocando && !muted) {
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(theme.gain, ctx.currentTime + 0.6);
  }

  tick();
  timer = setInterval(tick, LOOKAHEAD_MS);
}

// `fade` é a constante de tempo da descida: 0,05 é só para não estalar;
// 0,15 é a troca suave entre temas.
export function stop(fade = 0.05) {
  clearInterval(timer);
  timer = null;
  if (master) {
    const ctx = getContext();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.0001, ctx.currentTime, fade);
    const old = master;
    const fim = saidas;
    setTimeout(() => old.disconnect(), Math.max(400, fade * 8000));
    // O reverb ainda soa um pouco depois que a entrada cala: o fim da
    // cadeia só sai depois que a sala esvaziou.
    setTimeout(() => fim.forEach((n) => n.disconnect()), 2600);
    master = null;
    tone = null;
    pausa = null;
    ducker = null;
    abafa = null;
    salaNos = null;
    saidas = [];
  }
  theme = null;
}

// A tonalidade do tema, para os efeitos de coleta tocarem nela (ver
// audio.js, `setKey`). É o acorde em que a forma termina — a A2 sempre fecha
// na tônica —, ou o `key` dos temas sem forma.
function tonalidadeDe(tema) {
  if (tema.key) return parseChord(tema.key);
  if (tema.chords) return tema.chords[tema.chords.length - 1];
  return null;
}

// --- O que o jogo pede -------------------------------------------------------

// Pausa: a música fica abafada e mais baixa, como se viesse do outro
// cômodo, e volta inteira quando a corrida continua.
export function setPaused(value) {
  const ctx = peekContext();
  if (!ctx || !pausa) return;
  const t = ctx.currentTime;
  // Cancela o que a batida (`bump`) tiver deixado agendado: sem isso, uma
  // pausa logo depois de bater reabria o filtro sozinha.
  for (const p of [pausa.gain, abafa.frequency]) {
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
  }
  pausa.gain.setTargetAtTime(value ? 0.45 : 1, t, 0.12);
  abafa.frequency.setTargetAtTime(value ? 650 : 20000, t, value ? 0.12 : 0.2);
}

// Fase vencida, fim de jogo: a música sai de cena depressa para a fanfarra
// tocar sozinha. A próxima corrida (ou o menu) chama `play` de novo.
export function cut() {
  const ctx = peekContext();
  if (!ctx || !master) return;
  clearInterval(timer);
  timer = null;
  brilho = false;
  master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
  stop();
}

// A batida: a música "afunda" por meio segundo — o filtro fecha de uma vez e
// abre devagar, e o volume cai junto. Só o filtro não bastava: medido, o
// volume quase não mudava, porque o que pesa é o grave, que o filtro deixa
// passar. Dá para sentir a trombada sem som mais alto.
export function bump() {
  const ctx = peekContext();
  if (!ctx || !abafa) return;
  const t = ctx.currentTime;
  const f = abafa.frequency;
  f.cancelScheduledValues(t);
  f.setValueAtTime(f.value, t);
  f.setTargetAtTime(500, t, 0.02);
  f.setTargetAtTime(20000, t + 0.3, 0.18);
  const g = ducker.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.setTargetAtTime(0.35, t, 0.02);
  g.setTargetAtTime(1, t + 0.3, 0.18);
}

// Poder ativo: uma harpinha em semicolcheias, uma oitava acima, por cima do
// tema inteiro enquanto algum poder com tempo estiver valendo. É o que faz
// a criança ouvir que ainda está com o poder, sem olhar a barrinha.
let brilho = false;
export function setSparkle(value) { brilho = Boolean(value); }

// Ducking: a música abaixa enquanto um efeito forte toca (fanfarra, trovão,
// bomba) e volta devagar depois. Quem avisa é o audio.js.
function duck(segundos) {
  const ctx = peekContext();
  if (!ctx || !ducker) return;
  const t = ctx.currentTime;
  ducker.gain.cancelScheduledValues(t);
  ducker.gain.setTargetAtTime(0.4, t, 0.03);
  ducker.gain.setTargetAtTime(1, t + segundos, 0.25);
}
onLoudSfx(duck);

// O botão 🔇 cala a música e os efeitos (ver audio.js, `setSfxMuted`). A
// narração (speech.js) é outra via, a voz do aparelho, e não passa por aqui.
export function setMuted(value) {
  muted = value;
  update((save) => { save.muted = value; });
  setSfxMuted(muted);
  if (master && theme) {
    const ctx = getContext();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(muted ? 0.0001 : theme.gain, ctx.currentTime, 0.08);
  }
}
setSfxMuted(muted);

export function isMuted() {
  return muted;
}

export function themeName(trackId) {
  return THEMES[trackId]?.name || '';
}

// A música do livro da história. Fica aqui, e não solta no Game, para o
// nome do tema e a tabela nunca saírem de sincronia.
export const STORY_THEME = 'historia';
