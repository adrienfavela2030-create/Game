// save.js
// ============================================================
// SURVIVAL VR — SAVE / LOAD SYSTEM
// ============================================================

import {
  GAME,
  getGameData,
  loadGameData,
  gameEvent,
  setPlayerPosition
} from "./game.js";

const S = window.SurvivalVR;

const SAVE_KEY = "survival_vr_save_v4";
const BACKUP_KEY = "survival_vr_save_backup_v4";
const SAVE_VERSION = 4;

const AUTOSAVE_INTERVAL = 30000;

let autosaveTimer = null;
let initialized = false;
let isSaving = false;
let isLoading = false;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function showSaveMessage(text, duration = 2500) {
  if (S?.showMessage) {
    S.showMessage(text, duration);
    return;
  }

  const message = document.querySelector("#message");

  if (!message) return;

  message.textContent = text;
  message.classList.remove("hidden");

  clearTimeout(message._saveTimer);

  message._saveTimer = setTimeout(() => {
    message.classList.add("hidden");
  }, duration);
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function safeJSONParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function storageAvailable() {
  try {
    const testKey = "__survival_vr_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------
// Resource state
// ------------------------------------------------------------

function getResourceSaveData() {
  const resources = S?.resources;

  if (!Array.isArray(resources)) {
    return [];
  }

  return resources.map((resource) => {
    const data = resource?.userData || {};

    return {
      id: data.id ?? resource.uuid ?? null,
      type: data.type ?? data.resourceType ?? null,
      x: Number(resource?.position?.x || 0),
      y: Number(resource?.position?.y || 0),
      z: Number(resource?.position?.z || 0),
      active: resource?.visible !== false,
      gathered: data.gathered === true,
      depleted: data.depleted === true
    };
  });
}

function restoreResourceSaveData(resourceState) {
  if (!Array.isArray(resourceState)) return;

  const resources = S?.resources;

  if (!Array.isArray(resources)) return;

  for (const saved of resourceState) {
    if (!saved) continue;

    let resource = null;

    if (saved.id) {
      resource = resources.find(
        item =>
          item?.uuid === saved.id ||
          item?.userData?.id === saved.id
      );
    }

    if (!resource && saved.type) {
      resource = resources.find(item => {
        const data = item?.userData || {};

        return (
          data.type === saved.type &&
          Math.abs((item.position?.x || 0) - saved.x) < 0.5 &&
          Math.abs((item.position?.z || 0) - saved.z) < 0.5
        );
      });
    }

    if (!resource) continue;

    resource.visible = saved.active !== false;

    resource.userData = resource.userData || {};

    resource.userData.gathered = !!saved.gathered;
    resource.userData.depleted = !!saved.depleted;
  }
}

// ------------------------------------------------------------
// Building state
// ------------------------------------------------------------

function getBuildingSaveData() {
  const buildingSystem = S?.systems?.building;

  if (buildingSystem?.getState) {
    const state = buildingSystem.getState();

    if (Array.isArray(state?.buildings)) {
      return clone(state.buildings);
    }
  }

  if (Array.isArray(S?.buildings)) {
    return clone(S.buildings);
  }

  if (Array.isArray(GAME?.buildings?.placed)) {
    return clone(GAME.buildings.placed);
  }

  return [];
}

function restoreBuildingSaveData(buildings) {
  if (!Array.isArray(buildings) || buildings.length === 0) {
    return;
  }

  const buildingSystem = S?.systems?.building;

  if (!buildingSystem) {
    return;
  }

  if (typeof buildingSystem.clearBuildings === "function") {
    buildingSystem.clearBuildings();
  }

  if (typeof buildingSystem.restoreBuildings === "function") {
    buildingSystem.restoreBuildings(clone(buildings));
  }

  // Keep a persistent record for future saves.
  S.buildings = clone(buildings);

  if (GAME.buildings) {
    GAME.buildings.placed = clone(buildings);
  }
}

// ------------------------------------------------------------
// Player state
// ------------------------------------------------------------

function getPlayerSaveData() {
  const position = GAME?.position || {};

  const playerGroup = S?.playerGroup;

  return {
    x: Number(
      playerGroup?.position?.x ??
      position.x ??
      0
    ),

    y: Number(
      playerGroup?.position?.y ??
      position.y ??
      1.65
    ),

    z: Number(
      playerGroup?.position?.z ??
      position.z ??
      0
    ),

    rotationY: Number(
      playerGroup?.rotation?.y ??
      0
    )
  };
}

function restorePlayerSaveData(playerData) {
  if (!playerData) return;

  const x = Number(playerData.x) || 0;
  const y = Number(playerData.y) || 1.65;
  const z = Number(playerData.z) || 0;

  if (typeof setPlayerPosition === "function") {
    setPlayerPosition(x, y, z);
  }

  if (S?.playerGroup) {
    S.playerGroup.position.set(x, y, z);

    if (Number.isFinite(playerData.rotationY)) {
      S.playerGroup.rotation.y = playerData.rotationY;
    }
  }

  if (GAME.position) {
    GAME.position.x = x;
    GAME.position.y = y;
    GAME.position.z = z;
  }
}

// ------------------------------------------------------------
// Create complete save
// ------------------------------------------------------------

function createSaveData() {
  const gameData = getGameData();

  const saveData = {
    saveVersion: SAVE_VERSION,

    savedAt: Date.now(),

    gameVersion: GAME.version || 3,

    game: gameData,

    player: getPlayerSaveData(),

    world: {
      seed: GAME.world?.seed || "",
      name: GAME.world?.name || "",
      id: GAME.world?.id || "",
      day: GAME.world?.day || 1,
      time: GAME.world?.time || 8
    },

    resources: getResourceSaveData(),

    buildings: getBuildingSaveData(),

    settings: clone(GAME.settings || {}),

    meta: {
      treesCut: GAME.statistics?.treesCut || 0,
      rocksCollected: GAME.statistics?.rocksCollected || 0,
      logsCollected: GAME.statistics?.logsCollected || 0,
      itemsCrafted: GAME.statistics?.itemsCrafted || 0,
      buildingsBuilt: GAME.statistics?.buildingsBuilt || 0
    }
  };

  return saveData;
}

// ------------------------------------------------------------
// Write save
// ------------------------------------------------------------

export function saveGame(showMessage = true) {
  if (isSaving || !storageAvailable()) {
    return false;
  }

  isSaving = true;

  try {
    const saveData = createSaveData();

    const previousSave = localStorage.getItem(SAVE_KEY);

    if (previousSave) {
      localStorage.setItem(BACKUP_KEY, previousSave);
    }

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(saveData)
    );

    GAME.save = GAME.save || {};

    GAME.save.lastSaved = Date.now();
    GAME.save.hasSave = true;

    if (typeof GAME.save.saveCount !== "number") {
      GAME.save.saveCount = 0;
    }

    GAME.save.saveCount++;

    if (typeof S.markSaved === "function") {
      S.markSaved();
    }

    gameEvent("game-saved", {
      saveVersion: SAVE_VERSION,
      savedAt: saveData.savedAt
    });

    if (showMessage) {
      showSaveMessage("Game saved.");
    }

    return true;
  } catch (error) {
    console.error("Survival VR save failed:", error);

    showSaveMessage("Could not save the game.");

    return false;
  } finally {
    isSaving = false;
  }
}

// ------------------------------------------------------------
// Read save
// ------------------------------------------------------------

function readSave(key = SAVE_KEY) {
  if (!storageAvailable()) {
    return null;
  }

  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  const parsed = safeJSONParse(raw);

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return parsed;
}

// ------------------------------------------------------------
// Load save
// ------------------------------------------------------------

export async function loadGame(showMessage = true) {
  if (isLoading) {
    return false;
  }

  isLoading = true;

  try {
    const saveData = readSave(SAVE_KEY);

    if (!saveData) {
      if (showMessage) {
        showSaveMessage("No saved game found.");
      }

      return false;
    }

    // Load the game data first.
    if (saveData.game) {
      loadGameData(clone(saveData.game));
    }

    // Make absolutely sure the saved seed is restored.
    if (saveData.world?.seed) {
      GAME.world = GAME.world || {};
      GAME.world.seed = saveData.world.seed;
    }

    // Regenerate the exact procedural world from the saved seed.
    const worldSystem = S?.systems?.world || S?.world;

    if (worldSystem?.generateWorld) {
      await worldSystem.generateWorld(
        saveData.world?.seed || GAME.world?.seed || null
      );
    } else if (worldSystem?.regenerateWorld) {
      await worldSystem.regenerateWorld();
    }

    // Restore saved world time.
    if (saveData.world) {
      GAME.world.day = Number(saveData.world.day) || 1;
      GAME.world.time = Number.isFinite(saveData.world.time)
        ? saveData.world.time
        : 8;
    }

    // Restore player AFTER the procedural world places the spawn point.
    restorePlayerSaveData(saveData.player);

    // Restore gathered/depleted resources.
    restoreResourceSaveData(saveData.resources);

    // Restore buildings.
    restoreBuildingSaveData(saveData.buildings);

    // Restore settings.
    if (saveData.settings && GAME.settings) {
      Object.assign(
        GAME.settings,
        clone(saveData.settings)
      );
    }

    GAME.save = GAME.save || {};
    GAME.save.hasSave = true;
    GAME.save.lastSaved = saveData.savedAt || Date.now();

    gameEvent("game-loaded", {
      saveVersion: saveData.saveVersion || 1,
      savedAt: saveData.savedAt || null
    });

    if (S?.systems?.settings?.applyAll) {
      S.systems.settings.applyAll();
    }

    if (S?.systems?.environment?.update) {
      S.systems.environment.update(0);
    }

    if (showMessage) {
      showSaveMessage("Saved game loaded.");
    }

    return true;
  } catch (error) {
    console.error("Survival VR load failed:", error);

    if (showMessage) {
      showSaveMessage("Could not load the saved game.");
    }

    return false;
  } finally {
    isLoading = false;
  }
}

// ------------------------------------------------------------
// Load backup
// ------------------------------------------------------------

export async function loadBackup(showMessage = true) {
  if (isLoading) {
    return false;
  }

  const backup = readSave(BACKUP_KEY);

  if (!backup) {
    if (showMessage) {
      showSaveMessage("No backup save found.");
    }

    return false;
  }

  try {
    // Temporarily use the backup as the main save.
    const currentSave = localStorage.getItem(SAVE_KEY);
    const backupSave = localStorage.getItem(BACKUP_KEY);

    if (!backupSave) {
      return false;
    }

    localStorage.setItem(SAVE_KEY, backupSave);

    const loaded = await loadGame(false);

    // Keep the old main save as the backup.
    if (currentSave) {
      localStorage.setItem(BACKUP_KEY, currentSave);
    }

    if (loaded && showMessage) {
      showSaveMessage("Backup save loaded.");
    }

    return loaded;
  } catch (error) {
    console.error("Backup load failed:", error);

    showSaveMessage("Could not load the backup.");

    return false;
  }
}

// ------------------------------------------------------------
// Delete save
// ------------------------------------------------------------

export function deleteSave(showMessage = true) {
  try {
    localStorage.removeItem(SAVE_KEY);

    GAME.save = GAME.save || {};
    GAME.save.hasSave = false;
    GAME.save.lastSaved = 0;

    gameEvent("save-deleted");

    if (showMessage) {
      showSaveMessage("Saved game deleted.");
    }

    return true;
  } catch (error) {
    console.error("Could not delete save:", error);

    return false;
  }
}

// ------------------------------------------------------------
// Check save
// ------------------------------------------------------------

export function hasSave() {
  return !!readSave(SAVE_KEY);
}

export function hasBackup() {
  return !!readSave(BACKUP_KEY);
}

// ------------------------------------------------------------
// Save information
// ------------------------------------------------------------

export function getSaveInfo() {
  const saveData = readSave(SAVE_KEY);

  if (!saveData) {
    return null;
  }

  return {
    saveVersion: saveData.saveVersion || 1,

    savedAt: saveData.savedAt || 0,

    seed:
      saveData.world?.seed ||
      saveData.game?.world?.seed ||
      "",

    worldName:
      saveData.world?.name ||
      saveData.game?.world?.name ||
      "Unnamed Island",

    day:
      saveData.world?.day ||
      saveData.game?.world?.day ||
      1,

    time:
      saveData.world?.time ??
      saveData.game?.world?.time ??
      8,

    buildings:
      Array.isArray(saveData.buildings)
        ? saveData.buildings.length
        : 0,

    resources:
      Array.isArray(saveData.resources)
        ? saveData.resources.length
        : 0
  };
}

// ------------------------------------------------------------
// Autosave
// ------------------------------------------------------------

function startAutosave() {
  stopAutosave();

  autosaveTimer = setInterval(() => {
    if (!GAME.state?.started) {
      return;
    }

    if (GAME.state?.paused) {
      return;
    }

    if (GAME.state?.gameOver) {
      return;
    }

    saveGame(false);
  }, AUTOSAVE_INTERVAL);
}

function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}

export function setAutosaveEnabled(enabled) {
  GAME.settings = GAME.settings || {};

  GAME.settings.autosave = !!enabled;

  if (enabled) {
    startAutosave();
  } else {
    stopAutosave();
  }

  gameEvent("autosave-changed", {
    enabled: !!enabled
  });
}

export function isAutosaveEnabled() {
  if (typeof GAME.settings?.autosave === "boolean") {
    return GAME.settings.autosave;
  }

  return true;
}

// ------------------------------------------------------------
// Save UI
// ------------------------------------------------------------

function createSaveUI() {
  if (document.querySelector("#saveUI")) {
    return document.querySelector("#saveUI");
  }

  const ui = document.createElement("div");

  ui.id = "saveUI";
  ui.className = "overlay hidden";

  ui.innerHTML = `
    <div class="panel savePanel">

      <div class="panelHeader">
        <div>
          <div class="panelTitle">SAVE GAME</div>
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

      <div id="saveInfo" class="saveInfo"></div>

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
        <span>Autosave</span>

        <input
          id="autosaveToggle"
          type="checkbox"
        >
      </label>

    </div>
  `;

  document.body.appendChild(ui);

  ui.querySelector("#closeSaveButton")
    ?.addEventListener("click", closeSaveUI);

  ui.querySelector("#saveNowButton")
    ?.addEventListener("click", () => {
      saveGame(true);
      refreshSaveUI();
    });

  ui.querySelector("#loadSaveButton")
    ?.addEventListener("click", async () => {
      await loadGame(true);
      refreshSaveUI();
    });

  ui.querySelector("#loadBackupButton")
    ?.addEventListener("click", async () => {
      await loadBackup(true);
      refreshSaveUI();
    });

  ui.querySelector("#deleteSaveButton")
    ?.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Delete your saved game? This cannot be undone."
      );

      if (!confirmed) return;

      deleteSave(true);
      refreshSaveUI();
    });

  ui.querySelector("#autosaveToggle")
    ?.addEventListener("change", event => {
      setAutosaveEnabled(event.target.checked);
    });

  return ui;
}

function refreshSaveUI() {
  const ui = document.querySelector("#saveUI");

  if (!ui) return;

  const info = ui.querySelector("#saveInfo");
  const autosave = ui.querySelector("#autosaveToggle");

  const saveData = getSaveInfo();

  if (!saveData) {
    info.innerHTML = `
      <div class="saveCard">
        <strong>No save found</strong>
        <span>Start playing and save your island.</span>
      </div>
    `;
  } else {
    const date = saveData.savedAt
      ? new Date(saveData.savedAt).toLocaleString()
      : "Unknown";

    info.innerHTML = `
      <div class="saveCard">
        <strong>${escapeHTML(saveData.worldName)}</strong>

        <span>
          Seed:
          <b>${escapeHTML(saveData.seed || "Unknown")}</b>
        </span>

        <span>
          Day ${saveData.day}
        </span>

        <span>
          Saved:
          ${escapeHTML(date)}
        </span>

        <span>
          Buildings:
          ${saveData.buildings}
        </span>
      </div>
    `;
  }

  if (autosave) {
    autosave.checked = isAutosaveEnabled();
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function openSaveUI() {
  const ui = createSaveUI();

  refreshSaveUI();

  ui.classList.remove("hidden");

  if (S?.setPaused) {
    S.setPaused(true);
  }
}

export function closeSaveUI() {
  const ui = document.querySelector("#saveUI");

  if (ui) {
    ui.classList.add("hidden");
  }
}

export function toggleSaveUI() {
  const ui = document.querySelector("#saveUI");

  if (!ui || ui.classList.contains("hidden")) {
    openSaveUI();
  } else {
    closeSaveUI();
  }
}

// ------------------------------------------------------------
// Events
// ------------------------------------------------------------

window.addEventListener(
  "survival-menu-button",
  () => {
    toggleSaveUI();
  }
);

window.addEventListener(
  "survival-game-started",
  () => {
    if (!initialized) return;

    if (isAutosaveEnabled()) {
      startAutosave();
    }
  }
);

window.addEventListener(
  "survival-new-world-created",
  () => {
    // A new world starts clean.
    // Do not overwrite an existing save until the player saves.
    GAME.save = GAME.save || {};
  }
);

window.addEventListener(
  "survival-game-over",
  () => {
    // Preserve the final state.
    saveGame(false);
  }
);

window.addEventListener(
  "beforeunload",
  () => {
    if (GAME.state?.started && !GAME.state?.gameOver) {
      saveGame(false);
    }
  }
);

// Keyboard shortcut: K
window.addEventListener("keydown", event => {
  if (
    event.key.toLowerCase() === "k" &&
    !event.repeat
  ) {
    const target = event.target;

    if (
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable
    ) {
      return;
    }

    toggleSaveUI();
  }

  if (event.key === "Escape") {
    closeSaveUI();
  }
});

// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

function initialize() {
  if (initialized) return;

  initialized = true;

  GAME.save = GAME.save || {};

  GAME.save.hasSave = hasSave();

  GAME.save.lastSaved =
    getSaveInfo()?.savedAt || 0;

  GAME.settings = GAME.settings || {};

  if (typeof GAME.settings.autosave !== "boolean") {
    GAME.settings.autosave = true;
  }

  createSaveUI();

  if (isAutosaveEnabled()) {
    startAutosave();
  }

  if (S) {
    S.saveGame = saveGame;
    S.loadGame = loadGame;
    S.loadBackup = loadBackup;
    S.deleteSave = deleteSave;
    S.hasSave = hasSave;
    S.hasBackup = hasBackup;
    S.getSaveInfo = getSaveInfo;
    S.openSaveUI = openSaveUI;
    S.closeSaveUI = closeSaveUI;
    S.toggleSaveUI = toggleSaveUI;
    S.setAutosaveEnabled = setAutosaveEnabled;
  }

  if (typeof S?.registerSystem === "function") {
    S.registerSystem("save", {
      save: saveGame,
      load: loadGame,
      loadBackup,
      deleteSave,
      hasSave,
      getSaveInfo,
      open: openSaveUI,
      close: closeSaveUI,
      toggle: toggleSaveUI
    });
  }

  console.log("Survival VR save system ready.");
}

initialize();

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

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

if (S) {
  S.systems = S.systems || {};
  S.systems.save = saveSystem;
}