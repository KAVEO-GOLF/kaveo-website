import {AREAS,SOURCE} from './roadmap-content.mjs';
import {renderJourney} from './roadmap-journey-render.mjs';
import {renderSharedFooter,SHARED_FOOTER_ASSETS} from './shared-footer-render.mjs';
export const ROADMAP_VIDEO_ASSETS='  <link rel="stylesheet" href="roadmap-video.css">\n  <script type="module" src="roadmap-video.mjs"></script>\n';
export const FUNCTIONS_CI_ASSETS='  <link rel="stylesheet" href="roadmap-video.css">\n  <link rel="stylesheet" href="functions-ci.css">\n  <script type="module" src="functions-scene.mjs"></script>\n';
export const SITE_NAVIGATION_ASSETS='  <link rel="stylesheet" href="site-navigation.css">\n  <script type="module" src="site-navigation.mjs"></script>\n';
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHtml;
const arrow='<svg class="icon" aria-hidden="true"><use href="#arrow-up-right"/></svg>';
const list=points=>'<ul>'+points.map(point=>'<li>'+e(point)+'</li>').join('')+'</ul>';
const featureHtml=item=>`<details class="roadmap-feature" id="funktion-${item.id}">
  <summary><span class="feature-title"><strong>${e(item.title)}</strong><span>${e(item.summary)}</span></span><span class="feature-kind ${item.kind==='proposal'?'is-proposal':''}">${item.kind==='proposal'?'Ergänzende Idee':'Geplant'}</span><span class="disclosure-mark" aria-hidden="true">+</span></summary>
  <div class="feature-body">${list(item.points)}${item.note?'<p class="feature-note">'+e(item.note)+'</p>':''}</div>
</details>`;

export function pageChrome(home,currentPage=''){
  const sprite=home.match(/  <svg class="icon-definitions"[\s\S]*?<\/svg>/)?.[0];
  const originalHeader=home.match(/  <header\b[\s\S]*?<\/header>/)?.[0];
  if(!sprite||!originalHeader)throw new Error('Existing KAVEO chrome not found');
  const qualify=html=>html.replace(/href="#(start|deine-app|features)"/g,'href="/#$1"');
  const header=qualify(originalHeader).replace(/ aria-current="page"/g,'')
    .replace(`data-nav-page="${currentPage}"`,`data-nav-page="${currentPage}" aria-current="page"`);
  const footer=renderSharedFooter(home);
  return {sprite,header,footer};
}

export function renderCatalog(){
  return `<section class="roadmap-catalog" id="funktionen" aria-labelledby="catalog-title" tabindex="-1">
      <div class="roadmap-section-head"><h2 id="catalog-title">Die Ideen dahinter.</h2><p>Sechs Bereiche, viele zusammengehörige Funktionen. Öffne ein Thema, um mehr zu erfahren. Ergänzende Ideen sind noch offen; auch die übrigen Funktionen sind weiterhin geplant.</p></div>
      <div class="roadmap-catalog-layout">
        <nav class="roadmap-area-nav" aria-label="Produktbereiche">${AREAS.map(area=>`<a href="#bereich-${area.id}" data-area-link="${area.id}"><span>${e(area.short)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav>
        <div class="roadmap-area-panels">${AREAS.map(area=>`<section class="roadmap-area" id="bereich-${area.id}" data-area-panel="${area.id}" aria-labelledby="titel-${area.id}"><div class="area-heading"><h3 id="titel-${area.id}" tabindex="-1">${e(area.title)}</h3><p>${e(area.intro)}</p></div><div class="roadmap-feature-list">${area.features.map(featureHtml).join('\n')}</div></section>`).join('\n')}</div>
      </div>
    </section>`;
}

export function renderRoadmap(home){
  const {sprite,header,footer}=pageChrome(home,'roadmap');
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0d0d0d">
  <meta name="description" content="Der geplante Weg von KAVEO GOLF: Startpaket, Ausbau und die Funktionen für Golfer, Clubs und Partner.">
  <title>Roadmap — KAVEO GOLF</title>
  <script src="roadmap-entry.js"></script>
  <link rel="icon" href="assets/favicon.png">
  <link rel="preload" href="reference/assets/fonts/Manrope_400Regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="reference/styles.css">
  <link rel="stylesheet" href="reference/copy-v2.css">
  <link rel="stylesheet" href="button-shape.css">
  <link rel="stylesheet" href="roadmap.css">
  <link rel="stylesheet" href="roadmap-glass.css">
  <link rel="stylesheet" href="roadmap-rail.css">
  <link rel="stylesheet" href="roadmap-scene.css">
  <link rel="stylesheet" href="functions.css">
${SHARED_FOOTER_ASSETS.trimEnd()}
  <script type="module" src="roadmap-shell.mjs"></script>
  <script type="module" src="roadmap-glass.mjs"></script>
  <script type="module" src="roadmap-rail.mjs"></script>
${ROADMAP_VIDEO_ASSETS.trimEnd()}
${SITE_NAVIGATION_ASSETS.trimEnd()}
  <link rel="stylesheet" href="mobile-polish.css">
  <link rel="stylesheet" href="site-background.css">
</head>
<body class="roadmap-page">
${sprite}
  <a class="skip-link" href="#inhalt">Zum Inhalt</a>
${header}
  <div class="roadmap-landscape" aria-hidden="true"><img src="media/inselgruen-logo-poster-v04.webp" alt="" width="1920" height="1080" fetchpriority="high"></div>
  <main id="inhalt" class="roadmap-main section-wrap" tabindex="-1">
    <div class="roadmap-scroll-scene"><div class="roadmap-scene-sticky">
    <section class="roadmap-intro" id="start" aria-labelledby="roadmap-title" tabindex="-1">
      <nav class="roadmap-breadcrumb" aria-label="Seitenpfad"><a href="/">Startseite</a><span aria-hidden="true">/</span><span aria-current="page">Roadmap</span></nav>
      <h1 id="roadmap-title">Der nächste<br>Schritt zählt.</h1>
      <div class="roadmap-intro-bottom"><p>Eine gemeinsame Runde soll der Anfang sein. Hier siehst du, was darauf aufbauen soll – und welche Ideen wir für die weitere Golfwelt haben.</p><p class="roadmap-version">Konzeptstand<time datetime="2026-09-10">${SOURCE.date}</time></p></div>
      <nav class="roadmap-jumps" aria-label="Roadmap-Bereiche"><a class="button roadmap-outline" href="funktionen.html">Alle Produktbereiche ${arrow}</a></nav>
    </section>

    ${renderJourney()}
    </div></div>

  </main>
${footer}
</body>
</html>
`;
}

export function renderFunctions(home){
  const {sprite,header,footer}=pageChrome(home,'functions');
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0d0d0d">
  <meta name="description" content="Die geplanten Funktionen von KAVEO GOLF: sechs Produktbereiche mit ihren Ideen und Details.">
  <title>Funktionen — KAVEO GOLF</title>
  <link rel="icon" href="assets/favicon.png">
  <link rel="preload" href="reference/assets/fonts/Manrope_400Regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="reference/styles.css">
  <link rel="stylesheet" href="reference/copy-v2.css">
  <link rel="stylesheet" href="button-shape.css">
  <link rel="stylesheet" href="roadmap.css">
  <link rel="stylesheet" href="functions.css">
${SHARED_FOOTER_ASSETS.trimEnd()}
  <script type="module" src="roadmap.mjs"></script>
${FUNCTIONS_CI_ASSETS.trimEnd()}
${SITE_NAVIGATION_ASSETS.trimEnd()}
  <link rel="stylesheet" href="mobile-polish.css">
  <link rel="stylesheet" href="site-background.css">
</head>
<body class="roadmap-page functions-page">
${sprite}
  <a class="skip-link" href="#inhalt">Zum Inhalt</a>
${header}
  <div class="roadmap-landscape" aria-hidden="true"><img src="media/inselgruen-logo-poster-v04.webp" alt="" width="1920" height="1080" fetchpriority="high"></div>
  <main id="inhalt" class="roadmap-main section-wrap" tabindex="-1">
    <section class="functions-intro" id="start" aria-labelledby="functions-title" tabindex="-1">
      <nav class="roadmap-breadcrumb" aria-label="Seitenpfad"><a href="/">Startseite</a><span aria-hidden="true">/</span><span aria-current="page">Funktionen</span></nav>
      <div class="functions-title-row"><h1 id="functions-title">Funktionen im Detail.</h1><a class="button roadmap-outline" href="roadmap.html#entwicklungsweg">Zur Roadmap ${arrow}</a></div>
      <p class="functions-version">Konzeptstand: <time datetime="2026-09-10">${SOURCE.date}</time></p>
    </section>

    ${renderCatalog()}
  </main>
${footer}
</body>
</html>
`;
}
