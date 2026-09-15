import {assemblyProgress,scrollSpan,clamp,smooth} from './phone-assembly-model.mjs';
import {createPhonePager} from './phone-assembly-pager.mjs';

// Anchor the entrance to the text, not the much higher section edge.
export function phoneCopyReveal(scrollY,copyTop,height) {
  if(!(height>0))return {opacity:1,offset:0};
  const start=copyTop-height*.86,span=clamp(height*.40,280,480);
  const opacity=smooth((scrollY-start)/span);
  return {opacity,offset:8*(1-opacity)};
}

export function phoneCopyExit(scrollY,copyTop,height,leaveStart) {
  if(!(height>0&&Number.isFinite(leaveStart)))return {opacity:1,progress:0,start:0,end:0};
  const entryEnd=copyTop-height*.86+clamp(height*.40,280,480);
  const start=Math.max(entryEnd+clamp(height*.20,120,240),leaveStart);
  const end=start+clamp(height*.30,220,360);
  const progress=clamp((scrollY-start)/(end-start));
  return {opacity:1-smooth(progress),progress,start,end};
}

export function createPhoneAssembly({win=window,doc=document,loadRenderer,makePager=createPhonePager}={}) {
  const section=doc.getElementById('deine-app');
  const viewport=section?.querySelector('.assembly-viewport');
  const panel=section?.querySelector('.story-product-inner');
  const copy=section?.querySelector('.story-product-copy');
  const figure=section?.querySelector('.story-device-figure');
  const canvas=viewport?.querySelector('canvas');
  if(!section||!viewport||!panel||!copy||!figure||!canvas)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),connection=win.navigator.connection;
  const disabled=new URL(win.location.href).searchParams.get('ball')==='aus';
  const load=loadRenderer||(()=>import('./phone-assembly-renderer.mjs').then(module=>module.createAssemblyRenderer(canvas,{doc})));
  let renderer=null,pending=false,failed=false,disposed=false,layoutRejected=false,frame=0;
  const listeners=[];
  const listen=(target,type,fn)=>{target?.addEventListener?.(type,fn,{passive:true});listeners.push(()=>target?.removeEventListener?.(type,fn));};
  const staticMode=()=>disabled||reduced.matches||connection?.saveData||win.innerHeight<680;
  const clearCopy=()=>{section.classList.remove('has-assembly-copy-reveal','is-assembly-copy-cleared');
    section.style.removeProperty('--assembly-copy-opacity');section.style.removeProperty('--assembly-copy-offset');};
  const revealCopy=()=>{
    if(disposed||disabled||reduced.matches||connection?.saveData||win.innerWidth<=720){clearCopy();return;}
    // Neutralize the previous visual offset before reading the natural layout.
    section.style.setProperty('--assembly-copy-offset','0px');
    const y=win.scrollY,height=win.innerHeight,copyBox=copy.getBoundingClientRect();
    const sectionBox=section.getBoundingClientRect(),pinned=section.classList.contains('has-phone-assembly');
    const copyTop=pinned
      ?sectionBox.top+y+copyBox.top-panel.getBoundingClientRect().top
      :copyBox.top+y;
    // In the pinned scene, all cards finish before the panel starts leaving.
    // Static layouts instead follow the text, including enlarged/long copy.
    const leaveStart=pinned?Math.max(sectionBox.bottom+y-panel.offsetHeight-112,
      sectionBox.top+y-112+scrollSpan(height)):
      copyTop+Math.max(0,copy.offsetHeight-height*.65)-height*.20;
    const state=phoneCopyReveal(y,copyTop,height),exit=phoneCopyExit(y,copyTop,height,leaveStart);
    section.style.setProperty('--assembly-copy-opacity',state.opacity*exit.opacity);
    section.style.setProperty('--assembly-copy-offset',`${state.offset}px`);
    section.classList.add('has-assembly-copy-reveal');
    section.classList.toggle('is-assembly-copy-cleared',exit.progress===1);
  };
  const fallback=()=>{pager.update(false);section.classList.remove('has-phone-assembly');canvas.hidden=true;
    section.style.removeProperty('--assembly-travel');section.style.removeProperty('--assembly-panel-height');};
  const queue=()=>{if(!disposed&&!doc.hidden&&!frame)frame=win.requestAnimationFrame(render);};
  const pager=makePager({win,doc,section,viewport,figure,onChange:queue});
  function render() {
    frame=0;if(disposed)return;
    // Copy remains scroll-driven even when 3D is unavailable or cannot fit.
    section.style.setProperty('--assembly-copy-offset','0px');
    try {renderScene();} finally {revealCopy();}
  }
  function renderScene() {
    if(failed||staticMode()){fallback();return;}
    if(layoutRejected)return;
    const rect=section.getBoundingClientRect(),height=win.innerHeight;
    if(doc.hidden||rect.top>height+400||rect.bottom<0){pager.cancel();return;}
    const top=win.innerWidth<=720?88:112;
    // Ignore the visual 8px entrance offset in the existing layout-fit checks.
    // The current scroll pose is restored before this frame is painted.
    section.style.setProperty('--assembly-copy-offset','0px');
    // Side-by-side content shares a row; stacked content adds its heights.
    // Wrapped text or enlarged fonts must never trap content in a short pin.
    const desktop=win.innerWidth>960;
    const minimumHeight=desktop
      ?Math.max(copy.offsetHeight,figure.offsetHeight-viewport.clientHeight+280)+28
      :panel.offsetHeight-viewport.clientHeight+308;
    if(!section.classList.contains('has-phone-assembly')&&minimumHeight>height-top){layoutRejected=true;fallback();return;}
    if(!renderer) {
      if(!pending){pending=true;Promise.resolve().then(load).then(result=>{
        if(disposed||failed){result.dispose();return;}renderer=result;queue();
      }).catch(()=>{failed=true;fallback();revealCopy();}).finally(()=>{pending=false;});}
      return;
    }
    section.style.setProperty('--assembly-travel',`${scrollSpan(height)}px`);
    section.classList.add('has-phone-assembly');
    const panelHeight=panel?.offsetHeight||height-top;
    if(panelHeight>height-top+1||viewport.clientHeight<280||panel.scrollHeight>panel.clientHeight+1||
      (desktop&&copy.offsetHeight>panel.clientHeight-28)){layoutRejected=true;fallback();return;}
    section.style.setProperty('--assembly-panel-height',`${panelHeight}px`);
    const progress=assemblyProgress(win.scrollY,rect.top+win.scrollY,height,top);
    try {const result=renderer.render(progress,viewport.clientWidth,viewport.clientHeight,win.devicePixelRatio||1,pager.state);
      canvas.hidden=false;pager.update(result?.ready,result?.bounds);}
    catch {failed=true;fallback();renderer.dispose();renderer=null;}
  }
  const resetLayout=()=>{pager.cancel();layoutRejected=false;queue();};
  listen(win,'scroll',()=>{pager.cancel();queue();});
  for(const event of ['load','pageshow'])listen(win,event,queue);
  listen(win,'resize',resetLayout);listen(doc.fonts,'loadingdone',resetLayout);
  listen(reduced,'change',queue);listen(connection,'change',queue);listen(doc,'visibilitychange',()=>{if(doc.hidden)pager.cancel();queue();});
  listen(canvas,'webglcontextlost',()=>{failed=true;fallback();renderer?.dispose();renderer=null;revealCopy();});
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(queue):null;observer?.observe(viewport);
  render();
  return {dispose(){disposed=true;if(frame)win.cancelAnimationFrame(frame);listeners.forEach(remove=>remove());observer?.disconnect();renderer?.dispose();fallback();clearCopy();pager.dispose();}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createPhoneAssembly();
