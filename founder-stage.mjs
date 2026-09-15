import {clamp,scrollProgress,flightScrollWindow} from './green-ball-flight.mjs';

// All poses follow document scroll. No playback clock, tween or recurring RAF.
export function founderReveal(scrollY,heroTop,sceneHeight,sectionTop) {
  const landingEnd=flightScrollWindow(heroTop,sceneHeight).end;
  const start=Math.max(landingEnd+sceneHeight*.06,sectionTop-sceneHeight*.80);
  const span=clamp(sceneHeight*.24,160,280);
  const ease=value=>{const p=clamp(value);return p*p*(3-2*p);};
  const p=(scrollY-start)/span;
  const copy=scrollProgress(scrollY,heroTop,sceneHeight)<1?0:ease(p/.8);
  const image=scrollProgress(scrollY,heroTop,sceneHeight)<1?0:ease(p);
  return {copy,image,copyOffset:8*(1-copy),imageOffset:0,
    imageCut:100*(1-image),imageEdge:102-104*image};
}

// A small shared lift supplements normal document scrolling. The section's
// layout box stays still: entrance/video measurements must never feed back
// from a transformed anchor, and the following stage keeps its exact position.
export function founderExit(scrollY,heroTop,sceneHeight,sectionTop,sectionHeight) {
  if(!(sceneHeight>0&&sectionHeight>0))return {start:0,end:0,progress:0,offset:0,opacity:1};
  const landingEnd=flightScrollWindow(heroTop,sceneHeight).end;
  const entryStart=Math.max(landingEnd+sceneHeight*.06,sectionTop-sceneHeight*.80);
  const entryEnd=entryStart+clamp(sceneHeight*.24,160,280);
  const start=Math.max(entryEnd+sceneHeight*.18,sectionTop+sectionHeight-sceneHeight*.90);
  const end=start+clamp(sceneHeight*.30,220,360);
  const progress=clamp((scrollY-start)/(end-start));
  const eased=progress*progress*(3-2*progress);
  return {start,end,progress,offset:progress===0?0:-clamp(sceneHeight*.085,56,96)*eased,opacity:1-eased};
}

export function createFounderStage({win=window,doc=document}={}) {
  const section=doc.getElementById('erlebnis');
  const hero=doc.getElementById('start');
  const media=doc.querySelector('.story-scene-media');
  if(!section||!hero||!media)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=win.matchMedia('(max-width: 720px)');
  const connection=win.navigator.connection;
  const disabled=new URL(win.location.href).searchParams.get('ball')==='aus';
  const listeners=[];
  let frame=0,disposed=false;
  const listen=(target,event,fn)=>{
    target?.addEventListener?.(event,fn,{passive:true});
    listeners.push(()=>target?.removeEventListener?.(event,fn));
  };
  function render() {
    frame=0;
    if(disposed)return;
    if(reduced.matches||mobile.matches||connection?.saveData||disabled) {
      section.classList.remove('has-scroll-reveal');
      section.classList.remove('is-founder-cleared');
      section.style.removeProperty('--founder-exit-offset');
      section.style.removeProperty('--founder-exit-opacity');
      return;
    }
    const scrollY=win.scrollY;
    const heroTop=hero.getBoundingClientRect().top+scrollY;
    const sectionTop=section.getBoundingClientRect().top+scrollY;
    const state=founderReveal(scrollY,heroTop,media.clientHeight,sectionTop);
    const exit=founderExit(scrollY,heroTop,media.clientHeight,sectionTop,section.clientHeight);
    section.style.setProperty('--founder-copy-opacity',state.copy*exit.opacity);
    section.style.setProperty('--founder-image-opacity',state.image);
    section.style.setProperty('--founder-copy-offset',`${state.copyOffset}px`);
    section.style.setProperty('--founder-image-offset',`${state.imageOffset}px`);
    section.style.setProperty('--founder-image-cut',`${state.imageCut}%`);
    section.style.setProperty('--founder-image-edge',`${state.imageEdge}%`);
    section.style.setProperty('--founder-exit-offset',`${exit.offset}px`);
    section.style.setProperty('--founder-exit-opacity',exit.opacity);
    section.classList.add('has-scroll-reveal');
    section.classList.toggle('is-founder-cleared',exit.progress===1);
  }
  const queue=()=>{if(!disposed&&!frame)frame=win.requestAnimationFrame(render);};
  listen(win,'scroll',queue);
  listen(win,'resize',queue);
  listen(win,'pageshow',queue);
  listen(win,'load',queue);
  listen(reduced,'change',queue);
  listen(mobile,'change',queue);
  listen(connection,'change',queue);
  render();
  return {dispose(){
    disposed=true;
    if(frame)win.cancelAnimationFrame(frame);
    listeners.forEach(remove=>remove());
    section.classList.remove('has-scroll-reveal');
    section.classList.remove('is-founder-cleared');
    section.style.removeProperty('--founder-exit-offset');
    section.style.removeProperty('--founder-exit-opacity');
  }};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')createFounderStage();
