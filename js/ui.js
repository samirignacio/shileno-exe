/* =============================================
   ui.js — Actualización de interfaz y stats
   ============================================= */

function updateUI() {
  const set      = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  const setClass = (id, cls) => { const el = document.getElementById(id); if (el) el.className = cls; };

  set('stat-plata',      '$' + gs.plata.toLocaleString('es-CL'));
  set('stat-vulnerable', gs.vulnerable);
  set('stat-cordura',    gs.cordura);
  set('stat-delirio',    gs.delirio);

  setClass('stat-cordura', 'stat-value' + (gs.cordura <= 20 ? ' danger' : gs.cordura <= 40 ? ' warning' : ''));
  setClass('stat-delirio', 'stat-value' + (gs.delirio >= 70 ? ' danger' : gs.delirio >= 40 ? ' warning' : ''));

  const bc = document.getElementById('bar-cordura');
  const bd = document.getElementById('bar-delirio');
  if (bc) { bc.style.width = Math.max(0, gs.cordura) + '%'; bc.className = 'stat-bar cordura' + (gs.cordura <= 40 ? ' low' : ''); }
  if (bd) { bd.style.width = Math.min(100, gs.delirio) + '%'; bd.className = 'stat-bar delirio' + (gs.delirio >= 50 ? ' high' : ''); }

  const stageInfo = currentStageInfo();
  if (stageInfo) {
    const diaLabel = gs.dia > 1 ? ` — DÍA ${gs.dia}` : '';
    set('game-stage', stageInfo.icon + ' ' + stageInfo.label + diaLabel);
  }

  updateCursedMode();

  // Actualizar fantasmas si cambió el nivel de psicosis
  const lvl = psychosisLevel();
  if (lvl !== gs.lastPsyLevel) {
    gs.lastPsyLevel = lvl;
    updateGhosts();
  }
}

function showErr(msg) {
  const el = document.getElementById('event-text');
  if (el) el.innerText = msg;
}
