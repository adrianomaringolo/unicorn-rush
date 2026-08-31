// Modelo do unicórnio: construído inteiramente com formas simples (low poly),
// sem arquivos externos. Retorna um grupo com as partes nomeadas para animar.
//
// Hierarquia:
//   unicorn (raiz, fica no chão)
//     ├─ torso  → corpo, pescoço, cabeça, crina, rabo e asas (galopa junto)
//     └─ 4 pivôs de perna (giram no ombro/quadril)
import * as THREE from 'three';
import { CHARACTERS } from './characters.js';

const mat = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

// ---------------------------------------------------------------------------
// Crina e rabo
//
// Cada mecha é uma corrente de elos: o elo seguinte nasce na ponta do anterior
// e afina um pouquinho. Girando cada elo alguns graus, a mecha vira uma curva
// contínua de cabelo — nada de bolinhas soltas.
// ---------------------------------------------------------------------------
function makeLock(color, { length = 0.9, width = 0.14, segments = 5, flatten = 0.45, fiery = false } = {}) {
  const root = new THREE.Group();
  const joints = [];
  const segLength = length / segments;
  let parent = root;

  for (let i = 0; i < segments; i++) {
    const top = width * (1 - (i / segments) * 0.8);
    const bottom = width * (1 - ((i + 1) / segments) * 0.8);

    const joint = new THREE.Group();
    if (i > 0) joint.position.y = -segLength;

    const material = fiery
      ? mat(color, { emissive: color, emissiveIntensity: 0.9 })
      : mat(color);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(top, bottom, segLength * 1.06, 6),
      material
    );
    mesh.position.y = -segLength / 2;
    mesh.scale.x = flatten;          // fina de lado: mecha de cabelo, não tubo
    mesh.castShadow = true;

    joint.add(mesh);
    parent.add(joint);
    parent = joint;
    joints.push(joint);
  }

  // Fogo: uma línguinha clara na ponta da mecha.
  if (fiery) {
    const lingua = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.34, segLength * 1.5, 5),
      mat(0xfff3c4, { emissive: 0xffd166, emissiveIntensity: 1 })
    );
    lingua.position.y = -segLength * 0.9;
    parent.add(lingua);
  }

  root.userData.joints = joints;
  root.userData.phase = 0;
  root.userData.fiery = fiery;
  return root;
}

// Crina: fileira de mechas finas ao longo da crista do pescoço, caindo dos
// dois lados — curtinhas na nuca, compridas no meio do pescoço.
function makeMane(colors, fiery = false) {
  const mane = new THREE.Group();
  const locks = [];
  const rows = 4;

  for (let row = 0; row < rows; row++) {
    const u = row / (rows - 1);
    for (const side of [-1, 1]) {
      // Mechas largas e achatadas: juntas elas formam um lençol de cabelo,
      // em vez de fios soltos parecendo macarrão.
      const lock = makeLock(colors[row % colors.length], {
        length: 0.45 + Math.sin(u * Math.PI * 0.9) * 0.5,
        width: 0.26,
        segments: 4,
        flatten: fiery ? 0.55 : 0.28,
        fiery,
      });
      // Da nuca (u=0) até a cernelha, acompanhando a curva do pescoço.
      lock.position.set(side * 0.05, 1.98 - u * 0.48, -0.72 + u * 0.6);
      lock.rotation.z = side * 0.34;    // a mecha cai rente à lateral do pescoço
      lock.userData.phase = row * 0.5 + (side > 0 ? 0.28 : 0);
      mane.add(lock);
      locks.push(lock);
    }
  }

  mane.userData.locks = locks;
  return mane;
}

// Rabo: um punhado de mechas saindo da garupa.
function makeTail(colors, fiery = false) {
  const tail = new THREE.Group();
  const locks = [];
  const count = 6;

  for (let i = 0; i < count; i++) {
    const offset = i - (count - 1) / 2;
    const lock = makeLock(colors[i % colors.length], {
      length: 0.85 - Math.abs(offset) * 0.06,
      width: 0.18,
      segments: 4,
      flatten: fiery ? 0.7 : 0.55,
      fiery,
    });
    // Bem juntinhas: de trás o rabo tem que parecer um tufo, não fitas soltas.
    lock.position.set(offset * 0.06, 0, -Math.abs(offset) * 0.05);
    lock.rotation.z = offset * 0.1;
    lock.userData.phase = i * 0.55;
    tail.add(lock);
    locks.push(lock);
  }

  tail.userData.locks = locks;
  return tail;
}

// ---------------------------------------------------------------------------
// Asas
//
// As penas nascem espalhadas ao longo do braço da asa (e não todas do mesmo
// ponto): as curtas ficam junto ao corpo e as compridas na ponta, varrendo
// para trás — é isso que dá o formato de asa de pássaro.
// ---------------------------------------------------------------------------
function makeFeather(length, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(length * 0.35, width, length * 0.75, width * 0.85, length, width * 0.12);
  shape.bezierCurveTo(length * 0.72, -width * 0.5, length * 0.35, -width * 0.75, 0, 0);
  return shape;
}

// Raio de sol: comprido e pontudo.
function makeRay(length, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length * 0.55, width);
  shape.lineTo(length, width * 0.06);
  shape.lineTo(length * 0.5, -width * 0.75);
  shape.closePath();
  return shape;
}

// Pétala de véu: arredondada e macia, para asas de noite.
function makeVeil(length, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(length * 0.2, width * 1.5, length * 0.8, width * 1.3, length, 0);
  shape.bezierCurveTo(length * 0.8, -width * 1.3, length * 0.2, -width * 1.5, 0, 0);
  return shape;
}

// Tamanho normal da asa. O ⚡ multiplica isto (ver Game.applyRushWings), por
// isso ele é exportado em vez de ficar solto no meio do código.
export const WING_SCALE = 0.95;

const WING_STYLES = {
  feather: {
    count: 6, shape: makeFeather, arm: 0.45,
    near: 0.6, far: 1.15, width: 0.25, taper: 0.04,
    sweepNear: 0.15, sweepFar: 1.15, coverts: 3,
  },
  ray: {
    count: 6, shape: makeRay, arm: 0.44,
    near: 0.6, far: 1.05, width: 0.34, taper: 0.05,
    sweepNear: 0.15, sweepFar: 1.1, coverts: 3,
  },
  veil: {
    count: 5, shape: makeVeil, arm: 0.4,
    near: 0.65, far: 1.15, width: 0.28, taper: 0.03,
    sweepNear: 0.12, sweepFar: 1.05, coverts: 2,
  },
};

function extrudeShape(shape) {
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.05, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.03, bevelSegments: 1,
  });
}

function makeWing(side, wing) {
  const style = WING_STYLES[wing.style] || WING_STYLES.feather;
  const pivot = new THREE.Group();

  // As penas são desenhadas em pé (plano XY) e o leque inteiro é deitado
  // depois, para a asa abrir na horizontal. Nesse plano deitado, +Y local
  // aponta para a frente do unicórnio — por isso os ângulos são negativos:
  // as penas varrem para trás.
  const fan = new THREE.Group();
  fan.rotation.x = -Math.PI / 2;
  fan.scale.x = side;                 // espelha a asa do outro lado
  pivot.add(fan);

  const feathers = [];

  // Penas grandes, espalhadas do ombro até a ponta da asa.
  for (let i = 0; i < style.count; i++) {
    const t = style.count > 1 ? i / (style.count - 1) : 0;
    const geo = extrudeShape(style.shape(
      style.near + (style.far - style.near) * t,
      style.width - t * style.taper
    ));
    // Uma pena sim, outra não sai um tom mais escura, para o leque não virar
    // uma mancha só quando visto de longe.
    const tone = new THREE.Color(wing.colors[i % wing.colors.length]);
    if (i % 2 === 1) tone.multiplyScalar(0.9);
    const feather = new THREE.Mesh(geo, mat(tone));
    feather.castShadow = true;
    feather.position.set(0.12 + t * style.arm, 0, t * 0.07);
    feather.rotation.z = -(style.sweepNear + t * (style.sweepFar - style.sweepNear));
    feather.userData.t = t;
    feather.userData.baseRotation = feather.rotation.z;
    fan.add(feather);
    feathers.push(feather);
  }

  // Coberteiras: penas curtinhas por cima da raiz, para a asa não ficar chapada.
  for (let i = 0; i < style.coverts; i++) {
    const t = i / Math.max(1, style.coverts - 1);
    const geo = extrudeShape(style.shape(0.3 + t * 0.16, 0.13));
    const covert = new THREE.Mesh(geo, mat(wing.colors[(i + 1) % wing.colors.length]));
    covert.position.set(0.1 + t * style.arm * 0.5, 0, 0.1);
    covert.rotation.z = -(0.1 + t * 0.35);
    covert.userData.t = t * 0.4;
    covert.userData.baseRotation = covert.rotation.z;
    covert.castShadow = true;
    fan.add(covert);
    feathers.push(covert);
  }

  // Base da asa: uma almofadinha alongada que cobre a raiz das penas
  // (é ela que faz a borda da frente, sem virar um bastão saliente).
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(wing.colors[0]));
  shoulder.scale.set(1.15, 0.6, 1.3);
  shoulder.position.set(side * 0.08, 0, 0.02);
  shoulder.castShadow = true;
  pivot.add(shoulder);

  pivot.userData.feathers = feathers;
  pivot.scale.setScalar(WING_SCALE);   // asa proporcional ao corpo, não gigante
  return pivot;
}

// ---------------------------------------------------------------------------
// Marca da anca — o desenho que identifica cada personagem.
// ---------------------------------------------------------------------------
function markShape(kind) {
  const shape = new THREE.Shape();

  if (kind === 'heart') {
    shape.moveTo(0, -0.5);
    shape.bezierCurveTo(0, -0.1, 0.5, 0.1, 0.5, 0.45);
    shape.bezierCurveTo(0.5, 0.75, 0.2, 0.85, 0, 0.55);
    shape.bezierCurveTo(-0.2, 0.85, -0.5, 0.75, -0.5, 0.45);
    shape.bezierCurveTo(-0.5, 0.1, 0, -0.1, 0, -0.5);
    return shape;
  }

  if (kind === 'moon') {
    shape.absarc(0, 0, 0.5, Math.PI * 0.42, Math.PI * 1.58, false);
    shape.absarc(0.34, 0, 0.44, Math.PI * 1.3, Math.PI * 0.7, true);
    return shape;
  }

  if (kind === 'flame') {
    shape.moveTo(0, 0.62);
    shape.bezierCurveTo(0.34, 0.2, 0.42, -0.1, 0.24, -0.42);
    shape.bezierCurveTo(0.2, -0.16, 0.06, -0.12, 0.02, -0.3);
    shape.bezierCurveTo(-0.12, -0.12, -0.4, -0.12, -0.3, -0.34);
    shape.bezierCurveTo(-0.46, 0.02, -0.3, 0.32, 0, 0.62);
    return shape;
  }

  if (kind === 'rainbow') {
    shape.absarc(0, -0.2, 0.55, 0, Math.PI, false);
    shape.absarc(0, -0.2, 0.28, Math.PI, 0, true);
    return shape;
  }

  if (kind === 'leaf') {
    // Folha: duas curvas que se encontram na ponta, com o bico virado.
    shape.moveTo(0, 0.6);
    shape.bezierCurveTo(0.42, 0.28, 0.46, -0.24, 0.06, -0.58);
    shape.bezierCurveTo(-0.34, -0.24, -0.42, 0.28, 0, 0.6);
    return shape;
  }

  if (kind === 'wave') {
    // Onda: a crista quebrando, desenhada de um lado e fechada por baixo.
    shape.moveTo(-0.58, -0.18);
    shape.bezierCurveTo(-0.4, 0.34, 0.04, 0.5, 0.24, 0.16);
    shape.bezierCurveTo(0.36, -0.06, 0.2, -0.2, 0.06, -0.06);
    shape.bezierCurveTo(0.18, -0.3, 0.5, -0.24, 0.56, 0.06);
    shape.bezierCurveTo(0.6, 0.5, 0.06, 0.78, -0.28, 0.5);
    shape.bezierCurveTo(-0.52, 0.3, -0.6, 0.06, -0.58, -0.18);
    return shape;
  }

  if (kind === 'snowflake') {
    // Floco: seis braços com uma farpa em cada, desenhados em volta do centro.
    const bracos = 6;
    for (let i = 0; i < bracos; i++) {
      const a = (i / bracos) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      const px = Math.cos(a + Math.PI / 2), py = Math.sin(a + Math.PI / 2);
      const g = 0.075;                       // metade da grossura do braço
      if (i === 0) shape.moveTo(px * g, py * g);
      else shape.lineTo(px * g, py * g);
      shape.lineTo(dx * 0.34 + px * g, dy * 0.34 + py * g);
      shape.lineTo(dx * 0.42 + px * 0.16, dy * 0.42 + py * 0.16);   // farpa
      shape.lineTo(dx * 0.58, dy * 0.58);                            // ponta
      shape.lineTo(dx * 0.42 - px * 0.16, dy * 0.42 - py * 0.16);
      shape.lineTo(dx * 0.34 - px * g, dy * 0.34 - py * g);
      shape.lineTo(-px * g, -py * g);
    }
    shape.closePath();
    return shape;
  }

  if (kind === 'comet') {
    // Cometa: a cabeça redonda e a cauda afinando para trás.
    shape.moveTo(0.55, 0.28);
    shape.bezierCurveTo(0.1, 0.5, -0.3, 0.34, -0.42, 0.1);
    shape.bezierCurveTo(-0.6, -0.24, -0.2, -0.5, 0.12, -0.34);
    shape.bezierCurveTo(0.02, -0.12, 0.2, 0.02, 0.55, 0.28);
    return shape;
  }

  if (kind === 'shell') {
    // Concha: o leque com as ranhuras sugeridas pelo recorte da borda.
    shape.moveTo(0, -0.5);
    for (let i = 0; i <= 7; i++) {
      const a = Math.PI * (0.08 + (i / 7) * 0.84);
      const r = i % 2 === 0 ? 0.58 : 0.5;
      shape.lineTo(Math.cos(a) * r, Math.sin(a) * r - 0.12);
    }
    shape.closePath();
    return shape;
  }

  if (kind === 'bubble') {
    // Bolha de chiclete: a bolha grande com um brilho na quina.
    shape.absarc(-0.06, -0.04, 0.5, 0, Math.PI * 2, false);
    const brilho = new THREE.Path();
    brilho.absarc(0.18, 0.24, 0.13, 0, Math.PI * 2, true);
    shape.holes.push(brilho);
    return shape;
  }

  // 'sun' e 'star' são estrelas com número de pontas diferente.
  const points = kind === 'sun' ? 8 : 5;
  const outer = 0.55;
  const inner = kind === 'sun' ? 0.33 : 0.24;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function makeMark(mark) {
  const geo = new THREE.ExtrudeGeometry(markShape(mark.shape), {
    depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1,
  });
  geo.center();
  const mesh = new THREE.Mesh(geo, mat(mark.color));
  mesh.scale.setScalar(0.42);
  return mesh;
}

// ---------------------------------------------------------------------------

export function createUnicorn(character = CHARACTERS.uni) {
  const unicorn = new THREE.Group();

  // Proporções: 1 é o unicórnio adulto. Um bebê tem cabeça e olhos maiores e
  // perninhas curtas — e o corpo desce junto, para os cascos ficarem no chão.
  const shape = { head: 1, legs: 1, eye: 1, ...(character.proportions || {}) };
  const legDrop = 0.95 * (1 - shape.legs);

  // Tudo que galopa junto fica no torso; as pernas ficam na raiz.
  const torso = new THREE.Group();
  torso.position.y = -legDrop;
  torso.userData.baseY = -legDrop;
  unicorn.add(torso);

  const bodyMat = mat(character.body);
  const hoofMat = mat(character.hoof);

  // Tronco
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.75, 3, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.0;
  body.castShadow = true;
  torso.add(body);

  // Peito um pouco mais largo
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), bodyMat);
  chest.position.set(0, 1.02, -0.35);
  chest.castShadow = true;
  torso.add(chest);

  // Garupa mais larguinha (ajuda a reconhecer o bichinho de costas)
  const rump = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), bodyMat);
  rump.position.set(0, 1.0, 0.38);
  rump.scale.set(1.08, 1, 0.85);
  rump.castShadow = true;
  torso.add(rump);

  // Pescoço
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.75, 8), bodyMat);
  neck.position.set(0, 1.46, -0.58);
  neck.rotation.x = -0.5;
  neck.castShadow = true;
  torso.add(neck);

  // Cabeça (com focinho e orelhas)
  const head = new THREE.Group();
  head.position.set(0, 1.82, -0.85);
  head.scale.setScalar(shape.head);
  torso.add(head);

  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.33, 1), bodyMat);
  skull.castShadow = true;
  head.add(skull);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.25, 0.34), bodyMat);
  muzzle.position.set(0, -0.09, -0.3);
  muzzle.castShadow = true;
  head.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(character.muzzle));
  nose.position.set(0, -0.09, -0.47);
  head.add(nose);

  const ears = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * shape.eye, 8, 8), mat(0x30203a));
    eye.position.set(side * 0.22, 0.06, -0.2);
    head.add(eye);

    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 6), bodyMat);
    ear.position.set(side * 0.18, 0.34, 0.02);
    ear.rotation.z = side * 0.25;
    ear.userData.side = side;
    ear.castShadow = true;
    head.add(ear);
    ears.push(ear);
  }

  // Chifre (cada personagem tem o seu: mais curto e grosso, mais fino e longo…)
  const horn = new THREE.Mesh(
    new THREE.ConeGeometry(character.horn.radius, character.horn.length, 7),
    mat(character.horn.color)
  );
  horn.position.set(0, 0.52, -0.16);
  horn.rotation.x = -0.35;
  horn.castShadow = true;
  head.add(horn);

  // Franja caindo na testa
  const forelock = new THREE.Group();
  forelock.position.set(0, 0.3, -0.14);
  forelock.rotation.x = 0.55;
  const forelockLocks = [];
  for (let i = 0; i < 3; i++) {
    const lock = makeLock(character.hair[i % character.hair.length], {
      length: 0.34, width: 0.13, segments: 2, fiery: character.fiery,
    });
    lock.position.set((i - 1) * 0.12, 0, 0);
    lock.rotation.z = (i - 1) * 0.2;
    lock.userData.phase = i * 0.7;
    forelock.add(lock);
    forelockLocks.push(lock);
  }
  forelock.userData.locks = forelockLocks;
  head.add(forelock);

  // Crina e rabo
  const mane = makeMane(character.hair, character.fiery);
  torso.add(mane);

  const tail = makeTail(character.hair, character.fiery);
  tail.position.set(0, 1.52, 0.66);
  torso.add(tail);

  // Asinhas
  const wings = new THREE.Group();
  wings.position.set(0, 1.5, 0.12);
  const wingL = makeWing(1, character.wing);
  wingL.position.x = 0.28;
  wingL.rotation.set(0, -0.12, 0.22);
  const wingR = makeWing(-1, character.wing);
  wingR.position.x = -0.28;
  wingR.rotation.set(0, 0.12, -0.22);
  wings.add(wingL, wingR);
  torso.add(wings);

  // Marca da anca, dos dois lados
  if (character.mark) {
    for (const side of [-1, 1]) {
      const mark = makeMark(character.mark);
      mark.position.set(side * 0.46, 1.03, 0.34);
      mark.rotation.y = side * Math.PI / 2;
      torso.add(mark);
    }
  }

  // Pernas: cada uma num pivô no ombro/quadril para girar bonitinho
  const legs = [];
  const legPositions = [
    [0.26, -0.5], [-0.26, -0.5],   // dianteiras
    [0.26, 0.45], [-0.26, 0.45],   // traseiras
  ];
  for (const [x, z] of legPositions) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.95 - legDrop, z);
    pivot.scale.y = shape.legs;
    pivot.userData.baseY = 0.95 - legDrop;

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.8, 6), bodyMat);
    leg.position.y = -0.4;
    leg.castShadow = true;
    pivot.add(leg);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 6), hoofMat);
    hoof.position.y = -0.86;
    hoof.castShadow = true;
    pivot.add(hoof);

    unicorn.add(pivot);
    legs.push(pivot);
  }

  unicorn.userData = { character, torso, head, ears, mane, forelock, tail, wings, legs };
  unicorn.scale.setScalar(character.scale || 1);
  return unicorn;
}

// Faz uma mecha ondular. `sweep` é o quanto ela é jogada para trás
// (negativo joga para trás, positivo para a frente).
function animateLock(lock, time, { sweep, wave, sway, speed }) {
  const { joints, phase, fiery } = lock.userData;
  joints.forEach((joint, i) => {
    const t = (i + 1) / joints.length;
    joint.rotation.x = sweep + Math.sin(time * speed - i * 0.8 + phase) * wave * (0.35 + t);
    joint.rotation.z = Math.sin(time * speed * 0.6 + i * 0.5 + phase) * sway * (0.3 + t);

    // Labareda: além de ondular, a chama treme e estica.
    if (fiery) {
      const tremor = 1 + Math.sin(time * 16 + i * 1.7 + phase) * 0.12 * t;
      joint.scale.set(tremor, 1 + Math.sin(time * 11 + i + phase) * 0.14 * t, tremor);
      joint.rotation.x += Math.sin(time * 13 + i * 2.1) * 0.06;
    }
  });
}

// Animação de galope: pernas em diagonal, torso subindo e descendo,
// cabeça balançando, crina e rabo esvoaçando, asas batendo.
export function animateUnicorn(unicorn, time, speed, grounded) {
  const { torso, head, ears, mane, forelock, tail, wings, legs } = unicorn.userData;
  const t = time * speed;
  const gallop = Math.sin(t);

  // Diagonais opostas, como num galope de verdade.
  const phases = [0, Math.PI, Math.PI, 0];
  legs.forEach((leg, i) => {
    if (grounded) {
      const swing = Math.sin(t + phases[i]);
      leg.rotation.x = swing * 0.85;
      leg.position.y = leg.userData.baseY + Math.max(0, swing) * 0.06;
    } else {
      // No ar as pernas ficam esticadas para trás, como se estivesse voando.
      leg.rotation.x = -0.55 + Math.sin(time * 6 + phases[i]) * 0.18;
      leg.position.y = leg.userData.baseY;
    }
  });

  // Torso: sobe, desce, inclina e balança de leve.
  const bounce = grounded ? Math.abs(gallop) * 0.16 : 0.12 + Math.sin(time * 4) * 0.05;
  torso.position.y = torso.userData.baseY + bounce;
  torso.rotation.x = grounded ? Math.sin(t * 2 + 0.7) * 0.07 : -0.12;
  torso.rotation.z = Math.sin(t * 0.5) * 0.05;

  // Cabeça: acompanha o galope e olha um pouquinho para os lados.
  head.rotation.x = 0.1 - bounce * 0.9 + Math.sin(t + 0.5) * 0.12;
  head.rotation.y = Math.sin(time * 1.3) * 0.13;
  head.rotation.z = Math.sin(time * 0.9) * 0.05;

  ears.forEach((ear) => {
    ear.rotation.z = ear.userData.side * (0.25 + Math.sin(time * 7 + ear.userData.side) * 0.12);
  });

  // Vento: quanto mais rápido, mais a crina e o rabo voam para trás.
  const wind = THREE.MathUtils.clamp((speed - 1.4) / 2.2, 0, 1);

  for (const lock of mane.userData.locks) {
    animateLock(lock, time, {
      sweep: -0.12 - wind * 0.3,
      wave: 0.09, sway: 0.07, speed: 6,
    });
  }
  for (const lock of tail.userData.locks) {
    animateLock(lock, time, {
      sweep: -0.06 - wind * 0.09,
      wave: 0.05, sway: 0.03, speed: 5,
    });
  }
  for (const lock of forelock.userData.locks) {
    animateLock(lock, time, {
      sweep: 0.1 - wind * 0.35,
      wave: 0.12, sway: 0.1, speed: 7,
    });
  }
  tail.rotation.x = -0.18 - wind * 0.3 + Math.sin(t + 1) * 0.1;
  forelock.rotation.x = 0.55 - wind * 0.45;

  const flap = grounded ? 0.22 : 0.6;
  const beat = Math.sin(time * (grounded ? 7 : 11)) * flap;
  wings.children.forEach((wing, i) => {
    const side = i === 0 ? 1 : -1;
    wing.rotation.z = side * 0.22 + beat * side;
    wing.rotation.x = beat * 0.25;
    // As penas abrem e fecham um pouquinho junto com a batida.
    for (const feather of wing.userData.feathers) {
      feather.rotation.z = feather.userData.baseRotation
        - beat * 0.18 * feather.userData.t
        + Math.sin(time * 6 - feather.userData.t * 2) * 0.04;
    }
  });
}
