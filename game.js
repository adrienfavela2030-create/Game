// ============================================================
// VR CONVENIENCE STORE
// game.js
// ============================================================

import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// ============================================================
// GAME SETTINGS
// ============================================================

export const GAME = {

  movementSpeed: 2.5,

  turnSpeed: 1.8,

  playerHeight: 1.6,

  storeLimitX: 8.5,

  storeLimitZ: 8.5,

  money: 100,

  day: 1

};


// ============================================================
// PLAYER
// ============================================================

export const player = {

  position: new THREE.Vector3(
    0,
    0,
    7
  ),

  rotation: 0

};


// ============================================================
// INVENTORY
// ============================================================

export const inventory = {

  drinks: 20,

  chips: 20,

  candy: 20,

  food: 10

};


// ============================================================
// STORE
// ============================================================

export const store = {

  name: "Adrien's Convenience Store",

  level: 1,

  customers: 0,

  sales: 0,

  productsSold: 0

};


// ============================================================
// PRODUCT DATA
// ============================================================

export const products = {

  soda: {

    name: "Soda",

    price: 2,

    stock: 20,

    category: "drinks"

  },

  chips: {

    name: "Chips",

    price: 2.50,

    stock: 20,

    category: "chips"

  },

  candy: {

    name: "Candy",

    price: 1.50,

    stock: 20,

    category: "candy"

  },

  pizza: {

    name: "Pizza",

    price: 4,

    stock: 10,

    category: "food"

  }

};


// ============================================================
// ADD MONEY
// ============================================================

export function addMoney(amount) {

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {

    return;
  }

  GAME.money += amount;

  GAME.money =
    Math.round(
      GAME.money * 100
    ) / 100;

}


// ============================================================
// REMOVE MONEY
// ============================================================

export function removeMoney(amount) {

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    return false;
  }


  if (
    GAME.money < amount
  ) {

    return false;
  }


  GAME.money -= amount;

  GAME.money =
    Math.round(
      GAME.money * 100
    ) / 100;


  return true;
}


// ============================================================
// SELL PRODUCT
// ============================================================

export function sellProduct(
  productId
) {

  const product =
    products[productId];


  if (!product) {

    return {

      success: false,

      message: "Product not found."

    };
  }


  if (
    product.stock <= 0
  ) {

    return {

      success: false,

      message: "This product is out of stock."

    };
  }


  product.stock--;

  addMoney(
    product.price
  );


  store.sales++;

  store.productsSold++;


  return {

    success: true,

    message:
      `${product.name} sold for $${product.price.toFixed(2)}.`

  };
}


// ============================================================
// RESTOCK PRODUCT
// ============================================================

export function restockProduct(
  productId,
  amount = 10
) {

  const product =
    products[productId];


  if (!product) {

    return {

      success: false,

      message: "Product not found."

    };
  }


  amount =
    Math.max(
      1,
      Math.floor(amount)
    );


  const cost =
    amount * 0.75;


  if (
    !removeMoney(cost)
  ) {

    return {

      success: false,

      message:
        `You need $${cost.toFixed(2)} to restock.`

    };
  }


  product.stock += amount;


  return {

    success: true,

    message:
      `${amount} ${product.name} added to stock.`

  };
}


// ============================================================
// STORE LEVEL
// ============================================================

export function upgradeStore() {

  const upgradeCost =
    store.level * 250;


  if (
    !removeMoney(upgradeCost)
  ) {

    return {

      success: false,

      message:
        `You need $${upgradeCost.toFixed(2)} to upgrade.`

    };
  }


  store.level++;


  return {

    success: true,

    message:
      `Store upgraded to level ${store.level}.`

  };
}


// ============================================================
// CUSTOMER
// ============================================================

export function createCustomer() {

  store.customers++;


  return {

    id: store.customers,

    name:
      `Customer ${store.customers}`,

    shopping: false,

    item: null,

    paid: false

  };
}


// ============================================================
// CUSTOMER PURCHASE
// ============================================================

export function customerPurchase(
  customer,
  productId
) {

  const product =
    products[productId];


  if (!product) {

    return false;
  }


  if (
    product.stock <= 0
  ) {

    return false;
  }


  product.stock--;

  addMoney(
    product.price
  );


  customer.item =
    productId;

  customer.paid =
    true;

  store.sales++;

  store.productsSold++;


  return true;
}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

export function movePlayer(
  forward,
  sideways,
  delta
) {

  if (
    !Number.isFinite(forward) ||
    !Number.isFinite(sideways)
  ) {

    return;
  }


  const direction =
    new THREE.Vector3(
      sideways,
      0,
      forward
    );


  const rotation =
    player.rotation;


  direction.applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    rotation
  );


  if (
    direction.lengthSq() > 0
  ) {

    direction.normalize();

    player.position.addScaledVector(
      direction,
      GAME.movementSpeed * delta
    );
  }


  // Keep player inside store.

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -GAME.storeLimitX,
      GAME.storeLimitX
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -GAME.storeLimitZ,
      GAME.storeLimitZ
    );
}


// ============================================================
// PLAYER TURNING
// ============================================================

export function turnPlayer(
  amount,
  delta
) {

  if (
    !Number.isFinite(amount)
  ) {

    return;
  }


  player.rotation -=
    amount *
    GAME.turnSpeed *
    delta;
}


// ============================================================
// SAVE DATA
// ============================================================

export function getGameData() {

  return {

    money: GAME.money,

    day: GAME.day,

    storeLevel: store.level,

    sales: store.sales,

    productsSold:
      store.productsSold,

    inventory: {

      soda:
        products.soda.stock,

      chips:
        products.chips.stock,

      candy:
        products.candy.stock,

      pizza:
        products.pizza.stock

    }

  };
}


// ============================================================
// RESET GAME
// ============================================================

export function resetGame() {

  GAME.money = 100;

  GAME.day = 1;

  store.level = 1;

  store.customers = 0;

  store.sales = 0;

  store.productsSold = 0;


  products.soda.stock = 20;

  products.chips.stock = 20;

  products.candy.stock = 20;

  products.pizza.stock = 10;


  player.position.set(
    0,
    0,
    7
  );


  player.rotation = 0;
}


// ============================================================
// DEBUG INFO
// ============================================================

export function getStoreInfo() {

  return {

    storeName:
      store.name,

    level:
      store.level,

    money:
      GAME.money,

    day:
      GAME.day,

    customers:
      store.customers,

    sales:
      store.sales,

    productsSold:
      store.productsSold,

    products: {

      soda:
        products.soda.stock,

      chips:
        products.chips.stock,

      candy:
        products.candy.stock,

      pizza:
        products.pizza.stock

    }

  };
}
