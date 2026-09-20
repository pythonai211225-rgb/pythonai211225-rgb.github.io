/* ══════════════════════════════════════════════════════════════════
   Artificial Neural Networks — deck 01 (Advanced AI)
   Every demo on this page computes real numbers: the neuron demo runs
   the actual weighted-sum + activation, the digit recogniser runs a
   real 64→16→10 MLP trained offline on sklearn's digits dataset
   (96.4% test accuracy, weights baked into digit_net.js), and the XOR
   panel runs a hand-built 2-neuron hidden layer live.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 17;
const LABELS = ['Overview','What is Deep Learning','From neuron to network','The artificial neuron',
                'Activation functions','Weight initialization','Hidden layers & depth','Cost functions',
                'Backpropagation','Gradient descent','TensorFlow & Keras','Code: a 1-neuron ANN',
                'Digit recognizer','Pros & cons','Exercises','A1 · Why depth matters (XOR)','A2 · Keras cheat-sheet'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

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
  const draws = [drawOverview, null, null, drawNeuron, drawActivation, null, null, drawCost,
                 drawBackprop, null, null, null, drawDigit, null, null, drawXor, null];
  if (draws[idx]) setTimeout(draws[idx], 60);
}

/* ══════════ keep display maths inside the panel ══════════ */
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

/* ══════════ shared cartesian plot helper (same contract as the SVM deck) ══════════ */
const COL = { grid:'rgba(231,236,255,.07)', axis:'rgba(231,236,255,.45)', tick:'rgba(231,236,255,.4)',
              accent:'#22d3ee', blue:'#3b82f6', green:'#10b981', red:'#f43f5e', cyan:'#22d3ee',
              orange:'#f97316', purple:'#a78bfa', pink:'#ec4899', text:'#e7ecff', surface:'#020509' };

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

function axLabels(p, xlab, ylab) {
  const { ctx, W } = p;
  ctx.font = 'bold 10px Courier New'; ctx.textBaseline = 'top';
  ctx.textAlign = 'left';  haloText(ctx, ylab, 12, 8, 'rgba(231,236,255,.42)');
  ctx.textAlign = 'right'; haloText(ctx, xlab, W - 8, 8, 'rgba(231,236,255,.42)');
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
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

/* ══════════════════════════════════════════════════════════════════
   ACTIVATION FUNCTIONS — real math, shared by panel 3 (neuron) and 4
   ══════════════════════════════════════════════════════════════════ */
const ACT = {
  step:    { fn: z => z >= 0 ? 1 : 0,              name: 'Step',    formula: '\\phi(z)=\\begin{cases}1 & z\\ge0\\\\0 & z<0\\end{cases}' },
  sigmoid: { fn: z => 1 / (1 + Math.exp(-z)),      name: 'Sigmoid', formula: '\\phi(z)=\\dfrac{1}{1+e^{-z}}' },
  tanh:    { fn: z => Math.tanh(z),                name: 'Tanh',    formula: '\\phi(z)=\\tanh(z)=\\dfrac{e^{z}-e^{-z}}{e^{z}+e^{-z}}' },
  relu:    { fn: z => Math.max(0, z),              name: 'ReLU',    formula: '\\phi(z)=\\max(0,z)' },
  linear:  { fn: z => z,                           name: 'Linear',  formula: '\\phi(z)=z' }
};

/* ═══ PANEL 0: overview — ambient pulsing 4-3-2-1 network ═══ */
function drawOverview() {
  const NODES = [4, 3, 3, 1];
  const start = performance.now();
  const loop = now => {
    const cv = $('cv-overview'), ctx = cv.getContext('2d');
    const wrap = cv.parentElement;
    cv.width = Math.min(wrap.clientWidth - 28 || 560, 640);
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const layerX = NODES.map((_, i) => 40 + i * (W - 80) / (NODES.length - 1));
    const posY = n => { const gap = (H - 60) / (n + 1); return Array.from({length:n}, (_, i) => 30 + gap * (i + 1)); };
    const positions = NODES.map(n => posY(n));
    const t = ((now - start) / 2600) % 1;
    /* draw edges with a travelling pulse */
    for (let l = 0; l < NODES.length - 1; l++) {
      for (let i = 0; i < NODES[l]; i++) {
        for (let j = 0; j < NODES[l + 1]; j++) {
          const x1 = layerX[l], y1 = positions[l][i], x2 = layerX[l + 1], y2 = positions[l + 1][j];
          ctx.strokeStyle = 'rgba(139,148,215,.18)'; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }
    /* pulse: a wave sweeping left to right, layer by layer */
    const wave = t * (NODES.length - 1 + 0.6);
    for (let l = 0; l < NODES.length; l++) {
      const local = Math.max(0, Math.min(1, 1.4 - Math.abs(wave - l) * 2.2));
      for (let i = 0; i < NODES[l]; i++) {
        const x = layerX[l], y = positions[l][i];
        const glow = local;
        if (glow > 0.02) {
          ctx.beginPath(); ctx.arc(x, y, 14 + glow * 10, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34,211,238,${(glow * 0.28).toFixed(3)})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = l === 0 ? '#f97316' : (l === NODES.length - 1 ? '#f43f5e' : `rgba(34,211,238,${(0.55 + glow * 0.45).toFixed(3)})`);
        ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = COL.surface; ctx.stroke();
      }
    }
    ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    haloText(ctx, 'input', layerX[0], H - 22, 'rgba(249,115,22,.85)');
    haloText(ctx, 'hidden', layerX[1], H - 22, 'rgba(34,211,238,.7)');
    haloText(ctx, 'hidden', layerX[2], H - 22, 'rgba(34,211,238,.7)');
    haloText(ctx, 'output', layerX[3], H - 22, 'rgba(244,63,94,.85)');
    ovRaf = requestAnimationFrame(loop);
  };
  ovRaf = requestAnimationFrame(loop);
}

/* ═══ PANEL 3: the artificial neuron ═══ */
function drawNeuron() {
  const x1 = +$('nr-x1').value, x2 = +$('nr-x2').value, x3 = +$('nr-x3').value;
  const w1 = +$('nr-w1').value, w2 = +$('nr-w2').value, w3 = +$('nr-w3').value;
  const b  = +$('nr-b').value;
  ['x1','x2','x3','w1','w2','w3','b'].forEach(k => $('nr-' + k + 'v').textContent = (+$('nr-' + k).value).toFixed(1));
  const z = x1*w1 + x2*w2 + x3*w3 + b;
  const act = ACT[nrAct] || ACT.sigmoid;
  const y = act.fn(z);

  $('out-neuron').textContent =
`z = x1*w1 + x2*w2 + x3*w3 + b
  = ${x1.toFixed(1)}*${w1.toFixed(1)} + ${x2.toFixed(1)}*${w2.toFixed(1)} + ${x3.toFixed(1)}*${w3.toFixed(1)} + ${b.toFixed(1)}
  = ${z.toFixed(3)}

y = ${act.name}(z) = ${y.toFixed(4)}`;

  const cv = $('cv-neuron'), ctx = cv.getContext('2d');
  const wrap = cv.parentElement;
  cv.width = Math.min(wrap.clientWidth - 28 || 560, 640);
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const inX = 70, midX = W * 0.52, outX = W - 60;
  const inY = [H * 0.22, H * 0.5, H * 0.78];
  const vals = [x1, x2, x3], ws = [w1, w2, w3];
  for (let i = 0; i < 3; i++) {
    const wnorm = Math.max(-1, Math.min(1, ws[i] / 4));
    ctx.beginPath(); ctx.moveTo(inX, inY[i]); ctx.lineTo(midX, H / 2);
    ctx.strokeStyle = wnorm >= 0 ? `rgba(16,185,129,${0.25+Math.abs(wnorm)*0.55})` : `rgba(244,63,94,${0.25+Math.abs(wnorm)*0.55})`;
    ctx.lineWidth = 1.4 + Math.abs(wnorm) * 3.2;
    ctx.stroke();
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    haloText(ctx, 'w'+(i+1)+'='+ws[i].toFixed(1), (inX+midX)/2, (inY[i]+H/2)/2 - 10, ws[i]>=0?COL.green:COL.red);
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(inX, inY[i], 20, 0, Math.PI*2);
    ctx.fillStyle = '#f97316'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.stroke();
    ctx.fillStyle = '#0b0f1a'; ctx.font = 'bold 12px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('x'+(i+1), inX, inY[i]);
    ctx.font = 'bold 11px Courier New';
    haloText(ctx, vals[i].toFixed(1), inX - 42, inY[i], 'rgba(249,115,22,.9)');
  }
  /* bias arrow into the neuron */
  ctx.beginPath(); ctx.moveTo(midX, 14); ctx.lineTo(midX, H/2 - 26);
  ctx.strokeStyle = 'rgba(167,139,250,.6)'; ctx.lineWidth = 2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = 'bold 11px Courier New'; ctx.textAlign='center'; ctx.textBaseline='bottom';
  haloText(ctx, 'bias b = '+b.toFixed(1), midX, 12, COL.purple);

  ctx.beginPath(); ctx.arc(midX, H/2, 30, 0, Math.PI*2);
  ctx.fillStyle = '#111a30'; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = COL.accent; ctx.stroke();
  ctx.fillStyle = COL.accent; ctx.font = 'bold 10px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('Σ then φ', midX, H/2);

  ctx.beginPath(); ctx.moveTo(midX+30, H/2); ctx.lineTo(outX-20, H/2);
  ctx.strokeStyle = 'rgba(244,63,94,.7)'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.beginPath(); ctx.arc(outX, H/2, 20, 0, Math.PI*2);
  ctx.fillStyle = '#f43f5e'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = COL.surface; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('y', outX, H/2);
  ctx.font = 'bold 12px Courier New'; ctx.textAlign='left'; ctx.textBaseline='middle';
  haloText(ctx, y.toFixed(3), outX + 26, H/2, '#f43f5e');
}

let nrAct = 'sigmoid';
function setNeuronAct(a, btn) {
  nrAct = a;
  document.querySelectorAll('#neuron-seg button').forEach(b => b.classList.toggle('on', b === btn));
  drawNeuron();
}

/* ═══ PANEL 4: activation function graph + softmax bars ═══ */
let actCur = 'sigmoid';
function setAct(name, btn) {
  actCur = name;
  document.querySelectorAll('#act-seg button').forEach(b => b.classList.toggle('on', b === btn));
  $('act-formula').innerHTML = '$$' + ACT[name].formula + '$$';
  if (window.renderMathInElement) renderMathInElement($('act-formula'), {delimiters:[{left:'$$',right:'$$',display:true}], throwOnError:false});
  drawActivation();
}
function drawActivation() {
  const x = +$('act-x').value; $('act-xv').textContent = x.toFixed(1);
  const f = ACT[actCur];
  const y = f.fn(x);
  $('out-act').textContent = `${f.name}(${x.toFixed(1)}) = ${y.toFixed(4)}`;
  const p = plotSetup('cv-act', -6, 6, -1.6, 1.6, 2, 0.5);
  axLabels(p, 'z', 'φ(z)');
  const { ctx, sx, sy, W } = p;
  ctx.beginPath(); ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.6;
  for (let px = 0; px <= W; px++) {
    const zz = p.XMIN + px / W * (p.XMAX - p.XMIN);
    const yy = f.fn(zz);
    const cy = sy(Math.max(p.YMIN, Math.min(p.YMAX, yy)));
    if (px === 0) ctx.moveTo(px, cy); else ctx.lineTo(px, cy);
  }
  ctx.stroke();
  plotPoint(p, x, Math.max(p.YMIN, Math.min(p.YMAX, y)), COL.orange, null, 6);
  ctx.save(); ctx.setLineDash([4,4]); ctx.strokeStyle='rgba(249,115,22,.5)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(sx(x), sy(y)); ctx.lineTo(sx(x), p.H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx(x), sy(y)); ctx.lineTo(0, sy(y)); ctx.stroke(); ctx.restore();
}

function drawSoftmax() {
  const z = [+$('sm-z1').value, +$('sm-z2').value, +$('sm-z3').value];
  ['1','2','3'].forEach((k,i) => $('sm-z'+k+'v').textContent = z[i].toFixed(1));
  const m = Math.max(...z);
  const exps = z.map(v => Math.exp(v - m));
  const sum = exps.reduce((a,b) => a+b, 0);
  const p = exps.map(v => v / sum);
  $('out-softmax').textContent =
`logits            : [${z.map(v=>v.toFixed(2)).join(', ')}]
exp(z - max)      : [${exps.map(v=>v.toFixed(3)).join(', ')}]
sum of exponents  : ${sum.toFixed(3)}
softmax           : [${p.map(v=>v.toFixed(3)).join(', ')}]   (sums to ${p.reduce((a,b)=>a+b,0).toFixed(3)})`;
  const labels = ['cat', 'dog', 'horse'];
  const colors = [COL.pink, COL.orange, COL.cyan];
  const wrap = $('sm-bars'); wrap.innerHTML = '';
  p.forEach((v, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:10px;';
    row.innerHTML = `<span style="width:44px;font-family:'Courier New',monospace;font-size:.75rem;color:${colors[i]}">${labels[i]}</span>
      <div style="flex:1;background:rgba(255,255,255,.06);border-radius:6px;height:18px;overflow:hidden;">
        <div style="height:100%;width:${(v*100).toFixed(1)}%;background:${colors[i]};transition:width .3s;border-radius:6px;"></div>
      </div>
      <span style="width:56px;text-align:right;font-family:'Courier New',monospace;font-size:.78rem;color:${colors[i]}">${(v*100).toFixed(1)}%</span>`;
    wrap.appendChild(row);
  });
}

/* ═══ PANEL 7: cost functions ═══ */
function drawCost() {
  const p1 = Math.max(0.001, Math.min(0.999, +$('cost-p').value / 100));
  $('cost-pv').textContent = (p1*100).toFixed(0) + '%';
  const ce = -Math.log(p1);
  const mse = (1 - p1) ** 2;
  $('out-cost').textContent =
`if the model gives the TRUE class a probability of ${(p1*100).toFixed(0)}%:

Cross-Entropy = -log(p_true) = -log(${p1.toFixed(2)}) = ${ce.toFixed(3)}
(as if it were squared error) (1-p_true)^2 = ${mse.toFixed(3)}   <- for comparison only, MSE is not used for classification

--> cross-entropy explodes as p_true -> 0 (confidently wrong is punished hard),
    and -> 0 as p_true -> 1 (confidently right costs almost nothing)`;
  const p = plotSetup('cv-cost', 0, 1, 0, 5, 0.2, 1);
  axLabels(p, 'p(true class)', 'cost');
  const { ctx, sx, sy, W } = p;
  ctx.beginPath(); ctx.strokeStyle = COL.red; ctx.lineWidth = 2.6;
  for (let px = 1; px <= W; px++) {
    const pp = px / W;
    const yy = -Math.log(Math.max(0.002, pp));
    const cy = sy(Math.min(5, yy));
    if (px === 1) ctx.moveTo(px, cy); else ctx.lineTo(px, cy);
  }
  ctx.stroke();
  plotPoint(p, p1, Math.min(5, ce), COL.accent, null, 6);
}

/* ═══ PANEL 8: backpropagation — forward pulse then backward error pulse ═══ */
const BP_NODES = [3, 3, 1];
function bpPositions(W, H) {
  const layerX = BP_NODES.map((_, i) => 60 + i * (W - 120) / (BP_NODES.length - 1));
  const posY = n => { const gap = (H - 50) / (n + 1); return Array.from({length:n}, (_, i) => 25 + gap * (i + 1)); };
  return { layerX, positions: BP_NODES.map(n => posY(n)) };
}
function drawBpFrame(phase) {
  // phase in [-1, 2]: -1..0 idle, 0..1 forward sweep, 1..2 backward sweep
  const cv = $('cv-bp'), ctx = cv.getContext('2d');
  const wrap = cv.parentElement;
  cv.width = Math.min(wrap.clientWidth - 28 || 560, 640);
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const { layerX, positions } = bpPositions(W, H);
  for (let l = 0; l < BP_NODES.length - 1; l++)
    for (let i = 0; i < BP_NODES[l]; i++)
      for (let j = 0; j < BP_NODES[l + 1]; j++) {
        ctx.beginPath(); ctx.moveTo(layerX[l], positions[l][i]); ctx.lineTo(layerX[l+1], positions[l+1][j]);
        ctx.strokeStyle = 'rgba(139,148,215,.22)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
  const fwd = Math.max(0, Math.min(1, phase));
  const bwd = Math.max(0, Math.min(1, phase - 1));
  for (let l = 0; l < BP_NODES.length; l++) {
    const fp = fwd * (BP_NODES.length - 1);
    const glowF = Math.max(0, 1.3 - Math.abs(fp - l) * 2);
    const bp = (1 - bwd) * (BP_NODES.length - 1);
    const glowB = bwd > 0 ? Math.max(0, 1.3 - Math.abs(bp - l) * 2) : 0;
    for (let i = 0; i < BP_NODES[l]; i++) {
      const x = layerX[l], y = positions[l][i];
      if (glowF > 0.03) { ctx.beginPath(); ctx.arc(x, y, 13 + glowF*9, 0, Math.PI*2); ctx.fillStyle = `rgba(34,211,238,${(glowF*0.3).toFixed(3)})`; ctx.fill(); }
      if (glowB > 0.03) { ctx.beginPath(); ctx.arc(x, y, 13 + glowB*11, 0, Math.PI*2); ctx.fillStyle = `rgba(244,63,94,${(glowB*0.32).toFixed(3)})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI*2);
      ctx.fillStyle = l === BP_NODES.length-1 ? '#f43f5e' : (l === 0 ? '#f97316' : '#22d3ee');
      ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = COL.surface; ctx.stroke();
    }
  }
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  if (phase <= 1) haloText(ctx, '1. forward pass -> prediction ŷ, then error = ŷ - y', 14, 12, COL.accent);
  else haloText(ctx, '2. error flows backward -> gradient for every weight', 14, 12, COL.red);
}
let bpTimer = null;
function playBackprop() {
  if (bpTimer) cancelAnimationFrame(bpTimer);
  const t0 = performance.now();
  const step = now => {
    const t = (now - t0) / 1800; // 0..2 over 3.6s
    if (t >= 2) { drawBpFrame(2); bpTimer = null; return; }
    drawBpFrame(t);
    bpTimer = requestAnimationFrame(step);
  };
  bpTimer = requestAnimationFrame(step);
}
function drawBackprop() { drawBpFrame(-1); }

/* ══════════════════════════════════════════════════════════════════
   PANEL 12 — the real digit recogniser (DIGIT_NET from digit_net.js)
   64 -> 16 (ReLU) -> 10 (softmax), trained on sklearn's `digits` set.
   ══════════════════════════════════════════════════════════════════ */
let pixels = new Array(64).fill(0);

function loadSample(d) {
  pixels = DIGIT_NET.samples[String(d)].slice();
  drawPixelGrid();
  clearNetResult();
}
function clearGrid() { pixels = new Array(64).fill(0); drawPixelGrid(); clearNetResult(); }
function clearNetResult() {
  $('digit-out').textContent = 'Draw a digit above (or load a sample), then press Run forward pass.';
  const cv = $('cv-digitnet'); const ctx = cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
  $('digit-bars').innerHTML = '';
}

function drawPixelGrid() {
  const cv = $('cv-pixels'), ctx = cv.getContext('2d');
  const S = cv.width / 8;
  ctx.clearRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const v = pixels[r*8+c];
    ctx.fillStyle = `rgba(34,211,238,${v.toFixed(3)})`;
    ctx.fillRect(c*S, r*S, S-1, S-1);
    ctx.strokeStyle = 'rgba(139,148,215,.15)'; ctx.strokeRect(c*S, r*S, S-1, S-1);
  }
}

function pixelPaint(e, erase) {
  const cv = $('cv-pixels'); const rect = cv.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  const S = cv.width / 8;
  const c = Math.floor(cx / S), r = Math.floor(cy / S);
  if (r < 0 || r > 7 || c < 0 || c > 7) return;
  pixels[r*8+c] = erase ? 0 : 1;
  drawPixelGrid();
}
function initPixelGrid() {
  const cv = $('cv-pixels');
  let painting = false, erasing = false;
  cv.addEventListener('mousedown', e => { painting = true; erasing = e.button === 2; pixelPaint(e, erasing); });
  window.addEventListener('mouseup', () => painting = false);
  cv.addEventListener('mousemove', e => { if (painting) pixelPaint(e, erasing); });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('touchstart', e => { painting = true; pixelPaint(e, false); e.preventDefault(); }, {passive:false});
  cv.addEventListener('touchmove', e => { if (painting) pixelPaint(e, false); e.preventDefault(); }, {passive:false});
  cv.addEventListener('touchend', () => painting = false);
  loadSample(3);
}

function mlpForward(x) {
  const { W1, b1, W2, b2 } = DIGIT_NET;
  const h = new Array(16).fill(0);
  for (let j = 0; j < 16; j++) {
    let s = b1[j];
    for (let i = 0; i < 64; i++) s += x[i] * W1[i][j];
    h[j] = Math.max(0, s); // ReLU
  }
  const o = new Array(10).fill(0);
  for (let k = 0; k < 10; k++) {
    let s = b2[k];
    for (let j = 0; j < 16; j++) s += h[j] * W2[j][k];
    o[k] = s;
  }
  const m = Math.max(...o);
  const exps = o.map(v => Math.exp(v - m));
  const sum = exps.reduce((a,b)=>a+b,0);
  const probs = exps.map(v => v / sum);
  return { h, o, probs };
}

let digitAnimId = null;
function runDigitDemo() {
  if (digitAnimId) { clearTimeout(digitAnimId); digitAnimId = null; }
  const { h, probs } = mlpForward(pixels);
  const pred = probs.indexOf(Math.max(...probs));
  const cv = $('cv-digitnet'), ctx = cv.getContext('2d');
  const wrap = cv.parentElement;
  cv.width = Math.min(wrap.clientWidth - 28 || 560, 640);
  const W = cv.width, H = cv.height;
  const hiddenX = W * 0.42, outX = W * 0.82, inX = W * 0.1;
  const hiddenY = i => 16 + i * (H - 32) / 15;
  const outY = i => 12 + i * (H - 24) / 9;
  const hmax = Math.max(...h, 1e-6);

  const stageInput = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = 'bold 10px Courier New'; ctx.fillStyle = 'rgba(231,236,255,.5)'; ctx.textAlign='center';
    ctx.fillText('64 pixels', inX, 10);
    const S = 3.6;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = pixels[r*8+c];
      ctx.fillStyle = `rgba(249,115,22,${(0.15+v*0.85).toFixed(3)})`;
      ctx.fillRect(inX - 8*S/2 + c*S, H/2 - 8*S/2 + r*S, S-0.4, S-0.4);
    }
    for (let j = 0; j < 16; j++) { ctx.beginPath(); ctx.arc(hiddenX, hiddenY(j), 5, 0, Math.PI*2); ctx.fillStyle='rgba(34,211,238,.12)'; ctx.fill(); }
    for (let k = 0; k < 10; k++) {
      ctx.beginPath(); ctx.arc(outX, outY(k), 9, 0, Math.PI*2); ctx.fillStyle='rgba(244,63,94,.12)'; ctx.fill();
      ctx.fillStyle='rgba(231,236,255,.35)'; ctx.font='bold 10px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(k, outX, outY(k));
    }
    ctx.font = 'bold 10px Courier New'; ctx.fillStyle='rgba(231,236,255,.5)'; ctx.textAlign='center';
    ctx.fillText('16 hidden (ReLU)', hiddenX, 10);
    ctx.fillText('10 output (softmax)', outX, 10);
  };

  const stageHidden = t => {
    stageInput();
    for (let j = 0; j < 16; j++) {
      const on = j / 16 <= t;
      const inten = on ? h[j] / hmax : 0;
      ctx.beginPath(); ctx.arc(hiddenX, hiddenY(j), 5 + inten*7, 0, Math.PI*2);
      ctx.fillStyle = `rgba(34,211,238,${(0.25+inten*0.75).toFixed(3)})`; ctx.fill();
      if (on) { ctx.lineWidth=1.4; ctx.strokeStyle=COL.surface; ctx.stroke(); }
    }
    ctx.strokeStyle='rgba(34,211,238,.28)'; ctx.lineWidth=1;
    for (let j = 0; j < 16 * t; j++) { ctx.beginPath(); ctx.moveTo(inX+14, H/2); ctx.lineTo(hiddenX-6, hiddenY(j)); ctx.stroke(); }
  };

  const stageOutput = t => {
    stageHidden(1);
    for (let k = 0; k < 10; k++) {
      const on = k / 10 <= t;
      const inten = on ? probs[k] : 0;
      const r = 9 + inten*14;
      ctx.beginPath(); ctx.arc(outX, outY(k), r, 0, Math.PI*2);
      ctx.fillStyle = k===pred && on ? 'rgba(16,185,129,.85)' : `rgba(244,63,94,${(0.25+inten*0.7).toFixed(3)})`;
      ctx.fill();
      ctx.fillStyle='#0b0f1a'; ctx.font='bold 10px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(k, outX, outY(k));
    }
    ctx.strokeStyle='rgba(244,63,94,.22)'; ctx.lineWidth=1;
    for (let k = 0; k < 10 * t; k++) for (let j=0;j<16;j++) { ctx.beginPath(); ctx.moveTo(hiddenX+6, hiddenY(j)); ctx.lineTo(outX-10, outY(k)); ctx.stroke(); }
  };

  const bars = $('digit-bars'); bars.innerHTML = '';
  probs.forEach((v, k) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:5px;';
    row.innerHTML = `<span style="width:14px;font-family:'Courier New',monospace;font-size:.72rem;color:${k===pred?'#10b981':'#8b93c4'}">${k}</span>
      <div style="flex:1;background:rgba(255,255,255,.06);border-radius:5px;height:12px;overflow:hidden;">
        <div style="height:100%;width:0%;background:${k===pred?'#10b981':'#f43f5e'};border-radius:5px;transition:width .5s;" data-bar="${k}"></div>
      </div>
      <span style="width:44px;text-align:right;font-family:'Courier New',monospace;font-size:.7rem;color:${k===pred?'#10b981':'#8b93c4'}">${(v*100).toFixed(1)}%</span>`;
    bars.appendChild(row);
  });

  $('digit-out').textContent = 'Running forward pass...';
  let stage = 0;
  const frames = [
    () => stageInput(),
    ...Array.from({length:8}, (_,i) => () => stageHidden((i+1)/8)),
    ...Array.from({length:8}, (_,i) => () => stageOutput((i+1)/8)),
  ];
  const runFrame = () => {
    frames[stage]();
    stage++;
    if (stage < frames.length) { digitAnimId = setTimeout(runFrame, 55); }
    else {
      probs.forEach((v,k) => { const el = bars.querySelector(`[data-bar="${k}"]`); if (el) el.style.width = (v*100).toFixed(1)+'%'; });
      $('digit-out').textContent =
`hidden activations (ReLU) : [${h.map(v=>v.toFixed(2)).join(', ')}]
output probabilities      : [${probs.map(v=>v.toFixed(3)).join(', ')}]

predicted digit = ${pred}   (confidence ${(probs[pred]*100).toFixed(1)}%)
network test accuracy on unseen digits = ${(DIGIT_NET.acc*100).toFixed(1)}%`;
    }
  };
  runFrame();
}

let cycleTimer = null;
function cycleDigits() {
  if (cycleTimer) { clearTimeout(cycleTimer); cycleTimer = null; }
  let d = 0;
  const step = () => {
    loadSample(d);
    runDigitDemo();
    d++;
    if (d <= 9) cycleTimer = setTimeout(step, 1350);
    else cycleTimer = null;
  };
  step();
}
function drawDigit() { initPixelGrid(); }

/* ══════════════════════════════════════════════════════════════════
   PANEL 15 — XOR: why a single linear neuron cannot do it, and how
   a 2-neuron ReLU hidden layer (hand-built, real weights) can.
   ══════════════════════════════════════════════════════════════════ */
const XOR_PTS = [ [0,0,0], [1,1,0], [0,1,1], [1,0,1] ]; // x1,x2,label
function xorLinearDecide(x1, x2) { return 0.5*x1 + 0.5*x2 - 0.25; } // best a single line can do — still misclassifies
function xorMlpDecide(x1, x2) {
  const h1 = Math.max(0, x1 + x2);             // grows with how many inputs are on (0, 1 or 2)
  const h2 = Math.max(0, x1 + x2 - 1);         // fires only once BOTH are on (kicks in past the "1" mark)
  return h1 - 2*h2 - 0.5;                       // cancels the "both on" case exactly, leaves "exactly one" positive
}
function drawXor() {
  const mode = xorMode;
  const decide = mode === 'linear' ? xorLinearDecide : xorMlpDecide;
  let right = 0;
  XOR_PTS.forEach(([x1,x2,lab]) => { if ((decide(x1,x2) > 0 ? 1 : 0) === lab) right++; });
  $('out-xor').textContent =
mode === 'linear'
? `single linear neuron: z = 0.5*x1 + 0.5*x2 - 0.25, class = (z > 0)
(0,0)->${decide(0,0)>0?1:0} (label 0)   (1,1)->${decide(1,1)>0?1:0} (label 0)   (0,1)->${decide(0,1)>0?1:0} (label 1)   (1,0)->${decide(1,0)>0?1:0} (label 1)
correct: ${right} / 4  --  and this IS the best a straight line can do. Try any other
w1, w2, b by hand: one of the four points always lands on the wrong side.
3/4 (75%) is XOR's linear ceiling — no single neuron ever reaches 4/4.`
: `hidden layer (2 ReLU neurons) + linear output:
h1 = ReLU(x1 + x2)         grows to 1 with one input on, 2 with both
h2 = ReLU(x1 + x2 - 1)     stays 0 until BOTH are on, then grows too
y  = h1 - 2*h2 - 0.5 > 0 ?  -- the "-2*h2" exactly cancels the "both on" case

(0,0)->${decide(0,0)>0?1:0}  (1,1)->${decide(1,1)>0?1:0}  (0,1)->${decide(0,1)>0?1:0}  (1,0)->${decide(1,0)>0?1:0}
correct: ${right} / 4  --  the hidden layer bends the boundary and solves it exactly`;

  const p = plotSetup('cv-xor', -0.5, 1.5, -0.5, 1.5, 0.5, 0.5);
  axLabels(p, 'x1', 'x2');
  const { ctx, sx, sy, W, H } = p;
  const B = 5;
  for (let px = 0; px < W; px += B) for (let py = 0; py < H; py += B) {
    const x1 = p.XMIN + (px+B/2)/W*(p.XMAX-p.XMIN);
    const x2 = p.YMIN + (1-(py+B/2)/H)*(p.YMAX-p.YMIN);
    const d = decide(x1, x2);
    ctx.fillStyle = d > 0 ? 'rgba(34,211,238,.14)' : 'rgba(244,63,94,.08)';
    ctx.fillRect(px, py, B, B);
  }
  XOR_PTS.forEach(([x1,x2,lab]) => plotPoint(p, x1, x2, lab ? COL.cyan : COL.red, `${lab}`, 9));
}
let xorMode = 'linear';
function setXorMode(m, btn) {
  xorMode = m;
  document.querySelectorAll('#xor-seg button').forEach(b => b.classList.toggle('on', b === btn));
  drawXor();
}

/* ══════════ boot ══════════ */
updateDots();
setTimeout(drawOverview, 90);
(function () {
  const m = /^#p(\d+)$/.exec(location.hash);
  if (m) { const idx = +m[1]; if (idx >= 0 && idx < TOTAL) setTimeout(() => goTo(idx), 30); }
})();

window.addEventListener('resize', () => {
  instant = true;
  if (current === 0) { if (ovRaf) cancelAnimationFrame(ovRaf); instant = false; drawOverview(); return; }
  const redraw = [null, null, null, drawNeuron, drawActivation, null, null, drawCost,
                  drawBackprop, null, null, null, null, null, null, drawXor, null];
  if (redraw[current]) redraw[current]();
  if (current === 12) drawPixelGrid();
  instant = false;
  fitMath($('panel-' + current));
});

document.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pos = CURRICULUM_ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && pos < CURRICULUM_ORDER.length - 1) goTo(CURRICULUM_ORDER[pos + 1]);
  if (e.key === 'ArrowLeft'  && pos > 0) goTo(CURRICULUM_ORDER[pos - 1]);
});
