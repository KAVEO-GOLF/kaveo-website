import {sharedFooterState} from './shared-footer-motion.mjs';

export function createSharedFooter({win=window,doc=document,
  loadRenderer=()=>import('./green-ball-renderer.mjs')}={}){
  const closing=doc.querySelector('[data-shared-footer]');
  if(!closing)return null;
  const form=closing.querySelector('#signup-form'),canvas=closing.querySelector('.footer-ball');
  const signup=closing.querySelector('#fruehzugang'),copy=closing.querySelector('.signup-copy');
  const finale=closing.querySelector('.footer-finale'),media=closing.querySelector('.footer-scene-media');
  const anchor=closing.querySelector('#signup-ball-anchor');
  const small=win.matchMedia('(max-width:720px)'),reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),connection=win.navigator.connection;
  const disabledByUrl=new URL(win.location.href).searchParams.get('ball')==='aus';
  let renderer=null,loading=false,disposed=false,near=false,frame=0,failed=false,generation=0;
  const removers=[];
  const listen=(target,type,fn,options)=>{target?.addEventListener(type,fn,options);removers.push(()=>target?.removeEventListener(type,fn,options));};
  const set=(name,value)=>closing.style.setProperty(name,String(value));
  const eligible=()=>!disposed&&!failed&&!disabledByUrl&&!small.matches&&!reduced.matches&&!connection?.saveData;
  const preventSubmit=event=>event.preventDefault();listen(form,'submit',preventSubmit);
  const submit=form?.querySelector('[type="submit"]');if(submit)submit.disabled=true;
  function release(){generation++;renderer?.dispose();renderer=null;if(canvas)canvas.hidden=true;}
  function queue(){if(!frame&&!disposed)frame=win.requestAnimationFrame(draw);}
  async function load(){
    if(loading||renderer||!eligible()||!near||doc.hidden)return;
    loading=true;const token=generation;
    try{
      const {createGreenBallRenderer}=await loadRenderer();
      if(!eligible()||token!==generation)return;
      const next=await createGreenBallRenderer(canvas);
      if(!eligible()||token!==generation){next.dispose();return;}
      renderer=next;queue();
    }catch{if(token===generation){failed=true;release();queue();}}
    finally{loading=false;if(token!==generation&&eligible()&&near&&!renderer)queue();}
  }
  function draw(){
    frame=0;if(disposed)return;
    const ballMotion=eligible();
    closing.classList.toggle('footer-ball-motion',ballMotion);
    closing.classList.toggle('footer-text-motion',!reduced.matches);
    if(!ballMotion&&renderer)release();
    if(!signup||!form||!copy||!finale||!media||!anchor||!canvas)return;
    const sceneBox=finale.getBoundingClientRect(),signupBox=signup.getBoundingClientRect();
    // Read stable layout ancestors/offsets, not last frame's reveal transform.
    const copyTop=copy.parentElement.getBoundingClientRect().top;
    const formTop=signupBox.top+form.offsetTop;
    const mediaBox=media.getBoundingClientRect(),anchorBox=anchor.getBoundingClientRect();
    const state=sharedFooterState({top:sceneBox.top,signupTop:signupBox.top,copyTop,formTop,
      height:win.innerHeight,anchor:anchorBox,media:mediaBox,width:media.clientWidth,mediaHeight:media.clientHeight,
      columnHeight:anchor.parentElement.getBoundingClientRect().height,ballMotion,reduced:reduced.matches,
      focused:signup.contains(doc.activeElement)});
    set('--footer-progress',state.progress);set('--footer-scene-shade',state.shade);
    set('--signup-copy-opacity',state.copyOpacity);set('--signup-copy-y',(18*(1-state.copyOpacity))+'px');
    set('--signup-form-opacity',state.formOpacity);set('--signup-form-y',(24*(1-state.formOpacity))+'px');
    const visible=!doc.hidden&&sceneBox.bottom>0&&sceneBox.top<win.innerHeight;
    if(!ballMotion||!visible){canvas.hidden=true;if(ballMotion)void load();return;}
    if(!renderer){void load();return;}
    try{
      renderer.draw(1,media.clientWidth,media.clientHeight,win.devicePixelRatio||1,state.progress,state.dock);
      canvas.hidden=false;
    }catch{failed=true;release();queue();}
  }
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    near=entries.some(entry=>entry.isIntersecting);if(near){void load();queue();}
  },{rootMargin:'400px'}):null;
  const resize=win.ResizeObserver?new win.ResizeObserver(queue):null;
  const modeChanged=()=>{if(!eligible())release();queue();};
  listen(win,'scroll',queue,{passive:true});listen(win,'resize',queue,{passive:true});listen(win,'pageshow',queue);
  listen(doc,'visibilitychange',queue);listen(doc,'focusin',queue);listen(doc,'focusout',queue);
  listen(small,'change',modeChanged);listen(reduced,'change',modeChanged);listen(connection,'change',modeChanged);
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();failed=true;release();queue();});
  listen(canvas,'webglcontextrestored',()=>{failed=false;queue();});
  if(!observer)near=true;
  draw();observer?.observe(finale);if(signup)resize?.observe(signup);if(media)resize?.observe(media);
  doc.fonts?.ready.then(queue);
  return {dispose(){
    if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);frame=0;
    observer?.disconnect();resize?.disconnect();removers.forEach(remove=>remove());release();
    closing.classList.remove('footer-ball-motion');closing.classList.remove('footer-text-motion');
  }};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createSharedFooter();
