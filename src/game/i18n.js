// Os dois idiomas do jogo.
//
// A chave de tradução é **o próprio texto em português**. Não é o costume
// (o costume é `menu.jogar`), e foi escolha:
//
//   1. o código continua legível — `t('Vamos correr?')` diz o que aparece
//      na tela, e `t('menu.correr')` não diz nada sem abrir outro arquivo;
//   2. uma frase que ainda não foi traduzida cai de volta no português em
//      vez de virar um código cru na tela da criança. Conteúdo novo (um
//      unicórnio, uma pista) funciona no dia em que é escrito e espera a
//      tradução sem quebrar nada.
//
// O preço é que mudar a redação em português "perde" a tradução daquela
// frase — ela volta a aparecer em português até alguém atualizar o
// dicionário. Isso é visível na hora, que é melhor do que silencioso.
import { EN } from './i18n-en.js';
import { update } from './storage.js';
import { CHARACTER_LIST } from '../models/characters.js';
import { TRACK_LIST } from './tracks.js';
import { STORY, STORY_END } from './story.js';
import { POWERUP_LIST } from '../models/powerups.js';
import { MODES, TUTORIAL_MODE } from './config.js';
import { THEMES } from './music.js';

export const IDIOMAS = {
  pt: { id: 'pt', nome: 'Português', bandeira: '🇧🇷', fala: 'pt-BR', html: 'pt-BR' },
  en: { id: 'en', nome: 'English', bandeira: '🇺🇸', fala: 'en-US', html: 'en' },
};

// `pt` não tem dicionário: ele *é* o original.
const DICIONARIOS = { pt: null, en: EN };

let atual = 'pt';

export const idioma = () => atual;
export const idiomaInfo = () => IDIOMAS[atual];

// O que o aparelho sugere. Só serve para já deixar o botão certo em
// destaque na primeira tela — quem decide é quem está jogando, e a escolha
// fica guardada (ver Game.showLanguagePicker).
export function idiomaSugerido() {
  const nav = String(navigator.languages?.[0] || navigator.language || 'pt').toLowerCase();
  return nav.startsWith('pt') ? 'pt' : 'en';
}

// Traduz uma frase. `vars` preenche os buracos escritos como {nome}:
//
//   t('Faltaram {n} chaves', { n: 3 })
//
// Os buracos existem porque a ordem das palavras muda de um idioma para o
// outro: em inglês o número pode não ficar no mesmo lugar da frase.
export function t(frase, vars) {
  if (typeof frase !== 'string' || !frase) return frase;
  const dic = DICIONARIOS[atual];
  let saida = (dic && dic[frase]) || frase;
  if (vars) {
    for (const [chave, valor] of Object.entries(vars)) {
      saida = saida.split(`{${chave}}`).join(String(valor));
    }
  }
  return saida;
}

// --- Os textos que moram dentro dos dados ---------------------------------
//
// Personagem, pista, power-up, página do livro e lição carregam prosa nos
// próprios objetos (`name`, `story`, `tagline`…). Em vez de espalhar `t()`
// por todo lugar que lê esses campos — seriam dezenas —, o idioma é
// aplicado **uma vez** sobre as listas, e o resto do jogo continua lendo
// `personagem.name` sem saber que existe tradução.
//
// O português original de cada objeto fica guardado aqui antes da primeira
// troca; sem isso, trocar pt → en → pt traduziria em cima do já traduzido e
// o original se perderia.
const CAMPOS = ['name', 'title', 'story', 'power', 'tagline', 'text', 'message', 'fala'];
const ORIGINAIS = new WeakMap();

export function traduzItens(lista) {
  for (const item of lista || []) {
    if (!item || typeof item !== 'object') continue;
    if (!ORIGINAIS.has(item)) {
      const original = {};
      for (const campo of CAMPOS) {
        if (typeof item[campo] === 'string') original[campo] = item[campo];
      }
      ORIGINAIS.set(item, original);
    }
    for (const [campo, texto] of Object.entries(ORIGINAIS.get(item))) {
      item[campo] = t(texto);
    }
  }
}

function aplicaIdioma() {
  traduzItens(CHARACTER_LIST);
  traduzItens(TRACK_LIST);
  traduzItens(STORY);
  traduzItens(STORY_END);
  traduzItens(POWERUP_LIST);
  traduzItens(Object.values(MODES));
  traduzItens([TUTORIAL_MODE]);
  traduzItens(Object.values(THEMES));   // os nomes das músicas, na ficha da pista
}

// --- Os textos que já estão escritos no index.html ------------------------
//
// O HTML é estático e não tem como chamar `t()`. Então os pedaços
// traduzíveis são marcados com `data-t` lá, e aqui a gente troca o texto
// (e o `aria-label`/`title`, quando houver) no lugar.
//
// O português original de cada elemento fica guardado antes da primeira
// troca, pelo mesmo motivo dos dados: senão trocar de idioma duas vezes
// traduziria em cima do traduzido.
const NO_HTML = new WeakMap();

export function traduzHtml(raiz) {
  const onde = raiz || (typeof document !== 'undefined' ? document : null);
  if (!onde) return;
  for (const el of onde.querySelectorAll('[data-t]')) {
    if (!NO_HTML.has(el)) {
      NO_HTML.set(el, {
        texto: el.children.length ? null : el.textContent,
        aria: el.getAttribute('aria-label'),
        titulo: el.getAttribute('title'),
      });
    }
    const pt = NO_HTML.get(el);
    if (pt.texto !== null) el.textContent = t(pt.texto);
    if (pt.aria) el.setAttribute('aria-label', t(pt.aria));
    if (pt.titulo) el.setAttribute('title', t(pt.titulo));
  }
}

export function setIdioma(id, { salvar = true } = {}) {
  atual = IDIOMAS[id] ? id : 'pt';
  if (salvar) update((save) => { save.idioma = atual; });
  if (typeof document !== 'undefined') {
    document.documentElement.lang = IDIOMAS[atual].html;
  }
  aplicaIdioma();
  traduzHtml();
  return atual;
}
