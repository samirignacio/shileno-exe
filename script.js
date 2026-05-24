/* =============================================
   SHILENO.EXE — script.js v2.0
   ============================================= */

const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── ESTADO DEL JUEGO ──────────────────────────
let gameState = {
  plata: 15000,
  cordura: 100,
  delirio: 0,
  vulnerable: 0,
  stages: ['morning', 'midday', 'afternoon', 'night'],
  currentStageIndex: 0,
  eventsInCurrentStage: 0,
  currentSprite: 'player-normal.png', // sprite activo persistente
  isTyping: false,
  optionsLocked: false
};

const stageTables = {
  morning:   { events: 'morning_events',   options: 'morning_options',   label: 'MAÑANA',   icon: '🌅' },
  midday:    { events: 'midday_events',    options: 'midday_options',    label: 'MEDIODÍA', icon: '☀️' },
  afternoon: { events: 'afternoon_events', options: 'afternoon_options', label: 'TARDE',    icon: '🌆' },
  night:     { events: 'night_events',     options: 'night_options',     label: 'NOCHE',    icon: '🌌' }
};

// ── INIT ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  updateUIStats();
  loadRandomEvent();
});

// ── ACTUALIZAR UI DE STATS ────────────────────
function updateUIStats() {
  const { plata, cordura, delirio, vulnerable, stages, currentStageIndex, eventsInCurrentStage } = gameState;

  // Valores numéricos
  const elPlata     = document.getElementById('stat-plata');
  const elCordura   = document.getElementById('stat-cordura');
  const elDelirio   = document.getElementById('stat-delirio');
  const elVulnerable= document.getElementById('stat-vulnerable');

  if (elPlata)      elPlata.innerText = `$${plata.toLocaleString('es-CL')}`;
  if (elVulnerable) elVulnerable.innerText = vulnerable;

  if (elCordura) {
    elCordura.innerText = cordura;
    elCordura.className = 'stat-value' + (cordura <= 20 ? ' danger' : cordura <= 40 ? ' warning' : '');
  }
  if (elDelirio) {
    elDelirio.innerText = delirio;
    elDelirio.className = 'stat-value' + (delirio >= 70 ? ' danger' : delirio >= 40 ? ' warning' : '');
  }

  // Barras animadas
  const barCordura = document.getElementById('bar-cordura');
  const barDelirio = document.getElementById('bar-delirio');
  if (barCordura) {
    barCordura.style.width = `${Math.max(0, cordura)}%`;
    barCordura.className = 'stat-bar cordura' + (cordura <= 40 ? ' low' : '');
  }
  if (barDelirio) {
    barDelirio.style.width = `${Math.min(100, delirio)}%`;
    barDelirio.className = 'stat-bar delirio' + (delirio >= 50 ? ' high' : '');
  }

  // Etapa
  const stageKey = stages[currentStageIndex];
  if (stageKey) {
    const el = document.getElementById('game-stage');
    if (el) {
      const s = stageTables[stageKey];
      el.innerText = `${s.icon} ${s.label} (${eventsInCurrentStage + 1}/3)`;
    }
  }

  // Modo cursed
  updateCursedMode();
}

// ── MODO CURSED ───────────────────────────────
function updateCursedMode() {
  const { cordura, delirio } = gameState;
  const body = document.body;
  const isCursed = delirio >= 50 || cordura <= 40;

  if (isCursed && !body.classList.contains('cursed-mode')) {
    body.classList.add('cursed-mode');
  } else if (!isCursed && body.classList.contains('cursed-mode')) {
    body.classList.remove('cursed-mode');
  }
}

// ── SPRITE ────────────────────────────────────
// El sprite de la DB es la fuente de verdad.
// Solo se sobreescribe si hay condición crítica de estado.
function setPlayerSprite(spriteFromDB = null, isReaction = false) {
  const spriteImg = document.getElementById('player-sprite');
  if (!spriteImg) return;

  // Determinar qué sprite mostrar
  let targetSprite;

  if (gameState.cordura <= 0) {
    targetSprite = 'player-muerto.png';
  } else if (isReaction) {
    // Sprite de reacción temporal (post-decisión), se pasa directo
    targetSprite = spriteFromDB;
  } else if (spriteFromDB) {
    // Sprite asignado al evento desde Supabase — MANDA SIEMPRE
    targetSprite = spriteFromDB;
    gameState.currentSprite = spriteFromDB; // guardar como base del evento
  } else {
    // Fallback por estado si el evento no tiene sprite
    if (gameState.delirio >= 70)         targetSprite = 'player-esquizo.png';
    else if (gameState.cordura <= 30)    targetSprite = 'player-derrotado.png';
    else                                  targetSprite = 'player-normal.png';
    gameState.currentSprite = targetSprite;
  }

  // Glitch visual si estado crítico
  const needsGlitch = gameState.delirio >= 30 || gameState.cordura < 40;
  if (needsGlitch) {
    spriteImg.classList.add('glitch-active');
  } else {
    spriteImg.classList.remove('glitch-active');
  }

  spriteImg.src = `assets/${targetSprite}`;
}

// Animación de reacción al elegir opción
function playReactionSprite(reactionSprite) {
  const spriteImg = document.getElementById('player-sprite');
  if (!spriteImg || !reactionSprite) return;

  spriteImg.classList.add('sprite-reaction');
  spriteImg.src = `assets/${reactionSprite}`;

  spriteImg.addEventListener('animationend', () => {
    spriteImg.classList.remove('sprite-reaction');
    // Volver al sprite base del evento actual
    spriteImg.src = `assets/${gameState.currentSprite}`;
  }, { once: true });
}

// ── TYPEWRITER ────────────────────────────────
function typewriterEffect(element, text, speed = 28) {
  return new Promise(resolve => {
    gameState.isTyping = true;
    element.innerText = '';
    element.setAttribute('data-text', text);
    element.classList.add('typing');

    let i = 0;
    const interval = setInterval(() => {
      element.innerText += text[i];
      element.setAttribute('data-text', element.innerText);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        element.classList.remove('typing');
        gameState.isTyping = false;
        resolve();
      }
    }, speed);
  });
}

// ── SCREEN SHAKE ──────────────────────────────
function screenShake() {
  document.body.classList.add('shake');
  document.body.addEventListener('animationend', () => {
    document.body.classList.remove('shake');
  }, { once: true });
}

// ── TRANSICIÓN DE ETAPA ───────────────────────
function showStageTransition(completedStageKey) {
  return new Promise(resolve => {
    const overlay   = document.getElementById('stage-transition');
    const iconEl    = document.getElementById('stage-icon');
    const titleEl   = document.getElementById('stage-title');
    const subtitleEl= document.getElementById('stage-subtitle');

    if (!overlay) { resolve(); return; }

    const messages = {
      morning:   { title: 'MAÑANA COMPLETADA',   sub: 'Aguantaste la mañana. Por ahora.',           icon: '🌅' },
      midday:    { title: 'MEDIODÍA SOBREVIVIDO', sub: 'El sol no te derritió. Aún.',                icon: '☀️' },
      afternoon: { title: 'TARDE SUPERADA',       sub: 'Falta solo la noche. La más difícil.',       icon: '🌆' },
    };

    const msg = messages[completedStageKey] || { title: 'ETAPA COMPLETADA', sub: '...', icon: '⏱️' };

    iconEl.innerText    = msg.icon;
    titleEl.innerText   = msg.title;
    subtitleEl.innerText= msg.sub;

    overlay.classList.add('active');

    setTimeout(() => {
      overlay.classList.remove('active');
      resolve();
    }, 2200);
  });
}

// ── CARGAR EVENTO ALEATORIO ───────────────────
async function loadRandomEvent() {
  gameState.optionsLocked = false;
  const stageKey = gameState.stages[gameState.currentStageIndex];
  const tables   = stageTables[stageKey];

  try {
    // Obtener todos los IDs disponibles
    const { data: eventsList, error: listError } = await db
      .from(tables.events)
      .select('id');

    if (listError) throw listError;
    if (!eventsList || eventsList.length === 0) {
      showError('No hay eventos disponibles para esta etapa.');
      return;
    }

    const randomId = eventsList[Math.floor(Math.random() * eventsList.length)].id;

    // Obtener evento completo
    const { data: eventData, error: eventError } = await db
      .from(tables.events)
      .select('*')
      .eq('id', randomId)
      .single();

    if (eventError) throw eventError;

    // Obtener opciones
    const { data: optionsData, error: optionsError } = await db
      .from(tables.options)
      .select('*')
      .eq('evento_id', randomId);

    if (optionsError) throw optionsError;

    await renderEvent(eventData, optionsData);

  } catch (err) {
    console.error('Error Supabase:', err.message);
    showError('🚨 Error al conectar con la base de datos.');
  }
}

// ── RENDERIZAR EVENTO ─────────────────────────
async function renderEvent(event, options) {
  const titleEl   = document.getElementById('event-title');
  const textEl    = document.getElementById('event-text');
  const subtextEl = document.getElementById('event-subtext');
  const optsEl    = document.getElementById('options-container');

  // Título de etapa
  if (titleEl) {
    const stageKey = gameState.stages[gameState.currentStageIndex];
    const s = stageTables[stageKey];
    titleEl.innerText = `${s.icon} EVENTO DE LA ${s.label}`;
    titleEl.classList.add('fade-in');
  }

  // Sprite del evento (viene de Supabase, es la fuente de verdad)
  setPlayerSprite(event.sprite || null);

  // Limpiar opciones mientras typea
  if (optsEl) optsEl.innerHTML = '';
  if (subtextEl) subtextEl.innerText = '';

  // Efecto typewriter en el texto
  if (textEl) {
    await typewriterEffect(textEl, event.texto || '', 22);
  }

  // Letra chica
  if (subtextEl && event.letra_chica) {
    subtextEl.innerText = `(${event.letra_chica})`;
    subtextEl.classList.add('fade-in');
  }

  // Opciones con glitch en texto si delirio alto
  if (optsEl) {
    optsEl.innerHTML = '';
    options.forEach((op, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn fade-in';
      btn.style.animationDelay = `${idx * 0.08}s`;
      btn.innerText = op.texto_opcion;

      // Glitch en el texto de las opciones si delirio >= 50
      if (gameState.delirio >= 50) {
        btn.classList.add('glitch-text');
        btn.setAttribute('data-text', op.texto_opcion);
      }

      btn.onclick = () => handleDecision(op, btn);
      optsEl.appendChild(btn);
    });
  }
}

// ── MANEJAR DECISIÓN ─────────────────────────
function handleDecision(option, clickedBtn) {
  if (gameState.optionsLocked) return;
  gameState.optionsLocked = true;

  // Feedback visual en botón elegido
  if (clickedBtn) clickedBtn.classList.add('chosen');

  // Aplicar efectos
  gameState.plata      += option.efecto_plata     || 0;
  gameState.cordura    += option.efecto_cordura   || 0;
  gameState.delirio    += option.efecto_delirio   || 0;
  gameState.vulnerable += option.efecto_vulnerable|| 0;

  // Clamp
  if (gameState.cordura > 100) gameState.cordura = 100;
  if (gameState.delirio < 0)   gameState.delirio = 0;
  if (gameState.delirio > 100) gameState.delirio = 100;

  // Sprite de reacción temporal según magnitud del efecto
  let reactionSprite = null;
  if (option.efecto_cordura <= -15)   reactionSprite = 'player-esquizo.png';
  else if (option.efecto_plata <= -5000) reactionSprite = 'player-derrotado.png';
  else if (option.efecto_delirio >= 15)  reactionSprite = 'player-puerco.png';
  else if (option.efecto_cordura >= 10)  reactionSprite = 'player-victoria.png';

  if (reactionSprite) playReactionSprite(reactionSprite);

  // Shake si pérdida grande
  if ((option.efecto_cordura || 0) <= -15 || (option.efecto_plata || 0) <= -5000) {
    screenShake();
  }

  updateUIStats();

  // Game Over inmediato si cordura = 0
  if (gameState.cordura <= 0) {
    setPlayerSprite(null); // fuerza player-muerto
    setTimeout(() => {
      triggerGameOver('Tu mente colapsó por completo ante la realidad país. Te quedaste mirando fijo la pared de tu pieza, perdiendo el lazo con el mundo exterior.');
    }, 800);
    return;
  }

  // Avanzar
  gameState.eventsInCurrentStage++;

  setTimeout(async () => {
    if (gameState.eventsInCurrentStage >= 3) {
      // Etapa completada
      gameState.eventsInCurrentStage = 0;
      const completedStage = gameState.stages[gameState.currentStageIndex];
      gameState.currentStageIndex++;

      if (gameState.currentStageIndex >= gameState.stages.length) {
        triggerVictory();
        return;
      }

      await showStageTransition(completedStage);
    }

    updateUIStats();
    loadRandomEvent();
  }, 900);
}

// ── GAME OVER ─────────────────────────────────
function triggerGameOver(mensaje) {
  const layout = document.getElementById('main-layout');
  if (!layout) return;

  document.body.classList.add('cursed-mode');
  screenShake();

  layout.innerHTML = `
    <div class="end-screen gameover">
      <div class="end-icon">💀</div>
      <h1>GAME OVER</h1>
      <p>${mensaje}</p>
      <div class="stats-final">
        <p>Plata final: <span>$${gameState.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura: <span>${gameState.cordura}/100</span></p>
        <p>Delirio acumulado: <span>${gameState.delirio}</span></p>
        <p>Etapa donde caíste: <span>${stageTables[gameState.stages[Math.min(gameState.currentStageIndex, 3)]].label}</span></p>
      </div>
      <button class="btn-restart" onclick="location.reload()">🔄 REINTENTAR DÍA</button>
    </div>
  `;
}

// ── VICTORIA ──────────────────────────────────
function triggerVictory() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;

  document.body.classList.remove('cursed-mode');

  layout.innerHTML = `
    <div class="end-screen victoria">
      <div class="end-icon">🏆</div>
      <h1>¡SOBREVIVISTE!</h1>
      <p>Lograste llegar al amanecer del día siguiente manteniendo la cabeza (más o menos) sobre los hombros.</p>
      <div class="stats-final">
        <p>Saldo final en Cuenta RUT: <span>$${gameState.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura restante: <span>${gameState.cordura}/100</span></p>
        <p>Delirio acumulado: <span>${gameState.delirio}</span></p>
        <p>Vulnerabilidad: <span>${gameState.vulnerable}</span></p>
      </div>
      <p style="font-size:0.8em; color:#888; margin-bottom:16px;">📸 Toma screenshot de tus stats y compártelo</p>
      <button class="btn-restart" onclick="location.reload()">🎮 JUGAR DE NUEVO</button>
    </div>
  `;
}

// ── ERROR ─────────────────────────────────────
function showError(msg) {
  const textEl = document.getElementById('event-text');
  if (textEl) textEl.innerText = msg;
}
