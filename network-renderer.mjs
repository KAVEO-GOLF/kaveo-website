import * as THREE from './reference/vendor/three-r180/three.module.js';
import {HDRLoader} from './reference/vendor/three-r180/HDRLoader.js';
import {createGlassGeometry,createFilamentGeometry,updateFilamentGeometry,configureNetworkCamera} from './network-solids.mjs';

export function createNetworkRenderer(canvas,{onInvalidate=()=>{}}={}){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
  const cards=new Map(),links=new Map();let disposed=false,lastSize='',environment=null;
  const hemisphere=new THREE.HemisphereLight(0xf0f1f2,0x1a1b1d,1.6);scene.add(hemisphere);
  const key=new THREE.DirectionalLight(0xfff9ea,3.5);key.position.set(-350,450,500);scene.add(key);
  const rim=new THREE.DirectionalLight(0xe5e8ee,3.1);rim.position.set(350,80,150);scene.add(rim);
  const under=new THREE.DirectionalLight(0x9c9fa6,1.2);under.position.set(-80,-300,-120);scene.add(under);
  // Reuse the approved local lighting environment; no external fetch or generation.
  new HDRLoader().loadAsync('/assets/meadow-2-1k.hdr').then(hdr=>{
    if(disposed){hdr.dispose();return;}
    const pmrem=new THREE.PMREMGenerator(renderer);
    try{environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;onInvalidate();}finally{hdr.dispose();pmrem.dispose();}
  }).catch(()=>{});
  function createCard(box,kind){
    const face=new THREE.MeshPhysicalMaterial({color:0x202123,roughness:.27,metalness:.08,clearcoat:1,clearcoatRoughness:.16,ior:1.46,transmission:.12,thickness:22,envMapIntensity:.55,transparent:true,opacity:.93,depthWrite:true});
    const side=new THREE.MeshPhysicalMaterial({color:0x65676c,roughness:.24,metalness:.24,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.75,transparent:true,opacity:.96});
    const geometry=createGlassGeometry(THREE,box.width,box.height,kind==='hub'?36:22);
    const mesh=new THREE.Mesh(geometry,[face,side]);scene.add(mesh);
    return {mesh,face,side,boxKey:`${box.width}:${box.height}`};
  }
  function createLink(){
    const geometry=createFilamentGeometry(THREE),material=new THREE.MeshStandardMaterial({color:0xa9adb1,metalness:.3,roughness:.34,transparent:true,opacity:.76,depthWrite:false});
    const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
    return {mesh,material};
  }
  function disposeMesh(entry){scene.remove(entry.mesh);entry.mesh.geometry.dispose();for(const material of Array.isArray(entry.mesh.material)?entry.mesh.material:[entry.mesh.material])material.dispose();}
  return {
    render(frame){
      if(disposed||frame.width<1||frame.height<1)return;
      const {width,height,view}=frame,dpr=Math.min(frame.dpr||1,1.75),size=`${width}:${height}:${dpr}`;
      if(size!==lastSize){lastSize=size;renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);}
      configureNetworkCamera(camera,width,height,view);
      const liveCards=new Set();
      for(const card of frame.cards){
        liveCards.add(card.id);let entry=cards.get(card.id);
        if(!entry){entry=createCard(card.box,card.kind);cards.set(card.id,entry);}
        if(entry.boxKey!==`${card.box.width}:${card.box.height}`){entry.mesh.geometry.dispose();entry.mesh.geometry=createGlassGeometry(THREE,card.box.width,card.box.height,card.kind==='hub'?36:22);entry.boxKey=`${card.box.width}:${card.box.height}`;}
        const p=card.pose;entry.mesh.visible=p.opacity>.005;
        entry.mesh.position.set(p.x*width-width/2,height*.48-p.y*height,p.z??0);
        entry.mesh.rotation.set(-(p.rx??0)*Math.PI/180,(p.ry??0)*Math.PI/180,0,'XYZ');entry.mesh.scale.setScalar(p.scale??1);
        entry.face.color.set(card.active?0x2b2d30:card.kind==='hub'?0x27282b:0x202123);
        entry.side.color.set(card.active?0x898c92:0x65676c);
        entry.face.opacity=p.opacity*.93;entry.side.opacity=p.opacity*.97;
      }
      for(const [id,entry] of cards)if(!liveCards.has(id)){disposeMesh(entry);cards.delete(id);}
      const liveLinks=new Set();
      for(const link of frame.links){
        liveLinks.add(link.id);let entry=links.get(link.id);
        if(!entry){entry=createLink();links.set(link.id,entry);}
        entry.mesh.visible=link.opacity>.01;
        updateFilamentGeometry(entry.mesh.geometry,link.points,width,height,link.active ? .95 : .72);
        entry.material.color.set(link.active?0xe1e5e9:0xa4a8ae);entry.material.opacity=link.opacity*(link.active ? .96 : .76);
      }
      for(const [id,entry] of links)if(!liveLinks.has(id)){disposeMesh(entry);links.delete(id);}
      renderer.render(scene,camera);
    },
    dispose(){if(disposed)return;disposed=true;for(const entry of cards.values())disposeMesh(entry);for(const entry of links.values())disposeMesh(entry);cards.clear();links.clear();environment?.dispose();renderer.dispose();}
  };
}
