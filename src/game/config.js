// Configurações centrais do UnicornRush.
// Tudo que dá para ajustar sem mexer na lógica do jogo mora aqui.

export const LANES = [-2.2, 0, 2.2];      // posição X de cada pista
export const LANE_CHANGE_SPEED = 10;      // suavidade da troca de pista

// Modos de jogo. O modo "Livre" não tem obstáculo nenhum: a criança só
// precisa juntar uma quantidade fixa de itens para ganhar.
export const MODES = {
  baby: {
    id: 'baby',
    name: 'Livre',
    emoji: '🎈',
    tagline: 'Sem obstáculos — é só juntar!',
    obstacles: false,
    startSpeed: 8.5,
    maxSpeed: 11,
    speedRamp: 0.1,
    spawnInterval: 0.75,
    // A meta começa em `target` e sobe `targetStep` a cada vitória,
    // até `targetMax` (ver Game.goal).
    target: 20,
    targetStep: 5,
    targetMax: 60,
  },
  levels: {
    id: 'levels',
    name: 'Fases',
    emoji: '🗺️',
    tagline: '10 fases, cada uma com sua meta de chaves',
    obstacles: true,
    // Velocidade, intervalo e chance de obstáculo vêm da fase
    // (ver src/game/levels.js e Game.levelMode).
    startSpeed: 9,
    maxSpeed: 11,
    speedRamp: 0.05,
    spawnInterval: 0.85,
    target: null,
  },

  adventure: {
    id: 'adventure',
    name: 'Aventura',
    emoji: '⭐',
    tagline: 'Com obstáculos e 3 vidas',
    obstacles: true,
    startSpeed: 12,
    maxSpeed: 26,
    speedRamp: 0.35,
    spawnInterval: 0.55,
    target: null,        // corrida infinita
    difficulties: 'adventure',
    // Aqui a chave também aparece, mas bem mais rara que nas Fases: lá sai
    // uma a cada ~12 linhas, aqui a cada ~28. Não há meta de chaves na
    // Aventura — cada uma vai direto para a carteira e fica, mesmo se a
    // corrida acabar em seguida.
    keyGap: 24,
    keyChance: 0.22,
  },
};

// Níveis de dificuldade do modo Aventura: mudam quantos obstáculos aparecem
// (e um tiquinho a velocidade), mantendo o resto igual.
//
// Os nomes falam de velocidade, não de habilidade: criança de cinco anos não
// quer escolher "Difícil", quer escolher "voando".
export const DIFFICULTIES = {
  facil: {
    id: 'facil',
    barrierChance: 0.16,
    name: 'Devagarinho',
    emoji: '🐢',
    tagline: 'Pouca coisa no caminho',
    obstacleChance: 0.22,
    startSpeed: 10,
    maxSpeed: 20,
    speedRamp: 0.25,
  },
  medio: {
    id: 'medio',
    barrierChance: 0.3,
    name: 'Normal',
    emoji: '🌞',
    tagline: 'Do jeitinho certo',
    obstacleChance: 0.4,
    startSpeed: 12,
    maxSpeed: 26,
    speedRamp: 0.35,
  },
  dificil: {
    id: 'dificil',
    barrierChance: 0.45,
    name: 'Voando',
    emoji: '⚡',
    tagline: 'Pista cheia, sem moleza',
    obstacleChance: 0.62,
    startSpeed: 14,
    maxSpeed: 30,
    speedRamp: 0.45,
  },
};

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES);
export const DEFAULT_DIFFICULTY = 'medio';

export const DEFAULT_MODE = 'baby';

export const FLY_HEIGHT = 2.0;            // altura do voo durante o turbo
export const JUMP_VELOCITY = 10;
export const GRAVITY = 24;

// Pulo duplo: no ar dá para bater as asas mais uma vez. O segundo impulso é
// um tiquinho menor que o primeiro, para o pulo duplo ganhar altura sem
// virar voo — e ele vem com uma cambalhota, que é o aviso visual de que a
// segunda chance foi usada.
export const MAX_JUMPS = 2;
export const DOUBLE_JUMP_VELOCITY = 8.6;
export const FLIP_TIME = 0.5;             // duração da cambalhota, em segundos

// Barreiras: obstáculos que ocupam as três pistas de uma vez, então a única
// saída é pular. `gap` é o mínimo de linhas entre uma e a próxima e
// `firstGap` segura a primeira, para ninguém levar barreira nos primeiros
// segundos de corrida.
export const BARRIER = { gap: 8, firstGap: 15 };

export const SPAWN_DISTANCE = -90;        // onde os objetos nascem (à frente)
export const DESPAWN_DISTANCE = 12;       // onde são reciclados (atrás da câmera)

// Quando o unicórnio corre na pista dele, o botão ⚡ do HUD dispara: o mundo
// passa mais rápido. É opcional de propósito — mais veloz é mais divertido,
// mas também é mais obstáculo por segundo.
export const RUSH_SPEED = 1.35;

export const START_LIVES = 3;
export const INVULNERABLE_TIME = 1.4;     // segundos piscando após levar toque

export const HEART_POINTS = 10;

// Corações que valem uma chave mágica. É o jeito de quem joga o modo Livre
// também ganhar chaves — lá não nasce nenhuma na pista.
export const HEARTS_PER_KEY = 50;

export const COLORS = {
  sky: 0xbfe9ff,
  skyBottom: 0xffe3f4,
  grass: 0x9de8a4,
  path: 0xf7d9ff,
  fog: 0xd9f0ff,
  unicornBody: 0xfffaff,
  horn: 0xffd166,
  mane: [0xff8fb1, 0xffd166, 0x8ce99a, 0x74c0fc, 0xb197fc],
  heart: 0xff5d8f,
  star: 0xffe066,
};
