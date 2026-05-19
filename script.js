// ========================================================
// CONFIGURACIÓN DE SUPABASE 
// ========================================================
const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================================
// ESTADO GLOBAL DEL JUEGO
// ========================================================
let gameState = {
    plata: 15000,      // Saldo inicial en Cuenta RUT
    cordura: 100,      // Si llega a 0 -> Game Over
    delirio: 0,        // Si sube mucho activa estados esquizos
    vulnerable: 0,
    // Flujo del día: Mañana -> Mediodía -> Tarde -> Noche -> Victoria
    stages: ['morning', 'midday', 'afternoon', 'night'],
    currentStageIndex: 0
};

// Mapas de nombres de tablas según la etapa del día
const stageTables = {
    morning: { events: 'morning_events', options: 'morning_options', label: '🌅 MAÑANA' },
    midday: { events: 'midday_events', options: 'midday_options', label: '☀️ MEDIODÍA' },
    afternoon: { events: 'afternoon_events', options: 'afternoon_options', label: '🌆 TARDE' },
    night: { events: 'night_events', options: 'night_options', label: '🌌 NOCHE' }
};

// ========================================================
// MOTOR LÓGICO DEL JUEGO
// ========================================================

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    updateUIStats();
    loadRandomEvent();
});

// Actualiza los textos de las estadísticas en el HTML
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

// Trae un evento aleatorio de la jornada actual desde Supabase
async function loadRandomEvent() {
    const currentStageKey = gameState.stages[gameState.currentStageIndex];
    const tables = stageTables[currentStageKey];

    try {
        // 1. Obtener todos los IDs de eventos de la tabla actual para poder sacar uno al azar
        const { data: eventsList, error: listError } = await supabase
            .from(tables.events)
            .select('id');

        if (listError) throw listError;
        if (!eventsList || eventsList.length === 0) {
            console.error("No hay eventos cargados en la tabla:", tables.events);
            return;
        }

        // Seleccionar un ID aleatorio del array resultante
        const randomElement = eventsList[Math.floor(Math.random() * eventsList.length)];
        const randomEventId = randomElement.id;

        // 2. Traer el evento completo seleccionado y sus opciones correspondientes
        const { data: eventData, error: eventError } = await supabase
            .from(tables.events)
            .select('*')
            .eq('id', randomEventId)
            .single();

        if (eventError) throw eventError;

        const { data: optionsData, error: optionsError } = await supabase
            .from(tables.options)
            .select('*')
            .eq('evento_id', randomEventId);

        if (optionsError) throw optionsError;

        // 3. Renderizar en el HTML
        renderEvent(eventData, optionsData);

    } catch (err) {
        console.error("Error cargando el evento desde Supabase:", err.message);
        document.getElementById('event-title').innerText = "🚨 Error de conexión";
        document.getElementById('event-text').innerText = "Revisa las credenciales de tu script.js o la consola del navegador.";
    }
}

// Dibuja el dilema y genera los botones de decisión
function renderEvent(event, options) {
    const currentStageKey = gameState.stages[gameState.currentStageIndex].toUpperCase();
    document.getElementById('event-title').innerText = `Evento de la ${currentStageKey}`;
    document.getElementById('event-text').innerText = event.texto;
    document.getElementById('event-subtext').innerText = event.letra_chica ? `(${event.letra_chica})` : '';

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // Limpiar botones anteriores

    options.forEach(op => {
        const btn = document.createElement('button');
        btn.style.padding = "10px";
        btn.style.textAlign = "left";
        btn.style.cursor = "pointer";
        btn.innerText = op.texto_opcion;
        
        // Asignar el evento del clic pasándole los efectos numéricos de la BD
        btn.onclick = () => handleDecision(op);
        optionsContainer.appendChild(btn);
    });
}

// Procesa el impacto de la decisión tomada
function handleDecision(option) {
    // Aplicar modificadores de atributos
    gameState.plata += option.efecto_plata;
    gameState.cordura += option.efecto_cordura;
    gameState.delirio += option.efecto_delirio;
    gameState.vulnerable += option.efecto_vulnerable;

    // Topear rangos lógicos
    if (gameState.cordura > 100) gameState.cordura = 100;
    if (gameState.delirio < 0) gameState.delirio = 0;

    updateUIStats();

    // Validar condiciones de fin de juego instantáneo
    if (gameState.cordura <= 0) {
        triggerGameOver("Tu mente colapsó por completo ante la realidad país. Te quedaste mirando fijo la pared de tu pieza perdiendo el lazo con el mundo exterior.");
        return;
    }

    // Avanzar a la siguiente jornada del día
    gameState.currentStageIndex++;

    // Verificar si sobrevivió el día entero
    if (gameState.currentStageIndex >= gameState.stages.length) {
        triggerVictory();
    } else {
        // Siguiente etapa
        loadRandomEvent();
    }
}

// Control de fin de partida por derrota
function triggerGameOver(mensaje) {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('stats-container').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-over-title').innerText = "💀 GAME OVER";
    document.getElementById('game-over-text').innerText = mensaje;
}

// Control de fin de partida por victoria
function triggerVictory() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-over-container').style.background = '#e6ffe6';
    document.getElementById('game-over-title').innerText = "🏆 ¡SOBREVIVISTE!";
    document.getElementById('game-over-text').innerText = `Lograste llegar al amanecer del día siguiente manteniendo un saldo de $${gameState.plata} en tu Cuenta RUT y ${gameState.cordura}% de cordura. El desempleo aún no te destruye.`;
}
