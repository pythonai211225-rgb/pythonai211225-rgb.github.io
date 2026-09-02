/* ══════════════════════════════════════════════════════════════════
   Gradio — deck 21

   Two live mock-ups on this deck, both driven by real code:

   • The salary app in panel 00 is the actual app from
     02_gradio_linear.py, reimplemented in the browser. fitOLS()
     below runs a genuine least-squares fit on the same ten rows the
     Python file trains on, so the line, the prediction and the
     numbers on screen are the ones the real model produces — the
     slider is doing what the Python slider does.

   • The chat in panel 05 replays a streamed answer character by
     character, which is what `yield` looks like from the user's side.
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

/* ══════════ the model behind the mock ══════════ */

/* exactly the arrays in 02_gradio_linear.py */
const TRAIN_X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TRAIN_Y = [3200, 3800, 4500, 5100, 5900, 6500, 7200, 7900, 8500, 9300];

function fitOLS(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const b1 = sxy / sxx;
  return { b1, b0: my - b1 * mx };
}
const MODEL = fitOLS(TRAIN_X, TRAIN_Y);
const predict = x => MODEL.b0 + MODEL.b1 * x;

function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

/* The salary app appears twice — in the overview and beside its own
   source in panel 03 — so everything below is scoped to a container
   rather than to an id, and both copies run independently. */

function drawSalaryPlot(app, years) {
  const cv = app.querySelector('.gr-canvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width = Math.max(cv.parentElement.clientWidth - 26, 240);
  const W = cv.width, H = cv.height;

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  const padL = 52, padR = 14, padT = 14, padB = 30;
  const X0 = 0, X1 = 12, Y0 = 2000, Y1 = 10500;
  const px = v => padL + (v - X0) / (X1 - X0) * (W - padL - padR);
  const py = v => H - padB - (v - Y0) / (Y1 - Y0) * (H - padT - padB);

  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
  ctx.font = '9px Segoe UI, sans-serif';
  for (let g = 2000; g <= 10000; g += 2000) {
    ctx.beginPath(); ctx.moveTo(padL, py(g)); ctx.lineTo(W - padR, py(g)); ctx.stroke();
    ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'right';
    ctx.fillText((g / 1000) + 'k', padL - 6, py(g) + 3);
  }
  ctx.textAlign = 'center';
  for (let g = 0; g <= 12; g += 3) {
    ctx.fillStyle = '#9ca3af'; ctx.fillText(g, px(g), H - padB + 14);
  }
  ctx.strokeStyle = '#374151'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

  ctx.strokeStyle = '#ff7c00'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(px(0), py(predict(0))); ctx.lineTo(px(12), py(predict(12))); ctx.stroke();

  ctx.fillStyle = '#3b82f6';
  TRAIN_X.forEach((x, i) => { ctx.beginPath(); ctx.arc(px(x), py(TRAIN_Y[i]), 3.6, 0, 7); ctx.fill(); });

  const p = predict(years);
  ctx.strokeStyle = 'rgba(16,185,129,.55)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(px(years), H - padB); ctx.lineTo(px(years), py(p));
  ctx.lineTo(padL, py(p)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(px(years), py(p), 6.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

  ctx.fillStyle = '#374151'; ctx.font = '600 10px Segoe UI, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Salary Prediction', padL + 6, padT + 10);
}

function setYears(app, v, fromUser) {
  const years = Math.min(12, Math.max(0, Math.round(v * 2) / 2));
  const sl = app.querySelector('.gr-slider');
  const nb = app.querySelector('.gr-num');
  const out = app.querySelector('.gr-salary');
  if (sl) sl.value = years;
  if (nb && document.activeElement !== nb) nb.value = years;
  if (out) out.textContent = money(predict(years));
  drawSalaryPlot(app, years);
  if (fromUser) { app.dataset.touched = '1'; stopRaf(app.dataset.raf); }
}

/* on entering a panel the slider sweeps itself once, so the page
   demonstrates the interaction before the reader touches anything.
   The first real interaction cancels it for good. */
function sweepSlider(app) {
  const key = app.dataset.raf;
  stopRaf(key);
  if (app.dataset.touched) return;
  let t = 0;
  (function frame() {
    if (app.dataset.touched) return;
    t += 0.012;
    if (t >= 1) { setYears(app, 5, false); return; }
    setYears(app, 0.5 + (1 - Math.cos(t * Math.PI * 2)) / 2 * 11, false);
    RAF[key] = requestAnimationFrame(frame);
  })();
}

let _rafKey = 90;
function initSalaryApp() {
  document.querySelectorAll('.gr-salary-app').forEach(app => {
    if (!app.dataset.raf) app.dataset.raf = 'gr' + (_rafKey++);
    const sl = app.querySelector('.gr-slider');
    if (!sl) return;
    if (!app.dataset.bound) {
      app.dataset.bound = '1';
      sl.addEventListener('input', e => setYears(app, +e.target.value, true));
      const nb = app.querySelector('.gr-num');
      if (nb) nb.addEventListener('input', e => setYears(app, +e.target.value || 0, true));
      const sub = app.querySelector('.gr-submit');
      if (sub) sub.addEventListener('click', () => { setYears(app, +sl.value, true); flash(sub); });
      const clr = app.querySelector('.gr-clear');
      if (clr) clr.addEventListener('click', () => { app.dataset.touched = '1'; setYears(app, 5, true); });
    }
    setYears(app, +sl.value, false);
    sweepSlider(app);
  });
}

function flash(btn) {
  const old = btn.textContent;
  btn.textContent = 'Running…';
  setTimeout(() => btn.textContent = old, 420);
}

/* ══════════ the streaming chat mock ══════════ */

const ANSWER =
  "Imagine you're standing between two mirrors. You see yourself, and " +
  "inside that reflection you see yourself again, and again, smaller and " +
  "smaller — that's recursion!\n\n" +
  "In code, it's a function that calls itself on a smaller version of the " +
  "same problem. Two rules keep it from going forever:\n\n" +
  "  1. A base case — the moment you stop (the smallest mirror).\n" +
  "  2. A step that gets closer to it every time.\n\n" +
  "Miss the base case and you get infinite mirrors. Your computer calls " +
  "that a RecursionError. I call it Tuesday.";

function streamAnswer() {
  stopRaf(50);
  const box = $('gr-stream'); if (!box) return;
  let i = 0;
  box.classList.add('typing');
  (function tick() {
    /* a few characters per frame, the way tokens arrive in bursts */
    i = Math.min(ANSWER.length, i + 2 + Math.floor(Math.random() * 4));
    box.textContent = ANSWER.slice(0, i);
    box.scrollTop = box.scrollHeight;
    if (i < ANSWER.length) {
      RAF[50] = requestAnimationFrame(tick);
    } else {
      box.classList.remove('typing');
    }
  })();
}

function initChat() {
  const ask = $('gr-ask');
  if (ask && !ask.dataset.bound) {
    ask.dataset.bound = '1';
    ask.addEventListener('click', () => { flash(ask); streamAnswer(); });
  }
  streamAnswer();
}

const DRAWS = { 0: initSalaryApp, 3: initSalaryApp, 5: initChat };

window.addEventListener('load', () => { updateDots(); fitMath(); initSalaryApp(); });
window.addEventListener('resize', () => {
  fitMath();
  document.querySelectorAll('.gr-salary-app').forEach(app => {
    const sl = app.querySelector('.gr-slider');
    if (sl) drawSalaryPlot(app, +sl.value);
  });
});
updateDots();
