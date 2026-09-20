// ============================================================
// SURVIVAL VR — GAME CORE
// game.js
// ============================================================

export const GAME_VERSION = 3;


// ============================================================
// CONSTANTS
// ============================================================

export const CONSTANTS = {

  MAX_HEALTH: 100,
  MAX_HUNGER: 100,
  MAX_THIRST: 100,
  MAX_STAMINA: 100,

  HUNGER_DRAIN_PER_SECOND: 0.035,
  THIRST_DRAIN_PER_SECOND: 0.055,

  SPRINT_STAMINA_DRAIN: 12,
  STAMINA_REGEN: 8,

  LOW_HUNGER_THRESHOLD: 20,
  LOW_THIRST_THRESHOLD: 20,

  WALK_SPEED: 2.1,
  SPRINT_SPEED: 4.0,

  PLAYER_HEIGHT: 1.65,

  MAX_INVENTORY_STACK: 999,

  WORLD_DAY_LENGTH: 24 * 60,

  SAVE_INTERVAL: 30000

};


// ============================================================
// DEFAULT GAME STATE
// ============================================================

const DEFAULT_GAME = {

  version: GAME_VERSION,

  world: {

    id: "",
    name: "Unnamed Island",
    seed: "",
    createdAt: 0,
    lastSavedAt: 0,

    day: 1,

    // 0–24 hours
    time: 8,

    weather: "sunny"

  },


  player: {

    health: 100,
    hunger: 100,
    thirst: 100,
    stamina: 100,

    alive: true,

    sleeping: false,

    sprinting: false

  },


  position: {

    x: 0,
    y: CONSTANTS.PLAYER_HEIGHT,
    z: 0,

    rotationY: 0

  },


  inventory: {

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

  },


  equipment: {

    leftSide: null,
    rightSide: null

  },


  hands: {

    left: null,
    right: null

  },


  resources: {

    treesCut: 0,
    rocksBroken: 0,
    logsCollected: 0,

    wood: 0,
    stone: 0,
    fiber: 0

  },


  buildings: {

    total: 0,

    woodFloor: 0,
    woodWall: 0,
    woodDoor: 0,

    campfire: 0,
    storageBox: 0

  },


  crafting: {

    unlockedRecipes: [
      "string",
      "stick"
    ],

    crafted: {},

    lastCrafted: null

  },


  guide: {

    discoveredPages: [
      "first_day"
    ],

    discoveredRecipes: [
      "string",
      "stick"
    ],

    currentPage: "first_day"

  },


  animals: {

    rabbits: [],
    deer: [],
    birds: [],

    total: 0

  },


  environment: {

    wind: {

      direction: 0,
      strength: 0.2

    },

    waterLevel: 0,
    grassDensity: 1,
    treeDensity: 1

  },


  settings: {

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
    snapTurnAmount: 30

  },


  state: {

    started: false,
    paused: false,

    gameOver: false,
    loading: false,

    inVR: false

  },


  statistics: {

    treesCut: 0,
    rocksBroken: 0,
    logsCollected: 0,

    itemsCrafted: 0,
    buildingsBuilt: 0,

    animalsSeen: 0,

    daysSurvived: 0,

    distanceWalked: 0

  }

};


// ============================================================
// DEEP CLONE
// ============================================================

function cloneDefaultGame() {

  return structuredClone(
    DEFAULT_GAME
  );

}


// ============================================================
// GAME OBJECT
// ============================================================

export const GAME =
  cloneDefaultGame();


// ============================================================
// PLAYER COMPATIBILITY OBJECT
// ============================================================

export const player = GAME.player;


// ============================================================
// GLOBAL SURVIVAL VR REFERENCE
// ============================================================

function getSurvivalVR() {

  return window.SurvivalVR || null;

}


// ============================================================
// EVENT SYSTEM
// ============================================================

export function gameEvent(
  eventName,
  detail = {}
) {

  const event =
    new CustomEvent(
      `survival-${eventName}`,
      {
        detail
      }
    );

  window.dispatchEvent(
    event
  );

  return event;

}


// ============================================================
// SAFE NUMBER
// ============================================================

function number(
  value,
  fallback = 0
) {

  const result =
    Number(value);

  return Number.isFinite(result)
    ? result
    : fallback;

}


// ============================================================
// CLAMP
// ============================================================

function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}


// ============================================================
// SYNC COMPATIBILITY VALUES
// ============================================================

function syncCompatibility() {

  GAME.health =
    GAME.player.health;

  GAME.hunger =
    GAME.player.hunger;

  GAME.thirst =
    GAME.player.thirst;

  GAME.stamina =
    GAME.player.stamina;

  GAME.alive =
    GAME.player.alive;

  GAME.sprinting =
    GAME.player.sprinting;

}


// ============================================================
// WORLD NAME
// ============================================================

export function setWorldName(
  name
) {

  GAME.world.name =
    String(
      name ||
      "Unnamed Island"
    );

}


// ============================================================
// WORLD SEED
// ============================================================

export function setWorldSeed(
  seed
) {

  GAME.world.seed =
    String(
      seed ||
      ""
    );

}


// ============================================================
// WORLD DAY
// ============================================================

export function setWorldDay(
  day
) {

  GAME.world.day =
    Math.max(
      1,
      Math.floor(
        number(
          day,
          1
        )
      )
    );

  GAME.statistics.daysSurvived =
    Math.max(
      0,
      GAME.world.day - 1
    );

}


// ============================================================
// WORLD TIME
// ============================================================

export function setWorldTime(
  time
) {

  GAME.world.time =
    ((number(time, 8) % 24) + 24) % 24;

}


// ============================================================
// PLAYER POSITION
// ============================================================

export function setPlayerPosition(
  x,
  y,
  z,
  rotationY =
    GAME.position.rotationY
) {

  GAME.position.x =
    number(
      x,
      GAME.position.x
    );

  GAME.position.y =
    number(
      y,
      GAME.position.y
    );

  GAME.position.z =
    number(
      z,
      GAME.position.z
    );

  GAME.position.rotationY =
    number(
      rotationY,
      GAME.position.rotationY
    );

}


// ============================================================
// MOVE PLAYER
// ============================================================

export function movePlayer(
  forward,
  strafe,
  delta
) {

  if (
    !GAME.state.started ||
    GAME.state.paused ||
    GAME.state.gameOver ||
    !GAME.player.alive
  ) {
    return;
  }

  const dt =
    Math.max(
      0,
      Math.min(
        number(delta, 0),
        0.1
      )
    );

  const forwardAmount =
    number(
      forward,
      0
    );

  const strafeAmount =
    number(
      strafe,
      0
    );

  let speed =
    CONSTANTS.WALK_SPEED;

  if (
    GAME.player.sprinting &&
    GAME.player.stamina > 0
  ) {

    speed =
      CONSTANTS.SPRINT_SPEED;

  }


  const rotation =
    GAME.position.rotationY;


  const forwardX =
    -Math.sin(
      rotation
    );

  const forwardZ =
    -Math.cos(
      rotation
    );


  const rightX =
    Math.cos(
      rotation
    );

  const rightZ =
    -Math.sin(
      rotation
    );


  const dx =
    (
      forwardX *
      forwardAmount
    ) +
    (
      rightX *
      strafeAmount
    );


  const dz =
    (
      forwardZ *
      forwardAmount
    ) +
    (
      rightZ *
      strafeAmount
    );


  const length =
    Math.sqrt(
      dx * dx +
      dz * dz
    );


  if (
    length > 0
  ) {

    GAME.position.x +=
      (
        dx /
        Math.max(
          length,
          1
        )
      ) *
      speed *
      dt;

    GAME.position.z +=
      (
        dz /
        Math.max(
          length,
          1
        )
      ) *
      speed *
      dt;


    GAME.statistics.distanceWalked +=
      speed * dt;

  }


  syncPlayerObject();

}


// ============================================================
// TURN PLAYER
// ============================================================

export function turnPlayer(
  amount
) {

  if (
    GAME.state.paused ||
    GAME.state.gameOver
  ) {
    return;
  }

  GAME.position.rotationY +=
    number(
      amount,
      0
    );

  syncPlayerObject();

}


// ============================================================
// SPRINT
// ============================================================

export function setSprinting(
  active
) {

  GAME.player.sprinting =
    Boolean(
      active
    ) &&
    GAME.player.stamina > 0 &&
    GAME.player.alive;

  syncCompatibility();

}


// ============================================================
// IS SPRINTING
// ============================================================

export function isSprinting() {

  return Boolean(
    GAME.player.sprinting
  );

}


// ============================================================
// UPDATE SURVIVAL
// ============================================================

export function updateSurvival(
  delta
) {

  if (
    !GAME.state.started ||
    GAME.state.paused ||
    GAME.state.gameOver ||
    !GAME.player.alive
  ) {
    return;
  }

  const dt =
    Math.max(
      0,
      Math.min(
        number(delta, 0),
        0.1
      )
    );


  // ----------------------------------------------------------
  // HUNGER
  // ----------------------------------------------------------

  GAME.player.hunger =
    clamp(
      GAME.player.hunger -
      (
        CONSTANTS.HUNGER_DRAIN_PER_SECOND *
        dt
      ),
      0,
      CONSTANTS.MAX_HUNGER
    );


  // ----------------------------------------------------------
  // THIRST
  // ----------------------------------------------------------

  GAME.player.thirst =
    clamp(
      GAME.player.thirst -
      (
        CONSTANTS.THIRST_DRAIN_PER_SECOND *
        dt
      ),
      0,
      CONSTANTS.MAX_THIRST
    );


  // ----------------------------------------------------------
  // STAMINA
  // ----------------------------------------------------------

  if (
    GAME.player.sprinting
  ) {

    GAME.player.stamina -=
      CONSTANTS.SPRINT_STAMINA_DRAIN *
      dt;

    if (
      GAME.player.stamina <= 0
    ) {

      GAME.player.stamina =
        0;

      GAME.player.sprinting =
        false;

    }

  } else {

    GAME.player.stamina +=
      CONSTANTS.STAMINA_REGEN *
      dt;

  }


  GAME.player.stamina =
    clamp(
      GAME.player.stamina,
      0,
      CONSTANTS.MAX_STAMINA
    );


  // ----------------------------------------------------------
  // STARVATION / DEHYDRATION
  // ----------------------------------------------------------

  if (
    GAME.player.hunger <= 0
  ) {

    damagePlayer(
      2 * dt,
      "starvation"
    );

  }


  if (
    GAME.player.thirst <= 0
  ) {

    damagePlayer(
      3 * dt,
      "dehydration"
    );

  }


  syncCompatibility();

}


// ============================================================
// DAMAGE PLAYER
// ============================================================

export function damagePlayer(
  amount,
  reason = "unknown"
) {

  if (
    !GAME.player.alive
  ) {
    return false;
  }

  const damage =
    Math.max(
      0,
      number(
        amount,
        0
      )
    );

  if (
    damage <= 0
  ) {
    return false;
  }


  GAME.player.health =
    clamp(
      GAME.player.health -
      damage,
      0,
      CONSTANTS.MAX_HEALTH
    );


  syncCompatibility();


  gameEvent(
    "player-damaged",
    {
      amount: damage,
      reason,
      health:
        GAME.player.health
    }
  );


  if (
    GAME.player.health <= 0
  ) {

    killPlayer(
      reason
    );

  }

  return true;

}


// ============================================================
// HEAL PLAYER
// ============================================================

export function healPlayer(
  amount
) {

  if (
    !GAME.player.alive
  ) {
    return false;
  }

  const heal =
    Math.max(
      0,
      number(
        amount,
        0
      )
    );

  if (
    heal <= 0
  ) {
    return false;
  }


  const oldHealth =
    GAME.player.health;


  GAME.player.health =
    clamp(
      GAME.player.health +
      heal,
      0,
      CONSTANTS.MAX_HEALTH
    );


  syncCompatibility();


  gameEvent(
    "player-healed",
    {
      amount:
        GAME.player.health -
        oldHealth,

      health:
        GAME.player.health
    }
  );


  return true;

}


// ============================================================
// EAT FOOD
// ============================================================

export function eatFood(
  type = "food"
) {

  if (
    !GAME.player.alive
  ) {
    return false;
  }

  const item =
    String(
      type
    );


  if (
    getItemCount(item) <= 0
  ) {

    return false;

  }


  let hungerAmount =
    0;

  let healthAmount =
    0;


  if (
    item === "food"
  ) {

    hungerAmount =
      25;

  } else if (
    item === "cookedMeat"
  ) {

    hungerAmount =
      40;

    healthAmount =
      5;

  } else if (
    item === "rawMeat"
  ) {

    hungerAmount =
      10;

  } else {

    return false;

  }


  removeItem(
    item,
    1
  );


  GAME.player.hunger =
    clamp(
      GAME.player.hunger +
      hungerAmount,
      0,
      CONSTANTS.MAX_HUNGER
    );


  if (
    healthAmount > 0
  ) {

    GAME.player.health =
      clamp(
        GAME.player.health +
        healthAmount,
        0,
        CONSTANTS.MAX_HEALTH
      );

  }


  syncCompatibility();


  gameEvent(
    "food-eaten",
    {
      item,
      hunger:
        hungerAmount,
      health:
        healthAmount
    }
  );


  return true;

}


// ============================================================
// DRINK WATER
// ============================================================

export function drinkWater() {

  if (
    !GAME.player.alive
  ) {
    return false;
  }


  if (
    getItemCount(
      "water"
    ) <= 0
  ) {

    return false;

  }


  removeItem(
    "water",
    1
  );


  GAME.player.thirst =
    clamp(
      GAME.player.thirst +
      45,
      0,
      CONSTANTS.MAX_THIRST
    );


  syncCompatibility();


  gameEvent(
    "water-drunk",
    {
      amount: 45
    }
  );


  return true;

}


// ============================================================
// KILL PLAYER
// ============================================================

export function killPlayer(
  reason = "unknown"
) {

  if (
    !GAME.player.alive
  ) {
    return false;
  }


  GAME.player.alive =
    false;

  GAME.player.sprinting =
    false;

  GAME.player.health =
    0;

  GAME.state.gameOver =
    true;

  GAME.state.paused =
    false;


  syncCompatibility();


  gameEvent(
    "player-died",
    {
      reason
    }
  );


  gameEvent(
    "game-over",
    {
      reason
    }
  );


  return true;

}


// ============================================================
// ADD ITEM
// ============================================================

export function addItem(
  item,
  amount = 1
) {

  const key =
    String(
      item
    );

  const quantity =
    Math.max(
      0,
      Math.floor(
        number(
          amount,
          0
        )
      )
    );


  if (
    !key ||
    quantity <= 0
  ) {
    return false;
  }


  if (
    !Object.prototype.hasOwnProperty.call(
      GAME.inventory,
      key
    )
  ) {

    GAME.inventory[key] =
      0;

  }


  GAME.inventory[key] =
    clamp(
      number(
        GAME.inventory[key],
        0
      ) +
      quantity,
      0,
      CONSTANTS.MAX_INVENTORY_STACK
    );


  gameEvent(
    "inventory-changed",
    {
      item: key,
      amount: quantity,
      type: "add",
      count:
        GAME.inventory[key]
    }
  );


  return true;

}


// ============================================================
// REMOVE ITEM
// ============================================================

export function removeItem(
  item,
  amount = 1
) {

  const key =
    String(
      item
    );

  const quantity =
    Math.max(
      0,
      Math.floor(
        number(
          amount,
          0
        )
      )
    );


  if (
    !key ||
    quantity <= 0
  ) {
    return false;
  }


  const current =
    number(
      GAME.inventory[key],
      0
    );


  if (
    current < quantity
  ) {

    return false;

  }


  GAME.inventory[key] =
    current -
    quantity;


  gameEvent(
    "inventory-changed",
    {
      item: key,
      amount: quantity,
      type: "remove",
      count:
        GAME.inventory[key]
    }
  );


  return true;

}


// ============================================================
// HAS ITEM
// ============================================================

export function hasItem(
  item,
  amount = 1
) {

  return (
    getItemCount(item) >=
    number(
      amount,
      1
    )
  );

}


// ============================================================
// GET ITEM COUNT
// ============================================================

export function getItemCount(
  item
) {

  return Math.max(
    0,
    number(
      GAME.inventory[
        String(item)
      ],
      0
    )
  );

}


// ============================================================
// CLEAR INVENTORY
// ============================================================

export function clearInventory() {

  for (
    const key of
    Object.keys(
      GAME.inventory
    )
  ) {

    GAME.inventory[key] =
      0;

  }


  GAME.equipment.leftSide =
    null;

  GAME.equipment.rightSide =
    null;

  GAME.hands.left =
    null;

  GAME.hands.right =
    null;


  gameEvent(
    "inventory-changed",
    {
      type: "clear"
    }
  );

}


// ============================================================
// GATHER RESOURCE
// ============================================================

export function gatherResource(
  resource,
  amount = 1
) {

  const key =
    String(
      resource
    );

  const quantity =
    Math.max(
      1,
      Math.floor(
        number(
          amount,
          1
        )
      )
    );


  let inventoryItem =
    key;


  if (
    key === "tree"
  ) {

    inventoryItem =
      "wood";

  }


  if (
    key === "rock"
  ) {

    inventoryItem =
      "stone";

  }


  if (
    key === "fiberPlant"
  ) {

    inventoryItem =
      "fiber";

  }


  if (
    key === "fallenLog"
  ) {

    inventoryItem =
      "log";

  }


  addItem(
    inventoryItem,
    quantity
  );


  if (
    inventoryItem ===
    "wood"
  ) {

    GAME.resources.wood +=
      quantity;

    GAME.statistics.treesCut +=
      quantity;

  }


  if (
    inventoryItem ===
    "stone"
  ) {

    GAME.resources.stone +=
      quantity;

    GAME.statistics.rocksBroken +=
      quantity;

  }


  if (
    inventoryItem ===
    "fiber"
  ) {

    GAME.resources.fiber +=
      quantity;

  }


  if (
    inventoryItem ===
    "log"
  ) {

    GAME.statistics.logsCollected +=
      quantity;

  }


  gameEvent(
    "resource-gathered",
    {
      resource: key,
      item: inventoryItem,
      amount: quantity
    }
  );


  return true;

}


// ============================================================
// CRAFT STRING
// ============================================================

export function craftString(
  amount = 1
) {

  const quantity =
    Math.max(
      1,
      Math.floor(
        number(
          amount,
          1
        )
      )
    );


  const fiberRequired =
    quantity * 3;


  if (
    !hasItem(
      "fiber",
      fiberRequired
    )
  ) {

    return false;

  }


  removeItem(
    "fiber",
    fiberRequired
  );

  addItem(
    "string",
    quantity
  );


  registerCraft(
    "string",
    quantity
  );


  return true;

}


// ============================================================
// CRAFT STICK
// ============================================================

export function craftStick(
  amount = 1
) {

  const quantity =
    Math.max(
      1,
      Math.floor(
        number(
          amount,
          1
        )
      )
    );


  const woodRequired =
    quantity;


  if (
    !hasItem(
      "wood",
      woodRequired
    )
  ) {

    return false;

  }


  removeItem(
    "wood",
    woodRequired
  );

  addItem(
    "stick",
    quantity * 2
  );


  registerCraft(
    "stick",
    quantity
  );


  return true;

}


// ============================================================
// REGISTER CRAFT
// ============================================================

export function registerCraft(
  recipeId,
  amount = 1
) {

  const id =
    String(
      recipeId
    );


  if (
    !GAME.crafting.crafted[id]
  ) {

    GAME.crafting.crafted[id] =
      0;

  }


  GAME.crafting.crafted[id] +=
    Math.max(
      1,
      Math.floor(
        number(
          amount,
          1
        )
      )
    );


  GAME.crafting.lastCrafted =
    id;


  GAME.statistics.itemsCrafted +=
    Math.max(
      1,
      Math.floor(
        number(
          amount,
          1
        )
      )
    );


  gameEvent(
    "crafting-complete",
    {
      recipeId: id,
      amount
    }
  );

}


// ============================================================
// PUT ITEM ON SIDE SLOT
// ============================================================

export function putOnSide(
  side,
  item
) {

  const slot =
    side === "left"
      ? "leftSide"
      : side === "right"
        ? "rightSide"
        : null;


  if (
    !slot
  ) {
    return false;
  }


  GAME.equipment[slot] =
    item
      ? String(item)
      : null;


  gameEvent(
    "side-slot-changed",
    {
      side,
      item:
        GAME.equipment[slot]
    }
  );


  return true;

}


// ============================================================
// TAKE ITEM FROM SIDE SLOT
// ============================================================

export function takeFromSide(
  side
) {

  const slot =
    side === "left"
      ? "leftSide"
      : side === "right"
        ? "rightSide"
        : null;


  if (
    !slot
  ) {
    return null;
  }


  const item =
    GAME.equipment[slot];


  GAME.equipment[slot] =
    null;


  gameEvent(
    "side-slot-changed",
    {
      side,
      item: null
    }
  );


  return item;

}


// ============================================================
// HOLD ITEM
// ============================================================

export function holdItem(
  hand,
  item
) {

  const key =
    hand === "left"
      ? "left"
      : hand === "right"
        ? "right"
        : null;


  if (
    !key
  ) {
    return false;
  }


  GAME.hands[key] =
    item
      ? String(item)
      : null;


  gameEvent(
    "held-item-changed",
    {
      hand: key,
      item:
        GAME.hands[key]
    }
  );


  return true;

}


// ============================================================
// RELEASE ITEM
// ============================================================

export function releaseItem(
  hand
) {

  const key =
    hand === "left"
      ? "left"
      : hand === "right"
        ? "right"
        : null;


  if (
    !key
  ) {
    return null;
  }


  const item =
    GAME.hands[key];


  GAME.hands[key] =
    null;


  gameEvent(
    "held-item-changed",
    {
      hand: key,
      item: null
    }
  );


  return item;

}


// ============================================================
// GET HELD ITEM
// ============================================================

export function getHeldItem(
  hand
) {

  const key =
    hand === "left"
      ? "left"
      : hand === "right"
        ? "right"
        : null;


  if (
    !key
  ) {
    return null;
  }


  return GAME.hands[key];

}


// ============================================================
// ADD BUILDING PIECE
// ============================================================

export function addBuildingPiece(
  type
) {

  const key =
    String(
      type
    );


  if (
    !Object.prototype.hasOwnProperty.call(
      GAME.buildings,
      key
    )
  ) {

    GAME.buildings[key] =
      0;

  }


  GAME.buildings[key]++;

  GAME.buildings.total++;


  gameEvent(
    "building-count-changed",
    {
      type: key,
      count:
        GAME.buildings[key],
      total:
        GAME.buildings.total
    }
  );

}


// ============================================================
// UNLOCK RECIPE
// ============================================================

export function unlockRecipe(
  recipeId
) {

  const id =
    String(
      recipeId
    );


  if (
    !GAME.crafting.unlockedRecipes
      .includes(id)
  ) {

    GAME.crafting.unlockedRecipes
      .push(id);

  }


  if (
    !GAME.guide.discoveredRecipes
      .includes(id)
  ) {

    GAME.guide.discoveredRecipes
      .push(id);

  }


  gameEvent(
    "recipe-unlocked",
    {
      recipeId: id
    }
  );


  return true;

}


// ============================================================
// CHECK RECIPE
// ============================================================

export function recipeUnlocked(
  recipeId
) {

  return GAME.crafting
    .unlockedRecipes
    .includes(
      String(
        recipeId
      )
    );

}


// ============================================================
// WORLD ID
// ============================================================

export function createWorldId() {

  const timestamp =
    Date.now()
      .toString(
        36
      )
      .toUpperCase();


  const random =
    Math.floor(
      Math.random() *
      999999
    )
      .toString()
      .padStart(
        6,
        "0"
      );


  return `WORLD-${timestamp}-${random}`;

}


// ============================================================
// NEW WORLD
// ============================================================

export function createNewWorld(
  name = "Survival Island",
  seed = ""
) {

  const fresh =
    cloneDefaultGame();


  Object.keys(
    GAME
  ).forEach(
    key => {

      delete GAME[key];

    }
  );


  Object.assign(
    GAME,
    fresh
  );


  GAME.world.id =
    createWorldId();

  GAME.world.name =
    String(
      name ||
      "Survival Island"
    );

  GAME.world.createdAt =
    Date.now();

  GAME.world.seed =
    String(
      seed ||
      ""
    );


  GAME.state.started =
    false;

  GAME.state.paused =
    false;

  GAME.state.gameOver =
    false;

  GAME.state.loading =
    false;


  syncCompatibility();


  gameEvent(
    "new-world-created",
    {
      id:
        GAME.world.id,

      name:
        GAME.world.name,

      seed:
        GAME.world.seed
    }
  );


  return GAME.world;

}


// ============================================================
// GET GAME DATA
// ============================================================

export function getGameData() {

  return structuredClone(
    GAME
  );

}


// ============================================================
// LOAD GAME DATA
// ============================================================

export function loadGameData(
  data
) {

  if (
    !data ||
    typeof data !==
      "object"
  ) {

    return false;

  }


  const loaded =
    structuredClone(
      data
    );


  const fresh =
    cloneDefaultGame();


  // ----------------------------------------------------------
  // WORLD
  // ----------------------------------------------------------

  GAME.world =
    {
      ...fresh.world,
      ...(loaded.world || {})
    };


  // ----------------------------------------------------------
  // PLAYER
  // ----------------------------------------------------------

  GAME.player =
    {
      ...fresh.player,
      ...(loaded.player || {})
    };


  // ----------------------------------------------------------
  // POSITION
  // ----------------------------------------------------------

  GAME.position =
    {
      ...fresh.position,
      ...(loaded.position || {})
    };


  // ----------------------------------------------------------
  // INVENTORY
  // ----------------------------------------------------------

  GAME.inventory =
    {
      ...fresh.inventory,
      ...(loaded.inventory || {})
    };


  // ----------------------------------------------------------
  // EQUIPMENT
  // ----------------------------------------------------------

  GAME.equipment =
    {
      ...fresh.equipment,
      ...(loaded.equipment || {})
    };


  // ----------------------------------------------------------
  // HANDS
  // ----------------------------------------------------------

  GAME.hands =
    {
      ...fresh.hands,
      ...(loaded.hands || {})
    };


  // ----------------------------------------------------------
  // RESOURCES
  // ----------------------------------------------------------

  GAME.resources =
    {
      ...fresh.resources,
      ...(loaded.resources || {})
    };


  // ----------------------------------------------------------
  // BUILDINGS
  // ----------------------------------------------------------

  GAME.buildings =
    {
      ...fresh.buildings,
      ...(loaded.buildings || {})
    };


  // ----------------------------------------------------------
  // CRAFTING
  // ----------------------------------------------------------

  GAME.crafting =
    {
      ...fresh.crafting,
      ...(loaded.crafting || {})
    };


  // ----------------------------------------------------------
  // GUIDE
  // ----------------------------------------------------------

  GAME.guide =
    {
      ...fresh.guide,
      ...(loaded.guide || {})
    };


  // ----------------------------------------------------------
  // ANIMALS
  // ----------------------------------------------------------

  GAME.animals =
    {
      ...fresh.animals,
      ...(loaded.animals || {})
    };


  // ----------------------------------------------------------
  // ENVIRONMENT
  // ----------------------------------------------------------

  GAME.environment =
    {
      ...fresh.environment,
      ...(loaded.environment || {})
    };


  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  GAME.settings =
    {
      ...fresh.settings,
      ...(loaded.settings || {})
    };


  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  GAME.state =
    {
      ...fresh.state,
      ...(loaded.state || {})
    };


  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------

  GAME.statistics =
    {
      ...fresh.statistics,
      ...(loaded.statistics || {})
    };


  // ----------------------------------------------------------
  // FORCE SAFE STATE
  // ----------------------------------------------------------

  GAME.state.loading =
    false;

  GAME.state.paused =
    false;

  GAME.state.gameOver =
    !GAME.player.alive;


  syncCompatibility();

  syncPlayerObject();


  gameEvent(
    "game-loaded",
    {
      worldId:
        GAME.world.id,

      seed:
        GAME.world.seed
    }
  );


  return true;

}


// ============================================================
// RESET GAME
// ============================================================

export function resetGame() {

  const fresh =
    cloneDefaultGame();


  Object.keys(
    GAME
  ).forEach(
    key => {

      delete GAME[key];

    }
  );


  Object.assign(
    GAME,
    fresh
  );


  syncCompatibility();

  gameEvent(
    "game-reset"
  );

}


// ============================================================
// PAUSE
// ============================================================

export function setPaused(
  paused
) {

  GAME.state.paused =
    Boolean(
      paused
    );


  gameEvent(
    GAME.state.paused
      ? "game-paused"
      : "game-resumed"
  );

}


// ============================================================
// VR STATE
// ============================================================

export function setVRState(
  inVR
) {

  GAME.state.inVR =
    Boolean(
      inVR
    );


  gameEvent(
    GAME.state.inVR
      ? "vr-started"
      : "vr-ended"
  );

}


// ============================================================
// MARK SAVED
// ============================================================

export function markSaved() {

  GAME.world.lastSavedAt =
    Date.now();


  gameEvent(
    "game-saved",
    {
      time:
        GAME.world.lastSavedAt
    }
  );

}


// ============================================================
// SYNC PLAYER THREE.JS OBJECT
// ============================================================

function syncPlayerObject() {

  const S =
    getSurvivalVR();


  if (
    !S ||
    !S.playerGroup
  ) {
    return;
  }


  const group =
    S.playerGroup;


  group.position.set(
    GAME.position.x,
    GAME.position.y,
    GAME.position.z
  );


  group.rotation.y =
    GAME.position.rotationY;

}


// ============================================================
// SYNC FROM THREE.JS PLAYER
// ============================================================

export function syncGameFromPlayerObject() {

  const S =
    getSurvivalVR();


  if (
    !S ||
    !S.playerGroup
  ) {
    return;
  }


  const group =
    S.playerGroup;


  setPlayerPosition(
    group.position.x,
    group.position.y,
    group.position.z,
    group.rotation.y
  );

}


// ============================================================
// GET GAME INFO
// ============================================================

export function getGameInfo() {

  return {

    version:
      GAME_VERSION,

    world: {
      id:
        GAME.world.id,

      name:
        GAME.world.name,

      seed:
        GAME.world.seed,

      day:
        GAME.world.day,

      time:
        GAME.world.time
    },

    player: {
      health:
        GAME.player.health,

      hunger:
        GAME.player.hunger,

      thirst:
        GAME.player.thirst,

      stamina:
        GAME.player.stamina,

      alive:
        GAME.player.alive
    },

    inventory:
      structuredClone(
        GAME.inventory
      ),

    buildings:
      structuredClone(
        GAME.buildings
      ),

    started:
      GAME.state.started,

    paused:
      GAME.state.paused,

    gameOver:
      GAME.state.gameOver

  };

}


// ============================================================
// INITIAL SYNC
// ============================================================

syncCompatibility();


// ============================================================
// GLOBAL API
// ============================================================

if (
  typeof window !==
  "undefined"
) {

  window.SurvivalVR =
    window.SurvivalVR ||
    {};

  window.SurvivalVR.GAME =
    GAME;

  window.SurvivalVR.player =
    player;

  window.SurvivalVR.gameEvent =
    gameEvent;

  window.SurvivalVR.movePlayer =
    movePlayer;

  window.SurvivalVR.turnPlayer =
    turnPlayer;

  window.SurvivalVR.updateSurvival =
    updateSurvival;

  window.SurvivalVR.damagePlayer =
    damagePlayer;

  window.SurvivalVR.healPlayer =
    healPlayer;

  window.SurvivalVR.eatFood =
    eatFood;

  window.SurvivalVR.drinkWater =
    drinkWater;

  window.SurvivalVR.addItem =
    addItem;

  window.SurvivalVR.removeItem =
    removeItem;

  window.SurvivalVR.getItemCount =
    getItemCount;

  window.SurvivalVR.gatherResource =
    gatherResource;

  window.SurvivalVR.createNewWorld =
    createNewWorld;

  window.SurvivalVR.getGameData =
    getGameData;

  window.SurvivalVR.loadGameData =
    loadGameData;

  window.SurvivalVR.resetGame =
    resetGame;

  window.SurvivalVR.setPaused =
    setPaused;

  window.SurvivalVR.setVRState =
    setVRState;

  window.SurvivalVR.setPlayerPosition =
    setPlayerPosition;

  window.SurvivalVR.syncGameFromPlayerObject =
    syncGameFromPlayerObject;

}


// ============================================================
// DEBUG
// ============================================================

console.log(
  `[SurvivalVR] Game Core v${GAME_VERSION} loaded.`
);