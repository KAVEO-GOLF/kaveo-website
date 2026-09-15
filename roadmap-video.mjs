// Ensure the existing glass controller has created its viewport-sized frame
// before placing the video over that frame's poster (never over the long rail).
import './roadmap-glass.mjs';

export const ROADMAP_VIDEO_SOURCE='media/optimized/inselgruen-loop-720p.mp4';

export function createRoadmapVideo({win=window,doc=document,scope='.roadmap-scroll-scene',includeFooter=true}={}){
  if(!doc.querySelector(scope))return null;
  const selectors=['.roadmap-landscape img',...(includeFooter?['.footer-scene-image']:[])];
  const pictures=selectors.map(selector=>doc.querySelector(selector)).filter(Boolean);
  if(!pictures.length)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),mobile=win.matchMedia('(max-width: 720px)');
  const connection=win.navigator?.connection;
  let userPaused=false,disposed=false,pageHidden=false,printing=false,frame=null;
  const toggle=doc.createElement('button');toggle.type='button';toggle.className='roadmap-video-toggle';toggle.hidden=true;
  const removers=[];
  const listen=(target,type,fn,options)=>{target?.addEventListener?.(type,fn,options);removers.push(()=>target?.removeEventListener?.(type,fn,options));};
  const records=pictures.map((picture,index)=>{
    const video=doc.createElement('video');video.id='roadmap-background-video-'+index;
    video.className='roadmap-background-video'+(index===1?' is-footer-video':'');
    video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';
    video.poster=picture.getAttribute('src');video.width=1920;video.height=1080;video.tabIndex=-1;
    video.setAttribute('aria-hidden','true');video.setAttribute('disablepictureinpicture','');video.setAttribute('disableremoteplayback','');
    picture.after(video);
    return {video,visible:false,loaded:false,failed:false,blocked:false,pending:false,retry:false};
  });
  toggle.setAttribute('aria-controls',records.map(r=>r.video.id).join(' '));doc.body.appendChild(toggle);
  const stillOnly=()=>reduced.matches||mobile.matches||Boolean(connection?.saveData)||printing;
  const canPlay=r=>!disposed&&!stillOnly()&&!doc.hidden&&!pageHidden&&!userPaused&&r.visible&&!r.failed&&!r.blocked;
  function controls(){
    const visible=records.filter(r=>r.visible&&!r.failed);
    toggle.hidden=stillOnly()||visible.length===0;
    const paused=userPaused||visible.some(r=>r.blocked);
    toggle.textContent=paused?'Hintergrund abspielen':'Hintergrund pausieren';toggle.setAttribute('aria-pressed',String(paused));
  }
  async function play(r){
    r.pending=true;
    try{await r.video.play();}
    catch(error){
      if(error.name!=='AbortError'&&canPlay(r)){r.blocked=true;r.video.classList.remove('is-ready');controls();}
    }finally{
      r.pending=false;
      if(!disposed&&r.retry){r.retry=false;sync();}
    }
  }
  function sync(){
    if(disposed)return;
    for(const r of records){
      if(!canPlay(r)){
        r.video.pause();if(stillOnly()||r.failed)r.video.classList.remove('is-ready');
        continue;
      }
      if(!r.loaded){r.video.src=ROADMAP_VIDEO_SOURCE;r.loaded=true;}
      if(!r.video.paused)continue;
      if(r.pending){r.retry=true;continue;}
      play(r);
    }
    controls();
  }
  function measure(){
    if(disposed)return;
    for(const r of records){const rect=r.video.getBoundingClientRect();r.visible=rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<win.innerHeight;}
    sync();
  }
  function schedule(){if(!disposed&&frame===null)frame=win.requestAnimationFrame(()=>{frame=null;measure();});}
  for(const r of records){
    listen(r.video,'playing',()=>{if(canPlay(r))r.video.classList.add('is-ready');else r.video.pause();});
    listen(r.video,'error',()=>{r.failed=true;sync();});
  }
  listen(toggle,'click',()=>{
    if(userPaused||records.some(r=>r.visible&&r.blocked)){userPaused=false;records.forEach(r=>{r.blocked=false;});}
    else userPaused=true;
    sync();
  });
  listen(reduced,'change',measure);listen(mobile,'change',measure);listen(connection,'change',measure);
  listen(doc,'visibilitychange',sync);listen(win,'pagehide',()=>{pageHidden=true;sync();});
  listen(win,'pageshow',()=>{pageHidden=false;measure();});
  listen(win,'beforeprint',()=>{printing=true;sync();});listen(win,'afterprint',()=>{printing=false;measure();});
  listen(win,'resize',schedule);
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    for(const entry of entries){const r=records.find(r=>r.video===entry.target);if(r)r.visible=entry.isIntersecting&&entry.intersectionRect.width>0&&entry.intersectionRect.height>0;}
    sync();
  }):null;
  if(observer)records.forEach(r=>observer.observe(r.video));
  else listen(win,'scroll',schedule,{passive:true});
  measure();
  return {records,toggle,measure,dispose(){
    disposed=true;observer?.disconnect();if(frame!==null)win.cancelAnimationFrame(frame);removers.forEach(remove=>remove());
    for(const {video} of records){video.pause();video.removeAttribute('src');video.load();video.remove();}
    toggle.remove();
  }};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapVideo();
