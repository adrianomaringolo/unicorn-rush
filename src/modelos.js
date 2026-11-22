// A página /modelos: o catálogo de tudo o que é modelo 3D no jogo.
//
// Nada aqui é desenhado à parte — cada cartão chama a mesma função que o
// jogo chama (`createDecoration`, `createObstacle`, `createUnicorn`…), tira
// uma foto e guarda. Por isso a lista sai das próprias tabelas: pista nova,
// enfeite novo ou unicórnio novo aparecem aqui sozinhos.
//
// Um renderizador só para todas as fotos (cada contexto WebGL a mais é um
// a menos para o navegador), e outro só enquanto o modelo de perto está
// aberto.
import * as THREE from 'three';
import { CHARACTER_LIST, isFastOn } from './models/characters.js';
import { createUnicorn, animateUnicorn } from './models/unicorn.js';
import { TRACK_LIST } from './game/tracks.js';
import {
  createDecoration, createObstacle, createBarrier, createAmbience, animateAmbience, swaySeaweed,
  createCloud, createLightningBolt, createRainbow, createMoon, createSun, createStars,
  createWaveCrest, createDistanceMarker, createStartLine, createRecordBanner,
} from './models/scenery.js';
import { createHeart, createStar, createKey } from './models/collectibles.js';
import { POWERUP_LIST, createPowerup, createRainbowWave } from './models/powerups.js';
import { ENFEITES, vestirEnfeites, montarEnfeiteSozinho } from './models/accessories.js';
import { FIGURINHAS, createStickerCard } from './models/stickers.js';

// --- nomes em português -------------------------------------------------
// As tabelas do jogo guardam o id de código; aqui ele ganha um nome de gente.
// Um id que não estiver aqui aparece só com o código, sem quebrar nada.
const NOMES = {
  // enfeites
  tree: 'Árvore frondosa', pineTree: 'Pinheiro', mushroom: 'Cogumelo',
  glowMushroom: 'Cogumelo que brilha', crystal: 'Cristal', flower: 'Flor',
  flowerPatch: 'Tufo florido', lollipop: 'Pirulito', cupcake: 'Bolinho',
  candyCane: 'Bengala doce', sprinkles: 'Granulado', chocolate: 'Pedacinho de chocolate',
  cloudHill: 'Morrinho de nuvem', balloon: 'Balão', rainbowArch: 'Arquinho de arco-íris',
  strawberry: 'Morango', orangeTree: 'Laranjeira', bananaPile: 'Cacho de banana',
  watermelonPatch: 'Canteiro de melancia', orangePile: 'Monte de laranjas',
  grapes: 'Parreira de uvas', kiwi: 'Kiwi',
  apple: 'Maçã (e metade cortada)', cherries: 'Cerejas', pear: 'Peras',
  coral: 'Coral', seaweed: 'Alga',
  starfish: 'Estrela-do-mar', lavaRock: 'Pedra de lava', emberVent: 'Respiro de brasa',
  charredTree: 'Árvore queimada', lavaPool: 'Poça de lava', snowPine: 'Pinheiro com neve',
  igloo: 'Iglu', iceCrystal: 'Cristal de gelo', snowman: 'Boneco de neve',
  planet: 'Planeta', asteroid: 'Asteroide', asteroidChunk: 'Pedaço de asteroide',
  ufo: 'Disco voador', parasol: 'Guarda-sol', sandcastle: 'Castelo de areia', sandToys: 'Baldinho e brinquedos de areia',
  palmTree: 'Coqueiro', beachChair: 'Cadeira de praia', boat: 'Barquinho',
  surfboard: 'Prancha', buoy: 'Boia', circusTent: 'Tenda de circo',
  ferrisWheel: 'Roda-gigante', cottonCandy: 'Algodão-doce', carousel: 'Carrossel', balloonStand: 'Buquê de balões',
  windmill: 'Moinho', lightningRod: 'Para-raios', puddle: 'Poça',
  ghostTree: 'Árvore fantasma', floatingLantern: 'Lanterna flutuante',
  mossRock: 'Pedra com musgo', crystalVein: 'Veio de cristal', stalagmite: 'Estalagmite',
  glowPool: 'Poça que brilha', cottage: 'Casinha', lamppost: 'Lampião', well: 'Poço',
  autumnTree: 'Árvore de outono', leafPile: 'Monte de folhas', pumpkin: 'Abóbora',
  jungleTree: 'Árvore da selva', bigJungleTree: 'Árvore gigante da selva',
  hangingVine: 'Cipó pendurado',
  // obstáculos
  rock: 'Pedra', jumpBar: 'Barra de saltar', bush: 'Arbusto espinhoso',
  gumdrop: 'Bala de goma', donut: 'Rosquinha', crystalSpike: 'Espeto de cristal',
  stormCloud: 'Nuvem carregada', kite: 'Pipa', balloonBunch: 'Cacho de balões',
  moonStone: 'Pedra da lua', bigGlowMushroom: 'Cogumelo gigante que brilha',
  watermelon: 'Melancia', pineapple: 'Abacaxi', coconutPile: 'Monte de cocos',
  seaUrchin: 'Ouriço-do-mar', clam: 'Concha', lavaBoulder: 'Rocha de lava',
  iceBlock: 'Bloco de gelo', meteor: 'Meteoro', popcornBox: 'Caixa de pipoca',
  barrel: 'Barril', crate: 'Caixote', logObstacle: 'Tronco', vineTangle: 'Emaranhado de cipó',
  // bichinhos
  firefly: 'Vagalume', butterfly: 'Borboleta', bee: 'Abelha', fly: 'Mosquinha',
  bird: 'Passarinho', fish: 'Peixinho', bubble: 'Bolha', ant: 'Formiga',
  spark: 'Faísca', smoke: 'Fumaça', snow: 'Floco de neve', seagull: 'Gaivota',
  meteorite: 'Meteorito', rain: 'Gota de chuva', note: 'Nota musical',
  confetti: 'Confete', leaf: 'Folha', parrot: 'Papagaio',
};
const nome = (id) => NOMES[id] || id;

// A mesma luz dos retratos dos unicórnios — fora das pistas, é a luz "neutra".
const LUZ_NEUTRA = {
  hemisphere: { sky: 0xffffff, ground: 0xffc3e6, intensity: 1.15 },
  sun: { color: 0xfff3d6, intensity: 1.35 },
};

// --- o catálogo -----------------------------------------------------------
// Cada item: { nome, codigo, criar(), luz, ceu, unicornio?, vezes?, lado? }.
// `criar` é chamado de novo a cada foto e a cada "🎲 Outro": vários modelos
// sorteiam cor e forma ao nascer, e ver mais de uma versão ajuda.

function contar(lista) {
  const conta = new Map();
  for (const id of lista) conta.set(id, (conta.get(id) || 0) + 1);
  return conta;
}

// Os enfeites e obstáculos nascem sorteados de uma lista; pedir uma lista de
// um item só é o jeito de escolher qual. O tamanho e o giro sorteados pelo
// `createDecoration` voltam ao normal para a foto sair comparável.
function enfeite(track, id) {
  const obj = createDecoration(track, [id]);
  obj.scale.setScalar(1);
  obj.rotation.y = 0;
  return obj;
}

function pistaGrupo(track) {
  const ceu = `linear-gradient(${track.sky[0]}, ${track.sky[1]})`;
  const luz = { hemisphere: track.hemisphere, sun: track.sun };
  const base = { luz, ceu };
  const subgrupos = [];

  // Enfeites. A lista é um saquinho de sorteio: repetir um nome deixa ele
  // mais comum, e o "×N" do cartão mostra isso. A Praia tem dois saquinhos
  // a mais, um para a areia e outro para o mar.
  const enfeites = [];
  const vistos = new Set();
  const juntar = (lista, lado) => {
    for (const [id, vezes] of contar(lista)) {
      if (vistos.has(id)) continue;
      vistos.add(id);
      enfeites.push({ ...base, nome: nome(id), codigo: id, vezes, lado, criar: () => enfeite(track, id) });
    }
  };
  if (track.shore) {
    juntar(track.shore.sandDecor, 'areia');
    juntar(track.shore.seaDecor, 'mar');
  }
  juntar(track.decorations);
  subgrupos.push({ titulo: 'Enfeites', itens: enfeites });

  subgrupos.push({
    titulo: 'Obstáculos',
    itens: [...contar(track.obstacles)].map(([id, vezes]) => ({
      ...base, nome: nome(id), codigo: id, vezes,
      criar: () => createObstacle({ obstacles: [id] }),
    })),
  });

  if (track.barrierChance !== 0) {
    subgrupos.push({
      titulo: 'Barreira',
      itens: [{ ...base, nome: 'Barreira', codigo: `createBarrier(${track.id})`, criar: () => createBarrier(track) }],
    });
  }

  subgrupos.push({
    titulo: 'Bichinhos no ar',
    itens: (track.ambience || []).map(({ kind, count }) => ({
      ...base, nome: nome(kind), codigo: kind, info: `${count} de uma vez`, ambiente: true,
      criar: () => createAmbience(kind),
    })),
  });

  const fundo = [];
  if (track.backdrop === 'sun') fundo.push({ ...base, nome: 'Sol', codigo: 'createSun', criar: createSun });
  if (track.backdrop === 'moon') {
    fundo.push({ ...base, nome: 'Lua', codigo: 'createMoon', criar: createMoon });
    fundo.push({
      ...base, nome: 'Estrelas', codigo: 'createStars',
      criar: () => createStars(track.starsBelow ? 140 : 90, !!track.starsBelow),
    });
  }
  if (track.backdrop === 'rainbow') fundo.push({ ...base, nome: 'Arco-íris', codigo: 'createRainbow', criar: createRainbow });
  if (track.cloud != null) {
    fundo.push({ ...base, nome: 'Nuvem', codigo: 'createCloud', criar: () => createCloud(track.cloud) });
  }
  if (track.lightning) {
    fundo.push({ ...base, nome: 'Raio', codigo: 'createLightningBolt', criar: createLightningBolt });
  }
  if (track.shore) {
    fundo.push({ ...base, nome: 'Crista de onda', codigo: 'createWaveCrest', criar: () => createWaveCrest(track.shore.foam) });
  }
  if (fundo.length) subgrupos.push({ titulo: 'Fundo', itens: fundo });

  const rapidos = CHARACTER_LIST.filter((c) => isFastOn(c, track.id));
  return {
    id: track.id,
    titulo: `${track.emoji} ${track.name}`,
    tagline: track.tagline,
    rapidos: rapidos.length ? `⚡ Mais rápidos aqui: ${rapidos.map((c) => `${c.emoji} ${c.name}`).join(', ')}` : '',
    subgrupos,
  };
}

const CEU_NEUTRO = 'linear-gradient(#fde7f3, #fff6fb)';
const neutro = (item) => ({ luz: LUZ_NEUTRA, ceu: CEU_NEUTRO, ...item });
const VAGA = { cabeca: 'cabeça', rosto: 'rosto', pescoco: 'pescoço', patas: 'patas', cauda: 'cauda' };

const GRUPOS = [
  {
    id: 'unicornios',
    titulo: '🦄 Unicórnios',
    tagline: 'Todos na mesma escala: o tamanho faz parte do personagem.',
    subgrupos: [{
      titulo: '',
      itens: CHARACTER_LIST.map((c) => neutro({
        nome: `${c.emoji} ${c.name}`,
        codigo: c.id,
        info: c.title,
        unicornio: true,
        criar: () => createUnicorn(c),
      })),
    }],
  },
  {
    id: 'enfeites',
    titulo: '🎀 Enfeites',
    tagline: 'O que se compra com corações para vestir os unicórnios: um por vaga (cabeça, rosto, pescoço, patas e cauda). Os de Natal vêm marcados com 🎄.',
    subgrupos: [
      {
        titulo: 'Sozinhos',
        itens: ENFEITES.map((e) => neutro({
          nome: `${e.emoji} ${e.name}`,
          codigo: e.id,
          info: e.natal ? `🎄 ${VAGA[e.vaga]} · 💗 ${e.preco}` : `${VAGA[e.vaga]} · 💗 ${e.preco}`,
          criar: () => {
            const peca = montarEnfeiteSozinho(e.id);
            // A guirlanda é uma roda deitada: de lado vira um risco.
            if (e.id === 'guirlanda') peca.rotation.x = -0.9;
            return peca;
          },
        })),
      },
      {
        // Na Uni, para ver o encaixe: é assim que eles aparecem no jogo.
        titulo: 'Na Uni',
        itens: ENFEITES.map((e) => neutro({
          nome: `${e.emoji} ${e.name}`,
          codigo: e.id,
          unicornio: true,
          perto: e.vaga === 'cauda' ? 'tras' : e.vaga === 'patas' ? 'patas' : true,
          criar: () => {
            const uni = createUnicorn(CHARACTER_LIST[0]);
            vestirEnfeites(uni, { [e.vaga]: e.id });
            return uni;
          },
        })),
      },
    ],
  },
  {
    id: 'todas',
    titulo: '✨ Em todas as pistas',
    tagline: 'O que aparece em qualquer pista: o que se pega, os power-ups e as marcas do caminho.',
    subgrupos: [
      {
        titulo: 'Para pegar',
        itens: [
          neutro({ nome: 'Coração', codigo: 'createHeart', criar: createHeart }),
          neutro({ nome: 'Estrela', codigo: 'createStar', criar: createStar }),
          neutro({ nome: 'Chave mágica', codigo: 'createKey', criar: createKey }),
          // O cartão dourado do álbum; o modelo de dentro muda por pista
          // (todos estão na seção de cada pista, como enfeite ou obstáculo).
          neutro({ nome: 'Cartão de figurinha', codigo: 'createStickerCard', criar: () => createStickerCard(FIGURINHAS[0]) }),
        ],
      },
      {
        titulo: 'Power-ups',
        itens: [
          ...POWERUP_LIST.map((p) => neutro({
            nome: `${p.emoji} ${p.name}`, codigo: p.id, criar: () => createPowerup(p.id),
          })),
          neutro({ nome: 'Onda da Bomba Arco-Íris', codigo: 'createRainbowWave', criar: createRainbowWave }),
        ],
      },
      {
        titulo: 'Marcas do caminho',
        itens: [
          neutro({ nome: 'Linha de largada', codigo: 'createStartLine', criar: createStartLine }),
          neutro({ nome: 'Placa de distância', codigo: 'createDistanceMarker', criar: () => createDistanceMarker(100) }),
          neutro({ nome: 'Faixa do recorde', codigo: 'createRecordBanner', criar: createRecordBanner }),
        ],
      },
    ],
  },
  ...TRACK_LIST.map(pistaGrupo),
];

// --- enquadrar e fotografar ------------------------------------------------

function luzes(cena, luz) {
  cena.add(new THREE.HemisphereLight(luz.hemisphere.sky, luz.hemisphere.ground, luz.hemisphere.intensity));
  const sol = new THREE.DirectionalLight(luz.sun.color, luz.sun.intensity);
  sol.position.set(4, 6, 6);
  cena.add(sol);
}

function descartar(objeto) {
  objeto.traverse((o) => {
    o.geometry?.dispose();
    const m = o.material;
    if (!m) return;
    for (const x of Array.isArray(m) ? m : [m]) {
      x.map?.dispose();
      x.dispose();
    }
  });
}

// O unicórnio usa um enquadramento fixo, o mesmo do visualizador da ficha:
// é ele que deixa o Brasa grande e a Lulu pequenininha, como no jogo. (O do
// retrato da grade, 6,33, corta a ponta do rabo num cartão quadrado.)
function enquadrarUnicornio(camera) {
  camera.position.set(-6.9, 2.05, 0.2);
  camera.lookAt(0, 1.68, 0.2);
}

// Todo o resto é enquadrado pelo próprio tamanho, de três quartos e um
// pouco de cima — senão a pedrinha e a roda-gigante não caberiam no mesmo
// quadro.
const caixa = new THREE.Box3();
const esfera = new THREE.Sphere();
const DIRECAO = new THREE.Vector3(1, 0.62, 1.35).normalize();

function enquadrar(camera, objeto) {
  objeto.updateMatrixWorld(true);
  caixa.setFromObject(objeto);
  if (caixa.isEmpty()) caixa.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
  caixa.getBoundingSphere(esfera);
  const raio = Math.max(esfera.radius, 0.05);
  const distancia = (raio / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.02;
  camera.position.copy(esfera.center).addScaledVector(DIRECAO, distancia);
  camera.near = distancia / 100;
  camera.far = distancia * 10;
  camera.lookAt(esfera.center);
  camera.updateProjectionMatrix();
  return esfera.center.clone();
}

const TAMANHO = 320;
const fotografo = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
fotografo.setPixelRatio(1);
fotografo.setSize(TAMANHO, TAMANHO);
const cameraFoto = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

function fotografar(item) {
  const cena = new THREE.Scene();
  luzes(cena, item.luz);
  const objeto = item.criar();
  if (item.unicornio) {
    animateUnicorn(objeto, 1.35, 2.6, true);   // a pose de galope do retrato
    enquadrarUnicornio(cameraFoto);
    // Os enfeites na Uni: só a cabeça e o pescoço, de três quartos pela
    // frente — o bicho inteiro deixava o laço do tamanho de um pixel.
    // Os da cauda, de trás e de cima (a vista da corrida); os das patas,
    // de lado e baixo, pegando as quatro pernas.
    if (item.perto === 'tras') {
      cameraFoto.position.set(1.4, 2.9, 4.3);
      cameraFoto.lookAt(0, 1.3, 0.4);
    } else if (item.perto === 'patas') {
      cameraFoto.position.set(-5.6, 1.1, 2.2);
      cameraFoto.lookAt(0, 0.75, 0.1);
    } else if (item.perto) {
      cameraFoto.position.set(-3.3, 2.55, -3.1);
      cameraFoto.lookAt(0, 1.8, -0.7);
    }
    cameraFoto.near = 0.1;
    cameraFoto.far = 60;
    cameraFoto.updateProjectionMatrix();
  } else {
    enquadrar(cameraFoto, objeto);
  }
  cena.add(objeto);
  fotografo.render(cena, cameraFoto);
  const url = fotografo.domElement.toDataURL('image/png');
  descartar(objeto);
  return url;
}

// --- a página ------------------------------------------------------------

const conteudo = document.querySelector('#conteudo');
const indice = document.querySelector('#indice');
const progresso = document.querySelector('#progresso');
const pendentes = [];

function el(tag, props = {}, ...filhos) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...filhos.filter(Boolean));
  return e;
}

let total = 0;
for (const grupo of GRUPOS) {
  const contagem = grupo.subgrupos.reduce((n, s) => n + s.itens.length, 0);
  total += contagem;
  indice.append(el('li', {}, el('a', { href: `#${grupo.id}`, textContent: grupo.titulo })));

  const secao = el('section', { className: 'grupo', id: grupo.id });
  secao.append(el('h2', {}, grupo.titulo, el('span', { className: 'conta', textContent: `${contagem} modelos` })));
  if (grupo.tagline) secao.append(el('p', { className: 'tagline', textContent: grupo.tagline }));
  if (grupo.rapidos) secao.append(el('p', { className: 'rapidos', textContent: grupo.rapidos }));

  for (const sub of grupo.subgrupos) {
    if (!sub.itens.length) continue;
    if (sub.titulo) secao.append(el('h3', { textContent: sub.titulo }));
    const grade = el('div', { className: 'grade' });
    for (const item of sub.itens) {
      const img = el('img', { alt: '', width: TAMANHO, height: TAMANHO, decoding: 'async' });
      img.hidden = true;
      const foto = el('div', { className: 'foto' }, img);
      foto.style.setProperty('--ceu', item.ceu);
      if (item.vezes > 1) foto.append(el('span', { className: 'vezes', textContent: `×${item.vezes}`, title: 'Peso no sorteio' }));
      if (item.lado) foto.append(el('span', { className: 'lado', textContent: item.lado }));
      const cartao = el('button', { type: 'button', className: 'cartao', title: item.info || '' },
        foto,
        el('div', { className: 'legenda' },
          el('strong', { textContent: item.nome }),
          el('code', { textContent: item.codigo })));
      cartao.addEventListener('click', () => abrir(item));
      grade.append(cartao);
      pendentes.push({ item, img });
    }
    secao.append(grade);
  }
  conteudo.append(secao);
}

// Um link direto (/modelos#praia) chega antes de as seções existirem — elas
// nascem neste script —, então a rolagem até a âncora é feita aqui.
if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();

// As fotos saem aos poucos, alguns cartões por quadro: são quase trezentas, e
// tirar todas de uma vez travava a página por segundos antes de mostrar
// qualquer coisa.
let feitas = 0;
function fotografarAosPoucos() {
  const inicio = performance.now();
  while (pendentes.length && performance.now() - inicio < 24) {
    const { item, img } = pendentes.shift();
    try {
      img.src = fotografar(item);
      img.hidden = false;
    } catch (erro) {
      console.error(`[modelos] ${item.codigo}:`, erro);
      img.replaceWith(el('span', { textContent: '⚠️', title: String(erro) }));
    }
    feitas += 1;
  }
  progresso.textContent = pendentes.length ? `Montando ${feitas} de ${total}…` : `${total} modelos.`;
  if (pendentes.length) requestAnimationFrame(fotografarAosPoucos);
}
requestAnimationFrame(fotografarAosPoucos);

// --- o modelo de perto, girando com o dedo -------------------------------

const dialogo = document.querySelector('#perto');
const palco = document.querySelector('#palco');
const SENSIBILIDADE = 0.011;
const GIRO_SOZINHO = 0.4;
const ATRITO = 0.93;

let vivo = null;   // { renderer, cena, camera, pivo, objeto, item, ... }

function montar(item) {
  const { cena, pivo } = vivo;
  if (vivo.objeto) {
    pivo.remove(vivo.objeto);
    descartar(vivo.objeto);
  }
  const objeto = item.criar();
  pivo.position.set(0, 0, 0);
  pivo.quaternion.identity();
  if (item.unicornio) {
    // O eixo no meio do bicho, como no visualizador da ficha.
    const centro = new THREE.Box3().setFromObject(objeto).getCenter(new THREE.Vector3());
    objeto.position.sub(centro);
    pivo.position.copy(centro);
    vivo.camera.position.set(-6.9, 2.05, 0.2);
    vivo.camera.lookAt(0, 1.68, 0.2);
    vivo.camera.near = 0.1;
    vivo.camera.far = 60;
    vivo.camera.updateProjectionMatrix();
  } else {
    const centro = enquadrar(vivo.camera, objeto);
    objeto.position.sub(centro);
    pivo.position.copy(centro);
  }
  pivo.add(objeto);
  vivo.objeto = objeto;
  vivo.base = objeto.position.clone();
  cena.add(pivo);
}

function abrir(item) {
  fechar();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  palco.style.setProperty('--ceu', item.ceu);
  palco.append(renderer.domElement);

  const cena = new THREE.Scene();
  luzes(cena, item.luz);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const pivo = new THREE.Group();
  vivo = {
    renderer, cena, camera, pivo, item, objeto: null,
    relogio: new THREE.Clock(), embaloX: 0, embaloY: 0, arrastando: false, mexeram: false,
  };
  montar(item);

  document.querySelector('#perto-nome').textContent = item.nome;
  document.querySelector('#perto-info').textContent = [item.codigo, item.info].filter(Boolean).join(' · ');
  dialogo.showModal();
  medir();
  requestAnimationFrame(quadro);
}

function medir() {
  if (!vivo) return;
  const lado = palco.clientWidth || 400;
  vivo.renderer.setSize(lado, lado, false);
}

const frente = new THREE.Vector3();
const direita = new THREE.Vector3();
const giro = new THREE.Quaternion();
function girar(dx, dy) {
  const { camera, pivo } = vivo;
  camera.getWorldDirection(frente);
  direita.crossVectors(frente, camera.up).normalize();
  giro.setFromAxisAngle(camera.up, dx);
  pivo.quaternion.premultiply(giro);
  giro.setFromAxisAngle(direita, dy);
  pivo.quaternion.premultiply(giro);
}

const devagar = matchMedia('(prefers-reduced-motion: reduce)').matches;
function quadro() {
  if (!vivo) return;
  const dt = Math.min(0.05, vivo.relogio.getDelta());
  const tempo = vivo.relogio.elapsedTime;
  if (!vivo.arrastando) {
    vivo.embaloX *= ATRITO;
    vivo.embaloY *= ATRITO;
    if (vivo.mexeram || devagar) girar(vivo.embaloX, vivo.embaloY);
    else girar(GIRO_SOZINHO * dt, 0);
  }
  // Mexe do jeito que mexe no jogo: o unicórnio galopa, o bichinho bate asa.
  // O deslocamento que o bichinho devolve fica de fora — aqui ele voa parado.
  if (vivo.item.unicornio) animateUnicorn(vivo.objeto, tempo, 2.4, true, false, { asasAbertas: true });
  else if (vivo.item.ambiente) animateAmbience(vivo.objeto, tempo);
  else if (vivo.objeto.userData.algas) swaySeaweed(vivo.objeto, tempo);
  vivo.renderer.render(vivo.cena, vivo.camera);
  requestAnimationFrame(quadro);
}

function fechar() {
  if (!vivo) return;
  if (vivo.objeto) descartar(vivo.objeto);
  vivo.renderer.dispose();
  vivo.renderer.forceContextLoss?.();
  vivo.renderer.domElement.remove();
  vivo = null;
  if (dialogo.open) dialogo.close();
}

let ultimoX = 0;
let ultimoY = 0;
palco.addEventListener('pointerdown', (e) => {
  if (!vivo) return;
  Object.assign(vivo, { arrastando: true, mexeram: true, embaloX: 0, embaloY: 0 });
  ultimoX = e.clientX;
  ultimoY = e.clientY;
  palco.setPointerCapture(e.pointerId);
});
palco.addEventListener('pointermove', (e) => {
  if (!vivo?.arrastando) return;
  vivo.embaloX = (e.clientX - ultimoX) * SENSIBILIDADE;
  vivo.embaloY = (e.clientY - ultimoY) * SENSIBILIDADE;
  ultimoX = e.clientX;
  ultimoY = e.clientY;
  girar(vivo.embaloX, vivo.embaloY);
});
for (const evento of ['pointerup', 'pointercancel']) {
  palco.addEventListener(evento, () => { if (vivo) vivo.arrastando = false; });
}

document.querySelector('#perto-fechar').addEventListener('click', fechar);
document.querySelector('#perto-novo').addEventListener('click', () => vivo && montar(vivo.item));
dialogo.addEventListener('close', fechar);
dialogo.addEventListener('click', (e) => { if (e.target === dialogo) fechar(); });
addEventListener('resize', medir);
