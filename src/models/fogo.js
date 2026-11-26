// Fogo de verdade, para as asas e a cauda de fogo.
//
// A peça é a **língua de fogo**: uma tira chata que nasce redonda na raiz,
// engorda, e afina até uma ponta fina — com a cor clara no meio (quase
// branca, amarela) e quente na borda (laranja, vermelho), e o meio também
// esquentando da raiz para a ponta. É isso que faz ler como chama: a borda
// vermelha e o miolo claro, e não uma pena de uma cor só.
//
// E ela **mexe**: a linha do meio ondula numa onda que corre da raiz para a
// ponta, a largura respira e a ponta estica e encolhe — cada língua num
// compasso, para o conjunto tremular como fogueira. Por isso a geometria é
// redesenhada a cada quadro (`userData.animar(tempo)`): são poucas colunas
// por língua, e o custo é nada perto do resto da cena.
//
// Material sem luz (`MeshBasic`): fogo não tem lado escuro, ele brilha.

import * as THREE from 'three';

export const CORES_DO_FOGO = {
  // Da raiz à ponta.
  borda: [0xff8a14, 0xf5501a, 0xe0301a, 0xb3101e],
  centro: [0xfffef5, 0xffe66b, 0xffa21f, 0xff5a14],
};

const _a = new THREE.Color();
const _b = new THREE.Color();
function amostrar(paleta, h, alvo) {
  const x = h * (paleta.length - 1);
  const k = Math.min(paleta.length - 2, Math.floor(x));
  return alvo.copy(paleta[k]).lerp(paleta[k + 1], x - k);
}

// Uma língua de fogo no plano XY, da raiz (0, 0) até a ponta em +x.
//   comprimento, largura — largura é a meia-largura no ponto mais gordo;
//   curva — quanto a linha do meio entorta para +y (negativo: para -y);
//   onda  — o tamanho da ondulação que corre por ela;
//   fase  — o compasso dela, para línguas vizinhas não mexerem juntas.
export function linguaDeFogo(comprimento, largura, {
  curva = 0, onda = 0.1, fase = 0, ritmo = 1,
  borda = CORES_DO_FOGO.borda, centro = CORES_DO_FOGO.centro,
} = {}) {
  const N = 14;
  const colunas = N + 1;
  // Três vértices por coluna: borda de cima, meio, borda de baixo.
  const pos = new Float32Array(colunas * 9);
  const cor = new Float32Array(colunas * 9);
  const pb = borda.map((c) => new THREE.Color(c));
  const pc = centro.map((c) => new THREE.Color(c));
  for (let i = 0; i < colunas; i++) {
    const h = i / N;
    amostrar(pb, h, _a);
    amostrar(pc, h, _b);
    cor.set([_a.r, _a.g, _a.b, _b.r, _b.g, _b.b, _a.r, _a.g, _a.b], i * 9);
  }
  const indices = [];
  for (let i = 0; i < N; i++) {
    const a = i * 3;
    const b = a + 3;
    indices.push(a, a + 1, b, b, a + 1, b + 1, a + 1, a + 2, b + 1, b + 1, a + 2, b + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  geo.setIndex(indices);

  const lingua = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  lingua.userData.ownGlow = true;
  // Ela muda de forma a cada quadro: a caixa calculada uma vez não vale.
  lingua.frustumCulled = false;

  const desenhar = (tempo, vento = 0) => {
    const t = tempo * ritmo;
    const estica = 1 + Math.sin(t * 11 + fase) * 0.07 + Math.sin(t * 19 + fase * 1.7) * 0.04 + vento * 0.12;
    for (let i = 0; i < colunas; i++) {
      const h = i / N;
      const x = h * comprimento * estica;
      // Engorda rápido logo depois da raiz e afina devagar até a ponta.
      const respira = 1 + Math.sin(t * 15 + fase + h * 4) * 0.1;
      const meia = largura * Math.sin(Math.min(Math.PI / 2, h * 5 + 0.2)) * (1 - h) ** 1.2 * respira;
      // A onda cresce para a ponta: a raiz fica quieta, a ponta lambe.
      const y = comprimento * (curva * h * h + onda * h ** 1.5 * Math.sin(t * 9 + fase - h * 5));
      pos.set([x, y + meia, 0, x, y, 0, x, y - meia, 0], i * 9);
    }
    geo.attributes.position.needsUpdate = true;
  };
  desenhar(0);
  lingua.userData.animar = desenhar;
  return lingua;
}

// Faíscas: losanguinhos que saem do fogo, sobem e somem, em ciclo.
// `caminho(u, f)` diz onde a faísca `f` está na fração `u` da vida dela.
export function faiscas(quantas, tamanho, caminho) {
  const g = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(tamanho, 0);
  const lista = [];
  for (let i = 0; i < quantas; i++) {
    const f = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe58a : 0xffa23a }));
    f.userData = { ownGlow: true, ciclo: i / quantas, lado: ((i * 37) % quantas) / quantas - 0.5 };
    f.frustumCulled = false;
    g.add(f);
    lista.push(f);
  }
  g.userData.animar = (tempo) => {
    for (const f of lista) {
      const u = (tempo * 0.9 + f.userData.ciclo) % 1;
      caminho(u, f);
      f.scale.setScalar(Math.max(0.001, (1 - u) * 1.3));
      f.rotation.set(tempo * 5, tempo * 4, 0);
    }
  };
  g.userData.animar(0);
  return g;
}

// A asa de fogo: um leque de labaredas no lugar das penas, cada uma com uma
// lambida menor escapando pela borda, e faíscas soltando das pontas.
// Monta no `fan` da asa (ver makeWing), no mesmo arranjo do leque de penas —
// as curtas junto ao corpo, as compridas na ponta, varrendo para trás —, e
// devolve as labaredas como "penas", para a asa abrir, fechar e bater igual
// às outras. As pontas entortam para trás, como fogo puxado pelo vento da
// corrida.
export function asaDeFogo(fan) {
  const penas = [];
  const linguas = [];
  const QUANTAS = 7;
  for (let i = 0; i < QUANTAS; i++) {
    const t = i / (QUANTAS - 1);
    const comprimento = 0.62 + t * 0.56;
    const pena = new THREE.Group();
    const principal = linguaDeFogo(comprimento, 0.22 - t * 0.04, { curva: -0.14, onda: 0.07, fase: i * 1.9 });
    pena.add(principal);
    linguas.push(principal);
    // A lambida: uma língua pequena saindo da borda de cima, virada para
    // fora — é ela que recorta a silhueta em labareda.
    const lambida = linguaDeFogo(comprimento * 0.42, 0.09, { curva: -0.2, onda: 0.14, fase: i * 2.7 + 1, ritmo: 1.3 });
    lambida.position.set(comprimento * 0.42, 0.06, 0.005);
    lambida.rotation.z = 0.45;
    pena.add(lambida);
    linguas.push(lambida);
    pena.position.set(0.12 + t * 0.44, 0, t * 0.05 + i * 0.012);
    pena.rotation.y = -t * 0.32;
    pena.rotation.z = -(0.15 + t * 0.95);
    pena.userData.t = t;
    pena.userData.baseRotation = pena.rotation.z;
    fan.add(pena);
    penas.push(pena);
  }
  // Labaredas curtas e claras por cima da raiz: o miolo quente da asa.
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const curta = linguaDeFogo(0.34 + t * 0.16, 0.1, {
      curva: -0.1, onda: 0.1, fase: i * 3.1 + 0.5, ritmo: 1.2,
      borda: [0xffc23a, 0xff8a1f, 0xff5a14], centro: [0xffffff, 0xfff6c0, 0xffd84a],
    });
    curta.position.set(0.1 + t * 0.22, 0, 0.1);
    curta.rotation.z = -(0.1 + t * 0.35);
    curta.userData.t = t * 0.4;
    curta.userData.baseRotation = curta.rotation.z;
    fan.add(curta);
    penas.push(curta);
    linguas.push(curta);
  }
  // As faíscas: saem ao longo da asa, sobem (o z do leque é o alto, com a
  // asa aberta) e ficam para trás (-y).
  const brasas = faiscas(7, 0.03, (u, f) => {
    const ao = 0.35 + (f.userData.lado + 0.5) * 1.0;
    f.position.set(ao + Math.sin(u * 9 + ao * 5) * 0.05, -0.25 - u * 0.55, 0.05 + u * 0.45);
  });
  fan.add(brasas);

  fan.userData.animar = (tempo) => {
    for (const l of linguas) l.userData.animar(tempo);
    brasas.userData.animar(tempo);
  };
  return penas;
}
