// A lição do modo Aprender.
//
// A pista aqui não é sorteada: é uma sequência de aulas, uma coisa de cada
// vez, cada uma com a sua frase na tela. O mundo só solta a aula seguinte
// quando a anterior já passou pelo unicórnio (ver World.spawnLesson), então
// a criança nunca tem duas coisas novas em cima dela ao mesmo tempo.
//
// Cada aula é `{ fala, itens, acao? }`:
//
//   `fala`  — o que aparece na faixa, em cima da tela. Curta: quem lê é um
//             adulto em voz alta, ou a voz do aparelho.
//   `itens` — o que nasce na pista. `faixa` é 0, 1 ou 2 (esquerda, meio,
//             direita) e `o` é o quê: 'heart', 'star', 'key', 'rock',
//             'barrier' ou o id de um power-up.
//   `acao`  — 'esquerda', 'direita' ou 'pular'. Quando existe, a aula **cobra**:
//             aparece a seta piscando, e ela só passa quando a criança faz o
//             movimento. Se o item passar sem que ela tenha feito, a aula
//             recomeça — ninguém avança sem ter aprendido.
//             Sem `acao`, a aula é só de mostrar (os power-ups, a chave) e
//             passa sozinha.
//
// A ordem é de propósito: primeiro andar de lado, depois pular, depois o que
// dá para pegar, e só então os power-ups — do mais simples de entender
// (escudo) ao mais espetacular (a bomba, que fecha a lição).

export const LESSONS = [
  {
    // O item do meio não é enfeite: é ele que segura a aula no ar. O ritmo
    // da lição é o dos itens chegando, então uma aula sem nada na pista
    // passaria batida, sem ninguém ler.
    fala: 'A pista anda sozinha — este vem até você ⭐',
    itens: [{ o: 'star', faixa: 1 }],
  },
  {
    fala: 'Vá para a esquerda e pegue o coração 💗',
    acao: 'esquerda',
    itens: [{ o: 'heart', faixa: 0 }],
  },
  {
    fala: 'Agora para a direita!',
    acao: 'direita',
    itens: [{ o: 'heart', faixa: 2 }],
  },
  {
    fala: 'Corações viram chaves: a cada 50, uma chave 🔑',
    itens: [{ o: 'heart', faixa: 0 }, { o: 'heart', faixa: 1 }, { o: 'heart', faixa: 2 }],
  },
  {
    fala: 'Uma pedra! Saia da frente dela 🪨',
    acao: 'lado',
    itens: [{ o: 'rock', faixa: 1 }],
  },
  {
    fala: 'Duas pedras — sobrou uma pista livre',
    itens: [{ o: 'rock', faixa: 0 }, { o: 'rock', faixa: 2 }, { o: 'star', faixa: 1 }],
  },
  {
    fala: 'Essa atravessa tudo: pule! ⬆️',
    acao: 'pular',
    itens: [{ o: 'barrier' }, { o: 'heart', faixa: 1, altura: 1.75 }],
  },
  {
    fala: '🔑 A chave mágica: é ela que liberta os amigos',
    itens: [{ o: 'key', faixa: 1 }],
  },
  {
    fala: '🛡️ Escudo: atravessa tudo sem se machucar',
    itens: [{ o: 'shield', faixa: 1 }],
    depois: [{ o: 'rock', faixa: 0 }, { o: 'rock', faixa: 1 }, { o: 'rock', faixa: 2 }],
  },
  {
    fala: '🧲 Ímã: os corações vêm sozinhos até você',
    itens: [{ o: 'magnet', faixa: 1 }],
    depois: [{ o: 'heart', faixa: 0 }, { o: 'heart', faixa: 2 }],
  },
  {
    fala: '⚡ Turbo: o unicórnio decola e voa por cima',
    itens: [{ o: 'boost', faixa: 1 }],
    depois: [{ o: 'rock', faixa: 0 }, { o: 'rock', faixa: 2 }],
  },
  {
    fala: '💖 Vida extra: devolve um coração da vida',
    itens: [{ o: 'life', faixa: 1 }],
  },
  {
    fala: '🌈 A Bomba Arco-Íris some com tudo pela frente!',
    itens: [{ o: 'bomb', faixa: 1 }],
    depois: [
      { o: 'rock', faixa: 0 }, { o: 'rock', faixa: 1 }, { o: 'rock', faixa: 2 },
      { o: 'barrier' },
    ],
  },
  {
    fala: 'Pronto! Agora é com você 🎉',
    itens: [{ o: 'star', faixa: 1 }],
    fim: true,
  },
];

// A aula do ⚡ só entra quando ela existe: o botão de correr rápido aparece
// se o unicórnio escolhido for rápido naquela pista. Ensinar um botão que
// não está na tela seria pior do que não ensinar.
const LICAO_RAPIDO = {
  fala: 'Viu o botão ⚡ RÁPIDO? Toque para voar mais!',
  itens: [{ o: 'star', faixa: 1 }],
};

export function lessonsFor({ rapido = false } = {}) {
  if (!rapido) return LESSONS;
  // Entra logo antes do encerramento.
  const fim = LESSONS.length - 1;
  return [...LESSONS.slice(0, fim), LICAO_RAPIDO, LESSONS[fim]];
}
