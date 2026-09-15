const clamp=value=>Math.min(1,Math.max(0,value));

// Start only when the complete card journey releases its shared pin. Measuring
// the outer scene keeps the fade independent of the cards' individual 3D poses.
export function roadmapExitState({sceneBottom,contentHeight,height,horizontal=true,reduced=false,printing=false}){
  const enabled=horizontal&&!reduced&&!printing&&height>0;
  const progress=enabled?clamp((contentHeight-sceneBottom)/(height*.42)):0;
  const opacity=clamp(1-progress*progress*(3-2*progress));
  return {progress,opacity,hidden:opacity===0};
}

export function createRoadmapExit({win=window,doc=document}={}){
  const scene=doc.querySelector('.roadmap-scroll-scene');
  const content=scene?.querySelector('.roadmap-scene-sticky');
  if(!content||!doc.querySelector('[data-shared-footer]')||!win.ResizeObserver)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const originalOpacity=content.style.opacity,originalInert=content.inert;
  let frame=null,disposed=false,printing=false;
  function update(){
    if(disposed)return;
    const state=roadmapExitState({sceneBottom:scene.getBoundingClientRect().bottom,
      contentHeight:content.getBoundingClientRect().height,height:win.innerHeight,
      horizontal:scene.classList.contains('scene-horizontal'),reduced:reduced.matches,printing});
    content.style.opacity=state.opacity===1?originalOpacity:String(state.opacity);
    // Fully invisible links must not catch clicks or keyboard focus. Native
    // scrolling back restores them; no remembered 'has played' state is used.
    content.inert=originalInert||state.hidden;
  }
  function schedule(){
    if(!disposed&&frame===null)frame=win.requestAnimationFrame(()=>{frame=null;update();});
  }
  function beforePrint(){printing=true;update();}
  function afterPrint(){printing=false;schedule();}
  const observer=new win.ResizeObserver(schedule);observer.observe(scene);observer.observe(content);
  win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',schedule);
  win.addEventListener('pageshow',schedule);win.addEventListener('beforeprint',beforePrint);
  win.addEventListener('afterprint',afterPrint);reduced.addEventListener('change',schedule);
  update();schedule();
  return {update,dispose(){
    disposed=true;if(frame!==null)win.cancelAnimationFrame(frame);observer.disconnect();
    win.removeEventListener('scroll',schedule);win.removeEventListener('resize',schedule);
    win.removeEventListener('pageshow',schedule);win.removeEventListener('beforeprint',beforePrint);
    win.removeEventListener('afterprint',afterPrint);reduced.removeEventListener('change',schedule);
    content.style.opacity=originalOpacity;content.inert=originalInert;
  }};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapExit();
