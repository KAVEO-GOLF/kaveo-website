import * as THREE from './vendor/three-r180/three.module.js';

// Actual mesh displacement; units are normalized to the ball radius.
export const BALL_CENTER=2.04;
export const DIMPLE_RADIUS=.078;
export const DIMPLE_DEPTH=.0068;
const step=Math.PI/18;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const rings=Array.from({length:17},(_,i)=>{
  const ring=i+1,phi=-Math.PI/2+ring*step,count=Math.round(2*Math.PI*Math.cos(phi)/step);
  return {ring,phi,count,step:2*Math.PI/count,stagger:ring%2*.5};
});
export function surfaceAt(x,y,z){
  const length=Math.hypot(x,y,z);x/=length;y/=length;z/=length;
  const lat=Math.asin(clamp(y,-1,1)),lon=Math.atan2(x,z),band=Math.floor((lat+Math.PI/2)/step+.5);
  let cx=0,cy=y<0?-1:1,cz=0,d2=x*x+(y-cy)**2+z*z;
  for(let j=-1;j<=1;j++){
    const ring=rings[clamp(band+j,1,17)-1];
    const cell=Math.floor(lon/ring.step-ring.stagger+.5),cphi=Math.cos(ring.phi),sy=Math.sin(ring.phi);
    for(let i=-1;i<=1;i++){
      const theta=(cell+i+ring.stagger)*ring.step,xx=Math.sin(theta)*cphi,zz=Math.cos(theta)*cphi;
      const dd=(x-xx)**2+(y-sy)**2+(z-zz)**2;
      if(dd<d2){d2=dd;cx=xx;cy=sy;cz=zz;}
    }
  }
  const bowl=Math.max(0,1-d2/(DIMPLE_RADIUS*DIMPLE_RADIUS));
  const radius=1-DIMPLE_DEPTH*bowl*bowl;
  const slope=4*DIMPLE_DEPTH/(DIMPLE_RADIUS*DIMPLE_RADIUS)*bowl/radius,dot=x*cx+y*cy+z*cz;
  const nx=x-(x*dot-cx)*slope,ny=y-(y*dot-cy)*slope,nz=z-(z*dot-cz)*slope,nl=Math.hypot(nx,ny,nz);
  return {radius,normal:[nx/nl,ny/nl,nz/nl],bowl};
}
export function ballGeometry(segments=512){
  const geo=new THREE.SphereGeometry(1,segments,segments/2),p=geo.attributes.position,n=geo.attributes.normal;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),length=Math.hypot(x,y,z),s=surfaceAt(x,y,z);
    p.setXYZ(i,x/length*s.radius,y/length*s.radius,z/length*s.radius);n.setXYZ(i,...s.normal);
  }
  geo.computeBoundingSphere();return geo;
}
export function markGeometry(){
  const geo=new THREE.PlaneGeometry(1,1,144,144),p=geo.attributes.position,n=geo.attributes.normal;
  for(let i=0;i<p.count;i++){
    const lon=p.getX(i)*.88,lat=p.getY(i)*.88+.10;
    const x=Math.sin(lon)*Math.cos(lat),y=Math.sin(lat),z=Math.cos(lon)*Math.cos(lat),s=surfaceAt(x,y,z),r=s.radius+.0012;
    p.setXYZ(i,x*r,y*r,z*r);n.setXYZ(i,...s.normal);
  }
  geo.computeBoundingSphere();return geo;
}
export function teeRadius(q){return .063+.187*(1-smooth(1.015,1.31,q))-.024*smooth(1.72,2.2,q);}
export function teeGeometry(){
  const points=[];
  // Rounded shoulder, slightly thicker stem, buried tapered tip, then the cupped seat.
  const rim=Math.sqrt(1-.25*.25);
  for(let i=0;i<=220;i++){
    const q=2.22-i*(2.22-rim)/220;points.push(new THREE.Vector2(teeRadius(q),BALL_CENTER-q));
  }
  for(let i=1;i<=64;i++){
    const r=.25*(1-i/64),q=Math.sqrt(1-r*r);points.push(new THREE.Vector2(r,BALL_CENTER-q));
  }
  // Keep the analytic meridian normals continuous across the longitude seam.
  const geo=new THREE.LatheGeometry(points,160);geo.normalizeNormals();
  const p=geo.attributes.position,n=geo.attributes.normal;
  for(let i=0;i<p.count;i++)if(Math.hypot(p.getX(i),p.getZ(i))<1e-8)n.setXYZ(i,0,1,0);
  return geo;
}
export function grassGeometry(){
  // Small, deterministic foreground blades; only enough to seat the tee in the turf.
  const positions=[],colors=[],indices=[];let seed=43;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let b=0;b<145;b++){
    const a=random()*Math.PI*2,r=.09+Math.sqrt(random())*.95,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const height=.038+random()*.115,width=.008+random()*.009,lean=(random()-.5)*.13,theta=random()*Math.PI*2;
    const wx=Math.cos(theta)*width,wz=Math.sin(theta)*width,offset=positions.length/3;
    const shade=random(),col=new THREE.Color().setRGB(.07+shade*.08,.085+shade*.09,.023+shade*.036);
    for(let j=0;j<=4;j++){
      const t=j/4,s=1-t*.92,cx=x+lean*t*t,cz=z+lean*.45*t*t;
      positions.push(cx-wx*s,t*height-.009,cz-wz*s,cx+wx*s,t*height-.009,cz+wz*s);
      for(let k=0;k<2;k++)colors.push(col.r*(.75+t*.25),col.g*(.75+t*.25),col.b*(.75+t*.25));
      if(j<4){const i=offset+j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
