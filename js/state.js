/* =============================================
   state.js — Estado global del juego
   ============================================= */

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let selectedMode = 'normal';

// ── SISTEMA DE DÍAS ───────────────────────────
// Persiste entre sesiones via localStorage
function getDiaActual() {
  return parseInt(localStorage.getItem('shileno_dia') || '1');
}
function avanzarDia() {
  const dia = getDiaActual() + 1;
  localStorage.setItem('shileno_dia', dia);
  return dia;
}
function resetDias() {
  localStorage.setItem('shileno_dia', '1');
}

// Multiplicador de dificultad: +3% por día acumulado
function getDificultad() {
  const dia = getDiaActual();
  return 1 + ((dia - 1) * 0.03);
}

let gs = {
  plata:          15000,
  cordura:        100,
  delirio:        0,
  vulnerable:     0,
  stageIdx:       0,
  stageEvents:    0,
  currentSprite:  'player-normal.png',
  optionsLocked:  false,
  lastPsyLevel:   -1,
  autoShakeTimer: null,
  mode:           'normal',
  condiciones:    [],
  dia:            getDiaActual()
};

function initState() {
  const cfg = MODES[selectedMode];
  const dia  = getDiaActual();

  gs = {
    plata:          cfg.startPlata,
    cordura:        100,   // siempre arranca en 100
    delirio:        0,     // siempre arranca en 0
    vulnerable:     0,
    stageIdx:       0,
    stageEvents:    0,
    currentSprite:  selectedMode === 'ufo' ? 'player-esquizo.png' : 'player-normal.png',
    optionsLocked:  false,
    lastPsyLevel:   -1,
    autoShakeTimer: null,
    mode:           selectedMode,
    condiciones:    [],
    dia:            dia
  };
}

// Aplicar dificultad del día a un efecto negativo
function aplicarDificultad(efecto) {
  if (!efecto || efecto >= 0) return efecto; // solo penaliza efectos negativos
  return Math.round(efecto * getDificultad());
}

// Helpers de navegación
function currentTables()    { return MODES[gs.mode].tables; }
function currentStages()    { return MODES[gs.mode].stages; }
function currentStageKey()  { return currentStages()[gs.stageIdx]; }
function currentStageInfo() { return currentTables()[currentStageKey()]; }

// Helpers de condiciones
function activarCondicion(cond) {
  if (cond && !gs.condiciones.includes(cond)) {
    gs.condiciones.push(cond);
  }
}
function tieneCondicion(cond) {
  return cond ? gs.condiciones.includes(cond) : true;
}
