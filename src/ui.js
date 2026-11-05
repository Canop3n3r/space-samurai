function clamp(pct) {
  return Math.max(0, Math.min(100, pct));
}

export function createUI(dom) {
  const prompt = dom.querySelector('#prompt');
  const stamina = dom.querySelector('#stamina');
  const hp = dom.querySelector('#hp');
  const hpWrap = dom.querySelector('#hp-wrap');
  const reticle = dom.querySelector('#lock-reticle');
  const mode = dom.querySelector('#mode-badge');
  const help = dom.querySelector('#help');
  const target = dom.querySelector('#target');
  const targetFill = dom.querySelector('#target-fill');
  const targetName = dom.querySelector('#target-name');
  const dodgeBtn = dom.querySelector('[data-act="dodge"]');
  const lightBtn = dom.querySelector('[data-act="light"]');

  return {
    setPrompt(text) {
      if (prompt && prompt.textContent !== text) prompt.textContent = text || '';
    },
    setHelp(text) {
      if (help && text) help.textContent = text;
    },
    setStamina(pct) {
      if (stamina) stamina.style.width = `${clamp(pct)}%`;
    },
    setHealth(pct, visible = true) {
      if (hpWrap) hpWrap.hidden = !visible;
      if (hp) hp.style.width = `${clamp(pct)}%`;
    },
    setLock(on) {
      if (reticle) reticle.hidden = !on;
    },
    setMode(name) {
      if (mode) mode.textContent = name;
      if (dodgeBtn) dodgeBtn.textContent = name === 'FLIGHT' ? 'BOOST' : 'DODGE';
      if (lightBtn) lightBtn.textContent = name === 'FLIGHT' ? 'FIRE' : 'LIGHT';
    },
    setTarget(name, pct) {
      if (!target) return;
      if (!name) {
        target.hidden = true;
        return;
      }
      target.hidden = false;
      if (targetName) targetName.textContent = name;
      if (targetFill) targetFill.style.width = `${clamp(pct)}%`;
    },
    flash() {
      const fx = dom.querySelector('#fx');
      if (!fx) return;
      fx.classList.add('on');
      clearTimeout(fx._t);
      fx._t = setTimeout(() => fx.classList.remove('on'), 90);
    },
  };
}
