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
      animateSteps(e.target);
      animateCards(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.section').forEach(s => secObs.observe(s));

/* ── also observe topic-cards outside .section ── */
const cardObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      cardObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.topic-card, .card').forEach(c => cardObs.observe(c));

/* ── code line animation ─────────────────────── */
function animatePre(parent) {
  parent.querySelectorAll('pre').forEach(pre => {
    const lines = pre.querySelectorAll('.line');
    lines.forEach((l, i) => setTimeout(() => l.classList.add('show'), i * 55 + 100));
    const delay = lines.length * 55 + 200;
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

/* ── card items ─────────────────────────────── */
function animateCards(parent) {
  parent.querySelectorAll('.card').forEach((c, i) => {
    setTimeout(() => c.classList.add('show'), i * 90 + 150);
  });
}

/* ── copy buttons ────────────────────────────── */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pre = btn.closest('.code-wrap').querySelector('pre');
    const text = pre.innerText;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1800);
    });
  });
});

/* ── nav-item active highlight ───────────────── */
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  if (item.href && item.href.includes(location.pathname.split('/').pop())) {
    item.classList.add('active');
  }
});
