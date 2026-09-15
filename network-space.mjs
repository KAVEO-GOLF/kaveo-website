// One 3D projection for both readable DOM planes and their SVG connections.
// CSS matrix3d projects each card exactly as projectPoint projects its ports.
export const PERSPECTIVE=1200;
export const ORIGIN={x:.5,y:.48};
const radians=angle=>angle*Math.PI/180;
const mix=(a,b,t)=>a+(b-a)*t;
export function planeAxes(pose){
  const x=radians(pose.rx??0),y=radians(pose.ry??0);
  return {u:{x:Math.cos(y),y:Math.sin(x)*Math.sin(y),z:-Math.cos(x)*Math.sin(y)},v:{x:0,y:Math.cos(x),z:Math.sin(x)},n:{x:Math.sin(y),y:-Math.sin(x)*Math.cos(y),z:Math.cos(x)*Math.cos(y)}};
}
export function worldPoint(pose,local,width,height){
  const {u,v,n}=planeAxes(pose),s=pose.scale??1,depth=local.z??0;
  return {x:pose.x*width+s*(local.x*u.x+local.y*v.x+depth*n.x),y:pose.y*height+s*(local.x*u.y+local.y*v.y+depth*n.y),z:(pose.z??0)+s*(local.x*u.z+local.y*v.z+depth*n.z)};
}
export function projectPoint(point,width,height,camera={x:0,y:0}){
  const ox=width*ORIGIN.x+camera.x,oy=height*ORIGIN.y+camera.y;
  const factor=PERSPECTIVE/(PERSPECTIVE-point.z);
  return {x:ox+(point.x-ox)*factor,y:oy+(point.y-oy)*factor,scale:factor,z:point.z};
}
export function cardMatrix(pose,box,width,height,camera={x:0,y:0}){
  const {u,v}=planeAxes(pose),s=pose.scale??1;
  const c=worldPoint(pose,{x:-box.width/2,y:-box.height/2},width,height);
  const ox=width*ORIGIN.x+camera.x,oy=height*ORIGIN.y+camera.y,D=PERSPECTIVE;
  return [s*(u.x-ox*u.z/D),s*(u.y-oy*u.z/D),0,-s*u.z/D,
    s*(v.x-ox*v.z/D),s*(v.y-oy*v.z/D),0,-s*v.z/D,
    0,0,1,0,c.x-ox*c.z/D,c.y-oy*c.z/D,0,1-c.z/D];
}
function localPort(side,box,amount){
  const horizontal=side==='left'||side==='right';
  return horizontal?{x:(side==='left'?-1:1)*(box.width/2+.5),y:amount*box.height*.3,z:-8}:{x:amount*box.width*.3,y:(side==='top'?-1:1)*(box.height/2+.5),z:-8};
}
function outward(pose,side){
  const {u,v}=planeAxes(pose),basis=side==='left'||side==='right'?u:v;
  const sign=side==='left'||side==='top'?-1:1;
  return {x:basis.x*sign,y:basis.y*sign,z:basis.z*sign};
}
export function bezier3D(points,t){
  const u=1-t,[a,b,c,d]=points,result={};
  for(const key of ['x','y','z'])result[key]=u*u*u*a[key]+3*u*u*t*b[key]+3*u*t*t*c[key]+t*t*t*d[key];
  return result;
}
export function connectionGeometry(a,b,boxA,boxB,width,height,camera={x:0,y:0},index=0){
  // Fixed side choices per spatial branch avoid ports flipping near diagonals.
  const vertical=index===2;
  const right=index===1||index===3;
  const sideA=vertical?'bottom':right?'right':'left',sideB=vertical?'top':right?'left':'right';
  const bias=Math.max(-1,Math.min(1,(b.y-a.y)*2));
  const start=worldPoint(a,localPort(sideA,boxA,vertical?-.1:bias),width,height);
  const end=worldPoint(b,localPort(sideB,boxB,vertical?.1:-bias*.4),width,height);
  const na=outward(a,sideA),nb=outward(b,sideB);
  const span=Math.hypot(end.x-start.x,end.y-start.y);
  const reach=Math.max(28,Math.min(110,span*.42));
  const arc=(index%2===0?1:-1)*32,sag=Math.min(34,span*.15);
  const p1={x:start.x+na.x*reach,y:start.y+na.y*reach+sag,z:start.z+na.z*reach+arc};
  const p2={x:end.x+nb.x*reach,y:end.y+nb.y*reach+sag,z:end.z+nb.z*reach+arc};
  const controls=[start,p1,p2,end];
  const samples=Array.from({length:37},(_,i)=>projectPoint(bezier3D(controls,i/36),width,height,camera));
  return {d:samples.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' '),start:samples[0],end:samples.at(-1),samples,controls,
    depth:mix(start.z,end.z,.5),sideA,sideB,normals:[na,nb]};
}
