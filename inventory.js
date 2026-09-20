/* =========================================================
   INVENTORY.JS
   Island Survival VR inventory + two side storage slots
========================================================= */

import {
  GAME,
  addItem,
  removeItem,
  getItemCount,
  putOnSide,
  takeFromSide,
  holdItem,
  releaseItem,
  getHeldItem,
  eatFood,
  drinkWater,
  gameEvent
} from "./game.js";

const SurvivalVR = window.SurvivalVR;


/* =========================================================
   ITEM DEFINITIONS
========================================================= */

export const ITEMS = {

  rock: {
    name: "Rock",
    icon: "🪨",
    category: "resource"
  },

  stone: {
    name: "Stone",
    icon: "⬜",
    category: "resource"
  },

  wood: {
    name: "Wood",
    icon: "🪵",
    category: "resource"
  },

  log: {
    name: "Log",
    icon: "🌲",
    category: "resource"
  },

  stick: {
    name: "Stick",
    icon: "🥢",
    category: "resource"
  },

  fiber: {
    name: "Fiber",
    icon: "🌿",
    category: "resource"
  },

  string: {
    name: "String",
    icon: "🧵",
    category: "craft"
  },

  leaf: {
    name: "Leaf",
    icon: "🍃",
    category: "resource"
  },

  food: {
    name: "Food",
    icon: "🍎",
    category: "food"
  },

  water: {
    name: "Water",
    icon: "💧",
    category: "drink"
  },

  rawMeat: {
    name: "Raw Meat",
    icon: "🥩",
    category: "food"
  },

  cookedMeat: {
    name: "Cooked Meat",
    icon: "🍖",
    category: "food"
  },

  stoneAxe: {
    name: "Stone Axe",
    icon: "🪓",
    category: "tool"
  },

  stonePickaxe: {
    name: "Stone Pickaxe",
    icon: "⛏️",
    category: "tool"
  },

  campfire: {
    name: "Campfire",
    icon: "🔥",
    category: "building"
  },

  storageBox: {
    name: "Storage Box",
    icon: "📦",
    category: "building"
  },

  woodWall: {
    name: "Wood Wall",
    icon: "🧱",
    category: "building"
  },

  woodFloor: {
    name: "Wood Floor",
    icon: "🪵",
    category: "building"
  },

  woodDoor: {
    name: "Wood Door",
    icon: "🚪",
    category: "building"
  }
};


/* =========================================================
   INVENTORY STATE
========================================================= */

const inventoryState = {

  open: false,

  selectedItem: null,

  filter: "all",

  maxSlots: 36,

  initialized: false
};


/* =========================================================
   SYSTEM OBJECT
========================================================= */

const inventorySystem = {

  state: inventoryState,

  items: ITEMS,

  open,

  close,

  toggle,

  refresh,

  selectItem,

  useItem,

  equipItem,

  storeItem,

  takeSideItem,

  getInventory,

  getSideSlots,

  getHeldItems,

  getItemDefinition
};


SurvivalVR.systems.inventory =
  inventorySystem;


/* =========================================================
   GETTERS
========================================================= */

function getInventory() {

  return GAME.inventory;
}


function getSideSlots() {

  return {
    left: GAME.equipment.leftSide,
    right: GAME.equipment.rightSide
  };
}


function getHeldItems() {

  return {
    left: getHeldItem("left"),
    right: getHeldItem("right")
  };
}


function getItemDefinition(
  itemId
) {

  return ITEMS[itemId] || null;
}


/* =========================================================
   INVENTORY UI
========================================================= */

function createUI() {

  if (
    document.getElementById(
      "inventoryUI"
    )
  ) {
    return;
  }


  const ui =
    document.createElement("div");

  ui.id =
    "inventoryUI";

  ui.className =
    "overlay hidden";


  ui.innerHTML = `

    <div class="uiPanel inventory-panel">

      <div class="uiHeader">

        <div>
          <div class="uiTitle">
            Inventory
          </div>

          <div class="uiSubtitle">
            Carry resources, tools, food, and building materials.
          </div>
        </div>

        <button
          class="closeButton"
          id="inventoryClose"
          type="button"
        >
          ×
        </button>

      </div>


      <div class="sideStorage">

        <div
          class="sideSlot"
          id="leftSideSlot"
        >
          <div class="sideSlotLabel">
            Left Side
          </div>

          <div class="sideSlotItem">
            Empty
          </div>
        </div>


        <div
          class="sideSlot"
          id="rightSideSlot"
        >
          <div class="sideSlotLabel">
            Right Side
          </div>

          <div class="sideSlotItem">
            Empty
          </div>
        </div>

      </div>


      <div
        class="inventoryToolbar"
        style="
          display:flex;
          gap:8px;
          margin-bottom:12px;
          flex-wrap:wrap;
        "
      >

        <button
          class="uiButton"
          data-filter="all"
          type="button"
          style="width:auto;"
        >
          All
        </button>

        <button
          class="uiButton"
          data-filter="resource"
          type="button"
          style="width:auto;"
        >
          Resources
        </button>

        <button
          class="uiButton"
          data-filter="food"
          type="button"
          style="width:auto;"
        >
          Food
        </button>

        <button
          class="uiButton"
          data-filter="tool"
          type="button"
          style="width:auto;"
        >
          Tools
        </button>

        <button
          class="uiButton"
          data-filter="building"
          type="button"
          style="width:auto;"
        >
          Building
        </button>

      </div>


      <div
        id="inventoryGrid"
        class="inventoryGrid"
      ></div>


      <div
        id="inventoryActions"
        style="
          display:flex;
          gap:8px;
          margin-top:15px;
          flex-wrap:wrap;
        "
      ></div>

    </div>

  `;


  document.body.appendChild(ui);


  document
    .getElementById(
      "inventoryClose"
    )
    .addEventListener(
      "click",
      close
    );


  ui
    .querySelectorAll(
      "[data-filter]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            inventoryState.filter =
              button.dataset.filter;

            refresh();

          }
        );

      }
    );


  inventoryState.initialized =
    true;
}


/* =========================================================
   OPEN
========================================================= */

function open() {

  createUI();

  inventoryState.open =
    true;


  const ui =
    document.getElementById(
      "inventoryUI"
    );

  ui.classList.remove(
    "hidden"
  );


  refresh();


  gameEvent(
    "inventory-opened"
  );
}


/* =========================================================
   CLOSE
========================================================= */

function close() {

  const ui =
    document.getElementById(
      "inventoryUI"
    );


  if (ui) {

    ui.classList.add(
      "hidden"
    );

  }


  inventoryState.open =
    false;


  inventoryState.selectedItem =
    null;


  gameEvent(
    "inventory-closed"
  );
}


/* =========================================================
   TOGGLE
========================================================= */

function toggle() {

  if (
    inventoryState.open
  ) {
    close();
  } else {
    open();
  }
}


/* =========================================================
   REFRESH
========================================================= */

function refresh() {

  createUI();


  refreshGrid();

  refreshSideSlots();

  refreshActions();
}


/* =========================================================
   INVENTORY GRID
========================================================= */

function refreshGrid() {

  const grid =
    document.getElementById(
      "inventoryGrid"
    );


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  const inventory =
    GAME.inventory;


  Object.keys(ITEMS)
    .forEach(
      itemId => {

        const item =
          ITEMS[itemId];


        const count =
          Number(
            inventory[itemId] || 0
          );


        if (count <= 0) {
          return;
        }


        if (
          inventoryState.filter !==
          "all"
        ) {

          if (
            item.category !==
            inventoryState.filter
          ) {
            return;
          }

        }


        const slot =
          document.createElement(
            "button"
          );


        slot.type =
          "button";

        slot.className =
          "inventoryItem";


        if (
          inventoryState.selectedItem ===
          itemId
        ) {

          slot.style.borderColor =
            "rgba(85,216,121,.8)";

          slot.style.background =
            "rgba(85,216,121,.12)";
        }


        slot.innerHTML = `

          <div class="inventoryItemIcon">
            ${item.icon}
          </div>

          <div class="inventoryItemName">
            ${item.name}
          </div>

          <div class="inventoryItemCount">
            ${count}
          </div>

        `;


        slot.addEventListener(
          "click",
          () => {

            selectItem(itemId);

          }
        );


        grid.appendChild(slot);

      }
    );


  if (
    grid.children.length === 0
  ) {

    grid.innerHTML = `

      <div
        style="
          grid-column:1/-1;
          padding:30px;
          text-align:center;
          color:#a9bdb1;
        "
      >
        Nothing here yet.
      </div>

    `;
  }
}


/* =========================================================
   SELECT ITEM
========================================================= */

function selectItem(
  itemId
) {

  if (
    !ITEMS[itemId]
  ) {
    return;
  }


  if (
    getItemCount(itemId) <= 0
  ) {
    return;
  }


  inventoryState.selectedItem =
    itemId;


  refresh();


  gameEvent(
    "inventory-item-selected",
    {
      itemId
    }
  );
}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function refreshActions() {

  const actions =
    document.getElementById(
      "inventoryActions"
    );


  if (!actions) {
    return;
  }


  actions.innerHTML = "";


  const itemId =
    inventoryState.selectedItem;


  if (!itemId) {

    actions.innerHTML = `
      <div
        style="
          width:100%;
          color:#a9bdb1;
          font-size:12px;
        "
      >
        Select an item to see its actions.
      </div>
    `;

    return;
  }


  const item =
    ITEMS[itemId];


  if (!item) {
    return;
  }


  const useButton =
    createActionButton(
      "Use",
      () => useItem(itemId)
    );


  const leftButton =
    createActionButton(
      "Put Left",
      () => storeItem(
        itemId,
        "left"
      )
    );


  const rightButton =
    createActionButton(
      "Put Right",
      () => storeItem(
        itemId,
        "right"
      )
    );


  const equipButton =
    createActionButton(
      "Hold",
      () => equipItem(
        itemId,
        "right"
      )
    );


  actions.appendChild(
    useButton
  );


  actions.appendChild(
    leftButton
  );


  actions.appendChild(
    rightButton
  );


  actions.appendChild(
    equipButton
  );
}


function createActionButton(
  label,
  callback
) {

  const button =
    document.createElement(
      "button"
    );


  button.className =
    "uiButton";


  button.style.width =
    "auto";


  button.style.flex =
    "1";


  button.textContent =
    label;


  button.addEventListener(
    "click",
    callback
  );


  return button;
}


/* =========================================================
   USE ITEM
========================================================= */

function useItem(
  itemId
) {

  if (
    getItemCount(itemId) <= 0
  ) {
    return false;
  }


  let used = false;


  switch (itemId) {

    case "food":

      used =
        eatFood(
          15,
          "food"
        );

      break;


    case "cookedMeat":

      used =
        eatFood(
          30,
          "cookedMeat"
        );

      break;


    case "water":

      used =
        drinkWater(
          30
        );

      break;


    default:

      gameEvent(
        "inventory-item-not-usable",
        {
          itemId
        }
      );

      return false;
  }


  if (used) {

    refresh();

  }


  return used;
}


/* =========================================================
   EQUIP / HOLD
========================================================= */

function equipItem(
  itemId,
  side = "right"
) {

  if (
    getItemCount(itemId) <= 0
  ) {
    return false;
  }


  const current =
    getHeldItem(side);


  if (current) {

    releaseItem(side);

    addItem(
      current,
      1
    );
  }


  const removed =
    removeItem(
      itemId,
      1
    );


  if (!removed) {
    return false;
  }


  holdItem(
    side,
    itemId
  );


  gameEvent(
    "inventory-item-equipped",
    {
      itemId,
      side
    }
  );


  refresh();


  return true;
}


/* =========================================================
   STORE ITEM IN SIDE SLOT
========================================================= */

function storeItem(
  itemId,
  side
) {

  if (
    side !== "left" &&
    side !== "right"
  ) {
    return false;
  }


  if (
    getItemCount(itemId) <= 0
  ) {
    return false;
  }


  const current =
    GAME.equipment[
      side + "Side"
    ];


  if (current === itemId) {

    return true;

  }


  if (current) {

    takeFromSide(side);

  }


  const removed =
    removeItem(
      itemId,
      1
    );


  if (!removed) {

    if (current) {
      putOnSide(
        side,
        current
      );
    }

    return false;
  }


  putOnSide(
    side,
    itemId
  );


  gameEvent(
    "inventory-side-updated",
    {
      side,
      itemId
    }
  );


  refresh();


  return true;
}


/* =========================================================
   TAKE FROM SIDE
========================================================= */

function takeSideItem(
  side
) {

  if (
    side !== "left" &&
    side !== "right"
  ) {
    return null;
  }


  const itemId =
    GAME.equipment[
      side + "Side"
    ];


  if (!itemId) {
    return null;
  }


  takeFromSide(
    side
  );


  addItem(
    itemId,
    1
  );


  gameEvent(
    "inventory-side-item-taken",
    {
      side,
      itemId
    }
  );


  refresh();


  return itemId;
}


/* =========================================================
   SIDE SLOT UI
========================================================= */

function refreshSideSlots() {

  const slots = {
    left:
      document.getElementById(
        "leftSideSlot"
      ),

    right:
      document.getElementById(
        "rightSideSlot"
      )
  };


  Object.entries(slots)
    .forEach(
      ([side, element]) => {

        if (!element) {
          return;
        }


        const itemId =
          GAME.equipment[
            side + "Side"
          ];


        const item =
          itemId
            ? ITEMS[itemId]
            : null;


        const itemElement =
          element.querySelector(
            ".sideSlotItem"
          );


        if (!itemElement) {
          return;
        }


        if (item) {

          itemElement.innerHTML = `

            <div
              style="
                font-size:28px;
                margin-bottom:4px;
              "
            >
              ${item.icon}
            </div>

            <div>
              ${item.name}
            </div>

            <button
              type="button"
              class="uiButton"
              style="
                width:auto;
                margin-top:8px;
                padding:7px 10px;
                font-size:11px;
              "
              data-take-side="${side}"
            >
              Take
            </button>

          `;

        } else {

          itemElement.innerHTML =
            "Empty";

        }

      }
    );


  document
    .querySelectorAll(
      "[data-take-side]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            takeSideItem(
              button.dataset.takeSide
            );

          }
        );

      }
    );
}


/* =========================================================
   INVENTORY CHANGE EVENTS
========================================================= */

window.addEventListener(
  "survival-inventory-changed",
  () => {

    if (
      inventoryState.initialized
    ) {

      refresh();

    }

  }
);


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

window.addEventListener(
  "keydown",
  event => {

    if (
      event.repeat
    ) {
      return;
    }


    if (
      event.code === "KeyI"
    ) {

      toggle();

      return;
    }


    if (
      event.code === "Escape" &&
      inventoryState.open
    ) {

      close();

    }

  }
);


/* =========================================================
   VR MENU BUTTON
========================================================= */

window.addEventListener(
  "survival-menu-button",
  () => {

    /*
      If inventory is already open,
      close it.

      The future home/settings system
      can decide what happens after that.
    */

    if (
      inventoryState.open
    ) {

      close();

    }

  }
);


/* =========================================================
   VR GRAB SUPPORT
========================================================= */

window.addEventListener(
  "survival-grab",
  event => {

    const detail =
      event.detail || {};


    if (
      !detail.pressed
    ) {
      return;
    }


    const side =
      detail.side;


    /*
      If the player has something in
      their side slot, grabbing can
      bring it into the hand.
    */

    const sideKey =
      side + "Side";


    const sideItem =
      GAME.equipment[
        sideKey
      ];


    if (
      sideItem &&
      !getHeldItem(side)
    ) {

      takeFromSide(
        side
      );


      holdItem(
        side,
        sideItem
      );


      gameEvent(
        "inventory-vr-equipped",
        {
          side,
          itemId: sideItem
        }
      );


      refresh();

    }

  }
);


/* =========================================================
   INITIALIZATION
========================================================= */

createUI();


console.log(
  "[Inventory] Inventory system loaded."
);


/* =========================================================
   EXPORTS
========================================================= */

export {
  inventorySystem,
  open,
  close,
  toggle,
  refresh,
  selectItem,
  useItem,
  equipItem,
  storeItem,
  takeSideItem,
  getInventory,
  getSideSlots,
  getHeldItems,
  getItemDefinition
};