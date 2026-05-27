/* =============================================
   events.js — Carga y renderizado de eventos
   ============================================= */

async function loadEvent() {
  gs.optionsLocked = false;
  const tables = currentStageInfo();

  try {
    // Traer todos los eventos de la etapa
    const { data: list, error: le } = await db
      .from(tables.events)
      .select('id, requiere_condicion');
    if (le) throw le;
    if (!list || !list.length) { showErr('Sin eventos disponibles.'); return; }

    // Filtrar: eventos sin condición O cuya condición esté activa
    const disponibles = list.filter(ev => tieneCondicion(ev.requiere_condicion));

    // Si hay eventos condicionales aplicables, darles más peso (30% de probabilidad)
    const condicionales = disponibles.filter(ev => ev.requiere_condicion);
    const normales      = disponibles.filter(ev => !ev.requiere_condicion);

    let elegido;
    if (condicionales.length > 0 && Math.random() < 0.35) {
      elegido = condicionales[Math.floor(Math.random() * condicionales.length)];
    } else {
      elegido = normales[Math.floor(Math.random() * normales.length)];
    }

    const { data: ev, error: ee } = await db
      .from(tables.events).select('*').eq('id', elegido.id).single();
    if (ee) throw ee;

    const { data: opts, error: oe } = await db
      .from(tables.options).select('*').eq('evento_id', elegido.id);
    if (oe) throw oe;

    await renderEvent(ev, opts);

  } catch(err) {
    console.error('Error Supabase:', err.message);
    showErr('🚨 Error de conexión. Recarga la página.');
  }
}

async function renderEvent(ev, opts) {
  const titleEl   = document.getElementById('event-title');
  const textEl    = document.getElementById('event-text');
  const subtextEl = document.getElementById('event-subtext');
  const optsEl    = document.getElementById('options-container');

  const info = currentStageInfo();

  // Indicador visual si es evento condicional
  const esCondicional = !!ev.requiere_condicion;
  if (titleEl) {
    titleEl.innerText = info.icon + ' EVENTO — ' + info.label + (esCondicional ? ' ⚡' : '');
  }

  if (optsEl)    optsEl.innerHTML   = '';
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
