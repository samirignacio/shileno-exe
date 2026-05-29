/* =============================================
   typewriter.js — Efecto de escritura progresiva
   con skip al hacer click
   ============================================= */

let typewriterInterval = null;
let typewriterSkipped  = false;

function typewriter(el, text) {
  return new Promise(resolve => {
    // Limpiar interval anterior si existe
    if (typewriterInterval) {
      clearInterval(typewriterInterval);
      typewriterInterval = null;
    }

    typewriterSkipped = false;
    el.innerText = '';
    el.setAttribute('data-text', text);
    el.classList.add('typing');

    const lvl   = psychosisLevel();
    const speed = Math.max(8, 24 - lvl * 4);
    let i = 0;

    // Click o touch en el texto salta la animación
    const skipHandler = () => {
      typewriterSkipped = true;
      clearInterval(typewriterInterval);
      typewriterInterval = null;
      el.innerText = text;
      el.setAttribute('data-text', text);
      el.classList.remove('typing');
      el.removeEventListener('click',      skipHandler);
      el.removeEventListener('touchstart', skipHandler);
      resolve();
    };

    el.addEventListener('click',      skipHandler, { once: true });
    el.addEventListener('touchstart', skipHandler, { once: true });

    typewriterInterval = setInterval(() => {
      let ch = text[i];

      // En nivel crítico, insertar caracteres corruptos ocasionales
      if (lvl >= 3 && Math.random() < 0.04) {
        const glitchCh = ['█','▓','?','!','#'][Math.floor(Math.random()*5)];
        el.innerText += glitchCh;
        setTimeout(() => {
          if (!typewriterSkipped) {
            el.innerText = el.innerText.slice(0,-1) + text[i];
            el.setAttribute('data-text', el.innerText);
          }
        }, 110);
      } else {
        el.innerText += ch;
      }

      el.setAttribute('data-text', el.innerText);
      i++;

      if (i >= text.length) {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
        el.classList.remove('typing');
        el.removeEventListener('click',      skipHandler);
        el.removeEventListener('touchstart', skipHandler);
        resolve();
      }
    }, speed);
  });
}
