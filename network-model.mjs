// Six product areas from concept PDF p.29; approved editorial selection, not availability.
export const GROUPS = [
  {id:'entdecken',label:'Entdecken und Lernen',subtitle:'Dein Weg ins Golfspiel.',title:'Vom ersten Interesse zum ersten Schritt.',description:'KAVEO soll Golf verständlich erklären und den Einstieg begleiten: mit Grundlagen, einem persönlichen Lernweg und Orientierung rund um die Platzreife.',features:[
    {id:'grundlagen',title:'Golf verstehen',icon:'rules',description:'Du interessierst dich für Golf, kennst aber die Begriffe noch nicht? Verständliche Texte und Videos sollen Spiel, Ausrüstung und Regeln erklären, bevor du das erste Mal auf den Platz gehst.'},
    {id:'lernpfad',title:'Dein Lernpfad',icon:'training',description:'Du möchtest Schritt für Schritt anfangen? Grundlagen und erste Übungen sollen einen zusammenhängenden Lernweg bilden. Deinen Fortschritt sollst du später wieder aufgreifen können.'},
    {id:'platzreife',title:'Platzreife',icon:'rules',description:'Du bereitest dich auf die Platzreife vor? Lerninhalte und Vorbereitungshilfen sollen dich begleiten. Welche Voraussetzungen für Kurs und selbstständiges Spielen gelten, bestimmt die jeweilige Anlage.'}
  ]},
  {id:'planen',label:'Planen und Angebote',subtitle:'Den nächsten Golfbesuch planen.',title:'Ein passendes Angebot. Ein klarer nächster Schritt.',description:'Plätze, Startzeiten, Kurse und Indoorangebote sollen leichter vergleichbar werden. Leistungen, Bedingungen und der zuständige Anbieter sollen dabei erkennbar bleiben.',features:[
    {id:'plaetze-startzeiten',title:'Plätze und Startzeiten',description:'Du planst deine nächste Runde? Anlageninformationen und passende Startzeiten sollen zusammen auffindbar sein. Eine Buchung gilt erst mit der Bestätigung des zuständigen Anbieters als bestätigt.'},
    {id:'kurse-indoor',title:'Kurse und Indoorangebote',icon:'training',description:'Du suchst einen Kurs oder möchtest wetterunabhängig spielen? Leistungen, Termine und Voraussetzungen sollen vergleichbar sein. Buchungen sollen über den jeweiligen eingebundenen Anbieterprozess möglich werden.'},
    {id:'ausruestung',title:'Ausrüstung vergleichen',description:'Du suchst einen neuen Schläger oder andere Ausrüstung? Produktangaben und Händlerangebote sollen den Vergleich erleichtern. Für den Kauf geht es zum gewählten Händler; KAVEO verkauft die Produkte nicht selbst.'}
  ]},
  {id:'spielen',label:'Spielen und Erfassen',subtitle:'Deine Runde im Überblick.',title:'Auf dem Platz bei deiner Runde bleiben.',description:'Runde vorbereiten, Spielform wählen, Entfernungen und Ergebnisse festhalten: KAVEO soll dich vom ersten Abschlag bis zum persönlichen Rückblick begleiten.',features:[
    {id:'gps',title:'GPS & Scorekarte',icon:'rounds',description:'Entfernungen auf der Bahn ansehen und Ergebnisse direkt festhalten: Die geplante Rundenbegleitung soll wichtige Angaben im passenden Moment zusammenbringen.'},
    {id:'spielmodi',title:'Spielmodi',icon:'tournaments',description:'Ihr möchtet allein, gegeneinander oder im Team spielen? Spielform, Teilnehmer und Wertung sollen sich vor der Runde passend festlegen lassen. Die Ergebnisse sollen anschließend zur gewählten Spielweise passen.'},
    {id:'rueckblick',title:'Rundenrückblick',icon:'training',description:'Was lief gut, was möchtest du wieder üben? Gespeicherte Runden und verständliche Auswertungen sollen helfen, dein Spiel über längere Zeit zu betrachten.'}
  ]},
  {id:'trainieren',label:'Trainieren und Verbessern',subtitle:'Am eigenen Spiel arbeiten.',title:'Aus einer Trainerstunde wird dein nächster Schritt.',description:'Übungen, Video und Rückmeldungen sollen zusammenbleiben, damit aus einem Training ein persönlicher Plan für die nächsten Einheiten werden kann.',features:[
    {id:'uebungsplan',title:'Übungen und Trainingsplan',icon:'training',description:'Du möchtest gezielter üben? Übungen in Text und Video, persönliche Ziele und ein Trainingsplan sollen helfen, die nächste Einheit vorzubereiten und absolvierte Übungen wiederzufinden.'},
    {id:'videoanalyse',title:'Videoanalyse',description:'Du möchtest deinen Schwung besser verstehen? Videoaufnahmen sollen sich ansehen, vergleichen und mit Hinweisen ergänzen lassen. Geplante KI-Hilfen liefern Vorschläge, keine automatisch gesicherten Messwerte.'},
    {id:'feedback',title:'Trainerfeedback',icon:'chat',description:'Geteilte Übungen und Hinweise sollen nach der Trainerstunde erhalten bleiben. Eine KI-Zusammenfassung vereinbarter Aufnahmen ist als Entwurf vorgesehen, den der Trainer prüfen und ergänzen kann.'}
  ]},
  {id:'community',label:'Community und Erlebnisse',subtitle:'Golf gemeinsam erleben.',title:'Aus einer Runde kann mehr werden.',description:'Kontakte finden, gemeinsam aktiv sein und Erlebnisse teilen: KAVEO soll die Menschen und Absprachen rund um dein Golfspiel verbinden.',features:[
    {id:'mitspieler-gruppen',title:'Mitspieler und Gruppen',icon:'friends',description:'Du möchtest nicht allein spielen? Mitspielersuche und Gruppen sollen passende Kontakte und gemeinsame Aktivitäten ermöglichen. Absprachen im Messenger sollen bei der jeweiligen Runde oder Gruppe auffindbar bleiben.'},
    {id:'turniere-ligen',title:'Turniere und Ligen',icon:'tournaments',description:'Eure Freundesliga soll ohne verstreute Tabellen auskommen? Private Gruppen und Clubs sollen Turniere und Ligen mit Spieltagen, Wertungen und laufenden Ergebnissen organisieren können.'},
    {id:'beitraege',title:'Beiträge und Austausch',icon:'chat',description:'Du möchtest einen Golfmoment oder eine Erfahrung teilen? Beiträge und Gespräche sollen den Austausch ermöglichen. Du entscheidest, welche Inhalte für wen sichtbar werden; private Trainingsinhalte werden nicht automatisch veröffentlicht.'}
  ]},
  {id:'partner',label:'Partner und Betrieb',subtitle:'Für Clubs, Trainer und Anbieter',audience:'Für Clubs, Trainer und Anbieter',title:'Auch hinter dem Golfbesuch soll alles zusammenpassen.',description:'Clubs, Indooranlagen und Trainer sollen eigene Arbeitsbereiche erhalten. Diese verbinden ihre Angebote und Organisation mit dem Golfalltag der Nutzer, ohne Zuständigkeiten oder private Daten zu vermischen.',features:[
    {id:'cluborganisation',title:'Cluborganisation',description:'Ein Club möchte den Tagesbetrieb überblicken? Mitgliederkontakt, Angebote, Belegung und organisatorische Aufgaben sollen in einer eigenen Oberfläche zusammenkommen. Mitarbeiter erhalten die für ihre Aufgabe passenden Rechte.'},
    {id:'indoorbetrieb',title:'Indoorbetrieb',description:'Eine Indooranlage plant ihre nächsten Sessions? Buchungen, verfügbare Boxen und die tatsächliche Nutzung sollen zusammengehören. Geräte- und Simulatoranbindungen bleiben abhängig vom jeweiligen Partner und freigegebenen Datenweg.'},
    {id:'trainerbereich',title:'Trainerbereich',icon:'training',description:'Ein Trainer möchte seine Teilnehmer auch nach dem Termin begleiten? Termine, vereinbarte Aufnahmen, Hinweise und nächste Übungen sollen im eigenen Arbeitsbereich zusammenbleiben. Private und geteilte Inhalte bleiben getrennt.'}
  ]}
];

export const CENTER = {x:.5,y:.48,z:46,rx:0,ry:0};
export const GROUP_POSITIONS = [{x:.20,y:.19,z:72,rx:3,ry:-8},{x:.18,y:.50,z:-48,rx:-2,ry:-5},{x:.21,y:.81,z:52,rx:3,ry:-7},{x:.80,y:.19,z:-62,rx:-3,ry:7},{x:.79,y:.50,z:92,rx:2,ry:8},{x:.79,y:.81,z:-32,rx:-3,ry:6}];
// Fixed left/right branches in overview; three distinct branches in a detail view.
export const branchFor=(index,detail=false)=>detail?index:index<3?0:1;
export const FEATURE_POSITIONS = [{x:.23,y:.19,z:-78,rx:3,ry:-8},{x:.78,y:.29,z:92,rx:-4,ry:9},{x:.43,y:.815,z:32,rx:5,ry:-3}];
export const clamp = n => Math.max(0,Math.min(1,n));
export const ease = n => {const t=clamp(n);return t*t*t*(t*(t*6-15)+10);};
export const mix = (a,b,t) => a+(b-a)*t;
export function interpolatePose(a,b,t){const u=ease(t);return {x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),z:mix(a.z??0,b.z??0,u),rx:mix(a.rx??0,b.rx??0,u),ry:mix(a.ry??0,b.ry??0,u),opacity:mix(a.opacity,b.opacity,u),scale:mix(a.scale,b.scale,u)};}
export function layoutFor(groupId=null){
  if(groupId!==null&&!GROUPS.some(group=>group.id===groupId))throw new Error('Unknown group');
  return {
    hub:{...CENTER,opacity:groupId?0:1,scale:groupId ? .86 : 1},
    groups:GROUPS.map((group,i)=>({...(group.id===groupId?CENTER:GROUP_POSITIONS[i]),opacity:!groupId||group.id===groupId?1:0,scale:!groupId||group.id===groupId?1:.92})),
    features:FEATURE_POSITIONS.map(point=>({...point,opacity:groupId?1:0,scale:groupId?1:.76}))
  };
}
export function curvePath(a,b,width,height){
  const x1=a.x*width,y1=a.y*height,x2=b.x*width,y2=b.y*height;
  const bend=(x2-x1)*.54;
  return `M${x1},${y1} C${x1+bend},${y1} ${x2-bend},${y2} ${x2},${y2}`;
}
