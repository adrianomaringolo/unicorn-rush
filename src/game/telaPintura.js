// A tela de pintar (ver pintura.js): o desenho grande, a paleta e os
// botões de desfazer e limpar. Ocupa a tela inteira por cima do jogo (o
// #pintura do index.html), sem o cartão de baixo das outras telas: o
// desenho precisa de todo o espaço para o dedo acertar as áreas.
//
// Dois modos:
//   livre   — as 33 cores e a borracha, qualquer cor em qualquer área;
//   numeros — a paleta do gabarito da página (pinturaNumeros.js), com o
//             número de cada cor, e o número escrito em cada área. Só a cor
//             certa pinta; as áreas da cor escolhida ficam com um tom claro
//             dela e o número delas numa bolinha da cor, para saltar aos
//             olhos. As áreas miúdas já abrem pintadas (`automaticas`).
//             Quinze segundos sem acertar uma área, aparece uma mãozinha
//             apontando para uma das que faltam na cor escolhida.
//
// Quem chama é o Game (showPinturas / abrirPintura). Esta tela não conhece
// o save: recebe as cores guardadas na abertura e avisa a cada mudança
// (`aoMudar`), e o Game guarda.
import {
  DESENHO, CORES, BORRACHA, ORDEM_PALETA, dividirEmAreas, areaNoPonto, coresGuardadas, centrosDasAreas,
} from './pintura.js';
import { gabarito, automaticas } from './pinturaNumeros.js';
import { withIcons, iconUrl } from './icons.js';
import { t } from './i18n.js';
import { sfx } from './audio.js';

// Só o último desenho aberto fica preparado na memória: as áreas de um PNG
// grande pesam uns 12 MB, e a criança pinta um de cada vez.
let preparado = null;

function carregarImagem(src) {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error(`não achei o desenho ${src}`));
    img.src = src;
  });
}

// Lê o PNG e divide em áreas (uns 0,4 s num computador, mais num celular).
async function preparar(id) {
  if (preparado?.id === id) return preparado;
  const desenho = DESENHO[id];
  const img = await carregarImagem(desenho.arquivo);
  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const tmp = document.createElement('canvas');
  tmp.width = L;
  tmp.height = A;
  const ctx = tmp.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';                  // PNG transparente vira papel branco
  ctx.fillRect(0, 0, L, A);
  ctx.drawImage(img, 0, 0);
  const divisao = dividirEmAreas(ctx.getImageData(0, 0, L, A).data, L, A);
  preparado = { id, img, ...divisao };
  return preparado;
}

// Os centros (onde vai o número) só fazem falta no modo por números, e
// custam outra passada no desenho: calculados na primeira vez.
function centros(pagina) {
  if (!pagina.centros) pagina.centros = centrosDasAreas(pagina);
  return pagina.centros;
}

const rgb = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
// O tom claro da cor escolhida, nas áreas que esperam por ela.
const clarinho = (hex) => rgb(hex).map((c) => Math.round(255 - (255 - c) * 0.45));
// Cor clara (o número por cima vai escuro) ou escura (vai branco).
const clara = (hex) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 150; };

// Por números: as cores com que a página abre — as áreas miúdas, já certas,
// e por cima o que a criança pintou.
function coresDaPagina(pagina, g, guardado) {
  return { ...automaticas(g, centros(pagina).raio, pagina.L), ...coresGuardadas(guardado, pagina.areas) };
}

// Pinta a camada de cor (`ImageData`): `corDe(n)` dá o [r, g, b] da área n.
function pintarCamada(camada, pagina, corDe) {
  camada.data.fill(255);
  for (let n = 0; n < pagina.areas; n++) {
    const c = corDe(n);
    if (c) pintarArea(camada, pagina, n, c);
  }
}
function pintarArea(camada, pagina, n, [r, g, b]) {
  const d = camada.data;
  for (const j of pagina.pixels[n] || []) {
    const k = j * 4;
    d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
  }
}
// A cor de cada área, nos dois modos. `paleta` é a lista de hex do modo.
function corDaArea(paleta, cores, n, destaque) {
  const i = cores[n];
  if (i !== undefined) return rgb(paleta[i] ?? '#ffffff');
  return destaque && destaque(n) ? destaque(n) : null;
}
// A cor embaixo e o desenho por cima, multiplicando.
function compor(ctx, camada, img) {
  ctx.putImageData(camada, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

// A miniatura de um desenho já pintado, para a grade (`largura` px). Sem
// pintura guardada não precisa de nada disto: a grade mostra o PNG direto.
export async function miniatura(id, guardado, modo = 'livre', largura = 260) {
  const pagina = await preparar(id);
  const { L, A, img } = pagina;
  const g = modo === 'numeros' ? gabarito(id, pagina.areas) : null;
  const paleta = modo === 'numeros' ? g?.cores : CORES;
  if (!paleta) return null;
  const grande = document.createElement('canvas');
  grande.width = L;
  grande.height = A;
  const ctx = grande.getContext('2d');
  const camada = ctx.createImageData(L, A);
  const cores = g ? coresDaPagina(pagina, g, guardado) : coresGuardadas(guardado, pagina.areas);
  pintarCamada(camada, pagina, (n) => corDaArea(paleta, cores, n));
  compor(ctx, camada, img);
  const pequena = document.createElement('canvas');
  pequena.width = largura;
  pequena.height = Math.round((largura * A) / L);
  pequena.getContext('2d').drawImage(grande, 0, 0, pequena.width, pequena.height);
  return pequena.toDataURL('image/png');
}

// Quantas áreas de um gabarito ainda faltam (0 = página pronta).
export function faltando(alvo, cores) {
  let n = 0;
  for (let a = 0; a < alvo.length; a++) if (alvo[a] >= 0 && cores[a] !== alvo[a]) n++;
  return n;
}

export function criarTelaPintura(raiz) {
  raiz.innerHTML = withIcons(`
    <div class="pintura-topo">
      <button class="pintura-voltar" data-acao="voltar" aria-label="${t('Voltar')}">⬅️</button>
      <h2 class="pintura-nome"></h2>
    </div>
    <div class="pintura-folha">
      <canvas class="pintura-canvas" aria-label="${t('Toque numa parte do desenho para pintar')}"></canvas>
      <p class="pintura-espera">${t('Preparando o desenho…')}</p>
      <div class="pintura-dica" hidden><span></span><img src="${iconUrl('👆')}" alt=""></div>
      <p class="pintura-pronta" hidden>${t('⭐ Pronto! Ficou lindo!')}</p>
    </div>
    <div class="pintura-ferramentas">
      <div class="pintura-faixa">
        <button class="pintura-seta antes" data-seta="-1" aria-label="${t('Mais cores')}" hidden></button>
        <div class="pintura-paleta"></div>
        <button class="pintura-seta depois" data-seta="1" aria-label="${t('Mais cores')}" hidden></button>
      </div>
      <div class="pintura-botoes">
        <button class="big-button secondary" data-acao="desfazer"><span class="button-label">${t('↩️ Desfazer')}</span></button>
        <button class="big-button secondary" data-acao="limpar"><span class="button-label">${t('🗑️ Limpar')}</span></button>
      </div>
    </div>`);
  const canvas = raiz.querySelector('.pintura-canvas');
  const ctx = canvas.getContext('2d');
  const espera = raiz.querySelector('.pintura-espera');
  const pronta = raiz.querySelector('.pintura-pronta');
  const nome = raiz.querySelector('.pintura-nome');
  const paleta = raiz.querySelector('.pintura-paleta');

  let pagina = null;
  let camada = null;
  let cores = {};
  let historico = [];      // cada passo: { n, antes } ou { tudo: cores de antes }
  let corAtual = 0;
  let modo = 'livre';
  let gab = null;          // o gabarito, no modo por números
  let fixas = {};          // por números: as áreas miúdas, que já abrem pintadas
  let tintas = CORES;      // a paleta do modo: hex, na ordem dos botões
  let aoMudar = () => {};
  let aoVoltar = () => {};
  let abertura = 0;        // qual abertura é a atual (uma lenta não vence a nova)
  let prontaTimer = 0;
  let dicaTimer = 0;
  let dicaArea = -1;       // a área para onde a mãozinha aponta (-1 = escondida)
  const dica = raiz.querySelector('.pintura-dica');
  const folha = raiz.querySelector('.pintura-folha');
  const DICA_MS = 15000;

  // ---- A mãozinha --------------------------------------------------------
  // Por números, a criança às vezes não acha a última área de uma cor (uma
  // mecha fina, um olho). Quinze segundos sem acertar nenhuma área, a mão
  // aparece apontando para a maior que ainda falta na cor escolhida. Ela some
  // no próximo acerto ou na troca de cor, e o relógio recomeça.
  function esconderDica() {
    dicaArea = -1;
    dica.hidden = true;
  }
  function armarDica() {
    clearTimeout(dicaTimer);
    esconderDica();
    if (pagina && numeros()) dicaTimer = setTimeout(mostrarDica, DICA_MS);
  }
  function mostrarDica() {
    if (!pagina || !numeros()) return;
    const { raio } = centros(pagina);
    let melhor = -1;
    for (let a = 0; a < pagina.areas; a++) {
      if (gab.alvo[a] !== corAtual || cores[a] === corAtual) continue;
      if (melhor < 0 || raio[a] > raio[melhor]) melhor = a;
    }
    if (melhor < 0) return;
    dicaArea = melhor;
    // Ampliado e com a área fora da vista: volta ao desenho inteiro.
    if (!posicionarDica()) { zerarZoom(); redesenharLogo(); posicionarDica(); }
    dica.hidden = false;
  }
  // Põe a ponta do dedo no centro da área. Devolve false se ela está fora
  // da parte visível da folha.
  function posicionarDica() {
    if (dicaArea < 0) return true;
    const { centro } = centros(pagina);
    const r = canvas.getBoundingClientRect();
    const f = folha.getBoundingClientRect();
    const x = r.left - f.left + (((centro[dicaArea] % pagina.L) + 0.5) / pagina.L) * r.width;
    const y = r.top - f.top + ((Math.floor(centro[dicaArea] / pagina.L) + 0.5) / pagina.A) * r.height;
    dica.style.left = `${x}px`;
    dica.style.top = `${y}px`;
    return x >= 0 && y >= 0 && x <= f.width && y <= f.height;
  }

  const numeros = () => modo === 'numeros';

  // Os botões da paleta, numa fileira só que rola: no modo livre as cores
  // e a borracha, na ORDEM_PALETA; por números, as cores do gabarito com o
  // número de cada uma, em ordem.
  function montarPaleta() {
    paleta.innerHTML = '';
    paleta.scrollTo(0, 0);
    paleta.classList.toggle('com-numeros', numeros());
    const ordem = numeros() ? tintas.map((_, i) => i) : ORDEM_PALETA;
    ordem.forEach((i) => {
      const cor = tintas[i];
      const b = document.createElement('button');
      const borracha = !numeros() && i === BORRACHA;
      b.className = 'pintura-cor' + (borracha ? ' borracha' : '') + (numeros() && clara(cor) && rgb(cor).every((c) => c > 225) ? ' clarinha' : '');
      b.style.setProperty('--cor', cor);
      b.dataset.cor = i;
      b.setAttribute('aria-label', borracha ? t('Borracha') : t('Cor {n}', { n: i + 1 }));
      if (numeros()) b.innerHTML = `<span>${i + 1}</span>`;
      paleta.append(b);
    });
  }
  const marcarEscolhida = () => {
    let escolhida = null;
    paleta.querySelectorAll('.pintura-cor').forEach((b) => {
      const sim = Number(b.dataset.cor) === corAtual;
      b.classList.toggle('escolhida', sim);
      if (sim) escolhida = b;
    });
    if (escolhida) trazerParaVista(escolhida);
  };

  // ---- A fileira que rola ------------------------------------------------
  // Em pé a paleta é uma linha que rola para o lado; deitado, uma coluna que
  // rola para baixo. As setas aparecem só do lado em que ainda há cor
  // escondida, e um toque nelas rola quase uma tela de bolinhas.
  const setas = [...raiz.querySelectorAll('.pintura-seta')];
  const emColuna = () => paleta.scrollHeight > paleta.clientHeight + 2 && paleta.scrollWidth <= paleta.clientWidth + 2;
  function atualizarSetas() {
    const col = emColuna();
    const pos = col ? paleta.scrollTop : paleta.scrollLeft;
    const max = col ? paleta.scrollHeight - paleta.clientHeight : paleta.scrollWidth - paleta.clientWidth;
    setas[0].hidden = !(max > 2 && pos > 2);
    setas[1].hidden = !(max > 2 && pos < max - 2);
    paleta.parentElement.classList.toggle('rola', max > 2);
  }
  // Rola o mínimo para a bolinha ficar inteira à vista (sem mexer na página).
  function trazerParaVista(b) {
    const col = emColuna();
    const ini = col ? b.offsetTop - paleta.offsetTop : b.offsetLeft - paleta.offsetLeft;
    const tam = col ? b.offsetHeight : b.offsetWidth;
    const pos = col ? paleta.scrollTop : paleta.scrollLeft;
    const vista = col ? paleta.clientHeight : paleta.clientWidth;
    const folga = tam * 0.6 + 16;   // fora do degradê da borda
    let alvo = pos;
    if (ini - folga < pos) alvo = ini - folga;
    else if (ini + tam + folga > pos + vista) alvo = ini + tam + folga - vista;
    if (alvo !== pos) paleta.scrollTo({ [col ? 'top' : 'left']: alvo, behavior: 'smooth' });
  }
  paleta.addEventListener('scroll', atualizarSetas, { passive: true });
  new ResizeObserver(atualizarSetas).observe(paleta);
  setas.forEach((s) => s.addEventListener('click', () => {
    sfx.tap();
    const col = emColuna();
    const passo = (col ? paleta.clientHeight : paleta.clientWidth) * 0.75 * Number(s.dataset.seta);
    paleta.scrollBy({ [col ? 'top' : 'left']: passo, behavior: 'smooth' });
  }));
  // Por números: a cor que já pintou todas as suas áreas ganha um ✓.
  const marcarCompletas = () => {
    if (!numeros()) return;
    const falta = new Set();
    gab.alvo.forEach((c, a) => { if (c >= 0 && cores[a] !== c) falta.add(c); });
    paleta.querySelectorAll('.pintura-cor').forEach((b) => b.classList.toggle('completa', !falta.has(Number(b.dataset.cor))));
    return falta;
  };

  // A camada inteira de novo: no modo por números o destaque da cor
  // escolhida muda junto com ela.
  function repintar() {
    const destaque = numeros()
      ? ((tom) => (n) => (gab.alvo[n] === corAtual && cores[n] === undefined ? tom : null))(clarinho(tintas[corAtual]))
      : null;
    pintarCamada(camada, pagina, (n) => corDaArea(tintas, cores, n, destaque));
  }

  // Os números por cima do desenho, nas áreas que ainda esperam cor. O
  // tamanho sai da área (cabe no maior círculo dentro dela), mas nunca menor
  // que uns 11 px na tela: número que ninguém lê não ajuda. As pequenas
  // demais para isso ficam sem número até ampliar — o tom claro da cor
  // escolhida mostra onde estão.
  //
  // Os da cor escolhida saltam: maiores, numa bolinha da cor com contorno
  // roxo. Os das outras cores ficam menores e apagados, para não competir.
  function escreverNumeros() {
    if (!numeros()) return;
    const { centro, raio } = centros(pagina);
    // A escala na tela, com o zoom: ampliado, cabem números em áreas menores.
    const escala = ((canvas.clientWidth || pagina.L) * zoom) / pagina.L;
    const minimo = 11 / escala;
    const tinta = tintas[corAtual];
    const letraNaBolinha = clara(tinta) ? '#3a1f4d' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const escolhidas = [];
    for (let a = 0; a < pagina.areas; a++) {
      const alvo = gab.alvo[a];
      if (alvo < 0 || cores[a] === alvo) continue;
      const tam = Math.min(raio[a] * 1.25, 54);
      if (tam < minimo * 0.8) continue;
      if (alvo === corAtual) { escolhidas.push(a); continue; }
      const fonte = Math.max(tam * 0.8, minimo);
      const x = centro[a] % pagina.L;
      const y = Math.floor(centro[a] / pagina.L);
      ctx.font = `700 ${fonte.toFixed(0)}px system-ui, sans-serif`;
      ctx.lineWidth = fonte * 0.2;
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.strokeText(String(alvo + 1), x, y);
      ctx.fillStyle = 'rgba(138,122,156,.75)';
      ctx.fillText(String(alvo + 1), x, y);
    }
    // As da cor escolhida por último, por cima de tudo.
    for (const a of escolhidas) {
      const fonte = Math.max(Math.min(raio[a] * 1.1, 46), minimo * 1.6);
      const x = centro[a] % pagina.L;
      const y = Math.floor(centro[a] / pagina.L);
      const r = fonte * 0.78;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = tinta;
      ctx.fill();
      ctx.lineWidth = Math.max(fonte * 0.14, 2 / escala);
      ctx.strokeStyle = '#7a4ec7';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r + ctx.lineWidth, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(fonte * 0.08, 1.5 / escala);
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.font = `900 ${fonte.toFixed(0)}px system-ui, sans-serif`;
      ctx.fillStyle = letraNaBolinha;
      ctx.fillText(String(corAtual + 1), x, y + fonte * 0.04);
    }
  }

  const mostrar = () => {
    compor(ctx, camada, pagina.img);
    escreverNumeros();
  };
  const mudou = () => aoMudar({ areas: pagina.areas, cores: { ...cores } });

  const escolher = (i) => {
    corAtual = i;
    armarDica();
    marcarEscolhida();
    if (pagina && numeros()) { repintar(); mostrar(); }
  };

  function comemorar() {
    sfx.win();
    pronta.hidden = false;
    clearTimeout(prontaTimer);
    prontaTimer = setTimeout(() => { pronta.hidden = true; }, 3200);
  }

  paleta.addEventListener('click', (e) => {
    const b = e.target.closest('.pintura-cor');
    if (!b) return;
    sfx.tap();
    escolher(Number(b.dataset.cor));
  });

  // ---- Zoom só no desenho ------------------------------------------------
  // Dois dedos ampliam e movem; ampliado, um dedo arrastando passeia pelo
  // desenho; no computador, a rodinha amplia em volta do ponteiro. O toque
  // que pinta é o que sobe sem ter arrastado (por isso pinta ao soltar).
  // O canvas só ganha um transform (origem no canto de cima): o
  // getBoundingClientRect já devolve o retângulo ampliado, então a conta de
  // qual área foi tocada não muda.
  const ZOOM_MAX = 6;
  const ARRASTO = 10;      // px na tela que deixam de ser toque e viram arrasto
  let zoom = 1; let tx = 0; let ty = 0;
  const dedos = new Map(); // pointerId → { x, y }
  let gesto = null;        // { tipo: 'toque' | 'arrasto' | 'pinca', ... }
  let redesenho = 0;

  function aplicarZoom() {
    const w = canvas.offsetWidth; const h = canvas.offsetHeight;
    zoom = Math.min(ZOOM_MAX, Math.max(1, zoom));
    tx = Math.min(0, Math.max(w * (1 - zoom), tx));
    ty = Math.min(0, Math.max(h * (1 - zoom), ty));
    canvas.style.transform = zoom === 1 ? '' : `translate(${tx}px, ${ty}px) scale(${zoom})`;
    canvas.classList.toggle('ampliado', zoom > 1);
    if (dicaArea >= 0) posicionarDica();
  }
  // Os números dependem do tamanho na tela: redesenha quando o zoom para.
  const redesenharLogo = () => {
    clearTimeout(redesenho);
    redesenho = setTimeout(() => { if (pagina && numeros()) mostrar(); }, 120);
  };
  const zerarZoom = () => { zoom = 1; tx = 0; ty = 0; aplicarZoom(); };
  // Amplia para `novo` mantendo o ponto da tela (cx, cy) no mesmo lugar.
  function ampliarEm(novo, cx, cy) {
    const r = canvas.getBoundingClientRect();
    const baseX = r.left - tx; const baseY = r.top - ty;
    const px = (cx - r.left) / zoom; const py = (cy - r.top) / zoom;
    zoom = Math.min(ZOOM_MAX, Math.max(1, novo));
    tx = cx - baseX - zoom * px;
    ty = cy - baseY - zoom * py;
    aplicarZoom();
  }
  const meio = () => {
    const [a, b] = [...dedos.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (!pagina) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* dedo que o navegador já soltou */ }
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 1) {
      gesto = { tipo: 'toque', x0: e.clientX, y0: e.clientY, tx0: tx, ty0: ty };
    } else if (dedos.size === 2) {
      const m = meio();
      gesto = { tipo: 'pinca', d0: m.d, z0: zoom, mx: m.x, my: m.y };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId) || !gesto) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesto.tipo === 'pinca' && dedos.size >= 2) {
      const m = meio();
      // Primeiro move junto com o meio dos dedos, depois amplia em volta dele.
      tx += m.x - gesto.mx; ty += m.y - gesto.my;
      gesto.mx = m.x; gesto.my = m.y;
      aplicarZoom();
      ampliarEm(gesto.z0 * (m.d / gesto.d0), m.x, m.y);
      return;
    }
    const dx = e.clientX - gesto.x0; const dy = e.clientY - gesto.y0;
    if (gesto.tipo === 'toque' && Math.hypot(dx, dy) > ARRASTO) gesto.tipo = zoom > 1 ? 'arrasto' : 'nada';
    if (gesto.tipo === 'arrasto') {
      tx = gesto.tx0 + dx; ty = gesto.ty0 + dy;
      aplicarZoom();
    }
  });
  const soltar = (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.delete(e.pointerId);
    const era = gesto;
    if (dedos.size === 0) {
      gesto = null;
      if (era?.tipo === 'toque' && e.type === 'pointerup') tocar(e.clientX, e.clientY);
      if (era && era.tipo !== 'toque') redesenharLogo();
    } else if (era?.tipo === 'pinca') {
      // Sobrou um dedo depois da pinça: ele não pinta ao subir.
      const [um] = dedos.values();
      gesto = { tipo: 'arrasto', x0: um.x, y0: um.y, tx0: tx, ty0: ty };
    }
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('wheel', (e) => {
    if (!pagina) return;
    e.preventDefault();
    ampliarEm(zoom * Math.exp(-e.deltaY * 0.0025), e.clientX, e.clientY);
    redesenharLogo();
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => {
    if (!pagina || e.pointerType === 'touch') return;
    if (zoom > 1) zerarZoom(); else ampliarEm(2.5, e.clientX, e.clientY);
    redesenharLogo();
  });

  function tocar(clientX, clientY) {
    if (!pagina) return;
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - r.left) / r.width) * pagina.L);
    const y = Math.floor(((clientY - r.top) / r.height) * pagina.A);
    const n = areaNoPonto(pagina, x, y);
    if (n < 0) return;
    const antes = cores[n] ?? BORRACHA;
    if (numeros()) {
      const alvo = gab.alvo[n];
      if (alvo < 0 || cores[n] === alvo) return;       // fica branca, ou já está certa
      if (alvo !== corAtual) { sfx.deny(); return; }    // não é esta cor
      historico.push({ n, antes: cores[n] });
      cores[n] = corAtual;
      pintarArea(camada, pagina, n, rgb(tintas[corAtual]));
      sfx.pick();
      armarDica();
      const falta = marcarCompletas();
      // A cor acabou: passa sozinho para a próxima que ainda falta.
      if (!falta.has(corAtual) && falta.size) escolher(Math.min(...falta));
      else mostrar();
      mudou();
      if (!falta.size) comemorar();
      return;
    }
    if (antes === corAtual) return;
    historico.push({ n, antes });
    if (corAtual === BORRACHA) delete cores[n];
    else cores[n] = corAtual;
    pintarArea(camada, pagina, n, rgb(CORES[corAtual]));
    mostrar();
    sfx.pick();
    mudou();
  }

  raiz.addEventListener('click', (e) => {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (!acao) return;
    if (acao === 'voltar') { sfx.tap(); aoVoltar(); return; }
    if (!pagina) return;
    if (acao === 'desfazer') {
      const passo = historico.pop();
      if (!passo) { sfx.deny(); return; }
      sfx.tap();
      if (passo.tudo) cores = passo.tudo;
      else if (passo.antes === undefined || passo.antes === BORRACHA && !numeros()) delete cores[passo.n];
      else cores[passo.n] = passo.antes;
      repintar();
      marcarCompletas();
      mostrar();
      mudou();
      armarDica();
    }
    if (acao === 'limpar') {
      if (Object.keys(cores).length <= Object.keys(fixas).length) { sfx.deny(); return; }
      // Limpar também se desfaz: um toque sem querer não apaga a tarde
      // inteira de pintura.
      sfx.tap();
      historico.push({ tudo: cores });
      cores = { ...fixas };
      repintar();
      marcarCompletas();
      mostrar();
      mudou();
      armarDica();
    }
  });

  // O tamanho dos números depende do tamanho do desenho na tela.
  new ResizeObserver(() => { aplicarZoom(); if (pagina && numeros()) mostrar(); }).observe(canvas);

  return {
    async abrir(id, guardado, callbacks, qualModo = 'livre') {
      ({ aoMudar, aoVoltar } = callbacks);
      const minha = ++abertura;
      raiz.hidden = false;
      nome.innerHTML = withIcons(t(DESENHO[id].nome));
      pagina = null;
      historico = [];
      dedos.clear();
      gesto = null;
      zerarZoom();
      pronta.hidden = true;
      clearTimeout(dicaTimer);
      esconderDica();
      canvas.hidden = true;
      espera.hidden = false;
      paleta.innerHTML = '';
      // Um quadro para a tela aparecer com o "preparando" antes de o
      // navegador travar dividindo o desenho.
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const pronto = await preparar(id);
      if (minha !== abertura || raiz.hidden) return;
      modo = qualModo;
      gab = numeros() ? gabarito(id, pronto.areas) : null;
      if (numeros() && !gab) modo = 'livre';
      if (numeros()) centros(pronto);
      tintas = numeros() ? gab.cores : CORES;
      pagina = pronto;
      canvas.width = pagina.L;
      canvas.height = pagina.A;
      canvas.style.aspectRatio = `${pagina.L} / ${pagina.A}`;
      camada = ctx.createImageData(pagina.L, pagina.A);
      fixas = numeros() ? automaticas(gab, centros(pagina).raio, pagina.L) : {};
      cores = numeros() ? coresDaPagina(pagina, gab, guardado) : coresGuardadas(guardado, pagina.areas);
      montarPaleta();
      corAtual = 0;
      if (numeros()) {
        const falta = marcarCompletas();
        if (falta.size) corAtual = Math.min(...falta);
      }
      canvas.hidden = false;
      espera.hidden = true;
      marcarEscolhida();
      atualizarSetas();
      repintar();
      mostrar();
      armarDica();
    },
    fechar() {
      raiz.hidden = true;
      pagina = null;
      clearTimeout(prontaTimer);
      clearTimeout(dicaTimer);
      esconderDica();
    },
    aberta: () => !raiz.hidden,
  };
}
