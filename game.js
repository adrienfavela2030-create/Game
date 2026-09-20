// ========================================
// ISLAND SURVIVAL GAME
// ========================================

export const GAME = {

  health: 100,

  hunger: 100,

  thirst: 100,

  stamina: 100,

  day: 1,

  time: 8,

  inventory: {

    rock: 1,

    wood: 0,

    log: 0,

    stone: 0,

    fiber: 0,

    string: 0,

    stick: 0,

    food: 0,
    water: 0

  },

  equipment: {

    leftSide: null,

    rightSide: null

  }

};


// ========================================
// PLAYER
// ========================================

export const player = {

  x: 0,

  y: 0,

  z: 7,

  rotation: 0,

  height: 1.6

};


// ========================================
// MOVEMENT
// ========================================

export function movePlayer(
  forward,
  sideways,
  delta
) {

  const speed = 3.0;

  const amount =
    speed * delta;

  const directionX =
    Math.sin(player.rotation);

  const directionZ =
    Math.cos(player.rotation);

  player.x +=
    directionX *
    forward *
    amount;

  player.z +=
    directionZ *
    forward *
    amount;

  player.x +=
    Math.cos(player.rotation) *
    sideways *
    amount;

  player.z -=
    Math.sin(player.rotation) *
    sideways *
    amount;


  // Island boundaries

  const distance =
    Math.sqrt(
      player.x * player.x +
      player.z * player.z
    );

  const maxDistance = 25;

  if (distance > maxDistance) {

    const scale =
      maxDistance / distance;

    player.x *= scale;

    player.z *= scale;

  }

}


// ========================================
// TURNING
// ========================================

export function turnPlayer(
  amount,
  delta
) {

  player.rotation +=
    amount *
    2.2 *
    delta;

}


// ========================================
// SURVIVAL
// ========================================

export function updateSurvival(
  delta
) {

  // Hunger slowly decreases

  GAME.hunger -=
    delta * 0.8;

  // Thirst decreases faster

  GAME.thirst -=
    delta * 1.2;


  // Prevent values going below zero

  GAME.hunger =
    Math.max(
      0,
      GAME.hunger
    );

  GAME.thirst =
    Math.max(
      0,
      GAME.thirst
    );


  // Damage when starving/dehydrated

  if (
    GAME.hunger <= 0 ||
    GAME.thirst <= 0
  ) {

    GAME.health -=
      delta * 2;

  }


  GAME.health =
    Math.max(
      0,
      GAME.health
    );


  // Stamina slowly recovers

  GAME.stamina =
    Math.min(
      100,
      GAME.stamina +
      delta * 5
    );

}


// ========================================
// INVENTORY
// ========================================

export function addItem(
  item,
  amount = 1
) {

  if (
    !GAME.inventory[item]
  ) {

    GAME.inventory[item] = 0;

  }

  GAME.inventory[item] +=
    amount;

}


// ========================================
// REMOVE ITEM
// ========================================

export function removeItem(
  item,
  amount = 1
) {

  if (
    !GAME.inventory[item]
  ) {

    return false;

  }

  if (
    GAME.inventory[item] < amount
  ) {

    return false;

  }

  GAME.inventory[item] -=
    amount;

  return true;

}


// ========================================
// GATHER RESOURCE
// ========================================

export function gatherResource(
  type
) {

  if (type === "rock") {

    addItem(
      "rock",
      1
    );

    return true;

  }


  if (type === "tree") {

    addItem(
      "log",
      1
    );

    return true;

  }


  if (type === "fiber") {

    addItem(
      "fiber",
      1
    );

    return true;

  }


  return false;

}


// ========================================
// CRAFT STRING
// ========================================

export function craftString() {

  if (
    GAME.inventory.fiber >= 3
  ) {

    removeItem(
      "fiber",
      3
    );

    addItem(
      "string",
      1
    );

    return true;

  }

  return false;

}


// ========================================
// CRAFT STICK
// ========================================

export function craftStick() {

  if (
    GAME.inventory.log >= 1
  ) {

    removeItem(
      "log",
      1
    );

    addItem(
      "stick",
      3
    );

    return true;

  }

  return false;

}


// ========================================
// SIDE STORAGE
// ========================================

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
    GAME.inventory[item] <= 0
  ) {

    return false;

  }

  if (
    side === "left"
  ) {

    if (
      GAME.equipment.leftSide
    ) {

      return false;

    }

    GAME.equipment.leftSide =
      item;

  }


  if (
    side === "right"
  ) {

    if (
      GAME.equipment.rightSide
    ) {

      return false;

    }

    GAME.equipment.rightSide =
      item;

  }


  removeItem(
    item,
    1
  );

  return true;

}


// ========================================
// REMOVE FROM SIDE
// ========================================

export function takeFromSide(
  side
) {

  let item = null;

  if (
    side === "left"
  ) {

    item =
      GAME.equipment.leftSide;

    GAME.equipment.leftSide =
      null;

  }

  if (
    side === "right"
  ) {

    item =
      GAME.equipment.rightSide;

    GAME.equipment.rightSide =
      null;

  }

  if (item) {

    addItem(
      item,
      1
    );

  }

  return item;

}


// ========================================
// RESET GAME
// ========================================

export function resetGame() {

  GAME.health = 100;

  GAME.hunger = 100;

  GAME.thirst = 100;

  GAME.stamina = 100;

  GAME.day = 1;

  GAME.time = 8;

  GAME.inventory = {

    rock: 1,

    wood: 0,

    log: 0,

    stone: 0,

    fiber: 0,

    string: 0,

    stick: 0,

    food: 0,

    water: 0

  };

  GAME.equipment = {

    leftSide: null,

    rightSide: null

  };

  player.x = 0;

  player.z = 7;

  player.rotation = 0;

}
