// Pure document-scroll poses; no elapsed time, spring, idle spin or integration.
export const SCREEN=Object.freeze({width:.06746445497630331,height:.146,z:.00442});
export const UI=Object.freeze({width:390,height:844,cardWidth:168,cardHeight:164,radius:20});
export const TILES=Object.freeze([
  {name:'Training',icon:'training',x:20,y:120,row:0,side:-1},
  {name:'Regeln',icon:'rules',x:202,y:120,row:0,side:1},
  {name:'Runden',icon:'rounds',x:20,y:296,row:1,side:-1},
  {name:'Wetter',icon:'weather',x:202,y:296,row:1,side:1},
  {name:'Freunde',icon:'friends',x:20,y:472,row:2,side:-1},
  {name:'Einstellungen',icon:'settings',x:202,y:472,row:2,side:1}
]);
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const mix=(a,b,t)=>a+(b-a)*t;
export const scrollSpan=height=>clamp(height*.82,500,820);
export function assemblyProgress(scrollY,sectionTop,height,top=112) {
  return clamp((scrollY-sectionTop+top)/scrollSpan(height));
}
export function assemblyLayout(width,height) {
  const mobile=width<700;
  const phoneHeight=Math.max(1,Math.min(height*.94,760,width*(mobile?.96:.75)));
  const scale=phoneHeight/.154,phoneWidth=.07325*scale;
  const gap=mobile?10:36;
  const tileWidth=Math.max(1,Math.min(184,(height-54)/3*168/164,(width-phoneWidth-4*gap)/2));
  const tileHeight=tileWidth*164/168;
  const rowGap=Math.min(tileHeight+22,(height-56-tileHeight)/2);
  return {scale,phoneHeight,phoneWidth,tileWidth,tileHeight,rowGap,gap,mobile};
}
export function assemblyPose(progress,width,height) {
  const p=clamp(progress),layout=assemblyLayout(width,height);
  const arrival=smooth(p/.16);
  const cards=TILES.map(tile=>{
    const travel=smooth((p-(.16+tile.row*.16))/.34);
    const target={x:((tile.x+UI.cardWidth/2)/UI.width-.5)*SCREEN.width,
      y:(.5-(tile.y+UI.cardHeight/2)/UI.height)*SCREEN.height,z:SCREEN.z+.00009};
    const from={x:tile.side*(layout.phoneWidth/2+layout.gap+layout.tileWidth/2)/layout.scale,
      y:(1-tile.row)*layout.rowGap/layout.scale,z:SCREEN.z+.0025};
    // A small vertical arc disappears at both endpoints; exact display fit wins.
    const arc=Math.sin(Math.PI*travel)*.005*(tile.row===2?-1:1);
    return {...tile,travel,x:mix(from.x,target.x,travel),y:mix(from.y,target.y,travel)+arc,
      z:mix(from.z,target.z,travel),width:mix(layout.tileWidth/layout.scale,SCREEN.width*168/390,travel),
      height:mix(layout.tileHeight/layout.scale,SCREEN.height*164/844,travel),
      angle:tile.side*.035*(1-travel),settled:travel===1};
  });
  return {progress:p,...layout,angleY:-.12*(1-arrival),offsetY:-12*(1-arrival),cards};
}
