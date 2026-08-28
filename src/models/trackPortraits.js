// Retratos das pistas para a lista em grade.
//
// Mesma ideia dos retratos dos personagens: em vez de imagens prontas, cada
// pista é montada em miniatura — chão, caminho, alguns enfeites, um obstáculo
// e o céu dela — e fotografada uma vez só.
import * as THREE from 'three';
import { createDecoration, createObstacle } from './scenery.js';

let cache = null;

function ceuTextura(cores) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, cores[0]);
  grad.addColorStop(1, cores[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 128);
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

function descartar(objeto) {
  objeto.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    const material = o.material;
    Array.isArray(material) ? material.forEach((m) => m.dispose()) : material.dispose();
  });
}

// Um pedacinho de pista, com os enfeites dos dois lados.
function miniatura(track) {
  const cena = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

  const chao = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(track.ground));
  chao.rotation.x = -Math.PI / 2;
  cena.add(chao);

  const caminho = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 40), mat(track.path));
  caminho.rotation.x = -Math.PI / 2;
  caminho.position.y = 0.02;
  cena.add(caminho);

  for (const lado of [-3.9, 3.9]) {
    const meioFio = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 40), mat(track.kerb));
    meioFio.position.set(lado, 0.15, 0);
    cena.add(meioFio);
  }

  // Enfeites em pares, dos dois lados do caminho.
  for (let i = 0; i < 12; i++) {
    const enfeite = createDecoration(track);
    const lado = i % 2 === 0 ? -1 : 1;
    enfeite.position.set(lado * (4.8 + Math.random() * 3), 0, 1 - i * 1.9);
    cena.add(enfeite);
  }

  const obstaculo = createObstacle(track);
  obstaculo.position.set(0, 0, -6);
  cena.add(obstaculo);

  return cena;
}

export function getTrackPortraits(pistas, tamanho = 240) {
  if (cache) return cache;

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(tamanho, tamanho);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  camera.position.set(0, 4.6, 8.5);
  camera.lookAt(0, 1.2, -6);

  cache = {};
  for (const pista of pistas) {
    const cena = new THREE.Scene();
    cena.background = ceuTextura(pista.sky);

    const hemisferio = new THREE.HemisphereLight(
      pista.hemisphere.sky, pista.hemisphere.ground, pista.hemisphere.intensity
    );
    cena.add(hemisferio);
    const sol = new THREE.DirectionalLight(pista.sun.color, pista.sun.intensity);
    sol.position.set(6, 10, 8);
    cena.add(sol);

    const mini = miniatura(pista);
    cena.add(mini);

    renderer.render(cena, camera);
    cache[pista.id] = renderer.domElement.toDataURL('image/png');

    descartar(mini);
    cena.background.dispose();
  }

  renderer.dispose();
  return cache;
}
