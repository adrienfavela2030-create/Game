/* =========================================================
   CRAFTING.JS
   Island Survival VR crafting system
========================================================= */

import {
  GAME,
  addItem,
  removeItem,
  getItemCount,
  registerCraft,
  gameEvent,
  recipeUnlocked,
  unlockRecipe
} from "./game.js";

import {
  ITEMS
} from "./inventory.js";


const SurvivalVR =
  window.SurvivalVR;


/* =========================================================
   RECIPES
========================================================= */

export const RECIPES = {

  string: {
    id: "string",
    name: "String",
    icon: "🧵",

    ingredients: {
      fiber: 3
    },

    output: {
      string: 1
    },

    category: "basic",

    unlocked: true,

    description:
      "Twist plant fiber together to make strong string."
  },


  stick: {
    id: "stick",
    name: "Sticks",
    icon: "🥢",

    ingredients: {
      wood: 1
    },

    output: {
      stick: 2
    },

    category: "basic",

    unlocked: true,

    description:
      "Split wood into smaller sticks."
  },


  woodPlank: {
    id: "woodPlank",
    name: "Wood Planks",
    icon: "🪵",

    ingredients: {
      log: 1
    },

    output: {
      wood: 4
    },

    category: "wood",

    unlocked: true,

    description:
      "Process a log into usable building wood."
  },


  stone: {
    id: "stone",
    name: "Stone Pieces",
    icon: "⬜",

    ingredients: {
      rock: 1
    },

    output: {
      stone: 3
    },

    category: "stone",

    unlocked: true,

    description:
      "Break a rock into smaller pieces."
  },


  rope: {
    id: "rope",
    name: "Rope",
    icon: "🪢",

    ingredients: {
      string: 3
    },

    output: {
      string: 5
    },

    category: "advanced",

    unlocked: false,

    description:
      "Combine string into a stronger bundle."
  },


  stoneAxe: {
    id: "stoneAxe",
    name: "Stone Axe",
    icon: "🪓",

    ingredients: {
      stick: 2,
      stone: 2,
      string: 1
    },

    output: {
      stoneAxe: 1
    },

    category: "tools",

    unlocked: false,

    description:
      "A basic tool for chopping trees."
  },


  stonePickaxe: {
    id: "stonePickaxe",
    name: "Stone Pickaxe",
    icon: "⛏️",

    ingredients: {
      stick: 2,
      stone: 3,
      string: 1
    },

    output: {
      stonePickaxe: 1
    },

    category: "tools",

    unlocked: false,

    description:
      "A basic tool for breaking rocks."
  },


  campfire: {
    id: "campfire",
    name: "Campfire",
    icon: "🔥",

    ingredients: {
      stone: 6,
      wood: 3
    },

    output: {
      campfire: 1
    },

    category: "survival",

    unlocked: false,

    description:
      "Provides warmth and lets you cook food."
  },


  storageBox: {
    id: "storageBox",
    name: "Storage Box",
    icon: "📦",

    ingredients: {
      wood: 8,
      string: 2
    },

    output: {
      storageBox: 1
    },

    category: "building",

    unlocked: false,

    description:
      "A container for storing extra resources."
  },


  woodFloor: {
    id: "woodFloor",
    name: "Wood Floor",
    icon: "🪵",

    ingredients: {
      wood: 5
    },

    output: {
      woodFloor: 1
    },

    category: "building",

    unlocked: false,

    description:
      "A wooden floor piece for your shelter."
  },


  woodWall: {
    id: "woodWall",
    name: "Wood Wall",
    icon: "🧱",

    ingredients: {
      wood: 6
    },

    output: {
      woodWall: 1
    },

    category: "building",

    unlocked: false,

    description:
      "A wooden wall for protecting your shelter."
  },


  woodDoor: {
    id: "woodDoor",
    name: "Wood Door",
    icon: "🚪",

    ingredients: {
      wood: 8,
      string: 2
    },

    output: {
      woodDoor: 1
    },

    category: "building",

    unlocked: false,

    description:
      "A wooden doorway for your shelter."
  }

};


/* =========================================================
   CRAFTING STATE
========================================================= */

const craftingState = {

  open: false,

  selectedRecipe: null,

  category: "all",

  initialized: false
};


/* =========================================================
   SYSTEM
========================================================= */

const craftingSystem = {

  recipes: RECIPES,

  state: craftingState,

  open,

  close,

  toggle,

  refresh,

  craft,

  canCraft,

  unlock,

  selectRecipe,

  getRecipe,

  getRecipes
};


SurvivalVR.systems.crafting =
  craftingSystem;


/* =========================================================
   REGISTER RECIPES
========================================================= */

Object.values(
  RECIPES
).forEach(
  recipe => {

    registerCraft(
      recipe.id,
      recipe
    );

  }
);


/* =========================================================
   INITIAL RECIPE UNLOCKS
========================================================= */

Object.values(
  RECIPES
).forEach(
  recipe => {

    if (
      recipe.unlocked &&
      !recipeUnlocked(recipe.id)
    ) {

      unlockRecipe(
        recipe.id
      );

    }

  }
);


/* =========================================================
   GETTERS
========================================================= */

function getRecipe(
  recipeId
) {

  return RECIPES[
    recipeId
  ] || null;
}


function getRecipes() {

  return Object.values(
    RECIPES
  );
}


/* =========================================================
   CREATE UI
========================================================= */

function createUI() {

  if (
    document.getElementById(
      "craftingUI"
    )
  ) {
    return;
  }


  const ui =
    document.createElement(
      "div"
    );


  ui.id =
    "craftingUI";


  ui.className =
    "overlay hidden";


  ui.innerHTML = `

    <div class="uiPanel crafting-panel">

      <div class="uiHeader">

        <div>

          <div class="uiTitle">
            Crafting
          </div>

          <div class="uiSubtitle">
            Turn resources into tools, supplies, and structures.
          </div>

        </div>

        <button
          id="craftingClose"
          class="closeButton"
          type="button"
        >
          ×
        </button>

      </div>


      <div
        class="buttonGrid"
        style="margin-bottom:15px;"
      >

        <button
          class="uiButton"
          data-craft-filter="all"
          type="button"
        >
          All
        </button>

        <button
          class="uiButton"
          data-craft-filter="basic"
          type="button"
        >
          Basic
        </button>

        <button
          class="uiButton"
          data-craft-filter="tools"
          type="button"
        >
          Tools
        </button>

        <button
          class="uiButton"
          data-craft-filter="survival"
          type="button"
        >
          Survival
        </button>

        <button
          class="uiButton"
          data-craft-filter="building"
          type="button"
        >
          Building
        </button>

      </div>


      <div
        id="recipeGrid"
        class="recipeGrid"
      ></div>


      <div
        id="craftingSelected"
        style="
          margin-top:15px;
          padding:13px;
          border-radius:13px;
          background:rgba(255,255,255,.04);
          color:#a9bdb1;
          font-size:12px;
        "
      >
        Select a recipe to see more information.
      </div>

    </div>

  `;


  document.body.appendChild(
    ui
  );


  document
    .getElementById(
      "craftingClose"
    )
    .addEventListener(
      "click",
      close
    );


  ui
    .querySelectorAll(
      "[data-craft-filter]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            craftingState.category =
              button.dataset.craftFilter;

            refresh();

          }
        );

      }
    );


  craftingState.initialized =
    true;
}


/* =========================================================
   OPEN
========================================================= */

function open() {

  createUI();


  craftingState.open =
    true;


  document
    .getElementById(
      "craftingUI"
    )
    .classList.remove(
      "hidden"
    );


  refresh();


  gameEvent(
    "crafting-opened"
  );
}


/* =========================================================
   CLOSE
========================================================= */

function close() {

  const ui =
    document.getElementById(
      "craftingUI"
    );


  if (ui) {

    ui.classList.add(
      "hidden"
    );

  }


  craftingState.open =
    false;


  craftingState.selectedRecipe =
    null;


  gameEvent(
    "crafting-closed"
  );
}


/* =========================================================
   TOGGLE
========================================================= */

function toggle() {

  if (
    craftingState.open
  ) {

    close();

  } else {

    open();

  }
}


/* =========================================================
   CAN CRAFT
========================================================= */

function canCraft(
  recipeId
) {

  const recipe =
    RECIPES[recipeId];


  if (!recipe) {
    return false;
  }


  if (
    !recipeUnlocked(
      recipeId
    )
  ) {
    return false;
  }


  for (
    const [
      itemId,
      amount
    ]
    of Object.entries(
      recipe.ingredients
    )
  ) {

    if (
      getItemCount(
        itemId
      ) < amount
    ) {

      return false;

    }

  }


  return true;
}


/* =========================================================
   CRAFT
========================================================= */

function craft(
  recipeId
) {

  const recipe =
    RECIPES[recipeId];


  if (!recipe) {

    return {
      success: false,
      reason: "missing-recipe"
    };

  }


  if (
    !recipeUnlocked(
      recipeId
    )
  ) {

    gameEvent(
      "craft-failed",
      {
        recipeId,
        reason: "locked"
      }
    );


    return {
      success: false,
      reason: "locked"
    };

  }


  if (
    !canCraft(
      recipeId
    )
  ) {

    gameEvent(
      "craft-failed",
      {
        recipeId,
        reason: "materials"
      }
    );


    showCraftMessage(
      "You don't have the required materials."
    );


    return {
      success: false,
      reason: "materials"
    };

  }


  /*
    Remove ingredients.
  */

  for (
    const [
      itemId,
      amount
    ]
    of Object.entries(
      recipe.ingredients
    )
  ) {

    removeItem(
      itemId,
      amount
    );

  }


  /*
    Add outputs.
  */

  for (
    const [
      itemId,
      amount
    ]
    of Object.entries(
      recipe.output
    )
  ) {

    addItem(
      itemId,
      amount
    );

  }


  GAME.crafting.crafted[
    recipeId
  ] =
    Number(
      GAME.crafting.crafted[
        recipeId
      ] || 0
    ) + 1;


  GAME.crafting.lastCrafted =
    recipeId;


  if (
    !GAME.guide.discoveredRecipes.includes(
      recipeId
    )
  ) {

    GAME.guide.discoveredRecipes.push(
      recipeId
    );

  }


  gameEvent(
    "tool-crafted",
    {
      recipeId,
      recipe
    }
  );


  gameEvent(
    "survival-crafting-complete",
    {
      recipeId,
      recipe
    }
  );


  showCraftMessage(
    `Crafted ${getOutputName(recipe)}.`
  );


  refresh();


  return {
    success: true,
    recipeId,
    recipe
  };
}


/* =========================================================
   OUTPUT NAME
========================================================= */

function getOutputName(
  recipe
) {

  const firstOutput =
    Object.keys(
      recipe.output
    )[0];


  const item =
    ITEMS[firstOutput];


  return item
    ? item.name
    : firstOutput;
}


/* =========================================================
   UNLOCK
========================================================= */

function unlock(
  recipeId
) {

  const recipe =
    RECIPES[recipeId];


  if (!recipe) {
    return false;
  }


  unlockRecipe(
    recipeId
  );


  if (
    !GAME.guide.discoveredRecipes.includes(
      recipeId
    )
  ) {

    GAME.guide.discoveredRecipes.push(
      recipeId
    );

  }


  gameEvent(
    "recipe-unlocked",
    {
      recipeId
    }
  );


  refresh();


  return true;
}


/* =========================================================
   REFRESH
========================================================= */

function refresh() {

  createUI();

  refreshRecipes();

  refreshSelected();
}


/* =========================================================
   RECIPE CARDS
========================================================= */

function refreshRecipes() {

  const grid =
    document.getElementById(
      "recipeGrid"
    );


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  Object.values(
    RECIPES
  ).forEach(
    recipe => {

      if (
        craftingState.category !==
        "all" &&
        recipe.category !==
        craftingState.category
      ) {

        return;

      }


      const unlocked =
        recipeUnlocked(
          recipe.id
        );


      const possible =
        canCraft(
          recipe.id
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "recipeCard";


      if (!unlocked) {

        card.classList.add(
          "locked"
        );

      }


      const ingredientsHTML =
        Object.entries(
          recipe.ingredients
        )
        .map(
          ([itemId, amount]) => {

            const item =
              ITEMS[itemId];


            const current =
              getItemCount(
                itemId
              );


            const enough =
              current >= amount;


            return `

              <div
                style="
                  color:
                    ${
                      enough
                        ? "#a9bdb1"
                        : "#ff7676"
                    };
                "
              >
                ${item?.icon || "•"}
                ${item?.name || itemId}
                ×${amount}
                (${current})
              </div>

            `;

          }
        )
        .join("");


      card.innerHTML = `

        <div
          style="
            font-size:28px;
            margin-bottom:8px;
          "
        >
          ${recipe.icon}
        </div>

        <div class="recipeName">
          ${recipe.name}
        </div>

        <div
          class="recipeIngredients"
        >
          ${ingredientsHTML}
        </div>

        <div
          style="
            margin-top:9px;
            color:#a9bdb1;
            font-size:11px;
          "
        >
          ${recipe.description}
        </div>

        <button
          class="uiButton"
          type="button"
          data-craft="${recipe.id}"
          ${
            !unlocked ||
            !possible
              ? "disabled"
              : ""
          }
        >
          ${
            !unlocked
              ? "🔒 Locked"
              : possible
                ? "Craft"
                : "Need Materials"
          }
        </button>

      `;


      card.addEventListener(
        "click",
        event => {

          if (
            event.target.closest(
              "[data-craft]"
            )
          ) {
            return;
          }


          selectRecipe(
            recipe.id
          );

        }
      );


      grid.appendChild(
        card
      );

    }
  );


  grid
    .querySelectorAll(
      "[data-craft]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();


            craft(
              button.dataset.craft
            );

          }
        );

      }
    );
}


/* =========================================================
   SELECT RECIPE
========================================================= */

function selectRecipe(
  recipeId
) {

  if (
    !RECIPES[recipeId]
  ) {
    return;
  }


  craftingState.selectedRecipe =
    recipeId;


  refreshSelected();


  gameEvent(
    "crafting-recipe-selected",
    {
      recipeId
    }
  );
}


/* =========================================================
   SELECTED RECIPE
========================================================= */

function refreshSelected() {

  const element =
    document.getElementById(
      "craftingSelected"
    );


  if (!element) {
    return;
  }


  const recipe =
    craftingState.selectedRecipe
      ? RECIPES[
          craftingState.selectedRecipe
        ]
      : null;


  if (!recipe) {

    element.innerHTML =
      "Select a recipe to see more information.";

    return;
  }


  const unlocked =
    recipeUnlocked(
      recipe.id
    );


  const possible =
    canCraft(
      recipe.id
    );


  element.innerHTML = `

    <strong
      style="
        color:white;
        font-size:14px;
      "
    >
      ${recipe.icon}
      ${recipe.name}
    </strong>

    <div
      style="
        margin-top:6px;
        line-height:1.6;
      "
    >
      ${recipe.description}
    </div>

    <div
      style="
        margin-top:8px;
      "
    >
      ${
        unlocked
          ? possible
            ? "Ready to craft."
            : "Gather the missing materials."
          : "This recipe has not been unlocked yet."
      }
    </div>

  `;
}


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
      event.code === "KeyC"
    ) {

      toggle();

      return;
    }


    if (
      event.code === "Escape" &&
      craftingState.open
    ) {

      close();

    }

  }
);


/* =========================================================
   INVENTORY CHANGES
========================================================= */

window.addEventListener(
  "survival-inventory-changed",
  () => {

    if (
      craftingState.initialized
    ) {

      refresh();

    }

  }
);


/* =========================================================
   VR MENU BUTTON
========================================================= */

window.addEventListener(
  "survival-menu-button",
  () => {

    if (
      craftingState.open
    ) {

      close();

    }

  }
);


/* =========================================================
   START
========================================================= */

createUI();


console.log(
  "[Crafting] Crafting system loaded."
);


/* =========================================================
   EXPORTS
========================================================= */

export {
  craftingSystem,
  open,
  close,
  toggle,
  refresh,
  craft,
  canCraft,
  unlock,
  selectRecipe,
  getRecipe,
  getRecipes
};