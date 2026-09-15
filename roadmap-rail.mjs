import {PIN_TOP,clamp,railPosition,railMetrics,railCardPose,railCenterOffset,railStopScroll} from './roadmap-rail-model.mjs';

export function createRoadmapRail({win=window,doc=document}={}){
  const section=doc.querySelector('.journey-open');if(!section)return null;
  const scene=doc.querySelector('.roadmap-scroll-scene'),sticky=doc.querySelector('.roadmap-scene-sticky'),track=section.querySelector('.roadmap-packages');
  const nav=section.querySelector('.journey-nav'),cards=[...track.children],links=[...nav.querySelectorAll('a')];
  if(!scene||!sticky||cards.length<2||!win.ResizeObserver)return null;
  const entryHash='#'+section.id,entryLinks=[...doc.querySelectorAll('a[href="'+entryHash+'"]')];
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,frame=null,layoutFrame=null,enabled=false,printing=false,unit=1,travel=0,start=0,pitch=0,center=0,active=-1,lastBox='',hashPending=win.location.hash===entryHash||/^#paket-[A-G]$/.test(win.location.hash),restoreIndex=null;
  const depthProperties=['--plate-y','--plate-z','--plate-rotate','--plate-opacity','--plate-edge-x','--plate-edge-alpha','--plate-shadow-y'];
  function clearDepth(){cards.forEach(card=>depthProperties.forEach(key=>card.style.removeProperty(key)));}
  const boxKey=()=>`${sticky.getBoundingClientRect().width}:${sticky.getBoundingClientRect().height}`;
  const indexForHash=()=>cards.findIndex(card=>'#'+card.id===win.location.hash);
  function mark(index){
    if(index===active)return;active=index;
    links.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  function update(){
    frame=null;if(disposed||!enabled)return;
    const position=railPosition(win.scrollY-start,unit,cards.length);
    track.style.setProperty('--journey-x',`${center-position*pitch}px`);
    cards.forEach((card,index)=>{
      const pose=railCardPose(index,position);
      card.style.setProperty('--plate-z',`${pose.z}px`);card.style.setProperty('--plate-y',`${pose.y}px`);
      card.style.setProperty('--plate-rotate',`${pose.rotateY}deg`);card.style.setProperty('--plate-opacity',String(pose.opacity));
      card.style.setProperty('--plate-edge-x',`${pose.edgeX}px`);card.style.setProperty('--plate-edge-alpha',String(.23+.13*pose.focus));
      card.style.setProperty('--plate-shadow-y',`${12+8*pose.focus}px`);
    });
    mark(Math.round(position));
  }
  function scroll(){if(!disposed&&enabled&&frame===null)frame=win.requestAnimationFrame(update);}
  function go(index,{history=false,focus=false}={}){
    if(index<0||index>=cards.length)return;
    if(history&&win.location.hash!=='#'+cards[index].id)win.history.pushState(null,'','#'+cards[index].id);
    if(enabled){win.scrollTo({top:start+railStopScroll(index,unit),behavior:'instant'});update();}
    else cards[index].scrollIntoView({block:'start',behavior:'instant'});
    mark(index);if(focus)cards[index].focus({preventScroll:true});
  }
  function enter({history=false,focus=false}={}){
    if(history&&win.location.hash!==entryHash)win.history.pushState(null,'',entryHash);
    if(enabled)go(0);
    else section.scrollIntoView({block:'start',behavior:'instant'});
    if(focus)section.focus({preventScroll:true});
  }
  function layout(){
    layoutFrame=null;if(disposed)return;
    const wasEnabled=enabled,oldUnit=unit,oldScroll=win.scrollY-start,inside=wasEnabled&&oldScroll>=0&&oldScroll<=travel;
    const candidate=win.innerWidth>=1100&&win.innerHeight>=760&&!reduced.matches&&!printing;
    section.classList.toggle('journey-wide',candidate);
    scene.classList.toggle('scene-wide',candidate);
    const metrics=railMetrics({width:win.innerWidth,height:win.innerHeight,contentHeight:sticky.getBoundingClientRect().height,count:cards.length,reduced:reduced.matches,printing});
    enabled=candidate&&metrics.enabled;
    section.classList.toggle('journey-wide',enabled);section.classList.toggle('journey-horizontal',enabled);
    scene.classList.toggle('scene-wide',enabled);scene.classList.toggle('scene-horizontal',enabled);
    if(enabled){
      unit=metrics.unit;travel=metrics.travel;scene.style.setProperty('--journey-height',`${metrics.height}px`);
      start=Math.max(0,scene.getBoundingClientRect().top+win.scrollY-PIN_TOP);
      pitch=cards[1].offsetLeft-cards[0].offsetLeft;
      center=railCenterOffset(track.clientWidth,cards[0].offsetWidth);
    }else{scene.style.removeProperty('--journey-height');track.style.removeProperty('--journey-x');clearDepth();}
    // Record the final layout so observer notifications caused by our own mode
    // switch do not repeatedly probe/restore an over-height horizontal layout.
    lastBox=boxKey();
    if(hashPending){hashPending=false;if(win.location.hash===entryHash)enter();else go(indexForHash());}
    else if(restoreIndex!==null&&!printing){const index=restoreIndex;restoreIndex=null;go(index);}
    else if(inside&&enabled&&!printing){
      // Font/layout notifications must not snap a partially scrolled card to
      // an integer stop. Only rescale scroll when the viewport changes tempo.
      if(oldUnit!==unit)win.scrollTo({top:start+clamp(oldScroll/oldUnit*unit,0,travel),behavior:'instant'});
      update();
    }
    else if(enabled)update();
    else mark(indexForHash());
  }
  function scheduleLayout(){if(!disposed&&layoutFrame===null)layoutFrame=win.requestAnimationFrame(layout);}
  function hash(){if(win.location.hash===entryHash){enter({focus:true});return;}const index=indexForHash();if(index>=0)go(index,{focus:true});}
  function entryClick(event){
    if(!enabled||event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();enter({history:true,focus:true});
  }
  function click(event){
    if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a');const index=links.indexOf(link);if(index<0)return;
    event.preventDefault();go(index,{history:true,focus:true});
  }
  function keyboard(event){
    const index=links.indexOf(event.target.closest('a'));if(index<0)return;
    let next;
    if(event.key==='ArrowRight')next=clamp(index+1,0,cards.length-1);
    else if(event.key==='ArrowLeft')next=clamp(index-1,0,cards.length-1);
    else if(event.key==='Home')next=0;else if(event.key==='End')next=cards.length-1;else return;
    event.preventDefault();go(next,{history:true});links[next].focus({preventScroll:true});
  }
  function beforePrint(){restoreIndex=enabled?Math.max(0,active):null;printing=true;layout();}
  function afterPrint(){printing=false;scheduleLayout();}
  const observer=new win.ResizeObserver(()=>{if(boxKey()!==lastBox)scheduleLayout();});observer.observe(sticky);
  nav.addEventListener('click',click);nav.addEventListener('keydown',keyboard);
  entryLinks.forEach(link=>link.addEventListener('click',entryClick));
  win.addEventListener('scroll',scroll,{passive:true});win.addEventListener('resize',scheduleLayout);
  win.addEventListener('hashchange',hash);win.addEventListener('popstate',hash);win.addEventListener('pageshow',scheduleLayout);
  win.addEventListener('beforeprint',beforePrint);win.addEventListener('afterprint',afterPrint);reduced.addEventListener('change',scheduleLayout);
  doc.fonts?.ready?.then(scheduleLayout);layout();
  return {layout,go,get enabled(){return enabled;},get active(){return active;},dispose(){
    disposed=true;observer.disconnect();if(frame!==null)win.cancelAnimationFrame(frame);if(layoutFrame!==null)win.cancelAnimationFrame(layoutFrame);
    nav.removeEventListener('click',click);nav.removeEventListener('keydown',keyboard);
    entryLinks.forEach(link=>link.removeEventListener('click',entryClick));
    win.removeEventListener('scroll',scroll);win.removeEventListener('resize',scheduleLayout);win.removeEventListener('hashchange',hash);win.removeEventListener('popstate',hash);win.removeEventListener('pageshow',scheduleLayout);
    win.removeEventListener('beforeprint',beforePrint);win.removeEventListener('afterprint',afterPrint);reduced.removeEventListener('change',scheduleLayout);
    section.classList.remove('journey-wide','journey-horizontal');scene.classList.remove('scene-wide','scene-horizontal');scene.style.removeProperty('--journey-height');track.style.removeProperty('--journey-x');clearDepth();mark(-1);
  }};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapRail();
