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

// Árvore do Campo. Eram três bolinhas empilhadas, que davam uma silhueta
// magra de pirulito; agora a copa é uma cúpula de nove bolotas em dois
// tamanhos — um anel largo embaixo e menores em cima —, com frutinhas
// penduradas na borda de fora, onde elas realmente se veem.
//
// A copa fica em tom pastel porque o Campo é o "campo encantado do
// arco-íris"; as frutas são saturadas, para aparecerem contra ela.
function tree() {
  const g = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 1.7, 7), mat(0xc98f6b));
  trunk.position.y = 0.85;
  trunk.castShadow = true;
  g.add(trunk);

  // Dois toquinhos de galho: quebram a linha reta do tronco.
  for (const lado of [-1, 1]) {
    const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5), mat(0xbb8260));
    galho.position.set(lado * 0.22, 1.5, lado * 0.1);
    galho.rotation.z = lado * -0.7;
    galho.castShadow = true;
    g.add(galho);
  }

  const copa = new THREE.Group();
  copa.position.y = 2.15;
  g.add(copa);

  const color = new THREE.Color(pick(PASTEL));
  const claro = color.clone().lerp(new THREE.Color(0xffffff), 0.22);
  const escuro = color.clone().multiplyScalar(0.86);

  // Anel largo: é ele que dá a frondosidade.
  const bolotas = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.random() * 0.3;
    const raio = 0.62 + Math.random() * 0.16;
    const bolota = new THREE.Mesh(
      new THREE.IcosahedronGeometry(raio, 1),
      mat(i % 2 === 0 ? color : escuro)
    );
    bolota.position.set(Math.cos(a) * 0.62, -0.1 + Math.random() * 0.2, Math.sin(a) * 0.62);
    bolota.castShadow = true;
    copa.add(bolota);
    bolotas.push({ x: bolota.position.x, y: bolota.position.y, z: bolota.position.z, r: raio });
  }

  // Cúpula: as de cima, um pouco menores.
  for (const [x, y, z, r] of [[0, 0.42, 0, 0.66], [-0.3, 0.3, 0.28, 0.5], [0.32, 0.34, -0.26, 0.48], [0, 0.05, 0, 0.6]]) {
    const bolota = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(claro));
    bolota.position.set(x, y, z);
    bolota.castShadow = true;
    copa.add(bolota);
  }

  // Frutinhas na borda de fora do anel, encostadas na bolota de cada uma.
  const corFruta = pick([0xf2385a, 0xffb01f]);
  for (let i = 0; i < 8; i++) {
    const base = bolotas[i % bolotas.length];
    const a = Math.atan2(base.z, base.x) + (Math.random() - 0.5) * 0.9;
    const dist = base.r * 0.82;
    const fruta = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 6), mat(corFruta));
    fruta.position.set(
      base.x + Math.cos(a) * dist,
      base.y - 0.12 - Math.random() * 0.3,
      base.z + Math.sin(a) * dist
    );
    fruta.castShadow = true;
    copa.add(fruta);
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

// --- Vulcão -----------------------------------------------------------------
//
// A pista do Brasa. Tudo aqui é pedra escura com fresta acesa: o contraste
// entre o basalto quase preto e o laranja é o que faz o cenário ser lido de
// longe, mesmo correndo.

const LAVA = [0xff6b1f, 0xff9500, 0xffc24d];

// Pedra de basalto com veios de lava.
function lavaRock() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const pedra = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5 - i * 0.11, 0),
      mat(0x3b3340)
    );
    pedra.position.set((Math.random() - 0.5) * 0.8, 0.34 + i * 0.16, (Math.random() - 0.5) * 0.5);
    pedra.rotation.set(Math.random(), Math.random(), Math.random());
    pedra.castShadow = true;
    g.add(pedra);
  }
  const cor = pick(LAVA);
  const veio = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 7, 5),
    mat(cor, { emissive: cor, emissiveIntensity: 1 })
  );
  veio.scale.set(1.5, 0.5, 1.1);
  veio.position.set(0, 0.2, 0.26);
  g.add(veio);
  return g;
}

// Chaminé soltando brasa: um cone escuro com a boca acesa.
function emberVent() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 6), mat(0x2f2833));
  cone.position.y = 0.55;
  cone.castShadow = true;
  g.add(cone);
  const cor = pick(LAVA);
  const boca = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 6),
    mat(cor, { emissive: cor, emissiveIntensity: 1.1 })
  );
  boca.position.y = 1.06;
  g.add(boca);
  // Fagulhas subindo, paradas no ar (o cenário passa, elas não precisam voar).
  for (let i = 0; i < 3; i++) {
    const fagulha = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 - i * 0.012, 5, 4),
      mat(0xffc24d, { emissive: 0xffc24d, emissiveIntensity: 1.2 })
    );
    fagulha.position.set((Math.random() - 0.5) * 0.35, 1.3 + i * 0.36, (Math.random() - 0.5) * 0.3);
    g.add(fagulha);
  }
  return g;
}

// Árvore queimada: só o tronco preto e dois galhos secos.
function charredTree() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.1, 6), mat(0x2b2530));
  tronco.position.y = 1.05;
  tronco.castShadow = true;
  g.add(tronco);
  for (const lado of [-1, 1]) {
    const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.85, 5), mat(0x352e3b));
    galho.position.set(lado * 0.3, 1.6, 0);
    galho.rotation.z = lado * -0.9;
    galho.castShadow = true;
    g.add(galho);
  }
  return g;
}

// Obstáculo: pedregulho de lava, com o disco de aviso no chão.
function lavaBoulder() {
  const g = new THREE.Group();
  const cor = pick(LAVA);
  const pedra = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), mat(0x342d3a));
  pedra.position.y = 0.6;
  pedra.castShadow = true;
  g.add(pedra);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const fresta = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 6, 5),
      mat(cor, { emissive: cor, emissiveIntensity: 1.05 })
    );
    fresta.scale.set(1.4, 0.4, 1);
    fresta.position.set(Math.cos(a) * 0.45, 0.6 + Math.sin(a) * 0.28, Math.sin(a) * 0.45);
    fresta.rotation.y = -a;
    g.add(fresta);
  }
  g.add(warningRing(cor));
  return g;
}

// Poça de lava: a crosta escura em volta e a lava acesa dentro. Fica rente
// ao chão, com o brilho fazendo o trabalho — é o detalhe que dá a sensação
// de calor nas laterais da pista.
function lavaPool() {
  const g = new THREE.Group();
  const cor = pick(LAVA);
  const raio = 0.9 + Math.random() * 0.8;

  const poca = new THREE.Mesh(
    new THREE.CircleGeometry(raio, 9),
    mat(cor, { emissive: cor, emissiveIntensity: 1.15 })
  );
  poca.rotation.x = -Math.PI / 2;
  poca.position.y = 0.04;
  g.add(poca);

  // Miolo mais claro: a lava não é chapada, tem parte mais quente.
  const miolo = new THREE.Mesh(
    new THREE.CircleGeometry(raio * 0.5, 8),
    mat(0xffd88a, { emissive: 0xffd88a, emissiveIntensity: 1.3 })
  );
  miolo.rotation.x = -Math.PI / 2;
  miolo.position.set((Math.random() - 0.5) * raio * 0.5, 0.06, (Math.random() - 0.5) * raio * 0.5);
  g.add(miolo);

  // Crosta: pedras irregulares na borda, meio afundadas.
  const pedras = 7 + Math.floor(Math.random() * 4);
  for (let i = 0; i < pedras; i++) {
    const a = (i / pedras) * Math.PI * 2 + Math.random() * 0.3;
    const pedra = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.14, 0),
      mat(0x2f2833)
    );
    pedra.position.set(Math.cos(a) * raio * 1.02, 0.05, Math.sin(a) * raio * 1.02);
    pedra.rotation.set(Math.random(), Math.random(), Math.random());
    pedra.scale.y = 0.6;
    g.add(pedra);
  }

  // Uma bolha de lava saindo do meio.
  const bolha = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 7, 6),
    mat(cor, { emissive: cor, emissiveIntensity: 1.2 })
  );
  bolha.scale.y = 0.7;
  bolha.position.set((Math.random() - 0.5) * raio * 0.6, 0.12, (Math.random() - 0.5) * raio * 0.6);
  g.add(bolha);

  return g;
}

// --- Geada -------------------------------------------------------------------

const GELO = [0xbfe9ff, 0xdff4ff, 0x9ed8f5];

// Pinheiro com neve empilhada nos galhos.
function snowPine() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.7, 6), mat(0x6b5544));
  tronco.position.y = 0.35;
  g.add(tronco);
  for (let i = 0; i < 3; i++) {
    const copa = new THREE.Mesh(new THREE.ConeGeometry(0.75 - i * 0.18, 0.85, 7), mat(0x3f7d5d));
    copa.position.y = 0.9 + i * 0.55;
    copa.castShadow = true;
    g.add(copa);
    const neve = new THREE.Mesh(new THREE.ConeGeometry(0.6 - i * 0.16, 0.3, 7), mat(0xffffff));
    neve.position.y = 1.16 + i * 0.55;
    g.add(neve);
  }
  return g;
}

function igloo() {
  const g = new THREE.Group();
  const domo = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xf2f8ff)
  );
  domo.castShadow = true;
  g.add(domo);
  const porta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.55, 8, 1, false, 0, Math.PI),
    mat(0xd7e8f5)
  );
  porta.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  porta.position.set(0, 0.28, 0.8);
  g.add(porta);
  const buraco = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), mat(0x5b7590));
  buraco.position.set(0, 0.26, 1.06);
  g.add(buraco);
  return g;
}

// Cristal de gelo: espinhos claros e translúcidos saindo do chão.
function iceCrystal() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const cor = pick(GELO);
    const espinho = new THREE.Mesh(
      new THREE.ConeGeometry(0.2 - i * 0.04, 1.2 - i * 0.3, 5),
      new THREE.MeshLambertMaterial({
        color: cor, flatShading: true, transparent: true, opacity: 0.75,
        emissive: cor, emissiveIntensity: 0.25,
      })
    );
    espinho.position.set((i - 1) * 0.28, (1.2 - i * 0.3) / 2, (Math.random() - 0.5) * 0.3);
    espinho.rotation.z = (i - 1) * 0.2;
    espinho.castShadow = true;
    g.add(espinho);
  }
  return g;
}

function snowman() {
  const g = new THREE.Group();
  const tamanhos = [0.42, 0.31, 0.22];
  let y = 0.42;
  for (const r of tamanhos) {
    const bola = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), mat(0xffffff));
    bola.position.y = y;
    bola.castShadow = true;
    g.add(bola);
    y += r + tamanhos[Math.min(tamanhos.indexOf(r) + 1, 2)] * 0.75;
  }
  const cenoura = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 5), mat(0xff8a3c));
  cenoura.rotation.x = Math.PI / 2;
  cenoura.position.set(0, y - 0.28, 0.24);
  g.add(cenoura);
  for (const lado of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), mat(0x2b2530));
    olho.position.set(lado * 0.08, y - 0.2, 0.2);
    g.add(olho);
  }
  return g;
}

// Obstáculo: bloco de gelo, translúcido e com a quina brilhando.
function iceBlock() {
  const g = new THREE.Group();
  const cor = pick(GELO);
  const bloco = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.85, 0.9),
    new THREE.MeshLambertMaterial({
      color: cor, flatShading: true, transparent: true, opacity: 0.82,
      emissive: cor, emissiveIntensity: 0.3,
    })
  );
  bloco.position.y = 0.43;
  bloco.rotation.y = Math.random() * 0.6;
  bloco.castShadow = true;
  g.add(bloco);
  const topo = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), mat(0xffffff));
  topo.position.y = 0.92;
  topo.rotation.y = bloco.rotation.y;
  g.add(topo);
  return g;
}

// --- Espaço ------------------------------------------------------------------

const PLANETAS = [0xff8fb1, 0x9ad2ff, 0xffd166, 0xc9a6ff, 0x8ce99a];

// Planeta. São quatro tipos sorteados, porque um planeta só, repetido,
// vira padrão de papel de parede: gigante gasoso listrado, o de anéis
// múltiplos, o de crateras e o que tem lua própria.
function planet() {
  const g = new THREE.Group();
  const cor = pick(PLANETAS);
  const tipo = pick(['listrado', 'aneis', 'crateras', 'comLua']);
  const raio = 0.6 + Math.random() * 0.5;
  const altura = 1.1 + Math.random() * 0.8;

  const bola = new THREE.Mesh(new THREE.SphereGeometry(raio, 12, 9), mat(cor));
  bola.position.y = altura;
  bola.castShadow = true;
  g.add(bola);

  if (tipo === 'listrado') {
    // Faixas horizontais, como Júpiter. O contraste é forte de propósito:
    // na pista o planeta é pequeno, e listra sutil simplesmente não se vê.
    const escuro = new THREE.Color(cor).multiplyScalar(0.5);
    const claro = new THREE.Color(cor).lerp(new THREE.Color(0xffffff), 0.45);
    for (let i = 0; i < 4; i++) {
      const faixa = new THREE.Mesh(
        new THREE.SphereGeometry(raio * 1.01, 14, 5, 0, Math.PI * 2,
          (0.16 + i * 0.19) * Math.PI, 0.11 * Math.PI),
        mat(i % 2 === 0 ? escuro : claro)
      );
      faixa.position.y = altura;
      g.add(faixa);
    }
  }

  if (tipo === 'aneis') {
    for (let i = 0; i < 3; i++) {
      const anel = new THREE.Mesh(
        new THREE.TorusGeometry(raio * (1.35 + i * 0.22), 0.045, 5, 20),
        mat(0xfff0c9, { emissive: 0xfff0c9, emissiveIntensity: 0.3 })
      );
      anel.position.y = altura;
      anel.rotation.set(Math.PI / 2.3, 0, 0.3);
      g.add(anel);
    }
  }

  if (tipo === 'crateras') {
    // Crateras como calotas afundadas: além de escurecer, elas quebram o
    // contorno da bola, e é o contorno que se lê de longe.
    const fundo = new THREE.Color(cor).multiplyScalar(0.45);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = 0.3 + Math.random() * 2.5;
      const tamanho = raio * (0.2 + Math.random() * 0.18);
      const cratera = new THREE.Mesh(
        new THREE.SphereGeometry(tamanho, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(fundo)
      );
      const dir = new THREE.Vector3(
        Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)
      );
      cratera.position.copy(dir).multiplyScalar(raio * 0.94).setY(altura + dir.y * raio * 0.94);
      cratera.lookAt(0, altura, 0);
      cratera.rotateX(-Math.PI / 2);
      g.add(cratera);
    }
  }

  if (tipo === 'comLua') {
    const lua = new THREE.Mesh(new THREE.SphereGeometry(raio * 0.28, 8, 6), mat(0xd6dcff));
    const a = Math.random() * Math.PI * 2;
    lua.position.set(Math.cos(a) * raio * 1.9, altura + raio * 0.7, Math.sin(a) * raio * 1.9);
    lua.castShadow = true;
    g.add(lua);
    const orbita = new THREE.Mesh(
      new THREE.TorusGeometry(raio * 1.9, 0.014, 4, 24),
      new THREE.MeshBasicMaterial({ color: 0xc9d0ff, transparent: true, opacity: 0.3, depthWrite: false })
    );
    orbita.position.y = altura + raio * 0.35;
    orbita.rotation.set(Math.PI / 2.1, 0, 0.2);
    g.add(orbita);
  }

  return g;
}

// Cascalho de asteroide: pedras espalhadas e baixas, de tamanhos diferentes.
// Antes eram duas pedras empilhadas, e a silhueta saía parecida com uma
// arvorezinha — tronco e copa.
function asteroid() {
  const g = new THREE.Group();
  const quantas = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < quantas; i++) {
    const raio = 0.1 + Math.random() * 0.3;
    const pedra = new THREE.Mesh(
      new THREE.DodecahedronGeometry(raio, 0),
      mat(pick([0x6b6478, 0x565064, 0x7d7590]))
    );
    // Espalhadas na horizontal e rentes ao vazio, nunca uma sobre a outra.
    pedra.position.set(
      (Math.random() - 0.5) * 2.6,
      raio * 0.8 + Math.random() * 0.5,
      (Math.random() - 0.5) * 2.2
    );
    pedra.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    pedra.scale.set(1, 0.7 + Math.random() * 0.5, 1);
    pedra.castShadow = true;
    g.add(pedra);
  }
  return g;
}

// Pedaço grande de asteroide, partido: uma rocha só, com lascas em volta.
function asteroidChunk() {
  const g = new THREE.Group();
  const raio = 0.5 + Math.random() * 0.35;
  const rocha = new THREE.Mesh(new THREE.IcosahedronGeometry(raio, 0), mat(0x625b73));
  rocha.position.y = raio * 0.9;
  rocha.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  rocha.castShadow = true;
  g.add(rocha);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.random();
    const lasca = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.13 + Math.random() * 0.12, 0),
      mat(0x8a82a0)
    );
    lasca.position.set(Math.cos(a) * (raio + 0.5), raio * 0.6 + Math.random() * 0.6, Math.sin(a) * (raio + 0.5));
    lasca.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    lasca.castShadow = true;
    g.add(lasca);
  }
  return g;
}

// Obstáculo: meteoro com o rastro aceso.
function meteor() {
  const g = new THREE.Group();
  const pedra = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(0x5a5468));
  pedra.position.y = 0.6;
  pedra.castShadow = true;
  g.add(pedra);
  const cor = pick([0xffc24d, 0x9ad2ff]);
  const rastro = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.1, 6),
    mat(cor, { emissive: cor, emissiveIntensity: 1 })
  );
  rastro.rotation.x = -Math.PI / 2;
  rastro.position.set(0, 0.6, 0.75);
  g.add(rastro);
  g.add(warningRing(cor));
  return g;
}

// --- Praia -------------------------------------------------------------------

function parasol() {
  const g = new THREE.Group();
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6), mat(0xfff6e8));
  haste.position.y = 0.95;
  g.add(haste);
  const cores = [0xff7bac, 0xfff0a8];
  for (let i = 0; i < 8; i++) {
    const gomo = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 3, (i / 8) * Math.PI * 2, Math.PI / 4),
      new THREE.MeshLambertMaterial({ color: cores[i % 2], flatShading: true, side: THREE.DoubleSide })
    );
    gomo.rotation.x = -Math.PI / 2.4;
    gomo.position.y = 1.85;
    gomo.castShadow = true;
    g.add(gomo);
  }
  return g;
}

function sandcastle() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), mat(0xf0d7a8));
  base.position.y = 0.25;
  base.castShadow = true;
  g.add(base);
  for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.75, 7), mat(0xe8ca94));
    torre.position.set(x, 0.62, z);
    torre.castShadow = true;
    g.add(torre);
    const telhado = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 7), mat(0xffb3d1));
    telhado.position.set(x, 1.13, z);
    g.add(telhado);
  }
  return g;
}

// Coqueiro. O tronco é feito de gomos que vão inclinando aos poucos, como
// coqueiro de verdade (curva, não pau reto), e cada folha é uma penca de
// lâminas em vez de um cone só — de longe o que se reconhece num coqueiro é
// justamente o recorte das folhas.
function palmTree() {
  const g = new THREE.Group();
  const gomos = 7;
  const curva = 0.055 + Math.random() * 0.03;   // o quanto ele deita
  const lado = Math.random() < 0.5 ? -1 : 1;
  let y = 0;
  let x = 0;
  let inclinacao = 0;

  for (let i = 0; i < gomos; i++) {
    const alturaGomo = 0.36;
    const raio = 0.19 - i * 0.014;
    const gomo = new THREE.Mesh(
      new THREE.CylinderGeometry(raio - 0.012, raio, alturaGomo, 7),
      mat(i % 2 === 0 ? 0xb08a5c : 0xa07a4c)
    );
    inclinacao += curva;
    x += lado * Math.sin(inclinacao) * alturaGomo;
    y += Math.cos(inclinacao) * alturaGomo;
    gomo.position.set(x, y - alturaGomo / 2, 0);
    gomo.rotation.z = -lado * inclinacao;
    gomo.castShadow = true;
    g.add(gomo);
  }

  const copa = new THREE.Group();
  copa.position.set(x, y, 0);
  g.add(copa);

  // Sete folhas em volta, cada uma com lâminas dos dois lados da nervura.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.random() * 0.2;
    const folha = new THREE.Group();
    // Folha comprida: o que faz um coqueiro ser reconhecido é a copa larga,
    // e não uma tufa em cima do tronco.
    const comprimento = 1.9 + Math.random() * 0.5;

    const nervura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.015, comprimento, 4),
      mat(0x4f9d3a)
    );
    nervura.rotation.z = Math.PI / 2;
    nervura.position.x = comprimento / 2;
    folha.add(nervura);

    const laminas = 9;
    for (let j = 0; j < laminas; j++) {
      const t = 0.12 + (j / laminas) * 0.86;
      const tamanho = (1 - t * 0.5) * 0.52;
      for (const s of [-1, 1]) {
        const lamina = new THREE.Mesh(
          new THREE.ConeGeometry(0.06, tamanho, 3),
          mat(j % 2 === 0 ? 0x5faf46 : 0x4a9138)
        );
        // A nervura arqueia: a lâmina desce mais quanto mais longe da base.
        lamina.position.set(comprimento * t, -t * t * 0.55, s * tamanho * 0.45);
        lamina.rotation.set(s * Math.PI / 2, 0, -0.45 - t * 0.45);
        folha.add(lamina);
      }
    }

    // A folha sai quase na horizontal e cai na ponta — é o arco que dá a
    // silhueta larga.
    folha.rotation.set(0, -a, 0.22 - Math.random() * 0.3);
    folha.children.forEach((peca) => { peca.castShadow = true; });
    copa.add(folha);
  }

  // Cachinho de cocos embaixo da copa.
  for (let i = 0; i < 3; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), mat(0x6b4a2f));
    const a = (i / 3) * Math.PI * 2;
    coco.position.set(Math.cos(a) * 0.14, -0.16, Math.sin(a) * 0.14);
    coco.castShadow = true;
    copa.add(coco);
  }

  return g;
}

// Cadeira de praia: assento reclinado com listras, do jeito que a criança
// desenharia — duas pernas na frente, duas atrás e o encosto inclinado.
function beachChair() {
  const g = new THREE.Group();
  const listras = pick([[0xff7bac, 0xffffff], [0xffd166, 0xffffff], [0x8ce9ff, 0xffffff]]);
  const madeira = 0xd9a86b;

  const assento = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const listra = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.13), mat(listras[i % 2]));
    listra.position.set(0, 0, -0.28 + i * 0.14);
    listra.castShadow = true;
    assento.add(listra);
  }
  assento.position.y = 0.42;
  assento.rotation.x = 0.12;
  g.add(assento);

  const encosto = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const listra = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.13, 0.05), mat(listras[i % 2]));
    listra.position.set(0, 0.1 + i * 0.14, 0);
    listra.castShadow = true;
    encosto.add(listra);
  }
  encosto.position.set(0, 0.44, -0.34);
  encosto.rotation.x = -0.55;
  g.add(encosto);

  for (const [x, z, altura] of [[-0.28, 0.26, 0.42], [0.28, 0.26, 0.42],
                                [-0.28, -0.34, 0.46], [0.28, -0.34, 0.46]]) {
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, altura, 5), mat(madeira));
    perna.position.set(x, altura / 2, z);
    perna.castShadow = true;
    g.add(perna);
  }

  return g;
}

// --- O que flutua no mar da Praia --------------------------------------------

function boat() {
  const g = new THREE.Group();
  const casco = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.7, 8, 1, false, 0, Math.PI), mat(pick([0xff7bac, 0xfff0a8, 0xffffff])));
  casco.rotation.set(0, 0, Math.PI / 2);
  casco.position.y = 0.3;
  casco.castShadow = true;
  g.add(casco);

  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5), mat(0xb08a5c));
  mastro.position.y = 1.1;
  g.add(mastro);

  const vela = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.3, 3),
    new THREE.MeshLambertMaterial({ color: pick([0xffffff, 0xffd9ef, 0xcaf0f8]), flatShading: true, side: THREE.DoubleSide })
  );
  vela.position.set(0.18, 1.15, 0);
  vela.rotation.y = Math.PI / 6;
  vela.castShadow = true;
  g.add(vela);

  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function surfboard() {
  const g = new THREE.Group();
  const cor = pick([0xff7bac, 0xffd166, 0x8ce9ff, 0xc4f0a8]);
  const prancha = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.5, 3, 7), mat(cor));
  prancha.rotation.set(Math.PI / 2, 0, 0);
  prancha.scale.y = 1;
  prancha.scale.z = 0.28;
  prancha.position.y = 0.12;
  prancha.castShadow = true;
  g.add(prancha);
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 1.5), mat(0xffffff));
  faixa.position.y = 0.2;
  g.add(faixa);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function buoy() {
  const g = new THREE.Group();
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 7), mat(0xff5d5d));
  bola.position.y = 0.28;
  bola.castShadow = true;
  g.add(bola);
  const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.14, 9), mat(0xffffff));
  faixa.position.y = 0.28;
  g.add(faixa);
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), mat(0x6b6070));
  haste.position.y = 0.72;
  g.add(haste);
  return g;
}

// Disco voador: o prato com a cúpula de vidro e as luzinhas em volta. Fica
// nas laterais do Espaço, parado no ar como quem observa a corrida.
function ufo() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 8), mat(0xb9c2d6));
  corpo.scale.set(1, 0.24, 1);
  corpo.position.y = 1.6;
  corpo.castShadow = true;
  g.add(corpo);

  const borda = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.07, 6, 16), mat(0x8a94ad));
  borda.rotation.x = Math.PI / 2;
  borda.position.y = 1.6;
  g.add(borda);

  const cupula = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({
      color: 0x9ad2ff, flatShading: true, transparent: true, opacity: 0.75,
      emissive: 0x9ad2ff, emissiveIntensity: 0.35,
    })
  );
  cupula.position.y = 1.72;
  g.add(cupula);

  // Luzinhas embaixo, em volta do prato.
  const cor = pick([0x8ce99a, 0xff8fd8, 0xffd166, 0x8ce9ff]);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const luz = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 6, 5),
      mat(cor, { emissive: cor, emissiveIntensity: 1.1 })
    );
    luz.position.set(Math.cos(a) * 0.5, 1.5, Math.sin(a) * 0.5);
    g.add(luz);
  }

  // O facho de luz apontando para baixo.
  const facho = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.5, 10, 1, true),
    new THREE.MeshBasicMaterial({
      color: cor, transparent: true, opacity: 0.16, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
  );
  facho.position.y = 0.78;
  g.add(facho);

  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

// --- Parque -----------------------------------------------------------------

const LISTRAS = [[0xff4d5e, 0xffffff], [0xffd166, 0xffffff], [0x4dc3ff, 0xffffff]];

function circusTent() {
  const g = new THREE.Group();
  const par = pick(LISTRAS);
  const parede = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 1, 12), mat(0xfff6ec));
  parede.position.y = 0.5;
  parede.castShadow = true;
  g.add(parede);
  // Cobertura em gomos alternados: é a listra que faz a tenda de circo.
  for (let i = 0; i < 12; i++) {
    const gomo = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 1.2, 1.1, 3, 1, true, (i / 12) * Math.PI * 2, Math.PI / 6),
      new THREE.MeshLambertMaterial({ color: par[i % 2], flatShading: true, side: THREE.DoubleSide })
    );
    gomo.position.y = 1.55;
    gomo.castShadow = true;
    g.add(gomo);
  }
  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), mat(0xd9a86b));
  mastro.position.y = 2.2;
  g.add(mastro);
  const bandeira = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), mat(par[0]));
  bandeira.rotation.z = -Math.PI / 2;
  bandeira.position.set(0.16, 2.4, 0);
  g.add(bandeira);
  return g;
}

function ferrisWheel() {
  const g = new THREE.Group();
  const cor = pick([0xff4d5e, 0x4dc3ff, 0xffd166]);
  for (const lado of [-0.3, 0.3]) {
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.4, 5), mat(0xb9c2d6));
    perna.position.set(lado, 1.2, 0);
    perna.rotation.z = -lado * 0.25;
    perna.castShadow = true;
    g.add(perna);
  }
  const aro = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.07, 6, 20), mat(cor));
  aro.position.y = 2.6;
  aro.castShadow = true;
  g.add(aro);
  // Raios e cabines: oito de cada, alternando a cor.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const raio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3, 0.06), mat(0xe8ecf5));
    raio.position.y = 2.6;
    raio.rotation.z = a;
    g.add(raio);
    const cabine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.24), mat(i % 2 ? 0xffffff : cor));
    cabine.position.set(Math.cos(a) * 1.5, 2.6 + Math.sin(a) * 1.5, 0);
    cabine.castShadow = true;
    g.add(cabine);
  }
  return g;
}

function cottonCandy() {
  const g = new THREE.Group();
  const palito = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5), mat(0xfff6ec));
  palito.position.y = 0.75;
  g.add(palito);
  const cor = pick([0xff9ecb, 0x9be7ff, 0xfff0a8]);
  for (let i = 0; i < 4; i++) {
    const nuvem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 - i * 0.04, 0), mat(cor));
    const a = (i / 4) * Math.PI * 2;
    nuvem.position.set(Math.cos(a) * 0.2, 1.6 + (i % 2) * 0.16, Math.sin(a) * 0.2);
    nuvem.castShadow = true;
    g.add(nuvem);
  }
  return g;
}

// Obstáculo do Parque: a caixa de pipoca listrada, tombada na pista.
function popcornBox() {
  const g = new THREE.Group();
  const par = pick(LISTRAS);
  for (let i = 0; i < 6; i++) {
    const listra = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.62), mat(par[i % 2]));
    listra.position.set(-0.35 + i * 0.14, 0.4, 0);
    listra.castShadow = true;
    g.add(listra);
  }
  for (let i = 0; i < 5; i++) {
    const pipoca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), mat(0xfff6dd));
    pipoca.position.set((Math.random() - 0.5) * 0.7, 0.85 + Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
    pipoca.castShadow = true;
    g.add(pipoca);
  }
  return g;
}

// --- Tempestade -------------------------------------------------------------

function windmill() {
  const g = new THREE.Group();
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 2.6, 8), mat(0xe0dcd2));
  torre.position.y = 1.3;
  torre.castShadow = true;
  g.add(torre);
  const telhado = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 8), mat(0x7a5c4a));
  telhado.position.y = 2.9;
  g.add(telhado);
  const eixo = new THREE.Group();
  eixo.position.set(0, 2.6, 0.5);
  eixo.rotation.z = Math.random() * Math.PI;
  for (let i = 0; i < 4; i++) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.05), mat(0xfff6ec));
    pa.position.y = 0.75;
    const braco = new THREE.Group();
    braco.rotation.z = (i / 4) * Math.PI * 2;
    braco.add(pa);
    eixo.add(braco);
  }
  g.add(eixo);
  return g;
}

function lightningRod() {
  const g = new THREE.Group();
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 3.2, 6), mat(0x8a94ad));
  haste.position.y = 1.6;
  haste.castShadow = true;
  g.add(haste);
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 5), mat(0xd6dcea));
  ponta.position.y = 3.4;
  g.add(ponta);
  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 6),
    mat(0xfff08a, { emissive: 0xfff08a, emissiveIntensity: 1 })
  );
  bola.position.y = 3.05;
  g.add(bola);
  return g;
}

function puddle() {
  const g = new THREE.Group();
  const raio = 0.8 + Math.random() * 0.7;
  const agua = new THREE.Mesh(
    new THREE.CircleGeometry(raio, 10),
    new THREE.MeshBasicMaterial({ color: 0x6b83a8, transparent: true, opacity: 0.55, depthWrite: false })
  );
  agua.rotation.x = -Math.PI / 2;
  agua.position.y = 0.03;
  g.add(agua);
  const brilho = new THREE.Mesh(
    new THREE.CircleGeometry(raio * 0.45, 8),
    new THREE.MeshBasicMaterial({ color: 0xd6e4ff, transparent: true, opacity: 0.4, depthWrite: false })
  );
  brilho.rotation.x = -Math.PI / 2;
  brilho.position.set(raio * 0.2, 0.05, -raio * 0.15);
  g.add(brilho);
  return g;
}

function barrel() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.36, 0.85, 10), mat(0x8a5c3c));
  corpo.position.y = 0.43;
  corpo.rotation.z = 0.12;
  corpo.castShadow = true;
  g.add(corpo);
  for (const y of [0.2, 0.66]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.045, 5, 12), mat(0x5c6270));
    aro.rotation.x = Math.PI / 2;
    aro.position.y = y;
    g.add(aro);
  }
  return g;
}

// --- Bruma ------------------------------------------------------------------

function ghostTree() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.6, 6), mat(0x9a93a8));
  tronco.position.y = 1.3;
  tronco.castShadow = true;
  g.add(tronco);
  for (let i = 0; i < 5; i++) {
    const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.1, 5), mat(0x877f96));
    const a = (i / 5) * Math.PI * 2;
    galho.position.set(Math.cos(a) * 0.3, 2.2 + (i % 2) * 0.3, Math.sin(a) * 0.3);
    galho.rotation.set(Math.cos(a) * 0.8, 0, -Math.sin(a) * 0.8 - 0.5);
    galho.castShadow = true;
    g.add(galho);
  }
  return g;
}

function floatingLantern() {
  const g = new THREE.Group();
  const cor = pick([0xffd9a8, 0xd9c2ff, 0xa8e6ff]);
  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.44, 0.34),
    mat(cor, { emissive: cor, emissiveIntensity: 0.95, transparent: true, opacity: 0.85 })
  );
  vidro.position.y = 1.7;
  g.add(vidro);
  for (const y of [1.46, 1.94]) {
    const tampa = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.42), mat(0x6b6478));
    tampa.position.y = y;
    g.add(tampa);
  }
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 8, 6),
    new THREE.MeshBasicMaterial({
      color: cor, transparent: true, opacity: 0.14, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.position.y = 1.7;
  g.add(halo);
  return g;
}

function mossRock() {
  const g = new THREE.Group();
  const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat(0x8a8496));
  pedra.position.y = 0.42;
  pedra.rotation.set(Math.random(), Math.random(), Math.random());
  pedra.castShadow = true;
  g.add(pedra);
  for (let i = 0; i < 3; i++) {
    const musgo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(0x9ab894));
    musgo.position.set((Math.random() - 0.5) * 0.6, 0.75, (Math.random() - 0.5) * 0.6);
    musgo.scale.y = 0.45;
    g.add(musgo);
  }
  return g;
}

// --- Caverna ----------------------------------------------------------------

function crystalVein() {
  const g = new THREE.Group();
  const cor = pick([0x8ce9ff, 0xc7a6ff, 0xff9ecb]);
  for (let i = 0; i < 5; i++) {
    const espinho = new THREE.Mesh(
      new THREE.ConeGeometry(0.16 + Math.random() * 0.1, 0.8 + Math.random() * 1.1, 5),
      mat(cor, { emissive: cor, emissiveIntensity: 0.9 })
    );
    const a = (i / 5) * Math.PI * 2;
    espinho.position.set(Math.cos(a) * 0.35, espinho.geometry.parameters.height / 2, Math.sin(a) * 0.35);
    espinho.rotation.z = Math.cos(a) * 0.3;
    espinho.castShadow = true;
    g.add(espinho);
  }
  g.add(warningRing(cor));
  return g;
}

function stalagmite() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.3 - i * 0.07, 1.4 - i * 0.35, 6),
      mat(i % 2 ? 0x6b6478 : 0x585268)
    );
    cone.position.set((i - 1) * 0.42, cone.geometry.parameters.height / 2, (Math.random() - 0.5) * 0.4);
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

function glowPool() {
  const g = new THREE.Group();
  const cor = pick([0x8ce9ff, 0xc7a6ff]);
  const raio = 0.9 + Math.random() * 0.6;
  const poca = new THREE.Mesh(
    new THREE.CircleGeometry(raio, 10),
    mat(cor, { emissive: cor, emissiveIntensity: 0.8 })
  );
  poca.rotation.x = -Math.PI / 2;
  poca.position.y = 0.04;
  g.add(poca);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), mat(0x4a4558));
    pedra.position.set(Math.cos(a) * raio, 0.08, Math.sin(a) * raio);
    pedra.scale.y = 0.6;
    g.add(pedra);
  }
  return g;
}

// --- Vilarejo ---------------------------------------------------------------

function cottage() {
  const g = new THREE.Group();
  const parede = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.3), mat(0xf0e2c8));
  parede.position.y = 0.6;
  parede.castShadow = true;
  g.add(parede);
  const telhado = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.9, 4), mat(pick([0xc2603f, 0xa8503a, 0xd6764f])));
  telhado.position.y = 1.65;
  telhado.rotation.y = Math.PI / 4;
  telhado.castShadow = true;
  g.add(telhado);
  const porta = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.06), mat(0x8a5c3c));
  porta.position.set(0, 0.35, 0.68);
  g.add(porta);
  for (const x of [-0.45, 0.45]) {
    const janela = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.06), mat(0xffe9a8, { emissive: 0xffe9a8, emissiveIntensity: 0.5 }));
    janela.position.set(x, 0.75, 0.68);
    g.add(janela);
  }
  const chamine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.22), mat(0x9a8a78));
  chamine.position.set(0.45, 1.9, -0.3);
  g.add(chamine);
  return g;
}

function lamppost() {
  const g = new THREE.Group();
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.2, 6), mat(0x4a4a52));
  poste.position.y = 1.1;
  poste.castShadow = true;
  g.add(poste);
  const luz = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.36, 0.3),
    mat(0xffe0a0, { emissive: 0xffe0a0, emissiveIntensity: 1 })
  );
  luz.position.y = 2.35;
  g.add(luz);
  const capa = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.22, 4), mat(0x3a3a42));
  capa.position.y = 2.62;
  capa.rotation.y = Math.PI / 4;
  g.add(capa);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 8, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffe0a0, transparent: true, opacity: 0.12, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.position.y = 2.35;
  g.add(halo);
  return g;
}

function well() {
  const g = new THREE.Group();
  const muro = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.6, 10), mat(0x9a8a78));
  muro.position.y = 0.3;
  muro.castShadow = true;
  g.add(muro);
  const agua = new THREE.Mesh(new THREE.CircleGeometry(0.44, 10), mat(0x4a6b8a));
  agua.rotation.x = -Math.PI / 2;
  agua.position.y = 0.52;
  g.add(agua);
  for (const x of [-0.5, 0.5]) {
    const pilar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), mat(0x8a5c3c));
    pilar.position.set(x, 0.85, 0);
    g.add(pilar);
  }
  const telhado = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.45, 4), mat(0xc2603f));
  telhado.position.y = 1.6;
  telhado.rotation.y = Math.PI / 4;
  telhado.castShadow = true;
  g.add(telhado);
  return g;
}

function crate() {
  const g = new THREE.Group();
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.75, 0.8), mat(0xb08a5c));
  caixa.position.y = 0.38;
  caixa.rotation.y = Math.random() * 0.6;
  caixa.castShadow = true;
  g.add(caixa);
  for (const [a, ey] of [[0, 0.38], [Math.PI / 2, 0.38]]) {
    const tabua = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 0.84), mat(0x8a6a44));
    tabua.position.y = ey;
    tabua.rotation.y = caixa.rotation.y + a;
    g.add(tabua);
  }
  return g;
}

const DECORATIONS = {
  tree, pineTree, mushroom, glowMushroom, crystal, flower, flowerPatch,
  lollipop, cupcake, candyCane, sprinkles, chocolate,
  cloudHill, balloon, rainbowArch,
  strawberry, orangeTree, bananaBunch, watermelonPatch, orangePile, grapes, kiwi,
  coral, seaweed, starfish,
  lavaRock, emberVent, charredTree, lavaPool,
  snowPine, igloo, iceCrystal, snowman,
  planet, asteroid, asteroidChunk, ufo,
  parasol, sandcastle, palmTree, beachChair,
  boat, surfboard, buoy,
  circusTent, ferrisWheel, cottonCandy,
  windmill, lightningRod, puddle,
  ghostTree, floatingLantern, mossRock,
  crystalVein, stalagmite, glowPool,
  cottage, lamppost, well,
};

// `nomes` deixa a pista pedir um conjunto específico — é como a Praia põe
// enfeite de areia num lado e de mar no outro.
export function createDecoration(track, nomes = track.decorations) {
  const build = DECORATIONS[pick(nomes)] || tree;
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
  lavaBoulder, iceBlock, meteor,
  popcornBox, barrel, crate, stalagmite,
};

export function createObstacle(track) {
  const build = OBSTACLES[pick(track.obstacles)] || rock;
  const obj = build();
  obj.userData.kind = 'obstacle';
  return obj;
}

// --- Barreira: o obstáculo que ocupa as três pistas -------------------------
//
// Dela não dá para desviar, só pular — por isso ela é montada para ser lida
// de longe e para parecer baixa. São três coisas juntas: a faixa no chão,
// que chega na tela antes da trave e avisa; a trave na altura do joelho; e
// os enfeites em cima, com a cara da pista.
//
// A altura total fica em ~1,0, abaixo do 1,1 que a colisão libera no pulo
// (ver Game.checkCollisions): quem pula passa com folga visível.

const BARRIER_WIDTH = 6.9;      // as três pistas inteiras, com sobra nas pontas
export const BARRIER_HALF_WIDTH = 3.45;

// A cor do aviso é sempre saturada: o chão de todas as pistas é claro
// (rosa, creme, lilás), e num tom pastel a faixa simplesmente desaparece.
const BARRIER_LOOKS = {
  campo:  { bar: 0x9c7247, post: 0x7a5836, warn: 0xff9500, top: 'flor' },
  doces:  { bar: 0xff7bac, post: 0xfff1f6, warn: 0xff2d7a, top: 'bala' },
  ceu:    { bar: 0xe4edff, post: 0xbfd4ff, warn: 0x2f9bff, top: 'nuvem' },
  frutas: { bar: 0x86c765, post: 0x5d9445, warn: 0xff6b35, top: 'melancia' },
  oceano: { bar: 0x4fb6c9, post: 0x2f8ea1, warn: 0x00b4d8, top: 'coral' },
  noite:  { bar: 0x8a80e0, post: 0x4c4497, warn: 0x59e8ff, top: 'cristal' },
  vulcao: { bar: 0x3b3340, post: 0x241f29, warn: 0xff6b1f, top: 'brasa' },
  geada:  { bar: 0xdff4ff, post: 0x9ed8f5, warn: 0x2f9bff, top: 'gelo' },
  espaco: { bar: 0x6b6478, post: 0x413c52, warn: 0xffd166, top: 'planeta' },
  praia:  { bar: 0xe8ca94, post: 0xb08a5c, warn: 0xff6b35, top: 'concha' },
  parque: { bar: 0xff4d5e, post: 0xfff6ec, warn: 0xffd166, top: 'bala' },
  tempestade: { bar: 0x8a94ad, post: 0x5c6270, warn: 0xfff08a, top: 'cristal' },
  bruma:  { bar: 0x9a93a8, post: 0x6b6478, warn: 0xd9c2ff, top: 'nuvem' },
  caverna: { bar: 0x6b6478, post: 0x413c52, warn: 0x8ce9ff, top: 'cristal' },
  vilarejo: { bar: 0xb08a5c, post: 0x8a6a44, warn: 0xffb02e, top: 'flor' },
};

// Setas chapadas no chão, apontando para a barreira: o aviso que a criança
// entende sem ler.
function barrierArrow(color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, -0.42, -0.32, 0, 0.24, 0.32, 0, 0.24,
  ], 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide,
  }));
}

const BARRIER_TOPS = {
  flor: () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xffd166)));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petala = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(pick([0xff9ecb, 0xffb3d1])));
      petala.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
      petala.scale.y = 0.5;
      g.add(petala);
    }
    return g;
  },
  bala: () => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 7), mat(pick(CANDY)));
    b.scale.y = 1.15;
    return b;
  },
  nuvem: () => {
    const g = new THREE.Group();
    for (const [x, r] of [[-0.13, 0.11], [0, 0.16], [0.14, 0.1]]) {
      const bola = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(0xffffff));
      bola.position.x = x;
      g.add(bola);
    }
    return g;
  },
  melancia: () => {
    const g = new THREE.Group();
    const casca = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat(0x4f9d3a));
    casca.scale.set(1, 0.85, 1);
    g.add(casca);
    const listra = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 5, 12), mat(0x2f7a26));
    listra.rotation.x = Math.PI / 2;
    g.add(listra);
    return g;
  },
  coral: () => {
    const g = new THREE.Group();
    const color = pick([0xff9ecb, 0xffb26b, 0x8ce9ff]);
    for (let i = 0; i < 3; i++) {
      const galho = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26 - i * 0.04, 5), mat(color));
      galho.position.set((i - 1) * 0.11, 0.1, 0);
      galho.rotation.z = (i - 1) * 0.35;
      g.add(galho);
    }
    return g;
  },
  brasa: () => {
    const cor = pick(LAVA);
    return new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.16, 0),
      mat(cor, { emissive: cor, emissiveIntensity: 1.05 })
    );
  },
  gelo: () => {
    const cor = pick(GELO);
    return new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.34, 5),
      new THREE.MeshLambertMaterial({
        color: cor, flatShading: true, transparent: true, opacity: 0.85,
        emissive: cor, emissiveIntensity: 0.3,
      })
    );
  },
  planeta: () => {
    const g = new THREE.Group();
    const cor = pick(PLANETAS);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(cor)));
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 5, 12), mat(0xfff0c9));
    anel.rotation.set(Math.PI / 2.3, 0, 0.3);
    g.add(anel);
    return g;
  },
  concha: () => {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 8, 5, 0, Math.PI),
      mat(pick([0xffd9ef, 0xfff0c9, 0xffc2e4]))
    );
    c.rotation.x = -Math.PI / 2;
    c.scale.z = 0.6;
    return c;
  },
  cristal: () => {
    const color = pick([0x8ce9ff, 0xc7a6ff]);
    const c = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.17, 0),
      mat(color, { emissive: color, emissiveIntensity: 0.95 })
    );
    return c;
  },
};

export function createBarrier(track) {
  const look = BARRIER_LOOKS[track.id] || BARRIER_LOOKS.campo;
  const g = new THREE.Group();

  // A faixa vem 2,4 à frente da trave: como a pista corre na direção do
  // jogador, é ela que entra na tela primeiro e dá o aviso.
  const faixa = new THREE.Mesh(
    new THREE.PlaneGeometry(BARRIER_WIDTH, 1.5),
    new THREE.MeshBasicMaterial({
      color: look.warn, transparent: true, opacity: 0.55, depthWrite: false,
    })
  );
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.set(0, 0.04, 2.4);
  g.add(faixa);

  for (let i = -2; i <= 2; i++) {
    const seta = barrierArrow(look.warn);
    seta.position.set(i * 1.5, 0.06, 2.4);
    g.add(seta);
  }

  const trave = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, BARRIER_WIDTH, 8),
    mat(look.bar)
  );
  trave.rotation.z = Math.PI / 2;
  trave.position.y = 0.6;
  trave.castShadow = true;
  g.add(trave);

  for (const x of [-3.25, -1.1, 1.1, 3.25]) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.7, 6), mat(look.post));
    poste.position.set(x, 0.35, 0);
    poste.castShadow = true;
    g.add(poste);
  }

  const enfeite = BARRIER_TOPS[look.top] || BARRIER_TOPS.flor;
  for (let i = -2; i <= 2; i++) {
    const topo = enfeite();
    topo.position.set(i * 1.5, 0.8, 0);
    g.add(topo);
  }

  g.userData.kind = 'obstacle';
  // A colisão precisa saber que essa aqui pega a pista toda, e não só uma
  // faixa em volta do centro (ver Game.checkCollisions).
  g.userData.halfWidth = BARRIER_HALF_WIDTH;
  return g;
}

// --- Fundo ------------------------------------------------------------------

// Cristas de onda: barras claras e translúcidas deitadas na água. Elas
// correm com o mundo e sobem e descem no lugar (ver World.update), o que dá
// o movimento da água sem custar nada de geometria.
export function createWaveCrest(color) {
  const g = new THREE.Group();
  const largura = 3 + Math.random() * 5;
  const crista = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, 0.7),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  crista.rotation.x = -Math.PI / 2;
  g.add(crista);
  g.userData.fase = Math.random() * Math.PI * 2;
  g.userData.largura = largura;
  return g;
}

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

// Faísca do Vulcão: um ponto quente que sobe sempre, apagando no caminho —
// como a brasa que sai de uma fogueira. Quem devolve para baixo é o ciclo da
// animação, igual à bolha do Oceano.
export function createSpark() {
  const g = new THREE.Group();
  const color = pick([0xffc24d, 0xff9500, 0xff6b1f]);

  const brasa = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 6, 5),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  g.add(brasa);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 8, 6),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.28, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    })
  );
  g.add(halo);

  g.userData.parts = { brasa, halo, subida: 1.6 + Math.random() * 1.4 };
  return g;
}

// Fumaça: três bolotas cinzentas que sobem devagar, crescendo e sumindo.
export function createSmoke() {
  const g = new THREE.Group();
  const bolotas = [];
  for (let i = 0; i < 3; i++) {
    const bolota = new THREE.Mesh(
      new THREE.SphereGeometry(0.34 + i * 0.1, 7, 6),
      new THREE.MeshBasicMaterial({
        color: 0x6b6070, transparent: true, opacity: 0.2, depthWrite: false, fog: false,
      })
    );
    bolota.position.set((Math.random() - 0.5) * 0.4, i * 0.45, (Math.random() - 0.5) * 0.4);
    g.add(bolota);
    bolotas.push(bolota);
  }
  g.userData.parts = { bolotas, subida: 0.5 + Math.random() * 0.4 };
  return g;
}

// Floco de neve: o único que **desce** em vez de subir. Roda enquanto cai.
export function createSnowflake() {
  const g = new THREE.Group();
  const nucleo = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 5, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
  );
  g.add(nucleo);
  for (let i = 0; i < 3; i++) {
    const braco = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.03, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xf2f8ff, transparent: true, opacity: 0.85, fog: false })
    );
    braco.rotation.z = (i / 3) * Math.PI;
    g.add(braco);
  }
  g.userData.parts = { queda: 0.9 + Math.random() * 0.8 };
  return g;
}

// Gaivota: branca com a ponta da asa escura, asa comprida de planar. Bate
// devagar e passa mais tempo aberta que fechada — é o que a diferencia do
// passarinho do Céu, que é miúdo e nervoso.
export function createSeagull() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.34, 3, 6), mat(0xffffff));
  corpo.rotation.z = Math.PI / 2;
  g.add(corpo);

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 6), mat(0xffffff));
  cabeca.position.set(0.28, 0.05, 0);
  g.add(cabeca);

  const bico = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 5), mat(0xffb02e));
  bico.rotation.z = -Math.PI / 2;
  bico.position.set(0.44, 0.03, 0);
  g.add(bico);

  const cauda = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), mat(0xf2f2f7));
  cauda.rotation.z = Math.PI / 2;
  cauda.position.set(-0.3, 0.02, 0);
  g.add(cauda);

  const wings = [];
  for (const side of [-1, 1]) {
    const asa = new THREE.Group();
    const dentro = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.52), mat(0xffffff));
    dentro.position.z = side * 0.28;
    asa.add(dentro);
    const fora = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.032, 0.42), mat(0xffffff));
    fora.position.set(-0.04, 0, side * 0.72);
    asa.add(fora);
    const ponta = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.2), mat(0x6b6478));
    ponta.position.set(-0.07, 0, side * 1.02);
    asa.add(ponta);
    asa.userData.side = side;
    g.add(asa);
    wings.push(asa);
  }
  g.userData.parts = { wings };
  return g;
}

// Meteorito: a pedrinha com o rastro aceso atrás. Ele cruza o campo de
// visão girando, e o rastro aponta para onde ele veio.
export function createMeteorite() {
  const g = new THREE.Group();
  const cor = pick([0xffc24d, 0x8ce9ff, 0xff8fd8]);
  const raio = 0.17 + Math.random() * 0.11;

  // Núcleo: três pedras encaixadas em vez de uma bola só, para a silhueta
  // ficar irregular como pedra de verdade.
  const pedra = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const lasca = new THREE.Mesh(
      new THREE.DodecahedronGeometry(raio * (1 - i * 0.22), 0),
      new THREE.MeshLambertMaterial({
        color: i === 0 ? 0x7a7288 : 0x5c556b, flatShading: true, fog: false,
      })
    );
    lasca.position.set((Math.random() - 0.5) * raio, (Math.random() - 0.5) * raio, (Math.random() - 0.5) * raio);
    lasca.rotation.set(Math.random(), Math.random(), Math.random());
    pedra.add(lasca);
  }
  // A frente da pedra fica em brasa, como se estivesse esquentando no voo.
  const frente = new THREE.Mesh(
    new THREE.SphereGeometry(raio * 0.7, 8, 6),
    new THREE.MeshBasicMaterial({
      color: cor, transparent: true, opacity: 0.6, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    })
  );
  frente.position.x = raio * 0.5;
  pedra.add(frente);
  g.add(pedra);

  // Cauda em três camadas: a de dentro curta e forte, a de fora comprida e
  // fraca. É isso que dá profundidade em vez de um cone chapado.
  const rastro = new THREE.Group();
  const comprimento = 1.5 + Math.random() * 1.1;
  for (let i = 0; i < 3; i++) {
    const camada = new THREE.Mesh(
      new THREE.ConeGeometry(raio * (0.85 - i * 0.18), comprimento * (0.5 + i * 0.32), 7, 1, true),
      new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xffffff : cor,
        transparent: true, opacity: 0.5 - i * 0.14, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      })
    );
    camada.rotation.z = -Math.PI / 2;
    camada.position.x = -(camada.geometry.parameters.height / 2);
    rastro.add(camada);
  }
  g.add(rastro);

  // Fagulhas soltas na esteira, cada uma na sua distância.
  const fagulhas = [];
  for (let i = 0; i < 5; i++) {
    const fagulha = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 5, 4),
      new THREE.MeshBasicMaterial({
        color: cor, transparent: true, opacity: 0.7, depthWrite: false,
        blending: THREE.AdditiveBlending, fog: false,
      })
    );
    fagulha.userData.dist = 0.4 + Math.random() * comprimento;
    fagulha.userData.desvio = (Math.random() - 0.5) * 0.22;
    g.add(fagulha);
    fagulhas.push(fagulha);
  }

  const brilho = new THREE.Mesh(
    new THREE.SphereGeometry(raio * 1.6, 8, 6),
    new THREE.MeshBasicMaterial({
      color: cor, transparent: true, opacity: 0.3, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    })
  );
  g.add(brilho);

  g.userData.parts = { pedra, rastro, brilho, fagulhas, giro: 0.6 + Math.random() * 1.4 };
  return g;
}

// Pingo de chuva: um risco fino caindo rápido. É o irmão do floco de neve,
// mas em vez de girar ele desce reto e depressa — é isso que faz parecer
// chuva e não neve.
export function createRaindrop() {
  const pingo = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.022, 0.34, 2, 5),
    new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.7, fog: false })
  );
  pingo.userData.parts = { queda: 5 + Math.random() * 3 };
  return pingo;
}

const AMBIENCE = {
  firefly: createFirefly, butterfly, bee, bird, fish, bubble, ant,
  spark: createSpark, smoke: createSmoke, snow: createSnowflake,
  seagull: createSeagull, meteorite: createMeteorite, rain: createRaindrop,
};

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

  if (kind === 'meteorite') {
    // Atravessa na diagonal, girando, e o brilho pulsa. O rastro fica para
    // trás porque o grupo inteiro é virado para a direção do voo.
    parts.pedra.rotation.set(t * parts.giro, t * parts.giro * 1.3, 0);
    parts.brilho.scale.setScalar(0.8 + Math.sin(elapsed * 6 + phase) * 0.25);
    // A cauda pulsa e as fagulhas tremem na esteira.
    parts.rastro.scale.x = 0.85 + Math.sin(elapsed * 8 + phase) * 0.18;
    for (const fagulha of parts.fagulhas) {
      const d = fagulha.userData.dist;
      fagulha.position.set(-d, fagulha.userData.desvio + Math.sin(elapsed * 9 + d * 4) * 0.05, 0);
      fagulha.material.opacity = 0.7 * (1 - d / (parts.fagulhas.length + 1.5));
    }
    item.rotation.y = -0.5 - Math.sin(phase) * 0.5;
    item.rotation.z = 0.25 + Math.sin(phase) * 0.2;
    const ciclo = 26;
    const andou = (elapsed * (2.2 + speed) + phase * 5) % ciclo;
    return { x: andou - ciclo / 2, y: Math.sin(t * 0.4) * 2.5 };
  }

  if (kind === 'seagull') {
    // Planando: a asa sobe e desce devagar, e ela inclina na curva.
    const bate = Math.sin(elapsed * 2.4 + phase);
    for (const asa of parts.wings) asa.rotation.x = asa.userData.side * bate * 0.45;
    item.rotation.y = Math.sin(t * 0.35) * 0.5;
    item.rotation.z = Math.sin(t * 0.35 + 1) * 0.12;
    return { x: Math.sin(t * 0.45) * 3.4, y: Math.sin(t * 0.7) * 1.1 };
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

  if (kind === 'spark') {
    // Sobe num ciclo de 7 e vai apagando; perto do fim some de vez, para o
    // salto de volta ao chão não aparecer.
    const ciclo = 7;
    const subiu = (elapsed * parts.subida + phase * 2) % ciclo;
    const restante = 1 - subiu / ciclo;
    parts.brasa.material.opacity = restante;
    parts.brasa.material.transparent = true;
    parts.halo.material.opacity = restante * 0.3;
    parts.halo.scale.setScalar(0.7 + restante * 0.6);
    return { x: Math.sin(t * 1.8) * 0.5, y: subiu };
  }

  if (kind === 'smoke') {
    // Mais lenta e mais alta que a faísca: cresce, desbota e recomeça.
    const ciclo = 11;
    const subiu = (elapsed * parts.subida + phase * 3) % ciclo;
    const andamento = subiu / ciclo;
    item.scale.setScalar(0.6 + andamento * 1.5);
    for (const bolota of parts.bolotas) {
      bolota.material.opacity = 0.24 * (1 - andamento) * (1 - andamento);
    }
    return { x: Math.sin(t * 0.5) * 0.9, y: subiu };
  }

  if (kind === 'rain') {
    // Desce reto e rápido, num ciclo curto: nenhuma volta, nenhum balanço.
    const ciclo = 12;
    const caiu = (elapsed * parts.queda + phase * 4) % ciclo;
    return { x: 0, y: ciclo - caiu };
  }

  if (kind === 'snow') {
    // Cai num ciclo de 8, girando; ao chegar embaixo reaparece lá em cima.
    const ciclo = 8;
    const caiu = (elapsed * parts.queda + phase * 3) % ciclo;
    item.rotation.z = t * 1.2;
    return { x: Math.sin(t * 0.9) * 1.4, y: ciclo - caiu };
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

// `abaixo` põe metade das estrelas embaixo da linha da pista: no Espaço, onde
// não existe chão, ver estrela por baixo é o que fecha a sensação de estar
// voando no meio delas.
export function createStars(count = 90, abaixo = false) {
  const stars = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.35, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0xfff8e0, fog: false });
  for (let i = 0; i < count; i++) {
    const star = new THREE.Mesh(geo, material);
    const embaixo = abaixo && i % 2 === 1;
    star.position.set(
      (Math.random() - 0.5) * 220,
      embaixo ? -8 - Math.random() * 50 : 12 + Math.random() * 55,
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

  // Sem `ground` não existe chão nenhum: só a faixa da pista, flutuando no
  // vazio. É assim que o Espaço fica parecendo voo, e não estrada.
  if (track.ground) {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(120, 400), mat(track.ground));
    grass.rotation.x = -Math.PI / 2;
    grass.position.z = -140;
    grass.receiveShadow = true;
    g.add(grass);
  }

  // Pista de beira-mar: um lado é areia, o outro é água. O chão base fica
  // por baixo, e cada metade entra como uma placa própria — a da água um
  // pouquinho mais baixa, para a areia terminar num degrauzinho.
  if (track.shore) {
    const { side = 1, sand, sea, foam } = track.shore;
    const areia = new THREE.Mesh(new THREE.PlaneGeometry(56, 400), mat(sand));
    areia.rotation.x = -Math.PI / 2;
    areia.position.set(side * 31.8, 0.012, -140);
    areia.receiveShadow = true;
    g.add(areia);

    const agua = new THREE.Mesh(new THREE.PlaneGeometry(56, 400), mat(sea));
    agua.rotation.x = -Math.PI / 2;
    agua.position.set(-side * 31.8, -0.05, -140);
    g.add(agua);

    // Espuma na beirada: a linha branca onde a água encontra a pista.
    const espuma = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 400),
      new THREE.MeshBasicMaterial({ color: foam, transparent: true, opacity: 0.55, depthWrite: false })
    );
    espuma.rotation.x = -Math.PI / 2;
    espuma.position.set(-side * 4.9, 0.03, -140);
    g.add(espuma);
  }

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
