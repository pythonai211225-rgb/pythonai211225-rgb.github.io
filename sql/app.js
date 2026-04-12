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
      // trigger child animations
      animatePre(e.target);
      animateRows(e.target);
      animateSteps(e.target);
      animateEngines(e.target);
      animateFacts(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.section').forEach(s => secObs.observe(s));

/* ── also observe cards that aren't inside .section ── */
const cardObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      cardObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.engine-card, .fact, .topic-card').forEach(c => cardObs.observe(c));

/* ── code line animation ─────────────────────── */
function animatePre(parent) {
  parent.querySelectorAll('pre').forEach(pre => {
    const lines = pre.querySelectorAll('.line');
    lines.forEach((l, i) => setTimeout(() => l.classList.add('show'), i * 50 + 100));
    // after code done, animate table rows in same card
    const delay = lines.length * 50 + 200;
    parent.querySelectorAll('table.dt tbody tr').forEach((r, i) => {
      setTimeout(() => r.classList.add('show'), delay + i * 100);
    });
  });
}

/* ── table rows without code above ──────────── */
function animateRows(parent) {
  if (!parent.querySelector('pre')) {
    parent.querySelectorAll('table.dt tbody tr').forEach((r, i) => {
      setTimeout(() => r.classList.add('show'), i * 110 + 200);
    });
  }
}

/* ── step list ───────────────────────────────── */
function animateSteps(parent) {
  parent.querySelectorAll('.steps li').forEach((li, i) => {
    setTimeout(() => li.classList.add('show'), i * 110 + 150);
  });
}

/* ── engine / fact cards ─────────────────────── */
function animateEngines(parent) {
  parent.querySelectorAll('.engine-card').forEach((c, i) => {
    setTimeout(() => c.classList.add('show'), i * 90 + 150);
  });
}
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
