const diceButton = document.querySelector("#dice-button");
const dice = document.querySelector("#dice");
const resultValue = document.querySelector("#result-value");
const faces = [...document.querySelectorAll(".face")];

const faceTransforms = {
  1: "rotateX(-18deg) rotateY(28deg) rotateZ(0deg) scale(1.16)",
  2: "rotateX(-105deg) rotateY(20deg) rotateZ(-12deg) scale(1.16)",
  3: "rotateX(-16deg) rotateY(-64deg) rotateZ(8deg) scale(1.16)",
  4: "rotateX(-16deg) rotateY(116deg) rotateZ(-8deg) scale(1.16)",
  5: "rotateX(74deg) rotateY(18deg) rotateZ(12deg) scale(1.16)",
  6: "rotateX(-18deg) rotateY(208deg) rotateZ(0deg) scale(1.16)",
};

let currentTransform = "rotateX(-20deg) rotateY(32deg) rotateZ(0deg) scale(1)";
let rolling = false;
let audioContext = null;
let ambient = null;
let rattleTimers = [];
let musicTimer = null;

dice.style.setProperty("--from-transform", currentTransform);
dice.style.setProperty("--to-transform", currentTransform);

diceButton.addEventListener("click", rollDice);
window.addEventListener("pointerdown", startAudio, { once: true });

function rollDice() {
  if (rolling) {
    return;
  }

  startAudio();

  const value = Math.floor(Math.random() * 6) + 1;
  const nextTransform = faceTransforms[value];

  rolling = true;
  resultValue.textContent = "-";
  clearGlow();
  playRattle();
  diceButton.classList.remove("rolling");
  dice.style.setProperty("--from-transform", currentTransform);
  dice.style.setProperty("--to-transform", nextTransform);

  requestAnimationFrame(() => {
    diceButton.classList.add("rolling");
  });

  window.setTimeout(() => {
    currentTransform = nextTransform;
    dice.style.transform = `translate(-50%, -56%) ${currentTransform}`;
    diceButton.classList.remove("rolling");
    document.querySelector(`.face-${value}`).classList.add("result-glow");
    resultValue.textContent = value;
    playLanding();
    window.setTimeout(playGlowChime, 120);
    rolling = false;
  }, 1680);
}

function clearGlow() {
  for (const face of faces) {
    face.classList.remove("result-glow");
  }
}

function startAudio() {
  if (audioContext) {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  audioContext = new AudioContext();
  startAmbientSound();
}

function startAmbientSound() {
  const master = audioContext.createGain();
  master.gain.value = 0.055;
  master.connect(audioContext.destination);

  ambient = { master };
  scheduleGameMusic();
  musicTimer = window.setInterval(scheduleGameMusic, 3800);
}

function scheduleGameMusic() {
  if (!audioContext || !ambient) {
    return;
  }

  const start = audioContext.currentTime + 0.05;
  const beat = 0.18;
  const melody = [
    523.25, 659.25, 783.99, 1046.5,
    783.99, 659.25, 587.33, 659.25,
    523.25, 659.25, 783.99, 987.77,
    880.0, 783.99, 659.25, 587.33,
  ];
  const bass = [130.81, 130.81, 196.0, 196.0, 146.83, 146.83, 174.61, 196.0];

  melody.forEach((frequency, index) => {
    playMusicNote(frequency, start + index * beat, beat * 0.78, 0.095, "square");
  });

  bass.forEach((frequency, index) => {
    playMusicNote(frequency, start + index * beat * 2, beat * 1.3, 0.052, "triangle");
  });
}

function playMusicNote(frequency, start, duration, volume, type) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1500, start);

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ambient.master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playRattle() {
  clearRattleTimers();

  for (let index = 0; index < 16; index += 1) {
    const delay = index * 86 + Math.random() * 38;
    rattleTimers.push(
      window.setTimeout(() => {
        playClick(180 + Math.random() * 360, 0.035 + Math.random() * 0.025);
      }, delay),
    );
  }
}

function playClick(frequency, volume) {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.42), now + 0.045);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

function playLanding() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(78, now);
  oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.16);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.22);
}

function playGlowChime() {
  if (!audioContext) {
    return;
  }

  playTone(660, 0.075, 0);
  playTone(990, 0.045, 0.06);
}

function playTone(frequency, volume, delay) {
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.36);
}

function clearRattleTimers() {
  for (const timer of rattleTimers) {
    window.clearTimeout(timer);
  }
  rattleTimers = [];
}
