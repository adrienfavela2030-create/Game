// ========================================
// VR HAND SYSTEM
// ========================================

import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// ========================================
// HAND COLORS
// ========================================

const SKIN_COLOR = 0xc58c6b;


// ========================================
// CREATE A HAND
// ========================================

export function createHand() {

  const hand = new THREE.Group();

  hand.userData.isHand = true;

  // -------------------------
  // PALM
  // -------------------------

  const palmGeometry =
    new THREE.SphereGeometry(
      0.11,
      20,
      16
    );

  const skinMaterial =
    new THREE.MeshStandardMaterial({
      color: SKIN_COLOR,
      roughness: 0.72,
      metalness: 0
    });

  const palm =
    new THREE.Mesh(
      palmGeometry,
      skinMaterial
    );

  palm.scale.set(
    1.15,
    0.7,
    1.35
  );

  palm.castShadow = true;

  hand.add(palm);


  // -------------------------
  // FINGERS
  // -------------------------

  const fingerLengths = [
    0.16,
    0.20,
    0.21,
    0.19,
    0.15
  ];

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const finger =
      createFinger(
        fingerLengths[i]
      );

    const x =
      -0.09 +
      i * 0.045;

    finger.position.set(
      x,
      0.01,
      -0.135
    );

    hand.add(finger);

  }


  // -------------------------
  // THUMB
  // -------------------------

  const thumb =
    createFinger(0.16);

  thumb.position.set(
    -0.13,
    -0.01,
    -0.03
  );

  thumb.rotation.y =
    -0.65;

  thumb.rotation.z =
    -0.55;

  hand.add(thumb);


  return hand;

}


// ========================================
// CREATE FINGER
// ========================================

function createFinger(
  length
) {

  const geometry =
    new THREE.CapsuleGeometry(
      0.028,
      length,
      6,
      10
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: SKIN_COLOR,
      roughness: 0.72
    });

  const finger =
    new THREE.Mesh(
      geometry,
      material
    );

  finger.rotation.x =
    Math.PI / 2;

  finger.castShadow = true;

  return finger;

}


// ========================================
// ATTACH HAND TO CONTROLLER
// ========================================

export function attachHand(
  controller
) {

  const hand =
    createHand();

  controller.add(hand);

  controller.userData.hand =
    hand;

  return hand;

}


// ========================================
// GRIP STATE
// ========================================

export function setupGrip(
  controller
) {

  controller.userData.gripping =
    false;

  controller.addEventListener(
    "selectstart",
    () => {

      controller.userData.gripping =
        true;

    }
  );

  controller.addEventListener(
    "selectend",
    () => {

      controller.userData.gripping =
        false;

    }
  );

}


// ========================================
// GET GRIP STATE
// ========================================

export function isGripping(
  controller
) {

  return !!controller.userData.gripping;

}


// ========================================
// MOVE HAND
// ========================================

export function updateHand(
  controller,
  delta
) {

  if (
    !controller.userData.hand
  ) {

    return;

  }

  const hand =
    controller.userData.hand;

  const targetScale =
    controller.userData.gripping
      ? 0.88
      : 1;

  hand.scale.lerp(
    new THREE.Vector3(
      targetScale,
      targetScale,
      targetScale
    ),
    Math.min(
      1,
      delta * 12
    )
  );

}
