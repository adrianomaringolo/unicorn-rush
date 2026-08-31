// Os cinquenta corações virando uma chave.
//
// A cada 50 corações juntados, a criança ganha uma chave mágica — e esta
// animação é a explicação disso, sem texto: os cinquenta aparecem em volta,
// giram para dentro encolhendo, e no lugar deles nasce a chave, que sobe e
// some.
//
// São cinquenta malhas de uma vez, então tudo aqui é compartilhado: a
// geometria do coração vem de collectibles.js e os cinquenta dividem um
// material só (eles somem juntos de qualquer forma).
import * as THREE from 'three';
import { heartGeo, createKey } from './collectibles.js';
import { COLORS } from '../game/config.js';

const CORACOES = 50;
const RAIO = 2.3;
const FIM = 2.1;            // segundos até a animação acabar

export function createHeartsToKey() {
  const grupo = new THREE.Group();

  const material = new THREE.MeshBasicMaterial({
    color: COLORS.heart, transparent: true, opacity: 0.95,
    depthWrite: false, fog: false,
  });

  const coracoes = [];
  for (let i = 0; i < CORACOES; i++) {
    const coracao = new THREE.Mesh(heartGeo, material);
    coracao.userData = {
      // Três voltas de espiral: espalha os cinquenta sem eles se empilharem.
      angulo: (i / CORACOES) * Math.PI * 6,
      raio: RAIO * (0.5 + Math.random() * 0.7),
      alto: (Math.random() - 0.5) * 1.7,
      atraso: (i / CORACOES) * 0.4,
      giro: Math.random() * Math.PI,
    };
    coracao.scale.setScalar(0.24);
    grupo.add(coracao);
    coracoes.push(coracao);
  }

  // A chave usa materiais próprios (clonados), porque os do jogo são
  // compartilhados com as chaves da pista e aqui elas precisam desbotar.
  const chave = createKey();
  const materiaisChave = [];
  chave.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = obj.material.clone();
    obj.material.transparent = true;
    materiaisChave.push(obj.material);
  });
  chave.scale.setScalar(0);
  grupo.add(chave);

  grupo.userData = { t: 0, coracoes, chave, material, materiaisChave };
  return grupo;
}

// Devolve `false` quando acabou — aí o dono remove e descarta.
export function updateHeartsToKey(fx, dt) {
  const { coracoes, chave, material, materiaisChave } = fx.userData;
  fx.userData.t += dt;
  const t = fx.userData.t;

  for (const coracao of coracoes) {
    const d = coracao.userData;
    const p = Math.min(1, Math.max(0, (t - d.atraso) / 0.9));
    const suave = p * p * (3 - 2 * p);              // acelera e desacelera
    const raio = d.raio * (1 - suave);
    const angulo = d.angulo + suave * 2.6;
    coracao.position.set(Math.cos(angulo) * raio, d.alto * (1 - suave), Math.sin(angulo) * raio);
    coracao.rotation.z = d.giro + suave * 3.2;
    coracao.scale.setScalar(0.24 * (1 - suave * 0.7));
  }
  // Eles desbotam justo quando chegam ao centro, para a troca não ter emenda.
  material.opacity = 0.95 * Math.min(1, Math.max(0, (1.35 - t) / 0.35));

  // A chave nasce com um solavanco, gira, sobe e some.
  const nascimento = Math.min(1, Math.max(0, (t - 0.95) / 0.4));
  const solavanco = Math.sin(nascimento * Math.PI * 0.5) * (1 + (1 - nascimento) * 0.25);
  chave.scale.setScalar(solavanco * 0.95);
  chave.rotation.y = t * 2.4;
  chave.position.y = Math.max(0, t - 1.4) * 1.3;
  const desbota = Math.min(1, Math.max(0, (FIM - t) / 0.5));
  for (const m of materiaisChave) m.opacity = desbota;

  return t < FIM;
}

// Só os materiais criados aqui: a geometria do coração é compartilhada com o
// resto do jogo e não pode ser descartada.
export function disposeHeartsToKey(fx) {
  fx.userData.material.dispose();
  for (const m of fx.userData.materiaisChave) m.dispose();
}
