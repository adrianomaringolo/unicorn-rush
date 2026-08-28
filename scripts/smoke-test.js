// Teste de fumaça: monta os modelos e roda alguns frames do mundo sem navegador.
// Não renderiza (isso precisa de WebGL), mas pega erros de geometria e de lógica.
import * as THREE from 'three';
import { createUnicorn, animateUnicorn } from '../src/models/unicorn.js';
import { createHeart, createStar } from '../src/models/collectibles.js';
import { createObstacle, createDecoration } from '../src/models/scenery.js';
import { CHARACTER_LIST } from '../src/models/characters.js';
import { World } from '../src/game/world.js';
import { MODES } from '../src/game/config.js';
import { TRACK_LIST } from '../src/game/tracks.js';
import { POWERUP_LIST, createPowerup } from '../src/models/powerups.js';
import { LEVELS, levelData } from '../src/game/levels.js';
import { createKey } from '../src/models/collectibles.js';

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

console.log('✅ tudo montou sem erros');
