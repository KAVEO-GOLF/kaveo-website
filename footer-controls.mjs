// Dock the existing video button only when its footer position is fully visible.
// Its original playback controller, state, accessible name and handlers stay intact.
export function createFooterControls({win=window,doc=document}={}){
  const slot=doc.querySelector('[data-footer-motion-slot]');
  if(!slot)return null;
  let button=null,origin=null,frame=null,disposed=false;
  function move(parent,before=null){
    const focused=doc.activeElement===button;
    parent.insertBefore(button,before);
    if(focused)button.focus({preventScroll:true});
  }
  function measure(){
    if(disposed)return;
    if(!button){
      button=doc.querySelector('.story-video-toggle,.roadmap-video-toggle');
      if(!button)return;
      origin=doc.createComment('Background control position');
      button.before(origin);
    }
    const rect=slot.getBoundingClientRect();
    const dock=rect.width>0&&rect.height>0&&rect.top>=0&&rect.bottom<=win.innerHeight-16;
    if(dock&&button.parentNode!==slot)move(slot);
    else if(!dock&&button.parentNode===slot&&origin.parentNode)move(origin.parentNode,origin.nextSibling);
  }
  function schedule(){
    if(!disposed&&frame===null)frame=win.requestAnimationFrame(()=>{frame=null;measure();});
  }
  // Subpages create their video controls after module initialization.
  const observer=new win.MutationObserver(schedule);
  observer.observe(doc.body,{childList:true});
  win.addEventListener('scroll',schedule,{passive:true});
  win.addEventListener('resize',schedule);
  win.addEventListener('pageshow',schedule);
  measure();
  return {measure,dispose(){
    disposed=true;observer.disconnect();
    if(frame!==null)win.cancelAnimationFrame(frame);
    win.removeEventListener('scroll',schedule);win.removeEventListener('resize',schedule);win.removeEventListener('pageshow',schedule);
    if(button?.parentNode===slot&&origin?.parentNode)move(origin.parentNode,origin.nextSibling);
    origin?.remove();
  }};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createFooterControls();
