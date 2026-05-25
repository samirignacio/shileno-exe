/* =============================================
   typewriter.js — Efecto de escritura progresiva
   ============================================= */

function typewriter(el, text) {
  return new Promise(resolve => {
    el.innerText = '';
    el.setAttribute('data-text', text);
    el.classList.add('typing');

    const lvl   = psychosisLevel();
    const speed = Math.max(8, 24 - lvl * 4);
    let i = 0;

    const iv = setInterval(() => {
      let ch = text[i];

      // En nivel crítico, insertar caracteres corruptos ocasionales
      if (lvl >= 3 && Math.random() < 0.04) {
        const glitchCh = ['█','▓','?','!','#'][Math.floor(Math.random()*5)];
        el.innerText += glitchCh;
        setTimeout(() => {
          el.innerText = el.innerText.slice(0,-1) + text[i];
          el.setAttribute('data-text', el.innerText);
        }, 110);
      } else {
        el.innerText += ch;
      }

      el.setAttribute('data-text', el.innerText);
      i++;

      if (i >= text.length) {
        clearInterval(iv);
        el.classList.remove('typing');
        resolve();
      }
    }, speed);
  });
}
