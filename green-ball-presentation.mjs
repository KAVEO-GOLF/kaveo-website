import {RADIUS,TIMING,flightPose} from './green-ball-flight.mjs';

// Presentation only: retain the approved physical path and scroll timing.
export const BALL_VISUAL_SCALE=1.10;
export const DISPLAY_RADIUS=RADIUS*BALL_VISUAL_SCALE;
const lift=DISPLAY_RADIUS-RADIUS;
const rollAngle=flightPose(TIMING.rollProgress).angle;

export function presentationPose(progress) {
  const pose=flightPose(progress);
  return {...pose,
    // Preserve the exact ground clearance; don't sink the larger ball into turf.
    position:{...pose.position,y:pose.position.y+lift},
    angle:pose.progress<TIMING.rollProgress?pose.angle:
      rollAngle+(pose.angle-rollAngle)/BALL_VISUAL_SCALE,
    shadow:{...pose.shadow,x:pose.shadow.x+(5/6)*lift,z:pose.shadow.z+(1.5/6)*lift,
      radius:pose.shadow.radius*BALL_VISUAL_SCALE}
  };
}

export function ballPixelRatio(width,height,pixelRatio=1) {
  const nativeRatio=Number.isFinite(pixelRatio)&&pixelRatio>0?pixelRatio:1;
  if(!Number.isFinite(width*height)||width<=0||height<=0)return 1;
  // Up to 2x on normal HiDPI viewports. Budget supersampling, not native pixels:
  // a very large viewport may exceed 9 MP at 1x, but is never upscaled from less.
  const supersampleBudget=Math.max(1,Math.sqrt(9_000_000/(width*height)));
  return Math.min(Math.max(1,nativeRatio),2,supersampleBudget);
}
