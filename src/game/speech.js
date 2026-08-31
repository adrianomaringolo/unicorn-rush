// Ler os nomes em voz alta, para quem ainda não lê.
//
// Usa a voz do próprio aparelho (`speechSynthesis`), então não precisa de
// arquivo nem de internet. Vem desligado: quem liga é o adulto, no cantinho
// dos grandes. Onde não existe voz em português, o botão nem aparece.
let ligado = false;

const suporta = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

let vozPtBr;
function voz() {
  if (vozPtBr !== undefined) return vozPtBr;
  const vozes = speechSynthesis.getVoices();
  // Lista vazia na primeira chamada é normal (o navegador ainda está
  // carregando): aí não guardamos nada e tentamos de novo depois.
  if (!vozes.length) return null;
  vozPtBr = vozes.find((v) => v.lang?.toLowerCase().startsWith('pt-br'))
    || vozes.find((v) => v.lang?.toLowerCase().startsWith('pt'))
    || null;
  return vozPtBr;
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
    fala.lang = 'pt-BR';
    fala.rate = 0.95;
    fala.pitch = 1.15;
    const v = voz();
    if (v) fala.voice = v;
    speechSynthesis.speak(fala);
  } catch { /* voz é opcional */ }
}

// A lista de vozes chega de forma assíncrona no Chrome.
if (suporta()) speechSynthesis.addEventListener?.('voiceschanged', () => { vozPtBr = undefined; });
