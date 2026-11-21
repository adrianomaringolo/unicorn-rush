// Cenário: chão, enfeites das laterais, obstáculos e o fundo (arco-íris,
// nuvens, lua, estrelas e montanhas). Tudo gerado por código, e tudo
// colorido de acordo com a pista escolhida (ver src/game/tracks.js).
import * as THREE from 'three';

const mat = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Junta várias peças da mesma cor numa geometria só: `pecas` é uma lista de
// [geometria, matriz]. Um enfeite que aparece dezenas de vezes na pista sai
// muito mais barato como uma malha do que como trinta — cada malha é um
// desenho a mais por quadro, e no celular é isso que pesa.
function juntar(pecas) {
  const posicoes = [];
  const normais = [];
  for (const [geo, matriz] of pecas) {
    const solta = geo.index ? geo.toNonIndexed() : geo.clone();
    solta.applyMatrix4(matriz);
    if (!solta.attributes.normal) solta.computeVertexNormals();
    posicoes.push(...solta.attributes.position.array);
    normais.push(...solta.attributes.normal.array);
    solta.dispose();
  }
  const junto = new THREE.BufferGeometry();
  junto.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
  junto.setAttribute('normal', new THREE.Float32BufferAttribute(normais, 3));
  return junto;
}

// A matriz que põe uma peça em `ponto`, com o eixo Y dela apontando para `dir`.
const CIMA = new THREE.Vector3(0, 1, 0);
function apontar(ponto, dir, escala = 1) {
  const q = new THREE.Quaternion().setFromUnitVectors(CIMA, dir.clone().normalize());
  return new THREE.Matrix4().compose(ponto, q, new THREE.Vector3(escala, escala, escala));
}
const naPosicao = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

const PASTEL = [0xffb3d1, 0xb8f2c9, 0xbfd7ff, 0xffe6a7, 0xd9c2ff];
const CANDY = [0xff8fc0, 0xffd166, 0x9ce0ff, 0xffb3e6, 0xc4f0a8];
const AUTUMN = [0xd9822b, 0xc94f2f, 0xe0a83f, 0xb8672f];
const JUNGLE_GREENS = [0x2f8f4a, 0x3fae55, 0x246b38, 0x4fbf63];

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

// --- Ajudantes dos doces ------------------------------------------------------

// Pinta uma malha em duas cores, triângulo a triângulo, a partir das
// coordenadas UV dela: `qual(u, v)` diz se aquele pedaço é da cor A. É o
// jeito de ter listra em espiral de bengala numa peça só — os anéis colados
// por fora de antes paravam na curva e saltavam do corpo.
//
// A cor vai pelo meio do triângulo (meio entre o menor e o maior UV), que é
// igual nos dois triângulos de cada quadradinho: assim a borda da listra
// segue a malha em vez de sair serrilhada.
function pintarDuasCores(geo, qual, corA, corB) {
  const malha = geo.index ? geo.toNonIndexed() : geo;
  const uv = malha.attributes.uv;
  const total = malha.attributes.position.count;
  const cores = new Float32Array(total * 3);
  const a = new THREE.Color(corA), b = new THREE.Color(corB);
  const meio = (f, t) => {
    const v = [f(t), f(t + 1), f(t + 2)];
    return (Math.min(...v) + Math.max(...v)) / 2;
  };
  for (let t = 0; t < total; t += 3) {
    const u = meio((i) => uv.getX(i), t);
    const v = meio((i) => uv.getY(i), t);
    const cor = qual(u, v) ? a : b;
    for (let k = 0; k < 3; k++) cores.set([cor.r, cor.g, cor.b], (t + k) * 3);
  }
  malha.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  return malha;
}
const tintaDaMalha = (extra = {}) => mat(0xffffff, { vertexColors: true, ...extra });

// Listra em espiral: `voltas` listras dando a volta ao longo do comprimento.
// `ao` diz qual coordenada UV corre ao longo da peça (no tubo é u, no
// cilindro é v).
const espiral = (voltas, ao = 'u') => (u, v) => {
  const ao_longo = ao === 'u' ? u : v;
  const em_volta = ao === 'u' ? v : u;
  return ((ao_longo * voltas + em_volta) % 1 + 1) % 1 < 0.5;
};

const GRANULADO = [0xff5d8f, 0xffd166, 0x4cc9f0, 0x8ce99a, 0xffffff, 0xc77dff];
const granuloGeo = new THREE.CapsuleGeometry(0.018, 0.06, 2, 4);
function granulo() {
  const m = new THREE.Mesh(granuloGeo, mat(pick(GRANULADO)));
  m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  return m;
}

// Os pares do pirulito: [espiral, fundo].
const PIRULITO_CORES = [
  [0xff5d8f, 0xfff0f6], [0x9b5de5, 0xffd166], [0x4cc9f0, 0xfff0f6], [0xff9f1c, 0xffe66d],
];

// Pirulito: o disco tem a espiral de duas cores pintada nas duas faces, e um
// lacinho no palito. O de antes tinha uma rosca branca colada na frente, e
// lia como argola, não como pirulito.
function lollipop() {
  const g = new THREE.Group();
  const [corA, corB] = pick(PIRULITO_CORES);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6), mat(0xfff8e8));
  stick.position.y = 0.85;
  stick.castShadow = true;
  g.add(stick);

  const R = 0.62;
  const disco = new THREE.Group();
  disco.position.y = 1.9;
  g.add(disco);
  const borda = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.16, 40), mat(corA));
  borda.rotation.x = Math.PI / 2;
  borda.castShadow = true;
  disco.add(borda);

  // A espiral pela posição de cada triângulo: raio e ângulo juntos. Malha
  // de anel com muitos gomos e aros, para a curva sair redonda.
  const face = new THREE.RingGeometry(0.001, R, 120, 36).toNonIndexed();
  const pos = face.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  const a = new THREE.Color(corA), b = new THREE.Color(corB);
  const VOLTAS = 3;
  for (let t = 0; t < pos.count; t += 3) {
    const x = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3;
    const y = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3;
    const fase = (Math.hypot(x, y) / R) * VOLTAS - Math.atan2(y, x) / (Math.PI * 2);
    const cor = ((fase % 1) + 1) % 1 < 0.5 ? a : b;
    for (let k = 0; k < 3; k++) cores.set([cor.r, cor.g, cor.b], (t + k) * 3);
  }
  face.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  for (const lado of [1, -1]) {
    const m = new THREE.Mesh(face, tintaDaMalha({ side: THREE.DoubleSide }));
    m.position.z = lado * 0.081;
    disco.add(m);
  }

  // Lacinho logo abaixo do disco.
  const fita = mat(pick([0xff5d8f, 0x4cc9f0, 0xffd166]));
  for (const lado of [-1, 1]) {
    const aba = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), fita);
    aba.rotation.z = lado * Math.PI / 2;
    aba.position.set(lado * 0.12, 1.22, 0.02);
    aba.scale.z = 0.5;
    g.add(aba);
  }
  const no = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), fita);
  no.position.set(0, 1.22, 0.03);
  g.add(no);
  return g;
}

// Bolinho: forminha de papel pregueada, cobertura feita em espiral como sai
// do saco de confeitar, granulado e uma cereja com cabinho.
function cupcake() {
  const g = new THREE.Group();

  // As pregas: os vértices da forminha alternam para dentro e para fora.
  const PREGAS = 24;
  const forminhaGeo = new THREE.CylinderGeometry(0.45, 0.34, 0.6, PREGAS, 1, true);
  const pos = forminhaGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    const prega = Math.round((ang / (Math.PI * 2)) * PREGAS) % 2 ? 1.06 : 0.97;
    pos.setX(i, pos.getX(i) * prega);
    pos.setZ(i, pos.getZ(i) * prega);
  }
  forminhaGeo.computeVertexNormals();
  const forminha = new THREE.Mesh(forminhaGeo, mat(pick([0xffb3c6, 0x9ce0ff, 0xffd166, 0xc4f0a8]), { side: THREE.DoubleSide }));
  forminha.position.y = 0.3;
  forminha.castShadow = true;
  g.add(forminha);
  const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12), mat(0xd9a066));
  fundo.rotation.x = -Math.PI / 2;
  fundo.position.y = 0.01;
  g.add(fundo);

  // O bolo que estufa para fora da forminha e a cobertura em espiral.
  const corCobertura = pick([0xfff0f6, 0xffb3d1, 0xc9f0ff, 0x8b5a3c]);
  const bolo = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe0a96d));
  bolo.scale.y = 0.35;
  bolo.position.y = 0.58;
  g.add(bolo);

  const pontos = [];
  const VOLTAS = 2.6;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const ang = t * VOLTAS * Math.PI * 2;
    const r = 0.34 * (1 - t) + 0.04;
    pontos.push(new THREE.Vector3(Math.cos(ang) * r, 0.68 + t * 0.6, Math.sin(ang) * r));
  }
  const cobertura = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), 90, 0.14, 8),
    mat(corCobertura)
  );
  cobertura.castShadow = true;
  g.add(cobertura);
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 7), mat(corCobertura));
  miolo.scale.y = 0.9;
  miolo.position.y = 0.85;
  g.add(miolo);

  // Granulado espalhado pela espiral, do lado de fora.
  for (let i = 0; i < 16; i++) {
    const t = 0.05 + (i / 16) * 0.8;
    const ang = t * VOLTAS * Math.PI * 2 + 0.4;
    const r = 0.34 * (1 - t) + 0.04 + 0.12;
    const bit = granulo();
    bit.position.set(Math.cos(ang) * r, 0.72 + t * 0.6, Math.sin(ang) * r);
    g.add(bit);
  }

  const cereja = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(0xe8173a));
  cereja.position.y = 1.42;
  cereja.castShadow = true;
  g.add(cereja);
  const cabo = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 1.52, 0), new THREE.Vector3(0.02, 1.66, 0), new THREE.Vector3(0.12, 1.72, 0)
    ), 6, 0.015, 4),
    mat(0x5c8a3a)
  );
  g.add(cabo);
  return g;
}

// Bengala doce: um tubo só, do pé até a ponta do gancho, com a listra em
// espiral correndo pelo caminho inteiro. Antes as listras eram anéis no
// trecho reto e o gancho ficava todo branco.
function candyCane() {
  const g = new THREE.Group();
  const cor = pick([0xff4d6d, 0xff7b9d, 0x3aa76d, 0xa78bfa]);

  const pontos = [];
  for (let i = 0; i <= 8; i++) pontos.push(new THREE.Vector3(0, (i / 8) * 1.45, 0));
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    pontos.push(new THREE.Vector3(0.3 - Math.cos(a) * 0.3, 1.45 + Math.sin(a) * 0.3, 0));
  }
  pontos.push(new THREE.Vector3(0.6, 1.36, 0));
  const R = 0.12;
  const geo = pintarDuasCores(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), 200, R, 16),
    espiral(11), cor, 0xfff8f0
  );
  const bengala = new THREE.Mesh(geo, tintaDaMalha());
  bengala.castShadow = true;
  g.add(bengala);

  // Tampinhas redondas nas duas pontas do tubo.
  for (const p of [pontos[0], pontos[pontos.length - 1]]) {
    const tampa = new THREE.Mesh(new THREE.SphereGeometry(R, 10, 6), mat(0xfff8f0));
    tampa.position.copy(p);
    g.add(tampa);
  }
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

// O perfil do morango, de baixo para cima: [raio, altura]. Ponta
// arredondada, o corpo abrindo até o ombro largo lá no alto e um topo quase
// chato, de onde saem as folhinhas. A versão anterior era uma bola em cima
// de um cone — lia como sorvete de casquinha, não como fruta.
const MORANGO_PERFIL = [
  [0, 0], [0.1, 0.03], [0.24, 0.14], [0.38, 0.32], [0.5, 0.56],
  [0.6, 0.84], [0.64, 1.04], [0.6, 1.2], [0.46, 1.32], [0.22, 1.38], [0, 1.39],
];

// O raio do perfil numa altura qualquer, para pôr as sementes rentes à casca.
function raioDoMorango(y) {
  for (let i = 1; i < MORANGO_PERFIL.length; i++) {
    const [r1, y1] = MORANGO_PERFIL[i];
    if (y <= y1) {
      const [r0, y0] = MORANGO_PERFIL[i - 1];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
  }
  return 0;
}

function strawberry() {
  const g = new THREE.Group();
  // Fruta grande não fica de pé na ponta: ela vai um pouco tombada, como
  // se tivesse sido largada ali — e de lado dá para ver o ombro e a coroa.
  const fruta = new THREE.Group();
  fruta.rotation.z = 0.32;
  fruta.position.y = 0.02;   // tombado assim, a ponta encosta no chão
  g.add(fruta);

  const corpo = new THREE.Mesh(
    new THREE.LatheGeometry(MORANGO_PERFIL.map(([r, y]) => new THREE.Vector2(r, y)), 14),
    mat(0xff3b52)
  );
  corpo.castShadow = true;
  fruta.add(corpo);

  // Sementinhas em fileiras desencontradas (cada fileira começa meio passo
  // depois da anterior), mais juntas onde o morango é mais fino — é esse
  // pontilhado que faz o vermelho virar morango. Uma geometria e um material
  // para todas.
  const sementeGeo = new THREE.SphereGeometry(0.035, 4, 3);
  sementeGeo.scale(1, 1.5, 0.6);
  const sementeMat = mat(0xffe08a);
  const FILEIRAS = 6;
  for (let f = 0; f < FILEIRAS; f++) {
    const y = 0.16 + f * 0.17;
    const r = raioDoMorango(y);
    const quantas = Math.max(5, Math.round(r * 14));
    for (let i = 0; i < quantas; i++) {
      const a = ((i + (f % 2) * 0.5) / quantas) * Math.PI * 2;
      const semente = new THREE.Mesh(sementeGeo, sementeMat);
      semente.position.set(Math.cos(a) * r * 1.01, y, Math.sin(a) * r * 1.01);
      // Deitada na casca, apontando para cima como a fruta.
      semente.rotation.y = -a;
      semente.rotation.z = -0.35;
      fruta.add(semente);
    }
  }

  // A coroa: cinco folhinhas pontudas abertas em estrela, caindo por cima
  // do ombro — e não um cone fechado, que parecia uma tampa.
  const folhaMat = mat(0x3fa34d);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const folha = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.66, 4), folhaMat);
    folha.scale.z = 0.3;                   // achatada, como folha
    folha.geometry.translate(0, 0.33, 0);  // gira a partir da base, no centro
    const braco = new THREE.Group();
    braco.position.y = 1.4;
    braco.rotation.y = -a;
    folha.rotation.z = -1.72;              // deitada para fora, acompanhando o ombro
    braco.add(folha);
    fruta.add(braco);
  }

  // Cabinho um pouco torto, saindo do meio da coroa.
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.32, 5), mat(0x4f9e5c));
  cabo.position.set(0.03, 1.52, 0);
  cabo.rotation.z = -0.25;
  fruta.add(cabo);
  return g;
}

// A laranjeira: pé baixo e copa redonda e fechada, do verde escuro e
// lustroso de pé de laranja — e as laranjas *por fora* da copa. A versão
// anterior tinha quatro laranjinhas que nasciam dentro das bolotas e mal
// apareciam, e sem elas a laranjeira era só mais uma árvore verde.
function orangeTree() {
  const g = new THREE.Group();

  // Tronco curto que se abre em dois galhos logo abaixo da copa.
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, 1.25, 7), mat(0x9a6a48));
  trunk.position.y = 0.62;
  trunk.castShadow = true;
  g.add(trunk);
  for (const lado of [-1, 1]) {
    const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.75, 6), mat(0x8f6243));
    galho.position.set(lado * 0.2, 1.48, 0);
    galho.rotation.z = lado * -0.5;
    galho.castShadow = true;
    g.add(galho);
  }

  // A copa: uma cúpula grande e bolotas em volta, em três verdes. As esferas
  // ficam guardadas para saber onde a copa termina em cada direção.
  const centro = new THREE.Vector3(0, 2.25, 0);
  const copa = [
    [0, 0, 0, 1.12, 0x3d8f45],
    [0, 0.42, 0, 0.82, 0x4fa652],
    ...[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
      return [Math.cos(a) * 0.72, -0.18 + Math.random() * 0.3, Math.sin(a) * 0.72,
        0.6 + Math.random() * 0.1, i % 2 ? 0x2f7a3a : 0x3d8f45];
    }),
  ];
  const esferas = [];
  for (const [x, y, z, r, cor] of copa) {
    const bolota = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(cor));
    bolota.position.set(centro.x + x, centro.y + y, centro.z + z);
    bolota.castShadow = true;
    g.add(bolota);
    esferas.push({ c: bolota.position.clone(), r });
  }

  // Até onde a copa vai, saindo do centro numa direção: a saída mais longe
  // entre todas as bolotas que o raio atravessa.
  const ate = (dir) => {
    let longe = 0;
    for (const { c, r } of esferas) {
      const oc = centro.clone().sub(c);
      const b = oc.dot(dir);
      const delta = b * b - (oc.lengthSq() - r * r);
      if (delta >= 0) longe = Math.max(longe, -b + Math.sqrt(delta));
    }
    return longe;
  };

  // As laranjas, espalhadas pelo meio e pela metade de baixo da copa (é
  // onde fruta pesa e pendura), cada uma saindo meio corpo para fora.
  // Espiral de ângulo áureo: espalha por igual sem fileira nem grumo.
  const laranjaGeo = new THREE.IcosahedronGeometry(0.2, 1);
  const laranjaMats = [mat(0xff9418), mat(0xffa52b), mat(0xffb63a)];
  const folhaGeo = new THREE.ConeGeometry(0.07, 0.22, 4);
  folhaGeo.translate(0, 0.11, 0);
  const folhaMat = mat(0x2f7a3a);
  const LARANJAS = 11;
  const giro = Math.random() * Math.PI * 2;
  for (let i = 0; i < LARANJAS; i++) {
    const y = 0.55 - (i / (LARANJAS - 1)) * 1.05;     // de 0,55 a -0,5
    const a = giro + i * 2.39996;
    const roda = Math.sqrt(1 - y * y);
    const dir = new THREE.Vector3(Math.cos(a) * roda, y, Math.sin(a) * roda).normalize();
    const pos = centro.clone().addScaledVector(dir, ate(dir) + 0.06);

    const laranja = new THREE.Mesh(laranjaGeo, laranjaMats[i % 3]);
    laranja.position.copy(pos);
    laranja.castShadow = true;
    g.add(laranja);

    // Uma folhinha no cabo, deitada para o lado.
    const folha = new THREE.Mesh(folhaGeo, folhaMat);
    folha.position.copy(pos).add(new THREE.Vector3(0, 0.17, 0));
    folha.rotation.set(0, a, 1.1);
    folha.scale.z = 0.4;
    g.add(folha);
  }

  // Florzinhas brancas de laranjeira, salpicadas na metade de cima.
  const florGeo = new THREE.IcosahedronGeometry(0.07, 0);
  const florMat = mat(0xfffaf0);
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = 0.35 + Math.random() * 0.55;
    const roda = Math.sqrt(1 - y * y);
    const dir = new THREE.Vector3(Math.cos(a) * roda, y, Math.sin(a) * roda).normalize();
    const flor = new THREE.Mesh(florGeo, florMat);
    flor.position.copy(centro).addScaledVector(dir, ate(dir) + 0.02);
    g.add(flor);
  }

  // Duas que já caíram, no pé.
  for (const [x, z] of [[0.75, 0.35], [-0.5, 0.65]]) {
    const caida = new THREE.Mesh(laranjaGeo, laranjaMats[0]);
    caida.position.set(x, 0.18, z);
    caida.castShadow = true;
    g.add(caida);
  }
  return g;
}

// Bananas caídas no chão, junto das outras frutas do pomar.
//
// Antes isto era uma "bananeira": um caule verde de 1,2 m com a penca no
// alto e um capuz. De longe não lia como bananeira nenhuma — lia como um
// cabo de vassoura com bananas presas na ponta. A bananeira de verdade é
// uma touceira de folhas enormes, que não cabe no vocabulário chapado do
// resto do cenário. Então as bananas descem para o chão, que é onde as
// outras frutas deste pomar já estavam (ver orangePile, kiwi, grapes), e a
// altura do lugar passa a ser feita pelas árvores.
function banana() {
  const berco = new THREE.Group();

  // Uma malha só, não uma fileira de bolinhas. Tentei com esferas em fila:
  // com poucas elas aparecem uma a uma e a fruta lê como lagarta, e com as
  // ~16 que seriam precisas para o corpo ficar liso cada penca custaria 60
  // malhas — caro demais para enfeite de beira de pista.
  //
  // Então: uma esfera de poucos gomos, esticada em fuso (que já dá o
  // afunilamento das duas pontas de graça) e depois entortada deslocando
  // os vértices. É o mesmo custo de uma pedra.
  const COMPRIMENTO = 0.86, GROSSURA = 0.17, CURVA = 0.26;
  const geo = new THREE.SphereGeometry(0.5, 9, 6);
  geo.scale(COMPRIMENTO, GROSSURA, GROSSURA);

  const meio = COMPRIMENTO / 2;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // Arco raso: zero nas pontas, máximo no meio.
    pos.setZ(i, pos.getZ(i) + CURVA * (1 - (x / meio) ** 2));
  }
  geo.computeVertexNormals();

  const corpo = new THREE.Mesh(geo, mat(pick([0xffd93d, 0xffe266, 0xf5c518])));
  corpo.position.y = GROSSURA / 2;
  corpo.castShadow = true;
  berco.add(corpo);

  // O cabinho escuro numa das pontas: é ele que fecha a leitura.
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.032, 0.11, 5), mat(0x8a6b2f));
  cabo.position.set(meio - 0.01, GROSSURA / 2, 0);
  cabo.rotation.z = -Math.PI / 2.5;
  berco.add(cabo);

  berco.rotation.y = Math.random() * Math.PI * 2;
  return berco;
}

function bananaPile() {
  const g = new THREE.Group();
  const quantas = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < quantas; i++) {
    const b = banana();
    // Espalhadas num arco, para não se atravessarem.
    const a = (i / quantas) * Math.PI * 2 + Math.random() * 0.6;
    b.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.34);
    g.add(b);
  }
  return g;
}



// --- Frutas caídas no chão, para encher o pomar ----------------------------

// Listras de melancia pintadas na própria casca, vértice a vértice: faixas
// escuras correndo de uma ponta à outra, com a borda tremida como na fruta
// de verdade. Sem elas a melancia era uma bola verde lisa — lia como
// abacate ou casco de tartaruga.
function cascaListrada(geo) {
  const escuro = new THREE.Color(0x2c6b33);
  const claro = new THREE.Color(0x86c76a);
  const pos = geo.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // As listras dão a volta em torno do eixo comprido (X).
    const volta = Math.atan2(z, y);
    const tremido = Math.sin(x * 9) * 0.35 + Math.sin(x * 23) * 0.12;
    c.copy(Math.sin(volta * 7 + tremido) > -0.1 ? escuro : claro);
    cores.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  return geo;
}

function watermelonPatch() {
  const g = new THREE.Group();

  // Uma inteira, comprida e deitada.
  const inteira = new THREE.Mesh(
    cascaListrada(new THREE.SphereGeometry(0.55, 22, 14)),
    mat(0xffffff, { vertexColors: true })
  );
  inteira.scale.set(1.3, 0.88, 1);
  inteira.position.set(-0.55, 0.47, -0.15);
  inteira.rotation.y = 0.35;
  inteira.castShadow = true;
  g.add(inteira);

  // E uma metade aberta, com o vermelho virado para cima: é o vermelho com
  // sementinha que diz "melancia" de longe, mais que a casca.
  const metade = new THREE.Group();
  metade.position.set(0.7, 0, 0.35);
  metade.rotation.y = -0.5;
  g.add(metade);

  const R = 0.5;
  const tigela = new THREE.Mesh(
    cascaListrada(new THREE.SphereGeometry(R, 22, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
    mat(0xffffff, { vertexColors: true, side: THREE.DoubleSide })
  );
  tigela.rotation.x = Math.PI;          // a cúpula vira tigela
  tigela.scale.set(1.25, 0.8, 1);
  tigela.position.y = R * 0.8;
  tigela.castShadow = true;
  metade.add(tigela);

  const camada = (raio, cor, y) => {
    const disco = new THREE.Mesh(new THREE.CircleGeometry(raio, 22), mat(cor));
    disco.rotation.x = -Math.PI / 2;
    disco.scale.set(1.25, 1, 1);
    disco.position.y = R * 0.8 + y;
    metade.add(disco);
  };
  camada(R, 0x2c6b33, 0.002);          // a borda da casca
  camada(R * 0.92, 0xf2fff0, 0.004);   // o branco
  camada(R * 0.84, 0xff4d5e, 0.006);   // a polpa

  const sementeGeo = new THREE.SphereGeometry(0.035, 5, 3);
  sementeGeo.scale(1, 0.4, 1.6);
  const sementeMat = mat(0x2b2028);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = i % 2 ? 0.2 : 0.3;
    const semente = new THREE.Mesh(sementeGeo, sementeMat);
    semente.position.set(Math.cos(a) * r * 1.25, R * 0.8 + 0.01, Math.sin(a) * r);
    semente.rotation.y = -a;
    metade.add(semente);
  }

  // A rama: um cipó baixinho com duas folhas, ligando as duas.
  const rama = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.1, 0.06, 0.4), new THREE.Vector3(-0.3, 0.08, 0.55),
      new THREE.Vector3(0.1, 0.06, 0.9), new THREE.Vector3(0.7, 0.07, 1.0),
    ]), 16, 0.035, 4),
    mat(0x4f9e5c)
  );
  g.add(rama);
  for (const [x, z, a] of [[-0.3, 0.6, 0.4], [0.35, 1.0, -0.7]]) {
    const folha = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(0x3f8f4a));
    folha.scale.set(1.3, 0.2, 0.8);
    folha.position.set(x, 0.07, z);
    folha.rotation.y = a;
    g.add(folha);
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

// Folha de parreira: cinco pontas, recortada, numa malha só e chata.
function folhaDeUva(tamanho, cor) {
  const forma = new THREE.Shape();
  const PONTOS = 40;
  for (let i = 0; i <= PONTOS; i++) {
    const a = (i / PONTOS) * Math.PI * 2;
    const r = tamanho * (0.7 + 0.3 * Math.abs(Math.cos(a * 2.5)));
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) forma.moveTo(x, y); else forma.lineTo(x, y);
  }
  return new THREE.Mesh(new THREE.ShapeGeometry(forma), mat(cor, { side: THREE.DoubleSide }));
}

// Um cacho pendurado: largo em cima, afinando para baixo, com os bagos
// meio desencontrados. Nasce com o cabo na origem e desce.
function cachoDeUva(cor) {
  const cacho = new THREE.Group();
  const bagoGeo = new THREE.IcosahedronGeometry(0.11, 1);
  const bagoMat = mat(cor);
  const FILEIRAS = [6, 6, 5, 4, 3, 2, 1];
  FILEIRAS.forEach((quantos, f) => {
    const raio = quantos === 1 ? 0 : 0.07 + quantos * 0.033;
    for (let i = 0; i < quantos; i++) {
      const a = (i / quantos) * Math.PI * 2 + f * 0.5;
      const bago = new THREE.Mesh(bagoGeo, bagoMat);
      bago.position.set(
        Math.cos(a) * raio + (Math.random() - 0.5) * 0.03,
        -0.16 - f * 0.15,
        Math.sin(a) * raio + (Math.random() - 0.5) * 0.03
      );
      bago.castShadow = true;
      cacho.add(bago);
    }
  });
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 4), mat(0x7a5a3a));
  cabo.position.y = -0.08;
  cacho.add(cabo);
  return cacho;
}

// Uma parreirinha: dois postes, uma travessa coberta de folha e os cachos
// pendurados. O cacho de antes ficava empilhado no chão como pirâmide de
// bolas, e lia como amora; uva pendurada não tem como confundir.
function grapes() {
  const g = new THREE.Group();
  const madeira = mat(0x9a6a48);

  for (const x of [-0.75, 0.75]) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 6), madeira);
    poste.position.set(x, 0.95, 0);
    poste.castShadow = true;
    g.add(poste);
  }
  const trave = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.75, 6), madeira);
  trave.rotation.z = Math.PI / 2;
  trave.position.y = 1.88;
  g.add(trave);

  // Folhas por cima da trave, umas mais deitadas que as outras.
  for (let i = 0; i < 6; i++) {
    const folha = folhaDeUva(0.24 + Math.random() * 0.06, pick([0x4f9e5c, 0x5cb06a, 0x43884f]));
    folha.position.set(-0.7 + i * 0.28, 1.95 + Math.random() * 0.08, (Math.random() - 0.5) * 0.3);
    folha.rotation.set(-Math.PI / 2 + (Math.random() - 0.5) * 0.7, 0, Math.random() * Math.PI);
    folha.castShadow = true;
    g.add(folha);
  }

  // Dois cachos: na maioria das vezes roxos, às vezes um verde.
  const cores = [pick([0x8b5fbf, 0x6b4bb0, 0x9c6fd6]), pick([0x7a4fb0, 0x9fd86a, 0x8b5fbf])];
  for (const [x, cor] of [[-0.4, cores[0]], [0.42, cores[1]]]) {
    const cacho = cachoDeUva(cor);
    cacho.position.set(x, 1.84, 0.05);
    cacho.rotation.y = Math.random() * Math.PI;
    g.add(cacho);
  }
  return g;
}

// --- Frutas novas do pomar ---------------------------------------------------

// O perfil da maçã, de baixo para cima: [raio, altura]. A covinha embaixo e
// a de cima, onde sai o cabinho, são o que separa maçã de bola vermelha.
const MACA_PERFIL = [
  [0, 0.05], [0.16, 0], [0.34, 0.05], [0.46, 0.2], [0.5, 0.4],
  [0.47, 0.6], [0.37, 0.75], [0.2, 0.8], [0.08, 0.74], [0, 0.69],
];
const perfil2d = (perfil) => perfil.map(([r, y]) => new THREE.Vector2(r, y));

function cabinhoComFolha(g, y, cor = 0x3fa34d) {
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 5), mat(0x6b4a2e));
  cabo.position.set(0.02, y + 0.08, 0);
  cabo.rotation.z = -0.2;
  g.add(cabo);
  const folha = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), mat(cor));
  folha.scale.set(1.6, 0.25, 0.8);
  folha.position.set(0.15, y + 0.13, 0);
  folha.rotation.z = 0.35;
  g.add(folha);
}

// Maçã: uma inteira e a outra cortada ao meio, deitada com o miolo para
// cima — a estrelinha de sementes no meio do creme é o que se reconhece.
function apple() {
  const g = new THREE.Group();
  const cor = pick([0xe8323c, 0xd92b3a, 0x9fd25a]);   // às vezes maçã verde
  const casca = mat(cor);

  const inteira = new THREE.Mesh(new THREE.LatheGeometry(perfil2d(MACA_PERFIL), 16), casca);
  inteira.position.set(-0.5, 0, -0.1);
  inteira.castShadow = true;
  g.add(inteira);
  const topo = new THREE.Group();
  topo.position.copy(inteira.position);
  cabinhoComFolha(topo, 0.72);
  g.add(topo);

  // A metade: meio torno (x ≥ 0) com o corte no plano x = 0, deitada de
  // modo que o corte olhe para cima.
  const metade = new THREE.Group();
  metade.rotation.z = -Math.PI / 2;
  metade.position.set(0.55, 0.5, 0.25);
  const giro = new THREE.Group();          // gira a metade no chão
  giro.rotation.y = 0.6;
  giro.add(metade);
  g.add(giro);

  const meia = new THREE.Mesh(
    new THREE.LatheGeometry(perfil2d(MACA_PERFIL), 10, 0, Math.PI),
    mat(cor, { side: THREE.DoubleSide })
  );
  meia.castShadow = true;
  metade.add(meia);

  // O corte: a silhueta da maçã em creme, com o miolo e as sementes.
  const corte = new THREE.Group();
  corte.rotation.y = -Math.PI / 2;         // do plano XY para o plano do corte
  metade.add(corte);
  const silhueta = new THREE.Shape();
  MACA_PERFIL.forEach(([r, y], i) => (i ? silhueta.lineTo(r, y) : silhueta.moveTo(r, y)));
  [...MACA_PERFIL].reverse().forEach(([r, y]) => silhueta.lineTo(-r, y));
  const polpa = new THREE.Mesh(new THREE.ShapeGeometry(silhueta), mat(0xfff1cf));
  corte.add(polpa);

  const miolo = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), mat(0xf2d79a));
  miolo.scale.set(0.8, 1.2, 1);
  miolo.position.set(0, 0.42, 0.004);
  corte.add(miolo);
  const sementeGeo = new THREE.SphereGeometry(0.04, 5, 4);
  sementeGeo.scale(0.7, 1.3, 0.4);
  for (const lado of [-1, 1]) {
    const semente = new THREE.Mesh(sementeGeo, mat(0x4a2e1a));
    semente.position.set(lado * 0.045, 0.42, 0.012);
    semente.rotation.z = lado * 0.35;
    corte.add(semente);
  }
  // O fiozinho do cabo, no alto do corte.
  const fio = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.18), mat(0x6b4a2e));
  fio.position.set(0, 0.66, 0.006);
  corte.add(fio);
  return g;
}

// Par de cerejas penduradas no mesmo cabinho, caídas no chão.
function cherries() {
  const g = new THREE.Group();
  const vermelho = mat(0xc8102e);
  const topo = new THREE.Vector3(0.05, 1.05, 0);
  for (const [x, z] of [[-0.3, 0.05], [0.28, -0.08]]) {
    const cereja = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 2), vermelho);
    cereja.scale.set(1, 0.92, 1);
    cereja.position.set(x, 0.26, z);
    cereja.castShadow = true;
    g.add(cereja);

    // Cabinho em curva, do alto da cereja até o nó em comum.
    const cabo = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x, 0.5, z),
        new THREE.Vector3(x * 0.6, 0.95, z),
        topo
      ), 10, 0.025, 4),
      mat(0x5c8a3a)
    );
    g.add(cabo);
  }
  const folha = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(0x3fa34d));
  folha.scale.set(1.8, 0.22, 0.75);
  folha.position.set(0.3, 1.04, 0);
  folha.rotation.z = 0.4;
  g.add(folha);
  return g;
}

// Pera: barriga larga embaixo e pescoço fino em cima. Duas, uma de cada
// tamanho, e a menor tombada.
const PERA_PERFIL = [
  [0, 0], [0.24, 0.02], [0.43, 0.15], [0.5, 0.34], [0.45, 0.54],
  [0.31, 0.7], [0.23, 0.88], [0.19, 1.03], [0.1, 1.12], [0, 1.13],
];
function pear() {
  const g = new THREE.Group();
  const cor = pick([0xc9dc4a, 0xd8d04a, 0xb6d24f]);
  const geo = new THREE.LatheGeometry(perfil2d(PERA_PERFIL), 14);

  const grande = new THREE.Mesh(geo, mat(cor));
  grande.castShadow = true;
  g.add(grande);
  cabinhoComFolha(g, 1.1);

  const pequena = new THREE.Group();
  const corpo = new THREE.Mesh(geo, mat(cor));
  corpo.castShadow = true;
  pequena.add(corpo);
  cabinhoComFolha(pequena, 1.1);
  pequena.scale.setScalar(0.7);
  pequena.rotation.z = 1.2;                // tombada de lado
  pequena.position.set(1.05, 0.33, 0.45);
  g.add(pequena);
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
    // Deitada sobre o corte, com a parte redonda para cima. Só com o giro em
    // X ela ficava em pé de lado, com metade enterrada no chão — e as
    // sementes, que são postas para a fatia deitada, ficavam boiando no ar.
    m.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX');
    m.position.set(0, 0, z);
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
    semente.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.42, 0.28);
    g.add(semente);
  }
  return g;
}

function pineapple() {
  const g = new THREE.Group();

  // A casca vem do próprio corpo, não de escamas coladas por cima. Antes
  // eram 10 octaedros grudados na superfície, e eles liam como espinhos de
  // cacto — o abacaxi virava uma batata espetada. O losango do abacaxi não
  // é relevo isolado: é a superfície inteira quadriculada.
  //
  // Então o corpo é um cilindro de poucos gomos com os vértices empurrados
  // para dentro e para fora em xadrez. Com `flatShading` cada quadrinho
  // pega uma luz diferente e o losango aparece sozinho, numa malha só.
  // Gomos ímpares de propósito: com número par o xadrez vira listra
  // vertical, e com ímpar ele fecha em espiral — que é como a casca do
  // abacaxi de verdade se organiza.
  const GOMOS = 9, ANEIS = 5, ALTURA = 1.3;
  const geo = new THREE.CylinderGeometry(0.34, 0.42, ALTURA, GOMOS, ANEIS);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const raio = Math.hypot(x, z);
    if (raio < 0.05) continue;                      // centro das tampas
    const coluna = Math.round((Math.atan2(z, x) / (Math.PI * 2)) * GOMOS);
    const linha = Math.round(((y + ALTURA / 2) / ALTURA) * ANEIS);
    // Barriga: o abacaxi é mais gordo no meio que nas pontas.
    const barriga = 1 + 0.16 * Math.sin((linha / ANEIS) * Math.PI);
    const bossa = (coluna + linha) % 2 ? 1.1 : 0.92;
    const k = barriga * bossa;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  geo.computeVertexNormals();

  const corpo = new THREE.Mesh(geo, mat(0xf0a52a));
  corpo.position.y = 0.72;
  corpo.castShadow = true;
  g.add(corpo);

  // Um "olho" escuro na ponta de cada losango — o pontinho do abacaxi. Só
  // com o xadrez de luz ele sumia sob a luz quente da pista Frutas. Os olhos
  // vão nos vértices empurrados para fora, tirados da própria malha (a
  // costura do cilindro repete vértices, daí a chave para não dobrar).
  const olhoGeo = new THREE.IcosahedronGeometry(0.045, 0);
  olhoGeo.scale(1, 1.4, 0.5);
  const olhoMat = mat(0x8a4f17);
  const vistos = new Set();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const raio = Math.hypot(x, z);
    if (raio < 0.05 || Math.abs(y) > ALTURA / 2 - 0.01) continue;   // tampas
    const coluna = Math.round((Math.atan2(z, x) / (Math.PI * 2)) * GOMOS);
    const linha = Math.round(((y + ALTURA / 2) / ALTURA) * ANEIS);
    if (!((coluna + linha) % 2)) continue;
    const chave = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const olho = new THREE.Mesh(olhoGeo, olhoMat);
    olho.position.set(x * 1.01, y + 0.72, z * 1.01);
    olho.rotation.y = Math.atan2(x, z);
    g.add(olho);
  }

  // A coroa é um buquê de folhas pontudas abrindo para fora. O cone liso de
  // antes lia como chapéu de festa — é a silhueta recortada que faz
  // reconhecer abacaxi de longe, mais até que a casca.
  const BASE = 0.72 + ALTURA / 2;
  for (const [quantas, raio, tamanho, abertura] of [[7, 0.15, 0.85, 0.66], [4, 0.06, 0.6, 0.24]]) {
    for (let i = 0; i < quantas; i++) {
      const a = (i / quantas) * Math.PI * 2 + Math.random() * 0.3;
      const comprimento = tamanho * (0.8 + Math.random() * 0.45);
      const folha = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, comprimento, 4),
        mat(pick([0x4f9e5c, 0x5cb06a, 0x43884f]))
      );
      folha.position.set(Math.cos(a) * raio, BASE + comprimento * 0.42, Math.sin(a) * raio);
      folha.rotation.z = -Math.cos(a) * abertura;
      folha.rotation.x = Math.sin(a) * abertura;
      folha.castShadow = true;
      g.add(folha);
    }
  }

  return g;
}

// Monte de cocos, cada um com os três "olhos" juntinhos num triângulo, na
// ponta virada para quem vem — como no coco de verdade. Antes eram três
// bolinhas em fila, soltas na frente do coco. Os olhos dos três cocos
// saem numa malha só.
function coconutPile() {
  const g = new THREE.Group();
  const R = 0.42;
  const olhos = [];
  const olhoGeo = new THREE.SphereGeometry(0.06, 6, 4);
  olhoGeo.scale(1, 1, 0.5);
  for (let i = 0; i < 3; i++) {
    const coco = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 1), mat(0x7a5230));
    coco.position.set((i - 1) * 0.5, R + (i === 1 ? 0.5 : 0), (Math.random() - 0.5) * 0.3);
    coco.castShadow = true;
    g.add(coco);

    // A ponta dos olhos: para a frente e um pouco para cima, com um giro
    // sorteado para os cocos não ficarem todos iguais.
    const frente = new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.35, 1).normalize();
    const lado = new THREE.Vector3().crossVectors(frente, CIMA).normalize();
    const cima = new THREE.Vector3().crossVectors(lado, frente).normalize();
    const giro = Math.random() * Math.PI * 2;
    for (let j = 0; j < 3; j++) {
      const a = giro + (j / 3) * Math.PI * 2;
      const dir = frente.clone()
        .addScaledVector(lado, Math.cos(a) * 0.2)
        .addScaledVector(cima, Math.sin(a) * 0.2)
        .normalize();
      const ponto = coco.position.clone().addScaledVector(dir, R * 0.93);
      olhos.push([olhoGeo, apontar(ponto, dir).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))]);
    }
  }
  g.add(new THREE.Mesh(juntar(olhos), mat(0x3a2210)));
  return g;
}

// --- Pista do Oceano --------------------------------------------------------

const CORAL_CORES = [0xff7b9d, 0xffa02e, 0xc9a6ff, 0xff5d8f, 0xffd166, 0x7fd8e0];

// Coral: sorteia entre três tipos de verdade — o galhado, que vai se
// dividindo e afinando; o cérebro, uma bola cheia de sulcos meio enterrada;
// e o de tubos, um feixe de canudos abertos. Antes era um tronco com quatro
// prismas retos, que lia como cristal ou cacto. Cada tipo é uma malha só.
function coral() {
  const tipo = pick(['galho', 'galho', 'cerebro', 'tubo']);
  // O cérebro só nos tons que seguram a luz azul do fundo do mar: amarelo e
  // laranja-claro viravam oliva e ele passava por pedra.
  const cor = tipo === 'cerebro' ? pick([0xff7b9d, 0xff5d8f, 0xc9a6ff, 0x7fd8e0]) : pick(CORAL_CORES);
  const g = new THREE.Group();
  const geo = tipo === 'galho' ? coralGalhado() : tipo === 'cerebro' ? coralCerebro() : coralTubos();
  const m = new THREE.Mesh(geo, mat(cor, { side: tipo === 'tubo' ? THREE.DoubleSide : THREE.FrontSide }));
  m.castShadow = true;
  g.add(m);
  return g;
}

function coralGalhado() {
  const pecas = [];
  const galho = (inicio, dir, comprimento, raio, nivel) => {
    const tronco = new THREE.CylinderGeometry(raio * 0.72, raio, comprimento, 6);
    tronco.translate(0, comprimento / 2, 0);
    pecas.push([tronco, apontar(inicio, dir)]);
    const fim = inicio.clone().addScaledVector(dir, comprimento);
    // A bolinha na junta esconde a emenda e arredonda as pontas.
    pecas.push([new THREE.IcosahedronGeometry(raio * 0.78, 1), naPosicao(fim.x, fim.y, fim.z)]);
    if (nivel === 0) return;
    const filhos = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < filhos; i++) {
      const a = (i / filhos) * Math.PI * 2 + Math.random();
      const novo = dir.clone().add(new THREE.Vector3(Math.cos(a) * 0.75, 0.35, Math.sin(a) * 0.75)).normalize();
      galho(fim, novo, comprimento * (0.7 + Math.random() * 0.15), raio * 0.7, nivel - 1);
    }
  };
  const troncos = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < troncos; i++) {
    const a = (i / troncos) * Math.PI * 2;
    galho(new THREE.Vector3(Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18),
      new THREE.Vector3(Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35).normalize(),
      0.55 + Math.random() * 0.2, 0.13, 2);
  }
  return juntar(pecas);
}

function coralCerebro() {
  const geo = new THREE.IcosahedronGeometry(0.62, 4);
  const pos = geo.attributes.position;
  const d = new THREE.Vector3();
  const sorte = Math.random() * 10;
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    // Sulcos sinuosos: uma onda torcida por outras duas, e só o vale estreito
    // de cada onda afunda — o resto fica cheio, como as dobras do coral.
    const fase = d.x * 14 + Math.sin(d.z * 6 + sorte) * 2.5 + Math.sin(d.y * 5) * 1.5;
    const sulco = Math.pow(1 - Math.abs(Math.sin(fase)), 3);
    const r = 0.62 * (1 - 0.1 * sulco);
    pos.setXYZ(i, d.x * r, d.y * r * 0.72 + 0.2, d.z * r);
  }
  geo.computeVertexNormals();
  return geo;
}

function coralTubos() {
  const pecas = [];
  const quantos = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < quantos; i++) {
    const a = (i / quantos) * Math.PI * 2 + Math.random() * 0.5;
    const longe = i === 0 ? 0 : 0.18 + Math.random() * 0.14;
    const altura = 0.45 + Math.random() * 0.75;
    const raio = 0.09 + Math.random() * 0.06;
    const x = Math.cos(a) * longe, z = Math.sin(a) * longe;
    const tubo = new THREE.CylinderGeometry(raio, raio * 0.85, altura, 8, 1, true);
    tubo.translate(0, altura / 2, 0);
    const inclinado = new THREE.Vector3(x * 0.6, 1, z * 0.6).normalize();
    pecas.push([tubo, apontar(new THREE.Vector3(x, 0, z), inclinado)]);
    // A boca, um tico mais larga.
    const boca = new THREE.CylinderGeometry(raio * 1.18, raio * 1.05, 0.06, 8, 1, true);
    boca.translate(0, altura, 0);
    pecas.push([boca, apontar(new THREE.Vector3(x, 0, z), inclinado)]);
  }
  return juntar(pecas);
}

// Alga: fitas compridas e onduladas saindo do chão, cada uma feita de gomos
// encaixados um no outro. Cada junta guarda a própria fase, e o World mexe
// nelas a cada quadro (ver swaySeaweed) — a fita inteira balança como na
// correnteza, mais na ponta que no pé. Antes eram caixinhas verdes
// empilhadas, paradas, e a alga parecia uma escada de blocos.
function seaweed() {
  const g = new THREE.Group();
  const juntas = [];
  const fitas = 4 + Math.floor(Math.random() * 3);
  for (let f = 0; f < fitas; f++) {
    const cor = pick([0x3f8f6a, 0x4aa87a, 0x2f7a58, 0x6cbf6a]);
    const material = mat(cor, { side: THREE.DoubleSide });
    const a = Math.random() * Math.PI * 2;
    const base = new THREE.Group();
    base.position.set(Math.cos(a) * Math.random() * 0.35, 0, Math.sin(a) * Math.random() * 0.35);
    base.rotation.y = Math.random() * Math.PI;
    g.add(base);

    const gomos = 4 + Math.floor(Math.random() * 3);
    const fase = Math.random() * Math.PI * 2;
    let pai = base;
    for (let i = 0; i < gomos; i++) {
      const altura = 0.36 + Math.random() * 0.12;
      const largura = 0.24 * (1 - i / (gomos + 1)) + 0.05;
      const forma = new THREE.PlaneGeometry(largura, altura, 1, 1);
      forma.translate(0, altura / 2, 0);
      const gomo = new THREE.Mesh(forma, material);
      const junta = new THREE.Group();
      junta.add(gomo);
      pai.add(junta);
      juntas.push({ junta, fase: fase + i * 0.55, curva: (Math.random() - 0.5) * 0.25, quanto: 0.06 + i * 0.025 });
      const proxima = new THREE.Group();
      proxima.position.y = altura * 0.97;
      junta.add(proxima);
      pai = proxima;
    }
  }
  g.userData.algas = juntas;
  return g;
}

// Balança as fitas da alga: cada junta dobra um pouco, com atraso em
// relação à de baixo, e a dobra cresce para a ponta — é o que faz a fita
// ondular em vez de girar dura no pé.
export function swaySeaweed(deco, tempo) {
  for (const { junta, fase, curva, quanto } of deco.userData.algas) {
    junta.rotation.z = curva + Math.sin(tempo * 1.4 + fase) * quanto;
    junta.rotation.x = Math.sin(tempo * 1.1 + fase * 1.3) * quanto * 0.5;
  }
}

// Estrela-do-mar: gordinha, de braços arredondados, numa cor quente que
// aparece no azul do fundo — e com pontinhos em relevo nos braços. A de
// antes era achatada e de um amarelo-oliva que sumia. Duas malhas só.
function starfish() {
  const g = new THREE.Group();
  const [cor, pontos] = pick([
    [0xff8c42, 0xffd1a3], [0xff5d8f, 0xffc2d6], [0xe63946, 0xffb3b8], [0xc77dff, 0xead1ff],
  ]);
  const BRACOS = 5, FORA = 0.58, DENTRO = 0.2;
  const forma = new THREE.Shape();
  const ponto = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  forma.moveTo(...ponto(-Math.PI / BRACOS, DENTRO));
  for (let i = 0; i < BRACOS; i++) {
    const a = (i / BRACOS) * Math.PI * 2;
    // Uma curva só de vão a vão, com o controle além da ponta: o braço sai
    // arredondado, sem bico.
    forma.quadraticCurveTo(...ponto(a, FORA * 1.32), ...ponto(a + Math.PI / BRACOS, DENTRO));
  }
  const corpoGeo = new THREE.ExtrudeGeometry(forma, {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2, curveSegments: 6,
  });
  const corpo = new THREE.Mesh(corpoGeo, mat(cor));
  corpo.rotation.x = -Math.PI / 2;
  corpo.position.y = 0.07;
  corpo.castShadow = true;
  g.add(corpo);

  const pecas = [];
  const bolinha = new THREE.IcosahedronGeometry(0.035, 0);
  for (let i = 0; i < BRACOS; i++) {
    const a = (i / BRACOS) * Math.PI * 2;
    for (const r of [0.14, 0.26, 0.38]) {
      // O eixo do braço, no chão: a forma foi desenhada em XY e deitada.
      pecas.push([bolinha, naPosicao(Math.cos(a) * r, 0.21, -Math.sin(a) * r)]);
    }
  }
  pecas.push([new THREE.IcosahedronGeometry(0.05, 0), naPosicao(0, 0.22, 0)]);
  g.add(new THREE.Mesh(juntar(pecas), mat(pontos)));
  return g;
}

// Ouriço-do-mar: espinhos espalhados por igual (espiral de ângulo áureo),
// cada um saindo da casca e apontando para fora do centro. Antes eram doze,
// em três alturas fixas: no alto e embaixo a bola é mais fina e eles
// ficavam soltos no ar, e a inclinação não apontava para fora. Duas malhas.
function seaUrchin() {
  const g = new THREE.Group();
  const [casca, espinhos] = pick([[0x5a3d9a, 0x3a2470], [0x2a2238, 0x5a3d9a], [0x8a3f6f, 0x4a1f3f]]);
  const centro = new THREE.Vector3(0, 0.48, 0);
  const R = 0.4;
  const corpo = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 2), mat(casca));
  corpo.position.copy(centro);
  corpo.castShadow = true;
  g.add(corpo);

  const pecas = [];
  const N = 70;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    if (y < -0.55) continue;                   // os de baixo entrariam no chão
    const roda = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    const dir = new THREE.Vector3(Math.cos(a) * roda, y, Math.sin(a) * roda);
    const comprimento = 0.36 + Math.random() * 0.12;
    const espinho = new THREE.ConeGeometry(0.035, comprimento, 4);
    espinho.translate(0, comprimento / 2, 0);
    pecas.push([espinho, apontar(centro.clone().addScaledVector(dir, R * 0.92), dir)]);
  }
  const ponta = new THREE.Mesh(juntar(pecas), mat(espinhos));
  ponta.castShadow = true;
  g.add(ponta);
  return g;
}

// Uma valva de concha, cheia: um leque que sai da dobradiça (na origem) e
// abre para +Z, com a borda ondulada e os gomos em relevo. É uma "lente"
// fechada — a face de fora estufa mais que a de dentro, e as duas se
// encontram na borda e na dobradiça —, então a valva tem corpo e não mostra
// o vazio por dentro. A de antes era uma casca fina de meia esfera: de
// frente aparecia só a borda, e a concha parecia cortada.
function valva(R, H) {
  // Quatro pedaços de malha por costela: com menos, a costela vira serrote.
  const COSTELAS = 14;
  const NA = COSTELAS * 4, NR = 10;        // pedaços em volta e anéis da dobradiça à borda
  const ABRE = 0.32;                        // o leque não chega a meia volta: tem "ombros"
  const pontos = [];
  const ponto = (i, j, fora) => {
    const fi = ABRE + (i / NA) * (Math.PI - 2 * ABRE);
    const t = j / NR;
    // A costela: uma onda suave em volta, que cresce da dobradiça para a
    // borda — e a borda ondula junto, um bico no fim de cada costela.
    const onda = 0.5 + 0.5 * Math.cos(((fi - ABRE) / (Math.PI - 2 * ABRE)) * COSTELAS * Math.PI * 2);
    const r = R * t * (1 + 0.035 * onda * t);
    const bojo = Math.sin(Math.PI * Math.pow(t, 0.85));          // 0 na dobradiça e na borda
    const gomo = 1 + 0.16 * onda * t;
    const y = H * bojo * (fora ? gomo : 0.55);
    return [Math.cos(fi) * r, y, Math.sin(fi) * r];
  };
  const indice = (lado, i, j) => lado * (NA + 1) * (NR + 1) + i * (NR + 1) + j;
  for (const fora of [true, false]) {
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NR; j++) pontos.push(...ponto(i, j, fora));
  }
  const faces = [];
  for (let i = 0; i < NA; i++) {
    for (let j = 0; j < NR; j++) {
      for (const lado of [0, 1]) {
        const a = indice(lado, i, j), b = indice(lado, i + 1, j);
        const c = indice(lado, i + 1, j + 1), d = indice(lado, i, j + 1);
        if (lado === 0) faces.push(a, d, b, b, d, c);
        else faces.push(a, b, d, b, c, d);
      }
    }
  }
  // Os dois "ombros" do leque fecham a lente dos lados.
  for (const i of [0, NA]) {
    for (let j = 0; j < NR; j++) {
      const a = indice(0, i, j), b = indice(0, i, j + 1), c = indice(1, i, j + 1), d = indice(1, i, j);
      if (i === 0) faces.push(a, b, c, a, c, d);
      else faces.push(a, c, b, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pontos, 3));
  geo.setIndex(faces);
  geo.computeVertexNormals();
  return geo;
}

// Concha: duas valvas cheias em leque, a de cima aberta para quem vem e a
// pérola sentada na de baixo.
function clam() {
  const g = new THREE.Group();
  const cor = pick([0xffd6e8, 0xffe9c9, 0xe0d6ff, 0xffc9a8]);
  const R = 0.75, H = 0.42;
  const material = mat(cor, { side: THREE.DoubleSide });

  // As valvas giram na dobradiça, que fica atrás (z negativo) — o leque
  // abre para a frente.
  const dobradica = new THREE.Group();
  dobradica.position.set(0, H * 0.75, -R * 0.45);
  g.add(dobradica);

  const fundo = new THREE.Mesh(valva(R, H), material);
  fundo.scale.y = -1;                       // a de baixo é a tigela
  fundo.rotation.x = 0.12;
  fundo.castShadow = true;
  dobradica.add(fundo);

  const tampa = new THREE.Mesh(valva(R, H), material);
  tampa.rotation.x = -0.6;                  // entreaberta, com a pérola espiando
  tampa.castShadow = true;
  dobradica.add(tampa);

  const perola = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(0xfffdf5, { emissive: 0x554d3d }));
  perola.position.set(0, H * 0.75 - H * 0.55 + 0.13, -R * 0.45 + R * 0.5);
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

// Guarda-sol: cobertura em cone baixinho, de gomos de duas cores, com a
// sainha recortada na borda e o pino no topo, num mastro um pouco inclinado
// fincado num montinho de areia. O de antes era um disco plano inclinado
// num palito, e de lado sumia.
function parasol() {
  const g = new THREE.Group();
  const [corA, corB] = pick([[0xff7bac, 0xfff0a8], [0x4cc9f0, 0xffffff], [0xff6b4a, 0xffffff], [0x8ce99a, 0xfff0a8]]);
  const GOMOS = 8;
  const gomos = (u) => Math.floor(u * GOMOS) % 2 === 0;

  const montinho = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf0d7a8));
  montinho.scale.y = 0.4;
  g.add(montinho);

  const guarda = new THREE.Group();
  guarda.rotation.set(0.1, 0, -0.14);          // fincado meio torto, como na praia
  g.add(guarda);

  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.05, 6), mat(0xfff6e8));
  mastro.position.y = 1.02;
  guarda.add(mastro);

  const ALTURA = 0.42, R = 1.05;
  const cobertura = new THREE.Mesh(
    pintarDuasCores(new THREE.ConeGeometry(R, ALTURA, GOMOS * 2, 1, true), gomos, corA, corB),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  cobertura.position.y = 1.95;
  cobertura.castShadow = true;
  guarda.add(cobertura);

  // A sainha: uma faixa curta pendurada na borda, recortada em bicos.
  const saia = new THREE.CylinderGeometry(R, R, 0.14, GOMOS * 2, 1, true);
  const pos = saia.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) continue;
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    // Cada gomo termina em bico no meio dele: a borda sobe nas emendas.
    const noGomo = ((ang / (Math.PI * 2)) * GOMOS * 2) % 2;
    pos.setY(i, pos.getY(i) + (Math.abs(noGomo) < 0.01 ? 0.07 : 0));
  }
  const saiaMalha = new THREE.Mesh(pintarDuasCores(saia, gomos, corA, corB), tintaDaMalha({ side: THREE.DoubleSide }));
  saiaMalha.position.y = 1.95 - ALTURA / 2 - 0.07;
  guarda.add(saiaMalha);

  const pino = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(corA));
  pino.position.y = 1.95 + ALTURA / 2 + 0.03;
  guarda.add(pino);
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
// Coqueiro: tronco curvo de gomos que afinam, e a copa de folhas que sobem
// um pouco e despencam em arco, com os folíolos compridos caindo dos dois
// lados da nervura. As folhas de antes saíam retas e chapadas — de lado a
// copa virava um risco — e os folíolos em cone pareciam dentes de serra.
//
// O tronco é uma malha e a copa é outra: um coqueiro tem perto de 180
// folíolos, e como peças soltas ele pesaria mais que a praia inteira.
function palmTree() {
  const g = new THREE.Group();
  const gomos = 8;
  const curva = 0.05 + Math.random() * 0.035;   // o quanto ele deita
  const lado = Math.random() < 0.5 ? -1 : 1;
  let y = 0, x = 0, inclinacao = 0;

  const tronco = [];
  for (let i = 0; i < gomos; i++) {
    const alturaGomo = 0.36;
    const raio = 0.2 - i * 0.013;
    const gomo = new THREE.CylinderGeometry(raio - 0.016, raio + 0.01, alturaGomo, 7);
    inclinacao += curva;
    x += lado * Math.sin(inclinacao) * alturaGomo;
    y += Math.cos(inclinacao) * alturaGomo;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x - lado * Math.sin(inclinacao) * alturaGomo / 2, y - Math.cos(inclinacao) * alturaGomo / 2, 0),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -lado * inclinacao),
      new THREE.Vector3(1, 1, 1)
    );
    tronco.push([gomo, m]);
  }
  const troncoMalha = new THREE.Mesh(juntar(tronco), mat(0xa9804f));
  troncoMalha.castShadow = true;
  g.add(troncoMalha);

  const topo = new THREE.Vector3(x, y, 0);
  const folhas = [];
  const FOLHAS = 9;
  for (let f = 0; f < FOLHAS; f++) {
    const a = (f / FOLHAS) * Math.PI * 2 + Math.random() * 0.25;
    const fora = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const comprimento = 1.7 + Math.random() * 0.5;
    const sobe = 0.25 + Math.random() * 0.2;
    // A nervura: sobe um pouco saindo do topo e despenca em arco no fim.
    const nervura = new THREE.QuadraticBezierCurve3(
      topo.clone(),
      topo.clone().addScaledVector(fora, comprimento * 0.5).add(new THREE.Vector3(0, sobe + 0.25, 0)),
      topo.clone().addScaledVector(fora, comprimento).add(new THREE.Vector3(0, -0.55 - Math.random() * 0.3, 0))
    );
    folhas.push([new THREE.TubeGeometry(nervura, 10, 0.03, 3), new THREE.Matrix4()]);

    // Os folíolos: lâminas compridas que pendem dos dois lados da nervura,
    // maiores no meio da folha e menores na ponta.
    const FOLIOLOS = 11;
    const ladoDaFolha = new THREE.Vector3().crossVectors(fora, CIMA).normalize();
    for (let k = 1; k <= FOLIOLOS; k++) {
      const t = k / (FOLIOLOS + 1);
      const p = nervura.getPoint(t);
      const tamanho = 0.62 * Math.sin(Math.PI * (0.15 + t * 0.8)) + 0.12;
      for (const s of [-1, 1]) {
        const lamina = new THREE.PlaneGeometry(0.09, tamanho);
        lamina.translate(0, -tamanho / 2, 0);   // pende a partir da nervura
        // Aberta para o lado e caída para baixo, varrida para a ponta.
        const dir = ladoDaFolha.clone().multiplyScalar(s * 0.75)
          .add(new THREE.Vector3(0, -0.85, 0))
          .addScaledVector(fora, 0.35)
          .normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
        folhas.push([lamina, new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1))]);
      }
    }
  }
  const copa = new THREE.Mesh(juntar(folhas), mat(0x4f9d3a, { side: THREE.DoubleSide }));
  copa.castShadow = true;
  g.add(copa);

  // Cachinho de cocos embaixo da copa.
  const cocos = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    cocos.push([new THREE.IcosahedronGeometry(0.14, 1), naPosicao(x + Math.cos(a) * 0.15, y - 0.12, Math.sin(a) * 0.15)]);
  }
  g.add(new THREE.Mesh(juntar(cocos), mat(0x6b4a2f)));
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

// Barco a vela: casco de verdade — convés reto, proa em bico que sobe um
// pouco e fundo que estreita para baixo — com a vela grande e a bujarrona
// presas no mastro e uma bandeirinha no topo. O de antes era meio cilindro
// com a parte redonda para cima (lia como pão de forma) e uma pirâmide solta
// do mastro no lugar da vela.
//
// Ele nasce boiando: a linha d'água fica um pouco acima do fundo do casco
// (o World afunda os enfeites do mar em 0,12).
function boat() {
  const g = new THREE.Group();
  const cor = pick([0xff7bac, 0xfff0a8, 0xffffff, 0x4cc9f0, 0xff6b4a]);

  // O contorno do convés, visto de cima: popa reta e arredondada, proa em
  // bico (em +X).
  const contorno = new THREE.Shape();
  contorno.moveTo(-0.8, -0.34);
  contorno.lineTo(0.3, -0.34);
  contorno.quadraticCurveTo(0.85, -0.3, 1.02, 0);
  contorno.quadraticCurveTo(0.85, 0.3, 0.3, 0.34);
  contorno.lineTo(-0.8, 0.34);
  contorno.quadraticCurveTo(-0.92, 0, -0.8, -0.34);

  const ALTO = 0.42;
  const cascoGeo = new THREE.ExtrudeGeometry(contorno, { depth: ALTO, bevelEnabled: false, curveSegments: 8 });
  cascoGeo.rotateX(Math.PI / 2);              // deita: a altura vira Y, de 0 (convés) a -ALTO
  cascoGeo.translate(0, ALTO, 0);             // fundo no 0, convés em ALTO
  const pos = cascoGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const alto = y / ALTO;                    // 0 no fundo, 1 no convés
    // O fundo estreita (casco em V) e a proa sobe na borda de cima.
    const estreita = 0.45 + 0.55 * alto;
    const sobe = x > 0.2 ? (x - 0.2) * 0.22 * alto : 0;
    pos.setXYZ(i, x * (0.88 + 0.12 * alto), y + sobe, z * estreita);
  }
  cascoGeo.computeVertexNormals();
  const casco = new THREE.Mesh(cascoGeo, mat(cor, { side: THREE.DoubleSide }));
  casco.castShadow = true;
  g.add(casco);

  // O convés de madeira, embutido um tico abaixo da borda.
  const convesGeo = new THREE.ShapeGeometry(contorno, 8);
  convesGeo.scale(0.84, 0.82, 1);
  const conves = new THREE.Mesh(convesGeo, mat(0xd9b384));
  conves.rotation.x = -Math.PI / 2;
  conves.position.y = ALTO - 0.03;
  g.add(conves);

  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.75, 6), mat(0x9a6a48));
  mastro.position.set(0.05, ALTO + 0.85, 0);
  mastro.castShadow = true;
  g.add(mastro);

  // As velas: triângulos finos presos no mastro — a grande para trás e a
  // bujarrona para a proa.
  const vela = (pontos) => {
    const f = new THREE.Shape();
    f.moveTo(...pontos[0]);
    f.lineTo(...pontos[1]);
    f.quadraticCurveTo(...pontos[2], ...pontos[3]);
    f.lineTo(...pontos[0]);
    return new THREE.ShapeGeometry(f, 6);
  };
  const lona = mat(pick([0xffffff, 0xfff6e8, 0xffd9ef]), { side: THREE.DoubleSide });
  const grande = new THREE.Mesh(vela([[0.01, 0.12], [0.01, 1.55], [-0.45, 0.7], [-0.72, 0.12]]), lona);
  grande.position.set(0.05, ALTO, 0.01);
  grande.castShadow = true;
  g.add(grande);
  const bujarrona = new THREE.Mesh(vela([[0.09, 0.2], [0.09, 1.35], [0.45, 0.6], [0.82, 0.1]]), lona);
  bujarrona.position.set(0.05, ALTO, -0.01);
  g.add(bujarrona);

  const bandeira = new THREE.Mesh(vela([[0, 0], [0, 0.14], [-0.12, 0.08], [-0.24, 0.06]]),
    mat(pick([0xff5d8f, 0x4cc9f0, 0xffd166]), { side: THREE.DoubleSide }));
  bandeira.position.set(0.05, ALTO + 1.6, 0);
  g.add(bandeira);
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
  const clara = 0xffffff;
  const RAIO = 1.85;
  const EIXO = 3.1;
  const CABINES = 12;

  // Pé em A dos dois lados, com uma travessa ligando — antes eram duas
  // pernas soltas, e a roda parecia flutuar.
  for (const z of [-0.45, 0.45]) {
    for (const lado of [-1, 1]) {
      const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, EIXO * 1.08, 6), mat(0xb9c2d6));
      perna.position.set(lado * 0.62, EIXO / 2, z);
      perna.rotation.z = -lado * 0.38;
      perna.castShadow = true;
      g.add(perna);
    }
    const travessa = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.09), mat(0xd6dcea));
    travessa.position.set(0, EIXO * 0.42, z);
    g.add(travessa);
  }

  // Eixo central, ligando os dois lados.
  const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 8), mat(0xe8ecf5));
  eixo.rotation.x = Math.PI / 2;
  eixo.position.y = EIXO;
  g.add(eixo);
  const cubo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(cor));
  cubo.position.y = EIXO;
  g.add(cubo);

  // A roda é um grupo próprio: dois aros (um de cada lado), os raios e as
  // cabines penduradas. Fica em `userData.roda` para poder girar (ver
  // World.update).
  const roda = new THREE.Group();
  roda.position.y = EIXO;

  for (const z of [-0.42, 0.42]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(RAIO, 0.075, 6, 28), mat(cor));
    aro.position.z = z;
    aro.castShadow = true;
    roda.add(aro);
    // Aro interno fino, que dá a impressão de estrutura de verdade.
    const interno = new THREE.Mesh(new THREE.TorusGeometry(RAIO * 0.55, 0.04, 5, 20), mat(clara));
    interno.position.z = z;
    roda.add(interno);
  }

  for (let i = 0; i < CABINES; i++) {
    const a = (i / CABINES) * Math.PI * 2;
    const raio = new THREE.Mesh(new THREE.BoxGeometry(0.05, RAIO * 2, 0.05), mat(clara));
    raio.rotation.z = a;
    roda.add(raio);

    // A cabine pendura de um braço curto e é contrapesada: assim, quando a
    // roda gira, ela pode ficar sempre em pé (ver a animação).
    const braco = new THREE.Group();
    braco.position.set(Math.cos(a) * RAIO, Math.sin(a) * RAIO, 0);
    const gancho = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), mat(0xd6dcea));
    gancho.position.y = -0.08;
    braco.add(gancho);

    const corCabine = i % 3 === 0 ? clara : i % 3 === 1 ? cor : 0xffd166;
    const cesta = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), mat(corCabine));
    cesta.position.y = -0.31;
    cesta.castShadow = true;
    braco.add(cesta);
    // Capota arredondada em cima da cesta.
    const capota = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(corCabine === clara ? cor : clara)
    );
    capota.position.y = -0.16;
    capota.scale.set(1, 0.62, 0.95);
    braco.add(capota);

    braco.userData.pendurada = true;
    roda.add(braco);
  }

  g.add(roda);
  g.userData.roda = roda;

  // Bandeirinha no topo, como toda roda-gigante de parque tem.
  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), mat(0xd6dcea));
  mastro.position.y = EIXO + RAIO + 0.3;
  g.add(mastro);
  const bandeira = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.03), mat(0xff4d5e));
  bandeira.position.set(0.18, EIXO + RAIO + 0.45, 0);
  g.add(bandeira);

  return g;
}

// Carrossel: o outro brinquedo que todo parque tem. Um toldo listrado com
// bandeirinhas, e cavalinhos em barras douradas que sobem e descem.
function carousel() {
  const g = new THREE.Group();
  const corA = pick([0xff4d5e, 0x7a4ec7, 0x2f8fd6]);
  const RAIO = 1.15;
  const ALTURA = 1.5;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(RAIO + 0.12, RAIO + 0.2, 0.22, 16), mat(0xfff0d6));
  base.position.y = 0.11;
  base.castShadow = true;
  g.add(base);

  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, ALTURA, 8), mat(0xffd166));
  mastro.position.y = ALTURA / 2 + 0.2;
  g.add(mastro);

  // Toldo em gomos, alternando as cores — é o que faz ler como carrossel.
  const gomos = 10;
  for (let i = 0; i < gomos; i++) {
    const gomo = new THREE.Mesh(
      new THREE.ConeGeometry(RAIO + 0.18, 0.62, 4, 1, true,
        (i / gomos) * Math.PI * 2, (Math.PI * 2) / gomos),
      mat(i % 2 ? corA : 0xfff6fb, { side: THREE.DoubleSide })
    );
    gomo.position.y = ALTURA + 0.5;
    g.add(gomo);
  }
  const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mat(0xffd166));
  ponta.position.y = ALTURA + 0.9;
  g.add(ponta);

  // Os cavalinhos: barra dourada e um corpo simples, em alturas diferentes.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * RAIO * 0.78;
    const z = Math.sin(a) * RAIO * 0.78;
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.1, 5), mat(0xffd166));
    barra.position.set(x, ALTURA * 0.62, z);
    g.add(barra);

    const cavalo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.16),
      mat(i % 2 ? 0xffffff : 0xffd9ec));
    cavalo.position.set(x, 0.62 + Math.sin(i * 1.7) * 0.16, z);
    cavalo.rotation.y = -a;
    cavalo.castShadow = true;
    g.add(cavalo);
    const cabeca = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.12),
      mat(i % 2 ? 0xffffff : 0xffd9ec));
    cabeca.position.set(x + Math.cos(-a) * 0.17, cavalo.position.y + 0.13, z + Math.sin(-a) * 0.17);
    cabeca.rotation.y = -a;
    g.add(cabeca);
  }

  // Bandeirinhas na beirada do toldo.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const flâmula = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02),
      mat(i % 2 ? 0xffd166 : corA));
    flâmula.position.set(Math.cos(a) * (RAIO + 0.16), ALTURA + 0.16, Math.sin(a) * (RAIO + 0.16));
    flâmula.rotation.y = -a;
    g.add(flâmula);
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

// --- Outono -------------------------------------------------------------

// Árvore de outono: o mesmo desenho de tronco e galhos da árvore do Campo,
// mas a copa é mais rala (o outono já derrubou metade das folhas) e sai em
// tons quentes — laranja, vermelho, dourado — em vez do pastel do Campo.
function autumnTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 1.6, 7), mat(0x6b4a35));
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);

  for (const lado of [-1, 1]) {
    const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.45, 5), mat(0x5c3f2c));
    galho.position.set(lado * 0.2, 1.4, lado * 0.08);
    galho.rotation.z = lado * -0.65;
    galho.castShadow = true;
    g.add(galho);
  }

  const copa = new THREE.Group();
  copa.position.y = 1.95;
  g.add(copa);

  const cor = new THREE.Color(pick(AUTUMN));
  const clara = cor.clone().lerp(new THREE.Color(0xfff3d6), 0.3);
  const escura = cor.clone().multiplyScalar(0.78);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.35;
    const raio = 0.4 + Math.random() * 0.2;
    const bolota = new THREE.Mesh(
      new THREE.IcosahedronGeometry(raio, 0),
      mat(i % 2 === 0 ? cor.getHex() : escura.getHex())
    );
    bolota.position.set(Math.cos(a) * 0.5, Math.random() * 0.5, Math.sin(a) * 0.5);
    bolota.castShadow = true;
    copa.add(bolota);
  }
  const topo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(clara.getHex()));
  topo.position.y = 0.4;
  topo.castShadow = true;
  copa.add(topo);

  return g;
}

// Montinho de folhas caídas: discos achatados espalhados rente ao chão,
// quase deitados — é a versão parada do que a `leaf` faz voando.
function leafPile() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const folha = new THREE.Mesh(
      new THREE.CircleGeometry(0.2 + Math.random() * 0.1, 5),
      mat(pick(AUTUMN), { side: THREE.DoubleSide })
    );
    folha.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    folha.rotation.z = Math.random() * Math.PI;
    folha.position.set((Math.random() - 0.5) * 0.7, 0.02 + i * 0.012, (Math.random() - 0.5) * 0.5);
    g.add(folha);
  }
  return g;
}

// Abóbora: usada como enfeite pequeno espalhado e como obstáculo — a mesma
// forma nos dois papéis, igual `stalagmite` na Caverna.
function pumpkin() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 8), mat(0xe8792f));
  corpo.scale.y = 0.82;
  corpo.position.y = 0.43;
  corpo.castShadow = true;
  g.add(corpo);
  // Gomos: reforços mais escuros ao redor do "equador" da abóbora, o que
  // dá a silhueta enrugada sem precisar de mais polígonos.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const gomo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), mat(0xd0651f));
    gomo.scale.set(0.6, 0.82, 2.1);
    gomo.position.set(Math.cos(a) * 0.48, 0.43, Math.sin(a) * 0.48);
    gomo.rotation.y = a;
    g.add(gomo);
  }
  const talo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.26, 6), mat(0x5c7a3f));
  talo.position.y = 0.86;
  talo.rotation.z = 0.15;
  talo.castShadow = true;
  g.add(talo);
  return g;
}

// Tronco caído: obstáculo baixo, deitado atravessando a faixa. Serve tanto
// para o Outono quanto para a Selva — uma árvore caída não muda de cara
// entre uma pista e outra.
function logObstacle() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.7, 9), mat(0x8a5c3c));
  tronco.rotation.z = Math.PI / 2;
  tronco.position.y = 0.34;
  tronco.castShadow = true;
  g.add(tronco);
  for (const x of [-0.85, 0.85]) {
    const anel = new THREE.Mesh(new THREE.CircleGeometry(0.33, 9), mat(0xc9a876));
    anel.rotation.y = Math.PI / 2;
    anel.position.set(x, 0.34, 0);
    g.add(anel);
  }
  for (let i = 0; i < 2; i++) {
    const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.4, 5), mat(0x6b4a35));
    galho.position.set((Math.random() - 0.5) * 1.2, 0.6, (Math.random() < 0.5 ? -1 : 1) * 0.2);
    galho.rotation.z = 0.3;
    galho.castShadow = true;
    g.add(galho);
  }
  return g;
}

// --- Selva ----------------------------------------------------------------

// Folha larga: um cone bem achatado, para ler como lâmina e não como
// espinho. É o que faz a copa da árvore de selva se diferenciar da copa
// arredondada do Campo — folhas grandes saindo para fora, não bolotas.
function jungleLeaf(cor) {
  const folha = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.85, 4), mat(cor));
  folha.scale.z = 0.28;
  folha.castShadow = true;
  return folha;
}

// Árvore de selva: tronco alto com raízes que se espalham na base, copa
// verde bem saturada (sem o tom pastel do Campo) e folhas largas na
// beirada — a silhueta que lê "selva" de longe.
function jungleTree() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.5, 8), mat(0x6b4a35));
  tronco.position.y = 1.25;
  tronco.castShadow = true;
  g.add(tronco);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const raiz = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 5), mat(0x5c3f2c));
    raiz.position.set(Math.cos(a) * 0.26, 0.2, Math.sin(a) * 0.26);
    raiz.rotation.z = Math.cos(a) * 0.55;
    raiz.rotation.x = Math.sin(a) * 0.55;
    raiz.castShadow = true;
    g.add(raiz);
  }

  const copa = new THREE.Group();
  copa.position.y = 2.6;
  g.add(copa);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.random() * 0.3;
    const bolota = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.16, 1),
      mat(pick(JUNGLE_GREENS))
    );
    bolota.position.set(Math.cos(a) * 0.45, Math.random() * 0.3, Math.sin(a) * 0.45);
    bolota.castShadow = true;
    copa.add(bolota);
  }

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
    const folha = jungleLeaf(pick(JUNGLE_GREENS));
    folha.position.set(Math.cos(a) * 0.75, 0.1 + Math.random() * 0.4, Math.sin(a) * 0.75);
    folha.rotation.z = Math.PI / 2 + Math.cos(a) * 0.4;
    folha.rotation.y = -a;
    copa.add(folha);
  }

  return g;
}

// Árvore de selva bem grande: a mesma árvore, só que maior — para dar a
// sensação de mata antiga, com uma ou outra árvore que passou dos outros
// no tamanho. Sorteada bem menos vezes que a árvore normal (ver
// tracks.js), senão a mata parecia feita só de gigantes.
function bigJungleTree() {
  const g = jungleTree();
  g.scale.setScalar(2.3);
  return g;
}

// Cipó pendurado: um tronco de apoio com um galho saindo dele, e fios de
// elos descendo do galho, cada um com folhinhas de vez em quando — a
// mesma ideia de corrente de elos do rabo e da crina do unicórnio, só que
// parada. Sem o tronco, o galho e o cipó ficavam boiando no ar, sem nada
// embaixo — era a "árvore" mais fácil de plantar, e a que mais parecia
// errada.
function hangingVine() {
  const g = new THREE.Group();

  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 2.4, 7), mat(0x5c3f2c));
  tronco.position.y = 1.2;
  tronco.castShadow = true;
  g.add(tronco);

  const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.7, 6), mat(0x5c3f2c));
  galho.rotation.z = Math.PI / 2;
  galho.position.set(0.35, 2.35, 0);
  galho.castShadow = true;
  g.add(galho);

  for (const x of [0.35, 0.55, 0.7]) {
    const elos = 6 + Math.floor(Math.random() * 3);
    let y = 2.3;
    for (let i = 0; i < elos; i++) {
      const comprimento = 0.32;
      const elo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.026, comprimento, 5),
        mat(0x3f7d4d)
      );
      elo.position.set(x + Math.sin(i * 0.6) * 0.06, y - comprimento / 2, 0);
      g.add(elo);
      y -= comprimento;
      if (i % 2 === 0) {
        const folhinha = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(pick(JUNGLE_GREENS)));
        folhinha.scale.set(1.3, 0.5, 0.7);
        folhinha.position.set(x + 0.08, y + comprimento / 2, 0.04);
        g.add(folhinha);
      }
    }
  }
  return g;
}

// Nó de cipós: obstáculo em forma de tangle — um miolo com laços soltos em
// volta, como uma trepadeira que cresceu presa em si mesma.
function vineTangle() {
  const g = new THREE.Group();
  const nucleo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(0x2f7a3f));
  nucleo.position.y = 0.6;
  nucleo.castShadow = true;
  g.add(nucleo);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const raio = 0.15 + Math.random() * 0.12;
    const laco = new THREE.Mesh(new THREE.TorusGeometry(raio, 0.045, 5, 8), mat(pick(JUNGLE_GREENS)));
    laco.position.set(Math.cos(a) * 0.3, 0.5 + Math.random() * 0.5, Math.sin(a) * 0.3);
    laco.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    g.add(laco);
  }
  return g;
}

const DECORATIONS = {
  tree, pineTree, mushroom, glowMushroom, crystal, flower, flowerPatch,
  lollipop, cupcake, candyCane, sprinkles, chocolate,
  cloudHill, balloon, rainbowArch,
  strawberry, orangeTree, bananaPile, watermelonPatch, orangePile, grapes, kiwi,
  apple, cherries, pear,
  coral, seaweed, starfish,
  lavaRock, emberVent, charredTree, lavaPool,
  snowPine, igloo, iceCrystal, snowman,
  planet, asteroid, asteroidChunk, ufo,
  parasol, sandcastle, palmTree, beachChair, clam,
  boat, surfboard, buoy,
  circusTent, ferrisWheel, cottonCandy, carousel,
  windmill, lightningRod, puddle,
  ghostTree, floatingLantern, mossRock,
  crystalVein, stalagmite, glowPool,
  cottage, lamppost, well,
  autumnTree, leafPile, pumpkin,
  jungleTree, bigJungleTree, hangingVine,
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

// Barra de doce: um bastão listrado em espiral, como bala de bengala, com
// embrulho torcido nas pontas, apoiado em dois palitos também listrados. A
// trave rosa lisa de antes lia como barreira de atletismo.
function candyBar() {
  const g = new THREE.Group();
  const [corA, corB] = pick([[0xff5d8f, 0xfff1f6], [0x3fc1a5, 0xfff1f6], [0xffb703, 0xfff8e8]]);

  const barraGeo = pintarDuasCores(
    new THREE.CylinderGeometry(0.17, 0.17, 1.6, 20, 40, true), espiral(5, 'v'), corA, corB
  );
  const barra = new THREE.Mesh(barraGeo, tintaDaMalha({ side: THREE.DoubleSide }));
  barra.rotation.z = Math.PI / 2;
  barra.position.y = 0.9;
  barra.castShadow = true;
  g.add(barra);

  // O embrulho: de cada lado, a tampinha da bala, o pescoço torcido do
  // papel e a franja abrindo para fora — o laço de bala embrulhada.
  const papel = mat(0xffffff, { transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  for (const lado of [-1, 1]) {
    const tampa = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6), mat(corB));
    tampa.scale.x = 0.4;
    tampa.position.set(lado * 0.8, 0.9, 0);
    g.add(tampa);
    const pescoco = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), papel);
    pescoco.scale.x = 1.4;
    pescoco.position.set(lado * 0.9, 0.9, 0);
    g.add(pescoco);
    const franja = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.21, 0.2, 8, 1, true), papel);
    franja.rotation.z = lado * Math.PI / 2;       // a boca larga para fora
    franja.position.set(lado * 1.02, 0.9, 0);
    g.add(franja);
  }

  for (const lado of [-0.6, 0.6]) {
    const palito = new THREE.Mesh(
      pintarDuasCores(new THREE.CylinderGeometry(0.07, 0.08, 0.85, 8, 6, true), espiral(2, 'v'), corA, 0xfff8f0),
      tintaDaMalha({ side: THREE.DoubleSide })
    );
    palito.position.set(lado, 0.42, 0);
    palito.castShadow = true;
    g.add(palito);
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

// O perfil da bala de goma: base larga e redonda, ombro caído, topo
// arredondado — a gota baixinha, não o ovo alto de antes.
const BALA_PERFIL = [
  [0, 0], [0.6, 0], [0.68, 0.07], [0.67, 0.3], [0.58, 0.58],
  [0.42, 0.84], [0.22, 0.99], [0, 1.03],
];

// Bala de goma: a gota coberta de açúcar cristal. Antes era um ovo oval em
// cima de um pratinho e lia como ovo de Páscoa.
function gumdrop() {
  const g = new THREE.Group();
  const color = pick([0xff5d8f, 0x4cc9f0, 0xffd166, 0x8ce99a, 0xc77dff, 0xff9f1c]);
  const bala = new THREE.Mesh(
    new THREE.LatheGeometry(BALA_PERFIL.map(([r, y]) => new THREE.Vector2(r, y)), 18),
    mat(color)
  );
  bala.castShadow = true;
  g.add(bala);

  // O açúcar: grãozinhos claros salpicados rente à casca.
  const graoGeo = new THREE.OctahedronGeometry(0.035, 0);
  const grao = mat(new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.75));
  for (let i = 0; i < 46; i++) {
    const k = 1 + Math.floor(Math.random() * (BALA_PERFIL.length - 2));
    const [r0, y0] = BALA_PERFIL[k];
    const [r1, y1] = BALA_PERFIL[k + 1];
    const f = Math.random();
    const r = r0 + (r1 - r0) * f, y = y0 + (y1 - y0) * f;
    const a = Math.random() * Math.PI * 2;
    const pedaco = new THREE.Mesh(graoGeo, grao);
    pedaco.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    pedaco.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    g.add(pedaco);
  }
  return g;
}

// Rosquinha: massa dourada e a cobertura só na face da frente, com a borda
// ondulada de calda escorrendo e granulado por cima. Antes a cobertura era
// um anel do mesmo tamanho da massa, um tico à frente: os dois brigavam
// pela mesma superfície e a cobertura aparecia em listras piscando.
function donut() {
  const g = new THREE.Group();
  const R = 0.55, TUBO = 0.26;
  const massa = new THREE.Mesh(new THREE.TorusGeometry(R, TUBO, 10, 24), mat(0xe9a96a));
  massa.position.y = 0.8;
  massa.castShadow = true;
  g.add(massa);

  // A cobertura é uma casca um tico maior que a massa, recortada triângulo
  // a triângulo: fica só o que olha para a frente, e o limite do recorte
  // ondula com o ângulo — é isso que desenha a calda escorrendo. Por ser
  // maior que a massa, não briga com ela pela mesma superfície.
  const casca = new THREE.TorusGeometry(R, TUBO * 1.05, 14, 64).toNonIndexed();
  const todos = casca.attributes.position;
  const ficam = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const meio = new THREE.Vector3(), centro = new THREE.Vector3();
  for (let t = 0; t < todos.count; t += 3) {
    a.fromBufferAttribute(todos, t);
    b.fromBufferAttribute(todos, t + 1);
    c.fromBufferAttribute(todos, t + 2);
    meio.copy(a).add(b).add(c).divideScalar(3);
    const ang = Math.atan2(meio.y, meio.x);
    centro.set(Math.cos(ang) * R, Math.sin(ang) * R, 0);
    const frente = meio.sub(centro).normalize().z;
    const limite = -0.2 + 0.2 * Math.sin(ang * 9) + 0.08 * Math.sin(ang * 23);
    if (frente > limite) ficam.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  const coberturaGeo = new THREE.BufferGeometry();
  coberturaGeo.setAttribute('position', new THREE.Float32BufferAttribute(ficam, 3));
  coberturaGeo.computeVertexNormals();
  const cobertura = new THREE.Mesh(coberturaGeo, mat(pick([0xff7bac, 0x9be7ff, 0xc4f0a8, 0x7b4a2e, 0xfff0f6])));
  cobertura.position.y = 0.8;
  g.add(cobertura);

  // Granulado na face da frente da cobertura.
  const T = TUBO * 1.05;
  for (let i = 0; i < 22; i++) {
    const ang = Math.random() * Math.PI * 2;
    const t = (Math.random() - 0.5) * 1.5;       // ângulo em volta do tubo, perto da frente
    const raio = R + Math.sin(t) * T;
    const bit = granulo();
    bit.position.set(Math.cos(ang) * raio, 0.8 + Math.sin(ang) * raio, Math.cos(t) * T + 0.012);
    bit.rotation.set(0, 0, Math.random() * Math.PI);
    g.add(bit);
  }
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
  pumpkin, logObstacle, vineTangle,
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
  outono: { bar: 0x8a5c3c, post: 0x6b4a35, warn: 0xe0a83f, top: 'folha' },
  selva: { bar: 0x5c3f2c, post: 0x3f7d4d, warn: 0xffd166, top: 'cipo' },
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
  folha: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), mat(pick(AUTUMN)));
      f.scale.z = 0.3;
      f.rotation.z = (i / 3) * Math.PI * 2;
      g.add(f);
    }
    return g;
  },
  cipo: () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat(pick(JUNGLE_GREENS))));
    const laco = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 5, 8), mat(0x3f7d4d));
    g.add(laco);
    return g;
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
// O desenho das asas de borboleta, do lado direito (x > 0), com a dobradiça
// no eixo do corpo (x = 0). A de cima é larga e pontuda; a de baixo, um
// lóbulo redondo. Feito uma vez só e compartilhado por todas.
const ASA_DE_CIMA = (() => {
  const f = new THREE.Shape();
  f.moveTo(0, 0.01);
  f.bezierCurveTo(0.06, 0.2, 0.26, 0.33, 0.35, 0.27);
  f.quadraticCurveTo(0.39, 0.15, 0.24, 0.03);
  f.lineTo(0, -0.01);
  return f;
})();
const ASA_DE_BAIXO = (() => {
  const f = new THREE.Shape();
  f.moveTo(0, -0.01);
  f.bezierCurveTo(0.2, -0.01, 0.28, -0.15, 0.21, -0.24);
  f.quadraticCurveTo(0.13, -0.3, 0.05, -0.17);
  f.lineTo(0, -0.03);
  return f;
})();
// A borda é o desenho inteiro; o miolo, o mesmo desenho encolhido para a
// dobradiça — a borda escura aparece mais larga na ponta, como na asa de
// verdade.
const BORBOLETA = (() => {
  const borda = new THREE.ShapeGeometry([ASA_DE_CIMA, ASA_DE_BAIXO], 8);
  const cima = new THREE.ShapeGeometry(ASA_DE_CIMA, 8);
  cima.scale(0.74, 0.74, 1);
  cima.translate(0.01, 0.005, 0);
  const baixo = new THREE.ShapeGeometry(ASA_DE_BAIXO, 8);
  baixo.scale(0.72, 0.72, 1);
  const miolo = juntar([[cima, new THREE.Matrix4()], [baixo, new THREE.Matrix4()]]);
  const corpo = juntar([
    [new THREE.CapsuleGeometry(0.035, 0.2, 2, 5), naPosicao(0, -0.06, 0)],
    [new THREE.SphereGeometry(0.035, 6, 4), naPosicao(0, 0.09, 0)],
    [new THREE.CylinderGeometry(0.006, 0.006, 0.17, 3), apontar(new THREE.Vector3(0.01, 0.1, 0), new THREE.Vector3(0.45, 1, 0))],
    [new THREE.CylinderGeometry(0.006, 0.006, 0.17, 3), apontar(new THREE.Vector3(-0.01, 0.1, 0), new THREE.Vector3(-0.45, 1, 0))],
  ].map(([geo, m]) => {
    if (geo.type === 'CylinderGeometry') geo.translate(0, 0.085, 0);
    return [geo, m];
  }));
  return { borda, miolo, corpo };
})();

// [miolo, borda]
const BORBOLETA_CORES = [
  [0xff9ecb, 0x8a3f8f],   // rosa
  [0xffd166, 0x6b4a2e],   // amarela
  [0x9be7ff, 0x24507a],   // azul
  [0xc9a6ff, 0x5b3a8f],   // lilás
  [0xff9a3c, 0x2a2228],   // monarca
];

// Borboleta: asas desenhadas, com borda escura e miolo colorido, e o corpo
// com antenas. É pequena e passa voando, então fica no essencial: cinco
// malhas — o corpo, e borda e miolo de cada lado. O miolo fica no mesmo
// plano da borda e ganha dela na profundidade (polygonOffset), então a asa
// tem o mesmo desenho dos dois lados sem precisar de uma camada por face.
function butterfly() {
  const g = new THREE.Group();
  const [miolo, borda] = pick(BORBOLETA_CORES);
  const basico = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, fog: false, side: THREE.DoubleSide, ...extra });
  const corBorda = basico(borda);
  const corMiolo = basico(miolo, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });

  g.add(new THREE.Mesh(BORBOLETA.corpo, basico(0x3a2a40)));

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const lado = new THREE.Group();
    lado.scale.x = side;                    // o lado esquerdo é o direito espelhado
    lado.position.y = 0.02;
    lado.add(new THREE.Mesh(BORBOLETA.borda, corBorda));
    lado.add(new THREE.Mesh(BORBOLETA.miolo, corMiolo));
    wing.add(lado);
    wing.userData.side = side;
    g.add(wing);
    wings.push(wing);
  }

  g.userData.parts = { wings };
  return g;
}

// Abelha: corpo listrado e asinhas transparentes.
// O corpo listrado da abelha, feito uma vez só: os polos da esfera vão para
// o eixo X, para os anéis da malha correrem no sentido das listras, e a cor
// vai por triângulo (malha sem índice) pelo meio entre o menor e o maior X
// do triângulo — igual nos dois triângulos de cada quadradinho, então a
// borda da listra sai reta.
const ABELHA = (() => {
  const corpo = new THREE.SphereGeometry(0.13, 10, 14).toNonIndexed();
  corpo.rotateZ(Math.PI / 2);
  corpo.scale(1.4, 1, 1);
  const amarelo = new THREE.Color(0xffd23f);
  const listra = new THREE.Color(0x3a2a20);
  const pos = corpo.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  for (let t = 0; t < pos.count; t += 3) {
    const xs = [pos.getX(t), pos.getX(t + 1), pos.getX(t + 2)];
    const x = (Math.min(...xs) + Math.max(...xs)) / 2;
    const naListra = (x > -0.06 && x < -0.015) || (x > -0.145 && x < -0.1);
    const cor = naListra ? listra : amarelo;
    for (let k = 0; k < 3; k++) cores.set([cor.r, cor.g, cor.b], (t + k) * 3);
  }
  corpo.setAttribute('color', new THREE.BufferAttribute(cores, 3));

  // Cabeça, ferrão e antenas: tudo marrom-escuro, numa malha só.
  const antena = () => {
    const a = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 3);
    a.translate(0, 0.06, 0);
    return a;
  };
  const ferrao = new THREE.ConeGeometry(0.03, 0.08, 4);
  ferrao.rotateZ(Math.PI / 2);
  const escuro = juntar([
    [new THREE.SphereGeometry(0.09, 8, 6), naPosicao(0.2, 0.03, 0)],
    [ferrao, naPosicao(-0.205, 0, 0)],
    [antena(), apontar(new THREE.Vector3(0.22, 0.1, 0.035), new THREE.Vector3(0.5, 1, 0.3))],
    [antena(), apontar(new THREE.Vector3(0.22, 0.1, -0.035), new THREE.Vector3(0.5, 1, -0.3))],
  ]);
  const olhos = juntar([
    [new THREE.SphereGeometry(0.03, 6, 4), naPosicao(0.265, 0.06, 0.045)],
    [new THREE.SphereGeometry(0.03, 6, 4), naPosicao(0.265, 0.06, -0.045)],
  ]);
  const asa = new THREE.CircleGeometry(0.11, 10);
  asa.scale(1, 0.55, 1);
  asa.rotateX(-Math.PI / 2);
  asa.rotateY(Math.PI / 2);
  return { corpo, escuro, olhos, asa };
})();

// Abelha: gordinha, listrada, de cabeça escura com dois olhinhos brancos e
// um par de asas. É pequena e passa voando, então fica no essencial: cinco
// malhas, e a geometria é a mesma para todas as abelhas da pista.
function bee() {
  const g = new THREE.Group();
  const basico = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...extra });

  g.add(new THREE.Mesh(ABELHA.corpo, basico(0xffffff, { vertexColors: true })));
  g.add(new THREE.Mesh(ABELHA.escuro, basico(0x3a2a20)));
  g.add(new THREE.Mesh(ABELHA.olhos, basico(0xffffff)));

  // Uma asa de cada lado, aberta em V por cima das costas. O grupo fica no
  // dorso, que é onde a animação gira.
  const asaMat = basico(0xe6f6ff, { transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(0, 0.11, side * 0.03);
    const asa = new THREE.Mesh(ABELHA.asa, asaMat);
    asa.position.set(0, 0.03, side * 0.1);
    asa.rotation.x = -side * 0.6;            // a ponta sobe: o V aberto para cima
    wing.add(asa);
    wing.userData.side = side;
    g.add(wing);
    wings.push(wing);
  }

  g.userData.parts = { wings };
  return g;
}

// Mosca: bem menor que a abelha, corpo escuro fosco e asas que quase não
// aparecem — é do zigue-zague errático (ver animateAmbience) que se
// reconhece mosca, não da forma.
function fly() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0x2a2a2f, fog: false })
  );
  g.add(body);

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const asa = asaSimples(0xcfd8e6, 0.07);
    asa.material.opacity = 0.5;
    asa.position.set(0.01, 0.03, side * 0.045);
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

// Papagaio: o mesmo desenho do passarinho do Céu, mas em cor viva (não
// pastel) e com uma cauda comprida — é o que faz reconhecer "selva" no ar,
// mesmo de longe.
function parrot() {
  const g = new THREE.Group();
  const color = pick([0xff4d4d, 0x2f9bff, 0x4fbf63, 0xffd166]);
  const corAsa = pick([0xffd166, 0x2f9bff, 0xff4d4d, 0x4fbf63]);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 7, 6),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  body.scale.set(1.2, 1, 1);
  g.add(body);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.12, 5),
    new THREE.MeshBasicMaterial({ color: 0xffab1f, fog: false })
  );
  beak.rotation.z = -Math.PI / 2;
  beak.position.x = 0.24;
  g.add(beak);

  const cauda = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.5, 4),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  cauda.rotation.z = Math.PI / 2;
  cauda.position.x = -0.32;
  g.add(cauda);

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const asa = asaSimples(corAsa, 0.22);
    asa.scale.set(1, 0.5, 1);
    asa.position.set(-0.02, 0, side * 0.15);
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
// Peixe: corpo, uma faixa de outra cor, nadadeira em cima, rabo bifurcado e
// um olho de cada lado. Antes era uma figura chapada com olho de um lado só.
// Seis malhas: é pequeno e passa longe, não precisa de mais.
function fish() {
  const g = new THREE.Group();
  const [cor, faixa] = pick([
    [0xff9f68, 0xffffff], [0xffd166, 0x4cc9f0], [0x9be7ff, 0xffd166], [0xff8fb1, 0xffffff], [0xa6ffcb, 0xff8fb1],
  ]);
  const basico = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...extra });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), basico(cor));
  body.scale.set(1.5, 1, 0.6);
  g.add(body);

  const listra = new THREE.Mesh(new THREE.SphereGeometry(0.185, 10, 8), basico(faixa));
  listra.scale.set(0.32, 1.01, 0.62);
  listra.position.x = 0.04;
  g.add(listra);

  const lado = basico(cor, { side: THREE.DoubleSide });
  const dorso = new THREE.Shape();
  dorso.moveTo(-0.14, 0);
  dorso.quadraticCurveTo(-0.06, 0.16, 0.08, 0.02);
  dorso.lineTo(-0.14, 0);
  const barbatana = new THREE.Mesh(new THREE.ShapeGeometry(dorso), lado);
  barbatana.position.y = 0.14;
  g.add(barbatana);

  const tail = new THREE.Group();
  const rabo = new THREE.Shape();
  rabo.moveTo(0, 0);
  rabo.lineTo(-0.2, 0.14);
  rabo.quadraticCurveTo(-0.14, 0, -0.2, -0.14);
  rabo.lineTo(0, 0);
  tail.add(new THREE.Mesh(new THREE.ShapeGeometry(rabo), lado));
  tail.position.x = -0.24;
  g.add(tail);

  const olhos = juntar([
    [new THREE.SphereGeometry(0.035, 6, 5), naPosicao(0.17, 0.05, 0.09)],
    [new THREE.SphereGeometry(0.035, 6, 5), naPosicao(0.17, 0.05, -0.09)],
  ]);
  g.add(new THREE.Mesh(olhos, basico(0x30203a)));

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

// Formiguinha andando pela beira da pista dos doces — de cara simpática,
// como a abelha: cabeça grande com olhos e antenas dobradas, cintura
// fininha, abdome redondo e seis pernas com joelho. Metade delas leva um
// granulado na boca, que é o que formiga faz numa pista feita de doce.
// Antes eram três bolinhas escuras em fila com pauzinhos retos, e de longe
// virava um borrão.
//
// O chão fica em y = -0,12 (ela nasce a 0,12 de altura, ver World).
const FORMIGA_CHAO = -0.12;
function ant() {
  const g = new THREE.Group();
  const corpo = new THREE.Group();
  const basico = (color) => new THREE.MeshBasicMaterial({ color, fog: false });
  const casca = basico(0x4a2a22);
  const escuro = basico(0x2e1a14);

  const bola = (r, [sx, sy, sz], [x, y, z], material = casca) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), material);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    corpo.add(m);
    return m;
  };
  bola(0.14, [1.3, 1, 1], [-0.22, 0.05, 0]);                   // abdome
  bola(0.05, [1.2, 0.5, 0.9], [-0.15, 0.13, 0.06], basico(0x8a5a4a)); // brilho do abdome
  bola(0.035, [1, 1, 1], [-0.06, 0.01, 0]);                    // cintura
  bola(0.07, [1.45, 0.9, 0.9], [0.03, 0.02, 0]);               // tórax
  bola(0.11, [1, 0.95, 1], [0.18, 0.07, 0]);                   // cabeça

  for (const lado of [-1, 1]) {
    bola(0.036, [1, 1, 1], [0.255, 0.1, lado * 0.055], basico(0xffffff));
    bola(0.019, [1, 1, 1], [0.283, 0.1, lado * 0.06], basico(0x111111));

    // Antena dobrada no cotovelo, com bolinha na ponta.
    const antena = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.2, 0.16, lado * 0.04),
        new THREE.Vector3(0.22, 0.28, lado * 0.07),
        new THREE.Vector3(0.33, 0.31, lado * 0.1),
      ], false, 'catmullrom', 0.2), 8, 0.01, 4),
      escuro
    );
    corpo.add(antena);
    bola(0.022, [1, 1, 1], [0.34, 0.305, lado * 0.105], escuro);

    // Mandíbulas.
    const mandibula = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 4), escuro);
    mandibula.rotation.z = -Math.PI / 2 - 0.3;
    mandibula.position.set(0.28, 0.02, lado * 0.03);
    corpo.add(mandibula);
  }

  // Metade carrega um granulado atravessado na boca.
  if (Math.random() < 0.5) {
    const carga = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.035, 0.16, 3, 6),
      basico(pick([0xff5d8f, 0xffd166, 0x4cc9f0, 0x8ce99a, 0xc77dff]))
    );
    carga.rotation.x = Math.PI / 2;
    carga.position.set(0.32, 0.03, 0);
    corpo.add(carga);
  }

  // As pernas: cada uma gira no quadril, que fica no tórax, e tem um joelho
  // levantado antes de descer até o chão. As da frente apontam para a
  // frente e as de trás para trás, como formiga de verdade.
  const pernas = [];
  [[-0.02, -0.12], [0.03, 0], [0.08, 0.12]].forEach(([x, pe], i) => {
    for (const lado of [-1, 1]) {
      const quadril = new THREE.Group();
      quadril.position.set(x, -0.01, lado * 0.04);
      const perna = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(pe * 0.4, 0.07, lado * 0.13),
          new THREE.Vector3(pe, FORMIGA_CHAO + 0.01, lado * 0.21),
        ], false, 'catmullrom', 0.1), 8, 0.013, 4),
        escuro
      );
      quadril.add(perna);
      // Passo em tripé: frente e trás de um lado andam junto com a do meio
      // do outro.
      quadril.userData.fase = (i + (lado > 0 ? 1 : 0)) % 2 ? Math.PI : 0;
      corpo.add(quadril);
      pernas.push(quadril);
    }
  });

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
// A asa da gaivota, do lado +Z: larga na raiz, afinando até a ponta e um
// tico varrida para trás. A ponta preta é um pedaço à parte.
const GAIVOTA = (() => {
  const asa = new THREE.Shape();
  asa.moveTo(0.15, 0);
  asa.lineTo(0.06, 0.72);
  asa.quadraticCurveTo(-0.02, 0.98, -0.16, 1.06);
  asa.lineTo(-0.17, 0.72);
  asa.lineTo(-0.13, 0);
  asa.lineTo(0.15, 0);
  const ponta = new THREE.Shape();
  ponta.moveTo(0.03, 0.8);
  ponta.quadraticCurveTo(-0.03, 0.98, -0.16, 1.06);
  ponta.lineTo(-0.17, 0.8);
  ponta.lineTo(0.03, 0.8);
  const deitar = (geo) => geo.rotateX(Math.PI / 2);   // o vão (Y da forma) vira Z
  const corpo = juntar([
    [new THREE.CapsuleGeometry(0.12, 0.34, 3, 6), new THREE.Matrix4().makeRotationZ(Math.PI / 2)],
    [new THREE.SphereGeometry(0.11, 7, 6), naPosicao(0.27, 0.05, 0)],
    [(() => { const c = new THREE.ConeGeometry(0.1, 0.22, 4); c.rotateZ(Math.PI / 2); return c; })(), naPosicao(-0.3, 0.02, 0)],
  ]);
  const bico = new THREE.ConeGeometry(0.035, 0.14, 5);
  bico.rotateZ(-Math.PI / 2);
  bico.translate(0.41, 0.03, 0);
  const olhos = juntar([
    [new THREE.SphereGeometry(0.022, 5, 4), naPosicao(0.33, 0.09, 0.07)],
    [new THREE.SphereGeometry(0.022, 5, 4), naPosicao(0.33, 0.09, -0.07)],
  ]);
  return {
    corpo, bico, olhos,
    asa: deitar(new THREE.ShapeGeometry(asa, 6)),
    ponta: deitar(new THREE.ShapeGeometry(ponta, 6)),
  };
})();

// Gaivota: corpo branco, asas finas e compridas, cinza em cima e de ponta
// preta — é o contraste da ponta escura que a faz aparecer contra o céu
// claro. As de antes eram três caixinhas brancas em fila e, de longe,
// liam como um "T" de blocos. Sete malhas, todas compartilhadas.
export function createSeagull() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(GAIVOTA.corpo, mat(0xffffff)));
  g.add(new THREE.Mesh(GAIVOTA.bico, mat(0xffb02e)));
  g.add(new THREE.Mesh(GAIVOTA.olhos, mat(0x222228)));

  const cinza = mat(0xc4ccd6, { side: THREE.DoubleSide });
  const preto = mat(0x2a2a30, { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  const wings = [];
  for (const side of [-1, 1]) {
    const asa = new THREE.Group();
    asa.position.y = 0.06;
    const lado = new THREE.Group();
    lado.scale.z = side;                       // a da esquerda é a da direita espelhada
    lado.add(new THREE.Mesh(GAIVOTA.asa, cinza), new THREE.Mesh(GAIVOTA.ponta, preto));
    asa.add(lado);
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

// Folha caindo: um disco achatado numa cor quente, que balança e gira
// devagar enquanto desce — bem mais devagar que o floco de neve, para ler
// como folha boiando no ar e não como neve caindo reto.
function leaf() {
  const disco = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 5),
    new THREE.MeshBasicMaterial({ color: pick(AUTUMN), side: THREE.DoubleSide, fog: false })
  );
  disco.userData.parts = { queda: 0.55 + Math.random() * 0.5 };
  return disco;
}

// Nota musical: a cabeça oval deitada, a haste e a bandeirinha. É o que
// voa no Parque, onde a música nunca para.
function musicNote() {
  const g = new THREE.Group();
  const cor = pick([0xff4d5e, 0x7a4ec7, 0x2f8fd6, 0xffffff]);
  const material = mat(cor, { emissive: new THREE.Color(cor).multiplyScalar(0.2) });

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), material);
  cabeca.scale.set(1.25, 0.85, 0.7);
  cabeca.rotation.z = -0.35;
  g.add(cabeca);

  const haste = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.045), material);
  haste.position.set(0.14, 0.26, 0);
  g.add(haste);

  // A bandeirinha, que é o que faz a colcheia ser reconhecível de longe.
  const bandeira = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.04), material);
  bandeira.position.set(0.23, 0.42, 0);
  bandeira.rotation.z = -0.5;
  g.add(bandeira);

  g.userData.parts = { cor };
  return g;
}

// Confete: um papelzinho chapado que roda enquanto cai.
function confetti() {
  const cor = pick([0xff4d5e, 0xffd166, 0x4dc3ff, 0x8ce99a, 0xff8fc4, 0xffffff]);
  const papel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.34),
    new THREE.MeshLambertMaterial({ color: cor, side: THREE.DoubleSide, flatShading: true })
  );
  const g = new THREE.Group();
  g.add(papel);
  g.userData.parts = { papel };
  return g;
}

const AMBIENCE = {
  firefly: createFirefly, butterfly, bee, fly, bird, fish, bubble, ant,
  spark: createSpark, smoke: createSmoke, snow: createSnowflake,
  seagull: createSeagull, meteorite: createMeteorite, rain: createRaindrop,
  note: musicNote, confetti,
  leaf, parrot,
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

  // A nota sobe girando devagar, como se a música estivesse subindo.
  if (kind === 'note') {
    item.rotation.y = t * 1.4;
    item.rotation.z = Math.sin(t * 1.8) * 0.35;
    return { x: Math.sin(t * 0.9) * 1.8, y: Math.sin(t * 0.7) * 1.5 };
  }

  // O confete cai rodopiando e vai de um lado para o outro, como papel no ar.
  if (kind === 'confetti') {
    parts.papel.rotation.x = t * 4.2;
    parts.papel.rotation.y = t * 2.6;
    // Uma descida contínua que reinicia em cima: papel que cai, e não flutua.
    const queda = 3.2;
    return {
      x: Math.sin(t * 1.5) * 1.4,
      y: queda / 2 - ((elapsed * (0.9 + speed) + phase * 3) % queda),
    };
  }

  if (kind === 'bee') {
    const bate = Math.sin(elapsed * 26 + phase);
    for (const wing of parts.wings) wing.rotation.x = wing.userData.side * bate * 0.5;
    return { x: Math.sin(t * 2.6) * 1.2, y: Math.sin(t * 3.4) * 0.5 };
  }

  // A mosca soma duas frequências bem diferentes em cada eixo, em vez de
  // um só seno — é o que faz o caminho ficar espasmódico, sem a curva
  // suave de qualquer outro bichinho do jogo.
  if (kind === 'fly') {
    const bate = Math.sin(elapsed * 32 + phase);
    for (const wing of parts.wings) wing.rotation.x = wing.userData.side * bate * 0.5;
    return {
      x: Math.sin(t * 3.2) * 0.9 + Math.sin(t * 7.3 + 1) * 0.35,
      y: Math.sin(t * 4.1 + 2) * 0.5 + Math.sin(t * 9.7) * 0.2,
    };
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

  // O papagaio bate asa mais rápido e some mais para os lados que o
  // passarinho do Céu — é o que faz ler como voo de selva, e não plano.
  if (kind === 'parrot') {
    const bate = Math.sin(elapsed * 7 + phase);
    for (const wing of parts.wings) wing.rotation.x = wing.userData.side * bate * 0.8;
    item.rotation.y = Math.sin(t * 0.6) * 0.4;
    return { x: Math.sin(t * 0.9) * 2.9, y: Math.sin(t * 1.3) * 1.0 };
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

  if (kind === 'leaf') {
    // Bem mais devagar que a neve, e balançando de lado a lado como folha
    // boiando no ar — a neve cai quase reto, a folha zigue-zagueia.
    const ciclo = 9;
    const caiu = (elapsed * parts.queda + phase * 3) % ciclo;
    item.rotation.x = Math.sin(t * 1.4) * 0.6;
    item.rotation.z = t * 0.6;
    return { x: Math.sin(t * 0.6) * 2.2, y: ciclo - caiu };
  }

  if (kind === 'ant') {
    // Anda em fila, no passo de tripé: as pernas balançam para a frente e
    // para trás em duas turmas desencontradas, e o corpo sobe a cada passo.
    const passo = elapsed * 12 + phase;
    for (const perna of parts.pernas) perna.rotation.y = Math.sin(passo + perna.userData.fase) * 0.35;
    parts.corpo.position.y = Math.abs(Math.sin(passo)) * 0.015;
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

// O raio da Tempestade: um risco quebrado do alto do céu até perto do
// horizonte, com um segundo risco mais fino saindo dele. Fica escondido e
// aparece por um instante quando cai (ver World.flashBolt).
//
// É desenhado como um traço em zigue-zague e não como imagem: assim cada
// raio pode nascer com um caminho diferente, e nenhum é igual ao anterior.
export function createLightningBolt() {
  const g = new THREE.Group();
  const mat_ = () => new THREE.MeshBasicMaterial({
    color: 0xfff9c4, transparent: true, opacity: 0.95, fog: false, side: THREE.DoubleSide,
  });

  // Caminho principal: desce em degraus, cambaleando de lado.
  const passos = 7;
  let x = 0;
  let y = 0;
  for (let i = 0; i < passos; i++) {
    const proximoX = x + (Math.random() - 0.5) * 5;
    const proximoY = y - (3 + Math.random() * 2.4);
    const dx = proximoX - x;
    const dy = proximoY - y;
    const comprimento = Math.hypot(dx, dy);
    const trecho = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85 - i * 0.08, comprimento),
      mat_()
    );
    trecho.position.set((x + proximoX) / 2, (y + proximoY) / 2, 0);
    trecho.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    g.add(trecho);

    // Uma ramificação no meio do caminho.
    if (i === 3) {
      const ramo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 4.5), mat_());
      ramo.position.set(proximoX + 1.6, proximoY - 1.8, 0);
      ramo.rotation.z = 0.7;
      g.add(ramo);
    }
    x = proximoX;
    y = proximoY;
  }

  // Sem halo por trás. A primeira versão tinha um disco com mistura
  // aditiva, e num céu de tempestade ele virava uma bola branca sólida —
  // borda dura, mais forte que o próprio raio. Quem acende o céu já é o
  // clarão da cena inteira (Game.applyLightning); aqui basta o risco.

  g.visible = false;
  return g;
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
// Portal de partida: a marcação de onde a corrida começa.
//
// Nasce no início de toda corrida, em qualquer modo (ver World.placeStart e
// Game.start/startLevel). A criança não vê um número na tela subir do zero —
// ela vê que passou por aqui, e é daqui que a distância conta.
export function createStartLine() {
  const gate = new THREE.Group();

  // A faixa quadriculada atravessando as três pistas, deitada no chão.
  const faixa = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 1.4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.y = 0.06;
  gate.add(faixa);

  for (let i = -3; i <= 3; i++) {
    for (const linha of [-1, 1]) {
      if ((i + linha) % 2 !== 0) continue;
      const quadro = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.62),
        new THREE.MeshBasicMaterial({ color: 0xff5d8f, transparent: true, opacity: 0.9 })
      );
      quadro.rotation.x = -Math.PI / 2;
      quadro.position.set(i * 1.22, 0.07, linha * 0.33);
      gate.add(quadro);
    }
  }

  // Os dois postes e o travessão por cima, alto o bastante para o pulo (e o
  // voo) passarem por baixo sem parecer que bateram.
  const ALTURA = 4.6;
  for (const lado of [-1, 1]) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, ALTURA, 8), mat(0xfff0fb));
    poste.position.set(lado * 4.4, ALTURA / 2, 0);
    poste.castShadow = true;
    gate.add(poste);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.3, 8), mat(0xff8fb1));
    base.position.set(lado * 4.4, 0.15, 0);
    gate.add(base);

    // Bandeirinha dourada no alto de cada poste, virada para dentro — é o
    // que faz o portal parecer festa, e não obstáculo.
    const bandeira = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.06), mat(0xffd166));
    bandeira.position.set(lado * 3.95, ALTURA + 0.34, 0);
    bandeira.rotation.z = lado * -0.18;
    gate.add(bandeira);
  }

  const travessao = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.92, 0.28), mat(0xff5d8f));
  travessao.position.y = ALTURA - 0.2;
  travessao.castShadow = true;
  gate.add(travessao);

  // Bandeirinhas penduradas no travessão, no lugar da palavra "PARTIDA"
  // que ficava escrita aqui. Palavra escrita não serve: metade de quem joga
  // ainda não lê, e a que lia estava num idioma só. O portal com bandeirola
  // diz "começa aqui" sem depender de ninguém saber ler — e a faixa
  // quadriculada no chão, logo abaixo, já dizia isso antes da palavra.
  for (let i = -4; i <= 4; i++) {
    const bandeirola = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.62, 3),
      mat(i % 2 === 0 ? 0xffd166 : 0xfff0fb)
    );
    bandeirola.rotation.x = Math.PI;      // ponta para baixo
    bandeirola.scale.z = 0.18;            // achatada, como pano
    bandeirola.position.set(i * 1.02, ALTURA - 0.92, 0);
    gate.add(bandeirola);
  }

  gate.userData.kind = 'start';
  return gate;
}

export function createRecordBanner() {
  const banner = new THREE.Group();

  // Dourada, e não rosa como era. Tirada a palavra "RECORDE" que ficava
  // escrita aqui, uma faixa rosa quadriculada no chão viraria a mesma coisa
  // que a faixa da partida — e as duas dizem coisas opostas. O ouro é o que
  // separa: é a cor do 🏆 e do 🥇 que o jogo já usa para recorde.
  const faixa = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 1.1),
    new THREE.MeshBasicMaterial({ color: 0xffb703, transparent: true, opacity: 0.72 })
  );
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.y = 0.06;
  banner.add(faixa);

  for (let i = -3; i <= 3; i++) {
    const quadro = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.9 })
    );
    quadro.rotation.x = -Math.PI / 2;
    quadro.position.set(i * 1.15, 0.07, i % 2 === 0 ? 0.24 : -0.24);
    banner.add(quadro);
  }

  // Duas estrelinhas douradas em pé, uma de cada lado, fora do caminho do
  // unicórnio: dizem "isto é uma marca sua", que é o que a palavra dizia.
  for (const lado of [-1, 1]) {
    const estrela = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), mat(0xffd166));
    estrela.scale.set(1, 1.35, 0.4);
    estrela.position.set(lado * 3.9, 0.62, 0);
    estrela.castShadow = true;
    banner.add(estrela);

    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.62, 5), mat(0xfff0fb));
    haste.position.set(lado * 3.9, 0.31, 0);
    banner.add(haste);
  }

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
