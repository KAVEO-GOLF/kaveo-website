import {GROUPS,CENTER,GROUP_POSITIONS,FEATURE_POSITIONS,CROSS_LINKS,clamp,ease,layoutFor,interpolatePose,curvePath,branchFor} from './network-model.mjs';
import {cardMatrix,projectPoint,connectionGeometry,bezier3D} from './network-space.mjs';
import {createElasticLinks} from './network-elastic.mjs';
import {floatPose} from './network-float.mjs';
import {FEATURE_POINTS} from './network-details.mjs';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const narrow=matchMedia('(max-width: 900px)');
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const connection=navigator.connection;
const space=$('network-space'),wires=$('connections'),hub=$('brand-hub');
const embedded=space.getAttribute('data-home-network')==='true';
const scrollLockClass=embedded?'network-detail-open':'detail-open';
const canvas=$('network-canvas'),elastic=createElasticLinks();
const detailDialog=$('feature-detail'),mobileDetailButtons=new Map();
let activeDetail=null;
let elasticRaf=0,lastDraw=performance.now(),webgl=null,webglLoading=false,webglFailed=false;
let selected=null,feature=null,paused=false,raf=0,revision=0;
let current=layoutFor(),width=1,height=1,settle=null;
let camera={x:0,y:0},cameraTarget={x:0,y:0},cameraRaf=0;
let ambientRaf=0,ambientTime=0,ambientLast=0,inView=!embedded;
let hubBox={width:178,height:190};
const motionAllowed=()=>!paused&&!detailDialog.open&&!reduced.matches&&!narrow.matches&&!connection?.saveData&&(!embedded||inView);
const ambientAllowed=()=>motionAllowed()&&!document.hidden&&inView;
const make=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;};
const append=(parent,...children)=>{parent.append(...children);return parent;};

const categoryButtons=GROUPS.map((group,index)=>{
  const position=make('div','node-position');
  const button=make('button','network-node');button.type='button';button.id=`group-${group.id}`;
  button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','feature-nodes');
  append(button,append(make('span','node-top'),make('span','node-index',`0${index+1}`),make('span','node-arrow','↗')),make('span','node-title',group.label),make('span','node-subtitle',group.subtitle));
  button.querySelector('.node-arrow').setAttribute('aria-hidden','true');
  button.addEventListener('click',()=>selectGroup(selected===group.id?null:group.id));
  position.append(button);$('category-nodes').append(position);return {position,button,box:{width:228,height:184}};
});
let featureButtons=[];

function paintPose(element,pose,box){
  const matrix=cardMatrix(pose,box,width,height,camera);
  element.style.left='0px';element.style.top='0px';element.style.opacity=pose.opacity;
  element.style.transform=`matrix3d(${matrix.join(',')})`;
  element.style.zIndex=String(100+Math.round(pose.z??0));
  element.style.setProperty('--plane-depth',String(clamp(((pose.z??0)+100)/220)));
}
function makeWire(){
  const node=document.createElementNS('http://www.w3.org/2000/svg','g');
  for(const name of ['wire-shadow','wire-body','wire-light']){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('class',name);node.append(path);}
  for(let i=0;i<2;i++){const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('class','wire-port');dot.setAttribute('r','3');node.append(dot);}
  return node;
}
function draw(){
  cancelAnimationFrame(elasticRaf);elasticRaf=0;
  const now=performance.now(),dt=Math.min(.06,Math.max(0,(now-lastDraw)/1000));lastDraw=now;
  const immediate=!motionAllowed()||document.hidden||!inView;
  const floating=!reduced.matches&&!narrow.matches&&!connection?.saveData;
  const renderPose=(pose,slot)=>floating?floatPose(pose,slot,ambientTime,height):pose;
  const poses={hub:renderPose(current.hub,0),groups:current.groups.map((p,i)=>renderPose(p,i+1)),features:current.features.map((p,i)=>renderPose(p,i+GROUPS.length+1))};
  paintPose(hub,poses.hub,hubBox);
  categoryButtons.forEach(({position,box},i)=>paintPose(position,poses.groups[i],box));
  featureButtons.forEach(({position,box},i)=>paintPose(position,poses.features[i],box));
  const activeIndex=GROUPS.findIndex(group=>group.id===selected);
  const edges=selected?poses.features.map((point,i)=>({a:poses.groups[activeIndex],b:point,boxA:categoryButtons[activeIndex].box,boxB:featureButtons[i]?.box??{width:224,height:120},opacity:point.opacity})):[
    // Speichen zur Mitte: die Hauptaussage.
    ...poses.groups.map((point,i)=>({a:poses.hub,b:point,boxA:hubBox,boxB:categoryButtons[i].box,opacity:point.opacity*poses.hub.opacity,port:branchFor(i,false)})),
    // Querverbindungen: schwaecher gezeichnet, siehe .is-cross in feinschliff.css.
    ...CROSS_LINKS.map(link=>({a:poses.groups[link.a],b:poses.groups[link.b],boxA:categoryButtons[link.a].box,boxB:categoryButtons[link.b].box,
      opacity:Math.min(poses.groups[link.a].opacity,poses.groups[link.b].opacity)*poses.hub.opacity,port:link.port,cross:true}))
  ];
  while(wires.children.length>edges.length)wires.lastElementChild.remove();
  while(wires.children.length<edges.length)wires.append(makeWire());
  const links=[];let moving=false;
  edges.forEach((edge,i)=>{
    const geometry=connectionGeometry(edge.a,edge.b,edge.boxA,edge.boxB,width,height,camera,edge.port??branchFor(i,Boolean(selected)));
    const id=`${selected??'overview'}:${i}`,spring=elastic.update(id,geometry,dt,immediate);
    moving ||= spring.moving;
    const points=Array.from({length:37},(_,n)=>bezier3D(spring.controls,n/36));
    const projected=points.map(point=>projectPoint(point,width,height,camera));
    const d=projected.map((p,n)=>`${n?'L':'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    links.push({id,points,opacity:edge.opacity,active:Boolean(selected)&&feature===i});
    const node=wires.children[i];node.style.opacity=edge.opacity;node.classList.toggle('is-active',Boolean(selected)&&feature===i);node.classList.toggle('is-cross',Boolean(edge.cross));
    node.style.setProperty('--wire-depth',String(clamp((geometry.depth+100)/220)));
    for(let p=0;p<3;p++)node.children[p].setAttribute('d',d);
    for(const [n,point] of [[3,projected[0]],[4,projected.at(-1)]]){node.children[n].setAttribute('cx',point.x);node.children[n].setAttribute('cy',point.y);}
  });
  elastic.prune(links.map(link=>link.id));
  if(webgl){
    try{
      webgl.render({width,height,view:camera,dpr:window.devicePixelRatio||1,links,cards:[
        {id:'hub',kind:'hub',box:hubBox,pose:poses.hub,active:false},
        ...categoryButtons.map((entry,i)=>({id:GROUPS[i].id,kind:'group',box:entry.box,pose:poses.groups[i],active:selected===GROUPS[i].id})),
        ...featureButtons.map((entry,i)=>({id:`${selected}:feature:${i}`,kind:'feature',box:entry.box,pose:poses.features[i],active:feature===i}))
      ]});
      canvas.hidden=false;space.classList.add('webgl-ready');
    }catch{disableWebGL();}
  }
  if(moving&&!immediate&&!ambientAllowed())elasticRaf=requestAnimationFrame(()=>{elasticRaf=0;draw();});
}
function syncAmbient(){
  if(!ambientAllowed()){cancelAnimationFrame(ambientRaf);ambientRaf=0;ambientLast=0;return;}
  if(ambientRaf)return;
  ambientLast=performance.now();ambientRaf=requestAnimationFrame(ambientFrame);
}
function ambientFrame(now){
  ambientRaf=0;if(!ambientAllowed()){ambientLast=0;return;}
  // Pausable scene time: no phase jump after returning from another tab.
  ambientTime+=Math.max(0,Math.min(.06,(now-ambientLast)/1000));ambientLast=now;
  ambientRaf=requestAnimationFrame(ambientFrame);
  // Idle floating needs only ~30 fps; navigation/camera frames remain smooth.
  if(now-lastDraw>=32)draw();
}
function disableWebGL(){
  webglFailed=true;const previous=webgl;webgl=null;
  canvas.hidden=true;space.classList.remove('webgl-ready');
  try{previous?.dispose();}catch{/* The readable DOM/SVG fallback remains usable. */}
}
async function syncRenderer(){
  if(embedded&&!inView)return;
  const available=!narrow.matches&&!reduced.matches&&!connection?.saveData;
  if(!available){const previous=webgl;webgl=null;canvas.hidden=true;space.classList.remove('webgl-ready');previous?.dispose();return;}
  if(webgl||webglLoading||webglFailed||typeof canvas.getContext!=='function')return;
  webglLoading=true;
  try{
    const {createNetworkRenderer}=await import('./network-renderer.mjs');
    if(!narrow.matches&&!reduced.matches&&!connection?.saveData){webgl=createNetworkRenderer(canvas,{onInvalidate:draw});draw();}
  }catch{disableWebGL();}finally{webglLoading=false;}
}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();disableWebGL();});
function measureBoxes(){
  hubBox={width:hub.offsetWidth||178,height:hub.offsetHeight||190};
  for(const entry of [...categoryButtons,...featureButtons])entry.box={width:entry.position.offsetWidth||entry.box.width,height:entry.position.offsetHeight||entry.box.height};
}
function measure(){width=space.clientWidth||1;height=space.clientHeight||1;measureBoxes();wires.setAttribute('viewBox',`0 0 ${width} ${height}`);draw();}

function detail(group=null,index=null){
  const item=index!==null?group?.features[index]:null;
  $('selection-label').textContent=item?`${group.label.toUpperCase()} · GEPLANT`:group?`${group.audience??'Aus der Produktvision'} · Geplant`:'SECHS BEREICHE. EIN ZUSAMMENHANG.';
  $('selection-title').textContent=item?.title??group?.title??'Wo möchtest du anfangen?';
  $('selection-copy').textContent=item?.description??group?.description??'';
  if(motionAllowed())$('selection').animate([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
}

function openFeatureDetail(group,index,opener){
  const item=group.features[index];if(!item)return;
  if(detailDialog.open)closeFeatureDetail({restoreFocus:false});
  const animate=motionAllowed();
  activeDetail={group,index,opener};
  if(selected===group.id){feature=index;featureButtons.forEach(({button},i)=>button.setAttribute('aria-pressed',String(i===index)));}
  $('feature-detail-group').textContent=group.label;
  $('feature-detail-title').textContent=item.title;
  $('feature-detail-copy').textContent=item.description;
  $('feature-detail-points').replaceChildren(...FEATURE_POINTS[item.id].map(point=>make('li','',point)));
  detailDialog.scrollTop=0;opener.setAttribute('aria-expanded','true');
  detailDialog.showModal();document.body.classList.add(scrollLockClass);
  cancelAnimationFrame(raf);settle?.();
  cancelAnimationFrame(cameraRaf);cameraRaf=0;cameraTarget={...camera};
  cancelAnimationFrame(elasticRaf);elasticRaf=0;
  syncAmbient();syncVideo();draw();
  $('feature-detail-title').focus({preventScroll:true});
  if(animate)detailDialog.animate([{opacity:0,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
}
function closeFeatureDetail({restoreFocus=true}={}){
  if(!activeDetail&&!detailDialog.open)return;
  const previous=activeDetail;activeDetail=null;
  detailDialog.getAnimations().forEach(animation=>animation.cancel());
  if(detailDialog.open)detailDialog.close();
  document.body.classList.remove(scrollLockClass);
  previous?.opener.setAttribute('aria-expanded','false');
  if(previous&&restoreFocus){
    const target=narrow.matches?mobileDetailButtons.get(`${previous.group.id}:${previous.index}`):
      selected===previous.group.id?featureButtons[previous.index]?.button:categoryButtons.find((_,i)=>GROUPS[i].id===(selected??previous.group.id))?.button;
    if(narrow.matches&&target)target.closest('details').open=true;
    target?.focus({preventScroll:!narrow.matches});
  }
  lastDraw=performance.now();draw();syncVideo();syncAmbient();
}
detailDialog.addEventListener('cancel',event=>{event.preventDefault();closeFeatureDetail();});
detailDialog.addEventListener('close',()=>{if(!detailDialog.open&&activeDetail)closeFeatureDetail();});
$('feature-detail-close').addEventListener('click',()=>closeFeatureDetail());
$('feature-detail-back').addEventListener('click',()=>closeFeatureDetail());

function renderFeatures(group){
  $('feature-nodes').replaceChildren();featureButtons=[];
  if(!group)return;
  featureButtons=group.features.map((item,index)=>{
    const position=make('div','node-position feature-position');
    const button=make('button',`network-node feature-node${item.icon?'':' no-icon'}`);button.type='button';button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','feature-detail');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
    if(item.icon){const img=make('img');img.src=`/assets/icons/${item.icon}.png`;img.alt='';img.width=192;img.height=192;button.append(img);}
    append(button,append(make('span'),make('span','node-title',item.title),make('span','node-subtitle','Geplant · Details')));
    button.addEventListener('click',()=>openFeatureDetail(group,index,button));
    button.disabled=true;position.append(button);$('feature-nodes').append(position);return {position,button,box:{width:224,height:120}};
  });
}

function selectGroup(id,{initial=false}={}){
  const previous=selected;
  if(id!==null&&!GROUPS.some(group=>group.id===id))return;
  closeFeatureDetail({restoreFocus:false});
  // One source of motion state: interrupts start at the currently drawn poses.
  revision++;const thisRevision=revision;cancelAnimationFrame(raf);
  elastic.reset();lastDraw=performance.now();
  const wasFocused=space.contains(document.activeElement)||document.activeElement===$('back-button')||document.activeElement===$('home-crumb');
  selected=id;feature=null;const group=GROUPS.find(g=>g.id===id);
  const start={hub:{...current.hub},groups:current.groups.map(p=>({...p})),features:current.features.map(p=>({...p}))};
  const end=layoutFor(id);
  if(id){renderFeatures(group);start.features=FEATURE_POSITIONS.map(()=>({...CENTER,opacity:0,scale:.76}));}
  categoryButtons.forEach(({position,button},i)=>{
    const active=!id||GROUPS[i].id===id;
    position.inert=!active;button.classList.toggle('is-center',GROUPS[i].id===id);
    button.setAttribute('aria-expanded',String(GROUPS[i].id===id));
    button.setAttribute('aria-label',GROUPS[i].id===id?`${GROUPS[i].label}. Zur Übersicht zurück`:`${GROUPS[i].label}. ${GROUPS[i].subtitle}`);
  });
  measureBoxes();
  $('back-button').hidden=!id;$('home-crumb').disabled=!id;$('group-crumb').hidden=!id;$('group-crumb').textContent=group?.label??'';
  space.setAttribute('aria-label',id?`${group.label}: drei geplante Funktionen`:'KAVEO und seine sechs Produktbereiche');
  if(!id){featureButtons.forEach(({button,position})=>{button.disabled=true;position.inert=true;});}
  detail(group);
  if(wasFocused){const target=id?categoryButtons.find((_,i)=>GROUPS[i].id===id)?.button:categoryButtons.find((_,i)=>GROUPS[i].id===previous)?.button;target?.focus({preventScroll:true});}
  const complete=()=>{
    if(thisRevision!==revision)return;
    current=end;if(!id)renderFeatures(null);featureButtons.forEach(({button})=>button.disabled=false);settle=null;raf=0;draw();
  };
  settle=complete;
  if(!motionAllowed()||initial){complete();return;}
  const began=performance.now();
  function frame(now){
    if(thisRevision!==revision)return;
    const elapsed=now-began;
    const groupProgress=clamp(elapsed/760),hubProgress=clamp(elapsed/420);
    current.hub=interpolatePose(start.hub,end.hub,hubProgress);
    current.groups=end.groups.map((pose,i)=>{
      const p=interpolatePose(start.groups[i],pose,groupProgress);
      if(GROUPS[i].id===id)p.y-=Math.sin(Math.PI*groupProgress)*.04;
      return p;
    });
    current.features=end.features.map((pose,i)=>{
      const t=id?clamp((elapsed-270-i*90)/650):clamp(elapsed/280);
      return interpolatePose(start.features[i],pose,t);
    });
    draw();if(elapsed<(id?1140:760))raf=requestAnimationFrame(frame);else complete();
  }
  raf=requestAnimationFrame(frame);
}

GROUPS.forEach((group,index)=>{
  const item=make('details','mobile-group');
  const summary=append(make('summary'),make('span','node-index',`0${index+1}`),append(make('span'),make('span','node-title',group.label),make('span','node-subtitle',group.subtitle)));
  const content=make('div','mobile-features');
  group.features.forEach((feature,i)=>{
    const button=make('button','quiet-button mobile-detail-button','Details ansehen');button.type='button';
    button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','feature-detail');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',`${feature.title}: Details ansehen`);
    button.addEventListener('click',()=>openFeatureDetail(group,i,button));mobileDetailButtons.set(`${group.id}:${i}`,button);
    append(content,append(make('section','mobile-feature'),make('span','eyebrow','GEPLANT'),make('h3','',feature.title),make('p','',feature.description),button));
  });
  append(item,summary,content);$('mobile-explorer').append(item);
});

$('back-button').addEventListener('click',()=>selectGroup(null));$('home-crumb').addEventListener('click',()=>selectGroup(null));
document.addEventListener('keydown',event=>{if(detailDialog.open)return;if(embedded&&!$('features').contains(document.activeElement))return;if(event.key==='Escape'&&selected&&!narrow.matches){event.preventDefault();selectGroup(null);}});

const video=$('landscape-video');let videoRequested=false;
function resetCamera(){cancelAnimationFrame(cameraRaf);cameraRaf=0;if(detailDialog.open){cameraTarget={...camera};return;}camera={x:0,y:0};cameraTarget={x:0,y:0};draw();}
function trackCamera(){
  if(!motionAllowed()||!fine.matches||document.hidden){resetCamera();return;}
  camera.x+=(cameraTarget.x-camera.x)*.14;camera.y+=(cameraTarget.y-camera.y)*.14;draw();
  if(Math.hypot(cameraTarget.x-camera.x,cameraTarget.y-camera.y)>.06)cameraRaf=requestAnimationFrame(trackCamera);
  else{camera={...cameraTarget};cameraRaf=0;draw();}
}
function aimCamera(x,y){if(!motionAllowed()||!fine.matches){resetCamera();return;}cameraTarget={x,y};if(!cameraRaf)cameraRaf=requestAnimationFrame(trackCamera);}
space.addEventListener('pointermove',event=>{
  if(!motionAllowed()||!fine.matches||event.pointerType!=='mouse'||event.buttons)return;
  const bounds=space.getBoundingClientRect();
  aimCamera((clamp((event.clientX-bounds.left)/bounds.width)-.5)*100,(clamp((event.clientY-bounds.top)/bounds.height)-.5)*76);
});
space.addEventListener('pointerleave',()=>aimCamera(0,0));
space.addEventListener('pointercancel',resetCamera);
window.addEventListener('blur',resetCamera);
function syncVideo(){
  const available=!reduced.matches&&!narrow.matches&&!connection?.saveData;
  $('motion-toggle').hidden=!available;
  if(embedded){document.dispatchEvent(new CustomEvent('kaveo:network-detail',{detail:{open:Boolean(detailDialog.open)}}));return;}
  if(!available){video.pause();video.classList.remove('is-ready');return;}
  if(paused||document.hidden||detailDialog.open){video.pause();return;}
  if(!videoRequested){videoRequested=true;video.src='/media/inselgruen-logo-loop-v04-web.mp4';video.load();}
  const result=video.play();result?.catch(()=>video.classList.remove('is-ready'));
}
video?.addEventListener('playing',()=>{
  if(paused||document.hidden||detailDialog.open||reduced.matches||narrow.matches||connection?.saveData){video.pause();return;}
  video.classList.add('is-ready');
});
video?.addEventListener('error',()=>video.classList.remove('is-ready'));
$('motion-toggle').addEventListener('click',()=>{
  paused=!paused;(embedded?space:document.body).classList.toggle('motion-paused',paused);
  $('motion-toggle').setAttribute('aria-pressed',String(paused));
  $('motion-toggle').textContent=embedded?(paused?'Netz fortsetzen ▷':'Netz pausieren Ⅱ'):(paused?'Bewegung fortsetzen ▷':'Bewegung pausieren Ⅱ');
  if(paused){cancelAnimationFrame(raf);settle?.();resetCamera();$('selection').getAnimations().forEach(animation=>animation.finish());}
  syncVideo();syncAmbient();
});
function preferenceChange(){cancelAnimationFrame(raf);settle?.();if(!motionAllowed())detailDialog.getAnimations().forEach(animation=>animation.cancel());resetCamera();measure();syncVideo();syncRenderer();syncAmbient();}
reduced.addEventListener('change',preferenceChange);narrow.addEventListener('change',preferenceChange);fine.addEventListener('change',preferenceChange);connection?.addEventListener?.('change',preferenceChange);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);settle?.();resetCamera();}syncVideo();syncAmbient();});
if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{
  inView=entries[0]?.isIntersecting??true;
  if(!inView){cancelAnimationFrame(raf);settle?.();resetCamera();}
  syncAmbient();if(embedded)syncRenderer();
},{threshold:0}).observe(space);
new ResizeObserver(measure).observe(space);
document.fonts?.ready.then(measure);
$('desktop-explorer').hidden=false;
if(embedded){const bounds=space.getBoundingClientRect();inView=bounds.bottom>0&&bounds.top<window.innerHeight;}
measure();syncVideo();syncRenderer();syncAmbient();
if(motionAllowed()){
  const target=layoutFor();current.hub={...CENTER,opacity:0,scale:.88};current.groups=GROUP_POSITIONS.map(point=>({...point,opacity:0,scale:.92}));draw();
  const began=performance.now();const initialRevision=revision;
  const finish=()=>{current=target;settle=null;raf=0;draw();};settle=finish;
  const enter=now=>{
    if(initialRevision!==revision)return;
    const elapsed=now-began;current.hub=interpolatePose({...CENTER,opacity:0,scale:.88},target.hub,elapsed/650);
    current.groups=target.groups.map((pose,i)=>interpolatePose({...pose,y:pose.y+.035,opacity:0,scale:.92},pose,(elapsed-120-i*85)/680));
    draw();if(elapsed<800+(GROUPS.length-1)*85)raf=requestAnimationFrame(enter);else finish();
  };raf=requestAnimationFrame(enter);
}else draw();
