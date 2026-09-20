// building.js
// Survival VR — Building System
// Handles building selection, ghost placement, snapping,
// material checking, placement validation, and VR/keyboard controls.

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

const SurvivalVR = window.SurvivalVR;
const THREE = SurvivalVR.THREE;

const BUILDINGS = {
  woodFloor: {
    id: "woodFloor",
    name: "Wood Floor",
    icon: "▰",
    size: [2.8, 0.18, 2.8],
    yOffset: 0.09,
    color: 0x8b5a2b,
    recipe: "woodFloor",
    type: "floor"
  },

  woodWall: {
    id: "woodWall",
    name: "Wood Wall",
    icon: "▥",
    size: [2.8, 2.6, 0.18],
    yOffset: 1.3,
    color: 0x74451f,
    recipe: "woodWall",
    type: "wall"
  },

  woodDoor: {
    id: "woodDoor",
    name: "Wood Door",
    icon: "▣",
    size: [2.8, 2.6, 0.18],
    yOffset: 1.3,
    color: 0x5b351a,
    recipe: "woodDoor",
    type: "door"
  },

  campfire: {
    id: "campfire",
    name: "Campfire",
    icon: "🔥",
    size: [1.4, 0.8, 1.4],
    yOffset: 0.4,
    color: 0x555555,
    recipe: "campfire",
    type: "campfire"
  },

  storageBox: {
    id: "storageBox",
    name: "Storage Box",
    icon: "▣",
    size: [1.5, 1.1, 1.1],
    yOffset: 0.55,
    color: 0x6e421e,
    recipe: "storageBox",
    type: "storage"
  }
};

const BUILDING_ORDER = [
  "woodFloor",
  "woodWall",
  "woodDoor",
  "campfire",
  "storageBox"
];

const buildingState = {
  active: false,
  initialized: false,
  selectedBuilding: "woodFloor",

  rotation: 0,
  gridSize: 0.5,
  placementDistance: 3.2,

  ghost: null,
  validPlacement: false,

  lastPlacement: 0,
  placementCooldown: 250,

  ui: null,
  buttons: new Map(),

  campfires: [],
  storageBoxes: []
};

SurvivalVR.systems.building = buildingState;

// --------------------------------------------------
// UTILITIES
// --------------------------------------------------

function getBuilding(id) {
  return BUILDINGS[id] || null;
}

function getRecipe(id) {
  return RECIPES[id] || null;
}

function getRecipeText(recipe) {
  if (!recipe || !recipe.ingredients) {
    return "No materials";
  }

  return Object.entries(recipe.ingredients)
    .map(([item, amount]) => {
      return `${formatItemName(item)} ×${amount}`;
    })
    .join("  •  ");
}

function formatItemName(item) {
  return String(item)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, char => char.toUpperCase());
}

function showMessage(text, duration = 2200) {
  const message = document.getElementById("message");

  if (!message) {
    return;
  }

  message.textContent = text;
  message.classList.remove("hidden");

  clearTimeout(showMessage.timer);

  showMessage.timer = setTimeout(() => {
    message.classList.add("hidden");
  }, duration);
}

function hasMaterials(buildingId) {
  const building = getBuilding(buildingId);

  if (!building) {
    return false;
  }

  const recipe = getRecipe(building.recipe);

  if (!recipe) {
    return false;
  }

  for (const [item, amount] of Object.entries(recipe.ingredients || {})) {
    if (getItemCount(item) < amount) {
      return false;
    }
  }

  return true;
}

function consumeMaterials(buildingId) {
  const building = getBuilding(buildingId);

  if (!building) {
    return false;
  }

  const recipe = getRecipe(building.recipe);

  if (!recipe || !hasMaterials(buildingId)) {
    return false;
  }

  for (const [item, amount] of Object.entries(recipe.ingredients || {})) {
    if (!removeItem(item, amount)) {
      return false;
    }
  }

  return true;
}

function snap(value) {
  return Math.round(value / buildingState.gridSize) *
    buildingState.gridSize;
}

// --------------------------------------------------
// PLACEMENT POSITION
// --------------------------------------------------

function getPlacementPosition() {
  const camera = SurvivalVR.camera;

  if (!camera) {
    return null;
  }

  const direction = new THREE.Vector3();

  camera.getWorldDirection(direction);

  const position = camera.getWorldPosition(
    new THREE.Vector3()
  );

  const target = position.clone()
    .add(direction.multiplyScalar(buildingState.placementDistance));

  target.x = snap(target.x);
  target.z = snap(target.z);

  // Keep building on the ground.
  target.y = 0;

  return target;
}

// --------------------------------------------------
// ISLAND / LAKE CHECKING
// --------------------------------------------------

function isInsideIsland(position) {
  const radius = 27;

  const distance = Math.sqrt(
    position.x * position.x +
    position.z * position.z
  );

  return distance <= radius;
}

function isInsideLake(position) {
  const lakeX = 9;
  const lakeZ = -7;
  const lakeRadius = 9;

  const dx = position.x - lakeX;
  const dz = position.z - lakeZ;

  return Math.sqrt(dx * dx + dz * dz) < lakeRadius;
}

// --------------------------------------------------
// COLLISION CHECKING
// --------------------------------------------------

function getGhostBox() {
  if (!buildingState.ghost) {
    return null;
  }

  buildingState.ghost.updateMatrixWorld(true);

  return new THREE.Box3().setFromObject(
    buildingState.ghost
  );
}

function isOverlappingExistingBuilding(box) {
  const buildings = SurvivalVR.buildings || [];

  for (const building of buildings) {
    if (!building || !building.mesh) {
      continue;
    }

    if (!building.mesh.visible) {
      continue;
    }

    const otherBox = new THREE.Box3().setFromObject(
      building.mesh
    );

    if (box.intersectsBox(otherBox)) {
      return true;
    }
  }

  return false;
}

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

function validatePlacement() {
  if (!buildingState.ghost) {
    buildingState.validPlacement = false;
    return false;
  }

  const position = buildingState.ghost.position;

  if (!isInsideIsland(position)) {
    buildingState.validPlacement = false;
    return false;
  }

  if (isInsideLake(position)) {
    buildingState.validPlacement = false;
    return false;
  }

  if (!hasMaterials(buildingState.selectedBuilding)) {
    buildingState.validPlacement = false;
    return false;
  }

  const box = getGhostBox();

  if (!box) {
    buildingState.validPlacement = false;
    return false;
  }

  if (isOverlappingExistingBuilding(box)) {
    buildingState.validPlacement = false;
    return false;
  }

  buildingState.validPlacement = true;

  return true;
}

// --------------------------------------------------
// GHOST MATERIAL
// --------------------------------------------------

function createGhostMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x4cff78,
    transparent: true,
    opacity: 0.42,
    roughness: 0.75,
    metalness: 0
  });
}

function updateGhostColor() {
  if (!buildingState.ghost) {
    return;
  }

  const valid = buildingState.validPlacement;

  buildingState.ghost.traverse(object => {
    if (!object.isMesh) {
      return;
    }

    object.material = object.material.clone();

    object.material.color.setHex(
      valid ? 0x4cff78 : 0xff4c4c
    );

    object.material.opacity = valid ? 0.42 : 0.32;
    object.material.transparent = true;
  });
}

// --------------------------------------------------
// BUILDING MESHES
// --------------------------------------------------

function createWoodMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0
  });
}

function createBuildingMesh(buildingId) {
  const building = getBuilding(buildingId);

  if (!building) {
    return null;
  }

  const group = new THREE.Group();

  // -----------------------------------------------
  // FLOOR
  // -----------------------------------------------

  if (building.type === "floor") {
    const geometry = new THREE.BoxGeometry(
      2.8,
      0.18,
      2.8
    );

    const mesh = new THREE.Mesh(
      geometry,
      createWoodMaterial(0x8b5a2b)
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    // Wooden support beams.
    for (let x = -1; x <= 1; x += 1) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.22, 2.6),
        createWoodMaterial(0x5d351a)
      );

      beam.position.set(x, -0.13, 0);
      beam.castShadow = true;

      group.add(beam);
    }

    return group;
  }

  // -----------------------------------------------
  // WALL
  // -----------------------------------------------

  if (building.type === "wall") {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 2.6, 0.18),
      createWoodMaterial(0x74451f)
    );

    wall.position.y = 1.3;
    wall.castShadow = true;
    wall.receiveShadow = true;

    group.add(wall);

    // Vertical supports.
    for (const x of [-1.25, 0, 1.25]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 2.72, 0.24),
        createWoodMaterial(0x4f2c15)
      );

      post.position.set(x, 1.36, 0);
      post.castShadow = true;

      group.add(post);
    }

    // Horizontal support.
    for (const y of [0.55, 1.3, 2.05]) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.13, 0.25),
        createWoodMaterial(0x4f2c15)
      );

      beam.position.set(0, y, 0);
      beam.castShadow = true;

      group.add(beam);
    }

    return group;
  }

  // -----------------------------------------------
  // DOOR
  // -----------------------------------------------

  if (building.type === "door") {
    const frameMaterial = createWoodMaterial(0x4b2914);
    const doorMaterial = createWoodMaterial(0x5b351a);

    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 2.7, 0.28),
      frameMaterial
    );

    frameLeft.position.set(-1.3, 1.35, 0);

    const frameRight = frameLeft.clone();
    frameRight.position.x = 1.3;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.78, 0.18, 0.28),
      frameMaterial
    );

    top.position.set(0, 2.65, 0);

    group.add(frameLeft);
    group.add(frameRight);
    group.add(top);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 2.35, 0.14),
      doorMaterial
    );

    door.position.set(0, 1.18, 0);

    group.add(door);

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xb99a58,
        roughness: 0.4,
        metalness: 0.65
      })
    );

    handle.position.set(0.82, 1.2, -0.13);

    group.add(handle);

    return group;
  }

  // -----------------------------------------------
  // CAMPFIRE
  // -----------------------------------------------

  if (building.type === "campfire") {
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x575757,
      roughness: 1
    });

    const woodMaterial = createWoodMaterial(0x583117);

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;

      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22, 0),
        stoneMaterial
      );

      stone.position.set(
        Math.cos(angle) * 0.55,
        0.22,
        Math.sin(angle) * 0.55
      );

      stone.scale.set(1, 0.7, 1);
      stone.castShadow = true;

      group.add(stone);
    }

    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.12,
          0.14,
          1.05,
          8
        ),
        woodMaterial
      );

      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 3;

      log.position.y = 0.35;

      group.add(log);
    }

    const flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8a20,
      emissive: 0xff4d00,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.9
    });

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.9, 8),
      flameMaterial
    );

    flame.position.y = 0.95;
    flame.scale.x = 0.7;
    flame.scale.z = 0.7;

    group.add(flame);

    const light = new THREE.PointLight(
      0xff7a22,
      2.2,
      7,
      2
    );

    light.position.y = 1.1;

    group.add(light);

    group.userData.flame = flame;
    group.userData.light = light;

    return group;
  }

  // -----------------------------------------------
  // STORAGE BOX
  // -----------------------------------------------

  if (building.type === "storage") {
    const boxMaterial = createWoodMaterial(0x6e421e);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.9, 1.1),
      boxMaterial
    );

    box.position.y = 0.5;
    box.castShadow = true;
    box.receiveShadow = true;

    group.add(box);

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 0.14, 1.16),
      createWoodMaterial(0x4d2c16)
    );

    lid.position.y = 1.0;
    lid.castShadow = true;

    group.add(lid);

    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x9a743f,
      roughness: 0.5,
      metalness: 0.25
    });

    for (const x of [-0.55, 0.55]) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.98, 1.15),
        bandMaterial
      );

      band.position.set(x, 0.53, 0);

      group.add(band);
    }

    return group;
  }

  return null;
}

// --------------------------------------------------
// GHOST CREATION
// --------------------------------------------------

function createGhost() {
  removeGhost();

  const mesh = createBuildingMesh(
    buildingState.selectedBuilding
  );

  if (!mesh) {
    return;
  }

  const ghostMaterial = createGhostMaterial();

  mesh.traverse(object => {
    if (!object.isMesh) {
      return;
    }

    object.material = ghostMaterial.clone();
    object.castShadow = false;
    object.receiveShadow = false;
  });

  mesh.userData.isBuildingGhost = true;
  mesh.userData.buildingId =
    buildingState.selectedBuilding;

  buildingState.ghost = mesh;

  const scene = SurvivalVR.scene;

  if (scene) {
    scene.add(mesh);
  }

  updateGhost();
}

function removeGhost() {
  if (!buildingState.ghost) {
    return;
  }

  if (buildingState.ghost.parent) {
    buildingState.ghost.parent.remove(
      buildingState.ghost
    );
  }

  buildingState.ghost.traverse(object => {
    if (object.geometry) {
      object.geometry.dispose();
    }

    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          material.dispose();
        });
      } else {
        object.material.dispose();
      }
    }
  });

  buildingState.ghost = null;
}

// --------------------------------------------------
// UPDATE GHOST
// --------------------------------------------------

function updateGhost() {
  if (!buildingState.active) {
    return;
  }

  if (!buildingState.ghost) {
    createGhost();
  }

  if (!buildingState.ghost) {
    return;
  }

  const position = getPlacementPosition();

  if (!position) {
    return;
  }

  buildingState.ghost.position.copy(position);

  buildingState.ghost.rotation.y =
    buildingState.rotation;

  validatePlacement();
  updateGhostColor();
}

// --------------------------------------------------
// PLACE BUILDING
// --------------------------------------------------

function placeBuilding() {
  if (!buildingState.active) {
    return false;
  }

  const now = performance.now();

  if (
    now - buildingState.lastPlacement <
    buildingState.placementCooldown
  ) {
    return false;
  }

  buildingState.lastPlacement = now;

  updateGhost();

  if (!buildingState.validPlacement) {
    showMessage("You can't build there.");
    return false;
  }

  const buildingId =
    buildingState.selectedBuilding;

  if (!consumeMaterials(buildingId)) {
    showMessage("You don't have enough materials.");
    updateGhost();
    refreshBuildingUI();
    return false;
  }

  const building = getBuilding(buildingId);

  const mesh = createBuildingMesh(buildingId);

  if (!mesh) {
    showMessage("Building failed.");
    return false;
  }

  const position =
    buildingState.ghost.position.clone();

  mesh.position.copy(position);
  mesh.rotation.y = buildingState.rotation;

  mesh.userData.buildingId = buildingId;
  mesh.userData.type = building.type;
  mesh.userData.createdAt = Date.now();

  if (SurvivalVR.scene) {
    SurvivalVR.scene.add(mesh);
  }

  if (!SurvivalVR.buildings) {
    SurvivalVR.buildings = [];
  }

  const buildingRecord = {
    id: buildingId,
    type: building.type,
    mesh,
    position: {
      x: position.x,
      y: position.y,
      z: position.z
    },
    rotation: buildingState.rotation,
    createdAt: Date.now()
  };

  SurvivalVR.buildings.push(
    buildingRecord
  );

  // Keep the core game state synchronized.
  addBuildingPiece(buildingId);

  GAME.statistics.buildingsBuilt =
    (GAME.statistics.buildingsBuilt || 0) + 1;

  if (building.type === "campfire") {
    buildingState.campfires.push(mesh);
  }

  if (building.type === "storage") {
    buildingState.storageBoxes.push(mesh);
  }

  gameEvent(
    "building-placed",
    buildingRecord
  );

  showMessage(
    `${building.name} built!`
  );

  refreshBuildingUI();

  updateGhost();

  return true;
}

// --------------------------------------------------
// SELECTION
// --------------------------------------------------

function selectBuilding(id) {
  if (!BUILDINGS[id]) {
    return;
  }

  buildingState.selectedBuilding = id;

  createGhost();
  refreshBuildingUI();

  showMessage(
    `Selected ${BUILDINGS[id].name}`
  );
}

function rotateBuilding() {
  buildingState.rotation += Math.PI / 2;

  if (
    buildingState.rotation >=
    Math.PI * 2
  ) {
    buildingState.rotation = 0;
  }

  updateGhost();
}

// --------------------------------------------------
// UI
// --------------------------------------------------

function createBuildingUI() {
  if (document.getElementById("buildingUI")) {
    return;
  }

  const panel = document.createElement("div");

  panel.id = "buildingUI";
  panel.className =
    "overlayPanel buildingUI hidden";

  panel.innerHTML = `
    <div class="panelHeader">
      <div>
        <div class="panelTitle">BUILD</div>
        <div class="panelSubtitle">
          Choose a structure
        </div>
      </div>

      <button
        class="closeButton"
        id="buildingClose"
        type="button"
      >
        ×
      </button>
    </div>

    <div
      class="buildingControls"
      style="
        display:flex;
        gap:8px;
        margin:12px 0;
        flex-wrap:wrap;
      "
    >
      <button
        class="secondaryButton"
        id="buildingRotate"
        type="button"
      >
        ↻ Rotate
      </button>

      <button
        class="secondaryButton"
        id="buildingCancel"
        type="button"
      >
        Cancel
      </button>
    </div>

    <div
      id="buildingList"
      class="buildingGrid"
    ></div>

    <div
      id="buildingHint"
      class="buildingHint"
    >
      Move the ghost where you want to build.
    </div>
  `;

  document.body.appendChild(panel);

  buildingState.ui = panel;

  document
    .getElementById("buildingClose")
    ?.addEventListener(
      "click",
      () => setBuildingMode(false)
    );

  document
    .getElementById("buildingCancel")
    ?.addEventListener(
      "click",
      () => setBuildingMode(false)
    );

  document
    .getElementById("buildingRotate")
    ?.addEventListener(
      "click",
      rotateBuilding
    );

  renderBuildingCards();
}

function renderBuildingCards() {
  const list =
    document.getElementById("buildingList");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  for (const id of BUILDING_ORDER) {
    const building = BUILDINGS[id];

    const card =
      document.createElement("button");

    card.type = "button";
    card.className = "buildingCard";

    card.dataset.building = id;

    card.innerHTML = `
      <div
        class="buildingIcon"
        style="font-size:28px;"
      >
        ${building.icon}
      </div>

      <div
        class="buildingName"
      >
        ${building.name}
      </div>

      <div
        class="buildingMaterials"
      >
        ${getRecipeText(
          getRecipe(building.recipe)
        )}
      </div>
    `;

    card.addEventListener(
      "click",
      () => selectBuilding(id)
    );

    list.appendChild(card);

    buildingState.buttons.set(
      id,
      card
    );
  }
}

function refreshBuildingUI() {
  for (
    const [id, button]
    of buildingState.buttons.entries()
  ) {
    const building = BUILDINGS[id];

    const enough =
      hasMaterials(id);

    button.classList.toggle(
      "selected",
      id === buildingState.selectedBuilding
    );

    button.classList.toggle(
      "disabled",
      !enough
    );

    button.setAttribute(
      "aria-disabled",
      String(!enough)
    );
  }

  const hint =
    document.getElementById("buildingHint");

  if (!hint) {
    return;
  }

  if (!buildingState.active) {
    hint.textContent =
      "Press B to enter building mode.";
    return;
  }

  if (!buildingState.validPlacement) {
    hint.textContent =
      "Red = invalid placement.";
  } else {
    hint.textContent =
      "Green = valid placement. Press E or grab to build.";
  }
}

function setBuildingMode(active) {
  buildingState.active = Boolean(active);

  if (buildingState.active) {
    createBuildingUI();

    buildingState.ui?.classList.remove(
      "hidden"
    );

    createGhost();
    refreshBuildingUI();
  } else {
    buildingState.ui?.classList.add(
      "hidden"
    );

    removeGhost();
  }
}

function toggleBuilding() {
  setBuildingMode(
    !buildingState.active
  );
}

// --------------------------------------------------
// CAMPFIRE ANIMATION
// --------------------------------------------------

function updateCampfires(time) {
  for (const campfire of buildingState.campfires) {
    if (!campfire) {
      continue;
    }

    const flame =
      campfire.userData.flame;

    const light =
      campfire.userData.light;

    if (flame) {
      flame.scale.y =
        0.85 +
        Math.sin(time * 0.012) * 0.16;

      flame.scale.x =
        0.7 +
        Math.sin(time * 0.017) * 0.08;

      flame.rotation.y =
        time * 0.002;
    }

    if (light) {
      light.intensity =
        2.0 +
        Math.sin(time * 0.009) * 0.35;
    }
  }
}

// --------------------------------------------------
// INPUT
// --------------------------------------------------

function handleKeyDown(event) {
  const key =
    event.key.toLowerCase();

  if (key === "b") {
    toggleBuilding();
    return;
  }

  if (
    key === "escape" &&
    buildingState.active
  ) {
    setBuildingMode(false);
    return;
  }

  if (
    key === "r" &&
    buildingState.active
  ) {
    rotateBuilding();
    return;
  }

  if (
    key === "e" &&
    buildingState.active
  ) {
    placeBuilding();
    return;
  }

  if (!buildingState.active) {
    return;
  }

  const number =
    Number(event.key);

  if (
    number >= 1 &&
    number <= BUILDING_ORDER.length
  ) {
    selectBuilding(
      BUILDING_ORDER[number - 1]
    );
  }
}

function handleGrab(event) {
  if (!buildingState.active) {
    return;
  }

  placeBuilding();
}

// --------------------------------------------------
// EVENTS
// --------------------------------------------------

function setupEvents() {
  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  window.addEventListener(
    "survival-grab",
    handleGrab
  );

  window.addEventListener(
    "survival-menu-button",
    () => {
      if (buildingState.active) {
        setBuildingMode(false);
      }
    }
  );

  window.addEventListener(
    "survival-inventory-changed",
    () => {
      refreshBuildingUI();
      updateGhost();
    }
  );
}

// --------------------------------------------------
// SYSTEM API
// --------------------------------------------------

function initialize() {
  if (buildingState.initialized) {
    return;
  }

  buildingState.initialized = true;

  createBuildingUI();
  setupEvents();

  refreshBuildingUI();
}

function update(time = performance.now()) {
  if (!buildingState.initialized) {
    initialize();
  }

  if (buildingState.active) {
    updateGhost();
  }

  updateCampfires(time);
}

function getState() {
  return {
    ...buildingState,
    ghost: undefined,
    ui: undefined,
    buttons: undefined
  };
}

function destroy() {
  setBuildingMode(false);

  for (const campfire of buildingState.campfires) {
    if (campfire?.parent) {
      campfire.parent.remove(campfire);
    }
  }

  buildingState.campfires.length = 0;
  buildingState.storageBoxes.length = 0;

  window.removeEventListener(
    "keydown",
    handleKeyDown
  );

  buildingState.initialized = false;
}

// --------------------------------------------------
// REGISTER SYSTEM
// --------------------------------------------------

SurvivalVR.systems.building = {
  state: buildingState,

  BUILDINGS,
  BUILDING_ORDER,

  initialize,
  update,

  open: () => setBuildingMode(true),
  close: () => setBuildingMode(false),
  toggle: toggleBuilding,

  select: selectBuilding,
  rotate: rotateBuilding,
  place: placeBuilding,

  hasMaterials,
  getPlacementPosition,
  validatePlacement,

  getState,
  destroy
};

initialize();

export {
  BUILDINGS,
  BUILDING_ORDER,
  buildingState,
  initialize,
  update,
  setBuildingMode,
  toggleBuilding,
  selectBuilding,
  rotateBuilding,
  placeBuilding,
  hasMaterials
};