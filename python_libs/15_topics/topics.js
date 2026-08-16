/* ══════════════════════════════════════════════════════════════════
   Three topics — deck 15b
   Scaling (MinMax and Z-score), cross-validation, and the elbow.
   Every scaler, every fold and every KNN vote on this page is really
   computed in the browser: the cross_val_score table below reproduces
   sklearn's output fold by fold, not just on average.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 12;
const LABELS = ['Overview','Why scaling matters','MinMaxScaler','StandardScaler',
                'Which scaler when','fit vs transform','Cross-validation',
                'CV with KNN','The elbow method','Exercises',
                'A1 · More CV splitters','A2 · Pipeline'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11];

let current = 0;
let ovRaf = null;

function goTo(idx) {
  if (idx === current) return;
  const oldP = $('panel-' + current), newP = $('panel-' + idx);
  if (current > 0) {
    const btn = document.querySelector(`[data-panel="${current}"]`);
    if (btn) btn.classList.add('done');
  }
  if (ovRaf) { cancelAnimationFrame(ovRaf); ovRaf = null; }
  oldP.classList.remove('active'); oldP.classList.add('exit');
  setTimeout(() => oldP.classList.remove('exit'), 280);
  current = idx;
  newP.classList.add('active');
  $('viewport').scrollTop = 0;
  document.querySelectorAll('.s-item').forEach(b => b.classList.toggle('active', +b.dataset.panel === idx));
  updateDots();
  fitMath(newP);
  if (DRAWS[idx]) setTimeout(DRAWS[idx], 60);
}

/* KaTeX renders at a fixed size, so a wide formula would need a horizontal
   scrollbar. Instead we measure it and scale it down to fit. Panels are
   display:none until opened, which is why goTo() calls this again on entry. */
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

/* ══════════ drawing helpers ══════════ */
const COL = { grid:'rgba(230,237,243,.07)', axis:'rgba(230,237,243,.45)', tick:'rgba(230,237,243,.4)',
              accent:'#facc15', blue:'#3b82f6', green:'#10b981', red:'#f43f5e', cyan:'#06b6d4',
              orange:'#f97316', purple:'#8b5cf6', pink:'#ec4899', text:'#e6edf3', surface:'#020509' };
const FCLR = { apple:'#10b981', orange:'#f97316', banana:'#facc15' };
/* one colour per feature, used on every chart in the deck */
const FEATC = ['#06b6d4', '#a855f7', '#f97316'];

function plotSetup(cvId, XMIN, XMAX, YMIN, YMAX, xstep = 2, ystep) {
  const cv = $(cvId), ctx = cv.getContext('2d');
  cv.width = Math.min(cv.parentElement.clientWidth - 28 || 560, 660);
  const W = cv.width, H = cv.height;
  const sx = x => (x - XMIN) / (XMAX - XMIN) * W;
  const sy = y => H - (y - YMIN) / (YMAX - YMIN) * H;
  if (!ystep) ystep = xstep;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) { ctx.beginPath(); ctx.moveTo(sx(gx), 0); ctx.lineTo(sx(gx), H); ctx.stroke(); }
  for (let gy = Math.ceil(YMIN / ystep) * ystep; gy <= YMAX; gy += ystep) { ctx.beginPath(); ctx.moveTo(0, sy(gy)); ctx.lineTo(W, sy(gy)); ctx.stroke(); }
  ctx.fillStyle = COL.tick; ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) if (sx(gx) > 16 && sx(gx) < W - 16) ctx.fillText(+gx.toFixed(2), sx(gx), H - 13);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let gy = Math.ceil(YMIN / ystep) * ystep; gy <= YMAX; gy += ystep) if (sy(gy) > 10 && sy(gy) < H - 16) ctx.fillText(+gy.toFixed(2), 5, sy(gy));
  return { ctx, sx, sy, W, H, XMIN, XMAX, YMIN, YMAX };
}

function canvasSetup(cvId, height) {
  const cv = $(cvId), ctx = cv.getContext('2d');
  cv.width = Math.min(cv.parentElement.clientWidth - 28 || 560, 660);
  if (height) cv.height = height;
  ctx.clearRect(0, 0, cv.width, cv.height);
  return { ctx, W: cv.width, H: cv.height };
}

function haloText(ctx, txt, x, y, color) {
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.surface;
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
}

function axLabels(p, xlab, ylab) {
  const { ctx, W } = p;
  ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top';
  ctx.textAlign = 'left';  haloText(ctx, ylab, 12, 8, 'rgba(230,237,243,.42)');
  ctx.textAlign = 'right'; haloText(ctx, xlab, W - 8, 8, 'rgba(230,237,243,.42)');
}

function plotPoint(p, x, y, color, r = 4.5) {
  const { ctx, sx, sy } = p;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = COL.surface; ctx.stroke();
}

/* ══════════════════════════════════════════════════════════════════
   The data
   ══════════════════════════════════════════════════════════════════ */

/* The nine fruits from the notebook, unchanged. */
const F_COLOR  = [200, 50, 220, 240, 250, 230, 30, 40, 20];
const F_SIZE   = [7, 7, 6, 9, 8, 9, 12, 13, 11];
const F_WEIGHT = [150, 160, 140, 170, 165, 180, 120, 130, 115];
const F_Y = ['apple','apple','apple','orange','orange','orange','banana','banana','banana'];
const F_X = F_COLOR.map((c, i) => [c, F_SIZE[i], F_WEIGHT[i]]);
const F_NAMES = ['color', 'size', 'weight'];
const NFRUIT = 9;

/* np.random.seed(42); np.random.normal(loc=50, scale=20, size=100) — the exact
   sample the notebook plots, pasted in so the histograms here match the figure. */
const NORM = [59.934,47.235,62.954,80.461,45.317,45.317,81.584,65.349,40.611,60.851,
              40.732,40.685,54.839,11.734,15.502,38.754,29.743,56.285,31.840,21.754,
              79.313,45.484,51.351,21.505,39.112,52.218,26.980,57.514,37.987,44.166,
              37.966,87.046,49.730,28.846,66.451,25.583,54.177,10.807,23.436,53.937,
              64.769,53.427,47.687,43.978,20.430,35.603,40.787,71.142,56.872,14.739,
              56.482,42.298,36.462,62.234,70.620,68.626,33.216,43.816,56.625,69.511,
              40.417,46.287,27.873,26.076,66.251,77.125,48.560,70.071,57.233,37.098,
              57.228,80.761,49.283,81.293,-2.395,66.438,51.741,44.020,51.835,10.249,
              45.607,57.142,79.558,39.635,33.830,39.965,68.308,56.575,39.405,60.265,
              51.942,69.373,35.959,43.447,42.158,20.730,55.922,55.221,50.102,45.308];

/* make_blobs(n_samples=60, centers=3, cluster_std=0.9, random_state=42) */
const BLOBS = [[4.61,3.38],[4.95,0.39],[-2.52,8.06],[-6.88,-7.09],[-1.19,8.81],[4.23,2.92],
  [-6.91,-7.93],[-2.29,7.29],[-7.36,-6.42],[-1.77,7.92],[-7.23,-8.20],[-3.05,10.68],
  [-5.85,-6.20],[-6.83,-4.66],[4.72,0.18],[4.03,2.52],[-6.79,-6.01],[-4.06,8.51],
  [-3.05,8.75],[2.28,2.71],[4.44,2.29],[-2.93,9.50],[-3.70,9.19],[-6.61,-6.65],
  [4.94,2.85],[-7.19,-7.60],[-7.05,-6.61],[-5.18,-6.72],[-7.51,-7.18],[-6.35,-4.91],
  [-3.00,9.11],[5.37,3.19],[4.58,2.88],[4.93,1.63],[5.57,2.81],[4.21,1.81],
  [-3.55,9.35],[-1.09,9.70],[-1.84,9.17],[5.97,1.51],[3.91,1.52],[-6.17,-7.70],
  [-6.06,-6.58],[-3.33,7.74],[4.97,1.39],[-6.65,-6.95],[-7.02,-6.52],[-8.61,-6.90],
  [3.88,1.69],[-2.61,8.74],[4.72,1.70],[-3.84,8.37],[-2.93,8.60],[3.64,0.90],
  [-5.62,-8.14],[-3.42,9.30],[-2.45,7.73],[4.97,3.36],[-2.32,7.25],[-8.15,-7.26]];

const f2 = v => v.toFixed(2);
const f3 = v => v.toFixed(3);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ══════════════════════════════════════════════════════════════════
   The two scalers, exactly as sklearn defines them
   ══════════════════════════════════════════════════════════════════ */
function minMaxFit(X) {
  const nF = X[0].length, mn = [], mx = [];
  for (let f = 0; f < nF; f++) {
    let a = Infinity, b = -Infinity;
    for (const r of X) { if (r[f] < a) a = r[f]; if (r[f] > b) b = r[f]; }
    mn.push(a); mx.push(b);
  }
  return { mn, mx,
    transform: R => R.map(r => r.map((v, f) => mx[f] === mn[f] ? 0 : (v - mn[f]) / (mx[f] - mn[f]))) };
}
function standardFit(X) {
  const nF = X[0].length, mu = [], sd = [];
  for (let f = 0; f < nF; f++) {
    const col = X.map(r => r[f]);
    const m = col.reduce((a, b) => a + b, 0) / col.length;
    /* sklearn divides by N, not N-1 — the population standard deviation */
    const s = Math.sqrt(col.reduce((a, b) => a + (b - m) ** 2, 0) / col.length);
    mu.push(m); sd.push(s || 1);
  }
  return { mu, sd, transform: R => R.map(r => r.map((v, f) => (v - mu[f]) / sd[f])) };
}
/* the same two, for a plain 1-D array */
const mmFit1 = a => { const lo = Math.min(...a), hi = Math.max(...a);
                      return { lo, hi, t: v => hi === lo ? 0 : (v - lo) / (hi - lo) }; };
const zFit1  = a => { const m = a.reduce((x, y) => x + y, 0) / a.length;
                      const s = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
                      return { m, s: s || 1, t: v => (v - m) / (s || 1) }; };

/* ══════════════════════════════════════════════════════════════════
   KNN and cross-validation — the same rules sklearn uses, so the
   numbers in panel 07 are sklearn's numbers, fold by fold
   ══════════════════════════════════════════════════════════════════ */
function dist2(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return s; }

function knnPredict(Xtr, ytr, x, k, classes) {
  const d = Xtr.map((r, i) => ({ d: dist2(r, x), i }));
  d.sort((a, b) => a.d - b.d || a.i - b.i);
  const cnt = {};
  for (const t of d.slice(0, k)) cnt[ytr[t.i]] = (cnt[ytr[t.i]] || 0) + 1;
  /* argmax over the classes in sorted order — first maximum wins, like numpy */
  let best = classes[0];
  for (const c of classes) if ((cnt[c] || 0) > (cnt[best] || 0)) best = c;
  return best;
}
function knnNeighbours(Xtr, x, k) {
  return Xtr.map((r, i) => ({ d: Math.sqrt(dist2(r, x)), i }))
            .sort((a, b) => a.d - b.d || a.i - b.i).slice(0, k);
}

function kFold(n, k) {
  const folds = [], base = Math.floor(n / k), extra = n % k;
  let at = 0;
  for (let f = 0; f < k; f++) {
    const size = base + (f < extra ? 1 : 0);
    folds.push(Array.from({ length: size }, (_, j) => at + j));
    at += size;
  }
  return folds;
}
/* stratified: inside each class, the j-th member goes to fold j % k.
   On the balanced 3/3/3 fruit data this is exactly what sklearn does. */
function stratifiedKFold(y, k) {
  const classes = [...new Set(y)].sort();
  const folds = Array.from({ length: k }, () => []);
  for (const c of classes) {
    let j = 0;
    for (let i = 0; i < y.length; i++) if (y[i] === c) folds[j++ % k].push(i);
  }
  return folds.map(f => f.sort((a, b) => a - b));
}
const leaveOneOut = n => Array.from({ length: n }, (_, i) => [i]);

function crossValScore(X, y, k, folds) {
  const classes = [...new Set(y)].sort();
  return folds.map(test => {
    const tset = new Set(test), tri = [];
    for (let i = 0; i < X.length; i++) if (!tset.has(i)) tri.push(i);
    const Xtr = tri.map(i => X[i]), ytr = tri.map(i => y[i]);
    let ok = 0;
    for (const i of test) if (knnPredict(Xtr, ytr, X[i], Math.min(k, Xtr.length), classes) === y[i]) ok++;
    return ok / test.length;
  });
}
const mean = a => a.reduce((x, b) => x + b, 0) / a.length;

/* ══════════ K-means, for the elbow ══════════ */
function kmeans(X, k, seed) {
  const rng = mulberry32(seed);
  /* k-means++ seeding: each new centre is drawn far from the ones so far */
  const cent = [X[Math.floor(rng() * X.length)].slice()];
  while (cent.length < k) {
    const d = X.map(p => Math.min(...cent.map(c => dist2(p, c))));
    const tot = d.reduce((a, b) => a + b, 0);
    let r = rng() * tot, pick = X.length - 1;
    for (let i = 0; i < X.length; i++) { r -= d[i]; if (r <= 0) { pick = i; break; } }
    cent.push(X[pick].slice());
  }
  let lab = new Array(X.length).fill(0);
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let i = 0; i < X.length; i++) {
      let b = 0, bd = Infinity;
      for (let c = 0; c < k; c++) { const dd = dist2(X[i], cent[c]); if (dd < bd) { bd = dd; b = c; } }
      if (lab[i] !== b) { lab[i] = b; moved = true; }
    }
    for (let c = 0; c < k; c++) {
      const pts = X.filter((_, i) => lab[i] === c);
      if (!pts.length) continue;
      for (let f = 0; f < X[0].length; f++) cent[c][f] = pts.reduce((a, p) => a + p[f], 0) / pts.length;
    }
    if (!moved && it) break;
  }
  const inertia = X.reduce((a, p, i) => a + dist2(p, cent[lab[i]]), 0);
  return { cent, lab, inertia };
}
/* n_init restarts, keep the best — the same thing sklearn's n_init does.
   30 restarts reproduces sklearn's inertia exactly for k = 1..5; past
   that this search sometimes finds a slightly better optimum than
   sklearn's default 10 restarts do, which is the point of panel 08's
   note about k-means only ever finding a local minimum. */
function kmeansBest(X, k, nInit) {
  let best = null;
  for (let i = 0; i < (nInit || 30); i++) {
    const r = kmeans(X, k, 1000 + k * 97 + i * 13);
    if (!best || r.inertia < best.inertia) best = r;
  }
  return best;
}
const ELBOW = (() => { const out = []; for (let k = 1; k <= 8; k++) out.push(kmeansBest(BLOBS, k, 30)); return out; })();

/* ══════════ histogram helper ══════════ */
function histogram(vals, bins, lo, hi) {
  lo = lo == null ? Math.min(...vals) : lo;
  hi = hi == null ? Math.max(...vals) : hi;
  const h = new Array(bins).fill(0), w = (hi - lo) / bins || 1;
  for (const v of vals) {
    let b = Math.floor((v - lo) / w);
    if (b < 0) b = 0; if (b >= bins) b = bins - 1;
    h[b]++;
  }
  return { h, lo, hi, w };
}

function drawHist(c, vals, opts) {
  opts = opts || {};
  const { ctx, W, H } = c;
  const bins = opts.bins || 20;
  const { h, lo, hi } = histogram(vals, bins, opts.lo, opts.hi);
  const maxC = Math.max(...h, 1);
  const padL = 30, padR = 10, padB = 26, padT = opts.title ? 24 : 10;
  const bw = (W - padL - padR) / bins;
  const col = opts.color || COL.blue;

  ctx.strokeStyle = 'rgba(230,237,243,.28)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

  h.forEach((n, i) => {
    if (!n) return;
    const bh = (H - padT - padB) * n / maxC;
    ctx.fillStyle = hexA(col, 0.55);
    ctx.fillRect(padL + i * bw + 0.6, H - padB - bh, bw - 1.2, bh);
    ctx.strokeStyle = hexA(col, 0.9); ctx.lineWidth = 1;
    ctx.strokeRect(padL + i * bw + 0.6, H - padB - bh, bw - 1.2, bh);
  });

  ctx.font = '9px Courier New'; ctx.fillStyle = COL.tick;
  ctx.textAlign = 'left';   ctx.textBaseline = 'top'; ctx.fillText(f2(lo), padL, H - padB + 6);
  ctx.textAlign = 'right';  ctx.fillText(f2(hi), W - padR, H - padB + 6);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(String(maxC), 4, padT + 4);
  if (opts.title) {
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, opts.title, 4, 4, col);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PANEL 0: the overview loop, in two acts.
   Act 1 — three features on three wildly different scales are pulled
   into a common [0,1] band. Act 2 — the dataset is cut into folds and
   each fold takes a turn as the test set. That is the whole deck.
   ═══════════════════════════════════════════════════════════════════ */
const OV_DUR = 11600;
const OV_ACT2 = 5600;
const OV_MM = minMaxFit(F_X);
const OV_SCALED = OV_MM.transform(F_X);
const OV_FOLDS = stratifiedKFold(F_Y, 3);
const OV_CVS = crossValScore(OV_SCALED, F_Y, 1, OV_FOLDS);

function drawOverview() {
  const t0 = performance.now();
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const ease = v => 1 - Math.pow(1 - v, 3);

  const loop = now => {
    const t = (now - t0) % OV_DUR;
    const c = canvasSetup('cv-overview', 360);
    const { ctx, W, H } = c;
    const act1 = t < OV_ACT2;
    /* crossfade between the two acts */
    const fade = act1 ? cl(t / 400) * cl((OV_ACT2 - t) / 400)
                      : cl((t - OV_ACT2) / 400) * cl((OV_DUR - t) / 500);

    ctx.save(); ctx.globalAlpha = fade;

    if (act1) {
      /* ── Act 1: scaling ── */
      const padL = 74, padR = 24, span = W - padL - padR;
      const RAW_MAX = 260;
      const grow = cl((t - 500) / 900);            // dots drop in
      const pull = ease(cl((t - 2200) / 1500));    // then slide into [0,1]

      F_NAMES.forEach((nm, f) => {
        const y = 74 + f * 78;
        ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        haloText(ctx, nm, padL - 12, y, FEATC[f]);

        /* the axis: raw units on the left of the transition, 0..1 on the right */
        ctx.strokeStyle = 'rgba(230,237,243,.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, y + 16); ctx.lineTo(padL + span, y + 16); ctx.stroke();

        /* the target band, fading in as the pull starts */
        if (pull > 0) {
          ctx.save(); ctx.globalAlpha = fade * pull * 0.5;
          roundRect(ctx, padL, y - 16, span, 32, 6);
          ctx.strokeStyle = COL.accent; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.stroke();
          ctx.restore();
        }

        for (let i = 0; i < NFRUIT; i++) {
          const raw = F_X[i][f], sc = OV_SCALED[i][f];
          const xRaw = padL + raw / RAW_MAX * span;
          const xSc  = padL + sc * span;
          const x = xRaw + (xSc - xRaw) * pull;
          const a = cl((t - 500 - i * 70) / 400) * grow;
          if (a <= 0) continue;
          ctx.save(); ctx.globalAlpha = fade * a;
          ctx.beginPath(); ctx.arc(x, y + 16, 5, 0, Math.PI * 2);
          ctx.fillStyle = FCLR[F_Y[i]]; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = COL.surface; ctx.stroke();
          ctx.restore();
        }

        /* the range label flips from raw units to 0..1 */
        ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const lab = pull < 0.5
          ? OV_MM.mn[f] + ' … ' + OV_MM.mx[f]
          : '0.00 … 1.00';
        haloText(ctx, lab, padL, y + 26, pull < 0.5 ? 'rgba(230,237,243,.45)' : COL.accent);
      });

      const cap = t < 2200 ? ['three features, three scales', 'weight runs to 180, size never passes 13 — distance is all weight']
                           : ['one scale for all of them', 'MinMaxScaler maps every column onto the same [0, 1] ruler'];
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = 'bold 12px Courier New'; haloText(ctx, cap[0], 4, 4, COL.accent);
      ctx.font = '11px Courier New';      haloText(ctx, cap[1], 4, 22, 'rgba(230,237,243,.55)');

    } else {
      /* ── Act 2: cross-validation ── */
      const u = t - OV_ACT2;
      const padL = 62, padR = 62, span = W - padL - padR;
      const cellW = span / NFRUIT;

      /* the whole dataset */
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      haloText(ctx, 'dataset', padL - 10, 60, 'rgba(230,237,243,.6)');
      for (let i = 0; i < NFRUIT; i++) {
        const a = cl((u - i * 45) / 300);
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha = fade * a;
        roundRect(ctx, padL + i * cellW + 1.5, 46, cellW - 3, 28, 5);
        ctx.fillStyle = hexA(FCLR[F_Y[i]], 0.2); ctx.fill();
        ctx.strokeStyle = hexA(FCLR[F_Y[i]], 0.7); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
      }

      /* one row per fold, appearing in turn */
      OV_FOLDS.forEach((fold, k) => {
        const start = 900 + k * 1100;
        const a = cl((u - start) / 500);
        if (a <= 0) return;
        const y = 116 + k * 60;
        const test = new Set(fold);
        ctx.save(); ctx.globalAlpha = fade * a;
        ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        haloText(ctx, 'fold ' + (k + 1), padL - 10, y + 14, 'rgba(230,237,243,.5)');
        for (let i = 0; i < NFRUIT; i++) {
          const isTest = test.has(i);
          roundRect(ctx, padL + i * cellW + 1.5, y, cellW - 3, 28, 5);
          ctx.fillStyle = isTest ? 'rgba(16,185,129,.3)' : 'rgba(250,204,21,.13)';
          ctx.fill();
          ctx.strokeStyle = isTest ? COL.green : 'rgba(250,204,21,.45)';
          ctx.lineWidth = isTest ? 1.8 : 1; ctx.stroke();
        }
        /* the fold's score, once the row has settled */
        const sa = cl((u - start - 500) / 400);
        if (sa > 0) {
          ctx.globalAlpha = fade * sa;
          ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          haloText(ctx, OV_CVS[k].toFixed(2), padL + span + 10, y + 14, COL.green);
        }
        ctx.restore();
      });

      /* the mean */
      const ma = cl((u - 900 - 3 * 1100) / 500);
      if (ma > 0) {
        ctx.save(); ctx.globalAlpha = fade * ma;
        ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        haloText(ctx, 'cross_val_score.mean()  =  ' + mean(OV_CVS).toFixed(2), W / 2, 322, COL.accent);
        ctx.restore();
      }

      const cap = u < 900          ? ['now score it honestly', 'nine fruits — but one train/test split would only test three of them']
                : u < 900 + 3300   ? ['every row gets a turn as test data', 'train on the yellow, test on the green, write down the score']
                :                    ['average the folds', 'every row was predicted exactly once, by a model that had not seen it'];
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = 'bold 12px Courier New'; haloText(ctx, cap[0], 4, 4, COL.accent);
      ctx.font = '11px Courier New';      haloText(ctx, cap[1], 4, 22, 'rgba(230,237,243,.55)');
    }

    /* the legend sits under both acts */
    ctx.globalAlpha = fade * 0.8;
    ctx.textBaseline = 'middle'; ctx.font = '10px Courier New';
    ['apple', 'orange', 'banana'].forEach((k, j) => {
      const lx = 6 + j * 86;
      ctx.beginPath(); ctx.arc(lx + 4, H - 11, 4, 0, Math.PI * 2);
      ctx.fillStyle = FCLR[k]; ctx.fill();
      ctx.textAlign = 'left';
      haloText(ctx, k, lx + 13, H - 11, 'rgba(230,237,243,.55)');
    });
    ctx.restore();

    ovRaf = requestAnimationFrame(loop);
  };
  ovRaf = requestAnimationFrame(loop);
}

/* ═══ PANEL 1: why scaling matters ═══
   Squared euclidean distance between two fruits, split into the part
   each feature contributes. Raw, weight is almost the whole bar. */
function drawWhy() {
  const i = +$('wh-a').value, j = +$('wh-b').value;
  $('wh-av').textContent = F_Y[i] + ' #' + i;
  $('wh-bv').textContent = F_Y[j] + ' #' + j;

  const scaled = minMaxFit(F_X).transform(F_X);
  const rawParts = [0, 1, 2].map(f => (F_X[i][f] - F_X[j][f]) ** 2);
  const scParts  = [0, 1, 2].map(f => (scaled[i][f] - scaled[j][f]) ** 2);
  const rawTot = rawParts.reduce((a, b) => a + b, 0) || 1;
  const scTot  = scParts.reduce((a, b) => a + b, 0)  || 1;

  const c = canvasSetup('cv-why', 210);
  const { ctx, W } = c;
  const padL = 96, barW = W - padL - 20;

  [['raw units', rawParts, rawTot, 62], ['after MinMaxScaler', scParts, scTot, 140]].forEach(([lab, parts, tot, y]) => {
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, lab, padL - 12, y, COL.text);
    let x = padL;
    parts.forEach((v, f) => {
      const w = v / tot * barW;
      if (w > 0.4) {
        ctx.fillStyle = hexA(FEATC[f], 0.5); ctx.fillRect(x, y - 17, w, 34);
        ctx.strokeStyle = FEATC[f]; ctx.lineWidth = 1.2; ctx.strokeRect(x, y - 17, w, 34);
        if (w > 34) {
          ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
          haloText(ctx, (v / tot * 100).toFixed(0) + '%', x + w / 2, y, '#fff');
        }
      }
      x += w;
    });
    ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'total d² = ' + tot.toFixed(tot > 10 ? 0 : 4), padL, y + 22, 'rgba(230,237,243,.45)');
  });

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'who owns the distance between these two fruits?', 4, 4, COL.accent);
  ctx.font = '10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  F_NAMES.forEach((nm, f) => {
    const lx = 6 + f * 92;
    ctx.fillStyle = FEATC[f]; ctx.fillRect(lx, 192, 10, 10);
    haloText(ctx, nm, lx + 15, 197, 'rgba(230,237,243,.6)');
  });

  $('out-why').textContent =
`${F_Y[i]} #${i} = [color ${F_X[i][0]}, size ${F_X[i][1]}, weight ${F_X[i][2]}]
${F_Y[j]} #${j} = [color ${F_X[j][0]}, size ${F_X[j][1]}, weight ${F_X[j][2]}]

raw     : color ${(rawParts[0] / rawTot * 100).toFixed(1)}%   size ${(rawParts[1] / rawTot * 100).toFixed(1)}%   weight ${(rawParts[2] / rawTot * 100).toFixed(1)}%
scaled  : color ${(scParts[0] / scTot * 100).toFixed(1)}%   size ${(scParts[1] / scTot * 100).toFixed(1)}%   weight ${(scParts[2] / scTot * 100).toFixed(1)}%
--> size is measured in single digits, so unscaled it can never matter`;
}

/* ═══ PANELS 2, 3, 4: the two scalers ═══
   The same 100 numbers the notebook plots, with one value replaced by a
   movable outlier — the fastest way to feel the difference between them. */
function normWithOutlier(v) {
  const a = NORM.slice();
  a[31] = v;                       /* index 31 is the sample maximum, 87.05 */
  return a;
}

function drawMinMax() {
  const out = +$('mm-out').value;
  $('mm-outv').textContent = out;
  const data = normWithOutlier(out);
  const s = mmFit1(data);
  const scaled = data.map(s.t);

  drawHist(canvasSetup('cv-mm-a'), data, { title: 'original', color: COL.blue });
  drawHist(canvasSetup('cv-mm-b'), scaled, { title: 'MinMax → [0, 1]', color: COL.green, lo: 0, hi: 1 });

  const below = scaled.filter(v => v < 0.25).length;
  $('out-mm').textContent =
`X_min = ${f2(s.lo)}   X_max = ${f2(s.hi)}
every value becomes (X - ${f2(s.lo)}) / ${f2(s.hi - s.lo)}
range after scaling: 0.00 … 1.00   (guaranteed, always)
${below} of 100 values now sit below 0.25${out > 120 ? '  <-- the outlier has crushed everything else into a corner' : ''}`;
}

function drawStandard() {
  const out = +$('ss-out').value;
  $('ss-outv').textContent = out;
  const data = normWithOutlier(out);
  const s = zFit1(data);
  const scaled = data.map(s.t);

  drawHist(canvasSetup('cv-ss-a'), data, { title: 'original', color: COL.blue });
  drawHist(canvasSetup('cv-ss-b'), scaled, { title: 'Z-score → mean 0, sd 1', color: COL.purple });

  const w1 = scaled.filter(v => Math.abs(v) <= 1).length;
  const w2 = scaled.filter(v => Math.abs(v) <= 2).length;
  const w3 = scaled.filter(v => Math.abs(v) <= 3).length;
  $('out-ss').textContent =
`mean μ = ${f2(s.m)}   std σ = ${f2(s.s)}
every value becomes (X - ${f2(s.m)}) / ${f2(s.s)}
range after scaling: ${f2(Math.min(...scaled))} … ${f2(Math.max(...scaled))}   (not bounded)
within 1σ: ${w1}%   ·  within 2σ: ${w2}%   ·  within 3σ: ${w3}%   (the 68-95-99.7 rule)`;
}

function drawCompare() {
  const out = +$('cmp-out').value;
  $('cmp-outv').textContent = out;
  const data = normWithOutlier(out);
  const mm = mmFit1(data), zz = zFit1(data);
  const a = data.map(mm.t), b = data.map(zz.t);

  drawHist(canvasSetup('cv-cmp-a'), a, { title: 'MinMaxScaler', color: COL.green, lo: 0, hi: 1 });
  drawHist(canvasSetup('cv-cmp-b'), b, { title: 'StandardScaler', color: COL.purple });

  /* how much of the [0,1] range the ordinary 99 values still occupy */
  const bulk = a.filter((_, i) => i !== 31);
  const spread = Math.max(...bulk) - Math.min(...bulk);
  $('out-cmp').textContent =
`outlier = ${out}
MinMax  : the 99 ordinary values now span just ${f2(spread)} of the [0,1] range
Z-score : the outlier sits at ${f2(zz.t(out))} sigma, the rest keep their shape
--> MinMax is bounded but fragile; Z-score is unbounded but robust`;
}

/* ═══ PANEL 5: fit vs transform ═══
   The same test point scaled two ways: with the training statistics
   (right) and with its own (wrong). */
function drawLeak() {
  const shift = +$('lk-shift').value;
  $('lk-shiftv').textContent = shift;
  /* a small train set and a test set that sits shift units higher */
  const train = [10, 14, 18, 22, 26, 30];
  const test  = [16 + shift, 24 + shift, 32 + shift];

  const right = mmFit1(train);                       /* fit on train only  */
  const wrong = mmFit1(test);                        /* fit on test — leak */

  const c = canvasSetup('cv-leak', 250);
  const { ctx, W } = c;
  const padL = 118, span = W - padL - 26;

  function line(y, lo, hi, label, pts, colr, note) {
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, label, padL - 12, y, COL.text);
    ctx.strokeStyle = 'rgba(230,237,243,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + span, y); ctx.stroke();
    for (const [v, cc] of pts) {
      const x = padL + (v - lo) / (hi - lo || 1) * span;
      ctx.beginPath(); ctx.arc(Math.max(padL - 14, Math.min(padL + span + 14, x)), y, 5, 0, Math.PI * 2);
      ctx.fillStyle = cc; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = COL.surface; ctx.stroke();
    }
    ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, note, padL, y + 12, colr);
  }

  line(48, 10, 32 + shift, 'raw values',
       train.map(v => [v, COL.blue]).concat(test.map(v => [v, COL.orange])),
       'rgba(230,237,243,.45)', 'blue = train, orange = test');

  const rt = train.map(right.t), rs = test.map(right.t);
  line(130, 0, Math.max(1, ...rs), '✓ fit on TRAIN',
       rt.map(v => [v, COL.blue]).concat(rs.map(v => [v, COL.orange])),
       COL.green, 'test lands at ' + rs.map(f2).join(', ') + ' — outside [0,1] if it is out of range, which is correct');

  const wt = test.map(wrong.t);
  line(206, 0, 1, '✗ fit on TEST',
       wt.map(v => [v, COL.orange]),
       COL.red, 'test forced to ' + wt.map(f2).join(', ') + ' — the shift has vanished, and so has the truth');

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'the same test rows, scaled two ways', 4, 4, COL.accent);

  $('out-leak').textContent =
`train = [${train.join(', ')}]          test = [${test.join(', ')}]
scaler.fit(X_train)  ->  min ${f2(right.lo)}, max ${f2(right.hi)}
  transform(test) = [${rs.map(f2).join(', ')}]   ${rs.some(v => v > 1) ? '(above 1.0 — the test set really is out of range)' : ''}
scaler.fit(X_test)   ->  min ${f2(wrong.lo)}, max ${f2(wrong.hi)}
  transform(test) = [${wt.map(f2).join(', ')}]   always 0.00 … 1.00, whatever the data was
--> the second one hides the drift and leaks test statistics into the model`;
}

/* ═══ PANEL 6: cross-validation ═══ */
function drawFolds() {
  const k = +$('cv-k').value;
  $('cv-kv').textContent = k;
  const n = 12;
  const folds = kFold(n, k);

  const c = canvasSetup('cv-folds', 40 + k * 40);
  const { ctx, W } = c;
  const padL = 62, padR = 76, span = W - padL - padR, cellW = span / n;

  folds.forEach((fold, i) => {
    const y = 18 + i * 40;
    const test = new Set(fold);
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, 'split ' + (i + 1), padL - 10, y + 13, 'rgba(230,237,243,.5)');
    for (let j = 0; j < n; j++) {
      const isTest = test.has(j);
      roundRect(ctx, padL + j * cellW + 1.5, y, cellW - 3, 26, 4);
      ctx.fillStyle = isTest ? 'rgba(16,185,129,.32)' : 'rgba(250,204,21,.13)'; ctx.fill();
      ctx.strokeStyle = isTest ? COL.green : 'rgba(250,204,21,.45)';
      ctx.lineWidth = isTest ? 1.8 : 1; ctx.stroke();
    }
    ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    haloText(ctx, (n - fold.length) + ' / ' + fold.length, padL + span + 8, y + 13, 'rgba(230,237,243,.5)');
  });

  const trainPct = (1 - 1 / k) * 100;
  const sizes = folds.map(f => f.length);
  const even = sizes.every(s => s === sizes[0]);
  $('out-folds').textContent =
`cv = ${k}   ->   ${k} splits, each testing on ${even ? sizes[0] + ' of the 12 rows'
    : sizes.join('/') + ' rows (12 does not divide by ' + k + ', so sklearn spreads the remainder)'}
train share = 1 - 1/${k} = ${trainPct.toFixed(1)}%      test share = 1/${k} = ${(100 / k).toFixed(1)}%
the model is fitted ${k} times from scratch, and every row is tested exactly once
--> the score you report is the mean of the ${k} fold scores`;
}

/* ═══ PANEL 7: cross-validation with KNN ═══ */
const KRANGE = [1, 2, 3, 4, 5, 6];
function drawKCurve() {
  const useScale = +$('kc-scale').value === 1;
  const folds = +$('kc-cv').value;
  $('kc-scalev').textContent = useScale ? 'MinMax' : 'none';
  $('kc-cvv').textContent = folds;

  const X = useScale ? minMaxFit(F_X).transform(F_X) : F_X;
  const F = stratifiedKFold(F_Y, folds);
  const scores = KRANGE.map(k => mean(crossValScore(X, F_Y, k, F)));
  const bestI = scores.indexOf(Math.max(...scores));

  const p = plotSetup('cv-kcurve', 0.4, 6.6, 0, 1.08, 1, 0.2);
  const { ctx, sx, sy } = p;
  ctx.save(); ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.6; ctx.beginPath();
  KRANGE.forEach((k, i) => i === 0 ? ctx.moveTo(sx(k), sy(scores[i])) : ctx.lineTo(sx(k), sy(scores[i])));
  ctx.stroke(); ctx.restore();
  KRANGE.forEach((k, i) => {
    const best = i === bestI;
    plotPoint(p, k, scores[i], best ? COL.green : COL.accent, best ? 6.5 : 4.5);
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    haloText(ctx, scores[i].toFixed(2), sx(k), sy(scores[i]) - 10, best ? COL.green : 'rgba(230,237,243,.6)');
  });
  axLabels(p, 'k — number of neighbours →', 'CV accuracy ↑');

  $('out-kcurve').textContent =
`--- Cross-Validation Results ---
${KRANGE.map((k, i) => 'k = ' + k + ' | Average Accuracy: ' + scores[i].toFixed(2)).join('\n')}

Best K: ${KRANGE[bestI]}${useScale && folds === 3 ? '     (this is exactly the notebook output)' : ''}`;
}

/* ═══ PANEL 8: the elbow ═══ */
function drawElbow() {
  const k = +$('el-k').value;
  $('el-kv').textContent = k;
  const inert = ELBOW.map(e => e.inertia);

  const p = plotSetup('cv-elbow', 0.4, 8.6, -180, 4200, 1, 800);
  const { ctx, sx, sy } = p;
  ctx.save(); ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.6; ctx.beginPath();
  inert.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i + 1), sy(v)) : ctx.lineTo(sx(i + 1), sy(v)));
  ctx.stroke(); ctx.restore();
  inert.forEach((v, i) => plotPoint(p, i + 1, v, i + 1 === 3 ? COL.green : COL.accent, i + 1 === 3 ? 6.5 : 4.5));

  /* the straight line from the first point to the last — the elbow is the
     point that sits furthest below it, which is how kneedle picks it too */
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(sx(1), sy(inert[0])); ctx.lineTo(sx(8), sy(inert[7])); ctx.stroke(); ctx.restore();

  /* mark where the slider is */
  ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = COL.cyan; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sx(k), 0); ctx.lineTo(sx(k), p.H); ctx.stroke(); ctx.restore();
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  haloText(ctx, 'k = ' + k, sx(k), 6, COL.cyan);
  axLabels(p, 'k — number of clusters →', 'inertia (WCSS) ↑');

  /* the clustering itself, at the chosen k */
  const km = ELBOW[k - 1];
  const q = plotSetup('cv-elbow-pts', -10, 8, -10, 12, 4);
  const CC = ['#06b6d4','#f97316','#a855f7','#10b981','#ec4899','#facc15','#3b82f6','#f43f5e'];
  BLOBS.forEach((pt, i) => plotPoint(q, pt[0], pt[1], CC[km.lab[i] % CC.length], 3.8));
  km.cent.forEach(ct => {
    const cx = q.sx(ct[0]), cy = q.sy(ct[1]);
    q.ctx.save(); q.ctx.strokeStyle = '#fff'; q.ctx.lineWidth = 2;
    q.ctx.beginPath(); q.ctx.moveTo(cx - 6, cy); q.ctx.lineTo(cx + 6, cy);
    q.ctx.moveTo(cx, cy - 6); q.ctx.lineTo(cx, cy + 6); q.ctx.stroke(); q.ctx.restore();
  });
  axLabels(q, 'X1 →', 'X2 ↑');

  const drop = i => i === 0 ? null : inert[i - 1] - inert[i];
  $('out-elbow').textContent =
`k = ${k}   inertia = ${inert[k - 1].toFixed(1)}${k > 1 ? '   (down ' + drop(k - 1).toFixed(1) + ' from k=' + (k - 1) + ')' : ''}
drops:  1->2 ${drop(1).toFixed(0)}   2->3 ${drop(2).toFixed(0)}   3->4 ${drop(3).toFixed(0)}   4->5 ${drop(4).toFixed(0)}   5->6 ${drop(5).toFixed(0)}
the first two drops are huge, then they collapse to almost nothing
--> the elbow is k = 3, and the picture agrees: three blobs`;
}

/* ═══ APPENDIX A1: the splitters ═══ */
function drawSplitters() {
  const which = +$('sp-w').value;
  const names = ['KFold(3)', 'StratifiedKFold(3)', 'LeaveOneOut()'];
  $('sp-wv').textContent = names[which];
  const folds = which === 0 ? kFold(NFRUIT, 3)
              : which === 1 ? stratifiedKFold(F_Y, 3)
              :               leaveOneOut(NFRUIT);

  const c = canvasSetup('cv-splitters', 32 + folds.length * 32);
  const { ctx, W } = c;
  const padL = 66, padR = 92, span = W - padL - padR, cellW = span / NFRUIT;

  folds.forEach((fold, i) => {
    const y = 16 + i * 32;
    const test = new Set(fold);
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, 'split ' + (i + 1), padL - 10, y + 11, 'rgba(230,237,243,.5)');
    const seen = {};
    for (let j = 0; j < NFRUIT; j++) {
      const isTest = test.has(j);
      if (isTest) seen[F_Y[j]] = (seen[F_Y[j]] || 0) + 1;
      roundRect(ctx, padL + j * cellW + 1.5, y, cellW - 3, 22, 4);
      ctx.fillStyle = isTest ? hexA(FCLR[F_Y[j]], 0.42) : 'rgba(255,255,255,.04)'; ctx.fill();
      ctx.strokeStyle = isTest ? FCLR[F_Y[j]] : 'rgba(230,237,243,.16)';
      ctx.lineWidth = isTest ? 1.6 : 1; ctx.stroke();
    }
    const kinds = Object.keys(seen).length;
    ctx.font = '9px Courier New'; ctx.textAlign = 'left';
    haloText(ctx, kinds + ' class' + (kinds === 1 ? '' : 'es') + ' in test',
             padL + span + 8, y + 11, kinds === 3 ? COL.green : kinds === 1 ? COL.red : COL.accent);
  });

  const perFold = folds.map(f => new Set(f.map(i => F_Y[i])).size);
  const balanced = perFold.every(v => v === 3);
  $('out-splitters').textContent =
`${names[which]} on the 9 fruits (3 apples, 3 oranges, 3 bananas, in that order)
${folds.length} splits, ${folds[0].length} row${folds[0].length === 1 ? '' : 's'} tested per split
classes present in each test fold: ${perFold.join(', ')}
${balanced ? '--> every fold is a fair miniature of the dataset'
 : which === 0 ? '--> plain KFold cuts the sorted data into blocks, so a fold can be all one class and the model is tested on a class it never trained on'
 : '--> one row per split: every test fold holds exactly one class, by construction'}`;
}

/* ══════════ boot ══════════ */
const DRAWS = [drawOverview, drawWhy, drawMinMax, drawStandard, drawCompare, drawLeak,
               drawFolds, drawKCurve, drawElbow, null, drawSplitters, null];

updateDots();
setTimeout(drawOverview, 90);

window.addEventListener('resize', () => {
  if (current === 0) { if (ovRaf) cancelAnimationFrame(ovRaf); drawOverview(); }
  else if (DRAWS[current]) DRAWS[current]();
  fitMath($('panel-' + current));
});

document.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pos = CURRICULUM_ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && pos < CURRICULUM_ORDER.length - 1) goTo(CURRICULUM_ORDER[pos + 1]);
  if (e.key === 'ArrowLeft'  && pos > 0) goTo(CURRICULUM_ORDER[pos - 1]);
});
