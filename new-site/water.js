// Water effect for the Featured Work images: a WebGL canvas draws the current project image through a
// moving liquid surface (smooth noise displacement plus a light caustic sheen). Changing project melts the
// old image into the new one through the same surface; the pointer leaves a ripple ring as it moves. The image
// is black and white until hovered, then fades to its original colour (and back when the pointer leaves).
// melt(k) (0..1, end of Work) strengthens the liquid and floods the picture to pale from the middle outward.
// Exposes window.mgWater = { show(index), melt(k) }. If WebGL is unavailable the plain <img> elements stay visible.
(() => {
  const host = document.querySelector('.work__media');
  if (!host) return;
  const imgs = [...host.querySelectorAll('img')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'work__gl';
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (!gl) return;

  const vert = `attribute vec2 p; varying vec2 vUv; void main() { vUv = p * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(p, 0.0, 1.0); }`;
  const frag = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uA, uB;
uniform vec2 uResA, uResB, uCanvas, uMouse;
uniform float uTime, uMix, uWave, uStir, uColor, uMelt;
// Smooth value noise (bilinear with smoothstep), cheap and free of pixel stepping.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return noise(p) * 0.6 + noise(p * 2.1 + 3.7) * 0.3 + noise(p * 4.3 + 9.1) * 0.1; }
// object-fit: cover for an image of size r inside the canvas.
vec2 cover(vec2 uv, vec2 r) {
  float ca = uCanvas.x / uCanvas.y, ia = r.x / r.y;
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec2 uv = vUv;
  float t = uTime * 0.25;
  // Liquid surface: two drifting noise fields give a slow, continuous flow.
  vec2 flow = vec2(fbm(uv * 3.0 + vec2(t, t * 0.6)), fbm(uv * 3.0 + vec2(-t * 0.7, t) + 5.2)) - 0.5;
  // Pointer ripple: a ring spreading from the cursor, fading with distance.
  vec2 m = (uv - uMouse) * vec2(uCanvas.x / uCanvas.y, 1.0);
  float d = length(m);
  float ring = sin(d * 38.0 - uTime * 6.0) * exp(-d * 6.0) * uStir;
  vec2 rippleDir = d > 0.0 ? m / d : vec2(0.0);
  float strength = 0.012 + uWave * 0.07 + uMelt * 0.22;
  vec2 offset = flow * strength + rippleDir * ring * 0.018;
  // Transition: the old image flows one way, the new one the other, revealed through a noisy liquid edge.
  float edge = smoothstep(uMix - 0.25, uMix + 0.25, fbm(uv * 2.5 + t) * 0.5 + uv.y * 0.5);
  vec4 a = texture2D(uA, cover(uv + offset + flow * uMix * 0.15, uResA));
  vec4 b = texture2D(uB, cover(uv + offset - flow * (1.0 - uMix) * 0.15, uResB));
  vec4 col = mix(b, a, edge);
  col.rgb = mix(vec3(dot(col.rgb, vec3(0.299, 0.587, 0.114))), col.rgb, uColor);
  // Caustic sheen: soft light bands that move with the flow.
  float caustic = pow(fbm(uv * 6.0 + flow * 4.0 + t * 1.5), 3.0);
  col.rgb += caustic * 0.18;
  // Melt: pale floods in from the middle through a noisy liquid edge that spreads out to the corners.
  float n = fbm(uv * 3.0 + flow * 3.0 + t * 2.0) * 0.45 + (1.0 - length(uv - 0.5) * 1.4) * 0.55;
  float th = 1.0 - uMelt * 1.5;
  col.rgb = mix(col.rgb, vec3(0.859, 0.902, 0.969), smoothstep(th, th + 0.18, n));
  gl_FragColor = col;
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  for (const n of ['uA', 'uB', 'uResA', 'uResB', 'uCanvas', 'uMouse', 'uTime', 'uMix', 'uWave', 'uStir', 'uColor', 'uMelt']) u[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(u.uA, 0);
  gl.uniform1i(u.uB, 1);

  // Textures (clamped: WebGL 1 cannot repeat non-power-of-two images): each image is drawn into a 2D canvas first, so SVG and JPG sources upload the same way.
  const textures = imgs.map(() => null), sizes = imgs.map(() => [1, 1]);
  function load(i) {
    if (textures[i]) return Promise.resolve();
    const img = imgs[i];
    const ready = img.complete && img.naturalWidth ? Promise.resolve() : new Promise(r => { img.loading = 'eager'; img.addEventListener('load', r, { once: true }); });
    return ready.then(() => {
      const w = Math.min(1400, img.naturalWidth || 1200), h = Math.round(w * (img.naturalHeight || 900) / (img.naturalWidth || 1200));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textures[i] = tex; sizes[i] = [w, h];
    });
  }

  let from = 0, to = 0, mix = 1, wave = 0, stir = 0, colour = 0, melt = 0, hovered = false, mouse = [0.5, 0.5], running = false, transStart = 0;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function resize() {
    // Layout size, not the on-screen one: the box is scaled up at the end of Work.
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(host.offsetWidth * dpr)); canvas.height = Math.max(1, Math.round(host.offsetHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw(now) {
    if (!running) return;
    if (mix < 1) {
      const k = Math.min(1, (now - transStart) / 1300);
      mix = easeInOut(k);
      wave = Math.sin(k * Math.PI);
      if (k >= 1) { from = to; mix = 1; wave = 0; }
    }
    stir *= 0.965;
    if (pointer) { const r = host.getBoundingClientRect(); hovered = pointer[0] >= r.left && pointer[0] <= r.right && pointer[1] >= r.top && pointer[1] <= r.bottom; }
    else hovered = false;
    colour += ((hovered || melt > 0 ? 1 : 0) - colour) * 0.09;
    gl.uniform1f(u.uColor, colour);
    gl.uniform1f(u.uMelt, melt);
    // Bind "from" to unit 0 and "to" to unit 1; the shader shows A where the edge has not yet passed.
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[from]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[to]);
    gl.uniform2f(u.uResA, ...sizes[from]); gl.uniform2f(u.uResB, ...sizes[to]);
    gl.uniform2f(u.uCanvas, canvas.width, canvas.height);
    gl.uniform2f(u.uMouse, ...mouse);
    gl.uniform1f(u.uTime, reduce ? 0 : now / 1000);
    gl.uniform1f(u.uMix, mix);
    gl.uniform1f(u.uWave, reduce ? 0 : wave);
    gl.uniform1f(u.uStir, reduce ? 0 : stir);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }

  load(0).then(() => {
    host.appendChild(canvas);
    host.classList.add('has-gl');
    resize();
    addEventListener('resize', resize);
    imgs.forEach((_, i) => load(i));
    // Draw only while the work section is on screen.
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; requestAnimationFrame(draw); }
      else if (!e.isIntersecting) running = false;
    }).observe(host);
  });
  // Hover is decided every frame from the last known pointer position, not from enter/leave events: those do
  // not fire when the page scrolls the image under a resting cursor (Safari), which left the image grey.
  let pointer = null;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pointer = [e.clientX, e.clientY]; }, { passive: true });
  addEventListener('pointerdown', e => { pointer = [e.clientX, e.clientY]; }, { passive: true });
  addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') pointer = null; }, { passive: true });
  document.addEventListener('mouseleave', () => { pointer = null; });
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    mouse = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    stir = Math.min(1, stir + 0.12);
  });

  window.mgWater = {
    show(i) {
      if (i === to) return;
      load(i).then(() => { if (mix < 1) from = to; to = i; mix = 0; transStart = performance.now(); });
    },
    melt(k) { melt = k; },
  };
})();
