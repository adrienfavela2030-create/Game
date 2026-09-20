// save.js
// Survival VR - Save / Load System

const {
  GAME,
  getGameData,
  loadGameData,
  markSaved,
  gameEvent
} = window.SurvivalVR;

// ------------------------------------------------------------
// SAVE SETTINGS
// ------------------------------------------------------------

const SAVE_KEY = "survival_vr_save_v3";
const BACKUP_KEY = "survival_vr_save_backup_v3";

const saveState = {
  initialized: false,
  autoSaveEnabled: true,
  autoSaveInterval: 30000,
  autoSaveTimer: null,
  lastSaveTime: null,
  lastSaveSize: 0,
  saving: false,
  loaded: false
};

// ------------------------------------------------------------
// STORAGE HELPERS
// ------------------------------------------------------------

function storageAvailable() {
  try {
    const testKey = "__survival_vr_test__";

    localStorage.setItem(
      testKey,
      "1"
    );

    localStorage.removeItem(
      testKey
    );

    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------
// SERIALIZATION
// ------------------------------------------------------------

function createSaveData() {
  const data = getGameData();

  return {
    saveVersion: 3,

    savedAt:
      new Date().toISOString(),

    gameVersion:
      typeof GAME.version === "number"
        ? GAME.version
        : 3,

    game: data
  };
}

function serializeSave(data) {
  return JSON.stringify(
    data
  );
}

// ------------------------------------------------------------
// SAVE
// ------------------------------------------------------------

function saveGame(options = {}) {
  if (saveState.saving) {
    return false;
  }

  if (!storageAvailable()) {
    showMessage(
      "Saving is not available"
    );

    return false;
  }

  saveState.saving = true;

  try {
    const saveData =
      createSaveData();

    const serialized =
      serializeSave(
        saveData
      );

    // Keep a backup of the previous save.
    const oldSave =
      localStorage.getItem(
        SAVE_KEY
      );

    if (oldSave) {
      localStorage.setItem(
        BACKUP_KEY,
        oldSave
      );
    }

    localStorage.setItem(
      SAVE_KEY,
      serialized
    );

    saveState.lastSaveTime =
      Date.now();

    saveState.lastSaveSize =
      serialized.length;

    markSaved();

    gameEvent(
      "game-saved"
    );

    if (
      options.showMessage !== false
    ) {
      showMessage(
        "Game saved"
      );
    }

    refreshSaveUI();

    return true;
  } catch (error) {
    console.error(
      "[SurvivalVR] Save failed:",
      error
    );

    showMessage(
      "Could not save game"
    );

    return false;
  } finally {
    saveState.saving = false;
  }
}

// ------------------------------------------------------------
// LOAD
// ------------------------------------------------------------

function loadGame(options = {}) {
  if (!storageAvailable()) {
    showMessage(
      "Loading is not available"
    );

    return false;
  }

  try {
    const serialized =
      localStorage.getItem(
        SAVE_KEY
      );

    if (!serialized) {
      showMessage(
        "No saved game found"
      );

      return false;
    }

    const saveData =
      JSON.parse(
        serialized
      );

    if (
      !saveData ||
      typeof saveData !== "object"
    ) {
      throw new Error(
        "Invalid save file"
      );
    }

    if (!saveData.game) {
      throw new Error(
        "Save data is missing game state"
      );
    }

    loadGameData(
      saveData.game
    );

    saveState.loaded =
      true;

    saveState.lastSaveTime =
      saveData.savedAt
        ? new Date(
            saveData.savedAt
          ).getTime()
        : null;

    gameEvent(
      "game-loaded"
    );

    /*
     * The world generator uses GAME.world.seed.
     * After loading, regenerate the world using
     * that exact seed.
     */
    if (
      window.SurvivalVR.world &&
      typeof
        window.SurvivalVR.world.regenerateWorld ===
        "function"
    ) {
      window.SurvivalVR.world.regenerateWorld();
    }

    showMessage(
      "Game loaded"
    );

    refreshSaveUI();

    return true;
  } catch (error) {
    console.error(
      "[SurvivalVR] Load failed:",
      error
    );

    showMessage(
      "Save file could not be loaded"
    );

    return false;
  }
}

// ------------------------------------------------------------
// BACKUP LOAD
// ------------------------------------------------------------

function loadBackup() {
  if (!storageAvailable()) {
    return false;
  }

  try {
    const backup =
      localStorage.getItem(
        BACKUP_KEY
      );

    if (!backup) {
      showMessage(
        "No backup found"
      );

      return false;
    }

    const saveData =
      JSON.parse(
        backup
      );

    if (
      !saveData ||
      !saveData.game
    ) {
      throw new Error(
        "Invalid backup"
      );
    }

    loadGameData(
      saveData.game
    );

    saveState.loaded =
      true;

    gameEvent(
      "game-loaded"
    );

    if (
      window.SurvivalVR.world &&
      typeof
        window.SurvivalVR.world.regenerateWorld ===
        "function"
    ) {
      window.SurvivalVR.world.regenerateWorld();
    }

    showMessage(
      "Backup loaded"
    );

    refreshSaveUI();

    return true;
  } catch (error) {
    console.error(
      "[SurvivalVR] Backup load failed:",
      error
    );

    showMessage(
      "Backup could not be loaded"
    );

    return false;
  }
}

// ------------------------------------------------------------
// DELETE SAVE
// ------------------------------------------------------------

function deleteSave() {
  if (!storageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(
      SAVE_KEY
    );

    localStorage.removeItem(
      BACKUP_KEY
    );

    saveState.lastSaveTime =
      null;

    saveState.lastSaveSize =
      0;

    gameEvent(
      "save-deleted"
    );

    showMessage(
      "Save deleted"
    );

    refreshSaveUI();

    return true;
  } catch (error) {
    console.error(
      "[SurvivalVR] Delete save failed:",
      error
    );

    return false;
  }
}

// ------------------------------------------------------------
// CHECK SAVE
// ------------------------------------------------------------

function hasSave() {
  if (!storageAvailable()) {
    return false;
  }

  return !!localStorage.getItem(
    SAVE_KEY
  );
}

function hasBackup() {
  if (!storageAvailable()) {
    return false;
  }

  return !!localStorage.getItem(
    BACKUP_KEY
  );
}

function getSaveInfo() {
  if (!storageAvailable()) {
    return null;
  }

  try {
    const serialized =
      localStorage.getItem(
        SAVE_KEY
      );

    if (!serialized) {
      return null;
    }

    const saveData =
      JSON.parse(
        serialized
      );

    return {
      exists: true,

      savedAt:
        saveData.savedAt || null,

      size:
        serialized.length,

      seed:
        saveData.game &&
        saveData.game.world
          ? saveData.game.world.seed
          : null,

      worldName:
        saveData.game &&
        saveData.game.world
          ? saveData.game.world.name
          : null,

      day:
        saveData.game &&
        saveData.game.world
          ? saveData.game.world.day
          : null
    };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// AUTO SAVE
// ------------------------------------------------------------

function startAutoSave() {
  stopAutoSave();

  if (
    !saveState.autoSaveEnabled
  ) {
    return;
  }

  saveState.autoSaveTimer =
    setInterval(
      () => {
        if (
          !GAME.state.started ||
          GAME.state.paused ||
          GAME.state.gameOver
        ) {
          return;
        }

        saveGame({
          showMessage: false
        });
      },
      saveState.autoSaveInterval
    );
}

function stopAutoSave() {
  if (
    saveState.autoSaveTimer
  ) {
    clearInterval(
      saveState.autoSaveTimer
    );

    saveState.autoSaveTimer =
      null;
  }
}

function setAutoSaveEnabled(
  enabled
) {
  saveState.autoSaveEnabled =
    Boolean(enabled);

  if (
    saveState.autoSaveEnabled
  ) {
    startAutoSave();
  } else {
    stopAutoSave();
  }

  refreshSaveUI();
}

// ------------------------------------------------------------
// SAVE UI
// ------------------------------------------------------------

function createSaveUI() {
  if (
    document.getElementById(
      "saveUI"
    )
  ) {
    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "saveUI";

  overlay.className =
    "uiOverlay hidden";

  overlay.innerHTML = `
    <div class="uiPanel savePanel">

      <div class="panelHeader">
        <div>
          <h2>Save & Load</h2>
          <p class="panelSubtitle">
            Your survival world
          </p>
        </div>

        <button
          class="closeButton"
          id="closeSaveButton"
        >
          ×
        </button>
      </div>

      <div
        class="saveCards"
        id="saveCards"
      ></div>

      <div class="saveActions">

        <button
          class="primaryButton"
          id="saveGameButton"
        >
          Save Game
        </button>

        <button
          class="secondaryButton"
          id="loadGameButton"
        >
          Load Game
        </button>

        <button
          class="secondaryButton"
          id="backupGameButton"
        >
          Load Backup
        </button>

        <button
          class="dangerButton"
          id="deleteSaveButton"
        >
          Delete Save
        </button>

      </div>

      <div class="saveAutoRow">

        <div>
          <strong>Auto Save</strong>
          <p>
            Automatically save every 30 seconds
          </p>
        </div>

        <label class="toggle">
          <input
            type="checkbox"
            id="autoSaveToggle"
            checked
          >
          <span class="toggleSlider"></span>
        </label>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  document
    .getElementById(
      "closeSaveButton"
    )
    .addEventListener(
      "click",
      closeSave
    );

  document
    .getElementById(
      "saveGameButton"
    )
    .addEventListener(
      "click",
      () => {
        saveGame();
      }
    );

  document
    .getElementById(
      "loadGameButton"
    )
    .addEventListener(
      "click",
      () => {
        loadGame();
      }
    );

  document
    .getElementById(
      "backupGameButton"
    )
    .addEventListener(
      "click",
      () => {
        loadBackup();
      }
    );

  document
    .getElementById(
      "deleteSaveButton"
    )
    .addEventListener(
      "click",
      () => {
        const confirmed =
          window.confirm(
            "Delete your saved survival world?"
          );

        if (confirmed) {
          deleteSave();
        }
      }
    );

  document
    .getElementById(
      "autoSaveToggle"
    )
    .addEventListener(
      "change",
      event => {
        setAutoSaveEnabled(
          event.target.checked
        );
      }
    );

  refreshSaveUI();
}

// ------------------------------------------------------------
// REFRESH SAVE UI
// ------------------------------------------------------------

function refreshSaveUI() {
  const cards =
    document.getElementById(
      "saveCards"
    );

  if (!cards) {
    return;
  }

  const info =
    getSaveInfo();

  if (!info) {
    cards.innerHTML = `
      <div class="saveCard emptySave">
        <div class="saveIcon">💾</div>

        <div>
          <strong>No Save Found</strong>

          <p>
            Your survival world has not
            been saved yet.
          </p>
        </div>
      </div>
    `;

    return;
  }

  const date =
    info.savedAt
      ? new Date(
          info.savedAt
        ).toLocaleString()
      : "Unknown";

  cards.innerHTML = `
    <div class="saveCard">

      <div class="saveIcon">
        🌎
      </div>

      <div class="saveDetails">

        <strong>
          ${escapeHTML(
            info.worldName ||
            "Survival World"
          )}
        </strong>

        <p>
          Seed:
          ${escapeHTML(
            info.seed ||
            "Unknown"
          )}
        </p>

        <p>
          Day:
          ${info.day || 1}
        </p>

        <p>
          Saved:
          ${escapeHTML(date)}
        </p>

      </div>

    </div>
  `;
}

// ------------------------------------------------------------
// OPEN / CLOSE
// ------------------------------------------------------------

function openSave() {
  const ui =
    document.getElementById(
      "saveUI"
    );

  if (!ui) {
    createSaveUI();
  }

  const panel =
    document.getElementById(
      "saveUI"
    );

  if (!panel) return;

  panel.classList.remove(
    "hidden"
  );

  saveState.open =
    true;

  refreshSaveUI();

  gameEvent(
    "save-opened"
  );
}

function closeSave() {
  const panel =
    document.getElementById(
      "saveUI"
    );

  if (!panel) return;

  panel.classList.add(
    "hidden"
  );

  saveState.open =
    false;

  gameEvent(
    "save-closed"
  );
}

function toggleSave() {
  if (
    saveState.open
  ) {
    closeSave();
  } else {
    openSave();
  }
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
    }, 2200);
}

// ------------------------------------------------------------
// HTML SAFETY
// ------------------------------------------------------------

function escapeHTML(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

// ------------------------------------------------------------
// KEYBOARD
// ------------------------------------------------------------

function setupKeyboard() {
  window.addEventListener(
    "keydown",
    event => {
      if (
        event.key.toLowerCase() ===
        "k"
      ) {
        toggleSave();
      }

      if (
        event.key === "Escape" &&
        saveState.open
      ) {
        closeSave();
      }
    }
  );
}

// ------------------------------------------------------------
// MENU BUTTON
// ------------------------------------------------------------

function setupMenuButton() {
  window.addEventListener(
    "survival-menu-button",
    () => {
      if (
        saveState.open
      ) {
        closeSave();
      }
    }
  );
}

// ------------------------------------------------------------
// GAME EVENTS
// ------------------------------------------------------------

function setupGameEvents() {
  window.addEventListener(
    "survival-game-started",
    () => {
      startAutoSave();
    }
  );

  window.addEventListener(
    "survival-game-over",
    () => {
      saveGame({
        showMessage: false
      });
    }
  );

  window.addEventListener(
    "survival-new-day",
    () => {
      saveGame({
        showMessage: false
      });
    }
  );

  window.addEventListener(
    "survival-world-generated",
    () => {
      refreshSaveUI();
    }
  );
}

// ------------------------------------------------------------
// PUBLIC SYSTEM
// ------------------------------------------------------------

const saveSystem = {
  state: saveState,

  save:
    saveGame,

  load:
    loadGame,

  loadBackup,

  delete:
    deleteSave,

  hasSave,

  hasBackup,

  getSaveInfo,

  open:
    openSave,

  close:
    closeSave,

  toggle:
    toggleSave,

  setAutoSaveEnabled,

  startAutoSave,

  stopAutoSave
};

// ------------------------------------------------------------
// REGISTER
// ------------------------------------------------------------

window.SurvivalVR.systems.save =
  saveSystem;

window.SurvivalVR.save =
  saveSystem;

window.SurvivalVR.saveGame =
  saveGame;

window.SurvivalVR.loadGame =
  loadGame;

// ------------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------------

createSaveUI();

setupKeyboard();

setupMenuButton();

setupGameEvents();

saveState.initialized =
  true;

startAutoSave();

console.log(
  "[SurvivalVR] Save system initialized"
);

export {
  saveSystem,
  saveGame,
  loadGame,
  loadBackup,
  deleteSave,
  hasSave,
  getSaveInfo
};