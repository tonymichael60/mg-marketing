// Services section: replaces the Framer accordion with a pinned row of cards that rise into place one by one
// as the page scrolls (staircase reveal). Framer can re-render its section, so the block is re-mounted when it goes missing.
(() => {
  const img = name => `/mirror/framerusercontent.com/images/${name}.svg`;
  const services = [
    ['AI Strategy &amp; Mapping', 'Identify high-ROI use cases and define a realistic, measurable AI roadmap.', ['Stakeholder discovery', 'Value model &amp; KPI definition', 'Data readiness assessment'], 'N7WdKszYpXppuGfH2FoUpbIP2tw'],
    ['AI UX &amp; Product Design', 'Human-centered flows, prompts, and interfaces that build trust and adoption.', ['Prompt UX patterns', 'Prototype flows', 'Usability testing with real users'], 'tgFn5KOHxuVzRnxxY5K6e8rrbc'],
    ['LLM / Agent Development', 'Domain-specific copilots and agents that plan, execute, and report.', ['Multi-step planning', 'Function calling &amp; toolchains', 'Guardrails and audit trails'], 'VNUMGxu8bHPlCHeUaFBUKKuh2OQ'],
    ['Data Engineering &amp; Pipelines', 'Reliable data flows from ingestion to features, built for scale and cost control.', ['Data cleaning &amp; chunking', 'Hybrid search', 'Freshness, citations, and re-ranking'], 'LQzz6Xgeq2bSRwjEyr5inS0xDw4'],
  ];
  const html = `
    <div class="mg-services__pin">
      <div class="mg-services__inner">
        <div class="mg-services__header">
          <div>
            <span class="mg-services__tag">Services</span>
            <h2>End-to-End AI Services</h2>
          </div>
          <p>We turn ambiguous AI ideas into production features your users trust—combining strategy, design, engineering, and rigorous evaluation.</p>
        </div>
        <div class="mg-services__cards">${services.map(([title, text, points, image], i) => `
          <article class="mg-service">
            <div class="mg-service__media"><img src="${img(image)}" alt="" loading="lazy" decoding="async"><span>${String(i + 1).padStart(2, '0')}</span></div>
            <div class="mg-service__body">
              <h3>${title}</h3>
              <p>${text}</p>
              <ul>${points.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
          </article>`).join('')}
        </div>
      </div>
    </div>`;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let block = null;
  function mount() {
    const host = [...document.querySelectorAll('[data-framer-name="Services"]')].find(el => el.offsetParent !== null);
    if (!host || host.querySelector(':scope > .mg-services')) return;
    host.classList.add('mg-services-host');
    // The hidden Framer container carries the nav anchor; hand it to the visible block.
    host.querySelectorAll('#services').forEach(el => el.removeAttribute('id'));
    block = document.createElement('section');
    block.className = 'mg-services';
    block.id = 'services';
    block.innerHTML = html;
    host.appendChild(block);
    update();
  }

  // Card i starts i steps below the row and rises one step per step of scroll, so each card
  // travels at scroll speed and stops level with the others, like a column of sticky slots.
  function update() {
    if (!block || !block.isConnected) return;
    const cards = block.querySelectorAll('.mg-service');
    if (innerWidth < 810 || reduceMotion.matches) { block.style.height = ''; cards.forEach(c => { c.style.transform = ''; }); return; }
    const step = cards[0].offsetHeight + 24;
    const travel = (cards.length - 1) * step;
    block.style.height = `${innerHeight + travel * 1.15}px`;
    const scrolled = Math.min(travel, Math.max(0, -block.getBoundingClientRect().top));
    cards.forEach((c, i) => { c.style.transform = `translateY(${Math.max(0, i * step - scrolled)}px)`; });
  }

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);

  const start = () => {
    mount();
    new MutationObserver(() => { if (!block || !block.isConnected) mount(); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
