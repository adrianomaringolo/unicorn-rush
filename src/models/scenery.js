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

// Como `juntar`, mas cada peça leva a sua cor (`[geo, matriz, cor]`): várias
// cores numa malha só, pintada com `tintaDaMalha`.
function juntarColorido(pecas) {
  const junto = juntar(pecas.map(([geo, matriz]) => [geo, matriz]));
  const cores = [];
  const c = new THREE.Color();
  for (const [geo, , cor] of pecas) {
    c.set(cor);
    const n = geo.index ? geo.index.count : geo.attributes.position.count;
    for (let i = 0; i < n; i++) cores.push(c.r, c.g, c.b);
  }
  junto.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
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
// As folhas de outono são mais vivas que o AUTUMN: o chão da pista já é
// laranja-escuro, e folha na mesma cor some nele. Vermelho, laranja e
// dourado bem saturados é o que aparece em cima do chão.
const FOLHAS_OUTONO = [0xe0452f, 0xff8a2a, 0xffc23d, 0xc9302c, 0xf2a33a];

// A folha de bordo, de pé no plano XY, com ~1 de altura e o cabinho para
// baixo: cinco lobos pontudos, o do meio mais alto. Uma forma só, para o
// monte de folhas, as folhas no pé da árvore e as que caem do céu.
const BORDO = (() => {
  const pontos = [
    [-80, 0.16], [-12, 0.6], [12, 0.4], [38, 0.9], [62, 0.44], [90, 1.0],
    [118, 0.44], [142, 0.9], [168, 0.4], [192, 0.6], [260, 0.16],
  ].map(([graus, r]) => {
    const a = (graus * Math.PI) / 180;
    return new THREE.Vector2(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
  });
  const forma = new THREE.Shape();
  forma.moveTo(0.018, -0.1);
  for (const p of pontos) forma.lineTo(p.x, p.y);
  forma.lineTo(-0.018, -0.1);
  forma.lineTo(-0.018, -0.24);              // o cabinho
  forma.lineTo(0.018, -0.24);
  forma.lineTo(0.018, -0.1);
  const geo = new THREE.ShapeGeometry(forma);
  geo.translate(0, -0.13, 0);               // o meio da folha na origem
  return geo;
})();
// A mesma folha deitada no chão (de cara para cima).
const BORDO_DEITADO = BORDO.clone().rotateX(-Math.PI / 2);

// A matriz de uma folha deitada em `ponto`, com a cara virada para `normal`
// e girada `giro` em volta dela.
function folhaNoChao(ponto, normal, giro, tamanho) {
  const q = new THREE.Quaternion().setFromUnitVectors(CIMA, normal.clone().normalize())
    .multiply(new THREE.Quaternion().setFromAxisAngle(CIMA, giro));
  return new THREE.Matrix4().compose(ponto, q, new THREE.Vector3(tamanho, tamanho, tamanho));
}
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

// Pinheiro da noite: quatro andares de galhos, cada um um cone com a saia
// recortada em pontas que caem (os galhos), num azul-esverdeado de luar, e
// umas luzinhas de vagalume pousadas nos galhos. Eram três cones lisos
// empilhados, iguais a um copinho de sorvete de cabeça para baixo.
const ANDAR_DE_PINHEIRO = (() => {
  const geo = new THREE.ConeGeometry(1, 1, 12, 2, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > -0.49) continue;                 // só a borda de baixo
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const ponta = Math.max(0, Math.cos(a * 6));        // 6 galhos
    pos.setXYZ(i, pos.getX(i) * (1 + ponta * 0.12), pos.getY(i) - ponta * 0.16, pos.getZ(i) * (1 + ponta * 0.12));
  }
  geo.computeVertexNormals();
  return geo;
})();

function pineTree() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 1.0, 6), mat(0x6b5a8f));
  tronco.position.y = 0.5;
  tronco.castShadow = true;
  g.add(tronco);

  const cor = pick([0x3f6f8f, 0x4a7f7a, 0x5a6fa8]);
  const andares = [];
  const luzes = [];
  for (let i = 0; i < 4; i++) {
    const raio = 0.95 - i * 0.2, alto = 1.0 - i * 0.1, y = 1.05 + i * 0.55;
    andares.push([ANDAR_DE_PINHEIRO, new THREE.Matrix4().compose(
      new THREE.Vector3(0, y, 0), new THREE.Quaternion().setFromAxisAngle(CIMA, i * 0.5), new THREE.Vector3(raio, alto, raio))]);
    // Uma luzinha na ponta de um ou dois galhos de cada andar.
    for (let k = 0; k < (i < 2 ? 3 : 2); k++) {
      const a = i * 0.5 + (Math.floor(Math.random() * 6) / 6) * Math.PI * 2;
      luzes.push([new THREE.IcosahedronGeometry(0.09, 1), naPosicao(Math.cos(a) * raio * 0.95, y - alto * 0.5 - 0.06, -Math.sin(a) * raio * 0.95)]);
    }
  }
  const copa = new THREE.Mesh(juntar(andares), mat(cor, { side: THREE.DoubleSide }));
  copa.castShadow = true;
  g.add(copa);
  const acesa = pick([0xfff3a8, 0xd6ffa8]);
  g.add(new THREE.Mesh(juntar(luzes), new THREE.MeshBasicMaterial({ color: acesa })));
  return g;
}

// Cogumelo de livro de histórias: o caule torneado, mais gordo embaixo, e
// o chapéu em cúpula com a aba arredondada, as lamelas claras por baixo e
// pintinhas brancas por cima. Os de antes eram um cilindro com meia
// esfera em cima, sem aba nem nada por baixo — de perto, um abajur.
//
// Devolve um grupo com o pé no chão; `brilho` acende o chapéu (e as
// pintas) para as pistas de noite.
function cogumeloForma({ alto = 0.6, raio = 0.42, cor, pintas = 5, brilho = 0, caule = 0xfff6e8 }) {
  const g = new THREE.Group();
  const materialDe = (c, k = brilho) => (k ? mat(c, { emissive: c, emissiveIntensity: k }) : mat(c));
  // Caule: um perfil girado — largo no pé, afina e abre de novo um tico
  // embaixo do chapéu.
  const rc = raio * 0.32;
  const perfilCaule = [
    [0, 0], [rc * 1.35, 0], [rc * 1.25, alto * 0.18], [rc * 0.95, alto * 0.55], [rc, alto * 0.92], [0, alto * 0.92],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pe = new THREE.Mesh(new THREE.LatheGeometry(perfilCaule, 9), mat(caule, brilho ? { emissive: caule, emissiveIntensity: brilho * 0.35 } : {}));
  pe.castShadow = true;
  g.add(pe);

  // Chapéu: da aba (que se curva um tico para baixo) até o topo.
  const H = raio * 0.72;
  const perfil = [new THREE.Vector2(raio * 0.9, -raio * 0.06)];
  for (let k = 0; k <= 6; k++) {
    const t = (k / 6) * Math.PI / 2;
    perfil.push(new THREE.Vector2(Math.max(0.001, raio * Math.cos(t)), raio * 0.05 + H * Math.sin(t)));
  }
  const chapeu = new THREE.Mesh(new THREE.LatheGeometry(perfil, 12), materialDe(cor));
  chapeu.position.y = alto * 0.88;
  chapeu.castShadow = true;
  g.add(chapeu);

  // Lamelas: o disco claro por baixo da aba.
  const lamelas = new THREE.Mesh(new THREE.CircleGeometry(raio * 0.9, 12), mat(0xffe9d6, brilho ? { emissive: 0xffe9d6, emissiveIntensity: brilho * 0.3 } : {}));
  lamelas.rotation.x = Math.PI / 2;
  lamelas.position.y = alto * 0.88 - raio * 0.05;
  g.add(lamelas);

  // Pintinhas na cúpula, deitadas na superfície.
  if (pintas) {
    const bolinhas = [];
    for (let i = 0; i < pintas; i++) {
      const phi = (i / pintas) * Math.PI * 2 + Math.random() * 0.4;
      const t = 0.45 + (i % 2) * 0.35;
      const normal = new THREE.Vector3(Math.cos(t) * Math.cos(phi), Math.sin(t) * 1.2, Math.cos(t) * Math.sin(phi)).normalize();
      const ponto = new THREE.Vector3(raio * Math.cos(t) * Math.cos(phi), alto * 0.88 + raio * 0.05 + H * Math.sin(t), raio * Math.cos(t) * Math.sin(phi));
      const r = raio * (0.13 + (i % 3) * 0.03);
      bolinhas.push([new THREE.SphereGeometry(1, 6, 4), new THREE.Matrix4().compose(
        ponto, new THREE.Quaternion().setFromUnitVectors(CIMA, normal), new THREE.Vector3(r, r * 0.3, r))]);
    }
    g.add(new THREE.Mesh(juntar(bolinhas), materialDe(0xfffbf2, brilho ? brilho * 0.6 : 0)));
  }
  return g;
}

// Cogumelo do campo e do outono: um grande e, às vezes, um filhote do
// lado, levemente torto.
function mushroom() {
  const g = new THREE.Group();
  const cor = pick([0xff5d73, 0xff8a5c, 0xb18cff, 0xff6b8a]);
  g.add(cogumeloForma({ alto: 0.62, raio: 0.42, cor }));
  if (Math.random() < 0.6) {
    const filhote = cogumeloForma({ alto: 0.34, raio: 0.22, cor, pintas: 3 });
    filhote.position.set(0.38, 0, 0.15);
    filhote.rotation.z = -0.2;
    g.add(filhote);
  }
  return g;
}

// Cogumelos da noite: um trio de cogumelos finos e altos com o chapéu
// aceso, de tamanhos diferentes.
function glowMushroom() {
  const g = new THREE.Group();
  const cor = pick([0x8ce9ff, 0xc7a6ff, 0x9affd6]);
  const trio = [[0, 0, 0.78, 0.4, 0], [0.42, 0.12, 0.5, 0.27, -0.18], [-0.3, -0.2, 0.36, 0.2, 0.22]];
  for (const [x, z, alto, raio, incl] of trio) {
    const c = cogumeloForma({ alto, raio, cor, pintas: 4, brilho: 0.6, caule: 0xe8e4ff });
    c.position.set(x, 0, z);
    c.rotation.z = incl;
    g.add(c);
  }
  return g;
}

// Cristal de enfeite (Campo e Noite): um prisma alto de seis lados com
// ponta, dois menores encostados e uma pedrinha na base, translúcidos e
// acesos de leve. Era um cone de cinco lados sozinho.
function crystal() {
  const g = new THREE.Group();
  const cor = pick([0x9be7ff, 0xf0a6ff, 0xa6ffcb]);
  const pecas = [[0, 1.25, 0.2, 0.08, 0], [0.26, 0.7, 0.13, -0.45, 0.2], [-0.22, 0.55, 0.11, 0.5, -0.25]].map(
    ([x, alto, raio, inclZ, inclX]) => [PRISMA_CRISTAL, new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.02, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(inclX, Math.random(), inclZ)),
      new THREE.Vector3(raio, alto / 1.6, raio))]);
  const cristais = new THREE.Mesh(juntar(pecas), mat(cor, { transparent: true, opacity: 0.85, emissive: cor, emissiveIntensity: 0.35 }));
  cristais.castShadow = true;
  g.add(cristais);
  const base = new THREE.Mesh(pedraIrregular(0.3, 0.2, 0), mat(0x8a86a0));
  base.scale.set(1.3, 0.35, 1);
  base.position.y = 0.04;
  g.add(base);
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

// Uma pétala: gota achatada, da base (na origem) para a ponta (em +X),
// deitada no plano do chão. Serve para as pétalas e para as folhas.
const PETALA = (() => {
  const f = new THREE.Shape();
  f.moveTo(0, 0);
  f.bezierCurveTo(0.25, 0.42, 0.72, 0.52, 1, 0);
  f.bezierCurveTo(0.72, -0.52, 0.25, -0.42, 0, 0);
  const geo = new THREE.ExtrudeGeometry(f, { depth: 0.04, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, -0.02);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

// Pétala girada `a` em volta do miolo e erguida `ergue` (0 deitada, ~1,4
// em pé), com comprimento e largura próprios.
const petalaEm = (a, ergue, comp, larg, y = 0) => new THREE.Matrix4().compose(
  new THREE.Vector3(0, y, 0),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, ergue, 'YZX')),
  new THREE.Vector3(comp, 1, larg));

// A tulipa: um copo em forma de ovo, aberto em cima, com a borda subindo
// em três pontas — as pétalas.
const TULIPA = (() => {
  const perfil = [[0.001, 0], [0.1, 0.03], [0.17, 0.12], [0.17, 0.24], [0.12, 0.34]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const LADOS = 12;
  const geo = new THREE.LatheGeometry(perfil, LADOS);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (i % perfil.length !== perfil.length - 1) continue;   // só a borda
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    pos.setY(i, pos.getY(i) + Math.max(0, Math.cos(a * 3)) * 0.09 - 0.02);
  }
  geo.computeVertexNormals();
  return geo;
})();

// As três flores do campo. Cada uma devolve as pétalas e o miolo (ou nada,
// na tulipa, que é um copo fechado).
const FLORES = {
  margarida: (cor) => ({
    petalas: Array.from({ length: 12 }, (_, i) => [PETALA, petalaEm((i / 12) * Math.PI * 2, 0.18, 0.34, 0.32)]),
    miolo: 0.11, corMiolo: 0xffc93c, cor: pick([0xffffff, 0xfff0f6, cor]),
  }),
  florzinha: (cor) => ({
    petalas: Array.from({ length: 5 }, (_, i) => [PETALA, petalaEm((i / 5) * Math.PI * 2, 0.25, 0.3, 0.5)]),
    miolo: 0.085, corMiolo: 0xffe066, cor,
  }),
  tulipa: (cor) => ({ petalas: [[TULIPA, new THREE.Matrix4()]], miolo: 0, cor }),
};

// Flor do campo: caule em curva, duas folhas pontudas e a flor virada
// para quem corre. Sai margarida, florzinha de cinco pétalas ou tulipa.
// A de antes era um palito com seis bolinhas achatadas em roda.
function flower() {
  const g = new THREE.Group();
  const cor = pick([0xff8fb1, 0xffd166, 0xff6b8a, 0xc9a6ff, 0xff9f68]);
  const tipo = pick(['margarida', 'florzinha', 'florzinha', 'tulipa']);
  const flor = FLORES[tipo](cor);
  const ALTO = tipo === 'tulipa' ? 0.85 : 1.0;

  const curva = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, ALTO * 0.5, 0), new THREE.Vector3(0, ALTO, 0.04));
  const verde = [[new THREE.TubeGeometry(curva, 8, 0.035, 5), new THREE.Matrix4()]];
  for (const [y, a] of [[0.28, 0.4], [0.45, 2.9]]) {
    verde.push([PETALA, new THREE.Matrix4().compose(
      curva.getPoint(y), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0.55, 'YZX')), new THREE.Vector3(0.42, 1, 0.42))]);
  }
  const caule = new THREE.Mesh(juntar(verde), mat(0x5fb56f, { side: THREE.DoubleSide }));
  caule.castShadow = true;
  g.add(caule);

  const cabeca = new THREE.Group();
  cabeca.position.copy(curva.getPoint(1));
  cabeca.rotation.x = tipo === 'tulipa' ? 0.15 : 0.6;    // virada para quem corre
  const petalas = new THREE.Mesh(juntar(flor.petalas), mat(flor.cor, { side: THREE.DoubleSide }));
  petalas.castShadow = true;
  cabeca.add(petalas);
  if (flor.miolo) {
    const miolo = new THREE.Mesh(new THREE.SphereGeometry(flor.miolo, 8, 6), mat(flor.corMiolo));
    miolo.scale.y = 0.6;
    miolo.position.y = 0.03;
    cabeca.add(miolo);
  }
  g.add(cabeca);
  g.scale.setScalar(0.95 + Math.random() * 0.35);
  return g;
}

// Tufo rente ao chão: uma moita de folhas de grama com florzinhas de cinco
// pétalas espetadas em caules curtos. Era um punhado de bolinhas
// achatadas largadas no chão.
function flowerPatch() {
  const g = new THREE.Group();
  const cor = pick([0xff8fb1, 0xffd166, 0xfff0f6, 0xc9a6ff]);
  const grama = [];
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.45;
    const alto = 0.22 + Math.random() * 0.18;
    grama.push([new THREE.ConeGeometry(0.035, alto, 3), new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * r, alto / 2, Math.sin(a) * r),
      new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.6, a, (Math.random() - 0.5) * 0.6)),
      new THREE.Vector3(1, 1, 1))]);
  }
  const petalas = [], miolos = [];
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, r = 0.15 + Math.random() * 0.3;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.28 + Math.random() * 0.14;
    grama.push([new THREE.CylinderGeometry(0.018, 0.022, y, 4), naPosicao(x, y / 2, z)]);
    const base = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, Math.random() * 6, 0)), new THREE.Vector3(0.55, 0.55, 0.55));
    for (let k = 0; k < 5; k++) petalas.push([PETALA, base.clone().multiply(petalaEm((k / 5) * Math.PI * 2, 0.3, 0.3, 0.85))]);
    miolos.push([new THREE.SphereGeometry(0.085, 6, 4), base.clone().multiply(new THREE.Matrix4().makeScale(1, 0.6, 1))]);
  }
  g.add(new THREE.Mesh(juntar(grama), mat(0x6bbf7b)));
  const flores = new THREE.Mesh(juntar(petalas), mat(cor, { side: THREE.DoubleSide }));
  flores.castShadow = true;
  g.add(flores, new THREE.Mesh(juntar(miolos), mat(0xffe066)));
  return g;
}

// Nuvem fofa: um miolo achatado com calombos redondos por cima e pelos
// lados (espalhados em espiral, para não sair em fileira), e a barriga
// num azulzinho, que é a sombra que nuvem tem embaixo. Devolve as peças
// coloridas, para juntarColorido; o pé fica em y = 0.
function nuvemFofa(largura, alto, calombos = 14, { corCima = 0xffffff, corBaixo = 0xe2ecff } = {}) {
  const pecas = [[new THREE.IcosahedronGeometry(1, 2), new THREE.Matrix4().compose(
    new THREE.Vector3(0, alto * 0.42, 0), new THREE.Quaternion(), new THREE.Vector3(largura * 0.5, alto * 0.42, largura * 0.32)), corBaixo]];
  const bola = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < calombos; i++) {
    const y = 1 - (i + 0.5) / calombos;               // de cima para os lados
    const r = Math.sqrt(1 - y * y), a = i * 2.39996;
    const tam = alto * (0.3 + Math.random() * 0.12) * (1 - y * 0.25);
    pecas.push([bola, new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * r * largura * 0.42, alto * 0.42 + y * alto * 0.38, Math.sin(a) * r * largura * 0.26),
      new THREE.Quaternion(), new THREE.Vector3(tam, tam, tam)), y > 0.2 ? corCima : corBaixo]);
  }
  return pecas;
}

// Morrinho de nuvem: o "arbusto" da pista do céu. Eram três a cinco blocos
// facetados em fila, que liam como pedras brancas.
function cloudHill() {
  const g = new THREE.Group();
  const nuvem = new THREE.Mesh(juntarColorido(nuvemFofa(2 + Math.random() * 0.8, 1 + Math.random() * 0.3)), tintaDaMalha());
  nuvem.castShadow = true;
  g.add(nuvem);
  return g;
}

// Balão de ar quente: o envelope em forma de gota, com gomos listrados de
// duas cores, a saia embaixo com a chama acesa, quatro cordas até o cesto
// de vime e dois saquinhos de areia pendurados. Era uma bola com um
// copinho embaixo.
const ENVELOPE = (() => {
  const perfil = [
    [0.22, -0.95], [0.36, -0.7], [0.58, -0.35], [0.74, 0], [0.78, 0.3],
    [0.72, 0.58], [0.55, 0.82], [0.3, 0.96], [0.001, 1.0],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(perfil, 16);
})();

function balloon() {
  const g = new THREE.Group();
  const [corA, corB] = pick([
    [0xff7b9d, 0xffe066], [0x74c0fc, 0xffffff], [0xb197fc, 0xffd166], [0xff9f68, 0x8ce99a],
  ]);
  const ALTO = 2.6;
  const envelope = new THREE.Mesh(
    pintarDuasCores(ENVELOPE, (u) => Math.floor(u * 16) % 2 === 0, corA, corB), tintaDaMalha());
  envelope.position.y = ALTO;
  envelope.castShadow = true;
  g.add(envelope);

  const saia = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.16, 10, 1, true), mat(corA, { side: THREE.DoubleSide }));
  saia.position.y = ALTO - 1.02;
  g.add(saia);
  const chama = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), mat(0xffb347, { emissive: 0xff9f1c, emissiveIntensity: 1 }));
  chama.position.y = ALTO - 1.0;
  g.add(chama);

  // As cordas, da saia até a borda do cesto.
  const CESTO = 0.78;
  const cordas = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const de = new THREE.Vector3(Math.cos(a) * 0.17, ALTO - 1.1, Math.sin(a) * 0.17);
    const ate = new THREE.Vector3(Math.cos(a) * 0.24, CESTO + 0.18, Math.sin(a) * 0.24);
    const dir = de.clone().sub(ate);
    cordas.push([new THREE.CylinderGeometry(0.012, 0.012, dir.length(), 3), apontar(de.clone().add(ate).multiplyScalar(0.5), dir)]);
  }
  g.add(new THREE.Mesh(juntar(cordas), mat(0x8a6a4a)));

  // O cesto de vime: as tramas em faixas de dois tons, a borda de couro e
  // os saquinhos de areia.
  const cesto = new THREE.Mesh(pintarDuasCores(new THREE.CylinderGeometry(0.27, 0.22, 0.34, 8, 4),
    (u, v) => (Math.floor(u * 8) + Math.floor(v * 4)) % 2 === 0, 0xd8a86b, 0xc08f55), tintaDaMalha());
  cesto.position.y = CESTO;
  cesto.castShadow = true;
  g.add(cesto);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.04, 5, 12), mat(0x8a5a3a));
  borda.rotation.x = Math.PI / 2;
  borda.position.y = CESTO + 0.17;
  g.add(borda);
  const sacos = [];
  for (const lado of [-1, 1]) {
    sacos.push([new THREE.SphereGeometry(0.075, 6, 5), new THREE.Matrix4().compose(
      new THREE.Vector3(lado * 0.3, CESTO - 0.02, 0.06), new THREE.Quaternion(), new THREE.Vector3(1, 1.25, 1))]);
  }
  g.add(new THREE.Mesh(juntar(sacos), mat(0xe8d6b0)));
  return g;
}

// Arquinho de arco-íris para a beira da pista do céu: as seis cores, em
// faixas redondas e grudadas, com os pés afundados em duas nuvenzinhas. Eram
// quatro argolas finas com vão entre elas, plantadas direto no chão.
function rainbowArch() {
  const g = new THREE.Group();
  const cores = [0xff6b6b, 0xff9f43, 0xffd166, 0x6bd88a, 0x5fb4f5, 0xb38cff];
  const faixas = cores.map((cor, i) => [
    new THREE.TorusGeometry(1.55 - i * 0.17, 0.095, 6, 24, Math.PI),
    naPosicao(0, 0.15, 0), cor]);
  const arco = new THREE.Mesh(juntarColorido(faixas), tintaDaMalha());
  arco.castShadow = true;
  g.add(arco);
  for (const lado of [-1, 1]) {
    const pe = new THREE.Mesh(juntarColorido(nuvemFofa(1.1, 0.55, 9)), tintaDaMalha());
    pe.position.x = lado * 1.12;
    g.add(pe);
  }
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

// Uma valva de vieira, deitada no chão com a dobradiça em z = 0 e o leque
// abrindo para +Z. Sai em duas malhas — o lado de fora, com as costelas, e
// o de dentro, liso — para os dois terem cores diferentes: é o miolo claro
// que faz a concha ler como concha, e não como leque.
//
// O leque nasce de uma dobradiça **reta**. A anterior afinava até um
// ponto, e as duas valvas, abertas, formavam um "X" de ampulheta no meio
// da concha.
function valva(R, H) {
  const COSTELAS = 13;
  const NA = COSTELAS * 4, NR = 12;
  const ABRE = 0.42;                       // o leque vai de ABRE a π − ABRE
  const DOBRA = R * 0.2;                   // meia largura da dobradiça
  const fora = [], dentro = [];
  for (let i = 0; i <= NA; i++) {
    const u = i / NA;
    const fi = ABRE + u * (Math.PI - 2 * ABRE);
    // Costela: onda suave, que cresce para a borda; a borda ondula junto.
    const onda = 0.5 - 0.5 * Math.cos(u * COSTELAS * Math.PI * 2);
    for (let j = 0; j <= NR; j++) {
      const t = j / NR;
      const raio = R * (1 + 0.04 * onda * t);
      // Da dobradiça (um ponto da reta, conforme o ângulo) até a borda.
      const x = THREE.MathUtils.lerp(-Math.cos(fi) * -DOBRA / Math.cos(ABRE), Math.cos(fi) * raio, t);
      const z = Math.sin(fi) * raio * t;
      // O bojo: alto no meio, zero na borda e na dobradiça; um pouco
      // mais cheio perto da dobradiça, como a vieira de verdade.
      const bojo = Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.25 * Math.abs(u - 0.5) * 2);
      const yFora = H * bojo * (1 + 0.14 * onda * t);
      const yDentro = H * bojo * 0.72;
      fora.push(x, yFora, z);
      dentro.push(x, yDentro, z);
    }
  }
  const faces = [];
  for (let i = 0; i < NA; i++) {
    for (let j = 0; j < NR; j++) {
      const a = i * (NR + 1) + j, b = (i + 1) * (NR + 1) + j;
      faces.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const montar = (pontos) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pontos, 3));
    geo.setIndex(faces);
    return geo;
  };
  const foraGeo = montar(fora);

  const foraNaoIndexado = foraGeo.toNonIndexed();
  foraNaoIndexado.computeVertexNormals();
  const dentroGeo = montar(dentro);
  dentroGeo.computeVertexNormals();
  return { fora: foraNaoIndexado, dentro: dentroGeo, dobra: DOBRA };
}

// Concha: vieira entreaberta, de miolo claro, com a pérola na valva de
// baixo. A dobradiça fica atrás, e a boca aberta encara quem vem.
function clam() {
  const g = new THREE.Group();
  const cor = pick([0xff9ec4, 0xffb98a, 0xc9a6ff, 0xffd27a]);
  const R = 0.75, H = 0.36;
  const casca = mat(cor, { side: THREE.DoubleSide });
  const miolo = mat(new THREE.Color(cor).lerp(new THREE.Color(0xffffff), 0.7).getHex(), {
    side: THREE.DoubleSide, emissive: 0x2a2228,
  });
  const valvaMalha = (geo) => {
    const v = new THREE.Group();
    const f = new THREE.Mesh(geo.fora, casca);
    f.castShadow = true;
    v.add(f, new THREE.Mesh(geo.dentro, miolo));
    return v;
  };

  const dobradica = new THREE.Group();
  dobradica.position.set(0, H * 0.95, -R * 0.5);
  g.add(dobradica);

  // A de baixo é a tigela: o bojo para baixo, a boca para cima.
  const fundo = valvaMalha(valva(R, H));
  fundo.scale.y = -1;
  fundo.rotation.x = 0.1;
  dobradica.add(fundo);

  const tampa = valvaMalha(valva(R, H * 0.85));
  tampa.rotation.x = -0.75;                 // entreaberta
  dobradica.add(tampa);

  // O rolete da dobradiça: fecha a concha por trás e mostra onde as duas
  // valvas se prendem.
  const rolete = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.2, H * 0.2, R * 0.46, 10), casca);
  rolete.rotation.z = Math.PI / 2;
  rolete.position.z = -H * 0.05;
  dobradica.add(rolete);

  const perola = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), mat(0xfffdf5, { emissive: 0x5a5244 }));
  perola.position.set(0, H * 0.95 - H * 0.72 * 0.95 + 0.17, -R * 0.5 + R * 0.45);
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
// Pedra irregular: um icosaedro com cada vértice empurrado um tanto para
// dentro ou para fora. O deslocamento é o mesmo para todas as faces que
// dividem o vértice, senão a pedra abriria em rachas.
function pedraIrregular(raio, tremor, detalhe = 1) {
  const geo = new THREE.IcosahedronGeometry(raio, detalhe);
  const pos = geo.attributes.position;
  const deslocamento = new Map();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const chave = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!deslocamento.has(chave)) deslocamento.set(chave, 1 + (Math.random() - 0.5) * 2 * tremor);
    v.multiplyScalar(deslocamento.get(chave));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Veios de lava: rachaduras acesas que correm pelas arestas de uma pedra.
// Cada veio é um caminho aleatório de vértice em vértice, sem voltar, e
// cada trecho é um bastão fino um tico para fora da superfície. Como
// seguem as arestas, as rachas acompanham a forma da pedra — não são
// manchas grudadas por cima.
function veiosDeLava(geo, { caminhos = 2, passos = 5, espessura = 0.035, sobe = 0 } = {}) {
  const pos = geo.attributes.position;
  const pontos = [], indice = new Map(), vizinhos = [];
  const idDe = (i) => {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const chave = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!indice.has(chave)) {
      indice.set(chave, pontos.length);
      pontos.push(new THREE.Vector3(x, y, z));
      vizinhos.push(new Set());
    }
    return indice.get(chave);
  };
  for (let t = 0; t < pos.count; t += 3) {
    const [a, b, c] = [idDe(t), idDe(t + 1), idDe(t + 2)];
    vizinhos[a].add(b).add(c);
    vizinhos[b].add(a).add(c);
    vizinhos[c].add(a).add(b);
  }
  // Os veios começam na metade de cima (`sobe` puxa mais para o alto),
  // que é a que se vê da pista.
  const candidatos = pontos.map((p, i) => i).filter((i) => pontos[i].y > sobe);
  const trechos = [];
  for (let k = 0; k < caminhos; k++) {
    let atual = pick(candidatos.length ? candidatos : pontos.map((p, i) => i));
    const visitados = new Set([atual]);
    for (let n = 0; n < passos; n++) {
      const opcoes = [...vizinhos[atual]].filter((i) => !visitados.has(i));
      if (!opcoes.length) break;
      const prox = pick(opcoes);
      const a = pontos[atual].clone().multiplyScalar(1.015);
      const b = pontos[prox].clone().multiplyScalar(1.015);
      const dir = b.clone().sub(a);
      // Afina do começo para o fim do veio.
      const grosso = espessura * (1 - (n / passos) * 0.5);
      trechos.push([new THREE.CylinderGeometry(grosso, grosso, dir.length() + grosso, 4), apontar(a.clone().add(b).multiplyScalar(0.5), dir)]);
      visitados.add(prox);
      atual = prox;
    }
  }
  return juntar(trechos);
}

const LAVA_ACESA = (cor) => mat(cor, { emissive: cor, emissiveIntensity: 1.15 });

// Pedra de basalto rachada: um bloco quase preto, irregular e meio
// achatado, com a lava acesa correndo pelas rachaduras, e uma pedrinha
// irmã encostada. A de antes eram três bolotas lisas com uma manchinha
// laranja por baixo.
function lavaRock() {
  const g = new THREE.Group();
  const cor = pick(LAVA);
  const geo = pedraIrregular(0.55, 0.16);
  const pedra = new THREE.Mesh(geo, mat(0x342d38));
  pedra.scale.set(1.25, 0.78, 1);
  pedra.position.y = 0.3;
  pedra.rotation.y = Math.random() * Math.PI;
  pedra.castShadow = true;
  pedra.add(new THREE.Mesh(veiosDeLava(geo, { caminhos: 3, passos: 5, sobe: -0.1 }), LAVA_ACESA(cor)));
  g.add(pedra);

  const geo2 = pedraIrregular(0.28, 0.2, 0);
  const irma = new THREE.Mesh(geo2, mat(0x2f2833));
  irma.position.set(0.62, 0.14, 0.2);
  irma.scale.y = 0.7;
  irma.castShadow = true;
  irma.add(new THREE.Mesh(veiosDeLava(geo2, { caminhos: 1, passos: 3, espessura: 0.025 }), LAVA_ACESA(cor)));
  g.add(irma);
  return g;
}

// Chaminé soltando brasa: um cone escuro com a boca acesa.
// Chaminé de lava: um cone de rocha de beira irregular, com a cratera
// acesa lá em cima, dois filetes de lava escorrendo pela encosta e
// fagulhas subindo. A de antes era um cone liso com uma bola na ponta.
function emberVent() {
  const g = new THREE.Group();
  const cor = pick(LAVA);
  const ALTO = 1.05, BASE = 0.78, BOCA = 0.3;
  const geo = new THREE.CylinderGeometry(BOCA, BASE, ALTO, 10, 3, true);
  // Encosta irregular, e a beira da cratera recortada.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    const k = 1 + Math.sin(ang * 3 + y * 4) * 0.08 + (y > ALTO / 2 - 0.01 ? Math.sin(ang * 5) * 0.06 : 0);
    pos.setXYZ(i, pos.getX(i) * k, y + (y > ALTO / 2 - 0.01 ? Math.sin(ang * 4) * 0.05 : 0), pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const cone = new THREE.Mesh(geo, mat(0x2f2833, { side: THREE.DoubleSide }));
  cone.position.y = ALTO / 2;
  cone.castShadow = true;
  g.add(cone);

  // A lava dentro da cratera, com o miolo mais claro.
  const lava = new THREE.Mesh(new THREE.CircleGeometry(BOCA * 0.95, 10), LAVA_ACESA(cor));
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = ALTO - 0.06;
  g.add(lava);
  const miolo = new THREE.Mesh(new THREE.CircleGeometry(BOCA * 0.45, 8), LAVA_ACESA(0xffe08a));
  miolo.rotation.x = -Math.PI / 2;
  miolo.position.y = ALTO - 0.05;
  g.add(miolo);

  // Filetes escorrendo: saem da beira, descem colados à encosta e
  // engrossam embaixo, onde a lava empoça.
  const raioEm = (h) => BOCA + (BASE - BOCA) * (1 - h / ALTO);
  const filetes = [];
  for (const a0 of [0.4 + Math.random(), 2.6 + Math.random()]) {
    const pontos = [];
    for (let k = 0; k <= 5; k++) {
      const h = ALTO * (1 - k / 5) - 0.02;
      const a = a0 + Math.sin(k * 1.3) * 0.12;
      const r = raioEm(h) * 1.06;
      pontos.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
    }
    filetes.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), 12, 0.045, 5), new THREE.Matrix4()]);
    filetes.push([new THREE.SphereGeometry(0.13, 7, 5), new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a0) * (BASE + 0.1), 0.02, Math.sin(a0) * (BASE + 0.1)),
      new THREE.Quaternion(), new THREE.Vector3(1.3, 0.25, 1))]);
  }
  g.add(new THREE.Mesh(juntar(filetes), LAVA_ACESA(cor)));

  // Fagulhas subindo, paradas no ar (o cenário passa, elas não precisam voar).
  const fagulhas = [];
  for (let i = 0; i < 4; i++) {
    const r = 0.06 - i * 0.011;
    fagulhas.push([new THREE.IcosahedronGeometry(r, 0), naPosicao((Math.random() - 0.5) * 0.4, ALTO + 0.25 + i * 0.32, (Math.random() - 0.5) * 0.3)]);
  }
  g.add(new THREE.Mesh(juntar(fagulhas), LAVA_ACESA(0xffc24d)));
  return g;
}

// Árvore queimada: só o tronco preto e dois galhos secos.
// Árvore queimada: o tronco torto e carbonizado, que afina e termina
// quebrado numa ponta lascada, e três galhos curtos partidos. Brasas ainda
// acesas brilham nas rachaduras da casca. A de antes era um poste com dois
// paus retos.
function charredTree() {
  const g = new THREE.Group();
  const lado = Math.random() < 0.5 ? -1 : 1;
  const ALTO = 1.9 + Math.random() * 0.4;
  const eixo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(lado * 0.1, ALTO * 0.35, 0.04),
    new THREE.Vector3(-lado * 0.06, ALTO * 0.7, 0), new THREE.Vector3(lado * 0.04, ALTO, -0.03),
  ]);
  const ANEIS = 10, LADOS = 6;
  const tronco = new THREE.TubeGeometry(eixo, ANEIS, 0.2, LADOS);
  const pos = tronco.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / (LADOS + 1)) / ANEIS;
    const c = eixo.getPoint(t);
    // Afina para cima e alarga no pé, onde as raízes seguram.
    const k = (1 - t * 0.55) * (1 + Math.max(0, 0.25 - t) * 1.6);
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, pos.getY(i), c.z + (pos.getZ(i) - c.z) * k);
  }
  tronco.computeVertexNormals();
  const pecas = [[tronco, new THREE.Matrix4()]];
  // A ponta quebrada: três lascas de alturas diferentes.
  const topo = eixo.getPoint(1);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const alto = 0.18 + k * 0.1;
    pecas.push([new THREE.ConeGeometry(0.05, alto, 3), naPosicao(topo.x + Math.cos(a) * 0.05, topo.y + alto / 2 - 0.02, topo.z + Math.sin(a) * 0.05)]);
  }
  // Galhos partidos: curtos, subindo em curva, sem ponta fina.
  for (let k = 0; k < 3; k++) {
    const de = eixo.getPoint(0.5 + k * 0.15);
    const a = k * 2.3 + Math.random() * 0.5;
    const dir = new THREE.Vector3(Math.cos(a), 0.75, Math.sin(a)).normalize();
    const comp = 0.6 - k * 0.12;
    const fim = de.clone().addScaledVector(dir, comp);
    const meio = de.clone().addScaledVector(dir, comp * 0.5).add(new THREE.Vector3(0, -comp * 0.12, 0));
    pecas.push([new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(de, meio, fim), 5, 0.06 - k * 0.01, 5), new THREE.Matrix4()]);
  }
  const arvore = new THREE.Mesh(juntar(pecas), mat(0x241e29));
  arvore.castShadow = true;
  g.add(arvore);

  // Brasas nas rachaduras da casca: frestas acesas, compridas no sentido
  // do tronco.
  const brasas = [];
  for (let k = 0; k < 4; k++) {
    const t = 0.1 + k * 0.17 + Math.random() * 0.05;
    const c = eixo.getPoint(t);
    const a = Math.random() * Math.PI * 2;
    const r = 0.2 * (1 - t * 0.55) * (1 + Math.max(0, 0.25 - t) * 1.6) * 0.97;
    brasas.push([new THREE.SphereGeometry(0.05, 5, 4), new THREE.Matrix4().compose(
      new THREE.Vector3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r),
      new THREE.Quaternion().setFromAxisAngle(CIMA, -a), new THREE.Vector3(0.35, 2.4, 0.9))]);
  }
  g.add(new THREE.Mesh(juntar(brasas), LAVA_ACESA(pick(LAVA))));
  return g;
}

// Obstáculo: pedregulho de lava, com o disco de aviso no chão.
// Obstáculo: pedregulho de lava — um bloco de basalto redondo e
// irregular, todo rachado, com a lava acesa correndo pelas rachaduras.
// Era um icosaedro liso com quatro manchas laranja coladas.
function lavaBoulder() {
  const g = new THREE.Group();
  const cor = pick(LAVA);
  const geo = pedraIrregular(0.62, 0.12);
  const pedra = new THREE.Mesh(geo, mat(0x342d3a));
  pedra.position.y = 0.6;
  pedra.rotation.y = Math.random() * Math.PI;
  pedra.castShadow = true;
  pedra.add(new THREE.Mesh(veiosDeLava(geo, { caminhos: 4, passos: 6, espessura: 0.04, sobe: -0.3 }), LAVA_ACESA(cor)));
  g.add(pedra);
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

// Pinheiro nevado: três andares de copa, cada um com uma capa de neve em
// cima que escorre em bicos pela copa, e um montinho de neve no pé. A neve
// de antes era um aro fino na beira de cada andar e quase não aparecia.
// Três malhas: tronco, verde e neve.
function snowPine() {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.7, 6), mat(0x6b5544));
  tronco.position.y = 0.35;
  g.add(tronco);

  const verdes = [], neves = [];
  for (let i = 0; i < 3; i++) {
    const R = 0.78 - i * 0.19, H = 0.9 - i * 0.08;
    const y = 0.9 + i * 0.55;
    verdes.push([new THREE.ConeGeometry(R, H, 9), naPosicao(0, y, 0)]);
    // A capa: o mesmo cone, do topo até perto da beira, um tico maior — e a
    // borda de baixo ondulada, para a neve escorrer em bicos. Ela desce até
    // abaixo da saia do andar de cima, que cobre o topo deste: uma capa só
    // no alto ficava toda escondida.
    const alto = H * (i === 2 ? 0.6 : 0.7);
    const capa = new THREE.ConeGeometry((R * alto / H) * 1.07, alto, 18, 1, true);
    const pos = capa.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      if (pos.getY(k) > 0) continue;
      // O bico desce **pela encosta** do cone (abre junto enquanto desce):
      // descendo reto, a face inteira afundava na copa e o verde vazava
      // em listras pela neve.
      const ang = Math.atan2(pos.getZ(k), pos.getX(k));
      const desce = Math.max(0, Math.sin(ang * 6 + i)) * 0.12;
      const abre = 1 + desce / alto;
      pos.setXYZ(k, pos.getX(k) * abre, pos.getY(k) - desce, pos.getZ(k) * abre);
    }
    capa.computeVertexNormals();
    neves.push([capa, naPosicao(0, y + H / 2 - alto / 2 + 0.01, 0)]);
  }
  const montinho = new THREE.SphereGeometry(0.5, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2);
  montinho.scale(1, 0.18, 1);
  neves.push([montinho, new THREE.Matrix4()]);

  const copa = new THREE.Mesh(juntar(verdes), mat(0x3f7d5d));
  copa.castShadow = true;
  g.add(copa);
  g.add(new THREE.Mesh(juntar(neves), mat(0xffffff, { side: THREE.DoubleSide })));
  return g;
}

// Iglu: a cúpula de blocos de gelo em fileiras desencontradas (cada bloco
// num branco um tico diferente do vizinho), o túnel de entrada em arco,
// também de blocos, e a porta escura em arco na ponta. O de antes era uma
// cúpula lisa com uma caixa na frente.
function pintarBlocos(geo, bloco, cores3 = [0xf4f9ff, 0xdde9f5, 0xe9f2fb]) {
  const malha = geo.index ? geo.toNonIndexed() : geo;
  const pos = malha.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  const tons = cores3.map((c) => new THREE.Color(c));
  const p = new THREE.Vector3();
  for (let t = 0; t < pos.count; t += 3) {
    p.set(0, 0, 0);
    for (let k = 0; k < 3; k++) p.add(new THREE.Vector3().fromBufferAttribute(pos, t + k));
    p.divideScalar(3);
    const [fila, coluna] = bloco(p);
    const cor = tons[((fila * 7 + coluna * 3) % 3 + 3) % 3];
    for (let k = 0; k < 3; k++) cores.set([cor.r, cor.g, cor.b], (t + k) * 3);
  }
  malha.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  malha.computeVertexNormals();
  return malha;
}

function igloo() {
  const g = new THREE.Group();
  const R = 0.85;
  const FILAS = 5;
  const domo = new THREE.Mesh(
    pintarBlocos(new THREE.SphereGeometry(R, 32, FILAS * 2, 0, Math.PI * 2, 0, Math.PI / 2), (p) => {
      const fila = Math.floor((p.y / R) * FILAS * 0.999);
      const porFila = Math.max(3, Math.round(14 * Math.cos((fila / FILAS) * Math.PI / 2)));
      const ang = (Math.atan2(p.z, p.x) / (Math.PI * 2) + 1) % 1;
      return [fila, Math.floor(ang * porFila + (fila % 2) * 0.5)];
    }),
    tintaDaMalha()
  );
  domo.castShadow = true;
  g.add(domo);

  // O túnel: meio cilindro deitado, apontando para a frente (+Z).
  const RT = 0.36, COMP = 0.6;
  const tunelGeo = new THREE.CylinderGeometry(RT, RT, COMP, 12, 2, true, Math.PI / 2, Math.PI);
  tunelGeo.rotateX(Math.PI / 2);
  const tunel = new THREE.Mesh(
    pintarBlocos(tunelGeo, (p) => [Math.floor((p.z + COMP / 2) / (COMP / 2)), Math.floor((Math.atan2(p.y, p.x) / Math.PI) * 5 + Math.floor((p.z + COMP / 2) / (COMP / 2)) * 0.5)]),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  tunel.position.set(0, 0, R * 0.78 + COMP / 2 - 0.1);
  tunel.castShadow = true;
  g.add(tunel);

  const arco = new THREE.Shape();
  arco.moveTo(-RT * 0.72, 0);
  arco.lineTo(-RT * 0.72, RT * 0.3);
  arco.absarc(0, RT * 0.3, RT * 0.72, Math.PI, 0, true);
  arco.lineTo(RT * 0.72, 0);
  arco.lineTo(-RT * 0.72, 0);
  const porta = new THREE.Mesh(new THREE.ShapeGeometry(arco, 10), mat(0x4a6680));
  porta.position.set(0, 0.005, R * 0.78 + COMP - 0.1 + 0.005);
  g.add(porta);
  return g;
}

// Cristal de gelo: um tufo de prismas de gelo de ponta facetada, claros e
// translúcidos. Os de antes eram três cones lisos.
function iceCrystal() {
  const g = new THREE.Group();
  const cor = pick(GELO);
  // Cada cristal é um prisma de seis faces com a ponta facetada, saindo do
  // chão inclinado para fora — um tufo de quatro ou cinco, numa malha só.
  const pecas = [];
  const N = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < N; i++) {
    const alto = i === 0 ? 1.2 : 0.45 + Math.random() * 0.5;
    const r = i === 0 ? 0.17 : 0.08 + Math.random() * 0.06;
    const corpo = new THREE.CylinderGeometry(r, r * 1.1, alto, 6);
    const ponta = new THREE.ConeGeometry(r, r * 2.2, 6);
    ponta.translate(0, alto / 2 + r * 1.1, 0);
    const cristal = juntar([[corpo, new THREE.Matrix4()], [ponta, new THREE.Matrix4()]]);
    cristal.translate(0, alto / 2, 0);
    const a = (i / N) * Math.PI * 2 + Math.random() * 0.5;
    const inclina = i === 0 ? 0.08 : 0.35 + Math.random() * 0.25;
    const dir = new THREE.Vector3(Math.cos(a) * Math.sin(inclina), Math.cos(inclina), Math.sin(a) * Math.sin(inclina));
    const base = i === 0 ? new THREE.Vector3() : new THREE.Vector3(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
    pecas.push([cristal, apontar(base, dir)]);
  }
  const tufo = new THREE.Mesh(juntar(pecas), new THREE.MeshLambertMaterial({
    color: cor, flatShading: true, transparent: true, opacity: 0.8,
    emissive: cor, emissiveIntensity: 0.3,
  }));
  tufo.castShadow = true;
  g.add(tufo);
  return g;
}

// Boneco de neve: três bolas, olhos e sorriso de carvão, nariz de cenoura,
// botões, braços de graveto, cachecol com a ponta caída e gorro com pompom.
// O de antes tinha os olhos boiando em cima da cabeça (a conta da altura
// passava da última bola) e nada além do nariz.
function snowman() {
  const g = new THREE.Group();
  const [corCachecol, corGorro] = pick([[0xff4d5e, 0x4dc3ff], [0x4dc3ff, 0xff7bac], [0xffd166, 0x7a4ec7], [0x8ce99a, 0xff4d5e]]);
  const BOLAS = [[0.42, 0.38], [0.31, 0.92], [0.23, 1.33]];   // [raio, altura do centro]
  const [, [rMeio, yMeio], [rCabeca, yCabeca]] = BOLAS;

  const neve = new THREE.Mesh(juntar(BOLAS.map(([r, y]) => [new THREE.IcosahedronGeometry(r, 2), naPosicao(0, y, 0)])), mat(0xffffff));
  neve.castShadow = true;
  g.add(neve);

  // O carvão: olhos, sorriso e botões, todos colados na frente (+Z).
  const naFrente = (r, cy, ang, alt) => new THREE.Vector3(Math.sin(ang) * r * Math.cos(alt), cy + Math.sin(alt) * r, Math.cos(ang) * r * Math.cos(alt));
  const carvao = new THREE.IcosahedronGeometry(1, 0);
  const pecas = [];
  const pedra = (p, t) => pecas.push([carvao, new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(t, t, t))]);
  for (const lado of [-1, 1]) pedra(naFrente(rCabeca, yCabeca, lado * 0.33, 0.3), 0.035);
  for (let k = 0; k < 5; k++) pedra(naFrente(rCabeca, yCabeca, (k - 2) * 0.2, -0.32 - Math.cos((k - 2) * 0.6) * 0.1 + 0.1), 0.022);
  for (let k = 0; k < 3; k++) pedra(naFrente(rMeio, yMeio, 0, 0.35 - k * 0.35), 0.04);
  g.add(new THREE.Mesh(juntar(pecas), mat(0x2b2530)));

  const cenoura = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.26, 6), mat(0xff8a3c));
  cenoura.rotation.x = Math.PI / 2;
  cenoura.position.set(0, yCabeca, rCabeca + 0.11);
  g.add(cenoura);

  // Braços de graveto, cada um com dois dedinhos na ponta.
  const gravetos = [];
  for (const lado of [-1, 1]) {
    const ombro = new THREE.Vector3(lado * rMeio * 0.85, yMeio + 0.08, 0);
    const dir = new THREE.Vector3(lado, 0.55, 0.1).normalize();
    gravetos.push([new THREE.CylinderGeometry(0.018, 0.026, 0.5, 5), apontar(ombro.clone().addScaledVector(dir, 0.25), dir)]);
    const mao = ombro.clone().addScaledVector(dir, 0.46);
    for (const desvio of [0.6, -0.4]) {
      const d = new THREE.Vector3(lado * 0.6, 0.8 + desvio * 0.3, desvio * 0.5).normalize();
      gravetos.push([new THREE.CylinderGeometry(0.01, 0.014, 0.14, 4), apontar(mao.clone().addScaledVector(d, 0.06), d)]);
    }
  }
  g.add(new THREE.Mesh(juntar(gravetos), mat(0x6b4a35)));

  // O cachecol na altura do pescoço, com a ponta caindo na frente.
  const pescoco = yMeio + rMeio * 0.82;
  const cachecol = juntar([
    [new THREE.TorusGeometry(rCabeca * 0.9, 0.06, 6, 14), new THREE.Matrix4().compose(new THREE.Vector3(0, pescoco, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1))],
    [new THREE.BoxGeometry(0.1, 0.3, 0.04), new THREE.Matrix4().compose(new THREE.Vector3(0.1, pescoco - 0.14, rCabeca * 0.95), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0, 0.15)), new THREE.Vector3(1, 1, 1))],
  ]);
  g.add(new THREE.Mesh(cachecol, mat(corCachecol)));

  // O gorro com a barra dobrada e o pompom.
  const gorro = juntar([
    [new THREE.SphereGeometry(rCabeca * 1.04, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), naPosicao(0, yCabeca + 0.04, 0)],
    [new THREE.SphereGeometry(0.075, 8, 6), naPosicao(0, yCabeca + rCabeca + 0.1, 0)],
  ]);
  g.add(new THREE.Mesh(gorro, mat(corGorro)));
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(rCabeca * 1.08, rCabeca * 1.08, 0.08, 14), mat(0xffffff));
  barra.position.y = yCabeca + 0.06;
  g.add(barra);
  return g;
}

// Obstáculo: bloco de gelo de quinas chanfradas, translúcido, com uma
// almofada de neve fofa em cima e pinguinhos de gelo escorrendo pelas
// beiradas. O de antes era um cubo com uma tampa cinza, e lia como caixa.
function iceBlock() {
  const g = new THREE.Group();
  const cor = pick(GELO);
  const L = 0.8, ALTO = 0.78, CHANFRO = 0.07;
  const quadrado = new THREE.Shape();
  quadrado.moveTo(-L / 2, -L / 2);
  quadrado.lineTo(L / 2, -L / 2);
  quadrado.lineTo(L / 2, L / 2);
  quadrado.lineTo(-L / 2, L / 2);
  quadrado.lineTo(-L / 2, -L / 2);
  const blocoGeo = new THREE.ExtrudeGeometry(quadrado, {
    depth: ALTO - CHANFRO * 2, bevelEnabled: true, bevelThickness: CHANFRO, bevelSize: CHANFRO, bevelSegments: 1,
  });
  blocoGeo.rotateX(-Math.PI / 2);           // a extrusão vira a altura
  blocoGeo.translate(0, CHANFRO, 0);
  const giro = Math.random() * 0.6;
  const bloco = new THREE.Mesh(blocoGeo, new THREE.MeshLambertMaterial({
    color: cor, flatShading: true, transparent: true, opacity: 0.82,
    emissive: cor, emissiveIntensity: 0.3,
  }));
  bloco.rotation.y = giro;
  bloco.castShadow = true;
  g.add(bloco);

  // A neve em cima: uma almofada achatada, um tico maior que o tampo.
  const almofada = new THREE.SphereGeometry(L * 0.62, 14, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  almofada.scale(1, 0.28, 1);
  const neve = [[almofada, naPosicao(0, ALTO - 0.01, 0)]];
  // Os pinguinhos: cones de ponta para baixo pendurados nas beiradas.
  const pingo = new THREE.ConeGeometry(1, 1, 5);
  pingo.rotateX(Math.PI);
  pingo.translate(0, -0.5, 0);
  const pingos = [];
  for (let i = 0; i < 7; i++) {
    const lado = Math.floor(Math.random() * 4);
    const ao = (Math.random() - 0.5) * L * 0.8;
    const [x, z] = [[ao, L / 2 + CHANFRO], [L / 2 + CHANFRO, ao], [ao, -L / 2 - CHANFRO], [-L / 2 - CHANFRO, ao]][lado];
    const comp = 0.1 + Math.random() * 0.16;
    pingos.push([pingo, new THREE.Matrix4().compose(new THREE.Vector3(x, ALTO - 0.02, z), new THREE.Quaternion(), new THREE.Vector3(0.03, comp, 0.03))]);
  }
  const neveMalha = new THREE.Mesh(juntar(neve), mat(0xffffff));
  neveMalha.rotation.y = giro;
  g.add(neveMalha);
  const pingosMalha = new THREE.Mesh(juntar(pingos), new THREE.MeshLambertMaterial({ color: 0xe6f6ff, flatShading: true, emissive: cor, emissiveIntensity: 0.25 }));
  pingosMalha.rotation.y = giro;
  g.add(pingosMalha);
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

// Cascalho de asteroide: pedras irregulares espalhadas e baixas, de
// tamanhos e tons diferentes, numa malha só. Espalhadas na horizontal e
// nunca uma sobre a outra — empilhadas, a silhueta virava arvorezinha.
// Também é obstáculo no Espaço.
function asteroid() {
  const g = new THREE.Group();
  const pecas = [];
  const quantas = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < quantas; i++) {
    const raio = i === 0 ? 0.42 : 0.12 + Math.random() * 0.22;
    const a = Math.random() * Math.PI * 2, d = i === 0 ? 0 : 0.5 + Math.random() * 0.7;
    pecas.push([pedraIrregular(raio, 0.22, i === 0 ? 1 : 0), new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * d, raio * 0.7, Math.sin(a) * d),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, 0)),
      new THREE.Vector3(1, 0.75, 1)), pick([0x6b6478, 0x5e576c, 0x7d7590])]);
  }
  const pedras = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha());
  pedras.castShadow = true;
  g.add(pedras);
  return g;
}

// Cratera rasa: um anel de borda levantada com o fundo escuro, deitado na
// superfície da rocha onde um raio de fora a acerta (o mesmo jeito da lua
// entalhada da pedra de luar).
function craterasEm(rocha, quantas, tamanho, corFundo) {
  rocha.updateMatrixWorld(true);
  const inversa = rocha.matrixWorld.clone().invert();
  const raio = new THREE.Raycaster();
  const centro = new THREE.Vector3().setFromMatrixPosition(rocha.matrixWorld);
  const bordas = [], fundos = [];
  for (let i = 0; i < quantas; i++) {
    // De cima e dos lados — embaixo ninguém vê.
    const dir = new THREE.Vector3(Math.random() - 0.5, 0.2 + Math.random() * 0.8, Math.random() - 0.5).normalize();
    raio.set(centro.clone().addScaledVector(dir, 5), dir.clone().negate());
    const acerto = raio.intersectObject(rocha)[0];
    if (!acerto) continue;
    const ponto = acerto.point.applyMatrix4(inversa);
    const normal = acerto.face.normal.clone();
    const r = tamanho * (0.6 + Math.random() * 0.6);
    const giro = new THREE.Quaternion().setFromUnitVectors(CIMA, normal);
    bordas.push([new THREE.TorusGeometry(r, r * 0.28, 4, 10).rotateX(Math.PI / 2), new THREE.Matrix4().compose(ponto, giro, new THREE.Vector3(1, 0.6, 1))]);
    fundos.push([new THREE.CircleGeometry(r, 10).rotateX(-Math.PI / 2), new THREE.Matrix4().compose(ponto.clone().addScaledVector(normal, 0.005), giro, new THREE.Vector3(1, 1, 1))]);
  }
  if (!bordas.length) return;
  rocha.add(new THREE.Mesh(juntar(bordas), rocha.material));
  rocha.add(new THREE.Mesh(juntar(fundos), mat(corFundo)));
}

// Pedaço grande de asteroide: uma rocha irregular cheia de crateras, com
// lascas soltas flutuando em volta (no espaço nada cai). Era um icosaedro
// liso com quatro tetraedros.
function asteroidChunk() {
  const g = new THREE.Group();
  const raio = 0.55 + Math.random() * 0.3;
  const rocha = new THREE.Mesh(pedraIrregular(raio, 0.14), mat(0x6a6380));
  rocha.position.y = raio * 0.95;
  rocha.scale.set(1.15, 0.9, 1);
  rocha.rotation.y = Math.random() * Math.PI;
  rocha.castShadow = true;
  g.add(rocha);
  craterasEm(rocha, 4, raio * 0.22, 0x4a4458);

  const lascas = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.random();
    lascas.push([pedraIrregular(0.1 + Math.random() * 0.1, 0.3, 0), naPosicao(
      Math.cos(a) * (raio + 0.55), raio * 0.7 + Math.random() * 0.9, Math.sin(a) * (raio + 0.55))]);
  }
  const soltas = new THREE.Mesh(juntar(lascas), mat(0x8a82a0));
  soltas.castShadow = true;
  g.add(soltas);
  return g;
}

// Obstáculo: meteoro caindo — a pedra irregular em brasa, com as rachas
// acesas, e a cauda de fogo subindo atrás dela em três camadas (branca
// por dentro, amarela, laranja por fora). Era um icosaedro com um cone
// deitado apontando para quem corre.
function meteor() {
  const g = new THREE.Group();
  const [corFora, corMeio] = pick([[0xff8a3d, 0xffc24d], [0x6fb6ff, 0xb5e0ff]]);
  const geo = pedraIrregular(0.5, 0.14);
  const pedra = new THREE.Mesh(geo, mat(0x4e4858));
  pedra.position.y = 0.6;
  pedra.castShadow = true;
  pedra.add(new THREE.Mesh(veiosDeLava(geo, { caminhos: 3, passos: 5, espessura: 0.035, sobe: -0.2 }), LAVA_ACESA(corMeio)));
  g.add(pedra);

  // A cauda: sai de trás da pedra e sobe inclinada, de onde ela veio.
  const cauda = new THREE.Group();
  cauda.position.set(0, 0.7, -0.15);
  cauda.rotation.x = -0.85;
  const camadas = [[0.5, 2.0, corFora, 0.45], [0.34, 1.5, corMeio, 0.7], [0.18, 1.0, 0xfff8e0, 0.9]];
  for (const [raio, comp, cor, opacidade] of camadas) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(raio, comp, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opacidade, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.y = comp / 2;              // a base larga junto da pedra
    cauda.add(cone);
  }
  g.add(cauda);
  g.add(warningRing(corFora));
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


// A matriz de uma peça: posição, giro (x, y, z) e escala (número ou [x,y,z]).
function pose(x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
  const e = Array.isArray(s) ? s : [s, s, s];
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(...e));
}
// Põe uma lista de peças [geo, matriz, cor] dentro de outra pose.
const naPose = (pecas, m) => pecas.map(([geo, local, cor]) => [geo, m.clone().multiply(local), cor]);

// O que tira a cara de papelão: areia não tem aresta reta nem cor lisa.
// Cada vértice anda um pouco para um lado qualquer (o mesmo ponto, nas
// emendas, anda junto — senão abre buraco) e ganha um tom um tico mais
// claro ou mais escuro; o que encosta no chão fica com cor de areia
// molhada, como o pé de um castelo de verdade.
function granular(geo, tremor, { molhado = 0.1 } = {}) {
  const pos = geo.attributes.position;
  const cor = geo.attributes.color;
  const ponto = new Map();
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const chave = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!ponto.has(chave)) {
      ponto.set(chave, {
        dx: (Math.random() - 0.5) * 2 * tremor,
        dy: (Math.random() - 0.5) * tremor,
        dz: (Math.random() - 0.5) * 2 * tremor,
        tom: 0.93 + Math.random() * 0.1,
      });
    }
    const p = ponto.get(chave);
    // Nada desce abaixo do chão: a base fica assentada.
    pos.setXYZ(i, x + p.dx, y > 0.005 ? Math.max(0, y + p.dy) : y, z + p.dz);
    if (cor) {
      c.fromBufferAttribute(cor, i).multiplyScalar(p.tom);
      if (y < molhado) c.multiplyScalar(0.84 + 0.16 * (y / molhado));
      cor.setXYZ(i, Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b));
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// A torre que sai de um balde virado: mais larga embaixo, com os sulcos que
// os anéis do balde deixam na areia e a borda de cima um pouco arredondada.
// É a mesma forma do baldinho dos brinquedos, de cabeça para baixo.
function torreDeBalde(r, h, lados = 12) {
  const perfil = [
    [r, 0], [r * 0.99, h * 0.22], [r * 0.93, h * 0.26], [r * 0.97, h * 0.3],
    [r * 0.9, h * 0.62], [r * 0.84, h * 0.66], [r * 0.88, h * 0.7],
    [r * 0.82, h * 0.95], [r * 0.76, h], [0, h],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(perfil, lados);
}

// As ameias no topo de uma torre: blocos ao redor da borda, com vão entre eles.
function ameias(r, y, quantas, cor) {
  const pecas = [];
  const giro = Math.random() * Math.PI;
  for (let i = 0; i < quantas; i++) {
    const a = giro + (i / quantas) * Math.PI * 2;
    const largura = (Math.PI * 2 * r) / quantas * 0.55;
    pecas.push([new THREE.BoxGeometry(largura, r * 0.45, r * 0.32),
      pose(Math.cos(a) * r * 0.78, y + r * 0.2, Math.sin(a) * r * 0.78, 0, Math.PI / 2 - a, 0), cor]);
  }
  return pecas;
}

// Castelo de pingos: a areia bem molhada que se deixa escorrer da mão, uma
// bolota em cima da outra, cada vez menor.
function pingos(r, y, cor) {
  const pecas = [];
  let raio = r * 0.62, x = 0, z = 0;
  const quantos = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < quantos; i++) {
    pecas.push([new THREE.SphereGeometry(raio, 7, 5), pose(x, y + raio * 0.55, z, 0, Math.random() * 3, 0, [1, 0.72, 1]), cor]);
    y += raio * 1.0;
    raio *= 0.78;
    x += (Math.random() - 0.5) * 0.04;
    z += (Math.random() - 0.5) * 0.04;
  }
  return { pecas, topo: new THREE.Vector3(x, y, z) };
}

// O topo de uma torre, sorteado: ameias, pingos ou um cone de funil.
function topoDaTorre(r, y, cor, tipo) {
  if (tipo === 'pingos') return pingos(r, y, cor);
  if (tipo === 'cone') {
    const alto = r * 1.5;
    return {
      pecas: [[new THREE.ConeGeometry(r * 0.72, alto, 10, 2), pose(0, y + alto / 2, 0), cor]],
      topo: new THREE.Vector3(0, y + alto, 0),
    };
  }
  return { pecas: ameias(r * 0.8, y, r > 0.22 ? 6 : 5, cor), topo: new THREE.Vector3(0, y, 0) };
}

const BANDEIRA = (() => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.14, 0, 0.24, -0.06, 0], 3));
  geo.computeVertexNormals();
  return geo;
})();

const PLASTICO = [0xff5d8f, 0x3fb7ef, 0xffcc3d, 0x5ccf7a, 0xa98bff, 0xff8a3d];

// Castelo de areia: um morrinho de base, a torre do meio feita com o balde
// maior e, em volta, torres menores (às vezes ligadas por muralha). Cada
// torre termina de um jeito — ameias, pingos ou cone —, e às vezes tem
// fosso com água, conchas grudadas, bandeirinha e o baldinho esquecido do
// lado. O de antes era uma caixa com quatro cilindros de telhado rosa, e
// lia como maquete de papelão.
function sandcastle() {
  const g = new THREE.Group();
  const areia = pick([0xf0d3a0, 0xeccb92, 0xf3dcb0]);
  const seca = new THREE.Color(areia).offsetHSL(0, -0.05, 0.04).getHex();
  const sombra = new THREE.Color(areia).offsetHSL(0, 0.05, -0.32).getHex();
  const pecas = [];

  // O morrinho: meia esfera achatada e amassada.
  const R = 0.8, H = 0.22;
  const morro = new THREE.SphereGeometry(R, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  morro.scale(1, H / R, 1);
  granular(morro, 0.05, { molhado: 0 });
  pecas.push([morro, new THREE.Matrix4(), areia]);
  const chao = (d) => H * Math.sqrt(Math.max(0, 1 - (d / R) ** 2)) - 0.04;

  const TOPOS = ['ameias', 'ameias', 'pingos', 'cone'];

  // A torre do meio.
  const rM = 0.25 + Math.random() * 0.07;
  const hM = 0.5 + Math.random() * 0.25;
  const yM = chao(0);
  pecas.push([torreDeBalde(rM, hM), pose(0, yM, 0), areia]);
  const meio = topoDaTorre(rM * 0.78, yM + hM, areia, pick(TOPOS));
  pecas.push(...meio.pecas);
  // A porta em arco, escura de sombra, e uma janelinha.
  const frente = rM * 0.96;
  pecas.push([new THREE.BoxGeometry(0.11, 0.12, 0.05), pose(0, yM + 0.06, frente), sombra]);
  pecas.push([new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8, 1, false, -Math.PI / 2, Math.PI),
    pose(0, yM + 0.12, frente, -Math.PI / 2, 0, 0), sombra]);
  pecas.push([new THREE.BoxGeometry(0.04, 0.07, 0.04), pose(0, yM + hM * 0.78, rM * 0.82), sombra]);

  // As torres de fora, numa roda em volta.
  const nFora = pick([2, 3, 3, 4, 4, 5]);
  const anel = 0.5 + Math.random() * 0.06;
  const giro = Math.random() * Math.PI * 2;
  const fora = [];
  for (let i = 0; i < nFora; i++) {
    const a = giro + (i / nFora) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const r = 0.13 + Math.random() * 0.06;
    const h = 0.28 + Math.random() * 0.2;
    const x = Math.cos(a) * anel, z = Math.sin(a) * anel, y = chao(anel);
    pecas.push([torreDeBalde(r, h, 10), pose(x, y, z, 0, Math.random() * 3, 0), seca]);
    const topo = topoDaTorre(r, y + h, seca, pick(TOPOS));
    pecas.push(...naPose(topo.pecas, pose(x, 0, z)));
    // A janelinha, virada para fora.
    pecas.push([new THREE.BoxGeometry(0.035, 0.06, 0.03),
      pose(x, y + h * 0.6, z, 0, Math.PI / 2 - a, 0).multiply(pose(0, 0, r * 0.86)), sombra]);
    fora.push({ x, z, y, h });
  }

  // A muralha: ligando as torres de fora, mais baixa que elas, com ameias.
  if (nFora >= 3 && Math.random() < 0.65) {
    for (let i = 0; i < nFora; i++) {
      const p = fora[i], q = fora[(i + 1) % nFora];
      const dx = q.x - p.x, dz = q.z - p.z;
      const comp = Math.hypot(dx, dz);
      const alto = Math.min(p.h, q.h) * 0.6;
      const m = pose((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2, 0, -Math.atan2(dz, dx), 0);
      pecas.push([new THREE.BoxGeometry(comp, alto, 0.12, 4, 2, 1), m.clone().multiply(pose(0, alto / 2, 0)), seca]);
      const blocos = Math.max(2, Math.round(comp / 0.11));
      for (let k = 0; k < blocos; k++) {
        const t = (k + 0.5) / blocos - 0.5;
        if (Math.abs(t * comp) > comp / 2 - 0.12) continue;     // perto da torre não cabe
        pecas.push([new THREE.BoxGeometry(0.06, 0.06, 0.12), m.clone().multiply(pose(t * comp, alto + 0.03, 0)), seca]);
      }
    }
  }

  // Conchinhas grudadas no castelo e no morro.
  const conchas = Math.floor(Math.random() * 4);
  for (let i = 0; i < conchas; i++) {
    const a = Math.random() * Math.PI * 2, d = 0.35 + Math.random() * 0.35;
    pecas.push([new THREE.SphereGeometry(0.045, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2),
      pose(Math.cos(a) * d, chao(d) + 0.035, Math.sin(a) * d, (Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6, [1, 0.5, 0.8]),
      pick([0xffffff, 0xffd6e4, 0xffe9c7])]);
  }

  const corpo = new THREE.Mesh(granular(juntarColorido(pecas), 0.012), tintaDaMalha());
  corpo.castShadow = true;
  corpo.receiveShadow = true;
  g.add(corpo);

  // A bandeirinha no alto da torre do meio.
  if (Math.random() < 0.8) {
    const topo = meio.topo;
    const altura = 0.32;
    const pau = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, altura, 4), mat(0xfff6e8));
    pau.position.set(topo.x, topo.y + altura / 2 - 0.05, topo.z);
    const bandeira = new THREE.Mesh(BANDEIRA, mat(pick(PLASTICO), { side: THREE.DoubleSide }));
    bandeira.position.set(topo.x, topo.y + altura - 0.05, topo.z);
    bandeira.rotation.y = Math.random() * Math.PI * 2;
    g.add(pau, bandeira);
  }

  // O fosso: uma volta de areia molhada com água no fundo.
  if (Math.random() < 0.4) {
    const fosso = new THREE.Mesh(juntarColorido([
      [new THREE.RingGeometry(R * 0.98, R * 1.26, 28), pose(0, 0.012, 0, -Math.PI / 2, 0, 0), new THREE.Color(areia).multiplyScalar(0.8).getHex()],
      [new THREE.RingGeometry(R * 1.04, R * 1.2, 28), pose(0, 0.02, 0, -Math.PI / 2, 0, 0), 0x6fcfe4],
    ]), tintaDaMalha());
    fosso.receiveShadow = true;
    g.add(fosso);
  } else if (Math.random() < 0.45) {
    // Ou o baldinho que ficou do lado, com a pá.
    const balde = baldinho(pick(PLASTICO));
    balde.scale.setScalar(0.7);
    const a = Math.random() * Math.PI * 2;
    balde.position.set(Math.cos(a) * (R + 0.3), 0, Math.sin(a) * (R + 0.3));
    g.add(balde);
  }
  return g;
}

// --- Baldinho e brinquedos de areia ---

// O baldinho de praia: corpo que alarga para cima (o perfil tem parede, então
// por dentro ele é oco), uma faixa de outra cor, a alça em arco caída para o
// lado e, às vezes, cheio de areia até perto da borda.
function baldinho(cor, { cheio = Math.random() < 0.6, faixa = pick(PLASTICO) } = {}) {
  const g = new THREE.Group();
  const perfil = [
    [0, 0.005], [0.18, 0.005], [0.19, 0.02], [0.245, 0.37], [0.262, 0.385], [0.262, 0.41],
    [0.248, 0.41], [0.235, 0.37], [0.178, 0.035], [0, 0.035],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const plastico = { flatShading: false };
  const corpo = new THREE.Mesh(new THREE.LatheGeometry(perfil, 20), mat(cor, { ...plastico, side: THREE.DoubleSide }));
  corpo.castShadow = true;
  g.add(corpo);

  // A faixa e a alça numa malha só, na cor de contraste.
  const raioEm = (y) => 0.19 + (0.055 * (y - 0.02)) / 0.35;
  const caida = 0.6 + Math.random() * 0.8;
  const arco = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => {
    const a = (i / 12) * Math.PI;
    return new THREE.Vector3(Math.cos(a) * 0.268, Math.sin(a) * 0.268, 0);
  })), 16, 0.012, 5);
  const acessorios = [
    [new THREE.TorusGeometry(raioEm(0.2) + 0.004, 0.022, 4, 24), pose(0, 0.2, 0, Math.PI / 2, 0, 0, [1, 1, 1.6]), faixa],
    [arco, pose(0, 0.355, 0, caida, 0, 0), faixa],
    [new THREE.CylinderGeometry(0.026, 0.026, 0.03, 8), pose(0.262, 0.355, 0, 0, 0, Math.PI / 2), faixa],
    [new THREE.CylinderGeometry(0.026, 0.026, 0.03, 8), pose(-0.262, 0.355, 0, 0, 0, Math.PI / 2), faixa],
  ];
  g.add(new THREE.Mesh(juntarColorido(acessorios), tintaDaMalha(plastico)));

  if (cheio) {
    const monte = new THREE.SphereGeometry(0.235, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    monte.scale(1, 0.32, 1);
    const areia = new THREE.Mesh(granular(juntarColorido([[monte, pose(0, 0.33, 0), 0xf0d3a0]]), 0.012, { molhado: 0 }), tintaDaMalha());
    g.add(areia);
  }
  return g;
}

// A pazinha, de pé no eixo Y: a lâmina em bico embaixo (y < 0), o cabo e a
// argola de segurar em cima.
function pazinha(cor) {
  const lamina = new THREE.Shape();
  lamina.moveTo(-0.075, 0);
  lamina.lineTo(0.075, 0);
  lamina.quadraticCurveTo(0.095, -0.13, 0, -0.22);
  lamina.quadraticCurveTo(-0.095, -0.13, -0.075, 0);
  const geo = new THREE.ExtrudeGeometry(lamina, { depth: 0.016, bevelEnabled: false });
  geo.translate(0, 0, -0.008);
  return [
    [geo, new THREE.Matrix4(), cor],
    [new THREE.CylinderGeometry(0.02, 0.024, 0.36, 6), pose(0, 0.18, 0), cor],
    [new THREE.TorusGeometry(0.05, 0.016, 5, 12), pose(0, 0.41, 0), cor],
  ];
}

// O rastelinho: cabo, a travessa e os dentes saindo para a frente (+z) —
// deitado de costas no chão, os dentes ficam para cima.
function rastelinho(cor) {
  const pecas = [
    [new THREE.CylinderGeometry(0.02, 0.022, 0.4, 6), pose(0, 0.2, 0), cor],
    [new THREE.BoxGeometry(0.26, 0.04, 0.035), new THREE.Matrix4(), cor],
  ];
  for (let i = 0; i < 6; i++) {
    pecas.push([new THREE.BoxGeometry(0.018, 0.018, 0.075), pose(-0.11 + i * 0.044, 0, 0.05), cor]);
  }
  return pecas;
}

function formaEstrela(raio, pontas = 5, miolo = 0.48) {
  const s = new THREE.Shape();
  for (let i = 0; i < pontas * 2; i++) {
    const r = i % 2 ? raio * miolo : raio;
    const a = (i / (pontas * 2)) * Math.PI * 2 + Math.PI / 2;
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}

// Deitado no chão: o eixo Y da ferramenta vira o -Z do mundo.
const deitado = (x, z, giro, alto = 0.022) => pose(x, alto, z, 0, giro, 0).multiply(pose(0, 0, 0, -Math.PI / 2, 0, 0));

// Baldinho e brinquedos de areia: o balde (em pé e cheio, com a pá fincada,
// ou tombado com a areia escorrendo e o "bolo" que ele desenformou do lado),
// e em volta o que sobrou da brincadeira — rastelo, pá, a forminha de
// estrela e a estrela de areia que ela fez.
function sandToys() {
  const g = new THREE.Group();
  const cores = [...PLASTICO].sort(() => Math.random() - 0.5);
  const [corBalde, corPa, corRastelo, corForma] = cores;
  const plasticos = [];
  const areias = [];
  const tombado = Math.random() < 0.45;

  if (!tombado) {
    const balde = baldinho(corBalde, { cheio: true, faixa: cores[4] });
    g.add(balde);
    // A pá fincada na areia do balde, inclinada.
    plasticos.push(...naPose(pazinha(corPa), pose(0.04, 0.5, 0, 0.1, Math.random() * 3, -0.32)));
  } else {
    // Deitado de lado, com a boca virada para +x e a areia saindo.
    const balde = baldinho(corBalde, { cheio: false, faixa: cores[4] });
    balde.rotation.z = -Math.PI / 2 + 0.15;
    balde.position.set(-0.2, 0.2, 0);
    g.add(balde);
    const monte = new THREE.SphereGeometry(0.28, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    areias.push([monte, pose(0.28, 0, 0, 0, 0, 0, [1.1, 0.35, 0.9]), 0xf0d3a0]);
    // O "bolo" que saiu do balde: uma torrinha com os sulcos dele.
    areias.push([torreDeBalde(0.2, 0.34, 12), pose(0.15, 0, 0.6), 0xecc996]);
    areias.push(...ameias(0.16, 0.34, 5, 0xecc996).map(([geo, m, c]) => [geo, pose(0.15, 0, 0.6).multiply(m), c]));
    plasticos.push(...naPose(pazinha(corPa), deitado(0.55, -0.35, Math.random() * Math.PI * 2)));
  }

  // O que mais ficou no chão: um ou dois, sorteados.
  const extras = ['rastelo', 'estrela', 'pa'].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
  const lugares = [[-0.6, 0.45], [0.65, 0.1], [-0.15, -0.65]].sort(() => Math.random() - 0.5);
  extras.forEach((extra, i) => {
    const [x, z] = lugares[i];
    const giro = Math.random() * Math.PI * 2;
    if (extra === 'rastelo') plasticos.push(...naPose(rastelinho(corRastelo), deitado(x, z, giro, 0.03)));
    if (extra === 'pa' && !tombado) plasticos.push(...naPose(pazinha(cores[5]), deitado(x, z, giro)));
    if (extra === 'estrela') {
      // A forminha (só a borda: é oca, como a de verdade) e, do lado, a
      // estrela de areia que ela fez.
      const contorno = formaEstrela(0.14);
      contorno.holes.push(formaEstrela(0.11));
      const forma = new THREE.ExtrudeGeometry(contorno, { depth: 0.07, bevelEnabled: false });
      forma.rotateX(-Math.PI / 2);
      plasticos.push([forma, pose(x, 0, z, 0, giro, 0), corForma]);
      const feita = new THREE.ExtrudeGeometry(formaEstrela(0.13), { depth: 0.07, bevelEnabled: false });
      feita.rotateX(-Math.PI / 2);
      areias.push([feita, pose(x + 0.28, 0, z + 0.05, 0, giro + 0.5, 0), 0xecc996]);
    }
  });

  if (plasticos.length) {
    const m = new THREE.Mesh(juntarColorido(plasticos), tintaDaMalha({ flatShading: false }));
    m.castShadow = true;
    g.add(m);
  }
  if (areias.length) {
    const m = new THREE.Mesh(granular(juntarColorido(areias), 0.012, { molhado: 0.06 }), tintaDaMalha());
    m.castShadow = true;
    g.add(m);
  }
  // Brinquedo de criança é pequeno; sem crescer um pouco, some na pista.
  g.scale.setScalar(1.35);
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
      color: 0x9ad2ff, flatShading: true, transparent: true, opacity: 0.4,
      emissive: 0x9ad2ff, emissiveIntensity: 0.35, depthWrite: false,
    })
  );
  cupula.position.y = 1.72;
  g.add(cupula);

  // Quem pilota: um alienzinho verde de olhos grandes e uma antena,
  // espiando por cima da borda.
  const alien = new THREE.Group();
  alien.position.y = 1.87;
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0x8ce99a));
  cabeca.scale.set(1, 0.9, 0.95);
  alien.add(cabeca);
  const olhos = [];
  for (const lado of [-1, 1]) {
    olhos.push([new THREE.SphereGeometry(0.05, 8, 6), new THREE.Matrix4().compose(
      new THREE.Vector3(lado * 0.06, 0.02, 0.12), new THREE.Quaternion(), new THREE.Vector3(0.8, 1.2, 0.5))]);
  }
  alien.add(new THREE.Mesh(juntar(olhos), mat(0x1e1a2e)));
  const antena = juntar([
    [new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), naPosicao(0, 0.18, 0)],
    [new THREE.SphereGeometry(0.03, 6, 5), naPosicao(0, 0.25, 0)],
  ]);
  alien.add(new THREE.Mesh(antena, mat(0x8ce99a)));
  g.add(alien);

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

// Tenda de circo: parede e cobertura listradas, a sainha de bicos na beira
// do telhado, a porta aberta com as cortinas presas dos lados e a
// bandeirinha no mastro. A de antes tinha a parede lisa e sem porta, e de
// longe era um cone listrado em cima de um balde.
function circusTent() {
  const g = new THREE.Group();
  const par = pick(LISTRAS);
  const listra = (n) => (u) => Math.floor(u * n) % 2 === 0;

  const parede = new THREE.Mesh(
    pintarDuasCores(new THREE.CylinderGeometry(1.05, 1.15, 1, 24, 1, true), listra(12), par[0], par[1]),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  parede.position.y = 0.5;
  parede.castShadow = true;
  g.add(parede);

  const cobertura = new THREE.Mesh(
    pintarDuasCores(new THREE.ConeGeometry(1.25, 1.15, 24, 1, true), listra(12), par[0], par[1]),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  cobertura.position.y = 1.55;
  cobertura.castShadow = true;
  g.add(cobertura);

  // A sainha: um bico por gomo, pendurado na beira do telhado.
  const bico = new THREE.Shape();
  bico.moveTo(-0.17, 0);
  bico.lineTo(0.17, 0);
  bico.lineTo(0, -0.2);
  bico.lineTo(-0.17, 0);
  const bicoGeo = new THREE.ShapeGeometry(bico);
  const bicos = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    bicos.push([bicoGeo, new THREE.Matrix4().compose(
      new THREE.Vector3(Math.sin(a) * 1.25, 1.0, Math.cos(a) * 1.25),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)),
      new THREE.Vector3(1, 1, 1)
    )]);
  }
  g.add(new THREE.Mesh(juntar(bicos), mat(0xffd166, { side: THREE.DoubleSide })));

  // A porta: o vão escuro em arco, na frente (+Z), e as duas cortinas
  // presas para os lados.
  const vao = new THREE.Shape();
  vao.moveTo(-0.24, 0);
  vao.lineTo(-0.24, 0.45);
  vao.quadraticCurveTo(0, 0.78, 0.24, 0.45);
  vao.lineTo(0.24, 0);
  vao.lineTo(-0.24, 0);
  const porta = new THREE.Mesh(new THREE.ShapeGeometry(vao, 8), mat(0x5a2a4a));
  porta.position.set(0, 0, 1.155);
  porta.rotation.x = -0.1;                  // acompanha a parede, que afina para cima
  g.add(porta);
  for (const lado of [-1, 1]) {
    const cortina = new THREE.Shape();
    cortina.moveTo(0, 0.7);
    cortina.lineTo(lado * 0.3, 0.7);
    cortina.lineTo(lado * 0.3, 0);
    cortina.lineTo(lado * 0.2, 0);
    cortina.quadraticCurveTo(lado * 0.2, 0.35, 0, 0.7);
    const pano = new THREE.Mesh(new THREE.ShapeGeometry(cortina, 6), mat(par[0], { side: THREE.DoubleSide }));
    pano.position.set(lado * 0.02, 0, 1.165);
    pano.rotation.x = -0.1;
    g.add(pano);
  }

  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 5), mat(0xd9a86b));
  mastro.position.y = 2.3;
  g.add(mastro);
  const flamula = new THREE.Shape();
  flamula.moveTo(0, 0);
  flamula.lineTo(0.38, -0.08);
  flamula.lineTo(0, -0.2);
  flamula.lineTo(0, 0);
  const bandeira = new THREE.Mesh(new THREE.ShapeGeometry(flamula), mat(par[0] === 0xffd166 ? 0xff4d5e : 0xffd166, { side: THREE.DoubleSide }));
  bandeira.position.set(0.03, 2.56, 0);
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

  // A base: de cada lado da roda, um "A" de duas pernas que sobem do chão
  // e se encontram no eixo, com uma travessa e um X de reforço; embaixo, a
  // plataforma de embarque com os degraus na frente. As pernas de antes
  // estavam inclinadas ao contrário — abriam em cima, num "V" que não
  // segurava a roda — e quase encostavam nos aros.
  const PE = 1.3;                           // meia abertura do A no chão
  const LADO_Z = 0.66;                      // afastado dos aros (em ±0,42)
  const estrutura = [];
  const viga = (de, ate, raio) => {
    const dir = ate.clone().sub(de);
    const geo = new THREE.CylinderGeometry(raio * 0.8, raio, dir.length(), 6);
    return [geo, apontar(de.clone().add(ate).multiplyScalar(0.5), dir)];
  };
  for (const z of [-LADO_Z, LADO_Z]) {
    const topo = new THREE.Vector3(0, EIXO, z);
    const esq = new THREE.Vector3(-PE, 0, z), dir = new THREE.Vector3(PE, 0, z);
    estrutura.push(viga(esq, topo, 0.1), viga(dir, topo, 0.1));
    // Travessa e o X de reforço entre as pernas.
    const em = (t) => [esq.clone().lerp(topo, t), dir.clone().lerp(topo, t)];
    const [e1, d1] = em(0.15), [e2, d2] = em(0.52);
    estrutura.push(viga(e2, d2, 0.05), viga(e1, d2, 0.035), viga(d1, e2, 0.035));
    // A chapa redonda onde as pernas se encontram, segurando o eixo.
    const chapa = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10);
    chapa.rotateX(Math.PI / 2);
    estrutura.push([chapa, naPosicao(0, EIXO, z)]);
  }
  const base = new THREE.Mesh(juntar(estrutura), mat(0xb9c2d6));
  base.castShadow = true;
  g.add(base);

  // Plataforma de embarque: o piso listrado sob a roda e os degraus na
  // frente (+Z), por onde se sobe na cabine.
  const plataforma = new THREE.Mesh(
    pintarDuasCores(new THREE.CylinderGeometry(1.05, 1.15, 0.26, 24, 1, true), (u) => Math.floor(u * 12) % 2 === 0, cor, clara),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  plataforma.position.y = 0.13;
  plataforma.scale.z = 0.8;
  g.add(plataforma);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24), mat(0xfff0d6));
  piso.rotation.x = -Math.PI / 2;
  piso.scale.y = 0.8;
  piso.position.y = 0.26;
  g.add(piso);
  const degraus = juntar([
    [new THREE.BoxGeometry(0.6, 0.17, 0.2), naPosicao(0, 0.085, 0.95)],
    [new THREE.BoxGeometry(0.6, 0.09, 0.2), naPosicao(0, 0.045, 1.13)],
  ]);
  g.add(new THREE.Mesh(degraus, mat(0xfff0d6)));

  // Eixo central, de um "A" ao outro.
  const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, LADO_Z * 2 + 0.12, 8), mat(0xe8ecf5));
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

// O cavalinho de carrossel, montado uma vez só: corpo, pescoço, cabeça
// com orelha, as pernas da frente dobradas no ar (empinado) e as de trás
// esticadas, e o rabo. A sela é à parte, para levar a cor do toldo. O
// focinho aponta para +X.
const CAVALINHO = (() => {
  const em = (geo, x, y, z, rz = 0) => [geo, new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new THREE.Vector3(1, 1, 1))];
  const perna = new THREE.CylinderGeometry(0.026, 0.02, 0.22, 5);
  const corpo = juntar([
    em(new THREE.CapsuleGeometry(0.09, 0.2, 3, 8), 0, 0, 0, Math.PI / 2),
    em(new THREE.CylinderGeometry(0.05, 0.075, 0.22, 6), 0.15, 0.12, 0, -0.55),
    em(new THREE.CapsuleGeometry(0.055, 0.09, 2, 6), 0.25, 0.22, 0, -1.25),
    em(new THREE.ConeGeometry(0.025, 0.07, 4), 0.2, 0.3, 0, -0.2),
    em(perna, 0.17, -0.06, 0.05, 1.1), em(perna, 0.15, -0.1, -0.05, 0.8),
    em(perna, -0.14, -0.15, 0.05, -0.35), em(perna, -0.12, -0.15, -0.05, -0.2),
    em(new THREE.ConeGeometry(0.04, 0.2, 5), -0.24, -0.02, 0, 2.3),
  ]);
  const sela = new THREE.CylinderGeometry(0.1, 0.1, 0.14, 8, 1, true, -Math.PI / 2, Math.PI);
  sela.rotateX(Math.PI / 2);
  sela.translate(0, 0.005, 0);
  return { corpo, sela };
})();

// Carrossel: o outro brinquedo que todo parque tem. Um toldo listrado com
// bandeirinhas, e cavalinhos em barras douradas que sobem e descem.
function carousel() {
  const g = new THREE.Group();
  const corA = pick([0xff4d5e, 0x7a4ec7, 0x2f8fd6]);
  const RAIO = 1.15;
  const ALTURA = 1.5;

  // A base: a saia listrada em volta e o piso por cima.
  const saia = new THREE.Mesh(
    pintarDuasCores(new THREE.CylinderGeometry(RAIO + 0.12, RAIO + 0.2, 0.22, 32, 1, true),
      (u) => Math.floor(u * 20) % 2 === 0, corA, 0xfff6fb),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  saia.position.y = 0.11;
  saia.castShadow = true;
  g.add(saia);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(RAIO + 0.12, 32), mat(0xfff0d6));
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = 0.22;
  g.add(piso);

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

  // Os cavalinhos: barra dourada e um cavalinho de carrossel empinado
  // (ver CAVALINHO), virados no sentido em que o carrossel gira, em alturas
  // diferentes. Antes eram dois bloquinhos.
  const barras = [];
  const cores = [mat(0xffffff), mat(0xffd9ec)];
  const sela = mat(corA);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * RAIO * 0.75;
    const z = Math.sin(a) * RAIO * 0.75;
    barras.push([new THREE.CylinderGeometry(0.025, 0.025, ALTURA, 5), naPosicao(x, ALTURA / 2 + 0.2, z)]);

    const cavalo = new THREE.Group();
    cavalo.position.set(x, 0.72 + Math.sin(i * 1.7) * 0.15, z);
    cavalo.rotation.y = -a - Math.PI / 2;   // de lado para o centro, andando em roda
    const corpo = new THREE.Mesh(CAVALINHO.corpo, cores[i % 2]);
    corpo.castShadow = true;
    cavalo.add(corpo, new THREE.Mesh(CAVALINHO.sela, sela));
    g.add(cavalo);
  }
  g.add(new THREE.Mesh(juntar(barras), mat(0xffd166)));

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


// Buquê de balões do Parque: cinco balões de cores diferentes, em alturas
// diferentes, com as fitas descendo em curva até um presentinho no chão que
// segura tudo. O `balloon` (um balão só, com cestinho) continua no Céu,
// onde ele é balão de ar quente.
const BALAO = (() => {
  const perfil = [
    [0.03, -0.4], [0.1, -0.36], [0.22, -0.26], [0.3, -0.1], [0.32, 0.04],
    [0.3, 0.18], [0.23, 0.3], [0.12, 0.37], [0, 0.39],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const corpo = new THREE.LatheGeometry(perfil, 14);
  const no = new THREE.ConeGeometry(0.05, 0.07, 6);
  no.translate(0, -0.43, 0);
  return juntar([[corpo, new THREE.Matrix4()], [no, new THREE.Matrix4()]]);
})();

function balloonStand() {
  const g = new THREE.Group();
  const cores = [0xff5d8f, 0xffd166, 0x4cc9f0, 0x8ce99a, 0xc77dff, 0xff9f1c].sort(() => Math.random() - 0.5);
  const AMARRA = new THREE.Vector3(0, 0.42, 0);
  const baloes = [];
  const fitas = [];
  const N = 5;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.random() * 0.4;
    const abre = i === 0 ? 0 : 0.42 + Math.random() * 0.12;
    const alto = i === 0 ? 3.15 : 2.5 + Math.random() * 0.45;
    const p = new THREE.Vector3(Math.cos(a) * abre, alto, Math.sin(a) * abre);
    // O balão inclina para fora, como se as fitas o puxassem para o centro.
    const inclina = new THREE.Quaternion().setFromUnitVectors(CIMA, new THREE.Vector3(p.x * 0.5, 1, p.z * 0.5).normalize());
    baloes.push([BALAO, new THREE.Matrix4().compose(p, inclina, new THREE.Vector3(1, 1.05, 1)), cores[i]]);
    const ponta = p.clone().add(new THREE.Vector3(0, -0.47, 0).applyQuaternion(inclina));
    const meio = ponta.clone().lerp(AMARRA, 0.5).add(new THREE.Vector3(Math.cos(a + 1.3) * 0.12, 0, Math.sin(a + 1.3) * 0.12));
    fitas.push([new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(ponta, meio, AMARRA), 10, 0.012, 3), new THREE.Matrix4()]);
  }
  const corpo = new THREE.Mesh(juntarColorido(baloes), tintaDaMalha());
  corpo.castShadow = true;
  g.add(corpo);
  g.add(new THREE.Mesh(juntar(fitas), mat(0xffffff)));

  // O presentinho que segura o buquê: caixa com a fita em cruz e o laço.
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 0.4), mat(pick([0xff5d8f, 0x4cc9f0, 0xc77dff])));
  caixa.position.y = 0.17;
  caixa.castShadow = true;
  g.add(caixa);
  const fita = juntar([
    [new THREE.BoxGeometry(0.42, 0.35, 0.08), naPosicao(0, 0.17, 0)],
    [new THREE.BoxGeometry(0.08, 0.35, 0.42), naPosicao(0, 0.17, 0)],
    [new THREE.TorusGeometry(0.07, 0.025, 4, 8), new THREE.Matrix4().compose(new THREE.Vector3(-0.06, 0.38, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.5)), new THREE.Vector3(1, 1, 1))],
    [new THREE.TorusGeometry(0.07, 0.025, 4, 8), new THREE.Matrix4().compose(new THREE.Vector3(0.06, 0.38, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.5)), new THREE.Vector3(1, 1, 1))],
  ]);
  g.add(new THREE.Mesh(fita, mat(0xffd166)));
  return g;
}

// Algodão-doce: a nuvem fofa, de duas cores em redemoinho, saindo de um
// cone de papel listrado no palito. A nuvem é uma bola com calombos
// redondos colados por toda a volta — calombo é o que faz "fofo"; as
// quatro pedras facetadas de antes liam como árvore de folhagem cinza.
function cottonCandy() {
  const g = new THREE.Group();
  const [corA, corB] = pick([
    [0xff9ecb, 0xffc9e3], [0x8fdcff, 0xc9f0ff], [0xff9ecb, 0x9fe0ff], [0xd3b0ff, 0xffc4e1],
  ]);

  const palito = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.25, 6), mat(0xfff6ec));
  palito.position.y = 0.62;
  g.add(palito);

  const papel = new THREE.Mesh(
    pintarDuasCores(new THREE.ConeGeometry(0.2, 0.5, 16, 1, true), (u) => Math.floor(u * 8) % 2 === 0, 0xffffff, corA),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  papel.rotation.x = Math.PI;               // a ponta para baixo, no palito
  papel.position.y = 1.2;
  g.add(papel);

  const CENTRO = new THREE.Vector3(0, 2.08, 0);
  const pecas = [];
  const miolo = new THREE.IcosahedronGeometry(0.52, 1);
  pecas.push([miolo, new THREE.Matrix4().compose(CENTRO, new THREE.Quaternion(), new THREE.Vector3(1, 1.12, 1)), corA]);
  const calombo = new THREE.IcosahedronGeometry(1, 1);
  const N = 30;
  for (let i = 0; i < N; i++) {
    // Espiral dourada: os calombos se espalham por igual na bola.
    const y = 1 - (i + 0.5) / N * 2;
    if (y < -0.65) continue;                // embaixo fica o cone
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const ponto = CENTRO.clone().add(new THREE.Vector3(dir.x * 0.46, dir.y * 0.52, dir.z * 0.46));
    const tam = 0.24 + Math.random() * 0.07;
    // O redemoinho: a cor gira em volta conforme sobe.
    const cor = Math.sin(a + y * 3.5) > 0 ? corA : corB;
    pecas.push([calombo, new THREE.Matrix4().compose(ponto, new THREE.Quaternion(), new THREE.Vector3(tam, tam, tam)), cor]);
  }
  const nuvem = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha());
  nuvem.castShadow = true;
  g.add(nuvem);
  return g;
}

// Obstáculo do Parque: a caixa de pipoca listrada, tombada na pista.
// Obstáculo do Parque: o balde de pipoca listrado, que abre para cima, com
// o monte de pipoca transbordando e umas caídas no chão. Cada pipoca é um
// cachinho de três ou quatro bolinhas — o "estourado" do milho — e todas
// saem numa malha só. As de antes eram cinco pedras grandes.
const PIPOCA = (() => {
  const bolinha = new THREE.IcosahedronGeometry(1, 0);
  const pecas = [];
  for (const [x, y, z, r] of [[0, 0, 0, 0.075], [0.06, 0.03, 0.02, 0.06], [-0.04, 0.05, -0.04, 0.058], [0.01, -0.04, 0.06, 0.05]]) {
    pecas.push([bolinha, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(r, r, r))]);
  }
  return juntar(pecas);
})();

function popcornBox() {
  const g = new THREE.Group();
  const par = pick(LISTRAS);
  const ALTO = 0.82, TOPO = 0.44, FUNDO = 0.34;

  // O balde: um cilindro de muitos gomos achatado num quadrado (cada ponto
  // empurrado até a borda do quadrado) — com gomos de sobra, a listra
  // vertical cabe em cada face.
  const balde = new THREE.CylinderGeometry(TOPO, FUNDO, ALTO, 48, 1, true, Math.PI / 4);
  const pos = balde.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const quadrado = 1 / Math.max(Math.abs(x), Math.abs(z)) * Math.hypot(x, z) / Math.SQRT2 * Math.SQRT2;
    pos.setXYZ(i, x * quadrado / Math.SQRT2, pos.getY(i), z * quadrado / Math.SQRT2);
  }
  balde.computeVertexNormals();
  const caixa = new THREE.Mesh(
    pintarDuasCores(balde, (u) => Math.floor(u * 16) % 2 === 0, par[0], par[1]),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  caixa.position.y = ALTO / 2;
  caixa.castShadow = true;
  g.add(caixa);

  const pipocas = [];
  const amarela = 0xffe7a0, creme = 0xfff6e0;
  const lado = TOPO / Math.SQRT2 * 0.92;
  for (let i = 0; i < 46; i++) {
    const x = (Math.random() * 2 - 1) * lado;
    const z = (Math.random() * 2 - 1) * lado;
    const d = Math.max(Math.abs(x), Math.abs(z)) / lado;
    const y = ALTO + 0.02 + (1 - d * d) * 0.28 * (0.6 + Math.random() * 0.4);
    const giro = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    pipocas.push([PIPOCA, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), giro, new THREE.Vector3(1, 1, 1)), Math.random() < 0.2 ? amarela : creme]);
  }
  // Umas que caíram no chão.
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.45 + Math.random() * 0.25;
    const giro = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, 0));
    pipocas.push([PIPOCA, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * r, 0.06, Math.sin(a) * r), giro, new THREE.Vector3(1, 1, 1)), creme]);
  }
  const monte = new THREE.Mesh(juntarColorido(pipocas), tintaDaMalha());
  monte.castShadow = true;
  g.add(monte);
  return g;
}

// --- Tempestade -------------------------------------------------------------

// Moinho de vento: torre de pedra caiada que afina para cima, com porta e
// janelinha, o chapéu de madeira e as quatro pás de verdade — cada uma uma
// grade de ripas com a lona esticada de um lado. As pás giram (o World
// roda `userData.helice`). As de antes eram quatro varetas paradas.
const PA_DE_MOINHO = (() => {
  const ripas = [], lona = [];
  const COMP = 1.45, LARG = 0.38;
  ripas.push([new THREE.BoxGeometry(0.06, COMP, 0.05), naPosicao(0, COMP / 2 + 0.1, 0)]);
  for (let k = 0; k <= 5; k++) {
    ripas.push([new THREE.BoxGeometry(LARG, 0.025, 0.03), naPosicao(LARG / 2, 0.35 + k * 0.23, 0.01)]);
  }
  ripas.push([new THREE.BoxGeometry(0.025, COMP - 0.25, 0.03), naPosicao(LARG, COMP / 2 + 0.22, 0.01)]);
  lona.push([new THREE.PlaneGeometry(LARG - 0.04, COMP - 0.3), naPosicao(LARG / 2, COMP / 2 + 0.22, -0.005)]);
  return { ripas: juntar(ripas), lona: juntar(lona) };
})();

function windmill() {
  const g = new THREE.Group();
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.6, 2.5, 10), mat(0xe8e2d4));
  torre.position.y = 1.25;
  torre.castShadow = true;
  g.add(torre);
  const chapeu = new THREE.Mesh(juntar([
    [new THREE.CylinderGeometry(0.44, 0.44, 0.08, 10), naPosicao(0, 2.54, 0)],
    [new THREE.ConeGeometry(0.46, 0.62, 10), naPosicao(0, 2.89, 0)],
  ]), mat(0x7a5c4a));
  chapeu.castShadow = true;
  g.add(chapeu);

  // Porta e janelinha, na frente (+Z), coladas na parede inclinada.
  const inclina = Math.atan2(0.6 - 0.36, 2.5);
  const naParede = (y, raioNaAltura) => new THREE.Matrix4().compose(
    new THREE.Vector3(0, y, raioNaAltura + 0.005),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-inclina, 0, 0)), new THREE.Vector3(1, 1, 1));
  const raioEm = (y) => 0.6 - (0.6 - 0.36) * (y / 2.5);
  const porta = new THREE.Shape();
  porta.moveTo(-0.15, 0);
  porta.lineTo(-0.15, 0.3);
  porta.absarc(0, 0.3, 0.15, Math.PI, 0, true);
  porta.lineTo(0.15, 0);
  porta.lineTo(-0.15, 0);
  g.add(new THREE.Mesh(juntar([
    [new THREE.ShapeGeometry(porta, 6), naParede(0, raioEm(0.25))],
    [new THREE.PlaneGeometry(0.16, 0.2), naParede(1.55, raioEm(1.55))],
  ]), mat(0x5a4636)));

  // O eixo saindo do chapéu para a frente, e as pás nele.
  const helice = new THREE.Group();
  helice.position.set(0, 2.55, 0.5);
  helice.userData.fase = Math.random() * Math.PI * 2;
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), mat(0x5a4636));
  cubo.rotation.x = Math.PI / 2;
  helice.add(cubo);
  const madeira = mat(0x8a6a4a);
  const pano = mat(0xfff6ec, { side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const braco = new THREE.Group();
    braco.rotation.z = (i / 4) * Math.PI * 2;
    braco.add(new THREE.Mesh(PA_DE_MOINHO.ripas, madeira), new THREE.Mesh(PA_DE_MOINHO.lona, pano));
    helice.add(braco);
  }
  g.add(helice);
  g.userData.helice = helice;
  return g;
}

// O raio em zigue-zague, de pé, com a ponta para baixo: uma forma só,
// recortada e com espessura, que serve para o para-raios e para a nuvem
// carregada.
const RAIO_ZIGUEZAGUE = (() => {
  const f = new THREE.Shape();
  f.moveTo(0.05, 0.5);
  f.lineTo(0.2, 0.5);
  f.lineTo(0.06, 0.12);
  f.lineTo(0.16, 0.12);
  f.lineTo(-0.1, -0.5);
  f.lineTo(-0.01, -0.06);
  f.lineTo(-0.11, -0.06);
  f.lineTo(0.05, 0.5);
  const geo = new THREE.ExtrudeGeometry(f, { depth: 0.05, bevelEnabled: false });
  geo.translate(-0.05, 0, -0.025);
  return geo;
})();

// Para-raios: o mastro de metal fincado num bloco de pedra e preso por
// três cabos, a bobina de cobre enrolada embaixo da esfera de vidro, que
// brilha, e a ponta afiada lá em cima com dois raiozinhos estalando. O de
// antes era um poste com uma bolinha, igual a um poste de luz.
function lightningRod() {
  const g = new THREE.Group();
  const ALTO = 3.2;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.5), mat(0x7a7f8c));
  base.position.y = 0.11;
  base.castShadow = true;
  g.add(base);

  const metal = [[new THREE.CylinderGeometry(0.045, 0.08, ALTO, 6), naPosicao(0, ALTO / 2, 0)]];
  // Os três cabos, do alto do mastro até o chão.
  const preso = new THREE.Vector3(0, ALTO * 0.6, 0);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    const chao = new THREE.Vector3(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0);
    const dir = preso.clone().sub(chao);
    metal.push([new THREE.CylinderGeometry(0.012, 0.012, dir.length(), 3), apontar(chao.clone().add(preso).multiplyScalar(0.5), dir)]);
  }
  metal.push([new THREE.ConeGeometry(0.06, 0.45, 6), naPosicao(0, ALTO + 0.42, 0)]);
  const mastro = new THREE.Mesh(juntar(metal), mat(0x8a94ad));
  mastro.castShadow = true;
  g.add(mastro);

  // A bobina: um fio de cobre em espiral em volta do mastro.
  const voltas = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60;
    const a = t * Math.PI * 2 * 7;
    voltas.push(new THREE.Vector3(Math.cos(a) * 0.12, ALTO - 0.75 + t * 0.5, Math.sin(a) * 0.12));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(voltas), 120, 0.018, 4), mat(0xd9884a)));

  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 12, 8),
    mat(0xfff08a, { emissive: 0xfff08a, emissiveIntensity: 1 })
  );
  bola.position.y = ALTO + 0.05;
  g.add(bola);

  // Dois raiozinhos estalando dos lados da esfera.
  const estalos = [];
  for (const lado of [-1, 1]) {
    estalos.push([RAIO_ZIGUEZAGUE, new THREE.Matrix4().compose(
      new THREE.Vector3(lado * 0.3, ALTO + 0.1, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, lado * 0.6)),
      new THREE.Vector3(0.5, 0.5, 0.5))]);
  }
  g.add(new THREE.Mesh(juntar(estalos), mat(0xfff08a, { emissive: 0xffe066, emissiveIntensity: 1, side: THREE.DoubleSide })));
  return g;
}

// Poça: um contorno torto (poça de verdade não é redonda), o reflexo claro
// e dois anéis de pingo de chuva. Tudo transparente e rente ao chão.
function puddle() {
  const g = new THREE.Group();
  const raio = 0.8 + Math.random() * 0.7;
  const contorno = new THREE.Shape();
  const N = 28;
  const fase = Math.random() * 6;
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * Math.PI * 2;
    const r = raio * (0.85 + 0.1 * Math.sin(a * 2 + fase) + 0.06 * Math.sin(a * 3 + fase * 2));
    const x = Math.cos(a) * r * 1.2, y = Math.sin(a) * r * 0.85;
    if (k === 0) contorno.moveTo(x, y); else contorno.lineTo(x, y);
  }
  const agua = new THREE.Mesh(
    new THREE.ShapeGeometry(contorno),
    new THREE.MeshBasicMaterial({ color: 0x6b83a8, transparent: true, opacity: 0.6, depthWrite: false })
  );
  agua.rotation.x = -Math.PI / 2;
  agua.position.y = 0.03;
  g.add(agua);
  const brilho = new THREE.Mesh(
    new THREE.CircleGeometry(raio * 0.35, 10),
    new THREE.MeshBasicMaterial({ color: 0xd6e4ff, transparent: true, opacity: 0.35, depthWrite: false })
  );
  brilho.rotation.x = -Math.PI / 2;
  brilho.scale.set(1.5, 0.6, 1);
  brilho.position.set(raio * 0.2, 0.04, -raio * 0.15);
  g.add(brilho);
  const aneis = juntar([0, 1].map((k) => {
    const r = raio * (0.18 + k * 0.12);
    return [new THREE.RingGeometry(r, r + 0.035, 20).rotateX(-Math.PI / 2), naPosicao(-raio * 0.3 + k * raio * 0.5, 0.05, raio * 0.1 - k * 0.1)];
  }));
  g.add(new THREE.Mesh(aneis, new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.55, depthWrite: false })));
  return g;
}

// Barril: barrigudo no meio, de aduelas em dois tons de madeira, com a
// tampa e três aros de ferro. O de antes era um cilindro torto (inclinado
// de lado), sem tampa, e lia como um balde amassado.
const BARRIL = (() => {
  const ALTO = 0.9, R = 0.34, BOJO = 0.07;
  const raio = (y) => R + BOJO * Math.sin(Math.PI * (y / ALTO));
  const perfil = [];
  for (let k = 0; k <= 8; k++) {
    const y = (k / 8) * ALTO;
    perfil.push(new THREE.Vector2(raio(y), y));
  }
  const ADUELAS = 14;
  const corpo = pintarDuasCores(new THREE.LatheGeometry(perfil, ADUELAS * 2), (u) => Math.floor(u * ADUELAS) % 2 === 0, 0x9a6a44, 0x86593a);
  const tampa = new THREE.CircleGeometry(R - 0.02, ADUELAS * 2).rotateX(-Math.PI / 2).translate(0, ALTO - 0.03, 0);
  const aros = juntar([0.12, ALTO / 2, ALTO - 0.12].map((y) => [
    new THREE.TorusGeometry(raio(y) + 0.008, 0.028, 4, ADUELAS * 2),
    new THREE.Matrix4().compose(new THREE.Vector3(0, y, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1)),
  ]));
  return { corpo, tampa, aros };
})();

function barrel() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(BARRIL.corpo, tintaDaMalha({ side: THREE.DoubleSide }));
  corpo.castShadow = true;
  g.add(corpo);
  g.add(new THREE.Mesh(BARRIL.tampa, mat(0x7a5034)));
  g.add(new THREE.Mesh(BARRIL.aros, mat(0x5c6270)));
  g.rotation.y = Math.random() * Math.PI;
  return g;
}

// --- Bruma ------------------------------------------------------------------

// Árvore seca: o tronco torto que afina para cima e os galhos em curva,
// subindo e se abrindo em forquilhas, sem folha nenhuma — a silhueta de
// árvore de história de assombração. Tronco e galhos são uma malha só. A
// de antes era um poste com cinco paus retos espetados.
function ghostTree() {
  const g = new THREE.Group();
  const pecas = [];
  // O tronco: um tubo em curva suave, mais grosso na base.
  const lado = Math.random() < 0.5 ? -1 : 1;
  const tronco = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(lado * 0.12, 0.8, 0.05),
    new THREE.Vector3(-lado * 0.08, 1.6, 0), new THREE.Vector3(lado * 0.05, 2.3, -0.05),
  ]);
  const troncoGeo = new THREE.TubeGeometry(tronco, 12, 0.2, 6);
  const pos = troncoGeo.attributes.position;
  // Afina para cima: cada anel do tubo encolhe em volta da curva.
  for (let i = 0; i < pos.count; i++) {
    const anel = Math.floor(i / 7) / 12;
    const centro = tronco.getPoint(anel);
    const k = 1 - anel * 0.6;
    pos.setXYZ(i, centro.x + (pos.getX(i) - centro.x) * k, pos.getY(i), centro.z + (pos.getZ(i) - centro.z) * k);
  }
  troncoGeo.computeVertexNormals();
  pecas.push([troncoGeo, new THREE.Matrix4()]);

  // Um galho: sai de um ponto do tronco, sobe em arco e, no fim, abre
  // numa forquilha de dois gravetos.
  const galho = (de, a, comp, grosso, nivel) => {
    const dir = new THREE.Vector3(Math.cos(a), 0.9, Math.sin(a)).normalize();
    const fim = de.clone().addScaledVector(dir, comp).add(new THREE.Vector3(0, -comp * 0.15, 0));
    const meio = de.clone().addScaledVector(dir, comp * 0.5).add(new THREE.Vector3(0, comp * 0.15, 0));
    pecas.push([new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(de, meio, fim), 6, grosso, 5), new THREE.Matrix4()]);
    if (nivel > 0) {
      galho(fim, a + 0.6, comp * 0.55, grosso * 0.6, nivel - 1);
      galho(fim, a - 0.6, comp * 0.5, grosso * 0.6, nivel - 1);
    }
  };
  const N = 4;
  for (let k = 0; k < N; k++) {
    const t = 0.5 + k * 0.13;
    galho(tronco.getPoint(t), (k / N) * Math.PI * 2 + Math.random() * 0.6, 1.05 - k * 0.12, 0.085 - k * 0.008, 1);
  }
  const arvore = new THREE.Mesh(juntar(pecas), mat(0x8a839a));
  arvore.castShadow = true;
  g.add(arvore);
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

// Pedra com musgo: o musgo é uma capa que cobre a parte de cima da pedra,
// seguindo as faces dela, com uns tufinhos por cima. O de antes eram três
// lasquinhas verdes soltas que quase não apareciam.
function mossRock() {
  const g = new THREE.Group();
  // Pedra irregular: um dodecaedro mais dividido, com cada canto empurrado
  // um tanto para dentro ou para fora (o mesmo canto, nas várias faces que
  // o tocam, anda junto — senão a pedra rachava).
  const pedraGeo = new THREE.DodecahedronGeometry(0.55, 1);
  const empurrao = new Map();
  const pp = pedraGeo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const chave = [pp.getX(i), pp.getY(i), pp.getZ(i)].map((n) => n.toFixed(3)).join();
    if (!empurrao.has(chave)) empurrao.set(chave, 0.86 + Math.random() * 0.26);
    const k = empurrao.get(chave);
    pp.setXYZ(i, pp.getX(i) * k, pp.getY(i) * k, pp.getZ(i) * k);
  }
  pedraGeo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.random(), Math.random(), Math.random())));
  pedraGeo.scale(1.1, 0.78, 1);
  pedraGeo.computeVertexNormals();
  const pedra = new THREE.Mesh(pedraGeo, mat(0x8a8496));
  pedra.position.y = 0.36;
  pedra.castShadow = true;
  g.add(pedra);

  // A capa: as faces viradas para cima, copiadas um tico para fora.
  const pos = pedraGeo.attributes.position;
  const capa = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const limite = 0.62 + Math.random() * 0.15;   // só o topo
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    normal.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    if (normal.y < limite) continue;
    for (const v of [a, b, c]) capa.push(v.x * 1.05, v.y * 1.05 + 0.015, v.z * 1.05);
  }
  const musgoGeo = new THREE.BufferGeometry();
  musgoGeo.setAttribute('position', new THREE.Float32BufferAttribute(capa, 3));
  musgoGeo.computeVertexNormals();
  const tufos = [[musgoGeo, new THREE.Matrix4()]];
  const tufo = new THREE.IcosahedronGeometry(1, 0);
  // Tufinhos espalhados nas faces da capa, saindo dela.
  for (let i = 0; i < capa.length && tufos.length < 9; i += 9 * 3) {
    const t = 0.06 + Math.random() * 0.05;
    const p = new THREE.Vector3(capa[i], capa[i + 1], capa[i + 2]);
    tufos.push([tufo, new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(t, t * 0.6, t))]);
  }
  const musgo = new THREE.Mesh(juntar(tufos), mat(0x6fa04a));
  musgo.position.y = 0.36;
  g.add(musgo);
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

// Telhado de duas águas: duas placas inclinadas que se encontram na
// cumeeira (ao longo de X) e passam um pouco das paredes — o beiral. A
// base do telhado fica em y = 0, a cumeeira em y = `alto`. Junto, a
// empena: o triângulo de parede que fecha os dois lados por baixo.
function telhadoDuasAguas(largura, fundo, alto, { beiral = 0.14, espessura = 0.08 } = {}) {
  const meio = fundo / 2;
  const inclina = Math.atan2(alto, meio);
  const comp = Math.hypot(alto, meio) + beiral;
  const placas = [];
  for (const lado of [-1, 1]) {
    const placa = new THREE.BoxGeometry(largura + beiral * 2, espessura, comp);
    // A placa sai da cumeeira para baixo, deste lado.
    placa.translate(0, espessura / 2, comp / 2);
    placas.push([placa, new THREE.Matrix4().compose(
      new THREE.Vector3(0, alto, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(lado > 0 ? inclina : Math.PI - inclina, 0, 0)),
      new THREE.Vector3(1, lado > 0 ? 1 : -1, 1)
    )]);
  }
  const triangulo = new THREE.Shape();
  triangulo.moveTo(-meio, 0);
  triangulo.lineTo(meio, 0);
  triangulo.lineTo(0, alto);
  triangulo.lineTo(-meio, 0);
  const empena = new THREE.ExtrudeGeometry(triangulo, { depth: largura, bevelEnabled: false });
  empena.rotateY(Math.PI / 2);             // o triângulo vira o plano YZ
  empena.translate(-largura / 2, 0, 0);
  return { telhado: juntar(placas), empena };
}

// Casinha: paredes numa cor clara sorteada, telhado de duas águas com
// beiral, chaminé de tijolo, porta de arco com moldura e degrau, janelas
// com moldura branca, luz acesa e venezianas, e uma floreira embaixo de
// uma delas. A de antes tinha o telhado em pirâmide em cima de uma caixa —
// lia como barraca — e janelas soltas na parede.
function cottage() {
  const g = new THREE.Group();
  const L = 1.5, F = 1.3, PAREDE = 1.1;
  const corParede = pick([0xf6ead2, 0xffe0e6, 0xdff0ff, 0xfff3c4]);
  const corTelhado = pick([0xc2603f, 0xa8503a, 0xd6764f, 0x7a5ca8]);
  const corVeneziana = pick([0x4a9de0, 0x5fae6a, 0xe0566a, 0x8a6a4a]);
  const frente = F / 2;

  const { telhado, empena } = telhadoDuasAguas(L, F, 0.72, { beiral: 0.16 });
  const paredes = new THREE.Mesh(juntar([
    [new THREE.BoxGeometry(L, PAREDE, F), naPosicao(0, PAREDE / 2, 0)],
    [empena, naPosicao(0, PAREDE, 0)],
  ]), mat(corParede));
  paredes.castShadow = true;
  g.add(paredes);
  const teto = new THREE.Mesh(telhado, mat(corTelhado));
  teto.position.y = PAREDE;
  teto.castShadow = true;
  g.add(teto);

  const chamine = new THREE.Mesh(juntar([
    [new THREE.BoxGeometry(0.24, 0.7, 0.24), naPosicao(0.42, PAREDE + 0.6, -0.25)],
    [new THREE.BoxGeometry(0.3, 0.08, 0.3), naPosicao(0.42, PAREDE + 0.97, -0.25)],
  ]), mat(0xb0594a));
  chamine.castShadow = true;
  g.add(chamine);

  // A porta, de arco em cima, com a moldura e o degrau de pedra.
  const arco = (larg, alt) => {
    const f = new THREE.Shape();
    f.moveTo(-larg / 2, 0);
    f.lineTo(-larg / 2, alt - larg / 2);
    f.absarc(0, alt - larg / 2, larg / 2, Math.PI, 0, true);
    f.lineTo(larg / 2, 0);
    f.lineTo(-larg / 2, 0);
    return new THREE.ShapeGeometry(f, 8);
  };
  const branco = [];
  branco.push([arco(0.5, 0.78), naPosicao(0, 0, frente + 0.005)]);
  const porta = new THREE.Mesh(arco(0.38, 0.7), mat(0x8a5c3c));
  porta.position.set(0, 0, frente + 0.012);
  g.add(porta);
  const macaneta = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0xffd166));
  macaneta.position.set(0.12, 0.36, frente + 0.03);
  g.add(macaneta);
  const degrau = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.22), mat(0xb8b0a4));
  degrau.position.set(0, 0.04, frente + 0.1);
  g.add(degrau);

  // As janelas: moldura branca, vidro com luz, venezianas abertas.
  const vidros = [], venezianas = [];
  const janela = (x, y, z, ry) => {
    const m = (dx, dy, dz) => new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z).add(new THREE.Vector3(dx, dy, dz).applyAxisAngle(CIMA, ry)),
      new THREE.Quaternion().setFromAxisAngle(CIMA, ry), new THREE.Vector3(1, 1, 1));
    branco.push([new THREE.BoxGeometry(0.38, 0.38, 0.04), m(0, 0, 0.01)]);
    vidros.push([new THREE.PlaneGeometry(0.28, 0.28), m(0, 0, 0.035)]);
    branco.push([new THREE.BoxGeometry(0.28, 0.03, 0.02), m(0, 0, 0.04)]);
    branco.push([new THREE.BoxGeometry(0.03, 0.28, 0.02), m(0, 0, 0.04)]);
    for (const lado of [-1, 1]) venezianas.push([new THREE.BoxGeometry(0.15, 0.38, 0.03), m(lado * 0.28, 0, 0.02)]);
  };
  janela(-0.47, 0.66, frente, 0);
  janela(0.47, 0.66, frente, 0);
  janela(L / 2, 0.66, 0, Math.PI / 2);
  janela(-L / 2, 0.66, 0, -Math.PI / 2);
  g.add(new THREE.Mesh(juntar(branco), mat(0xffffff)));
  g.add(new THREE.Mesh(juntar(vidros), mat(0xffe9a8, { emissive: 0xffd27a, emissiveIntensity: 0.6 })));
  g.add(new THREE.Mesh(juntar(venezianas), mat(corVeneziana)));

  // A floreira embaixo da janela da esquerda.
  const flores = [[new THREE.BoxGeometry(0.42, 0.1, 0.12), naPosicao(-0.47, 0.42, frente + 0.07), 0x8a5c3c]];
  const flor = new THREE.IcosahedronGeometry(0.045, 0);
  for (let k = 0; k < 5; k++) {
    flores.push([flor, naPosicao(-0.63 + k * 0.08, 0.5 + (k % 2) * 0.02, frente + 0.08), pick([0xff7bac, 0xffd166, 0xff4d5e, 0xffffff])]);
  }
  g.add(new THREE.Mesh(juntarColorido(flores), tintaDaMalha()));
  return g;
}

// Poste de luz: base em degraus, coluna com anel, e a lanterna de vidro
// aceso entre quatro colunetas, com o chapéu e a ponta em cima. O halo
// ficou pequeno — o de antes era um disco amarelo maior que a lanterna, e
// era tudo o que se via do poste.
function lamppost() {
  const g = new THREE.Group();
  const ferro = juntar([
    [new THREE.CylinderGeometry(0.2, 0.24, 0.14, 8), naPosicao(0, 0.07, 0)],
    [new THREE.CylinderGeometry(0.13, 0.17, 0.16, 8), naPosicao(0, 0.22, 0)],
    [new THREE.CylinderGeometry(0.045, 0.07, 1.9, 8), naPosicao(0, 1.25, 0)],
    [new THREE.TorusGeometry(0.07, 0.025, 5, 10), new THREE.Matrix4().compose(new THREE.Vector3(0, 0.75, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1))],
    [new THREE.CylinderGeometry(0.16, 0.08, 0.1, 4), new THREE.Matrix4().compose(new THREE.Vector3(0, 2.23, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), new THREE.Vector3(1, 1, 1))],
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => [new THREE.BoxGeometry(0.025, 0.34, 0.025), naPosicao(x * 0.11, 2.45, z * 0.11)]),
    [new THREE.ConeGeometry(0.22, 0.2, 4), new THREE.Matrix4().compose(new THREE.Vector3(0, 2.72, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), new THREE.Vector3(1, 1, 1))],
    [new THREE.SphereGeometry(0.04, 6, 4), naPosicao(0, 2.85, 0)],
  ]);
  const poste = new THREE.Mesh(ferro, mat(0x3a3a46));
  poste.castShadow = true;
  g.add(poste);

  const vidro = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), mat(0xffe0a0, { emissive: 0xffd27a, emissiveIntensity: 1 }));
  vidro.position.y = 2.45;
  g.add(vidro);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffe0a0, transparent: true, opacity: 0.16, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.position.y = 2.45;
  g.add(halo);
  return g;
}

// Poço: o muro redondo de pedras (cada pedra num cinza um tico
// diferente), a borda de pedra em cima, a água, as duas colunas com o
// sarilho e a manivela, a corda descendo até o balde e o telhadinho de
// duas águas. O de antes era um cilindro liso com dois palitos.
function well() {
  const g = new THREE.Group();
  const R = 0.55, ALTO = 0.6;
  const muro = new THREE.Mesh(
    pintarBlocos(new THREE.CylinderGeometry(R, R * 1.06, ALTO, 24, 4, true), (p) => {
      const fila = Math.floor(((p.y + ALTO / 2) / ALTO) * 4 * 0.999);
      const ang = (Math.atan2(p.z, p.x) / (Math.PI * 2) + 1) % 1;
      return [fila, Math.floor(ang * 8 + (fila % 2) * 0.5)];
    }, [0xa89c8c, 0x948878, 0xbab0a2]),
    tintaDaMalha({ side: THREE.DoubleSide })
  );
  muro.position.y = ALTO / 2;
  muro.castShadow = true;
  g.add(muro);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(R, 0.07, 5, 20), mat(0xc4baac));
  borda.rotation.x = Math.PI / 2;
  borda.position.y = ALTO;
  g.add(borda);
  const agua = new THREE.Mesh(new THREE.CircleGeometry(R * 0.95, 20), mat(0x4a7ba8, { emissive: 0x1a3a5a }));
  agua.rotation.x = -Math.PI / 2;
  agua.position.y = ALTO - 0.15;
  g.add(agua);

  // Madeira: as duas colunas, o sarilho deitado entre elas e a manivela.
  const TOPO = 1.4;
  const madeira = new THREE.Mesh(juntar([
    [new THREE.BoxGeometry(0.1, TOPO - ALTO + 0.1, 0.1), naPosicao(-R, (TOPO + ALTO) / 2 - 0.05, 0)],
    [new THREE.BoxGeometry(0.1, TOPO - ALTO + 0.1, 0.1), naPosicao(R, (TOPO + ALTO) / 2 - 0.05, 0)],
    [new THREE.CylinderGeometry(0.06, 0.06, R * 2, 8), new THREE.Matrix4().compose(new THREE.Vector3(0, 1.05, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(1, 1, 1))],
    [new THREE.BoxGeometry(0.04, 0.2, 0.04), naPosicao(R + 0.08, 0.97, 0)],
    [new THREE.CylinderGeometry(0.025, 0.025, 0.14, 5), new THREE.Matrix4().compose(new THREE.Vector3(R + 0.15, 0.88, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(1, 1, 1))],
  ]), mat(0x8a5c3c));
  madeira.castShadow = true;
  g.add(madeira);

  // A corda e o balde, pendurado acima da água.
  const corda = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 4), mat(0xd9c49a));
  corda.position.set(0, 0.89, 0);
  g.add(corda);
  const balde = new THREE.Mesh(juntar([
    [new THREE.CylinderGeometry(0.1, 0.08, 0.16, 8, 1, true), naPosicao(0, 0.67, 0)],
    [new THREE.CircleGeometry(0.08, 8).rotateX(Math.PI / 2), naPosicao(0, 0.59, 0)],
    [new THREE.TorusGeometry(0.1, 0.012, 4, 10, Math.PI), naPosicao(0, 0.75, 0)],
  ]), mat(0x9a7048, { side: THREE.DoubleSide }));
  g.add(balde);

  const { telhado, empena } = telhadoDuasAguas(R * 2 + 0.1, 0.7, 0.4, { beiral: 0.12, espessura: 0.06 });
  const teto = new THREE.Mesh(telhado, mat(0xc2603f));
  teto.position.y = TOPO;
  teto.castShadow = true;
  g.add(teto);
  const fechamento = new THREE.Mesh(empena, mat(0x8a5c3c));
  fechamento.position.y = TOPO;
  fechamento.scale.set(1, 1, 0.12);           // só a viga do meio, não uma parede
  g.add(fechamento);
  return g;
}

// Caixote de madeira: o miolo de tábuas mais claras e, por cima, a
// moldura de ripas em todas as arestas e uma ripa em diagonal em cada
// face — o desenho do caixote de feira. O de antes era um cubo com uma
// faixa, e lia como caixa de papelão.
const CAIXOTE = (() => {
  const L = 0.8, MEIO = L / 2, R = 0.07;
  const ripas = [];
  // As 12 arestas.
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      ripas.push([new THREE.BoxGeometry(L, R, R), naPosicao(0, MEIO + a * (MEIO - R / 2), b * (MEIO - R / 2))]);
      ripas.push([new THREE.BoxGeometry(R, L, R), naPosicao(a * (MEIO - R / 2), MEIO, b * (MEIO - R / 2))]);
      ripas.push([new THREE.BoxGeometry(R, R, L), naPosicao(a * (MEIO - R / 2), MEIO + b * (MEIO - R / 2), 0)]);
    }
  }
  // Uma diagonal em cada face de lado, um tico para fora.
  const diag = Math.hypot(L - R * 2, L - R * 2);
  for (let k = 0; k < 4; k++) {
    const giro = (k / 4) * Math.PI * 2;
    ripas.push([new THREE.BoxGeometry(diag, R, R * 0.6), new THREE.Matrix4().compose(
      new THREE.Vector3(Math.sin(giro) * (MEIO + R * 0.1), MEIO, Math.cos(giro) * (MEIO + R * 0.1)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, giro, (k % 2 ? 1 : -1) * Math.PI / 4)),
      new THREE.Vector3(1, 1, 1))]);
  }
  return { miolo: new THREE.BoxGeometry(L - 0.02, L - 0.02, L - 0.02).translate(0, MEIO, 0), ripas: juntar(ripas) };
})();

function crate() {
  const g = new THREE.Group();
  const giro = Math.random() * 0.6;
  const miolo = new THREE.Mesh(CAIXOTE.miolo, mat(0xcfa572));
  miolo.rotation.y = giro;
  miolo.castShadow = true;
  g.add(miolo);
  const ripas = new THREE.Mesh(CAIXOTE.ripas, mat(0x9a6c42));
  ripas.rotation.y = giro;
  ripas.castShadow = true;
  g.add(ripas);
  return g;
}

// --- Outono -------------------------------------------------------------

// Árvore de outono: tronco com galhos subindo para a copa, a copa fofa
// misturando vermelho, laranja e dourado, e folhas caídas no pé. A de
// antes era um punhado de blocos facetados de uma cor só, quase a do chão.
function autumnTree() {
  const g = new THREE.Group();

  // Tronco e três galhos subindo para dentro da copa, numa malha só.
  const madeira = [[new THREE.CylinderGeometry(0.15, 0.27, 1.7, 7), naPosicao(0, 0.85, 0)]];
  for (const [a, inclina] of [[0.4, 0.62], [2.5, 0.55], [4.4, 0.7]]) {
    const dir = new THREE.Vector3(Math.cos(a) * Math.sin(inclina), Math.cos(inclina), Math.sin(a) * Math.sin(inclina));
    const galho = new THREE.CylinderGeometry(0.045, 0.08, 0.7, 5);
    madeira.push([galho, apontar(new THREE.Vector3(0, 1.45, 0).addScaledVector(dir, 0.3), dir)]);
  }
  const tronco = new THREE.Mesh(juntar(madeira), mat(0x5e3b26));
  tronco.castShadow = true;
  g.add(tronco);

  // A copa: calombos redondos em volta de uma bola, cada um numa das cores
  // da árvore — a dominante quase sempre, e pitadas das outras duas. É a
  // mistura que faz a árvore "virar": a de antes era de uma cor só, e no
  // chão laranja ela sumia.
  const [principal, segunda, terceira] = pick([
    [0xff8a2a, 0xffc23d, 0xe0452f],
    [0xe0452f, 0xff8a2a, 0xc9302c],
    [0xffc23d, 0xffd95e, 0xff8a2a],
  ]);
  const corDe = () => { const r = Math.random(); return r < 0.6 ? principal : r < 0.85 ? segunda : terceira; };
  const CENTRO = new THREE.Vector3(0, 2.3, 0);
  const pecas = [[new THREE.IcosahedronGeometry(0.75, 1), new THREE.Matrix4().compose(CENTRO, new THREE.Quaternion(), new THREE.Vector3(1, 0.82, 1)), principal]];
  const calombo = new THREE.IcosahedronGeometry(1, 1);
  const N = 18;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + 0.5) / N * 2;
    if (y < -0.7) continue;                 // embaixo, deixa os galhos à vista
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    const ponto = CENTRO.clone().add(new THREE.Vector3(Math.cos(a) * r * 0.72, y * 0.58, Math.sin(a) * r * 0.72));
    const tam = 0.34 + Math.random() * 0.12;
    pecas.push([calombo, new THREE.Matrix4().compose(ponto, new THREE.Quaternion(), new THREE.Vector3(tam, tam * 0.9, tam)), corDe()]);
  }
  const copa = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha());
  copa.castShadow = true;
  g.add(copa);

  // Folhas já caídas em volta do pé.
  const caidas = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.35 + Math.random() * 0.75;
    const ponto = new THREE.Vector3(Math.cos(a) * r, 0.015 + i * 0.002, Math.sin(a) * r);
    const normal = new THREE.Vector3((Math.random() - 0.5) * 0.3, 1, (Math.random() - 0.5) * 0.3);
    caidas.push([BORDO_DEITADO, folhaNoChao(ponto, normal, Math.random() * 6.3, 0.34 + Math.random() * 0.08), corDe()]);
  }
  g.add(new THREE.Mesh(juntarColorido(caidas), tintaDaMalha({ side: THREE.DoubleSide })));
  return g;
}

// Montinho de folhas caídas: folhas de bordo vermelhas, laranja e
// douradas empilhadas num montinho, e umas espalhadas em volta — tudo
// numa malha só. O de antes eram seis polígonos chapados no chão, que
// liam como papel recortado.
function leafPile() {
  const pecas = [];
  // O monte: folhas deitadas sobre um domo baixo, cada uma virada para
  // fora do domo, umas por cima das outras.
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random());     // espalha por igual no disco
    const x = Math.cos(a) * d * 0.55, z = Math.sin(a) * d * 0.45;
    const alto = 0.38 * (1 - d * d);
    const normal = new THREE.Vector3(x * 0.9, 1, z * 0.9).normalize();
    normal.x += (Math.random() - 0.5) * 0.4;
    normal.z += (Math.random() - 0.5) * 0.4;
    pecas.push([BORDO_DEITADO, folhaNoChao(new THREE.Vector3(x, alto + 0.02 + i * 0.002, z), normal, Math.random() * 6.3, 0.36 + Math.random() * 0.1), pick(FOLHAS_OUTONO)]);
  }
  // Umas que o vento já espalhou.
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.7 + Math.random() * 0.25;
    pecas.push([BORDO_DEITADO, folhaNoChao(new THREE.Vector3(Math.cos(a) * r, 0.015, Math.sin(a) * r), CIMA, Math.random() * 6.3, 0.34), pick(FOLHAS_OUTONO)]);
  }
  const g = new THREE.Group();
  const monte = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha({ side: THREE.DoubleSide }));
  monte.castShadow = true;
  g.add(monte);
  return g;
}

// Abóbora: usada como enfeite pequeno espalhado e como obstáculo — a mesma
// forma nos dois papéis, igual `stalagmite` na Caverna. Gomos de sulco
// fundo e escuro, covinha em cima, cabinho torto com a gavinha enrolada e
// duas folhas no chão. A de antes tinha os reforços dos gomos saltando
// para fora no equador, e lia como panela com alças.
function pumpkin() {
  const g = new THREE.Group();
  const R = 0.52, GOMOS = 8;
  const laranja = new THREE.Color(pick([0xf07c22, 0xe8692a, 0xf59a2a]));
  const sulco = laranja.clone().multiplyScalar(0.62);

  // O corpo: uma esfera achatada com sulcos fundos entre os gomos e as
  // covinhas em cima e embaixo. Os sulcos saem mais escuros (cor por
  // vértice), que é o que desenha os gomos de longe.
  const corpo = new THREE.SphereGeometry(R, GOMOS * 6, 14);
  const pos = corpo.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const fundo = Math.pow(1 - Math.abs(Math.sin(ang * GOMOS / 2)), 4);   // 1 no sulco
    const lado = Math.hypot(x, z) / R;                                    // 0 no eixo, 1 no equador
    const encolhe = 1 - 0.12 * fundo * lado;
    x *= encolhe; z *= encolhe;
    y *= 0.78;
    // As covinhas: o centro de cima e o de baixo afundam.
    y -= Math.sign(y) * 0.14 * Math.pow(1 - lado, 2);
    pos.setXYZ(i, x, y, z);
    c.copy(laranja).lerp(sulco, fundo * lado);
    cores.set([c.r, c.g, c.b], i * 3);
  }
  corpo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  corpo.computeVertexNormals();
  const ALTO = R * 0.78;
  const bola = new THREE.Mesh(corpo, tintaDaMalha());
  bola.position.y = ALTO;
  bola.castShadow = true;
  g.add(bola);

  // O cabinho torto e a gavinha enrolada saindo dele.
  const topo = ALTO * 2 - 0.13;
  const cabinho = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, topo - 0.04, 0), new THREE.Vector3(0.02, topo + 0.15, 0), new THREE.Vector3(0.12, topo + 0.22, 0.02)
  ), 8, 0.05, 6, false);
  const espiral = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24;
    const a = t * Math.PI * 4;
    const r = 0.1 * (1 - t * 0.6);
    espiral.push(new THREE.Vector3(-0.05 - t * 0.3 + Math.cos(a) * r * 0.4, topo + 0.04 + Math.sin(a) * r * 0.6, Math.sin(a) * r));
  }
  const gavinha = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(espiral), 40, 0.012, 4, false);
  g.add(new THREE.Mesh(juntar([[cabinho, new THREE.Matrix4()], [gavinha, new THREE.Matrix4()]]), mat(0x5f7a32)));

  // Duas folhas largas no chão, encostadas na abóbora.
  const folhas = [];
  for (const a of [Math.random() * 6.3, Math.random() * 6.3]) {
    const ponto = new THREE.Vector3(Math.cos(a) * (R + 0.12), 0.02, Math.sin(a) * (R + 0.12));
    folhas.push([BORDO_DEITADO, folhaNoChao(ponto, new THREE.Vector3(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3), a + Math.PI / 2, 0.45)]);
  }
  g.add(new THREE.Mesh(juntar(folhas), mat(0x6f9a3c, { side: THREE.DoubleSide })));
  return g;
}

// Tronco caído: obstáculo baixo, deitado atravessando a faixa. Serve tanto
// para o Outono quanto para a Selva — uma árvore caída não muda de cara
// entre uma pista e outra. Casca de sulcos compridos, as pontas cortadas
// com os anéis da madeira, um toco de galho e dois cogumelinhos. O de
// antes era um cilindro liso com um disco em cada ponta.
function logObstacle() {
  const g = new THREE.Group();
  const R = 0.34, COMPRIMENTO = 1.7;

  // A casca: cilindro com sulcos compridos e irregulares, mais escuros no
  // fundo do sulco.
  const casca = new THREE.CylinderGeometry(R * 0.94, R, COMPRIMENTO, 18, 4, true);
  const pos = casca.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  const clara = new THREE.Color(0x8a5c3c), escura = new THREE.Color(0x5a3a24), c = new THREE.Color();
  const fase = Math.random() * 10;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const sulco = Math.pow(Math.abs(Math.sin(ang * 4.5 + Math.sin(y * 3 + fase) * 0.4)), 3);
    const k = 1 - 0.08 * sulco;
    pos.setXYZ(i, x * k, y, z * k);
    c.copy(clara).lerp(escura, sulco);
    cores.set([c.r, c.g, c.b], i * 3);
  }
  casca.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  casca.computeVertexNormals();
  const tronco = new THREE.Mesh(casca, tintaDaMalha({ side: THREE.DoubleSide }));
  tronco.rotation.z = Math.PI / 2;
  tronco.position.y = R;
  tronco.castShadow = true;
  g.add(tronco);

  // As pontas cortadas: os anéis da madeira, um claro e um escuro, e a
  // borda da casca em volta.
  const ponta = new THREE.RingGeometry(0.001, R * 0.95, 20, 7).toNonIndexed();
  const pp = ponta.attributes.position;
  const anel = new Float32Array(pp.count * 3);
  const cerne = [new THREE.Color(0xe2c08a), new THREE.Color(0xc99a62)];
  const borda = new THREE.Color(0x5a3a24);
  for (let t = 0; t < pp.count; t += 3) {
    let r = 0;
    for (let k = 0; k < 3; k++) r += Math.hypot(pp.getX(t + k), pp.getY(t + k)) / 3;
    const banda = Math.floor((r / (R * 0.95)) * 7);
    const cor = banda >= 6 ? borda : cerne[banda % 2];
    for (let k = 0; k < 3; k++) anel.set([cor.r, cor.g, cor.b], (t + k) * 3);
  }
  ponta.setAttribute('color', new THREE.BufferAttribute(anel, 3));
  const pontas = [];
  for (const lado of [-1, 1]) {
    pontas.push([ponta, new THREE.Matrix4().compose(
      new THREE.Vector3(lado * COMPRIMENTO / 2, R, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, lado * Math.PI / 2, 0)),
      new THREE.Vector3(1, 1, 1)
    )]);
  }
  // `juntar` não leva as cores: as duas pontas vão como duas malhas.
  for (const [geo, m] of pontas) {
    const malha = new THREE.Mesh(geo, tintaDaMalha());
    malha.applyMatrix4(m);
    g.add(malha);
  }

  // Um toco de galho e um par de cogumelinhos crescendo na casca.
  const galho = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.34, 6), mat(0x6b4a35));
  galho.position.set(0.35, R * 2 + 0.08, 0.05);
  galho.rotation.z = -0.4;
  galho.castShadow = true;
  g.add(galho);
  const cogumelos = [];
  for (const [x, t] of [[-0.45, 1], [-0.33, 0.7]]) {
    const chapeu = new THREE.SphereGeometry(0.09 * t, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    chapeu.scale(1, 0.7, 1);
    cogumelos.push([chapeu, naPosicao(x, R * 2 + 0.07 * t, 0.12)]);
  }
  g.add(new THREE.Mesh(juntar(cogumelos), mat(0xe8664a)));
  const pes = juntar([
    [new THREE.CylinderGeometry(0.025, 0.03, 0.08, 5), naPosicao(-0.45, R * 2 + 0.03, 0.12)],
    [new THREE.CylinderGeometry(0.018, 0.022, 0.06, 5), naPosicao(-0.33, R * 2 + 0.02, 0.12)],
  ]);
  g.add(new THREE.Mesh(pes, mat(0xfff0dc)));
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

// Tronco torto que afina para cima: um tubo em curva com cada anel
// encolhendo em volta do eixo. `pe` alarga a base, onde a árvore segura.
function troncoTorto(pontos, raio, { afina = 0.55, pe = 0 } = {}) {
  const eixo = new THREE.CatmullRomCurve3(pontos);
  const ANEIS = 10, LADOS = 7;
  const geo = new THREE.TubeGeometry(eixo, ANEIS, raio, LADOS);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / (LADOS + 1)) / ANEIS;
    const c = eixo.getPoint(t);
    const k = (1 - t * afina) * (1 + Math.max(0, 0.2 - t) * pe);
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, c.y + (pos.getY(i) - c.y) * k, c.z + (pos.getZ(i) - c.z) * k);
  }
  geo.computeVertexNormals();
  return { geo, eixo };
}

// Sapopema: a raiz-tábua das árvores da mata, uma aba fina que desce do
// tronco até o chão numa curva.
const SAPOPEMA = (() => {
  const f = new THREE.Shape();
  f.moveTo(0, 0);
  f.lineTo(0.62, 0);
  f.quadraticCurveTo(0.12, 0.1, 0, 0.8);
  f.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(f, { depth: 0.09, bevelEnabled: false, curveSegments: 5 });
  geo.translate(0, 0, -0.045);
  return geo;
})();

// Copa de mata: um chapéu largo e achatado de calombos em vários verdes,
// com folhas grandes caindo da beirada. Devolve as peças coloridas, em
// volta de (0, y, 0).
function copaDeSelva(y, largura) {
  const pecas = [[new THREE.IcosahedronGeometry(1, 1), new THREE.Matrix4().compose(
    new THREE.Vector3(0, y, 0), new THREE.Quaternion(), new THREE.Vector3(largura * 0.45, 0.4, largura * 0.45)), JUNGLE_GREENS[2]]];
  const bola = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 11) * largura * 0.42;
    const tam = 0.32 + Math.random() * 0.14;
    pecas.push([bola, new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * r, y + 0.25 - (r / largura) * 0.35, Math.sin(a) * r),
      new THREE.Quaternion(), new THREE.Vector3(tam, tam * 0.8, tam)), pick(JUNGLE_GREENS)]);
  }
  // Folhas largas saindo da beirada e pendendo para baixo.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.3;
    const R = largura * 0.42;
    pecas.push([PETALA, new THREE.Matrix4().makeTranslation(Math.cos(a) * R, y - 0.05, -Math.sin(a) * R)
      .multiply(petalaEm(a, -0.55 - Math.random() * 0.3, 0.85 + Math.random() * 0.25, 0.5)), pick(JUNGLE_GREENS)]);
  }
  return pecas;
}

// Árvore de selva: o tronco torto com as sapopemas na base e a copa larga
// e achatada de mata, com folhas grandes caindo. A de antes era um poste
// com quatro cones de raiz e bolotas soltas por cima.
function jungleTree() {
  const g = new THREE.Group();
  const lado = Math.random() < 0.5 ? -1 : 1;
  const ALTO = 2.5 + Math.random() * 0.4;
  const { geo, eixo } = troncoTorto([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(lado * 0.12, ALTO * 0.4, 0),
    new THREE.Vector3(-lado * 0.08, ALTO * 0.75, 0.05), new THREE.Vector3(0, ALTO, 0),
  ], 0.24, { afina: 0.45, pe: 1.5 });
  const madeira = [[geo, new THREE.Matrix4()]];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    madeira.push([SAPOPEMA, new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * 0.15, 0, -Math.sin(a) * 0.15),
      new THREE.Quaternion().setFromAxisAngle(CIMA, a), new THREE.Vector3(1, 0.9 + Math.random() * 0.3, 1))]);
  }
  const tronco = new THREE.Mesh(juntar(madeira), mat(0x6b4a35));
  tronco.castShadow = true;
  g.add(tronco);

  const topo = eixo.getPoint(1);
  const copa = new THREE.Mesh(juntarColorido(copaDeSelva(0, 2.4)), tintaDaMalha());
  copa.position.copy(topo);
  copa.castShadow = true;
  g.add(copa);
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

// Cipó pendurado: uma árvore fina que sobe e se dobra num galho comprido,
// e do galho caem quatro cipós em curva, com folhinhas alternando os lados
// e uma flor vermelha. Os de antes eram correntes retas de elos.
function hangingVine() {
  const g = new THREE.Group();
  const { geo, eixo } = troncoTorto([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 1.2, 0),
    new THREE.Vector3(0.25, 2.3, 0), new THREE.Vector3(0.9, 2.75, 0), new THREE.Vector3(1.6, 2.6, 0.05),
  ], 0.16, { afina: 0.7, pe: 1.2 });
  const tronco = new THREE.Mesh(geo, mat(0x5c3f2c));
  tronco.castShadow = true;
  g.add(tronco);

  const fios = [], folhas = [];
  [0.62, 0.72, 0.82, 0.93].forEach((t, k) => {
    const de = eixo.getPoint(t);
    const comp = 1.3 + Math.random() * 0.8;
    const curva = new THREE.CatmullRomCurve3([
      de, de.clone().add(new THREE.Vector3(0.12, -comp * 0.35, 0.08)),
      de.clone().add(new THREE.Vector3(-0.05, -comp * 0.7, -0.05)),
      de.clone().add(new THREE.Vector3(0.1, -comp, 0.06)),
    ]);
    fios.push([new THREE.TubeGeometry(curva, 12, 0.025, 4), new THREE.Matrix4()]);
    for (let i = 1; i <= 5; i++) {
      const p = curva.getPoint(i / 5.5);
      const a = (i % 2 ? 0 : Math.PI) + k;
      folhas.push([PETALA, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z).multiply(petalaEm(a, -0.3, 0.22, 0.6)), pick(JUNGLE_GREENS)]);
    }
  });
  g.add(new THREE.Mesh(juntar(fios), mat(0x4a7d3a)));
  const verde = new THREE.Mesh(juntarColorido(folhas), tintaDaMalha({ side: THREE.DoubleSide }));
  verde.castShadow = true;
  g.add(verde);

  // A flor no galho, virada para fora.
  const flor = eixo.getPoint(0.55);
  const base = new THREE.Matrix4().compose(flor.add(new THREE.Vector3(0, 0.05, 0.14)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, 0, 0)), new THREE.Vector3(0.9, 0.9, 0.9));
  const petalas = Array.from({ length: 5 }, (_, i) => [PETALA, base.clone().multiply(petalaEm((i / 5) * Math.PI * 2, 0.25, 0.3, 0.6))]);
  g.add(new THREE.Mesh(juntar(petalas), mat(0xff4d6d, { side: THREE.DoubleSide })));
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0xffd166));
  miolo.position.setFromMatrixPosition(base);
  g.add(miolo);
  return g;
}

// Nó de cipós (obstáculo): cipós grossos dando voltas e mais voltas em
// volta de um toco coberto de musgo, com folhas e duas florzinhas. Era uma
// bola com seis argolas soltas.
function vineTangle() {
  const g = new THREE.Group();
  const toco = new THREE.Mesh(pedraIrregular(0.4, 0.2), mat(0x3f7a3a));
  toco.scale.set(1.2, 0.8, 1.1);
  toco.position.y = 0.32;
  toco.castShadow = true;
  g.add(toco);

  const CENTRO = new THREE.Vector3(0, 0.5, 0);
  const fios = [], folhas = [];
  for (let k = 0; k < 5; k++) {
    // Um laço fechado passando por pontos sorteados numa casca em volta do
    // toco — é o que faz os cipós se cruzarem, como um novelo.
    const pontos = [];
    const giro = Math.random() * Math.PI * 2, incl = (Math.random() - 0.5) * 1.4;
    for (let i = 0; i < 6; i++) {
      const a = giro + (i / 6) * Math.PI * 2;
      const r = 0.5 + Math.random() * 0.18;
      pontos.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * Math.sin(incl) * 0.8, Math.sin(a) * r * Math.cos(incl))
        .add(CENTRO).setY(Math.max(0.08, CENTRO.y + Math.sin(a + k) * 0.38)));
    }
    const curva = new THREE.CatmullRomCurve3(pontos, true);
    fios.push([new THREE.TubeGeometry(curva, 30, 0.05, 5, true), new THREE.Matrix4()]);
    for (let i = 0; i < 3; i++) {
      const p = curva.getPoint((i + Math.random()) / 3);
      folhas.push([PETALA, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z).multiply(petalaEm(Math.random() * 6, 0.2, 0.3, 0.6)), pick(JUNGLE_GREENS)]);
    }
  }
  const cipos = new THREE.Mesh(juntar(fios), mat(0x5a7d32));
  cipos.castShadow = true;
  g.add(cipos);
  g.add(new THREE.Mesh(juntarColorido(folhas), tintaDaMalha({ side: THREE.DoubleSide })));

  const petalas = [], miolos = [];
  for (const [x, y, z] of [[0.35, 0.85, 0.3], [-0.4, 0.6, 0.35]]) {
    const base = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.9, 0, 0)), new THREE.Vector3(0.5, 0.5, 0.5));
    for (let i = 0; i < 5; i++) petalas.push([PETALA, base.clone().multiply(petalaEm((i / 5) * Math.PI * 2, 0.25, 0.3, 0.6))]);
    miolos.push([new THREE.SphereGeometry(0.05, 6, 4), base.clone()]);
  }
  g.add(new THREE.Mesh(juntar(petalas), mat(0xff6bb0, { side: THREE.DoubleSide })), new THREE.Mesh(juntar(miolos), mat(0xffd166)));
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
  parasol, sandcastle, sandToys, palmTree, beachChair, clam,
  balloonStand,
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

// Barra de saltar: a trave de salto de hipismo, que serve em qualquer pista.
// Dois postes de pé (com pé em cruz para ficar de pé e uma bolinha no alto),
// os suportes onde a vara apoia e a vara listrada em faixas. Cada uma sai
// num par de cores e num arranjo: uma vara com outra embaixo, um X de varas
// cruzadas ou uma vara deitada no chão na frente, marcando onde pular.
// Fica abaixo de 1,0 de altura, como a barreira: quem pula passa com folga.
// Era a barra de doce (bastão de bala embrulhada), que só cabia nos Doces.
const CORES_DE_SALTO = [
  [0xff4d5e, 0xffffff], [0x3fa2ff, 0xffffff], [0xffcc3d, 0x3f6fff],
  [0x4cc96f, 0xffffff], [0xff5d8f, 0xffffff], [0xff8a3d, 0x8a6bff],
];
function jumpBar() {
  const g = new THREE.Group();
  const [corA, corB] = pick(CORES_DE_SALTO);
  const corPoste = corB === 0xffffff ? 0xfff8f0 : corB;
  const X = 0.75, ALTO = 0.9, TRAVE = 0.74, R = 0.065;

  // Uma vara listrada de `de` até `ate` (pontos [x, y, z]).
  const vara = (de, ate) => {
    const d = new THREE.Vector3(ate[0] - de[0], ate[1] - de[1], ate[2] - de[2]);
    const faixas = 7;
    const geo = pintarDuasCores(new THREE.CylinderGeometry(R, R, d.length(), 12, faixas * 2, false),
      (u, v) => Math.floor(v * faixas) % 2 === 0, corA, corB);
    const m = new THREE.Mesh(geo, tintaDaMalha());
    m.position.set((de[0] + ate[0]) / 2, (de[1] + ate[1]) / 2, (de[2] + ate[2]) / 2);
    m.quaternion.setFromUnitVectors(CIMA, d.normalize());
    m.castShadow = true;
    return m;
  };
  g.add(vara([-X, TRAVE, 0], [X, TRAVE, 0]));

  const pecas = [];
  const suporte = (x, y) => pecas.push([new THREE.BoxGeometry(0.1, 0.045, 0.15), naPosicao(x * 0.97, y - R - 0.02, 0), 0x5c6270]);
  for (const lado of [-1, 1]) {
    const x = lado * (X + 0.08);
    pecas.push([new THREE.BoxGeometry(0.1, ALTO, 0.1), naPosicao(x, ALTO / 2, 0), corPoste]);
    pecas.push([new THREE.SphereGeometry(0.075, 10, 6), naPosicao(x, ALTO + 0.05, 0), corA]);
    // O pé em cruz: uma tábua para a frente e para trás, outra para fora.
    pecas.push([new THREE.BoxGeometry(0.1, 0.07, 0.62), naPosicao(x, 0.035, 0), corA]);
    pecas.push([new THREE.BoxGeometry(0.3, 0.07, 0.1), naPosicao(x + lado * 0.1, 0.035, 0), corA]);
    // Uma faixa colorida no meio do poste, para ele não ficar liso.
    pecas.push([new THREE.BoxGeometry(0.115, 0.12, 0.115), naPosicao(x, ALTO * 0.45, 0), corA]);
  }
  suporte(-X, TRAVE);
  suporte(X, TRAVE);

  const arranjo = pick(['duas', 'duas', 'xis', 'chao']);
  if (arranjo === 'duas') {
    g.add(vara([-X, 0.38, 0], [X, 0.38, 0]));
    suporte(-X, 0.38);
    suporte(X, 0.38);
  } else if (arranjo === 'xis') {
    g.add(vara([-X, 0.12, 0.05], [X, 0.6, 0.05]), vara([-X, 0.6, -0.05], [X, 0.12, -0.05]));
  } else {
    g.add(vara([-X, R, 0.45], [X, R, 0.45]));
  }

  const estrutura = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha());
  estrutura.castShadow = true;
  g.add(estrutura);
  return g;
}

// Arbusto de espinhos: uma moita redonda de calombos em dois verdes,
// eriçada de espinhos que saem da folhagem para todos os lados, e umas
// frutinhas vermelhas. Os espinhos são o aviso de "não encoste" — é um
// obstáculo. O de antes era um icosaedro facetado com cinco espinhos
// enormes, e lia como pedra verde.
const ESPINHO = new THREE.ConeGeometry(0.028, 1, 4);
function bush() {
  const g = new THREE.Group();
  const [claro, escuro] = pick([[0x6bbf7b, 0x4f9d5f], [0x7cc46a, 0x5aa04e]]);
  const CENTRO = new THREE.Vector3(0, 0.5, 0);
  const pecas = [[new THREE.IcosahedronGeometry(0.5, 1), new THREE.Matrix4().compose(CENTRO, new THREE.Quaternion(), new THREE.Vector3(1.1, 0.85, 1.1)), escuro]];
  const calombo = new THREE.IcosahedronGeometry(1, 1);
  const frutas = [];
  const espinhos = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + 0.5) / N * 2;
    if (y < -0.5) continue;                  // o fundo fica no chão
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const ponto = CENTRO.clone().add(new THREE.Vector3(dir.x * 0.5, dir.y * 0.4, dir.z * 0.5));
    const tam = 0.24 + Math.random() * 0.08;
    pecas.push([calombo, new THREE.Matrix4().compose(ponto, new THREE.Quaternion(), new THREE.Vector3(tam, tam * 0.9, tam)), i % 3 ? claro : escuro]);
    if (i % 3 === 0) frutas.push([new THREE.IcosahedronGeometry(0.05, 0), naPosicao(...ponto.clone().addScaledVector(dir, tam * 0.95).toArray())]);
    // Dois espinhos por calombo, saindo dele para fora e um pouco tortos.
    for (let k = 0; k < 2; k++) {
      const torto = dir.clone().add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(0.7)).normalize();
      const comp = 0.13 + Math.random() * 0.06;
      const base = ponto.clone().addScaledVector(torto, tam * 0.8);
      espinhos.push([ESPINHO, new THREE.Matrix4().compose(
        base.addScaledVector(torto, comp / 2),
        new THREE.Quaternion().setFromUnitVectors(CIMA, torto),
        new THREE.Vector3(1, comp, 1))]);
    }
  }
  const moita = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha());
  moita.castShadow = true;
  g.add(moita);
  g.add(new THREE.Mesh(juntar(frutas), mat(0xe0364a)));
  g.add(new THREE.Mesh(juntar(espinhos), mat(0x8a5a3a)));
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

// Pedra de luar: um bloco liso e claro, aceso de leve por dentro, com uma
// lua crescente entalhada e acesa dos dois lados, e duas pedrinhas
// encostadas. Eram três pedras facetadas empilhadas, que no escuro liam
// como pedra qualquer.
const LUA_ENTALHADA = (() => {
  const f = new THREE.Shape();
  const N = 10;
  for (let k = 0; k <= N; k++) {
    const a = -1.9 + (k / N) * 3.8;
    const x = Math.cos(a) * 0.19, y = Math.sin(a) * 0.19;
    if (k === 0) f.moveTo(x, y); else f.lineTo(x, y);
  }
  for (let k = 0; k <= N; k++) {
    const a = 1.75 - (k / N) * 3.5;
    f.lineTo(-0.08 + Math.cos(a) * 0.17, Math.sin(a) * 0.17);
  }
  const geo = new THREE.ExtrudeGeometry(f, { depth: 0.03, bevelEnabled: false });
  geo.translate(0, 0, -0.015);
  return geo;
})();

function moonStone() {
  const g = new THREE.Group();
  const geo = pedraIrregular(0.55, 0.1);
  const pedra = new THREE.Mesh(geo, mat(0xdfe6ff, { emissive: 0x8fa8ff, emissiveIntensity: 0.45 }));
  pedra.scale.set(1.1, 0.95, 0.85);
  pedra.position.y = 0.5;
  pedra.castShadow = true;
  g.add(pedra);

  // A lua entalhada, colada na superfície da frente e na de trás: um raio
  // vindo de fora acha onde a pedra está naquele ponto.
  pedra.updateMatrixWorld(true);
  const raio = new THREE.Raycaster();
  const luas = [];
  for (const lado of [1, -1]) {
    raio.set(new THREE.Vector3(0, 0.55, lado * 3), new THREE.Vector3(0, 0, -lado));
    const acerto = raio.intersectObject(pedra)[0];
    if (!acerto) continue;
    const normal = acerto.face.normal.clone().transformDirection(pedra.matrixWorld);
    luas.push([LUA_ENTALHADA, new THREE.Matrix4().compose(
      acerto.point.addScaledVector(normal, 0.01),
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
      new THREE.Vector3(lado * 1.6, 1.6, 1))]);
  }
  g.add(new THREE.Mesh(juntar(luas), new THREE.MeshBasicMaterial({ color: 0xfff6c4 })));

  const pedrinhas = juntar([
    [pedraIrregular(0.2, 0.2, 0), naPosicao(0.62, 0.12, 0.2)],
    [pedraIrregular(0.14, 0.2, 0), naPosicao(-0.6, 0.09, -0.15)],
  ]);
  g.add(new THREE.Mesh(pedrinhas, mat(0xcfd6f5, { emissive: 0x8fa8ff, emissiveIntensity: 0.35 })));
  g.add(warningRing(0x9fb8ff));
  return g;
}

// Cogumelão brilhante: o chapéu acende forte e ocupa a pista inteira. Um
// filhote aceso ao lado ajuda a ler o tamanho dele.
function bigGlowMushroom() {
  const g = new THREE.Group();
  const color = pick([0x8ce9ff, 0xffa6f0, 0xa6ffcb]);
  g.add(cogumeloForma({ alto: 0.95, raio: 0.78, cor: color, pintas: 7, brilho: 0.9, caule: 0xfff4ff }));
  const filhote = cogumeloForma({ alto: 0.4, raio: 0.24, cor: color, pintas: 3, brilho: 0.9, caule: 0xfff4ff });
  filhote.position.set(0.62, 0, 0.35);
  filhote.rotation.z = -0.25;
  g.add(filhote);
  g.add(warningRing(color));
  return g;
}

// Cristais: um punhado de prismas de seis lados com ponta, saindo de uma
// pedra baixa em leque, o do meio mais alto. Eram três cones lisos, que
// liam como dentes. Aparece no Vulcão, na Geada, na Lua e na Caverna.
const PRISMA_CRISTAL = (() => {
  const corpo = new THREE.CylinderGeometry(1, 1, 1, 6);
  corpo.translate(0, 0.5, 0);
  const ponta = new THREE.ConeGeometry(1, 0.6, 6);
  ponta.translate(0, 1.3, 0);
  return juntar([[corpo, new THREE.Matrix4()], [ponta, new THREE.Matrix4()]]);
})();

function crystalSpike() {
  const g = new THREE.Group();
  const color = pick([0x8ce9ff, 0xc7a6ff]);
  const cristais = [];
  const pontas = [[0, 1.15, 0.2, 0, 0], [-0.3, 0.8, 0.15, -0.35, 0.1], [0.3, 0.9, 0.16, 0.3, -0.12], [0.05, 0.55, 0.12, 0.15, 0.45], [-0.12, 0.5, 0.11, -0.2, -0.4]];
  for (const [x, alto, raio, inclZ, inclX] of pontas) {
    cristais.push([PRISMA_CRISTAL, new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.05, (Math.random() - 0.5) * 0.15),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(inclX, Math.random(), inclZ)),
      new THREE.Vector3(raio, alto / 1.6, raio))]);
  }
  const brilho = new THREE.Mesh(juntar(cristais), mat(color, { emissive: color, emissiveIntensity: 0.8 }));
  brilho.castShadow = true;
  g.add(brilho);
  const base = new THREE.Mesh(pedraIrregular(0.42, 0.18, 0), mat(0x3a3442));
  base.scale.set(1.2, 0.32, 0.9);
  base.position.y = 0.04;
  g.add(base);
  g.add(warningRing(color));
  return g;
}

// Nuvem carregada: uma nuvem escura e fofa, achatada e baixa, com o raio
// amarelo em zigue-zague caindo dela até quase o chão. Dá para pular por
// cima. A de antes eram quatro blocos facetados com um cone de ponta
// para baixo.
function stormCloud() {
  const g = new THREE.Group();
  const CENTRO = new THREE.Vector3(0, 0.82, 0);
  const pecas = [[new THREE.IcosahedronGeometry(0.5, 1), new THREE.Matrix4().compose(CENTRO, new THREE.Quaternion(), new THREE.Vector3(1.7, 0.6, 0.9))]];
  const calombo = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 9; i++) {
    const x = (i / 8 - 0.5) * 1.5;
    const tam = 0.3 + (1 - Math.abs(x) / 0.75) * 0.14 + Math.random() * 0.05;
    pecas.push([calombo, new THREE.Matrix4().compose(
      new THREE.Vector3(x, CENTRO.y + 0.08 + (i % 2) * 0.08, (Math.random() - 0.5) * 0.3),
      new THREE.Quaternion(), new THREE.Vector3(tam, tam * 0.85, tam))]);
  }
  const nuvem = new THREE.Mesh(juntar(pecas), mat(0x7f88b0));
  nuvem.castShadow = true;
  g.add(nuvem);
  const raio = new THREE.Mesh(RAIO_ZIGUEZAGUE, mat(0xffe066, { emissive: 0xc9a520, side: THREE.DoubleSide }));
  raio.position.set(0.05, 0.42, 0.2);
  raio.scale.setScalar(0.9);
  g.add(raio);
  return g;
}

// Pipa: o losango em quatro gomos de duas cores, um tico abaulado no meio,
// as varetas em cruz por trás e a rabiola descendo em onda até o chão, com
// lacinhos. Era um octaedro achatado com três tirinhas soltas embaixo.
function kite() {
  const g = new THREE.Group();
  const [corA, corB] = pick([[0xff7b9d, 0xffe066], [0x74c0fc, 0xffffff], [0xffd166, 0xff6b6b], [0xb197fc, 0x8ce99a]]);
  const CENTRO = new THREE.Vector3(0, 1.12, 0.07);
  const cantos = [
    new THREE.Vector3(0, 1.75, 0), new THREE.Vector3(0.45, 1.2, 0),
    new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(-0.45, 1.2, 0),
  ];
  const posicoes = [], cores = [];
  for (let k = 0; k < 4; k++) {
    const cor = new THREE.Color(k % 2 ? corB : corA);
    for (const p of [CENTRO, cantos[k], cantos[(k + 1) % 4]]) {
      posicoes.push(p.x, p.y, p.z);
      cores.push(cor.r, cor.g, cor.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  geo.computeVertexNormals();
  const pipa = new THREE.Mesh(geo, tintaDaMalha({ side: THREE.DoubleSide }));
  pipa.castShadow = true;

  // Varetas, um tico atrás do papel.
  const varetas = juntar([
    [new THREE.CylinderGeometry(0.018, 0.018, 1.15, 4), naPosicao(0, 1.18, -0.02)],
    [new THREE.CylinderGeometry(0.018, 0.018, 0.9, 4), new THREE.Matrix4().compose(new THREE.Vector3(0, 1.2, -0.02), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2), new THREE.Vector3(1, 1, 1))],
  ]);

  // A rabiola: uma linha em onda do pé da pipa até o chão, com lacinhos.
  const pontos = [];
  for (let k = 0; k <= 6; k++) pontos.push(new THREE.Vector3(Math.sin(k * 1.1) * 0.16, 0.6 - k * 0.075, Math.cos(k * 0.9) * 0.05));
  const rabo = new THREE.CatmullRomCurve3(pontos);
  const linha = [[new THREE.TubeGeometry(rabo, 16, 0.012, 3), new THREE.Matrix4()]];
  const lacos = [];
  for (const t of [0.25, 0.55, 0.85]) {
    const p = rabo.getPoint(t);
    for (const lado of [-1, 1]) {
      lacos.push([new THREE.ConeGeometry(0.06, 0.12, 4), new THREE.Matrix4().compose(
        p.clone().add(new THREE.Vector3(lado * 0.055, 0, 0)),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), lado * Math.PI / 2), new THREE.Vector3(1, 1, 0.4))]);
    }
  }
  // A pipa toda inclinada um tico para trás, como se o vento a segurasse.
  const corpo = new THREE.Group();
  corpo.rotation.x = -0.12;
  corpo.position.y = -0.12;
  corpo.add(pipa, new THREE.Mesh(varetas, mat(0x8a6a4a)), new THREE.Mesh(juntar(linha), mat(0xfff6ec)), new THREE.Mesh(juntar(lacos), mat(corB === 0xffffff ? corA : corB)));
  g.add(corpo);
  return g;
}

// Obstáculo: um cacho de bexigas (as mesmas do buquê do Parque) presas por
// fitas em curva a um pesinho no chão. Eram três bolas em cima de palitos.
function balloonBunch() {
  const g = new THREE.Group();
  const cores = [0xff7b9d, 0xffd166, 0x74c0fc, 0x8ce99a, 0xb197fc].sort(() => Math.random() - 0.5);
  const AMARRA = new THREE.Vector3(0, 0.2, 0);
  const baloes = [], fitas = [];
  const posicoes = [[0, 1.28, -0.05], [-0.55, 1.02, 0], [0.55, 1.06, -0.08], [-0.25, 0.9, 0.42], [0.3, 0.88, 0.4]];
  posicoes.forEach(([x, y, z], i) => {
    const p = new THREE.Vector3(x, y, z);
    const inclina = new THREE.Quaternion().setFromUnitVectors(CIMA, new THREE.Vector3(x * 0.6, 1, z * 0.6).normalize());
    baloes.push([BALAO, new THREE.Matrix4().compose(p, inclina, new THREE.Vector3(1.05, 1.05, 1.05)), cores[i]]);
    const ponta = p.clone().add(new THREE.Vector3(0, -0.47, 0).applyQuaternion(inclina));
    const meio = ponta.clone().lerp(AMARRA, 0.5).add(new THREE.Vector3(0.08 * (i % 2 ? 1 : -1), 0, 0));
    fitas.push([new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(ponta, meio, AMARRA), 8, 0.012, 3), new THREE.Matrix4()]);
  });
  const corpo = new THREE.Mesh(juntarColorido(baloes), tintaDaMalha());
  corpo.castShadow = true;
  g.add(corpo, new THREE.Mesh(juntar(fitas), mat(0xffffff)));
  // O pesinho redondo que segura o cacho no chão.
  const peso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.2, 8), mat(0xff5d8f));
  peso.position.y = 0.1;
  peso.castShadow = true;
  g.add(peso);
  return g;
}

const OBSTACLES = {
  rock, jumpBar, bush, gumdrop, donut, crystalSpike,
  stormCloud, kite, balloonBunch, moonStone, bigGlowMushroom,
  watermelon, pineapple, coconutPile, seaUrchin, clam,
  lavaBoulder, iceBlock, meteor,
  popcornBox, barrel, crate, stalagmite,
  pumpkin, logObstacle, vineTangle,
};

// A barra de saltar vale em **toda** pista: além dos obstáculos que são a
// cara de cada uma, ela entra no sorteio como mais um (no Campo e nos Doces
// ela já está na lista). Só pista de verdade (com `id`) ganha a barra: quem
// pede um obstáculo específico, como a página /modelos, recebe exatamente
// aquele.
function sorteioDeObstaculos(track) {
  if (!track.id || track.obstacles.includes('jumpBar')) return track.obstacles;
  return [...track.obstacles, 'jumpBar'];
}

export function createObstacle(track) {
  const build = OBSTACLES[pick(sorteioDeObstaculos(track))] || rock;
  const obj = build();
  obj.userData.kind = 'obstacle';
  return obj;
}

// --- Obstáculos no alto: passa por baixo, não pula ---------------------------
//
// O contrário da barra de saltar: uma cortina pendurada numa trave alta, que
// o unicórnio passa por baixo correndo — e em que bate se pular. Ensina a
// segunda metade do "quando pular": às vezes o certo é ficar no chão.
//
// A cortina ocupa **duas ou três pistas** de uma vez (`faixas`). Era de uma
// pista só, e aí bastava desviar para o lado — ela virava mais um obstáculo
// de desviar, e o "fica no chão" quase nunca era a resposta. Com três, não
// há desvio; com duas, sobra uma faixa livre, e a criança escolhe entre
// desviar e passar por baixo.
//
// A medida que importa é ALTO_LIVRE: nada pendura abaixo dela, e ela fica
// acima do chifre de todo unicórnio parado no chão (o mais alto chega a
// ~2,7). A colisão (Game.checkCollisions, `userData.alto`) bate a partir de
// um pulinho de ALTO_BATE — o chifre já encostaria na cortina — e vale em
// toda a largura dela (`userData.halfWidth`, como a barreira).
//
// Os postes ficam só nas pontas, na divisa de fora das faixas cobertas (as
// faixas estão a 2,2 uma da outra): nada fica no meio do caminho de quem
// troca de faixa por baixo. No chão, uma sombra comprida debaixo da
// cortina: é o aviso que chega antes, como a faixa da barreira.
export const ALTO_LIVRE = 2.85;
export const ALTO_BATE = 0.35;
const TRAVE = 3.75;
// Com a Pena Mágica o pulo sobe ~5,4 — dá para passar **por cima** da
// cortina: os cascos acima da trave (e do que fica em cima dela: o tronco,
// a neve, as bolinhas dos postes). Só com a Pena: sem ela, nem o pulo duplo
// do Limão deveria virar atalho para a lição de ficar no chão.
export const ALTO_POR_CIMA = TRAVE + 0.25;
const POSTE_X = 1.02;            // do meio de uma faixa até a divisa dela
const ENTRE_FAIXAS = 2.2;        // a distância entre as faixas (LANES, no config)

// Do meio da cortina até cada poste, para `faixas` pistas lado a lado.
const meiaCortina = (faixas) => POSTE_X + (faixas - 1) * (ENTRE_FAIXAS / 2);

const CORTINAS = {
  campo: 'folhas', frutas: 'folhas', selva: 'folhas', outono: 'folhas', bruma: 'folhas', oceano: 'folhas',
  geada: 'pingentes', caverna: 'pingentes', vulcao: 'pingentes',
  vilarejo: 'lanternas', noite: 'lanternas', parque: 'lanternas', espaco: 'lanternas',
};

// As cores de cada pista; o que não está aqui usa a primeira entrada.
const FOLHAGEM = {
  campo: [0x4f9e5c, 0x6bbf7b, 0x3d8f45], frutas: [0x5cb06a, 0x7cc46a, 0x43884f],
  selva: [0x2f7a3a, 0x3d8f45, 0x5aa04e], outono: [0xe0452f, 0xff8a2a, 0xffc23d],
  bruma: [0x7d9a86, 0x93a99a, 0x6a8574], oceano: [0x3fa36b, 0x5cc48a, 0x2f8a5a],
};
const PINGENTE = {
  geada: { cor: 0xcdeeff, trave: 0xeef8ff, neve: true },
  caverna: { cor: 0xa99bd6, trave: 0x6b6478, neve: false },
  vulcao: { cor: 0x5a5262, trave: 0x3b3340, neve: false, brasa: 0xff6b1f },
};

// Uma corda que cede no meio, de poste a poste.
function cordaCaida(alto, cede, meia) {
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-meia, alto, 0), new THREE.Vector3(0, alto - cede * 2, 0), new THREE.Vector3(meia, alto, 0));
}

// Os dois postes e o que fica em cima deles.
function postes(cor, corTopo, meia, { grosso = 0.07, alto = TRAVE } = {}) {
  const pecas = [];
  for (const x of [-meia, meia]) {
    pecas.push([new THREE.CylinderGeometry(grosso, grosso * 1.25, alto, 8), naPosicao(x, alto / 2, 0), cor]);
    pecas.push([new THREE.SphereGeometry(grosso * 1.6, 10, 8), naPosicao(x, alto + grosso, 0), corTopo]);
    pecas.push([new THREE.CylinderGeometry(grosso * 2.4, grosso * 2.8, 0.1, 10), naPosicao(x, 0.05, 0), corTopo]);
  }
  return pecas;
}

function sombraNoChao(meia) {
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(meia * 2 - 0.04, 0.9),
    new THREE.MeshBasicMaterial({ color: 0x2a1f3d, transparent: true, opacity: 0.16, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.025;
  return sombra;
}

// Bandeirolas de festa: a corda caída e as bandeirinhas compridas.
function bandeirolas(trackId, faixas) {
  const g = new THREE.Group();
  const meia = meiaCortina(faixas);
  const cores = [...PLASTICO].sort(() => Math.random() - 0.5);
  g.add(new THREE.Mesh(juntarColorido(postes(0xfff6ec, cores[0], meia)), tintaDaMalha()));
  // Corda mais comprida cede mais — mas nunca até a linha de ALTO_LIVRE.
  const corda = cordaCaida(TRAVE - 0.15, 0.12 + 0.05 * (faixas - 1), meia);
  const pecas = [[new THREE.TubeGeometry(corda, 20 * faixas, 0.018, 4), new THREE.Matrix4(), 0xfff6ec]];
  const N = 8 * faixas;
  for (let i = 0; i < N; i++) {
    const p = corda.getPoint((i + 0.5) / N);
    const largura = 0.24;
    const comprimento = p.y - ALTO_LIVRE;
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([
      -largura / 2, 0, 0, largura / 2, 0, 0, 0, -comprimento, 0,
    ], 3));
    tri.computeVertexNormals();
    pecas.push([tri, pose(p.x, p.y, 0, 0, (Math.random() - 0.5) * 0.4, 0), cores[i % 4]]);
  }
  const fita = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha({ side: THREE.DoubleSide }));
  fita.castShadow = true;
  g.add(fita, sombraNoChao(meia));
  return g;
}

// Pingentes: gelo (Geada), pedra lilás (Caverna) ou pedra escura com a
// ponta em brasa (Vulcão), pendurados numa trave do mesmo material.
function pingentes(trackId, faixas) {
  const g = new THREE.Group();
  const meia = meiaCortina(faixas);
  const estilo = PINGENTE[trackId] || PINGENTE.geada;
  const pecas = postes(estilo.trave, estilo.cor, meia, { grosso: 0.09 });
  pecas.push([new THREE.BoxGeometry(meia * 2 + 0.3, 0.24, 0.32), naPosicao(0, TRAVE - 0.05, 0), estilo.trave]);
  if (estilo.neve) pecas.push([new THREE.BoxGeometry(meia * 2 + 0.36, 0.08, 0.36), naPosicao(0, TRAVE + 0.1, 0), 0xffffff]);
  const pontas = [];
  const N = 9 * faixas;
  const embaixo = TRAVE - 0.17;
  const borda = meia - 0.12;
  for (let i = 0; i < N; i++) {
    const x = -borda + (i / (N - 1)) * borda * 2 + (Math.random() - 0.5) * 0.06;
    // Os do meio e alguns soltos descem até a linha; os outros, menos.
    const longo = i % 2 === 0 || Math.random() < 0.3;
    const comprimento = (embaixo - ALTO_LIVRE) * (longo ? 1 : 0.45 + Math.random() * 0.3);
    const raio = 0.07 + Math.random() * 0.04;
    pecas.push([new THREE.ConeGeometry(raio, comprimento, 6), pose(x, embaixo - comprimento / 2, (Math.random() - 0.5) * 0.12, Math.PI, Math.random(), 0), estilo.cor]);
    if (estilo.brasa && longo) pontas.push([new THREE.SphereGeometry(0.045, 6, 4), naPosicao(x, embaixo - comprimento + 0.06, 0)]);
  }
  const corpo = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha(estilo.neve ? { transparent: true, opacity: 0.92 } : {}));
  corpo.castShadow = true;
  g.add(corpo, sombraNoChao(meia));
  if (pontas.length) g.add(new THREE.Mesh(juntar(pontas), LAVA_ACESA(estilo.brasa)));
  return g;
}

// Cortina de folhas: um tronco atravessado em dois postes de madeira e os
// cipós pendurados, cheios de folhas, até a linha.
function cortinaDeFolhas(trackId, faixas) {
  const g = new THREE.Group();
  const meia = meiaCortina(faixas);
  const verdes = FOLHAGEM[trackId] || FOLHAGEM.campo;
  const madeira = 0x8a5c3c;
  const pecas = postes(madeira, 0x6b4a35, meia, { grosso: 0.09 });
  pecas.push([new THREE.CylinderGeometry(0.13, 0.13, meia * 2 + 0.4, 8), pose(0, TRAVE, 0, 0, 0, Math.PI / 2), madeira]);
  const N = 7 * faixas;
  const folha = new THREE.SphereGeometry(0.11, 6, 4);
  const borda = meia - 0.17;
  for (let i = 0; i < N; i++) {
    const x = -borda + (i / (N - 1)) * borda * 2;
    const comprimento = TRAVE - 0.1 - ALTO_LIVRE;
    const balanco = (Math.random() - 0.5) * 0.08;
    const cipo = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, TRAVE - 0.1, 0),
      new THREE.Vector3(x + balanco * 2, TRAVE - 0.1 - comprimento / 2, 0.04), new THREE.Vector3(x + balanco, ALTO_LIVRE + 0.08, 0));
    pecas.push([new THREE.TubeGeometry(cipo, 6, 0.018, 4), new THREE.Matrix4(), 0x4f7d3a]);
    const folhas = 4 + Math.floor(Math.random() * 2);
    for (let k = 0; k < folhas; k++) {
      const p = cipo.getPoint((k + 0.6) / folhas);
      const lado = k % 2 ? 1 : -1;
      pecas.push([folha, pose(p.x + lado * 0.06, p.y, p.z, 0, Math.random() * 3, lado * 0.6, [1, 0.4, 1.6]), verdes[(i + k) % verdes.length]]);
    }
  }
  const corpo = new THREE.Mesh(juntarColorido(pecas), tintaDaMalha());
  corpo.castShadow = true;
  g.add(corpo, sombraNoChao(meia));
  return g;
}

// Lanternas de papel acesas numa corda caída.
function lanternas(trackId, faixas) {
  const g = new THREE.Group();
  const meia = meiaCortina(faixas);
  g.add(new THREE.Mesh(juntarColorido(postes(0x5c3f2c, 0xffd166, meia)), tintaDaMalha()));
  const corda = cordaCaida(TRAVE - 0.1, 0.1 + 0.04 * (faixas - 1), meia);
  const fios = [[new THREE.TubeGeometry(corda, 20 * faixas, 0.016, 4), new THREE.Matrix4()]];
  const tampas = [];
  const N = 5 * faixas;
  const cores = [0xff6b6b, 0xffd166, 0xff9ecd, 0x8ce9ff, 0xffa94d].sort(() => Math.random() - 0.5);
  for (let i = 0; i < N; i++) {
    const p = corda.getPoint((i + 0.5) / N);
    const raio = 0.2;
    const centro = ALTO_LIVRE + raio * 1.15;
    fios.push([new THREE.CylinderGeometry(0.008, 0.008, p.y - centro, 4), naPosicao(p.x, (p.y + centro) / 2, 0)]);
    tampas.push([new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8), naPosicao(p.x, centro + raio * 1.1, 0)]);
    tampas.push([new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8), naPosicao(p.x, centro - raio * 1.1, 0)]);
    const cor = cores[i % cores.length];
    const bola = new THREE.Mesh(new THREE.SphereGeometry(raio, 12, 8), mat(cor, { emissive: cor, emissiveIntensity: 0.55, flatShading: false }));
    bola.scale.y = 1.2;
    bola.position.set(p.x, centro, 0);
    g.add(bola);
  }
  g.add(new THREE.Mesh(juntar(fios), mat(0x3a2f2a)), new THREE.Mesh(juntar(tampas), mat(0x5c3f2c)), sombraNoChao(meia));
  return g;
}

const NO_ALTO = { bandeirolas, pingentes, cortinaDeFolhas, lanternas };
const CORTINA_PADRAO = { folhas: 'cortinaDeFolhas', pingentes: 'pingentes', lanternas: 'lanternas' };

// O modelo da pista: cada uma tem a sua cortina (ver CORTINAS); a que não
// tem, ganha as bandeirolas de festa. `faixas` é quantas pistas ela cobre (2
// ou 3); quem a põe na pista centraliza no meio delas. `qual` força um
// modelo (página /modelos).
export function createOverhead(track, faixas = 3, qual) {
  const nome = qual || CORTINA_PADRAO[CORTINAS[track.id]] || 'bandeirolas';
  const obj = (NO_ALTO[nome] || bandeirolas)(track.id, faixas);
  obj.userData.kind = 'obstacle';
  obj.userData.alto = true;
  obj.userData.faixas = faixas;
  // A colisão pega a largura inteira: metade de cada faixa coberta.
  obj.userData.halfWidth = (ENTRE_FAIXAS / 2) * faixas;
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

// Passarinho: corpo redondinho de barriga clara, cabecinha, rabo em
// tesoura, bico, olhinhos e asas afinando na ponta, numa cor mais escura
// que o corpo. É de longe que ele é visto, então são só cinco malhas, todas
// de formas montadas uma vez (ver PASSARINHO) — o de antes era uma bola
// branca de bico laranja, e as asas de folha liam como orelhas.
const PASSARINHO = (() => {
  const metade = (deCima) => {
    const geo = new THREE.SphereGeometry(0.16, 10, 4, 0, Math.PI * 2, deCima ? 0 : Math.PI / 2, Math.PI / 2);
    geo.scale(1.35, 1, 1);
    return geo;
  };
  const rabo = new THREE.Shape();
  rabo.moveTo(0, -0.05);
  rabo.lineTo(-0.2, -0.1);
  rabo.lineTo(-0.15, 0);
  rabo.lineTo(-0.2, 0.1);
  rabo.lineTo(0, 0.05);
  rabo.lineTo(0, -0.05);
  const raboGeo = new THREE.ShapeGeometry(rabo);
  raboGeo.rotateX(Math.PI / 2);              // deita: o rabo é horizontal
  raboGeo.rotateZ(0.25);                     // e sobe um pouco
  const corpo = (costas, barriga) => juntarColorido([
    [metade(true), new THREE.Matrix4(), costas],
    [metade(false), new THREE.Matrix4(), barriga],
    [new THREE.SphereGeometry(0.115, 8, 6), naPosicao(0.17, 0.08, 0), costas],
    [raboGeo, naPosicao(-0.18, 0.02, 0), costas],
  ]);
  const bico = new THREE.ConeGeometry(0.035, 0.1, 5);
  bico.rotateZ(-Math.PI / 2);
  bico.translate(0.32, 0.07, 0);
  const olhos = juntar([
    [new THREE.SphereGeometry(0.02, 5, 4), naPosicao(0.24, 0.11, 0.075)],
    [new THREE.SphereGeometry(0.02, 5, 4), naPosicao(0.24, 0.11, -0.075)],
  ]);
  // A asa, do lado +Z: larga na raiz e afinando, varrida para trás.
  const asa = new THREE.Shape();
  asa.moveTo(0.08, 0);
  asa.quadraticCurveTo(0.06, 0.24, -0.06, 0.4);
  asa.lineTo(-0.1, 0.28);
  asa.lineTo(-0.1, 0);
  asa.lineTo(0.08, 0);
  const asaGeo = new THREE.ShapeGeometry(asa, 6);
  asaGeo.rotateX(Math.PI / 2);               // o vão da asa (Y da forma) vira Z
  return { corpo, bico, olhos, asa: asaGeo };
})();

// [costas, asa, barriga]: azul, amarelo, rosa, branco e o sabiá.
const PASSARINHO_CORES = [
  [0x74c0fc, 0x3f8fd8, 0xfff6e8],
  [0xffd43b, 0xf0a020, 0xfff6c8],
  [0xff9ec4, 0xe0679a, 0xfff0f6],
  [0xffffff, 0xb8c8dc, 0xffffff],
  [0x9c7a5c, 0x6e5440, 0xffa25c],
];

const CORPOS_DE_PASSARINHO = new Map();
function bird() {
  const g = new THREE.Group();
  const [costas, corAsa, barriga] = pick(PASSARINHO_CORES);
  const basico = (extra) => new THREE.MeshBasicMaterial({ fog: false, ...extra });

  // Um corpo por paleta, montado na primeira vez que ela sai.
  const chave = `${costas}-${barriga}`;
  if (!CORPOS_DE_PASSARINHO.has(chave)) CORPOS_DE_PASSARINHO.set(chave, PASSARINHO.corpo(costas, barriga));
  g.add(new THREE.Mesh(CORPOS_DE_PASSARINHO.get(chave), basico({ vertexColors: true, side: THREE.DoubleSide })));
  g.add(new THREE.Mesh(PASSARINHO.bico, basico({ color: 0xffab1f })));
  g.add(new THREE.Mesh(PASSARINHO.olhos, basico({ color: 0x2a2a30 })));

  const materialAsa = basico({ color: corAsa, side: THREE.DoubleSide });
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(0.02, 0.06, 0);
    const lado = new THREE.Group();
    lado.scale.z = side;                     // a da esquerda é a da direita espelhada
    lado.add(new THREE.Mesh(PASSARINHO.asa, materialAsa));
    wing.add(lado);
    wing.userData.side = side;
    g.add(wing);
    wings.push(wing);
  }

  g.userData.parts = { wings };
  return g;
}

// Papagaio: o corpo do passarinho (ver PASSARINHO), maior e em cor viva,
// com o bico curvo de papagaio, a asa de outra cor e o rabo comprido de
// três penas. Era uma bola com um cone de rabo e asas redondas.
const PAPAGAIO_CORES = [
  [0xff3b3b, 0x2f7fff, 0xffd166],   // arara-vermelha
  [0x2f9bff, 0xffd166, 0xffd166],   // arara-azul-e-amarela
  [0x3fbf55, 0xff4d4d, 0x9be86a],   // papagaio verde
];
const RABO_DE_PAPAGAIO = (() => {
  const penas = [-0.18, 0, 0.18].map((a, i) => [PETALA, new THREE.Matrix4().compose(
    new THREE.Vector3(-0.2, 0.02, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + a, 0.15, 'YZX')),
    new THREE.Vector3(i === 1 ? 0.62 : 0.5, 1, 0.22))]);
  return juntar(penas);
})();
const BICO_DE_PAPAGAIO = (() => {
  const curva = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.26, 0.11, 0), new THREE.Vector3(0.36, 0.1, 0), new THREE.Vector3(0.33, 0.0, 0));
  const geo = new THREE.TubeGeometry(curva, 6, 0.035, 5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / 6) / 6;
    const c = curva.getPoint(t), k = 1 - t * 0.85;
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, c.y + (pos.getY(i) - c.y) * k, c.z + (pos.getZ(i) - c.z) * k);
  }
  return geo;
})();

function parrot() {
  const g = new THREE.Group();
  const [corpoCor, asaCor, barriga] = pick(PAPAGAIO_CORES);
  const basico = (extra) => new THREE.MeshBasicMaterial({ fog: false, ...extra });
  const chave = `papagaio-${corpoCor}-${barriga}`;
  if (!CORPOS_DE_PASSARINHO.has(chave)) CORPOS_DE_PASSARINHO.set(chave, PASSARINHO.corpo(corpoCor, barriga));
  const corpo = new THREE.Group();
  corpo.scale.setScalar(1.3);
  corpo.add(new THREE.Mesh(CORPOS_DE_PASSARINHO.get(chave), basico({ vertexColors: true, side: THREE.DoubleSide })));
  corpo.add(new THREE.Mesh(BICO_DE_PAPAGAIO, basico({ color: 0xf2e8d8 })));
  corpo.add(new THREE.Mesh(PASSARINHO.olhos, basico({ color: 0x2a2a30 })));
  corpo.add(new THREE.Mesh(RABO_DE_PAPAGAIO, basico({ color: asaCor, side: THREE.DoubleSide })));
  g.add(corpo);

  const materialAsa = basico({ color: asaCor, side: THREE.DoubleSide });
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(0.03, 0.08, 0);
    const lado = new THREE.Group();
    lado.scale.set(1.3, 1.3, side * 1.4);
    lado.add(new THREE.Mesh(PASSARINHO.asa, materialAsa));
    wing.add(lado);
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
// fininha, abdome redondo e seis pernas. Metade delas leva um granulado na
// boca, que é o que formiga faz numa pista feita de doce.
//
// São 18 na pista e pequenas na tela, então ela é montada como a abelha:
// as formas saem uma vez só (ver FORMIGA) e cada formiga são cinco malhas
// — casca, olhos, os detalhes escuros e as pernas em duas turmas, as três
// de cada tripé numa peça, que é como elas andam juntas. A de antes tinha
// perto de 30 peças, cada uma com geometria e material próprios.
//
// O chão fica em y = -0,12 (ela nasce a 0,12 de altura, ver World).
const FORMIGA_CHAO = -0.12;
const FORMIGA = (() => {
  const bola = (r, [sx, sy, sz], [x, y, z]) => [
    new THREE.SphereGeometry(r, 8, 6),
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz)),
  ];
  const casca = juntar([
    bola(0.14, [1.3, 1, 1], [-0.22, 0.05, 0]),        // abdome
    bola(0.035, [1, 1, 1], [-0.06, 0.01, 0]),         // cintura
    bola(0.07, [1.45, 0.9, 0.9], [0.03, 0.02, 0]),    // tórax
    bola(0.11, [1, 0.95, 1], [0.18, 0.07, 0]),        // cabeça
  ]);
  const olhos = [], escuro = [];
  for (const lado of [-1, 1]) {
    olhos.push(bola(0.036, [1, 1, 1], [0.255, 0.1, lado * 0.055]));
    escuro.push(bola(0.019, [1, 1, 1], [0.283, 0.1, lado * 0.06]));
    // Antena dobrada no cotovelo, com bolinha na ponta.
    escuro.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.16, lado * 0.04),
      new THREE.Vector3(0.22, 0.28, lado * 0.07),
      new THREE.Vector3(0.33, 0.31, lado * 0.1),
    ], false, 'catmullrom', 0.2), 6, 0.011, 3), new THREE.Matrix4()]);
    escuro.push(bola(0.022, [1, 1, 1], [0.34, 0.305, lado * 0.105]));
  }
  // As pernas, em duas turmas: frente e trás de um lado andam junto com a
  // do meio do outro (o passo de tripé). A perna sobe num joelho e desce
  // até o chão; as da frente apontam para a frente, as de trás para trás.
  const turmas = [[], []];
  [[-0.02, -0.12], [0.03, 0], [0.08, 0.12]].forEach(([x, pe], i) => {
    for (const lado of [-1, 1]) {
      const perna = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, -0.01, lado * 0.04),
        new THREE.Vector3(x + pe * 0.4, 0.06, lado * 0.17),
        new THREE.Vector3(x + pe, FORMIGA_CHAO + 0.01, lado * 0.25),
      ], false, 'catmullrom', 0.1), 6, 0.014, 3);
      turmas[(i + (lado > 0 ? 1 : 0)) % 2].push([perna, new THREE.Matrix4()]);
    }
  });
  const carga = new THREE.CapsuleGeometry(0.035, 0.16, 2, 6);
  carga.rotateX(Math.PI / 2);
  carga.translate(0.32, 0.03, 0);
  return {
    casca, olhos: juntar(olhos), escuro: juntar(escuro),
    pernas: turmas.map((turma) => {
      // Cada turma gira em volta do meio do tórax.
      const geo = juntar(turma);
      geo.translate(-0.03, 0, 0);
      return geo;
    }),
    carga,
  };
})();
const FORMIGA_MATERIAIS = (() => {
  const basico = (color) => new THREE.MeshBasicMaterial({ color, fog: false });
  return {
    casca: basico(0x4a2a22), olhos: basico(0xffffff), escuro: basico(0x2e1a14),
    cargas: [0xff5d8f, 0xffd166, 0x4cc9f0, 0x8ce99a, 0xc77dff].map(basico),
  };
})();

function ant() {
  const g = new THREE.Group();
  const corpo = new THREE.Group();
  const M = FORMIGA_MATERIAIS;
  corpo.add(new THREE.Mesh(FORMIGA.casca, M.casca), new THREE.Mesh(FORMIGA.olhos, M.olhos), new THREE.Mesh(FORMIGA.escuro, M.escuro));
  // Metade carrega um granulado atravessado na boca.
  if (Math.random() < 0.5) corpo.add(new THREE.Mesh(FORMIGA.carga, pick(M.cargas)));

  const pernas = FORMIGA.pernas.map((geo, i) => {
    const turma = new THREE.Mesh(geo, M.escuro);
    turma.position.x = 0.03;
    turma.userData.fase = i ? Math.PI : 0;
    corpo.add(turma);
    return turma;
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
// Seis braços, cada um com dois pares de raminhos — o floco de desenho de
// criança. São 60 no ar, então é uma malha só, de uma forma e um material
// compartilhados por todos (o de antes montava quatro malhas, com material
// próprio, para cada floco).
const FLOCO = (() => {
  const pecas = [];
  const braco = new THREE.PlaneGeometry(0.03, 0.15);
  braco.translate(0, 0.075, 0);
  const ramo = new THREE.PlaneGeometry(0.022, 0.06);
  ramo.translate(0, 0.03, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const giro = (ang) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ang);
    pecas.push([braco, new THREE.Matrix4().compose(new THREE.Vector3(), giro(a), new THREE.Vector3(1, 1, 1))]);
    for (const [ao, tam] of [[0.07, 1], [0.11, 0.7]]) {
      const ponto = new THREE.Vector3(-Math.sin(a) * ao, Math.cos(a) * ao, 0);
      for (const lado of [-1, 1]) {
        pecas.push([ramo, new THREE.Matrix4().compose(ponto, giro(a + lado * 0.8), new THREE.Vector3(1, tam, 1))]);
      }
    }
  }
  return juntar(pecas);
})();
const FLOCO_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });

export function createSnowflake() {
  const floco = new THREE.Mesh(FLOCO, FLOCO_MATERIAL);
  floco.scale.setScalar(0.8 + Math.random() * 0.5);
  floco.userData.parts = { queda: 0.9 + Math.random() * 0.8 };
  return floco;
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

// Folha caindo: uma folha de bordo numa cor quente, que balança e gira
// devagar enquanto desce — bem mais devagar que o floco de neve, para ler
// como folha boiando no ar e não como neve caindo reto.
const FOLHA_NO_AR = BORDO.clone().scale(0.34, 0.34, 0.34);
function leaf() {
  const folha = new THREE.Mesh(
    FOLHA_NO_AR,
    new THREE.MeshBasicMaterial({ color: pick(FOLHAS_OUTONO), side: THREE.DoubleSide, fog: false })
  );
  folha.userData.parts = { queda: 0.55 + Math.random() * 0.5 };
  return folha;
}

// Nota musical: o desenho da partitura, recortado e com espessura — a
// cabeça oval inclinada, a haste e a bandeirinha curva (♪), ou duas notas
// ligadas pela barra (♫). Cada uma é uma forma só, de bordas arredondadas,
// montada uma vez e compartilhada. A de antes eram três bloquinhos finos
// que giravam de lado e sumiam; agora ela balança de frente (ver a
// animação em `animateAmbience`). É o que voa no Parque, onde a música
// nunca para.
const NOTAS = (() => {
  const PROFUNDO = 0.05;
  const extrudar = (forma) => new THREE.ExtrudeGeometry(forma, {
    depth: PROFUNDO, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2, curveSegments: 10,
  });
  const cabeca = (x, y) => {
    const f = new THREE.Shape();
    f.absellipse(x, y, 0.125, 0.085, 0, Math.PI * 2, false, 0.4);
    return extrudar(f);
  };
  const haste = (x, y0, y1) => {
    const f = new THREE.Shape();
    f.moveTo(x - 0.035, y0);
    f.lineTo(x, y0);
    f.lineTo(x, y1);
    f.lineTo(x - 0.035, y1);
    f.lineTo(x - 0.035, y0);
    return extrudar(f);
  };
  const centrar = (geo) => { geo.computeBoundingBox(); geo.center(); return geo; };
  const juntarTudo = (pecas) => centrar(juntar(pecas.map((geo) => [geo, new THREE.Matrix4()])));

  // ♪ — a colcheia: a bandeirinha desce da ponta da haste numa curva.
  const bandeira = new THREE.Shape();
  bandeira.moveTo(0.1, 0.55);
  bandeira.lineTo(0.135, 0.55);
  bandeira.quadraticCurveTo(0.16, 0.43, 0.27, 0.36);
  bandeira.quadraticCurveTo(0.34, 0.27, 0.27, 0.15);
  bandeira.quadraticCurveTo(0.29, 0.28, 0.135, 0.38);
  bandeira.lineTo(0.1, 0.38);
  bandeira.lineTo(0.1, 0.55);
  const colcheia = juntarTudo([cabeca(0, 0), haste(0.135, 0.02, 0.55), extrudar(bandeira)]);

  // ♫ — duas colcheias ligadas pela barra grossa, a da direita mais alta.
  const barra = new THREE.Shape();
  barra.moveTo(0.1, 0.5);
  barra.lineTo(0.465, 0.56);
  barra.lineTo(0.465, 0.64);
  barra.lineTo(0.1, 0.58);
  barra.lineTo(0.1, 0.5);
  const dupla = juntarTudo([
    cabeca(0, 0), haste(0.135, 0.02, 0.58),
    cabeca(0.33, 0.06), haste(0.465, 0.08, 0.64),
    extrudar(barra),
  ]);
  return [colcheia, colcheia, dupla];
})();
const NOTA_MATERIAIS = new Map();

function musicNote() {
  const cor = pick([0xff4d5e, 0x7a4ec7, 0x2f8fd6, 0xffb703, 0xff7bac]);
  if (!NOTA_MATERIAIS.has(cor)) {
    NOTA_MATERIAIS.set(cor, mat(cor, { emissive: new THREE.Color(cor).multiplyScalar(0.25) }));
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(pick(NOTAS), NOTA_MATERIAIS.get(cor)));
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

// Um modelo qualquer da pista pelo nome — enfeite, obstáculo ou bichinho.
// É o que as figurinhas usam (models/stickers.js): cada uma é um destes, e o
// nome é o mesmo das listas de `tracks.js`.
//
// Muitos modelos dividem geometria e material entre si (a pétala, o
// cristal, a formiga…): quem usa isto não deve dar `dispose` no que recebe.
export function createModelo(nome) {
  const build = DECORATIONS[nome] || OBSTACLES[nome] || AMBIENCE[nome];
  return build ? build() : null;
}

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
    // Balança de um lado para o outro, sempre quase de frente: virada de
    // perfil, a nota é só um risco.
    item.rotation.y = Math.sin(t * 1.4) * 0.55;
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
