// O álbum de figurinhas.
//
// Cada pista tem uma página de quatro figurinhas, e cada figurinha é um dos
// modelos daquela pista — o papagaio da Selva, o disco voador do Espaço, o
// boneco de neve da Geada. São os mesmos modelos do cenário (`createModelo`,
// em scenery.js), então a figurinha é sempre a cara do que a criança vê
// passar na beira da pista.
//
// Na corrida, de vez em quando, nasce numa faixa um **cartão dourado**
// girando com o modelo dentro (ver World.rollSticker). Passar por ele cola
// a figurinha no álbum. Só nasce figurinha que ainda falta naquela pista,
// então a página sempre anda — e quando ela fecha, vem um prêmio em chaves
// (ver Game.collectSticker).
//
// O que já foi colado fica em `save.figurinhas` ({ id: quantas vezes }).
import * as THREE from 'three';
import { createModelo } from './scenery.js';
import { createGlow } from './collectibles.js';

// As quatro de cada pista, na ordem da página. `modelo` é o nome em
// `createModelo`; a escolha foi o que cada pista tem de mais seu — nada de
// pedra, que existe em quase todas, e nada que seja só um brilho (o
// vaga-lume sozinho vira uma mancha amarela na foto).
// Cada uma: [modelo, nome, história]. A história é curtinha, uma ou duas
// frases, e aparece quando a criança toca na figurinha no álbum.
const PAGINAS = {
  campo: [
    ['flower', 'Flor', 'Toda manhã ela abre as pétalas para dar bom-dia aos unicórnios que passam.'],
    ['mushroom', 'Cogumelo', 'Quando chove, as formiguinhas usam ele de guarda-chuva.'],
    ['butterfly', 'Borboleta', 'Ela voa de flor em flor contando segredos que só o vento sabe.'],
    ['bee', 'Abelha', 'Zum, zum! Ela faz o mel mais doce do Campo e divide com quem pede com jeitinho.'],
  ],
  doces: [
    ['lollipop', 'Pirulito', 'Quanto mais você lambe, mais cores aparecem no redemoinho.'],
    ['cupcake', 'Cupcake', 'Ele nasceu numa forminha e ganhou a cobertura mais fofa do reino.'],
    ['donut', 'Rosquinha', 'Os unicórnios dizem que o buraquinho do meio é para fazer um pedido.'],
    ['ant', 'Formiga', 'Ela carrega um grão de açúcar maior do que ela mesma, sem reclamar.'],
  ],
  vilarejo: [
    ['cottage', 'Casinha', 'A chaminé solta fumacinha em forma de coração quando tem bolo no forno.'],
    ['well', 'Poço', 'Jogue uma moedinha e diga um desejo bem baixinho: ele escuta.'],
    ['lamppost', 'Poste de luz', 'Ele acende sozinho quando escurece, para ninguém se perder no caminho de casa.'],
    ['bird', 'Passarinho', 'Ele acorda o vilarejo inteiro cantando, sempre na mesma nota.'],
  ],
  ceu: [
    ['balloon', 'Balão', 'Ele leva quem tiver coragem para dar uma volta acima das nuvens.'],
    ['kite', 'Pipa', 'Ela dança no vento e nunca enrosca a linha.'],
    ['rainbowArch', 'Arco-íris', 'Quem passa por baixo dele ganha um pouquinho de cada cor.'],
    ['stormCloud', 'Nuvem de chuva', 'Ela parece brava, mas só chove para regar as flores lá de baixo.'],
  ],
  frutas: [
    ['strawberry', 'Morango', 'O morango mais vermelho do pomar, cheio de pintinhas que brilham ao sol.'],
    ['pineapple', 'Abacaxi', 'Ele usa a coroa de folhas como se fosse o rei das frutas.'],
    ['watermelon', 'Melancia', 'Por fora é verde e listrada; por dentro, uma festa vermelha.'],
    ['cherries', 'Cerejas', 'São gêmeas e fazem tudo juntas, até balançar no galho.'],
  ],
  praia: [
    ['sandcastle', 'Castelo de areia', 'Foi construído com baldinho e pazinha, e tem uma bandeira no alto da torre.'],
    ['parasol', 'Guarda-sol', 'Debaixo dele sempre tem uma sombrinha fresca para descansar.'],
    ['starfish', 'Estrela-do-mar', 'Ela caiu do céu numa noite e decidiu morar na areia.'],
    ['seagull', 'Gaivota', 'Ela voa alto procurando o peixinho mais brilhante do mar.'],
  ],
  oceano: [
    ['coral', 'Coral', 'É a casa colorida de muitos peixinhos e um ou outro caranguejo.'],
    ['fish', 'Peixinho', 'Ele adora apostar corrida com as bolhas que sobem.'],
    ['seaUrchin', 'Ouriço-do-mar', 'Parece espinhudo, mas é só um jeito de dar abraço de longe.'],
    ['clam', 'Concha', 'Encoste a orelha nela e você ouve o mar cantar.'],
  ],
  noite: [
    ['glowMushroom', 'Cogumelo que brilha', 'Ele guarda um pouquinho de luz da lua para iluminar a trilha.'],
    ['crystal', 'Cristal', 'Dizem que quem olha bem fundo nele vê as estrelas de dentro.'],
    ['moonStone', 'Pedra da lua', 'Ela caiu da lua e ainda brilha um pouquinho com saudade de casa.'],
    ['pineTree', 'Pinheiro', 'O pinheiro mais alto da noite, onde as corujas contam histórias.'],
  ],
  geada: [
    ['snowman', 'Boneco de neve', 'Ganhou um nariz de cenoura e um cachecol, e agora não para de sorrir.'],
    ['igloo', 'Iglu', 'Por fora é gelo, mas lá dentro é quentinho como um abraço.'],
    ['iceCrystal', 'Cristal de gelo', 'Não existem dois iguais: este foi desenhado só para você.'],
    ['iceBlock', 'Bloco de gelo', 'Um pedaço de gelo tão limpinho que dá para ver o outro lado.'],
  ],
  vulcao: [
    ['lavaPool', 'Lago de lava', 'Ela borbulha devagar, quentinha como sopa de vó.'],
    ['emberVent', 'Chaminé de fogo', 'Quando ela solta faíscas, é sinal de que o vulcão está feliz.'],
    ['charredTree', 'Árvore queimada', 'Ela já foi verde um dia; agora guarda as brasas como lembrança.'],
    ['lavaBoulder', 'Pedra de lava', 'Ainda está morna: dá para esquentar as patas nela.'],
  ],
  parque: [
    ['ferrisWheel', 'Roda-gigante', 'Lá de cima dá para ver o reino inteiro, de ponta a ponta.'],
    ['carousel', 'Carrossel', 'Os cavalinhos sobem e descem, e cada um tem nome.'],
    ['cottonCandy', 'Algodão-doce', 'É feito de nuvem cor-de-rosa e derrete na boca.'],
    ['popcornBox', 'Pipoca', 'Estoura, pula e se espalha: é a pipoca mais animada do parque.'],
  ],
  espaco: [
    ['ufo', 'Disco voador', 'Os visitantes de outro planeta só vieram dar um oi.'],
    ['planet', 'Planeta', 'Ele gira tão devagar que um dia lá dura uma semana inteira.'],
    ['meteor', 'Meteoro', 'Ele risca o céu deixando um rastro para quem quiser fazer um pedido.'],
    ['asteroid', 'Asteroide', 'Uma pedra que flutua sem rumo, passeando pelas estrelas.'],
  ],
  tempestade: [
    ['windmill', 'Moinho', 'Quanto mais forte o vento, mais feliz ele gira.'],
    ['lightningRod', 'Para-raios', 'Ele pega os raios no ar para ninguém levar susto.'],
    ['puddle', 'Poça', 'A melhor parte da chuva: pular dentro dela.'],
    ['barrel', 'Barril', 'Ele guarda água da chuva para as plantas beberem depois.'],
  ],
  bruma: [
    ['ghostTree', 'Árvore fantasma', 'Ela parece assustadora no nevoeiro, mas só quer companhia.'],
    ['floatingLantern', 'Lanterna', 'Ela flutua sozinha mostrando o caminho no meio da névoa.'],
    ['mossRock', 'Pedra de musgo', 'O musgo é o cobertor dela nas noites frias.'],
    ['crate', 'Caixote', 'Ninguém sabe o que tem dentro, e é isso que deixa tudo divertido.'],
  ],
  caverna: [
    ['crystalVein', 'Veio de cristal', 'Uma faixa de cristal que brilha como um rio de luz dentro da pedra.'],
    ['stalagmite', 'Estalagmite', 'Ela cresce uma gotinha por vez, bem devagar, há mil anos.'],
    ['glowPool', 'Poça brilhante', 'A água dela brilha no escuro para os morcegos acharem o caminho.'],
    ['crystalSpike', 'Espinho de cristal', 'Pontudo e reluzente, ele aponta para onde tem mais tesouro.'],
  ],
  outono: [
    ['autumnTree', 'Árvore de outono', 'No outono ela troca o vestido verde por um laranja e dourado.'],
    ['pumpkin', 'Abóbora', 'Ela cresceu tanto que pode virar uma casinha.'],
    ['leafPile', 'Monte de folhas', 'O lugar perfeito para pular e sair cheio de folhas no cabelo.'],
    ['logObstacle', 'Tronco', 'Caiu na trilha e agora é ponte para os esquilos.'],
  ],
  selva: [
    ['parrot', 'Papagaio', 'Ele repete tudo o que ouve, então cuidado com os segredos!'],
    ['jungleTree', 'Árvore da selva', 'Tão alta que os galhos de cima fazem cócegas nas nuvens.'],
    ['hangingVine', 'Cipó', 'O balanço favorito dos macaquinhos da selva.'],
    ['vineTangle', 'Nó de cipós', 'Os cipós se abraçaram tanto que viraram um nó só.'],
  ],
};

export const STICKERS_PER_PAGE = 4;

// Quantas chaves a página completa dá.
export const PAGE_REWARD = 3;

export const FIGURINHAS = Object.entries(PAGINAS).flatMap(([pista, lista]) =>
  lista.map(([modelo, name, story], ordem) => ({ id: `${pista}-${modelo}`, pista, modelo, name, story, ordem })));

export const FIGURINHA = Object.fromEntries(FIGURINHAS.map((f) => [f.id, f]));

export const figurinhasDaPista = (pista) => FIGURINHAS.filter((f) => f.pista === pista);

// O modelo da figurinha, centrado na origem e do `tamanho` pedido (a maior
// medida dele). Os modelos do cenário têm escalas bem diferentes — a
// roda-gigante é um prédio, o vaga-lume é um grão —, e no cartão e no
// álbum eles precisam caber no mesmo quadro.
export function modeloDaFigurinha(figurinha, tamanho = 1) {
  const modelo = createModelo(figurinha.modelo) || new THREE.Group();
  const caixa = new THREE.Box3().setFromObject(modelo);
  const medidas = caixa.getSize(new THREE.Vector3());
  const maior = Math.max(medidas.x, medidas.y, medidas.z) || 1;
  const centro = caixa.getCenter(new THREE.Vector3());
  const escala = tamanho / maior;
  const g = new THREE.Group();
  modelo.position.sub(centro);
  g.add(modelo);
  g.scale.setScalar(escala);
  return g;
}

// A moldura do cartão: um retângulo de cantos redondos com o meio vazado,
// dourado. É ela que diz "isto é diferente de um coração" de longe.
const LARGURA = 1.25;
const ALTURA = 1.55;
let molduraGeo = null;
function moldura() {
  if (molduraGeo) return molduraGeo;
  const retangulo = (w, h, r) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };
  const fora = retangulo(LARGURA, ALTURA, 0.2);
  const dentro = retangulo(LARGURA - 0.2, ALTURA - 0.2, 0.13);
  fora.holes.push(dentro);
  molduraGeo = new THREE.ExtrudeGeometry(fora, {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 6,
  });
  molduraGeo.translate(0, 0, -0.03);
  return molduraGeo;
}

// O cartão dourado que nasce na pista.
export function createStickerCard(figurinha) {
  const g = new THREE.Group();
  const ouro = new THREE.MeshLambertMaterial({ color: 0xffc53d, emissive: 0x6a4500, fog: false });
  g.add(new THREE.Mesh(moldura(), ouro));

  // O fundo do cartão: um céu clarinho, meio transparente, para o modelo
  // se destacar do chão da pista sem esconder o outro lado quando gira.
  const fundo = new THREE.Mesh(
    new THREE.PlaneGeometry(LARGURA - 0.16, ALTURA - 0.16),
    new THREE.MeshBasicMaterial({
      color: 0xfff6d8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: false,
    })
  );
  g.add(fundo);

  const modelo = modeloDaFigurinha(figurinha, 1.05);
  g.add(modelo);

  // Três estrelinhas nos cantos, para o cartão piscar de longe.
  const estrelaMat = new THREE.MeshBasicMaterial({ color: 0xfff1a8, fog: false });
  [[-0.55, 0.7], [0.58, 0.62], [0.52, -0.72]].forEach(([x, y], i) => {
    const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 + i * 0.015, 0), estrelaMat);
    e.position.set(x, y, 0.05);
    g.add(e);
  });

  // O brilho é menor e mais fraco que o da chave: com o mesmo, o cartão
  // virava uma bola de luz e o desenho de dentro sumia.
  const halo = createGlow(0xffd166, 1.05, 0.18);
  g.add(halo);
  g.scale.setScalar(1.15);
  g.userData = { kind: 'sticker', figurinha: figurinha.id, glow: halo };
  return g;
}
