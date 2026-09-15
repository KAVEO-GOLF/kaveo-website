import {scrollProgress} from './green-ball-flight.mjs';
import {finaleProgress,ballDock} from './ball-finale-model.mjs';

// Event-driven only: one queued render per input batch, never a recurring loop.
export function createGreenBallController({win=window,doc=document,
  loadRenderer=()=>import('./green-ball-renderer.mjs')}={}) {
  const canvas=doc.getElementById('story-green-ball');
  const world=doc.getElementById('story-world');
  const hero=doc.getElementById('start');
  const finale=doc.getElementById('story-finale');
  const dockAnchor=doc.getElementById('signup-ball-anchor');
  const media=doc.querySelector('.story-scene-media');
  if (!canvas||!world||!hero||!media) return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=win.matchMedia('(max-width: 720px)');
  const connection=win.navigator.connection;
  const disabledByUrl=new URL(win.location.href).searchParams.get('ball')==='aus';
  let renderer=null, loading=false, failed=false, frame=0, destroyed=false, lastKey='';
  let generation=0;
  const listeners=[];
  const listen=(target,event,fn,options)=>{
    target?.addEventListener(event,fn,options);
    listeners.push(()=>target?.removeEventListener(event,fn,options));
  };
  const allowed=()=>!destroyed&&!disabledByUrl&&!reduced.matches&&!mobile.matches&&!connection?.saveData;
  const visible=()=>{
    const bounds=world.getBoundingClientRect();
    return !doc.hidden&&bounds.bottom>0&&bounds.top<win.innerHeight;
  };
  const release=()=>{
    generation++;
    renderer?.dispose(); renderer=null;
    lastKey=''; canvas.hidden=true;
    canvas.dataset.available='false';
    if(win.dispatchEvent&&win.Event)win.dispatchEvent(new win.Event('kaveo:ball-availability'));
  };
  async function load() {
    if (loading||renderer||failed||!allowed()||!visible()) return;
    loading=true;
    const token=generation;
    try {
      const {createGreenBallRenderer}=await loadRenderer();
      if (!allowed()||token!==generation) return;
      const next=await createGreenBallRenderer(canvas);
      if (!allowed()||token!==generation) { next.dispose(); return; }
      renderer=next;
      canvas.dataset.available='true';
      if(win.dispatchEvent&&win.Event)win.dispatchEvent(new win.Event('kaveo:ball-availability'));
      lastKey='';
      queueRender();
    } catch (error) {
      if(token===generation) {
        failed=true;
        release();
        win.console.warn('KAVEO Scrollball: Hintergrund bleibt ohne 3D-Ebene erhalten.',error);
      }
    } finally {
      loading=false;
      // A preference may have been turned off and back on during the await.
      // Resume the current generation without requiring another scroll event.
      if(token!==generation&&!renderer&&!failed&&allowed()&&visible()) queueRender();
    }
  }
  function render() {
    frame=0;
    if (!allowed()) { if(renderer)release(); canvas.hidden=true; return; }
    if (!visible()) { canvas.hidden=true; return; }
    if (!renderer) { void load(); return; }
    const width=media.clientWidth, height=media.clientHeight;
    const heroTop=hero.getBoundingClientRect().top+win.scrollY;
    const progress=scrollProgress(win.scrollY,heroTop,height);
    const closeup=finale&&world.classList.contains('has-finale-motion')?finaleProgress(finale.getBoundingClientRect().top,win.innerHeight):0;
    const dock=closeup&&dockAnchor?ballDock(finale.getBoundingClientRect().top,win.innerHeight,
      dockAnchor.getBoundingClientRect(),media.getBoundingClientRect(),width,height):null;
    const ratio=win.devicePixelRatio||1;
    const key=[progress,width,height,ratio,closeup,dock?.progress,dock?.x,dock?.y,dock?.diameter].join(':');
    try {
      if (key!==lastKey) {
        renderer.draw(progress,width,height,ratio,closeup,dock);
        lastKey=key;
      }
      canvas.hidden=false;
    } catch(error) {
      failed=true;release();
      win.console.warn('KAVEO Scrollball: 3D-Ausgabe deaktiviert.',error);
    }
  }
  function queueRender() {
    if (!destroyed&&!frame) frame=win.requestAnimationFrame(render);
  }
  function modeChanged() {
    if (!allowed()) release();
    queueRender();
  }
  listen(win,'scroll',queueRender,{passive:true});
  listen(win,'resize',queueRender,{passive:true});
  listen(win,'pageshow',queueRender);
  listen(win,'kaveo:ball-availability',queueRender);
  listen(doc,'visibilitychange',queueRender);
  listen(reduced,'change',modeChanged);
  listen(mobile,'change',modeChanged);
  listen(connection,'change',modeChanged);
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();release();failed=true;});
  listen(canvas,'webglcontextrestored',()=>{failed=false;queueRender();});
  const resizeObserver=win.ResizeObserver?new win.ResizeObserver(queueRender):null;
  resizeObserver?.observe(media);
  if(dockAnchor)resizeObserver?.observe(dockAnchor.parentElement);
  doc.fonts?.ready.then(queueRender);
  queueRender();
  return {dispose() {
    if(destroyed)return;
    destroyed=true;
    if(frame)win.cancelAnimationFrame(frame);
    frame=0;
    listeners.forEach(remove=>remove());
    resizeObserver?.disconnect();
    release();
  }};
}

if(typeof window!=='undefined'&&typeof document!=='undefined') createGreenBallController();
