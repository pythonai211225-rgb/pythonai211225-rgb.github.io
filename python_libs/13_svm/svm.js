/* ══════════════════════════════════════════════════════════════════
   Support Vector Machines — deck 13
   Every demo on this page is computed live: the kernel playground runs a
   real SMO solver, the rest is closed-form geometry on the eight-point
   dataset from lesson 17.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 17;
const LABELS = ['Overview','The idea','The hyperplane','Distance to it','(removed)',
                '(removed)','(removed)','(removed)','SVC in sklearn',
                'A1 · Why kernels','A2 · Kernel playground','Evaluation','Pros & cons','Exercises',
                '(removed)','(removed)','A3 · SVC parameters'];
/* the main line runs Overview → the idea → hyperplane → distance → SVC → evaluation →
   pros & cons → exercises, then the appendix: why kernels (9), playground (10),
   parameters (16). The gaps in the numbering are panels that were cut.            */
const CURRICULUM_ORDER = [0,1,2,3,8,11,12,13,9,10,16];

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
  fitMath(newP);                 // the panel was display:none until now, so it could not be measured
  const draws = [drawOverview, drawIdea, drawPlane, drawDist, null, null, null,
                 null, drawSvc, drawLift, drawKPlay, drawEval, null, null, null, null, null];
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
    if (!avail) return;                       // still hidden — measured when the panel opens
    /* .katex is display:block so it never reports the overflow itself; the real
       width of the formula lives on the .katex-html span inside it */
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

function plotSetup(cvId, XMIN, XMAX, YMIN, YMAX, xstep = 2, ystep) {
  const cv = $(cvId), ctx = cv.getContext('2d');
  const wrap = cv.parentElement;
  cv.width = Math.min(wrap.clientWidth - 28 || 560, 640);
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

function haloText(ctx, txt, x, y, color) {
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.surface;
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
}

function plotPoint(p, x, y, color, label, r = 5) {
  const { ctx, sx, sy } = p;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.stroke();
  if (label) { ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; haloText(ctx, label, sx(x) + 9, sy(y) - 7, color); }
}

/* a hollow ring drawn on top of a point — the sklearn way of marking a support vector */
function ringPoint(p, x, y, r = 10, color = '#e6edf3') {
  const { ctx, sx, sy } = p;
  ctx.save(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.restore();
}

/* a diamond marker for a query point */
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
  if (label) { ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; haloText(ctx, label, cx + 12, cy - 9, color); }
}

function axLabels(p, xlab, ylab) {
  const { ctx, W } = p;
  ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top';
  ctx.textAlign = 'left';  haloText(ctx, ylab, 12, 8, 'rgba(230,237,243,.42)');
  ctx.textAlign = 'right'; haloText(ctx, xlab, W - 8, 8, 'rgba(230,237,243,.42)');
}

/* ══════════ drawing a line given w·x + c = 0 ══════════ */
/* nx, ny need not be unit length — the helper normalizes them */
function lineOf(nx, ny, c) {
  const L = Math.hypot(nx, ny) || 1;
  return { ux: nx / L, uy: ny / L, uc: c / L };
}

function strokeHyper(p, nx, ny, c, color, width, dash) {
  const { ctx, sx, sy } = p;
  const { ux, uy, uc } = lineOf(nx, ny, c);
  const px = -uc * ux, py = -uc * uy, dx = -uy, dy = ux, T = 400;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sx(px - dx * T), sy(py - dy * T));
  ctx.lineTo(sx(px + dx * T), sy(py + dy * T));
  ctx.strokeStyle = color; ctx.lineWidth = width || 2.4;
  ctx.setLineDash(dash || []);
  ctx.stroke(); ctx.restore();
}

/* shade the strip between the two lines at signed offset +m and -m */
function fillBand(p, nx, ny, c, m, color) {
  if (!(m > 0)) return;
  const { ctx, sx, sy } = p;
  const { ux, uy, uc } = lineOf(nx, ny, c);
  const px = -uc * ux, py = -uc * uy, dx = -uy, dy = ux, T = 400;
  const corner = (s, o) => [px + dx * T * s + ux * o, py + dy * T * s + uy * o];
  const a = corner(-1, m), b = corner(1, m), d = corner(1, -m), e = corner(-1, -m);
  ctx.save(); ctx.beginPath();
  ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1]));
  ctx.lineTo(sx(d[0]), sy(d[1])); ctx.lineTo(sx(e[0]), sy(e[1])); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

/* shade one whole half-plane */
function fillSide(p, nx, ny, c, sign, color) {
  const { ctx, sx, sy } = p;
  const { ux, uy, uc } = lineOf(nx, ny, c);
  const px = -uc * ux, py = -uc * uy, dx = -uy, dy = ux, T = 400, D = 400 * sign;
  ctx.save(); ctx.beginPath();
  ctx.moveTo(sx(px - dx * T), sy(py - dy * T));
  ctx.lineTo(sx(px + dx * T), sy(py + dy * T));
  ctx.lineTo(sx(px + dx * T + ux * D), sy(py + dy * T + uy * D));
  ctx.lineTo(sx(px - dx * T + ux * D), sy(py - dy * T + uy * D));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
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
    const e = 1 - Math.pow(1 - t, 3);
    cb(e);
    if (t < 1) anims[id] = requestAnimationFrame(step); else delete anims[id];
  };
  anims[id] = requestAnimationFrame(step);
}

/* ══════════ the lesson dataset ══════════ */
const GA = [[1, 2], [1.5, 3], [2, 2.5], [2.5, 3.5]];    // label 0
const GB = [[5, 5], [5.5, 6], [6, 5.5], [6.5, 6.5]];    // label 1
const ALL = GA.concat(GB);
const LAB = [0, 0, 0, 0, 1, 1, 1, 1];
/* the exact values sklearn's SVC(kernel='linear') returns for this data */
const SW = [0.58823529411764708, 0.35294117647058826];
const SB = -3.7058823529411766;
const SNORM = Math.hypot(SW[0], SW[1]);              // 0.68599...
const SMARGIN = 1 / SNORM;                            // 1.45774 — half corridor
const STHETA = Math.atan2(SW[1], SW[0]);              // the optimal normal direction

const f2 = v => v.toFixed(2);
const f3 = v => v.toFixed(3);
const f4 = v => v.toFixed(4);
const sgn = v => (v >= 0 ? '+' : '') + v.toFixed(3);

/* For a fixed normal direction theta, the widest legal corridor is found by
   projecting every point onto the normal and splitting the gap in half.       */
function bandFor(theta) {
  const nx = Math.cos(theta), ny = Math.sin(theta);
  const pa = GA.map(q => q[0] * nx + q[1] * ny);
  const pb = GB.map(q => q[0] * nx + q[1] * ny);
  const maxA = Math.max(...pa), minB = Math.min(...pb);
  const m = (minB - maxA) / 2;             // half margin, negative when they overlap
  const c = -(minB + maxA) / 2;            // offset of the mid line
  const svA = GA[pa.indexOf(maxA)], svB = GB[pb.indexOf(minB)];
  return { nx, ny, c, m, sep: minB > maxA, svA, svB };
}

/* ═══ PANEL 0: overview — an endless sweep looking for the widest corridor ═══ */
function drawOverview() {
  const start = performance.now();
  const loop = now => {
    const T = ((now - start) / 5200) % 1;
    /* ease back and forth across the band of angles that actually separate (0..115 deg) */
    const phase = T < .5 ? T * 2 : (1 - T) * 2;
    const theta = phase * 115 * Math.PI / 180;
    const bd = bandFor(theta);
    const p = plotSetup('cv-overview', -0.4, 8.4, -0.4, 8.4, 1, 1);
    axLabels(p, 'x', 'y');
    const good = bd.sep && bd.m > 0;
    const quality = Math.max(0, bd.m / SMARGIN);
    if (good) {
      fillBand(p, bd.nx, bd.ny, bd.c, bd.m, 'rgba(250,204,21,' + (0.05 + 0.09 * quality).toFixed(3) + ')');
      strokeHyper(p, bd.nx, bd.ny, bd.c - bd.m, 'rgba(250,204,21,.5)', 1.6, [6, 5]);
      strokeHyper(p, bd.nx, bd.ny, bd.c + bd.m, 'rgba(250,204,21,.5)', 1.6, [6, 5]);
    }
    strokeHyper(p, bd.nx, bd.ny, bd.c, good ? COL.text : 'rgba(244,63,94,.6)', 2.6);
    for (const q of GA) plotPoint(p, q[0], q[1], COL.red, null, 6);
    for (const q of GB) plotPoint(p, q[0], q[1], COL.blue, null, 6);
    if (good) { ringPoint(p, bd.svA[0], bd.svA[1], 11); ringPoint(p, bd.svB[0], bd.svB[1], 11); }
    const { ctx } = p;
    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'margin = ' + (good ? f4(bd.m * 2) : 'no separation'), 14, 30,
             quality > 0.995 ? COL.green : COL.accent);
    haloText(ctx, 'best possible = ' + f4(SMARGIN * 2), 14, 48, 'rgba(230,237,243,.45)');
    ovRaf = requestAnimationFrame(loop);
  };
  ovRaf = requestAnimationFrame(loop);
}

/* ═══ PANEL 1: the idea ═══ */
function drawIdea() {
  const deg = +$('id-a').value;
  $('id-av').textContent = deg + '°';
  const theta = deg * Math.PI / 180;
  const bd = bandFor(theta);
  const ok = bd.sep && bd.m > 0;
  $('out-idea').textContent =
`boundary angle = ${deg}deg     normal w = (${f3(bd.nx)}, ${f3(bd.ny)})
separates the two groups : ${ok ? 'YES' : 'NO  - it cuts through a group'}
closest point on each side: A ${ok ? '(' + bd.svA + ')' : '-'}   B ${ok ? '(' + bd.svB + ')' : '-'}
margin (full corridor)   : ${ok ? f4(bd.m * 2) : '-'}          best possible = ${f4(SMARGIN * 2)}`;

  const sweep = consumeFresh();
  const render = t => {
    const p = plotSetup('cv-idea', -0.4, 8.4, -0.4, 8.4, 1, 1);
    axLabels(p, 'x', 'y');
    if (ok) {
      fillBand(p, bd.nx, bd.ny, bd.c, bd.m * t, 'rgba(250,204,21,.10)');
      strokeHyper(p, bd.nx, bd.ny, bd.c - bd.m * t, 'rgba(250,204,21,.55)', 1.6, [6, 5]);
      strokeHyper(p, bd.nx, bd.ny, bd.c + bd.m * t, 'rgba(250,204,21,.55)', 1.6, [6, 5]);
    }
    strokeHyper(p, bd.nx, bd.ny, bd.c, ok ? COL.text : COL.red, 2.6);
    for (const q of GA) plotPoint(p, q[0], q[1], COL.red, null, 6);
    for (const q of GB) plotPoint(p, q[0], q[1], COL.blue, null, 6);
    const { ctx } = p;
    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, ok ? 'margin = ' + f4(bd.m * 2) : 'this line does not separate', 14, 30,
             ok ? (bd.m > SMARGIN - 1e-4 ? COL.green : COL.accent) : COL.red);
  };
  if (sweep) animate('idea', 500, render); else render(1);
}

let ideaTimer = null;
function sweepIdea() {
  if (ideaTimer) { clearInterval(ideaTimer); ideaTimer = null; }
  let d = 0;
  ideaTimer = setInterval(() => {
    $('id-a').value = d; drawIdea();
    d += 2;
    if (d > 179) { clearInterval(ideaTimer); ideaTimer = null;
      $('id-a').value = Math.round(((STHETA * 180 / Math.PI) + 180) % 180); drawIdea(); }
  }, 26);
}

/* ═══ PANEL 2: the hyperplane ═══ */
function drawPlane() {
  const w1 = +$('hp-w1').value, w2 = +$('hp-w2').value, b = +$('hp-b').value;
  const px = +$('hp-px').value, py = +$('hp-py').value;
  $('hp-w1v').textContent = w1.toFixed(1); $('hp-w2v').textContent = w2.toFixed(1);
  $('hp-bv').textContent = b.toFixed(1);
  $('hp-pxv').textContent = px.toFixed(1); $('hp-pyv').textContent = py.toFixed(1);
  const norm = Math.hypot(w1, w2);
  const val = w1 * px + w2 * py + b;
  const side = Math.abs(val) < 1e-9 ? 'ON the surface' : (val > 0 ? 'the POSITIVE side' : 'the NEGATIVE side');
  $('out-plane').textContent =
`the surface : ${w1.toFixed(1)}*x1 ${w2 < 0 ? '-' : '+'} ${Math.abs(w2).toFixed(1)}*x2 ${b < 0 ? '-' : '+'} ${Math.abs(b).toFixed(1)} = 0
w = (${w1.toFixed(1)}, ${w2.toFixed(1)})     ||w|| = ${f4(norm)}     b = ${b.toFixed(1)}

probe x = (${px.toFixed(1)}, ${py.toFixed(1)})
w . x + b = ${w1.toFixed(1)}*${px.toFixed(1)} + ${w2.toFixed(1)}*${py.toFixed(1)} + ${b.toFixed(1)} = ${sgn(val)}
--> the point is on ${side}`;

  const render = () => {
    const p = plotSetup('cv-plane', -7, 7, -7, 7, 2, 2);
    axLabels(p, 'x1', 'x2');
    if (norm > 1e-6) {
      fillSide(p, w1, w2, b, +1, 'rgba(59,130,246,.10)');
      fillSide(p, w1, w2, b, -1, 'rgba(244,63,94,.10)');
      strokeHyper(p, w1, w2, b, COL.text, 2.6);
      /* the normal vector w, drawn from the foot of the perpendicular through the origin */
      const ux = w1 / norm, uy = w2 / norm;
      const fx = -b / norm * ux, fy = -b / norm * uy;
      const { ctx, sx, sy } = p;
      const tipx = fx + ux * 2.2, tipy = fy + uy * 2.2;
      ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = COL.purple; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx(fx), sy(fy)); ctx.lineTo(sx(tipx), sy(tipy)); ctx.stroke();
      const ang = Math.atan2(sy(tipy) - sy(fy), sx(tipx) - sx(fx));
      ctx.beginPath(); ctx.moveTo(sx(tipx), sy(tipy));
      ctx.lineTo(sx(tipx) - 11 * Math.cos(ang - .4), sy(tipy) - 11 * Math.sin(ang - .4));
      ctx.lineTo(sx(tipx) - 11 * Math.cos(ang + .4), sy(tipy) - 11 * Math.sin(ang + .4));
      ctx.closePath(); ctx.fillStyle = COL.purple; ctx.fill(); ctx.restore();
      ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      haloText(ctx, 'w', sx(tipx) + 8, sy(tipy), COL.purple);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = 'bold 11px Courier New';
      haloText(ctx, '+ side', 14, 30, COL.blue);
      haloText(ctx, '- side', 14, 46, COL.red);
    }
    plotQuery(p, px, py, val >= 0 ? COL.blue : COL.red, sgn(val), 6, 10);
  };
  render();
}

/* ═══ PANEL 3: distance to the plane ═══ */
const DW1 = 2, DW2 = -3, DB = 6;                       // 2x1 - 3x2 + 6 = 0
function drawDist() {
  const px = +$('ds-x').value, py = +$('ds-y').value;
  $('ds-xv').textContent = px.toFixed(1); $('ds-yv').textContent = py.toFixed(1);
  const num = DW1 * px + DW2 * py + DB;
  const den = Math.hypot(DW1, DW2);
  const sd = num / den;
  /* foot of the perpendicular */
  const fx = px - sd * DW1 / den, fy = py - sd * DW2 / den;
  $('out-dist').textContent =
`the plane   : 2*x1 - 3*x2 + 6 = 0        w = (2, -3)   b = 6
||w||       : sqrt(2^2 + (-3)^2) = sqrt(13) = ${f4(den)}

numerator   : 2*${px.toFixed(1)} - 3*${py.toFixed(1)} + 6 = ${sgn(num)}
signed dist : ${sgn(num)} / ${f4(den)} = ${sgn(sd)}
abs  dist   : ${f4(Math.abs(sd))}
--> the point is ${Math.abs(sd) < 1e-9 ? 'exactly ON the plane' : (sd > 0 ? 'ABOVE the plane (positive side)' : 'BELOW the plane (negative side)')}`;

  const sweep = consumeFresh();
  const render = t => {
    const p = plotSetup('cv-dist', -7, 7, -7, 7, 2, 2);
    axLabels(p, 'x1', 'x2');
    fillSide(p, DW1, DW2, DB, +1, 'rgba(59,130,246,.07)');
    fillSide(p, DW1, DW2, DB, -1, 'rgba(244,63,94,.07)');
    strokeHyper(p, DW1, DW2, DB, COL.text, 2.6);
    const { ctx, sx, sy } = p;
    /* the perpendicular drop, drawn growing */
    ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = COL.green; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(sx(px), sy(py));
    ctx.lineTo(sx(px + (fx - px) * t), sy(py + (fy - py) * t)); ctx.stroke(); ctx.restore();
    plotPoint(p, fx, fy, COL.green, null, 4.5);
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    haloText(ctx, 'd = ' + f3(Math.abs(sd)), (sx(px) + sx(fx)) / 2 + 6, (sy(py) + sy(fy)) / 2 - 6, COL.green);
    plotQuery(p, px, py, sd >= 0 ? COL.blue : COL.red, null, 6, 10);
    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'signed = ' + sgn(sd), 14, 30, sd >= 0 ? COL.blue : COL.red);
  };
  if (sweep) animate('dist', 520, render); else render(1);
}

/* ══════════════════════════════════════════════════════════════════
   A real SVM solver — simplified SMO. Used by the soft-margin slide
   and by the kernel playground, so those boundaries are genuine.
   ══════════════════════════════════════════════════════════════════ */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const KERNELS = {
  linear:  (g, d, r) => (u, v) => u[0] * v[0] + u[1] * v[1],
  poly:    (g, d, r) => (u, v) => Math.pow(g * (u[0] * v[0] + u[1] * v[1]) + r, d),
  rbf:     (g, d, r) => (u, v) => Math.exp(-g * ((u[0] - v[0]) ** 2 + (u[1] - v[1]) ** 2)),
  sigmoid: (g, d, r) => (u, v) => Math.tanh(g * (u[0] * v[0] + u[1] * v[1]) + r)
};

function smoTrain(X, y, C, kfn) {
  const n = X.length;
  const K = [];
  for (let i = 0; i < n; i++) K.push(new Float64Array(n));
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) { const v = kfn(X[i], X[j]); K[i][j] = v; K[j][i] = v; }

  const a = new Float64Array(n);
  let b = 0;
  const rand = mulberry32(12345);
  const f = i => { let s = b; for (let j = 0; j < n; j++) if (a[j] !== 0) s += a[j] * y[j] * K[j][i]; return s; };

  const tol = 1e-3, maxPasses = 6, maxIter = 900;
  let passes = 0, iter = 0;
  while (passes < maxPasses && iter++ < maxIter) {
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const Ei = f(i) - y[i];
      if (!((y[i] * Ei < -tol && a[i] < C) || (y[i] * Ei > tol && a[i] > 0))) continue;
      const j = (i + 1 + Math.floor(rand() * (n - 1))) % n;
      const Ej = f(j) - y[j];
      const ai = a[i], aj = a[j];
      let L, H;
      if (y[i] !== y[j]) { L = Math.max(0, aj - ai); H = Math.min(C, C + aj - ai); }
      else               { L = Math.max(0, ai + aj - C); H = Math.min(C, ai + aj); }
      if (H - L < 1e-12) continue;
      const eta = 2 * K[i][j] - K[i][i] - K[j][j];
      if (eta >= -1e-12) continue;
      let ajn = aj - y[j] * (Ei - Ej) / eta;
      ajn = Math.min(H, Math.max(L, ajn));
      if (Math.abs(ajn - aj) < 1e-6) continue;
      const ain = ai + y[i] * y[j] * (aj - ajn);
      a[i] = ain; a[j] = ajn;
      const b1 = b - Ei - y[i] * (ain - ai) * K[i][i] - y[j] * (ajn - aj) * K[i][j];
      const b2 = b - Ej - y[i] * (ain - ai) * K[i][j] - y[j] * (ajn - aj) * K[j][j];
      if (ain > 1e-8 && ain < C - 1e-8)      b = b1;
      else if (ajn > 1e-8 && ajn < C - 1e-8) b = b2;
      else                                    b = (b1 + b2) / 2;
      changed++;
    }
    passes = changed === 0 ? passes + 1 : 0;
  }

  const sv = [];
  for (let i = 0; i < n; i++) if (a[i] > 1e-6) sv.push(i);
  const decide = x => { let s = b; for (const i of sv) s += a[i] * y[i] * kfn(X[i], x); return s; };
  /* the explicit w only exists for a linear kernel */
  let w = null;
  if (kfn === LINEAR_K) {
    w = [0, 0];
    for (const i of sv) { w[0] += a[i] * y[i] * X[i][0]; w[1] += a[i] * y[i] * X[i][1]; }
  }
  return { a, b, sv, decide, w };
}
const LINEAR_K = KERNELS.linear(1, 1, 0);

/* ═══ PANEL 8: SVC ═══ */
function drawSvc() {
  const qx = +$('sv-x').value, qy = +$('sv-y').value;
  $('sv-xv').textContent = qx.toFixed(1); $('sv-yv').textContent = qy.toFixed(1);
  const raw = SW[0] * qx + SW[1] * qy + SB;
  const sd = raw / SNORM;
  const pred = raw >= 0 ? 1 : 0;
  const zone = Math.abs(raw) < 1 ? 'INSIDE the margin corridor' : 'outside the corridor';
  $('out-svc').textContent =
`w = [0.58824, 0.35294]    b = -3.70588    ||w|| = ${f4(SNORM)}
support vectors: (2.5, 3.5) and (5.0, 5.0)      margin = ${f4(2 * SMARGIN)}

new point (${qx.toFixed(1)}, ${qy.toFixed(1)})
decision_function = 0.58824*${qx.toFixed(1)} + 0.35294*${qy.toFixed(1)} - 3.70588 = ${sgn(raw)}
signed distance   = ${sgn(raw)} / ${f4(SNORM)} = ${sgn(sd)}
predict           = ${pred}   (group ${pred ? 'B' : 'A'})   -   ${zone}`;

  const sweep = consumeFresh();
  const render = t => {
    const p = plotSetup('cv-svc', -0.4, 8.4, -0.4, 8.4, 1, 1);
    axLabels(p, 'x', 'y');
    fillSide(p, SW[0], SW[1], SB, +1, 'rgba(59,130,246,.07)');
    fillSide(p, SW[0], SW[1], SB, -1, 'rgba(244,63,94,.07)');
    fillBand(p, SW[0], SW[1], SB, SMARGIN * t, 'rgba(250,204,21,.09)');
    strokeHyper(p, SW[0], SW[1], SB + t, 'rgba(230,237,243,.6)', 1.6, [6, 5]);
    strokeHyper(p, SW[0], SW[1], SB - t, 'rgba(230,237,243,.6)', 1.6, [6, 5]);
    strokeHyper(p, SW[0], SW[1], SB, COL.text, 2.6);
    for (const q of GA) plotPoint(p, q[0], q[1], COL.red, null, 6);
    for (const q of GB) plotPoint(p, q[0], q[1], COL.blue, null, 6);
    ringPoint(p, 2.5, 3.5, 11); ringPoint(p, 5, 5, 11);
    plotQuery(p, qx, qy, COL.accent, 'predict ' + pred, 6, 11);
    const { ctx } = p;
    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, 'decision_function = ' + sgn(raw), 14, 30, raw >= 0 ? COL.blue : COL.red);
  };
  if (sweep) animate('svc', 560, render); else render(1);
}

/* ═══ PANEL 9: the lift ═══ */
const LIFT_A = [-0.9, -0.55, -0.15, 0.3, 0.75];               // middle class
const LIFT_B = [-2.6, -2.15, -1.75, 1.7, 2.2, 2.55];          // outside class
function drawLift() {
  const t = +$('lf-t').value / 100;
  $('lf-tv').textContent = Math.round(t * 100) + '%';
  const cut = 1.35;
  const sepNow = t > 0.02 && LIFT_A.every(x => x * x * t < cut) && LIFT_B.every(x => x * x * t > cut);
  $('out-lift').textContent =
`lift = ${(t * 100).toFixed(0)}%     new coordinate:  y = ${t.toFixed(2)} * x^2

at 0%   every point sits on one line - no single cut separates A from B
at 100% class A stays low, class B is thrown high, and a flat line at y = ${cut} splits them
--> separable by a straight boundary: ${sepNow ? 'YES' : 'NO'}`;

  const render = () => {
    const p = plotSetup('cv-lift', -3.2, 3.2, -1.2, 7.4, 1, 1);
    axLabels(p, 'x', 'x²  (the new coordinate)');
    const { ctx, sx, sy } = p;
    if (t > 0.02) {
      ctx.save(); ctx.setLineDash([6, 5]);
      ctx.strokeStyle = sepNow ? COL.green : 'rgba(230,237,243,.35)';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, sy(cut)); ctx.lineTo(p.W, sy(cut)); ctx.stroke(); ctx.restore();
      /* the parabola the points are travelling along */
      ctx.save(); ctx.strokeStyle = 'rgba(250,204,21,.22)'; ctx.lineWidth = 1.6; ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) { const x = -3.2 + i * 6.4 / 90; const yv = x * x * t;
        if (i === 0) ctx.moveTo(sx(x), sy(yv)); else ctx.lineTo(sx(x), sy(yv)); }
      ctx.stroke(); ctx.restore();
    }
    for (const x of LIFT_A) plotPoint(p, x, x * x * t, COL.red, null, 6);
    for (const x of LIFT_B) plotPoint(p, x, x * x * t, COL.blue, null, 6);
    ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    haloText(ctx, sepNow ? 'a straight line separates them' : 'no straight line works yet',
             14, 30, sepNow ? COL.green : COL.red);
  };
  render();
}

let liftTimer = null;
function playLift() {
  if (liftTimer) { clearInterval(liftTimer); liftTimer = null; }
  let v = 0;
  $('lf-t').value = 0; drawLift();
  liftTimer = setInterval(() => {
    v += 2; $('lf-t').value = Math.min(100, v); drawLift();
    if (v >= 100) { clearInterval(liftTimer); liftTimer = null; }
  }, 24);
}

/* ═══ PANEL 10: the kernel playground ═══ */
let kpData = 'blobs', kpKern = 'linear';
function setKData(d) {
  kpData = d;
  [...$('kp-data').children].forEach(b => b.classList.toggle('on', b.textContent === d));
  drawKPlay();
}
function setKKern(k) {
  kpKern = k;
  [...$('kp-kern').children].forEach(b => b.classList.toggle('on', b.textContent === k));
  drawKPlay();
}

const DATASETS = {};
function buildData(kind) {
  if (DATASETS[kind]) return DATASETS[kind];
  const rnd = mulberry32(99);
  const g = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const X = [], y = [];
  if (kind === 'blobs') {
    for (let i = 0; i < 25; i++) { X.push([-1.15 + g() * 0.5, -0.9 + g() * 0.5]); y.push(-1); }
    for (let i = 0; i < 25; i++) { X.push([1.2 + g() * 0.5, 1.0 + g() * 0.5]); y.push(1); }
  } else if (kind === 'circles') {
    for (let i = 0; i < 26; i++) { const a = rnd() * 6.2832, r = 0.55 + rnd() * 0.35; X.push([r * Math.cos(a), r * Math.sin(a)]); y.push(-1); }
    for (let i = 0; i < 30; i++) { const a = rnd() * 6.2832, r = 1.85 + rnd() * 0.35; X.push([r * Math.cos(a), r * Math.sin(a)]); y.push(1); }
  } else if (kind === 'xor') {
    const cs = [[-1.3, -1.3, -1], [1.3, 1.3, -1], [-1.3, 1.3, 1], [1.3, -1.3, 1]];
    for (const [cx, cy, lab] of cs)
      for (let i = 0; i < 14; i++) { X.push([cx + g() * 0.42, cy + g() * 0.42]); y.push(lab); }
  } else {                                    // moons
    for (let i = 0; i < 28; i++) { const a = Math.PI * i / 27; X.push([1.6 * Math.cos(a) - 0.8 + g() * 0.16, 1.3 * Math.sin(a) - 0.5 + g() * 0.16]); y.push(-1); }
    for (let i = 0; i < 28; i++) { const a = Math.PI * i / 27; X.push([1.6 * Math.cos(a + Math.PI) + 0.8 + g() * 0.16, 1.3 * Math.sin(a + Math.PI) + 0.6 + g() * 0.16]); y.push(1); }
  }
  DATASETS[kind] = { X, y };
  return DATASETS[kind];
}

function drawKPlay() {
  const cv = +$('kp-c').value, gv = +$('kp-g').value, deg = +$('kp-d').value;
  const C = Math.pow(10, cv / 33 - 1.5);            // 0.032 .. 32
  const gamma = Math.pow(10, gv / 40 - 1.3);        // 0.05 .. 5.6
  $('kp-cv').textContent = C < 1 ? C.toFixed(3) : C.toFixed(2);
  $('kp-gv').textContent = gamma < 1 ? gamma.toFixed(3) : gamma.toFixed(2);
  $('kp-dv').textContent = deg;

  const { X, y } = buildData(kpData);
  const kfn = kpKern === 'linear' ? LINEAR_K : KERNELS[kpKern](gamma, deg, 1);
  const model = smoTrain(X, y, C, kfn);

  let right = 0;
  X.forEach((q, i) => { if (model.decide(q) * y[i] > 0) right++; });
  const acc = right / X.length;

  const used = kpKern === 'linear' ? 'C only'
             : kpKern === 'poly'    ? 'C, gamma, degree, coef0=1'
             : kpKern === 'rbf'     ? 'C, gamma'
             : 'C, gamma, coef0=1';
  $('out-kplay').textContent =
`SVC(kernel='${kpKern}', C=${C < 1 ? C.toFixed(3) : C.toFixed(2)}${kpKern !== 'linear' ? ', gamma=' + (gamma < 1 ? gamma.toFixed(3) : gamma.toFixed(2)) : ''}${kpKern === 'poly' ? ', degree=' + deg : ''})
dataset : ${kpData}   (${X.length} points)      parameters in play: ${used}
support vectors : ${model.sv.length} of ${X.length}
training accuracy : ${(acc * 100).toFixed(1)}%   (${right}/${X.length} correct)
${acc < 0.75 ? '--> this kernel cannot describe this boundary. Try rbf.' :
  acc > 0.999 && model.sv.length > X.length * 0.6 ? '--> perfect, but almost every point is a support vector: it is memorizing.' :
  '--> the boundary fits'}`;

  const p = plotSetup('cv-kplay', -3.2, 3.2, -3.0, 3.0, 1, 1);
  const { ctx, sx, sy, W, H } = p;
  /* paint the decision regions in blocks */
  const B = 6;
  for (let px = 0; px < W; px += B) {
    for (let py = 0; py < H; py += B) {
      const x = (px + B / 2) / W * 6.4 - 3.2;
      const yv = 3.0 - (py + B / 2) / H * 6.0;
      const d = model.decide([x, yv]);
      const inten = Math.min(1, Math.abs(d) / 1.4);
      const alpha = (0.05 + 0.16 * inten).toFixed(3);
      ctx.fillStyle = d >= 0 ? `rgba(59,130,246,${alpha})` : `rgba(244,63,94,${alpha})`;
      ctx.fillRect(px, py, B, B);
    }
  }
  /* trace the boundary by marching along zero crossings of the block grid */
  ctx.save(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(230,237,243,.85)'; ctx.lineWidth = 2;
  for (let px = 0; px < W - B; px += B) {
    for (let py = 0; py < H - B; py += B) {
      const X0 = px / W * 6.4 - 3.2, Y0 = 3.0 - py / H * 6.0;
      const X1 = (px + B) / W * 6.4 - 3.2, Y1 = 3.0 - (py + B) / H * 6.0;
      const d00 = model.decide([X0, Y0]), d10 = model.decide([X1, Y0]), d01 = model.decide([X0, Y1]);
      if (d00 * d10 < 0) { ctx.beginPath(); ctx.moveTo(px + B / 2, py); ctx.lineTo(px + B / 2, py + B); ctx.stroke(); }
      if (d00 * d01 < 0) { ctx.beginPath(); ctx.moveTo(px, py + B / 2); ctx.lineTo(px + B, py + B / 2); ctx.stroke(); }
    }
  }
  ctx.restore();
  axLabels(p, 'x1', 'x2');
  X.forEach((q, i) => plotPoint(p, q[0], q[1], y[i] > 0 ? COL.blue : COL.red, null, 5));
  for (const i of model.sv) ringPoint(p, X[i][0], X[i][1], 9);
  ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, kpKern + '  ·  accuracy ' + (acc * 100).toFixed(1) + '%', 14, 30,
           acc > 0.95 ? COL.green : acc > 0.8 ? COL.accent : COL.red);
  haloText(ctx, model.sv.length + ' support vectors', 14, 48, 'rgba(230,237,243,.5)');
}

/* ═══ PANEL 11: the threshold and the confusion matrix ═══ */
function drawEval() {
  const th = +$('ev-t').value / 10;
  $('ev-tv').textContent = th.toFixed(2);
  const scores = ALL.map(q => SW[0] * q[0] + SW[1] * q[1] + SB);
  let tp = 0, tn = 0, fp = 0, fn = 0;
  scores.forEach((s, i) => {
    const pred = s > th ? 1 : 0;
    if (LAB[i] === 1 && pred === 1) tp++;
    else if (LAB[i] === 0 && pred === 0) tn++;
    else if (LAB[i] === 0 && pred === 1) fp++;
    else fn++;
  });
  const acc = (tp + tn) / 8;
  const prec = tp + fp ? tp / (tp + fp) : 0;
  const rec = tp + fn ? tp / (tp + fn) : 0;
  const f1 = prec + rec ? 2 * prec * rec / (prec + rec) : 0;
  $('out-eval').textContent =
`threshold = ${th.toFixed(2)}       predict 1 when decision_function > threshold

confusion matrix        predicted 0   predicted 1
             actual 0   ${String(tn).padStart(9)} ${String(fp).padStart(13)}
             actual 1   ${String(fn).padStart(9)} ${String(tp).padStart(13)}

accuracy  = ${acc.toFixed(3)}      precision = ${prec.toFixed(3)}
recall    = ${rec.toFixed(3)}      f1-score  = ${f1.toFixed(3)}`;

  const p = plotSetup('cv-eval', -4.2, 4.2, -0.6, 1.6, 1, 1);
  axLabels(p, 'decision_function value', 'class');
  const { ctx, sx, sy } = p;
  ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(sx(th), 0); ctx.lineTo(sx(th), p.H); ctx.stroke(); ctx.restore();
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  haloText(ctx, 'threshold', sx(th), 8, COL.accent);
  scores.forEach((s, i) => {
    const pred = s > th ? 1 : 0;
    const correct = pred === LAB[i];
    plotPoint(p, s, LAB[i], LAB[i] ? COL.blue : COL.red, null, 6.5);
    if (!correct) ringPoint(p, s, LAB[i], 10, COL.red);
  });
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  haloText(ctx, 'class 1', 8, sy(1), 'rgba(59,130,246,.6)');
  haloText(ctx, 'class 0', 8, sy(0), 'rgba(244,63,94,.6)');
  ctx.textBaseline = 'top';
  haloText(ctx, 'accuracy = ' + acc.toFixed(3), sx(th) + 12, 30, acc === 1 ? COL.green : COL.red);
}

/* ══════════ boot ══════════ */
updateDots();
setTimeout(drawOverview, 90);

window.addEventListener('resize', () => {
  const redraw = [null, drawIdea, drawPlane, drawDist, null, null, null,
                  null, drawSvc, drawLift, drawKPlay, drawEval, null, null, null, null, null];
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
