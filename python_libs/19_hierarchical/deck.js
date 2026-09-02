/* ══════════════════════════════════════════════════════════════════
   Hierarchical clustering — deck 19

   The overview animation is a real average-linkage agglomerative
   clustering, computed in the browser on the eleven points you can
   see. agglomerate() below builds the actual merge sequence, and the
   dendrogram on the right is laid out from that same tree — leaf
   order comes from walking it, and each bracket is drawn at the
   height the merge really happened at. Nothing is faked: press the
   panel and the tree you watch being built is the tree those points
   produce.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const PANEL_BTNS = Array.from(document.querySelectorAll('.s-item[data-panel]'));
const TOTAL  = PANEL_BTNS.length;
const LABELS = PANEL_BTNS.map(b => b.querySelector('.s-label').textContent.trim());

let current = 0;
const RAF = {};
function stopRaf(i) { if (RAF[i]) { cancelAnimationFrame(RAF[i]); clearTimeout(RAF[i]); RAF[i] = null; } }
function stopAll() { for (const k in RAF) stopRaf(k); }

function goTo(idx) {
  if (idx === current || !$('panel-' + idx)) return;
  const oldP = $('panel-' + current), newP = $('panel-' + idx);
  if (current > 0) {
    const b = document.querySelector('[data-panel="' + current + '"]');
    if (b) b.classList.add('done');
  }
  stopAll();
  oldP.classList.remove('active');
  oldP.classList.add('exit');
  setTimeout(() => oldP.classList.remove('exit'), 280);
  current = idx;
  newP.classList.add('active');
  $('viewport').scrollTop = 0;
  document.querySelectorAll('.s-item').forEach(b =>
    b.classList.toggle('active', +b.dataset.panel === idx));
  updateDots();
  fitMath(newP);
  if (DRAWS[idx]) setTimeout(DRAWS[idx], 60);
}

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
window.fitMath = fitMath;

function updateDots() {
  for (let i = 0; i < TOTAL; i++) {
    const cont = $('dots-' + i); if (!cont) continue;
    cont.innerHTML = '';
    for (let d = 0; d < TOTAL; d++) {
      const b = document.createElement('button');
      b.className = 'pnav-dot' + (d === current ? ' active' : '');
      b.title = LABELS[d]; b.onclick = () => goTo(d);
      cont.appendChild(b);
    }
  }
}

$('viewport').addEventListener('scroll', () => {
  const el = $('viewport'), span = el.scrollHeight - el.clientHeight;
  $('progress').style.width = (span > 0 ? el.scrollTop / span * 100 : 0) + '%';
});

document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === 'ArrowRight' && current < TOTAL - 1) goTo(current + 1);
  if (e.key === 'ArrowLeft'  && current > 0)         goTo(current - 1);
});

function cp(btn) {
  navigator.clipboard.writeText(btn.closest('.code-wrap').querySelector('pre').innerText.trim())
    .then(() => { btn.textContent = '✓ copied'; setTimeout(() => btn.textContent = 'copy', 1600); });
}

/* ══════════ the clustering itself ══════════ */

const COL = { grid:'rgba(230,237,243,.07)', axis:'rgba(230,237,243,.4)',
              text:'#e6edf3', muted:'rgba(230,237,243,.45)', surface:'#060a10' };
/* one colour per cluster as it forms — merged clusters take the left one's */
const CCOL = ['#14b8a6','#f43f5e','#facc15','#3b82f6','#a855f7','#10b981',
              '#f97316','#06b6d4','#ec4899','#8b5cf6','#22c55e'];

/* eleven points in four visually obvious groups, in a 0..100 space */
const PTS = [
  [12, 20], [19, 27], [ 9, 33],           // group 1
  [62, 22], [70, 31], [65, 39],           // group 2
  [34, 74], [42, 82], [28, 84],           // group 3
  [80, 68], [88, 78]                      // group 4
];

function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

/* average linkage: distance between two clusters is the mean of every
   cross-pair distance. Returns the merge list in the order they happen. */
function agglomerate(pts) {
  let clusters = pts.map((p, i) => ({ id: i, members: [i], kids: null, h: 0 }));
  const merges = [];
  let nextId = pts.length;
  while (clusters.length > 1) {
    let best = Infinity, bi = 0, bj = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        let s = 0, n = 0;
        for (const a of clusters[i].members)
          for (const b of clusters[j].members) { s += dist(pts[a], pts[b]); n++; }
        const d = s / n;
        if (d < best) { best = d; bi = i; bj = j; }
      }
    }
    const A = clusters[bi], B = clusters[bj];
    const node = { id: nextId++, members: A.members.concat(B.members),
                   kids: [A, B], h: best };
    merges.push(node);
    clusters = clusters.filter((_, k) => k !== bi && k !== bj);
    clusters.push(node);
  }
  return merges;
}

const MERGES = agglomerate(PTS);
const MAXH   = MERGES[MERGES.length - 1].h;

/* dendrogram layout: leaves left to right in tree order, internal
   nodes centred over their children, y from the merge height */
function layout(root) {
  const order = [];
  (function walk(n) { if (!n.kids) { order.push(n.id); return; } walk(n.kids[0]); walk(n.kids[1]); })(root);
  const xOf = {};
  order.forEach((id, i) => xOf[id] = i);
  (function assign(n) {
    if (!n.kids) return xOf[n.id];
    const a = assign(n.kids[0]), b = assign(n.kids[1]);
    return xOf[n.id] = (a + b) / 2;
  })(root);
  return { order, xOf };
}
const LAY = layout(MERGES[MERGES.length - 1]);

function canvasSetup(cvId, height) {
  const cv = $(cvId); if (!cv) return null;
  const ctx = cv.getContext('2d');
  cv.width = Math.min(cv.parentElement.clientWidth - 28 || 620, 760);
  if (height) cv.height = height;
  ctx.clearRect(0, 0, cv.width, cv.height);
  return { cv, ctx };
}

/* which cluster does a point belong to after `step` merges? */
function clusterAt(step) {
  const owner = PTS.map((_, i) => i);
  for (let s = 0; s < step; s++) {
    const root = MERGES[s].members[0];
    for (const m of MERGES[s].members) owner[m] = owner[root];
  }
  return owner;
}

function drawOverview(step, t) {
  const setup = canvasSetup('cv-overview', 330); if (!setup) return;
  const { cv, ctx } = setup;
  const W = cv.width, H = cv.height;
  const splitX = W * 0.52;

  ctx.fillStyle = COL.surface; ctx.fillRect(0, 0, W, H);

  /* ── left: the scatter ── */
  const pad = 34;
  const sx = v => pad + v / 100 * (splitX - pad * 1.4);
  const sy = v => pad + v / 100 * (H - pad * 2.2);

  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  for (let g = 0; g <= 100; g += 25) {
    ctx.beginPath(); ctx.moveTo(sx(g), sy(0)); ctx.lineTo(sx(g), sy(100)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx(0), sy(g)); ctx.lineTo(sx(100), sy(g)); ctx.stroke();
  }

  const owner = clusterAt(step);

  /* link lines for every merge done so far */
  ctx.lineWidth = 1.6;
  for (let s = 0; s < step; s++) {
    const n = MERGES[s];
    const ca = centroid(n.kids[0].members), cb = centroid(n.kids[1].members);
    const grow = (s === step - 1) ? t : 1;
    ctx.strokeStyle = CCOL[owner[n.members[0]] % CCOL.length];
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(sx(ca[0]), sy(ca[1]));
    ctx.lineTo(sx(ca[0] + (cb[0] - ca[0]) * grow), sy(ca[1] + (cb[1] - ca[1]) * grow));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  PTS.forEach((p, i) => {
    ctx.fillStyle = CCOL[owner[i] % CCOL.length];
    ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 5.5, 0, 7); ctx.fill();
  });

  ctx.fillStyle = COL.muted;
  ctx.font = '600 10px Segoe UI, sans-serif';
  ctx.fillText('the points', pad, H - 12);

  /* ── right: the dendrogram ── */
  const dl = splitX + 26, dr = W - 22, db = H - 34, dt = 34;
  const dx = i => dl + (i / (PTS.length - 1)) * (dr - dl);
  const dy = h => db - (h / (MAXH * 1.06)) * (db - dt);

  ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(dl - 12, db); ctx.lineTo(dr, db); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dl - 12, db); ctx.lineTo(dl - 12, dt - 6); ctx.stroke();

  ctx.lineWidth = 2;
  for (let s = 0; s < step; s++) {
    const n = MERGES[s];
    const a = n.kids[0], b = n.kids[1];
    const xa = dx(LAY.xOf[a.id]), xb = dx(LAY.xOf[b.id]);
    const ya = dy(a.h), yb = dy(b.h), y = dy(n.h);
    const p = (s === step - 1) ? t : 1;
    const yTop = a => a + (y - a) * p;
    ctx.strokeStyle = CCOL[clusterAt(s + 1)[n.members[0]] % CCOL.length];
    ctx.beginPath();
    ctx.moveTo(xa, ya); ctx.lineTo(xa, yTop(ya));
    ctx.moveTo(xb, yb); ctx.lineTo(xb, yTop(yb));
    if (p > 0.98) { ctx.moveTo(xa, y); ctx.lineTo(xb, y); }
    ctx.stroke();
  }

  /* leaf ticks */
  ctx.fillStyle = COL.muted;
  LAY.order.forEach((id, i) => {
    ctx.fillStyle = CCOL[owner[id] % CCOL.length];
    ctx.beginPath(); ctx.arc(dx(i), db, 3, 0, 7); ctx.fill();
  });

  ctx.fillStyle = COL.muted;
  ctx.font = '600 10px Segoe UI, sans-serif';
  ctx.fillText('the dendrogram', dl - 12, H - 12);
  ctx.save();
  ctx.translate(dl - 24, (db + dt) / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.fillText('distance', 0, 0);
  ctx.restore();

  /* caption */
  const left = PTS.length - step;
  ctx.fillStyle = COL.text;
  ctx.font = '700 12px Segoe UI, sans-serif';
  ctx.fillText(left === 1 ? 'one cluster — done' : left + ' clusters', pad, 22);
}

function centroid(members) {
  let x = 0, y = 0;
  for (const m of members) { x += PTS[m][0]; y += PTS[m][1]; }
  return [x / members.length, y / members.length];
}

/* step through the merges, pause at the end, then start over */
function runOverview() {
  stopRaf(0);
  let step = 0, t = 0, holding = 0;
  const SPEED = 0.045;
  (function frame() {
    if (holding > 0) {
      holding--;
      if (holding === 0) { step = 0; t = 0; }
    } else if (step < MERGES.length) {
      t += SPEED;
      if (t >= 1) { t = 0; step++; if (step === MERGES.length) holding = 150; }
    }
    drawOverview(step, t);
    RAF[0] = requestAnimationFrame(frame);
  })();
}

const DRAWS = { 0: runOverview };

window.addEventListener('load', () => { updateDots(); fitMath(); runOverview(); });
window.addEventListener('resize', () => { fitMath(); if (current === 0) runOverview(); });
updateDots();
