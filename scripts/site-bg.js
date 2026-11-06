// Page background: one long gradient down the page, deep navy at the top and lighter blue section by
// section, each section with its own shade. Section heights differ by device and change while Framer
// hydrates, so the colour stops are placed at each section's measured top and re-placed when the page resizes.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const stops = [
    ['[data-framer-name="Hero"]', '#040a2c'],
    ['.mg-svc-marquee-band', '#060e3a'],
    ['#about', '#0a1650'],
    ['.framer-19b0sxl', '#0d1b62'],
    ['.mg-svcx', '#0f1f6e'],
    ['.mg-svcx__grid', '#132585'],
    ['#process', '#b4c2ff'],
    ['#works', '#c6d0ff'],
    ['.mg-perf', '#b9c6ff'],
    ['[data-framer-name="Benefits"]', '#ccd5ff'],
    ['.framer-gtsbnt', '#bfcbff'],
    ['[data-framer-name="Tools"]', '#d3dbff'],
    ['.mg-iwork', '#c5d0ff'],
    ['.framer-1ynxxm3', '#d8dfff'],
    ['[data-framer-name="FAQ"]', '#cbd5ff'],
    ['#contact', '#dbe2ff'],
  ];
  const visible = sel => [...document.querySelectorAll(sel)].find(e => e.getBoundingClientRect().height > 0);
  function paint() {
    const H = document.documentElement.scrollHeight;
    const parts = [];
    let last = -1;
    for (const [sel, colour] of stops) {
      const el = visible(sel);
      if (!el) continue;
      const top = Math.round(el.getBoundingClientRect().top + scrollY);
      if (top <= last) continue;
      parts.push(`${colour} ${top}px`);
      last = top;
    }
    parts.push(`#e4e9ff ${H}px`);
    document.documentElement.style.backgroundImage = `linear-gradient(180deg, ${parts.join(', ')})`;
  }
  const schedule = rafOnce(paint);
  const start = () => {
    paint();
    new ResizeObserver(schedule).observe(document.body);
    addEventListener('resize', schedule);
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
