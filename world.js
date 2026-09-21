import * as THREE from "three";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR must exist before world.js loads.");
}

/* =========================================================
   WORLD STATE
========================================================= */

const state = {
  seed: "",
  worldGroup: null,
  terrain: null,
  lake: null,

  resourceObjects: [],
  resourceRecords: [],

  grassObjects: [],
  treeObjects: [],
  rockObjects: [],
  logObjects: [],

  generated: false,

  islandRadius: 70,
  waterRadius: 23,

  lakeCenter: {
    x: 8,
    z: -4
  }
};

/* =========================================================
   DETERMINISTIC SEED SYSTEM
========================================================= */

function stringToSeed(value) {
  const text =
    String(value ?? "SURVIVAL");

  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash =
      Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed) {
  let value =
    seed >>> 0;

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
      ((t ^ (t >>> 14)) >>> 0) /
      4294967296
    );
  };
}

function createSeededGenerator(seedText) {
  return seededRandom(
    stringToSeed(seedText)
  );
}

/* =========================================================
   SEEDED NOISE
========================================================= */

function hash2D(x, z, seed) {
  let h =
    stringToSeed(seed);

  h ^=
    Math.imul(
      Math.floor(x),
      374761393
    );

  h ^=
    Math.imul(
      Math.floor(z),
      668265263
    );

  h =
    Math.imul(
      h ^ (h >>> 13),
      1274126177
    );

  h ^=
    h >>> 16;

  return (
    (h >>> 0) /
    4294967295
  );
}

function smoothNoise(
  x,
  z,
  seed
) {
  const x0 =
    Math.floor(x);

  const z0 =
    Math.floor(z);

  const x1 =
    x0 + 1;

  const z1 =
    z0 + 1;

  const tx =
    x - x0;

  const tz =
    z - z0;

  const sx =
    tx * tx *
    (3 - 2 * tx);

  const sz =
    tz * tz *
    (3 - 2 * tz);

  const n00 =
    hash2D(
      x0,
      z0,
      seed
    );

  const n10 =
    hash2D(
      x1,
      z0,
      seed
    );

  const n01 =
    hash2D(
      x0,
      z1,
      seed
    );

  const n11 =
    hash2D(
      x1,
      z1,
      seed
    );

  const nx0 =
    THREE.MathUtils.lerp(
      n00,
      n10,
      sx
    );

  const nx1 =
    THREE.MathUtils.lerp(
      n01,
      n11,
      sx
    );

  return THREE.MathUtils.lerp(
    nx0,
    nx1,
    sz
  );
}

function terrainNoise(
  x,
  z,
  seed
) {
  let value = 0;
  let amplitude = 1;
  let frequency = 0.035;
  let total = 0;

  for (
    let octave = 0;
    octave < 5;
    octave++
  ) {
    value +=
      smoothNoise(
        x * frequency,
        z * frequency,
        `${seed}:${octave}`
      ) *
      amplitude;

    total += amplitude;

    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / total;
}

/* =========================================================
   TERRAIN HEIGHT
========================================================= */

function getLakeDistance(
  x,
  z
) {
  const dx =
    x -
    state.lakeCenter.x;

  const dz =
    z -
    state.lakeCenter.z;

  return Math.sqrt(
    dx * dx +
    dz * dz
  );
}

function getIslandFalloff(
  x,
  z
) {
  const distance =
    Math.sqrt(
      x * x +
      z * z
    );

  const normalized =
    distance /
    state.islandRadius;

  if (normalized >= 1) {
    return 0;
  }

  /*
   * Smooth island coastline.
   */
  const value =
    1 -
    Math.pow(
      normalized,
      2.6
    );

  return Math.max(
    0,
    value
  );
}

function getTerrainHeightAt(
  x,
  z
) {
  const island =
    getIslandFalloff(
      x,
      z
    );

  if (island <= 0) {
    return -2;
  }

  /*
   * Large hills.
   */
  const large =
    terrainNoise(
      x * 0.55,
      z * 0.55,
      state.seed
    );

  /*
   * Smaller detail.
   */
  const detail =
    terrainNoise(
      x * 1.8,
      z * 1.8,
      `${state.seed}:DETAIL`
    );

  let height =
    1.0 +
    large * 8.5 +
    detail * 2.0;

  /*
   * Lower coastline.
   */
  height *=
    0.35 +
    island * 0.75;

  /*
   * Lake basin.
   */
  const lakeDistance =
    getLakeDistance(
      x,
      z
    );

  const lakeEdge =
    state.waterRadius;

  if (
    lakeDistance <
    lakeEdge + 3
  ) {
    const normalized =
      lakeDistance /
      (lakeEdge + 3);

    const lakeBlend =
      Math.max(
        0,
        Math.min(
          1,
          normalized
        )
      );

    const basinHeight =
      -0.8 +
      terrainNoise(
        x,
        z,
        `${state.seed}:LAKE`
      ) *
      0.35;

    height =
      THREE.MathUtils.lerp(
        basinHeight,
        height,
        lakeBlend
      );
  }

  /*
   * Keep spawn area around the origin
   * reasonably flat.
   */
  const spawnDistance =
    Math.sqrt(
      x * x +
      z * z
    );

  if (
    spawnDistance < 8
  ) {
    const blend =
      spawnDistance /
      8;

    height =
      THREE.MathUtils.lerp(
        1.8,
        height,
        blend
      );
  }

  return height;
}

/* =========================================================
   MATERIALS
========================================================= */

const materials = {
  grass: new THREE.MeshStandardMaterial({
    color: 0x3e6f3c,
    roughness: 0.95
  }),

  dirt: new THREE.MeshStandardMaterial({
    color: 0x76583b,
    roughness: 1
  }),

  sand: new THREE.MeshStandardMaterial({
    color: 0xbca878,
    roughness: 0.95
  }),

  stone: new THREE.MeshStandardMaterial({
    color: 0x6d6f6c,
    roughness: 0.95
  }),

  treeTrunk: new THREE.MeshStandardMaterial({
    color: 0x5b3822,
    roughness: 0.95
  }),

  treeLeaves: new THREE.MeshStandardMaterial({
    color: 0x285c32,
    roughness: 0.9
  }),

  treeLeavesLight:
    new THREE.MeshStandardMaterial({
      color: 0x397c3c,
      roughness: 0.9
    }),

  log: new THREE.MeshStandardMaterial({
    color: 0x70472a,
    roughness: 0.95
  }),

  water: new THREE.MeshStandardMaterial({
    color: 0x2f8fa3,
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.78
  }),

  grassBlade:
    new THREE.MeshStandardMaterial({
      color: 0x4c8240,
      roughness: 1,
      side: THREE.DoubleSide
    })
};

/* =========================================================
   CLEAR WORLD
========================================================= */

function clearWorld() {
  if (
    state.worldGroup
  ) {
    S.scene.remove(
      state.worldGroup
    );
  }

  state.worldGroup =
    null;

  state.terrain =
    null;

  state.lake =
    null;

  state.resourceObjects = [];
  state.resourceRecords = [];

  state.grassObjects = [];
  state.treeObjects = [];
  state.rockObjects = [];
  state.logObjects = [];

  state.generated =
    false;

  S.resources = [];
  S.worldResources = [];
}

/* =========================================================
   TERRAIN
========================================================= */

function createTerrain() {
  const size = 150;
  const segments = 150;

  const geometry =
    new THREE.PlaneGeometry(
      size,
      size,
      segments,
      segments
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
      -positions.getY(i);

    const y =
      getTerrainHeightAt(
        x,
        z
      );

    positions.setZ(
      i,
      y
    );
  }

  geometry.computeVertexNormals();

  /*
   * Vertex colors give the island
   * some natural variation.
   */
  const colors = [];

  for (
    let i = 0;
    i < positions.count;
    i++
  ) {
    const x =
      positions.getX(i);

    const z =
      -positions.getY(i);

    const height =
      positions.getZ(i);

    const lakeDistance =
      getLakeDistance(
        x,
        z
      );

    let color;

    if (
      lakeDistance <
      state.waterRadius + 2
    ) {
      color =
        new THREE.Color(
          0xb49d70
        );
    } else if (
      height < 1.5
    ) {
      color =
        new THREE.Color(
          0x8e754e
        );
    } else if (
      height > 8
    ) {
      color =
        new THREE.Color(
          0x4b783f
        );
    } else {
      color =
        new THREE.Color(
          0x47783e
        );
    }

    /*
     * Small deterministic variation.
     */
    const variation =
      0.9 +
      hash2D(
        x,
        z,
        `${state.seed}:COLOR`
      ) *
      0.12;

    color.multiplyScalar(
      variation
    );

    colors.push(
      color.r,
      color.g,
      color.b
    );
  }

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(
      colors,
      3
    )
  );

  const material =
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0
    });

  const terrain =
    new THREE.Mesh(
      geometry,
      material
    );

  terrain.rotation.x =
    -Math.PI / 2;

  terrain.receiveShadow =
    true;

  terrain.castShadow =
    false;

  terrain.name =
    "IslandTerrain";

  state.worldGroup.add(
    terrain
  );

  state.terrain =
    terrain;
}

/* =========================================================
   LAKE
========================================================= */

function createLake() {
  const geometry =
    new THREE.CircleGeometry(
      state.waterRadius,
      96
    );

  const water =
    new THREE.Mesh(
      geometry,
      materials.water
    );

  water.rotation.x =
    -Math.PI / 2;

  water.position.set(
    state.lakeCenter.x,
    0.35,
    state.lakeCenter.z
  );

  water.name =
    "IslandLake";

  water.receiveShadow =
    true;

  state.worldGroup.add(
    water
  );

  state.lake =
    water;

  /*
   * Small shoreline ring.
   */
  const shoreGeometry =
    new THREE.RingGeometry(
      state.waterRadius - 0.2,
      state.waterRadius + 1.6,
      96
    );

  const shore =
    new THREE.Mesh(
      shoreGeometry,
      materials.sand
    );

  shore.rotation.x =
    -Math.PI / 2;

  shore.position.set(
    state.lakeCenter.x,
    0.43,
    state.lakeCenter.z
  );

  state.worldGroup.add(
    shore
  );
}

/* =========================================================
   TREE
========================================================= */

function createTree(
  x,
  z,
  scale,
  random
) {
  const group =
    new THREE.Group();

  group.name =
    "Tree";

  const ground =
    getTerrainHeightAt(
      x,
      z
    );

  /*
   * Trunk.
   */
  const trunkHeight =
    2.6 * scale;

  const trunk =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.22 * scale,
        0.34 * scale,
        trunkHeight,
        8
      ),
      materials.treeTrunk
    );

  trunk.position.y =
    ground +
    trunkHeight / 2;

  trunk.castShadow =
    true;

  trunk.receiveShadow =
    true;

  group.add(
    trunk
  );

  /*
   * Main foliage.
   */
  const foliage =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        1.55 * scale,
        3.8 * scale,
        9
      ),
      random > 0.5
        ? materials.treeLeaves
        : materials.treeLeavesLight
    );

  foliage.position.y =
    ground +
    trunkHeight +
    1.3 * scale;

  foliage.castShadow =
    true;

  foliage.receiveShadow =
    true;

  group.add(
    foliage
  );

  /*
   * Second foliage layer.
   */
  const foliage2 =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        1.15 * scale,
        2.6 * scale,
        9
      ),
      materials.treeLeaves
    );

  foliage2.position.y =
    ground +
    trunkHeight +
    2.4 * scale;

  foliage2.castShadow =
    true;

  group.add(
    foliage2
  );

  group.position.set(
    x,
    0,
    z
  );

  group.rotation.y =
    random *
    Math.PI *
    2;

  state.worldGroup.add(
    group
  );

  state.treeObjects.push(
    group
  );

  const id =
    `${state.seed}:tree:${state.treeObjects.length - 1}`;

  const record = {
    id,
    type: "tree",
    position: {
      x,
      y: ground,
      z
    },
    health: 3,
    active: true
  };

  group.userData.resourceId =
    id;

  group.userData.resourceType =
    "tree";

  state.resourceObjects.push(
    group
  );

  state.resourceRecords.push(
    record
  );

  return group;
}

/* =========================================================
   ROCK
========================================================= */

function createRock(
  x,
  z,
  scale,
  random
) {
  const ground =
    getTerrainHeightAt(
      x,
      z
    );

  const rock =
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(
        0.55 * scale,
        1
      ),
      materials.stone
    );

  rock.position.set(
    x,
    ground +
      0.35 * scale,
    z
  );

  rock.scale.y =
    randomRangeFromSeed(
      random,
      0.65,
      1.15
    );

  rock.rotation.set(
    random * 2,
    random * 3,
    random * 2
  );

  rock.castShadow =
    true;

  rock.receiveShadow =
    true;

  rock.name =
    "RockResource";

  state.worldGroup.add(
    rock
  );

  state.rockObjects.push(
    rock
  );

  const id =
    `${state.seed}:rock:${state.rockObjects.length - 1}`;

  rock.userData.resourceId =
    id;

  rock.userData.resourceType =
    "rock";

  state.resourceObjects.push(
    rock
  );

  state.resourceRecords.push({
    id,
    type: "rock",
    position: {
      x,
      y: ground,
      z
    },
    health: 3,
    active: true
  });

  return rock;
}

function randomRangeFromSeed(
  random,
  min,
  max
) {
  return (
    min +
    random *
      (max - min)
  );
}

/* =========================================================
   LOG
========================================================= */

function createLog(
  x,
  z,
  scale,
  random
) {
  const ground =
    getTerrainHeightAt(
      x,
      z
    );

  const group =
    new THREE.Group();

  const length =
    1.6 * scale;

  const log =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.20 * scale,
        0.24 * scale,
        length,
        10
      ),
      materials.log
    );

  log.rotation.z =
    Math.PI / 2;

  log.rotation.y =
    random *
    Math.PI;

  log.position.y =
    ground +
    0.25 * scale;

  log.castShadow =
    true;

  group.add(
    log
  );

  /*
   * End caps.
   */
  const capMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xb28a5d,
      roughness: 0.95
    });

  for (const side of [-1, 1]) {
    const cap =
      new THREE.Mesh(
        new THREE.CircleGeometry(
          0.20 * scale,
          12
        ),
        capMaterial
      );

    cap.rotation.y =
      Math.PI / 2;

    cap.position.x =
      side *
      length /
      2;

    cap.position.y =
      ground +
      0.25 * scale;

    group.add(
      cap
    );
  }

  group.position.set(
    x,
    0,
    z
  );

  group.rotation.y =
    random *
    Math.PI *
    2;

  state.worldGroup.add(
    group
  );

  state.logObjects.push(
    group
  );

  const id =
    `${state.seed}:log:${state.logObjects.length - 1}`;

  group.userData.resourceId =
    id;

  group.userData.resourceType =
    "log";

  state.resourceObjects.push(
    group
  );

  state.resourceRecords.push({
    id,
    type: "log",
    position: {
      x,
      y: ground,
      z
    },
    health: 1,
    active: true
  });

  return group;
}

/* =========================================================
   GRASS
========================================================= */

function createGrass(
  x,
  z,
  scale,
  random
) {
  const ground =
    getTerrainHeightAt(
      x,
      z
    );

  const geometry =
    new THREE.BufferGeometry();

  const width =
    0.06 * scale;

  const height =
    0.35 * scale;

  const vertices = new Float32Array([
    -width, 0, 0,
    width, 0, 0,
    width, height, 0,
    -width, height, 0
  ]);

  const indices = [
    0, 1, 2,
    0, 2, 3
  ];

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex(
    indices
  );

  geometry.computeVertexNormals();

  const grass =
    new THREE.Mesh(
      geometry,
      materials.grassBlade
    );

  grass.position.set(
    x,
    ground,
    z
  );

  grass.rotation.y =
    random *
    Math.PI;

  grass.castShadow =
    false;

  grass.receiveShadow =
    true;

  state.worldGroup.add(
    grass
  );

  state.grassObjects.push(
    grass
  );
}

/* =========================================================
   RESOURCE PLACEMENT
========================================================= */

function isGoodResourceLocation(
  x,
  z,
  minDistance
) {
  /*
   * Avoid lake.
   */
  if (
    getLakeDistance(
      x,
      z
    ) <
    state.waterRadius + 2
  ) {
    return false;
  }

  /*
   * Avoid center spawn.
   */
  if (
    Math.sqrt(
      x * x +
      z * z
    ) < 7
  ) {
    return false;
  }

  /*
   * Avoid island edge.
   */
  if (
    Math.sqrt(
      x * x +
      z * z
    ) >
    state.islandRadius -
      4
  ) {
    return false;
  }

  /*
   * Avoid previously created resources.
   */
  for (
    const resource of
      state.resourceRecords
  ) {
    if (
      !resource.active
    ) {
      continue;
    }

    const dx =
      x -
      resource.position.x;

    const dz =
      z -
      resource.position.z;

    if (
      Math.sqrt(
        dx * dx +
        dz * dz
      ) < minDistance
    ) {
      return false;
    }
  }

  return true;
}

function generateResources() {
  const random =
    createSeededGenerator(
      `${state.seed}:RESOURCES`
    );

  /*
   * Trees.
   */
  let treeAttempts = 0;

  while (
    state.treeObjects.length <
      90 &&
    treeAttempts <
      3000
  ) {
    treeAttempts++;

    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      8 +
      Math.sqrt(
        random()
      ) *
      55;

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isGoodResourceLocation(
        x,
        z,
        3.2
      )
    ) {
      continue;
    }

    createTree(
      x,
      z,
      0.85 +
        random() *
          0.35,
      random()
    );
  }

  /*
   * Rocks.
   */
  let rockAttempts = 0;

  while (
    state.rockObjects.length <
      60 &&
    rockAttempts <
      2500
  ) {
    rockAttempts++;

    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      6 +
      Math.sqrt(
        random()
      ) *
      57;

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isGoodResourceLocation(
        x,
        z,
        2
      )
    ) {
      continue;
    }

    createRock(
      x,
      z,
      0.75 +
        random() *
          0.65,
      random()
    );
  }

  /*
   * Logs.
   */
  let logAttempts = 0;

  while (
    state.logObjects.length <
      30 &&
    logAttempts <
      2000
  ) {
    logAttempts++;

    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      8 +
      Math.sqrt(
        random()
      ) *
      55;

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      !isGoodResourceLocation(
        x,
        z,
        2.5
      )
    ) {
      continue;
    }

    createLog(
      x,
      z,
      0.8 +
        random() *
          0.4,
      random()
    );
  }

  /*
   * Grass.
   */
  for (
    let i = 0;
    i < 500;
    i++
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const radius =
      Math.sqrt(
        random()
      ) *
      60;

    const x =
      Math.cos(angle) *
      radius;

    const z =
      Math.sin(angle) *
      radius;

    if (
      getLakeDistance(
        x,
        z
      ) <
      state.waterRadius + 1
    ) {
      continue;
    }

    if (
      Math.sqrt(
        x * x +
        z * z
      ) >
      state.islandRadius
    ) {
      continue;
    }

    createGrass(
      x,
      z,
      0.7 +
        random() *
          0.8,
      random()
    );
  }
}

/* =========================================================
   LIGHTING
========================================================= */

function createWorldLighting() {
  /*
   * Don't create a giant amount of lights.
   * Environment.js handles the day/night system.
   */
  const ambient =
    new THREE.HemisphereLight(
      0xb9d7e6,
      0x42513b,
      1.2
    );

  ambient.name =
    "WorldAmbientLight";

  state.worldGroup.add(
    ambient
  );

  const sun =
    new THREE.DirectionalLight(
      0xfff0c5,
      2.2
    );

  sun.name =
    "WorldSunLight";

  sun.position.set(
    -35,
    60,
    25
  );

  sun.castShadow =
    true;

  sun.shadow.mapSize.width =
    1024;

  sun.shadow.mapSize.height =
    1024;

  sun.shadow.camera.near =
    1;

  sun.shadow.camera.far =
    180;

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

  S.worldSun =
    sun;

  S.worldAmbient =
    ambient;
}

/* =========================================================
   RESOURCE LOOKUP
========================================================= */

function getResourceRecord(
  id
) {
  return (
    state.resourceRecords.find(
      resource =>
        resource.id === id
    ) || null
  );
}

function getResourceObject(
  id
) {
  return (
    state.resourceObjects.find(
      object =>
        object.userData?.resourceId ===
        id
    ) || null
  );
}

/* =========================================================
   RESOURCE GATHERING
========================================================= */

function gatherNearestResource(
  type = null,
  maxDistance = 3
) {
  if (
    !S.playerRig
  ) {
    return null;
  }

  const player =
    S.playerRig.position;

  let closest =
    null;

  let closestDistance =
    maxDistance;

  for (
    const record of
      state.resourceRecords
  ) {
    if (
      !record.active
    ) {
      continue;
    }

    if (
      type &&
      record.type !== type
    ) {
      continue;
    }

    const dx =
      player.x -
      record.position.x;

    const dz =
      player.z -
      record.position.z;

    const distance =
      Math.sqrt(
        dx * dx +
        dz * dz
      );

    if (
      distance <
      closestDistance
    ) {
      closest =
        record;

      closestDistance =
        distance;
    }
  }

  if (!closest) {
    return null;
  }

  /*
   * Gather result.
   */
  let result;

  if (
    closest.type === "tree"
  ) {
    result = {
      id: closest.id,
      type: "tree",
      wood: 2,
      log: 1
    };
  } else if (
    closest.type === "rock"
  ) {
    result = {
      id: closest.id,
      type: "rock",
      stone: 2
    };
  } else if (
    closest.type === "log"
  ) {
    result = {
      id: closest.id,
      type: "log",
      log: 1
    };
  } else if (
    closest.type === "grass"
  ) {
    result = {
      id: closest.id,
      type: "grass",
      fiber: 2
    };
  }

  /*
   * Update record.
   */
  closest.active =
    false;

  const object =
    getResourceObject(
      closest.id
    );

  if (object) {
    object.visible =
      false;
  }

  /*
   * Update resource statistics.
   */
  if (
    closest.type === "tree"
  ) {
    if (
      S.GAME?.resources
    ) {
      S.GAME.resources.treesCut++;
      S.GAME.resources.logsCollected++;
      S.GAME.resources.wood += 2;
    }
  }

  if (
    closest.type === "rock"
  ) {
    if (
      S.GAME?.resources
    ) {
      S.GAME.resources.rocksBroken++;
      S.GAME.resources.stone += 2;
    }
  }

  /*
   * Add inventory.
   */
  if (
    result
  ) {
    for (
      const key of [
        "wood",
        "log",
        "stone",
        "fiber"
      ]
    ) {
      if (
        result[key] &&
        typeof S.addItem ===
          "function"
      ) {
        S.addItem(
          key,
          result[key]
        );
      }
    }
  }

  if (
    typeof S.gameEvent ===
    "function"
  ) {
    S.gameEvent(
      "resource-gathered",
      result
    );
  }

  return result;
}

/* =========================================================
   RESTORE RESOURCES
========================================================= */

function restoreResourceState(
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
    const saved of
      savedResources
  ) {
    const record =
      getResourceRecord(
        saved.id
      );

    if (!record) {
      continue;
    }

    record.active =
      saved.active !== false;

    const object =
      getResourceObject(
        saved.id
      );

    if (object) {
      object.visible =
        record.active;
    }
  }
}

/* =========================================================
   WORLD GENERATION
========================================================= */

function generateWorld(
  seed,
  options = {}
) {
  const newSeed =
    String(
      seed ||
      "SURVIVAL-1"
    );

  state.seed =
    newSeed;

  clearWorld();

  /*
   * World group.
   */
  state.worldGroup =
    new THREE.Group();

  state.worldGroup.name =
    "ProceduralIslandWorld";

  S.scene.add(
    state.worldGroup
  );

  /*
   * Terrain.
   */
  createTerrain();

  /*
   * Lake.
   */
  createLake();

  /*
   * Resources.
   */
  generateResources();

  /*
   * Lighting.
   */
  createWorldLighting();

  state.generated =
    true;

  /*
   * Global world data.
   */
  S.worldData = {
    seed: state.seed,

    islandRadius:
      state.islandRadius,

    waterRadius:
      state.waterRadius,

    lakeCenter: {
      x:
        state.lakeCenter.x,

      z:
        state.lakeCenter.z
    },

    terrain:
      state.terrain,

    lake:
      state.lake
  };

  S.resources =
    state.resourceRecords;

  S.worldResources =
    state.resourceRecords;

  /*
   * Position player.
   */
  if (
    !options.preservePlayer &&
    S.playerRig
  ) {
    const spawnY =
      getTerrainHeightAt(
        0,
        0
      );

    S.playerRig.position.set(
      0,
      spawnY,
      5
    );

    S.playerRig.rotation.y =
      0;
  }

  /*
   * Notify other systems.
   */
  if (
    typeof S.gameEvent ===
    "function"
  ) {
    S.gameEvent(
      "world-generated",
      {
        seed:
          state.seed,

        islandRadius:
          state.islandRadius,

        waterRadius:
          state.waterRadius
      }
    );
  }

  return S.worldData;
}

/* =========================================================
   NEW WORLD
========================================================= */

function createNewWorld(
  seed
) {
  const newSeed =
    seed ||
    createRandomSeed();

  if (
    S.GAME?.world
  ) {
    S.GAME.world.seed =
      newSeed;
  }

  return generateWorld(
    newSeed,
    {
      preservePlayer: false
    }
  );
}

function createRandomSeed() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    result +=
      characters[
        Math.floor(
          Math.random() *
          characters.length
        )
      ];
  }

  return result;
}

/* =========================================================
   WORLD UPDATE
========================================================= */

function update(
  delta = 0.016
) {
  if (
    !state.generated
  ) {
    return;
  }

  /*
   * Small water movement.
   */
  if (
    state.lake
  ) {
    state.lake.position.y =
      0.35 +
      Math.sin(
        performance.now() *
          0.0008
      ) *
      0.025;
  }

  /*
   * Gentle grass/tree sway.
   */
  const time =
    performance.now() *
    0.001;

  for (
    let i = 0;
    i <
    state.grassObjects.length;
    i++
  ) {
    const grass =
      state.grassObjects[i];

    grass.rotation.z =
      Math.sin(
        time * 1.3 +
        i
      ) *
      0.045;
  }
}

/* =========================================================
   INITIAL SETUP
========================================================= */

function setupWorld() {
  if (
    !S.scene
  ) {
    console.error(
      "World system requires S.scene."
    );

    return;
  }

  /*
   * Don't automatically generate an
   * old world before the launch menu.
   *
   * The home system will call generateWorld()
   * when New Game or Continue is selected.
   */
  console.log(
    "Procedural world system ready."
  );
}

/* =========================================================
   GETTERS
========================================================= */

function getSeed() {
  return state.seed;
}

function getWorldGroup() {
  return state.worldGroup;
}

function getTerrainHeight(
  x,
  z
) {
  return getTerrainHeightAt(
    x,
    z
  );
}

function getLakeInfo() {
  return {
    x:
      state.lakeCenter.x,

    z:
      state.lakeCenter.z,

    radius:
      state.waterRadius
  };
}

function getResourceRecords() {
  return state.resourceRecords;
}

function isGenerated() {
  return state.generated;
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  setupWorld,
  update,

  generateWorld,
  createNewWorld,

  clearWorld,

  getSeed,
  getWorldGroup,

  getTerrainHeight,
  getTerrainHeightAt,

  getLakeInfo,

  getResourceRecords,

  gatherNearestResource,
  restoreResourceState,

  getResourceRecord,
  getResourceObject,

  isGenerated
};

export default {
  setupWorld,
  update,

  generateWorld,
  createNewWorld,

  clearWorld,

  getSeed,
  getWorldGroup,

  getTerrainHeight,
  getTerrainHeightAt,

  getLakeInfo,

  getResourceRecords,

  gatherNearestResource,
  restoreResourceState,

  getResourceRecord,
  getResourceObject,

  isGenerated
};