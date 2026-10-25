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
  const light = $('.light');
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  // keepBg: a glide is blending the background itself.
  function setSection(i, keepBg) {
    if (i === activeSection) return;
    activeSection = i;
    const s = sections[i];
    body.dataset.fg = s.dataset.fg;
    body.dataset.section = s.id;
    if (!keepBg) document.documentElement.style.backgroundColor = s.dataset.bg;
    const [a1, a2, a3] = s.dataset.aura.split(',');
    body.style.setProperty('--a1', a1); body.style.setProperty('--a2', a2); body.style.setProperty('--a3', a3);
    indexItems.forEach((li, j) => li.classList.toggle('is-on', j === i));
  }


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
  const build = $('.build'), buildRow = $('.build__row'), cards = $$('.card');
  const work = $('.work'), workSets = ['.work__titles h3', '.work__media img', '.work__tags ul', '.work__thumbs li'].map(s => $$(s));

  /* Page stepping: one scroll gesture (wheel, trackpad, swipe or key) glides to the next stop with our own eased
     scroll, so the pinned animations and the background colour change move in step with it. Stops are each
     section's top, every step in the pinned sections (projects, method stages, clients), and about a screen at
     a time through sections taller than the screen. Services scroll freely between their first and last
     discipline; What we build is a single glide from the first card to the last. Stops are worked out on each
     gesture, so they stay right after resizes or opened FAQ answers. */
  const workCount = workSets[0].length;
  const pinnedStops = {
    // Progress points (0..1 through the section's scroll span) where the page settles.
    services: () => [0, 1],
    work: () => Array.from({ length: workCount }, (_, i) => (i + 0.5) / workCount),
    method: () => { const n = $$('.method__text').length; return [0, ...Array.from({ length: n }, (_, i) => (i + 0.6) / (n - 0.4))]; },
    clients: () => $$('.clients__names a').map((_, i, a) => i / (a.length - 1)),
    build: () => [0, 1],
  };
  const secTop = sec => sec.getBoundingClientRect().top + scrollY;
  function stops() {
    const out = [];
    for (const sec of [work]) {
      const top = secTop(sec), span = sec.offsetHeight - innerHeight;
      const steps = pinnedStops[sec.id];
      if (steps) out.push(...steps().map(p => top + span * p));
      else {
        out.push(top);
        for (let y = top + innerHeight * 0.85; y < top + span - 40; y += innerHeight * 0.85) out.push(y);
        if (span > 40) out.push(top + span);
      }
    }
    return [...new Set(out.map(Math.round))].sort((x, y) => x - y);
  }
  // The page scrolls normally everywhere except while Work is pinned: there one gesture moves one project, and
  // past the first or last project the page goes back to normal scrolling.
  function inFreeZone(y, dir) {
    const top = secTop(work), span = work.offsetHeight - innerHeight;
    if (y < top - 4 || y > top + span + 4) return true;
    const first = top + span * 0.5 / workCount, last = top + span * (workCount - 0.5) / workCount;
    return dir > 0 ? y >= last - 4 : y <= first + 4;
  }
  let gliding = null, stepLock = 0;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function glide(target, duration) {
    const from = scrollY, start = performance.now();
    // The background and section state switch to the destination as the glide starts, so the colour fades
    // across the move instead of a band of the next colour creeping in at the edge.
    const dest = sections.findIndex(s => { const t = secTop(s); return target + innerHeight / 2 >= t && target + innerHeight / 2 < t + s.offsetHeight; });
    // Background colour and the Clients light are blended by the glide's own progress (not a CSS timer), so the
    // colour changes exactly as fast as the content moves.
    const html = document.documentElement, fromSec = sections[activeSection], toSec = sections[dest] || fromSec;
    const c0 = hexRgb(fromSec.dataset.bg), c1 = hexRgb(toSec.dataset.bg);
    const l0 = fromSec.id === 'clients' ? 1 : 0, l1 = toSec.id === 'clients' ? 1 : 0;
    html.style.transition = 'none'; light.style.transition = 'none';
    if (dest >= 0) setSection(dest, true);
    gliding = { dest };
    const step = now => {
      const k = Math.min(1, (now - start) / duration), e = easeInOut(k);
      scrollTo({ top: from + (target - from) * e, behavior: 'instant' });
      html.style.backgroundColor = `rgb(${c0.map((v, i) => Math.round(v + (c1[i] - v) * e)).join(',')})`;
      light.style.opacity = l0 + (l1 - l0) * e;
      // Update the pinned animations in this same frame, so they never trail the scroll by a frame.
      frame();
      if (k < 1) requestAnimationFrame(step);
      else { gliding = null; html.style.transition = ''; light.style.transition = ''; light.style.opacity = ''; }
    };
    requestAnimationFrame(step);
    // Swallow the rest of the gesture (trackpad inertia keeps sending wheel events after the glide).
    stepLock = performance.now() + duration + 350;
  }
  function pageStep(dir) {
    if (!menu.hidden) return false;
    // While a step is held, events that keep arriving (a long flick or trackpad inertia) extend the hold, so one
    // gesture can never move two steps.
    if (gliding || performance.now() < stepLock) { stepLock = Math.max(stepLock, performance.now() + 300); return true; }
    const y = scrollY;
    if (inFreeZone(y, dir)) return false;
    const list = stops();
    const target = dir > 0 ? list.find(v => v > y + 4) : [...list].reverse().find(v => v < y - 4);
    if (target === undefined) return false;
    if (reduce) { scrollTo({ top: target, behavior: 'instant' }); return true; }
    // The card row in What we build gets a longer glide so the cards can be seen passing.
    const long = [secTop(build), secTop(build) + build.offsetHeight - innerHeight].some(v => Math.abs(v - y) < 6) && Math.abs(target - y) > innerHeight * 1.5;
    glide(target, long ? 2200 : Math.min(1300, 700 + Math.abs(target - y) * 0.25));
    return true;
  }
  /* Section pause: with normal scrolling, a wheel or trackpad gesture that would carry the page past the start
     of a section stops exactly at that start and holds for a moment (the rest of the gesture, including trackpad
     inertia, is ignored). The next gesture scrolls on normally. */
  const PAUSE = 700;
  let pauseUntil = 0, pauseHold = 0, pausedAt = null, lastWheel = 0;
  function sectionPause(e) {
    const now = performance.now(), gap = now - lastWheel;
    lastWheel = now;
    if (now < pauseUntil) {
      // Still inside the gesture that hit the boundary: keep holding while its events keep arriving.
      // The hold counts from the end of the gesture: continuing events push it out by the full pause.
      if (gap < 120) pauseUntil = Math.max(pauseUntil, now + pauseHold);
      return true;
    }
    const y = scrollY, dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const tops = sections.map(sec => Math.round(secTop(sec))).filter(t => t > 0);
    const hit = dy > 0 ? tops.find(t => t > y + 1 && t <= y + dy) : [...tops].reverse().find(t => t < y - 1 && t >= y + dy);
    if (hit === undefined || hit === pausedAt) return false;
    pausedAt = hit;
    scrollTo({ top: hit, behavior: 'instant' });
    // A section can ask for a longer hold (data-pause, in ms), e.g. Results, which is easy to scroll past.
    const sec = sections.find(s2 => Math.round(secTop(s2)) === hit);
    pauseHold = +sec?.dataset.pause || PAUSE;
    pauseUntil = now + pauseHold;
    return true;
  }
  addEventListener('scroll', () => { if (pausedAt !== null && Math.abs(scrollY - pausedAt) > innerHeight * 0.5) pausedAt = null; }, { passive: true });
  addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaY) < 2) return;
    // A pause in progress holds everything, including the Work steps.
    if (performance.now() < pauseUntil && sectionPause(e)) { e.preventDefault(); return; }
    if (pageStep(e.deltaY > 0 ? 1 : -1)) { e.preventDefault(); return; }
    if (!reduce && menu.hidden && sectionPause(e)) e.preventDefault();
  }, { passive: false });
  let touchY = null, touchUsed = false, touchFree = false;
  addEventListener('touchstart', e => { touchY = e.touches[0].clientY; touchUsed = false; touchFree = false; }, { passive: true });
  addEventListener('touchmove', e => {
    if (touchY === null || !menu.hidden || touchFree) return;
    const dy = touchY - e.touches[0].clientY, dir = dy > 0 ? 1 : -1;
    if (!touchUsed && Math.abs(dy) < 8) return;
    if (!touchUsed && !gliding && inFreeZone(scrollY, dir)) { touchFree = true; return; }
    e.preventDefault();
    if (!touchUsed && Math.abs(dy) > 30) { touchUsed = true; pageStep(dir); }
  }, { passive: false });
  addEventListener('touchend', () => { touchY = null; });
  addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const dir = { ArrowDown: 1, PageDown: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (dir && pageStep(dir)) e.preventDefault();
  });
  const clients = $('.clients'), clientNames = $$('.clients__names a'), clientLogos = $$('.clients__logos img');
  const method = $('.method'), methodTitle = $('.method__title'), mFrames = $$('.frame'), mTexts = $$('.method__text'), mRoll = $('.method__num-roll'), mNum = $('.method__num');
  let svcHalf = null;
  addEventListener('resize', () => { svcHalf = null; });
  const eased = { svc: 0, clients: 0, method: -0.6 };
  const ease = (key, target, k = 0.14) => { eased[key] = reduce ? target : eased[key] + (target - eased[key]) * k; if (Math.abs(target - eased[key]) < 0.001) eased[key] = target; return eased[key] !== target; };

  // Clicking a client name rolls the wheel to it.
  clientNames.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    const r = clients.getBoundingClientRect(), span = r.height - innerHeight;
    const target = scrollY + r.top + span * i / (clientNames.length - 1);
    if (reduce) scrollTo({ top: target, behavior: 'instant' }); else glide(target, 900);
  }));

  function frame() {
    ticking = false;
    let again = false;

    // Active section: the one under the middle of the screen.
    const mid = innerHeight * 0.5;
    if (!gliding) sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) setSection(i); });

    // Reveals
    for (const el of $$('[data-reveal]:not(.is-in)')) if (!el.closest('.measure__list') && el.getBoundingClientRect().top < innerHeight * 0.88) el.classList.add('is-in');
    // Results rows come in one after another once the section has arrived (top in the upper third), so the
    // stop there is noticed.
    if (measure.getBoundingClientRect().top < innerHeight * 0.35) $$('li', measure).forEach(li => li.classList.add('is-in'));

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
    again = ease('method', progress(method) * (mTexts.length - 0.4) - 0.6, gliding ? 1 : 0.35) || again;
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
    again = ease('clients', progress(clients) * (clientNames.length - 1), gliding ? 1 : 0.35) || again;
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
