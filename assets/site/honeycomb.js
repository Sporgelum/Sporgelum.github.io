/* Beeswax honeycomb background.
   A static comb (wax walls, empty cells, honey cells, capped cells) is painted once
   to an offscreen canvas; each frame only adds moving light on top. */
(function () {
  const canvas = document.getElementById('comb');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');
  const bctx = base.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = 1;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  // --- small value noise for natural clustering of honey / caps ---
  function hash(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = smooth(x - xi), yf = smooth(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }

  function hexPath(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 90); // pointy top
      const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }

  function paintBase() {
    base.width = W * DPR; base.height = H * DPR;
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // wax backing
    bctx.fillStyle = '#17130d';
    bctx.fillRect(0, 0, W, H);

    const R = W < 640 ? 26 : 34;          // centre to vertex
    const wall = Math.max(3, R * 0.13);   // wax wall thickness
    const dx = Math.sqrt(3) * R, dy = 1.5 * R;
    const cols = Math.ceil(W / dx) + 2, rows = Math.ceil(H / dy) + 2;
    const light = { x: -0.6, y: -0.8 };   // light from top-left

    for (let r = -1; r < rows; r++) {
      for (let q = -1; q < cols; q++) {
        const x = q * dx + (r & 1 ? dx / 2 : 0);
        const y = r * dy;
        const n = noise(q * 0.17, r * 0.17);
        const n2 = noise(q * 0.5 + 40, r * 0.5 + 40);
        const kind = n > 0.68 ? (n2 > 0.62 ? 'cap' : 'honey') : n > 0.6 && n2 > 0.5 ? 'honey' : 'empty';

        // wall: slightly lighter wax, with a soft bevel
        hexPath(bctx, x, y, R);
        const wg = bctx.createLinearGradient(x + light.x * R, y + light.y * R, x - light.x * R, y - light.y * R);
        wg.addColorStop(0, '#4a3b22');
        wg.addColorStop(0.5, '#33291a');
        wg.addColorStop(1, '#1d170f');
        bctx.fillStyle = wg;
        bctx.fill();

        const ir = R - wall;
        hexPath(bctx, x, y, ir);
        if (kind === 'empty') {
          // looking into a cell: dark bottom, lit far wall
          const g = bctx.createRadialGradient(x - light.x * ir * 0.35, y - light.y * ir * 0.35, ir * 0.1, x, y, ir * 1.1);
          g.addColorStop(0, '#0c0a07');
          g.addColorStop(0.65, '#16120c');
          g.addColorStop(1, '#2a2116');
          bctx.fillStyle = g;
          bctx.fill();
        } else if (kind === 'honey') {
          const g = bctx.createRadialGradient(x - ir * 0.25, y - ir * 0.3, ir * 0.05, x, y, ir * 1.05);
          g.addColorStop(0, 'rgba(255,196,70,.55)');
          g.addColorStop(0.45, 'rgba(196,110,10,.42)');
          g.addColorStop(1, 'rgba(70,32,4,.55)');
          bctx.fillStyle = '#120c05';
          bctx.fill();
          bctx.fillStyle = g;
          bctx.fill();
          // meniscus highlight
          bctx.beginPath();
          bctx.ellipse(x - ir * 0.28, y - ir * 0.36, ir * 0.32, ir * 0.12, -0.5, 0, Math.PI * 2);
          bctx.fillStyle = 'rgba(255,236,190,.22)';
          bctx.fill();
        } else {
          // wax cap: pale dome
          const g = bctx.createRadialGradient(x - ir * 0.3, y - ir * 0.35, ir * 0.05, x, y, ir);
          g.addColorStop(0, '#8a7448');
          g.addColorStop(0.6, '#5d4b2c');
          g.addColorStop(1, '#3a2e1b');
          bctx.fillStyle = g;
          bctx.fill();
        }
        // inner rim catch-light on the edges facing the light
        bctx.save();
        hexPath(bctx, x, y, ir);
        bctx.clip();
        bctx.lineWidth = 1.4;
        bctx.strokeStyle = kind === 'honey' ? 'rgba(255,210,120,.25)' : 'rgba(255,230,180,.08)';
        hexPath(bctx, x + 1, y + 1.2, ir);
        bctx.stroke();
        bctx.restore();
      }
    }

    // keep the centre calm so text reads: vignette + dark veil
    const v = bctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(18,16,12,.86)');
    v.addColorStop(0.6, 'rgba(18,16,12,.7)');
    v.addColorStop(1, 'rgba(18,16,12,.45)');
    bctx.fillStyle = v;
    bctx.fillRect(0, 0, W, H);
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    paintBase();
    draw(performance.now());
  }

  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function draw(t) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(base, 0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const s = t / 1000;
    // two slow ambient warm lights wandering over the comb
    glow(W * (0.18 + 0.08 * Math.sin(s * 0.13)), H * (0.2 + 0.1 * Math.cos(s * 0.11)), Math.max(W, H) * 0.35, 'rgba(160,70,20,.16)');
    glow(W * (0.85 + 0.06 * Math.cos(s * 0.09)), H * (0.75 + 0.08 * Math.sin(s * 0.12)), Math.max(W, H) * 0.3, 'rgba(140,90,30,.13)');
    // the cursor is a lamp held over the wax
    if (mouse.x > -999) glow(mouse.x, mouse.y, 260, 'rgba(255,170,40,.2)');
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    draw(t);
    if (!document.hidden) requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', (e) => {
    if (mouse.x < -999) { mouse.x = e.clientX; mouse.y = e.clientY; }
    mouse.tx = e.clientX; mouse.ty = e.clientY;
  }, { passive: true });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) requestAnimationFrame(loop); });

  resize();
  if (!reduce) requestAnimationFrame(loop);
})();
