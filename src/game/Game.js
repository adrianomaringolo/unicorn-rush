// Núcleo do jogo: cena, câmera, estado do jogador e laço principal.
import * as THREE from 'three';
import {
  LANES, LANE_CHANGE_SPEED, MODES, DEFAULT_MODE,
  JUMP_VELOCITY, GRAVITY, FLY_HEIGHT, START_LIVES, INVULNERABLE_TIME, HEART_POINTS, COLORS,
} from './config.js';
import { createUnicorn, animateUnicorn } from '../models/unicorn.js';
import { CHARACTERS, CHARACTER_LIST, DEFAULT_CHARACTER } from '../models/characters.js';
import { TRACKS, TRACK_LIST, DEFAULT_TRACK } from './tracks.js';
import { LEVEL_COUNT, levelData } from './levels.js';
import { World } from './world.js';
import { createRainbowTrail, updateRainbowTrail, resetRainbowTrail } from '../models/rainbowTrail.js';
import { POWERUPS, POWERUP_LIST } from '../models/powerups.js';
import { createGlow } from '../models/collectibles.js';
import { createAuras, updateAuras, FLASH_TIME } from '../models/auras.js';
import { createInput } from './input.js';
import { sfx } from './audio.js';
import { getSave, update, resetSave } from './storage.js';
import * as music from './music.js';

const STATE = { READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', OVER: 'over' };

const CAMERA = { height: 5.1, distance: 9.4, fov: 55 };

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
    this.character = CHARACTERS[this.save.choices.character] || CHARACTERS[DEFAULT_CHARACTER];
    this.track = TRACKS[this.save.choices.track] || TRACKS[DEFAULT_TRACK];
    this.step = 'track';   // passo da escolha: pista → personagem → modo
    this.level = Math.min(this.save.levels.unlocked, LEVEL_COUNT);

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

    this.player = { lane: 1, x: 0, y: 0, vy: 0, grounded: true, invulnerable: 0 };

    createInput(canvas, {
      onLeft: () => this.moveLane(-1),
      onRight: () => this.moveLane(1),
      onJump: () => this.jump(),
      onStart: () => { if (this.state !== STATE.PLAYING) this.ui.pressFirstButton(); },
      onPause: () => this.togglePause(),
    });
    this.ui.onPause(() => this.togglePause());

    this.setupMuteButton();
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    window.visualViewport?.addEventListener('resize', () => this.resize());
    this.resize();

    this.clock = new THREE.Clock();
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
    this.track = TRACKS[id];
    update((save) => { save.choices.track = id; });
    this.buildWorld();
    sfx.collect();
    if (this.state !== STATE.PLAYING) this.showMenu();
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
    const glow = this.track.glow;
    this.unicorn.traverse((obj) => {
      const material = obj.isMesh ? obj.material : null;
      if (!material || !material.emissive || material === this.nightGlow.material) return;
      if (glow) material.emissive.copy(material.color).multiplyScalar(glow.intensity);
      else material.emissive.setHex(0x000000);
    });

    this.nightGlow.visible = !!glow;
    if (glow) this.nightGlow.material.color.setHex(glow.halo);
  }

  setCharacter(id) {
    if (!CHARACTERS[id] || id === this.character.id) return;
    this.character = CHARACTERS[id];
    update((save) => { save.choices.character = id; });
    this.buildCharacter();
    sfx.collect();
    if (this.state !== STATE.PLAYING) this.showMenu();
  }

  // Setas na tela de escolha passam de uma opção para a outra.
  cycleCharacter(dir) {
    const index = CHARACTER_LIST.findIndex((c) => c.id === this.character.id);
    const next = (index + dir + CHARACTER_LIST.length) % CHARACTER_LIST.length;
    this.setCharacter(CHARACTER_LIST[next].id);
  }

  cycleTrack(dir) {
    const index = TRACK_LIST.findIndex((t) => t.id === this.track.id);
    const next = (index + dir + TRACK_LIST.length) % TRACK_LIST.length;
    this.setTrack(TRACK_LIST[next].id);
  }

  // Botãozinho de som no canto do HUD.
  setupMuteButton() {
    const button = document.querySelector('#mute');
    if (!button) return;
    const refresh = () => {
      button.textContent = music.isMuted() ? '🔇' : '🔊';
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
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    this.ui.showPause(true);
  }

  // Grade das dez fases, com as que ainda não abriram cadeadas.
  showLevels() {
    this.state = STATE.READY;
    this.ui.showPause(false);
    this.step = 'levels';
    this.mode = this.levelMode(this.level);
    this.reset();

    const { unlocked, done } = this.save.levels;
    const tiles = Array.from({ length: LEVEL_COUNT }, (_, i) => {
      const number = i + 1;
      const open = number <= unlocked;
      const state = done[number] ? 'done' : open ? 'open' : 'locked';
      return `<button class="level-tile ${state}" data-level="${number}" ${open ? '' : 'disabled'}>`
        + `<span class="level-number">${open ? number : '🔒'}</span>`
        + `<span class="level-keys">${open ? `🔑 ${levelData(number).keys}` : ''}</span>`
        + `${done[number] ? '<span class="level-done">⭐</span>' : ''}</button>`;
    }).join('');

    this.ui.showOverlay({
      title: 'Escolha a fase',
      text: `Junte as chaves mágicas 🔑 antes que as vidas acabem.`
        + `<br><span class="muted">Fases abertas: ${unlocked} de ${LEVEL_COUNT}</span>`,
      html: `<div class="levels-grid">${tiles}</div>`,
      buttons: [
        { label: '⬅️ Voltar', onClick: () => this.showMenu('mode'), secondary: true },
      ],
    });
    this.ui.bindExtra((number) => this.startLevel(number));
  }

  levelComplete() {
    this.ui.showPause(false);
    sfx.star();
    this.world.burst(this.unicorn.position.clone().setY(1.6), COLORS.star);
    const number = this.level;
    update((save) => {
      save.levels.done[number] = true;
      save.levels.unlocked = Math.max(save.levels.unlocked, Math.min(number + 1, LEVEL_COUNT));
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
        : `${this.character.name} terminou as ${LEVEL_COUNT} fases! Que corrida!`,
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
    this.lives = START_LIVES;
    this.speed = this.mode.startSpeed;
    this.elapsed = 0;
    this.player = { lane: 1, x: 0, y: 0, vy: 0, grounded: true, invulnerable: 0 };
    // Segundos restantes de cada efeito (`flash` é só o brilho da vida extra).
    this.powers = { shield: 0, magnet: 0, boost: 0, flash: 0 };
    this.ui.setPowers([]);
    this.unicorn.position.set(0, 0, 0);
    this.unicorn.visible = true;
    this.setBodyVisible(true);
    resetRainbowTrail(this.trail, 0, 0);
    this.world.reset(this.mode);
    this.ui.setMode(this.mode);
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

  // Escolha em três passos: pista → personagem → modo. Cada passo mostra a
  // escolha ao vivo no cenário atrás do cartão.
  showMenu(step = this.step) {
    this.state = STATE.READY;
    this.ui.showPause(false);
    this.step = step;
    this.reset();

    if (step === 'character') {
      this.ui.showOverlay({
        step: { index: 2, total: 3 },
        picker: true,
        title: 'Quem vai correr?',
        chips: CHARACTER_LIST.map((character) => ({
          id: character.id,
          name: character.name,
          emoji: character.emoji,
          active: character.id === this.character.id,
          onClick: () => this.setCharacter(character.id),
        })),
        text: `<b>${this.character.name}</b>, ${this.character.title}<br>${this.character.story}`,
        buttons: [
          { label: 'Continuar ➡️', onClick: () => this.showMenu('mode') },
          { label: '⬅️ Voltar', onClick: () => this.showMenu('track'), secondary: true },
        ],
      });
      return;
    }

    if (step === 'mode') {
      const { wins, hearts, runs } = this.save.stats;
      this.ui.showOverlay({
        step: { index: 3, total: 3 },
        title: 'Como vamos jogar?',
        text: `${this.track.emoji} ${this.track.name} · ${this.character.emoji} ${this.character.name}`
          + (runs
            ? `<br><span class="muted">🏆 ${wins} vitória(s) · 💗 ${hearts} corações · 🏃 ${runs} corridas</span>`
            : ''),
        buttons: [
          ...Object.values(MODES).map((mode) => ({
            label: `${mode.emoji} Modo ${mode.name}`,
            hint: mode.target
              ? `Meta: ${this.goalFor(mode)} itens · nível ${this.save.babyLevel}`
              : mode.id === 'levels'
                ? `${this.save.levels.unlocked} de ${LEVEL_COUNT} fases abertas`
                : mode.tagline,
            onClick: () => (mode.id === 'levels' ? this.showLevels() : this.start(mode.id)),
          })),
          { label: '⬅️ Voltar', onClick: () => this.showMenu('character'), secondary: true },
        ],
      });
      return;
    }

    this.ui.showOverlay({
      step: { index: 1, total: 3 },
      picker: true,
      title: 'Escolha a pista',
      chips: TRACK_LIST.map((track) => ({
        id: track.id,
        name: track.name,
        emoji: track.emoji,
        active: track.id === this.track.id,
        onClick: () => this.setTrack(track.id),
      })),
      text: `${this.track.tagline}<br><span class="muted">🎵 ${music.themeName(this.track.id)}</span>`,
      buttons: [
        { label: 'Continuar ➡️', onClick: () => this.showMenu('character') },
        { label: '📊 Estatísticas', onClick: () => this.showStats(), secondary: true },
      ],
    });
  }

  // Tela de estatísticas: tudo o que está guardado no save, em números
  // grandes e barrinhas — dá para ver de longe.
  showStats(confirmingReset = false) {
    this.state = STATE.READY;
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
        ${tile(`${Object.keys(this.save.levels.done).length}/${LEVEL_COUNT}`, 'fases feitas', '🗺️')}
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
        { label: '⬅️ Voltar', onClick: () => this.showMenu(this.step) },
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
        { label: '🏠 Sair para o menu', onClick: () => this.showMenu('track'), secondary: true },
      ],
    });
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    this.ui.showPause(true);
    this.clock.getDelta();       // descarta o tempo parado
  }

  start(modeId = this.mode.id) {
    sfx.resume();
    music.play(this.track.id);
    this.mode = MODES[modeId] || MODES[DEFAULT_MODE];
    update((save) => {
      save.choices.mode = this.mode.id;
      save.stats.runs += 1;
      save.stats.plays[this.track.id] = (save.stats.plays[this.track.id] || 0) + 1;
      save.stats.chars[this.character.id] = (save.stats.chars[this.character.id] || 0) + 1;
    });
    this.reset();
    this.state = STATE.PLAYING;
    this.ui.hideOverlay();
    this.ui.showPause(true);
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
        { label: '🔁 Jogar de novo', onClick: () => this.start() },
        { label: '🎮 Escolher de novo', onClick: () => this.showMenu('track'), secondary: true },
        { label: '📊 Estatísticas', onClick: () => this.showStats(), secondary: true },
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
    // Nas telas de escolha as setas passeiam pelas opções do passo atual.
    if (this.state === STATE.READY) {
      if (this.step === 'track') this.cycleTrack(dir);
      else if (this.step === 'character') this.cycleCharacter(dir);
      return;
    }
    if (this.state !== STATE.PLAYING) return;
    this.player.lane = THREE.MathUtils.clamp(this.player.lane + dir, 0, LANES.length - 1);
  }

  jump() {
    if (this.state !== STATE.PLAYING) return;
    if (this.powers.boost > 0) return;      // já está voando
    if (!this.player.grounded) return;
    this.player.vy = JUMP_VELOCITY;
    this.player.grounded = false;
    sfx.jump();
  }

  get difficulty() {
    const range = this.mode.maxSpeed - this.mode.startSpeed;
    return range > 0 ? THREE.MathUtils.clamp((this.speed - this.mode.startSpeed) / range, 0, 1) : 0;
  }

  updatePlayer(dt) {
    const p = this.player;
    const targetX = LANES[p.lane];
    p.x += (targetX - p.x) * Math.min(1, LANE_CHANGE_SPEED * dt);

    if (this.powers.boost > 0) {
      // Turbo: o unicórnio decola e passa voando por cima de tudo.
      p.grounded = false;
      p.vy = 0;
      p.y += (FLY_HEIGHT - p.y) * Math.min(1, 6 * dt);
    } else if (!p.grounded) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; }
    }

    if (this.powers.shield > 0) p.invulnerable = 0;
    if (p.invulnerable > 0) {
      p.invulnerable -= dt;
      this.setBodyVisible(Math.floor(p.invulnerable * 12) % 2 === 0);
      if (p.invulnerable <= 0) this.setBodyVisible(true);
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
      if (Math.abs(e.position.x - p.x) > 1.1) continue;

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
    this.hearts += isStar ? 5 : 1;
    this.collected += 1;
    this.score += isStar ? HEART_POINTS * 5 : HEART_POINTS;
    this.world.burst(entity.position, isStar ? COLORS.star : COLORS.heart);
    isStar ? sfx.star() : sfx.collect();
    this.world.group.remove(entity);
    this.world.entities.splice(index, 1);
    this.ui.setHearts(this.hearts);
    this.ui.setScore(this.score);
    this.ui.setGoal(this.collected, this.goal);
    this.ui.pop();

    update((save) => {
      save.stats.items += 1;
      save.stats.hearts += isStar ? 5 : 1;
    });

    if (this.goal && this.collected >= this.goal) this.victory();
  }

  // Chave mágica: o objetivo do modo Fases.
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
    update((save) => { save.stats.keys = (save.stats.keys || 0) + 1; });

    if (this.keys >= this.mode.keys) this.levelComplete();
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

    if (power.id === 'life') {
      this.powers.flash = FLASH_TIME;
      if (this.lives < START_LIVES) {
        this.lives += 1;
        this.ui.setLives(this.lives);
      } else {
        this.score += 100;      // já estava com tudo cheio: vira ponto
      }
      return;
    }

    this.powers[power.id] = power.duration;
    if (power.id === 'shield') this.player.invulnerable = 0;   // para de piscar
  }

  // Ímã ligado: os corações e estrelas por perto vêm voando até o unicórnio.
  attractCollectibles(dt) {
    const p = this.player;
    for (const e of this.world.entities) {
      if (e.userData.kind === 'obstacle') continue;
      if (e.position.z < -16 || e.position.z > 6) continue;
      const pull = Math.min(1, 6 * dt);
      e.position.x += (p.x - e.position.x) * pull;
      e.position.y += (p.y + 1.15 - e.position.y) * pull;
      e.position.z += (0 - e.position.z) * pull * 0.5;
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

  hit(entity) {
    this.player.invulnerable = INVULNERABLE_TIME;
    this.powers.dizzy = INVULNERABLE_TIME;     // estrelinhas em volta da cabeça
    this.lives -= 1;
    this.speed = Math.max(this.mode.startSpeed, this.speed - 3);

    // O obstáculo é arremessado para cima e para trás, girando.
    entity.userData.knocked = true;
    entity.userData.knock = new THREE.Vector3(
      (entity.position.x - this.player.x) * 2.5 + (Math.random() - 0.5) * 2,
      7 + Math.random() * 2,
      6 + Math.random() * 3
    );

    // Poeira da batida, na cor do que foi atingido.
    const cor = entity.children.find((c) => c.isMesh)?.material?.color?.getHex() ?? 0xffffff;
    this.world.burst(entity.position, cor);
    this.world.burst(entity.position.clone().setY(1.2), 0xffffff);

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
      this.speed = Math.min(this.mode.maxSpeed, this.speed + this.mode.speedRamp * dt);
      this.score += this.speed * dt * 0.6;
      this.ui.setScore(this.score);
      this.updatePowers(dt);
      this.updatePlayer(dt);
      this.checkCollisions();
    }

    const boosting = playing && this.powers.boost > 0;
    const paused = this.state === STATE.PAUSED;
    const worldSpeed = playing
      ? this.speed * (boosting ? POWERUPS.boost.speed : 1)
      : paused ? 0 : this.mode.startSpeed * 0.35;

    // No turbo a câmera abre um pouco: dá sensação de velocidade.
    const wantedFov = this.baseFov + (boosting ? 7 : 0);
    if (Math.abs(this.camera.fov - wantedFov) > 0.05) {
      this.camera.fov += (wantedFov - this.camera.fov) * Math.min(1, 5 * dt);
      this.camera.updateProjectionMatrix();
    }
    if (playing) {
      this.distance += worldSpeed * dt;
      this.ui.setDistance(this.distance);
      this.world.spawnMarkers(this.distance);

      if (this.recordDistance && !this.beatRecord && this.distance > this.recordDistance) {
        this.beatRecord = true;
        sfx.star();
        this.ui.toast('🏁 Novo recorde!');
      }
    }

    this.world.update(dt, worldSpeed, playing ? this.difficulty : 0, this.elapsed);
    animateUnicorn(this.unicorn, this.elapsed, worldSpeed * 0.14, this.player.grounded);
    updateAuras(this.auras, this.powers, this.elapsed);
    if (this.nightGlow.visible) {
      this.nightGlow.scale.setScalar(1.8 * (1 + Math.sin(this.elapsed * 2.2) * 0.05));
    }
    updateRainbowTrail(this.trail, dt, worldSpeed, this.player.x, this.player.y, this.elapsed);
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
