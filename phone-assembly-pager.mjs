import {PAGE_NAMES,swipeAxis,swipeCompletes} from './phone-assembly-pages.mjs';

// Only direct pointer/key/button input can start this bounded page transition.
export function createPhonePager({win,doc,section,viewport,figure,onChange}) {
  const surface=doc.createElement('div');surface.className='assembly-swipe-surface';surface.hidden=true;
  surface.tabIndex=0;surface.setAttribute('role','group');
  surface.setAttribute('aria-label','Homescreen-Vorschau. Seitlich wischen oder die Pfeiltasten nutzen.');
  const controls=doc.createElement('div');controls.className='assembly-pager';controls.setAttribute('role','group');
  controls.setAttribute('aria-label','Homescreen-Seiten');
  const hint=doc.createElement('span');hint.className='assembly-swipe-hint';hint.textContent='Wischen oder ziehen';
  controls.append(hint);
  const buttons=[0,1].map(index=>{
    const button=doc.createElement('button');button.type='button';button.className='assembly-page-button';
    button.textContent=String(index+1);button.disabled=true;
    button.setAttribute('aria-label',`Seite ${index+1}: ${PAGE_NAMES[index]}`);controls.append(button);return button;
  });
  const live=doc.createElement('span');live.className='assembly-pager-live';live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');controls.append(live);
  viewport.append(surface);figure.insertBefore(controls,figure.querySelector('figcaption'));
  let ready=false,page=0,offset=0,drag=null,animation=0,disposed=false,screenWidth=1;
  const listeners=[];
  const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
  const signal=()=>{if(!disposed)onChange();};
  const announce=(userNavigation=false)=>{
    buttons.forEach((button,index)=>button.setAttribute('aria-pressed',String(page===index)));
    surface.setAttribute('aria-label',`Seite ${page+1}: ${PAGE_NAMES[page]}. Designansicht, kommt später. Seitlich wischen oder Pfeiltasten nutzen.`);
    if(userNavigation)live.textContent=`Seite ${page+1} von 2: ${PAGE_NAMES[page]}. Designansicht, kommt später.`;
  };
  const stop=()=>{if(animation)win.cancelAnimationFrame(animation);animation=0;};
  const release=()=>{const id=drag?.id;drag=null;surface.classList.remove('is-dragging');if(id!==undefined&&surface.hasPointerCapture?.(id))surface.releasePointerCapture(id);};
  const cancel=()=>{stop();release();if(offset!==0){offset=0;signal();}};
  const settle=(target)=>{
    stop();const from=offset,start=win.performance.now();
    const tick=now=>{
      if(!ready||disposed){animation=0;return;}
      const t=Math.min(1,Math.max(0,(now-start)/220)),ease=1-(1-t)**3;
      offset=from+(target-from)*ease;
      if(t===1){if(target!==0)page=1-page;offset=0;animation=0;announce(target!==0);}
      else animation=win.requestAnimationFrame(tick);
      signal();
    };
    animation=win.requestAnimationFrame(tick);
  };
  const choose=(index,direction)=>{if(!ready)return;cancel();if(index!==page)settle(direction);};
  buttons.forEach((button,index)=>listen(button,'click',()=>choose(index,index===1?1:-1)));
  listen(surface,'keydown',event=>{
    if(!ready||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')choose(0,-1);
    else if(event.key==='End')choose(1,1);
    else choose(1-page,event.key==='ArrowRight'?1:-1);
  });
  listen(surface,'pointerdown',event=>{
    if(!ready||event.isPrimary===false||event.button!==0)return;
    cancel();drag={id:event.pointerId,x:event.clientX,y:event.clientY,axis:'pending'};
    surface.setPointerCapture?.(event.pointerId);
  });
  listen(surface,'pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(drag.axis==='pending')drag.axis=swipeAxis(dx,dy);
    if(drag.axis==='vertical'){cancel();return;}
    if(drag.axis!=='horizontal')return;
    event.preventDefault();surface.classList.add('is-dragging');
    offset=Math.max(-1,Math.min(1,dx/screenWidth));signal();
  },{passive:false});
  listen(surface,'pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const horizontal=drag.axis==='horizontal';release();
    if(horizontal)settle(swipeCompletes(offset)?Math.sign(offset):0);
  });
  for(const type of ['pointercancel','lostpointercapture'])listen(surface,type,()=>{if(drag)cancel();});
  listen(win,'blur',cancel);
  const update=(available,bounds)=>{
    const next=Boolean(available&&bounds);
    if(next!==ready){ready=next;buttons.forEach(button=>button.disabled=!ready);surface.hidden=!ready;
      section.classList.toggle('is-assembly-interactive',ready);
      if(!ready){cancel();if(page!==0){page=0;signal();}live.textContent='';announce();}else announce();}
    if(ready){screenWidth=bounds.width;Object.assign(surface.style,{left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});}
  };
  announce();
  return {get state(){return {page,offset};},update,cancel,
    dispose(){disposed=true;stop();release();listeners.forEach(remove=>remove());surface.remove();controls.remove();section.classList.remove('is-assembly-interactive');}};
}
