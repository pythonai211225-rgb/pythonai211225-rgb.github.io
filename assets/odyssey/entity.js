// Decorative, simulated speech pulses. No microphone or audio input is used.
(() => {
  const lesson = document.querySelector('.latest-lesson');
  if (!lesson) return;
  const row = document.createElement('div');
  row.className = 'lesson-entity-row';
  lesson.before(row);
  const entity = document.createElement('div');
  entity.className = 'ai-entity';
  entity.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  entity.append(canvas);
  row.append(entity);
  row.append(lesson);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = 280;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.height = size * dpr;
  ctx.scale(dpr, dpr);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true, frameId = 0, previous = 0, time = 0;
  const tau = Math.PI * 2;

  function draw(t) {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    // Slow breathing under quicker, uneven syllable-like bursts.
    const phrase = Math.pow((Math.sin(t * 1.1) + 1) / 2, 2);
    const voice = phrase * (.5 + .3 * Math.sin(t * 8.1) + .2 * Math.sin(t * 13.7));
    const pulse = 1 + .065 * Math.sin(t * 2) + .16 * voice;
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 114);
    halo.addColorStop(0, '#244da828');
    halo.addColorStop(.4, '#123e9829');
    halo.addColorStop(.72, '#102b7213');
    halo.addColorStop(1, '#091d5900');
    ctx.fillStyle = halo;
    ctx.fillRect(-125, -125, 250, 250);

    // Layered drifting filaments create a soft, turbulent blue cloud.
    for (let band = 0; band < 36; band++) {
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const angle = i / 100 * tau;
        const ripple = Math.sin(angle * 3 + t * .8 + band * .17) * 8
          + Math.sin(angle * 5 - t * .55 + band * .12) * 5
          + Math.cos(angle * 2 + t * .4) * 6;
        const radius = 33 + band * .85 + ripple;
        const x = Math.cos(angle + t * .1) * radius;
        const y = Math.sin(angle + t * .1) * radius * (.83 + .08 * Math.sin(t * .7));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `hsla(${220 + band * .3}, 95%, ${27 + band * .22}%, ${.028 + voice * .025})`;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.lineWidth = .7;
      ctx.strokeStyle = `hsla(${222 + band * .3}, 90%, 42%, .075)`;
      ctx.stroke();
    }

    // Tilted orbital paths with connected neuron beads in depth.
    const nodes = [];
    for (let orbit = 0; orbit < 3; orbit++) {
      const tilt = orbit * 1.05 + t * .08;
      const point = (a) => {
        const x = Math.cos(a) * (82 + orbit * 6);
        const y = Math.sin(a) * 33;
        return { x: x * Math.cos(tilt) - y * Math.sin(tilt), y: x * Math.sin(tilt) + y * Math.cos(tilt), depth: Math.sin(a) };
      };
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const p = point(i / 80 * tau);
        if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = orbit === 1 ? '#3864b528' : '#294b9c30';
      ctx.lineWidth = .7;
      ctx.stroke();
      for (let i = 0; i < 8; i++) nodes.push({ ...point(i / 8 * tau + t * (.28 + orbit * .09)), orbit });
    }
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const q = nodes[j];
        const distance = Math.hypot(p.x - q.x, p.y - q.y);
        if (distance < 44 && distance > 12) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(48, 83, 160, ${(1 - distance / 44) * .28})`;
          ctx.lineWidth = .6; ctx.stroke();
        }
      }
      const radius = 1.5 + (p.depth + 1) * .75;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
      glow.addColorStop(0, p.orbit === 1 ? '#497ac788' : '#345cb888');
      glow.addColorStop(1, '#18377900');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, radius * 4, 0, tau); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, tau);
      ctx.fillStyle = p.orbit === 1 ? '#648bcc' : '#5077be'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, radius + 2, 0, tau);
      ctx.strokeStyle = '#456bb366'; ctx.lineWidth = .6; ctx.stroke();
    }
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 31 + voice * 8);
    core.addColorStop(0, '#7596cbbb'); core.addColorStop(.2, '#345ca788');
    core.addColorStop(.5, '#193e8444'); core.addColorStop(1, '#102c6800');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, 42, 0, tau); ctx.fill();
    ctx.restore();
  }
  function tick(now) {
    time += Math.min((now - previous) / 1000, .05);
    previous = now;
    draw(time);
    frameId = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frameId);
    if (!document.hidden && visible && !reduce.matches && !document.body.classList.contains('paused')) {
      previous = performance.now();
      frameId = requestAnimationFrame(tick);
    }
  }
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(entity);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  draw(0);
  sync();
})();
