// Process section: replaces the Framer slideshow with a pinned, scroll-drawn route (the "Groot Method").
// Framer can re-render its section, so the block is re-mounted whenever it goes missing.
(() => {
  const steps = [
    ['01', 'Root', '3-7 DAYS', 'Align on problems, data reality, and success metrics. Opportunity brief, KPI model, phased roadmap, effort/cost ranges.'],
    ['02', 'Grow', '1-2 WEEKS', 'We build the growth engine: funnels, campaigns, AI content, and smart automations that seamlessly tie it together.'],
    ['03', 'Validate & Evals', '1 WEEK', 'Prove accuracy, usability, safety, and cost. Eval dashboard, acceptance thresholds, decision to iterate/ship.'],
  ];
  const route = 'M60 510 C 180 520, 200 380, 300 350 S 420 300, 440 210 S 520 60, 560 50';
  const nodes = [[60, 510, 96, 546, '01 ROOT'], [300, 350, 196, 316, '02 GROW'], [560, 50, 380, 30, '03 VALIDATE']];
  const html = `
    <div class="mg-process__pin"><div class="mg-process__grid">
      <div>
        <span class="mg-process__tag">Process</span>
        <h2>From Idea<br>to Production</h2>
        <div class="mg-process__stage">Stage <span data-stage>01</span> / 03</div>
        <div class="mg-process__steps">${steps.map(([n, title, days, text], i) => `
          <div class="mg-step${i ? '' : ' is-on'}"><div class="mg-step__head"><h4><small>${n}</small>${title.replace('&', '&amp;')}</h4><span class="mg-step__days">${days}</span></div><p>${text}</p></div>`).join('')}
        </div>
      </div>
      <div class="mg-process__path" aria-hidden="true">
        <svg viewBox="0 0 600 570">
          <defs><linearGradient id="mg-route-gradient" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#0e15a8"/><stop offset="1" stop-color="#4b5cff"/></linearGradient></defs>
          <path class="track" d="${route}"/>
          <path class="draw" d="${route}"/>
          ${nodes.map(([cx, cy, tx, ty, label], i) => `<g class="node${i ? '' : ' is-on'}"><circle class="ring" cx="${cx}" cy="${cy}" r="22"/><circle class="core" cx="${cx}" cy="${cy}" r="8"/><text x="${tx}" y="${ty}">${label}</text></g>`).join('')}
        </svg>
        <div class="mg-process__head"></div>
      </div>
    </div></div>`;

  let block = null;
  function mount() {
    const host = [...document.querySelectorAll('[data-framer-name="Process"]')].find(el => el.offsetParent !== null);
    if (!host || host.querySelector(':scope > .mg-process')) return;
    host.classList.add('mg-process-host');
    block = document.createElement('section');
    block.className = 'mg-process';
    block.id = 'process';
    block.innerHTML = html;
    host.appendChild(block);
    update();
  }

  function update() {
    if (!block || !block.isConnected) return;
    const draw = block.querySelector('.draw');
    const stepEls = block.querySelectorAll('.mg-step');
    if (innerWidth < 810) { stepEls.forEach(s => s.classList.add('is-on')); return; }
    const len = draw.getTotalLength();
    const r = block.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    draw.style.strokeDasharray = len;
    draw.style.strokeDashoffset = len * (1 - p);
    const pt = draw.getPointAtLength(len * p);
    const svg = block.querySelector('svg'), box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    block.querySelector('.mg-process__head').style.transform = `translate(${pt.x * box.width / vb.width}px,${pt.y * box.height / vb.height}px)`;
    let stage = 0;
    [0, 0.45, 0.9].forEach((s, i) => { if (p >= s - 0.02) stage = i; });
    block.querySelectorAll('.node').forEach((n, i) => n.classList.toggle('is-on', i <= stage));
    stepEls.forEach((s, i) => s.classList.toggle('is-on', i === stage));
    block.querySelector('[data-stage]').textContent = String(stage + 1).padStart(2, '0');
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
