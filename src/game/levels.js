// As doze fases do modo Fases.
//
// A tabela é uma só, mas o **progresso é por pista**: cada pista tem as suas
// doze, guardadas separadas no save (ver storage.js e Game.trackLevels). Ou
// seja, comprar uma pista nova abre um caminho inteiro de novo.
//
// Cada fase diz quantas chaves mágicas é preciso juntar e o quanto a pista
// aperta: velocidade, distância entre as linhas de itens e a chance de sair
// obstáculo. A fase 1 é bem tranquila; a 10 é corrida de gente grande.

export const LEVELS = [
  // keyGap = mínimo de linhas entre uma chave e a próxima (é o que dá a
  // distância na pista); keyChance = chance de sair a chave depois disso.
  //
  // barrierChance = chance de sair a barreira que ocupa as três pistas (a
  // que obriga a pular). As duas primeiras fases não têm nenhuma: elas são
  // onde a criança aprende a desviar, e pular vem depois.
  { keys: 3,  startSpeed: 9,  maxSpeed: 11,   speedRamp: 0.05, spawnInterval: 0.85, obstacleChance: 0.10, keyGap: 8,  keyChance: 0.55, barrierChance: 0 },
  { keys: 4,  startSpeed: 10, maxSpeed: 12.5, speedRamp: 0.08, spawnInterval: 0.80, obstacleChance: 0.16, keyGap: 9,  keyChance: 0.50, barrierChance: 0 },
  { keys: 4,  startSpeed: 11, maxSpeed: 14,   speedRamp: 0.10, spawnInterval: 0.75, obstacleChance: 0.22, keyGap: 10, keyChance: 0.50, barrierChance: 0.18 },
  { keys: 5,  startSpeed: 12, maxSpeed: 15.5, speedRamp: 0.12, spawnInterval: 0.72, obstacleChance: 0.28, keyGap: 10, keyChance: 0.45, barrierChance: 0.24 },
  { keys: 6,  startSpeed: 13, maxSpeed: 17,   speedRamp: 0.14, spawnInterval: 0.68, obstacleChance: 0.34, keyGap: 11, keyChance: 0.45, barrierChance: 0.30 },
  { keys: 7,  startSpeed: 14, maxSpeed: 18.5, speedRamp: 0.16, spawnInterval: 0.65, obstacleChance: 0.40, keyGap: 11, keyChance: 0.40, barrierChance: 0.34 },
  { keys: 8,  startSpeed: 15, maxSpeed: 20,   speedRamp: 0.18, spawnInterval: 0.62, obstacleChance: 0.46, keyGap: 12, keyChance: 0.40, barrierChance: 0.38 },
  { keys: 9,  startSpeed: 16, maxSpeed: 21.5, speedRamp: 0.20, spawnInterval: 0.60, obstacleChance: 0.52, keyGap: 12, keyChance: 0.40, barrierChance: 0.42 },
  { keys: 10, startSpeed: 17, maxSpeed: 23,   speedRamp: 0.22, spawnInterval: 0.58, obstacleChance: 0.58, keyGap: 12, keyChance: 0.40, barrierChance: 0.46 },
  { keys: 12, startSpeed: 18, maxSpeed: 25,   speedRamp: 0.25, spawnInterval: 0.55, obstacleChance: 0.65, keyGap: 11, keyChance: 0.45, barrierChance: 0.52 },
  { keys: 13, startSpeed: 19, maxSpeed: 26.5, speedRamp: 0.27, spawnInterval: 0.53, obstacleChance: 0.68, keyGap: 11, keyChance: 0.45, barrierChance: 0.55 },
  { keys: 15, startSpeed: 20, maxSpeed: 28,   speedRamp: 0.30, spawnInterval: 0.50, obstacleChance: 0.72, keyGap: 10, keyChance: 0.48, barrierChance: 0.58 },
];

export const LEVEL_COUNT = LEVELS.length;

export function levelData(number) {
  return LEVELS[Math.min(Math.max(1, number), LEVEL_COUNT) - 1];
}
