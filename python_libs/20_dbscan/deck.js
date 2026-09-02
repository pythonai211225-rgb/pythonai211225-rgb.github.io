/* ══════════════════════════════════════════════════════════════════
   DBSCAN — deck 20

   The overview animation is a real DBSCAN. The two crescents are
   generated deterministically, then dbscan() below runs the genuine
   algorithm on them: it counts neighbours inside eps, promotes core
   points, and grows each cluster through a breadth-first queue of
   core points exactly the way the real one does. What you watch is
   the expansion frontier — the ε circle sitting on the core point
   currently being expanded — so the crescent really is being traced
   one small step at a time, and the grey points at the end really
   are the ones nothing could reach.
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

/* ══════════ the data and the algorithm ══════════ */

const COL = { surface:'#060a10', grid:'rgba(230,237,243,.07)',
              text:'#e6edf3', muted:'rgba(230,237,243,.45)',
              unvisited:'rgba(230,237,243,.28)', noise:'rgba(230,237,243,.22)' };
const CLUSTER_COL = ['#10b981', '#f43f5e', '#facc15', '#3b82f6'];

/* a tiny seeded PRNG so the picture is the same on every load */
let _seed = 20260902;
function rnd() { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }

function makeMoons(n, noise) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI * i / (n - 1);
    pts.push([Math.cos(a) + (rnd() - 0.5) * noise,
              Math.sin(a) + (rnd() - 0.5) * noise]);
  }
  for (let i = 0; i < n; i++) {
    const a = Math.PI * i / (n - 1);
    pts.push([1 - Math.cos(a) + (rnd() - 0.5) * noise,
              0.5 - Math.sin(a) + (rnd() - 0.5) * noise]);
  }
  return pts;
}

const PTS = makeMoons(46, 0.14);
/* a handful of genuine outliers, scattered clear of both crescents */
[[-0.9, 1.15], [2.0, 1.0], [0.5, 1.35], [1.45, -1.0], [-0.75, -0.75]]
  .forEach(p => PTS.push(p));

const EPS = 0.22, MINPTS = 3;

function neighbours(i) {
  const out = [];
  for (let j = 0; j < PTS.length; j++) {
    if (Math.hypot(PTS[i][0] - PTS[j][0], PTS[i][1] - PTS[j][1]) <= EPS) out.push(j);
  }
  return out;
}

/* the real algorithm, recording every expansion step so it can be replayed */
function dbscan() {
  const label = new Array(PTS.length).fill(undefined); // undefined = unvisited
  const steps = [];                                     // {centre, joined[], cluster}
  let cid = -1;
  for (let i = 0; i < PTS.length; i++) {
    if (label[i] !== undefined) continue;
    const nb = neighbours(i);
    if (nb.length < MINPTS) { label[i] = -1; continue; }   // noise, for now
    cid++;
    label[i] = cid;
    const queue = nb.filter(j => j !== i);
    queue.forEach(j => { if (label[j] === undefined || label[j] === -1) label[j] = cid; });
    steps.push({ centre: i, joined: nb.slice(), cluster: cid });
    for (let q = 0; q < queue.length; q++) {
      const j = queue[q];
      const nb2 = neighbours(j);
      if (nb2.length >= MINPTS) {                          // j is a core point too
        const fresh = [];
        for (const k of nb2) {
          if (label[k] === undefined || label[k] === -1) { label[k] = cid; queue.push(k); fresh.push(k); }
        }
        steps.push({ centre: j, joined: nb2.slice(), cluster: cid });
      }
    }
  }
  return { label, steps };
}

const RUN = dbscan();

function canvasSetup(cvId, height) {
  const cv = $(cvId); if (!cv) return null;
  const ctx = cv.getContext('2d');
  cv.width = Math.min(cv.parentElement.clientWidth - 28 || 620, 760);
  if (height) cv.height = height;
  return { cv, ctx };
}

function drawOverview(stepIdx, pulse) {
  const setup = canvasSetup('cv-overview', 320); if (!setup) return;
  const { cv, ctx } = setup;
  const W = cv.width, H = cv.height;
  ctx.fillStyle = COL.surface; ctx.fillRect(0, 0, W, H);

  const xs = PTS.map(p => p[0]), ys = PTS.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = 40;
  const scale = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
  const px = v => pad + (v - x0) * scale + (W - pad * 2 - (x1 - x0) * scale) / 2;
  const py = v => H - pad - (v - y0) * scale - (H - pad * 2 - (y1 - y0) * scale) / 2;

  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  for (let g = 0; g <= 6; g++) {
    const gx = pad + g / 6 * (W - pad * 2), gy = pad + g / 6 * (H - pad * 2);
    ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, H - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
  }

  /* replay the run up to stepIdx */
  const label = new Array(PTS.length).fill(undefined);
  for (let s = 0; s < stepIdx && s < RUN.steps.length; s++) {
    const st = RUN.steps[s];
    label[st.centre] = st.cluster;
    for (const j of st.joined) if (label[j] === undefined) label[j] = st.cluster;
  }
  const finished = stepIdx >= RUN.steps.length;

  /* the epsilon circle on the point currently being expanded */
  if (!finished && stepIdx > 0) {
    const st = RUN.steps[stepIdx - 1];
    const c = PTS[st.centre];
    ctx.strokeStyle = CLUSTER_COL[st.cluster % CLUSTER_COL.length];
    ctx.fillStyle = ctx.strokeStyle;
    ctx.globalAlpha = 0.10 + 0.05 * pulse; ctx.beginPath();
    ctx.arc(px(c[0]), py(c[1]), EPS * scale, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.85; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  PTS.forEach((p, i) => {
    let col = COL.unvisited, r = 4;
    if (finished) {
      col = RUN.label[i] === -1 ? COL.noise : CLUSTER_COL[RUN.label[i] % CLUSTER_COL.length];
      if (RUN.label[i] === -1) r = 3.4;
    } else if (label[i] !== undefined) {
      col = CLUSTER_COL[label[i] % CLUSTER_COL.length]; r = 4.6;
    }
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(px(p[0]), py(p[1]), r, 0, 7); ctx.fill();
  });

  /* noise crosses, once the run is over */
  if (finished) {
    ctx.strokeStyle = COL.noise; ctx.lineWidth = 1.4;
    PTS.forEach((p, i) => {
      if (RUN.label[i] !== -1) return;
      const X = px(p[0]), Y = py(p[1]);
      ctx.beginPath(); ctx.moveTo(X - 5, Y - 5); ctx.lineTo(X + 5, Y + 5);
      ctx.moveTo(X + 5, Y - 5); ctx.lineTo(X - 5, Y + 5); ctx.stroke();
    });
  }

  ctx.font = '700 12px Segoe UI, sans-serif';
  if (finished) {
    const noise = RUN.label.filter(l => l === -1).length;
    const clusters = new Set(RUN.label.filter(l => l >= 0)).size;
    ctx.fillStyle = COL.text;
    ctx.fillText(clusters + ' clusters found', pad, 24);
    ctx.fillStyle = COL.muted;
    ctx.fillText(noise + ' points labelled -1 (noise)', pad, 40);
  } else {
    const done = RUN.label.filter((l, i) => label[i] !== undefined).length;
    ctx.fillStyle = COL.text;
    ctx.fillText('expanding… ' + done + ' / ' + PTS.length + ' points reached', pad, 24);
    ctx.fillStyle = COL.muted;
    ctx.fillText('ε = ' + EPS + '   MinPts = ' + MINPTS, pad, 40);
  }
}

function runOverview() {
  stopRaf(0);
  let step = 0, tick = 0, holding = 0, pulse = 0;
  (function frame() {
    pulse = (Math.sin(tick / 6) + 1) / 2;
    if (holding > 0) {
      holding--;
      if (holding === 0) step = 0;
    } else {
      tick++;
      if (tick % 4 === 0) {
        step++;
        if (step > RUN.steps.length) { step = RUN.steps.length; holding = 170; }
      }
    }
    drawOverview(step, pulse);
    RAF[0] = requestAnimationFrame(frame);
  })();
}

const DRAWS = { 0: runOverview };

window.addEventListener('load', () => { updateDots(); fitMath(); runOverview(); });
window.addEventListener('resize', () => { fitMath(); if (current === 0) runOverview(); });
updateDots();
