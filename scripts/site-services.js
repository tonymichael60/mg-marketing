// Services accordion: click only (no hover-open), one card open at a time.
// Clicking a closed card opens it; any other open card is then closed by replaying a tap on it,
// so Framer animates both the open and the close with its own variant transition.
(() => {
  const SECT = '[data-framer-name="Services"]';
  const CARD = '.framer-56cFz';
  const isOpen = el => /Open/.test(el.dataset.framerName || '');
  let suppress = false;
  function tap(el) {
    const o = { bubbles: true, pointerType: 'mouse', isPrimary: true, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', o));
    el.dispatchEvent(new PointerEvent('pointerup', o));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
  addEventListener('click', e => {
    if (suppress) return;
    const el = e.target.closest(SECT + ' ' + CARD);
    if (!el) return;
    // Let Framer toggle the clicked card first, then close any other that is still open.
    setTimeout(() => {
      if (!isOpen(el)) return;
      const others = [...document.querySelectorAll(SECT + ' ' + CARD)].filter(c => c !== el && isOpen(c));
      if (!others.length) return;
      suppress = true;
      others.forEach(tap);
      setTimeout(() => { suppress = false; }, 50);
    }, 60);
  });
})();
