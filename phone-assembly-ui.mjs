import {TILES,UI} from './phone-assembly-model.mjs';
import {SECOND_PAGE} from './phone-assembly-pages.mjs';

const loadImage=(src,doc)=>new Promise((resolve,reject)=>{
  const img=doc.createElement('img');img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('UI asset unavailable: '+src));img.src=src;
});
export async function createAssemblyUI(doc=document) {
  await doc.fonts?.load('500 14px Manrope');
  const [screen,dusk,...icons]=await Promise.all([
    loadImage('design-assets/homescreen.png',doc),loadImage('media/optimized/homescreen-dusk.webp',doc),
    ...[...TILES,...SECOND_PAGE].map(tile=>loadImage(`media/optimized/assembly-icon-${tile.name}.webp`,doc))
  ]);
  const make=(w,h)=>{const c=doc.createElement('canvas');c.width=w*2;c.height=h*2;return c;};
  const bg=make(390,844),b=bg.getContext('2d');b.scale(2,2);
  const scale=Math.max(390/dusk.naturalWidth,844/dusk.naturalHeight);
  b.drawImage(dusk,(390-dusk.naturalWidth*scale)/2,(844-dusk.naturalHeight*scale)/2,dusk.naturalWidth*scale,dusk.naturalHeight*scale);
  b.fillStyle='rgba(13,13,13,.45)';b.fillRect(0,0,390,844);
  const base=make(390,844),ctx=base.getContext('2d');ctx.drawImage(bg,0,0);
  // Reuse exact approved header and navigation; the fields start empty.
  ctx.drawImage(screen,0,0,390,112,0,0,780,224);
  ctx.drawImage(screen,0,752,390,92,0,1504,780,184);
  const allCards=[...TILES,...SECOND_PAGE].map((tile,index)=>{
    const width=tile.width||UI.cardWidth;
    const card=make(width,UI.cardHeight),c=card.getContext('2d');c.scale(2,2);
    c.beginPath();c.roundRect(0,0,width,164,20);c.clip();
    c.filter='blur(18px)';c.drawImage(bg,0,0,780,1688,-tile.x,-tile.y,390,844);c.filter='none';
    c.fillStyle='rgba(21,21,21,.62)';c.fillRect(0,0,width,164);
    c.strokeStyle='rgba(255,255,255,.10)';c.lineWidth=1;c.beginPath();c.roundRect(.5,.5,width-1,163,19.5);c.stroke();
    c.drawImage(icons[index],width/2-36,14,72,72);c.textAlign='center';c.textBaseline='middle';
    c.fillStyle='#fff';c.font='500 14px Manrope';c.fillText(tile.name,width/2,102);
    c.fillStyle='#a3a3a3';c.font='400 12px Manrope';c.fillText('Kommt später',width/2,130);
    return card;
  });
  const cards=allCards.slice(0,TILES.length);
  const pages=[TILES,SECOND_PAGE].map((tiles,page)=>{
    const c=make(390,844),p=c.getContext('2d');
    tiles.forEach((tile,index)=>p.drawImage(allCards[index+(page?TILES.length:0)],tile.x*2,tile.y*2));return c;
  });
  const display=make(390,844),d=display.getContext('2d');
  const paint=(page=null,offset=0)=>{
    d.clearRect(0,0,780,1688);d.drawImage(base,0,0);
    if(page!==null){
      d.save();d.beginPath();d.rect(0,224,780,1096);d.clip();
      d.drawImage(pages[page],offset*780,0);
      if(offset!==0)d.drawImage(pages[1-page],(offset-Math.sign(offset))*780,0);
      d.restore();
    }
    for(let i=0;i<2;i++){d.fillStyle=i===(page||0)?'#fff':'#6b6b6b';d.beginPath();d.arc((185+i*20)*2,1408,8,0,Math.PI*2);d.fill();}
  };
  paint();
  return {base,cards,pages,display,paint};
}
