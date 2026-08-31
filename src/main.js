import { Game } from './game/Game.js';
import { createUI } from './game/ui.js';
import { update, resetSave } from './game/storage.js';
import { CHARACTER_LIST } from './models/characters.js';
import { TRACK_LIST } from './game/tracks.js';

const ui = createUI();
const game = new Game(document.querySelector('#scene'), ui);

game.showHome();

// PWA: guarda o jogo no aparelho, para abrir offline e dar para instalar
// na tela inicial. Só faz sentido servido por http(s).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* sem offline, tudo bem */ });
  });
}

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
