// Retratos dos personagens para a lista em grade.
//
// Em vez de imagens prontas, os retratos são renderizados uma única vez a
// partir dos próprios modelos 3D: monta cada unicórnio numa cena pequena,
// tira uma "foto" e guarda o PNG em memória. Assim a lista mostra sempre o
// personagem de verdade, com as cores e as asas dele.
import * as THREE from 'three';
import { createUnicorn, animateUnicorn } from './unicorn.js';

let cache = null;

function descartar(objeto) {
  objeto.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    const material = o.material;
    Array.isArray(material) ? material.forEach((m) => m.dispose()) : material.dispose();
  });
}

export function getPortraits(personagens, tamanho = 220) {
  if (cache) return cache;

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: true, preserveDrawingBuffer: true,
  });
  renderer.setSize(tamanho, tamanho);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffc3e6, 1.15));
  const sol = new THREE.DirectionalLight(0xfff3d6, 1.35);
  sol.position.set(4, 6, 6);
  scene.add(sol);

  // Enquadramento fixo, folgado o bastante para o maior deles (o Brasa).
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(3.9, 2.3, 4.5);
  camera.lookAt(0, 1.3, 0);

  cache = {};
  for (const personagem of personagens) {
    const unicornio = createUnicorn(personagem);
    animateUnicorn(unicornio, 1.35, 2.6, true);   // pose de galope, mais bonita
    unicornio.rotation.y = 0.35;
    scene.add(unicornio);

    renderer.render(scene, camera);
    cache[personagem.id] = renderer.domElement.toDataURL('image/png');

    scene.remove(unicornio);
    descartar(unicornio);
  }

  renderer.dispose();
  return cache;
}
