// guide.js
// Survival VR — Guide / Recipe Book System

import {
  GAME,
  gameEvent,
  recipeUnlocked
} from "./game.js";

import {
  RECIPES
} from "./crafting.js";

const SurvivalVR = window.SurvivalVR;

const GUIDE_PAGES = {
  first_day: {
    title: "Your First Day",
    icon: "☀️",
    text: `
      Welcome to the island.

      Your first priorities are to gather resources,
      find water, and create basic tools.

      Explore carefully and keep an eye on your
      hunger, thirst, health, and stamina.
    `
  },

  gathering: {
    title: "Gathering",
    icon: "🌿",
    text: `
      Resources are spread throughout the island.

      Walk near trees, rocks, logs, and other
      resources and interact with them.

      Gather enough materials before starting
      larger crafting projects.
    `
  },

  wood: {
    title: "Wood",
    icon: "🪵",
    text: `
      Trees are one of your most important resources.

      Gathering trees gives you wood.
      Breaking a tree completely can give you a log.

      Logs can be processed into smaller pieces
      of usable wood.
    `
  },

  fiber: {
    title: "Fiber & String",
    icon: "🧵",
    text: `
      Fiber can be turned into string.

      String is useful for tools, storage,
      structures, and other crafting recipes.

      Basic recipe:

      3 Fiber → 1 String
    `
  },

  stone: {
    title: "Stone",
    icon: "🪨",
    text: `
      Rocks provide stone.

      Stone is useful for tools, campfires,
      and other survival equipment.

      Basic recipe:

      1 Rock → 3 Stone
    `
  },

  tools: {
    title: "Tools",
    icon: "🪓",
    text: `
      Tools make survival easier.

      A stone axe can be used for wood-related
      activities.

      A stone pickaxe is useful for stone.

      Keep your tools available in your side slots
      or hands when exploring.
    `
  },

  campfire: {
    title: "Campfire",
    icon: "🔥",
    text: `
      A campfire gives you a place to stay warm
      and can become an important part of your base.

      Campfires require stone and wood.

      Be careful where you place one.
    `
  },

  building: {
    title: "Building",
    icon: "🏠",
    text: `
      Building mode lets you create your shelter.

      Press B to enter building mode.

      Select a structure, move the green preview
      into position, rotate it if necessary,
      then place it.

      Green means the location is valid.
      Red means the location cannot be used.
    `
  },

  storage: {
    title: "Storage",
    icon: "📦",
    text: `
      Storage boxes can be used as part of your base.

      Build a storage box and use it as a dedicated
      location for resources and equipment.

      The storage system will expand as the rest
      of the survival systems are added.
    `
  },

  water: {
    title: "Water",
    icon: "💧",
    text: `
      Water is essential for survival.

      The island contains a lake.

      Stay near the water and use the drink action
      when you need to restore thirst.

      Keep track of your thirst throughout the day.
    `
  },

  survival: {
    title: "Survival",
    icon: "❤️",
    text: `
      Your main survival statistics are:

      Health
      Hunger
      Thirst
      Stamina

      Running uses stamina.
      Hunger and thirst decrease over time.

      Find food and water and create a safe shelter
      before night arrives.
    `
  },

  night: {
    title: "Night",
    icon: "🌙",
    text: `
      Night changes the island environment.

      Visibility becomes lower and the world becomes
      more difficult to navigate.

      A campfire can help make your base easier
      to find after dark.

      Consider preparing your shelter before sunset.
    `
  }
};

const GUIDE_RECIPES = {
  string: {
    title: "String",
    icon: "🧵",
    description: "Turn fiber into string.",
    ingredients: {
      fiber: 3
    },
    output: {
      string: 1
    }
  },

  stick: {
    title: "Sticks",
    icon: "🌿",
    description: "Process wood into sticks.",
    ingredients: {
      wood: 1
    },
    output: {
      stick: 2
    }
  },

  woodPlank: {
    title: "Processed Wood",
    icon: "🪵",
    description: "Process a log into wood.",
    ingredients: {
      log: 1
    },
    output: {
      wood: 4
    }
  },

  stone: {
    title: "Stone",
    icon: "🪨",
    description: "Break a rock into stone.",
    ingredients: {
      rock: 1
    },
    output: {
      stone: 3
    }
  },

  rope: {
    title: "Rope",
    icon: "🪢",
    description: "Combine string into stronger cordage.",
    ingredients: {
      string: 3
    },
    output: {
      string: 5
    }
  },

  stoneAxe: {
    title: "Stone Axe",
    icon: "🪓",
    description: "A basic survival axe.",
    ingredients: {
      stick: 2,
      stone: 2,
      string: 1
    },
    output: {
      stoneAxe: 1
    }
  },

  stonePickaxe: {
    title: "Stone Pickaxe",
    icon: "⛏️",
    description: "A basic stone-gathering tool.",
    ingredients: {
      stick: 2,
      stone: 3,
      string: 1
    },
    output: {
      stonePickaxe: 1
    }
  },

  campfire: {
    title: "Campfire",
    icon: "🔥",
    description: "A basic survival fire.",
    ingredients: {
      stone: 6,
      wood: 3
    },
    output: {
      campfire: 1
    }
  },

  storageBox: {
    title: "Storage Box",
    icon: "📦",
    description: "A wooden container for your base.",
    ingredients: {
      wood: 8,
      string: 2
    },
    output: {
      storageBox: 1
    }
  },

  woodFloor: {
    title: "Wood Floor",
    icon: "▰",
    description: "A wooden foundation piece.",
    ingredients: {
      wood: 5
    },
    output: {
      woodFloor: 1
    }
  },

  woodWall: {
    title: "Wood Wall",
    icon: "▥",
    description: "A basic wooden shelter wall.",
    ingredients: {
      wood: 6
    },
    output: {
      woodWall: 1
    }
  },

  woodDoor: {
    title: "Wood Door",
    icon: "🚪",
    description: "An entrance for your shelter.",
    ingredients: {
      wood: 8,
      string: 2
    },
    output: {
      woodDoor: 1
    }
  }
};

const guideState = {
  open: false,
  currentPage: "first_day",
  currentSection: "pages",

  discoveredPages: [],
  discoveredRecipes: [],

  initialized: false,

  ui: null,
  pageList: null,
  content: null
};

SurvivalVR.systems.guide = guideState;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function formatName(value) {
  return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, char => char.toUpperCase());
}

function getPage(id) {
  return GUIDE_PAGES[id] || null;
}

function getRecipe(id) {
  return GUIDE_RECIPES[id] || RECIPES[id] || null;
}

function showMessage(text, duration = 2200) {
  const message =
    document.getElementById("message");

  if (!message) {
    return;
  }

  message.textContent = text;
  message.classList.remove("hidden");

  clearTimeout(showMessage.timer);

  showMessage.timer = setTimeout(() => {
    message.classList.add("hidden");
  }, duration);
}

// --------------------------------------------------
// DISCOVERY
// --------------------------------------------------

function discoverPage(id) {
  if (!GUIDE_PAGES[id]) {
    return;
  }

  if (!guideState.discoveredPages.includes(id)) {
    guideState.discoveredPages.push(id);

    if (
      !GAME.guide.discoveredPages.includes(id)
    ) {
      GAME.guide.discoveredPages.push(id);
    }

    gameEvent(
      "guide-page-discovered",
      { id }
    );
  }
}

function discoverRecipe(id) {
  if (!GUIDE_RECIPES[id]) {
    return;
  }

  if (!guideState.discoveredRecipes.includes(id)) {
    guideState.discoveredRecipes.push(id);

    if (
      !GAME.guide.discoveredRecipes.includes(id)
    ) {
      GAME.guide.discoveredRecipes.push(id);
    }

    gameEvent(
      "guide-recipe-discovered",
      { id }
    );
  }
}

function discoverDefaults() {
  discoverPage("first_day");
  discoverPage("gathering");
  discoverPage("survival");

  discoverRecipe("string");
  discoverRecipe("stick");
  discoverRecipe("woodPlank");
  discoverRecipe("stone");
}

// --------------------------------------------------
// UI
// --------------------------------------------------

function createGuideUI() {
  if (document.getElementById("guideUI")) {
    return;
  }

  const panel =
    document.createElement("div");

  panel.id = "guideUI";
  panel.className =
    "overlayPanel guideUI hidden";

  panel.innerHTML = `
    <div class="panelHeader">
      <div>
        <div class="panelTitle">
          SURVIVAL GUIDE
        </div>

        <div class="panelSubtitle">
          Island knowledge & recipes
        </div>
      </div>

      <button
        id="guideClose"
        class="closeButton"
        type="button"
      >
        ×
      </button>
    </div>

    <div
      class="guideTabs"
      style="
        display:flex;
        gap:8px;
        margin-bottom:12px;
      "
    >
      <button
        id="guidePagesTab"
        class="secondaryButton"
        type="button"
      >
        Guide
      </button>

      <button
        id="guideRecipesTab"
        class="secondaryButton"
        type="button"
      >
        Recipes
      </button>
    </div>

    <div
      class="guideLayout"
      style="
        display:grid;
        grid-template-columns:
          minmax(150px, 0.7fr)
          minmax(0, 1.5fr);
        gap:14px;
      "
    >
      <div
        id="guidePageList"
        class="guidePageList"
      ></div>

      <div
        id="guideContent"
        class="guideContent"
      ></div>
    </div>
  `;

  document.body.appendChild(panel);

  guideState.ui = panel;

  guideState.pageList =
    document.getElementById(
      "guidePageList"
    );

  guideState.content =
    document.getElementById(
      "guideContent"
    );

  document
    .getElementById("guideClose")
    ?.addEventListener(
      "click",
      closeGuide
    );

  document
    .getElementById("guidePagesTab")
    ?.addEventListener(
      "click",
      () => {
        guideState.currentSection = "pages";
        renderGuide();
      }
    );

  document
    .getElementById("guideRecipesTab")
    ?.addEventListener(
      "click",
      () => {
        guideState.currentSection = "recipes";
        renderGuide();
      }
    );
}

// --------------------------------------------------
// PAGE LIST
// --------------------------------------------------

function getAvailablePages() {
  const discovered =
    new Set(
      guideState.discoveredPages
    );

  return Object.keys(GUIDE_PAGES)
    .filter(id => discovered.has(id));
}

function getAvailableRecipes() {
  const discovered =
    new Set(
      guideState.discoveredRecipes
    );

  return Object.keys(GUIDE_RECIPES)
    .filter(id => discovered.has(id));
}

function renderList() {
  if (!guideState.pageList) {
    return;
  }

  guideState.pageList.innerHTML = "";

  const ids =
    guideState.currentSection === "pages"
      ? getAvailablePages()
      : getAvailableRecipes();

  if (ids.length === 0) {
    guideState.pageList.innerHTML = `
      <div class="emptyState">
        Discover more information
        while exploring the island.
      </div>
    `;

    return;
  }

  for (const id of ids) {
    const isRecipe =
      guideState.currentSection === "recipes";

    const data = isRecipe
      ? GUIDE_RECIPES[id]
      : GUIDE_PAGES[id];

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "guidePageButton";

    if (
      id === guideState.currentPage
    ) {
      button.classList.add(
        "selected"
      );
    }

    button.innerHTML = `
      <span
        class="guideIcon"
        style="margin-right:7px;"
      >
        ${data.icon || "📖"}
      </span>

      <span>
        ${data.title}
      </span>
    `;

    button.addEventListener(
      "click",
      () => {
        guideState.currentPage = id;
        renderGuide();
      }
    );

    guideState.pageList.appendChild(
      button
    );
  }
}

// --------------------------------------------------
// CONTENT
// --------------------------------------------------

function renderPageContent() {
  const page =
    getPage(
      guideState.currentPage
    );

  if (!page) {
    guideState.content.innerHTML = `
      <div class="emptyState">
        Select a guide page.
      </div>
    `;

    return;
  }

  guideState.content.innerHTML = `
    <div class="guideArticle">
      <div
        class="guideArticleIcon"
        style="
          font-size:42px;
          margin-bottom:8px;
        "
      >
        ${page.icon}
      </div>

      <h2>
        ${page.title}
      </h2>

      <div
        class="guideArticleText"
      >
        ${formatGuideText(page.text)}
      </div>
    </div>
  `;
}

function formatGuideText(text) {
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map(paragraph => {
      return `
        <p>
          ${paragraph
            .trim()
            .replace(/\n/g, "<br>")}
        </p>
      `;
    })
    .join("");
}

function renderRecipeContent() {
  const recipe =
    getRecipe(
      guideState.currentPage
    );

  if (!recipe) {
    guideState.content.innerHTML = `
      <div class="emptyState">
        Select a recipe.
      </div>
    `;

    return;
  }

  const ingredients =
    Object.entries(
      recipe.ingredients || {}
    );

  const output =
    Object.entries(
      recipe.output || {}
    );

  guideState.content.innerHTML = `
    <div class="guideArticle">
      <div
        style="
          font-size:42px;
          margin-bottom:8px;
        "
      >
        ${recipe.icon || "📖"}
      </div>

      <h2>
        ${recipe.title}
      </h2>

      <p>
        ${recipe.description || ""}
      </p>

      <div
        class="recipeSection"
        style="margin-top:18px;"
      >
        <strong>
          Materials
        </strong>

        <div
          class="recipeMaterials"
          style="
            display:flex;
            flex-direction:column;
            gap:6px;
            margin-top:8px;
          "
        >
          ${
            ingredients
              .map(
                ([item, amount]) => `
                  <div>
                    ${formatName(item)}
                    ×${amount}
                  </div>
                `
              )
              .join("")
          }
        </div>
      </div>

      <div
        class="recipeSection"
        style="margin-top:18px;"
      >
        <strong>
          Creates
        </strong>

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:6px;
            margin-top:8px;
          "
        >
          ${
            output
              .map(
                ([item, amount]) => `
                  <div>
                    ${formatName(item)}
                    ×${amount}
                  </div>
                `
              )
              .join("")
          }
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------
// RENDER
// --------------------------------------------------

function renderGuide() {
  if (!guideState.ui) {
    createGuideUI();
  }

  renderList();

  if (guideState.currentSection === "pages") {
    renderPageContent();
  } else {
    renderRecipeContent();
  }

  const pagesTab =
    document.getElementById(
      "guidePagesTab"
    );

  const recipesTab =
    document.getElementById(
      "guideRecipesTab"
    );

  pagesTab?.classList.toggle(
    "selected",
    guideState.currentSection === "pages"
  );

  recipesTab?.classList.toggle(
    "selected",
    guideState.currentSection === "recipes"
  );
}

// --------------------------------------------------
// OPEN / CLOSE
// --------------------------------------------------

function openGuide() {
  if (!guideState.ui) {
    createGuideUI();
  }

  guideState.open = true;

  guideState.ui.classList.remove(
    "hidden"
  );

  renderGuide();
}

function closeGuide() {
  guideState.open = false;

  guideState.ui?.classList.add(
    "hidden"
  );
}

function toggleGuide() {
  if (guideState.open) {
    closeGuide();
  } else {
    openGuide();
  }
}

// --------------------------------------------------
// AUTO DISCOVERY
// --------------------------------------------------

function setupDiscoveryEvents() {
  window.addEventListener(
    "survival-resource-gathered",
    event => {
      discoverPage("gathering");

      const detail =
        event.detail || {};

      if (
        detail.resource === "tree" ||
        detail.type === "tree"
      ) {
        discoverPage("wood");
      }

      if (
        detail.resource === "rock" ||
        detail.type === "rock"
      ) {
        discoverPage("stone");
      }

      if (
        detail.resource === "fiber" ||
        detail.type === "fiber"
      ) {
        discoverPage("fiber");
      }

      renderGuide();
    }
  );

  window.addEventListener(
    "survival-tool-crafted",
    event => {
      discoverPage("tools");

      const id =
        event.detail?.recipe ||
        event.detail?.id;

      if (id) {
        discoverRecipe(id);
      }

      renderGuide();
    }
  );

  window.addEventListener(
    "survival-crafting-complete",
    event => {
      const id =
        event.detail?.recipe ||
        event.detail?.id;

      if (id) {
        discoverRecipe(id);
      }

      if (
        id === "stoneAxe" ||
        id === "stonePickaxe"
      ) {
        discoverPage("tools");
      }

      renderGuide();
    }
  );

  window.addEventListener(
    "survival-building-placed",
    event => {
      discoverPage("building");

      const id =
        event.detail?.id ||
        event.detail?.buildingId;

      if (id) {
        discoverRecipe(id);
      }

      if (id === "campfire") {
        discoverPage("campfire");
      }

      if (id === "storageBox") {
        discoverPage("storage");
      }

      renderGuide();
    }
  );

  window.addEventListener(
    "survival-water-drink",
    () => {
      discoverPage("water");
      renderGuide();
    }
  );

  window.addEventListener(
    "survival-night-started",
    () => {
      discoverPage("night");
      renderGuide();
    }
  );

  window.addEventListener(
    "survival-menu-button",
    () => {
      if (guideState.open) {
        closeGuide();
      }
    }
  );
}

// --------------------------------------------------
// KEYBOARD
// --------------------------------------------------

function setupKeyboard() {
  window.addEventListener(
    "keydown",
    event => {
      const key =
        event.key.toLowerCase();

      if (key === "g") {
        toggleGuide();
        return;
      }

      if (
        key === "escape" &&
        guideState.open
      ) {
        closeGuide();
      }
    }
  );
}

// --------------------------------------------------
// SYNC GAME DATA
// --------------------------------------------------

function syncFromGame() {
  if (
    Array.isArray(
      GAME.guide?.discoveredPages
    )
  ) {
    for (
      const page
      of GAME.guide.discoveredPages
    ) {
      if (
        GUIDE_PAGES[page] &&
        !guideState.discoveredPages.includes(page)
      ) {
        guideState.discoveredPages.push(page);
      }
    }
  }

  if (
    Array.isArray(
      GAME.guide?.discoveredRecipes
    )
  ) {
    for (
      const recipe
      of GAME.guide.discoveredRecipes
    ) {
      if (
        GUIDE_RECIPES[recipe] &&
        !guideState.discoveredRecipes.includes(recipe)
      ) {
        guideState.discoveredRecipes.push(recipe);
      }
    }
  }

  discoverDefaults();
}

// --------------------------------------------------
// SYSTEM API
// --------------------------------------------------

function initialize() {
  if (guideState.initialized) {
    return;
  }

  guideState.initialized = true;

  createGuideUI();
  setupDiscoveryEvents();
  setupKeyboard();
  syncFromGame();

  renderGuide();
}

function update() {
  // Guide is UI-driven, so no heavy
  // per-frame work is required.
}

function getState() {
  return {
    open: guideState.open,
    currentPage: guideState.currentPage,
    currentSection: guideState.currentSection,
    discoveredPages: [
      ...guideState.discoveredPages
    ],
    discoveredRecipes: [
      ...guideState.discoveredRecipes
    ]
  };
}

function destroy() {
  closeGuide();

  if (guideState.ui?.parentNode) {
    guideState.ui.parentNode.removeChild(
      guideState.ui
    );
  }

  guideState.ui = null;
  guideState.pageList = null;
  guideState.content = null;
  guideState.initialized = false;
}

// --------------------------------------------------
// REGISTER
// --------------------------------------------------

SurvivalVR.systems.guide = {
  state: guideState,

  GUIDE_PAGES,
  GUIDE_RECIPES,

  initialize,
  update,

  open: openGuide,
  close: closeGuide,
  toggle: toggleGuide,

  discoverPage,
  discoverRecipe,

  getState,
  destroy
};

initialize();

export {
  GUIDE_PAGES,
  GUIDE_RECIPES,
  guideState,
  initialize,
  update,
  openGuide,
  closeGuide,
  toggleGuide,
  discoverPage,
  discoverRecipe
};