/* =========================================================
   SURVIVAL ISLAND VR
   HANDS + CONTROLLERS + MOVEMENT
========================================================= */

import * as THREE from "three";
import { XRHandModelFactory } from
  "three/addons/webxr/XRHandModelFactory.js";
import { XRControllerModelFactory } from
  "three/addons/webxr/XRControllerModelFactory.js";

const S = window.SurvivalVR;

if (!S) {
  throw new Error(
    "SurvivalVR must exist before hands.js loads."
  );
}

/* =========================================================
   STATE
========================================================= */

const state = {
  controllerLeft: null,
  controllerRight: null,

  gripLeft: null,
  gripRight: null,

  handLeft: null,
  handRight: null,

  handModelLeft: null,
  handModelRight: null,

  controllerModelLeft: null,
  controllerModelRight: null,

  leftFallbackHand: null,
  rightFallbackHand: null,

  initialized: false,

  leftGripPressed: false,
  rightGripPressed: false,

  leftTriggerPressed: false,
  rightTriggerPressed: false,

  lastLeftPosition: new THREE.Vector3(),
  lastRightPosition: new THREE.Vector3(),

  leftVelocity: new THREE.Vector3(),
  rightVelocity: new THREE.Vector3(),

  movementSpeed: 2.5,
  sprintSpeed: 4.5,

  turnCooldown: 0,

  lastTime: performance.now()
};


/* =========================================================
   PROCEDURAL HAND
========================================================= */

function createFallbackHand() {
  const group =
    new THREE.Group();

  group.name =
    "RealisticFallbackHand";

  /*
   * Palm.
   */
  const palmGeometry =
    new THREE.SphereGeometry(
      0.075,
      16,
      12
    );

  palmGeometry.scale(
    0.9,
    1.15,
    0.65
  );

  const skinMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc98d6b,
      roughness: 0.72,
      metalness: 0
    });

  const palm =
    new THREE.Mesh(
      palmGeometry,
      skinMaterial
    );

  palm.castShadow = true;
  palm.receiveShadow = true;

  group.add(
    palm
  );

  /*
   * Fingers.
   */
  const fingerLengths = [
    0.075,
    0.09,
    0.095,
    0.085
  ];

  const fingerX = [
    -0.045,
    -0.015,
    0.015,
    0.045
  ];

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    const finger =
      createFinger(
        fingerLengths[i],
        skinMaterial
      );

    finger.position.set(
      fingerX[i],
      -0.07,
      -0.045
    );

    finger.rotation.x =
      -0.25;

    group.add(
      finger
    );
  }

  /*
   * Thumb.
   */
  const thumb =
    createFinger(
      0.085,
      skinMaterial
    );

  thumb.position.set(
    -0.075,
    -0.01,
    0
  );

  thumb.rotation.z =
    -0.9;

  thumb.rotation.x =
    -0.25;

  group.add(
    thumb
  );

  return group;
}


function createFinger(
  length,
  material
) {
  const geometry =
    new THREE.CapsuleGeometry(
      0.018,
      length,
      5,
      8
    );

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}


/* =========================================================
   CONTROLLERS
========================================================= */

function setupControllers() {
  if (
    !S.renderer
  ) {
    return;
  }

  const controllerFactory =
    new XRControllerModelFactory();

  const handFactory =
    new XRHandModelFactory();

  /*
   * LEFT.
   */
  state.controllerLeft =
    S.renderer.xr.getController(
      0
    );

  state.gripLeft =
    S.renderer.xr.getControllerGrip(
      0
    );

  state.handLeft =
    S.renderer.xr.getHand(
      0
    );

  /*
   * RIGHT.
   */
  state.controllerRight =
    S.renderer.xr.getController(
      1
    );

  state.gripRight =
    S.renderer.xr.getControllerGrip(
      1
    );

  state.handRight =
    S.renderer.xr.getHand(
      1
    );

  /*
   * Controller models.
   */
  state.controllerModelLeft =
    controllerFactory.createControllerModel(
      state.gripLeft
    );

  state.controllerModelRight =
    controllerFactory.createControllerModel(
      state.gripRight
    );

  state.gripLeft.add(
    state.controllerModelLeft
  );

  state.gripRight.add(
    state.controllerModelRight
  );

  /*
   * Hand models.
   */
  state.handModelLeft =
    handFactory.createHandModel(
      state.handLeft,
      "mesh"
    );

  state.handModelRight =
    handFactory.createHandModel(
      state.handRight,
      "mesh"
    );

  state.handLeft.add(
    state.handModelLeft
  );

  state.handRight.add(
    state.handModelRight
  );

  /*
   * Fallback hands.
   */
  state.leftFallbackHand =
    createFallbackHand();

  state.rightFallbackHand =
    createFallbackHand();

  state.leftFallbackHand.visible =
    true;

  state.rightFallbackHand.visible =
    true;

  state.gripLeft.add(
    state.leftFallbackHand
  );

  state.gripRight.add(
    state.rightFallbackHand
  );

  /*
   * Add everything to the rig.
   */
  S.playerRig.add(
    state.controllerLeft
  );

  S.playerRig.add(
    state.controllerRight
  );

  S.playerRig.add(
    state.gripLeft
  );

  S.playerRig.add(
    state.gripRight
  );

  S.playerRig.add(
    state.handLeft
  );

  S.playerRig.add(
    state.handRight
  );

  /*
   * Controller events.
   */
  setupControllerEvents(
    state.controllerLeft,
    "left"
  );

  setupControllerEvents(
    state.controllerRight,
    "right"
  );

  state.initialized =
    true;
}


/* =========================================================
   CONTROLLER EVENTS
========================================================= */

function setupControllerEvents(
  controller,
  hand
) {
  controller.addEventListener(
    "connected",
    event => {
      console.log(
        `${hand} controller connected`,
        event.data
      );

      hideControllerModelIfHandTracking(
        hand
      );
    }
  );

  controller.addEventListener(
    "disconnected",
    () => {
      console.log(
        `${hand} controller disconnected`
      );
    }
  );

  controller.addEventListener(
    "selectstart",
    () => {
      if (
        hand === "left"
      ) {
        state.leftTriggerPressed =
          true;
      } else {
        state.rightTriggerPressed =
          true;
      }

      handleSelect(
        hand
      );
    }
  );

  controller.addEventListener(
    "selectend",
    () => {
      if (
        hand === "left"
      ) {
        state.leftTriggerPressed =
          false;
      } else {
        state.rightTriggerPressed =
          false;
      }
    }
  );

  controller.addEventListener(
    "squeezestart",
    () => {
      if (
        hand === "left"
      ) {
        state.leftGripPressed =
          true;
      } else {
        state.rightGripPressed =
          true;
      }

      handleGrip(
        hand
      );
    }
  );

  controller.addEventListener(
    "squeezeend",
    () => {
      if (
        hand === "left"
      ) {
        state.leftGripPressed =
          false;
      } else {
        state.rightGripPressed =
          false;
      }
    }
  );
}


/* =========================================================
   SELECT
========================================================= */

function handleSelect(
  hand
) {
  /*
   * If an item is being held,
   * release it.
   *
   * Otherwise interact with
   * the world.
   */
  const game =
    S.GAME;

  if (
    !game
  ) {
    return;
  }

  const held =
    game.hands?.[hand];

  if (
    held
  ) {
    if (
      typeof gameEvent ===
      "function"
    ) {
      gameEvent(
        "hand-use",
        {
          hand,
          item:
            held
        }
      );
    }

    return;
  }

  /*
   * Starting interaction:
   * holding the trigger can
   * attempt to pick up the
   * nearest resource.
   */
  tryGatherWithHand(
    hand
  );
}


/* =========================================================
   GRIP
========================================================= */

function handleGrip(
  hand
) {
  const game =
    S.GAME;

  if (
    !game
  ) {
    return;
  }

  const side =
    hand === "left"
      ? "leftSide"
      : "rightSide";

  const sideItem =
    game.equipment?.[
      side
    ];

  /*
   * Pull item from side slot
   * into hand.
   */
  if (
    sideItem &&
    typeof game.holdItem ===
      "function"
  ) {
    game.holdItem(
      hand,
      sideItem
    );

    game.equipment[
      side
    ] = null;
  }
}


/* =========================================================
   GATHER
========================================================= */

function tryGatherWithHand(
  hand
) {
  if (
    !S.systems.world
  ) {
    return;
  }

  if (
    typeof S.systems.world.gatherNearestResource !==
      "function"
  ) {
    return;
  }

  /*
   * Gathering requires the
   * hand to be reasonably close
   * to a resource.
   */
  const handPosition =
    getHandWorldPosition(
      hand
    );

  const types = [
    "tree",
    "rock",
    "log"
  ];

  for (
    const type of types
  ) {
    const gathered =
      S.systems.world.gatherNearestResource(
        type,
        1.45,
        handPosition
      );

    if (
      gathered
    ) {
      return;
    }
  }
}


/* =========================================================
   HAND POSITION
========================================================= */

function getHandWorldPosition(
  hand
) {
  const object =
    hand === "left"
      ? (
          state.handLeft ||
          state.gripLeft
        )
      : (
          state.handRight ||
          state.gripRight
        );

  if (
    object
  ) {
    const position =
      new THREE.Vector3();

    object.getWorldPosition(
      position
    );

    return position;
  }

  /*
   * Fallback.
   */
  if (
    S.playerRig
  ) {
    return new THREE.Vector3(
      S.playerRig.position.x,
      S.playerRig.position.y,
      S.playerRig.position.z
    );
  }

  return new THREE.Vector3();
}


/* =========================================================
   VELOCITY
========================================================= */

function updateHandVelocity(
  hand,
  delta
) {
  const position =
    getHandWorldPosition(
      hand
    );

  const previous =
    hand === "left"
      ? state.lastLeftPosition
      : state.lastRightPosition;

  const velocity =
    hand === "left"
      ? state.leftVelocity
      : state.rightVelocity;

  if (
    delta > 0
  ) {
    velocity.subVectors(
      position,
      previous
    );

    velocity.divideScalar(
      delta
    );
  }

  previous.copy(
    position
  );

  /*
   * Tell animals about the
   * physical swing.
   */
  const heldItem =
    S.GAME?.hands?.[
      hand
    ];

  if (
    heldItem &&
    S.systems.animals &&
    typeof S.systems.animals.registerItemHit ===
      "function"
  ) {
    S.systems.animals.registerItemHit(
      hand,
      heldItem,
      position,
      velocity
    );
  }
}


/* =========================================================
   MOVEMENT
========================================================= */

function updateMovement(
  delta
) {
  if (
    !S.playerRig ||
    !S.renderer?.xr?.isPresenting
  ) {
    return;
  }

  const leftAxes =
    getGamepadAxes(
      state.controllerLeft
    );

  const rightAxes =
    getGamepadAxes(
      state.controllerRight
    );

  if (
    !leftAxes
  ) {
    return;
  }

  let x =
    leftAxes.x;

  let z =
    leftAxes.y;

  const deadzone =
    0.15;

  if (
    Math.abs(x) <
    deadzone
  ) {
    x = 0;
  }

  if (
    Math.abs(z) <
    deadzone
  ) {
    z = 0;
  }

  const magnitude =
    Math.min(
      1,
      Math.sqrt(
        x * x +
        z * z
      )
    );

  if (
    magnitude > 0
  ) {
    const sprinting =
      isSprintingByInput();

    const speed =
      sprinting
        ? state.sprintSpeed
        : state.movementSpeed;

    /*
     * Controller stick:
     * forward is negative Y.
     */
    const forward =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    const right =
      new THREE.Vector3(
        1,
        0,
        0
      );

    const rotation =
      S.playerRig.rotation.y;

    forward.applyAxisAngle(
      new THREE.Vector3(
        0,
        1,
        0
      ),
      rotation
    );

    right.applyAxisAngle(
      new THREE.Vector3(
        0,
        1,
        0
      ),
      rotation
    );

    const movement =
      new THREE.Vector3();

    movement
      .addScaledVector(
        right,
        x
      )
      .addScaledVector(
        forward,
        -z
      );

    if (
      movement.lengthSq() >
      0
    ) {
      movement.normalize();

      movement.multiplyScalar(
        speed *
        magnitude *
        delta
      );

      S.playerRig.position.add(
        movement
      );

      keepPlayerOnIsland();

      S.GAME.position.x =
        S.playerRig.position.x;

      S.GAME.position.y =
        S.playerRig.position.y;

      S.GAME.position.z =
        S.playerRig.position.z;

      S.GAME.statistics.distanceWalked +=
        movement.length();
    }
  }

  /*
   * Right stick turning.
   */
  if (
    rightAxes
  ) {
    updateTurning(
      rightAxes.x,
      delta
    );
  }
}


/* =========================================================
   GAMEPAD
========================================================= */

function getGamepadAxes(
  controller
) {
  if (
    !controller
  ) {
    return null;
  }

  const inputSources =
    S.renderer?.xr?.getSession?.()
      ?.inputSources;

  if (
    !inputSources
  ) {
    return null;
  }

  for (
    const source of
      inputSources
  ) {
    if (
      !source.gamepad
    ) {
      continue;
    }

    const handedness =
      source.handedness;

    if (
      controller ===
      state.controllerLeft &&
      handedness ===
        "left"
    ) {
      return {
        x:
          source.gamepad.axes[2] ||
          0,

        y:
          source.gamepad.axes[3] ||
          0
      };
    }

    if (
      controller ===
      state.controllerRight &&
      handedness ===
        "right"
    ) {
      return {
        x:
          source.gamepad.axes[2] ||
          0,

        y:
          source.gamepad.axes[3] ||
          0
      };
    }
  }

  return null;
}


/* =========================================================
   TURNING
========================================================= */

function updateTurning(
  axis,
  delta
) {
  if (
    Math.abs(axis) <
    0.35
  ) {
    state.turnCooldown =
      Math.max(
        0,
        state.turnCooldown -
          delta
      );

    return;
  }

  if (
    !S.GAME.settings.snapTurning
  ) {
    S.playerRig.rotation.y -=
      axis *
      2.5 *
      delta;

    return;
  }

  if (
    state.turnCooldown >
    0
  ) {
    return;
  }

  const amount =
    THREE.MathUtils.degToRad(
      Number(
        S.GAME.settings.snapTurnAmount
      ) || 30
    );

  S.playerRig.rotation.y -=
    Math.sign(axis) *
    amount;

  S.GAME.position.rotationY =
    S.playerRig.rotation.y;

  state.turnCooldown =
    0.3;
}


/* =========================================================
   SPRINT
========================================================= */

function isSprintingByInput() {
  const source =
    S.renderer?.xr?.getSession?.()
      ?.inputSources;

  if (
    !source
  ) {
    return false;
  }

  for (
    const input of source
  ) {
    if (
      !input.gamepad ||
      !input.handedness
    ) {
      continue;
    }

    /*
     * Use left stick click
     * when available.
     */
    if (
      input.handedness ===
        "left" &&
      input.gamepad.buttons?.[4]?.pressed
    ) {
      if (
        S.GAME.player.stamina >
        2
      ) {
        S.GAME.player.sprinting =
          true;

        return true;
      }
    }
  }

  S.GAME.player.sprinting =
    false;

  return false;
}


/* =========================================================
   KEEP PLAYER ON ISLAND
========================================================= */

function keepPlayerOnIsland() {
  if (
    !S.systems.world
  ) {
    return;
  }

  const getHeight =
    S.systems.world
      .getTerrainHeightAt;

  if (
    typeof getHeight !==
      "function"
  ) {
    return;
  }

  const x =
    S.playerRig.position.x;

  const z =
    S.playerRig.position.z;

  const terrainHeight =
    getHeight(
      x,
      z
    );

  /*
   * Do not allow the player
   * to walk below the island.
   */
  if (
    terrainHeight <= -1.5
  ) {
    return;
  }

  /*
   * Keep the player slightly
   * above terrain.
   */
  S.playerRig.position.y =
    terrainHeight;

  S.GAME.position.y =
    terrainHeight;
}


/* =========================================================
   HAND TRACKING VISIBILITY
========================================================= */

function hideControllerModelIfHandTracking(
  hand
) {
  const controller =
    hand === "left"
      ? state.controllerModelLeft
      : state.controllerModelRight;

  const fallback =
    hand === "left"
      ? state.leftFallbackHand
      : state.rightFallbackHand;

  const handObject =
    hand === "left"
      ? state.handLeft
      : state.handRight;

  /*
   * If the XR runtime has a real
   * tracked hand, prefer the hand
   * model over the controller.
   */
  const hasTrackedHand =
    !!(
      handObject &&
      handObject.joints
    );

  if (
    controller
  ) {
    controller.visible =
      !hasTrackedHand;
  }

  if (
    fallback
  ) {
    fallback.visible =
      !hasTrackedHand;
  }
}


/* =========================================================
   UPDATE HAND VISUALS
========================================================= */

function updateHandVisibility() {
  hideControllerModelIfHandTracking(
    "left"
  );

  hideControllerModelIfHandTracking(
    "right"
  );

  /*
   * If controller tracking is
   * active but the runtime doesn't
   * provide a hand model, keep the
   * procedural hands visible.
   */
  if (
    state.leftFallbackHand
  ) {
    const handTracked =
      !!(
        state.handLeft &&
        state.handLeft.joints
      );

    state.leftFallbackHand.visible =
      !handTracked;
  }

  if (
    state.rightFallbackHand
  ) {
    const handTracked =
      !!(
        state.handRight &&
        state.handRight.joints
      );

    state.rightFallbackHand.visible =
      !handTracked;
  }
}


/* =========================================================
   UPDATE
========================================================= */

function updateHands(
  delta
) {
  if (
    !state.initialized
  ) {
    return;
  }

  updateMovement(
    delta
  );

  updateHandVelocity(
    "left",
    delta
  );

  updateHandVelocity(
    "right",
    delta
  );

  updateHandVisibility();

  /*
   * Keep game position synchronized.
   */
  if (
    S.playerRig
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


/* =========================================================
   VR SESSION EVENTS
========================================================= */

function setupXRListeners() {
  if (
    !S.renderer
  ) {
    return;
  }

  S.renderer.xr.addEventListener(
    "sessionstart",
    () => {
      S.isXR =
        true;

      if (
        S.GAME &&
        typeof S.GAME.setVRState ===
          "function"
      ) {
        S.GAME.setVRState(
          true
        );
      }

      console.log(
        "VR session started"
      );
    }
  );

  S.renderer.xr.addEventListener(
    "sessionend",
    () => {
      S.isXR =
        false;

      if (
        S.GAME &&
        typeof S.GAME.setVRState ===
          "function"
      ) {
        S.GAME.setVRState(
          false
        );
      }

      console.log(
        "VR session ended"
      );
    }
  );
}


/* =========================================================
   SETUP
========================================================= */

function setupHands() {
  if (
    state.initialized
  ) {
    return;
  }

  if (
    !S.renderer ||
    !S.playerRig
  ) {
    console.warn(
      "Hands waiting for renderer/player rig."
    );

    return;
  }

  setupControllers();

  setupXRListeners();

  /*
   * Initialize velocity positions.
   */
  state.lastLeftPosition.copy(
    getHandWorldPosition(
      "left"
    )
  );

  state.lastRightPosition.copy(
    getHandWorldPosition(
      "right"
    )
  );

  /*
   * Expose hands to the
   * SurvivalVR namespace.
   */
  S.hands =
    api;

  console.log(
    "Survival Island VR hands ready."
  );
}


/* =========================================================
   API
========================================================= */

const api = {
  setupHands,

  updateHands,

  update:
    updateHands,

  getHands() {
    return {
      left:
        state.handLeft ||
        state.gripLeft,

      right:
        state.handRight ||
        state.gripRight
    };
  },

  getHandWorldPosition,

  getLeftVelocity() {
    return state.leftVelocity;
  },

  getRightVelocity() {
    return state.rightVelocity;
  },

  getState() {
    return state;
  }
};


/* =========================================================
   EXPORTS
========================================================= */

export {
  setupHands,
  updateHands,
  getHandWorldPosition
};

export default api;