// Turns hand landmarks into a screen cursor, and a pinch into a click.

import { INDEX_TIP, THUMB_TIP, WRIST, MIDDLE_MCP } from "./hands.js";

// The hand is usually somewhere in the middle of the frame, so pointing only
// covers the middle of the screen. This gain pushes positions outwards so the
// cursor can reach the edges without leaving your seat.
const GAIN = 1.35;

// Pinch is measured relative to the size of the hand, so it behaves the same
// close to the camera and far from it. On and off thresholds differ so a
// half-closed pinch does not flicker.
const PINCH_ON = 0.45;
const PINCH_OFF = 0.68;

// Minimum gap between clicks, in ms. Without this a held pinch fires a stream
// of clicks.
const CLICK_COOLDOWN = 350;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function createPointer({ cursorEl, onClick }) {
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let started = false;
  let pinching = false;
  let lastClick = 0;
  let hovered = null;

  const state = { visible: false, ratio: 1, pinching: false };

  function moveTo(nextX, nextY) {
    x = nextX;
    y = nextY;
    cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // Hover feedback: whatever sits under the cursor gets marked, so you can
    // see the target before you commit to a pinch.
    const el = document.elementFromPoint(x, y);
    const target = el ? el.closest(HOVERABLE) : null;
    if (target !== hovered) {
      if (hovered) hovered.removeAttribute("data-hover");
      if (target) target.setAttribute("data-hover", "");
      hovered = target;
    }
  }

  function setPinching(next) {
    pinching = next;
    state.pinching = next;
    cursorEl.dataset.pinching = String(next);
  }

  function click() {
    const now = performance.now();
    if (now - lastClick < CLICK_COOLDOWN) return;
    lastClick = now;

    const el = document.elementFromPoint(x, y);
    const target = el ? el.closest(HOVERABLE) : null;
    if (target) target.click();
    onClick?.({ x, y, target });
  }

  return {
    state,

    hide() {
      state.visible = false;
      cursorEl.hidden = true;
      if (hovered) hovered.removeAttribute("data-hover");
      hovered = null;
    },

    /**
     * @param {Array<{x:number,y:number}>} landmarks 21 normalised points
     * @param {number} dtMs time since the previous frame
     */
    update(landmarks, dtMs) {
      state.visible = true;
      cursorEl.hidden = false;

      const tip = landmarks[INDEX_TIP];
      const thumb = landmarks[THUMB_TIP];
      const handSize = distance(landmarks[WRIST], landmarks[MIDDLE_MCP]) || 0.001;
      state.ratio = distance(thumb, tip) / handSize;

      // Mirror X: the camera sees a mirrored you, but you expect the cursor to
      // go right when your hand goes right.
      const targetX = clamp((1 - tip.x - 0.5) * GAIN + 0.5, 0, 1) * window.innerWidth;
      const targetY = clamp((tip.y - 0.5) * GAIN + 0.5, 0, 1) * window.innerHeight;

      if (!started) {
        // First frame jumps straight to the hand instead of sliding in from
        // the middle of the screen.
        x = targetX;
        y = targetY;
        started = true;
      } else {
        // Frame-rate independent smoothing. At 60 fps this is a gentle trail,
        // at 30 fps it does not turn into a laggy drag.
        const alpha = 1 - Math.exp(-dtMs / 55);
        x += (targetX - x) * alpha;
        y += (targetY - y) * alpha;
      }

      moveTo(x, y);

      if (!pinching && state.ratio < PINCH_ON) {
        setPinching(true);
        click();
      } else if (pinching && state.ratio > PINCH_OFF) {
        setPinching(false);
      }
    },
  };
}

const HOVERABLE =
  'button, a[href], input, select, textarea, label, [role="button"], [data-clickable]';
