import { Game } from './game/Game.js';
import { createUI } from './game/ui.js';

const ui = createUI();
const game = new Game(document.querySelector('#scene'), ui);

game.showMenu('character');

// PWA: guarda o jogo no aparelho, para abrir offline e dar para instalar
// na tela inicial. Só faz sentido servido por http(s).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* sem offline, tudo bem */ });
  });
}

window.game = game; // útil para brincar no console
