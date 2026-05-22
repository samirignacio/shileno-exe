const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let gameState = {
    plata: 15000,
    cordura: 100,
    delirio: 0,
    vulnerable: 0,
    stages: ['morning', 'midday', 'afternoon', 'night'],
    currentStageIndex: 0,
    eventsInCurrentStage: 0
};

const stageTables = {
    morning: { events: 'morning_events', options: 'morning_options', label: '🌅 MAÑANA' },
    midday: { events: 'midday_events', options: 'midday_options', label: '☀️ MEDIODÍA' },
    afternoon: { events: 'afternoon_events', options: 'afternoon_options', label: '🌆 TARDE' },
    night: { events: 'night_events', options: 'night_options', label: '🌌 NOCHE' }
};

window.addEventListener('DOMContentLoaded', () => {
    updateUIStats();
    loadRandomEvent();
});

function updateUIStats() {
    if(document.getElementById('stat-plata')) document.getElementById('stat-plata').innerText = `$${gameState.plata}`;
    if(document.getElementById('stat-cordura')) document.getElementById('stat-cordura').innerText = gameState.cordura;
    if(document.getElementById('stat-delirio')) document.getElementById('stat-delirio').innerText = gameState.delirio;
    if(document.getElementById('stat-vulnerable')) document.getElementById('stat-vulnerable').innerText = gameState.vulnerable;
    
    const currentStageKey = gameState.stages[gameState.currentStageIndex];
    if (currentStageKey) {
        const stageLabelElement = document.getElementById('game-stage');
        if (stageLabelElement) {
            stageLabelElement.innerText = `${stageTables[currentStageKey].label} (${gameState.eventsInCurrentStage + 1}/3)`;
        }
    }
}

function setPlayerSprite(spriteFromDatabase = null) {
    const spriteImg = document.getElementById('player-sprite');
    if (!spriteImg) return;

    if (gameState.delirio > 50 || gameState.cordura < 40) {
        spriteImg.classList.add('glitch-active');
    } else {
        spriteImg.classList.remove('glitch-active');
    }

    // CORREGIDO: Todas las respuestas de imagen se van a buscar estricto a la carpeta assets/
    if (gameState.cordura <= 0) {
        spriteImg.src = "assets/player-muerto.png";
        spriteImg.classList.remove('glitch-active');
        return;
    }

    if (spriteFromDatabase) {
        spriteImg.src = `assets/${spriteFromDatabase}`;
        return;
    }

    if (gameState.plata <= 0 || gameState.cordura <= 30) {
        spriteImg.src = "assets/player-derrotado.png";
    } else if (gameState.delirio >= 70) {
        spriteImg.src = "assets/player-esquizo.png";
    } else {
        spriteImg.src = "assets/player-normal.png";
    }
}

async function loadRandomEvent() {
    const currentStageKey = gameState.stages[gameState.currentStageIndex];
    const tables = stageTables[currentStageKey];

    try {
        const { data: eventsList, error: listError } = await db
            .from(tables.events)
            .select('id');

        if (listError) throw listError;
        if (!eventsList || eventsList.length === 0) return;

        const randomElement = eventsList[Math.floor(Math.random() * eventsList.length)];
        const randomEventId = randomElement.id;

        const { data: eventData, error: eventError } = await db
            .from(tables.events)
            .select('*')
            .eq('id', randomEventId)
            .single();

        if (eventError) throw eventError;

        const { data: optionsData, error: optionsError } = await db
            .from(tables.options)
            .select('*')
            .eq('evento_id', randomEventId);

        if (optionsError) throw optionsError;

        renderEvent(eventData, optionsData);

    } catch (err) {
        console.error("Error Supabase:", err.message);
        const txtEvent = document.getElementById('event-text');
        if (txtEvent) txtEvent.innerText = "🚨 Error al conectar las bases de datos.";
    }
}

function renderEvent(event, options) {
    const txtEvent = document.getElementById('event-text');
    const txtSub = document.getElementById('event-subtext');
    const titleEvent = document.getElementById('event-title');

    if (titleEvent) {
        const currentStageKey = gameState.stages[gameState.currentStageIndex].toUpperCase();
        titleEvent.innerText = `Evento de la ${currentStageKey}`;
    }
    if (txtEvent) txtEvent.innerText = event.texto;
    if (txtSub) txtSub.innerText = event.letra_chica ? `(${event.letra_chica})` : '';

    setPlayerSprite(event.sprite);

    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        options.forEach(op => {
            const btn = document.createElement('button');
            btn.className = "option-btn";
            btn.innerText = op.texto_opcion;
            btn.onclick = () => handleDecision(op);
            optionsContainer.appendChild(btn);
        });
    }
}

function handleDecision(option) {
    gameState.plata += option.efecto_plata;
    gameState.cordura += option.efecto_cordura;
    gameState.delirio += option.efecto_delirio;
    gameState.vulnerable += option.efecto_vulnerable;

    if (gameState.cordura > 100) gameState.cordura = 100;
    if (gameState.delirio < 0) gameState.delirio = 0;

    let reactionPose = null;
    if (option.efecto_cordura < -15) reactionPose = "player-esquizo.png";
    else if (option.efecto_plata < -5000) reactionPose = "player-derrotado.png";
    else if (option.efecto_delirio > 15) reactionPose = "player-puerco.png";

    if (reactionPose) {
        setPlayerSprite(reactionPose);
    }

    if (gameState.cordura <= 0) {
        setTimeout(() => {
            setPlayerSprite();
            triggerGameOver("Tu mente colapsó por completo ante la realidad país. Te quedaste mirando fijo la pared de tu pieza perdiendo el lazo con el mundo exterior.");
        }, 600);
        return;
    }

    gameState.eventsInCurrentStage++;

    setTimeout(() => {
        if (gameState.eventsInCurrentStage >= 3) {
            gameState.eventsInCurrentStage = 0;
            gameState.currentStageIndex++;
        }

        updateUIStats();

        if (gameState.currentStageIndex >= gameState.stages.length) {
            triggerVictory();
        } else {
            loadRandomEvent();
        }
    }, 1000); 
}

function triggerGameOver(mensaje) {
    const layout = document.getElementById('main-layout');
    if (layout) {
        layout.innerHTML = `
            <div class="card-container" style="border: 2px solid #ef4444; margin-top:20px;">
                <div class="card-header" style="background:#ef4444;">💀 GAME OVER</div>
                <div class="card-body">
                    <p style="font-size:1.1em; line-height:1.4;">${mensaje}</p>
                    <button class="option-btn" style="margin-top:15px; text-align:center; width:100%;" onclick="location.reload()">🔄 Reintentar desafío</button>
                </div>
            </div>
        `;
    }
}

function triggerVictory() {
    const layout = document.getElementById('main-layout');
    if (layout) {
        layout.innerHTML = `
            <div class="card-container" style="border: 2px solid #22c55e; margin-top:20px;">
                <div class="card-header" style="background:#22c55e;">🏆 ¡SOBREVIVISTE!</div>
                <div class="card-body">
                    <p style="font-size:1.1em; line-height:1.4;">Lograste llegar al amanecer del día siguiente manteniendo un saldo de $${gameState.plata} en tu Cuenta RUT. El desempleo aún no te destruye.</p>
                    <button class="option-btn" style="margin-top:15px; text-align:center; width:100%;" onclick="location.reload()">🎮 Jugar de nuevo</button>
                </div>
            </div>
        `;
    }
}
