// Three is injected so geometry can also be checked without a browser/WebGL.
export const CARD_DEPTH=22;
export function roundedShape(THREE,width,height,radius){
  const r=Math.min(radius,width/2,height/2),x=-width/2,y=-height/2,s=new THREE.Shape();
  s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);
  s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
export function createGlassGeometry(THREE,width,height,radius=22,depth=CARD_DEPTH){
  const bevel=2.8;
  const shape=roundedShape(THREE,width-bevel*2,height-bevel*2,radius-bevel);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:depth-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,curveSegments:10,steps:1});
  geometry.translate(0,0,-depth+bevel);geometry.computeBoundingBox();return geometry;
}
export function createFilamentGeometry(THREE,segments=36,radial=6){
  const count=(segments+1)*(radial+1),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
  const indices=[];
  for(let i=0;i<segments;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+radial+1;indices.push(a,a+1,b,b,a+1,b+1);}
  geometry.setIndex(indices);geometry.userData={segments,radial};return geometry;
}
export function updateFilamentGeometry(geometry,points,width,height,radius=.8){
  const positions=geometry.attributes.position.array,normals=geometry.attributes.normal.array,{radial}=geometry.userData;
  for(let i=0;i<points.length;i++){
    const point=points[i],before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
    let tx=after.x-before.x,ty=before.y-after.y,tz=after.z-before.z;
    const length=Math.hypot(tx,ty,tz)||1;tx/=length;ty/=length;tz/=length;
    const xy=Math.hypot(tx,ty);const nx=xy>1e-6?ty/xy:1,ny=xy>1e-6?-tx/xy:0,nz=0;
    const bx=ty*nz-tz*ny,by=tz*nx-tx*nz,bz=tx*ny-ty*nx;
    for(let j=0;j<=radial;j++){
      const angle=j/radial*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),k=(i*(radial+1)+j)*3;
      const x=nx*c+bx*s,y=ny*c+by*s,z=nz*c+bz*s;
      positions[k]=point.x-width/2+x*radius;positions[k+1]=height*.48-point.y+y*radius;positions[k+2]=point.z+z*radius;
      normals[k]=x;normals[k+1]=y;normals[k+2]=z;
    }
  }
  geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;
}
export function configureNetworkCamera(camera,width,height,view,distance=1200){
  const near=1;
  camera.position.set(view.x,-view.y,distance);
  camera.projectionMatrix.makePerspective((-width/2-view.x)*near/distance,(width/2-view.x)*near/distance,(height*.48+view.y)*near/distance,(-height*.52+view.y)*near/distance,near,4000);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.updateMatrixWorld();
}
