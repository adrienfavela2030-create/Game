import * as THREE from "three";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR must exist before hands.js loads.");
}

const state = {
  initialized: false,

  leftController: null,
  rightController: null,

  leftGrip: null,
  rightGrip: null,

  leftHand: null,
  rightHand: null,

  leftHandModel: null,
  rightHandModel: null,

  leftControllerModel: null,
  rightControllerModel: null,

  leftStickX: 0,
  leftStickY: 0,

  rightStickX: 0,
  rightStickY: 0,

  lastSnap: 0,

  snapCooldown: 0.25,

  moveSpeed: 2.2,

  sprintSpeed: 4.2,

  deadZone: 0.15,

  buttonState: {
    left: {},
    right: {}
  }
};


// ============================================================
// CREATE FALLBACK HAND
// ============================================================

function createFallbackHand(isLeft) {

  const group = new THREE.Group();

  group.name =
    isLeft
      ? "FallbackLeftHand"
      : "FallbackRightHand";


  /*
   * Palm
   */

  const palmGeometry =
    new THREE.SphereGeometry(
      0.075,
      16,
      12
    );

  palmGeometry.scale(
    1.0,
    0.75,
    1.35
  );

  const palmMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc98d6b,
      roughness: 0.8
    });

  const palm =
    new THREE.Mesh(
      palmGeometry,
      palmMaterial
    );

  group.add(palm);


  /*
   * Fingers
   */

  const fingerGeometry =
    new THREE.CapsuleGeometry(
      0.018,
      0.075,
      5,
      8
    );

  const fingerMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc98d6b,
      roughness: 0.8
    });


  const fingerPositions = [
    [-0.045, 0.01, -0.075],
    [-0.015, 0.015, -0.095],
    [0.018, 0.015, -0.095],
    [0.048, 0.01, -0.075]
  ];


  for (const position of fingerPositions) {

    const finger =
      new THREE.Mesh(
        fingerGeometry,
        fingerMaterial
      );

    finger.position.set(
      position[0],
      position[1],
      position[2]
    );

    group.add(finger);

  }


  /*
   * Thumb
   */

  const thumb =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.02,
        0.08,
        5,
        8
      ),
      fingerMaterial
    );

  thumb.position.set(
    isLeft ? -0.075 : 0.075,
    -0.005,
    -0.025
  );

  thumb.rotation.z =
    isLeft
      ? -0.65
      : 0.65;

  group.add(thumb);


  return group;
}


// ============================================================
// READ CONTROLLER STICK
// ============================================================

function readStick(inputSource) {

  if (!inputSource) {

    return {
      x: 0,
      y: 0
    };

  }


  const gamepad =
    inputSource.gamepad;

  if (!gamepad) {

    return {
      x: 0,
      y: 0
    };

  }


  const axes =
    gamepad.axes || [];


  let x = 0;
  let y = 0;


  if (axes.length >= 4) {

    x = axes[2] || 0;
    y = axes[3] || 0;

  } else {

    x = axes[0] || 0;
    y = axes[1] || 0;

  }


  if (Math.abs(x) < state.deadZone) {
    x = 0;
  }

  if (Math.abs(y) < state.deadZone) {
    y = 0;
  }


  return {
    x,
    y
  };
}


// ============================================================
// SETUP CONTROLLERS
// ============================================================

function setupControllers() {

  if (!S.renderer) {
    return;
  }


  const xr =
    S.renderer.xr;


  // ----------------------------------------------------------
  // LEFT
  // ----------------------------------------------------------

  state.leftController =
    xr.getController(0);

  state.leftGrip =
    xr.getControllerGrip(0);


  state.leftController.name =
    "LeftControllerTargetRay";

  state.leftGrip.name =
    "LeftControllerGrip";


  S.playerRig.add(
    state.leftController
  );

  S.playerRig.add(
    state.leftGrip
  );


  // ----------------------------------------------------------
  // RIGHT
  // ----------------------------------------------------------

  state.rightController =
    xr.getController(1);

  state.rightGrip =
    xr.getControllerGrip(1);


  state.rightController.name =
    "RightControllerTargetRay";

  state.rightGrip.name =
    "RightControllerGrip";


  S.playerRig.add(
    state.rightController
  );

  S.playerRig.add(
    state.rightGrip
  );


  // ==========================================================
  // CONTROLLER MODELS
  // ==========================================================

  try {

    const controllerFactory =
      new XRControllerModelFactory();


    state.leftControllerModel =
      controllerFactory.createControllerModel(
        state.leftGrip
      );

    state.rightControllerModel =
      controllerFactory.createControllerModel(
        state.rightGrip
      );


    state.leftGrip.add(
      state.leftControllerModel
    );

    state.rightGrip.add(
      state.rightControllerModel
    );

  } catch (error) {

    console.warn(
      "Controller model failed:",
      error
    );

  }


  // ==========================================================
  // HAND TRACKING
  // ==========================================================

  try {

    state.leftHand =
      xr.getHand(0);

    state.rightHand =
      xr.getHand(1);


    state.leftHand.name =
      "LeftTrackedHand";

    state.rightHand.name =
      "RightTrackedHand";


    S.playerRig.add(
      state.leftHand
    );

    S.playerRig.add(
      state.rightHand
    );


    const handFactory =
      new XRHandModelFactory();


    state.leftHandModel =
      handFactory.createHandModel(
        state.leftHand,
        "mesh"
      );

    state.rightHandModel =
      handFactory.createHandModel(
        state.rightHand,
        "mesh"
      );


    state.leftHand.add(
      state.leftHandModel
    );

    state.rightHand.add(
      state.rightHandModel
    );


  } catch (error) {

    console.warn(
      "Hand tracking model failed:",
      error
    );

  }


  // ==========================================================
  // FALLBACK HANDS
  // ==========================================================

  /*
   * These are visible if the Quest is reporting controller
   * tracking but not hand-joint tracking.
   */

  const leftFallback =
    createFallbackHand(true);

  const rightFallback =
    createFallbackHand(false);


  leftFallback.visible = false;
  rightFallback.visible = false;


  state.leftGrip.add(
    leftFallback
  );

  state.rightGrip.add(
    rightFallback
  );


  state.leftFallback =
    leftFallback;

  state.rightFallback =
    rightFallback;


  // ==========================================================
  // BUTTON EVENTS
  // ==========================================================

  state.leftController.addEventListener(
    "selectstart",
    () => {

      state.buttonState.left.select = true;

      dispatchHandEvent(
        "grab",
        "left"
      );

    }
  );


  state.leftController.addEventListener(
    "selectend",
    () => {

      state.buttonState.left.select = false;

      dispatchHandEvent(
        "release",
        "left"
      );

    }
  );


  state.rightController.addEventListener(
    "selectstart",
    () => {

      state.buttonState.right.select = true;

      dispatchHandEvent(
        "grab",
        "right"
      );

    }
  );


  state.rightController.addEventListener(
    "selectend",
    () => {

      state.buttonState.right.select = false;

      dispatchHandEvent(
        "release",
        "right"
      );

    }
  );


  state.leftController.addEventListener(
    "squeezestart",
    () => {

      state.buttonState.left.squeeze = true;

      dispatchHandEvent(
        "squeeze",
        "left"
      );

    }
  );


  state.leftController.addEventListener(
    "squeezeend",
    () => {

      state.buttonState.left.squeeze = false;

    }
  );


  state.rightController.addEventListener(
    "squeezestart",
    () => {

      state.buttonState.right.squeeze = true;

      dispatchHandEvent(
        "squeeze",
        "right"
      );

    }
  );


  state.rightController.addEventListener(
    "squeezeend",
    () => {

      state.buttonState.right.squeeze = false;

    }
  );

}


// ============================================================
// DISPATCH HAND EVENT
// ============================================================

function dispatchHandEvent(
  action,
  hand
) {

  if (
    typeof S.gameEvent ===
    "function"
  ) {

    S.gameEvent(
      `hand-${action}`,
      {
        hand
      }
    );

  }

}


// ============================================================
// FIND INPUT SOURCES
// ============================================================

function getInputSources() {

  const session =
    S.renderer?.xr?.getSession();

  if (!session) {
    return;
  }


  for (
    const source
    of session.inputSources
  ) {

    if (
      source.handedness ===
      "left"
    ) {

      state.leftInputSource =
        source;

    }


    if (
      source.handedness ===
      "right"
    ) {

      state.rightInputSource =
        source;

    }

  }

}


// ============================================================
// MOVEMENT
// ============================================================

function updateMovement(
  delta
) {

  if (!S.renderer?.xr?.isPresenting) {
    return;
  }


  getInputSources();


  const left =
    readStick(
      state.leftInputSource
    );


  state.leftStickX =
    left.x;

  state.leftStickY =
    left.y;


  const right =
    readStick(
      state.rightInputSource
    );


  state.rightStickX =
    right.x;

  state.rightStickY =
    right.y;


  /*
   * Don't touch the XR camera.
   *
   * We only move playerRig.
   */


  let speed =
    state.moveSpeed;


  const sprintPressed =
    state.leftInputSource?.gamepad?.buttons?.some(
      button => button.pressed
    ) || false;


  if (
    sprintPressed &&
    S.player?.stamina > 5
  ) {

    speed =
      state.sprintSpeed;

    if (
      typeof S.setSprinting ===
      "function"
    ) {

      S.setSprinting(true);

    }

  } else {

    if (
      typeof S.setSprinting ===
      "function"
    ) {

      S.setSprinting(false);

    }

  }


  if (
    Math.abs(left.x) > state.deadZone ||
    Math.abs(left.y) > state.deadZone
  ) {

    /*
     * Get the headset's horizontal direction.
     *
     * We deliberately ignore Y so looking up/down doesn't
     * make the player fly.
     */

    const direction =
      new THREE.Vector3();


    S.camera.getWorldDirection(
      direction
    );


    direction.y = 0;

    direction.normalize();


    const forward =
      direction.clone();


    const rightVector =
      new THREE.Vector3(
        -forward.z,
        0,
        forward.x
      );


    const movement =
      new THREE.Vector3();


    movement.addScaledVector(
      forward,
      -left.y
    );

    movement.addScaledVector(
      rightVector,
      left.x
    );


    if (movement.lengthSq() > 0) {

      movement.normalize();

      movement.multiplyScalar(
        speed * delta
      );


      S.playerRig.position.add(
        movement
      );


      /*
       * Keep the game position synchronized.
       */

      if (
        S.GAME?.position
      ) {

        S.GAME.position.x =
          S.playerRig.position.x;

        S.GAME.position.y =
          S.playerRig.position.y + 1.65;

        S.GAME.position.z =
          S.playerRig.position.z;

      }

    }

  }


  // ==========================================================
  // SNAP TURN
  // ==========================================================

  const now =
    performance.now() / 1000;


  if (
    Math.abs(right.x) > 0.7 &&
    now - state.lastSnap >
      state.snapCooldown
  ) {

    const amount =
      S.GAME?.settings?.snapTurnAmount ||
      30;


    S.playerRig.rotation.y -=
      THREE.MathUtils.degToRad(
        Math.sign(right.x) * amount
      );


    state.lastSnap =
      now;

  }

}


// ============================================================
// VISIBILITY
// ============================================================

function updateHandVisibility() {

  if (!S.renderer?.xr?.isPresenting) {
    return;
  }


  const session =
    S.renderer.xr.getSession();

  if (!session) {
    return;
  }


  let leftHasHands =
    false;

  let rightHasHands =
    false;


  for (
    const source
    of session.inputSources
  ) {

    if (
      source.handedness === "left" &&
      source.hand
    ) {

      leftHasHands = true;

    }


    if (
      source.handedness === "right" &&
      source.hand
    ) {

      rightHasHands = true;

    }

  }


  /*
   * When real hand tracking is active, let the actual
   * hand model show.
   */

  if (state.leftHandModel) {

    state.leftHandModel.visible =
      leftHasHands;

  }

  if (state.rightHandModel) {

    state.rightHandModel.visible =
      rightHasHands;

  }


  /*
   * When using controllers, show the controller model.
   */

  if (state.leftControllerModel) {

    state.leftControllerModel.visible =
      !leftHasHands;

  }

  if (state.rightControllerModel) {

    state.rightControllerModel.visible =
      !rightHasHands;

  }


  /*
   * Fallback hand is kept hidden because the real controller
   * model should be used when available.
   */

  if (state.leftFallback) {

    state.leftFallback.visible =
      false;

  }

  if (state.rightFallback) {

    state.rightFallback.visible =
      false;

  }

}


// ============================================================
// UPDATE
// ============================================================

function update(
  delta = 0.016
) {

  if (
    !S.renderer?.xr?.isPresenting
  ) {

    return;

  }


  updateMovement(delta);

  updateHandVisibility();

}


// ============================================================
// SETUP
// ============================================================

function setupHands() {

  if (state.initialized) {

    return state;

  }


  if (
    !S.renderer ||
    !S.playerRig
  ) {

    console.error(
      "Hands: renderer or playerRig missing."
    );

    return state;

  }


  setupControllers();


  state.initialized =
    true;


  console.log(
    "VR hands/controllers initialized."
  );


  return state;

}


// ============================================================
// EXPORT
// ============================================================

S.handsState =
  state;

S.setupHands =
  setupHands;

S.updateHands =
  update;


export {
  setupHands,
  update,
  update as updateHands
};

export default {
  setupHands,
  update,
  updateHands: update
};