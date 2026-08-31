// Retratos das pistas para a lista em grade.
//
// Mesma ideia dos retratos dos personagens: em vez de imagens prontas, cada
// pista é montada em miniatura — chão, caminho, alguns enfeites, um obstáculo
// e o céu dela — e fotografada uma vez só.
import * as THREE from 'three';
import {
  createDecoration, createObstacle, createMountains, createAmbience,
  createMoon, createStars, createSun, createRainbow, createWaveCrest,
} from './scenery.js';

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

// Um pedacinho de pista em miniatura. A versão anterior desenhava só chão,
// caminho e alguns enfeites — o que fazia pistas diferentes saírem parecidas,
// porque o que distingue cada uma está justamente no resto: a serra no
// horizonte, o quadro do fundo, os bichinhos no ar, a metade de água da
// Praia, e a ausência de chão no Espaço.
function miniatura(track) {
  const cena = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

  // Sem `ground` não existe chão: é o Espaço, e é o vazio que o identifica.
  if (track.ground) {
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(track.ground));
    chao.rotation.x = -Math.PI / 2;
    cena.add(chao);
  }

  // Beira-mar: areia de um lado, água do outro, com a espuma na divisa.
  if (track.shore) {
    const { side = 1, sand, sea, foam } = track.shore;
    const areia = new THREE.Mesh(new THREE.PlaneGeometry(28, 60), mat(sand));
    areia.rotation.x = -Math.PI / 2;
    areia.position.set(side * 17.8, 0.012, 0);
    cena.add(areia);

    const agua = new THREE.Mesh(new THREE.PlaneGeometry(28, 60), mat(sea));
    agua.rotation.x = -Math.PI / 2;
    agua.position.set(-side * 17.8, -0.05, 0);
    cena.add(agua);

    const espuma = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 60),
      new THREE.MeshBasicMaterial({ color: foam, transparent: true, opacity: 0.55, depthWrite: false })
    );
    espuma.rotation.x = -Math.PI / 2;
    espuma.position.set(-side * 4.9, 0.03, 0);
    cena.add(espuma);

    for (let i = 0; i < 6; i++) {
      const crista = createWaveCrest(foam);
      crista.position.set(-side * (6 + Math.random() * 14), 0.04, 4 - i * 3.4);
      crista.scale.x = 0.9;
      cena.add(crista);
    }
  }

  const caminho = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 60), mat(track.path));
  caminho.rotation.x = -Math.PI / 2;
  caminho.position.y = 0.02;
  cena.add(caminho);

  // Faixas do meio da pista: dão a leitura de "isto é uma pista".
  for (let i = 0; i < 9; i++) {
    const faixa = new THREE.Mesh(
      new THREE.PlaneGeometry(6.6, 1.5),
      new THREE.MeshBasicMaterial({
        color: track.stripe, transparent: true,
        opacity: track.stripeOpacity ?? 0.4, depthWrite: false,
      })
    );
    faixa.rotation.x = -Math.PI / 2;
    faixa.position.set(0, 0.03, 4 - i * 3.2);
    cena.add(faixa);
  }

  for (const lado of [-3.9, 3.9]) {
    const meioFio = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 60), mat(track.kerb));
    meioFio.position.set(lado, 0.15, 0);
    cena.add(meioFio);
  }

  // Enfeites em pares, dos dois lados — respeitando o lado de cada conjunto
  // quando a pista tem areia e água.
  for (let i = 0; i < 16; i++) {
    const shore = track.shore;
    const lado = shore ? (i % 2 === 0 ? shore.side : -shore.side) : (i % 2 === 0 ? -1 : 1);
    const nomes = !shore ? track.decorations
      : lado === shore.side ? shore.sandDecor : shore.seaDecor;
    const naAgua = shore && lado === -shore.side;
    const enfeite = createDecoration(track, nomes);
    enfeite.position.set(
      lado * ((naAgua ? 6.5 : 4.8) + Math.random() * 6),
      naAgua ? -0.12 : 0,
      3 - i * 1.8
    );
    cena.add(enfeite);
  }

  const obstaculo = createObstacle(track);
  obstaculo.position.set(0, 0, -3);
  cena.add(obstaculo);

  // Serra no horizonte e o quadro do fundo, que é o que dá o "onde" da pista.
  if (track.mountains) {
    const serra = createMountains(track);
    serra.position.z = -6;
    cena.add(serra);
  }

  if (track.backdrop === 'moon') {
    const lua = createMoon();
    lua.position.set(11, 11, -46);
    cena.add(lua);
    cena.add(createStars(track.starsBelow ? 70 : 45, !!track.starsBelow));
  } else if (track.backdrop === 'sun') {
    const sol = createSun();
    sol.position.set(-10, 14, -46);
    cena.add(sol);
  } else if (track.backdrop === 'rainbow') {
    const arco = createRainbow();
    arco.position.set(0, -2, -44);
    cena.add(arco);
  }

  // Bichinhos no ar: são eles que dizem se é vagalume, faísca, neve ou
  // gaivota — e isso separa duas pistas de cor parecida na hora.
  for (const { kind, count } of track.ambience || []) {
    const quantos = Math.min(14, Math.ceil(count / 4));
    for (let i = 0; i < quantos; i++) {
      const bicho = createAmbience(kind);
      bicho.position.set(
        (Math.random() - 0.5) * 30,
        kind === 'snow' || kind === 'seagull' || kind === 'meteorite'
          ? 1.5 + Math.random() * 7
          : 0.6 + Math.random() * 4,
        2 - Math.random() * 22
      );
      cena.add(bicho);
    }
  }

  return cena;
}

export function getTrackPortraits(pistas, tamanho = 240) {
  if (cache) return cache;

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(tamanho, tamanho);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  // Mais alta e um pouco de lado: de frente e rente ao chão, a pista tomava
  // o quadro e as laterais — que são o que diferencia as pistas — ficavam
  // cortadas.
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 160);
  camera.position.set(4.2, 7.4, 11);
  camera.lookAt(-0.6, 1.6, -8);

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
