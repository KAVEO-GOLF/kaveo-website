// Concrete aspects of the approved feature selection, not extra feature branches.
// German and English copy live side by side; the export picks one based on
// <html lang>, matching the pattern used in network-model.mjs.
const FEATURE_POINTS_DE = {
  grundlagen:['Spielprinzip und wichtige Golfbegriffe','Orientierung zur Ausrüstung','Verständlich erklärte Regeln'],
  lernpfad:['Grundlagen in einem zusammenhängenden Lernweg','Erste Übungen zum Ausprobieren','Den eigenen Fortschritt später wieder aufgreifen'],
  platzreife:['Lerninhalte für den Einstieg','Vorbereitung auf die ersten Platzbesuche','Voraussetzungen der jeweiligen Anlage einordnen'],
  'plaetze-startzeiten':['Informationen zu passenden Golfanlagen','Startzeiten für die nächste Runde finden','Buchungsbestätigung des Anbieters erkennen'],
  'kurse-indoor':['Kurse und Indoorangebote finden','Leistungen, Termine und Voraussetzungen vergleichen','Über den zuständigen Anbieterprozess buchen'],
  ausruestung:['Produktangaben gegenüberstellen','Preise und Angebote von Händlern vergleichen','Den Kauf beim gewählten Händler abschließen'],
  gps:['GPS-Entfernungen auf der Spielbahn','Ergebnisse in der digitalen Scorekarte festhalten','Angaben im Zusammenhang mit der Runde nutzen'],
  spielmodi:['Eine passende Spielform auswählen','Teilnehmer und Teams festlegen','Ergebnisse nach der gewählten Spielweise werten'],
  rueckblick:['Gespeicherte Runden wieder aufrufen','Ergebnisse verständlich auswerten','Die eigene Entwicklung über längere Zeit betrachten'],
  uebungsplan:['Übungen in Text und Video','Persönliche Ziele und den nächsten Trainingsplan','Absolvierte Übungen später wiederfinden'],
  videoanalyse:['Schwungaufnahmen ansehen und vergleichen','Hinweise direkt zur Aufnahme ergänzen','KI-Vorschläge als solche erkennen und prüfen'],
  feedback:['Hinweise aus der Trainerstunde wiederfinden','Geteilte Übungen für das nächste Training','KI-Zusammenfassungen durch den Trainer prüfen lassen'],
  'mitspieler-gruppen':['Passende Mitspieler und gemeinsame Aktivitäten','Austausch in privaten Gruppen','Absprachen im Messenger bei Runde oder Gruppe behalten'],
  'turniere-ligen':['Private Gruppen- und Clubwettbewerbe organisieren','Spieltage und Wertungen zusammenführen','Laufende Ergebnisse im gemeinsamen Überblick'],
  beitraege:['Golfmomente und Erfahrungen teilen','Über Beiträge ins Gespräch kommen','Selbst bestimmen, wer welche Inhalte sehen darf'],
  cluborganisation:['Mitgliederkontakt und Angebote zusammenführen','Belegung und Aufgaben im Tagesbetrieb überblicken','Passende Rechte für die jeweiligen Mitarbeiter'],
  indoorbetrieb:['Buchungen und verfügbare Boxen organisieren','Die tatsächliche Nutzung den Sessions zuordnen','Geräte nur über freigegebene Partneranbindungen verbinden'],
  trainerbereich:['Termine und Teilnehmer im Zusammenhang behalten','Vereinbarte Aufnahmen und Hinweise wiederfinden','Nächste Übungen teilen und private Inhalte trennen']
};

const FEATURE_POINTS_EN = {
  grundlagen:['Game principles and key golf terms','Guidance on equipment','Rules explained clearly'],
  lernpfad:['Fundamentals in one connected learning path','First exercises to try out','Pick up your own progress again later'],
  platzreife:['Learning content to get started','Preparation for your first visits to the course','Understand each facility’s requirements'],
  'plaetze-startzeiten':['Information on matching golf facilities','Find tee times for your next round','See the provider’s booking confirmation'],
  'kurse-indoor':['Find lessons and indoor offers','Compare services, dates and requirements','Book through the respective provider’s process'],
  ausruestung:['Compare product details side by side','Compare prices and offers from retailers','Complete the purchase with your chosen retailer'],
  gps:['GPS distances on the hole','Record results in the digital scorecard','Use the data in context with your round'],
  spielmodi:['Choose a fitting game format','Set participants and teams','Score results according to the chosen format'],
  rueckblick:['Revisit saved rounds','Clear, understandable breakdowns of results','Track your own progress over a longer period'],
  uebungsplan:['Drills in text and video','Personal goals and your next training plan','Find completed drills again later'],
  videoanalyse:['Watch and compare swing recordings','Add notes directly to a recording','Recognize AI suggestions as such and review them'],
  feedback:['Find notes from your coaching session again','Shared drills for your next training session','Have AI summaries reviewed by your coach'],
  'mitspieler-gruppen':['Matching playing partners and shared activities','Exchange in private groups','Keep arrangements in the messenger tied to the round or group'],
  'turniere-ligen':['Organize private group and club competitions','Bring match days and standings together','Live results in one shared overview'],
  beitraege:['Share golf moments and experiences','Start conversations through posts','Decide for yourself who can see which content'],
  cluborganisation:['Bring member contact and offers together','Keep track of bookings and tasks in daily operations','Fitting access rights for each staff member'],
  indoorbetrieb:['Organize bookings and available bays','Match actual usage to sessions','Connect devices only through approved partner integrations'],
  trainerbereich:['Keep appointments and participants in context','Find agreed-upon recordings and notes again','Share upcoming drills while keeping private content separate']
};

const IS_EN = typeof document!=='undefined' && document.documentElement.lang==='en';
export const FEATURE_POINTS = IS_EN ? FEATURE_POINTS_EN : FEATURE_POINTS_DE;
