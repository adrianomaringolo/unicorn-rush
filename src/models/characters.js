// Os unicórnios jogáveis.
//
// Cada personagem descreve as cores do corpo, o estilo do chifre, das asas e
// da marca na anca, as cores da crina e do rastro que ele deixa na pista.
// O modelo 3D é o mesmo código (src/models/unicorn.js) montado com estes
// valores — por isso dá para inventar um personagem novo só acrescentando
// uma entrada aqui.
//
// Só a **Uni** vem liberada. Todo o resto tem `price` e é trocado por chaves
// mágicas 🔑 (as chaves ficam guardadas para sempre; ver Game.buyItem).
//
// O elenco planejado é de CHARACTER_SLOTS unicórnios: os que ainda não
// existem aparecem na grade como espaço vazio, para a criança ver que tem
// mais coisa vindo.

export const CHARACTERS = {
  uni: {
    id: 'uni',
    name: 'Uni',
    emoji: '🌈',
    title: 'a unicórnia arco-íris',
    story: 'Uni nasceu na ponta de um arco-íris, num dia de sol com chuva. '
      + 'Onde ela pisa fica colorido, e ela adora dividir corações com quem encontra pelo caminho.',
    body: 0xfffaff,
    hoof: 0xffc9de,
    muzzle: 0xff9dc0,
    horn: { color: 0xffd166, length: 0.62, radius: 0.09 },
    hair: [0xff8fb1, 0xffd166, 0x8ce99a, 0x74c0fc, 0xb197fc],
    wing: { style: 'feather', colors: [0xfdf3ff, 0xf3e6ff, 0xe9dcff, 0xf0d9fb, 0xffd8ef, 0xffc9e6, 0xffbfe0] },
    mark: { shape: 'rainbow', color: 0xff8fb1 },
    // o arco-íris do Campo é dela
    fast: ['campo'],
    trail: { colors: [0xff7b9d, 0xffb26b, 0xffe36b, 0x8ce99a, 0x74c0fc, 0xc09cff], width: 0.8 },
  },

  sol: {
    id: 'sol',
    name: 'Sol',
    emoji: '☀️',
    title: 'o unicórnio do amanhecer',
    story: 'Sol acorda antes de todo mundo para acender o dia. '
      + 'Quando ele galopa, deixa um rastro morninho de laranja e dourado que faz as flores abrirem.',
    price: 4,
    body: 0xfff1d6,
    hoof: 0xffb570,
    muzzle: 0xffa96b,
    horn: { color: 0xffab1f, length: 0.55, radius: 0.11 },
    hair: [0xffb02e, 0xffd75e, 0xff7a3c, 0xffe9a3, 0xff9433],
    wing: { style: 'ray', colors: [0xfff3c4, 0xffe38a, 0xffcf5c, 0xffb92e, 0xffa11f] },
    mark: { shape: 'sun', color: 0xffab1f },
    // o sol mora no Céu e amadurece as Frutas
    fast: ['ceu', 'frutas'],
    // O dia dele é mais longo: os power-ups duram metade a mais.
    powerTime: 1.5,
    power: 'os power-ups duram mais tempo com ele',
    trail: { colors: [0xfff0b0, 0xffd75e, 0xffb02e, 0xff9433, 0xff7a3c, 0xffc46b], width: 0.8 },
  },

  lua: {
    id: 'lua',
    name: 'Lua',
    emoji: '🌙',
    title: 'a unicórnia da noite',
    story: 'Lua só sai quando o céu escurece, para cuidar dos sonhos de quem dorme. '
      + 'Seu rastro é um pedacinho de céu estrelado, e ela conhece todos os atalhos da noite.',
    price: 6,
    body: 0xe9e6ff,
    hoof: 0xb0a6f0,
    muzzle: 0xb9aef5,
    horn: { color: 0xd7dcff, length: 0.66, radius: 0.085 },
    hair: [0x6d7fe0, 0x9a7ae0, 0x5b6bd6, 0xbcaef5, 0x7a5cc4],
    wing: { style: 'veil', colors: [0xdfe4ff, 0xc9d0ff, 0xb4b9ff] },
    mark: { shape: 'moon', color: 0xbcaef5 },
    // a Noite é a hora dela, e a Geada tem o mesmo silêncio
    fast: ['noite', 'geada'],
    // Conhece os atalhos: os itens vêm um pouquinho até ela, sempre.
    magnetRange: 3.4,
    power: 'os corações chegam mais perto dela sozinhos',
    trail: { colors: [0xe3dcff, 0xbcaef5, 0x9a7ae0, 0x6d7fe0, 0x5b6bd6, 0x8ea3ff], width: 0.75 },
  },

  brasa: {
    id: 'brasa',
    name: 'Brasa',
    emoji: '🔥',
    title: 'o unicórnio de fogo',
    story: 'Brasa é o maior da turma e corre tão rápido que a crina dele pega fogo. '
      + 'Onde ele passa fica um caminho de brasas quentinhas que some devagar.',
    price: 16,
    body: 0x3a2f3f,
    hoof: 0xff8a3c,
    muzzle: 0xff6b3c,
    horn: { color: 0xffb02e, length: 0.78, radius: 0.1 },
    hair: [0xffd166, 0xff8a1f, 0xff4d1f, 0xffb02e, 0xff6b0f],
    wing: { style: 'ray', colors: [0xfff0a8, 0xffd166, 0xffab1f, 0xff7a1f, 0xff4d1f] },
    mark: { shape: 'flame', color: 0xff8a1f },
    // Macho grandão: maior que os outros e de pernas compridas.
    scale: 1.18,
    proportions: { head: 0.95, legs: 1.1, eye: 0.9 },
    fiery: true,          // crina e rabo com labaredas (ver unicorn.js)
    voice: 0.8,           // voz mais grave que a dos outros
    // o Vulcão é a casa dele, e as brasas iluminam a Noite
    fast: ['vulcao', 'noite'],
    // Corre tão rápido que a crina pega fogo: a velocidade sobe 60% mais
    // depressa. Mais ponto por segundo, e mais obstáculo também.
    speedRamp: 1.6,
    power: 'ele ganha velocidade muito mais rápido',
    trail: { colors: [0xfff3c4, 0xffd166, 0xffab1f, 0xff7a1f, 0xff4d1f, 0xff2f0f], width: 1.05 },
  },

  lulu: {
    id: 'lulu',
    name: 'Lulu',
    emoji: '🤍',
    title: 'a unicórnia bebê',
    story: 'Lulu é a menorzinha do grupo e ainda está aprendendo a voar. '
      + 'Ela é branquinha como nuvem e deixa um fiozinho de brilho por onde passa.',
    price: 12,
    body: 0xffffff,
    hoof: 0xffd9e8,
    muzzle: 0xffc2dc,
    horn: { color: 0xfff0c9, length: 0.34, radius: 0.085 },
    hair: [0xffcfe4, 0xcfe6ff, 0xffeec2, 0xe3cfff, 0xffdcec],
    wing: { style: 'feather', colors: [0xffffff, 0xfff6fb, 0xffe9f4, 0xf2f6ff, 0xffeef8] },
    mark: { shape: 'heart', color: 0xffb3d1 },
    // Bebê: pequenina, cabeçuda e de perninhas curtas.
    scale: 0.78,
    proportions: { head: 1.35, legs: 0.72, eye: 1.35 },
    voice: 1.5,          // voz de bebê: sons de coleta bem mais agudos
    // É a bebê: todo mundo cuida dela, então corre com uma vida a mais.
    extraLives: 1,
    power: 'ela corre com uma vidinha extra',
    // branquinha como as nuvens do Céu
    fast: ['ceu'],
    trail: { colors: [0xffffff, 0xfff2f8, 0xffe4f1, 0xeaf3ff, 0xfff8e6, 0xfdefff], width: 0.3 },
  },

  estrela: {
    id: 'estrela',
    name: 'Estrela',
    emoji: '⭐',
    title: 'a unicórnia que caiu do céu',
    story: 'Estrela caiu do céu numa noite de agosto e resolveu ficar para brincar. '
      + 'Ela brilha tanto que as estrelinhas da pista aparecem só para correr junto.',
    price: 9,
    body: 0xfff8e6,
    hoof: 0xffe08a,
    muzzle: 0xffd9a8,
    horn: { color: 0xffe066, length: 0.7, radius: 0.085 },
    hair: [0xffe066, 0xfff0f6, 0xbfe3ff, 0xffd9ef, 0xfff3b0],
    wing: { style: 'feather', colors: [0xffffff, 0xfff8dd, 0xfff0b0, 0xffe9a3, 0xffe066, 0xfff0f6, 0xffd9ef] },
    mark: { shape: 'star', color: 0xffd166 },
    // ela caiu de lá: no Espaço está em casa
    fast: ['espaco', 'noite'],
    // As estrelinhas da pista são parentes dela: valem o dobro.
    starValue: 2,
    power: 'as estrelas ⭐ valem o dobro para ela',
    trail: { colors: [0xffffff, 0xfff8dd, 0xfff3b0, 0xffe066, 0xffd166, 0xfff0f6], width: 0.7 },
  },

  // --- Os três de chiclete, mato e mar -------------------------------------

  chiclete: {
    id: 'chiclete',
    name: 'Chiclete',
    emoji: '🫧',
    title: 'a unicórnia de chiclete',
    story: 'Chiclete faz bolhas do tamanho da cabeça dela e sai quicando pela pista. '
      + 'Quando a bolha estoura, ela ri tanto que precisa parar para respirar.',
    price: 20,
    body: 0xffb3d9,
    hoof: 0xff7ab8,
    muzzle: 0xff8ac4,
    horn: { color: 0xfff0f6, length: 0.5, radius: 0.1 },
    hair: [0xff5d8f, 0xff9ecb, 0xfff0a8, 0xff7ab8, 0xffd9ef],
    wing: { style: 'feather', colors: [0xffd9ef, 0xffc2e4, 0xffabd9, 0xff9ecb, 0xffb3d1] },
    mark: { shape: 'bubble', color: 0xff2d7a },
    // Quica: pequenina, cabeçuda e de olho grande.
    scale: 0.92,
    proportions: { head: 1.1, legs: 0.95, eye: 1.15 },
    voice: 1.2,
    // os Doces são a casa dela
    fast: ['doces'],
    // A bolha de chiclete protege: ela começa cada corrida de escudo.
    startShield: 5,
    power: 'começa cada corrida dentro de uma bolha',
    trail: { colors: [0xfff0f6, 0xffd9ef, 0xffabd9, 0xff5d8f, 0xff9ecb, 0xffc2e4], width: 0.65 },
  },

  musgo: {
    id: 'musgo',
    name: 'Musgo',
    emoji: '🍃',
    title: 'o unicórnio da floresta',
    story: 'Musgo é o mais calmo da turma e conhece cada árvore pelo nome. '
      + 'Onde ele cochila de tarde, no dia seguinte nasce uma flor.',
    price: 26,
    body: 0xdff0d2,
    hoof: 0x7fae62,
    muzzle: 0x9cc47f,
    horn: { color: 0xb98a4f, length: 0.6, radius: 0.115 },   // chifre de madeira
    hair: [0x4f9d3a, 0x7fc45a, 0x2f7a26, 0xa8d98a, 0x5faf46],
    wing: { style: 'feather', colors: [0xd9f0c4, 0xbfe3a8, 0xa8d98a, 0x8ecb6b, 0x7fc45a] },
    mark: { shape: 'leaf', color: 0x4f9d3a },
    // Atarracado: perna curta e corpo largo, de quem anda sem pressa.
    scale: 1.06,
    proportions: { head: 1.05, legs: 0.92, eye: 1.05 },
    voice: 0.92,
    // mato e pomar são o quintal dele
    fast: ['campo', 'frutas'],
    // O mais calmo: a velocidade sobe bem devagar. É o mais fácil de guiar.
    speedRamp: 0.55,
    power: 'a corrida dele acelera bem devagarinho',
    trail: { colors: [0xe6f7d9, 0xc4ebaa, 0xa8d98a, 0x7fc45a, 0x4f9d3a, 0xd9f0c4], width: 0.85 },
  },

  onda: {
    id: 'onda',
    name: 'Onda',
    emoji: '🌊',
    title: 'a unicórnia do mar',
    story: 'Onda nasceu numa espuma de onda grande e nunca aprendeu a andar devagar. '
      + 'Debaixo d\'água ela é a mais rápida de todas, e adora aparecer de surpresa.',
    price: 32,
    // Turquesa de água funda, não o azul claro do gelo — e o chifre e uma
    // mecha de coral, para ela ter um acento quente que o Floco não tem.
    body: 0x5fc9c4,
    hoof: 0x2f8ea1,
    muzzle: 0x9ae5dd,
    horn: { color: 0xffa8b8, length: 0.72, radius: 0.08 },
    hair: [0x0077b6, 0x00b4d8, 0xff8fb8, 0x23a6c9, 0x0a5c8f],
    // Asa de véu, que aqui lê como nadadeira.
    wing: { style: 'veil', colors: [0x9ae5dd, 0x6fd0c9, 0x4bb8b2] },
    mark: { shape: 'wave', color: 0x004e73 },
    // Esguia e de perna comprida: a mais rápida de se olhar.
    scale: 0.95,
    proportions: { head: 0.94, legs: 1.1, eye: 1.0 },
    voice: 1.12,
    // nasceu na espuma: o Oceano e a Praia são dela
    fast: ['oceano', 'praia'],
    // A mais rápida de todas: ela passa do teto de velocidade da pista.
    topSpeed: 1.14,
    power: 'ela corre mais rápido do que a pista deixa',
    trail: { colors: [0xffffff, 0xcaf0f8, 0x90e0ef, 0x48cae4, 0x00b4d8, 0x0077b6], width: 0.7 },
  },

  // --- Os três das pistas novas --------------------------------------------

  floco: {
    id: 'floco',
    name: 'Floco',
    emoji: '🧊',
    title: 'o unicórnio de gelo',
    story: 'Floco dorme o verão inteiro e acorda no primeiro dia frio. '
      + 'Ele sopra baixinho e o ar vira purpurina de gelo atrás dele.',
    price: 34,
    // Azul-gelo de verdade, não branco: o elenco já tem três claros (Uni,
    // Lulu e Estrela) e um quarto se perderia no meio deles. Contra a Onda,
    // que é turquesa (puxa para o verde), este puxa para o azul.
    body: 0xa8cdf0,
    hoof: 0x6b8fc4,
    muzzle: 0xc9dcf5,
    horn: { color: 0xe4ecff, length: 0.68, radius: 0.095 },
    hair: [0x3d5cb8, 0x8ea3ff, 0xdfe4ff, 0x5b76d6, 0xc9d0ff],
    // Asa de pena, não de véu: mais uma coisa que os separa de longe.
    wing: { style: 'feather', colors: [0xffffff, 0xe4ecff, 0xc9dcf5, 0xa8cdf0, 0xdfe4ff] },
    mark: { shape: 'snowflake', color: 0x6b7fe0 },
    // Mais parrudo e de perna curta, de quem dorme o verão inteiro — o
    // oposto da Onda, que é esguia.
    scale: 1.03,
    proportions: { head: 1.06, legs: 0.96, eye: 1.05 },
    voice: 1.08,
    // a Geada é dele, e a Noite gela do mesmo jeito
    fast: ['geada', 'noite'],
    // Ele é do gelo: chão escorregadio não o atrapalha (ignora o `laneGrip`
    // da pista).
    steady: true,
    power: 'não escorrega no gelo da Geada',
    trail: { colors: [0xffffff, 0xdff4ff, 0xbfe9ff, 0x9ed8f5, 0x5fc4f0, 0x2f9bff], width: 0.7 },
  },

  coco: {
    id: 'coco',
    name: 'Coco',
    emoji: '🥥',
    title: 'o unicórnio da praia',
    story: 'Coco passou tanto tempo dormindo debaixo do coqueiro que ficou da cor da casca. '
      + 'Ele conhece o lugar exato onde a onda faz mais espuma.',
    price: 38,
    // O único marrom do elenco.
    body: 0xb5875a,
    hoof: 0x7d5a38,
    muzzle: 0xd9ab7d,
    horn: { color: 0xfff0c9, length: 0.56, radius: 0.11 },
    hair: [0x5faf46, 0x7fc45a, 0x3f7d3a, 0xa8d98a, 0x6bbf52],
    wing: { style: 'feather', colors: [0xd9f0c4, 0xa8d98a, 0x7fc45a, 0xfff0c9, 0xffe3a8] },
    mark: { shape: 'shell', color: 0xffd9ef },
    // Redondinho e de perna curta, de quem vive deitado na areia.
    scale: 0.98,
    proportions: { head: 1.08, legs: 0.94, eye: 1.08 },
    voice: 1.05,
    // a Praia é dele, e no pomar ele também se dá bem
    fast: ['praia', 'frutas'],
    // Casca dura: a primeira batida de cada corrida não custa vida.
    firstHitFree: true,
    power: 'a primeira batida não machuca ele',
    trail: { colors: [0xfff0c9, 0xffe3a8, 0xd9f0c4, 0xa8d98a, 0x7fc45a, 0xffd9ef], width: 0.8 },
  },

  cometa: {
    id: 'cometa',
    name: 'Cometa',
    emoji: '☄️',
    title: 'o unicórnio do espaço',
    story: 'Cometa não sabe parar: desde que nasceu está atravessando o céu. '
      + 'Dizem que quem consegue acompanhá-lo ganha um pedido.',
    price: 42,
    // Índigo — precisa ler como roxo, não como preto: no tamanho da grade um
    // corpo escuro demais se confunde com o do Brasa.
    body: 0x4a3f96,
    hoof: 0x8ce9ff,
    muzzle: 0x6b5fc4,
    horn: { color: 0x8ce9ff, length: 0.8, radius: 0.085 },
    hair: [0x8ce9ff, 0xff8fd8, 0xc9a6ff, 0x5fc4f0, 0xffd166],
    // Asa em raios: lê como a cauda de um cometa.
    wing: { style: 'ray', colors: [0xfff0c9, 0x8ce9ff, 0xc9a6ff, 0xff8fd8, 0x5fc4f0] },
    mark: { shape: 'comet', color: 0x8ce9ff },
    // Perna comprida e cabeça pequena: o mais rápido de se olhar.
    scale: 1.04,
    proportions: { head: 0.9, legs: 1.14, eye: 0.95 },
    voice: 0.95,
    // ele é de lá
    fast: ['espaco'],
    // Não sabe parar: pula uma terceira vez no ar.
    extraJump: 1,
    power: 'ele pula três vezes no ar',
    trail: { colors: [0xffffff, 0x8ce9ff, 0xc9a6ff, 0xff8fd8, 0x5fc4f0, 0xffd166], width: 0.95 },
  },

  // --- Os seis com jeito próprio de correr -----------------------------------
  //
  // Estes não mudam só de cor: cada um tem um campo que mexe em como se
  // joga (`laneGrip`, `jumpBoost`, `airGlide`, `glow`, `translucent`), lido
  // no Game.updatePlayer do mesmo jeito que as mecânicas de pista.

  cereja: {
    id: 'cereja',
    name: 'Cereja',
    emoji: '🍒',
    title: 'a unicórnia mais ligeira',
    story: 'Cereja não anda: ela desvia. Dizem que consegue trocar de pista '
      + 'duas vezes antes de a poeira do primeiro desvio assentar.',
    price: 44,
    // O vermelho que faltava no elenco.
    body: 0xe03050,
    hoof: 0x8f1a30,
    muzzle: 0xf06a80,
    horn: { color: 0xfff0c9, length: 0.58, radius: 0.09 },
    hair: [0x2f7a26, 0x5faf46, 0xa8d98a, 0x3f8f2f, 0x7fc45a],
    wing: { style: 'ray', colors: [0xffd9e0, 0xff9eb0, 0xe03050, 0xff7a90, 0xffc2cc] },
    // Círculo com brilho, em vermelho: lê como cereja.
    mark: { shape: 'bubble', color: 0x8f1a30 },
    scale: 0.93,
    proportions: { head: 1, legs: 1.04, eye: 1.1 },
    voice: 1.15,
    // Troca de faixa quase 50% mais rápido — é o jeitão dela.
    laneGrip: 1.5,
    fast: ['parque', 'doces'],
    power: 'ela desvia de pista muito mais rápido',
    trail: { colors: [0xffd9e0, 0xff9eb0, 0xe03050, 0x5faf46, 0x2f7a26, 0xff7a90], width: 0.6 },
  },

  limao: {
    id: 'limao',
    name: 'Limão',
    emoji: '🍋',
    title: 'o unicórnio elétrico',
    story: 'Limão é o menor depois da Lulu e não para quieto um segundo. '
      + 'Quando ele pula, dá até para ouvir um estalinho no ar.',
    price: 48,
    // Amarelo-limão: o elenco tinha dourado (Sol), mas não amarelo.
    body: 0xf2e33a,
    hoof: 0xb8a800,
    muzzle: 0xf7ee8a,
    horn: { color: 0xfffbc9, length: 0.5, radius: 0.095 },
    hair: [0xc4e832, 0xf2e33a, 0xffffff, 0x8fd420, 0xfff08a],
    wing: { style: 'ray', colors: [0xfffbc9, 0xf7ee8a, 0xf2e33a, 0xc4e832, 0x8fd420] },
    mark: { shape: 'bolt', color: 0x6b8f00 },
    // Miudinho e espetado.
    scale: 0.88,
    proportions: { head: 1.12, legs: 0.98, eye: 1.2 },
    voice: 1.35,
    // Pula mais alto. A altura vai com o quadrado da velocidade, então este
    // 1,12 vira ×1,25 de altura — o suficiente para a criança notar sem
    // desequilibrar a corrida.
    jumpBoost: 1.12,
    fast: ['tempestade', 'frutas'],
    power: 'ele pula mais alto que os outros',
    trail: { colors: [0xffffff, 0xfffbc9, 0xf2e33a, 0xc4e832, 0x8fd420, 0xfff08a], width: 0.55 },
  },

  violeta: {
    id: 'violeta',
    name: 'Violeta',
    emoji: '🔮',
    title: 'a unicórnia de fumaça',
    story: 'Violeta é meio feita de fumaça: quando salta, demora para descer, '
      + 'como se o ar segurasse ela um pouquinho.',
    price: 54,
    // Roxo saturado — a Lua é lilás pálido e o Cometa é índigo escuro.
    body: 0x8b3fd6,
    hoof: 0x5a1f96,
    muzzle: 0xa96ee8,
    horn: { color: 0xe6c9ff, length: 0.7, radius: 0.085 },
    hair: [0xd9a6ff, 0x8b3fd6, 0xf0d9ff, 0xa96ee8, 0x6b28b0],
    wing: { style: 'veil', colors: [0xf0d9ff, 0xd9a6ff, 0xb87ae8] },
    mark: { shape: 'star', color: 0xf0d9ff },
    scale: 1.0,
    proportions: { head: 0.98, legs: 1.05, eye: 1.15 },
    voice: 1.1,
    // Cai mais devagar: o pulo dela flutua.
    airGlide: 0.78,
    fast: ['bruma', 'noite'],
    power: 'ela demora para descer do pulo',
    trail: { colors: [0xf0d9ff, 0xd9a6ff, 0xb87ae8, 0x8b3fd6, 0x6b28b0, 0xe6c9ff], width: 0.85 },
  },

  cristal: {
    id: 'cristal',
    name: 'Cristal',
    emoji: '💎',
    title: 'a unicórnia de vidro',
    story: 'Cristal é transparente como uma janela de gelo, e dá para ver o '
      + 'arco-íris passar por dentro dela quando o sol bate de lado.',
    price: 60,
    body: 0xdff4ff,
    hoof: 0x8fd0e8,
    muzzle: 0xeaf9ff,
    horn: { color: 0xffffff, length: 0.78, radius: 0.08 },
    hair: [0x8ce9ff, 0xd9f4ff, 0xffffff, 0x5fd0f0, 0xbfe9ff],
    wing: { style: 'veil', colors: [0xffffff, 0xeaf9ff, 0xd9f4ff] },
    mark: { shape: 'diamond', color: 0x2f9bff },
    // O corpo é de vidro: 72% de opacidade (ver createUnicorn).
    translucent: 0.72,
    scale: 1.02,
    proportions: { head: 0.95, legs: 1.1, eye: 1 },
    voice: 1.2,
    fast: ['caverna', 'geada'],
    power: 'ela é de vidro: dá para ver através dela',
    trail: { colors: [0xffffff, 0xeaf9ff, 0x8ce9ff, 0x5fd0f0, 0xbfe9ff, 0xd9f4ff], width: 0.7 },
  },

  vovo: {
    id: 'vovo',
    name: 'Vovô',
    emoji: '🎩',
    title: 'o unicórnio mais antigo',
    story: 'Vovô já correu em todas as pistas, algumas antes de elas terem nome. '
      + 'Ele não é rápido para desviar, mas o rastro dele cobre a pista inteira.',
    price: 66,
    // O cinza/prata que faltava.
    body: 0x9aa0ad,
    hoof: 0x5c6270,
    muzzle: 0xc4c9d4,
    horn: { color: 0xe8ebf2, length: 0.66, radius: 0.115 },
    hair: [0xffffff, 0xe8ebf2, 0xd0d5e0, 0xf7f9ff, 0xc4c9d4],
    wing: { style: 'feather', colors: [0xffffff, 0xf7f9ff, 0xe8ebf2, 0xd0d5e0, 0xc4c9d4] },
    mark: { shape: 'comet', color: 0x5c6270 },
    // Grande e de pernas firmes, sem pressa.
    scale: 1.12,
    proportions: { head: 1.02, legs: 1, eye: 0.9 },
    voice: 0.78,
    // Vira devagar — e em troca deixa o rastro mais largo do jogo.
    laneGrip: 0.6,
    fast: ['vilarejo', 'campo'],
    power: 'vira devagar, mas deixa o rastro mais largo',
    trail: { colors: [0xffffff, 0xf7f9ff, 0xe8ebf2, 0xd0d5e0, 0xc4c9d4, 0x9aa0ad], width: 1.5 },
  },

  sombra: {
    id: 'sombra',
    name: 'Sombra',
    emoji: '🦇',
    title: 'o unicórnio da meia-noite',
    story: 'Sombra é preto de verdade, sem um fiozinho de cor. '
      + 'Ele brilha por conta própria, então nunca corre no escuro.',
    price: 72,
    // Preto fosco, sem o laranja do Brasa.
    body: 0x22202b,
    hoof: 0x3d3a4a,
    muzzle: 0x35323f,
    horn: { color: 0xc9a6ff, length: 0.74, radius: 0.09 },
    hair: [0x6b5fa8, 0x4a3f7a, 0x8c7ac9, 0x2f2a4a, 0x5a4f96 ],
    // Asa de morcego: membrana em festões, nada de pena.
    // Membranas mais claras que o corpo, senão a asa virava uma mancha só.
    wing: { style: 'bat', colors: [0x6b6480, 0x554f68, 0x7d7594] },
    mark: { shape: 'moon', color: 0xc9a6ff },
    // Acende sozinho em qualquer pista, não só nas que têm `glow`.
    glow: { intensity: 0.3, halo: 0xc9a6ff },
    scale: 1.05,
    proportions: { head: 0.96, legs: 1.06, eye: 1.05 },
    voice: 0.85,
    fast: ['caverna', 'vulcao'],
    power: 'ele acende sozinho em qualquer pista',
    trail: { colors: [0xc9a6ff, 0x8c7ac9, 0x6b5fa8, 0x4a3f7a, 0x2f2a4a, 0xa98ee0], width: 0.8 },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
export const DEFAULT_CHARACTER = 'uni';

// Preço em chaves mágicas; 0 para quem já vem liberado (só a Uni, hoje).
export const characterPrice = (character) => character?.price || 0;

// O tamanho final do elenco. A grade desenha um espaço vazio para cada
// unicórnio que ainda falta criar.
export const CHARACTER_SLOTS = 21;

// Esse unicórnio corre mais rápido nesta pista?
export const isFastOn = (character, trackId) =>
  !!character?.fast?.includes(trackId);
