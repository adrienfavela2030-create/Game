// ============================================================
// SURVIVAL VR — BUILDING SYSTEM
// building.js
// ============================================================

import {
  GAME,
  addItem,
  removeItem,
  getItemCount,
  addBuildingPiece,
  gameEvent
} from "./game.js";

import {
  RECIPES
} from "./crafting.js";


// ============================================================
// SURVIVAL VR
// ============================================================

const S =
  window.SurvivalVR;


// ============================================================
// THREE
// ============================================================

const THREE =
  S.THREE;


// ============================================================
// BUILDABLES
// ============================================================

const BUILDABLES = {

  woodFloor: {

    name: "Wood Floor",

    description:
      "A basic wooden floor.",

    recipe:
      "woodFloor",

    category:
      "structure"

  },


  woodWall: {

    name: "Wood Wall",

    description:
      "A wooden wall for your shelter.",

    recipe:
      "woodWall",

    category:
      "structure"

  },


  woodDoor: {

    name: "Wood Door",

    description:
      "A wooden doorway.",

    recipe:
      "woodDoor",

    category:
      "structure"

  },


  campfire: {

    name: "Campfire",

    description:
      "Provides light and warmth.",

    recipe:
      "campfire",

    category:
      "survival"

  },


  storageBox: {

    name: "Storage Box",

    description:
      "A place to store your items.",

    recipe:
      "storageBox",

    category:
      "storage"

  }

};


// ============================================================
// SYSTEM STATE
// ============================================================

const state = {

  active: false,

  initialized: false,

  selectedBuilding:
    "woodFloor",

  rotation: 0,

  gridSize:
    0.5,

  placementDistance:
    3.2,

  cooldown: 0,

  ghost: null,

  validPlacement: false,

  ui: null,

  buttons: {},

  campfires: [],

  storageBoxes: [],

  placedObjects: []

};


// ============================================================
// MATERIAL HELPERS
// ============================================================

function createMaterial(
  color,
  transparent = false,
  opacity = 1
) {

  return new THREE.MeshStandardMaterial({

    color,

    roughness:
      0.82,

    metalness:
      0.02,

    transparent,

    opacity,

    depthWrite:
      !transparent

  });

}


// ============================================================
// WORLD DATA
// ============================================================

function getWorldData() {

  return (
    S.worldData ||
    S.systems.world?.getWorldData?.() ||
    null
  );

}


// ============================================================
// ISLAND RADIUS
// ============================================================

function getIslandRadius() {

  const data =
    getWorldData();


  if (
    data &&
    Number.isFinite(
      Number(
        data.islandRadius
      )
    )
  ) {

    return Number(
      data.islandRadius
    );

  }


  if (
    S.systems.world?.getIslandRadius
  ) {

    const radius =
      Number(
        S.systems.world
          .getIslandRadius()
      );

    if (
      Number.isFinite(
        radius
      )
    ) {

      return radius;

    }

  }


  // Safe fallback for old worlds.
  return 27;

}


// ============================================================
// LAKE DATA
// ============================================================

function getLakeData() {

  const data =
    getWorldData();


  if (
    data?.lake
  ) {

    return {

      x:
        Number(
          data.lake.x
        ) || 0,

      z:
        Number(
          data.lake.z
        ) || 0,

      radius:
        Number(
          data.lake.radius
        ) || 0

    };

  }


  if (
    S.systems.world?.getLake
  ) {

    const lake =
      S.systems.world
        .getLake();


    if (
      lake
    ) {

      return {

        x:
          Number(
            lake.x
          ) || 0,

        z:
          Number(
            lake.z
          ) || 0,

        radius:
          Number(
            lake.radius
          ) || 0

      };

    }

  }


  return {

    x: 9,

    z: -7,

    radius: 9

  };

}


// ============================================================
// TERRAIN HEIGHT
// ============================================================

function getTerrainHeight(
  x,
  z
) {

  if (
    S.systems.world?.getTerrainHeight
  ) {

    const height =
      Number(
        S.systems.world
          .getTerrainHeight(
            x,
            z
          )
      );


    if (
      Number.isFinite(
        height
      )
    ) {

      return height;

    }

  }


  return 0;

}


// ============================================================
// SNAP POSITION
// ============================================================

function snap(
  value
) {

  return Math.round(
    value /
    state.gridSize
  ) *
  state.gridSize;

}


// ============================================================
// PLAYER POSITION
// ============================================================

function getPlayerPosition() {

  if (
    S.playerGroup
  ) {

    return S.playerGroup.position;

  }


  return new THREE.Vector3(
    GAME.position.x,
    GAME.position.y,
    GAME.position.z
  );

}


// ============================================================
// CAMERA
// ============================================================

function getCamera() {

  return S.camera;

}


// ============================================================
// PLACEMENT POSITION
// ============================================================

function getPlacementPosition() {

  const camera =
    getCamera();


  if (
    !camera
  ) {
    return null;
  }


  const direction =
    new THREE.Vector3(
      0,
      0,
      -1
    );


  direction.applyQuaternion(
    camera.getWorldQuaternion(
      new THREE.Quaternion()
    )
  );


  const player =
    getPlayerPosition();


  const position =
    player.clone()
      .add(
        direction.multiplyScalar(
          state.placementDistance
        )
      );


  position.x =
    snap(
      position.x
    );

  position.z =
    snap(
      position.z
    );


  position.y =
    getTerrainHeight(
      position.x,
      position.z
    );


  return position;

}


// ============================================================
// BUILDING SIZE
// ============================================================

function getBuildingSize(
  type
) {

  switch (
    type
  ) {

    case "woodFloor":

      return {
        x: 2.0,
        y: 0.15,
        z: 2.0
      };


    case "woodWall":

      return {
        x: 2.0,
        y: 2.2,
        z: 0.18
      };


    case "woodDoor":

      return {
        x: 2.0,
        y: 2.2,
        z: 0.22
      };


    case "campfire":

      return {
        x: 1.2,
        y: 0.7,
        z: 1.2
      };


    case "storageBox":

      return {
        x: 1.4,
        y: 1.0,
        z: 0.9
      };


    default:

      return {
        x: 1,
        y: 1,
        z: 1
      };

  }

}


// ============================================================
// CHECK ISLAND
// ============================================================

function isInsideIsland(
  position,
  padding = 1
) {

  const radius =
    getIslandRadius();


  const distance =
    Math.sqrt(
      position.x *
        position.x +
      position.z *
        position.z
    );


  return (
    distance <
    radius -
    padding
  );

}


// ============================================================
// CHECK LAKE
// ============================================================

function isInsideLake(
  position,
  padding = 0
) {

  const lake =
    getLakeData();


  if (
    !lake ||
    lake.radius <= 0
  ) {

    return false;

  }


  const dx =
    position.x -
    lake.x;

  const dz =
    position.z -
    lake.z;


  const distance =
    Math.sqrt(
      dx * dx +
      dz * dz
    );


  return (
    distance <
    lake.radius +
    padding
  );

}


// ============================================================
// CHECK MATERIALS
// ============================================================

function getRecipe(
  type
) {

  const buildable =
    BUILDABLES[type];


  if (
    !buildable
  ) {
    return null;
  }


  return (
    RECIPES[
      buildable.recipe
    ] ||
    null
  );

}


// ============================================================
// CAN AFFORD
// ============================================================

function canAfford(
  type
) {

  const recipe =
    getRecipe(
      type
    );


  if (
    !recipe
  ) {

    return false;

  }


  if (
    GAME.crafting &&
    Array.isArray(
      GAME.crafting
        .unlockedRecipes
    )
  ) {

    if (
      !GAME.crafting
        .unlockedRecipes
        .includes(
          recipe.id
        )
    ) {

      return false;

    }

  }


  const ingredients =
    recipe.ingredients ||
    {};


  for (
    const [
      item,
      amount
    ]
    of Object.entries(
      ingredients
    )
  ) {

    if (
      getItemCount(
        item
      ) <
      amount
    ) {

      return false;

    }

  }


  return true;

}


// ============================================================
// CONSUME MATERIALS
// ============================================================

function consumeMaterials(
  type
) {

  const recipe =
    getRecipe(
      type
    );


  if (
    !recipe
  ) {

    return false;

  }


  if (
    !canAfford(
      type
    )
  ) {

    return false;

  }


  const removed = [];


  try {

    for (
      const [
        item,
        amount
      ]
      of Object.entries(
        recipe.ingredients ||
        {}
      )
    ) {

      if (
        !removeItem(
          item,
          amount
        )
      ) {

        // Restore anything already removed.
        for (
          const oldItem
          of removed
        ) {

          addItem(
            oldItem.item,
            oldItem.amount
          );

        }

        return false;

      }


      removed.push({

        item,

        amount

      });

    }


    return true;

  } catch (
    error
  ) {

    for (
      const oldItem
      of removed
    ) {

      addItem(
        oldItem.item,
        oldItem.amount
      );

    }

    console.error(
      "[Building] Material error:",
      error
    );

    return false;

  }

}


// ============================================================
// OVERLAP CHECK
// ============================================================

function checkOverlap(
  position,
  type
) {

  const size =
    getBuildingSize(
      type
    );


  const halfX =
    size.x / 2;

  const halfZ =
    size.z / 2;


  for (
    const object
    of state.placedObjects
  ) {

    if (
      !object ||
      !object.position
    ) {
      continue;
    }


    const otherSize =
      getBuildingSize(
        object.type
      );


    const otherHalfX =
      otherSize.x / 2;

    const otherHalfZ =
      otherSize.z / 2;


    const overlapX =
      Math.abs(
        position.x -
        object.position.x
      ) <
      halfX +
      otherHalfX -
      0.05;


    const overlapZ =
      Math.abs(
        position.z -
        object.position.z
      ) <
      halfZ +
      otherHalfZ -
      0.05;


    if (
      overlapX &&
      overlapZ
    ) {

      /*
       * Floors are allowed to connect
       * to other floors.
       */
      if (
        type ===
        "woodFloor" &&
        object.type ===
        "woodFloor"
      ) {

        continue;

      }


      return true;

    }

  }


  return false;

}


// ============================================================
// VALIDATE POSITION
// ============================================================

function validatePosition(
  position,
  type
) {

  if (
    !position
  ) {

    return {

      valid: false,

      reason:
        "No placement position"

    };

  }


  const size =
    getBuildingSize(
      type
    );


  const islandPadding =
    Math.max(
      size.x,
      size.z
    ) / 2;


  if (
    !isInsideIsland(
      position,
      islandPadding
    )
  ) {

    return {

      valid: false,

      reason:
        "Too close to the edge"

    };

  }


  const lakePadding =
    Math.max(
      size.x,
      size.z
    ) / 2;


  if (
    isInsideLake(
      position,
      lakePadding
    )
  ) {

    return {

      valid: false,

      reason:
        "Cannot build in water"

    };

  }


  if (
    checkOverlap(
      position,
      type
    )
  ) {

    return {

      valid: false,

      reason:
        "Building overlaps another structure"

    };

  }


  if (
    !canAfford(
      type
    )
  ) {

    return {

      valid: false,

      reason:
        "Not enough materials"

    };

  }


  return {

    valid: true,

    reason:
      ""

  };

}


// ============================================================
// CREATE FLOOR
// ============================================================

function createFloor() {

  const group =
    new THREE.Group();


  const material =
    createMaterial(
      0x76512f
    );


  const geometry =
    new THREE.BoxGeometry(
      2,
      0.15,
      2
    );


  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );


  mesh.castShadow =
    true;

  mesh.receiveShadow =
    true;


  group.add(
    mesh
  );


  // Small plank lines.
  for (
    let i = -3;
    i <= 3;
    i++
  ) {

    const line =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.025,
          0.012,
          1.94
        ),
        createMaterial(
          0x3e2918
        )
      );


    line.position.x =
      i * 0.28;

    line.position.y =
      0.081;


    group.add(
      line
    );

  }


  return group;

}


// ============================================================
// CREATE WALL
// ============================================================

function createWall() {

  const group =
    new THREE.Group();


  const material =
    createMaterial(
      0x795331
    );


  const postMaterial =
    createMaterial(
      0x4c321e
    );


  const wall =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        2,
        2.2,
        0.18
      ),
      material
    );


  wall.position.y =
    1.1;

  wall.castShadow =
    true;

  wall.receiveShadow =
    true;


  group.add(
    wall
  );


  const postGeometry =
    new THREE.BoxGeometry(
      0.16,
      2.35,
      0.24
    );


  for (
    const x of [
      -0.92,
      0.92
    ]
  ) {

    const post =
      new THREE.Mesh(
        postGeometry,
        postMaterial
      );


    post.position.set(
      x,
      1.17,
      0
    );


    post.castShadow =
      true;


    group.add(
      post
    );

  }


  return group;

}


// ============================================================
// CREATE DOOR
// ============================================================

function createDoor() {

  const group =
    new THREE.Group();


  const frameMaterial =
    createMaterial(
      0x4a301d
    );


  const doorMaterial =
    createMaterial(
      0x714b2c
    );


  const door =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.75,
        2.05,
        0.16
      ),
      doorMaterial
    );


  door.position.y =
    1.03;

  door.castShadow =
    true;


  group.add(
    door
  );


  const leftFrame =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.15,
        2.3,
        0.25
      ),
      frameMaterial
    );


  leftFrame.position.set(
    -0.92,
    1.15,
    0
  );


  group.add(
    leftFrame
  );


  const rightFrame =
    leftFrame.clone();


  rightFrame.position.x =
    0.92;


  group.add(
    rightFrame
  );


  const topFrame =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.98,
        0.15,
        0.25
      ),
      frameMaterial
    );


  topFrame.position.set(
    0,
    2.25,
    0
  );


  group.add(
    topFrame
  );


  const handle =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.07,
        10,
        10
      ),
      createMaterial(
        0xd0a84b
      )
    );


  handle.position.set(
    0.62,
    1.05,
    -0.13
  );


  group.add(
    handle
  );


  return group;

}


// ============================================================
// CREATE CAMPFIRE
// ============================================================

function createCampfire() {

  const group =
    new THREE.Group();


  const woodMaterial =
    createMaterial(
      0x4c2d18
    );


  const stoneMaterial =
    createMaterial(
      0x777777
    );


  // Stones.
  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const angle =
      (
        i /
        8
      ) *
      Math.PI *
      2;


    const stone =
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          0.18,
          0
        ),
        stoneMaterial
      );


    stone.position.set(
      Math.cos(
        angle
      ) *
      0.52,

      0.15,

      Math.sin(
        angle
      ) *
      0.52
    );


    stone.scale.y =
      0.65;


    stone.castShadow =
      true;


    group.add(
      stone
    );

  }


  // Logs.
  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const log =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.11,
          0.11,
          0.9,
          8
        ),
        woodMaterial
      );


    log.rotation.z =
      Math.PI / 2;


    log.rotation.y =
      (
        i /
        3
      ) *
      Math.PI;


    log.position.y =
      0.28;


    log.castShadow =
      true;


    group.add(
      log
    );

  }


  // Fire.
  const fire =
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        0.32,
        1
      ),
      new THREE.MeshBasicMaterial({
        color:
          0xff7a19,

        transparent:
          true,

        opacity:
          0.9
      })
    );


  fire.position.y =
    0.58;


  group.add(
    fire
  );


  // Inner fire.
  const innerFire =
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        0.18,
        1
      ),
      new THREE.MeshBasicMaterial({
        color:
          0xffd34d,

        transparent:
          true,

        opacity:
          0.95
      })
    );


  innerFire.position.y =
    0.63;


  group.add(
    innerFire
  );


  // Light.
  const light =
    new THREE.PointLight(
      0xff8b35,
      2.5,
      7
    );


  light.position.y =
    1;


  group.add(
    light
  );


  group.userData.fire =
    fire;

  group.userData.innerFire =
    innerFire;

  group.userData.light =
    light;


  state.campfires.push(
    group
  );


  return group;

}


// ============================================================
// CREATE STORAGE BOX
// ============================================================

function createStorageBox() {

  const group =
    new THREE.Group();


  const boxMaterial =
    createMaterial(
      0x684421
    );


  const metalMaterial =
    createMaterial(
      0x4d4d4d
    );


  const box =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.4,
        0.7,
        0.9
      ),
      boxMaterial
    );


  box.position.y =
    0.35;

  box.castShadow =
    true;

  box.receiveShadow =
    true;


  group.add(
    box
  );


  const lid =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.45,
        0.12,
        0.95
      ),
      boxMaterial
    );


  lid.position.y =
    0.76;


  lid.castShadow =
    true;


  group.add(
    lid
  );


  const band =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.08,
        0.85,
        0.96
      ),
      metalMaterial
    );


  band.position.y =
    0.4;


  group.add(
    band
  );


  state.storageBoxes.push(
    group
  );


  return group;

}


// ============================================================
// CREATE BUILDING MESH
// ============================================================

function createBuildingMesh(
  type
) {

  switch (
    type
  ) {

    case "woodFloor":
      return createFloor();

    case "woodWall":
      return createWall();

    case "woodDoor":
      return createDoor();

    case "campfire":
      return createCampfire();

    case "storageBox":
      return createStorageBox();

    default:
      return null;

  }

}


// ============================================================
// CREATE GHOST
// ============================================================

function createGhost(
  type
) {

  removeGhost();


  const object =
    createBuildingMesh(
      type
    );


  if (
    !object
  ) {
    return null;
  }


  object.traverse(
    child => {

      if (
        child.isMesh
      ) {

        child.material =
          child.material.clone();


        child.material.transparent =
          true;

        child.material.opacity =
          0.38;

        child.material.depthWrite =
          false;

      }

    }
  );


  object.userData.isGhost =
    true;


  S.scene.add(
    object
  );


  state.ghost =
    object;


  return object;

}


// ============================================================
// UPDATE GHOST COLOR
// ============================================================

function setGhostValid(
  valid
) {

  if (
    !state.ghost
  ) {
    return;
  }


  state.ghost.traverse(
    child => {

      if (
        !child.isMesh
      ) {
        return;
      }


      child.material.color.setHex(
        valid
          ? 0x43ff78
          : 0xff3f3f
      );

      child.material.opacity =
        valid
          ? 0.4
          : 0.3;

    }
  );

}


// ============================================================
// REMOVE GHOST
// ============================================================

function removeGhost() {

  if (
    !state.ghost
  ) {
    return;
  }


  S.scene.remove(
    state.ghost
  );


  state.ghost.traverse(
    child => {

      if (
        child.geometry
      ) {

        child.geometry.dispose();

      }

      if (
        child.material
      ) {

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


  state.ghost =
    null;

}


// ============================================================
// UPDATE GHOST
// ============================================================

function updateGhost() {

  if (
    !state.active
  ) {

    removeGhost();

    return;

  }


  if (
    !state.ghost ||
    state.ghost.userData.type !==
      state.selectedBuilding
  ) {

    const ghost =
      createGhost(
        state.selectedBuilding
      );


    if (
      ghost
    ) {

      ghost.userData.type =
        state.selectedBuilding;

    }

  }


  const position =
    getPlacementPosition();


  if (
    !position
  ) {

    state.validPlacement =
      false;

    setGhostValid(
      false
    );

    return;

  }


  const validation =
    validatePosition(
      position,
      state.selectedBuilding
    );


  state.validPlacement =
    validation.valid;


  if (
    state.ghost
  ) {

    state.ghost.position.copy(
      position
    );

    state.ghost.rotation.y =
      state.rotation;

  }


  setGhostValid(
    validation.valid
  );

}


// ============================================================
// SELECT BUILDING
// ============================================================

function selectBuilding(
  type
) {

  if (
    !BUILDABLES[type]
  ) {
    return;

  }


  state.selectedBuilding =
    type;


  createGhost(
    type
  );


  if (
    state.ghost
  ) {

    state.ghost.userData.type =
      type;

  }


  refreshButtons();


  showMessage(
    BUILDABLES[type].name
  );

}


// ============================================================
// ROTATE
// ============================================================

function rotateBuilding(
  amount =
    Math.PI / 2
) {

  state.rotation +=
    amount;


  if (
    state.rotation >
    Math.PI * 2
  ) {

    state.rotation -=
      Math.PI * 2;

  }


  if (
    state.rotation <
    -Math.PI * 2
  ) {

    state.rotation +=
      Math.PI * 2;

  }

}


// ============================================================
// PLACE BUILDING
// ============================================================

function placeBuilding() {

  if (
    !state.active ||
    state.cooldown > 0
  ) {

    return false;

  }


  const type =
    state.selectedBuilding;


  const position =
    getPlacementPosition();


  const validation =
    validatePosition(
      position,
      type
    );


  if (
    !validation.valid
  ) {

    showMessage(
      validation.reason
    );

    return false;

  }


  if (
    !consumeMaterials(
      type
    )
  ) {

    showMessage(
      "Not enough materials."
    );

    return false;

  }


  const object =
    createBuildingMesh(
      type
    );


  if (
    !object
  ) {
    return false;
  }


  object.position.copy(
    position
  );


  object.rotation.y =
    state.rotation;


  object.userData.type =
    type;

  object.userData.buildingId =
    `building-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;


  S.scene.add(
    object
  );


  const record = {

    id:
      object.userData
        .buildingId,

    type,

    position: {

      x:
        position.x,

      y:
        position.y,

      z:
        position.z

    },

    rotation:
      state.rotation

  };


  state.placedObjects.push(
    record
  );


  if (
    !Array.isArray(
      S.buildings
    )
  ) {

    S.buildings =
      [];

  }


  S.buildings.push(
    record
  );


  addBuildingPiece(
    type
  );


  GAME.statistics
    .buildingsBuilt++;


  state.cooldown =
    0.35;


  gameEvent(
    "building-placed",
    {
      id:
        record.id,

      type,

      position:
        record.position,

      rotation:
        record.rotation
    }
  );


  if (
    S.systems.audio
      ?.play
  ) {

    S.systems.audio.play(
      "build"
    );

  }


  showMessage(
    `${BUILDABLES[type].name} built.`
  );


  updateGhost();

  refreshButtons();


  return true;

}


// ============================================================
// DESTROY BUILDING
// ============================================================

function destroyBuilding(
  object
) {

  if (
    !object ||
    !object.userData?.buildingId
  ) {

    return false;

  }


  const id =
    object.userData
      .buildingId;


  const index =
    state.placedObjects
      .findIndex(
        item =>
          item.id === id
      );


  if (
    index === -1
  ) {

    return false;

  }


  const record =
    state.placedObjects[
      index
    ];


  state.placedObjects.splice(
    index,
    1
  );


  const globalIndex =
    Array.isArray(
      S.buildings
    )
      ? S.buildings
          .findIndex(
            item =>
              item.id === id
          )
      : -1;


  if (
    globalIndex !== -1
  ) {

    S.buildings.splice(
      globalIndex,
      1
    );

  }


  if (
    GAME.buildings[
      record.type
    ] > 0
  ) {

    GAME.buildings[
      record.type
    ]--;

  }


  if (
    GAME.buildings.total > 0
  ) {

    GAME.buildings.total--;

  }


  S.scene.remove(
    object
  );


  gameEvent(
    "building-destroyed",
    {
      id,
      type:
        record.type
    }
  );


  return true;

}


// ============================================================
// BUILDING UI
// ============================================================

function createUI() {

  if (
    document.getElementById(
      "buildingUI"
    )
  ) {

    state.ui =
      document.getElementById(
        "buildingUI"
      );

    return;

  }


  const ui =
    document.createElement(
      "div"
    );


  ui.id =
    "buildingUI";

  ui.className =
    "systemOverlay hidden";


  ui.innerHTML = `

    <div class="systemPanel buildingPanel">

      <div class="panelHeader">

        <div>
          BUILDING
        </div>

        <button
          id="buildingClose"
          type="button"
        >
          ×
        </button>

      </div>


      <div class="buildingSelected">

        <div
          id="buildingSelectedName"
          class="buildingSelectedName"
        >
          Wood Floor
        </div>

        <div
          id="buildingSelectedDescription"
          class="buildingSelectedDescription"
        >
          A basic wooden floor.
        </div>

      </div>


      <div
        id="buildingButtons"
        class="buildingButtons"
      ></div>


      <div class="buildingControls">

        <button
          id="buildingRotate"
          type="button"
        >
          ROTATE
        </button>

        <button
          id="buildingPlace"
          type="button"
        >
          PLACE
        </button>

      </div>


      <div
        id="buildingMaterialStatus"
        class="buildingMaterialStatus"
      ></div>


      <div class="buildingHint">

        B = Build<br>
        R = Rotate<br>
        E = Place<br>
        1–5 = Select

      </div>

    </div>

  `;


  document.body.appendChild(
    ui
  );


  state.ui =
    ui;


  document
    .getElementById(
      "buildingClose"
    )
    ?.addEventListener(
      "click",
      close
    );


  document
    .getElementById(
      "buildingRotate"
    )
    ?.addEventListener(
      "click",
      () =>
        rotateBuilding()
    );


  document
    .getElementById(
      "buildingPlace"
    )
    ?.addEventListener(
      "click",
      placeBuilding
    );


  createBuildingButtons();

  refreshButtons();

}


// ============================================================
// BUILDING BUTTONS
// ============================================================

function createBuildingButtons() {

  const container =
    document.getElementById(
      "buildingButtons"
    );


  if (
    !container
  ) {
    return;
  }


  container.innerHTML =
    "";


  const types =
    Object.keys(
      BUILDABLES
    );


  types.forEach(
    (
      type,
      index
    ) => {

      const buildable =
        BUILDABLES[type];


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "buildingOption";


      button.dataset.type =
        type;


      button.innerHTML = `

        <span class="buildingOptionNumber">
          ${index + 1}
        </span>

        <span class="buildingOptionName">
          ${buildable.name}
        </span>

      `;


      button.addEventListener(
        "click",
        () =>
          selectBuilding(
            type
          )
      );


      container.appendChild(
        button
      );

      state.buttons[type] =
        button;

    }
  );

}


// ============================================================
// REFRESH BUTTONS
// ============================================================

function refreshButtons() {

  const selectedName =
    document.getElementById(
      "buildingSelectedName"
    );


  const selectedDescription =
    document.getElementById(
      "buildingSelectedDescription"
    );


  const materialStatus =
    document.getElementById(
      "buildingMaterialStatus"
    );


  const buildable =
    BUILDABLES[
      state.selectedBuilding
    ];


  if (
    selectedName &&
    buildable
  ) {

    selectedName.textContent =
      buildable.name;

  }


  if (
    selectedDescription &&
    buildable
  ) {

    selectedDescription.textContent =
      buildable.description;

  }


  Object.entries(
    state.buttons
  ).forEach(
    (
      [
        type,
        button
      ]
    ) => {

      button.classList.toggle(
        "selected",
        type ===
          state.selectedBuilding
      );


      const affordable =
        canAfford(
          type
        );


      button.classList.toggle(
        "disabled",
        !affordable
      );

    }
  );


  if (
    materialStatus
  ) {

    const recipe =
      getRecipe(
        state.selectedBuilding
      );


    if (
      !recipe
    ) {

      materialStatus.textContent =
        "Recipe unavailable.";

      return;

    }


    const materials =
      Object.entries(
        recipe.ingredients ||
        {}
      )
        .map(
          (
            [
              item,
              amount
            ]
          ) =>
            `${item}: ${getItemCount(item)}/${amount}`
        )
        .join(
          " • "
        );


    materialStatus.textContent =
      materials;

  }

}


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(
  text
) {

  if (
    typeof S.showMessage ===
    "function"
  ) {

    S.showMessage(
      text
    );

    return;

  }


  const message =
    document.getElementById(
      "message"
    );


  if (
    !message
  ) {
    return;
  }


  message.textContent =
    text;

  message.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      message.classList.add(
        "hidden"
      );

    },
    2200
  );

}


// ============================================================
// OPEN
// ============================================================

function open() {

  createUI();


  state.active =
    true;


  state.ui.classList.remove(
    "hidden"
  );


  createGhost(
    state.selectedBuilding
  );


  if (
    state.ghost
  ) {

    state.ghost.userData.type =
      state.selectedBuilding;

  }


  refreshButtons();


  gameEvent(
    "building-opened"
  );

}


// ============================================================
// CLOSE
// ============================================================

function close() {

  state.active =
    false;


  if (
    state.ui
  ) {

    state.ui.classList.add(
      "hidden"
    );

  }


  removeGhost();


  gameEvent(
    "building-closed"
  );

}


// ============================================================
// TOGGLE
// ============================================================

function toggle() {

  if (
    state.active
  ) {

    close();

  } else {

    open();

  }

}


// ============================================================
// UPDATE
// ============================================================

function update(
  delta
) {

  if (
    state.cooldown > 0
  ) {

    state.cooldown -=
      delta;

  }


  if (
    !state.active
  ) {
    return;
  }


  updateGhost();


  // Animate campfires.
  const time =
    performance.now() *
    0.001;


  for (
    const campfire
    of state.campfires
  ) {

    if (
      !campfire
    ) {
      continue;
    }


    const fire =
      campfire.userData.fire;

    const innerFire =
      campfire.userData
        .innerFire;

    const light =
      campfire.userData.light;


    if (
      fire
    ) {

      const scale =
        0.9 +
        Math.sin(
          time * 8
        ) *
        0.12;


      fire.scale.set(
        scale,
        1 +
          Math.sin(
            time * 10
          ) *
          0.18,
        scale
      );

    }


    if (
      innerFire
    ) {

      innerFire.scale.setScalar(
        0.9 +
        Math.sin(
          time * 11
        ) *
        0.15
      );

    }


    if (
      light
    ) {

      light.intensity =
        2.2 +
        Math.sin(
          time * 9
        ) *
        0.45;

    }

  }

}


// ============================================================
// GET STATE
// ============================================================

function getState() {

  return {

    active:
      state.active,

    selectedBuilding:
      state.selectedBuilding,

    rotation:
      state.rotation,

    placedCount:
      state.placedObjects.length

  };

}


// ============================================================
// RESTORE BUILDINGS
// ============================================================

function restoreBuildings(
  records
) {

  if (
    !Array.isArray(
      records
    )
  ) {
    return;
  }


  for (
    const record
    of records
  ) {

    if (
      !record ||
      !BUILDABLES[
        record.type
      ]
    ) {
      continue;
    }


    const object =
      createBuildingMesh(
        record.type
      );


    if (
      !object
    ) {
      continue;
    }


    object.position.set(
      numberOrZero(
        record.position?.x
      ),
      numberOrZero(
        record.position?.y
      ),
      numberOrZero(
        record.position?.z
      )
    );


    object.rotation.y =
      numberOrZero(
        record.rotation
      );


    object.userData.type =
      record.type;

    object.userData.buildingId =
      record.id ||
      `building-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;


    S.scene.add(
      object
    );


    const restored =
      {

        id:
          object.userData
            .buildingId,

        type:
          record.type,

        position: {

          x:
            object.position.x,

          y:
            object.position.y,

          z:
            object.position.z

        },

        rotation:
          object.rotation.y

      };


    state.placedObjects.push(
      restored
    );

  }

}


// ============================================================
// NUMBER HELPER
// ============================================================

function numberOrZero(
  value
) {

  const result =
    Number(
      value
    );


  return Number.isFinite(
    result
  )
    ? result
    : 0;

}


// ============================================================
// CLEAR BUILDINGS
// ============================================================

function clearBuildings() {

  for (
    const record
    of state.placedObjects
  ) {

    const object =
      S.scene?.children
        .find(
          child =>
            child.userData
              ?.buildingId ===
            record.id
        );


    if (
      object
    ) {

      S.scene.remove(
        object
      );

    }

  }


  state.placedObjects =
    [];

  state.campfires =
    [];

  state.storageBoxes =
    [];

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

  window.addEventListener(
    "survival-inventory-changed",
    () => {

      refreshButtons();

    }
  );


  window.addEventListener(
    "survival-world-generated",
    () => {

      /*
       * The world changed.
       *
       * Remove old building references because
       * a new seeded world should not inherit the
       * previous physical structures.
       */

      clearBuildings();

      state.active =
        false;

      removeGhost();

    }
  );


  window.addEventListener(
    "survival-new-world-created",
    () => {

      clearBuildings();

      state.active =
        false;

      removeGhost();

    }
  );


  window.addEventListener(
    "survival-menu-button",
    () => {

      if (
        state.active
      ) {

        close();

      }

    }
  );


  window.addEventListener(
    "keydown",
    event => {

      if (
        event.key
          .toLowerCase() ===
        "b"
      ) {

        if (
          !event.repeat
        ) {

          toggle();

        }

        return;

      }


      if (
        !state.active
      ) {
        return;
      }


      if (
        event.key
          .toLowerCase() ===
        "r"
      ) {

        rotateBuilding();

        return;

      }


      if (
        event.key
          .toLowerCase() ===
        "e"
      ) {

        placeBuilding();

        return;

      }


      if (
        event.key ===
        "Escape"
      ) {

        close();

        return;

      }


      const number =
        Number(
          event.key
        );


      if (
        number >= 1 &&
        number <= 5
      ) {

        const types =
          Object.keys(
            BUILDABLES
          );


        const type =
          types[
            number - 1
          ];


        if (
          type
        ) {

          selectBuilding(
            type
          );

        }

      }

    }
  );


  window.addEventListener(
    "survival-grab",
    event => {

      if (
        !state.active
      ) {
        return;
      }


      /*
       * A controller grab/place event can
       * contain either:
       *
       * {hand: "left"}
       *
       * or
       *
       * {hand: "right"}
       */

      const detail =
        event.detail ||
        {};


      if (
        detail.pressed === false
      ) {
        return;
      }


      placeBuilding();

    }
  );

}


// ============================================================
// INITIALIZE
// ============================================================

function initialize() {

  if (
    state.initialized
  ) {
    return;
  }


  if (
    !S.scene
  ) {

    console.warn(
      "[Building] Scene not ready yet."
    );

    return;

  }


  state.initialized =
    true;


  createUI();

  setupEvents();


  if (
    !Array.isArray(
      S.buildings
    )
  ) {

    S.buildings =
      [];

  }


  console.log(
    "[SurvivalVR] Building system ready."
  );

}


// ============================================================
// PUBLIC SYSTEM
// ============================================================

const buildingSystem = {

  initialize,

  open,

  close,

  toggle,

  update,

  placeBuilding,

  rotateBuilding,

  selectBuilding,

  getState,

  getWorldData,

  getIslandRadius,

  getLakeData,

  clearBuildings,

  restoreBuildings,

  BUILDABLES

};


// ============================================================
// REGISTER SYSTEM
// ============================================================

S.systems.building =
  buildingSystem;

S.building =
  buildingSystem;


// ============================================================
// AUTO INITIALIZE
// ============================================================

if (
  S.scene
) {

  initialize();

}


// ============================================================
// EXPORT
// ============================================================

export {

  BUILDABLES,

  buildingSystem

};