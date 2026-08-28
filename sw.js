// Service worker do UnicornRush.
//
// O jogo inteiro cabe no cache (não tem nada vindo de fora), então depois da
// primeira visita ele abre offline — inclusive instalado na tela inicial.
// Ao mudar arquivos, troque a versão abaixo: o cache velho é apagado sozinho.
const VERSION = 'unicornrush-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style.css',
  './fonts.css',
  './assets/fonts/fredoka-latin.woff2',
  './assets/fonts/fredoka-latin-ext.woff2',
  './assets/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './vendor/three.module.js',
  './vendor/three.core.js',
  './src/main.js',
  './src/game/Game.js',
  './src/game/audio.js',
  './src/game/config.js',
  './src/game/input.js',
  './src/game/levels.js',
  './src/game/music.js',
  './src/game/storage.js',
  './src/game/tracks.js',
  './src/game/ui.js',
  './src/game/world.js',
  './src/models/auras.js',
  './src/models/characters.js',
  './src/models/collectibles.js',
  './src/models/powerups.js',
  './src/models/rainbowTrail.js',
  './src/models/scenery.js',
  './src/models/unicorn.js',
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
