/*
==========================================================
ISLAND SURVIVAL VR
SURVIVAL GUIDE SYSTEM
==========================================================

Connects to:
- game.js
- crafting.js
- inventory.js
- building.js
- index.html
- future world.js

==========================================================
*/

import {
  GAME,
  unlockRecipe,
  recipeUnlocked,
  gameEvent
} from "./game.js";

import {
  RECIPES
} from "./crafting.js";


/* ========================================================
   VERSION
======================================================== */

export const GUIDE_VERSION = 1;


/* ========================================================
   GUIDE PAGES
======================================================== */

export const GUIDE_PAGES = [

  {
    id: "first_day",
    title: "Your First Day",
    icon: "🌅",

    text:
      "Explore the island and collect basic resources. " +
      "Keep an eye on your hunger, thirst, health and stamina. " +
      "Your first goal is to gather enough materials to begin crafting."
  },


  {
    id: "gathering",
    title: "Gathering",
    icon: "🌿",

    text:
      "Trees provide wood and logs. Rocks provide stone. " +
      "Walk around the island and search for useful resources. " +
      "Some resources can be processed into more useful materials."
  },


  {
    id: "wood",
    title: "Working With Wood",
    icon: "🪵",

    text:
      "Logs can be processed into wood. Wood is one of the most " +
      "important materials on the island and can be used for tools, " +
      "building pieces and storage."
  },


  {
    id: "fiber",
    title: "Fiber & String",
    icon: "🧵",

    text:
      "Fiber is a useful plant material. Combine fiber to create " +
      "string. String is needed for several tools and structures."
  },


  {
    id: "stone",
    title: "Stone",
    icon: "🪨",

    text:
      "Rocks can be processed into stone. Stone can be used for " +
      "tools, campfires and other survival equipment."
  },


  {
    id: "tools",
    title: "Tools",
    icon: "🪓",

    text:
      "Tools make gathering easier. The stone axe is designed for " +
      "wood gathering while the stone pickaxe is designed for stone."
  },


  {
    id: "campfire",
    title: "Campfire",
    icon: "🔥",

    text:
      "A campfire gives you a place to establish a small survival " +
      "camp. It can later connect to cooking and other survival systems."
  },


  {
    id: "building",
    title: "Building",
    icon: "🏠",

    text:
      "Use the building system to place floors, walls, doors and " +
      "other structures. Start with a floor and build outward from it."
  },


  {
    id: "storage",
    title: "Storage",
    icon: "📦",

    text:
      "A storage box gives you another place to keep items. " +
      "The storage system can be expanded later with larger containers."
  },


  {
    id: "water",
    title: "Water",
    icon: "💧",

    text:
      "The island has a lake. Water and thirst will become important " +
      "parts of long-term survival."
  },


  {
    id: "survival",
    title: "Survival",
    icon: "❤️",

    text:
      "Your health, hunger, thirst and stamina affect your survival. " +
      "Gather supplies early instead of waiting until your resources " +
      "are almost empty."
  }

];


/* ========================================================
   RECIPE GUIDE
======================================================== */

export const GUIDE_RECIPES = [

  {
    recipe: "string",
    page: "fiber",
    title: "String",
    icon: "🧵",

    explanation:
      "Three fiber can be turned into one string."
  },


  {
    recipe: "stick",
    page: "wood",
    title: "Stick",
    icon: "🪵",

    explanation:
      "Wood can be processed into two sticks."
  },


  {
    recipe: "woodPlank",
    page: "wood",
    title: "Processed Wood",
    icon: "🪵",

    explanation:
      "One log can be processed into four units of wood."
  },


  {
    recipe: "stone",
    page: "stone",
    title: "Stone",
    icon: "🪨",

    explanation:
      "One rock can be processed into three units of stone."
  },


  {
    recipe: "stoneAxe",
    page: "tools",
    title: "Stone Axe",
    icon: "🪓",

    explanation:
      "A basic gathering tool made from sticks, stone and string."
  },


  {
    recipe: "stonePickaxe",
    page: "tools",
    title: "Stone Pickaxe",
    icon: "⛏️",

    explanation:
      "A basic stone-gathering tool."
  },


  {
    recipe: "campfire",
    page: "campfire",
    title: "Campfire",
    icon: "🔥",

    explanation:
      "A small survival structure made from stone and wood."
  },


  {
    recipe: "storageBox",
    page: "storage",
    title: "Storage Box",
    icon: "📦",

    explanation:
      "A wooden container for storing extra resources."
  },


  {
    recipe: "woodFloor",
    page: "building",
    title: "Wood Floor",
    icon: "🪵",

    explanation:
      "A basic foundation piece for your shelter."
  },


  {
    recipe: "woodWall",
    page: "building",
    title: "Wood Wall",
    icon: "🧱",

    explanation:
      "A basic wall for creating a shelter."
  },


  {
    recipe: "woodDoor",
    page: "building",
    title: "Wood Door",
    icon: "🚪",

    explanation:
      "A door that can be used as an entrance to your shelter."
  }

];


/* ========================================================
   GUIDE STATE
======================================================== */

const guideState = {

  open: false,

  currentPage: 0,

  discoveredPages: new Set([
    "first_day",
    "gathering",
    "survival"
  ]),

  discoveredRecipes: new Set([
    "string",
    "stick"
  ])

};


/* ========================================================
   REGISTER SYSTEM
======================================================== */

if (
  window.SurvivalVR &&
  window.SurvivalVR.systems
) {

  window.SurvivalVR.systems.guide = {

    version: GUIDE_VERSION,

    pages: GUIDE_PAGES,

    recipes: GUIDE_RECIPES,

    state: guideState,

    open: openGuide,

    close: closeGuide,

    toggle: toggleGuide,

    nextPage: nextPage,

    previousPage: previousPage,

    showPage: showPage,

    unlockPage: unlockPage,

    unlockRecipe: unlockGuideRecipe,

    discoverRecipe: discoverRecipe,

    isPageUnlocked: isPageUnlocked,

    isRecipeDiscovered: isRecipeDiscovered

  };

}


/* ========================================================
   OPEN GUIDE
======================================================== */

export function openGuide() {

  guideState.open = true;

  createGuideUI();

  renderGuide();

}


/* ========================================================
   CLOSE GUIDE
======================================================== */

export function closeGuide() {

  guideState.open = false;

  const guide =
    document.getElementById(
      "survivalGuide"
    );

  if (guide) {

    guide.classList.remove(
      "visible"
    );

  }

}


/* ========================================================
   TOGGLE GUIDE
======================================================== */

export function toggleGuide() {

  if (guideState.open) {

    closeGuide();

  } else {

    openGuide();

  }

}


/* ========================================================
   CREATE GUIDE UI
======================================================== */

function createGuideUI() {

  if (
    document.getElementById(
      "survivalGuide"
    )
  ) {

    return;

  }


  const guide =
    document.createElement(
      "div"
    );

  guide.id =
    "survivalGuide";


  guide.innerHTML = `

    <div class="guide-window">

      <div class="guide-header">

        <div>

          <div class="guide-title">
            SURVIVAL GUIDE
          </div>

          <div class="guide-subtitle">
            Island survival handbook
          </div>

        </div>

        <button
          id="closeGuide"
          class="guide-close"
        >
          ×
        </button>

      </div>


      <div class="guide-body">

        <div
          id="guidePages"
          class="guide-pages"
        ></div>


        <div class="guide-content">

          <div
            id="guidePageContent"
            class="guide-page-content"
          ></div>


          <div
            id="guideRecipeList"
            class="guide-recipe-list"
          ></div>

        </div>

      </div>


      <div class="guide-footer">

        <button
          id="guidePrevious"
          class="guide-navigation"
        >
          ← PREVIOUS
        </button>

        <div
          id="guidePageNumber"
          class="guide-page-number"
        ></div>

        <button
          id="guideNext"
          class="guide-navigation"
        >
          NEXT →
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    guide
  );


  document
    .getElementById(
      "closeGuide"
    )
    .addEventListener(
      "click",
      closeGuide
    );


  document
    .getElementById(
      "guidePrevious"
    )
    .addEventListener(
      "click",
      previousPage
    );


  document
    .getElementById(
      "guideNext"
    )
    .addEventListener(
      "click",
      nextPage
    );


  guide.addEventListener(
    "click",
    event => {

      if (
        event.target === guide
      ) {

        closeGuide();

      }

    }
  );

}


/* ========================================================
   RENDER GUIDE
======================================================== */

function renderGuide() {

  const guide =
    document.getElementById(
      "survivalGuide"
    );

  if (!guide) {

    return;

  }


  guide.classList.add(
    "visible"
  );


  renderPageList();

  renderCurrentPage();

  renderRecipes();

  updateNavigation();

}


/* ========================================================
   PAGE LIST
======================================================== */

function renderPageList() {

  const container =
    document.getElementById(
      "guidePages"
    );

  if (!container) {

    return;

  }


  container.innerHTML = "";


  GUIDE_PAGES.forEach(
    (page, index) => {

      const unlocked =
        isPageUnlocked(
          page.id
        );


      const button =
        document.createElement(
          "button"
        );


      button.className =
        "guide-page-button";


      if (
        guideState.currentPage ===
        index
      ) {

        button.classList.add(
          "active"
        );

      }


      if (!unlocked) {

        button.classList.add(
          "locked"
        );

      }


      button.innerHTML = `

        <span class="guide-page-icon">
          ${
            unlocked
              ? page.icon
              : "🔒"
          }
        </span>

        <span>
          ${
            unlocked
              ? page.title
              : "Undiscovered"
          }
        </span>

      `;


      button.addEventListener(
        "click",
        () => {

          if (!unlocked) {

            showGuideMessage(
              "This page has not been discovered yet."
            );

            return;

          }


          showPage(
            index
          );

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* ========================================================
   CURRENT PAGE
======================================================== */

function renderCurrentPage() {

  const container =
    document.getElementById(
      "guidePageContent"
    );

  if (!container) {

    return;

  }


  const page =
    GUIDE_PAGES[
      guideState.currentPage
    ];


  if (!page) {

    return;

  }


  if (
    !isPageUnlocked(
      page.id
    )
  ) {

    container.innerHTML = `

      <div class="guide-locked">

        🔒

        <h2>
          Page Locked
        </h2>

        <p>
          Explore the island to discover
          more survival knowledge.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML = `

    <div class="guide-big-icon">
      ${page.icon}
    </div>

    <h1>
      ${page.title}
    </h1>

    <p>
      ${page.text}
    </p>

  `;

}


/* ========================================================
   RECIPE SECTION
======================================================== */

function renderRecipes() {

  const container =
    document.getElementById(
      "guideRecipeList"
    );

  if (!container) {

    return;

  }


  const page =
    GUIDE_PAGES[
      guideState.currentPage
    ];


  if (!page) {

    return;

  }


  const recipes =
    GUIDE_RECIPES.filter(
      recipe =>
        recipe.page ===
        page.id
    );


  if (
    recipes.length === 0
  ) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML = `

    <div class="guide-recipe-heading">
      RECIPES
    </div>

  `;


  recipes.forEach(
    recipeInfo => {

      const unlocked =
        isRecipeDiscovered(
          recipeInfo.recipe
        );


      const recipe =
        RECIPES[
          recipeInfo.recipe
        ];


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "guide-recipe-card";


      if (!unlocked) {

        card.classList.add(
          "locked"
        );

      }


      if (
        unlocked &&
        recipe
      ) {

        const ingredients =
          Object.entries(
            recipe.ingredients
          )
          .map(
            ([item, amount]) =>
              `${getItemIcon(item)} ${getItemName(item)} ×${amount}`
          )
          .join(" • ");


        const output =
          Object.entries(
            recipe.output
          )
          .map(
            ([item, amount]) =>
              `${getItemIcon(item)} ${getItemName(item)} ×${amount}`
          )
          .join(" • ");


        card.innerHTML = `

          <div class="guide-recipe-card-title">

            <span>
              ${recipeInfo.icon}
            </span>

            <span>
              ${recipeInfo.title}
            </span>

          </div>

          <div class="guide-recipe-description">
            ${recipeInfo.explanation}
          </div>

          <div class="guide-recipe-materials">

            <strong>
              Materials:
            </strong>

            ${ingredients}

          </div>

          <div class="guide-recipe-output">

            <strong>
              Creates:
            </strong>

            ${output}

          </div>

        `;

      } else {

        card.innerHTML = `

          <div class="guide-recipe-card-title">
            🔒 Unknown Recipe
          </div>

          <div class="guide-recipe-description">
            Discover this recipe as you explore
            the island.
          </div>

        `;

      }


      container.appendChild(
        card
      );

    }
  );

}


/* ========================================================
   NAVIGATION
======================================================== */

export function nextPage() {

  let next =
    guideState.currentPage + 1;


  while (
    next < GUIDE_PAGES.length &&
    !isPageUnlocked(
      GUIDE_PAGES[next].id
    )
  ) {

    next++;

  }


  if (
    next >= GUIDE_PAGES.length
  ) {

    showGuideMessage(
      "You have reached the end of the discovered guide."
    );

    return;

  }


  guideState.currentPage =
    next;


  renderGuide();

}


export function previousPage() {

  let previous =
    guideState.currentPage - 1;


  while (
    previous >= 0 &&
    !isPageUnlocked(
      GUIDE_PAGES[previous].id
    )
  ) {

    previous--;

  }


  if (
    previous < 0
  ) {

    return;

  }


  guideState.currentPage =
    previous;


  renderGuide();

}


export function showPage(
  pageIndex
) {

  if (
    pageIndex < 0 ||
    pageIndex >= GUIDE_PAGES.length
  ) {

    return false;

  }


  const page =
    GUIDE_PAGES[
      pageIndex
    ];


  if (
    !isPageUnlocked(
      page.id
    )
  ) {

    return false;

  }


  guideState.currentPage =
    pageIndex;


  renderGuide();

  return true;

}


/* ========================================================
   UNLOCK PAGE
======================================================== */

export function unlockPage(
  pageId
) {

  const page =
    GUIDE_PAGES.find(
      item =>
        item.id ===
        pageId
    );


  if (!page) {

    return false;

  }


  if (
    guideState.discoveredPages.has(
      pageId
    )
  ) {

    return false;

  }


  guideState.discoveredPages.add(
    pageId
  );


  gameEvent(
    "guide-page-unlocked",
    {
      page: pageId
    }
  );


  window.dispatchEvent(
    new CustomEvent(
      "survival-guide-page-unlocked",
      {
        detail: {
          page: pageId
        }
      }
    )
  );


  showGuideMessage(
    `Guide discovered: ${page.title}`
  );


  if (
    guideState.open
  ) {

    renderGuide();

  }


  return true;

}


/* ========================================================
   UNLOCK RECIPE
======================================================== */

export function unlockGuideRecipe(
  recipeId
) {

  const recipe =
    RECIPES[
      recipeId
    ];


  if (!recipe) {

    return false;

  }


  unlockRecipe(
    recipeId
  );


  discoverRecipe(
    recipeId
  );


  return true;

}


/* ========================================================
   DISCOVER RECIPE
======================================================== */

export function discoverRecipe(
  recipeId
) {

  if (
    !RECIPES[
      recipeId
    ]
  ) {

    return false;

  }


  if (
    guideState.discoveredRecipes.has(
      recipeId
    )
  ) {

    return false;

  }


  guideState.discoveredRecipes.add(
    recipeId
  );


  unlockRecipe(
    recipeId
  );


  const guideRecipe =
    GUIDE_RECIPES.find(
      recipe =>
        recipe.recipe ===
        recipeId
    );


  gameEvent(
    "recipe-discovered",
    {
      recipe: recipeId
    }
  );


  window.dispatchEvent(
    new CustomEvent(
      "survival-recipe-discovered",
      {
        detail: {
          recipe: recipeId
        }
      }
    )
  );


  if (guideRecipe) {

    showGuideMessage(
      `New recipe discovered: ${guideRecipe.title}`
    );

  }


  if (
    guideState.open
  ) {

    renderGuide();

  }


  return true;

}


/* ========================================================
   CHECK PAGE
======================================================== */

export function isPageUnlocked(
  pageId
) {

  return guideState.discoveredPages.has(
    pageId
  );

}


/* ========================================================
   CHECK RECIPE
======================================================== */

export function isRecipeDiscovered(
  recipeId
) {

  return guideState.discoveredRecipes.has(
    recipeId
  );

}


/* ========================================================
   AUTOMATIC DISCOVERY
======================================================== */

/*
When the player gathers a resource,
the guide can automatically reveal
the appropriate information.
*/

window.addEventListener(
  "survival-resource-gathered",
  event => {

    const resource =
      event.detail?.resource;


    if (
      resource === "wood" ||
      resource === "log"
    ) {

      unlockPage(
        "wood"
      );

    }


    if (
      resource === "rock" ||
      resource === "stone"
    ) {

      unlockPage(
        "stone"
      );

    }


    if (
      resource === "fiber"
    ) {

      unlockPage(
        "fiber"
      );

    }

  }
);


/* ========================================================
   CRAFTING DISCOVERY
======================================================== */

window.addEventListener(
  "survival-tool-crafted",
  event => {

    const recipe =
      event.detail?.recipe;


    if (
      recipe === "stoneAxe" ||
      recipe === "stonePickaxe"
    ) {

      unlockPage(
        "tools"
      );

    }

  }
);


/* ========================================================
   BUILDING DISCOVERY
======================================================== */

window.addEventListener(
  "survival-building-placed",
  event => {

    const building =
      event.detail?.building;


    if (
      building === "campfire"
    ) {

      unlockPage(
        "campfire"
      );

    }


    if (
      building === "storageBox"
    ) {

      unlockPage(
        "storage"
      );

    }


    if (
      building === "woodFloor" ||
      building === "woodWall" ||
      building === "woodDoor"
    ) {

      unlockPage(
        "building"
      );

    }

  }
);


/* ========================================================
   KEYBOARD
======================================================== */

window.addEventListener(
  "keydown",
  event => {

    if (
      event.key.toLowerCase() ===
      "g"
    ) {

      if (
        !isTyping()
      ) {

        toggleGuide();

      }

    }


    if (
      event.key === "Escape"
    ) {

      closeGuide();

    }

  }
);


/* ========================================================
   GUIDE MESSAGE
======================================================== */

function showGuideMessage(
  message
) {

  const element =
    document.getElementById(
      "message"
    );


  if (!element) {

    return;

  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    showGuideMessage.timeout
  );


  showGuideMessage.timeout =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      2200
    );

}


/* ========================================================
   ITEM HELPERS
======================================================== */

function getItemName(
  item
) {

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
    cookedMeat: "Cooked Meat"

  };


  return (
    names[item] ||
    capitalize(item)
  );

}


function getItemIcon(
  item
) {

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
    cookedMeat: "🍖"

  };


  return icons[item] || "📦";

}


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
   STARTUP
======================================================== */

console.log(
  "📖 Survival guide loaded."
);

console.log(
  `📚 ${GUIDE_PAGES.length} guide pages registered.`
);

console.log(
  `🧾 ${GUIDE_RECIPES.length} recipe guides registered.`
);