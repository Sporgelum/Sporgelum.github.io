/* Easter egg: move the mouse very fast and a little bee shoots out and flies away. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const BEE = `<svg viewBox="0 0 40 32" width="30" height="24" aria-hidden="true">
    <g class="wings"><ellipse cx="17" cy="8" rx="7" ry="5" fill="rgba(235,245,255,.75)" stroke="rgba(255,255,255,.9)" stroke-width=".6"/>
    <ellipse cx="24" cy="7" rx="6" ry="4.5" fill="rgba(235,245,255,.6)" stroke="rgba(255,255,255,.9)" stroke-width=".6"/></g>
    <ellipse cx="20" cy="19" rx="12" ry="8" fill="#f2b51c"/>
    <path d="M14 11.8v14.4M20 11v16M26 11.8v14.4" stroke="#1d1308" stroke-width="3"/>
    <circle cx="32" cy="18" r="5" fill="#1d1308"/><circle cx="33.5" cy="16.5" r="1.2" fill="#fff"/>
    <path d="M8 19l-4 1 4 1z" fill="#1d1308"/>
    <path d="M34 13q3-6 6-6M33 13q1-6 4-8" stroke="#1d1308" stroke-width="1" fill="none"/>
  </svg>`;
  const style = document.createElement('style');
  style.textContent = `.bee{position:fixed;left:0;top:0;z-index:60;pointer-events:none;will-change:transform,opacity;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
    .bee .wings{transform-origin:20px 10px;animation:buzz .06s linear infinite alternate}
    @keyframes buzz{from{transform:scaleY(1)}to{transform:scaleY(.35)}}`;
  document.head.appendChild(style);

  let last = null, cooldown = 0, active = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = performance.now();
    if (last) {
      const dt = t - last.t;
      if (dt > 0 && dt < 60) {
        const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / dt; // px per ms
        if (speed > 4.5 && t > cooldown && active < 3) {
          cooldown = t + 900;
          launch(e.clientX, e.clientY);
        }
      }
    }
    last = { x: e.clientX, y: e.clientY, t };
  }, { passive: true });

  function launch(x0, y0) {
    active++;
    const el = document.createElement('div');
    el.className = 'bee';
    el.innerHTML = BEE;
    document.body.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const speed = 380 + Math.random() * 220; // px per second
    const wob = 6 + Math.random() * 10, freq = 9 + Math.random() * 6;
    const face = Math.cos(ang) < 0 ? -1 : 1; // the bee faces the way it flies
    const t0 = performance.now(), life = 1500;
    function step(t) {
      const k = (t - t0) / 1000;
      const d = speed * k + 40 * k * k;
      const px = -Math.sin(ang), py = Math.cos(ang);
      const w = Math.sin(k * freq) * wob;
      const x = x0 + Math.cos(ang) * d + px * w - 15;
      const y = y0 + Math.sin(ang) * d + py * w - 12;
      const tilt = Math.atan2(Math.sin(ang), Math.abs(Math.cos(ang))) * 57.3 * 0.5 + Math.cos(k * freq) * 10;
      const p = (t - t0) / life;
      el.style.opacity = p < 0.1 ? p * 10 : p > 0.7 ? (1 - p) / 0.3 : 1;
      el.style.transform = `translate(${x}px,${y}px) scaleX(${face}) rotate(${tilt * face}deg) scale(${0.7 + Math.min(p * 3, 0.3)})`;
      if (p < 1) requestAnimationFrame(step); else { el.remove(); active--; }
    }
    requestAnimationFrame(step);
  }
})();
