/* ══════════════════════════════════════════════════════════════════
   Convolutional Neural Networks — deck 02 (Advanced AI)
   Every demo computes real numbers: the convolution and pooling panels
   run the actual arithmetic, the feature-map panel and the live demo use
   the real weights of a small CNN trained offline on MNIST (98.7% test
   accuracy, baked into cnn_net.js), the augmentation panel applies the
   same affine maths as Keras' ImageDataGenerator, and the training-log
   panel plots the lesson notebook's own 25 epochs.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 17;
const LABELS = ['Overview','Why not a plain ANN?','Images are numbers','Convolution',
                'Filters & feature maps','Max pooling','The full architecture','Flatten & Dense head',
                'Data augmentation','Code: cat vs dog','Reading the training log','Predicting one photo',
                'Live CNN','Pros & cons','Exercises','A1 · Output-size math','A2 · Keras CNN cheat-sheet'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16];   // panel 9 (notebook code) moved to lessons/02_lesson

let current = 0;
let ovRaf = null;

function stopTimers() {
  if (ovRaf) { cancelAnimationFrame(ovRaf); ovRaf = null; }
  if (convTimer) { clearInterval(convTimer); convTimer = null; $('conv-play').textContent = '▶ play'; }
  if (poolTimer) { clearInterval(poolTimer); poolTimer = null; }
  if (predTimer) { clearInterval(predTimer); predTimer = null; }
}

function goTo(idx) {
  if (idx === current) return;
  const oldP = $('panel-' + current), newP = $('panel-' + idx);
  if (current > 0) {
    const btn = document.querySelector(`[data-panel="${current}"]`);
    if (btn) btn.classList.add('done');
  }
  stopTimers();
  oldP.classList.remove('active'); oldP.classList.add('exit');
  setTimeout(() => oldP.classList.remove('exit'), 280);
  current = idx;
  newP.classList.add('active');
  $('viewport').scrollTop = 0;
  document.querySelectorAll('.s-item').forEach(b => b.classList.toggle('active', +b.dataset.panel === idx));
  updateDots();
  fitMath(newP);
  const draws = [drawOverview, () => drawShift(true), drawPixels, enterConv, () => drawFmaps(true), enterPool,
                 drawArch, () => drawFlatten(true), () => drawAug(false), null, drawCurve, enterPredict,
                 enterLive, null, null, drawOutSize, null];
  if (draws[idx]) setTimeout(draws[idx], 60);
}

/* ══════════ keep display maths inside the panel ══════════ */
function fitMath(root) {
  (root || document).querySelectorAll('.katex-display').forEach(d => {
    const inner = d.querySelector('.katex');
    if (!inner) return;
    inner.style.transform = ''; inner.style.display = ''; d.style.height = '';
    const avail = d.clientWidth;
    if (!avail) return;
    const html = inner.querySelector('.katex-html');
    const need = Math.max(d.scrollWidth, html ? html.getBoundingClientRect().width : 0);
    if (need <= avail + 1) return;
    inner.style.display = 'inline-block';
    inner.style.transformOrigin = 'center top';
    inner.style.transform = 'scale(' + Math.max(0.5, avail / need) + ')';
    d.style.height = inner.getBoundingClientRect().height + 'px';
  });
}

function updateDots() {
  for (let i = 0; i < TOTAL; i++) {
    const cont = $('dots-' + i); if (!cont) continue;
    cont.innerHTML = '';
    for (const d of CURRICULUM_ORDER) {
      const btn = document.createElement('button');
      btn.className = 'pnav-dot' + (d === current ? ' active' : '');
      btn.title = LABELS[d]; btn.onclick = () => goTo(d);
      cont.appendChild(btn);
    }
  }
}

$('viewport').addEventListener('scroll', () => {
  const el = $('viewport');
  $('progress').style.width = (el.scrollTop / (el.scrollHeight - el.clientHeight) * 100) + '%';
});

function cp(btn) {
  navigator.clipboard.writeText(btn.closest('.code-wrap').querySelector('pre').innerText.trim()).then(() => {
    btn.textContent = '✓ copied'; setTimeout(() => btn.textContent = 'copy', 1600);
  });
}

/* ══════════ shared drawing helpers (same contract as the ANN deck) ══════════ */
const COL = { grid:'rgba(231,236,255,.07)', axis:'rgba(231,236,255,.45)', tick:'rgba(231,236,255,.4)',
              accent:'#22d3ee', blue:'#3b82f6', green:'#10b981', red:'#f43f5e', cyan:'#22d3ee',
              orange:'#f97316', purple:'#a78bfa', pink:'#ec4899', text:'#e7ecff', muted:'#8b93c4', surface:'#020509' };

function fitCanvas(cv, maxW = 640) {
  cv.width = Math.min(cv.parentElement.clientWidth - 28 || 560, maxW);
  return { ctx: cv.getContext('2d'), W: cv.width, H: cv.height };
}

function plotSetup(cvId, XMIN, XMAX, YMIN, YMAX, xstep = 2, ystep) {
  const cv = $(cvId), ctx = cv.getContext('2d');
  const wrap = cv.parentElement;
  cv.width = Math.min(wrap.clientWidth - 28 || 560, 640);
  const W = cv.width, H = cv.height;
  const PADL = 34, PADB = 20;
  const sx = x => PADL + (x - XMIN) / (XMAX - XMIN) * (W - PADL - 8);
  const sy = y => (H - PADB) - (y - YMIN) / (YMAX - YMIN) * (H - PADB - 8);
  if (!ystep) ystep = xstep;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) { ctx.beginPath(); ctx.moveTo(sx(gx), 8); ctx.lineTo(sx(gx), H - PADB); ctx.stroke(); }
  for (let gy = Math.ceil(YMIN / ystep - 1e-9) * ystep; gy <= YMAX + 1e-9; gy += ystep) { ctx.beginPath(); ctx.moveTo(PADL, sy(gy)); ctx.lineTo(W - 8, sy(gy)); ctx.stroke(); }
  ctx.fillStyle = COL.tick; ctx.font = '10px Courier New';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) ctx.fillText(Math.round(gx * 100) / 100, sx(gx), H - PADB + 5);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let gy = Math.ceil(YMIN / ystep - 1e-9) * ystep; gy <= YMAX + 1e-9; gy += ystep) ctx.fillText(Math.round(gy * 100) / 100, PADL - 5, sy(gy));
  return { ctx, sx, sy, W, H, XMIN, XMAX, YMIN, YMAX };
}

function haloText(ctx, txt, x, y, color) {
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.surface;
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const anims = {};
let instant = false;
function animate(id, dur, cb) {
  if (anims[id]) cancelAnimationFrame(anims[id]);
  if (instant) { cb(1); return; }
  const t0 = performance.now();
  const step = now => {
    const t = Math.min(1, Math.max(0, (now - t0) / dur));
    cb(t);
    if (t < 1) anims[id] = requestAnimationFrame(step); else delete anims[id];
  };
  anims[id] = requestAnimationFrame(step);
}
const ease = t => 1 - Math.pow(1 - t, 3);
const clamp01 = v => Math.max(0, Math.min(1, v));

/* positive → green, negative → red, scaled by m */
function divColor(v, m, alpha = 1) {
  const a = clamp01(Math.abs(v) / (m || 1));
  return v >= 0 ? `rgba(16,185,129,${(a * alpha).toFixed(3)})` : `rgba(244,63,94,${(a * alpha).toFixed(3)})`;
}

/* draw a grey/positive map (array of h*w values, channel f of F) as pixels */
function mapToCanvas(vals, h, w, F, f, mode, m) {
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const octx = off.getContext('2d'), img = octx.createImageData(w, h);
  for (let i = 0; i < h * w; i++) {
    const v = vals[i * F + f];
    let r, g, b;
    if (mode === 'div') {
      const a = clamp01(Math.abs(v) / (m || 1));
      if (v >= 0) { r = 16 * a; g = 185 * a; b = 129 * a; } else { r = 244 * a; g = 63 * a; b = 94 * a; }
    } else if (mode === 'grey') {
      r = g = b = 255 * clamp01(v / (m || 1));
    } else {
      const a = clamp01(v / (m || 1));
      r = 34 * a + 6 * (1 - a); g = 211 * a + 8 * (1 - a); b = 238 * a + 20 * (1 - a);
    }
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  return off;
}

/* ══════════ real CNN maths (shared by panels 0, 4, 5, 12) ══════════ */
/* input: flat (y*W+x)*C+c ; weights: flat (c*9+ky*3+kx)*F+f — the layout of cnn_net.js */
function conv2d(inp, H, W, C, Wt, b, F) {
  const h = H - 2, w = W - 2, out = new Float32Array(h * w * F);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * F;
    for (let f = 0; f < F; f++) out[o + f] = b ? b[f] : 0;
    for (let c = 0; c < C; c++) for (let ky = 0; ky < 3; ky++) for (let kx = 0; kx < 3; kx++) {
      const v = inp[((y + ky) * W + (x + kx)) * C + c];
      if (!v) continue;
      const wi = (c * 9 + ky * 3 + kx) * F;
      for (let f = 0; f < F; f++) out[o + f] += v * Wt[wi + f];
    }
  }
  return out;
}
const relu = a => a.map(v => v > 0 ? v : 0);
function maxpool(inp, H, W, C) {
  const h = Math.floor(H / 2), w = Math.floor(W / 2), out = new Float32Array(h * w * C);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < C; c++) {
    let m = -Infinity;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) m = Math.max(m, inp[((2 * y + dy) * W + 2 * x + dx) * C + c]);
    out[(y * w + x) * C + c] = m;
  }
  return out;
}
function cnnForward(x784) {
  const N = CNN_NET;
  const a1 = relu(conv2d(x784, 28, 28, 1, N.W1, N.b1, 8));   // 26x26x8
  const p1 = maxpool(a1, 26, 26, 8);                           // 13x13x8
  const a2 = relu(conv2d(p1, 13, 13, 8, N.W2, N.b2, 16));      // 11x11x16
  const p2 = maxpool(a2, 11, 11, 16);                          // 5x5x16 = 400
  const logits = new Array(10).fill(0);
  for (let k = 0; k < 10; k++) { let s = N.b3[k]; for (let i = 0; i < 400; i++) s += p2[i] * N.W3[i * 10 + k]; logits[k] = s; }
  const m = Math.max(...logits), e = logits.map(z => Math.exp(z - m)), S = e.reduce((a, b) => a + b, 0);
  return { a1, p1, a2, p2, probs: e.map(v => v / S) };
}
const sampleInput = d => Float32Array.from(CNN_NET.samples[d], v => v / 255);

/* ══════════ a procedural "cat photo" (no external image needed) ══════════ */
function makeCat(N) {
  const off = document.createElement('canvas'); off.width = off.height = N;
  const c = off.getContext('2d');
  c.scale(N / 64, N / 64);
  const sky = c.createLinearGradient(0, 0, 0, 64); sky.addColorStop(0, '#8ec9ef'); sky.addColorStop(1, '#d9ecc4');
  c.fillStyle = sky; c.fillRect(0, 0, 64, 64);
  c.fillStyle = '#6aa84f'; c.fillRect(0, 52, 64, 12);
  c.fillStyle = '#e8963a';
  c.beginPath(); c.ellipse(34, 62, 19, 11, 0, 0, Math.PI * 2); c.fill();             // body
  c.beginPath(); c.moveTo(15, 30); c.lineTo(17, 7); c.lineTo(29, 21); c.fill();       // left ear
  c.beginPath(); c.moveTo(51, 28); c.lineTo(50, 9); c.lineTo(38, 20); c.fill();       // right ear
  c.beginPath(); c.ellipse(33, 35, 20, 17, 0, 0, Math.PI * 2); c.fill();             // head
  c.fillStyle = '#f4a7b9';
  c.beginPath(); c.moveTo(18, 25); c.lineTo(19, 12); c.lineTo(26, 21); c.fill();
  c.beginPath(); c.moveTo(48, 24); c.lineTo(48, 14); c.lineTo(41, 20); c.fill();
  c.strokeStyle = '#b5651d'; c.lineWidth = 2;
  [[28, 19, 29, 25], [33, 18, 33, 25], [38, 19, 37, 25]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  c.fillStyle = '#fff';
  c.beginPath(); c.ellipse(25, 34, 5, 5.5, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(41, 34, 5, 5.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3c9a4f';
  c.beginPath(); c.ellipse(25, 34, 3.6, 4.4, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(41, 34, 3.6, 4.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#111';
  c.beginPath(); c.ellipse(25.5, 34, 1.3, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(41.5, 34, 1.3, 3.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e0607e';
  c.beginPath(); c.moveTo(30.5, 41); c.lineTo(35.5, 41); c.lineTo(33, 44); c.fill();
  c.strokeStyle = '#4a2a10'; c.lineWidth = 0.9;
  [[20, 43, 7, 40], [20, 45, 7, 47], [46, 43, 59, 40], [46, 45, 59, 47]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  c.beginPath(); c.moveTo(33, 44); c.lineTo(33, 46); c.quadraticCurveTo(30, 49, 28, 46); c.moveTo(33, 46); c.quadraticCurveTo(36, 49, 38, 46); c.stroke();
  c.fillStyle = '#d6324a';                                                            // yarn ball — makes flips visible
  c.beginPath(); c.arc(9, 54, 6.5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#ff8094'; c.lineWidth = 1;
  c.beginPath(); c.arc(9, 54, 4, 0.3, 2.6); c.stroke();
  const data = c.getImageData(0, 0, N, N);
  return { canvas: off, data: data.data, N };
}

/* ═══ PANEL 0: overview — a photo flowing through the lesson's CNN ═══ */
let ovMaps = null;
function buildOverviewMaps() {
  const cat = makeCat(40), N = 40;
  const grey = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) grey[i] = (cat.data[i * 4] * .3 + cat.data[i * 4 + 1] * .59 + cat.data[i * 4 + 2] * .11) / 255;
  /* four hand-made detector filters: vertical edge, horizontal edge, two diagonals */
  const K = [[1,0,-1,2,0,-2,1,0,-1],[1,2,1,0,0,0,-1,-2,-1],[0,1,2,-1,0,1,-2,-1,0],[2,1,0,1,0,-1,0,-1,-2]];
  const Wt = new Float32Array(9 * 4); K.forEach((k, f) => k.forEach((v, i) => Wt[i * 4 + f] = v));
  const c1 = relu(conv2d(grey, N, N, 1, Wt, null, 4)), n1 = N - 2;
  const q1 = maxpool(c1, n1, n1, 4), m1 = Math.floor(n1 / 2);
  const W2 = new Float32Array(9 * 4 * 4);
  for (let c = 0; c < 4; c++) for (let i = 0; i < 9; i++) for (let f = 0; f < 4; f++) W2[(c * 9 + i) * 4 + f] = K[f][i] * (c === f ? 1 : -0.25) / 3;
  const c2 = relu(conv2d(q1, m1, m1, 4, W2, null, 4)), n2 = m1 - 2;
  const q2 = maxpool(c2, n2, n2, 4), m2 = Math.floor(n2 / 2);
  const mk = (arr, n) => [0, 1, 2, 3].map(f => { let mx = 1e-6; for (let i = f; i < arr.length; i += 4) mx = Math.max(mx, arr[i]); return mapToCanvas(arr, n, n, 4, f, 'cyan', mx); });
  ovMaps = { cat: cat.canvas, c1: mk(c1, n1), q1: mk(q1, m1), c2: mk(c2, n2), q2: mk(q2, m2) };
}

function drawOverview() {
  if (!ovMaps) buildOverviewMaps();
  const start = performance.now();
  const PERIOD = 7600;
  const loop = now => {
    const cv = $('cv-overview');
    const { ctx, W, H } = fitCanvas(cv, 720);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    const t = ((now - start) % PERIOD) / PERIOD;
    const fade = t > 0.93 ? 1 - (t - 0.93) / 0.07 : 1;
    const midY = H / 2 - 12;
    const unit = Math.min(W / 640, 1.15);
    /* stage geometry: [x, size, slices] */
    const xs = [0.02, 0.17, 0.33, 0.46, 0.58, 0.70, 0.81, 0.95].map(f => f * W);
    const S = [72, 66, 40, 38, 24].map(v => v * unit);
    const starts = [0, 0.04, 0.40, 0.48, 0.56, 0.64, 0.72, 0.80];
    const vis = k => k === 0 ? 1 : clamp01((t - starts[k]) / 0.06) * fade;
    const glow = k => Math.max(0, 1 - Math.abs(t - starts[k] - 0.04) / 0.07);

    function stack(x, size, imgs, k, label, shape) {
      const v = vis(k), off = Math.max(3, size * 0.09), n = imgs.length;
      for (let i = n - 1; i >= 0; i--) {
        const px = x + i * off, py = midY - size / 2 - i * off;
        ctx.globalAlpha = 0.12 + 0.88 * v;
        ctx.fillStyle = '#0a1226'; ctx.fillRect(px, py, size, size);
        if (v > 0) { ctx.globalAlpha = v; ctx.drawImage(imgs[i], px, py, size, size); }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = `rgba(34,211,238,${0.25 + 0.6 * glow(k)})`; ctx.lineWidth = 1 + glow(k) * 1.5;
        ctx.strokeRect(px, py, size, size);
      }
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const cx = x + size / 2 + (n - 1) * off / 2;
      haloText(ctx, label, cx, midY + size / 2 + 12, k === 0 ? 'rgba(249,115,22,.9)' : 'rgba(34,211,238,.85)');
      haloText(ctx, shape, cx, midY + size / 2 + 26, 'rgba(231,236,255,.45)');
    }

    /* input image + conv1, with the scanning kernel revealing the first map */
    const sIn = S[0];
    ctx.drawImage(ovMaps.cat, xs[0], midY - sIn / 2, sIn, sIn);
    ctx.strokeStyle = 'rgba(249,115,22,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(xs[0], midY - sIn / 2, sIn, sIn);
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, 'input photo', xs[0] + sIn / 2, midY + sIn / 2 + 12, 'rgba(249,115,22,.9)');
    haloText(ctx, '64×64×3', xs[0] + sIn / 2, midY + sIn / 2 + 26, 'rgba(231,236,255,.45)');

    const scanT = clamp01((t - 0.03) / 0.32);
    const n1 = 38, steps = 12, si = Math.min(steps * steps - 1, Math.floor(scanT * steps * steps));
    const gy = Math.floor(si / steps), gx = si % steps;
    stack(xs[1], S[1], ovMaps.c1, 1, 'Conv 32 + ReLU', '62×62×32');
    /* mask the front map below the scan line until the kernel has passed */
    if (scanT < 1) {
      const off1 = Math.max(3, S[1] * 0.09);
      for (let i = 3; i >= 0; i--) {
        const px = xs[1] + i * off1, py = midY - S[1] / 2 - i * off1;
        const cell = S[1] / steps;
        ctx.fillStyle = '#0a1226';
        ctx.fillRect(px, py + (gy + 1) * cell, S[1], S[1] - (gy + 1) * cell);
        ctx.fillRect(px + (gx + 1) * cell, py + gy * cell, S[1] - (gx + 1) * cell, cell);
        ctx.strokeStyle = 'rgba(34,211,238,.3)'; ctx.lineWidth = 1; ctx.strokeRect(px, py, S[1], S[1]);
      }
      const kc = sIn / steps;
      const kx = xs[0] + gx * kc, ky = midY - sIn / 2 + gy * kc;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.strokeRect(kx - kc, ky - kc, kc * 3, kc * 3);
      const tx = xs[1] + (gx + 0.5) * S[1] / steps, ty = midY - S[1] / 2 + (gy + 0.5) * S[1] / steps;
      ctx.strokeStyle = 'rgba(251,191,36,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(kx - kc, ky - kc); ctx.lineTo(tx, ty); ctx.moveTo(kx + 2 * kc, ky + 2 * kc); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(tx, ty, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      haloText(ctx, '3×3 filter slides', xs[0] + sIn / 2, midY - sIn / 2 - 8, '#fbbf24');
    }
    stack(xs[2], S[2], ovMaps.q1, 2, 'MaxPool', '31×31×32');
    stack(xs[3], S[3], ovMaps.c2, 3, 'Conv 32 + ReLU', '29×29×32');
    stack(xs[4], S[4], ovMaps.q2, 4, 'MaxPool', '14×14×32');

    /* flatten bar */
    const fx = xs[5], fh = 150 * unit, fv = vis(5);
    ctx.globalAlpha = 0.15 + 0.85 * fv;
    for (let i = 0; i < 30; i++) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7));
      ctx.fillStyle = `rgba(34,211,238,${(a * fv).toFixed(3)})`;
      ctx.fillRect(fx, midY - fh / 2 + i * fh / 30, 9, fh / 30 - 1);
    }
    ctx.strokeStyle = `rgba(34,211,238,${0.3 + 0.6 * glow(5)})`; ctx.lineWidth = 1; ctx.strokeRect(fx - 1, midY - fh / 2 - 1, 11, fh + 1);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, 'Flatten', fx + 5, midY + fh / 2 + 6, 'rgba(34,211,238,.85)');
    haloText(ctx, '6272', fx + 5, midY + fh / 2 + 20, 'rgba(231,236,255,.45)');

    /* dense nodes + output */
    const dx = xs[6], dv = vis(6), ov = vis(7);
    const ny = Array.from({length: 6}, (_, i) => midY - 60 * unit + i * 24 * unit);
    for (let i = 0; i < 30; i += 3) for (const y of ny) {
      ctx.strokeStyle = `rgba(139,148,215,${(0.06 + 0.2 * dv).toFixed(3)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(fx + 10, midY - fh / 2 + (i + 0.5) * fh / 30); ctx.lineTo(dx, y); ctx.stroke();
    }
    const ox = xs[7] - 14;
    for (const y of ny) {
      ctx.strokeStyle = `rgba(139,148,215,${(0.08 + 0.3 * ov).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(dx, y); ctx.lineTo(ox, midY); ctx.stroke();
    }
    for (const y of ny) {
      if (glow(6) > 0.02) { ctx.beginPath(); ctx.arc(dx, y, 9 + glow(6) * 8, 0, Math.PI * 2); ctx.fillStyle = `rgba(34,211,238,${(glow(6) * .25).toFixed(3)})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(dx, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34,211,238,${(0.3 + 0.7 * dv).toFixed(3)})`; ctx.fill();
    }
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, 'Dense 128', dx, ny[5] + 14, 'rgba(34,211,238,.85)');
    if (glow(7) > 0.02 || ov > 0.5) { ctx.beginPath(); ctx.arc(ox, midY, 12 + 10 * Math.max(glow(7), 0.3 * ov), 0, Math.PI * 2); ctx.fillStyle = `rgba(244,63,94,${(0.25 * Math.max(glow(7), ov * .5)).toFixed(3)})`; ctx.fill(); }
    ctx.beginPath(); ctx.arc(ox, midY, 9, 0, Math.PI * 2); ctx.fillStyle = `rgba(244,63,94,${(0.35 + 0.65 * ov).toFixed(3)})`; ctx.fill();
    haloText(ctx, 'sigmoid', ox, midY + 16, 'rgba(244,63,94,.9)');
    if (ov > 0) {
      ctx.globalAlpha = ov; ctx.font = 'bold 12px Courier New'; ctx.textBaseline = 'bottom';
      ctx.textAlign = 'right';
      haloText(ctx, 'P(dog) < 0.5', ox + 10, midY - 16, '#fff');
      haloText(ctx, '→ "cat"', ox + 10, midY - 32, '#10b981');
      ctx.globalAlpha = 1;
    }
    /* section braces */
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.strokeStyle = 'rgba(139,148,215,.35)'; ctx.lineWidth = 1;
    const by = 8;
    ctx.beginPath(); ctx.moveTo(xs[1], by + 12); ctx.lineTo(xs[1], by + 6); ctx.lineTo(xs[5] - 14, by + 6); ctx.lineTo(xs[5] - 14, by + 12); ctx.stroke();
    haloText(ctx, 'feature extraction — "the eyes"', (xs[1] + xs[5] - 14) / 2, by - 6, 'rgba(231,236,255,.6)');
    ctx.beginPath(); ctx.moveTo(xs[5] - 4, by + 12); ctx.lineTo(xs[5] - 4, by + 6); ctx.lineTo(W - 4, by + 6); ctx.lineTo(W - 4, by + 12); ctx.stroke();
    haloText(ctx, 'classifier', (xs[5] + W) / 2, by - 6, 'rgba(231,236,255,.6)');
    ovRaf = requestAnimationFrame(loop);
  };
  ovRaf = requestAnimationFrame(loop);
}

/* ═══ PANEL 1: shift a shape, flatten it, compare ═══ */
const GLYPH = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[2,4],[3,4],[4,3],[5,3],[6,2]];
function drawShift(anim) {
  const cv = $('cv-shift');
  const offA = [1, 1], offB = [2, 3];
  const lit = off => { const s = new Set(); GLYPH.forEach(([r, c]) => s.add((r + off[0]) * 10 + c + off[1])); return s; };
  const A = lit(offA), B = lit(offB);
  let same = 0; A.forEach(i => { if (B.has(i)) same++; });
  $('out-shift').textContent = `lit pixels in each image: ${A.size}\nsame positions in both flattened rows: ${same} of ${A.size}` +
    `\n→ a Dense layer weighting these positions sees ${same ? 'almost ' : ''}no overlap between "the same" shape.`;
  const render = e => {
    const { ctx, W, H } = fitCanvas(cv);
    ctx.clearRect(0, 0, W, H);
    const cs = Math.min(13, (W - 60) / 20);
    const gA = [W * 0.25 - cs * 5, 26], gB = [W * 0.75 - cs * 5, 26];
    const stripX = 10, cw = (W - 20) / 100, sy = [196, 252];
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    haloText(ctx, 'original', gA[0] + cs * 5, 20, '#22d3ee');
    haloText(ctx, 'moved 2 right, 1 down', gB[0] + cs * 5, 20, '#f97316');
    ctx.textAlign = 'left';
    haloText(ctx, 'flattened (100 inputs)', stripX, sy[0] - 4, '#22d3ee');
    haloText(ctx, 'flattened (100 inputs)', stripX, sy[1] - 4, '#f97316');
    [[gA, A, sy[0], '#22d3ee'], [gB, B, sy[1], '#f97316']].forEach(([g, set, ys, col]) => {
      for (let i = 0; i < 100; i++) {
        const r = Math.floor(i / 10), c = i % 10;
        ctx.fillStyle = 'rgba(139,148,215,.08)';
        ctx.fillRect(g[0] + c * cs, g[1] + r * cs, cs - 1, cs - 1);
        ctx.fillRect(stripX + i * cw, ys, Math.max(1, cw - 1), 18);
      }
      for (let i = 0; i < 100; i++) {
        if (!set.has(i)) continue;
        const r = Math.floor(i / 10), c = i % 10;
        const p = ease(clamp01(e * 13 - r * 1.15));
        const x = g[0] + c * cs + (stripX + i * cw - g[0] - c * cs) * p;
        const y = g[1] + r * cs + (ys - g[1] - r * cs) * p;
        const w = cs - 1 + (Math.max(1, cw - 1) - cs + 1) * p, h = cs - 1 + (18 - cs + 1) * p;
        ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = col; ctx.globalAlpha = 0.4; ctx.fillRect(g[0] + c * cs, g[1] + r * cs, cs - 1, cs - 1); ctx.globalAlpha = 1;
      }
    });
    if (e >= 1) {
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
      A.forEach(i => { if (B.has(i)) { ctx.strokeRect(stripX + i * cw - 1, sy[0] - 1, cw + 1, sy[1] - sy[0] + 20); } });
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      haloText(ctx, `white boxes = positions lit in both: ${same}`, W / 2, sy[1] + 26, 'rgba(231,236,255,.7)');
    }
  };
  if (anim) animate('shift', 2600, render); else render(1);
}

/* ═══ PANEL 2: pixels → numbers ═══ */
let pxChannel = 'rgb', pxHover = null, cat16 = null;
function setChannel(c, btn) {
  pxChannel = c;
  document.querySelectorAll('#ch-seg button').forEach(b => b.classList.toggle('on', b === btn));
  drawPixels();
}
function drawPixels() {
  if (!cat16) {
    cat16 = makeCat(16);
    const cv = $('cv-hover');
    const pick = e => {
      const r = cv.getBoundingClientRect(), g = cv._geo; if (!g) return;
      const x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
      const c = Math.floor((x - g.x0) / g.s), rr = Math.floor((y - g.y0) / g.s);
      pxHover = (c >= 0 && c < 16 && rr >= 0 && rr < 16) ? [rr, c] : null;
      drawPixels();
    };
    cv.addEventListener('mousemove', pick);
    cv.addEventListener('click', pick);
    cv.addEventListener('mouseleave', () => { pxHover = null; drawPixels(); });
  }
  const cv = $('cv-hover');
  const { ctx, W, H } = fitCanvas(cv);
  ctx.clearRect(0, 0, W, H);
  const s = Math.floor(Math.min(H - 20, W * 0.55) / 16), x0 = 10, y0 = 10;
  cv._geo = { s, x0, y0 };
  const d = cat16.data;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
    const i = (r * 16 + c) * 4;
    let R = d[i], G = d[i + 1], B = d[i + 2];
    if (pxChannel === 'r') { G = 0; B = 0; } else if (pxChannel === 'g') { R = 0; B = 0; } else if (pxChannel === 'b') { R = 0; G = 0; }
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.fillRect(x0 + c * s, y0 + r * s, s - 1, s - 1);
  }
  /* zoomed number panel */
  const px = x0 + 16 * s + 20, pw = W - px - 6;
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  if (pxHover) {
    const [r, c] = pxHover, i = (r * 16 + c) * 4;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x0 + c * s - 1, y0 + r * s - 1, s + 1, s + 1);
    const vals = [d[i], d[i + 1], d[i + 2]];
    $('out-pixels').textContent = `pixel row ${r}, col ${c}\nR = ${vals[0]}   G = ${vals[1]}   B = ${vals[2]}\nafter rescale (÷255): ${vals.map(v => (v / 255).toFixed(3)).join('   ')}`;
    if (pw > 120) {
      /* show the 3x3 neighbourhood as numbers for the chosen channel(s) */
      const chans = pxChannel === 'rgb' ? [0, 1, 2] : [{ r: 0, g: 1, b: 2 }[pxChannel]];
      const names = ['R', 'G', 'B'], cols = ['#f87171', '#4ade80', '#60a5fa'];
      const cell = Math.min(30, (pw - 10) / 3);
      chans.forEach((ch, k) => {
        const gy = y0 + k * (cell * 3 + 22);
        haloText(ctx, `${names[ch]} channel, 3×3 around it`, px, gy, cols[ch]);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const rr = Math.min(15, Math.max(0, r + dy)), cc = Math.min(15, Math.max(0, c + dx));
          const v = d[(rr * 16 + cc) * 4 + ch];
          const bx = px + (dx + 1) * cell, by = gy + 14 + (dy + 1) * cell;
          ctx.fillStyle = `rgba(${ch === 0 ? v : 0},${ch === 1 ? v : 0},${ch === 2 ? v : 0},1)`;
          ctx.fillRect(bx, by, cell - 2, cell - 2);
          ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          haloText(ctx, String(v), bx + cell / 2 - 1, by + cell / 2 - 1, dx === 0 && dy === 0 ? '#fff' : 'rgba(231,236,255,.85)');
          ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = 'bold 11px Courier New';
        }
      });
    }
  } else {
    $('out-pixels').textContent = 'Hover (or tap) a pixel to read its three numbers.';
    if (pw > 120) {
      ctx.fillStyle = 'rgba(231,236,255,.55)';
      ['This picture is 16 × 16 × 3', '= 768 numbers.', '', 'The lesson photos are', '64 × 64 × 3 = 12,288.'].forEach((l, k) => ctx.fillText(l, px, y0 + 10 + k * 18));
    }
  }
}

/* ═══ PANEL 3: convolution step by step ═══ */
const L_IMG = [
  [0,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,0,0],
  [0,1,1,0,0,0,0,0],
  [0,1,1,0,0,0,0,0],
  [0,1,1,0,0,0,0,0],
  [0,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0]];
const KERNELS = {
  vert:  [[1,0,-1],[1,0,-1],[1,0,-1]],
  horiz: [[1,1,1],[0,0,0],[-1,-1,-1]],
  diag:  [[1,1,0],[1,0,-1],[0,-1,-1]] };
let kName = 'vert', convPos = 0, convTimer = null;
function convAt(K, r, c) { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += L_IMG[r + a][c + b] * K[a][b]; return s; }
function featureMap(K) { return Array.from({length: 6}, (_, r) => Array.from({length: 6}, (_, c) => convAt(K, r, c))); }
function setKernel(k, btn) {
  kName = k;
  document.querySelectorAll('#k-seg button').forEach(b => b.classList.toggle('on', b === btn));
  convPos = 0; if (!convTimer) toggleConv(); else drawConv();
}
function toggleConv() {
  if (convTimer) { clearInterval(convTimer); convTimer = null; $('conv-play').textContent = '▶ play'; return; }
  if (convPos >= 35) convPos = 0;
  $('conv-play').textContent = '⏸ pause';
  drawConv();
  convTimer = setInterval(() => {
    if (convPos >= 35) { clearInterval(convTimer); convTimer = null; $('conv-play').textContent = '▶ replay'; return; }
    convPos++; drawConv();
  }, 420);
}
function stepConv() {
  if (convTimer) { clearInterval(convTimer); convTimer = null; $('conv-play').textContent = '▶ play'; }
  convPos = (convPos + 1) % 36; drawConv();
}
function enterConv() { convPos = 0; drawConv(); if (!convTimer) toggleConv(); }
function drawConv() {
  const K = KERNELS[kName], fm = featureMap(K);
  const cv = $('cv-conv');
  const { ctx, W, H } = fitCanvas(cv);
  ctx.clearRect(0, 0, W, H);
  const cs = Math.floor(Math.min(32, (W - 70) / 15, (H - 40) / 8));
  const ix = 10, iy = 24, ox = ix + 8 * cs + Math.max(30, W - 20 - 14 * cs - 8 * cs * 0), oy = iy + cs;
  const oxx = Math.min(W - 6 * cs - 10, ox);
  const r0 = Math.floor(convPos / 6), c0 = convPos % 6;
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  haloText(ctx, 'input image 8×8', ix, iy - 6, '#f97316');
  haloText(ctx, 'feature map 6×6', oxx, oy - 6, '#a78bfa');
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const v = L_IMG[r][c];
    const inWin = r >= r0 && r < r0 + 3 && c >= c0 && c < c0 + 3;
    ctx.fillStyle = v ? 'rgba(249,115,22,.55)' : 'rgba(139,148,215,.07)';
    ctx.fillRect(ix + c * cs, iy + r * cs, cs - 2, cs - 2);
    ctx.font = `bold ${Math.round(cs * 0.4)}px Courier New`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = v ? '#fff' : 'rgba(231,236,255,.35)';
    ctx.fillText(v, ix + c * cs + cs / 2 - 1, iy + r * cs + cs / 2 - (inWin ? 3 : 1));
    if (inWin) {
      const kv = K[r - r0][c - c0];
      ctx.font = `bold ${Math.round(cs * 0.28)}px Courier New`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = kv > 0 ? '#34d399' : kv < 0 ? '#fb7185' : 'rgba(231,236,255,.5)';
      ctx.fillText((kv > 0 ? '×' : '×') + kv, ix + c * cs + cs - 4, iy + r * cs + cs - 3);
    }
  }
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
  ctx.strokeRect(ix + c0 * cs - 2, iy + r0 * cs - 2, 3 * cs + 2, 3 * cs + 2);
  /* output map */
  let mx = 1; fm.flat().forEach(v => mx = Math.max(mx, Math.abs(v)));
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const k = r * 6 + c, done = k <= convPos;
    ctx.fillStyle = done ? divColor(fm[r][c], mx, 0.85) : 'rgba(139,148,215,.07)';
    if (done && fm[r][c] === 0) ctx.fillStyle = 'rgba(139,148,215,.16)';
    ctx.fillRect(oxx + c * cs, oy + r * cs, cs - 2, cs - 2);
    if (done) {
      ctx.font = `bold ${Math.round(cs * 0.38)}px Courier New`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText(fm[r][c], oxx + c * cs + cs / 2 - 1, oy + r * cs + cs / 2 - 1);
    }
  }
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
  ctx.strokeRect(oxx + c0 * cs - 2, oy + r0 * cs - 2, cs + 2, cs + 2);
  ctx.strokeStyle = 'rgba(251,191,36,.45)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ix + (c0 + 3) * cs, iy + r0 * cs); ctx.lineTo(oxx + c0 * cs, oy + r0 * cs);
  ctx.moveTo(ix + (c0 + 3) * cs, iy + (r0 + 3) * cs); ctx.lineTo(oxx + c0 * cs, oy + (r0 + 1) * cs);
  ctx.stroke();
  /* kernel legend */
  const kx = oxx, ky = oy + 6 * cs + 14, kc = Math.min(18, cs * 0.6);
  if (ky + 3 * kc < H) {
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    haloText(ctx, 'filter', kx, ky + kc * 1.5, '#fbbf24');
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const v = K[a][b];
      ctx.fillStyle = divColor(v, 1, 0.7); if (!v) ctx.fillStyle = 'rgba(139,148,215,.15)';
      ctx.fillRect(kx + 44 + b * kc, ky + a * kc, kc - 1, kc - 1);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(v, kx + 44 + b * kc + kc / 2, ky + a * kc + kc / 2);
      ctx.textAlign = 'left';
    }
  }
  /* arithmetic */
  const terms = [];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const p = L_IMG[r0 + a][c0 + b], k = K[a][b];
    if (k !== 0) terms.push(`${p}·(${k})`);
  }
  $('out-conv').textContent = `position (row ${r0}, col ${c0}) — window covers rows ${r0}–${r0 + 2}, cols ${c0}–${c0 + 2}\n` +
    `${terms.join(' + ')}  (zero weights skipped)\n= ${fm[r0][c0]}  → written to feature map [${r0}, ${c0}]`;
}

/* ═══ PANEL 4: real learned filters on a digit ═══ */
let fmDigit = 3, fmRelu = true;
function setFmRelu(on, btn) { fmRelu = on; document.querySelectorAll('#relu-seg button').forEach(b => b.classList.toggle('on', b === btn)); drawFmaps(false); }
function buildDigitButtons(id, cb) {
  const el = $(id); if (el.childElementCount) return;
  for (let d = 0; d < 10; d++) { const b = document.createElement('button'); b.textContent = d; b.onclick = () => cb(d); el.appendChild(b); }
}
function drawFmaps(anim) {
  buildDigitButtons('fm-digits', d => { fmDigit = d; drawFmaps(true); });
  const x = sampleInput(fmDigit);
  const raw = conv2d(x, 28, 28, 1, CNN_NET.W1, CNN_NET.b1, 8);
  const W1 = CNN_NET.W1; let wm = 0; W1.forEach(v => wm = Math.max(wm, Math.abs(v)));
  const cv = $('cv-fmaps');
  const maps = [];
  for (let f = 0; f < 8; f++) {
    let m = 1e-6; for (let i = f; i < raw.length; i += 8) m = Math.max(m, fmRelu ? raw[i] : Math.abs(raw[i]));
    maps.push(mapToCanvas(raw, 26, 26, 8, f, fmRelu ? 'cyan' : 'div', m));
  }
  const inCv = mapToCanvas(x, 28, 28, 1, 0, 'grey', 1);
  const render = e => {
    const { ctx, W, H } = fitCanvas(cv);
    ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
    const narrow = W < 460;
    const inS = narrow ? 84 : 112;
    ctx.drawImage(inCv, 10, 24, inS, inS);
    ctx.strokeStyle = 'rgba(249,115,22,.6)'; ctx.strokeRect(10, 24, inS, inS);
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    haloText(ctx, 'input 28×28', 10, 20, '#f97316');
    const scanY = 24 + inS * e;
    if (e < 1) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, scanY); ctx.lineTo(10 + inS, scanY); ctx.stroke(); }
    const rx = 10 + inS + 18, colW = (W - rx - 4) / 4;
    const kc = Math.min(9, colW / 6), ms = Math.min(colW - 8, (H - 30) / 2 - 3 * kc - 14);
    for (let f = 0; f < 8; f++) {
      const gx = rx + (f % 4) * colW, gy = 6 + Math.floor(f / 4) * (H / 2);
      /* kernel */
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        ctx.fillStyle = divColor(W1[(a * 3 + b) * 8 + f], wm, 1);
        ctx.fillRect(gx + b * kc, gy + a * kc, kc - 1, kc - 1);
      }
      ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      haloText(ctx, `filter ${f + 1}`, gx + 3 * kc + 5, gy + 1.5 * kc, 'rgba(231,236,255,.6)');
      const my = gy + 3 * kc + 6;
      ctx.fillStyle = '#060a18'; ctx.fillRect(gx, my, ms, ms);
      ctx.save(); ctx.beginPath(); ctx.rect(gx, my, ms, ms * e); ctx.clip();
      ctx.drawImage(maps[f], gx, my, ms, ms); ctx.restore();
      ctx.strokeStyle = 'rgba(139,148,215,.3)'; ctx.lineWidth = 1; ctx.strokeRect(gx, my, ms, ms);
      if (e < 1) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, my + ms * e); ctx.lineTo(gx + ms, my + ms * e); ctx.stroke(); }
    }
  };
  if (anim) animate('fmaps', 1300, render); else render(1);
}

/* ═══ PANEL 5: max pooling on the panel-3 feature map ═══ */
let poolTimer = null, poolPos = 9;
function enterPool() { playPool(); }
function playPool() {
  if (poolTimer) clearInterval(poolTimer);
  poolPos = 0; drawPool();
  poolTimer = setInterval(() => { poolPos++; drawPool(); if (poolPos >= 9) { clearInterval(poolTimer); poolTimer = null; } }, 750);
}
function drawPool() {
  const fm = featureMap(KERNELS[kName]).map(r => r.map(v => Math.max(0, v)));
  const pooled = [0, 1, 2].map(r => [0, 1, 2].map(c => Math.max(fm[2 * r][2 * c], fm[2 * r][2 * c + 1], fm[2 * r + 1][2 * c], fm[2 * r + 1][2 * c + 1])));
  const cv = $('cv-pool');
  const { ctx, W, H } = fitCanvas(cv);
  ctx.clearRect(0, 0, W, H);
  const cs = Math.floor(Math.min(36, (W - 80) / 10, (H - 40) / 6));
  const ix = 10, iy = 28, ox = Math.min(W - 3 * cs * 1.4 - 10, ix + 6 * cs + 70), oy = iy + 1.5 * cs, os = cs * 1.4;
  let mx = 1; fm.flat().forEach(v => mx = Math.max(mx, v));
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  haloText(ctx, `ReLU(feature map) 6×6 — ${({vert:'vertical',horiz:'horizontal',diag:'diagonal'})[kName]} filter`, ix, iy - 8, '#a78bfa');
  haloText(ctx, 'pooled 3×3', ox, oy - 8, '#3b82f6');
  const pr = Math.floor(Math.min(poolPos, 8) / 3), pc = Math.min(poolPos, 8) % 3, active = poolPos < 9;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const v = fm[r][c];
    ctx.fillStyle = v ? `rgba(34,211,238,${(0.15 + 0.7 * v / mx).toFixed(3)})` : 'rgba(139,148,215,.07)';
    ctx.fillRect(ix + c * cs, iy + r * cs, cs - 2, cs - 2);
    const inWin = active && Math.floor(r / 2) === pr && Math.floor(c / 2) === pc;
    const isMax = inWin && v === pooled[pr][pc];
    ctx.font = `bold ${Math.round(cs * 0.38)}px Courier New`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = isMax ? '#fbbf24' : (v ? '#fff' : 'rgba(231,236,255,.3)');
    ctx.fillText(v, ix + c * cs + cs / 2 - 1, iy + r * cs + cs / 2 - 1);
  }
  ctx.strokeStyle = 'rgba(139,148,215,.35)'; ctx.lineWidth = 1;
  for (let k = 1; k < 3; k++) {
    ctx.beginPath(); ctx.moveTo(ix + 2 * k * cs - 1, iy); ctx.lineTo(ix + 2 * k * cs - 1, iy + 6 * cs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix, iy + 2 * k * cs - 1); ctx.lineTo(ix + 6 * cs, iy + 2 * k * cs - 1); ctx.stroke();
  }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const done = r * 3 + c < poolPos || (!active);
    const cur = active && r === pr && c === pc;
    ctx.fillStyle = (done || cur) && pooled[r][c] ? `rgba(59,130,246,${(0.25 + 0.6 * pooled[r][c] / mx).toFixed(3)})` : 'rgba(139,148,215,.07)';
    ctx.fillRect(ox + c * os, oy + r * os, os - 2, os - 2);
    if (done || cur) {
      ctx.font = `bold ${Math.round(os * 0.36)}px Courier New`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = cur ? '#fbbf24' : '#fff'; ctx.fillText(pooled[r][c], ox + c * os + os / 2 - 1, oy + r * os + os / 2 - 1);
    }
  }
  if (active) {
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
    ctx.strokeRect(ix + 2 * pc * cs - 2, iy + 2 * pr * cs - 2, 2 * cs + 2, 2 * cs + 2);
    ctx.strokeRect(ox + pc * os - 2, oy + pr * os - 2, os + 2, os + 2);
    ctx.strokeStyle = 'rgba(251,191,36,.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ix + 2 * (pc + 1) * cs, iy + 2 * pr * cs + cs); ctx.lineTo(ox + pc * os, oy + pr * os + os / 2); ctx.stroke();
    const vals = [fm[2 * pr][2 * pc], fm[2 * pr][2 * pc + 1], fm[2 * pr + 1][2 * pc], fm[2 * pr + 1][2 * pc + 1]];
    $('out-pool').textContent = `block (${pr}, ${pc}):  max(${vals.join(', ')}) = ${pooled[pr][pc]}\n36 numbers in → 9 numbers out. Nothing learned, nothing multiplied — just "keep the biggest".`;
  } else {
    $('out-pool').textContent = `done: 6×6 → 3×3. Every strong response survived; the zeros between them are gone.\n(Change the filter on panel 03 and this map changes with it.)`;
  }
}

/* ═══ PANEL 6: the lesson architecture ═══ */
const ARCH = [
  { name:'Input', shape:'(64, 64, 3)', hw:64, ch:3, params:0, how:'A 64×64 colour photo, rescaled to 0–1.', col:'#f97316' },
  { name:'Conv2D 32', shape:'(62, 62, 32)', hw:62, ch:32, params:896, how:'32 filters, each 3×3×3 + bias → (27+1)·32 = 896. 64−3+1 = 62.', col:'#22d3ee' },
  { name:'MaxPool', shape:'(31, 31, 32)', hw:31, ch:32, params:0, how:'2×2 max, stride 2 → 62/2 = 31. No weights.', col:'#3b82f6' },
  { name:'Conv2D 32', shape:'(29, 29, 32)', hw:29, ch:32, params:9248, how:'32 filters, each 3×3×32 (it sees all 32 maps) + bias → (288+1)·32 = 9,248.', col:'#22d3ee' },
  { name:'MaxPool', shape:'(14, 14, 32)', hw:14, ch:32, params:0, how:'⌊29/2⌋ = 14. The 29th row/column is dropped.', col:'#3b82f6' },
  { name:'Flatten', shape:'(6272,)', hw:0, ch:6272, params:0, how:'14·14·32 = 6,272 numbers in one row. No weights.', col:'#a78bfa' },
  { name:'Dense 128', shape:'(128,)', hw:0, ch:128, params:802944, how:'Every one of 6,272 inputs to each of 128 neurons: 6272·128 + 128 = 802,944.', col:'#10b981' },
  { name:'Dense 1', shape:'(1,)', hw:0, ch:1, params:129, how:'128 weights + 1 bias, sigmoid → P(dog).', col:'#f43f5e' }];
let archSel = 6;
function drawArch() {
  const cv = $('cv-arch');
  if (!cv._wired) {
    cv._wired = true;
    cv.style.cursor = 'pointer';
    cv.addEventListener('click', e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width;
      const xs = cv._xs || []; let best = 0, bd = 1e9;
      xs.forEach((cx, i) => { const d = Math.abs(cx - x); if (d < bd) { bd = d; best = i; } });
      archSel = best; drawArch();
    });
  }
  const { ctx, W, H } = fitCanvas(cv, 720);
  ctx.clearRect(0, 0, W, H);
  const n = ARCH.length, slot = (W - 10) / n, base = H / 2 - 10;
  cv._xs = ARCH.map((_, i) => 5 + slot * (i + 0.5));
  ARCH.forEach((L, i) => {
    const cx = cv._xs[i], sel = i === archSel;
    ctx.globalAlpha = sel ? 1 : 0.7;
    if (L.hw) {
      const s = Math.max(14, Math.sqrt(L.hw / 64) * Math.min(slot * 0.75, 90));
      const depth = Math.min(slot * 0.32, 4 + Math.log2(L.ch) * 4);
      const x = cx - (s + depth) / 2, y = base - s / 2 + depth / 2;
      ctx.fillStyle = L.col + '33'; ctx.strokeStyle = L.col; ctx.lineWidth = sel ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + depth, y - depth); ctx.lineTo(x + depth + s, y - depth); ctx.lineTo(x + s, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + s + depth, y - depth); ctx.lineTo(x + s + depth, y - depth + s); ctx.lineTo(x + s, y + s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = L.col + '55'; ctx.fillRect(x, y, s, s); ctx.strokeRect(x, y, s, s);
    } else if (L.name === 'Flatten') {
      const h = Math.min(H - 90, 170);
      ctx.fillStyle = L.col + '44'; ctx.strokeStyle = L.col; ctx.lineWidth = sel ? 2 : 1;
      ctx.fillRect(cx - 5, base - h / 2, 10, h); ctx.strokeRect(cx - 5, base - h / 2, 10, h);
    } else {
      const k = L.ch === 1 ? 1 : 7;
      for (let j = 0; j < k; j++) {
        const y = base + (j - (k - 1) / 2) * 20;
        ctx.beginPath(); ctx.arc(cx, y, 7, 0, Math.PI * 2); ctx.fillStyle = L.col; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.font = `bold ${slot < 70 ? 8 : 10}px Courier New`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, L.name, cx, H - 52, sel ? L.col : 'rgba(231,236,255,.6)');
    haloText(ctx, L.shape.replace(/[()]/g, ''), cx, H - 38, 'rgba(231,236,255,.45)');
    haloText(ctx, L.params ? L.params.toLocaleString() : '0', cx, H - 22, L.params ? '#fbbf24' : 'rgba(231,236,255,.3)');
    if (sel) { ctx.strokeStyle = L.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - slot * 0.4, H - 56); ctx.lineTo(cx + slot * 0.4, H - 56); ctx.stroke(); }
  });
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'params ↓', 4, H - 22, 'rgba(251,191,36,.6)');
  const L = ARCH[archSel];
  $('out-arch').textContent = `${L.name}  →  output ${L.shape}   ·   ${L.params.toLocaleString()} parameters\n${L.how}`;
  /* parameter share bar (HTML) */
  const bar = $('param-bar');
  if (!bar.childElementCount) {
    const total = 813217;
    const parts = [['Conv2D #1', 896, '#22d3ee'], ['Conv2D #2', 9248, '#3b82f6'], ['Dense 128', 802944, '#10b981'], ['Dense 1', 129, '#f43f5e']];
    bar.innerHTML = parts.map(([n, p, c]) => `<div style="width:${(p / total * 100).toFixed(3)}%;background:${c}" title="${n}: ${p.toLocaleString()}">${p / total > 0.2 ? n + ' · ' + (p / total * 100).toFixed(1) + '%' : ''}</div>`).join('');
    $('param-legend').innerHTML = parts.map(([n, p, c]) => `<span><i style="background:${c}"></i>${n}: ${p.toLocaleString()} (${(p / total * 100).toFixed(2)}%)</span>`).join('');
  }
}

/* ═══ PANEL 7: flatten order ═══ */
function drawFlatten(anim) {
  const cv = $('cv-flatten');
  const CH = ['#f87171', '#4ade80', '#60a5fa'];
  const render = e => {
    const { ctx, W, H } = fitCanvas(cv);
    ctx.clearRect(0, 0, W, H);
    const cs = Math.min(30, (W - 60) / 12), gap = cs * 0.9;
    const gx = c => (W - (9 * cs + 2 * gap)) / 2 + c * (3 * cs + gap);
    const gy = 26;
    const sw = (W - 20) / 27, sy = H - 50;
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ['channel 0', 'channel 1', 'channel 2'].forEach((t, c) => haloText(ctx, t, gx(c) + 1.5 * cs, gy - 4, CH[c]));
    for (let i = 0; i < 27; i++) { ctx.fillStyle = 'rgba(139,148,215,.08)'; ctx.fillRect(10 + i * sw, sy, sw - 1, 26); }
    ctx.textAlign = 'left'; haloText(ctx, 'flattened: 27 numbers', 10, sy - 4, 'rgba(231,236,255,.6)');
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) for (let c = 0; c < 3; c++) {
      const idx = (y * 3 + x) * 3 + c;
      const p = ease(clamp01(e * 30 - idx));
      const x0 = gx(c) + x * cs, y0 = gy + y * cs;
      ctx.fillStyle = CH[c] + '40'; ctx.fillRect(x0, y0, cs - 2, cs - 2);
      const X = x0 + (10 + idx * sw - x0) * p, Y = y0 + (sy - y0) * p;
      const w = cs - 2 + (sw - 1 - cs + 2) * p, h = cs - 2 + (26 - cs + 2) * p;
      ctx.fillStyle = CH[c] + (p > 0 && p < 1 ? 'ff' : 'bb'); ctx.fillRect(X, Y, w, h);
      if (w > 14) {
        ctx.font = `bold ${Math.max(8, Math.min(10, w / 3))}px Courier New`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#08101f'; ctx.fillText(`${y},${x}`, X + w / 2, Y + h / 2);
      }
    }
    if (e >= 1) {
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      haloText(ctx, 'labels = (row, col) · colour = channel → all channels of one position sit side by side', W / 2, sy + 32, 'rgba(231,236,255,.6)');
    }
  };
  if (anim) animate('flatten', 3200, render); else render(1);
}

/* ═══ PANEL 8: augmentation, the way Keras' ImageDataGenerator does it ═══ */
let cat64 = null, shearRange = 0.2, augSeed = 7;
function setShear(v, btn) { shearRange = v; document.querySelectorAll('#shear-seg button').forEach(b => b.classList.toggle('on', b === btn)); drawAug(false); }
function augment(src, rnd) {
  const N = 64;
  const shearDeg = (rnd() * 2 - 1) * shearRange;
  const zx = 0.8 + rnd() * 0.4, zy = 0.8 + rnd() * 0.4;
  const flip = rnd() < 0.5;
  const sh = shearDeg * Math.PI / 180;
  /* Keras: M = shear @ zoom, applied in (row, col) about the centre; input = M · output */
  const m00 = zx, m01 = -Math.sin(sh) * zy, m11 = Math.cos(sh) * zy;
  const o = N / 2 - 0.5;
  const out = new Uint8ClampedArray(N * N * 4);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const rr = r - o, cc = c - o;
    let ri = m00 * rr + m01 * cc + o, ci = m11 * cc + o;
    ri = Math.min(N - 1, Math.max(0, ri)); ci = Math.min(N - 1, Math.max(0, ci));   // fill_mode='nearest'
    const r0 = Math.floor(ri), c0 = Math.floor(ci), r1 = Math.min(N - 1, r0 + 1), c1 = Math.min(N - 1, c0 + 1);
    const fr = ri - r0, fc = ci - c0;
    const oc = flip ? N - 1 - c : c;
    for (let k = 0; k < 3; k++) {
      const v = src[(r0 * N + c0) * 4 + k] * (1 - fr) * (1 - fc) + src[(r0 * N + c1) * 4 + k] * (1 - fr) * fc +
                src[(r1 * N + c0) * 4 + k] * fr * (1 - fc) + src[(r1 * N + c1) * 4 + k] * fr * fc;
      out[(r * N + oc) * 4 + k] = v;
    }
    out[(r * N + oc) * 4 + 3] = 255;
  }
  const off = document.createElement('canvas'); off.width = off.height = N;
  off.getContext('2d').putImageData(new ImageData(out, N, N), 0, 0);
  return { canvas: off, shearDeg, zx, zy, flip };
}
function drawAug(newBatch) {
  if (!cat64) cat64 = makeCat(64);
  if (newBatch) augSeed++;
  const rnd = mulberry32(augSeed * 9973);
  const cv = $('cv-aug');
  const cols = $('cv-aug').parentElement.clientWidth < 460 ? 2 : 4;
  cv.height = cols === 2 ? 4 * 150 + 10 : 330;
  const { ctx, W, H } = fitCanvas(cv);
  ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  const tile = Math.min((W - 10 * (cols + 1)) / cols, 128);
  const rowH = tile + 34;
  const x0 = (W - cols * tile - (cols - 1) * 10) / 2;
  for (let i = 0; i < 8; i++) {
    const x = x0 + (i % cols) * (tile + 10), y = 6 + Math.floor(i / cols) * rowH;
    let a, lab1, lab2;
    if (i === 0) { a = { canvas: cat64.canvas }; lab1 = 'original'; lab2 = '64×64'; }
    else {
      a = augment(cat64.data, rnd);
      lab1 = `shear ${a.shearDeg >= 0 ? '+' : ''}${a.shearDeg.toFixed(shearRange < 1 ? 2 : 1)}°${a.flip ? ' · flip' : ''}`;
      lab2 = `zoom ${a.zx.toFixed(2)} × ${a.zy.toFixed(2)}`;
    }
    ctx.drawImage(a.canvas, x, y, tile, tile);
    ctx.strokeStyle = i === 0 ? 'rgba(249,115,22,.8)' : 'rgba(139,148,215,.35)'; ctx.lineWidth = i === 0 ? 2 : 1; ctx.strokeRect(x, y, tile, tile);
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, lab1, x + tile / 2, y + tile + 4, i === 0 ? '#f97316' : 'rgba(231,236,255,.75)');
    haloText(ctx, lab2, x + tile / 2, y + tile + 16, 'rgba(231,236,255,.45)');
  }
}

/* ═══ PANEL 10: the notebook's training log ═══ */
const LOG = [ // epoch, acc, loss, val_acc, val_loss — copied from the notebook output
  [1,.5533,.6855,.5960,.6747],[2,.6399,.6449,.6340,.6437],[3,.6831,.5955,.7045,.5766],[4,.7195,.5516,.7270,.5455],
  [5,.7424,.5234,.7600,.5082],[6,.7548,.4958,.7635,.5073],[7,.7680,.4780,.7205,.5579],[8,.7795,.4654,.7095,.5612],
  [9,.7904,.4388,.7570,.4991],[10,.7950,.4282,.7795,.4674],[11,.8071,.4114,.7780,.4689],[12,.8205,.3893,.7530,.5235],
  [13,.8246,.3827,.7745,.4706],[14,.8326,.3739,.7910,.4564],[15,.8500,.3450,.7865,.4944],[16,.8550,.3350,.7745,.5105],
  [17,.8593,.3199,.7780,.4979],[18,.8740,.2948,.7905,.5324],[19,.8735,.2923,.7890,.5086],[20,.8860,.2710,.7890,.4931],
  [21,.8946,.2535,.7885,.5158],[22,.9043,.2412,.7695,.6354],[23,.9055,.2294,.7895,.5539],[24,.9107,.2192,.7915,.5517],
  [25,.9140,.2143,.7880,.5384]];
let curveMode = 'acc';
function setCurve(m, btn) { curveMode = m; document.querySelectorAll('#curve-seg button').forEach(b => b.classList.toggle('on', b === btn)); drawCurve(); }
function drawCurve() {
  const acc = curveMode === 'acc';
  const tr = acc ? 1 : 2, va = acc ? 3 : 4;
  $('out-curve').textContent = acc
    ? 'accuracy: training climbs steadily 55% → 91%; validation stalls near 78–79% from epoch ~10.\nThe widening gap between the two lines is the overfitting.'
    : 'loss: training falls every epoch (0.69 → 0.21). Validation is lowest at epoch 14 (0.456), then rises.\nThe dashed line marks the epoch EarlyStopping would keep.';
  animate('curve', 1500, e => {
    const p = acc ? plotSetup('cv-curve', 0, 25.5, 0.5, 1.0, 5, 0.1) : plotSetup('cv-curve', 0, 25.5, 0.1, 0.8, 5, 0.1);
    const { ctx, sx, sy, H } = p;
    const upto = 1 + e * 24;
    if (!acc) {
      ctx.fillStyle = 'rgba(244,63,94,.06)'; ctx.fillRect(sx(14), 8, sx(25.5) - sx(14), H - 28);
      ctx.strokeStyle = 'rgba(251,191,36,.7)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(14), 8); ctx.lineTo(sx(14), H - 20); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      haloText(ctx, 'best val_loss · epoch 14', sx(14) + 5, 12, '#fbbf24');
      haloText(ctx, 'overfitting zone →', sx(14) + 5, 26, 'rgba(244,63,94,.8)');
    } else {
      /* shade the gap */
      ctx.fillStyle = 'rgba(244,63,94,.08)'; ctx.beginPath();
      LOG.forEach((r, i) => { if (r[0] > upto) return; i ? ctx.lineTo(sx(r[0]), sy(r[tr])) : ctx.moveTo(sx(r[0]), sy(r[tr])); });
      for (let i = LOG.length - 1; i >= 0; i--) { const r = LOG[i]; if (r[0] > upto) continue; ctx.lineTo(sx(r[0]), sy(r[va])); }
      ctx.closePath(); ctx.fill();
    }
    [[tr, '#22d3ee'], [va, '#f97316']].forEach(([k, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
      LOG.forEach((r, i) => {
        if (r[0] > Math.ceil(upto)) return;
        let x = r[0], y = r[k];
        if (r[0] > upto) { const pr = LOG[i - 1], f = upto - pr[0]; x = pr[0] + f; y = pr[k] + (r[k] - pr[k]) * f; }
        i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y));
      });
      ctx.stroke();
      LOG.forEach(r => { if (r[0] > upto) return; ctx.beginPath(); ctx.arc(sx(r[0]), sy(r[k]), 2.4, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); });
    });
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    haloText(ctx, 'epoch', p.W - 10, H - 22, 'rgba(231,236,255,.45)');
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (acc) haloText(ctx, 'accuracy', 38, 10, 'rgba(231,236,255,.45)');
  });
}

/* ═══ PANEL 11: predicting one photo ═══ */
let predTimer = null;
function enterPredict() { drawSig(); playPredict(); }
function playPredict() {
  const steps = [...document.querySelectorAll('#pipe .pipe-step')];
  if (predTimer) clearInterval(predTimer);
  steps.forEach(s => s.classList.remove('on', 'now'));
  let k = 0;
  const tick = () => {
    steps.forEach((s, i) => { s.classList.toggle('on', i <= k); s.classList.toggle('now', i === k); });
    k++;
    if (k >= steps.length) { clearInterval(predTimer); predTimer = null; setTimeout(() => steps.forEach(s => s.classList.remove('now')), 900); drawSig(true); }
  };
  tick(); predTimer = setInterval(tick, 800);
}
function drawSig(anim) {
  const cv = $('cv-sig');
  const render = e => {
    const { ctx, W, H } = fitCanvas(cv);
    ctx.clearRect(0, 0, W, H);
    const x0 = 30, x1 = W - 30, y = H / 2 + 10;
    const sx = p => x0 + p * (x1 - x0);
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(167,139,250,.55)'); g.addColorStop(0.5, 'rgba(139,148,215,.12)'); g.addColorStop(1, 'rgba(249,115,22,.55)');
    ctx.fillStyle = g; ctx.fillRect(x0, y - 10, x1 - x0, 20);
    ctx.strokeStyle = '#fbbf24'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx(0.5), y - 60); ctx.lineTo(sx(0.5), y + 40); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(p => haloText(ctx, String(p), sx(p), y + 16, 'rgba(231,236,255,.45)'));
    haloText(ctx, 'threshold 0.5', sx(0.5), y + 42, '#fbbf24');
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'left'; haloText(ctx, '← cat (class 0)', x0, y - 34, '#a78bfa');
    ctx.textAlign = 'right'; haloText(ctx, 'dog (class 1) →', x1, y - 34, '#f97316');
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    haloText(ctx, 'model output = P(dog)', W / 2, 14, 'rgba(231,236,255,.55)');
    const pts = [[0.9999995, 'photo 1 → dog 100.00%', '#f97316', -1], [0.2344933, 'photo 2 → cat 76.55%', '#a78bfa', 1]];
    pts.forEach(([p, lab, col, side], i) => {
      const pe = 0.5 + (p - 0.5) * ease(clamp01(e * 1.6 - i * 0.4));
      const X = sx(pe);
      ctx.beginPath(); ctx.arc(X, y, 8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.stroke();
      ctx.font = 'bold 11px Courier New'; ctx.textBaseline = side < 0 ? 'bottom' : 'top';
      ctx.textAlign = X > W - 120 ? 'right' : X < 120 ? 'left' : 'center';
      haloText(ctx, `${lab}  (p=${p})`, X, side < 0 ? y - 62 : y + 62, col);
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, y + side * 10); ctx.lineTo(X, y + side * 58); ctx.stroke();
    });
  };
  if (anim) animate('sig', 1400, render); else render(1);
}

/* ═══ PANEL 12: live CNN ═══ */
let live = null;
function enterLive() {
  if (!live) initLive();
  drawLive();
}
function initLive() {
  live = { input: sampleInput(3), drawn: false };
  $('live-acc').textContent = `→ ${(CNN_NET.acc * 100).toFixed(1)}% test accuracy on 10,000 unseen digits`;
  buildDigitButtons('live-digits', d => { live.input = sampleInput(d); live.drawn = false; paintSampleOnDraw(); runLive(); });
  const cv = $('cv-draw'), ctx = cv.getContext('2d');
  let painting = false, last = null, tmr = null;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return [(t.clientX - r.left) * cv.width / r.width, (t.clientY - r.top) * cv.height / r.height]; };
  const stroke = p => {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...(last || p)); ctx.lineTo(...p); ctx.stroke(); last = p;
    if (!tmr) tmr = setTimeout(() => { tmr = null; preprocessDrawing(); runLive(); }, 70);
  };
  const startDraw = e => {
    if (!live.drawn) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height); live.drawn = true; }
    painting = true; last = null; stroke(pos(e));
  };
  cv.addEventListener('mousedown', startDraw);
  cv.addEventListener('mousemove', e => { if (painting) stroke(pos(e)); });
  window.addEventListener('mouseup', () => { if (painting) { painting = false; preprocessDrawing(); runLive(); } });
  cv.addEventListener('touchstart', e => { startDraw(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', e => { if (painting) stroke(pos(e)); e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', () => { painting = false; preprocessDrawing(); runLive(); });
  paintSampleOnDraw();
}
function paintSampleOnDraw() {
  const cv = $('cv-draw'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(mapToCanvas(live.input, 28, 28, 1, 0, 'grey', 1), 0, 0, cv.width, cv.height);
}
function clearDraw() {
  const cv = $('cv-draw'), ctx = cv.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  live.drawn = true; live.input = new Float32Array(784);
  runLive();
}
/* MNIST-style preprocessing: crop to the ink, fit into 20×20, centre by centre of mass in 28×28 */
function preprocessDrawing() {
  const cv = $('cv-draw'), W = cv.width, H = cv.height;
  const d = cv.getContext('2d').getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { live.input = new Float32Array(784); return; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = 20 / Math.max(bw, bh);
  const off = document.createElement('canvas'); off.width = off.height = 28;
  const o = off.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, 28, 28);
  o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
  o.drawImage(cv, x0, y0, bw, bh, (28 - bw * sc) / 2, (28 - bh * sc) / 2, bw * sc, bh * sc);
  const g = o.getImageData(0, 0, 28, 28).data;
  const a = new Float32Array(784); let m = 0, cx = 0, cy = 0;
  for (let i = 0; i < 784; i++) { a[i] = g[i * 4] / 255; m += a[i]; cx += a[i] * (i % 28); cy += a[i] * Math.floor(i / 28); }
  const sx = Math.round(14 - cx / m), sy = Math.round(14 - cy / m);
  const out = new Float32Array(784);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    const X = x - sx, Y = y - sy;
    if (X >= 0 && X < 28 && Y >= 0 && Y < 28) out[y * 28 + x] = a[Y * 28 + X];
  }
  live.input = out;
}
function runLive() { live.res = cnnForward(live.input); drawLive(); }
function drawLive() {
  if (!live.res) live.res = cnnForward(live.input);
  const { a1, a2, p2, probs } = live.res;
  const empty = !live.input.some(v => v > 0.05);
  /* what the CNN sees */
  const c28 = $('cv-in28'), x28 = c28.getContext('2d');
  x28.imageSmoothingEnabled = false; x28.clearRect(0, 0, 112, 112);
  x28.drawImage(mapToCanvas(live.input, 28, 28, 1, 0, 'grey', 1), 0, 0, 112, 112);
  /* output */
  const best = probs.indexOf(Math.max(...probs));
  $('live-out').textContent = empty ? 'Draw a digit.' : `prediction: ${best}   (${(probs[best] * 100).toFixed(1)}% sure)`;
  $('live-bars').innerHTML = probs.map((p, k) => `<div class="bar-row${!empty && k === best ? ' top' : ''}"><span class="bar-lbl">${k}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${empty ? 0 : (p * 100).toFixed(1)}%"></span></span><span class="bar-val">${empty ? '' : (p * 100).toFixed(1) + '%'}</span></div>`).join('');
  /* inside the network */
  const cv = $('cv-live');
  const wrapW = Math.min(cv.parentElement.clientWidth - 28 || 560, 720);
  const s1 = Math.min(72, (wrapW - 7 * 8) / 8), s2 = Math.min(52, (wrapW - 7 * 6) / 8);
  const H = 24 + s1 + 34 + 2 * s2 + 6 + 34 + 26 + 10;
  cv.height = H;
  const { ctx, W } = fitCanvas(cv, 720);
  ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  const mx1 = Math.max(1e-6, ...a1), mx2 = Math.max(1e-6, ...a2);
  haloText(ctx, 'block 1 · Conv(8 filters, 3×3) + ReLU → 26×26×8   (edges)', 0, 18, '#22d3ee');
  const g1 = (W - 8 * s1) / 7;
  for (let f = 0; f < 8; f++) {
    let m = 1e-6; for (let i = f; i < a1.length; i += 8) m = Math.max(m, a1[i]);
    const x = f * (s1 + g1);
    ctx.drawImage(mapToCanvas(a1, 26, 26, 8, f, 'cyan', Math.max(m, mx1 * 0.25)), x, 24, s1, s1);
    ctx.strokeStyle = 'rgba(139,148,215,.3)'; ctx.strokeRect(x, 24, s1, s1);
  }
  const y2 = 24 + s1 + 34;
  haloText(ctx, 'block 2 · Conv(16 filters, 3×3×8) + ReLU → 11×11×16   (parts)', 0, y2 - 6, '#a78bfa');
  const g2 = (W - 8 * s2) / 7;
  for (let f = 0; f < 16; f++) {
    let m = 1e-6; for (let i = f; i < a2.length; i += 16) m = Math.max(m, a2[i]);
    const x = (f % 8) * (s2 + g2), y = y2 + Math.floor(f / 8) * (s2 + 6);
    ctx.drawImage(mapToCanvas(a2, 11, 11, 16, f, 'cyan', Math.max(m, mx2 * 0.25)), x, y, s2, s2);
    ctx.strokeStyle = 'rgba(139,148,215,.3)'; ctx.strokeRect(x, y, s2, s2);
  }
  const y3 = y2 + 2 * s2 + 6 + 34;
  haloText(ctx, 'pool → flatten: 400 numbers → Dense(10, softmax) → bars above', 0, y3 - 6, '#10b981');
  const mp = Math.max(1e-6, ...p2), cw = W / 400;
  for (let i = 0; i < 400; i++) {
    const a = clamp01(p2[i] / mp);
    ctx.fillStyle = `rgba(16,185,129,${(0.06 + 0.94 * a).toFixed(3)})`;
    ctx.fillRect(i * cw, y3, Math.max(1, cw), 26);
  }
}

/* ═══ APPENDIX A1: output-size calculator ═══ */
let padMode = 'valid';
function setPad(m, btn) { padMode = m; document.querySelectorAll('#pad-seg button').forEach(b => b.classList.toggle('on', b === btn)); drawOutSize(); }
function drawOutSize() {
  const n = +$('os-n').value, k = +$('os-k').value, s = +$('os-s').value;
  $('os-nv').textContent = n; $('os-kv').textContent = k; $('os-sv').textContent = s;
  let pl = 0, pr = 0, out;
  if (padMode === 'valid') out = Math.floor((n - k) / s) + 1;
  else { out = Math.ceil(n / s); const tot = Math.max((out - 1) * s + k - n, 0); pl = Math.floor(tot / 2); pr = tot - pl; }
  $('out-os').textContent = padMode === 'valid'
    ? `padding='valid' (p = 0):  ⌊(${n} − ${k}) / ${s}⌋ + 1 = ${out}`
    : `padding='same':  out = ⌈${n} / ${s}⌉ = ${out}   (Keras adds ${pl} zero${pl === 1 ? '' : 's'} left, ${pr} right)`;
  const cv = $('cv-os');
  const { ctx, W, H } = fitCanvas(cv);
  ctx.clearRect(0, 0, W, H);
  const tot = pl + n + pr, cs = Math.min(36, (W - 20) / tot), x0 = (W - tot * cs) / 2, y = H - 62;
  for (let i = 0; i < tot; i++) {
    const pad = i < pl || i >= pl + n;
    ctx.fillStyle = pad ? 'rgba(139,148,215,.05)' : 'rgba(249,115,22,.4)';
    ctx.fillRect(x0 + i * cs, y, cs - 2, cs - 2);
    if (pad) { ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(139,148,215,.5)'; ctx.strokeRect(x0 + i * cs, y, cs - 2, cs - 2); ctx.setLineDash([]); }
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = pad ? 'rgba(231,236,255,.35)' : '#fff'; ctx.fillText(pad ? '0' : '', x0 + i * cs + cs / 2 - 1, y + cs / 2 - 1);
  }
  const levels = Math.min(out, Math.ceil(k / s) + 1);
  for (let j = 0; j < out; j++) {
    const st = j * s, lv = j % levels;
    const yy = y - 12 - lv * ((y - 30) / levels);
    const col = `hsl(${190 + j * 37 % 140},80%,62%)`;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + st * cs + 2, yy + 6); ctx.lineTo(x0 + st * cs + 2, yy); ctx.lineTo(x0 + (st + k) * cs - 4, yy); ctx.lineTo(x0 + (st + k) * cs - 4, yy + 6); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0 + (st + k / 2) * cs - 1, yy, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  haloText(ctx, `input row: ${n} pixels${pl + pr ? ` + ${pl + pr} padding` : ''}   ·   ${out} kernel positions → output width ${out}`, W / 2, y + cs + 8, 'rgba(231,236,255,.7)');
}

/* ══════════ deep link, resize, keyboard ══════════ */
(function () {
  const m = /^#p(\d+)$/.exec(location.hash);
  if (m) { const idx = +m[1]; if (CURRICULUM_ORDER.includes(idx)) setTimeout(() => goTo(idx), 30); }
})();

window.addEventListener('resize', () => {
  instant = true;
  const redraw = [null, () => drawShift(false), drawPixels, drawConv, () => drawFmaps(false), drawPool, drawArch,
                  () => drawFlatten(false), () => drawAug(false), null, drawCurve, () => drawSig(false), drawLive, null, null, drawOutSize, null];
  if (current !== 0 && redraw[current]) redraw[current]();
  instant = false;
  fitMath($('panel-' + current));
});

document.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pos = CURRICULUM_ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && pos < CURRICULUM_ORDER.length - 1) goTo(CURRICULUM_ORDER[pos + 1]);
  if (e.key === 'ArrowLeft'  && pos > 0) goTo(CURRICULUM_ORDER[pos - 1]);
});

updateDots();
drawOverview();
