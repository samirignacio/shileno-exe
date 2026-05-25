/* =============================================
   splash.js — Pantalla de inicio y selección de modo
   ============================================= */

function selectMode(btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active-mode'));
  btn.classList.add('active-mode');
  selectedMode = btn.dataset.mode;

  // Preview visual del modo en el splash
  const sprite = document.getElementById('splash-sprite');
  if (selectedMode === 'ufo') {
    document.body.classList.add('mode-ufo');
    if (sprite) sprite.src = 'assets/player-esquizo.png';
  } else {
    document.body.classList.remove('mode-ufo');
    if (sprite) sprite.src = 'assets/player-normal.png';
  }
}

function startGame() {
  const splash   = document.getElementById('splash-screen');
  const layout   = document.getElementById('main-layout');
  const bannerAd = document.getElementById('banner-ad');

  // Popunder una vez por sesión
  if (typeof firePopunder === 'function') firePopunder();

  // Inicializar estado
  initState();

  // Aplicar clase visual del modo
  document.body.classList.remove('mode-ufo');
  if (selectedMode === 'ufo') {
    document.body.classList.add('mode-ufo', 'cursed-mode');
    initAudio('ufo');
  }

  // Animación de salida
  splash.classList.add('hide');

  setTimeout(() => {
    splash.style.display = 'none';
    layout.style.display = 'flex';
    if (bannerAd) bannerAd.style.display = 'flex';

    // Fade in del audio UFO
    if (selectedMode === 'ufo' && audioPlayer) fadeInAudio();

    updateUI();
    loadEvent();
  }, 650);
}

// ── INIT ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const defaultBtn = document.querySelector('.mode-btn[data-mode="normal"]');
  if (defaultBtn) selectMode(defaultBtn);
});
