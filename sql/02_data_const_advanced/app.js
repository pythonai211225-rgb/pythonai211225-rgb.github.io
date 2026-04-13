/* ── scroll progress bar ─────────────────────── */
const bar = document.getElementById('progress');
if (bar) {
  window.addEventListener('scroll', () => {
    const total = document.body.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / total * 100) + '%';
  });
}

/* ── section fade-in on scroll ───────────────── */
const secObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      secObs.unobserve(e.target);
      animatePre(e.target);
      animateRows(e.target);
      animateAffRows(e.target);
      animateSteps(e.target);
      animateFacts(e.target);
    }
  });
}, { threshold: 0.06 });
document.querySelectorAll('.section').forEach(s => secObs.observe(s));

/* ── type blocks & constraint blocks ─────────── */
const blockObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      blockObs.unobserve(e.target);
      animatePre(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.type-block, .constraint-block, .topic-card, .engine-card, .fact').forEach(c => blockObs.observe(c));

/* ── code line animation ─────────────────────── */
function animatePre(parent) {
  parent.querySelectorAll('pre').forEach(pre => {
    const lines = pre.querySelectorAll('.line');
    lines.forEach((l, i) => setTimeout(() => l.classList.add('show'), i * 45 + 80));
  });
}

/* ── table rows ──────────────────────────────── */
function animateRows(parent) {
  parent.querySelectorAll('table.dt tbody tr').forEach((r, i) => {
    setTimeout(() => r.classList.add('show'), i * 100 + 150);
  });
}

/* ── affinity table rows ─────────────────────── */
function animateAffRows(parent) {
  parent.querySelectorAll('.aff-table tbody tr').forEach((r, i) => {
    setTimeout(() => r.classList.add('show'), i * 80 + 100);
  });
}

/* ── step list ───────────────────────────────── */
function animateSteps(parent) {
  parent.querySelectorAll('.steps li').forEach((li, i) => {
    setTimeout(() => li.classList.add('show'), i * 110 + 150);
  });
}

/* ── fact cards ──────────────────────────────── */
function animateFacts(parent) {
  parent.querySelectorAll('.fact').forEach((f, i) => {
    setTimeout(() => f.classList.add('show'), i * 80 + 100);
  });
}

/* ── copy buttons ────────────────────────────── */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pre = btn.nextElementSibling;
    navigator.clipboard.writeText(pre.innerText).then(() => {
      btn.textContent = 'copied!';
      setTimeout(() => btn.textContent = 'copy', 1800);
    });
  });
});

/* ── nav active highlight ────────────────────── */
(function() {
  const path = location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();
