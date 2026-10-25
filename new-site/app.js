// MediaGroots site behaviour: section colours, side index, reveals, rotating words, and the scroll-driven
// pinned sections (services list, featured work, clients wheel), plus the What we build card reveals. One rAF loop runs while the
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
    setNavActive(s.id);
  }


  /* Liquid glass nav: the bubble sits under the active section's link, and follows the pointer on hover. */
  const nav = $('.glassnav'), bubble = $('.glassnav__bubble'), navLinks = $$('.glassnav a');
  let navActive = null;
  function moveBubble(a) {
    if (!a) { bubble.style.opacity = 0; return; }
    const shown = bubble.style.opacity === '1';
    bubble.style.width = a.offsetWidth + 'px';
    bubble.style.transform = `translateX(${a.offsetLeft}px)`;
    bubble.style.opacity = 1;
    if (shown) { bubble.classList.remove('is-moving'); void bubble.offsetWidth; bubble.classList.add('is-moving'); }
  }
  function setNavActive(id) {
    navActive = navLinks.find(a => a.dataset.for.split(' ').includes(id)) || navActive;
    navLinks.forEach(a => a.classList.toggle('is-on', a === navActive));
    if (!nav.matches(':hover')) moveBubble(navActive);
  }
  navLinks.forEach(a => a.addEventListener('pointerenter', () => moveBubble(a)));
  nav.addEventListener('pointerleave', () => moveBubble(navActive));
  addEventListener('resize', () => moveBubble(navActive));
  // Header and menu links glide to their section instead of jumping.
  $$('.top a[href^="#"], #menu a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + scrollY;
    if (reduce) scrollTo({ top: y, behavior: 'instant' }); else glide(y, Math.min(1600, 700 + Math.abs(y - scrollY) * 0.04));
  }));

  /* What we build: four scenes driven by scroll progress through the section (see index.html). */
  const build = $('.build'), wbPhoto = $('.wb-photo'), wbS1 = $('.wb-s1'), wbPanel = $('.wb-panel');
  const wbSay = $$('.wb-say span'), wbWipe = $('.wb-wipe'), wbPale = $('.wb-pale'), wbSay2 = $('.wb-say2'), wbS4 = $('.wb-s4');
  const wbItems = $$('.wb-item'), wbImgs = $$('.wb-stack img');
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const smooth = t => t * t * (3 - 2 * t);
  // Tiles for the zoom-and-dissolve: small canvases painted straight from the photo already on screen (no extra
  // image requests, so they are never blank), cropped to match object-fit: cover. Built as soon as the photo has
  // loaded, and again after a resize.
  const wbZoom = $('.wb-zoom'), wbImg = $('.wb-photo img');
  let zoomTiles = [], zoomSize = '';
  function buildTiles(w, h) {
    const iw = wbImg.naturalWidth, ih = wbImg.naturalHeight;
    if (!iw || !w) return false;
    const cols = innerWidth < 760 ? 6 : 9, rows = Math.round(cols * h / w), tw = w / cols, th = h / rows;
    const c = Math.max(w / iw, h / ih), sx0 = (iw - w / c) / 2, sy0 = (ih - h / c) / 2, dpr = Math.min(2, devicePixelRatio || 1);
    let rnd = 7;
    const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
    wbZoom.innerHTML = '';
    zoomTiles = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = document.createElement('canvas');
      t.width = Math.ceil(tw * dpr); t.height = Math.ceil(th * dpr);
      Object.assign(t.style, { position: 'absolute', left: `${x * tw}px`, top: `${y * th}px`, width: `${tw + 0.6}px`, height: `${th + 0.6}px` });
      t.getContext('2d').drawImage(wbImg, sx0 + x * tw / c, sy0 + y * th / c, tw / c, th / c, 0, 0, t.width, t.height);
      wbZoom.appendChild(t);
      // Tiles further from the centre break away first; each drifts outwards with a little spin.
      const dx = (x + 0.5) / cols - 0.5, dy = (y + 0.5) / rows - 0.5, d = Math.hypot(dx, dy);
      zoomTiles.push({ el: t, start: 0.15 + (0.7 - d) / 0.7 * 0.3 + rand() * 0.15, dx: dx * 260 + (rand() - 0.5) * 120, dy: dy * 260 + (rand() - 0.5) * 120, rot: (rand() - 0.5) * 50 });
    }
    wbZoom.style.width = `${w}px`; wbZoom.style.height = `${h}px`;
    return true;
  }
  function prepareTiles() {
    const r = wbPhoto.getBoundingClientRect(), size = `${Math.round(r.width)}x${Math.round(r.height)}x${wbImg.naturalWidth}`;
    if (size !== zoomSize && buildTiles(r.width, r.height)) zoomSize = size;
  }
  wbImg.loading = 'eager';
  if (wbImg.complete) prepareTiles(); else wbImg.addEventListener('load', prepareTiles, { once: true });
  addEventListener('resize', () => requestAnimationFrame(prepareTiles));
  function zoomFrame(g, r, vw, vh) {
    prepareTiles();
    const ready = zoomTiles.length > 0, show = ready && g > 0.001 && g < 0.999;
    wbZoom.style.visibility = show ? 'visible' : 'hidden';
    // The photo stays visible until the tiles are ready to take its place.
    wbImg.style.visibility = ready && g > 0.001 ? 'hidden' : '';
    if (!show) return;
    // Grow from the photo's box (scale 1) to a little beyond the screen, moving to the centre.
    const S = Math.max(vw / r.width, vh / r.height) * 1.08, z = Math.min(1, g * 1.25);
    const cx = vw / 2 - (r.left + r.width / 2), cy = vh / 2 - (r.top + r.height / 2);
    wbZoom.style.transform = `translate(${r.left + cx * z}px, ${r.top + cy * z}px) scale(${1 + (S - 1) * z})`;
    for (const t of zoomTiles) {
      const k = smooth(clamp((g - t.start) / 0.35, 0, 1));
      t.el.style.opacity = 1 - k;
      t.el.style.transform = k ? `translate(${t.dx * k}px, ${t.dy * k}px) rotate(${t.rot * k}deg) scale(${1 - 0.35 * k})` : '';
    }
  }
  function buildFrame() {
    const p = progress(build), vw = innerWidth, vh = innerHeight;
    // 1 → 2: the picture zooms up towards the full screen and breaks into tiles that drift apart and fade,
    // dissolving into the navy panel that grows behind it.
    const g = smooth(seg(p, 0.08, 0.22));
    const r = wbPhoto.getBoundingClientRect();
    const ins = [r.top, vw - r.right, vh - r.bottom, r.left].map(v => (Math.max(0, v) * (1 - g)).toFixed(1));
    wbPanel.style.clipPath = `inset(${ins[0]}px ${ins[1]}px ${ins[2]}px ${ins[3]}px round ${(22 * (1 - g)).toFixed(1)}px)`;
    zoomFrame(g, r, vw, vh);
    // The navy panel sits above the photo, so it only appears once the tiles have taken the photo's place.
    wbPanel.style.opacity = g > 0.001 && (zoomTiles.length || g > 0.5) ? 1 : 0;
    wbS1.style.opacity = 1 - seg(p, 0.16, 0.2);
    // 2: statement lines rise in one after another, then lift away.
    wbSay.forEach((l, i) => { const t = smooth(seg(p, 0.21 + i * 0.04, 0.27 + i * 0.04)), out = seg(p, 0.42, 0.48);
      l.style.transform = `translateY(${(1 - t) * 110 - out * 60}%)`; l.style.opacity = t * (1 - out); });
    // 3: a big MG mark sweeps up through the screen, tilting as it goes; pale blue spreads out behind it in a
    // growing circle, so the colour change travels with the mark.
    const w = seg(p, 0.44, 0.62);
    const mh = wbWipe.offsetHeight;
    wbWipe.style.transform = `translateY(${vh - w * (vh + mh)}px) rotate(${(w - 0.5) * -14}deg)`;
    wbWipe.style.visibility = w > 0 && w < 1 ? 'visible' : 'hidden';
    const c = smooth(seg(p, 0.47, 0.6));
    wbPale.style.clipPath = `circle(${(c * 120).toFixed(1)}% at 50% ${(70 - c * 20).toFixed(1)}%)`;
    const pale = p >= 0.53;
    // On the pale scenes the header switches to dark text so the logo stays visible.
    if (body.dataset.section === 'build') body.dataset.fg = pale ? 'dark' : 'light';
    const s2 = seg(p, 0.53, 0.58) * (1 - seg(p, 0.66, 0.7));
    wbSay2.style.opacity = s2; wbSay2.style.transform = `scale(${0.92 + 0.08 * seg(p, 0.53, 0.6)})`;
    // 4: the systems list; the active one follows the scroll, its picture comes to the front of the stack.
    const s4 = seg(p, 0.68, 0.73);
    wbS4.style.opacity = s4; wbS4.style.transform = `translateY(${(1 - s4) * 40}px)`; wbS4.style.pointerEvents = s4 > 0.5 ? '' : 'none';
    // Continuous position through the five systems (a = 0..4): the stack moves with the scroll itself (no CSS
    // transitions to lag behind), the front picture is in colour and fades to black and white as it leaves.
    const a = seg(p, 0.74, 0.97) * (wbItems.length - 1), act = Math.round(a);
    wbItems.forEach((it, i) => it.classList.toggle('is-on', i === act));
    wbImgs.forEach((im, i) => { const d = i - a;
      if (d < 0) { im.style.transform = `translate(${d * 55}%, ${d * -30}px) rotate(${d * 10}deg) scale(${1 + d * 0.08})`; im.style.opacity = clamp(1 + d * 2, 0, 1); im.style.zIndex = 20; }
      else { im.style.transform = `translate(${d * 14}px, ${d * -14}px) rotate(${d * 3}deg) scale(${1 - d * 0.05})`; im.style.opacity = clamp(3 - d, 0, 1); im.style.zIndex = 10 - Math.round(d * 2); }
      im.style.filter = `grayscale(${clamp(Math.abs(d) * 1.6, 0, 1).toFixed(2)}) brightness(${(1 - clamp(Math.abs(d), 0, 1) * 0.08).toFixed(3)})`; });
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
  const work = $('.work'), workSets = ['.work__titles h3', '.work__media img', '.work__tags ul', '.work__thumbs li'].map(s => $$(s));

  /* Page stepping: one scroll gesture (wheel, trackpad, swipe or key) glides to the next stop with our own eased
     scroll, so the pinned animations and the background colour change move in step with it. Stops are each
     section's top, every step in the pinned sections (projects, method stages, clients), and about a screen at
     a time through sections taller than the screen. Services scroll freely between their first and last
     discipline. Stops are worked out on each
     gesture, so they stay right after resizes or opened FAQ answers. */
  const workCount = workSets[0].length;
  const pinnedStops = {
    // Progress points (0..1 through the section's scroll span) where the page settles.
    services: () => [0, 1],
    work: () => Array.from({ length: workCount }, (_, i) => (i + 0.5) / workCount),
    method: () => { const n = $$('.method__text').length; return [0, ...Array.from({ length: n }, (_, i) => (i + 0.6) / (n - 0.4))]; },
    clients: () => $$('.clients__names a').map((_, i, a) => i / (a.length - 1)),
  };
  // Sections where one gesture moves one stop; everywhere else the page scrolls normally.
  const stepped = () => [work];
  const secTop = sec => sec.getBoundingClientRect().top + scrollY;
  function stops() {
    const out = [];
    for (const sec of stepped()) {
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
  // Inside a stepped section one gesture moves one stop; past its first or last stop (and everywhere else) the
  // page scrolls normally.
  function inFreeZone(y, dir) {
    for (const sec of stepped()) {
      const top = secTop(sec), span = sec.offsetHeight - innerHeight;
      if (y < top - 4 || y > top + span + 4) continue;
      const pts = pinnedStops[sec.id]().map(p => top + span * p), first = pts[0], last = pts.at(-1);
      return dir > 0 ? y >= last - 4 : y <= first + 4;
    }
    return true;
  }
  let gliding = null, stepLock = 0;
  // A gesture is a run of wheel events less than 180ms apart. Only the gesture that started a Work step may
  // stretch its hold; a new gesture during the hold is ignored but does not extend it, so scrolling never sticks.
  let lastWheel = 0, sameGesture = false, holdGesture = false;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function glide(target, duration) {
    stopSmooth();
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
    holdGesture = true;
  }
  function pageStep(dir) {
    if (!menu.hidden) return false;
    // While a step is held, events that keep arriving (a long flick or trackpad inertia) extend the hold, so one
    // gesture can never move two steps.
    if (gliding || performance.now() < stepLock) {
      if (holdGesture && sameGesture) stepLock = Math.max(stepLock, performance.now() + 300); else holdGesture = false;
      return true;
    }
    // Decide from where the page is heading (a smooth wheel scroll may still be settling); glide() takes over.
    const y = smoothTarget ?? scrollY;
    if (inFreeZone(y, dir)) return false;
    const list = stops();
    const target = dir > 0 ? list.find(v => v > y + 4) : [...list].reverse().find(v => v < y - 4);
    if (target === undefined) return false;
    if (reduce) { scrollTo({ top: target, behavior: 'instant' }); return true; }
    glide(target, Math.min(1300, 700 + Math.abs(target - y) * 0.25));
    return true;
  }

  /* Smooth wheel: a mouse wheel moves the page in ~100px jumps, which made the big Services type jump. Normal
     wheel scrolling instead sets a target and the page eases towards it each frame (as on fromanother.love).
     Trackpads send small steps, so they feel the same as before. */
  let smoothTarget = null;
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  function smoothTo(y) {
    const start = smoothTarget === null;
    smoothTarget = clamp(y, 0, maxY());
    if (start) requestAnimationFrame(smoothFrame);
  }
  function smoothFrame() {
    if (smoothTarget === null) return;
    const d = smoothTarget - scrollY;
    if (Math.abs(d) < 0.5) { scrollTo({ top: smoothTarget, behavior: 'instant' }); smoothTarget = null; frame(); return; }
    scrollTo({ top: scrollY + d * 0.14, behavior: 'instant' });
    frame();
    requestAnimationFrame(smoothFrame);
  }
  const stopSmooth = () => { smoothTarget = null; };
  addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaY) < 2) return;
    const now = performance.now(); sameGesture = now - lastWheel < 180; lastWheel = now;
    if (pageStep(e.deltaY > 0 ? 1 : -1)) { e.preventDefault(); return; }
    if (reduce || !menu.hidden) return;
    e.preventDefault();
    const from = smoothTarget ?? scrollY;
    let to = from + (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    // Normal scrolling stops exactly at a stepped section's first stop (going down) or last stop (going up), so
    // its first scene is never skipped; the next gesture then steps.
    for (const sec of stepped()) {
      const top = secTop(sec), span = sec.offsetHeight - innerHeight, pts = pinnedStops[sec.id]().map(q => Math.round(top + span * q));
      if (to > from && from < pts[0] - 1 && to > pts[0]) { to = pts[0]; holdGesture = true; stepLock = performance.now() + 500; }
      if (to < from && from > pts.at(-1) + 1 && to < pts.at(-1)) { to = pts.at(-1); holdGesture = true; stepLock = performance.now() + 500; }
    }
    smoothTo(to);
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
    again = ease('svc', progress(svc) * (svcItems.length - 1), 1) || again;
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

    buildFrame();

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


    if (again) request();
  }
  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();
})();
