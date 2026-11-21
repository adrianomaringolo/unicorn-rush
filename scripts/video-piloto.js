// O piloto automático do vídeo de anúncio.
//
// No anúncio ninguém segura o celular: as corridas são jogadas por isto. E
// não basta o unicórnio correr em linha reta — uma corrida em que os
// corações passam de raspão e o bicho tromba na primeira pedra não vende
// jogo nenhum. Então aqui ele olha o que vem pela frente, escolhe a faixa
// que rende mais e pula o que não dá para desviar.
//
// Roda dentro do navegador, um passo por quadro, chamado pelo
// `scripts/video.js` entre um `game.tick()` e outro. Não é código do jogo:
// nada disto entra no que a criança joga.
import { LANES, JUMP_VELOCITY, GRAVITY } from '../src/game/config.js';

// Até onde o piloto enxerga. Mais que isto não adianta: o mundo ainda nem
// sorteou o que vai nascer lá.
const HORIZONTE = 34;

// A janela em que uma coisa lá na frente conta para a escolha da faixa.
// Antes de 0,12 s já é tarde para trocar de faixa. O teto é generoso de
// propósito: em Aventura nasce **menos de um coração por fileira** (ver
// `spawnRow`, em src/game/world.js), então quem só olha o que está perto
// passa a corrida inteira na faixa do meio, sem nada para pegar.
const MIRA_MIN = 0.12;
const MIRA_MAX = 2.4;

// Quanto tempo o unicórnio fica acima de 1,1 (a altura que limpa um
// obstáculo) depois de pular: de SOBE a DESCE, contados do salto.
// 10t − 12t² = 1,1 → t = 0,13 e t = 0,70.
const SOBE = 0.13;
const DESCE = 0.70;
// Mirar o ápice no obstáculo dá a maior margem para os dois lados.
const APICE = JUMP_VELOCITY / (2 * GRAVITY);   // 0,417 s

// Trocar de faixa leva uns 0,3 s (LANE_CHANGE_SPEED, no config). Decidir
// mais rápido que isso é decidir em cima de uma posição que ainda está a
// caminho — e o unicórnio ziguezagueava sem sair do lugar.
const DESCANSO = 0.16;

// O quanto a faixa de agora ganha de vantagem num empate. Serve para o
// unicórnio não ficar trocando de faixa por diferenças de nada — mas baixo,
// porque com a pista rala o certo é ir buscar.
const TEIMOSIA = 0.3;

// O que vale a pena ir buscar. A chave é o que a criança está caçando no
// jogo, então é o que o piloto mais persegue.
const VALOR = { heart: 1, star: 2.2, key: 7, powerup: 3.2 };

// O medo é curto de propósito, e isto é a coisa mais importante do arquivo.
//
// Com o perigo pesando na conta a distância inteira, o piloto passava a
// corrida fugindo: em Aventura nascem obstáculos em duas das três faixas a
// cada fileira, então há sempre um lá longe empurrando ele para o lado, e
// ele chegava ao fim com um coração pego e sete perdidos. Um obstáculo a
// dois segundos não é problema nenhum — dá para trocar de faixa depois, ou
// pular. Só o que está a menos de PERTO vale desviar; o resto é ruído, e
// obedecer a ruído é o que fazia o unicórnio correr por pista vazia.
const PERIGO = -16;
const PERTO = 0.95;

const faixaDe = (x) => {
  let melhor = 0;
  for (let i = 1; i < LANES.length; i++) {
    if (Math.abs(LANES[i] - x) < Math.abs(LANES[melhor] - x)) melhor = i;
  }
  return melhor;
};

// Estado entre um quadro e outro. Fica num WeakMap e não no `game` para o
// piloto não deixar marca no objeto do jogo.
const memoria = new WeakMap();

// Placar do piloto, só para afinar: quantos colecionáveis ele pegou e
// quantos deixou passar. Quem é pego sai do `world.entities` na hora, então
// tudo o que ainda está lá depois de passar do unicórnio é coisa perdida —
// a conta é exata, não é estimativa.
export const placar = { perdidos: 0 };

export function pilotar(game, dt) {
  const estado = memoria.get(game) || { descanso: 0, folga: 0, duplo: -1 };
  memoria.set(game, estado);
  estado.descanso -= dt;
  estado.folga += dt;

  const p = game.player;

  // O segundo salto da cambalhota, marcado alguns quadros atrás. Sai no
  // meio da subida — colado no primeiro ele viraria um pulo só, alto e sem
  // graça.
  if (estado.duplo >= 0) {
    estado.duplo -= dt;
    if (estado.duplo < 0 && !p.grounded) { game.jump(); return; }
  }
  // No turbo ele já vai voando por cima de tudo: não há o que desviar, e
  // trocar de faixa no ar só tira ele de cima dos corações.
  if (game.powers.boost > 0) return;

  const velocidade = Math.max(1, game.speed);

  for (const e of game.world.entities) {
    if (e.position.z > 1.6 && !e.userData.__passou) {
      e.userData.__passou = true;
      if (e.userData.kind !== 'obstacle') placar.perdidos += 1;
    }
  }

  const notas = LANES.map(() => 0);
  // O que obriga a pular, por faixa: o instante em que ele chega.
  const pulo = LANES.map(() => null);

  for (const e of game.world.entities) {
    const z = e.position.z;
    if (z > 0.5 || z < -HORIZONTE) continue;
    if (e.userData.knocked || e.userData.dissolving !== undefined) continue;

    const tempo = -z / velocidade;
    if (tempo > MIRA_MAX) continue;

    const obstaculo = e.userData.kind === 'obstacle';
    // A barreira ocupa a pista inteira (é ela que tem `halfWidth`): não há
    // faixa para onde fugir, e ela entra nas três de uma vez.
    const barreira = obstaculo && e.userData.halfWidth !== undefined;
    const faixas = barreira ? LANES.map((_, i) => i) : [faixaDe(e.position.x)];

    for (const f of faixas) {
      if (obstaculo) {
        // Perto o bastante para o pulo resolver? Guarda o mais urgente.
        if (tempo > SOBE && tempo < DESCE + 0.25) {
          if (pulo[f] === null || tempo < pulo[f]) pulo[f] = tempo;
        }
        // Pesa forte de pertinho e nada de longe (ver PERIGO, acima).
        if (tempo < PERTO) notas[f] += PERIGO * (1 - tempo / PERTO);
      } else if (tempo > MIRA_MIN) {
        // O que está mais perto vale mais: é o que ele consegue pegar de
        // verdade nos próximos quadros.
        notas[f] += (VALOR[e.userData.kind] ?? 1) / Math.max(0.4, tempo);
      }
    }
  }

  const atual = p.lane;

  // --- Pular -------------------------------------------------------------
  //
  // Só do chão, e só na hora em que o ápice bate no obstáculo. O segundo
  // salto fica guardado para o que aparecer no meio do primeiro.
  const ameaca = pulo[atual];
  if (ameaca !== null && p.grounded && Math.abs(ameaca - APICE) < 0.055) {
    game.jump();
    return;
  }

  // --- Pena Mágica: um pulo para a câmera ver --------------------------
  //
  // A Pena deixa o pulo gigante, e um pulo só aparece se ele pular. Isto
  // só acontece na cena `poderes` do vídeo, que é a única coisa que
  // mantém a Pena acesa a corrida toda (ver `__poderes`, em video.js);
  // numa corrida comum ela dura oito segundos e some. Salta assim que a
  // faixa está limpa, com a cambalhota do pulo duplo.
  if (game.powers.feather > 0 && p.grounded && estado.descanso <= 0
      && notas[atual] >= 0 && estado.folga > 0.4) {
    game.jump();
    estado.duplo = 0.24;
    estado.folga = -1.4;
    return;
  }

  // --- Trocar de faixa ---------------------------------------------------
  if (estado.descanso > 0 || !p.grounded) return;

  // Só os vizinhos: o unicórnio anda uma faixa por vez, e comparar com a
  // faixa do outro lado da pista prometia o que ele não alcança a tempo.
  let alvo = atual;
  let melhor = notas[atual] + TEIMOSIA;
  for (const f of [atual - 1, atual + 1]) {
    if (f < 0 || f >= LANES.length) continue;
    if (notas[f] > melhor) { melhor = notas[f]; alvo = f; }
  }

  if (alvo !== atual) {
    game.moveLane(Math.sign(alvo - atual));
    estado.descanso = DESCANSO;
    estado.folga = 0;
    return;
  }

  // --- Um pulo de alegria ------------------------------------------------
  //
  // Com a pista limpa há um tempo, ele salta só por saltar — com a
  // cambalhota do pulo duplo, que é o movimento mais bonito do jogo e que
  // uma corrida bem jogada nunca mostraria sozinha.
  if (estado.folga > 2.6 && p.grounded && notas.every((n) => n >= 0)) {
    game.jump();
    estado.duplo = 0.22;   // o segundo sai daqui a pouco, ainda na subida
    estado.folga = -1.2;
  }
}
