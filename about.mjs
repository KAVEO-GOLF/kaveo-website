import {createRoadmapVideo} from './roadmap-video.mjs';
import {createAboutMotion} from './about-motion.mjs';

// All chapters are readable in the source. Tabs are a progressive enhancement,
// with no URL rewriting, scroll interception, autoplay or timed slide changes.
export function enhanceAboutChapters({win=window,doc=document}={}){
  const page=doc.querySelector('.about-page'),nav=page?.querySelector('.about-chapter-nav');
  if(!nav)return null;
  const buttons=[...nav.querySelectorAll('[data-about-chapter]')];
  const panels=[...page.querySelectorAll('[data-about-panel]')];
  if(!buttons.length||buttons.length!==panels.length||buttons.some((button,i)=>button.dataset.aboutChapter!==panels[i].dataset.aboutPanel))return null;
  const originals=[nav,...buttons,...panels].map(element=>({element,attributes:new Map(['role','aria-selected','aria-labelledby','tabindex'].map(name=>[name,element.getAttribute(name)])),hidden:element.hidden}));
  function select(index,focus=false){
    buttons.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
    if(focus)buttons[index].focus();
  }
  function fromHash(){
    const index=panels.findIndex(panel=>`#${panel.id}`===win.location.hash);
    if(index>=0)select(index);
  }
  const listeners=buttons.map((button,i)=>{
    button.setAttribute('role','tab');panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',button.id);panels[i].tabIndex=0;
    const click=()=>select(i);
    const key=event=>{
      const next={ArrowRight:(i+1)%buttons.length,ArrowLeft:(i+buttons.length-1)%buttons.length,Home:0,End:buttons.length-1}[event.key];
      if(next!==undefined){event.preventDefault();select(next,true);}
    };
    button.addEventListener('click',click);button.addEventListener('keydown',key);return {button,click,key};
  });
  nav.setAttribute('role','tablist');select(0);fromHash();page.classList.add('about-chapters-ready');
  win.addEventListener('hashchange',fromHash);
  return {select,dispose(){
    win.removeEventListener('hashchange',fromHash);
    listeners.forEach(({button,click,key})=>{button.removeEventListener('click',click);button.removeEventListener('keydown',key);});
    originals.forEach(({element,attributes,hidden})=>{element.hidden=hidden;attributes.forEach((value,name)=>value===null?element.removeAttribute(name):element.setAttribute(name,value));});
    page.classList.remove('about-chapters-ready');
  }};
}

export function createAboutPage({win=window,doc=document}={}){
  if(!doc.querySelector('.about-page'))return null;
  const chapters=enhanceAboutChapters({win,doc});
  const motion=createAboutMotion({win,doc});
  const video=createRoadmapVideo({win,doc,scope:'.about-page',includeFooter:false});
  return {chapters,motion,video,dispose(){chapters?.dispose();motion?.dispose();video?.dispose();}};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createAboutPage();
