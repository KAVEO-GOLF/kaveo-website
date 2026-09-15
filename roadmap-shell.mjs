import {areaForHash} from './roadmap-content.mjs';
import './roadmap-exit.mjs';

// Known old category/feature bookmarks follow the moved content. Unknown
// fragments, package links and homepage navigation keep their existing meaning.
export function relocatedFunctionTarget(hash){
  return hash==='#funktionen'||areaForHash(hash)?'funktionen.html'+hash:null;
}
export function createRoadmapShell({win=window,doc=document}={}){
  const header=doc.querySelector('.site-header');let frame=null,disposed=false;
  function sync(){frame=null;header?.classList.toggle('is-scrolled',win.scrollY>64);}
  function scroll(){if(!disposed&&frame===null)frame=win.requestAnimationFrame(sync);}
  function relocate(){const target=relocatedFunctionTarget(win.location.hash);if(target)win.location.replace(target);}
  win.addEventListener('scroll',scroll,{passive:true});win.addEventListener('pageshow',sync);
  win.addEventListener('hashchange',relocate);win.addEventListener('popstate',relocate);sync();relocate();
  return {dispose(){disposed=true;if(frame!==null)win.cancelAnimationFrame(frame);
    win.removeEventListener('scroll',scroll);win.removeEventListener('pageshow',sync);win.removeEventListener('hashchange',relocate);win.removeEventListener('popstate',relocate);}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createRoadmapShell();
