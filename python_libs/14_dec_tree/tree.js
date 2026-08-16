/* ══════════════════════════════════════════════════════════════════
   Decision Trees — deck 14
   Every tree on this page is really grown in the browser: buildTree()
   below is CART, the same algorithm sklearn runs, so the splits and
   the impurities match what DecisionTreeClassifier prints.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 14;
const LABELS = ['Overview','The idea','Anatomy of a tree','Gini impurity','Weighted Gini & gain',
                'Choosing the split','Train / test split','In Python','Regression tree',
                'Overfitting & pruning','Pros & cons','Exercises',
                'A1 · Entropy vs Gini','A2 · Drawing the tree'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];

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
  const draws = [drawOverview, drawIdea, drawAnatomy, drawGini, drawGain, drawScan, drawTT,
                 drawTreeDemo, drawReg, drawPrune, null, null, drawEnt, drawDraw];
  if (draws[idx]) setTimeout(draws[idx], 60);
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

/* ══════════ shared cartesian plot helper ══════════ */
const COL = { grid:'rgba(230,237,243,.07)', axis:'rgba(230,237,243,.45)', tick:'rgba(230,237,243,.4)',
              accent:'#facc15', blue:'#3b82f6', green:'#10b981', red:'#f43f5e', cyan:'#06b6d4',
              orange:'#f97316', purple:'#8b5cf6', pink:'#ec4899', text:'#e6edf3', surface:'#020509' };
/* class A green, class B orange — used everywhere in the deck */
const CLR = { A:'#10b981', B:'#f97316', 0:'#10b981', 1:'#f97316' };

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
  ctx.strokeStyle = COL.axis; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  if (YMIN <= 0 && YMAX >= 0) { ctx.beginPath(); ctx.moveTo(0, sy(0)); ctx.lineTo(W, sy(0)); ctx.stroke(); }
  if (XMIN <= 0 && XMAX >= 0) { ctx.beginPath(); ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), H); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = COL.tick; ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const yb = (YMIN <= 0 && YMAX >= 0) ? 0 : YMIN;
  const tickY = Math.min(sy(yb) + 4, H - 13);
  for (let gx = Math.ceil(XMIN / xstep) * xstep; gx <= XMAX; gx += xstep) if (Math.abs(gx) > 1e-9 && sx(gx) > 14 && sx(gx) < W - 14) ctx.fillText(Math.round(gx * 100) / 100, sx(gx), tickY);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const xb = (XMIN <= 0 && XMAX >= 0) ? 0 : XMIN;
  for (let gy = Math.ceil(YMIN / ystep) * ystep; gy <= YMAX; gy += ystep) if (Math.abs(gy) > 1e-9 && sy(gy) > 10 && sy(gy) < H - 10) ctx.fillText(Math.round(gy * 100) / 100, sx(xb) + 5, sy(gy));
  return { ctx, sx, sy, W, H, XMIN, XMAX, YMIN, YMAX };
}

/* a bare canvas with no axes — for the tree diagrams */
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

function plotQuery(p, x, y, color, label, r = 7, glow = 0) {
  const { ctx, sx, sy } = p;
  const cx = sx(x), cy = sy(y);
  ctx.setLineDash([]);
  if (glow > 0) {
    ctx.beginPath(); ctx.arc(cx, cy, r + glow, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250,204,21,' + (0.22 * (1 - glow / 26)).toFixed(3) + ')'; ctx.fill();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.restore();
  if (label) {
    ctx.font = 'bold 11px Courier New'; ctx.textBaseline = 'bottom';
    /* the label normally sits to the right of the marker, but at the right-hand
       end of a plot that runs off the canvas — there it flips to the left, so
       readings like "G = 0.000" at share = 1.00 stay readable */
    const flip = cx + 12 + ctx.measureText(label).width > p.W - 4;
    ctx.textAlign = flip ? 'right' : 'left';
    haloText(ctx, label, cx + (flip ? -12 : 12), cy - 9, color);
  }
}

function axLabels(p, xlab, ylab) {
  const { ctx, W } = p;
  ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top';
  ctx.textAlign = 'left';  haloText(ctx, ylab, 12, 8, 'rgba(230,237,243,.42)');
  ctx.textAlign = 'right'; haloText(ctx, xlab, W - 8, 8, 'rgba(230,237,243,.42)');
}

/* rounded rectangle, used by every tree diagram */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
   CART — the real thing.
   Classification uses Gini (or entropy); regression uses MSE.
   Candidate thresholds are the midpoints between neighbouring values,
   exactly as sklearn does it, which is why the demos print the same
   "X1 <= 2.50" that DecisionTreeClassifier prints.
   ══════════════════════════════════════════════════════════════════ */
function countOf(labels) { const c = {}; for (const v of labels) c[v] = (c[v] || 0) + 1; return c; }

function giniOf(counts, n) {
  if (!n) return 0;
  let s = 0; for (const k in counts) s += (counts[k] / n) ** 2;
  return 1 - s;
}
function entropyOf(counts, n) {
  if (!n) return 0;
  let s = 0; for (const k in counts) { const p = counts[k] / n; if (p > 0) s -= p * Math.log2(p); }
  return s;
}
function mseOf(vals) {
  if (!vals.length) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length;
}

function impurityOf(idx, ys, crit) {
  if (crit === 'mse') return mseOf(idx.map(i => ys[i]));
  const c = countOf(idx.map(i => ys[i]));
  return crit === 'entropy' ? entropyOf(c, idx.length) : giniOf(c, idx.length);
}

/* every candidate split at this node, scored — used by the search demo too */
function allSplits(X, ys, idx, crit) {
  const n = idx.length, impP = impurityOf(idx, ys, crit), out = [];
  for (let f = 0; f < X[0].length; f++) {
    const vals = [...new Set(idx.map(i => X[i][f]))].sort((a, b) => a - b);
    for (let k = 0; k < vals.length - 1; k++) {
      const thr = (vals[k] + vals[k + 1]) / 2;
      const L = idx.filter(i => X[i][f] <= thr), R = idx.filter(i => X[i][f] > thr);
      if (!L.length || !R.length) continue;
      const iL = impurityOf(L, ys, crit), iR = impurityOf(R, ys, crit);
      const w = L.length / n * iL + R.length / n * iR;
      out.push({ f, thr, L, R, iL, iR, weighted: w, gain: impP - w });
    }
  }
  return { impP, splits: out };
}

function buildTree(X, ys, idx, opts, depth) {
  opts = opts || {};
  const crit = opts.criterion || 'gini';
  const maxDepth = opts.maxDepth == null ? 30 : opts.maxDepth;
  const minLeaf = opts.minLeaf || 1;
  const minSplit = opts.minSplit || 2;
  depth = depth || 0;

  const n = idx.length;
  const counts = countOf(idx.map(i => ys[i]));
  const imp = impurityOf(idx, ys, crit);
  const node = { n, counts, imp, depth, leaf: true };
  if (crit === 'mse') node.value = idx.reduce((a, i) => a + ys[i], 0) / n;
  else {
    let best = null;
    for (const k in counts) if (best === null || counts[k] > counts[best] ||
        (counts[k] === counts[best] && k < best)) best = k;
    node.value = best;
  }

  if (depth >= maxDepth || n < minSplit || imp <= 1e-12) return node;

  const { splits } = allSplits(X, ys, idx, crit);
  let best = null;
  for (const s of splits) {
    if (s.L.length < minLeaf || s.R.length < minLeaf) continue;
    if (!best || s.gain > best.gain + 1e-12) best = s;
  }
  if (!best || best.gain <= 1e-12) return node;

  node.leaf = false;
  node.f = best.f; node.thr = best.thr; node.gain = best.gain;
  node.left = buildTree(X, ys, best.L, opts, depth + 1);
  node.right = buildTree(X, ys, best.R, opts, depth + 1);
  return node;
}

function fit(X, ys, opts) { return buildTree(X, ys, X.map((_, i) => i), opts, 0); }
function predictOne(node, x) { return node.leaf ? node.value : predictOne(x[node.f] <= node.thr ? node.left : node.right, x); }
function pathOf(node, x, acc) {
  acc = acc || [];
  acc.push(node);
  if (node.leaf) return acc;
  return pathOf(x[node.f] <= node.thr ? node.left : node.right, x, acc);
}
function countLeaves(node) { return node.leaf ? 1 : countLeaves(node.left) + countLeaves(node.right); }
function treeDepth(node) { return node.leaf ? 0 : 1 + Math.max(treeDepth(node.left), treeDepth(node.right)); }
function accuracyOf(node, X, ys, idx) {
  idx = idx || X.map((_, i) => i);
  if (!idx.length) return 1;
  let ok = 0;
  for (const i of idx) if (String(predictOne(node, X[i])) === String(ys[i])) ok++;
  return ok / idx.length;
}

/* export_text, reimplemented so the demos print exactly what sklearn prints.
   `classes` must be every class in the training data, sorted — sklearn always
   shows a weight for each one, including the zeros. */
function exportText(node, names, classes, prefix) {
  prefix = prefix || '';
  if (node.leaf) {
    if (typeof node.value === 'number')
      return prefix + '|--- value: [' + node.value.toFixed(2) + ']\n';
    const w = classes.map(k => (node.counts[k] || 0).toFixed(2)).join(', ');
    return prefix + '|--- weights: [' + w + '] class: ' + node.value + '\n';
  }
  const nm = names[node.f];
  return prefix + '|--- ' + nm + ' <= ' + node.thr.toFixed(2) + '\n'
       + exportText(node.left, names, classes, prefix + '|   ')
       + prefix + '|--- ' + nm + ' >  ' + node.thr.toFixed(2) + '\n'
       + exportText(node.right, names, classes, prefix + '|   ');
}

/* depth-first impurity list — the same order as clf.tree_.impurity */
function impurityList(node, out) {
  out = out || [];
  out.push(node.imp);
  if (!node.leaf) { impurityList(node.left, out); impurityList(node.right, out); }
  return out;
}

/* ══════════ drawing a fitted tree ══════════ */
function layoutTree(root) {
  let nextX = 0;
  (function walk(nd) {
    if (nd.leaf) { nd._x = nextX++; return; }
    walk(nd.left); walk(nd.right);
    nd._x = (nd.left._x + nd.right._x) / 2;
  })(root);
  return nextX;                       // number of leaves
}

/* draws a fitted tree. opts: {names, filled, maxDepth, highlight:[nodes], showStats} */
function renderTree(c, root, opts) {
  opts = opts || {};
  const names = opts.names || ['X1', 'X2'];
  const leaves = layoutTree(root);
  const depth = Math.min(treeDepth(root), opts.maxDepth == null ? 99 : opts.maxDepth);
  const { ctx, W, H } = c;
  const boxW = Math.min(126, (W - 30) / Math.max(1, leaves));
  const boxH = opts.showStats === false ? 34 : 54;
  const padX = boxW / 2 + 12;
  const spanX = W - padX * 2;
  const rows = depth + 1;
  const stepY = (H - boxH - 26) / Math.max(1, rows - 1);
  const px = nd => padX + (leaves <= 1 ? spanX / 2 : nd._x / (leaves - 1) * spanX);
  const py = d => 14 + d * stepY;
  const hi = opts.highlight || [];

  (function draw(nd, parent) {
    if (nd.depth > depth) return;
    const x = px(nd), y = py(nd.depth);
    const cut = nd.depth === depth && !nd.leaf;      // clipped by maxDepth → draw as a leaf
    if (parent) {
      const on = hi.includes(nd) && hi.includes(parent);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px(parent), py(parent.depth) + boxH);
      ctx.lineTo(x, y);
      ctx.strokeStyle = on ? COL.accent : 'rgba(230,237,243,.28)';
      ctx.lineWidth = on ? 2.6 : 1.4;
      ctx.stroke(); ctx.restore();
      /* yes / no label on the edge */
      ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, parent.left === nd ? 'True' : 'False',
               (px(parent) + x) / 2, (py(parent.depth) + boxH + y) / 2,
               on ? COL.accent : 'rgba(230,237,243,.4)');
    }
    /* the box */
    const isLeaf = nd.leaf || cut;
    let fill = 'rgba(255,255,255,.05)';
    if (opts.filled !== false) {
      const base = typeof nd.value === 'number' ? COL.cyan : (CLR[nd.value] || COL.blue);
      /* stronger colour = purer node, exactly like plot_tree */
      const maxImp = typeof nd.value === 'number' ? 1 : 0.5;
      const a = 0.12 + 0.34 * Math.max(0, 1 - nd.imp / maxImp);
      fill = hexA(base, a);
    }
    ctx.save();
    roundRect(ctx, x - boxW / 2, y, boxW, boxH, 7);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = hi.includes(nd) ? COL.accent : (isLeaf ? 'rgba(59,130,246,.55)' : 'rgba(230,237,243,.3)');
    ctx.lineWidth = hi.includes(nd) ? 2.4 : 1.3;
    ctx.stroke(); ctx.restore();

    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const lines = [];
    let mseLine = -1;                 /* regression impurity gets its own colour */
    if (!isLeaf) lines.push(names[nd.f] + ' <= ' + nd.thr.toFixed(2));
    if (opts.showStats !== false) {
      if (typeof nd.value === 'number') mseLine = lines.length;
      lines.push((typeof nd.value === 'number' ? 'mse = ' : 'gini = ') + nd.imp.toFixed(3));
      lines.push('samples = ' + nd.n);
      if (typeof nd.value === 'number') lines.push('value = ' + nd.value.toFixed(2));
      else {
        const keys = Object.keys(nd.counts).sort();
        lines.push('[' + keys.map(k => nd.counts[k]).join(', ') + ']  ' + nd.value);
      }
    } else {
      if (isLeaf) lines.push(typeof nd.value === 'number' ? nd.value.toFixed(2) : String(nd.value));
    }
    ctx.font = 'bold 9px Courier New';
    lines.slice(0, 4).forEach((t, i) => {
      haloText(ctx, t, x, y + 6 + i * 11,
               i === mseLine ? COL.accent
             : i === 0 && !isLeaf ? COL.text
             : 'rgba(230,237,243,.72)');
    });

    if (!nd.leaf && !cut) { draw(nd.left, nd); draw(nd.right, nd); }
  })(root, null);
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
}

/* paint the decision regions of a fitted 2-D tree */
function paintRegions(p, root, alpha) {
  const { ctx, W, H, XMIN, XMAX, YMIN, YMAX } = p;
  const B = 6;
  for (let px = 0; px < W; px += B) {
    for (let py = 0; py < H; py += B) {
      const x = XMIN + (px + B / 2) / W * (XMAX - XMIN);
      const y = YMAX - (py + B / 2) / H * (YMAX - YMIN);
      const cls = predictOne(root, [x, y]);
      ctx.fillStyle = hexA(CLR[cls] || '#3b82f6', alpha == null ? 0.14 : alpha);
      ctx.fillRect(px, py, B, B);
    }
  }
}

/* ══════════ the datasets from the lesson ══════════ */
/* the six rows used for Gini, gain and the split search */
const D6_X = [[1, 3], [2, 1], [3, 2], [4, 3], [5, 1], [6, 2]];
const D6_Y = ['A', 'A', 'B', 'B', 'A', 'B'];
/* the weight / height DataFrame from the last cell */
const DW_X = [[2, 5], [4, 3], [6, 4], [8, 5], [10, 3], [12, 4]];
const DW_Y = ['A', 'A', 'B', 'B', 'A', 'B'];
/* the 8 rows used for train_test_split — deliberately not separable */
const D8_X = [[1, 2], [2, 3], [3, 1], [4, 5], [5, 4], [6, 7], [7, 6], [8, 8]];
const D8_Y = [0, 0, 0, 1, 1, 1, 1, 0];
/* the 1-D regression data */
const RX = [[1], [2], [3], [4], [5], [6], [7], [8], [9]];
const RY = [2.1, 3.4, 3.0, 5.2, 6.8, 6.1, 8.4, 9.0, 8.2];

const f2 = v => v.toFixed(2);
const f3 = v => v.toFixed(3);
const f4 = v => v.toFixed(4);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ═══ PANEL 0: overview — the tree growing, one group splitting into many ═══
   The whole point of the deck in one loop: a box holds a group of rows, a
   question splits that group in two, and the halves fly down into the boxes
   below. Thirteen rows, two features; CART grows a depth-2 tree whose four
   leaves are all pure, so the loop ends with four single-colour groups. */
const OV_X = [[1,2],[2,3],[3,3],[1,6],[3,7],[5,1],[6,2],[7,1],[8,3],[5,3],[7,2],[6,6],[8,7]];
const OV_Y = ['A','A','A','B','B','B','B','B','B','B','B','A','A'];
const OV_TREE = fit(OV_X, OV_Y, {});
/* every node remembers the rows that reach it, sorted by class so the dots
   inside a box cluster by colour — that is what makes a pure leaf obvious */
(function ovRows(nd, idx) {
  nd._rows = idx.slice().sort((a, b) => OV_Y[a] < OV_Y[b] ? -1 : OV_Y[a] > OV_Y[b] ? 1 : a - b);
  if (nd.leaf) return;
  ovRows(nd.left,  idx.filter(i => OV_X[i][nd.f] <= nd.thr));
  ovRows(nd.right, idx.filter(i => OV_X[i][nd.f] >  nd.thr));
})(OV_TREE, OV_X.map((_, i) => i));

/* where row k of a node's group sits inside that node's box. L.per is the most
   dots a row can hold; the group is then spread evenly over the rows it needs,
   so a group of 8 reads as 4 + 4 rather than 7 + 1. */
function ovSlot(nd, k, L) {
  const n = nd._rows.length;
  const rows = Math.ceil(n / Math.min(L.per, n)), per = Math.ceil(n / rows);
  const row = Math.floor(k / per), col = k % per;
  const inRow = Math.min(per, n - row * per);
  const yTop = L.boxH - 8 - rows * L.rowH;
  return { x: L.px(nd) - (inRow - 1) * L.sp / 2 + col * L.sp,
           y: L.py(nd.depth) + yTop + row * L.rowH + L.rowH / 2 };
}

const OV_DUR = 7400;
function drawOverview() {
  const t0 = performance.now();
  const ease = v => 1 - Math.pow(1 - v, 3);
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;

  const loop = now => {
    const t = (now - t0) % OV_DUR;
    /* how many levels have grown out of the root, as a continuous number */
    const prog = t < 1500 ? 0
               : t < 2700 ? ease((t - 1500) / 1200)
               : t < 3600 ? 1
               : t < 4800 ? 1 + ease((t - 3600) / 1200)
               : 2;
    const rootIn = cl(t / 600);
    const fade = t > OV_DUR - 550 ? 1 - (t - (OV_DUR - 550)) / 550 : 1;

    const c = canvasSetup('cv-overview', 340);
    const { ctx, W, H } = c;

    const leaves = layoutTree(OV_TREE);
    /* the gutter keeps neighbouring boxes apart; the dot grid narrows with them */
    const boxW = Math.min(152, (W - 16) / leaves - 12);
    const boxH = 62, padX = boxW / 2 + 14, spanX = W - padX * 2;
    const per = boxW < 100 ? 5 : 7;
    const sp = Math.min(13, (boxW - 14) / (per - 1));
    const L = { boxW, boxH, sp, per, rowH: 11, r: Math.min(4.3, sp * 0.36),
                px: nd => padX + nd._x / (leaves - 1) * spanX,
                py: d  => 52 + d * 96 };

    (function drawNode(nd, parent) {
      const a = nd.depth === 0 ? rootIn : cl(prog - (nd.depth - 1));
      if (a <= 0) return;
      const x = L.px(nd), y = L.py(nd.depth);

      /* the edge down from the parent, drawn as it grows */
      if (parent) {
        const x0 = L.px(parent), y0 = L.py(parent.depth) + boxH;
        ctx.save(); ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x - x0) * a, y0 + (y - y0) * a);
        ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();
        if (a > 0.55) {
          ctx.save(); ctx.globalAlpha = fade * (a - 0.55) / 0.45;
          ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          haloText(ctx, parent.left === nd ? 'True' : 'False',
                   (x0 + x) / 2, (y0 + y) / 2, 'rgba(230,237,243,.55)');
          ctx.restore();
        }
      }

      /* the box — a pure group is tinted with its own class colour */
      const pure = nd.imp < 1e-9;
      ctx.save(); ctx.globalAlpha = fade * a;
      roundRect(ctx, x - boxW / 2, y, boxW, boxH, 8);
      ctx.fillStyle = pure ? hexA(CLR[nd.value], 0.11) : 'rgba(255,255,255,.035)';
      ctx.fill();
      ctx.strokeStyle = pure ? hexA(CLR[nd.value], 0.6) : 'rgba(230,237,243,.26)';
      ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();

      /* the question, or the class once the group cannot be split any further.
         Courier is ~6px per character at this size, so narrow boxes get the
         short form of the caption rather than text spilling over the edges. */
      const lab = nd.depth === 0 ? cl((t - 750) / 450) : cl((a - 0.5) * 2);
      if (lab > 0) {
        const room = boxW >= 110;
        const txt = nd.leaf
          ? (room ? nd.n + ' rows · class ' + nd.value : nd.n + ' · ' + nd.value)
          : ['X1', 'X2'][nd.f] + (room ? ' <= ' + nd.thr.toFixed(2) : '≤' + nd.thr.toFixed(1));
        ctx.save(); ctx.globalAlpha = fade * lab;
        ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        haloText(ctx, txt, x, y + 7, nd.leaf ? CLR[nd.value] : COL.accent);
        ctx.restore();
      }

      /* the group itself: one dot per row, flying out of the parent's group */
      for (let k = 0; k < nd._rows.length; k++) {
        const i = nd._rows[k];
        const to = ovSlot(nd, k, L);
        let dx = to.x, dy = to.y;
        if (parent) {
          const from = ovSlot(parent, parent._rows.indexOf(i), L);
          dx = from.x + (to.x - from.x) * a;
          dy = from.y + (to.y - from.y) * a;
        }
        /* on the root the dots drop in one after another, so you read it as rows */
        const alpha = nd.depth === 0 ? cl((t - 120 - k * 40) / 260) : a;
        if (alpha <= 0) continue;
        ctx.save(); ctx.globalAlpha = fade * alpha;
        ctx.beginPath(); ctx.arc(dx, dy, L.r, 0, Math.PI * 2);
        ctx.fillStyle = CLR[OV_Y[i]]; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = COL.surface; ctx.stroke();
        ctx.restore();
      }

      if (!nd.leaf) { drawNode(nd.left, nd); drawNode(nd.right, nd); }
    })(OV_TREE, null);

    /* the running commentary */
    const cap = t < 1500 ? ['one group', '13 rows, both classes mixed — gini 0.473']
              : t < 2700 ? ['question 1', 'X1 <= 4.00 sends 5 rows left, 8 rows right']
              : t < 3600 ? ['two groups', 'each half is already purer than the box above']
              : t < 4800 ? ['question 2', 'every group now gets its own next question']
              :            ['four groups', 'every group holds one class — the tree stops'];
    ctx.save(); ctx.globalAlpha = fade;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Courier New'; haloText(ctx, cap[0], 4, 4, COL.accent);
    ctx.font = '11px Courier New';      haloText(ctx, cap[1], 4, 22, 'rgba(230,237,243,.55)');
    /* legend */
    ctx.textBaseline = 'middle'; ctx.globalAlpha = fade * 0.85;
    ['A', 'B'].forEach((k, j) => {
      const lx = 6 + j * 84;
      ctx.beginPath(); ctx.arc(lx + 4, H - 12, 4, 0, Math.PI * 2);
      ctx.fillStyle = CLR[k]; ctx.fill();
      haloText(ctx, 'class ' + k, lx + 13, H - 12, 'rgba(230,237,243,.55)');
    });
    ctx.restore();

    ovRaf = requestAnimationFrame(loop);
  };
  ovRaf = requestAnimationFrame(loop);
}

/* draw each split of a fitted tree as a line, clipped to its own region */
function drawCuts(p, node, box) {
  const { ctx, sx, sy } = p;
  box = box || { x0: p.XMIN, x1: p.XMAX, y0: p.YMIN, y1: p.YMAX };
  if (node.leaf) return;
  ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = COL.text; ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (node.f === 0) { ctx.moveTo(sx(node.thr), sy(box.y0)); ctx.lineTo(sx(node.thr), sy(box.y1)); }
  else              { ctx.moveTo(sx(box.x0), sy(node.thr)); ctx.lineTo(sx(box.x1), sy(node.thr)); }
  ctx.stroke(); ctx.restore();
  const L = Object.assign({}, box), R = Object.assign({}, box);
  if (node.f === 0) { L.x1 = node.thr; R.x0 = node.thr; } else { L.y1 = node.thr; R.y0 = node.thr; }
  drawCuts(p, node.left, L); drawCuts(p, node.right, R);
}

/* ═══ PANEL 1: the idea ═══ */
function drawIdea() {
  const d = +$('id-d').value;
  $('id-dv').textContent = d;
  const t = fit(D6_X, D6_Y, { maxDepth: d });
  const leaves = countLeaves(t);
  const acc = accuracyOf(t, D6_X, D6_Y);
  const imps = impurityList(t);
  $('out-idea').textContent =
`max_depth = ${d}      leaves = ${leaves}      accuracy on these 6 rows = ${f3(acc)}
node impurities (gini) = [${imps.map(v => v.toFixed(3)).join(', ')}]
${d === 0 ? '--> no question asked yet: one group of 6, gini 0.500'
 : d >= treeDepth(fit(D6_X, D6_Y, {})) ? '--> every leaf is pure (gini 0) - the tree has nothing left to ask'
 : '--> still mixed: at least one leaf has both classes in it'}`;

  const render = () => {
    const p = plotSetup('cv-idea', 0, 7, 0, 4, 1, 1);
    if (d > 0) paintRegions(p, t, 0.15);
    axLabels(p, 'X1', 'X2');
    drawCuts(p, t);
    for (let i = 0; i < D6_X.length; i++) plotPoint(p, D6_X[i][0], D6_X[i][1], CLR[D6_Y[i]], null, 7);
    const { ctx } = p;
    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, leaves + (leaves === 1 ? ' region' : ' regions'), 14, 12, COL.accent);
    const tc = canvasSetup('cv-idea-tree');
    renderTree(tc, t, { names: ['X1', 'X2'], filled: true, maxDepth: d, showStats: false });
  };
  render();
}

let ideaTimer = null;
function growIdea() {
  if (ideaTimer) { clearInterval(ideaTimer); ideaTimer = null; }
  let d = 0;
  $('id-d').value = 0; drawIdea();
  ideaTimer = setInterval(() => {
    d++; $('id-d').value = d; drawIdea();
    if (d >= 4) { clearInterval(ideaTimer); ideaTimer = null; }
  }, 700);
}

/* ═══ PANEL 2: anatomy ═══ */
let anMode = 0;   // 0 depth, 1 height, 2 subtree
function setAn(m) {
  anMode = m;
  [...$('an-seg').children].forEach((b, i) => b.classList.toggle('on', i === m));
  drawAnatomy();
}
/* a hand-made 3-level tree, purely for the vocabulary */
const AN = (function () {
  const leaf = (name) => ({ leaf: true, name });
  return {
    name: 'Root', leaf: false,
    left:  { name: 'Decision', leaf: false, left: leaf('Leaf'), right: leaf('Leaf') },
    right: { name: 'Decision', leaf: false,
             left: { name: 'Decision', leaf: false, left: leaf('Leaf'), right: leaf('Leaf') },
             right: leaf('Leaf') }
  };
})();
function anWalk(nd, d, out) {
  out = out || [];
  nd._d = d; out.push(nd);
  if (!nd.leaf) { anWalk(nd.left, d + 1, out); anWalk(nd.right, d + 1, out); }
  return out;
}
function anHeight(nd) { return nd.leaf ? 0 : 1 + Math.max(anHeight(nd.left), anHeight(nd.right)); }

function drawAnatomy() {
  const sel = +$('an-d').value;
  $('an-dv').textContent = sel < 0 ? 'all' : sel;
  const nodes = anWalk(AN, 0);
  const maxD = Math.max(...nodes.map(n => n._d));
  /* subtree mode highlights the right-hand decision node and everything under it */
  const subRoot = AN.right;
  const subSet = anWalk(subRoot, 0).slice();
  $('out-anatomy').textContent =
anMode === 0
? `DEPTH — counted downwards from the root
root depth = 0     deepest leaf depth = ${maxD}
${sel < 0 ? 'move the slider to light up one level at a time' : 'highlighted: every node at depth ' + sel + ' (' + nodes.filter(n => n._d === sel).length + ' nodes)'}
clf.get_depth() would return ${maxD}`
: anMode === 1
? `HEIGHT — counted upwards from the leaves
every leaf has height 0        the root has height ${anHeight(AN)}
${sel < 0 ? 'move the slider to light up all nodes of one height' : 'highlighted: every node of height ' + sel}
height and depth run in opposite directions - that is the whole difference`
: `SUBTREE — a node plus everything below it
the highlighted node and its ${subSet.length - 1} descendants form a subtree
a subtree is itself a perfectly valid decision tree
pruning means replacing one of these with a single leaf`;

  const c = canvasSetup('cv-anatomy');
  const { ctx, W, H } = c;
  /* layout: leaves evenly spread, parents centred */
  let nx = 0;
  (function lay(nd) { if (nd.leaf) { nd._x = nx++; return; } lay(nd.left); lay(nd.right); nd._x = (nd.left._x + nd.right._x) / 2; })(AN);
  const leaves = nx;
  const boxW = Math.min(108, (W - 40) / leaves), boxH = 30;
  const padX = boxW / 2 + 14, spanX = W - padX * 2;
  const stepY = (H - boxH - 30) / maxD;
  const px = nd => padX + nd._x / (leaves - 1) * spanX;
  const py = nd => 16 + nd._d * stepY;

  const lit = nd => {
    if (anMode === 2) return subSet.includes(nd);
    if (sel < 0) return true;
    return anMode === 0 ? nd._d === sel : anHeight(nd) === sel;
  };

  for (const nd of nodes) {
    if (nd.leaf) continue;
    for (const ch of [nd.left, nd.right]) {
      const on = lit(nd) && lit(ch);
      ctx.save(); ctx.beginPath();
      ctx.moveTo(px(nd), py(nd) + boxH); ctx.lineTo(px(ch), py(ch));
      ctx.strokeStyle = on ? COL.accent : 'rgba(230,237,243,.22)';
      ctx.lineWidth = on ? 2.4 : 1.3; ctx.stroke(); ctx.restore();
    }
  }
  for (const nd of nodes) {
    const on = lit(nd);
    const isRoot = nd === AN;
    const base = isRoot ? COL.orange : nd.leaf ? COL.blue : COL.green;
    ctx.save();
    roundRect(ctx, px(nd) - boxW / 2, py(nd), boxW, boxH, nd.leaf ? 14 : 7);
    ctx.fillStyle = hexA(base, on ? 0.26 : 0.07); ctx.fill();
    ctx.strokeStyle = on ? base : 'rgba(230,237,243,.18)'; ctx.lineWidth = on ? 2 : 1.2; ctx.stroke();
    ctx.restore();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, nd.name, px(nd), py(nd) + boxH / 2 - 5, on ? COL.text : 'rgba(230,237,243,.35)');
    ctx.font = '8px Courier New';
    const tag = anMode === 1 ? 'h=' + anHeight(nd) : 'd=' + nd._d;
    haloText(ctx, tag, px(nd), py(nd) + boxH / 2 + 7, on ? base : 'rgba(230,237,243,.28)');
  }
  /* the edge label, once */
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'each line is an EDGE', 12, H - 16, 'rgba(230,237,243,.35)');
}

/* ═══ PANEL 3: gini impurity ═══ */
/* the still picture that comes before the formula: the same ten rows, three
   ways, so "impurity" means something before it is given a number */
const PURE_CASES = [
  { pat: 'AAAAAAAAAA', title: 'one class only', wide: 'pure — every row is an A',      narrow: 'pure' },
  { pat: 'AABAAABAAB', title: 'mostly one class', wide: 'mixed — a few B among the A', narrow: 'mixed' },
  { pat: 'ABABBAABAB', title: 'half and half',  wide: 'a coin flip — no idea',         narrow: '50 / 50' }
];
function drawPure() {
  const c = canvasSetup('cv-pure', 230);
  const { ctx, W, H } = c;
  const gap = 12, boxW = (W - gap * 4) / 3, boxH = 112, boxY = 26;
  const sp = Math.min(24, (boxW - 26) / 4), r = Math.min(9, sp * 0.4);

  PURE_CASES.forEach((cs, j) => {
    const x = gap + j * (boxW + gap), cx = x + boxW / 2;
    const pureBox = j === 0;
    /* the basket */
    ctx.save();
    roundRect(ctx, x, boxY, boxW, boxH, 10);
    ctx.fillStyle = pureBox ? hexA(CLR.A, 0.09) : 'rgba(255,255,255,.035)';
    ctx.fill();
    ctx.strokeStyle = pureBox ? hexA(CLR.A, 0.55) : 'rgba(230,237,243,.24)';
    ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    /* what to call it */
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, cs.title, cx, boxY + 10, pureBox ? CLR.A : COL.text);
    /* the ten rows, two rows of five */
    for (let i = 0; i < 10; i++) {
      const dx = cx + (i % 5 - 2) * sp, dy = boxY + 48 + Math.floor(i / 5) * (r * 2 + 8);
      ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fillStyle = CLR[cs.pat[i]]; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = COL.surface; ctx.stroke();
    }
    /* the count, then the plain-language verdict */
    const nA = cs.pat.split('').filter(ch => ch === 'A').length;
    ctx.font = 'bold 10px Courier New';
    haloText(ctx, nA + ' A  ·  ' + (10 - nA) + ' B', cx, boxY + boxH + 8, 'rgba(230,237,243,.62)');
    ctx.font = '10px Courier New';
    haloText(ctx, boxW > 170 ? cs.wide : cs.narrow, cx, boxY + boxH + 23, 'rgba(230,237,243,.42)');
  });

  /* the scale underneath: pure on the left, hopelessly mixed on the right */
  const ay = H - 26, ax0 = gap + 4, ax1 = W - gap - 4;
  const grad = ctx.createLinearGradient(ax0, 0, ax1, 0);
  grad.addColorStop(0, CLR.A); grad.addColorStop(1, COL.orange);
  ctx.save(); ctx.strokeStyle = grad; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1 - 7, ay); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 9, ay - 5); ctx.lineTo(ax1 - 9, ay + 5);
  ctx.fillStyle = COL.orange; ctx.fill(); ctx.restore();
  ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top';
  ctx.textAlign = 'left';  haloText(ctx, 'pure', ax0, ay + 7, CLR.A);
  ctx.textAlign = 'right'; haloText(ctx, 'completely mixed', ax1, ay + 7, COL.orange);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = 'bold 11px Courier New';
  haloText(ctx, 'ten rows, three ways', gap + 2, 4, COL.accent);
}

function drawGini() {
  drawPure();                       // the still picture above the formula
  const a = +$('gi-a').value;
  $('gi-av').textContent = a;
  const b = 10 - a, p1 = a / 10, p2 = b / 10;
  const g = 1 - (p1 * p1 + p2 * p2);
  $('out-gini').textContent =
`node: A: ${a}   B: ${b}    (10 rows)
G(Q) = 1 - [(${a}/10)^2 + (${b}/10)^2] = 1 - [${(p1 * p1).toFixed(2)} + ${(p2 * p2).toFixed(2)}] = ${f3(g)}
${g === 0 ? '--> PURE. Nothing left to split, this becomes a leaf.'
 : g >= 0.5 - 1e-9 ? '--> the worst case for two classes: a perfect 50/50 coin flip.'
 : '--> mixed, but leaning ' + (a > b ? 'A' : 'B') + '.'}`;

  animate('gini', 420, t => {
    const p = plotSetup('cv-gini', -0.06, 1.06, -0.04, 0.82, 0.1, 0.1);
    axLabels(p, 'share of class A', 'G(Q)');
    const { ctx, sx, sy } = p;
    /* the two-class Gini curve */
    ctx.save(); ctx.strokeStyle = COL.green; ctx.lineWidth = 3; ctx.beginPath();
    const N = 120, lim = N * t;
    for (let i = 0; i <= N; i++) {
      if (i > lim) break;
      const x = i / N, yv = 1 - (x * x + (1 - x) * (1 - x));
      if (i === 0) ctx.moveTo(sx(x), sy(yv)); else ctx.lineTo(sx(x), sy(yv));
    }
    ctx.stroke(); ctx.restore();
    /* the ten balls — kept clear of the G(Q) axis label above them */
    for (let i = 0; i < 10; i++) {
      const cx = sx(0.06 + i * 0.098), cy = sy(0.69);
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < a ? CLR.A : CLR.B; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = COL.surface; ctx.stroke();
    }
    plotQuery(p, p1, g, COL.accent, 'G = ' + f3(g), 6, 10);
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'the node: ' + a + ' A  ·  ' + b + ' B', 14, 26, 'rgba(230,237,243,.5)');
  });
}

/* ═══ PANEL 4: weighted gini & gain ═══ */
let gnF = 0;
function setGnF(f) {
  gnF = f;
  [...$('gn-seg').children].forEach((b, i) => b.classList.toggle('on', i === f));
  const s = $('gn-t');
  if (f === 0) { s.min = 0.5; s.max = 6.5; if (+s.value > 6.5) s.value = 3.5; }
  else         { s.min = 0.5; s.max = 3.5; if (+s.value > 3.5) s.value = 1.5; }
  drawGain();
}
/* the still picture that comes before the two formulas: one question on the six
   rows from class, with each level of the tree carrying a single score. The
   point is that a level's score is the weighted average of its boxes, and the
   gain is just the drop from one level to the next. */
/* eight rows, four of each class, split 5 | 3 by the question */
const WG_X = [1, 2, 3, 4, 5, 6, 7, 8];
const WG_Y = ['A', 'A', 'B', 'A', 'B', 'B', 'A', 'B'];
const WG_THR = 5.5;
const WG_ALL = WG_X.map((_, i) => i);
const WG_L = WG_ALL.filter(i => WG_X[i] <= WG_THR);   // 5 rows: 3 A, 2 B
const WG_R = WG_ALL.filter(i => WG_X[i] >  WG_THR);   // 3 rows: 1 A, 2 B
function wgBox(ctx, x, y, w, h, accent) {
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = accent ? hexA(accent, 0.07) : 'rgba(255,255,255,.04)';
  ctx.fill();
  ctx.strokeStyle = accent ? hexA(accent, 0.5) : 'rgba(230,237,243,.26)';
  ctx.lineWidth = 1.4; ctx.stroke();
}
/* the rows a node holds, drawn as one line of dots that fits the box it is in */
function wgDots(ctx, idx, cx, cy, boxW, r) {
  const sorted = idx.slice().sort((a, b) => WG_Y[a] < WG_Y[b] ? -1 : WG_Y[a] > WG_Y[b] ? 1 : 0);
  const sp = Math.min(15, (boxW - 22) / Math.max(1, sorted.length - 1));
  sorted.forEach((i, k) => {
    ctx.beginPath();
    ctx.arc(cx + (k - (sorted.length - 1) / 2) * sp, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = CLR[WG_Y[i]]; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = COL.surface; ctx.stroke();
  });
}
function wgA(idx) { return idx.filter(i => WG_Y[i] === 'A').length; }
function wgCounts(idx, wide) {
  return (wide ? idx.length + ' rows · ' : '') + wgA(idx) + ' A · ' + (idx.length - wgA(idx)) + ' B';
}
function drawWeighted() {
  const c = canvasSetup('cv-weighted', 300);
  const { ctx, W } = c;
  const gP = impurityOf(WG_ALL, WG_Y, 'gini');
  const gL = impurityOf(WG_L, WG_Y, 'gini'), gR = impurityOf(WG_R, WG_Y, 'gini');
  const wL = WG_L.length / WG_ALL.length, wR = WG_R.length / WG_ALL.length;
  const gS = wL * gL + wR * gR;

  const treeW = W * 0.6, scoreX = treeW + 12, detail = W > 540;
  const band = (y, h, label) => {
    ctx.save();
    roundRect(ctx, 8, y, W - 16, h, 10);
    ctx.fillStyle = 'rgba(255,255,255,.022)'; ctx.fill();
    ctx.strokeStyle = 'rgba(230,237,243,.09)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, label, 16, y + 6, 'rgba(230,237,243,.4)');
  };
  /* the divider that separates the tree from the score of its level */
  ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(230,237,243,.16)';
  ctx.beginPath(); ctx.moveTo(scoreX - 10, 26); ctx.lineTo(scoreX - 10, 272); ctx.stroke(); ctx.restore();

  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, WG_ALL.length + ' rows · one question · X1 <= ' + WG_THR, 10, 4, COL.accent);

  /* ── level 0: the parent ── */
  /* the band labels stay short: the edges below cross the space a longer one
     would need, so the "before / after" wording lives in the score column */
  band(26, 96, 'LEVEL 0');
  const pW = Math.min(190, treeW * 0.5), pX = 8 + treeW / 2, pY = 44;
  const pWide = pW > 108;
  wgBox(ctx, pX - pW / 2, pY, pW, 74);
  ctx.textAlign = 'center';
  ctx.font = 'bold 10px Courier New';
  haloText(ctx, 'X1 <= ' + WG_THR, pX, pY + 8, COL.accent);
  ctx.font = '9px Courier New';
  haloText(ctx, wgCounts(WG_ALL, pWide), pX, pY + 24, 'rgba(230,237,243,.55)');
  wgDots(ctx, WG_ALL, pX, pY + 54, pW, 5);

  /* ── level 1: the two children, and the weight on each edge ── */
  band(176, 96, 'LEVEL 1');
  const cW = Math.min(152, treeW * 0.42), cY = 194;
  const cWide = cW > 108;
  [[WG_L, 0.27, gL, 'True'], [WG_R, 0.73, gR, 'False']].forEach(([idx, at, g, edge]) => {
    const cx = 8 + treeW * at;
    /* the edge, carrying the weight — the whole reason the average is weighted */
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pX, pY + 74); ctx.lineTo(cx, cY);
    ctx.strokeStyle = 'rgba(230,237,243,.3)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
    const mx = (pX + cx) / 2, my = (pY + 74 + cY) / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px Courier New';
    haloText(ctx, edge, mx, my - 9, 'rgba(230,237,243,.45)');
    /* the two edge labels close in on each other as the tree area narrows */
    haloText(ctx, treeW > 330 ? idx.length + ' of ' + WG_ALL.length + ' rows'
                              : idx.length + '/' + WG_ALL.length, mx, my + 8, COL.accent);

    wgBox(ctx, cx - cW / 2, cY, cW, 74);
    ctx.textBaseline = 'top';
    ctx.font = '9px Courier New';
    haloText(ctx, wgCounts(idx, cWide), cx, cY + 8, 'rgba(230,237,243,.55)');
    wgDots(ctx, idx, cx, cY + 34, cW, 5);
    ctx.font = 'bold 10px Courier New';
    haloText(ctx, 'G = ' + f3(g), cx, cY + 52, COL.green);
  });

  /* ── the score column: one number per level, and the drop between them ── */
  const sx0 = scoreX;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = '9px Courier New';
  haloText(ctx, 'G(parent) — before the question', sx0, 46, 'rgba(230,237,243,.45)');
  ctx.font = 'bold 22px Courier New';
  haloText(ctx, f3(gP), sx0, 60, COL.text);
  if (detail) {
    ctx.font = '9px Courier New';
    haloText(ctx, '1 - [(' + wgA(WG_ALL) + '/8)² + (' + (WG_ALL.length - wgA(WG_ALL)) + '/8)²]',
             sx0, 90, 'rgba(230,237,243,.38)');
  }

  ctx.font = '9px Courier New';
  haloText(ctx, 'G(split) — after the question', sx0, 196, 'rgba(230,237,243,.45)');
  ctx.font = 'bold 22px Courier New';
  haloText(ctx, f3(gS), sx0, 210, COL.green);
  if (detail) {
    ctx.font = '9px Courier New';
    haloText(ctx, WG_L.length + '/' + WG_ALL.length + ' × ' + f3(gL) + ' + '
                + WG_R.length + '/' + WG_ALL.length + ' × ' + f3(gR),
             sx0, 240, 'rgba(230,237,243,.38)');
  }

  /* the arrow from one level's score to the next: that drop is the gain */
  const ay0 = 128, ay1 = 172, ax = sx0 + 8;
  ctx.save(); ctx.strokeStyle = hexA(COL.accent, 0.6); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay1 - 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, ay1); ctx.lineTo(ax - 5, ay1 - 9); ctx.lineTo(ax + 5, ay1 - 9);
  ctx.fillStyle = COL.accent; ctx.fill(); ctx.restore();
  ctx.font = '10px Courier New';
  haloText(ctx, 'gain = ' + f3(gP) + ' - ' + f3(gS), ax + 12, 130, 'rgba(230,237,243,.55)');
  ctx.font = 'bold 15px Courier New';
  haloText(ctx, '= ' + f3(gP - gS), ax + 12, 146, COL.accent);

  ctx.font = '10px Courier New'; ctx.textAlign = 'left';
  haloText(ctx, 'the level dropped ' + f3(gP - gS) + ' of impurity — that drop is the gain',
           10, 280, 'rgba(230,237,243,.42)');
}

function drawGain() {
  drawWeighted();                   // the still picture above the formulas
  const thr = +$('gn-t').value;
  $('gn-tv').textContent = thr.toFixed(1);
  const idx = [0, 1, 2, 3, 4, 5];
  const L = idx.filter(i => D6_X[i][gnF] <= thr), R = idx.filter(i => D6_X[i][gnF] > thr);
  const cL = countOf(L.map(i => D6_Y[i])), cR = countOf(R.map(i => D6_Y[i]));
  const gL = giniOf(cL, L.length), gR = giniOf(cR, R.length);
  const w = L.length / 6 * gL + R.length / 6 * gR;
  const gain = 0.5 - w;
  const nm = gnF === 0 ? 'X1' : 'X2';
  const show = c => 'A:' + (c.A || 0) + ' B:' + (c.B || 0);
  $('out-gain').textContent =
`question: ${nm} <= ${thr.toFixed(1)}          parent: A:3 B:3   G = 0.500

TRUE  (${L.length} rows)  ${show(cL)}   G = ${f3(gL)}
FALSE (${R.length} rows)  ${show(cR)}   G = ${f3(gR)}

weighted = (${L.length}/6)(${f3(gL)}) + (${R.length}/6)(${f3(gR)}) = ${f3(w)}
gain     = 0.500 - ${f3(w)} = ${f3(gain)}
--> ${gain < 1e-9 ? 'USELESS question: the children are exactly as mixed as the parent'
   : gain >= 0.249 ? 'the BEST split available on this data'
   : 'it helps a little, but there is a better question'}`;

  const render = () => {
    const p = plotSetup('cv-gain', 0, 7, 0, 4, 1, 1);
    const { ctx, sx, sy } = p;
    /* shade the two sides */
    ctx.save();
    if (gnF === 0) {
      ctx.fillStyle = 'rgba(59,130,246,.07)'; ctx.fillRect(0, 0, sx(thr), p.H);
      ctx.fillStyle = 'rgba(236,72,153,.07)'; ctx.fillRect(sx(thr), 0, p.W - sx(thr), p.H);
    } else {
      ctx.fillStyle = 'rgba(59,130,246,.07)'; ctx.fillRect(0, sy(thr), p.W, p.H - sy(thr));
      ctx.fillStyle = 'rgba(236,72,153,.07)'; ctx.fillRect(0, 0, p.W, sy(thr));
    }
    ctx.restore();
    axLabels(p, 'X1', 'X2');
    ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = COL.text; ctx.lineWidth = 2.6;
    ctx.beginPath();
    if (gnF === 0) { ctx.moveTo(sx(thr), 0); ctx.lineTo(sx(thr), p.H); }
    else           { ctx.moveTo(0, sy(thr)); ctx.lineTo(p.W, sy(thr)); }
    ctx.stroke(); ctx.restore();
    for (let i = 0; i < 6; i++) plotPoint(p, D6_X[i][0], D6_X[i][1], CLR[D6_Y[i]], null, 7);
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'TRUE  G = ' + f3(gL), 14, 12, COL.blue);
    haloText(ctx, 'FALSE G = ' + f3(gR), 14, 28, COL.pink);
    ctx.font = 'bold 13px Courier New';
    haloText(ctx, 'gain = ' + f3(gain), 14, 48, gain >= 0.249 ? COL.green : gain < 1e-9 ? COL.red : COL.accent);
  };
  render();
}

/* ═══ PANEL 5: the split search ═══ */
const SCAN = (function () {
  const { splits } = allSplits(D6_X, D6_Y, [0, 1, 2, 3, 4, 5], 'gini');
  return splits;
})();
function drawScan() {
  const sel = +$('sc-i').value;
  const all = sel >= SCAN.length;
  $('sc-iv').textContent = all ? 'all' : (sel + 1) + ' / ' + SCAN.length;
  const best = SCAN.reduce((a, b) => b.gain > a.gain + 1e-12 ? b : a);
  const shown = all ? SCAN.length : sel + 1;
  const cur = SCAN[Math.min(sel, SCAN.length - 1)];
  const bestSoFar = SCAN.slice(0, shown).reduce((a, b) => b.gain > a.gain + 1e-12 ? b : a);
  const nm = s => (s.f === 0 ? 'X1' : 'X2') + ' <= ' + s.thr.toFixed(1);
  $('out-scan').textContent =
`parent gini = 0.500      candidates = ${SCAN.length}   (5 on X1, 2 on X2)
${all ? 'showing all candidates' : 'testing candidate ' + (sel + 1) + ': ' + nm(cur) + '   gain = ' + f3(cur.gain)}
best so far : ${nm(bestSoFar)}   gain = ${f3(bestSoFar.gain)}
${all ? '--> X1 <= 2.5 and X2 <= 1.5 TIE at 0.250. sklearn breaks the tie with random_state.' : ''}`;

  animate('scan', 380, t => {
    const c = canvasSetup('cv-scan');
    const { ctx, W, H } = c;
    const n = SCAN.length;
    const padL = 92, padR = 18, padT = 26, padB = 30;
    const bw = (W - padL - padR) / n;
    const maxG = 0.26;
    const yOf = g => H - padB - (g / maxG) * (H - padT - padB);
    /* axis */
    ctx.save(); ctx.strokeStyle = 'rgba(230,237,243,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL - 6, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
    ctx.restore();
    ctx.font = '9px Courier New'; ctx.fillStyle = COL.tick; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const g of [0, 0.05, 0.1, 0.15, 0.2, 0.25]) {
      ctx.fillText(g.toFixed(2), padL - 10, yOf(g));
      ctx.save(); ctx.strokeStyle = COL.grid; ctx.beginPath();
      ctx.moveTo(padL - 6, yOf(g)); ctx.lineTo(W - padR, yOf(g)); ctx.stroke(); ctx.restore();
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 10px Courier New';
    haloText(ctx, 'gini gain', 8, 8, 'rgba(230,237,243,.5)');

    SCAN.forEach((s, i) => {
      const on = i < shown;
      const isBest = Math.abs(s.gain - best.gain) < 1e-12;
      const h = on ? (H - padB - yOf(s.gain)) * t : 0;
      const x = padL + i * bw + bw * 0.16, wdt = bw * 0.68;
      ctx.save();
      roundRect(ctx, x, H - padB - h, wdt, Math.max(1, h), 4);
      ctx.fillStyle = !on ? 'rgba(255,255,255,.05)'
                    : isBest ? hexA(COL.green, .55) : hexA(COL.blue, .4);
      ctx.fill();
      ctx.strokeStyle = !on ? 'rgba(255,255,255,.09)' : isBest ? COL.green : 'rgba(59,130,246,.7)';
      ctx.lineWidth = isBest && on ? 2 : 1; ctx.stroke();
      ctx.restore();
      ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      haloText(ctx, (s.f === 0 ? 'X1' : 'X2') + '≤' + s.thr.toFixed(1), x + wdt / 2, H - padB + 6,
               on ? 'rgba(230,237,243,.6)' : 'rgba(230,237,243,.22)');
      if (on && h > 14) {
        ctx.textBaseline = 'bottom'; ctx.font = 'bold 9px Courier New';
        haloText(ctx, s.gain.toFixed(3), x + wdt / 2, H - padB - h - 3, isBest ? COL.green : 'rgba(230,237,243,.65)');
      }
    });
  });
}

let scanTimer = null;
function runScan() {
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  let i = 0;
  $('sc-i').value = 0; drawScan();
  scanTimer = setInterval(() => {
    i++; $('sc-i').value = Math.min(i, SCAN.length); drawScan();
    if (i >= SCAN.length) { clearInterval(scanTimer); scanTimer = null; }
  }, 460);
}

/* ═══ PANEL 6: train / test ═══ */
function shuffledIdx(seed) {
  const a = [0, 1, 2, 3, 4, 5, 6, 7], rnd = mulberry32(seed * 7919 + 13);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function drawTT() {
  const nTest = +$('ts-n').value, seed = +$('ts-r').value;
  $('ts-nv').textContent = (nTest / 8).toFixed(2) + ' · ' + nTest + ' rows';
  $('ts-rv').textContent = seed;
  const order = shuffledIdx(seed);
  const test = order.slice(0, nTest), train = order.slice(nTest);
  const t = fit(train.map(i => D8_X[i]), train.map(i => D8_Y[i]), {});
  const trAcc = accuracyOf(t, train.map(i => D8_X[i]), train.map(i => D8_Y[i]));
  const teAcc = accuracyOf(t, test.map(i => D8_X[i]), test.map(i => D8_Y[i]));
  $('out-tt').textContent =
`test_size = ${(nTest / 8).toFixed(2)}   ->   ${8 - nTest} train rows, ${nTest} test rows
train rows: ${train.map(i => '[' + D8_X[i] + ']->' + D8_Y[i]).join('  ')}
test  rows: ${test.map(i => '[' + D8_X[i] + ']->' + D8_Y[i]).join('  ')}

train accuracy = ${f3(trAcc)}      <- always 1.000, the tree memorized them
test  accuracy = ${f3(teAcc)}      <- the only number that means anything
tree: ${countLeaves(t)} leaves, depth ${treeDepth(t)}`;

  const p = plotSetup('cv-tt', 0, 9, 0, 9, 1, 1);
  paintRegions(p, t, 0.13);
  axLabels(p, 'X1', 'X2');
  drawCuts(p, t);
  for (const i of train) plotPoint(p, D8_X[i][0], D8_X[i][1], CLR[D8_Y[i]], null, 7);
  for (const i of test) {
    plotPoint(p, D8_X[i][0], D8_X[i][1], CLR[D8_Y[i]], null, 8, true);
    const ok = String(predictOne(t, D8_X[i])) === String(D8_Y[i]);
    const { ctx, sx, sy } = p;
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    haloText(ctx, ok ? '✓' : '✗', sx(D8_X[i][0]) + 10, sy(D8_X[i][1]) - 8, ok ? COL.green : COL.red);
  }
  const { ctx } = p;
  ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'train ' + f3(trAcc) + '   test ' + f3(teAcc), 14, 12,
           teAcc >= 0.999 ? COL.green : teAcc >= 0.5 ? COL.accent : COL.red);
}

/* ═══ PANEL 7: the fitted tree from class ═══ */
const DW_TREE = fit(DW_X, DW_Y, {});
function drawTreeDemo() {
  const qx = +$('tr-x').value, qy = +$('tr-y').value;
  $('tr-xv').textContent = qx; $('tr-yv').textContent = qy;
  const path = pathOf(DW_TREE, [qx, qy]);
  const pred = predictOne(DW_TREE, [qx, qy]);
  const steps = [];
  for (let i = 0; i < path.length - 1; i++) {
    const nd = path[i], nm = ['weight', 'height'][nd.f];
    const v = [qx, qy][nd.f];
    const went = v <= nd.thr;
    steps.push(`  ${nm} = ${v}  <=  ${nd.thr.toFixed(2)} ?  ${went ? 'TRUE  -> go left' : 'FALSE -> go right'}`);
  }
  $('out-tree').textContent =
`new sample: weight = ${qx}, height = ${qy}

${steps.join('\n')}
  leaf: ${JSON.stringify(path[path.length - 1].counts)}  ->  predict ${pred}

export_text of this tree:
${exportText(DW_TREE, ['weight', 'height'], ['A', 'B']).replace(/\n$/, '')}
clf.tree_.impurity = [${impurityList(DW_TREE).map(v => v.toFixed(3)).join(', ')}]`;

  const c = canvasSetup('cv-tree');
  renderTree(c, DW_TREE, { names: ['weight', 'height'], highlight: path, filled: true });
  const { ctx, W } = c;
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  haloText(ctx, 'predict -> ' + pred, W - 10, 8, CLR[pred]);
}

/* ═══ PANEL 8: regression ═══ */
/* the still picture that opens the slide: the same depth-2 tree the code block
   below fits, drawn as a tree with mse in place of gini */
const RG_TREE = fit(RX, RY, { criterion: 'mse', maxDepth: 2 });
function drawReg() {
  renderTree(canvasSetup('cv-regtree'), RG_TREE, { names: ['x'], filled: true });
}

/* ═══ PANEL 9: overfitting & pruning ═══ */
/* The true rule is a single clean corner block — exactly what a depth-2 tree
   can express — and then 20% of the labels are flipped. Anything deeper than
   depth 2 is therefore fitting pure noise, which is the point of the demo. */
const NOISY = (function () {
  const rnd = mulberry32(7);
  const X = [], y = [], isTest = [];
  for (let i = 0; i < 220; i++) {
    const x1 = rnd() * 10, x2 = rnd() * 10;
    let lab = (x1 < 5 && x2 < 5) ? 'A' : 'B';
    if (rnd() < 0.20) lab = lab === 'A' ? 'B' : 'A';
    X.push([x1, x2]); y.push(lab); isTest.push(rnd() < 0.35);
  }
  return { X, y, isTest };
})();
function drawPrune() {
  const d = +$('pr-d').value, ml = +$('pr-l').value;
  $('pr-dv').textContent = d; $('pr-lv').textContent = ml;
  const tr = [], te = [];
  NOISY.isTest.forEach((t, i) => (t ? te : tr).push(i));
  const t = fit(tr.map(i => NOISY.X[i]), tr.map(i => NOISY.y[i]), { maxDepth: d, minLeaf: ml });
  const trAcc = accuracyOf(t, NOISY.X, NOISY.y, tr);
  const teAcc = accuracyOf(t, NOISY.X, NOISY.y, te);
  const gap = trAcc - teAcc;
  $('out-prune').textContent =
`DecisionTreeClassifier(max_depth=${d}, min_samples_leaf=${ml})
${tr.length} train rows, ${te.length} test rows
the true rule is just "x1 < 5 AND x2 < 5", but 20% of the labels are flipped
--> a depth-2 tree is already all the tree this data can support

leaves = ${countLeaves(t)}      actual depth = ${treeDepth(t)}
train accuracy = ${f3(trAcc)}
test  accuracy = ${f3(teAcc)}
gap            = ${f3(gap)}   ${gap > 0.20 ? '<-- OVERFITTING: the extra depth is memorizing noise'
                                : countLeaves(t) <= 2 && teAcc < 0.70 ? '<-- underfitting: one question is not enough'
                                : '<-- healthy'}`;

  const p = plotSetup('cv-prune', 0, 10, 0, 10, 2, 2);
  paintRegions(p, t, 0.16);
  axLabels(p, 'X1', 'X2');
  for (const i of tr) plotPoint(p, NOISY.X[i][0], NOISY.X[i][1], CLR[NOISY.y[i]], null, 4);
  for (const i of te) plotPoint(p, NOISY.X[i][0], NOISY.X[i][1], CLR[NOISY.y[i]], null, 5, true);
  const { ctx } = p;
  ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'train ' + f3(trAcc) + '   test ' + f3(teAcc), 14, 12,
           gap > 0.15 ? COL.red : COL.green);
  haloText(ctx, countLeaves(t) + ' leaves', 14, 30, 'rgba(230,237,243,.5)');
}

/* ═══ PANEL 12: entropy vs gini ═══ */
let enMode = 0;
function setEn(m) {
  enMode = m;
  [...$('en-seg').children].forEach((b, i) => b.classList.toggle('on', i === m));
  drawEnt();
}
function drawEnt() {
  const pv = +$('en-p').value / 100;
  $('en-pv').textContent = pv.toFixed(2);
  const g = 1 - (pv * pv + (1 - pv) * (1 - pv));
  const h = (pv <= 0 || pv >= 1) ? 0 : -(pv * Math.log2(pv) + (1 - pv) * Math.log2(1 - pv));
  const scale = enMode ? 0.5 : 1;
  $('out-ent').textContent =
`share of class A = ${pv.toFixed(2)}       share of class B = ${(1 - pv).toFixed(2)}

Gini    = 1 - [${(pv * pv).toFixed(3)} + ${((1 - pv) * (1 - pv)).toFixed(3)}] = ${f4(g)}
Entropy = -[${pv.toFixed(2)}*log2(${pv.toFixed(2)}) + ${(1 - pv).toFixed(2)}*log2(${(1 - pv).toFixed(2)})] = ${f4(h)}
${enMode ? 'entropy/2 = ' + f4(h / 2) + '   <- almost exactly the Gini curve' : ''}
--> both are 0 at the ends and largest at 0.50; they rank splits almost identically`;

  animate('ent', 400, t => {
    const p = plotSetup('cv-ent', -0.06, 1.06, -0.05, 1.1, 0.1, 0.2);
    axLabels(p, 'share of class A', enMode ? 'impurity (entropy halved)' : 'impurity');
    const { ctx, sx, sy } = p;
    const curve = (fn, col, wid) => {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.beginPath();
      const N = 160;
      for (let i = 0; i <= N * t; i++) {
        const x = i / N, yv = fn(x);
        if (i === 0) ctx.moveTo(sx(x), sy(yv)); else ctx.lineTo(sx(x), sy(yv));
      }
      ctx.stroke(); ctx.restore();
    };
    curve(x => (x <= 0 || x >= 1) ? 0 : -(x * Math.log2(x) + (1 - x) * Math.log2(1 - x)) * scale, COL.purple, 3);
    curve(x => 1 - (x * x + (1 - x) * (1 - x)), COL.green, 3);
    plotQuery(p, pv, g, COL.green, 'gini ' + f3(g), 5, 8);
    plotQuery(p, pv, h * scale, COL.purple, 'H ' + f3(h), 5, 8);
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, enMode ? 'entropy halved sits on top of gini' : 'entropy peaks at 1.0, gini at 0.5',
             14, 12, 'rgba(230,237,243,.5)');
  });
}

/* ═══ PANEL 13: drawing the tree ═══ */
let dwFilled = 0;
function setDw(m) {
  dwFilled = m;
  [...$('dw-seg').children].forEach((b, i) => b.classList.toggle('on', i === m));
  drawDraw();
}
function drawDraw() {
  const d = +$('dw-d').value;
  $('dw-dv').textContent = d;
  $('out-draw').textContent =
`plot_tree(clf, feature_names=['weight','height'], class_names=clf.classes_,
          filled=${dwFilled ? 'False' : 'True'}, rounded=True, max_depth=${d})

each box holds:  the question  ·  gini  ·  samples  ·  value (count per class)  ·  class
tree: ${countLeaves(DW_TREE)} leaves, depth ${treeDepth(DW_TREE)}
${d < treeDepth(DW_TREE) ? '--> max_depth=' + d + ' hides the levels below; those boxes are drawn as leaves'
 : '--> the whole tree fits on screen'}`;

  const c = canvasSetup('cv-draw');
  renderTree(c, DW_TREE, { names: ['weight', 'height'], filled: dwFilled === 0, maxDepth: d });
}

/* ══════════ boot ══════════ */
updateDots();
setTimeout(drawOverview, 90);

window.addEventListener('resize', () => {
  const redraw = [null, drawIdea, drawAnatomy, drawGini, drawGain, drawScan, drawTT,
                  drawTreeDemo, drawReg, drawPrune, null, null, drawEnt, drawDraw];
  instant = true;
  if (current === 0) { if (ovRaf) cancelAnimationFrame(ovRaf); instant = false; drawOverview(); }
  else if (redraw[current]) redraw[current]();
  instant = false;
  fitMath($('panel-' + current));
});

document.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pos = CURRICULUM_ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && pos < CURRICULUM_ORDER.length - 1) goTo(CURRICULUM_ORDER[pos + 1]);
  if (e.key === 'ArrowLeft'  && pos > 0) goTo(CURRICULUM_ORDER[pos - 1]);
});
