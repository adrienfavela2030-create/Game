/*
==========================================================
ISLAND SURVIVAL VR
GAME CORE
==========================================================

This file is the central state system for the game.

Other systems connect to this:

- index.js / index.html
- hands.js
- inventory.js
- crafting.js
- building.js
- guide.js
- world.js
- save.js
- home.js
- settings.js
- audio.js
- environment.js
- animals.js

==========================================================
*/


/* ========================================================
   VERSION
======================================================== */

export const GAME_VERSION = 3;


/* ========================================================
   CONSTANTS
======================================================== */

export const CONSTANTS = {

  MAX_HEALTH: 100,

  MAX_HUNGER: 100,

  MAX_THIRST: 100,

  MAX_STAMINA: 100,

  HUNGER_DRAIN:
    0.035,

  THIRST_DRAIN:
    0.055,

  SPRINT_STAMINA_DRAIN:
    8,

  STAMINA_REGEN:
    10,

  WALK_SPEED:
    2.5,

  SPRINT_SPEED:
    4.5,

  TURN_SPEED:
    1.7,

  SAVE_VERSION:
    1

};


/* ========================================================
   MAIN GAME STATE
======================================================== */

export const GAME = {

  version: GAME_VERSION,


  /* ------------------------------------------------------
     WORLD
  ------------------------------------------------------ */

  world: {

    id: null,

    name: "Island World",

    seed: null,

    createdAt: null,

    lastSavedAt: null,

    day: 1,

    time: 8,

    weather: "sunny"

  },


  /* ------------------------------------------------------
     PLAYER
  ------------------------------------------------------ */

  player: {

    health: 100,

    hunger: 100,

    thirst: 100,

    stamina: 100,

    alive: true,

    sleeping: false,

    sprinting: false

  },


  /*
  These properties are also kept directly on GAME
  for compatibility with older systems.
  */

  health: 100,

  hunger: 100,

  thirst: 100,

  stamina: 100,


  /* ------------------------------------------------------
     PLAYER POSITION
  ------------------------------------------------------ */

  position: {

    x: 0,

    y: 0,

    z: 8,

    rotationY: 0

  },


  /* ------------------------------------------------------
     INVENTORY
  ------------------------------------------------------ */

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


  /* ------------------------------------------------------
     SIDE STORAGE
  ------------------------------------------------------ */

  equipment: {

    leftSide: null,

    rightSide: null

  },


  /* ------------------------------------------------------
     HANDS
  ------------------------------------------------------ */

  hands: {

    left: null,

    right: null

  },


  /* ------------------------------------------------------
     RESOURCE COUNTERS
  ------------------------------------------------------ */

  resources: {

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

    cookedMeat: 0

  },


  /* ------------------------------------------------------
     BUILDINGS
  ------------------------------------------------------ */

  buildings: {

    total: 0,

    woodFloor: 0,

    woodWall: 0,

    woodDoor: 0,

    campfire: 0,

    storageBox: 0

  },


  /* ------------------------------------------------------
     CRAFTING
  ------------------------------------------------------ */

  crafting: {

    unlockedRecipes: [

      "string",

      "stick",

      "woodPlank",

      "stone"

    ],

    crafted: {},

    lastCrafted: null

  },


  /* ------------------------------------------------------
     GUIDE
  ------------------------------------------------------ */

  guide: {

    discoveredPages: [

      "first_day",

      "gathering",

      "survival"

    ],

    discoveredRecipes: [

      "string",

      "stick"

    ],

    currentPage: 0

  },


  /* ------------------------------------------------------
     ANIMALS
  ------------------------------------------------------ */

  animals: {

    rabbits: [],

    deer: [],

    birds: [],

    total: 0

  },


  /* ------------------------------------------------------
     ENVIRONMENT
  ------------------------------------------------------ */

  environment: {

    wind: {

      direction: 0,

      strength: 0.35

    },

    waterLevel: 0,

    grassDensity: 1,

    treeDensity: 1

  },


  /* ------------------------------------------------------
     SETTINGS
  ------------------------------------------------------ */

  settings: {

    masterVolume: 1,

    musicVolume: 0.7,

    effectsVolume: 1,

    environmentVolume: 0.8,

    animalVolume: 0.8,

    graphicsQuality: "high",

    shadows: true,

    waterQuality: "high",

    grassQuality: "high",

    viewDistance: "high",

    vibration: true,

    snapTurning: true,

    snapTurnAmount: 45

  },


  /* ------------------------------------------------------
     GAME STATE
  ------------------------------------------------------ */

  state: {

    started: false,

    paused: false,

    gameOver: false,

    loading: false,

    inVR: false

  },


  /* ------------------------------------------------------
     STATISTICS
  ------------------------------------------------------ */

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


/* ========================================================
   PLAYER COMPATIBILITY OBJECT
======================================================== */

export const player = {

  get x() {

    return GAME.position.x;

  },


  set x(value) {

    GAME.position.x =
      Number(value) || 0;

  },


  get y() {

    return GAME.position.y;

  },


  set y(value) {

    GAME.position.y =
      Number(value) || 0;

  },


  get z() {

    return GAME.position.z;

  },


  set z(value) {

    GAME.position.z =
      Number(value) || 0;

  },


  get rotationY() {

    return GAME.position.rotationY;

  },


  set rotationY(value) {

    GAME.position.rotationY =
      Number(value) || 0;

  }

};


/* ========================================================
   INTERNAL STATE
======================================================== */

let sprinting =
  false;


/* ========================================================
   EVENT HELPER
======================================================== */

export function gameEvent(
  name,
  detail = {}
) {

  window.dispatchEvent(
    new CustomEvent(
      `survival-${name}`,
      {
        detail
      }
    )
  );

}


/* ========================================================
   SYNC PLAYER STATS
======================================================== */

function syncPlayerStats() {

  GAME.player.health =
    GAME.health;

  GAME.player.hunger =
    GAME.hunger;

  GAME.player.thirst =
    GAME.thirst;

  GAME.player.stamina =
    GAME.stamina;

}


/* ========================================================
   CLAMP
======================================================== */

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


/* ========================================================
   MOVE PLAYER
======================================================== */

export function movePlayer(
  x,
  z
) {

  if (
    GAME.state.gameOver
  ) {

    return;

  }


  GAME.position.x +=
    x;


  GAME.position.z +=
    z;


  const distance =
    Math.sqrt(
      x * x +
      z * z
    );


  GAME.statistics.distanceWalked +=
    distance;


  gameEvent(
    "player-moved",
    {
      x: GAME.position.x,

      y: GAME.position.y,

      z: GAME.position.z
    }
  );

}


/* ========================================================
   TURN PLAYER
======================================================== */

export function turnPlayer(
  amount
) {

  if (
    GAME.state.gameOver
  ) {

    return;

  }


  GAME.position.rotationY +=
    amount;


  gameEvent(
    "player-turned",
    {
      rotation:
        GAME.position.rotationY
    }
  );

}


/* ========================================================
   SET SPRINTING
======================================================== */

export function setSprinting(
  value
) {

  sprinting =
    Boolean(value);


  GAME.player.sprinting =
    sprinting;

}


/* ========================================================
   IS SPRINTING
======================================================== */

export function isSprinting() {

  return sprinting;

}


/* ========================================================
   UPDATE SURVIVAL
======================================================== */

export function updateSurvival(
  delta
) {

  if (
    GAME.state.gameOver
  ) {

    return;

  }


  if (
    GAME.state.paused
  ) {

    return;

  }


  if (
    !GAME.player.alive
  ) {

    return;

  }


  /*
  Hunger.
  */

  GAME.hunger -=
    CONSTANTS.HUNGER_DRAIN *
    delta;


  /*
  Thirst drains slightly faster.
  */

  GAME.thirst -=
    CONSTANTS.THIRST_DRAIN *
    delta;


  /*
  Sprinting uses stamina.
  */

  if (
    sprinting
  ) {

    GAME.stamina -=
      CONSTANTS.SPRINT_STAMINA_DRAIN *
      delta;

  }

  else {

    GAME.stamina +=
      CONSTANTS.STAMINA_REGEN *
      delta;

  }


  GAME.hunger =
    clamp(
      GAME.hunger,
      0,
      CONSTANTS.MAX_HUNGER
    );


  GAME.thirst =
    clamp(
      GAME.thirst,
      0,
      CONSTANTS.MAX_THIRST
    );


  GAME.stamina =
    clamp(
      GAME.stamina,
      0,
      CONSTANTS.MAX_STAMINA
    );


  /*
  Low hunger/thirst slowly damages
  the player.
  */

  if (
    GAME.hunger <= 0
  ) {

    damagePlayer(
      0.5 * delta
    );

  }


  if (
    GAME.thirst <= 0
  ) {

    damagePlayer(
      0.8 * delta
    );

  }


  syncPlayerStats();


  gameEvent(
    "survival-updated",
    {
      health:
        GAME.health,

      hunger:
        GAME.hunger,

      thirst:
        GAME.thirst,

      stamina:
        GAME.stamina
    }
  );

}


/* ========================================================
   DAMAGE PLAYER
======================================================== */

export function damagePlayer(
  amount
) {

  if (
    !GAME.player.alive
  ) {

    return;

  }


  GAME.health -=
    Math.max(
      0,
      Number(amount) || 0
    );


  GAME.health =
    clamp(
      GAME.health,
      0,
      CONSTANTS.MAX_HEALTH
    );


  syncPlayerStats();


  gameEvent(
    "player-damaged",
    {
      amount,

      health:
        GAME.health
    }
  );


  if (
    GAME.health <= 0
  ) {

    killPlayer();

  }

}


/* ========================================================
   HEAL PLAYER
======================================================== */

export function healPlayer(
  amount
) {

  GAME.health +=
    Math.max(
      0,
      Number(amount) || 0
    );


  GAME.health =
    clamp(
      GAME.health,
      0,
      CONSTANTS.MAX_HEALTH
    );


  syncPlayerStats();


  gameEvent(
    "player-healed",
    {
      amount,

      health:
        GAME.health
    }
  );

}


/* ========================================================
   EAT FOOD
======================================================== */

export function eatFood(
  item = "food"
) {

  if (
    getItemCount(item) <= 0
  ) {

    return false;

  }


  removeItem(
    item,
    1
  );


  GAME.hunger =
    clamp(
      GAME.hunger + 25,
      0,
      CONSTANTS.MAX_HUNGER
    );


  syncPlayerStats();


  gameEvent(
    "ate-food",
    {
      item
    }
  );


  return true;

}


/* ========================================================
   DRINK WATER
======================================================== */

export function drinkWater() {

  if (
    getItemCount("water") <= 0
  ) {

    return false;

  }


  removeItem(
    "water",
    1
  );


  GAME.thirst =
    clamp(
      GAME.thirst + 35,
      0,
      CONSTANTS.MAX_THIRST
    );


  syncPlayerStats();


  gameEvent(
    "drank-water",
    {
      source: "inventory"
    }
  );


  return true;

}


/* ========================================================
   KILL PLAYER
======================================================== */

export function killPlayer() {

  GAME.health =
    0;


  GAME.player.alive =
    false;


  GAME.state.gameOver =
    true;


  sprinting =
    false;


  GAME.player.sprinting =
    false;


  syncPlayerStats();


  gameEvent(
    "player-died",
    {
      day:
        GAME.world.day
    }
  );

}


/* ========================================================
   ADD ITEM
======================================================== */

export function addItem(
  item,
  amount = 1
) {

  if (
    !item
  ) {

    return false;

  }


  const value =
    Math.max(
      0,
      Number(amount) || 0
    );


  if (
    value <= 0
  ) {

    return false;

  }


  if (
    GAME.inventory[item] ===
    undefined
  ) {

    GAME.inventory[item] =
      0;

  }


  GAME.inventory[item] +=
    value;


  if (
    GAME.resources[item] !==
    undefined
  ) {

    GAME.resources[item] +=
      value;

  }


  gameEvent(
    "inventory-changed",
    {
      item,

      amount: value,

      total:
        GAME.inventory[item]
    }
  );


  return true;

}


/* ========================================================
   REMOVE ITEM
======================================================== */

export function removeItem(
  item,
  amount = 1
) {

  if (
    !item ||
    GAME.inventory[item] ===
    undefined
  ) {

    return false;

  }


  const value =
    Math.max(
      0,
      Number(amount) || 0
    );


  if (
    GAME.inventory[item] <
    value
  ) {

    return false;

  }


  GAME.inventory[item] -=
    value;


  if (
    GAME.resources[item] !==
    undefined
  ) {

    GAME.resources[item] =
      Math.max(
        0,
        GAME.resources[item] -
        value
      );

  }


  gameEvent(
    "inventory-changed",
    {
      item,

      amount: -value,

      total:
        GAME.inventory[item]
    }
  );


  return true;

}


/* ========================================================
   HAS ITEM
======================================================== */

export function hasItem(
  item,
  amount = 1
) {

  return (
    getItemCount(item) >=
    amount
  );

}


/* ========================================================
   GET ITEM COUNT
======================================================== */

export function getItemCount(
  item
) {

  return Number(
    GAME.inventory[item] || 0
  );

}


/* ========================================================
   CLEAR INVENTORY
======================================================== */

export function clearInventory() {

  for (
    const item
    of Object.keys(
      GAME.inventory
    )
  ) {

    GAME.inventory[item] =
      0;

  }


  /*
  Starting rock.
  */

  GAME.inventory.rock =
    1;


  GAME.resources.rock =
    1;


  gameEvent(
    "inventory-cleared"
  );

}


/* ========================================================
   GATHER RESOURCE
======================================================== */

export function gatherResource(
  resource,
  amount = 1
) {

  const added =
    addItem(
      resource,
      amount
    );


  if (!added) {

    return false;

  }


  gameEvent(
    "resource-gathered",
    {
      resource,

      amount
    }
  );


  return true;

}


/* ========================================================
   CRAFT STRING
======================================================== */

export function craftString() {

  if (
    !hasItem(
      "fiber",
      3
    )
  ) {

    return false;

  }


  removeItem(
    "fiber",
    3
  );


  addItem(
    "string",
    1
  );


  registerCraft(
    "string"
  );


  return true;

}


/* ========================================================
   CRAFT STICK
======================================================== */

export function craftStick() {

  if (
    !hasItem(
      "wood",
      1
    )
  ) {

    return false;

  }


  removeItem(
    "wood",
    1
  );


  addItem(
    "stick",
    2
  );


  registerCraft(
    "stick"
  );


  return true;

}


/* ========================================================
   REGISTER CRAFT
======================================================== */

export function registerCraft(
  recipe
) {

  GAME.crafting.crafted[recipe] =
    (
      GAME.crafting.crafted[recipe] ||
      0
    ) + 1;


  GAME.crafting.lastCrafted =
    recipe;


  GAME.statistics.itemsCrafted +=
    1;


  gameEvent(
    "crafted",
    {
      recipe,

      total:
        GAME.crafting.crafted[recipe]
    }
  );

}


/* ========================================================
   PUT ITEM IN SIDE STORAGE
======================================================== */

export function putOnSide(
  side,
  item
) {

  if (
    side !== "leftSide" &&
    side !== "rightSide"
  ) {

    return false;

  }


  if (
    !hasItem(
      item,
      1
    )
  ) {

    return false;

  }


  if (
    GAME.equipment[side]
  ) {

    return false;

  }


  removeItem(
    item,
    1
  );


  GAME.equipment[side] =
    item;


  gameEvent(
    "side-storage-changed",
    {
      side,

      item
    }
  );


  return true;

}


/* ========================================================
   TAKE ITEM FROM SIDE STORAGE
======================================================== */

export function takeFromSide(
  side
) {

  if (
    side !== "leftSide" &&
    side !== "rightSide"
  ) {

    return null;

  }


  const item =
    GAME.equipment[side];


  if (!item) {

    return null;

  }


  addItem(
    item,
    1
  );


  GAME.equipment[side] =
    null;


  gameEvent(
    "side-storage-changed",
    {
      side,

      item: null
    }
  );


  return item;

}


/* ========================================================
   HOLD ITEM
======================================================== */

export function holdItem(
  hand,
  item
) {

  if (
    hand !== "left" &&
    hand !== "right"
  ) {

    return false;

  }


  GAME.hands[hand] =
    item;


  gameEvent(
    "hand-item-changed",
    {
      hand,

      item
    }
  );


  return true;

}


/* ========================================================
   RELEASE ITEM
======================================================== */

export function releaseItem(
  hand
) {

  if (
    hand !== "left" &&
    hand !== "right"
  ) {

    return null;

  }


  const item =
    GAME.hands[hand];


  GAME.hands[hand] =
    null;


  gameEvent(
    "hand-item-changed",
    {
      hand,

      item: null
    }
  );


  return item;

}


/* ========================================================
   GET HELD ITEM
======================================================== */

export function getHeldItem(
  hand
) {

  return (
    GAME.hands[hand] ||
    null
  );

}


/* ========================================================
   BUILDING
======================================================== */

export function addBuildingPiece(
  type
) {

  if (
    GAME.buildings[type] ===
    undefined
  ) {

    GAME.buildings[type] =
      0;

  }


  GAME.buildings[type] +=
    1;


  GAME.buildings.total +=
    1;


  GAME.statistics.buildingsBuilt +=
    1;


  gameEvent(
    "building-added",
    {
      type,

      total:
        GAME.buildings[type]
    }
  );

}


/* ========================================================
   UNLOCK RECIPE
======================================================== */

export function unlockRecipe(
  recipe
) {

  if (
    !GAME.crafting.unlockedRecipes.includes(
      recipe
    )
  ) {

    GAME.crafting.unlockedRecipes.push(
      recipe
    );


    gameEvent(
      "recipe-unlocked",
      {
        recipe
      }
    );

  }

}


/* ========================================================
   RECIPE UNLOCK CHECK
======================================================== */

export function recipeUnlocked(
  recipe
) {

  return GAME.crafting.unlockedRecipes.includes(
    recipe
  );

}


/* ========================================================
   WORLD POSITION
======================================================== */

export function setPlayerPosition(
  x,
  y = 0,
  z = 0,
  rotationY = 0
) {

  GAME.position.x =
    Number(x) || 0;

  GAME.position.y =
    Number(y) || 0;

  GAME.position.z =
    Number(z) || 0;

  GAME.position.rotationY =
    Number(rotationY) || 0;


  gameEvent(
    "player-position-changed",
    {
      ...GAME.position
    }
  );

}


/* ========================================================
   WORLD TIME
======================================================== */

export function setWorldTime(
  time
) {

  let value =
    Number(time);


  if (
    !Number.isFinite(value)
  ) {

    value =
      8;

  }


  while (
    value < 0
  ) {

    value +=
      24;

  }


  while (
    value >= 24
  ) {

    value -=
      24;

  }


  GAME.world.time =
    value;


  gameEvent(
    "world-time-changed",
    {
      time:
        value
    }
  );

}


/* ========================================================
   WORLD DAY
======================================================== */

export function setWorldDay(
  day
) {

  GAME.world.day =
    Math.max(
      1,
      Math.floor(
        Number(day) || 1
      )
    );


  gameEvent(
    "world-day-changed",
    {
      day:
        GAME.world.day
    }
  );

}


/* ========================================================
   WORLD NAME
======================================================== */

export function setWorldName(
  name
) {

  const cleaned =
    String(
      name ??
      "Island World"
    )
    .trim()
    .slice(
      0,
      40
    );


  GAME.world.name =
    cleaned ||
    "Island World";


  gameEvent(
    "world-name-changed",
    {
      name:
        GAME.world.name
    }
  );

}


/* ========================================================
   WORLD SEED
======================================================== */

export function setWorldSeed(
  seed
) {

  GAME.world.seed =
    String(
      seed
    );


  gameEvent(
    "world-seed-changed",
    {
      seed:
        GAME.world.seed
    }
  );

}


/* ========================================================
   CREATE WORLD ID
======================================================== */

export function createWorldId() {

  return (
    "world-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );

}


/* ========================================================
   CREATE NEW WORLD STATE
======================================================== */

export function createNewWorld(
  name = "Island World",
  seed = null
) {

  resetGame();


  GAME.world.id =
    createWorldId();


  GAME.world.name =
    String(
      name
    )
    .trim()
    .slice(
      0,
      40
    ) ||
    "Island World";


  GAME.world.seed =
    seed ??
    Math.floor(
      Math.random() *
      2147483647
    );


  GAME.world.createdAt =
    Date.now();


  GAME.world.lastSavedAt =
    null;


  GAME.world.day =
    1;


  GAME.world.time =
    8;


  GAME.state.started =
    true;


  GAME.state.paused =
    false;


  GAME.state.gameOver =
    false;


  gameEvent(
    "new-world",
    {
      id:
        GAME.world.id,

      name:
        GAME.world.name,

      seed:
        GAME.world.seed
    }
  );


  return GAME.world.id;

}


/* ========================================================
   SAVE DATA
======================================================== */

export function getGameData() {

  syncPlayerStats();


  return {

    saveVersion:
      CONSTANTS.SAVE_VERSION,

    gameVersion:
      GAME_VERSION,


    world:
      structuredClone(
        GAME.world
      ),


    player:
      structuredClone(
        GAME.player
      ),


    position:
      structuredClone(
        GAME.position
      ),


    inventory:
      structuredClone(
        GAME.inventory
      ),


    equipment:
      structuredClone(
        GAME.equipment
      ),


    hands:
      structuredClone(
        GAME.hands
      ),


    resources:
      structuredClone(
        GAME.resources
      ),


    buildings:
      structuredClone(
        GAME.buildings
      ),


    crafting:
      structuredClone(
        GAME.crafting
      ),


    guide:
      structuredClone(
        GAME.guide
      ),


    animals:
      structuredClone(
        GAME.animals
      ),


    environment:
      structuredClone(
        GAME.environment
      ),


    settings:
      structuredClone(
        GAME.settings
      ),


    state:
      structuredClone(
        GAME.state
      ),


    statistics:
      structuredClone(
        GAME.statistics
      )

  };

}


/* ========================================================
   LOAD SAVE DATA
======================================================== */

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


  try {

    /*
    World
    */

    if (
      data.world
    ) {

      GAME.world =
        mergeObject(
          GAME.world,
          data.world
        );

    }


    /*
    Player
    */

    if (
      data.player
    ) {

      GAME.player =
        mergeObject(
          GAME.player,
          data.player
        );

    }


    /*
    Position
    */

    if (
      data.position
    ) {

      GAME.position =
        mergeObject(
          GAME.position,
          data.position
        );

    }


    /*
    Inventory
    */

    if (
      data.inventory
    ) {

      GAME.inventory =
        mergeObject(
          GAME.inventory,
          data.inventory
        );

    }


    /*
    Equipment
    */

    if (
      data.equipment
    ) {

      GAME.equipment =
        mergeObject(
          GAME.equipment,
          data.equipment
        );

    }


    /*
    Hands
    */

    if (
      data.hands
    ) {

      GAME.hands =
        mergeObject(
          GAME.hands,
          data.hands
        );

    }


    /*
    Resources
    */

    if (
      data.resources
    ) {

      GAME.resources =
        mergeObject(
          GAME.resources,
          data.resources
        );

    }


    /*
    Buildings
    */

    if (
      data.buildings
    ) {

      GAME.buildings =
        mergeObject(
          GAME.buildings,
          data.buildings
        );

    }


    /*
    Crafting
    */

    if (
      data.crafting
    ) {

      GAME.crafting =
        mergeObject(
          GAME.crafting,
          data.crafting
        );

    }


    /*
    Guide
    */

    if (
      data.guide
    ) {

      GAME.guide =
        mergeObject(
          GAME.guide,
          data.guide
        );

    }


    /*
    Animals
    */

    if (
      data.animals
    ) {

      GAME.animals =
        mergeObject(
          GAME.animals,
          data.animals
        );

    }


    /*
    Environment
    */

    if (
      data.environment
    ) {

      GAME.environment =
        mergeObject(
          GAME.environment,
          data.environment
        );

    }


    /*
    Settings
    */

    if (
      data.settings
    ) {

      GAME.settings =
        mergeObject(
          GAME.settings,
          data.settings
        );

    }


    /*
    State
    */

    if (
      data.state
    ) {

      GAME.state =
        mergeObject(
          GAME.state,
          data.state
        );

    }


    /*
    Statistics
    */

    if (
      data.statistics
    ) {

      GAME.statistics =
        mergeObject(
          GAME.statistics,
          data.statistics
        );

    }


    /*
    Compatibility:
    keep old direct stats synchronized.
    */

    GAME.health =
      GAME.player.health;

    GAME.hunger =
      GAME.player.hunger;

    GAME.thirst =
      GAME.player.thirst;

    GAME.stamina =
      GAME.player.stamina;


    gameEvent(
      "game-loaded",
      {
        world:
          GAME.world.name
      }
    );


    return true;

  }

  catch (
    error
  ) {

    console.error(
      "Failed to load game data:",
      error
    );


    return false;

  }

}


/* ========================================================
   MERGE OBJECT
======================================================== */

function mergeObject(
  original,
  incoming
) {

  const result =
    {
      ...original
    };


  for (
    const key
    of Object.keys(
      incoming
    )
  ) {

    const incomingValue =
      incoming[key];


    const originalValue =
      original[key];


    if (
      incomingValue &&
      typeof incomingValue ===
      "object" &&
      !Array.isArray(
        incomingValue
      ) &&
      originalValue &&
      typeof originalValue ===
      "object" &&
      !Array.isArray(
        originalValue
      )
    ) {

      result[key] =
        mergeObject(
          originalValue,
          incomingValue
        );

    }

    else {

      result[key] =
        structuredClone(
          incomingValue
        );

    }

  }


  return result;

}


/* ========================================================
   RESET GAME
======================================================== */

export function resetGame() {

  GAME.world = {

    id: null,

    name: "Island World",

    seed: null,

    createdAt: null,

    lastSavedAt: null,

    day: 1,

    time: 8,

    weather: "sunny"

  };


  GAME.player = {

    health: 100,

    hunger: 100,

    thirst: 100,

    stamina: 100,

    alive: true,

    sleeping: false,

    sprinting: false

  };


  GAME.health =
    100;

  GAME.hunger =
    100;

  GAME.thirst =
    100;

  GAME.stamina =
    100;


  GAME.position = {

    x: 0,

    y: 0,

    z: 8,

    rotationY: 0

  };


  GAME.inventory = {

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


  GAME.equipment = {

    leftSide: null,

    rightSide: null

  };


  GAME.hands = {

    left: null,

    right: null

  };


  GAME.resources = {

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

    cookedMeat: 0

  };


  GAME.buildings = {

    total: 0,

    woodFloor: 0,

    woodWall: 0,

    woodDoor: 0,

    campfire: 0,

    storageBox: 0

  };


  GAME.crafting = {

    unlockedRecipes: [

      "string",

      "stick",

      "woodPlank",

      "stone"

    ],

    crafted: {},

    lastCrafted: null

  };


  GAME.guide = {

    discoveredPages: [

      "first_day",

      "gathering",

      "survival"

    ],

    discoveredRecipes: [

      "string",

      "stick"

    ],

    currentPage: 0

  };


  GAME.animals = {

    rabbits: [],

    deer: [],

    birds: [],

    total: 0

  };


  GAME.environment = {

    wind: {

      direction: 0,

      strength: 0.35

    },

    waterLevel: 0,

    grassDensity: 1,

    treeDensity: 1

  };


  GAME.state = {

    started: false,

    paused: false,

    gameOver: false,

    loading: false,

    inVR: false

  };


  GAME.statistics = {

    treesCut: 0,

    rocksBroken: 0,

    logsCollected: 0,

    itemsCrafted: 0,

    buildingsBuilt: 0,

    animalsSeen: 0,

    daysSurvived: 0,

    distanceWalked: 0

  };


  sprinting =
    false;


  gameEvent(
    "game-reset"
  );

}


/* ========================================================
   PAUSE
======================================================== */

export function setPaused(
  paused
) {

  GAME.state.paused =
    Boolean(
      paused
    );


  if (
    GAME.state.paused
  ) {

    sprinting =
      false;

    GAME.player.sprinting =
      false;

  }


  gameEvent(
    "pause-changed",
    {
      paused:
        GAME.state.paused
    }
  );

}


/* ========================================================
   SET VR STATE
======================================================== */

export function setVRState(
  inVR
) {

  GAME.state.inVR =
    Boolean(
      inVR
    );


  gameEvent(
    "vr-state-changed",
    {
      inVR:
        GAME.state.inVR
    }
  );

}


/* ========================================================
   SAVE TIMESTAMP
======================================================== */

export function markSaved() {

  GAME.world.lastSavedAt =
    Date.now();


  gameEvent(
    "save-marked",
    {
      time:
        GAME.world.lastSavedAt
    }
  );

}


/* ========================================================
   GET GAME INFO
======================================================== */

export function getGameInfo() {

  return {

    version:
      GAME_VERSION,

    world:
      GAME.world.name,

    day:
      GAME.world.day,

    time:
      GAME.world.time,

    health:
      GAME.health,

    hunger:
      GAME.hunger,

    thirst:
      GAME.thirst,

    stamina:
      GAME.stamina,

    alive:
      GAME.player.alive,

    paused:
      GAME.state.paused,

    inVR:
      GAME.state.inVR

  };

}


/* ========================================================
   INITIAL SYNC
======================================================== */

syncPlayerStats();


console.log(
  `🏝️ Island Survival VR Game Core v${GAME_VERSION} loaded.`
);