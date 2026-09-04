// Power-ups que aparecem de vez em quando na pista.
//
// Cada um traz o próprio modelo 3D (formas simples, como o resto do jogo) e
// os números do efeito. O jogo usa `POWERUPS` para saber quanto tempo dura
// cada um e o que mostrar no HUD.
//
// O `weight` é o peso no sorteio (ver World.rollPowerup): todos valem 1,
// menos a Bomba Arco-Íris, que vale menos — ela limpa a pista inteira, e o
// que limpa a pista inteira não pode ser tão comum quanto o resto.
//
// `needsObstacles` e `needsLives` dizem de que o power-up depende para fazer
// sentido. O modo Livre não tem nem obstáculo nem vidas, então quem depende
// de um dos dois simplesmente não nasce lá — um Escudo numa pista sem nada
// para atravessar é uma promessa vazia.
import * as THREE from 'three';
import { createGlow } from './collectibles.js';

const mat = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

export const POWERUPS = {
  shield: {
    id: 'shield',
    name: 'Escudo',
    emoji: '🛡️',
    color: 0x74c0fc,
    duration: 8,
    needsObstacles: true,   // sem obstáculo não há de que se proteger
    message: 'Invencível!',
  },
  magnet: {
    id: 'magnet',
    name: 'Ímã',
    emoji: '🧲',
    color: 0xff5d8f,
    duration: 8,
    message: 'Os corações vêm sozinhos!',
  },
  boost: {
    id: 'boost',
    name: 'Turbo',
    emoji: '⚡',
    color: 0xffe066,
    duration: 5,
    speed: 1.65,          // multiplica a velocidade enquanto dura
    message: 'Super velocidade!',
  },
  feather: {
    id: 'feather',
    name: 'Pena Mágica',
    emoji: '🪶',
    color: 0xcc5de8,
    duration: 8,
    // Multiplica a velocidade do pulo (não a altura direto: a altura vai
    // com o quadrado da velocidade — ver o comentário do `jumpBoost` do
    // Limão em characters.js). 1,4 rende quase o dobro de altura.
    jumpBoost: 1.4,
    message: 'Pulo gigante!',
  },
  life: {
    id: 'life',
    name: 'Vida extra',
    emoji: '💖',
    color: 0xff8fb1,
    duration: 0,          // efeito na hora, não dura
    needsLives: true,     // no Livre não há vida para devolver
    message: 'Mais uma vida!',
  },
  bomb: {
    id: 'bomb',
    name: 'Bomba Arco-Íris',
    emoji: '🌈',
    color: 0xff7b9d,      // uma cor só, para o halo e o brilho da pista
    duration: 0,          // efeito na hora: a onda vai e acaba
    // Peso do sorteio. Com os outros quatro valendo 1, 0,45 dá uma bomba a
    // cada dez power-ups (0,45 / 4,45). No Devagarinho a velocidade sobe
    // este peso para 1 (ver DIFFICULTIES.facil.powerWeights).
    weight: 0.45,
    needsObstacles: true,   // sem obstáculo não há o que desintegrar
    message: 'Tudo pelos ares!',
  },
};

// As cores da onda e da bomba, na ordem do arco-íris.
export const ARCO_IRIS = [0xff7b9d, 0xffb26b, 0xffe36b, 0x8ce99a, 0x74c0fc, 0xc09cff];

export const POWERUP_LIST = Object.values(POWERUPS);

// Argolinha girando em volta do item, para dar destaque na pista.
// Fica em pé (virada para o jogador), senão some de tão fina na câmera.
function halo(color) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.08, 6, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
  );
}

function shieldModel() {
  const g = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.lineTo(0.42, 0.28);
  shape.lineTo(0.42, -0.12);
  shape.quadraticCurveTo(0.42, -0.42, 0, -0.6);
  shape.quadraticCurveTo(-0.42, -0.42, -0.42, -0.12);
  shape.lineTo(-0.42, 0.28);
  shape.closePath();

  const badge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1,
    }).center(),
    mat(0x74c0fc, { emissive: 0x123a5a })
  );
  badge.castShadow = true;
  g.add(badge);

  // Bolha de proteção em volta
  const bubble = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshLambertMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.22 })
  );
  g.add(bubble);
  return g;
}

function magnetModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.16, 6, 12, Math.PI),
    mat(0xff5d8f, { emissive: 0x4d0f22 })
  );
  body.rotation.z = Math.PI;      // ferradura de cabeça para baixo (pernas para cima)
  g.add(body);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8), mat(0xff5d8f));
    leg.position.set(side * 0.34, 0.15, 0);
    g.add(leg);

    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.18, 8), mat(0xfff0f6));
    tip.position.set(side * 0.34, 0.36, 0);
    g.add(tip);
  }
  g.position.y = -0.1;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function boostModel() {
  const shape = new THREE.Shape();
  shape.moveTo(0.1, 0.6);
  shape.lineTo(-0.3, 0.05);
  shape.lineTo(-0.02, 0.02);
  shape.lineTo(-0.16, -0.6);
  shape.lineTo(0.3, 0.0);
  shape.lineTo(0.02, 0.03);
  shape.closePath();

  const bolt = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1,
    }).center(),
    mat(0xffe066, { emissive: 0x6b5400 })
  );
  bolt.scale.setScalar(1.15);
  bolt.castShadow = true;

  const g = new THREE.Group();
  g.add(bolt);
  return g;
}

// Pena Mágica: uma pena colorida, com as barbas em três tons empilhados
// (dá o efeito de pena "de várias cores") e uma cana fininha no meio.
function featherModel() {
  const g = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(0, 0.6);
  shape.quadraticCurveTo(0.3, 0.4, 0.26, 0.02);
  shape.quadraticCurveTo(0.2, -0.28, 0.05, -0.56);
  shape.quadraticCurveTo(0.02, -0.62, 0, -0.66);
  shape.quadraticCurveTo(-0.02, -0.62, -0.05, -0.56);
  shape.quadraticCurveTo(-0.2, -0.28, -0.26, 0.02);
  shape.quadraticCurveTo(-0.3, 0.4, 0, 0.6);
  shape.closePath();

  const tons = [0xcc5de8, 0xff8fa3, 0xffd43b];   // violeta, rosa, dourado
  tons.forEach((cor, i) => {
    const barbas = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1,
      }).center(),
      mat(cor, { emissive: new THREE.Color(cor).multiplyScalar(0.16) })
    );
    const s = 1 - i * 0.24;
    barbas.scale.set(s, s, 1);
    barbas.position.z = i * 0.06 - 0.06;
    barbas.rotation.z = (i - 1) * 0.06;
    barbas.castShadow = true;
    g.add(barbas);
  });

  const cana = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.2, 6), mat(0xfff6fb));
  cana.position.z = 0.12;
  cana.castShadow = true;
  g.add(cana);

  return g;
}

function lifeModel() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.0, -0.1, 0.5, 0.1, 0.5, 0.45);
  shape.bezierCurveTo(0.5, 0.75, 0.2, 0.85, 0, 0.55);
  shape.bezierCurveTo(-0.2, 0.85, -0.5, 0.75, -0.5, 0.45);
  shape.bezierCurveTo(-0.5, 0.1, 0.0, -0.1, 0, -0.5);

  const heart = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2,
    }).center(),
    mat(0xff8fb1, { emissive: 0x5a1030 })
  );
  heart.castShadow = true;

  const g = new THREE.Group();
  g.add(heart);

  // Cruzinha branca, para não confundir com o coração normal.
  const barMat = mat(0xfff6fb);
  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.1), barMat);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.1), barMat);
  bar1.position.z = 0.16;
  bar2.position.z = 0.16;
  g.add(bar1, bar2);
  return g;
}

// Bomba Arco-Íris: uma bola listrada de arco-íris com pavio aceso. As
// listras são fatias de esfera (uma por cor), e não textura — o jogo inteiro
// é feito assim.
function bombModel() {
  const g = new THREE.Group();
  const R = 0.46;
  const fatias = ARCO_IRIS.length;

  for (let i = 0; i < fatias; i++) {
    const faixa = new THREE.Mesh(
      new THREE.SphereGeometry(R, 16, 3, 0, Math.PI * 2, (i / fatias) * Math.PI, Math.PI / fatias),
      mat(ARCO_IRIS[i], { emissive: new THREE.Color(ARCO_IRIS[i]).multiplyScalar(0.14) })
    );
    faixa.castShadow = true;
    g.add(faixa);
  }

  // Pavio, inclinado, com a fagulha na ponta.
  const pavio = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.3, 6), mat(0x7a5c3a));
  pavio.position.set(0.1, R + 0.12, 0);
  pavio.rotation.z = -0.5;
  g.add(pavio);

  const fagulha = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.11, 0),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
  );
  fagulha.position.set(0.21, R + 0.26, 0);
  g.add(fagulha);
  // Pequeno de propósito: maior, o brilho cobria as listras do topo.
  g.add(createGlow(0xffd166, 0.2, 0.45).translateX(0.21).translateY(R + 0.26));

  return g;
}

const MODELS = {
  shield: shieldModel, magnet: magnetModel, boost: boostModel, feather: featherModel,
  life: lifeModel, bomb: bombModel,
};

// A onda de arco-íris que a bomba solta: uma cortina de faixas coloridas que
// varre a pista para a frente.
//
// Nada de mistura aditiva aqui. A primeira versão tinha um halo aditivo por
// trás e, contra o céu claro do jogo, tudo somava até o branco: virava um
// domo leitoso e as cores sumiam. Faixas opacas, com uma borda branca na
// frente, leem como arco-íris a qualquer distância.
export function createRainbowWave() {
  const g = new THREE.Group();
  const LARGURA = 13;
  const ALTURA = 0.62;

  ARCO_IRIS.forEach((cor, i) => {
    const faixa = new THREE.Mesh(
      new THREE.BoxGeometry(LARGURA, ALTURA, 0.22),
      new THREE.MeshBasicMaterial({
        color: cor, transparent: true, opacity: 0.78, depthWrite: false, fog: false,
      })
    );
    faixa.position.y = 0.3 + i * (ALTURA * 1.02);
    g.add(faixa);
  });

  // Borda branca na frente da cortina: é o que dá a impressão de que ela
  // está indo, e não parada.
  const crista = new THREE.Mesh(
    new THREE.BoxGeometry(LARGURA + 0.5, ARCO_IRIS.length * ALTURA * 1.02 + 0.5, 0.1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, fog: false,
    })
  );
  crista.position.set(0, 0.3 + (ARCO_IRIS.length - 1) * ALTURA * 0.51, -0.22);
  g.add(crista);

  g.renderOrder = 2;
  g.traverse((o) => { if (o.material) o.material.userData = { base: o.material.opacity }; });
  return g;
}

export function createPowerup(id) {
  const power = POWERUPS[id];
  const group = new THREE.Group();
  const glow = createGlow(power.color, 0.8, 0.3);
  group.add(MODELS[id](), halo(power.color), glow);
  group.scale.setScalar(1.02);
  group.userData = { kind: 'powerup', power: id, glow };
  return group;
}
