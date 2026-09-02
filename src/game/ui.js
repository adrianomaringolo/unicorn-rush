// Ponte entre o jogo e o HTML do HUD.
//
// É aqui que os emoji do código viram os ícones do jogo: todo texto que vai
// para a tela passa por `withIcons` (ver src/game/icons.js).
import { sfx } from './audio.js';
import { withIcons } from './icons.js';

const $ = (sel) => document.querySelector(sel);

// Quanto tempo o adulto segura o 👑 para abrir o cantinho dele. Longo o
// bastante para a criança não abrir sem querer, curto para não irritar.
const HOLD_TIME = 1100;

export function createUI() {
  const score = $('#score');
  const hearts = $('#hearts');
  const goal = $('#goal');
  const keys = $('#keys');
  const level = $('#level');
  const lives = $('#lives');
  const best = $('#best');
  const distance = $('#distance');
  const overlay = $('#overlay');
  const card = $('#overlay .card');
  const title = $('#overlay-title');
  const text = $('#overlay-text');
  const buttons = $('#overlay-buttons');
  const extra = $('#overlay-extra');
  const backButton = $('#overlay-back');
  const grownButton = $('#overlay-grown');
  const wallet = $('#wallet');
  const testBadge = $('#test-badge');
  const hud = $('#hud');
  const stage = $('#stage');
  const powers = $('#powers');
  const pauseButton = $('#pause');
  const rushButton = $('#rush');
  const speedPanel = $('#speed');
  const speedValue = $('#speed-value');
  const speedBar = speedPanel.querySelector('.gauge-bar i');
  const toast = $('#toast');
  const lesson = $('#lesson');
  const lessonBox = $('#lesson-box');
  const lessonDots = $('#lesson-dots');
  const lessonHint = $('#lesson-hint');
  const lessonOk = $('#lesson-ok');
  const confetti = $('#confetti');
  const touch = $('#touch-controls');
  const flash = $('#flash');
  let toastTimer = null;
  let okTimer = null;

  const showToast = (message) => {
    toast.innerHTML = withIcons(message);
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
  };

  // Cantinho dos adultos: só abre segurando o dedo. Um toque rápido explica
  // o que fazer, em vez de não fazer nada (silêncio parece defeito).
  let holdTimer = null;
  let holdDone = false;
  let onGrown = null;
  const cancelHold = () => {
    clearTimeout(holdTimer);
    grownButton.classList.remove('holding');
  };
  grownButton.addEventListener('pointerdown', () => {
    if (!onGrown) return;
    holdDone = false;
    grownButton.classList.add('holding');
    holdTimer = setTimeout(() => {
      holdDone = true;
      cancelHold();
      sfx.pick();
      onGrown();
    }, HOLD_TIME);
  });
  for (const event of ['pointerup', 'pointerleave', 'pointercancel']) {
    grownButton.addEventListener(event, () => {
      if (holdDone) return;
      cancelHold();
      if (event === 'pointerup') {
        sfx.deny();
        showToast('Segure o dedo aqui 👆');
      }
    });
  }
  grownButton.addEventListener('contextmenu', (e) => e.preventDefault());

  let onBack = null;
  backButton.addEventListener('click', () => {
    if (!onBack) return;
    sfx.tap();
    onBack();
  });

  return {
    setScore: (v) => { score.textContent = Math.floor(v); },
    setHearts: (v) => { hearts.textContent = v; },
    setBest: (v) => { best.textContent = Math.floor(v); },
    setDistance: (v) => { distance.textContent = Math.floor(v); },
    setGoal: (v, target) => { goal.textContent = target ? `${v}/${target}` : '∞'; },
    // Nas Fases a chave tem meta (`3/5`); na Aventura ela só vai somando.
    setKeys: (v, total) => { keys.textContent = total ? `${v}/${total}` : `${v}`; },

    // O botão de pausa só aparece durante a corrida.
    showPause: (visible) => {
      pauseButton.hidden = !visible;
      // O ⚡ e o velocímetro vivem embaixo do pause: somem junto quando a
      // corrida acaba.
      if (!visible) rushButton.hidden = true;
      speedPanel.hidden = !visible;
    },
    onPause: (handler) => pauseButton.addEventListener('click', handler),

    // Velocímetro: o número que está passando e a barra em relação ao teto
    // daquela pista (contando o empurrão do ⚡, senão ela grudaria no fim).
    setSpeed: (valor, fracao) => {
      speedValue.textContent = Math.round(valor);
      speedBar.style.width = `${Math.round(Math.min(1, Math.max(0, fracao)) * 100)}%`;
      speedPanel.classList.toggle('cheio', fracao > 0.85);
    },

    // O ⚡ só existe quando o unicórnio está numa pista em que ele é rápido.
    showRush: (visible, ligado = false) => {
      rushButton.hidden = !visible;
      rushButton.classList.toggle('ligado', !!ligado);
      rushButton.setAttribute('aria-pressed', String(!!ligado));
    },
    onRush: (handler) => rushButton.addEventListener('click', handler),
    setLevel: (v) => { level.textContent = v; },

    // Carteira: as chaves mágicas guardadas (a moeda do jogo). Normalmente
    // só aparece quando há alguma; na loja ela aparece mesmo zerada, senão
    // não dá para entender por que o unicórnio está trancado.
    setWallet: (total, sempre = false) => {
      wallet.innerHTML = withIcons(`🔑 ${total}`);
      wallet.hidden = !total && !sempre;
    },
    // Selo do modo teste, ao lado do nome do jogo.
    setTestBadge: (on) => { testBadge.hidden = !on; },

    setLives: (v) => {
      lives.innerHTML = withIcons('💗'.repeat(Math.max(0, v)) + '🖤'.repeat(Math.max(0, 3 - v)));
    },

    // O HUD muda de acordo com o modo: "Meta" no Livre, "Vidas" na Aventura.
    setMode: (mode) => { hud.dataset.mode = mode.id; },

    // Power-ups ligados agora, com a barrinha do tempo que falta.
    setPowers: (list) => {
      powers.textContent = '';
      for (const item of list) {
        const chip = document.createElement('div');
        chip.className = 'power';
        chip.innerHTML = `<span class="power-face">${withIcons(item.emoji)}</span>`
          + `<span class="power-bar"><i style="width:${Math.round(item.ratio * 100)}%"></i></span>`;
        powers.appendChild(chip);
      }
    },

    // Avisinho no meio da tela ("Invencível!", "Mais uma vida!"…).
    toast: showToast,

    // As bolinhas do progresso da lição: quantas aulas já passaram e quantas
    // faltam. Mesma linguagem das páginas do livro da história.
    setLessonProgress: (feitas, total) => {
      if (!total) { lessonDots.hidden = true; return; }
      lessonDots.textContent = '';
      for (let i = 0; i < total; i++) {
        const b = document.createElement('i');
        b.className = i < feitas ? 'feita' : i === feitas ? 'agora' : '';
        lessonDots.appendChild(b);
      }
      lessonDots.hidden = false;
      lessonDots.setAttribute('aria-label', `Aula ${feitas + 1} de ${total}`);
    },

    // A seta do movimento que a aula pede. Aparece piscando e, no celular,
    // acende também o próprio botão de toque: a criança não precisa traduzir
    // a seta da tela para o botão do polegar.
    setLessonHint: (acao) => {
      touch?.querySelectorAll('button').forEach((b) => b.classList.remove('pedindo'));
      rushButton.classList.remove('pedindo');
      if (!acao) { lessonHint.hidden = true; return; }
      // O ⚡ não mora na fileira de toque, e sim no canto do HUD: a aula dele
      // não tem seta embaixo, acende o próprio botão.
      if (acao === 'rapido') {
        lessonHint.hidden = true;
        rushButton.classList.add('pedindo');
        return;
      }
      // O que cada casa mostra. O pulo duplo leva duas setas na mesma casa:
      // é o mesmo botão, tocado duas vezes.
      const pedido = {
        esquerda: { left: '⬅️' },
        direita: { right: '➡️' },
        lado: { left: '⬅️', right: '➡️' },
        pular: { jump: '⬆️' },
        'pulo-duplo': { jump: '⬆️⬆️' },
      }[acao] || {};
      for (const casa of lessonHint.children) {
        const seta = pedido[casa.dataset.seta];
        casa.innerHTML = seta ? withIcons(seta) : '';
        casa.classList.toggle('duplo', seta === '⬆️⬆️');
      }
      lessonHint.hidden = false;
      for (const nome of Object.keys(pedido)) {
        touch?.querySelector(`[data-action="${nome}"]`)?.classList.add('pedindo');
      }
    },

    // Papelzinho colorido, do meio da tela para fora. Cada pedaço é um
    // elemento que se joga fora sozinho quando termina.
    confetti: () => {
      const cores = ['#ff7b9d', '#ffb26b', '#ffe36b', '#8ce99a', '#74c0fc', '#c09cff'];
      for (let i = 0; i < 18; i++) {
        const p = document.createElement('i');
        const angulo = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
        const raio = 90 + Math.random() * 110;
        p.style.background = cores[i % cores.length];
        p.style.setProperty('--x', `${(Math.cos(angulo) * raio).toFixed(0)}px`);
        // Sobem menos do que descem: o papel cai, não flutua.
        p.style.setProperty('--y', `${(Math.sin(angulo) * raio * 0.75 + 70).toFixed(0)}px`);
        p.style.setProperty('--giro', `${Math.round((Math.random() - 0.5) * 720)}deg`);
        p.style.animationDelay = `${(i % 5) * 0.03}s`;
        confetti.appendChild(p);
        setTimeout(() => p.remove(), 1500);
      }
    },

    // O ✅ de "isso mesmo!", no meio da tela.
    lessonCheck: () => {
      lessonOk.hidden = false;
      lessonOk.classList.remove('bate');
      void lessonOk.offsetWidth;
      lessonOk.classList.add('bate');
      // Esconder exatamente quando a animação acaba (850 ms, não 900): os
      // 50 ms de sobra eram uma janela em que o ✅ já tinha terminado de
      // sumir e voltava a aparecer — a segunda piscada. O `forwards` no CSS
      // fecha a mesma janela pelo outro lado.
      clearTimeout(okTimer);
      okTimer = setTimeout(() => { lessonOk.hidden = true; }, 850);
    },

    // A faixa da lição, no modo Aprender. Fica na tela enquanto a aula
    // dura — por isso não é o toast, que some sozinho.
    setLesson: (texto) => {
      // Quem aparece e some é a caixa: o CSS usa isso para empurrar o aviso
      // do meio da tela para baixo enquanto há aula na tela.
      if (!texto) { lessonBox.hidden = true; lesson.hidden = true; return; }
      lessonBox.hidden = false;
      if (lesson.dataset.texto === texto) return;   // a mesma aula: não repinta
      lesson.dataset.texto = texto;
      lesson.innerHTML = withIcons(texto);
      lesson.hidden = false;
      lesson.classList.remove('nova');
      void lesson.offsetWidth;
      lesson.classList.add('nova');
    },

    pop: () => {
      const el = hearts.closest('.panel');
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    },
    // Clarão vermelho + tremida: o "ai!" da batida.
    flash: () => {
      flash.classList.remove('hit');
      void flash.offsetWidth;
      flash.classList.add('hit');
    },
    // O clarão da Bomba Arco-Íris. É o mesmo elemento do clarão vermelho da
    // batida, com outra classe: um é o "ai!", o outro é o "uau!".
    rainbowFlash: () => {
      flash.classList.remove('hit', 'arcoiris');
      void flash.offsetWidth;
      flash.classList.add('arcoiris');
    },
    shake: () => {
      stage.classList.remove('shake');
      void stage.offsetWidth;
      stage.classList.add('shake');
    },

    // Chacoalha um pedaço qualquer do cartão (usado no tile ainda trancado):
    // o toque precisa responder alguma coisa, mesmo quando a resposta é não.
    shakeElement: (el) => {
      if (!el) return;
      el.classList.remove('nope');
      void el.offsetWidth;
      el.classList.add('nope');
    },

    showOverlay: ({
      title: t, text: x = '', html = '', buttons: list = [],
      back = null, grown = null, picker = false, wide = false, home = false,
      book = false, hint = false, arrows = true,
    }) => {
      title.innerHTML = withIcons(t || '');
      title.hidden = !t;
      // Nas telas de escolha o cartão fica mais baixo, para o personagem
      // girando aparecer embaixo dele no celular.
      card.classList.toggle('picker', picker);
      card.classList.toggle('wide', wide);
      card.classList.toggle('home', home);
      // O livro é o cartão inteiro virando página: sem marca, sem borda
      // rosa, com a figura sangrando até o topo (ver .card.livro no CSS).
      card.classList.toggle('livro', book);
      // O lembrete dos controles é para aprender o menu: só aparece nas
      // telas de escolha, e só fala em setas onde elas fazem alguma coisa.
      card.classList.toggle('no-hint', !hint);
      card.classList.toggle('no-arrows', !arrows);

      onBack = back;
      backButton.hidden = !back;
      onGrown = grown;
      grownButton.hidden = !grown;
      cancelHold();

      text.innerHTML = withIcons(x);
      text.hidden = !x;

      extra.innerHTML = withIcons(html);
      extra.hidden = !html;
      // As grades agora passam de uma tela (21 unicórnios, 15 pistas): abrir
      // já mostrando o escolhido evita a criança achar que ele sumiu.
      extra.querySelector('.escolhido')?.scrollIntoView({ block: 'nearest' });
      // Quando a grade passa da altura do cartão, o cartão avisa (o CSS
      // desbota as bordas): fileira cortada sem aviso parece defeito.
      card.classList.toggle('rola', extra.scrollHeight > extra.clientHeight + 1);

      buttons.textContent = '';
      for (const item of list) {
        const button = document.createElement('button');
        const classes = ['big-button'];
        if (item.secondary) classes.push('secondary');
        if (item.huge) classes.push('huge');
        button.className = classes.join(' ');
        button.innerHTML = withIcons(item.hint
          ? `<span class="button-label">${item.label}</span><small>${item.hint}</small>`
          : `<span class="button-label">${item.label}</span>`);
        button.addEventListener('click', () => {
          sfx.tap();
          item.onClick();
        });
        buttons.appendChild(button);
      }
      buttons.hidden = list.length === 0;
      overlay.classList.remove('hidden');
      hud.classList.add('dim');
    },

    hideOverlay: () => {
      overlay.classList.add('hidden');
      hud.classList.remove('dim');
    },

    // Cliques dentro do bloco livre (grade de fases, grade de personagens…).
    // O som sai daqui para todo tile ter resposta, inclusive o trancado —
    // quem decide qual som é o jogo, no `handler`.
    bindExtra: (handler) => {
      extra.onclick = (event) => {
        const target = event.target.closest('[data-pick]');
        if (target) handler(target.dataset.pick, target);
      };
    },

    // Enter/Espaço aciona o botão principal da tela (o grande, colorido).
    pressPrimaryButton: () => {
      const main = buttons.querySelector('button:not(.secondary)') || buttons.querySelector('button');
      main?.click();
    },
  };
}
