/* ══════════════════════════════════════════════════════════════════
   K-Means — deck 17
   Unsupervised learning, Lloyd's algorithm, WCSS/inertia, the elbow,
   scaling, n_init, cluster profiling and colour quantisation.

   Every cluster, centroid, inertia value and palette on this page is
   really computed in the browser by the kmeansFit() below — the same
   assign/update loop scikit-learn runs, on the data you can see.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 15;
const LABELS = ['Overview','Unsupervised learning','The five steps','Assignment · distance',
                'Update · the mean','WCSS / inertia','Increasing K','The elbow method',
                'Scale first','random_state & n_init','Reading the clusters',
                'Image compression','Exercises','A1 · The KMeans object','A2 · K-Means vs KNN'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];

let current = 0;
/* one animation handle per panel, so leaving a panel stops its loop */
const RAF = {};
function stopRaf(idx) { if (RAF[idx]) { cancelAnimationFrame(RAF[idx]); RAF[idx] = null; } }
function stopAll() { for (const k in RAF) stopRaf(k); }

function goTo(idx) {
  if (idx === current) return;
  const oldP = $('panel-' + current), newP = $('panel-' + idx);
  if (current > 0) {
    const btn = document.querySelector(`[data-panel="${current}"]`);
    if (btn) btn.classList.add('done');
  }
  stopAll();
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

function segPick(id, i) {
  const bs = $(id).querySelectorAll('button');
  bs.forEach((b, j) => b.classList.toggle('on', i === j));
}

/* ══════════ drawing helpers ══════════ */
const COL = { grid:'rgba(230,237,243,.07)', axis:'rgba(230,237,243,.45)', tick:'rgba(230,237,243,.4)',
              accent:'#facc15', blue:'#3b82f6', green:'#10b981', red:'#f43f5e', cyan:'#06b6d4',
              orange:'#f97316', purple:'#8b5cf6', pink:'#ec4899', text:'#e6edf3', surface:'#020509' };

/* the cluster palette — cluster j is always drawn in CLU[j] */
const CLU = ['#f43f5e','#3b82f6','#10b981','#facc15','#a855f7','#06b6d4','#f97316','#ec4899'];

function canvasSetup(cvId, height) {
  const cv = $(cvId), ctx = cv.getContext('2d');
  cv.width = Math.min(cv.parentElement.clientWidth - 28 || 560, 680);
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

function arrow(ctx, x1, y1, x2, y2, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - 6 * Math.cos(a), y2 - 6 * Math.sin(a)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(a - .4), y2 - 8 * Math.sin(a - .4));
  ctx.lineTo(x2 - 8 * Math.cos(a + .4), y2 - 8 * Math.sin(a + .4));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

/* a plot with real margins and caller-formatted ticks */
function plot2(cvId, height, xmin, xmax, ymin, ymax, opts) {
  opts = opts || {};
  const c = canvasSetup(cvId, height);
  const { ctx, W, H } = c;
  const padL = opts.padL == null ? 54 : opts.padL, padR = 16, padT = 26, padB = 30;
  const sx = x => padL + (x - xmin) / (xmax - xmin) * (W - padL - padR);
  const sy = y => H - padB - (y - ymin) / (ymax - ymin) * (H - padT - padB);
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  (opts.xticks || []).forEach(t => { ctx.beginPath(); ctx.moveTo(sx(t), padT - 6); ctx.lineTo(sx(t), H - padB); ctx.stroke(); });
  (opts.yticks || []).forEach(t => { ctx.beginPath(); ctx.moveTo(padL, sy(t)); ctx.lineTo(W - padR, sy(t)); ctx.stroke(); });
  ctx.strokeStyle = 'rgba(230,237,243,.28)';
  ctx.beginPath(); ctx.moveTo(padL, padT - 6); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
  ctx.font = '9px Courier New'; ctx.fillStyle = COL.tick;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  (opts.xticks || []).forEach(t => ctx.fillText(opts.xfmt ? opts.xfmt(t) : t, sx(t), H - padB + 7));
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  (opts.yticks || []).forEach(t => ctx.fillText(opts.yfmt ? opts.yfmt(t) : t, padL - 7, sy(t)));
  if (opts.xlab) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.font = 'bold 9px Courier New';
                   haloText(ctx, opts.xlab, W - padR, H - padB + 16, 'rgba(230,237,243,.5)'); }
  if (opts.ylab) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = 'bold 9px Courier New';
                   haloText(ctx, opts.ylab, 4, 5, 'rgba(230,237,243,.5)'); }
  return { ctx, sx, sy, W, H, padL, padR, padT, padB };
}

const f1 = v => v.toFixed(1);
const f2 = v => v.toFixed(2);
const f3 = v => v.toFixed(3);
const easeOut = v => 1 - Math.pow(1 - v, 3);
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

/* ══════════════════════════════════════════════════════════════════
   K-Means itself — dimension-generic, so the same code clusters
   2-D points on the demo plots and 3-D RGB pixels in panel 11.
   ══════════════════════════════════════════════════════════════════ */

/* a small deterministic PRNG, so "random_state=n" means something here too */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function dist2(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return s;
}

function nearest(x, C) {
  let best = 0, bd = Infinity;
  for (let j = 0; j < C.length; j++) { const d = dist2(x, C[j]); if (d < bd) { bd = d; best = j; } }
  return best;
}

/* the update step: every centre to the mean of its points.
   an empty cluster keeps its old position rather than becoming NaN */
function meansOf(X, labels, k, prev) {
  const m = X[0].length;
  const sums = Array.from({ length: k }, () => new Array(m).fill(0));
  const n = new Array(k).fill(0);
  for (let i = 0; i < X.length; i++) {
    const j = labels[i]; n[j]++;
    for (let d = 0; d < m; d++) sums[j][d] += X[i][d];
  }
  return sums.map((s, j) => n[j] ? s.map(v => v / n[j]) : prev[j].slice());
}

function inertiaOf(X, labels, C) {
  let s = 0;
  for (let i = 0; i < X.length; i++) s += dist2(X[i], C[labels[i]]);
  return s;
}

/* one run of Lloyd's algorithm from one random start */
function kmeansOnce(X, k, seed, maxIter) {
  maxIter = maxIter || 100;
  const rnd = mulberry32(seed);
  const picked = [];
  while (picked.length < Math.min(k, X.length)) {
    const i = Math.floor(rnd() * X.length);
    if (!picked.includes(i)) picked.push(i);
  }
  let C = picked.map(i => X[i].slice());
  let labels = new Array(X.length).fill(-1), iter = 0, changed = true;
  while (changed && iter < maxIter) {
    changed = false;
    for (let i = 0; i < X.length; i++) {
      const j = nearest(X[i], C);
      if (j !== labels[i]) { labels[i] = j; changed = true; }
    }
    C = meansOf(X, labels, k, C);
    iter++;
  }
  return { C, labels, inertia: inertiaOf(X, labels, C), iter };
}

/* what n_init actually does: run it several times, keep the lowest inertia */
function kmeansFit(X, k, seed, nInit, maxIter) {
  seed = seed == null ? 42 : seed;
  nInit = nInit || 10;
  let best = null;
  for (let r = 0; r < nInit; r++) {
    const run = kmeansOnce(X, k, seed * 7919 + r * 104729, maxIter);
    if (!best || run.inertia < best.inertia) best = run;
  }
  return best;
}

/* ══════════════════════════════════════════════════════════════════
   The data
   ══════════════════════════════════════════════════════════════════ */

/* gaussian-ish blobs in a 0..10 box, deterministic for a given seed */
function makeBlobs(centers, per, spread, seed) {
  const rnd = mulberry32(seed), out = [];
  const g = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.9;   // rough normal
  for (const c of centers)
    for (let i = 0; i < per; i++) out.push([c[0] + g() * spread, c[1] + g() * spread]);
  return out;
}

/* 24 points in 3 blobs — the workhorse dataset of the deck */
const BLOB3 = [[2.4, 7.3], [7.4, 7.6], [4.6, 2.5]];
const DATA3 = makeBlobs(BLOB3, 8, 0.85, 7);

/* the true cluster of every point, used only by panel 01 to show what a
   supervised model would have been handed */
const TRUTH3 = DATA3.map((_, i) => Math.floor(i / 8));

/* panel 04 — one cluster of seven points */
const MEANPTS = [[2.2, 6.4], [3.6, 8.1], [4.8, 6.9], [3.1, 5.2], [5.4, 8.6], [2.7, 7.8], [4.2, 7.4]];

/* panel 08 — eighteen customers, age in years and balance in pounds.
   Three real groups: young savers, older savers on a similar balance, and
   mid-career high earners. The first two are 30 years apart and only a few
   thousand pounds apart, which is exactly the pair raw distance cannot see. */
const CUST = [
  [24, 18200], [27, 21500], [23, 16800], [29, 23100], [26, 19700], [22, 22400],
  [55, 17600], [61, 22800], [58, 19200], [63, 16400], [57, 23600], [60, 20900],
  [38, 41200], [43, 45800], [36, 43100], [45, 47400], [41, 40500], [39, 44900]
];

/* ══════════════════════════════════════════════════════════════════
   PANEL 00 — overview: the loop, start to finish
   ══════════════════════════════════════════════════════════════════ */

let ovT0 = 0;
function drawOverview() {
  ovT0 = ovT0 || performance.now();
  const FIT = kmeansFit(DATA3, 3, 42, 10);
  /* replay the run one step at a time so the animation is the real thing */
  const frames = lloydFrames(DATA3, 3, 42);

  function frame(now) {
    const c = canvasSetup('cv-overview', 360);
    const { ctx, W, H } = c;
    const T = ((now - ovT0) / 1000) % 11;                 // an 11-second loop
    const pad = 42;
    const sx = x => pad + x / 10 * (W - pad * 2);
    const sy = y => H - pad - y / 10 * (H - pad * 1.6);

    /* stage 0-1.6s: the raw, unlabelled cloud */
    const stage = T < 1.8 ? -1 : Math.min(frames.length - 1, Math.floor((T - 1.8) / 1.0));
    const sub   = T < 1.8 ? 0 : clamp01((T - 1.8) / 1.0 - stage);

    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let head, note;
    if (stage < 0)                       { head = 'X — a table of numbers, no labels'; note = 'this is all K-Means ever gets'; }
    else if (stage === 0)                { head = '1 · initialise — K random centres'; note = 'K = 3, chosen by you'; }
    else if (stage >= frames.length - 1) { head = 'converged — nothing moves any more'; note = 'inertia = ' + f2(FIT.inertia); }
    else if (frames[stage].kind === 'assign') { head = '2 · assign — nearest centre wins'; note = 'pass ' + frames[stage].pass; }
    else                                 { head = '3 · update — centres jump to the mean'; note = 'pass ' + frames[stage].pass; }
    haloText(ctx, head, 8, 6, COL.accent);
    ctx.font = '10px Courier New'; haloText(ctx, note, 8, 24, 'rgba(230,237,243,.5)');

    /* centre positions, interpolated between the two frames around us */
    const fr   = stage < 0 ? frames[0] : frames[stage];
    const prev = stage <= 0 ? fr : frames[stage - 1];
    const e = easeOut(sub);
    const C = fr.C.map((c2, j) => [prev.C[j][0] + (c2[0] - prev.C[j][0]) * e,
                                   prev.C[j][1] + (c2[1] - prev.C[j][1]) * e]);

    /* points */
    DATA3.forEach((p, i) => {
      const lab = stage < 0 ? -1 : fr.labels[i];
      const col = lab < 0 ? 'rgba(230,237,243,.45)' : CLU[lab];
      /* the colour of a newly assigned point fades in over the assign step */
      const a = (stage >= 0 && fr.kind === 'assign' && prev.labels[i] !== fr.labels[i]) ? sub : 1;
      ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 5, 0, 7);
      ctx.fillStyle = lab < 0 ? 'rgba(230,237,243,.4)' : hexA(col, .35 + .5 * a); ctx.fill();
      ctx.strokeStyle = lab < 0 ? 'rgba(230,237,243,.6)' : hexA(col, .5 + .5 * a);
      ctx.lineWidth = 1.6; ctx.stroke();
    });

    /* centroids, drawn as the triangles the lecture slides used */
    if (stage >= 0) C.forEach((c2, j) => {
      const x = sx(c2[0]), y = sy(c2[1]);
      ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x - 9, y - 7); ctx.lineTo(x + 9, y - 7); ctx.closePath();
      ctx.fillStyle = hexA(CLU[j], .85); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
    });

    RAF[0] = requestAnimationFrame(frame);
  }
  stopRaf(0);
  RAF[0] = requestAnimationFrame(frame);
}

/* every intermediate state of a real run, so the animations can replay it */
function lloydFrames(X, k, seed, maxIter) {
  maxIter = maxIter || 40;
  const rnd = mulberry32(seed), picked = [];
  while (picked.length < k) { const i = Math.floor(rnd() * X.length); if (!picked.includes(i)) picked.push(i); }
  let C = picked.map(i => X[i].slice());
  let labels = new Array(X.length).fill(-1);
  const frames = [{ kind: 'init', C: C.map(c => c.slice()), labels: labels.slice(), pass: 0, inertia: null }];
  for (let it = 0; it < maxIter; it++) {
    let changed = false;
    const nl = X.map(x => nearest(x, C));
    for (let i = 0; i < X.length; i++) if (nl[i] !== labels[i]) changed = true;
    labels = nl;
    frames.push({ kind: 'assign', C: C.map(c => c.slice()), labels: labels.slice(),
                  pass: it + 1, inertia: inertiaOf(X, labels, C), changed });
    if (!changed && it > 0) break;
    C = meansOf(X, labels, k, C);
    frames.push({ kind: 'update', C: C.map(c => c.slice()), labels: labels.slice(),
                  pass: it + 1, inertia: inertiaOf(X, labels, C) });
  }
  return frames;
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 01 — supervised vs unsupervised
   ══════════════════════════════════════════════════════════════════ */

let supMode = 0;
function setSup(i) { supMode = i; segPick('seg-sup', i); drawSup(); }

function drawSup() {
  const c = canvasSetup('cv-sup', 330);
  const { ctx, W, H } = c;
  const pad = 40;
  const sx = x => pad + x / 10 * (W - pad * 2);
  const sy = y => H - pad - y / 10 * (H - pad * 1.6);
  const FIT = kmeansFit(DATA3, 3, 42, 10);
  const TRUE_NAMES = ['students', 'professionals', 'retirees'];

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const heads = ['X and y — every point already carries its answer',
                 'X only — this is what clustering is handed',
                 'labels_ — three groups, and three numbers'];
  haloText(ctx, heads[supMode], 8, 6, COL.accent);

  DATA3.forEach((p, i) => {
    let col;
    if (supMode === 0) col = CLU[TRUTH3[i]];
    else if (supMode === 1) col = 'rgba(230,237,243,.5)';
    else col = CLU[FIT.labels[i]];
    ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 5.5, 0, 7);
    ctx.fillStyle = supMode === 1 ? 'rgba(230,237,243,.35)' : hexA(col, .8);
    ctx.fill();
    ctx.strokeStyle = supMode === 1 ? 'rgba(230,237,243,.6)' : '#fff';
    ctx.lineWidth = 1.2; ctx.stroke();
  });

  if (supMode === 0) {
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
    BLOB3.forEach((b, j) => haloText(ctx, TRUE_NAMES[j], sx(b[0]), sy(b[1]) - 44, CLU[j]));
  }
  if (supMode === 2) {
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
    FIT.C.forEach((c2, j) => {
      const x = sx(c2[0]), y = sy(c2[1]);
      ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x - 9, y - 7); ctx.lineTo(x + 9, y - 7); ctx.closePath();
      ctx.fillStyle = hexA(CLU[j], .85); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
      haloText(ctx, 'cluster ' + j, x, y - 26, CLU[j]);
    });
  }

  const outs = [
`X.shape  -> (24, 2)
y        -> ['students', 'students', ..., 'retirees']
  the answer key exists. a classifier learns the mapping X -> y
  and accuracy_score tells you how often it got it right`,
`X.shape  -> (24, 2)
y        -> there is no y
  no answer key, so no accuracy, no train_test_split.
  the only thing to learn is the shape of the cloud itself`,
`labels_  -> [0 0 0 ... 1 1 1 ... 2 2 2]
inertia_ -> ${f2(FIT.inertia)}
  three groups found, in ${FIT.iter} passes, with nobody
  telling it that "students" or "retirees" were ever a thing.
  the numbers 0/1/2 are arbitrary — the grouping is not`];
  $('out-sup').textContent = outs[supMode];
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 02 — the five steps, stepped or played
   ══════════════════════════════════════════════════════════════════ */

let lloydK_ = 3, lloydSeed = 3, lloydFr = [], lloydIdx = 0, lloydPlaying = false, lloydT0 = 0;

function lloydReset() {
  lloydFr = lloydFrames(DATA3, lloydK_, lloydSeed);
  lloydIdx = 0; lloydPlaying = false; lloydT0 = performance.now();
  $('btn-lloyd').textContent = '▶ run';
  drawLloyd();
}
function lloydK(v) { lloydK_ = v; $('val-k').textContent = 'K = ' + v; lloydReset(); }
function lloydReseed() { lloydSeed = (lloydSeed + 1) % 97 + 1; lloydReset(); }
function lloydStep() {
  lloydPlaying = false; $('btn-lloyd').textContent = '▶ run';
  if (lloydIdx < lloydFr.length - 1) { lloydIdx++; lloydT0 = performance.now(); }
  drawLloyd();
}
function lloydPlay() {
  if (lloydIdx >= lloydFr.length - 1) lloydIdx = 0;
  lloydPlaying = !lloydPlaying;
  $('btn-lloyd').textContent = lloydPlaying ? '❚❚ pause' : '▶ run';
  lloydT0 = performance.now();
  drawLloyd();
}

function drawLloyd() {
  if (!lloydFr.length) lloydFr = lloydFrames(DATA3, lloydK_, lloydSeed);

  function frame(now) {
    const t = clamp01((now - lloydT0) / 700);
    if (lloydPlaying && t >= 1 && lloydIdx < lloydFr.length - 1) { lloydIdx++; lloydT0 = now; }
    if (lloydPlaying && lloydIdx >= lloydFr.length - 1 && t >= 1) {
      lloydPlaying = false; $('btn-lloyd').textContent = '↻ run again';
    }

    const fr = lloydFr[lloydIdx], prev = lloydFr[Math.max(0, lloydIdx - 1)];
    const e = easeOut(t);

    /* light the matching step in the strip above the canvas */
    let step = 0;
    if (fr.kind === 'assign') step = fr.pass === 1 ? 1 : 3;
    else if (fr.kind === 'update') step = 2;
    if (lloydIdx === lloydFr.length - 1 && lloydIdx > 0) step = 4;
    document.querySelectorAll('#algo-strip .algo-step')
      .forEach(el => el.classList.toggle('on', +el.dataset.step === step));

    const c = canvasSetup('cv-lloyd', 360);
    const { ctx, W, H } = c;
    const pad = 42;
    const sx = x => pad + x / 10 * (W - pad * 2);
    const sy = y => H - pad - y / 10 * (H - pad * 1.6);

    const C = fr.C.map((c2, j) => [prev.C[j][0] + (c2[0] - prev.C[j][0]) * e,
                                   prev.C[j][1] + (c2[1] - prev.C[j][1]) * e]);

    /* during an update step, show where each centre came from */
    if (fr.kind === 'update') C.forEach((c2, j) => {
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = hexA(CLU[j], .45); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(prev.C[j][0]), sy(prev.C[j][1])); ctx.lineTo(sx(c2[0]), sy(c2[1])); ctx.stroke();
      ctx.restore();
    });

    DATA3.forEach((p, i) => {
      const lab = fr.labels[i];
      const x = sx(p[0]), y = sy(p[1]);
      if (lab >= 0) {
        /* the thin spoke to its own centre — the thing being minimised */
        ctx.strokeStyle = hexA(CLU[lab], .22); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(sx(C[lab][0]), sy(C[lab][1])); ctx.stroke();
      }
      const flipped = fr.kind === 'assign' && prev.labels[i] !== lab && lab >= 0;
      const a = flipped ? e : 1;
      ctx.beginPath(); ctx.arc(x, y, flipped ? 5 + 3 * (1 - e) : 5, 0, 7);
      ctx.fillStyle = lab < 0 ? 'rgba(230,237,243,.3)' : hexA(CLU[lab], .3 + .5 * a);
      ctx.fill();
      ctx.strokeStyle = lab < 0 ? 'rgba(230,237,243,.55)' : hexA(CLU[lab], .45 + .55 * a);
      ctx.lineWidth = flipped ? 2.2 : 1.5; ctx.stroke();
    });

    C.forEach((c2, j) => {
      const x = sx(c2[0]), y = sy(c2[1]);
      ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x - 10, y - 8); ctx.lineTo(x + 10, y - 8); ctx.closePath();
      ctx.fillStyle = hexA(CLU[j], .9); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    const flips = fr.kind === 'assign'
      ? DATA3.reduce((s, _, i) => s + (prev.labels[i] !== fr.labels[i] ? 1 : 0), 0) : 0;
    const done = lloydIdx === lloydFr.length - 1 && lloydIdx > 0;
    const names = { init: '1 · initialise', assign: fr.pass === 1 ? '2 · assign' : '4 · reassign', update: '3 · update' };
    $('out-lloyd').textContent =
`frame ${lloydIdx} / ${lloydFr.length - 1}   ${names[fr.kind]}   pass ${fr.pass}
${fr.kind === 'init'
  ? `${lloydK_} of the 24 points picked at random as starting centres`
  : fr.kind === 'assign'
    ? `${flips === 0 ? 'no point changed group' : flips + ' point' + (flips > 1 ? 's' : '') + ' changed group'}`
    : `each centre moved to the mean of its own points`}
inertia = ${fr.inertia == null ? '—' : f2(fr.inertia)}${done ? '   ← converged, this is what fit() returns' : ''}`;

    if (lloydPlaying || t < 1) RAF[2] = requestAnimationFrame(frame);
  }
  stopRaf(2);
  RAF[2] = requestAnimationFrame(frame);
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 03 — assignment, distance and Voronoi regions
   ══════════════════════════════════════════════════════════════════ */

let vorMode = 0, vorProbe = [6.2, 5.4];
function setVor(i) { vorMode = i; segPick('seg-vor', i); drawVor(); }

const VOR_C = [[2.4, 7.2], [7.6, 7.0], [5.0, 2.6]];

function drawVor() {
  const c = canvasSetup('cv-vor', 340);
  const { ctx, W, H } = c;
  const pad = 34;
  const sx = x => pad + x / 10 * (W - pad * 2);
  const sy = y => H - pad - y / 10 * (H - pad * 1.4);
  const ix = px => (px - pad) / (W - pad * 2) * 10;
  const iy = py => (H - pad - py) / (H - pad * 1.4) * 10;

  /* the regions: colour every screen pixel by its nearest centre */
  if (vorMode === 1) {
    const step = 4;
    for (let px = pad; px < W - pad; px += step)
      for (let py = pad * 0.4; py < H - pad; py += step) {
        const j = nearest([ix(px), iy(py)], VOR_C);
        ctx.fillStyle = hexA(CLU[j], .13); ctx.fillRect(px, py, step, step);
      }
  }

  const d = VOR_C.map(c2 => Math.sqrt(dist2(vorProbe, c2)));
  const win = d.indexOf(Math.min(...d));

  /* the probe's three measurements */
  VOR_C.forEach((c2, j) => {
    const x1 = sx(vorProbe[0]), y1 = sy(vorProbe[1]), x2 = sx(c2[0]), y2 = sy(c2[1]);
    ctx.save();
    ctx.setLineDash(j === win ? [] : [5, 5]);
    ctx.strokeStyle = j === win ? CLU[j] : hexA(CLU[j], .38);
    ctx.lineWidth = j === win ? 2.4 : 1.3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, f2(d[j]), (x1 + x2) / 2, (y1 + y2) / 2 - 9, j === win ? CLU[j] : 'rgba(230,237,243,.5)');
  });

  VOR_C.forEach((c2, j) => {
    const x = sx(c2[0]), y = sy(c2[1]);
    ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x - 10, y - 8); ctx.lineTo(x + 10, y - 8); ctx.closePath();
    ctx.fillStyle = hexA(CLU[j], .9); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center';
    haloText(ctx, 'c' + j, x, y - 20, CLU[j]);
  });

  /* the probe */
  const px = sx(vorProbe[0]), py = sy(vorProbe[1]);
  ctx.beginPath(); ctx.arc(px, py, 7, 0, 7);
  ctx.fillStyle = hexA(CLU[win], .55); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

  ctx.font = '10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, vorMode === 1 ? 'the plane, coloured by nearest centre' : 'move the mouse over the plot',
           8, 6, 'rgba(230,237,243,.5)');

  $('out-vor').textContent =
`x = [${f1(vorProbe[0])}, ${f1(vorProbe[1])}]

d(x, c0) = ${f3(d[0])}${win === 0 ? '   <- smallest' : ''}
d(x, c1) = ${f3(d[1])}${win === 1 ? '   <- smallest' : ''}
d(x, c2) = ${f3(d[2])}${win === 2 ? '   <- smallest' : ''}

argmin -> ${win}      kmeans.predict([x]) -> array([${win}])`;
}

/* the probe follows the mouse — no slider needed, the plot is the control */
(function bindVor() {
  const cv = $('cv-vor');
  cv.addEventListener('mousemove', ev => {
    const r = cv.getBoundingClientRect();
    const pad = 34, W = cv.width, H = cv.height;
    const px = (ev.clientX - r.left) * (cv.width / r.width);
    const py = (ev.clientY - r.top) * (cv.height / r.height);
    vorProbe = [clampR((px - pad) / (W - pad * 2) * 10), clampR((H - pad - py) / (H - pad * 1.4) * 10)];
    drawVor();
  });
  const clampR = v => v < 0.2 ? 0.2 : v > 9.8 ? 9.8 : v;
})();

/* ══════════════════════════════════════════════════════════════════
   PANEL 04 — the centroid is the mean
   ══════════════════════════════════════════════════════════════════ */

const MEAN_TRUE = [MEANPTS.reduce((s, p) => s + p[0], 0) / MEANPTS.length,
                   MEANPTS.reduce((s, p) => s + p[1], 0) / MEANPTS.length];

function meanMove() { drawMean(); }
function meanSnap() {
  $('sl-cx').value = Math.round(MEAN_TRUE[0] * 10);
  $('sl-cy').value = Math.round(MEAN_TRUE[1] * 10);
  drawMean();
}

function drawMean() {
  const cx = +$('sl-cx').value / 10, cy = +$('sl-cy').value / 10;
  $('val-cx').textContent = 'x = ' + f1(cx);
  $('val-cy').textContent = 'y = ' + f1(cy);

  const c = canvasSetup('cv-mean', 330);
  const { ctx, W, H } = c;
  const pad = 40;
  const sx = x => pad + x / 10 * (W - pad * 2);
  const sy = y => H - pad - y / 10 * (H - pad * 1.5);

  const here = MEANPTS.reduce((s, p) => s + dist2(p, [cx, cy]), 0);
  const best = MEANPTS.reduce((s, p) => s + dist2(p, MEAN_TRUE), 0);

  /* the true mean, ghosted, so the target is visible while you drag */
  const mx = sx(MEAN_TRUE[0]), my = sy(MEAN_TRUE[1]);
  ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = hexA(COL.green, .55); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(mx, my, 11, 0, 7); ctx.stroke(); ctx.restore();
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  haloText(ctx, 'the mean', mx, my - 22, COL.green);

  MEANPTS.forEach(p => {
    const x = sx(p[0]), y = sy(p[1]);
    ctx.strokeStyle = hexA(COL.accent, .35); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(sx(cx), sy(cy)); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7);
    ctx.fillStyle = hexA(COL.accent, .3); ctx.fill();
    ctx.strokeStyle = COL.accent; ctx.lineWidth = 1.5; ctx.stroke();
  });

  const gx = sx(cx), gy = sy(cy);
  ctx.beginPath(); ctx.moveTo(gx, gy + 10); ctx.lineTo(gx - 10, gy - 8); ctx.lineTo(gx + 10, gy - 8); ctx.closePath();
  const ok = Math.abs(here - best) < 0.05;
  ctx.fillStyle = hexA(ok ? COL.green : COL.red, .9); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

  /* a bar showing how far above the minimum this position is */
  const barW = W - 100, over = (here - best) / best;
  ctx.fillStyle = 'rgba(230,237,243,.08)';
  roundRect(ctx, 50, 14, barW, 9, 4); ctx.fill();
  ctx.fillStyle = ok ? COL.green : COL.red;
  roundRect(ctx, 50, 14, Math.max(4, barW * clamp01(over / 1.4)), 9, 4); ctx.fill();
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  haloText(ctx, ok ? 'minimum' : '+' + Math.round(over * 100) + '%', 50 + barW + 6, 18,
           ok ? COL.green : COL.red);

  $('out-mean').textContent =
`centre here     = [${f2(cx)}, ${f2(cy)}]
sum of squared distances = ${f2(here)}

X.mean(axis=0)  = [${f2(MEAN_TRUE[0])}, ${f2(MEAN_TRUE[1])}]
sum at the mean          = ${f2(best)}   <- the smallest value there is
${ok ? '\nyou are at the mean. no other point in the plane does better.'
     : '\nevery other position costs more — by ' + f2(here - best) + ' right now.'}`;
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 05 — WCSS drawn as actual squares
   ══════════════════════════════════════════════════════════════════ */

let wk = 3, wsq = 0;
function wcssK(v) { wk = v; $('val-wk').textContent = 'K = ' + v; drawWcss(); }
function setWsq(i) { wsq = i; segPick('seg-wsq', i); drawWcss(); }

function drawWcss() {
  const FIT = kmeansFit(DATA3, wk, 42, 10);
  const c = canvasSetup('cv-wcss', 340);
  const { ctx, W, H } = c;
  const pad = 44;
  const sx = x => pad + x / 10 * (W - pad * 2);
  const sy = y => H - pad - y / 10 * (H - pad * 1.5);

  /* every point's squared distance, drawn as the square it literally is.
     at K = 1 those squares are enormous, so they are clipped to the plot */
  ctx.save();
  ctx.beginPath(); ctx.rect(2, 2, W - 4, H - 4); ctx.clip();
  DATA3.forEach((p, i) => {
    const j = FIT.labels[i], cc = FIT.C[j];
    const dx = sx(p[0]) - sx(cc[0]), dy = sy(p[1]) - sy(cc[1]);
    const d = Math.sqrt(dx * dx + dy * dy);
    if (wsq === 0 && d > 3) {
      /* a square of side d, hung off the segment, area = the contribution */
      ctx.save();
      ctx.translate(sx(p[0]), sy(p[1]));
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = hexA(CLU[j], .10);
      ctx.strokeStyle = hexA(CLU[j], .32); ctx.lineWidth = 1;
      ctx.fillRect(0, 0, d, d); ctx.strokeRect(0, 0, d, d);
      ctx.restore();
    }
    ctx.strokeStyle = hexA(CLU[j], .6); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx(p[0]), sy(p[1])); ctx.lineTo(sx(cc[0]), sy(cc[1])); ctx.stroke();
  });
  ctx.restore();

  DATA3.forEach((p, i) => {
    const j = FIT.labels[i];
    ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 5, 0, 7);
    ctx.fillStyle = hexA(CLU[j], .75); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.1; ctx.stroke();
  });

  FIT.C.forEach((c2, j) => {
    const x = sx(c2[0]), y = sy(c2[1]);
    ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x - 10, y - 8); ctx.lineTo(x + 10, y - 8); ctx.closePath();
    ctx.fillStyle = hexA(CLU[j], .95); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  });

  ctx.font = '10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, wsq === 0 ? 'each square has area (distance)² — WCSS is their total area'
                          : 'each line is one distance — WCSS squares them and adds up',
           8, 6, 'rgba(230,237,243,.5)');

  /* the per-cluster breakdown */
  const per = [];
  for (let j = 0; j < wk; j++) {
    let s = 0, n = 0;
    DATA3.forEach((p, i) => { if (FIT.labels[i] === j) { s += dist2(p, FIT.C[j]); n++; } });
    per.push({ j, s, n });
  }
  $('out-wcss').textContent =
`KMeans(n_clusters=${wk}, random_state=42, n_init=10).fit(X)

${per.map(p => `cluster ${p.j}: ${String(p.n).padStart(2)} points, sum of squares = ${f2(p.s).padStart(7)}`).join('\n')}
${'-'.repeat(46)}
inertia_ = ${f2(FIT.inertia)}`;
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 06 — increasing K always lowers WCSS
   ══════════════════════════════════════════════════════════════════ */

const OVER_CURVE = Array.from({ length: 24 }, (_, i) => kmeansFit(DATA3, i + 1, 42, 8).inertia);

let ok_ = 3;
function overK(v) { ok_ = v; $('val-ok').textContent = 'K = ' + v; drawOver(); }

function drawOver() {
  const FIT = kmeansFit(DATA3, ok_, 42, 8);
  const c = canvasSetup('cv-over', 330);
  const { ctx, W, H } = c;
  const half = W / 2 - 8;

  /* left: the clustering itself */
  const pad = 30;
  const sx = x => pad + x / 10 * (half - pad * 1.4);
  const sy = y => H - pad - y / 10 * (H - pad * 1.7);
  DATA3.forEach((p, i) => {
    const j = FIT.labels[i];
    ctx.strokeStyle = hexA(CLU[j % 8], .45); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx(p[0]), sy(p[1])); ctx.lineTo(sx(FIT.C[j][0]), sy(FIT.C[j][1])); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 4.5, 0, 7);
    ctx.fillStyle = hexA(CLU[j % 8], .8); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
  });
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'K = ' + ok_, 8, 6, COL.accent);
  if (ok_ === 24) haloText(ctx, 'every point is its own centre', 8, 22, COL.red);

  /* right: the curve, with the current K marked */
  const gx0 = W / 2 + 22, gx1 = W - 14, gy0 = 26, gy1 = H - 34;
  const mx = Math.max(...OVER_CURVE);
  const cx = k => gx0 + (k - 1) / 23 * (gx1 - gx0);
  const cy = v => gy1 - v / mx * (gy1 - gy0);
  ctx.strokeStyle = 'rgba(230,237,243,.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
  ctx.strokeStyle = COL.blue; ctx.lineWidth = 2;
  ctx.beginPath();
  OVER_CURVE.forEach((v, i) => i ? ctx.lineTo(cx(i + 1), cy(v)) : ctx.moveTo(cx(i + 1), cy(v)));
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx(ok_), cy(OVER_CURVE[ok_ - 1]), 5, 0, 7);
  ctx.fillStyle = COL.accent; ctx.fill();
  ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  haloText(ctx, f1(OVER_CURVE[ok_ - 1]), cx(ok_), cy(OVER_CURVE[ok_ - 1]) - 8, COL.accent);
  ctx.textBaseline = 'top'; ctx.font = 'bold 9px Courier New';
  haloText(ctx, 'WCSS vs K', gx0, gy0 - 18, 'rgba(230,237,243,.5)');
  haloText(ctx, 'K = 1', gx0, gy1 + 6, 'rgba(230,237,243,.4)');
  ctx.textAlign = 'right';
  haloText(ctx, 'K = n = 24', gx1, gy1 + 6, 'rgba(230,237,243,.4)');

  const drop = ok_ > 1 ? (1 - OVER_CURVE[ok_ - 1] / OVER_CURVE[ok_ - 2]) * 100 : 0;
  $('out-over').textContent =
`K = ${ok_}     inertia_ = ${f2(OVER_CURVE[ok_ - 1])}
${ok_ > 1 ? `improvement over K = ${ok_ - 1}: ${drop.toFixed(1)}%` : '(one cluster: every point measured to the overall mean)'}
${ok_ === 24
  ? '\ninertia_ = 0.00 — a "perfect" model that has learned\nnothing but a list of your 24 rows. this is overfitting.'
  : ok_ > 6
    ? '\npast the third blob, every extra cluster just splits a real\ngroup in half. the score improves; the meaning does not.'
    : ''}`;
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 07 — the elbow, with a real bend
   ══════════════════════════════════════════════════════════════════ */

let ebBlobs = 3, ebT0 = 0;
const EB_CENTERS = {
  2: [[2.6, 7.4], [7.4, 3.2]],
  3: [[2.4, 7.4], [7.6, 7.2], [4.8, 2.4]],
  4: [[2.2, 7.6], [7.8, 7.4], [2.4, 2.4], [7.6, 2.6]],
  5: [[2.2, 7.8], [7.8, 7.6], [2.2, 2.4], [7.8, 2.4], [5.0, 5.0]]
};
function setEB(n) { ebBlobs = n; segPick('seg-eb', [2,3,4,5].indexOf(n)); elbowRun(); }
function elbowRun() { ebT0 = performance.now(); drawElbow(); }

function drawElbow() {
  const X = makeBlobs(EB_CENTERS[ebBlobs], Math.round(60 / ebBlobs), 0.62, 11 + ebBlobs);
  const wcss = Array.from({ length: 10 }, (_, i) => kmeansFit(X, i + 1, 42, 6).inertia);

  /* the bend, measured rather than eyeballed: normalise both axes to [0,1],
     draw the chord from K=1 to K=10, and take the K furthest below it */
  const nx = k => (k - 1) / 9;
  const ny = v => (v - wcss[9]) / (wcss[0] - wcss[9]);
  let bend = 2, bd = -1;
  for (let k = 2; k <= 9; k++) {
    /* the chord runs from (0,1) to (1,0), so |x + y - 1| / √2 is the distance */
    const d = Math.abs(nx(k) + ny(wcss[k - 1]) - 1) / Math.SQRT2;
    if (d > bd) { bd = d; bend = k; }
  }

  function frame(now) {
    const t = clamp01((now - ebT0) / 2200);
    const shown = Math.max(1, Math.round(t * 10));
    const p = plot2('cv-elbow', 330, 0.6, 10.4, 0, Math.max(...wcss) * 1.12, {
      xticks: [1,2,3,4,5,6,7,8,9,10], yticks: [],
      xlab: 'Number of Clusters (K)', ylab: 'WCSS', padL: 34
    });
    const { ctx, sx, sy } = p;

    ctx.strokeStyle = COL.blue; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < shown; i++) i ? ctx.lineTo(sx(i + 1), sy(wcss[i])) : ctx.moveTo(sx(1), sy(wcss[0]));
    ctx.stroke();
    for (let i = 0; i < shown; i++) {
      ctx.strokeStyle = COL.blue; ctx.lineWidth = 2;
      const x = sx(i + 1), y = sy(wcss[i]);
      ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4);
      ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
    }

    if (shown >= 10) {
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = COL.red; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(sx(bend), sy(0)); ctx.lineTo(sx(bend), sy(Math.max(...wcss) * 1.08)); ctx.stroke();
      ctx.restore();
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      haloText(ctx, 'elbow · K = ' + bend, sx(bend) + 6, sy(Math.max(...wcss) * 1.04), COL.red);
    }

    $('out-elbow').textContent =
`wcss = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=i, random_state=42, n_init=10)
    kmeans.fit(X)
    wcss.append(kmeans.inertia_)

wcss -> [${wcss.slice(0, shown).map(v => f1(v)).join(', ')}${shown < 10 ? ', ...' : ''}]
${shown >= 10 ? `\nthe data really has ${ebBlobs} blobs, and the bend lands on K = ${bend}` : ''}`;

    if (t < 1) RAF[7] = requestAnimationFrame(frame);
  }
  stopRaf(7);
  RAF[7] = requestAnimationFrame(frame);
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 08 — scale first
   ══════════════════════════════════════════════════════════════════ */

let scMode = 0;
function setSc(i) { scMode = i; segPick('seg-sc', i); drawScale(); }

function zscore(X) {
  const m = X[0].length, mu = new Array(m).fill(0), sd = new Array(m).fill(0);
  for (const r of X) for (let d = 0; d < m; d++) mu[d] += r[d] / X.length;
  for (const r of X) for (let d = 0; d < m; d++) sd[d] += (r[d] - mu[d]) ** 2 / X.length;
  const s = sd.map(Math.sqrt);
  return X.map(r => r.map((v, d) => (v - mu[d]) / s[d]));
}
const CUST_Z = zscore(CUST);

function drawScale() {
  const X = scMode === 0 ? CUST : CUST_Z;
  const FIT = kmeansFit(X, 3, 42, 10);
  const c = canvasSetup('cv-scale', 340);
  const { ctx, W, H } = c;
  const padL = 56, padB = 38, padT = 30, padR = 18;

  /* always plotted in real units, so the two modes are comparable */
  const sx = a => padL + (a - 20) / 46 * (W - padL - padR);
  const sy = b => H - padB - (b - 12000) / 40000 * (H - padT - padB);

  ctx.strokeStyle = 'rgba(230,237,243,.22)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, padT - 8); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
  ctx.font = '9px Courier New'; ctx.fillStyle = COL.tick;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  [20, 30, 40, 50, 60].forEach(a => ctx.fillText(a, sx(a), H - padB + 6));
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  [20000, 30000, 40000, 50000].forEach(b => ctx.fillText((b / 1000) + 'k', padL - 6, sy(b)));
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  haloText(ctx, 'age (years)', W - padR, H - padB + 18, 'rgba(230,237,243,.5)');
  ctx.textAlign = 'left';
  haloText(ctx, 'balance (£)', 4, 6, 'rgba(230,237,243,.5)');

  CUST.forEach((p, i) => {
    const j = FIT.labels[i];
    ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 6, 0, 7);
    ctx.fillStyle = hexA(CLU[j], .75); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
  });

  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, scMode === 0 ? 'clustered on raw columns' : 'clustered on standardised columns',
           padL + 6, 6, scMode === 0 ? COL.red : COL.green);

  /* how much of the distance each column is responsible for */
  const spread = d => {
    const vals = X.map(r => r[d]);
    const mu = vals.reduce((s, v) => s + v, 0) / vals.length;
    return vals.reduce((s, v) => s + (v - mu) ** 2, 0);
  };
  const sa = spread(0), sb = spread(1), tot = sa + sb;

  $('out-scale').textContent =
`X = ${scMode === 0 ? 'df[["age", "balance"]]              # raw' : 'StandardScaler().fit_transform(X)   # z-scores'}

share of the total squared spread, per column:
  age     ${(sa / tot * 100).toFixed(4).padStart(8)}%
  balance ${(sb / tot * 100).toFixed(4).padStart(8)}%

${scMode === 0
  ? 'balance owns the distance entirely, so the three clusters are\nthree bands of balance. the 24-year-olds and the 60-year-olds\nland in the same clusters: 30 years of age is worth less to\nthe distance than a few hundred pounds.'
  : 'both columns now weigh the same, and the three clusters are\nthe three real groups: young savers, older savers on a similar\nbalance, and mid-career high earners.'}`;
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 09 — random_state and n_init
   ══════════════════════════════════════════════════════════════════ */

/* ten single-start runs, exactly what n_init=1 would give you ten times */
const SEED_RUNS = Array.from({ length: 10 }, (_, s) => kmeansOnce(DATA3, 3, s * 104729 + 17));
const SEED_BEST = SEED_RUNS.reduce((b, r, i) => r.inertia < SEED_RUNS[b].inertia ? i : b, 0);

let seedI = 1;
function seedPick(v) { seedI = v; $('sl-seed').value = v; $('val-seed').textContent = 'random_state = ' + v; drawSeed(); }
function seedBest() { seedPick(SEED_BEST); }

function drawSeed() {
  const R = SEED_RUNS[seedI];
  const c = canvasSetup('cv-seed', 340);
  const { ctx, W, H } = c;
  const half = W * 0.58;
  const pad = 32;
  const sx = x => pad + x / 10 * (half - pad * 1.5);
  const sy = y => H - pad - y / 10 * (H - pad * 1.7);

  DATA3.forEach((p, i) => {
    const j = R.labels[i];
    ctx.strokeStyle = hexA(CLU[j], .28); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx(p[0]), sy(p[1])); ctx.lineTo(sx(R.C[j][0]), sy(R.C[j][1])); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 5, 0, 7);
    ctx.fillStyle = hexA(CLU[j], .75); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.1; ctx.stroke();
  });
  R.C.forEach((c2, j) => {
    const x = sx(c2[0]), y = sy(c2[1]);
    ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x - 10, y - 8); ctx.lineTo(x + 10, y - 8); ctx.closePath();
    ctx.fillStyle = hexA(CLU[j], .9); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  });

  const isBest = seedI === SEED_BEST;
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'random_state = ' + seedI, 8, 6, isBest ? COL.green : COL.red);

  /* the bar chart of all ten runs */
  const bx0 = half + 14, bx1 = W - 16;
  const worst = Math.max(...SEED_RUNS.map(r => r.inertia));
  const bh = (H - 60) / 10;
  ctx.font = '9px Courier New'; ctx.textBaseline = 'middle';
  haloText(ctx, 'inertia of all 10 runs', bx0, 8, 'rgba(230,237,243,.5)');
  SEED_RUNS.forEach((r, i) => {
    const y = 26 + i * bh;
    const w = (bx1 - bx0 - 40) * (r.inertia / worst);
    ctx.fillStyle = i === seedI ? COL.accent : i === SEED_BEST ? hexA(COL.green, .8) : 'rgba(230,237,243,.16)';
    roundRect(ctx, bx0 + 16, y, Math.max(3, w), bh - 5, 3); ctx.fill();
    ctx.textAlign = 'right'; ctx.fillStyle = i === seedI ? COL.accent : 'rgba(230,237,243,.45)';
    ctx.fillText(i, bx0 + 12, y + bh / 2 - 2);
    ctx.textAlign = 'left';
    haloText(ctx, f1(r.inertia), bx0 + 20 + Math.max(3, w), y + bh / 2 - 2,
             i === seedI ? COL.accent : i === SEED_BEST ? COL.green : 'rgba(230,237,243,.4)');
  });

  $('out-seed').textContent =
`KMeans(n_clusters=3, n_init=1, random_state=${seedI}).fit(X)

inertia_ = ${f2(R.inertia)}   (converged in ${R.iter} passes)
best of the ten starts = ${f2(SEED_RUNS[SEED_BEST].inertia)}  at random_state=${SEED_BEST}

${isBest
  ? 'this run found the real three blobs. this is the one\nn_init=10 keeps — it runs all ten and returns the lowest.'
  : `${(R.inertia / SEED_RUNS[SEED_BEST].inertia).toFixed(1)}x the inertia of the best run — two centres landed in\nthe same blob and split it. it still converged: no point wants\nto move. a local minimum is stable, not correct.`}`;
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 11 — colour quantisation, a real K-Means over real pixels
   ══════════════════════════════════════════════════════════════════ */

let imgK = 4, imgReady = false;

/* the source picture is generated here rather than loaded, so the demo
   works offline and every pixel it clusters is one you can see */
function paintSource() {
  const cv = $('cv-img-a'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  const sky = ctx.createLinearGradient(0, 0, 0, H * .72);
  sky.addColorStop(0, '#1b3a6b'); sky.addColorStop(.55, '#e0713c'); sky.addColorStop(1, '#f6c453');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(W * .68, H * .40, 21, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.beginPath(); ctx.arc(W * .68, H * .40, 33, 0, 7); ctx.fill();
  ctx.fillStyle = '#7a4a5c';
  ctx.beginPath(); ctx.moveTo(0, H * .70);
  ctx.bezierCurveTo(W * .25, H * .56, W * .45, H * .74, W, H * .60);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2f4a45';
  ctx.beginPath(); ctx.moveTo(0, H * .82);
  ctx.bezierCurveTo(W * .3, H * .72, W * .6, H * .90, W, H * .78);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#16332f';
  ctx.beginPath(); ctx.moveTo(0, H * .93);
  ctx.bezierCurveTo(W * .4, H * .86, W * .7, H * .99, W, H * .90);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  imgReady = true;
}

function setImgK(k) { imgK = k; segPick('seg-imgk', [2,4,8,16].indexOf(k)); drawImg(); }

function drawImg() {
  if (!imgReady) paintSource();
  const a = $('cv-img-a'), b = $('cv-img-b');
  const actx = a.getContext('2d'), bctx = b.getContext('2d');
  const W = a.width, H = a.height;
  const src = actx.getImageData(0, 0, W, H);

  /* fit on a sample — 240,000 rows is exactly why MiniBatchKMeans exists */
  const pixels = [], SAMPLE = 4;
  for (let i = 0; i < src.data.length; i += 4 * SAMPLE)
    pixels.push([src.data[i], src.data[i + 1], src.data[i + 2]]);

  const FIT = kmeansFit(pixels, imgK, 42, 3, 18);

  /* then repaint every pixel with the centre of its cluster */
  const out = bctx.createImageData(W, H);
  const uniq = new Set();
  for (let i = 0; i < src.data.length; i += 4) {
    const px = [src.data[i], src.data[i + 1], src.data[i + 2]];
    const j = nearest(px, FIT.C);
    uniq.add(j);
    out.data[i]     = Math.round(FIT.C[j][0]);
    out.data[i + 1] = Math.round(FIT.C[j][1]);
    out.data[i + 2] = Math.round(FIT.C[j][2]);
    out.data[i + 3] = 255;
  }
  bctx.putImageData(out, 0, 0);

  $('cap-img-b').textContent = 'K-Means · ' + imgK + ' colour' + (imgK > 1 ? 's' : '');
  const pal = $('pal-img');
  pal.innerHTML = '';
  FIT.C.forEach(c2 => {
    const i = document.createElement('i');
    i.style.background = `rgb(${Math.round(c2[0])},${Math.round(c2[1])},${Math.round(c2[2])})`;
    i.title = `[${Math.round(c2[0])}, ${Math.round(c2[1])}, ${Math.round(c2[2])}]`;
    pal.appendChild(i);
  });

  const n = W * H;
  const bitsBefore = n * 24, bitsAfter = n * Math.ceil(Math.log2(imgK)) + imgK * 24;
  $('out-img').textContent =
`pixels = image_np.reshape(-1, 3)        -> (${n}, 3)
KMeans(n_clusters=${imgK}, random_state=42).fit(pixels)

cluster_centers_ -> (${imgK}, 3)     ${FIT.C.slice(0, 2).map(c2 => '[' + c2.map(v => Math.round(v)).join(', ') + ']').join('  ')}${imgK > 2 ? '  ...' : ''}
labels_          -> (${n},)   one palette index per pixel

24 bits/pixel  ->  ${Math.ceil(Math.log2(imgK))} bits/pixel + a ${imgK}-colour palette
storage: ${(bitsBefore / 8 / 1024).toFixed(1)} KB  ->  ${(bitsAfter / 8 / 1024).toFixed(1)} KB   (${(bitsBefore / bitsAfter).toFixed(1)}x smaller)`;
}

/* ══════════════════════════════════════════════════════════════════
   boot
   ══════════════════════════════════════════════════════════════════ */

const DRAWS = [drawOverview, drawSup, drawLloyd, drawVor, drawMean, drawWcss,
               drawOver, drawElbow, drawScale, drawSeed, null, drawImg, null, null, null];

updateDots();
/* panel 02 is hidden at boot, so prepare its frames without drawing them */
lloydFr = lloydFrames(DATA3, lloydK_, lloydSeed);
setTimeout(drawOverview, 90);

window.addEventListener('resize', () => {
  stopAll();
  /* the animated panels restart their clock on resize; the static ones redraw */
  if (current === 0) ovT0 = performance.now();
  if (current === 2) lloydT0 = performance.now();
  if (current === 7) ebT0 = performance.now();
  if (DRAWS[current]) DRAWS[current]();
  fitMath($('panel-' + current));
});
