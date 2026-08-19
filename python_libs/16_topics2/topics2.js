/* ══════════════════════════════════════════════════════════════════
   Topics 2 — deck 16
   Encoding, pipelines, cross-validation, grid search and the elbow.
   Every encoder, fold, KNN vote, grid cell and polynomial fit on this
   page is really computed in the browser. The grid in panel 05
   reproduces sklearn's cv_results_ cell by cell, and the degree curve
   in panel 07 reproduces its neg_mean_squared_error to four decimals.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 13;
const LABELS = ['Overview','get_dummies / one-hot','Pipeline','Encoder in the pipeline',
                'cross_val_score + pipe','GridSearchCV','neg_mean_squared_error',
                'Searching for degree','The elbow for degree','Saving the pipeline',
                'Exercises','A1 · Notebook gotchas','A2 · Naming in a param grid'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12];

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
const FCLR = { apple:'#10b981', orange:'#f97316', banana:'#facc15' };

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

/* a box with a title, used by every flow diagram in the deck */
function stepBox(ctx, x, y, w, h, title, sub, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = hexA(color, 0.10); ctx.fill();
  ctx.strokeStyle = hexA(color, 0.75); ctx.lineWidth = 1.6; ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px Courier New'; ctx.textBaseline = 'middle';
  haloText(ctx, title, x + w / 2, y + (sub ? h / 2 - 8 : h / 2), color);
  if (sub) { ctx.font = '9px Courier New'; haloText(ctx, sub, x + w / 2, y + h / 2 + 9, 'rgba(230,237,243,.55)'); }
  ctx.restore();
}

function arrow(ctx, x1, y, x2, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - 5, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 7, y - 4); ctx.lineTo(x2 - 7, y + 4); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
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

const f2 = v => v.toFixed(2);
const f3 = v => v.toFixed(3);
const cl01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const easeOut = v => 1 - Math.pow(1 - v, 3);

/* ══════════════════════════════════════════════════════════════════
   The data — straight out of the notebook
   ══════════════════════════════════════════════════════════════════ */

/* the salary frame */
const DF = [
  { age: 25, job: 'Developer', city: 'Tel Aviv',  salary: 15000 },
  { age: 32, job: 'Teacher',   city: 'Haifa',     salary: 12000 },
  { age: 45, job: 'Developer', city: 'Jerusalem', salary: 22000 },
  { age: 29, job: 'Doctor',    city: 'Haifa',     salary: 18000 },
  { age: 38, job: 'Teacher',   city: 'Tel Aviv',  salary: 16000 }
];
/* pandas sorts the categories, which is where the column order comes from */
const JOBS   = ['Developer', 'Doctor', 'Teacher'];
const CITIES = ['Haifa', 'Jerusalem', 'Tel Aviv'];
const SHORT  = { Developer:'Dev', Doctor:'Doc', Teacher:'Tea', Haifa:'Haifa', Jerusalem:'Jlem', 'Tel Aviv':'TLV', Eilat:'Eilat' };

/* the 9 fruits (cross_val_score cell) */
const F9_X = [[200,7,150],[50,7,160],[220,6,140],[240,9,170],[250,8,165],[230,9,180],[30,12,120],[40,13,130],[20,11,115]];
const F9_Y = ['apple','apple','apple','orange','orange','orange','banana','banana','banana'];

/* the 18 fruits (grid search + joblib cell) */
const F18_X = [[200,7,150],[50,7,160],[220,6,140],[240,9,170],[250,8,165],[230,9,180],
               [30,12,120],[40,13,130],[20,11,115],[210,7,155],[60,6,145],[215,8,158],
               [245,9,175],[235,8,168],[255,10,182],[25,12,118],[35,14,125],[45,11,128]];
const F18_Y = ['apple','apple','apple','orange','orange','orange','banana','banana','banana',
               'apple','apple','apple','orange','orange','orange','banana','banana','banana'];
const FNAMES = ['color', 'size', 'weight'];

/* the 30 points of the polynomial cell */
const PX = Array.from({ length: 30 }, (_, i) => i + 1);
const PY = [5,8,12,15,18,24,30,38,45,55,67,80,95,110,128,147,168,190,215,240,
            268,298,330,365,402,440,481,524,570,618];

/* ══════════════════════════════════════════════════════════════════
   The encoders
   ══════════════════════════════════════════════════════════════════ */
/* pd.get_dummies(X, columns=['job','city'], dtype=int) — categories sorted,
   one column each, dropFirst removes the first category of every column. */
function getDummies(rows, dropFirst) {
  const cols = [{ name: 'age', kind: 'num' }];
  const lv = { job: JOBS, city: CITIES };
  for (const src of ['job', 'city']) {
    const levels = dropFirst ? lv[src].slice(1) : lv[src];
    for (const v of levels) cols.push({ name: src + '_' + v, kind: 'cat', src, level: v });
  }
  const M = rows.map(r => cols.map(c => c.kind === 'num' ? r.age : (r[c.src] === c.level ? 1 : 0)));
  return { cols, M };
}
/* OneHotEncoder(handle_unknown='ignore') on ['job','city'] — the category
   list is learned once and never changes, so an unseen value is all zeros. */
function oneHot(rows) {
  const cols = [];
  for (const v of JOBS) cols.push({ name: 'job_' + v, kind: 'cat', src: 'job', level: v });
  for (const v of CITIES) cols.push({ name: 'city_' + v, kind: 'cat', src: 'city', level: v });
  const M = rows.map(r => cols.map(c => r[c.src] === c.level ? 1 : 0));
  return { cols, M };
}

/* ══════════════════════════════════════════════════════════════════
   Scalers, KNN and cross-validation — the same rules sklearn uses
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

const METRIC = {
  euclidean: (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s); },
  manhattan: (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s; }
};

function knnPredict(Xtr, ytr, x, k, classes, metric) {
  const d = Xtr.map((r, i) => ({ d: METRIC[metric || 'euclidean'](r, x), i }))
               .sort((a, b) => a.d - b.d || a.i - b.i);
  const cnt = {};
  for (const t of d.slice(0, k)) cnt[ytr[t.i]] = (cnt[ytr[t.i]] || 0) + 1;
  /* argmax over the classes in sorted order — first maximum wins, like numpy */
  let best = classes[0];
  for (const c of classes) if ((cnt[c] || 0) > (cnt[best] || 0)) best = c;
  return best;
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
/* StratifiedKFold with no shuffle: inside each class, the members are cut
   into k contiguous blocks. On the 18 fruits that is sklearn's exact split. */
function stratifiedKFold(y, k) {
  const classes = [...new Set(y)].sort();
  const folds = Array.from({ length: k }, () => []);
  for (const c of classes) {
    const idx = [];
    for (let i = 0; i < y.length; i++) if (y[i] === c) idx.push(i);
    const base = Math.floor(idx.length / k), extra = idx.length % k;
    let at = 0;
    for (let f = 0; f < k; f++) {
      const size = base + (f < extra ? 1 : 0);
      for (let j = 0; j < size; j++) folds[f].push(idx[at + j]);
      at += size;
    }
  }
  return folds.map(f => f.sort((a, b) => a - b));
}
const mean = a => a.reduce((x, b) => x + b, 0) / a.length;

/* one fold of a MinMaxScaler + KNN pipeline. scaleInside=false reproduces
   the mistake: one scaler fitted on everything, before the split. */
function foldScore(X, y, test, k, metric, scaleInside) {
  const classes = [...new Set(y)].sort();
  const tset = new Set(test), tri = [];
  for (let i = 0; i < X.length; i++) if (!tset.has(i)) tri.push(i);
  const sc = minMaxFit(scaleInside ? tri.map(i => X[i]) : X);
  const Xtr = sc.transform(tri.map(i => X[i])), ytr = tri.map(i => y[i]);
  const Xte = sc.transform(test.map(i => X[i]));
  let ok = 0;
  test.forEach((ti, j) => { if (knnPredict(Xtr, ytr, Xte[j], Math.min(k, Xtr.length), classes, metric) === y[ti]) ok++; });
  return { score: ok / test.length, mn: sc.mn, mx: sc.mx };
}

/* ══════════════════════════════════════════════════════════════════
   Least squares — Householder QR on a column-scaled design matrix.
   Reproduces sklearn's LinearRegression to 4 decimals for degree 1..7
   on this data; at degree 8 the Vandermonde matrix is numerically
   singular and no two solvers agree (see the note in panel 07).
   ══════════════════════════════════════════════════════════════════ */
function lstsq(A, b) {
  const n = A.length, m = A[0].length, s = [];
  for (let j = 0; j < m; j++) { let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(A[i][j])); s.push(mx || 1); }
  const R = A.map(r => r.map((v, j) => v / s[j])), y = b.slice();
  for (let k = 0; k < m; k++) {
    let nrm = 0; for (let i = k; i < n; i++) nrm += R[i][k] ** 2;
    nrm = Math.sqrt(nrm);
    if (nrm === 0) continue;
    if (R[k][k] > 0) nrm = -nrm;
    const v = new Array(n).fill(0);
    for (let i = k; i < n; i++) v[i] = R[i][k];
    v[k] -= nrm;
    let vn = 0; for (let i = k; i < n; i++) vn += v[i] ** 2;
    if (vn === 0) continue;
    for (let j = k; j < m; j++) {
      let d = 0; for (let i = k; i < n; i++) d += v[i] * R[i][j];
      d = 2 * d / vn;
      for (let i = k; i < n; i++) R[i][j] -= d * v[i];
    }
    let d = 0; for (let i = k; i < n; i++) d += v[i] * y[i];
    d = 2 * d / vn;
    for (let i = k; i < n; i++) y[i] -= d * v[i];
  }
  const c = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let sum = y[i];
    for (let j = i + 1; j < m; j++) sum -= R[i][j] * c[j];
    c[i] = Math.abs(R[i][i]) < 1e-12 ? 0 : sum / R[i][i];
  }
  return c.map((v, j) => v / s[j]);
}
/* PolynomialFeatures(degree=d) is just [1, x, x^2, ... x^d] */
const polyDesign = (X, d) => X.map(x => { const r = []; let p = 1; for (let j = 0; j <= d; j++) { r.push(p); p *= x; } return r; });
const polyFit  = (X, y, d) => lstsq(polyDesign(X, d), y);
const polyPred = (coef, x) => { let s = 0, p = 1; for (const c of coef) { s += c * p; p *= x; } return s; };
const mseOf = (pred, act) => pred.reduce((s, v, i) => s + (v - act[i]) ** 2, 0) / pred.length;

const DEGREES = [1, 2, 3, 4, 5, 6, 7, 8];
const POLY_COEF = DEGREES.map(d => polyFit(PX, PY, d));
const TRAIN_MSE = POLY_COEF.map(c => mseOf(PX.map(x => polyPred(c, x)), PY));
/* a regressor gets plain KFold, in row order — every fold is an extrapolation */
const PFOLDS = kFold(30, 5);
const CV_MSE = DEGREES.map(d => mean(PFOLDS.map(te => {
  const ts = new Set(te), tri = [];
  for (let i = 0; i < 30; i++) if (!ts.has(i)) tri.push(i);
  const c = polyFit(tri.map(i => PX[i]), tri.map(i => PY[i]), d);
  return mseOf(te.map(i => polyPred(c, PX[i])), te.map(i => PY[i]));
})));
const CV_BEST = CV_MSE.indexOf(Math.min(...CV_MSE));

/* the elbow: the point furthest below the chord from the first to the last.
   Which point that is depends on the axis, so we compute both. */
function elbowOf(vals, logScale) {
  const v = logScale ? vals.map(Math.log10) : vals.slice();
  const n = v.length, gaps = v.map((y, i) => (v[0] + (v[n - 1] - v[0]) * i / (n - 1)) - y);
  return { gaps, best: gaps.indexOf(Math.max(...gaps)) };
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 0: the overview loop, in two acts.
   Act 1 — a table with two text columns becomes a numeric matrix.
   Act 2 — a grid of hyper-parameters is searched and a winner circled.
   ══════════════════════════════════════════════════════════════════ */
const OV_DUR = 13000, OV_ACT2 = 6400;
const OV_ENC = getDummies(DF, false);

function drawOverview() {
  const t0 = performance.now();
  const loop = now => {
    const t = (now - t0) % OV_DUR;
    const c = canvasSetup('cv-overview', 380);
    const { ctx, W, H } = c;
    const act1 = t < OV_ACT2;
    const fade = act1 ? cl01(t / 400) * cl01((OV_ACT2 - t) / 400)
                      : cl01((t - OV_ACT2) / 400) * cl01((OV_DUR - t) / 500);
    ctx.save(); ctx.globalAlpha = fade;

    if (act1) {
      /* ── Act 1: the table becomes a matrix ── */
      const rowH = 30, top = 96, lw = 62, lx = 6;
      ctx.textBaseline = 'middle';
      /* the original three columns */
      ['age', 'job', 'city'].forEach((nm, j) => {
        ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
        haloText(ctx, nm, lx + j * lw + lw / 2, top - 14, j === 0 ? COL.cyan : j === 1 ? COL.green : COL.orange);
      });
      DF.forEach((r, i) => {
        const a = cl01((t - 300 - i * 90) / 400);
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = fade * a;
        [String(r.age), SHORT[r.job], SHORT[r.city]].forEach((v, j) => {
          roundRect(ctx, lx + j * lw + 1.5, top + i * rowH + 2, lw - 3, rowH - 5, 5);
          ctx.fillStyle = j === 0 ? 'rgba(6,182,212,.10)' : 'rgba(255,255,255,.04)'; ctx.fill();
          ctx.strokeStyle = j === 0 ? hexA(COL.cyan, .5) : 'rgba(230,237,243,.16)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.font = '10px Courier New'; ctx.textAlign = 'center';
          haloText(ctx, v, lx + j * lw + lw / 2, top + i * rowH + rowH / 2, j === 0 ? COL.cyan : 'rgba(230,237,243,.8)');
        });
        ctx.restore();
      });

      /* the encoded matrix, one column at a time */
      const rx = lx + 3 * lw + 46, cw = Math.min(48, (W - rx - 8) / 7);
      const ga = cl01((t - 1200) / 300);
      if (ga > 0) arrow(ctx, lx + 3 * lw + 8, top + 2.5 * rowH, rx - 8, 'rgba(230,237,243,.4)', fade * ga);
      OV_ENC.cols.forEach((col, j) => {
        const a = cl01((t - 1500 - j * 320) / 420);
        if (a <= 0) return;
        const x = rx + j * cw;
        ctx.save(); ctx.globalAlpha = fade * a;
        const cc = col.kind === 'num' ? COL.cyan : col.src === 'job' ? COL.green : COL.orange;
        /* the header, rotated so the long names fit */
        ctx.save(); ctx.translate(x + cw / 2, top - 10); ctx.rotate(-Math.PI / 3.4);
        ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        haloText(ctx, col.name, 0, 0, cc); ctx.restore();
        DF.forEach((r, i) => {
          const v = OV_ENC.M[i][j];
          roundRect(ctx, x + 1.5, top + i * rowH + 2, cw - 3, rowH - 5, 5);
          ctx.fillStyle = col.kind === 'num' ? 'rgba(6,182,212,.10)' : v ? hexA(cc, .22) : 'rgba(255,255,255,.03)';
          ctx.fill();
          ctx.strokeStyle = col.kind === 'num' ? hexA(COL.cyan, .5) : v ? hexA(cc, .8) : 'rgba(230,237,243,.12)';
          ctx.lineWidth = v && col.kind === 'cat' ? 1.5 : 1; ctx.stroke();
          ctx.font = (v && col.kind === 'cat' ? 'bold ' : '') + '10px Courier New'; ctx.textAlign = 'center';
          haloText(ctx, String(v), x + cw / 2, top + i * rowH + rowH / 2,
                   col.kind === 'num' ? COL.cyan : v ? cc : 'rgba(230,237,243,.25)');
        });
        ctx.restore();
      });

      const cap = t < 1500 ? ['a model cannot subtract Teacher from Developer', 'two of these columns are text, and every estimator wants numbers']
                : t < 3800 ? ['every category becomes its own switch', 'one column per value: 1 if this row is that category, 0 otherwise']
                :            ['3 columns became 7', 'and the width is decided by the data, which is why the encoder must remember it'];
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = 'bold 12px Courier New'; haloText(ctx, cap[0], 4, 4, COL.accent);
      ctx.font = '11px Courier New';      haloText(ctx, cap[1], 4, 22, 'rgba(230,237,243,.55)');
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, 'pd.get_dummies(X, columns=[\'job\',\'city\'], dtype=int)', W / 2, H - 14, 'rgba(230,237,243,.4)');

    } else {
      /* ── Act 2: the grid search ── */
      const u = t - OV_ACT2;
      const KS = GRID_K, MS = GRID_M;
      const gx = 118, gy = 108, cw = Math.min(96, (W - gx - 16) / KS.length), ch = 62;
      ctx.textBaseline = 'middle';
      KS.forEach((k, j) => {
        ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
        haloText(ctx, 'k=' + k, gx + j * cw + cw / 2, gy - 14, 'rgba(230,237,243,.55)');
      });
      MS.forEach((m, i) => {
        ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right';
        haloText(ctx, m, gx - 10, gy + i * ch + ch / 2, 'rgba(230,237,243,.55)');
      });
      let doneN = 0;
      MS.forEach((m, i) => KS.forEach((k, j) => {
        const n = i * KS.length + j;
        const a = cl01((u - 700 - n * 260) / 300);
        const x = gx + j * cw, y = gy + i * ch;
        roundRect(ctx, x + 2, y + 2, cw - 4, ch - 4, 8);
        ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        ctx.strokeStyle = 'rgba(230,237,243,.12)'; ctx.lineWidth = 1; ctx.stroke();
        if (a <= 0) return;
        doneN++;
        const s = GRID_SCORES[i][j];
        ctx.save(); ctx.globalAlpha = fade * a;
        roundRect(ctx, x + 2, y + 2, cw - 4, ch - 4, 8);
        ctx.fillStyle = hexA(s === 1 ? COL.green : s > .9 ? COL.accent : COL.orange, .16); ctx.fill();
        ctx.strokeStyle = hexA(s === 1 ? COL.green : s > .9 ? COL.accent : COL.orange, .7); ctx.lineWidth = 1.4; ctx.stroke();
        ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center';
        haloText(ctx, s.toFixed(2), x + cw / 2, y + ch / 2, s === 1 ? COL.green : s > .9 ? COL.accent : COL.orange);
        ctx.restore();
      }));
      /* the winner, circled */
      const wa = cl01((u - 700 - MS.length * KS.length * 260 - 200) / 500);
      if (wa > 0) {
        const x = gx + GRID_BEST.j * cw, y = gy + GRID_BEST.i * ch;
        ctx.save(); ctx.globalAlpha = fade * wa;
        ctx.strokeStyle = COL.green; ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 5]); ctx.lineDashOffset = -(u / 32) % 12;
        roundRect(ctx, x - 2, y - 2, cw, ch, 11); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        haloText(ctx, 'best_params_', x + cw / 2, y + ch + 6, COL.green);
        ctx.restore();
      }
      const cap = u < 700 ? ['now choose the hyper-parameters', 'k and the distance metric are not learned from the data — you pick them']
                : wa <= 0 ? ['every combination, cross-validated', 'one full 3-fold cross-validation per cell, ' + doneN + ' of ' + (KS.length * MS.length) + ' done']
                :           ['keep the winner', 'best_estimator_ is that pipeline, refitted on all the data and ready to save']
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = 'bold 12px Courier New'; haloText(ctx, cap[0], 4, 4, COL.accent);
      ctx.font = '11px Courier New';      haloText(ctx, cap[1], 4, 22, 'rgba(230,237,243,.55)');
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, 'GridSearchCV(pipeline, param_grid, cv=3, scoring=\'accuracy\')', W / 2, H - 14, 'rgba(230,237,243,.4)');
    }
    ctx.restore();
    RAF[0] = requestAnimationFrame(loop);
  };
  RAF[0] = requestAnimationFrame(loop);
}

/* ═══ PANEL 1: get_dummies / one-hot ═══ */
let dumMode = 0, dumT0 = 0;
function setDum(m) { dumMode = m; segPick('seg-dum', m); dumT0 = performance.now(); stopRaf(1); drawDummies(); }

function drawDummies() {
  if (!dumT0) dumT0 = performance.now();
  const enc = dumMode === 2 ? oneHot(DF) : getDummies(DF, dumMode === 1);
  const names = enc.cols.map(c => c.name);
  $('out-dum').textContent = dumMode === 0
? `X = pd.get_dummies(X, columns=['job','city'], dtype=int)
X.shape -> (5, 7)
X.columns -> ${names.join(', ')}
one 1 per original column, per row — nothing else changed`
  : dumMode === 1
? `X = pd.get_dummies(X, columns=['job','city'], dtype=int, drop_first=True)
X.shape -> (5, 5)
X.columns -> ${names.join(', ')}
job_Developer and city_Haifa are gone: a row of all zeros now MEANS Developer`
: `OneHotEncoder(handle_unknown='ignore').fit_transform(X[['job','city']])
shape -> (5, 6)     categories_ -> [${JOBS.join(', ')}], [${CITIES.join(', ')}]
a numpy array, not a frame — and no 'age' column: OneHotEncoder only
touches the columns you hand it, so pair it with a ColumnTransformer`;

  const loop = now => {
    const t = now - dumT0;
    const c = canvasSetup('cv-dum', 300);
    const { ctx, W } = c;
    const rowH = 30, top = 108, lw = 60, lx = 4;
    ctx.textBaseline = 'middle';
    ['age', 'job', 'city'].forEach((nm, j) => {
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
      haloText(ctx, nm, lx + j * lw + lw / 2, top - 14, j === 0 ? COL.cyan : j === 1 ? COL.green : COL.orange);
    });
    DF.forEach((r, i) => {
      [String(r.age), SHORT[r.job], SHORT[r.city]].forEach((v, j) => {
        roundRect(ctx, lx + j * lw + 1.5, top + i * rowH + 2, lw - 3, rowH - 5, 5);
        ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill();
        ctx.strokeStyle = 'rgba(230,237,243,.14)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '10px Courier New'; ctx.textAlign = 'center';
        haloText(ctx, v, lx + j * lw + lw / 2, top + i * rowH + rowH / 2,
                 j === 0 ? COL.cyan : j === 1 ? COL.green : COL.orange);
      });
    });
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, 'the frame', lx + 1.5 * lw, top + 5 * rowH + 8, 'rgba(230,237,243,.4)');

    const rx = lx + 3 * lw + 44, cw = Math.min(52, (W - rx - 6) / enc.cols.length);
    arrow(ctx, lx + 3 * lw + 8, top + 2.5 * rowH, rx - 8, 'rgba(230,237,243,.4)');
    enc.cols.forEach((col, j) => {
      const a = easeOut(cl01((t - j * 70) / 320));
      if (a <= 0) return;
      const x = rx + j * cw;
      const cc = col.kind === 'num' ? COL.cyan : col.src === 'job' ? COL.green : COL.orange;
      ctx.save(); ctx.globalAlpha = a;
      ctx.save(); ctx.translate(x + cw / 2, top - 10); ctx.rotate(-Math.PI / 3.2);
      ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      haloText(ctx, col.name, 0, 0, cc); ctx.restore();
      ctx.textBaseline = 'middle';
      DF.forEach((r, i) => {
        const v = enc.M[i][j];
        roundRect(ctx, x + 1.5, top + i * rowH + 2, cw - 3, rowH - 5, 5);
        ctx.fillStyle = col.kind === 'num' ? 'rgba(6,182,212,.10)' : v ? hexA(cc, .22) : 'rgba(255,255,255,.03)'; ctx.fill();
        ctx.strokeStyle = col.kind === 'num' ? hexA(COL.cyan, .5) : v ? hexA(cc, .8) : 'rgba(230,237,243,.12)';
        ctx.lineWidth = v && col.kind === 'cat' ? 1.5 : 1; ctx.stroke();
        ctx.font = (v && col.kind === 'cat' ? 'bold ' : '') + '10px Courier New'; ctx.textAlign = 'center';
        haloText(ctx, String(v), x + cw / 2, top + i * rowH + rowH / 2,
                 col.kind === 'num' ? COL.cyan : v ? cc : 'rgba(230,237,243,.25)');
      });
      ctx.restore();
    });
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, enc.M.length + ' x ' + enc.cols.length + ' — every value is a number',
             rx + enc.cols.length * cw / 2, top + 5 * rowH + 8, 'rgba(230,237,243,.4)');
    /* the dropped columns, shown as ghosts */
    if (dumMode === 1) {
      ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      haloText(ctx, 'dropped: job_Developer, city_Haifa', 4, 4, COL.red);
    }
    if (t < 1200) RAF[1] = requestAnimationFrame(loop); else RAF[1] = null;
  };
  RAF[1] = requestAnimationFrame(loop);
}

/* ═══ PANEL 2: the pipeline ═══ */
let pipeMode = 0;
const P2_SC = minMaxFit(F18_X);
const P2_RAW = [225, 7, 150];
const P2_SCALED = P2_SC.transform([P2_RAW])[0];
const P2_PRED = knnPredict(P2_SC.transform(F18_X), F18_Y, P2_SCALED, 3, [...new Set(F18_Y)].sort(), 'euclidean');
function setPipeMode(m) { pipeMode = m; segPick('seg-pipe', m); stopRaf(2); drawPipe(); }

function drawPipe() {
  const t0 = performance.now();
  const fit = pipeMode === 0;
  $('out-pipe').textContent = fit
? `pipeline.fit(X, y)

  scaler : fit_transform(X)   -> learns min ${JSON.stringify(P2_SC.mn)}
                                 and max ${JSON.stringify(P2_SC.mx)}
                                 then hands on the scaled matrix
  knn    : fit(X_scaled, y)   -> stores all 18 scaled rows and their labels

every transformer LEARNS on the way in. the pipeline is now fitted.`
: `pipeline.predict([[225, 7, 150]])

  scaler : transform(X)       -> reuses the min/max it learned during fit
                                 [225, 7, 150] -> [${P2_SCALED.map(f3).join(', ')}]
  knn    : predict(X_scaled)  -> nearest neighbour among the stored rows

nothing is re-learned. raw values in, a label out.`;

  const loop = now => {
    const t = (now - t0) % 6400;
    const c = canvasSetup('cv-pipe', 300);
    const { ctx, W } = c;
    const bw = Math.min(126, (W - 60) / 3.6), bh = 62, y = 116;
    const x1 = 18, x2 = (W - bw) / 2, x3 = W - bw - 18;
    const accent = fit ? COL.blue : COL.green;

    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, fit ? 'pipeline.fit(X, y)' : 'pipeline.predict([[225, 7, 150]])', 4, 4, COL.accent);
    ctx.font = '11px Courier New';
    haloText(ctx, fit ? 'every transformer gets fit_transform — it learns, then passes the data on'
                      : 'every transformer gets transform only — it reuses what it learned',
             4, 22, 'rgba(230,237,243,.55)');

    stepBox(ctx, x1, y, bw, bh, 'MinMaxScaler', fit ? 'fit_transform' : 'transform', accent);
    stepBox(ctx, x2, y, bw, bh, 'KNeighbors', fit ? 'fit' : 'predict', accent);
    stepBox(ctx, x3, y, bw, bh, fit ? 'fitted pipeline' : 'prediction', fit ? 'ready to predict' : null, COL.accent);
    arrow(ctx, x1 + bw + 4, y + bh / 2, x2 - 6, 'rgba(230,237,243,.35)');
    arrow(ctx, x2 + bw + 4, y + bh / 2, x3 - 6, 'rgba(230,237,243,.35)');

    /* the packet travelling through */
    const legs = [[x1 - 12, x1 + bw / 2], [x1 + bw / 2, x2 + bw / 2], [x2 + bw / 2, x3 + bw / 2]];
    const u = t / 6400 * 3;
    const leg = Math.min(2, Math.floor(u));
    const p = easeOut(cl01(u - leg));
    const px = legs[leg][0] + (legs[leg][1] - legs[leg][0]) * p;
    let label, pcol;
    if (fit) {
      label = leg === 0 ? '18 x 3 raw' : leg === 1 ? '18 x 3 in [0,1]' : 'fitted';
      pcol = leg === 0 ? COL.orange : leg === 1 ? COL.cyan : COL.green;
    } else {
      label = leg === 0 ? '[225, 7, 150]' : leg === 1 ? '[' + P2_SCALED.map(f2).join(', ') + ']' : P2_PRED;
      pcol = leg === 0 ? COL.orange : leg === 1 ? COL.cyan : COL.green;
    }
    ctx.font = 'bold 11px Courier New';
    const tw = ctx.measureText(label).width + 22;
    ctx.save();
    roundRect(ctx, px - tw / 2, y - 44, tw, 26, 8);
    ctx.fillStyle = hexA(pcol, .18); ctx.fill();
    ctx.strokeStyle = hexA(pcol, .85); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, label, px, y - 31, pcol);
    ctx.beginPath(); ctx.moveTo(px, y - 16); ctx.lineTo(px - 5, y - 22); ctx.lineTo(px + 5, y - 22); ctx.closePath();
    ctx.fillStyle = hexA(pcol, .85); ctx.fill();
    ctx.restore();

    /* what each box is holding once the packet has passed */
    ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (leg >= 1) haloText(ctx, fit ? 'min ' + JSON.stringify(P2_SC.mn) : 'reusing min/max',
                           x1 + bw / 2, y + bh + 8, 'rgba(230,237,243,.5)');
    if (leg >= 1) haloText(ctx, fit ? 'max ' + JSON.stringify(P2_SC.mx) : 'from fit time',
                           x1 + bw / 2, y + bh + 20, 'rgba(230,237,243,.5)');
    if (leg >= 2) haloText(ctx, fit ? '18 rows stored' : 'k = 3, majority vote', x2 + bw / 2, y + bh + 8, 'rgba(230,237,243,.5)');
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, "Pipeline([('scaler', MinMaxScaler()), ('knn', KNeighborsClassifier())])",
             W / 2, c.H - 14, 'rgba(230,237,243,.4)');
    RAF[2] = requestAnimationFrame(loop);
  };
  RAF[2] = requestAnimationFrame(loop);
}

/* ═══ PANEL 3: the column transformer ═══ */
let ctMode = 0, ctT0 = 0;
const NEW_ROW = { age: 31, job: 'Teacher', city: 'Eilat' };
function setCT(m) { ctMode = m; segPick('seg-ct', m); ctT0 = performance.now(); stopRaf(3); drawCT(); }

function drawCT() {
  if (!ctT0) ctT0 = performance.now();
  const rows = ctMode === 0 ? DF : [NEW_ROW];
  const oh = oneHot(rows);
  const gd = getDummies(rows, false);
  $('out-ct').textContent = ctMode === 0
? `prep.fit_transform(X)
  num branch : StandardScaler on ['age']        -> 1 column
  cat branch : OneHotEncoder on ['job','city']  -> 6 columns
  hstack                                        -> (5, 7)
get_feature_names_out() -> num__age, ${oh.cols.map(c => 'cat__' + c.name).join(', ')}`
: `new = pd.DataFrame([{'age': 31, 'job': 'Teacher', 'city': 'Eilat'}])

  OneHotEncoder(handle_unknown='ignore') -> (1, 6), the same 6 columns as fit time
     city_Haifa=0  city_Jerusalem=0  city_Tel Aviv=0   <- "none of the cities I know"
     model.predict(new) -> works

  pd.get_dummies(new) -> (1, 3): age, job_Teacher, city_Eilat
     ValueError: The feature names should match those that were passed during fit.
     Feature names unseen at fit time:  - city_Eilat
     Feature names seen at fit time, yet now missing:  - city_Haifa, city_Jerusalem,
                                                       - city_Tel Aviv, job_Developer, job_Doctor`;

  const loop = now => {
    const t = now - ctT0;
    const c = canvasSetup('cv-ct', 330);
    const { ctx, W } = c;
    const cx = W / 2, bw = Math.min(178, W / 2 - 26), bh = 50;
    const topY = 54, midY = 146, botY = 246;
    const lx = cx - bw - 10, rx = cx + 10;

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Courier New';
    haloText(ctx, ctMode === 0 ? 'ColumnTransformer — one table, two branches' : "a row arrives with city = 'Eilat'", 4, 4, COL.accent);
    ctx.font = '11px Courier New';
    haloText(ctx, ctMode === 0 ? 'each group of columns takes its own route, then they are glued back together'
                               : 'the encoder learned its categories at fit time, so the width never changes',
             4, 22, 'rgba(230,237,243,.55)');

    /* the input */
    const a0 = easeOut(cl01(t / 300));
    const inTxt = ctMode === 0 ? "X — 5 rows: age, job, city" : "age=31, job='Teacher', city='Eilat'";
    stepBox(ctx, cx - bw / 2, topY, bw, 38, 'input DataFrame', inTxt, COL.text, a0);

    /* the two branches */
    const a1 = easeOut(cl01((t - 250) / 400));
    if (a1 > 0) {
      ctx.save(); ctx.globalAlpha = a1; ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, topY + 38); ctx.lineTo(cx, topY + 54);
      ctx.moveTo(lx + bw / 2, topY + 54); ctx.lineTo(rx + bw / 2, topY + 54);
      ctx.moveTo(lx + bw / 2, topY + 54); ctx.lineTo(lx + bw / 2, midY);
      ctx.moveTo(rx + bw / 2, topY + 54); ctx.lineTo(rx + bw / 2, midY);
      ctx.stroke(); ctx.restore();
      stepBox(ctx, lx, midY, bw, bh, "'num'  StandardScaler", "columns=['age']", COL.cyan, a1);
      stepBox(ctx, rx, midY, bw, bh, "'cat'  OneHotEncoder", "columns=['job','city']", COL.purple, a1);
    }

    /* the merged matrix */
    const a2 = easeOut(cl01((t - 700) / 450));
    if (a2 > 0) {
      ctx.save(); ctx.globalAlpha = a2; ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lx + bw / 2, midY + bh); ctx.lineTo(lx + bw / 2, botY - 26);
      ctx.moveTo(rx + bw / 2, midY + bh); ctx.lineTo(rx + bw / 2, botY - 26);
      ctx.moveTo(lx + bw / 2, botY - 26); ctx.lineTo(rx + bw / 2, botY - 26);
      ctx.moveTo(cx, botY - 26); ctx.lineTo(cx, botY - 10);
      ctx.stroke(); ctx.restore();

      const cells = 7, cw = Math.min(62, (W - 40) / cells), gx0 = cx - cells * cw / 2;
      const shown = ctMode === 0 ? DF : [NEW_ROW];
      const rowsToDraw = Math.min(shown.length, 3);
      const heads = ['age'].concat(oh.cols.map(c => c.name));
      for (let j = 0; j < cells; j++) {
        const cc = j === 0 ? COL.cyan : j <= 3 ? COL.green : COL.orange;
        ctx.save(); ctx.globalAlpha = a2;
        ctx.save(); ctx.translate(gx0 + j * cw + cw / 2, botY - 8); ctx.rotate(-Math.PI / 3.2);
        ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        haloText(ctx, heads[j], 0, 0, cc); ctx.restore();
        for (let i = 0; i < rowsToDraw; i++) {
          const v = j === 0 ? (ctMode === 0 ? shown[i].age : 31) : oh.M[i][j - 1];
          const on = j > 0 && v === 1;
          const zeroCity = ctMode === 1 && j >= 4;
          roundRect(ctx, gx0 + j * cw + 1.5, botY + 4 + i * 26, cw - 3, 22, 5);
          ctx.fillStyle = j === 0 ? 'rgba(6,182,212,.10)' : on ? hexA(cc, .22)
                        : zeroCity ? 'rgba(250,204,21,.10)' : 'rgba(255,255,255,.03)';
          ctx.fill();
          ctx.strokeStyle = j === 0 ? hexA(COL.cyan, .5) : on ? hexA(cc, .8)
                          : zeroCity ? hexA(COL.accent, .45) : 'rgba(230,237,243,.12)';
          ctx.lineWidth = on ? 1.5 : 1; ctx.stroke();
          ctx.font = (on ? 'bold ' : '') + '10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          haloText(ctx, String(v), gx0 + j * cw + cw / 2, botY + 15 + i * 26,
                   j === 0 ? COL.cyan : on ? cc : zeroCity ? COL.accent : 'rgba(230,237,243,.25)');
        }
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = a2;
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      haloText(ctx, ctMode === 0 ? '7 columns — this is what the model is fitted on'
                                 : '7 columns again, with the whole city block at 0',
               cx, botY + 8 + rowsToDraw * 26, ctMode === 0 ? COL.green : COL.accent);
      if (ctMode === 1) {
        ctx.font = '9px Courier New';
        haloText(ctx, "get_dummies on this row would have produced 3 columns instead",
                 cx, botY + 22 + rowsToDraw * 26, COL.red);
      }
      ctx.restore();
    }
    if (t < 1400) RAF[3] = requestAnimationFrame(loop); else RAF[3] = null;
  };
  RAF[3] = requestAnimationFrame(loop);
}

/* ═══ PANEL 4: cross_val_score with a pipeline ═══ */
let cvpMode = 0;
const CVP_FOLDS = stratifiedKFold(F9_Y, 3);
function setCVP(m) { cvpMode = m; segPick('seg-cvp', m); drawCVP(); }

function drawCVP() {
  const inside = cvpMode === 0;
  const res = CVP_FOLDS.map(te => foldScore(F9_X, F9_Y, te, 3, 'euclidean', inside));
  const scores = res.map(r => r.score);
  const global = minMaxFit(F9_X);

  const c = canvasSetup('cv-cvp', 300);
  const { ctx, W } = c;
  const padL = 62, padR = 70, span = W - padL - padR, cellW = span / 9;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = 'bold 12px Courier New';
  haloText(ctx, inside ? 'the scaler lives inside the pipeline' : 'one scaler, fitted before the split', 4, 4,
           inside ? COL.green : COL.red);
  ctx.font = '11px Courier New';
  haloText(ctx, inside ? 'each fold fits a fresh MinMaxScaler on its own 6 training rows'
                       : 'every fold reuses statistics that were computed from all 9 rows, test rows included',
           4, 22, 'rgba(230,237,243,.55)');

  CVP_FOLDS.forEach((fold, k) => {
    const y = 62 + k * 74;
    const test = new Set(fold);
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, 'fold ' + (k + 1), padL - 10, y + 13, 'rgba(230,237,243,.55)');
    for (let i = 0; i < 9; i++) {
      const isTest = test.has(i);
      roundRect(ctx, padL + i * cellW + 1.5, y, cellW - 3, 26, 5);
      ctx.fillStyle = isTest ? 'rgba(16,185,129,.28)' : 'rgba(250,204,21,.12)'; ctx.fill();
      ctx.strokeStyle = isTest ? COL.green : 'rgba(250,204,21,.42)'; ctx.lineWidth = isTest ? 1.7 : 1; ctx.stroke();
      ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, F9_Y[i][0], padL + i * cellW + cellW / 2, y + 13, hexA(FCLR[F9_Y[i]], .95));
    }
    ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    haloText(ctx, scores[k].toFixed(2), padL + span + 12, y + 13, scores[k] === 1 ? COL.green : COL.accent);
    /* what the scaler learned for this fold */
    const r = res[k];
    const same = r.mn.every((v, f) => v === global.mn[f]) && r.mx.every((v, f) => v === global.mx[f]);
    ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'scaler saw  min ' + JSON.stringify(r.mn) + '   max ' + JSON.stringify(r.mx),
             padL, y + 31, inside ? (same ? 'rgba(230,237,243,.45)' : COL.cyan) : COL.red);
    haloText(ctx, inside ? (same ? 'identical to the global range on this fold — the leak is invisible here'
                                 : 'different from the global range: these rows never saw the test data')
                         : 'the global range, which the test rows helped to define',
             padL, y + 44, inside ? (same ? 'rgba(230,237,243,.3)' : 'rgba(6,182,212,.7)') : 'rgba(244,63,94,.7)');
  });
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  haloText(ctx, 'mean = ' + mean(scores).toFixed(2), W / 2, c.H - 14, COL.accent);

  $('out-cvp').textContent =
`--- Cross-Validation Results ---
Scores: [${scores.map(s => s === 1 ? '1.        ' : s.toFixed(8)).join(' ')}]
Average Accuracy: ${mean(scores).toFixed(2)}

global min/max (all 9 rows): min ${JSON.stringify(global.mn)}  max ${JSON.stringify(global.mx)}
${CVP_FOLDS.map((f, i) => 'fold ' + (i + 1) + ' scaler       : min ' + JSON.stringify(res[i].mn) + '  max ' + JSON.stringify(res[i].mx)).join('\n')}
${inside ? '--> this is what cross_val_score(pipeline, X, y, cv=3) does'
         : '--> this is what happens if you scale X once and pass the bare model'}`;
}

/* ═══ PANEL 5: the grid search ═══ */
const GRID_K = [1, 2, 3, 4, 5];
const GRID_M = ['euclidean', 'manhattan'];
const G_FOLDS = stratifiedKFold(F18_Y, 3);
const GRID_FOLDSCORES = GRID_M.map(m => GRID_K.map(k => G_FOLDS.map(te => foldScore(F18_X, F18_Y, te, k, m, true).score)));
const GRID_SCORES = GRID_FOLDSCORES.map(row => row.map(mean));
const GRID_BEST = (() => {
  /* sklearn walks the grid in sorted parameter order and keeps the first maximum */
  let best = { i: 0, j: 0, s: -1 };
  GRID_M.forEach((m, i) => GRID_K.forEach((k, j) => {
    if (GRID_SCORES[i][j] > best.s + 1e-12) best = { i, j, s: GRID_SCORES[i][j] };
  }));
  return best;
})();
let gridT0 = 0;
function replayGrid() { gridT0 = performance.now(); stopRaf(5); drawGrid(); }

function drawGrid() {
  if (!gridT0) gridT0 = performance.now();
  const CELL_MS = 340, FOLD_MS = CELL_MS / 3;
  const nCells = GRID_M.length * GRID_K.length;
  const total = nCells * CELL_MS + 900;

  const loop = now => {
    const t = now - gridT0;
    const c = canvasSetup('cv-grid', 290);
    const { ctx, W } = c;
    const gx = 108, gy = 78, cw = Math.min(102, (W - gx - 14) / GRID_K.length), ch = 74;
    const done = Math.floor(t / CELL_MS);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Courier New';
    haloText(ctx, "param_grid = {'knn__n_neighbors': [1,2,3,4,5], 'knn__metric': ['euclidean','manhattan']}", 4, 4, COL.accent);
    ctx.font = '11px Courier New';
    haloText(ctx, done < nCells ? 'fitting ' + (done + 1) + ' of ' + nCells + ' combinations, 3 folds each'
                                : nCells + ' combinations x 3 folds = ' + (nCells * 3) + ' fits, then one refit on all the data',
             4, 22, 'rgba(230,237,243,.55)');

    ctx.textBaseline = 'middle';
    GRID_K.forEach((k, j) => {
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
      haloText(ctx, 'k=' + k, gx + j * cw + cw / 2, gy - 13, 'rgba(230,237,243,.55)');
    });
    GRID_M.forEach((m, i) => {
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'right';
      haloText(ctx, m, gx - 10, gy + i * ch + ch / 2, 'rgba(230,237,243,.55)');
    });

    GRID_M.forEach((m, i) => GRID_K.forEach((k, j) => {
      const n = i * GRID_K.length + j;
      const x = gx + j * cw, y = gy + i * ch;
      roundRect(ctx, x + 2, y + 2, cw - 4, ch - 4, 8);
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      ctx.strokeStyle = 'rgba(230,237,243,.1)'; ctx.lineWidth = 1; ctx.stroke();
      const local = t - n * CELL_MS;
      if (local <= 0) return;
      const s = GRID_SCORES[i][j];
      const col = s === 1 ? COL.green : s > .9 ? COL.accent : COL.orange;
      if (local < CELL_MS) {
        /* the three folds landing one at a time */
        const nf = Math.min(3, Math.floor(local / FOLD_MS) + 1);
        roundRect(ctx, x + 2, y + 2, cw - 4, ch - 4, 8);
        ctx.fillStyle = 'rgba(59,130,246,.10)'; ctx.fill();
        ctx.strokeStyle = hexA(COL.blue, .8); ctx.lineWidth = 1.6; ctx.stroke();
        ctx.font = '10px Courier New'; ctx.textAlign = 'center';
        for (let f = 0; f < nf; f++)
          haloText(ctx, 'fold ' + (f + 1) + ': ' + GRID_FOLDSCORES[i][j][f].toFixed(2),
                   x + cw / 2, y + 20 + f * 15, 'rgba(230,237,243,.7)');
      } else {
        const a = easeOut(cl01((local - CELL_MS) / 260));
        roundRect(ctx, x + 2, y + 2, cw - 4, ch - 4, 8);
        ctx.fillStyle = hexA(col, .14 * a + .02); ctx.fill();
        ctx.strokeStyle = hexA(col, .7); ctx.lineWidth = 1.4; ctx.stroke();
        ctx.font = 'bold 15px Courier New'; ctx.textAlign = 'center';
        haloText(ctx, s.toFixed(2), x + cw / 2, y + ch / 2 - 6, col);
        ctx.font = '9px Courier New';
        haloText(ctx, '[' + GRID_FOLDSCORES[i][j].map(v => v.toFixed(2)).join(' ') + ']',
                 x + cw / 2, y + ch / 2 + 14, 'rgba(230,237,243,.45)');
      }
    }));

    /* the winner, circled with a rotating dash */
    if (t > nCells * CELL_MS + 300) {
      const x = gx + GRID_BEST.j * cw, y = gy + GRID_BEST.i * ch;
      ctx.save();
      ctx.strokeStyle = COL.green; ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]); ctx.lineDashOffset = -(t / 30) % 12;
      roundRect(ctx, x, y, cw, ch, 11); ctx.stroke();
      ctx.restore();
    }
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, 'ties are broken by grid order — sklearn keeps the first maximum it meets',
             W / 2, c.H - 12, 'rgba(230,237,243,.4)');

    const ties = GRID_SCORES.flat().filter(s => s === GRID_BEST.s).length;
    $('out-grid').textContent = t < nCells * CELL_MS ? `GridSearchCV(pipeline, param_grid, cv=3, scoring='accuracy')
fitting... ${Math.min(nCells, Math.floor(t / CELL_MS) + 1)} / ${nCells} combinations`
: `Best parameters:
{'knn__metric': '${GRID_M[GRID_BEST.i]}', 'knn__n_neighbors': ${GRID_K[GRID_BEST.j]}}
Best CV accuracy:
${GRID_BEST.s % 1 === 0 ? GRID_BEST.s.toFixed(1) : GRID_BEST.s.toFixed(6)}

but note: ${ties} of the ${nCells} combinations score exactly ${GRID_BEST.s.toFixed(2)}.
best_params_ is simply the first of them in grid order.`;

    if (t < total) RAF[5] = requestAnimationFrame(loop);
    else RAF[5] = null;
  };
  RAF[5] = requestAnimationFrame(loop);
}

/* ═══ PANEL 6: neg_mean_squared_error ═══ */
function drawNeg() {
  const t0 = performance.now();
  const DUR = 9000;
  const vals = CV_MSE;
  const lo = Math.log10(Math.min(...vals)), hi = Math.log10(Math.max(...vals));

  const loop = now => {
    const t = (now - t0) % DUR;
    /* 0-2200 positive, 2200-3800 flip, 3800+ negative */
    const flip = easeOut(cl01((t - 2200) / 1600));
    const c = canvasSetup('cv-neg', 270);
    const { ctx, W, H } = c;
    const cx = W / 2, half = W / 2 - 46, y = 152;
    /* log10 distance from zero, so both sides are readable */
    const pos = v => cx + 24 + (Math.log10(v) - lo) / (hi - lo) * (half - 30);
    const neg = v => cx - 24 - (Math.log10(v) - lo) / (hi - lo) * (half - 30);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Courier New';
    haloText(ctx, flip < .5 ? 'mean_squared_error — smaller is better' : 'neg_mean_squared_error — greater is better',
             4, 4, flip < .5 ? COL.red : COL.green);
    ctx.font = '11px Courier New';
    haloText(ctx, flip < .5 ? 'so taking the maximum would hand you degree 1, the worst model in the list'
                            : 'the same eight numbers, reflected through zero — now the maximum is the right answer',
             4, 22, 'rgba(230,237,243,.55)');

    /* the axis */
    ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, y - 12); ctx.lineTo(cx, y + 12); ctx.stroke();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, '0', cx, y + 15, 'rgba(230,237,243,.5)');
    ctx.font = '9px Courier New';
    haloText(ctx, 'log spacing', cx, y + 30, 'rgba(230,237,243,.28)');

    /* the eight degrees */
    let bestX = -Infinity, bestD = 0;
    DEGREES.forEach((d, i) => {
      const v = vals[i];
      const x = pos(v) + (neg(v) - pos(v)) * flip;
      /* two staggered rows above the axis, so eight labels fit without overlap */
      const yy = y - (i % 2 === 0 ? 30 : 54);
      const isBest = i === CV_BEST;
      const col = isBest ? COL.green : 'rgba(230,237,243,.65)';
      ctx.strokeStyle = hexA(isBest ? COL.green : '#e6edf3', isBest ? .8 : .25); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, yy); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, isBest ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isBest ? COL.green : COL.accent; ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = COL.surface; ctx.stroke();
      ctx.font = (isBest ? 'bold ' : '') + '9px Courier New'; ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      haloText(ctx, 'd=' + d + '  ' + (flip > .5 ? '-' : '') + (v < 10 ? v.toFixed(2) : Math.round(v)),
               Math.max(46, Math.min(W - 46, x)), yy, col);
      if (x > bestX) { bestX = x; bestD = d; }
    });

    /* the argmax pointer — it always picks the rightmost point */
    if (t > 4200 || t < 2000) {
      const a = t < 2000 ? cl01((t - 1000) / 400) : cl01((t - 4200) / 400);
      const okay = bestD === DEGREES[CV_BEST];
      const pc = okay ? COL.green : COL.red;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = pc; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(bestX, y + 40); ctx.lineTo(bestX, y + 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bestX, y + 22); ctx.lineTo(bestX - 5, y + 32); ctx.lineTo(bestX + 5, y + 32);
      ctx.closePath(); ctx.fillStyle = pc; ctx.fill();
      ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      haloText(ctx, 'argmax -> degree ' + bestD + (okay ? '  ✓' : '  ✗ the worst one'),
               Math.max(100, Math.min(W - 100, bestX)), y + 44, pc);
      ctx.restore();
    }
    RAF[6] = requestAnimationFrame(loop);
  };
  RAF[6] = requestAnimationFrame(loop);

  $('out-neg').textContent =
`grid.cv_results_['mean_test_score']   (what sklearn stores)
${DEGREES.map((d, i) => '  degree ' + d + ' : ' + (-CV_MSE[i]).toFixed(4).padStart(12)).join('\n')}

grid.best_score_  = ${(-CV_MSE[CV_BEST]).toFixed(10)}
-grid.best_score_ = ${CV_MSE[CV_BEST].toFixed(10)}   <- the MSE
np.sqrt(-grid.best_score_) = ${Math.sqrt(CV_MSE[CV_BEST]).toFixed(4)}   <- RMSE, in the units of y`;
}

/* ═══ PANEL 7: searching for the degree ═══ */
function drawDegree() {
  const d = +$('dg-d').value;
  $('dg-dv').textContent = d;
  const coef = POLY_COEF[d - 1];

  /* left: the fit */
  const p = plot2('cv-dg-fit', 250, 0, 31, -40, 680, {
    xticks: [1, 10, 20, 30], yticks: [0, 200, 400, 600], xlab: 'x →', ylab: 'y ↑'
  });
  p.ctx.save(); p.ctx.strokeStyle = d === DEGREES[CV_BEST] ? COL.green : COL.accent; p.ctx.lineWidth = 2.2;
  p.ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const x = 0.6 + i / 240 * 30.2, yy = polyPred(coef, x);
    const cy = p.sy(Math.max(-40, Math.min(680, yy)));
    i === 0 ? p.ctx.moveTo(p.sx(x), cy) : p.ctx.lineTo(p.sx(x), cy);
  }
  p.ctx.stroke(); p.ctx.restore();
  PX.forEach((x, i) => {
    p.ctx.beginPath(); p.ctx.arc(p.sx(x), p.sy(PY[i]), 3, 0, Math.PI * 2);
    p.ctx.fillStyle = COL.cyan; p.ctx.fill();
    p.ctx.lineWidth = 1.2; p.ctx.strokeStyle = COL.surface; p.ctx.stroke();
  });
  p.ctx.font = 'bold 10px Courier New'; p.ctx.textAlign = 'right'; p.ctx.textBaseline = 'top';
  haloText(p.ctx, 'degree ' + d, p.W - 20, 6, d === DEGREES[CV_BEST] ? COL.green : COL.accent);

  /* right: cross-validated MSE per degree, on a log axis */
  const lg = CV_MSE.map(Math.log10);
  const q = plot2('cv-dg-cv', 250, 0.4, 8.6, -0.6, 4.6, {
    xticks: DEGREES, yticks: [0, 1, 2, 3, 4], xlab: 'poly__degree →', ylab: 'CV MSE (log) ↑',
    yfmt: v => v === 0 ? '1' : '1e' + v
  });
  q.ctx.save(); q.ctx.strokeStyle = COL.accent; q.ctx.lineWidth = 2.4; q.ctx.beginPath();
  DEGREES.forEach((dd, i) => i === 0 ? q.ctx.moveTo(q.sx(dd), q.sy(lg[i])) : q.ctx.lineTo(q.sx(dd), q.sy(lg[i])));
  q.ctx.stroke(); q.ctx.restore();
  DEGREES.forEach((dd, i) => {
    const best = i === CV_BEST, cur = dd === d;
    q.ctx.beginPath(); q.ctx.arc(q.sx(dd), q.sy(lg[i]), best ? 6 : cur ? 5.5 : 4, 0, Math.PI * 2);
    q.ctx.fillStyle = best ? COL.green : cur ? COL.cyan : COL.accent; q.ctx.fill();
    q.ctx.lineWidth = 1.5; q.ctx.strokeStyle = COL.surface; q.ctx.stroke();
  });
  q.ctx.save(); q.ctx.setLineDash([3, 4]); q.ctx.strokeStyle = COL.cyan; q.ctx.lineWidth = 1.3;
  q.ctx.beginPath(); q.ctx.moveTo(q.sx(d), q.padT - 6); q.ctx.lineTo(q.sx(d), q.H - q.padB); q.ctx.stroke(); q.ctx.restore();
  q.ctx.font = 'bold 10px Courier New'; q.ctx.textAlign = 'center'; q.ctx.textBaseline = 'top';
  haloText(q.ctx, 'best = ' + DEGREES[CV_BEST], q.sx(DEGREES[CV_BEST]), q.sy(lg[CV_BEST]) + 10, COL.green);

  const trainMSE = TRAIN_MSE[d - 1];
  $('out-degree').textContent =
`poly__degree = ${d}
  training MSE          : ${trainMSE.toFixed(4)}
  cross-validated MSE   : ${CV_MSE[d - 1].toFixed(4)}   (neg_mean_squared_error = ${(-CV_MSE[d - 1]).toFixed(4)})
  gap                   : x${(CV_MSE[d - 1] / trainMSE).toFixed(1)}  ${CV_MSE[d - 1] / trainMSE > 20 ? '<- overfitting: it knows these 30 points, not the shape' : ''}

Best degree: ${DEGREES[CV_BEST]}
Best MSE: ${CV_MSE[CV_BEST].toFixed(10)}`;
}

/* ═══ PANEL 8: the elbow for the degree ═══
   The mechanism, drawn: the chord, the gaps, then the winner circled
   with a ring that keeps turning for as long as you look at it. */
let elLog = 1, elT0 = 0;
function setElScale(v) { elLog = v; segPick('seg-el', v ? 0 : 1); elT0 = performance.now(); stopRaf(8); drawElbowDeg(); }
function replayElbow() { elT0 = performance.now(); stopRaf(8); drawElbowDeg(); }

function drawElbowDeg() {
  if (!elT0) elT0 = performance.now();
  const PH_PTS = 1300, PH_CHORD = 2400, PH_GAPS = 4600;   /* phase boundaries, ms */

  const loop = now => {
    const t = now - elT0;
    const vals = TRAIN_MSE;
    const el = elbowOf(vals, !!elLog);
    const v = elLog ? vals.map(Math.log10) : vals.slice();
    const vmin = Math.min(...v), vmax = Math.max(...v), pad = (vmax - vmin) * 0.16;
    const p = plot2('cv-elbow', 320, 0.4, 8.6, vmin - pad, vmax + pad, {
      xticks: DEGREES,
      yticks: elLog ? [-1, 0, 1, 2, 3, 4] : [0, 800, 1600, 2400, 3200],
      xfmt: x => x, yfmt: y => elLog ? (y === 0 ? '1' : '1e' + y) : y,
      xlab: 'polynomial degree →', ylab: elLog ? 'training MSE (log) ↑' : 'training MSE ↑'
    });
    const { ctx, sx, sy, W, H } = p;

    /* 1 — the curve appears, left to right */
    const shown = Math.min(8, Math.floor(t / (PH_PTS / 8)) + 1);
    ctx.save(); ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let i = 0; i < shown; i++) i === 0 ? ctx.moveTo(sx(DEGREES[i]), sy(v[i])) : ctx.lineTo(sx(DEGREES[i]), sy(v[i]));
    ctx.stroke(); ctx.restore();

    /* 2 — the chord from the first point to the last */
    const ca = easeOut(cl01((t - PH_PTS) / (PH_CHORD - PH_PTS)));
    if (ca > 0) {
      ctx.save(); ctx.globalAlpha = .85; ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(230,237,243,.42)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sx(1), sy(v[0]));
      ctx.lineTo(sx(1) + (sx(8) - sx(1)) * ca, sy(v[0]) + (sy(v[7]) - sy(v[0])) * ca);
      ctx.stroke(); ctx.restore();
      if (ca > .9) {
        ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        haloText(ctx, 'the chord: what "no bend at all" would look like',
                 (sx(1) + sx(8)) / 2, (sy(v[0]) + sy(v[7])) / 2 - 8, 'rgba(230,237,243,.45)');
      }
    }

    /* 3 — the gap under the chord, measured one degree at a time */
    const gapsShown = cl01((t - PH_CHORD) / (PH_GAPS - PH_CHORD)) * 8;
    for (let i = 0; i < Math.floor(gapsShown); i++) {
      const chordY = v[0] + (v[7] - v[0]) * i / 7;
      ctx.save();
      ctx.strokeStyle = i === el.best ? COL.green : 'rgba(6,182,212,.55)';
      ctx.lineWidth = i === el.best ? 2.2 : 1.2;
      ctx.beginPath(); ctx.moveTo(sx(DEGREES[i]), sy(chordY)); ctx.lineTo(sx(DEGREES[i]), sy(v[i])); ctx.stroke();
      ctx.restore();
    }

    /* the points themselves, on top */
    for (let i = 0; i < shown; i++) {
      const best = i === el.best && t > PH_GAPS;
      ctx.beginPath(); ctx.arc(sx(DEGREES[i]), sy(v[i]), best ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = best ? COL.green : COL.accent; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = COL.surface; ctx.stroke();
      ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      haloText(ctx, vals[i] < 10 ? vals[i].toFixed(2) : Math.round(vals[i]),
               sx(DEGREES[i]), sy(v[i]) - 9, 'rgba(230,237,243,.55)');
    }

    /* 4 — circle the sweet spot, and keep circling it */
    if (t > PH_GAPS) {
      const u = t - PH_GAPS;
      const cxp = sx(DEGREES[el.best]), cyp = sy(v[el.best]);
      const grow = easeOut(cl01(u / 500));
      const r = 13 + 8 * grow;
      ctx.save();
      /* the ring that keeps turning */
      ctx.strokeStyle = COL.green; ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -(u / 26) % 13;
      ctx.beginPath(); ctx.arc(cxp, cyp, r, 0, Math.PI * 2); ctx.stroke();
      /* a pulse expanding out of it */
      const pu = (u % 1800) / 1800;
      ctx.setLineDash([]); ctx.globalAlpha = (1 - pu) * .5;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cxp, cyp, r + pu * 26, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      /* the label, on whichever side has room */
      const left = cxp > W / 2;
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle';
      haloText(ctx, 'elbow -> degree ' + DEGREES[el.best], cxp + (left ? -r - 10 : r + 10), cyp, COL.green);
      ctx.restore();
    }
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, elLog ? 'read on a log axis, because the values span four orders of magnitude'
                        : 'read on a linear axis, where the first drop swamps everything after it',
             W / 2, H - 11, elLog ? 'rgba(230,237,243,.4)' : COL.orange);

    $('out-elbow').textContent =
`training MSE per degree (the curve only ever goes down — no argmin to take)
${DEGREES.map((d, i) => '  degree ' + d + ' : ' + TRAIN_MSE[i].toFixed(4).padStart(11)).join('\n')}

gap below the chord, on a ${elLog ? 'log' : 'linear'} axis:
${DEGREES.map((d, i) => '  degree ' + d + ' : ' + el.gaps[i].toFixed(elLog ? 3 : 1).padStart(9) + (i === el.best ? '   <- furthest below' : '')).join('\n')}

elbow  -> degree ${DEGREES[el.best]}
grid search (cross-validated, panel 07) -> degree ${DEGREES[CV_BEST]}
${DEGREES[el.best] === DEGREES[CV_BEST] ? '--> they agree' : '--> they disagree: trust the cross-validated answer'}`;

    RAF[8] = requestAnimationFrame(loop);
  };
  RAF[8] = requestAnimationFrame(loop);
}

/* ═══ PANEL 9: saving the pipeline ═══
   Both branches are really computed: the pipeline scales then predicts,
   the bare model is handed the same raw row and does not. */
const SAVE_SC = minMaxFit(F18_X);
const SAVE_RAW = [225, 7, 150];
const SAVE_SCALED = SAVE_SC.transform([SAVE_RAW])[0];
const SAVE_CLASSES = [...new Set(F18_Y)].sort();
const SAVE_K = GRID_K[GRID_BEST.j], SAVE_METRIC = GRID_M[GRID_BEST.i];
const PRED_PIPE = knnPredict(SAVE_SC.transform(F18_X), F18_Y, SAVE_SCALED, SAVE_K, SAVE_CLASSES, SAVE_METRIC);
/* the bare model was fitted on SCALED rows — it is the query that arrives raw,
   which is exactly what makes it land nowhere near any of them */
const PRED_BARE = knnPredict(SAVE_SC.transform(F18_X), F18_Y, SAVE_RAW, SAVE_K, SAVE_CLASSES, SAVE_METRIC);
let saveT0 = 0;
function replaySave() { saveT0 = performance.now(); stopRaf(9); drawSave(); }

function drawSave() {
  if (!saveT0) saveT0 = performance.now();
  const DUR = 8200;

  const loop = now => {
    const t = now - saveT0;
    const c = canvasSetup('cv-save', 330);
    const { ctx, W } = c;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Courier New';
    haloText(ctx, 'the same raw row, sent to two different .pkl files', 4, 4, COL.accent);
    ctx.font = '11px Courier New';
    haloText(ctx, 'joblib.load(...).predict([[225, 7, 150]]) — raw values, exactly what an application has',
             4, 22, 'rgba(230,237,243,.55)');

    const bw = Math.min(120, (W - 74) / 3.2), bh = 48;
    const xs = [16, (W - bw) / 2 - 18, W - bw - 16];

    [0, 1].forEach(track => {
      const good = track === 0;
      const y = 74 + track * 128;
      const col = good ? COL.green : COL.red;
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      haloText(ctx, good ? "joblib.dump(best_estimator_, 'model.pkl')  — the whole pipeline"
                         : "joblib.dump(best_model.named_steps['knn'], 'knn_only.pkl')",
               16, y - 14, hexA(col, .85));

      stepBox(ctx, xs[0], y, bw, bh, good ? 'model.pkl' : 'knn_only.pkl', good ? 'scaler + knn' : 'knn only', col);
      if (good) stepBox(ctx, xs[1], y, bw, bh, 'MinMaxScaler', 'transform', COL.cyan);
      else      stepBox(ctx, xs[1], y, bw, bh, '(no scaler)', 'nothing happens', '#e6edf3');
      stepBox(ctx, xs[2], y, bw, bh, 'KNeighbors', 'predict', col);
      arrow(ctx, xs[0] + bw + 4, y + bh / 2, xs[1] - 6, 'rgba(230,237,243,.3)');
      arrow(ctx, xs[1] + bw + 4, y + bh / 2, xs[2] - 6, 'rgba(230,237,243,.3)');

      /* the packet */
      const legs = [[xs[0] - 4, xs[1] + bw / 2], [xs[1] + bw / 2, xs[2] + bw / 2], [xs[2] + bw / 2, xs[2] + bw / 2]];
      const u = cl01((t - 600) / (DUR - 2400)) * 3;
      const leg = Math.min(2, Math.floor(u));
      const px = legs[leg][0] + (legs[leg][1] - legs[leg][0]) * easeOut(cl01(u - leg));
      const label = leg === 0 ? '[225, 7, 150]'
                  : leg === 1 ? (good ? '[' + SAVE_SCALED.map(f2).join(', ') + ']' : '[225, 7, 150]  still raw')
                  : (good ? PRED_PIPE + '  ✓' : PRED_BARE + '  ✗');
      const pcol = leg === 2 ? col : leg === 1 && good ? COL.cyan : COL.orange;
      ctx.font = 'bold 11px Courier New';
      const tw = ctx.measureText(label).width + 22;
      ctx.save();
      roundRect(ctx, Math.min(W - tw - 4, Math.max(4, px - tw / 2)), y - 40, tw, 25, 8);
      ctx.fillStyle = hexA(pcol, .18); ctx.fill();
      ctx.strokeStyle = hexA(pcol, .85); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, label, Math.min(W - tw / 2 - 4, Math.max(tw / 2 + 4, px)), y - 28, pcol);
      ctx.restore();

      if (leg >= 2) {
        ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        haloText(ctx, good ? 'scaled with the training min/max, then matched against the stored rows'
                           : 'the stored rows all live inside [0,1] — a raw row lands nowhere near any of them',
                 W / 2, y + bh + 8, good ? 'rgba(230,237,243,.5)' : hexA(COL.red, .75));
      }
    });
    if (t < DUR) RAF[9] = requestAnimationFrame(loop); else RAF[9] = null;
  };
  RAF[9] = requestAnimationFrame(loop);

  $('out-save').textContent =
`best_model = grid.best_estimator_          # metric='${SAVE_METRIC}', n_neighbors=${SAVE_K}
joblib.dump(best_model, 'model.pkl')

loaded = joblib.load('model.pkl')
loaded.predict([[225, 7, 150]])            -> ['${PRED_PIPE}']
   the scaler inside turned it into [${SAVE_SCALED.map(f3).join(', ')}] first

# and the version that saved only the model:
joblib.dump(best_model.named_steps['knn'], 'knn_only.pkl')
joblib.load('knn_only.pkl').predict([[225, 7, 150]])  -> ['${PRED_BARE}']
   the model stored its 18 rows already scaled into [0,1]. a raw row is so
   far outside that cube that the nearest stored point is simply the one with
   the largest coordinates — [255, 10, 182], an orange.
   no error, no warning, just the wrong fruit`;
}

/* ══════════ boot ══════════ */
const DRAWS = [drawOverview, drawDummies, drawPipe, drawCT, drawCVP, drawGrid,
               drawNeg, drawDegree, drawElbowDeg, drawSave, null, null, null];

updateDots();
setTimeout(drawOverview, 90);

window.addEventListener('resize', () => {
  stopAll();
  /* the animated panels restart their clock on resize; the static ones redraw */
  if (current === 5) gridT0 = performance.now();
  if (current === 9) saveT0 = performance.now();
  if (DRAWS[current]) DRAWS[current]();
  fitMath($('panel-' + current));
});
