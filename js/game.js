/* =============================================
   game.js — Lógica principal del juego
   ============================================= */

function handleChoice(op, btn) {
  if (gs.optionsLocked) return;
  gs.optionsLocked = true;
  if (btn) btn.classList.add('chosen');

  // Aplicar efectos
  gs.plata      += op.efecto_plata      || 0;
  gs.cordura    += op.efecto_cordura    || 0;
  gs.delirio    += op.efecto_delirio    || 0;
  gs.vulnerable += op.efecto_vulnerable || 0;

  // Clamp
  gs.cordura = Math.min(100, Math.max(0,   gs.cordura));
  gs.delirio = Math.min(100, Math.max(0,   gs.delirio));

  // Sprite de reacción según magnitud del efecto
  let rx = null;
  if      ((op.efecto_cordura    || 0) <= -15)  rx = 'player-esquizo.png';
  else if ((op.efecto_plata      || 0) <= -5000) rx = 'player-derrotado.png';
  else if ((op.efecto_delirio    || 0) >= 15)   rx = 'player-puerco.png';
  else if ((op.efecto_cordura    || 0) >= 10)   rx = 'player-victoria.png';
  if (rx) reactionSprite(rx);

  // Shake en pérdidas grandes
  if ((op.efecto_cordura || 0) <= -15 || (op.efecto_plata || 0) <= -5000) screenShake();

  updateUI();

  // Verificar condición de colapso
  if (gs.cordura <= 0 || gs.delirio >= 100) {
    clearGhosts();
    setTimeout(() => triggerCollapse(), 700);
    return;
  }

  // Avanzar evento
  gs.stageEvents++;

  setTimeout(async () => {
    if (gs.stageEvents >= 3) {
      gs.stageEvents = 0;
      const doneKey = currentStageKey();
      gs.stageIdx++;

      if (gs.stageIdx >= currentStages().length) {
        clearGhosts();
        triggerVictory();
        return;
      }

      await showStageTransition(doneKey);
    }

    updateUI();
    loadEvent();
  }, 850);
}

// ── TRANSICIÓN DE ETAPA ──────────────────────
function showStageTransition(stageKey) {
  return new Promise(resolve => {
    const ov  = document.getElementById('stage-transition');
    if (!ov) { resolve(); return; }

    const lvl = psychosisLevel();
    const msgs = {
      morning:   { title:'MAÑANA COMPLETADA',   sub:'Aguantaste la mañana. Por ahora.',      icon:'🌅' },
      midday:    { title:'MEDIODÍA SOBREVIVIDO', sub:'El sol no te derritió. Aún.',           icon:'☀️' },
      afternoon: { title:'TARDE SUPERADA',       sub:'Falta solo la noche. La más difícil.',  icon:'🌆' }
    };

    const m = msgs[stageKey] || { title:'ETAPA OK', sub:'...', icon:'⏱️' };

    document.getElementById('stage-icon').innerText     = lvl >= 2 ? '💀' : m.icon;
    document.getElementById('stage-title').innerText    = lvl >= 2 ? '¿SIGUES AHÍ?' : m.title;
    document.getElementById('stage-subtitle').innerText = lvl >= 2 ? 'Las voces se hacen más fuertes...' : m.sub;

    ov.classList.add('active');
    if (lvl >= 2) ov.classList.add('cursed-overlay');

    setTimeout(() => {
      ov.classList.remove('active','cursed-overlay');
      resolve();
    }, 2000);
  });
}

// ── COLAPSO TOTAL ────────────────────────────
function triggerCollapse() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;

  document.body.classList.add('cursed-mode','cursed-collapse');

  layout.innerHTML = `
    <div class="collapse-screen">
      <div id="collapse-sprite-wrap">
        <img id="collapse-center" src="assets/player-esquizo.png" alt="">
        <img class="collapse-ghost cg-1" src="assets/player-enojado.png" alt="">
        <img class="collapse-ghost cg-2" src="assets/player-derrotado.png" alt="">
        <img class="collapse-ghost cg-3" src="assets/player-muerto.png" alt="">
        <img class="collapse-ghost cg-4" src="assets/player-corriendo.png" alt="">
        <img class="collapse-ghost cg-5" src="assets/player-puerco.png" alt="">
        <img class="collapse-ghost cg-6" src="assets/player-normal.png" alt="">
      </div>
      <p class="collapse-text" id="collapse-msg">.</p>
    </div>`;

  const msgs = ['.','..','...','no','NO','NO PUEDO MÁS','¿DÓNDE ESTOY?','TODO ES DEMASIADO','💀 GAME OVER'];
  let mi = 0;
  const msgEl = document.getElementById('collapse-msg');

  const iv = setInterval(() => {
    if (!msgEl) { clearInterval(iv); return; }
    msgEl.innerText = msgs[mi] || '';
    mi++;
    if (mi >= msgs.length) {
      clearInterval(iv);
      setTimeout(showGameOver, 500);
    }
  }, 370);
}

function showGameOver() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;

  const stageLabel = currentStageInfo()
    ? currentStageInfo().label
    : MODES[gs.mode].tables[currentStages()[Math.min(gs.stageIdx, currentStages().length - 1)]].label;

  layout.innerHTML = `
    <div class="end-screen gameover">
      <div class="end-icon">💀</div>
      <h1>GAME OVER</h1>
      <p>Tu mente colapsó por completo. Las voces ganaron.</p>
      <div class="stats-final">
        <p>Plata final: <span>$${gs.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura: <span>${Math.max(0, gs.cordura)}/100</span></p>
        <p>Delirio acumulado: <span>${gs.delirio}</span></p>
        <p>Etapa donde caíste: <span>${stageLabel}</span></p>
      </div>
      <p style="font-size:0.75em;color:#888;margin-bottom:14px;">📸 Comparte tu desastre</p>
      <button class="btn-restart" onclick="location.reload()">🔄 REINTENTAR DÍA</button>
    </div>`;
}

// ── VICTORIA ─────────────────────────────────
function triggerVictory() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;

  document.body.classList.remove('cursed-mode','cursed-collapse','cursed-critical','cursed-severe');

  layout.innerHTML = `
    <div class="end-screen victoria">
      <div class="end-icon">🏆</div>
      <h1>¡SOBREVIVISTE!</h1>
      <p>Llegaste al amanecer con la cabeza (más o menos) sobre los hombros.</p>
      <div class="stats-final">
        <p>Saldo final en Cuenta RUT: <span>$${gs.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura restante: <span>${gs.cordura}/100</span></p>
        <p>Delirio acumulado: <span>${gs.delirio}</span></p>
        <p>Vulnerabilidad: <span>${gs.vulnerable}</span></p>
      </div>
      <p style="font-size:0.78em;color:#888;margin-bottom:8px;">📸 Toma screenshot y compártelo</p>
      <a class="btn-donacion" href="https://cafecito.app" target="_blank" rel="noopener">
        ☕ Invítale un Súper 8 al dev
      </a>
      <button class="btn-restart" onclick="location.reload()">🎮 JUGAR DE NUEVO</button>
    </div>`;
}
