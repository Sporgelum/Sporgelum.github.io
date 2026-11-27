/* Tab routing: #home, #cv, #projects, #future, #publications, #contact.
   Deep links like #projects/p-adipose open the tab and highlight the item. */
(function () {
  const panels = [...document.querySelectorAll('[data-tab-panel]')];
  const tabs = [...document.querySelectorAll('.tabs a[data-tab]')];
  const names = panels.map((p) => p.dataset.tabPanel);

  function show(name, anchor) {
    if (!names.includes(name)) name = 'home';
    panels.forEach((p) => { p.hidden = p.dataset.tabPanel !== name; });
    tabs.forEach((a) => a.setAttribute('aria-selected', String(a.dataset.tab === name)));
    document.title = (name === 'home' ? 'Marius Botos' : tabs.find((a) => a.dataset.tab === name).textContent + ' · Marius Botos') + ' · Bioinformatics';
    if (name === 'home' && window.brainWake) window.brainWake();
    const target = anchor && document.getElementById(anchor);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center' });
        target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function fromHash() {
    const [name, anchor] = location.hash.replace('#', '').split('/');
    show(name || 'home', anchor);
  }

  window.siteGo = function (name, anchor) {
    const h = '#' + name + (anchor ? '/' + anchor : '');
    if (location.hash === h) fromHash(); else location.hash = h;
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-tab]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    window.siteGo(a.dataset.tab);
  });
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
