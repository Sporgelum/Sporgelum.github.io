/* Concept illustrations for future projects, drawn as SVG. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  /* ---------- Thermal Honey ---------- */
  const t = document.getElementById('thermal-art');
  if (t) {
    t.innerHTML = `
      <defs>
        <linearGradient id="th-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1b2230"/><stop offset="1" stop-color="#0e0c09"/>
        </linearGradient>
        <radialGradient id="th-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#fff1c2"/><stop offset=".4" stop-color="#ffcf5a"/><stop offset="1" stop-color="rgba(242,165,22,0)"/>
        </radialGradient>
        <linearGradient id="th-drop" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="rgba(242,165,22,.75)"/><stop offset="1" stop-color="rgba(255,207,90,.05)"/>
        </linearGradient>
      </defs>
      <rect width="520" height="380" fill="url(#th-sky)"/>`;
    const N = 16, cw = 13, ch = 6.5, ox = 260, oy = 150;
    // terrain: an alpine ridge running W-E with a side valley
    const H = (i, j) => {
      const ridge = Math.exp(-((j - 6) ** 2) / 10) * 42;
      const peak = Math.exp(-((i - 10) ** 2 + (j - 5) ** 2) / 8) * 30;
      const valley = -Math.exp(-((i - 4) ** 2) / 6) * 14;
      return Math.max(0, ridge + peak + valley + Math.sin(i * 0.9) * 3);
    };
    const P = (i, j, h) => [ox + (i - j) * cw, oy + (i + j) * ch - h];
    const sun = [-0.35, 0.75, 0.56]; // light from the south (+j) and a bit west, high
    const cells = [];
    for (let s = 0; s <= 2 * (N - 1); s++) {
      for (let i = 0; i < N; i++) {
        const j = s - i;
        if (j < 0 || j >= N) continue;
        const h00 = H(i, j), h10 = H(i + 1, j), h01 = H(i, j + 1), h11 = H(i + 1, j + 1);
        const gx = (h10 + h11 - h00 - h01) / 2 / 10, gy = (h01 + h11 - h00 - h10) / 2 / 10;
        const nz = 1 / Math.hypot(gx, gy, 1);
        const lit = Math.max(0, (-gx * sun[0] - gy * sun[1]) * nz + nz * sun[2]);
        const heat = Math.min(1, Math.max(0, (lit - 0.45) * 2.2 + (h00 / 70) * 0.35));
        cells.push({ i, j, heat, h: (h00 + h11) / 2 });
        const pts = [P(i, j, h00), P(i + 1, j, h10), P(i + 1, j + 1, h11), P(i, j + 1, h01)];
        const c1 = [42, 34, 22], c2 = [190, 100, 12], c3 = [255, 214, 110];
        const mix = (a, b, k) => a.map((v, x) => Math.round(v + (b[x] - v) * k));
        const col = heat < 0.6 ? mix(c1, c2, heat / 0.6) : mix(c2, c3, (heat - 0.6) / 0.4);
        el('polygon', {
          points: pts.map((p) => p.join(',')).join(' '),
          fill: `rgb(${col})`,
          stroke: 'rgba(14,12,9,.55)', 'stroke-width': 0.6,
        }, t);
      }
    }
    // honey layer: a translucent sheet hugging the terrain
    const sheet = [];
    for (let i = 0; i <= N; i += 2) sheet.push(P(i, 0, H(i, 0) + 16));
    for (let j = 0; j <= N; j += 2) sheet.push(P(N, j, H(N, j) + 16));
    for (let i = N; i >= 0; i -= 2) sheet.push(P(i, N, H(i, N) + 16));
    for (let j = N; j >= 0; j -= 2) sheet.push(P(0, j, H(0, j) + 16));
    el('polygon', { points: sheet.map((p) => p.join(',')).join(' '), fill: 'rgba(242,165,22,.1)', stroke: 'rgba(255,207,90,.35)', 'stroke-dasharray': '3 3' }, t);

    // thermals: the honey gathers and lifts off where the heat is highest
    const hot = cells.filter((c) => c.i > 1 && c.j > 1 && c.i < N - 2 && c.j < N - 2)
      .sort((a, b) => b.heat - a.heat);
    const picks = [];
    hot.forEach((c) => { if (picks.length < 3 && picks.every((p) => Math.hypot(p.i - c.i, p.j - c.j) > 5)) picks.push(c); });
    picks.forEach((c, k) => {
      const [x, y] = P(c.i + 0.5, c.j + 0.5, c.h + 14);
      const top = y - 90 - k * 10;
      // inverted honey drop rising
      el('path', {
        d: `M${x - 9},${y} C${x - 14},${y - 30} ${x - 4},${top + 30} ${x},${top + 12} C${x + 4},${top + 30} ${x + 14},${y - 30} ${x + 9},${y} Z`,
        fill: 'url(#th-drop)',
      }, t);
      el('circle', { cx: x, cy: top + 10, r: 6, fill: 'rgba(255,207,90,.7)' }, t);
      // cumulus forming on top
      const cl = el('g', { opacity: 0.9 }, t);
      [[-16, 0, 11], [-4, -7, 14], [10, -3, 12], [20, 3, 8], [0, 4, 10]].forEach(([dx, dy, r]) =>
        el('circle', { cx: x + dx, cy: top - 14 + dy, r, fill: '#e9e2d2' }, cl));
      el('rect', { x: x - 26, y: top - 12, width: 54, height: 10, fill: '#cfc6b3' }, cl);
    });
    // glider circling the first thermal
    if (picks[0]) {
      const [x, y] = P(picks[0].i + 0.5, picks[0].j + 0.5, picks[0].h + 14);
      el('ellipse', { cx: x, cy: y - 55, rx: 26, ry: 8, fill: 'none', stroke: 'rgba(243,234,216,.6)', 'stroke-dasharray': '2 4' }, t);
      el('path', { d: `M${x + 18},${y - 63} q8,-6 16,0`, fill: 'none', stroke: '#2aa39a', 'stroke-width': 3, 'stroke-linecap': 'round' }, t);
    }
    // sun in the south
    el('circle', { cx: 70, cy: 70, r: 46, fill: 'url(#th-sun)' }, t);
    el('circle', { cx: 70, cy: 70, r: 13, fill: '#fff1c2' }, t);
    // compass: S points to the lower left in this view
    const cx = 455, cy = 320;
    const g = el('g', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 11, fill: '#c9bc9f', 'text-anchor': 'middle' }, t);
    el('circle', { cx, cy, r: 26, fill: 'none', stroke: 'rgba(243,234,216,.25)' }, g);
    [['N', 1, -0.5], ['S', -1, 0.5], ['E', 1, 0.5], ['W', -1, -0.5]].forEach(([l, dx, dy]) => {
      const len = Math.hypot(dx, dy);
      el('line', { x1: cx, y1: cy, x2: cx + (dx / len) * 22, y2: cy + (dy / len) * 22, stroke: l === 'S' ? '#f2a516' : 'rgba(243,234,216,.4)', 'stroke-width': l === 'S' ? 2 : 1 }, g);
      el('text', { x: cx + (dx / len) * 36, y: cy + (dy / len) * 36 + 4, fill: l === 'S' ? '#f2a516' : '#c9bc9f' }, g).textContent = l;
    });
    // legend
    const lg = el('g', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, fill: '#8f8470' }, t);
    el('defs', {}, t).innerHTML = '<linearGradient id="th-leg"><stop offset="0" stop-color="rgb(42,34,22)"/><stop offset=".6" stop-color="rgb(190,100,12)"/><stop offset="1" stop-color="rgb(255,214,110)"/></linearGradient>';
    el('rect', { x: 20, y: 352, width: 120, height: 8, fill: 'url(#th-leg)', rx: 1 }, lg);
    el('text', { x: 20, y: 346 }, lg).textContent = 'thermal factor per square';
  }

  /* ---------- Genome Variant Atlas ---------- */
  const gsv = document.getElementById('genome-art');
  if (gsv) {
    seed = 11;
    gsv.innerHTML = '<rect width="520" height="380" fill="#0e0c09"/>';
    const clusters = [
      { x: 140, y: 120, c: '#f2a516', n: 70, s: 34 },
      { x: 330, y: 95, c: '#2aa39a', n: 60, s: 30 },
      { x: 410, y: 250, c: '#d9452b', n: 55, s: 30 },
      { x: 120, y: 260, c: '#8f7cc9', n: 60, s: 32 },
    ];
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
    clusters.forEach((cl) => {
      for (let i = 0; i < cl.n; i++) {
        el('circle', { cx: cl.x + gauss() * cl.s * 1.3, cy: cl.y + gauss() * cl.s, r: 2.4, fill: cl.c, opacity: 0.55 + rnd() * 0.35 }, gsv);
      }
    });
    // WT and mutant shift
    const wt = [168, 132], mt = [262, 205];
    el('defs', {}, gsv).innerHTML = '<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ffcf5a"/></marker>';
    el('path', { d: `M${wt[0]},${wt[1]} Q${wt[0] + 70},${wt[1] + 5} ${mt[0] - 6},${mt[1] - 6}`, fill: 'none', stroke: '#ffcf5a', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'marker-end': 'url(#arr)' }, gsv);
    el('circle', { cx: wt[0], cy: wt[1], r: 7, fill: '#fff1c2', stroke: '#0e0c09', 'stroke-width': 2 }, gsv);
    el('circle', { cx: mt[0], cy: mt[1], r: 7, fill: '#d9452b', stroke: '#fff1c2', 'stroke-width': 2 }, gsv);
    const lab = el('g', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 11, fill: '#f3ead8' }, gsv);
    el('text', { x: wt[0] - 4, y: wt[1] + 62, 'text-anchor': 'middle' }, lab).textContent = 'reference protein';
    el('line', { x1: wt[0], y1: wt[1] + 8, x2: wt[0], y2: wt[1] + 48, stroke: 'rgba(243,234,216,.4)' }, gsv);
    el('text', { x: mt[0], y: mt[1] + 30, 'text-anchor': 'middle' }, lab).textContent = 'with your variant';
    el('text', { x: 230, y: 150, fill: '#ffcf5a' }, lab).textContent = 'Δ embedding';
    // sequence strip
    const seq = 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQ';
    const sg = el('g', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 11 }, gsv);
    seq.split('').forEach((ch, i) => {
      const mut = i === 22;
      const x = 22 + i * 12.6;
      if (mut) el('rect', { x: x - 2, y: 333, width: 12, height: 18, fill: '#d9452b', rx: 2 }, sg);
      el('text', { x, y: 346, fill: mut ? '#fff1c2' : '#8f8470' }, sg).textContent = ch;
    });
    el('text', { x: 22, y: 322, 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, fill: '#8f8470' }, gsv).textContent = 'protein language model · per-residue embedding';
    el('text', { x: 22, y: 30, 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, fill: '#8f8470' }, gsv).textContent = 'shared genome / protein embedding space';
  }
})();
