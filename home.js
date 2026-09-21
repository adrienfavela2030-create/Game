/* =========================================================
   HOME / MAIN MENU SYSTEM
   Survival Island VR
========================================================= */

const S = window.SurvivalVR;

if (!S) {
  throw new Error(
    "SurvivalVR must exist before home.js loads."
  );
}

/* =========================================================
   STATE
========================================================= */

const state = {
  initialized: false,
  menuOpen: true,
  panelOpen: false,
  currentPanel: null
};

/* =========================================================
   HELPERS
========================================================= */

function getElement(id) {
  return document.getElementById(id);
}

function createElement(
  tag,
  className = "",
  text = ""
) {
  const element =
    document.createElement(tag);

  if (className) {
    element.className =
      className;
  }

  if (text) {
    element.textContent =
      text;
  }

  return element;
}

function showMessage(
  text,
  duration = 2500
) {
  let message =
    getElement(
      "survival-home-message"
    );

  if (!message) {
    message =
      createElement(
        "div",
        "survival-home-message"
      );

    message.id =
      "survival-home-message";

    document.body.appendChild(
      message
    );
  }

  message.textContent =
    text;

  message.classList.add(
    "show"
  );

  clearTimeout(
    message._timer
  );

  message._timer =
    setTimeout(() => {
      message.classList.remove(
        "show"
      );
    }, duration);
}

/* =========================================================
   HOME UI
========================================================= */

function createHomeUI() {
  if (
    getElement(
      "survival-home"
    )
  ) {
    return;
  }

  const home =
    createElement(
      "div",
      "survival-home"
    );

  home.id =
    "survival-home";

  /*
   * Background.
   */
  const background =
    createElement(
      "div",
      "survival-home-background"
    );

  /*
   * Main panel.
   */
  const panel =
    createElement(
      "div",
      "survival-home-panel"
    );

  /*
   * Logo.
   */
  const logo =
    createElement(
      "div",
      "survival-home-logo"
    );

  const logoSmall =
    createElement(
      "div",
      "survival-home-eyebrow",
      "SURVIVAL ISLAND"
    );

  const title =
    createElement(
      "div",
      "survival-home-title",
      "SURVIVAL"
    );

  const title2 =
    createElement(
      "div",
      "survival-home-title survival-home-title-accent",
      "ISLAND VR"
    );

  const subtitle =
    createElement(
      "div",
      "survival-home-subtitle",
      "Explore • Gather • Craft • Survive"
    );

  logo.appendChild(
    logoSmall
  );

  logo.appendChild(
    title
  );

  logo.appendChild(
    title2
  );

  logo.appendChild(
    subtitle
  );

  /*
   * Menu.
   */
  const menu =
    createElement(
      "div",
      "survival-home-menu"
    );

  const newGame =
    createMenuButton(
      "NEW GAME",
      "Start a new island"
    );

  const continueButton =
    createMenuButton(
      "CONTINUE",
      "Continue your saved world"
    );

  const settingsButton =
    createMenuButton(
      "SETTINGS",
      "Game and VR settings"
    );

  /*
   * Footer.
   */
  const footer =
    createElement(
      "div",
      "survival-home-footer",
      "SURVIVAL ISLAND VR"
    );

  menu.appendChild(
    newGame
  );

  menu.appendChild(
    continueButton
  );

  menu.appendChild(
    settingsButton
  );

  panel.appendChild(
    logo
  );

  panel.appendChild(
    menu
  );

  panel.appendChild(
    footer
  );

  home.appendChild(
    background
  );

  home.appendChild(
    panel
  );

  document.body.appendChild(
    home
  );

  /*
   * Button events.
   */
  newGame.addEventListener(
    "click",
    () => {
      openNewGameConfirm();
    }
  );

  continueButton.addEventListener(
    "click",
    () => {
      continueGame();
    }
  );

  settingsButton.addEventListener(
    "click",
    () => {
      openSettings();
    }
  );

  updateContinueButton();

  state.initialized =
    true;
}

function createMenuButton(
  title,
  description
) {
  const button =
    createElement(
      "button",
      "survival-home-button"
    );

  const buttonTitle =
    createElement(
      "span",
      "survival-home-button-title",
      title
    );

  const buttonDescription =
    createElement(
      "span",
      "survival-home-button-description",
      description
    );

  button.appendChild(
    buttonTitle
  );

  button.appendChild(
    buttonDescription
  );

  return button;
}

/* =========================================================
   NEW GAME CONFIRMATION
========================================================= */

function openNewGameConfirm() {
  closePanel();

  const overlay =
    createElement(
      "div",
      "survival-home-overlay"
    );

  overlay.id =
    "survival-new-game-confirm";

  const box =
    createElement(
      "div",
      "survival-home-dialog"
    );

  const title =
    createElement(
      "h2",
      "",
      "NEW ISLAND"
    );

  const text =
    createElement(
      "p",
      "",
      "A new island will be generated from a new seed. Your current unsaved progress will be replaced."
    );

  const seedLabel =
    createElement(
      "div",
      "survival-seed-label",
      "WORLD SEED"
    );

  const seedInput =
    createElement(
      "input",
      "survival-seed-input"
    );

  seedInput.type =
    "text";

  seedInput.placeholder =
    "Leave blank for a random seed";

  seedInput.maxLength =
    40;

  const buttons =
    createElement(
      "div",
      "survival-dialog-buttons"
    );

  const start =
    createElement(
      "button",
      "survival-primary-button",
      "CREATE WORLD"
    );

  const cancel =
    createElement(
      "button",
      "survival-secondary-button",
      "CANCEL"
    );

  buttons.appendChild(
    start
  );

  buttons.appendChild(
    cancel
  );

  box.appendChild(
    title
  );

  box.appendChild(
    text
  );

  box.appendChild(
    seedLabel
  );

  box.appendChild(
    seedInput
  );

  box.appendChild(
    buttons
  );

  overlay.appendChild(
    box
  );

  document.body.appendChild(
    overlay
  );

  start.addEventListener(
    "click",
    () => {
      const seed =
        seedInput.value.trim();

      overlay.remove();

      startNewGame(
        seed || undefined
      );
    }
  );

  cancel.addEventListener(
    "click",
    () => {
      overlay.remove();
    }
  );

  seedInput.focus();
}

/* =========================================================
   START NEW GAME
========================================================= */

async function startNewGame(
  seed
) {
  showMessage(
    "Generating your island...",
    5000
  );

  try {
    /*
     * Reset the game state first.
     */
    if (
      typeof S.resetGame ===
      "function"
    ) {
      S.resetGame();
    }

    /*
     * Generate a completely new world.
     */
    let world;

    if (
      S.systems.world &&
      typeof S.systems.world.createNewWorld ===
        "function"
    ) {
      world =
        S.systems.world.createNewWorld(
          seed
        );
    } else if (
      typeof S.createNewWorld ===
      "function"
    ) {
      world =
        S.createNewWorld(
          seed
        );
    } else {
      throw new Error(
        "World system is not ready."
      );
    }

    /*
     * Make sure the seed is stored.
     */
    if (
      world?.seed &&
      typeof S.setWorldSeed ===
        "function"
    ) {
      S.setWorldSeed(
        world.seed
      );
    }

    /*
     * Reset the player's starting
     * position.
     */
    if (
      S.playerRig
    ) {
      const worldSystem =
        S.systems.world;

      let groundY =
        1.8;

      if (
        worldSystem &&
        typeof worldSystem.getTerrainHeightAt ===
          "function"
      ) {
        groundY =
          worldSystem.getTerrainHeightAt(
            0,
            5
          );
      }

      S.playerRig.position.set(
        0,
        groundY,
        5
      );

      S.playerRig.rotation.set(
        0,
        0,
        0
      );
    }

    /*
     * Start the actual game.
     */
    if (
      typeof S.startGame ===
      "function"
    ) {
      await S.startGame();
    } else {
      /*
       * Fallback for the current
       * architecture.
       */
      if (
        S.GAME?.state
      ) {
        S.GAME.state.started =
          true;

        S.GAME.state.paused =
          false;

        S.GAME.state.gameOver =
          false;
      }

      if (
        typeof S.setPaused ===
        "function"
      ) {
        S.setPaused(
          false
        );
      }
    }

    hideHome();

    showMessage(
      "Island created. Survive.",
      3000
    );

    state.menuOpen =
      false;

    updateContinueButton();

    dispatchHomeEvent(
      "new-game-started",
      {
        seed:
          world?.seed ||
          S.GAME?.world?.seed ||
          ""
      }
    );
  } catch (error) {
    console.error(
      "Could not start new game:",
      error
    );

    showMessage(
      "Could not create the island. Check the world system.",
      5000
    );
  }
}

/* =========================================================
   CONTINUE
========================================================= */

async function continueGame() {
  /*
   * Find save system.
   */
  const saveSystem =
    S.systems.save;

  let loaded =
    false;

  try {
    if (
      saveSystem &&
      typeof saveSystem.loadGame ===
        "function"
    ) {
      loaded =
        await saveSystem.loadGame();
    } else if (
      typeof S.loadGameData ===
      "function"
    ) {
      const result =
        S.loadGameData();

      loaded =
        result !== false;
    } else if (
      typeof saveSystem?.load ===
      "function"
    ) {
      loaded =
        await saveSystem.load();
    }
  } catch (error) {
    console.error(
      "Continue failed:",
      error
    );

    loaded =
      false;
  }

  if (!loaded) {
    showMessage(
      "No saved world was found.",
      3000
    );

    return;
  }

  /*
   * Rebuild the procedural world
   * from the saved seed.
   */
  const seed =
    S.GAME?.world?.seed ||
    S.worldData?.seed;

  if (!seed) {
    showMessage(
      "The save does not contain a world seed.",
      4000
    );

    return;
  }

  try {
    showMessage(
      "Loading your island...",
      5000
    );

    if (
      S.systems.world &&
      typeof S.systems.world.generateWorld ===
        "function"
    ) {
      S.systems.world.generateWorld(
        seed,
        {
          preservePlayer: true
        }
      );
    }

    /*
     * Restore player position.
     */
    if (
      S.playerRig &&
      S.GAME?.position
    ) {
      S.playerRig.position.set(
        S.GAME.position.x || 0,
        S.GAME.position.y || 1.8,
        S.GAME.position.z || 5
      );

      S.playerRig.rotation.y =
        S.GAME.position.rotationY ||
        0;
    }

    /*
     * Restore resource state.
     */
    if (
      S.systems.world &&
      typeof S.systems.world.restoreResourceState ===
        "function" &&
      S.GAME?.worldResources
    ) {
      S.systems.world.restoreResourceState(
        S.GAME.worldResources
      );
    }

    /*
     * Restore buildings.
     */
    if (
      S.systems.building &&
      typeof S.systems.building.restoreBuildings ===
        "function" &&
      S.GAME?.buildings?.placed
    ) {
      S.systems.building.restoreBuildings(
        S.GAME.buildings.placed
      );
    }

    /*
     * Start gameplay.
     */
    if (
      S.GAME?.state
    ) {
      S.GAME.state.started =
        true;

      S.GAME.state.paused =
        false;

      S.GAME.state.gameOver =
        false;
    }

    if (
      typeof S.setPaused ===
      "function"
    ) {
      S.setPaused(
        false
      );
    }

    if (
      typeof S.setVRState ===
      "function"
    ) {
      S.setVRState(
        !!S.isXR
      );
    }

    hideHome();

    state.menuOpen =
      false;

    showMessage(
      "World loaded.",
      2500
    );

    dispatchHomeEvent(
      "game-continued",
      {
        seed
      }
    );
  } catch (error) {
    console.error(
      "Could not rebuild saved world:",
      error
    );

    showMessage(
      "The saved world could not be loaded.",
      5000
    );
  }
}

/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {
  closePanel();

  /*
   * Prefer the real settings system.
   */
  const settingsSystem =
    S.systems.settings;

  if (
    settingsSystem &&
    typeof settingsSystem.openSettings ===
      "function"
  ) {
    settingsSystem.openSettings();
    return;
  }

  if (
    settingsSystem &&
    typeof settingsSystem.open ===
      "function"
  ) {
    settingsSystem.open();
    return;
  }

  /*
   * Fallback settings panel.
   */
  createFallbackSettings();
}

function createFallbackSettings() {
  const overlay =
    createElement(
      "div",
      "survival-home-overlay"
    );

  overlay.id =
    "survival-home-settings";

  const box =
    createElement(
      "div",
      "survival-home-dialog survival-settings-dialog"
    );

  const title =
    createElement(
      "h2",
      "",
      "SETTINGS"
    );

  const info =
    createElement(
      "p",
      "",
      "Use the full Settings panel during gameplay for graphics, audio, and VR options."
    );

  const close =
    createElement(
      "button",
      "survival-primary-button",
      "BACK"
    );

  box.appendChild(
    title
  );

  box.appendChild(
    info
  );

  box.appendChild(
    close
  );

  overlay.appendChild(
    box
  );

  document.body.appendChild(
    overlay
  );

  close.addEventListener(
    "click",
    () => {
      overlay.remove();
    }
  );
}

/* =========================================================
   IN-GAME HOME / PAUSE MENU
========================================================= */

function openHomeMenu() {
  if (
    !S.GAME?.state?.started
  ) {
    showHome();
    return;
  }

  const overlay =
    createElement(
      "div",
      "survival-home-overlay"
    );

  overlay.id =
    "survival-pause-menu";

  const box =
    createElement(
      "div",
      "survival-home-dialog survival-pause-dialog"
    );

  const title =
    createElement(
      "h2",
      "",
      "SURVIVAL ISLAND"
    );

  const resume =
    createElement(
      "button",
      "survival-primary-button",
      "RESUME"
    );

  const inventory =
    createElement(
      "button",
      "survival-secondary-button",
      "INVENTORY"
    );

  const crafting =
    createElement(
      "button",
      "survival-secondary-button",
      "CRAFTING"
    );

  const building =
    createElement(
      "button",
      "survival-secondary-button",
      "BUILDING"
    );

  const guide =
    createElement(
      "button",
      "survival-secondary-button",
      "GUIDE"
    );

  const save =
    createElement(
      "button",
      "survival-secondary-button",
      "SAVE"
    );

  const settings =
    createElement(
      "button",
      "survival-secondary-button",
      "SETTINGS"
    );

  const quit =
    createElement(
      "button",
      "survival-danger-button",
      "QUIT TO MENU"
    );

  const buttons = [
    resume,
    inventory,
    crafting,
    building,
    guide,
    save,
    settings,
    quit
  ];

  for (
    const button of
      buttons
  ) {
    box.appendChild(
      button
    );
  }

  overlay.appendChild(
    box
  );

  document.body.appendChild(
    overlay
  );

  if (
    typeof S.setPaused ===
    "function"
  ) {
    S.setPaused(
      true
    );
  }

  resume.addEventListener(
    "click",
    () => {
      overlay.remove();

      if (
        typeof S.setPaused ===
        "function"
      ) {
        S.setPaused(
          false
        );
      }
    }
  );

  inventory.addEventListener(
    "click",
    () => {
      openSystem(
        "inventory"
      );
    }
  );

  crafting.addEventListener(
    "click",
    () => {
      openSystem(
        "crafting"
      );
    }
  );

  building.addEventListener(
    "click",
    () => {
      openSystem(
        "building"
      );
    }
  );

  guide.addEventListener(
    "click",
    () => {
      openSystem(
        "guide"
      );
    }
  );

  save.addEventListener(
    "click",
    async () => {
      await saveGame();
    }
  );

  settings.addEventListener(
    "click",
    () => {
      openSettings();
    }
  );

  quit.addEventListener(
    "click",
    () => {
      overlay.remove();

      quitToMenu();
    }
  );
}

/* =========================================================
   OPEN SYSTEM
========================================================= */

function openSystem(
  systemName
) {
  const system =
    S.systems[
      systemName
    ];

  if (!system) {
    showMessage(
      `${systemName} system is not ready.`,
      3000
    );

    return;
  }

  const methods = [
    "open",
    `open${capitalize(systemName)}`,
    `show${capitalize(systemName)}`,
    "toggle"
  ];

  for (
    const method of
      methods
  ) {
    if (
      typeof system[method] ===
      "function"
    ) {
      system[method]();
      return;
    }
  }

  showMessage(
    `${systemName} panel is not available yet.`,
    3000
  );
}

function capitalize(
  value
) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

/* =========================================================
   SAVE
========================================================= */

async function saveGame() {
  try {
    const saveSystem =
      S.systems.save;

    if (
      saveSystem &&
      typeof saveSystem.saveGame ===
        "function"
    ) {
      await saveSystem.saveGame();

      showMessage(
        "Game saved.",
        2500
      );

      updateContinueButton();

      return true;
    }

    if (
      saveSystem &&
      typeof saveSystem.save ===
        "function"
    ) {
      await saveSystem.save();

      showMessage(
        "Game saved.",
        2500
      );

      updateContinueButton();

      return true;
    }

    if (
      typeof S.markSaved ===
      "function"
    ) {
      S.markSaved();

      showMessage(
        "Game marked as saved.",
        2500
      );

      updateContinueButton();

      return true;
    }

    showMessage(
      "Save system is not ready.",
      3000
    );

    return false;
  } catch (error) {
    console.error(
      "Save failed:",
      error
    );

    showMessage(
      "Could not save the game.",
      4000
    );

    return false;
  }
}

/* =========================================================
   QUIT TO MENU
========================================================= */

function quitToMenu() {
  try {
    if (
      typeof S.setPaused ===
      "function"
    ) {
      S.setPaused(
        true
      );
    }

    if (
      S.GAME?.state
    ) {
      S.GAME.state.started =
        false;

      S.GAME.state.paused =
        true;
    }

    showHome();

    state.menuOpen =
      true;

    dispatchHomeEvent(
      "returned-to-menu"
    );
  } catch (error) {
    console.error(
      "Could not return to menu:",
      error
    );
  }
}

/* =========================================================
   SHOW / HIDE
========================================================= */

function showHome() {
  const home =
    getElement(
      "survival-home"
    );

  if (!home) {
    createHomeUI();
    return;
  }

  home.classList.remove(
    "hidden"
  );

  state.menuOpen =
    true;

  updateContinueButton();
}

function hideHome() {
  const home =
    getElement(
      "survival-home"
    );

  if (home) {
    home.classList.add(
      "hidden"
    );
  }

  state.menuOpen =
    false;
}

/* =========================================================
   CONTINUE BUTTON
========================================================= */

function updateContinueButton() {
  const home =
    getElement(
      "survival-home"
    );

  if (!home) {
    return;
  }

  const buttons =
    home.querySelectorAll(
      ".survival-home-button"
    );

  if (
    buttons.length < 2
  ) {
    return;
  }

  const continueButton =
    buttons[1];

  const hasSave =
    !!(
      S.GAME?.save?.hasSave ||
      S.GAME?.save?.lastSaved ||
      S.GAME?.world?.seed
    );

  /*
   * A world seed alone doesn't necessarily
   * mean a saved game exists. Prefer the
   * actual save flag when available.
   */
  const actualSave =
    !!(
      S.GAME?.save?.hasSave ||
      S.GAME?.save?.lastSaved
    );

  continueButton.disabled =
    !actualSave;

  continueButton.style.opacity =
    actualSave
      ? "1"
      : "0.45";

  continueButton.style.pointerEvents =
    actualSave
      ? "auto"
      : "none";

  if (actualSave) {
    const description =
      continueButton.querySelector(
        ".survival-home-button-description"
      );

    if (description) {
      description.textContent =
        "Continue your saved world";
    }
  } else {
    const description =
      continueButton.querySelector(
        ".survival-home-button-description"
      );

    if (description) {
      description.textContent =
        "No saved world";
    }
  }
}

/* =========================================================
   PANEL HELPERS
========================================================= */

function closePanel() {
  const ids = [
    "survival-new-game-confirm",
    "survival-home-settings",
    "survival-pause-menu"
  ];

  for (
    const id of ids
  ) {
    const element =
      getElement(id);

    if (element) {
      element.remove();
    }
  }

  state.panelOpen =
    false;

  state.currentPanel =
    null;
}

/* =========================================================
   EVENTS
========================================================= */

function dispatchHomeEvent(
  name,
  detail = {}
) {
  try {
    window.dispatchEvent(
      new CustomEvent(
        `survival-${name}`,
        {
          detail
        }
      )
    );
  } catch {
    /* Ignore event errors. */
  }
}

/* =========================================================
   KEYBOARD / DESKTOP SUPPORT
========================================================= */

function handleKeyDown(
  event
) {
  /*
   * Escape opens the pause menu
   * once gameplay has started.
   */
  if (
    event.key ===
    "Escape"
  ) {
    if (
      S.GAME?.state?.started &&
      !state.menuOpen
    ) {
      openHomeMenu();
    }
  }

  /*
   * H = Home menu.
   */
  if (
    event.key.toLowerCase() ===
      "h" &&
    S.GAME?.state?.started
  ) {
    openHomeMenu();
  }
}

/* =========================================================
   AUTO MENU LOGIC
========================================================= */

function checkInitialState() {
  /*
   * The game should NOT automatically
   * start just because the page loaded.
   */
  if (
    !S.GAME?.state?.started
  ) {
    showHome();
    return;
  }

  /*
   * If another system already started
   * the game, hide the menu.
   */
  hideHome();
}

/* =========================================================
   SETUP
========================================================= */

function setupHome() {
  if (
    state.initialized
  ) {
    return;
  }

  createHomeUI();

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  /*
   * New game.
   */
  window.addEventListener(
    "survival-new-world-created",
    () => {
      updateContinueButton();
    }
  );

  /*
   * Save events.
   */
  window.addEventListener(
    "survival-game-saved",
    () => {
      updateContinueButton();
    }
  );

  /*
   * When gameplay begins,
   * hide the launch menu.
   */
  window.addEventListener(
    "survival-game-started",
    () => {
      hideHome();
    }
  );

  /*
   * If game code dispatches world generated
   * before the menu is interacted with,
   * don't automatically start gameplay.
   */
  setTimeout(
    checkInitialState,
    50
  );
}

/* =========================================================
   PUBLIC API
========================================================= */

function isHomeOpen() {
  return state.menuOpen;
}

function toggleHome() {
  if (
    state.menuOpen
  ) {
    hideHome();
  } else {
    openHomeMenu();
  }
}

function getHomeState() {
  return {
    menuOpen:
      state.menuOpen,

    panelOpen:
      state.panelOpen,

    currentPanel:
      state.currentPanel
  };
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  setupHome,

  showHome,
  hideHome,

  openHomeMenu,

  startNewGame,
  continueGame,

  openSettings,
  saveGame,

  quitToMenu,

  isHomeOpen,
  toggleHome,

  updateContinueButton,

  getHomeState
};

export default {
  setupHome,

  showHome,
  hideHome,

  openHomeMenu,

  startNewGame,
  continueGame,

  openSettings,
  saveGame,

  quitToMenu,

  isHomeOpen,
  toggleHome,

  updateContinueButton,

  getHomeState
};