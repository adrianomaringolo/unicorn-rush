// A missão do dia e o baú arco-íris.
//
// **A missão** é uma meta pequena por dia — pegar corações, pular, juntar
// chaves —, a mesma para o dia inteiro e sorteada pela data: quem abre o
// jogo duas vezes no mesmo dia encontra a mesma missão, e amanhã vem outra.
// O progresso conta em todas as corridas do dia, menos na lição do modo
// Aprender (ver Game.contarMissao).
//
// **A sequência**: cada missão cumprida num dia seguido ao da anterior soma
// um dia. Pulou um dia, a conta recomeça do 1. Ao chegar a **7 dias
// seguidos**, vem um **baú arco-íris** e a conta volta a zero.
//
// **O baú arco-íris** é o prêmio grande do jogo: guardado (`save.baus`) até
// a criança abrir, ele sorteia uma coisa entre corações, chaves mágicas, um
// nível a mais num power-up ou um enfeite que ela ainda não tem. Também se
// ganha um ao terminar as doze fases de uma pista (ver Game.trackComplete).
//
// Tudo aqui é lógica pura em cima do save, sem tela: é o que deixa o
// `npm run check` testar a sequência e o sorteio fora do navegador.

// As missões possíveis. `evento` é o que o jogo conta (Game.contarMissao),
// `n` quanto é preciso, e `texto` o que aparece na tela e é lido em voz alta.
// Todas cabem em uma a três corridas: é uma missão de criança, não de dia
// inteiro.
export const MISSOES = [
  { id: 'coracoes', evento: 'coracao', n: 30, emoji: '💗', texto: 'Pegue {n} corações' },
  { id: 'estrelas', evento: 'estrela', n: 5, emoji: '⭐', texto: 'Pegue {n} estrelas' },
  { id: 'pulos', evento: 'pulo', n: 25, emoji: '⬆️', texto: 'Pule {n} vezes' },
  { id: 'poderes', evento: 'poder', n: 3, emoji: '✨', texto: 'Pegue {n} power-ups' },
  { id: 'chaves', evento: 'chave', n: 2, emoji: '🔑', texto: 'Junte {n} chaves mágicas' },
  { id: 'corridas', evento: 'corrida', n: 3, emoji: '🏃', texto: 'Corra {n} vezes' },
  { id: 'vitoria', evento: 'vitoria', n: 1, emoji: '🏆', texto: 'Vença uma fase ou a meta do Livre' },
];
export const MISSAO = Object.fromEntries(MISSOES.map((m) => [m.id, m]));

// Quantos dias seguidos valem um baú.
export const DIAS_PARA_O_BAU = 7;

// O dia de hoje no relógio do aparelho, como texto: '2026-11-22'. É o dia de
// quem está jogando (meia-noite dela), não o de Greenwich.
export function diaDe(data = new Date()) {
  const dois = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}

// O dia anterior a `dia` (texto no mesmo formato).
export function diaAnterior(dia) {
  const [a, m, d] = dia.split('-').map(Number);
  return diaDe(new Date(a, m - 1, d - 1));
}

// Um número fixo para cada dia: a missão sai dele.
function sementeDo(dia) {
  let h = 2166136261;
  for (const letra of dia) h = Math.imul(h ^ letra.charCodeAt(0), 16777619) >>> 0;
  return h;
}

// A missão de um dia. Nunca a mesma de ontem: duas iguais seguidas parecem
// que o jogo esqueceu de trocar.
export function missaoDoDia(dia) {
  const indice = (d) => sementeDo(d) % MISSOES.length;
  let i = indice(dia);
  if (i === indice(diaAnterior(dia))) i = (i + 1) % MISSOES.length;
  return MISSOES[i];
}

// O progresso de hoje. Um save de outro dia volta do zero, com a missão
// nova.
export function missaoDeHoje(save, dia = diaDe()) {
  const guardada = save.missao;
  const missao = missaoDoDia(dia);
  if (guardada?.dia === dia && guardada.id === missao.id) return { ...guardada, missao };
  return { dia, id: missao.id, feito: 0, cumprida: false, missao };
}

// Quantos dias seguidos já foram cumpridos, contando até hoje. Se a última
// missão cumprida foi antes de ontem, a sequência já se perdeu.
export function diasSeguidos(save, dia = diaDe()) {
  const seq = save.sequencia;
  if (!seq?.ultimo) return 0;
  if (seq.ultimo === dia || seq.ultimo === diaAnterior(dia)) return seq.dias || 0;
  return 0;
}

// Conta um acontecimento para a missão de hoje. Mexe no save (chame dentro de
// um `update`) e devolve o que aconteceu: `{ cumpriu, bau, dias }`, ou null
// se nada mudou.
export function contarNaMissao(save, evento, quanto = 1, dia = diaDe()) {
  const hoje = missaoDeHoje(save, dia);
  if (hoje.cumprida || hoje.missao.evento !== evento) return null;

  const feito = Math.min(hoje.missao.n, hoje.feito + quanto);
  const cumprida = feito >= hoje.missao.n;
  save.missao = { dia, id: hoje.id, feito, cumprida };
  if (!cumprida) return { cumpriu: false };

  // Cumpriu: a sequência anda (ou recomeça, se ontem ficou sem missão).
  const dias = (save.sequencia?.ultimo === diaAnterior(dia) ? (save.sequencia.dias || 0) : 0) + 1;
  if (dias >= DIAS_PARA_O_BAU) {
    save.sequencia = { dias: 0, ultimo: dia };
    save.baus = (save.baus || 0) + 1;
    return { cumpriu: true, bau: true, dias };
  }
  save.sequencia = { dias, ultimo: dia };
  return { cumpriu: true, bau: false, dias };
}

// --- O baú arco-íris ---------------------------------------------------------

// O que pode sair, com o peso de cada um. O enfeite só entra no sorteio se
// ainda faltar algum.
const PESOS = { enfeite: 30, poder: 25, coracoes: 25, chaves: 20 };
const entre = (min, max, passo = 1) => min + passo * Math.floor(Math.random() * ((max - min) / passo + 1));

// Sorteia o prêmio de um baú, sem mexer no save. `enfeites` e `poderes` são
// as listas do jogo (ENFEITES e POWERUP_LIST), passadas de fora para este
// arquivo não depender dos modelos 3D.
export function sortearPremio(save, { enfeites = [], poderes = [] } = {}) {
  const meus = new Set(save.enfeites?.meus || []);
  const faltam = enfeites.filter((e) => !meus.has(e.id));
  const pesos = { ...PESOS };
  if (!faltam.length) delete pesos.enfeite;
  if (!poderes.length) delete pesos.poder;

  let sorte = Math.random() * Object.values(pesos).reduce((a, b) => a + b, 0);
  let tipo = 'coracoes';
  for (const [qual, peso] of Object.entries(pesos)) {
    sorte -= peso;
    if (sorte < 0) { tipo = qual; break; }
  }

  if (tipo === 'enfeite') return { tipo, id: faltam[Math.floor(Math.random() * faltam.length)].id };
  if (tipo === 'poder') return { tipo, id: poderes[Math.floor(Math.random() * poderes.length)].id };
  if (tipo === 'chaves') return { tipo, quantos: entre(3, 8) };
  return { tipo: 'coracoes', quantos: entre(60, 150, 10) };
}

// Entrega o prêmio: mexe no save (chame dentro de um `update`).
export function aplicarPremio(save, premio) {
  if (premio.tipo === 'enfeite') {
    save.enfeites = save.enfeites || { coracoes: 0, meus: [], vestindo: {} };
    if (!save.enfeites.meus.includes(premio.id)) save.enfeites.meus = [...save.enfeites.meus, premio.id];
  } else if (premio.tipo === 'poder') {
    save.powerLevels = { ...(save.powerLevels || {}), [premio.id]: (save.powerLevels?.[premio.id] || 0) + 1 };
  } else if (premio.tipo === 'chaves') {
    save.stats.keys = (save.stats.keys || 0) + premio.quantos;
  } else {
    save.enfeites.coracoes = (save.enfeites.coracoes || 0) + premio.quantos;
  }
}
