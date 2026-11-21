// Ler os nomes em voz alta, para quem ainda não lê.
//
// A voz é a da **Aria**, a narradora do jogo: as falas foram gravadas antes,
// no ElevenLabs (`npm run vozes`), e moram em assets/voz/<idioma>/, um mp3
// por fala, com o nome tirado do próprio texto (ver falas.js). O jogo só
// toca arquivo — nada sai do aparelho, e depois da primeira vez cada fala
// fica no cache do service worker e toca offline.
//
// Uma fala que não tenha arquivo (uma frase nova, ainda não gravada) cai na
// voz do próprio aparelho (`speechSynthesis`), como era antes de haver
// gravação. Vem desligado: quem liga é o adulto, no cantinho dos grandes.
import { idioma, idiomaInfo } from './i18n.js';
import { semEmoji, chaveDaFala } from './falas.js';
import { getContext, abaixarMusica } from './audio.js';

let ligado = false;

const suporta = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
const temWebAudio = () => typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);

// --- A voz gravada -----------------------------------------------------------

const PASTA = './assets/voz';
const VOLUME = 0.8;
const indices = {};                // idioma → Promise<Set de chaves>
const prontos = {};                // idioma → Set, quando a promessa resolveu
const decodificadas = new Map();   // chave → AudioBuffer (as últimas tocadas)
let fonte = null;                  // a fala gravada tocando agora
let pedido = 0;                    // cada fala nova invalida as anteriores

function indiceDe(lang) {
  if (!indices[lang]) {
    indices[lang] = fetch(`${PASTA}/${lang}/index.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => new Set(Object.keys(d.falas || {})))
      .catch(() => new Set())
      .then((set) => { prontos[lang] = set; return set; });
  }
  return indices[lang];
}

// Se o idioma atual tem gravação. Síncrono: responde pelo que já chegou, e
// pede o índice se ainda não pediu (a resposta certa vem na próxima vez).
export function temVozGravada() {
  const lang = idioma();
  if (typeof fetch !== 'undefined' && !indices[lang]) indiceDe(lang);
  return Boolean(prontos[lang]?.size);
}

function pararGravada() {
  try { fonte?.stop(); } catch { /* já tinha acabado */ }
  fonte = null;
}

// Toca a fala gravada, se houver. Resolve `true` quando a fala é da
// gravação (tocou, ou foi trocada por outra no meio do caminho) e `false`
// quando não há arquivo — aí quem chamou usa a voz do aparelho.
//
// Toca pelo contexto de áudio do jogo, e não por um <audio>: o contexto já
// foi liberado pelo primeiro toque da criança, e o iPhone recusa tocar um
// <audio> que comece depois de um `await`. E o arquivo vem por `fetch`
// inteiro: o <audio> pede em pedaços, e o service worker não guarda
// resposta parcial — a fala nunca ficaria offline.
async function tocarGravada(texto, meu) {
  const lang = idioma();
  const chaves = await indiceDe(lang);
  const chave = chaveDaFala(texto);
  if (!chaves.has(chave)) return false;
  const ctx = getContext();
  if (!ctx) return false;

  let buffer = decodificadas.get(chave);
  if (!buffer) {
    const r = await fetch(`${PASTA}/${lang}/${chave}.mp3`);
    if (!r.ok) return false;
    buffer = await ctx.decodeAudioData(await r.arrayBuffer());
    decodificadas.set(chave, buffer);
    if (decodificadas.size > 24) decodificadas.delete(decodificadas.keys().next().value);
  }
  if (meu !== pedido || !ligado) return true;   // outra fala pediu a vez

  pararGravada();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const volume = ctx.createGain();
  volume.gain.value = VOLUME;
  src.connect(volume).connect(ctx.destination);
  src.onended = () => { if (fonte === src) fonte = null; };
  src.start();
  fonte = src;
  abaixarMusica(buffer.duration);
  return true;
}

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

// Dá para falar com a gravação (precisa só de áudio) ou com a voz do aparelho.
export function canSpeak() {
  return suporta() || temWebAudio();
}

// Corta a fala em andamento sem desligar a voz — para fechar uma tela que
// estava sendo narrada (o livro da história) sem esperar a frase acabar.
export function stop() {
  pedido += 1;
  pararGravada();
  if (suporta()) speechSynthesis.cancel();
}

export function isOn() {
  return ligado && canSpeak();
}

export function setOn(value) {
  ligado = !!value && canSpeak();
  if (ligado) indiceDe(idioma());
  else stop();
  return ligado;
}

// Fala um texto curto (o nome de um unicórnio, de uma pista, de um botão).
// Cada fala nova corta a anterior: a criança toca rápido em vários tiles e
// não dá para acumular uma fila de vozes.
export function speak(text) {
  if (!isOn() || !text) return;
  const limpo = semEmoji(text);
  if (!limpo) return;
  stop();
  const meu = pedido;
  tocarGravada(limpo, meu)
    .catch(() => false)
    .then((gravada) => { if (!gravada && meu === pedido && ligado) falarComAparelho(limpo); });
}

function falarComAparelho(text) {
  if (!suporta()) return;
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
