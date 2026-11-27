# sporgelum.github.io

Personal site of Marius Botos. Plain static HTML, CSS and JavaScript, served by GitHub Pages (no Jekyll build; see `.nojekyll`).

| Path | What it is |
| --- | --- |
| `index.html` | All content. Each tab is a `<section data-tab-panel="…">`. |
| `assets/site/site.css` | Styles, colour tokens and the ripstop fabric texture (`.ripstop`). |
| `assets/site/honeycomb.js` | Animated beeswax honeycomb background. |
| `assets/site/brain.js` | The "second brain" graph on the home tab. Edit the `nodes` and `cross` lists to add topics. |
| `assets/site/art.js` | SVG illustrations for the future projects. |
| `assets/site/app.js` | Tab routing (`#cv`, `#projects/p-adipose`, …). |
| `cv/`, `projects/`, … | Redirects from the old Jekyll URLs. |

The previous Jekyll site is preserved on the `archive/old-site-2026-11` branch.

Preview locally with `python3 -m http.server` and open http://localhost:8000.
