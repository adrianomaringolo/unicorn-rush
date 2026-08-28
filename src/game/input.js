// Entrada: teclado, toque (arrastar) e botões na tela — pensado para crianças.
export function createInput(target, handlers) {
  const { onLeft, onRight, onJump, onStart, onPause } = handlers;

  const keyMap = {
    ArrowLeft: onLeft, KeyA: onLeft,
    ArrowRight: onRight, KeyD: onRight,
    ArrowUp: onJump, KeyW: onJump, Space: onJump,
  };

  const onKeyDown = (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); onPause?.(); return; }
    const action = keyMap[e.code];
    if (action) { e.preventDefault(); action(); }
    if (e.code === 'Enter' || e.code === 'Space') onStart?.();
  };
  window.addEventListener('keydown', onKeyDown);

  let startX = 0, startY = 0, startTime = 0;
  const onPointerDown = (e) => {
    startX = e.clientX; startY = e.clientY; startTime = performance.now();
  };
  const onPointerUp = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const quick = performance.now() - startTime < 600;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? onRight() : onLeft();
    } else if (dy < -40 || (quick && Math.abs(dx) < 20 && Math.abs(dy) < 20)) {
      onJump();
    }
  };
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointerup', onPointerUp);

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      ({ left: onLeft, right: onRight, jump: onJump })[btn.dataset.action]?.();
    });
  });
}
