// Service worker do UnicornRush.
//
// O jogo inteiro cabe no cache (não tem nada vindo de fora), então depois da
// primeira visita ele abre offline — inclusive instalado na tela inicial.
//
// O nome do cache carrega a versão do jogo: ao subi-la (com `npm run bump`),
// o cache velho é apagado sozinho no aparelho de quem já jogou.
const VERSION = 'unicornrush-v0.3.2';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style.css',
  './fonts.css',
  './assets/fonts/fredoka-latin.woff2',
  './assets/fonts/fredoka-latin-ext.woff2',
  './assets/icons/icon-64.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './vendor/three.module.js',
  './vendor/three.core.js',
  './src/main.js',
  './src/game/Game.js',
  './src/game/audio.js',
  './src/game/config.js',
  './src/game/input.js',
  './src/game/install.js',
  './src/game/levels.js',
  './src/game/music.js',
  './src/game/speech.js',
  './src/game/icons.js',
  './src/game/version.js',
  './src/game/storage.js',
  './src/game/tracks.js',
  './src/game/ui.js',
  './src/game/world.js',
  './src/models/auras.js',
  './src/models/characters.js',
  './src/models/collectibles.js',
  './src/models/powerups.js',
  './src/models/portraits.js',
  './src/models/rainbowTrail.js',
  './src/models/trackPortraits.js',
  './src/models/scenery.js',
  './src/models/unicorn.js',
  // Ícones do Fluent Emoji: sem eles no cache, o jogo instalado abriria
  // offline com buracos no lugar dos ícones.
  './assets/emoji/1st_place_medal.png',
  './assets/emoji/baby_bottle.png',
  './assets/emoji/backhand_index_pointing_up.png',
  './assets/emoji/balloon.png',
  './assets/emoji/bar_chart.png',
  './assets/emoji/black_heart.png',
  './assets/emoji/broom.png',
  './assets/emoji/bubbles.png',
  './assets/emoji/cactus.png',
  './assets/emoji/check_mark_button.png',
  './assets/emoji/chequered_flag.png',
  './assets/emoji/cloud.png',
  './assets/emoji/crescent_moon.png',
  './assets/emoji/crown.png',
  './assets/emoji/dizzy.png',
  './assets/emoji/fire.png',
  './assets/emoji/globe_with_meridians.png',
  './assets/emoji/growing_heart.png',
  './assets/emoji/high_voltage.png',
  './assets/emoji/house.png',
  './assets/emoji/key.png',
  './assets/emoji/leaf_fluttering_in_wind.png',
  './assets/emoji/left_arrow.png',
  './assets/emoji/locked.png',
  './assets/emoji/lollipop.png',
  './assets/emoji/magnet.png',
  './assets/emoji/mobile_phone_with_arrow.png',
  './assets/emoji/musical_note.png',
  './assets/emoji/muted_speaker.png',
  './assets/emoji/octopus.png',
  './assets/emoji/party_popper.png',
  './assets/emoji/pause_button.png',
  './assets/emoji/person_running.png',
  './assets/emoji/play_button.png',
  './assets/emoji/rainbow.png',
  './assets/emoji/repeat_button.png',
  './assets/emoji/right_arrow.png',
  './assets/emoji/rock.png',
  './assets/emoji/shield.png',
  './assets/emoji/sparkles.png',
  './assets/emoji/sparkling_heart.png',
  './assets/emoji/speaker_high_volume.png',
  './assets/emoji/speaker_low_volume.png',
  './assets/emoji/star.png',
  './assets/emoji/strawberry.png',
  './assets/emoji/sun.png',
  './assets/emoji/sun_with_face.png',
  './assets/emoji/trophy.png',
  './assets/emoji/tropical_fish.png',
  './assets/emoji/turtle.png',
  './assets/emoji/unicorn.png',
  './assets/emoji/up_arrow.png',
  './assets/emoji/warning.png',
  './assets/emoji/ice.png',
  './assets/emoji/coconut.png',
  './assets/emoji/comet.png',
  './assets/emoji/snowflake.png',
  './assets/emoji/rocket.png',
  './assets/emoji/beach_with_umbrella.png',
  './assets/emoji/volcano.png',
  './assets/emoji/water_wave.png',
  './assets/emoji/white_heart.png',
  './assets/emoji/world_map.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Cache primeiro (abre rápido e funciona offline); em paralelo, busca
      // uma versão nova para a próxima vez.
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
