export function createUI(dom) {
  const prompt = dom.querySelector('#prompt');
  const stamina = dom.querySelector('#stamina');
  const reticle = dom.querySelector('#lock-reticle');
  const mode = dom.querySelector('#mode-badge');

  return {
    setPrompt(text) { prompt.textContent = text || ''; },
    setStamina(pct) { stamina.style.width = `${Math.max(0, Math.min(100, pct))}%`; },
    setLock(on) { reticle.hidden = !on; },
    setMode(name) { mode.textContent = name; },
  };
}
