/* =============================================
   splash.js — Pantalla de inicio y selección de modo
   ============================================= */

function selectMode(btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active-mode'));
  btn.classList.add('active-mode');
  selectedMode = btn.dataset.mode;
}

function startGame() {
  const splash   = document.getElementById('splash-screen');
  const layout   = document.getElementById('main-layout');
  const bannerAd = document.getElementById('banner-ad');

  // Disparar popunder UNA sola vez por sesión
  if (typeof firePopunder === 'function') firePopunder();

  // Inicializar estado según modo seleccionado
  initState();

  // Modo UFO arranca con cursed mode activo
  if (selectedMode === 'ufo') {
    document.body.classList.add('cursed-mode');
  }

  // Animación de salida del splash
  splash.classList.add('hide');

  setTimeout(() => {
    splash.style.display = 'none';
    layout.style.display = 'flex';
    if (bannerAd) bannerAd.style.display = 'flex';
    updateUI();
    loadEvent();
  }, 650);
}

// ── INIT al cargar la página ──────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Seleccionar modo normal por defecto
  const defaultBtn = document.querySelector('.mode-btn[data-mode="normal"]');
  if (defaultBtn) selectMode(defaultBtn);
});
