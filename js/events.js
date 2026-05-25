/* =============================================
   events.js — Carga y renderizado de eventos
   ============================================= */

async function loadEvent() {
  gs.optionsLocked = false;
  const tables = currentStageInfo();

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

  if (titleEl)   titleEl.innerText = info.icon + ' EVENTO — ' + info.label;
  if (optsEl)    optsEl.innerHTML  = '';
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
