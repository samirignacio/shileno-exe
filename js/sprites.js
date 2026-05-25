/* =============================================
   sprites.js — Manejo de sprites y fantasmas
   ============================================= */

function setSprite(fromDB) {
  const img = document.getElementById('player-sprite');
  if (!img) return;

  let target;
  if (gs.cordura <= 0)        target = 'player-muerto.png';
  else if (fromDB)            { target = fromDB; gs.currentSprite = fromDB; }
  else if (gs.delirio >= 70)  target = gs.currentSprite = 'player-esquizo.png';
  else if (gs.cordura <= 30)  target = gs.currentSprite = 'player-derrotado.png';
  else                        target = gs.currentSprite = 'player-normal.png';

  const lvl = psychosisLevel();
  img.className = '';
  if      (lvl >= 4) img.classList.add('glitch-active','sprite-level4');
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

// ── SISTEMA DE FANTASMAS ──────────────────────

function updateGhosts() {
  clearGhosts();
  const lvl = psychosisLevel();
  if (lvl < 0) return;

  const container = document.getElementById('character-container');
  if (!container) return;

  const cfgs = [
    { count:1, opacity:0.08, duration:8000, size:58  },
    { count:2, opacity:0.16, duration:5000, size:72  },
    { count:3, opacity:0.27, duration:3200, size:84  },
    { count:5, opacity:0.42, duration:1600, size:96  },
    { count:6, opacity:0.65, duration:750,  size:108 }
  ];
  const cfg     = cfgs[lvl];
  const sprites = [...GHOST_SPRITES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < cfg.count; i++) {
    const g = document.createElement('img');
    g.className = 'ghost-sprite' + (cfg.opacity >= 0.4 ? ' ghost-glitch' : '');
    g.src = 'assets/' + sprites[i % sprites.length];
    g.style.height = cfg.size + 'px';

    const angle = (i / cfg.count) * 280 - 140;
    const rx    = 38 + Math.random() * 22;
    const ry    = 22 + Math.random() * 18;
    g.style.left = (50 + rx * Math.sin(angle * Math.PI / 180)) + '%';
    g.style.top  = (50 - ry * Math.cos(angle * Math.PI / 180)) + '%';

    const delay = i * (cfg.duration / cfg.count) * 0.55;
    g.style.setProperty('--ghost-opacity',  cfg.opacity);
    g.style.setProperty('--ghost-duration', cfg.duration + 'ms');
    g.style.setProperty('--ghost-delay',    delay + 'ms');
    g.style.setProperty('--drift-x', ((Math.random()-0.5)*18) + 'px');
    g.style.setProperty('--drift-y', ((Math.random()-0.5)*14) + 'px');
    g.style.animation = `ghost-pulse ${cfg.duration}ms ${delay}ms ease-in-out infinite`;

    container.appendChild(g);
  }

  if (lvl >= 3) startAutoShake(lvl);
}

function clearGhosts() {
  stopAutoShake();
  document.querySelectorAll('.ghost-sprite').forEach(g => g.remove());
}
