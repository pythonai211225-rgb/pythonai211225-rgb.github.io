/* ── active nav link ── */
const path = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-link').forEach((link) => {
  if (link.getAttribute('href') === path) link.classList.add('active');
});

/* ── IntersectionObserver: reveal + bar animation + counter ── */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('show');

      /* animate bar fills inside this element */
      el.querySelectorAll('.bar-fill[data-pct]').forEach((bar) => {
        requestAnimationFrame(() => {
          bar.style.width = bar.dataset.pct + '%';
        });
      });

      /* animate counters inside this element */
      el.querySelectorAll('.count-up[data-val]').forEach((num) => {
        animateCounter(num, parseInt(num.dataset.val, 10));
      });

      revealObs.unobserve(el);
    });
  },
  { threshold: 0.07 }
);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) =>
  revealObs.observe(el)
);

/* ── counter animation ── */
function animateCounter(el, target) {
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── HAVING filter demo toggle ── */
const filterBtn = document.getElementById('filter-toggle');
if (filterBtn) {
  let filtered = false;
  filterBtn.addEventListener('click', () => {
    filtered = !filtered;
    document.querySelectorAll('.filter-row[data-passes="false"]').forEach((row) => {
      row.classList.toggle('filtered-out', filtered);
    });
    filterBtn.textContent = filtered ? '↩ Reset filter' : '▶ Apply HAVING COUNT(*) > 2';
  });
}

/* ── HAVING SUM filter toggle ── */
const filterBtn2 = document.getElementById('filter-toggle-2');
if (filterBtn2) {
  let filtered2 = false;
  filterBtn2.addEventListener('click', () => {
    filtered2 = !filtered2;
    document.querySelectorAll('.filter-row-2[data-passes2="false"]').forEach((row) => {
      row.classList.toggle('filtered-out', filtered2);
    });
    filterBtn2.textContent = filtered2 ? '↩ Reset filter' : '▶ Apply HAVING SUM > 1800';
  });
}
