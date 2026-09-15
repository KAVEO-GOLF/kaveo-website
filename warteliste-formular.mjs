// KAVEO — das Eintragefeld im Fuss der Startseite.
//
// Ohne JavaScript passiert hier nichts. Das ist bewusst: Ein Formular, das
// ohne Skript abschickt, braucht eine Seite, die die Antwort erzeugt — und
// die Website liegt auf GitHub Pages und kann das nicht. Deshalb bleibt der
// Knopf gesperrt, bis dieses Modul geladen ist. So steht nie ein Feld da,
// das zwar aussieht, als nehme es etwas an, aber nichts annimmt.
import { sende } from './warteliste.mjs';

const formular = document.getElementById('signup-form');
const notiz = document.getElementById('form-note');
const knopf = formular?.querySelector('button[type="submit"]');
const felder = formular ? [...formular.querySelectorAll('input')] : [];

if (formular && notiz && knopf) {
  // Erst jetzt ist das Feld wirklich benutzbar.
  knopf.disabled = false;
  notiz.textContent = 'Wir melden uns nur, wenn es etwas zu sehen gibt.';

  const MELDUNG = {
    pruefe_postfach:
      'Fast geschafft — wir haben dir eine Mail geschickt. Bitte bestätige darin einmal, dass die Adresse dir gehört. Ohne diese Bestätigung tragen wir dich nicht ein.',
    adresse_ungueltig:
      'Diese Adresse sieht nicht richtig aus. Magst du sie noch einmal ansehen?',
    spaeter:
      'Gerade sind viele Eintragungen unterwegs. Bitte versuch es in einer Stunde noch einmal.',
    fehler:
      'Da ist etwas schiefgelaufen — bei uns, nicht bei dir. Bitte versuch es in ein paar Minuten noch einmal.',
  };

  formular.addEventListener('submit', async (ereignis) => {
    ereignis.preventDefault();
    if (knopf.disabled) return;

    knopf.disabled = true;
    formular.classList.add('is-busy');
    notiz.textContent = 'Einen Moment …';

    const ergebnis = await sende('eintragen', {
      email: formular.elements.email.value.trim(),
      name: formular.elements.name.value.trim() || null,
    });

    notiz.textContent = MELDUNG[ergebnis] ?? MELDUNG.fehler;
    formular.classList.remove('is-busy');

    if (ergebnis === 'pruefe_postfach') {
      // Geschafft: Das Feld wird zugemacht, damit niemand aus Unsicherheit
      // ein zweites Mal drueckt. Die Sperrfrist in der Datenbank faenge das
      // zwar ab, aber der Besucher saehe dann nur wieder dieselbe Meldung.
      for (const feld of felder) feld.disabled = true;
      // display statt hidden: Das hidden-Attribut setzt nur display:none mit
      // sehr schwacher Gewichtung, und .button der Seite setzt display auf
      // inline-flex -- damit gewinnt die Klasse und der Knopf bleibt stehen.
      // Genau so ist es am 15.09. beim ersten echten Versuch passiert.
      knopf.hidden = true;
      knopf.style.display = 'none';
    } else {
      knopf.disabled = false;
    }
  });
}
