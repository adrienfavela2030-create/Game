/* =========================================================
   HANDS.JS
   Island Survival VR hand/controller system
========================================================= */

const SurvivalVR = window.SurvivalVR;

if (!SurvivalVR) {
  throw new Error(
    "hands.js loaded before window.SurvivalVR was created."
  );
}

const THREE = SurvivalVR.THREE;

const hands = {
  left: null,
  right: null,

  leftController: null,
  rightController: null,

  leftGrip: null,
  rightGrip: null,

  leftHanded: null,
  rightHanded: null,

  initialized: false,

  grabbing: {
    left: false,
    right: false
  },

  trigger: {
    left: 0,
    right: 0
  },

  squeeze: {
    left: 0,
    right: 0
  },

  thumbstick: {
    leftX: 0,
    leftY: 0,
    rightX: 0,
    rightY: 0
  },

  lastButtonState: {
    left: {},
    right: {}
  },

  handOffset: {
    left: new THREE.Vector3(-0.25, -0.05, -0.35),
    right: new THREE.Vector3(0.25, -0.05, -0.35)
  }
};


/* =========================================================
   COLORS / MATERIALS
========================================================= */

const handMaterial = new THREE.MeshStandardMaterial({
  color: 0xd7a77c,
  roughness: 0.72,
  metalness: 0.02
});

const handDarkMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b6048,
  roughness: 0.8,
  metalness: 0
});


/* =========================================================
   CREATE SIMPLE VR HAND
========================================================= */

function createHand(side) {

  const group = new THREE.Group();

  group.name =
    side === "left"
      ? "VR_Left_Hand"
      : "VR_Right_Hand";

  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.075,
      16,
      12
    ),
    handMaterial
  );

  palm.scale.set(
    0.85,
    1,
    0.65
  );

  group.add(palm);


  /*
    Four fingers.

    These are intentionally simple so the game
    does not become too heavy on Quest 3S.
  */

  const fingerPositions = [
    -0.045,
    -0.015,
    0.015,
    0.045
  ];

  fingerPositions.forEach(
    (x, index) => {

      const finger = new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.014,
          0.065,
          5,
          8
        ),
        handMaterial
      );

      finger.position.set(
        x,
        0.065,
        0
      );

      finger.rotation.x =
        Math.PI / 2;

      finger.name =
        `Finger_${index}`;

      group.add(finger);
    }
  );


  /*
    Thumb
  */

  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      0.017,
      0.065,
      5,
      8
    ),
    handMaterial
  );

  thumb.position.set(
    side === "left"
      ? -0.065
      : 0.065,

    0.015,

    -0.025
  );

  thumb.rotation.z =
    side === "left"
      ? -0.65
      : 0.65;

  group.add(thumb);


  /*
    Small wrist piece.
  */

  const wrist = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.045,
      0.052,
      0.08,
      12
    ),
    handDarkMaterial
  );

  wrist.rotation.z =
    Math.PI / 2;

  wrist.position.y =
    -0.075;

  group.add(wrist);


  group.visible = false;

  return group;
}


/* =========================================================
   CONTROLLER GRIP VISUAL
========================================================= */

function createControllerGrip(side) {

  const group = new THREE.Group();

  group.name =
    side === "left"
      ? "Left_Controller"
      : "Right_Controller";


  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.025,
      0.032,
      0.13,
      10
    ),
    new THREE.MeshStandardMaterial({
      color: 0x222a25,
      roughness: 0.6
    })
  );

  handle.rotation.x =
    Math.PI / 2;

  group.add(handle);


  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.045,
      0.007,
      8,
      20
    ),
    new THREE.MeshStandardMaterial({
      color: 0x4b6655,
      roughness: 0.5
    })
  );

  ring.rotation.x =
    Math.PI / 2;

  group.add(ring);


  group.visible = false;

  return group;
}


/* =========================================================
   ATTACH HAND
========================================================= */

function attachHand(
  controller,
  side
) {

  if (!controller) {
    return null;
  }


  const hand =
    createHand(side);

  const grip =
    createControllerGrip(side);


  controller.add(hand);

  controller.add(grip);


  if (side === "left") {

    hands.left = hand;

    hands.leftGrip = grip;

    hands.leftController =
      controller;

  } else {

    hands.right = hand;

    hands.rightGrip = grip;

    hands.rightController =
      controller;
  }


  setupControllerEvents(
    controller,
    side
  );


  updateHandVisibility();

  return hand;
}


/* =========================================================
   SETUP GRIP
========================================================= */

function setupGrip(
  controller,
  side
) {

  if (!controller) {
    return;
  }


  const grip =
    createControllerGrip(side);

  controller.add(grip);


  if (side === "left") {
    hands.leftGrip = grip;
  } else {
    hands.rightGrip = grip;
  }
}


/* =========================================================
   CONTROLLER EVENTS
========================================================= */

function setupControllerEvents(
  controller,
  side
) {

  controller.addEventListener(
    "selectstart",
    () => {

      hands.grabbing[side] = true;

      emitGrab(
        side,
        true
      );

    }
  );


  controller.addEventListener(
    "selectend",
    () => {

      hands.grabbing[side] = false;

      emitGrab(
        side,
        false
      );

    }
  );


  controller.addEventListener(
    "squeezestart",
    () => {

      hands.squeeze[side] = 1;

      emitEvent(
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

      hands.squeeze[side] = 0;

      emitEvent(
        "survival-squeeze",
        {
          side,
          pressed: false
        }
      );

    }
  );


  controller.addEventListener(
    "connected",
    event => {

      const data =
        event.data || {};

      console.log(
        `[VR] ${side} controller connected:`,
        data
      );

      emitEvent(
        "survival-controller-connected",
        {
          side,
          data
        }
      );

    }
  );


  controller.addEventListener(
    "disconnected",
    () => {

      console.log(
        `[VR] ${side} controller disconnected`
      );

      emitEvent(
        "survival-controller-disconnected",
        {
          side
        }
      );

    }
  );
}


/* =========================================================
   GRAB EVENT
========================================================= */

function emitGrab(
  side,
  pressed
) {

  emitEvent(
    "survival-grab",
    {
      side,
      pressed,

      controller:
        side === "left"
          ? hands.leftController
          : hands.rightController,

      hand:
        side === "left"
          ? hands.left
          : hands.right
    }
  );
}


/* =========================================================
   GENERIC EVENT
========================================================= */

function emitEvent(
  name,
  detail = {}
) {

  window.dispatchEvent(
    new CustomEvent(
      name,
      {
        detail
      }
    )
  );
}


/* =========================================================
   UPDATE HAND
========================================================= */

function updateHand(
  side,
  delta = 0
) {

  const controller =
    side === "left"
      ? hands.leftController
      : hands.rightController;

  const hand =
    side === "left"
      ? hands.left
      : hands.right;


  if (!controller || !hand) {
    return;
  }


  /*
    The hand follows the Quest controller.

    Later, real Quest hand tracking can use
    this same system without changing the
    rest of the game.
  */

  if (hands.grabbing[side]) {

    hand.scale.lerp(
      new THREE.Vector3(
        0.88,
        0.88,
        0.88
      ),
      Math.min(
        1,
        delta * 12
      )
    );

  } else {

    hand.scale.lerp(
      new THREE.Vector3(
        1,
        1,
        1
      ),
      Math.min(
        1,
        delta * 12
      )
    );

  }
}


/* =========================================================
   UPDATE ALL HANDS
========================================================= */

function updateHands(
  delta
) {

  updateHand(
    "left",
    delta
  );

  updateHand(
    "right",
    delta
  );

  updateThumbsticks();
}


/* =========================================================
   THUMBSTICKS
========================================================= */

function updateThumbsticks() {

  const controllers = [
    {
      controller:
        hands.leftController,
      side: "left"
    },

    {
      controller:
        hands.rightController,
      side: "right"
    }
  ];


  controllers.forEach(
    ({ controller, side }) => {

      if (!controller ||
          !controller.gamepad) {

        return;
      }


      const axes =
        controller.gamepad.axes || [];


      const x =
        Number(axes[2] || 0);

      const y =
        Number(axes[3] || 0);


      if (side === "left") {

        hands.thumbstick.leftX = x;

        hands.thumbstick.leftY = y;

      } else {

        hands.thumbstick.rightX = x;

        hands.thumbstick.rightY = y;
      }
    }
  );
}


/* =========================================================
   BUTTON STATE
========================================================= */

function isButtonPressed(
  side,
  buttonIndex
) {

  const controller =
    side === "left"
      ? hands.leftController
      : hands.rightController;


  if (!controller ||
      !controller.gamepad) {

    return false;
  }


  const buttons =
    controller.gamepad.buttons || [];


  return Boolean(
    buttons[buttonIndex]?.pressed
  );
}


/* =========================================================
   MENU BUTTON
========================================================= */

function checkMenuButton() {

  const sides = [
    "left",
    "right"
  ];


  sides.forEach(
    side => {

      const pressed =
        isButtonPressed(
          side,
          3
        );


      const old =
        Boolean(
          hands.lastButtonState[
            side
          ].menu
        );


      if (pressed && !old) {

        emitEvent(
          "survival-menu-button",
          {
            side
          }
        );
      }


      hands.lastButtonState[
        side
      ].menu = pressed;

    }
  );
}


/* =========================================================
   TRIGGER
========================================================= */

function updateTriggers() {

  const sides = [
    "left",
    "right"
  ];


  sides.forEach(
    side => {

      const controller =
        side === "left"
          ? hands.leftController
          : hands.rightController;


      if (
        !controller ||
        !controller.gamepad
      ) {
        return;
      }


      const buttons =
        controller.gamepad.buttons || [];


      const trigger =
        buttons[0]?.value || 0;


      hands.trigger[side] =
        trigger;
    }
  );
}


/* =========================================================
   VISIBILITY
========================================================= */

function updateHandVisibility() {

  const inVR =
    Boolean(
      SurvivalVR.GAME?.state?.inVR
    );


  if (hands.left) {

    hands.left.visible =
      inVR;

  }


  if (hands.right) {

    hands.right.visible =
      inVR;

  }
}


/* =========================================================
   RECALIBRATION
========================================================= */

function recalibrate() {

  if (
    !SurvivalVR.playerGroup
  ) {
    return;
  }


  const player =
    SurvivalVR.playerGroup;


  player.rotation.y = 0;


  if (
    SurvivalVR.camera
  ) {

    const camera =
      SurvivalVR.camera;

    camera.rotation.set(
      0,
      0,
      0
    );

  }


  emitEvent(
    "survival-recalibrated"
  );
}


/* =========================================================
   VR STATE
========================================================= */

window.addEventListener(
  "survival-vr-state",
  event => {

    const inVR =
      Boolean(
        event.detail?.inVR
      );


    if (
      SurvivalVR.GAME?.state
    ) {

      SurvivalVR.GAME.state.inVR =
        inVR;
    }


    updateHandVisibility();

  }
);


/* =========================================================
   MENU BUTTON
========================================================= */

window.addEventListener(
  "survival-menu-button",
  event => {

    /*
      The settings/home system will listen
      for this event later.

      We intentionally don't open a menu
      here so hands.js stays independent.
    */

    console.log(
      "VR menu button:",
      event.detail?.side
    );

  }
);


/* =========================================================
   KEYBOARD TEST CONTROLS
========================================================= */

window.addEventListener(
  "keydown",
  event => {

    if (
      event.code === "KeyR" &&
      event.shiftKey
    ) {

      recalibrate();

    }

  }
);


/* =========================================================
   FRAME LOOP
========================================================= */

function update(
  delta = 0
) {

  updateHands(delta);

  updateTriggers();

  checkMenuButton();
}


/* =========================================================
   REGISTER SYSTEM
========================================================= */

SurvivalVR.hands = hands;

SurvivalVR.updateHands =
  update;

SurvivalVR.recalibrate =
  recalibrate;


/* =========================================================
   EXPORTS
========================================================= */

export {
  attachHand,
  setupGrip,
  updateHand,
  update,
  recalibrate,
  hands
};