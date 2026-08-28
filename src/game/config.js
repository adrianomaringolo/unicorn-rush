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
  },
};

// Níveis de dificuldade do modo Aventura: mudam quantos obstáculos aparecem
// (e um tiquinho a velocidade), mantendo o resto igual.
export const DIFFICULTIES = {
  facil: {
    id: 'facil',
    name: 'Fácil',
    emoji: '🌱',
    tagline: 'Pouca coisa no caminho',
    obstacleChance: 0.22,
    startSpeed: 10,
    maxSpeed: 20,
    speedRamp: 0.25,
  },
  medio: {
    id: 'medio',
    name: 'Médio',
    emoji: '🌞',
    tagline: 'Do jeitinho certo',
    obstacleChance: 0.4,
    startSpeed: 12,
    maxSpeed: 26,
    speedRamp: 0.35,
  },
  dificil: {
    id: 'dificil',
    name: 'Difícil',
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

export const SPAWN_DISTANCE = -90;        // onde os objetos nascem (à frente)
export const DESPAWN_DISTANCE = 12;       // onde são reciclados (atrás da câmera)

export const START_LIVES = 3;
export const INVULNERABLE_TIME = 1.4;     // segundos piscando após levar toque

export const HEART_POINTS = 10;

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
