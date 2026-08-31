// Corações (item principal) e estrelas (bônus), desenhados com curvas 2D
// e extrudados em 3D — nada de arquivos externos.
import * as THREE from 'three';
import { COLORS } from '../game/config.js';

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.0, -0.1, 0.5, 0.1, 0.5, 0.45);
  s.bezierCurveTo(0.5, 0.75, 0.2, 0.85, 0, 0.55);
  s.bezierCurveTo(-0.2, 0.85, -0.5, 0.75, -0.5, 0.45);
  s.bezierCurveTo(-0.5, 0.1, 0.0, -0.1, 0, -0.5);
  return s;
}

function starShape(points = 5, outer = 0.55, inner = 0.24) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

const extrude = { depth: 0.22, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.06, bevelSegments: 2 };

// Brilho: uma bolinha de luz somada por cima, que faz o item se destacar
// no cenário mesmo de longe. Volta em `userData.glow` para pulsar no laço.
const glowGeo = new THREE.SphereGeometry(1, 10, 8);

export function createGlow(color, size = 0.6, opacity = 0.26) {
  const mesh = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  mesh.scale.setScalar(size);
  mesh.renderOrder = 1;
  return mesh;
}

// Junta a peça do item com o brilho num grupo só.
function shine(mesh, color, size, kind) {
  const group = new THREE.Group();
  const halo = createGlow(color, size);
  group.add(mesh, halo);
  group.userData = { kind, glow: halo };
  return group;
}

// Exportada porque a animação dos 50 corações (src/models/keyReward.js)
// reaproveita a mesma forma — são cinquenta malhas de uma vez, e criar
// geometria para cada uma seria desperdício.
export const heartGeo = new THREE.ExtrudeGeometry(heartShape(), extrude).center();
const starGeo = new THREE.ExtrudeGeometry(starShape(), extrude).center();

const heartMat = new THREE.MeshLambertMaterial({ color: COLORS.heart, emissive: 0x5a0f2a });
const starMat = new THREE.MeshLambertMaterial({ color: COLORS.star, emissive: 0x6b4b00 });

export function createHeart() {
  const heart = new THREE.Mesh(heartGeo, heartMat);
  heart.scale.setScalar(0.85);
  heart.castShadow = true;
  return shine(heart, COLORS.heart, 0.62, 'heart');
}

// Chave mágica: o objetivo do modo Fases.
const keyBowGeo = new THREE.TorusGeometry(0.26, 0.09, 6, 14);
const keyShaftGeo = new THREE.BoxGeometry(0.11, 0.62, 0.11);
const keyToothGeo = new THREE.BoxGeometry(0.2, 0.11, 0.11);
const keyGemGeo = new THREE.OctahedronGeometry(0.12, 0);

const keyMat = new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0x6b4b00, flatShading: true });
const keyGemMat = new THREE.MeshLambertMaterial({ color: 0x9be7ff, emissive: 0x14506b, flatShading: true });

export function createKey() {
  const key = new THREE.Group();

  const bow = new THREE.Mesh(keyBowGeo, keyMat);
  bow.position.y = 0.42;
  key.add(bow);

  const gem = new THREE.Mesh(keyGemGeo, keyGemMat);
  gem.position.y = 0.42;
  key.add(gem);

  const shaft = new THREE.Mesh(keyShaftGeo, keyMat);
  shaft.position.y = -0.05;
  key.add(shaft);

  for (let i = 0; i < 2; i++) {
    const tooth = new THREE.Mesh(keyToothGeo, keyMat);
    tooth.position.set(0.14, -0.16 - i * 0.2, 0);
    key.add(tooth);
  }

  key.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  key.scale.setScalar(0.95);

  const halo = createGlow(0xffd166, 0.7, 0.3);
  key.add(halo);
  key.userData = { kind: 'key', glow: halo };
  return key;
}

export function createStar() {
  const star = new THREE.Mesh(starGeo, starMat);
  star.scale.setScalar(0.9);
  star.castShadow = true;
  return shine(star, COLORS.star, 0.68, 'star');
}
