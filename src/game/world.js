// O mundo que corre em direção ao unicórnio: chão, decoração lateral,
// listras da pista, corações, estrelas e obstáculos.
//
// Tudo fica dentro de `root`, então trocar de pista é jogar fora um mundo
// inteiro e montar outro (ver Game.buildWorld).
import * as THREE from 'three';
import { LANES, SPAWN_DISTANCE, DESPAWN_DISTANCE, COLORS, MODES, DEFAULT_MODE } from './config.js';
import { TRACKS, DEFAULT_TRACK } from './tracks.js';
import { createHeart, createStar, createKey } from '../models/collectibles.js';
import { createPowerup, POWERUP_LIST } from '../models/powerups.js';
import {
  createGround, createDecoration, createObstacle, createCloud,
  createRainbow, createMountains, createMoon, createStars, createSun,
  createDistanceMarker, createRecordBanner, createAmbience, animateAmbience,
} from '../models/scenery.js';

const TRACK_LENGTH = Math.abs(SPAWN_DISTANCE) + DESPAWN_DISTANCE;
const MARKER_STEP = 100;      // de quantos em quantos passos vem uma placa

// Altura de voo (ou de nado) de cada bichinho e distância mínima da pista.
const AMBIENCE_SPOT = {
  firefly:   { alto: [0.6, 4.2], longe: 5 },
  butterfly: { alto: [0.5, 2.6], longe: 5 },
  bee:       { alto: [0.4, 2.2], longe: 5 },
  bird:      { alto: [4, 11],    longe: 0 },   // passarinho pode cruzar por cima
  fish:      { alto: [0.9, 5.5], longe: 4.5 },
  bubble:    { alto: [0.1, 1.2],  longe: 4.5 },   // sobe sozinha na animação
  ant:       { alto: [0.12, 0.12], longe: 4.4 },  // andando no chão
};

export class World {
  constructor(scene, track = TRACKS[DEFAULT_TRACK]) {
    this.scene = scene;
    this.track = track;
    this.entities = [];      // corações, estrelas e obstáculos ativos
    this.decorations = [];
    this.stripes = [];
    this.clouds = [];
    this.sparkles = [];
    this.spawnTimer = 0;
    this.rowsSincePower = 0;      // espaça os power-ups na pista
    this.rowsSinceKey = 99;       // espaça as chaves mágicas do modo Fases
    this.markers = [];            // placas de distância e faixa do recorde
    this.nextMarker = MARKER_STEP;
    this.recordAt = 0;
    this.mode = MODES[DEFAULT_MODE];

    this.root = new THREE.Group();
    scene.add(this.root);

    this.group = new THREE.Group();   // o que corre junto com a pista
    this.root.add(this.group);

    this.group.add(createGround(track));
    this.root.add(createMountains(track));

    this.buildBackdrop();
    this.buildAmbience();
    this.buildStripes();
    this.buildDecorations();
    this.buildClouds();
    this.buildSparkles();
  }

  // Cada pista tem seu "quadro" no fundo: arco-íris, nuvens de algodão
  // ou lua cheia com estrelas.
  buildBackdrop() {
    if (this.track.backdrop === 'moon') {
      const moon = createMoon();
      moon.position.set(19, 17, -84);
      this.root.add(moon);
      this.root.add(createStars());
      this.backdrop = moon;
      return;
    }

    if (this.track.backdrop === 'sun') {
      const sun = createSun();
      sun.position.set(-16, 22, -82);
      this.root.add(sun);
      this.backdrop = sun;
      return;
    }

    if (this.track.backdrop === 'rainbow') {
      const rainbow = createRainbow();
      rainbow.position.set(0, -2, -78);
      this.root.add(rainbow);
      this.backdrop = rainbow;
    }
  }

  // Bichinhos rodeando a pista: borboletas e abelhas no Campo, passarinhos
  // no Céu, vagalumes na Noite, peixinhos no Oceano…
  buildAmbience() {
    this.ambience = [];
    for (const { kind, count } of this.track.ambience || []) {
      for (let i = 0; i < count; i++) {
        const bug = createAmbience(kind);
        this.placeAmbience(bug, DESPAWN_DISTANCE - Math.random() * TRACK_LENGTH);
        this.root.add(bug);
        this.ambience.push(bug);
      }
    }
  }

  placeAmbience(bug, z) {
    const spot = AMBIENCE_SPOT[bug.userData.kind] || AMBIENCE_SPOT.firefly;
    const [minY, maxY] = spot.alto;
    const side = Math.random() < 0.5 ? -1 : 1;
    // Longe da pista o suficiente para não confundir com item para pegar.
    const x = spot.longe
      ? side * (spot.longe + Math.random() * 16)
      : (Math.random() - 0.5) * 46;
    bug.position.set(x, minY + Math.random() * (maxY - minY), z);
    bug.userData.home = bug.position.clone();
  }

  buildStripes() {
    const geo = new THREE.PlaneGeometry(6.6, 1.6);
    const mat = new THREE.MeshBasicMaterial({
      color: this.track.stripe,
      transparent: true,
      opacity: this.track.stripeOpacity,
    });
    for (let i = 0; i < 26; i++) {
      const stripe = new THREE.Mesh(geo, mat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.04, DESPAWN_DISTANCE - i * 4);
      this.group.add(stripe);
      this.stripes.push(stripe);
    }
  }

  buildDecorations() {
    const quantos = this.track.decorationCount || 40;
    for (let i = 0; i < quantos; i++) {
      const deco = createDecoration(this.track);
      this.placeDecoration(deco, DESPAWN_DISTANCE - Math.random() * TRACK_LENGTH);
      this.group.add(deco);
      this.decorations.push(deco);
    }
  }

  placeDecoration(deco, z) {
    const side = Math.random() < 0.5 ? -1 : 1;
    deco.position.set(side * (4.8 + Math.random() * 14), 0, z);
  }

  buildClouds() {
    for (let i = 0; i < 14; i++) {
      const cloud = createCloud(this.track.cloud);
      cloud.position.set(
        (Math.random() - 0.5) * 90,
        12 + Math.random() * 14,
        DESPAWN_DISTANCE - Math.random() * TRACK_LENGTH * 1.6
      );
      cloud.scale.setScalar(1 + Math.random());
      this.root.add(cloud);
      this.clouds.push(cloud);
    }
  }

  buildSparkles() {
    const geo = new THREE.IcosahedronGeometry(0.12, 0);
    for (let i = 0; i < 40; i++) {
      const s = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLORS.star, transparent: true }));
      s.visible = false;
      s.userData.life = 0;
      this.root.add(s);
      this.sparkles.push(s);
    }
  }

  burst(position, color = COLORS.star) {
    let used = 0;
    for (const s of this.sparkles) {
      if (s.userData.life > 0) continue;
      s.position.copy(position);
      s.material.color.setHex(color);
      s.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5, Math.random() * 5 + 1, (Math.random() - 0.5) * 5
      );
      s.userData.life = 0.6;
      s.visible = true;
      if (++used >= 10) break;
    }
  }

  // Zera as placas e reposiciona a faixa do recorde da vez.
  resetMarkers(recordDistance = 0) {
    for (const marker of this.markers) this.group.remove(marker);
    this.markers.length = 0;
    this.nextMarker = MARKER_STEP;
    this.recordAt = recordDistance > MARKER_STEP / 2 ? recordDistance : 0;
    this.recordPlaced = false;
  }

  // `distance` é quanto o unicórnio já correu. A placa nasce lá na frente já
  // na posição certa, para cruzar com ele exatamente no número dela.
  spawnMarkers(distance) {
    const alcance = Math.abs(SPAWN_DISTANCE);

    while (distance + alcance >= this.nextMarker) {
      this.addMarker(createDistanceMarker(this.nextMarker), distance, this.nextMarker);
      this.nextMarker += MARKER_STEP;
    }

    if (this.recordAt && !this.recordPlaced && distance + alcance >= this.recordAt) {
      this.addMarker(createRecordBanner(), distance, this.recordAt);
      this.recordPlaced = true;
    }
  }

  addMarker(marker, distance, at) {
    marker.position.set(0, 0, -(at - distance));
    this.group.add(marker);
    this.markers.push(marker);
  }

  reset(mode = this.mode) {
    this.mode = mode;
    for (const e of this.entities) this.group.remove(e);
    this.entities.length = 0;
    this.spawnTimer = 0;
    this.rowsSincePower = 0;
    for (const s of this.sparkles) { s.userData.life = 0; s.visible = false; }
  }

  // Um power-up a cada tantas linhas, e nunca dois seguidos.
  rollPowerup() {
    this.rowsSincePower += 1;
    if (this.rowsSincePower < 12) return null;
    if (Math.random() > 0.35) return null;

    // No modo Livre não há vidas, então o coração extra não aparece.
    const pool = POWERUP_LIST.filter((p) => this.mode.obstacles || p.id !== 'life');
    this.rowsSincePower = 0;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  // Chave mágica: só depois de passar `keyGap` linhas, e ainda assim por
  // sorteio — é o que deixa uma chave longe da outra na pista.
  rollKeyLane() {
    if (!this.mode.keyChance) return -1;
    this.rowsSinceKey += 1;
    if (this.rowsSinceKey < (this.mode.keyGap || 10)) return -1;
    if (Math.random() > this.mode.keyChance) return -1;
    this.rowsSinceKey = 0;
    return Math.floor(Math.random() * LANES.length);
  }

  spawnRow(difficulty) {
    const powerId = this.rollPowerup();
    // Power-up e chave nunca saem na mesma linha, para não competirem.
    const keyLane = powerId === null ? this.rollKeyLane() : -1;

    // Modo Livre: nada de obstáculo, só itens espalhados pelas pistas.
    if (!this.mode.obstacles) {
      const powerLane = powerId === null ? -1 : Math.floor(Math.random() * LANES.length);
      for (let lane = 0; lane < LANES.length; lane++) {
        if (lane === powerLane) this.addEntity(createPowerup(powerId), lane, 1.25);
        else if (Math.random() < 0.32) this.addEntity(this.makeCollectible(), lane, 1.15);
      }
      return;
    }

    // Sorteia uma pista livre para o jogador sempre ter saída.
    const freeLane = Math.floor(Math.random() * LANES.length);
    // No modo Fases quem manda na dificuldade é a fase; nos outros, a
    // velocidade já alcançada.
    const obstacleChance = this.mode.obstacleChance ?? (0.35 + difficulty * 0.25);

    for (let lane = 0; lane < LANES.length; lane++) {
      // A chave pode cair em qualquer pista — às vezes é preciso desviar
      // para chegar até ela.
      if (lane === keyLane) {
        this.addEntity(createKey(), lane, 1.2);
        continue;
      }

      if (lane === freeLane) {
        // O power-up sempre nasce na pista livre, para dar para pegar.
        if (powerId !== null) this.addEntity(createPowerup(powerId), lane, 1.25);
        else if (Math.random() < 0.45) this.addEntity(this.makeCollectible(), lane, 1.15);
        continue;
      }

      if (Math.random() < obstacleChance) {
        this.addEntity(createObstacle(this.track), lane, 0);
      } else if (Math.random() < 0.22) {
        this.addEntity(this.makeCollectible(), lane, 1.15);
      }
    }
  }

  makeCollectible() {
    return Math.random() < (this.mode.obstacles ? 0.12 : 0.2) ? createStar() : createHeart();
  }

  addEntity(obj, lane, y) {
    obj.position.set(LANES[lane], y, SPAWN_DISTANCE);
    this.group.add(obj);
    this.entities.push(obj);
  }

  update(dt, speed, difficulty, elapsed) {
    const move = speed * dt;

    for (const stripe of this.stripes) {
      stripe.position.z += move;
      if (stripe.position.z > DESPAWN_DISTANCE) stripe.position.z -= 26 * 4;
    }

    for (let i = this.markers.length - 1; i >= 0; i--) {
      const marker = this.markers[i];
      marker.position.z += move;
      if (marker.position.z > DESPAWN_DISTANCE + 4) {
        this.group.remove(marker);
        this.markers.splice(i, 1);
      }
    }

    for (const deco of this.decorations) {
      deco.position.z += move;
      if (deco.position.z > DESPAWN_DISTANCE + 6) this.placeDecoration(deco, SPAWN_DISTANCE - Math.random() * 20);
    }

    for (const bug of this.ambience) {
      bug.position.z += move;
      if (bug.position.z > DESPAWN_DISTANCE + 6) {
        this.placeAmbience(bug, SPAWN_DISTANCE - Math.random() * 20);
        continue;
      }
      const desloc = animateAmbience(bug, elapsed);
      bug.position.x = bug.userData.home.x + desloc.x;
      bug.position.y = bug.userData.home.y + desloc.y;
    }

    for (const cloud of this.clouds) {
      cloud.position.z += move * 0.35;
      if (cloud.position.z > DESPAWN_DISTANCE + 20) cloud.position.z -= TRACK_LENGTH * 1.6;
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.position.z += move;

      // Obstáculo que levou a trombada: sai girando pelos ares.
      if (e.userData.knocked) {
        e.userData.knock.y -= 22 * dt;
        e.position.addScaledVector(e.userData.knock, dt);
        e.rotation.x += dt * 7;
        e.rotation.z += dt * 5;
        if (e.position.y < -4) {
          this.group.remove(e);
          this.entities.splice(i, 1);
        }
        continue;
      }
      if (e.userData.kind !== 'obstacle') {
        e.rotation.y += dt * 2.2;
        const base = e.userData.kind === 'powerup' ? 1.3
          : e.userData.kind === 'key' ? 1.2 : 1.15;
        e.position.y = base + Math.sin(elapsed * 3 + e.position.z * 0.2) * 0.12;
        // O brilho respira junto com o item.
        const glow = e.userData.glow;
        if (glow) {
          if (e.userData.glowSize === undefined) e.userData.glowSize = glow.scale.x;
          glow.scale.setScalar(e.userData.glowSize * (1 + Math.sin(elapsed * 4 + e.position.z) * 0.12));
        }
      }
      if (e.position.z > DESPAWN_DISTANCE) {
        this.group.remove(e);
        this.entities.splice(i, 1);
      }
    }

    for (const s of this.sparkles) {
      if (s.userData.life <= 0) continue;
      s.userData.life -= dt;
      s.position.addScaledVector(s.userData.velocity, dt);
      s.userData.velocity.y -= 9 * dt;
      s.material.opacity = Math.max(0, s.userData.life / 0.6);
      if (s.userData.life <= 0) s.visible = false;
    }

    if (this.backdrop) this.backdrop.rotation.z = Math.sin(elapsed * 0.2) * 0.03;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnRow(difficulty);
      this.spawnTimer = this.mode.spawnInterval * (1.1 - difficulty * 0.25);
    }
  }
}
