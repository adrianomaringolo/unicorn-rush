// O que fica voando em volta de cada unicórnio enquanto ele corre.
//
// Não é o rastro (esse é o arco-íris do chão, em rainbowTrail.js) nem as
// auras de power-up (auras.js, que vêm e vão com o efeito). Isto aqui é o
// **jeito de cada um**: o Relâmpago solta raios, o Musgo perde folhinhas, o
// Floco larga gelo. Está sempre ligado, e é o que faz dar para reconhecer
// quem está correndo mesmo de longe.
//
// Cada personagem descreve o seu em `characters.js`:
//
//   aura: { kind: 'raio', color: 0xfff44f, count: 9 }
//
// `kind` escolhe a forma (as de FORMAS, abaixo) e `color` pode ser uma cor
// só ou uma lista — no caso da Uni, o arco-íris inteiro.
import * as THREE from 'three';

// As formas. Todas minúsculas e de poucas faces: são até uma dúzia na tela,
// mas rodam em todo quadro de todo celular.
const FORMAS = {
  // Faísca genérica: um octaedro, que de qualquer ângulo lê como brilho.
  faisca: () => new THREE.OctahedronGeometry(0.13, 0),

  // Raio: um zigue-zague fino, achatado, que pisca.
  raio: () => {
    const forma = new THREE.Shape();
    forma.moveTo(0.03, 0.25);
    forma.lineTo(-0.09, 0.015);
    forma.lineTo(0.0, 0.0);
    forma.lineTo(-0.045, -0.25);
    forma.lineTo(0.10, -0.015);
    forma.lineTo(0.015, 0.0);
    forma.closePath();
    return new THREE.ExtrudeGeometry(forma, { depth: 0.04, bevelEnabled: false }).center();
  },

  // Folha: um losango alongado, com uma dobra no meio.
  folha: () => {
    const forma = new THREE.Shape();
    forma.moveTo(0, 0.19);
    forma.quadraticCurveTo(0.13, 0.03, 0, -0.19);
    forma.quadraticCurveTo(-0.13, 0.03, 0, 0.19);
    return new THREE.ExtrudeGeometry(forma, { depth: 0.03, bevelEnabled: false }).center();
  },

  // Floco: três barrinhas cruzadas, como um floco de neve de verdade.
  floco: () => {
    const barras = [];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.BoxGeometry(0.34, 0.045, 0.045);
      b.rotateZ((i * Math.PI) / 3);
      barras.push(b);
    }
    return mesclar(barras);
  },

  // Bolha / gota: uma esferinha.
  bolha: () => new THREE.SphereGeometry(0.14, 8, 6),

  // Anel: uma argolinha fina que nasce pequena e vai abrindo. Substituiu a
  // "baforada" (uma esfera translúcida), que de perto lia como bolha de gás
  // e não como fumaça — esfera cheia não tem jeito de fumaça nenhum.
  anel: () => new THREE.TorusGeometry(0.13, 0.022, 5, 14),

  // Morcego: uma silhueta chapada, para o unicórnio da meia-noite.
  morcego: () => {
    const forma = new THREE.Shape();
    forma.moveTo(0, 0.04);
    forma.lineTo(-0.24, 0.12);
    forma.quadraticCurveTo(-0.13, -0.02, -0.055, 0.005);
    forma.lineTo(0, -0.06);
    forma.lineTo(0.055, 0.005);
    forma.quadraticCurveTo(0.13, -0.02, 0.24, 0.12);
    forma.closePath();
    return new THREE.ExtrudeGeometry(forma, { depth: 0.02, bevelEnabled: false }).center();
  },
};

// Junta geometrias sem depender do BufferGeometryUtils (que não está no
// vendor): copia os atributos na mão, que para três caixinhas é trivial.
function mesclar(geos) {
  const posicoes = [];
  const normais = [];
  for (const g of geos) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const index = g.index;
    const conta = index ? index.count : p.count;
    for (let i = 0; i < conta; i++) {
      const k = index ? index.getX(i) : i;
      posicoes.push(p.getX(k), p.getY(k), p.getZ(k));
      normais.push(n.getX(k), n.getY(k), n.getZ(k));
    }
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normais, 3));
  return geo;
}

// Onde as partículas nascem: uma caixa em volta do corpo, um pouco atrás da
// cabeça, para elas parecerem sair dele e não flutuarem à frente.
const NASCE = { x: 1.1, y: [0.6, 2.1], z: [-0.3, 1.1] };

const sorteio = (a, b) => a + Math.random() * (b - a);

export function createCharacterAura(character) {
  const spec = character.aura;
  if (!spec || !FORMAS[spec.kind]) return null;

  const geo = FORMAS[spec.kind]();
  const cores = Array.isArray(spec.color) ? spec.color : [spec.color];
  const grupo = new THREE.Group();

  for (let i = 0; i < (spec.count ?? 8); i++) {
    const peca = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: cores[i % cores.length],
      transparent: true,
      opacity: spec.opacity ?? 0.9,
      depthWrite: false,
      fog: false,
    }));
    // Vidas negativas escalonadas: elas entram em cena aos poucos, e não
    // todas de uma vez no primeiro quadro.
    peca.userData = { vida: -i * 0.12, total: 1 };
    grupo.add(peca);
  }

  grupo.userData = { spec, geo, cores };
  grupo.renderOrder = 2;
  return grupo;
}

// Cada peça nasce junto ao corpo, sai andando para trás e some. `speed` é a
// velocidade da corrida: quanto mais rápido, mais para trás elas ficam.
export function updateCharacterAura(aura, dt, time, speed = 10) {
  if (!aura) return;
  const { spec } = aura.userData;
  const opacidadeBase = spec.opacity ?? 0.9;
  const arrasto = 0.25 + speed * 0.055;

  aura.children.forEach((peca, i) => {
    const d = peca.userData;
    d.vida -= dt;

    if (d.vida <= 0) {
      d.total = sorteio(0.75, 1.35);
      d.vida = d.total;
      peca.position.set(
        sorteio(-NASCE.x, NASCE.x),
        sorteio(NASCE.y[0], NASCE.y[1]),
        sorteio(NASCE.z[0], NASCE.z[1])
      );
      d.deriva = new THREE.Vector3(sorteio(-0.35, 0.35), sorteio(-0.1, 0.75), 1);
      d.giro = sorteio(-4, 4);
      peca.rotation.set(sorteio(0, 6.3), sorteio(0, 6.3), sorteio(0, 6.3));
      peca.visible = true;
    }
    if (d.vida < 0) return;

    peca.position.x += d.deriva.x * dt;
    peca.position.y += d.deriva.y * dt;
    peca.position.z += (d.deriva.z * arrasto) * dt;
    peca.rotation.z += d.giro * dt;
    peca.rotation.x += d.giro * 0.6 * dt;

    const t = 1 - d.vida / d.total;
    // O anel abre enquanto some, como fumaça de verdade; o resto nasce
    // pequeno, cresce um pouco e encolhe no fim.
    const escala = spec.kind === 'anel'
      ? (spec.scale ?? 1) * (0.35 + t * 1.9)
      : (spec.scale ?? 1) * (0.5 + Math.min(1, t * 4) * 0.5) * (1 - t * 0.35);
    peca.scale.setScalar(escala);
    peca.material.opacity = opacidadeBase * (1 - t) ** 0.8;

    // O morcego bate asa: a silhueta se estreita e se abre enquanto voa.
    if (spec.kind === 'morcego') {
      peca.scale.x = escala * (0.45 + Math.abs(Math.sin(time * 11 + i)) * 0.75);
    }

    // O raio não desaparece suave: ele pisca, que é o que raio faz.
    if (spec.kind === 'raio') peca.visible = Math.sin(time * 34 + i * 2.1) > -0.25;
  });
}
