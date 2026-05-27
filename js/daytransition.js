/* =============================================
   dayTransition.js — Transición entre días
   ============================================= */

const NIGHT_FRAMES = [
  { hora: '15:00', texto: 'Todo piola',               img: 'assets/daynight_01.png' },
  { hora: '16:20', texto: 'El sol se va pa la chucha', img: 'assets/daynight_02.png' },
  { hora: '17:50', texto: 'Ya se escondió el qlo',    img: 'assets/daynight_03.png' },
  { hora: '19:13', texto: 'Empieza lo turbio',         img: 'assets/daynight_04.png' },
  { hora: '21:47', texto: 'Noche ql culia',            img: 'assets/daynight_05.png' },
  { hora: '00:32', texto: 'La ciudad dormida (o no)',  img: 'assets/daynight_06.png' }
];

const MORNING_FRAMES = [
  { hora: '04:11', texto: 'Aún de noche y todo como el orto', img: 'assets/nightday_01.png' },
  { hora: '05:27', texto: 'Algo cambia pero sigue todo fome', img: 'assets/nightday_02.png' },
  { hora: '06:03', texto: 'Aparece un poco de color culiao',  img: 'assets/nightday_03.png' },
  { hora: '07:18', texto: 'Ya se nota la weá',                img: 'assets/nightday_04.png' },
  { hora: '08:45', texto: 'El sol ql volvió',                 img: 'assets/nightday_05.png' },
  { hora: '10:22', texto: 'Día otra vez (por ahora)',         img: 'assets/nightday_06.png' }
];

// Stats que persisten entre días
function calcularDesgaste(gsActual) {
  return {
    cordura:    Math.min(100, Math.max(20, gsActual.cordura + 20)),  // recupera 20, mínimo 20
    delirio:    Math.max(0, gsActual.delirio - 15),                  // baja 15, no llega a 0
    plata:      gsActual.plata,                                       // la plata no cambia
    vulnerable: Math.max(0, gsActual.vulnerable - 1),                // baja muy lento
    condiciones: gsActual.condiciones.filter(() => Math.random() > 0.5) // 50% persisten
  };
}

function showDayTransition(gsActual, diaNuevo, callback) {
  // Crear overlay de transición
  const overlay = document.createElement('div');
  overlay.id = 'day-transition-overlay';
  overlay.innerHTML = buildTransitionHTML(gsActual, diaNuevo);
  document.body.appendChild(overlay);

  // Arrancar animación de frames
  let frameIdx = 0;
  const allFrames = [...NIGHT_FRAMES, ...MORNING_FRAMES];

  setTimeout(() => {
    overlay.classList.add('visible');
    runFrames(overlay, allFrames, frameIdx, gsActual, diaNuevo, callback);
  }, 100);
}

function buildTransitionHTML(gsActual, diaNuevo) {
  const desgaste = calcularDesgaste(gsActual);
  return `
    <div id="dt-sky"></div>
    <div id="dt-city"></div>
    <div id="dt-content">
      <div id="dt-hora">15:00</div>
      <div id="dt-texto">Todo piola</div>
    </div>
    <div id="dt-stats-wrap" style="display:none">
      <div id="dt-stats-day">
        <p class="dt-stats-title">— FIN DEL DÍA ${diaNuevo - 1} —</p>
        <div class="dt-stat-row"><span>💰 Plata</span><span>$${gsActual.plata.toLocaleString('es-CL')}</span></div>
        <div class="dt-stat-row"><span>🧠 Cordura</span><span>${Math.max(0,gsActual.cordura)}/100</span></div>
        <div class="dt-stat-row"><span>🌀 Delirio</span><span>${gsActual.delirio}</span></div>
        ${gsActual.condiciones.length ? `<div class="dt-stat-row warning"><span>⚡ Consecuencias</span><span>${gsActual.condiciones.length}</span></div>` : ''}
      </div>
      <div id="dt-sleep-msg">💤 Te dormiste como pudiste...</div>
      <div id="dt-stats-new" style="display:none">
        <p class="dt-stats-title">— DÍA ${diaNuevo} —</p>
        <div class="dt-stat-row recover"><span>🧠 Cordura</span><span>${desgaste.cordura}/100 <small>(+20)</small></span></div>
        <div class="dt-stat-row ${desgaste.delirio > 0 ? 'warning' : ''}"><span>🌀 Delirio residual</span><span>${desgaste.delirio} <small>(-15)</small></span></div>
        <div class="dt-stat-row"><span>💰 Plata</span><span>$${desgaste.plata.toLocaleString('es-CL')}</span></div>
        ${desgaste.condiciones.length ? `<div class="dt-stat-row warning"><span>⚡ Problemas pendientes</span><span>${desgaste.condiciones.length}</span></div>` : ''}
        <div class="dt-stat-row danger"><span>📈 Dificultad</span><span>+${Math.round((diaNuevo-1)*1.5)}%</span></div>
      </div>
      <button id="dt-btn-siguiente" style="display:none" onclick="continuarDia()">
        ☀️ LEVANTARSE — DÍA ${diaNuevo}
      </button>
    </div>
  `;
}

function runFrames(overlay, frames, idx, gsActual, diaNuevo, callback) {
  if (idx >= frames.length) {
    // Mostrar stats al terminar los frames
    showDayStats(overlay, gsActual, diaNuevo, callback);
    return;
  }

  const frame  = frames[idx];
  const skyEl  = document.getElementById('dt-sky');
  const horaEl = document.getElementById('dt-hora');
  const txtEl  = document.getElementById('dt-texto');

  if (skyEl) {
    // Forzar reflow para reiniciar animación crossfade
    skyEl.style.animation = 'none';
    skyEl.offsetHeight; // trigger reflow
    skyEl.style.animation = '';
    skyEl.style.backgroundImage = `url('${frame.img}')`;
    skyEl.style.backgroundSize = 'cover';
    skyEl.style.backgroundPosition = 'center center';
  }
  if (horaEl) {
    horaEl.style.animation = 'none';
    horaEl.offsetHeight;
    horaEl.style.animation = '';
    horaEl.innerText = frame.hora;
  }
  if (txtEl) {
    txtEl.style.animation = 'none';
    txtEl.offsetHeight;
    txtEl.style.animation = '';
    txtEl.innerText = frame.texto;
  }

  setTimeout(() => {
    runFrames(overlay, frames, idx + 1, gsActual, diaNuevo, callback);
  }, 250);
}

function showDayStats(overlay, gsActual, diaNuevo, callback) {
  const wrap = document.getElementById('dt-stats-wrap');
  if (wrap) wrap.style.display = 'block';

  setTimeout(() => {
    const newStats = document.getElementById('dt-stats-new');
    const sleepMsg = document.getElementById('dt-sleep-msg');
    const btn      = document.getElementById('dt-btn-siguiente');
    if (sleepMsg) sleepMsg.style.display = 'none';
    if (newStats) newStats.style.display = 'block';
    if (btn)      btn.style.display      = 'block';
  }, 1800);

  // Guardar callback para el botón
  window._dtCallback = callback;
  window._dtDesgaste = calcularDesgaste(gsActual);
  window._dtDiaNuevo = diaNuevo;
}

function continuarDia() {
  const overlay = document.getElementById('day-transition-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 500);
  }

  // Aplicar desgaste al estado
  if (window._dtDesgaste && window._dtCallback) {
    window._dtCallback(window._dtDesgaste, window._dtDiaNuevo);
  }
}
