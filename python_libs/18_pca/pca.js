/* ══════════════════════════════════════════════════════════════════
   PCA — deck 18
   Variance, principal directions, projection as a dot product,
   explained variance and how many components to keep.

   The 2-D demos run a real PCA in the browser: pca2() below builds
   the covariance matrix of the points you can see and solves the
   2x2 eigenproblem in closed form, so the arrow in panel 03 is the
   genuine PC1 of that cloud and the variance readout is a genuine
   variance of the projections.

   The tumour-dataset figures (EVR, the cumulative curve, the row-0
   projection) are not simulated — they are the output of running
   scikit-learn on the 569 x 30 table from the lesson notebook, and
   are pasted in below as REAL_EVR / row0 terms.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 13;
const LABELS = ['Overview','Too many columns','Variance','A component is a direction',
                'Multiply · one number','30 columns → 2','Explained variance',
                'How many components?','Scale first','The whole recipe','Exercises',
                'A1 · The PCA object','A2 · PCA vs the neighbours'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12];

let current = 0;
/* One animation handle per panel, so leaving a panel stops its loop.
   Panel 4 steps with setTimeout rather than rAF, so stopRaf clears
   both kinds of handle — the ids cannot collide across the two APIs
   here because each panel only ever holds one of them. */
const RAF = {};
function stopRaf(idx) {
  if (RAF[idx]) { cancelAnimationFrame(RAF[idx]); clearTimeout(RAF[idx]); RAF[idx] = null; }
}
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
window.fitMath = fitMath;

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

function arrow(ctx, x1, y1, x2, y2, color, width) {
  ctx.save();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.lineWidth = width || 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - 7 * Math.cos(a), y2 - 7 * Math.sin(a)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(a - .4), y2 - 10 * Math.sin(a - .4));
  ctx.lineTo(x2 - 10 * Math.cos(a + .4), y2 - 10 * Math.sin(a + .4));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

/* a plot with real margins and caller-formatted ticks */
function plot2(cvId, height, xmin, xmax, ymin, ymax, opts) {
  opts = opts || {};
  const c = canvasSetup(cvId, height);
  const { ctx, W, H } = c;
  const padL = opts.padL == null ? 54 : opts.padL, padR = opts.padR == null ? 16 : opts.padR,
        padT = opts.padT == null ? 26 : opts.padT, padB = opts.padB == null ? 30 : opts.padB;
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

/* a small deterministic PRNG so the demo clouds are the same every visit */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
/* Box-Muller, so the clouds are actually gaussian rather than boxy */
function gauss(rnd) {
  const u = Math.max(1e-9, rnd()), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ══════════════════════════════════════════════════════════════════
   PCA itself, for 2 columns — closed form.

   Covariance of a 2-column table is [[a,b],[b,c]]. Its eigenvalues
   are the roots of a quadratic, and the eigenvector for the larger
   one is PC1. Same answer sklearn returns, without the machinery.
   ══════════════════════════════════════════════════════════════════ */
function pca2(P) {
  const n = P.length;
  let mx = 0, my = 0;
  for (const p of P) { mx += p[0]; my += p[1]; }
  mx /= n; my /= n;
  let a = 0, b = 0, c = 0;
  for (const p of P) {
    const dx = p[0] - mx, dy = p[1] - my;
    a += dx * dx; b += dx * dy; c += dy * dy;
  }
  a /= (n - 1); b /= (n - 1); c /= (n - 1);
  const tr = a + c, det = a * c - b * b;
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  /* eigenvector of l1: (b, l1 - a), falling back when b is ~0 */
  let vx, vy;
  if (Math.abs(b) > 1e-12) { vx = b; vy = l1 - a; }
  else { vx = (a >= c) ? 1 : 0; vy = (a >= c) ? 0 : 1; }
  const L = Math.hypot(vx, vy);
  vx /= L; vy /= L;
  if (vx < 0) { vx = -vx; vy = -vy; }          /* a stable sign, for the demo only */
  return { mean:[mx, my], pc1:[vx, vy], pc2:[-vy, vx], var1:l1, var2:l2, total:a + c };
}

/* variance of the projections of P onto the unit direction d */
function projVar(P, d, mean) {
  const n = P.length;
  let s = 0, s2 = 0;
  for (const p of P) {
    const t = (p[0] - mean[0]) * d[0] + (p[1] - mean[1]) * d[1];
    s += t; s2 += t * t;
  }
  return (s2 - s * s / n) / (n - 1);
}

/* ══════════════════════════════════════════════════════════════════
   the demo cloud — one correlated blob, used by panels 0 and 3
   ══════════════════════════════════════════════════════════════════ */
function makeCloud(seed, n, ang, sx_, sy_) {
  const rnd = mulberry32(seed), P = [];
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let i = 0; i < n; i++) {
    const u = gauss(rnd) * sx_, v = gauss(rnd) * sy_;
    P.push([50 + u * ca - v * sa, 50 + u * sa + v * ca]);
  }
  return P;
}
const CLOUD = makeCloud(7, 160, 0.42, 20, 6.4);
const CLOUD_PCA = pca2(CLOUD);

/* ══════════════════════════════════════════════════════════════════
   PANEL 0 — a 2-column cloud collapsing onto one component

   Four beats: the cloud, PC1 appearing, the points sliding onto it,
   the line straightening out into a single row of numbers.
   ══════════════════════════════════════════════════════════════════ */
let ovT0 = performance.now();
function drawOverview() {
  const p = plot2('cv-overview', 330, 0, 100, 8, 92, { padL: 40, padB: 34, xlab:'feature 1', ylab:'feature 2' });
  const { ctx, sx, sy, W, H } = p;
  const M = CLOUD_PCA.mean, D = CLOUD_PCA.pc1;

  const CYCLE = 9200;
  const t = ((performance.now() - ovT0) % CYCLE) / CYCLE;
  /* 0-.22 cloud · .22-.40 arrow · .40-.68 project · .68-1 flatten & hold */
  const arrowT  = clamp01((t - 0.20) / 0.18);
  const projT   = clamp01((t - 0.42) / 0.24);
  const flatT   = clamp01((t - 0.70) / 0.20);

  /* projections, in data units, along PC1 from the mean */
  const ts = CLOUD.map(q => (q[0] - M[0]) * D[0] + (q[1] - M[1]) * D[1]);
  const tmin = Math.min(...ts), tmax = Math.max(...ts);

  /* the PC1 line itself */
  if (arrowT > 0) {
    const half = 46 * easeOut(arrowT);
    ctx.save(); ctx.globalAlpha = 1 - flatT * 0.75;
    ctx.strokeStyle = hexA(COL.accent, .32); ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(sx(M[0] - D[0] * half), sy(M[1] - D[1] * half));
    ctx.lineTo(sx(M[0] + D[0] * half), sy(M[1] + D[1] * half));
    ctx.stroke(); ctx.setLineDash([]);
    arrow(ctx, sx(M[0]), sy(M[1]), sx(M[0] + D[0] * half), sy(M[1] + D[1] * half), COL.accent, 2.4);
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    haloText(ctx, 'PC1', sx(M[0] + D[0] * half) + 7, sy(M[1] + D[1] * half) - 2, COL.accent);
    ctx.restore();
  }

  /* the strip the flattened points land on */
  const stripY = H - 52;
  if (flatT > 0) {
    ctx.save(); ctx.globalAlpha = flatT;
    ctx.strokeStyle = hexA(COL.green, .5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.padL + 8, stripY); ctx.lineTo(W - 24, stripY); ctx.stroke();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'one column: the projection of each row onto PC1', p.padL + 8, stripY + 8, hexA(COL.green, .85));
    ctx.restore();
  }

  CLOUD.forEach((q, i) => {
    const tt = ts[i];
    const fx = M[0] + D[0] * tt, fy = M[1] + D[1] * tt;       /* foot on the line */
    /* stage 1: slide onto the line */
    const e = easeOut(projT);
    let X = sx(q[0] + (fx - q[0]) * e), Y = sy(q[1] + (fy - q[1]) * e);
    /* stage 2: the line straightens into a horizontal strip */
    if (flatT > 0) {
      const u = (tt - tmin) / (tmax - tmin);
      const gx = p.padL + 14 + u * (W - p.padL - 42);
      const g = easeOut(flatT);
      X = X + (gx - X) * g; Y = Y + (stripY - Y) * g;
    }
    /* the drop line, only while the projection is happening */
    if (projT > 0 && projT < 1 && flatT === 0) {
      ctx.strokeStyle = hexA(COL.accent, .16); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(q[0]), sy(q[1])); ctx.lineTo(X, Y); ctx.stroke();
    }
    const on = projT > 0.02;
    ctx.fillStyle = on ? hexA(COL.accent, .9) : hexA(COL.blue, .8);
    ctx.beginPath(); ctx.arc(X, Y, on ? 2.8 : 3, 0, 7); ctx.fill();
  });

  /* the running caption */
  const caps = [
    ['160 rows, 2 columns', COL.blue],
    ['PC1 = the direction they are most spread along', COL.accent],
    ['drop every row onto it', COL.accent],
    ['2 columns → 1, and the order survives', COL.green]
  ];
  const ci = flatT > 0.2 ? 3 : projT > 0.02 ? 2 : arrowT > 0.05 ? 1 : 0;
  /* centred, because the y-axis label already owns the top-left corner */
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  haloText(ctx, caps[ci][0], (p.padL + W) / 2, 6, caps[ci][1]);

  RAF[0] = requestAnimationFrame(drawOverview);
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 2 — three rows of ten values, same mean, different spread.
   Static on purpose: the whole idea should land before the formula.
   ══════════════════════════════════════════════════════════════════ */
function drawSpread() {
  const c = canvasSetup('cv-spread', 230);
  const { ctx, W, H } = c;
  const rnd = mulberry32(3);
  const rows = [
    { s: 0.05, lbl: 'bunched together', col: COL.blue },
    { s: 0.16, lbl: 'somewhat spread',  col: COL.accent },
    { s: 0.34, lbl: 'widely scattered', col: COL.red }
  ];
  const padL = 122, padR = 24, mid = (padL + W - padR) / 2;
  rows.forEach((r, ri) => {
    const y = 46 + ri * 60;
    /* the axis for this row */
    ctx.strokeStyle = 'rgba(230,237,243,.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    /* the mean marker, in the same place for all three */
    ctx.strokeStyle = hexA(COL.green, .55); ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(mid, y - 19); ctx.lineTo(mid, y + 19); ctx.stroke(); ctx.setLineDash([]);
    /* ten values, symmetric about the mean so every row has the same average */
    const offs = [];
    for (let i = 0; i < 5; i++) { const v = Math.abs(gauss(rnd)) * r.s; offs.push(v, -v); }
    offs.forEach(o => {
      const x = mid + o * (W - padL - padR);
      ctx.fillStyle = hexA(r.col, .92);
      ctx.beginPath(); ctx.arc(x, y, 5.2, 0, 7); ctx.fill();
    });
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    haloText(ctx, r.lbl, padL - 14, y, r.col);
  });
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  haloText(ctx, 'the mean — identical in all three', mid, 46 + 2 * 60 + 26, hexA(COL.green, .8));
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'ten values each', 10, 10, 'rgba(230,237,243,.45)');
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 3 — turn the line, watch the variance of the projections
   ══════════════════════════════════════════════════════════════════ */
function drawDir() {
  const deg = +$('sl-ang').value;
  $('v-ang').textContent = deg + '°';
  const th = deg * Math.PI / 180;
  const d = [Math.cos(th), Math.sin(th)];
  const M = CLOUD_PCA.mean;
  const v = projVar(CLOUD, d, M);
  const best = CLOUD_PCA.var1, total = CLOUD_PCA.total;

  const p = plot2('cv-dir', 360, 0, 100, 8, 92, { padL: 40, padB: 34, padT: 44, xlab:'feature 1', ylab:'feature 2' });
  const { ctx, sx, sy, W, H } = p;

  /* the candidate line */
  const half = 48;
  ctx.strokeStyle = hexA(COL.accent, .4); ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(sx(M[0] - d[0] * half), sy(M[1] - d[1] * half));
  ctx.lineTo(sx(M[0] + d[0] * half), sy(M[1] + d[1] * half));
  ctx.stroke(); ctx.setLineDash([]);
  arrow(ctx, sx(M[0]), sy(M[1]), sx(M[0] + d[0] * half * .82), sy(M[1] + d[1] * half * .82), COL.accent, 2.2);

  /* every point, its drop line, and where it lands */
  CLOUD.forEach(q => {
    const t = (q[0] - M[0]) * d[0] + (q[1] - M[1]) * d[1];
    const fx = M[0] + d[0] * t, fy = M[1] + d[1] * t;
    ctx.strokeStyle = 'rgba(230,237,243,.11)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(sx(q[0]), sy(q[1])); ctx.lineTo(sx(fx), sy(fy)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = hexA(COL.blue, .55);
    ctx.beginPath(); ctx.arc(sx(q[0]), sy(q[1]), 2.6, 0, 7); ctx.fill();
    ctx.fillStyle = hexA(COL.accent, .95);
    ctx.beginPath(); ctx.arc(sx(fx), sy(fy), 2.6, 0, 7); ctx.fill();
  });

  /* the variance-vs-angle curve, inset top-right, with the current angle marked */
  const bw = 168, bh = 62, bx = W - bw - 20, by = 8;
  ctx.fillStyle = 'rgba(2,5,9,.88)'; ctx.strokeStyle = 'rgba(230,237,243,.16)'; ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  for (let a = 0; a <= 180; a += 2) {
    const r = a * Math.PI / 180;
    const vv = projVar(CLOUD, [Math.cos(r), Math.sin(r)], M);
    const X = bx + 8 + (a / 180) * (bw - 16);
    const Y = by + bh - 12 - (vv / best) * (bh - 24);
    a === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
  }
  ctx.strokeStyle = hexA(COL.accent, .8); ctx.lineWidth = 1.6; ctx.stroke();
  const cx = bx + 8 + (deg / 180) * (bw - 16), cy = by + bh - 12 - (v / best) * (bh - 24);
  ctx.fillStyle = COL.green; ctx.beginPath(); ctx.arc(cx, cy, 3.6, 0, 7); ctx.fill();
  ctx.font = 'bold 8px Courier New'; ctx.fillStyle = 'rgba(230,237,243,.5)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('variance vs angle', bx + 8, by + 3);

  const bestDeg = (Math.atan2(CLOUD_PCA.pc1[1], CLOUD_PCA.pc1[0]) * 180 / Math.PI + 180) % 180;
  $('out-dir').textContent =
`direction        [${f2(d[0])}, ${f2(d[1])}]      (length ${f2(Math.hypot(d[0], d[1]))})
variance kept    ${f2(v)}  of ${f2(total)} total   ->  ${(v / total * 100).toFixed(1)}%
${v > best - 1e-6 ? '*** this IS PC1 — no direction beats it ***'
                  : `PC1 is at ${bestDeg.toFixed(0)}° and keeps ${f2(best)}  (${(best / total * 100).toFixed(1)}%)`}`;
}
function snapPC1() {
  const bestDeg = (Math.atan2(CLOUD_PCA.pc1[1], CLOUD_PCA.pc1[0]) * 180 / Math.PI + 180) % 180;
  const from = +$('sl-ang').value, to = Math.round(bestDeg), t0 = performance.now();
  stopRaf(3);
  (function step() {
    const e = easeOut(clamp01((performance.now() - t0) / 700));
    $('sl-ang').value = Math.round(from + (to - from) * e);
    drawDir();
    if (e < 1) RAF[3] = requestAnimationFrame(step);
  })();
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 4 — row x component, term by term

   Three examples. The third is the real thing: the first five terms
   of the 30-term dot product that produces pca_result[0, 0] = 9.1928
   on the scaled tumour data.
   ══════════════════════════════════════════════════════════════════ */
const DOT_EX = [
  { names: ['maths', 'english', 'science'],
    x: [85, 90, 80], w: [0.5, 0.3, 0.2], dp: 1,
    lbl: 'projection of Obs1 onto PC1',
    note: `Obs1 = [85, 90, 80]        PC1 = [0.5, 0.3, 0.2]
3 numbers in  ->  1 number out.` },
  { names: ['x', 'y'],
    x: [90, 70], w: [0.7, 0.7], dp: 1,
    lbl: 'projection of the point [90, 70]',
    note: `PC1 = [0.7, 0.7] points at 45 degrees — the direction
the data is most spread along. The point keeps one
coordinate, 112, measured along that new axis.` },
  { names: ['mean radius', 'mean texture', 'mean perimeter', 'mean area', 'mean smoothness'],
    x: [1.0971, -2.0733, 1.2699, 0.9844, 1.5685],
    w: [0.2189, 0.1037, 0.2275, 0.2210, 0.1426], dp: 4,
    partial: true, full: 9.1928,
    lbl: 'first 5 of 30 terms',
    note: `The real thing: scaled_data[0] x pca.components_[0].
The 5 terms shown add to 0.7552; all 30 add to 9.1928,
which is exactly what pca_result[0, 0] contains.` }
];
let dotIdx = 0, dotShown = 99;

function pickDot(i) {
  dotIdx = i; dotShown = 99;
  $('seg-dot').querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i));
  renderDot();
}

function renderDot() {
  const e = DOT_EX[dotIdx], strip = $('dot-strip');
  strip.innerHTML = '';
  let run = 0;
  e.x.forEach((xv, i) => {
    const prod = xv * e.w[i];
    const lit = i < dotShown;
    if (lit) run += prod;
    const row = document.createElement('div');
    row.className = 'dotrow';
    row.innerHTML =
      `<div class="dcell f${lit ? ' h' : ''}"><b>${e.names[i]}</b><span>${xv.toFixed(e.dp === 1 ? 0 : 4)}</span></div>` +
      `<div class="dcell w${lit ? ' h' : ''}"><b>weight</b><span>&times; ${e.w[i]}</span></div>` +
      `<div class="dcell p${lit ? ' h' : ''}"><b>product</b><span>${lit ? prod.toFixed(e.dp) : '·'}</span></div>` +
      `<div class="dcell${lit ? ' h' : ''}"><b>running sum</b><span style="color:${lit ? '#10b981' : 'var(--muted)'}">${lit ? run.toFixed(e.dp) : '·'}</span></div>`;
    strip.appendChild(row);
  });
  const done = dotShown >= e.x.length;
  $('dot-lbl').textContent = e.lbl;
  $('dot-val').textContent = done ? (e.partial ? run.toFixed(4) + '  …  ' + e.full : run.toFixed(e.dp)) : '…';
  $('out-dot').textContent = e.note;
}

function playDot() {
  stopRaf(4);
  dotShown = 0; renderDot();
  const e = DOT_EX[dotIdx];
  let i = 0;
  const tick = () => {
    dotShown = ++i; renderDot();
    if (i < e.x.length) RAF[4] = setTimeout(tick, 520);
  };
  RAF[4] = setTimeout(tick, 260);
}

/* ══════════════════════════════════════════════════════════════════
   The real scikit-learn output for the 569 x 30 tumour table,
   standardised. Panels 06 and 07 draw these, nothing invented.
   ══════════════════════════════════════════════════════════════════ */
const REAL_EVR = [0.442720, 0.189712, 0.093932, 0.066021, 0.054958, 0.040245, 0.022507, 0.015887,
                  0.013896, 0.011690, 0.009797, 0.008705, 0.008045, 0.005233, 0.003137, 0.002662,
                  0.001979, 0.001753, 0.001649, 0.001039, 0.000999, 0.000914, 0.000821, 0.000602,
                  0.000516, 0.000273, 0.000230, 0.000053, 0.000025, 0.000004];
const REAL_CUM = REAL_EVR.reduce((acc, v) => (acc.push((acc.length ? acc[acc.length - 1] : 0) + v), acc), []);

/* ══════════════════════════════════════════════════════════════════
   PANEL 6 — the explained variance of all 30 components, as bars
   ══════════════════════════════════════════════════════════════════ */
function drawEvr() {
  const p = plot2('cv-evr', 250, 0.4, 30.6, 0, 0.46, {
    padL: 48, padB: 32,
    xticks: [1, 5, 10, 15, 20, 25, 30],
    yticks: [0, 0.1, 0.2, 0.3, 0.4],
    yfmt: v => (v * 100).toFixed(0) + '%',
    xlab: 'component', ylab: 'explained variance ratio'
  });
  const { ctx, sx, sy, H, padB } = p;
  const bw = Math.max(4, (sx(2) - sx(1)) * 0.62);
  REAL_EVR.forEach((v, i) => {
    const x = sx(i + 1), y = sy(v);
    const keep = i < 2;
    ctx.fillStyle = keep ? hexA(COL.accent, .9) : hexA(COL.blue, .5);
    roundRect(ctx, x - bw / 2, y, bw, H - padB - y, 2); ctx.fill();
    if (keep) {
      /* PC2's label sits to the right of its bar so it clears PC1's */
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = i === 0 ? 'center' : 'left';
      ctx.textBaseline = 'bottom';
      haloText(ctx, (v * 100).toFixed(1) + '%', i === 0 ? x : x + bw, y - 4, COL.accent);
    }
  });
  /* centred, because the y-axis label already owns the top-left corner */
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  haloText(ctx, 'yellow = the two the notebook keeps  ·  together 63.2%', (p.padL + p.W) / 2, 6, 'rgba(230,237,243,.55)');
}

/* ══════════════════════════════════════════════════════════════════
   PANEL 7 — the cumulative curve, with the cut you choose
   ══════════════════════════════════════════════════════════════════ */
function drawCum() {
  const k = +$('sl-nc').value;
  $('v-nc').textContent = k;
  const p = plot2('cv-cum', 320, 0.4, 30.6, 0.38, 1.03, {
    padL: 50, padB: 32,
    xticks: [1, 5, 10, 15, 20, 25, 30],
    yticks: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    yfmt: v => (v * 100).toFixed(0) + '%',
    xlab: 'n_components', ylab: 'cumulative explained variance'
  });
  const { ctx, sx, sy, W, H, padB, padT } = p;

  /* the 90% and 95% guides people actually aim at */
  [[0.90, '90%'], [0.95, '95%']].forEach(([v, lab]) => {
    ctx.strokeStyle = 'rgba(16,185,129,.22)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(p.padL, sy(v)); ctx.lineTo(W - p.padR, sy(v)); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    haloText(ctx, lab, W - p.padR - 2, sy(v) - 2, 'rgba(16,185,129,.6)');
  });

  /* everything the cut keeps, shaded */
  ctx.fillStyle = hexA(COL.accent, .07);
  ctx.fillRect(p.padL, padT - 6, sx(k) - p.padL, H - padB - padT + 6);
  ctx.strokeStyle = hexA(COL.accent, .55); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sx(k), padT - 6); ctx.lineTo(sx(k), H - padB); ctx.stroke();

  /* the curve */
  ctx.beginPath();
  REAL_CUM.forEach((v, i) => { const X = sx(i + 1), Y = sy(v); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
  ctx.strokeStyle = COL.blue; ctx.lineWidth = 2; ctx.stroke();
  REAL_CUM.forEach((v, i) => {
    const on = i + 1 === k;
    ctx.fillStyle = on ? COL.accent : hexA(COL.blue, .85);
    ctx.beginPath(); ctx.arc(sx(i + 1), sy(v), on ? 5 : 3, 0, 7); ctx.fill();
  });

  const got = REAL_CUM[k - 1];
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  haloText(ctx, (got * 100).toFixed(1) + '%', sx(k), sy(got) - 9, COL.accent);

  $('out-cum').textContent =
`PCA(n_components=${k})
kept      ${(got * 100).toFixed(2)}% of the total variance
lost      ${((1 - got) * 100).toFixed(2)}%
columns   30  ->  ${k}   (${(100 - k / 30 * 100).toFixed(0)}% fewer)`;
}

/* ══════════════════════════════════════════════════════════════════
   boot
   ══════════════════════════════════════════════════════════════════ */
const DRAWS = [drawOverview, null, drawSpread, drawDir, renderDot, null, drawEvr,
               drawCum, null, null, null, null, null];

updateDots();
renderDot();
setTimeout(drawOverview, 90);

window.addEventListener('resize', () => {
  stopAll();
  if (current === 0) ovT0 = performance.now();
  if (DRAWS[current]) DRAWS[current]();
  fitMath($('panel-' + current));
});
