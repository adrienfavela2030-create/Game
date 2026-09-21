/* =========================================================
   SURVIVAL ISLAND VR
   GAME CORE
========================================================= */

const S = window.SurvivalVR;

if (!S) {
  throw new Error(
    "SurvivalVR must exist before game.js loads."
  );
}

/* =========================================================
   VERSION
========================================================= */

const GAME_VERSION = 5;

/* =========================================================
   CONSTANTS
========================================================= */

const CONSTANTS = {
  MAX_HEALTH: 100,
  MAX_HUNGER: 100,
  MAX_THIRST: 100,
  MAX_STAMINA: 100,

  HUNGER_DRAIN_PER_SECOND: 0.035,
  THIRST_DRAIN_PER_SECOND: 0.065,

  SPRINT_STAMINA_DRAIN: 8,
  STAMINA_REGEN: 10,

  DAY_LENGTH_MINUTES: 24 * 60,

  START_HOUR: 8,

  STARTING_ITEMS: {
    rock: 1
  }
};

/* =========================================================
   GAME STATE
========================================================= */

const GAME = {
  version: GAME_VERSION,

  world: {
    id: "",
    name: "Unnamed Island",
    seed: "",
    createdAt: 0,
    lastSavedAt: 0,

    day: 1,
    time: CONSTANTS.START_HOUR,
    weather: "sunny"
  },

  player: {
    health: CONSTANTS.MAX_HEALTH,
    hunger: CONSTANTS.MAX_HUNGER,
    thirst: CONSTANTS.MAX_THIRST,
    stamina: CONSTANTS.MAX_STAMINA,

    alive: true,
    sleeping: false,
    sprinting: false
  },

  position: {
    x: 0,
    y: 1.8,
    z: 5,
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
    storageBox: 0,

    placed: []
  },

  crafting: {
    unlockedRecipes: [
      "string",
      "stick",
      "stone"
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
      "stick",
      "stone"
    ],

    currentPage:
      "first_day"
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

    snapTurning: true,
    snapTurnAmount: 30,

    autosave: true
  },

  state: {
    started: false,
    paused: true,
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
  },

  save: {
    hasSave: false,
    lastSaved: 0,
    saveCount: 0
  },

  /*
   * Saved procedural resource states.
   */
  worldResources: []
};


/* =========================================================
   STABLE PLAYER REFERENCE
========================================================= */

const player =
  GAME.player;


/* =========================================================
   EVENT SYSTEM
========================================================= */

function gameEvent(
  name,
  detail = {}
) {
  let eventName =
    String(name || "");

  if (
    eventName.startsWith(
      "survival-"
    )
  ) {
    eventName =
      eventName.substring(
        9
      );
  }

  try {
    window.dispatchEvent(
      new CustomEvent(
        `survival-${eventName}`,
        {
          detail
        }
      )
    );
  } catch (error) {
    console.warn(
      "Game event failed:",
      error
    );
  }
}


/* =========================================================
   WORLD HELPERS
========================================================= */

function setWorldName(
  name
) {
  GAME.world.name =
    String(
      name ||
      "Unnamed Island"
    );

  return GAME.world.name;
}


function setWorldSeed(
  seed
) {
  GAME.world.seed =
    String(
      seed ||
      ""
    );

  return GAME.world.seed;
}


function setWorldDay(
  day
) {
  GAME.world.day =
    Math.max(
      1,
      Math.floor(
        Number(day) || 1
      )
    );
}


function setWorldTime(
  time
) {
  let value =
    Number(time);

  if (
    !Number.isFinite(value)
  ) {
    value = 8;
  }

  while (
    value >= 24
  ) {
    value -= 24;
    GAME.world.day++;
  }

  while (
    value < 0
  ) {
    value += 24;
  }

  GAME.world.time =
    value;
}


/* =========================================================
   PLAYER POSITION
========================================================= */

function setPlayerPosition(
  x,
  y,
  z,
  rotationY
) {
  if (
    Number.isFinite(
      Number(x)
    )
  ) {
    GAME.position.x =
      Number(x);
  }

  if (
    Number.isFinite(
      Number(y)
    )
  ) {
    GAME.position.y =
      Number(y);
  }

  if (
    Number.isFinite(
      Number(z)
    )
  ) {
    GAME.position.z =
      Number(z);
  }

  if (
    Number.isFinite(
      Number(rotationY)
    )
  ) {
    GAME.position.rotationY =
      Number(rotationY);
  }

  syncRigToGame();
}


function movePlayer(
  dx,
  dy,
  dz
) {
  GAME.position.x +=
    Number(dx) || 0;

  GAME.position.y +=
    Number(dy) || 0;

  GAME.position.z +=
    Number(dz) || 0;

  syncRigToGame();
}


function turnPlayer(
  amount
) {
  GAME.position.rotationY +=
    Number(amount) || 0;

  if (
    S.playerRig
  ) {
    S.playerRig.rotation.y =
      GAME.position.rotationY;
  }
}


/* =========================================================
   RIG SYNC
========================================================= */

function syncRigToGame() {
  if (
    !S.playerRig
  ) {
    return;
  }

  S.playerRig.position.set(
    GAME.position.x,
    GAME.position.y,
    GAME.position.z
  );

  S.playerRig.rotation.y =
    GAME.position.rotationY;
}


function syncGameFromPlayerObject() {
  if (
    !S.playerRig
  ) {
    return;
  }

  GAME.position.x =
    S.playerRig.position.x;

  GAME.position.y =
    S.playerRig.position.y;

  GAME.position.z =
    S.playerRig.position.z;

  GAME.position.rotationY =
    S.playerRig.rotation.y;
}


/* =========================================================
   SPRINTING
========================================================= */

function setSprinting(
  value
) {
  player.sprinting =
    !!value;
}


function isSprinting() {
  return !!player.sprinting;
}


/* =========================================================
   SURVIVAL
========================================================= */

function updateSurvival(
  delta
) {
  if (
    !GAME.state.started ||
    GAME.state.paused ||
    GAME.state.gameOver ||
    !player.alive
  ) {
    return;
  }

  const seconds =
    Math.max(
      0,
      Math.min(
        0.1,
        Number(delta) || 0
      )
    );

  /*
   * Hunger.
   */
  player.hunger -=
    CONSTANTS.HUNGER_DRAIN_PER_SECOND *
    seconds;

  /*
   * Thirst.
   */
  player.thirst -=
    CONSTANTS.THIRST_DRAIN_PER_SECOND *
    seconds;

  player.hunger =
    clamp(
      player.hunger,
      0,
      100
    );

  player.thirst =
    clamp(
      player.thirst,
      0,
      100
    );

  /*
   * Dehydration/starvation damage.
   */
  if (
    player.hunger <= 0
  ) {
    damagePlayer(
      1.5 * seconds,
      "starvation"
    );
  }

  if (
    player.thirst <= 0
  ) {
    damagePlayer(
      2.5 * seconds,
      "dehydration"
    );
  }

  /*
   * Stamina.
   */
  if (
    player.sprinting
  ) {
    player.stamina -=
      CONSTANTS.SPRINT_STAMINA_DRAIN *
      seconds;

    if (
      player.stamina <= 0
    ) {
      player.stamina = 0;
      player.sprinting =
        false;
    }
  } else {
    player.stamina +=
      CONSTANTS.STAMINA_REGEN *
      seconds;
  }

  player.stamina =
    clamp(
      player.stamina,
      0,
      100
    );

  /*
   * Track time.
   */
  const previousTime =
    GAME.world.time;

  GAME.world.time +=
    seconds /
    60;

  if (
    GAME.world.time >= 24
  ) {
    GAME.world.time -=
      24;

    GAME.world.day++;

    GAME.statistics.daysSurvived++;

    gameEvent(
      "new-day",
      {
        day:
          GAME.world.day
      }
    );
  }

  /*
   * Distance.
   */
  if (
    S.playerRig
  ) {
    const dx =
      S.playerRig.position.x -
      GAME.position.x;

    const dz =
      S.playerRig.position.z -
      GAME.position.z;

    if (
      Math.abs(dx) +
      Math.abs(dz) >
      0.001
    ) {
      GAME.statistics.distanceWalked +=
        Math.sqrt(
          dx * dx +
          dz * dz
        );
    }

    syncGameFromPlayerObject();
  }

  /*
   * Emit periodic time event.
   */
  if (
    Math.floor(previousTime * 60) !==
    Math.floor(GAME.world.time * 60)
  ) {
    gameEvent(
      "world-time",
      {
        day:
          GAME.world.day,

        time:
          GAME.world.time
      }
    );
  }
}


/* =========================================================
   DAMAGE / HEALING
========================================================= */

function damagePlayer(
  amount,
  reason = "unknown"
) {
  if (
    !player.alive
  ) {
    return player.health;
  }

  const damage =
    Math.max(
      0,
      Number(amount) || 0
    );

  player.health -=
    damage;

  player.health =
    clamp(
      player.health,
      0,
      100
    );

  gameEvent(
    "player-damaged",
    {
      amount:
        damage,

      reason,

      health:
        player.health
    }
  );

  if (
    player.health <= 0
  ) {
    killPlayer(
      reason
    );
  }

  return player.health;
}


function healPlayer(
  amount
) {
  if (
    !player.alive
  ) {
    return player.health;
  }

  player.health =
    clamp(
      player.health +
        Math.max(
          0,
          Number(amount) || 0
        ),
      0,
      100
    );

  return player.health;
}


function killPlayer(
  reason = "unknown"
) {
  player.health =
    0;

  player.alive =
    false;

  player.sprinting =
    false;

  GAME.state.gameOver =
    true;

  GAME.state.paused =
    true;

  gameEvent(
    "player-died",
    {
      reason
    }
  );
}


/* =========================================================
   FOOD / WATER
========================================================= */

function eatFood(
  itemType = "food"
) {
  if (
    getItemCount(
      itemType
    ) <= 0
  ) {
    return false;
  }

  removeItem(
    itemType,
    1
  );

  let hungerGain =
    20;

  let healthGain =
    0;

  if (
    itemType ===
    "cookedMeat"
  ) {
    hungerGain =
      35;

    healthGain =
      5;
  }

  if (
    itemType ===
    "rawMeat"
  ) {
    hungerGain =
      15;
  }

  player.hunger =
    clamp(
      player.hunger +
        hungerGain,
      0,
      100
    );

  if (
    healthGain
  ) {
    healPlayer(
      healthGain
    );
  }

  gameEvent(
    "food-eaten",
    {
      itemType,
      hunger:
        player.hunger
    }
  );

  return true;
}


function drinkWater() {
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

  player.thirst =
    clamp(
      player.thirst +
        35,
      0,
      100
    );

  gameEvent(
    "water-drunk",
    {
      thirst:
        player.thirst
    }
  );

  return true;
}


/* =========================================================
   INVENTORY
========================================================= */

function addItem(
  itemType,
  amount = 1
) {
  const type =
    String(
      itemType || ""
    );

  const value =
    Math.floor(
      Number(amount) || 0
    );

  if (
    !type ||
    value <= 0
  ) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      GAME.inventory,
      type
    )
  ) {
    GAME.inventory[type] =
      0;
  }

  GAME.inventory[type] +=
    value;

  gameEvent(
    "inventory-changed",
    {
      itemType: type,
      amount: value,
      total:
        GAME.inventory[type]
    }
  );

  return true;
}


function removeItem(
  itemType,
  amount = 1
) {
  const type =
    String(
      itemType || ""
    );

  const value =
    Math.floor(
      Number(amount) || 0
    );

  if (
    !type ||
    value <= 0
  ) {
    return false;
  }

  const current =
    getItemCount(
      type
    );

  if (
    current < value
  ) {
    return false;
  }

  GAME.inventory[type] =
    current - value;

  gameEvent(
    "inventory-changed",
    {
      itemType: type,
      amount: -value,
      total:
        GAME.inventory[type]
    }
  );

  return true;
}


function hasItem(
  itemType,
  amount = 1
) {
  return (
    getItemCount(
      itemType
    ) >=
    Math.max(
      0,
      Number(amount) || 0
    )
  );
}


function getItemCount(
  itemType
) {
  return Math.max(
    0,
    Number(
      GAME.inventory[
        itemType
      ]
    ) || 0
  );
}


function clearInventory() {
  for (
    const key of
      Object.keys(
        GAME.inventory
      )
  ) {
    GAME.inventory[key] =
      0;
  }
}


/* =========================================================
   RESOURCE GATHERING
========================================================= */

function gatherResource(
  type,
  amount = 1
) {
  const resourceType =
    String(
      type || ""
    );

  const value =
    Math.max(
      1,
      Math.floor(
        Number(amount) || 1
      )
    );

  if (
    !resourceType
  ) {
    return false;
  }

  addItem(
    resourceType,
    value
  );

  if (
    resourceType ===
    "wood"
  ) {
    GAME.resources.wood +=
      value;
  }

  if (
    resourceType ===
    "stone"
  ) {
    GAME.resources.stone +=
      value;
  }

  if (
    resourceType ===
    "fiber"
  ) {
    GAME.resources.fiber +=
      value;
  }

  gameEvent(
    "resource-gathered",
    {
      type:
        resourceType,

      amount:
        value
    }
  );

  return true;
}


/* =========================================================
   BASIC CRAFTING
========================================================= */

function craftString() {
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


function craftStick() {
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


function registerCraft(
  recipeId
) {
  const id =
    String(
      recipeId || ""
    );

  if (!id) {
    return;
  }

  if (
    !GAME.crafting.crafted[id]
  ) {
    GAME.crafting.crafted[id] =
      0;
  }

  GAME.crafting.crafted[id]++;

  GAME.crafting.lastCrafted =
    id;

  GAME.statistics.itemsCrafted++;

  gameEvent(
    "item-crafted",
    {
      recipe:
        id
    }
  );
}


function unlockRecipe(
  recipeId
) {
  const id =
    String(
      recipeId || ""
    );

  if (
    !id
  ) {
    return false;
  }

  if (
    !GAME.crafting.unlockedRecipes.includes(
      id
    )
  ) {
    GAME.crafting.unlockedRecipes.push(
      id
    );
  }

  if (
    !GAME.guide.discoveredRecipes.includes(
      id
    )
  ) {
    GAME.guide.discoveredRecipes.push(
      id
    );
  }

  gameEvent(
    "recipe-unlocked",
    {
      recipe:
        id
    }
  );

  return true;
}


function recipeUnlocked(
  recipeId
) {
  return GAME.crafting.unlockedRecipes.includes(
    recipeId
  );
}


/* =========================================================
   SIDE STORAGE
========================================================= */

function putOnSide(
  side,
  itemType
) {
  const target =
    normalizeSide(
      side
    );

  if (
    !target
  ) {
    return false;
  }

  if (
    !hasItem(
      itemType,
      1
    )
  ) {
    return false;
  }

  const oldItem =
    GAME.equipment[
      target
    ];

  if (
    oldItem
  ) {
    addItem(
      oldItem,
      1
    );
  }

  removeItem(
    itemType,
    1
  );

  GAME.equipment[
    target
  ] =
    itemType;

  gameEvent(
    "side-slot-changed",
    {
      side:
        target,

      item:
        itemType
    }
  );

  return true;
}


function takeFromSide(
  side
) {
  const target =
    normalizeSide(
      side
    );

  if (
    !target
  ) {
    return null;
  }

  const item =
    GAME.equipment[
      target
    ];

  if (
    !item
  ) {
    return null;
  }

  GAME.equipment[
    target
  ] =
    null;

  addItem(
    item,
    1
  );

  return item;
}


function normalizeSide(
  side
) {
  const value =
    String(
      side || ""
    ).toLowerCase();

  if (
    value ===
      "left" ||
    value ===
      "leftside"
  ) {
    return "leftSide";
  }

  if (
    value ===
      "right" ||
    value ===
      "rightside"
  ) {
    return "rightSide";
  }

  return null;
}


/* =========================================================
   HAND ITEMS
========================================================= */

function holdItem(
  hand,
  itemType
) {
  const side =
    normalizeHand(
      hand
    );

  if (
    !side
  ) {
    return false;
  }

  if (
    !hasItem(
      itemType,
      1
    )
  ) {
    return false;
  }

  const previous =
    GAME.hands[
      side
    ];

  if (
    previous
  ) {
    addItem(
      previous,
      1
    );
  }

  removeItem(
    itemType,
    1
  );

  GAME.hands[
    side
  ] =
    itemType;

  gameEvent(
    "item-held",
    {
      hand:
        side,

      item:
        itemType
    }
  );

  return true;
}


function releaseItem(
  hand
) {
  const side =
    normalizeHand(
      hand
    );

  if (
    !side
  ) {
    return null;
  }

  const item =
    GAME.hands[
      side
    ];

  if (
    !item
  ) {
    return null;
  }

  GAME.hands[
    side
  ] =
    null;

  addItem(
    item,
    1
  );

  gameEvent(
    "item-released",
    {
      hand:
        side,

      item
    }
  );

  return item;
}


function getHeldItem(
  hand
) {
  const side =
    normalizeHand(
      hand
    );

  if (
    !side
  ) {
    return null;
  }

  return (
    GAME.hands[
      side
    ] || null
  );
}


function normalizeHand(
  hand
) {
  const value =
    String(
      hand || ""
    ).toLowerCase();

  if (
    value ===
      "left" ||
    value ===
      "lefthand"
  ) {
    return "left";
  }

  if (
    value ===
      "right" ||
    value ===
      "righthand"
  ) {
    return "right";
  }

  return null;
}


/* =========================================================
   BUILDINGS
========================================================= */

function addBuildingPiece(
  type,
  data = {}
) {
  const buildingType =
    String(
      type || ""
    );

  if (
    !buildingType
  ) {
    return null;
  }

  const piece = {
    id:
      data.id ||
      `building-${Date.now()}-${Math.floor(Math.random() * 100000)}`,

    type:
      buildingType,

    position: {
      x:
        Number(
          data.position?.x
        ) || 0,

      y:
        Number(
          data.position?.y
        ) || 0,

      z:
        Number(
          data.position?.z
        ) || 0
    },

    rotation:
      Number(
        data.rotation
      ) || 0
  };

  GAME.buildings.placed.push(
    piece
  );

  GAME.buildings.total++;

  if (
    Object.prototype.hasOwnProperty.call(
      GAME.buildings,
      buildingType
    )
  ) {
    GAME.buildings[
      buildingType
    ]++;
  }

  GAME.statistics.buildingsBuilt++;

  gameEvent(
    "building-added",
    piece
  );

  return piece;
}


function removeBuildingPiece(
  id
) {
  const index =
    GAME.buildings.placed.findIndex(
      piece =>
        piece.id === id
    );

  if (
    index === -1
  ) {
    return false;
  }

  const piece =
    GAME.buildings.placed[
      index
    ];

  GAME.buildings.placed.splice(
    index,
    1
  );

  GAME.buildings.total =
    Math.max(
      0,
      GAME.buildings.total -
        1
    );

  if (
    GAME.buildings[
      piece.type
    ] !== undefined
  ) {
    GAME.buildings[
      piece.type
    ] =
      Math.max(
        0,
        GAME.buildings[
          piece.type
        ] -
          1
      );
  }

  gameEvent(
    "building-removed",
    piece
  );

  return true;
}


/* =========================================================
   WORLD ID
========================================================= */

function createWorldId() {
  return (
    "world-" +
    Date.now().toString(36) +
    "-" +
    Math.floor(
      Math.random() *
      999999
    ).toString(36)
  );
}


/* =========================================================
   NEW WORLD
========================================================= */

function createNewWorld(
  seed
) {
  const newSeed =
    String(
      seed ||
      createWorldId()
    );

  /*
   * Clear old buildings.
   */
  if (
    S.systems.building &&
    typeof S.systems.building.clearBuildings ===
      "function"
  ) {
    S.systems.building.clearBuildings();
  } else {
    GAME.buildings.placed =
      [];

    GAME.buildings.total =
      0;
  }

  /*
   * Clear old animals.
   */
  if (
    S.systems.animals &&
    typeof S.systems.animals.clearAnimals ===
      "function"
  ) {
    S.systems.animals.clearAnimals();
  }

  /*
   * Reset player.
   */
  resetPlayer();

  /*
   * Reset world.
   */
  GAME.world.id =
    createWorldId();

  GAME.world.name =
    "Unnamed Island";

  GAME.world.seed =
    newSeed;

  GAME.world.createdAt =
    Date.now();

  GAME.world.lastSavedAt =
    0;

  GAME.world.day =
    1;

  GAME.world.time =
    CONSTANTS.START_HOUR;

  GAME.world.weather =
    "sunny";

  /*
   * Generate procedural island.
   */
  let worldData =
    null;

  if (
    S.systems.world &&
    typeof S.systems.world.createNewWorld ===
      "function"
  ) {
    worldData =
      S.systems.world.createNewWorld(
        newSeed
      );
  }

  /*
   * Put player at safe spawn.
   */
  placePlayerAtSpawn();

  /*
   * Reset save flag.
   */
  GAME.save.hasSave =
    false;

  GAME.save.lastSaved =
    0;

  GAME.save.saveCount =
    0;

  GAME.state.started =
    false;

  GAME.state.paused =
    true;

  GAME.state.gameOver =
    false;

  gameEvent(
    "new-world-created",
    {
      seed:
        newSeed,

      world:
        worldData
    }
  );

  return worldData;
}


/* =========================================================
   PLAYER RESET
========================================================= */

function resetPlayer() {
  player.health =
    100;

  player.hunger =
    100;

  player.thirst =
    100;

  player.stamina =
    100;

  player.alive =
    true;

  player.sleeping =
    false;

  player.sprinting =
    false;

  GAME.position.x =
    0;

  GAME.position.y =
    1.8;

  GAME.position.z =
    5;

  GAME.position.rotationY =
    0;

  /*
   * Starting inventory.
   */
  for (
    const key of
      Object.keys(
        GAME.inventory
      )
  ) {
    GAME.inventory[key] =
      0;
  }

  GAME.inventory.rock =
    1;

  GAME.equipment.leftSide =
    null;

  GAME.equipment.rightSide =
    null;

  GAME.hands.left =
    null;

  GAME.hands.right =
    null;

  GAME.resources = {
    treesCut: 0,
    rocksBroken: 0,
    logsCollected: 0,
    wood: 0,
    stone: 0,
    fiber: 0
  };

  GAME.buildings = {
    total: 0,
    woodFloor: 0,
    woodWall: 0,
    woodDoor: 0,
    campfire: 0,
    storageBox: 0,
    placed: []
  };

  GAME.crafting = {
    unlockedRecipes: [
      "string",
      "stick",
      "stone"
    ],

    crafted: {},

    lastCrafted: null
  };

  GAME.guide = {
    discoveredPages: [
      "first_day"
    ],

    discoveredRecipes: [
      "string",
      "stick",
      "stone"
    ],

    currentPage:
      "first_day"
  };

  GAME.animals = {
    rabbits: [],
    deer: [],
    birds: [],
    total: 0
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

  GAME.worldResources =
    [];
}


/* =========================================================
   SAFE SPAWN
========================================================= */

function placePlayerAtSpawn() {
  let y =
    1.8;

  if (
    S.systems.world &&
    typeof S.systems.world.getTerrainHeightAt ===
      "function"
  ) {
    y =
      S.systems.world.getTerrainHeightAt(
        0,
        5
      );
  }

  GAME.position.x =
    0;

  GAME.position.y =
    y;

  GAME.position.z =
    5;

  GAME.position.rotationY =
    0;

  syncRigToGame();
}


/* =========================================================
   SAVE DATA
========================================================= */

function getGameData() {
  syncGameFromPlayerObject();

  /*
   * Copy resource state.
   */
  if (
    S.systems.world &&
    typeof S.systems.world.getResourceRecords ===
      "function"
  ) {
    GAME.worldResources =
      S.systems.world
        .getResourceRecords()
        .map(
          resource => ({
            id:
              resource.id,

            type:
              resource.type,

            active:
              resource.active,

            position: {
              x:
                resource.position.x,

              y:
                resource.position.y,

              z:
                resource.position.z
            }
          })
        );
  }

  /*
   * Return a deep copy so external
   * code cannot accidentally mutate
   * the live game state.
   */
  return JSON.parse(
    JSON.stringify(
      GAME
    )
  );
}


function loadGameData(
  data
) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return false;
  }

  /*
   * World.
   */
  if (
    data.world
  ) {
    Object.assign(
      GAME.world,
      data.world
    );
  }

  /*
   * Player.
   */
  if (
    data.player
  ) {
    Object.assign(
      GAME.player,
      data.player
    );
  }

  /*
   * Position.
   */
  if (
    data.position
  ) {
    Object.assign(
      GAME.position,
      data.position
    );
  }

  /*
   * Inventory.
   */
  if (
    data.inventory
  ) {
    GAME.inventory =
      {
        ...GAME.inventory,
        ...data.inventory
      };
  }

  /*
   * Equipment.
   */
  if (
    data.equipment
  ) {
    GAME.equipment =
      {
        ...GAME.equipment,
        ...data.equipment
      };
  }

  /*
   * Hands.
   */
  if (
    data.hands
  ) {
    GAME.hands =
      {
        ...GAME.hands,
        ...data.hands
      };
  }

  /*
   * Resources.
   */
  if (
    data.resources
  ) {
    GAME.resources =
      {
        ...GAME.resources,
        ...data.resources
      };
  }

  /*
   * Buildings.
   */
  if (
    data.buildings
  ) {
    GAME.buildings =
      {
        ...GAME.buildings,
        ...data.buildings,

        placed:
          Array.isArray(
            data.buildings.placed
          )
            ? data.buildings.placed
            : []
      };
  }

  /*
   * Crafting.
   */
  if (
    data.crafting
  ) {
    GAME.crafting =
      {
        ...GAME.crafting,
        ...data.crafting
      };
  }

  /*
   * Guide.
   */
  if (
    data.guide
  ) {
    GAME.guide =
      {
        ...GAME.guide,
        ...data.guide
      };
  }

  /*
   * Animals.
   */
  if (
    data.animals
  ) {
    GAME.animals =
      {
        ...GAME.animals,
        ...data.animals
      };
  }

  /*
   * Environment.
   */
  if (
    data.environment
  ) {
    GAME.environment =
      {
        ...GAME.environment,
        ...data.environment
      };
  }

  /*
   * Settings.
   */
  if (
    data.settings
  ) {
    GAME.settings =
      {
        ...GAME.settings,
        ...data.settings
      };
  }

  /*
   * Statistics.
   */
  if (
    data.statistics
  ) {
    GAME.statistics =
      {
        ...GAME.statistics,
        ...data.statistics
      };
  }

  /*
   * Save.
   */
  if (
    data.save
  ) {
    GAME.save =
      {
        ...GAME.save,
        ...data.save
      };
  }

  /*
   * World resources.
   */
  GAME.worldResources =
    Array.isArray(
      data.worldResources
    )
      ? data.worldResources
      : [];

  /*
   * Do not let a loaded save
   * accidentally start itself.
   */
  GAME.state.started =
    false;

  GAME.state.paused =
    true;

  GAME.state.gameOver =
    !GAME.player.alive;

  syncRigToGame();

  return true;
}


/* =========================================================
   SAVE MARKER
========================================================= */

function markSaved() {
  const now =
    Date.now();

  GAME.world.lastSavedAt =
    now;

  GAME.save.lastSaved =
    now;

  GAME.save.hasSave =
    true;

  GAME.save.saveCount++;

  gameEvent(
    "game-saved",
    {
      timestamp:
        now
    }
  );

  return true;
}


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {
  resetPlayer();

  GAME.world.id =
    "";

  GAME.world.name =
    "Unnamed Island";

  GAME.world.seed =
    "";

  GAME.world.createdAt =
    0;

  GAME.world.lastSavedAt =
    0;

  GAME.world.day =
    1;

  GAME.world.time =
    CONSTANTS.START_HOUR;

  GAME.world.weather =
    "sunny";

  GAME.save.hasSave =
    false;

  GAME.save.lastSaved =
    0;

  GAME.save.saveCount =
    0;

  GAME.state.started =
    false;

  GAME.state.paused =
    true;

  GAME.state.gameOver =
    false;

  GAME.state.loading =
    false;

  syncRigToGame();

  gameEvent(
    "game-reset"
  );
}


/* =========================================================
   PAUSE
========================================================= */

function setPaused(
  value
) {
  GAME.state.paused =
    !!value;

  gameEvent(
    GAME.state.paused
      ? "game-paused"
      : "game-resumed"
  );
}


/* =========================================================
   VR STATE
========================================================= */

function setVRState(
  value
) {
  GAME.state.inVR =
    !!value;
}


/* =========================================================
   GAME INFO
========================================================= */

function getGameInfo() {
  return {
    version:
      GAME_VERSION,

    world: {
      ...GAME.world
    },

    player: {
      ...GAME.player
    },

    position: {
      ...GAME.position
    },

    state: {
      ...GAME.state
    },

    seed:
      GAME.world.seed,

    day:
      GAME.world.day,

    time:
      GAME.world.time
  };
}


/* =========================================================
   UTILITY
========================================================= */

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


/* =========================================================
   EXPORTS
========================================================= */

export {
  GAME_VERSION,
  CONSTANTS,
  GAME,
  player,

  gameEvent,

  setWorldName,
  setWorldSeed,
  setWorldDay,
  setWorldTime,

  setPlayerPosition,
  movePlayer,
  turnPlayer,

  setSprinting,
  isSprinting,

  updateSurvival,

  damagePlayer,
  healPlayer,
  eatFood,
  drinkWater,
  killPlayer,

  addItem,
  removeItem,
  hasItem,
  getItemCount,
  clearInventory,

  gatherResource,

  craftString,
  craftStick,
  registerCraft,
  unlockRecipe,
  recipeUnlocked,

  putOnSide,
  takeFromSide,

  holdItem,
  releaseItem,
  getHeldItem,

  addBuildingPiece,
  removeBuildingPiece,

  createWorldId,
  createNewWorld,

  getGameData,
  loadGameData,

  resetGame,
  setPaused,
  setVRState,

  markSaved,

  syncGameFromPlayerObject,

  getGameInfo
};

export default {
  GAME_VERSION,
  CONSTANTS,
  GAME,
  player,

  gameEvent,

  setWorldName,
  setWorldSeed,
  setWorldDay,
  setWorldTime,

  setPlayerPosition,
  movePlayer,
  turnPlayer,

  setSprinting,
  isSprinting,

  updateSurvival,

  damagePlayer,
  healPlayer,
  eatFood,
  drinkWater,
  killPlayer,

  addItem,
  removeItem,
  hasItem,
  getItemCount,
  clearInventory,

  gatherResource,

  craftString,
  craftStick,
  registerCraft,
  unlockRecipe,
  recipeUnlocked,

  putOnSide,
  takeFromSide,

  holdItem,
  releaseItem,
  getHeldItem,

  addBuildingPiece,
  removeBuildingPiece,

  createWorldId,
  createNewWorld,

  getGameData,
  loadGameData,

  resetGame,
  setPaused,
  setVRState,

  markSaved,

  syncGameFromPlayerObject,

  getGameInfo
};