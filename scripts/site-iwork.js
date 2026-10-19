// Work section (horizontal pinned scroller, ported from the reference file): vertical scroll drives the
// horizontal card track. Mounted in place of the Statistics section. Re-mounts if Framer re-renders.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Neumorphic illustrations (same tile / chip style as the Benefits cards), one per card topic.
  const visuals = [
    '<div class="mgv mgv-funnel"><div class="mgv-row"><span class="mgv-bar" style="width:58%"></span><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Impressions</span></div><div class="mgv-row"><span class="mgv-bar" style="width:44%"></span><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3l12 6.5-5.2 1.6L10.9 16z"/><path d="M13 13l5 5"/></svg>Clicks</span></div><div class="mgv-row"><span class="mgv-bar" style="width:31%"></span><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>Leads</span></div><div class="mgv-row"><span class="mgv-bar" style="width:20%"></span><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.3 10.5h10.3L20 7H6.4"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>Customers</span></div></div>',
    '<div class="mgv mgv-video"><div class="mgv-screen"><span class="mgv-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#111" stroke="none"/></svg></span></div><div class="mgv-timeline"><span class="mgv-clip" style="flex:3"></span><span class="mgv-clip" style="flex:4"></span><span class="mgv-clip" style="flex:2"></span><i class="mgv-head"></i></div><div class="mgv-chips"><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/><path d="M14 7l3 3"/></svg>Script</span><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18M12 4v16"/></svg>Storyboard</span><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8.2 8.3L20 18M8.2 15.7L20 6"/></svg>Edit</span></div></div>',
    '<div class="mgv mgv-flow"><div class="mgv-nodes"><span class="mgv-track"></span><span class="mgv-node"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3.2-6 7-6s7 2 7 6"/><path d="M19 8v6M16 11h6"/></svg></span><span class="mgv-node mgv-node--up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg></span><span class="mgv-node"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></svg></span></div><div class="mgv-chips"><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>Follow-up 24/7</span></div></div>',
    '<div class="mgv mgv-brand"><div class="mgv-brandgrid"><span class="mgv-logo"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 48V18l20 20 20-20v30" stroke-width="5.5"/></svg></span><div class="mgv-brandcol"><span class="mgv-swatches"><i style="background:#020a70"></i><i style="background:#1422e3"></i><i style="background:#c7cefa"></i></span><span class="mgv-type">Aa</span></div></div><div class="mgv-chips"><span class="mgv-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/></svg>Guidelines</span></div></div>',
  ];
  const cards = [
    { n: '01', tag: 'Performance', art: 'radial-gradient(circle at 30% 20%,#3a74ff,transparent 55%),radial-gradient(circle at 80% 80%,#0a2a8a,transparent 60%),linear-gradient(160deg,#0c1c4a,#030817)', small: 'Meta · Google · Tracking', title: 'Full-funnel ad systems', desc: 'Account architecture, creative testing and retargeting built around cost per customer.' },
    { n: '02', tag: 'AI Video', art: 'radial-gradient(circle at 70% 25%,#6a4bff,transparent 55%),radial-gradient(circle at 20% 80%,#1466d6,transparent 60%),linear-gradient(160deg,#101a4a,#030817)', small: 'Script · Storyboard · Edit', title: 'AI films & reel engines', desc: 'Cinematic ads and a weekly flow of short-form content, produced at the speed of AI.' },
    { n: '03', tag: 'Automation', art: 'radial-gradient(circle at 50% 30%,#1f9bff,transparent 55%),radial-gradient(circle at 80% 90%,#2f3dff,transparent 60%),linear-gradient(160deg,#08204f,#030817)', small: 'CRM · WhatsApp · AI agents', title: 'Lead machines that never sleep', desc: 'Capture, qualify and follow up automatically, so no enquiry goes cold.' },
    { n: '04', tag: 'Brand', art: 'radial-gradient(circle at 25% 70%,#2f6bff,transparent 55%),radial-gradient(circle at 85% 15%,#9cc0ff,transparent 45%),linear-gradient(160deg,#0c1c4a,#030817)', small: 'Identity · Web · Guidelines', title: 'Brands built as systems', desc: 'Identity, website and collateral designed to look premium everywhere they appear.' },
  ];
  function cardHTML(c, i) {
    return `<article class="mg-icard"><div class="mg-icard__art" style="background:${c.art}"></div><div class="mg-icard__glare"></div>
      <div class="mg-icard__visual">${visuals[i]}</div>
      <div class="mg-icard__top"><span>${c.n}</span><span>${esc(c.tag)}</span></div>
      <div class="mg-icard__info"><small>${esc(c.small)}</small><h4>${esc(c.title)}</h4><p>${esc(c.desc)}</p></div></article>`;
  }
  function html() {
    return `
      <div class="mg-iwork__pin">
        <div class="mg-iwork__head">
          <div><span class="mg-iwork__eyebrow">What we build</span><h2>Proof over <i>promises.</i></h2></div>
          <p class="mg-iwork__lead">Campaigns, content and systems designed to move one number. Scroll to explore.</p>
        </div>
        <div class="mg-iwork__track">
          ${cards.map(cardHTML).join('')}
          <article class="mg-icard mg-icard--end"><span class="mg-icard__eyebrow">Your brand, next</span><h4>Let's grow <i>yours.</i></h4><a class="mg-iwork__btn" href="#contact">Start a project →</a></article>
        </div>
        <div class="mg-iwork__progress"><i></i></div>
      </div>`;
  }

  let sec = null, ticking = false;

  function setH() {
    if (!sec) return;
    const track = sec.querySelector('.mg-iwork__track');
    if (innerWidth <= 760) { sec.style.height = ''; return; }
    const dist = track.scrollWidth - innerWidth;
    sec.style.height = (innerHeight + Math.max(0, dist)) + 'px';
  }
  function update() {
    ticking = false;
    if (!sec || !sec.isConnected) return;
    const r = sec.getBoundingClientRect();
    if (innerWidth <= 760) return;
    const track = sec.querySelector('.mg-iwork__track'), prog = sec.querySelector('.mg-iwork__progress i');
    const dist = track.scrollWidth - innerWidth;
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    track.style.transform = `translate3d(${-dist * p}px,0,0)`;
    if (prog) prog.style.setProperty('--wp', p.toFixed(4));
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  function mount() {
    if (document.querySelector('.mg-iwork')) return;
    const anchor = document.querySelector('[data-framer-name="Statistics"]');
    if (!anchor || !anchor.parentNode) return;
    sec = document.createElement('section');
    sec.className = 'mg-iwork';
    sec.id = 'build';
    sec.innerHTML = html();
    anchor.parentNode.insertBefore(sec, anchor);
    setH(); update();
    if (fine && !reduce) sec.querySelectorAll('.mg-icard').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', `${(x - .5) * 12}deg`);
        c.style.setProperty('--rx', `${(.5 - y) * 10}deg`);
        c.style.setProperty('--mx', `${e.clientX - r.left}px`);
        c.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
    });
  }

  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { setH(); req(); });
  const start = () => {
    mount();
    new MutationObserver(rafOnce(() => { if (!sec || !sec.isConnected) mount(); })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
