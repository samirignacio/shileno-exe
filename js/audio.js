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
  if (!AUDIO_TRACKS[mode]) return;

  // Si ya hay un player activo lo limpiamos
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer = null;
    audioStarted = false;
  }

  audioPlayer = new Audio(AUDIO_TRACKS[mode]);
  audioPlayer.loop   = true;
  audioPlayer.volume = 0.35;

  // Mostrar control
  const ctrl = document.getElementById('audio-control');
  if (ctrl) {
    ctrl.style.display = 'block';
    ctrl.innerText = '🔊 AUDIO';
  }

  // Arrancar al primer gesto del usuario
  const startAudio = () => {
    if (audioStarted || !audioPlayer) return;
    audioStarted = true;
    fadeInAudio();
    document.removeEventListener('click',      startAudio);
    document.removeEventListener('touchstart', startAudio);
  };

  document.addEventListener('click',      startAudio);
  document.addEventListener('touchstart', startAudio);
}

function toggleAudio() {
  if (!audioPlayer) return;
  const ctrl = document.getElementById('audio-control');

  if (audioMuted) {
    // Desmutear con fade in suave
    audioMuted = false;
    let vol = 0;
    audioPlayer.volume = 0;
    const fade = setInterval(() => {
      vol = Math.min(0.35, vol + 0.03);
      audioPlayer.volume = vol;
      if (vol >= 0.35) clearInterval(fade);
    }, 50);
    if (ctrl) ctrl.innerText = '🔊 AUDIO';
  } else {
    // Mutear con fade out suave
    audioMuted = true;
    let vol = audioPlayer.volume;
    const fade = setInterval(() => {
      vol = Math.max(0, vol - 0.03);
      audioPlayer.volume = vol;
      if (vol <= 0) {
        clearInterval(fade);
        audioPlayer.volume = 0;
      }
    }, 50);
    if (ctrl) ctrl.innerText = '🔇 MUTE';
  }
}

function stopAudio() {
  if (!audioPlayer) return;
  // Fade out antes de parar
  let vol = audioPlayer.volume;
  const fade = setInterval(() => {
    vol = Math.max(0, vol - 0.05);
    audioPlayer.volume = vol;
    if (vol <= 0) {
      clearInterval(fade);
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      audioStarted = false;
      audioPlayer = null;
    }
  }, 50);
  const ctrl = document.getElementById('audio-control');
  if (ctrl) ctrl.style.display = 'none';
}

function fadeInAudio() {
  if (!audioPlayer) return;
  audioPlayer.volume = 0;
  audioPlayer.play().catch(() => {});

  let vol = 0;
  const fade = setInterval(() => {
    vol = Math.min(0.35, vol + 0.02);
    audioPlayer.volume = vol;
    if (vol >= 0.35) clearInterval(fade);
  }, 80);
}
