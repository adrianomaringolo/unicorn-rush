// As pistas do jogo.
//
// Uma pista é só um punhado de cores + a lista de enfeites e obstáculos que
// podem nascer nela. O cenário é montado a partir disso (ver world.js e
// src/models/scenery.js), então inventar uma pista nova é acrescentar uma
// entrada aqui.

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
  },

  doces: {
    id: 'doces',
    name: 'Doces',
    emoji: '🍭',
    tagline: 'Pirulitos, bolinhos e calda de morango',
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
    decorations: ['lollipop', 'cupcake', 'candyCane'],
    obstacles: ['gumdrop', 'donut', 'candyBar'],
  },

  ceu: {
    id: 'ceu',
    name: 'Céu',
    emoji: '☁️',
    tagline: 'Correndo em cima das nuvens, pertinho do sol',
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
  },

  noite: {
    id: 'noite',
    name: 'Noite',
    emoji: '🌙',
    tagline: 'Céu estrelado e cogumelos que brilham',
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
    fireflies: 44,
  },
};

export const TRACK_LIST = Object.values(TRACKS);
export const DEFAULT_TRACK = 'campo';
