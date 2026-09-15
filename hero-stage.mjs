import {clamp,flightScrollWindow} from './green-ball-flight.mjs';

// The exit is a pure scroll pose, independent of the once-only entrance clock.
export function heroExit(scrollY,heroTop,sceneHeight) {
  const flight=flightScrollWindow(heroTop,sceneHeight);
  const start=flight.start+clamp(sceneHeight*.035,24,40);
  const end=flight.impactStart-clamp(sceneHeight*.05,24,48);
  const progress=clamp((scrollY-start)/(end-start));
  const eased=progress*progress*(3-2*progress);
  return {start,end,progress,opacity:1-eased,offset:-clamp(sceneHeight*.045,28,48)*eased};
}

export function heroEntrance(mobile=false) {
  if(mobile)return Array.from({length:3},()=>({duration:320,delay:0,offset:0}));
  return [
    {duration:680,delay:0,offset:18},
    {duration:680,delay:110,offset:18},
    {duration:680,delay:220,offset:18},
    {duration:520,delay:360,offset:12},
    {duration:520,delay:440,offset:10}
  ];
}

// Wrap only the existing BR-separated lines, never duplicate or retype the text.
// The original accent span remains inside line three with its original color.
export function wrapHeroLines(heading,doc) {
  const lines=[];
  let group=[];
  const flush=()=>{
    if(!group.length)return;
    const line=doc.createElement('span');
    line.classList.add('hero-line');
    heading.insertBefore(line,group[0]);
    group.forEach(node=>line.appendChild(node));
    lines.push(line);
    group=[];
  };
  for(const node of [...heading.childNodes]) {
    if(node.nodeName==='BR')flush();
    else group.push(node);
  }
  flush();
  return lines;
}

export function createHeroStage({win=window,doc=document}={}) {
  const hero=doc.getElementById('start');
  const copy=hero?.querySelector('.story-hero-copy');
  const heading=copy?.querySelector('h1');
  const lead=copy?.querySelector('.story-lead');
  const cta=copy?.querySelector('.story-cta');
  const media=doc.querySelector('.story-scene-media');
  // Default HTML is fully visible, also without JS or this optional browser API.
  if(!hero||!copy||!heading||!lead||!cta||!media||typeof copy.animate!=='function')return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=win.matchMedia('(max-width: 720px)');
  const connection=win.navigator.connection;
  const url=new URL(win.location.href);
  const disabled=url.searchParams.get('ball')==='aus';
  const listeners=[],animations=new Set();
  let frame=0,disposed=false,lines=[];
  const staticMode=()=>reduced.matches||connection?.saveData||disabled;
  const listen=(target,event,fn)=>{
    target?.addEventListener?.(event,fn,{passive:true});
    listeners.push(()=>target?.removeEventListener?.(event,fn));
  };
  function stopEntrance() {
    for(const animation of animations)animation.cancel();
    animations.clear();
  }
  function clearExit() {
    copy.classList.remove('has-hero-scroll','is-hero-cleared');
    copy.style.removeProperty('--hero-scroll-opacity');
    copy.style.removeProperty('--hero-scroll-transform');
  }
  function render() {
    frame=0;
    if(disposed)return;
    if(staticMode()||mobile.matches||!media.clientHeight) { clearExit();return; }
    const state=heroExit(win.scrollY,hero.getBoundingClientRect().top+win.scrollY,media.clientHeight);
    copy.style.setProperty('--hero-scroll-opacity',state.opacity);
    copy.style.setProperty('--hero-scroll-transform',state.progress===0?'none':`translateY(${state.offset}px)`);
    copy.classList.add('has-hero-scroll');
    copy.classList.toggle('is-hero-cleared',state.progress===1);
  }
  const queue=()=>{if(!disposed&&!doc.hidden&&!frame)frame=win.requestAnimationFrame(render);};
  function resetMode() {
    stopEntrance();
    if(frame)win.cancelAnimationFrame(frame);
    frame=0;
    render();
  }
  function enter() {
    const heroTop=hero.getBoundingClientRect().top+win.scrollY;
    const historyRestore=win.performance?.getEntriesByType?.('navigation')?.[0]?.type==='back_forward';
    if(staticMode()||doc.hidden||historyRestore||win.scrollY>heroTop+20||
      (url.hash&&url.hash!=='#start')||copy.contains(doc.activeElement))return;
    let elements;
    if(mobile.matches)elements=[heading,lead,cta];
    else {
      lines=wrapHeroLines(heading,doc);
      elements=[...lines,lead,cta];
    }
    const timings=heroEntrance(mobile.matches);
    // Native, once-only entrance; no CSS animation override of the other stages.
    // Scroll/focus/preferences interrupt it immediately and expose the final text.
    try {
      elements.forEach((element,index)=>{
        const {offset,duration,delay}=timings[index];
        const start={opacity:0};
        const end={opacity:1};
        if(offset) { start.transform=`translateY(${offset}px)`;end.transform='none'; }
        const animation=element.animate([start,end],{
          duration,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'
        });
        animations.add(animation);
        animation.onfinish=()=>animations.delete(animation);
        animation.oncancel=()=>animations.delete(animation);
      });
    } catch { stopEntrance(); }
  }
  listen(win,'scroll',()=>{stopEntrance();queue();});
  listen(win,'resize',resetMode);
  listen(win,'load',queue);
  listen(win,'pageshow',event=>{
    if(event.persisted||win.scrollY>hero.getBoundingClientRect().top+win.scrollY+20)stopEntrance();
    queue();
  });
  listen(doc,'visibilitychange',()=>{
    if(doc.hidden) {
      stopEntrance();
      if(frame)win.cancelAnimationFrame(frame);
      frame=0;
    } else queue();
  });
  listen(copy,'focusin',stopEntrance);
  listen(reduced,'change',resetMode);
  listen(mobile,'change',resetMode);
  listen(connection,'change',resetMode);
  const observer=win.ResizeObserver?new win.ResizeObserver(queue):null;
  observer?.observe(media);
  render();
  enter();
  return {dispose() {
    if(disposed)return;
    disposed=true;
    stopEntrance();
    if(frame)win.cancelAnimationFrame(frame);
    frame=0;
    listeners.forEach(remove=>remove());
    observer?.disconnect();
    clearExit();
    for(const line of lines) {
      while(line.firstChild)heading.insertBefore(line.firstChild,line);
      line.remove();
    }
    lines=[];
  }};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')createHeroStage();
