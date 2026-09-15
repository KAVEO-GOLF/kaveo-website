import {AREA_IDS,areaForHash} from './roadmap-content.mjs';

// Progressive enhancement: native details and all six areas work without JS.
export function createRoadmapController({win=window,doc=document}={}){
  const body=doc.body,header=doc.querySelector('.site-header');
  const links=[...doc.querySelectorAll('[data-area-link]')],panels=[...doc.querySelectorAll('[data-area-panel]')];
  if(!body||!links.length||!panels.length)return null;
  let disposed=false,frame=0;
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  function select(id){
    if(!AREA_IDS.includes(id))return false;
    panels.forEach(panel=>{panel.hidden=panel.dataset.areaPanel!==id;});
    links.forEach(link=>{if(link.dataset.areaLink===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    return true;
  }
  function targetFor(hash){return doc.getElementById(hash.replace(/^#/,''));}
  function revealHash(scroll=false){
    const hash=win.location.hash,id=areaForHash(hash);
    // Ordinary section links must not resize the catalog during native scrolling.
    if(id||!scroll||!hash||hash==='#funktionen')select(id||AREA_IDS[0]);
    const target=targetFor(hash);
    if(target?.matches('details'))target.open=true;
    if(scroll&&target&&(id||target.matches('details'))){
      target.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});
      const focus=target.matches('details')?target.querySelector('summary'):id?target.querySelector('h3'):null;
      focus?.focus({preventScroll:true});
    }
  }
  function click(event){
    if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href^="#"]');
    const hash=link?.getAttribute('href');
    if(!hash||!targetFor(hash))return;
    // Ordinary section/skip links keep native navigation and focus semantics.
    if(!areaForHash(hash)&&!targetFor(hash).matches('details'))return;
    event.preventDefault();
    if(win.location.hash!==hash)win.history.pushState(null,'',hash);
    revealHash(true);
  }
  function syncHeader(){frame=0;header?.classList.toggle('is-scrolled',win.scrollY>64);}
  function scroll(){if(!disposed&&!frame)frame=win.requestAnimationFrame(syncHeader);}
  const history=()=>revealHash(true);
  body.classList.add('roadmap-enhanced');select(areaForHash(win.location.hash)||AREA_IDS[0]);revealHash(false);syncHeader();
  doc.addEventListener('click',click);win.addEventListener('hashchange',history);win.addEventListener('popstate',history);
  win.addEventListener('scroll',scroll,{passive:true});win.addEventListener('pageshow',syncHeader);
  return {select,dispose(){if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);
    doc.removeEventListener('click',click);win.removeEventListener('hashchange',history);win.removeEventListener('popstate',history);
    win.removeEventListener('scroll',scroll);win.removeEventListener('pageshow',syncHeader);
    body.classList.remove('roadmap-enhanced');panels.forEach(panel=>panel.hidden=false);links.forEach(link=>link.removeAttribute('aria-current'));}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapController();
