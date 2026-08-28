// Rastro colorido que fica atrás do unicórnio.
// É uma fita de faixas que guarda o caminho percorrido: quando o unicórnio
// muda de pista, o rastro faz a curva junto, com atraso. As cores e a largura
// vêm do personagem escolhido (ver src/models/characters.js).
import * as THREE from 'three';

const ROWS = 30;        // fatias ao longo do rastro
const SPACING = 0.36;   // distância entre fatias (unidades do mundo)
const START_Z = 0.55;   // começa logo atrás do rabo

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

  mesh.userData = {
    cols,
    vertsPerRow,
    width,
    history: Array.from({ length: ROWS }, () => ({ x: 0, y: 0 })),
    travelled: 0,
  };

  return mesh;
}

export function resetRainbowTrail(trail, x = 0, y = 0) {
  for (const sample of trail.userData.history) { sample.x = x; sample.y = y; }
  trail.userData.travelled = 0;
}

export function updateRainbowTrail(trail, dt, speed, x, y, time) {
  const { cols, vertsPerRow, width: baseWidth, history } = trail.userData;

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
}
