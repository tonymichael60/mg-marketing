// Process section (after overtake-wbs.framer.website, "Where should your next dollar work?"): a list of the
// Groot Method stages on the left; clicking one boxes it and cross-fades its illustration and description in
// on the right. Replaces the Framer slideshow. Framer can re-render its section, so the block is re-mounted
// whenever it goes missing.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const check = icon('<path d="M5 12.5l4.2 4.2L19 7"/>');
  const steps = [
    {
      n: '01', title: 'Root', days: '3-7 days',
      text: 'Align on problems, data reality, and success metrics. Opportunity brief, KPI model, phased roadmap, effort/cost ranges.',
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
      text: 'We build the growth engine: funnels, campaigns, AI content, and smart automations that seamlessly tie it together.',
      // Build: a lead travels funnel -> campaign -> automation.
      visual: `<div class="mgv mgv-flow"><div class="mgv-nodes"><span class="mgv-track"></span>
        <span class="mgv-node">${icon('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>')}</span>
        <span class="mgv-node mgv-node--up">${icon('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</span>
        <span class="mgv-node">${icon('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>')}</span>
      </div><div class="mgv-chips">${['Funnels', 'Campaigns', 'AI content', 'Automations'].map(t => `<span class="mgv-chip">${t}</span>`).join('')}</div></div>`,
    },
    {
      n: '03', title: 'Validate & Evals', days: '1 week',
      text: 'Prove accuracy, usability, safety, and cost. Eval dashboard, acceptance thresholds, decision to iterate/ship.',
      // Evals: each check ticks in turn, then the ship decision lights up.
      visual: `<div class="mgv mgv-evals"><div class="mgv-checks">${['Accuracy', 'Usability', 'Safety', 'Cost'].map(t => `<span class="mgv-chip"><i class="mgv-tick">${check}</i>${t}</span>`).join('')}</div>
        <span class="mgv-ship">${icon('<path d="M4 15l8-11 8 11"/><path d="M12 4v16"/>')}Ready to ship</span></div>`,
    },
  ];
  const esc = s => s.replace(/&/g, '&amp;');
  const html = `
    <div class="mg-process__grid">
      <div class="mg-process__intro">
        <span class="mg-process__tag">Process</span>
        <h2>From Idea<br>to Production</h2>
        <div class="mg-process__list" role="tablist" aria-label="Groot Method stages">${steps.map((s, i) => `
          <button type="button" class="mg-pstep${i ? '' : ' is-on'}" role="tab" id="mg-pstep-${i}" aria-controls="mg-ppanel" aria-selected="${!i}" tabindex="${i ? -1 : 0}"><small>${s.n}</small>${esc(s.title)}</button>`).join('')}
        </div>
      </div>
      <div class="mg-process__panel" id="mg-ppanel" role="tabpanel" aria-labelledby="mg-pstep-0" aria-live="polite">
        <div class="mg-process__stage">${steps.map((s, i) => `<div class="mg-process__visual${i ? '' : ' is-on'}" aria-hidden="true">${s.visual}</div>`).join('')}</div>
        ${steps.map((s, i) => `<div class="mg-process__copy${i ? '' : ' is-on'}"${i ? ' hidden' : ''}><span class="mg-process__days">${s.days}</span><p>${s.text}</p></div>`).join('')}
      </div>
    </div>`;

  let block = null;
  function select(i) {
    block.querySelectorAll('.mg-pstep').forEach((b, j) => { b.classList.toggle('is-on', i === j); b.setAttribute('aria-selected', i === j); b.tabIndex = i === j ? 0 : -1; });
    block.querySelectorAll('.mg-process__visual').forEach((v, j) => v.classList.toggle('is-on', i === j));
    block.querySelectorAll('.mg-process__copy').forEach((c, j) => { c.classList.toggle('is-on', i === j); c.hidden = i !== j; });
    block.querySelector('.mg-process__panel').setAttribute('aria-labelledby', `mg-pstep-${i}`);
  }
  function mount() {
    const host = [...document.querySelectorAll('[data-framer-name="Process"]')].find(el => el.offsetParent !== null);
    if (!host || host.querySelector(':scope > .mg-process')) return;
    host.classList.add('mg-process-host');
    block = document.createElement('section');
    block.className = 'mg-process';
    block.id = 'process';
    block.innerHTML = html;
    const tabs = [...block.querySelectorAll('.mg-pstep')];
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', e => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const next = (i + d + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });
    host.appendChild(block);
  }

  const start = () => {
    mount();
    new MutationObserver(rafOnce(() => { if (!block || !block.isConnected) mount(); })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
