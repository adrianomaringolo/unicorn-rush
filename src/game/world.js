// O mundo que corre em direção ao unicórnio: chão, decoração lateral,
// listras da pista, corações, estrelas e obstáculos.
//
// Tudo fica dentro de `root`, então trocar de pista é jogar fora um mundo
// inteiro e montar outro (ver Game.buildWorld).
import * as THREE from 'three';
import { LANES, SPAWN_DISTANCE, DESPAWN_DISTANCE, COLORS, MODES, DEFAULT_MODE, BARRIER } from './config.js';
import { TRACKS, DEFAULT_TRACK } from './tracks.js';
import { createHeart, createStar, createKey } from '../models/collectibles.js';
import { createPowerup, createRainbowWave, POWERUP_LIST, ARCO_IRIS } from '../models/powerups.js';
import {
  createGround, createDecoration, createObstacle, createBarrier, createCloud, createWaveCrest,
  createRainbow, createMountains, createMoon, createStars, createSun, createLightningBolt,
  createDistanceMarker, createRecordBanner, createStartLine, createAmbience, animateAmbience,
} from '../models/scenery.js';

const TRACK_LENGTH = Math.abs(SPAWN_DISTANCE) + DESPAWN_DISTANCE;

// A onda da Bomba Arco-Íris.
//
// Ela nasce **atrás** do unicórnio, na altura da câmera: assim a primeira
// coisa que a criança vê é a cortina colorida passando por cima dela, e só
// depois indo embora pista afora. Nascendo à frente, a onda saía do campo
// próximo em dois quadros e virava um risquinho no horizonte.
//
// A velocidade é bem maior que a da corrida (senão não alcançaria nada), mas
// não tanto a ponto de sumir antes de ser vista.
// A que distância nasce o que a lição do modo Aprender manda para a pista.
// Bem mais perto que o normal (-90): a criança precisa ver a coisa chegando
// logo depois de ler a frase, senão a aula e o que ela ensina se separam. E
// é isto que dá o ritmo da lição — a -46 ela levava 92 s, tempo demais para
// quem tem quatro anos.
const LESSON_SPAWN_Z = -38;

const WAVE_START_Z = 9;
const WAVE_SPEED = 55;
const WAVE_TIME = 1.9;
const DISSOLVE_TIME = 0.45;
const MARKER_STEP = 100;      // de quantos em quantos passos vem uma placa
// A que distância do zero fica o portal de partida. Não é em cima do
// unicórnio: assim ele aparece inteiro no quadro, e a criança passa por
// baixo dele no primeiro segundo de corrida.
const START_AT = 7;

// Altura de voo (ou de nado) de cada bichinho e distância mínima da pista.
const AMBIENCE_SPOT = {
  firefly:   { alto: [0.6, 4.2], longe: 5 },
  butterfly: { alto: [0.5, 2.6], longe: 5 },
  bee:       { alto: [0.4, 2.2], longe: 5 },
  bird:      { alto: [4, 11],    longe: 0 },   // passarinho pode cruzar por cima
  fish:      { alto: [0.9, 5.5], longe: 4.5 },
  bubble:    { alto: [0.1, 1.2],  longe: 4.5 },   // sobe sozinha na animação
  ant:       { alto: [0.12, 0.12], longe: 4.4 },  // andando no chão
  // As duas do Vulcão sobem sozinhas na animação, então nascem rente ao chão.
  spark:     { alto: [0.1, 0.8],  longe: 4.5 },
  smoke:     { alto: [0.05, 0.4], longe: 6 },
  // O floco desce na animação, então nasce embaixo e o ciclo o joga lá para
  // cima; pode cair em cima da pista, que é o que faz parecer nevando.
  snow:      { alto: [0, 0.5],    longe: 0 },
  rain:      { alto: [0, 0.5],    longe: 0 },   // igual ao floco: cai na animação
  seagull:   { alto: [3.5, 10],   longe: 0 },   // planando por cima da pista
  // O meteorito atravessa: o x vem da animação, então nasce no meio.
  meteorite: { alto: [-6, 16],    longe: 0 },
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
    this.wave = null;              // a onda da bomba, quando há uma
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
    // Pista sem `mountains` não tem horizonte: é o Espaço, onde a ausência de
    // chão e de serra é justamente o que dá a sensação de estar voando.
    if (track.mountains) this.root.add(createMountains(track));

    this.buildBackdrop();
    this.buildAmbience();
    this.buildStripes();
    this.buildDecorations();
    this.buildWaves();
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
      // No Espaço as estrelas também vêm por baixo: sem chão, é o que dá
      // a impressão de voar no meio delas.
      this.root.add(createStars(this.track.starsBelow ? 140 : 90, !!this.track.starsBelow));
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

    // Na Tempestade também cai raio: um só, guardado, que reaparece em
    // outro lugar do céu a cada trovão.
    if (this.track.lightning) {
      this.bolt = createLightningBolt();
      this.root.add(this.bolt);
      this.boltLife = 0;
    }

    if (this.track.backdrop === 'rainbow') {
      const rainbow = createRainbow();
      rainbow.position.set(0, -2, -78);
      this.root.add(rainbow);
      this.backdrop = rainbow;
    }
  }

  // Cai um raio: nasce num ponto qualquer do céu, do tamanho que der, e
  // fica no ar por um instante. Quem chama é o Game, junto com o clarão e o
  // trovão (ver Game.applyLightning).
  flashBolt() {
    if (!this.bolt) return;
    this.bolt.position.set(-30 + Math.random() * 60, 26 + Math.random() * 6, -70 - Math.random() * 14);
    this.bolt.scale.setScalar(0.8 + Math.random() * 0.6);
    this.bolt.rotation.z = (Math.random() - 0.5) * 0.4;
    this.bolt.visible = true;
    this.boltLife = 0.42;
  }

  // Ele não some de uma vez: pisca duas vezes e apaga, como raio de verdade.
  updateBolt(dt) {
    if (!this.bolt || this.boltLife <= 0) return;
    this.boltLife -= dt;
    if (this.boltLife <= 0) { this.bolt.visible = false; return; }
    const t = this.boltLife / 0.42;
    this.bolt.visible = Math.sin(t * 34) > -0.35;
    for (const parte of this.bolt.children) {
      if (parte.material) parte.material.opacity = Math.min(1, t * 1.5) * 0.95;
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
    const shore = this.track.shore;
    for (let i = 0; i < quantos; i++) {
      // Numa pista de beira-mar cada lado tem o seu conjunto: guarda-sol e
      // castelinho na areia, barco e prancha na água. O lado fica gravado no
      // enfeite, para ele voltar sempre do mesmo lado ao ser reciclado.
      const lado = shore ? (i % 2 === 0 ? shore.side : -shore.side) : 0;
      const nomes = !shore ? this.track.decorations
        : lado === shore.side ? shore.sandDecor : shore.seaDecor;
      const deco = createDecoration(this.track, nomes);
      deco.userData.side = lado;
      this.placeDecoration(deco, DESPAWN_DISTANCE - Math.random() * TRACK_LENGTH);
      this.group.add(deco);
      this.decorations.push(deco);
    }
  }

  // Cristas de onda espalhadas pela metade de água, que sobem e descem no
  // lugar enquanto correm com o mundo.
  buildWaves() {
    this.waves = [];
    const shore = this.track.shore;
    if (!shore) return;
    for (let i = 0; i < 22; i++) {
      const crista = createWaveCrest(shore.foam);
      this.placeWave(crista, DESPAWN_DISTANCE - Math.random() * TRACK_LENGTH);
      this.group.add(crista);
      this.waves.push(crista);
    }
  }

  placeWave(crista, z) {
    const shore = this.track.shore;
    crista.position.set(-shore.side * (5.5 + Math.random() * 26), 0.02, z);
  }

  placeDecoration(deco, z) {
    // Sem beira-mar, cai de qualquer lado; com, respeita o lado dele.
    const side = deco.userData.side || (Math.random() < 0.5 ? -1 : 1);
    // O que flutua fica um pouco afundado, e mais longe: barco encostado na
    // pista pareceria obstáculo.
    const naAgua = this.track.shore && side === -this.track.shore.side;
    const dist = naAgua ? 6.5 + Math.random() * 16 : 4.8 + Math.random() * 14;
    deco.position.set(side * dist, naAgua ? -0.12 : 0, z);
  }

  buildClouds() {
    // Pista sem `cloud` não tem nuvem nenhuma — é o caso do Oceano, que se
    // passa debaixo da água.
    if (!this.track.cloud) return;
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

  // Planta o portal de partida no começo da pista. Quem chama é o Game, no
  // início de toda corrida — e só ali: nas telas de menu o mundo está
  // parado, e um portal em volta do unicórnio atrapalharia a escolha.
  placeStart() {
    this.addMarker(createStartLine(), 0, START_AT);
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
    this.rowsSinceBarrier = 0;
    this.barrierDone = false;
    if (mode.scripted) this.clearLessonItems();
    for (const s of this.sparkles) { s.userData.life = 0; s.visible = false; }
    this.clearWave();
  }

  // ---- Bomba Arco-Íris -------------------------------------------------
  //
  // Uma parede de luz colorida sai de junto do unicórnio e varre a pista
  // para a frente, mais rápido do que se corre. Tudo o que ela alcança
  // desmancha: o obstáculo gira, encolhe, sobe e vira faíscas.
  //
  // A onda é uma só de cada vez — pegar duas bombas seguidas recomeça a
  // varredura em vez de acumular duas paredes.
  rainbowBlast() {
    this.clearWave();
    const mesh = createRainbowWave();
    mesh.position.z = WAVE_START_Z;
    this.group.add(mesh);
    this.wave = { mesh, z: WAVE_START_Z, idade: 0 };
  }

  clearWave() {
    if (!this.wave) return;
    this.group.remove(this.wave.mesh);
    this.wave.mesh.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      o.material.dispose();
    });
    this.wave = null;
  }

  // Marca para desmanchar tudo o que a onda já passou.
  updateWave(dt) {
    if (!this.wave) return;
    const onda = this.wave;
    onda.idade += dt;
    onda.z -= WAVE_SPEED * dt;
    onda.mesh.position.z = onda.z;
    // Vai crescendo e sumindo conforme se afasta, para não virar uma parede
    // sólida parada no horizonte.
    const t = Math.min(1, onda.idade / WAVE_TIME);
    onda.mesh.scale.set(1 + t * 0.55, 1 + t * 0.4, 1);
    // Some só no fim: desbotar desde o começo tirava a cortina justamente na
    // parte em que ela passa perto e aparece inteira.
    const fade = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
    for (const faixa of onda.mesh.children) {
      if (faixa.material) faixa.material.opacity = fade * (faixa.material.userData?.base ?? 0.9);
    }

    for (const e of this.entities) {
      if (e.userData.kind !== 'obstacle') continue;
      if (e.userData.knocked || e.userData.dissolving !== undefined) continue;
      // A onda está mais à frente (z menor) do que o obstáculo: já passou
      // por ele.
      if (e.position.z < onda.z) continue;
      this.dissolve(e);
    }

    if (t >= 1 || onda.z < SPAWN_DISTANCE) this.clearWave();
  }

  // O obstáculo desmancha: começa com um estouro de faíscas na cor dele e
  // some girando.
  dissolve(entity) {
    entity.userData.dissolving = 0;
    const cor = entity.children.find((c) => c.isMesh)?.material?.color?.getHex() ?? 0xffffff;
    this.burst(entity.position.clone().setY(0.9), cor);
    this.burst(entity.position.clone().setY(1.4), ARCO_IRIS[Math.floor(Math.random() * ARCO_IRIS.length)]);
  }

  // Um power-up a cada tantas linhas, e nunca dois seguidos.
  rollPowerup() {
    this.rowsSincePower += 1;
    if (this.rowsSincePower < 12) return null;
    if (Math.random() > 0.35) return null;

    // No modo Livre não há obstáculo nem vidas: fica de fora quem depende de
    // um dos dois (ver `needsObstacles` e `needsLives` em powerups.js). Lá só
    // nascem o Ímã e o Turbo, que são bons de qualquer jeito.
    const pool = POWERUP_LIST.filter(
      (p) => this.mode.obstacles || !(p.needsObstacles || p.needsLives)
    );
    this.rowsSincePower = 0;

    // Sorteio por peso: quase todos valem 1, a Bomba Arco-Íris vale 0,2. A
    // velocidade pode sobrescrever um peso (o Devagarinho põe a bomba em 1,
    // ver DIFFICULTIES.facil.powerWeights).
    const peso = (p) => this.mode.powerWeights?.[p.id] ?? p.weight ?? 1;
    const total = pool.reduce((soma, p) => soma + peso(p), 0);
    let ponto = Math.random() * total;
    for (const p of pool) {
      ponto -= peso(p);
      if (ponto <= 0) return p.id;
    }
    return pool[pool.length - 1].id;
  }

  // Chave mágica: só depois de passar `keyGap` linhas, e ainda assim por
  // sorteio — é o que deixa uma chave longe da outra na pista.
  rollKeyLane() {
    if (!this.mode.keyChance) return -1;
    this.rowsSinceKey += 1;
    // `keyLuck` é a Pérola (ver Game.reset): com ela a chave sai mais vezes,
    // e a espera mínima entre uma e outra encurta um pouco.
    const sorte = this.keyLuck ?? 1;
    if (this.rowsSinceKey < (this.mode.keyGap || 10) / sorte) return -1;
    if (Math.random() > this.mode.keyChance * sorte) return -1;
    this.rowsSinceKey = 0;
    return Math.floor(Math.random() * LANES.length);
  }

  // Barreira: ocupa as três pistas, então não tem desvio — ou pula, ou bate.
  // Por isso ela é rara, nunca vem colada na anterior e demora mais para
  // aparecer pela primeira vez.
  rollBarrier() {
    if (!this.mode.obstacles || !this.mode.barrierChance) return false;
    this.rowsSinceBarrier += 1;
    const espera = this.barrierDone ? BARRIER.gap : BARRIER.firstGap;
    if (this.rowsSinceBarrier < espera) return false;
    if (Math.random() > this.mode.barrierChance) return false;
    this.rowsSinceBarrier = 0;
    this.barrierDone = true;
    return true;
  }

  // ---- A lição do modo Aprender ----------------------------------------
  //
  // Aqui o mundo só monta a pista da aula. Quem decide quando a aula acaba,
  // se ela passou ou se precisa recomeçar é o Game (ver Game.updateLesson):
  // isso depende de a criança ter feito o movimento pedido, que é assunto de
  // jogo, não de cenário.
  spawnLessonItems(aula) {
    for (const item of aula.itens || []) this.addLessonItem(item, 0);
    // O `depois` nasce meio passo atrás: é o que o power-up da aula serve
    // para enfrentar, e precisa vir depois dele, não junto.
    for (const item of aula.depois || []) this.addLessonItem(item, -16);
  }

  // Ainda tem coisa da aula a caminho do unicórnio?
  get lessonAhead() {
    return this.entities.some((e) => e.userData.licao && e.position.z < 3);
  }

  // Tira da pista o que sobrou da aula (para recomeçá-la do zero).
  clearLessonItems() {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (!this.entities[i].userData.licao) continue;
      this.group.remove(this.entities[i]);
      this.entities.splice(i, 1);
    }
  }

  addLessonItem({ o, faixa = 1, altura, recuo: proprio }, recuo) {
    // O item pode dizer o próprio recuo, quando a aula depende da distância
    // entre duas coisas (é o caso dos dois obstáculos do pulo duplo).
    const z = LESSON_SPAWN_Z + (proprio ?? recuo);
    let obj;
    let y = altura ?? 1.15;

    if (o === 'barrier') {
      obj = createBarrier(this.track);
      y = 0;
      faixa = 1;
    } else if (o === 'rock') {
      obj = createObstacle(this.track);
      y = 0;
    } else if (o === 'key') {
      obj = createKey();
      y = altura ?? 1.2;
    } else if (o === 'heart') {
      obj = createHeart();
    } else if (o === 'star') {
      obj = createStar();
    } else {
      obj = createPowerup(o);
      y = altura ?? 1.25;
    }

    obj.userData.licao = true;
    obj.userData.baseY = y;
    obj.position.set(LANES[faixa], y, z);
    this.group.add(obj);
    this.entities.push(obj);
  }

  spawnRow(difficulty) {
    // Na lição quem manda na pista é o Game, uma aula por vez.
    if (this.mode.scripted) return;

    // A barreira toma a linha inteira: nada mais nasce junto, fora o prêmio
    // de quem pula, flutuando na altura do salto.
    if (this.rollBarrier()) {
      const barreira = createBarrier(this.track);
      barreira.position.set(0, 0, SPAWN_DISTANCE);
      this.group.add(barreira);
      this.entities.push(barreira);
      this.addEntity(this.makeCollectible(), 1, 1.75);
      return;
    }

    const powerId = this.rollPowerup();
    // Power-up e chave nunca saem na mesma linha, para não competirem.
    const keyLane = powerId === null ? this.rollKeyLane() : -1;

    // Modo Livre: nada de obstáculo, só itens espalhados pelas pistas — e a
    // chave, que antes era sorteada aqui em cima e jogada fora sem nunca
    // nascer. Quem só joga no Livre não via chave nenhuma na pista.
    if (!this.mode.obstacles) {
      const powerLane = powerId === null ? -1 : Math.floor(Math.random() * LANES.length);
      for (let lane = 0; lane < LANES.length; lane++) {
        if (lane === keyLane) this.addEntity(createKey(), lane, 1.2);
        else if (lane === powerLane) this.addEntity(createPowerup(powerId), lane, 1.25);
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
    // A altura com que ele nasceu é dele: sem isto o balanço abaixo puxava
    // todo colecionável para uma altura fixa por tipo, e o prêmio que fica
    // **em cima da barreira** (a 1,75) caía para 1,15 — dentro dela.
    obj.userData.baseY = y;
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
      // A roda-gigante gira, e as cabines penduradas ficam sempre em pé —
      // é o giro contrário que faz isso, o mesmo truque de uma roda de
      // verdade (ver ferrisWheel em scenery.js).
      const roda = deco.userData.roda;
      if (roda) {
        roda.rotation.z = elapsed * 0.35;
        for (const braco of roda.children) {
          if (braco.userData.pendurada) braco.rotation.z = -roda.rotation.z;
        }
      }

      // O que flutua balança na água em vez de ficar parado.
      if (deco.userData.side && this.track.shore && deco.userData.side === -this.track.shore.side) {
        deco.position.y = -0.12 + Math.sin(elapsed * 1.6 + deco.position.z * 0.35) * 0.09;
        deco.rotation.z = Math.sin(elapsed * 1.3 + deco.position.z * 0.3) * 0.07;
      }
    }

    for (const crista of this.waves || []) {
      crista.position.z += move;
      if (crista.position.z > DESPAWN_DISTANCE + 4) this.placeWave(crista, SPAWN_DISTANCE - Math.random() * 20);
      // Sobe, desce e estica: é o que faz a água parecer viva.
      const t = elapsed * 1.7 + crista.userData.fase;
      crista.position.y = 0.02 + Math.sin(t) * 0.05;
      crista.scale.x = 0.8 + Math.sin(t * 0.8) * 0.25;
      crista.children[0].material.opacity = 0.22 + (Math.sin(t) * 0.5 + 0.5) * 0.3;
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

      // Obstáculo alcançado pela onda da bomba: gira, encolhe, sobe e some.
      if (e.userData.dissolving !== undefined) {
        e.userData.dissolving += dt;
        const t = Math.min(1, e.userData.dissolving / DISSOLVE_TIME);
        e.scale.setScalar(Math.max(0.001, 1 - t));
        e.rotation.y += dt * 11;
        e.rotation.x += dt * 5;
        e.position.y += dt * 2.4;
        if (t >= 1) {
          this.group.remove(e);
          this.entities.splice(i, 1);
        }
        continue;
      }

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
        // `baseY` é onde ele foi posto; os padrões por tipo só valem para o
        // que nasceu sem altura dita (nada, hoje).
        const base = e.userData.baseY ?? (e.userData.kind === 'powerup' ? 1.3
          : e.userData.kind === 'key' ? 1.2 : 1.15);
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

    this.updateWave(dt);

    this.updateBolt(dt);

    if (this.backdrop) this.backdrop.rotation.z = Math.sin(elapsed * 0.2) * 0.03;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnRow(difficulty);
      this.spawnTimer = this.mode.spawnInterval * (1.1 - difficulty * 0.25);
    }
  }
}
