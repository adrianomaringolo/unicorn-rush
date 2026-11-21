// Tudo o que a narração diz, montado num lugar só.
//
// As falas são gravadas antes (ElevenLabs, ver scripts/vozes.mjs) e o jogo
// acha o arquivo pela **chave do texto**. Então o texto que o jogo pede tem
// de ser, letra por letra, o que o script gravou — e o jeito de garantir
// isso é os dois montarem as frases com as mesmas funções, daqui.
//
// `todasAsFalas()` é a lista completa no idioma atual: o script percorre ela
// para gravar. Uma frase nova que o jogo fale e não esteja aqui não quebra
// nada — cai na voz do aparelho —, mas fica sem a voz da narradora até
// entrar na lista.
import { t } from './i18n.js';
import { CHARACTER_LIST } from '../models/characters.js';
import { TRACK_LIST, TRACKS } from './tracks.js';
import { MODES, DIFFICULTY_LIST, TUTORIAL_MODE } from './config.js';
import { storyPages } from './story.js';

// A voz lê texto, não figurinha nem HTML: sem tirar os emoji, o "⭐" no meio
// de "as estrelas ⭐ valem o dobro" vira "estrela branca média" em alguns
// aparelhos. É também a forma "canônica" da frase, a que vira chave.
export function semEmoji(texto) {
  return String(texto ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// A chave de uma fala: FNV-1a de 32 bits do texto limpo, em hexadecimal.
// Síncrona e igual no navegador e no Node — é o nome do arquivo gravado.
export function chaveDaFala(texto) {
  const limpo = semEmoji(texto);
  let h = 0x811c9dc5;
  for (let i = 0; i < limpo.length; i++) {
    h ^= limpo.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const emLista = (nomes) => (nomes.length > 1
  ? t('{primeiras} e {ultima}', { primeiras: nomes.slice(0, -1).join(', '), ultima: nomes[nomes.length - 1] })
  : nomes[0]);

// As pistas em que o unicórnio corre mais rápido (HTML, para a ficha).
export function rapidasDoUnicornio(item) {
  if (!item.fast?.length) return '';
  const nomes = item.fast.map((pista) => `<b>${TRACKS[pista]?.emoji || ''} ${TRACKS[pista]?.name || pista}</b>`);
  return t('⚡ Corre mais rápido em {pistas}', { pistas: emLista(nomes) });
}

// Na ficha da pista, o contrário: quem corre mais rápido nela. `possui(c)`
// diz se um unicórnio que se conquista (`earned`, o Eco) já foi encontrado
// — enquanto for mistério, o nome dele aqui entregaria que existe.
export function rapidasDaPista(item, possui = () => false) {
  const donos = CHARACTER_LIST.filter((c) => c.fast?.includes(item.id))
    .filter((c) => !c.earned || possui(c));
  if (!donos.length) return '';
  return t('⚡ Correm mais rápido aqui: {unicornios}', {
    unicornios: emLista(donos.map((c) => `<b>${c.emoji} ${c.name}</b>`)),
  });
}

// O que o botão 🔊 da ficha lê: quem é (nome, título, história).
export function falaHistoria(kind, item, oculto = false) {
  const subtitulo = kind === 'character' ? item.title : '';
  const descricao = kind === 'track' ? (item.story || item.tagline) : item.story;
  return semEmoji([
    oculto ? t('Ninguém sabe quem é.') : `${item.name}.`,
    !oculto && subtitulo ? `${subtitulo}.` : '',
    oculto ? t('Dizem que alguém espera na torre da neblina.') : descricao,
  ].filter(Boolean).join(' '));
}

// O que o segundo botão 🔊 lê: o poder e as pistas rápidas.
export function falaPoder(kind, item, oculto = false, possui = () => false) {
  const rapidas = kind === 'track'
    ? rapidasDaPista(item, possui)
    : (oculto ? '' : rapidasDoUnicornio(item));
  return semEmoji([
    !oculto && kind === 'character' && item.power ? `${item.power}.` : '',
    rapidas,
  ].filter(Boolean).join(' '));
}

// As frases soltas que o jogo diz, com o nome dentro.
export const falaVitoria = (pista) => t('Você venceu a pista {pista}!', { pista: pista.name });
export const falaEhSua = (item) => t('{nome} é sua!', { nome: item.name });
export const falaApresentacao = (c) => `${c.name}. ${c.title || ''}`;
export const falaLigou = () => t('Pronto, agora eu falo');
export const falaPagina = (folha) => `${folha.title}. ${folha.text}`;

// Todas as falas no idioma atual, já limpas e sem repetição.
export function todasAsFalas() {
  const falas = [falaLigou()];
  const ganhos = CHARACTER_LIST.filter((c) => c.earned);

  for (const c of CHARACTER_LIST) {
    falas.push(c.name, falaApresentacao(c), falaEhSua(c));
    falas.push(falaHistoria('character', c), falaPoder('character', c));
    if (c.earned) falas.push(falaHistoria('character', c, true), falaPoder('character', c, true));
  }
  for (const p of TRACK_LIST) {
    falas.push(p.name, falaVitoria(p), falaEhSua(p), falaHistoria('track', p));
    // As duas fichas possíveis: antes e depois de encontrar quem se conquista.
    falas.push(falaPoder('track', p, false, () => false));
    if (ganhos.length) falas.push(falaPoder('track', p, false, () => true));
  }
  for (const m of [...Object.values(MODES), TUTORIAL_MODE]) falas.push(m.name);
  for (const d of DIFFICULTY_LIST) falas.push(t(d.name));
  for (const folha of storyPages(true)) falas.push(falaPagina(folha));

  return [...new Set(falas.map(semEmoji).filter(Boolean))];
}
