export const PIN_TOP=0;
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const smooth=v=>v*v*(3-2*v);
// The reading plane is z=0 (sharp, unscaled type); neighbours recede from it.
// Smooth endpoints make a card turn and rise gently into the centre.
export function railCardPose(index,position){
  const delta=index-position,near=smooth(clamp(Math.abs(delta),0,1)),far=smooth(clamp(Math.abs(delta)-1,0,1));
  return {z:-220*near-80*far,y:16*near,rotateY:-16*Math.sign(delta)*near,opacity:1-.16*near-.18*far,edgeX:-1.5*Math.sign(delta)*near,focus:1-near};
}
export const railCenterOffset=(viewportWidth,cardWidth)=>Math.round((viewportWidth-cardWidth)/2);
const HOLD=.2;
// Remove only the first empty reading stretch. Later stops and movement keep
// the accepted timing; direct navigation uses the same shortened timeline.
export const railStopScroll=(index,unit)=>Math.max(0,index-HOLD)*unit;
export function railPosition(scroll,unit,count){
  const step=clamp(scroll/unit+HOLD,0,count-1),index=Math.floor(step);
  const t=clamp((step-index-HOLD)/(1-HOLD),0,1);
  return index+t*t*(3-2*t);
}
export function railMetrics({width,height,contentHeight,count,reduced=false,printing=false}){
  const enabled=!reduced&&!printing&&width>=1100&&height>=760&&contentHeight+16<=height&&count>1;
  const unit=clamp(height*.72,480,740);
  const travel=unit*(count-1);
  // Measure and pin the complete scene, including intro and header clearance.
  // Its first visible frame is already the reading plane for card A.
  return {enabled,unit,travel,height:contentHeight+travel};
}
