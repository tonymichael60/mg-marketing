// Performance section (ported from the reference file): "Measure what pays the bills" + old-vs-new
// comparison + 4 KPI cards. Inserted above the Benefits section. Re-mounts if Framer re-renders.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const oldItems = ['Likes', 'Impressions', 'Followers', 'Reach'];
  const newItems = ['Revenue', 'Cost per acquisition', 'Return on ad spend', 'Qualified leads'];
  const list = [
    ['01', 'Live KPI dashboards', 'The handful of numbers your business actually runs on, always up to date.'],
    ['02', 'Honest monthly reports', "What moved, why it moved, and what we're doing next."],
    ['03', 'Full-funnel attribution', 'Every channel traced back to leads, sales and revenue.'],
    ['04', 'Data-led decisions', "Budget and effort shift to what works, away from what doesn't."],
  ];
  function html() {
    return `
      <span class="mg-perf__eyebrow" data-rev>Performance</span>
      <div class="mg-perf__box">
        <h2 data-rev>Measure what <i>pays the bills.</i></h2>
        <p class="mg-perf__lead" data-rev>Likes don't pay salaries. We report on revenue, cost per customer and return on spend, in plain language, every month.</p>
        <div class="mg-versus">
          <div class="mg-vs mg-vs--old" data-rev><h5>What most agencies report</h5><ul>${oldItems.map((t, i) => `<li style="--i:${i}">${esc(t)}</li>`).join('')}</ul></div>
          <div class="mg-vs-mid" data-rev><span>vs</span></div>
          <div class="mg-vs mg-vs--new" data-rev><h5>What we measure</h5><ul>${newItems.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
        </div>
        <div class="mg-perf__list">${list.map(([n, b, p]) => `<div class="mg-perf__item" data-rev><em>${n}</em><b>${esc(b)}</b><p>${esc(p)}</p></div>`).join('')}</div>
      </div>`;
  }
  let io = null;
  function mount() {
    if (document.querySelector('.mg-perf')) return;
    const anchor = document.querySelector('[data-framer-name="Benefits"]');
    if (!anchor || !anchor.parentNode) return;
    const sec = document.createElement('section');
    sec.className = 'mg-perf';
    sec.id = 'performance';
    sec.innerHTML = html();
    anchor.parentNode.insertBefore(sec, anchor);
    if (!io) io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); o.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    sec.querySelectorAll('[data-rev]').forEach(el => io.observe(el));
  }
  const start = () => {
    mount();
    new MutationObserver(rafOnce(() => { if (!document.querySelector('.mg-perf')) mount(); })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
