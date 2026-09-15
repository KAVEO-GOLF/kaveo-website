import {createAboutMotion} from './about-motion.mjs';
import {createRoadmapVideo} from './roadmap-video.mjs';

// Reading feedback only: it never hides text, advances a slide or intercepts
// scrolling. The same geometry produces the same state in either direction.
export function editorialReadingState({top,bottom,stepTops=[],height,reduced=false,printing=false}){
  const neutral={progress:0,active:-1};
  if(reduced||printing||![top,bottom,height,...stepTops].every(Number.isFinite)||height<=0||bottom<=top||!stepTops.length)return neutral;
  const focus=height*.48;
  const progress=Math.max(0,Math.min(1,(focus-top-12)/Math.max(1,bottom-top-34)));
  const active=top>=height||bottom<=0?-1:Math.max(0,stepTops.reduce((index,y,i)=>y<=focus?i:index,-1));
  return {progress,active};
}

export function createEditorialReading({win=window,doc=document}={}){
  const page=doc.querySelector('.about-editorial'),list=page?.querySelector('.editorial-story-list');
  if(!list)return null;
  const steps=[...list.querySelectorAll('[data-editorial-step]')];
  const previous=steps.map(step=>step.classList.contains('is-current'));
  const originalProgress=list.style.getPropertyValue('--editorial-progress');
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=null,disposed=false,printing=false;
  function update(){
    if(disposed)return;
    const {top,bottom}=list.getBoundingClientRect();
    const stepTops=steps.map(step=>step.getBoundingClientRect().top);
    const state=editorialReadingState({top,bottom,stepTops,height:win.innerHeight,reduced:reduced.matches,printing});
    list.style.setProperty('--editorial-progress',state.progress.toFixed(5));
    steps.forEach((step,index)=>step.classList.toggle('is-current',state.active===index));
  }
  function schedule(){if(!disposed&&frame===null)frame=win.requestAnimationFrame(()=>{frame=null;update();});}
  function beforePrint(){printing=true;if(frame!==null){win.cancelAnimationFrame(frame);frame=null;}update();}
  function afterPrint(){printing=false;schedule();}
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
  observer?.observe(list);
  for(const name of ['scroll','resize','pageshow'])win.addEventListener(name,schedule,{passive:true});
  win.addEventListener('beforeprint',beforePrint);win.addEventListener('afterprint',afterPrint);
  reduced.addEventListener('change',schedule);doc.fonts?.ready?.then(schedule);update();
  return {update,dispose(){
    disposed=true;if(frame!==null)win.cancelAnimationFrame(frame);observer?.disconnect();
    for(const name of ['scroll','resize','pageshow'])win.removeEventListener(name,schedule);
    win.removeEventListener('beforeprint',beforePrint);win.removeEventListener('afterprint',afterPrint);
    reduced.removeEventListener('change',schedule);
    originalProgress?list.style.setProperty('--editorial-progress',originalProgress):list.style.removeProperty('--editorial-progress');
    steps.forEach((step,index)=>step.classList.toggle('is-current',previous[index]));
  }};
}

// The founder clip remains a calm visual companion: no motion for users who
// request reduced motion, and no playback while the portrait is off-screen.
export function createAboutPortraitVideo({win=window,doc=document}={}){
  const video=doc.querySelector('[data-about-portrait-video]');
  if(!video)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=win.navigator?.connection,removers=[];
  const listen=(target,name,handler)=>{target?.addEventListener?.(name,handler);removers.push(()=>target?.removeEventListener?.(name,handler));};
  let visible=false,disposed=false,pageHidden=false,pending=false;
  function stop(){video.pause();}
  const allowed=()=>!disposed&&!reduced.matches&&!connection?.saveData&&!doc.hidden&&!pageHidden&&visible;
  function update(){
    if(!allowed()){stop();return;}
    // Keeping the URL in data-src also prevents eager mobile downloads before JS.
    if(!video.getAttribute('src')&&video.dataset.src){video.src=video.dataset.src;video.load();}
    if(pending||!video.paused)return;
    pending=true;
    Promise.resolve(video.play()).catch(()=>{}).finally(()=>{pending=false;if(!allowed())stop();});
  }
  function measure(){const box=video.getBoundingClientRect();visible=box.bottom>0&&box.top<win.innerHeight;update();}
  const observer=typeof win.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>{
    visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.12);
    update();
  },{threshold:[0,.12] }):null;
  if(observer)observer.observe(video);else {measure();listen(win,'scroll',measure);listen(win,'resize',measure);}
  listen(reduced,'change',update);listen(connection,'change',update);listen(doc,'visibilitychange',update);
  listen(win,'pagehide',()=>{pageHidden=true;update();});listen(win,'pageshow',()=>{pageHidden=false;update();});
  listen(video,'loadedmetadata',update);
  listen(video,'playing',()=>{if(!allowed())stop();});
  update();
  return {dispose(){
    disposed=true;stop();observer?.disconnect();removers.forEach(remove=>remove());
  }};
}

export function createAboutEditorial({win=window,doc=document}={}){
  if(!doc.querySelector('.about-editorial'))return null;
  const motion=createAboutMotion({win,doc});
  const reading=createEditorialReading({win,doc});
  const portraitVideo=createAboutPortraitVideo({win,doc});
  const video=createRoadmapVideo({win,doc,scope:'.about-editorial',includeFooter:false});
  return {dispose(){portraitVideo?.dispose();reading?.dispose();motion?.dispose();video?.dispose();}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createAboutEditorial();
