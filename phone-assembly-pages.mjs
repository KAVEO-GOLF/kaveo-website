// Existing feature artwork; this local design study does not open real apps.
export const SECOND_PAGE=Object.freeze([
  {name:'Gruppen',x:20,y:120,width:168},
  {name:'Chat',x:202,y:120,width:168},
  {name:'Turniere',x:20,y:296,width:350}
]);
export const PAGE_NAMES=Object.freeze([
  'Training, Regeln, Runden, Wetter, Freunde und Einstellungen',
  'Gruppen, Chat und Turniere'
]);
export const swipeAxis=(dx,dy)=>Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)?'vertical':
  Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2?'horizontal':'pending';
export const swipeCompletes=offset=>Math.abs(offset)>=.16;
