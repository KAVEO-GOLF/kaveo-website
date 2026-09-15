// Small additive render offsets; navigation poses remain the source of layout.
export function floatPose(pose,slot,seconds,height){
  const phase=slot*1.83,hub=slot===0;
  const fade=Math.min(1,Math.max(0,seconds/2));
  const weight=fade*fade*(3-2*fade)*pose.opacity;
  const yAmplitude=hub?2:4.2+(slot%3)*.35,zAmplitude=hub?4:7+(slot%3);
  const dy=Math.sin(seconds*Math.PI*2/(10.8+(slot%4)*1.4)+phase)*yAmplitude*weight;
  const dz=Math.sin(seconds*Math.PI*2/(14.5+(slot%3)*1.6)+phase*.71)*zAmplitude*weight;
  return {...pose,y:pose.y+dy/Math.max(1,height),z:(pose.z??0)+dz};
}
