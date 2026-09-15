// Bounded, underdamped interior controls. Endpoints are never simulated.
const AXES=['x','y','z'];
export function advanceSpring(position,velocity,target,dt,omega=18,zeta=.75){
  const t=Math.max(0,Math.min(dt,.06)),x=position-target;
  const a=zeta*omega,b=omega*Math.sqrt(1-zeta*zeta),decay=Math.exp(-a*t),c=Math.cos(b*t),s=Math.sin(b*t);
  return {position:target+decay*(x*c+(velocity+a*x)*s/b),velocity:decay*(velocity*c-(a*velocity+omega*omega*x)*s/b)};
}
export function createElasticLinks(){
  const springs=new Map();
  return {
    reset(){springs.clear();},
    prune(keys){const live=new Set(keys);for(const key of springs.keys())if(!live.has(key))springs.delete(key);},
    update(key,geometry,dt,immediate=false){
      const target=geometry.controls;
      let state=springs.get(key);
      if(!state||immediate){state={controls:target.slice(1,3).map(point=>({...point})),velocities:[{x:0,y:0,z:0},{x:0,y:0,z:0}]};springs.set(key,state);}
      let moving=false;
      for(let i=0;i<2;i++){
        const point=state.controls[i],velocity=state.velocities[i],goal=target[i+1];
        for(const axis of AXES){const next=advanceSpring(point[axis],velocity[axis],goal[axis],dt);point[axis]=next.position;velocity[axis]=next.velocity;}
        const distance=Math.hypot(...AXES.map(axis=>point[axis]-goal[axis]));
        if(distance>60){for(const axis of AXES){point[axis]=goal[axis]+(point[axis]-goal[axis])*60/distance;velocity[axis]=0;}}
        // Keep each handle leaving the body, even during a rapid interruption.
        const end=target[i===0?0:3],normal=geometry.normals?.[i];
        if(normal){const dot=AXES.reduce((sum,axis)=>sum+(point[axis]-end[axis])*normal[axis],0);if(dot<8)for(const axis of AXES)point[axis]+=normal[axis]*(8-dot);}
        const error=Math.hypot(...AXES.map(axis=>point[axis]-goal[axis])),speed=Math.hypot(...AXES.map(axis=>velocity[axis]));
        if(error<.035&&speed<.06){Object.assign(point,goal);for(const axis of AXES)velocity[axis]=0;}else moving=true;
      }
      return {controls:[{...target[0]},{...state.controls[0]},{...state.controls[1]},{...target[3]}],moving};
    }
  };
}
