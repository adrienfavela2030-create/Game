const {
  THREE,
  GAME,
  gameEvent,
  addItem
} = window.SurvivalVR;

// ============================================================
// SURVIVAL VR — ANIMALS SYSTEM
// ============================================================

const animalState = {
  initialized: false,
  animals: [],
  nextId: 1,
  spawnTimer: 0,
  birdTimer: 0,
  maxAnimals: 18,
  maxRabbits: 8,
  maxDeer: 5,
  maxBirds: 12,
  spawnRadius: 23,
  despawnRadius: 48,
  playerDetectionRadius: 7,
  attackDistance: 2.2
};

// ============================================================
// ANIMAL DEFINITIONS
// ============================================================

const ANIMAL_TYPES = {
  rabbit: {
    name: "Rabbit",
    speed: 1.4,
    runSpeed: 3.2,
    health: 20,
    size: 0.65,
    food: 1,
    meat: 1,
    color: 0x8c8175,
    secondaryColor: 0xd8c9b8
  },

  deer: {
    name: "Deer",
    speed: 1.15,
    runSpeed: 4.8,
    health: 45,
    size: 1.15,
    food: 2,
    meat: 3,
    color: 0x8b5e3c,
    secondaryColor: 0xd2aa7b
  },

  bird: {
    name: "Bird",
    speed: 3.5,
    runSpeed: 5,
    health: 8,
    size: 0.35,
    food: 0,
    meat: 0,
    color: 0x38434b,
    secondaryColor: 0xe6e6df
  }
};

// ============================================================
// HELPERS
// ============================================================

function getScene() {
  return window.SurvivalVR.scene;
}

function getPlayerPosition() {
  const player =
    window.SurvivalVR.playerGroup;

  if (!player) {
    return new THREE.Vector3();
  }

  return player.position;
}

function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;

  return Math.sqrt(
    dx * dx +
    dz * dz
  );
}

function randomDirection() {
  return Math.random() * Math.PI * 2;
}

function randomPosition() {
  const world =
    window.SurvivalVR.worldData;

  const radius =
    Math.min(
      animalState.spawnRadius,
      (world?.islandRadius || 27) - 3
    );

  const angle =
    randomDirection();

  const distance =
    4 +
    Math.random() *
      Math.max(1, radius - 4);

  const x =
    Math.cos(angle) *
    distance;

  const z =
    Math.sin(angle) *
    distance;

  return new THREE.Vector3(
    x,
    0,
    z
  );
}

function isValidLandPosition(position) {
  const world =
    window.SurvivalVR.worldData;

  if (!world) {
    return true;
  }

  const distance =
    Math.sqrt(
      position.x * position.x +
      position.z * position.z
    );

  if (
    distance >
    world.islandRadius - 2
  ) {
    return false;
  }

  const lake =
    world.lake;

  if (lake) {
    const dx =
      position.x - lake.x;

    const dz =
      position.z - lake.z;

    const lakeDistance =
      Math.sqrt(
        dx * dx +
        dz * dz
      );

    if (
      lakeDistance <
      lake.radius + 1
    ) {
      return false;
    }
  }

  return true;
}

function getTerrainY(
  x,
  z
) {
  if (
    window.SurvivalVR.world &&
    typeof window.SurvivalVR.world
      .getTerrainHeight ===
      "function"
  ) {
    return window.SurvivalVR.world
      .getTerrainHeight(
        x,
        z
      );
  }

  return 0;
}

// ============================================================
// MATERIAL HELPERS
// ============================================================

function material(
  color
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82
  });
}

// ============================================================
// RABBIT MODEL
// ============================================================

function createRabbitMesh() {
  const group =
    new THREE.Group();

  group.name =
    "Rabbit";

  const body =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.42,
        12,
        8
      ),
      material(
        ANIMAL_TYPES.rabbit.color
      )
    );

  body.scale.set(
    1.15,
    0.9,
    1.45
  );

  body.position.y =
    0.48;

  group.add(body);

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.29,
        12,
        8
      ),
      material(
        ANIMAL_TYPES.rabbit.secondaryColor
      )
    );

  head.position.set(
    0,
    0.73,
    0.46
  );

  group.add(head);

  for (
    const x of [-0.12, 0.12]
  ) {
    const ear =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.065,
          0.32,
          4,
          8
        ),
        material(
          ANIMAL_TYPES.rabbit.secondaryColor
        )
      );

    ear.position.set(
      x,
      1.08,
      0.43
    );

    group.add(ear);
  }

  for (
    const x of [-0.2, 0.2]
  ) {
    const eye =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.035,
          8,
          8
        ),
        material(0x111111)
      );

    eye.position.set(
      x,
      0.77,
      0.71
    );

    group.add(eye);
  }

  const tail =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.16,
        10,
        8
      ),
      material(0xf1e6d9)
    );

  tail.position.set(
    0,
    0.55,
    -0.58
  );

  group.add(tail);

  return group;
}

// ============================================================
// DEER MODEL
// ============================================================

function createDeerMesh() {
  const group =
    new THREE.Group();

  group.name =
    "Deer";

  const body =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.62,
        14,
        10
      ),
      material(
        ANIMAL_TYPES.deer.color
      )
    );

  body.scale.set(
    1.05,
    0.95,
    1.65
  );

  body.position.y =
    1.05;

  group.add(body);

  const neck =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.22,
        0.32,
        1.05,
        10
      ),
      material(
        ANIMAL_TYPES.deer.color
      )
    );

  neck.position.set(
    0,
    1.55,
    0.45
  );

  neck.rotation.x =
    -0.35;

  group.add(neck);

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.32,
        12,
        8
      ),
      material(
        ANIMAL_TYPES.deer.secondaryColor
      )
    );

  head.position.set(
    0,
    1.9,
    0.78
  );

  group.add(head);

  const snout =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.18,
        10,
        8
      ),
      material(0x59463a)
    );

  snout.position.set(
    0,
    1.84,
    1.04
  );

  group.add(snout);

  for (
    const x of [-0.18, 0.18]
  ) {
    const leg =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.075,
          0.095,
          0.85,
          8
        ),
        material(
          ANIMAL_TYPES.deer.color
        )
      );

    leg.position.set(
      x,
      0.52,
      x < 0 ? 0.32 : -0.32
    );

    group.add(leg);
  }

  for (
    const x of [-0.13, 0.13]
  ) {
    const eye =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.04,
          8,
          8
        ),
        material(0x111111)
      );

    eye.position.set(
      x,
      1.98,
      0.94
    );

    group.add(eye);
  }

  return group;
}

// ============================================================
// BIRD MODEL
// ============================================================

function createBirdMesh() {
  const group =
    new THREE.Group();

  group.name =
    "Bird";

  const body =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.2,
        10,
        8
      ),
      material(
        ANIMAL_TYPES.bird.color
      )
    );

  body.scale.set(
    0.8,
    0.8,
    1.3
  );

  group.add(body);

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.15,
        10,
        8
      ),
      material(
        ANIMAL_TYPES.bird.secondaryColor
      )
    );

  head.position.z =
    0.2;

  group.add(head);

  const wingMaterial =
    material(
      ANIMAL_TYPES.bird.color
    );

  for (
    const side of [-1, 1]
  ) {
    const wing =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.55,
          0.06,
          0.25
        ),
        wingMaterial
      );

    wing.position.set(
      side * 0.3,
      0,
      0
    );

    wing.rotation.z =
      side * 0.25;

    wing.userData.isWing =
      true;

    group.add(wing);
  }

  return group;
}

// ============================================================
// CREATE ANIMAL
// ============================================================

function createAnimal(
  type,
  position
) {
  const definition =
    ANIMAL_TYPES[type];

  if (!definition) {
    return null;
  }

  const mesh =
    type === "rabbit"
      ? createRabbitMesh()
      : type === "deer"
        ? createDeerMesh()
        : createBirdMesh();

  mesh.position.copy(
    position
  );

  mesh.position.y +=
    getTerrainY(
      position.x,
      position.z
    );

  mesh.rotation.y =
    randomDirection();

  mesh.scale.setScalar(
    definition.size
  );

  const animal = {
    id:
      animalState.nextId++,

    type,

    name:
      definition.name,

    mesh,

    health:
      definition.health,

    maxHealth:
      definition.health,

    speed:
      definition.speed,

    runSpeed:
      definition.runSpeed,

    state:
      "wandering",

    direction:
      mesh.rotation.y,

    targetDirection:
      mesh.rotation.y,

    stateTimer:
      1 +
      Math.random() * 4,

    animationTime:
      Math.random() * 10,

    detectionTimer:
      0,

    fleeTimer:
      0,

    attackTimer:
      0,

    alive:
      true,

    discovered:
      false,

    userData: {}
  };

  mesh.userData.animal =
    animal;

  mesh.userData.isAnimal =
    true;

  getScene().add(
    mesh
  );

  animalState.animals.push(
    animal
  );

  if (
    GAME.animals
  ) {
    GAME.animals.total =
      animalState.animals.length;
  }

  return animal;
}

// ============================================================
// SPAWN
// ============================================================

function countType(
  type
) {
  return animalState.animals
    .filter(
      animal =>
        animal.alive &&
        animal.type === type
    )
    .length;
}

function canSpawnType(
  type
) {
  if (
    animalState.animals.length >=
    animalState.maxAnimals
  ) {
    return false;
  }

  if (
    type === "rabbit"
  ) {
    return (
      countType("rabbit") <
      animalState.maxRabbits
    );
  }

  if (
    type === "deer"
  ) {
    return (
      countType("deer") <
      animalState.maxDeer
    );
  }

  if (
    type === "bird"
  ) {
    return (
      countType("bird") <
      animalState.maxBirds
    );
  }

  return false;
}

function spawnAnimal(
  type,
  position = null
) {
  if (
    !canSpawnType(type)
  ) {
    return null;
  }

  let spawnPosition =
    position;

  if (!spawnPosition) {
    for (
      let attempt = 0;
      attempt < 15;
      attempt++
    ) {
      const candidate =
        randomPosition();

      if (
        isValidLandPosition(
          candidate
        )
      ) {
        spawnPosition =
          candidate;

        break;
      }
    }
  }

  if (!spawnPosition) {
    return null;
  }

  return createAnimal(
    type,
    spawnPosition
  );
}

function spawnInitialAnimals() {
  for (
    let i = 0;
    i < 5;
    i++
  ) {
    spawnAnimal(
      "rabbit"
    );
  }

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    spawnAnimal(
      "deer"
    );
  }

  for (
    let i = 0;
    i < 5;
    i++
  ) {
    spawnAnimal(
      "bird"
    );
  }
}

// ============================================================
// WANDERING
// ============================================================

function chooseNewDirection(
  animal
) {
  animal.targetDirection =
    randomDirection();

  animal.stateTimer =
    2 +
    Math.random() * 5;
}

function moveAnimal(
  animal,
  delta,
  speed
) {
  const direction =
    new THREE.Vector3(
      Math.sin(
        animal.direction
      ),
      0,
      Math.cos(
        animal.direction
      )
    );

  animal.mesh.position.add(
    direction.multiplyScalar(
      speed * delta
    )
  );

  const terrainY =
    getTerrainY(
      animal.mesh.position.x,
      animal.mesh.position.z
    );

  animal.mesh.position.y =
    terrainY;

  animal.mesh.rotation.y =
    animal.direction;
}

function updateDirection(
  animal,
  delta
) {
  let difference =
    animal.targetDirection -
    animal.direction;

  while (
    difference >
    Math.PI
  ) {
    difference -=
      Math.PI * 2;
  }

  while (
    difference <
    -Math.PI
  ) {
    difference +=
      Math.PI * 2;
  }

  const turnSpeed =
    2.5;

  animal.direction +=
    difference *
    Math.min(
      1,
      delta * turnSpeed
    );
}

// ============================================================
// FLEEING
// ============================================================

function fleeFromPlayer(
  animal,
  playerPosition
) {
  const dx =
    animal.mesh.position.x -
    playerPosition.x;

  const dz =
    animal.mesh.position.z -
    playerPosition.z;

  animal.targetDirection =
    Math.atan2(
      dx,
      dz
    );

  animal.state =
    "fleeing";

  animal.fleeTimer =
    2.5;
}

// ============================================================
// ANIMAL AI
// ============================================================

function updateRabbit(
  animal,
  delta,
  playerPosition
) {
  const distance =
    distanceXZ(
      animal.mesh.position,
      playerPosition
    );

  if (
    distance <
    animalState.playerDetectionRadius
  ) {
    fleeFromPlayer(
      animal,
      playerPosition
    );
  }

  if (
    animal.state ===
    "fleeing"
  ) {
    animal.fleeTimer -=
      delta;

    updateDirection(
      animal,
      delta
    );

    moveAnimal(
      animal,
      delta,
      animal.runSpeed
    );

    if (
      animal.fleeTimer <=
      0
    ) {
      animal.state =
        "wandering";

      chooseNewDirection(
        animal
      );
    }

    return;
  }

  animal.stateTimer -=
    delta;

  if (
    animal.stateTimer <=
    0
  ) {
    chooseNewDirection(
      animal
    );
  }

  updateDirection(
    animal,
    delta
  );

  moveAnimal(
    animal,
    delta,
    animal.speed
  );

  animal.animationTime +=
    delta;

  const hop =
    Math.abs(
      Math.sin(
        animal.animationTime *
          5
      )
    ) *
    0.04;

  animal.mesh.position.y +=
    hop;
}

// ============================================================
// DEER AI
// ============================================================

function updateDeer(
  animal,
  delta,
  playerPosition
) {
  const distance =
    distanceXZ(
      animal.mesh.position,
      playerPosition
    );

  if (
    distance <
    animalState.playerDetectionRadius +
      2
  ) {
    fleeFromPlayer(
      animal,
      playerPosition
    );
  }

  if (
    animal.state ===
    "fleeing"
  ) {
    animal.fleeTimer -=
      delta;

    updateDirection(
      animal,
      delta
    );

    moveAnimal(
      animal,
      delta,
      animal.runSpeed
    );

    if (
      animal.fleeTimer <=
      0
    ) {
      animal.state =
        "wandering";

      chooseNewDirection(
        animal
      );
    }

    return;
  }

  animal.stateTimer -=
    delta;

  if (
    animal.stateTimer <=
    0
  ) {
    chooseNewDirection(
      animal
    );
  }

  updateDirection(
    animal,
    delta
  );

  moveAnimal(
    animal,
    delta,
    animal.speed
  );
}

// ============================================================
// BIRD AI
// ============================================================

function updateBird(
  animal,
  delta,
  playerPosition
) {
  animal.animationTime +=
    delta;

  const wingSpeed =
    9;

  for (
    const child
    of animal.mesh.children
  ) {
    if (
      child.userData.isWing
    ) {
      const side =
        child.position.x < 0
          ? -1
          : 1;

      child.rotation.z =
        side *
        (
          0.25 +
          Math.sin(
            animal.animationTime *
              wingSpeed
          ) *
          0.35
        );
    }
  }

  animal.stateTimer -=
    delta;

  if (
    animal.stateTimer <=
    0
  ) {
    animal.targetDirection =
      randomDirection();

    animal.stateTimer =
      2 +
      Math.random() * 4;
  }

  updateDirection(
    animal,
    delta
  );

  moveAnimal(
    animal,
    delta,
    animal.speed
  );

  animal.mesh.position.y =
    5 +
    Math.sin(
      animal.animationTime *
        1.5
    ) *
    0.7;

  const distance =
    distanceXZ(
      animal.mesh.position,
      playerPosition
    );

  if (
    distance <
    animalState.playerDetectionRadius
  ) {
    animal.targetDirection =
      Math.atan2(
        animal.mesh.position.x -
          playerPosition.x,
        animal.mesh.position.z -
          playerPosition.z
      );
  }
}

// ============================================================
// ANIMAL UPDATE
// ============================================================

function updateAnimals(
  delta
) {
  const playerPosition =
    getPlayerPosition();

  for (
    const animal
    of animalState.animals
  ) {
    if (
      !animal.alive
    ) {
      continue;
    }

    if (
      animal.type ===
      "rabbit"
    ) {
      updateRabbit(
        animal,
        delta,
        playerPosition
      );
    } else if (
      animal.type ===
      "deer"
    ) {
      updateDeer(
        animal,
        delta,
        playerPosition
      );
    } else if (
      animal.type ===
      "bird"
    ) {
      updateBird(
        animal,
        delta,
        playerPosition
      );
    }

    animal.detectionTimer -=
      delta;

    if (
      animal.detectionTimer <=
      0
    ) {
      animal.detectionTimer =
        1;

      const distance =
        distanceXZ(
          animal.mesh.position,
          playerPosition
        );

      if (
        distance <
        8 &&
        !animal.discovered
      ) {
        animal.discovered =
          true;

        if (
          GAME.animals
        ) {
          GAME.statistics.animalsSeen =
            (
              GAME.statistics
                .animalsSeen || 0
            ) + 1;
        }

        gameEvent(
          "animal-discovered",
          {
            type:
              animal.type
          }
        );
      }
    }
  }

  cleanupAnimals();
}

// ============================================================
// CLEANUP
// ============================================================

function cleanupAnimals() {
  const playerPosition =
    getPlayerPosition();

  const remaining = [];

  for (
    const animal
    of animalState.animals
  ) {
    if (
      !animal.alive
    ) {
      if (
        animal.mesh.parent
      ) {
        animal.mesh.parent.remove(
          animal.mesh
        );
      }

      continue;
    }

    const distance =
      distanceXZ(
        animal.mesh.position,
        playerPosition
      );

    if (
      distance >
      animalState.despawnRadius
    ) {
      if (
        animal.mesh.parent
      ) {
        animal.mesh.parent.remove(
          animal.mesh
        );
      }

      continue;
    }

    remaining.push(
      animal
    );
  }

  animalState.animals =
    remaining;

  if (
    GAME.animals
  ) {
    GAME.animals.total =
      remaining.length;
  }
}

// ============================================================
// RESPAWNING
// ============================================================

function spawnMissingAnimals(
  delta
) {
  animalState.spawnTimer +=
    delta;

  if (
    animalState.spawnTimer <
    8
  ) {
    return;
  }

  animalState.spawnTimer =
    0;

  if (
    !GAME.state?.started ||
    GAME.state?.gameOver
  ) {
    return;
  }

  const rabbitCount =
    countType("rabbit");

  const deerCount =
    countType("deer");

  const birdCount =
    countType("bird");

  if (
    rabbitCount <
    animalState.maxRabbits &&
    Math.random() < 0.7
  ) {
    spawnAnimal(
      "rabbit"
    );
  }

  if (
    deerCount <
    animalState.maxDeer &&
    Math.random() < 0.35
  ) {
    spawnAnimal(
      "deer"
    );
  }

  if (
    birdCount <
    animalState.maxBirds
  ) {
    spawnAnimal(
      "bird"
    );
  }
}

// ============================================================
// HUNTING / DAMAGE
// ============================================================

function damageAnimal(
  animal,
  amount
) {
  if (
    !animal ||
    !animal.alive
  ) {
    return false;
  }

  animal.health -=
    Number(amount) || 1;

  animal.state =
    "fleeing";

  animal.fleeTimer =
    3;

  if (
    animal.health <=
    0
  ) {
    killAnimal(
      animal
    );
  }

  return true;
}

function killAnimal(
  animal
) {
  if (
    !animal ||
    !animal.alive
  ) {
    return false;
  }

  animal.alive =
    false;

  const definition =
    ANIMAL_TYPES[
      animal.type
    ];

  if (
    definition &&
    definition.meat > 0
  ) {
    addItem(
      "rawMeat",
      definition.meat
    );
  }

  if (
    definition &&
    definition.food > 0
  ) {
    addItem(
      "food",
      definition.food
    );
  }

  gameEvent(
    "animal-killed",
    {
      type:
        animal.type,
      meat:
        definition?.meat || 0
    }
  );

  return true;
}

// ============================================================
// FIND ANIMAL
// ============================================================

function getNearestAnimal(
  maxDistance = 4
) {
  const playerPosition =
    getPlayerPosition();

  let nearest =
    null;

  let nearestDistance =
    maxDistance;

  for (
    const animal
    of animalState.animals
  ) {
    if (
      !animal.alive
    ) {
      continue;
    }

    const distance =
      distanceXZ(
        animal.mesh.position,
        playerPosition
      );

    if (
      distance <
      nearestDistance
    ) {
      nearest =
        animal;

      nearestDistance =
        distance;
    }
  }

  return nearest;
}

// ============================================================
// ATTACK / HIT NEAREST
// ============================================================

function hitNearestAnimal(
  amount = 10
) {
  const animal =
    getNearestAnimal(
      animalState.attackDistance
    );

  if (!animal) {
    return false;
  }

  return damageAnimal(
    animal,
    amount
  );
}

// ============================================================
// CLEAR ALL
// ============================================================

function clearAnimals() {
  for (
    const animal
    of animalState.animals
  ) {
    if (
      animal.mesh.parent
    ) {
      animal.mesh.parent.remove(
        animal.mesh
      );
    }
  }

  animalState.animals =
    [];

  if (
    GAME.animals
  ) {
    GAME.animals.total =
      0;
  }
}

// ============================================================
// WORLD RESET
// ============================================================

function rebuildAnimals() {
  clearAnimals();

  if (
    !animalState.initialized
  ) {
    return;
  }

  spawnInitialAnimals();
}

// ============================================================
// INITIALIZE
// ============================================================

function initializeAnimals() {
  if (
    animalState.initialized
  ) {
    return;
  }

  if (!getScene()) {
    return;
  }

  animalState.initialized =
    true;

  spawnInitialAnimals();

  console.log(
    "[SurvivalVR] Animals initialized"
  );
}

// ============================================================
// UPDATE
// ============================================================

function update(
  delta
) {
  if (
    !animalState.initialized
  ) {
    initializeAnimals();
  }

  if (
    !GAME.state?.started ||
    GAME.state?.paused ||
    GAME.state?.gameOver
  ) {
    return;
  }

  updateAnimals(
    delta
  );

  spawnMissingAnimals(
    delta
  );
}

// ============================================================
// EVENTS
// ============================================================

function setupEvents() {
  window.addEventListener(
    "survival-world-generated",
    () => {
      rebuildAnimals();
    }
  );

  window.addEventListener(
    "survival-new-world-created",
    () => {
      rebuildAnimals();
    }
  );

  window.addEventListener(
    "survival-grab",
    () => {
      /*
       * Grabbing is handled by
       * inventory/building systems.
       */
    }
  );

  window.addEventListener(
    "survival-animal-hit",
    event => {
      const detail =
        event.detail || {};

      if (
        detail.animal
      ) {
        damageAnimal(
          detail.animal,
          detail.amount ||
            10
        );
      } else {
        hitNearestAnimal(
          detail.amount ||
            10
        );
      }
    }
  );

  window.addEventListener(
    "survival-game-over",
    () => {
      /*
       * Animals remain in the world
       * while the player is on the
       * game-over screen.
       */
    }
  );
}

// ============================================================
// SYSTEM
// ============================================================

const animalsSystem = {
  state:
    animalState,

  types:
    ANIMAL_TYPES,

  initialize:
    initializeAnimals,

  update,

  rebuild:
    rebuildAnimals,

  clear:
    clearAnimals,

  spawn:
    spawnAnimal,

  getAnimals: () =>
    animalState.animals,

  getNearest:
    getNearestAnimal,

  damage:
    damageAnimal,

  kill:
    killAnimal,

  hitNearest:
    hitNearestAnimal,

  count: type =>
    countType(type)
};

// ============================================================
// REGISTER
// ============================================================

window.SurvivalVR.systems.animals =
  animalsSystem;

window.SurvivalVR.animals =
  animalsSystem;

// ============================================================
// START
// ============================================================

setupEvents();

initializeAnimals();

export {
  animalsSystem,
  initializeAnimals,
  spawnAnimal,
  damageAnimal,
  killAnimal,
  hitNearestAnimal
};