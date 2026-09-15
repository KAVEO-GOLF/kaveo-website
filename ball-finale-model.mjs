import {CAMERA,RADIUS,clamp,coverCrop} from './green-ball-flight.mjs';
import {presentationPose,BALL_VISUAL_SCALE} from './green-ball-presentation.mjs';

export const smooth=value=>{const t=clamp(value);return t*t*t*(t*(t*6-15)+10);};
export const finaleProgress=(top,height)=>clamp((height*1.03-top)/(height*.85));
export const dockProgress=(top,height)=>smooth((height*.18-top)/(height*.58));

// The anchor is normal document flow, outside the animated text. Convert its
// viewport coordinates into the actual canvas (also after sticky unpins).
export function ballDock(top,height,anchor,media,width,canvasHeight){
  const progress=dockProgress(top,height);
  if(!progress||!anchor?.width||!anchor?.height||!media?.width||!media?.height)return null;
  const sx=width/media.width,sy=canvasHeight/media.height;
  const diameter=Math.min(anchor.width*sx,anchor.height*sy)*.92;
  const anchorY=anchor.top+anchor.height/2;
  const visibleY=Math.min(anchorY,height-24-diameter/(2*sy));
  return {progress,x:(anchor.left+anchor.width/2-media.left)*sx,
    y:(visibleY-media.top)*sy,diameter};
}

export function finaleState(top,signupTop,height,{staticMode=false,networkFocused=false,signupFocused=false,anchorBottom=null,columnHeight=0}={}){
  if(staticMode)return {progress:0,networkOpacity:1,preludeOpacity:1,shade:0,ballOpacity:1,copyOpacity:1,formOpacity:1};
  const progress=finaleProgress(top,height),approach=smooth(progress);
  const handoff=smooth((height*.20-top)/(height*.34));
  // Short/zoomed windows must never scroll past the heading before it is shown.
  const clearance=anchorBottom===null||columnHeight>height*.86-112?1:smooth((height-anchorBottom)/(height*.14));
  const reveal=smooth((height*.78-signupTop)/(height*.42))*handoff;
  return {progress,networkOpacity:networkFocused?1:1-smooth((height*1.02-top)/(height*.46)),
    preludeOpacity:1-approach,shade:.64*approach+.16*reveal,
    ballOpacity:1,
    copyOpacity:signupFocused?1:reveal*clearance,
    formOpacity:signupFocused?1:smooth((height*.73-signupTop)/(height*.37))*handoff};
}

// Move the existing ball in the calibrated camera, never zoom the flat video.
// Logarithmic depth yields a gradual approach rather than an abrupt size jump.
export function closeupPose(progress,width,height,dock=null){
  const rest=presentationPose(1),s=smooth(progress),crop=coverCrop(width,height);
  if(!s)return {...rest,closeup:0};
  const f=crop.fullHeight/(2*Math.tan(CAMERA.fov*Math.PI/360));
  const cx=crop.fullWidth/2-crop.offsetX,cy=crop.fullHeight/2-crop.offsetY;
  const c=Math.cos(CAMERA.pitch),t=Math.sin(CAMERA.pitch),dy=rest.position.y-CAMERA.height;
  const y0=dy*c-rest.position.z*t,d0=-dy*t-rest.position.z*c;
  const px0=cx+f*rest.position.x/d0,py0=cy-f*y0/d0;
  const blend=dock?clamp(dock.progress):0;
  const px1=width*.5+((dock?.x??width*.5)-width*.5)*blend;
  const py1=height*.46+((dock?.y??height*.46)-height*.46)*blend;
  const initialDiameter=Math.min(340,height*.32,width*.28);
  const diameter=initialDiameter+((dock?.diameter??initialDiameter)-initialDiameter)*blend,r=RADIUS*BALL_VISUAL_SCALE;
  const a=(px1-cx)/f,b=(cy-py1)/f,m=Math.max(a*a,b*b),v=diameter/(2*f),A=1+m;
  const d1=r*Math.sqrt(1+(A+Math.sqrt(A*A+4*v*v*m))/(2*v*v));
  const depth=d0*Math.pow(d1/d0,s),px=px0+(px1-px0)*s,py=py0+(py1-py0)*s;
  const x=(px-cx)*depth/f,y=(cy-py)*depth/f;
  return {...rest,phase:'closeup',closeup:s,position:{x,y:CAMERA.height+c*y-t*depth,z:-t*y-c*depth},
    shadow:{...rest.shadow,opacity:rest.shadow.opacity*(1-s)**2}};
}

export function createCloseupOrientation(THREE){
  const camera=new THREE.Vector3(0,CAMERA.height,0),screenUp=new THREE.Vector3(0,Math.cos(CAMERA.pitch),-Math.sin(CAMERA.pitch));
  const toward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),position=new THREE.Vector3(),matrix=new THREE.Matrix4();
  const markOffset=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.10);
  return (quaternion,point)=>{
    position.set(point.x,point.y,point.z);toward.copy(camera).sub(position).normalize();
    right.crossVectors(screenUp,toward).normalize();up.crossVectors(toward,right).normalize();
    return quaternion.setFromRotationMatrix(matrix.makeBasis(right,up,toward)).multiply(markOffset);
  };
}
