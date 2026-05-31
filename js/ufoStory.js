/* =============================================
   ufoStory.js — Sistema de historia ramificada
   UFO-SHILENO.EXE "El 4B"
   ============================================= */

// ── DÍAS DE LA SEMANA UFO ─────────────────────
const UFO_DIAS = {
  lunes:     { tabla_events: 'ufo_morning_events',   tabla_options: 'ufo_morning_options',   label: 'LUNES',     icon: '🌆', eventos_dia: 7  },
  martes:    { tabla_events: 'ufo_midday_events',    tabla_options: 'ufo_midday_options',    label: 'MARTES',    icon: '🌃', eventos_dia: 7  },
  miercoles: { tabla_events: 'ufo_afternoon_events', tabla_options: 'ufo_afternoon_options', label: 'MIÉRCOLES', icon: '🌌', eventos_dia: 8  },
  jueves:    { tabla_events: 'ufo_night_events',     tabla_options: 'ufo_night_options',     label: 'JUEVES',    icon: '👁️', eventos_dia: 8  },
  viernes:   { tabla_events: 'ufo_night_events',     tabla_options: 'ufo_night_options',     label: 'VIERNES',   icon: '🛸', eventos_dia: 4  },
  sabado:    { tabla_events: 'ufo_sabado_events',    tabla_options: 'ufo_sabado_options',    label: 'SÁBADO',    icon: '🌙', eventos_dia: 3  },
  domingo:   { tabla_events: 'ufo_domingo_events',   tabla_options: 'ufo_domingo_options',   label: 'DOMINGO',   icon: '☀️', eventos_dia: 3  },
};

const UFO_SEMANA = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];

// ── ESTADO UFO ────────────────────────────────
let ufoState = {
  diaIdx:        0,     // índice en UFO_SEMANA
  eventosHoy:    0,     // eventos completados hoy
  rutas: {
    esceptico:       0,
    curioso:         0,
    creyente:        0,
    ufo_contacto:    0,
    ufo_testigo:     0,
    mistico_iniciado:0,
    mistico_escapado:0
  },
  condiciones:   [],
  rutaFinal:     null,  // se define el jueves
  eventosVistos: []     // IDs ya vistos para no repetir
};

// ── GUARDAR/CARGAR PROGRESO UFO ───────────────
function ufoGuardar() {
  localStorage.setItem('ufo_state', JSON.stringify(ufoState));
}

function ufoCargaEstado() {
  const saved = localStorage.getItem('ufo_state');
  if (saved) {
    try {
      ufoState = JSON.parse(saved);
    } catch(e) {
      ufoResetear();
    }
  }
}

function ufoResetear() {
  ufoState = {
    diaIdx: 0, eventosHoy: 0,
    rutas: { esceptico:0, curioso:0, creyente:0, ufo_contacto:0, ufo_testigo:0, mistico_iniciado:0, mistico_escapado:0 },
    condiciones: [], rutaFinal: null, eventosVistos: []
  };
  localStorage.removeItem('ufo_state');
}

// ── HELPERS ───────────────────────────────────
function ufoDiaActual()   { return UFO_SEMANA[ufoState.diaIdx]; }
function ufoDiaInfo()     { return UFO_DIAS[ufoDiaActual()]; }
function ufoTieneCondicion(cond) { return ufoState.condiciones.includes(cond); }

function ufoActivarRuta(ruta) {
  if (!ruta || !(ruta in ufoState.rutas)) return;
  ufoState.rutas[ruta]++;
  ufoGuardar();
}

function ufoActivarCondicion(cond) {
  if (cond && !ufoState.condiciones.includes(cond)) {
    ufoState.condiciones.push(cond);
    ufoGuardar();
  }
}

// ── DETERMINAR RUTA FINAL ─────────────────────
// Se llama al terminar el miércoles
function ufoDeterminarRuta() {
  const r = ufoState.rutas;

  // Rutas específicas tienen prioridad
  if (r.ufo_contacto >= 2)     { ufoState.rutaFinal = 'ufo_contacto'; return; }
  if (r.ufo_testigo >= 2)      { ufoState.rutaFinal = 'ufo_testigo';  return; }
  if (r.mistico_iniciado >= 2) { ufoState.rutaFinal = 'mistico_iniciado'; return; }
  if (r.mistico_escapado >= 1) { ufoState.rutaFinal = 'mistico_escapado'; return; }

  // Por puntos acumulados
  const max = Math.max(r.esceptico, r.curioso, r.creyente);
  if (r.creyente === max)      { ufoState.rutaFinal = 'creyente'; return; }
  if (r.curioso === max)       { ufoState.rutaFinal = 'curioso';  return; }
  ufoState.rutaFinal = 'esceptico';
  ufoGuardar();
}

// ── CARGAR EVENTO UFO ─────────────────────────
async function ufoLoadEvento() {
  gs.optionsLocked = false;
  const diaInfo = ufoDiaInfo();
  const diaActual = ufoDiaActual();

  try {
    // Traer TODOS los eventos del día ordenados linealmente
    const { data: list, error: le } = await db
      .from(diaInfo.tabla_events)
      .select('id, orden, ruta, requiere_condicion')
      .order('orden', { ascending: true });

    if (le) throw le;
    if (!list || !list.length) { showErr('Sin eventos para hoy.'); return; }

    // Filtrar por ruta y condición — pero mantener orden lineal
    const disponibles = list.filter(ev => {
      // Ya vistos: saltar
      if (ufoState.eventosVistos.includes(ev.id)) return false;
      // Evento de ruta específica: solo si esa ruta está activa
      if (ev.ruta) {
        const rutaActiva = ufoState.rutaFinal || null;
        const puntosRuta = ufoState.rutas[ev.ruta] || 0;
        if (rutaActiva && ev.ruta !== rutaActiva && puntosRuta === 0) return false;
        if (!rutaActiva && puntosRuta === 0) return false;
      }
      // Condición requerida: solo si está activa
      if (ev.requiere_condicion && !ufoTieneCondicion(ev.requiere_condicion)) return false;
      return true;
    });

    if (!disponibles.length) {
      await ufoAvanzarDia();
      return;
    }

    // LINEAL: tomar siempre el de menor orden (el siguiente en la historia)
    const elegido = disponibles[0];

    // Marcar como visto
    ufoState.eventosVistos.push(elegido.id);
    ufoGuardar();

    const { data: ev, error: ee } = await db
      .from(diaInfo.tabla_events).select('*').eq('id', elegido.id).single();
    if (ee) throw ee;

    const { data: opts, error: oe } = await db
      .from(diaInfo.tabla_options).select('*').eq('evento_id', elegido.id);
    if (oe) throw oe;

    await ufoRenderEvento(ev, opts);

  } catch(err) {
    console.error('Error UFO:', err.message);
    showErr('🚨 Error de conexión. Recarga la página.');
  }
}

// ── RENDER EVENTO UFO ─────────────────────────
async function ufoRenderEvento(ev, opts) {
  const titleEl   = document.getElementById('event-title');
  const textEl    = document.getElementById('event-text');
  const subtextEl = document.getElementById('event-subtext');
  const optsEl    = document.getElementById('options-container');
  const stageEl   = document.getElementById('game-stage');

  const info = ufoDiaInfo();

  if (stageEl) {
    stageEl.innerText = `${info.icon} ${info.label} (${ufoState.eventosHoy + 1}/${info.eventos_dia})`;
  }
  if (titleEl) {
    titleEl.innerText = `${info.icon} EVENTO — ${info.label}`;
    if (ev.ruta) titleEl.innerText += ' ⚡';
  }

  if (optsEl)    optsEl.innerHTML   = '';
  if (subtextEl) subtextEl.innerText = '';

  setSprite(ev.sprite || null);

  if (textEl) await typewriter(textEl, ev.texto || '');

  if (subtextEl && ev.letra_chica) {
    subtextEl.innerText = `(${ev.letra_chica})`;
  }

  if (optsEl) {
    (opts || []).forEach((op, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn fade-in';
      btn.style.animationDelay = (i * 0.08) + 's';
      btn.innerText = op.texto_opcion;
      btn.classList.add('glitch-text');
      btn.setAttribute('data-text', op.texto_opcion);
      btn.onclick = () => ufoHandleChoice(op, btn);
      optsEl.appendChild(btn);
    });
  }
}

// ── MANEJAR DECISIÓN UFO ──────────────────────
function ufoHandleChoice(op, btn) {
  if (gs.optionsLocked) return;
  gs.optionsLocked = true;
  if (btn) btn.classList.add('chosen');

  // Aplicar stats
  gs.plata      += op.efecto_plata      || 0;
  gs.cordura    += op.efecto_cordura    || 0;
  gs.delirio    += op.efecto_delirio    || 0;
  gs.vulnerable += op.efecto_vulnerable || 0;
  gs.cordura     = Math.min(100, Math.max(0, gs.cordura));
  gs.delirio     = Math.min(100, Math.max(0, gs.delirio));

  // Activar ruta y condición
  if (op.activa_ruta)      ufoActivarRuta(op.activa_ruta);
  if (op.activa_condicion) ufoActivarCondicion(op.activa_condicion);

  // Toast si activó condición
  if (op.activa_condicion) showCondicionToast(op.activa_condicion);

  // Sprite de reacción
  let rx = null;
  if ((op.efecto_cordura  || 0) <= -15) rx = 'player-esquizo.png';
  else if ((op.efecto_delirio || 0) >= 20) rx = 'player-esquizo.png';
  else if ((op.efecto_cordura || 0) >= 10) rx = 'player-normal.png';
  if (rx) reactionSprite(rx);

  if ((op.efecto_cordura || 0) <= -15) screenShake();

  updateUI();

  // Colapso mental — UFO tiene su propio final por colapso
  if (gs.cordura <= 0 || gs.delirio >= 100) {
    clearGhosts();
    setTimeout(() => ufoTriggerColapso(), 700);
    return;
  }

  ufoState.eventosHoy++;

  setTimeout(async () => {
    const info = ufoDiaInfo();
    if (ufoState.eventosHoy >= info.eventos_dia) {
      await ufoAvanzarDia();
    } else {
      updateUI();
      ufoLoadEvento();
    }
  }, 850);
}

// ── AVANZAR AL SIGUIENTE DÍA ──────────────────
async function ufoAvanzarDia() {
  const diaActual = ufoDiaActual();

  // Al terminar miércoles determinar ruta final
  if (diaActual === 'miercoles') {
    ufoDeterminarRuta();
    ufoMostrarToastRuta();
  }

  ufoState.diaIdx++;
  ufoState.eventosHoy  = 0;
  ufoState.eventosVistos = []; // reset vistos para el nuevo día
  ufoGuardar();

  // Si terminó domingo → mostrar final
  if (ufoState.diaIdx >= UFO_SEMANA.length) {
    ufoTriggerFinal();
    return;
  }

  // Transición de día
  await ufoTransicionDia(diaActual);
  updateUI();
  ufoLoadEvento();
}

// ── TOAST DE RUTA DETERMINADA ─────────────────
function ufoMostrarToastRuta() {
  const msgs = {
    esceptico:        '🔍 Ruta confirmada: El Escéptico',
    curioso:          '🤔 Ruta confirmada: El Curioso',
    creyente:         '👁️ Ruta confirmada: El Creyente',
    ufo_contacto:     '🛸 Ruta confirmada: El Contacto',
    ufo_testigo:      '📹 Ruta confirmada: El Testigo',
    mistico_iniciado: '🕯️ Ruta confirmada: El Iniciado',
    mistico_escapado: '🏃 Ruta confirmada: El que Escapó'
  };
  const msg = msgs[ufoState.rutaFinal];
  if (!msg) return;

  const toast = document.createElement('div');
  toast.className = 'condicion-toast ruta-toast';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 50);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 400); }, 3500);
}

// ── TRANSICIÓN ENTRE DÍAS UFO ─────────────────
function ufoTransicionDia(diaCompletado) {
  return new Promise(resolve => {
    const ov    = document.getElementById('stage-transition');
    if (!ov) { resolve(); return; }

    const msgs = {
      lunes:     { title: 'LUNES COMPLETADO',     sub: 'Una semana rara empieza, hueon.',           icon: '🌆' },
      martes:    { title: 'MARTES COMPLETADO',    sub: 'La weá se está poniendo rara.',              icon: '🌃' },
      miercoles: { title: 'MIÉRCOLES COMPLETADO', sub: 'Ya no hay explicación pa esto.',             icon: '🌌' },
      jueves:    { title: 'JUEVES COMPLETADO',    sub: 'Mañana es viernes. Ya decidiste.',           icon: '👁️' },
      viernes:   { title: 'VIERNES COMPLETADO',   sub: 'Sobreviviste la noche. Por ahora.',          icon: '🛸' },
      sabado:    { title: 'SÁBADO COMPLETADO',    sub: 'Queda un día. El último.',                   icon: '🌙' },
    };

    const m = msgs[diaCompletado] || { title: 'DÍA COMPLETADO', sub: '...', icon: '⏱️' };

    document.getElementById('stage-icon').innerText     = m.icon;
    document.getElementById('stage-title').innerText    = m.title;
    document.getElementById('stage-subtitle').innerText = m.sub;

    ov.classList.add('active', 'cursed-overlay');
    setTimeout(() => {
      ov.classList.remove('active', 'cursed-overlay');
      resolve();
    }, 2200);
  });
}

// ── FINAL POR COLAPSO MENTAL ─────────────────
function ufoTriggerColapso() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;
  stopAudio();

  document.body.classList.add('cursed-mode', 'cursed-collapse');

  const dia = ufoDiaActual();
  const finalesColapso = {
    lunes: {
      titulo: 'TE QUEBRASTE EL LUNES',
      texto: 'Te volviste loco antes de entender nada. Saliste del depa a las 3 AM en pijama y sin celu. Nadie sabe adónde fuiste.',
      cierre: '"El del 4B llevaba semanas viendo señales antes de desaparecer."
"A ti te tomó un día."
"Quizás era pa ti también."'
    },
    martes: {
      titulo: 'NO LLEGASTE AL MIÉRCOLES',
      texto: 'Las señales te consumieron antes de poder descifrarlas. Te encontraron en el pasillo hablando solo, con el detector EMF en la mano, mirando la puerta del 4B.',
      cierre: '"Los paramédicos dijeron que estabas bien."
"Tú sabís que no."
"Lo que viste no se olvida."'
    },
    miercoles: {
      titulo: 'EL MIÉRCOLES TE GANÓ',
      texto: 'Demasiadas señales en muy poco tiempo. La mente llegó a su límite. Saliste corriendo del trabajo y no volviste. Te encontraron dos días después sentado en la plaza, mirando el cielo.',
      cierre: '"No recordabas tu nombre."
"Pero recordabas el símbolo del del 4B."
"Lo tenías dibujado en la mano."'
    },
    jueves: {
      titulo: 'TAN CERCA DEL VIERNES',
      texto: 'Estabas a un día de entender todo. Pero la mente no aguantó. Saliste corriendo hacia el cajón del Maipo sin mochila, sin celu, sin nada. No volviste.',
      cierre: '"En el cajón encontraron tu sombrero de papel aluminio."
"Al lado del del 4B."
"Quizás eso era el plan desde el principio."'
    },
    viernes: {
      titulo: 'LLEGASTE PERO NO RESISTISTE',
      texto: 'Llegaste hasta el final pero tu mente colapsó justo antes de ver la verdad. A veces el problema no son las respuestas — es que la mente no está lista para recibirlas.',
      cierre: '"El cajón del Maipo guarda sus secretos."
"Y ahora tú también eres parte de ellos."'
    }
  };

  const fc = finalesColapso[dia] || finalesColapso.viernes;

  layout.innerHTML = `
    <div class="end-screen ufo-final final-abduccion">
      <div class="end-icon">🌀</div>
      <h1>${fc.titulo}</h1>
      <p>${fc.texto}</p>
      <div class="stats-final">
        <p>Plata final: <span>$${gs.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura: <span>0/100</span></p>
        <p>Delirio acumulado: <span>${gs.delirio}</span></p>
        <p>Día donde colapsaste: <span>${(UFO_DIAS[dia] || {label: dia}).label}</span></p>
      </div>
      <p class="final-cierre">${fc.cierre.replace(/
/g, '<br>')}</p>
      <p style="font-size:0.75em;color:#888;margin:12px 0;">📸 Comparte tu colapso</p>
      <button class="btn-restart" onclick="ufoResetear(); location.reload()">🔄 INTENTARLO DE NUEVO</button>
    </div>`;
}

// ── FINALES ───────────────────────────────────
function ufoTriggerFinal() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;
  stopAudio();

  const ruta = ufoState.rutaFinal || 'esceptico';

  const finales = {
    esceptico: {
      titulo:  'NUNCA PASÓ NADA',
      emoji:   '🌑',
      texto:   'Te levantaste el sábado. Hiciste huevos revueltos. Pusiste la radio. La semana rara ya pasó.',
      imagen:  'assets/final-sombra.png',
      cierre:  '"Nunca pasó nada."\n"O eso creís tú."',
      clase:   'final-esceptico'
    },
    ufo_contacto: {
      titulo:  'EL CONTACTO',
      emoji:   '🛸',
      texto:   'Mantuviste los ojos abiertos. La luz se detuvo a tres metros. Algo te comunicó algo. No en palabras. Directo.',
      imagen:  'assets/final-cajon-vacio.png',
      cierre:  '"No podís contarle a nadie."\n"No porque te lo prohibieron."\n"Sino porque no hay palabras para lo que sabís ahora."',
      clase:   'final-contacto'
    },
    ufo_testigo: {
      titulo:  'LA ABDUCCIÓN',
      emoji:   '💫',
      texto:   'Cerraste los ojos. Había una luz tan intensa que igual la veías a través de los párpados. Después nada.',
      imagen:  'assets/final-cajon-vacio.png',
      cierre:  '"En el cajón del Maipo encontraron tu sombrero de papel aluminio."\n"Nada más."\n"El del 4B tampoco apareció."',
      clase:   'final-abduccion'
    },
    mistico_iniciado: {
      titulo:  'EL INICIADO',
      emoji:   '🕯️',
      texto:   'Pasaron tres semanas. Volvés a trabajar, comés, dormís, pagái las cuentas. Todo normal. Excepto que cada noche estai en otro lugar.',
      imagen:  'assets/final-brujos.png',
      cierre:  '"Los brujos de Salamanca cuidan a los suyos."\n"Ahora soi uno de ellos."\n"Bienvenido, cabro."',
      clase:   'final-iniciado'
    },
    mistico_escapado: {
      titulo:  'EL QUE ESCAPÓ',
      emoji:   '📄',
      texto:   'Imprimiste las 200 páginas. Las metiste en una caja. La cerraste con cinta. El domingo la caja estaba abierta. Las páginas en blanco.',
      imagen:  'assets/final-paginas.png',
      cierre:  '"¿Creíste que escapabas, cabro?"\n"Capaz que sí."\n"Capaz que no."',
      clase:   'final-escapado'
    }
  };

  // Fallback a escéptico si la ruta no tiene final definido
  const final = finales[ruta] || finales.esceptico;

  document.body.classList.remove('cursed-mode','cursed-collapse','cursed-critical','cursed-severe');
  if (['ufo_contacto','ufo_testigo','mistico_iniciado','mistico_escapado'].includes(ruta)) {
    document.body.classList.add('cursed-mode');
  }

  layout.innerHTML = `
    <div class="end-screen ufo-final ${final.clase}">
      <div class="end-icon">${final.emoji}</div>
      <h1>${final.titulo}</h1>
      <p>${final.texto}</p>
      ${final.imagen ? `<img src="${final.imagen}" class="final-imagen" alt="" onerror="this.style.display='none'">` : ''}
      <div class="stats-final">
        <p>Plata final: <span>$${gs.plata.toLocaleString('es-CL')}</span></p>
        <p>Cordura: <span>${Math.max(0, gs.cordura)}/100</span></p>
        <p>Delirio acumulado: <span>${gs.delirio}</span></p>
        <p>Ruta: <span>${final.titulo}</span></p>
      </div>
      <p class="final-cierre">${final.cierre.replace(/\n/g, '<br>')}</p>
      <p style="font-size:0.75em;color:#888;margin:12px 0;">📸 Comparte tu final</p>
      <button class="btn-restart" onclick="ufoResetear(); location.reload()">🔄 JUGAR DE NUEVO</button>
    </div>`;
}

// ── INIT UFO ──────────────────────────────────
function ufoInit() {
  ufoCargaEstado();
  document.body.classList.add('mode-ufo', 'cursed-mode');
  initAudio('ufo');

  // Mostrar prólogo antes del primer evento
  if (ufoState.diaIdx === 0 && ufoState.eventosHoy === 0) {
    ufoMostrarPrologo();
  } else {
    ufoLoadEvento();
  }
}

function ufoMostrarPrologo() {
  const layout = document.getElementById('main-layout');
  if (!layout) return;

  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;

  gameContainer.innerHTML = `
    <div id="ufo-prologo">
      <p class="prologo-linea" id="pl1">El vecino del 4B no llegó el viernes.</p>
      <p class="prologo-linea" id="pl2">El sábado tampoco.</p>
      <p class="prologo-linea" id="pl3">El domingo encontraron la puerta abierta, la tele encendida<br>y un detector de campo electromagnético en el suelo.</p>
      <p class="prologo-linea" id="pl4">Hoy es lunes.</p>
      <p class="prologo-linea highlight" id="pl5">Hay que ir a trabajar, hueon.</p>
      <button id="btn-prologo" onclick="ufoIniciarJuego()" style="display:none">▶ EMPEZAR</button>
    </div>`;

  // Aparecer líneas una por una
  const lineas = ['pl1','pl2','pl3','pl4','pl5'];
  lineas.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }, i * 1200);
  });

  setTimeout(() => {
    const btn = document.getElementById('btn-prologo');
    if (btn) btn.style.display = 'block';
  }, lineas.length * 1200 + 500);
}

function ufoIniciarJuego() {
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) gameContainer.innerHTML = '<h3 id="event-title">⚡ CARGANDO...</h3><p id="event-text" data-text=""></p><p id="event-subtext"></p><div id="options-container"></div>';
  updateUI();
  ufoLoadEvento();
}
