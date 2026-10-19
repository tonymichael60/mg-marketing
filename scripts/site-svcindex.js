// Services: sticky index + scroll-linked chapters (ported from the reference design).
// Replaces the Framer accordion in the Services section. Re-mounts if Framer re-renders.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const data = [
    { n: '01', tag: 'Performance Marketing', core: 'Core', h: 'Ads engineered for <i>profit,</i> not clicks.', p: 'We build acquisition systems around cost per customer and return on spend. Clean tracking, relentless testing and budget that follows the winners.', chips: ['Meta Ads', 'Google Search', 'YouTube', 'Retargeting', 'Conversion tracking'], feats: [['Tracking done right', 'Pixels, events and GA4 set up on day one so every rupee is measured.'], ['Creative testing', 'Hooks, formats and audiences tested weekly to push acquisition costs down.'], ['Smart retargeting', "Warm audiences brought back at the moment they're ready to buy."], ['Scale with confidence', 'Spend moves behind proven winners, guided by ROAS and CPA.']] },
    { n: '02', tag: 'Social Media', core: 'Core', h: 'A feed that feeds your <i>pipeline.</i>', p: 'Consistent, scroll-stopping presence on the platforms your customers actually live on, planned around business goals, not a template calendar.', chips: ['Instagram', 'Facebook', 'LinkedIn', 'YouTube Shorts', 'X'], feats: [['Platform strategy', 'A channel-by-channel plan built on audience research.'], ['Studio creative', 'Design, motion and captions crafted to hold attention.'], ['Community care', 'Replies, DMs and conversations that turn followers into fans.'], ['Monthly insights', "What grew, what didn't, and what we're doing next."]] },
    { n: '03', tag: 'AI Video Studio', core: 'Signature', h: 'Cinematic content at the <i>speed of AI.</i>', p: 'Ads, reels, explainers and brand films produced with AI-assisted workflows. Studio quality in days, not weeks, at a fraction of a traditional shoot.', chips: ['AI ads', 'Faceless reels', 'Explainers', 'Product demos', 'Brand films'], feats: [['Script to screen', 'Concept, storyboard, voice, edit and sound under one roof.'], ['Content engine', 'A steady stream of on-brand short-form, every week.'], ['Ad variations', 'Every cut in 9:16, 1:1 and 16:9, ready for testing.'], ['YouTube growth', 'Topics, titles and rhythm that build a real audience.']] },
    { n: '04', tag: 'Business Automation', core: 'Core', h: 'Let the systems do the <i>busywork.</i>', p: 'AI workflows and integrations that capture leads, follow up, report and remind, so your team spends its time on the work that grows the business.', chips: ['CRM', 'WhatsApp', 'Email flows', 'AI agents', 'Dashboards'], feats: [['Lead capture & routing', 'Every enquiry answered and assigned in seconds.'], ['Connected tools', 'Forms, CRM, calendar and payments talking to each other.'], ['AI assistants', 'Custom agents handling FAQs and routine tasks around the clock.'], ['Auto reporting', 'Live numbers without anyone building a spreadsheet.']] },
    { n: '05', tag: 'Brand Identity', h: 'A brand people <i>remember.</i>', p: 'Positioning, identity and collateral designed as one coherent system, so you look as good as the work you do.', chips: ['Logo & mark', 'Typography', 'Colour system', 'Guidelines', 'Pitch decks'] },
    { n: '06', tag: 'Web Design & Build', h: 'Websites that <i>convert</i> the traffic we send.', p: 'Fast, beautiful, conversion-first websites and landing pages, built to load in a blink and turn visitors into enquiries.', chips: ['Landing pages', 'Business sites', 'E-commerce', 'CRO', 'Analytics'] },
    { n: '07', tag: 'SEO & AEO', h: 'Be the answer, not just a <i>result.</i>', p: 'People now ask AI before they search. We structure your content so ChatGPT, Perplexity and Google AI Overviews understand, trust and cite you, on top of solid classic SEO.', chips: ['Answer engine optimisation', 'Technical SEO', 'Local SEO', 'Content', 'Authority'] },
    { n: '08', tag: 'Conversion Copy', h: 'Words that <i>sell</i> while you sleep.', p: 'Landing pages, email sequences, ad hooks and scripts written for human psychology, not algorithms.', chips: ['Landing copy', 'Email flows', 'Ad hooks', 'Video scripts', 'Lead magnets'] },
  ];

  function chapterHTML(d) {
    const feats = d.feats ? `<div class="mg-feats">${d.feats.map((f, i) => `<div class="mg-feat"><b><em>0${i + 1}</em>${esc(f[0])}</b><p>${esc(f[1])}</p></div>`).join('')}</div>` : '';
    const pill = d.core ? `<span class="mg-chapter__pill">✦ ${d.core}</span>` : '';
    return `<article class="mg-chapter">
      <div class="mg-chapter__top"><span>${d.n} / 08 · ${esc(d.tag)}</span>${pill}</div>
      <div class="mg-chapter__num">${d.n}</div>
      <h3>${d.h}</h3>
      <p>${esc(d.p)}</p>
      <div class="mg-chips">${d.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>
      ${feats}
    </article>`;
  }
  function buildHTML() {
    const items = data.map(d => `<li><a><span>${d.n}</span>${esc(d.tag)}</a></li>`).join('');
    const chapters = data.map(chapterHTML).join('');
    return `
      <div class="mg-svcx__head">
        <div>
          <span class="mg-svcx__eyebrow">Services</span>
          <h2>One studio. <i>Every lever</i> of growth.</h2>
        </div>
        <p class="mg-svcx__lead">Think of us as your in-house growth team, without the overhead. Eight disciplines working to one plan, led by performance, content and automation.</p>
      </div>
      <div class="mg-svcx__grid">
        <aside class="mg-svcx__index">
          <ol><i class="mg-svcx__rail"></i>${items}</ol>
          <div class="mg-svcx__foot"><span class="mg-svcx__count">01 / 08</span><span>Core ✦</span></div>
        </aside>
        <div class="mg-svcx__chapters">${chapters}</div>
      </div>`;
  }

  let block = null, ctx = null, ticking = false, io = null;
  function update() {
    ticking = false;
    if (!ctx || !block || !block.isConnected) return;
    const { wrap, rail, links, chapters, count } = ctx;
    const r = wrap.getBoundingClientRect();
    rail.style.setProperty('--sr', clamp((innerHeight * .5 - r.top) / r.height, 0, 1).toFixed(3));
    let idx = 0;
    chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) idx = i; });
    links.forEach((a, i) => a.classList.toggle('is-active', i === idx));
    if (count) count.textContent = String(idx + 1).padStart(2, '0') + ' / 08';
    if (!reduce) chapters.forEach(c => {
      if (!c.classList.contains('is-in')) return;
      const b = c.getBoundingClientRect(), p = clamp(-b.top / b.height, 0, 1);
      c.style.transform = p > 0 ? `scale(${1 - p * .05})` : '';
      c.style.opacity = p > 0 ? String(1 - p * .4) : '';
    });
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  function mount() {
    const host = document.querySelector('.framer-7u2uc9');
    if (!host || host.querySelector(':scope > .mg-svcx')) return;
    host.classList.add('mg-svc-host');
    block = document.createElement('div');
    block.className = 'mg-svcx';
    block.innerHTML = buildHTML();
    host.appendChild(block);
    const chapters = [...block.querySelectorAll('.mg-chapter')];
    const links = [...block.querySelectorAll('.mg-svcx__index a')];
    ctx = { wrap: block.querySelector('.mg-svcx__chapters'), rail: block.querySelector('.mg-svcx__rail'), links, chapters, count: block.querySelector('.mg-svcx__count') };
    links.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); chapters[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }));
    if (!io) io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); o.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    chapters.forEach(c => io.observe(c));
    update();
  }

  // Scrolling services marquee band, inserted just above the About section.
  function mountMarquee() {
    if (document.querySelector('.mg-svc-marquee-band')) return;
    const about = document.querySelector('[data-framer-name="About"]');
    if (!about || !about.parentNode) return;
    const marq = data.map(d => `<span>${esc(d.tag)}</span>`).join('');
    const band = document.createElement('div');
    band.className = 'mg-svc-marquee-band';
    band.setAttribute('aria-hidden', 'true');
    band.innerHTML = `<div class="mg-svc-marquee"><div class="mg-svc-marquee__track">${marq}${marq}</div></div>`;
    about.parentNode.insertBefore(band, about);
  }

  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  const start = () => {
    mount(); mountMarquee();
    new MutationObserver(rafOnce(() => {
      if (!block || !block.isConnected) mount();
      mountMarquee();
    })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
