// save.js
// ============================================================
// SURVIVAL VR — SAVE / LOAD SYSTEM v5
// ============================================================

import {
  GAME,
  getGameData,
  loadGameData,
  gameEvent,
  setPlayerPosition
} from "./game.js";

const S = window.SurvivalVR;

const SAVE_KEY = "survival_vr_save_v5";
const BACKUP_KEY = "survival_vr_save_backup_v5";

const SAVE_VERSION = 5;
const AUTOSAVE_INTERVAL = 30000;

let autosaveTimer = null;
let initialized = false;
let saving = false;
let loading = false;

// ============================================================
// MESSAGE
// ============================================================

function showSaveMessage(message, duration = 2500) {
  if (typeof S?.showMessage === "function") {
    S.showMessage(message, duration);
    return;
  }

  const element =
    document.querySelector("#message");

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  clearTimeout(element._saveTimer);

  element._saveTimer = setTimeout(() => {
    element.classList.add("hidden");
  }, duration);
}

// ============================================================
// STORAGE
// ============================================================

function storageAvailable() {
  try {
    const key =
      "__survival_vr_storage_test__";

    localStorage.setItem(key, "1");
    localStorage.removeItem(key);

    return true;
  } catch {
    return false;
  }
}

function parseSave(key) {
  if (!storageAvailable()) {
    return null;
  }

  const raw =
    localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

// ============================================================
// PLAYER
// ============================================================

function capturePlayer() {
  const group =
    S?.playerGroup;

  return {
    x:
      Number(
        group?.position?.x ??
        GAME.position.x ??
        0
      ),

    y:
      Number(
        group?.position?.y ??
        GAME.position.y ??
        1.65
      ),

    z:
      Number(
        group?.position?.z ??
        GAME.position.z ??
        0
      ),

    rotationY:
      Number(
        group?.rotation?.y ??
        GAME.position.rotationY ??
        0
      )
  };
}

function restorePlayer(data) {
  if (!data) return;

  const x =
    Number.isFinite(Number(data.x))
      ? Number(data.x)
      : 0;

  const y =
    Number.isFinite(Number(data.y))
      ? Number(data.y)
      : 1.65;

  const z =
    Number.isFinite(Number(data.z))
      ? Number(data.z)
      : 0;

  const rotationY =
    Number.isFinite(Number(data.rotationY))
      ? Number(data.rotationY)
      : 0;

  setPlayerPosition(
    x,
    y,
    z
  );

  GAME.position.rotationY =
    rotationY;

  if (S?.playerGroup) {
    S.playerGroup.position.set(
      x,
      y,
      z
    );

    S.playerGroup.rotation.y =
      rotationY;
  }
}

// ============================================================
// RESOURCES
// ============================================================

function captureResources() {
  const worldSystem =
    S?.systems?.world;

  if (
    worldSystem &&
    typeof worldSystem.getResourceRecords ===
      "function"
  ) {
    return clone(
      worldSystem.getResourceRecords()
    );
  }

  if (
    Array.isArray(
      S?.worldResources
    )
  ) {
    return clone(
      S.worldResources
    );
  }

  return [];
}

function restoreResources(resources) {
  if (
    !Array.isArray(resources)
  ) {
    return;
  }

  const worldSystem =
    S?.systems?.world;

  if (
    worldSystem &&
    typeof worldSystem.restoreResourceState ===
      "function"
  ) {
    worldSystem.restoreResourceState(
      clone(resources)
    );

    return;
  }

  // Compatibility fallback.
  if (
    Array.isArray(S?.resources)
  ) {
    for (
      const saved
      of resources
    ) {
      if (!saved?.id) continue;

      const object =
        S.resources.find(
          resource =>
            resource?.userData?.id ===
            saved.id
        );

      if (!object) continue;

      object.visible =
        saved.depleted !== true;

      object.userData =
        object.userData || {};

      object.userData.depleted =
        saved.depleted === true;

      object.userData.gathered =
        saved.gathered === true;
    }
  }
}

// ============================================================
// BUILDINGS
// ============================================================

function captureBuildings() {
  const buildingSystem =
    S?.systems?.building;

  if (
    buildingSystem &&
    typeof buildingSystem.getState ===
      "function"
  ) {
    const state =
      buildingSystem.getState();

    if (
      Array.isArray(state?.buildings)
    ) {
      return clone(
        state.buildings
      );
    }
  }

  if (
    Array.isArray(
      S?.buildings
    )
  ) {
    return clone(
      S.buildings
    );
  }

  if (
    Array.isArray(
      GAME.buildings?.placed
    )
  ) {
    return clone(
      GAME.buildings.placed
    );
  }

  return [];
}

function restoreBuildings(buildings) {
  if (
    !Array.isArray(buildings)
  ) {
    return;
  }

  const buildingSystem =
    S?.systems?.building;

  if (!buildingSystem) {
    return;
  }

  if (
    typeof buildingSystem.clearBuildings ===
      "function"
  ) {
    buildingSystem.clearBuildings();
  }

  if (
    typeof buildingSystem.restoreBuildings ===
      "function"
  ) {
    buildingSystem.restoreBuildings(
      clone(buildings)
    );
  }

  S.buildings =
    clone(buildings);
}

// ============================================================
// CREATE SAVE
// ============================================================

function createSaveData() {
  const game =
    getGameData();

  return {
    saveVersion:
      SAVE_VERSION,

    savedAt:
      Date.now(),

    gameVersion:
      4,

    game,

    player:
      capturePlayer(),

    world: {
      id:
        GAME.world.id,

      name:
        GAME.world.name,

      seed:
        GAME.world.seed,

      day:
        GAME.world.day,

      time:
        GAME.world.time,

      weather:
        GAME.world.weather
    },

    resources:
      captureResources(),

    buildings:
      captureBuildings(),

    settings:
      clone(
        GAME.settings
      )
  };
}

// ============================================================
// SAVE
// ============================================================

export function saveGame(
  showMessage = true
) {
  if (
    saving ||
    !storageAvailable()
  ) {
    return false;
  }

  saving = true;

  try {
    const saveData =
      createSaveData();

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
      JSON.stringify(
        saveData
      )
    );

    GAME.save =
      GAME.save || {};

    GAME.save.hasSave =
      true;

    GAME.save.lastSaved =
      saveData.savedAt;

    GAME.save.saveCount =
      Number(
        GAME.save.saveCount || 0
      ) + 1;

    if (
      typeof S?.markSaved ===
        "function"
    ) {
      S.markSaved();
    }

    gameEvent(
      "game-saved",
      {
        savedAt:
          saveData.savedAt,

        saveVersion:
          SAVE_VERSION
      }
    );

    if (showMessage) {
      showSaveMessage(
        "Game saved."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Save failed:",
      error
    );

    if (showMessage) {
      showSaveMessage(
        "Could not save the game."
      );
    }

    return false;
  } finally {
    saving = false;
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadGame(
  showMessage = true
) {
  if (
    loading ||
    !storageAvailable()
  ) {
    return false;
  }

  loading = true;

  try {
    const saveData =
      parseSave(
        SAVE_KEY
      );

    if (!saveData) {
      if (showMessage) {
        showSaveMessage(
          "No saved game found."
        );
      }

      return false;
    }

    // --------------------------------------------------------
    // Load core game data.
    // --------------------------------------------------------

    if (saveData.game) {
      loadGameData(
        clone(
          saveData.game
        )
      );
    }

    // --------------------------------------------------------
    // Make sure the exact saved seed is used.
    // --------------------------------------------------------

    const seed =
      saveData.world?.seed ||
      GAME.world.seed;

    GAME.world.seed =
      seed;

    // --------------------------------------------------------
    // Generate the exact same procedural world.
    // --------------------------------------------------------

    const worldSystem =
      S?.systems?.world;

    if (
      worldSystem &&
      typeof worldSystem.generateWorld ===
        "function"
    ) {
      await worldSystem.generateWorld(
        seed,
        {
          preservePlayer: true
        }
      );
    }

    // --------------------------------------------------------
    // Restore world time.
    // --------------------------------------------------------

    if (saveData.world) {
      GAME.world.id =
        saveData.world.id ||
        GAME.world.id;

      GAME.world.name =
        saveData.world.name ||
        GAME.world.name;

      GAME.world.day =
        Number(
          saveData.world.day || 1
        );

      GAME.world.time =
        Number.isFinite(
          Number(
            saveData.world.time
          )
        )
          ? Number(
              saveData.world.time
            )
          : 8;

      GAME.world.weather =
        saveData.world.weather ||
        "sunny";
    }

    // --------------------------------------------------------
    // Restore player position AFTER world generation.
    // --------------------------------------------------------

    restorePlayer(
      saveData.player
    );

    // --------------------------------------------------------
    // Restore gathered trees / rocks / logs.
    // --------------------------------------------------------

    restoreResources(
      saveData.resources
    );

    // --------------------------------------------------------
    // Restore physical buildings.
    // --------------------------------------------------------

    restoreBuildings(
      saveData.buildings
    );

    // --------------------------------------------------------
    // Restore settings.
    // --------------------------------------------------------

    if (
      saveData.settings &&
      GAME.settings
    ) {
      Object.assign(
        GAME.settings,
        clone(
          saveData.settings
        )
      );
    }

    GAME.save =
      GAME.save || {};

    GAME.save.hasSave =
      true;

    GAME.save.lastSaved =
      saveData.savedAt ||
      Date.now();

    gameEvent(
      "game-loaded",
      {
        saveVersion:
          saveData.saveVersion ||
          1
      }
    );

    if (showMessage) {
      showSaveMessage(
        "Saved game loaded."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Load failed:",
      error
    );

    if (showMessage) {
      showSaveMessage(
        "Could not load the saved game."
      );
    }

    return false;
  } finally {
    loading = false;
  }
}

// ============================================================
// BACKUP
// ============================================================

export async function loadBackup(
  showMessage = true
) {
  const backup =
    parseSave(
      BACKUP_KEY
    );

  if (!backup) {
    if (showMessage) {
      showSaveMessage(
        "No backup save found."
      );
    }

    return false;
  }

  try {
    const current =
      localStorage.getItem(
        SAVE_KEY
      );

    const backupRaw =
      localStorage.getItem(
        BACKUP_KEY
      );

    if (!backupRaw) {
      return false;
    }

    localStorage.setItem(
      SAVE_KEY,
      backupRaw
    );

    const loaded =
      await loadGame(
        false
      );

    if (current) {
      localStorage.setItem(
        BACKUP_KEY,
        current
      );
    }

    if (
      loaded &&
      showMessage
    ) {
      showSaveMessage(
        "Backup save loaded."
      );
    }

    return loaded;
  } catch (error) {
    console.error(
      "Backup load failed:",
      error
    );

    if (showMessage) {
      showSaveMessage(
        "Could not load backup."
      );
    }

    return false;
  }
}

// ============================================================
// DELETE
// ============================================================

export function deleteSave(
  showMessage = true
) {
  try {
    localStorage.removeItem(
      SAVE_KEY
    );

    GAME.save =
      GAME.save || {};

    GAME.save.hasSave =
      false;

    GAME.save.lastSaved =
      0;

    gameEvent(
      "save-deleted"
    );

    if (showMessage) {
      showSaveMessage(
        "Saved game deleted."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Delete save failed:",
      error
    );

    return false;
  }
}

// ============================================================
// SAVE CHECKS
// ============================================================

export function hasSave() {
  return !!parseSave(
    SAVE_KEY
  );
}

export function hasBackup() {
  return !!parseSave(
    BACKUP_KEY
  );
}

// ============================================================
// SAVE INFO
// ============================================================

export function getSaveInfo() {
  const data =
    parseSave(
      SAVE_KEY
    );

  if (!data) {
    return null;
  }

  return {
    saveVersion:
      data.saveVersion || 1,

    savedAt:
      data.savedAt || 0,

    seed:
      data.world?.seed ||
      data.game?.world?.seed ||
      "",

    worldName:
      data.world?.name ||
      data.game?.world?.name ||
      "Unnamed Island",

    day:
      data.world?.day ||
      data.game?.world?.day ||
      1,

    time:
      data.world?.time ??
      data.game?.world?.time ??
      8,

    buildingCount:
      Array.isArray(
        data.buildings
      )
        ? data.buildings.length
        : 0,

    resourceCount:
      Array.isArray(
        data.resources
      )
        ? data.resources.length
        : 0
  };
}

// ============================================================
// AUTOSAVE
// ============================================================

function startAutosave() {
  stopAutosave();

  autosaveTimer =
    setInterval(() => {
      if (
        !GAME.state.started ||
        GAME.state.paused ||
        GAME.state.gameOver
      ) {
        return;
      }

      saveGame(false);
    }, AUTOSAVE_INTERVAL);
}

function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(
      autosaveTimer
    );

    autosaveTimer =
      null;
  }
}

export function setAutosaveEnabled(
  enabled
) {
  GAME.settings.autosave =
    !!enabled;

  if (enabled) {
    startAutosave();
  } else {
    stopAutosave();
  }

  gameEvent(
    "autosave-changed",
    {
      enabled:
        !!enabled
    }
  );
}

export function isAutosaveEnabled() {
  return (
    GAME.settings.autosave !==
      false
  );
}

// ============================================================
// UI
// ============================================================

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

function createSaveUI() {
  let ui =
    document.querySelector(
      "#saveUI"
    );

  if (ui) {
    return ui;
  }

  ui =
    document.createElement(
      "div"
    );

  ui.id =
    "saveUI";

  ui.className =
    "overlay hidden";

  ui.innerHTML = `
    <div class="panel savePanel">

      <div class="panelHeader">

        <div>
          <div class="panelTitle">
            SAVE GAME
          </div>

          <div class="panelSubtitle">
            Save your island and continue later.
          </div>
        </div>

        <button
          id="closeSaveButton"
          class="closeButton"
          type="button"
        >
          ×
        </button>

      </div>

      <div
        id="saveInfo"
        class="saveInfo"
      ></div>

      <div class="saveActions">

        <button
          id="saveNowButton"
          class="uiButton primary"
          type="button"
        >
          SAVE NOW
        </button>

        <button
          id="loadSaveButton"
          class="uiButton"
          type="button"
        >
          LOAD SAVE
        </button>

        <button
          id="loadBackupButton"
          class="uiButton"
          type="button"
        >
          LOAD BACKUP
        </button>

        <button
          id="deleteSaveButton"
          class="uiButton danger"
          type="button"
        >
          DELETE SAVE
        </button>

      </div>

      <label class="toggleRow">

        <span>
          Autosave
        </span>

        <input
          id="autosaveToggle"
          type="checkbox"
        >

      </label>

    </div>
  `;

  document.body.appendChild(
    ui
  );

  ui.querySelector(
    "#closeSaveButton"
  )?.addEventListener(
    "click",
    closeSaveUI
  );

  ui.querySelector(
    "#saveNowButton"
  )?.addEventListener(
    "click",
    () => {
      saveGame(true);
      refreshSaveUI();
    }
  );

  ui.querySelector(
    "#loadSaveButton"
  )?.addEventListener(
    "click",
    async () => {
      await loadGame(true);
      refreshSaveUI();
    }
  );

  ui.querySelector(
    "#loadBackupButton"
  )?.addEventListener(
    "click",
    async () => {
      await loadBackup(true);
      refreshSaveUI();
    }
  );

  ui.querySelector(
    "#deleteSaveButton"
  )?.addEventListener(
    "click",
    () => {
      if (
        !window.confirm(
          "Delete your saved game? This cannot be undone."
        )
      ) {
        return;
      }

      deleteSave(true);
      refreshSaveUI();
    }
  );

  ui.querySelector(
    "#autosaveToggle"
  )?.addEventListener(
    "change",
    event => {
      setAutosaveEnabled(
        event.target.checked
      );
    }
  );

  return ui;
}

// ============================================================
// REFRESH UI
// ============================================================

function refreshSaveUI() {
  const ui =
    document.querySelector(
      "#saveUI"
    );

  if (!ui) return;

  const info =
    ui.querySelector(
      "#saveInfo"
    );

  const toggle =
    ui.querySelector(
      "#autosaveToggle"
    );

  const data =
    getSaveInfo();

  if (!data) {
    info.innerHTML = `
      <div class="saveCard">
        <strong>
          No save found
        </strong>

        <span>
          Save your island to continue later.
        </span>
      </div>
    `;
  } else {
    const date =
      data.savedAt
        ? new Date(
            data.savedAt
          ).toLocaleString()
        : "Unknown";

    info.innerHTML = `
      <div class="saveCard">

        <strong>
          ${escapeHTML(
            data.worldName
          )}
        </strong>

        <span>
          Seed:
          <b>
            ${escapeHTML(
              data.seed ||
              "Unknown"
            )}
          </b>
        </span>

        <span>
          Day ${data.day}
        </span>

        <span>
          Saved:
          ${escapeHTML(
            date
          )}
        </span>

        <span>
          Saved resources:
          ${data.resourceCount}
        </span>

        <span>
          Saved buildings:
          ${data.buildingCount}
        </span>

      </div>
    `;
  }

  if (toggle) {
    toggle.checked =
      isAutosaveEnabled();
  }
}

// ============================================================
// OPEN / CLOSE
// ============================================================

export function openSaveUI() {
  const ui =
    createSaveUI();

  refreshSaveUI();

  ui.classList.remove(
    "hidden"
  );

  if (
    typeof S?.setPaused ===
      "function"
  ) {
    S.setPaused(true);
  }
}

export function closeSaveUI() {
  const ui =
    document.querySelector(
      "#saveUI"
    );

  if (ui) {
    ui.classList.add(
      "hidden"
    );
  }
}

export function toggleSaveUI() {
  const ui =
    document.querySelector(
      "#saveUI"
    );

  if (
    !ui ||
    ui.classList.contains(
      "hidden"
    )
  ) {
    openSaveUI();
  } else {
    closeSaveUI();
  }
}

// ============================================================
// EVENTS
// ============================================================

window.addEventListener(
  "survival-menu-button",
  () => {
    toggleSaveUI();
  }
);

window.addEventListener(
  "survival-game-started",
  () => {
    if (
      isAutosaveEnabled()
    ) {
      startAutosave();
    }
  }
);

window.addEventListener(
  "survival-game-over",
  () => {
    saveGame(false);
  }
);

window.addEventListener(
  "beforeunload",
  () => {
    if (
      GAME.state.started &&
      !GAME.state.gameOver
    ) {
      saveGame(false);
    }
  }
);

// K = Save menu
window.addEventListener(
  "keydown",
  event => {
    if (
      event.key.toLowerCase() ===
        "k" &&
      !event.repeat
    ) {
      const target =
        event.target;

      if (
        target?.tagName ===
          "INPUT" ||
        target?.tagName ===
          "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      toggleSaveUI();
    }

    if (
      event.key ===
        "Escape"
    ) {
      closeSaveUI();
    }
  }
);

// ============================================================
// INITIALIZE
// ============================================================

function initialize() {
  if (initialized) {
    return;
  }

  initialized = true;

  GAME.save =
    GAME.save || {};

  GAME.save.hasSave =
    hasSave();

  GAME.save.lastSaved =
    getSaveInfo()?.savedAt ||
    0;

  GAME.settings =
    GAME.settings || {};

  if (
    typeof GAME.settings.autosave !==
      "boolean"
  ) {
    GAME.settings.autosave =
      true;
  }

  createSaveUI();

  if (
    isAutosaveEnabled()
  ) {
    startAutosave();
  }

  const saveSystem = {
    save: saveGame,
    load: loadGame,
    loadBackup,
    deleteSave,
    hasSave,
    hasBackup,
    getSaveInfo,
    open: openSaveUI,
    close: closeSaveUI,
    toggle: toggleSaveUI,
    setAutosaveEnabled,
    isAutosaveEnabled
  };

  S.systems =
    S.systems || {};

  S.systems.save =
    saveSystem;

  S.saveGame =
    saveGame;

  S.loadGame =
    loadGame;

  S.loadBackup =
    loadBackup;

  S.deleteSave =
    deleteSave;

  S.hasSave =
    hasSave;

  S.hasBackup =
    hasBackup;

  S.getSaveInfo =
    getSaveInfo;

  S.openSaveUI =
    openSaveUI;

  S.closeSaveUI =
    closeSaveUI;

  S.toggleSaveUI =
    toggleSaveUI;

  console.log(
    "Survival VR save system v5 loaded."
  );
}

initialize();

export const saveSystem = {
  save: saveGame,
  load: loadGame,
  loadBackup,
  deleteSave,
  hasSave,
  hasBackup,
  getSaveInfo,
  open: openSaveUI,
  close: closeSaveUI,
  toggle: toggleSaveUI,
  setAutosaveEnabled,
  isAutosaveEnabled
};