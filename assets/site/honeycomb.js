/* Beeswax honeycomb background, plus a small hidden honey game.
   - The comb is painted to an offscreen canvas. Every few seconds a new random comb
     is painted and slowly cross-faded in, so the panel keeps changing.
   - The cell under the cursor lifts and zooms; honey cells release a drop.
   - Stay on the home screen for a few seconds and a honey bear with a pot walks in.
     It follows the mouse; catch drops in the pot, and every 3 drops a coin pops out. */
(function () {
  const canvas = document.getElementById('comb');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const layers = [document.createElement('canvas'), document.createElement('canvas')];
  let cur = 0, fade = 1; // fade: 0..1 progress of the newest layer
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let W = 0, H = 0, DPR = 1, R = 60;
  let cells = [];
  let seed = Math.random() * 1000;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  let hoverCell = null;
  const drops = [];

  // --- value noise ---
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
      const a = Math.PI / 180 * (60 * i - 90);
      const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }

  function drawCell(c, cell, x, y, r, lift) {
    const wall = Math.max(4, r * 0.12);
    const L = { x: -0.6, y: -0.8 };
    hexPath(c, x, y, r);
    const wg = c.createLinearGradient(x + L.x * r, y + L.y * r, x - L.x * r, y - L.y * r);
    wg.addColorStop(0, lift ? '#7a6238' : '#5a4729');
    wg.addColorStop(0.5, lift ? '#544228' : '#40331f');
    wg.addColorStop(1, '#261e13');
    c.fillStyle = wg;
    c.fill();

    const ir = r - wall;
    hexPath(c, x, y, ir);
    if (cell.kind === 'empty') {
      const g = c.createRadialGradient(x - L.x * ir * 0.35, y - L.y * ir * 0.35, ir * 0.1, x, y, ir * 1.1);
      g.addColorStop(0, '#15110b');
      g.addColorStop(0.65, '#211a11');
      g.addColorStop(1, '#382c1c');
      c.fillStyle = g;
      c.fill();
    } else if (cell.kind === 'honey') {
      c.fillStyle = '#1a1007';
      c.fill();
      const g = c.createRadialGradient(x - ir * 0.25, y - ir * 0.3, ir * 0.05, x, y, ir * 1.05);
      g.addColorStop(0, lift ? 'rgba(255,214,110,.9)' : 'rgba(255,196,70,.62)');
      g.addColorStop(0.45, lift ? 'rgba(220,130,20,.75)' : 'rgba(200,115,14,.5)');
      g.addColorStop(1, 'rgba(80,38,6,.6)');
      c.fillStyle = g;
      hexPath(c, x, y, ir);
      c.fill();
      c.beginPath();
      c.ellipse(x - ir * 0.28, y - ir * 0.36, ir * 0.32, ir * 0.12, -0.5, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,236,190,.28)';
      c.fill();
    } else {
      const g = c.createRadialGradient(x - ir * 0.3, y - ir * 0.35, ir * 0.05, x, y, ir);
      g.addColorStop(0, lift ? '#b89a62' : '#9a8150');
      g.addColorStop(0.6, '#6a5633');
      g.addColorStop(1, '#443621');
      c.fillStyle = g;
      c.fill();
    }
  }

  // Build a new random comb layout and paint it into the spare layer.
  function paintLayer(layer) {
    const bctx = layer.getContext('2d');
    layer.width = W * DPR; layer.height = H * DPR;
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bctx.fillStyle = '#211b12';
    bctx.fillRect(0, 0, W, H);
    R = W < 640 ? 42 : 64;
    const dx = Math.sqrt(3) * R, dy = 1.5 * R;
    const cols = Math.ceil(W / dx) + 2, rows = Math.ceil(H / dy) + 2;
    const list = [];
    for (let r = -1; r < rows; r++) {
      for (let q = -1; q < cols; q++) {
        const x = q * dx + (r & 1 ? dx / 2 : 0);
        const y = r * dy;
        const n = noise(q * 0.3 + seed, r * 0.3 + seed * 0.7);
        const n2 = noise(q * 0.7 + 40 + seed, r * 0.7 + 40);
        const kind = n > 0.7 ? (n2 > 0.6 ? 'cap' : 'honey') : n > 0.62 && n2 > 0.55 ? 'honey' : 'empty';
        const cell = { x, y, kind, zoom: 0 };
        list.push(cell);
        drawCell(bctx, cell, x, y, R, false);
      }
    }
    // veil keeps the centre calm so text reads
    const v = bctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(33,28,20,.8)');
    v.addColorStop(0.6, 'rgba(33,28,20,.62)');
    v.addColorStop(1, 'rgba(33,28,20,.36)');
    bctx.fillStyle = v;
    bctx.fillRect(0, 0, W, H);
    return list;
  }

  function morph() {
    seed += 3.7 + Math.random() * 4;
    const next = 1 - cur;
    cells = paintLayer(layers[next]);
    hoverCell = null;
    cur = next;
    fade = 0;
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
    cells = paintLayer(layers[cur]);
    paintLayer(layers[1 - cur]);
    fade = 1;
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

  function spawnDrop(x, y) {
    drops.push({ x: x + (Math.random() - 0.5) * R * 0.2, y: y + R * 0.15, vy: 0, stretch: 0, life: 1, r: R * 0.13 });
  }

  function dropShape(r, s) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 2.2 * s);
    ctx.bezierCurveTo(r * 0.5, -r * 1.2 * s, r, -r * 0.2, r, r * 0.2);
    ctx.arc(0, r * 0.2, r, 0, Math.PI);
    ctx.bezierCurveTo(-r, -r * 0.2, -r * 0.5, -r * 1.2 * s, 0, -r * 2.2 * s);
  }
  function drawDrop(d) {
    const r = d.r, s = 1 + d.stretch;
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.life);
    ctx.translate(d.x, d.y);
    dropShape(r, s);
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

  /* ---------------- honey bear mini game ---------------- */
  const game = {
    on: false, homeSince: 0, x: -100, vx: 0, face: 1, step: 0,
    caught: 0, coins: 0, splash: 0, lastDrip: 0, pops: [], coinFx: [],
  };
  game.drops = drops;
  window.__honey = game; // handy for checking the score in the console
  function onHomeHero() {
    const home = document.getElementById('tab-home');
    return home && !home.hidden && window.scrollY < window.innerHeight * 0.45;
  }
  function bearY() { return H - 18; }

  // A brown bear in side view, walking on four legs, with a honey pot strapped on its back.
  // Facing +x; ground at y = 0. Gait: diagonal leg pairs swing together.
  function leg(px, py, len, ang, lift, wTop, wPaw, col) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-wTop / 2, -4);
    ctx.quadraticCurveTo(-wTop / 2 - 2, len * 0.5, -wPaw / 2, len - lift);
    ctx.lineTo(wPaw / 2 + 3, len - lift);
    ctx.quadraticCurveTo(wTop / 2 + 1, len * 0.45, wTop / 2, -4);
    ctx.closePath();
    ctx.fill();
    // paw
    ctx.beginPath();
    ctx.ellipse(1.5, len - lift - 1, wPaw / 2 + 2.5, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawBear() {
    const x = game.x, y = bearY();
    const ph = game.step;                      // gait phase
    const moving = Math.min(1, Math.abs(game.vx) / 60);
    const sw = 0.42 * moving;                  // leg swing amplitude
    const bob = Math.abs(Math.sin(ph)) * 2.2 * moving;
    const headBob = Math.sin(ph * 2) * 1.6 * moving;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(game.face * 0.95, 0.95);
    // ground shadow
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(-4, 1, 56, 5, 0, 0, Math.PI * 2); ctx.fill();

    const furFar = '#3e2614', fur = '#6e4424', furHi = '#8f5c31', furLow = '#4a2d17';
    const L = 31;
    const lf = (o) => Math.sin(ph + o) * sw;
    const lifted = (o) => Math.max(0, Math.cos(ph + o)) * 5 * moving;
    // far legs (darker, behind the body)
    leg(24, -34 - bob, L, lf(Math.PI), lifted(Math.PI), 13, 10, furFar);
    leg(-34, -33 - bob, L - 1, lf(0), lifted(0), 15, 10, furFar);

    ctx.translate(0, -bob);
    // body: rump, back, shoulder hump, chest, belly
    const bg = ctx.createLinearGradient(0, -66, 0, -16);
    bg.addColorStop(0, furHi); bg.addColorStop(0.55, fur); bg.addColorStop(1, furLow);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-52, -32);
    ctx.bezierCurveTo(-54, -50, -38, -58, -18, -57);
    ctx.bezierCurveTo(-2, -57, 4, -66, 16, -66);       // shoulder hump
    ctx.bezierCurveTo(30, -66, 38, -58, 41, -48);
    ctx.lineTo(42, -30);
    ctx.bezierCurveTo(36, -20, 20, -18, 4, -20);
    ctx.bezierCurveTo(-18, -20, -34, -17, -46, -22);
    ctx.closePath();
    ctx.fill();
    // fur strokes
    ctx.strokeStyle = 'rgba(30,16,6,.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const fx = -44 + i * 9, fy = -48 + Math.sin(i * 1.7) * 6;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 3, fy + 5); ctx.stroke();
    }
    // tiny tail
    ctx.fillStyle = furLow;
    ctx.beginPath(); ctx.ellipse(-53, -40, 4, 3, 0.4, 0, Math.PI * 2); ctx.fill();

    // head (bobs slightly with the gait)
    ctx.save();
    ctx.translate(0, headBob);
    const hg = ctx.createLinearGradient(30, -62, 60, -30);
    hg.addColorStop(0, furHi); hg.addColorStop(1, fur);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(30, -54);
    ctx.bezierCurveTo(38, -64, 52, -60, 57, -50);
    ctx.lineTo(68, -44);                                // top of snout
    ctx.bezierCurveTo(73, -42, 72, -36, 67, -35);       // nose tip
    ctx.lineTo(54, -33);                                // jaw
    ctx.bezierCurveTo(44, -32, 36, -36, 32, -42);
    ctx.closePath();
    ctx.fill();
    // muzzle, lighter
    ctx.fillStyle = 'rgba(196,150,96,.55)';
    ctx.beginPath(); ctx.ellipse(62, -39, 8, 4.5, -0.15, 0, Math.PI * 2); ctx.fill();
    // ear
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.arc(39, -59, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = furFar;
    ctx.beginPath(); ctx.arc(39.5, -58.5, 2.4, 0, Math.PI * 2); ctx.fill();
    // eye and nose
    ctx.fillStyle = '#140a04';
    ctx.beginPath(); ctx.arc(52, -50, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(52.6, -50.6, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#140a04';
    ctx.beginPath(); ctx.ellipse(70, -40, 2.8, 2.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,4,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(67, -35.5); ctx.quadraticCurveTo(62, -33.5, 57, -34.5); ctx.stroke();
    ctx.restore();

    // honey pot strapped on the back (open top catches the drops)
    ctx.save();
    ctx.translate(-10, -60);
    ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2.5;            // straps
    ctx.beginPath(); ctx.moveTo(-9, 6); ctx.quadraticCurveTo(-12, 26, -8, 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 6); ctx.quadraticCurveTo(12, 26, 8, 40); ctx.stroke();
    const pg = ctx.createLinearGradient(-15, 0, 15, 0);
    pg.addColorStop(0, '#7d3f16'); pg.addColorStop(0.45, '#c9733a'); pg.addColorStop(1, '#6a3412');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(-13, -14); ctx.quadraticCurveTo(-19, 2, -11, 9); ctx.lineTo(11, 9);
    ctx.quadraticCurveTo(19, 2, 13, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8b4a1c';
    ctx.beginPath(); ctx.ellipse(0, -14, 14.5, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a516';
    ctx.beginPath(); ctx.ellipse(0, -13.6, 11.5, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,.5)';
    ctx.beginPath(); ctx.ellipse(-4, -14, 4, 0.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1d2a0';                                  // hexagon label
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 4.5, -2 + Math.sin(a) * 4.5); }
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.translate(0, bob);
    // near legs (in front of the body)
    leg(28, -34 - bob, L, lf(0), lifted(0), 14, 11, fur);
    leg(-30, -33 - bob, L - 1, lf(Math.PI), lifted(Math.PI), 16, 11, fur);
    ctx.restore();
  }
  function potMouth() {
    const bob = Math.abs(Math.sin(game.step)) * 2.2 * Math.min(1, Math.abs(game.vx) / 60);
    return { x: game.x - 10 * 0.95 * game.face, y: bearY() - (74 + bob) * 0.95 };
  }

  function drawHud() {
    const txt = `🍯 ${game.caught}   ●  ${game.coins}`;
    ctx.save();
    ctx.font = '500 13px "IBM Plex Mono", monospace';
    const w = ctx.measureText(txt).width + 24;
    const x = Math.min(W - w - 10, Math.max(10, game.x - w / 2)), y = bearY() - 128;
    ctx.fillStyle = 'rgba(33,28,20,.75)';
    ctx.strokeStyle = 'rgba(242,165,22,.5)';
    ctx.beginPath(); ctx.roundRect(x, y, w, 24, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffcf5a';
    ctx.fillText(txt, x + 12, y + 16.5);
    ctx.restore();
  }
  function drawCoin(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(Math.cos(c.spin), 1);
    ctx.globalAlpha = Math.max(0, c.life);
    const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
    g.addColorStop(0, '#fff2b8'); g.addColorStop(0.6, '#f2b51c'); g.addColorStop(1, '#a8650a');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(255,200,80,.8)'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#a8650a'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 6, Math.sin(a) * 6); }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  function updateGame(t, dt) {
    const here = finePointer && !reduce && onHomeHero() && mouse.x > -999;
    if (!here) { game.homeSince = 0; if (game.on) { game.on = false; document.body.classList.remove('honey-game'); } return; }
    if (!game.homeSince) game.homeSince = t;
    if (!game.on && t - game.homeSince > 4000) {
      game.on = true;
      document.body.classList.add('honey-game');
      game.x = mouse.x < W / 2 ? W + 60 : -60; // walk in from the far side
      game.lastDrip = t;
    }
    if (!game.on) return;
    // follow the mouse horizontally
    const target = Math.max(70, Math.min(W - 70, mouse.x + 10 * 0.95 * game.face));
    const dx = target - game.x;
    game.vx = Math.max(-460, Math.min(460, dx * 5));
    if (Math.abs(dx) < 2) game.vx = 0;
    game.x += game.vx * dt;
    if (Math.abs(game.vx) > 30) game.face = game.vx > 0 ? 1 : -1;
    game.step += dt * Math.min(16, Math.abs(game.vx) / 22);
    // honey cells drip on their own while the game runs
    if (t - game.lastDrip > 1400 + Math.random() * 1400 && drops.length < 8) {
      const top = cells.filter((c) => c.kind === 'honey' && c.y > 40 && c.y < H * 0.55 && c.x > 20 && c.x < W - 20);
      if (top.length) { const c = top[(Math.random() * top.length) | 0]; spawnDrop(c.x, c.y); }
      game.lastDrip = t;
    }
    // catch
    const m = potMouth();
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (d.vy > 0 && Math.abs(d.x - m.x) < 18 && Math.abs(d.y - m.y) < 14) {
        drops.splice(i, 1);
        game.caught++;
        game.pops.push({ x: m.x, y: m.y, life: 1 });
        if (game.caught % 3 === 0) {
          game.coins++;
          game.coinFx.push({ x: m.x, y: m.y - 6, vx: (Math.random() - 0.5) * 120, vy: -420, spin: 0, life: 1.4 });
        }
      }
    }
  }
  function drawGame(dt) {
    if (!game.on && !game.coinFx.length) return;
    if (game.on) { drawBear(); drawHud(); }
    for (let i = game.pops.length - 1; i >= 0; i--) {
      const p = game.pops[i];
      p.life -= dt * 2.5;
      if (p.life <= 0) { game.pops.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.life) * 22 + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    for (let i = game.coinFx.length - 1; i >= 0; i--) {
      const c = game.coinFx[i];
      c.vy += 700 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.spin += dt * 10; c.life -= dt * 0.9;
      if (c.life <= 0 || c.y > H + 30) { game.coinFx.splice(i, 1); continue; }
      drawCoin(c);
    }
  }

  /* ---------------- frame ---------------- */
  let lastT = 0, lastMorph = 0;
  function draw(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (!lastMorph) lastMorph = t;
    if (!reduce && fade >= 1 && t - lastMorph > 9000) { morph(); lastMorph = t; }
    if (fade < 1) fade = Math.min(1, fade + dt / 3.5); // slow cross-fade into the new comb

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(layers[1 - cur], 0, 0, W, H);
    if (fade > 0) { ctx.globalAlpha = smooth(fade); ctx.drawImage(layers[cur], 0, 0, W, H); ctx.globalAlpha = 1; }

    for (const c of cells) {
      const target = c === hoverCell ? 1 : 0;
      c.zoom += (target - c.zoom) * Math.min(1, dt * 12);
      if (c.zoom > 0.01) {
        const r = R * (1 + 0.14 * c.zoom);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.6)';
        ctx.shadowBlur = 24 * c.zoom;
        ctx.shadowOffsetY = 8 * c.zoom;
        ctx.globalAlpha = Math.min(1, c.zoom * 1.5) * Math.max(0.2, fade);
        drawCell(ctx, c, c.x, c.y, r, true);
        ctx.restore();
      }
    }

    updateGame(t, dt);
    const g = game.on ? 520 : 900;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (d.stretch < 0.6 && d.vy < 1) { d.stretch += dt * 2.2; }
      else { d.vy += g * dt; d.y += d.vy * dt; if (!game.on) d.life -= dt * 0.9; }
      if (d.life <= 0 || d.y > H + 40) { drops.splice(i, 1); continue; }
      drawDrop(d);
    }
    drawGame(dt);

    ctx.globalCompositeOperation = 'lighter';
    const s = t / 1000;
    glow(W * (0.18 + 0.08 * Math.sin(s * 0.13)), H * (0.2 + 0.1 * Math.cos(s * 0.11)), Math.max(W, H) * 0.35, 'rgba(170,80,25,.13)');
    glow(W * (0.85 + 0.06 * Math.cos(s * 0.09)), H * (0.75 + 0.08 * Math.sin(s * 0.12)), Math.max(W, H) * 0.3, 'rgba(150,100,35,.11)');
    if (mouse.x > -999) glow(mouse.x, mouse.y, 240, 'rgba(255,170,40,.15)');
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
      if (c && c.kind === 'honey' && drops.length < 12) spawnDrop(c.x, c.y);
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { hoverCell = null; });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  resize();
  start();
})();
