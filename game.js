// ============================================
// ISLAND SURVIVAL VR
// CORE GAME SYSTEM
// ============================================
//
// This file controls the shared game state.
//
// Future systems connect to this file:
//   inventory.js
//   crafting.js
//   building.js
//   guide.js
//   world.js
//
// ============================================


// ============================================
// GAME VERSION
// ============================================

export const GAME_VERSION = 1;


// ============================================
// MAIN GAME STATE
// ============================================

export const GAME = {

  version: GAME_VERSION,

  // -------------------------
  // SURVIVAL
  // -------------------------

  health: 100,
  maxHealth: 100,

  hunger: 100,
  maxHunger: 100,

  thirst: 100,
  maxThirst: 100,

  stamina: 100,
  maxStamina: 100,

  // -------------------------
  // WORLD TIME
  // -------------------------

  day: 1,

  time: 8,

  timeSpeed: 0.025,

  // -------------------------
  // PLAYER STATE
  // -------------------------

  alive: true,

  sleeping: false,

  swimming: false,

  // -------------------------
  // INVENTORY
  // -------------------------

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

    cookedMeat: 0

  },

  // -------------------------
  // SIDE STORAGE
  // -------------------------

  equipment: {

    leftSide: null,

    rightSide: null

  },

  // -------------------------
  // CURRENT HANDS
  // -------------------------

  hands: {

    left: null,

    right: null

  },

  // -------------------------
  // RESOURCES
  // -------------------------

  resources: {

    treesBroken: 0,

    rocksBroken: 0,

    logsCollected: 0,

    stoneCollected: 0,

    fiberCollected: 0

  },

  // -------------------------
  // BUILDING
  // -------------------------

  building: {

    woodWalls: 0,

    stoneWalls: 0,

    floors: 0,

    roofs: 0,

    doors: 0,

    placedObjects: 0

  },

  // -------------------------
  // CRAFTING
  // -------------------------

  crafting: {

    itemsCrafted: 0,

    unlockedRecipes: [

      "string",

      "stick"

    ]

  },

  // -------------------------
  // GUIDE
  // -------------------------

  guide: {

    opened: false,

    page: 1

  },

  // -------------------------
  // SETTINGS
  // -------------------------

  settings: {

    vibration: true,

    sound: true,

    graphics: "high"

  }

};


// ============================================
// PLAYER
// ============================================

export const player = {

  // World position

  x: 0,

  y: 0,

  z: 7,

  // Direction

  rotation: 0,

  // Height

  height: 1.6,

  // Movement

  speed: 3,

  sprintSpeed: 5,

  // Current movement state

  moving: false,

  sprinting: false

};


// ============================================
// GAME CONSTANTS
// ============================================

export const CONSTANTS = {

  islandRadius: 25,

  movementSpeed: 3,

  sprintSpeed: 5,

  turnSpeed: 2.2,

  hungerDrain: 0.8,

  thirstDrain: 1.2,

  starvationDamage: 2,

  staminaDrain: 12,

  staminaRecovery: 8,

  waterRestore: 35,

  foodRestore: 25

};


// ============================================
// EVENT SYSTEM
// ============================================
//
// Other files can listen for events without
// modifying this file.
//
// Example:
//
// window.addEventListener(
//   "survival-inventory-changed",
//   () => {}
// );
//
// ============================================

export function gameEvent(
  eventName,
  data = {}
) {

  window.dispatchEvent(

    new CustomEvent(
      eventName,
      {
        detail: data
      }
    )

  );

}


// ============================================
// CLAMP HELPER
// ============================================

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


// ============================================
// MOVEMENT
// ============================================

export function movePlayer(
  forward,
  sideways,
  delta
) {

  if (
    !GAME.alive ||
    GAME.sleeping
  ) {

    return;

  }


  // Normalize diagonal movement

  const length =
    Math.sqrt(
      forward * forward +
      sideways * sideways
    );


  if (
    length > 1
  ) {

    forward /= length;

    sideways /= length;

  }


  // Determine speed

  let speed =
    CONSTANTS.movementSpeed;


  if (
    player.sprinting &&
    GAME.stamina > 0
  ) {

    speed =
      CONSTANTS.sprintSpeed;

  }


  const amount =
    speed *
    delta;


  // Forward direction

  const directionX =
    Math.sin(
      player.rotation
    );

  const directionZ =
    Math.cos(
      player.rotation
    );


  // Move forward/backward

  player.x +=
    directionX *
    forward *
    amount;

  player.z +=
    directionZ *
    forward *
    amount;


  // Move sideways

  player.x +=
    Math.cos(
      player.rotation
    ) *
    sideways *
    amount;

  player.z -=
    Math.sin(
      player.rotation
    ) *
    sideways *
    amount;


  // Island boundary

  const distance =
    Math.sqrt(
      player.x * player.x +
      player.z * player.z
    );


  if (
    distance >
    CONSTANTS.islandRadius
  ) {

    const scale =
      CONSTANTS.islandRadius /
      distance;

    player.x *=
      scale;

    player.z *=
      scale;

  }


  player.moving =
    Math.abs(forward) > 0 ||
    Math.abs(sideways) > 0;


  gameEvent(
    "survival-player-moved",
    {
      x: player.x,
      y: player.y,
      z: player.z
    }
  );

}


// ============================================
// TURN PLAYER
// ============================================

export function turnPlayer(
  amount,
  delta
) {

  if (
    !GAME.alive ||
    GAME.sleeping
  ) {

    return;

  }


  player.rotation +=
    amount *
    CONSTANTS.turnSpeed *
    delta;


  // Keep rotation manageable

  if (
    player.rotation >
    Math.PI * 2
  ) {

    player.rotation -=
      Math.PI * 2;

  }


  if (
    player.rotation <
    -Math.PI * 2
  ) {

    player.rotation +=
      Math.PI * 2;

  }

}


// ============================================
// SPRINT
// ============================================

export function setSprinting(
  active
) {

  player.sprinting =
    !!active;


  if (
    player.sprinting &&
    GAME.stamina <= 0
  ) {

    player.sprinting =
      false;

  }

}


// ============================================
// SURVIVAL UPDATE
// ============================================

export function updateSurvival(
  delta
) {

  if (
    !GAME.alive ||
    GAME.sleeping
  ) {

    return;

  }


  // -------------------------
  // HUNGER
  // -------------------------

  GAME.hunger -=
    CONSTANTS.hungerDrain *
    delta;


  // -------------------------
  // THIRST
  // -------------------------

  GAME.thirst -=
    CONSTANTS.thirstDrain *
    delta;


  // -------------------------
  // STAMINA
  // -------------------------

  if (
    player.sprinting &&
    player.moving
  ) {

    GAME.stamina -=
      CONSTANTS.staminaDrain *
      delta;

  } else {

    GAME.stamina +=
      CONSTANTS.staminaRecovery *
      delta;

  }


  // -------------------------
  // CLAMP VALUES
  // -------------------------

  GAME.hunger =
    clamp(
      GAME.hunger,
      0,
      GAME.maxHunger
    );

  GAME.thirst =
    clamp(
      GAME.thirst,
      0,
      GAME.maxThirst
    );

  GAME.stamina =
    clamp(
      GAME.stamina,
      0,
      GAME.maxStamina
    );


  // -------------------------
  // STOP SPRINTING
  // -------------------------

  if (
    GAME.stamina <= 0
  ) {

    player.sprinting =
      false;

  }


  // -------------------------
  // STARVATION
  // -------------------------

  if (
    GAME.hunger <= 0 ||
    GAME.thirst <= 0
  ) {

    damagePlayer(
      CONSTANTS.starvationDamage *
      delta
    );

  }


  // -------------------------
  // DAY/NIGHT TIME
  // -------------------------

  GAME.time +=
    CONSTANTS.timeSpeed *
    delta;


  if (
    GAME.time >= 24
  ) {

    GAME.time = 0;

    GAME.day++;

    gameEvent(
      "survival-new-day",
      {
        day: GAME.day
      }
    );

  }


  player.moving =
    false;

}


// ============================================
// DAMAGE PLAYER
// ============================================

export function damagePlayer(
  amount
) {

  if (
    !GAME.alive
  ) {

    return;

  }


  GAME.health -=
    Math.max(
      0,
      amount
    );


  GAME.health =
    clamp(
      GAME.health,
      0,
      GAME.maxHealth
    );


  gameEvent(
    "survival-player-damaged",
    {
      amount,
      health: GAME.health
    }
  );


  if (
    GAME.health <= 0
  ) {

    killPlayer();

  }

}


// ============================================
// HEAL PLAYER
// ============================================

export function healPlayer(
  amount
) {

  if (
    !GAME.alive
  ) {

    return;

  }


  GAME.health =
    clamp(
      GAME.health +
      Math.max(
        0,
        amount
      ),
      0,
      GAME.maxHealth
    );


  gameEvent(
    "survival-player-healed",
    {
      amount,
      health: GAME.health
    }
  );

}


// ============================================
// EAT FOOD
// ============================================

export function eatFood(
  item = "food"
) {

  if (
    !hasItem(
      item,
      1
    )
  ) {

    return false;

  }


  removeItem(
    item,
    1
  );


  GAME.hunger =
    clamp(
      GAME.hunger +
      CONSTANTS.foodRestore,
      0,
      GAME.maxHunger
    );


  gameEvent(
    "survival-food-eaten",
    {
      item
    }
  );


  return true;

}


// ============================================
// DRINK WATER
// ============================================

export function drinkWater() {

  if (
    !hasItem(
      "water",
      1
    )
  ) {

    return false;

  }


  removeItem(
    "water",
    1
  );


  GAME.thirst =
    clamp(
      GAME.thirst +
      CONSTANTS.waterRestore,
      0,
      GAME.maxThirst
    );


  gameEvent(
    "survival-water-drunk"
  );


  return true;

}


// ============================================
// KILL PLAYER
// ============================================

export function killPlayer() {

  GAME.alive =
    false;

  GAME.health =
    0;

  player.sprinting =
    false;

  gameEvent(
    "survival-player-died"
  );

}


// ============================================
// ADD ITEM
// ============================================

export function addItem(
  item,
  amount = 1
) {

  if (
    typeof item !==
    "string"
  ) {

    return false;

  }


  amount =
    Math.max(
      0,
      Number(amount) || 0
    );


  if (
    amount <= 0
  ) {

    return false;

  }


  if (
    !Object.prototype.hasOwnProperty.call(
      GAME.inventory,
      item
    )
  ) {

    GAME.inventory[item] =
      0;

  }


  GAME.inventory[item] +=
    amount;


  gameEvent(
    "survival-inventory-changed",
    {
      action: "add",
      item,
      amount
    }
  );


  return true;

}


// ============================================
// REMOVE ITEM
// ============================================

export function removeItem(
  item,
  amount = 1
) {

  amount =
    Math.max(
      0,
      Number(amount) || 0
    );


  if (
    amount <= 0
  ) {

    return false;

  }


  if (
    !hasItem(
      item,
      amount
    )
  ) {

    return false;

  }


  GAME.inventory[item] -=
    amount;


  gameEvent(
    "survival-inventory-changed",
    {
      action: "remove",
      item,
      amount
    }
  );


  return true;

}


// ============================================
// CHECK ITEM
// ============================================

export function hasItem(
  item,
  amount = 1
) {

  return (
    typeof GAME.inventory[item] ===
      "number" &&
    GAME.inventory[item] >=
      amount
  );

}


// ============================================
// GET ITEM COUNT
// ============================================

export function getItemCount(
  item
) {

  return (
    GAME.inventory[item] || 0
  );

}


// ============================================
// CLEAR INVENTORY
// ============================================

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


  gameEvent(
    "survival-inventory-cleared"
  );

}


// ============================================
// RESOURCE GATHERING
// ============================================

export function gatherResource(
  type,
  amount = 1
) {

  amount =
    Math.max(
      1,
      Math.floor(
        Number(amount) || 1
      )
    );


  // ROCK

  if (
    type === "rock"
  ) {

    addItem(
      "rock",
      amount
    );

    GAME.resources.rocksBroken +=
      amount;

    gameEvent(
      "survival-resource-gathered",
      {
        type: "rock",
        amount
      }
    );

    return true;

  }


  // STONE

  if (
    type === "stone"
  ) {

    addItem(
      "stone",
      amount
    );

    GAME.resources.stoneCollected +=
      amount;

    gameEvent(
      "survival-resource-gathered",
      {
        type: "stone",
        amount
      }
    );

    return true;

  }


  // TREE / LOG

  if (
    type === "tree" ||
    type === "wood"
  ) {

    addItem(
      "log",
      amount
    );

    GAME.resources.treesBroken +=
      amount;

    GAME.resources.logsCollected +=
      amount;

    gameEvent(
      "survival-resource-gathered",
      {
        type: "wood",
        amount
      }
    );

    return true;

  }


  // FIBER

  if (
    type === "fiber"
  ) {

    addItem(
      "fiber",
      amount
    );

    GAME.resources.fiberCollected +=
      amount;

    gameEvent(
      "survival-resource-gathered",
      {
        type: "fiber",
        amount
      }
    );

    return true;

  }


  return false;

}


// ============================================
// CRAFT STRING
// ============================================

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


  GAME.crafting.itemsCrafted++;


  gameEvent(
    "survival-item-crafted",
    {
      item: "string"
    }
  );


  return true;

}


// ============================================
// CRAFT STICKS
// ============================================

export function craftStick() {

  if (
    !hasItem(
      "log",
      1
    )
  ) {

    return false;

  }


  removeItem(
    "log",
    1
  );


  addItem(
    "stick",
    3
  );


  GAME.crafting.itemsCrafted++;


  gameEvent(
    "survival-item-crafted",
    {
      item: "stick"
    }
  );


  return true;

}


// ============================================
// SIDE STORAGE
// ============================================

export function putOnSide(
  side,
  item
) {

  if (
    side !== "left" &&
    side !== "right"
  ) {

    return false;

  }


  if (
    GAME.equipment[
      side === "left"
        ? "leftSide"
        : "rightSide"
    ]
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


  removeItem(
    item,
    1
  );


  const key =
    side === "left"
      ? "leftSide"
      : "rightSide";


  GAME.equipment[key] =
    item;


  gameEvent(
    "survival-side-storage-changed",
    {
      side,
      item
    }
  );


  return true;

}


// ============================================
// TAKE FROM SIDE
// ============================================

export function takeFromSide(
  side
) {

  const key =
    side === "left"
      ? "leftSide"
      : side === "right"
        ? "rightSide"
        : null;


  if (
    !key
  ) {

    return null;

  }


  const item =
    GAME.equipment[key];


  if (
    !item
  ) {

    return null;

  }


  GAME.equipment[key] =
    null;


  addItem(
    item,
    1
  );


  gameEvent(
    "survival-side-storage-changed",
    {
      side,
      item: null
    }
  );


  return item;

}


// ============================================
// HOLD ITEM IN HAND
// ============================================

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


  if (
    GAME.hands[hand]
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


  removeItem(
    item,
    1
  );


  GAME.hands[hand] =
    item;


  gameEvent(
    "survival-item-held",
    {
      hand,
      item
    }
  );


  return true;

}


// ============================================
// RELEASE ITEM
// ============================================

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


  if (
    !item
  ) {

    return null;

  }


  GAME.hands[hand] =
    null;


  addItem(
    item,
    1
  );


  gameEvent(
    "survival-item-released",
    {
      hand,
      item
    }
  );


  return item;

}


// ============================================
// CHECK WHAT IS IN HAND
// ============================================

export function getHeldItem(
  hand
) {

  if (
    hand !== "left" &&
    hand !== "right"
  ) {

    return null;

  }


  return GAME.hands[hand];

}


// ============================================
// BUILDING MATERIALS
// ============================================

export function addBuildingPiece(
  type
) {

  if (
    !GAME.building[
      type
    ] &&
    GAME.building[type] !== 0
  ) {

    GAME.building[type] =
      0;

  }


  GAME.building[type]++;


  GAME.building.placedObjects++;


  gameEvent(
    "survival-building-placed",
    {
      type
    }
  );


  return true;

}


// ============================================
// UNLOCK RECIPE
// ============================================

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
      "survival-recipe-unlocked",
      {
        recipe
      }
    );

    return true;

  }


  return false;

}


// ============================================
// RECIPE CHECK
// ============================================

export function recipeUnlocked(
  recipe
) {

  return GAME.crafting.unlockedRecipes.includes(
    recipe
  );

}


// ============================================
// SAVE DATA
// ============================================

export function getGameData() {

  return {

    version:
      GAME.version,

    GAME:
      structuredClone(
        GAME
      ),

    player:
      structuredClone(
        player
      )

  };

}


// ============================================
// RESET GAME
// ============================================

export function resetGame() {

  GAME.health =
    GAME.maxHealth;

  GAME.hunger =
    GAME.maxHunger;

  GAME.thirst =
    GAME.maxThirst;

  GAME.stamina =
    GAME.maxStamina;


  GAME.day =
    1;

  GAME.time =
    8;


  GAME.alive =
    true;


  GAME.sleeping =
    false;


  GAME.swimming =
    false;


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

    cookedMeat: 0

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

    treesBroken: 0,

    rocksBroken: 0,

    logsCollected: 0,

    stoneCollected: 0,

    fiberCollected: 0

  };


  GAME.building = {

    woodWalls: 0,

    stoneWalls: 0,

    floors: 0,

    roofs: 0,

    doors: 0,

    placedObjects: 0

  };


  GAME.crafting = {

    itemsCrafted: 0,

    unlockedRecipes: [

      "string",

      "stick"

    ]

  };


  GAME.guide = {

    opened: false,

    page: 1

  };


  GAME.hands = {

    left: null,

    right: null

  };


  player.x =
    0;

  player.y =
    0;

  player.z =
    7;

  player.rotation =
    0;

  player.moving =
    false;

  player.sprinting =
    false;


  gameEvent(
    "survival-game-reset"
  );

}


// ============================================
// GAME INFORMATION
// ============================================

export function getGameInfo() {

  return {

    version:
      GAME.version,

    day:
      GAME.day,

    time:
      GAME.time,

    health:
      GAME.health,

    hunger:
      GAME.hunger,

    thirst:
      GAME.thirst,

    stamina:
      GAME.stamina,

    alive:
      GAME.alive,

    inventory:
      {
        ...GAME.inventory
      },

    equipment:
      {
        ...GAME.equipment
      },

    hands:
      {
        ...GAME.hands
      },

    resources:
      {
        ...GAME.resources
      },

    building:
      {
        ...GAME.building
      },

    crafting:
      {
        ...GAME.crafting
      }

  };

}


// ============================================
// STARTUP MESSAGE
// ============================================

console.log(
  "🏝️ Island Survival VR core loaded."
);

console.log(
  "Game version:",
  GAME_VERSION
);
