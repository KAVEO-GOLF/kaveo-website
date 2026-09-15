import {pageChrome,escapeHtml as e,SITE_NAVIGATION_ASSETS} from './roadmap-render.mjs';
import {SHARED_FOOTER_ASSETS} from './shared-footer-render.mjs';
import {ABOUT_PRINCIPLES} from './about-content.mjs';

// Alternative presentation of Philipp's account, not additional biography.
export const EDITORIAL_STORY=[
  {id:'runde',label:'Die Runde',title:'Eine eigene Liga. Eine gemeinsame Runde.',
    text:'In unserer Golfgruppe spielen wir eine eigene Liga. Ich habe die Excel-Tabelle mit unseren Ergebnissen geführt.'},
  {id:'ausloeser',label:'Der Auslöser',title:'Zu viele Apps. Und die Tabelle blieb.',
    text:'Die Arbeit mit der Tabelle hat mich irgendwann genervt. Gleichzeitig hatte ich für vieles rund um Golf unterschiedliche Apps auf dem Handy. Einzelne Lösungen, aber nichts, das für mich wirklich zusammenpasste.'},
  {id:'idee',label:'Die Idee',title:'Das Golfleben an einem Ort.',
    text:'Mit KAVEO möchte ich eine All-in-one-App entwickeln, über die du möglichst alles rund um dein Golfleben organisieren kannst.'}
];
const arrow='<svg class="icon" aria-hidden="true"><use href="#arrow-up-right"/></svg>';
export function renderAboutEditorial(home){
  const {sprite,header,footer}=pageChrome(home,'about');
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0d0d0d">
  <meta name="description" content="Philipp entwickelt KAVEO aus seinem eigenen Golfalltag. Die persönliche Geschichte hinter der Idee, das Golfleben in einer App zusammenzubringen.">
  <title>Über uns — KAVEO GOLF</title>
  <link rel="icon" href="assets/favicon.png">
  <link rel="preload" href="reference/assets/fonts/Manrope_400Regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="reference/styles.css">
  <link rel="stylesheet" href="reference/copy-v2.css">
  <link rel="stylesheet" href="button-shape.css">
  <link rel="stylesheet" href="roadmap-video.css">
${SHARED_FOOTER_ASSETS.trimEnd()}
  <link rel="stylesheet" href="about-editorial.css">
  <script type="module" src="about-editorial.mjs"></script>
${SITE_NAVIGATION_ASSETS.trimEnd()}
  <link rel="stylesheet" href="mobile-polish.css">
  <link rel="stylesheet" href="site-background.css">
</head>
<body class="about-page about-editorial">
${sprite}
  <a class="skip-link" href="#inhalt">Zum Inhalt</a>
${header}
  <div class="editorial-landscape roadmap-landscape" aria-hidden="true"><img src="media/inselgruen-logo-poster-v04.webp" width="1920" height="1080" alt="" fetchpriority="high"></div>
  <main id="inhalt" tabindex="-1">
    <section class="editorial-hero editorial-width" id="start" aria-labelledby="editorial-title" data-about-scene>
      <div class="editorial-top"><nav class="editorial-breadcrumb" aria-label="Seitenpfad"><a href="/">Startseite</a><span aria-hidden="true">/</span><span aria-current="page">Über uns</span></nav><a class="editorial-compare" href="ueber-uns.html#start">Bisherige Version ansehen</a></div>
      <div class="editorial-hero-grid" data-about-reveal>
        <div class="editorial-intro"><p class="editorial-person">Ich bin Philipp. Gründer und Entwickler von KAVEO.</p><h1 id="editorial-title">Aus meiner Runde.<br>Für dein Golfleben.</h1><p class="editorial-lead">Durch meine Familie bin ich zum Golf gekommen und spiele seit meinem 14. Lebensjahr. Aus meinem eigenen Golfalltag ist die Idee zu KAVEO entstanden.</p><a class="button button-light" href="#geschichte">Wie alles begann ${arrow}</a></div>
        <figure class="editorial-portrait"><div class="editorial-portrait-image"><video class="editorial-portrait-video" data-about-portrait-video data-src="media/optimized/philipp-putter.mp4" muted playsinline preload="none" poster="media/optimized/philipp-putter-poster.webp" aria-label="Philipp mit Putter und KAVEO-Polo auf einem Golfgrün; KI-gestützte Darstellung"></video></div><figcaption><span><strong>Philipp</strong><span>Gründer von KAVEO</span></span><small>KI-gestützte Darstellung</small></figcaption></figure>
      </div>
    </section>
    <section class="editorial-story editorial-width" id="geschichte" aria-labelledby="editorial-story-title" data-about-scene>
      <div class="editorial-story-grid" data-about-reveal>
        <div class="editorial-story-heading"><h2 id="editorial-story-title">Es begann <br>mit einer <br>Excel-Tabelle.</h2><p>Eine persönliche Geschichte<br>aus unserem Golfalltag.</p></div>
        <ol class="editorial-story-list" aria-label="Von unserer Liga zur Idee für KAVEO">
${EDITORIAL_STORY.map(step=>`          <li class="editorial-step" id="geschichte-${step.id}" data-editorial-step><span class="editorial-step-dot" aria-hidden="true"></span><p class="editorial-step-label">${e(step.label)}</p><h3>${e(step.title)}</h3><p class="editorial-step-text">${e(step.text)}</p></li>`).join('\n')}
        </ol>
      </div>
    </section>
    <section class="editorial-purpose editorial-width" id="ausrichtung" aria-labelledby="editorial-purpose-title" data-about-scene>
      <div data-about-reveal>
        <div class="editorial-purpose-heading"><h2 id="editorial-purpose-title">Was mir dabei<br>wichtig ist.</h2><p>Drei Gedanken, die mich bei der Entwicklung von KAVEO leiten.</p></div>
        <dl class="editorial-principles">${ABOUT_PRINCIPLES.map(item=>`<div><dt>${e(item.title)}</dt><dd>${e(item.text)}</dd></div>`).join('')}</dl>
        <div class="editorial-outlook"><h2>Ich entwickle<br>KAVEO selbst.</h2><div><p>Die Idee ist groß und entsteht Schritt für Schritt. Auf der Roadmap zeige ich, was geplant ist und wohin sich KAVEO entwickeln soll.</p><nav aria-label="KAVEO weiter kennenlernen"><a class="button button-light" href="roadmap.html">Zur Roadmap ${arrow}</a><a class="button editorial-outline" href="funktionen.html">Funktionen entdecken ${arrow}</a></nav></div></div>
      </div>
    </section>
  </main>
${footer}
</body>
</html>
`;
}
