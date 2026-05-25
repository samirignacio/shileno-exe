/* =============================================
   psychosis.js — Niveles de psicosis y efectos
   ============================================= */

function psychosisLevel() {
  const d = gs.delirio, c = gs.cordura;
  if (d >= 100 || c <= 0)  return 4;
  if (d >= 90  || c <= 15) return 3;
  if (d >= 70  || c <= 30) return 2;
  if (d >= 50  || c <= 45) return 1;
  if (d >= 30  || c <= 60) return 0;
  return -1;
}

function updateCursedMode() {
  const b   = document.body;
  const lvl = psychosisLevel();
  b.classList.remove('cursed-mode','cursed-severe','cursed-critical','cursed-collapse');
  if      (lvl >= 4) b.classList.add('cursed-mode','cursed-collapse');
  else if (lvl >= 3) b.classList.add('cursed-mode','cursed-critical');
  else if (lvl >= 2) b.classList.add('cursed-mode','cursed-severe');
  else if (lvl >= 1) b.classList.add('cursed-mode');

  // Modo UFO siempre arranca con cursed
  if (gs.mode === 'ufo' && lvl < 1) b.classList.add('cursed-mode');
}

function screenShake() {
  const lvl = psychosisLevel();
  const cls = lvl >= 3 ? 'shake-hard' : 'shake';
  document.body.classList.add(cls);
  document.body.addEventListener('animationend', () => {
    document.body.classList.remove('shake','shake-hard');
  }, { once: true });
}

function startAutoShake(level) {
  if (gs.autoShakeTimer) clearInterval(gs.autoShakeTimer);
  const interval = level >= 4 ? 1000 : 2800;
  gs.autoShakeTimer = setInterval(() => {
    if (Math.random() < 0.55) screenShake();
  }, interval);
}

function stopAutoShake() {
  if (gs.autoShakeTimer) {
    clearInterval(gs.autoShakeTimer);
    gs.autoShakeTimer = null;
  }
}
