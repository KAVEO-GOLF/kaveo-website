// KAVEO — die eine Stelle, an der die Website mit der Warteliste spricht.
//
// Der Browser redet nie mit der Datenbank, sondern nur mit dieser Funktion.
// Warum, steht ausfuehrlich in supabase/functions/warteliste/index.ts. Kurz:
// Der service_role-Schluessel und der Bestaetigungs-Token bleiben auf dem
// Server; hierher kommt nur ein Wort als Ergebnis.
//
// Die Adresse unten ist oeffentlich — sie steht ohnehin in jedem Aufruf, den
// der Browser macht. Sie ist kein Geheimnis und muss keines sein.
export const FUNKTION_URL =
  'https://xyakqziopzjjihovyesj.supabase.co/functions/v1/warteliste';

/**
 * Schickt eine Aktion an die Funktion und gibt das Ergebniswort zurueck.
 * Jeder Fehlerfall — kein Netz, Zeitueberschreitung, kaputte Antwort —
 * endet als 'fehler'. Die Seiten muessen also nur zwei Dinge koennen:
 * die bekannten Woerter anzeigen und 'fehler' anzeigen.
 */
export async function sende(aktion, daten = {}) {
  const abbruch = AbortSignal.timeout(15000);
  try {
    const antwort = await fetch(FUNKTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ aktion, ...daten }),
      signal: abbruch,
    });
    const inhalt = await antwort.json();
    return typeof inhalt?.ergebnis === 'string' ? inhalt.ergebnis : 'fehler';
  } catch {
    return 'fehler';
  }
}

/** Der Token aus dem Link in der Mail. Null, wenn er fehlt oder nicht passt. */
export function tokenAusAdresse() {
  const t = new URLSearchParams(location.search).get('t') ?? '';
  return /^[0-9a-f]{64}$/.test(t) ? t : null;
}
