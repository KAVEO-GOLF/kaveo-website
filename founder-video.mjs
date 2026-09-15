import {flightScrollWindow} from './green-ball-flight.mjs';
import {founderReveal,founderExit} from './founder-stage.mjs';
import {createFounderGrounding} from './founder-grounding.mjs';

export function coverSource(sw,sh,width,height,x=1,y=.5) {
  if(![sw,sh,width,height].every(value=>Number.isFinite(value)&&value>0))return null;
  const scale=Math.max(width/sw,height/sh);
  const w=width/scale,h=height/scale;
  return {x:(sw-w)*x,y:(sh-h)*y,width:w,height:h};
}

export function founderVideoGate({rect,viewportHeight,scrollY,landingEnd,reveal,
  stillOnly=false,hidden=false,userPaused=false,completed=false,failed=false,cleared=false}) {
  const visible=!cleared&&rect.bottom>0&&rect.top<viewportHeight;
  const near=!cleared&&rect.bottom>0&&rect.top<viewportHeight*1.5;
  const entered=rect.top<viewportHeight*.72&&rect.bottom>viewportHeight*.1&&reveal>=1;
  return {visible,near,play:visible&&entered&&scrollY>=landingEnd&&!stillOnly&&!hidden&&
    !userPaused&&!completed&&!failed};
}

// Decode a transparent corner before replacing the PNG. A browser that can
// decode VP9 but drops its alpha must keep the still, not show a black rectangle.
export function hasVideoAlpha(video,doc) {
  try {
    const probe=doc.createElement('canvas');probe.width=32;probe.height=44;
    const context=probe.getContext('2d',{willReadFrequently:true});
    if(!context)return false;
    context.clearRect(0,0,32,44);
    context.drawImage(video,0,0,32,44);
    const data=context.getImageData(0,0,32,44).data;
    let opaque=0;
    for(let i=3;i<data.length;i+=4)if(data[i]>200)opaque++;
    return data[3]<16&&opaque>=32;
  } catch { return false; }
}

export function createFounderVideo({win=window,doc=document}={}) {
  const section=doc.getElementById('erlebnis');
  const figure=section?.querySelector('.story-portrait--video');
  const field=figure?.querySelector('.story-portrait-field');
  if(!field)return null;
  const params=new URL(win.location.href).searchParams;
  if(params.get('portraet')==='karte') {
    const original=doc.createElement('img');
    original.src=figure.dataset.originalSrc;original.width=1792;original.height=2400;
    original.alt='Porträt von Philipp im grünen KAVEO-Golfpolo auf dem Golfplatz; KI-gestütztes Motiv';
    original.decoding='async';field.replaceChildren(original);
    figure.classList.remove('story-portrait--video');
    return {dispose(){}};
  }
  const hero=doc.getElementById('start'),scene=doc.querySelector('.story-scene-media');
  const master=doc.getElementById('story-ambient-video');
  const toggle=doc.querySelector('.story-video-toggle');
  const landscape=field.querySelector('.founder-landscape');
  const canvas=field.querySelector('.founder-landscape-frame');
  const layer=field.querySelector('.founder-person-layer');
  const still=layer?.querySelector('img'),clip=layer?.querySelector('video');
  const endStill=layer?.querySelector('.founder-person-end');
  if(!hero||!scene||!master||!landscape||!canvas||!layer||!still||!clip)return null;
  const context=canvas.getContext('2d',{alpha:false});
  const drawGrounding=createFounderGrounding(doc);
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=win.matchMedia('(max-width:720px)');
  const connection=win.navigator.connection;
  const disabled=params.get('ball')==='aus';
  const listeners=[];
  let queued=0,landscapeFrame=0,frameKind='',disposed=false,suspended=false;
  let loaded=false,ready=false,pending=false,failed=false,blocked=false,completed=false;
  let endDecoded=false,endPending=false;
  let gate={visible:false,near:false,play:false};
  const listen=(target,event,fn)=>{
    target?.addEventListener?.(event,fn,{passive:true});
    listeners.push(()=>target?.removeEventListener?.(event,fn));
  };
  const stillOnly=()=>disabled||reduced.matches||mobile.matches||Boolean(connection?.saveData);
  const isHidden=()=>doc.hidden||suspended;
  const queue=()=>{if(!disposed&&!queued)queued=win.requestAnimationFrame(sync);};
  const showStill=()=>{
    layer.classList.remove('has-video-frame');
    if(endDecoded)layer.classList.add('has-end-frame');
    else layer.classList.remove('has-end-frame');
  };
  const prepareEnd=()=>{
    if(!endStill||endDecoded||endPending||!endStill.complete||!endStill.naturalWidth)return;
    endPending=true;
    Promise.resolve(endStill.decode?.()).then(()=>{
      if(!disposed){endDecoded=true;queue();}
    }).catch(()=>{}).finally(()=>{endPending=false;});
  };
  const stopLandscape=()=>{
    if(!landscapeFrame)return;
    if(frameKind==='video')master.cancelVideoFrameCallback?.(landscapeFrame);
    else win.cancelAnimationFrame(landscapeFrame);
    landscapeFrame=0;
  };
  const drawLandscape=()=>{
    if(disposed||!context||!gate.visible||isHidden())return;
    const useVideo=!stillOnly()&&master.readyState>=2&&master.classList.contains('is-ready');
    const source=useVideo?master:landscape;
    const sw=useVideo?master.videoWidth:landscape.naturalWidth;
    const sh=useVideo?master.videoHeight:landscape.naturalHeight;
    const dpr=Math.min(win.devicePixelRatio||1,2);
    const width=Math.round(field.clientWidth*dpr),height=Math.round(field.clientHeight*dpr);
    const crop=coverSource(sw,sh,width,height);
    if(!crop)return;
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    try {
      context.drawImage(source,crop.x,crop.y,crop.width,crop.height,0,0,width,height);
      const person=layer.classList.contains('has-video-frame')?clip:
        layer.classList.contains('has-end-frame')&&endDecoded?endStill:still;
      drawGrounding(context,person,width,height);
      canvas.hidden=false;
    } catch { canvas.hidden=true; }
  };
  const animateLandscape=()=>{
    if(disposed||landscapeFrame||!gate.visible||isHidden()||stillOnly()||master.paused||master.ended)return;
    const next=()=>{landscapeFrame=0;drawLandscape();animateLandscape();};
    if(typeof master.requestVideoFrameCallback==='function') {
      frameKind='video';landscapeFrame=master.requestVideoFrameCallback(next);
    } else {frameKind='raf';landscapeFrame=win.requestAnimationFrame(next);}
  };
  const onError=()=>{if(disposed)return;failed=true;ready=false;clip.pause();showStill();};
  const onLoaded=()=>{
    if(disposed||ready||failed||clip.readyState<2)return;
    if(!hasVideoAlpha(clip,doc)){onError();return;}
    ready=true;queue();
  };
  function sync() {
    queued=0;if(disposed)return;
    const scrollY=win.scrollY,H=win.innerHeight;
    const heroTop=hero.getBoundingClientRect().top+scrollY;
    const founderTop=section.getBoundingClientRect().top+scrollY;
    const reveal=founderReveal(scrollY,heroTop,scene.clientHeight,founderTop).image;
    const cleared=!stillOnly()&&founderExit(scrollY,heroTop,scene.clientHeight,founderTop,section.clientHeight).progress===1;
    gate=founderVideoGate({rect:field.getBoundingClientRect(),viewportHeight:H,scrollY,
      landingEnd:flightScrollWindow(heroTop,scene.clientHeight).end,reveal,
      stillOnly:stillOnly(),hidden:isHidden(),userPaused:toggle?.getAttribute('aria-pressed')==='true',
      completed,failed:failed||blocked,cleared});
    if(stillOnly()||failed||blocked||completed)showStill();
    if(!gate.visible||isHidden()||stillOnly()||master.paused)stopLandscape();
    drawLandscape();animateLandscape();
    if(!stillOnly()&&!failed&&!loaded&&gate.near&&!isHidden()) {
      if(!clip.canPlayType('video/webm; codecs="vp9"')){onError();return;}
      loaded=true;clip.muted=true;clip.defaultMuted=true;clip.loop=false;
      clip.preload='auto';clip.src=clip.dataset.src;clip.load();
    }
    if(!gate.play||!ready){clip.pause();return;}
    if(!clip.paused||pending)return;
    pending=true;
    Promise.resolve(clip.play()).catch(error=>{
      if(disposed)return;
      if(error?.name!=='AbortError'){blocked=true;clip.pause();showStill();}
    }).finally(()=>{
      pending=false;
      if(disposed||!gate.play)clip.pause();
      if(!disposed)queue();
    });
  }
  listen(clip,'loadeddata',onLoaded);listen(clip,'canplay',onLoaded);
  listen(clip,'error',onError);
  listen(clip,'playing',()=>{
    if(disposed||completed||!gate.play||stillOnly()||isHidden()){clip.pause();return;}
    if(!hasVideoAlpha(clip,doc)){onError();return;}
    layer.classList.remove('has-end-frame');
    layer.classList.add('has-video-frame');
  });
  listen(clip,'ended',()=>{completed=true;clip.pause();showStill();queue();});
  listen(clip,'timeupdate',()=>{if(!landscapeFrame)drawLandscape();});
  listen(endStill,'load',prepareEnd);
  listen(still,'load',queue);
  for(const event of ['playing','pause','loadeddata','seeked','emptied','error'])listen(master,event,queue);
  listen(master,'timeupdate',()=>{if(!landscapeFrame)drawLandscape();});
  listen(landscape,'load',queue);
  listen(toggle,'click',()=>{blocked=false;queue();});
  listen(win,'scroll',queue);listen(win,'resize',queue);listen(win,'load',queue);
  listen(win,'pagehide',()=>{suspended=true;clip.pause();stopLandscape();});
  listen(win,'pageshow',()=>{suspended=false;queue();});
  listen(doc,'visibilitychange',()=>{
    // RAF is suspended in hidden tabs: stop the media synchronously.
    if(doc.hidden){clip.pause();stopLandscape();}
    queue();
  });
  listen(reduced,'change',queue);listen(mobile,'change',queue);listen(connection,'change',queue);
  const observer=win.ResizeObserver?new win.ResizeObserver(queue):null;observer?.observe(field);
  prepareEnd();sync();
  return {dispose(){disposed=true;clip.pause();stopLandscape();if(queued)win.cancelAnimationFrame(queued);
    observer?.disconnect();listeners.forEach(remove=>remove());showStill();canvas.hidden=true;}};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')createFounderVideo();
