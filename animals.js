import * as THREE from "three";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR must exist before animals.js loads.");
}

const state = {
  group: null,
  animals: [],
  initialized: false,
  nextId: 1,
  spawnTimer: 0
};

const ANIMAL_TYPES = {
  rabbit: {
    count: 14,
    scale: 0.75,
    speed: 1.15,
    health: 20,
    fleeDistance: 7,
    wanderDistance: 8,
    meat: 1
  },

  deer: {
    count: 5,
    scale: 1.35,
    speed: 1.45,
    health: 45,
    fleeDistance: 13,
    wanderDistance: 14,
    meat: 3
  },

  bird: {
    count: 10,
    scale: 0.45,
    speed: 2.0,
    health: 10,
    fleeDistance: 5,
    wanderDistance: 18,
    meat: 1
  }
};

/* ---------------------------------------------------------
   MATERIALS
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

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
     * Don't spawn inside the lake.
     */
    const dx = x - lakeX;
    const dz = z - lakeZ;

    if (
      Math.sqrt(dx * dx + dz * dz) <
      lakeRadius
    ) {
      continue;
    }

    /*
     * Don't spawn directly on the player.
     */
    const player =
      getPlayerPosition();

    const pdx =
      x - player.x;

    const pdz =
      z - player.z;

    if (
      Math.sqrt(
        pdx * pdx +
        pdz * pdz
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

/* ---------------------------------------------------------
   RABBIT
--------------------------------------------------------- */

function createRabbit() {
  const group = new THREE.Group();

  group.name = "Rabbit";

  /*
   * Body
   */
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

  body.position.y =
    0.40;

  body.castShadow = true;

  group.add(body);

  /*
   * Head
   */
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

  /*
   * Ears
   */
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

  /*
   * Eyes
   */
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

  /*
   * Tail
   */
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

  /*
   * Legs
   */
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

/* ---------------------------------------------------------
   DEER
--------------------------------------------------------- */

function createDeer() {
  const group = new THREE.Group();

  group.name = "Deer";

  /*
   * Body
   */
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

  body.position.y =
    1.05;

  body.castShadow = true;

  group.add(body);

  /*
   * Chest
   */
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

  /*
   * Neck
   */
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

  /*
   * Head
   */
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

  /*
   * Ears
   */
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

  /*
   * Eyes
   */
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

  /*
   * Legs
   */
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

  /*
   * Antlers
   */
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

/* ---------------------------------------------------------
   BIRD
--------------------------------------------------------- */

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

  body.castShadow = true;

  group.add(body);

  /*
   * Head
   */
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.13,
      10,
      8
    ),
    materials.birdBody
  );

  head.position.z =
    -0.16;

  group.add(head);

  /*
   * Beak
   */
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

  /*
   * Wings
   */
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

/* ---------------------------------------------------------
   ANIMAL CREATION
--------------------------------------------------------- */

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
    id: `animal_${state.nextId++}`,
    type,
    mesh,

    health: config.health,
    maxHealth: config.health,

    speed: config.speed,
    baseSpeed: config.speed,

    state: "wander",

    direction:
      Math.random() *
      Math.PI *
      2,

    targetDirection:
      Math.random() *
      Math.PI *
      2,

    targetX: spawn.x,
    targetZ: spawn.z,

    wanderTimer:
      randomRange(1, 4),

    idleTimer: 0,

    fleeTimer: 0,

    hitTimer: 0,

    age: Math.random() * 100,

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
    randomRange(0.92, 1.08);

  mesh.scale.setScalar(scale);

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

  state.animals.push(animal);

  return animal;
}

function spawnInitialAnimals() {
  /*
   * Remove old animals.
   */
  clearAnimals();

  /*
   * Rabbits.
   */
  for (
    let i = 0;
    i < ANIMAL_TYPES.rabbit.count;
    i++
  ) {
    createAnimal("rabbit");
  }

  /*
   * Deer.
   */
  for (
    let i = 0;
    i < ANIMAL_TYPES.deer.count;
    i++
  ) {
    createAnimal("deer");
  }

  /*
   * Birds.
   */
  for (
    let i = 0;
    i < ANIMAL_TYPES.bird.count;
    i++
  ) {
    createAnimal("bird");
  }

  updateGameAnimalState();
}

/* ---------------------------------------------------------
   WANDERING
--------------------------------------------------------- */

function chooseNewDestination(animal) {
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
    randomRange(2, 6);
}

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

  let targetX =
    animal.targetX;

  let targetZ =
    animal.targetZ;

  /*
   * Flee from player.
   */
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
    animal.state = "flee";

    animal.fleeTimer = 2.5;

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

    targetX =
      animal.targetX;

    targetZ =
      animal.targetZ;

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

  /*
   * Smooth turning.
   */
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

  /*
   * Move.
   */
  position.x +=
    normalizedX *
    animal.speed *
    delta;

  position.z +=
    normalizedZ *
    animal.speed *
    delta;

  /*
   * Stay on ground.
   */
  position.y =
    getGroundY(
      position.x,
      position.z
    );

  /*
   * Walking animation.
   */
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

/* ---------------------------------------------------------
   BIRD FLIGHT
--------------------------------------------------------- */

function updateBird(
  animal,
  delta
) {
  animal.age += delta;

  const position =
    animal.mesh.position;

  /*
   * Birds stay above the island.
   */
  const targetHeight =
    getGroundY(
      position.x,
      position.z
    ) +
    3.5;

  position.y +=
    (targetHeight -
      position.y) *
    Math.min(
      1,
      delta * 2
    );

  /*
   * Wing animation.
   */
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

  if (wings.length >= 3) {
    wings[2].rotation.z =
      flap;

    wings[3].rotation.z =
      -flap;
  }

  /*
   * Gentle flight movement.
   */
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

/* ---------------------------------------------------------
   HIT SYSTEM
--------------------------------------------------------- */

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
   * Immediately flee.
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
    (dx / length) * 12;

  animal.targetZ =
    animal.mesh.position.z +
    (dz / length) * 12;

  /*
   * Small non-graphic hit reaction.
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

  /*
   * Death.
   */
  if (
    animal.health <= 0
  ) {
    killAnimal(animal);
  }

  if (
    typeof S.gameEvent ===
    "function"
  ) {
    S.gameEvent(
      "animal-hit",
      {
        id: animal.id,
        type: animal.type,
        damage
      }
    );
  }

  return true;
}

function hitNearestAnimal(
  damage = 10
) {
  const animal =
    findNearestAnimal(3.2);

  if (!animal) {
    return false;
  }

  return hitAnimal(
    animal,
    damage
  );
}

/* ---------------------------------------------------------
   KILL
--------------------------------------------------------- */

function killAnimal(animal) {
  if (
    !animal ||
    animal.health > 0
  ) {
    return;
  }

  /*
   * Give player food.
   */
  const config =
    ANIMAL_TYPES[
      animal.type
    ];

  const meat =
    config.meat || 1;

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

  /*
   * Remove from scene.
   */
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

  if (index !== -1) {
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
        id: animal.id,
        type: animal.type,
        meat
      }
    );
  }
}

/* ---------------------------------------------------------
   ANIMATION
--------------------------------------------------------- */

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
}

/* ---------------------------------------------------------
   CLEAR / WORLD RESET
--------------------------------------------------------- */

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

  updateGameAnimalState();
}

function handleWorldGenerated() {
  if (!state.group) {
    return;
  }

  spawnInitialAnimals();
}

function handleNewWorld() {
  spawnInitialAnimals();
}

/* ---------------------------------------------------------
   GAME STATE
--------------------------------------------------------- */

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
          id: animal.id,
          health: animal.health,
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
          id: animal.id,
          health: animal.health,
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
          id: animal.id,
          x:
            animal.mesh.position.x,
          y:
            animal.mesh.position.y,
          z:
            animal.mesh.position.z
        })
      );
}

/* ---------------------------------------------------------
   SETUP
--------------------------------------------------------- */

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
   * Listen for new worlds.
   */
  if (
    typeof S.gameEvent ===
    "function"
  ) {
    window.addEventListener(
      "survival-world-generated",
      handleWorldGenerated
    );

    window.addEventListener(
      "survival-new-world-created",
      handleNewWorld
    );
  }

  /*
   * If the world already exists,
   * spawn animals immediately.
   */
  if (
    S.GAME?.state?.started ||
    S.worldData
  ) {
    spawnInitialAnimals();
  }

  console.log(
    "Animals system initialized."
  );
}

/* ---------------------------------------------------------
   EXPORTED API
--------------------------------------------------------- */

function getAnimals() {
  return state.animals;
}

function getAnimalCount() {
  return state.animals.length;
}

function getAnimalById(id) {
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

export {
  setupAnimals,
  update,
  clearAnimals,
  hitAnimal,
  hitNearestAnimal,
  damageNearestAnimal,
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
  findNearestAnimal,
  getAnimals,
  getAnimalCount,
  getAnimalById
};