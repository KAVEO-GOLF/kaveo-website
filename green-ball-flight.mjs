// All flight calculations are pure and in SI units. No wall clock or integration.
export const clamp = (value, min=0, max=1) => Math.max(min, Math.min(max, value));
export const PHOTO = Object.freeze({width:1672, height:941, objectX:.64, objectY:.58});
export const CAMERA = Object.freeze({fov:40, height:1.3, pitch:6*Math.PI/180});
export const RADIUS = .04267/2;
export const GRAVITY = 9.81;

// Photo calibration, not surveyed course geometry. The flag anchors the scale;
// the landing corridor stays to its left, so no fake flag occlusion is needed.
export function groundFromPhoto(x, y) {
  const tangent = Math.tan(CAMERA.fov*Math.PI/360);
  const rx = (x/PHOTO.width*2-1)*tangent*PHOTO.width/PHOTO.height;
  const ry = (1-y/PHOTO.height*2)*tangent;
  const dy = ry*Math.cos(CAMERA.pitch)-Math.sin(CAMERA.pitch);
  const dz = -ry*Math.sin(CAMERA.pitch)-Math.cos(CAMERA.pitch);
  if (dy >= 0) throw new RangeError('Photo point is above the ground horizon');
  const distance = -CAMERA.height/dy;
  return {x:rx*distance, y:0, z:dz*distance};
}

export function projectToPhoto({x,y,z}) {
  const dy = y-CAMERA.height;
  const viewY = dy*Math.cos(CAMERA.pitch)-z*Math.sin(CAMERA.pitch);
  const depth = -dy*Math.sin(CAMERA.pitch)-z*Math.cos(CAMERA.pitch);
  const focal = PHOTO.height/(2*Math.tan(CAMERA.fov*Math.PI/360));
  return {x:PHOTO.width/2+x*focal/depth, y:PHOTO.height/2-viewY*focal/depth,
    diameter:2*RADIUS*focal/depth, depth};
}

export function coverCrop(width, height) {
  const scale = Math.max(width/PHOTO.width, height/PHOTO.height);
  const fullWidth = PHOTO.width*scale, fullHeight = PHOTO.height*scale;
  return {fullWidth,fullHeight,offsetX:(fullWidth-width)*PHOTO.objectX,
    offsetY:(fullHeight-height)*PHOTO.objectY,scale};
}

const up = 20, horizontal = 22, drag = .09;
const airDuration = 2*up/GRAVITY;
const airDistance = t => horizontal*(-Math.expm1(-drag*t))/drag;
const impactSpeed = horizontal*Math.exp(-drag*airDuration);
// One readable low rebound: excessive forward travel masks the rise in this
// low camera. These are art-directed model values, not measured turf physics.
const bounceUp = 1.75, bounceSpeed = 1.10;
const bounceDuration = 2*bounceUp/GRAVITY;
const bounceScrollStretch = 1.50;
const rollSpeed = .80;
const targetRollDistance = .42;
const rollDeceleration = rollSpeed**2/(2*targetRollDistance);
const rollDuration = rollSpeed/rollDeceleration;
const bounceDistance = bounceSpeed*bounceDuration;
const rollDistance = rollSpeed*rollDuration/2;
const landingRun = bounceDistance+rollDistance;
const directionLength = Math.hypot(-.20,1);
export const DIRECTION = Object.freeze({x:-.20/directionLength,z:1/directionLength});
// Lock the previously calibrated first contact. Landing adjustments must not
// move the incoming flight to accommodate a fixed endpoint.
export const IMPACT = Object.freeze({x:.9456981331281956,y:0,z:-5.23515016565498});
export const END = Object.freeze({x:IMPACT.x+DIRECTION.x*landingRun,y:0,z:IMPACT.z+DIRECTION.z*landingRun});

const groundAt = distance => ({x:IMPACT.x+DIRECTION.x*distance,z:IMPACT.z+DIRECTION.z*distance});
const airPoint = t => {
  const ground = groundAt(airDistance(t)-airDistance(airDuration));
  return {...ground,y:RADIUS+up*t-.5*GRAVITY*t*t};
};
// Only the visible terminal approach is shown. A distant 75 m launch would be
// subpixel and its apex outside this fixed low camera; no artificial size floor.
let lower = up/GRAVITY, upper = airDuration;
for (let i=0;i<64;i++) {
  const middle = (lower+upper)/2;
  if (projectToPhoto(airPoint(middle)).y < -24) lower = middle;
  else upper = middle;
}
const visibleAirStart = (lower+upper)/2;
const impactProgress = .62;
// Pose progress follows virtual durations. The scroll mapping below gives only
// the rebound extra viewing room, without slowing the approach or ground roll.
const rollProgress = impactProgress+(1-impactProgress)*bounceDuration/(bounceDuration+rollDuration);
export const TIMING = Object.freeze({visibleAirStart,airDuration,bounceDuration,bounceScrollStretch,rollDuration,
  impactProgress,rollProgress});
export const PHYSICS = Object.freeze({up,horizontal,drag,impactSpeed,bounceUp,bounceSpeed,
  rollSpeed,rollDeceleration,landingRun,bounceDistance,rollDistance});

// Scroll allocates more room to the short visible approach. Within each phase
// virtual time is linear; contact losses are explicit, not an easing-to-target.
export function flightPose(progress) {
  const p = clamp(progress);
  let position, phase, angle, speed, localTime, distance;
  const airSpin = -150; // backspin, radians per virtual second (never wall time)
  const spinAtImpact = .25+airSpin*(airDuration-visibleAirStart);
  const spinAtRoll = spinAtImpact-35*bounceDuration;
  if (p < TIMING.impactProgress) {
    const t = visibleAirStart+(airDuration-visibleAirStart)*p/TIMING.impactProgress;
    position = airPoint(t); phase='approach';
    angle = .25+airSpin*(t-visibleAirStart);
    speed = horizontal*Math.exp(-drag*t);
  } else if (p < TIMING.rollProgress) {
    localTime = bounceDuration*(p-TIMING.impactProgress)/(TIMING.rollProgress-TIMING.impactProgress);
    position = {...groundAt(bounceSpeed*localTime),y:RADIUS+Math.max(0,bounceUp*localTime-.5*GRAVITY*localTime**2)};
    phase='bounce'; angle=spinAtImpact-35*localTime; speed=bounceSpeed;
  } else {
    localTime = rollDuration*(p-TIMING.rollProgress)/(1-TIMING.rollProgress);
    distance = rollSpeed*localTime-.5*rollDeceleration*localTime**2;
    position = {...groundAt(bounceDistance+distance),y:RADIUS};
    phase=p===1?'rest':'roll'; angle=spinAtRoll+distance/RADIUS;
    speed=Math.max(0,rollSpeed-rollDeceleration*localTime);
  }
  const height = Math.max(0,position.y-RADIUS);
  // Sun comes from upper left, matching the existing flag shadow. The shadow
  // only appears near the green, never painted over the far water or sky.
  const shadow = {x:position.x+(5/6)*position.y,z:position.z+(1.5/6)*position.y,
    radius:RADIUS*(1+height*3),opacity:.30*Math.exp(-height*9)*clamp(1-height/.5)};
  return {progress:p,phase,position,angle,speed,shadow};
}

export function flightScrollWindow(heroTop,sceneHeight) {
  const start=heroTop+20;
  const baseSpan=clamp(sceneHeight*.50,360,720);
  const impactStart=start+baseSpan*TIMING.impactProgress;
  // Keep the approach and rolling time scale unchanged. Only the rebound gets
  // more scroll travel; virtual time is still linear inside each phase.
  const landingPixelsPerSecond=clamp(sceneHeight*.20,160,240);
  const rollStart=impactStart+bounceDuration*landingPixelsPerSecond*bounceScrollStretch;
  return {start,baseSpan,impactStart,rollStart,end:rollStart+rollDuration*landingPixelsPerSecond};
}

export function scrollProgress(scrollY, heroTop, sceneHeight) {
  const {start,baseSpan,impactStart,rollStart,end}=flightScrollWindow(heroTop,sceneHeight);
  if(scrollY<=impactStart)return clamp((scrollY-start)/baseSpan);
  if(scrollY<rollStart)return TIMING.impactProgress+(TIMING.rollProgress-TIMING.impactProgress)*clamp((scrollY-impactStart)/(rollStart-impactStart));
  return TIMING.rollProgress+(1-TIMING.rollProgress)*clamp((scrollY-rollStart)/(end-rollStart));
}
