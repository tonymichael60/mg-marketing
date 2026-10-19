// About stat cards: replace the single "Services under one roof" quote card (TrustMetrics Block)
// with two stat cards (Disciplines / Method) after the reference site. Re-mounts if Framer re-renders.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const html = `
    <article class="mg-metric">
      <span class="mg-metric__eyebrow">Disciplines</span>
      <span class="mg-metric__num">8</span>
      <p class="mg-metric__desc">Services under one roof, one plan, one team.</p>
    </article>
    <article class="mg-metric">
      <span class="mg-metric__eyebrow">Method</span>
      <span class="mg-metric__num">3<em>stages</em></span>
      <p class="mg-metric__desc">Root, Grow, Bloom. Every engagement follows it.</p>
    </article>`;
  let block = null;
  function mount() {
    const card = document.querySelector('.framer-1fgc0jk');
    if (!card || card.querySelector(':scope > .mg-metrics')) return;
    card.classList.add('mg-metrics-host');
    block = document.createElement('div');
    block.className = 'mg-metrics';
    block.innerHTML = html;
    card.appendChild(block);
  }
  const start = () => {
    mount();
    new MutationObserver(rafOnce(() => { if (!block || !block.isConnected) mount(); })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
