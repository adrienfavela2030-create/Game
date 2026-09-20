// audio.js
// Survival VR - Audio System
//
// Uses Web Audio API for simple procedural sounds.
// No external audio files are required.

const {
  GAME,
  gameEvent
} = window.SurvivalVR;

// ------------------------------------------------------------
// AUDIO STATE
// ------------------------------------------------------------

const audioState = {
  initialized: false,
  enabled: true,
  started: false,

  context: null,

  masterGain: null,
  musicGain: null,
  effectsGain: null,
  environmentGain: null,
  animalGain: null,

  musicOscillators: [],
  windSource: null,
  windGain: null,

  currentMusic:
    "day",

  lastSoundTime: 0
};

// ------------------------------------------------------------
// DEFAULTS
// ------------------------------------------------------------

const DEFAULT_AUDIO = {
  masterVolume: 1,
  musicVolume: 0.7,
  effectsVolume: 1,
  environmentVolume: 0.8,
  animalVolume: 0.8
};

// ------------------------------------------------------------
// SETTINGS
// ------------------------------------------------------------

function getSetting(
  name
) {
  return (
    GAME.settings?.[name] ??
    DEFAULT_AUDIO[name]
  );
}

// ------------------------------------------------------------
// CREATE AUDIO CONTEXT
// ------------------------------------------------------------

function createAudioContext() {
  if (
    audioState.context
  ) {
    return audioState.context;
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    console.warn(
      "[SurvivalVR] Web Audio API unavailable."
    );

    audioState.enabled =
      false;

    return null;
  }

  audioState.context =
    new AudioContextClass();

  createAudioBuses();

  return audioState.context;
}

// ------------------------------------------------------------
// AUDIO BUSES
// ------------------------------------------------------------

function createAudioBuses() {
  const context =
    audioState.context;

  if (!context) {
    return;
  }

  audioState.masterGain =
    context.createGain();

  audioState.musicGain =
    context.createGain();

  audioState.effectsGain =
    context.createGain();

  audioState.environmentGain =
    context.createGain();

  audioState.animalGain =
    context.createGain();

  audioState.musicGain.connect(
    audioState.masterGain
  );

  audioState.effectsGain.connect(
    audioState.masterGain
  );

  audioState.environmentGain.connect(
    audioState.masterGain
  );

  audioState.animalGain.connect(
    audioState.masterGain
  );

  audioState.masterGain.connect(
    context.destination
  );

  updateAllVolumes();
}

// ------------------------------------------------------------
// START AUDIO
// ------------------------------------------------------------

async function startAudio() {
  const context =
    createAudioContext();

  if (!context) {
    return false;
  }

  try {
    if (
      context.state ===
      "suspended"
    ) {
      await context.resume();
    }
  } catch (error) {
    console.warn(
      "[SurvivalVR] Could not start audio:",
      error
    );
  }

  audioState.started =
    true;

  if (
    !audioState.windSource
  ) {
    startWind();
  }

  if (
    audioState.musicOscillators
      .length === 0
  ) {
    startMusic();
  }

  return true;
}

// ------------------------------------------------------------
// VOLUME
// ------------------------------------------------------------

function setGainValue(
  gain,
  value
) {
  if (!gain) {
    return;
  }

  const context =
    audioState.context;

  const safeValue =
    Math.max(
      0,
      Math.min(
        1,
        Number(value) || 0
      )
    );

  if (context) {
    gain.gain.setTargetAtTime(
      safeValue,
      context.currentTime,
      0.03
    );
  } else {
    gain.gain.value =
      safeValue;
  }
}

function setMasterVolume(
  value
) {
  GAME.settings.masterVolume =
    value;

  setGainValue(
    audioState.masterGain,
    value
  );
}

function setMusicVolume(
  value
) {
  GAME.settings.musicVolume =
    value;

  setGainValue(
    audioState.musicGain,
    value
  );
}

function setEffectsVolume(
  value
) {
  GAME.settings.effectsVolume =
    value;

  setGainValue(
    audioState.effectsGain,
    value
  );
}

function setEnvironmentVolume(
  value
) {
  GAME.settings.environmentVolume =
    value;

  setGainValue(
    audioState.environmentGain,
    value
  );
}

function setAnimalVolume(
  value
) {
  GAME.settings.animalVolume =
    value;

  setGainValue(
    audioState.animalGain,
    value
  );
}

function updateAllVolumes() {
  setGainValue(
    audioState.masterGain,
    getSetting(
      "masterVolume"
    )
  );

  setGainValue(
    audioState.musicGain,
    getSetting(
      "musicVolume"
    )
  );

  setGainValue(
    audioState.effectsGain,
    getSetting(
      "effectsVolume"
    )
  );

  setGainValue(
    audioState.environmentGain,
    getSetting(
      "environmentVolume"
    )
  );

  setGainValue(
    audioState.animalGain,
    getSetting(
      "animalVolume"
    )
  );
}

// ------------------------------------------------------------
// BASIC TONE
// ------------------------------------------------------------

function playTone(
  frequency,
  duration,
  type = "sine",
  volume = 0.15,
  destination = null
) {
  const context =
    audioState.context;

  if (
    !context ||
    !audioState.enabled
  ) {
    return;
  }

  const output =
    destination ||
    audioState.effectsGain;

  if (!output) {
    return;
  }

  const oscillator =
    context.createOscillator();

  const gain =
    context.createGain();

  oscillator.type =
    type;

  oscillator.frequency.value =
    frequency;

  gain.gain.setValueAtTime(
    0,
    context.currentTime
  );

  gain.gain.linearRampToValueAtTime(
    volume,
    context.currentTime + 0.015
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime +
      duration
  );

  oscillator.connect(
    gain
  );

  gain.connect(
    output
  );

  oscillator.start();

  oscillator.stop(
    context.currentTime +
      duration +
      0.02
  );
}

// ------------------------------------------------------------
// NOISE
// ------------------------------------------------------------

function playNoise(
  duration = 0.2,
  volume = 0.08,
  destination = null
) {
  const context =
    audioState.context;

  if (
    !context ||
    !audioState.enabled
  ) {
    return;
  }

  const output =
    destination ||
    audioState.effectsGain;

  if (!output) {
    return;
  }

  const buffer =
    context.createBuffer(
      1,
      context.sampleRate *
        duration,
      context.sampleRate
    );

  const data =
    buffer.getChannelData(
      0
    );

  for (
    let i = 0;
    i < data.length;
    i++
  ) {
    data[i] =
      Math.random() * 2 - 1;
  }

  const source =
    context.createBufferSource();

  const gain =
    context.createGain();

  source.buffer =
    buffer;

  gain.gain.setValueAtTime(
    volume,
    context.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime +
      duration
  );

  source.connect(
    gain
  );

  gain.connect(
    output
  );

  source.start();

  source.stop(
    context.currentTime +
      duration
  );
}

// ------------------------------------------------------------
// EFFECTS
// ------------------------------------------------------------

function playPickupSound() {
  playTone(
    520,
    0.08,
    "sine",
    0.14
  );

  setTimeout(
    () => {
      playTone(
        760,
        0.1,
        "sine",
        0.12
      );
    },
    55
  );
}

function playCraftSound() {
  playTone(
    260,
    0.09,
    "triangle",
    0.13
  );

  setTimeout(
    () => {
      playTone(
        390,
        0.12,
        "triangle",
        0.13
      );
    },
    80
  );

  setTimeout(
    () => {
      playTone(
        620,
        0.14,
        "triangle",
        0.11
      );
    },
    160
  );
}

function playBuildSound() {
  playNoise(
    0.16,
    0.12
  );

  playTone(
    120,
    0.16,
    "square",
    0.08
  );
}

function playRockSound() {
  playNoise(
    0.12,
    0.1
  );

  playTone(
    170,
    0.08,
    "square",
    0.08
  );
}

function playWoodSound() {
  playNoise(
    0.1,
    0.08
  );

  playTone(
    110,
    0.08,
    "triangle",
    0.08
  );
}

function playDrinkSound() {
  playTone(
    520,
    0.07,
    "sine",
    0.08
  );

  setTimeout(
    () => {
      playTone(
        640,
        0.07,
        "sine",
        0.08
      );
    },
    90
  );

  setTimeout(
    () => {
      playTone(
        720,
        0.09,
        "sine",
        0.07
      );
    },
    180
  );
}

function playEatSound() {
  playNoise(
    0.12,
    0.06
  );

  playTone(
    240,
    0.07,
    "triangle",
    0.06
  );
}

function playDamageSound() {
  playTone(
    100,
    0.16,
    "sawtooth",
    0.14
  );

  playNoise(
    0.12,
    0.06
  );
}

function playDeathSound() {
  playTone(
    220,
    0.4,
    "sine",
    0.1
  );

  setTimeout(
    () => {
      playTone(
        130,
        0.6,
        "sine",
        0.08
      );
    },
    200
  );
}

function playMenuSound() {
  playTone(
    420,
    0.08,
    "sine",
    0.08
  );
}

function playSuccessSound() {
  playTone(
    440,
    0.08,
    "sine",
    0.08
  );

  setTimeout(
    () => {
      playTone(
        660,
        0.1,
        "sine",
        0.08
      );
    },
    90
  );
}

// ------------------------------------------------------------
// WIND
// ------------------------------------------------------------

function createWindNoise() {
  const context =
    audioState.context;

  if (!context) {
    return null;
  }

  const buffer =
    context.createBuffer(
      1,
      context.sampleRate * 2,
      context.sampleRate
    );

  const data =
    buffer.getChannelData(
      0
    );

  for (
    let i = 0;
    i < data.length;
    i++
  ) {
    data[i] =
      Math.random() * 2 - 1;
  }

  const source =
    context.createBufferSource();

  source.buffer =
    buffer;

  source.loop =
    true;

  return source;
}

function startWind() {
  if (
    audioState.windSource
  ) {
    return;
  }

  const context =
    audioState.context;

  if (!context) {
    return;
  }

  const source =
    createWindNoise();

  if (!source) {
    return;
  }

  const filter =
    context.createBiquadFilter();

  filter.type =
    "lowpass";

  filter.frequency.value =
    700;

  const gain =
    context.createGain();

  gain.gain.value =
    0.025;

  source.connect(
    filter
  );

  filter.connect(
    gain
  );

  gain.connect(
    audioState.environmentGain
  );

  source.start();

  audioState.windSource =
    source;

  audioState.windGain =
    gain;
}

function stopWind() {
  if (
    audioState.windSource
  ) {
    try {
      audioState.windSource.stop();
    } catch {
      // Already stopped.
    }
  }

  audioState.windSource =
    null;

  audioState.windGain =
    null;
}

// ------------------------------------------------------------
// SIMPLE MUSIC
// ------------------------------------------------------------

function stopMusic() {
  for (
    const oscillator
    of audioState.musicOscillators
  ) {
    try {
      oscillator.stop();
    } catch {
      // Already stopped.
    }
  }

  audioState.musicOscillators =
    [];

  if (
    audioState.musicGain
  ) {
    audioState.musicGain.gain.value =
      getSetting(
        "musicVolume"
      );
  }
}

function startMusic() {
  const context =
    audioState.context;

  if (
    !context ||
    !audioState.musicGain
  ) {
    return;
  }

  stopMusic();

  /*
   * Very quiet ambient tones.
   * These are intentionally subtle.
   */
  const notes = [
    196,
    246.94,
    293.66
  ];

  notes.forEach(
    (frequency, index) => {
      const oscillator =
        context.createOscillator();

      const gain =
        context.createGain();

      oscillator.type =
        "sine";

      oscillator.frequency.value =
        frequency;

      gain.gain.value =
        0.012;

      oscillator.connect(
        gain
      );

      gain.connect(
        audioState.musicGain
      );

      oscillator.start();

      audioState.musicOscillators.push(
        oscillator
      );
    }
  );
}

// ------------------------------------------------------------
// MUSIC MODE
// ------------------------------------------------------------

function setMusicMode(
  mode
) {
  if (
    audioState.currentMusic ===
    mode
  ) {
    return;
  }

  audioState.currentMusic =
    mode;

  if (
    audioState.started
  ) {
    startMusic();
  }
}

// ------------------------------------------------------------
// PUBLIC SOUND FUNCTIONS
// ------------------------------------------------------------

function playSound(
  name
) {
  if (
    !audioState.started
  ) {
    return;
  }

  switch (name) {

    case "pickup":
      playPickupSound();
      break;

    case "craft":
      playCraftSound();
      break;

    case "build":
      playBuildSound();
      break;

    case "rock":
      playRockSound();
      break;

    case "wood":
      playWoodSound();
      break;

    case "drink":
      playDrinkSound();
      break;

    case "eat":
      playEatSound();
      break;

    case "damage":
      playDamageSound();
      break;

    case "death":
      playDeathSound();
      break;

    case "menu":
      playMenuSound();
      break;

    case "success":
      playSuccessSound();
      break;
  }
}

// ------------------------------------------------------------
// EVENT CONNECTIONS
// ------------------------------------------------------------

function setupEvents() {

  window.addEventListener(
    "survival-inventory-changed",
    () => {
      playSound(
        "pickup"
      );
    }
  );

  window.addEventListener(
    "survival-crafting-complete",
    () => {
      playSound(
        "craft"
      );
    }
  );

  window.addEventListener(
    "survival-building-placed",
    () => {
      playSound(
        "build"
      );
    }
  );

  window.addEventListener(
    "survival-damage",
    () => {
      playSound(
        "damage"
      );
    }
  );

  window.addEventListener(
    "survival-player-died",
    () => {
      playSound(
        "death"
      );
    }
  );

  window.addEventListener(
    "survival-menu-button",
    () => {
      playSound(
        "menu"
      );
    }
  );

  window.addEventListener(
    "survival-game-started",
    () => {
      startAudio();
    }
  );

  window.addEventListener(
    "survival-world-generated",
    () => {
      startAudio();
    }
  );

  window.addEventListener(
    "survival-new-world-created",
    () => {
      startAudio();
    }
  );

  window.addEventListener(
    "survival-game-loaded",
    () => {
      startAudio();
    }
  );
}

// ------------------------------------------------------------
// FIRST USER INTERACTION
// ------------------------------------------------------------

function setupUserInteraction() {
  const startAudioOnce =
    () => {
      startAudio();
    };

  window.addEventListener(
    "pointerdown",
    startAudioOnce,
    {
      once: true
    }
  );

  window.addEventListener(
    "touchstart",
    startAudioOnce,
    {
      once: true
    }
  );

  window.addEventListener(
    "keydown",
    startAudioOnce,
    {
      once: true
    }
  );
}

// ------------------------------------------------------------
// SYSTEM
// ------------------------------------------------------------

const audioSystem = {
  state:
    audioState,

  start:
    startAudio,

  stopWind,

  play:
    playSound,

  setMasterVolume,

  setMusicVolume,

  setEffectsVolume,

  setEnvironmentVolume,

  setAnimalVolume,

  updateAllVolumes,

  setMusicMode
};

// ------------------------------------------------------------
// REGISTER
// ------------------------------------------------------------

window.SurvivalVR.systems.audio =
  audioSystem;

window.SurvivalVR.audio =
  audioSystem;

// ------------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------------

if (!GAME.settings) {
  GAME.settings = {};
}

for (
  const [key, value]
  of Object.entries(
    DEFAULT_AUDIO
  )
) {
  if (
    GAME.settings[key] ===
    undefined
  ) {
    GAME.settings[key] =
      value;
  }
}

setupEvents();

setupUserInteraction();

audioState.initialized =
  true;

console.log(
  "[SurvivalVR] Audio system initialized"
);

export {
  audioSystem,
  startAudio,
  playSound,
  setMasterVolume,
  setMusicVolume,
  setEffectsVolume,
  setEnvironmentVolume,
  setAnimalVolume
};