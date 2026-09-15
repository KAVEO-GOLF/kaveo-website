import {pageChrome,escapeHtml as e,SITE_NAVIGATION_ASSETS} from './roadmap-render.mjs';
import {SHARED_FOOTER_ASSETS} from './shared-footer-render.mjs';
import {ABOUT_CHAPTERS,ABOUT_PRINCIPLES} from './about-content.mjs';
const arrow='<svg class="icon" aria-hidden="true"><use href="#arrow-up-right"/></svg>';
export function renderAbout(home){
  const {sprite,header,footer}=pageChrome(home,'about');
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0d0d0d">
  <meta name="description" content="Ich bin Philipp, der Gründer von KAVEO. Wie aus meinem Golfalltag, einer privaten Liga und einer Excel-Tabelle die Idee einer All-in-one-Golf-App entstand.">
  <title>Über uns — KAVEO GOLF</title>
  <link rel="icon" href="assets/favicon.png">
  <link rel="preload" href="reference/assets/fonts/Manrope_400Regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="reference/styles.css">
  <link rel="stylesheet" href="reference/copy-v2.css">
  <link rel="stylesheet" href="button-shape.css">
  <link rel="stylesheet" href="roadmap-video.css">
${SHARED_FOOTER_ASSETS.trimEnd()}
  <link rel="stylesheet" href="about.css">
  <script type="module" src="about.mjs"></script>
${SITE_NAVIGATION_ASSETS.trimEnd()}
  <link rel="stylesheet" href="mobile-polish.css">
  <link rel="stylesheet" href="site-background.css">
</head>
<body class="about-page">
${sprite}
  <a class="skip-link" href="#inhalt">Zum Inhalt</a>
${header}
  <div class="about-landscape roadmap-landscape" aria-hidden="true"><img src="media/inselgruen-logo-poster-v04.webp" width="1920" height="1080" alt="" fetchpriority="high"></div>
  <main id="inhalt" tabindex="-1">
    <section class="about-hero section-wrap" id="start" aria-labelledby="about-title" data-about-scene>
      <div class="about-hero-top"><nav class="about-breadcrumb" aria-label="Seitenpfad"><a href="/">Startseite</a><span aria-hidden="true">/</span><span aria-current="page">Über uns</span></nav><p class="about-draft">Lokale Vorschau</p></div>
      <div class="about-hero-grid" data-about-reveal>
        <div class="about-hero-copy"><h1 id="about-title">Golf begleitet mich<br>seit meiner Jugend.</h1><p class="about-lead">Ich bin Philipp, der Gründer von KAVEO. Durch meine Familie bin ich zum Golf gekommen und spiele seit meinem 14. Lebensjahr. Aus meinem eigenen Golfalltag ist später die Idee zu KAVEO entstanden.</p><a class="button button-light" href="#geschichte">Meine Geschichte ${arrow}</a></div>
        <figure class="about-portrait"><div class="about-portrait-window"><img src="media/optimized/philipp-portrait.webp" width="1792" height="2400" alt="Philipp mit Golfschläger und KAVEO-Polo; KI-gestützte Porträtdarstellung" decoding="async" fetchpriority="high"></div><figcaption><strong>Philipp</strong><span>Gründer von KAVEO</span></figcaption></figure>
      </div>
    </section>
    <section class="about-origin section-wrap" id="geschichte" aria-labelledby="about-origin-title" data-about-scene>
      <div class="about-origin-grid" data-about-reveal>
        <div class="about-section-copy"><p class="about-label">Wie die Idee entstand</p><h2 id="about-origin-title">Eine Liga.<br>Eine Excel-Tabelle.<br>Zu viele Apps.</h2><p>Aus meinem eigenen Golfalltag entstand der Gedanke: Warum nicht alles an einem Ort zusammenbringen?</p></div>
        <div class="about-chapter-shell">
          <nav class="about-chapter-nav" aria-label="Kapitel meiner Geschichte">${ABOUT_CHAPTERS.map(chapter=>`<button type="button" id="kapitel-${chapter.id}" data-about-chapter="${chapter.id}" aria-controls="geschichte-${chapter.id}"><span>${e(chapter.label)}</span><span class="about-tab-mark" aria-hidden="true"></span></button>`).join('')}</nav>
          <div class="about-chapter-panels">${ABOUT_CHAPTERS.map(chapter=>`<article class="about-chapter" id="geschichte-${chapter.id}" data-about-panel="${chapter.id}" aria-labelledby="geschichte-titel-${chapter.id}"><img class="about-chapter-icon" src="assets/icons/${e(chapter.icon)}" width="104" height="104" alt="" loading="lazy"><h3 id="geschichte-titel-${chapter.id}">${e(chapter.title)}</h3><p>${e(chapter.text)}</p><p class="about-chapter-foot">${e(chapter.foot)}</p></article>`).join('\n')}
          </div>
        </div>
      </div>
    </section>
    <section class="about-direction section-wrap" id="ausrichtung" aria-labelledby="about-direction-title" data-about-scene>
      <div data-about-reveal><div class="about-direction-heading"><p class="about-label">Die Richtung</p><h2 id="about-direction-title">Dafür soll<br>KAVEO stehen.</h2><p>Gemeinschaft, Einfachheit und ein leichterer Einstieg – diese drei Gedanken leiten mich bei der Entwicklung von KAVEO.</p></div>
        <div class="about-principles">${ABOUT_PRINCIPLES.map(item=>`<article class="about-principle"><h3>${e(item.title)}</h3><p>${e(item.text)}</p></article>`).join('')}</div>
        <div class="about-outlook"><div><h3>Von mir entwickelt.<br>Schritt für Schritt.</h3><p>Aktuell entwickle ich KAVEO selbst. Die Idee ist groß und entsteht Schritt für Schritt. Auf der Roadmap zeige ich, was geplant ist und wohin sich KAVEO entwickeln soll.</p></div><nav aria-label="KAVEO weiter kennenlernen"><a class="button button-light" href="roadmap.html">Zur Roadmap ${arrow}</a><a class="button about-outline" href="funktionen.html">Funktionen entdecken ${arrow}</a></nav></div>
      </div>
    </section>
  </main>
${footer}
</body>
</html>
`;
}
