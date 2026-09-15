// KAVEO — die beiden kleinen Seiten hinter den Links in der Mail.
//
// Ein Modul fuer beide: Bestaetigen und Abmelden unterscheiden sich nur in
// der Aktion und in den Texten. Welche gilt, steht am <body> der Seite.
//
// Warum ueberhaupt ein Knopf, statt beim Aufruf zu bestaetigen: Viele
// Postfaecher rufen Links in Mails vorab ab, um sie zu pruefen. Bestaetigte
// schon der Aufruf, waere aus dem doppelten Opt-in ein einfaches geworden --
// jemand koennte eine fremde Adresse eintragen und der Mailscanner des
// Opfers wuerde sie fuer ihn bestaetigen. Der Klick ist der Unterschied.
import { sende, tokenAusAdresse } from './warteliste.mjs';

const TEXTE = {
  bestaetigen: {
    ok: ['Du bist dabei.',
         'Wir melden uns, wenn die Tests starten — und wenn es etwas Wichtiges zu sehen gibt. Sonst nicht.',
         'Abmelden kannst du dich jederzeit über den Link in jeder Mail.'],
    bereits_bestaetigt: ['Du stehst schon auf der Liste.',
         'Diese Adresse ist bereits bestätigt. Du musst nichts weiter tun.', ''],
    abgelaufen: ['Der Link ist abgelaufen.',
         'Bestätigungslinks gelten 30 Tage. Trag dich einfach noch einmal ein, dann schicken wir dir einen neuen.', ''],
    unbekannt: ['Dieser Link gilt nicht mehr.',
         'Das passiert, wenn du dich zwischendurch noch einmal eingetragen hast — dann zählt nur der Link aus der neuesten Mail. Sieh dort nach oder trag dich erneut ein.', ''],
    fehler: ['Das hat gerade nicht geklappt.',
         'Der Fehler liegt bei uns, nicht bei dir. Bitte ruf den Link in ein paar Minuten noch einmal auf.', ''],
  },
  abmelden: {
    ok: ['Abgemeldet.',
         'Von uns kommt jetzt keine Mail mehr. Danke, dass du eine Zeit lang dabei warst.',
         'Falls du es dir anders überlegst: Auf der Startseite kannst du dich jederzeit wieder eintragen.'],
    unbekannt: ['Dieser Link gilt nicht mehr.',
         'Möglicherweise bist du schon abgemeldet. Wenn dich trotzdem noch Mails erreichen, schreib uns kurz an info@kaveo-golf.app — wir kümmern uns darum.', ''],
    fehler: ['Das hat gerade nicht geklappt.',
         'Der Fehler liegt bei uns, nicht bei dir. Bitte ruf den Link in ein paar Minuten noch einmal auf. Geht es dann immer noch nicht, schreib uns an info@kaveo-golf.app — wir melden dich von Hand ab.', ''],
  },
};

const aktion = document.body.dataset.aktion;
const texte = TEXTE[aktion];
const frage = document.getElementById('frage');
const antwort = document.getElementById('antwort');
const knopf = document.getElementById('ausloesen');

function zeige(schluessel) {
  const [titel, text, nachsatz] = texte[schluessel] ?? texte.fehler;
  document.getElementById('antwort-titel').textContent = titel;
  document.getElementById('antwort-text').textContent = text;
  const n = document.getElementById('antwort-nachsatz');
  n.textContent = nachsatz;
  n.hidden = !nachsatz;
  frage.hidden = true;
  antwort.hidden = false;
  document.title = `${titel} — KAVEO GOLF`;
}

if (texte && frage && antwort && knopf) {
  const token = tokenAusAdresse();
  if (!token) {
    // Kein Token in der Adresse oder er hat nicht die Form, die wir vergeben.
    // Die Datenbank wird damit gar nicht erst behelligt.
    zeige('unbekannt');
  } else {
    knopf.disabled = false;
    knopf.addEventListener('click', async () => {
      knopf.disabled = true;
      knopf.textContent = 'Einen Moment …';
      zeige(await sende(aktion, { token }));
    });
  }
}
