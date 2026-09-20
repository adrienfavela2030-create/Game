// home.js
// Survival VR - Home / Main Menu System

const {
  GAME,
  gameEvent,
  createNewWorld,
  setPaused
} = window.SurvivalVR;

const homeState = {
  initialized: false,
  open: false,
  firstOpen: true
};

// ------------------------------------------------------------
// CREATE HOME UI
// ------------------------------------------------------------

function createHomeUI() {
  if (document.getElementById("homeUI")) {
    return;
  }

  const overlay = document.createElement("div");

  overlay.id = "homeUI";
  overlay.className = "uiOverlay hidden";

  overlay.innerHTML = `
    <div class="uiPanel homePanel">

      <div class="homeLogo">
        <div class="homeLogoIcon">🌲</div>

        <div>
          <h1>Survival Island</h1>
          <p>Explore • Build • Survive</p>
        </div>
      </div>

      <div class="homeWorldCard">

        <div class="homeWorldIcon">
          🌎
        </div>

        <div class="homeWorldInfo">

          <strong id="homeWorldName">
            Survival World
          </strong>

          <span id="homeWorldSeed">
            Seed: Unknown
          </span>

          <span id="homeWorldDay">
            Day 1
          </span>

        </div>

      </div>

      <div class="homeButtons">

        <button
          class="primaryButton homeButton"
          id="homeContinueButton"
        >
          ▶ Continue
        </button>

        <button
          class="secondaryButton homeButton"
          id="homeInventoryButton"
        >
          🎒 Inventory
        </button>

        <button
          class="secondaryButton homeButton"
          id="homeCraftingButton"
        >
          🛠 Crafting
        </button>

        <button
          class="secondaryButton homeButton"
          id="homeBuildingButton"
        >
          🏠 Building
        </button>

        <button
          class="secondaryButton homeButton"
          id="homeGuideButton"
        >
          📖 Guide
        </button>

        <button
          class="secondaryButton homeButton"
          id="homeSaveButton"
        >
          💾 Save / Load
        </button>

        <button
          class="secondaryButton homeButton"
          id="homeSettingsButton"
        >
          ⚙️ Settings
        </button>

        <button
          class="dangerButton homeButton"
          id="homeNewWorldButton"
        >
          🌎 New World
        </button>

      </div>

      <div class="homeFooter">
        <span>Survival VR</span>
        <span id="homeVersion">
          Version 3
        </span>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // ----------------------------------------------------------
  // BUTTONS
  // ----------------------------------------------------------

  document
    .getElementById("homeContinueButton")
    .addEventListener(
      "click",
      continueGame
    );

  document
    .getElementById("homeInventoryButton")
    .addEventListener(
      "click",
      openInventory
    );

  document
    .getElementById("homeCraftingButton")
    .addEventListener(
      "click",
      openCrafting
    );

  document
    .getElementById("homeBuildingButton")
    .addEventListener(
      "click",
      openBuilding
    );

  document
    .getElementById("homeGuideButton")
    .addEventListener(
      "click",
      openGuide
    );

  document
    .getElementById("homeSaveButton")
    .addEventListener(
      "click",
      openSave
    );

  document
    .getElementById("homeSettingsButton")
    .addEventListener(
      "click",
      openSettings
    );

  document
    .getElementById("homeNewWorldButton")
    .addEventListener(
      "click",
      confirmNewWorld
    );

  refreshHome();
}

// ------------------------------------------------------------
// REFRESH WORLD INFORMATION
// ------------------------------------------------------------

function refreshHome() {
  const worldName =
    document.getElementById(
      "homeWorldName"
    );

  const worldSeed =
    document.getElementById(
      "homeWorldSeed"
    );

  const worldDay =
    document.getElementById(
      "homeWorldDay"
    );

  const version =
    document.getElementById(
      "homeVersion"
    );

  if (worldName) {
    worldName.textContent =
      GAME.world?.name ||
      "Survival World";
  }

  if (worldSeed) {
    worldSeed.textContent =
      `Seed: ${
        GAME.world?.seed ||
        "Unknown"
      }`;
  }

  if (worldDay) {
    worldDay.textContent =
      `Day ${
        GAME.world?.day ||
        1
      }`;
  }

  if (version) {
    version.textContent =
      `Version ${
        GAME.version ||
        3
      }`;
  }
}

// ------------------------------------------------------------
// OPEN
// ------------------------------------------------------------

function openHome() {
  const ui =
    document.getElementById(
      "homeUI"
    );

  if (!ui) {
    createHomeUI();
  }

  refreshHome();

  const panel =
    document.getElementById(
      "homeUI"
    );

  if (!panel) {
    return;
  }

  panel.classList.remove(
    "hidden"
  );

  homeState.open = true;

  if (GAME.state.started) {
    setPaused(true);
  }

  gameEvent(
    "home-opened"
  );
}

// ------------------------------------------------------------
// CLOSE
// ------------------------------------------------------------

function closeHome() {
  const panel =
    document.getElementById(
      "homeUI"
    );

  if (!panel) {
    return;
  }

  panel.classList.add(
    "hidden"
  );

  homeState.open = false;

  gameEvent(
    "home-closed"
  );
}

// ------------------------------------------------------------
// TOGGLE
// ------------------------------------------------------------

function toggleHome() {
  if (homeState.open) {
    closeHome();
  } else {
    openHome();
  }
}

// ------------------------------------------------------------
// CONTINUE
// ------------------------------------------------------------

function continueGame() {
  closeHome();

  setPaused(false);

  gameEvent(
    "game-resumed"
  );
}

// ------------------------------------------------------------
// INVENTORY
// ------------------------------------------------------------

function openInventory() {
  closeHome();

  const inventory =
    window.SurvivalVR.systems
      ?.inventory;

  if (
    inventory &&
    typeof inventory.open ===
      "function"
  ) {
    inventory.open();

    return;
  }

  if (
    inventory &&
    typeof inventory.toggle ===
      "function"
  ) {
    inventory.toggle();
  }
}

// ------------------------------------------------------------
// CRAFTING
// ------------------------------------------------------------

function openCrafting() {
  closeHome();

  const crafting =
    window.SurvivalVR.systems
      ?.crafting;

  if (
    crafting &&
    typeof crafting.open ===
      "function"
  ) {
    crafting.open();

    return;
  }

  if (
    crafting &&
    typeof crafting.toggle ===
      "function"
  ) {
    crafting.toggle();
  }
}

// ------------------------------------------------------------
// BUILDING
// ------------------------------------------------------------

function openBuilding() {
  closeHome();

  const building =
    window.SurvivalVR.systems
      ?.building;

  if (
    building &&
    typeof building.open ===
      "function"
  ) {
    building.open();

    return;
  }

  if (
    building &&
    typeof building.toggle ===
      "function"
  ) {
    building.toggle();
  }
}

// ------------------------------------------------------------
// GUIDE
// ------------------------------------------------------------

function openGuide() {
  closeHome();

  const guide =
    window.SurvivalVR.systems
      ?.guide;

  if (
    guide &&
    typeof guide.open ===
      "function"
  ) {
    guide.open();

    return;
  }

  if (
    guide &&
    typeof guide.toggle ===
      "function"
  ) {
    guide.toggle();
  }
}

// ------------------------------------------------------------
// SAVE
// ------------------------------------------------------------

function openSave() {
  closeHome();

  const save =
    window.SurvivalVR.systems
      ?.save;

  if (
    save &&
    typeof save.open ===
      "function"
  ) {
    save.open();

    return;
  }

  if (
    save &&
    typeof save.toggle ===
      "function"
  ) {
    save.toggle();
  }
}

// ------------------------------------------------------------
// SETTINGS
// ------------------------------------------------------------

function openSettings() {
  closeHome();

  const settings =
    window.SurvivalVR.systems
      ?.settings;

  if (
    settings &&
    typeof settings.open ===
      "function"
  ) {
    settings.open();

    return;
  }

  if (
    settings &&
    typeof settings.toggle ===
      "function"
  ) {
    settings.toggle();
  }
}

// ------------------------------------------------------------
// NEW WORLD
// ------------------------------------------------------------

function confirmNewWorld() {
  const confirmed =
    window.confirm(
      "Start a new world?\n\nYour current world will stay in the save system, but a new procedural world will be generated."
    );

  if (!confirmed) {
    return;
  }

  startNewWorld();
}

function startNewWorld() {
  const world =
    window.SurvivalVR
      .systems?.world;

  let seed = null;

  /*
   * Let world.js create the new
   * Minecraft-style seed.
   */
  if (
    world &&
    typeof world.createNewWorld ===
      "function"
  ) {
    seed =
      world.createNewWorld();
  } else if (
    typeof window.SurvivalVR
      .createNewWorld ===
      "function"
  ) {
    seed =
      window.SurvivalVR
      .createNewWorld();
  } else {
    console.error(
      "[SurvivalVR] World system is unavailable."
    );

    showMessage(
      "World system unavailable"
    );

    return;
  }

  GAME.state.started = true;
  GAME.state.gameOver = false;
  GAME.state.paused = false;

  closeHome();

  refreshHome();

  gameEvent(
    "new-world-created"
  );

  showMessage(
    `New world: ${
      seed ||
      GAME.world?.seed ||
      "Generated"
    }`
  );
}

// ------------------------------------------------------------
// ESCAPE / MENU
// ------------------------------------------------------------

function setupKeyboard() {
  window.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape"
      ) {
        toggleHome();
      }
    }
  );
}

function setupMenuButton() {
  window.addEventListener(
    "survival-menu-button",
    () => {
      toggleHome();
    }
  );
}

// ------------------------------------------------------------
// GAME EVENTS
// ------------------------------------------------------------

function setupEvents() {
  window.addEventListener(
    "survival-world-generated",
    () => {
      refreshHome();
    }
  );

  window.addEventListener(
    "survival-game-loaded",
    () => {
      refreshHome();
    }
  );

  window.addEventListener(
    "survival-new-world-created",
    () => {
      refreshHome();
    }
  );
}

// ------------------------------------------------------------
// MESSAGE
// ------------------------------------------------------------

function showMessage(message) {
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
    showMessage.timer
  );

  showMessage.timer =
    setTimeout(() => {
      element.classList.remove(
        "show"
      );
    }, 2500);
}

// ------------------------------------------------------------
// PUBLIC SYSTEM
// ------------------------------------------------------------

const homeSystem = {
  state: homeState,

  open:
    openHome,

  close:
    closeHome,

  toggle:
    toggleHome,

  refresh:
    refreshHome,

  newWorld:
    startNewWorld
};

// ------------------------------------------------------------
// REGISTER
// ------------------------------------------------------------

window.SurvivalVR.systems.home =
  homeSystem;

window.SurvivalVR.home =
  homeSystem;

// ------------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------------

createHomeUI();

setupKeyboard();

setupMenuButton();

setupEvents();

homeState.initialized = true;

console.log(
  "[SurvivalVR] Home system initialized"
);

export {
  homeSystem,
  openHome,
  closeHome,
  toggleHome
};