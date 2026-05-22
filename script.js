const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let gameState = {
    plata: 15000,
    cordura: 100,
    delirio: 0,
    vulnerable: 0,
    stages: ['morning', 'midday', 'afternoon', 'night'],
    currentStageIndex: 0
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
    document.getElementById('stat-plata').innerText = gameState.plata;
    document.getElementById('stat-cordura').innerText = gameState.cordura;
    document.getElementById('stat-delirio').innerText = gameState.delirio;
    document.getElementById('stat-vulnerable').innerText = gameState.vulnerable;
    
    const currentStageKey = gameState.stages[gameState.currentStageIndex];
    if (currentStageKey) {
        document.getElementById('current-stage').innerText = stageTables[currentStageKey].label;
    }
}

function setPlayerSprite(spriteFromDatabase = null) {
    const spriteImg = document.getElementById('player-sprite');
    if (!spriteImg) return;

    if (gameState.cordura <= 0) {
        spriteImg.src = "assets/player-muerto.png";
        return;
    }

    if (spriteFromDatabase) {
        // Corrección dinámica: Reemplaza .jpg por .png si viene mal desde Supabase
        let cleanSprite = spriteFromDatabase.replace(/\.jpg$/i, '.png');
        spriteImg.src = `assets/${cleanSprite}`;
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
        document.getElementById('event-title').innerText = "🚨 Error de conexión";
    }
}

function renderEvent(event, options) {
    const currentStageKey = gameState.stages[gameState.currentStageIndex].toUpperCase();
    document.getElementById('event-title').innerText = `Evento de la ${currentStageKey}`;
    document.getElementById('event-text').innerText = event.texto;
    document.getElementById('event-subtext').innerText = event.letra_chica ? `(${event.letra_chica})` : '';

    setPlayerSprite(event.sprite);

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    options.forEach(op => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = op.texto_opcion;
        btn.onclick = () => handleDecision(op);
        optionsContainer.appendChild(btn);
    });
}

function handleDecision(option) {
    gameState.plata += option.efecto_plata;
    gameState.cordura += option.efecto_cordura;
    gameState.delirio += option.efecto_delirio;
    gameState.vulnerable += option.efecto_vulnerable;

    if (gameState.cordura > 100) gameState.cordura = 100;
    if (gameState.delirio < 0) gameState.delirio = 0;

    updateUIStats();

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

    gameState.currentStageIndex++;

    setTimeout(() => {
        if (gameState.currentStageIndex >= gameState.stages.length) {
            triggerVictory();
        } else {
            loadRandomEvent();
        }
    }, 1000); 
}

function triggerGameOver(mensaje) {
    document.getElementById('main-layout').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-over-title').innerText = "💀 GAME OVER";
    document.getElementById('game-over-text').innerText = mensaje;
}

function triggerVictory() {
    document.getElementById('main-layout').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-over-container').style.background = '#e6ffe6';
    document.getElementById('game-over-title').innerText = "🏆 ¡SOBREVIVISTE!";
    document.getElementById('game-over-text').innerText = `Lograste llegar al amanecer del día siguiente manteniendo un saldo de $${gameState.plata} en tu Cuenta RUT. El desempleo aún no te destruye.`;
}
