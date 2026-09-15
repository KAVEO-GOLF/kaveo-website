import {clamp,flightScrollWindow} from './green-ball-flight.mjs';
import {founderReveal} from './founder-stage.mjs';

const smooth=value=>{const p=clamp(value);return p*p*(3-2*p);};

export function supportsFounderScene(width,height) {
  const ratio=width/height;
  return width>=1024&&height>=600&&ratio>=1.5&&ratio<=2.15;
}

export function applyFounderComparison(section,params) {
  if(params.get('portraet')!=='karte')return;
  const portrait=section?.querySelector('.story-portrait-field img');
  const figure=section?.querySelector('.story-portrait');
  if(!portrait?.dataset.originalSrc||!figure)return;
  portrait.src=portrait.dataset.originalSrc;
  portrait.width=1792;
  portrait.height=2400;
  portrait.alt='Porträt von Philipp im grünen KAVEO-Golfpolo auf dem Golfplatz; KI-gestütztes Motiv';
  figure.classList.remove('story-portrait--montage');
}

export function founderSceneState(scrollY,{heroTop,sceneHeight,founderTop,productTop}) {
  const entry=founderReveal(scrollY,heroTop,sceneHeight,founderTop).image;
  const start=Math.max(flightScrollWindow(heroTop,sceneHeight).end+sceneHeight*.06,
    founderTop-sceneHeight*.80);
  const entryEnd=start+clamp(sceneHeight*.24,160,280);
  // Keep a full-opacity reading moment, then hand back to the original video
  // as the phone enters. No translated landscape, timer or change to the ball.
  const exitStart=Math.max(entryEnd+sceneHeight*.16,productTop-sceneHeight*.98);
  const exitEnd=exitStart+clamp(sceneHeight*.20,140,220);
  return {opacity:entry*(1-smooth((scrollY-exitStart)/(exitEnd-exitStart))),entryEnd,exitStart,exitEnd};
}

export function createFounderScene({win=window,doc=document}={}) {
  const section=doc.getElementById('erlebnis');
  const params=new URL(win.location.href).searchParams;
  applyFounderComparison(section,params);
  const hero=doc.getElementById('start');
  const image=doc.getElementById('story-founder-scene');
  const media=doc.querySelector('.story-scene-media');
  const product=doc.querySelector('.story-device-figure');
  const copy=section?.querySelector('.story-founder-copy');
  const caption=section?.querySelector('.story-portrait figcaption');
  const button=section?.querySelector('.story-about-button');
  if(!section||!hero||!image||!media||!product||!copy||!caption||!button)return null;
  const disabled=params.get('portraet')==='karte'||params.get('ball')==='aus';
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=win.navigator.connection;
  const credit=doc.createElement('p');
  credit.className='story-founder-scene-credit';
  credit.textContent=caption.textContent;
  credit.hidden=true;
  copy.insertBefore(credit,button);
  const listeners=[];
  let frame=0,disposed=false,requested=false,ready=false,decoding=false,failed=false;
  const listen=(target,event,fn)=>{
    target?.addEventListener?.(event,fn,{passive:true});
    listeners.push(()=>target?.removeEventListener?.(event,fn));
  };
  const fallback=()=>{
    section.classList.remove('has-founder-scene');
    credit.hidden=true;
    image.style.setProperty('--founder-scene-opacity','0');
  };
  const eligible=()=>!disabled&&!reduced.matches&&!connection?.saveData&&
    supportsFounderScene(media.clientWidth,media.clientHeight);
  const queue=()=>{if(!disposed&&!frame)frame=win.requestAnimationFrame(render);};
  function onReady() {
    if(disposed||decoding||ready||failed||!image.naturalWidth)return;
    decoding=true;
    const decoded=typeof image.decode==='function'?image.decode():Promise.resolve();
    Promise.resolve(decoded).then(()=>{
      if(disposed)return;
      decoding=false;ready=true;queue();
    }).catch(onError);
  }
  function onError() {
    if(disposed)return;
    failed=true;ready=false;decoding=false;fallback();
  }
  function render() {
    frame=0;
    if(disposed)return;
    if(!eligible()||failed) { fallback();return; }
    if(!requested) {
      requested=true;
      image.src=image.dataset.src;
      if(image.complete)onReady();
    }
    if(!ready) { fallback();return; }
    // Keep this mode active even at zero opacity: the old card must not flash
    // back after exit. It returns only when this enhancement is unavailable.
    section.classList.add('has-founder-scene');
    credit.hidden=false;
    const scrollY=win.scrollY;
    const absoluteTop=element=>element.getBoundingClientRect().top+scrollY;
    const state=founderSceneState(scrollY,{heroTop:absoluteTop(hero),sceneHeight:media.clientHeight,
      founderTop:absoluteTop(section),productTop:absoluteTop(product)});
    image.style.setProperty('--founder-scene-opacity',String(state.opacity));
  }
  listen(image,'load',onReady);
  listen(image,'error',onError);
  listen(win,'scroll',queue);
  listen(win,'resize',queue);
  listen(win,'pageshow',queue);
  listen(win,'load',queue);
  listen(reduced,'change',queue);
  listen(connection,'change',queue);
  render();
  return {dispose(){
    disposed=true;
    if(frame)win.cancelAnimationFrame(frame);
    listeners.forEach(remove=>remove());
    fallback();credit.remove();
  }};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')createFounderScene();
