import * as THREE from "three";

const S = window.SurvivalVR;

if (!S) {
  throw new Error(
    "SurvivalVR must exist before hands.js loads."
  );
}

const state = {
  initialized: false,

  leftController: null,
  rightController: null,

  leftGrip: null,
  rightGrip: null,

  leftHand: null,
  rightHand: null,

  moveSpeed: 2.2,
  sprintSpeed: 4.0,

  snapTurnDegrees: 30,
  snapCooldown: 0.35,
  lastSnap: 0,

  deadzone: 0.16,

  previousLeftTrigger: false,
  previousRightTrigger: false,

  previousLeftGrip: false,
  previousRightGrip: false
};


/* ============================================================
   EVENTS
   ============================================================ */

function emit(name, detail = {}) {
  window.dispatchEvent(
    new CustomEvent(name, {
      detail
    })
  );
}


/* ============================================================
   CONTROLLER HAND MODEL
   ============================================================ */

function createHand(side) {

  const hand = new THREE.Group();

  hand.name =
    `${side}-hand`;

  const skin = new THREE.MeshStandardMaterial({
    color: 0xc98f6b,
    roughness: 0.8,
    metalness: 0
  });


  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.065,
      12,
      8
    ),
    skin
  );

  palm.scale.set(
    1.0,
    1.2,
    0.7
  );

  hand.add(palm);


  const fingerGeometry =
    new THREE.CapsuleGeometry(
      0.014,
      0.065,
      4,
      6
    );


  const fingerX = [
    -0.042,
    -0.014,
    0.014,
    0.042
  ];


  for (const x of fingerX) {

    const finger = new THREE.Mesh(
      fingerGeometry,
      skin
    );

    finger.position.set(
      x,
      0.072,
      -0.015
    );

    hand.add(finger);
  }


  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      0.016,
      0.065,
      4,
      6
    ),
    skin
  );

  thumb.position.set(
    side === "left"
      ? -0.065
      : 0.065,
    0.01,
    -0.01
  );

  thumb.rotation.z =
    side === "left"
      ? -0.65
      : 0.65;

  hand.add(thumb);


  return hand;
}


/* ============================================================
   DEADZONE
   ============================================================ */

function deadzone(value) {

  const amount =
    Math.abs(value);

  if (
    amount <
    state.deadzone
  ) {
    return 0;
  }

  const sign =
    Math.sign(value);

  return sign *
    (
      (amount - state.deadzone) /
      (1 - state.deadzone)
    );

}


/* ============================================================
   GET XR GAMEPAD
   ============================================================ */

function getInputSource(handedness) {

  if (!S.renderer) {
    return null;
  }

  if (
    !S.renderer.xr.isPresenting
  ) {
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
      source.handedness ===
      handedness &&
      source.gamepad
    ) {

      return source;

    }

  }

  return null;
}


/* ============================================================
   GET THUMBSTICK
   ============================================================ */

function getStick(source) {

  if (
    !source ||
    !source.gamepad
  ) {
    return {
      x: 0,
      y: 0
    };
  }


  const axes =
    source.gamepad.axes || [];


  /*
   * Quest normally gives the primary thumbstick
   * as axes 2 and 3.
   *
   * Some browser versions expose 0 and 1.
   */

  let x = 0;
  let y = 0;


  if (
    axes.length >= 4
  ) {

    x = axes[2] || 0;
    y = axes[3] || 0;

  } else {

    x = axes[0] || 0;
    y = axes[1] || 0;

  }


  return {
    x: deadzone(x),
    y: deadzone(y)
  };
}


/* ============================================================
   PLAYER HEIGHT / GROUND
   ============================================================ */

function updatePlayerGround() {

  if (!S.playerGroup) {
    return;
  }


  let ground = 0;


  const world =
    S.systems?.world;


  if (
    world &&
    typeof world.getTerrainHeight ===
      "function"
  ) {

    try {

      const value =
        world.getTerrainHeight(
          S.playerGroup.position.x,
          S.playerGroup.position.z
        );


      if (
        Number.isFinite(value)
      ) {

        ground = value;

      }

    } catch {
      ground = 0;
    }

  }


  /*
   * Keep the player's feet on the terrain.
   */

  S.playerGroup.position.y =
    ground;

}


/* ============================================================
   LOCOMOTION
   ============================================================ */

function updateMovement(delta) {

  if (!S.renderer) {
    return;
  }

  if (
    !S.renderer.xr.isPresenting
  ) {
    return;
  }

  if (!S.playerGroup) {
    return;
  }


  if (
    S.GAME?.state?.paused ||
    S.GAME?.state?.gameOver
  ) {
    return;
  }


  const source =
    getInputSource("left");


  if (!source) {
    return;
  }


  const stick =
    getStick(source);


  if (
    Math.abs(stick.x) < 0.001 &&
    Math.abs(stick.y) < 0.001
  ) {
    return;
  }


  /*
   * Get the direction the headset is facing.
   *
   * IMPORTANT:
   * We use the actual XR camera, so movement follows
   * where the player is looking.
   */

  const direction =
    new THREE.Vector3();


  S.camera.getWorldDirection(
    direction
  );


  direction.y = 0;


  if (
    direction.lengthSq() <
    0.00001
  ) {
    return;
  }


  direction.normalize();


  /*
   * Right vector.
   */

  const right =
    new THREE.Vector3(
      direction.z,
      0,
      -direction.x
    );


  /*
   * Build movement vector.
   */

  const movement =
    new THREE.Vector3();


  movement.addScaledVector(
    direction,
    -stick.y
  );


  movement.addScaledVector(
    right,
    stick.x
  );


  if (
    movement.lengthSq() <
    0.00001
  ) {
    return;
  }


  movement.normalize();


  let speed =
    state.moveSpeed;


  if (
    S.GAME?.player?.sprinting
  ) {

    speed =
      state.sprintSpeed;

  }


  const distance =
    speed * delta;


  S.playerGroup.position.x +=
    movement.x *
    distance;


  S.playerGroup.position.z +=
    movement.z *
    distance;


  updatePlayerGround();


  /*
   * Keep game.js synchronized.
   */

  if (
    S.GAME?.position
  ) {

    S.GAME.position.x =
      S.playerGroup.position.x;

    S.GAME.position.y =
      S.playerGroup.position.y;

    S.GAME.position.z =
      S.playerGroup.position.z;

  }


  emit(
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
   SNAP TURN
   ============================================================ */

function updateSnapTurn() {

  if (!S.renderer) {
    return;
  }

  if (
    !S.renderer.xr.isPresenting
  ) {
    return;
  }

  if (!S.playerGroup) {
    return;
  }


  const source =
    getInputSource("right");


  if (!source) {
    return;
  }


  const stick =
    getStick(source);


  if (
    Math.abs(stick.x) <
    0.55
  ) {
    return;
  }


  const now =
    performance.now() /
    1000;


  if (
    now -
    state.lastSnap <
    state.snapCooldown
  ) {
    return;
  }


  const angle =
    THREE.MathUtils.degToRad(
      state.snapTurnDegrees
    );


  /*
   * Push right = turn right.
   * Push left = turn left.
   */

  if (
    stick.x > 0
  ) {

    S.playerGroup.rotation.y -=
      angle;

  } else {

    S.playerGroup.rotation.y +=
      angle;

  }


  state.lastSnap =
    now;


  emit(
    "survival-snap-turn",
    {
      degrees:
        stick.x > 0
          ? state.snapTurnDegrees
          : -state.snapTurnDegrees
    }
  );

}


/* ============================================================
   BUTTONS
   ============================================================ */

function updateButtons() {

  const left =
    getInputSource("left");

  const right =
    getInputSource("right");


  if (left?.gamepad) {

    const buttons =
      left.gamepad.buttons;


    const trigger =
      !!buttons[0]?.pressed;

    const grip =
      !!buttons[1]?.pressed;


    if (
      trigger &&
      !state.previousLeftTrigger
    ) {

      emit(
        "survival-grab",
        {
          side: "left",
          source: "trigger"
        }
      );

    }


    if (
      !trigger &&
      state.previousLeftTrigger
    ) {

      emit(
        "survival-release",
        {
          side: "left",
          source: "trigger"
        }
      );

    }


    if (
      grip &&
      !state.previousLeftGrip
    ) {

      emit(
        "survival-squeeze",
        {
          side: "left",
          pressed: true
        }
      );

    }


    if (
      !grip &&
      state.previousLeftGrip
    ) {

      emit(
        "survival-squeeze",
        {
          side: "left",
          pressed: false
        }
      );

    }


    state.previousLeftTrigger =
      trigger;

    state.previousLeftGrip =
      grip;

  }


  if (right?.gamepad) {

    const buttons =
      right.gamepad.buttons;


    const trigger =
      !!buttons[0]?.pressed;

    const grip =
      !!buttons[1]?.pressed;


    if (
      trigger &&
      !state.previousRightTrigger
    ) {

      emit(
        "survival-grab",
        {
          side: "right",
          source: "trigger"
        }
      );

    }


    if (
      !trigger &&
      state.previousRightTrigger
    ) {

      emit(
        "survival-release",
        {
          side: "right",
          source: "trigger"
        }
      );

    }


    if (
      grip &&
      !state.previousRightGrip
    ) {

      emit(
        "survival-squeeze",
        {
          side: "right",
          pressed: true
        }
      );

    }


    if (
      !grip &&
      state.previousRightGrip
    ) {

      emit(
        "survival-squeeze",
        {
          side: "right",
          pressed: false
        }
      );

    }


    state.previousRightTrigger =
      trigger;

    state.previousRightGrip =
      grip;

  }

}


/* ============================================================
   CONTROLLER SETUP
   ============================================================ */

function setupControllers() {

  if (!S.renderer) {
    return;
  }

  if (!S.playerGroup) {
    return;
  }


  const xr =
    S.renderer.xr;


  /*
   * IMPORTANT:
   *
   * Controllers are children of the PLAYER GROUP.
   *
   * This means when the player moves, the controllers
   * move with the player.
   */

  state.leftController =
    xr.getController(0);

  state.rightController =
    xr.getController(1);


  state.leftGrip =
    xr.getControllerGrip(0);

  state.rightGrip =
    xr.getControllerGrip(1);


  /*
   * Hand models.
   */

  state.leftHand =
    createHand("left");

  state.rightHand =
    createHand("right");


  state.leftController.add(
    state.leftHand
  );

  state.rightController.add(
    state.rightHand
  );


  /*
   * Add controllers to player rig.
   */

  S.playerGroup.add(
    state.leftController
  );

  S.playerGroup.add(
    state.rightController
  );


  /*
   * Grip objects are also attached to the rig.
   */

  S.playerGroup.add(
    state.leftGrip
  );

  S.playerGroup.add(
    state.rightGrip
  );


  /*
   * Public references.
   */

  S.leftController =
    state.leftController;

  S.rightController =
    state.rightController;

  S.leftHand =
    state.leftHand;

  S.rightHand =
    state.rightHand;


  emit(
    "survival-vr-controllers-ready"
  );

}


/* ============================================================
   XR SESSION EVENTS
   ============================================================ */

function setupXREvents() {

  if (!S.renderer) {
    return;
  }


  S.renderer.xr.addEventListener(
    "sessionstart",
    () => {

      console.log(
        "SURVIVAL VR: XR SESSION STARTED"
      );


      if (
        S.GAME?.state
      ) {

        S.GAME.state.inVR =
          true;

      }


      updatePlayerGround();


      emit(
        "survival-vr-started"
      );

    }
  );


  S.renderer.xr.addEventListener(
    "sessionend",
    () => {

      console.log(
        "SURVIVAL VR: XR SESSION ENDED"
      );


      if (
        S.GAME?.state
      ) {

        S.GAME.state.inVR =
          false;

      }


      state.previousLeftTrigger =
        false;

      state.previousRightTrigger =
        false;

      state.previousLeftGrip =
        false;

      state.previousRightGrip =
        false;


      emit(
        "survival-vr-ended"
      );

    }
  );

}


/* ============================================================
   UPDATE
   ============================================================ */

function update(delta) {

  if (
    !state.initialized
  ) {
    return;
  }


  if (
    !S.renderer?.xr?.isPresenting
  ) {
    return;
  }


  updateMovement(
    delta
  );


  updateSnapTurn();


  updateButtons();

}


/* ============================================================
   SETUP
   ============================================================ */

function setupHands() {

  if (
    state.initialized
  ) {

    return state;

  }


  if (!S.renderer) {

    console.warn(
      "Survival VR hands: renderer unavailable."
    );

    return state;

  }


  if (!S.playerGroup) {

    console.warn(
      "Survival VR hands: player rig unavailable."
    );

    return state;

  }


  setupControllers();

  setupXREvents();


  state.initialized =
    true;


  /*
   * Register on SurvivalVR.
   */

  S.hands =
    state;

  S.updateHands =
    update;

  S.setupHands =
    setupHands;


  console.log(
    "SURVIVAL VR: hands + locomotion ready"
  );


  return state;

}


/* ============================================================
   INITIALIZE
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