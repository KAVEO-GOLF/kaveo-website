import {CAMERA,DIRECTION} from './green-ball-flight.mjs';
import {presentationPose} from './green-ball-presentation.mjs';

// Choose the starting attitude backwards from the approved endpoint. The whole
// ball still rotates about its existing axis by its existing distance/radius
// angle; there is no late logo twist, billboard, or separate logo animation.
export function createBallOrientation(THREE) {
  const spinAxis=new THREE.Vector3(DIRECTION.z,0,-DIRECTION.x);
  const rest=presentationPose(1);
  const towardCamera=new THREE.Vector3(-rest.position.x,CAMERA.height-rest.position.y,-rest.position.z).normalize();
  const screenUp=new THREE.Vector3(0,Math.cos(CAMERA.pitch),-Math.sin(CAMERA.pitch));
  const right=new THREE.Vector3().crossVectors(screenUp,towardCamera).normalize();
  const up=new THREE.Vector3().crossVectors(towardCamera,right).normalize();
  const finalRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,towardCamera));
  // Original markGeometry maps UV centre to latitude +0.10, not local +Z.
  // Undo that frame offset without moving or changing the approved mark mesh.
  finalRotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.10));
  const baseRotation=new THREE.Quaternion().setFromAxisAngle(spinAxis,rest.angle).invert().multiply(finalRotation);
  return (target,angle)=>target.setFromAxisAngle(spinAxis,angle).multiply(baseRotation);
}
