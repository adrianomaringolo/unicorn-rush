// Rastro colorido que fica atrás do unicórnio.
// É uma fita de faixas que guarda o caminho percorrido: quando o unicórnio
// muda de pista, o rastro faz a curva junto, com atraso. As cores e a largura
// vêm do personagem escolhido (ver src/models/characters.js).
import * as THREE from 'three';

const ROWS = 30;        // fatias ao longo do rastro
const SPACING = 0.36;   // distância entre fatias (unidades do mundo)
const START_Z = 0.55;   // começa logo atrás do rabo

const RUSH_WIDTH = 1.9;   // o quanto o rastro engorda com o ⚡ ligado
const STARS = 16;         // estrelinhas que aparecem em cima dele

const DEFAULT_TRAIL = {
  colors: [0xff7b9d, 0xffb26b, 0xffe36b, 0x8ce99a, 0x74c0fc, 0xc09cff],
  width: 0.8,
};

export function createRainbowTrail(trail = DEFAULT_TRAIL) {
  const stripes = trail.colors || DEFAULT_TRAIL.colors;
  const width = trail.width || DEFAULT_TRAIL.width;
  const cols = stripes.length;
  const vertsPerRow = cols + 1;
  const count = vertsPerRow * ROWS;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);   // RGBA: o alfa some no fim do rastro
  const indices = [];

  for (let r = 0; r < ROWS; r++) {
    const t = r / (ROWS - 1);
    const fade = (1 - t) ** 1.6;
    for (let c = 0; c <= cols; c++) {
      const i = r * vertsPerRow + c;
      positions[i * 3 + 2] = START_Z + r * SPACING;

      // Cada coluna pega a cor da faixa (a última repete a anterior).
      const stripe = new THREE.Color(stripes[Math.min(c, cols - 1)]);
      colors[i * 4 + 0] = stripe.r;
      colors[i * 4 + 1] = stripe.g;
      colors[i * 4 + 2] = stripe.b;
      colors[i * 4 + 3] = fade * 0.9;
    }
  }

  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * vertsPerRow + c;
      const b = a + 1;
      const d = a + vertsPerRow;
      const e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  geo.setIndex(indices);

  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  }));
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  // Estrelinhas do modo velocidade: ficam escondidas e só acendem quando o
  // ⚡ está ligado (ver `rush` em updateRainbowTrail). São filhas do rastro,
  // então acompanham a fita sem precisar de nada no laço do jogo.
  const stars = [];
  const starGeo = starShape();
  const branco = new THREE.Color(0xffffff);
  for (let i = 0; i < STARS; i++) {
    // Puxadas para o branco: com a cor cheia da faixa elas desapareciam
    // dentro do próprio rastro, que já é colorido.
    const cor = new THREE.Color(stripes[i % stripes.length]).lerp(branco, 0.65);
    const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({
      color: cor, transparent: true, opacity: 0,
      depthWrite: false, side: THREE.DoubleSide, fog: false,
      blending: THREE.AdditiveBlending,
    }));
    star.visible = false;
    star.userData = { fase: Math.random() * Math.PI * 2, faixa: Math.random(), fila: i / STARS };
    mesh.add(star);
    stars.push(star);
  }

  mesh.userData = {
    cols,
    vertsPerRow,
    width,
    stars,
    rushLook: 0,
    history: Array.from({ length: ROWS }, () => ({ x: 0, y: 0 })),
    travelled: 0,
  };

  return mesh;
}

// Uma estrela de cinco pontas chapada, compartilhada por todas as
// estrelinhas do rastro.
function starShape() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.21 : 0.09;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function resetRainbowTrail(trail, x = 0, y = 0) {
  for (const sample of trail.userData.history) { sample.x = x; sample.y = y; }
  trail.userData.travelled = 0;
}

export function updateRainbowTrail(trail, dt, speed, x, y, time, rush = false) {
  const { cols, vertsPerRow, width: normalWidth, history, stars } = trail.userData;

  // O ⚡ engorda o rastro; a transição é suave, para ele não dar um pulo de
  // largura no meio da corrida.
  trail.userData.rushLook += ((rush ? 1 : 0) - trail.userData.rushLook) * Math.min(1, 6 * dt);
  const forca = trail.userData.rushLook;
  const baseWidth = normalWidth * (1 + (RUSH_WIDTH - 1) * forca);

  // Empurra o histórico para trás sempre que o mundo andou uma fatia.
  trail.userData.travelled += speed * dt;
  while (trail.userData.travelled >= SPACING) {
    trail.userData.travelled -= SPACING;
    history.pop();
    history.unshift({ x, y });
  }
  history[0].x = x;
  history[0].y = y;

  const pos = trail.geometry.attributes.position;
  for (let r = 0; r < ROWS; r++) {
    const t = r / (ROWS - 1);
    const sample = history[r];
    const width = baseWidth * (1 - t * 0.45);
    // Ondinha que percorre o rastro — dá vida mesmo em linha reta.
    const wave = Math.sin(time * 5 - r * 0.42) * 0.16 * t;
    const rise = t * t * 0.55;                     // o rastro sobe um pouquinho ao fundo

    for (let c = 0; c <= cols; c++) {
      const i = r * vertsPerRow + c;
      pos.array[i * 3 + 0] = sample.x + (c / cols - 0.5) * width;
      pos.array[i * 3 + 1] = 1.2 + sample.y * 0.8 + wave + rise
        + Math.sin(time * 3 + c * 0.9) * 0.04 * t;
    }
  }
  pos.needsUpdate = true;

  // As estrelinhas correm por cima da fita, cada uma na sua faixa, piscando
  // e girando. Fora do ⚡ elas ficam invisíveis e não custam nada.
  const acesas = forca > 0.02;
  for (const star of stars) {
    star.visible = acesas;
    if (!acesas) continue;

    const { fase, faixa, fila } = star.userData;
    // Anda de trás para a frente num ciclo, para parecer que sai do unicórnio.
    const t = (time * 0.55 + fila) % 1;
    const r = Math.min(ROWS - 1, Math.floor(t * (ROWS - 1)));
    const sample = history[r];
    const largura = baseWidth * (1 - t * 0.45);

    star.position.set(
      sample.x + (faixa - 0.5) * largura * 0.9,
      1.24 + sample.y * 0.8 + t * t * 0.55 + Math.sin(time * 5 - r * 0.42) * 0.16 * t + 0.14,
      START_Z + r * SPACING
    );
    star.rotation.z = time * 2 + fase;
    const brilho = 0.6 + Math.sin(time * 7 + fase) * 0.4;
    star.material.opacity = brilho * forca * (1 - t * 0.7);
    star.scale.setScalar((0.7 + brilho * 0.5) * (1 - t * 0.35));
  }
}
