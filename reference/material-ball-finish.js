import * as THREE from './vendor/three-r180/three.module.js';

// Clean white lacquer, not dirt or wear. Only the ball uses this finish.
export const BALL_FINISH=Object.freeze({
  color:0xf1f1ed,roughness:.38,metalness:0,ior:1.48,
  clearcoat:.14,clearcoatRoughness:.4
});
export const MICRO_PAINT=Object.freeze({frequency:96,height:.000055,roughnessRange:.016,fadeStart:.35,fadeEnd:.9});
export const ENVIRONMENT_RESPONSE=.88;

const paintFunctions=`
varying vec3 vKaveoBallLocal;
float kaveoPaintHash(vec3 p){
  p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);
}
float kaveoPaintNoise(vec3 p){
  vec3 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=kaveoPaintHash(i),b=kaveoPaintHash(i+vec3(1.,0.,0.));
  float c=kaveoPaintHash(i+vec3(0.,1.,0.)),d=kaveoPaintHash(i+vec3(1.,1.,0.));
  float e=kaveoPaintHash(i+vec3(0.,0.,1.)),f1=kaveoPaintHash(i+vec3(1.,0.,1.));
  float g=kaveoPaintHash(i+vec3(0.,1.,1.)),h=kaveoPaintHash(i+vec3(1.,1.,1.));
  return mix(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),mix(mix(e,f1,u.x),mix(g,h,u.x),u.y),u.z);
}
vec3 kaveoPaintNormal(vec3 surfacePosition,vec3 surfaceNormal,vec2 heightGradient){
  vec3 sx=dFdx(surfacePosition),sy=dFdy(surfacePosition);
  vec3 rx=cross(sy,surfaceNormal),ry=cross(surfaceNormal,sx);
  float determinant=dot(sx,rx);
  if(abs(determinant)<1e-10)return surfaceNormal;
  vec3 gradient=sign(determinant)*(heightGradient.x*rx+heightGradient.y*ry);
  return normalize(abs(determinant)*surfaceNormal-gradient);
}`;

export function applyBallMicrostructure(shader){
  const replace=(source,token,insertion)=>{
    if(!source.includes(token))throw new Error('Ball material hook unavailable: '+token);
    return source.replace(token,token+'\n'+insertion);
  };
  shader.vertexShader=replace(shader.vertexShader,'#include <common>','varying vec3 vKaveoBallLocal;');
  shader.vertexShader=replace(shader.vertexShader,'#include <begin_vertex>','vKaveoBallLocal=position;');
  shader.fragmentShader=replace(shader.fragmentShader,'#include <common>',paintFunctions);
  shader.fragmentShader=replace(shader.fragmentShader,'#include <roughnessmap_fragment>',`
    vec3 kaveoPaintP=normalize(vKaveoBallLocal)*${MICRO_PAINT.frequency.toFixed(1)};
    float kaveoPaintFootprint=max(length(dFdx(kaveoPaintP)),length(dFdy(kaveoPaintP)));
    float kaveoPaintWeight=1.-smoothstep(${MICRO_PAINT.fadeStart},${MICRO_PAINT.fadeEnd},kaveoPaintFootprint);
    float kaveoPaintGrain=kaveoPaintNoise(kaveoPaintP)-.5;
    roughnessFactor=clamp(roughnessFactor+kaveoPaintGrain*${MICRO_PAINT.roughnessRange}*kaveoPaintWeight,.045,1.);
  `);
  shader.fragmentShader=replace(shader.fragmentShader,'#include <normal_fragment_maps>',`
    vec2 kaveoPaintGradient=vec2(dFdx(kaveoPaintGrain),dFdy(kaveoPaintGrain))*${MICRO_PAINT.height}*kaveoPaintWeight;
    normal=kaveoPaintNormal(-vViewPosition,normal,kaveoPaintGradient);
  `);
}

export function createBallFinish(environmentMap,sceneIntensity,rotation){
  const finish=new THREE.MeshPhysicalMaterial({...BALL_FINISH,
    // r180 otherwise overrides envMapIntensity with the global scene value.
    envMap:environmentMap,envMapIntensity:sceneIntensity*ENVIRONMENT_RESPONSE,
    envMapRotation:rotation.clone()
  });
  finish.onBeforeCompile=applyBallMicrostructure;
  finish.customProgramCacheKey=()=> 'kaveo-clean-paint-v3';
  return finish;
}
