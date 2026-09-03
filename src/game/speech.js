// Ler os nomes em voz alta, para quem ainda não lê.
//
// Usa a voz do próprio aparelho (`speechSynthesis`), então não precisa de
// arquivo nem de internet. Vem desligado: quem liga é o adulto, no cantinho
// dos grandes. Onde não existe voz em português, o botão nem aparece.
import { idiomaInfo } from './i18n.js';

let ligado = false;

const suporta = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

// Qual voz usar, entre as que o aparelho tem.
//
// A voz padrão de português costuma ser a pior instalada — foi a queixa que
// deu origem a isto. Nenhum serviço de fora resolveria sem quebrar o que o
// jogo garante (funcionar offline, não mandar nada para lugar nenhum, não
// custar nada), mas quase todo aparelho tem **mais de uma** voz, e escolher
// bem já muda muito.
//
// A lista abaixo é de vozes conhecidamente boas, na ordem. Não é exaustiva
// nem precisa ser: quem não estiver nela ainda concorre, só sem bônus.
const PREFERIDAS = {
  'pt-br': [
    'google português do brasil',   // Chrome: a melhor disponível
    'luciana',                      // iOS/macOS
    'microsoft francisca',
    'microsoft maria',
    'fernanda',
    'joana',                        // pt-PT, mas soa melhor que muita pt-BR
  ],
  'en-us': [
    'google us english',
    'samantha',                     // iOS/macOS
    'microsoft aria',
    'microsoft jenny',
    'microsoft zira',
    'ava',
  ],
};

// O adulto pode escolher no cantinho dele; a escolha manda sobre a nota.
let escolhaManual = {};
let escolhidas = {};

function nota(v, alvo, familia) {
  const nome = (v.name || '').toLowerCase();
  const lang = (v.lang || '').toLowerCase();
  let p = 0;
  // Idioma certo antes de tudo: uma voz inglesa lendo português é pior que
  // qualquer voz portuguesa ruim.
  if (lang.startsWith(alvo)) p += 100;
  else if (lang.startsWith(familia)) p += 50;
  else return -1;

  const posicao = (PREFERIDAS[alvo] || []).findIndex((boa) => nome.includes(boa));
  if (posicao >= 0) p += 40 - posicao * 4;

  // Desempate para a voz do próprio aparelho: o jogo é para usar offline, e
  // a voz de servidor emudece sem internet.
  if (v.localService) p += 3;
  return p;
}

// As vozes do idioma de agora, da melhor para a pior.
export function vozesDoIdioma() {
  if (!suporta()) return [];
  const alvo = idiomaInfo().fala.toLowerCase();
  const familia = alvo.split('-')[0];
  return speechSynthesis.getVoices()
    .map((v) => ({ voz: v, p: nota(v, alvo, familia) }))
    .filter((x) => x.p >= 0)
    .sort((a, b) => b.p - a.p)
    .map((x) => x.voz);
}

function voz() {
  const alvo = idiomaInfo().fala.toLowerCase();
  if (escolhidas[alvo] !== undefined) return escolhidas[alvo];

  const lista = vozesDoIdioma();
  // Lista vazia na primeira chamada é normal (o navegador ainda está
  // carregando): aí não guardamos nada e tentamos de novo depois.
  if (!lista.length) return null;

  const pedida = escolhaManual[alvo];
  escolhidas[alvo] = (pedida && lista.find((v) => v.name === pedida)) || lista[0] || null;
  return escolhidas[alvo];
}

// O nome da voz em uso, para mostrar no cantinho dos adultos.
export function nomeDaVoz() {
  return voz()?.name || '';
}

// A escolha do adulto. `null` volta para a melhor da lista.
export function escolherVoz(nome) {
  escolhaManual[idiomaInfo().fala.toLowerCase()] = nome || null;
  escolhidas = {};
  return nomeDaVoz();
}

// Restaura o que estava guardado no save, na abertura.
export function restaurarVozes(guardadas) {
  escolhaManual = { ...(guardadas || {}) };
  escolhidas = {};
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
