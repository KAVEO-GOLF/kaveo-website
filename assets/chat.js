/* KAVEO — Livechat auf kaveo-golf.app.
 * Eigenes Skript, keine Fremdquellen. Spricht nur mit der Edge Function
 * "nachrichten-homepage" (Supabase). Gespeichert wird im Browser nur eine
 * zufällige Kennung (localStorage) und, dass der Datenschutz-Haken gesetzt wurde.
 * Nachrichten und Texte der Besucher werden nie als HTML eingefügt (textContent). */
(function () {
  'use strict';

  var API = 'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/nachrichten-homepage';
  var SPEICHER = 'kaveo-chat-v1';
  var DATENSCHUTZ = 'https://kaveo-golf.app/datenschutz/';
  var MAX_ZEICHEN = 1000;
  var ABFRAGE_OFFEN_MS = 5000;
  var ABFRAGE_ZU_MS = 30000;

  var T = {
    oeffnen: 'Chat öffnen',
    schliessen: 'Chat schließen',
    titel: 'KAVEO',
    unterzeile: 'Schreib uns – wir antworten persönlich.',
    begruessung: 'Hallo! Was möchtest du wissen? Wir melden uns, sobald wir online sind.',
    platzhalter: 'Deine Nachricht',
    senden: 'Senden',
    sendet: 'Wird gesendet …',
    name: 'Name (freiwillig)',
    email: 'E-Mail (freiwillig)',
    emailHinweis: 'Mit E-Mail bekommst du die Antwort auch dann, wenn du den Chat schon verlassen hast.',
    datenschutzA: 'Ich habe die ',
    datenschutzLink: 'Datenschutzerklärung',
    datenschutzB: ' gelesen und bin einverstanden, dass meine Nachricht gespeichert und von KAVEO beantwortet wird.',
    kontaktAuf: 'E-Mail für Antworten hinterlegen',
    kontaktSpeichern: 'Speichern',
    kontaktGespeichert: 'Gespeichert. Wir melden uns auch per E-Mail.',
    wir: 'KAVEO',
    du: 'Du',
    fehlerNetz: 'Das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal.',
    fehlerZuViele: 'Gerade sehr viele Nachrichten – bitte warte einen Moment.',
    fehlerUngueltig: 'Bitte prüfe deine Eingabe (Nachricht höchstens 1000 Zeichen, höchstens 3 Links, gültige E-Mail).',
    fehlerKontakt: 'Die E-Mail-Adresse scheint nicht zu stimmen.',
    zeichenUeber: 'Zu lang – höchstens 1000 Zeichen.'
  };

  var zustand = {
    token: null,
    einwilligung: false,
    offen: false,
    geoeffnetAm: 0,
    nachrichten: [],
    gesehenTeam: 0,
    sendet: false,
    timer: null,
    versuch: null // { text, id } – gleiche Anfrage-ID bei Wiederholung
  };

  function laden() {
    try {
      var roh = window.localStorage.getItem(SPEICHER);
      if (!roh) return;
      var o = JSON.parse(roh);
      if (o && typeof o.token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(o.token)) zustand.token = o.token;
      if (o && o.einwilligung === true) zustand.einwilligung = true;
      if (o && Number.isInteger(o.gesehenTeam)) zustand.gesehenTeam = o.gesehenTeam;
    } catch (e) { /* ohne Speicher geht es auch */ }
  }
  function speichern() {
    try {
      window.localStorage.setItem(SPEICHER, JSON.stringify({
        token: zustand.token, einwilligung: zustand.einwilligung, gesehenTeam: zustand.gesehenTeam
      }));
    } catch (e) { /* egal */ }
  }
  function vergessen() {
    zustand.token = null;
    zustand.nachrichten = [];
    zustand.gesehenTeam = 0;
    speichern();
  }

  function el(tag, attr, kinder) {
    var e = document.createElement(tag);
    if (attr) Object.keys(attr).forEach(function (k) {
      if (k === 'text') e.textContent = attr[k];
      else if (k === 'class') e.className = attr[k];
      else e.setAttribute(k, attr[k]);
    });
    (kinder || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function neueId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var b = new Uint8Array(16);
    window.crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  /** POST an die Funktion; liefert { status, daten }. */
  function aufruf(body) {
    return fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) { return { status: r.status, daten: d }; });
    });
  }

  // --- Aufbau ---------------------------------------------------------------
  var knopf, fenster, verlauf, fuss, punkt;
  var feldText, feldName, feldMail, haken, honigtopf, sendeKnopf, meldung, zaehler, kontaktBox;

  function aufbauen() {
    knopf = el('button', { type: 'button', class: 'kv-chat-knopf', 'aria-label': T.oeffnen, 'aria-expanded': 'false', 'aria-controls': 'kv-chat-fenster' });
    knopf.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.6a.6.6 0 0 1-1-.46V16H6.5A2.5 2.5 0 0 1 4 13.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    punkt = el('span', { class: 'kv-chat-punkt', hidden: '' });
    knopf.appendChild(punkt);
    knopf.addEventListener('click', function () { zustand.offen ? schliessen() : oeffnen(); });

    var zu = el('button', { type: 'button', class: 'kv-chat-zu', 'aria-label': T.schliessen, text: '✕' });
    zu.addEventListener('click', schliessen);
    var kopf = el('div', { class: 'kv-chat-kopf' }, [
      el('div', {}, [el('p', { class: 'kv-chat-titel', text: T.titel }), el('p', { class: 'kv-chat-unter', text: T.unterzeile })]),
      zu
    ]);
    verlauf = el('div', { class: 'kv-chat-verlauf', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
    fuss = el('div', { class: 'kv-chat-fuss' });
    fenster = el('div', { class: 'kv-chat-fenster', id: 'kv-chat-fenster', role: 'dialog', 'aria-label': T.titel + ' Chat', hidden: '' }, [kopf, verlauf, fuss]);
    fenster.addEventListener('keydown', function (e) { if (e.key === 'Escape') { schliessen(); knopf.focus(); } });
    document.body.appendChild(fenster);
    document.body.appendChild(knopf);
    fussAufbauen();
    verlaufZeichnen();
  }

  function fussAufbauen() {
    fuss.textContent = '';
    meldung = el('p', { class: 'kv-chat-meldung', role: 'status', 'aria-live': 'polite' });
    feldText = el('textarea', { class: 'kv-chat-text', rows: '2', maxlength: String(MAX_ZEICHEN + 200), placeholder: T.platzhalter, 'aria-label': T.platzhalter });
    feldText.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); absenden(); }
    });
    feldText.addEventListener('input', pruefen);
    zaehler = el('p', { class: 'kv-chat-zaehler', hidden: '' });
    sendeKnopf = el('button', { type: 'button', class: 'kv-chat-senden', text: T.senden });
    sendeKnopf.addEventListener('click', absenden);

    // Verstecktes Feld: Menschen sehen es nie, einfache Bots füllen es aus.
    honigtopf = el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', class: 'kv-chat-honig' });

    var zeile = el('div', { class: 'kv-chat-zeile' }, [feldText, sendeKnopf]);
    var teile = [meldung, zeile, zaehler, honigtopf];

    if (!zustand.token) {
      // Erste Nachricht: Name/E-Mail freiwillig, Datenschutz-Haken Pflicht.
      feldName = el('input', { type: 'text', class: 'kv-chat-feld', maxlength: '80', autocomplete: 'name', placeholder: T.name, 'aria-label': T.name });
      feldMail = el('input', { type: 'email', class: 'kv-chat-feld', maxlength: '254', autocomplete: 'email', placeholder: T.email, 'aria-label': T.email });
      feldMail.addEventListener('input', pruefen);
      haken = el('input', { type: 'checkbox', id: 'kv-chat-haken' });
      haken.checked = zustand.einwilligung;
      haken.addEventListener('change', pruefen);
      var link = el('a', { href: DATENSCHUTZ, target: '_blank', rel: 'noopener', text: T.datenschutzLink });
      var label = el('label', { class: 'kv-chat-haken', for: 'kv-chat-haken' }, [haken, el('span', {}, [document.createTextNode(T.datenschutzA), link, document.createTextNode(T.datenschutzB)])]);
      teile = [meldung, feldName, feldMail, el('p', { class: 'kv-chat-hinweis', text: T.emailHinweis }), label, zeile, zaehler, honigtopf];
    } else {
      haken = null; feldName = null; feldMail = null;
      kontaktBox = el('div', { class: 'kv-chat-kontakt' });
      kontaktAnzeigen(false);
      teile.push(kontaktBox);
    }
    teile.forEach(function (t) { fuss.appendChild(t); });
    pruefen();
  }

  function kontaktAnzeigen(offen, ok) {
    kontaktBox.textContent = '';
    if (ok) { kontaktBox.appendChild(el('p', { class: 'kv-chat-hinweis', text: T.kontaktGespeichert })); return; }
    if (!offen) {
      var b = el('button', { type: 'button', class: 'kv-chat-link', text: T.kontaktAuf });
      b.addEventListener('click', function () { kontaktAnzeigen(true); });
      kontaktBox.appendChild(b);
      return;
    }
    var n = el('input', { type: 'text', class: 'kv-chat-feld', maxlength: '80', autocomplete: 'name', placeholder: T.name, 'aria-label': T.name });
    var m = el('input', { type: 'email', class: 'kv-chat-feld', maxlength: '254', autocomplete: 'email', placeholder: T.email, 'aria-label': T.email });
    var s = el('button', { type: 'button', class: 'kv-chat-senden', text: T.kontaktSpeichern });
    s.addEventListener('click', function () {
      s.disabled = true;
      aufruf({ aktion: 'kontakt', token: zustand.token, name: n.value, email: m.value }).then(function (r) {
        if (r.status === 200) kontaktAnzeigen(false, true);
        else if (r.status === 404) { vergessen(); zeigeMeldung(T.fehlerNetz); fussAufbauen(); verlaufZeichnen(); }
        else { s.disabled = false; zeigeMeldung(r.status === 400 ? T.fehlerKontakt : T.fehlerNetz); }
      }).catch(function () { s.disabled = false; zeigeMeldung(T.fehlerNetz); });
    });
    [n, m, el('p', { class: 'kv-chat-hinweis', text: T.emailHinweis }), s].forEach(function (x) { kontaktBox.appendChild(x); });
  }

  function zeigeMeldung(t) { if (meldung) meldung.textContent = t || ''; }

  function pruefen() {
    var text = feldText.value.trim();
    var zuLang = feldText.value.length > MAX_ZEICHEN;
    zaehler.hidden = !zuLang;
    zaehler.textContent = zuLang ? T.zeichenUeber : '';
    var ok = text !== '' && !zuLang && !zustand.sendet && (zustand.token || (haken && haken.checked));
    sendeKnopf.disabled = !ok;
    sendeKnopf.textContent = zustand.sendet ? T.sendet : T.senden;
  }

  function uhrzeit(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  function verlaufZeichnen() {
    var amEnde = verlauf.scrollHeight - verlauf.scrollTop - verlauf.clientHeight < 60;
    verlauf.textContent = '';
    verlauf.appendChild(el('div', { class: 'kv-chat-blase wir' }, [el('p', { text: T.begruessung })]));
    zustand.nachrichten.forEach(function (n) {
      verlauf.appendChild(el('div', { class: 'kv-chat-blase ' + (n.von_team ? 'wir' : 'du') }, [
        el('p', { text: String(n.text) }),
        el('span', { class: 'kv-chat-zeit', text: (n.von_team ? T.wir : T.du) + ' · ' + uhrzeit(n.gesendet) })
      ]));
    });
    if (amEnde || !zustand.offen) verlauf.scrollTop = verlauf.scrollHeight;
  }

  function teamZaehlen() {
    return zustand.nachrichten.filter(function (n) { return n.von_team; }).length;
  }
  function punktSetzen() {
    var neu = teamZaehlen() > zustand.gesehenTeam;
    punkt.hidden = !(neu && !zustand.offen);
  }

  // --- Abfragen -------------------------------------------------------------
  function lesen() {
    if (!zustand.token) return Promise.resolve();
    return aufruf({ aktion: 'lesen', token: zustand.token, still: !zustand.offen }).then(function (r) {
      if (r.status === 404) { vergessen(); fussAufbauen(); verlaufZeichnen(); punktSetzen(); return; }
      if (r.status !== 200 || !r.daten || !Array.isArray(r.daten.nachrichten)) return;
      var alt = JSON.stringify(zustand.nachrichten.map(function (n) { return n.id; }));
      zustand.nachrichten = r.daten.nachrichten.filter(function (n) { return n && typeof n.text === 'string'; });
      if (JSON.stringify(zustand.nachrichten.map(function (n) { return n.id; })) !== alt) verlaufZeichnen();
      if (zustand.offen) { zustand.gesehenTeam = teamZaehlen(); speichern(); }
      punktSetzen();
    }).catch(function () { /* beim nächsten Mal wieder */ });
  }

  function takt() {
    if (zustand.timer) window.clearTimeout(zustand.timer);
    zustand.timer = null;
    if (!zustand.token) return;
    var warten = zustand.offen ? ABFRAGE_OFFEN_MS : ABFRAGE_ZU_MS;
    zustand.timer = window.setTimeout(function () {
      var arbeit = document.hidden ? Promise.resolve() : lesen();
      arbeit.then(takt);
    }, warten);
  }

  // --- Öffnen / Schließen -----------------------------------------------------
  function oeffnen() {
    zustand.offen = true;
    zustand.geoeffnetAm = zustand.geoeffnetAm || Date.now();
    fenster.hidden = false;
    knopf.setAttribute('aria-expanded', 'true');
    knopf.setAttribute('aria-label', T.schliessen);
    document.documentElement.classList.add('kv-chat-offen');
    punktSetzen();
    lesen().then(function () { verlauf.scrollTop = verlauf.scrollHeight; });
    takt();
    window.setTimeout(function () { feldText.focus(); }, 30);
  }
  function schliessen() {
    zustand.offen = false;
    fenster.hidden = true;
    knopf.setAttribute('aria-expanded', 'false');
    knopf.setAttribute('aria-label', T.oeffnen);
    document.documentElement.classList.remove('kv-chat-offen');
    takt();
  }

  // --- Senden ---------------------------------------------------------------
  function absenden() {
    if (sendeKnopf.disabled) return;
    var text = feldText.value.trim();
    if (!text) return;
    sende(text, false);
  }

  function sende(text, wiederholt) {
    // Gleicher Text = gleiche Anfrage-ID (kein Doppel bei Wiederholung nach Netzfehler).
    if (!zustand.versuch || zustand.versuch.text !== text) zustand.versuch = { text: text, id: neueId() };
    var body = {
      aktion: 'senden',
      request_id: zustand.versuch.id,
      text: text,
      hp: honigtopf ? honigtopf.value : '',
      offen_ms: Date.now() - (zustand.geoeffnetAm || Date.now())
    };
    if (zustand.token) body.token = zustand.token;
    else {
      body.einwilligung = true;
      if (feldName && feldName.value.trim()) body.name = feldName.value.trim();
      if (feldMail && feldMail.value.trim()) body.email = feldMail.value.trim();
    }
    zustand.sendet = true;
    zeigeMeldung('');
    pruefen();
    aufruf(body).then(function (r) {
      zustand.sendet = false;
      if (r.status === 200 && r.daten && r.daten.zustand === 'gesendet') {
        var neueSitzung = !!r.daten.token && !zustand.token;
        if (r.daten.token) {
          zustand.token = r.daten.token;
          zustand.einwilligung = true;
          speichern();
        }
        zustand.versuch = null;
        feldText.value = '';
        if (neueSitzung) {
          fussAufbauen();
          feldText.focus();
        }
        pruefen();
        lesen().then(takt);
        return;
      }
      if (r.status === 404 && zustand.token && !wiederholt) {
        // Sitzung abgelaufen: der Haken war schon gesetzt, einmal neu beginnen.
        vergessen();
        zustand.einwilligung = true;
        speichern();
        sende(text, true);
        return;
      }
      zeigeMeldung(r.status === 429 ? T.fehlerZuViele : r.status === 400 ? T.fehlerUngueltig : T.fehlerNetz);
      pruefen();
    }).catch(function () {
      zustand.sendet = false;
      zeigeMeldung(T.fehlerNetz);
      pruefen();
    });
  }

  function start() {
    laden();
    aufbauen();
    if (zustand.token) { lesen().then(takt); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && zustand.token) lesen(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
