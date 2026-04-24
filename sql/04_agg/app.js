const path = window.location.pathname.split('/').pop();

document.querySelectorAll('.nav-link').forEach((link) => {
  if (link.getAttribute('href') === path) {
    link.classList.add('active');
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
