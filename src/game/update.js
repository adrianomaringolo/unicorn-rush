// Atualização do jogo instalado.
//
// O service worker já sabe quando existe uma versão nova: ao buscar o
// `sw.js` e ver que os bytes mudaram, ele instala o novo e o deixa
// **esperando**. Antes o `sw.js` chamava `skipWaiting()` no install, o que
// fazia o novo assumir de imediato — e como a página aberta continua com o
// JavaScript que já interpretou, ela ficava num estado misto e precisava de
// dois recarregamentos.
//
// Agora o novo espera, a página segue inteira no cache velho (consistente),
// e quem decide a hora de trocar é o adulto, pelo botão. Um toque, um
// recarregamento.
let registro = null;
let esperando = null;
let versaoEsperando = null;
let aviso = () => {};
let recarregando = false;

// Existe versão nova instalada, esperando para assumir?
export function hasUpdate() {
  return !!esperando;
}

// Qual é ela. Vem por mensagem do próprio worker que espera, então demora
// um instante depois de `hasUpdate()` virar verdade — enquanto for `null`,
// quem quer oferecer a troca ainda não sabe o que está oferecendo, e o
// `onUpdate` é chamado de novo quando a resposta chega.
export function updateVersion() {
  return versaoEsperando;
}

// Chamado quando uma atualização aparece, para a tela se redesenhar.
export function onUpdate(callback) {
  aviso = callback || (() => {});
}

// Manda o worker novo assumir e recarrega quando ele assumir de verdade.
export function applyUpdate() {
  if (!esperando || recarregando) return false;
  recarregando = true;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    location.reload();
  }, { once: true });
  esperando.postMessage({ tipo: 'assumir' });
  return true;
}

export function watchUpdates() {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;

  addEventListener('load', async () => {
    try {
      registro = await navigator.serviceWorker.register('./sw.js');
    } catch {
      return;                      // sem offline, tudo bem
    }

    // Primeira visita: não existe versão anterior instalada, então o worker
    // que acabou de entrar não é "atualização" — é a instalação.
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.tipo !== 'versao') return;
      versaoEsperando = event.data.versao || null;
      aviso();                    // agora dá para oferecer sabendo qual é
    });

    const anotar = (worker) => {
      esperando = worker;
      worker.postMessage({ tipo: 'versao' });
      aviso();
    };

    const marcar = (worker) => {
      if (!worker) return;
      if (worker.state === 'installed') return anotar(worker);
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') anotar(worker);
      });
    };

    marcar(registro.waiting);
    registro.addEventListener('updatefound', () => marcar(registro.installing));

    // O navegador só busca o `sw.js` numa navegação, e num app instalado a
    // sessão dura horas: aqui a checagem acontece ao voltar do fundo e de
    // quinze em quinze minutos.
    const checar = () => registro.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checar();
    });
    setInterval(checar, 15 * 60 * 1000);
  });
}
