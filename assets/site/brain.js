/* "Second brain": a small force-directed graph of honeycomb cells.
   Hubs open a tab; leaves open a tab and jump to an item inside it. */
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
    if (n.type === 'hub') links.push({ s: 'me', t: n.id, len: 210, k: 0.02 });
    if (n.parent) links.push({ s: n.parent, t: n.id, len: 92, k: 0.045 });
  });
  cross.forEach(([s, t]) => links.push({ s, t, len: 260, k: 0.0015, weak: true }));
  links.forEach((l) => { l.a = byId[l.s]; l.b = byId[l.t]; });

  const narrow = () => window.innerWidth < 640;
  let NARROW = narrow();
  const radius = (n) => (n.type === 'core' ? (NARROW ? 36 : 46) : n.type === 'hub' ? (NARROW ? 22 : 30) : (NARROW ? 7 : 9));

  function hex(r) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 90);
      d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(2) + ',' + (r * Math.sin(a)).toFixed(2);
    }
    return d + 'Z';
  }

  // defs: honey gradients
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <radialGradient id="g-core" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#f2a516"/><stop offset="1" stop-color="#8a4706"/>
    </radialGradient>
    <radialGradient id="g-hub" cx="35%" cy="30%" r="85%">
      <stop offset="0" stop-color="#f7c45a"/><stop offset=".55" stop-color="#b8650c"/><stop offset="1" stop-color="#4a2405"/>
    </radialGradient>
    <radialGradient id="g-leaf" cx="35%" cy="30%" r="85%">
      <stop offset="0" stop-color="#7d6a45"/><stop offset="1" stop-color="#2f2617"/>
    </radialGradient>`;
  svg.appendChild(defs);

  const gEdges = document.createElementNS(NS, 'g');
  const gNodes = document.createElementNS(NS, 'g');
  svg.append(gEdges, gNodes);

  links.forEach((l) => {
    l.el = document.createElementNS(NS, 'line');
    l.el.setAttribute('class', 'edge' + (l.weak ? ' weak' : ''));
    gEdges.appendChild(l.el);
  });

  nodes.forEach((n) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'node ' + (n.type || 'leaf'));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'link');
    g.setAttribute('aria-label', 'Open ' + n.label);
    const r = radius(n);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', hex(r));
    p.setAttribute('class', 'cell');
    p.setAttribute('fill', n.type === 'core' ? 'url(#g-core)' : n.type === 'hub' ? 'url(#g-hub)' : n.news ? '#ffcf5a' : 'url(#g-leaf)');
    p.setAttribute('stroke', n.type ? 'rgba(255,230,170,.55)' : 'rgba(243,234,216,.35)');
    p.setAttribute('stroke-width', n.type ? 1.5 : 1);
    g.appendChild(p);
    if (n.type) {
      const inner = document.createElementNS(NS, 'path');
      inner.setAttribute('d', hex(r - 6));
      inner.setAttribute('fill', 'none');
      inner.setAttribute('stroke', 'rgba(255,240,200,.28)');
      inner.setAttribute('stroke-dasharray', '2 3');
      inner.setAttribute('pointer-events', 'none');
      g.appendChild(inner);
    }
    const t = document.createElementNS(NS, 'text');
    t.textContent = n.label;
    if (n.type) {
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('y', r + 20);
      if (n.type === 'core') { t.setAttribute('font-size', '17'); t.setAttribute('font-weight', '800'); t.setAttribute('y', 6); t.setAttribute('class', 'core-label'); }
    } else {
      t.setAttribute('x', 14);
      t.setAttribute('y', 4);
    }
    g.appendChild(t);
    gNodes.appendChild(g);
    n.el = g; n.text = t;
    n.vx = 0; n.vy = 0;
  });

  // --- layout ---
  let W = 800, H = 560;
  function size() {
    const b = svg.getBoundingClientRect();
    W = Math.max(320, b.width); H = Math.max(380, b.height);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  size();
  const hubs = nodes.filter((n) => n.type === 'hub');
  nodes.forEach((n) => {
    if (n.type === 'core') { n.x = W / 2; n.y = H / 2; return; }
    if (n.type === 'hub') {
      const i = hubs.indexOf(n);
      const a = (i / hubs.length) * Math.PI * 2 - Math.PI / 2;
      n.x = W / 2 + Math.cos(a) * W * 0.3;
      n.y = H / 2 + Math.sin(a) * H * 0.32;
      return;
    }
    // fan leaves out on the far side of their hub, so the layout is the same on every visit
    const p = byId[n.parent];
    const sib = nodes.filter((m) => m.parent === n.parent);
    const k = sib.indexOf(n);
    const out = Math.atan2(p.y - H / 2, p.x - W / 2);
    const a = out + (k - (sib.length - 1) / 2) * 0.7;
    n.x = p.x + Math.cos(a) * 80;
    n.y = p.y + Math.sin(a) * 80;
  });

  let drag = null, alpha = 1;
  function tick() {
    const sc = Math.min(1.25, Math.max(0.62, W / 900));
    // pairwise repulsion + hard collision (leaves reserve room for their label)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        dx /= d; dy /= d;
        let f = (2600 * sc) / (d * d);
        const min = (radius(a) + radius(b)) + (a.type && b.type ? 70 : 34) * sc;
        if (d < min) f += (min - d) * 0.12;
        f = Math.min(f, 6);
        a.vx -= dx * f; a.vy -= dy * f * 1.2;
        b.vx += dx * f; b.vy += dy * f * 1.2;
      }
    }
    // springs
    links.forEach((l) => {
      const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - l.len * (NARROW && !l.weak && l.a.type === 'core' ? 1.35 : sc)) * l.k;
      l.a.vx += (dx / d) * f; l.a.vy += (dy / d) * f;
      l.b.vx -= (dx / d) * f; l.b.vy -= (dy / d) * f;
    });
    // gravity (weaker sideways so the brain uses the width), integrate, keep inside
    nodes.forEach((n) => {
      n.vx += (W / 2 - n.x) * (NARROW ? 0.004 : 0.0012);
      n.vy += (H / 2 - n.y) * (NARROW ? 0.0006 : 0.003);
      if (n === drag) { n.vx = n.vy = 0; return; }
      if (n.type === 'core') { n.x += (W / 2 - n.x) * 0.2; n.y += (H / 2 - n.y) * 0.2; n.vx = n.vy = 0; return; }
      n.vx *= 0.8; n.vy *= 0.8;
      n.x += n.vx * alpha; n.y += n.vy * alpha;
      const r = radius(n) + 6;
      const side = n.type ? Math.max(r, n.label.length * 4.6) : 12 + (n.label.length * (NARROW ? 6 : 6.6));
      n.x = Math.max(n.type ? side : (n.left ? side : r), Math.min(W - (n.type ? side : (n.left ? r : side)), n.x));
      n.y = Math.max(r + 24, Math.min(H - r - (n.type ? 26 : 4), n.y));
    });
  }
  function render() {
    links.forEach((l) => {
      l.el.setAttribute('x1', l.a.x.toFixed(1)); l.el.setAttribute('y1', l.a.y.toFixed(1));
      l.el.setAttribute('x2', l.b.x.toFixed(1)); l.el.setAttribute('y2', l.b.y.toFixed(1));
    });
    nodes.forEach((n) => {
      n.el.setAttribute('transform', `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`);
      if (!n.type) {
        const left = n.x < byId[n.parent].x - 4;
        if (left !== n.left) {
          n.left = left;
          n.text.setAttribute('text-anchor', left ? 'end' : 'start');
          n.text.setAttribute('x', left ? -14 : 14);
        }
      }
    });
  }
  // settle before first paint
  for (let i = 0; i < 400; i++) tick();
  render();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t0 = 0;
  function frame(t) {
    // gentle breathing so the brain feels alive
    if (!reduce && !drag) {
      nodes.forEach((n, i) => {
        n.vx += Math.sin(t / 1400 + i * 1.7) * 0.03;
        n.vy += Math.cos(t / 1700 + i * 2.3) * 0.03;
      });
    }
    alpha = drag ? 1 : Math.max(0.35, alpha * 0.995);
    tick(); render();
    if (svg.isConnected && svg.closest('[hidden]') == null) requestAnimationFrame(frame);
    else t0 = 0;
  }
  window.brainWake = function () { if (!t0) { t0 = 1; size(); requestAnimationFrame(frame); } };
  window.brainWake();

  // --- highlight neighbours ---
  function setHot(n) {
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
    links.forEach((l) => l.el.classList.remove('hot', 'dim'));
    nodes.forEach((m) => m.el.classList.remove('dim', 'hot'));
  }

  function toLocal(e) {
    const b = svg.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * W, y: ((e.clientY - b.top) / b.height) * H };
  }
  function open(n) { if (window.siteGo) window.siteGo(n.tab, n.anchor); }

  nodes.forEach((n) => {
    let start = null;
    n.el.addEventListener('pointerenter', () => setHot(n));
    n.el.addEventListener('pointerleave', () => { if (!drag) clearHot(); });
    n.el.addEventListener('focus', () => setHot(n));
    n.el.addEventListener('blur', clearHot);
    n.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
    n.el.addEventListener('pointerdown', (e) => {
      start = { x: e.clientX, y: e.clientY };
      drag = n; n.el.setPointerCapture(e.pointerId);
    });
    n.el.addEventListener('pointermove', (e) => {
      if (drag !== n) return;
      const p = toLocal(e);
      n.x = p.x; n.y = p.y;
    });
    n.el.addEventListener('pointerup', (e) => {
      const moved = start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6;
      drag = null; start = null; alpha = 1;
      if (!moved) open(n);
    });
    n.el.addEventListener('pointercancel', () => { drag = null; start = null; });
  });

  window.addEventListener('resize', () => { size(); });
})();
