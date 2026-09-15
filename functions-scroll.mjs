import {areaForHash} from './roadmap-content.mjs';

const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));

// Native sticky positioning is bounded by the right panel's grid row. At their
// shared lower edge the menu travels with the panel; only then do they fade as
// one reading surface. There is no independent menu fade or wheel interception.
export function functionsScrollState({scrollY,height,width,navDocumentTop,navHeight,headerBottom,footerTop,tail=132,
  panelBottom=footerTop-Math.max(0,tail-32),reduced=false,printing=false}){
  const valid=[scrollY,height,width,navDocumentTop,navHeight,headerBottom,footerTop,tail,panelBottom].every(Number.isFinite)&&height>0;
  if(!valid)return {pinned:false,top:0,opacity:1,hidden:false,progress:0};
  const lower=headerBottom+24,upper=height-navHeight-24;
  const top=upper>=lower?clamp(navDocumentTop,lower,upper):lower;
  const pinned=!reduced&&!printing&&width>820&&upper>=lower;
  // The desktop range starts precisely at bottom alignment (about 800 px on
  // a tall screen), instead of fading the menu alone over only ~240 px.
  const end=pinned?headerBottom+32:Math.min(height*.55,headerBottom+Math.max(0,tail));
  const start=pinned?top+navHeight:Math.max(end+height*.24,height*.86);
  const edge=pinned?panelBottom:footerTop;
  const progress=reduced||printing?0:clamp((start-edge)/Math.max(1,start-end));
  const opacity=1-progress*progress*(3-2*progress);
  return {pinned,top,progress,opacity,hidden:opacity===0};
}

export function createFunctionsScroll({win=window,doc=document}={}){
  if(!doc.querySelector('.functions-page'))return null;
  const main=doc.querySelector('.roadmap-main'),nav=doc.querySelector('.roadmap-area-nav');
  const footer=doc.querySelector('[data-shared-footer]'),header=doc.querySelector('.site-header');
  if(!main||!nav||!footer)return null;
  const originalOpacity=main.style.opacity,originalInert=main.inert;
  const slot=doc.createElement('div');slot.className='functions-nav-slot';
  nav.before(slot);slot.appendChild(nav);doc.body.classList.add('functions-scroll-ready');
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=null,dirty=true,disposed=false,printing=false,geometry=null,lastOpacity=null,lastPinned=null;
  const previousValues=new Map();
  function variable(name,value){
    if(previousValues.get(name)===value)return;
    nav.style.setProperty(name,value);previousValues.set(name,value);
  }
  function measure(){
    const y=win.scrollY,rect=slot.getBoundingClientRect(),mainRect=main.getBoundingClientRect();
    const last=doc.querySelector('.roadmap-area:not([hidden]) .roadmap-feature:last-child');
    const panel=doc.querySelector('.roadmap-area:not([hidden])');
    geometry={navDocumentTop:rect.top+y,navHeight:nav.getBoundingClientRect().height,
      footerDocumentTop:footer.getBoundingClientRect().top+y,
      panelDocumentBottom:(panel||slot).getBoundingClientRect().bottom+y,
      tail:last?mainRect.bottom-last.getBoundingClientRect().bottom:132};
    slot.style.minHeight=`${geometry.navHeight}px`;dirty=false;
  }
  function update(){
    if(disposed)return;
    if(dirty||!geometry)measure();
    const state=functionsScrollState({...geometry,scrollY:win.scrollY,height:win.innerHeight,width:win.innerWidth,
      panelBottom:geometry.panelDocumentBottom-win.scrollY,
      footerTop:geometry.footerDocumentTop-win.scrollY,headerBottom:header?.getBoundingClientRect().bottom??96,
      reduced:reduced.matches,printing});
    if(lastPinned!==state.pinned){nav.classList.toggle('is-functions-nav-pinned',state.pinned);lastPinned=state.pinned;}
    variable('--functions-nav-top',`${state.top}px`);
    const opacity=state.opacity===1?originalOpacity:state.opacity.toFixed(4);
    if(opacity!==lastOpacity){main.style.opacity=opacity;lastOpacity=opacity;}
    const inert=originalInert||state.hidden;
    if(main.inert!==inert)main.inert=inert;
  }
  function schedule(){if(!disposed&&frame===null)frame=win.requestAnimationFrame(()=>{frame=null;update();});}
  function layout(){dirty=true;schedule();}
  function beforePrint(){printing=true;dirty=true;update();}
  function afterPrint(){printing=false;layout();}
  function navigation(){
    const hash=win.location.hash;
    if(areaForHash(hash)||['','#start','#inhalt','#funktionen'].includes(hash)){
      // Capture phase runs before the catalog controller restores heading focus.
      main.inert=originalInert;main.style.opacity=originalOpacity;lastOpacity=originalOpacity;
    }
    layout();
  }
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(layout):null;
  for(const element of [main,nav,slot])observer?.observe(element);
  win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',layout);
  win.addEventListener('pageshow',layout);win.addEventListener('beforeprint',beforePrint);win.addEventListener('afterprint',afterPrint);
  win.addEventListener('hashchange',navigation,true);win.addEventListener('popstate',navigation,true);
  reduced.addEventListener('change',layout);
  main.addEventListener('toggle',layout,true);main.addEventListener('click',layout);
  doc.fonts?.ready?.then(layout);update();
  return {update,measure:layout,dispose(){
    disposed=true;if(frame!==null)win.cancelAnimationFrame(frame);observer?.disconnect();
    win.removeEventListener('scroll',schedule);win.removeEventListener('resize',layout);win.removeEventListener('pageshow',layout);
    win.removeEventListener('beforeprint',beforePrint);win.removeEventListener('afterprint',afterPrint);
    win.removeEventListener('hashchange',navigation,true);win.removeEventListener('popstate',navigation,true);
    reduced.removeEventListener('change',layout);main.removeEventListener('toggle',layout,true);main.removeEventListener('click',layout);
    main.style.opacity=originalOpacity;main.inert=originalInert;
    nav.classList.remove('is-functions-nav-pinned');for(const name of previousValues.keys())nav.style.removeProperty(name);
    slot.replaceWith(nav);doc.body.classList.remove('functions-scroll-ready');
  }};
}
