// Process section (after spector.framer.website): a large stacked headline whose lines darken as they
// scroll into view, then a looping 3D carousel of Groot Method stage cards. As in the reference, the row is
// moved in JS (arrows or drag), one card per step with a long ease-out, and each card folds up to 90 degrees on
// the edge it is crossing, computed in the same frame as the slide so the two never drift apart. Replaces the Framer slideshow. Framer can re-render its section, so the block is
// re-mounted whenever it goes missing.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const check = icon('<path d="M5 12.5l4.2 4.2L19 7"/>');
  const steps = [
    {
      n: '01', title: 'Root', days: '3-7 days',
      lede: 'Align on problems, data reality, and success metrics.',
      points: ['Opportunity brief.', 'KPI model.', 'Phased roadmap, effort/cost ranges.'],
      // Discovery: four bars fill in turn, one per deliverable.
      visual: `<div class="mgv mgv-funnel">${[
        [86, icon('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'), 'Problems'],
        [70, icon('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>'), 'Data audit'],
        [56, icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), 'KPI model'],
        [42, icon('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>'), 'Roadmap'],
      ].map(([w, svg, label]) => `<div class="mgv-row"><span class="mgv-bar" style="width:${w}%"></span><span class="mgv-chip">${svg}${label}</span></div>`).join('')}</div>`,
    },
    {
      n: '02', title: 'Grow', days: '1-2 weeks',
      lede: 'We build the growth engine.',
      points: ['Funnels and campaigns.', 'AI content.', 'Smart automations that tie it together.'],
      // Build: a lead travels funnel -> campaign -> automation.
      visual: `<div class="mgv mgv-flow"><div class="mgv-nodes"><span class="mgv-track"></span>
        <span class="mgv-node">${icon('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>')}</span>
        <span class="mgv-node mgv-node--up">${icon('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</span>
        <span class="mgv-node">${icon('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>')}</span>
      </div><div class="mgv-chips">${['Funnels', 'Campaigns', 'AI content', 'Automations'].map(t => `<span class="mgv-chip">${t}</span>`).join('')}</div></div>`,
    },
    {
      n: '03', title: 'Validate & Evals', days: '1 week',
      lede: 'Prove accuracy, usability, safety, and cost.',
      points: ['Eval dashboard.', 'Acceptance thresholds.', 'Decision to iterate or ship.'],
      // Evals: each check ticks in turn, then the ship decision lights up.
      visual: `<div class="mgv mgv-evals"><div class="mgv-checks">${['Accuracy', 'Usability', 'Safety', 'Cost'].map(t => `<span class="mgv-chip"><i class="mgv-tick">${check}</i>${t}</span>`).join('')}</div>
        <span class="mgv-ship">${icon('<path d="M4 15l8-11 8 11"/><path d="M12 4v16"/>')}Ready to ship</span></div>`,
    },
    {
      n: '04', title: 'Launch', days: '1 week',
      lede: 'Go live with eyes on every number.',
      points: ['Go-live checklist and QA.', 'Tracking and dashboards switched on.', 'Team handover and training.'],
      // Go-live: the launch tile lifts while its checks light up.
      visual: `<div class="mgv mgv-launch"><span class="mgv-node mgv-node--up">${icon('<path d="M12 3c3 2 5 5.5 5 9.5L15 16H9l-2-3.5C7 8.5 9 5 12 3z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 16l-2 4 3-1M15 16l2 4-3-1"/>')}</span>
        <div class="mgv-chips">${['QA passed', 'Tracking on', 'Live'].map(t => `<span class="mgv-chip"><i class="mgv-tick">${check}</i>${t}</span>`).join('')}</div></div>`,
    },
    {
      n: '05', title: 'Bloom', days: 'Ongoing',
      lede: 'Scale what works, cut what does not.',
      points: ['Weekly optimisation sprints.', 'Monthly performance reviews.', 'New channels as results compound.'],
      // Scale: growth bars rise in turn under a rising return figure.
      visual: `<div class="mgv mgv-bloom"><span class="mgv-chip">${icon('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>')}Return on ad spend</span>
        <div class="mgv-cols">${[34, 48, 62, 80, 100].map(h => `<span class="mgv-col" style="height:${h}%"></span>`).join('')}</div></div>`,
    },
  ];
  const esc = s => s.replace(/&/g, '&amp;');
  const arrow = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const html = `
    <div class="mg-process__wrap">
      <div class="mg-process__top">
        <span class="mg-process__tag">Process</span>
        <div class="mg-process__aside"><small>The Groot Method</small><b>Root. Grow. Validate. Launch. Bloom.</b></div>
      </div>
      <h2 class="mg-process__title"><span class="mg-pline">From idea</span><span class="mg-pline">to production</span></h2>
      <div class="mg-process__viewport">
        <div class="mg-process__track">${[0, 1, 2].map(copy => steps.map(s => `
          <article class="mg-pcard"${copy ? ' aria-hidden="true"' : ''}>
            <div class="mg-pcard__head"><h3>${esc(s.title)}</h3><span class="mg-pcard__num">/${s.n}</span></div>
            <p class="mg-pcard__lede">${s.lede}</p>
            <p class="mg-pcard__time">Timeframe <b>${s.days}</b></p>
            <div class="mg-pcard__visual" aria-hidden="true">${s.visual}</div>
            <ul class="mg-pcard__points">${s.points.map(t => `<li>${t}</li>`).join('')}</ul>
          </article>`).join('')).join('')}
        </div>
      </div>
      <div class="mg-process__nav">
        <button type="button" class="mg-process__arrow" data-dir="-1" aria-label="Previous stage">${arrow('M19 12H5M11 6l-6 6 6 6')}</button>
        <button type="button" class="mg-process__arrow" data-dir="1" aria-label="Next stage">${arrow('M5 12h14M13 6l6 6-6 6')}</button>
      </div>
    </div>`;

  let block = null;
  // Carousel state, in card steps: pos is where the row is now. Each of the 3N cards (three copies) is placed
  // on its own, wrapped round so it always sits within N steps before to 2N steps after pos. The row therefore
  // never runs out of cards however far it moves, by quick clicks or a long drag.
  const N = steps.length, GAP = 8, DURATION = 1200;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const M = 3 * N;
  let pos = 0, anim = null, drag = null, step = 0, cardW = 0, viewW = 0;

  function layout() {
    const vp = block.querySelector('.mg-process__viewport');
    viewW = vp.clientWidth;
    const visible = innerWidth >= 1200 ? 3 : innerWidth >= 810 ? 2 : 1;
    cardW = (viewW - GAP * (visible - 1)) / visible;
    step = cardW + GAP;
    const cards = block.querySelectorAll('.mg-pcard');
    cards.forEach(c => { c.style.width = cardW + 'px'; });
    // Cards are absolutely placed, so the track takes the tallest card's height.
    block.querySelector('.mg-process__track').style.height = Math.max(...[...cards].map(c => c.offsetHeight)) + 'px';
    render();
  }
  function render() {
    block.querySelectorAll('.mg-pcard').forEach((c, i) => {
      let rel = (((i - pos) % M) + M) % M;
      if (rel >= 2 * N) rel -= M;
      const x = rel * step;
      // How far past an edge the card is, as a share of one step (0 inside, 1 fully past).
      const left = Math.min(1, Math.max(0, -x / step));
      const right = Math.min(1, Math.max(0, (x + cardW - viewW) / step));
      const angle = left ? -90 * left : 90 * right;
      c.style.transformOrigin = left ? '100% 50%' : '0% 50%';
      c.style.transform = `translate3d(${x}px,0,0)${angle ? ` rotateY(${angle}deg)` : ''}`;
      c.style.visibility = left >= 1 || right >= 1 ? 'hidden' : '';
    });
  }
  function go(target) {
    if (reduce) { pos = target; render(); return; }
    const from = pos, start = performance.now();
    anim = { target };
    const frame = now => {
      if (!anim || anim.target !== target) return;
      const t = Math.min(1, (now - start) / DURATION);
      pos = from + (target - from) * easeOutExpo(t);
      render();
      if (t < 1) requestAnimationFrame(frame);
      else anim = null;
    };
    requestAnimationFrame(frame);
  }

  function update() {
    if (!block || !block.isConnected) return;
    // Headline lines darken once they pass 75% of the viewport height.
    block.querySelectorAll('.mg-pline').forEach(l => l.classList.toggle('is-lit', l.getBoundingClientRect().top < innerHeight * 0.75));
  }
  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };

  function mount() {
    const host = [...document.querySelectorAll('[data-framer-name="Process"]')].find(el => el.offsetParent !== null);
    if (!host || host.querySelector(':scope > .mg-process')) return;
    host.classList.add('mg-process-host');
    block = document.createElement('section');
    block.className = 'mg-process';
    block.id = 'process';
    block.innerHTML = html;
    pos = 0; anim = null;
    block.querySelectorAll('.mg-process__arrow').forEach(b => b.addEventListener('click', () => {
      // Clicks during a move stack onto its target, so quick taps advance several cards.
      go((anim ? anim.target : Math.round(pos)) + +b.dataset.dir);
    }));
    // Drag / swipe: the row follows the pointer, then eases to the nearest card in the swipe direction.
    const vp = block.querySelector('.mg-process__viewport');
    vp.addEventListener('pointerdown', e => {
      if (e.button) return;
      anim = null;
      drag = { x: e.clientX, pos, last: e.clientX, t: performance.now(), v: 0, moved: false };
    });
    addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) { drag.moved = true; vp.setPointerCapture?.(e.pointerId); vp.classList.add('is-dragging'); }
      const now = performance.now();
      drag.v = (e.clientX - drag.last) / Math.max(1, now - drag.t);
      drag.last = e.clientX; drag.t = now;
      pos = drag.pos - dx / step;
      render();
    });
    const release = () => {
      if (!drag) return;
      const { moved, v } = drag;
      drag = null;
      vp.classList.remove('is-dragging');
      if (!moved) return;
      // A flick moves one card in its direction; a slow drag settles on the nearest card.
      go(Math.abs(v) > 0.3 ? (v < 0 ? Math.ceil(pos) : Math.floor(pos)) : Math.round(pos));
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);
    host.appendChild(block);
    layout();
    update();
  }

  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => { if (block && block.isConnected) layout(); requestUpdate(); });
  const start = () => {
    mount();
    new MutationObserver(rafOnce(() => { if (!block || !block.isConnected) mount(); })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
