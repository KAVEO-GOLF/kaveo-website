export const PLATE_DURATION=1000;

// The image remains viewport-sized. Only its containing scroll range follows
// the reading section, so opening a package never zooms or stretches the photo.
export function extendRoadmapLandscape({win=window,doc=document}={}){
  const landscape=doc.querySelector?.('.roadmap-landscape');
  const journey=doc.querySelector?.('.roadmap-journey');
  const picture=landscape?.querySelector('img');
  if(!landscape||!journey||!picture||typeof win.ResizeObserver!=='function')return null;
  let pending=null,disposed=false,lastHeight=0;
  const frame=doc.createElement('div');frame.className='roadmap-landscape-frame';
  function measure(){
    pending=null;if(disposed)return;
    const range=doc.querySelector?.('.roadmap-scroll-scene')||journey;
    const height=Math.ceil(range.getBoundingClientRect().bottom-landscape.getBoundingClientRect().top);
    if(!Number.isFinite(height)||height<=0||height===lastHeight)return;
    landscape.style.setProperty('--journey-landscape-height',`${height}px`);lastHeight=height;
    if(!frame.parentNode){landscape.appendChild(frame);frame.appendChild(picture);}
    landscape.classList.add('has-journey-landscape');
  }
  function schedule(){if(!disposed&&pending===null)pending=win.requestAnimationFrame(measure);}
  const observer=new win.ResizeObserver(schedule);
  // The main also covers changes above the journey (fonts, responsive intro).
  for(const el of [journey,doc.querySelector('.roadmap-main')])if(el)observer?.observe(el);
  journey.addEventListener('toggle',schedule,true);win.addEventListener('resize',schedule);win.addEventListener('pageshow',schedule);
  doc.fonts?.ready?.then(schedule);measure();
  return {dispose(){
    disposed=true;observer?.disconnect();if(pending!==null)win.cancelAnimationFrame(pending);
    journey.removeEventListener('toggle',schedule,true);win.removeEventListener('resize',schedule);win.removeEventListener('pageshow',schedule);
    if(frame.parentNode)frame.replaceWith(picture);
    landscape.classList.remove('has-journey-landscape');landscape.style.removeProperty('--journey-landscape-height');
  }};
}

// Animate an inner shell, never the plate itself: its rim and outside markers
// remain visible. Without JS/WAAPI the original native disclosure still works.
export function enhanceGlassPlate(details,{win=window,doc=document,reduced=win.matchMedia('(prefers-reduced-motion: reduce)')}={}){
  const summary=details.querySelector('summary'),content=details.querySelector('.package-body');
  if(!summary||!content)return null;
  const fold=doc.createElement('div');fold.className='package-fold';
  details.appendChild(fold);fold.appendChild(content);details.classList.add('has-plate-fold');
  let target=details.open,animation=null,disposed=false;
  fold.inert=!target;
  function settle(open){
    target=open;const previous=animation;animation=null;
    if(previous){previous.onfinish=null;previous.cancel();}
    details.open=open;fold.inert=!open;details.classList.remove('plate-is-moving');
    fold.style.removeProperty('height');fold.style.removeProperty('opacity');
  }
  function setOpen(open,{animate=true}={}){
    if(disposed)return;
    const from=details.open?fold.getBoundingClientRect().height:0;
    const fromOpacity=details.open?Number(win.getComputedStyle?.(fold)?.opacity??1):0;
    if(animation){animation.onfinish=null;animation.cancel();animation=null;}
    target=open;
    if(!open&&fold.contains(doc.activeElement))summary.focus({preventScroll:true});
    if(!animate||reduced.matches||doc.hidden||typeof fold.animate!=='function'){settle(open);return;}
    details.open=true;fold.inert=!open;
    const to=open?fold.getBoundingClientRect().height:0;
    if(Math.abs(to-from)<1){settle(open);return;}
    details.classList.add('plate-is-moving');
    try{
      const current=fold.animate([{height:`${from}px`,opacity:fromOpacity},{height:`${to}px`,opacity:open?1:0}],{duration:PLATE_DURATION,easing:'cubic-bezier(.25,.1,.25,1)',fill:'both'});
      animation=current;
      current.onfinish=()=>{if(animation===current&&!disposed)settle(open);};
    }catch{settle(open);}
  }
  function click(event){
    if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    // Native keyboard activation of summary also arrives as a click.
    event.preventDefault();setOpen(!target);
  }
  function toggle(){
    if(animation){if(!details.open)settle(false);return;}
    target=details.open;fold.inert=!target;
  }
  const stop=()=>settle(target);
  const motion=()=>{if(reduced.matches)stop();};
  const hidden=()=>{if(doc.hidden)stop();};
  summary.addEventListener('click',click);details.addEventListener('toggle',toggle);
  reduced.addEventListener('change',motion);win.addEventListener('resize',stop);win.addEventListener('pagehide',stop);doc.addEventListener('visibilitychange',hidden);
  return {setOpen,get open(){return target;},dispose(){
    settle(target);disposed=true;summary.removeEventListener('click',click);details.removeEventListener('toggle',toggle);
    reduced.removeEventListener('change',motion);win.removeEventListener('resize',stop);win.removeEventListener('pagehide',stop);doc.removeEventListener('visibilitychange',hidden);
    fold.replaceWith(content);details.classList.remove('has-plate-fold');
  }};
}

export function createRoadmapGlass({win=window,doc=document}={}){
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const records=[...doc.querySelectorAll('.roadmap-package')].map(details=>({details,controller:enhanceGlassPlate(details,{win,doc,reduced})})).filter(r=>r.controller);
  const hash=()=>{if(!/^#paket-[A-G]$/.test(win.location.hash))return;records.find(r=>r.details.id===win.location.hash.slice(1))?.controller.setOpen(true,{animate:false});};
  win.addEventListener('hashchange',hash);win.addEventListener('popstate',hash);hash();
  const landscape=extendRoadmapLandscape({win,doc});
  return {dispose(){win.removeEventListener('hashchange',hash);win.removeEventListener('popstate',hash);landscape?.dispose();records.forEach(r=>r.controller.dispose());}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapGlass();
