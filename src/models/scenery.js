// Cenário: chão, enfeites das laterais, obstáculos e o fundo (arco-íris,
// nuvens, lua, estrelas e montanhas). Tudo gerado por código, e tudo
// colorido de acordo com a pista escolhida (ver src/game/tracks.js).
import * as THREE from 'three';

const mat = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const PASTEL = [0xffb3d1, 0xb8f2c9, 0xbfd7ff, 0xffe6a7, 0xd9c2ff];
const CANDY = [0xff8fc0, 0xffd166, 0x9ce0ff, 0xffb3e6, 0xc4f0a8];

// --- Enfeites das laterais --------------------------------------------------

function tree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 6), mat(0xc98f6b));
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);

  const color = pick(PASTEL);
  for (let i = 0; i < 3; i++) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 - i * 0.12, 0), mat(color));
    blob.position.set((Math.random() - 0.5) * 0.5, 1.9 + i * 0.55, (Math.random() - 0.5) * 0.5);
    blob.castShadow = true;
    g.add(blob);
  }
  return g;
}

function pineTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.9, 6), mat(0x6b5a8f));
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  g.add(trunk);

  const color = pick([0x3f6f8f, 0x4a7f7a, 0x5a6fa8]);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85 - i * 0.22, 1.1, 6), mat(color));
    cone.position.y = 1.1 + i * 0.62;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

function mushroom() {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.6, 6), mat(0xfff6e8));
  stem.position.y = 0.3;
  stem.castShadow = true;
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(pick([0xff6b8a, 0xff9f68, 0xa78bfa]))
  );
  cap.position.y = 0.6;
  cap.castShadow = true;
  g.add(stem, cap);
  return g;
}

// Cogumelo da noite: o chapéu acende de leve.
function glowMushroom() {
  const g = new THREE.Group();
  const color = pick([0x8ce9ff, 0xc7a6ff, 0x9affd6]);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.7, 6), mat(0xe8e4ff));
  stem.position.y = 0.35;
  stem.castShadow = true;
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(color, { emissive: color, emissiveIntensity: 0.55 })
  );
  cap.position.y = 0.7;
  cap.castShadow = true;
  g.add(stem, cap);
  return g;
}

function crystal() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.4, 5),
    mat(pick([0x9be7ff, 0xf0a6ff, 0xa6ffcb]), { transparent: true, opacity: 0.85 })
  );
  c.position.y = 0.7;
  c.rotation.z = (Math.random() - 0.5) * 0.3;
  c.castShadow = true;
  g.add(c);
  return g;
}

function lollipop() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.7, 6), mat(0xfff8e8));
  stick.position.y = 0.85;
  stick.castShadow = true;
  g.add(stick);

  const candy = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 12), mat(pick(CANDY)));
  candy.rotation.x = Math.PI / 2;
  candy.position.y = 1.9;
  candy.castShadow = true;
  g.add(candy);

  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 6, 14), mat(0xfff8e8));
  swirl.position.y = 1.9;
  swirl.position.z = 0.1;
  g.add(swirl);
  return g;
}

function cupcake() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.34, 0.6, 10), mat(0xffd9a8));
  base.position.y = 0.3;
  base.castShadow = true;
  g.add(base);

  const frostingColor = pick([0xfff0f6, 0xffb3d1, 0xc9f0ff]);
  for (let i = 0; i < 3; i++) {
    const swirl = new THREE.Mesh(new THREE.SphereGeometry(0.42 - i * 0.09, 8, 6), mat(frostingColor));
    swirl.position.y = 0.72 + i * 0.3;
    swirl.castShadow = true;
    g.add(swirl);
  }

  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mat(0xff4d6d));
  cherry.position.y = 1.45;
  g.add(cherry);
  return g;
}

function candyCane() {
  const g = new THREE.Group();
  const color = pick([0xff7b9d, 0xff9f68, 0xa78bfa]);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8), mat(0xfff8f0));
  stick.position.y = 0.75;
  stick.castShadow = true;
  g.add(stick);

  // Listras: anéis coloridos ao longo da bengala.
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.16, 8), mat(color));
    stripe.position.y = 0.25 + i * 0.34;
    stripe.rotation.z = 0.25;
    g.add(stripe);
  }

  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.12, 6, 12, Math.PI), mat(0xfff8f0));
  hook.position.y = 1.5;
  hook.rotation.y = Math.PI / 2;
  hook.castShadow = true;
  g.add(hook);
  return g;
}

// Florzinha do campo: caule, folha, pétalas e miolo.
function flower() {
  const g = new THREE.Group();
  const color = pick([0xff8fb1, 0xffd166, 0xff6b8a, 0xc9a6ff, 0xfff0f6, 0xff9f68]);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.0, 5), mat(0x6bbf7b));
  stem.position.y = 0.5;
  stem.castShadow = true;
  g.add(stem);

  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), mat(0x5aa86a));
  leaf.scale.set(1.6, 0.35, 0.9);
  leaf.position.set(0.16, 0.42, 0);
  leaf.rotation.z = 0.5;
  leaf.castShadow = true;
  g.add(leaf);

  // Pétalas em roda, viradas para cima.
  const head = new THREE.Group();
  head.position.y = 1.02;
  head.rotation.x = 0.42;      // virada para quem corre
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.19, 6, 5), mat(color));
    petal.scale.set(1, 0.42, 1.25);
    const a = (i / petals) * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24);
    petal.rotation.y = -a;
    petal.castShadow = true;
    head.add(petal);
  }
  const middle = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), mat(0xffe066));
  middle.scale.y = 0.7;
  middle.position.y = 0.05;
  head.add(middle);
  g.add(head);

  g.scale.setScalar(0.95 + Math.random() * 0.35);
  return g;
}

// Tufo de florzinhas rentes ao chão, para salpicar o campo.
function flowerPatch() {
  const g = new THREE.Group();
  const color = pick([0xff8fb1, 0xffd166, 0xfff0f6, 0xc9a6ff]);
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.17, 6, 5), mat(color));
    bloom.scale.set(1, 0.4, 1);
    bloom.position.set((Math.random() - 0.5) * 1.2, 0.16, (Math.random() - 0.5) * 1.2);
    bloom.castShadow = true;
    g.add(bloom);

    const middle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0xffe066));
    middle.position.set(bloom.position.x, 0.22, bloom.position.z);
    g.add(middle);
  }
  return g;
}

// Morrinho de nuvem: o "arbusto" da pista do céu.
function cloudHill() {
  const g = new THREE.Group();
  const material = mat(0xffffff);
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + Math.random() * 0.45, 0), material);
    puff.position.set((i - n / 2) * 0.7, 0.35 + Math.random() * 0.35, (Math.random() - 0.5) * 0.6);
    puff.castShadow = true;
    g.add(puff);
  }
  return g;
}

function balloon() {
  const g = new THREE.Group();
  const color = pick([0xff7b9d, 0xffd166, 0x74c0fc, 0xb197fc, 0x8ce99a]);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat(color));
  body.scale.y = 1.25;
  body.position.y = 2.6;
  body.castShadow = true;
  g.add(body);

  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 6), mat(color));
  knot.position.y = 1.95;
  knot.rotation.x = Math.PI;
  g.add(knot);

  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 4), mat(0xfff0d0));
  rope.position.y = 1.35;
  g.add(rope);

  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.34, 6), mat(0xd8a86b));
  basket.position.y = 0.7;
  basket.castShadow = true;
  g.add(basket);
  return g;
}

// Arquinho de arco-íris pequeno, para enfeitar a beira da pista do céu.
function rainbowArch() {
  const g = new THREE.Group();
  const colors = [0xff7b7b, 0xffd166, 0x8ce99a, 0x74c0fc];
  colors.forEach((color, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1.5 - i * 0.28, 0.14, 5, 16, Math.PI),
      mat(color)
    );
    arc.position.y = 0.1;
    g.add(arc);
  });
  return g;
}

const DECORATIONS = {
  tree, pineTree, mushroom, glowMushroom, crystal, flower, flowerPatch,
  lollipop, cupcake, candyCane, cloudHill, balloon, rainbowArch,
};

export function createDecoration(track) {
  const build = DECORATIONS[pick(track.decorations)] || tree;
  const deco = build();
  deco.scale.setScalar(0.75 + Math.random() * 0.6);
  deco.rotation.y = Math.random() * Math.PI;
  return deco;
}

// --- Obstáculos (o unicórnio precisa desviar ou pular) ----------------------

function rock() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 - i * 0.1, 0), mat(0x9aa5c4));
    stone.position.set((Math.random() - 0.5) * 0.7, 0.35 + i * 0.15, (Math.random() - 0.5) * 0.5);
    stone.rotation.set(Math.random(), Math.random(), Math.random());
    stone.castShadow = true;
    g.add(stone);
  }
  return g;
}

function candyBar() {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.9, 8), mat(0xff7bac));
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 0.9;
  bar.castShadow = true;
  g.add(bar);
  for (const side of [-0.85, 0.85]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.95, 6), mat(0xfff1f6));
    post.position.set(side, 0.47, 0);
    post.castShadow = true;
    g.add(post);
  }
  return g;
}

function bush() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat(0x6bbf7b));
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  for (let i = 0; i < 5; i++) {
    const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), mat(0x3f7d4d));
    const a = (i / 5) * Math.PI * 2;
    thorn.position.set(Math.cos(a) * 0.42, 0.85, Math.sin(a) * 0.42);
    thorn.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6);
    g.add(thorn);
  }
  return g;
}

function gumdrop() {
  const g = new THREE.Group();
  const color = pick([0xff5d8f, 0x9be7ff, 0xffd166]);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), mat(color));
  drop.scale.y = 1.25;
  drop.position.y = 0.62;
  drop.castShadow = true;
  g.add(drop);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.18, 10), mat(0xfff8e8));
  base.position.y = 0.09;
  g.add(base);
  return g;
}

function donut() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.26, 8, 16), mat(0xffcf9b));
  ring.position.y = 0.8;
  ring.castShadow = true;
  g.add(ring);
  const icing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.2, 8, 16), mat(pick([0xff7bac, 0x9be7ff, 0xc4f0a8])));
  icing.position.set(0, 0.8, 0.06);
  g.add(icing);
  return g;
}

// Discos de luz no chão embaixo dos obstáculos da noite: de longe já dá para
// ver que tem coisa ali.
function warningRing(color) {
  const ring = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  return ring;
}

// Pedra de luar: clara e acesa, para não sumir no escuro.
function moonStone() {
  const g = new THREE.Group();
  const color = 0xdfe6ff;
  for (let i = 0; i < 3; i++) {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5 - i * 0.11, 0),
      mat(color, { emissive: 0x8fa8ff, emissiveIntensity: 0.7 })
    );
    stone.position.set((Math.random() - 0.5) * 0.7, 0.38 + i * 0.16, (Math.random() - 0.5) * 0.5);
    stone.rotation.set(Math.random(), Math.random(), Math.random());
    stone.castShadow = true;
    g.add(stone);
  }
  g.add(warningRing(0x9fb8ff));
  return g;
}

// Cogumelão brilhante: o chapéu acende forte e ocupa a pista inteira.
function bigGlowMushroom() {
  const g = new THREE.Group();
  const color = pick([0x8ce9ff, 0xffa6f0, 0xa6ffcb]);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 7), mat(0xfff4ff, { emissive: 0x554466 }));
  stem.position.y = 0.45;
  stem.castShadow = true;
  g.add(stem);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(color, { emissive: color, emissiveIntensity: 0.9 })
  );
  cap.position.y = 0.9;
  cap.castShadow = true;
  g.add(cap);

  // Pintinhas claras no chapéu
  for (let i = 0; i < 5; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), mat(0xfffbe8, { emissive: 0x888066 }));
    const a = (i / 5) * Math.PI * 2;
    dot.position.set(Math.cos(a) * 0.42, 1.12, Math.sin(a) * 0.42);
    g.add(dot);
  }

  g.add(warningRing(color));
  return g;
}

function crystalSpike() {
  const g = new THREE.Group();
  const color = pick([0x8ce9ff, 0xc7a6ff]);
  for (let i = 0; i < 3; i++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.28 - i * 0.05, 1.3 - i * 0.25, 5),
      mat(color, { emissive: color, emissiveIntensity: 0.95 })
    );
    spike.position.set((i - 1) * 0.34, (1.1 - i * 0.25) / 2, (Math.random() - 0.5) * 0.3);
    spike.rotation.z = (i - 1) * 0.22;
    spike.castShadow = true;
    g.add(spike);
  }
  g.add(warningRing(color));
  return g;
}

// Nuvem carregada com um raio: dá para pular por cima.
function stormCloud() {
  const g = new THREE.Group();
  const material = mat(0x9aa3c9);
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + Math.random() * 0.2, 0), material);
    puff.position.set((i - 1.5) * 0.45, 0.75 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
    puff.castShadow = true;
    g.add(puff);
  }
  const bolt = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 4), mat(0xffe066, { emissive: 0x66551a }));
  bolt.position.set(0, 0.28, 0.1);
  bolt.rotation.x = Math.PI;
  g.add(bolt);
  return g;
}

function kite() {
  const g = new THREE.Group();
  const color = pick([0xff7b9d, 0x74c0fc, 0xffd166]);

  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), mat(color));
  body.scale.set(0.6, 1, 0.18);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);

  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.04), mat(0xfff0d0));
  cross.position.y = 1.0;
  g.add(cross);

  for (let i = 0; i < 3; i++) {
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.04), mat(0xfff0d0));
    knot.position.set(0, 0.42 - i * 0.16, 0);
    knot.rotation.z = i % 2 ? 0.5 : -0.5;
    g.add(knot);
  }
  return g;
}

function balloonBunch() {
  const g = new THREE.Group();
  const colors = [0xff7b9d, 0xffd166, 0x74c0fc];
  colors.forEach((color, i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), mat(color));
    b.scale.y = 1.2;
    b.position.set((i - 1) * 0.5, 0.95 + (i % 2) * 0.25, (i % 2) * 0.2);
    b.castShadow = true;
    g.add(b);

    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 4), mat(0xfff0d0));
    rope.position.set((i - 1) * 0.5, 0.45, (i % 2) * 0.2);
    g.add(rope);
  });
  return g;
}

const OBSTACLES = {
  rock, candyBar, bush, gumdrop, donut, crystalSpike,
  stormCloud, kite, balloonBunch, moonStone, bigGlowMushroom,
};

export function createObstacle(track) {
  const build = OBSTACLES[pick(track.obstacles)] || rock;
  const obj = build();
  obj.userData.kind = 'obstacle';
  return obj;
}

// --- Fundo ------------------------------------------------------------------

// Vagalume: um pontinho aceso com um halo bem de leve em volta.
export function createFirefly() {
  const g = new THREE.Group();
  const color = pick([0xfff3a8, 0xd6ffa8, 0xfff8d6]);

  const spark = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 6, 5),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  g.add(spark);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 6),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.3, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    })
  );
  g.add(halo);

  g.userData = { spark, halo, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 0.9 };
  return g;
}

export function createCloud(color = 0xffffff) {
  const cloud = new THREE.Group();
  // Nuvem sem sombreado: assim ela fica sempre da cor da pista, em vez de
  // escurecer quando o sol bate por trás.
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 });
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + Math.random() * 0.6, 0), material);
    puff.position.set(i * 1.1 - n * 0.4, Math.random() * 0.4, Math.random() * 0.6);
    cloud.add(puff);
  }
  return cloud;
}

export function createRainbow() {
  const rainbow = new THREE.Group();
  const colors = [0xff7b7b, 0xffb26b, 0xffe66b, 0x8ce99a, 0x74c0fc, 0xb197fc];
  colors.forEach((color, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(26 - i * 1.7, 0.8, 6, 40, Math.PI),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, fog: false })
    );
    rainbow.add(arc);
  });
  return rainbow;
}

// Lua cheia com crateras, para a pista da noite.
export function createMoon() {
  const moon = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.IcosahedronGeometry(7, 2),
    new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })
  );
  moon.add(ball);
  for (let i = 0; i < 6; i++) {
    const crater = new THREE.Mesh(
      new THREE.CircleGeometry(0.6 + Math.random() * 1.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xf0e3bd, fog: false })
    );
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 4.6;
    crater.position.set(Math.cos(a) * r, Math.sin(a) * r, 7.05 - (r * r) / 14);
    moon.add(crater);
  }
  return moon;
}

// Sol grandão com raios, para o fundo da pista do céu.
export function createSun() {
  const sun = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(6, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false })
  );
  sun.add(face);

  const rayMaterial = new THREE.MeshBasicMaterial({ color: 0xffe08a, fog: false });
  for (let i = 0; i < 12; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 3), rayMaterial);
    const a = (i / 12) * Math.PI * 2;
    ray.position.set(Math.cos(a) * 7.4, Math.sin(a) * 7.4, -0.2);
    ray.rotation.z = a - Math.PI / 2;
    sun.add(ray);
  }
  return sun;
}

export function createStars(count = 90) {
  const stars = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.35, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0xfff8e0, fog: false });
  for (let i = 0; i < count; i++) {
    const star = new THREE.Mesh(geo, material);
    star.position.set(
      (Math.random() - 0.5) * 220,
      12 + Math.random() * 55,
      -60 - Math.random() * 110
    );
    star.scale.setScalar(0.5 + Math.random());
    stars.add(star);
  }
  return stars;
}

export function createMountains(track) {
  const g = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const h = 8 + Math.random() * 14;
    const radius = 6 + Math.random() * 4;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(radius, h, 5), mat(pick(track.mountains)));

    // Sempre longe do corredor da pista (e dos enfeites das laterais), para
    // nenhuma montanha nascer em cima do caminho.
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (radius + 20 + Math.random() * 52);
    peak.position.set(x, h / 2 - 2, -60 - Math.random() * 60);
    g.add(peak);
  }
  return g;
}

// --- Marcos de distância ----------------------------------------------------
//
// Plaquinha com o número escrito num quadradinho de canvas. No teste fora do
// navegador (npm run check) não existe canvas, então a plaquinha sai lisa.
const labelCache = new Map();

function labelTexture(text, color = '#7a4ec7', background = '#fff6fb') {
  if (typeof document === 'undefined') return null;
  const cached = labelCache.get(text);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Diminui a letra até a palavra caber na plaquinha (RECORDE é comprida).
  let size = 76;
  do {
    ctx.font = `bold ${size}px "Fredoka", "Trebuchet MS", sans-serif`;
    size -= 4;
  } while (ctx.measureText(text).width > 224 && size > 20);

  ctx.fillText(text, 128, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  labelCache.set(text, texture);
  return texture;
}

function labelPlate(text, width, height, color, background) {
  const texture = labelTexture(text, color, background);
  const material = texture
    ? new THREE.MeshBasicMaterial({ map: texture })
    : new THREE.MeshBasicMaterial({ color: 0xfff6fb });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plate.renderOrder = 1;
  return plate;
}

// Placa de "quantos passos já corri", nas duas beiras da pista.
export function createDistanceMarker(distance) {
  const marker = new THREE.Group();

  for (const side of [-1, 1]) {
    const post = new THREE.Group();
    post.position.set(side * 5.1, 0, 0);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 6), mat(0xfff0fb));
    pole.position.y = 0.75;
    pole.castShadow = true;
    post.add(pole);

    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.78, 0.16), mat(0xffffff));
    board.position.y = 1.75;
    board.castShadow = true;
    post.add(board);

    const plate = labelPlate(String(distance), 1.32, 0.66, '#7a4ec7', '#fff6fb');
    plate.position.set(0, 1.75, 0.09);
    post.add(plate);

    marker.add(post);
  }

  marker.userData.kind = 'marker';
  return marker;
}

// Faixa do recorde anterior: dá para ver de longe onde está o desafio.
export function createRecordBanner() {
  const banner = new THREE.Group();

  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 4.2, 6), mat(0xffd166));
    pole.position.set(side * 4.6, 2.1, 0);
    pole.castShadow = true;
    banner.add(pole);
  }

  const cloth = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.1, 0.16), mat(0xff5d8f));
  cloth.position.y = 3.6;
  cloth.castShadow = true;
  banner.add(cloth);

  const plate = labelPlate('RECORDE', 6.2, 0.9, '#ffffff', '#ff5d8f');
  plate.position.set(0, 3.6, 0.1);
  banner.add(plate);

  // Risco no chão, na altura exata do recorde.
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xff5d8f, transparent: true, opacity: 0.65 })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.y = 0.06;
  banner.add(line);

  banner.userData.kind = 'record';
  return banner;
}

export function createGround(track) {
  const g = new THREE.Group();

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(120, 400), mat(track.ground));
  grass.rotation.x = -Math.PI / 2;
  grass.position.z = -140;
  grass.receiveShadow = true;
  g.add(grass);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 400), mat(track.path));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, -140);
  path.receiveShadow = true;
  g.add(path);

  for (const side of [-3.9, 3.9]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 400), mat(track.kerb));
    kerb.position.set(side, 0.15, -140);
    g.add(kerb);
  }
  return g;
}
