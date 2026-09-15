import {PACKAGES} from './roadmap-content.mjs';
import {worldPoint,projectPoint} from './network-space.mjs';

export const IDS=PACKAGES.map(item=>item.id);
export const MOTION={settleRate:3.2,panelDuration:1000,floatPeriod:28,floatStagger:1.2};
// E is deliberately NOT in the player-app path. No dependency is asserted.
export const EDGES=[['A','B',1],['B','C',2],['C','D',0],['D','F',2],['F','G',1]];
export const HIGHLIGHTS={
  A:['Gemeinsame Runden planen','Scores manuell festhalten','Privat zurückblicken und teilen'],
  B:['Archiv und einfache Statistiken','Kalender und private Ligen','Den eigenen Lernweg fortsetzen'],
  C:['Clubs und Angebote','Trainer und Kurse','Indoorzeiten und Buchungsstatus'],
  D:['GPS und Bahninformationen','Weitere Spiel- und Turnierformate','Scorekarten und Medien'],
  E:['Startzeiten und Check-in','Platzorganisation und Kommunikation','Kasse, Range und Schnittstellen'],
  F:['Geräte und Schlagerkennung','Autorisierte Verbandsdaten','Prüfbare KI-Hilfen'],
  G:['Ausrüstung und Reisen vergleichen','Marken, Sponsoren und Creator','Weitere Medienformate']
};
export const SHORT_WHEN={A:'Der Anfang',B:'Darauf aufbauen',C:'Im kleinen Rahmen',D:'Das Spiel erweitern',E:'Eigene Linie',F:'Qualität prüfen',G:'Späterer Ausbau'};
const BASE={
  A:{x:.23,y:.16,z:18,rx:3,ry:-8},B:{x:.70,y:.15,z:-26,rx:-3,ry:8},
  C:{x:.75,y:.395,z:-12,rx:3,ry:7},D:{x:.25,y:.41,z:8,rx:-2,ry:-7},
  E:{x:.75,y:.62,z:-32,rx:2,ry:6},F:{x:.23,y:.78,z:-18,rx:3,ry:-5},
  G:{x:.69,y:.86,z:-36,rx:-2,ry:8}
};
export const idFromHash=hash=>{const match=/^#weg-([A-G])$/.exec(hash||'');return match?.[1]??'A';};
export function cardSize(width){return {width:Math.min(216,Math.max(176,width*.285)),height:132};}
export function poseFor(id,selected,seconds,height,{still=false}={}){
  const base=BASE[id];if(!base)throw new Error('Unknown roadmap package');
  const active=id===selected,slot=IDS.indexOf(id),phase=seconds*Math.PI*2/(MOTION.floatPeriod+slot*MOTION.floatStagger)+slot*1.3;
  return {...base,z:base.z+(active?70:0)+(still||active?0:Math.sin(phase*.8)*7),
    y:base.y+(still||active?0:Math.sin(phase)*4/height),
    rx:active?0:base.rx,ry:active?0:base.ry,scale:active?1.03:1};
}
export function projectedBounds(pose,box,width,height){
  const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>projectPoint(worldPoint(pose,{x:x*box.width/2,y:y*box.height/2},width,height),width,height));
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
}
export const canAnimate=({reduced=false,narrow=false,saveData=false,paused=false,hidden=false,inView=true,reading=false})=>!reduced&&!narrow&&!saveData&&!paused&&!hidden&&inView&&!reading;
