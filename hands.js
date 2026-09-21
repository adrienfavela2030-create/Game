import * as THREE from "three";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR was not initialized before hands.js loaded.");
}

let leftController;
let rightController;

let leftGrip;
let rightGrip;

let leftHand;
let rightHand;

let leftHandModel;
let rightHandModel;

let leftRealHand;
let rightRealHand;

let initialized = false;

const controllerFactory = new XRControllerModelFactory();
const handFactory = new XRHandModelFactory();

const handMeshes = [];

function createProceduralHand(side) {
  const group = new THREE.Group();

  group.name = `${side}ProceduralHand`;

  /*
   * Palm
   */
  const palmGeometry = new THREE.SphereGeometry(
    0.075,
    16,
    12
  );

  palmGeometry.scale(
    0.82,
    1.15,
    0.48
  );

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd69b78,
    roughness: 0.72,
    metalness: 0
  });

  const palm = new THREE.Mesh(
    palmGeometry,
    skinMaterial
  );

  palm.castShadow = true;
  palm.receiveShadow = true;

  group.add(palm);

  /*
   * Wrist
   */
  const wristGeometry = new THREE.CylinderGeometry(
    0.045,
    0.055,
    0.10,
    12
  );

  const wrist = new THREE.Mesh(
    wristGeometry,
    skinMaterial
  );

  wrist.rotation.z = Math.PI / 2;

  if (side === "left") {
    wrist.position.x = 0.035;
  } else {
    wrist.position.x = -0.035;
  }

  wrist.castShadow = true;

  group.add(wrist);

  /*
   * Fingers
   */
  const fingerData = [
    {
      name: "index",
      x: 0.045,
      z: -0.060,
      length: 0.090,
      radius: 0.019
    },
    {
      name: "middle",
      x: 0.015,
      z: -0.072,
      length: 0.102,
      radius: 0.020
    },
    {
      name: "ring",
      x: -0.015,
      z: -0.069,
      length: 0.095,
      radius: 0.019
    },
    {
      name: "pinky",
      x: -0.042,
      z: -0.056,
      length: 0.078,
      radius: 0.017
    }
  ];

  for (const finger of fingerData) {
    const fingerGroup = new THREE.Group();

    fingerGroup.position.set(
      finger.x,
      0.055,
      finger.z
    );

    const fingerGeometry = new THREE.CapsuleGeometry(
      finger.radius,
      finger.length,
      5,
      10
    );

    const fingerMesh = new THREE.Mesh(
      fingerGeometry,
      skinMaterial
    );

    fingerMesh.rotation.x = Math.PI / 2;

    fingerMesh.castShadow = true;
    fingerMesh.receiveShadow = true;

    fingerGroup.add(fingerMesh);

    /*
     * Fingertip
     */
    const tipGeometry = new THREE.SphereGeometry(
      finger.radius * 1.03,
      10,
      8
    );

    const tip = new THREE.Mesh(
      tipGeometry,
      skinMaterial
    );

    tip.position.z = -finger.length * 0.58;

    tip.castShadow = true;

    fingerGroup.add(tip);

    group.add(fingerGroup);
  }

  /*
   * Thumb
   */
  const thumb = new THREE.Group();

  thumb.position.set(
    side === "left" ? 0.070 : -0.070,
    0.015,
    -0.005
  );

  const thumbGeometry = new THREE.CapsuleGeometry(
    0.021,
    0.065,
    5,
    10
  );

  const thumbMesh = new THREE.Mesh(
    thumbGeometry,
    skinMaterial
  );

  thumbMesh.rotation.z =
    side === "left"
      ? -0.72
      : 0.72;

  thumbMesh.rotation.x = -0.35;

  thumbMesh.castShadow = true;

  thumb.add(thumbMesh);

  group.add(thumb);

  /*
   * Small fingernail details
   */
  const nailMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0c7b2,
    roughness: 0.55
  });

  const nails = [];

  for (let i = 0; i < 4; i++) {
    const nail = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.011,
        8,
        6
      ),
      nailMaterial
    );

    nail.scale.set(
      1.0,
      0.45,
      0.45
    );

    nail.position.set(
      fingerData[i].x,
      0.073,
      fingerData[i].z - 0.055
    );

    group.add(nail);
    nails.push(nail);
  }

  /*
   * Slightly smaller for realistic VR proportions.
   */
  group.scale.setScalar(0.92);

  /*
   * Hands should not block the world.
   */
  group.traverse(object => {
    if (object.isMesh) {
      object.frustumCulled = false;
    }
  });

  return group;
}

function setupControllers() {
  const renderer = S.renderer;

  if (!renderer || !renderer.xr) {
    console.warn("XR renderer unavailable.");
    return;
  }

  const xr = renderer.xr;

  /*
   * Controllers
   */
  leftController = xr.getController(0);
  rightController = xr.getController(1);

  leftGrip = xr.getControllerGrip(0);
  rightGrip = xr.getControllerGrip(1);

  /*
   * Quest controller models.
   */
  try {
    const leftModel = controllerFactory.createControllerModel(
      leftGrip
    );

    const rightModel = controllerFactory.createControllerModel(
      rightGrip
    );

    leftGrip.add(leftModel);
    rightGrip.add(rightModel);
  } catch (error) {
    console.warn(
      "Controller model creation failed:",
      error
    );
  }

  S.playerRig.add(leftController);
  S.playerRig.add(rightController);

  S.playerRig.add(leftGrip);
  S.playerRig.add(rightGrip);

  /*
   * Hide controller models when hand tracking is active.
   * They can be restored automatically if controllers are used.
   */
  leftController.addEventListener(
    "connected",
    event => {
      console.log(
        "Left XR input connected:",
        event.data?.handedness
      );
    }
  );

  rightController.addEventListener(
    "connected",
    event => {
      console.log(
        "Right XR input connected:",
        event.data?.handedness
      );
    }
  );

  leftController.addEventListener(
    "disconnected",
    () => {
      console.log("Left XR controller disconnected.");
    }
  );

  rightController.addEventListener(
    "disconnected",
    () => {
      console.log("Right XR controller disconnected.");
    }
  );
}

function setupHands() {
  if (initialized) {
    return;
  }

  initialized = true;

  if (!S.renderer || !S.playerRig) {
    console.error(
      "hands.js requires S.renderer and S.playerRig."
    );

    initialized = false;
    return;
  }

  setupControllers();

  /*
   * Quest hand tracking objects.
   */
  leftHand = S.renderer.xr.getHand(0);
  rightHand = S.renderer.xr.getHand(1);

  S.playerRig.add(leftHand);
  S.playerRig.add(rightHand);

  /*
   * Three.js hand models.
   *
   * These become visible when the Quest supplies
   * actual hand-joint tracking data.
   */
  try {
    leftRealHand =
      handFactory.createHandModel(
        leftHand,
        "mesh"
      );

    rightRealHand =
      handFactory.createHandModel(
        rightHand,
        "mesh"
      );

    leftHand.add(leftRealHand);
    rightHand.add(rightRealHand);

    leftHandModel = leftRealHand;
    rightHandModel = rightRealHand;
  } catch (error) {
    console.warn(
      "XR hand model creation failed:",
      error
    );
  }

  /*
   * Procedural fallback hands.
   *
   * These make sure there is still a visible
   * hand-like representation if the Quest is
   * currently using controllers.
   */
  const leftFallback =
    createProceduralHand("left");

  const rightFallback =
    createProceduralHand("right");

  leftFallback.visible = true;
  rightFallback.visible = true;

  leftController.add(leftFallback);
  rightController.add(rightFallback);

  handMeshes.push(leftFallback);
  handMeshes.push(rightFallback);

  /*
   * Put the procedural hands slightly in front
   * of the controller grip.
   */
  leftFallback.position.set(
    0,
    -0.015,
    -0.045
  );

  rightFallback.position.set(
    0,
    -0.015,
    -0.045
  );

  /*
   * Hide procedural hands when actual tracked
   * hand joints are being supplied.
   */
  leftHand.addEventListener(
    "connected",
    event => {
      if (event.data && event.data.hand) {
        leftFallback.visible = false;
      }
    }
  );

  rightHand.addEventListener(
    "connected",
    event => {
      if (event.data && event.data.hand) {
        rightFallback.visible = false;
      }
    }
  );

  leftHand.addEventListener(
    "disconnected",
    () => {
      leftFallback.visible = true;
    }
  );

  rightHand.addEventListener(
    "disconnected",
    () => {
      rightFallback.visible = true;
    }
  );

  console.log(
    "VR hands initialized."
  );
}

/*
 * Determine whether this input source is
 * currently a tracked hand.
 */
function isHandInputSource(inputSource) {
  return !!(
    inputSource &&
    inputSource.hand
  );
}

function updateHandVisibility() {
  if (!S.renderer || !S.renderer.xr) {
    return;
  }

  const session =
    S.renderer.xr.getSession();

  if (!session) {
    /*
     * Outside VR, show procedural hands only
     * if useful for debugging.
     */
    return;
  }

  let leftHandActive = false;
  let rightHandActive = false;

  for (const source of session.inputSources) {
    if (
      source.handedness === "left" &&
      isHandInputSource(source)
    ) {
      leftHandActive = true;
    }

    if (
      source.handedness === "right" &&
      isHandInputSource(source)
    ) {
      rightHandActive = true;
    }
  }

  if (handMeshes.length >= 2) {
    handMeshes[0].visible =
      !leftHandActive;

    handMeshes[1].visible =
      !rightHandActive;
  }

  /*
   * Controller models are useful only when
   * controllers are being used.
   */
  if (leftGrip) {
    leftGrip.visible =
      !leftHandActive;
  }

  if (rightGrip) {
    rightGrip.visible =
      !rightHandActive;
  }

  /*
   * Actual tracked hand models.
   */
  if (leftHandModel) {
    leftHandModel.visible =
      leftHandActive;
  }

  if (rightHandModel) {
    rightHandModel.visible =
      rightHandActive;
  }
}

/*
 * Read Quest controller sticks.
 */
function readGamepadAxes(controller) {
  const session =
    S.renderer?.xr?.getSession?.();

  if (!session) {
    return null;
  }

  for (const source of session.inputSources) {
    if (!source.gamepad) {
      continue;
    }

    if (
      source.handedness ===
      controller.userData.handedness
    ) {
      return source.gamepad.axes || null;
    }
  }

  return null;
}

function findInputSource(handedness) {
  const session =
    S.renderer?.xr?.getSession?.();

  if (!session) {
    return null;
  }

  for (const source of session.inputSources) {
    if (
      source.handedness === handedness
    ) {
      return source;
    }
  }

  return null;
}

/*
 * Player movement.
 *
 * We move the PLAYER RIG, not the XR camera.
 * This is important because the headset owns the
 * camera's real position and rotation.
 */
function updateMovement(delta) {
  if (!S.isXR) {
    return;
  }

  if (!S.playerRig) {
    return;
  }

  const leftSource =
    findInputSource("left");

  const rightSource =
    findInputSource("right");

  /*
   * Left joystick = movement.
   */
  if (
    leftSource &&
    leftSource.gamepad
  ) {
    const axes =
      leftSource.gamepad.axes || [];

    if (axes.length >= 2) {
      const x =
        Math.abs(axes[2] || 0) > 0.01
          ? axes[2]
          : axes[0];

      const z =
        Math.abs(axes[3] || 0) > 0.01
          ? axes[3]
          : axes[1];

      const deadzone = 0.12;

      let moveX =
        Math.abs(x) > deadzone
          ? x
          : 0;

      let moveZ =
        Math.abs(z) > deadzone
          ? z
          : 0;

      /*
       * Movement speed.
       */
      const speed =
        S.player?.sprinting
          ? 4.2
          : 2.4;

      /*
       * Move relative to player rig.
       */
      const direction =
        new THREE.Vector3(
          moveX,
          0,
          moveZ
        );

      /*
       * Use headset/player yaw for
       * forward direction.
       */
      const yaw =
        S.playerRig.rotation.y;

      direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
      );

      S.playerRig.position.x +=
        direction.x *
        speed *
        delta;

      S.playerRig.position.z +=
        direction.z *
        speed *
        delta;
    }
  }

  /*
   * Right joystick = smooth turning.
   *
   * We intentionally rotate the rig rather than
   * changing the camera rotation.
   */
  if (
    rightSource &&
    rightSource.gamepad
  ) {
    const axes =
      rightSource.gamepad.axes || [];

    if (axes.length >= 2) {
      const turn =
        Math.abs(axes[2] || 0) > 0.01
          ? axes[2]
          : axes[0];

      const deadzone = 0.18;

      if (
        Math.abs(turn) >
        deadzone
      ) {
        S.playerRig.rotation.y -=
          turn *
          1.8 *
          delta;
      }
    }
  }

  /*
   * Keep the player above the island.
   */
  if (
    S.systems?.world &&
    typeof S.systems.world.getTerrainHeight ===
      "function"
  ) {
    const ground =
      S.systems.world.getTerrainHeight(
        S.playerRig.position.x,
        S.playerRig.position.z
      );

    if (
      Number.isFinite(ground)
    ) {
      /*
       * XR camera is approximately at
       * head height. The rig itself represents
       * the player's ground position.
       */
      const desiredY =
        ground;

      S.playerRig.position.y =
        desiredY;
    }
  }
}

/*
 * Keep game.js player position synchronized.
 */
function syncGamePosition() {
  if (!S.playerRig) {
    return;
  }

  if (
    S.GAME &&
    S.GAME.position
  ) {
    S.GAME.position.x =
      S.playerRig.position.x;

    S.GAME.position.y =
      S.playerRig.position.y;

    S.GAME.position.z =
      S.playerRig.position.z;

    S.GAME.position.rotationY =
      S.playerRig.rotation.y;
  }
}

/*
 * Hand animation.
 *
 * This gives the fallback hands a tiny natural
 * movement without fighting actual XR tracking.
 */
function animateFallbackHands(time) {
  if (
    !S.isXR ||
    handMeshes.length < 2
  ) {
    return;
  }

  const left =
    handMeshes[0];

  const right =
    handMeshes[1];

  if (left.visible) {
    left.rotation.z =
      Math.sin(time * 1.8) *
      0.025;
  }

  if (right.visible) {
    right.rotation.z =
      Math.sin(
        time * 1.8 +
        Math.PI
      ) * 0.025;
  }
}

/*
 * Main update called by index.html.
 */
function update(
  delta = 0.016,
  xrFrame = null
) {
  updateHandVisibility();

  updateMovement(delta);

  animateFallbackHands(
    performance.now() / 1000
  );

  syncGamePosition();
}

/*
 * Alias used by the current index.html.
 */
function updateHands(
  delta = 0.016,
  xrFrame = null
) {
  update(
    delta,
    xrFrame
  );
}

/*
 * Optional utility for other systems.
 */
function getHands() {
  return {
    left: leftHand,
    right: rightHand,
    leftController,
    rightController
  };
}

export {
  setupHands,
  update,
  updateHands,
  getHands
};

export default {
  setupHands,
  update,
  updateHands,
  getHands
};