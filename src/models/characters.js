// Os quatro unicórnios jogáveis.
//
// Cada personagem descreve as cores do corpo, o estilo do chifre, das asas e
// da marca na anca, as cores da crina e do rastro que ele deixa na pista.
// O modelo 3D é o mesmo código (src/models/unicorn.js) montado com estes
// valores — por isso dá para inventar um personagem novo só acrescentando
// uma entrada aqui.

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
    trail: { colors: [0xff7b9d, 0xffb26b, 0xffe36b, 0x8ce99a, 0x74c0fc, 0xc09cff], width: 0.8 },
  },

  sol: {
    id: 'sol',
    name: 'Sol',
    emoji: '☀️',
    title: 'o unicórnio do amanhecer',
    story: 'Sol acorda antes de todo mundo para acender o dia. '
      + 'Quando ele galopa, deixa um rastro morninho de laranja e dourado que faz as flores abrirem.',
    body: 0xfff1d6,
    hoof: 0xffb570,
    muzzle: 0xffa96b,
    horn: { color: 0xffab1f, length: 0.55, radius: 0.11 },
    hair: [0xffb02e, 0xffd75e, 0xff7a3c, 0xffe9a3, 0xff9433],
    wing: { style: 'ray', colors: [0xfff3c4, 0xffe38a, 0xffcf5c, 0xffb92e, 0xffa11f] },
    mark: { shape: 'sun', color: 0xffab1f },
    trail: { colors: [0xfff0b0, 0xffd75e, 0xffb02e, 0xff9433, 0xff7a3c, 0xffc46b], width: 0.8 },
  },

  lua: {
    id: 'lua',
    name: 'Lua',
    emoji: '🌙',
    title: 'a unicórnia da noite',
    story: 'Lua só sai quando o céu escurece, para cuidar dos sonhos de quem dorme. '
      + 'Seu rastro é um pedacinho de céu estrelado, e ela conhece todos os atalhos da noite.',
    body: 0xe9e6ff,
    hoof: 0xb0a6f0,
    muzzle: 0xb9aef5,
    horn: { color: 0xd7dcff, length: 0.66, radius: 0.085 },
    hair: [0x6d7fe0, 0x9a7ae0, 0x5b6bd6, 0xbcaef5, 0x7a5cc4],
    wing: { style: 'veil', colors: [0xdfe4ff, 0xc9d0ff, 0xb4b9ff] },
    mark: { shape: 'moon', color: 0xbcaef5 },
    trail: { colors: [0xe3dcff, 0xbcaef5, 0x9a7ae0, 0x6d7fe0, 0x5b6bd6, 0x8ea3ff], width: 0.75 },
  },

  lulu: {
    id: 'lulu',
    name: 'Lulu',
    emoji: '🤍',
    title: 'a unicórnia bebê',
    story: 'Lulu é a menorzinha do grupo e ainda está aprendendo a voar. '
      + 'Ela é branquinha como nuvem e deixa um fiozinho de brilho por onde passa.',
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
    trail: { colors: [0xffffff, 0xfff2f8, 0xffe4f1, 0xeaf3ff, 0xfff8e6, 0xfdefff], width: 0.3 },
  },

  estrela: {
    id: 'estrela',
    name: 'Estrela',
    emoji: '⭐',
    title: 'a unicórnia que caiu do céu',
    story: 'Estrela caiu do céu numa noite de agosto e resolveu ficar para brincar. '
      + 'Ela brilha tanto que as estrelinhas da pista aparecem só para correr junto.',
    body: 0xfff8e6,
    hoof: 0xffe08a,
    muzzle: 0xffd9a8,
    horn: { color: 0xffe066, length: 0.7, radius: 0.085 },
    hair: [0xffe066, 0xfff0f6, 0xbfe3ff, 0xffd9ef, 0xfff3b0],
    wing: { style: 'feather', colors: [0xffffff, 0xfff8dd, 0xfff0b0, 0xffe9a3, 0xffe066, 0xfff0f6, 0xffd9ef] },
    mark: { shape: 'star', color: 0xffd166 },
    trail: { colors: [0xffffff, 0xfff8dd, 0xfff3b0, 0xffe066, 0xffd166, 0xfff0f6], width: 0.7 },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
export const DEFAULT_CHARACTER = 'uni';
