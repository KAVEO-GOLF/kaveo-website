// Project the existing keyed person onto the green. No generated shadow asset,
// replacement portrait, second video, or independent animation clock.
export const PERSON_SOURCE={width:718,height:960};
export const FOOT_CONTACTS=[{x:279.5,y:883},{x:402,y:917}];
// Sampled existing alpha underedges (v02 end PNG), excluding the ankle edge.
const FOOT_SOLES=[
  [[254.5,875],[258.5,878],[262.5,881],[266.5,882],[270.5,883],[274.5,883],[278.5,883],[282.5,882],[286.5,882],[290.5,882],[294.5,881],[298.5,881],[302.5,880],[306.5,879],[310.5,878],[314.5,876],[318.5,873],[322.5,872],[326.5,871],[330.5,871],[334.5,871],[338.5,871],[342.5,870],[346.5,870],[350.5,869],[354.5,868],[358.5,867],[362.5,866],[364.5,863]],
  [[380.5,910],[384.5,914],[388.5,916],[392.5,917],[396.5,917],[400.5,917],[404.5,917],[408.5,917],[412.5,916],[416.5,915],[420.5,915],[424.5,914],[428.5,912],[432.5,910],[436.5,908],[440.5,901],[444.5,895],[448.5,891]]
];
export function founderPlacement(width,height) {
  const scale=Math.min(width*.66/PERSON_SOURCE.width,height*.66/PERSON_SOURCE.height);
  return {scale,x:width*.265+(width*.66-PERSON_SOURCE.width*scale)/2,
    y:height*.15+(height*.66-PERSON_SOURCE.height*scale)/2};
}
export function groundProjection(reach=1,slope=.092561) {
  const [left,right]=FOOT_CONTACTS;
  const m=(right.y-left.y)/(right.x-left.x),intercept=left.y-m*left.x;
  const down=reach*slope;
  // Every point on the oblique sole-contact line stays fixed. Raised pixels
  // project right/down parallel to the flag's measured shadow in the poster.
  return {a:1+reach*m,b:(1+down)*m,c:-reach,d:-down,
    e:reach*intercept,f:(1+down)*intercept};
}
export function createFounderGrounding(doc) {
  const layer=doc.createElement('canvas'),mask=layer.getContext('2d');
  if(!mask?.setTransform)return ()=>{};
  return (context,source,width,height)=>{
    if(!source||!width||!height)return;
    const ready=source.videoWidth>0?source.readyState>=2:source.naturalWidth>0;
    if(!ready)return;
    const {scale,x,y}=founderPlacement(width,height),p=groundProjection();
    if(layer.width!==width||layer.height!==height){layer.width=width;layer.height=height;}
    mask.setTransform(1,0,0,1,0,0);mask.clearRect(0,0,width,height);
    mask.save();
    mask.setTransform(scale*p.a,scale*p.b,scale*p.c,scale*p.d,x+scale*p.e,y+scale*p.f);
    mask.drawImage(source,0,0,PERSON_SOURCE.width,PERSON_SOURCE.height);mask.restore();
    mask.globalCompositeOperation='source-in';mask.fillStyle='rgba(15,23,8,.60)';
    mask.fillRect(0,0,width,height);mask.globalCompositeOperation='source-over';
    context.save();context.filter=`blur(${Math.max(.35,width/366*.8)}px)`;
    context.drawImage(layer,0,0);context.restore();
    // Contact follows the measured sloping sole contours, without darkening
    // the preserved shoe pixels above. It scales with the exact person pose.
    context.save();context.filter=`blur(${Math.max(.25,width/366*.4)}px)`;
    context.strokeStyle='rgba(9,15,4,.62)';context.lineWidth=scale*3.5;
    context.lineJoin='round';context.lineCap='round';
    for(const sole of FOOT_SOLES){
      context.beginPath();context.moveTo(x+scale*sole[0][0],y+scale*sole[0][1]);
      for(const [sx,sy] of sole.slice(1))context.lineTo(x+scale*sx,y+scale*sy);
      context.stroke();
    }
    context.restore();
  };
}
