import * as THREE from './reference/vendor/three-r180/three.module.js';
import { GLTFLoader } from './vendor/three-r180/loaders/GLTFLoader.js';
import { HDRLoader } from './reference/vendor/three-r180/HDRLoader.js';
import { CAMERA, PHOTO, RADIUS, coverCrop } from './green-ball-flight.mjs';
import { BALL_VISUAL_SCALE, presentationPose, ballPixelRatio } from './green-ball-presentation.mjs';
import { createBallOrientation } from './green-ball-orientation.mjs';
import { closeupPose, createCloseupOrientation } from './ball-finale-model.mjs';

// Web-Paket 20.09.2026 (KAVEO Golfball V08): echtes 3D-Asset statt der
// bisherigen prozeduralen Kugel + flachem Logo-Decal. glTF Y-up, Radius
// 0.021335 m -- passt exakt auf die bestehende Umrechnung `units=1/RADIUS`.
const GLB_ASSET = Object.freeze({
  hero: './assets/kaveo-ball-v08-hero.glb',
  footer: './assets/kaveo-ball-v08-footer.glb'
});
// Entspricht ungefaehr der alten Wirkung (sceneIntensity .62 x ENVIRONMENT_RESPONSE .88).
// Nur ein Startwert -- im Browser gegen das tatsaechliche Homepage-Licht pruefen.
const BALL_ENV_INTENSITY = .55;
// Das entfernte markGeometry-Decal bildete seine UV-Mitte auf Breite +0.10 ab;
// deshalb tragen die bestehenden Orientierungsfunktionen (green-ball-orientation.mjs,
// ball-finale-model.mjs) eine feste +0.10-rad-Korrektur genau fuer dieses Mesh.
// Das neue Modell hat kein Decal mehr -- die Korrektur hier lokal aufheben,
// sonst sitzt das eingebrannte Logo leicht verkippt. Nach dem ersten Ansehen
// im Browser ggf. nachjustieren (beide Logo-Seiten pruefen).
const MARK_OFFSET_CORRECTION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -.10);

export async function createGreenBallRenderer(canvas, {variant='hero'}={}) {
  // Keep existing unit-radius geometry/material intact. SI positions are
  // converted to radius units; no remodelling or logo replacement.
  const units = 1/RADIUS;
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.fov,PHOTO.width/PHOTO.height,.05,200*units);
  camera.position.set(0,CAMERA.height*units,0);
  camera.rotation.x=-CAMERA.pitch;
  const resources = [];
  const keep = object => (resources.push(object),object);
  let disposed=false;
  const dispose = () => {
    if (disposed) return;
    disposed=true;
    resources.forEach(resource=>resource.dispose());
    renderer.dispose();
    canvas.hidden=true;
  };
  try {
    const glbHref=new URL(GLB_ASSET[variant]??GLB_ASSET.hero,import.meta.url).href;
    const loads = await Promise.allSettled([
      new GLTFLoader().loadAsync(glbHref),
      new HDRLoader().loadAsync(new URL('./assets/meadow-2-1k.hdr',import.meta.url).href)
    ]);
    if (loads[0].status==='rejected') throw loads[0].reason;
    const visual=loads[0].value.scene;
    let environment=null;
    if (loads[1].status==='fulfilled') {
      const pmrem=new THREE.PMREMGenerator(renderer);
      try { environment=keep(pmrem.fromEquirectangular(loads[1].value)).texture; }
      finally { pmrem.dispose(); }
    }
    scene.add(new THREE.HemisphereLight(0xe7eff7,0x6d794a,environment ? .3 : 1.6));
    const sunlight=new THREE.DirectionalLight(0xfff1da,3.1);
    sunlight.position.set(-5,6,-1.5);
    scene.add(sunlight);
    const ball=new THREE.Group();
    ball.scale.setScalar(BALL_VISUAL_SCALE);
    visual.scale.setScalar(units);
    visual.quaternion.copy(MARK_OFFSET_CORRECTION);
    visual.traverse(object=>{
      if(!object.isMesh) return;
      keep(object.geometry);
      const materials=Array.isArray(object.material)?object.material:[object.material];
      materials.forEach(material=>{
        keep(material);
        material.envMap=environment;
        material.envMapIntensity=BALL_ENV_INTENSITY;
        material.needsUpdate=true;
      });
    });
    ball.add(visual);
    scene.add(ball);
    const orientBall=createBallOrientation(THREE);
    const orientCloseup=createCloseupOrientation(THREE);
    const shadowMaterial=keep(new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      uniforms:{opacity:{value:0}},
      vertexShader:'varying vec2 shadowUv; void main(){shadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 shadowUv;uniform float opacity;void main(){float r=length((shadowUv-.5)*2.);float a=(1.-smoothstep(.35,1.,r))*opacity;gl_FragColor=vec4(.06,.075,.04,a);}'
    }));
    const shadow=new THREE.Mesh(keep(new THREE.PlaneGeometry(2,2)),shadowMaterial);
    shadow.rotation.x=-Math.PI/2;
    scene.add(shadow);
    let lastKey='';
    return {
      draw(progress,width,height,pixelRatio=1,closeupProgress=0,dock=null) {
        if (disposed||width<=0||height<=0) return;
        const ratio=ballPixelRatio(width,height,pixelRatio);
        const key=[progress,width,height,ratio,closeupProgress,dock?.progress,dock?.x,dock?.y,dock?.diameter].join(':');
        if (key===lastKey) return;
        const crop=coverCrop(width,height);
        camera.setViewOffset(crop.fullWidth,crop.fullHeight,crop.offsetX,crop.offsetY,width,height);
        if (renderer.getPixelRatio()!==ratio||canvas.width!==Math.floor(width*ratio)||canvas.height!==Math.floor(height*ratio)) {
          renderer.setPixelRatio(ratio);
          renderer.setSize(width,height,false);
        }
        const pose=closeupProgress>0?closeupPose(closeupProgress,width,height,dock):presentationPose(progress);
        ball.position.set(pose.position.x*units,pose.position.y*units,pose.position.z*units);
        if(closeupProgress>0)orientCloseup(ball.quaternion,pose.position);
        else orientBall(ball.quaternion,pose.angle);
        shadow.position.set(pose.shadow.x*units,.001*units,pose.shadow.z*units);
        shadow.scale.setScalar(pose.shadow.radius*units);
        shadowMaterial.uniforms.opacity.value=pose.shadow.opacity;
        renderer.render(scene,camera);
        canvas.dataset.phase=pose.phase;
        lastKey=key;
      },dispose
    };
  } catch (error) { dispose(); throw error; }
}
