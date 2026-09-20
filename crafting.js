/*
==========================================================
ISLAND SURVIVAL VR
CRAFTING SYSTEM
==========================================================

This file connects to:

- game.js
- inventory.js
- index.html
- future building.js
- future guide.js
- future world.js

DO NOT replace game.js when adding this file.

==========================================================
*/

import {
  GAME,
  addItem,
  removeItem,
  hasItem,
  getItemCount,
  unlockRecipe,
  recipeUnlocked,
  gameEvent
} from "./game.js";

/* ========================================================
   CRAFTING VERSION
======================================================== */

export const CRAFTING_VERSION = 1;


/* ========================================================
   RECIPE DATABASE
======================================================== */

export const RECIPES = {

  string: {
    id: "string",
    name: "String",
    description: "Basic fiber twisted into useful string.",
    category: "basic",

    ingredients: {
      fiber: 3
    },

    output: {
      string: 1
    },

    unlocked: true
  },


  stick: {
    id: "stick",
    name: "Stick",
    description: "A simple wooden stick.",
    category: "basic",

    ingredients: {
      wood: 1
    },

    output: {
      stick: 2
    },

    unlocked: true
  },


  woodPlank: {
    id: "woodPlank",
    name: "Wood Plank",
    description: "Processed wood used for crafting and building.",
    category: "wood",

    ingredients: {
      log: 1
    },

    output: {
      wood: 4
    },

    unlocked: true
  },


  stone: {
    id: "stone",
    name: "Stone",
    description: "Break down a rock into usable stone.",
    category: "stone",

    ingredients: {
      rock: 1
    },

    output: {
      stone: 3
    },

    unlocked: true
  },


  rope: {
    id: "rope",
    name: "Rope",
    description: "Stronger material made from twisted string.",
    category: "basic",

    ingredients: {
      string: 3
    },

    output: {
      string: 5
    },

    unlocked: false
  },


  stoneAxe: {
    id: "stoneAxe",
    name: "Stone Axe",
    description: "A basic tool for gathering wood.",
    category: "tools",

    ingredients: {
      stick: 2,
      stone: 2,
      string: 1
    },

    output: {
      stoneAxe: 1
    },

    unlocked: false
  },


  stonePickaxe: {
    id: "stonePickaxe",
    name: "Stone Pickaxe",
    description: "A basic tool for gathering stone.",
    category: "tools",

    ingredients: {
      stick: 2,
      stone: 3,
      string: 1
    },

    output: {
      stonePickaxe: 1
    },

    unlocked: false
  },


  campfire: {
    id: "campfire",
    name: "Campfire",
    description: "A small survival campfire.",
    category: "survival",

    ingredients: {
      stone: 6,
      wood: 3
    },

    output: {
      campfire: 1
    },

    unlocked: false
  },


  storageBox: {
    id: "storageBox",
    name: "Storage Box",
    description: "A box for storing extra items.",
    category: "building",

    ingredients: {
      wood: 8,
      string: 2
    },

    output: {
      storageBox: 1
    },

    unlocked: false
  },


  woodWall: {
    id: "woodWall",
    name: "Wood Wall",
    description: "A simple wooden wall.",
    category: "building",

    ingredients: {
      wood: 6
    },

    output: {
      woodWall: 1
    },

    unlocked: false
  },


  woodFloor: {
    id: "woodFloor",
    name: "Wood Floor",
    description: "A wooden floor foundation.",
    category: "building",

    ingredients: {
      wood: 5
    },

    output: {
      woodFloor: 1
    },

    unlocked: false
  },


  woodDoor: {
    id: "woodDoor",
    name: "Wood Door",
    description: "A simple wooden door.",
    category: "building",

    ingredients: {
      wood: 8,
      string: 2
    },

    output: {
      woodDoor: 1
    },

    unlocked: false
  }

};


/* ========================================================
   CRAFTING STATE
======================================================== */

const craftingState = {

  open: false,

  selectedCategory: "all",

  selectedRecipe: null,

  categories: [
    "all",
    "basic",
    "wood",
    "stone",
    "tools",
    "survival",
    "building"
  ],

  craftedCount: {},

  lastCrafted: null

};


/* ========================================================
   REGISTER SYSTEM
======================================================== */

if (
  window.SurvivalVR &&
  window.SurvivalVR.systems
) {
  window.SurvivalVR.systems.crafting = {
    version: CRAFTING_VERSION,

    recipes: RECIPES,

    state: craftingState,

    open: openCrafting,

    close: closeCrafting,

    toggle: toggleCrafting,

    craft: craft,

    canCraft: canCraft,

    getRecipe: getRecipe,

    getRecipes: getRecipes,

    unlock: unlockCraftingRecipe,

    isUnlocked: isRecipeUnlocked
  };
}


/* ========================================================
   RECIPE HELPERS
======================================================== */

export function getRecipe(recipeId) {

  return RECIPES[recipeId] || null;

}


export function getRecipes() {

  return Object.values(RECIPES);

}


export function isRecipeUnlocked(recipeId) {

  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return false;
  }

  if (recipe.unlocked) {
    return true;
  }

  return recipeUnlocked(recipeId);

}


export function unlockCraftingRecipe(recipeId) {

  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return false;
  }

  unlockRecipe(recipeId);

  renderCraftingMenu();

  return true;

}


/* ========================================================
   INGREDIENT CHECKING
======================================================== */

export function canCraft(recipeId) {

  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return false;
  }

  if (!isRecipeUnlocked(recipeId)) {
    return false;
  }

  for (
    const [item, amount] of
    Object.entries(recipe.ingredients)
  ) {

    if (
      getItemCount(item) < amount
    ) {
      return false;
    }

  }

  return true;

}


/* ========================================================
   CRAFT ITEM
======================================================== */

export function craft(recipeId) {

  const recipe = getRecipe(recipeId);

  if (!recipe) {

    showCraftMessage(
      "Recipe not found."
    );

    return false;

  }


  if (!isRecipeUnlocked(recipeId)) {

    showCraftMessage(
      `${recipe.name} is locked.`
    );

    return false;

  }


  if (!canCraft(recipeId)) {

    showCraftMessage(
      `You don't have enough materials for ${recipe.name}.`
    );

    return false;

  }


  /*
  ------------------------------------------
  Remove ingredients
  ------------------------------------------
  */

  for (
    const [item, amount] of
    Object.entries(recipe.ingredients)
  ) {

    removeItem(
      item,
      amount
    );

  }


  /*
  ------------------------------------------
  Give output
  ------------------------------------------
  */

  for (
    const [item, amount] of
    Object.entries(recipe.output)
  ) {

    addItem(
      item,
      amount
    );

  }


  /*
  ------------------------------------------
  Track crafting
  ------------------------------------------
  */

  if (
    !craftingState.craftedCount[recipeId]
  ) {

    craftingState.craftedCount[recipeId] = 0;

  }

  craftingState.craftedCount[recipeId] += 1;

  craftingState.lastCrafted = recipeId;


  /*
  ------------------------------------------
  Game event
  ------------------------------------------
  */

  gameEvent(
    "crafted",
    {
      recipe: recipeId,
      name: recipe.name,
      ingredients: recipe.ingredients,
      output: recipe.output
    }
  );


  /*
  ------------------------------------------
  Special connections
  ------------------------------------------
  */

  if (
    recipe.category === "building"
  ) {

    window.dispatchEvent(
      new CustomEvent(
        "survival-building-material-crafted",
        {
          detail: {
            recipe: recipeId,
            output: recipe.output
          }
        }
      )
    );

  }


  if (
    recipe.category === "tools"
  ) {

    window.dispatchEvent(
      new CustomEvent(
        "survival-tool-crafted",
        {
          detail: {
            recipe: recipeId,
            output: recipe.output
          }
        }
      )
    );

  }


  showCraftMessage(
    `Crafted ${recipe.name}!`
  );


  renderCraftingMenu();


  return true;

}


/* ========================================================
   OPEN / CLOSE
======================================================== */

export function openCrafting() {

  craftingState.open = true;

  let menu =
    document.getElementById(
      "craftingMenu"
    );

  if (!menu) {
    createCraftingUI();
  }

  renderCraftingMenu();

}


export function closeCrafting() {

  craftingState.open = false;

  const menu =
    document.getElementById(
      "craftingMenu"
    );

  if (menu) {
    menu.classList.remove(
      "visible"
    );
  }

}


export function toggleCrafting() {

  if (craftingState.open) {
    closeCrafting();
  } else {
    openCrafting();
  }

}


/* ========================================================
   CREATE UI
======================================================== */

function createCraftingUI() {

  if (
    document.getElementById(
      "craftingMenu"
    )
  ) {
    return;
  }


  const menu =
    document.createElement(
      "div"
    );

  menu.id = "craftingMenu";

  menu.innerHTML = `

    <div class="crafting-window">

      <div class="crafting-header">

        <div>
          <div class="crafting-title">
            CRAFTING
          </div>

          <div class="crafting-subtitle">
            Create tools, materials and survival items
          </div>
        </div>

        <button
          id="closeCrafting"
          class="crafting-close"
        >
          ×
        </button>

      </div>


      <div
        id="craftingCategories"
        class="crafting-categories"
      ></div>


      <div
        id="craftingRecipes"
        class="crafting-recipes"
      ></div>


      <div
        id="craftingDetails"
        class="crafting-details"
      >

        <div class="crafting-empty">

          Select a recipe to see
          what you need.

        </div>

      </div>

    </div>

  `;


  document.body.appendChild(
    menu
  );


  document
    .getElementById(
      "closeCrafting"
    )
    .addEventListener(
      "click",
      closeCrafting
    );


  menu.addEventListener(
    "click",
    event => {

      if (
        event.target === menu
      ) {

        closeCrafting();

      }

    }
  );

}


/* ========================================================
   RENDER MENU
======================================================== */

function renderCraftingMenu() {

  const menu =
    document.getElementById(
      "craftingMenu"
    );

  if (!menu) {
    return;
  }


  menu.classList.add(
    "visible"
  );


  renderCategories();

  renderRecipes();

  renderRecipeDetails();

}


/* ========================================================
   CATEGORY BUTTONS
======================================================== */

function renderCategories() {

  const container =
    document.getElementById(
      "craftingCategories"
    );

  if (!container) {
    return;
  }


  container.innerHTML = "";


  craftingState.categories.forEach(
    category => {

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "crafting-category";


      if (
        craftingState.selectedCategory ===
        category
      ) {

        button.classList.add(
          "active"
        );

      }


      button.textContent =
        category === "all"
          ? "All"
          : capitalize(category);


      button.addEventListener(
        "click",
        () => {

          craftingState.selectedCategory =
            category;

          renderCraftingMenu();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* ========================================================
   RECIPE LIST
======================================================== */

function renderRecipes() {

  const container =
    document.getElementById(
      "craftingRecipes"
    );

  if (!container) {
    return;
  }


  container.innerHTML = "";


  let recipes =
    getRecipes();


  if (
    craftingState.selectedCategory !==
    "all"
  ) {

    recipes =
      recipes.filter(
        recipe =>
          recipe.category ===
          craftingState.selectedCategory
      );

  }


  recipes.forEach(
    recipe => {

      const unlocked =
        isRecipeUnlocked(
          recipe.id
        );


      const button =
        document.createElement(
          "button"
        );

      button.className =
        "crafting-recipe";


      if (
        craftingState.selectedRecipe ===
        recipe.id
      ) {

        button.classList.add(
          "selected"
        );

      }


      if (!unlocked) {

        button.classList.add(
          "locked"
        );

      }


      const craftable =
        canCraft(
          recipe.id
        );


      if (craftable) {

        button.classList.add(
          "craftable"
        );

      }


      button.innerHTML = `

        <div class="recipe-icon">
          ${getRecipeIcon(recipe.id)}
        </div>

        <div class="recipe-info">

          <div class="recipe-name">
            ${
              unlocked
                ? recipe.name
                : "Locked"
            }
          </div>

          <div class="recipe-category">
            ${
              capitalize(
                recipe.category
              )
            }
          </div>

        </div>

        <div class="recipe-arrow">
          ›
        </div>

      `;


      button.addEventListener(
        "click",
        () => {

          craftingState.selectedRecipe =
            recipe.id;

          renderCraftingMenu();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* ========================================================
   RECIPE DETAILS
======================================================== */

function renderRecipeDetails() {

  const container =
    document.getElementById(
      "craftingDetails"
    );

  if (!container) {
    return;
  }


  const recipe =
    getRecipe(
      craftingState.selectedRecipe
    );


  if (!recipe) {

    container.innerHTML = `

      <div class="crafting-empty">

        Select a recipe to see
        what you need.

      </div>

    `;

    return;

  }


  const unlocked =
    isRecipeUnlocked(
      recipe.id
    );


  if (!unlocked) {

    container.innerHTML = `

      <div class="recipe-detail-title">
        🔒 Locked Recipe
      </div>

      <div class="recipe-detail-name">
        ${recipe.name}
      </div>

      <div class="recipe-detail-description">
        ${recipe.description}
      </div>

      <div class="recipe-locked">
        Find this recipe through
        exploration and the survival guide.
      </div>

    `;

    return;

  }


  const ingredientHTML =
    Object.entries(
      recipe.ingredients
    )
    .map(
      ([item, amount]) => {

        const current =
          getItemCount(item);

        const enough =
          current >= amount;


        return `

          <div
            class="ingredient ${
              enough
                ? "enough"
                : "missing"
            }"
          >

            <span>
              ${getItemIcon(item)}
              ${getItemName(item)}
            </span>

            <span>
              ${current} / ${amount}
            </span>

          </div>

        `;

      }
    )
    .join("");


  const outputHTML =
    Object.entries(
      recipe.output
    )
    .map(
      ([item, amount]) => `

        <div class="output-item">

          ${getItemIcon(item)}

          ${getItemName(item)}

          ×${amount}

        </div>

      `
    )
    .join("");


  const craftable =
    canCraft(
      recipe.id
    );


  container.innerHTML = `

    <div class="recipe-detail-title">
      ${getRecipeIcon(recipe.id)}
      ${recipe.name}
    </div>


    <div class="recipe-detail-description">
      ${recipe.description}
    </div>


    <div class="detail-section">

      <div class="detail-heading">
        MATERIALS
      </div>

      <div class="ingredients-list">

        ${ingredientHTML}

      </div>

    </div>


    <div class="detail-section">

      <div class="detail-heading">
        CREATES
      </div>

      <div class="outputs-list">

        ${outputHTML}

      </div>

    </div>


    <button
      id="craftSelected"
      class="craft-button"
      ${craftable ? "" : "disabled"}
    >

      ${
        craftable
          ? `CRAFT ${recipe.name.toUpperCase()}`
          : "MISSING MATERIALS"
      }

    </button>

  `;


  const craftButton =
    document.getElementById(
      "craftSelected"
    );


  if (craftButton) {

    craftButton.addEventListener(
      "click",
      () => {

        craft(
          recipe.id
        );

      }
    );

  }

}


/* ========================================================
   ITEM NAMES
======================================================== */

function getItemName(item) {

  const names = {

    rock: "Rock",

    stone: "Stone",

    log: "Log",

    wood: "Wood",

    stick: "Stick",

    fiber: "Fiber",

    string: "String",

    leaf: "Leaf",

    food: "Food",

    water: "Water",

    rawMeat: "Raw Meat",

    cookedMeat: "Cooked Meat",

    stoneAxe: "Stone Axe",

    stonePickaxe: "Stone Pickaxe",

    campfire: "Campfire",

    storageBox: "Storage Box",

    woodWall: "Wood Wall",

    woodFloor: "Wood Floor",

    woodDoor: "Wood Door"

  };


  return (
    names[item] ||
    capitalize(item)
  );

}


/* ========================================================
   ITEM ICONS
======================================================== */

function getItemIcon(item) {

  const icons = {

    rock: "🪨",

    stone: "🪨",

    log: "🪵",

    wood: "🪵",

    stick: "🪵",

    fiber: "🌿",

    string: "🧵",

    leaf: "🍃",

    food: "🍎",

    water: "💧",

    rawMeat: "🥩",

    cookedMeat: "🍖",

    stoneAxe: "🪓",

    stonePickaxe: "⛏️",

    campfire: "🔥",

    storageBox: "📦",

    woodWall: "🧱",

    woodFloor: "🪵",

    woodDoor: "🚪"

  };


  return icons[item] || "📦";

}


/* ========================================================
   RECIPE ICONS
======================================================== */

function getRecipeIcon(recipeId) {

  const icons = {

    string: "🧵",

    stick: "🪵",

    woodPlank: "🪵",

    stone: "🪨",

    rope: "🧵",

    stoneAxe: "🪓",

    stonePickaxe: "⛏️",

    campfire: "🔥",

    storageBox: "📦",

    woodWall: "🧱",

    woodFloor: "🪵",

    woodDoor: "🚪"

  };


  return icons[recipeId] || "🔨";

}


/* ========================================================
   MESSAGE
======================================================== */

function showCraftMessage(
  message
) {

  const messageElement =
    document.getElementById(
      "message"
    );


  if (messageElement) {

    messageElement.textContent =
      message;

    messageElement.classList.add(
      "show"
    );


    clearTimeout(
      showCraftMessage.timeout
    );


    showCraftMessage.timeout =
      setTimeout(
        () => {

          messageElement.classList.remove(
            "show"
          );

        },
        2200
      );

  }


  window.dispatchEvent(
    new CustomEvent(
      "survival-crafting-message",
      {
        detail: {
          message
        }
      }
    )
  );

}


/* ========================================================
   KEYBOARD SUPPORT
======================================================== */

window.addEventListener(
  "keydown",
  event => {

    /*
    C = Crafting
    */

    if (
      event.key.toLowerCase() === "c" &&
      !isTyping()
    ) {

      toggleCrafting();

    }


    /*
    ESC = close
    */

    if (
      event.key === "Escape"
    ) {

      closeCrafting();

    }

  }
);


/* ========================================================
   INVENTORY UPDATE CONNECTION
======================================================== */

window.addEventListener(
  "survival-inventory-changed",
  () => {

    if (
      craftingState.open
    ) {

      renderCraftingMenu();

    }

  }
);


/* ========================================================
   GAME EVENT CONNECTION
======================================================== */

window.addEventListener(
  "survival-recipe-unlocked",
  event => {

    if (
      !event.detail
    ) {
      return;
    }


    renderCraftingMenu();

  }
);


/* ========================================================
   INPUT SAFETY
======================================================== */

function isTyping() {

  const active =
    document.activeElement;

  if (!active) {
    return false;
  }


  const tag =
    active.tagName.toLowerCase();


  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select"
  );

}


/* ========================================================
   TEXT HELPER
======================================================== */

function capitalize(
  value
) {

  if (!value) {
    return "";
  }


  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


/* ========================================================
   DEFAULT RECIPE UNLOCKS
======================================================== */

/*
These are intentionally unlocked later
through the guide/exploration system.

The two basic recipes already work immediately.
*/

console.log(
  "🔨 Crafting system loaded."
);

console.log(
  `📋 ${Object.keys(RECIPES).length} recipes registered.`
);