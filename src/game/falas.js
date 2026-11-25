// Tudo o que a narração diz, montado num lugar só.
//
// A ficha lida em voz alta, a vitória, "… é sua!": as frases saem das
// funções daqui, para a tela e a voz dizerem a mesma coisa.
import { t } from './i18n.js';
import { CHARACTER_LIST } from '../models/characters.js';
import { TRACKS } from './tracks.js';

// A voz lê texto, não figurinha nem HTML: sem tirar os emoji, o "⭐" no meio
// de "as estrelas ⭐ valem o dobro" vira "estrela branca média" em alguns
// aparelhos.
export function semEmoji(texto) {
  return String(texto ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
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
