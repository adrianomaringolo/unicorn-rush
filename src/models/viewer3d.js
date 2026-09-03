// O unicórnio de perto, para girar com o dedo.
//
// O retrato da ficha é uma foto de perfil, sempre do mesmo lado. Aqui o
// modelo é o de verdade, girando: dá para ver a marca da anca, o outro lado
// da crina e as asas por trás — coisas que a foto esconde.
//
// Monta a própria cena e o próprio renderizador, como os retratos fazem, e
// devolve `{ dom, dispose }`. Quem abre é quem fecha: sem o `dispose`, cada
// abertura deixaria um contexto WebGL para trás, e os navegadores só
// aguentam alguns antes de começar a descartar os antigos — inclusive o do
// jogo, que está rodando atrás do cartão.
import * as THREE from 'three';
import { createUnicorn, animateUnicorn } from './unicorn.js';

// Quanto o arrasto gira: meia tela ≈ meia volta.
const SENSIBILIDADE = 0.011;
// Sozinho ele gira devagarinho, para se apresentar sem ninguém tocar.
const GIRO_SOZINHO = 0.32;
// O quanto o embalo do arrasto continua depois que o dedo sai.
const ATRITO = 0.93;

export function createViewer3d(personagem, { altura = 300 } = {}) {
  const dom = document.createElement('div');
  dom.className = 'viewer3d';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const tela = renderer.domElement;
  tela.className = 'viewer3d-tela';
  dom.appendChild(tela);

  const scene = new THREE.Scene();
  // A mesma luz dos retratos: o unicórnio tem de parecer o mesmo dos dois
  // lugares, senão a criança acha que trocou de personagem.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffc3e6, 1.15));
  const sol = new THREE.DirectionalLight(0xfff3d6, 1.35);
  sol.position.set(4, 6, 6);
  scene.add(sol);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

  // O pivô é que gira, não o unicórnio: assim o `animateUnicorn` continua
  // mandando na pose sem brigar com a rotação do dedo.
  const pivo = new THREE.Group();
  scene.add(pivo);
  const unicornio = createUnicorn(personagem);
  pivo.add(unicornio);

  // Começa de três quartos, que é o ângulo em que se vê o focinho e o
  // flanco ao mesmo tempo — de perfil ele parece uma figurinha, de frente
  // some a marca da anca.
  let anguloY = -0.9;
  let anguloX = 0;
  let embalo = 0;
  let arrastando = false;
  let mexeram = false;

  function medir() {
    const largura = Math.max(160, dom.clientWidth || 320);
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    // O mesmo ângulo do retrato, mas um passo mais atrás: o retrato é de
    // perfil e sempre o mesmo, e aqui o bicho gira — de três quartos ele é
    // mais comprido que alto, e no enquadramento do retrato as asas
    // encostavam na borda em metade das voltas.
    //
    // 6,9 foi medido: girando o maior do elenco (o Brasa) de 30 em 30 graus,
    // é a distância em que a silhueta dele enche 90% da altura sem tocar a
    // moldura em nenhuma volta. A 6,4 ele estoura; a 7,8 sobra margem à toa.
    // Os menores aparecem menores de propósito, como no retrato: o tamanho
    // faz parte do personagem.
    camera.position.set(-6.9, 2.05, 0.2);
    camera.lookAt(0, 1.68, 0.2);
    camera.updateProjectionMatrix();
  }
  medir();
  const aoRedimensionar = () => medir();
  addEventListener('resize', aoRedimensionar);

  // --- girar com o dedo ou o mouse ---------------------------------------
  let ultimoX = 0;
  let ultimoY = 0;

  const pegar = (e) => {
    arrastando = true;
    mexeram = true;
    embalo = 0;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    tela.setPointerCapture?.(e.pointerId);
    dom.classList.add('girando');
  };

  const mover = (e) => {
    if (!arrastando) return;
    const dx = e.clientX - ultimoX;
    const dy = e.clientY - ultimoY;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    anguloY += dx * SENSIBILIDADE;
    // A inclinação é presa: de cabeça para baixo ninguém reconhece o
    // personagem, e a criança não teria como voltar.
    anguloX = Math.max(-0.5, Math.min(0.5, anguloX + dy * SENSIBILIDADE * 0.6));
    embalo = dx * SENSIBILIDADE;
    // Segurar o dedo aqui não pode rolar o cartão junto.
    e.preventDefault();
  };

  const soltar = () => {
    arrastando = false;
    dom.classList.remove('girando');
  };

  tela.addEventListener('pointerdown', pegar);
  tela.addEventListener('pointermove', mover);
  for (const evento of ['pointerup', 'pointercancel', 'pointerleave']) {
    tela.addEventListener(evento, soltar);
  }

  // --- o laço ------------------------------------------------------------
  const devagar = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const relogio = new THREE.Clock();
  let vivo = true;

  function quadro() {
    if (!vivo) return;
    const dt = Math.min(0.05, relogio.getDelta());
    const tempo = relogio.elapsedTime;

    if (!arrastando) {
      // Enquanto ninguém tocou, ele se apresenta girando sozinho; depois do
      // primeiro toque, quem manda é o dedo — só o embalo continua.
      embalo *= ATRITO;
      anguloY += mexeram || devagar ? embalo : GIRO_SOZINHO * dt;
    }

    pivo.rotation.y = anguloY;
    pivo.rotation.x = anguloX;
    animateUnicorn(unicornio, tempo, 2.4, true);

    renderer.render(scene, camera);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  function dispose() {
    vivo = false;
    removeEventListener('resize', aoRedimensionar);
    unicornio.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      const m = o.material;
      Array.isArray(m) ? m.forEach((x) => x.dispose()) : m.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
    tela.remove();
  }

  return { dom, dispose };
}
