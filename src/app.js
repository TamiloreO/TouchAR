// Wires the camera, the hand model and the pointer together.

import { createHandTracker, HAND_CONNECTIONS } from "./hands.js";
import { createPointer } from "./pointer.js";

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const pip = document.getElementById("pip");
const cursor = document.getElementById("cursor");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const fatal = document.getElementById("fatal");
const logEl = document.getElementById("log");
const ctx = overlay.getContext("2d");

const chip = {
  camera: document.getElementById("chip-camera"),
  hand: document.getElementById("chip-hand"),
  gesture: document.getElementById("chip-gesture"),
  fps: document.getElementById("chip-fps"),
};

const pointer = createPointer({
  cursorEl: cursor,
  onClick: ({ target }) => {
    const label = target?.dataset.action || target?.textContent?.trim().slice(0, 40);
    log(`click${label ? `: ${label}` : ""}`);
  },
});

let stream = null;
let tracker = null;
let running = false;
let lastVideoTime = -1;
let lastFrameAt = 0;
let frames = 0;
let fpsAt = 0;
let lostHandAt = 0;

function log(message) {
  logEl.querySelector(".log-empty")?.remove();

  const item = document.createElement("li");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  item.textContent = `${time}  ${message}`;
  logEl.prepend(item);
  while (logEl.children.length > 8) logEl.lastElementChild.remove();
}

function setChip(el, text, state) {
  el.textContent = text;
  el.dataset.state = state;
}

function fail(message) {
  fatal.textContent = message;
  fatal.hidden = false;
  setChip(chip.camera, "camera off", "off");
}

async function start() {
  fatal.hidden = true;
  startBtn.disabled = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();
    pip.hidden = false;
    setChip(chip.camera, "camera on", "on");
    log("camera started");

    setChip(chip.hand, "loading model", "wait");
    tracker = await createHandTracker({ numHands: 1 });
    setChip(chip.hand, "no hand", "off");
    log("hand model ready");

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    running = true;
    stopBtn.disabled = false;
    requestAnimationFrame(loop);
  } catch (error) {
    console.error(error);
    startBtn.disabled = false;
    if (error?.name === "NotAllowedError") {
      fail("Camera permission was blocked. Allow camera access for this page and press Start camera again.");
    } else if (error?.name === "NotFoundError") {
      fail("No camera was found on this device.");
    } else {
      fail(`Could not start: ${error?.message || error}`);
    }
    stop();
  }
}

function stop() {
  running = false;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  if (tracker) {
    tracker.close?.();
    tracker = null;
  }
  video.srcObject = null;
  pip.hidden = true;
  pointer.hide();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setChip(chip.camera, "camera off", "off");
  setChip(chip.hand, "no hand", "off");
  setChip(chip.gesture, "open", "idle");
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);

  if (video.readyState < 2) return;

  const dt = lastFrameAt ? now - lastFrameAt : 16;
  lastFrameAt = now;

  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;

  let result = null;
  try {
    result = tracker.detectForVideo(video, now);
  } catch (error) {
    console.warn("TouchAR: detection failed", error);
    return;
  }

  drawLandmarks(result?.landmarks?.[0]);

  const hand = result?.landmarks?.[0];
  if (hand) {
    lostHandAt = 0;
    pointer.update(hand, dt);
    setChip(chip.hand, "hand tracked", "on");
    setChip(chip.gesture, pointer.state.pinching ? "pinch" : "open", pointer.state.pinching ? "on" : "idle");
  } else if (!lostHandAt) {
    lostHandAt = now;
  } else if (now - lostHandAt > 400) {
    pointer.hide();
    setChip(chip.hand, "no hand", "off");
    setChip(chip.gesture, "open", "idle");
  }

  frames += 1;
  if (now - fpsAt > 500) {
    const fps = Math.round((frames * 1000) / (now - fpsAt));
    chip.fps.textContent = `${fps} fps`;
    frames = 0;
    fpsAt = now;
  }
}

function drawLandmarks(hand) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  if (!hand) return;

  const w = overlay.width;
  const h = overlay.height;

  ctx.strokeStyle = "rgba(120, 255, 214, 0.5)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.moveTo(hand[a].x * w, hand[a].y * h);
    ctx.lineTo(hand[b].x * w, hand[b].y * h);
  }
  ctx.stroke();

  ctx.fillStyle = "rgba(120, 255, 214, 0.95)";
  for (const point of hand) {
    ctx.beginPath();
    ctx.arc(point.x * w, point.y * h, Math.max(2, w * 0.006), 0, Math.PI * 2);
    ctx.fill();
  }

  // The fingertip driving the cursor, in a different colour.
  const tip = hand[8];
  ctx.fillStyle = "rgba(255, 210, 110, 1)";
  ctx.beginPath();
  ctx.arc(tip.x * w, tip.y * h, Math.max(3, w * 0.01), 0, Math.PI * 2);
  ctx.fill();
}

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);

if (!navigator.mediaDevices?.getUserMedia) {
  startBtn.disabled = true;
  fail("This browser does not expose a camera API. Try a recent Chrome, Edge, Firefox or Safari.");
}

document.querySelectorAll(".tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    document.documentElement.dataset.tone = tile.dataset.tone || "violet";
    log(`${tile.dataset.tone} tone`);
  });
});
