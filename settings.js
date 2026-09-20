// settings.js
// Survival VR - Settings System

const {
  GAME,
  gameEvent
} = window.SurvivalVR;

const settingsState = {
  initialized: false,
  open: false
};

// ------------------------------------------------------------
// DEFAULT SETTINGS
// ------------------------------------------------------------

const DEFAULT_SETTINGS = {
  masterVolume: 1,
  musicVolume: 0.7,
  effectsVolume: 1,
  environmentVolume: 0.8,
  animalVolume: 0.8,

  graphicsQuality: "medium",
  shadows: true,
  waterQuality: "medium",
  grassQuality: "medium",
  viewDistance: "medium",

  vibration: true,
  snapTurning: true,
  snapTurnAmount: 30
};

// ------------------------------------------------------------
// SETTING HELPERS
// ------------------------------------------------------------

function ensureSettings() {
  if (!GAME.settings) {
    GAME.settings = {};
  }

  for (
    const [key, value]
    of Object.entries(DEFAULT_SETTINGS)
  ) {
    if (
      GAME.settings[key] ===
      undefined
    ) {
      GAME.settings[key] = value;
    }
  }
}

function getSetting(key) {
  ensureSettings();

  return GAME.settings[key];
}

function setSetting(key, value) {
  ensureSettings();

  GAME.settings[key] = value;

  applySetting(
    key,
    value
  );

  gameEvent(
    "settings-changed"
  );

  refreshSettingsUI();
}

// ------------------------------------------------------------
// APPLY SETTINGS
// ------------------------------------------------------------

function applySetting(
  key,
  value
) {
  switch (key) {

    case "masterVolume":
      window.SurvivalVR.systems
        ?.audio
        ?.setMasterVolume?.(
          value
        );
      break;

    case "musicVolume":
      window.SurvivalVR.systems
        ?.audio
        ?.setMusicVolume?.(
          value
        );
      break;

    case "effectsVolume":
      window.SurvivalVR.systems
        ?.audio
        ?.setEffectsVolume?.(
          value
        );
      break;

    case "environmentVolume":
      window.SurvivalVR.systems
        ?.audio
        ?.setEnvironmentVolume?.(
          value
        );
      break;

    case "animalVolume":
      window.SurvivalVR.systems
        ?.audio
        ?.setAnimalVolume?.(
          value
        );
      break;

    case "graphicsQuality":
      applyGraphicsQuality(
        value
      );
      break;

    case "shadows":
      applyShadows(
        value
      );
      break;

    case "waterQuality":
      window.SurvivalVR.systems
        ?.environment
        ?.setWaterQuality?.(
          value
        );
      break;

    case "grassQuality":
      window.SurvivalVR.systems
        ?.environment
        ?.setGrassQuality?.(
          value
        );
      break;

    case "viewDistance":
      window.SurvivalVR.systems
        ?.environment
        ?.setViewDistance?.(
          value
        );
      break;

    case "vibration":
      break;

    case "snapTurning":
      break;

    case "snapTurnAmount":
      break;
  }
}

// ------------------------------------------------------------
// GRAPHICS
// ------------------------------------------------------------

function applyGraphicsQuality(
  quality
) {
  const renderer =
    window.SurvivalVR.renderer;

  if (!renderer) {
    return;
  }

  if (
    quality === "low"
  ) {
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1
      )
    );
  }

  if (
    quality === "medium"
  ) {
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1.5
      )
    );
  }

  if (
    quality === "high"
  ) {
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        2
      )
    );
  }

  gameEvent(
    "graphics-quality-changed"
  );
}

function applyShadows(enabled) {
  const renderer =
    window.SurvivalVR.renderer;

  if (renderer) {
    renderer.shadowMap.enabled =
      Boolean(enabled);
  }

  if (
    window.SurvivalVR.sun
  ) {
    window.SurvivalVR.sun.castShadow =
      Boolean(enabled);
  }
}

// ------------------------------------------------------------
// CREATE UI
// ------------------------------------------------------------

function createSettingsUI() {
  if (
    document.getElementById(
      "settingsUI"
    )
  ) {
    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "settingsUI";

  overlay.className =
    "uiOverlay hidden";

  overlay.innerHTML = `
    <div class="uiPanel settingsPanel">

      <div class="panelHeader">

        <div>
          <h2>Settings</h2>

          <p class="panelSubtitle">
            Customize your survival experience
          </p>
        </div>

        <button
          class="closeButton"
          id="closeSettingsButton"
        >
          ×
        </button>

      </div>

      <div class="settingsTabs">

        <button
          class="settingsTab active"
          data-tab="gameplay"
        >
          Gameplay
        </button>

        <button
          class="settingsTab"
          data-tab="graphics"
        >
          Graphics
        </button>

        <button
          class="settingsTab"
          data-tab="audio"
        >
          Audio
        </button>

        <button
          class="settingsTab"
          data-tab="vr"
        >
          VR
        </button>

      </div>

      <div
        class="settingsContent"
        id="settingsContent"
      ></div>

      <div class="settingsFooter">

        <button
          class="secondaryButton"
          id="resetSettingsButton"
        >
          Reset Settings
        </button>

        <button
          class="primaryButton"
          id="closeSettingsFooterButton"
        >
          Done
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  document
    .getElementById(
      "closeSettingsButton"
    )
    .addEventListener(
      "click",
      closeSettings
    );

  document
    .getElementById(
      "closeSettingsFooterButton"
    )
    .addEventListener(
      "click",
      closeSettings
    );

  document
    .getElementById(
      "resetSettingsButton"
    )
    .addEventListener(
      "click",
      resetSettings
    );

  overlay
    .querySelectorAll(
      ".settingsTab"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          switchSettingsTab(
            button.dataset.tab
          );
        }
      );
    });

  switchSettingsTab(
    "gameplay"
  );
}

// ------------------------------------------------------------
// SETTINGS TABS
// ------------------------------------------------------------

let currentTab =
  "gameplay";

function switchSettingsTab(
  tab
) {
  currentTab = tab;

  document
    .querySelectorAll(
      ".settingsTab"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.tab ===
          tab
      );
    });

  renderSettingsTab();
}

// ------------------------------------------------------------
// RENDER TAB
// ------------------------------------------------------------

function renderSettingsTab() {
  const content =
    document.getElementById(
      "settingsContent"
    );

  if (!content) {
    return;
  }

  ensureSettings();

  if (
    currentTab ===
    "gameplay"
  ) {
    content.innerHTML = `
      <div class="settingsSection">

        <h3>Gameplay</h3>

        <div class="settingRow">

          <div>
            <strong>Auto Save</strong>
            <p>
              Automatically save your world
            </p>
          </div>

          <label class="toggle">
            <input
              type="checkbox"
              id="settingAutoSave"
              ${
                window.SurvivalVR.systems
                  ?.save
                  ?.state
                  ?.autoSaveEnabled
                  ? "checked"
                  : ""
              }
            >
            <span class="toggleSlider"></span>
          </label>

        </div>

        <div class="settingRow">

          <div>
            <strong>Vibration</strong>
            <p>
              Controller and interaction feedback
            </p>
          </div>

          <label class="toggle">

            <input
              type="checkbox"
              id="settingVibration"
              ${
                getSetting(
                  "vibration"
                )
                  ? "checked"
                  : ""
              }
            >

            <span class="toggleSlider"></span>

          </label>

        </div>

        <div class="settingRow">

          <div>
            <strong>Snap Turning</strong>
            <p>
              Turn in fixed increments
            </p>
          </div>

          <label class="toggle">

            <input
              type="checkbox"
              id="settingSnapTurning"
              ${
                getSetting(
                  "snapTurning"
                )
                  ? "checked"
                  : ""
              }
            >

            <span class="toggleSlider"></span>

          </label>

        </div>

        <div class="settingRow">

          <div>
            <strong>Snap Turn Amount</strong>
            <p>
              Degrees per turn
            </p>
          </div>

          <select
            id="settingSnapAmount"
            class="settingsSelect"
          >

            <option
              value="15"
              ${
                getSetting(
                  "snapTurnAmount"
                ) === 15
                  ? "selected"
                  : ""
              }
            >
              15°
            </option>

            <option
              value="30"
              ${
                getSetting(
                  "snapTurnAmount"
                ) === 30
                  ? "selected"
                  : ""
              }
            >
              30°
            </option>

            <option
              value="45"
              ${
                getSetting(
                  "snapTurnAmount"
                ) === 45
                  ? "selected"
                  : ""
              }
            >
              45°
            </option>

            <option
              value="60"
              ${
                getSetting(
                  "snapTurnAmount"
                ) === 60
                  ? "selected"
                  : ""
              }
            >
              60°
            </option>

          </select>

        </div>

      </div>
    `;

    bindGameplaySettings();

    return;
  }

  if (
    currentTab ===
    "graphics"
  ) {
    content.innerHTML = `
      <div class="settingsSection">

        <h3>Graphics</h3>

        <div class="settingRow">

          <div>
            <strong>Graphics Quality</strong>
            <p>
              Overall visual quality
            </p>
          </div>

          <select
            id="settingGraphicsQuality"
            class="settingsSelect"
          >

            <option
              value="low"
              ${
                getSetting(
                  "graphicsQuality"
                ) === "low"
                  ? "selected"
                  : ""
              }
            >
              Low
            </option>

            <option
              value="medium"
              ${
                getSetting(
                  "graphicsQuality"
                ) === "medium"
                  ? "selected"
                  : ""
              }
            >
              Medium
            </option>

            <option
              value="high"
              ${
                getSetting(
                  "graphicsQuality"
                ) === "high"
                  ? "selected"
                  : ""
              }
            >
              High
            </option>

          </select>

        </div>

        <div class="settingRow">

          <div>
            <strong>Shadows</strong>
            <p>
              Dynamic world shadows
            </p>
          </div>

          <label class="toggle">

            <input
              type="checkbox"
              id="settingShadows"
              ${
                getSetting(
                  "shadows"
                )
                  ? "checked"
                  : ""
              }
            >

            <span class="toggleSlider"></span>

          </label>

        </div>

        <div class="settingRow">

          <div>
            <strong>Water Quality</strong>
            <p>
              Lake and water detail
            </p>
          </div>

          <select
            id="settingWaterQuality"
            class="settingsSelect"
          >

            <option
              value="low"
              ${
                getSetting(
                  "waterQuality"
                ) === "low"
                  ? "selected"
                  : ""
              }
            >
              Low
            </option>

            <option
              value="medium"
              ${
                getSetting(
                  "waterQuality"
                ) === "medium"
                  ? "selected"
                  : ""
              }
            >
              Medium
            </option>

            <option
              value="high"
              ${
                getSetting(
                  "waterQuality"
                ) === "high"
                  ? "selected"
                  : ""
              }
            >
              High
            </option>

          </select>

        </div>

        <div class="settingRow">

          <div>
            <strong>Grass Quality</strong>
            <p>
              Amount of grass generated
            </p>
          </div>

          <select
            id="settingGrassQuality"
            class="settingsSelect"
          >

            <option
              value="low"
              ${
                getSetting(
                  "grassQuality"
                ) === "low"
                  ? "selected"
                  : ""
              }
            >
              Low
            </option>

            <option
              value="medium"
              ${
                getSetting(
                  "grassQuality"
                ) === "medium"
                  ? "selected"
                  : ""
              }
            >
              Medium
            </option>

            <option
              value="high"
              ${
                getSetting(
                  "grassQuality"
                ) === "high"
                  ? "selected"
                  : ""
              }
            >
              High
            </option>

          </select>

        </div>

        <div class="settingRow">

          <div>
            <strong>View Distance</strong>
            <p>
              How far objects remain visible
            </p>
          </div>

          <select
            id="settingViewDistance"
            class="settingsSelect"
          >

            <option
              value="low"
              ${
                getSetting(
                  "viewDistance"
                ) === "low"
                  ? "selected"
                  : ""
              }
            >
              Low
            </option>

            <option
              value="medium"
              ${
                getSetting(
                  "viewDistance"
                ) === "medium"
                  ? "selected"
                  : ""
              }
            >
              Medium
            </option>

            <option
              value="high"
              ${
                getSetting(
                  "viewDistance"
                ) === "high"
                  ? "selected"
                  : ""
              }
            >
              High
            </option>

          </select>

        </div>

      </div>
    `;

    bindGraphicsSettings();

    return;
  }

  if (
    currentTab ===
    "audio"
  ) {
    content.innerHTML = `
      <div class="settingsSection">

        <h3>Audio</h3>

        ${createVolumeSlider(
          "masterVolume",
          "Master Volume",
          "Overall game volume"
        )}

        ${createVolumeSlider(
          "musicVolume",
          "Music Volume",
          "Background music"
        )}

        ${createVolumeSlider(
          "effectsVolume",
          "Effects Volume",
          "Tools and interaction sounds"
        )}

        ${createVolumeSlider(
          "environmentVolume",
          "Environment Volume",
          "Wind, water and nature"
        )}

        ${createVolumeSlider(
          "animalVolume",
          "Animal Volume",
          "Animal sounds"
        )}

      </div>
    `;

    bindAudioSettings();

    return;
  }

  if (
    currentTab ===
    "vr"
  ) {
    content.innerHTML = `
      <div class="settingsSection">

        <h3>VR</h3>

        <div class="settingInfoCard">

          <div class="settingInfoIcon">
            🥽
          </div>

          <div>

            <strong>
              Meta Quest
            </strong>

            <p>
              These settings are designed
              for Quest VR controls.
            </p>

          </div>

        </div>

        <div class="settingRow">

          <div>
            <strong>Vibration</strong>
            <p>
              Controller haptic feedback
            </p>
          </div>

          <label class="toggle">

            <input
              type="checkbox"
              id="settingVRVibration"
              ${
                getSetting(
                  "vibration"
                )
                  ? "checked"
                  : ""
              }
            >

            <span class="toggleSlider"></span>

          </label>

        </div>

        <button
          class="secondaryButton fullWidthButton"
          id="recalibrateButton"
        >
          Recalibrate VR
        </button>

        <button
          class="secondaryButton fullWidthButton"
          id="resetVRButton"
        >
          Reset VR View
        </button>

      </div>
    `;

    bindVRSettings();

    return;
  }
}

// ------------------------------------------------------------
// VOLUME SLIDER
// ------------------------------------------------------------

function createVolumeSlider(
  key,
  title,
  description
) {
  const value =
    Math.round(
      getSetting(key) * 100
    );

  return `
    <div class="settingSliderRow">

      <div class="settingSliderHeader">

        <div>
          <strong>
            ${title}
          </strong>

          <p>
            ${description}
          </p>
        </div>

        <span
          id="${key}Value"
        >
          ${value}%
        </span>

      </div>

      <input
        type="range"
        class="settingRange"
        id="${key}"
        min="0"
        max="100"
        value="${value}"
      >

    </div>
  `;
}

// ------------------------------------------------------------
// BIND GAMEPLAY
// ------------------------------------------------------------

function bindGameplaySettings() {
  const autoSave =
    document.getElementById(
      "settingAutoSave"
    );

  if (autoSave) {
    autoSave.addEventListener(
      "change",
      event => {
        window.SurvivalVR.systems
          ?.save
          ?.setAutoSaveEnabled?.(
            event.target.checked
          );
      }
    );
  }

  const vibration =
    document.getElementById(
      "settingVibration"
    );

  if (vibration) {
    vibration.addEventListener(
      "change",
      event => {
        setSetting(
          "vibration",
          event.target.checked
        );
      }
    );
  }

  const snapTurning =
    document.getElementById(
      "settingSnapTurning"
    );

  if (snapTurning) {
    snapTurning.addEventListener(
      "change",
      event => {
        setSetting(
          "snapTurning",
          event.target.checked
        );
      }
    );
  }

  const snapAmount =
    document.getElementById(
      "settingSnapAmount"
    );

  if (snapAmount) {
    snapAmount.addEventListener(
      "change",
      event => {
        setSetting(
          "snapTurnAmount",
          Number(
            event.target.value
          )
        );
      }
    );
  }
}

// ------------------------------------------------------------
// BIND GRAPHICS
// ------------------------------------------------------------

function bindGraphicsSettings() {
  const quality =
    document.getElementById(
      "settingGraphicsQuality"
    );

  if (quality) {
    quality.addEventListener(
      "change",
      event => {
        setSetting(
          "graphicsQuality",
          event.target.value
        );
      }
    );
  }

  const shadows =
    document.getElementById(
      "settingShadows"
    );

  if (shadows) {
    shadows.addEventListener(
      "change",
      event => {
        setSetting(
          "shadows",
          event.target.checked
        );
      }
    );
  }

  const water =
    document.getElementById(
      "settingWaterQuality"
    );

  if (water) {
    water.addEventListener(
      "change",
      event => {
        setSetting(
          "waterQuality",
          event.target.value
        );
      }
    );
  }

  const grass =
    document.getElementById(
      "settingGrassQuality"
    );

  if (grass) {
    grass.addEventListener(
      "change",
      event => {
        setSetting(
          "grassQuality",
          event.target.value
        );
      }
    );
  }

  const viewDistance =
    document.getElementById(
      "settingViewDistance"
    );

  if (viewDistance) {
    viewDistance.addEventListener(
      "change",
      event => {
        setSetting(
          "viewDistance",
          event.target.value
        );
      }
    );
  }
}

// ------------------------------------------------------------
// BIND AUDIO
// ------------------------------------------------------------

function bindAudioSettings() {
  const keys = [
    "masterVolume",
    "musicVolume",
    "effectsVolume",
    "environmentVolume",
    "animalVolume"
  ];

  keys.forEach(key => {
    const slider =
      document.getElementById(
        key
      );

    const value =
      document.getElementById(
        `${key}Value`
      );

    if (!slider) {
      return;
    }

    slider.addEventListener(
      "input",
      event => {
        const number =
          Number(
            event.target.value
          );

        const normalized =
          number / 100;

        setSetting(
          key,
          normalized
        );

        if (value) {
          value.textContent =
            `${number}%`;
        }
      }
    );
  });
}

// ------------------------------------------------------------
// BIND VR
// ------------------------------------------------------------

function bindVRSettings() {
  const vibration =
    document.getElementById(
      "settingVRVibration"
    );

  if (vibration) {
    vibration.addEventListener(
      "change",
      event => {
        setSetting(
          "vibration",
          event.target.checked
        );
      }
    );
  }

  const recalibrate =
    document.getElementById(
      "recalibrateButton"
    );

  if (recalibrate) {
    recalibrate.addEventListener(
      "click",
      () => {
        window.SurvivalVR
          .hands
          ?.recalibrate?.();

        gameEvent(
          "vr-recalibrated"
        );

        showMessage(
          "VR recalibrated"
        );
      }
    );
  }

  const resetView =
    document.getElementById(
      "resetVRButton"
    );

  if (resetView) {
    resetView.addEventListener(
      "click",
      () => {
        window.SurvivalVR
          .hands
          ?.recalibrate?.();

        showMessage(
          "VR view reset"
        );
      }
    );
  }
}

// ------------------------------------------------------------
// REFRESH UI
// ------------------------------------------------------------

function refreshSettingsUI() {
  if (
    !settingsState.open
  ) {
    return;
  }

  renderSettingsTab();
}

// ------------------------------------------------------------
// OPEN / CLOSE
// ------------------------------------------------------------

function openSettings() {
  const ui =
    document.getElementById(
      "settingsUI"
    );

  if (!ui) {
    createSettingsUI();
  }

  ensureSettings();

  const panel =
    document.getElementById(
      "settingsUI"
    );

  if (!panel) {
    return;
  }

  panel.classList.remove(
    "hidden"
  );

  settingsState.open =
    true;

  renderSettingsTab();

  gameEvent(
    "settings-opened"
  );
}

function closeSettings() {
  const panel =
    document.getElementById(
      "settingsUI"
    );

  if (!panel) {
    return;
  }

  panel.classList.add(
    "hidden"
  );

  settingsState.open =
    false;

  gameEvent(
    "settings-closed"
  );
}

function toggleSettings() {
  if (
    settingsState.open
  ) {
    closeSettings();
  } else {
    openSettings();
  }
}

// ------------------------------------------------------------
// RESET
// ------------------------------------------------------------

function resetSettings() {
  const confirmed =
    window.confirm(
      "Reset all settings to their defaults?"
    );

  if (!confirmed) {
    return;
  }

  GAME.settings =
    structuredClone(
      DEFAULT_SETTINGS
    );

  for (
    const [key, value]
    of Object.entries(
      GAME.settings
    )
  ) {
    applySetting(
      key,
      value
    );
  }

  renderSettingsTab();

  gameEvent(
    "settings-reset"
  );

  showMessage(
    "Settings reset"
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
        "o"
      ) {
        toggleSettings();
      }

      if (
        event.key === "Escape" &&
        settingsState.open
      ) {
        closeSettings();
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
        settingsState.open
      ) {
        closeSettings();
      }
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
    }, 2200);
}

// ------------------------------------------------------------
// PUBLIC SYSTEM
// ------------------------------------------------------------

const settingsSystem = {
  state:
    settingsState,

  defaults:
    DEFAULT_SETTINGS,

  open:
    openSettings,

  close:
    closeSettings,

  toggle:
    toggleSettings,

  get:
    getSetting,

  set:
    setSetting,

  reset:
    resetSettings,

  refresh:
    refreshSettingsUI
};

// ------------------------------------------------------------
// REGISTER
// ------------------------------------------------------------

window.SurvivalVR.systems.settings =
  settingsSystem;

window.SurvivalVR.settings =
  settingsSystem;

// ------------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------------

ensureSettings();

createSettingsUI();

setupKeyboard();

setupMenuButton();

settingsState.initialized =
  true;

console.log(
  "[SurvivalVR] Settings system initialized"
);

export {
  settingsSystem,
  openSettings,
  closeSettings,
  getSetting,
  setSetting
};