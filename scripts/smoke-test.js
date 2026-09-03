// Teste de fumaça: monta os modelos e roda alguns frames do mundo sem navegador.
// Não renderiza (isso precisa de WebGL), mas pega erros de geometria e de lógica.
import * as THREE from 'three';
import { createUnicorn, animateUnicorn } from '../src/models/unicorn.js';
import { createHeart, createStar } from '../src/models/collectibles.js';
import { createObstacle, createDecoration, createStartLine } from '../src/models/scenery.js';
import { CHARACTER_LIST } from '../src/models/characters.js';
import { World } from '../src/game/world.js';
import { Game } from '../src/game/Game.js';
import { MODES } from '../src/game/config.js';
import { TRACK_LIST } from '../src/game/tracks.js';
import { POWERUP_LIST, createPowerup } from '../src/models/powerups.js';
import { LEVELS, levelData } from '../src/game/levels.js';
import { createKey } from '../src/models/collectibles.js';
import { readFileSync } from 'node:fs';
import { EN } from '../src/game/i18n-en.js';
import { setIdioma } from '../src/game/i18n.js';
import { THEMES } from '../src/game/music.js';
import { storyPages } from '../src/game/story.js';
import { lessonsFor } from '../src/game/tutorial.js';
import { TUTORIAL_MODE } from '../src/game/config.js';

const countMeshes = (obj) => {
  let n = 0;
  obj.traverse((o) => { if (o.isMesh) n++; });
  return n;
};

console.log(`coração: ${countMeshes(createHeart())} peça(s), estrela: ${countMeshes(createStar())} peça(s)`);
console.log('power-ups: ' + POWERUP_LIST.map((p) => `${p.emoji} ${p.name} (${countMeshes(createPowerup(p.id))} peças)`).join(', '));

for (const character of CHARACTER_LIST) {
  const unicorn = createUnicorn(character);
  for (let i = 0; i < 120; i++) animateUnicorn(unicorn, i / 60, 2.6, i % 90 !== 0);
  console.log(`${character.emoji} ${character.name.padEnd(8)} ${countMeshes(unicorn)} peças`);
}

console.log(`chave mágica: ${countMeshes(createKey())} peças`);
console.log(`portal de partida: ${countMeshes(createStartLine())} peças`);

// Modo Fases: cada fase fica mais difícil, as chaves são raras e a fase
// inteira tem que caber num tempo razoável de corrida.
{
  const scene = new THREE.Scene();
  const world = new World(scene, TRACK_LIST[0]);
  let anterior = null;

  for (let number = 1; number <= LEVELS.length; number++) {
    const mode = { ...MODES.levels, ...levelData(number), level: number };
    world.reset(mode);

    const momentos = [];       // segundo em que cada chave apareceu
    let tempoAteMeta = null;
    for (let frame = 0; frame < 60 * 300; frame++) {
      const t = frame / 60;
      world.update(1 / 60, mode.startSpeed, 0.5, t);
      for (const e of world.entities) {
        if (e.userData.kind !== 'key' || e.userData.contada) continue;
        e.userData.contada = true;
        momentos.push(t);
        if (momentos.length === mode.keys && tempoAteMeta === null) tempoAteMeta = t;
      }
      if (tempoAteMeta !== null) break;
    }

    const intervalos = momentos.slice(1).map((t, i) => t - momentos[i]);
    const media = intervalos.reduce((a, b) => a + b, 0) / (intervalos.length || 1);
    const distancia = media * mode.startSpeed;
    console.log(
      `   fase ${String(number).padStart(2)}: meta ${String(mode.keys).padStart(2)} chaves · `
      + `uma a cada ${media.toFixed(1)}s (~${Math.round(distancia)} passos) · `
      + `fase inteira ~${tempoAteMeta === null ? '∞' : Math.round(tempoAteMeta) + 's'} · `
      + `obstáculo ${Math.round(mode.obstacleChance * 100)}%`
    );

    if (tempoAteMeta === null) throw new Error(`fase ${number}: as chaves não dão para a meta`);
    if (media < 4) throw new Error(`fase ${number}: chaves muito próximas (${media.toFixed(1)}s)`);
    if (tempoAteMeta > 180) throw new Error(`fase ${number}: longa demais (${Math.round(tempoAteMeta)}s)`);
    if (anterior && mode.obstacleChance <= anterior.obstacleChance) {
      throw new Error(`fase ${number} não ficou mais difícil que a anterior`);
    }
    anterior = mode;
  }
}

const unicorn = createUnicorn();

for (const track of TRACK_LIST) {
  const scene = new THREE.Scene();
  const world = new World(scene, track);
  console.log(
    `${track.emoji} ${track.name.padEnd(7)} enfeite ${countMeshes(createDecoration(track))} peças, `
    + `obstáculo ${countMeshes(createObstacle(track))} peças, cenário ${countMeshes(scene)} malhas`
  );

  for (const mode of Object.values(MODES)) {
    world.reset(mode);
    for (let i = 0; i < 600; i++) {
      world.update(1 / 60, mode.startSpeed, 0.5, i / 60);
      animateUnicorn(unicorn, i / 60, mode.startSpeed * 0.14, i % 90 !== 0);
    }
    const obstacles = world.entities.filter((e) => e.userData.kind === 'obstacle').length;
    const powers = world.entities.filter((e) => e.userData.kind === 'powerup');
    console.log(
      `   modo ${mode.name.padEnd(9)} ${world.entities.length} itens na pista `
      + `(${obstacles} obstáculos, ${powers.length} power-up)`
    );
    if (!mode.obstacles && obstacles > 0) throw new Error('modo Livre não pode ter obstáculos!');
    if (!mode.obstacles && powers.some((p) => p.userData.power === 'life')) {
      throw new Error('vida extra não faz sentido no modo Livre!');
    }
  }

  world.burst(new THREE.Vector3(0, 1, 0));
  world.reset();
  if (world.entities.length) throw new Error('reset deixou item para trás');
}

// --- Tradução: nada pode cair em português sem querer -----------------------
//
// A chave do dicionário é a própria frase em português, então um acento
// trocado faz a tradução sumir **em silêncio** — o jogo continua rodando e
// mostra o português. Este teste é o que torna isso visível.
{
  const IGUAIS = new Set(['Uni', 'Lulu', 'Coco']);   // nomes iguais nos dois
  const semTraducao = [];
  const orfas = new Set(Object.keys(EN));
  const ver = (o, campos, onde) => {
    for (const campo of campos) {
      const texto = o?.[campo];
      if (typeof texto !== 'string' || !texto.trim()) continue;
      orfas.delete(texto);
      if (!IGUAIS.has(texto) && !EN[texto]) semTraducao.push(`${onde}.${campo}: ${texto.slice(0, 60)}`);
    }
  };

  CHARACTER_LIST.forEach((c) => ver(c, ['name', 'title', 'story', 'power'], `unicórnio/${c.id}`));
  TRACK_LIST.forEach((t) => ver(t, ['name', 'tagline', 'story'], `pista/${t.id}`));
  storyPages(true).forEach((p) => ver(p, ['title', 'text'], `livro/${p.id}`));
  lessonsFor({ rapido: true }).forEach((l, i) => ver(l, ['fala'], `lição/${i + 1}`));
  POWERUP_LIST.forEach((p) => ver(p, ['name', 'message'], `power-up/${p.id}`));
  [...Object.values(MODES), TUTORIAL_MODE].forEach((m) => ver(m, ['name', 'tagline'], `modo/${m.id}`));
  Object.entries(THEMES).forEach(([id, tema]) => ver(tema, ['name'], `música/${id}`));

  if (semTraducao.length) {
    throw new Error(`sem tradução em inglês:\n   ${semTraducao.join('\n   ')}`);
  }
  console.log(`inglês: ${Object.keys(EN).length} frases, nenhuma faltando`);
  // As frases da interface: tudo que passa por `t('…')` no código, mais o
  // que está marcado com `data-t` no index.html.
  const fonte = ['src/game/Game.js', 'src/game/ui.js']
    .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  const daInterface = new Set();
  for (const m of fonte.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
    daInterface.add(m[1].replace(/\\'/g, "'"));
  }
  for (const m of html.matchAll(/<[^>]*\bdata-t\b[^>]*>([^<]*)</g)) {
    if (m[1].trim()) daInterface.add(m[1]);
  }
  for (const m of html.matchAll(/(?:aria-label|title)="([^"]+)" data-t/g)) daInterface.add(m[1]);

  // O RETRY_HELP é traduzido no ponto de uso — `t(RETRY_HELP[acao])` —, então
  // as frases dele não aparecem como literal dentro de um `t('…')`.
  const ajuda = fonte.slice(fonte.indexOf('const RETRY_HELP'));
  for (const m of ajuda.slice(0, ajuda.indexOf('};')).matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    if (/\s/.test(m[1])) daInterface.add(m[1]);
  }

  // Para o aviso de chave órfã, vale qualquer literal do código: há frases
  // que chegam ao `t()` por dentro de um ternário — `t(x ? 'a' : 'b')` — e
  // não casam com a busca por `t('…')`. Elas são traduzidas na mesma, e não
  // podem ser acusadas de órfãs.
  for (const m of fonte.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) orfas.delete(m[1].replace(/\\'/g, "'"));
  for (const f of daInterface) orfas.delete(f);
  const semIngles = [...daInterface].filter((f) => !EN[f] && f !== '🌍 Idioma · Language');
  if (semIngles.length) {
    throw new Error(`interface sem tradução:\n   ${semIngles.join('\n   ')}`);
  }
  console.log(`   interface: ${daInterface.size} frases, nenhuma faltando`);

  // E o contrário: texto em português **que nunca passou pelo `t()`**.
  //
  // A busca por `t('…')` só encontra o que alguém lembrou de embrulhar. Foi
  // assim que "⚡ Corre mais rápido em" ficou em português no jogo inglês
  // por semanas: a frase morava dentro de uma tag HTML, e ali ninguém olha.
  // A regra aqui é outra — qualquer literal do código cujo **texto visível**
  // (fora das tags e dos `${}`) tenha cara de português precisa ser chave do
  // dicionário. Se for, está traduzido, tanto faz por qual caminho.
  {
    const PORTUGUES = /[àáâãéêíóôõúç]|\b(você|para|com|não|uma|mais|pela|essa|esse|aqui|agora|onde|todos|cada|corre)\b/i;
    const NAO_CONTA = new Set(['🌍 Idioma · Language']);   // bilíngue de propósito
    const soltas = [];
    for (const linha of fonte.split('\n')) {
      if (/^\s*(\/\/|\*)/.test(linha)) continue;
      for (const lit of linha.match(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || []) {
        const corpo = lit.slice(1, -1);
        // Literal que já traz um `t()` dentro está resolvido: o português
        // que sobra nele é o argumento da tradução, não texto solto.
        if (corpo.includes("t('") || corpo.includes('t(`')) continue;
        const visivel = corpo.replace(/<[^>]*>|\$\{[^}]*\}/g, ' ').trim();
        // Uma palavra sem acento é quase sempre nome de classe CSS
        // ('agora', 'lida'); frase de gente tem acento ou tem duas palavras.
        const palavras = visivel.split(/\s+/).filter(Boolean).length;
        if (!/[àáâãéêíóôõúç]/i.test(visivel) && palavras < 2) continue;
        if (visivel.length < 4 || !PORTUGUES.test(visivel)) continue;
        if (EN[corpo] || NAO_CONTA.has(corpo)) continue;
        soltas.push(corpo.slice(0, 70));
      }
    }
    if (soltas.length) {
      throw new Error(`português solto, sem passar pelo dicionário:\n   ${soltas.join('\n   ')}`);
    }
  }

  // Chave repetida no dicionário é o erro que não dá erro: a segunda
  // simplesmente apaga a primeira quando o objeto é montado. Só dá para
  // ver lendo o arquivo como texto.
  const dic = readFileSync(new URL('../src/game/i18n-en.js', import.meta.url), 'utf8');
  const vistas = new Set(); const repetidas = [];
  for (const m of dic.matchAll(/^\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"):/gm)) {
    if (vistas.has(m[1])) repetidas.push(m[1]);
    vistas.add(m[1]);
  }
  if (repetidas.length) throw new Error(`chave repetida no dicionário: ${repetidas.join(', ')}`);

  // Ida e volta: trocar de idioma duas vezes tem de devolver o português
  // exato. É o que o WeakMap dos originais garante — sem ele, o segundo
  // `aplicaIdioma` traduziria em cima do já traduzido e o original sumiria
  // para sempre, dentro da sessão de quem está jogando.
  {
    const alvo = CHARACTER_LIST.find((c) => c.id === 'relampago');
    const antes = { nome: alvo.name, historia: alvo.story };
    setIdioma('en', { salvar: false });
    if (alvo.name !== 'Lightning') throw new Error('trocar para inglês não traduziu o personagem');
    setIdioma('pt', { salvar: false });
    if (alvo.name !== antes.nome || alvo.story !== antes.historia) {
      throw new Error('voltar ao português não devolveu o texto original');
    }
    setIdioma('en', { salvar: false });
    setIdioma('pt', { salvar: false });
    if (alvo.name !== antes.nome) throw new Error('o original se perdeu depois de várias trocas');
    console.log('   troca de idioma: ida e volta preserva o português');
  }

  if (orfas.size) {
    console.log(`   ⚠️  ${orfas.size} chave(s) do dicionário não batem com texto nenhum:`);
    for (const o of orfas) console.log(`      ${o.slice(0, 70)}`);
  }
}

// --- O recorde é a distância de cada pista ---------------------------------
{
  const dono = Object.getOwnPropertyDescriptor(Game.prototype, 'best');
  const chave = Object.getOwnPropertyDescriptor(Game.prototype, 'recordKey').get;
  const em = (pista, modo, distances) => {
    const ctx = { save: { stats: { distances } }, track: { id: pista }, mode: { id: modo } };
    Object.defineProperty(ctx, 'recordKey', { get: () => chave.call(ctx) });
    return dono.get.call(ctx);
  };
  const guardado = { 'campo:baby': 250, 'campo:adventure': 1400, 'oceano:baby': 900 };

  if (em('campo', 'baby', guardado) !== 250) throw new Error('o recorde não é o desta pista nesta brincadeira');
  if (em('campo', 'adventure', guardado) !== 1400) throw new Error('o recorde não separa as brincadeiras');
  if (em('oceano', 'baby', guardado) !== 900) throw new Error('o recorde não separa as pistas');
  if (em('noite', 'baby', guardado) !== 0) throw new Error('pista sem corrida devia dar zero');
  // Uma corrida longa de Aventura não pode virar a marca do Livre: é a
  // razão de a chave ter as duas partes.
  if (em('campo', 'baby', { 'campo:adventure': 1400 }) !== 0) {
    throw new Error('o recorde da Aventura vazou para o Livre');
  }
  // Saves antigos guardavam só o modo, e depois só a pista. Nenhuma das duas
  // formas casa com esta: o recorde recomeça do zero, sem quebrar.
  if (em('campo', 'baby', { baby: 700 }) !== 0) throw new Error('save por modo devia dar zero');
  if (em('campo', 'baby', { campo: 700 }) !== 0) throw new Error('save por pista devia dar zero');
  if (em('campo', 'baby', undefined) !== 0) throw new Error('save sem distances devia dar zero');
  console.log('recorde: distância, uma por pista e brincadeira');
}

console.log('✅ tudo montou sem erros');
