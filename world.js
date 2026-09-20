// world.js
// VVLL Survival VR
// Minecraft-style seeded procedural world generation

const {
  THREE,
  GAME,
  scene,
  gameEvent,
  gatherResource,
  setWorldSeed,
  setWorldTime,
  setWorldDay,
  setPlayerPosition
} = window.SurvivalVR;

// ------------------------------------------------------------
// WORLD STATE
// ------------------------------------------------------------

const worldState = {
  initialized: false,
  generated: false,

  seed: "",
  random: null,

  group: null,
  terrainGroup: null,
  resourceGroup: null,
  grassGroup: null,

  trees: [],
  rocks: [],
  logs: [],
  grass: [],

  lake: {
    x: 0,
    z: 0,
    radius: 8
  },

  island: {
    radius: 30,
    waterRadius: 34
  },

  generation: {
    treeCount: 0,
    rockCount: 0,
    logCount: 0,
    grassCount: 0
  },

  timeSpeed: 0.35,
  elapsed: 0,

  waterMesh: null,
  sun: null,
  ambientLight: null,

  resourceCooldown: 0
};

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const TREE_TYPES = [
  {
    trunkHeight: 2.7,
    trunkRadius: 0.28,
    crownRadius: 1.45,
    crownHeight: 2.2
  },
  {
    trunkHeight: 3.3,
    trunkRadius: 0.32,
    crownRadius: 1.7,
    crownHeight: 2.5
  },
  {
    trunkHeight: 2.3,
    trunkRadius: 0.25,
    crownRadius: 1.2,
    crownHeight: 1.8
  }
];

// ------------------------------------------------------------
// SEEDED RANDOM
// ------------------------------------------------------------

function hashSeed(seed) {
  let h = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  h += h << 13;
  h ^= h >>> 7;
  h += h << 3;
  h ^= h >>> 17;
  h += h << 5;

  return h >>> 0;
}

function createSeededRandom(seed) {
  let state = hashSeed(seed);

  return function random() {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRange(min, max) {
  return min + worldState.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

function randomSign() {
  return worldState.random() < 0.5 ? -1 : 1;
}

// ------------------------------------------------------------
// SEED CREATION
// ------------------------------------------------------------

function createRandomWorldSeed() {
  const day =
    DAY_NAMES[Math.floor(Math.random() * DAY_NAMES.length)];

  let number = "";

  if (window.crypto && crypto.getRandomValues) {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);

    number =
      String(values[0]).slice(-5) +
      String(values[1]).slice(-4);
  } else {
    number = String(
      Math.floor(Math.random() * 999999999)
    ).padStart(9, "0");
  }

  return `${day}-${number}`;
}

// ------------------------------------------------------------
// SEED INITIALIZATION
// ------------------------------------------------------------

function ensureSeed() {
  let seed =
    GAME.world &&
    typeof GAME.world.seed === "string"
      ? GAME.world.seed.trim()
      : "";

  if (!seed) {
    seed = createRandomWorldSeed();
    setWorldSeed(seed);
  }

  worldState.seed = seed;
  worldState.random = createSeededRandom(seed);

  return seed;
}

// ------------------------------------------------------------
// WORLD GROUP
// ------------------------------------------------------------

function createWorldGroups() {
  worldState.group = new THREE.Group();
  worldState.group.name = "GeneratedWorld";

  worldState.terrainGroup = new THREE.Group();
  worldState.terrainGroup.name = "Terrain";

  worldState.resourceGroup = new THREE.Group();
  worldState.resourceGroup.name = "Resources";

  worldState.grassGroup = new THREE.Group();
  worldState.grassGroup.name = "Grass";

  worldState.group.add(worldState.terrainGroup);
  worldState.group.add(worldState.resourceGroup);
  worldState.group.add(worldState.grassGroup);

  scene.add(worldState.group);
}

// ------------------------------------------------------------
// CLEAR OLD WORLD
// ------------------------------------------------------------

function disposeObject(object) {
  if (!object) return;

  object.traverse(child => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(material => {
          material.dispose();
        });
      } else {
        child.material.dispose();
      }
    }
  });
}

function clearGeneratedWorld() {
  if (!worldState.group) return;

  disposeObject(worldState.group);

  if (worldState.group.parent) {
    worldState.group.parent.remove(worldState.group);
  }

  worldState.group = null;
  worldState.terrainGroup = null;
  worldState.resourceGroup = null;
  worldState.grassGroup = null;

  worldState.trees = [];
  worldState.rocks = [];
  worldState.logs = [];
  worldState.grass = [];

  worldState.generated = false;
}

// ------------------------------------------------------------
// SEEDED ISLAND PARAMETERS
// ------------------------------------------------------------

function generateIslandParameters() {
  const random = worldState.random;

  const radius =
    27 +
    random() * 7;

  const waterRadius =
    radius + 4 + random() * 3;

  const lakeAngle =
    random() * Math.PI * 2;

  const lakeDistance =
    5 + random() * 8;

  const lakeRadius =
    6 + random() * 5;

  worldState.island.radius = radius;
  worldState.island.waterRadius = waterRadius;

  worldState.lake.x =
    Math.cos(lakeAngle) * lakeDistance;

  worldState.lake.z =
    Math.sin(lakeAngle) * lakeDistance;

  worldState.lake.radius = lakeRadius;
}

// ------------------------------------------------------------
// ISLAND HEIGHT
// ------------------------------------------------------------

function getIslandEdgeVariation(angle) {
  const r = worldState.random;

  const a =
    Math.sin(angle * 2.0) * 1.5;

  const b =
    Math.sin(angle * 3.7 + 1.2) * 1.2;

  const c =
    Math.sin(angle * 6.4 + 2.4) * 0.7;

  return a + b + c + r() * 0.15;
}

function getTerrainHeight(x, z) {
  const distance = Math.sqrt(
    x * x + z * z
  );

  const radius = worldState.island.radius;

  if (distance >= radius) {
    return -1.5;
  }

  const normalized =
    distance / radius;

  const base =
    0.25 +
    Math.cos(normalized * Math.PI * 0.5) * 0.7;

  const hills =
    Math.sin(x * 0.22) *
    Math.cos(z * 0.19) *
    0.28;

  const hills2 =
    Math.sin(x * 0.48 + 1.2) *
    Math.sin(z * 0.31) *
    0.12;

  const edge =
    Math.max(
      0,
      normalized - 0.65
    ) * -0.8;

  return base + hills + hills2 + edge;
}

// ------------------------------------------------------------
// ISLAND MESH
// ------------------------------------------------------------

function generateIsland() {
  const radius = worldState.island.radius;

  const segments = 64;
  const rings = 18;

  const vertices = [];
  const indices = [];
  const uvs = [];

  for (let ring = 0; ring <= rings; ring++) {
    const v = ring / rings;

    const distance =
      v * radius;

    for (
      let segment = 0;
      segment <= segments;
      segment++
    ) {
      const u =
        segment / segments;

      const angle =
        u * Math.PI * 2;

      const edgeVariation =
        getIslandEdgeVariation(angle);

      const localRadius =
        distance +
        edgeVariation * v;

      const x =
        Math.cos(angle) *
        localRadius;

      const z =
        Math.sin(angle) *
        localRadius;

      const y =
        getTerrainHeight(x, z);

      vertices.push(x, y, z);

      uvs.push(u * 8, v * 8);
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (
      let segment = 0;
      segment < segments;
      segment++
    ) {
      const current =
        ring * (segments + 1) +
        segment;

      const next =
        current + segments + 1;

      indices.push(
        current,
        next,
        current + 1
      );

      indices.push(
        current + 1,
        next,
        next + 1
      );
    }
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      uvs,
      2
    )
  );

  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x557b3d,
      roughness: 0.95
    });

  const island =
    new THREE.Mesh(
      geometry,
      material
    );

  island.name = "SeededIsland";

  worldState.terrainGroup.add(island);

  // Sandy beach ring
  const beachGeometry =
    new THREE.CylinderGeometry(
      worldState.island.radius + 1.3,
      worldState.island.radius + 2.2,
      0.16,
      64
    );

  const beachMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xb9a16a,
      roughness: 1
    });

  const beach =
    new THREE.Mesh(
      beachGeometry,
      beachMaterial
    );

  beach.position.y = -0.12;

  worldState.terrainGroup.add(beach);
}

// ------------------------------------------------------------
// LAKE
// ------------------------------------------------------------

function generateLake() {
  const lake = worldState.lake;

  const geometry =
    new THREE.CircleGeometry(
      lake.radius,
      48
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x267fa3,
      transparent: true,
      opacity: 0.82,
      roughness: 0.12,
      metalness: 0.05
    });

  const water =
    new THREE.Mesh(
      geometry,
      material
    );

  water.rotation.x =
    -Math.PI / 2;

  water.position.set(
    lake.x,
    0.15,
    lake.z
  );

  water.name = "SeededLake";

  worldState.terrainGroup.add(water);

  worldState.waterMesh = water;

  // Small underwater ring
  const shoreGeometry =
    new THREE.RingGeometry(
      lake.radius,
      lake.radius + 1.2,
      48
    );

  const shoreMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x8e875e,
      roughness: 1
    });

  const shore =
    new THREE.Mesh(
      shoreGeometry,
      shoreMaterial
    );

  shore.rotation.x =
    -Math.PI / 2;

  shore.position.set(
    lake.x,
    0.04,
    lake.z
  );

  worldState.terrainGroup.add(shore);
}

// ------------------------------------------------------------
// POSITION VALIDATION
// ------------------------------------------------------------

function distanceToLake(x, z) {
  const dx =
    x - worldState.lake.x;

  const dz =
    z - worldState.lake.z;

  return Math.sqrt(
    dx * dx + dz * dz
  );
}

function isInsideIsland(x, z, padding = 0) {
  return (
    Math.sqrt(x * x + z * z) <
    worldState.island.radius - padding
  );
}

function isInsideLake(x, z, padding = 0) {
  return (
    distanceToLake(x, z) <
    worldState.lake.radius + padding
  );
}

function isValidLandPosition(x, z) {
  return (
    isInsideIsland(x, z, 2) &&
    !isInsideLake(x, z, 1.5)
  );
}

function randomLandPosition() {
  for (let i = 0; i < 100; i++) {
    const angle =
      worldState.random() *
      Math.PI * 2;

    const distance =
      Math.sqrt(
        worldState.random()
      ) *
      (worldState.island.radius - 2);

    const x =
      Math.cos(angle) *
      distance;

    const z =
      Math.sin(angle) *
      distance;

    if (isValidLandPosition(x, z)) {
      return { x, z };
    }
  }

  return {
    x: 0,
    z: 0
  };
}

// ------------------------------------------------------------
// TREE GENERATION
// ------------------------------------------------------------

function createTree(x, z, type) {
  const tree =
    new THREE.Group();

  tree.name = "Tree";

  const trunkGeometry =
    new THREE.CylinderGeometry(
      type.trunkRadius,
      type.trunkRadius * 1.25,
      type.trunkHeight,
      8
    );

  const trunkMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x68452b,
      roughness: 1
    });

  const trunk =
    new THREE.Mesh(
      trunkGeometry,
      trunkMaterial
    );

  trunk.position.y =
    type.trunkHeight / 2;

  tree.add(trunk);

  const crownGeometry =
    new THREE.ConeGeometry(
      type.crownRadius,
      type.crownHeight,
      8
    );

  const crownMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x2e6334,
      roughness: 1
    });

  const crown =
    new THREE.Mesh(
      crownGeometry,
      crownMaterial
    );

  crown.position.y =
    type.trunkHeight +
    type.crownHeight / 2 -
    0.25;

  tree.add(crown);

  tree.position.set(
    x,
    getTerrainHeight(x, z),
    z
  );

  tree.rotation.y =
    worldState.random() *
    Math.PI * 2;

  tree.userData.resourceType =
    "tree";

  tree.userData.health =
    3;

  tree.userData.gatherAmount =
    2 + randomInt(0, 2);

  worldState.resourceGroup.add(tree);

  worldState.trees.push(tree);
}

function generateTrees() {
  const target =
    35 +
    randomInt(0, 25);

  let created = 0;

  for (let i = 0; i < target * 4; i++) {
    if (created >= target) break;

    const position =
      randomLandPosition();

    // Keep the spawn area somewhat open.
    if (
      Math.sqrt(
        position.x * position.x +
        position.z * position.z
      ) < 4
    ) {
      continue;
    }

    const type =
      TREE_TYPES[
        randomInt(
          0,
          TREE_TYPES.length - 1
        )
      ];

    createTree(
      position.x,
      position.z,
      type
    );

    created++;
  }

  worldState.generation.treeCount =
    created;
}

// ------------------------------------------------------------
// ROCK GENERATION
// ------------------------------------------------------------

function createRock(x, z) {
  const size =
    randomRange(0.25, 0.6);

  const geometry =
    new THREE.DodecahedronGeometry(
      size,
      0
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x77766e,
      roughness: 1
    });

  const rock =
    new THREE.Mesh(
      geometry,
      material
    );

  rock.position.set(
    x,
    getTerrainHeight(x, z) +
      size * 0.35,
    z
  );

  rock.rotation.set(
    worldState.random() * 0.5,
    worldState.random() * Math.PI,
    worldState.random() * 0.5
  );

  rock.userData.resourceType =
    "rock";

  rock.userData.health = 2;

  rock.userData.gatherAmount =
    1 + randomInt(0, 2);

  worldState.resourceGroup.add(rock);

  worldState.rocks.push(rock);
}

function generateRocks() {
  const target =
    22 +
    randomInt(0, 18);

  let created = 0;

  for (let i = 0; i < target * 4; i++) {
    if (created >= target) break;

    const position =
      randomLandPosition();

    createRock(
      position.x,
      position.z
    );

    created++;
  }

  worldState.generation.rockCount =
    created;
}

// ------------------------------------------------------------
// LOG GENERATION
// ------------------------------------------------------------

function createLog(x, z) {
  const length =
    randomRange(1.4, 2.5);

  const radius =
    randomRange(0.18, 0.3);

  const geometry =
    new THREE.CylinderGeometry(
      radius,
      radius * 1.1,
      length,
      8
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x765035,
      roughness: 1
    });

  const log =
    new THREE.Mesh(
      geometry,
      material
    );

  log.position.set(
    x,
    getTerrainHeight(x, z) +
      radius,
    z
  );

  log.rotation.z =
    Math.PI / 2;

  log.rotation.y =
    worldState.random() *
    Math.PI * 2;

  log.userData.resourceType =
    "log";

  log.userData.gatherAmount =
    1 + randomInt(0, 2);

  worldState.resourceGroup.add(log);

  worldState.logs.push(log);
}

function generateLogs() {
  const target =
    10 +
    randomInt(0, 10);

  for (let i = 0; i < target; i++) {
    const position =
      randomLandPosition();

    createLog(
      position.x,
      position.z
    );
  }

  worldState.generation.logCount =
    target;
}

// ------------------------------------------------------------
// GRASS
// ------------------------------------------------------------

function createGrass(x, z) {
  const height =
    randomRange(0.12, 0.32);

  const geometry =
    new THREE.BufferGeometry();

  const vertices = new Float32Array([
    -0.04, 0, 0,
     0.04, 0, 0,
     0.04, height, 0,
    -0.04, height, 0
  ]);

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex([
    0, 1, 2,
    0, 2, 3
  ]);

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x4e7838,
      side: THREE.DoubleSide
    });

  const grass =
    new THREE.Mesh(
      geometry,
      material
    );

  grass.position.set(
    x,
    getTerrainHeight(x, z),
    z
  );

  grass.rotation.y =
    worldState.random() *
    Math.PI * 2;

  worldState.grassGroup.add(grass);

  worldState.grass.push(grass);
}

function generateGrass() {
  const target =
    280 +
    randomInt(0, 140);

  for (let i = 0; i < target * 3; i++) {
    if (
      worldState.grass.length >=
      target
    ) {
      break;
    }

    const position =
      randomLandPosition();

    if (
      isInsideLake(
        position.x,
        position.z,
        0.5
      )
    ) {
      continue;
    }

    createGrass(
      position.x,
      position.z
    );
  }

  worldState.generation.grassCount =
    worldState.grass.length;
}

// ------------------------------------------------------------
// RESOURCE INTERACTION
// ------------------------------------------------------------

function removeResourceObject(object) {
  if (!object) return;

  const indexTrees =
    worldState.trees.indexOf(object);

  if (indexTrees !== -1) {
    worldState.trees.splice(
      indexTrees,
      1
    );
  }

  const indexRocks =
    worldState.rocks.indexOf(object);

  if (indexRocks !== -1) {
    worldState.rocks.splice(
      indexRocks,
      1
    );
  }

  const indexLogs =
    worldState.logs.indexOf(object);

  if (indexLogs !== -1) {
    worldState.logs.splice(
      indexLogs,
      1
    );
  }

  if (object.parent) {
    object.parent.remove(object);
  }

  disposeObject(object);
}

function getNearestResource(maxDistance = 3) {
  if (!SurvivalVR.camera) {
    return null;
  }

  const camera =
    SurvivalVR.camera;

  const playerPosition =
    camera.getWorldPosition(
      new THREE.Vector3()
    );

  let closest = null;
  let closestDistance =
    maxDistance;

  const resources = [
    ...worldState.trees,
    ...worldState.rocks,
    ...worldState.logs
  ];

  for (const resource of resources) {
    if (!resource.parent) continue;

    const position =
      resource.getWorldPosition(
        new THREE.Vector3()
      );

    const distance =
      playerPosition.distanceTo(
        position
      );

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = resource;
    }
  }

  return closest;
}

function gatherNearestResource() {
  const resource =
    getNearestResource(3);

  if (!resource) {
    return false;
  }

  const type =
    resource.userData.resourceType;

  let amount =
    resource.userData.gatherAmount ||
    1;

  if (type === "tree") {
    gatherResource(
      "wood",
      amount
    );

    GAME.statistics.treesCut++;

    showMessage(
      `Collected ${amount} wood`
    );
  }

  if (type === "rock") {
    gatherResource(
      "rock",
      amount
    );

    GAME.statistics.rocksBroken++;

    showMessage(
      `Collected ${amount} rock`
    );
  }

  if (type === "log") {
    gatherResource(
      "log",
      amount
    );

    GAME.statistics.logsCollected++;

    showMessage(
      `Collected ${amount} log`
    );
  }

  removeResourceObject(resource);

  gameEvent("resource-gathered");

  return true;
}

// ------------------------------------------------------------
// MESSAGES
// ------------------------------------------------------------

function showMessage(message) {
  const element =
    document.getElementById(
      "message"
    );

  if (!element) return;

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

  clearTimeout(
    showMessage.timer
  );

  showMessage.timer =
    setTimeout(() => {
      element.classList.remove(
        "show"
      );
    }, 2200);
}

// ------------------------------------------------------------
// DAY / NIGHT
// ------------------------------------------------------------

function createLighting() {
  worldState.ambientLight =
    new THREE.HemisphereLight(
      0xbfe5ff,
      0x39462c,
      1.2
    );

  worldState.ambientLight.name =
    "WorldAmbientLight";

  scene.add(
    worldState.ambientLight
  );

  worldState.sun =
    new THREE.DirectionalLight(
      0xffffff,
      2.0
    );

  worldState.sun.name =
    "WorldSun";

  worldState.sun.castShadow =
    true;

  worldState.sun.shadow.mapSize.width =
    1024;

  worldState.sun.shadow.mapSize.height =
    1024;

  scene.add(
    worldState.sun
  );
}

function updateLighting(delta) {
  if (!worldState.sun) return;

  const time =
    GAME.world.time || 8;

  const angle =
    ((time - 6) / 24) *
    Math.PI * 2;

  const radius = 45;

  worldState.sun.position.set(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    12
  );

  const daylight =
    Math.max(
      0.08,
      Math.sin(angle)
    );

  worldState.sun.intensity =
    0.35 +
    daylight * 1.9;

  if (worldState.ambientLight) {
    worldState.ambientLight.intensity =
      0.35 +
      daylight * 0.9;
  }

  if (
    GAME.world.time !== undefined
  ) {
    let nextTime =
      GAME.world.time +
      delta *
      worldState.timeSpeed;

    if (nextTime >= 24) {
      nextTime -= 24;

      setWorldDay(
        (GAME.world.day || 1) + 1
      );

      GAME.statistics.daysSurvived++;

      gameEvent("new-day");

      showMessage(
        `Day ${GAME.world.day}`
      );
    }

    setWorldTime(nextTime);
  }
}

// ------------------------------------------------------------
// WATER
// ------------------------------------------------------------

function updateWater(delta) {
  if (!worldState.waterMesh) {
    return;
  }

  const material =
    worldState.waterMesh.material;

  worldState.elapsed += delta;

  material.opacity =
    0.76 +
    Math.sin(
      worldState.elapsed * 1.5
    ) * 0.04;
}

// ------------------------------------------------------------
// GRASS WIND
// ------------------------------------------------------------

function updateGrass() {
  const time =
    worldState.elapsed;

  for (
    let i = 0;
    i < worldState.grass.length;
    i++
  ) {
    const grass =
      worldState.grass[i];

    if (!grass) continue;

    const sway =
      Math.sin(
        time * 1.8 +
        i * 0.37
      ) * 0.08;

    grass.rotation.z =
      sway;
  }
}

// ------------------------------------------------------------
// SAFE SPAWN
// ------------------------------------------------------------

function findSpawnPoint() {
  const candidates = [
    { x: 0, z: 0 },
    { x: 4, z: 2 },
    { x: -4, z: 2 },
    { x: 2, z: -4 },
    { x: -2, z: -4 },
    { x: 6, z: 0 },
    { x: -6, z: 0 }
  ];

  for (const point of candidates) {
    if (
      isValidLandPosition(
        point.x,
        point.z
      )
    ) {
      return point;
    }
  }

  return {
    x: 0,
    z: 0
  };
}

function placePlayerAtSpawn() {
  const spawn =
    findSpawnPoint();

  const y =
    getTerrainHeight(
      spawn.x,
      spawn.z
    );

  setPlayerPosition(
    spawn.x,
    Math.max(1, y + 1.7),
    spawn.z,
    0
  );
}

// ------------------------------------------------------------
// GENERATE WORLD
// ------------------------------------------------------------

function generateWorld(seed = null) {
  if (seed) {
    setWorldSeed(seed);
  }

  ensureSeed();

  clearGeneratedWorld();

  createWorldGroups();

  generateIslandParameters();

  generateIsland();

  generateLake();

  generateTrees();

  generateRocks();

  generateLogs();

  generateGrass();

  if (!worldState.sun) {
    createLighting();
  }

  placePlayerAtSpawn();

  worldState.generated = true;

  SurvivalVR.worldData = {
    seed: worldState.seed,

    islandRadius:
      worldState.island.radius,

    waterRadius:
      worldState.island.waterRadius,

    lake: {
      x: worldState.lake.x,
      z: worldState.lake.z,
      radius: worldState.lake.radius
    },

    generation: {
      ...worldState.generation
    }
  };

  gameEvent(
    "world-generated"
  );

  showMessage(
    `World generated: ${worldState.seed}`
  );

  return SurvivalVR.worldData;
}

// ------------------------------------------------------------
// NEW WORLD
// ------------------------------------------------------------

function createNewSeededWorld(seed = null) {
  const newSeed =
    seed ||
    createRandomWorldSeed();

  generateWorld(
    newSeed
  );

  return newSeed;
}

// ------------------------------------------------------------
// REGENERATE CURRENT WORLD
// ------------------------------------------------------------

function regenerateWorld() {
  return generateWorld(
    worldState.seed
  );
}

// ------------------------------------------------------------
// RESOURCE EVENT / CONTROLS
// ------------------------------------------------------------

function setupEvents() {
  window.addEventListener(
    "survival-grab",
    event => {
      if (
        event.detail &&
        event.detail.state === "start"
      ) {
        gatherNearestResource();
      }
    }
  );

  window.addEventListener(
    "survival-gather",
    () => {
      gatherNearestResource();
    }
  );

  window.addEventListener(
    "keydown",
    event => {
      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        gatherNearestResource();
      }
    }
  );
}

// ------------------------------------------------------------
// UPDATE
// ------------------------------------------------------------

function update(delta) {
  if (
    !worldState.generated ||
    !GAME.state.started ||
    GAME.state.paused ||
    GAME.state.gameOver
  ) {
    return;
  }

  updateLighting(delta);

  updateWater(delta);

  updateGrass();
}

// ------------------------------------------------------------
// SYSTEM
// ------------------------------------------------------------

const worldSystem = {
  initialized: true,

  state: worldState,

  generateWorld,

  createNewWorld:
    createNewSeededWorld,

  regenerateWorld,

  getSeed() {
    return worldState.seed;
  },

  getWorldData() {
    return SurvivalVR.worldData;
  },

  getIslandRadius() {
    return worldState.island.radius;
  },

  getLake() {
    return {
      ...worldState.lake
    };
  },

  isLandPosition(x, z) {
    return isValidLandPosition(
      x,
      z
    );
  },

  getTerrainHeight,

  gatherNearestResource,

  update
};

// ------------------------------------------------------------
// REGISTER SYSTEM
// ------------------------------------------------------------

SurvivalVR.systems.world =
  worldSystem;

SurvivalVR.world =
  worldSystem;

SurvivalVR.getWorldSeed =
  () => worldState.seed;

SurvivalVR.generateWorld =
  generateWorld;

SurvivalVR.createNewWorld =
  createNewSeededWorld;

// ------------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------------

setupEvents();

generateWorld();

worldState.initialized = true;

console.log(
  `[SurvivalVR] World generated from seed: ${worldState.seed}`
);

export {
  worldSystem,
  generateWorld,
  createNewSeededWorld,
  regenerateWorld,
  getTerrainHeight,
  gatherNearestResource
};