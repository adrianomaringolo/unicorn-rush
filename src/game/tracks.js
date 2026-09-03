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
    story: 'Onde tudo começou. A grama é macia, o arco-íris encosta no chão e há flores e cogumelos por toda parte — é a pista mais calma do reino.',
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
    story: 'Um lugar feito de sobremesa: pirulitos do tamanho de árvore, bolinhos com cobertura e granulado caindo do céu. Cuidado com as balas de goma no caminho.',
    price: 4,
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

  vilarejo: {
    id: 'vilarejo',
    name: 'Vilarejo',
    emoji: '🎩',
    tagline: 'Casinhas, lampiões e uma rua tranquila de pedra',
    story: 'Ruas de pedra entre casinhas de telhado torto, com lampiões acesos e um poço no meio. Aqui se corre devagar e se cumprimenta todo mundo.',
    // Barata de propósito: é a pista mansa, a de aprender, e quem mais
    // precisa dela é quem tem menos chaves.
    price: 6,
    sky: ['#ffe0b0', '#ffd08a'],
    fog: { color: 0xffe6c4, near: 46, far: 108 },
    ground: 0x9ab894,
    path: 0xd9cbb0,
    kerb: 0xf0e2c8,
    stripe: 0xfff6ec,
    stripeOpacity: 0.35,
    hemisphere: { sky: 0xfff0d6, ground: 0xd6c4a8, intensity: 1.1 },
    sun: { color: 0xffe0b0, intensity: 1.4 },
    backdrop: 'sun',
    cloud: 0xfff6ec,
    mountains: [0xc4b494, 0xa89878, 0xd6c4a8],
    decorations: ['cottage', 'lamppost', 'well', 'cottage', 'tree', 'lamppost'],
    obstacles: ['crate', 'barrel', 'bush'],
    ambience: [{ kind: 'bird', count: 10 }, { kind: 'butterfly', count: 8 }],
    // Pista mansa: pouca coisa no caminho e nenhuma barreira.
    obstacleChance: 0.14,
    barrierChance: 0,
  },

  ceu: {
    id: 'ceu',
    name: 'Céu',
    emoji: '☁️',
    tagline: 'Correndo em cima das nuvens, pertinho do sol',
    story: 'Em cima das nuvens, tão perto do sol que dá para sentir o calor. Balões passam do lado e arcos de arco-íris viram portais no caminho.',
    price: 7,
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
    story: 'Um pomar sem fim: laranjeiras carregadas, morangos do tamanho de arbusto e bananas caídas na grama. Cheira a fruta madura o tempo todo.',
    price: 10,
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
    // A lista é um saquinho de sorteio: repetir um nome deixa ele mais
    // comum. A `tree` é a mesma árvore frondosa do Campo, que já nasce com
    // frutinhas na copa — é ela que dá altura ao pomar agora que a banana
    // ficou no chão.
    decorations: [
      'tree', 'strawberry', 'orangeTree', 'bananaPile',
      'watermelonPatch', 'tree', 'orangePile', 'grapes', 'kiwi',
      'strawberry', 'orangePile', 'grapes', 'tree',
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
    story: 'Areia quentinha, guarda-sóis listrados e castelinhos que alguém esqueceu de terminar. O mar fica ali do lado, fazendo barulho.',
    price: 13,
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
    story: 'Um caminho de areia no fundo do mar, entre corais e algas que balançam. Os peixes param para ver quem passa.',
    price: 16,
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
    story: 'A floresta depois que todo mundo dorme. Os cogumelos acendem sozinhos, as estrelas ficam bem baixas e o silêncio faz companhia.',
    price: 19,
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
    story: 'Neve caindo devagar, pinheiros brancos e um boneco de neve que ninguém sabe quem fez. O chão escorrega: é preciso cuidado.',
    price: 23,
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
    story: 'Pedra preta e rachaduras acesas por baixo. Sai brasa do chão e o ar treme de calor — só os corajosos correm aqui.',
    price: 27,
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

  parque: {
    id: 'parque',
    name: 'Parque',
    emoji: '🎪',
    tagline: 'Tendas listradas, roda-gigante e algodão-doce',
    story: 'O parque nunca fecha: tendas listradas, roda-gigante girando e cheiro de algodão-doce. A música do carrossel toca o tempo inteiro.',
    price: 28,
    sky: ['#ffd6de', '#fff0c4'],
    fog: { color: 0xffe0e6, near: 44, far: 102 },
    ground: 0x8fd48a,
    path: 0xfff0d6,
    kerb: 0xff4d5e,
    stripe: 0xff8f9c,
    stripeOpacity: 0.45,
    hemisphere: { sky: 0xffffff, ground: 0xffd0d6, intensity: 1.15 },
    sun: { color: 0xfff3d6, intensity: 1.5 },
    backdrop: 'rainbow',
    cloud: 0xffffff,
    mountains: [0xff9ecb, 0xffd166, 0x9be7ff],
    decorations: ['circusTent', 'ferrisWheel', 'cottonCandy', 'carousel', 'balloon', 'circusTent'],
    obstacles: ['popcornBox', 'gumdrop', 'donut'],
    // No Parque não voam bichos: voa música. As notas sobem girando e o
    // confete cai rodopiando, como se a festa não parasse nunca.
    ambience: [{ kind: 'note', count: 16 }, { kind: 'confetti', count: 20 }],
    // Fila apertada: aqui é preciso desviar sem parar — é a pista da Cereja.
    obstacleChance: 0.58,
    spawnInterval: 0.5,
  },

  espaco: {
    id: 'espaco',
    name: 'Espaço',
    emoji: '🚀',
    tagline: 'Planetas, meteoros e um pulo que não quer descer',
    story: 'Sem chão e quase sem peso — o pulo demora a descer. Planetas passam de longe e um disco voador espia de vez em quando.',
    price: 32,
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

  tempestade: {
    id: 'tempestade',
    name: 'Tempestade',
    emoji: '⚡',
    tagline: 'Chuva, poças e o vento empurrando de lado',
    story: 'Chuva de lado, poças refletindo o céu de chumbo e um moinho girando sozinho. De vez em quando um raio rasga tudo.',
    price: 36,
    sky: ['#3d4a63', '#7a8aa8'],
    fog: { color: 0x5a6880, near: 38, far: 92 },
    ground: 0x4f6b52,
    path: 0x8a94a8,
    kerb: 0xa8b2c4,
    stripe: 0xfff08a,
    stripeOpacity: 0.5,
    hemisphere: { sky: 0xa8b8d6, ground: 0x3a4658, intensity: 0.95 },
    sun: { color: 0xd6e0f5, intensity: 1.0 },
    backdrop: null,
    cloud: 0x5c6880,
    mountains: [0x3a4658, 0x4a5870, 0x2f3a4a],
    decorations: ['windmill', 'lightningRod', 'puddle', 'ghostTree', 'puddle'],
    obstacles: ['barrel', 'rock', 'stormCloud'],
    ambience: [{ kind: 'rain', count: 90 }],
    // O vento empurra devagar para um lado, e relâmpagos clareiam a cena.
    sideWind: 1.5,
    lightning: true,
  },

  bruma: {
    id: 'bruma',
    name: 'Bruma',
    emoji: '🌫️',
    tagline: 'Névoa fechada: o caminho aparece na hora',
    story: 'A névoa é tão fechada que o caminho só aparece na hora. Lanternas flutuam sem ninguém segurando, e dizem que há uma torre em algum lugar lá dentro.',
    price: 41,
    sky: ['#6b6480', '#b8aec9'],
    // A névoa é a mecânica: fecha em 14 e engole tudo em 34, contra os
    // 38–108 das outras pistas. O obstáculo aparece, em vez de se anunciar.
    fog: { color: 0x9a93a8, near: 14, far: 34 },
    ground: 0x7d7590,
    path: 0xc9c2d6,
    kerb: 0xa8a0b8,
    stripe: 0xe0d8ee,
    stripeOpacity: 0.4,
    hemisphere: { sky: 0xd6cee6, ground: 0x5c5670, intensity: 1.0 },
    sun: { color: 0xd9d2e8, intensity: 0.9 },
    backdrop: null,
    cloud: null,
    mountains: null,
    decorations: ['ghostTree', 'floatingLantern', 'mossRock', 'ghostTree', 'floatingLantern'],
    obstacles: ['rock', 'bush', 'crate'],
    ambience: [{ kind: 'smoke', count: 26 }],
  },

  caverna: {
    id: 'caverna',
    name: 'Caverna',
    emoji: '💎',
    tagline: 'Cristais acesos no escuro e poças que brilham',
    story: 'O fundo da terra, onde os cristais acendem sozinhos e as poças brilham. Cada passo ecoa duas vezes.',
    price: 48,
    sky: ['#241a38', '#4a3a6b'],
    fog: { color: 0x2f2547, near: 30, far: 78 },
    ground: 0x413c52,
    path: 0x6b6478,
    kerb: 0x585268,
    stripe: 0x8ce9ff,
    stripeOpacity: 0.4,
    hemisphere: { sky: 0x9a8ec4, ground: 0x241f33, intensity: 0.85 },
    sun: { color: 0xc9b8ff, intensity: 0.8 },
    backdrop: null,
    // No escuro da caverna o unicórnio acende, como na Noite.
    glow: { intensity: 0.32, halo: 0x8ce9ff },
    cloud: null,
    mountains: [0x2f2a42, 0x3d3652, 0x241f33],
    decorations: ['crystalVein', 'stalagmite', 'glowPool', 'crystalVein', 'stalagmite'],
    obstacles: ['stalagmite', 'crystalSpike', 'rock'],
    ambience: [{ kind: 'firefly', count: 40 }],
  },
};

export const TRACK_LIST = Object.values(TRACKS);
export const DEFAULT_TRACK = 'campo';

// Preço em chaves mágicas; 0 para a que já vem liberada (o Campo).
export const trackPrice = (track) => track?.price || 0;

// O tamanho final do mapa. A grade desenha um espaço vazio para cada pista
// que ainda falta criar.
export const TRACK_SLOTS = 15;
