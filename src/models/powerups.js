// Power-ups que aparecem de vez em quando na pista.
//
// Cada um traz o próprio modelo 3D (formas simples, como o resto do jogo) e
// os números do efeito. O jogo usa `POWERUPS` para saber quanto tempo dura
// cada um e o que mostrar no HUD.
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
  life: {
    id: 'life',
    name: 'Vida extra',
    emoji: '💖',
    color: 0xff8fb1,
    duration: 0,          // efeito na hora, não dura
    message: 'Mais uma vida!',
  },
};

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

const MODELS = { shield: shieldModel, magnet: magnetModel, boost: boostModel, life: lifeModel };

export function createPowerup(id) {
  const power = POWERUPS[id];
  const group = new THREE.Group();
  const glow = createGlow(power.color, 0.8, 0.3);
  group.add(MODELS[id](), halo(power.color), glow);
  group.scale.setScalar(1.02);
  group.userData = { kind: 'powerup', power: id, glow };
  return group;
}
