import {PACKAGES} from './roadmap-content.mjs';
const e=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderJourney(){
  return `<section class="roadmap-journey journey-open" id="entwicklungsweg" aria-labelledby="journey-title" tabindex="-1">
      <div class="journey-sticky">
        <div class="roadmap-section-head"><h2 id="journey-title">Schritt für Schritt.</h2><p>Die vorgeschlagene Reihenfolge aus unserem Konzept. Alle Pakete sind geplant; sie sind keine Aussage über bereits fertige Funktionen oder feste Veröffentlichungstermine.</p></div>
        <nav class="journey-nav" aria-label="Entwicklungspakete">${PACKAGES.map(p=>`<a class="journey-stop${p.lane==='business'?' journey-stop-branch':''}" href="#paket-${p.id}" aria-label="${p.id}: ${e(p.title)}${p.lane==='business'?' – Eigene Entwicklungslinie':''}"><span>${p.id}</span>${p.lane==='business'?'<span class="journey-branch-label">Eigene Linie</span>':''}</a>`).join('')}</nav>
        <div class="journey-window"><div class="roadmap-packages">${PACKAGES.map(p=>`<article class="roadmap-package ${p.lane==='business'?'package-branch':''}" id="paket-${p.id}" aria-labelledby="paket-titel-${p.id}" tabindex="-1">
  <header class="package-summary"><span class="package-index" aria-hidden="true">${p.id}</span><div class="package-title"><span class="package-name">${e(p.name)}</span><h3 id="paket-titel-${p.id}">${e(p.title)}</h3><span class="package-when">${e(p.when)}</span></div></header>
  <div class="package-body"><p class="package-intro">${e(p.summary)}</p><ul>${p.points.map(point=>'<li>'+e(point)+'</li>').join('')}</ul><p class="package-boundary">${e(p.boundary)}</p></div>
</article>`).join('\n')}</div></div>
        <p class="roadmap-journey-note">Die Betriebssoftware ist eine eigene Entwicklungslinie. Erweiterungen mit Geräten, Verbänden und Anbietern hängen zusätzlich von Qualität, Datenzugängen und Partnern ab.</p>
      </div>
    </section>`;
}
