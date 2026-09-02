// Ler os nomes em voz alta, para quem ainda não lê.
//
// Usa a voz do próprio aparelho (`speechSynthesis`), então não precisa de
// arquivo nem de internet. Vem desligado: quem liga é o adulto, no cantinho
// dos grandes. Onde não existe voz em português, o botão nem aparece.
import { idiomaInfo } from './i18n.js';

let ligado = false;

const suporta = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

// Uma voz guardada por idioma: quem troca de idioma no meio do jogo troca
// de voz junto, e a busca (que é cara) não se repete a cada nome falado.
let escolhidas = {};
function voz() {
  const alvo = idiomaInfo().fala.toLowerCase();     // 'pt-br', 'en-us'
  if (escolhidas[alvo] !== undefined) return escolhidas[alvo];
  const vozes = speechSynthesis.getVoices();
  // Lista vazia na primeira chamada é normal (o navegador ainda está
  // carregando): aí não guardamos nada e tentamos de novo depois.
  if (!vozes.length) return null;
  const familia = alvo.split('-')[0];               // 'pt', 'en'
  escolhidas[alvo] = vozes.find((v) => v.lang?.toLowerCase().startsWith(alvo))
    || vozes.find((v) => v.lang?.toLowerCase().startsWith(familia))
    || null;
  return escolhidas[alvo];
}

export function canSpeak() {
  return suporta();
}

export function isOn() {
  return ligado && suporta();
}

export function setOn(value) {
  ligado = !!value && suporta();
  if (!ligado && suporta()) speechSynthesis.cancel();
  return ligado;
}

// Fala um texto curto (o nome de um unicórnio, de uma pista, de um botão).
// Cada fala nova corta a anterior: a criança toca rápido em vários tiles e
// não dá para acumular uma fila de vozes.
export function speak(text) {
  if (!isOn() || !text) return;
  try {
    speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(String(text));
    fala.lang = idiomaInfo().fala;
    fala.rate = 0.95;
    fala.pitch = 1.15;
    const v = voz();
    if (v) fala.voice = v;
    speechSynthesis.speak(fala);
  } catch { /* voz é opcional */ }
}

// A lista de vozes chega de forma assíncrona no Chrome.
if (suporta()) speechSynthesis.addEventListener?.('voiceschanged', () => { escolhidas = {}; });
