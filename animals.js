import * as THREE from "three";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR must exist before animals.js loads.");
}

/* =========================================================
   STATE
========================================================= */

const state = {
  group: null,
  animals: [],
  initialized: false,
  nextId: 1,

  /*
   * Tracks the previous position of both hands.
   * This lets us detect a swing rather than requiring
   * a button press.
   */
  previousHands: {
    left: new THREE.Vector3(),
    right: new THREE.Vector3()
  },

  handVelocity: {
    left: new THREE.Vector3(),
    right: new THREE.Vector3()
  },

  handInitialized: {
    left: false,
    right: false
  },

  /*
   * Prevents one swing from hitting the same animal
   * repeatedly every frame.
   */
  recentHits: new Map(),

  lastUpdate: 0
};

/* =========================================================
   ANIMAL SETTINGS
========================================================= */

const ANIMAL_TYPES = {
  rabbit: {
    count: 14,
    scale: 0.75,
    speed: 1.15,
    health: 20,
    fleeDistance: 7,
    wanderDistance: 8,
    meat: 1,
    hitRadius: 0.75
  },

  deer: {
    count: 5,
    scale: 1.35,
    speed: 1.45,
    health: 45,
    fleeDistance: 13,
    wanderDistance: 14,
    meat: 3,
    hitRadius: 1.15
  },

  bird: {
    count: 10,
    scale: 0.45,
    speed: 2,
    health: 10,
    fleeDistance: 5,
    wanderDistance: 18,
    meat: 1,
    hitRadius: 0.65
  }
};

/* =========================================================
   ITEM HIT SETTINGS
========================================================= */

const ITEM_HIT_PROFILES = {

  /*
   * Starting rock.
   */
  rock: {
    damage: 10,
    range: 1.15,
    speedRequired: 1.15,
    cooldown: 0.35
  },

  /*
   * Basic stick.
   */
  stick: {
    damage: 7,
    range: 1.25,
    speedRequired: 1.0,
    cooldown: 0.3
  },

  /*
   * Stone tools.
   */
  stoneAxe: {
    damage: 28,
    range: 1.35,
    speedRequired: 0.85,
    cooldown: 0.4
  },

  stonePickaxe: {
    damage: 25,
    range: 1.35,
    speedRequired: 0.85,
    cooldown: 0.4
  },

  /*
   * Future tools/weapons can use this system
   * automatically if they are given a profile.
   */
  knife: {
    damage: 30,
    range: 1.25,
    speedRequired: 0.8,
    cooldown: 0.35
  },

  spear: {
    damage: 40,
    range: 1.8,
    speedRequired: 0.65,
    cooldown: 0.5
  },

  club: {
    damage: 24,
    range: 1.45,
    speedRequired: 0.8,
    cooldown: 0.4
  },

  /*
   * Unknown physical objects can still cause
   * a small hit.
   */
  default: {
    damage: 5,
    range: 1.0,
    speedRequired: 1.25,
    cooldown: 0.35
  }
};

/* =========================================================
   MATERIALS
========================================================= */

const materials = {

  rabbitBody: new THREE.MeshStandardMaterial({
    color: 0xb9b0a4,
    roughness: 0.9
  }),

  rabbitEar: new THREE.MeshStandardMaterial({
    color: 0xc9bdb0,
    roughness: 0.9
  }),

  rabbitEye: new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.3
  }),

  deerBody: new THREE.MeshStandardMaterial({
    color: 0x8b5a35,
    roughness: 0.9
  }),

  deerChest: new THREE.MeshStandardMaterial({
    color: 0x6e4429,
    roughness: 0.9
  }),

  deerAntler: new THREE.MeshStandardMaterial({
    color: 0x5a3924,
    roughness: 0.9
  }),

  birdBody: new THREE.MeshStandardMaterial({
    color: 0x46505b,
    roughness: 0.8
  }),

  birdWing: new THREE.MeshStandardMaterial({
    color: 0x2f3740,
    roughness: 0.8
  }),

  eye: new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.25
  })
};

/* =========================================================
   GENERAL HELPERS
========================================================= */

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;

  return Math.sqrt(
    dx * dx +
    dz * dz
  );
}

function getPlayerPosition() {
  if (S.playerRig) {
    return S.playerRig.position;
  }

  return new THREE.Vector3();
}

function getGroundY(x, z) {
  if (
    S.systems?.world &&
    typeof S.systems.world.getTerrainHeight ===
      "function"
  ) {
    const y =
      S.systems.world.getTerrainHeight(
        x,
        z
      );

    if (Number.isFinite(y)) {
      return y;
    }
  }

  return 0;
}

function randomIslandPosition(minDistance = 8) {
  const lakeX = 8;
  const lakeZ = -4;
  const lakeRadius = 25;

  const islandRadius = 57;

  for (let i = 0; i < 100; i++) {
    const angle =
      Math.random() *
      Math.PI *
      2;

    const radius =
      Math.sqrt(Math.random()) *
      islandRadius;

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    /*
     * Keep animals out of the lake.
     */
    const lakeDX =
      x - lakeX;

    const lakeDZ =
      z - lakeZ;

    if (
      Math.sqrt(
        lakeDX * lakeDX +
        lakeDZ * lakeDZ
      ) < lakeRadius
    ) {
      continue;
    }

    /*
     * Don't spawn directly beside player.
     */
    const player =
      getPlayerPosition();

    const playerDX =
      x - player.x;

    const playerDZ =
      z - player.z;

    if (
      Math.sqrt(
        playerDX * playerDX +
        playerDZ * playerDZ
      ) < minDistance
    ) {
      continue;
    }

    return {
      x,
      z
    };
  }

  return {
    x: randomRange(-35, 35),
    z: randomRange(-35, 35)
  };
}

/* =========================================================
   RABBIT
========================================================= */

function createRabbit() {
  const group = new THREE.Group();

  group.name = "Rabbit";

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.35,
      14,
      10
    ),
    materials.rabbitBody
  );

  body.scale.set(
    1.15,
    0.85,
    1.35
  );

  body.position.y = 0.40;
  body.castShadow = true;

  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.27,
      14,
      10
    ),
    materials.rabbitBody
  );

  head.position.set(
    0,
    0.60,
    -0.30
  );

  head.castShadow = true;

  group.add(head);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.07,
        0.25,
        4,
        8
      ),
      materials.rabbitEar
    );

    ear.position.set(
      side * 0.10,
      0.91,
      -0.30
    );

    ear.rotation.z =
      side * 0.10;

    ear.castShadow = true;

    group.add(ear);
  }

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.035,
        8,
        8
      ),
      materials.rabbitEye
    );

    eye.position.set(
      side * 0.12,
      0.66,
      -0.53
    );

    group.add(eye);
  }

  const tail = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.14,
      10,
      8
    ),
    materials.rabbitBody
  );

  tail.position.set(
    0,
    0.48,
    0.43
  );

  group.add(tail);

  for (const x of [-0.17, 0.17]) {
    for (const z of [-0.20, 0.20]) {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.06,
          0.18,
          4,
          8
        ),
        materials.rabbitBody
      );

      leg.position.set(
        x,
        0.20,
        z
      );

      leg.castShadow = true;

      group.add(leg);
    }
  }

  return group;
}

/* =========================================================
   DEER
========================================================= */

function createDeer() {
  const group = new THREE.Group();

  group.name = "Deer";

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.65,
      16,
      12
    ),
    materials.deerBody
  );

  body.scale.set(
    1.25,
    0.90,
    1.65
  );

  body.position.y = 1.05;
  body.castShadow = true;

  group.add(body);

  const chest = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.42,
      14,
      10
    ),
    materials.deerChest
  );

  chest.scale.set(
    0.85,
    1.15,
    0.85
  );

  chest.position.set(
    0,
    1.02,
    -0.62
  );

  chest.castShadow = true;

  group.add(chest);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.22,
      0.32,
      0.90,
      12
    ),
    materials.deerBody
  );

  neck.position.set(
    0,
    1.42,
    -0.55
  );

  neck.rotation.x =
    -0.25;

  neck.castShadow = true;

  group.add(neck);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.30,
      14,
      10
    ),
    materials.deerBody
  );

  head.scale.set(
    0.85,
    1,
    1.25
  );

  head.position.set(
    0,
    1.75,
    -0.78
  );

  head.castShadow = true;

  group.add(head);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(
        0.10,
        0.28,
        8
      ),
      materials.deerBody
    );

    ear.position.set(
      side * 0.20,
      1.92,
      -0.72
    );

    ear.rotation.z =
      side * 0.55;

    group.add(ear);
  }

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.04,
        8,
        8
      ),
      materials.eye
    );

    eye.position.set(
      side * 0.18,
      1.80,
      -1.03
    );

    group.add(eye);
  }

  const legPositions = [
    [-0.35, 0.58],
    [0.35, 0.58],
    [-0.35, -0.52],
    [0.35, -0.52]
  ];

  for (const [x, z] of legPositions) {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.075,
        0.75,
        5,
        8
      ),
      materials.deerBody
    );

    leg.position.set(
      x,
      0.53,
      z
    );

    leg.castShadow = true;

    group.add(leg);
  }

  for (const side of [-1, 1]) {
    const antler = new THREE.Group();

    antler.position.set(
      side * 0.15,
      1.96,
      -0.73
    );

    const main = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.025,
        0.035,
        0.35,
        7
      ),
      materials.deerAntler
    );

    main.rotation.z =
      side * 0.18;

    antler.add(main);

    for (let i = 0; i < 2; i++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.018,
          0.025,
          0.16,
          7
        ),
        materials.deerAntler
      );

      branch.position.y =
        -0.04 + i * 0.12;

      branch.rotation.z =
        side * 0.75;

      antler.add(branch);
    }

    group.add(antler);
  }

  return group;
}

/* =========================================================
   BIRD
========================================================= */

function createBird() {
  const group = new THREE.Group();

  group.name = "Bird";

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.18,
      12,
      8
    ),
    materials.birdBody
  );

  body.scale.set(
    1,
    0.75,
    1.35
  );

  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.13,
      10,
      8
    ),
    materials.birdBody
  );

  head.position.z = -0.16;

  group.add(head);

  const beakMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc88a32,
      roughness: 0.8
    });

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(
      0.05,
      0.16,
      6
    ),
    beakMaterial
  );

  beak.rotation.x =
    -Math.PI / 2;

  beak.position.set(
    0,
    0,
    -0.30
  );

  group.add(beak);

  const leftWing = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.20,
      10,
      8
    ),
    materials.birdWing
  );

  leftWing.scale.set(
    1.3,
    0.15,
    0.75
  );

  leftWing.position.set(
    -0.17,
    0,
    0
  );

  group.add(leftWing);

  const rightWing =
    leftWing.clone();

  rightWing.position.x =
    0.17;

  group.add(rightWing);

  return group;
}

/* =========================================================
   CREATE ANIMAL
========================================================= */

function createAnimal(type) {
  let mesh;

  if (type === "rabbit") {
    mesh = createRabbit();
  } else if (type === "deer") {
    mesh = createDeer();
  } else {
    mesh = createBird();
  }

  const config =
    ANIMAL_TYPES[type];

  const spawn =
    randomIslandPosition();

  const animal = {
    id:
      `animal_${state.nextId++}`,

    type,

    mesh,

    health:
      config.health,

    maxHealth:
      config.health,

    speed:
      config.speed,

    baseSpeed:
      config.speed,

    state: "wander",

    direction:
      Math.random() *
      Math.PI *
      2,

    targetDirection:
      Math.random() *
      Math.PI *
      2,

    targetX:
      spawn.x,

    targetZ:
      spawn.z,

    wanderTimer:
      randomRange(1, 4),

    fleeTimer: 0,

    hitTimer: 0,

    age:
      Math.random() * 100,

    wingPhase:
      Math.random() *
      Math.PI *
      2,

    stepPhase:
      Math.random() *
      Math.PI *
      2
  };

  const scale =
    config.scale *
    randomRange(
      0.92,
      1.08
    );

  mesh.scale.setScalar(
    scale
  );

  mesh.position.set(
    spawn.x,
    getGroundY(
      spawn.x,
      spawn.z
    ),
    spawn.z
  );

  mesh.rotation.y =
    animal.direction;

  state.group.add(mesh);

  state.animals.push(
    animal
  );

  return animal;
}

/* =========================================================
   SPAWN
========================================================= */

function spawnInitialAnimals() {
  clearAnimals();

  for (
    let i = 0;
    i < ANIMAL_TYPES.rabbit.count;
    i++
  ) {
    createAnimal(
      "rabbit"
    );
  }

  for (
    let i = 0;
    i < ANIMAL_TYPES.deer.count;
    i++
  ) {
    createAnimal(
      "deer"
    );
  }

  for (
    let i = 0;
    i < ANIMAL_TYPES.bird.count;
    i++
  ) {
    createAnimal(
      "bird"
    );
  }

  updateGameAnimalState();
}

/* =========================================================
   WANDER
========================================================= */

function chooseNewDestination(
  animal
) {
  const config =
    ANIMAL_TYPES[
      animal.type
    ];

  const angle =
    Math.random() *
    Math.PI *
    2;

  const distance =
    randomRange(
      4,
      config.wanderDistance
    );

  animal.targetX =
    animal.mesh.position.x +
    Math.cos(angle) *
    distance;

  animal.targetZ =
    animal.mesh.position.z +
    Math.sin(angle) *
    distance;

  animal.targetDirection =
    Math.atan2(
      animal.targetX -
        animal.mesh.position.x,
      animal.targetZ -
        animal.mesh.position.z
    );

  animal.wanderTimer =
    randomRange(
      2,
      6
    );
}

/* =========================================================
   ANIMAL MOVEMENT
========================================================= */

function moveAnimal(
  animal,
  delta
) {
  const config =
    ANIMAL_TYPES[
      animal.type
    ];

  const position =
    animal.mesh.position;

  const player =
    getPlayerPosition();

  const dx =
    position.x -
    player.x;

  const dz =
    position.z -
    player.z;

  const distance =
    Math.sqrt(
      dx * dx +
      dz * dz
    );

  if (
    animal.state !== "flee" &&
    distance <
      config.fleeDistance
  ) {
    animal.state =
      "flee";

    animal.fleeTimer =
      2.5;

    const length =
      Math.sqrt(
        dx * dx +
        dz * dz
      ) || 1;

    animal.targetX =
      position.x +
      (dx / length) *
      12;

    animal.targetZ =
      position.z +
      (dz / length) *
      12;
  }

  if (
    animal.state === "flee"
  ) {
    animal.fleeTimer -=
      delta;

    animal.speed =
      config.speed *
      2.2;

    if (
      animal.fleeTimer <= 0 &&
      distance >
        config.fleeDistance *
          1.5
    ) {
      animal.state =
        "wander";

      animal.speed =
        config.speed;

      chooseNewDestination(
        animal
      );
    }
  } else {
    animal.speed =
      config.speed;

    animal.wanderTimer -=
      delta;

    if (
      animal.wanderTimer <= 0
    ) {
      chooseNewDestination(
        animal
      );
    }
  }

  const targetX =
    animal.targetX;

  const targetZ =
    animal.targetZ;

  const directionX =
    targetX -
    position.x;

  const directionZ =
    targetZ -
    position.z;

  const length =
    Math.sqrt(
      directionX *
        directionX +
      directionZ *
        directionZ
    );

  if (
    length < 0.35
  ) {
    return;
  }

  const normalizedX =
    directionX /
    length;

  const normalizedZ =
    directionZ /
    length;

  const targetRotation =
    Math.atan2(
      normalizedX,
      normalizedZ
    );

  let rotationDifference =
    targetRotation -
    animal.mesh.rotation.y;

  while (
    rotationDifference >
    Math.PI
  ) {
    rotationDifference -=
      Math.PI * 2;
  }

  while (
    rotationDifference <
    -Math.PI
  ) {
    rotationDifference +=
      Math.PI * 2;
  }

  animal.mesh.rotation.y +=
    rotationDifference *
    Math.min(
      1,
      delta * 6
    );

  position.x +=
    normalizedX *
    animal.speed *
    delta;

  position.z +=
    normalizedZ *
    animal.speed *
    delta;

  position.y =
    getGroundY(
      position.x,
      position.z
    );

  animal.stepPhase +=
    delta *
    animal.speed *
    7;

  const bob =
    Math.sin(
      animal.stepPhase
    ) *
    0.018;

  if (
    animal.type === "rabbit"
  ) {
    animal.mesh.position.y +=
      Math.max(
        0,
        bob * 2
      );
  }

  if (
    animal.type === "deer"
  ) {
    animal.mesh.position.y +=
      bob;
  }
}

/* =========================================================
   BIRD MOVEMENT
========================================================= */

function updateBird(
  animal,
  delta
) {
  animal.age +=
    delta;

  const position =
    animal.mesh.position;

  const targetHeight =
    getGroundY(
      position.x,
      position.z
    ) + 3.5;

  position.y +=
    (targetHeight -
      position.y) *
    Math.min(
      1,
      delta * 2
    );

  animal.wingPhase +=
    delta * 12;

  const flap =
    Math.sin(
      animal.wingPhase
    ) *
    0.45;

  const wings =
    animal.mesh.children.filter(
      child =>
        child.isMesh
    );

  if (
    wings.length >= 4
  ) {
    wings[3].rotation.z =
      flap;

    wings[4].rotation.z =
      -flap;
  }

  animal.targetDirection +=
    Math.sin(
      animal.age * 0.35
    ) *
    delta *
    0.3;

  animal.mesh.position.x +=
    Math.sin(
      animal.targetDirection
    ) *
    animal.speed *
    delta;

  animal.mesh.position.z +=
    Math.cos(
      animal.targetDirection
    ) *
    animal.speed *
    delta;

  animal.mesh.rotation.y =
    animal.targetDirection;
}

/* =========================================================
   UNIVERSAL ITEM DETECTION
========================================================= */

/*
 * Gets the item currently being held.
 *
 * It checks:
 *
 * 1. GAME.hands
 * 2. GAME.equipment
 * 3. inventory side slots
 * 4. common hand-system APIs
 */
function getHeldItem(
  hand
) {
  const game =
    S.GAME;

  if (!game) {
    return null;
  }

  const side =
    hand === "left"
      ? "left"
      : "right";

  /*
   * Game hand state.
   */
  if (
    game.hands &&
    game.hands[side]
  ) {
    return normalizeHeldItem(
      game.hands[side]
    );
  }

  /*
   * Side storage/equipment.
   */
  if (
    game.equipment &&
    game.equipment[
      `${side}Side`
    ]
  ) {
    return normalizeHeldItem(
      game.equipment[
        `${side}Side`
      ]
    );
  }

  /*
   * Inventory module.
   */
  if (
    S.systems?.inventory
  ) {
    const inventory =
      S.systems.inventory;

    if (
      typeof inventory.getHeldItem ===
      "function"
    ) {
      const item =
        inventory.getHeldItem(
          side
        );

      if (item) {
        return normalizeHeldItem(
          item
        );
      }
    }

    if (
      typeof inventory.getSideItem ===
      "function"
    ) {
      const item =
        inventory.getSideItem(
          side
        );

      if (item) {
        return normalizeHeldItem(
          item
        );
      }
    }
  }

  return null;
}

function normalizeHeldItem(
  item
) {
  if (!item) {
    return null;
  }

  if (
    typeof item ===
    "string"
  ) {
    return {
      id: item,
      type: item,
      name: item
    };
  }

  return {
    id:
      item.id ||
      item.type ||
      item.name ||
      "unknown",

    type:
      item.type ||
      item.id ||
      item.name ||
      "unknown",

    name:
      item.name ||
      item.type ||
      item.id ||
      "Unknown Item"
  };
}

/*
 * Finds the actual 3D object representing
 * the held item.
 */
function findHeldObject(
  hand
) {
  const handGroup =
    hand === "left"
      ? S.hands?.left ||
        S.systems?.hands?.leftHand
      : S.hands?.right ||
        S.systems?.hands?.rightHand;

  if (
    !handGroup
  ) {
    return null;
  }

  let result = null;

  handGroup.traverse(
    object => {
      if (
        result ||
        !object.isMesh
      ) {
        return;
      }

      if (
        object.userData?.heldItem ||
        object.userData?.itemId ||
        object.userData?.item
      ) {
        result = object;
      }
    }
  );

  return result;
}

/*
 * Gets hand/controller world position.
 */
function getHandWorldPosition(
  hand
) {
  let object = null;

  if (
    hand === "left"
  ) {
    object =
      S.systems?.hands?.leftController ||
      S.hands?.left ||
      null;
  } else {
    object =
      S.systems?.hands?.rightController ||
      S.hands?.right ||
      null;
  }

  /*
   * Try the hand system API.
   */
  if (
    S.systems?.hands &&
    typeof S.systems.hands.getHands ===
      "function"
  ) {
    const hands =
      S.systems.hands.getHands();

    object =
      hand === "left"
        ? hands.left
        : hands.right;
  }

  if (
    object &&
    object.getWorldPosition
  ) {
    const position =
      new THREE.Vector3();

    object.getWorldPosition(
      position
    );

    return position;
  }

  /*
   * Fallback to camera/player position.
   */
  return getPlayerPosition().clone();
}

/* =========================================================
   UNIVERSAL HIT PROFILE
========================================================= */

function getHitProfile(
  item
) {
  if (!item) {
    /*
     * Empty hand.
     */
    return {
      damage: 3,
      range: 0.9,
      speedRequired: 1.8,
      cooldown: 0.45
    };
  }

  const type =
    item.type ||
    item.id ||
    "default";

  return (
    ITEM_HIT_PROFILES[type] ||
    ITEM_HIT_PROFILES.default
  );
}

/* =========================================================
   SWING DETECTION
========================================================= */

function updateHandVelocity(
  hand,
  delta
) {
  if (
    delta <= 0
  ) {
    return;
  }

  const position =
    getHandWorldPosition(
      hand
    );

  const previous =
    state.previousHands[
      hand
    ];

  const velocity =
    state.handVelocity[
      hand
    ];

  if (
    !state.handInitialized[
      hand
    ]
  ) {
    previous.copy(
      position
    );

    velocity.set(
      0,
      0,
      0
    );

    state.handInitialized[
      hand
    ] = true;

    return;
  }

  velocity
    .copy(position)
    .sub(previous)
    .multiplyScalar(
      1 / delta
    );

  /*
   * Limit extreme values caused by
   * tracking jumps.
   */
  const maxVelocity =
    12;

  if (
    velocity.length() >
    maxVelocity
  ) {
    velocity
      .normalize()
      .multiplyScalar(
        maxVelocity
      );
  }

  previous.copy(
    position
  );
}

/* =========================================================
   HIT COOLDOWN
========================================================= */

function hitKey(
  animal,
  hand
) {
  return (
    animal.id +
    ":" +
    hand
  );
}

function canHitAnimal(
  animal,
  hand,
  cooldown
) {
  const key =
    hitKey(
      animal,
      hand
    );

  const now =
    performance.now();

  const last =
    state.recentHits.get(
      key
    );

  if (
    last === undefined
  ) {
    return true;
  }

  return (
    now - last >
    cooldown * 1000
  );
}

function registerHit(
  animal,
  hand
) {
  state.recentHits.set(
    hitKey(
      animal,
      hand
    ),
    performance.now()
  );
}

/* =========================================================
   CHECK HAND / ITEM AGAINST ANIMALS
========================================================= */

function checkUniversalHit(
  hand,
  delta
) {
  const item =
    getHeldItem(
      hand
    );

  const profile =
    getHitProfile(
      item
    );

  const handPosition =
    getHandWorldPosition(
      hand
    );

  const velocity =
    state.handVelocity[
      hand
    ];

  const speed =
    velocity.length();

  /*
   * Require a real swing.
   */
  if (
    speed <
    profile.speedRequired
  ) {
    return;
  }

  /*
   * Check every animal.
   */
  for (
    const animal of [
      ...state.animals
    ]
  ) {
    if (
      animal.health <= 0
    ) {
      continue;
    }

    const animalPosition =
      animal.mesh.position;

    /*
     * Full 3D distance.
     */
    const distance =
      handPosition.distanceTo(
        animalPosition
      );

    const animalRadius =
      ANIMAL_TYPES[
        animal.type
      ].hitRadius;

    const totalRange =
      profile.range +
      animalRadius;

    if (
      distance >
      totalRange
    ) {
      continue;
    }

    if (
      !canHitAnimal(
        animal,
        hand,
        profile.cooldown
      )
    ) {
      continue;
    }

    /*
     * Register first so the same swing
     * doesn't hit repeatedly.
     */
    registerHit(
      animal,
      hand
    );

    hitAnimal(
      animal,
      profile.damage
    );

    /*
     * One swing can hit one nearby animal.
     */
    break;
  }
}

/* =========================================================
   DIRECT HIT API
========================================================= */

function hitAnimal(
  animal,
  damage = 10
) {
  if (
    !animal ||
    animal.health <= 0
  ) {
    return false;
  }

  animal.health -=
    damage;

  animal.hitTimer =
    0.25;

  /*
   * Make animal flee.
   */
  animal.state =
    "flee";

  animal.fleeTimer =
    2.5;

  const player =
    getPlayerPosition();

  const dx =
    animal.mesh.position.x -
    player.x;

  const dz =
    animal.mesh.position.z -
    player.z;

  const length =
    Math.sqrt(
      dx * dx +
      dz * dz
    ) || 1;

  animal.targetX =
    animal.mesh.position.x +
    (dx / length) *
    12;

  animal.targetZ =
    animal.mesh.position.z +
    (dz / length) *
    12;

  /*
   * Non-graphic hit reaction.
   */
  animal.mesh.scale.multiplyScalar(
    1.06
  );

  setTimeout(() => {
    if (
      animal.mesh &&
      animal.health > 0
    ) {
      animal.mesh.scale.multiplyScalar(
        1 / 1.06
      );
    }
  }, 100);

  if (
    animal.health <= 0
  ) {
    killAnimal(
      animal
    );
  }

  if (
    typeof S.gameEvent ===
    "function"
  ) {
    S.gameEvent(
      "animal-hit",
      {
        id:
          animal.id,

        type:
          animal.type,

        damage
      }
    );
  }

  return true;
}

function findNearestAnimal(
  maxDistance = 3
) {
  const player =
    getPlayerPosition();

  let closest = null;
  let closestDistance =
    maxDistance;

  for (
    const animal of state.animals
  ) {
    if (
      animal.health <= 0
    ) {
      continue;
    }

    const distance =
      distanceXZ(
        animal.mesh.position,
        player
      );

    if (
      distance <
      closestDistance
    ) {
      closest =
        animal;

      closestDistance =
        distance;
    }
  }

  return closest;
}

function hitNearestAnimal(
  damage = 10
) {
  const animal =
    findNearestAnimal(
      3.2
    );

  if (!animal) {
    return false;
  }

  return hitAnimal(
    animal,
    damage
  );
}

/* =========================================================
   KILL ANIMAL
========================================================= */

function killAnimal(
  animal
) {
  if (
    !animal ||
    animal.health > 0
  ) {
    return;
  }

  const config =
    ANIMAL_TYPES[
      animal.type
    ];

  const meat =
    config.meat || 1;

  /*
   * Give raw meat.
   */
  if (
    typeof S.addItem ===
    "function"
  ) {
    S.addItem(
      "rawMeat",
      meat
    );
  } else if (
    S.GAME?.inventory
  ) {
    S.GAME.inventory.rawMeat =
      (S.GAME.inventory.rawMeat || 0) +
      meat;
  }

  if (
    animal.mesh.parent
  ) {
    animal.mesh.parent.remove(
      animal.mesh
    );
  }

  const index =
    state.animals.indexOf(
      animal
    );

  if (
    index !== -1
  ) {
    state.animals.splice(
      index,
      1
    );
  }

  updateGameAnimalState();

  if (
    typeof S.gameEvent ===
    "function"
  ) {
    S.gameEvent(
      "animal-killed",
      {
        id:
          animal.id,

        type:
          animal.type,

        meat
      }
    );
  }
}

/* =========================================================
   MAIN UPDATE
========================================================= */

function update(
  delta = 0.016
) {
  if (
    !state.initialized
  ) {
    return;
  }

  if (
    !S.GAME?.state?.started
  ) {
    return;
  }

  /*
   * Update hand movement first.
   */
  updateHandVelocity(
    "left",
    delta
  );

  updateHandVelocity(
    "right",
    delta
  );

  /*
   * Universal item / hand attacks.
   */
  checkUniversalHit(
    "left",
    delta
  );

  checkUniversalHit(
    "right",
    delta
  );

  /*
   * Move animals.
   */
  for (
    const animal of [
      ...state.animals
    ]
  ) {
    if (
      !animal.mesh.parent
    ) {
      continue;
    }

    if (
      animal.hitTimer > 0
    ) {
      animal.hitTimer -=
        delta;
    }

    if (
      animal.type === "bird"
    ) {
      updateBird(
        animal,
        delta
      );
    } else {
      moveAnimal(
        animal,
        delta
      );
    }
  }

  updateGameAnimalState();

  state.lastUpdate =
    performance.now();
}

/* =========================================================
   CLEAR ANIMALS
========================================================= */

function clearAnimals() {
  for (
    const animal of state.animals
  ) {
    if (
      animal.mesh?.parent
    ) {
      animal.mesh.parent.remove(
        animal.mesh
      );
    }
  }

  state.animals.length = 0;

  state.recentHits.clear();

  state.handInitialized.left =
    false;

  state.handInitialized.right =
    false;

  updateGameAnimalState();
}

/* =========================================================
   WORLD EVENTS
========================================================= */

function handleWorldGenerated() {
  if (
    !state.group
  ) {
    return;
  }

  spawnInitialAnimals();
}

function handleNewWorld() {
  spawnInitialAnimals();
}

/* =========================================================
   GAME STATE
========================================================= */

function updateGameAnimalState() {
  if (
    !S.GAME ||
    !S.GAME.animals
  ) {
    return;
  }

  S.GAME.animals.total =
    state.animals.length;

  S.GAME.animals.rabbits =
    state.animals
      .filter(
        animal =>
          animal.type ===
          "rabbit"
      )
      .map(
        animal => ({
          id:
            animal.id,

          health:
            animal.health,

          x:
            animal.mesh.position.x,

          y:
            animal.mesh.position.y,

          z:
            animal.mesh.position.z
        })
      );

  S.GAME.animals.deer =
    state.animals
      .filter(
        animal =>
          animal.type ===
          "deer"
      )
      .map(
        animal => ({
          id:
            animal.id,

          health:
            animal.health,

          x:
            animal.mesh.position.x,

          y:
            animal.mesh.position.y,

          z:
            animal.mesh.position.z
        })
      );

  S.GAME.animals.birds =
    state.animals
      .filter(
        animal =>
          animal.type ===
          "bird"
      )
      .map(
        animal => ({
          id:
            animal.id,

          x:
            animal.mesh.position.x,

          y:
            animal.mesh.position.y,

          z:
            animal.mesh.position.z
        })
      );
}

/* =========================================================
   SETUP
========================================================= */

function setupAnimals() {
  if (
    state.initialized
  ) {
    return;
  }

  state.initialized =
    true;

  state.group =
    new THREE.Group();

  state.group.name =
    "Animals";

  S.scene.add(
    state.group
  );

  /*
   * World events.
   */
  window.addEventListener(
    "survival-world-generated",
    handleWorldGenerated
  );

  window.addEventListener(
    "survival-new-world-created",
    handleNewWorld
  );

  /*
   * Spawn if world already exists.
   */
  if (
    S.GAME?.state?.started ||
    S.worldData
  ) {
    spawnInitialAnimals();
  }

  console.log(
    "Universal animal system initialized."
  );
}

/* =========================================================
   EXTRA API
========================================================= */

function getAnimals() {
  return state.animals;
}

function getAnimalCount() {
  return state.animals.length;
}

function getAnimalById(
  id
) {
  return (
    state.animals.find(
      animal =>
        animal.id === id
    ) || null
  );
}

function damageNearestAnimal(
  damage = 10
) {
  return hitNearestAnimal(
    damage
  );
}

/*
 * Allows another system to directly tell the
 * animal system what item is being swung.
 *
 * This is useful later when crafting weapons.
 */
function registerItemHit(
  hand,
  itemType,
  position,
  velocity
) {
  if (
    !position ||
    !velocity
  ) {
    return false;
  }

  const profile =
    ITEM_HIT_PROFILES[
      itemType
    ] ||
    ITEM_HIT_PROFILES.default;

  if (
    velocity.length() <
    profile.speedRequired
  ) {
    return false;
  }

  const temporaryPosition =
    new THREE.Vector3(
      position.x,
      position.y,
      position.z
    );

  for (
    const animal of [
      ...state.animals
    ]
  ) {
    if (
      animal.health <= 0
    ) {
      continue;
    }

    const distance =
      temporaryPosition.distanceTo(
        animal.mesh.position
      );

    const animalRadius =
      ANIMAL_TYPES[
        animal.type
      ].hitRadius;

    if (
      distance >
      profile.range +
      animalRadius
    ) {
      continue;
    }

    if (
      !canHitAnimal(
        animal,
        hand,
        profile.cooldown
      )
    ) {
      continue;
    }

    registerHit(
      animal,
      hand
    );

    return hitAnimal(
      animal,
      profile.damage
    );
  }

  return false;
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  setupAnimals,
  update,
  clearAnimals,

  hitAnimal,
  hitNearestAnimal,
  damageNearestAnimal,

  registerItemHit,

  findNearestAnimal,

  getAnimals,
  getAnimalCount,
  getAnimalById
};

export default {
  setupAnimals,
  update,
  clearAnimals,

  hitAnimal,
  hitNearestAnimal,
  damageNearestAnimal,

  registerItemHit,

  findNearestAnimal,

  getAnimals,
  getAnimalCount,
  getAnimalById
};