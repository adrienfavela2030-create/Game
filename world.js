// world.js
// ============================================================
// SURVIVAL VR — SEEDED PROCEDURAL WORLD SYSTEM
// ============================================================

import * as THREE from "three";

import {
  GAME,
  player,
  gameEvent,
  setWorldSeed,
  setWorldName,
  setPlayerPosition,
  gatherResource
} from "./game.js";

const S = window.SurvivalVR;

if (!S) {
  throw new Error(
    "SurvivalVR global must be created before world.js loads."
  );
}

// ------------------------------------------------------------
// WORLD CONFIGURATION
// ------------------------------------------------------------

const CONFIG = {
  islandRadius: 95,
  waterRadius: 135,

  lakeMinRadius: 15,
  lakeMaxRadius: 28,

  treeMin: 65,
  treeMax: 105,

  rockMin: 35,
  rockMax: 65,

  logMin: 12,
  logMax: 25,

  grassMin: 180,
  grassMax: 300,

  treeMinDistanceFromLake: 4,
  resourceSpawnMargin: 7,

  maxSlope: 1.2,

  terrainSegments: 90,

  waterHeight: -0.35,

  spawnClearRadius: 10
};

// ------------------------------------------------------------
// WORLD STATE
// ------------------------------------------------------------

const state = {
  seed: "",
  generated: false,

  islandRadius: CONFIG.islandRadius,
  waterRadius: CONFIG.waterRadius,

  lake: {
    x: 0,
    z: 0,
    radius: 22
  },

  generation: {
    treeCount: 0,
    rockCount: 0,
    logCount: 0,
    grassCount: 0
  },

  resourceRecords: [],

  worldGroup: null,
  terrainMesh: null,
  waterMesh: null,

  treeObjects: [],
  rockObjects: [],
  logObjects: [],
  grassObjects: [],

  resourceObjects: [],

  resourceMap: new Map(),

  worldSeed: null,

  lastPlayerPosition: new THREE.Vector3(),

  initialized: false
};

// ------------------------------------------------------------
// SEEDED RANDOM
// ------------------------------------------------------------

function hashString(value) {
  let hash = 2166136261;

  const text = String(value);

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;

    t = Math.imul(
      t ^ (t >>> 15),
      t | 1
    );

    t ^= t +
      Math.imul(
        t ^ (t >>> 7),
        t | 61
      );

    return (
      (t ^ (t >>> 14)) >>> 0
    ) / 4294967296;
  };
}

function createSeedRandom(seed) {
  return mulberry32(
    hashString(seed)
  );
}

// ------------------------------------------------------------
// SEED
// ------------------------------------------------------------

export function ensureSeed(seed = null) {
  if (seed !== null && seed !== undefined) {
    state.seed = String(seed);
  }

  if (!state.seed) {
    state.seed =
      GAME.world?.seed ||
      generateReadableSeed();
  }

  setWorldSeed(state.seed);

  return state.seed;
}

function generateReadableSeed() {
  const names = [
    "Oak",
    "Pine",
    "Cedar",
    "River",
    "Meadow",
    "Stone",
    "Wild",
    "Forest",
    "Sunny",
    "Moon",
    "Island",
    "Lake"
  ];

  const name =
    names[
      Math.floor(
        Math.random() * names.length
      )
    ];

  const number =
    Math.floor(
      100000 +
      Math.random() * 900000
    );

  return `${name}-${number}`;
}

export function getWorldSeed() {
  return state.seed || GAME.world.seed;
}

// ------------------------------------------------------------
// NOISE / TERRAIN
// ------------------------------------------------------------

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function valueNoise2D(x, z, seed) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);

  const x1 = x0 + 1;
  const z1 = z0 + 1;

  const fx = smoothstep(x - x0);
  const fz = smoothstep(z - z0);

  function randomAt(ix, iz) {
    const hash =
      hashString(
        `${seed}:${ix}:${iz}`
      );

    return (
      hash / 4294967295
    );
  }

  const a = randomAt(x0, z0);
  const b = randomAt(x1, z0);
  const c = randomAt(x0, z1);
  const d = randomAt(x1, z1);

  const ab = lerp(a, b, fx);
  const cd = lerp(c, d, fx);

  return lerp(ab, cd, fz);
}

function fractalNoise(
  x,
  z,
  seed,
  octaves = 4
) {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let normalization = 0;

  for (
    let i = 0;
    i < octaves;
    i++
  ) {
    total +=
      valueNoise2D(
        x * frequency,
        z * frequency,
        `${seed}-${i}`
      ) * amplitude;

    normalization += amplitude;

    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / normalization;
}

// ------------------------------------------------------------
// TERRAIN HEIGHT
// ------------------------------------------------------------

export function getTerrainHeight(x, z) {
  const distance =
    Math.sqrt(
      x * x +
      z * z
    );

  if (
    distance >
    state.islandRadius
  ) {
    return CONFIG.waterHeight;
  }

  const normalized =
    distance /
    state.islandRadius;

  const edgeFade =
    1 -
    Math.pow(
      normalized,
      3.2
    );

  const broadNoise =
    fractalNoise(
      x * 0.018,
      z * 0.018,
      state.seed,
      4
    );

  const detailNoise =
    fractalNoise(
      x * 0.06,
      z * 0.06,
      `${state.seed}-detail`,
      3
    );

  let height =
    broadNoise * 5.5 +
    detailNoise * 1.6;

  height *= edgeFade;

  // Keep the central lake lower.
  const lakeDistance =
    Math.sqrt(
      (x - state.lake.x) ** 2 +
      (z - state.lake.z) ** 2
    );

  if (
    lakeDistance <
    state.lake.radius + 4
  ) {
    const lakeFactor =
      1 -
      lakeDistance /
      (state.lake.radius + 4);

    height -=
      lakeFactor * 3.5;
  }

  return Math.max(
    0,
    height
  );
}

// ------------------------------------------------------------
// LAKE
// ------------------------------------------------------------

function generateLake(random) {
  const angle =
    random() *
    Math.PI *
    2;

  const distance =
    random() * 18;

  const radius =
    CONFIG.lakeMinRadius +
    random() *
      (
        CONFIG.lakeMaxRadius -
        CONFIG.lakeMinRadius
      );

  state.lake.x =
    Math.cos(angle) *
    distance;

  state.lake.z =
    Math.sin(angle) *
    distance;

  state.lake.radius =
    radius;
}

export function getLake() {
  return {
    ...state.lake
  };
}

// ------------------------------------------------------------
// ISLAND CHECK
// ------------------------------------------------------------

export function getIslandRadius() {
  return state.islandRadius;
}

export function getWaterRadius() {
  return state.waterRadius;
}

export function isLandPosition(x, z) {
  const distance =
    Math.sqrt(
      x * x +
      z * z
    );

  if (
    distance >
    state.islandRadius -
    CONFIG.resourceSpawnMargin
  ) {
    return false;
  }

  const lakeDistance =
    Math.sqrt(
      (x - state.lake.x) ** 2 +
      (z - state.lake.z) ** 2
    );

  if (
    lakeDistance <
    state.lake.radius +
    CONFIG.treeMinDistanceFromLake
  ) {
    return false;
  }

  return true;
}

// ------------------------------------------------------------
// RESOURCE ID
// ------------------------------------------------------------

function createResourceId(
  type,
  index
) {
  return (
    `${state.seed}` +
    `:${type}` +
    `:${index}`
  );
}

// ------------------------------------------------------------
// RESOURCE PLACEMENT
// ------------------------------------------------------------

function randomLandPosition(
  random,
  minimumDistance = 5
) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      minimumDistance +
      random() *
      (
        state.islandRadius -
        minimumDistance -
        CONFIG.resourceSpawnMargin
      );

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      isLandPosition(x, z)
    ) {
      return {
        x,
        z
      };
    }
  }

  return {
    x: 0,
    z: 0
  };
}

function tooCloseToSpawn(
  x,
  z
) {
  const distance =
    Math.sqrt(
      x * x +
      z * z
    );

  return (
    distance <
    CONFIG.spawnClearRadius
  );
}

function createResourceRecord(
  type,
  index,
  position
) {
  const id =
    createResourceId(
      type,
      index
    );

  const record = {
    id,

    type,

    x: position.x,

    y: getTerrainHeight(
      position.x,
      position.z
    ),

    z: position.z,

    depleted: false,

    gathered: false
  };

  state.resourceRecords.push(
    record
  );

  return record;
}

// ------------------------------------------------------------
// TREE
// ------------------------------------------------------------

function createTree(record, random) {
  const group =
    new THREE.Group();

  group.name =
    `Tree_${record.id}`;

  group.position.set(
    record.x,
    record.y,
    record.z
  );

  const trunkHeight =
    2.8 +
    random() * 1.7;

  const trunkRadius =
    0.25 +
    random() * 0.12;

  const trunkGeometry =
    new THREE.CylinderGeometry(
      trunkRadius * 0.8,
      trunkRadius,
      trunkHeight,
      8
    );

  const trunkMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x5b3820,
      roughness: 0.95
    });

  const trunk =
    new THREE.Mesh(
      trunkGeometry,
      trunkMaterial
    );

  trunk.position.y =
    trunkHeight / 2;

  trunk.castShadow = true;
  trunk.receiveShadow = true;

  group.add(trunk);

  const leafMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x39734a,
      roughness: 0.9
    });

  const crownOne =
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        1.4 +
        random() * 0.4,
        1
      ),
      leafMaterial
    );

  crownOne.position.y =
    trunkHeight + 0.9;

  crownOne.scale.set(
    1.1,
    1.2,
    1.1
  );

  crownOne.castShadow = true;

  group.add(crownOne);

  const crownTwo =
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        1.05 +
        random() * 0.3,
        1
      ),
      leafMaterial
    );

  crownTwo.position.set(
    -0.55,
    trunkHeight + 1.8,
    0.15
  );

  crownTwo.castShadow = true;

  group.add(crownTwo);

  group.userData = {
    resource: true,
    resourceType: "tree",
    id: record.id,
    type: "tree",
    gathered: record.gathered,
    depleted: record.depleted,
    originalPosition: {
      x: record.x,
      y: record.y,
      z: record.z
    }
  };

  return group;
}

// ------------------------------------------------------------
// ROCK
// ------------------------------------------------------------

function createRock(record, random) {
  const size =
    0.35 +
    random() * 0.55;

  const geometry =
    new THREE.IcosahedronGeometry(
      size,
      1
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 1
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.name =
    `Rock_${record.id}`;

  mesh.position.set(
    record.x,
    record.y + size * 0.35,
    record.z
  );

  mesh.rotation.set(
    random() * 2,
    random() * 2,
    random() * 2
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData = {
    resource: true,
    resourceType: "rock",
    id: record.id,
    type: "rock",
    gathered: record.gathered,
    depleted: record.depleted,
    originalPosition: {
      x: record.x,
      y: record.y,
      z: record.z
    }
  };

  return mesh;
}

// ------------------------------------------------------------
// LOG
// ------------------------------------------------------------

function createLog(record, random) {
  const length =
    2 +
    random() * 1.8;

  const radius =
    0.22 +
    random() * 0.12;

  const geometry =
    new THREE.CylinderGeometry(
      radius,
      radius * 1.08,
      length,
      8
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x704528,
      roughness: 1
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.name =
    `Log_${record.id}`;

  mesh.position.set(
    record.x,
    record.y + radius,
    record.z
  );

  mesh.rotation.z =
    Math.PI / 2;

  mesh.rotation.y =
    random() * Math.PI;

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData = {
    resource: true,
    resourceType: "log",
    id: record.id,
    type: "log",
    gathered: record.gathered,
    depleted: record.depleted,
    originalPosition: {
      x: record.x,
      y: record.y,
      z: record.z
    }
  };

  return mesh;
}

// ------------------------------------------------------------
// GRASS
// ------------------------------------------------------------

function createGrass(random) {
  const group =
    new THREE.Group();

  const count =
    state.generation.grassCount;

  const geometry =
    new THREE.ConeGeometry(
      0.045,
      0.35,
      3
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x5d8a49,
      roughness: 1
    });

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const position =
      randomLandPosition(
        random,
        4
      );

    const y =
      getTerrainHeight(
        position.x,
        position.z
      );

    const blade =
      new THREE.Mesh(
        geometry,
        material
      );

    blade.position.set(
      position.x,
      y,
      position.z
    );

    blade.rotation.y =
      random() *
      Math.PI;

    blade.scale.y =
      0.6 +
      random() * 1.3;

    group.add(blade);
  }

  return group;
}

// ------------------------------------------------------------
// TERRAIN
// ------------------------------------------------------------

function createTerrain() {
  const geometry =
    new THREE.PlaneGeometry(
      state.islandRadius * 2,
      state.islandRadius * 2,
      CONFIG.terrainSegments,
      CONFIG.terrainSegments
    );

  geometry.rotateX(
    -Math.PI / 2
  );

  const positions =
    geometry.attributes.position;

  for (
    let i = 0;
    i < positions.count;
    i++
  ) {
    const x =
      positions.getX(i);

    const z =
      positions.getZ(i);

    positions.setY(
      i,
      getTerrainHeight(x, z)
    );
  }

  geometry.computeVertexNormals();

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x47734b,
      roughness: 1,
      metalness: 0
    });

  const terrain =
    new THREE.Mesh(
      geometry,
      material
    );

  terrain.name =
    "ProceduralIslandTerrain";

  terrain.receiveShadow = true;

  return terrain;
}

// ------------------------------------------------------------
// WATER
// ------------------------------------------------------------

function createWater() {
  const size =
    state.waterRadius * 2;

  const geometry =
    new THREE.CircleGeometry(
      size,
      96
    );

  geometry.rotateX(
    -Math.PI / 2
  );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x2f7f91,
      transparent: true,
      opacity: 0.72,
      roughness: 0.18,
      metalness: 0.05
    });

  const water =
    new THREE.Mesh(
      geometry,
      material
    );

  water.name =
    "ProceduralWater";

  water.position.set(
    0,
    CONFIG.waterHeight,
    0
  );

  water.userData.isWater = true;

  return water;
}

// ------------------------------------------------------------
// RESOURCE ARRAYS
// ------------------------------------------------------------

function clearResourceArrays() {
  state.treeObjects.length = 0;
  state.rockObjects.length = 0;
  state.logObjects.length = 0;
  state.grassObjects.length = 0;
  state.resourceObjects.length = 0;

  state.resourceMap.clear();

  state.resourceRecords.length = 0;
}

// ------------------------------------------------------------
// REMOVE OLD WORLD
// ------------------------------------------------------------

function disposeObject(object) {
  if (!object) return;

  object.traverse(child => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(
          material => material.dispose()
        );
      } else {
        child.material.dispose();
      }
    }
  });
}

function clearWorld() {
  if (
    state.worldGroup &&
    S.scene
  ) {
    S.scene.remove(
      state.worldGroup
    );

    disposeObject(
      state.worldGroup
    );
  }

  state.worldGroup = null;
  state.terrainMesh = null;
  state.waterMesh = null;

  clearResourceArrays();

  state.generated = false;
}

// ------------------------------------------------------------
// GENERATE RESOURCES
// ------------------------------------------------------------

function generateTrees(random) {
  const count =
    Math.floor(
      CONFIG.treeMin +
      random() *
        (
          CONFIG.treeMax -
          CONFIG.treeMin +
          1
        )
    );

  state.generation.treeCount =
    count;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    let position =
      randomLandPosition(
        random,
        12
      );

    if (
      tooCloseToSpawn(
        position.x,
        position.z
      )
    ) {
      i--;
      continue;
    }

    const record =
      createResourceRecord(
        "tree",
        i,
        position
      );

    const tree =
      createTree(
        record,
        random
      );

    state.treeObjects.push(
      tree
    );

    state.resourceObjects.push(
      tree
    );

    state.resourceMap.set(
      record.id,
      tree
    );

    state.worldGroup.add(
      tree
    );
  }
}

function generateRocks(random) {
  const count =
    Math.floor(
      CONFIG.rockMin +
      random() *
        (
          CONFIG.rockMax -
          CONFIG.rockMin +
          1
        )
    );

  state.generation.rockCount =
    count;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const position =
      randomLandPosition(
        random,
        7
      );

    const record =
      createResourceRecord(
        "rock",
        i,
        position
      );

    const rock =
      createRock(
        record,
        random
      );

    state.rockObjects.push(
      rock
    );

    state.resourceObjects.push(
      rock
    );

    state.resourceMap.set(
      record.id,
      rock
    );

    state.worldGroup.add(
      rock
    );
  }
}

function generateLogs(random) {
  const count =
    Math.floor(
      CONFIG.logMin +
      random() *
        (
          CONFIG.logMax -
          CONFIG.logMin +
          1
        )
    );

  state.generation.logCount =
    count;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const position =
      randomLandPosition(
        random,
        8
      );

    const record =
      createResourceRecord(
        "log",
        i,
        position
      );

    const log =
      createLog(
        record,
        random
      );

    state.logObjects.push(
      log
    );

    state.resourceObjects.push(
      log
    );

    state.resourceMap.set(
      record.id,
      log
    );

    state.worldGroup.add(
      log
    );
  }
}

function generateGrass(random) {
  const count =
    Math.floor(
      CONFIG.grassMin +
      random() *
        (
          CONFIG.grassMax -
          CONFIG.grassMin +
          1
        )
    );

  state.generation.grassCount =
    count;

  const grass =
    createGrass(random);

  state.grassObjects.push(
    grass
  );

  state.worldGroup.add(
    grass
  );
}

// ------------------------------------------------------------
// LIGHTING
// ------------------------------------------------------------

function createWorldLighting() {
  const ambient =
    new THREE.HemisphereLight(
      0xbfe6ff,
      0x35512d,
      1.5
    );

  ambient.name =
    "WorldAmbientLight";

  const sun =
    new THREE.DirectionalLight(
      0xfff0c4,
      2.2
    );

  sun.name =
    "WorldSun";

  sun.position.set(
    35,
    65,
    25
  );

  sun.castShadow = true;

  sun.shadow.mapSize.width =
    2048;

  sun.shadow.mapSize.height =
    2048;

  sun.shadow.camera.left =
    -100;

  sun.shadow.camera.right =
    100;

  sun.shadow.camera.top =
    100;

  sun.shadow.camera.bottom =
    -100;

  state.worldGroup.add(
    ambient
  );

  state.worldGroup.add(
    sun
  );

  S.worldSun =
    sun;

  S.worldAmbient =
    ambient;
}

// ------------------------------------------------------------
// SPAWN
// ------------------------------------------------------------

function findSafeSpawn() {
  const candidates = [
    { x: 0, z: 0 },
    { x: 12, z: 0 },
    { x: -12, z: 0 },
    { x: 0, z: 12 },
    { x: 0, z: -12 },
    { x: 18, z: 18 },
    { x: -18, z: -18 }
  ];

  for (const candidate of candidates) {
    if (
      isLandPosition(
        candidate.x,
        candidate.z
      )
    ) {
      return candidate;
    }
  }

  return {
    x: 0,
    z: 0
  };
}

function placePlayerAtSpawn() {
  const spawn =
    findSafeSpawn();

  const y =
    getTerrainHeight(
      spawn.x,
      spawn.z
    ) +
    CONSTANTS_PLAYER_HEIGHT();

  setPlayerPosition(
    spawn.x,
    y,
    spawn.z
  );

  if (S?.playerGroup) {
    S.playerGroup.rotation.y = 0;
  }
}

function CONSTANTS_PLAYER_HEIGHT() {
  return 1.65;
}

// ------------------------------------------------------------
// WORLD GENERATION
// ------------------------------------------------------------

export async function generateWorld(
  seed = null,
  options = {}
) {
  const preservePlayer =
    options.preservePlayer === true;

  const oldPosition = {
    x: GAME.position.x,
    y: GAME.position.y,
    z: GAME.position.z,
    rotationY:
      GAME.position.rotationY
  };

  ensureSeed(seed);

  const random =
    createSeedRandom(
      state.seed
    );

  state.worldSeed =
    random;

  // Same seed always produces the same lake.
  generateLake(random);

  clearWorld();

  if (!S.scene) {
    throw new Error(
      "SurvivalVR.scene is not available."
    );
  }

  state.worldGroup =
    new THREE.Group();

  state.worldGroup.name =
    "ProceduralSurvivalIsland";

  // Terrain
  state.terrainMesh =
    createTerrain();

  state.worldGroup.add(
    state.terrainMesh
  );

  // Water
  state.waterMesh =
    createWater();

  state.waterMesh.position.set(
    state.lake.x,
    CONFIG.waterHeight,
    state.lake.z
  );

  state.worldGroup.add(
    state.waterMesh
  );

  // Resources
  generateTrees(random);
  generateRocks(random);
  generateLogs(random);
  generateGrass(random);

  // Lighting
  createWorldLighting();

  S.scene.add(
    state.worldGroup
  );

  state.generated = true;

  // Expose data for other systems.
  S.world = state.worldGroup;

  S.worldData = {
    seed: state.seed,

    islandRadius:
      state.islandRadius,

    waterRadius:
      state.waterRadius,

    lake: {
      ...state.lake
    },

    generation: {
      ...state.generation
    }
  };

  S.resources =
    state.resourceObjects;

  S.worldResources =
    state.resourceRecords;

  // Keep existing player position when loading.
  if (preservePlayer) {
    setPlayerPosition(
      oldPosition.x,
      oldPosition.y,
      oldPosition.z
    );

    GAME.position.rotationY =
      oldPosition.rotationY;

    if (S?.playerGroup) {
      S.playerGroup.rotation.y =
        oldPosition.rotationY;
    }
  } else {
    placePlayerAtSpawn();
  }

  setWorldSeed(
    state.seed
  );

  setWorldName(
    `Island ${state.seed}`
  );

  gameEvent("world-generated", {
    seed: state.seed,

    islandRadius:
      state.islandRadius,

    lake: {
      ...state.lake
    },

    generation: {
      ...state.generation
    }
  });

  return getWorldData();
}

// ------------------------------------------------------------
// NEW WORLD
// ------------------------------------------------------------

export async function createNewWorld(
  seed = null
) {
  const newSeed =
    seed ||
    generateReadableSeed();

  // Reset the core game state first.
  if (S?.createNewWorld) {
    S.createNewWorld(
      newSeed
    );
  }

  // If the game core called this method recursively,
  // ensureSeed still protects us.
  ensureSeed(newSeed);

  return generateWorld(
    newSeed,
    {
      preservePlayer: false
    }
  );
}

// ------------------------------------------------------------
// RESOURCE GATHERING
// ------------------------------------------------------------

function findResourceRecord(
  id
) {
  return state.resourceRecords.find(
    record =>
      record.id === id
  );
}

export function gatherNearestResource(
  type = null,
  maxDistance = 3
) {
  if (!S?.playerGroup) {
    return null;
  }

  const playerPosition =
    S.playerGroup.position;

  let closest = null;
  let closestDistance =
    maxDistance;

  for (
    const object
    of state.resourceObjects
  ) {
    if (!object.visible) {
      continue;
    }

    const data =
      object.userData || {};

    if (
      type &&
      data.resourceType !== type
    ) {
      continue;
    }

    const distance =
      playerPosition.distanceTo(
        object.position
      );

    if (
      distance <
      closestDistance
    ) {
      closest =
        object;

      closestDistance =
        distance;
    }
  }

  if (!closest) {
    return null;
  }

  const data =
    closest.userData || {};

  const record =
    findResourceRecord(
      data.id
    );

  if (!record) {
    return null;
  }

  if (
    record.depleted ||
    data.depleted
  ) {
    return null;
  }

  // Resource reward.
  switch (record.type) {
    case "tree":
      gatherResource(
        "tree",
        3
      );

      break;

    case "rock":
      gatherResource(
        "rock",
        2
      );

      break;

    case "log":
      gatherResource(
        "log",
        1
      );

      break;

    default:
      gatherResource(
        record.type,
        1
      );
  }

  // Mark it depleted.
  record.depleted = true;
  record.gathered = true;

  data.depleted = true;
  data.gathered = true;

  // Hide rather than destroy it.
  // This allows the save system to remember it.
  closest.visible = false;

  gameEvent("resource-gathered", {
    id: record.id,
    type: record.type,
    x: record.x,
    y: record.y,
    z: record.z
  });

  return {
    id: record.id,
    type: record.type,
    amount:
      record.type === "tree"
        ? 3
        : record.type === "rock"
          ? 2
          : 1
  };
}

// ------------------------------------------------------------
// RESTORE RESOURCES FROM SAVE
// ------------------------------------------------------------

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

  for (
    const saved
    of savedResources
  ) {
    if (!saved?.id) {
      continue;
    }

    const record =
      findResourceRecord(
        saved.id
      );

    const object =
      state.resourceMap.get(
        saved.id
      );

    if (!record || !object) {
      continue;
    }

    record.gathered =
      saved.gathered === true;

    record.depleted =
      saved.depleted === true;

    object.userData =
      object.userData || {};

    object.userData.gathered =
      record.gathered;

    object.userData.depleted =
      record.depleted;

    object.visible =
      !record.depleted;
  }
}

// ------------------------------------------------------------
// RESTORE BUILDINGS SUPPORT
// ------------------------------------------------------------

export function getResourceRecords() {
  return state.resourceRecords.map(
    record => ({
      ...record
    })
  );
}

// ------------------------------------------------------------
// WORLD DATA
// ------------------------------------------------------------

export function getWorldData() {
  return {
    seed: state.seed,

    islandRadius:
      state.islandRadius,

    waterRadius:
      state.waterRadius,

    lake: {
      ...state.lake
    },

    generation: {
      ...state.generation
    }
  };
}

// ------------------------------------------------------------
// UPDATE
// ------------------------------------------------------------

export function update(
  deltaSeconds = 0
) {
  if (!state.generated) {
    return;
  }

  // Keep water slightly alive.
  if (state.waterMesh) {
    const material =
      state.waterMesh.material;

    if (
      material &&
      material.opacity !== undefined
    ) {
      material.opacity =
        0.68 +
        Math.sin(
          performance.now() *
          0.001
        ) *
        0.04;
    }
  }
}

// ------------------------------------------------------------
// REGENERATE
// ------------------------------------------------------------

export async function regenerateWorld(
  seed = null,
  options = {}
) {
  return generateWorld(
    seed || state.seed,
    {
      preservePlayer:
        options.preservePlayer !== false
    }
  );
}

// ------------------------------------------------------------
// SYSTEM REGISTRATION
// ------------------------------------------------------------

const worldSystem = {
  generateWorld,
  createNewWorld,
  regenerateWorld,

  getSeed:
    getWorldSeed,

  getWorldSeed,

  getWorldData,

  getIslandRadius,

  getWaterRadius,

  getLake,

  getTerrainHeight,

  isLandPosition,

  gatherNearestResource,

  restoreResourceState,

  getResourceRecords,

  update
};

S.systems =
  S.systems || {};

S.systems.world =
  worldSystem;

S.worldSystem =
  worldSystem;

// ------------------------------------------------------------
// GLOBAL COMPATIBILITY
// ------------------------------------------------------------

S.generateWorld =
  generateWorld;

S.createNewWorld =
  createNewWorld;

S.regenerateWorld =
  regenerateWorld;

S.getWorldSeed =
  getWorldSeed;

S.getWorldData =
  getWorldData;

S.getIslandRadius =
  getIslandRadius;

S.getLake =
  getLake;

S.getTerrainHeight =
  getTerrainHeight;

S.isLandPosition =
  isLandPosition;

S.gatherNearestResource =
  gatherNearestResource;

S.restoreResourceState =
  restoreResourceState;

S.getResourceRecords =
  getResourceRecords;

S.updateWorld =
  update;

console.log(
  "Survival VR seeded world system v4 loaded."
);