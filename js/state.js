/* =============================================
   state.js — Estado global del juego
   ============================================= */

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let selectedMode = 'normal';

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
  condiciones:    []  // condiciones activas durante la partida
};

function initState() {
  const cfg = MODES[selectedMode];
  gs = {
    plata:          cfg.startPlata,
    cordura:        cfg.startCordura,
    delirio:        cfg.startDelirio,
    vulnerable:     0,
    stageIdx:       0,
    stageEvents:    0,
    currentSprite:  selectedMode === 'ufo' ? 'player-esquizo.png' : 'player-normal.png',
    optionsLocked:  false,
    lastPsyLevel:   -1,
    autoShakeTimer: null,
    mode:           selectedMode,
    condiciones:    []
  };
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
    console.log('Condición activada:', cond);
  }
}
function tieneCondicion(cond) {
  return cond ? gs.condiciones.includes(cond) : true;
}
