/* Beeswax honeycomb background.
   The comb (wax walls, empty, honey-filled and capped cells) is painted once to an
   offscreen canvas. Each frame adds moving light, zooms the cell under the cursor,
   and lets a honey drop fall from honey cells when the cursor enters them. */
(function () {
  const canvas = document.getElementById('comb');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');
  const bctx = base.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = 1, R = 60;
  let cells = [];
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  let hoverCell = null;
  const drops = [];

  // --- value noise for natural clustering of honey / caps ---
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

  // Paint one cell centred at (x, y) with radius r.
  function drawCell(c, cell, x, y, r, lift) {
    const wall = Math.max(4, r * 0.12);
    const L = { x: -0.6, y: -0.8 };
    hexPath(c, x, y, r);
    const wg = c.createLinearGradient(x + L.x * r, y + L.y * r, x - L.x * r, y - L.y * r);
    wg.addColorStop(0, lift ? '#6a5430' : '#4a3b22');
    wg.addColorStop(0.5, lift ? '#463720' : '#33291a');
    wg.addColorStop(1, '#1d170f');
    c.fillStyle = wg;
    c.fill();

    const ir = r - wall;
    hexPath(c, x, y, ir);
    if (cell.kind === 'empty') {
      const g = c.createRadialGradient(x - L.x * ir * 0.35, y - L.y * ir * 0.35, ir * 0.1, x, y, ir * 1.1);
      g.addColorStop(0, '#0c0a07');
      g.addColorStop(0.65, '#16120c');
      g.addColorStop(1, '#2a2116');
      c.fillStyle = g;
      c.fill();
    } else if (cell.kind === 'honey') {
      c.fillStyle = '#120c05';
      c.fill();
      const g = c.createRadialGradient(x - ir * 0.25, y - ir * 0.3, ir * 0.05, x, y, ir * 1.05);
      g.addColorStop(0, lift ? 'rgba(255,214,110,.85)' : 'rgba(255,196,70,.55)');
      g.addColorStop(0.45, lift ? 'rgba(220,130,20,.7)' : 'rgba(196,110,10,.42)');
      g.addColorStop(1, 'rgba(70,32,4,.6)');
      c.fillStyle = g;
      hexPath(c, x, y, ir);
      c.fill();
      c.beginPath();
      c.ellipse(x - ir * 0.28, y - ir * 0.36, ir * 0.32, ir * 0.12, -0.5, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,236,190,.25)';
      c.fill();
    } else {
      const g = c.createRadialGradient(x - ir * 0.3, y - ir * 0.35, ir * 0.05, x, y, ir);
      g.addColorStop(0, lift ? '#a68c58' : '#8a7448');
      g.addColorStop(0.6, '#5d4b2c');
      g.addColorStop(1, '#3a2e1b');
      c.fillStyle = g;
      c.fill();
    }
  }

  function paintBase() {
    base.width = W * DPR; base.height = H * DPR;
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bctx.fillStyle = '#17130d';
    bctx.fillRect(0, 0, W, H);

    R = W < 640 ? 42 : 64; // large cells keep the page calm
    const dx = Math.sqrt(3) * R, dy = 1.5 * R;
    const cols = Math.ceil(W / dx) + 2, rows = Math.ceil(H / dy) + 2;
    cells = [];
    for (let r = -1; r < rows; r++) {
      for (let q = -1; q < cols; q++) {
        const x = q * dx + (r & 1 ? dx / 2 : 0);
        const y = r * dy;
        const n = noise(q * 0.3, r * 0.3);
        const n2 = noise(q * 0.7 + 40, r * 0.7 + 40);
        const kind = n > 0.7 ? (n2 > 0.6 ? 'cap' : 'honey') : n > 0.62 && n2 > 0.55 ? 'honey' : 'empty';
        const cell = { x, y, kind, zoom: 0 };
        cells.push(cell);
        drawCell(bctx, cell, x, y, R, false);
      }
    }
    // veil keeps the centre calm so text reads
    const v = bctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(18,16,12,.88)');
    v.addColorStop(0.6, 'rgba(18,16,12,.74)');
    v.addColorStop(1, 'rgba(18,16,12,.5)');
    bctx.fillStyle = v;
    bctx.fillRect(0, 0, W, H);
  }

  function cellAt(px, py) {
    let best = null, bd = Infinity;
    for (const c of cells) {
      const d = (c.x - px) ** 2 + (c.y - py) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    return bd < R * R ? best : null;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    paintBase();
    hoverCell = null;
    draw(performance.now());
  }

  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function spawnDrop(cell) {
    drops.push({ x: cell.x + (Math.random() - 0.5) * R * 0.2, y: cell.y + R * 0.15, vy: 0, stretch: 0, life: 1, r: R * 0.13 });
  }

  function drawDrop(d) {
    const r = d.r, s = 1 + d.stretch;
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.life);
    ctx.translate(d.x, d.y);
    // teardrop: round bottom, pointed top that stretches while falling
    ctx.beginPath();
    ctx.moveTo(0, -r * 2.2 * s);
    ctx.bezierCurveTo(r * 0.5, -r * 1.2 * s, r, -r * 0.2, r, r * 0.2);
    ctx.arc(0, r * 0.2, r, 0, Math.PI);
    ctx.bezierCurveTo(-r, -r * 0.2, -r * 0.5, -r * 1.2 * s, 0, -r * 2.2 * s);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.2, r * 0.1, 0, 0, r * 1.6);
    g.addColorStop(0, '#ffe7a3');
    g.addColorStop(0.45, '#f2a516');
    g.addColorStop(1, '#8a4706');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(242,165,22,.6)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.1, r * 0.22, r * 0.36, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,250,230,.55)';
    ctx.fill();
    ctx.restore();
  }

  let lastT = 0;
  function draw(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(base, 0, 0, W, H);

    // zoom: the hovered cell rises, others settle back
    for (const c of cells) {
      const target = c === hoverCell ? 1 : 0;
      c.zoom += (target - c.zoom) * Math.min(1, dt * 12);
      if (c.zoom > 0.01) {
        const r = R * (1 + 0.14 * c.zoom);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.7)';
        ctx.shadowBlur = 24 * c.zoom;
        ctx.shadowOffsetY = 8 * c.zoom;
        ctx.globalAlpha = Math.min(1, c.zoom * 1.5);
        drawCell(ctx, c, c.x, c.y, r, true);
        ctx.restore();
      }
    }

    // falling honey drops
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (d.stretch < 0.6 && d.vy < 1) { d.stretch += dt * 2.2; } // swelling before it lets go
      else { d.vy += 900 * dt; d.y += d.vy * dt; d.life -= dt * 0.9; }
      if (d.life <= 0 || d.y > H + 40) { drops.splice(i, 1); continue; }
      drawDrop(d);
    }

    ctx.globalCompositeOperation = 'lighter';
    const s = t / 1000;
    glow(W * (0.18 + 0.08 * Math.sin(s * 0.13)), H * (0.2 + 0.1 * Math.cos(s * 0.11)), Math.max(W, H) * 0.35, 'rgba(160,70,20,.14)');
    glow(W * (0.85 + 0.06 * Math.cos(s * 0.09)), H * (0.75 + 0.08 * Math.sin(s * 0.12)), Math.max(W, H) * 0.3, 'rgba(140,90,30,.12)');
    if (mouse.x > -999) glow(mouse.x, mouse.y, 240, 'rgba(255,170,40,.16)');
    ctx.globalCompositeOperation = 'source-over';
  }

  let running = false;
  function loop(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.15;
    mouse.y += (mouse.ty - mouse.y) * 0.15;
    draw(t);
    if (!document.hidden) requestAnimationFrame(loop); else running = false;
  }
  function start() { if (!running && !reduce) { running = true; lastT = performance.now(); requestAnimationFrame(loop); } }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    if (mouse.x < -999) { mouse.x = e.clientX; mouse.y = e.clientY; }
    mouse.tx = e.clientX; mouse.ty = e.clientY;
    const c = cellAt(e.clientX, e.clientY);
    if (c !== hoverCell) {
      hoverCell = c;
      if (c && c.kind === 'honey' && drops.length < 12) spawnDrop(c);
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { hoverCell = null; });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  resize();
  start();
})();
