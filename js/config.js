/* =============================================
   config.js — Constantes y configuración global
   ============================================= */

const SUPABASE_URL = "https://ofpdeqvoldmhbrhvnaga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcGRlcXZvbGRtaGJyaHZuYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTA5NTksImV4cCI6MjA5NDcyNjk1OX0.HFuZ6AzQmY2-aBsLCAcMhLL0oss2QEwKeYToAO_0lg0";

const GHOST_SPRITES = [
  'player-corriendo.png',
  'player-derrotado.png',
  'player-enojado.png',
  'player-esquizo.png',
  'player-puerco.png',
  'player-muerto.png'
];

const MODES = {
  normal: {
    stages: ['morning','midday','afternoon','night'],
    tables: {
      morning:   { events:'morning_events',   options:'morning_options',   label:'MAÑANA',   icon:'🌅' },
      midday:    { events:'midday_events',    options:'midday_options',    label:'MEDIODÍA', icon:'☀️' },
      afternoon: { events:'afternoon_events', options:'afternoon_options', label:'TARDE',    icon:'🌆' },
      night:     { events:'night_events',     options:'night_options',     label:'NOCHE',    icon:'🌌' }
    },
    startPlata:   15000,
    startCordura: 100,
    startDelirio: 0
  },
  ufo: {
    stages: ['morning','midday','afternoon','night'],
    tables: {
      morning:   { events:'ufo_morning_events',   options:'ufo_morning_options',   label:'AMANECER', icon:'🌄' },
      midday:    { events:'ufo_midday_events',    options:'ufo_midday_options',    label:'MEDIODÍA', icon:'🛸' },
      afternoon: { events:'ufo_afternoon_events', options:'ufo_afternoon_options', label:'TARDE',    icon:'👁️' },
      night:     { events:'ufo_night_events',     options:'ufo_night_options',     label:'NOCHE',    icon:'🌑' }
    },
    startPlata:   15000,
    startCordura: 80,
    startDelirio: 20
  }
};
