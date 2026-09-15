export const FUNCTIONS_DETAIL_DURATION=850;

// Keep native details/summary semantics and usable no-JS fallbacks. Only the
// inner content animates; the glass edge, summary and focus ring stay still.
export function enhanceFunctionDetails(details,{win=window,doc=document}={}){
  const summary=details.querySelector('summary'),content=details.querySelector('.feature-body');
  if(!summary||!content)return null;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  const fold=doc.createElement('div');fold.className='functions-feature-fold';
  details.appendChild(fold);fold.appendChild(content);details.classList.add('has-feature-fold');
  let target=details.open,animation=null,disposed=false;
  fold.inert=!target;
  function settle(open){
    target=open;
    if(animation){const previous=animation;animation=null;previous.onfinish=null;previous.cancel();}
    details.open=open;fold.inert=!open;details.classList.remove('feature-is-moving');
  }
  function setOpen(open,{animate=true}={}){
    if(disposed)return;
    const from=details.open?fold.getBoundingClientRect().height:0;
    const opacity=details.open?Number(win.getComputedStyle?.(fold)?.opacity??1):0;
    if(animation){animation.onfinish=null;animation.cancel();animation=null;}
    target=open;
    if(!open&&fold.contains(doc.activeElement))summary.focus({preventScroll:true});
    if(!animate||reduced.matches||doc.hidden||typeof fold.animate!=='function'){settle(open);return;}
    details.open=true;fold.inert=!open;
    const to=open?fold.getBoundingClientRect().height:0;
    if(Math.abs(to-from)<1){settle(open);return;}
    details.classList.add('feature-is-moving');
    try{
      const current=fold.animate([{height:`${from}px`,opacity},{height:`${to}px`,opacity:open?1:0}],
        {duration:FUNCTIONS_DETAIL_DURATION,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
      animation=current;
      current.onfinish=()=>{if(!disposed&&animation===current)settle(open);};
    }catch{settle(open);}
  }
  function click(event){
    if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();setOpen(!target);
  }
  function toggle(){
    if(animation){if(!details.open)settle(false);return;}
    target=details.open;fold.inert=!target;
  }
  const stop=()=>settle(target),motion=()=>{if(reduced.matches)stop();},visibility=()=>{if(doc.hidden)stop();};
  summary.addEventListener('click',click);details.addEventListener('toggle',toggle);
  reduced.addEventListener('change',motion);win.addEventListener('resize',stop);win.addEventListener('pagehide',stop);
  doc.addEventListener('visibilitychange',visibility);
  return {setOpen,get open(){return target;},dispose(){
    if(disposed)return;settle(target);disposed=true;
    summary.removeEventListener('click',click);details.removeEventListener('toggle',toggle);
    reduced.removeEventListener('change',motion);win.removeEventListener('resize',stop);win.removeEventListener('pagehide',stop);
    doc.removeEventListener('visibilitychange',visibility);
    fold.replaceWith(content);details.classList.remove('has-feature-fold');
  }};
}
