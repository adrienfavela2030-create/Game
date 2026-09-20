/*
==========================================================
ISLAND SURVIVAL VR
BUILDING SYSTEM
==========================================================

Connects to:
- game.js
- crafting.js
- index.html
- inventory.js
- future guide.js
- future world.js

==========================================================
*/

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


/* ========================================================
   VERSION
======================================================== */

export const BUILDING_VERSION = 1;


/* ========================================================
   BUILDABLE OBJECTS
======================================================== */

export const BUILDINGS = {

  woodFloor: {
    id: "woodFloor",
    name: "Wood Floor",
    category: "foundation",
    recipe: "woodFloor",
    size: {
      x: 3,
      y: 0.2,
      z: 3
    },
    color: 0x80502d
  },

  woodWall: {
    id: "woodWall",
    name: "Wood Wall",
    category: "wall",
    recipe: "woodWall",
    size: {
      x: 3,
      y: 2.8,
      z: 0.2
    },
    color: 0x70452a
  },

  woodDoor: {
    id: "woodDoor",
    name: "Wood Door",
    category: "door",
    recipe: "woodDoor",
    size: {
      x: 1.4,
      y: 2.7,
      z: 0.2
    },
    color: 0x70452a
  },

  campfire: {
    id: "campfire",
    name: "Campfire",
    category: "survival",
    recipe: "campfire",
    size: {
      x: 1.5,
      y: 0.6,
      z: 1.5
    },
    color: 0x555555
  },

  storageBox: {
    id: "storageBox",
    name: "Storage Box",
    category: "storage",
    recipe: "storageBox",
    size: {
      x: 1.5,
      y: 1,
      z: 1
    },
    color: 0x70452a
  }

};


/* ========================================================
   BUILDING STATE
======================================================== */

const buildingState = {

  active: false,

  selectedBuilding: "woodFloor",

  rotation: 0,

  gridSize: 0.5,

  distance: 3,

  ghost: null,

  validPlacement: false,

  builtCount: {},

  mode: "place"

};


/* ========================================================
   REGISTER SYSTEM
======================================================== */

if (
  window.SurvivalVR &&
  window.SurvivalVR.systems
) {

  window.SurvivalVR.systems.building = {

    version: BUILDING_VERSION,

    buildings: BUILDINGS,

    state: buildingState,

    open: openBuilding,

    close: closeBuilding,

    toggle: toggleBuilding,

    select: selectBuilding,

    rotate: rotateBuilding,

    place: placeBuilding,

    canPlace: canPlaceBuilding,

    getBuilding: getBuilding

  };

}


/* ========================================================
   GET BUILDING
======================================================== */

export function getBuilding(
  buildingId
) {

  return (
    BUILDINGS[buildingId] ||
    null
  );

}


/* ========================================================
   OPEN BUILD MODE
======================================================== */

export function openBuilding(
  buildingId = buildingState.selectedBuilding
) {

  if (!getBuilding(buildingId)) {

    buildingId = "woodFloor";

  }


  buildingState.active = true;

  buildingState.selectedBuilding =
    buildingId;


  createGhost();

  updateGhost();

  showBuildingMessage(
    `Building: ${getBuilding(buildingId).name}`
  );

}


/* ========================================================
   CLOSE BUILD MODE
======================================================== */

export function closeBuilding() {

  buildingState.active = false;

  removeGhost();

}


/* ========================================================
   TOGGLE BUILD MODE
======================================================== */

export function toggleBuilding() {

  if (buildingState.active) {

    closeBuilding();

  } else {

    openBuilding();

  }

}


/* ========================================================
   SELECT BUILDING
======================================================== */

export function selectBuilding(
  buildingId
) {

  if (!getBuilding(buildingId)) {

    return false;

  }


  buildingState.selectedBuilding =
    buildingId;


  if (buildingState.active) {

    createGhost();

    updateGhost();

  }


  return true;

}


/* ========================================================
   ROTATE BUILDING
======================================================== */

export function rotateBuilding(
  amount = 1
) {

  buildingState.rotation +=
    Math.PI / 2 * amount;


  if (
    buildingState.rotation >
    Math.PI * 2
  ) {

    buildingState.rotation -=
      Math.PI * 2;

  }


  if (
    buildingState.rotation <
    0
  ) {

    buildingState.rotation +=
      Math.PI * 2;

  }


  updateGhost();

}


/* ========================================================
   CREATE GHOST
======================================================== */

function createGhost() {

  removeGhost();


  const THREE =
    window.SurvivalVR?.THREE;


  const scene =
    window.SurvivalVR?.scene;


  if (!THREE || !scene) {

    return;

  }


  const building =
    getBuilding(
      buildingState.selectedBuilding
    );


  if (!building) {

    return;

  }


  const geometry =
    new THREE.BoxGeometry(
      building.size.x,
      building.size.y,
      building.size.z
    );


  const material =
    new THREE.MeshStandardMaterial({

      color: building.color,

      transparent: true,

      opacity: 0.45,

      depthWrite: false

    });


  const ghost =
    new THREE.Mesh(
      geometry,
      material
    );


  ghost.userData.type =
    "buildingGhost";


  ghost.userData.building =
    building.id;


  scene.add(
    ghost
  );


  buildingState.ghost =
    ghost;

}


/* ========================================================
   REMOVE GHOST
======================================================== */

function removeGhost() {

  if (
    buildingState.ghost
  ) {

    buildingState.ghost.parent?.remove(
      buildingState.ghost
    );

    buildingState.ghost.geometry?.dispose();

    buildingState.ghost.material?.dispose();

    buildingState.ghost = null;

  }

}


/* ========================================================
   UPDATE GHOST
======================================================== */

function updateGhost() {

  const THREE =
    window.SurvivalVR?.THREE;


  const camera =
    window.SurvivalVR?.camera;


  const ghost =
    buildingState.ghost;


  if (
    !THREE ||
    !camera ||
    !ghost
  ) {

    return;

  }


  const direction =
    new THREE.Vector3(
      0,
      0,
      -1
    );


  direction.applyQuaternion(
    camera.quaternion
  );


  direction.y = 0;


  if (
    direction.lengthSq() === 0
  ) {

    direction.set(
      0,
      0,
      -1
    );

  }


  direction.normalize();


  const position =
    camera.getWorldPosition(
      new THREE.Vector3()
    );


  position.add(
    direction.multiplyScalar(
      buildingState.distance
    )
  );


  /*
  Snap to building grid.
  */

  position.x =
    Math.round(
      position.x /
      buildingState.gridSize
    ) *
    buildingState.gridSize;


  position.z =
    Math.round(
      position.z /
      buildingState.gridSize
    ) *
    buildingState.gridSize;


  const building =
    getBuilding(
      buildingState.selectedBuilding
    );


  if (!building) {

    return;

  }


  position.y =
    building.size.y / 2;


  ghost.position.copy(
    position
  );


  ghost.rotation.y =
    buildingState.rotation;


  buildingState.validPlacement =
    canPlaceBuilding(
      buildingState.selectedBuilding,
      position
    );


  if (
    ghost.material
  ) {

    ghost.material.opacity =
      buildingState.validPlacement
        ? 0.45
        : 0.2;

  }

}


/* ========================================================
   CHECK MATERIALS
======================================================== */

function hasBuildingMaterials(
  buildingId
) {

  const building =
    getBuilding(
      buildingId
    );


  if (!building) {

    return false;

  }


  const recipe =
    RECIPES[
      building.recipe
    ];


  if (!recipe) {

    return false;

  }


  for (
    const [item, amount]
    of Object.entries(
      recipe.ingredients
    )
  ) {

    if (
      getItemCount(item) <
      amount
    ) {

      return false;

    }

  }


  return true;

}


/* ========================================================
   CHECK PLACEMENT
======================================================== */

export function canPlaceBuilding(
  buildingId,
  position
) {

  if (
    !hasBuildingMaterials(
      buildingId
    )
  ) {

    return false;

  }


  const scene =
    window.SurvivalVR?.scene;


  if (!scene) {

    return false;

  }


  /*
  Keep buildings on the island.
  */

  const distance =
    Math.sqrt(
      position.x * position.x +
      position.z * position.z
    );


  if (
    distance > 27
  ) {

    return false;

  }


  /*
  Don't place directly inside the lake.
  */

  const lakeX = 9;
  const lakeZ = -7;
  const lakeRadius = 9;


  const lakeDistance =
    Math.sqrt(
      Math.pow(
        position.x - lakeX,
        2
      ) +
      Math.pow(
        position.z - lakeZ,
        2
      )
    );


  if (
    lakeDistance <
    lakeRadius - 1
  ) {

    return false;

  }


  /*
  Prevent buildings from overlapping
  existing buildings.
  */

  const buildings =
    window.SurvivalVR?.buildings ||
    [];


  const newBuilding =
    getBuilding(
      buildingId
    );


  if (!newBuilding) {

    return false;

  }


  for (
    const existing
    of buildings
  ) {

    if (
      !existing ||
      !existing.userData
    ) {

      continue;

    }


    const dx =
      Math.abs(
        existing.position.x -
        position.x
      );


    const dz =
      Math.abs(
        existing.position.z -
        position.z
      );


    if (
      dx <
      newBuilding.size.x * 0.75 &&
      dz <
      newBuilding.size.z * 0.75
    ) {

      return false;

    }

  }


  return true;

}


/* ========================================================
   PLACE BUILDING
======================================================== */

export function placeBuilding() {

  if (
    !buildingState.active
  ) {

    return false;

  }


  const ghost =
    buildingState.ghost;


  if (!ghost) {

    return false;

  }


  updateGhost();


  if (
    !buildingState.validPlacement
  ) {

    showBuildingMessage(
      "You cannot build there."
    );

    return false;

  }


  const buildingId =
    buildingState.selectedBuilding;


  const building =
    getBuilding(
      buildingId
    );


  const recipe =
    RECIPES[
      building.recipe
    ];


  if (!recipe) {

    return false;

  }


  /*
  Remove crafting materials.
  */

  for (
    const [item, amount]
    of Object.entries(
      recipe.ingredients
    )
  ) {

    removeItem(
      item,
      amount
    );

  }


  /*
  Create actual building.
  */

  const actual =
    createBuildingMesh(
      building,
      ghost.position,
      ghost.rotation.y
    );


  if (!actual) {

    return false;

  }


  window.SurvivalVR.buildings.push(
    actual
  );


  /*
  Update game statistics.
  */

  addBuildingPiece(
    buildingId
  );


  if (
    !buildingState.builtCount[
      buildingId
    ]
  ) {

    buildingState.builtCount[
      buildingId
    ] = 0;

  }


  buildingState.builtCount[
    buildingId
  ] += 1;


  gameEvent(
    "building-placed",
    {
      building: buildingId,

      position: {
        x: actual.position.x,
        y: actual.position.y,
        z: actual.position.z
      },

      rotation:
        actual.rotation.y
    }
  );


  window.dispatchEvent(
    new CustomEvent(
      "survival-building-placed",
      {
        detail: {
          building: buildingId,
          object: actual
        }
      }
    )
  );


  showBuildingMessage(
    `${building.name} built!`
  );


  updateGhost();


  return true;

}


/* ========================================================
   CREATE BUILDING MESH
======================================================== */

function createBuildingMesh(
  building,
  position,
  rotation
) {

  const THREE =
    window.SurvivalVR?.THREE;


  const scene =
    window.SurvivalVR?.scene;


  if (
    !THREE ||
    !scene
  ) {

    return null;

  }


  const group =
    new THREE.Group();


  group.userData.type =
    "building";


  group.userData.building =
    building.id;


  group.userData.category =
    building.category;


  group.position.copy(
    position
  );


  group.rotation.y =
    rotation;


  /*
  ========================================================
  FLOOR
  ========================================================
  */

  if (
    building.id ===
    "woodFloor"
  ) {

    const floor =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          3,
          0.2,
          3
        ),

        new THREE.MeshStandardMaterial({
          color: 0x80502d,
          roughness: 0.9
        })

      );


    floor.castShadow = true;
    floor.receiveShadow = true;

    group.add(
      floor
    );

  }


  /*
  ========================================================
  WALL
  ========================================================
  */

  else if (
    building.id ===
    "woodWall"
  ) {

    const wall =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          3,
          2.8,
          0.2
        ),

        new THREE.MeshStandardMaterial({
          color: 0x70452a,
          roughness: 0.95
        })

      );


    wall.position.y =
      0;


    wall.castShadow = true;
    wall.receiveShadow = true;

    group.add(
      wall
    );


    addWoodSupports(
      group
    );

  }


  /*
  ========================================================
  DOOR
  ========================================================
  */

  else if (
    building.id ===
    "woodDoor"
  ) {

    const door =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          1.4,
          2.7,
          0.2
        ),

        new THREE.MeshStandardMaterial({
          color: 0x70452a,
          roughness: 0.9
        })

      );


    door.castShadow = true;

    group.add(
      door
    );


    group.userData.open =
      false;


    group.userData.interactable =
      true;

  }


  /*
  ========================================================
  CAMPFIRE
  ========================================================
  */

  else if (
    building.id ===
    "campfire"
  ) {

    createCampfire(
      group
    );

  }


  /*
  ========================================================
  STORAGE BOX
  ========================================================
  */

  else if (
    building.id ===
    "storageBox"
  ) {

    createStorageBox(
      group
    );

  }


  scene.add(
    group
  );


  return group;

}


/* ========================================================
   WOOD SUPPORTS
======================================================== */

function addWoodSupports(
  group
) {

  const THREE =
    window.SurvivalVR?.THREE;


  if (!THREE) {
    return;
  }


  const material =
    new THREE.MeshStandardMaterial({
      color: 0x57351f,
      roughness: 1
    });


  const left =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        2.9,
        0.25
      ),
      material
    );


  left.position.x =
    -1.25;


  left.castShadow = true;


  const right =
    left.clone();


  right.position.x =
    1.25;


  group.add(
    left
  );

  group.add(
    right
  );

}


/* ========================================================
   CAMPFIRE
======================================================== */

function createCampfire(
  group
) {

  const THREE =
    window.SurvivalVR?.THREE;


  if (!THREE) {
    return;
  }


  const stoneMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 1
    });


  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const angle =
      i /
      8 *
      Math.PI *
      2;


    const stone =
      new THREE.Mesh(

        new THREE.DodecahedronGeometry(
          0.22,
          1
        ),

        stoneMaterial
      );


    stone.position.set(

      Math.cos(angle) *
        0.65,

      0.22,

      Math.sin(angle) *
        0.65

    );


    stone.scale.y =
      0.7;


    stone.castShadow = true;

    group.add(
      stone
    );

  }


  const fire =
    new THREE.Mesh(

      new THREE.ConeGeometry(
        0.45,
        1.2,
        8
      ),

      new THREE.MeshBasicMaterial({
        color: 0xff8a20
      })

    );


  fire.position.y =
    0.7;


  group.add(
    fire
  );


  const light =
    new THREE.PointLight(
      0xff9b38,
      2.5,
      8
    );


  light.position.y =
    1.2;


  group.add(
    light
  );


  group.userData.fire =
    fire;


  group.userData.light =
    light;

}


/* ========================================================
   STORAGE BOX
======================================================== */

function createStorageBox(
  group
) {

  const THREE =
    window.SurvivalVR?.THREE;


  if (!THREE) {
    return;
  }


  const box =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.5,
        0.8,
        1
      ),

      new THREE.MeshStandardMaterial({
        color: 0x70452a,
        roughness: 0.9
      })

    );


  box.position.y =
    0.4;


  box.castShadow = true;
  box.receiveShadow = true;


  group.add(
    box
  );


  const lid =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.55,
        0.12,
        1.05
      ),

      new THREE.MeshStandardMaterial({
        color: 0x5a371f,
        roughness: 0.9
      })

    );


  lid.position.y =
    0.86;


  lid.castShadow = true;


  group.add(
    lid
  );


  group.userData.storage = {};

  group.userData.open =
    false;

}


/* ========================================================
   DOOR INTERACTION
======================================================== */

export function toggleDoor(
  door
) {

  if (
    !door ||
    door.userData.building !==
      "woodDoor"
  ) {

    return false;

  }


  door.userData.open =
    !door.userData.open;


  door.rotation.y =
    door.userData.open
      ? Math.PI / 2
      : 0;


  return true;

}


/* ========================================================
   BUILDING UPDATE
======================================================== */

export function updateBuilding(
  delta
) {

  const buildings =
    window.SurvivalVR?.buildings ||
    [];


  for (
    const building
    of buildings
  ) {

    if (!building) {
      continue;
    }


    /*
    Animate campfire.
    */

    if (
      building.userData.building ===
      "campfire"
    ) {

      const fire =
        building.userData.fire;


      const light =
        building.userData.light;


      if (fire) {

        fire.scale.y =
          0.9 +
          Math.sin(
            performance.now() *
            0.008
          ) *
          0.12;

      }


      if (light) {

        light.intensity =
          2.2 +
          Math.sin(
            performance.now() *
            0.01
          ) *
          0.35;

      }

    }

  }


  if (
    buildingState.active
  ) {

    updateGhost();

  }

}


/* ========================================================
   CONTROLLER EVENTS
======================================================== */

/*
Trigger placement with the controller
select event.

The main index.html already sends
survival-grab events.
*/

window.addEventListener(
  "survival-grab",
  event => {

    if (
      !buildingState.active
    ) {

      return;

    }


    placeBuilding();

  }
);


/* ========================================================
   KEYBOARD CONTROLS
======================================================== */

window.addEventListener(
  "keydown",
  event => {

    if (
      event.key.toLowerCase() ===
      "b"
    ) {

      toggleBuilding();

    }


    if (
      !buildingState.active
    ) {

      return;

    }


    /*
    R rotates.
    */

    if (
      event.key.toLowerCase() ===
      "r"
    ) {

      rotateBuilding(
        1
      );

    }


    /*
    Number keys select common
    building pieces.
    */

    if (
      event.key === "1"
    ) {

      selectBuilding(
        "woodFloor"
      );

    }


    if (
      event.key === "2"
    ) {

      selectBuilding(
        "woodWall"
      );

    }


    if (
      event.key === "3"
    ) {

      selectBuilding(
        "woodDoor"
      );

    }


    if (
      event.key === "4"
    ) {

      selectBuilding(
        "campfire"
      );

    }


    if (
      event.key === "5"
    ) {

      selectBuilding(
        "storageBox"
      );

    }


    if (
      event.key ===
      "Escape"
    ) {

      closeBuilding();

    }

  }
);


/* ========================================================
   BUILDING MESSAGE
======================================================== */

function showBuildingMessage(
  message
) {

  const element =
    document.getElementById(
      "message"
    );


  if (element) {

    element.textContent =
      message;


    element.classList.add(
      "show"
    );


    clearTimeout(
      showBuildingMessage.timeout
    );


    showBuildingMessage.timeout =
      setTimeout(
        () => {

          element.classList.remove(
            "show"
          );

        },
        1800
      );

  }

}


/* ========================================================
   INITIALIZE
======================================================== */

console.log(
  "🏠 Building system loaded."
);

console.log(
  `🏗️ ${Object.keys(BUILDINGS).length} building types registered.`
);