// As pistas do jogo.
//
// Uma pista é só um punhado de cores + a lista de enfeites e obstáculos que
// podem nascer nela. O cenário é montado a partir disso (ver world.js e
// src/models/scenery.js), então inventar uma pista nova é acrescentar uma
// entrada aqui.
//
// Só o **Campo** vem liberado. As outras têm `price` e são trocadas por
// chaves mágicas 🔑, igual aos unicórnios (ver Game.buyItem). O mapa
// planejado é de TRACK_SLOTS pistas: as que ainda não existem aparecem na
// grade como espaço vazio.

export const TRACKS = {
  campo: {
    id: 'campo',
    name: 'Campo',
    emoji: '🌈',
    tagline: 'O campo encantado do arco-íris',
    sky: ['#bfe9ff', '#ffe3f4'],
    fog: { color: 0xd9f0ff, near: 45, far: 105 },
    ground: 0x9de8a4,
    path: 0xf7d9ff,
    kerb: 0xfff0fb,
    stripe: 0xffffff,
    stripeOpacity: 0.35,
    hemisphere: { sky: 0xffffff, ground: 0xffc3e6, intensity: 1.05 },
    sun: { color: 0xfff3d6, intensity: 1.5 },
    backdrop: 'rainbow',
    cloud: 0xffffff,
    mountains: [0xc7b9ff, 0xa8c8ff, 0xe0c3ff],
    decorations: ['tree', 'flower', 'flowerPatch', 'mushroom', 'flower', 'crystal'],
    obstacles: ['rock', 'candyBar', 'bush'],
    ambience: [{ kind: 'butterfly', count: 16 }, { kind: 'bee', count: 10 }],
  },

  doces: {
    id: 'doces',
    name: 'Doces',
    emoji: '🍭',
    tagline: 'Pirulitos, bolinhos e calda de morango',
    price: 5,
    sky: ['#ffc3e2', '#fff0cf'],
    fog: { color: 0xffd7ec, near: 42, far: 100 },
    ground: 0xffabd4,
    path: 0xffe9b8,
    kerb: 0xfff8e8,
    stripe: 0xfff6ff,
    stripeOpacity: 0.45,
    hemisphere: { sky: 0xfff0f6, ground: 0xffcfa8, intensity: 1.12 },
    sun: { color: 0xfff0d0, intensity: 1.45 },
    backdrop: 'clouds',
    cloud: 0xfff6fb,
    mountains: [0xff9ac9, 0xffcf8a, 0xc9a6ff],
    decorations: ['lollipop', 'cupcake', 'candyCane', 'sprinkles', 'chocolate', 'sprinkles'],
    obstacles: ['gumdrop', 'donut', 'candyBar'],
    ambience: [{ kind: 'ant', count: 18 }],
  },

  ceu: {
    id: 'ceu',
    name: 'Céu',
    emoji: '☁️',
    tagline: 'Correndo em cima das nuvens, pertinho do sol',
    price: 8,
    sky: ['#8fd3ff', '#ffe9c9'],
    fog: { color: 0xdcefff, near: 45, far: 110 },
    ground: 0xeff6ff,
    path: 0xfff1cf,
    kerb: 0xffffff,
    stripe: 0xfff8e0,
    stripeOpacity: 0.5,
    hemisphere: { sky: 0xffffff, ground: 0xdce9ff, intensity: 1.15 },
    sun: { color: 0xfff6e0, intensity: 1.55 },
    backdrop: 'sun',
    cloud: 0xffffff,
    mountains: [0xffffff, 0xeaf2ff, 0xffe8f4],
    decorations: ['cloudHill', 'balloon', 'rainbowArch'],
    obstacles: ['stormCloud', 'kite', 'balloonBunch'],
    ambience: [{ kind: 'bird', count: 18 }],
  },

  frutas: {
    id: 'frutas',
    name: 'Frutas',
    emoji: '🍓',
    tagline: 'Morangos, laranjeiras e cheiro de fruta madura',
    price: 12,
    sky: ['#c9f0a8', '#fff3c4'],
    fog: { color: 0xe6f7cf, near: 44, far: 104 },
    ground: 0x86d472,
    path: 0xffe3a8,
    kerb: 0xfff4d6,
    stripe: 0xfff8e0,
    stripeOpacity: 0.4,
    hemisphere: { sky: 0xffffff, ground: 0xc9e08a, intensity: 1.1 },
    sun: { color: 0xfff6cf, intensity: 1.5 },
    backdrop: 'rainbow',
    cloud: 0xffffff,
    mountains: [0x9bd88a, 0xffc46b, 0xff8f8f],
    decorations: [
      'strawberry', 'orangeTree', 'bananaBunch',
      'watermelonPatch', 'orangePile', 'grapes', 'kiwi',
      'strawberry', 'orangePile', 'grapes',
    ],
    decorationCount: 58,          // pomar cheio dos dois lados
    obstacles: ['watermelon', 'pineapple', 'coconutPile'],
    ambience: [{ kind: 'bee', count: 22 }, { kind: 'butterfly', count: 8 }],
  },

  praia: {
    id: 'praia',
    name: 'Praia',
    emoji: '🏖️',
    tagline: 'Areia quentinha, guarda-sóis e o mar ali do lado',
    price: 15,
    sky: ['#8fd8ff', '#ffe9c4'],
    fog: { color: 0xd6f0ff, near: 44, far: 104 },
    ground: 0x6fd6e8,
    path: 0xf5dda8,
    kerb: 0xfff0d0,
    stripe: 0xfff8e8,
    stripeOpacity: 0.4,
    hemisphere: { sky: 0xffffff, ground: 0xffe0b0, intensity: 1.15 },
    sun: { color: 0xfff3d6, intensity: 1.55 },
    backdrop: 'sun',
    cloud: 0xffffff,
    mountains: [0x8fd8ff, 0xa8e6f0, 0x7fd4e8],
    // Um lado é areia, o outro é mar: cada um com os seus enfeites (ver
    // World.buildDecorations e createGround).
    shore: {
      side: 1,                       // areia à direita, água à esquerda
      sand: 0xf0d7a8,
      sea: 0x3fb8d4,
      foam: 0xffffff,
      sandDecor: ['parasol', 'palmTree', 'beachChair', 'sandcastle', 'starfish', 'palmTree', 'beachChair', 'clam'],
      seaDecor: ['boat', 'surfboard', 'buoy', 'surfboard'],
    },
    decorations: ['parasol', 'palmTree', 'sandcastle', 'starfish', 'clam'],
    obstacles: ['coconutPile', 'rock', 'clam'],
    ambience: [{ kind: 'seagull', count: 14 }],
  },

  oceano: {
    id: 'oceano',
    name: 'Oceano',
    emoji: '🐠',
    tagline: 'Um caminho de areia no fundo do mar',
    price: 18,
    sky: ['#2f7fbf', '#a8e6f0'],
    fog: { color: 0x4f9fc4, near: 34, far: 88 },
    ground: 0x3f8fae,
    path: 0xffeec2,
    kerb: 0xfff6dd,
    stripe: 0xfff8e6,
    stripeOpacity: 0.35,
    hemisphere: { sky: 0xbfeaff, ground: 0x2b6f8f, intensity: 1.0 },
    sun: { color: 0xdff4ff, intensity: 1.15 },
    backdrop: null,
    // Debaixo d'água não há céu: sem nuvem (ver World.buildClouds).
    cloud: null,
    mountains: [0x2f7a94, 0x3f8fae, 0x53a5b8],
    decorations: ['coral', 'seaweed', 'starfish', 'coral'],
    obstacles: ['seaUrchin', 'clam', 'rock'],
    ambience: [{ kind: 'fish', count: 22 }, { kind: 'bubble', count: 26 }],
    helmet: true,          // capacete de ar na cabeça, para respirar embaixo d'água
  },

  noite: {
    id: 'noite',
    name: 'Noite',
    emoji: '🌙',
    tagline: 'Céu estrelado e cogumelos que brilham',
    price: 22,
    sky: ['#2f2c6b', '#7a5fa8'],
    fog: { color: 0x453f80, near: 38, far: 95 },
    ground: 0x4f5f9c,
    path: 0xc9c2ff,
    kerb: 0xe8e4ff,
    stripe: 0xe6e0ff,
    stripeOpacity: 0.4,
    hemisphere: { sky: 0xa9c0ff, ground: 0x3a2f66, intensity: 0.9 },
    sun: { color: 0xd4dcff, intensity: 0.95 },
    backdrop: 'moon',
    // Nesta pista os unicórnios brilham no escuro (ver Game.applyTrackGlow).
    glow: { intensity: 0.34, halo: 0xbfe9ff },
    cloud: 0x6f6ab0,
    mountains: [0x413f80, 0x4c4a95, 0x5d4b90],
    decorations: ['glowMushroom', 'pineTree', 'crystal'],
    obstacles: ['crystalSpike', 'moonStone', 'bigGlowMushroom'],
    ambience: [{ kind: 'firefly', count: 44 }],
  },

  geada: {
    id: 'geada',
    name: 'Geada',
    emoji: '❄️',
    tagline: 'Neve caindo, pinheiros brancos e chão escorregadio',
    price: 26,
    sky: ['#cfe9ff', '#f2f8ff'],
    fog: { color: 0xdfeeff, near: 34, far: 88 },
    ground: 0xf2f8ff,
    path: 0xdff0ff,
    kerb: 0xffffff,
    stripe: 0x9ed8f5,
    stripeOpacity: 0.45,
    hemisphere: { sky: 0xffffff, ground: 0xd0e4f5, intensity: 1.2 },
    sun: { color: 0xeaf4ff, intensity: 1.2 },
    backdrop: 'sun',
    cloud: 0xffffff,
    mountains: [0xdfeeff, 0xc4dcf0, 0xeaf4ff],
    decorations: ['snowPine', 'igloo', 'iceCrystal', 'snowman', 'snowPine'],
    obstacles: ['iceBlock', 'rock', 'crystalSpike'],
    ambience: [{ kind: 'snow', count: 60 }],
    // Chão escorregadio: trocar de faixa demora mais para "pegar".
    laneGrip: 0.45,
  },

  vulcao: {
    id: 'vulcao',
    name: 'Vulcão',
    emoji: '🌋',
    tagline: 'Pedra preta, fresta acesa e brasa no ar',
    price: 30,
    sky: ['#4a2233', '#c9542a'],
    fog: { color: 0x7a3a2e, near: 36, far: 92 },
    ground: 0x3b3340,
    path: 0xffd6a8,
    kerb: 0x2b2530,
    stripe: 0xff9500,
    stripeOpacity: 0.5,
    hemisphere: { sky: 0xffb98a, ground: 0x4a2a33, intensity: 1.0 },
    sun: { color: 0xffb070, intensity: 1.3 },
    backdrop: 'sun',
    // Sem `glow`: aqui o unicórnio não acende nem ganha halo. Quem ilumina a
    // cena é o chão, e uma aura em volta dele competiria com a lava.
    cloud: 0x8a5a58,
    mountains: [0x5c3340, 0x74403a, 0x3f2b3a],
    decorations: ['lavaPool', 'lavaRock', 'emberVent', 'lavaPool', 'charredTree', 'lavaRock'],
    obstacles: ['lavaBoulder', 'rock', 'crystalSpike'],
    // Faíscas de fogo subindo por toda a volta e fumaça em alguns pontos.
    ambience: [{ kind: 'spark', count: 44 }, { kind: 'smoke', count: 7 }],
  },

  espaco: {
    id: 'espaco',
    name: 'Espaço',
    emoji: '🚀',
    tagline: 'Planetas, meteoros e um pulo que não quer descer',
    price: 36,
    sky: ['#150f33', '#3b2a6b'],
    fog: { color: 0x241a4d, near: 40, far: 96 },
    ground: 0x2a2150,
    path: 0xb9a8ff,
    kerb: 0x4a3d8c,
    stripe: 0xfff0c9,
    stripeOpacity: 0.5,
    hemisphere: { sky: 0xbfa8ff, ground: 0x1a1440, intensity: 0.95 },
    sun: { color: 0xe8e0ff, intensity: 1.1 },
    backdrop: 'moon',
    glow: { intensity: 0.3, halo: 0xc9a6ff },
    // No espaço não há chão, nem serra no horizonte, nem nuvem: só a faixa
    // da pista flutuando no vazio. É o que dá a sensação de voo.
    ground: null,
    mountains: null,
    cloud: null,
    // Metade das estrelas fica abaixo da linha da pista.
    starsBelow: true,
    // Planeta é raro de propósito (1 em 10): ele é o que chama atenção, e
    // repetido a cada dois enfeites virava papel de parede. O resto é
    // cascalho e pedaço de asteroide, que é o que povoa o vazio.
    decorations: [
      'asteroid', 'asteroidChunk', 'asteroid', 'ufo', 'asteroidChunk',
      'asteroid', 'asteroidChunk', 'ufo', 'asteroid', 'planet',
    ],
    obstacles: ['meteor', 'asteroid', 'rock'],
    // Meteoritos atravessando, no lugar dos vagalumes.
    ambience: [{ kind: 'meteorite', count: 16 }],
    // Gravidade baixa: o pulo sobe mais e desce devagar.
    gravity: 0.55,
  },
};

export const TRACK_LIST = Object.values(TRACKS);
export const DEFAULT_TRACK = 'campo';

// Preço em chaves mágicas; 0 para a que já vem liberada (o Campo).
export const trackPrice = (track) => track?.price || 0;

// O tamanho final do mapa. A grade desenha um espaço vazio para cada pista
// que ainda falta criar.
export const TRACK_SLOTS = 15;
