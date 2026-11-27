/* "Second brain": a rotatable 3D ball of honeycomb cells.
   Marius sits in the centre, sections sit on an inner shell, topics on the outer shell.
   Drag to spin the ball; click a cell to open its tab (leaves jump to the item). */
(function () {
  const svg = document.getElementById('brain');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';

  const nodes = [
    { id: 'me', label: 'Marius', type: 'core', tab: 'cv' },
    { id: 'cv', label: 'CV', type: 'hub', tab: 'cv' },
    { id: 'projects', label: 'Projects done', type: 'hub', tab: 'projects' },
    { id: 'future', label: 'Future projects', type: 'hub', tab: 'future' },
    { id: 'publications', label: 'Publications', type: 'hub', tab: 'publications' },
    { id: 'contact', label: 'Contact', type: 'hub', tab: 'contact' },

    { id: 'ivi', label: 'IVI · Bern (2024–now)', parent: 'cv', tab: 'cv' },
    { id: 'epfl', label: 'EPFL', parent: 'cv', tab: 'cv' },
    { id: 'anat', label: 'Anatomy · Bern', parent: 'cv', tab: 'cv' },
    { id: 'msc', label: 'MSc × 2 · Madrid', parent: 'cv', tab: 'cv' },

    { id: 'zf', label: 'Zebrafish heart', parent: 'projects', tab: 'projects', anchor: 'p-zebrafish' },
    { id: 'adipose', label: 'Adipose atlas', parent: 'projects', tab: 'projects', anchor: 'p-adipose' },
    { id: 'mps', label: 'Cross-species immunity', parent: 'projects', tab: 'projects', anchor: 'p-mps' },
    { id: 'multiome', label: 'RNA + ATAC', parent: 'projects', tab: 'projects', anchor: 'p-multiome' },
    { id: 'variants', label: 'Variant calling', parent: 'projects', tab: 'projects', anchor: 'p-variants' },
    { id: 'shiny', label: 'Shiny apps', parent: 'projects', tab: 'projects', anchor: 'p-shiny' },

    { id: 'thermal', label: 'Thermal Honey', parent: 'future', tab: 'future', anchor: 'f-thermal' },
    { id: 'atlas', label: 'Genome Variant Atlas', parent: 'future', tab: 'future', anchor: 'f-genome' },
    { id: 'disease', label: 'Disease embeddings', parent: 'future', tab: 'future', anchor: 'f-disease' },
    { id: 'papagalul', label: 'Papagalul', parent: 'future', tab: 'future', anchor: 'f-papagalul' },

    { id: 'scirep', label: 'Sci. Reports 2023', parent: 'publications', tab: 'publications' },
    { id: 'cellrep', label: 'Cell Reports 2019', parent: 'publications', tab: 'publications' },

    { id: 'job', label: 'Open to work 2027', parent: 'contact', tab: 'contact', news: true },
    { id: 'fly', label: 'Paragliding', parent: 'contact', tab: 'contact' },
  ];
  const cross = [
    ['variants', 'atlas'], ['adipose', 'disease'], ['mps', 'atlas'], ['shiny', 'atlas'],
    ['fly', 'thermal'], ['zf', 'scirep'], ['zf', 'cellrep'], ['ivi', 'mps'], ['epfl', 'adipose'],
    ['epfl', 'multiome'], ['anat', 'zf'], ['job', 'me'],
  ];

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = [];
  nodes.forEach((n) => {
    if (n.type === 'hub') links.push({ a: byId.me, b: n });
    if (n.parent) links.push({ a: byId[n.parent], b: n });
  });
  cross.forEach(([s, t]) => links.push({ a: byId[s], b: byId[t], weak: true }));

  // ---------- 3D placement ----------
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const hubs = nodes.filter((n) => n.type === 'hub');
  // spread hub directions evenly (Fibonacci sphere)
  hubs.forEach((h, i) => {
    const y = 1 - (2 * (i + 0.5)) / hubs.length;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5)) + 0.6;
    h.dir = [Math.cos(th) * r, y * 0.9, Math.sin(th) * r];
    h.p = h.dir.map((v) => v * 0.52);
  });
  byId.me.p = [0, 0, 0];
  // leaves fan out around their hub on the outer shell
  hubs.forEach((h) => {
    const kids = nodes.filter((n) => n.parent === h.id);
    const up = Math.abs(h.dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const t1 = norm(cross3(h.dir, up)), t2 = cross3(h.dir, t1);
    kids.forEach((k, i) => {
      const a = (i / kids.length) * Math.PI * 2 + 0.4;
      const spread = 0.62;
      k.p = norm([0, 1, 2].map((j) => h.dir[j] + spread * (Math.cos(a) * t1[j] + Math.sin(a) * t2[j])));
    });
  });

  // ---------- SVG scaffolding ----------
  function hex(r) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 90);
      d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(2) + ',' + (r * Math.sin(a)).toFixed(2);
    }
    return d + 'Z';
  }
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <radialGradient id="g-core" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#f2a516"/><stop offset="1" stop-color="#8a4706"/>
    </radialGradient>
    <radialGradient id="g-hub" cx="35%" cy="30%" r="85%">
      <stop offset="0" stop-color="#f7c45a"/><stop offset=".55" stop-color="#b8650c"/><stop offset="1" stop-color="#4a2405"/>
    </radialGradient>
    <radialGradient id="g-leaf" cx="35%" cy="30%" r="85%">
      <stop offset="0" stop-color="#9a8456"/><stop offset="1" stop-color="#3a2e1b"/>
    </radialGradient>
    <radialGradient id="g-ball" cx="38%" cy="32%" r="70%">
      <stop offset="0" stop-color="rgba(255,200,90,.16)"/>
      <stop offset=".55" stop-color="rgba(242,165,22,.06)"/>
      <stop offset=".92" stop-color="rgba(120,60,8,.10)"/>
      <stop offset="1" stop-color="rgba(255,190,80,.28)"/>
    </radialGradient>`;
  svg.appendChild(defs);
  const ball = document.createElementNS(NS, 'circle');
  ball.setAttribute('class', 'ball');
  ball.setAttribute('fill', 'url(#g-ball)');
  const gRings = document.createElementNS(NS, 'g');
  gRings.setAttribute('class', 'rings');
  const gEdges = document.createElementNS(NS, 'g');
  const gNodes = document.createElementNS(NS, 'g');
  svg.append(ball, gRings, gEdges, gNodes);

  // orbit rings: equator + two meridians, drawn on the outer shell
  const rings = [];
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      pts.push(k === 0 ? [c, 0, s] : k === 1 ? [c, s, 0] : [0, s, c]);
    }
    const el = document.createElementNS(NS, 'path');
    gRings.appendChild(el);
    rings.push({ pts, el });
  }

  links.forEach((l) => {
    l.el = document.createElementNS(NS, 'line');
    l.el.setAttribute('class', 'edge' + (l.weak ? ' weak' : ''));
    gEdges.appendChild(l.el);
  });

  const baseR = (n) => (n.type === 'core' ? 40 : n.type === 'hub' ? 26 : 9);
  nodes.forEach((n) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'node ' + (n.type || 'leaf'));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'link');
    g.setAttribute('aria-label', 'Open ' + n.label);
    const r = baseR(n);
    const inner = document.createElementNS(NS, 'g');
    inner.setAttribute('class', 'cell-wrap');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', hex(r));
    p.setAttribute('class', 'cell');
    p.setAttribute('fill', n.type === 'core' ? 'url(#g-core)' : n.type === 'hub' ? 'url(#g-hub)' : n.news ? '#ffcf5a' : 'url(#g-leaf)');
    p.setAttribute('stroke', n.type ? 'rgba(255,230,170,.6)' : 'rgba(243,234,216,.4)');
    p.setAttribute('stroke-width', n.type ? 1.5 : 1);
    inner.appendChild(p);
    if (n.type) {
      const ring = document.createElementNS(NS, 'path');
      ring.setAttribute('d', hex(r - 6));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'rgba(255,240,200,.3)');
      ring.setAttribute('stroke-dasharray', '2 3');
      ring.setAttribute('pointer-events', 'none');
      inner.appendChild(ring);
    }
    g.appendChild(inner);
    const t = document.createElementNS(NS, 'text');
    t.textContent = n.label;
    if (n.type === 'core') { t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', 6); t.setAttribute('class', 'core-label'); }
    else if (n.type === 'hub') { t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', r + 20); }
    else { t.setAttribute('x', 14); t.setAttribute('y', 4); }
    g.appendChild(t);
    gNodes.appendChild(g);
    n.el = g; n.inner = inner; n.text = t;
  });

  // ---------- rotation state ----------
  // M is a 3x3 rotation matrix (row-major). Drag applies small rotations about screen axes.
  let M = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  function rotate(ax, ay) { // ax: about screen x-axis, ay: about screen y-axis
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
    const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
    const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
    M = mul(Ry, mul(Rx, M));
  }
  function mul(A, B) {
    const C = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
      C[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return C;
  }
  rotate(-0.35, 0.5); // a pleasant starting tilt

  let W = 800, H = 600, R = 240, cx = 400, cy = 300;
  function size() {
    const b = svg.getBoundingClientRect();
    if (!b.width) return;
    W = b.width; H = b.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    R = Math.min(W * (W < 640 ? 0.4 : 0.3), H * 0.4);
    cx = W / 2; cy = H / 2;
    ball.setAttribute('cx', cx); ball.setAttribute('cy', cy); ball.setAttribute('r', R * 1.08);
  }
  const D = 3.2; // camera distance in sphere radii
  function project(v) {
    const x = M[0] * v[0] + M[1] * v[1] + M[2] * v[2];
    const y = M[3] * v[0] + M[4] * v[1] + M[5] * v[2];
    const z = M[6] * v[0] + M[7] * v[1] + M[8] * v[2];
    const f = D / (D - z);
    return { x: cx + x * R * f, y: cy - y * R * f, z, f };
  }

  let hot = null;
  function render() {
    rings.forEach((r) => {
      let d = '';
      r.pts.forEach((p, i) => { const q = project(p); d += (i ? 'L' : 'M') + q.x.toFixed(1) + ',' + q.y.toFixed(1); });
      r.el.setAttribute('d', d);
    });
    nodes.forEach((n) => { n.s = project(n.p); });
    links.forEach((l) => {
      l.el.setAttribute('x1', l.a.s.x.toFixed(1)); l.el.setAttribute('y1', l.a.s.y.toFixed(1));
      l.el.setAttribute('x2', l.b.s.x.toFixed(1)); l.el.setAttribute('y2', l.b.s.y.toFixed(1));
      const depth = (l.a.s.z + l.b.s.z) / 2; // -1 (back) .. 1 (front)
      l.el.style.opacity = hot ? '' : (0.25 + 0.75 * (depth + 1) / 2).toFixed(2);
    });
    const order = nodes.slice().sort((a, b) => a.s.z - b.s.z);
    order.forEach((n) => {
      const k = n.s.f;
      const front = (n.s.z + 1) / 2; // 0 back .. 1 front
      n.el.setAttribute('transform', `translate(${n.s.x.toFixed(1)},${n.s.y.toFixed(1)})`);
      n.inner.setAttribute('transform', `scale(${(k * (W < 640 ? 0.8 : 1)).toFixed(3)})`);
      n.el.style.opacity = hot ? '' : (0.3 + 0.7 * front).toFixed(2);
      if (n.type === 'core') n.el.style.opacity = '';
      if (!n.type) {
        // narrow screens: label under the cell; wide: label on the outer side
        const mode = W < 640 ? 'below' : n.s.x < cx ? 'left' : 'right';
        if (mode !== n.mode) {
          n.mode = mode;
          n.text.setAttribute('text-anchor', mode === 'below' ? 'middle' : mode === 'left' ? 'end' : 'start');
          n.text.setAttribute('x', mode === 'below' ? 0 : mode === 'left' ? -14 : 14);
          n.text.setAttribute('y', mode === 'below' ? 22 : 4);
        }
        // only cells facing you carry a label, so the ball stays readable
        n.text.style.visibility = (n.s.z > (W < 640 ? 0.25 : 0.05)) || n === hot ? 'visible' : 'hidden';
      }
      gNodes.appendChild(n.el); // painter's order: back to front
    });
  }

  // ---------- interaction ----------
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vx = 0, vy = reduce ? 0 : 0.0022; // angular velocity (rad per frame)
  let dragging = false, last = null, moved = 0, downNode = null, paused = false;

  function setHot(n) {
    hot = n;
    const near = new Set([n.id]);
    links.forEach((l) => {
      const on = l.a === n || l.b === n;
      if (on) { near.add(l.a.id); near.add(l.b.id); }
      l.el.classList.toggle('hot', on);
      l.el.classList.toggle('dim', !on);
    });
    nodes.forEach((m) => { m.el.classList.toggle('dim', !near.has(m.id)); m.el.classList.toggle('hot', m === n); });
  }
  function clearHot() {
    hot = null;
    links.forEach((l) => l.el.classList.remove('hot', 'dim'));
    nodes.forEach((m) => m.el.classList.remove('dim', 'hot'));
  }
  function open(n) { if (window.siteGo) window.siteGo(n.tab, n.anchor); }

  svg.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; last = { x: e.clientX, y: e.clientY };
    downNode = nodes.find((n) => n.el.contains(e.target)) || null;
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('grabbing');
  });
  svg.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    moved += Math.abs(dx) + Math.abs(dy);
    last = { x: e.clientX, y: e.clientY };
    const k = 1 / R;
    rotate(-dy * k, dx * k);
    vy = dx * k; vx = -dy * k;
    render();
  });
  function end() {
    if (!dragging) return;
    dragging = false;
    svg.classList.remove('grabbing');
    if (moved < 6 && downNode) open(downNode);
    downNode = null;
  }
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  nodes.forEach((n) => {
    n.el.addEventListener('pointerenter', () => { if (!dragging) { paused = true; setHot(n); render(); } });
    n.el.addEventListener('pointerleave', () => { paused = false; if (!dragging) { clearHot(); render(); } });
    n.el.addEventListener('focus', () => { paused = true; setHot(n); render(); });
    n.el.addEventListener('blur', () => { paused = false; clearHot(); render(); });
    n.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
  });
  // arrow keys spin the ball when it has focus
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', (e) => {
    const step = 0.12;
    if (e.key === 'ArrowLeft') rotate(0, -step); else if (e.key === 'ArrowRight') rotate(0, step);
    else if (e.key === 'ArrowUp') rotate(-step, 0); else if (e.key === 'ArrowDown') rotate(step, 0);
    else return;
    e.preventDefault(); render();
  });

  let running = false;
  function frame() {
    if (!dragging && !paused) {
      rotate(vx, vy);
      // ease back to a gentle idle spin
      const idle = reduce ? 0 : 0.0022;
      vx *= 0.95; vy = vy * 0.95 + idle * 0.05;
      render();
    }
    if (svg.closest('[hidden]') == null && visible) requestAnimationFrame(frame);
    else running = false;
  }
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) window.brainWake(); }).observe(svg);
  }
  window.brainWake = function () {
    size(); render();
    if (!running) { running = true; requestAnimationFrame(frame); }
  };
  window.brainWake();
  window.addEventListener('resize', () => { size(); render(); });
})();
