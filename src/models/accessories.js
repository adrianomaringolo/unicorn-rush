// Enfeites: o que a criança põe no unicórnio — laço, coroa, óculos, colar.
//
// Comprados com **corações** (a carteira `save.enfeites.coracoes`), uma vez
// só: o enfeite comprado serve em todos os unicórnios, e cada um lembra o
// que está vestindo (`save.enfeites.vestindo[id]`).
//
// Cada enfeite mora numa **vaga** — cabeça, rosto ou pescoço — e um
// unicórnio usa no máximo um por vaga: a coroa tira a cartola, mas fica
// junto dos óculos e do colar. É a regra que uma criança já conhece de
// vestir boneca, e ela impede que três chapéus briguem no mesmo lugar.
//
// As medidas são as de `createUnicorn` (unicorn.js): os da cabeça entram no
// grupo `head` (então crescem junto na Lulu, que é cabeçuda), os do pescoço
// entram no torso, os da cauda na raiz do rabo (`tail`, que balança junto) e
// os das patas no joelho de cada uma das quatro pernas, logo acima do casco.
//
// A cauda e as patas são o que a câmera da corrida mais vê — ela fica atrás
// do bicho —, então os enfeites delas olham para trás. O lado dos enfeites de lado (laço, cartola) é o esquerdo
// (x negativo), que é o lado que o retrato de perfil mostra.
//
// Cada peça cria os próprios materiais: o brilho das pistas escuras
// (Game.applyTrackGlow) mexe no `emissive` de cada material do unicórnio, e
// um material dividido entre unicórnios acenderia em todos de uma vez.
import * as THREE from 'three';
import { trocarAsas, parDeAsas } from './unicorn.js';

const mat = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

export const VAGAS = ['cabeca', 'rosto', 'pescoco', 'asas', 'patas', 'cauda', 'chifre'];

// O pescoço de createUnicorn: centro, inclinação e o raio perto da cabeça.
const PESCOCO = { y: 1.46, z: -0.58, inclina: -0.5 };

// Um grupo alinhado ao pescoço: o eixo y dele corre ao longo do pescoço, e
// um anel deitado no plano xz abraça o pescoço sem ficar torto.
function noPescoco() {
  const g = new THREE.Group();
  g.position.set(0, PESCOCO.y, PESCOCO.z);
  g.rotation.x = PESCOCO.inclina;
  g.userData.pescoco = true;
  return g;
}

// A crina cobre a nuca e a parte de cima do pescoço, e um anel redondo
// passava por **baixo** dela: de trás (a câmera da corrida) o colar sumia.
// Aqui o que está em volta do pescoço vira uma elipse que fica onde estava
// na frente e se abre para os lados e para trás, **por cima** da crina.
//
// No grupo do pescoço, +z aponta para a nuca (onde está a crina). Cada
// peça direta se afasta do centro: os anéis (toro) esticam, o resto (as
// pérolas, as folhinhas, as bolinhas) só muda de lugar, sem deformar.
const SOBRE_A_CRINA = { x: 1.3, z: 1.55 };
function abrirSobreACrina(g) {
  const { x, z } = SOBRE_A_CRINA;
  for (const peca of g.children) {
    if (peca.geometry?.type === 'TorusGeometry') {
      // O toro está deitado (girado em x): o y dele é o z do grupo.
      peca.scale.x *= x;
      peca.scale.y *= z;
      const raio = peca.geometry.parameters.radius;
      peca.position.z += raio * (z - 1);
    } else {
      const raio = Math.hypot(peca.position.x, peca.position.z);
      peca.position.x *= x;
      peca.position.z = peca.position.z * z + raio * (z - 1);
    }
  }
}

// A frente do pescoço (onde caem o laço, a medalha e as pontas do
// cachecol), já nas medidas do torso.
const FRENTE_DO_PESCOCO = new THREE.Vector3(0, 1.31, -0.82);

function anel(raio, grossura, cor, y = 0) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(raio, grossura, 7, 22), mat(cor));
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}

// Um laço de duas abas, com o nó no meio e duas pontinhas caindo. Nasce de
// frente para `+z` (as abas abrem em x); quem põe de lado gira o grupo. As
// abas são esferas achatadas e não cones: cone achatado lia como losango,
// e laço é redondinho nas pontas.
function laco(cor, tamanho = 1, { pontas = true } = {}) {
  const g = new THREE.Group();
  const material = mat(cor);
  const escuro = mat(new THREE.Color(cor).multiplyScalar(0.78));
  for (const lado of [-1, 1]) {
    const aba = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), material);
    aba.scale.set(1.35, 1, 0.5);
    aba.position.x = lado * 0.085;
    aba.rotation.z = lado * 0.3;      // as abas abrem um pouco para cima
    g.add(aba);
    if (pontas) {
      const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.13, 6), escuro);
      ponta.scale.z = 0.5;
      ponta.rotation.z = Math.PI + lado * 0.45;   // de ponta para cima: o fim largo cai
      ponta.position.set(lado * 0.035, -0.07, -0.005);
      g.add(ponta);
    }
  }
  const no = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), escuro);
  no.scale.set(0.9, 1, 0.75);
  no.position.z = 0.012;
  g.add(no);
  g.scale.setScalar(tamanho);
  return g;
}

// Florzinha de cinco pétalas, virada para `+z` (quem chama aponta).
function florzinha(cor, miolo = 0xffd166, tamanho = 1) {
  const g = new THREE.Group();
  const petala = mat(cor);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.03 * tamanho, 6, 5), petala);
    p.scale.set(1, 1, 0.45);
    p.position.set(Math.cos(a) * 0.03 * tamanho, Math.sin(a) * 0.03 * tamanho, 0);
    g.add(p);
  }
  const centro = new THREE.Mesh(new THREE.SphereGeometry(0.02 * tamanho, 6, 5), mat(miolo));
  centro.position.z = 0.01;
  g.add(centro);
  return g;
}

// Os dois olhos (createUnicorn põe cada um em (±0,22, 0,06, -0,2)) e a
// direção para fora de cada um, que é para onde a lente olha.
const OLHO = (lado) => new THREE.Vector3(lado * 0.22, 0.06, -0.2);

// Óculos: uma lente na frente de cada olho (os olhos ficam dos lados da
// cabeça, então cada lente olha para o seu lado), a ponte por cima do
// focinho e as hastes indo para trás até a orelha.
function oculos({ lente, aro, formato = 'redondo' }) {
  const g = new THREE.Group();
  const materialAro = mat(aro);
  const pontas = [];
  for (const lado of [-1, 1]) {
    const olho = OLHO(lado);
    // A lente olha meio para o lado, meio para a frente: só para o lado
    // (como o olho) ela virava protetor de orelha visto de frente.
    const fora = olho.clone().normalize().add(new THREE.Vector3(0, 0, -0.9)).normalize();
    const centro = olho.clone().add(new THREE.Vector3(lado * 0.035, 0.005, -0.075));

    let vidro;
    if (formato === 'coracao') {
      const s = new THREE.Shape();
      s.moveTo(0, -0.1);
      s.bezierCurveTo(-0.02, -0.06, -0.12, -0.03, -0.11, 0.04);
      s.bezierCurveTo(-0.1, 0.1, -0.03, 0.11, 0, 0.06);
      s.bezierCurveTo(0.03, 0.11, 0.1, 0.1, 0.11, 0.04);
      s.bezierCurveTo(0.12, -0.03, 0.02, -0.06, 0, -0.1);
      const geo = new THREE.ExtrudeGeometry(s, {
        depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 6,
      });
      geo.translate(0, 0.005, -0.01);
      vidro = new THREE.Mesh(geo, mat(lente));
    } else {
      const geo = new THREE.CylinderGeometry(0.095, 0.095, 0.022, 14);
      geo.rotateX(Math.PI / 2);    // o disco fica de frente para +z
      vidro = new THREE.Mesh(geo, mat(lente));
      const borda = new THREE.Mesh(new THREE.TorusGeometry(0.097, 0.017, 6, 18), materialAro);
      vidro.add(borda);
    }
    vidro.position.copy(centro);
    vidro.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), fora);
    g.add(vidro);

    // Haste: da borda de fora da lente até atrás da orelha.
    const haste = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * 0.3, 0.08, -0.22),
      new THREE.Vector3(lado * 0.31, 0.11, -0.06),
      new THREE.Vector3(lado * 0.26, 0.13, 0.08),
    ]), 6, 0.013, 5);
    g.add(new THREE.Mesh(haste, materialAro));
    pontas.push(new THREE.Vector3(lado * 0.17, 0.09, -0.33));
  }
  // A ponte arqueia por cima do focinho, de uma lente à outra.
  const ponte = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    pontas[0],
    new THREE.Vector3(0, 0.13, -0.36),
    pontas[1],
  ]), 10, 0.016, 5);
  g.add(new THREE.Mesh(ponte, materialAro));
  return g;
}

// A cauda pende ao longo de -y no grupo `tail`; +z aponta para trás e um
// pouco para cima, que é para onde a câmera da corrida olha.
const RAIZ_DA_CAUDA = -0.1;

// O casco começa em -0,36 × L no joelho (createUnicorn: casco em -0,44 L,
// 0,16 L de altura). `L` é o tamanho da perna de quem veste.
const acimaDoCasco = (L) => -0.33 * L;

// Estrela de cinco pontas extrudada, de frente para +z.
function estrelaGorda(raio, cor, emissivo = 0x5a4a10) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 ? raio * 0.45 : raio;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: raio * 0.3, bevelEnabled: true, bevelThickness: raio * 0.12, bevelSize: raio * 0.1, bevelSegments: 1,
  });
  geo.translate(0, 0, -raio * 0.15);
  return new THREE.Mesh(geo, mat(cor, { emissive: emissivo }));
}

// Sininho dourado: a boca virada para baixo e a bolinha aparecendo.
function sininho(tamanho = 1) {
  const g = new THREE.Group();
  const ouro = mat(0xffc53d, { emissive: 0x4a3000 });
  const corpo = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0, 0.05), new THREE.Vector2(0.025, 0.048), new THREE.Vector2(0.035, 0.02),
    new THREE.Vector2(0.04, -0.01), new THREE.Vector2(0.052, -0.035), new THREE.Vector2(0.05, -0.04),
  ], 10), ouro);
  corpo.material.side = THREE.DoubleSide;
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), mat(0x8a5a00));
  bola.position.y = -0.038;
  g.add(corpo, bola);
  g.scale.setScalar(tamanho);
  return g;
}

// --- Chifres ----------------------------------------------------------------
// Os chifres novos **trocam** o do unicórnio: `chifre({ length, radius })`
// monta a peça nas medidas do chifre de quem veste (a Lulu tem chifre
// curtinho, o Brasa comprido), no mesmo eixo dele — um cone em pé, centrado
// na origem —, e vestirEnfeites põe no lugar e esconde o original.

// Um cone com listras em espiral, de `cores` em sequência. A cor é por
// triângulo (geometria não indexada), então a listra sai nítida, sem
// degradê entre uma cor e a outra.
function coneEspiral(altura, raio, cores, { voltas = 2.5, lados = 16, emissivo = 0 } = {}) {
  const geo = new THREE.ConeGeometry(raio, altura, lados, 24).toNonIndexed();
  const pos = geo.attributes.position;
  const cor = new Float32Array(pos.count * 3);
  const tons = cores.map((c) => new THREE.Color(c));
  for (let i = 0; i < pos.count; i += 3) {
    let x = 0, y = 0, z = 0;
    for (let k = 0; k < 3; k++) { x += pos.getX(i + k); y += pos.getY(i + k); z += pos.getZ(i + k); }
    const h = (y / 3 + altura / 2) / altura;
    const u = Math.atan2(z, x) / (Math.PI * 2) + h * voltas;
    const tom = tons[((Math.floor(u * tons.length) % tons.length) + tons.length) % tons.length];
    for (let k = 0; k < 3; k++) tom.toArray(cor, (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  return new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true, emissive: emissivo }));
}

// Um ponto na superfície do cone: `h` de 0 (base) a 1 (ponta), `a` o ângulo.
const naSuperficie = (altura, raio, h, a) => new THREE.Vector3(
  Math.cos(a) * raio * (1 - h), -altura / 2 + h * altura, Math.sin(a) * raio * (1 - h));

// Coração extrudado, de frente para +z, do tamanho `t` (≈ altura).
function coracaoGordo(t, cor, emissivo = 0x5a1030) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.15, -0.32, -0.55, -0.12, -0.5, 0.18);
  s.bezierCurveTo(-0.46, 0.42, -0.14, 0.5, 0, 0.28);
  s.bezierCurveTo(0.14, 0.5, 0.46, 0.42, 0.5, 0.18);
  s.bezierCurveTo(0.55, -0.12, 0.15, -0.32, 0, -0.5);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 8,
  });
  geo.translate(0, 0, -0.11);
  geo.scale(t, t, t);
  return new THREE.Mesh(geo, mat(cor, { emissive: emissivo }));
}

// --- Os enfeites ------------------------------------------------------------
//
// `preco` em corações. Uma corrida tranquila no Livre rende uns 40–80, então
// o laço sai na primeira corrida e a coroa pede umas cinco ou seis: logo o
// primeiro, e sempre um próximo para querer.
export const ENFEITES = [
  {
    id: 'laco', vaga: 'cabeca', emoji: '🎀', name: 'Laço', preco: 60,
    // Ele olha para o lado: a miniatura o vê de lá, senão sai de perfil.
    vista: [-1, 0.25, -0.15],
    montar() {
      // Do lado esquerdo, atrás da orelha, olhando para fora.
      const g = laco(0xff5fa2, 1.5);
      g.position.set(-0.27, 0.27, 0.1);
      g.rotation.set(0, -Math.PI / 2, -0.35, 'YXZ');
      return { cabeca: g };
    },
  },
  {
    id: 'gravatinha', vaga: 'pescoco', emoji: '🦋', name: 'Gravatinha', preco: 80,
    montar() {
      const pescoco = noPescoco();
      pescoco.add(anel(0.27, 0.024, 0x2b2d6e, -0.02));
      const g = laco(0xe5304a, 1.25, { pontas: false });
      g.position.copy(FRENTE_DO_PESCOCO);
      g.rotation.set(0.35, Math.PI, 0);
      return { torso: [pescoco, g] };
    },
  },
  {
    id: 'coroaDeFlores', vaga: 'cabeca', emoji: '🌸', name: 'Coroa de flores', preco: 100,
    montar() {
      const g = new THREE.Group();
      g.position.set(0, 0.26, -0.03);
      g.rotation.x = -0.35;
      g.add(anel(0.26, 0.035, 0x5fae4a));
      const cores = [0xff8fc6, 0xffffff, 0xffd166, 0xc39bff, 0xff8fc6, 0xffffff, 0xffd166, 0xc39bff];
      cores.forEach((cor, i) => {
        const a = (i / cores.length) * Math.PI * 2 + 0.2;
        const flor = florzinha(cor, i % 2 ? 0xffb347 : 0xffd166, 1.75);
        const onde = new THREE.Vector3(Math.cos(a) * 0.26, 0.035, Math.sin(a) * 0.26);
        flor.position.copy(onde);
        // Cada flor olha para fora e um pouco para cima.
        flor.lookAt(onde.clone().multiplyScalar(2).setY(0.2));
        g.add(flor);
      });
      return { cabeca: g };
    },
  },
  {
    id: 'oculosEscuros', vaga: 'rosto', emoji: '🕶️', name: 'Óculos escuros', preco: 120,
    montar() {
      return { cabeca: oculos({ lente: 0x1d1b2e, aro: 0x111018 }) };
    },
  },
  {
    id: 'colar', vaga: 'pescoco', emoji: '📿', name: 'Colar de pérolas', preco: 150,
    montar() {
      const g = noPescoco();
      const perola = mat(0xfff8ef);
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), perola);
        // Pendurado: cai um tico mais na frente (z negativo) do que atrás.
        p.position.set(Math.cos(a) * 0.29, -0.04 - Math.max(0, -Math.sin(a)) * 0.07, Math.sin(a) * 0.29);
        g.add(p);
      }
      return { torso: g };
    },
  },
  {
    id: 'cachecol', vaga: 'pescoco', emoji: '🧣', name: 'Cachecol', preco: 150,
    montar() {
      const pescoco = noPescoco();
      const listras = [0xff6b6b, 0xfff3e0];
      // Três rolinhos empilhados, alternando a cor: é o que faz ler como
      // tricô listrado, e não como boia.
      [-0.1, -0.01, 0.08].forEach((y, i) => {
        pescoco.add(anel(0.275 - i * 0.012, 0.055, listras[i % 2], y));
      });
      const pontas = [];
      [[-0.07, 0.95], [-0.19, 1.02]].forEach(([x, fim], i) => {
        const curva = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x * 0.6, 1.3, -0.84),
          new THREE.Vector3(x, 1.16, -0.9),
          new THREE.Vector3(x * 1.2, fim, -0.86),
        ]);
        const ponta = new THREE.Mesh(new THREE.TubeGeometry(curva, 8, 0.052, 6), mat(listras[i % 2]));
        ponta.scale.x = 1;
        pontas.push(ponta);
        // Franja: três bolinhas no fim da ponta.
        const fimP = curva.getPoint(1);
        for (let k = -1; k <= 1; k++) {
          const f = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), mat(listras[(i + 1) % 2]));
          f.position.set(fimP.x + k * 0.03, fimP.y - 0.04, fimP.z);
          pontas.push(f);
        }
      });
      return { torso: [pescoco, ...pontas] };
    },
  },
  {
    id: 'oculosCoracao', vaga: 'rosto', emoji: '😍', name: 'Óculos de coração', preco: 180,
    montar() {
      return { cabeca: oculos({ lente: 0xff4f9a, aro: 0xff4f9a, formato: 'coracao' }) };
    },
  },
  {
    id: 'medalha', vaga: 'pescoco', emoji: '🏅', name: 'Medalha', preco: 200,
    montar() {
      const pescoco = noPescoco();
      pescoco.add(anel(0.28, 0.028, 0x3a7bff, -0.04));
      const fita = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.31, -0.83),
        new THREE.Vector3(0, 1.22, -0.88),
        new THREE.Vector3(0, 1.15, -0.87),
      ]), 6, 0.03, 5), mat(0x3a7bff));
      const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 14), mat(0xffc53d, { emissive: 0x4a3000 }));
      disco.rotation.x = Math.PI / 2 - 0.15;
      disco.position.set(0, 1.08, -0.87);
      const estrela = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
        const r = i % 2 ? 0.026 : 0.06;
        i ? estrela.lineTo(Math.cos(a) * r, Math.sin(a) * r) : estrela.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const brilho = new THREE.Mesh(
        new THREE.ExtrudeGeometry(estrela, { depth: 0.012, bevelEnabled: false }),
        mat(0xfff1a8, { emissive: 0x5a4a10 })
      );
      // A estrela fica na face da frente do disco (o disco deitado tem a
      // face em -y depois de girar; na frente do bicho é -z).
      brilho.rotation.set(-0.15, Math.PI, 0);
      brilho.position.set(0, 1.083, -0.89);
      return { torso: [pescoco, fita, disco, brilho] };
    },
  },
  {
    id: 'cartola', vaga: 'cabeca', emoji: '🎩', name: 'Cartola', preco: 250,
    montar() {
      const g = new THREE.Group();
      g.position.set(-0.15, 0.33, 0.07);
      g.rotation.set(0.1, 0, 0.5);
      const preto = mat(0x2a2438);
      const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.022, 16), preto);
      const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.22, 14), preto);
      copa.position.y = 0.12;
      const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.045, 14), mat(0xb455ff));
      faixa.position.y = 0.04;
      const flor = florzinha(0xff8fc6, 0xffd166, 0.9);
      flor.position.set(0, 0.05, 0.115);
      g.add(aba, copa, faixa, flor);
      return { cabeca: g };
    },
  },
  {
    id: 'coroa', vaga: 'cabeca', emoji: '👑', name: 'Coroa', preco: 400,
    montar() {
      // Assentada na base do chifre, com o chifre saindo pelo meio — a
      // inclinação é a dele (createUnicorn: rotation.x = -0.35).
      const g = new THREE.Group();
      g.position.set(0, 0.31, -0.08);
      g.rotation.x = -0.35;
      const ouro = mat(0xffc53d, { emissive: 0x3a2500 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.09, 16, 1, true), ouro);
      base.material.side = THREE.DoubleSide;
      g.add(base);
      const joias = [0xff4f9a, 0x4fc3ff, 0x7ee07a, 0xb455ff, 0xff9f43];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 5), ouro);
        ponta.position.set(Math.cos(a) * 0.165, 0.1, Math.sin(a) * 0.165);
        g.add(ponta);
        const bola = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), ouro);
        bola.position.set(Math.cos(a) * 0.165, 0.17, Math.sin(a) * 0.165);
        g.add(bola);
        const joia = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 5), mat(joias[i], { emissive: joias[i], emissiveIntensity: 0.25 }));
        const meio = a + Math.PI / 5;
        joia.position.set(Math.cos(meio) * 0.172, 0, Math.sin(meio) * 0.172);
        joia.scale.set(1, 1, 1);
        g.add(joia);
      }
      return { cabeca: g };
    },
  },

  // --- Patas ---------------------------------------------------------------
  // `perna(L)` monta a peça de **uma** perna; vestirEnfeites põe uma em cada.
  {
    id: 'tornozeleira', vaga: 'patas', emoji: '🌼', name: 'Tornozeleira de flores', preco: 90,
    montar: () => ({
      perna(L) {
        const g = new THREE.Group();
        g.position.y = acimaDoCasco(L);
        g.add(anel(0.105, 0.022, 0x5fae4a));
        const cores = [0xffffff, 0xffd166, 0xff8fc6, 0xffffff, 0xc39bff];
        cores.forEach((cor, i) => {
          const a = (i / cores.length) * Math.PI * 2;
          const flor = florzinha(cor, cor === 0xffd166 ? 0xff9f43 : 0xffd166, 1.2);
          const onde = new THREE.Vector3(Math.cos(a) * 0.115, 0, Math.sin(a) * 0.115);
          flor.position.copy(onde);
          flor.lookAt(onde.clone().multiplyScalar(3));
          g.add(flor);
        });
        return g;
      },
    }),
  },
  {
    id: 'polainas', vaga: 'patas', emoji: '🧦', name: 'Polainas', preco: 120,
    montar: () => ({
      perna(L) {
        // Fofas e listradas, do casco até perto do joelho: três rolinhos
        // de cada cor, um pouco mais largos que a canela.
        const g = new THREE.Group();
        const cores = [0xff8fc6, 0xc39bff];
        for (let i = 0; i < 6; i++) {
          const rolo = anel(0.098 + (i === 0 ? 0.01 : 0), 0.04, cores[i % 2], acimaDoCasco(L) + i * 0.052 * L);
          rolo.scale.z = 1;
          g.add(rolo);
        }
        return g;
      },
    }),
  },

  // --- Cauda ---------------------------------------------------------------
  {
    id: 'florNaCauda', vaga: 'cauda', emoji: '🌺', name: 'Flor na cauda', preco: 90, vista: [0.35, 0.3, 1],
    montar() {
      const g = new THREE.Group();
      g.add(anel(0.17, 0.03, 0x5fae4a, RAIZ_DA_CAUDA));
      // Um hibisco grande, de frente para trás.
      const flor = new THREE.Group();
      const petala = mat(0xff4f7a);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), petala);
        p.scale.set(0.8, 1.15, 0.35);
        p.position.set(Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0);
        p.rotation.z = a - Math.PI / 2;
        flor.add(p);
      }
      const miolo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.11, 5), mat(0xffd166));
      miolo.rotation.x = Math.PI / 2 - 0.4;
      miolo.position.set(0, 0.02, 0.05);
      const centro = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(0xb3123f));
      flor.add(miolo, centro);
      flor.position.set(0.05, RAIZ_DA_CAUDA, 0.22);
      flor.rotation.y = 0.25;
      flor.scale.setScalar(1.45);
      g.add(flor);
      return { cauda: g };
    },
  },
  {
    id: 'estrelaNaCauda', vaga: 'cauda', emoji: '⭐', name: 'Estrela na cauda', preco: 110, vista: [0.35, 0.3, 1],
    montar() {
      const g = new THREE.Group();
      g.add(anel(0.17, 0.03, 0xffc53d, RAIZ_DA_CAUDA));
      const estrela = estrelaGorda(0.18, 0xffd23d);
      estrela.position.set(0, RAIZ_DA_CAUDA, 0.22);
      g.add(estrela);
      return { cauda: g };
    },
  },

  // --- Chifre --------------------------------------------------------------
  {
    id: 'chifreArcoIris', vaga: 'chifre', emoji: '🌈', name: 'Chifre arco-íris', preco: 220,
    montar: () => ({
      chifre: ({ length, radius }) => coneEspiral(length, radius * 1.15,
        [0xff5d8f, 0xffa64d, 0xffd23d, 0x5fd38a, 0x4fb3ff, 0xa77bff], { voltas: 1.5 }),
    }),
  },
  {
    id: 'chifreDeCristal', vaga: 'chifre', emoji: '💎', name: 'Chifre de cristal', preco: 260,
    montar: () => ({
      chifre({ length, radius }) {
        // Um cristal facetado, meio transparente e acendendo por dentro,
        // com três cristaizinhos nascendo da base.
        const g = new THREE.Group();
        const vidro = () => mat(0x7fd4ff, { emissive: 0x2a8fd0, emissiveIntensity: 0.5, transparent: true, opacity: 0.92 });
        g.add(new THREE.Mesh(new THREE.ConeGeometry(radius * 1.25, length * 1.05, 5), vidro()));
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          const lasca = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.55, length * 0.38, 5), vidro());
          lasca.position.copy(naSuperficie(length, radius * 1.25, 0.1, a));
          lasca.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
          g.add(lasca);
        }
        return g;
      },
    }),
  },
  {
    id: 'chifreDeOuro', vaga: 'chifre', emoji: '✨', name: 'Chifre de ouro', preco: 300,
    montar: () => ({
      chifre({ length, radius }) {
        // Ouro em dois tons, em espiral, e três faíscas em volta da ponta.
        const g = new THREE.Group();
        g.add(coneEspiral(length, radius * 1.1, [0xffd23d, 0xffa21a], { voltas: 3, emissivo: 0x5a3a00 }));
        const brilho = mat(0xfff6c4, { emissive: 0xffe07a, emissiveIntensity: 0.9 });
        [[0.75, 0.2], [0.5, 2.3], [0.3, 4.3]].forEach(([h, a]) => {
          const f = new THREE.Mesh(new THREE.OctahedronGeometry(radius * 0.5, 0), brilho);
          f.position.copy(naSuperficie(length, radius * 2.6, h, a));
          f.scale.y = 1.6;
          g.add(f);
        });
        return g;
      },
    }),
  },
  {
    id: 'chifreDeNoite', vaga: 'chifre', emoji: '🌙', name: 'Chifre de noite estrelada', preco: 200,
    montar: () => ({
      chifre({ length, radius }) {
        // Azul de céu de noite, com pontinhos de estrela e uma estrela
        // de verdade na ponta.
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.ConeGeometry(radius * 1.15, length, 9), mat(0x3b2f8a, { emissive: 0x1a1250 })));
        const ponto = mat(0xfff1a8, { emissive: 0xffd166, emissiveIntensity: 0.9 });
        for (let i = 0; i < 9; i++) {
          const p = new THREE.Mesh(new THREE.OctahedronGeometry(radius * 0.18, 0), ponto);
          p.position.copy(naSuperficie(length, radius * 1.15, 0.08 + (i / 9) * 0.7, i * 2.4));
          g.add(p);
        }
        const estrela = estrelaGorda(radius * 1.3, 0xffd23d);
        estrela.position.y = length / 2 + radius * 0.6;
        estrela.rotation.y = Math.PI;
        g.add(estrela);
        return g;
      },
    }),
  },

  // --- Leva 3 --------------------------------------------------------------
  {
    id: 'chapeuDeFesta', vaga: 'cabeca', emoji: '🎉', name: 'Chapéu de festa', preco: 140,
    montar() {
      // Cone listrado, torto para a direita (o chifre fica livre), com
      // pompom na ponta.
      const g = new THREE.Group();
      g.position.set(0.17, 0.34, 0.06);
      g.rotation.set(0.12, 0, -0.55);
      const cone = coneEspiral(0.36, 0.13, [0x4fb3ff, 0xffd23d, 0xff5d8f], { voltas: 1.5 });
      cone.position.y = 0.18;
      const pompom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 1), mat(0xffffff));
      pompom.position.y = 0.38;
      const barra = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.022, 6, 16), mat(0xff5d8f));
      barra.rotation.x = Math.PI / 2;
      g.add(cone, pompom, barra);
      return { cabeca: g };
    },
  },
  {
    id: 'pena', vaga: 'cabeca', emoji: '🪶', name: 'Pena no cabelo', preco: 70,
    vista: [1, 0.3, -0.2],
    montar() {
      // Uma pena grande atrás da orelha direita, curvando para trás.
      const g = new THREE.Group();
      g.position.set(0.2, 0.3, 0.12);
      g.rotation.set(0.5, 0, -0.5);
      const corPena = [0x3fc9b0, 0x7a5cff];
      corPena.forEach((cor, i) => {
        const parte = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(cor));
        parte.scale.set(0.95, 1.7 - i * 0.55, 0.28);
        parte.position.y = 0.13 + i * 0.17;
        g.add(parte);
      });
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0xffd23d));
      olho.scale.z = 0.4;
      olho.position.set(0, 0.27, 0.03);
      const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.5, 5), mat(0xfff4e0));
      haste.position.y = 0.16;
      g.add(olho, haste);
      return { cabeca: g };
    },
  },
  {
    id: 'fones', vaga: 'cabeca', emoji: '🎧', name: 'Fones de ouvido', preco: 160,
    vista: [-0.6, 0.3, 1],
    montar() {
      // O arco passa atrás das orelhas e as conchas tapam os lados da
      // cabeça.
      const g = new THREE.Group();
      g.position.set(0, 0.03, 0.14);
      const arco = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 22, Math.PI), mat(0x7a5cff));
      g.add(arco);
      for (const lado of [-1, 1]) {
        const concha = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14), mat(0xff7fb0));
        concha.rotation.z = Math.PI / 2;
        concha.position.x = lado * 0.34;
        const almofada = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.03, 6, 14), mat(0xffffff));
        almofada.rotation.y = Math.PI / 2;
        almofada.position.x = lado * 0.3;
        const nota = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xffd23d, { emissive: 0x5a4000 }));
        nota.position.x = lado * 0.385;
        g.add(concha, almofada, nota);
      }
      return { cabeca: g };
    },
  },
  {
    id: 'brincosDeCereja', vaga: 'rosto', emoji: '🍒', name: 'Brincos de cereja', preco: 90,
    montar() {
      // Um par de cerejinhas pendurado de cada lado, embaixo da orelha.
      const pecas = [];
      for (const lado of [-1, 1]) {
        const g = new THREE.Group();
        g.position.set(lado * 0.3, 0.14, 0.06);
        g.scale.setScalar(1.35);
        const argola = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 5, 10), mat(0xffc53d));
        argola.rotation.y = Math.PI / 2;
        g.add(argola);
        const verde = mat(0x3f9f4a);
        for (const z of [-0.035, 0.035]) {
          const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 4), verde);
          cabo.position.set(0, -0.06, z / 2);
          cabo.rotation.x = z * 6;
          const cereja = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), mat(0xe5203a, { emissive: 0x3a0008 }));
          cereja.position.set(0, -0.12, z);
          g.add(cabo, cereja);
        }
        const folha = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), verde);
        folha.scale.set(0.4, 0.6, 1.4);
        folha.position.set(0, -0.025, 0.03);
        g.add(folha);
        pecas.push(g);
      }
      return { cabeca: pecas };
    },
  },
  {
    id: 'colarDeCristal', vaga: 'pescoco', emoji: '🔮', name: 'Colar de cristal', preco: 170,
    montar() {
      const g = noPescoco();
      g.add(anel(0.275, 0.016, 0xffc53d, -0.02));
      const cristal = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0),
        mat(0xb07cff, { emissive: 0x6a2fd0, emissiveIntensity: 0.6, transparent: true, opacity: 0.92 }));
      cristal.scale.y = 1.5;
      cristal.position.copy(FRENTE_DO_PESCOCO).add(new THREE.Vector3(0, -0.1, -0.02));
      const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.04, 8), mat(0xffc53d));
      tampa.position.copy(FRENTE_DO_PESCOCO).add(new THREE.Vector3(0, 0.03, 0));
      return { torso: [g, cristal, tampa] };
    },
  },
  {
    id: 'pulseirasDeConcha', vaga: 'patas', emoji: '🐚', name: 'Pulseiras de concha', preco: 100,
    montar: () => ({
      perna(L) {
        const g = new THREE.Group();
        g.position.y = acimaDoCasco(L);
        g.add(anel(0.105, 0.018, 0x4fc3d9));
        const cores = [0xffc9d6, 0xfff1d6, 0xffd8b0, 0xffc9d6];
        cores.forEach((cor, i) => {
          const a = (i / cores.length) * Math.PI * 2 + 0.4;
          const concha = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 7), mat(cor));
          concha.position.set(Math.cos(a) * 0.14, -0.01, Math.sin(a) * 0.14);
          concha.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
          g.add(concha);
        });
        const perola = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xffffff));
        perola.position.set(0, -0.01, 0.13);
        g.add(perola);
        return g;
      },
    }),
  },
  {
    id: 'balao', vaga: 'cauda', emoji: '🎈', name: 'Balão na cauda', preco: 120, vista: [0.6, 0.3, 1],
    montar() {
      // Amarrado na raiz do rabo, flutuando para cima e para trás. O rabo
      // pende ao longo de -y e vai inclinado: no grupo dele, "para cima" no
      // mundo é +y com um tanto de +z.
      const g = new THREE.Group();
      g.add(anel(0.17, 0.025, 0xff5d8f, RAIZ_DA_CAUDA));
      const no = new THREE.Vector3(0.05, RAIZ_DA_CAUDA, 0.18);
      const balao = new THREE.Vector3(0.22, 0.55, 0.75);
      const fio = new THREE.CatmullRomCurve3([no, new THREE.Vector3(0.18, 0.15, 0.5), balao.clone().add(new THREE.Vector3(0, -0.2, 0))]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(fio, 12, 0.008, 4), mat(0xffffff)));
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), mat(0xff3b6a, { emissive: 0x4a0010 }));
      bola.scale.y = 1.2;
      bola.position.copy(balao);
      const bico = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 6), mat(0xd9204f));
      bico.position.copy(balao).add(new THREE.Vector3(0, -0.21, 0));
      bico.rotation.x = Math.PI;
      const reflexo = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5 }));
      reflexo.scale.set(0.6, 1.2, 0.4);
      reflexo.position.copy(balao).add(new THREE.Vector3(-0.07, 0.08, 0.13));
      g.add(bola, bico, reflexo);
      return { cauda: g };
    },
  },
  {
    id: 'coracaoNaCauda', vaga: 'cauda', emoji: '💖', name: 'Coração na cauda', preco: 100, vista: [0.35, 0.3, 1],
    montar() {
      const g = new THREE.Group();
      g.add(anel(0.17, 0.03, 0xff7fb0, RAIZ_DA_CAUDA));
      const coracao = coracaoGordo(0.32, 0xff5d8f);
      coracao.position.set(0, RAIZ_DA_CAUDA, 0.22);
      g.add(coracao);
      const brilho = mat(0xfff1a8, { emissive: 0xffd166, emissiveIntensity: 0.9 });
      [[-0.2, 0.1], [0.19, -0.08]].forEach(([x, y]) => {
        const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), brilho);
        f.scale.y = 1.6;
        f.position.set(x, RAIZ_DA_CAUDA + y, 0.24);
        g.add(f);
      });
      return { cauda: g };
    },
  },
  {
    id: 'chifreDeGelo', vaga: 'chifre', emoji: '🧊', name: 'Chifre de gelo', preco: 240,
    montar: () => ({
      chifre({ length, radius }) {
        // Gelo azulado meio transparente, com pontas de geada saindo pelos
        // lados e um montinho de neve na base.
        const g = new THREE.Group();
        const gelo = () => mat(0xd6f4ff, { emissive: 0x5fb8e0, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 });
        g.add(new THREE.Mesh(new THREE.ConeGeometry(radius * 1.15, length, 6), gelo()));
        for (let i = 0; i < 5; i++) {
          const h = 0.15 + i * 0.15;
          const a = i * 2.3;
          const ponta = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.35, length * 0.22, 4), gelo());
          ponta.position.copy(naSuperficie(length, radius * 1.15, h, a));
          ponta.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
          g.add(ponta);
        }
        const neve = mat(0xffffff);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.55, 0), neve);
          bola.position.set(Math.cos(a) * radius * 1.05, -length / 2 + radius * 0.2, Math.sin(a) * radius * 1.05);
          g.add(bola);
        }
        return g;
      },
    }),
  },
  {
    id: 'chifreDeFogo', vaga: 'chifre', emoji: '🔥', name: 'Chifre de fogo', preco: 280,
    montar: () => ({
      chifre({ length, radius }) {
        // Um núcleo laranja acesso e línguas de fogo amarelas subindo em
        // volta, mais compridas embaixo — o desenho de uma chama.
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.ConeGeometry(radius * 1.1, length, 8),
          mat(0xff7a1a, { emissive: 0xff4a00, emissiveIntensity: 0.75 })));
        const amarelo = mat(0xffd84a, { emissive: 0xffa000, emissiveIntensity: 0.8 });
        const vermelho = mat(0xff3b2a, { emissive: 0xc01000, emissiveIntensity: 0.7 });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const h = 0.08 + (i % 2) * 0.12;
          const lingua = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.6, length * (0.5 - (i % 2) * 0.12), 5), i % 2 ? vermelho : amarelo);
          const onde = naSuperficie(length, radius * 1.1, h, a);
          lingua.position.copy(onde).add(new THREE.Vector3(0, length * 0.18, 0));
          lingua.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
          g.add(lingua);
        }
        const ponta = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.45, length * 0.3, 5), amarelo);
        ponta.position.y = length * 0.55;
        g.add(ponta);
        return g;
      },
    }),
  },

  // --- Natal ---------------------------------------------------------------
  // `natal` junta estes numa seção própria na tela dos enfeites.
  {
    id: 'gorroDeNatal', vaga: 'cabeca', emoji: '🎅', name: 'Gorro de Papai Noel', preco: 200, natal: true,
    montar() {
      // Inclinado para o lado, como a cartola: o chifre fica livre.
      const g = new THREE.Group();
      g.position.set(-0.15, 0.34, 0.06);
      g.rotation.set(0.15, 0, 0.55);
      const vermelho = mat(0xe5304a);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.16, 0.2, 12), vermelho);
      base.position.y = 0.1;
      // A ponta cai para o lado, mole, como gorro de verdade.
      const dobra = new THREE.Group();
      dobra.position.y = 0.2;
      dobra.rotation.z = 1.0;
      const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 10), vermelho);
      ponta.position.y = 0.09;
      dobra.add(ponta);
      const pompom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), mat(0xffffff));
      pompom.position.y = 0.19;
      dobra.add(pompom);
      const barra = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.045, 7, 18), mat(0xffffff));
      barra.rotation.x = Math.PI / 2;
      g.add(base, dobra, barra);
      return { cabeca: g };
    },
  },
  {
    id: 'chifresDeRena', vaga: 'cabeca', emoji: '🦌', name: 'Chifres de rena', preco: 250, natal: true, vista: [0, 0.15, -1],
    montar() {
      // Atrás das orelhas, abrindo para os lados — e o nariz vermelho na
      // ponta do focinho, que é o que faz ler "rena" e não "galho".
      const g = new THREE.Group();
      const marrom = mat(0x8f552a);
      for (const lado of [-1, 1]) {
        const tronco = new THREE.CatmullRomCurve3([
          new THREE.Vector3(lado * 0.1, 0.26, 0.1),
          new THREE.Vector3(lado * 0.16, 0.42, 0.14),
          new THREE.Vector3(lado * 0.28, 0.56, 0.18),
          new THREE.Vector3(lado * 0.36, 0.66, 0.14),
        ]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(tronco, 10, 0.045, 6), marrom));
        for (const [t, dx, dy] of [[0.4, -0.02, 0.13], [0.7, 0.08, 0.1]]) {
          const de = tronco.getPoint(t);
          const galho = new THREE.CatmullRomCurve3([
            de, de.clone().add(new THREE.Vector3(lado * dx * 0.5, dy * 0.6, -0.02)),
            de.clone().add(new THREE.Vector3(lado * dx, dy, -0.04)),
          ]);
          g.add(new THREE.Mesh(new THREE.TubeGeometry(galho, 5, 0.034, 5), marrom));
        }
      }
      const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xff2a3a, { emissive: 0xaa0010, emissiveIntensity: 0.8 }));
      nariz.position.set(0, -0.07, -0.49);
      g.add(nariz);
      return { cabeca: g };
    },
  },
  {
    id: 'guirlanda', vaga: 'pescoco', emoji: '🎄', name: 'Guirlanda', preco: 180, natal: true, vista: [-0.3, 1, -0.7],
    montar() {
      const g = noPescoco();
      g.add(anel(0.28, 0.06, 0x2f8f4a, -0.03));
      // Folhinhas de pinheiro em volta e as bolinhas coloridas.
      const verde = mat(0x3fae5a);
      const cores = [0xff3b4f, 0xffd166, 0x4fc3ff, 0xff3b4f, 0xffd166, 0xb455ff];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 4), verde);
        f.position.set(Math.cos(a) * 0.31, -0.03, Math.sin(a) * 0.31);
        f.rotation.set(Math.PI / 2, 0, -a + (i % 2 ? 0.5 : -0.5));
        g.add(f);
      }
      cores.forEach((cor, i) => {
        const a = (i / cores.length) * Math.PI * 2 + 0.3;
        const bola = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(cor, { emissive: cor, emissiveIntensity: 0.25 }));
        bola.position.set(Math.cos(a) * 0.33, -0.06, Math.sin(a) * 0.33);
        g.add(bola);
      });
      const fita = laco(0xe5304a, 1.1, { pontas: true });
      fita.position.copy(FRENTE_DO_PESCOCO);
      fita.rotation.set(0.35, Math.PI, 0);
      return { torso: [g, fita] };
    },
  },
  {
    id: 'sininhos', vaga: 'patas', emoji: '🔔', name: 'Sininhos', preco: 150, natal: true,
    montar: () => ({
      perna(L) {
        const g = new THREE.Group();
        g.position.y = acimaDoCasco(L) + 0.02;
        g.add(anel(0.105, 0.024, 0xe5304a));
        // Dois sininhos, um de cada lado, e um atrás (que a câmera vê).
        [[1, 0], [-1, 0], [0, 1]].forEach(([x, z]) => {
          const s = sininho(1.15);
          s.position.set(x * 0.12, -0.045, z * 0.12);
          g.add(s);
        });
        return g;
      },
    }),
  },
  {
    id: 'chifreDeDoce', vaga: 'chifre', emoji: '🍭', name: 'Chifre de bengala doce', preco: 180, natal: true,
    montar: () => ({
      chifre: ({ length, radius }) => coneEspiral(length, radius * 1.15, [0xffffff, 0xe5304a], { voltas: 3 }),
    }),
  },
  {
    id: 'lacoDePresente', vaga: 'cauda', emoji: '🎁', name: 'Laço de presente', preco: 130, natal: true, vista: [0.35, 0.3, 1],
    montar() {
      const g = new THREE.Group();
      // A fita verde enrolada na raiz e o laço vermelho virado para trás.
      g.add(anel(0.17, 0.035, 0x2f9f4a, RAIZ_DA_CAUDA));
      g.add(anel(0.17, 0.035, 0x2f9f4a, RAIZ_DA_CAUDA - 0.09));
      const l = laco(0xe5304a, 1.5);
      l.position.set(0, RAIZ_DA_CAUDA - 0.04, 0.2);
      g.add(l);
      return { cauda: g };
    },
  },

  // --- Asas ---------------------------------------------------------------
  // Não vão por cima: trocam as asas do unicórnio (ver trocarAsas, em
  // unicorn.js). `asa` é no mesmo formato da asa de um personagem
  // (`{ style, colors, scale }`), mais `material` e `brilho` quando precisa.
  // A miniatura olha de trás e de cima, que é como a asa se vê na corrida.
  {
    id: 'asasDeMorcego', vaga: 'asas', emoji: '🦇', name: 'Asas de morcego', preco: 180, vista: [0, 0.8, 1],
    montar: () => ({ asa: { style: 'bat', colors: [0x4a3f66, 0x5c4f7d, 0x3a3150] } }),
  },
  {
    id: 'asasDeBorboleta', vaga: 'asas', emoji: '🦋', name: 'Asas de borboleta', preco: 220, vista: [0, 0.8, 1],
    montar: () => ({ asa: { style: 'butterfly', colors: [0x8f6bff, 0x4cc9f0, 0xff8fd8], scale: 1.05 } }),
  },
  {
    // Nuvem fofinha: o véu branco, maior que a asa de sempre.
    id: 'asasDeNuvem', vaga: 'asas', emoji: '☁️', name: 'Asas de nuvem', preco: 240, vista: [0, 0.8, 1],
    montar: () => ({ asa: { style: 'veil', colors: [0xffffff, 0xf2f6ff, 0xe6eeff], scale: 1.25 } }),
  },
  {
    id: 'asasDeGelo', vaga: 'asas', emoji: '🧊', name: 'Asas de gelo', preco: 260, vista: [0, 0.8, 1],
    montar: () => ({
      asa: {
        style: 'ray', colors: [0xeaf9ff, 0xbfe9ff, 0x9ed8f5, 0xd9f4ff],
        material: { transparent: true, opacity: 0.8 }, brilho: 0.15,
      },
    }),
  },
  {
    id: 'asasDeArcoIris', vaga: 'asas', emoji: '🌈', name: 'Asas de arco-íris', preco: 280, vista: [0, 0.8, 1],
    montar: () => ({
      asa: { style: 'feather', colors: [0xff5d5d, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc] },
    }),
  },
  {
    // Lâminas de metal em vez de penas: o raio pontudo, em cinzas.
    id: 'asasDeFerro', vaga: 'asas', emoji: '🛡️', name: 'Asas de ferro', preco: 300, vista: [0, 0.8, 1],
    montar: () => ({
      asa: { style: 'ray', colors: [0xb4bac6, 0x8f95a1, 0xa3a9b5, 0x7d8390, 0x6a707c], scale: 1.05 },
    }),
  },
  {
    // Bala de goma: o véu redondo em listras de doce, uma cor por pena.
    id: 'asasDeDoce', vaga: 'asas', emoji: '🍭', name: 'Asas de doce', preco: 230, vista: [0, 0.8, 1],
    montar: () => ({
      asa: { style: 'veil', colors: [0xff7bac, 0xfff1f6, 0x9ce0ff, 0xfff1f6, 0xffd166], scale: 1.1 },
    }),
  },
  {
    // Penas douradas com uma estrelinha acesa na ponta de cada uma.
    id: 'asasDeEstrela', vaga: 'asas', emoji: '⭐', name: 'Asas de estrela', preco: 290, vista: [0, 0.8, 1],
    montar: () => ({
      asa: { style: 'ray', colors: [0xfff3c4, 0xffe38a, 0xffd84d, 0xfff8dd], brilho: 0.2, ponta: 'estrela' },
    }),
  },
  {
    // Membrana verde de quatro dedos, com uma garrinha em cada ponta.
    id: 'asasDeDragao', vaga: 'asas', emoji: '🐉', name: 'Asas de dragão', preco: 340, vista: [0, 0.8, 1],
    montar: () => ({
      asa: { style: 'dragon', colors: [0x3f9a52, 0x2f7a3a, 0x5cb06a, 0x4f9e5c], ponta: 'garra', scale: 1.1 },
    }),
  },
  {
    // Acesa na própria cor, como labareda.
    id: 'asasDeFogo', vaga: 'asas', emoji: '🔥', name: 'Asas de fogo', preco: 320, vista: [0, 0.8, 1],
    montar: () => ({
      asa: { style: 'ray', colors: [0xff4d1f, 0xff7a1f, 0xffab1f, 0xffd166, 0xfff0a8], brilho: 0.55, scale: 1.1 },
    }),
  },
  {
    // Quase não se vê: um vidrinho com um brilho de leve, só o contorno.
    id: 'asasInvisiveis', vaga: 'asas', emoji: '🫧', name: 'Asas invisíveis', preco: 350, vista: [0, 0.8, 1],
    montar: () => ({
      asa: {
        style: 'feather', colors: [0xffffff, 0xeaf6ff, 0xf5ecff],
        material: { transparent: true, opacity: 0.22, depthWrite: false }, brilho: 0.4,
      },
    }),
  },
];

export const ENFEITE = Object.fromEntries(ENFEITES.map((e) => [e.id, e]));

function descartar(objeto) {
  objeto.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    o.material.dispose();
  });
}

// Veste o unicórnio (de createUnicorn) com o que ele está usando:
// `vestindo` é `{ cabeca: 'coroa', rosto: null, pescoco: 'colar' }`. Tira
// antes o que ele vestia, então serve tanto para montar quanto para trocar.
export function vestirEnfeites(unicornio, vestindo = {}) {
  const { head, torso, tail, legs, horn } = unicornio.userData;
  // O chifre de verdade volta a aparecer; quem trocar de chifre esconde
  // de novo logo abaixo.
  if (horn) horn.visible = true;
  for (const peca of unicornio.userData.enfeites || []) {
    peca.parent?.remove(peca);
    descartar(peca);
  }
  const pecas = [];
  let asa = null;
  for (const vaga of VAGAS) {
    const enfeite = ENFEITE[vestindo?.[vaga]];
    if (!enfeite || enfeite.vaga !== vaga) continue;
    const montado = enfeite.montar();
    const colocar = (peca, alvo) => {
      peca.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      alvo.add(peca);
      pecas.push(peca);
    };
    for (const [onde, alvo] of [['cabeca', head], ['torso', torso], ['cauda', tail]]) {
      for (const peca of [montado[onde] || []].flat()) {
        if (peca.userData.pescoco) abrirSobreACrina(peca);
        colocar(peca, alvo);
      }
    }
    // Chifre: no lugar do de verdade, nas medidas dele, e o de verdade some.
    if (montado.chifre && horn) {
      const lugar = new THREE.Group();
      lugar.position.copy(horn.position);
      lugar.rotation.copy(horn.rotation);
      const { height: length, radius } = horn.geometry.parameters;
      lugar.add(montado.chifre({ length, radius }));
      colocar(lugar, head);
      horn.visible = false;
    }
    // Asas: não é peça por cima, é a asa inteira trocada (ver trocarAsas).
    if (montado.asa) asa = montado.asa;
    // Patas: uma peça em cada perna, medida pelo tamanho dela.
    if (montado.perna) {
      for (const perna of legs || []) {
        const joelho = perna.userData.joelho;
        colocar(montado.perna(joelho.userData.L ?? 1), joelho);
      }
    }
  }
  // Troca as asas quando há uma de enfeite — e desfaz quando ela sai.
  if (asa || unicornio.userData.asasTrocadas) {
    trocarAsas(unicornio, asa);
    unicornio.userData.asasTrocadas = !!asa;
  }
  unicornio.userData.enfeites = pecas;
  return pecas;
}

// O enfeite sozinho, para a miniatura da loja: as peças juntas num grupo,
// nas mesmas medidas de quando está no unicórnio (quem desenha centraliza).
export function montarEnfeiteSozinho(id) {
  const g = new THREE.Group();
  const montado = ENFEITE[id].montar();
  for (const peca of [montado.cabeca || [], montado.torso || [], montado.cauda || []].flat()) g.add(peca);
  // As asas, o par aberto.
  if (montado.asa) g.add(parDeAsas(montado.asa));
  // O chifre nas medidas do chifre da Uni.
  if (montado.chifre) g.add(montado.chifre({ length: 0.62, radius: 0.09 }));
  // Das patas, duas pernas lado a lado: uma só ficava parecendo um anel
  // solto, sem dizer onde vai.
  if (montado.perna) {
    for (const x of [-0.16, 0.16]) {
      const peca = montado.perna(1);
      peca.position.x += x;
      g.add(peca);
    }
  }
  return g;
}

export const precoDoEnfeite = (enfeite) => enfeite?.preco || 0;
