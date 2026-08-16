/* ══════════════════════════════════════════════════════════════════
   Random Forest — deck 15
   Nothing on this page is a drawing of a forest: fitForest() below is
   the real algorithm — bootstrap the rows, restrict the features at
   every split, grow CART, then vote — so every tree, every vote and
   every OOB number you see was computed in your browser from the same
   20 students the notebook uses.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 13;
const LABELS = ['Overview','One tree is not enough','Ensemble models','Bootstrapping',
                'Random features','Voting & averaging','Out-of-Bag error','In Python',
                'Key parameters','Pros & cons','Exercises',
                'A1 · One tree vs the forest','A2 · feature_importances_'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12];

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
  freshPanel = true;
  fitMath(newP);
  if (DRAWS[idx]) setTimeout(DRAWS[idx], 60);
}

/* ══════════ keep display maths inside the panel ══════════
   KaTeX renders at a fixed size, so a wide formula would need a horizontal
   scrollbar. Instead we measure it and scale it down to fit. Panels are
   display:none until opened, which is why goTo() calls this again on entry. */
function fitMath(root) {
  (root || document).querySelectorAll('.katex-display').forEach(d => {
    const inner = d.querySelector('.katex');
    if (!inner) return;
    inner.style.transform = '';
    inner.style.display = '';
    d.style.height = '';
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

/* ══════════ shared drawing helpers ══════════ */
const COL = { grid:'rgba(230,237,243,.07)', axis:'rgba(230,237,243,.45)', tick:'rgba(230,237,243,.4)',
              accent:'#facc15', blue:'#3b82f6', green:'#10b981', red:'#f43f5e', cyan:'#06b6d4',
              orange:'#f97316', purple:'#8b5cf6', pink:'#ec4899', text:'#e6edf3', surface:'#020509' };
/* failed = orange, passed = green — the same two colours all through the deck */
const CLR = { 0:'#f97316', 1:'#10b981' };
const CLS_NAME = { 0:'FAIL', 1:'PASS' };

function plotSetup(cvId, XMIN, XMAX, YMIN, YMAX, xstep = 2, ystep) {
  const cv = $(cvId), ctx = cv.getContext('2d');
  const wrap = cv.parentElement;
  cv.width = Math.min(wrap.clientWidth - 28 || 560, 660);
  const W = cv.width, H = cv.height;
  const sx = x => (x - XMIN) / (XMAX - XMIN) * W;
  const sy = y => H - (y - YMIN) / (YMAX - YMIN) * H;
  if (!ystep) ystep = xstep;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) { ctx.beginPath(); ctx.moveTo(sx(gx), 0); ctx.lineTo(sx(gx), H); ctx.stroke(); }
  for (let gy = Math.ceil(YMIN / ystep) * ystep; gy <= YMAX; gy += ystep) { ctx.beginPath(); ctx.moveTo(0, sy(gy)); ctx.lineTo(W, sy(gy)); ctx.stroke(); }
  ctx.fillStyle = COL.tick; ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) if (sx(gx) > 14 && sx(gx) < W - 14) ctx.fillText(gx, sx(gx), H - 13);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let gy = Math.ceil(YMIN / ystep) * ystep; gy <= YMAX; gy += ystep) if (sy(gy) > 10 && sy(gy) < H - 16) ctx.fillText(gy, 5, sy(gy));
  return { ctx, sx, sy, W, H, XMIN, XMAX, YMIN, YMAX };
}

/* a bare canvas with no axes — for the tree and forest diagrams */
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

function plotPoint(p, x, y, color, label, r = 5, hollow) {
  const { ctx, sx, sy } = p;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
  if (hollow) { ctx.fillStyle = COL.surface; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = color; ctx.stroke(); }
  else        { ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.stroke(); }
  if (label) { ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; haloText(ctx, label, sx(x) + 9, sy(y) - 7, color); }
}

function plotQuery(p, x, y, color, label) {
  const { ctx, sx, sy } = p;
  const cx = sx(x), cy = sy(y);
  ctx.save(); ctx.setLineDash([]); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color; ctx.fillRect(-7, -7, 14, 14);
  ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.strokeRect(-7, -7, 14, 14);
  ctx.restore();
  if (label) {
    ctx.font = 'bold 11px Courier New'; ctx.textBaseline = 'bottom';
    const flip = cx + 12 + ctx.measureText(label).width > p.W - 4;
    ctx.textAlign = flip ? 'right' : 'left';
    haloText(ctx, label, cx + (flip ? -12 : 12), cy - 10, color);
  }
}

function axLabels(p, xlab, ylab) {
  const { ctx, W } = p;
  ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top';
  ctx.textAlign = 'left';  haloText(ctx, ylab, 12, 8, 'rgba(230,237,243,.42)');
  ctx.textAlign = 'right'; haloText(ctx, xlab, W - 8, 8, 'rgba(230,237,243,.42)');
}

function roundRect(ctx, x, y, w, h, r) {
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

/* ══════════ animation helper ══════════ */
const anims = {};
let instant = false;
let freshPanel = true;
function consumeFresh() { const f = freshPanel; freshPanel = false; return f; }
function animate(id, dur, cb) {
  if (anims[id]) cancelAnimationFrame(anims[id]);
  if (instant) { cb(1); return; }
  const t0 = performance.now();
  const step = now => {
    const t = Math.min(1, Math.max(0, (now - t0) / dur));
    cb(1 - Math.pow(1 - t, 3));
    if (t < 1) anims[id] = requestAnimationFrame(step); else delete anims[id];
  };
  anims[id] = requestAnimationFrame(step);
}

/* ══════════════════════════════════════════════════════════════════
   CART with feature sub-sampling, then the forest on top of it.
   The only two differences from the deck-14 tree are the rows each
   tree gets (a bootstrap sample) and the features each split may
   look at (a random handful) — that is the whole algorithm.
   ══════════════════════════════════════════════════════════════════ */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function countOf(labels) { const c = {}; for (const v of labels) c[v] = (c[v] || 0) + 1; return c; }
function giniOf(counts, n) {
  if (!n) return 0;
  let s = 0; for (const k in counts) s += (counts[k] / n) ** 2;
  return 1 - s;
}
function impurityOf(idx, ys) { return giniOf(countOf(idx.map(i => ys[i])), idx.length); }

/* every candidate split on the allowed features, scored */
function allSplits(X, ys, idx, feats) {
  const n = idx.length, impP = impurityOf(idx, ys), out = [];
  for (const f of feats) {
    const vals = [...new Set(idx.map(i => X[i][f]))].sort((a, b) => a - b);
    for (let k = 0; k < vals.length - 1; k++) {
      const thr = (vals[k] + vals[k + 1]) / 2;
      const L = idx.filter(i => X[i][f] <= thr), R = idx.filter(i => X[i][f] > thr);
      if (!L.length || !R.length) continue;
      const w = L.length / n * impurityOf(L, ys) + R.length / n * impurityOf(R, ys);
      out.push({ f, thr, L, R, weighted: w, gain: impP - w });
    }
  }
  let best = null;
  for (const s of out) if (!best || s.gain > best.gain + 1e-12) best = s;
  return { impP, splits: out, best };
}

/* draw max_features of them, without replacement */
function pickFeatures(nFeat, mf, rng) {
  if (!mf || mf >= nFeat) return Array.from({ length: nFeat }, (_, i) => i);
  const pool = Array.from({ length: nFeat }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, mf).sort((a, b) => a - b);
}

function buildTree(X, ys, idx, opts, depth, rng) {
  const maxDepth = opts.maxDepth == null ? 30 : opts.maxDepth;
  const minLeaf = opts.minLeaf || 1, minSplit = opts.minSplit || 2;
  const n = idx.length, counts = countOf(idx.map(i => ys[i])), imp = impurityOf(idx, ys);
  let value = null;
  for (const k in counts) if (value === null || counts[k] > counts[value] || (counts[k] === counts[value] && k < value)) value = k;
  const node = { n, counts, imp, depth, leaf: true, value, rows: idx };
  if (depth >= maxDepth || n < minSplit || imp <= 1e-12) return node;
  const feats = pickFeatures(X[0].length, opts.maxFeatures, rng);
  const { best } = allSplits(X, ys, idx, feats);
  if (!best || best.gain <= 1e-12 || best.L.length < minLeaf || best.R.length < minLeaf) return node;
  node.leaf = false; node.f = best.f; node.thr = best.thr; node.gain = best.gain; node.tried = feats;
  node.left  = buildTree(X, ys, best.L, opts, depth + 1, rng);
  node.right = buildTree(X, ys, best.R, opts, depth + 1, rng);
  return node;
}

function fitTreeOn(X, ys, rows, opts, rng) { return buildTree(X, ys, rows, opts || {}, 0, rng || Math.random); }
function fitTree(X, ys, opts, rng) { return fitTreeOn(X, ys, X.map((_, i) => i), opts, rng); }
function predictOne(node, x) { return node.leaf ? node.value : predictOne(x[node.f] <= node.thr ? node.left : node.right, x); }
function treeDepth(nd) { return nd.leaf ? 0 : 1 + Math.max(treeDepth(nd.left), treeDepth(nd.right)); }
function countLeaves(nd) { return nd.leaf ? 1 : countLeaves(nd.left) + countLeaves(nd.right); }
function accuracyOf(nd, X, ys, idx) {
  idx = idx || X.map((_, i) => i);
  if (!idx.length) return 1;
  let ok = 0;
  for (const i of idx) if (String(predictOne(nd, X[i])) === String(ys[i])) ok++;
  return ok / idx.length;
}

/* ── the forest ── */
function fitForest(X, ys, opts) {
  opts = opts || {};
  const K = opts.nTrees || 7, n = X.length;
  const rng = mulberry32(opts.seed == null ? 42 : opts.seed);
  const trees = [];
  for (let k = 0; k < K; k++) {
    const bag = [];
    if (opts.bootstrap === false) for (let i = 0; i < n; i++) bag.push(i);
    else                          for (let i = 0; i < n; i++) bag.push(Math.floor(rng() * n));
    const inBag = new Set(bag), oob = [];
    for (let i = 0; i < n; i++) if (!inBag.has(i)) oob.push(i);
    trees.push({ root: buildTree(X, ys, bag, opts, 0, rng), bag, inBag, oob, k });
  }
  return { trees, X, ys, opts };
}

function forestVote(forest, x, k) {
  const use = forest.trees.slice(0, k || forest.trees.length);
  const votes = {};
  const per = use.map(t => { const v = predictOne(t.root, x); votes[v] = (votes[v] || 0) + 1; return v; });
  let win = null;
  for (const c in votes) if (win === null || votes[c] > votes[win] || (votes[c] === votes[win] && c < win)) win = c;
  return { per, votes, value: win, n: use.length };
}

/* out-of-bag: score every row using only the trees that never saw it */
function forestOOB(forest, k) {
  const { X, ys } = forest;
  const use = forest.trees.slice(0, k || forest.trees.length);
  let ok = 0, used = 0;
  const per = [];
  for (let i = 0; i < X.length; i++) {
    const voters = use.filter(t => !t.inBag.has(i));
    if (!voters.length) { per.push(null); continue; }
    const votes = {};
    for (const t of voters) { const v = predictOne(t.root, X[i]); votes[v] = (votes[v] || 0) + 1; }
    let win = null;
    for (const c in votes) if (win === null || votes[c] > votes[win] || (votes[c] === votes[win] && c < win)) win = c;
    const right = String(win) === String(ys[i]);
    per.push({ voters: voters.length, pred: win, right });
    used++; if (right) ok++;
  }
  return { score: used ? ok / used : 0, used, per };
}

function forestAccuracy(forest, X, ys, idx) {
  idx = idx || X.map((_, i) => i);
  let ok = 0;
  for (const i of idx) if (String(forestVote(forest, X[i]).value) === String(ys[i])) ok++;
  return ok / idx.length;
}

/* mean decrease in impurity — the same quantity sklearn reports
   as feature_importances_, averaged over the trees */
function importances(forest) {
  const nF = forest.X[0].length, tot = new Array(nF).fill(0);
  for (const t of forest.trees) {
    const imp = new Array(nF).fill(0), N = t.root.n;
    (function walk(nd) {
      if (nd.leaf) return;
      imp[nd.f] += nd.n / N * (nd.imp - nd.left.n / nd.n * nd.left.imp - nd.right.n / nd.n * nd.right.imp);
      walk(nd.left); walk(nd.right);
    })(t.root);
    const s = imp.reduce((a, b) => a + b, 0) || 1;
    for (let f = 0; f < nF; f++) tot[f] += imp[f] / s;
  }
  return tot.map(v => v / forest.trees.length);
}

/* ══════════ drawing a fitted tree ══════════ */
function layoutTree(root) {
  let nextX = 0;
  (function walk(nd) {
    if (nd.leaf) { nd._x = nextX++; return; }
    walk(nd.left); walk(nd.right);
    nd._x = (nd.left._x + nd.right._x) / 2;
  })(root);
  return nextX;
}

function renderTree(c, root, opts) {
  opts = opts || {};
  const names = opts.names || FEATS;
  const leaves = layoutTree(root);
  const depth = treeDepth(root);
  const { ctx, W, H } = c;
  const boxW = Math.min(120, (W - 26) / Math.max(1, leaves));
  const boxH = opts.showStats === false ? 32 : 48;
  const padX = boxW / 2 + 10, spanX = W - padX * 2;
  const stepY = (H - boxH - 22) / Math.max(1, depth);
  const px = nd => padX + (leaves <= 1 ? spanX / 2 : nd._x / (leaves - 1) * spanX);
  const py = d => 12 + d * stepY;
  const hi = opts.highlight || [];

  (function draw(nd, parent) {
    const x = px(nd), y = py(nd.depth);
    if (parent) {
      const on = hi.includes(nd) && hi.includes(parent);
      ctx.save(); ctx.beginPath();
      ctx.moveTo(px(parent), py(parent.depth) + boxH); ctx.lineTo(x, y);
      ctx.strokeStyle = on ? COL.accent : 'rgba(230,237,243,.28)';
      ctx.lineWidth = on ? 2.6 : 1.4; ctx.stroke(); ctx.restore();
      ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, parent.left === nd ? 'True' : 'False',
               (px(parent) + x) / 2, (py(parent.depth) + boxH + y) / 2,
               on ? COL.accent : 'rgba(230,237,243,.4)');
    }
    let fill = 'rgba(255,255,255,.05)';
    if (opts.filled !== false) fill = hexA(CLR[nd.value] || COL.blue, 0.12 + 0.34 * Math.max(0, 1 - nd.imp / 0.5));
    ctx.save();
    roundRect(ctx, x - boxW / 2, y, boxW, boxH, 7);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = hi.includes(nd) ? COL.accent : (nd.leaf ? 'rgba(59,130,246,.55)' : 'rgba(230,237,243,.3)');
    ctx.lineWidth = hi.includes(nd) ? 2.4 : 1.3; ctx.stroke(); ctx.restore();

    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const lines = [];
    if (!nd.leaf) lines.push(names[nd.f] + ' <= ' + nd.thr.toFixed(1));
    if (opts.showStats !== false) {
      lines.push('gini = ' + nd.imp.toFixed(3));
      lines.push('samples = ' + nd.n);
      lines.push('[' + (nd.counts[0] || 0) + ', ' + (nd.counts[1] || 0) + '] ' + CLS_NAME[nd.value]);
    } else if (nd.leaf) lines.push(CLS_NAME[nd.value]);
    ctx.font = 'bold 9px Courier New';
    lines.slice(0, 4).forEach((t, i) => haloText(ctx, t, x, y + 5 + i * 10,
        i === 0 && !nd.leaf ? COL.text : 'rgba(230,237,243,.72)'));
    if (!nd.leaf) { draw(nd.left, nd); draw(nd.right, nd); }
  })(root, null);
}

/* paint the decision regions of a fitted 2-D model */
function paintRegions(p, predict, alpha) {
  const { ctx, W, H, XMIN, XMAX, YMIN, YMAX } = p;
  const B = 7;
  for (let px = 0; px < W; px += B) {
    for (let py = 0; py < H; py += B) {
      const x = XMIN + (px + B / 2) / W * (XMAX - XMIN);
      const y = YMAX - (py + B / 2) / H * (YMAX - YMIN);
      ctx.fillStyle = hexA(CLR[predict(x, y)] || '#3b82f6', alpha == null ? 0.15 : alpha);
      ctx.fillRect(px, py, B, B);
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   The dataset: the 20 students from the notebook, unchanged.
   Two of the three features are numeric, so the 2-D pictures use
   study_hours × sleep_hours and the code panels use all three.
   ══════════════════════════════════════════════════════════════════ */
const STUDY = [2, 8, 5, 1, 7, 3, 6, 4, 9, 2, 7, 4, 8, 3, 6, 9, 5, 3, 7, 2];
const SLEEP = [5, 8, 9, 3, 7, 8, 6, 7, 9, 6, 8, 5, 7, 6, 9, 8, 7, 5, 8, 4];
const BREAKF= [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0];
const PASS  = [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0];
const S3 = STUDY.map((v, i) => [v, SLEEP[i], BREAKF[i]]);
const S2 = STUDY.map((v, i) => [v, SLEEP[i]]);
const FEATS  = ['study_hours', 'sleep_hours', 'had_breakfast'];
const FSHORT = ['study', 'sleep', 'breakfast'];
const N = S3.length;

/* A second, larger set — 240 rows, two features, a curved boundary and
   12% of the labels deliberately flipped. Twenty students are enough to
   learn the algorithm on but far too few to *see* variance: the OOB score
   there moves in steps of 1/20. The two demos that are about variance —
   how many trees you need, and one tree against the forest — use this
   instead, and say so on screen. */
const BIG = (() => {
  const r = mulberry32(2024), X = [], y = [];
  for (let i = 0; i < 240; i++) {
    const a = r() * 10, b = r() * 10;
    const truth = (0.6 * a + 0.4 * b + 1.6 * Math.sin(a * 0.9)) > 5.4 ? 1 : 0;
    y.push(r() < 0.12 ? 1 - truth : truth);      /* label noise, so nothing can score 1.0 */
    X.push([a, b]);
  }
  return { X, y };
})();

const f2 = v => v.toFixed(2);
const f3 = v => v.toFixed(3);
const pct = v => (v * 100).toFixed(0) + '%';

/* ═══════════════════════════════════════════════════════════════════
   PANEL 0: the forest grows, then it votes.
   Seven real trees, each on its own bootstrap sample of the 20 rows,
   each split allowed to look at only one of the three features. They
   appear one after another; then a new student walks in and every
   tree drops a vote into the tally. Two of the seven get it wrong and
   the majority is still right — which is the entire deck in one loop.
   ═══════════════════════════════════════════════════════════════════ */
const OV_FOREST = fitForest(S3, PASS, { nTrees: 7, maxDepth: 2, maxFeatures: 1, seed: 13 });
const OV_Q = [5, 6, 0];                       // study 5 · sleep 6 · no breakfast
const OV_VOTE = forestVote(OV_FOREST, OV_Q);  // 5 × FAIL, 2 × PASS
const OV_DUR = 10200;

function drawForest() {
  const t0 = performance.now();
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const ease = v => 1 - Math.pow(1 - v, 3);

  const T_GROW = 620, T_STEP = 560;                     // tree k appears at 500 + k*T_STEP
  const T_ARRIVE = 500 + 7 * T_STEP + 260;              // the new student walks in
  const T_VOTE = T_ARRIVE + 900;                        // votes start flying
  const V_STEP = 200, V_FLY = 760;
  const T_DONE = T_VOTE + 6 * V_STEP + V_FLY;           // the tally is complete

  const loop = now => {
    const t = (now - t0) % OV_DUR;
    const fade = t > OV_DUR - 600 ? 1 - (t - (OV_DUR - 600)) / 600 : 1;
    const c = canvasSetup('cv-overview', 392);
    const { ctx, W, H } = c;

    const K = OV_FOREST.trees.length;
    const slotW = W / K;
    const treeTop = 62, levelH = 42, leafR = 5.2;

    /* ── the forest ── */
    OV_FOREST.trees.forEach((tr, k) => {
      const a = cl((t - (500 + k * T_STEP)) / T_GROW);
      if (a <= 0) return;
      const cx = slotW * (k + 0.5);
      const leaves = layoutTree(tr.root);
      const spread = Math.min(slotW - 16, 62);
      const px = nd => cx + (leaves <= 1 ? 0 : (nd._x / (leaves - 1) - 0.5) * spread);
      const py = d => treeTop + d * levelH;

      ctx.save(); ctx.globalAlpha = fade * a;
      /* trunk + branches, drawn as they grow */
      (function limb(nd, parent) {
        const x = px(nd), y = py(nd.depth);
        if (parent) {
          const g = cl((a - nd.depth * 0.22) / 0.55);
          if (g > 0) {
            const x0 = px(parent), y0 = py(parent.depth);
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x - x0) * g, y0 + (y - y0) * g);
            ctx.strokeStyle = 'rgba(230,237,243,.34)'; ctx.lineWidth = nd.depth === 1 ? 2 : 1.4;
            ctx.lineCap = 'round'; ctx.stroke();
          }
        }
        if (!nd.leaf) { limb(nd.left, nd); limb(nd.right, nd); }
      })(tr.root, null);

      /* the foliage: one dot per leaf, tinted by the class it predicts */
      (function foliage(nd) {
        if (nd.leaf) {
          const g = cl((a - nd.depth * 0.22 - 0.3) / 0.5);
          if (g > 0) {
            ctx.save(); ctx.globalAlpha = fade * a * g;
            ctx.beginPath(); ctx.arc(px(nd), py(nd.depth), leafR * g, 0, Math.PI * 2);
            ctx.fillStyle = CLR[nd.value]; ctx.fill();
            ctx.lineWidth = 1.4; ctx.strokeStyle = COL.surface; ctx.stroke();
            ctx.restore();
          }
          return;
        }
        /* an internal node is a small hollow ring — a question, not an answer */
        ctx.beginPath(); ctx.arc(px(nd), py(nd.depth), 3.4, 0, Math.PI * 2);
        ctx.fillStyle = COL.surface; ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(250,204,21,.75)'; ctx.stroke();
        foliage(nd.left); foliage(nd.right);
      })(tr.root);

      /* which feature this tree happened to be allowed to split on first.
         On a narrow canvas the slots are too close together for a word
         like "breakfast", so there it drops to just the tree number. */
      if (a > 0.55) {
        ctx.globalAlpha = fade * (a - 0.55) / 0.45;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        if (slotW >= 62) {
          ctx.font = 'bold 9px Courier New';
          haloText(ctx, tr.root.leaf ? '—' : FSHORT[tr.root.f], cx, treeTop - 9, 'rgba(230,237,243,.6)');
          ctx.font = '8px Courier New';
          haloText(ctx, 'tree ' + (k + 1), cx, treeTop - 21, 'rgba(230,237,243,.32)');
        } else {
          ctx.font = 'bold 8px Courier New';
          haloText(ctx, 'T' + (k + 1), cx, treeTop - 9, 'rgba(230,237,243,.5)');
        }
      }
      ctx.restore();
    });

    /* ── the new student ── */
    const arrive = cl((t - T_ARRIVE) / 520);
    const cardY = 236;
    if (arrive > 0) {
      ctx.save(); ctx.globalAlpha = fade * arrive;
      const cw = Math.min(258, W - 30), cx = W / 2 - cw / 2;
      const cy = cardY - 26 * (1 - arrive);
      roundRect(ctx, cx, cy, cw, 30, 9);
      ctx.fillStyle = 'rgba(250,204,21,.09)'; ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,.5)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, 'new student · study 5 · sleep 6', W / 2, cy + 15, COL.accent);
      ctx.restore();
    }

    /* ── the votes falling into the tally ── */
    const tallyY = 322;
    const counted = { 0: 0, 1: 0 };
    OV_FOREST.trees.forEach((tr, k) => {
      const v = OV_VOTE.per[k];
      const s = cl((t - (T_VOTE + k * V_STEP)) / V_FLY);
      if (s <= 0) return;
      if (s >= 1) { counted[v]++; return; }
      const e = ease(s);
      const from = { x: slotW * (k + 0.5), y: treeTop + 2 * levelH + 14 };
      const to   = { x: W / 2 + (v === '0' ? -74 : 74), y: tallyY - 6 };
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e - 26 * Math.sin(Math.PI * e);   // a little arc
      ctx.save(); ctx.globalAlpha = fade * Math.min(1, s * 3);
      roundRect(ctx, x - 20, y - 9, 40, 18, 6);
      ctx.fillStyle = hexA(CLR[v], 0.22); ctx.fill();
      ctx.strokeStyle = CLR[v]; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, CLS_NAME[v], x, y, CLR[v]);
      ctx.restore();
    });

    /* the two tally stacks */
    if (t > T_VOTE) {
      ctx.save(); ctx.globalAlpha = fade;
      ['0', '1'].forEach(cls => {
        const bx = W / 2 + (cls === '0' ? -74 : 74);
        ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        haloText(ctx, CLS_NAME[cls], bx, tallyY + 30, 'rgba(230,237,243,.5)');
        for (let i = 0; i < counted[cls]; i++) {
          const y = tallyY - 6 - i * 9;
          roundRect(ctx, bx - 20, y - 4, 40, 8, 3);
          ctx.fillStyle = hexA(CLR[cls], 0.34); ctx.fill();
          ctx.strokeStyle = CLR[cls]; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.font = 'bold 13px Courier New'; ctx.textBaseline = 'middle';
        haloText(ctx, String(counted[cls]), bx + 40, tallyY + 2, CLR[cls]);
      });
      ctx.restore();
    }

    /* ── the verdict ── */
    const done = cl((t - T_DONE) / 420);
    if (done > 0) {
      const v = OV_VOTE.value;
      ctx.save(); ctx.globalAlpha = fade * done;
      ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, 'majority vote  →  ' + CLS_NAME[v], W / 2, tallyY + 54, CLR[v]);
      ctx.restore();
    }

    /* ── the running commentary ── */
    const cap = t < 500                 ? ['one dataset', '20 students · study hours, sleep hours, breakfast']
              : t < T_ARRIVE            ? ['grow the forest', 'each tree gets its own random rows and its own random features']
              : t < T_VOTE              ? ['a new student arrives', 'nobody in the training data studied 5 hours on 6 of sleep']
              : t < T_DONE              ? ['every tree votes', 'seven trees, seven independent opinions']
              :                           ['majority wins', '5 say FAIL, 2 say PASS — and the two are the ones that are wrong'];
    ctx.save(); ctx.globalAlpha = fade;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Courier New'; haloText(ctx, cap[0], 4, 4, COL.accent);
    ctx.font = '11px Courier New';      haloText(ctx, cap[1], 4, 22, 'rgba(230,237,243,.55)');
    ctx.restore();

    ovRaf = requestAnimationFrame(loop);
  };
  ovRaf = requestAnimationFrame(loop);
}

/* ═══ PANEL 1: one tree is not enough ═══
   Same 20 students, one bootstrap sample per seed, one full tree each.
   Move the slider and the "best" tree changes shape completely — that
   instability is the thing the forest is built to cancel out. */
function shakeTree(seed) {
  const rng = mulberry32(500 + seed * 911);
  const bag = [];
  for (let i = 0; i < N; i++) bag.push(Math.floor(rng() * N));
  return { root: fitTreeOn(S2, PASS, bag, { maxDepth: 4 }, rng), bag };
}

function drawShake() {
  const seed = +$('sh-seed').value;
  $('sh-seedv').textContent = seed;
  const { root, bag } = shakeTree(seed);
  const uniq = new Set(bag).size;

  const p = plotSetup('cv-shake', 0, 10, 2, 10, 2);
  paintRegions(p, (x, y) => predictOne(root, [x, y]), 0.16);
  for (let i = 0; i < N; i++) {
    const inBag = bag.includes(i);
    plotPoint(p, S2[i][0], S2[i][1], CLR[PASS[i]], null, inBag ? 5 : 4, !inBag);
  }
  axLabels(p, 'study_hours →', 'sleep_hours ↑');

  const c = canvasSetup('cv-shake-tree');
  renderTree(c, root, { names: FSHORT, showStats: false });

  $('out-shake').textContent =
`resample ${seed}: ${uniq} of the 20 rows made it into this tree's sample
tree:  ${countLeaves(root)} leaves, depth ${treeDepth(root)}, root question = ${root.leaf ? 'none' : FSHORT[root.f] + ' <= ' + root.thr.toFixed(1)}
--> the hollow dots are the rows this tree never saw`;
}

/* ═══ PANEL 2: why a crowd beats an expert ═══
   P(the majority of K independent voters is right) when each one is
   right with probability p. Above p = 0.5 the curve climbs to 1; below
   it, it collapses to 0 — which is why the base model has to be at
   least a little better than a coin flip. */
const LOGF = (() => { const a = [0]; for (let i = 1; i <= 260; i++) a.push(a[i - 1] + Math.log(i)); return a; })();
function majorityRight(K, p) {
  if (p >= 1) return 1;
  if (p <= 0) return 0;
  let s = 0;
  for (let i = Math.floor(K / 2) + 1; i <= K; i++)
    s += Math.exp(LOGF[K] - LOGF[i] - LOGF[K - i] + i * Math.log(p) + (K - i) * Math.log(1 - p));
  return s;
}

function drawCrowd() {
  const p0 = +$('cr-p').value / 100;
  const K = +$('cr-k').value * 2 + 1;          // always odd, so there are no ties
  $('cr-pv').textContent = p0.toFixed(2);
  $('cr-kv').textContent = K;

  const p = plotSetup('cv-crowd', 0, 51, 0, 1.02, 10, 0.2);
  const { ctx, sx, sy } = p;

  /* the 50/50 line — the crowd can only help above it */
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(230,237,243,.28)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, sy(0.5)); ctx.lineTo(p.W, sy(0.5)); ctx.stroke(); ctx.restore();

  /* three reference curves plus the one the slider controls */
  const curves = [[0.55, 'rgba(230,237,243,.22)'], [0.6, 'rgba(230,237,243,.22)'], [0.7, 'rgba(230,237,243,.22)']];
  for (const [pp, col] of curves) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let k = 1; k <= 51; k += 2) {
      const y = majorityRight(k, pp);
      k === 1 ? ctx.moveTo(sx(k), sy(y)) : ctx.lineTo(sx(k), sy(y));
    }
    ctx.stroke(); ctx.restore();
    ctx.font = '9px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, 'p=' + pp, sx(50), sy(majorityRight(51, pp)), 'rgba(230,237,243,.35)');
  }

  ctx.save(); ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let k = 1; k <= 51; k += 2) {
    const y = majorityRight(k, p0);
    k === 1 ? ctx.moveTo(sx(k), sy(y)) : ctx.lineTo(sx(k), sy(y));
  }
  ctx.stroke(); ctx.restore();

  const here = majorityRight(K, p0);
  plotQuery(p, K, here, COL.accent, pct(here));
  axLabels(p, 'number of voters K →', 'P(majority is right) ↑');

  $('out-crowd').textContent =
`each voter is right ${pct(p0)} of the time, on its own
${K} voters, majority rule  -->  ${(here * 100).toFixed(1)}% right
${p0 > 0.5 ? '--> better than any single voter, and it keeps improving with K'
           : '--> worse than one voter: below 50% the crowd amplifies the mistake'}`;
}

/* ═══ PANEL 3: bootstrapping ═══
   One bootstrap sample of the 20 rows, drawn live. Some rows come up
   twice or three times, some never — and the ones that never come up
   are exactly the out-of-bag rows panel 6 uses. */
function drawBoot() {
  const k = +$('bt-k').value;
  $('bt-kv').textContent = k + 1;
  const rng = mulberry32(31 + k * 17);
  const draw = [];
  for (let i = 0; i < N; i++) draw.push(Math.floor(rng() * N));
  const cnt = new Array(N).fill(0);
  for (const i of draw) cnt[i]++;
  const uniq = cnt.filter(v => v > 0).length;
  const oob = cnt.filter(v => v === 0).length;

  const c = canvasSetup('cv-boot', 236);
  const { ctx, W } = c;
  const cols = 10, cw = Math.min(52, (W - 20) / cols), ch = 40;
  const x0 = (W - cols * cw) / 2;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < N; i++) {
    const cx = x0 + (i % cols) * cw + cw / 2, cy = 44 + Math.floor(i / cols) * (ch + 46);
    const n = cnt[i];
    ctx.save();
    roundRect(ctx, cx - cw / 2 + 3, cy - ch / 2, cw - 6, ch, 7);
    ctx.fillStyle = n ? hexA(CLR[PASS[i]], 0.10 + 0.12 * Math.min(n, 3)) : 'rgba(255,255,255,.02)';
    ctx.fill();
    ctx.strokeStyle = n ? hexA(CLR[PASS[i]], 0.75) : 'rgba(230,237,243,.18)';
    ctx.lineWidth = n ? 1.5 : 1; if (!n) ctx.setLineDash([3, 3]);
    ctx.stroke(); ctx.restore();
    /* Courier is about 0.6em wide, so "row 12" needs ~36px — on a narrow
       canvas the cells are thinner than that and the label loses "row" */
    const wide = cw >= 42;
    ctx.font = 'bold ' + (wide ? 10 : 9) + 'px Courier New';
    haloText(ctx, (wide ? 'row ' : '') + i, cx, cy - 8, n ? 'rgba(230,237,243,.8)' : 'rgba(230,237,243,.32)');
    ctx.font = 'bold ' + (wide ? 11 : 10) + 'px Courier New';
    haloText(ctx, n ? '×' + n : 'OOB', cx, cy + 9, n ? CLR[PASS[i]] : COL.cyan);
  }

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'sample ' + (k + 1) + ' — 20 draws, with replacement', 4, 4, COL.accent);
  ctx.font = '10px Courier New';
  haloText(ctx, uniq + ' distinct rows in the bag (' + pct(uniq / N) + ')  ·  ' + oob + ' out of bag (' + pct(oob / N) + ')',
           4, 210, 'rgba(230,237,243,.55)');

  $('out-boot').textContent =
`bag  = [${draw.slice(0, 12).join(', ')}, ...]   (20 draws)
kept  ${uniq}/20 distinct rows -> ${pct(uniq / N)}   (theory: 63.2%)
left  ${oob}/20 rows out of bag -> ${pct(oob / N)}   (theory: 36.8%)
--> this is the training set of tree ${k + 1}, and nothing else sees it`;
}

/* ═══ PANEL 4: random features ═══
   The root split of the whole dataset, scored on every feature. A tree
   in the forest is only shown max_features of them, so the winner it
   picks is often not the globally best split — and that is the point. */
function drawFeat() {
  const seed = +$('ft-seed').value;
  const mf = +$('ft-mf').value;
  $('ft-seedv').textContent = seed;
  $('ft-mfv').textContent = mf;

  const all = S3.map((_, i) => i);
  const global = allSplits(S3, PASS, all, [0, 1, 2]);
  const rng = mulberry32(9001 + seed * 131);
  const allowed = pickFeatures(3, mf, rng);
  const local = allSplits(S3, PASS, all, allowed);

  /* best split available on each feature on its own */
  const perFeat = [0, 1, 2].map(f => {
    let b = null;
    for (const s of global.splits) if (s.f === f && (!b || s.gain > b.gain)) b = s;
    return b;
  });

  const c = canvasSetup('cv-feat', 208);
  const { ctx, W } = c;
  const maxG = Math.max(...perFeat.map(s => s ? s.gain : 0)) || 1;
  const barX = 128, barW = W - barX - 66;

  ctx.textBaseline = 'middle';
  perFeat.forEach((s, f) => {
    const y = 54 + f * 46;
    const on = allowed.includes(f);
    const win = local.best && local.best.f === f;
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'right';
    haloText(ctx, FEATS[f], barX - 12, y, on ? COL.text : 'rgba(230,237,243,.28)');
    const w = Math.max(2, (s ? s.gain / maxG : 0) * barW);
    ctx.save();
    roundRect(ctx, barX, y - 11, w, 22, 5);
    ctx.fillStyle = on ? hexA(win ? '#facc15' : '#3b82f6', win ? 0.32 : 0.18) : 'rgba(255,255,255,.03)';
    ctx.fill();
    ctx.strokeStyle = on ? (win ? COL.accent : 'rgba(59,130,246,.6)') : 'rgba(230,237,243,.14)';
    ctx.lineWidth = win ? 2 : 1.2; if (!on) ctx.setLineDash([3, 3]);
    ctx.stroke(); ctx.restore();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left';
    haloText(ctx, s ? s.gain.toFixed(3) : '—', barX + w + 8, y, on ? (win ? COL.accent : 'rgba(230,237,243,.6)') : 'rgba(230,237,243,.25)');
    ctx.font = '9px Courier New';
    haloText(ctx, on ? (win ? '← chosen' : 'allowed') : 'not drawn', barX + 8, y + 20,
             on ? (win ? COL.accent : 'rgba(230,237,243,.4)') : 'rgba(230,237,243,.25)');
  });

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'gini gain of the best split on each feature', 4, 4, COL.accent);
  ctx.font = '10px Courier New';
  haloText(ctx, 'this split may look at: ' + allowed.map(f => FSHORT[f]).join(', '), 4, 22, COL.cyan);

  const gBest = global.best, lBest = local.best;
  $('out-feat').textContent =
`max_features = ${mf} of 3   ->  drew {${allowed.map(f => FSHORT[f]).join(', ')}}
best split allowed here : ${lBest ? FEATS[lBest.f] + ' <= ' + lBest.thr.toFixed(1) + '   gain ' + lBest.gain.toFixed(3) : 'none'}
best split overall      : ${FEATS[gBest.f]} <= ${gBest.thr.toFixed(1)}   gain ${gBest.gain.toFixed(3)}
${lBest && lBest.f === gBest.f ? '--> same winner this time' : '--> a different, weaker root — this tree is now genuinely its own model'}`;
}

/* ═══ PANEL 5: voting ═══
   Move the student and watch seven real trees disagree. */
const VOTE_FOREST = fitForest(S3, PASS, { nTrees: 7, maxDepth: 3, maxFeatures: 1, seed: 13 });

function drawVote() {
  const st = +$('vt-study').value, sl = +$('vt-sleep').value, bf = +$('vt-bf').value;
  $('vt-studyv').textContent = st; $('vt-sleepv').textContent = sl;
  $('vt-bfv').textContent = bf ? 'yes' : 'no';
  const q = [st, sl, bf];
  const v = forestVote(VOTE_FOREST, q);
  const nFail = v.votes['0'] || 0, nPass = v.votes['1'] || 0;

  const c = canvasSetup('cv-vote', 210);
  const { ctx, W } = c;
  const K = VOTE_FOREST.trees.length, slotW = W / K;

  VOTE_FOREST.trees.forEach((tr, k) => {
    const cx = slotW * (k + 0.5), vote = v.per[k];
    /* a small glyph of the tree, tinted by the way it voted */
    const leaves = layoutTree(tr.root);
    const spread = Math.min(slotW - 14, 54);
    const px = nd => cx + (leaves <= 1 ? 0 : (nd._x / (leaves - 1) - 0.5) * spread);
    const py = d => 52 + d * 30;
    (function limb(nd, parent) {
      if (parent) {
        ctx.beginPath(); ctx.moveTo(px(parent), py(parent.depth)); ctx.lineTo(px(nd), py(nd.depth));
        ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.3; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(px(nd), py(nd.depth), nd.leaf ? 3.6 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = nd.leaf ? CLR[nd.value] : 'rgba(250,204,21,.8)'; ctx.fill();
      if (!nd.leaf) { limb(nd.left, nd); limb(nd.right, nd); }
    })(tr.root, null);

    ctx.save();
    roundRect(ctx, cx - 22, 156, 44, 20, 6);
    ctx.fillStyle = hexA(CLR[vote], 0.22); ctx.fill();
    ctx.strokeStyle = CLR[vote]; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, CLS_NAME[vote], cx, 166, CLR[vote]);
    ctx.font = '9px Courier New';
    haloText(ctx, 'T' + (k + 1), cx, 34, 'rgba(230,237,243,.4)');
  });

  /* the tally bar */
  const bw = W - 20, bx = 10, by = 190;
  ctx.save();
  roundRect(ctx, bx, by, bw, 14, 5); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();
  const wFail = bw * nFail / K;
  roundRect(ctx, bx, by, Math.max(wFail, 0.001), 14, 5); ctx.fillStyle = hexA(CLR[0], 0.55); ctx.fill();
  if (nPass) { roundRect(ctx, bx + wFail, by, bw - wFail, 14, 5); ctx.fillStyle = hexA(CLR[1], 0.55); ctx.fill(); }
  ctx.restore();
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'the vote', 4, 4, COL.accent);

  $('out-vote').textContent =
`new student: study_hours=${st}, sleep_hours=${sl}, had_breakfast=${bf}
votes:  FAIL ${nFail}   |   PASS ${nPass}     (out of ${K} trees)
majority --> ${CLS_NAME[v.value]}
${nFail && nPass ? '--> the trees disagree, and the majority still has to be right'
                 : '--> unanimous: this row is nowhere near any boundary'}`;
}

/* ═══ PANEL 6: out-of-bag error ═══
   Rows down the side, trees across the top. A cyan cell means that
   tree never saw that row, so that tree is allowed to grade it. */
function drawOob() {
  const K = +$('ob-k').value;
  $('ob-kv').textContent = K;
  const forest = fitForest(S3, PASS, { nTrees: K, maxDepth: 4, maxFeatures: 1, seed: 13 });
  const oob = forestOOB(forest);

  const c = canvasSetup('cv-oobgrid', 236);
  const { ctx, W } = c;
  const gx = 62, gy = 34, cw = Math.min(26, (W - gx - 92) / K), chh = 8.4;

  ctx.textBaseline = 'middle';
  for (let i = 0; i < N; i++) {
    const y = gy + i * chh;
    ctx.font = '8px Courier New'; ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(230,237,243,.4)'; ctx.fillText('row ' + i, gx - 6, y + chh / 2);
    for (let k = 0; k < K; k++) {
      const out = !forest.trees[k].inBag.has(i);
      ctx.fillStyle = out ? 'rgba(6,182,212,.55)' : 'rgba(255,255,255,.05)';
      ctx.fillRect(gx + k * cw + 1, y + 1, cw - 2, chh - 2);
    }
    const r = oob.per[i];
    ctx.textAlign = 'left'; ctx.font = 'bold 8px Courier New';
    ctx.fillStyle = r ? (r.right ? COL.green : COL.red) : 'rgba(230,237,243,.25)';
    ctx.fillText(r ? (r.right ? '✓ ' + r.voters + ' graders' : '✗ ' + r.voters + ' graders') : 'no grader',
                 gx + K * cw + 8, y + chh / 2);
  }

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'in-bag  vs  out-of-bag', 4, 4, COL.accent);
  ctx.font = '9px Courier New';
  haloText(ctx, K + ' trees →', gx, 20, 'rgba(230,237,243,.4)');

  $('out-oob').textContent =
`${K} trees, 20 rows
each row is graded only by the trees that never saw it
oob_score_ = ${oob.score.toFixed(3)}  (${Math.round(oob.score * oob.used)} of ${oob.used} rows right)
--> a validation score with no train_test_split anywhere`;
}

/* ═══ PANEL 8: how many trees ═══
   One forest of 60 trees on the 240-row set, scored using only the
   first k of them. That is exactly what the curve means: adding a tree
   never retrains the others, it only adds a voice to the vote. */
const CURVES = {};
function curveFor(mf) {
  if (CURVES[mf]) return CURVES[mf];
  const f = fitForest(BIG.X, BIG.y, { nTrees: 60, maxDepth: 8, maxFeatures: mf, seed: 7 });
  const pts = [];
  for (let k = 1; k <= 60; k++) pts.push(forestOOB(f, k).score);
  return (CURVES[mf] = pts);
}

function drawNtrees() {
  const mf = +$('nt-mf').value, K = +$('nt-k').value;
  $('nt-mfv').textContent = mf; $('nt-kv').textContent = K;
  const p = plotSetup('cv-ntrees', 0, 62, 0.6, 0.95, 10, 0.05);
  const { ctx, sx, sy, W } = p;

  /* where a single unbagged tree lands, for scale */
  const solo = curveFor(1)[0];
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(244,63,94,.55)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(0, sy(solo)); ctx.lineTo(W, sy(solo)); ctx.stroke(); ctx.restore();
  ctx.font = '9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  haloText(ctx, 'one tree alone = ' + solo.toFixed(3), 8, sy(solo) - 4, 'rgba(244,63,94,.8)');

  for (const m of [1, 2]) {
    const pts = curveFor(m), on = m === mf;
    ctx.save();
    ctx.strokeStyle = on ? COL.accent : 'rgba(230,237,243,.22)';
    ctx.lineWidth = on ? 2.6 : 1.3;
    ctx.beginPath();
    pts.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i + 1), sy(v)) : ctx.lineTo(sx(i + 1), sy(v)));
    ctx.stroke(); ctx.restore();
    if (!on) {
      ctx.font = '9px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      haloText(ctx, 'max_features=' + m, sx(60), sy(pts[59]), 'rgba(230,237,243,.4)');
    }
  }
  const pts = curveFor(mf);
  plotQuery(p, K, pts[K - 1], COL.accent, pts[K - 1].toFixed(3));
  axLabels(p, 'n_estimators →', 'oob_score_ ↑');

  /* the first k after which the score never moves more than 1 point again */
  let plateau = 60;
  for (let k = 5; k <= 60; k++) {
    if (pts.slice(k - 1).every(v => Math.abs(v - pts[59]) < 0.015)) { plateau = k; break; }
  }
  $('out-ntrees').textContent =
`240 rows, 2 features, 12% of the labels flipped on purpose
max_features=${mf}, n_estimators=${K}  ->  oob_score_ = ${pts[K - 1].toFixed(3)}
1 tree ${pts[0].toFixed(3)}  ->  10 trees ${pts[9].toFixed(3)}  ->  60 trees ${pts[59].toFixed(3)}
--> flat from about ${plateau} trees on; past that you are buying compute, not accuracy`;
}

/* ═══ APPENDIX A1: one tree vs the forest ═══
   The same seed drives both panes, so you are comparing like with
   like: the left is one tree grown on one bootstrap sample, the right
   is 40 trees grown the same way and then voted. */
/* fitting 40 trees on 240 rows costs ~200ms, which is a visible stall on
   every step of the slider — so each resample is built once and kept */
const A1_CACHE = {};
function a1Models(seed) {
  if (A1_CACHE[seed]) return A1_CACHE[seed];
  const nB = BIG.X.length, s = 1300 + seed * 277;
  const rng = mulberry32(s);
  const bag = [];
  for (let i = 0; i < nB; i++) bag.push(Math.floor(rng() * nB));
  const inBag = new Set(bag), oobRows = [];
  for (let i = 0; i < nB; i++) if (!inBag.has(i)) oobRows.push(i);
  const one = fitTreeOn(BIG.X, BIG.y, bag, { maxDepth: 8 }, rng);
  const forest = fitForest(BIG.X, BIG.y, { nTrees: 40, maxDepth: 8, maxFeatures: 1, seed: s });
  return (A1_CACHE[seed] = { one, forest, oobRows, oob: forestOOB(forest).score });
}

function drawCompare() {
  const seed = +$('a1-seed').value;
  $('a1-seedv').textContent = seed;
  const { one, forest, oobRows, oob } = a1Models(seed);
  const nB = BIG.X.length;

  const p1 = plotSetup('cv-a1a', 0, 10, 0, 10, 2);
  paintRegions(p1, (x, y) => predictOne(one, [x, y]), 0.2);
  for (let i = 0; i < nB; i++) plotPoint(p1, BIG.X[i][0], BIG.X[i][1], CLR[BIG.y[i]], null, 2.6);
  axLabels(p1, 'X1 →', 'X2 ↑');

  const p2 = plotSetup('cv-a1b', 0, 10, 0, 10, 2);
  paintRegions(p2, (x, y) => forestVote(forest, [x, y]).value, 0.2);
  for (let i = 0; i < nB; i++) plotPoint(p2, BIG.X[i][0], BIG.X[i][1], CLR[BIG.y[i]], null, 2.6);
  axLabels(p2, 'X1 →', 'X2 ↑');

  $('out-a1').textContent =
`resample ${seed} — same bootstrap sample feeds both sides
one tree :  ${countLeaves(one)} leaves, depth ${treeDepth(one)}, held-out accuracy ${accuracyOf(one, BIG.X, BIG.y, oobRows).toFixed(3)}
40 trees :  oob_score_ ${oob.toFixed(3)}
--> drag the slider: the left picture redraws itself every time, the right one barely moves`;
}

/* ═══ APPENDIX A2: feature_importances_ ═══ */
function drawImp() {
  const seed = +$('a2-seed').value;
  const nT = +$('a2-n').value;
  $('a2-seedv').textContent = seed; $('a2-nv').textContent = nT;
  const forest = fitForest(S3, PASS, { nTrees: nT, maxDepth: 6, maxFeatures: 1, seed: 11 + seed * 53 });
  const imp = importances(forest);

  const c = canvasSetup('cv-imp', 186);
  const { ctx, W } = c;
  const barX = 132, barW = W - barX - 70, maxI = Math.max(...imp, 0.01);
  ctx.textBaseline = 'middle';
  imp.forEach((v, f) => {
    const y = 52 + f * 42;
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'right';
    haloText(ctx, FEATS[f], barX - 12, y, COL.text);
    const w = Math.max(2, v / maxI * barW);
    ctx.save();
    roundRect(ctx, barX, y - 12, w, 24, 5);
    ctx.fillStyle = hexA(['#facc15', '#06b6d4', '#a855f7'][f], 0.26); ctx.fill();
    ctx.strokeStyle = ['#facc15', '#06b6d4', '#a855f7'][f]; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left';
    haloText(ctx, v.toFixed(3), barX + w + 8, y, ['#facc15', '#06b6d4', '#a855f7'][f]);
  });
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'mean decrease in impurity, averaged over ' + nT + ' trees', 4, 4, COL.accent);

  $('out-imp').textContent =
`seed ${seed}, n_estimators = ${nT}
${FEATS.map((n, f) => n.padEnd(15) + imp[f].toFixed(3)).join('\n')}
sum = ${imp.reduce((a, b) => a + b, 0).toFixed(3)}   (they always add up to 1)
--> change the seed with few trees and the numbers move; with 100 they settle`;
}

/* ══════════ boot ══════════ */
const DRAWS = [drawForest, drawShake, drawCrowd, drawBoot, drawFeat, drawVote, drawOob,
               null, drawNtrees, null, null, drawCompare, drawImp];

updateDots();
setTimeout(drawForest, 90);

window.addEventListener('resize', () => {
  instant = true;
  if (current === 0) { if (ovRaf) cancelAnimationFrame(ovRaf); instant = false; drawForest(); }
  else if (DRAWS[current]) DRAWS[current]();
  instant = false;
  fitMath($('panel-' + current));
});

document.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pos = CURRICULUM_ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && pos < CURRICULUM_ORDER.length - 1) goTo(CURRICULUM_ORDER[pos + 1]);
  if (e.key === 'ArrowLeft'  && pos > 0) goTo(CURRICULUM_ORDER[pos - 1]);
});
