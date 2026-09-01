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
import { getTrackPortraits } from '../models/trackPortraits.js';
import { TRACKS, TRACK_LIST, DEFAULT_TRACK, trackPrice, TRACK_SLOTS } from './tracks.js';
import { LEVEL_COUNT, levelData } from './levels.js';
import { World } from './world.js';
import { createRainbowTrail, updateRainbowTrail, resetRainbowTrail } from '../models/rainbowTrail.js';
import { POWERUPS, POWERUP_LIST } from '../models/powerups.js';
import { createGlow } from '../models/collectibles.js';
import { createHeartsToKey, updateHeartsToKey, disposeHeartsToKey } from '../models/keyReward.js';
import { createAuras, updateAuras, FLASH_TIME } from '../models/auras.js';
import { createInput } from './input.js';
import { sfx } from './audio.js';
import { getSave, update, resetSave, isTestMode, setTestMode } from './storage.js';
import * as music from './music.js';
import { canInstall, needsManualInstall, promptInstall, watchInstall } from './install.js';
import { speak, canSpeak, isOn as speechOn, setOn as setSpeech } from './speech.js';
import { withIcons, iconUrl } from './icons.js';
import { STORY, STORY_PAGES, storyArt } from './story.js';
import { lessonsFor } from './tutorial.js';
import { VERSION } from './version.js';
import { hasUpdate, applyUpdate, onUpdate } from './update.js';

const STATE = { READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', OVER: 'over' };

const CAMERA = { height: 5.1, distance: 9.4, fov: 55 };

// Quanto tempo o portal fica aberto antes de sair sozinho. Cabe a
// animação inteira (cadeado, portas, retrato, nome) e mais um respiro.
const REVEAL_TIME = 4600;

// O que a lição diz quando a mesma aula já falhou umas vezes. Menos "tente
// de novo" e mais "faça isto".
const RETRY_HELP = {
  esquerda: '⬅️ Toque na seta da esquerda',
  direita: '➡️ Toque na seta da direita',
  lado: '⬅️ ➡️ Toque numa das setas',
  pular: '⬆️ Toque na seta de cima para pular',
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
    this.ui.onRush(() => this.toggleRush());

    this.setupMuteButton();
    // Selo ao lado do nome do jogo: modo teste ligado sem aviso é receita
    // para achar que o progresso sumiu.
    this.ui.setTestBadge(isTestMode());
    setSpeech(this.save.speech);
    // Versão nova esperando: redesenha a tela para o botão aparecer sem
    // precisar sair e voltar.
    onUpdate(() => { if (this.state === STATE.READY) this.render(); });
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
        descricao: (item) => item.tagline,
        chamada: () => 'é para lá que a corrida vai',
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
        chamada: (item) => `${item.name} vem correr com você`,
      };
  }

  // Sem `price` vem liberado (só a Uni e o Campo); o resto, depois de trocado.
  // No modo teste tudo está liberado — sem escrever nada na loja, então
  // desligar o modo devolve as compras de verdade.
  isOwned(kind, id) {
    const loja = this.shopOf(kind);
    const item = loja.obter(id);
    if (!item) return false;
    if (isTestMode()) return true;
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
    this.ui.toast(this.rush ? '⚡ Disparou!' : 'Voltou ao normal');
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
      sfx.thunder();
    }
    if (!this.flashBoost) return;

    this.flashBoost = Math.max(0, this.flashBoost - dt * 2.2);
    const f = this.flashBoost;
    this.hemisphere.intensity = this.track.hemisphere.intensity * (1 + f * 1.6);
    this.sun.intensity = this.track.sun.intensity * (1 + f * 2.2);
    if (f === 0) this.applyTrackLook();
  }

  // Com o ⚡ ligado as asas crescem e acendem. A transição é suave nos dois
  // sentidos (`rushLook` vai de 0 a 1), senão o unicórnio "pula de tamanho"
  // no meio da corrida.
  //
  // O brilho soma ao da pista: na Noite todo mundo já é aceso, e aqui as
  // asas ficam ainda mais.
  applyRushWings(dt) {
    const alvo = this.state === STATE.PLAYING && this.rush && this.isFastHere() ? 1 : 0;
    const antes = this.rushLook;
    this.rushLook += (alvo - this.rushLook) * Math.min(1, 7 * dt);
    if (Math.abs(alvo - this.rushLook) < 0.002) this.rushLook = alvo;
    // Nada mudou e não há o que desfazer: não gasta o quadro.
    if (this.rushLook === antes && this.rushLook === 0) return;

    const t = this.rushLook;
    const wings = this.unicorn.userData.wings;
    if (!wings) return;
    const escala = WING_SCALE * (1 + 0.5 * t);
    const brilho = (this.track.glow?.intensity || 0) + 0.8 * t;

    for (const wing of wings.children) {
      wing.scale.setScalar(escala);
      wing.traverse((obj) => {
        const material = obj.isMesh ? obj.material : null;
        if (!material || !material.emissive) return;
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

  get best() {
    return this.save.stats.bests[this.mode.id] || 0;
  }

  saveBest() {
    update((save) => {
      if (this.score > (save.stats.bests[this.mode.id] || 0)) {
        save.stats.bests[this.mode.id] = Math.floor(this.score);
      }
      // A maior distância já corrida vira a faixa do recorde da próxima vez.
      save.stats.distances ??= {};
      if (this.distance > (save.stats.distances[this.mode.id] || 0)) {
        save.stats.distances[this.mode.id] = Math.floor(this.distance);
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
    this.ui.showPause(true);
    // O ⚡ vale nas Fases também: correr mais rápido junta as chaves antes,
    // ao preço de mais obstáculo por segundo. E ele **atravessa a troca de
    // fase**: quem escolheu correr rápido não aperta de novo a cada fase —
    // só perde se o unicórnio não for rápido na pista.
    this.rush = this.rush && this.isFastHere();
    if (!this.rush) this.rushLook = 0;
    this.ui.showRush(this.isFastHere(), this.rush);
  }

  // Grade das dez fases. A que ainda não abriu fica do mesmo tamanho das
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
      title: `Fases · ${this.track.emoji} ${this.track.name}`,
      html: `<div class="levels-grid">${tiles}</div>`,
      back: () => this.showModePicker(),
    });
    this.ui.bindExtra((numero, tile) => {
      const n = Number(numero);
      if (n > unlocked) {
        sfx.deny();
        this.ui.shakeElement(tile);
        this.ui.toast('Essa ainda não abriu 🔒');
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
      title: `Fase ${number} completa! 🎉`,
      text: hasNext
        ? `${this.character.name} juntou as ${this.mode.keys} chaves. A fase ${number + 1} abriu!`
        : `${this.character.name} terminou as ${LEVEL_COUNT} fases do ${this.track.name}! Que corrida!`,
      buttons: [
        ...(hasNext ? [{ label: '▶️ Próxima fase', onClick: () => this.startLevel(number + 1) }] : []),
        { label: '🔁 Jogar de novo', onClick: () => this.startLevel(number), secondary: hasNext },
        { label: '🗺️ Escolher fase', onClick: () => this.showLevels(), secondary: true },
      ],
    });
  }

  reset() {
    this.score = 0;
    this.hearts = 0;
    this.collected = 0;
    this.keys = 0;
    this.distance = 0;
    this.recordDistance = this.save.stats.distances?.[this.mode.id] || 0;
    this.beatRecord = false;
    // `extraLives` é a Lulu, que é bebê e corre com uma vida a mais.
    this.lives = START_LIVES + (this.character.extraLives ?? 0);
    this.speed = this.mode.startSpeed;
    // `firstHitFree` é o Coco: a casca dura aguenta a primeira trombada.
    this.hitShield = !!this.character.firstHitFree;
    this.elapsed = 0;
    this.player = { lane: 1, x: 0, y: 0, vy: 0, grounded: true, invulnerable: 0, jumps: 0, flip: 0 };
    this.unicorn.rotation.x = 0;
    // Segundos restantes de cada efeito (`flash` é só o brilho da vida extra).
    // `startShield` é a Chiclete, que começa dentro da bolha de chiclete.
    this.powers = { shield: this.character.startShield ?? 0, magnet: 0, boost: 0, flash: 0 };
    this.ui.setPowers([]);
    this.unicorn.position.set(0, 0, 0);
    this.unicorn.visible = true;
    this.setBodyVisible(true);
    resetRainbowTrail(this.trail, 0, 0);
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
    this.state = STATE.READY;
    this.screen = 'home';
    this.ui.showPause(false);
    // Quem sai da lição pela pausa passa por aqui: as escolhas voltam
    // também nesse caminho, não só ao terminar.
    this.restoreAfterTutorial();
    this.reset();

    const retratos = getPortraits(CHARACTER_LIST);
    const cenarios = getTrackPortraits(TRACK_LIST);
    const modo = MODES[this.mode.id] || MODES[DEFAULT_MODE];
    // Só a Aventura tem velocidade para mostrar; nas outras a figura basta.
    const selo = modo.difficulties
      ? `<span class="pick-badge">${this.difficulty.emoji}</span>`
      : '';

    this.ui.showOverlay({
      home: true,
      picker: true,
      hint: true,
      arrows: false,        // no hub as setas não têm o que percorrer
      title: 'Vamos correr?',
      html: `
        <div class="picks">
          <button class="pick" data-pick="character" aria-label="Trocar de unicórnio">
            <img class="pick-face" src="${retratos[this.character.id]}" alt="" />
            <span class="pick-name">${this.character.name}</span>
          </button>
          <button class="pick" data-pick="track" aria-label="Trocar de pista">
            <img class="pick-face" src="${cenarios[this.track.id]}" alt="" />
            <span class="pick-name">${this.track.name}</span>
          </button>
          <button class="pick" data-pick="mode" aria-label="Trocar de brincadeira">
            <span class="pick-emoji">${modo.emoji}${selo}</span>
            <span class="pick-name">${modo.name}</span>
          </button>
        </div>
        <div class="extras">
          <button class="mini-button historia" data-pick="story">📖 A história</button>
          <button class="mini-button" data-pick="stats">📊 Estatísticas</button>
          <button class="mini-button" data-pick="about">ℹ️ Sobre</button>
          <button class="mini-button aprender" data-pick="tutorial">👆 Aprender</button>
          ${hasUpdate() ? '<button class="mini-button nova" data-pick="update">🔄 Atualizar</button>' : ''}
        </div>
      `,
      buttons: [{ label: '▶️ JOGAR', huge: true, onClick: () => this.playNow() }],
      grown: () => this.showGrownUps(),
    });
    this.ui.bindExtra((qual) => {
      sfx.tap();
      if (qual === 'character') return this.showCharacterPicker();
      if (qual === 'track') return this.showTrackPicker();
      if (qual === 'story') return this.showStory(0);
      if (qual === 'tutorial') return this.startTutorial();
      if (qual === 'stats') return this.showStats();
      if (qual === 'about') return this.showAbout();
      if (qual === 'update') return this.applyUpdate();
      return this.showModePicker();
    });
  }

  // O botão grande: joga já, com o que estiver escolhido. No modo Fases
  // escolher a fase é parte da brincadeira, então abre a grade.
  playNow() {
    if (this.mode.id === 'levels') return this.showLevels();
    return this.start(this.mode.id);
  }

  // As três brincadeiras, em figuras: cada card mostra como é a pista, e a
  // velocidade da Aventura sai no próprio card, sem abrir outra tela.
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
      baby: 'sem nada no caminho',
      levels: `${this.track.name}: ${unlocked} de ${LEVEL_COUNT} fases`,
      adventure: 'com coisas no caminho e 3 vidas',
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
      title: 'Como vamos brincar?',
      html: `<div class="mode-list">${cards}</div>`,
      buttons: [{ label: '▶️ JOGAR', huge: true, onClick: () => this.playNow() }],
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
  showGrownUps() {
    this.state = STATE.READY;
    this.screen = 'grown';
    this.ui.showPause(false);
    this.ui.showOverlay({
      title: '👑 Dos adultos',
      buttons: [
        { label: '⬅️ Voltar ao jogo', onClick: () => this.showHome() },
        ...(canSpeak() ? [{
          label: speechOn() ? '🔊 Voz: ligada' : '🔈 Voz: desligada',
          hint: 'lê em voz alta o nome do que a criança toca',
          onClick: () => this.toggleSpeech(),
          secondary: true,
        }] : []),
        ...(canInstall() ? [{
          label: '📲 Instalar',
          onClick: () => this.installApp(),
          secondary: true,
        }] : []),
      ],
      back: () => this.showHome(),
    });
  }

  toggleSpeech() {
    const ligado = setSpeech(!speechOn());
    update((save) => { save.speech = ligado; });
    if (ligado) speak('Pronto, agora eu falo');
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
        : `<span class="cast-price">🔑 ${loja.preco(item)}</span>`;
      // Na grade de pistas, o ⚡ marca as que o unicórnio escolhido corre
      // mais rápido — inclusive nas trancadas, porque isso ajuda a decidir
      // qual comprar.
      const raio = kind === 'track' && isFastOn(this.character, item.id)
        ? `<span class="cast-fast" title="${this.character.name} corre mais rápido aqui">⚡</span>`
        : '';
      return `<button class="${classes}" data-pick="${item.id}" aria-pressed="${escolhido}">`
        + `<img class="cast-face" src="${retratos[item.id]}" alt="" />`
        + `${meu ? '' : '<span class="cast-lock">🔒</span>'}`
        + raio
        + `<span class="cast-name">${rodape}</span></button>`;
    });

    for (let i = loja.lista.length; i < loja.slots; i++) {
      cartoes.push('<button class="cast-card vazio" data-pick="vazio" aria-label="ainda não existe">'
        + '<span class="cast-soon">?</span>'
        + '<span class="cast-name">em breve</span></button>');
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
      this.ui.toast('Esse ainda está sendo feito ✨');
      return;
    }
    sfx.tap();
    this.showItemSheet(kind, id);
  }

  // A linha abaixo do título, na grade de pistas: diz de quem é o ⚡ que
  // aparece nos cantinhos das miniaturas. A grade de unicórnios não tem
  // legenda — quem quiser saber quem é cada um abre a ficha dele.
  trackLegend() {
    return this.character.fast?.length
      ? `⚡ ${this.character.name} corre mais rápido nas pistas marcadas`
      : this.track.tagline;
  }

  // Escolher unicórnio: uma tela só, com todos à vista. Tocar num retrato já
  // troca o modelo 3D atrás do cartão — sem ficha no meio do caminho e sem
  // confirmar: a escolha é a própria resposta.
  showCharacterPicker() {
    this.state = STATE.READY;
    this.screen = 'character';
    this.ui.showPause(false);
    this.ui.setWallet(this.wallet, true);

    this.ui.showOverlay({
      picker: true,
      hint: true,
      title: 'Quem vai correr?',
      html: this.gridHtml('character'),
      buttons: [{ label: '✅ Pronto', huge: true, onClick: () => this.showHome() }],
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
    const loja = this.shopOf(kind);
    const item = loja.obter(id);
    if (!item) return loja.voltar();

    this.state = STATE.READY;
    this.screen = 'sheet';
    this.ui.showPause(false);

    const meu = this.isOwned(kind, id);
    const preco = loja.preco(item);
    const tenho = this.wallet;
    const falta = preco - tenho;
    this.ui.setWallet(tenho, !meu);
    speak(item.name);

    const botao = meu
      ? {
        label: '✅ Escolher esse',
        hint: item.id === loja.atual().id ? 'já é o escolhido' : loja.chamada(item),
        huge: true,
        onClick: () => { loja.aplicar(id); loja.voltar(); },
      }
      : falta > 0
        ? {
          label: '🗺️ Buscar chaves',
          hint: `ainda falta${falta > 1 ? 'm' : ''} ${falta} · as chaves aparecem nas Fases`,
          huge: true,
          onClick: () => this.goFindKeys(),
        }
        : {
          label: `🔑 Trocar ${preco} chaves`,
          hint: loja.chamada(item),
          huge: true,
          onClick: () => this.buyItem(kind, id),
        };

    // A característica especial dele. É o que responde "por que escolher
    // este?", então vem antes das pistas rápidas, que são o complemento.
    const poder = kind === 'character' && item.power
      ? `<p class="shop-power"><b>✨ ${item.power}</b></p>`
      : '';

    // As pistas em que ele corre mais rápido: é o que diferencia um
    // unicórnio do outro além da cor, então aparece na ficha.
    const rapidas = kind === 'character' && item.fast?.length
      ? `<p class="shop-fast">⚡ Corre mais rápido em `
        + item.fast.map((t) => `<b>${TRACKS[t]?.emoji || ''} ${TRACKS[t]?.name || t}</b>`).join(' e ')
        + '</p>'
      : '';

    // O preço só aparece em quem ainda não é seu; na pista, o lugar dele é a
    // música, que é o outro jeito de reconhecer o cenário.
    const rodape = meu
      ? (kind === 'track' ? `<p class="shop-note">🎵 ${music.themeName(item.id)}</p>` : '')
      : `<p class="shop-price${falta > 0 ? ' falta' : ''}">`
        + `Custa <b>🔑 ${preco}</b> · você tem <b>🔑 ${tenho}</b></p>`;

    this.ui.showOverlay({
      picker: true,
      title: `${item.emoji} ${item.name}`,
      html: `
        <div class="shop">
          <img class="shop-face" src="${loja.retratos()[item.id]}" alt="" />
          ${loja.subtitulo(item) ? `<p class="shop-title">${loja.subtitulo(item)}</p>` : ''}
          <p class="shop-story">${loja.descricao(item)}</p>
          ${poder}
          ${rapidas}
          ${rodape}
        </div>
      `,
      buttons: [botao],
      back: () => loja.voltar(),
    });
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
    this.revealUnlock(kind, item, () => {
      this.ui.toast(`${item.emoji} ${item.name} é sua!`);
      loja.voltar();
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
    const fala = setTimeout(() => speak(`${item.name} é sua!`), 2100);

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
      title: 'Por onde vamos?',
      // A legenda vai no `text`, que fica acima da grade e fora da área que
      // rola: embaixo de 15 miniaturas ela nunca seria lida.
      text: this.trackLegend(),
      html: this.gridHtml('track'),
      buttons: [{ label: '✅ Pronto', huge: true, onClick: () => this.showHome() }],
      back: () => this.showHome(),
    });
    this.ui.bindExtra((id, tile) => this.pickItem('track', id, tile));
  }

  // Instalação: no Android o próprio navegador abre o convite; no iPhone
  // mostramos o passo a passo, porque lá é manual.
  installApp() {
    if (needsManualInstall()) {
      this.ui.showOverlay({
        title: '📲 Instalar no iPhone',
        html: `
          <div class="about">
            <p class="about-text">
              No iPhone a instalação é pelo Safari, em dois toques:
            </p>
            <ol class="install-steps">
              <li>Toque em <b>Compartilhar</b> <span aria-hidden="true">􀈂</span> na barra de baixo</li>
              <li>Escolha <b>Adicionar à Tela de Início</b></li>
            </ol>
            <p class="about-note">
              Depois disso o jogo abre em tela cheia, com o ícone próprio e
              funciona sem internet.
            </p>
          </div>
        `,
        buttons: [{ label: '⬅️ Voltar', onClick: () => this.showGrownUps() }],
      });
      return;
    }

    promptInstall().then(() => this.showGrownUps());
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
    this.storyPage = Math.min(Math.max(0, pagina), STORY_PAGES - 1);
    const indice = this.storyPage;
    const folha = STORY[indice];
    const ultima = indice === STORY_PAGES - 1;
    this.ui.showPause(false);
    // O livro tem a música dele — mais lenta e mais quieta que a da pista,
    // porque aqui se lê (ou se ouve ler). Volta a da pista ao fechar.
    music.play(music.STORY_THEME);

    // As bolinhas embaixo: quantas páginas o livro tem e em qual estamos.
    // Também são botões — dá para pular direto para uma página.
    const bolinhas = STORY.map((p, i) => (
      `<button class="page-dot${i === indice ? ' agora' : ''}${i < indice ? ' lida' : ''}"`
      + ` data-pick="ir:${i}" aria-label="Página ${i + 1}"`
      + ` aria-current="${i === indice}"></button>`
    )).join('');

    this.ui.showOverlay({
      book: true,
      wide: true,
      html: `
        <div class="book">
          <div class="book-art"${ultima ? '' : ' data-pick="proxima"'}>
            <img class="book-img" src="${folha.image}" alt="" draggable="false" />
            ${ultima ? '' : '<button class="book-skip" data-pick="pular">Pular</button>'}
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
        ? { label: '▶️ VAMOS!', huge: true, onClick: () => this.closeStory() }
        : { label: 'Virar a página', huge: true, onClick: () => this.turnPage(1) }],
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
      moldura?.insertAdjacentHTML('afterbegin', storyArt(indice));
    }, { once: true });

    // A próxima página já vai chegando: a virada fica instantânea, sem o
    // quadro em branco enquanto a imagem baixa.
    if (!ultima) new Image().src = STORY[indice + 1].image;

    // Para quem ainda não lê: a voz do aparelho conta a página em voz alta.
    speak(`${folha.title}. ${folha.text}`);
  }

  turnPage(dir) {
    const proxima = this.storyPage + dir;
    // Bateu na capa ou na contracapa: chacoalha em vez de não fazer nada.
    if (proxima < 0 || proxima >= STORY_PAGES) {
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
    music.play(this.track.id);      // fechou o livro, volta o tema da pista
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
      title: 'Quer aprender a correr?',
      text: 'A Uni mostra os comandos e os poderes numa corrida curtinha — '
        + 'e aqui ninguém perde vida.',
      buttons: [
        { label: '👆 Vamos aprender!', huge: true, onClick: () => this.startTutorial() },
        { label: '▶️ Já sei jogar', onClick: () => this.showHome(), secondary: true },
      ],
    });
  }

  // A primeira tela do jogo. Na primeira vez de todas é a história; depois
  // é o menu de sempre.
  showFirstScreen() {
    // Guardado antes de a história marcar `storySeen`: é o que diferencia
    // "abriu o jogo pela primeira vez" de "reabriu a história pelo 📖".
    this.primeiraVez = !this.save.storySeen;
    return this.primeiraVez ? this.showStory(0) : this.showHome();
  }

  // Cartão "sobre": quem fez, com o quê, e os links.
  showAbout() {
    this.state = STATE.READY;
    this.screen = 'about';
    this.ui.showPause(false);
    this.ui.showOverlay({
      title: 'Sobre o jogo',
      html: `
        <div class="about">
          <img class="about-logo" src="./assets/icons/icon-192.png" alt="" width="84" height="84" />
          <p class="about-text">
            <b>UnicornRush</b> é um joguinho de corrida para crianças, feito em
            3D com <b>three.js</b> — todos os unicórnios, pistas e enfeites são
            desenhados por código, sem nenhuma imagem pronta.
          </p>
          <p class="about-text">Criado por <b>Adriano Maringolo</b></p>
          <div class="about-links">
            <a class="about-link" href="https://adrianomaringolo.dev" target="_blank" rel="noopener">
              🌐 adrianomaringolo.dev
            </a>
            <a class="about-link" href="https://github.com/adrianomaringolo" target="_blank" rel="noopener">
              🐙 github.com/adrianomaringolo
            </a>
            <a class="about-link" href="https://github.com/adrianomaringolo/unicorn-rush" target="_blank" rel="noopener">
              🦄 código do jogo
            </a>
          </div>
          <p class="about-version">versão ${VERSION}</p>
          <p class="about-note">
            Feito com three.js · fonte Fredoka (SIL Open Font License) ·
            ícones Fluent Emoji, da Microsoft (MIT)
          </p>
        </div>
      `,
      buttons: [
        // O botão de atualizar mora aqui, ao lado da versão: é onde já se
        // olha para saber o que está instalado.
        ...(hasUpdate() ? [{
          label: '🔄 Atualizar o jogo',
          hint: 'tem versão nova esperando — o jogo recarrega',
          huge: true,
          onClick: () => this.applyUpdate(),
        }] : []),
        { label: '⬅️ Voltar', onClick: () => this.showHome() },
      ],
    });
  }

  // Troca para a versão nova. O recarregamento acontece quando o service
  // worker novo assume de verdade (ver src/game/update.js).
  applyUpdate() {
    this.ui.toast('🔄 Atualizando…');
    if (!applyUpdate()) this.ui.toast('Já está na versão mais nova ✨');
  }

  // Liga e desliga o modo teste. Recarrega de propósito: ao ligar, para a
  // sessão começar limpa; ao desligar, para jogar fora tudo o que aconteceu
  // durante o teste, que só existia na memória.
  toggleTestMode() {
    const ligado = setTestMode(!isTestMode());
    this.ui.toast(ligado ? '🧪 Modo teste ligado' : '🧪 Modo teste desligado');
    setTimeout(() => location.reload(), 500);
  }

  // Quantas fases já foram concluídas somando todas as pistas.
  levelsDone() {
    return Object.values(this.save.levels)
      .reduce((total, fases) => total + Object.keys(fases.done || {}).length, 0);
  }

  // Tela de estatísticas: tudo o que está guardado no save, em números
  // grandes e barrinhas — dá para ver de longe.
  showStats(confirmingReset = false) {
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
        ${tile(stats.wins, 'vitórias', '🏆')}
        ${tile(this.save.babyLevel, `nível · meta ${this.goalFor(MODES.baby)}`, '🍼')}
        ${tile(stats.runs, 'corridas', '🏃')}
        ${tile(stats.hearts, 'corações', '💗')}
        ${tile(stats.items, 'itens pegos', '✨')}
        ${tile(Math.floor(stats.bests.adventure || 0), 'recorde aventura', '🥇')}
        ${tile(stats.keys || 0, 'chaves mágicas', '🔑')}
        ${tile(Math.floor(Math.max(0, ...Object.values(stats.distances || { x: 0 }))), 'maior distância', '🏁')}
        ${tile(`${this.levelsDone()}/${LEVEL_COUNT * TRACK_LIST.length}`, 'fases feitas', '🗺️')}
      </div>
      <p class="stats-title">Corridas em cada pista</p>
      <div class="stats-rows">${bars(TRACK_LIST, stats.plays)}</div>
      <p class="stats-title">Corridas com cada unicórnio</p>
      <div class="stats-rows">${bars(CHARACTER_LIST, stats.chars)}</div>
      <p class="stats-title">Power-ups pegos</p>
      <div class="stats-rows">${bars(POWERUP_LIST, stats.powers)}</div>
    `;

    this.ui.showOverlay({
      title: '📊 Estatísticas',
      html,
      buttons: [
        { label: '⬅️ Voltar', onClick: () => this.showHome() },
        {
          label: isTestMode() ? '🧪 Modo teste: ligado' : '🧪 Modo teste: desligado',
          hint: isTestMode()
            ? 'tudo liberado e nada é guardado · o jogo recarrega ao desligar'
            : 'libera todos os unicórnios e pistas sem guardar nada · o jogo recarrega',
          secondary: true,
          onClick: () => this.toggleTestMode(),
        },
        confirmingReset
          ? {
            label: '⚠️ Apagar mesmo?',
            hint: 'toque de novo para zerar tudo',
            secondary: true,
            onClick: () => {
              resetSave();
              this.mode = MODES[this.save.choices.mode] || MODES[DEFAULT_MODE];
              this.character = CHARACTERS[this.save.choices.character];
              this.track = TRACKS[this.save.choices.track];
              this.buildWorld();
              this.buildCharacter();
              this.showStats();
            },
          }
          : { label: '🧹 Recomeçar do zero', onClick: () => this.showStats(true), secondary: true },
      ],
    });
  }

  // Pausa: congela a pista e abre as opções. Volta com o mesmo botão, com
  // Esc/P ou tocando em "Continuar".
  togglePause() {
    if (this.state === STATE.PAUSED) { this.resume(); return; }
    if (this.state !== STATE.PLAYING) return;
    this.pause();
  }

  pause() {
    this.state = STATE.PAUSED;
    this.ui.showPause(false);
    const naFase = this.mode.id === 'levels';
    this.ui.showOverlay({
      title: 'Pausa ⏸️',
      text: naFase
        ? `Fase ${this.level} · 🔑 ${this.keys}/${this.mode.keys}`
        : `${this.track.emoji} ${this.track.name} · ${this.character.emoji} ${this.character.name}`,
      buttons: [
        { label: '▶️ Continuar', onClick: () => this.resume() },
        {
          label: '🔁 Começar de novo',
          onClick: () => (naFase ? this.startLevel(this.level) : this.start(this.mode.id)),
          secondary: true,
        },
        { label: '🏠 Sair para o menu', onClick: () => this.showHome(), secondary: true },
      ],
    });
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    this.ui.showPause(true);
    this.ui.showRush(this.isFastHere(), this.rush);
    this.clock.getDelta();       // descarta o tempo parado
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
    this.ui.showPause(true);
    // O ⚡ só aparece se este unicórnio for rápido nesta pista.
    this.rush = false;
    this.rushLook = 0;
    this.ui.showRush(this.isFastHere(), false);
    // A lição começa aqui: a aula do ⚡ só entra se o botão existir nesta
    // combinação de unicórnio e pista.
    if (this.mode.scripted) {
      this.lessons = lessonsFor({ rapido: this.isFastHere() });
      this.startLesson(0);
    }
  }

  // A lição é sempre com a **Uni no Campo**: é a combinação que todo mundo
  // tem desde o primeiro dia, e é para ela que as aulas foram escritas (a
  // barreira do Campo, a pedra do Campo). Com outro unicórnio numa pista
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
  }

  // A criança fez o movimento que a aula pedia?
  lessonAction(qual) {
    const l = this.licao;
    if (!l || !l.acao || l.feito) return;
    // 'lado' aceita os dois: o que se ensina ali é sair da frente, e tanto
    // faz para que lado.
    const serve = l.acao === 'lado' ? (qual === 'esquerda' || qual === 'direita') : l.acao === qual;
    if (!serve) return;

    l.feito = true;
    sfx.correct();
    this.ui.setLessonHint(null);
    this.ui.lessonCheck();
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
      this.ui.toast(l.tentativa >= 2 ? RETRY_HELP[l.acao] : 'Vamos tentar de novo 💗');
      return this.startLesson(l.i, l.tentativa + 1);
    }

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
      title: 'Você aprendeu tudo! 🎉',
      text: 'Já sabe desviar, pular, pegar as chaves e usar os power-ups. '
        + 'Agora escolha uma brincadeira e corra de verdade.',
      buttons: [
        { label: '▶️ Quero correr', huge: true, onClick: () => this.showHome() },
        { label: '🔁 Repetir a lição', onClick: () => this.startTutorial(), secondary: true },
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
        { label: '🔁 Jogar de novo', huge: true, onClick: () => this.start() },
        { label: '🏠 Início', onClick: () => this.showHome(), secondary: true },
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
        title: 'Quase!',
        text: `Faltaram ${this.mode.keys - this.keys} chave(s) na fase ${this.level}.`,
        buttons: [
          { label: '🔁 Tentar de novo', onClick: () => this.startLevel(this.level) },
          { label: '🗺️ Escolher fase', onClick: () => this.showLevels(), secondary: true },
        ],
      });
      return;
    }

    this.endRun({
      title: 'Fim da corrida!',
      text: `${this.character.name} correu ${Math.floor(this.distance)} passos, `
        + `juntou ${this.hearts} coração(ões) e fez ${Math.floor(this.score)} pontos.`,
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
      title: 'Você conseguiu! 🎉',
      text: `${this.character.name} juntou os ${done} itens da pista mágica!`
        + `<br><span class="muted">Nível ${this.save.babyLevel}: a próxima meta é ${next} itens.</span>`,
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
    if (this.state !== STATE.PLAYING) return;
    const antes = this.player.lane;
    this.player.lane = THREE.MathUtils.clamp(this.player.lane + dir, 0, LANES.length - 1);
    // Só conta como movimento se ele realmente saiu do lugar: bater na
    // parede da pista não é ter aprendido a mudar de faixa.
    if (this.player.lane !== antes) this.lessonAction(dir < 0 ? 'esquerda' : 'direita');
  }

  // Pulo duplo: o primeiro sai do chão, o segundo é no ar mesmo — a asa
  // bate de novo. Passou de MAX_JUMPS, só depois de encostar no chão.
  jump() {
    if (this.state !== STATE.PLAYING) return;
    if (this.powers.boost > 0) return;      // já está voando
    const p = this.player;
    // `extraJump` é o Cometa, que não sabe parar: pula uma terceira vez.
    if (p.jumps >= MAX_JUMPS + (this.character.extraJump ?? 0)) return;

    const primeiro = p.jumps === 0;
    // `jumpBoost` é o Limão, que é miúdo e elétrico: pula mais alto que os
    // outros, nos dois saltos.
    const impulso = this.character.jumpBoost ?? 1;
    p.vy = (primeiro ? JUMP_VELOCITY : DOUBLE_JUMP_VELOCITY) * impulso;
    p.grounded = false;
    p.jumps += 1;
    this.lessonAction('pular');

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

  // Modo Aventura montado com a dificuldade escolhida.
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
    if (this.track.sideWind) {
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
      p.vy -= GRAVITY * (this.track.gravity ?? 1) * (this.character.airGlide ?? 1) * dt;
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
      if (Math.abs(e.position.x - p.x) > (e.userData.halfWidth ?? 1.1)) continue;

      if (e.userData.kind === 'obstacle') {
        if (e.userData.knocked) continue;      // esse já foi lá para cima
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
    const valorEstrela = 5 * (this.character.starValue ?? 1);
    const vale = isStar ? valorEstrela : 1;
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
    this.ui.toast(quantas > 1 ? `🔑 +${quantas} chaves!` : '🔑 Mais uma chave!');

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

    // Só nas Fases a chave é meta; na Aventura ela é só a moeda.
    if (this.mode.id === 'levels' && this.keys >= this.mode.keys) this.levelComplete();
  }

  // Pegou um power-up: guarda o tempo dele e avisa na tela.
  takePower(entity, index) {
    const power = POWERUPS[entity.userData.power];
    this.world.burst(entity.position, power.color);
    this.world.group.remove(entity);
    this.world.entities.splice(index, 1);
    sfx.power();
    this.ui.toast(`${power.emoji} ${power.message}`);
    update((save) => {
      save.stats.powers[power.id] = (save.stats.powers[power.id] || 0) + 1;
    });

    // Bomba Arco-Íris: a onda sai varrendo a pista e o mundo pisca colorido.
    // Efeito na hora, sem tempo correndo no HUD — o que dura é a onda.
    if (power.id === 'bomb') {
      this.world.rainbowBlast();
      this.ui.rainbowFlash();
      this.ui.shake();
      // Sem `sfx.win()` aqui de propósito: aquela fanfarra é a de fase
      // concluída, e ouvi-la no meio da corrida faria a criança achar que
      // acabou. O estouro visual já é o "uau"; o som é o de power-up mesmo.
      return;
    }

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

    // `powerTime` é o Sol: o dia dele é mais longo.
    this.powers[power.id] = power.duration * (this.character.powerTime ?? 1);
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
        .map(([id, time]) => ({ emoji: POWERUPS[id].emoji, ratio: time / POWERUPS[id].duration }))
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
      this.ui.toast('🥥 A casca aguentou!');
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
      this.ui.toast('Ops! Aqui não dói 💗');
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
    const playing = this.state === STATE.PLAYING;
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
        this.ui.toast('🏁 Novo recorde!');
      }
    }

    this.world.update(dt, worldSpeed, playing ? this.progress : 0, this.elapsed);
    animateUnicorn(this.unicorn, this.elapsed, worldSpeed * 0.14, this.player.grounded);
    updateAuras(this.auras, this.powers, this.elapsed);
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
    this.applyRushWings(dt);
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
