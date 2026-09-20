// game.js
// ============================================================
// SURVIVAL VR — CORE GAME SYSTEM
// ============================================================

export const GAME_VERSION = 4;

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------

export const CONSTANTS = {
  MAX_HEALTH: 100,
  MAX_HUNGER: 100,
  MAX_THIRST: 100,
  MAX_STAMINA: 100,

  HUNGER_DRAIN_PER_MINUTE: 0.08,
  THIRST_DRAIN_PER_MINUTE: 0.14,

  SPRINT_STAMINA_DRAIN: 10,
  STAMINA_REGEN: 16,

  STARTING_HEALTH: 100,
  STARTING_HUNGER: 100,
  STARTING_THIRST: 100,
  STARTING_STAMINA: 100,

  PLAYER_HEIGHT: 1.65,

  WORLD_START_TIME: 8,

  STARTING_INVENTORY: {
    rock: 1
  }
};

// ------------------------------------------------------------
// DEFAULT STATE
// ------------------------------------------------------------

function createDefaultWorld() {
  return {
    id: "",
    name: "Unnamed Island",
    seed: "",
    createdAt: 0,
    lastSavedAt: 0,

    day: 1,
    time: CONSTANTS.WORLD_START_TIME,

    weather: "sunny"
  };
}

function createDefaultPlayer() {
  return {
    health: CONSTANTS.STARTING_HEALTH,
    hunger: CONSTANTS.STARTING_HUNGER,
    thirst: CONSTANTS.STARTING_THIRST,
    stamina: CONSTANTS.STARTING_STAMINA,

    alive: true,
    sleeping: false,
    sprinting: false
  };
}

function createDefaultPosition() {
  return {
    x: 0,
    y: CONSTANTS.PLAYER_HEIGHT,
    z: 0,
    rotationY: 0
  };
}

function createDefaultInventory() {
  return {
    rock: 1,
    stone: 0,
    wood: 0,
    log: 0,
    stick: 0,
    fiber: 0,
    string: 0,
    leaf: 0,

    food: 0,
    water: 0,

    rawMeat: 0,
    cookedMeat: 0,

    stoneAxe: 0,
    stonePickaxe: 0,

    campfire: 0,
    storageBox: 0,

    woodWall: 0,
    woodFloor: 0,
    woodDoor: 0
  };
}

function createDefaultEquipment() {
  return {
    leftSide: null,
    rightSide: null
  };
}

function createDefaultHands() {
  return {
    left: null,
    right: null
  };
}

function createDefaultResources() {
  return {
    treesCut: 0,
    rocksBroken: 0,
    logsCollected: 0,

    wood: 0,
    stone: 0,
    fiber: 0
  };
}

function createDefaultBuildings() {
  return {
    total: 0,

    woodFloor: 0,
    woodWall: 0,
    woodDoor: 0,

    campfire: 0,
    storageBox: 0,

    placed: []
  };
}

function createDefaultCrafting() {
  return {
    unlockedRecipes: [
      "string",
      "stick",
      "stone"
    ],

    crafted: {},

    lastCrafted: null
  };
}

function createDefaultGuide() {
  return {
    discoveredPages: [
      "first_day"
    ],

    discoveredRecipes: [
      "string",
      "stick",
      "stone"
    ],

    currentPage: "first_day"
  };
}

function createDefaultAnimals() {
  return {
    rabbits: [],
    deer: [],
    birds: [],

    total: 0
  };
}

function createDefaultEnvironment() {
  return {
    wind: {
      direction: 0,
      strength: 0.2
    },

    waterLevel: 0,
    grassDensity: 1,
    treeDensity: 1
  };
}

function createDefaultSettings() {
  return {
    masterVolume: 1,
    musicVolume: 0.7,
    effectsVolume: 1,
    environmentVolume: 0.8,
    animalVolume: 0.8,

    graphicsQuality: "medium",
    shadows: true,
    waterQuality: "medium",
    grassQuality: "medium",
    viewDistance: "medium",

    vibration: true,

    snapTurning: true,
    snapTurnAmount: 30,

    autosave: true
  };
}

function createDefaultState() {
  return {
    started: false,
    paused: false,
    gameOver: false,
    loading: false,
    inVR: false
  };
}

function createDefaultStatistics() {
  return {
    treesCut: 0,
    rocksBroken: 0,
    logsCollected: 0,

    itemsCrafted: 0,
    buildingsBuilt: 0,

    animalsSeen: 0,

    daysSurvived: 0,
    distanceWalked: 0
  };
}

// ------------------------------------------------------------
// GAME OBJECT
// ------------------------------------------------------------

export const GAME = {
  version: GAME_VERSION,

  world: createDefaultWorld(),

  player: createDefaultPlayer(),

  position: createDefaultPosition(),

  inventory: createDefaultInventory(),

  equipment: createDefaultEquipment(),

  hands: createDefaultHands(),

  resources: createDefaultResources(),

  buildings: createDefaultBuildings(),

  crafting: createDefaultCrafting(),

  guide: createDefaultGuide(),

  animals: createDefaultAnimals(),

  environment: createDefaultEnvironment(),

  settings: createDefaultSettings(),

  state: createDefaultState(),

  statistics: createDefaultStatistics(),

  save: {
    hasSave: false,
    lastSaved: 0,
    saveCount: 0
  }
};

// IMPORTANT:
// Keep this same object forever.
// Other modules import `player`, so replacing GAME.player
// would leave those modules pointing to an old object.
export const player = GAME.player;

// ------------------------------------------------------------
// SURVIVALVR GLOBAL
// ------------------------------------------------------------

const S = window.SurvivalVR || null;

if (S) {
  S.GAME = GAME;
  S.player = player;
}

// ------------------------------------------------------------
// COMPATIBILITY SYNC
// ------------------------------------------------------------

function syncCompatibility() {
  GAME.health = GAME.player.health;
  GAME.hunger = GAME.player.hunger;
  GAME.thirst = GAME.player.thirst;
  GAME.stamina = GAME.player.stamina;

  GAME.alive = GAME.player.alive;
  GAME.sprinting = GAME.player.sprinting;

  GAME.worldSeed = GAME.world.seed;
  GAME.worldName = GAME.world.name;
}

// ------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------

export function gameEvent(name, detail = {}) {
  const eventName = String(name)
    .replace(/^survival-/, "");

  const event = new CustomEvent(
    `survival-${eventName}`,
    {
      detail: {
        ...detail,
        game: GAME
      }
    }
  );

  window.dispatchEvent(event);

  return event;
}

// ------------------------------------------------------------
// WORLD
// ------------------------------------------------------------

export function setWorldName(name) {
  GAME.world.name = String(name || "Unnamed Island");

  syncCompatibility();

  gameEvent("world-name-changed", {
    name: GAME.world.name
  });
}

export function setWorldSeed(seed) {
  GAME.world.seed = String(seed || "");

  syncCompatibility();

  gameEvent("world-seed-changed", {
    seed: GAME.world.seed
  });
}

export function setWorldDay(day) {
  GAME.world.day = Math.max(
    1,
    Math.floor(Number(day) || 1)
  );

  syncCompatibility();
}

export function setWorldTime(time) {
  let value = Number(time);

  if (!Number.isFinite(value)) {
    value = CONSTANTS.WORLD_START_TIME;
  }

  while (value >= 24) {
    value -= 24;
    GAME.world.day++;
  }

  while (value < 0) {
    value += 24;

    GAME.world.day = Math.max(
      1,
      GAME.world.day - 1
    );
  }

  GAME.world.time = value;

  syncCompatibility();
}

// ------------------------------------------------------------
// POSITION
// ------------------------------------------------------------

export function setPlayerPosition(x, y, z) {
  GAME.position.x = Number(x) || 0;
  GAME.position.y = Number.isFinite(Number(y))
    ? Number(y)
    : CONSTANTS.PLAYER_HEIGHT;
  GAME.position.z = Number(z) || 0;

  syncPlayerGroupPosition();
}

export function movePlayer(x, y, z) {
  GAME.position.x += Number(x) || 0;
  GAME.position.y += Number(y) || 0;
  GAME.position.z += Number(z) || 0;

  GAME.statistics.distanceWalked += Math.sqrt(
    (Number(x) || 0) ** 2 +
    (Number(y) || 0) ** 2 +
    (Number(z) || 0) ** 2
  );

  syncPlayerGroupPosition();
}

export function turnPlayer(amount) {
  GAME.position.rotationY += Number(amount) || 0;

  if (S?.playerGroup) {
    S.playerGroup.rotation.y =
      GAME.position.rotationY;
  }
}

function syncPlayerGroupPosition() {
  if (!S?.playerGroup) return;

  S.playerGroup.position.set(
    GAME.position.x,
    GAME.position.y,
    GAME.position.z
  );

  S.playerGroup.rotation.y =
    GAME.position.rotationY;
}

// ------------------------------------------------------------
// SPRINTING
// ------------------------------------------------------------

export function setSprinting(value) {
  GAME.player.sprinting =
    !!value &&
    GAME.player.stamina > 0 &&
    GAME.player.alive;

  syncCompatibility();

  gameEvent("sprinting-changed", {
    sprinting: GAME.player.sprinting
  });
}

export function isSprinting() {
  return GAME.player.sprinting;
}

// ------------------------------------------------------------
// SURVIVAL
// ------------------------------------------------------------

export function updateSurvival(deltaSeconds = 0) {
  if (!GAME.state.started) return;

  if (GAME.state.paused) return;

  if (GAME.state.gameOver) return;

  if (!GAME.player.alive) return;

  const minutesPassed =
    Math.max(0, Number(deltaSeconds) || 0) / 60;

  GAME.player.hunger -=
    CONSTANTS.HUNGER_DRAIN_PER_MINUTE *
    minutesPassed;

  GAME.player.thirst -=
    CONSTANTS.THIRST_DRAIN_PER_MINUTE *
    minutesPassed;

  GAME.player.hunger = clamp(
    GAME.player.hunger,
    0,
    CONSTANTS.MAX_HUNGER
  );

  GAME.player.thirst = clamp(
    GAME.player.thirst,
    0,
    CONSTANTS.MAX_THIRST
  );

  if (GAME.player.sprinting) {
    GAME.player.stamina -=
      CONSTANTS.SPRINT_STAMINA_DRAIN *
      Math.max(0, Number(deltaSeconds) || 0);

    if (GAME.player.stamina <= 0) {
      GAME.player.stamina = 0;
      GAME.player.sprinting = false;

      gameEvent("sprint-exhausted");
    }
  } else {
    GAME.player.stamina +=
      CONSTANTS.STAMINA_REGEN *
      Math.max(0, Number(deltaSeconds) || 0);
  }

  GAME.player.stamina = clamp(
    GAME.player.stamina,
    0,
    CONSTANTS.MAX_STAMINA
  );

  // Hunger/thirst reaching zero causes gradual damage.
  if (
    GAME.player.hunger <= 0 ||
    GAME.player.thirst <= 0
  ) {
    damagePlayer(
      2 * Math.max(0, Number(deltaSeconds) || 0)
    );
  }

  syncCompatibility();

  gameEvent("survival-updated", {
    health: GAME.player.health,
    hunger: GAME.player.hunger,
    thirst: GAME.player.thirst,
    stamina: GAME.player.stamina
  });
}

// ------------------------------------------------------------
// HEALTH
// ------------------------------------------------------------

export function damagePlayer(amount) {
  if (!GAME.player.alive) return;

  const damage =
    Math.max(0, Number(amount) || 0);

  GAME.player.health -= damage;

  GAME.player.health = clamp(
    GAME.player.health,
    0,
    CONSTANTS.MAX_HEALTH
  );

  gameEvent("player-damaged", {
    amount: damage,
    health: GAME.player.health
  });

  if (GAME.player.health <= 0) {
    killPlayer();
  }

  syncCompatibility();
}

export function healPlayer(amount) {
  if (!GAME.player.alive) return;

  const healing =
    Math.max(0, Number(amount) || 0);

  GAME.player.health = clamp(
    GAME.player.health + healing,
    0,
    CONSTANTS.MAX_HEALTH
  );

  syncCompatibility();

  gameEvent("player-healed", {
    amount: healing,
    health: GAME.player.health
  });
}

export function eatFood(amount = 20) {
  if (!GAME.player.alive) return false;

  let item = null;

  if (GAME.inventory.cookedMeat > 0) {
    item = "cookedMeat";
  } else if (GAME.inventory.food > 0) {
    item = "food";
  } else if (GAME.inventory.rawMeat > 0) {
    item = "rawMeat";
  }

  if (!item) return false;

  GAME.inventory[item]--;

  GAME.player.hunger = clamp(
    GAME.player.hunger + Number(amount || 20),
    0,
    CONSTANTS.MAX_HUNGER
  );

  syncCompatibility();

  gameEvent("food-eaten", {
    item
  });

  return true;
}

export function drinkWater(amount = 35) {
  if (!GAME.player.alive) return false;

  if (GAME.inventory.water <= 0) {
    return false;
  }

  GAME.inventory.water--;

  GAME.player.thirst = clamp(
    GAME.player.thirst + Number(amount || 35),
    0,
    CONSTANTS.MAX_THIRST
  );

  syncCompatibility();

  gameEvent("water-drunk", {
    amount
  });

  return true;
}

export function killPlayer() {
  if (!GAME.player.alive) return;

  GAME.player.health = 0;
  GAME.player.alive = false;
  GAME.player.sprinting = false;

  GAME.state.gameOver = true;

  syncCompatibility();

  gameEvent("game-over", {
    reason: "player-died"
  });
}

// ------------------------------------------------------------
// INVENTORY
// ------------------------------------------------------------

export function addItem(item, amount = 1) {
  if (!item) return false;

  const quantity =
    Math.max(0, Math.floor(Number(amount) || 0));

  if (quantity <= 0) return false;

  if (
    typeof GAME.inventory[item] !== "number"
  ) {
    GAME.inventory[item] = 0;
  }

  GAME.inventory[item] += quantity;

  gameEvent("inventory-changed", {
    item,
    amount: quantity,
    action: "add"
  });

  return true;
}

export function removeItem(item, amount = 1) {
  if (!item) return false;

  const quantity =
    Math.max(0, Math.floor(Number(amount) || 0));

  if (
    typeof GAME.inventory[item] !== "number" ||
    GAME.inventory[item] < quantity
  ) {
    return false;
  }

  GAME.inventory[item] -= quantity;

  gameEvent("inventory-changed", {
    item,
    amount: quantity,
    action: "remove"
  });

  return true;
}

export function hasItem(item, amount = 1) {
  return getItemCount(item) >=
    Math.max(0, Number(amount) || 0);
}

export function getItemCount(item) {
  return Number(
    GAME.inventory[item] || 0
  );
}

export function clearInventory() {
  const defaults = createDefaultInventory();

  Object.keys(GAME.inventory).forEach(key => {
    GAME.inventory[key] = 0;
  });

  // Starting rock.
  GAME.inventory.rock =
    defaults.rock;

  gameEvent("inventory-cleared");
}

// ------------------------------------------------------------
// RESOURCE GATHERING
// ------------------------------------------------------------

export function gatherResource(
  type,
  amount = 1
) {
  const quantity =
    Math.max(1, Math.floor(Number(amount) || 1));

  switch (type) {
    case "tree":
    case "wood":
      addItem("wood", quantity);

      GAME.resources.wood += quantity;
      GAME.resources.treesCut += 1;
      GAME.statistics.treesCut += 1;

      break;

    case "log":
      addItem("log", quantity);

      GAME.resources.wood += quantity;
      GAME.resources.logsCollected += quantity;
      GAME.statistics.logsCollected += quantity;

      break;

    case "rock":
    case "stone":
      addItem("stone", quantity);

      GAME.resources.stone += quantity;
      GAME.resources.rocksBroken += 1;
      GAME.statistics.rocksBroken += 1;

      break;

    case "fiber":
      addItem("fiber", quantity);

      GAME.resources.fiber += quantity;

      break;

    case "stick":
      addItem("stick", quantity);

      break;

    case "leaf":
      addItem("leaf", quantity);

      break;

    default:
      addItem(type, quantity);
      break;
  }

  gameEvent("resource-gathered", {
    type,
    amount: quantity
  });

  return true;
}

// ------------------------------------------------------------
// BASIC CRAFTING HELPERS
// ------------------------------------------------------------

export function craftString() {
  if (!hasItem("fiber", 3)) {
    return false;
  }

  removeItem("fiber", 3);
  addItem("string", 1);

  registerCraft("string");

  return true;
}

export function craftStick() {
  if (!hasItem("wood", 1)) {
    return false;
  }

  removeItem("wood", 1);
  addItem("stick", 2);

  registerCraft("stick");

  return true;
}

export function registerCraft(recipeId) {
  if (!recipeId) return;

  GAME.crafting.crafted[recipeId] =
    (GAME.crafting.crafted[recipeId] || 0) + 1;

  GAME.crafting.lastCrafted =
    recipeId;

  GAME.statistics.itemsCrafted++;

  if (
    !GAME.crafting.unlockedRecipes.includes(
      recipeId
    )
  ) {
    GAME.crafting.unlockedRecipes.push(
      recipeId
    );
  }

  gameEvent("crafting-complete", {
    recipeId
  });
}

export function unlockRecipe(recipeId) {
  if (!recipeId) return false;

  if (
    !GAME.crafting.unlockedRecipes.includes(
      recipeId
    )
  ) {
    GAME.crafting.unlockedRecipes.push(
      recipeId
    );
  }

  if (
    !GAME.guide.discoveredRecipes.includes(
      recipeId
    )
  ) {
    GAME.guide.discoveredRecipes.push(
      recipeId
    );
  }

  gameEvent("recipe-unlocked", {
    recipeId
  });

  return true;
}

export function recipeUnlocked(recipeId) {
  return GAME.crafting.unlockedRecipes.includes(
    recipeId
  );
}

// ------------------------------------------------------------
// SIDE STORAGE
// ------------------------------------------------------------

export function putOnSide(side, item) {
  if (
    side !== "left" &&
    side !== "right"
  ) {
    return false;
  }

  const key =
    side === "left"
      ? "leftSide"
      : "rightSide";

  if (!hasItem(item, 1)) {
    return false;
  }

  if (GAME.equipment[key]) {
    return false;
  }

  removeItem(item, 1);

  GAME.equipment[key] = item;

  gameEvent("side-slot-changed", {
    side,
    item
  });

  return true;
}

export function takeFromSide(side) {
  if (
    side !== "left" &&
    side !== "right"
  ) {
    return null;
  }

  const key =
    side === "left"
      ? "leftSide"
      : "rightSide";

  const item =
    GAME.equipment[key];

  if (!item) {
    return null;
  }

  GAME.equipment[key] = null;

  addItem(item, 1);

  gameEvent("side-slot-changed", {
    side,
    item: null
  });

  return item;
}

// ------------------------------------------------------------
// HANDS
// ------------------------------------------------------------

export function holdItem(hand, item) {
  if (
    hand !== "left" &&
    hand !== "right"
  ) {
    return false;
  }

  GAME.hands[hand] = item || null;

  gameEvent("hand-item-changed", {
    hand,
    item: GAME.hands[hand]
  });

  return true;
}

export function releaseItem(hand) {
  if (
    hand !== "left" &&
    hand !== "right"
  ) {
    return null;
  }

  const item =
    GAME.hands[hand];

  GAME.hands[hand] = null;

  gameEvent("hand-item-changed", {
    hand,
    item: null
  });

  return item;
}

export function getHeldItem(hand) {
  if (
    hand !== "left" &&
    hand !== "right"
  ) {
    return null;
  }

  return GAME.hands[hand];
}

// ------------------------------------------------------------
// BUILDINGS
// ------------------------------------------------------------

export function addBuildingPiece(
  type,
  record = null
) {
  if (!type) return false;

  GAME.buildings.total++;

  if (
    typeof GAME.buildings[type] === "number"
  ) {
    GAME.buildings[type]++;
  } else {
    GAME.buildings[type] = 1;
  }

  if (record) {
    if (!Array.isArray(GAME.buildings.placed)) {
      GAME.buildings.placed = [];
    }

    GAME.buildings.placed.push(
      cloneSafe(record)
    );
  }

  GAME.statistics.buildingsBuilt++;

  gameEvent("building-placed", {
    type,
    record
  });

  return true;
}

export function removeBuildingPiece(
  type,
  recordId = null
) {
  if (!type) return false;

  if (
    typeof GAME.buildings[type] === "number" &&
    GAME.buildings[type] > 0
  ) {
    GAME.buildings[type]--;
  }

  GAME.buildings.total = Math.max(
    0,
    GAME.buildings.total - 1
  );

  if (
    recordId &&
    Array.isArray(GAME.buildings.placed)
  ) {
    GAME.buildings.placed =
      GAME.buildings.placed.filter(
        item => item.id !== recordId
      );
  }

  gameEvent("building-removed", {
    type,
    id: recordId
  });

  return true;
}

// ------------------------------------------------------------
// WORLD IDS
// ------------------------------------------------------------

export function createWorldId() {
  return (
    "world-" +
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

// ------------------------------------------------------------
// CREATE NEW WORLD
// ------------------------------------------------------------

export function createNewWorld(seed = null) {
  // Reset existing objects IN PLACE.
  // This is important because imported `player` must remain
  // connected to GAME.player.

  const newWorld = createDefaultWorld();
  const newPlayer = createDefaultPlayer();
  const newPosition = createDefaultPosition();
  const newInventory = createDefaultInventory();
  const newEquipment = createDefaultEquipment();
  const newHands = createDefaultHands();
  const newResources = createDefaultResources();
  const newBuildings = createDefaultBuildings();
  const newCrafting = createDefaultCrafting();
  const newGuide = createDefaultGuide();
  const newAnimals = createDefaultAnimals();
  const newEnvironment = createDefaultEnvironment();
  const newSettings = createDefaultSettings();
  const newState = createDefaultState();
  const newStatistics = createDefaultStatistics();

  const newSeed =
    seed ||
    generateReadableSeed();

  Object.assign(
    GAME.world,
    newWorld,
    {
      id: createWorldId(),
      seed: newSeed,
      createdAt: Date.now()
    }
  );

  Object.assign(
    GAME.player,
    newPlayer
  );

  Object.assign(
    GAME.position,
    newPosition
  );

  // Clear inventory then apply defaults.
  Object.keys(GAME.inventory).forEach(key => {
    delete GAME.inventory[key];
  });

  Object.assign(
    GAME.inventory,
    newInventory
  );

  Object.assign(
    GAME.equipment,
    newEquipment
  );

  Object.assign(
    GAME.hands,
    newHands
  );

  Object.assign(
    GAME.resources,
    newResources
  );

  Object.assign(
    GAME.buildings,
    newBuildings
  );

  Object.assign(
    GAME.crafting,
    newCrafting
  );

  Object.assign(
    GAME.guide,
    newGuide
  );

  Object.assign(
    GAME.animals,
    newAnimals
  );

  Object.assign(
    GAME.environment,
    newEnvironment
  );

  Object.assign(
    GAME.settings,
    newSettings
  );

  Object.assign(
    GAME.state,
    newState
  );

  Object.assign(
    GAME.statistics,
    newStatistics
  );

  GAME.save.hasSave = false;
  GAME.save.lastSaved = 0;

  syncCompatibility();

  // Clear systems that keep physical world objects.
  if (S?.systems?.building?.clearBuildings) {
    S.systems.building.clearBuildings();
  }

  if (S?.systems?.animals?.clearAnimals) {
    S.systems.animals.clearAnimals();
  }

  if (S?.systems?.world?.createNewWorld) {
    S.systems.world.createNewWorld(
      newSeed
    );
  }

  gameEvent("new-world-created", {
    id: GAME.world.id,
    seed: GAME.world.seed
  });

  return GAME.world;
}

// ------------------------------------------------------------
// SAVE DATA
// ------------------------------------------------------------

export function getGameData() {
  return cloneSafe(GAME);
}

// ------------------------------------------------------------
// LOAD DATA
// ------------------------------------------------------------

export function loadGameData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  const source =
    data.game &&
    typeof data.game === "object"
      ? data.game
      : data;

  // World
  if (source.world) {
    Object.assign(
      GAME.world,
      source.world
    );
  }

  // Player
  if (source.player) {
    Object.assign(
      GAME.player,
      source.player
    );
  }

  // Position
  if (source.position) {
    Object.assign(
      GAME.position,
      source.position
    );
  }

  // Inventory
  if (source.inventory) {
    Object.keys(GAME.inventory).forEach(key => {
      delete GAME.inventory[key];
    });

    Object.assign(
      GAME.inventory,
      source.inventory
    );
  }

  // Equipment
  if (source.equipment) {
    Object.assign(
      GAME.equipment,
      source.equipment
    );
  }

  // Hands
  if (source.hands) {
    Object.assign(
      GAME.hands,
      source.hands
    );
  }

  // Resources
  if (source.resources) {
    Object.assign(
      GAME.resources,
      source.resources
    );
  }

  // Buildings
  if (source.buildings) {
    Object.assign(
      GAME.buildings,
      source.buildings
    );

    if (!Array.isArray(GAME.buildings.placed)) {
      GAME.buildings.placed = [];
    }
  }

  // Crafting
  if (source.crafting) {
    Object.assign(
      GAME.crafting,
      source.crafting
    );
  }

  // Guide
  if (source.guide) {
    Object.assign(
      GAME.guide,
      source.guide
    );
  }

  // Animals
  if (source.animals) {
    Object.assign(
      GAME.animals,
      source.animals
    );
  }

  // Environment
  if (source.environment) {
    Object.assign(
      GAME.environment,
      source.environment
    );
  }

  // Settings
  if (source.settings) {
    Object.assign(
      GAME.settings,
      source.settings
    );
  }

  // State
  if (source.state) {
    Object.assign(
      GAME.state,
      source.state
    );
  }

  // Statistics
  if (source.statistics) {
    Object.assign(
      GAME.statistics,
      source.statistics
    );
  }

  // Save information
  if (source.save) {
    Object.assign(
      GAME.save,
      source.save
    );
  }

  // The game should not automatically be paused after loading.
  GAME.state.paused = false;

  syncCompatibility();

  syncPlayerGroupPosition();

  gameEvent("game-data-loaded");

  return true;
}

// ------------------------------------------------------------
// RESET GAME
// ------------------------------------------------------------

export function resetGame() {
  const currentSettings =
    cloneSafe(GAME.settings);

  const freshPlayer =
    createDefaultPlayer();

  const freshPosition =
    createDefaultPosition();

  Object.assign(
    GAME.player,
    freshPlayer
  );

  Object.assign(
    GAME.position,
    freshPosition
  );

  Object.keys(GAME.inventory).forEach(key => {
    delete GAME.inventory[key];
  });

  Object.assign(
    GAME.inventory,
    createDefaultInventory()
  );

  Object.assign(
    GAME.equipment,
    createDefaultEquipment()
  );

  Object.assign(
    GAME.hands,
    createDefaultHands()
  );

  Object.assign(
    GAME.resources,
    createDefaultResources()
  );

  Object.assign(
    GAME.buildings,
    createDefaultBuildings()
  );

  Object.assign(
    GAME.crafting,
    createDefaultCrafting()
  );

  Object.assign(
    GAME.guide,
    createDefaultGuide()
  );

  Object.assign(
    GAME.animals,
    createDefaultAnimals()
  );

  Object.assign(
    GAME.environment,
    createDefaultEnvironment()
  );

  Object.assign(
    GAME.state,
    createDefaultState()
  );

  Object.assign(
    GAME.statistics,
    createDefaultStatistics()
  );

  Object.assign(
    GAME.settings,
    createDefaultSettings(),
    currentSettings
  );

  syncCompatibility();

  gameEvent("game-reset");
}

// ------------------------------------------------------------
// PAUSE
// ------------------------------------------------------------

export function setPaused(value) {
  GAME.state.paused = !!value;

  gameEvent(
    GAME.state.paused
      ? "game-paused"
      : "game-resumed"
  );
}

// ------------------------------------------------------------
// VR STATE
// ------------------------------------------------------------

export function setVRState(value) {
  GAME.state.inVR = !!value;

  gameEvent("vr-state-changed", {
    inVR: GAME.state.inVR
  });
}

// ------------------------------------------------------------
// SAVED STATE
// ------------------------------------------------------------

export function markSaved() {
  GAME.world.lastSavedAt =
    Date.now();

  GAME.save.lastSaved =
    GAME.world.lastSavedAt;

  GAME.save.hasSave = true;

  gameEvent("save-marked", {
    savedAt: GAME.world.lastSavedAt
  });
}

// ------------------------------------------------------------
// PLAYER OBJECT COMPATIBILITY
// ------------------------------------------------------------

export function syncGameFromPlayerObject(
  playerObject
) {
  if (!playerObject) return;

  if (
    Number.isFinite(playerObject.health)
  ) {
    GAME.player.health =
      playerObject.health;
  }

  if (
    Number.isFinite(playerObject.hunger)
  ) {
    GAME.player.hunger =
      playerObject.hunger;
  }

  if (
    Number.isFinite(playerObject.thirst)
  ) {
    GAME.player.thirst =
      playerObject.thirst;
  }

  if (
    Number.isFinite(playerObject.stamina)
  ) {
    GAME.player.stamina =
      playerObject.stamina;
  }

  if (
    typeof playerObject.alive === "boolean"
  ) {
    GAME.player.alive =
      playerObject.alive;
  }

  syncCompatibility();
}

// ------------------------------------------------------------
// GAME INFO
// ------------------------------------------------------------

export function getGameInfo() {
  return {
    version: GAME_VERSION,

    world: {
      id: GAME.world.id,
      name: GAME.world.name,
      seed: GAME.world.seed,
      day: GAME.world.day,
      time: GAME.world.time
    },

    player: {
      health: GAME.player.health,
      hunger: GAME.player.hunger,
      thirst: GAME.player.thirst,
      stamina: GAME.player.stamina,
      alive: GAME.player.alive
    },

    position: cloneSafe(
      GAME.position
    ),

    inventory: cloneSafe(
      GAME.inventory
    ),

    state: cloneSafe(
      GAME.state
    )
  };
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function clamp(value, min, max) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

function cloneSafe(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

function generateReadableSeed() {
  const words = [
    "Oak",
    "Pine",
    "River",
    "Stone",
    "Cedar",
    "Moon",
    "Sunny",
    "Wild",
    "Forest",
    "Island",
    "Lake",
    "Meadow"
  ];

  const word =
    words[
      Math.floor(
        Math.random() * words.length
      )
    ];

  const number =
    Math.floor(
      100000 +
      Math.random() * 900000
    );

  return `${word}-${number}`;
}

// ------------------------------------------------------------
// GLOBAL REGISTRATION
// ------------------------------------------------------------

if (S) {
  S.GAME = GAME;
  S.player = player;

  S.gameEvent = gameEvent;

  S.setWorldName = setWorldName;
  S.setWorldSeed = setWorldSeed;
  S.setWorldDay = setWorldDay;
  S.setWorldTime = setWorldTime;

  S.setPlayerPosition =
    setPlayerPosition;

  S.movePlayer =
    movePlayer;

  S.turnPlayer =
    turnPlayer;

  S.setSprinting =
    setSprinting;

  S.isSprinting =
    isSprinting;

  S.updateSurvival =
    updateSurvival;

  S.damagePlayer =
    damagePlayer;

  S.healPlayer =
    healPlayer;

  S.eatFood =
    eatFood;

  S.drinkWater =
    drinkWater;

  S.killPlayer =
    killPlayer;

  S.addItem =
    addItem;

  S.removeItem =
    removeItem;

  S.hasItem =
    hasItem;

  S.getItemCount =
    getItemCount;

  S.clearInventory =
    clearInventory;

  S.gatherResource =
    gatherResource;

  S.craftString =
    craftString;

  S.craftStick =
    craftStick;

  S.registerCraft =
    registerCraft;

  S.unlockRecipe =
    unlockRecipe;

  S.recipeUnlocked =
    recipeUnlocked;

  S.putOnSide =
    putOnSide;

  S.takeFromSide =
    takeFromSide;

  S.holdItem =
    holdItem;

  S.releaseItem =
    releaseItem;

  S.getHeldItem =
    getHeldItem;

  S.addBuildingPiece =
    addBuildingPiece;

  S.removeBuildingPiece =
    removeBuildingPiece;

  S.createWorldId =
    createWorldId;

  S.createNewWorld =
    createNewWorld;

  S.getGameData =
    getGameData;

  S.loadGameData =
    loadGameData;

  S.resetGame =
    resetGame;

  S.setPaused =
    setPaused;

  S.setVRState =
    setVRState;

  S.markSaved =
    markSaved;

  S.getGameInfo =
    getGameInfo;
}

// ------------------------------------------------------------
// INITIAL SYNC
// ------------------------------------------------------------

syncCompatibility();

console.log(
  `Survival VR game core v${GAME_VERSION} loaded.`
);