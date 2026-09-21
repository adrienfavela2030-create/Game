import * as THREE from "three";

const S = window.SurvivalVR;

if (!S) {
  throw new Error("SurvivalVR must exist before vrhud.js loads.");
}


// ============================================================
// VR SURVIVAL HUD
// ============================================================

const state = {

  initialized: false,

  root: null,

  background: null,

  healthText: null,
  hungerText: null,
  thirstText: null,
  staminaText: null,

  dayText: null,
  timeText: null,
  periodText: null,

  lastUpdate: 0,

  updateRate: 0.1

};


// ============================================================
// TEXT SPRITE
// ============================================================

function createText(
  text,
  size = 64,
  color = "#ffffff"
) {

  const canvas =
    document.createElement("canvas");

  canvas.width = 1024;
  canvas.height = 128;

  const ctx =
    canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.font =
    `bold ${size}px Arial`;

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    color;

  ctx.shadowColor =
    "rgba(0,0,0,0.9)";

  ctx.shadowBlur =
    8;

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height / 2
  );


  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.needsUpdate = true;


  const material =
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });


  const sprite =
    new THREE.Sprite(material);

  sprite.scale.set(
    0.9,
    0.1125,
    1
  );


  sprite.userData.canvas =
    canvas;

  sprite.userData.context =
    ctx;

  sprite.userData.texture =
    texture;

  sprite.userData.fontSize =
    size;


  return sprite;

}


// ============================================================
// UPDATE TEXT
// ============================================================

function setText(
  sprite,
  text,
  color = "#ffffff"
) {

  if (!sprite) {
    return;
  }


  const canvas =
    sprite.userData.canvas;

  const ctx =
    sprite.userData.context;


  if (!canvas || !ctx) {
    return;
  }


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.font =
    `bold ${sprite.userData.fontSize}px Arial`;

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    color;

  ctx.shadowColor =
    "rgba(0,0,0,0.9)";

  ctx.shadowBlur =
    8;

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height / 2
  );


  sprite.userData.texture.needsUpdate =
    true;

}


// ============================================================
// BACKGROUND PANEL
// ============================================================

function createPanel() {

  const geometry =
    new THREE.PlaneGeometry(
      2.0,
      0.42
    );


  const material =
    new THREE.MeshBasicMaterial({
      color: 0x08140f,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });


  const panel =
    new THREE.Mesh(
      geometry,
      material
    );


  panel.position.set(
    0,
    0,
    -0.02
  );


  return panel;

}


// ============================================================
// ICON / STAT TEXT
// ============================================================

function createStat(
  text,
  x,
  y
) {

  const sprite =
    createText(
      text,
      42
    );


  sprite.position.set(
    x,
    y,
    0
  );


  sprite.scale.set(
    0.52,
    0.065,
    1
  );


  state.root.add(
    sprite
  );


  return sprite;

}


// ============================================================
// CREATE HUD
// ============================================================

function createHUD() {

  if (!S.camera) {
    console.error(
      "VR HUD: camera missing."
    );

    return;
  }


  /*
   * The HUD is attached to the CAMERA.
   *
   * This means it follows the player's head.
   *
   * It does NOT modify the camera's position or rotation.
   */

  const root =
    new THREE.Group();

  root.name =
    "VRSurvivalHUD";


  /*
   * Put the HUD about 1.5 meters in front of the player.
   *
   * Negative Z = in front of the camera.
   */

  root.position.set(
    0,
    0.28,
    -1.55
  );


  root.renderOrder =
    999;


  S.camera.add(
    root
  );


  state.root =
    root;


  // ==========================================================
  // BACKGROUND
  // ==========================================================

  state.background =
    createPanel();


  root.add(
    state.background
  );


  // ==========================================================
  // HEALTH
  // ==========================================================

  state.healthText =
    createStat(
      "❤️ 100",
      -0.68,
      0.075
    );


  // ==========================================================
  // HUNGER
  // ==========================================================

  state.hungerText =
    createStat(
      "🍗 100",
      -0.23,
      0.075
    );


  // ==========================================================
  // THIRST
  // ==========================================================

  state.thirstText =
    createStat(
      "💧 100",
      0.23,
      0.075
    );


  // ==========================================================
  // STAMINA
  // ==========================================================

  state.staminaText =
    createStat(
      "⚡ 100",
      0.68,
      0.075
    );


  // ==========================================================
  // DAY
  // ==========================================================

  state.dayText =
    createStat(
      "DAY 1",
      -0.57,
      -0.105
    );


  // ==========================================================
  // TIME
  // ==========================================================

  state.timeText =
    createStat(
      "08:00",
      -0.05,
      -0.105
    );


  // ==========================================================
  // PERIOD
  // ==========================================================

  state.periodText =
    createStat(
      "☀ DAY",
      0.52,
      -0.105
    );


  state.initialized =
    true;

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(hours) {

  hours =
    Number(hours);

  if (!Number.isFinite(hours)) {
    hours = 8;
  }


  hours =
    ((hours % 24) + 24) % 24;


  const h =
    Math.floor(hours);

  const minutes =
    Math.floor(
      (hours - h) * 60
    );


  return (
    String(h).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );

}


// ============================================================
// GET PERIOD
// ============================================================

function getPeriod(hours) {

  if (
    hours >= 6 &&
    hours < 12
  ) {

    return {
      text: "☀ MORNING",
      color: "#ffe082"
    };

  }


  if (
    hours >= 12 &&
    hours < 18
  ) {

    return {
      text: "☀ DAY",
      color: "#fff59d"
    };

  }


  if (
    hours >= 18 &&
    hours < 21
  ) {

    return {
      text: "🌅 SUNSET",
      color: "#ffb74d"
    };

  }


  if (
    hours >= 21 ||
    hours < 5
  ) {

    return {
      text: "🌙 NIGHT",
      color: "#b39ddb"
    };

  }


  return {
    text: "🌅 DAWN",
    color: "#ffcc80"
  };

}


// ============================================================
// UPDATE
// ============================================================

function update(
  delta = 0.016
) {

  if (!state.initialized) {
    return;
  }


  state.lastUpdate +=
    delta;


  if (
    state.lastUpdate <
    state.updateRate
  ) {

    return;

  }


  state.lastUpdate = 0;


  const player =
    S.player;


  if (!player) {
    return;
  }


  // ==========================================================
  // SURVIVAL STATS
  // ==========================================================

  setText(
    state.healthText,
    `❤️ ${Math.round(player.health ?? 100)}`
  );


  setText(
    state.hungerText,
    `🍗 ${Math.round(player.hunger ?? 100)}`
  );


  setText(
    state.thirstText,
    `💧 ${Math.round(player.thirst ?? 100)}`
  );


  setText(
    state.staminaText,
    `⚡ ${Math.round(player.stamina ?? 100)}`
  );


  // ==========================================================
  // WORLD TIME
  // ==========================================================

  const world =
    S.GAME?.world;


  const day =
    world?.day ?? 1;


  const hours =
    world?.time ?? 8;


  setText(
    state.dayText,
    `DAY ${day}`
  );


  setText(
    state.timeText,
    formatTime(hours)
  );


  const period =
    getPeriod(hours);


  setText(
    state.periodText,
    period.text,
    period.color
  );

}


// ============================================================
// SHOW / HIDE
// ============================================================

function setVisible(
  visible
) {

  if (state.root) {

    state.root.visible =
      visible;

  }

}


// ============================================================
// SETUP
// ============================================================

function setupVRHUD() {

  if (state.initialized) {

    return state;

  }


  createHUD();


  console.log(
    "Floating VR survival HUD initialized."
  );


  return state;

}


// ============================================================
// EXPORT
// ============================================================

S.vrHUD =
  state;

S.setupVRHUD =
  setupVRHUD;

S.updateVRHUD =
  update;


export {
  setupVRHUD,
  update
};


export default {
  setupVRHUD,
  update
};