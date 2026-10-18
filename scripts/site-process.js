// Process section: replaces the Framer slideshow with a fanned deck of step cards
// (after td-signal.framer.website "From brief to better content that performs").
// Framer can re-render its section, so the block is re-mounted whenever it goes missing.
(() => {
  const cards = [
    ['01', 'Strategy', 'Audit the brand, audience, and feed. Define pillars, hooks, briefs, and the launch plan.'],
    ['02', 'Production', 'Create scripts, creator direction, edits, captions, stills, and platform-ready variants.'],
    ['03', 'Optimization', 'Measure watch time, saves, clicks, and conversions. Use the data to improve each batch.'],
    ['04', 'Scale', 'Expand winning angles into new hooks, creators, formats, and ads. Cut the rest.'],
  ];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const spark = '<svg class="mg-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.55 5.2 1 5.65 10 10-9 4.35-9.45 4.8-10 10-.55-5.2-1-5.65-10-10 9-4.35 9.45-4.8 10-10Z" fill="currentColor"/></svg>';
  const html = `
    <div class="mg-process__inner">
      <header class="mg-process__header">
        <span class="mg-process__tag">The process</span>
        <h2>From brief to better content <span class="mg-process__muted">that performs.</span></h2>
      </header>
      <div class="mg-proc-cards">${cards.map(([n, title, text], i) => `
        <article class="mg-pcard" style="--i:${i}">
          <div class="mg-pcard__top"><span class="mg-pcard__num">${n}</span>${spark}</div>
          <div class="mg-pcard__body"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
        </article>`).join('')}
      </div>
    </div>`;

  let block = null, io = null;
  function reveal() {
    if (!block) return;
    const row = block.querySelector('.mg-proc-cards');
    if (!io) io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { threshold: 0.25 });
    io.observe(row);
  }
  function mount() {
    const host = [...document.querySelectorAll('[data-framer-name="Process"]')].find(el => el.offsetParent !== null);
    if (!host || host.querySelector(':scope > .mg-process')) return;
    host.classList.add('mg-process-host');
    block = document.createElement('section');
    block.className = 'mg-process';
    block.id = 'process';
    block.innerHTML = html;
    host.appendChild(block);
    reveal();
  }

  const start = () => {
    mount();
    new MutationObserver(() => { if (!block || !block.isConnected) mount(); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
