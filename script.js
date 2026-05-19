const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";

// Cambiamos el nombre de la variable para que no choque con la librería global del CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function loadRandomEvent() {
    const currentStageKey = gameState.stages[gameState.currentStageIndex];
    const tables = stageTables[currentStageKey];

    try {
        const { data: eventsList, error: listError } = await supabaseClient
            .from(tables.events)
            .select('id');

        if (listError) throw listError;
        if (!eventsList || eventsList.length === 0) return;

        const randomElement = eventsList[Math.floor(Math.random() * eventsList.length)];
        const randomEventId = randomElement.id;

        const { data: eventData, error: eventError } = await supabaseClient
            .from(tables.events)
            .select('*')
            .eq('id', randomEventId)
            .single();

        if (eventError) throw eventError;

        const { data: optionsData, error: optionsError } = await supabaseClient
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

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    options.forEach(op => {
        const btn = document.createElement('button');
        btn.style.padding = "10px";
        btn.style.textAlign = "left";
        btn.style.cursor = "pointer";
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

    if (gameState.cordura <= 0) {
        triggerGameOver("Tu mente colapsó por completo ante la realidad país. Te quedaste mirando fijo la pared de tu pieza perdiendo el lazo con el mundo exterior.");
        return;
    }

    gameState.currentStageIndex++;

    if (gameState.currentStageIndex >= gameState.stages.length) {
        triggerVictory();
    } else {
        loadRandomEvent();
    }
}

function triggerGameOver(mensaje) {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('stats-container').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-over-title').innerText = "💀 GAME OVER";
    document.getElementById('game-over-text').innerText = mensaje;
}

function triggerVictory() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-over-container').style.background = '#e6ffe6';
    document.getElementById('game-over-title').innerText = "🏆 ¡SOBREVIVISTE!";
    document.getElementById('game-over-text').innerText = `Lograste llegar al amanecer del día siguiente manteniendo un saldo de $${gameState.plata} en tu Cuenta RUT y ${gameState.cordura}% de cordura. El desempleo aún no te destruye.`;
}
