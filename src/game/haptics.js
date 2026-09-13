// Vibração do aparelho: um reforço de toque para bater em obstáculo ou
// pegar um power-up, por cima do som e do tremor de tela que já existiam.
//
// `navigator.vibrate` é Android/Chrome só — o Safari/iOS nunca implementou.
// Por isso é tratado do mesmo jeito que a voz em speech.js: um extra
// opcional que ninguém nota que falta, nunca preso a nada essencial, e
// sem toggle nenhum — não precisa de um botão de mudo próprio porque só
// quem sente sabe se incomoda, e quem não sente (metade em iPhone) nem
// percebe que existe.
const suporta = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

// Vibração é opcional: um aparelho sem suporte, ou que recusa a chamada
// (alguns navegadores exigem toque recente), não pode derrubar o jogo.
function vibrar(padrao) {
  if (!suporta()) return;
  try {
    navigator.vibrate(padrao);
  } catch (erro) {
    console.warn('vibração falhou:', erro);
  }
}

export const haptics = {
  // Bateu num obstáculo — a casca do Coco aguentando, a batida "de brincar"
  // do Aprender, ou a que tira vida de verdade: as três sacodem a tela e
  // tocam sfx.hit() igual, então vibram igual também.
  hit: () => vibrar(80),
  // Pegou um power-up comum: um toque leve, rápido.
  power: () => vibrar(25),
  // A Bomba Arco-Íris é o maior estouro do jogo — dois toques em vez de um.
  bomb: () => vibrar([30, 40, 30]),
};
