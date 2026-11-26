// A chuva de confete das comemorações: papelzinho caindo do alto, de ponta a
// ponta, balançando e girando (o CSS é o `.chuva-confete`, no style.css).
// Serve ao fim de fase (ui.chuvaDeConfete) e à página pintada (telaPintura).
//
// `criarChuva(el)` recebe a camada onde o papel cai e devolve:
//   soltar(segundos) — chove por esse tempo; novos pedaços nascem a cada
//                      90 ms e cada um some sozinho quando chega lá embaixo;
//   parar()          — corta a chuva e limpa o que ainda está caindo.
const CORES = ['#ff7b9d', '#ffb26b', '#ffe36b', '#8ce99a', '#74c0fc', '#c09cff', '#ffffff'];

export function criarChuva(el) {
  let timer = 0;
  const solta = (quantos) => {
    for (let i = 0; i < quantos; i++) {
      const p = document.createElement('i');
      const queda = 2.2 + Math.random() * 1.6;
      p.style.left = `${(Math.random() * 100).toFixed(1)}%`;
      p.style.background = CORES[Math.floor(Math.random() * CORES.length)];
      p.style.setProperty('--balanco', `${Math.round((Math.random() - 0.5) * 120)}px`);
      p.style.setProperty('--giro', `${Math.round((Math.random() - 0.5) * 1080)}deg`);
      p.style.animationDuration = `${queda.toFixed(2)}s`;
      if (Math.random() < 0.35) p.classList.add('fita');
      el.appendChild(p);
      setTimeout(() => p.remove(), queda * 1000 + 100);
    }
  };
  return {
    soltar(segundos) {
      clearInterval(timer);
      const fim = performance.now() + segundos * 1000;
      solta(24);                               // a primeira leva já enche a tela
      timer = setInterval(() => {
        if (performance.now() > fim) return clearInterval(timer);
        solta(4);
      }, 90);
    },
    parar() {
      clearInterval(timer);
      el.textContent = '';
    },
  };
}
