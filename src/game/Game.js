// Núcleo do jogo: cena, câmera, estado do jogador e laço principal.
import * as THREE from 'three';
import {
  LANES, LANE_CHANGE_SPEED, MODES, DEFAULT_MODE, TUTORIAL_MODE,
  DIFFICULTIES, DIFFICULTY_LIST, DEFAULT_DIFFICULTY,
  JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY, MAX_JUMPS, FLIP_TIME, RUSH_SPEED,
  GRAVITY, FLY_HEIGHT, START_LIVES, INVULNERABLE_TIME, HEART_POINTS,
  HEARTS_PER_KEY, COLORS,
} from './config.js';
import { createUnicorn, animateUnicorn, WING_SCALE } from '../models/unicorn.js';
import {
  CHARACTERS, CHARACTER_LIST, DEFAULT_CHARACTER, characterPrice, CHARACTER_SLOTS, isFastOn,
} from '../models/characters.js';
import { getPortraits } from '../models/portraits.js';
import { createViewer3d } from '../models/viewer3d.js';
import { getTrackPortraits } from '../models/trackPortraits.js';
import { TRACKS, TRACK_LIST, DEFAULT_TRACK, trackPrice, TRACK_SLOTS } from './tracks.js';
import { LEVEL_COUNT, levelData } from './levels.js';
import { World } from './world.js';
import { createRainbowTrail, updateRainbowTrail, resetRainbowTrail } from '../models/rainbowTrail.js';
import { POWERUPS, POWERUP_LIST, powerLevelMultiplier, powerLevelCost } from '../models/powerups.js';
import { createGlow } from '../models/collectibles.js';
import { createHeartsToKey, updateHeartsToKey, disposeHeartsToKey } from '../models/keyReward.js';
import { createAuras, updateAuras, FLASH_TIME } from '../models/auras.js';
import { createCharacterAura, updateCharacterAura } from '../models/characterAura.js';
import { createInput } from './input.js';
import { sfx } from './audio.js';
import { getSave, update, resetSave, isTestMode, setTestMode } from './storage.js';
import * as music from './music.js';
import { canInstall, needsManualInstall, promptInstall, watchInstall } from './install.js';
import {
  speak, canSpeak, isOn as speechOn, setOn as setSpeech,
  vozesDoIdioma, nomeDaVoz, escolherVoz, restaurarVozes,
} from './speech.js';
import { withIcons, iconUrl } from './icons.js';
import { storyPages, STORY_END } from './story.js';
import { IDIOMAS, idioma, idiomaInfo, idiomaSugerido, setIdioma, t } from './i18n.js';
import { lessonsFor } from './tutorial.js';
import { VERSION } from './version.js';
import { hasUpdate, applyUpdate, onUpdate, updateVersion } from './update.js';

const STATE = { READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', OVER: 'over' };

const CAMERA = { height: 5.1, distance: 9.4, fov: 55 };

// Quanto tempo o portal fica aberto antes de sair sozinho. Cabe a
// animação inteira (cadeado, portas, retrato, nome) e mais um respiro.
const REVEAL_TIME = 4600;

// Os ecos do Eco: a que distância de lado eles correm (uma faixa), o quanto
// ficam para trás e o atraso do galope deles.
const LANE_WIDTH = 2.2;
const ECHO_LAG_Z = 0.35;
const ECHO_LAG = 0.12;

// Carência depois da Bomba Arco-Íris: o tempo que a onda leva para sair de
// trás do unicórnio e cobrir o campo próximo.
const BOMB_GRACE = 0.6;

// Segundos para a tela de evoluir poderes: "9s" quando fecha redondo, "12,8s"
// quando não — a vírgula (ou o ponto, em inglês) só aparece quando precisa.
function formatSegundos(s) {
  const arredondado = Math.round(s * 10) / 10;
  if (Number.isInteger(arredondado)) return String(arredondado);
  const separador = idioma() === 'en' ? '.' : ',';
  return arredondado.toFixed(1).replace('.', separador);
}

// O que a lição diz quando a mesma aula já falhou umas vezes. Menos "tente
// de novo" e mais "faça isto".
const RETRY_HELP = {
  esquerda: '⬅️ Toque na seta da esquerda',
  direita: '➡️ Toque na seta da direita',
  lado: '⬅️ ➡️ Toque numa das setas',
  pular: '⬆️ Toque na seta de cima para pular',
  'pulo-duplo': '⬆️ Pule e, no ar, toque de novo',
  rapido: '⚡ Toque no botão RÁPIDO, no canto de cima',
};

// Libera a memória da GPU ao trocar de personagem.
function disposeObject(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.geometry.dispose();
    const material = obj.material;
    Array.isArray(material) ? material.forEach((m) => m.dispose()) : material.dispose();
  });
}

function gradientTexture(top, bottom) {
  const canvas = document.createElement('canvas');
  canvas.width = 2; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Celular/tablet: menos pixels e sombra menor para o jogo não engasgar.
function isHandheld() {
  return matchMedia('(hover: none) and (pointer: coarse)').matches
    || Math.min(innerWidth, innerHeight) < 500;
}

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.state = STATE.READY;
    this.handheld = isHandheld();
    this.save = getSave();
    restaurarVozes(this.save.vozes);
    this.mode = MODES[this.save.choices.mode] || MODES[DEFAULT_MODE];
    // Um save antigo pode apontar para algo que hoje está trancado.
    this.character = this.isOwned('character', this.save.choices.character)
      ? CHARACTERS[this.save.choices.character]
      : CHARACTERS[DEFAULT_CHARACTER];
    this.track = this.isOwned('track', this.save.choices.track)
      ? TRACKS[this.save.choices.track]
      : TRACKS[DEFAULT_TRACK];
    this.screen = 'home';      // tela de menu aberta agora
    this.storyPage = 0;        // página aberta do livro da história
    this.difficulty = DIFFICULTIES[this.save.choices.difficulty] || DIFFICULTIES[DEFAULT_DIFFICULTY];
    this.level = Math.min(this.trackLevels().unlocked, LEVEL_COUNT);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.handheld });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.handheld ? 1.5 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(COLORS.fog, 45, 105);

    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 300);
    this.camera.position.set(0, CAMERA.height, CAMERA.distance);
    this.camView = { height: CAMERA.height, distance: CAMERA.distance };

    this.addLights();
    this.buildWorld();
    this.buildCharacter();

    this.player = { lane: 1, x: 0, y: 0, vy: 0, grounded: true, invulnerable: 0, jumps: 0, flip: 0 };

    createInput(canvas, {
      onLeft: () => this.moveLane(-1),
      onRight: () => this.moveLane(1),
      onJump: () => this.jump(),
      onStart: () => {
        if (this.state === STATE.PLAYING) return;
        // Durante o portal o cartão da loja continua no DOM, escondido: sem
        // esta guarda o Enter apertaria o botão de trocar chaves de novo.
        if (this.screen === 'reveal') return;
        this.ui.pressPrimaryButton();
      },
      onPause: () => this.togglePause(),
    });
    this.ui.onPause(() => this.togglePause());
    this.rush = false;                       // o ⚡ está apertado?
    this.rushLook = 0;                       // 0…1: o quanto as asas já cresceram
    this.featherLook = 0;                    // 0…1: o quanto a Pena Mágica já tingiu as asas
    this.contando = false;                   // a contagem da largada está no ar?
    this.ui.onRush(() => this.toggleRush());

    this.setupMuteButton();
    // Selo ao lado do nome do jogo: modo teste ligado sem aviso é receita
    // para achar que o progresso sumiu.
    this.ui.setTestBadge(isTestMode());
    setSpeech(this.save.speech);
    // Versão nova esperando: redesenha a tela para o botão aparecer sem
    // precisar sair e voltar.
    onUpdate(() => {
      if (this.state !== STATE.READY) return;   // correndo: fica para o menu
      this.render();
      this.maybeOfferUpdate();
    });
    watchInstall(() => {
      // O convite de instalar mora no cantinho dos adultos; se ele aparecer
      // enquanto a tela está aberta, é só redesenhar.
      if (this.state === STATE.READY && this.screen === 'grown') this.showGrownUps();
    });
    // Trocou de app ou bloqueou a tela? A corrida espera (e o áudio também,
    // em src/game/music.js) — ninguém perde vida enquanto está fora.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === STATE.PLAYING) this.pause();
    });
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    window.visualViewport?.addEventListener('resize', () => this.resize());
    this.resize();

    this.clock = new THREE.Clock();
    this.ui.setWallet(this.save.stats.keys || 0);
    this.reset();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  // Monta (ou remonta) o cenário da pista escolhida.
  buildWorld() {
    if (this.world) {
      this.scene.remove(this.world.root);
      disposeObject(this.world.root);
    }
    this.world = new World(this.scene, this.track);
    this.applyTrackLook();
    if (this.unicorn) this.applyTrackGlow();
    music.play(this.track.id);   // cada pista tem o seu tema
  }

  // Os dois ecos do Eco: cópias translúcidas dele, uma em cada faixa
  // vizinha. Existem porque o poder dele **já** alcança os dois lados
  // (`reach`, em Game.checkCollisions) — sem elas, os itens da faixa ao lado
  // sumiam sozinhos e ninguém entendia por quê.
  //
  // São unicórnios de verdade, montados pelo mesmo `createUnicorn`, e não
  // cópias congeladas: `animateUnicorn` é determinístico no tempo, então
  // basta animá-los com o mesmo relógio para galoparem em sincronia. O que
  // muda é a pintura — um material só, translúcido, no lugar das dezenas de
  // cores do original.
  buildEchoes() {
    this.disposeEchoes();
    if (!this.character.reach) return;

    this.echoMaterial = new THREE.MeshBasicMaterial({
      // Bem apagados: são eco, não gêmeos. A 0,45 eles competiam com o
      // próprio Eco e a criança perdia de vista qual dos três ela controla.
      color: 0xe9e2ff, transparent: true, opacity: 0.26, depthWrite: false, fog: false,
    });

    this.echoes = [-1, 1].map((lado) => {
      const eco = createUnicorn(this.character);
      eco.traverse((o) => {
        if (!o.isMesh) return;
        // A pintura original vai embora: um eco não tem cor própria.
        const antigo = o.material;
        Array.isArray(antigo) ? antigo.forEach((m) => m.dispose()) : antigo.dispose();
        o.material = this.echoMaterial;
        o.castShadow = false;
        o.receiveShadow = false;
      });
      eco.renderOrder = 1;
      eco.userData.lado = lado;
      eco.visible = false;
      this.scene.add(eco);
      return eco;
    });
  }

  disposeEchoes() {
    for (const eco of this.echoes || []) {
      this.scene.remove(eco);
      eco.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    }
    this.echoMaterial?.dispose();
    this.echoes = null;
    this.echoMaterial = null;
  }

  // Eles seguem o unicórnio uma faixa para cada lado, meio passo atrás — um
  // eco chega sempre um instante depois do som.
  updateEchoes(worldSpeed) {
    if (!this.echoes) return;
    const visivel = this.state === STATE.PLAYING;
    for (const eco of this.echoes) {
      eco.visible = visivel;
      if (!visivel) continue;
      eco.position.set(
        this.unicorn.position.x + eco.userData.lado * LANE_WIDTH,
        this.unicorn.position.y,
        this.unicorn.position.z + ECHO_LAG_Z
      );
      eco.rotation.copy(this.unicorn.rotation);
      // O atraso no tempo é o que faz parecer eco, e não gêmeo.
      animateUnicorn(eco, this.elapsed - ECHO_LAG, worldSpeed * 0.14, this.player.grounded);
    }
  }

  // Céu, neblina e luz mudam junto com a pista.
  applyTrackLook() {
    const track = this.track;
    this.scene.background?.dispose?.();
    this.scene.background = gradientTexture(track.sky[0], track.sky[1]);
    this.scene.fog.color.setHex(track.fog.color);
    this.scene.fog.near = track.fog.near;
    this.scene.fog.far = track.fog.far;

    this.hemisphere.color.setHex(track.hemisphere.sky);
    this.hemisphere.groundColor.setHex(track.hemisphere.ground);
    this.hemisphere.intensity = track.hemisphere.intensity;
    this.sun.color.setHex(track.sun.color);
    this.sun.intensity = track.sun.intensity;
  }

  setTrack(id) {
    if (!TRACKS[id] || id === this.track.id) return;
    if (!this.isOwned('track', id)) return;
    this.track = TRACKS[id];
    update((save) => { save.choices.track = id; });
    this.buildWorld();
    // Cada pista tem o seu caminho de fases: ao trocar, a fase atual volta
    // para a última aberta daquela pista.
    this.level = Math.min(this.trackLevels().unlocked, LEVEL_COUNT);
    sfx.pick();
    speak(this.track.name);
    if (this.state !== STATE.PLAYING) this.render();
  }

  // Monta (ou remonta) o unicórnio e o rastro do personagem escolhido.
  buildCharacter() {
    this.disposeEchoes();
    if (this.unicorn) {
      this.scene.remove(this.unicorn);
      disposeObject(this.unicorn);
    }
    if (this.trail) {
      this.scene.remove(this.trail);
      disposeObject(this.trail);
    }

    this.unicorn = createUnicorn(this.character);
    this.auras = createAuras();          // bolha, argolas e anéis de turbo
    this.unicorn.add(this.auras);

    // O jeito deste unicórnio: raios, folhinhas, gelo… (characterAura.js).
    // Vai dentro do próprio unicórnio, então some junto com ele na troca.
    this.charAura = createCharacterAura(this.character);
    if (this.charAura) this.unicorn.add(this.charAura);

    // Halo que só acende nas pistas escuras.
    this.nightGlow = createGlow(0xbfe9ff, 1.8, 0.085);
    this.nightGlow.position.y = 1.15;
    this.nightGlow.visible = false;
    this.unicorn.add(this.nightGlow);

    // Bolha de ar na cabeça, para respirar debaixo d'água.
    this.headBubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 16, 12),
      new THREE.MeshPhongMaterial({
        color: 0xdff6ff,
        transparent: true,
        opacity: 0.22,
        shininess: 90,
        specular: 0xffffff,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.headBubble.position.set(0, 0.02, -0.2);
    this.headBubble.renderOrder = 3;
    this.headBubble.visible = false;
    this.unicorn.userData.head.add(this.headBubble);

    this.scene.add(this.unicorn);
    this.buildEchoes();

    sfx.setPitch(this.character.voice);
    this.trail = createRainbowTrail(this.character.trail);
    this.scene.add(this.trail);
    resetRainbowTrail(this.trail, this.player?.x || 0, this.player?.y || 0);
    this.applyTrackGlow();
  }

  // Na pista da Noite o unicórnio acende: as próprias cores dele viram luz e
  // um halo suave aparece em volta. Nas outras pistas, tudo volta ao normal.
  applyTrackGlow() {
    // A pista acende o unicórnio (Noite, Espaço) — e o Sombra acende sozinho
    // em qualquer pista, porque brilhar no escuro é o jeitão dele.
    const glow = this.track.glow || this.character.glow;
    this.unicorn.traverse((obj) => {
      const material = obj.isMesh ? obj.material : null;
      if (!material || !material.emissive || material === this.nightGlow.material) return;
      if (glow) material.emissive.copy(material.color).multiplyScalar(glow.intensity);
      else material.emissive.setHex(0x000000);
    });

    this.nightGlow.visible = !!glow;
    if (glow) this.nightGlow.material.color.setHex(glow.halo);

    // Debaixo d'água todo mundo ganha o capacete de ar.
    this.headBubble.visible = !!this.track.helmet;
  }

  // A loja é a mesma para as duas coisas que se trocam por chaves — o
  // unicórnio e a pista. Só muda o que está sendo olhado.
  shopOf(kind) {
    return kind === 'track'
      ? {
        kind, guardados: 'tracks', lista: TRACK_LIST, slots: TRACK_SLOTS,
        obter: (id) => TRACKS[id], preco: trackPrice,
        retratos: () => getTrackPortraits(TRACK_LIST),
        atual: () => this.track,
        aplicar: (id) => this.setTrack(id),
        voltar: () => this.showTrackPicker(),
        // A pista só tem uma frase (`tagline`), e ela vai na linha de baixo:
        // a de cima fica vazia em vez de repetir a mesma coisa.
        subtitulo: () => '',
        // Na ficha cabe a descrição longa; a `tagline` continua sendo a
        // linha curta da grade e do rodapé do menu, onde não cabe parágrafo.
        descricao: (item) => item.story || item.tagline,
        chamada: () => t('é para lá que a corrida vai'),
      }
      : {
        kind, guardados: 'characters', lista: CHARACTER_LIST, slots: CHARACTER_SLOTS,
        obter: (id) => CHARACTERS[id], preco: characterPrice,
        retratos: () => getPortraits(CHARACTER_LIST),
        atual: () => this.character,
        aplicar: (id) => this.setCharacter(id),
        voltar: () => this.showCharacterPicker(),
        subtitulo: (item) => item.title,
        descricao: (item) => item.story,
        chamada: (item) => t('{nome} vem correr com você', { nome: item.name }),
      };
  }

  // A posição guardada da grade. Não se apaga ao ser lida: escolher um
  // unicórnio na ficha redesenha a grade duas vezes (uma pelo `setCharacter`,
  // outra pelo `voltar`), e apagar na primeira fazia a segunda pular de
  // volta para o escolhido. Quem apaga é o `showHome`: chegar pela tela
  // inicial começa a grade do zero.
  gridScrollOrNull() {
    return this.gridScroll ?? null;
  }

  // Sem `price` vem liberado (só a Uni e o Campo); o resto, depois de trocado.
  // No modo teste tudo está liberado — sem escrever nada na loja, então
  // desligar o modo devolve as compras de verdade.
  isOwned(kind, id) {
    const loja = this.shopOf(kind);
    const item = loja.obter(id);
    if (!item) return false;
    if (isTestMode()) return true;
    // O Eco não tem preço, mas também não vem de graça: ele aparece quando
    // os outros forem todos libertados. Sem este caso ele contaria como
    // "sem preço, logo é seu" e estaria disponível desde o primeiro dia.
    if (item.earned) return this.storyEndUnlocked;
    if (!loja.preco(item)) return true;
    return (this.save.shop?.[loja.guardados] || []).includes(id);
  }

  get wallet() {
    return this.save.stats.keys || 0;
  }

  // O progresso das fases é por pista: cada uma tem as suas doze. A entrada
  // nasce na primeira vez que a pista é jogada.
  trackLevels(trackId = this.track.id) {
    const levels = this.save.levels;
    if (!levels[trackId]) levels[trackId] = { unlocked: 1, done: {} };
    return levels[trackId];
  }

  setCharacter(id) {
    if (!CHARACTERS[id] || id === this.character.id) return;
    if (!this.isOwned('character', id)) return;
    this.character = CHARACTERS[id];
    update((save) => { save.choices.character = id; });
    this.buildCharacter();
    sfx.pick();
    speak(this.character.name);
    if (this.state !== STATE.PLAYING) this.render();
  }

  // Setas do teclado passeiam pela grade que estiver aberta. Como a grade é
  // redesenhada a cada troca, o destaque nunca fica para trás.
  cycleMode(dir) {
    const lista = Object.values(MODES);
    const index = lista.findIndex((m) => m.id === this.mode.id);
    this.pickMode(lista[(index + dir + lista.length) % lista.length].id);
  }

  // As setas passeiam só pelo que já é seu: o trancado se pega tocando nele,
  // que é o que abre a troca.
  cycleItem(kind, dir) {
    const loja = this.shopOf(kind);
    const meus = loja.lista.filter((item) => this.isOwned(kind, item.id));
    if (meus.length < 2) return;
    const index = meus.findIndex((item) => item.id === loja.atual().id);
    loja.aplicar(meus[(index + dir + meus.length) % meus.length].id);
  }

  cycleCharacter(dir) { this.cycleItem('character', dir); }
  cycleTrack(dir) { this.cycleItem('track', dir); }

  // Cada unicórnio tem as suas pistas (ver `fast` em characters.js): nelas
  // ele corre mais rápido, se a criança apertar o ⚡.
  isFastHere() {
    return isFastOn(this.character, this.track.id);
  }

  toggleRush() {
    if (!this.isFastHere()) return;
    this.rush = !this.rush;
    this.ui.showRush(true, this.rush);
    sfx.pick();
    this.ui.toast(this.rush ? t('⚡ Disparou!') : t('Voltou ao normal'));
    // Na lição, a aula do ⚡ só passa quando ele é **ligado** — desligar não
    // ensina nada.
    if (this.rush) this.lessonAction('rapido');
  }

  // Relâmpago da Tempestade: de vez em quando o céu clareia de uma vez e
  // volta ao normal em meio segundo. Mexe só na luz, então não custa nada —
  // e é o que faz a pista parecer viva sem mudar uma regra do jogo.
  applyLightning(dt) {
    if (!this.track.lightning) {
      if (this.flashBoost) { this.flashBoost = 0; this.applyTrackLook(); }
      return;
    }
    this.nextBolt = (this.nextBolt ?? 3) - dt;
    if (this.nextBolt <= 0) {
      this.nextBolt = 2.5 + Math.random() * 5;
      this.flashBoost = 1;
      this.world.flashBolt();     // o risco no céu
      sfx.thunder();
    }
    if (!this.flashBoost) return;

    this.flashBoost = Math.max(0, this.flashBoost - dt * 2.2);
    const f = this.flashBoost;
    this.hemisphere.intensity = this.track.hemisphere.intensity * (1 + f * 1.6);
    this.sun.intensity = this.track.sun.intensity * (1 + f * 2.2);
    if (f === 0) this.applyTrackLook();
  }

  // Com o ⚡ ligado as asas crescem e acendem; com a 🪶 Pena Mágica elas
  // também mudam de cor, para a cor dela — o aviso, no próprio personagem,
  // de que o próximo pulo vai bem mais alto e mais longo. As transições são
  // suaves nos dois sentidos (`rushLook` e `featherLook` vão de 0 a 1), senão
  // o unicórnio "pula de tamanho" ou de cor no meio da corrida.
  //
  // Os dois se somam quando acontecem juntos: o brilho soma ao da pista (na
  // Noite todo mundo já é aceso, e aqui as asas ficam ainda mais), e a cor
  // que acende é a que a Pena deixou nas asas, não a original.
  applyWingEffects(dt) {
    const alvoRush = this.state === STATE.PLAYING && this.rush && this.isFastHere() ? 1 : 0;
    const alvoFeather = this.state === STATE.PLAYING && this.powers.feather > 0 ? 1 : 0;
    const antes = this.rushLook + this.featherLook;
    this.rushLook += (alvoRush - this.rushLook) * Math.min(1, 7 * dt);
    this.featherLook += (alvoFeather - this.featherLook) * Math.min(1, 7 * dt);
    if (Math.abs(alvoRush - this.rushLook) < 0.002) this.rushLook = alvoRush;
    if (Math.abs(alvoFeather - this.featherLook) < 0.002) this.featherLook = alvoFeather;
    // Nada mudou e não há o que desfazer: não gasta o quadro.
    if (this.rushLook + this.featherLook === antes && this.rushLook === 0 && this.featherLook === 0) return;

    const r = this.rushLook;
    const f = this.featherLook;
    const wings = this.unicorn.userData.wings;
    if (!wings) return;
    const escala = WING_SCALE * (1 + 0.5 * r + 0.18 * f);
    const brilho = (this.track.glow?.intensity || 0) + 0.8 * r + 0.6 * f;
    const corPena = new THREE.Color(POWERUPS.feather.color);

    for (const wing of wings.children) {
      wing.scale.setScalar(escala);
      wing.traverse((obj) => {
        const material = obj.isMesh ? obj.material : null;
        if (!material || !material.emissive) return;
        // A cor original de cada pena fica guardada uma vez só: é dela que
        // se parte a cada quadro, senão a mistura ia acumulando em cima de
        // si mesma e as asas convergiam todas para a cor da Pena.
        if (!material.userData.corBase) material.userData.corBase = material.color.clone();
        material.color.copy(material.userData.corBase).lerp(corPena, f);
        material.emissive.copy(material.color).multiplyScalar(brilho);
      });
    }
  }

  // Botãozinho de som no canto do HUD.
  setupMuteButton() {
    const button = document.querySelector('#mute');
    if (!button) return;
    const refresh = () => {
      button.innerHTML = withIcons(music.isMuted() ? '🔇' : '🔊');
      button.setAttribute('aria-pressed', String(music.isMuted()));
    };
    button.addEventListener('click', () => {
      music.setMuted(!music.isMuted());
      refresh();
    });
    refresh();
  }

  addLights() {
    this.hemisphere = new THREE.HemisphereLight(0xffffff, 0xffc3e6, 1.05);
    this.scene.add(this.hemisphere);

    this.sun = new THREE.DirectionalLight(0xfff3d6, 1.5);
    this.sun.position.set(8, 18, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.handheld ? 512 : 1024, this.handheld ? 512 : 1024);
    const c = this.sun.shadow.camera;
    c.left = -18; c.right = 18; c.top = 18; c.bottom = -18; c.near = 1; c.far = 60;
    this.scene.add(this.sun);
  }

  // A tela pode ser larga (computador) ou alta e estreita (celular em pé).
  // Em pé, a câmera abre o campo de visão e afasta um pouco para as três
  // pistas continuarem cabendo na tela.
  resize() {
    // A altura de verdade da tela, para o CSS não confiar só no `dvh`.
    //
    // O `dvh` já resolveu a barra de endereço escondendo e mostrando (ver o
    // comentário de `.card` no style.css), mas em alguns aparelhos ele não
    // atualiza sozinho quando a barra muda — o cartão fica com uma altura
    // velha, acha que cabe, não rola, e os botões de baixo saem cortados.
    // `visualViewport.height` é a tela que existe **agora**, sempre; guardar
    // 1% dela numa variável CSS dá ao `.card` uma segunda fonte de altura,
    // que o style.css usa por cima do `dvh` (a última declaração vale).
    document.documentElement.style.setProperty(
      '--vh1', `${(window.visualViewport?.height ?? innerHeight) * 0.01}px`
    );

    const w = innerWidth;
    const h = innerHeight;
    const aspect = w / h;

    this.renderer.setSize(w, h);
    this.camera.aspect = aspect;
    this.portrait = aspect < 1;
    this.baseFov = this.portrait ? 64 : CAMERA.fov;
    this.camera.fov = this.baseFov;

    const zoom = THREE.MathUtils.clamp(1.25 / Math.max(aspect, 0.42), 1, 1.55);
    this.camView.distance = CAMERA.distance * zoom;
    this.camView.height = CAMERA.height * (1 + (zoom - 1) * 0.75);
    this.camera.updateProjectionMatrix();
  }

  // O recorde é **a distância**, e é **de cada pista em cada brincadeira**.
  //
  // Antes o painel "Recorde" mostrava pontos por modo enquanto a faixa no
  // chão marcava distância por modo: duas contas diferentes com o mesmo
  // nome, e a que a criança via na pista não era a que via no HUD. Agora é
  // a mesma, e na mesma unidade da caixinha "Distância" ao lado — dá para
  // comparar as duas de relance, correndo.
  //
  // Pista **e** modo, e não só pista: a marca é um lugar, mas o quanto se
  // corre nele depende da brincadeira. Uma partida de Desafio no Campo vai
  // muito mais longe que uma do Livre, que acaba assim que a meta de itens
  // fecha — com uma marca só por pista, a do Livre nunca mais apareceria.
  // As doze fases dividem um recorde só (`levels`), e não um por fase: o
  // recorde é da brincadeira, não de cada etapa dela.
  get best() {
    return this.save.stats.distances?.[this.recordKey] || 0;
  }

  // `campo:baby`, `oceano:levels`… Saves antigos guardavam só o modo, e
  // depois só a pista; nenhuma das duas formas casa com esta, então os
  // recordes recomeçam do zero em vez de quebrar.
  get recordKey() {
    return `${this.track.id}:${this.mode.id}`;
  }

  saveBest() {
    update((save) => {
      // Os pontos continuam guardados por modo — eles aparecem nas
      // estatísticas, mas não são mais "o recorde".
      if (this.score > (save.stats.bests[this.mode.id] || 0)) {
        save.stats.bests[this.mode.id] = Math.floor(this.score);
      }
      // A maior distância de cada pista, em cada brincadeira, vira a faixa
      // dourada da próxima vez que se correr ali daquele jeito.
      save.stats.distances ??= {};
      if (this.distance > (save.stats.distances[this.recordKey] || 0)) {
        save.stats.distances[this.recordKey] = Math.floor(this.distance);
      }
    });
  }

  // Meta do modo Livre: começa no `target` do modo e cresce a cada vitória.
  goalFor(mode) {
    if (!mode.target) return null;
    const step = (mode.targetStep || 0) * (this.save.babyLevel - 1);
    return Math.min(mode.targetMax || Infinity, mode.target + step);
  }

  get goal() {
    return this.goalFor(this.mode);
  }

  // O modo Fases usa os números da fase escolhida.
  levelMode(number) {
    return { ...MODES.levels, ...levelData(number), level: number };
  }

  startLevel(number) {
    this.level = Math.min(Math.max(1, number), LEVEL_COUNT);
    this.mode = this.levelMode(this.level);
    sfx.resume();
    music.play(this.track.id);
    update((save) => {
      save.choices.mode = 'levels';
      save.stats.runs += 1;
      save.stats.plays[this.track.id] = (save.stats.plays[this.track.id] || 0) + 1;
      save.stats.chars[this.character.id] = (save.stats.chars[this.character.id] || 0) + 1;
    });
    this.reset();
    this.world.placeStart();     // o portal de partida, em toda corrida
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    // O ⚡ vale nas Fases também: correr mais rápido junta as chaves antes,
    // ao preço de mais obstáculo por segundo. E ele **atravessa a troca de
    // fase**: quem escolheu correr rápido não aperta de novo a cada fase —
    // só perde se o unicórnio não for rápido na pista.
    this.rush = this.rush && this.isFastHere();
    if (!this.rush) this.rushLook = 0;
    this.ui.showRush(this.isFastHere(), this.rush);

    this.largar(() => this.ui.showPause(true));
  }

  // Grade das doze fases. A que ainda não abriu fica do mesmo tamanho das
  // outras (criança mira mal: tile pequeno colado num grande vira toque
  // errado) e responde ao toque com uma chacoalhada — toque que não faz
  // nada parece defeito.
  showLevels() {
    this.state = STATE.READY;
    this.ui.showPause(false);
    this.screen = 'levels';
    this.mode = this.levelMode(this.level);
    this.reset();

    const { unlocked, done } = this.trackLevels();
    const tiles = Array.from({ length: LEVEL_COUNT }, (_, i) => {
      const number = i + 1;
      const open = number <= unlocked;
      const state = done[number] ? 'done' : open ? 'open' : 'locked';
      return `<button class="level-tile ${state}" data-pick="${number}">`
        + `<span class="level-number">${open ? number : '🔒'}</span>`
        + `<span class="level-keys">${open ? `🔑 ${levelData(number).keys}` : ''}</span>`
        + `${done[number] ? '<span class="level-done">⭐</span>' : ''}</button>`;
    }).join('');

    this.ui.showOverlay({
      // O nome da pista no título: cada pista tem o seu caminho de fases, e
      // é preciso ficar claro em qual delas a criança está.
      title: t('Fases · {emoji} {pista}', { emoji: this.track.emoji, pista: this.track.name }),
      html: `<div class="levels-grid">${tiles}</div>`,
      back: () => this.showModePicker(),
    });
    this.ui.bindExtra((numero, tile) => {
      const n = Number(numero);
      if (n > unlocked) {
        sfx.deny();
        this.ui.shakeElement(tile);
        this.ui.toast(t('Essa ainda não abriu 🔒'));
        return;
      }
      sfx.pick();
      this.startLevel(n);
    });
  }

  levelComplete() {
    this.ui.showPause(false);
    sfx.win();
    this.world.burst(this.unicorn.position.clone().setY(1.6), COLORS.star);
    const number = this.level;
    const trackId = this.track.id;
    update((save) => {
      const fases = save.levels[trackId] || (save.levels[trackId] = { unlocked: 1, done: {} });
      fases.done[number] = true;
      fases.unlocked = Math.max(fases.unlocked, Math.min(number + 1, LEVEL_COUNT));
      save.stats.wins += 1;
    });

    const hasNext = number < LEVEL_COUNT;
    this.state = STATE.OVER;
    this.saveBest();
    this.ui.setBest(this.best);
    this.ui.showOverlay({
      title: t('Fase {n} completa! 🎉', { n: number }),
      text: hasNext
        ? t('{nome} juntou as {chaves} chaves. A fase {proxima} abriu!',
          { nome: this.character.name, chaves: this.mode.keys, proxima: number + 1 })
        : t('{nome} terminou as {total} fases do {pista}! Que corrida!',
          { nome: this.character.name, total: LEVEL_COUNT, pista: this.track.name }),
      buttons: [
        ...(hasNext ? [{ label: t('▶️ Próxima fase'), onClick: () => this.startLevel(number + 1) }] : []),
        { label: t('🔁 Jogar de novo'), onClick: () => this.startLevel(number), secondary: hasNext },
        { label: t('🗺️ Escolher fase'), onClick: () => this.showLevels(), secondary: true },
      ],
    });
  }

  reset() {
    this.score = 0;
    this.hearts = 0;
    this.collected = 0;
    this.keys = 0;
    this.distance = 0;
    this.recordDistance = this.best;
    this.beatRecord = false;
    // `extraLives` é a Lulu, que é bebê e corre com uma vida a mais.
    this.lives = START_LIVES + (this.character.extraLives ?? 0);
    this.speed = this.mode.startSpeed;
    // `firstHitFree` é o Coco: a casca dura aguenta a primeira trombada.
    this.hitShield = !!this.character.firstHitFree;
    this.elapsed = 0;
    this.player = { lane: 1, x: 0, y: 0, vy: 0, grounded: true, invulnerable: 0, jumps: 0, flip: 0 };
    // De frente para a pista, e não para onde o menu tiver parado.
    //
    // Nas telas de menu o unicórnio gira devagar, para se mostrar (ver o
    // `state === READY` no fim do tick). O `rotation.y` ficava com o ângulo
    // do giro, e quem começava uma corrida via o bicho de lado — ou de
    // costas — durante toda a contagem, até o primeiro comando endireitá-lo.
    this.unicorn.rotation.x = 0;
    this.unicorn.rotation.y = 0;
    // Segundos restantes de cada efeito (`flash` é só o brilho da vida extra).
    // `startShield` é a Chiclete, que começa dentro da bolha de chiclete.
    this.powers = { shield: this.character.startShield ?? 0, magnet: 0, boost: 0, flash: 0 };
    this.ui.setPowers([]);
    this.unicorn.position.set(0, 0, 0);
    this.unicorn.visible = true;
    this.setBodyVisible(true);
    resetRainbowTrail(this.trail, 0, 0);
    // `keyLuck` é a Pérola: com ela a chave nasce mais vezes. Vai por aqui
    // porque quem sorteia é o mundo, que não conhece o personagem.
    this.world.keyLuck = this.character.keyLuck ?? 1;
    this.world.reset(this.mode);
    this.ui.setMode(this.mode);
    this.licao = null;
    this.ui.setLesson('');
    this.ui.setLessonHint(null);
    this.ui.setLessonProgress(0, 0);
    this.ui.setScore(0);
    this.ui.setHearts(0);
    this.ui.setGoal(0, this.goal);
    this.ui.setKeys(0, this.mode.keys || 0);
    this.ui.setDistance(0);
    this.world.resetMarkers(this.recordDistance);
    this.ui.setLevel(this.level);
    this.ui.setLives(this.lives);
    this.ui.setBest(this.best);
  }

  // ---- Telas de escolha ------------------------------------------------
  //
  // Não é mais uma fila de passos obrigatórios. O hub mostra em três figuras
  // o que já está escolhido, com um botão de jogar enorme: quem quer jogar
  // joga com um toque; quem quer trocar toca na figura do que quer trocar.

  // Redesenha a tela de escolha aberta agora, para o destaque acompanhar o
  // que acabou de mudar no 3D.
  render() {
    if (this.screen === 'character') return this.showCharacterPicker();
    if (this.screen === 'track') return this.showTrackPicker();
    if (this.screen === 'mode') return this.showModePicker();
    if (this.screen === 'home') return this.showHome();
    if (this.screen === 'story') return this.showStory(this.storyPage);
    return undefined;
  }

  // O cantinho de onde tudo sai e para onde tudo volta.
  showHome() {
    this.fecharViewer();
    this.pararContagem();
    this.state = STATE.READY;
    this.screen = 'home';
    this.ui.showPause(false);
    // Quem sai da lição pela pausa passa por aqui: as escolhas voltam
    // também nesse caminho, não só ao terminar.
    this.restoreAfterTutorial();
    this.gridScroll = null;      // a grade recomeça do zero vinda daqui
    this.reset();

    const retratos = getPortraits(CHARACTER_LIST);
    const cenarios = getTrackPortraits(TRACK_LIST);
    const modo = MODES[this.mode.id] || MODES[DEFAULT_MODE];
    // Só o Desafio tem velocidade para mostrar; nas outras a figura basta.
    const selo = modo.difficulties
      ? `<span class="pick-badge">${this.difficulty.emoji}</span>`
      : '';

    this.ui.showOverlay({
      home: true,
      picker: true,
      hint: true,
      arrows: false,        // no hub as setas não têm o que percorrer
      title: t('Vamos correr?'),
      html: `
        <div class="picks">
          <button class="pick" data-pick="character" aria-label="${t('Trocar de unicórnio')}">
            <img class="pick-face" src="${retratos[this.character.id]}" alt="" />
            <span class="pick-name">${this.character.name}</span>
          </button>
          <button class="pick" data-pick="track" aria-label="${t('Trocar de pista')}">
            <img class="pick-face" src="${cenarios[this.track.id]}" alt="" />
            <span class="pick-name">${this.track.name}</span>
          </button>
          <button class="pick" data-pick="mode" aria-label="${t('Trocar de brincadeira')}">
            <span class="pick-emoji">${modo.emoji}${selo}</span>
            <span class="pick-name">${modo.name}</span>
          </button>
        </div>
        <div class="destaques">
          <button class="destaque historia${this.storyEndNew ? ' nova' : ''}" data-pick="story">
            <span class="destaque-emoji">📖</span>${t('A história')}${this.storyEndNew ? ' ✨' : ''}
          </button>
          <button class="destaque poderes" data-pick="powers">
            <span class="destaque-emoji">⬆️</span>${t('Poderes')}
          </button>
        </div>
        <div class="extras">
          <button class="mini-button" data-pick="stats">📊 ${t('Estatísticas')}</button>
          <button class="mini-button" data-pick="about">ℹ️ ${t('Sobre')}</button>
          <button class="mini-button aprender" data-pick="tutorial">👆 ${t('Aprender')}</button>
          ${hasUpdate() ? `<button class="mini-button nova" data-pick="update">🔄 ${t('Atualizar')}</button>` : ''}
        </div>
      `,
      buttons: [{ label: t('▶️ JOGAR'), huge: true, onClick: () => this.playNow() }],
      grown: () => this.showGrownUps(),
    });
    this.ui.bindExtra((qual) => {
      sfx.tap();
      if (qual === 'character') return this.showCharacterPicker();
      if (qual === 'track') return this.showTrackPicker();
      if (qual === 'story') return this.showStory(0);
      if (qual === 'tutorial') return this.startTutorial();
      if (qual === 'stats') return this.showStats();
      if (qual === 'powers') return this.showPowerShop();
      if (qual === 'about') return this.showAbout();
      if (qual === 'update') return this.applyUpdate();
      return this.showModePicker();
    });

    // Se a versão nova chegou no meio de uma corrida, o convite esperou até
    // aqui: só se oferece troca com o jogo parado no menu.
    this.maybeOfferUpdate();
  }

  // Versão nova esperando: vale a pena interromper para perguntar?
  //
  // Só no menu — nunca no meio de uma corrida, nem por cima de uma escolha
  // de unicórnio —, e só uma vez por versão: quem disse "agora não" não é
  // perguntado de novo pela mesma, nem depois de fechar e abrir o jogo. O
  // botão 🔄 do menu continua ali para quem mudar de ideia.
  maybeOfferUpdate() {
    if (!hasUpdate() || this.screen !== 'home') return false;
    const versao = updateVersion();
    // Ainda não sabemos qual versão é (a resposta do worker vem por
    // mensagem). Quando chegar, o `onUpdate` chama isto de novo.
    if (!versao || this.save.updateIgnorada === versao) return false;
    this.showUpdateOffer(versao);
    return true;
  }

  showUpdateOffer(versao) {
    this.state = STATE.READY;
    this.screen = 'update';
    this.ui.showPause(false);
    this.ui.showOverlay({
      title: t('✨ Chegou versão nova!'),
      text: t('O jogo recarrega num instante e volta para cá. Nada do que você juntou se perde.'),
      buttons: [
        { label: t('🔄 Atualizar agora'), huge: true, onClick: () => this.applyUpdate() },
        {
          label: t('Agora não'),
          secondary: true,
          onClick: () => {
            update((save) => { save.updateIgnorada = versao; });
            this.save = getSave();
            this.showHome();
          },
        },
      ],
    });
  }

  // O botão grande: joga já, com o que estiver escolhido. No modo Fases
  // escolher a fase é parte da brincadeira, então abre a grade.
  playNow() {
    if (this.mode.id === 'levels') return this.showLevels();
    return this.start(this.mode.id);
  }

  // As três brincadeiras, em figuras: cada card mostra como é a pista, e a
  // velocidade do Desafio sai no próprio card, sem abrir outra tela.
  showModePicker() {
    this.state = STATE.READY;
    this.screen = 'mode';
    this.ui.showPause(false);
    this.reset();

    const { unlocked, done } = this.trackLevels();
    // Mini-mapa das fases da pista escolhida: cheio = feita, contornada =
    // aberta, apagada = ainda não.
    const mapa = Array.from({ length: LEVEL_COUNT }, (_, i) => {
      const numero = i + 1;
      const estado = done[numero] ? 'done' : numero <= unlocked ? 'open' : 'locked';
      return `<i class="map-dot ${estado}"></i>`;
    }).join('');

    const vitrine = {
      baby: '<span class="mode-strip">💗 ✨ 💗 ✨</span>',
      levels: `<span class="mode-strip">${mapa}</span>`,
      adventure: '<span class="mode-strip">🌵 💗 🪨 ⭐</span>',
    };
    const legenda = {
      baby: t('sem nada no caminho'),
      levels: t('{pista}: {feitas} de {total} fases',
        { pista: this.track.name, feitas: unlocked, total: LEVEL_COUNT }),
      adventure: t('com coisas no caminho e 3 vidas'),
    };

    const cards = Object.values(MODES).map((m) => {
      const escolhido = m.id === this.mode.id;
      const card = `<button class="mode-card${escolhido ? ' escolhido' : ''}"`
        + ` data-pick="modo:${m.id}" aria-pressed="${escolhido}">`
        + `<span class="mode-emoji">${m.emoji}</span>`
        + `<span class="mode-body">`
        + `<span class="mode-name">${m.name}</span>`
        + `${vitrine[m.id] || ''}`
        + `<span class="mode-hint">${legenda[m.id] || m.tagline}</span>`
        + `</span></button>`;
      // A velocidade abre dentro do próprio card escolhido — uma tela a menos.
      if (!m.difficulties || !escolhido) return card;
      const bolhas = DIFFICULTY_LIST.map((nivel) => (
        `<button class="speed${nivel.id === this.difficulty.id ? ' escolhido' : ''}"`
        + ` data-pick="vel:${nivel.id}" aria-pressed="${nivel.id === this.difficulty.id}">`
        + `<b>${nivel.emoji}</b>${nivel.name}</button>`
      )).join('');
      return `${card}<div class="speeds">${bolhas}</div>`;
    }).join('');

    this.ui.showOverlay({
      hint: true,
      title: t('Como vamos brincar?'),
      html: `<div class="mode-list">${cards}</div>`,
      buttons: [{ label: t('▶️ JOGAR'), huge: true, onClick: () => this.playNow() }],
      back: () => this.showHome(),
    });
    this.ui.bindExtra((valor) => {
      const [tipo, id] = valor.split(':');
      return tipo === 'vel' ? this.pickDifficulty(id) : this.pickMode(id);
    });
  }

  pickMode(id) {
    const modo = MODES[id];
    if (!modo) return;
    if (modo.id === this.mode.id) { sfx.tap(); return; }
    this.mode = modo;
    update((save) => { save.choices.mode = modo.id; });
    sfx.pick();
    speak(modo.name);
    this.showModePicker();
  }

  pickDifficulty(id) {
    const nivel = DIFFICULTIES[id];
    if (!nivel || nivel.id === this.difficulty.id) return;
    this.difficulty = nivel;
    update((save) => { save.choices.difficulty = nivel.id; });
    sfx.pick();
    speak(nivel.name);
    this.showModePicker();
  }

  // Cantinho dos adultos: o que é de configuração sai da pilha de botões da
  // criança e fica atrás de um toque longo no 👑.
  // O cantinho dos adultos: idioma, voz, instalar — e as duas ferramentas
  // perigosas, o modo teste e o apagar tudo.
  //
  // Elas moravam na tela de estatísticas, que é uma tela de olhar: a criança
  // entra ali para ver quantas corridas fez, e encontrava, na mesma fileira
  // de botões, um que apaga o progresso inteiro. Aqui atrás do toque longo na
  // coroa, ninguém chega sem querer.
  showGrownUps({ confirmandoApagar = false } = {}) {
    this.state = STATE.READY;
    this.screen = 'grown';
    this.ui.showPause(false);

    // Uma lista de ajustes, e não sete botões-pílula.
    //
    // Com um botão grande para cada coisa, a fileira passava da tela do
    // celular e os últimos ficavam cortados. Fazer a fileira rolar resolvia
    // o alcance mas não o problema: ajuste cortado parece defeito, e quem
    // abre esta tela quer ver **tudo o que dá para mexer** de uma vez.
    //
    // Linha compacta é também o que esta tela é: aqui não se joga, se
    // configura — e quem configura é um adulto, com o dedo de adulto. Os
    // botões grandes ficam onde há decisão de criança.
    const linhas = [
      canSpeak() && {
        id: 'voz',
        icone: speechOn() ? '🔊' : '🔈',
        nome: t('Voz'),
        valor: speechOn() ? t('ligada') : t('desligada'),
      },
      // Trocar a voz só faz sentido com ela ligada e com mais de uma
      // instalada — em aparelho que só tem uma, não há o que oferecer.
      canSpeak() && speechOn() && vozesDoIdioma().length > 1 && {
        id: 'trocar-voz', icone: '🗣️', nome: t('Trocar a voz'), valor: nomeDaVoz(),
      },
      // O idioma mora aqui, e não no menu: é escolha de quem instala o jogo,
      // feita uma vez. No menu da criança era um botão que trocava o jogo
      // inteiro de língua com um toque sem querer.
      {
        id: 'idioma',
        icone: idiomaInfo().bandeira,
        nome: t('Idioma'),
        valor: idiomaInfo().nome,
      },
      canInstall() && { id: 'instalar', icone: '📲', nome: t('Instalar'), valor: '' },
      {
        id: 'teste',
        icone: '🧪',
        nome: t('Modo teste'),
        valor: isTestMode() ? t('ligado') : t('desligado'),
        aviso: isTestMode(),
      },
      confirmandoApagar
        ? { id: 'apagar-mesmo', icone: '⚠️', nome: t('Apagar mesmo?'), valor: t('toque de novo'), aviso: true }
        : { id: 'apagar', icone: '🧹', nome: t('Recomeçar do zero'), valor: '' },
    ].filter(Boolean);

    const html = `<div class="ajustes">${linhas.map((l) => `
      <button class="ajuste${l.aviso ? ' aviso' : ''}" data-pick="${l.id}">
        <span class="ajuste-icone">${l.icone}</span>
        <span class="ajuste-nome">${l.nome}</span>
        <span class="ajuste-valor">${l.valor}</span>
      </button>`).join('')}</div>`;

    this.ui.showOverlay({
      title: t('👑 Dos adultos'),
      html,
      buttons: [{ label: t('⬅️ Voltar ao jogo'), huge: true, onClick: () => this.showHome() }],
      back: () => this.showHome(),
    });

    this.ui.bindExtra((qual) => {
      sfx.tap();
      if (qual === 'voz') return this.toggleSpeech();
      if (qual === 'trocar-voz') return this.showVoicePicker();
      if (qual === 'idioma') return this.showLanguagePicker({ voltarPara: 'grown' });
      if (qual === 'instalar') return this.installApp();
      if (qual === 'teste') return this.toggleTestMode();
      if (qual === 'apagar') return this.showGrownUps({ confirmandoApagar: true });
      if (qual === 'apagar-mesmo') {
        resetSave();
        this.mode = MODES[this.save.choices.mode] || MODES[DEFAULT_MODE];
        this.character = CHARACTERS[this.save.choices.character];
        this.track = TRACKS[this.save.choices.track];
        this.buildWorld();
        this.buildCharacter();
        return this.showGrownUps();
      }
      return undefined;
    });
  }

  // Escolher a voz, no cantinho dos adultos.
  //
  // A voz padrão de português costuma ser a pior instalada, e quase todo
  // aparelho tem mais de uma. A lista vem já ordenada pelo speech.js — a
  // primeira é a melhor aposta —, e tocar em qualquer uma a experimenta na
  // hora, com o nome do unicórnio escolhido: é ouvindo que se decide.
  showVoicePicker() {
    this.state = STATE.READY;
    this.screen = 'voz';
    this.ui.showPause(false);

    const lista = vozesDoIdioma();
    const atual = nomeDaVoz();
    const linhas = lista.map((v, i) => `
      <button class="voz-item${v.name === atual ? ' escolhida' : ''}" data-pick="${i}">
        <span class="voz-nome">${v.name}</span>
        <span class="voz-marca">${v.name === atual ? '✅' : (i === 0 ? '⭐' : '')}</span>
      </button>`).join('');

    this.ui.showOverlay({
      picker: true,
      title: t('🗣️ Trocar a voz'),
      html: `<div class="voz-lista">${linhas}</div>`
        + `<p class="viewer-dica">${t('toque numa voz para ouvir')}</p>`,
      buttons: [{ label: t('✅ Pronto'), huge: true, onClick: () => this.showGrownUps() }],
      back: () => this.showGrownUps(),
    });

    this.ui.bindExtra((qual) => {
      const v = lista[Number(qual)];
      if (!v) return;
      sfx.tap();
      const nome = escolherVoz(v.name);
      update((save) => {
        save.vozes = { ...(save.vozes || {}), [idiomaInfo().fala]: nome };
      });
      this.save = getSave();
      // A amostra é o unicórnio escolhido: é a frase que a criança mais vai
      // ouvir, então é por ela que a voz tem de ser julgada.
      speak(`${this.character.name}. ${this.character.title || ''}`);
      this.showVoicePicker();
    });
  }

  toggleSpeech() {
    const ligado = setSpeech(!speechOn());
    update((save) => { save.speech = ligado; });
    if (ligado) speak(t('Pronto, agora eu falo'));
    this.showGrownUps();
  }

  // A grade das duas escolhas, montada do mesmo jeito: o que é seu, o que
  // está à venda (desbotado, com cadeado e preço) e um espaço vazio para
  // cada item que ainda não foi criado — a criança vê que tem mais vindo.
  gridHtml(kind) {
    const loja = this.shopOf(kind);
    const retratos = loja.retratos();
    const atualId = loja.atual().id;

    const cartoes = loja.lista.map((item) => {
      const escolhido = item.id === atualId;
      const meu = this.isOwned(kind, item.id);
      const classes = ['cast-card', escolhido ? 'escolhido' : '', meu ? '' : 'trancado']
        .filter(Boolean).join(' ');
      // No trancado o preço ocupa o lugar do nome: é a informação que
      // importa nele, e o retrato continua à vista para dar vontade.
      const rodape = meu
        ? `${item.emoji} ${item.name}`
        // O que se conquista não mostra preço: mostra o troféu, senão
        // pareceria de graça (preço zero) para quem olha a grade.
        : item.earned
          ? '<span class="cast-price conquista">🏆</span>'
          : `<span class="cast-price">🔑 ${loja.preco(item)}</span>`;
      // Na grade de pistas, o ⚡ marca as que o unicórnio escolhido corre
      // mais rápido — inclusive nas trancadas, porque isso ajuda a decidir
      // qual comprar.
      const raio = kind === 'track' && isFastOn(this.character, item.id)
        ? `<span class="cast-fast" title="${this.character.name} corre mais rápido aqui">⚡</span>`
        : '';
      // Quem se conquista aparece como sombra: o Eco é invisível na
      // história, e a grade não pode entregar quem ele é antes da hora.
      const sombra = !meu && item.earned ? ' sombra' : '';
      return `<button class="${classes}" data-pick="${item.id}" aria-pressed="${escolhido}">`
        + `<img class="cast-face${sombra}" src="${retratos[item.id]}" alt="" />`
        + `${meu ? '' : '<span class="cast-lock">🔒</span>'}`
        + raio
        + `<span class="cast-name">${rodape}</span></button>`;
    });

    for (let i = loja.lista.length; i < loja.slots; i++) {
      cartoes.push(`<button class="cast-card vazio" data-pick="vazio" aria-label="${t('ainda não existe')}">`
        + '<span class="cast-soon">?</span>'
        + `<span class="cast-name">${t('em breve')}</span></button>`);
    }

    return `<div class="cast-grid">${cartoes.join('')}</div>`;
  }

  // Um toque na grade abre a ficha — a mesma para quem já é seu e para quem
  // está à venda. Só o espaço vazio responde ali mesmo, porque não tem ficha
  // para abrir (e toque que não faz nada parece defeito).
  pickItem(kind, id, tile) {
    if (id === 'vazio') {
      sfx.deny();
      this.ui.shakeElement(tile);
      this.ui.toast(t('Esse ainda está sendo feito ✨'));
      return;
    }
    sfx.tap();
    // Onde a grade estava: quem fecha a ficha volta para a mesma fileira.
    this.gridScroll = this.ui.extraScroll();
    this.showItemSheet(kind, id);
  }

  // A linha abaixo do título, na grade de pistas: diz de quem é o ⚡ que
  // aparece nos cantinhos das miniaturas. A grade de unicórnios não tem
  // legenda — quem quiser saber quem é cada um abre a ficha dele.
  trackLegend() {
    return this.character.fast?.length
      ? t('⚡ {nome} corre mais rápido nas pistas marcadas', { nome: this.character.name })
      : this.track.tagline;
  }

  // Escolher unicórnio: uma tela só, com todos à vista. Tocar num retrato já
  // troca o modelo 3D atrás do cartão — sem ficha no meio do caminho e sem
  // confirmar: a escolha é a própria resposta.
  showCharacterPicker() {
    this.fecharViewer();
    this.state = STATE.READY;
    this.screen = 'character';
    this.ui.showPause(false);
    this.ui.setWallet(this.wallet, true);

    this.ui.showOverlay({
      picker: true,
      hint: true,
      title: t('Quem vai correr?'),
      html: this.gridHtml('character'),
      scroll: this.gridScrollOrNull(),
      buttons: [{ label: t('✅ Pronto'), huge: true, onClick: () => this.showHome() }],
      back: () => this.showHome(),
    });
    this.ui.bindExtra((id, tile) => this.pickItem('character', id, tile));
  }

  // A ficha de um unicórnio ou de uma pista. É a mesma tela nos dois casos —
  // o que muda é o botão embaixo:
  //
  //   já é seu ............ ✅ Escolher esse
  //   à venda, tem chaves .. 🔑 Trocar N chaves
  //   à venda, faltam ...... 🗺️ Buscar chaves (leva para onde elas nascem)
  //
  // É um momento, não um menu: retrato grande, a historinha inteira e um só
  // botão — que é onde a criança lê quem é aquele antes de escolher.
  showItemSheet(kind, id) {
    this.fecharViewer();
    const loja = this.shopOf(kind);
    const item = loja.obter(id);
    if (!item) return loja.voltar();

    this.state = STATE.READY;
    this.screen = 'sheet';
    this.ui.showPause(false);

    const meu = this.isOwned(kind, id);
    // Enquanto não for conquistado, ele é um mistério: nem nome, nem
    // história, nem poder, nem as pistas dele. É o que a história pede — na
    // página do livro ninguém sabe quem mora na torre.
    const oculto = !meu && !!item.earned;
    const preco = loja.preco(item);
    const tenho = this.wallet;
    const falta = preco - tenho;
    this.ui.setWallet(tenho, !meu);
    if (!oculto) speak(item.name);

    // Quem se conquista não tem botão de compra: tem o que falta fazer.
    const botao = !meu && item.earned
      ? {
        label: t('🏆 Liberte todos os amigos'),
        hint: t(this.missingFriends === 1
          ? 'falta 1 unicórnio para descobrir quem é'
          : 'faltam {n} unicórnios para descobrir quem é', { n: this.missingFriends }),
        huge: true,
        onClick: () => loja.voltar(),
      }
      : meu
      ? {
        label: t('✅ Escolher esse'),
        hint: item.id === loja.atual().id ? t('já é o escolhido') : loja.chamada(item),
        huge: true,
        onClick: () => { loja.aplicar(id); loja.voltar(); },
      }
      : falta > 0
        ? {
          label: t('🗺️ Buscar chaves'),
          hint: t(falta === 1
            ? 'ainda falta {n} · as chaves aparecem nas Fases'
            : 'ainda faltam {n} · as chaves aparecem nas Fases', { n: falta }),
          huge: true,
          onClick: () => this.goFindKeys(),
        }
        : {
          label: t('🔑 Trocar {preco} chaves', { preco }),
          hint: loja.chamada(item),
          huge: true,
          onClick: () => this.buyItem(kind, id),
        };

    // A característica especial dele. É o que responde "por que escolher
    // este?", então vem antes das pistas rápidas, que são o complemento.
    const poder = !oculto && kind === 'character' && item.power
      ? `<b>✨ ${item.power}</b>`
      : '';

    // As pistas em que ele corre mais rápido: é o que diferencia um
    // unicórnio do outro além da cor, então aparece na ficha.
    // (O parâmetro se chamava `t` e sombreava a função de tradução — foi por
    // isso que esta frase ficou em português no jogo em inglês.)
    // Na ficha da pista, o contrário: quem corre mais rápido **nela**. É a
    // mesma informação vista do outro lado, e é o que responde "por que
    // comprar esta?" — sem ela a pista era só uma paisagem.
    //
    // O Eco fica de fora enquanto for mistério: ele corre rápido na Bruma e
    // no Vilarejo, e o nome dele ali entregaria que existe um 22º.
    const rapidasDaPista = kind === 'track'
      ? (() => {
        const donos = CHARACTER_LIST.filter((c) => c.fast?.includes(item.id))
          .filter((c) => !c.earned || this.isOwned('character', c.id));
        if (!donos.length) return '';
        const nomes = donos.map((c) => `<b>${c.emoji} ${c.name}</b>`);
        const lista = nomes.length > 1
          ? t('{primeiras} e {ultima}', {
            primeiras: nomes.slice(0, -1).join(', '),
            ultima: nomes[nomes.length - 1],
          })
          : nomes[0];
        return t('⚡ Correm mais rápido aqui: {unicornios}', { unicornios: lista });
      })()
      : '';

    const rapidas = !oculto && kind === 'character' && item.fast?.length
      ? (() => {
        const nomes = item.fast.map((pista) =>
          `<b>${TRACKS[pista]?.emoji || ''} ${TRACKS[pista]?.name || pista}</b>`);
        const lista = nomes.length > 1
          ? t('{primeiras} e {ultima}', {
            primeiras: nomes.slice(0, -1).join(', '),
            ultima: nomes[nomes.length - 1],
          })
          : nomes[0];
        return t('⚡ Corre mais rápido em {pistas}', { pistas: lista });
      })()
      : '';

    // O preço só aparece em quem ainda não é seu; na pista, o lugar dele é a
    // música, que é o outro jeito de reconhecer o cenário.
    const rodape = meu
      ? (kind === 'track' ? `<p class="shop-note">🎵 ${music.themeName(item.id)}</p>` : '')
      : item.earned
        ? `<p class="shop-price falta">${t('Ele não se compra: aparece quando <b>todos os amigos estiverem livres</b>')}</p>`
        : `<p class="shop-price${falta > 0 ? ' falta' : ''}">`
          + `${t('Custa <b>🔑 {preco}</b> · você tem <b>🔑 {tenho}</b>', { preco, tenho })}</p>`;

    // Ver de perto e girar: uma etiquetinha no canto do retrato, e não um
    // botão na fileira de baixo — ali embaixo mora a decisão da tela
    // (comprar, escolher, buscar chaves), e um segundo botão grande do lado
    // disputaria com ela. Não aparece para o mistério: o Eco não pode ser
    // examinado antes de ser encontrado.
    const ver3d = kind === 'character' && !oculto
      ? `<button class="ver3d" data-pick="ver3d" title="${t('Ver em 3D')}">🧊 3D</button>`
      : '';

    // Ouvir, para quem ainda não lê. Dois botões, porque são duas coisas
    // diferentes: quem é ele (a história) e o que ele faz (o poder e as
    // pistas). Quem já sabe a história e quer só saber o poder não precisa
    // ouvir tudo de novo.
    //
    // Só aparecem com a voz ligada — sem ela o botão não faria nada, e um
    // botão que não faz nada é pior que nenhum.
    //
    // A voz lê texto, não figurinha: sem tirar os emoji, o "⭐" no meio de
    // "as estrelas ⭐ valem o dobro" vira "estrela branca média" em alguns
    // aparelhos, no meio da frase.
    const semEmoji = (texto) => String(texto)
      .replace(/<[^>]*>/g, '')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    const falaHistoria = semEmoji([
      oculto ? t('Ninguém sabe quem é.') : `${item.name}.`,
      !oculto && loja.subtitulo(item) ? `${loja.subtitulo(item)}.` : '',
      oculto ? t('Dizem que alguém espera na torre da neblina.') : loja.descricao(item),
    ].filter(Boolean).join(' '));

    const falaPoder = semEmoji([
      !oculto && kind === 'character' && item.power ? `${item.power}.` : '',
      rapidas || rapidasDaPista,
    ].filter(Boolean).join(' '));

    const botaoOuvir = (qual) => `<button class="ouvir" data-pick="${qual}" title="${t('Ouvir')}">🔊</button>`;
    const ouvir = speechOn() ? botaoOuvir('ouvir') : '';
    const ouvirPoder = speechOn() && falaPoder ? botaoOuvir('ouvir-poder') : '';

    this.ui.showOverlay({
      picker: true,
      title: oculto ? '❓ ???' : `${item.emoji} ${item.name}`,
      html: `
        <div class="shop">
          <span class="shop-retrato">
            <img class="shop-face${oculto ? ' sombra' : ''}" src="${loja.retratos()[item.id]}" alt="" />
            ${ver3d}
          </span>
          ${!oculto && loja.subtitulo(item) ? `<p class="shop-title">${loja.subtitulo(item)}</p>` : ''}
          <p class="shop-story">${ouvir}${oculto
            ? t('Ninguém sabe quem é. Dizem que alguém espera na torre da neblina, e que só aparece no dia em que o último amigo sair de trás da porta dele.')
            : loja.descricao(item)}</p>
          ${poder ? `<p class="shop-power">${ouvirPoder}${poder}</p>` : ''}
          ${rapidas || rapidasDaPista
            ? `<p class="shop-fast">${poder ? '' : ouvirPoder}${rapidas || rapidasDaPista}</p>`
            : ''}
          ${rodape}
        </div>
      `,
      buttons: [botao],
      back: () => loja.voltar(),
    });

    this.ui.bindExtra((qual) => {
      if (qual === 'ver3d') { sfx.tap(); this.showItemViewer(kind, id); }
      if (qual === 'ouvir') { sfx.tap(); speak(falaHistoria); }
      if (qual === 'ouvir-poder') { sfx.tap(); speak(falaPoder); }
    });
  }

  // O unicórnio de perto, girando com o dedo.
  //
  // O retrato da ficha é sempre o mesmo perfil; aqui dá para ver o outro
  // lado da crina, a marca da anca e as asas por trás.
  showItemViewer(kind, id) {
    const loja = this.shopOf(kind);
    const item = loja.obter(id);
    if (!item || kind !== 'character') return this.showItemSheet(kind, id);

    this.fecharViewer();
    this.state = STATE.READY;
    this.screen = 'viewer';
    this.ui.showPause(false);

    const voltar = () => this.showItemSheet(kind, id);

    this.ui.showOverlay({
      picker: true,
      title: `${item.emoji} ${item.name}`,
      html: '<div class="viewer-vaga"></div>'
        + `<p class="viewer-dica">${t('gire com o dedo ou o mouse')}</p>`,
      buttons: [{ label: t('⬅️ Voltar'), huge: true, onClick: voltar }],
      back: voltar,
    });

    // A tela 3D não cabe no `html` do cartão (é um <canvas> vivo, não texto),
    // então entra depois, na vaga deixada acima.
    const vaga = document.querySelector('#overlay-extra .viewer-vaga');
    if (!vaga) return;
    this.viewer = createViewer3d(item, {
      altura: Math.max(200, Math.min(340, Math.round(innerHeight * 0.4))),
    });
    vaga.appendChild(this.viewer.dom);
  }

  // Sem isto cada abertura deixaria um contexto WebGL para trás — e o
  // navegador, ao estourar o limite, descarta os antigos, inclusive o do
  // jogo que está rodando atrás do cartão.
  fecharViewer() {
    this.viewer?.dispose();
    this.viewer = null;
  }

  // Quantos unicórnios ainda faltam libertar (para a ficha do Eco).
  get missingFriends() {
    return CHARACTER_LIST.filter((c) => !c.earned && !this.isOwned('character', c.id)).length;
  }

  // Faltou chave: em vez de um beco sem saída, leva direto para onde elas
  // nascem.
  goFindKeys() {
    this.mode = MODES.levels;
    update((save) => { save.choices.mode = 'levels'; });
    this.showLevels();
  }

  buyItem(kind, id) {
    const loja = this.shopOf(kind);
    const item = loja.obter(id);
    const preco = loja.preco(item);
    // Guardado *antes* da compra: é o que diz se foi esta que libertou o
    // último amigo.
    const faltavaAlguem = !this.storyEndUnlocked;
    // Confere de novo na hora de debitar: a tela pode ter ficado aberta.
    if (!item || this.isOwned(kind, id) || this.wallet < preco) {
      sfx.deny();
      return this.showItemSheet(kind, id);
    }

    update((save) => {
      save.stats.keys = (save.stats.keys || 0) - preco;
      save.shop[loja.guardados] = [...(save.shop[loja.guardados] || []), id];
    });
    this.ui.setWallet(this.wallet, true);

    // Festa: o que foi comprado já entra em cena, atrás do portal que abre.
    loja.aplicar(id);
    this.world.burst(this.unicorn.position.clone().setY(1.6), COLORS.star);
    // Esta compra fechou o elenco? Então a história ganhou o fim, e ele se
    // conta sozinho: o livro abre na página nova assim que o portal deste
    // fechar, e o Eco aparece quando o livro fechar.
    const fechouOElenco = faltavaAlguem && this.storyEndUnlocked;

    this.revealUnlock(kind, item, () => {
      this.ui.toast(`${item.emoji} ${t('{nome} é sua!', { nome: item.name })}`);
      if (!fechouOElenco) return loja.voltar();
      this.aposLivro = () => this.revealEco();
      return this.showStory(this.storyBook.length - STORY_END.length);
    });
  }

  // O Eco chegando: o mesmo portal das outras conquistas, mas com confete —
  // é o último unicórnio do jogo, e o fim da história.
  revealEco() {
    const eco = CHARACTER_LIST.find((c) => c.earned);
    if (!eco) return this.showHome();
    // Já escolhido antes de o portal abrir: quando ele fechar, é o Eco que
    // está na pista.
    this.setCharacter(eco.id);
    this.ui.confetti();
    return this.revealUnlock('character', eco, () => {
      this.ui.toast(`${eco.emoji} ${t('{nome} veio correr com você!', { nome: eco.name })}`);
      this.showHome();
    });
  }

  // O portal se abrindo.
  //
  // Trocar chaves por um unicórnio ou uma pista é a maior conquista do jogo
  // — custa dezenas de corridas —, e antes disso era só um aviso passando na
  // tela. Agora é o portal do livro da história (a página "O segredo do
  // arco-íris") abrindo de verdade: o cadeado cede, as portas giram e lá
  // dentro está quem estava trancado, saindo do escuro para a cor.
  //
  // O desenho é todo CSS por cima do retrato que a grade já usa (ver
  // #reveal no style.css); aqui só se monta o quadro e se marca o tempo.
  revealUnlock(kind, item, aoFim) {
    const loja = this.shopOf(kind);
    const camada = document.getElementById('reveal');
    if (!camada) return aoFim();

    this.screen = 'reveal';
    this.ui.hideOverlay();

    // As faíscas saem do meio para fora, uma por direção.
    const faiscas = Array.from({ length: 10 }, (_, i) => {
      const angulo = (Math.PI * 2 * i) / 10 + 0.3;
      const raio = 120 + (i % 3) * 34;
      const atraso = 1.35 + (i % 5) * 0.05;
      return `<img class="portal-faisca" src="${iconUrl('✨')}" alt="" aria-hidden="true"`
        + ` style="--fx:${(Math.cos(angulo) * raio).toFixed(0)}px;`
        + `--fy:${(Math.sin(angulo) * raio).toFixed(0)}px;animation-delay:${atraso}s" />`;
    }).join('');

    camada.innerHTML = `
      <div class="portal">
        <div class="portal-arco"></div>
        <div class="portal-vao">
          <img class="portal-retrato${kind === 'track' ? ' lugar' : ''}" src="${loja.retratos()[item.id]}" alt="" />
          <div class="portal-luz"></div>
          <div class="portal-porta esq"></div>
          <div class="portal-porta dir"></div>
        </div>
        <div class="portal-selo">${withIcons(item.emoji)}</div>
        <svg class="portal-cadeado" viewBox="0 0 60 76" aria-hidden="true">
          <path class="cadeado-haste" d="M18 34 V22 a12 12 0 0 1 24 0 v12"
                fill="none" stroke="#e9a81c" stroke-width="8" stroke-linecap="round"/>
          <rect x="6" y="32" width="48" height="40" rx="9" fill="#ffd166" stroke="#c98f10" stroke-width="2.5"/>
          <circle cx="30" cy="48" r="6" fill="#a8760c"/>
          <path d="M30 52 l-3.5 12 h7 Z" fill="#a8760c"/>
        </svg>
        ${faiscas}
      </div>
      <p class="portal-nome">${withIcons(item.name)}<small>${loja.chamada(item)}</small></p>
    `;
    camada.hidden = false;
    camada.classList.remove('saindo');

    // O som acompanha o desenho: a chave girando quando o cadeado cede, a
    // fanfarra quando o retrato aparece.
    const chave = setTimeout(() => sfx.key(), 800);      // o cadeado cede
    const fanfarra = setTimeout(() => sfx.win(), 1450);   // o retrato aparece
    const fala = setTimeout(() => speak(t('{nome} é sua!', { nome: item.name })), 2100);

    // Sai sozinho, ou no primeiro toque de quem já viu (e vai ver de novo a
    // cada compra — impaciência aqui é justa).
    let fechado = false;
    const fechar = () => {
      if (fechado) return;
      fechado = true;
      clearTimeout(chave);
      clearTimeout(fanfarra);
      clearTimeout(fala);
      clearTimeout(sozinho);
      camada.removeEventListener('click', fechar);
      removeEventListener('keydown', fechar);
      camada.classList.add('saindo');
      setTimeout(() => {
        camada.hidden = true;
        camada.innerHTML = '';
        camada.classList.remove('saindo');
        aoFim();
      }, 350);
    };
    const sozinho = setTimeout(fechar, REVEAL_TIME);
    // Um respiro antes de aceitar toque: senão o dedo que apertou "Trocar"
    // fecha o portal antes de ele abrir.
    setTimeout(() => {
      camada.addEventListener('click', fechar);
      addEventListener('keydown', fechar);
    }, 500);
  }

  // Escolher pista: a mesma tela da escolha de unicórnio, com o mesmo gesto
  // e a mesma grade. Repetir o padrão importa: a criança aprende uma vez e
  // usa nas duas.
  showTrackPicker() {
    this.state = STATE.READY;
    this.screen = 'track';
    this.ui.showPause(false);
    this.ui.setWallet(this.wallet, true);

    this.ui.showOverlay({
      picker: true,
      hint: true,
      title: t('Por onde vamos?'),
      // A legenda vai no `text`, que fica acima da grade e fora da área que
      // rola: embaixo de 15 miniaturas ela nunca seria lida.
      text: this.trackLegend(),
      html: this.gridHtml('track'),
      scroll: this.gridScrollOrNull(),
      buttons: [{ label: t('✅ Pronto'), huge: true, onClick: () => this.showHome() }],
      back: () => this.showHome(),
    });
    this.ui.bindExtra((id, tile) => this.pickItem('track', id, tile));
  }

  // Instalação: no Android o próprio navegador abre o convite; no iPhone
  // mostramos o passo a passo, porque lá é manual.
  installApp() {
    if (needsManualInstall()) {
      this.ui.showOverlay({
        title: t('📲 Instalar no iPhone'),
        html: `
          <div class="about">
            <p class="about-text">${t('No iPhone a instalação é pelo Safari, em dois toques:')}</p>
            <ol class="install-steps">
              <li>${t('Toque em <b>Compartilhar</b> {icone} na barra de baixo', { icone: '<span aria-hidden="true">􀈂</span>' })}</li>
              <li>${t('Escolha <b>Adicionar à Tela de Início</b>')}</li>
            </ol>
            <p class="about-note">
              Depois disso o jogo abre em tela cheia, com o ícone próprio e
              funciona sem internet.
            </p>
          </div>
        `,
        buttons: [{ label: t('⬅️ Voltar'), onClick: () => this.showGrownUps() }],
      });
      return;
    }

    promptInstall().then(() => this.showGrownUps());
  }

  // As duas últimas páginas do livro — a resposta de "quem trancou?" — só
  // existem quando **todos os unicórnios estiverem livres**. É a própria
  // história que pede isso: o Eco só sente alegria quando não sobrou nenhum
  // amigo trancado.
  //
  // As pistas não entram na conta de propósito: elas são lugares, não
  // amigos. Quem já libertou os 21 merece o fim do livro mesmo que ainda
  // vá comprar a Caverna depois.
  get storyEndUnlocked() {
    // `!c.earned` evita a volta em círculo: o Eco é conquistado *por* esta
    // condição, então ele não pode fazer parte dela.
    return CHARACTER_LIST.filter((c) => !c.earned)
      .every((c) => this.isOwned('character', c.id));
  }

  // Ganhou o fim do livro e ainda não leu: o botão da tela inicial chama.
  get storyEndNew() {
    return this.storyEndUnlocked && !this.save.storyEndSeen;
  }

  get storyBook() {
    return storyPages(this.storyEndUnlocked);
  }

  // ---- O livro da história ---------------------------------------------
  //
  // Por que a Uni corre sozinha atrás de chaves? A resposta é uma história,
  // e ela é contada como livro infantil: uma figura grande em cima, duas ou
  // três frases embaixo, e a página vira com um botão do tamanho da mão de
  // uma criança.
  //
  // Aparece sozinha na primeira vez que o jogo abre, e depois fica no botão
  // 📖 da tela inicial — para reler quantas vezes quiser.

  showStory(pagina = 0) {
    this.state = STATE.READY;
    this.screen = 'story';
    const livro = this.storyBook;
    this.storyPage = Math.min(Math.max(0, pagina), livro.length - 1);
    const indice = this.storyPage;
    const folha = livro[indice];
    const ultima = indice === livro.length - 1;
    this.ui.showPause(false);
    // O livro tem a música dele — mais lenta e mais quieta que a da pista,
    // porque aqui se lê (ou se ouve ler). Volta a da pista ao fechar.
    music.play(music.STORY_THEME);

    // As bolinhas embaixo: quantas páginas o livro tem e em qual estamos.
    // Também são botões — dá para pular direto para uma página.
    const bolinhas = livro.map((p, i) => (
      `<button class="page-dot${i === indice ? ' agora' : ''}${i < indice ? ' lida' : ''}"`
      + ` data-pick="ir:${i}" aria-label="${t('Página {n}', { n: i + 1 })}"`
      + ` aria-current="${i === indice}"></button>`
    )).join('');

    this.ui.showOverlay({
      book: true,
      wide: true,
      html: `
        <div class="book">
          <div class="book-art"${ultima ? '' : ' data-pick="proxima"'}>
            <img class="book-img" src="${folha.image}" alt="" draggable="false" />
            ${ultima ? '' : `<button class="book-skip" data-pick="pular">${t('Pular')}</button>`}
          </div>
          <div class="book-page">
            <h2 class="book-title">${folha.title}</h2>
            <p class="book-text">${folha.text}</p>
          </div>
          <div class="book-nav">
            <button class="page-arrow" data-pick="anterior"
                    ${indice === 0 ? 'disabled' : ''} aria-label="Página anterior">⬅️</button>
            <span class="page-dots">${bolinhas}</span>
            <button class="page-arrow" data-pick="proxima"
                    ${ultima ? 'disabled' : ''} aria-label="Próxima página">➡️</button>
          </div>
        </div>
      `,
      buttons: [ultima
        ? { label: t('▶️ VAMOS!'), huge: true, onClick: () => this.closeStory() }
        : { label: t('Virar a página'), huge: true, onClick: () => this.turnPage(1) }],
      back: () => this.closeStory(),
    });
    this.ui.bindExtra((valor) => {
      if (valor === 'proxima') return this.turnPage(1);
      if (valor === 'anterior') return this.turnPage(-1);
      if (valor === 'pular') return this.skipStory();
      const [tipo, numero] = valor.split(':');
      if (tipo === 'ir') return this.goToPage(Number(numero));
      return undefined;
    });

    // Faltou o arquivo da ilustração (deploy pela metade, cache estragado)?
    // A página cai no desenho em SVG que mora no próprio story.js, em vez de
    // ficar um buraco no meio do livro.
    const figura = document.querySelector('.book-img');
    figura?.addEventListener('error', () => {
      const moldura = figura.closest('.book-art');
      figura.remove();
      moldura?.insertAdjacentHTML('afterbegin', folha.art());
    }, { once: true });

    // A próxima página já vai chegando: a virada fica instantânea, sem o
    // quadro em branco enquanto a imagem baixa.
    if (!ultima) new Image().src = livro[indice + 1].image;

    // Para quem ainda não lê: a voz do aparelho conta a página em voz alta.
    speak(`${folha.title}. ${folha.text}`);
  }

  turnPage(dir) {
    const proxima = this.storyPage + dir;
    // Bateu na capa ou na contracapa: chacoalha em vez de não fazer nada.
    if (proxima < 0 || proxima >= this.storyBook.length) {
      sfx.deny();
      this.ui.shakeElement(document.querySelector('.book'));
      return;
    }
    sfx.pick();
    this.showStory(proxima);
  }

  goToPage(numero) {
    if (numero === this.storyPage) { sfx.tap(); return; }
    sfx.pick();
    this.showStory(numero);
  }

  // "Pular": para o adulto que já conhece a história, ou para a criança que
  // só quer correr. Vale o mesmo que ler até o fim — a história não volta a
  // aparecer sozinha, e o botão 📖 continua ali para quem mudar de ideia.
  skipStory() {
    sfx.tap();
    this.closeStory();
  }

  // Fechar o livro é o que marca a história como contada: quem viu até aqui
  // não precisa vê-la de novo toda vez que abrir o jogo.
  closeStory() {
    if (!this.save.storySeen) update((save) => { save.storySeen = true; });
    // Leu até a última página do livro completo: o 📖 para de piscar.
    if (this.storyEndUnlocked && this.storyPage >= this.storyBook.length - 1
        && !this.save.storyEndSeen) {
      update((save) => { save.storyEndSeen = true; });
    }
    music.play(this.track.id);      // fechou o livro, volta o tema da pista
    // Alguém combinou o que vem depois do livro (hoje: o portal do Eco,
    // quando a história acabou de ganhar o fim).
    if (this.aposLivro) {
      const seguir = this.aposLivro;
      this.aposLivro = null;
      return seguir();
    }

    // Na primeira vez de todas, entre a história e o menu, o convite para a
    // lição. Só aqui: quem reabre o livro pelo 📖 já conhece o jogo e não
    // precisa ser perguntado de novo.
    if (this.primeiraVez) {
      this.primeiraVez = false;
      return this.inviteTutorial();
    }
    return this.showHome();
  }

  // O convite para o modo Aprender, uma vez só, logo depois da história.
  // Duas saídas do mesmo tamanho de importância: quem quer aprender aprende,
  // quem já sabe vai jogar — ninguém fica preso numa aula que não pediu.
  inviteTutorial() {
    this.state = STATE.READY;
    this.screen = 'invite';
    this.ui.showPause(false);
    this.ui.showOverlay({
      title: t('Quer aprender a correr?'),
      text: t('A Uni mostra os comandos e os poderes numa corrida curtinha — e aqui ninguém perde vida.'),
      buttons: [
        { label: t('👆 Vamos aprender!'), huge: true, onClick: () => this.startTutorial() },
        { label: t('▶️ Já sei jogar'), onClick: () => this.showHome(), secondary: true },
      ],
    });
  }

  // A primeira tela do jogo. Na primeira vez de todas é a história; depois
  // é o menu de sempre.
  // Em que idioma vamos brincar?
  //
  // Aparece sozinha na primeira abertura, antes da história — a história é
  // a primeira coisa que a criança lê, e não dá para contá-la no idioma
  // errado. Depois disso mora no botão 🌍 do menu.
  //
  // Os dois botões são escritos **cada um no seu idioma**, com a bandeira:
  // é a única tela do jogo que não pode depender de o leitor entender o
  // idioma em que ela está.
  showLanguagePicker({ primeira = false, voltarPara = 'home' } = {}) {
    this.state = STATE.READY;
    this.screen = 'idioma';
    this.ui.showPause(false);

    const escolher = (id) => {
      const seguir = () => (primeira ? this.showVoiceInvite()
        : voltarPara === 'grown' ? this.showGrownUps() : this.showHome());
      if (id === idioma()) return seguir();

      // Trocar de idioma "recarrega" o jogo.
      //
      // A tela de carregamento volta por um instante e o jogo reaparece no
      // idioma novo. Não é enfeite: a troca reescreve os nomes dos 22
      // unicórnios, das 15 pistas e todos os textos de uma vez, e sem uma
      // cortina por cima isso acontece à vista, item por item. Com ela, a
      // criança vê o jogo "começar de novo" — que é exatamente o que
      // aconteceu, do ponto de vista dela.
      //
      // É de mentira de propósito: um `location.reload()` de verdade daria o
      // mesmo efeito, mas jogaria fora o service worker já aquecido e faria
      // o jogo baixar tudo outra vez em quem está no 3G.
      const cortina = document.getElementById('loading');
      cortina?.classList.remove('pronto');

      setTimeout(() => {
        setIdioma(id);
        this.save = getSave();
        // Remonta tudo: os nomes já saem no idioma novo.
        this.render();
        seguir();
        // Um quadro depois, para a tela nova estar pintada antes de a
        // cortina começar a abrir — senão dá para ver o menu antigo por
        // baixo, no meio da transição.
        requestAnimationFrame(() => cortina?.classList.add('pronto'));
      }, 620);
    };

    const sugerido = this.save.idioma || idiomaSugerido();
    this.ui.showOverlay({
      title: t('🌍 Idioma · Language'),
      buttons: Object.values(IDIOMAS).map((lang) => ({
        label: `${lang.bandeira} ${lang.nome}`,
        huge: true,
        secondary: lang.id !== sugerido,
        onClick: () => escolher(lang.id),
      })),
      back: primeira ? null : () => (voltarPara === 'grown' ? this.showGrownUps() : this.showHome()),
    });
  }

  // O convite para a leitura em voz alta, uma vez só, logo depois de
  // escolher o idioma na primeira abertura — e antes da história, para que
  // ela mesma já possa sair falada, para quem ainda não lê.
  //
  // Onde o aparelho não tem voz nenhuma (`canSpeak` falso) não há o que
  // perguntar: direto para a história.
  showVoiceInvite() {
    if (!canSpeak()) return this.showStory(0);
    this.state = STATE.READY;
    this.screen = 'voz-convite';
    this.ui.showPause(false);

    const escolher = (ligar) => {
      const ligado = setSpeech(ligar);
      update((save) => { save.speech = ligado; });
      if (ligado) speak(t('Pronto, agora eu falo'));
      this.showStory(0);
    };

    this.ui.showOverlay({
      title: t('🔊 Quer que eu leia os textos em voz alta?'),
      text: t('É bom para quem ainda não lê. Dá para trocar isso depois, na coroa 👑, no cantinho dos adultos.'),
      buttons: [
        { label: t('🔊 Sim, por favor'), huge: true, onClick: () => escolher(true) },
        { label: t('🔈 Não, obrigada'), onClick: () => escolher(false), secondary: true },
      ],
    });
  }

  showFirstScreen() {
    // Guardado antes de a história marcar `storySeen`: é o que diferencia
    // "abriu o jogo pela primeira vez" de "reabriu a história pelo 📖".
    this.primeiraVez = !this.save.storySeen;
    // Idioma primeiro: sem ele a história sairia no idioma que o aparelho
    // adivinhou, que pode não ser o da casa.
    if (!this.save.idioma) return this.showLanguagePicker({ primeira: this.primeiraVez });
    return this.primeiraVez ? this.showStory(0) : this.showHome();
  }

  // Cartão "sobre": quem fez, com o quê, e os links.
  showAbout() {
    this.state = STATE.READY;
    this.screen = 'about';
    this.ui.showPause(false);
    this.ui.showOverlay({
      title: t('Sobre o jogo'),
      html: `
        <div class="about">
          <img class="about-logo" src="./assets/icons/icon-192.png" alt="" width="84" height="84" />
          <p class="about-text">${t('<b>UnicornRush</b> é um joguinho de corrida para crianças, feito em 3D com <b>three.js</b> — todos os unicórnios, pistas e enfeites são desenhados por código, sem nenhuma imagem pronta.')}</p>
          <p class="about-text">${t('Criado por <b>Adriano Maringolo</b>')}</p>
          <div class="about-links">
            <a class="about-link" href="https://adrianomaringolo.dev" target="_blank" rel="noopener">
              🌐 adrianomaringolo.dev
            </a>
            <a class="about-link" href="https://github.com/adrianomaringolo" target="_blank" rel="noopener">
              🐙 github.com/adrianomaringolo
            </a>
            <a class="about-link" href="https://github.com/adrianomaringolo/unicorn-rush" target="_blank" rel="noopener">
              🦄 ${t('código do jogo')}
            </a>
          </div>
          <p class="about-version">${t('versão {v}', { v: VERSION })}</p>
          <p class="about-note">${t('Feito com three.js · fonte Fredoka (SIL Open Font License) · ícones Fluent Emoji, da Microsoft (MIT)')}</p>
        </div>
      `,
      buttons: [
        // O botão de atualizar mora aqui, ao lado da versão: é onde já se
        // olha para saber o que está instalado.
        ...(hasUpdate() ? [{
          label: t('🔄 Atualizar o jogo'),
          hint: t('tem versão nova esperando — o jogo recarrega'),
          huge: true,
          onClick: () => this.applyUpdate(),
        }] : []),
        { label: t('⬅️ Voltar'), onClick: () => this.showHome() },
      ],
    });
  }

  // Troca para a versão nova. O recarregamento acontece quando o service
  // worker novo assume de verdade (ver src/game/update.js).
  applyUpdate() {
    this.ui.toast(t('🔄 Atualizando…'));
    if (!applyUpdate()) this.ui.toast(t('Já está na versão mais nova ✨'));
  }

  // Liga e desliga o modo teste. Recarrega de propósito: ao ligar, para a
  // sessão começar limpa; ao desligar, para jogar fora tudo o que aconteceu
  // durante o teste, que só existia na memória.
  toggleTestMode() {
    const ligado = setTestMode(!isTestMode());
    this.ui.toast(ligado ? t('🧪 Modo teste ligado') : t('🧪 Modo teste desligado'));
    setTimeout(() => location.reload(), 500);
  }

  // Quantas fases já foram concluídas somando todas as pistas.
  levelsDone() {
    return Object.values(this.save.levels)
      .reduce((total, fases) => total + Object.keys(fases.done || {}).length, 0);
  }

  // Tela de estatísticas: tudo o que está guardado no save, em números
  // grandes e barrinhas — dá para ver de longe.
  showStats() {
    this.state = STATE.READY;
    this.screen = 'stats';
    this.ui.showPause(false);
    const { stats } = this.save;

    const tile = (value, label, emoji) =>
      `<div class="stat"><span class="stat-emoji">${emoji}</span>`
      + `<span class="stat-value">${value}</span>`
      + `<span class="stat-label">${label}</span></div>`;

    const bars = (items, counts) => {
      const top = Math.max(1, ...items.map((i) => counts[i.id] || 0));
      return items.map((item) => {
        const value = counts[item.id] || 0;
        return `<div class="stat-row"><span class="stat-row-name">${item.emoji} ${item.name}</span>`
          + `<span class="stat-bar"><i style="width:${Math.round((value / top) * 100)}%"></i></span>`
          + `<span class="stat-row-value">${value}</span></div>`;
      }).join('');
    };

    const html = `
      <div class="stats-grid">
        ${tile(stats.wins, t('vitórias'), '🏆')}
        ${tile(this.save.babyLevel, t('nível · meta {meta}', { meta: this.goalFor(MODES.baby) }), '🍼')}
        ${tile(stats.runs, t('corridas'), '🏃')}
        ${tile(stats.hearts, t('corações'), '💗')}
        ${tile(stats.items, t('itens pegos'), '✨')}
        ${tile(Math.floor(stats.bests.adventure || 0), t('pontos na aventura'), '🥇')}
        ${tile(stats.keys || 0, t('chaves mágicas'), '🔑')}
        ${tile(Math.floor(Math.max(0, ...Object.values(stats.distances || { x: 0 }))), t('maior distância'), '🏁')}
        ${tile(`${this.levelsDone()}/${LEVEL_COUNT * TRACK_LIST.length}`, t('fases feitas'), '🗺️')}
      </div>
      <p class="stats-title">${t('Corridas em cada pista')}</p>
      <div class="stats-rows">${bars(TRACK_LIST, stats.plays)}</div>
      <p class="stats-title">${t('Corridas com cada unicórnio')}</p>
      <div class="stats-rows">${bars(CHARACTER_LIST, stats.chars)}</div>
      <p class="stats-title">${t('Power-ups pegos')}</p>
      <div class="stats-rows">${bars(POWERUP_LIST, stats.powers)}</div>
    `;

    this.ui.showOverlay({
      title: t('📊 Estatísticas'),
      html,
      buttons: [
        { label: t('⬅️ Voltar'), onClick: () => this.showHome() },
      ],
    });
  }

  // Evoluir os power-ups: para onde as chaves continuam servindo depois de
  // já ter todo mundo — todos os unicórnios, todas as pistas. Cada um tem o
  // próprio nível, guardado em `save.powerLevels`, e não tem teto: sempre
  // existe o próximo, custando mais um pouco (ver POWER_LEVEL_PERCENT e
  // `powerLevelCost` em models/powerups.js).
  //
  // A Vida extra fica de fora: não dura (o efeito é na hora, e já é só um
  // reforço — devolve uma vida ou vira ponto) e não tem um "mais forte" que
  // não distorça o jogo, diferente dos outros cinco.
  //
  // Uma lista, como o cantinho dos adultos — aqui não se joga, se evolui —,
  // mas fica no hub, não atrás da coroa: gastar chave é brincadeira da
  // criança, não ajuste de adulto.
  showPowerShop() {
    this.state = STATE.READY;
    this.screen = 'powers';
    this.ui.showPause(false);
    this.ui.setWallet(this.wallet, true);

    const linhas = POWERUP_LIST.filter((power) => power.id !== 'life').map((power) => {
      const nivel = this.save.powerLevels?.[power.id] ?? 0;
      const custo = powerLevelCost(nivel);
      // Segundos e linhas, não porcentagem: "dura 9s" é o que uma criança
      // sente na corrida — "+12% de duração" pede conta que ela não faz. A
      // Bomba não dura (o efeito é na hora): o nível soma linhas livres de
      // obstáculo, e só aparece a partir do nível 1 (no zero não há bônus
      // nenhum para mostrar).
      const efeito = power.id === 'bomb'
        ? nivel === 0 ? '' : ` · ${t('+{n} linhas limpas', { n: Math.round(power.graceRowsPerLevel * nivel) })}`
        : ` · ${t('dura {s}s', { s: formatSegundos(power.duration * powerLevelMultiplier(nivel)) })}`;
      return {
        id: power.id,
        icone: power.emoji,
        nome: `${power.name} · ${t('nível {n}', { n: nivel })}${efeito}`,
        valor: `🔑 ${custo}`,
        aviso: this.wallet < custo,
      };
    });

    const html = `<div class="ajustes">${linhas.map((l) => `
      <button class="ajuste${l.aviso ? ' aviso' : ''}" data-pick="${l.id}">
        <span class="ajuste-icone">${l.icone}</span>
        <span class="ajuste-nome">${l.nome}</span>
        <span class="ajuste-valor">${l.valor}</span>
      </button>`).join('')}</div>`;

    this.ui.showOverlay({
      title: t('⬆️ Evoluir poderes'),
      text: t('Cada nível deixa o power-up mais forte para sempre — e sempre existe o próximo.'),
      html,
      buttons: [{ label: t('⬅️ Voltar'), onClick: () => this.showHome() }],
      back: () => this.showHome(),
    });
    this.ui.bindExtra((qual, el) => this.levelUpPower(qual, el));
  }

  // Toca em um power-up na tela de evoluir: sobe de nível se der, ou avisa
  // que faltam chaves — mesma resposta do resto do jogo para um toque que
  // não pode fazer o que pediu (a fase trancada, o item sem chave: "toque
  // que não faz nada parece defeito").
  levelUpPower(id, el) {
    if (!POWERUPS[id]) return;
    const nivel = this.save.powerLevels?.[id] ?? 0;
    const custo = powerLevelCost(nivel);
    if (this.wallet < custo) {
      sfx.deny();
      this.ui.shakeElement(el);
      this.ui.toast(t('🔑 Faltam {n} chaves', { n: custo - this.wallet }));
      return;
    }

    sfx.power();
    update((save) => {
      save.stats.keys = (save.stats.keys || 0) - custo;
      save.powerLevels = { ...(save.powerLevels || {}), [id]: nivel + 1 };
    });
    this.save = getSave();
    this.world.burst(this.unicorn.position.clone().setY(1.4), POWERUPS[id].color);
    this.ui.toast(`${POWERUPS[id].emoji} ${t('Subiu de nível!')}`);
    this.showPowerShop();
  }

  // Pausa: congela a pista e abre as opções. Volta com o mesmo botão, com
  // Esc/P ou tocando em "Continuar".
  togglePause() {
    if (this.state === STATE.PAUSED) { this.resume(); return; }
    // Pausar no meio da contagem deixaria os tempos dela rodando por trás
    // do cartão, e a corrida largaria sozinha.
    if (this.state !== STATE.PLAYING || this.contando) return;
    this.pause();
  }

  pause() {
    this.state = STATE.PAUSED;
    this.ui.showPause(false);
    const naFase = this.mode.id === 'levels';
    this.ui.showOverlay({
      title: t('Pausa ⏸️'),
      text: naFase
        ? t('Fase {n} · 🔑 {tem}/{precisa}', { n: this.level, tem: this.keys, precisa: this.mode.keys })
        : `${this.track.emoji} ${this.track.name} · ${this.character.emoji} ${this.character.name}`,
      buttons: [
        { label: t('▶️ Continuar'), onClick: () => this.resume() },
        {
          label: t('🔁 Começar de novo'),
          onClick: () => (naFase ? this.startLevel(this.level) : this.start(this.mode.id)),
          secondary: true,
        },
        { label: t('🏠 Sair para o menu'), onClick: () => this.showHome(), secondary: true },
      ],
    });
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    this.ui.showRush(this.isFastHere(), this.rush);
    this.clock.getDelta();       // descarta o tempo parado

    // Volta com contagem, como a largada. Quem pausou para atender alguém
    // larga de novo com a pista já andando e um obstáculo em cima — a
    // contagem devolve o mesmo instante de se preparar que a corrida teve
    // no começo.
    this.largar(() => this.ui.showPause(true));
  }

  start(modeId = this.mode.id, difficultyId = this.difficulty.id) {
    sfx.resume();
    music.play(this.track.id);
    this.difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES[DEFAULT_DIFFICULTY];
    this.mode = modeId === 'tutorial' ? TUTORIAL_MODE
      : modeId === 'adventure' ? this.adventureMode(this.difficulty)
        : MODES[modeId] || MODES[DEFAULT_MODE];
    // A lição não entra nas contas: não é uma corrida, e ver "1 corrida" só
    // por ter aberto o tutorial confunde quem olha as estatísticas.
    if (this.mode.id !== 'tutorial') {
      update((save) => {
        save.choices.mode = this.mode.id;
        save.choices.difficulty = this.difficulty.id;
        save.stats.runs += 1;
        save.stats.plays[this.track.id] = (save.stats.plays[this.track.id] || 0) + 1;
        save.stats.chars[this.character.id] = (save.stats.chars[this.character.id] || 0) + 1;
      });
    }
    this.reset();
    this.world.placeStart();     // o portal de partida, em toda corrida
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    // O ⚡ só aparece se este unicórnio for rápido nesta pista.
    this.rush = false;
    this.rushLook = 0;
    this.ui.showRush(this.isFastHere(), false);

    this.largar(() => {
      this.ui.showPause(true);
      // A lição começa aqui: a aula do ⚡ só entra se o botão existir nesta
      // combinação de unicórnio e pista.
      if (this.mode.scripted) {
        this.lessons = lessonsFor({ rapido: this.isFastHere() });
        this.startLesson(0);
      }
    });
  }

  // Corta a contagem no meio (voltar ao menu, recomeçar).
  pararContagem() {
    clearTimeout(this.timerContagem);
    this.contando = false;
    this.ui.setCountdown(null);
  }

  // 3, 2, 1, Vai! — antes de toda corrida.
  //
  // A pista já corre devagar por baixo (é o mesmo mundo parado das telas de
  // menu), então a criança vê para onde vai antes de precisar reagir. O que
  // a contagem impede é o movimento: sem ela, quem largava com o dedo já na
  // seta trocava de faixa antes de ver o primeiro obstáculo.
  //
  // O botão de pausa e a lição só entram depois — pausar no meio da contagem
  // deixaria os tempos rodando por trás do cartão.
  largar(aoTerminar) {
    const passos = ['3', '2', '1', t('Vai!')];
    let i = 0;
    this.contando = true;
    clearTimeout(this.timerContagem);

    const passo = () => {
      // Saiu da corrida no meio da contagem (voltou para o menu): abandona.
      if (this.state !== STATE.PLAYING) {
        this.contando = false;
        this.ui.setCountdown(null);
        return;
      }
      const ultimo = i === passos.length - 1;
      this.ui.setCountdown(passos[i]);
      if (ultimo) sfx.vai(); else sfx.contagem();
      i += 1;

      this.timerContagem = setTimeout(() => {
        if (i < passos.length) return passo();
        this.ui.setCountdown(null);
        this.contando = false;
        if (this.state === STATE.PLAYING) aoTerminar?.();
        return undefined;
      }, ultimo ? 420 : 520);
    };

    passo();
  }

  // A lição é sempre com a **Uni no Campo**: é a combinação que todo mundo
  // tem desde o primeiro dia, e é para ela que as aulas foram escritas (a
  // barreira do Campo, o obstáculo do Campo). Com outro unicórnio numa pista
  // comprada, a mesma frase ensinaria outra coisa.
  //
  // A troca vale só para esta corrida — o save não é tocado. Quem estava com
  // a Lua no Oceano a encontra intacta ao voltar, inclusive se fechar o jogo
  // no meio da aula.
  startTutorial() {
    this.tutorialBack = { character: this.character.id, track: this.track.id };
    this.applyForRun(DEFAULT_CHARACTER, DEFAULT_TRACK);
    this.start('tutorial');
  }

  // Troca de unicórnio/pista sem passar pelo save (ao contrário de
  // setCharacter e setTrack, que gravam a escolha da criança).
  applyForRun(characterId, trackId) {
    if (this.character.id !== characterId && CHARACTERS[characterId]) {
      this.character = CHARACTERS[characterId];
      this.buildCharacter();
    }
    if (this.track.id !== trackId && TRACKS[trackId]) {
      this.track = TRACKS[trackId];
      this.buildWorld();
      this.level = Math.min(this.trackLevels().unlocked, LEVEL_COUNT);
    }
  }

  // Devolve o que a criança tinha escolhido antes da lição.
  restoreAfterTutorial() {
    if (!this.tutorialBack) return;
    const { character, track } = this.tutorialBack;
    this.tutorialBack = null;
    this.applyForRun(character, track);
  }

  // ---- A lição do modo Aprender ----------------------------------------
  //
  // A aula que **cobra um movimento** (`acao`) não passa sozinha: a seta fica
  // piscando até a criança fazer, e aí vem o ✅ e o som. Se o que a aula
  // soltou passar sem que ela tenha feito, a aula recomeça do zero — a lição
  // é para aprender, e uma aula pulada não ensinou nada.
  //
  // As aulas de mostrar (os power-ups, a chave) não cobram nada: passam
  // quando o item passa.
  startLesson(indice, tentativa = 0) {
    this.licao = { i: indice, acao: null, feito: false, tentativa };
    const aula = this.lessons[indice];
    if (!aula) return this.finishTutorial();

    this.licao.acao = aula.acao || null;
    this.ui.setLesson(aula.fala);
    this.ui.setLessonProgress(indice, this.lessons.length);
    this.ui.setLessonHint(aula.acao || null);
    this.world.spawnLessonItems(aula);
    // Aulas que mostram algo que normalmente leva muito tempo para acontecer.
    if (aula.mostra === 'chave') {
      this.showHeartsToKey();
      sfx.key();
    }
  }

  // A criança fez o movimento que a aula pedia?
  lessonAction(qual) {
    const l = this.licao;
    if (!l || !l.acao || l.feito) return;
    // 'lado' aceita os dois: o que se ensina ali é sair da frente, e tanto
    // faz para que lado. E 'pular' se dá por satisfeito com o pulo duplo —
    // quem pulou duas vezes pulou.
    const serve = l.acao === 'lado' ? (qual === 'esquerda' || qual === 'direita')
      : l.acao === 'pular' ? (qual === 'pular' || qual === 'pulo-duplo')
        : l.acao === qual;
    if (!serve) return;

    l.feito = true;
    // O som sai já, no toque: é a resposta imediata ao comando. O ✅ fica
    // para quando a aula fecha de verdade — antes ele aparecia no toque e,
    // se a criança batesse logo depois, vinha um "bateu, de novo" logo atrás
    // do certinho verde. Dois sinais opostos em meio segundo.
    sfx.correct();
    this.ui.setLessonHint(null);
  }

  // Bateu no obstáculo da aula. Devolve `true` se isso reprovou a aula.
  lessonMissed() {
    const l = this.licao;
    // A aula do ⚡ não é sobre desviar: bater nela não reprova nada.
    if (!l || !l.acao || l.acao === 'rapido') return false;
    l.feito = false;
    l.bateu = true;
    return true;
  }

  updateLesson() {
    const l = this.licao;
    if (!l) return;
    if (this.world.lessonAhead) return;       // a aula ainda está acontecendo

    // Cobrava movimento e não veio: limpa e repete a mesma aula. A cada
    // tentativa o aviso fica mais explícito — na primeira basta "de novo",
    // mas quem errou três vezes precisa ouvir o que fazer, não um incentivo.
    if (l.acao && !l.feito) {
      this.world.clearLessonItems();
      sfx.deny();
      // Quem bateu já ouviu "bateu!" no toast da trombada; repetir aqui só
      // atrapalha. Quem simplesmente não fez precisa do aviso.
      if (!l.bateu) {
        this.ui.toast(t(l.tentativa >= 2 ? RETRY_HELP[l.acao] : 'Vamos tentar de novo 💗'));
      }
      return this.startLesson(l.i, l.tentativa + 1);
    }

    // Passou de verdade: o ✅ é das aulas que cobravam movimento, o confete
    // é de toda aula vencida — inclusive as de só olhar.
    if (l.acao) this.ui.lessonCheck();
    this.ui.confetti();
    return this.startLesson(l.i + 1);
  }

  finishTutorial() {
    this.state = STATE.OVER;
    this.licao = null;
    this.restoreAfterTutorial();
    this.ui.showPause(false);
    this.ui.setLesson('');
    this.ui.setLessonHint(null);
    this.ui.setLessonProgress(0, 0);
    // A lição não é uma brincadeira escolhida: devolve o modo que estava
    // guardado, senão o hub ficaria mostrando "Aprender" e o botão JOGAR
    // repetiria a aula.
    this.mode = MODES[this.save.choices.mode] || MODES[DEFAULT_MODE];
    sfx.win();
    this.ui.showOverlay({
      title: t('Você aprendeu tudo! 🎉'),
      text: t('Já sabe desviar, pular, pegar as chaves e usar os power-ups. Agora escolha uma brincadeira e corra de verdade.'),
      buttons: [
        { label: t('▶️ Quero correr'), huge: true, onClick: () => this.showHome() },
        { label: t('🔁 Repetir a lição'), onClick: () => this.startTutorial(), secondary: true },
      ],
    });
  }

  endRun({ title, text }) {
    this.state = STATE.OVER;
    this.ui.showPause(false);
    this.saveBest();
    this.ui.setBest(this.best);
    this.ui.showOverlay({
      title,
      text,
      buttons: [
        { label: t('🔁 Jogar de novo'), huge: true, onClick: () => this.start() },
        { label: t('🏠 Início'), onClick: () => this.showHome(), secondary: true },
      ],
    });
  }

  gameOver() {
    sfx.gameOver();

    if (this.mode.id === 'levels') {
      this.state = STATE.OVER;
      this.ui.showPause(false);
      this.saveBest();
      this.ui.showOverlay({
        title: t('Quase!'),
        text: t(this.mode.keys - this.keys === 1
          ? 'Faltou 1 chave na fase {fase}.'
          : 'Faltaram {n} chaves na fase {fase}.',
        { n: this.mode.keys - this.keys, fase: this.level }),
        buttons: [
          { label: t('🔁 Tentar de novo'), onClick: () => this.startLevel(this.level) },
          { label: t('🗺️ Escolher fase'), onClick: () => this.showLevels(), secondary: true },
        ],
      });
      return;
    }

    this.endRun({
      title: t('Fim da corrida!'),
      text: t('{nome} correu {passos} passos, juntou {coracoes} coração(ões) e fez {pontos} pontos.', {
        nome: this.character.name,
        passos: Math.floor(this.distance),
        coracoes: this.hearts,
        pontos: Math.floor(this.score),
      }),
    });
  }

  victory() {
    sfx.star();
    this.world.burst(this.unicorn.position.clone().setY(1.6), COLORS.star);

    const done = this.goal;
    update((save) => {
      save.stats.wins += 1;
      save.babyLevel += 1;      // da próxima vez a meta é maior
    });
    const next = this.goal;

    this.endRun({
      title: t('Você conseguiu! 🎉'),
      text: t('{nome} juntou os {itens} itens da pista mágica!', { nome: this.character.name, itens: done })
        + `<br><span class="muted">${t('Nível {nivel}: a próxima meta é {meta} itens.', { nivel: this.save.babyLevel, meta: next })}</span>`,
    });
  }

  moveLane(dir) {
    // Nas telas de escolha as setas passeiam pelas opções da grade aberta.
    if (this.state === STATE.READY) {
      if (this.screen === 'track') this.cycleTrack(dir);
      else if (this.screen === 'character') this.cycleCharacter(dir);
      else if (this.screen === 'mode') this.cycleMode(dir);
      else if (this.screen === 'story') this.turnPage(dir);
      return;
    }
    if (this.state !== STATE.PLAYING || this.contando) return;
    const antes = this.player.lane;
    this.player.lane = THREE.MathUtils.clamp(this.player.lane + dir, 0, LANES.length - 1);
    // Só conta como movimento se ele realmente saiu do lugar: bater na
    // parede da pista não é ter aprendido a mudar de faixa.
    if (this.player.lane !== antes) this.lessonAction(dir < 0 ? 'esquerda' : 'direita');
  }

  // Pulo duplo: o primeiro sai do chão, o segundo é no ar mesmo — a asa
  // bate de novo. Passou de MAX_JUMPS, só depois de encostar no chão.
  jump() {
    if (this.state !== STATE.PLAYING || this.contando) return;
    if (this.powers.boost > 0) return;      // já está voando
    const p = this.player;
    // `extraJump` é o Cometa, que não sabe parar: pula uma terceira vez.
    if (p.jumps >= MAX_JUMPS + (this.character.extraJump ?? 0)) return;

    const primeiro = p.jumps === 0;
    // `jumpBoost` é o Limão, que é miúdo e elétrico: pula mais alto que os
    // outros, nos dois saltos. A Pena Mágica soma o dela por cima, para
    // quem já pula mais alto continuar pulando mais alto que os outros.
    const impulso = (this.character.jumpBoost ?? 1) * (this.powers.feather > 0 ? POWERUPS.feather.jumpBoost : 1);
    p.vy = (primeiro ? JUMP_VELOCITY : DOUBLE_JUMP_VELOCITY) * impulso;
    p.grounded = false;
    p.jumps += 1;
    // O segundo salto é um comando diferente do primeiro, e a lição precisa
    // saber qual dos dois aconteceu.
    this.lessonAction(p.jumps >= 2 ? 'pulo-duplo' : 'pular');

    if (primeiro) {
      sfx.jump();
      return;
    }
    // O segundo pulo se anuncia: cambalhota, brilho e um som mais agudo.
    p.flip = FLIP_TIME;
    sfx.doubleJump();
    this.world.burst(this.unicorn.position.clone().setY(this.unicorn.position.y + 0.3), COLORS.star);
  }

  // O quanto a corrida já acelerou (0 a 1) — usado para apertar o ritmo.
  get progress() {
    const range = this.mode.maxSpeed - this.mode.startSpeed;
    return range > 0 ? THREE.MathUtils.clamp((this.speed - this.mode.startSpeed) / range, 0, 1) : 0;
  }

  // Modo Desafio montado com a dificuldade escolhida.
  adventureMode(difficulty) {
    const base = MODES.adventure;
    return {
      ...base,
      obstacleChance: difficulty.obstacleChance,
      barrierChance: difficulty.barrierChance,
      startSpeed: difficulty.startSpeed,
      maxSpeed: difficulty.maxSpeed,
      speedRamp: difficulty.speedRamp,
      difficultyId: difficulty.id,
      // O Devagarinho deixa a Bomba Arco-Íris tão comum quanto os outros.
      powerWeights: difficulty.powerWeights,
    };
  }

  updatePlayer(dt) {
    const p = this.player;
    const targetX = LANES[p.lane];
    // `laneGrip` < 1 deixa a troca de faixa preguiçosa e > 1 a deixa ligeira.
    // A pista e o personagem se multiplicam: o chão escorregadio da Geada
    // atrapalha todo mundo, e por cima disso a Cereja é rápida e o Vovô é
    // lento. Sem os campos, tudo vale 1.
    // `steady` é o Floco: chão escorregadio não o atrapalha, então o
    // `laneGrip` da pista não conta para ele.
    const gripPista = this.character.steady ? 1 : (this.track.laneGrip ?? 1);
    const grip = gripPista * (this.character.laneGrip ?? 1);
    p.x += (targetX - p.x) * Math.min(1, LANE_CHANGE_SPEED * grip * dt);

    // `sideWind` é a Tempestade: o vento empurra devagar para um lado e troca
    // de direção de vez em quando, então não dá para simplesmente compensar.
    // Ele mexe na posição, não na faixa escolhida — a criança continua no
    // controle, só tem de segurar o rumo.
    // `windproof` é o Relâmpago: nasceu no raio, o vento não o desvia.
    if (this.track.sideWind && !this.character.windproof) {
      const lado = Math.sin(this.elapsed * 0.22) > 0 ? 1 : -1;
      const empurrao = this.track.sideWind * lado * dt;
      p.x = THREE.MathUtils.clamp(p.x + empurrao, LANES[0] - 0.9, LANES[LANES.length - 1] + 0.9);
    }

    if (this.powers.boost > 0) {
      // Turbo: o unicórnio decola e passa voando por cima de tudo.
      p.grounded = false;
      p.vy = 0;
      p.y += (FLY_HEIGHT - p.y) * Math.min(1, 6 * dt);
    } else if (!p.grounded) {
      // `gravity` da pista é o pulo flutuante do Espaço; `airGlide` do
      // personagem é a Violeta, que é meio feita de fumaça e demora a descer.
      // O da Pena Mágica soma o dela por cima: o pulo não fica só mais alto
      // (isso já é o `jumpBoost` do power-up, no impulso inicial), fica
      // também mais longo — demora mais para voltar ao chão.
      const arGlide = (this.character.airGlide ?? 1) * (this.powers.feather > 0 ? POWERUPS.feather.airGlide : 1);
      p.vy -= GRAVITY * (this.track.gravity ?? 1) * arGlide * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; p.jumps = 0; }
    }

    if (this.powers.shield > 0) p.invulnerable = 0;
    if (p.invulnerable > 0) {
      p.invulnerable -= dt;
      this.setBodyVisible(Math.floor(p.invulnerable * 12) % 2 === 0);
      if (p.invulnerable <= 0) this.setBodyVisible(true);
    }

    // A cambalhota do pulo duplo: uma volta inteira no tempo de FLIP_TIME.
    if (p.flip > 0) {
      p.flip = Math.max(0, p.flip - dt);
      this.unicorn.rotation.x = -(1 - p.flip / FLIP_TIME) * Math.PI * 2;
    } else if (this.unicorn.rotation.x !== 0) {
      this.unicorn.rotation.x = 0;
    }

    this.unicorn.position.set(p.x, p.y, 0);
    this.unicorn.rotation.z = (targetX - p.x) * -0.12;
    this.unicorn.rotation.y = (targetX - p.x) * -0.08;
  }

  // Piscar depois da batida esconde só o corpinho — as estrelinhas de
  // tontura e o brilho continuam à mostra.
  setBodyVisible(visible) {
    this.bodyVisible = visible;
    const { torso, legs } = this.unicorn.userData;
    torso.visible = visible;
    for (const leg of legs) leg.visible = visible;
  }

  checkCollisions() {
    const p = this.player;
    for (let i = this.world.entities.length - 1; i >= 0; i--) {
      const e = this.world.entities[i];
      if (Math.abs(e.position.z) > 1.0) continue;
      // A barreira ocupa as três pistas; o resto pega só a faixa em volta.
      //
      // `reach` é o Eco: o eco dele corre na faixa vizinha e pega o que tem
      // lá. Vale só para o que se **pega** — obstáculo continua com o
      // alcance normal, senão ele apanharia da pista do lado.
      const alcance = e.userData.halfWidth
        ?? (e.userData.kind === 'obstacle' ? 1.1 : 1.1 * (this.character.reach ?? 1));
      if (Math.abs(e.position.x - p.x) > alcance) continue;

      if (e.userData.kind === 'obstacle') {
        if (e.userData.knocked) continue;      // esse já foi lá para cima
        // A onda da Bomba Arco-Íris já o pegou: ele está encolhendo e subindo,
        // não machuca mais ninguém.
        if (e.userData.dissolving !== undefined) continue;
        // Pulou alto o bastante — ou está de escudo/turbo? Passa ileso.
        if (p.y > 1.1 || p.invulnerable > 0 || this.powers.shield > 0 || this.powers.boost > 0) continue;
        this.hit(e);
      } else if (e.userData.kind === 'powerup') {
        this.takePower(e, i);
      } else if (e.userData.kind === 'key') {
        this.collectKey(e, i);
      } else {
        // Corações e estrelas são generosos: pegam mesmo no meio do pulo.
        this.collect(e, i);
      }
    }
  }

  collect(entity, index) {
    const isStar = entity.userData.kind === 'star';
    // `starValue` é a Estrela: as estrelinhas da pista são parentes dela.
    // `heartValue` é a Pipoca, o par que faltava: ela dobra os corações.
    const valorEstrela = 5 * (this.character.starValue ?? 1);
    const vale = isStar ? valorEstrela : (this.character.heartValue ?? 1);
    this.hearts += vale;
    this.collected += 1;
    this.score += HEART_POINTS * vale;
    this.world.burst(entity.position, isStar ? COLORS.star : COLORS.heart);
    isStar ? sfx.star() : sfx.collect();
    this.world.group.remove(entity);
    this.world.entities.splice(index, 1);
    this.ui.setHearts(this.hearts);
    this.ui.setScore(this.score);
    this.ui.setGoal(this.collected, this.goal);
    this.ui.pop();

    const ganho = vale;
    let ganhou = 0;
    update((save) => {
      save.stats.items += 1;
      save.stats.hearts += ganho;
      // Cada 50 corações viram uma chave. O `while` cobre a estrela, que
      // vale 5 e pode passar do corte de uma vez.
      save.stats.heartsToKey = (save.stats.heartsToKey || 0) + ganho;
      while (save.stats.heartsToKey >= HEARTS_PER_KEY) {
        save.stats.heartsToKey -= HEARTS_PER_KEY;
        save.stats.keys = (save.stats.keys || 0) + 1;
        ganhou += 1;
      }
    });
    if (ganhou) this.rewardKey(ganhou);

    if (this.goal && this.collected >= this.goal) this.victory();
  }

  // Chave mágica: o objetivo do modo Fases.
  // Os 50 corações se juntando e virando chave. A animação é o que explica
  // a regra sem texto, então ela roda mesmo que a criança não esteja olhando
  // o HUD.
  rewardKey(quantas = 1) {
    this.ui.setWallet(this.wallet, false);
    sfx.key();
    this.ui.toast(quantas > 1 ? t('🔑 +{n} chaves!', { n: quantas }) : t('🔑 Mais uma chave!'));
    this.showHeartsToKey();
  }

  // Só a animação, sem creditar nada. A lição usa isto para mostrar a regra
  // dos 50 pontos sem ter de fazer a criança juntar 50 corações antes.
  showHeartsToKey() {
    if (this.keyFx) {
      this.scene.remove(this.keyFx);
      disposeHeartsToKey(this.keyFx);
    }
    this.keyFx = createHeartsToKey();
    // Acima e um pouco à frente do unicórnio: aparece sem cobrir a pista.
    this.keyFx.position.set(this.player.x, 2.7, -1.6);
    this.scene.add(this.keyFx);
  }

  collectKey(entity, index) {
    this.keys += 1;
    this.score += HEART_POINTS * 3;
    this.world.burst(entity.position, 0xffd166);
    sfx.key();
    this.world.group.remove(entity);
    this.world.entities.splice(index, 1);
    this.ui.setKeys(this.keys, this.mode.keys);
    this.ui.setScore(this.score);
    this.ui.pop();
    // As chaves são guardadas para sempre: no futuro elas destravam conteúdo.
    update((save) => { save.stats.keys = (save.stats.keys || 0) + 1; });
    this.ui.setWallet(this.save.stats.keys);

    // Só nas Fases a chave é meta; no Desafio ela é só a moeda.
    if (this.mode.id === 'levels' && this.keys >= this.mode.keys) this.levelComplete();
  }

  // Pegou um power-up: guarda o tempo dele e avisa na tela.
  takePower(entity, index) {
    const power = POWERUPS[entity.userData.power];
    this.world.burst(entity.position, power.color);
    this.world.group.remove(entity);
    this.world.entities.splice(index, 1);
    // A bomba tem estouro próprio; os outros power-ups compartilham o arpejo.
    if (power.id === 'bomb') sfx.bomb(); else sfx.power();
    this.ui.toast(`${power.emoji} ${power.message}`);
    update((save) => {
      save.stats.powers[power.id] = (save.stats.powers[power.id] || 0) + 1;
    });

    if (power.id === 'life') {
      this.powers.flash = FLASH_TIME;
      if (this.lives < START_LIVES + (this.character.extraLives ?? 0)) {
        this.lives += 1;
        this.ui.setLives(this.lives);
      } else {
        this.score += 100;      // já estava com tudo cheio: vira ponto
      }
      return;
    }

    // O nível de evolução (comprado com chaves em Game.showPowerShop) soma
    // por cima do resto — ver POWER_LEVEL_PERCENT em models/powerups.js. A
    // Vida extra, tratada acima, não evolui (ver Game.showPowerShop).
    const nivel = this.save.powerLevels?.[power.id] ?? 0;
    const bonusNivel = powerLevelMultiplier(nivel);

    // Bomba Arco-Íris: a onda sai varrendo a pista e o mundo pisca colorido.
    // Efeito na hora, sem tempo correndo no HUD — o que dura é a onda. O
    // nível não estende a onda em si (ela já limpa tudo o que está visível):
    // soma linhas livres de obstáculo pista adentro, no que ainda vai nascer.
    if (power.id === 'bomb') {
      this.world.rainbowBlast(Math.round(power.graceRowsPerLevel * nivel));
      this.ui.rainbowFlash();
      this.ui.shake();
      // A onda nasce atrás do unicórnio e leva uns instantes para varrer o
      // que está bem na frente dele. Sem esta carência, um obstáculo colado
      // ainda batia no intervalo entre pegar a bomba e a onda chegar nele.
      this.player.invulnerable = Math.max(this.player.invulnerable, BOMB_GRACE);
      // Sem `sfx.win()` aqui de propósito: aquela fanfarra é a de fase
      // concluída, e ouvi-la no meio da corrida faria a criança achar que
      // acabou. O estouro visual já é o "uau"; o som é o de power-up mesmo.
      return;
    }

    // `powerTime` é o Sol: o dia dele é mais longo.
    this.powers[power.id] = power.duration * (this.character.powerTime ?? 1) * bonusNivel;
    if (power.id === 'shield') this.player.invulnerable = 0;   // para de piscar
  }

  // Ímã ligado: os corações e estrelas por perto vêm voando até o unicórnio.
  attractCollectibles(dt) {
    const p = this.player;
    const alvo = new THREE.Vector3(p.x, p.y + 1.15, 0);

    for (const e of this.world.entities) {
      if (e.userData.kind === 'obstacle') continue;
      if (e.position.z < -16 || e.position.z > 9) continue;

      const rumo = alvo.clone().sub(e.position);
      const distancia = rumo.length();
      if (distancia < 0.001) continue;

      // A pista empurra tudo para trás a `speed` por segundo. Se o ímã puxasse
      // mais devagar que isso, o item ficava só acompanhando o unicórnio sem
      // nunca encostar — era o que acontecia com o que ficava para trás.
      const velocidade = Math.max(this.speed + 8, distancia * 9);
      e.position.addScaledVector(rumo.divideScalar(distancia), Math.min(distancia, velocidade * dt));
    }
  }

  updatePowers(dt) {
    let changed = false;
    for (const id of Object.keys(this.powers)) {
      if (this.powers[id] <= 0) continue;
      this.powers[id] = Math.max(0, this.powers[id] - dt);
      changed = true;
    }
    if (!changed) return;

    this.ui.setPowers(
      Object.entries(this.powers)
        .filter(([id, time]) => time > 0 && POWERUPS[id]?.duration > 0)
        .map(([id, time]) => ({ id, emoji: POWERUPS[id].emoji, ratio: time / POWERUPS[id].duration }))
    );
    if (this.powers.magnet > 0) this.attractCollectibles(dt);
  }

  // `magnetRange` é a Lua: sem power-up nenhum, os itens que passam perto
  // vêm um pouquinho até ela. É bem mais fraco que o ímã de verdade, que
  // puxa a pista inteira.
  attractNearby(dt) {
    const alcance = this.character.magnetRange;
    if (!alcance) return;
    const p = this.player;
    const alvo = new THREE.Vector3(p.x, p.y + 1.15, 0);

    for (const e of this.world.entities) {
      if (e.userData.kind === 'obstacle') continue;
      if (e.position.z < -6 || e.position.z > 4) continue;
      const rumo = alvo.clone().sub(e.position);
      const distancia = rumo.length();
      if (distancia < 0.001 || distancia > alcance) continue;
      // Puxa proporcional à proximidade: de longe quase não sente.
      const forca = (1 - distancia / alcance) * 5.5;
      e.position.addScaledVector(rumo.divideScalar(distancia), Math.min(distancia, forca * dt));
    }
  }

  // O obstáculo atingido sai voando e girando, com poeira na cor dele. Vale
  // tanto para a batida que custa vida quanto para a que a casca do Coco
  // aguenta — a trombada é a mesma, só o preço é diferente.
  knockAway(entity) {
    entity.userData.knocked = true;
    entity.userData.knock = new THREE.Vector3(
      (entity.position.x - this.player.x) * 2.5 + (Math.random() - 0.5) * 2,
      7 + Math.random() * 2,
      6 + Math.random() * 3
    );

    const cor = entity.children.find((c) => c.isMesh)?.material?.color?.getHex() ?? 0xffffff;
    this.world.burst(entity.position, cor);
    this.world.burst(entity.position.clone().setY(1.2), 0xffffff);
  }

  hit(entity) {
    this.player.invulnerable = INVULNERABLE_TIME;
    // A casca do Coco: a primeira trombada da corrida não custa vida. Ela
    // ainda dói (piscada, tremida, o obstáculo sai voando), só não tira vida.
    if (this.hitShield) {
      this.hitShield = false;
      this.powers.dizzy = INVULNERABLE_TIME;
      this.knockAway(entity);
      sfx.hit();
      this.ui.flash();
      this.ui.shake();
      this.ui.toast(t('🥥 A casca aguentou!'));
      return;
    }
    // No modo Aprender ninguém perde: a trombada ainda pisca e sacode, para
    // a criança entender que bateu, mas a lição continua.
    if (this.mode.friendly) {
      this.powers.dizzy = INVULNERABLE_TIME;
      this.knockAway(entity);
      sfx.hit();
      this.ui.flash();
      this.ui.shake();
      // Numa aula de desviar ou pular, bater é errar: não adianta ter
      // apertado o botão se apertou na hora errada. A aula recomeça.
      const reprovou = this.lessonMissed();
      this.ui.toast(reprovou ? t('Bateu! Vamos de novo 💗') : t('Ops! Aqui não dói 💗'));
      return;
    }

    this.powers.dizzy = INVULNERABLE_TIME;     // estrelinhas em volta da cabeça
    this.lives -= 1;
    this.speed = Math.max(this.mode.startSpeed, this.speed - 3);

    this.knockAway(entity);

    sfx.hit();
    this.ui.setLives(this.lives);
    this.ui.flash();
    this.ui.shake();
    if (this.lives <= 0) this.gameOver();
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    // Durante a contagem o mundo escorre devagar (o mesmo passo das telas de
    // menu) mas nada é simulado: sem tempo correndo, sem colisão, sem
    // pontuação.
    const playing = this.state === STATE.PLAYING && !this.contando;
    this.elapsed += dt;

    if (playing) {
      // `speedRamp` do personagem é o ritmo (Brasa acelera rápido, Musgo
      // devagar) e `topSpeed` é o teto (a Onda passa do limite da pista).
      const teto = this.mode.maxSpeed * (this.character.topSpeed ?? 1);
      const ritmo = this.mode.speedRamp * (this.character.speedRamp ?? 1);
      this.speed = Math.min(teto, this.speed + ritmo * dt);
      this.score += this.speed * dt * 0.6;
      this.ui.setScore(this.score);
      this.updatePowers(dt);
      this.attractNearby(dt);
      this.updatePlayer(dt);
      this.checkCollisions();
      if (this.mode.scripted) this.updateLesson();
    }

    const boosting = playing && this.powers.boost > 0;
    const rushing = playing && this.rush && this.isFastHere();
    const paused = this.state === STATE.PAUSED;
    const worldSpeed = playing
      ? this.speed * (boosting ? POWERUPS.boost.speed : rushing ? RUSH_SPEED : 1)
      : paused ? 0 : this.mode.startSpeed * 0.35;

    // No turbo a câmera abre um pouco: dá sensação de velocidade. No ⚡ ela
    // abre menos, porque ali o unicórnio continua no chão.
    const wantedFov = this.baseFov + (boosting ? 7 : rushing ? 4 : 0);
    if (Math.abs(this.camera.fov - wantedFov) > 0.05) {
      this.camera.fov += (wantedFov - this.camera.fov) * Math.min(1, 5 * dt);
      this.camera.updateProjectionMatrix();
    }
    if (playing) {
      // O teto inclui o empurrão do ⚡: sem isso a barra grudaria no fim.
      const teto = this.mode.maxSpeed * RUSH_SPEED;
      const piso = this.mode.startSpeed * 0.6;
      this.ui.setSpeed(worldSpeed, (worldSpeed - piso) / (teto - piso));
      this.distance += worldSpeed * dt;
      this.ui.setDistance(this.distance);
      this.world.spawnMarkers(this.distance);

      if (this.recordDistance && !this.beatRecord && this.distance > this.recordDistance) {
        this.beatRecord = true;
        sfx.star();
        this.ui.toast(t('🏁 Novo recorde!'));
      }
    }

    this.world.update(dt, worldSpeed, playing ? this.progress : 0, this.elapsed);
    animateUnicorn(this.unicorn, this.elapsed, worldSpeed * 0.14, this.player.grounded, this.powers.feather > 0);
    this.updateEchoes(worldSpeed);
    updateAuras(this.auras, this.powers, this.elapsed);
    updateCharacterAura(this.charAura, dt, this.elapsed, worldSpeed);
    if (this.nightGlow.visible) {
      this.nightGlow.scale.setScalar(1.8 * (1 + Math.sin(this.elapsed * 2.2) * 0.05));
    }
    if (this.keyFx) {
      this.keyFx.position.x += (this.player.x - this.keyFx.position.x) * Math.min(1, 6 * dt);
      if (!updateHeartsToKey(this.keyFx, dt)) {
        this.scene.remove(this.keyFx);
        disposeHeartsToKey(this.keyFx);
        this.keyFx = null;
      }
    }

    this.applyLightning(playing ? dt : 0);
    this.applyWingEffects(dt);
    updateRainbowTrail(this.trail, dt, worldSpeed, this.player.x, this.player.y, this.elapsed, rushing);
    this.trail.visible = this.bodyVisible !== false && this.state !== STATE.READY;

    // Na tela inicial o personagem gira devagar, para dar para ver o modelo
    // inteiro antes de escolher.
    if (this.state === STATE.READY) this.unicorn.rotation.y += dt * 0.7;

    // Câmera segue o unicórnio com um atraso suave. Na tela inicial ela chega
    // mais perto, para o personagem escolhido aparecer bem.
    const preview = this.state === STATE.READY;
    const follow = Math.min(1, 4 * dt);
    this.camera.position.x += (this.player.x * 0.4 - this.camera.position.x) * follow;
    // Em pé o cartão ocupa mais tela, então na pré-visualização a câmera se
    // afasta um pouco e mira mais alto — o personagem cai na faixa livre
    // embaixo do cartão.
    const previewZoom = preview ? (this.portrait ? 0.88 : 0.72) : 1;
    const previewLook = preview ? (this.portrait ? 5.0 : 3.4) : 1.5;
    this.camera.position.y += (this.camView.height * (preview ? 0.95 : 1) + this.player.y * 0.35 - this.camera.position.y) * follow;
    this.camera.position.z += (this.camView.distance * previewZoom - this.camera.position.z) * follow;
    this.camera.lookAt(this.player.x * 0.25, previewLook + this.player.y * 0.3, preview ? -3 : -8);

    this.renderer.render(this.scene, this.camera);
  }
}
