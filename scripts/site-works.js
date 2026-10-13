// Featured Works: replaces the Framer project cards with stacked, sticky case-study cards.
// Framer can re-render its section, so the block is re-mounted whenever it goes missing.
(() => {
  const works = [
    ['./work/support-copilot', 'Support Copilot for SaaS', 'Draft replies and pulls account context; reduced first-response time by 38%.', ['AI strategy', 'AI UX flows', 'LLM agent', 'RAG'], ['SaaS'], '3mYjyBkO1taOXWFFdYdWawzYdU.svg'],
    ['./work/underwriting-risk-copilot', 'Underwriting Risk Copilot', 'Built a triage assistant to summarize claims; cut manual review time by 42%.', ['Use-case mapping', 'Prompt & UI patterns'], ['Fintech'], '9ujF8ABgoO0V5nv7UJwe1WXY2Mw.svg'],
    ['./work/clinical-note-summarizer', 'Clinical Note Summarizer', 'Clinic-lobby assistant answering pre-visit questions; decreased front-desk calls by 28%.', ['AI strategy', 'AI UX flows', 'LLM agent', 'RAG'], ['Healthcare'], 'D3ZQRFsyC3I0z6aUqii7ffrCUo.png'],
    ['./work/catalog-intelligence-engine', 'Catalog Intelligence Engine', 'Launched a shopping copilot that understands attributes; raised add-to-cart by 12%.', ['Data cleaning & embeddings'], ['Ecommerce/Retail'], 'JAwg2A4GAzIyvReM0mGSgTlkV5U.jpg'],
  ];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const tags = list => `<div class="mg-work__tags">${list.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
  const arrow = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const html = works.map(([href, title, desc, deliverables, industry, image], i) => `
    <article class="mg-work" style="--i:${i}">
      <div class="mg-work__body">
        <h3>${esc(title)}</h3>
        <p class="mg-work__desc">${esc(desc)}</p>
        <div class="mg-work__meta"><small>Deliverables:</small>${tags(deliverables)}</div>
        <div class="mg-work__meta"><small>Industry:</small>${tags(industry)}</div>
        <a class="mg-work__cta" href="${href}">View Case Study ${arrow}</a>
      </div>
      <div class="mg-work__media"><img src="/mirror/framerusercontent.com/images/${image}" alt="${esc(title)}" loading="lazy" decoding="async"></div>
    </article>`).join('');

  let block = null;
  function mount() {
    const host = document.querySelector('#works');
    const cards = host && host.querySelector(':scope > .framer-kxz02j');
    if (!cards || host.querySelector(':scope > .mg-works')) return;
    host.classList.add('mg-works-host');
    block = document.createElement('div');
    block.className = 'mg-works';
    block.innerHTML = html;
    cards.after(block);
    update();
  }

  // Each card shrinks back as the cards after it slide over it.
  function update() {
    if (!block || !block.isConnected) return;
    const cards = [...block.children];
    const progress = cards.map(card => {
      const r = card.getBoundingClientRect(), stick = parseFloat(getComputedStyle(card).top);
      return Math.min(1, Math.max(0, 1 - (r.top - stick) / innerHeight));
    });
    cards.forEach((card, i) => {
      const depth = progress.slice(i + 1).reduce((sum, p) => sum + p, 0);
      card.style.transform = depth ? `scale(${1 - depth * 0.04})` : '';
      card.style.filter = depth ? `brightness(${1 - depth * 0.04})` : '';
    });
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
