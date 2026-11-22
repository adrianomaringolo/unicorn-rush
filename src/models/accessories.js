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

const mat = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

export const VAGAS = ['cabeca', 'rosto', 'pescoco', 'patas', 'cauda'];

// O pescoço de createUnicorn: centro, inclinação e o raio perto da cabeça.
const PESCOCO = { y: 1.46, z: -0.58, inclina: -0.5 };

// Um grupo alinhado ao pescoço: o eixo y dele corre ao longo do pescoço, e
// um anel deitado no plano xz abraça o pescoço sem ficar torto.
function noPescoco() {
  const g = new THREE.Group();
  g.position.set(0, PESCOCO.y, PESCOCO.z);
  g.rotation.x = PESCOCO.inclina;
  return g;
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
  const { head, torso, tail, legs } = unicornio.userData;
  for (const peca of unicornio.userData.enfeites || []) {
    peca.parent?.remove(peca);
    descartar(peca);
  }
  const pecas = [];
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
      for (const peca of [montado[onde] || []].flat()) colocar(peca, alvo);
    }
    // Patas: uma peça em cada perna, medida pelo tamanho dela.
    if (montado.perna) {
      for (const perna of legs || []) {
        const joelho = perna.userData.joelho;
        colocar(montado.perna(joelho.userData.L ?? 1), joelho);
      }
    }
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
