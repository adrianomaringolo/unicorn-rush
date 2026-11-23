// O baú arco-íris (ver src/game/missao.js): o prêmio grande do jogo.
//
// Uma arca de madeira lilás com cintas e cantoneiras douradas, tampa
// abaulada rosa e, na frente, um pequeno arco-íris com duas nuvenzinhas —
// o símbolo que diz de que baú se trata. A tampa gira numa dobradiça presa
// à borda de trás (`userData.tampa`), e dentro dele há uma luz que só
// aparece quando ela abre (`userData.luz`). Quem anima é o Game
// (ver Game.animarBau).
import * as THREE from 'three';
import { createGlow } from './collectibles.js';

const LARG = 1.8;     // de lado a lado
const FUNDO = 1.2;    // da frente para trás
const ALTURA = 0.86;  // do corpo, sem a tampa

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const MADEIRA = mat(0xa77fe8);
const MADEIRA_ESCURA = mat(0x7d58c4);
const TAMPA = mat(0xff8fc0, { side: THREE.DoubleSide });
const TAMPA_DENTRO = mat(0xd9609a);
const OURO = mat(0xffd166, { emissive: 0x4a3300 });
const NUVEM = mat(0xffffff, { emissive: 0x333333 });
// O fundo do baú, visto de cima: escuro, sem luz nenhuma, para parecer oco.
const DENTRO = new THREE.MeshBasicMaterial({ color: 0x2e1a4d });
const ARCO = [0xff5d6c, 0xffa94d, 0xffe066, 0x7bd88f, 0x5cc1ff, 0xb197fc]
  .map((cor) => mat(cor, { emissive: new THREE.Color(cor).multiplyScalar(0.18) }));

function caixa(l, a, p, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, a, p), material);
  m.position.set(x, y, z);
  return m;
}

// O símbolo: seis arcos do vermelho (por fora) ao lilás, sobre duas nuvens.
function arcoIris(raio = 0.27) {
  const g = new THREE.Group();
  const passo = raio * 0.13;
  ARCO.forEach((material, i) => {
    const r = raio - i * passo;
    const arco = new THREE.Mesh(new THREE.TorusGeometry(r, passo * 0.55, 5, 20, Math.PI), material);
    g.add(arco);
  });
  for (const lado of [-1, 1]) {
    const x = lado * (raio - passo * 2.5);
    for (const [dx, dy, s] of [[-0.06, 0, 0.075], [0.04, 0.02, 0.09], [0.11, -0.01, 0.06]]) {
      const bolinha = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), NUVEM);
      bolinha.position.set(x + dx * lado, dy, 0.03);
      bolinha.scale.z = 0.6;
      g.add(bolinha);
    }
  }
  return g;
}

export function createRainbowChest() {
  const bau = new THREE.Group();
  // Tudo que chacoalha fica num grupo de dentro: quem usa o baú pode mover
  // e girar o de fora à vontade sem brigar com a animação.
  const balanco = new THREE.Group();
  bau.add(balanco);

  // --- O corpo -------------------------------------------------------------
  const corpo = new THREE.Group();
  corpo.add(caixa(LARG, ALTURA, FUNDO, MADEIRA, 0, ALTURA / 2, 0));
  // As tábuas: frisos mais escuros na frente.
  for (const y of [0.3, 0.58]) corpo.add(caixa(LARG + 0.01, 0.035, FUNDO + 0.01, MADEIRA_ESCURA, 0, y, 0));
  // O rodapé, um pouco mais largo.
  corpo.add(caixa(LARG + 0.1, 0.12, FUNDO + 0.1, MADEIRA_ESCURA, 0, 0.06, 0));
  // As cintas douradas, que passam por cima do corpo.
  for (const x of [-0.58, 0.58]) corpo.add(caixa(0.16, ALTURA + 0.02, FUNDO + 0.04, OURO, x, ALTURA / 2, 0));
  // As cantoneiras nas quinas.
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      corpo.add(caixa(0.12, ALTURA + 0.04, 0.12, OURO, x * (LARG / 2), ALTURA / 2, z * (FUNDO / 2)));
    }
  }
  // O lado de dentro: um retângulo escuro em cima do corpo, deixando só a
  // borda de madeira em volta. É o que faz o baú parecer oco quando a tampa
  // abre (fechado, a tampa o cobre). Fica um tiquinho acima das cintas,
  // senão elas cruzariam a boca do baú.
  const miolo = caixa(LARG - 0.16, 0.01, FUNDO - 0.16, DENTRO, 0, ALTURA + 0.016, 0);
  corpo.add(miolo);
  // O fecho: a plaquinha dourada no meio da frente, com o buraco da chave.
  corpo.add(caixa(0.3, 0.3, 0.08, OURO, 0, ALTURA - 0.12, FUNDO / 2 + 0.03));
  const buraco = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 10), MADEIRA_ESCURA);
  buraco.rotation.x = Math.PI / 2;
  buraco.position.set(0, ALTURA - 0.1, FUNDO / 2 + 0.075);
  corpo.add(buraco, caixa(0.035, 0.08, 0.02, MADEIRA_ESCURA, 0, ALTURA - 0.17, FUNDO / 2 + 0.075));
  // O símbolo de arco-íris, na frente, embaixo do fecho.
  const simbolo = arcoIris();
  simbolo.position.set(0, 0.2, FUNDO / 2 + 0.03);
  corpo.add(simbolo);
  balanco.add(corpo);

  // --- A tampa -------------------------------------------------------------
  // A dobradiça fica na borda de trás, no alto do corpo: girar o grupo em X
  // (negativo) abre a tampa para trás.
  const dobradica = new THREE.Group();
  dobradica.position.set(0, ALTURA, -FUNDO / 2);
  const tampa = new THREE.Group();
  tampa.position.z = FUNDO / 2;
  const meiaCana = (raio, comprimento, material) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, comprimento, 14, 1, false, 0, Math.PI), material);
    // O cilindro em pé, girado para deitar ao longo de X: a metade que
    // sobra (theta de 0 a π) fica virada para cima.
    m.rotation.z = Math.PI / 2;
    return m;
  };
  const cupula = meiaCana(FUNDO / 2, LARG, TAMPA);
  cupula.scale.set(0.75, 1, 1);     // menos alta que um meio cilindro inteiro
  tampa.add(cupula);
  for (const x of [-0.58, 0.58]) {
    const cinta = meiaCana(FUNDO / 2 + 0.025, 0.16, OURO);
    cinta.scale.set(0.75, 1, 1);
    cinta.position.x = x;
    tampa.add(cinta);
  }
  // As pontas da tampa, douradas, fechando os lados da meia-cana.
  for (const x of [-1, 1]) {
    const ponta = meiaCana(FUNDO / 2 + 0.03, 0.08, OURO);
    ponta.scale.set(0.75, 1, 1);
    ponta.position.x = x * (LARG / 2);
    tampa.add(ponta);
  }
  // O forro de baixo da tampa: é o que aparece quando ela abre para trás.
  tampa.add(caixa(LARG + 0.02, 0.05, FUNDO + 0.02, TAMPA_DENTRO, 0, 0.02, 0));
  // A lingueta do fecho, que desce da tampa até a plaquinha.
  tampa.add(caixa(0.18, 0.14, 0.06, OURO, 0, 0.02, FUNDO / 2 + 0.04));
  dobradica.add(tampa);
  balanco.add(dobradica);

  // A luz de dentro: um brilho dourado que cresce quando a tampa abre.
  const luz = createGlow(0xffcf6b, 1, 0.22);
  luz.position.y = ALTURA;
  luz.scale.setScalar(0.001);
  balanco.add(luz);

  bau.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  luz.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  bau.userData = { kind: 'chest', balanco, tampa: dobradica, luz, altura: ALTURA, premio: null };
  return bau;
}

// --- A abertura -----------------------------------------------------------
//
// A mesma cena no jogo (Game.animarBau) e na página de modelos:
//   0 a ABERTURA.abre s   chacoalha, cada vez mais forte, com pulinhos;
//   ABERTURA.abre         a tampa vai para trás passando do ponto e volta;
//   logo depois           a luz de dentro acende e o prêmio sobe girando,
//                         até ficar flutuando em cima do baú.
export const ABERTURA = { abre: 1.0, tampa: -1.8, subida: 2.2, premio: 1.05 };

// Guarda o prêmio dentro do baú, já medido: qualquer modelo (uma cartola,
// uma chave, um coração) sai do mesmo tamanho, `ABERTURA.premio` em
// unidades do baú. Ele começa invisível de tão pequeno.
export function colocarPremio(bau, modelo) {
  const antigo = bau.userData.premio;
  if (antigo) bau.remove(antigo);
  // O brilho que a chave e o coração têm na pista (para serem vistos de
  // longe) aqui só atrapalha: fica um disco atrás do prêmio.
  if (modelo.userData.glow) modelo.remove(modelo.userData.glow);
  const caixa = new THREE.Box3().setFromObject(modelo);
  const tamanho = caixa.getSize(new THREE.Vector3());
  modelo.position.sub(caixa.getCenter(new THREE.Vector3()));
  const embrulho = new THREE.Group();
  embrulho.add(modelo);
  embrulho.userData.medida = ABERTURA.premio / Math.max(tamanho.x, tamanho.y, tamanho.z, 0.01);
  embrulho.scale.setScalar(0.001);
  bau.add(embrulho);
  bau.userData.premio = embrulho;
  return embrulho;
}

// Põe o baú no ponto `t` (s) da abertura. `tempo` é o relógio corrido, para
// o que fica balançando no fim (a luz pulsando, o prêmio flutuando). Devolve
// true no quadro em que a tampa abre — a hora do som e dos brilhos.
export function animarAbertura(bau, t, tempo, tAnterior = t) {
  const { balanco, tampa, luz, premio } = bau.userData;
  const abre = ABERTURA.abre;

  const antes = Math.min(1, Math.max(0, t) / abre);
  const chacoalhando = t < abre;
  balanco.position.y = chacoalhando ? Math.abs(Math.sin(t * 17)) * 0.1 * antes : 0;
  balanco.rotation.z = chacoalhando ? Math.sin(t * 34) * 0.08 * antes : 0;

  const abrindo = THREE.MathUtils.clamp((t - abre) / 0.45, 0, 1);
  const voltinha = 1 + 2.4 * (abrindo - 1) ** 3 + 1.4 * (abrindo - 1) ** 2;
  tampa.rotation.x = ABERTURA.tampa * voltinha;

  const acesa = Math.min(1, abrindo * 1.6);
  luz.scale.set(
    0.001 + acesa * 0.62 * (1 + Math.sin(tempo * 5) * 0.06),
    0.001 + acesa * 0.2,
    0.001 + acesa * 0.42,
  );

  if (premio) {
    const sobe = THREE.MathUtils.clamp((t - abre - 0.1) / 0.7, 0, 1);
    const suave = 1 - (1 - sobe) ** 3;
    premio.position.set(0, ALTURA * 0.6 + suave * ABERTURA.subida + (sobe >= 1 ? Math.sin(tempo * 2.4) * 0.07 : 0), 0.1);
    premio.scale.setScalar(0.001 + suave * premio.userData.medida);
    premio.rotation.y = (t - abre) * 1.2 + (1 - suave) * 4 * suave;
  }
  return tAnterior < abre && t >= abre;
}
