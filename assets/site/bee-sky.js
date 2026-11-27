/* Brain screen backdrop: a dark sky with a few bees wandering about,
   each leaving a thin fading trail like a plane's contrail. */
(function () {
  const host = document.getElementById('brain-screen');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'bee-sky';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = 1, bees = [];
  const TRAIL = 90; // points kept per trail

  function makeBee() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      a: Math.random() * Math.PI * 2,          // heading
      turn: 0,                                   // current turning rate
      v: 45 + Math.random() * 55,                // px per second
      phase: Math.random() * 100,
      trail: [],
    };
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const b = host.getBoundingClientRect();
    W = b.width; H = b.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = W < 640 ? 5 : 8; // never more than 10
    while (bees.length < n) bees.push(makeBee());
    bees.length = n;
    bees.forEach((bee) => { bee.x = Math.min(bee.x, W); bee.y = Math.min(bee.y, H); });
  }

  function drawBee(b, t) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a);
    // wings flicker
    const flap = 0.5 + 0.5 * Math.sin(t * 60 + b.phase);
    ctx.fillStyle = `rgba(230,240,255,${0.35 + 0.35 * flap})`;
    ctx.beginPath(); ctx.ellipse(-0.5, -3.2, 2.8, 1.6 + flap, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.5, 3.2, 2.8, 1.6 + flap, 0.3, 0, Math.PI * 2); ctx.fill();
    // body with stripes
    ctx.fillStyle = '#f2b51c';
    ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 2.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d1308';
    ctx.fillRect(-1.8, -2.8, 1.2, 5.6);
    ctx.fillRect(0.8, -2.9, 1.2, 5.8);
    ctx.beginPath(); ctx.arc(4.6, 0, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  let last = 0, running = false, visible = false;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    ctx.clearRect(0, 0, W, H);
    const s = t / 1000;
    for (const b of bees) {
      // wander: smoothly varying turn rate, plus a gentle pull back toward the screen
      b.turn += (Math.random() - 0.5) * 6 * dt;
      b.turn *= 0.97;
      const m = 60;
      if (b.x < m || b.x > W - m || b.y < m || b.y > H - m) {
        const want = Math.atan2(H / 2 - b.y, W / 2 - b.x);
        let d = want - b.a;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        b.turn += d * 1.5 * dt;
      }
      b.a += b.turn * dt * 2;
      b.x += Math.cos(b.a) * b.v * dt;
      b.y += Math.sin(b.a) * b.v * dt + Math.sin(s * 3 + b.phase) * 0.15;
      b.trail.push(b.x, b.y);
      if (b.trail.length > TRAIL * 2) b.trail.splice(0, 2);

      // contrail: thin, fading from tail to bee
      const tr = b.trail;
      for (let i = 2; i < tr.length; i += 2) {
        const k = i / tr.length;
        ctx.strokeStyle = `rgba(255,226,170,${(k * 0.22).toFixed(3)})`;
        ctx.lineWidth = 0.6 + k * 0.5;
        ctx.beginPath();
        ctx.moveTo(tr[i - 2], tr[i - 1]);
        ctx.lineTo(tr[i], tr[i + 1]);
        ctx.stroke();
      }
      drawBee(b, s);
    }
    if (visible && !document.hidden) requestAnimationFrame(frame); else running = false;
  }
  function start() { if (!running && !reduce) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  resize();
  if (reduce) { bees.forEach((b) => drawBee(b, 0)); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }).observe(host);
  } else { visible = true; start(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  window.addEventListener('hashchange', () => setTimeout(resize, 50));
})();
