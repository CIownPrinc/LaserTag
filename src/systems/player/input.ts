import * as THREE from 'three';

export function getMoveAxes(
  keys: { right: boolean; left: boolean; forward: boolean; backward: boolean },
  mobileMove: { x: number; y: number }
) {
  const joyMoveZ = -mobileMove.y;
  const joyMoveX = mobileMove.x;

  return {
    moveX: (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joyMoveX,
    moveZ: (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0) + joyMoveZ,
  };
}

export function getPlanarBasis(cameraQuaternion: THREE.Quaternion) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  return { forward, right };
}
