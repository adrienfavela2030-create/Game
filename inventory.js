// ============================================
// ISLAND SURVIVAL VR
// INVENTORY SYSTEM
// ============================================
//
// Connects to:
//   game.js
//   index.html
//   hands.js
//
// Future systems:
//   crafting.js
//   building.js
//   guide.js
//   world.js
//
// ============================================


import {
  GAME,
  addItem,
  removeItem,
  hasItem,
  getItemCount,
  holdItem,
  releaseItem,
  putOnSide,
  takeFromSide,
  getHeldItem
} from "./game.js";


// ============================================
// INVENTORY VERSION
// ============================================

export const INVENTORY_VERSION = 1;


// ============================================
// ITEM DEFINITIONS
// ============================================

export const ITEMS = {

  rock: {
    name: "Rock",
    icon: "🪨",
    category: "resource",
    stack: 20,
    usable: true,
    holdable: true
  },

  stone: {
    name: "Stone",
    icon: "🪨",
    category: "resource",
    stack: 50,
    usable: true,
    holdable: true
  },

  log: {
    name: "Log",
    icon: "🪵",
    category: "resource",
    stack: 10,
    usable: true,
    holdable: true
  },

  wood: {
    name: "Wood",
    icon: "🪵",
    category: "resource",
    stack: 50,
    usable: true,
    holdable: true
  },

  stick: {
    name: "Stick",
    icon: "🥢",
    category: "resource",
    stack: 50,
    usable: true,
    holdable: true
  },

  fiber: {
    name: "Fiber",
    icon: "🌿",
    category: "resource",
    stack: 50,
    usable: true,
    holdable: true
  },

  string: {
    name: "String",
    icon: "🧵",
    category: "material",
    stack: 50,
    usable: true,
    holdable: true
  },

  leaf: {
    name: "Leaf",
    icon: "🍃",
    category: "material",
    stack: 50,
    usable: true,
    holdable: true
  },

  food: {
    name: "Food",
    icon: "🍖",
    category: "food",
    stack: 10,
    usable: true,
    holdable: true
  },

  water: {
    name: "Water",
    icon: "💧",
    category: "drink",
    stack: 10,
    usable: true,
    holdable: true
  },

  rawMeat: {
    name: "Raw Meat",
    icon: "🥩",
    category: "food",
    stack: 10,
    usable: true,
    holdable: true
  },

  cookedMeat: {
    name: "Cooked Meat",
    icon: "🍖",
    category: "food",
    stack: 10,
    usable: true,
    holdable: true
  }

};


// ============================================
// INVENTORY SLOT SETTINGS
// ============================================

export const INVENTORY_SETTINGS = {

  slots: 24,

  hotbarSlots: 6,

  leftSideSlot: true,

  rightSideSlot: true,

  allowStacking: true

};


// ============================================
// INVENTORY STATE
// ============================================

const inventoryState = {

  open: false,

  selectedSlot: 0,

  selectedCategory: "all",

  draggingItem: null,

  initialized: false

};


// ============================================
// INVENTORY ELEMENT
// ============================================

let inventoryElement = null;

let inventoryPanel = null;

let inventoryGrid = null;

let sideStorageElement = null;

let heldItemsElement = null;


// ============================================
// GET ITEM INFORMATION
// ============================================

export function getItemInfo(
  item
) {

  return (
    ITEMS[item] ||
    {
      name: item,
      icon: "❔",
      category: "unknown",
      stack: 1,
      usable: false,
      holdable: false
    }
  );

}


// ============================================
// GET INVENTORY
// ============================================

export function getInventory() {

  return {
    ...GAME.inventory
  };

}


// ============================================
// GET ALL NON-EMPTY ITEMS
// ============================================

export function getStoredItems() {

  return Object.entries(
    GAME.inventory
  )
    .filter(
      ([, amount]) =>
        amount > 0
    )
    .map(
      ([item, amount]) => ({
        item,
        amount,
        info:
          getItemInfo(item)
      })
    );

}


// ============================================
// GET ITEM TOTAL
// ============================================

export function countItem(
  item
) {

  return getItemCount(
    item
  );

}


// ============================================
// ADD ITEM SAFELY
// ============================================

export function giveItem(
  item,
  amount = 1
) {

  if (
    !ITEMS[item]
  ) {

    console.warn(
      "Unknown inventory item:",
      item
    );

  }


  const result =
    addItem(
      item,
      amount
    );


  refreshInventoryUI();


  return result;

}


// ============================================
// REMOVE ITEM SAFELY
// ============================================

export function takeItem(
  item,
  amount = 1
) {

  const result =
    removeItem(
      item,
      amount
    );


  refreshInventoryUI();


  return result;

}


// ============================================
// MOVE ITEM INTO HAND
// ============================================

export function equipItem(
  item,
  hand
) {

  const info =
    getItemInfo(
      item
    );


  if (
    !info.holdable
  ) {

    showInventoryMessage(
      `${info.name} cannot be held.`
    );

    return false;

  }


  if (
    getHeldItem(hand)
  ) {

    showInventoryMessage(
      `${hand} hand is already holding something.`
    );

    return false;

  }


  const result =
    holdItem(
      hand,
      item
    );


  if (
    result
  ) {

    updateHeldVisuals();

    refreshInventoryUI();

    showInventoryMessage(
      `${info.name} equipped.`
    );

  }


  return result;

}


// ============================================
// REMOVE ITEM FROM HAND
// ============================================

export function unequipItem(
  hand
) {

  const item =
    getHeldItem(
      hand
    );


  if (
    !item
  ) {

    return false;

  }


  const info =
    getItemInfo(
      item
    );


  const result =
    releaseItem(
      hand
    );


  if (
    result
  ) {

    updateHeldVisuals();

    refreshInventoryUI();

    showInventoryMessage(
      `${info.name} returned to inventory.`
    );

  }


  return result;

}


// ============================================
// PUT ITEM INTO SIDE STORAGE
// ============================================

export function storeSideItem(
  side,
  item
) {

  const info =
    getItemInfo(
      item
    );


  const result =
    putOnSide(
      side,
      item
    );


  if (
    result
  ) {

    refreshInventoryUI();

    showInventoryMessage(
      `${info.name} stored on your ${side} side.`
    );

  }


  return result;

}


// ============================================
// TAKE ITEM FROM SIDE STORAGE
// ============================================

export function retrieveSideItem(
  side
) {

  const item =
    takeFromSide(
      side
    );


  if (
    item
  ) {

    const info =
      getItemInfo(
        item
      );


    refreshInventoryUI();

    showInventoryMessage(
      `${info.name} returned to inventory.`
    );

  }


  return item;

}


// ============================================
// USE ITEM
// ============================================

export function useItem(
  item
) {

  if (
    !hasItem(
      item,
      1
    )
  ) {

    return false;

  }


  // Food

  if (
    item === "food" ||
    item === "cookedMeat"
  ) {

    removeItem(
      item,
      1
    );


    GAME.hunger =
      Math.min(
        GAME.maxHunger,
        GAME.hunger + 25
      );


    showInventoryMessage(
      "You ate some food."
    );


    refreshInventoryUI();

    return true;

  }


  // Water

  if (
    item === "water"
  ) {

    removeItem(
      item,
      1
    );


    GAME.thirst =
      Math.min(
        GAME.maxThirst,
        GAME.thirst + 35
      );


    showInventoryMessage(
      "You drank some water."
    );


    refreshInventoryUI();

    return true;

  }


  showInventoryMessage(
    `${getItemInfo(item).name} cannot be used yet.`
  );


  return false;

}


// ============================================
// CREATE INVENTORY UI
// ============================================

export function createInventoryUI() {

  if (
    document.getElementById(
      "inventory"
    )
  ) {

    inventoryElement =
      document.getElementById(
        "inventory"
      );

    inventoryPanel =
      inventoryElement.querySelector(
        ".inventory-panel"
      );

    inventoryGrid =
      inventoryElement.querySelector(
        ".inventory-grid"
      );

    return;

  }


  inventoryElement =
    document.createElement(
      "div"
    );


  inventoryElement.id =
    "inventory";


  inventoryElement.innerHTML = `

    <div class="inventory-panel">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:20px;
        "
      >

        <div>

          <h2
            style="
              font-size:26px;
              margin-bottom:5px;
            "
          >
            Inventory
          </h2>

          <div
            style="
              font-size:12px;
              opacity:.55;
            "
          >
            Your collected survival items
          </div>

        </div>

        <button
          id="inventoryClose"
          class="ui-button"
        >
          CLOSE
        </button>

      </div>


      <div
        id="inventorySideStorage"
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          margin-bottom:18px;
        "
      ></div>


      <div
        id="inventoryHeldItems"
        style="
          margin-bottom:18px;
        "
      ></div>


      <div
        class="inventory-grid"
      ></div>

    </div>

  `;


  document.body.appendChild(
    inventoryElement
  );


  inventoryPanel =
    inventoryElement.querySelector(
      ".inventory-panel"
    );


  inventoryGrid =
    inventoryElement.querySelector(
      ".inventory-grid"
    );


  sideStorageElement =
    inventoryElement.querySelector(
      "#inventorySideStorage"
    );


  heldItemsElement =
    inventoryElement.querySelector(
      "#inventoryHeldItems"
    );


  inventoryElement
    .querySelector(
      "#inventoryClose"
    )
    .addEventListener(
      "click",
      () => {

        closeInventory();

      }
    );


  inventoryElement.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        inventoryElement
      ) {

        closeInventory();

      }

    }
  );


  inventoryState.initialized =
    true;


  refreshInventoryUI();

}


// ============================================
// CREATE INVENTORY SLOT
// ============================================

function createSlot(
  item,
  amount
) {

  const info =
    getItemInfo(
      item
    );


  const slot =
    document.createElement(
      "div"
    );


  slot.className =
    "inventory-slot";


  slot.dataset.item =
    item;


  slot.innerHTML = `

    <div
      class="icon"
    >
      ${info.icon}
    </div>

    <div
      class="name"
    >
      ${info.name}
    </div>

    <div
      class="amount"
    >
    ×${amount}
    </div>

  `;


  slot.addEventListener(
    "click",
    () => {

      inventoryState.selectedSlot =
        item;


      handleItemClick(
        item
      );

    }
  );


  slot.addEventListener(
    "contextmenu",
    event => {

      event.preventDefault();

      handleItemUse(
        item
      );

    }
  );


  return slot;

}


// ============================================
// REFRESH INVENTORY
// ============================================

export function refreshInventoryUI() {

  if (
    !inventoryState.initialized
  ) {

    return;

  }


  if (
    !inventoryGrid
  ) {

    return;

  }


  inventoryGrid.innerHTML =
    "";


  const items =
    getStoredItems();


  if (
    items.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.style.gridColumn =
      "1 / -1";


    empty.style.textAlign =
      "center";


    empty.style.padding =
      "40px 10px";


    empty.style.opacity =
      "0.45";


    empty.textContent =
      "Your inventory is empty.";


    inventoryGrid.appendChild(
      empty
    );

  } else {

    for (
      const entry
      of items
    ) {

      const slot =
        createSlot(
          entry.item,
          entry.amount
        );


      inventoryGrid.appendChild(
        slot
      );

    }

  }


  updateSideStorageUI();

  updateHeldVisuals();

}


// ============================================
// SIDE STORAGE UI
// ============================================

function updateSideStorageUI() {

  if (
    !sideStorageElement
  ) {

    return;

  }


  const left =
    GAME.equipment.leftSide;


  const right =
    GAME.equipment.rightSide;


  sideStorageElement.innerHTML = `

    ${createSideSlot(
      "left",
      left
    )}

    ${createSideSlot(
      "right",
      right
    )}

  `;


  const leftButton =
    sideStorageElement.querySelector(
      '[data-side="left"]'
    );


  const rightButton =
    sideStorageElement.querySelector(
      '[data-side="right"]'
    );


  if (
    leftButton
  ) {

    leftButton.addEventListener(
      "click",
      () => {

        retrieveSideItem(
          "left"
        );

      }
    );

  }


  if (
    rightButton
  ) {

    rightButton.addEventListener(
      "click",
      () => {

        retrieveSideItem(
          "right"
        );

      }
    );

  }

}


// ============================================
// CREATE SIDE SLOT
// ============================================

function createSideSlot(
  side,
  item
) {

  if (
    item
  ) {

    const info =
      getItemInfo(
        item
      );


    return `

      <button
        class="inventory-slot"
        data-side="${side}"
        style="
          min-height:70px;
          cursor:pointer;
        "
      >

        <div
          style="
            font-size:11px;
            opacity:.5;
            text-transform:uppercase;
          "
        >
          ${side} side
        </div>

        <div
          style="
            font-size:25px;
          "
        >
          ${info.icon}
        </div>

        <div
          style="
            font-size:12px;
          "
        >
          ${info.name}
        </div>

      </button>

    `;

  }


  return `

    <button
      class="inventory-slot"
      data-side="${side}"
      style="
        min-height:70px;
        cursor:pointer;
      "
    >

      <div
        style="
          font-size:11px;
          opacity:.5;
          text-transform:uppercase;
        "
      >
        ${side} side
      </div>

      <div
        style="
          font-size:22px;
          opacity:.35;
        "
      >
        +
      </div>

      <div
        style="
          font-size:11px;
          opacity:.4;
        "
      >
        Empty
      </div>

    </button>

  `;

}


// ============================================
// HELD ITEMS UI
// ============================================

function updateHeldVisuals() {

  if (
    !heldItemsElement
  ) {

    return;

  }


  const left =
    getHeldItem(
      "left"
    );


  const right =
    getHeldItem(
      "right"
    );


  heldItemsElement.innerHTML = `

    <div
      style="
        display:flex;
        gap:8px;
      "
    >

      ${createHeldSlot(
        "left",
        left
      )}

      ${createHeldSlot(
        "right",
        right
      )}

    </div>

  `;


  const leftButton =
    heldItemsElement.querySelector(
      '[data-held="left"]'
    );


  const rightButton =
    heldItemsElement.querySelector(
      '[data-held="right"]'
    );


  if (
    leftButton
  ) {

    leftButton.addEventListener(
      "click",
      () => {

        unequipItem(
          "left"
        );

      }
    );

  }


  if (
    rightButton
  ) {

    rightButton.addEventListener(
      "click",
      () => {

        unequipItem(
          "right"
        );

      }
    );

  }

}


// ============================================
// HELD SLOT
// ============================================

function createHeldSlot(
  hand,
  item
) {

  if (
    item
  ) {

    const info =
      getItemInfo(
        item
      );


    return `

      <button
        data-held="${hand}"
        class="inventory-slot"
        style="
          flex:1;
          min-height:64px;
          cursor:pointer;
        "
      >

        <div
          style="
            font-size:10px;
            opacity:.5;
            text-transform:uppercase;
          "
        >
          ${hand} hand
        </div>

        <div
          style="
            font-size:23px;
          "
        >
          ${info.icon}
        </div>

        <div
          style="
            font-size:11px;
          "
        >
          ${info.name}
        </div>

      </button>

    `;

  }


  return `

    <div
      class="inventory-slot"
      style="
        flex:1;
        min-height:64px;
        opacity:.5;
      "
    >

      <div
        style="
          font-size:10px;
          text-transform:uppercase;
        "
      >
        ${hand} hand
      </div>

      <div
        style="
          font-size:11px;
        "
      >
        Empty
      </div>

    </div>

  `;

}


// ============================================
// ITEM CLICK
// ============================================

function handleItemClick(
  item
) {

  const info =
    getItemInfo(
      item
    );


  if (
    info.holdable
  ) {

    // Prefer empty hand

    if (
      !getHeldItem(
        "right"
      )
    ) {

      equipItem(
        item,
        "right"
      );

      return;

    }


    if (
      !getHeldItem(
        "left"
      )
    ) {

      equipItem(
        item,
        "left"
      );

      return;

    }

  }


  if (
    info.usable
  ) {

    useItem(
      item
    );

  }

}


// ============================================
// RIGHT CLICK / LONG PRESS
// ============================================

function handleItemUse(
  item
) {

  useItem(
    item
  );

}


// ============================================
// OPEN INVENTORY
// ============================================

export function openInventory() {

  createInventoryUI();


  inventoryState.open =
    true;


  inventoryElement.classList.add(
    "active"
  );


  refreshInventoryUI();


  window.dispatchEvent(
    new CustomEvent(
      "survival-inventory-opened"
    )
  );

}


// ============================================
// CLOSE INVENTORY
// ============================================

export function closeInventory() {

  if (
    !inventoryElement
  ) {

    return;

  }


  inventoryState.open =
    false;


  inventoryElement.classList.remove(
    "active"
  );


  window.dispatchEvent(
    new CustomEvent(
      "survival-inventory-closed"
    )
  );

}


// ============================================
// TOGGLE INVENTORY
// ============================================

export function toggleInventory() {

  if (
    inventoryState.open
  ) {

    closeInventory();

  } else {

    openInventory();

  }

}


// ============================================
// CHECK OPEN
// ============================================

export function isInventoryOpen() {

  return inventoryState.open;

}


// ============================================
// INVENTORY MESSAGE
// ============================================

function showInventoryMessage(
  message
) {

  const element =
    document.getElementById(
      "message"
    );


  if (
    !element
  ) {

    return;

  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    element._inventoryMessageTimer
  );


  element._inventoryMessageTimer =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      1800
    );

}


// ============================================
// KEYBOARD INVENTORY
// ============================================

window.addEventListener(
  "keydown",
  event => {

    if (
      event.key.toLowerCase() ===
      "i"
    ) {

      toggleInventory();

    }


    if (
      event.key ===
      "Escape"
    ) {

      if (
        inventoryState.open
      ) {

        closeInventory();

      }

    }

  }
);


// ============================================
// GAME EVENTS
// ============================================

window.addEventListener(
  "survival-inventory-changed",
  () => {

    refreshInventoryUI();

  }
);


window.addEventListener(
  "survival-item-held",
  () => {

    refreshInventoryUI();

  }
);


window.addEventListener(
  "survival-item-released",
  () => {

    refreshInventoryUI();

  }
);


window.addEventListener(
  "survival-side-storage-changed",
  () => {

    refreshInventoryUI();

  }
);


// ============================================
// CONNECT TO GLOBAL SURVIVALVR
// ============================================

function connectToGame() {

  if (
    !window.SurvivalVR
  ) {

    setTimeout(
      connectToGame,
      100
    );

    return;

  }


  window.SurvivalVR.systems.inventory = {

    version:
      INVENTORY_VERSION,

    items:
      ITEMS,

    open:
      openInventory,

    close:
      closeInventory,

    toggle:
      toggleInventory,

    isOpen:
      isInventoryOpen,

    getInventory,

    getStoredItems,

    countItem,

    giveItem,

    takeItem,

    equipItem,

    unequipItem,

    storeSideItem,

    retrieveSideItem,

    useItem,

    refresh:
      refreshInventoryUI

  };


  createInventoryUI();


  console.log(
    "🎒 Inventory system connected."
  );

}


// ============================================
// START SYSTEM
// ============================================

connectToGame();


// ============================================
// PUBLIC EXPORT
// ============================================

export default {

  version:
    INVENTORY_VERSION,

  items:
    ITEMS,

  open:
    openInventory,

  close:
    closeInventory,

  toggle:
    toggleInventory,

  getInventory,

  getStoredItems,

  countItem,

  giveItem,

  takeItem,

  equipItem,

  unequipItem,

  storeSideItem,

  retrieveSideItem,

  useItem

};
