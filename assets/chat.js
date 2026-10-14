/* KAVEO — Livechat auf kaveo-golf.app.
 * Eigenes Skript, keine Fremdquellen. Spricht nur mit der Edge Function
 * "nachrichten-homepage" (Supabase). Gespeichert wird im Browser nur eine
 * zufällige Kennung (localStorage) und, dass der Datenschutz-Haken gesetzt wurde.
 * Nachrichten und Texte der Besucher werden nie als HTML eingefügt (textContent). */
(function () {
  'use strict';

  var API = 'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/nachrichten-homepage';
  var API_BILD = 'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/nachrichten-homepage-bild';
  var API_SPRACHE = 'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/nachrichten-homepage-sprache';
  var API_DATEI = 'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/nachrichten-homepage-datei';
  var API_VIDEO = 'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/nachrichten-homepage-video';
  var DATEI_MAX_BYTES = 10 * 1024 * 1024;
  var VIDEO_MAX_BYTES = 25 * 1024 * 1024;
  // Videos gehen direkt in den Speicher (signierter Link der Video-Funktion), nicht durch die Funktion.
  var SPEICHER_UPLOAD = 'https://xyakqziopzjjihovyesj.supabase.co/storage/v1/object/upload/sign/inbox-medien/homepage/';
  var SPRACHE_MAX_SEK = 600; // 10 Minuten
  var SPRACHE_MAX_BYTES = 6 * 1024 * 1024;
  var SPRACHE_STOPP_BYTES = 5.5 * 1024 * 1024; // Sicherheitsabstand zur Serverobergrenze von 6 MB
  var SPRACHE_BITRATE = 32000; // 10 Minuten bleiben so bei etwa 2,4 MB
  var SPEICHER = 'kaveo-chat-v1';
  var DATENSCHUTZ = 'https://kaveo-golf.app/datenschutz/#livechat';
  var MAX_ZEICHEN = 1000;
  var BILD_KANTE = 1600; // längste Seite in Pixel; so bleibt jedes Foto weit unter 5 MB
  var BILD_QUALITAET = 0.85;
  var BILD_URL_MS = 45 * 60 * 1000; // signierte Adressen gelten 60 Minuten
  var ABFRAGE_OFFEN_MS = 5000;
  var ABFRAGE_ZU_MS = 30000;

  var T = {
    oeffnen: 'Chat öffnen',
    schliessen: 'Chat schließen',
    titel: 'KAVEO',
    team: 'KAVEO Team',
    lina: 'Lina · KI',
    unterzeile: 'Lina (KI) antwortet, Philipp liest mit.',
    begruessung: "Moin! Ich bin Lina, die KI von KAVEO. Schreib einfach, worum es geht – wenn's knifflig wird, übernimmt Philipp.",
    startKlein: 'Livechat',
    startTitelA: 'Moin!',
    startTitelB: 'Wie können wir ',
    startTitelC: 'helfen?',
    startText: "Hier schreibst du mit Lina, unserer KI. Philipp liest mit und antwortet persönlich, wenn's nötig ist.",
    startLos: 'Nachricht schreiben',
    startWeiter: 'Zum Gespräch',
    themenTitel: 'Häufige Themen',
    startDatenschutz: 'Datenschutz: ',
    startDatenschutzLink: 'So verarbeiten wir deine Nachricht',
    zurueck: 'Zurück zur Startansicht',
    logo: 'KAVEO GOLF',
    erstTitel: 'Wie erreichen wir dich?',
    erstText: 'Beides freiwillig. Mit E-Mail bekommst du die Antwort auch, wenn du den Chat schon verlassen hast.',
    nameLabel: 'Name',
    namePlatz: 'Wie dürfen wir dich nennen?',
    mailLabel: 'E-Mail',
    mailPlatz: 'deine@email.de',
    hinweisTitelA: 'Fragen zu ',
    hinweisTitelB: 'KAVEO?',
    hinweisText: 'Frag Lina – unsere KI hilft dir weiter.',
    hinweisWeg: 'Hinweis ausblenden',
    platzhalter: 'Nachricht schreiben …',
    nachricht: 'Nachricht',
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
    zeichenUeber: 'Zu lang – höchstens 1000 Zeichen.',
    reagieren: 'Mit Emoji reagieren',
    antworten: 'Auf diese Nachricht antworten',
    antwortAuf: 'Antwort auf',
    zitatWeg: 'Antwort abbrechen',
    emojiOeffnen: 'Emoji einfügen',
    deineReaktion: 'Deine Reaktion – zum Entfernen tippen',
    teamReaktion: 'Reaktion von KAVEO',
    antwortWaehlen: 'Antwort wählen',
    fehlerReaktion: 'Die Reaktion konnte nicht gespeichert werden.',
    nachrichtMenue: 'Nachricht: Reagieren oder antworten',
    bildAnhaengen: 'Bild anhängen',
    bildErstSchreiben: 'Schick zuerst eine Nachricht, dann kannst du Bilder anhängen.',
    bildWeg: 'Bild entfernen',
    bildVorschau: 'Vorschau des gewählten Bildes',
    bildBereit: 'Bild bereit – dein Text wird zur Bildunterschrift.',
    bildLesen: 'Das Bild wird vorbereitet …',
    bildNichtLesbar: 'Dieses Bild konnte nicht gelesen werden. Bitte wähle ein anderes.',
    fehlerBildZuViele: 'Gerade zu viele Bilder – bitte warte etwas.',
    fehlerBildFormat: 'Dieses Bild kann nicht gesendet werden (nur Bilder, höchstens 5 MB).',
    bildNichtDa: 'Bild nicht verfügbar',
    bildGross: 'Bild groß ansehen',
    fotoZitat: '📷 Foto',
    sprachZitat: '🎤 Sprachnachricht',
    sprachAufnehmen: 'Sprachnachricht aufnehmen',
    sprachErstSchreiben: 'Schick zuerst eine Nachricht, dann kannst du Sprachnachrichten aufnehmen.',
    sprachStopp: 'Aufnahme beenden',
    sprachAbbrechen: 'Aufnahme verwerfen',
    sprachSenden: 'Sprachnachricht senden',
    sprachVorschau: 'Deine Aufnahme – zum Anhören abspielen',
    sprachNimmtAuf: 'Aufnahme läuft',
    sprachNeinMikro: 'Der Zugriff auf das Mikrofon ist nicht erlaubt. Bitte erlaube ihn im Browser und versuch es noch einmal.',
    sprachKeinMikro: 'Es wurde kein Mikrofon gefunden.',
    sprachZuKurz: 'Die Aufnahme war zu kurz.',
    sprachFehler: 'Die Aufnahme hat nicht geklappt. Bitte versuch es noch einmal.',
    fehlerSpracheZuViele: 'Gerade zu viele Sprachnachrichten – bitte warte etwas.',
    fehlerSpracheFormat: 'Diese Sprachnachricht kann nicht gesendet werden (höchstens 10 Minuten).',
    sprachNichtDa: 'Sprachnachricht nicht verfügbar',
    sprachPlayer: 'Sprachnachricht abspielen',
    anhaengen: 'Bild, PDF oder Video anhängen',
    anhaengenErst: 'Schick zuerst eine Nachricht, dann kannst du Bilder, PDFs oder Videos anhängen.',
    dateiBereit: 'PDF bereit – sie wird ohne Text gesendet.',
    dateiWeg: 'PDF entfernen',
    dateiZuGross: 'Diese PDF ist größer als 10 MB und kann nicht gesendet werden.',
    dateiNichtLesbar: 'Das ist keine gültige PDF-Datei. Bitte wähle eine andere.',
    dateiSenden: 'PDF senden',
    fehlerDateiZuViele: 'Gerade zu viele Dateien – bitte warte etwas.',
    fehlerDateiFormat: 'Diese Datei kann nicht gesendet werden (nur PDF, höchstens 10 MB).',
    dateiNichtDa: 'Datei nicht verfügbar',
    dateiOeffnen: 'PDF öffnen: ',
    dateiZitat: '📎 ',
    videoBereit: 'Video bereit – es wird ohne Text gesendet.',
    videoWeg: 'Video entfernen',
    videoZuGross: 'Dieses Video ist größer als 25 MB und kann nicht gesendet werden. Bitte schick einen kürzeren Ausschnitt.',
    videoNichtLesbar: 'Dieses Video kann nicht gesendet werden. Erlaubt sind MP4 und MOV (z. B. vom Handy).',
    videoLaedt: 'Video wird hochgeladen …',
    fehlerVideoZuViele: 'Gerade zu viele Videos – bitte warte etwas.',
    fehlerVideoFormat: 'Dieses Video kann nicht gesendet werden (nur MP4 oder MOV, höchstens 25 MB).',
    videoNichtDa: 'Video nicht verfügbar',
    videoPlayer: 'Video abspielen',
    videoNichtAbspielbar: 'Dieses Video kann dein Browser nicht abspielen.',
    videoHerunterladen: 'Herunterladen',
    videoNichtHochgeladen: 'Das Video konnte nicht hochgeladen werden. Bitte versuch es noch einmal oder schick ein kürzeres Video.',
    videoZitat: '🎬 Video'
  };

  // Startansicht: ein Klick öffnet den Chat und schreibt das Thema vorne ins Textfeld (nichts wird mitgeschickt).
  var THEMEN = ['Fragen zur App', 'Konto & Anmeldung', 'Fehler melden', 'Idee oder Feedback', 'Etwas anderes'];
  var LOGO = '/assets/logo-lockup-256.webp';
  var K_LOGO = '/assets/chat-k.webp';
  var LINA_ZEICHEN = '/assets/lina-zeichen.svg';
  // Profilbilder nur als signierte Adresse aus unserem Speicher (Bucket avatars), nie von anderswo.
  var PROFILBILD = 'https://xyakqziopzjjihovyesj.supabase.co/storage/v1/object/sign/avatars/';
  function istProfilbild(u) { return typeof u === 'string' && u.indexOf(PROFILBILD) === 0; }
  var HINWEIS_NACH_MS = 6000;

  // Symbole als eigene SVG (feste Zeichenketten, nie Besuchertext).
  var SYMBOL = {
    chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.6a.6.6 0 0 1-1-.46V16H6.5A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 8.5h7M8.5 11.5h4"/>',
    runter: '<path d="M6 9l6 6 6-6"/>',
    zurueck: '<path d="M15 18l-6-6 6-6"/>',
    weiter: '<path d="M9 6l6 6-6 6"/>',
    zu: '<path d="M6 6l12 12M18 6L6 18"/>',
    klammer: '<path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/>',
    smiley: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>',
    mikro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    hoch: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    antworten: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    datei: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    film: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    stopp: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'
  };
  function symbol(name, groesse) {
    var s = groesse || 20;
    var h = document.createElement('span');
    h.className = 'kv-chat-symbol';
    h.setAttribute('aria-hidden', 'true');
    h.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + SYMBOL[name] + '</svg>';
    return h.firstChild;
  }
  function wegKnopf(label) {
    return el('button', { type: 'button', class: 'kv-chat-zitat-weg', 'aria-label': label }, [symbol('zu', 14)]);
  }

  // Schnellauswahl zum Reagieren (wie im Mitglieder-Chat) und Auswahl fürs Schreiben.
  var REAKTIONEN = ['👍', '❤️', '😂', '😮', '😢', '🙏', '⛳'];
  var EMOJI_GRUPPEN = [
    { symbol: '😀', name: 'Gesichter', liste: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '😎', '🤓', '🥳', '🤔', '🤗', '🫡', '😏', '😌', '😴', '🤤', '😮', '😲', '😳', '🥺', '😢', '😭', '😤', '😡', '🤯', '😱', '🙃', '😬', '🙄', '😐', '🤐', '🤫', '🤭', '🥵', '🥶', '🤒'] },
    { symbol: '👍', name: 'Gesten', liste: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '👋', '🖐️', '🖖', '👏', '🙌', '🤝', '🙏', '💪', '✍️', '🤳', '👀', '🧠', '👂', '🫶', '🫰', '🫵', '🤌'] },
    { symbol: '❤️', name: 'Herzen und Symbole', liste: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💯', '💥', '✨', '⭐', '🌟', '🔥', '🎉', '🎊', '✅', '❌', '❓', '❗', '⚡', '💡', '🔔', '🎁', '👑', '💎', '🏅', '🚀'] },
    { symbol: '⛳', name: 'Golf und Sport', liste: ['⛳', '🏌️', '🏌️‍♀️', '🏌️‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎯', '⚽', '🏀', '🎾', '🏓', '🥅', '🚶', '🚗', '🛺', '🧢', '👟', '🧤', '🕶️', '🍺', '🥂', '🍻', '☕', '🍔', '🍕', '🌭', '🍎', '🍌', '🥗'] },
    { symbol: '☀️', name: 'Natur und Orte', liste: ['☀️', '🌤️', '⛅', '☁️', '🌧️', '⛈️', '🌈', '❄️', '💨', '🌬️', '🌿', '🍀', '🌳', '🌲', '🌴', '🌸', '🌻', '🌹', '🐦', '🦅', '🦆', '🐕', '🐈', '🦌', '📍', '🗺️', '🧭', '🏡', '🏨', '✈️', '📅', '⏰'] }
  ];

  var zustand = {
    token: null,
    einwilligung: false,
    offen: false,
    ansicht: 'start', // 'start' (Begrüßung mit Themen) oder 'chat'
    hinweisWeg: false, // Hinweisblase für diesen Seitenaufruf erledigt (nicht gespeichert)
    geoeffnetAm: 0,
    nachrichten: [],
    gesehenTeam: 0,
    sendet: false,
    timer: null,
    versuch: null, // { text, id, antwort } – gleiche Anfrage-ID bei Wiederholung
    aktiv: null, // Nachricht, deren Aktionen (Reagieren/Antworten) gerade offen sind
    waehlen: null, // Nachricht, deren Emoji-Auswahl offen ist
    antwortAuf: null, // { id, text, von_team } – Zitat für die nächste Nachricht
    emojiOffen: false,
    reaktionWartet: {}, // id -> Emoji ('' = entfernt), bis die Funktion geantwortet hat
    bild: null, // { blob, url } – gewähltes Bild, wird mit dem nächsten Senden verschickt
    bildBereit: false,
    bildUrls: {}, // Nachrichten-Id -> { url, seit }: gleiche Adresse behalten, sonst flackert das Bild bei jeder Abfrage
    versuchBild: null, // { id, text } – gleiche Anfrage-ID bei Wiederholung
    sprache: null, // { phase: 'nimmt'|'bereit', ... } – Sprachaufnahme
    versuchSprache: null, // { id, blob } – gleiche Anfrage-ID bei Wiederholung
    datei: null, // { blob, name } – gewählte PDF, wird mit „Senden“ verschickt
    versuchDatei: null, // { id, blob } – gleiche Anfrage-ID bei Wiederholung
    video: null, // { blob, name } – gewähltes Video (MP4/MOV), wird mit „Senden“ verschickt
    versuchVideo: null, // { id, blob } – gleiche Anfrage-ID bei Wiederholung
    videoProzent: null, // Fortschritt beim Hochladen
    spaeterZeichnen: false, // neue Nachrichten erst zeigen, wenn kein Video/keine Sprachnachricht mehr läuft
    audioNeu: {} // Nachrichten-Id -> true: neue Adresse wurde schon einmal geholt
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
    bildVerwerfen();
    dateiVerwerfen();
    videoVerwerfen();
    spracheVerwerfen();
    zustand.bildUrls = {};
    zustand.audioNeu = {};
    zustand.token = null;
    zustand.nachrichten = [];
    zustand.gesehenTeam = 0;
    zustand.aktiv = null; zustand.waehlen = null; zustand.antwortAuf = null; zustand.reaktionWartet = {};
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
  /** fetch mit Zeitlimit: haengt die Verbindung, wird abgebrochen und der Besucher bekommt die Netz-Meldung. */
  function mitLimit(url, opt, ms) {
    if (typeof AbortController === 'undefined') return fetch(url, opt);
    var ac = new AbortController();
    var uhr = setTimeout(function () { ac.abort(); }, ms);
    opt.signal = ac.signal;
    return fetch(url, opt).then(function (r) { clearTimeout(uhr); return r; }, function (e) { clearTimeout(uhr); throw e; });
  }

  function aufruf(body) {
    return mitLimit(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }, 15000).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) { return { status: r.status, daten: d }; });
    });
  }

  // --- Aufbau ---------------------------------------------------------------
  var knopf, fenster, kopf, start, startLos, bereich, verlauf, fuss, punkt, hinweis, erstKarte;
  var feldText, feldName, feldMail, haken, honigtopf, sendeKnopf, meldung, zaehler, kontaktBox, zitatBox, emojiKnopf, emojiBox, bildKnopf, bildEingabe, bildBox, dateiBox, videoBox, mikroKnopf, spracheBox;

  /** KAVEO-Zeichen (K im Kreis) für Kopf, Hinweisblase und Team-Nachrichten ohne Bild. */
  function kZeichen(klasse) {
    return el('span', { class: 'kv-chat-k ' + (klasse || ''), 'aria-hidden': 'true' }, [
      el('img', { src: K_LOGO, alt: '', decoding: 'async' })
    ]);
  }

  /** Bild neben einer Antwort: Lina-Zeichen (automatisch), Profilbild der Person oder das K. */
  function absenderBild(n) {
    var a = n.absender;
    if (a && a.art === 'lina') {
      return el('span', { class: 'kv-chat-ava lina', 'aria-hidden': 'true' }, [el('img', { src: LINA_ZEICHEN, alt: '', decoding: 'async' })]);
    }
    if (a && a.art === 'team' && istProfilbild(a.bild)) {
      var box = el('span', { class: 'kv-chat-ava foto', 'aria-hidden': 'true' });
      var img = el('img', { src: a.bild, alt: '', decoding: 'async', referrerpolicy: 'no-referrer' });
      // Abgelaufene oder kaputte Adresse: das K statt eines leeren Kreises.
      img.addEventListener('error', function () { if (box.parentNode) box.parentNode.replaceChild(kZeichen('kv-chat-ava'), box); });
      box.appendChild(img);
      return box;
    }
    return kZeichen('kv-chat-ava');
  }

  /** Name über einer Antwort: „Lina · KI“ oder der Vorname; ohne Angabe nichts. */
  function absenderName(n) {
    var a = n.absender;
    if (a && a.art === 'lina') return T.lina;
    if (a && a.art === 'team' && typeof a.name === 'string' && a.name) return a.name;
    return '';
  }

  function aufbauen() {
    knopf = el('button', { type: 'button', class: 'kv-chat-knopf', 'aria-label': T.oeffnen, 'aria-expanded': 'false', 'aria-controls': 'kv-chat-fenster' }, [symbol('chat', 26)]);
    punkt = el('span', { class: 'kv-chat-punkt', hidden: '' });
    knopf.appendChild(punkt);
    knopf.addEventListener('click', function () { zustand.offen ? schliessen() : oeffnen(); });

    var zu = el('button', { type: 'button', class: 'kv-chat-zu', 'aria-label': T.schliessen }, [symbol('runter')]);
    zu.addEventListener('click', function () { schliessen(); knopf.focus(); });
    var zurueck = el('button', { type: 'button', class: 'kv-chat-zurueck', 'aria-label': T.zurueck }, [symbol('zurueck')]);
    zurueck.addEventListener('click', function () { ansichtZeigen('start'); });
    kopf = el('div', { class: 'kv-chat-kopf' }, [
      zurueck,
      kZeichen('gross'),
      el('div', { class: 'kv-chat-kopf-text' }, [el('p', { class: 'kv-chat-titel', text: T.team }), el('p', { class: 'kv-chat-unter', text: T.unterzeile })]),
      zu
    ]);
    start = startAufbauen();
    // Bereich scrollt; darin der Live-Bereich (nur Nachrichten) und darunter ggf. die Karte für die erste Nachricht.
    verlauf = el('div', { class: 'kv-chat-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
    bereich = el('div', { class: 'kv-chat-verlauf' }, [verlauf]);
    fuss = el('div', { class: 'kv-chat-fuss' });
    fenster = el('div', { class: 'kv-chat-fenster', id: 'kv-chat-fenster', role: 'dialog', 'aria-label': T.titel + ' Chat', hidden: '' }, [start, kopf, bereich, fuss]);
    fenster.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (zustand.emojiOffen) { emojiUmschalten(false); emojiKnopf.focus(); return; }
      if (zustand.waehlen) { var id = zustand.waehlen; zustand.waehlen = null; verlaufZeichnen(); fokusAuf(id); return; }
      schliessen(); knopf.focus();
    });
    fenster.addEventListener('click', function (e) {
      if (zustand.emojiOffen && !emojiBox.contains(e.target) && !emojiKnopf.contains(e.target)) emojiUmschalten(false);
    });
    hinweis = hinweisAufbauen();
    document.body.appendChild(fenster);
    document.body.appendChild(hinweis);
    document.body.appendChild(knopf);
    zustand.ansicht = zustand.token ? 'chat' : 'start';
    fussAufbauen();
    verlaufZeichnen();
    ansichtZeigen(zustand.ansicht, true);
  }

  /** Startansicht: Begrüßung, „Nachricht schreiben“, häufige Themen, Datenschutz-Link. */
  function startAufbauen() {
    var zu = el('button', { type: 'button', class: 'kv-chat-zu kv-chat-zu-rund', 'aria-label': T.schliessen }, [symbol('runter', 18)]);
    zu.addEventListener('click', function () { schliessen(); knopf.focus(); });
    var logo = el('img', { class: 'kv-chat-logo', src: LOGO, alt: T.logo, decoding: 'async' });
    var titel = el('h2', { class: 'kv-chat-start-titel' }, [
      document.createTextNode(T.startTitelA), el('br'), document.createTextNode(T.startTitelB),
      el('span', { class: 'kv-chat-serif', text: T.startTitelC })
    ]);
    startLos = el('button', { type: 'button', class: 'kv-chat-start-los' }, [el('span', { class: 'kv-chat-los-punkt', 'aria-hidden': 'true' }), el('span', { text: T.startLos })]);
    startLos.addEventListener('click', function () { themaWaehlen(null); });
    var liste = el('ul', { class: 'kv-chat-themen', 'aria-label': T.themenTitel });
    THEMEN.forEach(function (t) {
      var b = el('button', { type: 'button', class: 'kv-chat-thema' }, [el('span', { text: t }), symbol('weiter', 18)]);
      b.addEventListener('click', function () { themaWaehlen(t); });
      liste.appendChild(el('li', {}, [b]));
    });
    return el('div', { class: 'kv-chat-start' }, [
      el('div', { class: 'kv-chat-start-oben' }, [
        el('div', { class: 'kv-chat-start-leiste' }, [logo, zu]),
        el('div', { class: 'kv-chat-start-texte' }, [
          el('p', { class: 'kv-chat-klein', text: T.startKlein }),
          titel,
          el('p', { class: 'kv-chat-start-text', text: T.startText })
        ]),
        startLos
      ]),
      el('div', { class: 'kv-chat-start-themen' }, [el('p', { class: 'kv-chat-klein grau', text: T.themenTitel }), liste]),
      el('p', { class: 'kv-chat-start-fuss' }, [
        document.createTextNode(T.startDatenschutz),
        el('a', { href: DATENSCHUTZ, target: '_blank', rel: 'noopener', text: T.startDatenschutzLink })
      ])
    ]);
  }

  /** Zwischen Startansicht und Chat wechseln. */
  function ansichtZeigen(a, still) {
    zustand.ansicht = a;
    var istStart = a === 'start';
    start.hidden = !istStart;
    kopf.hidden = istStart;
    bereich.hidden = istStart;
    fuss.hidden = istStart;
    if (istStart && zustand.emojiOffen) emojiUmschalten(false);
    if (istStart && zustand.sprache && zustand.sprache.phase !== 'bereit') spracheVerwerfen(); // Mikrofon nie unsichtbar weiterlaufen lassen
    startLos.lastChild.textContent = zustand.token ? T.startWeiter : T.startLos;
    if (still || !zustand.offen) return;
    if (istStart) startLos.focus();
    else { bereich.scrollTop = bereich.scrollHeight; feldText.focus(); }
  }

  /** Thema übernehmen: Chat öffnen und das Thema vorne ins Textfeld schreiben (ohne Thema: nur öffnen). */
  function themaWaehlen(thema) {
    ansichtZeigen('chat', true);
    if (thema) {
      var rest = feldText.value;
      THEMEN.forEach(function (t) { if (rest.indexOf(t + ': ') === 0) rest = rest.slice(t.length + 2); });
      feldText.value = thema + ': ' + rest;
    }
    hoeheAnpassen();
    pruefen();
    bereich.scrollTop = bereich.scrollHeight;
    feldText.focus();
    var ende = feldText.value.length;
    try { feldText.setSelectionRange(ende, ende); } catch (x) { /* egal */ }
  }

  /** Kleine Blase neben dem geschlossenen Knopf; nur auf großen Bildschirmen, ohne Speicherung. */
  function hinweisAufbauen() {
    var auf = el('button', { type: 'button', class: 'kv-chat-hinweis-auf' }, [
      kZeichen(),
      el('span', { class: 'kv-chat-hinweis-texte' }, [
        el('span', { class: 'kv-chat-hinweis-titel' }, [document.createTextNode(T.hinweisTitelA), el('span', { class: 'kv-chat-serif', text: T.hinweisTitelB })]),
        el('span', { class: 'kv-chat-hinweis-text', text: T.hinweisText })
      ])
    ]);
    auf.addEventListener('click', function () { hinweisWeg(); oeffnen(); });
    var weg = el('button', { type: 'button', class: 'kv-chat-hinweis-weg', 'aria-label': T.hinweisWeg }, [symbol('zu', 14)]);
    weg.addEventListener('click', function () { hinweisWeg(); knopf.focus(); });
    return el('div', { class: 'kv-chat-blase-hinweis', hidden: '' }, [auf, weg]);
  }
  function hinweisWeg() {
    zustand.hinweisWeg = true;
    if (hinweis) hinweis.hidden = true;
  }
  function hinweisPlanen() {
    window.setTimeout(function () {
      var gross = !window.matchMedia || window.matchMedia('(min-width: 521px)').matches;
      if (zustand.hinweisWeg || zustand.offen || zustand.token || !gross) return;
      hinweis.hidden = false;
    }, HINWEIS_NACH_MS);
  }

  function fussAufbauen() {
    fuss.textContent = '';
    if (erstKarte && erstKarte.parentNode) erstKarte.parentNode.removeChild(erstKarte);
    erstKarte = null;
    meldung = el('p', { class: 'kv-chat-meldung', role: 'status', 'aria-live': 'polite' });
    var alterText = feldText ? feldText.value : '';
    feldText = el('textarea', { class: 'kv-chat-text', rows: '1', maxlength: String(MAX_ZEICHEN + 200), placeholder: T.platzhalter, 'aria-label': T.nachricht });
    feldText.value = alterText;
    feldText.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); absenden(); }
    });
    feldText.addEventListener('input', function () { hoeheAnpassen(); pruefen(); });
    zaehler = el('p', { class: 'kv-chat-zaehler', hidden: '' });
    sendeKnopf = el('button', { type: 'button', class: 'kv-chat-senden', 'aria-label': T.senden, title: T.senden }, [symbol('hoch', 18)]);
    sendeKnopf.addEventListener('click', absenden);

    // Verstecktes Feld: Menschen sehen es nie, einfache Bots füllen es aus.
    honigtopf = el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', class: 'kv-chat-honig' });

    zitatBox = el('div', { class: 'kv-chat-zitatleiste', hidden: '' });
    emojiKnopf = el('button', { type: 'button', class: 'kv-chat-emoji-knopf', 'aria-label': T.emojiOeffnen, title: T.emojiOeffnen, 'aria-expanded': 'false' }, [symbol('smiley')]);
    emojiKnopf.addEventListener('click', function () { emojiUmschalten(); });
    if (emojiBox && emojiBox.parentNode) emojiBox.parentNode.removeChild(emojiBox);
    emojiBox = emojiAuswahlBauen();
    fenster.appendChild(emojiBox);
    zustand.emojiOffen = false;

    bildKnopf = el('button', { type: 'button', class: 'kv-chat-emoji-knopf kv-chat-bildknopf', 'aria-label': T.anhaengen, title: zustand.token ? T.anhaengen : T.anhaengenErst }, [symbol('klammer')]);
    bildKnopf.disabled = !zustand.token;
    bildKnopf.addEventListener('click', function () { if (zustand.token) bildEingabe.click(); });
    bildEingabe = el('input', { type: 'file', accept: 'image/*,application/pdf,.pdf,video/mp4,video/quicktime,.mp4,.mov,.m4v', class: 'kv-chat-honig', tabindex: '-1', 'aria-hidden': 'true' });
    bildEingabe.addEventListener('change', function () {
      var d = bildEingabe.files && bildEingabe.files[0];
      bildEingabe.value = '';
      if (!d) return;
      if (d.type === 'application/pdf' || /\.pdf$/i.test(d.name || '')) dateiWaehlen(d);
      else if (/^video\//.test(d.type || '') || /\.(mp4|mov|m4v)$/i.test(d.name || '')) videoWaehlen(d);
      else bildWaehlen(d);
    });
    bildBox = el('div', { class: 'kv-chat-bildleiste', hidden: '' });
    dateiBox = el('div', { class: 'kv-chat-bildleiste', hidden: '' });
    videoBox = el('div', { class: 'kv-chat-bildleiste', hidden: '' });

    spracheBox = el('div', { class: 'kv-chat-bildleiste kv-chat-sprachleiste', hidden: '' });
    mikroKnopf = null;
    if (spracheMoeglich()) {
      mikroKnopf = el('button', { type: 'button', class: 'kv-chat-emoji-knopf kv-chat-mikroknopf', 'aria-label': T.sprachAufnehmen, title: zustand.token ? T.sprachAufnehmen : T.sprachErstSchreiben }, [symbol('mikro', 18)]);
      mikroKnopf.disabled = !zustand.token;
      mikroKnopf.addEventListener('click', function () { if (zustand.token) spracheStarten(); });
    }

    var zeile = el('div', { class: 'kv-chat-zeile' }, [bildKnopf, emojiKnopf, feldText, mikroKnopf, sendeKnopf]);
    var teile = [meldung, zitatBox, bildBox, dateiBox, videoBox, spracheBox, bildEingabe, zeile, zaehler, honigtopf];

    if (!zustand.token) {
      // Erste Nachricht: Name/E-Mail freiwillig, Datenschutz-Haken Pflicht. Die Karte steht im Verlauf.
      feldName = el('input', { type: 'text', id: 'kv-chat-name', class: 'kv-chat-feld', maxlength: '80', autocomplete: 'name', placeholder: T.namePlatz });
      feldMail = el('input', { type: 'email', id: 'kv-chat-mail', class: 'kv-chat-feld', maxlength: '254', autocomplete: 'email', placeholder: T.mailPlatz });
      feldMail.addEventListener('input', pruefen);
      haken = el('input', { type: 'checkbox', id: 'kv-chat-haken' });
      haken.checked = zustand.einwilligung;
      haken.addEventListener('change', pruefen);
      var link = el('a', { href: DATENSCHUTZ, target: '_blank', rel: 'noopener', text: T.datenschutzLink });
      var label = el('label', { class: 'kv-chat-haken', for: 'kv-chat-haken' }, [haken, el('span', {}, [document.createTextNode(T.datenschutzA), link, document.createTextNode(T.datenschutzB)])]);
      erstKarte = el('div', { class: 'kv-chat-erstkarte', role: 'group', 'aria-label': T.erstTitel }, [
        el('p', { class: 'kv-chat-erst-titel', text: T.erstTitel }),
        el('p', { class: 'kv-chat-hinweis', text: T.erstText }),
        el('label', { class: 'kv-chat-label', for: 'kv-chat-name', text: T.nameLabel }), feldName,
        el('label', { class: 'kv-chat-label', for: 'kv-chat-mail', text: T.mailLabel }), feldMail,
        label
      ]);
      bereich.appendChild(erstKarte);
      teile = [meldung, zeile, el('p', { class: 'kv-chat-hinweis mitte', text: T.anhaengenErst }), zaehler, honigtopf];
    } else {
      haken = null; feldName = null; feldMail = null; erstKarte = null;
      kontaktBox = el('div', { class: 'kv-chat-kontakt' });
      kontaktAnzeigen(false);
      teile.push(kontaktBox);
    }
    teile.forEach(function (t) { fuss.appendChild(t); });
    zitatZeigen();
    dateiZeigen();
    videoZeigen();
    spracheZeigen();
    hoeheAnpassen();
    pruefen();
  }

  /** Textfeld wächst mit (bis zur Höchsthöhe aus dem CSS). */
  function hoeheAnpassen() {
    if (!feldText) return;
    feldText.style.height = 'auto';
    if (feldText.scrollHeight > 0) feldText.style.height = feldText.scrollHeight + 'px';
  }

  /** Emoji-Auswahl wie bei WhatsApp: Fenster über dem Schreibfeld, oben die Gruppen, darunter ein Raster. */
  function emojiAuswahlBauen() {
    var box = el('div', { class: 'kv-chat-emojis', role: 'group', 'aria-label': T.emojiOeffnen, hidden: '' });
    var leiste = el('div', { class: 'kv-chat-emoji-gruppen' });
    var raster = el('div', { class: 'kv-chat-emoji-raster' });
    var tabs = [];
    function zeige(i) {
      tabs.forEach(function (t, k) { t.className = 'kv-chat-emoji-tab' + (k === i ? ' an' : ''); t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      raster.textContent = '';
      raster.scrollTop = 0;
      EMOJI_GRUPPEN[i].liste.forEach(function (e) {
        var b = el('button', { type: 'button', class: 'kv-chat-emoji', text: e, 'aria-label': e });
        b.addEventListener('click', function () { emojiEinfuegen(e); });
        raster.appendChild(b);
      });
    }
    EMOJI_GRUPPEN.forEach(function (g, i) {
      var t = el('button', { type: 'button', class: 'kv-chat-emoji-tab', text: g.symbol, 'aria-label': g.name });
      t.addEventListener('click', function () { zeige(i); });
      tabs.push(t);
      leiste.appendChild(t);
    });
    box.appendChild(leiste);
    box.appendChild(raster);
    zeige(0);
    return box;
  }

  function emojiUmschalten(offen) {
    zustand.emojiOffen = typeof offen === 'boolean' ? offen : !zustand.emojiOffen;
    if (zustand.emojiOffen) {
      // direkt über dem Fuß des Fensters, nie höher als das Fenster selbst
      var unten = Math.max(0, fenster.clientHeight - fuss.offsetTop) + 6;
      emojiBox.style.bottom = unten + 'px';
      emojiBox.style.maxHeight = Math.max(120, fenster.clientHeight - unten - 70) + 'px';
    }
    emojiBox.hidden = !zustand.emojiOffen;
    emojiKnopf.setAttribute('aria-expanded', zustand.emojiOffen ? 'true' : 'false');
  }

  /** Emoji an der Schreibmarke einfügen; die Auswahl bleibt offen, damit man mehrere setzen kann. */
  function emojiEinfuegen(e) {
    var a = feldText.selectionStart, b = feldText.selectionEnd;
    if (typeof a !== 'number') { a = b = feldText.value.length; }
    feldText.value = feldText.value.slice(0, a) + e + feldText.value.slice(b);
    var pos = a + e.length;
    feldText.focus();
    try { feldText.setSelectionRange(pos, pos); } catch (x) { /* egal */ }
    pruefen();
  }

  // --- Bilder -----------------------------------------------------------------
  function bildVerwerfen() {
    if (zustand.bild && zustand.bild.url) { try { URL.revokeObjectURL(zustand.bild.url); } catch (e) { /* egal */ } }
    zustand.bild = null;
    zustand.bildBereit = false;
    zustand.versuchBild = null;
    if (bildBox) bildZeigen();
  }

  /** Bild lesen und als JPEG neu zeichnen: kleiner, ohne Aufnahmeort (EXIF) und nie ein Skript. */
  function bildAufbereiten(datei) {
    return new Promise(function (ok, fehl) {
      var url = URL.createObjectURL(datei);
      var img = new Image();
      img.onload = function () {
        try {
          var b = img.naturalWidth, h = img.naturalHeight;
          if (!b || !h) throw new Error('leer');
          var f = Math.min(1, BILD_KANTE / Math.max(b, h));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(b * f)); c.height = Math.max(1, Math.round(h * f));
          var g = c.getContext('2d');
          g.fillStyle = '#ffffff'; // durchsichtige Stellen (PNG) werden weiß, nicht schwarz
          g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (blob) {
            URL.revokeObjectURL(url);
            if (blob) ok(blob); else fehl(new Error('kein Bild'));
          }, 'image/jpeg', BILD_QUALITAET);
        } catch (e) { URL.revokeObjectURL(url); fehl(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); fehl(new Error('nicht lesbar')); };
      img.src = url;
    });
  }

  function bildWaehlen(datei) {
    zeigeMeldung('');
    bildVerwerfen();
    dateiVerwerfen();
    videoVerwerfen();
    spracheVerwerfen();
    zustand.antwortAuf = null; zitatZeigen(); // Zitat und Bild schliessen sich aus: die letzte Wahl gilt
    zustand.bild = { blob: null, url: null };
    var diese = zustand.bild;
    bildZeigen();
    bildAufbereiten(datei).then(function (blob) {
      if (zustand.bild !== diese) return; // inzwischen entfernt oder ersetzt
      diese.blob = blob;
      diese.url = URL.createObjectURL(blob);
      zustand.bildBereit = true;
      bildZeigen();
      pruefen();
      feldText.focus();
    }).catch(function () {
      if (zustand.bild !== diese) return;
      bildVerwerfen();
      zeigeMeldung(T.bildNichtLesbar);
      pruefen();
    });
  }

  function bildZeigen() {
    if (!bildBox) return;
    bildBox.textContent = '';
    var b = zustand.bild;
    bildBox.hidden = !b;
    if (!b) return;
    if (!zustand.bildBereit) { bildBox.appendChild(el('span', { class: 'kv-chat-zitat-text', role: 'status', text: T.bildLesen })); return; }
    var weg = wegKnopf(T.bildWeg);
    weg.addEventListener('click', function () { bildVerwerfen(); pruefen(); feldText.focus(); });
    bildBox.appendChild(el('img', { class: 'kv-chat-bildvorschau', src: b.url, alt: T.bildVorschau }));
    bildBox.appendChild(el('span', { class: 'kv-chat-zitat-text', text: T.bildBereit }));
    bildBox.appendChild(weg);
  }

  // --- PDF-Dateien ------------------------------------------------------------
  function dateiVerwerfen() {
    zustand.datei = null;
    zustand.versuchDatei = null;
    if (dateiBox) dateiZeigen();
  }

  /** Größe für die Anzeige, z. B. „1,2 MB“. */
  function groesseText(b) {
    b = Number(b) || 0;
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (Math.round(b / (1024 * 1024) * 10) / 10).toString().replace('.', ',') + ' MB';
  }

  /** PDF wählen: Größe und Dateikopf (%PDF-) prüfen; der Server prüft noch einmal. */
  function dateiWaehlen(datei) {
    zeigeMeldung('');
    if (datei.size > DATEI_MAX_BYTES) { zeigeMeldung(T.dateiZuGross); return; }
    if (datei.size < 8) { zeigeMeldung(T.dateiNichtLesbar); return; }
    var leser = new FileReader();
    leser.onload = function () {
      var b = new Uint8Array(leser.result);
      var ok = b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
      if (!ok) { zeigeMeldung(T.dateiNichtLesbar); return; }
      bildVerwerfen();
      spracheVerwerfen();
      dateiVerwerfen();
      videoVerwerfen();
      zustand.antwortAuf = null; zitatZeigen(); // Zitat und Datei schliessen sich aus: die letzte Wahl gilt
      zustand.datei = { blob: datei, name: String(datei.name || 'Dokument.pdf').split(/[\\/]/).pop().slice(0, 120) };
      dateiZeigen();
      pruefen();
      feldText.focus();
    };
    leser.onerror = function () { zeigeMeldung(T.dateiNichtLesbar); };
    leser.readAsArrayBuffer(datei.slice(0, 8));
  }

  function dateiZeigen() {
    if (!dateiBox) return;
    dateiBox.textContent = '';
    var d = zustand.datei;
    dateiBox.hidden = !d;
    if (!d) return;
    var weg = wegKnopf(T.dateiWeg);
    weg.addEventListener('click', function () { dateiVerwerfen(); pruefen(); feldText.focus(); });
    dateiBox.appendChild(el('span', { class: 'kv-chat-dateisymbol' }, [symbol('datei')]));
    dateiBox.appendChild(el('span', { class: 'kv-chat-zitat-text', text: d.name + ' (' + groesseText(d.blob.size) + ') – ' + T.dateiBereit }));
    dateiBox.appendChild(weg);
  }

  /** PDF an die Datei-Funktion; dieselbe Anfrage-ID bei Wiederholung. */
  function sendeDatei() {
    var d = zustand.datei;
    if (!d || zustand.sendet || !zustand.token) return;
    if (!zustand.versuchDatei || zustand.versuchDatei.blob !== d.blob) zustand.versuchDatei = { id: neueId(), blob: d.blob };
    var f = new FormData();
    f.append('token', zustand.token);
    f.append('request_id', zustand.versuchDatei.id);
    f.append('name', d.name);
    f.append('datei', d.blob, 'dokument.pdf');
    f.append('hp', honigtopf ? honigtopf.value : '');
    zustand.sendet = true;
    zeigeMeldung('');
    pruefen();
    mitLimit(API_DATEI, { method: 'POST', body: f, credentials: 'omit', referrerPolicy: 'no-referrer' }, 60000).then(function (r) {
      zustand.sendet = false;
      if (r.status === 200) {
        dateiVerwerfen();
        pruefen();
        lesen().then(takt);
        return;
      }
      if (r.status === 404) {
        // Nur wenn die Sitzung wirklich unbekannt ist, wird sie vergessen (nicht bei einer noch fehlenden Funktion).
        r.json().catch(function () { return null; }).then(function (d) {
          if (d && d.fehler === 'sitzung_unbekannt') { vergessen(); zeigeMeldung(T.fehlerNetz); fussAufbauen(); verlaufZeichnen(); punktSetzen(); return; }
          zeigeMeldung(T.fehlerNetz);
          pruefen();
        });
        return;
      }
      zeigeMeldung(r.status === 429 ? T.fehlerDateiZuViele : (r.status === 413 || r.status === 415 || r.status === 400) ? T.fehlerDateiFormat : T.fehlerNetz);
      pruefen();
    }).catch(function () {
      zustand.sendet = false;
      zeigeMeldung(T.fehlerNetz);
      pruefen();
    });
  }

  // --- Videos -------------------------------------------------------------------
  function videoVerwerfen() {
    zustand.video = null;
    zustand.versuchVideo = null;
    if (videoBox) videoZeigen();
  }

  /** MP4 und MOV beginnen mit einem Kasten „ftyp“ an Stelle 4; der Server prüft genauer (Marke). */
  function istVideoKopf(b) {
    return b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
  }

  /** Video wählen: Größe und Dateikopf prüfen; der Server prüft noch einmal. */
  function videoWaehlen(datei) {
    zeigeMeldung('');
    if (datei.size > VIDEO_MAX_BYTES) { zeigeMeldung(T.videoZuGross); return; }
    if (datei.size < 12) { zeigeMeldung(T.videoNichtLesbar); return; }
    var leser = new FileReader();
    leser.onload = function () {
      if (!istVideoKopf(new Uint8Array(leser.result))) { zeigeMeldung(T.videoNichtLesbar); return; }
      bildVerwerfen();
      spracheVerwerfen();
      dateiVerwerfen();
      videoVerwerfen();
      zustand.antwortAuf = null; zitatZeigen(); // Zitat und Video schliessen sich aus: die letzte Wahl gilt
      zustand.video = { blob: datei, name: String(datei.name || 'Video').split(/[\\/]/).pop().slice(0, 120) };
      videoZeigen();
      pruefen();
      feldText.focus();
    };
    leser.onerror = function () { zeigeMeldung(T.videoNichtLesbar); };
    leser.readAsArrayBuffer(datei.slice(0, 12));
  }

  function videoZeigen() {
    if (!videoBox) return;
    videoBox.textContent = '';
    var v = zustand.video;
    videoBox.hidden = !v;
    if (!v) return;
    var weg = wegKnopf(T.videoWeg);
    weg.disabled = !!zustand.sendet;
    weg.addEventListener('click', function () { videoVerwerfen(); pruefen(); feldText.focus(); });
    var stand = zustand.sendet
      ? T.videoLaedt + (typeof zustand.videoProzent === 'number' ? ' ' + zustand.videoProzent + ' %' : '')
      : T.videoBereit;
    videoBox.appendChild(el('span', { class: 'kv-chat-dateisymbol' }, [symbol('film')]));
    videoBox.appendChild(el('span', { class: 'kv-chat-zitat-text', role: 'status', text: v.name + ' (' + groesseText(v.blob.size) + ') – ' + stand }));
    videoBox.appendChild(weg);
  }

  /** JSON an die Video-Funktion; liefert { status, daten }. */
  function videoAufruf(body) {
    return mitLimit(API_VIDEO, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }, 20000).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) { return { status: r.status, daten: d }; });
    });
  }

  /** Datei direkt in den privaten Speicher laden (Link der Video-Funktion, ohne Überschreiben) und den Fortschritt melden. */
  function videoHochladen(link, blob, fortschritt) {
    return new Promise(function (ok, fehl) {
      var x = new XMLHttpRequest();
      x.open('PUT', link);
      x.timeout = 15 * 60 * 1000; // langsames Handynetz: 25 MB dürfen dauern
      x.setRequestHeader('content-type', 'video/mp4');
      x.setRequestHeader('x-upsert', 'false');
      if (x.upload) {
        x.upload.onprogress = function (e) {
          if (e.lengthComputable && e.total > 0) fortschritt(Math.min(99, Math.floor(e.loaded / e.total * 100)));
        };
      }
      // Jede Antwort des Speichers geht zum Abschluss: Ob die Datei da ist und passt, prüft der Server.
      x.onload = function () { ok(x.status); };
      x.onerror = function () { fehl(new Error('netz')); };
      x.ontimeout = function () { fehl(new Error('zeit')); };
      x.send(blob);
    });
  }

  /** Video senden: reservieren, direkt hochladen, abschließen; dieselbe Anfrage-ID bei Wiederholung. */
  function sendeVideo() {
    var v = zustand.video;
    if (!v || zustand.sendet || !zustand.token) return;
    if (!zustand.versuchVideo || zustand.versuchVideo.blob !== v.blob) zustand.versuchVideo = { id: neueId(), blob: v.blob };
    var versuch = zustand.versuchVideo;
    var token = zustand.token;
    zustand.sendet = true;
    zustand.videoProzent = null;
    zeigeMeldung('');
    videoZeigen();
    pruefen();
    function ende(text) {
      zustand.sendet = false;
      zustand.videoProzent = null;
      zeigeMeldung(text);
      videoZeigen();
      pruefen();
    }
    function fehler(r) {
      if (r.status === 404 && r.daten && r.daten.fehler === 'sitzung_unbekannt') {
        zustand.sendet = false;
        zustand.videoProzent = null;
        vergessen(); zeigeMeldung(T.fehlerNetz); fussAufbauen(); verlaufZeichnen(); punktSetzen();
        return;
      }
      // Verworfen oder abgelaufen: ein neuer Versuch braucht eine neue Anfrage-ID.
      if (r.status === 410 || r.status === 413 || r.status === 415) zustand.versuchVideo = null;
      ende(r.status === 429 ? T.fehlerVideoZuViele : (r.status === 413 || r.status === 415 || r.status === 400) ? T.fehlerVideoFormat : T.fehlerNetz);
    }
    function geschafft() {
      zustand.sendet = false;
      zustand.videoProzent = null;
      if (zustand.video && zustand.video.blob === versuch.blob) videoVerwerfen(); else videoZeigen();
      pruefen();
      lesen().then(takt);
    }
    videoAufruf({ aktion: 'start', token: token, request_id: versuch.id, groesse: v.blob.size, hp: honigtopf ? honigtopf.value : '' }).then(function (r) {
      if (r.status !== 200 || !r.daten) { fehler(r); return; }
      if (r.daten.zustand === 'gesendet') { geschafft(); return; }
      var link = r.daten.upload;
      if (r.daten.zustand !== 'hochladen' || typeof link !== 'string' || link.indexOf(SPEICHER_UPLOAD) !== 0) { ende(T.fehlerNetz); return; }
      var hochgeladen = 0;
      return videoHochladen(link, v.blob, function (prozent) { zustand.videoProzent = prozent; videoZeigen(); }).then(function (status) {
        hochgeladen = status;
        zustand.videoProzent = 100;
        videoZeigen();
        // Auch bei einer Absage des Speichers abschließen: Bei einer Wiederholung liegt die Datei schon dort.
        return videoAufruf({ aktion: 'fertig', token: token, request_id: versuch.id });
      }).then(function (f) {
        if (f.status === 200) { geschafft(); return; }
        if (f.status === 409 && hochgeladen >= 400) {
          // Der Speicher hat die Datei abgelehnt: mit derselben Anfrage klappt es nicht besser.
          zustand.versuchVideo = null;
          ende(T.videoNichtHochgeladen);
          return;
        }
        fehler(f);
      });
    }).catch(function () { ende(T.fehlerNetz); });
  }

  /** Stabile Adresse je Nachricht: die Antwort der Funktion bringt bei jeder Abfrage eine neue. */
  function bildAdresseMerken(n) {
    // Profilbild: je Person eine stabile Adresse, sonst lädt das Bild bei jeder Abfrage neu.
    if (n.absender && n.absender.art === 'team') {
      var key = istProfilbild(n.absender.bild) ? 'ava:' + n.absender.bild.split('?')[0] : '';
      var altA = key ? zustand.bildUrls[key] : null;
      var jetztA = Date.now();
      if (!key) n.absender.bild = null; // Bild verborgen oder fremde Adresse: sofort weg
      else if (altA && jetztA - altA.seit < BILD_URL_MS) n.absender.bild = altA.url;
      else zustand.bildUrls[key] = { url: n.absender.bild, seit: jetztA };
    }
    var m = n.bild || n.audio || n.datei || n.video;
    if (!m) return;
    var alt = zustand.bildUrls[n.id];
    var jetzt = Date.now();
    if (alt && jetzt - alt.seit < BILD_URL_MS) { m.url = alt.url; return; }
    if (typeof m.url === 'string' && /^https:\/\//.test(m.url)) zustand.bildUrls[n.id] = { url: m.url, seit: jetzt };
    else m.url = null;
  }

  /** Text, der beim Zitieren oder in der Vorschau für eine Nachricht steht. */
  function textVon(n) {
    return typeof n.text === 'string' && n.text ? n.text : (n.bild ? T.fotoZitat : (n.audio ? T.sprachZitat : (n.datei ? T.dateiZitat + n.datei.name : (n.video ? T.videoZitat : ''))));
  }

  /** Leiste über dem Feld: auf welche Nachricht die nächste antwortet. */
  function zitatZeigen() {
    if (!zitatBox) return;
    zitatBox.textContent = '';
    var z = zustand.antwortAuf;
    zitatBox.hidden = !z;
    if (!z) return;
    var weg = wegKnopf(T.zitatWeg);
    weg.addEventListener('click', function () { zustand.antwortAuf = null; zitatZeigen(); feldText.focus(); });
    zitatBox.appendChild(el('div', { class: 'kv-chat-zitat-inhalt' }, [
      el('span', { class: 'kv-chat-zitat-von', text: T.antwortAuf + ' ' + (z.von_team ? T.wir : T.du) }),
      el('span', { class: 'kv-chat-zitat-text', text: kurz(z.text) })
    ]));
    zitatBox.appendChild(weg);
  }

  function kurz(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    return t.length > 80 ? t.slice(0, 80) + '…' : t;
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
    var s = el('button', { type: 'button', class: 'kv-chat-pille', text: T.kontaktSpeichern });
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
    hoeheAnpassen();
    var text = feldText.value.trim();
    var zuLang = feldText.value.length > MAX_ZEICHEN;
    zaehler.hidden = !zuLang;
    zaehler.textContent = zuLang ? T.zeichenUeber : '';
    var hatBild = !!(zustand.token && zustand.bild && zustand.bildBereit);
    var hatDatei = !!(zustand.token && zustand.datei);
    var hatVideo = !!(zustand.token && zustand.video);
    var ok = (text !== '' || hatBild || hatDatei || hatVideo) && !zuLang && !zustand.sendet && (zustand.token || (haken && haken.checked));
    sendeKnopf.disabled = !ok;
    sendeKnopf.setAttribute('aria-label', zustand.sendet ? T.sendet : T.senden);
    sendeKnopf.classList.toggle('sendet', !!zustand.sendet);
    if (mikroKnopf) mikroKnopf.disabled = !zustand.token || !!zustand.sprache || zustand.sendet;
    // Leeres Feld mit Sitzung: Mikrofon statt Senden (wie im Entwurf). Ohne Mikrofon bleibt Senden.
    var mikroStatt = !!(mikroKnopf && zustand.token && text === '' && !hatBild && !hatDatei && !hatVideo && !zustand.sendet && !zustand.sprache && !zustand.bild);
    if (mikroKnopf) mikroKnopf.hidden = !mikroStatt;
    sendeKnopf.hidden = mikroStatt || !!(zustand.sprache && !zustand.sendet);
    if (bildKnopf) bildKnopf.disabled = !zustand.token || zustand.sendet;
  }

  function uhrzeit(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  /** Läuft im Verlauf gerade ein Video oder eine Sprachnachricht? Dann nicht neu zeichnen (sonst bricht es ab). */
  function spieltGerade() {
    var l = verlauf.querySelectorAll('video, audio');
    for (var i = 0; i < l.length; i++) { if (!l[i].paused && !l[i].ended) return true; }
    return false;
  }
  function nachDemAbspielen() {
    if (zustand.spaeterZeichnen && !spieltGerade()) { zustand.spaeterZeichnen = false; verlaufZeichnen(); }
  }

  function verlaufZeichnen() {
    var amEnde = bereich.scrollHeight - bereich.scrollTop - bereich.clientHeight < 60;
    var oben = bereich.scrollTop;
    verlauf.textContent = '';
    verlauf.appendChild(el('div', { class: 'kv-chat-eintrag wir' }, [
      kZeichen('kv-chat-ava'),
      el('div', { class: 'kv-chat-blase wir' }, [el('p', { text: T.begruessung })])
    ]));
    zustand.nachrichten.forEach(function (n) { verlauf.appendChild(eintrag(n)); });
    bereich.scrollTop = amEnde || !zustand.offen ? bereich.scrollHeight : oben;
  }

  function eintrag(n) {
    var seite = n.von_team ? 'wir' : 'du';
    var blase = el('div', { class: 'kv-chat-blase ' + seite });
    if (n.antwort) {
      blase.appendChild(el('div', { class: 'kv-chat-zitat' }, [
        el('span', { class: 'kv-chat-zitat-von', text: n.antwort.von_team ? T.wir : T.du }),
        el('span', { class: 'kv-chat-zitat-text', text: kurz(n.antwort.text) })
      ]));
    }
    if (n.bild) {
      if (n.bild.url) {
        var bild = el('img', { class: 'kv-chat-bild', src: n.bild.url, alt: T.bildGross, loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
        // Bild lädt nach: war man unten, unten bleiben (sonst steht die neueste Nachricht außer Sicht).
        bild.addEventListener('load', function () {
          if (bereich.scrollHeight - bereich.scrollTop - bereich.clientHeight < bild.clientHeight + 80) bereich.scrollTop = bereich.scrollHeight;
        });
        blase.appendChild(el('a', { class: 'kv-chat-bildlink', href: n.bild.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.bildGross }, [bild]));
      } else {
        blase.appendChild(el('p', { class: 'kv-chat-bild-fehlt', text: T.bildNichtDa }));
      }
    }
    if (n.audio) {
      if (n.audio.url) {
        var sek = Number(n.audio.dauer) || 0;
        var spieler = el('audio', { class: 'kv-chat-audio', src: n.audio.url, controls: '', preload: 'none', 'aria-label': T.sprachPlayer + (sek ? ' (' + zeitText(sek) + ')' : '') });
        // Abgelaufener Link (Tab lange offen): einmal neue Adresse holen.
        spieler.addEventListener('error', function () {
          if (zustand.audioNeu[n.id]) return;
          zustand.audioNeu[n.id] = true;
          delete zustand.bildUrls[n.id];
          lesen();
        });
        spieler.addEventListener('pause', nachDemAbspielen);
        spieler.addEventListener('ended', nachDemAbspielen);
        blase.appendChild(spieler);
      } else {
        blase.appendChild(el('p', { class: 'kv-chat-bild-fehlt', text: T.sprachNichtDa }));
      }
    }
    if (n.datei) {
      if (n.datei.url) {
        var dname = typeof n.datei.name === 'string' && n.datei.name ? n.datei.name : 'Dokument.pdf';
        blase.appendChild(el('a', { class: 'kv-chat-datei', href: n.datei.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': T.dateiOeffnen + dname }, [
          el('span', { class: 'kv-chat-dateisymbol' }, [symbol('datei')]),
          el('span', { class: 'kv-chat-dateiname', text: dname }),
          el('span', { class: 'kv-chat-dateigroesse', text: groesseText(n.datei.groesse) })
        ]));
      } else {
        blase.appendChild(el('p', { class: 'kv-chat-bild-fehlt', text: T.dateiNichtDa }));
      }
    }
    if (n.video) {
      if (n.video.url) {
        var film = el('video', { class: 'kv-chat-video', src: n.video.url, controls: '', preload: 'metadata', playsinline: '', 'aria-label': T.videoPlayer + (n.video.groesse ? ' (' + groesseText(n.video.groesse) + ')' : '') });
        // Abgelaufener Link (Tab lange offen): einmal neue Adresse holen. Scheitert es dann noch
        // (Format, das dieser Browser nicht kann, z. B. HEVC), Hinweis mit Link statt schwarzem Kasten.
        film.addEventListener('error', function () {
          if (!zustand.audioNeu[n.id]) {
            zustand.audioNeu[n.id] = true;
            delete zustand.bildUrls[n.id];
            lesen();
            return;
          }
          if (!film.parentNode) return;
          film.parentNode.replaceChild(el('p', { class: 'kv-chat-bild-fehlt' }, [
            document.createTextNode(T.videoNichtAbspielbar + ' '),
            el('a', { href: n.video.url, target: '_blank', rel: 'noopener noreferrer', text: T.videoHerunterladen })
          ]), film);
        });
        film.addEventListener('pause', nachDemAbspielen);
        film.addEventListener('ended', nachDemAbspielen);
        blase.appendChild(film);
      } else {
        blase.appendChild(el('p', { class: 'kv-chat-bild-fehlt', text: T.videoNichtDa }));
      }
    }
    if (typeof n.text === 'string' && n.text !== '') blase.appendChild(el('p', { text: n.text }));
    if (n.von_team && n.link && typeof n.link.text === 'string' && typeof n.link.url === 'string' && /^https?:\/\/[^\s]+$/i.test(n.link.url)) {
      blase.appendChild(el('a', { class: 'kv-chat-linkknopf', href: n.link.url, target: '_blank', rel: 'noopener noreferrer', text: n.link.text }));
    }
    blase.appendChild(el('span', { class: 'kv-chat-zeit', text: (n.von_team ? (absenderName(n) || T.wir) : T.du) + ' · ' + uhrzeit(n.gesendet) }));

    var teile = [blase];
    if (n.von_team) {
      var wer = absenderName(n);
      if (wer) teile.unshift(el('span', { class: 'kv-chat-wer', 'aria-hidden': 'true', text: wer }));
      teile.unshift(absenderBild(n));
    }
    var chips = [];
    if (n.reaktion_team) chips.push(el('span', { class: 'kv-chat-chip team', title: T.teamReaktion, 'aria-label': T.teamReaktion + ': ' + n.reaktion_team, text: n.reaktion_team }));
    if (n.reaktion_ich) {
      var mein = el('button', { type: 'button', class: 'kv-chat-chip ich', title: T.deineReaktion, 'aria-label': T.deineReaktion + ': ' + n.reaktion_ich, text: n.reaktion_ich });
      mein.addEventListener('click', function (ev) { ev.stopPropagation(); reagiere(n, n.reaktion_ich); });
      chips.push(mein);
    }
    if (chips.length) teile.push(el('div', { class: 'kv-chat-chips' }, chips));

    // Knöpfe und Liste einer Antwort von Lina: nur an der neuesten Nachricht tippbar (wie bei
    // WhatsApp schickt ein Tipp die Beschriftung als normale Nachricht).
    var neueste = zustand.nachrichten[zustand.nachrichten.length - 1] === n;
    if (n.von_team && neueste && zustand.token) {
      var beschriftungen = Array.isArray(n.knoepfe) ? n.knoepfe.filter(function (t) { return typeof t === 'string' && t !== ''; }).slice(0, 3) : [];
      if (beschriftungen.length) {
        teile.push(el('div', { class: 'kv-chat-knoepfe', role: 'group', 'aria-label': T.antwortWaehlen }, beschriftungen.map(function (t) {
          var b = el('button', { type: 'button', class: 'kv-chat-antwortknopf', text: t });
          b.addEventListener('click', function (ev) { ev.stopPropagation(); knopfSenden(t); });
          return b;
        })));
      }
      var eintraege = n.liste && typeof n.liste.knopf === 'string' && Array.isArray(n.liste.eintraege)
        ? n.liste.eintraege.filter(function (e) { return e && typeof e.titel === 'string' && e.titel !== ''; }).slice(0, 10)
        : [];
      if (eintraege.length) {
        var listeOffen = zustand.listeOffen === n.id;
        var lk = el('button', { type: 'button', class: 'kv-chat-listenknopf', 'aria-expanded': listeOffen ? 'true' : 'false', text: n.liste.knopf });
        lk.addEventListener('click', function (ev) { ev.stopPropagation(); zustand.listeOffen = listeOffen ? null : n.id; verlaufZeichnen(); });
        teile.push(lk);
        if (listeOffen) {
          teile.push(el('div', { class: 'kv-chat-liste', role: 'group', 'aria-label': n.liste.knopf }, eintraege.map(function (e) {
            var b = el('button', { type: 'button', class: 'kv-chat-listeneintrag' }, [
              el('span', { class: 'kv-chat-listentitel', text: e.titel }),
              typeof e.beschreibung === 'string' && e.beschreibung ? el('span', { class: 'kv-chat-listenbeschreibung', text: e.beschreibung }) : null
            ]);
            b.addEventListener('click', function (ev) { ev.stopPropagation(); zustand.listeOffen = null; knopfSenden(e.titel); });
            return b;
          })));
        }
      }
    }

    if (zustand.token) {
      var aktionen = el('div', { class: 'kv-chat-aktionen' });
      var r = el('button', { type: 'button', class: 'kv-chat-aktion', 'data-fokus': n.id, 'aria-label': T.reagieren, 'aria-expanded': zustand.waehlen === n.id ? 'true' : 'false' }, [symbol('smiley', 18)]);
      r.addEventListener('click', function (ev) { ev.stopPropagation(); zustand.waehlen = zustand.waehlen === n.id ? null : n.id; zustand.aktiv = n.id; verlaufZeichnen(); fokusAuf(n.id); });
      var a = el('button', { type: 'button', class: 'kv-chat-aktion', 'aria-label': T.antworten }, [symbol('antworten', 18)]);
      a.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (zustand.sendet) return; // erst fertig senden
        if (zustand.bild) bildVerwerfen(); // Zitat und Bild schliessen sich aus: die letzte Wahl gilt
        dateiVerwerfen();
        videoVerwerfen();
        spracheVerwerfen(); // Sprachnachrichten können nichts zitieren
        zustand.antwortAuf = { id: n.id, text: textVon(n), von_team: !!n.von_team };
        zustand.waehlen = null; zustand.aktiv = null;
        zitatZeigen(); verlaufZeichnen();
        feldText.focus();
      });
      aktionen.appendChild(r);
      aktionen.appendChild(a);
      teile.push(aktionen);
      if (zustand.waehlen === n.id) {
        var wahl = el('div', { class: 'kv-chat-wahl', role: 'group', 'aria-label': T.reagieren });
        REAKTIONEN.forEach(function (e) {
          var b = el('button', { type: 'button', class: 'kv-chat-wahl-emoji' + (n.reaktion_ich === e ? ' an' : ''), 'aria-label': e, 'aria-pressed': n.reaktion_ich === e ? 'true' : 'false', text: e });
          b.addEventListener('click', function (ev) { ev.stopPropagation(); reagiere(n, e); });
          wahl.appendChild(b);
        });
        teile.push(wahl);
      }
    }
    var box = el('div', { class: 'kv-chat-eintrag ' + seite + (zustand.aktiv === n.id ? ' aktiv' : '') }, teile);
    // Tippen auf die Blase zeigt oder versteckt Reagieren/Antworten (am Handy gibt es kein Überfahren).
    box.addEventListener('click', function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest('a, audio, video')) return;
      var sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length > 0) return;
      zustand.aktiv = zustand.aktiv === n.id ? null : n.id;
      if (zustand.aktiv !== n.id) zustand.waehlen = null;
      verlaufZeichnen();
    });
    return box;
  }

  /** Nach dem Neuzeichnen den Fokus auf den Reagieren-Knopf der Nachricht zurückgeben (Tastatur). */
  function fokusAuf(id) {
    var b = verlauf.querySelector('[data-fokus="' + String(id).replace(/[^A-Za-z0-9-]/g, '') + '"]');
    if (b) b.focus();
  }

  /** Eigene Reaktion setzen; dasselbe Emoji noch einmal entfernt sie. */
  function reagiere(n, emoji) {
    var alt = n.reaktion_ich || null;
    var neu = alt === emoji ? '' : emoji;
    n.reaktion_ich = neu || null;
    zustand.reaktionWartet[n.id] = neu;
    zustand.waehlen = null;
    verlaufZeichnen();
    fokusAuf(n.id);
    zeigeMeldung('');
    function zurueck() {
      delete zustand.reaktionWartet[n.id];
      n.reaktion_ich = alt;
      verlaufZeichnen();
    }
    aufruf({ aktion: 'reagieren', token: zustand.token, message_id: n.id, emoji: neu }).then(function (r) {
      if (r.status === 200) { delete zustand.reaktionWartet[n.id]; return; }
      zurueck();
      if (r.status === 404 && r.daten && r.daten.fehler === 'sitzung_unbekannt') { vergessen(); fussAufbauen(); verlaufZeichnen(); return; }
      zeigeMeldung(r.status === 429 ? T.fehlerZuViele : T.fehlerReaktion);
    }).catch(function () { zurueck(); zeigeMeldung(T.fehlerReaktion); });
  }

  function teamZaehlen() {
    return zustand.nachrichten.filter(function (n) { return n.von_team; }).length;
  }
  function punktSetzen() {
    var neu = teamZaehlen() > zustand.gesehenTeam;
    punkt.hidden = !(neu && !zustand.offen);
  }

  function signatur(liste) {
    return JSON.stringify(liste.map(function (n) {
      return [n.id, n.reaktion_ich || '', n.reaktion_team || '', n.antwort ? n.antwort.id : '', n.bild ? (n.bild.url ? 2 : 1) : 0, n.audio ? (n.audio.url || 1) : 0, n.datei ? (n.datei.url || 1) : 0, n.video ? (n.video.url || 1) : 0, n.absender ? n.absender.art + (n.absender.bild ? 1 : 0) : '', Array.isArray(n.knoepfe) ? n.knoepfe.length : 0, n.liste ? 1 : 0, n.link ? 1 : 0];
    }));
  }

  // --- Abfragen -------------------------------------------------------------
  function lesen() {
    if (!zustand.token) return Promise.resolve();
    return aufruf({ aktion: 'lesen', token: zustand.token, still: !zustand.offen }).then(function (r) {
      if (r.status === 404) { vergessen(); fussAufbauen(); verlaufZeichnen(); punktSetzen(); return; }
      if (r.status !== 200 || !r.daten || !Array.isArray(r.daten.nachrichten)) return;
      var alt = signatur(zustand.nachrichten);
      zustand.nachrichten = r.daten.nachrichten.filter(function (n) { return n && (typeof n.text === 'string' || (n.bild && typeof n.bild === 'object') || (n.audio && typeof n.audio === 'object') || (n.datei && typeof n.datei === 'object') || (n.video && typeof n.video === 'object')); });
      zustand.nachrichten.forEach(bildAdresseMerken);
      // Eine Reaktion, die gerade gespeichert wird, nicht von einer älteren Antwort überschreiben lassen.
      zustand.nachrichten.forEach(function (n) {
        if (Object.prototype.hasOwnProperty.call(zustand.reaktionWartet, n.id)) n.reaktion_ich = zustand.reaktionWartet[n.id] || null;
      });
      if (signatur(zustand.nachrichten) !== alt) {
        if (spieltGerade()) zustand.spaeterZeichnen = true; else verlaufZeichnen();
      }
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
    hinweisWeg();
    punktSetzen();
    ansichtZeigen(zustand.ansicht, true);
    lesen().then(function () { bereich.scrollTop = bereich.scrollHeight; });
    takt();
    window.setTimeout(function () { if (zustand.ansicht === 'start') startLos.focus(); else feldText.focus(); }, 30);
  }
  function schliessen() {
    if (zustand.sprache && zustand.sprache.phase === 'nimmt') spracheVerwerfen(); // laufende Aufnahme endet mit dem Schließen
    zustand.offen = false;
    fenster.hidden = true;
    knopf.setAttribute('aria-expanded', 'false');
    knopf.setAttribute('aria-label', T.oeffnen);
    document.documentElement.classList.remove('kv-chat-offen');
    takt();
  }

  // --- Sprachnachrichten ----------------------------------------------------
  function spracheMoeglich() {
    return !!(window.MediaRecorder && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
  }

  function zeitText(sek) {
    sek = Math.max(0, Math.round(sek));
    return Math.floor(sek / 60) + ':' + ('0' + (sek % 60)).slice(-2);
  }

  function spracheMime() {
    var liste = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    for (var i = 0; i < liste.length; i++) {
      try { if (window.MediaRecorder.isTypeSupported(liste[i])) return liste[i]; } catch (e) { /* weiter */ }
    }
    return '';
  }

  function spracheEnde(s) {
    if (s.uhr) { window.clearInterval(s.uhr); s.uhr = null; }
    if (s.strom) { try { s.strom.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* egal */ } s.strom = null; }
  }

  /** Aufnahme oder fertige Aufnahme wegwerfen (Mikrofon wird immer freigegeben). */
  function spracheVerwerfen() {
    var s = zustand.sprache;
    zustand.sprache = null;
    zustand.versuchSprache = null;
    if (s) {
      s.verworfen = true;
      spracheEnde(s);
      try { if (s.rekorder && s.rekorder.state !== 'inactive') s.rekorder.stop(); } catch (e) { /* egal */ }
      if (s.url) { try { URL.revokeObjectURL(s.url); } catch (e) { /* egal */ } }
    }
    if (spracheBox) spracheZeigen();
    if (feldText) pruefen();
  }

  function spracheStarten() {
    if (zustand.sprache || !zustand.token || zustand.sendet) return;
    zeigeMeldung('');
    bildVerwerfen();
    dateiVerwerfen();
    videoVerwerfen();
    zustand.antwortAuf = null; zitatZeigen();
    var s = { phase: 'start', sek: 0, chunks: [], t0: 0 };
    zustand.sprache = s;
    spracheZeigen();
    pruefen();
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (strom) {
      if (zustand.sprache !== s) { try { strom.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* egal */ } return; }
      s.strom = strom;
      var mime = spracheMime();
      var opt = { audioBitsPerSecond: SPRACHE_BITRATE };
      if (mime) opt.mimeType = mime;
      var rek;
      try { rek = new window.MediaRecorder(strom, opt); } catch (e) { rek = new window.MediaRecorder(strom); }
      s.rekorder = rek;
      rek.addEventListener('dataavailable', function (ev) {
        if (!ev.data || ev.data.size < 1) return;
        s.chunks.push(ev.data);
        s.bytes = (s.bytes || 0) + ev.data.size;
        // Zeit und Größe zusätzlich hier prüfen: Zeitgeber ruhender Tabs werden vom Browser gedrosselt.
        if (s.phase === 'nimmt' && (s.bytes > SPRACHE_STOPP_BYTES || (Date.now() - s.t0) / 1000 >= SPRACHE_MAX_SEK)) spracheStoppen();
      });
      rek.addEventListener('error', function () {
        if (zustand.sprache !== s) return;
        spracheVerwerfen(); zeigeMeldung(T.sprachFehler);
      });
      rek.addEventListener('stop', function () { spracheFertig(s, rek.mimeType || mime); });
      s.phase = 'nimmt';
      s.t0 = Date.now();
      rek.start(1000);
      s.uhr = window.setInterval(function () {
        s.sek = (Date.now() - s.t0) / 1000;
        if (s.sek >= SPRACHE_MAX_SEK) { spracheStoppen(); return; }
        spracheZeigen();
      }, 250);
      spracheZeigen();
    }).catch(function (e) {
      if (zustand.sprache !== s) return;
      spracheVerwerfen();
      zeigeMeldung(e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') ? T.sprachKeinMikro : T.sprachNeinMikro);
    });
  }

  function spracheStoppen() {
    var s = zustand.sprache;
    if (!s || s.phase !== 'nimmt') return;
    s.sek = Math.min(SPRACHE_MAX_SEK, (Date.now() - s.t0) / 1000);
    s.phase = 'fertigt';
    if (s.uhr) { window.clearInterval(s.uhr); s.uhr = null; }
    try { s.rekorder.stop(); } catch (e) { spracheVerwerfen(); zeigeMeldung(T.sprachFehler); return; }
    spracheZeigen();
  }

  function spracheFertig(s, mime) {
    spracheEnde(s); // Mikrofon erst nach dem Ende der Aufnahme freigeben
    if (zustand.sprache !== s || s.verworfen) return;
    var typ = String(mime || '').split(';')[0] || 'audio/webm';
    var blob = new Blob(s.chunks, { type: typ });
    s.chunks = [];
    var sek = Math.round(s.sek);
    if (sek < 1) { spracheVerwerfen(); zeigeMeldung(T.sprachZuKurz); return; }
    if (blob.size < 1 || blob.size > SPRACHE_MAX_BYTES) { spracheVerwerfen(); zeigeMeldung(blob.size < 1 ? T.sprachFehler : T.fehlerSpracheFormat); return; }
    s.blob = blob;
    s.dauer = Math.min(SPRACHE_MAX_SEK, sek);
    s.url = URL.createObjectURL(blob);
    s.phase = 'bereit';
    spracheZeigen();
    pruefen();
  }

  function spracheZeigen() {
    if (!spracheBox) return;
    spracheBox.textContent = '';
    var s = zustand.sprache;
    spracheBox.hidden = !s;
    if (!s) return;
    var weg = wegKnopf(T.sprachAbbrechen);
    weg.addEventListener('click', function () { spracheVerwerfen(); if (feldText) feldText.focus(); });
    if (s.phase === 'bereit') {
      spracheBox.appendChild(el('audio', { class: 'kv-chat-audio kv-chat-audio-vorschau', src: s.url, controls: '', preload: 'metadata', 'aria-label': T.sprachVorschau }));
      var senden = el('button', { type: 'button', class: 'kv-chat-pille kv-chat-sprache-senden', text: T.sprachSenden });
      senden.disabled = !!zustand.sendet;
      if (zustand.sendet) senden.textContent = T.sendet;
      senden.addEventListener('click', sendeSprache);
      spracheBox.appendChild(senden);
      spracheBox.appendChild(weg);
      return;
    }
    spracheBox.appendChild(el('span', { class: 'kv-chat-aufnahme-punkt', 'aria-hidden': 'true' }));
    spracheBox.appendChild(el('span', { class: 'kv-chat-zitat-text kv-chat-aufnahme-zeit', role: 'status', text: (s.phase === 'nimmt' ? T.sprachNimmtAuf + ' ' : '') + zeitText(s.sek) + ' / ' + zeitText(SPRACHE_MAX_SEK) }));
    if (s.phase === 'nimmt') {
      var stopp = el('button', { type: 'button', class: 'kv-chat-sprache-stopp', 'aria-label': T.sprachStopp, title: T.sprachStopp }, [symbol('stopp', 16)]);
      stopp.addEventListener('click', spracheStoppen);
      spracheBox.appendChild(stopp);
    }
    spracheBox.appendChild(weg);
  }

  /** Aufnahme an die Sprach-Funktion; dieselbe Anfrage-ID bei Wiederholung. */
  function sendeSprache() {
    var s = zustand.sprache;
    if (!s || s.phase !== 'bereit' || zustand.sendet || !zustand.token) return;
    if (!zustand.versuchSprache || zustand.versuchSprache.blob !== s.blob) zustand.versuchSprache = { id: neueId(), blob: s.blob };
    var endung = /ogg/.test(s.blob.type) ? 'ogg' : /mp4/.test(s.blob.type) ? 'm4a' : 'webm';
    var f = new FormData();
    f.append('token', zustand.token);
    f.append('request_id', zustand.versuchSprache.id);
    f.append('dauer', String(s.dauer));
    f.append('datei', s.blob, 'sprache.' + endung);
    f.append('hp', honigtopf ? honigtopf.value : '');
    zustand.sendet = true;
    zeigeMeldung('');
    spracheZeigen();
    pruefen();
    mitLimit(API_SPRACHE, { method: 'POST', body: f, credentials: 'omit', referrerPolicy: 'no-referrer' }, 60000).then(function (r) {
      zustand.sendet = false;
      if (r.status === 200) {
        spracheVerwerfen();
        pruefen();
        lesen().then(takt);
        return;
      }
      if (r.status === 404) { vergessen(); zeigeMeldung(T.fehlerNetz); fussAufbauen(); verlaufZeichnen(); punktSetzen(); return; }
      zeigeMeldung(r.status === 429 ? T.fehlerSpracheZuViele : (r.status === 413 || r.status === 415 || r.status === 400) ? T.fehlerSpracheFormat : T.fehlerNetz);
      spracheZeigen();
      pruefen();
    }).catch(function () {
      zustand.sendet = false;
      zeigeMeldung(T.fehlerNetz);
      spracheZeigen();
      pruefen();
    });
  }

  // --- Senden ---------------------------------------------------------------
  function absenden() {
    if (sendeKnopf.disabled) return;
    var text = feldText.value.trim();
    if (zustand.token && zustand.datei) { sendeDatei(); return; }
    if (zustand.token && zustand.video) { sendeVideo(); return; }
    if (zustand.token && zustand.bild && zustand.bildBereit) { sendeBild(text); return; }
    if (!text) return;
    sende(text, false);
  }

  /** Knopf oder Listeneintrag getippt: die Beschriftung geht als Nachricht raus. Das Textfeld
   *  bleibt dabei unangetastet (auch was währenddessen getippt wird). */
  function knopfSenden(text) {
    if (zustand.sendet || !zustand.token) return;
    zustand.knopfRest = { zitat: zustand.antwortAuf };
    zustand.antwortAuf = null;
    sende(text, false);
  }

  /** Nach dem Senden per Knopf: ein vorher gewähltes Zitat kommt zurück. */
  function knopfRestHolen() {
    var r = zustand.knopfRest;
    if (!r) return;
    zustand.knopfRest = null;
    if (!zustand.antwortAuf) zustand.antwortAuf = r.zitat; // inzwischen neu gewählt: das gilt
    zitatZeigen();
  }

  /** Bild (mit Text als Unterschrift) an die Bild-Funktion; dieselbe Anfrage-ID bei Wiederholung. */
  function sendeBild(text) {
    if (zustand.sendet) return;
    if (!zustand.versuchBild || zustand.versuchBild.text !== text || zustand.versuchBild.blob !== zustand.bild.blob) {
      zustand.versuchBild = { id: neueId(), text: text, blob: zustand.bild.blob };
    }
    var f = new FormData();
    f.append('token', zustand.token);
    f.append('request_id', zustand.versuchBild.id);
    f.append('datei', zustand.bild.blob, 'bild.jpg');
    if (text) f.append('text', text);
    f.append('hp', honigtopf ? honigtopf.value : '');
    zustand.sendet = true;
    zeigeMeldung('');
    pruefen();
    mitLimit(API_BILD, { method: 'POST', body: f, credentials: 'omit', referrerPolicy: 'no-referrer' }, 45000).then(function (r) {
      zustand.sendet = false;
      if (r.status === 200) {
        bildVerwerfen();
        feldText.value = '';
        zustand.antwortAuf = null;
        zitatZeigen();
        pruefen();
        lesen().then(takt);
        return;
      }
      if (r.status === 404) { vergessen(); zeigeMeldung(T.fehlerNetz); fussAufbauen(); verlaufZeichnen(); punktSetzen(); return; }
      zeigeMeldung(r.status === 429 ? T.fehlerBildZuViele : (r.status === 413 || r.status === 415 || r.status === 400) ? T.fehlerBildFormat : T.fehlerNetz);
      pruefen();
    }).catch(function () {
      zustand.sendet = false;
      zeigeMeldung(T.fehlerNetz);
      pruefen();
    });
  }

  function sende(text, wiederholt) {
    // Gleicher Text = gleiche Anfrage-ID (kein Doppel bei Wiederholung nach Netzfehler).
    var zitat = zustand.token && zustand.antwortAuf ? zustand.antwortAuf.id : null;
    if (!zustand.versuch || zustand.versuch.text !== text || zustand.versuch.zitat !== zitat) zustand.versuch = { text: text, id: neueId(), zitat: zitat };
    var body = {
      aktion: 'senden',
      request_id: zustand.versuch.id,
      text: text,
      hp: honigtopf ? honigtopf.value : '',
      offen_ms: Date.now() - (zustand.geoeffnetAm || Date.now())
    };
    if (zustand.token) {
      body.token = zustand.token;
      if (zitat) body.antwort_auf = zitat;
    } else {
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
        if (!zustand.knopfRest) {
          zustand.antwortAuf = null;
          feldText.value = '';
        } // per Knopf gesendet: Textfeld und Zitat gehören weiter dem Besucher
        knopfRestHolen();
        if (neueSitzung) {
          fussAufbauen();
          verlaufZeichnen();
          ansichtZeigen('chat', true);
          feldText.focus();
        } else {
          zitatZeigen();
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
      knopfRestHolen();
      zeigeMeldung(r.status === 429 ? T.fehlerZuViele : r.status === 400 ? T.fehlerUngueltig : T.fehlerNetz);
      pruefen();
    }).catch(function () {
      zustand.sendet = false;
      knopfRestHolen();
      zeigeMeldung(T.fehlerNetz);
      pruefen();
    });
  }

  function start() {
    laden();
    aufbauen();
    if (zustand.token) { lesen().then(takt); }
    hinweisPlanen();
    document.addEventListener('visibilitychange', function () { if (!document.hidden && zustand.token) lesen(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
