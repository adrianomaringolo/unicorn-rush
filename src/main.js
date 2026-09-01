import { Game } from './game/Game.js';
import { createUI } from './game/ui.js';
import { update, resetSave } from './game/storage.js';
import { watchUpdates } from './game/update.js';
import { CHARACTER_LIST } from './models/characters.js';
import { TRACK_LIST } from './game/tracks.js';

const ui = createUI();
const game = new Game(document.querySelector('#scene'), ui);

// Na primeira vez de todas o jogo abre contando a história; depois de
// lida, abre direto no menu (o botão 📖 traz a história de volta).
game.showFirstScreen();

// A tela de carregamento fica no ar pelo menos isto. Não é o tempo que o
// jogo precisa — é o tempo de dar para ver a Uni correndo (são umas duas
// voltas de passada; cada volta leva 1,33 s, ver scripts/gravar-uni.js).
const ESPERA_MINIMA = 3000;

// A tela de carregamento (ver #loading no index.html) sai quando as duas
// coisas já aconteceram:
//
//   1. o navegador pintou a primeira tela de verdade — dois quadros de
//      espera, porque ela ainda renderiza os retratos dos unicórnios e das
//      pistas, e apagar antes mostraria um pisca-pisca branco;
//   2. passaram os ESPERA_MINIMA. Com o jogo já em cache ele abre em poucas
//      centenas de milissegundos, e a animação só piscava: dava para ver que
//      *algo* apareceu, não o quê.
//
// Quando o carregamento demora mais que isso — primeira visita, celular
// devagar —, a conta dá zero e ninguém espera um milissegundo a mais.
requestAnimationFrame(() => requestAnimationFrame(() => {
  const falta = Math.max(0, ESPERA_MINIMA - performance.now());
  setTimeout(() => document.getElementById('loading')?.classList.add('pronto'), falta);
}));

// PWA: guarda o jogo no aparelho, para abrir offline e dar para instalar na
// tela inicial — e avisa quando existe versão nova esperando.
watchUpdates();

window.game = game; // útil para brincar no console

// Atalhos de teste, para o console do navegador:
//
//   chaves(500)   guarda 500 chaves mágicas (e salva)
//   chaves()      o mesmo, com 500
//   destravar()   libera todos os unicórnios e pistas de uma vez
//   zerar()       devolve o save ao começo (uma Uni, um Campo, zero chaves)
//
// Não há tela para isso de propósito: são para quem está desenvolvendo, não
// para quem está jogando.
window.chaves = (quantas = 500) => {
  update((save) => { save.stats.keys = (save.stats.keys || 0) + quantas; });
  game.ui.setWallet(game.wallet, true);
  game.render();
  return `🔑 ${game.wallet}`;
};

window.destravar = () => {
  update((save) => {
    save.shop.characters = CHARACTER_LIST.map((c) => c.id);
    save.shop.tracks = TRACK_LIST.map((t) => t.id);
  });
  game.render();
  return `${CHARACTER_LIST.length} unicórnios e ${TRACK_LIST.length} pistas liberados`;
};

window.zerar = () => {
  resetSave();
  location.reload();
};
