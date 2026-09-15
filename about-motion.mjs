const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};

// Geometry comes from the stationary section, not its animated child. Native
// scrolling and the same envelope in both directions prevent jumpy re-entry.
export function aboutSceneState({top,bottom,height,headerBottom=96,reduced=false,printing=false}){
  if(reduced||printing||![top,bottom,height,headerBottom].every(Number.isFinite)||height<=0)
    return {opacity:1,y:0,hidden:false};
  const enter=ease((height*.96-top)/(height*.46));
  const leave=ease((headerBottom+height*.5-bottom)/(height*.5));
  const opacity=Math.min(enter,1-leave);
  return {opacity,y:18*(1-enter)-12*leave,hidden:opacity===0};
}

export function createAboutMotion({win=window,doc=document}={}){
  const page=doc.querySelector('.about-page');
  if(!page)return null;
  const records=[...page.querySelectorAll('[data-about-scene]')].map(section=>{
    const element=section.querySelector('[data-about-reveal]');
    return element?{section,element,inert:element.inert}:null;
  }).filter(Boolean);
  const header=doc.querySelector('.site-header'),headerScrolled=header?.classList.contains('is-scrolled');
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=null,disposed=false,printing=false;
  function update(){
    if(disposed)return;
    const headerBottom=header?.getBoundingClientRect().bottom??96;
    // Read all geometry before writing styles; never read transformed children.
    const states=records.map(({section})=>{
      const {top,bottom}=section.getBoundingClientRect();
      return aboutSceneState({top,bottom,height:win.innerHeight,headerBottom,reduced:reduced.matches,printing});
    });
    records.forEach(({element,inert},index)=>{
      const state=states[index];
      element.style.setProperty('--about-opacity',state.opacity.toFixed(4));
      element.style.setProperty('--about-y',`${state.y.toFixed(2)}px`);
      element.inert=Boolean(inert||state.hidden);
    });
    header?.classList.toggle('is-scrolled',win.scrollY>64);
  }
  function schedule(){if(!disposed&&frame===null)frame=win.requestAnimationFrame(()=>{frame=null;update();});}
  function beforePrint(){printing=true;update();}
  function afterPrint(){printing=false;schedule();}
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
  records.forEach(({section})=>observer?.observe(section));
  for(const name of ['scroll','resize','pageshow','hashchange'])win.addEventListener(name,schedule,{passive:true});
  win.addEventListener('beforeprint',beforePrint);win.addEventListener('afterprint',afterPrint);
  reduced.addEventListener('change',schedule);doc.fonts?.ready?.then(schedule);
  update();page.classList.add('about-motion-ready');
  return {update,dispose(){
    disposed=true;if(frame!==null)win.cancelAnimationFrame(frame);observer?.disconnect();
    for(const name of ['scroll','resize','pageshow','hashchange'])win.removeEventListener(name,schedule);
    win.removeEventListener('beforeprint',beforePrint);win.removeEventListener('afterprint',afterPrint);
    reduced.removeEventListener('change',schedule);
    records.forEach(({element,inert})=>{element.inert=inert;element.style.removeProperty('--about-opacity');element.style.removeProperty('--about-y');});
    page.classList.remove('about-motion-ready');header?.classList.toggle('is-scrolled',Boolean(headerScrolled));
  }};
}
