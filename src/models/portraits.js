// Retratos dos personagens para a lista em grade.
//
// Em vez de imagens prontas, os retratos são renderizados uma única vez a
// partir dos próprios modelos 3D: monta cada unicórnio numa cena pequena,
// tira uma "foto" e guarda o PNG em memória. Assim a lista mostra sempre o
// personagem de verdade, com as cores e as asas dele.
import * as THREE from 'three';
import { createUnicorn, animateUnicorn } from './unicorn.js';
import { ENFEITES, vestirEnfeites, montarEnfeiteSozinho } from './accessories.js';
import { modeloDaFigurinha } from './stickers.js';

// Um retrato por unicórnio, com a assinatura do que ele vestia na foto:
// trocou o enfeite, só aquele retrato é tirado de novo.
const cache = {};
let retratos = {};

function descartar(objeto) {
  objeto.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    const material = o.material;
    Array.isArray(material) ? material.forEach((m) => m.dispose()) : material.dispose();
  });
}

// `enfeitesDe(id)` diz o que cada um está vestindo (ver accessories.js):
// o retrato da grade e do lobby mostra o unicórnio enfeitado, que é o
// unicórnio *dela*. Sem a função, sai sem enfeite nenhum.
export function getPortraits(personagens, tamanho = 220, enfeitesDe = null) {
  const assinatura = (id) => JSON.stringify(enfeitesDe?.(id) || {});
  const faltam = personagens.filter((p) => cache[p.id]?.assinatura !== assinatura(p.id));
  if (!faltam.length) return retratos;

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

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(-6.33, 1.96, 0.2);
  camera.lookAt(0, 1.71, 0.2);

  for (const personagem of faltam) {
    const unicornio = createUnicorn(personagem);
    animateUnicorn(unicornio, 1.35, 2.6, true);   // pose de galope, mais bonita
    vestirEnfeites(unicornio, enfeitesDe?.(personagem.id));
    scene.add(unicornio);

    renderer.render(scene, camera);
    cache[personagem.id] = {
      assinatura: assinatura(personagem.id),
      url: renderer.domElement.toDataURL('image/png'),
    };

    scene.remove(unicornio);
    descartar(unicornio);
  }

  renderer.dispose();
  // Um objeto novo a cada mudança: quem guardou o de antes continua com a
  // foto de antes, e quem pede de novo recebe a nova.
  retratos = Object.fromEntries(Object.entries(cache).map(([id, r]) => [id, r.url]));
  return retratos;
}

// A miniatura de cada enfeite, para a grade da loja: a peça sozinha, de
// três quartos, enquadrada pelo tamanho dela.
let miniaturas = null;
export function getAccessoryPortraits(tamanho = 160) {
  if (miniaturas) return miniaturas;
  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: true, preserveDrawingBuffer: true,
  });
  renderer.setSize(tamanho, tamanho);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffc3e6, 1.3));
  const sol = new THREE.DirectionalLight(0xfff3d6, 1.4);
  sol.position.set(-3, 5, -6);
  scene.add(sol);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 30);

  miniaturas = {};
  for (const enfeite of ENFEITES) {
    const peca = montarEnfeiteSozinho(enfeite.id);
    scene.add(peca);
    const caixa = new THREE.Box3().setFromObject(peca);
    const centro = caixa.getCenter(new THREE.Vector3());
    const raio = caixa.getBoundingSphere(new THREE.Sphere()).radius;
    // De frente e um pouco de cima, puxado para o lado esquerdo — o lado
    // em que o laço e a cartola ficam.
    const dir = new THREE.Vector3(...(enfeite.vista || [-0.55, 0.45, -1])).normalize();
    const distancia = raio / Math.sin(THREE.MathUtils.degToRad(15)) * 1.05;
    camera.position.copy(centro).addScaledVector(dir, distancia);
    camera.lookAt(centro);
    // A luz vem do lado da câmera: os da cauda são fotografados de trás, e
    // com a luz fixa na frente saíam no escuro.
    sol.position.set(dir.x * 6 - 2, 5, dir.z * 6);
    renderer.render(scene, camera);
    miniaturas[enfeite.id] = renderer.domElement.toDataURL('image/png');
    scene.remove(peca);
    descartar(peca);
  }
  renderer.dispose();
  return miniaturas;
}

// As fotos das figurinhas, para o álbum. São tiradas na hora em que a
// página abre (quatro de cada vez, não as 68 de uma vez só) e ficam
// guardadas. A que ainda falta usa a mesma foto, apagada pelo CSS numa
// sombra: a criança vê o contorno do que está procurando.
//
// O modelo não é descartado: os do cenário dividem geometria e material
// entre si (ver createModelo, em scenery.js).
const fotosDeFigurinha = {};
export function getStickerPortraits(figurinhas, tamanho = 200) {
  const faltam = figurinhas.filter((f) => !fotosDeFigurinha[f.id]);
  if (faltam.length) {
    const renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, preserveDrawingBuffer: true,
    });
    renderer.setSize(tamanho, tamanho);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b8ff, 1.5));
    const sol = new THREE.DirectionalLight(0xfff3d6, 1.4);
    sol.position.set(3, 6, 5);
    scene.add(sol);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 30);
    camera.position.set(1.15, 0.75, 1.85);
    camera.lookAt(0, 0, 0);

    for (const figurinha of faltam) {
      const modelo = modeloDaFigurinha(figurinha, 1);
      scene.add(modelo);
      renderer.render(scene, camera);
      fotosDeFigurinha[figurinha.id] = renderer.domElement.toDataURL('image/png');
      scene.remove(modelo);
    }
    renderer.dispose();
  }
  return fotosDeFigurinha;
}
