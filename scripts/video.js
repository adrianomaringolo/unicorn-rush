// Gera o vídeo de anúncio do jogo: 9:16, ~55 segundos, para redes sociais.
//
// O que sai daqui é `assets/video/unicornrush-anuncio.mp4` — o jogo de verdade
// correndo, com a trilha de verdade do jogo por cima.
//
// Uso: npm run video               (tudo: cenas, trilha e montagem)
//      npm run video -- --fotos    (uma foto de cada cena, para conferir)
//      npm run video -- --montar   (só remonta, reaproveitando os quadros)
//
// ---------------------------------------------------------------------------
//
// Como isto grava um jogo sem ninguém jogando
//
// O jogo roda num Chrome sem janela, e o vídeo **não** é uma filmagem da
// tela: o `game.tick()` é chamado na mão, um por quadro, com o relógio
// preso em 1/30 de segundo (`game.clock.getDelta`). Isso troca a pressa
// por qualidade — o Chrome sem janela renderiza three.js por software, uns
// oito quadros por segundo, e uma filmagem sairia aos pedaços. Chamando
// quadro a quadro, cada um leva o tempo que tiver de levar e o vídeo sai
// liso, com sombra e antisserrilhado ligados. De brinde, sai igualzinho
// toda vez que roda.
//
// Ninguém joga, então quem joga é o `scripts/video-piloto.js`: ele olha o
// que vem pela frente, escolhe a faixa que rende mais e pula o que aparece.
//
// As três peças que faltam:
//   - `scripts/video-musica.html`  a trilha, um medley dos temas do jogo
//   - `scripts/video-cartelas.html` os textos e o letreiro do fim
//   - o ffmpeg, que junta tudo
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..');
const SAIDA = join(RAIZ, 'assets/video');
const QUADROS = join(RAIZ, '.quadros-video');
// O perfil do Chrome fica **fora** da pasta dos quadros: ela é apagada e
// recriada a cada geração, e apagar por baixo de um Chrome aberto falha.
const PERFIL = join(RAIZ, '.quadros-video-chrome');
const FPS = 30;
const PORTA = 5196;
const DEBUG = 9422;

const argumentos = process.argv.slice(2);
const so = (bandeira) => argumentos.includes(bandeira);
// `--cena=grade` regrava uma cena só, por cima dos quadros que já estão lá,
// e remonta. Mexer no texto de uma cartela ou no enquadramento de uma tela
// não devia custar os quinze minutos de gravar as onze cenas de novo.
const SO_CENA = argumentos.find((a) => a.startsWith('--cena='))?.slice(7);

// ---------------------------------------------------------------------------
// O roteiro
// ---------------------------------------------------------------------------
//
// A duração de cada cena está em **batidas da música**, não em segundos: é
// o que faz cada corte cair no tempo do medley (ver as SECOES, em
// scripts/video-musica.html). Um corte 80 ms fora do tempo não parece um
// corte fora do tempo — parece um vídeo mal feito, sem se saber por quê.
const BATIDA = { campo: 60 / 124, frutas: 60 / 132 };

// Uma corrida: troca o unicórnio e a pista só para esta cena (o save não é
// tocado) e larga sem contagem.
const corrida = (personagem, pista, dificuldade = 'facil') =>
  `__corrida('${personagem}', '${pista}', '${dificuldade}')`;

const ROTEIRO = [
  // --- Seção 1: a largada e quatro pistas ----------------------------------
  //
  // Abre com a contagem do próprio jogo — "3, 2, 1, Vai!", um número por
  // batida da música. É o começo de uma corrida de verdade: pista ainda
  // vazia, placar zerado, o portal de partida no chão. Num vídeo de rede
  // social a contagem é o melhor gancho que este jogo tem: quem vê já sabe
  // que alguma coisa vai começar, e fica.
  //
  // Sem aquecimento nenhum aqui (`aquecer: 0`), ao contrário de todas as
  // outras: é justamente o primeiro instante da corrida que se quer.
  {
    nome: 'contagem', ritmo: 'campo', batidas: 4,
    preparar: `__contagem('uni', 'campo')`,
    porQuadro: `(fatia) => __contar(fatia)`,
    aquecer: 0,
  },
  // E aí a Uni correndo. É com ela e no Campo que toda criança começa —
  // quem já jogou reconhece na primeira imagem. Depois muda tudo de cor a
  // cada corte: Doces, Céu, Oceano.
  {
    nome: 'campo', ritmo: 'campo', batidas: 8,
    preparar: corrida('uni', 'campo'), piloto: true,
  },
  {
    nome: 'doces', ritmo: 'campo', batidas: 6,
    preparar: corrida('cereja', 'doces'), piloto: true,
  },
  {
    nome: 'ceu', ritmo: 'campo', batidas: 6,
    preparar: corrida('sol', 'ceu'), piloto: true,
  },
  {
    nome: 'oceano', ritmo: 'campo', batidas: 8,
    preparar: corrida('onda', 'oceano'), piloto: true,
  },

  // --- Seção 2: a rajada ---------------------------------------------------
  //
  // Meio compasso cada, na virada da música para o tema das Frutas — que é
  // mais rápido (132 contra 124), então a aceleração acontece sozinha. Seis
  // pistas que não se parecem com nada do que veio antes, e em cada uma o
  // unicórnio que é daquele lugar: a Lua na Noite, o Brasa no Vulcão, o
  // Cometa no Espaço, o Relâmpago na Tempestade, o Floco na Geada e o
  // Cristal na Caverna. Com as quatro da abertura e a das Frutas na cena
  // dos power-ups, o vídeo mostra onze das quinze pistas.
  {
    nome: 'noite', ritmo: 'frutas', batidas: 4,
    preparar: corrida('lua', 'noite'), piloto: true,
  },
  {
    nome: 'vulcao', ritmo: 'frutas', batidas: 4,
    preparar: corrida('brasa', 'vulcao'), piloto: true,
  },
  {
    nome: 'espaco', ritmo: 'frutas', batidas: 4,
    preparar: corrida('cometa', 'espaco'), piloto: true,
  },
  {
    nome: 'tempestade', ritmo: 'frutas', batidas: 4,
    preparar: corrida('relampago', 'tempestade'), piloto: true,
  },
  {
    nome: 'geada', ritmo: 'frutas', batidas: 4,
    preparar: corrida('floco', 'geada'), piloto: true,
  },
  {
    nome: 'caverna', ritmo: 'frutas', batidas: 4,
    preparar: corrida('cristal', 'caverna'), piloto: true,
  },

  // --- Os power-ups em ação ----------------------------------------------
  //
  // Dois compassos das Frutas, ainda na rajada: uma corrida em que o Ímã, a
  // Pena Mágica, o Escudo e a Bomba Arco-Íris nascem de propósito, um a cada
  // fração da cena (ver `__poderes` e `__poderesPasso`), para o vídeo
  // mostrar cada efeito — os corações vindo sozinhos, o pulo gigante, a
  // bolha, e a onda de arco-íris varrendo a pista no corte para a grade. O
  // piloto já corre atrás de power-up (ver VALOR, em video-piloto.js), então
  // basta fazê-los aparecer na frente dele.
  {
    nome: 'poderes', ritmo: 'frutas', batidas: 16,
    preparar: `__poderes('estrela', 'frutas')`,
    porQuadro: `(t) => __poderesPasso(t)`,
    piloto: true,
  },

  // --- Seção 3: o que tem dentro -------------------------------------------
  //
  // A música volta ao tema do Campo, mais lento: daqui para a frente são
  // telas para ler, e a pressa da rajada atrapalharia.
  //
  // A grade dos 22, rolando devagar de cima a baixo — é o retrato de todos
  // eles que faz entender o tamanho do elenco. O 3D continua vivo atrás do
  // cartão (na tela de escolha o unicórnio gira sozinho), então isto não é
  // uma foto parada.
  {
    nome: 'grade', ritmo: 'frutas', batidas: 8,
    preparar: `__tela(() => { game.applyForRun('estrela', 'ceu'); game.showCharacterPicker(); })`,
    // Começa mostrando as primeiras fileiras e desce até o fim da grade.
    porQuadro: `(t) => __rolar(t)`,
  },
  // A ficha de um deles: retrato grande, quem é e a historinha. É a tela que
  // mostra que cada unicórnio é alguém, e não uma cor diferente.
  {
    nome: 'ficha', ritmo: 'campo', batidas: 6,
    preparar: `__tela(() => { game.showItemSheet('character', 'estrela'); })`,
  },
  // O livro. É o que o jogo tem de mais diferente de um corredor qualquer:
  // uma história de nove páginas, com desenho em todas, que o aparelho lê em
  // voz alta para quem ainda não lê (ver o `speak` no `turnPage`). Três
  // páginas passam durante a cena — uma só pareceria uma tela de texto.
  {
    nome: 'historia', ritmo: 'campo', batidas: 8,
    preparar: `__tela(() => { window.__paginaDoLivro = -1; game.showStory(0); })`,
    porQuadro: `(fatia) => __livro(fatia)`,
  },
  // Os modos de jogo, em cartões — a `showModePicker` de verdade: Livre (sem
  // nada no caminho), Aventura (com obstáculos e 3 vidas, e as três
  // velocidades abertas no próprio cartão) e Fases (o cartão já traz o
  // mini-mapa das doze). É a tela que responde "e depois da primeira
  // corrida?".
  {
    nome: 'modos', ritmo: 'campo', batidas: 8,
    preparar: `__tela(() => { game.applyForRun('estrela', 'ceu'); game.showModePicker(); })`,
  },

  // --- O letreiro ----------------------------------------------------------
  //
  // Não é o jogo: é a página scripts/video-cartelas.html, com a foto dos 22
  // unicórnios que o `npm run anuncio` gera. Fica no ar enquanto o acorde
  // final soa.
  // 15,1667 batidas: as 10 que sobram do último compasso do tema mais o
  // acorde final, que soa por 2,5 s (ver FINAL, em
  // scripts/video-musica.html). Dá 7,3 s de letreiro — é o quadro que
  // carrega o endereço, e o único que alguém pode querer parar para ler.
  { nome: 'letreiro', ritmo: 'campo', batidas: 10 + 2.5 / BATIDA.campo, letreiro: true },
];

// Os textos que entram por cima do jogo, e o segundo em que cada um entra.
// `de`/`ate` em segundos, contados do começo do vídeo; o ffmpeg faz cada um
// aparecer e sair em meio segundo de esmaecida (ver montar()).
//
// Cada número aqui é conferível no código: 22 é o tamanho do CHARACTER_LIST,
// 15 o do TRACK_LIST, 12 o LEVEL_COUNT.
// A contagem, de 0 a 1,94 s, fica sem texto de propósito: ela já é o
// gancho, e uma frase por cima só disputaria a atenção com o número.
const CARTELAS = [
  { de: 2.3, ate: 5.4, emoji: '🦄', linhas: ['Corre, junta,', 'voa'] },
  { de: 6.2, ate: 11.0, emoji: '🌈', linhas: ['15 pistas mágicas'], miudo: 'do Campo ao Espaço' },
  { de: 12.0, ate: 15.0, emoji: '🎈', linhas: ['Feito para', 'os pequenos'] },
  { de: 15.9, ate: 20.5, emoji: '✨', linhas: ['22 unicórnios'], miudo: 'cada um com o seu jeito' },
  { de: 21.2, ate: 25.9, linhas: ['Cada pista,', 'um mundo novo'] },
  {
    de: 27.0, ate: 33.2, emoji: '⚡',
    linhas: ['Power-ups', 'na corrida'],
    miudo: 'ímã, pena, escudo e arco-íris',
  },
  { de: 34.1, ate: 37.0, emoji: '🦄', linhas: ['Todos prontos', 'para escolher'] },
  {
    de: 40.6, ate: 43.9, emoji: '📖',
    linhas: ['Abre contando', 'uma história'],
    miudo: 'nove páginas, lida em voz alta',
  },
  {
    de: 44.6, ate: 47.6, emoji: '🎮',
    linhas: ['Três jeitos', 'de brincar'],
    miudo: 'Livre, Aventura e 12 Fases',
  },
];

// ---------------------------------------------------------------------------
// Quando cada cena começa e acaba
// ---------------------------------------------------------------------------
//
// O quadro de cada corte sai do **tempo acumulado**, arredondado uma vez
// só. Arredondar a duração de cada cena separadamente somava o erro de
// todas elas, e no fim do vídeo os cortes já estavam meio quadro atrás da
// música.
function marcar(roteiro) {
  let segundos = 0;
  let quadro = 0;
  return roteiro.map((cena) => {
    segundos += cena.batidas * BATIDA[cena.ritmo];
    const fim = Math.round(segundos * FPS);
    const marcada = { ...cena, primeiro: quadro, quadros: fim - quadro, ate: segundos };
    quadro = fim;
    return marcada;
  });
}

const CENAS = marcar(ROTEIRO);
const TOTAL_QUADROS = CENAS.at(-1).primeiro + CENAS.at(-1).quadros;
const DURACAO = TOTAL_QUADROS / FPS;

// ---------------------------------------------------------------------------
// O Chrome, por fora
// ---------------------------------------------------------------------------

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
].find(existsSync);

// Conversa com o Chrome pelo protocolo do DevTools. É por aqui que dá para
// chamar `game.tick()` de fora e tirar a foto da tela inteira — HUD, cartões
// e 3D juntos, que é o que uma foto do `<canvas>` sozinho não dá.
async function abrirChrome() {
  const chrome = spawn(CHROME, [
    '--headless=new',
    // Sem GPU de verdade aqui dentro; o SwiftShader é o renderizador por
    // software. Devagar, mas gravando quadro a quadro isso não importa.
    '--disable-gpu', '--enable-unsafe-swiftshader',
    '--hide-scrollbars', '--mute-audio', '--no-first-run',
    '--disable-extensions', '--disable-background-timer-throttling',
    `--remote-debugging-port=${DEBUG}`,
    `--user-data-dir=${PERFIL}`,
    '--window-size=540,960',
    'about:blank',
  ], { stdio: 'ignore' });

  let versao;
  for (let i = 0; i < 60; i++) {
    try {
      versao = await (await fetch(`http://127.0.0.1:${DEBUG}/json/version`)).json();
      break;
    } catch { await espera(250); }
  }
  if (!versao) throw new Error('o Chrome não abriu a porta do DevTools');

  const ws = new WebSocket(versao.webSocketDebuggerUrl);
  await new Promise((r, e) => {
    ws.addEventListener('open', r, { once: true });
    ws.addEventListener('error', e, { once: true });
  });

  let id = 0;
  const esperando = new Map();
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (!msg.id || !esperando.has(msg.id)) return;
    const { ok, falha } = esperando.get(msg.id);
    esperando.delete(msg.id);
    msg.error ? falha(new Error(msg.error.message)) : ok(msg.result);
  });

  const enviar = (metodo, params = {}, sessionId) => new Promise((ok, falha) => {
    const meu = ++id;
    esperando.set(meu, { ok, falha });
    ws.send(JSON.stringify({ id: meu, method: metodo, params, sessionId }));
  });

  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (metodo, params) => enviar(metodo, params, sessionId);

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  // 540x960 com o dobro de pixels dá exatamente os 1080x1920 do vídeo.
  // `mobile: false` de propósito: com ele o jogo se dá por celular e desliga
  // o antisserrilhado para não engasgar (ver `isHandheld`, em Game.js) — o
  // que aqui é só perder qualidade de graça, porque ninguém está com pressa.
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 540, height: 960, deviceScaleFactor: 2, mobile: false,
  });

  return { chrome, cdp, fechar: () => { try { ws.close(); } catch { /* já foi */ } chrome.kill(); } };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// `Runtime.evaluate` cru, mas explodindo quando o JavaScript de dentro
// explode — sem isto um erro na página virava `undefined` silencioso, e o
// vídeo saía com uma cena de menu no lugar de uma corrida.
async function avaliar(cdp, expressao, { esperarPromessa = false } = {}) {
  const r = await cdp('Runtime.evaluate', {
    expression: expressao,
    returnByValue: true,
    awaitPromise: esperarPromessa,
    allowUnsafeEvalBlockedByCSP: true,
  });
  if (r.exceptionDetails) {
    const e = r.exceptionDetails;
    throw new Error(`na página: ${e.exception?.description || e.text}`);
  }
  return r.result.value;
}

async function esperarPor(cdp, expressao, oQue, tentativas = 120) {
  for (let i = 0; i < tentativas; i++) {
    if (await avaliar(cdp, expressao)) return;
    await espera(250);
  }
  throw new Error(`esperei demais por ${oQue}`);
}

// ---------------------------------------------------------------------------
// Preparar o jogo
// ---------------------------------------------------------------------------

// O save que o anúncio precisa: em português, com a história já lida (senão
// o jogo abre contando ela) e com tudo destravado, para a grade aparecer
// cheia em vez de com vinte cadeados.
function saveDoAnuncio(personagens, pistas) {
  return {
    version: 1,
    idioma: 'pt',
    storySeen: true,
    storyEndSeen: true,
    muted: true,
    choices: { character: 'uni', track: 'campo', mode: 'adventure', difficulty: 'facil' },
    shop: { characters: personagens, tracks: pistas },
    // Umas chaves na carteira: o HUD mostra o número, e zero chaves num
    // anúncio parece um jogo em que não se ganha nada.
    stats: { keys: 128, runs: 40, wins: 12, hearts: 3200, items: 900, heartsToKey: 18 },
    // Todas as fases abertas em todas as pistas, para a tela de fases
    // aparecer com caminho andado.
    levels: Object.fromEntries(pistas.map((p) => [p, { unlocked: 12, done: 9 }])),
  };
}

// Tudo o que o gravador chama de dentro da página. Vai num só lugar para o
// roteiro, lá em cima, poder ser uma linha por cena.
const AJUDANTES = `
window.__DT = 1 / ${FPS};

// O jogo para de se animar sozinho e passa a andar quando mandarem, com o
// relógio preso: é isto que torna a gravação lisa e repetível.
game.renderer.setAnimationLoop(null);
game.clock.getDelta = () => window.__DT;

window.__cena = { porQuadro: null, piloto: false };

// Uma corrida do anúncio.
window.__corrida = (personagem, pista, dificuldade) => {
  game.applyForRun(personagem, pista);
  game.start('adventure', dificuldade);
  // Sem o "3, 2, 1, Vai!": ele come um segundo e meio de cada cena, e o
  // anúncio tem quatro segundos por pista.
  game.pararContagem();
  game.contando = false;
  game.ui.setCountdown(null);
  game.ui.showPause(true);
  // A trombada não custa nada aqui, mas o obstáculo ainda sai voando com o
  // brilho: o piloto desvia de quase tudo, e o "quase" não pode virar uma
  // tela vermelha piscando no meio do anúncio.
  game.hit = (obstaculo) => game.knockAway(obstaculo);
  window.__cena = { porQuadro: null, piloto: true };
};

// --- A cena dos power-ups ------------------------------------------------
//
// Uma corrida como as outras, mas com a pista mais rala (menos obstáculo,
// sem barreira) e o sorteio de power-up desligado: aqui eles entram na mão,
// no tempo certo, para o vídeo ver cada efeito. Ver a cena 'poderes' no
// roteiro e o \`__poderesPasso\`.
window.__poderes = (personagem, pista) => {
  __corrida(personagem, pista, 'medio');
  // Menos coisa no caminho: o piloto quase não precisa desviar, então pega
  // o power-up que nasce à frente dele em vez de trocar de faixa para fugir
  // de uma pedra. Alguns obstáculos ficam — a Bomba precisa de algo para
  // desintegrar.
  game.world.mode = Object.assign({}, game.world.mode, { obstacleChance: 0.14 });
  game.world.rollBarrier = () => false;
  // Nada de power-up por sorteio: só os que o \`__poderesPasso\` solta.
  game.world.rollPowerup = () => null;
  window.__poderDado = -1;
};

// Põe um power-up na pista, uns metros à frente do unicórnio e na faixa
// dele, e tira da frente o obstáculo que estaria no caminho até ele.
window.__soltarPoder = (id) => {
  const faixa = game.player.lane;
  const x = window.__LANES[faixa];
  const obj = window.__createPowerup(id);
  obj.position.set(x, 1.25, -15);
  obj.userData.baseY = 1.25;
  game.world.group.add(obj);
  game.world.entities.push(obj);
  for (const e of game.world.entities) {
    if (e.userData.kind === 'obstacle' && e.position.z > -34 && e.position.z < -3
        && Math.abs(e.position.x - x) < 1.4) {
      e.userData.knocked = true;
      e.visible = false;
    }
  }
};

// O calendário da cena: um power-up por marco, na fração da cena em que ele
// deve nascer (a corrida leva ~1 s para trazê-lo até o unicórnio). O Ímã
// primeiro, para os corações virem sozinhos o resto da cena; a Bomba por
// último, e a onda de arco-íris cai no corte para a grade.
window.__poderesPasso = (t) => {
  const marcos = [[0.03, 'magnet'], [0.28, 'feather'], [0.52, 'shield'], [0.76, 'bomb']];
  while (window.__poderDado + 1 < marcos.length && t >= marcos[window.__poderDado + 1][0]) {
    window.__poderDado += 1;
    window.__soltarPoder(marcos[window.__poderDado][1]);
  }
};

// A largada, para a cena de abertura: a corrida no primeiro instante dela,
// com a contagem no ar.
//
// \`contando\` é a chave. Enquanto ela está ligada o jogo continua pintando o
// mundo, mas devagar (um terço da velocidade inicial) e sem simular nada —
// sem placar, sem colisão. É o mesmo estado em que o jogo fica durante o
// "3, 2, 1" de verdade; a diferença é que aqui quem conta os passos é o
// gravador, e não os \`setTimeout\` do \`largar()\`.
window.__contagem = (personagem, pista) => {
  game.applyForRun(personagem, pista);
  game.start('adventure', 'facil');
  // A contagem do jogo anda por \`setTimeout\`, em tempo de relógio. Gravando
  // quadro a quadro o relógio não tem nada a ver com o tempo do vídeo: os
  // números pulariam a esmo entre uma foto e outra. Então ela é desligada
  // aqui e refeita quadro a quadro no \`__contar\`.
  game.pararContagem();
  game.contando = true;
  game.ui.setCountdown(null);
  game.ui.showPause(true);
  game.hit = (obstaculo) => game.knockAway(obstaculo);
  window.__cena = { porQuadro: null, piloto: false };
  window.__passoDaContagem = -1;
};

// Um número por batida: 3, 2, 1, Vai!.
//
// O \`#contagem.pop\` do jogo (ver style.css) é uma animação CSS de meio
// segundo — ela aparece crescendo e some encolhendo. Numa gravação quadro a
// quadro ela correria pelo relógio da máquina, e cada foto pegaria a
// animação num ponto qualquer: o número sairia tremendo. Então ela é
// **pausada e adiantada na mão**, com o \`currentTime\` no ponto exato deste
// quadro. Assim é a animação de verdade, do arquivo de estilo do jogo, no
// tempo do vídeo.
window.__contar = (fatia) => {
  const passos = ['3', '2', '1', 'Vai!'];
  const i = Math.min(passos.length - 1, Math.floor(fatia * passos.length));
  if (i !== window.__passoDaContagem) {
    window.__passoDaContagem = i;
    game.ui.setCountdown(passos[i]);
  }

  const alvo = document.getElementById('contagem');
  const dentro = Math.min(1, fatia * passos.length - i);
  for (const animacao of alvo.getAnimations()) {
    animacao.pause();
    animacao.currentTime = dentro * animacao.effect.getTiming().duration;
  }
};

// Uma tela de menu. O 3D continua vivo atrás do cartão, então ela também é
// gravada quadro a quadro.
window.__tela = (montar) => {
  game.state = 'ready';
  montar();
  window.__cena = { porQuadro: null, piloto: false };
};

// Três páginas do livro, uma a cada terço da cena. São as páginas 1, 4 e 7:
// ficam dentro das nove da história de abertura, longe do fim — que só abre
// depois das doze fases e não é para estragar num anúncio.
window.__livro = (fatia) => {
  const paginas = [0, 3, 6];
  const i = Math.min(paginas.length - 1, Math.floor(fatia * paginas.length));
  if (i === window.__paginaDoLivro) return;
  window.__paginaDoLivro = i;
  game.showStory(paginas[i]);
  // Virar a página remonta o cartão, e o cartão entra esmaecendo. Essa
  // animação anda pelo relógio da máquina, não pelo tempo do vídeo: a foto
  // tirada logo em seguida pegava a página translúcida, com o desenho e o
  // texto lavados. Terminar as animações na hora resolve — e de quebra
  // torna o quadro igual toda vez que se grava.
  for (const animacao of document.body.getAnimations({ subtree: true })) {
    if (animacao.effect?.getTiming().iterations !== Infinity) animacao.finish();
  }
};

// A grade dos unicórnios descendo.
//
// O elemento vem do DOM, e não do \`game.gridScrollOrNull()\`: apesar do
// nome, esse devolve a **posição** da rolagem (um número), não a caixa que
// rola — e chamar \`scrollHeight\` num número dá NaN sem reclamar, que foi
// exatamente o que fez a grade ficar parada no primeiro corte gravado.
window.__rolar = (t) => {
  const grade = document.getElementById('overlay-extra');
  if (!grade) return;
  const total = grade.scrollHeight - grade.clientHeight;
  // Uma paradinha no começo e no fim, para a rolagem não começar nem acabar
  // em movimento.
  const suave = Math.min(1, Math.max(0, (t - 0.12) / 0.76));
  grade.scrollTop = total * (suave * suave * (3 - 2 * suave));
};

// Um quadro: mexe no que a cena pediu, deixa o piloto jogar e pinta.
window.__passo = (t) => {
  const cena = window.__cena;
  if (cena.porQuadro) cena.porQuadro(t);
  if (cena.piloto && window.__pilotar) window.__pilotar(game, window.__DT);
  game.tick();
};

// Os primeiros segundos de uma corrida são pista vazia: o mundo sorteia o
// que nasce conforme a distância andada. Aquecer é rodar esses segundos sem
// gravar, para a cena já começar com coisa na tela.
window.__aquecer = (quantos) => { for (let i = 0; i < quantos; i++) window.__passo(0); };
true;
`;

async function prepararJogo(cdp) {
  const { personagens, pistas } = await listas();

  // O save entra antes de a página existir: o jogo lê o localStorage na
  // primeira linha (ver src/main.js), e escrever depois já era tarde.
  await cdp('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('unicornrush-save', ${JSON.stringify(JSON.stringify(saveDoAnuncio(personagens, pistas)))});`,
  });

  await cdp('Page.navigate', { url: `http://localhost:${PORTA}/` });
  await esperarPor(cdp, `typeof window.game === 'object' && !!game.world`, 'o jogo carregar');
  // A tela de carregamento fica três segundos no ar de propósito (ver
  // src/main.js); aqui ela só atrasa.
  await avaliar(cdp, `document.getElementById('loading')?.remove(), true`);

  await avaliar(cdp, AJUDANTES);
  await avaliar(cdp,
    `import('/scripts/video-piloto.js').then((m) => {
       window.__pilotar = m.pilotar;
       window.__placar = m.placar;
       return true;
     })`,
    { esperarPromessa: true });

  // Para a cena dos power-ups: a fábrica de modelo de power-up e as posições
  // das faixas, para o \`__soltarPoder\` pôr um na pista na mão.
  await avaliar(cdp,
    `Promise.all([
       import('/src/models/powerups.js'),
       import('/src/game/config.js'),
     ]).then(([p, c]) => {
       window.__createPowerup = p.createPowerup;
       window.__LANES = c.LANES;
       return true;
     })`,
    { esperarPromessa: true });

  // Uma volta pelas telas para os retratos dos 22 unicórnios e das 15
  // pistas ficarem prontos antes de valer: eles são renderizados na hora,
  // e a cena da grade duraria oito quadros de cartão vazio sem isto.
  await avaliar(cdp, `game.showCharacterPicker(), game.showTrackPicker(), game.showHome(), true`);
  await espera(1200);
}

async function listas() {
  const personagens = await import(join(RAIZ, 'src/models/characters.js'));
  const pistas = await import(join(RAIZ, 'src/game/tracks.js'));
  return {
    personagens: personagens.CHARACTER_LIST.map((c) => c.id),
    pistas: pistas.TRACK_LIST.map((t) => t.id),
  };
}

// ---------------------------------------------------------------------------
// Gravar
// ---------------------------------------------------------------------------

const nomeQuadro = (i) => join(QUADROS, `${String(i).padStart(5, '0')}.jpg`);

async function foto(cdp) {
  // JPEG, e não PNG: são mil e duzentos quadros, o ffmpeg vai recomprimir
  // tudo em H.264 de qualquer jeito, e em PNG isto ocupava um giga e meio.
  const { data } = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 94 });
  return Buffer.from(data, 'base64');
}

// Grava uma cena do jogo, quadro a quadro.
async function gravarCena(cdp, cena, aquecimento) {
  await avaliar(cdp, cena.preparar);
  // O aquecimento vem **antes** do `porQuadro`. Ele roda o mesmo `__passo`
  // que a gravação, e uma cena cujo `porQuadro` mexe no estado do jogo — a
  // contagem é uma — teria os seus novecentos quadros de aquecimento com o
  // mundo já freado, chegando à primeira foto sem nada ter acontecido.
  const quantos = cena.aquecer ?? aquecimento;
  if (quantos) await avaliar(cdp, `window.__aquecer(${quantos}), true`);
  if (cena.porQuadro) await avaliar(cdp, `window.__cena.porQuadro = ${cena.porQuadro}, true`);

  for (let i = 0; i < cena.quadros; i++) {
    const t = cena.quadros > 1 ? i / (cena.quadros - 1) : 0;
    await avaliar(cdp, `window.__passo(${t.toFixed(5)}), true`);
    writeFileSync(nomeQuadro(cena.primeiro + i), await foto(cdp));
  }
}

// O letreiro do fim, com uma aproximação lenta para não ser uma foto parada.
async function gravarLetreiro(cdp, cenas) {
  await cdp('Page.navigate', { url: `http://localhost:${PORTA}/scripts/video-cartelas.html` });
  await esperarPor(cdp, `window.prontoCartelas === true`, 'a página das cartelas');
  await esperarPor(cdp, `window.letreiro()`, 'a foto do anúncio carregar');

  const primeiro = cenas[0].primeiro;
  const quantos = cenas.reduce((n, c) => n + c.quadros, 0);
  for (let i = 0; i < quantos; i++) {
    const t = i / (quantos - 1);
    await avaliar(cdp, `(() => {
      const palco = document.getElementById('palco');
      palco.style.transformOrigin = '50% 46%';
      palco.style.transform = 'scale(${(1 + 0.055 * t).toFixed(5)})';
      return true;
    })()`);
    writeFileSync(nomeQuadro(primeiro + i), await foto(cdp));
  }
}

// As cartelas de texto, uma imagem cada, com fundo transparente para o
// ffmpeg sobrepor ao quadro do jogo.
async function gravarCartelas(cdp) {
  const pasta = join(QUADROS, 'cartelas');
  mkdirSync(pasta, { recursive: true });

  await esperarPor(cdp, `window.prontoCartelas === true`, 'a página das cartelas');
  // Sem isto o PNG sai com o branco do navegador atrás do texto, e a
  // sobreposição tapava o jogo inteiro.
  await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

  const arquivos = [];
  for (const [i, cartela] of CARTELAS.entries()) {
    await avaliar(cdp, `window.cartela(${JSON.stringify(cartela)}), true`);
    const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
    const arquivo = join(pasta, `${i}.png`);
    writeFileSync(arquivo, Buffer.from(data, 'base64'));
    arquivos.push(arquivo);
  }

  await cdp('Emulation.setDefaultBackgroundColorOverride');
  return arquivos;
}

// ---------------------------------------------------------------------------
// A trilha
// ---------------------------------------------------------------------------

async function gravarTrilha(cdp) {
  await cdp('Page.navigate', { url: `http://localhost:${PORTA}/scripts/video-musica.html` });
  await esperarPor(cdp, `typeof window.renderizarTrilha === 'function'`, 'a página da trilha');

  const info = await avaliar(cdp, `window.renderizarTrilha()`, { esperarPromessa: true });
  console.log(`   trilha: ${info.duracao.toFixed(2)} s, ${Math.round(info.bytes / 1024)} KB`);

  // Em pedaços: o base64 do WAV inteiro passa de sete megas, e uma mensagem
  // desse tamanho no DevTools não volta.
  const PEDACO = 3_000_000;
  let b64 = '';
  for (let i = 0; i * PEDACO < info.base64; i++) {
    b64 += await avaliar(cdp, `window.pedacoDaTrilha(${i}, ${PEDACO})`);
  }

  const arquivo = join(QUADROS, 'trilha.wav');
  writeFileSync(arquivo, Buffer.from(b64, 'base64'));
  return { arquivo, duracao: info.duracao };
}

// ---------------------------------------------------------------------------
// A montagem
// ---------------------------------------------------------------------------

function montar(trilha, cartelas, saida) {
  const ESMAECIDA = 0.42;   // quanto cada texto leva para entrar e para sair

  const entradas = [
    // `start_number 0` porque a numeração começa em zero; sem isto o ffmpeg
    // procura o 00001 e não acha a sequência.
    '-framerate', String(FPS), '-start_number', '0', '-i', join(QUADROS, '%05d.jpg'),
    '-i', trilha,
  ];
  const filtros = [];
  let atual = '[0:v]';

  cartelas.forEach((arquivo, i) => {
    const { de, ate } = CARTELAS[i];
    const dura = ate - de;
    // Mesma taxa da base: uma cartela entrando a 25 quadros por segundo
    // sobre um vídeo de 30 esmaece aos trancos.
    entradas.push('-loop', '1', '-framerate', String(FPS), '-t', dura.toFixed(3), '-i', arquivo);
    // A cartela entra esmaecendo pelo canal alfa, fica, e sai esmaecendo.
    // O `setpts` é o que a coloca no segundo certo do vídeo.
    filtros.push(
      `[${i + 2}:v]format=rgba,`
      + `fade=t=in:st=0:d=${ESMAECIDA}:alpha=1,`
      + `fade=t=out:st=${(dura - ESMAECIDA).toFixed(3)}:d=${ESMAECIDA}:alpha=1,`
      + `setpts=PTS-STARTPTS+${de.toFixed(3)}/TB[c${i}]`,
    );
    filtros.push(`${atual}[c${i}]overlay=0:0:eof_action=pass:shortest=0[v${i}]`);
    atual = `[v${i}]`;
  });

  // Uma abertura e um fecho curtos no preto: um vídeo que já começa no meio
  // de uma corrida corta bruto quando o feed o repete em laço.
  filtros.push(`${atual}fade=t=in:st=0:d=0.3,`
    + `fade=t=out:st=${(DURACAO - 0.5).toFixed(3)}:d=0.5,`
    + `format=yuv420p[vfinal]`);

  // `loudnorm` põe a trilha no volume de que as redes gostam (-14 LUFS) —
  // sem isso ela sai baixa, porque o `gain` dos temas foi escolhido para
  // tocar debaixo de uma criança jogando.
  filtros.push(`[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,`
    + `afade=t=out:st=${(DURACAO - 0.8).toFixed(3)}:d=0.8[afinal]`);

  const comando = [
    '-y', '-loglevel', 'error', '-stats',
    ...entradas,
    '-filter_complex', filtros.join(';'),
    '-map', '[vfinal]', '-map', '[afinal]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
    // Um quadro-chave a cada segundo: é o que faz o vídeo começar na hora
    // quando alguém arrasta a linha do tempo no telefone.
    '-g', String(FPS), '-keyint_min', String(FPS),
    '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', DURACAO.toFixed(3),
    saida,
  ];

  const r = spawnSync('ffmpeg', comando, { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error('o ffmpeg desistiu');
}

// ---------------------------------------------------------------------------

async function principal() {
  if (!CHROME) throw new Error('Chrome não encontrado — é ele que renderiza o jogo.');
  if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
    throw new Error('ffmpeg não encontrado (brew install ffmpeg).');
  }

  mkdirSync(SAIDA, { recursive: true });
  const arquivo = join(SAIDA, 'unicornrush-anuncio.mp4');

  console.log(`🎬 ${DURACAO.toFixed(2)} s, ${TOTAL_QUADROS} quadros, ${FPS} fps, 1080x1920`);
  for (const cena of CENAS) {
    console.log(`   ${String(cena.primeiro).padStart(4)}  ${cena.nome.padEnd(16)}`
      + `${(cena.quadros / FPS).toFixed(2)} s`);
  }

  if (so('--montar')) {
    if (!existsSync(nomeQuadro(0))) throw new Error('não há quadros gravados para remontar.');
    const cartelas = CARTELAS.map((_, i) => join(QUADROS, 'cartelas', `${i}.png`));
    montar(join(QUADROS, 'trilha.wav'), cartelas, arquivo);
    return arquivo;
  }

  if (!SO_CENA) rmSync(QUADROS, { recursive: true, force: true });
  rmSync(PERFIL, { recursive: true, force: true });
  mkdirSync(QUADROS, { recursive: true });

  const servidor = spawn(process.execPath, [join(RAIZ, 'server.js')], {
    env: { ...process.env, PORT: String(PORTA) }, stdio: 'ignore',
  });
  await espera(700);

  const { cdp, fechar } = await abrirChrome();
  const desligar = () => { fechar(); servidor.kill(); };
  process.on('exit', desligar);

  try {
    console.log('🕹  abrindo o jogo…');
    await prepararJogo(cdp);

    // Quantos quadros rodar antes de começar a gravar. Não é enfeite: o
    // mundo sorteia o que nasce conforme a **distância andada**, e a
    // primeira fileira de corações só chega ao unicórnio depois de uns
    // sessenta metros. Gravando antes disso, o anúncio abria com quatro
    // segundos de pista vazia e o HUD marcando zero coração.
    //
    // 420 quadros são catorze segundos de corrida: dá tempo de a pista
    // encher, de a velocidade subir (10 → 13,5) e de o contador de corações
    // virar um número que parece uma corrida de verdade.
    const AQUECER = 900;

    if (so('--fotos')) {
      const pasta = join(SAIDA, 'fotos');
      mkdirSync(pasta, { recursive: true });
      for (const cena of CENAS.filter((c) => !c.letreiro)) {
        console.log(`   📸 ${cena.nome}`);
        await avaliar(cdp, cena.preparar);
        const quantos = cena.aquecer ?? AQUECER;
        if (quantos) await avaliar(cdp, `window.__aquecer(${quantos}), true`);
        if (cena.porQuadro) await avaliar(cdp, `window.__cena.porQuadro = ${cena.porQuadro}, true`);
        await avaliar(cdp, `window.__passo(0.5), true`);
        writeFileSync(join(pasta, `${cena.nome}.jpg`), await foto(cdp));
        // O placar depois do aquecimento diz se o piloto está jogando bem:
        // coração zerado é piloto passando reto, vida perdida é piloto
        // trombando. Os dois se conferem daqui, sem olhar a imagem.
        const placar = await avaliar(cdp, `JSON.stringify({
          pegou: game.collected, perdeu: window.__placar?.perdidos ?? 0,
          vidas: game.lives, chaves: game.keys,
          metros: Math.round(game.distance), vel: Math.round(game.speed),
        })`);
        console.log(`      ${placar}`);
        await avaliar(cdp, `window.__placar && (window.__placar.perdidos = 0), true`);
      }
      await cdp('Page.navigate', { url: `http://localhost:${PORTA}/scripts/video-cartelas.html` });
      await esperarPor(cdp, `window.prontoCartelas === true`, 'a página das cartelas');
      await esperarPor(cdp, `window.letreiro()`, 'a foto do anúncio');
      writeFileSync(join(pasta, 'letreiro.jpg'), await foto(cdp));

      // As cartelas em cima de um verde chapado, só para conferir: com o
      // fundo transparente de verdade não se vê onde o texto começa.
      await cdp('Emulation.setDefaultBackgroundColorOverride', {
        color: { r: 60, g: 160, b: 90, a: 1 },
      });
      for (const [i, cartela] of CARTELAS.entries()) {
        await avaliar(cdp, `window.cartela(${JSON.stringify(cartela)}), true`);
        const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(pasta, `cartela-${i}.png`), Buffer.from(data, 'base64'));
      }
      console.log('✅ assets/video/fotos/ — uma de cada cena');
      return null;
    }

    const pedidas = SO_CENA ? CENAS.filter((c) => c.nome === SO_CENA) : CENAS;
    if (SO_CENA && !pedidas.length) {
      throw new Error(`não há cena chamada "${SO_CENA}" no roteiro`);
    }

    for (const cena of pedidas.filter((c) => !c.letreiro)) {
      const t = new Date();
      await gravarCena(cdp, cena, AQUECER);
      console.log(`   🎞  ${cena.nome.padEnd(16)}${cena.quadros} quadros`
        + `  (${Math.round((Date.now() - t) / 1000)} s)`);
    }

    const doLetreiro = pedidas.filter((c) => c.letreiro);
    if (doLetreiro.length) {
      console.log('   🏷  letreiro…');
      await gravarLetreiro(cdp, doLetreiro);
    }

    // Numa regravação de cena as cartelas e a trilha já estão no lugar:
    // elas não dependem de nenhuma cena.
    const cartelas = SO_CENA
      ? CARTELAS.map((_, i) => join(QUADROS, 'cartelas', `${i}.png`))
      : (console.log('   💬 cartelas…'), await gravarCartelas(cdp));

    const trilha = SO_CENA
      ? { arquivo: join(QUADROS, 'trilha.wav'), duracao: DURACAO }
      : (console.log('   🎵 trilha…'), await gravarTrilha(cdp));
    if (Math.abs(trilha.duracao - DURACAO) > 0.25) {
      console.warn(`   ⚠️  a trilha tem ${trilha.duracao.toFixed(2)} s e o vídeo ${DURACAO.toFixed(2)} s`
        + ` — confira as SECOES em scripts/video-musica.html`);
    }

    desligar();
    process.off('exit', desligar);

    const faltando = TOTAL_QUADROS - readdirSync(QUADROS).filter((f) => f.endsWith('.jpg')).length;
    if (faltando) throw new Error(`faltaram ${faltando} quadros`);

    console.log('   🎬 montando…');
    montar(trilha.arquivo, cartelas, arquivo);
    return arquivo;
  } finally {
    desligar();
  }
}

const arquivo = await principal();
if (arquivo) {
  console.log(`✅ ${arquivo.replace(`${RAIZ}/`, '')} — ${DURACAO.toFixed(1)} s, `
    + `${Math.round(statSync(arquivo).size / 1024)} KB`);
}
