import {PACKAGES,SOURCE} from './roadmap-content.mjs';
import {escapeHtml as e,renderRoadmap} from './roadmap-render.mjs';
import {HIGHLIGHTS,SHORT_WHEN,EDGES} from './roadmap-space-model.mjs';

export function renderRoadmapSpace(home){
  const original=renderRoadmap(home);
  const sprite=original.match(/  <svg class="icon-definitions"[\s\S]*?<\/svg>/)[0];
  // This preserved study has no signup section; keep its homepage destination.
  const header=original.match(/  <header\b[\s\S]*?<\/header>/)[0].replace('href="#fruehzugang"','href="/#fruehzugang"');
  const footer=original.match(/  <footer\b[\s\S]*?<\/footer>/)[0];
  const nodePackages=[...PACKAGES.filter(p=>p.lane!=='business'),...PACKAGES.filter(p=>p.lane==='business')];
  const nodes=nodePackages.map(p=>`<a class="path-card ${p.lane==='business'?'path-card-business':''}" href="#weg-${p.id}" data-package="${p.id}" aria-controls="weg-${p.id}"${p.id==='A'?' aria-current="true"':''}><span class="path-card-top"><span class="path-letter" aria-hidden="true">${p.id}</span><span class="path-card-arrow" aria-hidden="true">↗</span></span><strong>${e(p.name)}</strong><span class="path-card-when">${e(SHORT_WHEN[p.id])}</span></a>`).join('\n');
  const panels=PACKAGES.map(p=>`<article class="path-panel" id="weg-${p.id}" data-package-panel="${p.id}" aria-labelledby="weg-titel-${p.id}">
    <p class="path-context">Geplant <span aria-hidden="true">/</span> ${e(p.name)}</p>
    <h2 id="weg-titel-${p.id}" tabindex="-1">${e(p.title)}</h2>
    <p class="path-summary">${e(p.summary)}</p>
    <ul class="path-highlights">${HIGHLIGHTS[p.id].map(point=>`<li>${e(point)}</li>`).join('')}</ul>
    <p class="path-timing">${e(p.when)}</p>
    <details class="path-details"><summary>Was gehört dazu?<span aria-hidden="true">+</span></summary><ul>${p.points.map(point=>`<li>${e(point)}</li>`).join('')}</ul></details>
    <p class="path-boundary">${e(p.boundary)}</p>
  </article>`).join('\n');
  return `<!doctype html>
<html lang="de"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#0d0d0d">
  <meta name="description" content="Entdecke die geplanten Entwicklungspakete von KAVEO GOLF – vom gemeinsamen Spiel bis zur weiteren Golfwelt.">
  <title>Der Entwicklungsweg — KAVEO GOLF</title>
  <link rel="icon" href="assets/favicon.png">
  <link rel="preload" href="assets/fonts/Manrope_400Regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="reference/styles.css"><link rel="stylesheet" href="reference/copy-v2.css">
  <link rel="stylesheet" href="button-shape.css"><link rel="stylesheet" href="roadmap-space.css">
  <script type="module" src="roadmap-space.mjs"></script>
</head><body class="roadmap-space-page">
${sprite}
  <a class="skip-link" href="#inhalt">Zum Inhalt</a>
${header}
  <main id="inhalt" tabindex="-1">
    <section class="path-world" id="start" aria-labelledby="path-title">
      <div class="path-landscape" aria-hidden="true"><img src="media/inselgruen-logo-poster-v04.webp" width="1920" height="1080" alt="" fetchpriority="high"><video id="path-video" data-src="media/inselgruen-logo-loop-v04-web.mp4" muted loop playsinline preload="none" disablepictureinpicture></video></div>
      <div class="section-wrap path-wrap">
        <div class="path-intro"><div><nav class="path-breadcrumb" aria-label="Seitenpfad"><a href="/">Startseite</a><span aria-hidden="true">/</span><a href="roadmap.html">Roadmap</a><span class="path-draft">Vorschau</span></nav><h1 id="path-title">Was wir vorhaben.</h1></div><a class="button path-outline" href="roadmap.html#funktionen">Alle Produktbereiche <span aria-hidden="true">↗</span></a></div>
        <div class="path-layout">
          <nav class="path-stage" aria-label="Geplante Entwicklungspakete – Paket auswählen">
            <svg class="path-wires" aria-hidden="true" hidden>${EDGES.map(([a,b])=>`<path data-edge="${a}-${b}"/>`).join('')}</svg>
            ${nodes}
            <p class="path-branch-label" aria-hidden="true">Eigene Betriebslinie</p>
          </nav>
          <div class="path-panels">${panels}</div>
        </div>
        <div class="path-bottom"><p>Vorgeschlagene Reihenfolge, keine festen Termine.<br><span>Konzeptstand: ${SOURCE.date}</span></p><button class="button button-small path-outline" id="path-motion" type="button" aria-pressed="false" hidden>Bewegung pausieren</button></div>
        <p id="path-announcement" class="path-sr" aria-live="polite" aria-atomic="true"></p>
        <noscript><p class="path-no-script">Alle Pakete stehen untereinander. Über die Karten kannst du direkt zu einem Paket springen.</p></noscript>
      </div>
    </section>
  </main>
${footer}
</body></html>
`;
}
