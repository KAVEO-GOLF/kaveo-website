import {finaleState} from './ball-finale-model.mjs';

export function createBallFinaleController({win=window,doc=document}={}){
  const world=doc.getElementById('story-world'),finale=doc.getElementById('story-finale'),signup=doc.getElementById('fruehzugang');
  const network=doc.getElementById('features'),study=network?.querySelector('.network-study'),canvas=doc.getElementById('story-green-ball');
  const dockAnchor=doc.getElementById('signup-ball-anchor');
  if(!world||!finale||!signup||!network||!study)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),small=win.matchMedia('(max-width: 720px)'),connection=win.navigator.connection;
  const disabled=new URL(win.location.href).searchParams.get('ball')==='aus';
  let frame=0,disposed=false;
  const removers=[];
  const listen=(target,type,fn,options)=>{target?.addEventListener(type,fn,options);removers.push(()=>target?.removeEventListener(type,fn,options));};
  const set=(node,name,value)=>node.style.setProperty(name,String(value));
  function draw(){
    frame=0;if(disposed)return;
    const animated=!disabled&&!reduced.matches&&!small.matches&&!connection?.saveData&&canvas?.dataset.available!=='false';
    world.classList.toggle('has-finale',true);
    world.classList.toggle('has-finale-motion',animated);
    const top=finale.getBoundingClientRect().top,h=win.innerHeight;
    set(world,'--story-prelude-height',Math.max(1,top-world.getBoundingClientRect().top)+'px');
    const active=doc.activeElement,networkFocused=network.contains(active)&&Boolean(active?.matches?.(':focus-visible')||doc.getElementById('feature-detail')?.open),signupFocused=signup.contains(active);
    const state=finaleState(top,signup.getBoundingClientRect().top,h,{staticMode:!animated,networkFocused,signupFocused,
      anchorBottom:animated&&dockAnchor?dockAnchor.getBoundingClientRect().bottom:null,
      columnHeight:dockAnchor?.parentElement?.getBoundingClientRect().height??0});
    set(world,'--prelude-shade-opacity',state.preludeOpacity);set(world,'--finale-shade-opacity',state.shade);set(world,'--finale-ball-opacity',state.ballOpacity);
    set(network,'--network-exit-opacity',state.networkOpacity);set(network,'--network-exit-y',(-22*(1-state.networkOpacity))+'px');
    study.inert=state.networkOpacity<.01&&!networkFocused;
    set(signup,'--signup-copy-opacity',state.copyOpacity);set(signup,'--signup-copy-y',(18*(1-state.copyOpacity))+'px');
    set(signup,'--signup-form-opacity',state.formOpacity);set(signup,'--signup-form-y',(24*(1-state.formOpacity))+'px');
  }
  function queue(){if(!disposed&&!frame)frame=win.requestAnimationFrame(draw);}
  listen(win,'scroll',queue,{passive:true});listen(win,'resize',queue,{passive:true});listen(win,'pageshow',queue);
  listen(win,'kaveo:ball-availability',queue);listen(doc,'focusin',queue);listen(doc,'focusout',queue);
  listen(doc,'visibilitychange',queue);listen(reduced,'change',queue);listen(small,'change',queue);listen(connection,'change',queue);
  const observer=win.ResizeObserver?new win.ResizeObserver(queue):null;observer?.observe(network);observer?.observe(signup);
  doc.fonts?.ready.then(queue);draw();
  return {dispose(){disposed=true;if(frame)win.cancelAnimationFrame(frame);removers.forEach(remove=>remove());observer?.disconnect();study.inert=false;world.classList.remove('has-finale-motion');world.classList.remove('has-finale');}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createBallFinaleController();
