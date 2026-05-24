/* =============================================
   SHILENO.EXE — script.js v3.0 FINAL
   ============================================= */

const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GHOST_SPRITES = [
  'player-corriendo.png',
  'player-derrotado.png',
  'player-enojado.png',
  'player-esquizo.png',
  'player-puerco.png',
  'player-muerto.png'
];

const STAGE_TABLES = {
  morning:   { events:'morning_events',   options:'morning_options',   label:'MAÑANA',   icon:'🌅' },
  midday:    { events:'midday_events',    options:'midday_options',    label:'MEDIODÍA', icon:'☀️' },
  afternoon: { events:'afternoon_events', options:'afternoon_options', label:'TARDE',    icon:'🌆' },
  night:     { events:'night_events',     options:'night_options',     label:'NOCHE',    icon:'🌌' }
};

let gs = {
  plata: 15000,
  cordura: 100,
  delirio: 0,
  vulnerable: 0,
  stages: ['morning','midday','afternoon','night'],
  stageIdx: 0,
  stageEvents: 0,
  currentSprite: 'player-normal.png',
  optionsLocked: false,
  lastPsyLevel: -1,
  autoShakeTimer: null
};

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', () => {
  updateUI();
  loadEvent();
});

/* ── NIVEL DE PSICOSIS ── */
function psychosisLevel() {
  const d = gs.delirio, c = gs.cordura;
  if (d >= 100 || c <= 0)  return 4;
  if (d >= 90  || c <= 15) return 3;
  if (d >= 70  || c <= 30) return 2;
  if (d >= 50  || c <= 45) return 1;
  if (d >= 30  || c <= 60) return 0;
  return -1;
}

/* ── UPDATE UI ── */
function updateUI() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
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

  const stageKey = gs.stages[gs.stageIdx];
  if (stageKey) {
    const s = STAGE_TABLES[stageKey];
    set('game-stage', s.icon + ' ' + s.label + ' (' + (gs.stageEvents + 1) + '/3)');
  }

  updateCursedMode();

  const lvl = psychosisLevel();
  if (lvl !== gs.lastPsyLevel) {
    gs.lastPsyLevel = lvl;
    updateGhosts();
  }
}

/* ── CURSED MODE ── */
function updateCursedMode() {
  const b = document.body;
  b.classList.remove('cursed-mode','cursed-severe','cursed-critical','cursed-collapse');
  const lvl = psychosisLevel();
  if (lvl >= 4) b.classList.add('cursed-mode','cursed-collapse');
  else if (lvl >= 3) b.classList.add('cursed-mode','cursed-critical');
  else if (lvl >= 2) b.classList.add('cursed-mode','cursed-severe');
  else if (lvl >= 1) b.classList.add('cursed-mode');
}

/* ── SPRITE ── */
function setSprite(fromDB) {
  const img = document.getElementById('player-sprite');
  if (!img) return;

  let target;
  if (gs.cordura <= 0)     target = 'player-muerto.png';
  else if (fromDB)         { target = fromDB; gs.currentSprite = fromDB; }
  else if (gs.delirio >= 70) target = gs.currentSprite = 'player-esquizo.png';
  else if (gs.cordura <= 30) target = gs.currentSprite = 'player-derrotado.png';
  else                       target = gs.currentSprite = 'player-normal.png';

  const lvl = psychosisLevel();
  img.className = '';
  if (lvl >= 4) img.classList.add('glitch-active','sprite-level4');
  else if (lvl >= 3) img.classList.add('glitch-active','sprite-level3');
  else if (lvl >= 2) img.classList.add('glitch-active','sprite-level2');
  else if (lvl >= 1) img.classList.add('sprite-level1');

  img.src = 'assets/' + target;
}

function reactionSprite(sprite) {
  const img = document.getElementById('player-sprite');
  if (!img || !sprite) return;
  img.classList.add('sprite-reaction');
  img.src = 'assets/' + sprite;
  img.addEventListener('animationend', () => {
    img.classList.remove('sprite-reaction');
    img.src = 'assets/' + gs.currentSprite;
  }, { once: true });
}

/* ── GHOSTS ── */
function updateGhosts() {
  clearGhosts();
  const lvl = psychosisLevel();
  if (lvl < 0) return;

  const container = document.getElementById('character-container');
  if (!container) return;

  const cfgs = [
    { count:1, opacity:0.08, duration:8000,  size:58  },
    { count:2, opacity:0.16, duration:5000,  size:72  },
    { count:3, opacity:0.27, duration:3200,  size:84  },
    { count:5, opacity:0.42, duration:1600,  size:96  },
    { count:6, opacity:0.65, duration:750,   size:108 }
  ];
  const cfg = cfgs[lvl];
  const sprites = [...GHOST_SPRITES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < cfg.count; i++) {
    const g = document.createElement('img');
    g.className = 'ghost-sprite' + (cfg.opacity >= 0.4 ? ' ghost-glitch' : '');
    g.src = 'assets/' + sprites[i % sprites.length];
    g.style.height = cfg.size + 'px';

    const angle  = (i / cfg.count) * 280 - 140;
    const rx = 38 + Math.random() * 22;
    const ry = 22 + Math.random() * 18;
    g.style.left = (50 + rx * Math.sin(angle * Math.PI / 180)) + '%';
    g.style.top  = (50 - ry * Math.cos(angle * Math.PI / 180)) + '%';

    const delay = i * (cfg.duration / cfg.count) * 0.55;
    g.style.setProperty('--ghost-opacity',   cfg.opacity);
    g.style.setProperty('--ghost-duration',  cfg.duration + 'ms');
    g.style.setProperty('--ghost-delay',     delay + 'ms');
    g.style.setProperty('--drift-x',  ((Math.random()-0.5)*18) + 'px');
    g.style.setProperty('--drift-y',  ((Math.random()-0.5)*14) + 'px');
    g.style.animation = 'ghost-pulse ' + cfg.duration + 'ms ' + delay + 'ms ease-in-out infinite';

    container.appendChild(g);
  }

  if (lvl >= 3) {
    const interval = lvl >= 4 ? 1000 : 2800;
    gs.autoShakeTimer = setInterval(() => { if (Math.random() < 0.55) screenShake(); }, interval);
  }
}

function clearGhosts() {
  if (gs.autoShakeTimer) { clearInterval(gs.autoShakeTimer); gs.autoShakeTimer = null; }
  document.querySelectorAll('.ghost-sprite').forEach(g => g.remove());
}

/* ── TYPEWRITER ── */
function typewriter(el, text) {
  return new Promise(resolve => {
    el.innerText = '';
    el.setAttribute('data-text', text);
    el.classList.add('typing');
    const lvl = psychosisLevel();
    const speed = Math.max(8, 24 - lvl * 4);
    let i = 0;
    const iv = setInterval(() => {
      let ch = text[i];
      if (lvl >= 3 && Math.random() < 0.04) {
        const glitchCh = ['█','▓','?','!','#'][Math.floor(Math.random()*5)];
        el.innerText += glitchCh;
        setTimeout(() => { el.innerText = el.innerText.slice(0,-1) + text[i]; }, 110);
      } else {
        el.innerText += ch;
      }
      el.setAttribute('data-text', el.innerText);
      i++;
      if (i >= text.length) {
        clearInterval(iv);
        el.classList.remove('typing');
        resolve();
      }
    }, speed);
  });
}

/* ── SCREEN SHAKE ── */
function screenShake() {
  const lvl = psychosisLevel();
  const cls = lvl >= 3 ? 'shake-hard' : 'shake';
  document.body.classList.add(cls);
  document.body.addEventListener('animationend', () => document.body.classList.remove(cls), { once:true });
}

/* ── STAGE TRANSITION ── */
function showStageTransition(stageKey) {
  return new Promise(resolve => {
    const ov = document.getElementById('stage-transition');
    if (!ov) { resolve(); return; }
    const lvl = psychosisLevel();
    const msgs = {
      morning:   { title:'MAÑANA COMPLETADA',   sub:'Aguantaste la mañana. Por ahora.',      icon:'🌅' },
      midday:    { title:'MEDIODÍA SOBREVIVIDO', sub:'El sol no te derritió. Aún.',           icon:'☀️' },
      afternoon: { title:'TARDE SUPERADA',       sub:'Falta solo la noche. La más difícil.',  icon:'🌆' }
    };
    const m = msgs[stageKey] || { title:'ETAPA OK', sub:'...', icon:'⏱️' };
    document.getElementById('stage-icon').innerText    = lvl >= 2 ? '💀' : m.icon;
    document.getElementById('stage-title').innerText   = lvl >= 2 ? '¿SIGUES AHÍ?' : m.title;
    document.getElementById('stage-subtitle').innerText= lvl >= 2 ? 'Las voces se hacen más fuertes...' : m.sub;
    ov.classList.add('active');
    if (lvl >= 2) ov.classList.add('cursed-overlay');
    setTimeout(() => { ov.classList.remove('active','cursed-overlay'); resolve(); }, 2000);
  });
}

/* ── CARGAR EVENTO ── */
async function loadEvent() {
  gs.optionsLocked = false;
  const key    = gs.stages[gs.stageIdx];
  const tables = STAGE_TABLES[key];
  try {
    const { data: list, error: le } = await db.from(tables.events).select('id');
    if (le) throw le;
    if (!list || !list.length) { showErr('Sin eventos disponibles.'); return; }

    const id = list[Math.floor(Math.random() * list.length)].id;
    const { data: ev,   error: ee } = await db.from(tables.events).select('*').eq('id', id).single();
    if (ee) throw ee;
    const { data: opts, error: oe } = await db.from(tables.options).select('*').eq('evento_id', id);
    if (oe) throw oe;

    await renderEvent(ev, opts);
  } catch(err) {
    console.error(err);
    showErr('🚨 Error de conexión. Recarga la página.');
  }
}

/* ── RENDER EVENTO ── */
async function renderEvent(ev, opts) {
  const titleEl   = document.getElementById('event-title');
  const textEl    = document.getElementById('event-text');
  const subtextEl = document.getElementById('event-subtext');
  const optsEl    = document.getElementById('options-container');

  const key = gs.stages[gs.stageIdx];
  const s   = STAGE_TABLES[key];

  if (titleEl) { titleEl.innerText = s.icon + ' EVENTO — ' + s.label; }
  if (optsEl)    optsEl.innerHTML = '';
  if (subtextEl) subtextEl.innerText = '';

  setSprite(ev.sprite || null);

  if (textEl) await typewriter(textEl, ev.texto || '');

  if (subtextEl && ev.letra_chica) {
    subtextEl.innerText = '(' + ev.letra_chica + ')';
  }

  if (optsEl) {
    const lvl = psychosisLevel();
    (opts || []).forEach((op, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn fade-in';
      btn.style.animationDelay = (i * 0.08) + 's';
      btn.innerText = op.texto_opcion;
      if (lvl >= 1) {
        btn.classList.add('glitch-text');
        btn.setAttribute('data-text', op.texto_opcion);
      }
      btn.onclick = () => handleChoice(op, btn);
      optsEl.appendChild(btn);
    });
  }
}

/* ── DECISIÓN ── */
function handleChoice(op, btn) {
  if (gs.optionsLocked) return;
  gs.optionsLocked = true;
  if (btn) btn.classList.add('chosen');

  gs.plata      += op.efecto_plata      || 0;
  gs.cordura    += op.efecto_cordura    || 0;
  gs.delirio    += op.efecto_delirio    || 0;
  gs.vulnerable += op.efecto_vulnerable || 0;

  gs.cordura    = Math.min(100, Math.max(0,   gs.cordura));
  gs.delirio    = Math.min(100, Math.max(0,   gs.delirio));

  let rx = null;
  if ((op.efecto_cordura    || 0) <= -15)  rx = 'player-esquizo.png';
  else if ((op.efecto_plata || 0) <= -5000) rx = 'player-derrotado.png';
  else if ((op.efecto_delirio||0) >= 15)   rx = 'player-puerco.png';
  else if ((op.efecto_cordura||0) >= 10)   rx = 'player-victoria.png';
  if (rx) reactionSprite(rx);

  if ((op.efecto_cordura||0) <= -15 || (op.efecto_plata||0) <= -5000) screenShake();

  updateUI();

  if (gs.cordura <= 0 || gs.delirio >= 100) {
    clearGhosts();
    setTimeout(() => triggerCollapse(), 700);
    return;
  }

  gs.stageEvents++;
  setTimeout(async () => {
    if (gs.stageEvents >= 3) {
      gs.stageEvents = 0;
      const done = gs.stages[gs.stageIdx];
      gs.stageIdx++;
      if (gs.stageIdx >= gs.stages.length) { clearGhosts(); triggerVictory(); return; }
      await showStageTransition(done);
    }
    updateUI();
    loadEvent();
  }, 850);
}

/* ── COLAPSO ── */
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
    if (mi >= msgs.length) { clearInterval(iv); setTimeout(showGameOver, 500); }
  }, 370);
}

function showGameOver() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;
  const stageLabel = STAGE_TABLES[gs.stages[Math.min(gs.stageIdx, 3)]].label;
  layout.innerHTML = `
    <div class="end-screen gameover">
      <div class="end-icon">💀</div>
      <h1>GAME OVER</h1>
      <p>Tu mente colapsó por completo ante la realidad país. Las voces ganaron.</p>
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

/* ── VICTORIA ── */
function triggerVictory() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;
  document.body.classList.remove('cursed-mode','cursed-collapse','cursed-critical','cursed-severe');
  layout.innerHTML = `
    <div class="end-screen victoria">
      <div class="end-icon">🏆</div>
      <h1>¡SOBREVIVISTE!</h1>
      <p>Lograste llegar al amanecer del día siguiente manteniendo la cabeza (más o menos) sobre los hombros.</p>
      <div class="stats-final">
        <p>Saldo final en Cuenta RUT: <span>$${gs.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura restante: <span>${gs.cordura}/100</span></p>
        <p>Delirio acumulado: <span>${gs.delirio}</span></p>
        <p>Vulnerabilidad: <span>${gs.vulnerable}</span></p>
      </div>
      <p style="font-size:0.78em;color:#888;margin-bottom:14px;">📸 Toma screenshot y compártelo</p>
      <button class="btn-restart" onclick="location.reload()">🎮 JUGAR DE NUEVO</button>
    </div>`;
}

/* ── ERROR ── */
function showErr(msg) {
  const el = document.getElementById('event-text');
  if (el) el.innerText = msg;
}

/* ── SPLASH SCREEN ── */
let selectedMode = 'normal';

function selectMode(btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active-mode'));
  btn.classList.add('active-mode');
  selectedMode = btn.dataset.mode;
}

function startGame() {
  const splash = document.getElementById('splash-screen');
  const layout = document.getElementById('main-layout');
  const footer = document.getElementById('footer-ads');

  // Animación de salida
  splash.classList.add('hide');

  setTimeout(() => {
    splash.style.display = 'none';
    layout.style.display = 'flex';
    if (footer) footer.style.display = 'block';
    updateUI();
    loadEvent();
  }, 650);
}
