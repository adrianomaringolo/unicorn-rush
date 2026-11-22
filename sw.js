// Service worker do UnicornRush.
//
// O jogo inteiro cabe no cache (não tem nada vindo de fora), então depois da
// primeira visita ele abre offline — inclusive instalado na tela inicial.
//
// O nome do cache carrega a versão do jogo: ao subi-la (com `npm run bump`),
// o cache velho é apagado sozinho no aparelho de quem já jogou.
const VERSION = 'unicornrush-v0.49.0';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style.css',
  './fonts.css',
  './assets/fonts/fredoka-latin.woff2',
  './assets/fonts/fredoka-latin-ext.woff2',
  './assets/loading/uni.webp',
  './assets/icons/icon-64.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './vendor/three.module.js',
  './vendor/three.core.js',
  // O `src/main.js` importa este daqui (é o Web Analytics, vendorizado como
  // o three.js). Import estático que não resolve derruba o main.js inteiro,
  // e com ele o jogo: se falta no cache, quem abre offline fica na tela de
  // carregamento.
  './vendor/vercel-analytics.js',
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
  './src/game/update.js',
  './src/game/storage.js',
  './src/game/i18n.js',
  './src/game/i18n-en.js',
  './src/game/story.js',
  './src/game/tracks.js',
  './src/game/tutorial.js',
  './src/game/ui.js',
  './src/game/world.js',
  './src/models/auras.js',
  './src/models/characterAura.js',
  './src/models/characters.js',
  './src/models/collectibles.js',
  './src/models/powerups.js',
  './src/models/portraits.js',
  './src/models/keyReward.js',
  './src/models/rainbowTrail.js',
  './src/models/trackPortraits.js',
  './src/models/scenery.js',
  './src/models/unicorn.js',
  './src/models/viewer3d.js',
  './src/models/accessories.js',
  './src/models/stickers.js',
  // As onze figuras do livro da história (~1 MB no total). As duas últimas
  // só aparecem para quem libertou todos os amigos, mas entram no cache
  // junto: o service worker instala tudo de uma vez.
  './assets/story/1.webp',
  './assets/story/2.webp',
  './assets/story/3.webp',
  './assets/story/4.webp',
  './assets/story/5.webp',
  './assets/story/6.webp',
  './assets/story/7.webp',
  './assets/story/8.webp',
  './assets/story/9.webp',
  './assets/story/10.webp',
  './assets/story/11.webp',
  // Os ícones do jogo (assets/icones/): sem eles no cache, o jogo instalado
  // abriria offline com buracos no lugar dos ícones.
  './assets/icones/1st_place_medal.svg',
  './assets/icones/baby_bottle.svg',
  './assets/icones/backhand_index_pointing_up.svg',
  './assets/icones/balloon.svg',
  './assets/icones/bar_chart.svg',
  './assets/icones/black_heart.svg',
  './assets/icones/broom.svg',
  './assets/icones/bubbles.svg',
  './assets/icones/cactus.svg',
  './assets/icones/check_mark_button.svg',
  './assets/icones/chequered_flag.svg',
  './assets/icones/cloud.svg',
  './assets/icones/crescent_moon.svg',
  './assets/icones/crown.svg',
  './assets/icones/dizzy.svg',
  './assets/icones/fire.svg',
  './assets/icones/globe_with_meridians.svg',
  './assets/icones/growing_heart.svg',
  './assets/icones/high_voltage.svg',
  './assets/icones/house.svg',
  './assets/icones/key.svg',
  './assets/icones/leaf_fluttering_in_wind.svg',
  './assets/icones/left_arrow.svg',
  './assets/icones/locked.svg',
  './assets/icones/lollipop.svg',
  './assets/icones/magnet.svg',
  './assets/icones/mobile_phone_with_arrow.svg',
  './assets/icones/musical_note.svg',
  './assets/icones/muted_speaker.svg',
  './assets/icones/octopus.svg',
  './assets/icones/popcorn.svg',
  './assets/icones/open_book.svg',
  './assets/icones/party_popper.svg',
  './assets/icones/pause_button.svg',
  './assets/icones/person_running.svg',
  './assets/icones/play_button.svg',
  './assets/icones/rainbow.svg',
  './assets/icones/repeat_button.svg',
  './assets/icones/right_arrow.svg',
  './assets/icones/rock.svg',
  './assets/icones/shield.svg',
  './assets/icones/sparkles.svg',
  './assets/icones/sparkling_heart.svg',
  './assets/icones/speaker_high_volume.svg',
  './assets/icones/speaker_low_volume.svg',
  './assets/icones/star.svg',
  './assets/icones/strawberry.svg',
  './assets/icones/sun.svg',
  './assets/icones/sun_with_face.svg',
  './assets/icones/trophy.svg',
  './assets/icones/tropical_fish.svg',
  './assets/icones/turtle.svg',
  './assets/icones/unicorn.svg',
  './assets/icones/up_arrow.svg',
  './assets/icones/warning.svg',
  './assets/icones/test_tube.svg',
  './assets/icones/circus_tent.svg',
  './assets/icones/fog.svg',
  './assets/icones/cherries.svg',
  './assets/icones/lemon.svg',
  './assets/icones/crystal_ball.svg',
  './assets/icones/gem_stone.svg',
  './assets/icones/top_hat.svg',
  './assets/icones/bat.svg',
  './assets/icones/ice.svg',
  './assets/icones/coconut.svg',
  './assets/icones/comet.svg',
  './assets/icones/snowflake.svg',
  './assets/icones/rocket.svg',
  './assets/icones/beach_with_umbrella.svg',
  './assets/icones/volcano.svg',
  './assets/icones/spiral_shell.svg',
  './assets/icones/water_wave.svg',
  './assets/icones/white_heart.svg',
  './assets/icones/world_map.svg',
  './assets/icones/counterclockwise_arrows_button.svg',
  './assets/icones/shuffle_tracks_button.svg',
  './assets/icones/information.svg',
  './assets/icones/red_question_mark.svg',
  './assets/icones/plus.svg',
  './assets/icones/pencil.svg',
  './assets/icones/wastebasket.svg',
  './assets/icones/speaking_head.svg',
  './assets/icones/waving_hand.svg',
  './assets/icones/wrapped_gift.svg',
  './assets/icones/globe_showing_americas.svg',
  './assets/icones/fallen_leaf.svg',
  './assets/icones/parrot.svg',
  './assets/icones/feather.svg',
  './assets/icones/ribbon.svg',
  './assets/icones/ledger.svg',
  './assets/icones/butterfly.svg',
  './assets/icones/cherry_blossom.svg',
  './assets/icones/dark_sunglasses.svg',
  './assets/icones/prayer_beads.svg',
  './assets/icones/scarf.svg',
  './assets/icones/smiling_face_with_heart_eyes.svg',
  './assets/icones/sports_medal.svg',
  './assets/icones/blossom.svg',
  './assets/icones/hibiscus.svg',
  './assets/icones/socks.svg',
  './assets/icones/santa_claus.svg',
  './assets/icones/deer.svg',
  './assets/icones/christmas_tree.svg',
  './assets/icones/bell.svg',
  './assets/icones/headphone.svg',
  './assets/icones/dragon.svg',
  './assets/icones/flag_brazil.svg',
  './assets/icones/flag_united_states.svg',
];

// Sem `skipWaiting()` aqui de propósito: o worker novo instala e **espera**.
// A página aberta segue inteira no cache velho — consistente —, e quem
// manda ele assumir é o botão "Atualizar" do jogo (ver src/game/update.js).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL))
  );
});

// É o jogo que pede a troca, quando o adulto toca em Atualizar.
self.addEventListener('message', (event) => {
  if (event.data?.tipo === 'assumir') self.skipWaiting();

  // Quem pergunta é o convite de atualização: ele guarda **qual** versão a
  // pessoa mandou ignorar, para não voltar a perguntar pela mesma. Sem isto
  // o "agora não" duraria só até a próxima abertura do jogo.
  if (event.data?.tipo === 'versao') {
    event.source?.postMessage({ tipo: 'versao', versao: VERSION });
  }
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
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // O Web Analytics mora no nosso domínio (`/_vercel/insights/…`), mas não é
  // do jogo: é medição, e medição servida do cache mente. O `script.js`
  // congelaria na versão do dia da instalação, e cachear é justamente o que
  // não se quer de um farol. Vai direto para a rede — e quando não houver
  // rede, que falhe: perder uma medição é de graça, o jogo não depende dela.
  if (url.pathname.startsWith('/_vercel/')) return;

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
