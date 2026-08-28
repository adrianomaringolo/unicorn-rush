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

// Granulado espalhado pelo chão da pista dos doces.
function sprinkles() {
  const g = new THREE.Group();
  const cores = [0xff7bac, 0xffd166, 0x9be7ff, 0xc4f0a8, 0xffffff, 0xc9a6ff];
  const n = 10 + Math.floor(Math.random() * 10);
  for (let i = 0; i < n; i++) {
    const grao = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.16, 2, 5),
      mat(pick(cores))
    );
    grao.position.set((Math.random() - 0.5) * 2.4, 0.06, (Math.random() - 0.5) * 2.4);
    grao.rotation.set(Math.PI / 2, Math.random() * Math.PI, Math.random() * Math.PI);
    grao.castShadow = true;
    g.add(grao);
  }
  return g;
}

// Pedacinhos de chocolate, tipo lascas caídas no chão.
function chocolate() {
  const g = new THREE.Group();
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const cor = pick([0x6b4423, 0x8b5a2b, 0x4a2c17]);
    const pedaco = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.42), mat(cor));
    pedaco.position.set((Math.random() - 0.5) * 1.6, 0.11, (Math.random() - 0.5) * 1.6);
    pedaco.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
    pedaco.castShadow = true;
    g.add(pedaco);

    // Risquinhos de chocolate branco por cima
    const listra = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.1), mat(0xfff0d9));
    listra.position.copy(pedaco.position).setY(0.23);
    listra.rotation.copy(pedaco.rotation);
    g.add(listra);
  }
  return g;
}

// --- Pista das Frutas -------------------------------------------------------

function strawberry() {
  const g = new THREE.Group();

  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), mat(0xff4d5e));
  corpo.position.y = 0.78;
  corpo.castShadow = true;
  g.add(corpo);

  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 10), mat(0xff4d5e));
  ponta.rotation.x = Math.PI;
  ponta.position.y = 0.4;
  ponta.castShadow = true;
  g.add(ponta);

  // Sementinhas em fileira, dando a volta.
  for (let i = 0; i < 6; i++) {
    const semente = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), mat(0xfff0c9));
    const a = (i / 6) * Math.PI * 2;
    semente.position.set(Math.cos(a) * 0.55, 0.6 + (i % 2) * 0.35, Math.sin(a) * 0.55);
    g.add(semente);
  }

  // Coroa de folhas numa peça só + cabinho.
  const coroa = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.3, 6), mat(0x4f9e5c));
  coroa.rotation.x = Math.PI;
  coroa.position.y = 1.3;
  coroa.castShadow = true;
  g.add(coroa);

  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 5), mat(0x4f9e5c));
  cabo.position.y = 1.5;
  g.add(cabo);
  return g;
}

function orangeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 7), mat(0xa9744f));
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);

  for (const [x, y, z, r] of [[0, 2.2, 0, 1.05], [-0.6, 1.95, 0.25, 0.7], [0.62, 2.05, -0.2, 0.64]]) {
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(0x4f9e5c));
    copa.position.set(x, y, z);
    copa.castShadow = true;
    g.add(copa);
  }

  for (let i = 0; i < 4; i++) {
    const laranja = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 7), mat(0xffa02e));
    const a = (i / 4) * Math.PI * 2;
    laranja.position.set(Math.cos(a) * 0.85, 1.9 + Math.sin(a * 2) * 0.35, Math.sin(a) * 0.8);
    laranja.castShadow = true;
    g.add(laranja);
  }
  return g;
}

function bananaBunch() {
  const g = new THREE.Group();

  const caule = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 6), mat(0x7a8f4a));
  caule.position.y = 0.6;
  caule.castShadow = true;
  g.add(caule);

  // Penca: bananas viradas para o mesmo lado, em leque.
  for (let i = 0; i < 5; i++) {
    const banana = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.12, 6, 10, Math.PI * 0.75),
      mat(0xffd93d)
    );
    banana.rotation.set(Math.PI / 2, (i - 2) * 0.22, 0);
    banana.position.set((i - 2) * 0.14, 1.2 - Math.abs(i - 2) * 0.06, 0.1);
    banana.castShadow = true;
    g.add(banana);
  }

  const capuz = new THREE.Mesh(new THREE.SphereGeometry(0.26, 7, 6), mat(0x7a8f4a));
  capuz.scale.y = 0.6;
  capuz.position.y = 1.34;
  g.add(capuz);
  return g;
}

// --- Frutas caídas no chão, para encher o pomar ----------------------------

function watermelonPatch() {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const melancia = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(0x3f8f4a));
    melancia.scale.set(1.15, 0.85, 1);
    melancia.position.set((i - 0.5) * 1.2, 0.42, (Math.random() - 0.5) * 0.8);
    melancia.rotation.y = Math.random();
    melancia.castShadow = true;
    g.add(melancia);

    const listra = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 4, 10, Math.PI), mat(0x2b6b34));
    listra.position.copy(melancia.position);
    listra.rotation.set(Math.PI / 2, melancia.rotation.y, 0);
    listra.scale.set(1.15, 0.85, 1);
    g.add(listra);
  }
  return g;
}

function orangePile() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const laranja = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 7), mat(0xffa02e));
    laranja.position.set((i % 2 - 0.5) * 0.6, i < 2 ? 0.3 : 0.72, (Math.floor(i / 2) - 0.5) * 0.5);
    laranja.castShadow = true;
    g.add(laranja);
  }
  const folha = new THREE.Mesh(new THREE.SphereGeometry(0.16, 5, 4), mat(0x3f7d4d));
  folha.scale.set(1, 0.25, 1.7);
  folha.position.set(0.1, 0.95, 0);
  g.add(folha);
  return g;
}

function grapes() {
  const g = new THREE.Group();
  const cor = pick([0x8b5fbf, 0x6b4bb0, 0x9c6fd6]);
  // Cacho: bolinhas em fileiras que vão diminuindo.
  const fileiras = [[3, 0.62, 0.3], [2, 0.95, 0.2], [1, 1.2, 0]];
  for (const [quantas, alt, raio] of fileiras) {
    for (let i = 0; i < quantas; i++) {
      const uva = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6), mat(cor));
      const a = quantas > 1 ? (i / quantas) * Math.PI * 2 : 0;
      uva.position.set(Math.cos(a) * raio, alt, Math.sin(a) * raio);
      uva.castShadow = true;
      g.add(uva);
    }
  }
  const folha = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 5), mat(0x4f9e5c));
  folha.scale.set(1, 0.2, 1.2);
  folha.position.set(0.16, 1.42, 0);
  g.add(folha);
  return g;
}

function kiwi() {
  const g = new THREE.Group();

  // Metade cortada, mostrando o miolo verde.
  const casca = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), mat(0x8f6b3f));
  casca.position.y = 0.16;
  casca.castShadow = true;
  g.add(casca);

  const polpa = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.32, 12), mat(0x8fcf5a));
  polpa.position.y = 0.17;
  g.add(polpa);

  const miolo = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 8), mat(0xf6ffe8));
  miolo.position.y = 0.18;
  g.add(miolo);

  // Uma fruta inteira do lado.
  const inteiro = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 7), mat(0x8f6b3f));
  inteiro.scale.set(1.25, 1, 1);
  inteiro.position.set(0.85, 0.34, 0.2);
  inteiro.castShadow = true;
  g.add(inteiro);
  return g;
}

// Fatia de melancia em pé: casca verde, entrecasca branca e polpa vermelha.
function watermelon() {
  const g = new THREE.Group();

  const fatia = (raio, cor, z) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(raio, raio, 0.42, 14, 1, false, 0, Math.PI),
      mat(cor)
    );
    m.rotation.set(Math.PI / 2, 0, 0);
    m.position.set(0, 0.1, z);
    m.castShadow = true;
    return m;
  };

  g.add(fatia(1.0, 0x3f8f4a, 0));         // casca
  g.add(fatia(0.9, 0xf2fff0, 0.02));      // entrecasca
  g.add(fatia(0.8, 0xff5d6c, 0.04));      // polpa

  for (let i = 0; i < 4; i++) {
    const semente = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), mat(0x2b2028));
    semente.scale.z = 0.4;
    const a = ((i + 0.5) / 4) * Math.PI;
    semente.position.set(Math.cos(a) * 0.45, 0.1 + Math.sin(a) * 0.42, 0.28);
    g.add(semente);
  }
  return g;
}

function pineapple() {
  const g = new THREE.Group();

  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 10), mat(0xffb02e));
  corpo.scale.set(1, 1.35, 1);
  corpo.position.y = 0.75;
  corpo.castShadow = true;
  g.add(corpo);

  // Casquinha: dois anéis de escamas, o bastante para dar a textura.
  for (let anel = 0; anel < 2; anel++) {
    const alt = 0.6 + anel * 0.42;
    for (let i = 0; i < 5; i++) {
      const escama = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), mat(0xd98a1f));
      const a = (i / 5) * Math.PI * 2 + anel * 0.6;
      escama.position.set(Math.cos(a) * 0.5, alt, Math.sin(a) * 0.5);
      escama.scale.set(1, 0.8, 0.5);
      g.add(escama);
    }
  }

  const coroa = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.85, 6), mat(0x4f9e5c));
  coroa.position.y = 1.75;
  coroa.castShadow = true;
  g.add(coroa);
  return g;
}

function coconutPile() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const coco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat(0x7a5230));
    coco.position.set((i - 1) * 0.5, 0.42 + (i === 1 ? 0.5 : 0), (Math.random() - 0.5) * 0.3);
    coco.castShadow = true;
    g.add(coco);

    for (let j = 0; j < 3; j++) {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), mat(0x4a2c17));
      olho.position.set(coco.position.x + (j - 1) * 0.14, coco.position.y + 0.2, coco.position.z + 0.36);
      g.add(olho);
    }
  }
  return g;
}

// --- Pista do Oceano --------------------------------------------------------

function coral() {
  const g = new THREE.Group();
  const cor = pick([0xff7b9d, 0xffa02e, 0xc9a6ff, 0xff5d8f]);
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.9, 6), mat(cor));
  tronco.position.y = 0.45;
  tronco.castShadow = true;
  g.add(tronco);

  for (let i = 0; i < 4; i++) {
    const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.85, 5), mat(cor));
    const a = (i / 4) * Math.PI * 2;
    braco.position.set(Math.cos(a) * 0.3, 1.05, Math.sin(a) * 0.3);
    braco.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    braco.castShadow = true;
    g.add(braco);
  }
  return g;
}

function seaweed() {
  const g = new THREE.Group();
  const cor = pick([0x3f8f6a, 0x4aa87a, 0x2f7a58]);
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const base = (i - n / 2) * 0.3;
    for (let j = 0; j < 4; j++) {
      const folha = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.08), mat(cor));
      folha.position.set(base + Math.sin(j) * 0.15, 0.3 + j * 0.5, 0);
      folha.rotation.z = Math.sin(j + i) * 0.35;
      folha.castShadow = true;
      g.add(folha);
    }
  }
  return g;
}

function starfish() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.6 : 0.26;
    const a = (i / 10) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();

  const estrela = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 1 }),
    mat(pick([0xffa02e, 0xff7b9d, 0xffd166]))
  );
  estrela.rotation.x = -Math.PI / 2;
  estrela.position.y = 0.12;
  estrela.castShadow = true;

  const g = new THREE.Group();
  g.add(estrela);
  return g;
}

function seaUrchin() {
  const g = new THREE.Group();
  const cor = 0x6b4bb0;
  const corpo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mat(cor));
  corpo.position.y = 0.55;
  corpo.castShadow = true;
  g.add(corpo);

  for (let i = 0; i < 12; i++) {
    const espinho = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 4), mat(0x4a3080));
    const a = (i / 12) * Math.PI * 2;
    const alt = (i % 3) - 1;
    espinho.position.set(Math.cos(a) * 0.52, 0.55 + alt * 0.32, Math.sin(a) * 0.52);
    espinho.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2);
    espinho.castShadow = true;
    g.add(espinho);
  }
  return g;
}

function clam() {
  const g = new THREE.Group();
  const cor = pick([0xffd6e8, 0xffe9c9, 0xe0d6ff]);
  for (const lado of [-1, 1]) {
    const concha = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(cor)
    );
    concha.position.set(0, 0.5, 0);
    concha.rotation.z = lado * 0.55;
    concha.scale.set(1, 0.75, 0.85);
    concha.castShadow = true;
    g.add(concha);
  }
  const perola = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat(0xfffdf5, { emissive: 0x554d3d }));
  perola.position.y = 0.55;
  g.add(perola);
  return g;
}

const DECORATIONS = {
  tree, pineTree, mushroom, glowMushroom, crystal, flower, flowerPatch,
  lollipop, cupcake, candyCane, sprinkles, chocolate,
  cloudHill, balloon, rainbowArch,
  strawberry, orangeTree, bananaBunch, watermelonPatch, orangePile, grapes, kiwi,
  coral, seaweed, starfish,
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
  watermelon, pineapple, coconutPile, seaUrchin, clam,
};

export function createObstacle(track) {
  const build = OBSTACLES[pick(track.obstacles)] || rock;
  const obj = build();
  obj.userData.kind = 'obstacle';
  return obj;
}

// --- Fundo ------------------------------------------------------------------

// --- Bichinhos que voam (ou nadam) em volta da pista ----------------------
//
// Todos seguem o mesmo contrato: nascem com `userData.parts` (o que precisa
// se mexer) e são animados por `animateAmbience`.

function asaSimples(color, size = 0.22) {
  const wing = new THREE.Mesh(new THREE.CircleGeometry(size, 8), new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, fog: false,
  }));
  return wing;
}

// Borboleta: duas asinhas coloridas batendo.
function butterfly() {
  const g = new THREE.Group();
  const color = pick([0xff9ecb, 0xffd166, 0x9be7ff, 0xc9a6ff, 0xffb3d1]);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.045, 0.16, 2, 5),
    new THREE.MeshBasicMaterial({ color: 0x6b5a8f, fog: false })
  );
  g.add(body);

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const cima = asaSimples(color, 0.19);
    cima.position.set(side * 0.16, 0.06, 0);
    const baixo = asaSimples(color, 0.13);
    baixo.position.set(side * 0.13, -0.11, 0);
    wing.add(cima, baixo);
    wing.userData.side = side;
    g.add(wing);
    wings.push(wing);
  }

  g.userData.parts = { wings };
  return g;
}

// Abelha: corpo listrado e asinhas transparentes.
function bee() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.1, 0.14, 3, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd166, fog: false })
  );
  body.rotation.z = Math.PI / 2;
  g.add(body);

  for (let i = 0; i < 2; i++) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.05, 8),
      new THREE.MeshBasicMaterial({ color: 0x4a3b2a, fog: false })
    );
    stripe.rotation.z = Math.PI / 2;
    stripe.position.x = -0.03 - i * 0.09;
    g.add(stripe);
  }

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const asa = asaSimples(0xffffff, 0.13);
    asa.material.opacity = 0.55;
    asa.position.set(0.02, 0.1, side * 0.07);
    wing.add(asa);
    wing.userData.side = side;
    g.add(wing);
    wings.push(wing);
  }

  g.userData.parts = { wings };
  return g;
}

// Passarinho: corpo redondinho, bico e asas planando.
function bird() {
  const g = new THREE.Group();
  const color = pick([0xffffff, 0xffe9a3, 0xbfe9ff, 0xffd6e8]);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 7, 6),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  body.scale.set(1.3, 1, 1);
  g.add(body);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.13, 5),
    new THREE.MeshBasicMaterial({ color: 0xffab1f, fog: false })
  );
  beak.rotation.z = -Math.PI / 2;
  beak.position.x = 0.26;
  g.add(beak);

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const asa = asaSimples(color, 0.24);
    asa.scale.set(1, 0.45, 1);
    asa.position.set(-0.02, 0, side * 0.16);
    asa.rotation.x = Math.PI / 2;
    wing.add(asa);
    wing.userData.side = side;
    g.add(wing);
    wings.push(wing);
  }

  g.userData.parts = { wings };
  return g;
}

// Peixinho: corpo e rabo que balança.
function fish() {
  const g = new THREE.Group();
  const color = pick([0xff9f68, 0xffd166, 0x9be7ff, 0xff8fb1, 0xa6ffcb]);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 7, 6),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  body.scale.set(1.5, 1, 0.6);
  g.add(body);

  const tail = new THREE.Group();
  const leque = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.2, 3),
    new THREE.MeshBasicMaterial({ color, fog: false, side: THREE.DoubleSide })
  );
  leque.rotation.z = Math.PI / 2;
  leque.scale.z = 0.4;
  leque.position.x = -0.1;
  tail.position.x = -0.24;
  tail.add(leque);
  g.add(tail);

  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0x30203a, fog: false })
  );
  eye.position.set(0.17, 0.05, 0.1);
  g.add(eye);

  g.userData.parts = { tail };
  return g;
}

// Bolha de ar subindo no oceano.
function bubble() {
  const g = new THREE.Group();
  const raio = 0.12 + Math.random() * 0.22;

  const bolha = new THREE.Mesh(
    new THREE.SphereGeometry(raio, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.4, fog: false })
  );
  g.add(bolha);

  // Brilhinho, para parecer bolha mesmo.
  const luz = new THREE.Mesh(
    new THREE.SphereGeometry(raio * 0.3, 5, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, fog: false })
  );
  luz.position.set(-raio * 0.4, raio * 0.4, raio * 0.4);
  g.add(luz);

  g.userData.parts = { subida: 1.2 + Math.random() * 1.6 };
  return g;
}

// Formiguinha andando pela beira da pista dos doces.
function ant() {
  const g = new THREE.Group();
  const corpo = new THREE.Group();

  for (const [x, r] of [[-0.16, 0.1], [0, 0.08], [0.17, 0.12]]) {
    const parte = new THREE.Mesh(
      new THREE.SphereGeometry(r, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x3a2b2b, fog: false })
    );
    parte.position.x = x;
    corpo.add(parte);
  }

  for (const lado of [-1, 1]) {
    const antena = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4),
      new THREE.MeshBasicMaterial({ color: 0x3a2b2b, fog: false })
    );
    antena.position.set(0.24, 0.1, lado * 0.05);
    antena.rotation.z = -0.7;
    corpo.add(antena);
  }

  const pernas = [];
  for (let i = 0; i < 6; i++) {
    const perna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.18, 4),
      new THREE.MeshBasicMaterial({ color: 0x3a2b2b, fog: false })
    );
    const lado = i % 2 === 0 ? -1 : 1;
    perna.position.set(-0.12 + Math.floor(i / 2) * 0.14, -0.06, lado * 0.09);
    perna.rotation.x = lado * 0.9;
    perna.userData.lado = lado;
    corpo.add(perna);
    pernas.push(perna);
  }

  g.add(corpo);
  g.userData.parts = { corpo, pernas };
  return g;
}

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

const AMBIENCE = { firefly: createFirefly, butterfly, bee, bird, fish, bubble, ant };

// Cria um bichinho do tipo pedido pela pista.
export function createAmbience(kind) {
  const build = AMBIENCE[kind] || createFirefly;
  const item = build();
  item.userData.kind = kind;
  item.userData.phase = Math.random() * Math.PI * 2;
  item.userData.speed = 0.6 + Math.random() * 0.9;
  return item;
}

// Cada bichinho se mexe do seu jeito: a borboleta bate asa devagar, a abelha
// vibra, o passarinho plana, o peixe balança o rabo e o vagalume pisca.
export function animateAmbience(item, elapsed) {
  const { kind, phase, speed, parts, spark, halo } = item.userData;
  const t = elapsed * speed + phase;

  if (kind === 'firefly') {
    const brilho = 0.45 + Math.sin(elapsed * 3.5 + phase) * 0.55;
    spark.material.opacity = brilho;
    spark.material.transparent = true;
    halo.material.opacity = brilho * 0.35;
    halo.scale.setScalar(0.8 + brilho * 0.5);
    return { x: Math.sin(t) * 1.1, y: Math.cos(t * 0.8) * 0.5 };
  }

  if (kind === 'butterfly') {
    const bate = Math.sin(elapsed * 9 + phase) * 0.9;
    for (const wing of parts.wings) wing.rotation.y = wing.userData.side * (0.5 + bate * 0.5);
    item.rotation.z = Math.sin(t * 1.6) * 0.3;
    return { x: Math.sin(t * 1.2) * 1.6, y: Math.sin(t * 2.1) * 0.9 };
  }

  if (kind === 'bee') {
    const bate = Math.sin(elapsed * 26 + phase);
    for (const wing of parts.wings) wing.rotation.x = wing.userData.side * bate * 0.5;
    return { x: Math.sin(t * 2.6) * 1.2, y: Math.sin(t * 3.4) * 0.5 };
  }

  if (kind === 'bird') {
    const bate = Math.sin(elapsed * 5 + phase);
    for (const wing of parts.wings) wing.rotation.x = wing.userData.side * bate * 0.7;
    item.rotation.y = Math.sin(t * 0.5) * 0.3;
    return { x: Math.sin(t * 0.7) * 2.4, y: Math.sin(t * 1.1) * 0.8 };
  }

  if (kind === 'bubble') {
    // Sobe sempre, balançando de leve; quem devolve para baixo é o mundo.
    const alturaCiclo = 9;
    const subiu = (elapsed * parts.subida + phase * 3) % alturaCiclo;
    item.scale.setScalar(0.85 + Math.sin(elapsed * 3 + phase) * 0.12);
    return { x: Math.sin(t * 1.4) * 0.5, y: subiu };
  }

  if (kind === 'ant') {
    // Anda em fila, mexendo as perninhas.
    const passo = Math.sin(elapsed * 12 + phase);
    for (const perna of parts.pernas) {
      perna.rotation.x = perna.userData.lado * (0.9 + passo * perna.userData.lado * 0.35);
    }
    parts.corpo.position.y = Math.abs(passo) * 0.03;
    item.rotation.y = Math.sin(t * 0.4) * 0.6;
    return { x: Math.sin(t * 0.5) * 2.5, y: 0 };
  }

  if (kind === 'fish') {
    parts.tail.rotation.y = Math.sin(elapsed * 7 + phase) * 0.7;
    item.rotation.y = Math.sin(t * 0.6) * 0.4;
    return { x: Math.sin(t * 0.9) * 2.2, y: Math.sin(t * 1.4) * 0.6 };
  }

  return { x: 0, y: 0 };
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

// Marca do recorde anterior: só no chão, para não atrapalhar a visão da
// pista. É uma faixa colorida atravessando o caminho, com a palavra deitada
// no chão logo antes dela.
export function createRecordBanner() {
  const banner = new THREE.Group();

  const faixa = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 1.1),
    new THREE.MeshBasicMaterial({ color: 0xff5d8f, transparent: true, opacity: 0.75 })
  );
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.y = 0.06;
  banner.add(faixa);

  // Quadradinhos claros dentro da faixa, tipo linha de chegada.
  for (let i = -3; i <= 3; i++) {
    const quadro = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xfff0f6, transparent: true, opacity: 0.85 })
    );
    quadro.rotation.x = -Math.PI / 2;
    quadro.position.set(i * 1.15, 0.07, i % 2 === 0 ? 0.24 : -0.24);
    banner.add(quadro);
  }

  const plate = labelPlate('RECORDE', 4.4, 0.9, '#ffffff', '#ff5d8f');
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.07, 1.6);
  banner.add(plate);

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
