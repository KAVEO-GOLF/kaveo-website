import {createRoadmapVideo} from './roadmap-video.mjs';
import {enhanceFunctionDetails} from './functions-disclosure.mjs';
import {createFunctionsScroll} from './functions-scroll.mjs';

// One viewport-sized image/video continues from the reading range into the footer.
// Native page scrolling and the original category/deep-link controller stay intact.
export function createFunctionsScene({win=window,doc=document}={}){
  if(!doc.querySelector('.functions-page'))return null;
  const main=doc.querySelector('.roadmap-main'),landscape=doc.querySelector('.roadmap-landscape');
  const closing=doc.querySelector('[data-shared-footer]');
  const picture=landscape?.querySelector('img');
  if(!main||!landscape||!picture)return null;
  let pending=null,disposed=false,lastHeight=0;
  const frame=doc.createElement('div');frame.className='functions-landscape-frame';
  landscape.appendChild(frame);frame.appendChild(picture);landscape.classList.add('has-functions-landscape');
  if(closing)doc.body.classList.add('functions-continuous-scene');
  function measure(){
    pending=null;if(disposed)return;
    const height=Math.ceil((closing||main).getBoundingClientRect().bottom-landscape.getBoundingClientRect().top);
    if(!Number.isFinite(height)||height<=0||height===lastHeight)return;
    landscape.style.setProperty('--functions-scene-height',`${height}px`);lastHeight=height;
  }
  function schedule(){if(!disposed&&pending===null)pending=win.requestAnimationFrame(measure);}
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
  observer?.observe(main);
  if(closing)observer?.observe(closing);
  // Includes native details, responsive line wrapping and category changes.
  main.addEventListener('toggle',schedule,true);win.addEventListener('resize',schedule);win.addEventListener('pageshow',schedule);
  doc.fonts?.ready?.then(schedule);measure();
  const disclosures=[...doc.querySelectorAll('.functions-page .roadmap-feature')]
    .map(details=>enhanceFunctionDetails(details,{win,doc})).filter(Boolean);
  const video=createRoadmapVideo({win,doc,scope:'.functions-page',includeFooter:!closing});
  const scroll=createFunctionsScroll({win,doc});
  return {video,scroll,measure,dispose(){
    disposed=true;observer?.disconnect();if(pending!==null)win.cancelAnimationFrame(pending);
    main.removeEventListener('toggle',schedule,true);win.removeEventListener('resize',schedule);win.removeEventListener('pageshow',schedule);
    disclosures.forEach(disclosure=>disclosure.dispose());
    scroll?.dispose();
    video?.dispose();frame.replaceWith(picture);landscape.classList.remove('has-functions-landscape');
    if(closing)doc.body.classList.remove('functions-continuous-scene');
    landscape.style.removeProperty('--functions-scene-height');
  }};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createFunctionsScene();
