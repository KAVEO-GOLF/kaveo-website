import * as THREE from './reference/vendor/three-r180/three.module.js';
import {GLTFLoader} from './vendor/three-r180/loaders/GLTFLoader.js';
import {HDRLoader} from './reference/vendor/three-r180/HDRLoader.js';
import {assemblyPose,SCREEN} from './phone-assembly-model.mjs';
import {createAssemblyUI} from './phone-assembly-ui.mjs';

export async function createAssemblyRenderer(canvas,{doc=document}={}) {
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,2000);
  camera.position.set(0,0,1000);const group=new THREE.Group();scene.add(group);
  const resources=new Set(),keep=item=>(resources.add(item),item);
  let disposed=false,phone;
  const dispose=()=>{if(disposed)return;disposed=true;resources.forEach(r=>r.dispose?.());renderer.dispose();};
  try {
    const loads=await Promise.allSettled([
      new GLTFLoader().loadAsync('media/kaveo-smartphone-v01.glb'),createAssemblyUI(doc),
      new HDRLoader().loadAsync('assets/meadow-2-1k.hdr')
    ]);
    if(loads[0].status==='fulfilled') {
      phone=loads[0].value.scene;
      phone.traverse(object=>{if(object.isMesh){keep(object.geometry);for(const m of Array.isArray(object.material)?object.material:[object.material])keep(m);}});
    }
    if(loads[2].status==='fulfilled') {
      const hdr=keep(loads[2].value),pmrem=new THREE.PMREMGenerator(renderer);
      try {scene.environment=keep(pmrem.fromEquirectangular(hdr)).texture;} finally {pmrem.dispose();}
    }
    if(loads[0].status==='rejected')throw loads[0].reason;
    if(loads[1].status==='rejected')throw loads[1].reason;
    const screen=phone.getObjectByName('KAVEO_UI_SCREEN');
    if(!screen?.isMesh)throw new Error('Native UI screen missing');
    const texture=(image,flipY=true)=>{
      const t=keep(new THREE.CanvasTexture(image));t.colorSpace=THREE.SRGBColorSpace;t.flipY=flipY;
      t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
    };
    const ui=loads[1].value,displayTexture=texture(ui.display,false);
    screen.material=keep(new THREE.MeshBasicMaterial({map:displayTexture,toneMapped:false}));
    group.add(phone);
    const planes=loads[1].value.cards.map(card=>{
      const mesh=new THREE.Mesh(keep(new THREE.PlaneGeometry(1,1)),keep(new THREE.MeshBasicMaterial({map:texture(card),transparent:true,alphaTest:.01,toneMapped:false,depthWrite:true})));
      group.add(mesh);return mesh;
    });
    scene.add(new THREE.HemisphereLight(0xe8edf3,0x465341,2.4));
    const key=new THREE.DirectionalLight(0xfff7e7,3.2);key.position.set(-200,400,600);scene.add(key);
    const rim=new THREE.DirectionalLight(0xc8dbe7,2.4);rim.position.set(300,40,-50);scene.add(rim);
    let lastSize='',lastDisplay='';
    return {render(progress,width,height,dpr=1,pager={page:0,offset:0}){
      if(disposed||width<1||height<1)return;
      const ratio=Math.min(dpr,width<700?1.5:2),size=`${width}:${height}:${ratio}`;
      if(size!==lastSize){lastSize=size;renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);
        camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();}
      const state=assemblyPose(progress,width,height);
      const ready=state.cards.every(card=>card.settled),page=ready?pager.page:null,offset=ready?pager.offset:0;
      const displayKey=`${page}:${offset}`;
      if(displayKey!==lastDisplay){lastDisplay=displayKey;ui.paint(page,offset);displayTexture.needsUpdate=true;}
      group.scale.setScalar(state.scale);group.rotation.y=state.angleY;group.position.y=state.offsetY;
      state.cards.forEach((card,i)=>{const mesh=planes[i];mesh.visible=!ready;mesh.position.set(card.x,card.y,card.z);mesh.rotation.z=card.angle;mesh.scale.set(card.width,card.height,1);});
      renderer.render(scene,camera);
      return {ready,bounds:{left:(width-SCREEN.width*state.scale)/2,top:(height-SCREEN.height*state.scale)/2,
        width:SCREEN.width*state.scale,height:SCREEN.height*state.scale}};
    },dispose};
  } catch(error){dispose();throw error;}
}
