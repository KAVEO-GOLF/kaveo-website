import {IDS,EDGES,MOTION,idFromHash,cardSize,poseFor,canAnimate} from './roadmap-space-model.mjs';
import {cardMatrix,connectionGeometry,bezier3D,projectPoint} from './network-space.mjs';
import {createElasticLinks} from './network-elastic.mjs';

export function createRoadmapSpace({win=window,doc=document}={}){
  const stage=doc.querySelector('.path-stage'),body=doc.body;
  if(!stage||!body)return null;
  const cards=[...stage.querySelectorAll('[data-package]')],panels=[...doc.querySelectorAll('[data-package-panel]')];
  const wires=stage.querySelector('.path-wires'),paths=[...wires.querySelectorAll('path')];
  const motion=doc.getElementById('path-motion'),video=doc.getElementById('path-video');
  const announcement=doc.getElementById('path-announcement'),header=doc.querySelector('.site-header');
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),narrow=win.matchMedia('(max-width: 1100px)');
  const connection=win.navigator?.connection,elastic=createElasticLinks();
  let selected=idFromHash(win.location.hash),paused=false,inView=true,disposed=false,reading=false,pageHidden=false;
  let width=0,height=680,box=cardSize(700),raf=0,last=0,seconds=0,poses={},loaded=false,videoFailed=false,playPending=false,resumeRequested=false;
  const cleanups=[];
  const on=(target,type,handler,options)=>{target?.addEventListener?.(type,handler,options);cleanups.push(()=>target?.removeEventListener?.(type,handler,options));};
  const still=()=>reduced.matches||narrow.matches||Boolean(connection?.saveData);
  const ambient=()=>canAnimate({reduced:reduced.matches,narrow:narrow.matches,saveData:Boolean(connection?.saveData),paused,hidden:doc.hidden||pageHidden,inView,reading});
  const transitions=()=>!still()&&!paused&&!doc.hidden&&!pageHidden&&inView;
  function syncVideo(){
    motion.hidden=still();motion.textContent=paused?'Bewegung fortsetzen':'Bewegung pausieren';
    motion.setAttribute('aria-pressed',String(paused));
    if(!video)return;
    if(!ambient()||videoFailed){resumeRequested=false;video.pause();if(still()||videoFailed)video.classList.remove('is-ready');return;}
    if(!loaded){video.muted=true;video.defaultMuted=true;video.src=video.dataset.src;loaded=true;}
    if(playPending){resumeRequested=true;return;}
    if(!video.paused)return;
    playPending=true;
    Promise.resolve(video.play()).then(()=>{if(disposed||!ambient())video.pause();}).catch(error=>{
      if(error?.name!=='AbortError'&&ambient()&&!disposed){videoFailed=true;video.classList.remove('is-ready');}
    }).finally(()=>{playPending=false;if(resumeRequested&&!disposed){resumeRequested=false;syncVideo();}});
  }
  function paint(instant=false,dt=1/60){
    if(narrow.matches||width<=0){wires.hidden=true;cards.forEach(card=>{card.style.removeProperty('transform');card.style.removeProperty('width');card.style.removeProperty('z-index');});return false;}
    wires.hidden=false;wires.setAttribute('viewBox',`0 0 ${width} ${height}`);
    let moving=false;
    cards.forEach(card=>{
      const id=card.dataset.package,target=poseFor(id,selected,seconds,height,{still:still()});
      let pose=poses[id];
      if(instant||!pose)pose={...target};else{
        const alpha=1-Math.exp(-dt*MOTION.settleRate);
        for(const key of ['x','y','z','rx','ry','scale']){const delta=target[key]-pose[key];pose[key]+=delta*alpha;if(Math.abs(delta)>.001)moving=true;else pose[key]=target[key];}
      }
      poses[id]=pose;card.style.width=`${box.width}px`;card.style.zIndex=String(100+Math.round(pose.z));
      card.style.transform=`matrix3d(${cardMatrix(pose,box,width,height).join(',')})`;
    });
    EDGES.forEach(([a,b,side],i)=>{
      const geometry=connectionGeometry(poses[a],poses[b],box,box,width,height,undefined,side);
      const spring=elastic.update(`${a}-${b}`,geometry,dt,instant);moving=moving||spring.moving;
      const points=Array.from({length:31},(_,j)=>projectPoint(bezier3D(spring.controls,j/30),width,height));
      paths[i].setAttribute('d',points.map((p,j)=>`${j?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
      paths[i].classList.toggle('is-selected',a===selected||b===selected);
    });
    return moving;
  }
  function frame(now){
    raf=0;if(disposed)return;
    const dt=Math.min(.045,Math.max(.001,(now-(last||now-16))/1000));last=now;
    if(ambient())seconds+=dt;
    const moving=paint(!transitions(),dt);
    if(ambient()||(moving&&transitions()))raf=win.requestAnimationFrame(frame);else last=0;
  }
  function request(){if(!disposed&&!raf)raf=win.requestAnimationFrame(frame);}
  function measure(){
    const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height||680;box=cardSize(width);
    body.classList.toggle('path-reduced',still()||paused);paint(true);syncVideo();request();
  }
  function readingChanged(){reading=Boolean(panels.find(p=>p.dataset.packagePanel===selected)?.querySelector('details')?.open);syncVideo();request();}
  function select(id,{navigate=false,focus=false,announce=false}={}){
    if(!IDS.includes(id))return false;
    const oldPanel=panels.find(p=>p.dataset.packagePanel===selected);
    const focusWasHidden=oldPanel?.contains(doc.activeElement)&&id!==selected;
    selected=id;
    panels.forEach(panel=>panel.hidden=panel.dataset.packagePanel!==id);
    cards.forEach(card=>{if(card.dataset.package===id)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');});
    if(navigate&&win.location.hash!==`#weg-${id}`)win.history.pushState(null,'',`#weg-${id}`);
    const panel=panels.find(p=>p.dataset.packagePanel===id),heading=panel.querySelector('h2');
    if(announce)announcement.textContent=`${heading.textContent} Geplantes Paket ${id}.`;
    if(focus||focusWasHidden){heading.focus({preventScroll:true});if(narrow.matches)panel.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});}
    readingChanged();
    if(!still()&&!paused&&!reduced.matches)panel.animate?.([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'none'}],{duration:MOTION.panelDuration,easing:'cubic-bezier(.25,.1,.25,1)'});
    return true;
  }
  function navigate(event){
    if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const card=event.target.closest('[data-package]');if(!card||!stage.contains(card))return;
    event.preventDefault();select(card.dataset.package,{navigate:true,focus:narrow.matches,announce:true});
  }
  const history=()=>select(idFromHash(win.location.hash),{announce:true});
  const sync=()=>{body.classList.toggle('path-reduced',still()||paused);syncVideo();request();};
  const headerSync=()=>header?.classList.toggle('is-scrolled',win.scrollY>64);
  body.classList.add('path-enhanced');
  select(selected);measure();headerSync();
  on(stage,'click',navigate);on(win,'hashchange',history);on(win,'popstate',history);
  on(motion,'click',()=>{paused=!paused;sync();});
  panels.forEach(panel=>on(panel.querySelector('details'),'toggle',readingChanged));
  on(reduced,'change',measure);on(narrow,'change',measure);on(connection,'change',measure);
  on(doc,'visibilitychange',sync);on(win,'pageshow',()=>{pageHidden=false;measure();headerSync();});on(win,'pagehide',()=>{pageHidden=true;syncVideo();if(raf)win.cancelAnimationFrame(raf);raf=0;last=0;});
  on(win,'scroll',headerSync,{passive:true});on(win,'resize',measure,{passive:true});
  on(video,'playing',()=>{if(ambient()&&!disposed)video.classList.add('is-ready');else video.pause();});
  on(video,'error',()=>{videoFailed=true;syncVideo();});
  let resizeObserver,intersectionObserver;
  if(win.ResizeObserver){resizeObserver=new win.ResizeObserver(measure);resizeObserver.observe(stage);}
  if(win.IntersectionObserver){intersectionObserver=new win.IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();});intersectionObserver.observe(stage);}
  return {select,get selected(){return selected;},get paused(){return paused;},dispose(){
    disposed=true;if(raf)win.cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());resizeObserver?.disconnect();intersectionObserver?.disconnect();video?.pause();
    panels.forEach(panel=>panel.hidden=false);cards.forEach(card=>{card.style.removeProperty('transform');card.style.removeProperty('width');card.removeAttribute('aria-current');});
    wires.hidden=true;motion.hidden=true;body.classList.remove('path-enhanced','path-reduced');
  }};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapSpace();
