// Six product areas from concept PDF p.29; approved editorial selection, not availability.
// GROUPS/CROSS_LINKS exist in a German and an English copy; the exported
// constants pick one based on <html lang>, so this single file serves both
// language versions of the homepage without duplicating the geometry/logic below.
const GROUPS_DE = [
  {id:'entdecken',label:'Entdecken und Lernen',subtitle:'Dein Weg ins Golfspiel.',title:'Vom ersten Interesse zum ersten Schritt.',description:'Golf verständlich erklärt, von den ersten Begriffen bis zur Platzreife — mit einem Lernweg, den du in deinem Tempo gehst.',features:[
    {id:'grundlagen',title:'Golf verstehen',description:'Golf interessiert dich, die Begriffe sagen dir noch nichts? Texte und Videos erklären Spiel, Ausrüstung und Regeln, bevor du das erste Mal auf den Platz gehst.'},
    {id:'lernpfad',title:'Dein Lernpfad',description:'Grundlagen und erste Übungen bilden einen zusammenhängenden Lernweg. Deinen Fortschritt greifst du später wieder auf.'},
    {id:'platzreife',title:'Platzreife',description:'Lerninhalte und Vorbereitungshilfen begleiten dich zur Platzreife. Welche Voraussetzungen gelten, bestimmt die jeweilige Anlage.'}
  ]},
  {id:'planen',label:'Planen und Angebote',subtitle:'Den nächsten Golfbesuch planen.',title:'Ein passendes Angebot. Ein klarer nächster Schritt.',description:'Plätze, Startzeiten, Kurse und Indoorangebote im Vergleich. Was enthalten ist und wer dahintersteht, bleibt dabei erkennbar.',features:[
    {id:'plaetze-startzeiten',title:'Plätze und Startzeiten',description:'Anlagen und passende Startzeiten findest du an einer Stelle. Verbindlich wird eine Buchung erst mit der Bestätigung des Anbieters.'},
    {id:'kurse-indoor',title:'Kurse und Indoorangebote',description:'Kurse und Indoorzeiten im Vergleich: Leistung, Termin, Voraussetzungen. Gebucht wird über den jeweiligen Anbieter.'},
    {id:'ausruestung',title:'Ausrüstung vergleichen',description:'Produktangaben und Händlerangebote nebeneinander. Gekauft wird beim Händler — KAVEO verkauft die Produkte nicht selbst.'}
  ]},
  {id:'spielen',label:'Spielen und Erfassen',subtitle:'Deine Runde im Überblick.',title:'Auf dem Platz bei deiner Runde bleiben.',description:'Runde vorbereiten, Spielform wählen, Entfernungen und Ergebnisse festhalten — vom ersten Abschlag bis zum Rückblick danach.',features:[
    {id:'gps',title:'GPS & Scorekarte',description:'Entfernungen auf der Bahn ansehen, Ergebnisse sofort festhalten. Die Rundenbegleitung bringt zusammen, was gerade zählt.'},
    {id:'spielmodi',title:'Spielmodi',description:'Allein, gegeneinander oder im Team? Spielform, Teilnehmer und Wertung legt ihr vor der Runde fest — die Auswertung folgt genau dieser Wahl.'},
    {id:'rueckblick',title:'Rundenrückblick',description:'Gespeicherte Runden und verständliche Auswertungen zeigen, was gut lief und was Übung braucht. Über Monate, nicht über eine Runde.'}
  ]},
  {id:'trainieren',label:'Trainieren und Verbessern',subtitle:'Am eigenen Spiel arbeiten.',title:'Aus einer Trainerstunde wird dein nächster Schritt.',description:'Übungen, Videos und Rückmeldungen bleiben zusammen. So wird aus einer Trainerstunde ein Plan für die nächsten Einheiten.',features:[
    {id:'uebungsplan',title:'Übungen und Trainingsplan',description:'Übungen in Text und Video, eigene Ziele, ein Trainingsplan. Die nächste Einheit ist vorbereitet, die letzte wiederzufinden.'},
    {id:'videoanalyse',title:'Videoanalyse',description:'Warum sitzt der Schwung nicht? Aufnahmen ansehen, vergleichen und mit Hinweisen ergänzen. KI-Hilfen liefern Vorschläge, keine gesicherten Messwerte.'},
    {id:'feedback',title:'Trainerfeedback',description:'Was in der Trainerstunde besprochen wurde, bleibt danach erhalten. Eine KI-Zusammenfassung ist nur ein Entwurf — prüfen und ergänzen tut der Trainer.'}
  ]},
  {id:'community',label:'Community und Erlebnisse',subtitle:'Golf gemeinsam erleben.',title:'Aus einer Runde kann mehr werden.',description:'Mitspieler finden, gemeinsam spielen, Erlebnisse teilen. Die Menschen und Absprachen rund um dein Golfspiel an einem Ort.',features:[
    {id:'mitspieler-gruppen',title:'Mitspieler und Gruppen',description:'Keine Lust, allein zu spielen? Mitspielersuche und Gruppen bringen passende Leute zusammen. Absprachen bleiben dort, wo die Runde steht.'},
    {id:'turniere-ligen',title:'Turniere und Ligen',description:'Eure Freundesliga ohne verstreute Tabellen: Spieltage, Wertungen und laufende Ergebnisse an einer Stelle, privat oder im Club.'},
    {id:'beitraege',title:'Beiträge und Austausch',description:'Golfmomente und Erfahrungen teilen, darüber ins Gespräch kommen. Du entscheidest, wer was sieht — private Trainingsinhalte bleiben privat.'}
  ]},
  {id:'partner',label:'Partner und Betrieb',subtitle:'Für Clubs, Trainer und Anbieter',audience:'Für Clubs, Trainer und Anbieter',title:'Auch hinter dem Golfbesuch soll alles zusammenpassen.',description:'Clubs, Indooranlagen und Trainer arbeiten in eigenen Bereichen. Ihre Angebote treffen dort auf den Golfalltag der Spieler, ohne dass Zuständigkeiten oder private Daten sich vermischen.',features:[
    {id:'cluborganisation',title:'Cluborganisation',description:'Mitgliederkontakt, Angebote, Belegung und Aufgaben kommen in einer eigenen Oberfläche zusammen. Jeder Mitarbeiter bekommt die Rechte, die zu seiner Aufgabe passen.'},
    {id:'indoorbetrieb',title:'Indoorbetrieb',description:'Wer spielt heute in welcher Box? Buchungen, freie Boxen und die tatsächliche Nutzung gehören zusammen. Geräteanbindungen hängen vom jeweiligen Partner ab.'},
    {id:'trainerbereich',title:'Trainerbereich',description:'Termine, vereinbarte Aufnahmen, Hinweise und nächste Übungen bleiben im eigenen Arbeitsbereich zusammen. Privates und Geteiltes bleibt getrennt.'}
  ]}
];

const GROUPS_EN = [
  {id:'entdecken',label:'Discover & Learn',subtitle:'Your way into golf.',title:'From first interest to first step.',description:'Golf explained clearly, from the basic terms to course readiness — with a learning path you follow at your own pace.',features:[
    {id:'grundlagen',title:'Understanding golf',description:"Interested in golf, but the terms don't mean much yet? Articles and videos explain the game, equipment and rules before your first time on the course."},
    {id:'lernpfad',title:'Your learning path',description:'Fundamentals and first exercises form one connected learning path. You can pick up your progress again later.'},
    {id:'platzreife',title:'Course readiness',description:'Learning content and preparation guides support you on the way to course readiness. The exact requirements depend on the facility.'}
  ]},
  {id:'planen',label:'Plan & Offers',subtitle:'Planning your next round.',title:'A fitting offer. A clear next step.',description:"Compare courses, tee times, lessons and indoor offers. What's included and who's behind it stays clear throughout.",features:[
    {id:'plaetze-startzeiten',title:'Courses & tee times',description:'Find facilities and matching tee times in one place. A booking becomes binding only once the provider confirms it.'},
    {id:'kurse-indoor',title:'Lessons & indoor offers',description:'Compare lessons and indoor slots: quality, date, requirements. Booking happens through the respective provider.'},
    {id:'ausruestung',title:'Compare equipment',description:"Product details and retailer offers side by side. Purchases happen at the retailer — KAVEO doesn't sell the products itself."}
  ]},
  {id:'spielen',label:'Play & Track',subtitle:'Your round at a glance.',title:'Stay in your round, on the course.',description:'Prepare your round, choose a game format, track distances and results — from the first tee shot to looking back afterward.',features:[
    {id:'gps',title:'GPS & scorecard',description:'See distances on the hole, record results instantly. Round tracking brings together what matters right now.'},
    {id:'spielmodi',title:'Game modes',description:'Solo, head-to-head, or as a team? You set the format, players and scoring before the round — the results follow exactly that choice.'},
    {id:'rueckblick',title:'Round recap',description:'Saved rounds and clear breakdowns show what worked and what needs practice — over months, not just one round.'}
  ]},
  {id:'trainieren',label:'Train & Improve',subtitle:'Working on your own game.',title:'One coaching session becomes your next step.',description:'Drills, videos and feedback stay together — turning a coaching session into a plan for your next sessions.',features:[
    {id:'uebungsplan',title:'Drills & training plan',description:'Drills in text and video, your own goals, a training plan. The next session is prepared, the last one easy to find again.'},
    {id:'videoanalyse',title:'Video analysis',description:"Why isn't the swing clicking? Watch recordings, compare them, and add notes. AI assistance offers suggestions, not confirmed measurements."},
    {id:'feedback',title:'Coach feedback',description:'What was discussed in the coaching session stays on record afterward. An AI summary is only a draft — the coach reviews and adds to it.'}
  ]},
  {id:'community',label:'Community & Experiences',subtitle:'Experiencing golf together.',title:'A round can turn into more.',description:'Find playing partners, play together, share experiences — the people and plans around your golfing life, in one place.',features:[
    {id:'mitspieler-gruppen',title:'Playing partners & groups',description:"Don't feel like playing alone? Finding playing partners and groups brings the right people together. Arrangements stay right where the round is happening."},
    {id:'turniere-ligen',title:'Tournaments & leagues',description:"Your friends' league without scattered spreadsheets: match days, standings and live results in one place, private or at the club."},
    {id:'beitraege',title:'Posts & exchange',description:'Share golf moments and experiences, and start a conversation about them. You decide who sees what — private training content stays private.'}
  ]},
  {id:'partner',label:'Partners & Operations',subtitle:'For clubs, coaches and providers',audience:'For clubs, coaches and providers',title:'Behind the round, everything should fit together too.',description:"Clubs, indoor facilities and coaches work in their own areas. Their offers meet players' golfing routines there, without responsibilities or private data getting mixed up.",features:[
    {id:'cluborganisation',title:'Club organization',description:'Member contact, offers, scheduling and tasks come together in one dedicated interface. Every staff member gets the access that fits their role.'},
    {id:'indoorbetrieb',title:'Indoor operations',description:"Who's playing in which bay today? Bookings, open bays and actual usage belong together. Device integrations depend on the respective partner."},
    {id:'trainerbereich',title:'Coach area',description:'Appointments, agreed-upon recordings, notes and next drills stay together in one dedicated workspace. Private and shared content stays separate.'}
  ]}
];

// Querverbindungen in der Uebersicht. Jede beschreibt einen Weg, den ein
// Golfer wirklich geht -- keine Dekoration. Die Anordnung ist zwei Spalten,
// also laufen die Linien AUSSEN HERUM: senkrecht in der Spalte, waagerecht
// oben und unten. Keine Linie kreuzt die Mitte, wo die KAVEO-Scheibe liegt.
//   a ist die Karte, an deren Rand die Linie beginnt; bei port 2 (senkrecht)
//   muss a die OBERE sein, bei port 0 liegt b links von a, bei port 1 rechts.
const CROSS_LINKS_DE = [
  {a:0,b:1,port:2,why:'Wer die Grundlagen hat, sucht den ersten Kurs.'},
  {a:1,b:2,port:2,why:'Startzeit gebucht, Runde gespielt.'},
  {a:2,b:5,port:1,why:'Gespielt wird auf der Anlage eines Clubs.'},
  {a:4,b:5,port:2,why:'Clubs und Trainer veranstalten Turniere und Ligen.'},
  {a:3,b:0,port:0,why:'Aus dem Lernweg wird gezieltes Training.'}
];
const CROSS_LINKS_EN = [
  {a:0,b:1,port:2,why:'Once you have the basics, you look for your first lesson.'},
  {a:1,b:2,port:2,why:'Tee time booked, round played.'},
  {a:2,b:5,port:1,why:"Rounds are played at a club's facility."},
  {a:4,b:5,port:2,why:'Clubs and coaches run tournaments and leagues.'},
  {a:3,b:0,port:0,why:'The learning path turns into focused training.'}
];

const IS_EN = typeof document!=='undefined' && document.documentElement.lang==='en';
export const GROUPS = IS_EN ? GROUPS_EN : GROUPS_DE;
export const CROSS_LINKS = IS_EN ? CROSS_LINKS_EN : CROSS_LINKS_DE;

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
