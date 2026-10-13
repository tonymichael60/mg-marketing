// Services accordion: open a card when the mouse rests on it, instead of only on click.
// Framer opens cards from its tap gesture, so the hover replays a pointer tap on the card.
// The short delay stops a chain of openings while cards resize under a moving cursor.
(() => {
  const card = '[data-framer-name="Services"] .framer-56cFz';
  let timer = 0;
  addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest(card);
    clearTimeout(timer);
    if (!el || !/Closed/.test(el.dataset.framerName || '')) return;
    timer = setTimeout(() => {
      if (!el.matches(':hover') || !/Closed/.test(el.dataset.framerName || '')) return;
      const o = { bubbles: true, pointerType: 'mouse', isPrimary: true, button: 0 };
      el.dispatchEvent(new PointerEvent('pointerdown', o));
      el.dispatchEvent(new PointerEvent('pointerup', o));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, 150);
  });
})();
