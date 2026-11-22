// O álbum de figurinhas.
//
// Cada pista tem uma página de quatro figurinhas, e cada figurinha é um dos
// modelos daquela pista — o papagaio da Selva, o disco voador do Espaço, o
// boneco de neve da Geada. São os mesmos modelos do cenário (`createModelo`,
// em scenery.js), então a figurinha é sempre a cara do que a criança vê
// passar na beira da pista.
//
// Na corrida, de vez em quando, nasce numa faixa um **cartão dourado**
// girando com o modelo dentro (ver World.rollSticker). Passar por ele cola
// a figurinha no álbum. Só nasce figurinha que ainda falta naquela pista,
// então a página sempre anda — e quando ela fecha, vem um prêmio em chaves
// (ver Game.collectSticker).
//
// O que já foi colado fica em `save.figurinhas` ({ id: quantas vezes }).
import * as THREE from 'three';
import { createModelo } from './scenery.js';
import { createGlow } from './collectibles.js';

// As quatro de cada pista, na ordem da página. `modelo` é o nome em
// `createModelo`; a escolha foi o que cada pista tem de mais seu — nada de
// pedra, que existe em quase todas, e nada que seja só um brilho (o
// vaga-lume sozinho vira uma mancha amarela na foto).
const PAGINAS = {
  campo:      [['flower', 'Flor'], ['mushroom', 'Cogumelo'], ['butterfly', 'Borboleta'], ['bee', 'Abelha']],
  doces:      [['lollipop', 'Pirulito'], ['cupcake', 'Cupcake'], ['donut', 'Rosquinha'], ['ant', 'Formiga']],
  vilarejo:   [['cottage', 'Casinha'], ['well', 'Poço'], ['lamppost', 'Poste de luz'], ['bird', 'Passarinho']],
  ceu:        [['balloon', 'Balão'], ['kite', 'Pipa'], ['rainbowArch', 'Arco-íris'], ['stormCloud', 'Nuvem de chuva']],
  frutas:     [['strawberry', 'Morango'], ['pineapple', 'Abacaxi'], ['watermelon', 'Melancia'], ['cherries', 'Cerejas']],
  praia:      [['sandcastle', 'Castelo de areia'], ['parasol', 'Guarda-sol'], ['starfish', 'Estrela-do-mar'], ['seagull', 'Gaivota']],
  oceano:     [['coral', 'Coral'], ['fish', 'Peixinho'], ['seaUrchin', 'Ouriço-do-mar'], ['clam', 'Concha']],
  noite:      [['glowMushroom', 'Cogumelo que brilha'], ['crystal', 'Cristal'], ['moonStone', 'Pedra da lua'], ['pineTree', 'Pinheiro']],
  geada:      [['snowman', 'Boneco de neve'], ['igloo', 'Iglu'], ['iceCrystal', 'Cristal de gelo'], ['iceBlock', 'Bloco de gelo']],
  vulcao:     [['lavaPool', 'Lago de lava'], ['emberVent', 'Chaminé de fogo'], ['charredTree', 'Árvore queimada'], ['lavaBoulder', 'Pedra de lava']],
  parque:     [['ferrisWheel', 'Roda-gigante'], ['carousel', 'Carrossel'], ['cottonCandy', 'Algodão-doce'], ['popcornBox', 'Pipoca']],
  espaco:     [['ufo', 'Disco voador'], ['planet', 'Planeta'], ['meteor', 'Meteoro'], ['asteroid', 'Asteroide']],
  tempestade: [['windmill', 'Moinho'], ['lightningRod', 'Para-raios'], ['puddle', 'Poça'], ['barrel', 'Barril']],
  bruma:      [['ghostTree', 'Árvore fantasma'], ['floatingLantern', 'Lanterna'], ['mossRock', 'Pedra de musgo'], ['crate', 'Caixote']],
  caverna:    [['crystalVein', 'Veio de cristal'], ['stalagmite', 'Estalagmite'], ['glowPool', 'Poça brilhante'], ['crystalSpike', 'Espinho de cristal']],
  outono:     [['autumnTree', 'Árvore de outono'], ['pumpkin', 'Abóbora'], ['leafPile', 'Monte de folhas'], ['logObstacle', 'Tronco']],
  selva:      [['parrot', 'Papagaio'], ['jungleTree', 'Árvore da selva'], ['hangingVine', 'Cipó'], ['vineTangle', 'Nó de cipós']],
};

export const STICKERS_PER_PAGE = 4;

// Quantas chaves a página completa dá.
export const PAGE_REWARD = 3;

export const FIGURINHAS = Object.entries(PAGINAS).flatMap(([pista, lista]) =>
  lista.map(([modelo, name], ordem) => ({ id: `${pista}-${modelo}`, pista, modelo, name, ordem })));

export const FIGURINHA = Object.fromEntries(FIGURINHAS.map((f) => [f.id, f]));

export const figurinhasDaPista = (pista) => FIGURINHAS.filter((f) => f.pista === pista);

// O modelo da figurinha, centrado na origem e do `tamanho` pedido (a maior
// medida dele). Os modelos do cenário têm escalas bem diferentes — a
// roda-gigante é um prédio, o vaga-lume é um grão —, e no cartão e no
// álbum eles precisam caber no mesmo quadro.
export function modeloDaFigurinha(figurinha, tamanho = 1) {
  const modelo = createModelo(figurinha.modelo) || new THREE.Group();
  const caixa = new THREE.Box3().setFromObject(modelo);
  const medidas = caixa.getSize(new THREE.Vector3());
  const maior = Math.max(medidas.x, medidas.y, medidas.z) || 1;
  const centro = caixa.getCenter(new THREE.Vector3());
  const escala = tamanho / maior;
  const g = new THREE.Group();
  modelo.position.sub(centro);
  g.add(modelo);
  g.scale.setScalar(escala);
  return g;
}

// A moldura do cartão: um retângulo de cantos redondos com o meio vazado,
// dourado. É ela que diz "isto é diferente de um coração" de longe.
const LARGURA = 1.25;
const ALTURA = 1.55;
let molduraGeo = null;
function moldura() {
  if (molduraGeo) return molduraGeo;
  const retangulo = (w, h, r) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };
  const fora = retangulo(LARGURA, ALTURA, 0.2);
  const dentro = retangulo(LARGURA - 0.2, ALTURA - 0.2, 0.13);
  fora.holes.push(dentro);
  molduraGeo = new THREE.ExtrudeGeometry(fora, {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 6,
  });
  molduraGeo.translate(0, 0, -0.03);
  return molduraGeo;
}

// O cartão dourado que nasce na pista.
export function createStickerCard(figurinha) {
  const g = new THREE.Group();
  const ouro = new THREE.MeshLambertMaterial({ color: 0xffc53d, emissive: 0x6a4500, fog: false });
  g.add(new THREE.Mesh(moldura(), ouro));

  // O fundo do cartão: um céu clarinho, meio transparente, para o modelo
  // se destacar do chão da pista sem esconder o outro lado quando gira.
  const fundo = new THREE.Mesh(
    new THREE.PlaneGeometry(LARGURA - 0.16, ALTURA - 0.16),
    new THREE.MeshBasicMaterial({
      color: 0xfff6d8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: false,
    })
  );
  g.add(fundo);

  const modelo = modeloDaFigurinha(figurinha, 1.05);
  g.add(modelo);

  // Três estrelinhas nos cantos, para o cartão piscar de longe.
  const estrelaMat = new THREE.MeshBasicMaterial({ color: 0xfff1a8, fog: false });
  [[-0.55, 0.7], [0.58, 0.62], [0.52, -0.72]].forEach(([x, y], i) => {
    const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 + i * 0.015, 0), estrelaMat);
    e.position.set(x, y, 0.05);
    g.add(e);
  });

  // O brilho é menor e mais fraco que o da chave: com o mesmo, o cartão
  // virava uma bola de luz e o desenho de dentro sumia.
  const halo = createGlow(0xffd166, 1.05, 0.18);
  g.add(halo);
  g.scale.setScalar(1.15);
  g.userData = { kind: 'sticker', figurinha: figurinha.id, glow: halo };
  return g;
}
