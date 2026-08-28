// Ponte entre o jogo e o HTML do HUD.
const $ = (sel) => document.querySelector(sel);

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
  const chips = $('#overlay-chips');
  const extra = $('#overlay-extra');
  const steps = $('#overlay-steps');
  const hud = $('#hud');
  const stage = $('#stage');
  const powers = $('#powers');
  const pauseButton = $('#pause');
  const toast = $('#toast');
  const flash = $('#flash');
  let toastTimer = null;

  // Fileira de escolhas do passo atual (pistas ou personagens).
  const fillChips = (items) => {
    chips.textContent = '';
    chips.hidden = items.length === 0;
    for (const item of items) {
      const chip = document.createElement('button');
      chip.className = item.active ? 'chip active' : 'chip';
      chip.innerHTML = `<span class="chip-face">${item.emoji}</span>${item.name}`;
      chip.setAttribute('aria-pressed', String(!!item.active));
      chip.addEventListener('click', item.onClick);
      chips.appendChild(chip);
    }
  };

  // Bolinhas mostrando em que passo da escolha a criança está.
  const fillSteps = (step) => {
    steps.textContent = '';
    steps.hidden = !step;
    if (!step) return;
    for (let i = 1; i <= step.total; i++) {
      const dot = document.createElement('span');
      dot.className = i === step.index ? 'step-dot active' : 'step-dot';
      steps.appendChild(dot);
    }
  };

  return {
    setScore: (v) => { score.textContent = Math.floor(v); },
    setHearts: (v) => { hearts.textContent = v; },
    setBest: (v) => { best.textContent = Math.floor(v); },
    setDistance: (v) => { distance.textContent = Math.floor(v); },
    setGoal: (v, target) => { goal.textContent = target ? `${v}/${target}` : '∞'; },
    setKeys: (v, total) => { keys.textContent = `${v}/${total}`; },

    // O botão de pausa só aparece durante a corrida.
    showPause: (visible) => { pauseButton.hidden = !visible; },
    onPause: (handler) => pauseButton.addEventListener('click', handler),
    setLevel: (v) => { level.textContent = v; },
    setLives: (v) => {
      lives.textContent = '💗'.repeat(Math.max(0, v)) + '🖤'.repeat(Math.max(0, 3 - v));
    },

    // O HUD muda de acordo com o modo: "Meta" no Livre, "Vidas" na Aventura.
    setMode: (mode) => { hud.dataset.mode = mode.id; },

    // Power-ups ligados agora, com a barrinha do tempo que falta.
    setPowers: (list) => {
      powers.textContent = '';
      for (const item of list) {
        const chip = document.createElement('div');
        chip.className = 'power';
        chip.innerHTML = `<span class="power-face">${item.emoji}</span>`
          + `<span class="power-bar"><i style="width:${Math.round(item.ratio * 100)}%"></i></span>`;
        powers.appendChild(chip);
      }
    },

    // Avisinho no meio da tela ("Invencível!", "Mais uma vida!"…).
    toast: (message) => {
      toast.textContent = message;
      toast.classList.remove('show');
      void toast.offsetWidth;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
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
    shake: () => {
      stage.classList.remove('shake');
      void stage.offsetWidth;
      stage.classList.add('shake');
    },

    showOverlay: ({ title: t, text: x = '', html = '', buttons: list = [], chips: options = [], step = null, picker = false }) => {
      title.textContent = t;
      // Nas telas de escolha o cartão fica mais baixo, para o personagem
      // girando aparecer embaixo dele no celular.
      card.classList.toggle('picker', picker);
      fillSteps(step);
      fillChips(options);

      text.innerHTML = x;
      text.hidden = !x;

      extra.innerHTML = html;
      extra.hidden = !html;

      buttons.textContent = '';
      for (const item of list) {
        const button = document.createElement('button');
        button.className = item.secondary ? 'big-button secondary' : 'big-button';
        button.innerHTML = item.hint
          ? `${item.label}<small>${item.hint}</small>`
          : item.label;
        button.addEventListener('click', item.onClick);
        buttons.appendChild(button);
      }
      overlay.classList.remove('hidden');
      hud.classList.add('dim');
    },

    hideOverlay: () => {
      overlay.classList.add('hidden');
      hud.classList.remove('dim');
    },

    // Cliques dentro do bloco livre (usado pela grade de fases).
    bindExtra: (handler) => {
      extra.onclick = (event) => {
        const target = event.target.closest('[data-level]');
        if (target && !target.disabled) handler(Number(target.dataset.level));
      };
    },

    // Enter/Espaço aciona o primeiro botão da tela (o "continuar" do passo).
    pressFirstButton: () => buttons.querySelector('button')?.click(),
  };
}
