// FAQ: only one answer open at a time. Framer toggles each row on its own, so when a closed row is
// clicked open, replay a tap on every other open row to close it.
// Rows are read by variant class: Framer drops data-framer-name while a row is hovered.
(() => {
  const row = '[data-framer-name="FAQ"] .framer-WHLkL';
  const open = '.framer-v-pvaq0t, .framer-v-1epjw81, .framer-v-jddlaw'; // OPEN, Tablet Open, Mobile
  addEventListener('click', e => {
    if (!e.isTrusted) return;
    const el = e.target.closest(row);
    if (!el || el.matches(open)) return;
    for (const other of document.querySelectorAll(row)) {
      if (other === el || !other.matches(open)) continue;
      const o = { bubbles: true, pointerType: 'mouse', isPrimary: true, button: 0 };
      other.dispatchEvent(new PointerEvent('pointerdown', o));
      other.dispatchEvent(new PointerEvent('pointerup', o));
      other.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }, true);
})();
