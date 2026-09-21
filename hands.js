import * as THREE from "three";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR has not been initialized.");
}

const state = {
  ready: false,

  leftController: null,
  rightController: null,

  leftGrip: null,
  rightGrip: null,

  leftHand: null,
  rightHand: null,

  leftSource: null,
  rightSource: null,

  moveSpeed: 2.4,
  sprintSpeed: 4.0,

  deadzone: 0.12,

  snapAngle: Math.PI / 6,
  lastSnap: 0,
  snapDelay: 300,

  lastTime: 0
};


/* ============================================================
   EVENT
============================================================ */

function emit(name, detail = {}) {

  window.dispatchEvent(
    new CustomEvent(name, {
      detail
    })
  );

}


/* ============================================================
   HAND
============================================================ */

function createHand(side) {

  const hand =
    new THREE.Group();

  hand.name =
    `${side}-hand`;


  const material =
    new THREE.MeshStandardMaterial({
      color: 0xd39a75,
      roughness: 0.8,
      metalness: 0
    });


  const palm =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.065,
        12,
        8
      ),
      material
    );


  palm.scale.set(
    1,
    1.15,
    0.7
  );


  hand.add(palm);


  const fingerGeometry =
    new THREE.CapsuleGeometry(
      0.014,
      0.06,
      4,
      6
    );


  const positions = [
    -0.045,
    -0.015,
    0.015,
    0.045
  ];


  for (const x of positions) {

    const finger =
      new THREE.Mesh(
        fingerGeometry,
        material
      );

    finger.position.set(
      x,
      0.07,
      -0.015
    );

    hand.add(finger);

  }


  const thumb =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.016,
        0.06,
        4,
        6
      ),
      material
    );


  thumb.position.set(
    side === "left"
      ? -0.065
      : 0.065,
    0.005,
    -0.015
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

function applyDeadzone(value) {

  const amount =
    Math.abs(value);

  if (
    amount <=
    state.deadzone
  ) {

    return 0;

  }


  const normalized =
    (
      amount -
      state.deadzone
    ) /
    (
      1 -
      state.deadzone
    );


  return (
    Math.sign(value) *
    Math.min(
      normalized,
      1
    )
  );

}


/* ============================================================
   FIND XR INPUT
============================================================ */

function refreshInputSources() {

  state.leftSource = null;
  state.rightSource = null;


  const session =
    S.renderer?.xr?.getSession();


  if (!session) {
    return;
  }


  for (
    const source of
    session.inputSources
  ) {

    if (
      !source.gamepad
    ) {
      continue;
    }


    if (
      source.handedness ===
      "left"
    ) {

      state.leftSource =
        source;

    }


    if (
      source.handedness ===
      "right"
    ) {

      state.rightSource =
        source;

    }

  }

}


/* ============================================================
   THUMBSTICK
============================================================ */

function readStick(source) {

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
   * Quest controllers commonly expose the
   * primary thumbstick on axes 2/3.
   */

  let x =
    axes[2] ?? 0;

  let y =
    axes[3] ?? 0;


  /*
   * Some WebXR implementations expose
   * the primary pair at 0/1.
   */

  if (
    Math.abs(x) < 0.001 &&
    Math.abs(y) < 0.001
  ) {

    x =
      axes[0] ?? 0;

    y =
      axes[1] ?? 0;

  }


  return {
    x: applyDeadzone(x),
    y: applyDeadzone(y)
  };

}


/* ============================================================
   GROUND
============================================================ */

function keepPlayerOnGround() {

  if (
    !S.playerRig
  ) {

    return;

  }


  let groundY = 0;


  const world =
    S.systems?.world;


  if (
    world &&
    typeof world.getTerrainHeight ===
      "function"
  ) {

    try {

      const result =
        world.getTerrainHeight(
          S.playerRig.position.x,
          S.playerRig.position.z
        );


      if (
        Number.isFinite(result)
      ) {

        groundY =
          result;

      }

    } catch {

      groundY = 0;

    }

  }


  S.playerRig.position.y =
    groundY;

}


/* ============================================================
   MOVEMENT
============================================================ */

function movePlayer(delta) {

  if (
    !S.renderer?.xr?.isPresenting
  ) {

    return;

  }


  if (
    !S.playerRig
  ) {

    return;

  }


  const stick =
    readStick(
      state.leftSource
    );


  if (
    Math.abs(stick.x) < 0.001 &&
    Math.abs(stick.y) < 0.001
  ) {

    return;

  }


  /*
   * IMPORTANT:
   *
   * Use the XR camera's actual horizontal
   * direction.
   */

  const forward =
    new THREE.Vector3();


  S.camera.getWorldDirection(
    forward
  );


  forward.y = 0;


  if (
    forward.lengthSq() <
    0.000001
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


  const movement =
    new THREE.Vector3();


  movement.addScaledVector(
    forward,
    -stick.y
  );


  movement.addScaledVector(
    right,
    stick.x
  );


  if (
    movement.lengthSq() <
    0.000001
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
    speed *
    delta;


  /*
   * MOVE THE PLAYER RIG,
   * NOT THE CAMERA.
   */

  S.playerRig.position.x +=
    movement.x *
    distance;


  S.playerRig.position.z +=
    movement.z *
    distance;


  keepPlayerOnGround();


  /*
   * Synchronize game state.
   */

  if (
    S.GAME?.position
  ) {

    S.GAME.position.x =
      S.playerRig.position.x;

    S.GAME.position.y =
      S.playerRig.position.y;

    S.GAME.position.z =
      S.playerRig.position.z;

  }


  emit(
    "survival-player-moved",
    {
      x:
        S.playerRig.position.x,

      y:
        S.playerRig.position.y,

      z:
        S.playerRig.position.z
    }
  );

}


/* ============================================================
   SNAP TURN
============================================================ */

function snapTurn() {

  if (
    !S.renderer?.xr?.isPresenting
  ) {

    return;

  }


  if (
    !S.playerRig
  ) {

    return;

  }


  const stick =
    readStick(
      state.rightSource
    );


  if (
    Math.abs(stick.x) <
    0.6
  ) {

    return;

  }


  const now =
    performance.now();


  if (
    now -
    state.lastSnap <
    state.snapDelay
  ) {

    return;

  }


  const direction =
    stick.x > 0
      ? -1
      : 1;


  S.playerRig.rotation.y +=
    direction *
    state.snapAngle;


  state.lastSnap =
    now;


  emit(
    "survival-snap-turn",
    {
      degrees:
        direction * 30
    }
  );

}


/* ============================================================
   CONTROLLER BUTTONS
============================================================ */

function controllerButtons() {

  const left =
    state.leftSource?.gamepad;

  const right =
    state.rightSource?.gamepad;


  if (left) {

    const trigger =
      !!left.buttons[0]?.pressed;


    const grip =
      !!left.buttons[1]?.pressed;


    if (
      trigger
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
      grip
    ) {

      emit(
        "survival-squeeze",
        {
          side: "left",
          pressed: true
        }
      );

    }

  }


  if (right) {

    const trigger =
      !!right.buttons[0]?.pressed;


    const grip =
      !!right.buttons[1]?.pressed;


    if (
      trigger
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
      grip
    ) {

      emit(
        "survival-squeeze",
        {
          side: "right",
          pressed: true
        }
      );

    }

  }

}


/* ============================================================
   SETUP CONTROLLERS
============================================================ */

function setupControllers() {

  const xr =
    S.renderer.xr;


  state.leftController =
    xr.getController(0);


  state.rightController =
    xr.getController(1);


  state.leftGrip =
    xr.getControllerGrip(0);


  state.rightGrip =
    xr.getControllerGrip(1);


  state.leftHand =
    createHand(
      "left"
    );


  state.rightHand =
    createHand(
      "right"
    );


  /*
   * Hand model belongs to the actual XR
   * controller target-ray space.
   */

  state.leftController.add(
    state.leftHand
  );


  state.rightController.add(
    state.rightHand
  );


  /*
   * IMPORTANT:
   *
   * The controller spaces are children of
   * the player rig.
   */

  S.playerRig.add(
    state.leftController
  );


  S.playerRig.add(
    state.rightController
  );


  /*
   * Grip spaces are also children of the rig.
   */

  S.playerRig.add(
    state.leftGrip
  );


  S.playerRig.add(
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

}


/* ============================================================
   XR EVENTS
============================================================ */

function setupXR() {

  S.renderer.xr.addEventListener(
    "sessionstart",
    () => {

      console.log(
        "SURVIVAL VR: SESSION STARTED"
      );


      refreshInputSources();


      keepPlayerOnGround();


      if (
        S.GAME?.state
      ) {

        S.GAME.state.inVR =
          true;

      }


      emit(
        "survival-vr-started"
      );

    }
  );


  S.renderer.xr.addEventListener(
    "sessionend",
    () => {

      console.log(
        "SURVIVAL VR: SESSION ENDED"
      );


      if (
        S.GAME?.state
      ) {

        S.GAME.state.inVR =
          false;

      }


      state.leftSource =
        null;

      state.rightSource =
        null;

    }
  );

}


/* ============================================================
   MAIN UPDATE
============================================================ */

function update(delta) {

  if (
    !state.ready
  ) {

    return;

  }


  if (
    !S.renderer.xr.isPresenting
  ) {

    return;

  }


  refreshInputSources();


  movePlayer(delta);


  snapTurn();


  controllerButtons();

}


/* ============================================================
   INITIALIZATION
============================================================ */

function setupHands() {

  if (
    state.ready
  ) {

    return state;

  }


  if (
    !S.renderer
  ) {

    console.error(
      "SURVIVAL VR: renderer missing."
    );

    return state;

  }


  /*
   * Create the player rig if the main game
   * did not create one.
   */

  if (
    !S.playerRig
  ) {

    S.playerRig =
      new THREE.Group();

    S.playerRig.name =
      "VR_PLAYER_RIG";


    S.scene.add(
      S.playerRig
    );


    /*
     * Put the existing camera inside the rig.
     */

    if (
      S.camera.parent !==
      S.playerRig
    ) {

      S.playerRig.add(
        S.camera
      );

    }

  }


  setupControllers();


  setupXR();


  state.ready =
    true;


  S.hands =
    state;

  S.updateHands =
    update;

  S.setupHands =
    setupHands;


  console.log(
    "SURVIVAL VR: PLAYER RIG READY"
  );


  return state;

}


/* ============================================================
   START
============================================================ */

setupHands();


export {
  setupHands,
  update
};


export const updateHands =
  update;


export default state;