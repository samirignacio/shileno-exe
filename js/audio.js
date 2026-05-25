/* =============================================
   audio.js — Control de música ambient por modo
   ============================================= */

const AUDIO_TRACKS = {
  ufo: 'assets/ufo-ambient.mp3'
};

let audioPlayer  = null;
let audioMuted   = false;
let audioStarted = false;

function initAudio(mode) {
  // Solo UFO tiene música por ahora
  if (!AUDIO_TRACKS[mode]) return;

  // Crear elemento de audio
  audioPlayer = new Audio(AUDIO_TRACKS[mode]);
  audioPlayer.loop   = true;
  audioPlayer.volume = 0.35;

  // Mostrar control de audio
  const ctrl = document.getElementById('audio-control');
  if (ctrl) ctrl.style.display = 'block';

  // Autoplay al primer click/touch del usuario (política del navegador)
  const startAudio = () => {
    if (audioStarted) return;
    audioStarted = true;
    audioPlayer.play().catch(() => {});
    document.removeEventListener('click',     startAudio);
    document.removeEventListener('touchstart', startAudio);
  };

  document.addEventListener('click',      startAudio, { once: true });
  document.addEventListener('touchstart', startAudio, { once: true });
}

function toggleAudio() {
  if (!audioPlayer) return;
  const ctrl = document.getElementById('audio-control');

  if (audioMuted) {
    audioPlayer.volume = 0.35;
    audioMuted = false;
    if (ctrl) ctrl.innerText = '🔊 AUDIO';
  } else {
    audioPlayer.volume = 0;
    audioMuted = true;
    if (ctrl) ctrl.innerText = '🔇 MUTE';
  }
}

function stopAudio() {
  if (!audioPlayer) return;
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  audioStarted = false;
  const ctrl = document.getElementById('audio-control');
  if (ctrl) ctrl.style.display = 'none';
}

// Fade in suave al iniciar
function fadeInAudio() {
  if (!audioPlayer) return;
  audioPlayer.volume = 0;
  audioPlayer.play().catch(() => {});
  audioStarted = true;

  let vol = 0;
  const fade = setInterval(() => {
    vol = Math.min(0.35, vol + 0.02);
    audioPlayer.volume = vol;
    if (vol >= 0.35) clearInterval(fade);
  }, 100);
}
