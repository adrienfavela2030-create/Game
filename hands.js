import * as THREE from "three";

/*
 * ============================================================
 * SURVIVAL VR — HANDS + VR LOCOMOTION
 * ============================================================
 *
 * Left stick:
 *   Move forward/back/left/right
 *
 * Right stick:
 *   Snap turn
 *
 * Trigger:
 *   Grab/interact event
 *
 * Grip:
 *   Grab event
 *
 * This file is safe to load AFTER window.SurvivalVR exists.
 * ============================================================
 */

const S = window.SurvivalVR;

if (!S) {
  throw new Error(
    "SurvivalVR must be created before hands.js loads."
  );
}

const THREE_NS = THREE;

const state = {

  initialized: false,

  leftController: null,
  rightController: null,

  leftGrip: null,
  rightGrip: null,

  leftHand: null,
  rightHand: null,

  leftInput: null,
  rightInput: null,

  leftPressed: false,
  rightPressed: false,

  leftSqueeze: false,
  rightSqueeze: false,

  lastSnapTime: 0,

  snapCooldown: 0.28,

  moveSpeed: 2.2,

  sprintSpeed: 4.0,

  snapAngle: 30,

  deadzone: 0.15,

  handsGroup: null

};


/* ============================================================
   UTILITY
   ============================================================ */

function dispatch(name, detail = {}) {

  window.dispatchEvent(
    new CustomEvent(name, {
      detail
    })
  );

}


/* ============================================================
   CREATE SIMPLE VR HAND
   ============================================================ */

function createHand(side) {

  const group =
    new THREE.Group();

  group.name =
    `${side}-vr-hand`;

  const skinMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd69b72,
      roughness: 0.75,
      metalness: 0
    });


  const palmGeometry =
    new THREE.SphereGeometry(
      0.075,
      12,
      8
    );


  const palm =
    new THREE.Mesh(
      palmGeometry,
      skinMaterial
    );


  palm.scale.set(
    0.9,
    1.15,
    0.55
  );


  group.add(palm);


  /*
   * Fingers
   */

  const fingerGeometry =
    new THREE.CapsuleGeometry(
      0.018,
      0.075,
      4,
      6
    );


  const fingerPositions = [

    [-0.045, 0.075, -0.015],

    [-0.015, 0.09, -0.02],

    [0.015, 0.09, -0.02],

    [0.045, 0.075, -0.015]

  ];


  for (
    const position of fingerPositions
  ) {

    const finger =
      new THREE.Mesh(
        fingerGeometry,
        skinMaterial
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
        0.065,
        4,
        6
      ),
      skinMaterial
    );


  thumb.rotation.z =
    side === "left"
      ? -0.7
      : 0.7;


  thumb.position.set(
    side === "left"
      ? -0.065
      : 0.065,
    0.015,
    -0.015
  );


  group.add(thumb);


  /*
   * Hide the hand until appropriate.
   */

  group.visible =
    true;


  return group;

}


/* ============================================================
   CONTROLLER SETUP
   ============================================================ */

function setupController(
  controller,
  side
) {

  if (!controller) {
    return;
  }


  controller.userData.side =
    side;


  /*
   * Trigger / select
   */

  controller.addEventListener(
    "selectstart",
    () => {

      if (side === "left") {
        state.leftPressed = true;
      } else {
        state.rightPressed = true;
      }


      dispatch(
        "survival-grab",
        {
          side,
          source: "trigger"
        }
      );

    }
  );


  controller.addEventListener(
    "selectend",
    () => {

      if (side === "left") {
        state.leftPressed = false;
      } else {
        state.rightPressed = false;
      }


      dispatch(
        "survival-release",
        {
          side,
          source: "trigger"
        }
      );

    }
  );


  /*
   * Grip button
   */

  controller.addEventListener(
    "squeezestart",
    () => {

      if (side === "left") {
        state.leftSqueeze = true;
      } else {
        state.rightSqueeze = true;
      }


      dispatch(
        "survival-squeeze",
        {
          side,
          pressed: true
        }
      );

    }
  );


  controller.addEventListener(
    "squeezeend",
    () => {

      if (side === "left") {
        state.leftSqueeze = false;
      } else {
        state.rightSqueeze = false;
      }


      dispatch(
        "survival-squeeze",
        {
          side,
          pressed: false
        }
      );

    }
  );

}


/* ============================================================
   INPUT SOURCE
   ============================================================ */

function getGamepadForSide(side) {

  if (!S.renderer) {
    return null;
  }


  const session =
    S.renderer.xr.getSession();


  if (!session) {
    return null;
  }


  for (
    const source of session.inputSources
  ) {

    if (
      source.handedness !== side
    ) {
      continue;
    }


    if (
      source.gamepad
    ) {

      return source.gamepad;

    }

  }


  return null;

}


/* ============================================================
   DEADZONE
   ============================================================ */

function applyDeadzone(value) {

  const absolute =
    Math.abs(value);


  if (
    absolute <
    state.deadzone
  ) {

    return 0;

  }


  const sign =
    Math.sign(value);


  const normalized =
    (
      absolute -
      state.deadzone
    ) /
    (
      1 -
      state.deadzone
    );


  return sign *
    Math.min(
      1,
      normalized
    );

}


/* ============================================================
   PLAYER MOVEMENT
   ============================================================ */

function updateMovement(
  delta
) {

  if (!S.renderer) {
    return;
  }


  if (!S.renderer.xr.isPresenting) {
    return;
  }


  if (!S.playerGroup) {
    return;
  }


  if (
    S.GAME &&
    S.GAME.state &&
    (
      S.GAME.state.paused ||
      S.GAME.state.gameOver
    )
  ) {

    return;

  }


  const gamepad =
    getGamepadForSide(
      "left"
    );


  if (!gamepad) {
    return;
  }


  const axes =
    gamepad.axes || [];


  /*
   * Quest controllers normally expose the main
   * thumbstick around axes 2 and 3.
   *
   * Some browsers expose them at 0 and 1.
   */

  let x =
    axes.length >= 4
      ? axes[2]
      : axes[0] || 0;


  let y =
    axes.length >= 4
      ? axes[3]
      : axes[1] || 0;


  x =
    applyDeadzone(x);


  y =
    applyDeadzone(y);


  if (
    Math.abs(x) < 0.001 &&
    Math.abs(y) < 0.001
  ) {

    return;

  }


  /*
   * Camera direction.
   *
   * We only use the horizontal direction so
   * looking up/down doesn't make you fly.
   */

  const camera =
    S.camera;


  const forward =
    new THREE.Vector3();


  camera.getWorldDirection(
    forward
  );


  forward.y = 0;


  if (
    forward.lengthSq() < 0.0001
  ) {

    return;

  }


  forward.normalize();


  const right =
    new THREE.Vector3(
      forward.z,
      0,
      -forward.x
    );


  /*
   * Quest stick:
   *
   * Y forward/back
   * X strafe
   */

  const movement =
    new THREE.Vector3();


  movement.addScaledVector(
    forward,
    -y
  );


  movement.addScaledVector(
    right,
    x
  );


  if (
    movement.lengthSq() < 0.0001
  ) {

    return;

  }


  movement.normalize();


  /*
   * Sprint when the game core says sprinting.
   */

  let speed =
    state.moveSpeed;


  if (
    S.GAME &&
    S.GAME.player &&
    S.GAME.player.sprinting
  ) {

    speed =
      state.sprintSpeed;

  }


  const distance =
    speed * delta;


  S.playerGroup.position.x +=
    movement.x * distance;


  S.playerGroup.position.z +=
    movement.z * distance;


  /*
   * Keep the player on the ground.
   */

  updateGroundHeight();


  /*
   * Keep game.js position synchronized.
   */

  if (
    S.GAME &&
    S.GAME.position
  ) {

    S.GAME.position.x =
      S.playerGroup.position.x;

    S.GAME.position.z =
      S.playerGroup.position.z;

  }


  dispatch(
    "survival-player-moved",
    {
      x:
        S.playerGroup.position.x,

      y:
        S.playerGroup.position.y,

      z:
        S.playerGroup.position.z
    }
  );

}


/* ============================================================
   GROUND HEIGHT
   ============================================================ */

function updateGroundHeight() {

  if (!S.playerGroup) {
    return;
  }


  /*
   * The playerGroup itself represents the player's feet.
   *
   * Terrain systems can provide a terrain height function.
   */

  let height = 0;


  const world =
    S.systems &&
    S.systems.world;


  if (
    world &&
    typeof world.getTerrainHeight ===
      "function"
  ) {

    try {

      height =
        Number(
          world.getTerrainHeight(
            S.playerGroup.position.x,
            S.playerGroup.position.z
          )
        );

      if (
        !Number.isFinite(height)
      ) {

        height = 0;

      }

    } catch {

      height = 0;

    }

  }


  /*
   * Keep the player's feet slightly above
   * the generated terrain.
   */

  S.playerGroup.position.y =
    height;

}


/* ============================================================
   SNAP TURN
   ============================================================ */

function updateSnapTurn() {

  if (!S.renderer) {
    return;
  }


  if (!S.renderer.xr.isPresenting) {
    return;
  }


  if (!S.playerGroup) {
    return;
  }


  const gamepad =
    getGamepadForSide(
      "right"
    );


  if (!gamepad) {
    return;
  }


  const axes =
    gamepad.axes || [];


  let x =
    axes.length >= 4
      ? axes[2]
      : axes[0] || 0;


  x =
    applyDeadzone(x);


  if (
    Math.abs(x) < 0.5
  ) {

    return;

  }


  const now =
    performance.now() /
    1000;


  if (
    now -
    state.lastSnapTime <
    state.snapCooldown
  ) {

    return;

  }


  const direction =
    x > 0
      ? -1
      : 1;


  const radians =
    THREE.MathUtils.degToRad(
      state.snapAngle
    );


  S.playerGroup.rotation.y +=
    direction * radians;


  state.lastSnapTime =
    now;


  dispatch(
    "survival-snap-turn",
    {
      angle:
        direction *
        state.snapAngle
    }
  );

}


/* ============================================================
   CONTROLLER CONNECTION
   ============================================================ */

function setupControllers() {

  if (!S.renderer) {
    return;
  }


  const renderer =
    S.renderer;


  state.leftController =
    renderer.xr.getController(0);


  state.rightController =
    renderer.xr.getController(1);


  state.leftGrip =
    renderer.xr.getControllerGrip(0);


  state.rightGrip =
    renderer.xr.getControllerGrip(1);


  state.leftHand =
    createHand("left");


  state.rightHand =
    createHand("right");


  /*
   * Position the hands relative to controllers.
   */

  state.leftHand.position.set(
    -0.01,
    -0.02,
    -0.08
  );


  state.rightHand.position.set(
    0.01,
    -0.02,
    -0.08
  );


  state.leftController.add(
    state.leftHand
  );


  state.rightController.add(
    state.rightHand
  );


  /*
   * Add controllers to the player.
   */

  S.playerGroup.add(
    state.leftController
  );


  S.playerGroup.add(
    state.rightController
  );


  /*
   * Controller events.
   */

  setupController(
    state.leftController,
    "left"
  );


  setupController(
    state.rightController,
    "right"
  );


  /*
   * Store references globally.
   */

  S.leftController =
    state.leftController;

  S.rightController =
    state.rightController;


  S.leftHand =
    state.leftHand;

  S.rightHand =
    state.rightHand;

}


/* ============================================================
   HAND VISIBILITY
   ============================================================ */

function updateHandVisibility() {

  const presenting =
    S.renderer &&
    S.renderer.xr &&
    S.renderer.xr.isPresenting;


  if (state.leftHand) {

    state.leftHand.visible =
      !!presenting;

  }


  if (state.rightHand) {

    state.rightHand.visible =
      !!presenting;

  }

}


/* ============================================================
   UPDATE
   ============================================================ */

function update(
  delta
) {

  if (!state.initialized) {
    return;
  }


  updateHandVisibility();


  updateMovement(
    delta
  );


  updateSnapTurn();

}


/* ============================================================
   SETUP
   ============================================================ */

function setupHands() {

  if (state.initialized) {
    return state;
  }


  if (!S.renderer) {

    console.warn(
      "Hands: renderer not ready."
    );

    return state;

  }


  if (!S.playerGroup) {

    console.warn(
      "Hands: player group not ready."
    );

    return state;

  }


  setupControllers();


  state.initialized =
    true;


  /*
   * Expose everything through SurvivalVR.
   */

  S.hands =
    state;


  S.updateHands =
    update;


  S.setupHands =
    setupHands;


  console.log(
    "VR hands and locomotion initialized."
  );


  return state;

}


/* ============================================================
   AUTO SETUP
   ============================================================ */

setupHands();


/* ============================================================
   EXPORTS
   ============================================================ */

export {
  setupHands,
  update
};

export const updateHands =
  update;

export default state;