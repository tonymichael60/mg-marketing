// MediaGroots site behaviour: section colours, side index, reveals, rotating words, and the scroll-driven
// pinned sections (services list, featured work, clients wheel, fanned cards). One rAF loop runs while the
// page scrolls; pinned sections ease towards their scroll position so motion stays smooth.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;

  // Progress through a pinned section: 0 when its top reaches the viewport top, 1 when its bottom does.
  const progress = el => { const r = el.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 0; };

  /* Section colours and side index */
  const sections = $$('.sec');
  const indexList = $('.index ol');
  indexList.innerHTML = sections.map((s, i) => `<li>${i + 1}<span>${s.dataset.label}</span></li>`).join('');
  const indexItems = $$('li', indexList);
  let activeSection = -1;
  function setSection(i) {
    if (i === activeSection) return;
    activeSection = i;
    const s = sections[i];
    body.dataset.fg = s.dataset.fg;
    body.dataset.section = s.id;
    const [a1, a2, a3] = s.dataset.aura.split(',');
    body.style.setProperty('--a1', a1); body.style.setProperty('--a2', a2); body.style.setProperty('--a3', a3);
    indexItems.forEach((li, j) => li.classList.toggle('is-on', j === i));
  }

  // Page gradient: each section holds its own colour from its top until the last 30% of a screen above its
  // bottom, then blends into the next section's colour.
  function paintBg() {
    const H = document.documentElement.scrollHeight, blend = innerHeight * 0.3;
    const stops = sections.flatMap(s => {
      const r = s.getBoundingClientRect(), top = Math.round(r.top + scrollY), hold = Math.round(Math.max(top, r.bottom + scrollY - blend));
      return [`${s.dataset.bg} ${top}px`, `${s.dataset.bg} ${hold}px`];
    });
    document.documentElement.style.backgroundImage = `linear-gradient(180deg, ${stops.join(', ')}, ${sections.at(-1).dataset.bg} ${H}px)`;
  }
  paintBg();
  addEventListener('resize', paintBg);
  addEventListener('load', paintBg);

  /* Rotating words */
  for (const r of $$('.rotator')) {
    const words = r.dataset.words.split('|');
    let k = 0;
    if (reduce) continue;
    setInterval(() => {
      r.classList.remove('is-swap'); void r.offsetWidth; r.classList.add('is-swap');
      setTimeout(() => { k = (k + 1) % words.length; r.textContent = words[k]; }, 420);
    }, 2600);
  }

  /* Menu */
  const menuBtn = $('.top__menu'), menu = $('#menu');
  const setMenu = open => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open); menuBtn.lastChild.textContent = open ? 'Close' : 'Menu'; };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  /* Measure list: hovering a row blurs the others */
  const measure = $('.measure__list');
  $$('li', measure).forEach(li => {
    li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') measure.classList.add('has-focus'); });
    li.addEventListener('pointerleave', () => measure.classList.remove('has-focus'));
  });

  /* Pinned sections */
  const svc = $('.services'), svcItems = $$('.services__list li'), svcGroups = $$('.services__group');
  const work = $('.work'), workSets = ['.work__titles h3', '.work__media img', '.work__tags ul', '.work__thumbs li'].map(s => $$(s));

  /* Work stepping: while the Work section is pinned, one scroll gesture (wheel, trackpad or swipe) moves
     exactly one project and waits for the water transition to finish. Before the first project and after
     the last one, scrolling carries on normally. */
  const workCount = workSets[0].length;
  const workSpan = () => work.offsetHeight - innerHeight;
  const workTop = () => work.getBoundingClientRect().top + scrollY;
  // Each project owns an equal slice of the section's scroll; it is shown from the middle of its slice.
  const workY = i => workTop() + workSpan() * (i + 0.5) / workCount;
  const workIndex = () => Math.min(workCount - 1, Math.floor(progress(work) * workCount));
  const workPinned = () => { const r = work.getBoundingClientRect(); return r.top <= 1 && r.bottom >= innerHeight - 1; };
  let stepLock = 0;
  // Returns true when the gesture was used to step (so the page should not scroll by itself).
  function workStep(dir) {
    if (!workPinned()) return false;
    const i = workIndex(), next = i + dir;
    if (next < 0 || next >= workCount) return false;
    if (performance.now() < stepLock) return true;
    stepLock = performance.now() + 1300;
    scrollTo({ top: workY(next), behavior: reduce ? 'auto' : 'smooth' });
    return true;
  }
  addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) < 2) return;
    if (workStep(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
  }, { passive: false });
  let touchY = null, touchUsed = false;
  addEventListener('touchstart', e => { touchY = e.touches[0].clientY; touchUsed = false; }, { passive: true });
  addEventListener('touchmove', e => {
    if (touchY === null) return;
    const dy = touchY - e.touches[0].clientY;
    if (!workPinned()) return;
    const dir = dy > 0 ? 1 : -1, next = workIndex() + dir;
    if (next < 0 || next >= workCount) return;
    e.preventDefault();
    if (!touchUsed && Math.abs(dy) > 30) { touchUsed = true; workStep(dir); }
  }, { passive: false });
  addEventListener('touchend', () => { touchY = null; });
  const clients = $('.clients'), clientNames = $$('.clients__names a'), clientLogos = $$('.clients__logos img');
  const method = $('.method'), methodTitle = $('.method__title'), mFrames = $$('.frame'), mTexts = $$('.method__text'), mRoll = $('.method__num-roll'), mNum = $('.method__num');
  const build = $('.build'), buildRow = $('.build__row'), cards = $$('.card');
  let svcHalf = null;
  addEventListener('resize', () => { svcHalf = null; });
  const eased = { svc: 0, clients: 0, method: -0.6 };
  const ease = (key, target, k = 0.14) => { eased[key] = reduce ? target : eased[key] + (target - eased[key]) * k; if (Math.abs(target - eased[key]) < 0.001) eased[key] = target; return eased[key] !== target; };

  // Clicking a client name rolls the wheel to it.
  clientNames.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    const r = clients.getBoundingClientRect(), span = r.height - innerHeight;
    scrollTo({ top: scrollY + r.top + span * i / (clientNames.length - 1), behavior: reduce ? 'auto' : 'smooth' });
  }));

  function frame() {
    ticking = false;
    let again = false;

    // Active section: the one under the middle of the screen.
    const mid = innerHeight * 0.5;
    sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) setSection(i); });

    // Reveals
    for (const el of $$('[data-reveal]:not(.is-in)')) if (el.getBoundingClientRect().top < innerHeight * 0.88) el.classList.add('is-in');

    // Services: the list slides up; the centred discipline is full strength, its group label lit.
    // Services track the scroll closely (light smoothing only), so the list never trails behind the page.
    again = ease('svc', progress(svc) * (svcItems.length - 1), 0.45) || again;
    // Item heights are measured once (and again after a resize), never while the items are being moved.
    if (!svcHalf) svcHalf = svcItems.map(li => li.offsetHeight / 2);
    const step = innerWidth < 760 ? 52 : Math.min(120, innerWidth * 0.075);
    let svcActive = 0;
    svcItems.forEach((li, i) => {
      const d = i - eased.svc, a = Math.abs(d);
      li.style.transform = `translate3d(0, ${(d * step - svcHalf[i]).toFixed(1)}px, 0)`;
      li.style.opacity = a > 3.5 ? 0 : String(Math.max(0.12, 1 - a * 0.32));
      if (a < 0.5) svcActive = i;
    });
    svcGroups.forEach((g, i) => g.classList.toggle('is-on', +svcItems[svcActive].dataset.group === i));

    // Featured work: one project per quarter of the scroll.
    const wi = Math.min(workSets[0].length - 1, Math.floor(progress(work) * workSets[0].length));
    workSets.forEach(set => set.forEach((el, i) => el.classList.toggle('is-on', i === wi)));
    window.mgWater?.show(wi);

    // Method: s runs from -0.6 (heading only) to the last stage. Each stage's panels drift from below the
    // screen to above it while d = s - i goes from -0.8 to 1; the echo panel moves faster and further right.
    again = ease('method', progress(method) * (mTexts.length - 0.4) - 0.6) || again;
    const ms = eased.method, vh = innerHeight;
    methodTitle.style.opacity = clamp(-ms * 2.2, 0, 1);
    methodTitle.style.transform = `translateY(${Math.min(0, ms + 0.45) * -60}px)`;
    // At d = 0 the main panel is centred (lower on phones, under the text); the echo trails below it.
    const centre = innerWidth < 760 ? 0.66 : 0.5;
    mFrames.forEach(f => {
      const d = ms - +f.dataset.i, echo = f.classList.contains('frame--echo');
      const y = vh * (centre + (echo ? 0.22 : 0)) - f.offsetHeight / 2 - d * vh * (echo ? 1.25 : 0.95);
      f.style.transform = `translate3d(0, ${y}px, 0)`;
      f.style.visibility = d < -1.2 || d > 1.5 ? 'hidden' : '';
    });
    mTexts.forEach((t, i) => { const d = ms - i; t.style.opacity = clamp(1 - Math.abs(d) * 2.2, 0, 1); t.style.transform = `translateY(${-d * 30}px)`; });
    const mi = clamp(Math.round(ms), 0, mTexts.length - 1);
    mRoll.style.transform = `translateY(${-mi * mNum.offsetHeight}px)`;
    mRoll.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
    mNum.style.opacity = clamp((ms + 0.3) * 3, 0, 1);

    // Clients wheel: names are spokes from a hub off to the left; the centred one is level and bright.
    again = ease('clients', progress(clients) * (clientNames.length - 1)) || again;
    const radius = innerWidth < 760 ? 240 : Math.max(420, innerWidth * 0.34);
    clientNames.forEach((n, i) => {
      const d = i - eased.clients, a = Math.abs(d);
      n.style.transformOrigin = `${-radius}px 50%`;
      n.style.transform = `rotate(${d * 13}deg)`;
      n.style.opacity = a > 4 ? 0 : String(Math.max(0.12, 1 - a * (d < 0 ? 0.22 : 0.3)));
    });
    const ci = Math.round(eased.clients);
    clientLogos.forEach((img, i) => img.classList.toggle('is-on', i === ci));

    // Fanned cards: the row drifts left; each card turns and tips by its distance from the centre.
    const bp = progress(build);
    const travel = buildRow.scrollWidth - innerWidth * 0.5 + 120;
    buildRow.style.transform = `translate3d(${-bp * travel}px, 0, 0)`;
    const cx = innerWidth / 2;
    cards.forEach(c => {
      const r = c.getBoundingClientRect(), off = clamp((r.left + r.width / 2 - cx) / innerWidth, -1, 1);
      c.style.transform = `rotateY(${off * -38}deg) rotateZ(${off * 5}deg) translateZ(${-Math.abs(off) * 220}px)`;
    });

    if (again) request();
  }
  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();
})();
