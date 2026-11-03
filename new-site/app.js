// MediaGroots site behaviour: section colours, side index, reveals, rotating words, and the scroll-driven
// pinned sections (services list, featured work, method, clients wheel, What we build scenes). One rAF loop runs while the
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
  const indexFill = $('.index__bar i'), badgeRing = $('.badge__ring');
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
    $('.index__top').tabIndex = s.id === 'contact' ? 0 : -1;
    if (!keepBg) document.documentElement.style.backgroundColor = s.dataset.bg;
    const [a1, a2, a3] = s.dataset.aura.split(',');
    body.style.setProperty('--a1', a1); body.style.setProperty('--a2', a2); body.style.setProperty('--a3', a3);
    indexItems.forEach((li, j) => li.classList.toggle('is-on', j === i));
  }


  // Header and menu links glide to their section instead of jumping.
  $$('.top a[href^="#"], #menu a[href^="#"], .index__top, .badge').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + scrollY;
    if (reduce) scrollTo({ top: y, behavior: 'instant' }); else glide(y, Math.min(1600, 700 + Math.abs(y - scrollY) * 0.04));
  }));

  /* What we build: four scenes driven by scroll progress through the section (see index.html). */
  const build = $('.build'), wbPhoto = $('.wb-photo'), wbS1 = $('.wb-s1'), wbPanel = $('.wb-panel');
  const wbSay = $$('.wb-say span'), wbS4 = $('.wb-s4');
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
    const g = smooth(seg(p, 0.1, 0.275));
    const r = wbPhoto.getBoundingClientRect();
    // Navy spreads like ink from the photo's centre (drifting to the screen centre) in a widening circle with a
    // feathered edge, instead of a hard-edged box; scrolling back up draws it back in.
    const ox = r.left + r.width / 2 + (vw / 2 - r.left - r.width / 2) * g, oy = r.top + r.height / 2 + (vh / 2 - r.top - r.height / 2) * g;
    const rad = smooth(seg(g, 0.1, 1)) * Math.hypot(vw, vh) * 0.75, feather = 140 + 260 * g;
    const ink = `radial-gradient(circle at ${ox.toFixed(0)}px ${oy.toFixed(0)}px, #000 ${rad.toFixed(0)}px, transparent ${(rad + feather).toFixed(0)}px)`;
    wbPanel.style.webkitMaskImage = ink; wbPanel.style.maskImage = ink;
    zoomFrame(g, r, vw, vh);
    // The navy panel sits above the photo, so it only appears once the tiles have taken the photo's place.
    wbPanel.style.opacity = g > 0.001 && (zoomTiles.length || g > 0.5) ? 1 : 0;
    wbS1.style.opacity = 1 - seg(p, 0.2, 0.25);
    // 2: statement lines rise in one after another, then lift away.
    wbSay.forEach((l, i) => { const t = smooth(seg(p, 0.2625 + i * 0.05, 0.3375 + i * 0.05)), out = seg(p, 0.525, 0.6);
      l.style.transform = `translateY(${(1 - t) * 110 - out * 60}%)`; l.style.opacity = t * (1 - out); });
    // 3: the systems list fades in on its pale stage; the active one follows the scroll, its picture comes to
    // the front of the stack.
    const s4 = seg(p, 0.58, 0.66);
    // Leaving the section, the pinned stage fades as it scrolls off, so the pale scene dissolves into the
    // next section's colour instead of ending in a hard edge.
    const br = build.getBoundingClientRect();
    $('.wb-pin').style.opacity = br.bottom < vh ? clamp(br.bottom / vh * 1.4 - 0.2, 0, 1).toFixed(3) : '';
    wbS4.style.opacity = s4; wbS4.style.transform = `translateY(${(1 - s4) * 40}px)`; wbS4.style.pointerEvents = s4 > 0.5 ? '' : 'none';
    // Continuous position through the five systems (a = 0..4): the stack moves with the scroll itself (no CSS
    // transitions to lag behind), the front picture is in colour and fades to black and white as it leaves.
    const a = seg(p, 0.675, 0.9625) * (wbItems.length - 1), act = Math.round(a);
    wbItems.forEach((it, i) => it.classList.toggle('is-on', i === act));
    wbImgs.forEach((im, i) => { const d = i - a;
      if (d < 0) { im.style.transform = `translate(${d * 55}%, ${d * -30}px) rotate(${d * 10}deg) scale(${1 + d * 0.08})`; im.style.opacity = clamp(1 + d * 2, 0, 1); im.style.zIndex = 20; }
      else { im.style.transform = `translate(${d * 14}px, ${d * -14}px) rotate(${d * 3}deg) scale(${1 - d * 0.05})`; im.style.opacity = clamp(3 - d, 0, 1); im.style.zIndex = 10 - Math.round(d * 2); }
      im.style.filter = `grayscale(${clamp(Math.abs(d) * 1.6, 0, 1).toFixed(2)}) brightness(${(1 - clamp(Math.abs(d), 0, 1) * 0.08).toFixed(3)})`; });
    return br.top <= vh * 0.5 && br.bottom > vh * 0.5 && s4 > 0.5;
  }

  /* End of Work: after the last project its card zooms up to fill the screen while the water melts it to pale
     from the middle outward; the MG mark is pushed up from below to the middle, then on out of the top, and as it
     leaves the line "And grow from deep groots." pops up. Runs over the last BRAND_VH of the section. */
  const BRAND_VH = 2.2;
  const workPin = $('.work__pin'), workMedia = $('.work__media'), workSide = ['.work__titles', '.work__tags', '.work__thumbs'].map(s => $(s));
  const wbWipe = $('.wb-wipe'), wbPale = $('.wb-pale'), wbSay2 = $('.wb-say2');
  const backOut = t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
  let mediaShift = [0, 0];
  function brandFrame() {
    const vw = innerWidth, vh = innerHeight, r = work.getBoundingClientRect(), len = BRAND_VH * vh;
    const b = clamp((-r.top - (r.height - vh - len)) / len, 0, 1);
    // The card's untransformed centre: its on-screen centre less the shift applied last frame.
    const m = workMedia.getBoundingClientRect(), w = workMedia.offsetWidth, h = workMedia.offsetHeight;
    const cx = m.left + m.width / 2 - mediaShift[0], cy = m.top + m.height / 2 - mediaShift[1];
    const z = smooth(seg(b, 0, 0.3)), s = 1 + (Math.max(vw / w, vh / h) * 1.04 - 1) * z;
    mediaShift = [(vw / 2 - cx) * z, (vh / 2 - cy) * z];
    workMedia.style.transform = z ? `translate(${mediaShift[0].toFixed(1)}px, ${mediaShift[1].toFixed(1)}px) scale(${s.toFixed(4)})` : '';
    workSide.forEach(el => { el.style.opacity = z ? 1 - seg(b, 0, 0.12) : ''; });
    window.mgWater?.melt(seg(b, 0.14, 0.42), smooth(seg(b, 0, 0.16)));
    wbPale.style.opacity = seg(b, 0.4, 0.44);
    // The mark (full screen width, as first built) is pushed up from below the screen to the middle (settling with a slight overshoot and tilt),
    // holds, then carries on up out of the top.
    const q = seg(b, 0.38, 0.54), u = smooth(seg(b, 0.6, 0.8)), out = vh * 0.5 + wbWipe.offsetHeight * 0.6;
    const wy = (1 - backOut(q)) * out - u * out;
    wbWipe.style.transform = `translateY(${wy.toFixed(1)}px) rotate(${((1 - q) * 8 - u * 8).toFixed(2)}deg)`;
    wbWipe.style.visibility = q > 0 && u < 1 ? 'visible' : 'hidden';
    // The line pops up (overshooting) only once the mark starts to leave.
    const t2 = seg(b, 0.64, 0.76);
    // Half-lit while the mark is still crossing it, full strength once the mark has left the frame.
    wbSay2.style.opacity = (Math.min(1, t2 * 3) * (0.45 + 0.55 * seg(u, 0.6, 1))).toFixed(3); wbSay2.style.transform = `scale(${(0.6 + 0.4 * backOut(t2)).toFixed(4)})`;
    // Leaving the section, the pinned stage fades as it scrolls off into Method.
    // Its lower part dissolves into Method through a widening soft gradient, so the two sections blend instead of
    // meeting at a hard edge.
    const leave = clamp(1 - r.bottom / vh, 0, 1), soft = 100 - 85 * smooth(seg(leave, 0, 0.35));
    const blend = leave > 0 ? `linear-gradient(to bottom, #000 ${(soft - 15).toFixed(1)}%, transparent ${(soft + 15).toFixed(1)}%)` : '';
    workPin.style.webkitMaskImage = blend; workPin.style.maskImage = blend;
    workPin.style.opacity = r.bottom < vh ? clamp(r.bottom / vh * 1.4 - 0.2, 0, 1).toFixed(3) : '';
    // Dark header only while the pale scene still covers the top of the screen (not once it has blended away).
    return r.top <= vh * 0.5 && r.bottom > vh * 0.5 && b >= 0.36 && leave < 0.15;
  }
  // Projects share the part of Work before the MG mark scene.
  const workProgress = () => { const r = work.getBoundingClientRect(), span = r.height - innerHeight * (1 + BRAND_VH); return span > 0 ? clamp(-r.top / span, 0, 1) : 0; };


  /* FAQ: answers open and close with a smooth height animation (and the text fades and rises in) instead of
     snapping. A click during an animation reverses it from where it is. */
  for (const d of $$('.faq details')) {
    const sum = $('summary', d), ans = $('p', d);
    let anim = null;
    sum.addEventListener('click', e => {
      if (reduce) return;
      e.preventDefault();
      const from = d.offsetHeight, opening = !d.open || d.classList.contains('is-closing');
      anim?.cancel();
      d.style.overflow = 'hidden';
      if (opening) { d.open = true; d.classList.remove('is-closing'); }
      // Natural height when open, or the summary-only height when closed (padding is the same either way).
      const pad = parseFloat(getComputedStyle(d).paddingTop) + parseFloat(getComputedStyle(d).paddingBottom);
      const to = opening ? d.offsetHeight : sum.offsetHeight + pad;
      if (!opening) d.classList.add('is-closing');
      anim = d.animate({ height: [`${from}px`, `${to}px`] }, { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      ans.animate(opening ? { opacity: [0, 1], transform: ['translateY(-8px)', 'none'] } : { opacity: [1, 0], transform: ['none', 'translateY(-6px)'] }, { duration: opening ? 450 : 250, easing: 'ease-out', fill: 'forwards' });
      anim.onfinish = () => { if (!opening) { d.open = false; d.classList.remove('is-closing'); } d.style.overflow = ''; anim = null; };
    });
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

  /* Scrolling is normal everywhere; the pinned sections (Services, Work, Method, Clients, What we build) are
     sticky and play with the scroll. glide() is an eased scroll used by the nav links and the client names; it
     blends the background colour and the Clients light by its own progress, so colour moves with the content. */
  const secTop = sec => sec.getBoundingClientRect().top + scrollY;
  let gliding = null;
  // Sine in-out: starts moving at once and lands softly (cubic waited too long before moving).
  const easeInOut = t => (1 - Math.cos(Math.PI * t)) / 2;
  function glide(target, duration) {
    stopSmooth();
    const from = scrollY, start = performance.now();
    const dest = sections.findIndex(s => { const t = secTop(s); return target + innerHeight / 2 >= t && target + innerHeight / 2 < t + s.offsetHeight; });
    const html = document.documentElement, fromSec = sections[activeSection], toSec = sections[dest] || fromSec;
    const c0 = hexRgb(fromSec.dataset.bg), c1 = hexRgb(toSec.dataset.bg);
    const l0 = fromSec.id === 'clients' ? 1 : 0, l1 = toSec.id === 'clients' ? 1 : 0;
    html.style.transition = 'none'; light.style.transition = 'none';
    if (dest >= 0) setSection(dest, true);
    // Content of the destination starts revealing as the glide starts, so it settles together with the scroll
    // instead of fading in after the page has stopped.
    if (dest >= 0) $$('[data-reveal]', sections[dest]).forEach(el => el.classList.add('is-in'));
    const token = gliding = { dest, dir: Math.sign(target - from) };
    const step = now => {
      if (gliding !== token) return;
      const k = Math.min(1, (now - start) / duration), e = easeInOut(k);
      scrollTo({ top: from + (target - from) * e, behavior: 'instant' });
      html.style.backgroundColor = `rgb(${c0.map((v, i) => Math.round(v + (c1[i] - v) * e)).join(',')})`;
      light.style.opacity = l0 + (l1 - l0) * e;
      // Update the pinned animations in this same frame, so they never trail the scroll by a frame.
      frame();
      if (k < 1) requestAnimationFrame(step);
      else { gliding = null; html.style.transition = ''; light.style.transition = ''; light.style.opacity = ''; frame(); }
    };
    requestAnimationFrame(step);
  }
  // Stops a glide where it is (scrolling the other way during it); the section state and colour are then worked
  // out afresh from the current position, fading from the part-blended colour.
  function cancelGlide() {
    if (!gliding) return;
    gliding = null;
    document.documentElement.style.transition = ''; light.style.transition = ''; light.style.opacity = '';
    activeSection = -1;
    frame();
  }

  /* Smooth wheel: a mouse wheel moves the page in ~100px jumps, which made the big type jump. Wheel scrolling
     instead sets a target and the page eases towards it each frame (as on fromanother.love). Trackpads send
     small steps, so they feel the same as before. */
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
  // Hero → About: the first downward gesture on the hero glides straight to About, so it lands centred. The rest
  // of that gesture (trackpad inertia) is swallowed; a new gesture scrolls on normally.
  const about = $('#manifesto');
  let lastWheel = 0, lastAbs = 0, swallow = false, swallowDir = 0;
  addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaY) < 2 || !menu.hidden) return;
    const now = performance.now(), abs = Math.abs(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    // A new swipe during trackpad inertia counts as a fresh gesture: inertia only fades, so a sudden jump in
    // speed is the hand again. Without this, the next swipe at a break was swallowed until the inertia died.
    const sameGesture = now - lastWheel < 180 && !(abs > Math.max(14, lastAbs * 2.2));
    lastWheel = now; lastAbs = abs;
    const dir = Math.sign(e.deltaY);
    // Scrolling the other way during a glide takes over straight away instead of being ignored.
    if (gliding && dir !== gliding.dir) { cancelGlide(); swallow = false; }
    if (gliding || (swallow && sameGesture && dir === swallowDir)) { e.preventDefault(); return; }
    swallow = false;
    const aboutTop = secTop(about);
    // Only a fresh scroll that starts on the hero itself (the top half of the way to About) jumps; scrolling back
    // up from About and down again just scrolls.
    if (dir > 0 && !sameGesture && (smoothTarget ?? scrollY) < aboutTop * 0.5) {
      e.preventDefault();
      if (reduce) scrollTo({ top: aboutTop, behavior: 'instant' }); else glide(aboutTop, 1050);
      swallow = true; swallowDir = dir;
      return;
    }
    // End of Work → Method: a fresh downward scroll from the closing line ("And grow from deep groots.", the
    // last quarter screen of Work) up to Method's top glides straight to Method, so "Driven by deep groots"
    // lands centred. No stop on the way: a scroll that is already moving carries on through.
    const methodTop = Math.round(secTop(method)), workEnd = Math.round(secTop(work) + work.offsetHeight - innerHeight);
    const yNow = smoothTarget ?? scrollY;
    if (dir > 0 && !sameGesture && yNow >= workEnd - innerHeight * 0.25 && yNow < methodTop - 2) {
      e.preventDefault();
      if (reduce) scrollTo({ top: methodTop, behavior: 'instant' }); else glide(methodTop, 1050);
      swallow = true; swallowDir = dir;
      return;
    }
    // Breaks: scrolling down stops at the end of Method (Bloom), the end of Clients (last client, where the
    // spotlight switches off) and the end of What we build (Live KPI dashboards), holding for the rest of that
    // gesture; the next fresh scroll glides to the start of the following section.
    const y = smoothTarget ?? scrollY, dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const end = sec => Math.round(secTop(sec) + sec.offsetHeight - innerHeight);
    const measureSec = $('.measure');
    const breaks = [[end(method), Math.round(secTop(clients))], [end(clients), Math.round(secTop(build))], [end(build), Math.round(secTop(measureSec))]];
    for (const [at, next] of breaks) {
      if (dir > 0 && Math.abs(y - at) < 6 && !sameGesture) {
        e.preventDefault();
        if (reduce) scrollTo({ top: next, behavior: 'instant' }); else glide(next, 1050);
        swallow = true; swallowDir = dir;
        return;
      }
      if (dir > 0 && y < at - 1 && y + dy > at) {
        e.preventDefault();
        if (reduce) scrollTo({ top: at, behavior: 'instant' }); else smoothTo(at);
        swallow = true; swallowDir = dir;
        return;
      }
    }
    if (reduce) return;
    e.preventDefault();
    smoothTo(y + dy);
  }, { passive: false });
  const clients = $('.clients'), clientNames = $$('.clients__list a'), clientLogos = $$('.clients__logos img');
  const method = $('.method'), methodTitle = $('.method__title'), mFrames = $$('.frame'), mTexts = $$('.method__text'), mRoll = $('.method__num-roll'), mNum = $('.method__num');
  let svcHalf = null;
  addEventListener('resize', () => { svcHalf = null; });
  const eased = { svc: 0, method: -1 };
  const ease = (key, target, k = 0.14) => { eased[key] = reduce ? target : eased[key] + (target - eased[key]) * k; if (Math.abs(target - eased[key]) < 0.001) eased[key] = target; return eased[key] !== target; };

  // Clients: names on up to three orbits around the spotlit logo. The orbits turn together as one (separate speeds
  // made names on neighbouring rings run into each other), each ring's names set at the angle that keeps them
  // furthest from the ring inside it. Each ring takes a share of the names in proportion to its size. On phones
  // the orbits hold fewer and the rest slide past in a strip. Hovering, focusing or tapping a name puts its logo
  // under the spotlight; left alone, the light moves on to the next client every few seconds.
  const orbits = $('.clients__orbits'), strip = $('.clients__strip'), track = $('.clients__track');
  const chip = (i, ring) => { const a = document.createElement('a'); a.href = '#clients'; a.dataset.i = i; a.innerHTML = ring ? `<span>${clientNames[i].textContent}</span>` : clientNames[i].textContent; return a; };
  function layoutClients() {
    const n = clientNames.length, phone = innerWidth < 760;
    const ks = phone ? [0.85] : n <= 8 ? [0.85] : n <= 16 ? [0.6, 1] : [0.56, 0.78, 1];
    const fit = phone ? Math.min(n, 6) : n, sum = ks.reduce((x, y) => x + y, 0);
    let left = fit, next = 0, inner = [];
    orbits.innerHTML = ''; track.innerHTML = '';
    const R = phone ? innerWidth * 0.42 : Math.min(innerHeight * 0.37, 390);
    orbits.style.setProperty('--sx', phone ? 1 : clamp(innerWidth * 0.44 / R, 1, ks.length === 1 ? 1.3 : 2).toFixed(3));
    const spin = document.createElement('div');
    spin.className = 'clients__spin';
    orbits.appendChild(spin);
    ks.forEach((k, r) => {
      const cnt = r === ks.length - 1 ? left : Math.round(fit * k / sum); left -= cnt;
      // Best offset: the one whose angles stay furthest from the inner ring's.
      let off = 0, best = -1;
      for (let o = 0; o < 360 / cnt; o++) {
        let m = 360;
        for (let i = 0; i < cnt; i++) for (const b of inner) { const d = Math.abs(((o + i * 360 / cnt - b) % 360 + 540) % 360 - 180); if (d < m) m = d; }
        if (m > best) { best = m; off = o; }
      }
      inner = Array.from({ length: cnt }, (_, i) => off + i * 360 / cnt);
      const ring = document.createElement('div');
      ring.className = 'clients__ring';
      ring.style.cssText = `--k:${k};--n:${cnt};--off:${off}deg`;
      for (let i = 0; i < cnt; i++) { const a = chip(next++, true); a.style.setProperty('--i', i); ring.appendChild(a); }
      spin.appendChild(ring);
      const line = document.createElement('i');
      line.style.setProperty('--k', k);
      orbits.insertBefore(line, spin);
    });
    const rest = [];
    for (; next < n; next++) rest.push(next);
    strip.classList.toggle('is-on', rest.length > 0);
    for (const copy of [0, 1]) rest.forEach(i => track.appendChild(chip(i, false)));
    showClient(clientOn);
  }
  let clientOn = 0, ringHeld = false;
  const showClient = i => {
    clientOn = i;
    $$('a[data-i]', clients).forEach(a => a.classList.toggle('is-on', +a.dataset.i === i));
    clientLogos.forEach((img, j) => img.classList.toggle('is-on', j === i));
  };
  const pick = e => { const a = e.target.closest('a[data-i]'); if (a) showClient(+a.dataset.i); return a; };
  clients.addEventListener('pointerover', pick);
  clients.addEventListener('focusin', pick);
  clients.addEventListener('click', e => { if (pick(e)) e.preventDefault(); });
  for (const el of [orbits, strip]) { el.addEventListener('pointerenter', () => { ringHeld = true; }); el.addEventListener('pointerleave', () => { ringHeld = false; }); }
  layoutClients();
  let clientsResize = 0;
  addEventListener('resize', () => { clearTimeout(clientsResize); clientsResize = setTimeout(layoutClients, 150); });
  setInterval(() => { if (!ringHeld && !reduce && body.dataset.section === 'clients') showClient((clientOn + 1) % clientNames.length); }, 2800);

  function frame() {
    ticking = false;
    let again = false;

    // Badge ring: its angle is the scroll position itself (0.1° per pixel), so scrolling down turns it clockwise,
    // scrolling up turns it back, and any glide to the top (the badge's own click) winds it back to 0 in step.
    badgeRing.style.transform = `rotate(${(scrollY * 0.1).toFixed(2)}deg)`;

    // Page progress: the line beside the index fills from top to bottom as the page is read, full at the end.
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    indexFill.style.transform = `scaleY(${maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1).toFixed(4) : 0})`;

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
    const wi = Math.min(workSets[0].length - 1, Math.floor(workProgress() * workSets[0].length));
    workSets.forEach(set => set.forEach((el, i) => el.classList.toggle('is-on', i === wi)));
    window.mgWater?.show(wi);

    // Method: s runs from -1 (heading only, first panel still below the screen) to the last stage. Each stage's panels drift from below the
    // screen to above it while d = s - i goes from -0.8 to 1; the echo panel moves faster and further right.
    again = ease('method', progress(method) * mTexts.length - 1, gliding ? 1 : 0.35) || again;
    const ms = eased.method, vh = innerHeight;
    methodTitle.style.opacity = clamp(-ms * 2.2, 0, 1);
    // The heading sits exactly centred at the start, then lifts as the first panel rises.
    methodTitle.style.transform = `translateY(${Math.max(0, ms + 0.6) * -60}px)`;
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

    // The header text is dark while a pale scene (end of Work, systems list) covers the middle of the screen
    // (also while gliding out of it, when the next section is already active), and back to the active
    // section's own colour once it has gone.
    const pale = brandFrame() | buildFrame();
    const want = pale ? 'dark' : sections[activeSection]?.dataset.fg;
    if (want && body.dataset.fg !== want) body.dataset.fg = want;

    // The spotlight only switches on once the page has settled on Clients (screen-filling, not mid-glide).
    const cr = clients.getBoundingClientRect();
    body.classList.toggle('spot-on', !gliding && Math.abs(cr.top) < innerHeight * 0.06);


    if (again) request();
  }
  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  // Idle: 1.5s without scrolling turns on the progress line's drip animation; any scroll turns it off.
  let idleTimer = 0;
  // All drips (progress line, idle Scroll cue, hero Scroll cue) are put on one shared start time, so they pulse
  // together instead of each running on its own beat.
  const syncDrips = () => requestAnimationFrame(() => {
    const drips = document.getAnimations().filter(a => a.animationName === 'drip');
    const t0 = Math.min(...drips.map(a => a.startTime ?? Infinity));
    if (Number.isFinite(t0)) drips.forEach(a => { a.startTime = t0; });
  });
  const rest = () => { body.classList.remove('is-idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { body.classList.add('is-idle'); syncDrips(); }, 1500); };
  addEventListener('scroll', rest, { passive: true });
  rest();
  addEventListener('resize', request);
  frame();
})();
