# TouchAR

Point at the screen with your hand. No mouse, no trackpad, no keyboard.

TouchAR is a browser layer that turns a webcam into a pointing device. Your index fingertip becomes the cursor and a pinch between thumb and index finger becomes a click, so any normal web page underneath can be used from a distance. It runs entirely in the browser: the camera feed never leaves the device.

There is a live demo page in this repository. Start the camera, point at a tile, pinch to open it.

## Status

Early. The pointing and clicking layer works and the demo page exercises it. The parts that make this feel like more than a novelty (gesture set, calibration, dwell-free accuracy, accessibility) are the next phase and are listed in [ROADMAP.md](ROADMAP.md).

## How it works

1. `getUserMedia` opens the webcam and streams it into a hidden `<video>`.
2. [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) (WASM, loaded from a CDN) returns 21 landmarks per hand on every frame.
3. `src/pointer.js` maps the index fingertip into screen coordinates, mirrors the X axis so pointing feels natural, and smooths the result so the cursor does not jitter.
4. Pinch detection compares thumb tip to index tip, normalised by hand size, so it works close to and far from the camera. Hysteresis stops a pinch from firing twice.
5. On pinch, `document.elementFromPoint` finds whatever is under the cursor and clicks it, so ordinary buttons, links and form controls respond without any special wiring.

The mouse and keyboard still work. The camera is opt-in: nothing is requested until the Start button is pressed, and Stop releases the camera track.

## Built with

Plain ES modules and CSS, no build step, no bundler and no package install. MediaPipe Tasks Vision and its WASM files are pulled from jsDelivr, and the hand landmark model from Google's model host, both pinned by version in `src/hands.js`.

## Run it

```bash
git clone https://github.com/TamiloreO/TouchAR.git
cd TouchAR
python3 -m http.server 8000
```

Open http://localhost:8000 on a laptop with a webcam, then press **Start camera** and allow access.

Two constraints worth knowing:

- `getUserMedia` only works on `localhost` or over HTTPS. Opening `index.html` from the file system will not work.
- The page must be served over HTTP, not opened as `file://`, because it uses ES modules.

## Repository layout

```
.
├── index.html      # demo page, and the HUD that shows tracking state
├── src/hands.js    # loads the model, wraps detection
├── src/pointer.js  # landmarks to screen coordinates, pinch to click
├── src/app.js      # wires camera, detection loop and pointer together
└── src/style.css   # demo page and cursor styling
```

## What is next

[ROADMAP.md](ROADMAP.md): drag and grab, scrolling, dwell click as an alternative to pinching, calibration, two-hand gestures, then the accessibility and performance work. The long-term aim is that the same layer works over any page, including one behind a screen in a room.

## License

[MIT](LICENSE) © Oluwatamilore Olufohunsi
