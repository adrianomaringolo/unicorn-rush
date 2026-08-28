// Botão de "instalar" do PWA.
//
// No Android/Chrome o navegador avisa que dá para instalar (evento
// `beforeinstallprompt`), e aí basta chamar o prompt dele. No iPhone não
// existe esse evento: lá a instalação é manual, pelo menu de compartilhar,
// então mostramos as instruções.
let promptGuardado = null;
let aoMudar = () => {};

export function isInstalled() {
  return matchMedia('(display-mode: standalone)').matches
    || matchMedia('(display-mode: fullscreen)').matches
    || navigator.standalone === true;
}

export function isIOS() {
  const ua = navigator.userAgent;
  const iPhoneOuIPad = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iPhoneOuIPad && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

// Dá para oferecer a instalação? (ou o navegador avisou, ou é iPhone)
export function canInstall() {
  if (isInstalled()) return false;
  return !!promptGuardado || isIOS();
}

// Só o iPhone precisa das instruções manuais.
export function needsManualInstall() {
  return !promptGuardado && isIOS();
}

export function watchInstall(callback) {
  aoMudar = callback || (() => {});
}

export async function promptInstall() {
  if (!promptGuardado) return 'manual';
  promptGuardado.prompt();
  const { outcome } = await promptGuardado.userChoice;
  if (outcome === 'accepted') {
    promptGuardado = null;
    aoMudar();
  }
  return outcome;
}

if (typeof window !== 'undefined') {
  addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();          // o convite é nosso, na hora certa
    promptGuardado = evento;
    aoMudar();
  });

  addEventListener('appinstalled', () => {
    promptGuardado = null;
    aoMudar();
  });
}
