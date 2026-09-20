// world.js
// ============================================================
// SURVIVAL VR — PROCEDURAL ISLAND WORLD v5
// Seeded world generation + resources + lake + terrain
// ============================================================

import * as THREE from "three";

const S = window.SurvivalVR;

const state = {
  seed: "",
  worldGroup: null,

  terrain: null,
  lake: null,

  resourceObjects: [],
  resourceRecords: [],

  islandRadius: 70,
  waterRadius: 22,

  generated: false
};

// ============================================================
// SEEDED RANDOM
// ============================================================

function hashString(value) {
  let hash = 2166136261;

  const text = String(value);

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

function seededRandom(seed) {
  let value =
    hashString(seed) || 1;

  return function () {
    value += 0x6D2B79F5;

    let t = value;

    t =
      Math.imul(
        t ^ (t >>> 15),
        t | 1
      );

    t ^=
      t +
      Math.imul(
        t ^ (t >>> 7),
        t | 61
      );

    return (
      ((t ^
        (t >>> 14)) >>>
        0) /
      4294967296
    );
  };
}

function generateReadableSeed() {
  const words = [
    "CEDAR",
    "PINE",
    "RIVER",
    "STONE",
    "WILLOW",
    "MAPLE",
    "OAK",
    "EMBER",
    "MOSS",
    "FOREST",
    "LAKE",
    "CLIFF",
    "CREEK",
    "MEADOW",
    "FROST",
    "SUN",
    "RAIN",
    "WIND"
  ];

  const random =
    seededRandom(
      Date.now().toString()
    );

  const a =
    words[
      Math.floor(
        random() *
          words.length
      )
    ];

  const b =
    words[
      Math.floor(
        random() *
          words.length
      )
    ];

  const number =
    Math.floor(
      random() * 9000
    ) + 1000;

  return `${a}-${b}-${number}`;
}

// ============================================================
// SEED
// ============================================================

function ensureSeed(seed = null) {
  if (
    seed !== null &&
    seed !== undefined &&
    String(seed).trim()
  ) {
    state.seed =
      String(seed).trim();

    return state.seed;
  }

  if (!state.seed) {
    state.seed =
      generateReadableSeed();
  }

  return state.seed;
}

export function getWorldSeed() {
  return state.seed;
}

// ============================================================
// TERRAIN HEIGHT
// ============================================================

function smoothNoise(
  x,
  z,
  random
) {
  const x0 =
    Math.floor(x);

  const z0 =
    Math.floor(z);

  const xf =
    x - x0;

  const zf =
    z - z0;

  function value(ix, iz) {
    const localSeed =
      `${state.seed}:${ix}:${iz}`;

    return (
      seededRandom(localSeed)() *
        2 -
      1
    );
  }

  const a =
    value(x0, z0);

  const b =
    value(x0 + 1, z0);

  const c =
    value(x0, z0 + 1);

  const d =
    value(
      x0 + 1,
      z0 + 1
    );

  const fadeX =
    xf * xf *
    (3 - 2 * xf);

  const fadeZ =
    zf * zf *
    (3 - 2 * zf);

  const top =
    THREE.MathUtils.lerp(
      a,
      b,
      fadeX
    );

  const bottom =
    THREE.MathUtils.lerp(
      c,
      d,
      fadeX
    );

  return THREE.MathUtils.lerp(
    top,
    bottom,
    fadeZ
  );
}

function getTerrainHeight(
  x,
  z
) {
  const distance =
    Math.sqrt(
      x * x +
        z * z
    );

  const edge =
    THREE.MathUtils.clamp(
      1 -
        distance /
          state.islandRadius,
      0,
      1
    );

  const large =
    smoothNoise(
      x * 0.045,
      z * 0.045
    );

  const medium =
    smoothNoise(
      x * 0.11,
      z * 0.11
    );

  const small =
    smoothNoise(
      x * 0.25,
      z * 0.25
    );

  let height =
    1.2 +
    large * 4.5 +
    medium * 1.4 +
    small * 0.35;

  height *=
    0.55 +
    edge * 0.75;

  const lakeDistance =
    Math.sqrt(
      (x - 8) *
        (x - 8) +
      (z + 4) *
        (z + 4)
    );

  if (
    lakeDistance <
    state.waterRadius
  ) {
    height =
      -0.25;
  }

  return height;
}

// ============================================================
// LAND CHECK
// ============================================================

function isLandPosition(
  x,
  z
) {
  const distance =
    Math.sqrt(
      x * x +
        z * z
    );

  if (
    distance >
    state.islandRadius - 1
  ) {
    return false;
  }

  const lakeDistance =
    Math.sqrt(
      (x - 8) *
        (x - 8) +
      (z + 4) *
        (z + 4)
    );

  if (
    lakeDistance <
    state.waterRadius
  ) {
    return false;
  }

  return true;
}

// ============================================================
// CLEAR WORLD
// ============================================================

function disposeObject(
  object
) {
  if (!object) return;

  object.traverse(
    child => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (
          Array.isArray(
            child.material
          )
        ) {
          child.material.forEach(
            material =>
              material.dispose()
          );
        } else {
          child.material.dispose();
        }
      }
    }
  );
}

function clearWorld() {
  if (
    state.worldGroup &&
    S?.scene
  ) {
    S.scene.remove(
      state.worldGroup
    );

    disposeObject(
      state.worldGroup
    );
  }

  state.worldGroup =
    new THREE.Group();

  state.terrain = null;
  state.lake = null;

  state.resourceObjects = [];
  state.resourceRecords = [];

  if (S) {
    S.resources = [];
    S.worldResources = [];
  }
}

// ============================================================
// TERRAIN
// ============================================================

function createTerrain() {
  const segments = 120;
  const size =
    state.islandRadius * 2;

  const geometry =
    new THREE.PlaneGeometry(
      size,
      size,
      segments,
      segments
    );

  geometry.rotateX(
    -Math.PI / 2
  );

  const positions =
    geometry.attributes.position;

  for (
    let i = 0;
    i <
    positions.count;
    i++
  ) {
    const x =
      positions.getX(i);

    const z =
      positions.getZ(i);

    const distance =
      Math.sqrt(
        x * x +
          z * z
      );

    if (
      distance >
      state.islandRadius
    ) {
      positions.setY(
        i,
        -2
      );

      continue;
    }

    const y =
      getTerrainHeight(
        x,
        z
      );

    positions.setY(
      i,
      y
    );
  }

  geometry.computeVertexNormals();

  const material =
    new THREE.MeshStandardMaterial(
      {
        color: 0x3d6335,
        roughness: 0.95,
        metalness: 0
      }
    );

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.receiveShadow =
    true;

  mesh.name =
    "IslandTerrain";

  state.terrain =
    mesh;

  state.worldGroup.add(
    mesh
  );
}

// ============================================================
// LAKE
// ============================================================

function createLake() {
  const geometry =
    new THREE.CircleGeometry(
      state.waterRadius,
      64
    );

  const material =
    new THREE.MeshStandardMaterial(
      {
        color: 0x3b7f8f,
        transparent: true,
        opacity: 0.78,
        roughness: 0.12,
        metalness: 0.05
      }
    );

  const lake =
    new THREE.Mesh(
      geometry,
      material
    );

  lake.rotation.x =
    -Math.PI / 2;

  lake.position.set(
    8,
    0.02,
    -4
  );

  lake.receiveShadow =
    true;

  lake.name =
    "IslandLake";

  state.lake =
    lake;

  state.worldGroup.add(
    lake
  );
}

// ============================================================
// ROCK
// ============================================================

function createRock(
  x,
  y,
  z,
  id
) {
  const geometry =
    new THREE.DodecahedronGeometry(
      0.35 +
        seededRandom(id)() *
          0.35,
      1
    );

  const material =
    new THREE.MeshStandardMaterial(
      {
        color: 0x77736b,
        roughness: 1
      }
    );

  const rock =
    new THREE.Mesh(
      geometry,
      material
    );

  rock.position.set(
    x,
    y + 0.25,
    z
  );

  rock.rotation.set(
    seededRandom(id + "x")() *
      Math.PI,
    seededRandom(id + "y")() *
      Math.PI,
    seededRandom(id + "z")() *
      Math.PI
  );

  rock.castShadow =
    true;

  rock.receiveShadow =
    true;

  rock.userData.id =
    id;

  rock.userData.type =
    "rock";

  rock.userData.resourceType =
    "rock";

  return rock;
}

// ============================================================
// TREE
// ============================================================

function createTree(
  x,
  y,
  z,
  id
) {
  const tree =
    new THREE.Group();

  tree.name =
    "Tree";

  tree.userData.id =
    id;

  tree.userData.type =
    "tree";

  tree.userData.resourceType =
    "tree";

  const trunkGeometry =
    new THREE.CylinderGeometry(
      0.22,
      0.32,
      2.8,
      8
    );

  const trunkMaterial =
    new THREE.MeshStandardMaterial(
      {
        color: 0x6e4227,
        roughness: 1
      }
    );

  const trunk =
    new THREE.Mesh(
      trunkGeometry,
      trunkMaterial
    );

  trunk.position.y =
    1.4;

  trunk.castShadow =
    true;

  tree.add(
    trunk
  );

  const leafGeometry =
    new THREE.IcosahedronGeometry(
      1.25,
      1
    );

  const leafMaterial =
    new THREE.MeshStandardMaterial(
      {
        color: 0x315c31,
        roughness: 1
      }
    );

  const leaves =
    new THREE.Mesh(
      leafGeometry,
      leafMaterial
    );

  leaves.position.y =
    3.05;

  leaves.scale.set(
    1,
    1.15,
    1
  );

  leaves.castShadow =
    true;

  tree.add(
    leaves
  );

  tree.position.set(
    x,
    y,
    z
  );

  return tree;
}

// ============================================================
// LOG
// ============================================================

function createLog(
  x,
  y,
  z,
  id
) {
  const geometry =
    new THREE.CylinderGeometry(
      0.24,
      0.28,
      1.8,
      8
    );

  const material =
    new THREE.MeshStandardMaterial(
      {
        color: 0x74492d,
        roughness: 1
      }
    );

  const log =
    new THREE.Mesh(
      geometry,
      material
    );

  log.position.set(
    x,
    y + 0.3,
    z
  );

  log.rotation.z =
    Math.PI / 2;

  log.rotation.y =
    seededRandom(id)() *
    Math.PI;

  log.castShadow =
    true;

  log.userData.id =
    id;

  log.userData.type =
    "log";

  log.userData.resourceType =
    "log";

  return log;
}

// ============================================================
// GRASS
// ============================================================

function createGrass(
  x,
  y,
  z,
  id
) {
  const geometry =
    new THREE.ConeGeometry(
      0.12,
      0.55,
      4
    );

  const material =
    new THREE.MeshStandardMaterial(
      {
        color: 0x47743c,
        roughness: 1
      }
    );

  const grass =
    new THREE.Mesh(
      geometry,
      material
    );

  grass.position.set(
    x,
    y + 0.25,
    z
  );

  grass.rotation.y =
    seededRandom(id)() *
    Math.PI;

  grass.userData.id =
    id;

  grass.userData.type =
    "grass";

  grass.userData.resourceType =
    "grass";

  return grass;
}

// ============================================================
// RESOURCE RECORD
// ============================================================

function addResource(
  object,
  type,
  x,
  y,
  z,
  index
) {
  const id =
    `${state.seed}:${type}:${index}`;

  object.userData.id =
    id;

  object.userData.resourceType =
    type;

  object.userData.depleted =
    false;

  object.userData.gathered =
    false;

  const record = {
    id,
    type,
    x,
    y,
    z,
    depleted: false,
    gathered: false
  };

  state.resourceObjects.push(
    object
  );

  state.resourceRecords.push(
    record
  );

  state.worldGroup.add(
    object
  );
}

// ============================================================
// RESOURCE GENERATION
// ============================================================

function generateResources() {
  const random =
    seededRandom(
      `${state.seed}:resources`
    );

  let treeIndex = 0;
  let rockIndex = 0;
  let logIndex = 0;
  let grassIndex = 0;

  // Trees
  for (
    let i = 0;
    i < 90;
    i++
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      8 +
      random() *
        (state.islandRadius - 12);

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isLandPosition(
        x,
        z
      )
    ) {
      continue;
    }

    const y =
      getTerrainHeight(
        x,
        z
      );

    const id =
      `${state.seed}:tree:${treeIndex}`;

    const tree =
      createTree(
        x,
        y,
        z,
        id
      );

    addResource(
      tree,
      "tree",
      x,
      y,
      z,
      treeIndex
    );

    treeIndex++;
  }

  // Rocks
  for (
    let i = 0;
    i < 55;
    i++
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      5 +
      random() *
        (state.islandRadius - 8);

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isLandPosition(
        x,
        z
      )
    ) {
      continue;
    }

    const y =
      getTerrainHeight(
        x,
        z
      );

    const id =
      `${state.seed}:rock:${rockIndex}`;

    const rock =
      createRock(
        x,
        y,
        z,
        id
      );

    addResource(
      rock,
      "rock",
      x,
      y,
      z,
      rockIndex
    );

    rockIndex++;
  }

  // Logs
  for (
    let i = 0;
    i < 25;
    i++
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      10 +
      random() *
        (state.islandRadius - 15);

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isLandPosition(
        x,
        z
      )
    ) {
      continue;
    }

    const y =
      getTerrainHeight(
        x,
        z
      );

    const id =
      `${state.seed}:log:${logIndex}`;

    const log =
      createLog(
        x,
        y,
        z,
        id
      );

    addResource(
      log,
      "log",
      x,
      y,
      z,
      logIndex
    );

    logIndex++;
  }

  // Grass
  for (
    let i = 0;
    i < 350;
    i++
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      random() *
        (state.islandRadius - 2);

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isLandPosition(
        x,
        z
      )
    ) {
      continue;
    }

    const y =
      getTerrainHeight(
        x,
        z
      );

    const id =
      `${state.seed}:grass:${grassIndex}`;

    const grass =
      createGrass(
        x,
        y,
        z,
        id
      );

    addResource(
      grass,
      "grass",
      x,
      y,
      z,
      grassIndex
    );

    grassIndex++;
  }
}

// ============================================================
// LIGHTING
// ============================================================

function createWorldLighting() {
  const ambient =
    new THREE.HemisphereLight(
      0xb9d7d0,
      0x28351f,
      1.2
    );

  ambient.name =
    "WorldAmbientLight";

  state.worldGroup.add(
    ambient
  );

  const sun =
    new THREE.DirectionalLight(
      0xfff1c2,
      2
    );

  sun.position.set(
    35,
    55,
    20
  );

  sun.castShadow =
    true;

  sun.shadow.mapSize.width =
    2048;

  sun.shadow.mapSize.height =
    2048;

  sun.shadow.camera.left =
    -80;

  sun.shadow.camera.right =
    80;

  sun.shadow.camera.top =
    80;

  sun.shadow.camera.bottom =
    -80;

  state.worldGroup.add(
    sun
  );

  S.sun =
    sun;

  S.ambientLight =
    ambient;
}

// ============================================================
// GENERATE WORLD
// ============================================================

export async function generateWorld(
  seed = null,
  options = {}
) {
  const newSeed =
    ensureSeed(seed);

  const preservePlayer =
    options.preservePlayer === true;

  clearWorld();

  state.generated =
    false;

  state.islandRadius =
    70;

  state.waterRadius =
    22;

  createTerrain();
  createLake();
  generateResources();
  createWorldLighting();

  if (
    S?.scene
  ) {
    S.scene.add(
      state.worldGroup
    );
  }

  S.worldData = {
    seed:
      state.seed,

    islandRadius:
      state.islandRadius,

    waterRadius:
      state.waterRadius,

    lake: {
      x: 8,
      z: -4,
      radius:
        state.waterRadius
    },

    generation: {
      version: 5,
      seeded: true,
      procedural: true
    }
  };

  S.resources =
    state.resourceObjects;

  S.worldResources =
    state.resourceRecords;

  state.generated =
    true;

  if (
    !preservePlayer &&
    S?.playerGroup
  ) {
    S.playerGroup.position.set(
      0,
      1.65,
      0
    );

    S.playerGroup.rotation.y =
      0;

    if (
      S?.GAME?.position
    ) {
      S.GAME.position.x =
        0;

      S.GAME.position.y =
        1.65;

      S.GAME.position.z =
        0;

      S.GAME.position.rotationY =
        0;
    }
  }

  if (
    typeof S?.gameEvent ===
      "function"
  ) {
    S.gameEvent(
      "world-generated",
      {
        seed:
          state.seed
      }
    );
  }

  return getWorldData();
}

// ============================================================
// CREATE NEW WORLD
// ============================================================
//
// IMPORTANT:
// This function ONLY generates the world.
// It does NOT call S.createNewWorld().
// That prevents the old recursive loop.
//
// game.js owns the game-state reset.
// world.js owns the actual world generation.
// ============================================================

export async function createNewWorld(
  seed = null
) {
  const newSeed =
    ensureSeed(seed);

  return generateWorld(
    newSeed,
    {
      preservePlayer:
        false
    }
  );
}

// ============================================================
// RESOURCE STATE
// ============================================================

export function getResourceRecords() {
  return clone(
    state.resourceRecords
  );
}

export function restoreResourceState(
  savedResources
) {
  if (
    !Array.isArray(
      savedResources
    )
  ) {
    return;
  }

  const savedMap =
    new Map();

  for (
    const record
    of savedResources
  ) {
    if (
      record?.id
    ) {
      savedMap.set(
        record.id,
        record
      );
    }
  }

  for (
    const record
    of state.resourceRecords
  ) {
    const saved =
      savedMap.get(
        record.id
      );

    if (!saved) {
      continue;
    }

    record.depleted =
      saved.depleted === true;

    record.gathered =
      saved.gathered === true;

    const object =
      state.resourceObjects.find(
        item =>
          item?.userData?.id ===
          record.id
      );

    if (!object) {
      continue;
    }

    object.userData.depleted =
      record.depleted;

    object.userData.gathered =
      record.gathered;

    object.visible =
      !record.depleted;
  }

  S.resources =
    state.resourceObjects;

  S.worldResources =
    state.resourceRecords;
}

// ============================================================
// GATHER RESOURCE
// ============================================================

export function gatherNearestResource(
  position,
  maxDistance = 3
) {
  if (
    !position
  ) {
    return null;
  }

  let nearest =
    null;

  let nearestDistance =
    maxDistance;

  for (
    let i = 0;
    i <
    state.resourceObjects.length;
    i++
  ) {
    const object =
      state.resourceObjects[i];

    if (
      !object ||
      !object.visible
    ) {
      continue;
    }

    const record =
      state.resourceRecords[i];

    if (
      record?.depleted
    ) {
      continue;
    }

    const distance =
      object.position.distanceTo(
        position
      );

    if (
      distance <
      nearestDistance
    ) {
      nearest =
        {
          object,
          record
        };

      nearestDistance =
        distance;
    }
  }

  if (!nearest) {
    return null;
  }

  nearest.record.depleted =
    true;

  nearest.record.gathered =
    true;

  nearest.object.userData.depleted =
    true;

  nearest.object.userData.gathered =
    true;

  nearest.object.visible =
    false;

  const type =
    nearest.record.type;

  if (
    typeof S?.gatherResource ===
      "function"
  ) {
    if (
      type === "tree"
    ) {
      S.gatherResource(
        "wood",
        2
      );

      S.gatherResource(
        "log",
        1
      );
    }

    if (
      type === "rock"
    ) {
      S.gatherResource(
        "stone",
        2
      );
    }

    if (
      type === "log"
    ) {
      S.gatherResource(
        "log",
        1
      );
    }

    if (
      type === "grass"
    ) {
      S.gatherResource(
        "fiber",
        2
      );
    }
  }

  if (
    typeof S?.gameEvent ===
      "function"
  ) {
    S.gameEvent(
      "resource-gathered",
      {
        id:
          nearest.record.id,

        type
      }
    );
  }

  return {
    id:
      nearest.record.id,

    type,

    object:
      nearest.object,

    record:
      nearest.record
  };
}

// ============================================================
// TERRAIN HELPERS
// ============================================================

export function getTerrainHeightAt(
  x,
  z
) {
  return getTerrainHeight(
    x,
    z
  );
}

export function getIslandRadius() {
  return state.islandRadius;
}

export function getLake() {
  return {
    x: 8,
    z: -4,
    radius:
      state.waterRadius
  };
}

export function getWorldData() {
  return {
    seed:
      state.seed,

    islandRadius:
      state.islandRadius,

    waterRadius:
      state.waterRadius,

    lake: {
      x: 8,
      z: -4,
      radius:
        state.waterRadius
    },

    generation: {
      version: 5,
      seeded: true,
      procedural: true
    }
  };
}

// ============================================================
// UPDATE
// ============================================================

export function update(
  delta
) {
  if (
    !state.generated
  ) {
    return;
  }

  // Very subtle water movement.
  if (state.lake) {
    const time =
      performance.now() *
      0.001;

    state.lake.material.opacity =
      0.74 +
      Math.sin(time * 0.8) *
        0.035;
  }
}

// ============================================================
// SYSTEM REGISTRATION
// ============================================================

S.systems =
  S.systems || {};

S.systems.world = {
  generateWorld,
  createNewWorld,
  getWorldSeed,
  getWorldData,
  getResourceRecords,
  restoreResourceState,
  gatherNearestResource,
  getTerrainHeight:
    getTerrainHeightAt,
  getIslandRadius,
  getLake,
  isLandPosition,
  update,
  clearWorld
};

// Compatibility methods.

S.generateWorld =
  generateWorld;

S.createWorld =
  createNewWorld;

S.getWorldSeed =
  getWorldSeed;

S.getWorldData =
  getWorldData;

S.getTerrainHeight =
  getTerrainHeightAt;

S.getIslandRadius =
  getIslandRadius;

S.getLake =
  getLake;

S.gatherNearestResource =
  gatherNearestResource;

console.log(
  "Survival VR procedural world v5 loaded."
);

export default {
  generateWorld,
  createNewWorld,
  getWorldSeed,
  getWorldData,
  getResourceRecords,
  restoreResourceState,
  gatherNearestResource,
  getTerrainHeightAt,
  getIslandRadius,
  getLake,
  isLandPosition,
  update
};