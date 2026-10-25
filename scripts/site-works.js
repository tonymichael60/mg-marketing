// Featured Works (after dmcg.co): a reel that shows one project at a time. The section pins while it scrolls,
// and each case study's floating mockup glides up into the centre with its label and details beside it; the
// previous and next projects peek in above and below. The mockups are built in HTML/CSS (no photos).
// Framer can re-render its section, so the block is re-mounted whenever it goes missing.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  // One floating object per case study.
  const mockups = [
    // Support Copilot: a help-desk window where the AI drafts the reply.
    `<div class="mgr-obj mgr-desk">
      <div class="mgr-desk__bar"><i></i><i></i><i></i><span>support.inbox</span></div>
      <div class="mgr-desk__body">
        <div class="mgr-msg mgr-msg--in"><b>Customer</b>My invoice shows two charges for March.</div>
        <div class="mgr-ctx"><span>Plan · Pro</span><span>2 invoices</span><span>Refund eligible</span></div>
        <div class="mgr-msg mgr-msg--ai"><b>${icon('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>')}AI draft</b>Sorry about that. I have refunded the duplicate March charge; it will show in 3–5 days.<span class="mgr-caret"></span></div>
        <div class="mgr-send">Send reply</div>
      </div>
    </div>`,
    // Underwriting Risk Copilot: a phone with a claim summary and a risk gauge.
    `<div class="mgr-obj mgr-phone">
      <div class="mgr-phone__notch"></div>
      <div class="mgr-phone__screen">
        <small>Claim #48211</small>
        <b>Water damage · Home</b>
        <div class="mgr-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path class="mgr-gauge__track" d="M10 62a50 50 0 0 1 100 0"/><path class="mgr-gauge__fill" d="M10 62a50 50 0 0 1 100 0"/></svg><span>Low risk</span></div>
        <ul><li>Policy active</li><li>Photos match report</li><li>No prior claims</li></ul>
        <div class="mgr-phone__btns"><span>Review</span><span>Approve</span></div>
      </div>
    </div>`,
    // Clinical Note Summarizer: a tablet with a visit summary and a pulse line.
    `<div class="mgr-obj mgr-tablet">
      <div class="mgr-tablet__screen">
        <div class="mgr-tablet__head"><b>Pre-visit summary</b><span>Today · 10:30</span></div>
        <svg class="mgr-pulse" viewBox="0 0 300 60" aria-hidden="true"><path d="M0 34h70l12-22 16 44 14-30 10 8h178"/></svg>
        <div class="mgr-lines"><i style="width:92%"></i><i style="width:78%"></i><i style="width:86%"></i><i style="width:54%"></i></div>
        <div class="mgr-chips"><span>Allergies</span><span>Medication</span><span>Insurance</span></div>
      </div>
    </div>`,
    // Catalog Intelligence Engine: product cards fanned out, attributes tagged by the AI.
    `<div class="mgr-obj mgr-shop">
      ${['Linen shirt', 'Canvas tote', 'Desk lamp'].map((t, i) => `<div class="mgr-prod" style="--k:${i}">
        <div class="mgr-prod__img mgr-prod__img--${i}"></div>
        <b>${t}</b>
        <div class="mgr-prod__tags">${[['Cotton', 'Blue', 'Relaxed'], ['Canvas', 'Beige', 'Large'], ['Metal', 'Black', 'Dimmable']][i].map(a => `<span>${a}</span>`).join('')}</div>
      </div>`).join('')}
      <div class="mgr-cart">${icon('<path d="M3 4h2.2l2.3 10.5h10.3L20 7H6.4"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>')}Add to cart</div>
    </div>`,
  ];
  const works = [
    ['./work/support-copilot', 'Support Copilot for SaaS', 'Draft replies and pulls account context; reduced first-response time by 38%.', 'AI strategy · LLM agent', 'SaaS'],
    ['./work/underwriting-risk-copilot', 'Underwriting Risk Copilot', 'Built a triage assistant to summarize claims; cut manual review time by 42%.', 'Use-case mapping · Prompt & UI', 'Fintech'],
    ['./work/clinical-note-summarizer', 'Clinical Note Summarizer', 'Clinic-lobby assistant answering pre-visit questions; decreased front-desk calls by 28%.', 'AI UX flows · RAG', 'Healthcare'],
    ['./work/catalog-intelligence-engine', 'Catalog Intelligence Engine', 'Launched a shopping copilot that understands attributes; raised add-to-cart by 12%.', 'Data cleaning & embeddings', 'Ecommerce'],
  ];
  const N = works.length;
  const arrow = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const html = `
    <div class="mg-reel__stage">
      ${works.map(([href, title, desc, services, industry], i) => `
      <article class="mg-reel__item" aria-label="${esc(title)}">
        <div class="mg-reel__float">${mockups[i]}</div>
        <div class="mg-reel__info">
          <span class="mg-reel__label"><b>${esc(title)}</b><em>${esc(services)} · ${esc(industry)}</em></span>
          <p>${esc(desc)}</p>
          <a class="mg-reel__cta" href="${href}">View Case Study ${arrow}</a>
        </div>
      </article>`).join('')}
      <div class="mg-reel__count"><b data-reel-n>01</b> / ${String(N).padStart(2, '0')}</div>
    </div>`;

  let block = null, shown = 0, ticking = false;
  // Scroll position in project steps (0 = first project centred). The reel eases towards it each frame,
  // so even a jumpy wheel or a fling glides like dmcg.co.
  function target() {
    const r = block.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? Math.min(N - 1, Math.max(0, (-r.top / span) * (N - 1))) : 0;
  }
  function paint() {
    const items = block.querySelectorAll('.mg-reel__item');
    items.forEach((it, i) => {
      const d = i - shown, a = Math.min(1, Math.abs(d));
      // Neighbours sit above/below the centre, smaller and paler; the info only shows for the centred one.
      it.style.transform = `translate3d(0,${d * 58}vh,0) scale(${1 - a * 0.3})`;
      it.style.opacity = Math.abs(d) > 1.6 ? 0 : 1 - a * 0.55;
      it.style.setProperty('--info', Math.max(0, 1 - Math.abs(d) * 2.5));
      it.classList.toggle('is-active', Math.abs(d) < 0.5);
      it.querySelector('.mg-reel__cta').tabIndex = Math.abs(d) < 0.5 ? 0 : -1;
    });
    block.querySelector('[data-reel-n]').textContent = String(Math.round(shown) + 1).padStart(2, '0');
  }
  function frame() {
    ticking = false;
    if (!block || !block.isConnected) return;
    const t = target();
    shown += (t - shown) * 0.14;
    if (Math.abs(t - shown) < 0.001) shown = t;
    paint();
    if (shown !== t) request();
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  function mount() {
    const host = document.querySelector('#works');
    const cards = host && host.querySelector(':scope > .framer-kxz02j');
    if (!cards || host.querySelector(':scope > .mg-reel')) return;
    host.classList.add('mg-works-host');
    block = document.createElement('div');
    block.className = 'mg-reel';
    block.style.setProperty('--n', N);
    block.innerHTML = html;
    cards.after(block);
    shown = target();
    paint();
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  const start = () => {
    mount();
    new MutationObserver(rafOnce(() => { if (!block || !block.isConnected) mount(); })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
