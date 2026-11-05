# Roadmap

The end state: a small script any page can load, that turns a webcam into a pointing device good enough to use from across a room, and eventually one that a screen in a physical space can run. Everything below runs in the browser. Nothing is uploaded.

Estimates are working hours.

## Phase 1: point and click (done)

- [x] Camera capture with an explicit opt-in, and a Stop that releases the track.
- [x] Hand landmark detection on every frame, with the tracks drawn in the preview.
- [x] Index fingertip to cursor, mirrored and smoothed, with a reach gain so edges of the screen are reachable.
- [x] Pinch to click, normalised by hand size, with hysteresis and a cooldown.
- [x] Hover feedback and a click that goes through `elementFromPoint`, so ordinary buttons work.

## Phase 2: the gestures a pointer actually needs (about 8 hours)

- [ ] Freeze the cursor while pinching, so the act of pinching does not drag the target out from under itself.
- [ ] Drag and drop: pinch to grab, move, release to drop. Needs a synthetic pointer event sequence rather than `.click()`.
- [ ] Scroll: open palm moving up and down scrolls the page, with a deadzone so walking past the camera does not scroll.
- [ ] Right click: a two-finger tap, or a long pinch. Decide which after using it for a week.

Done when: a long article can be read and a list reordered without touching the machine.

## Phase 3: accuracy (about 6 hours)

- [ ] Calibration: a one-off step where you touch four corners of the reachable area, and the mapping is fitted to that box instead of the full frame.
- [ ] A per-session sensitivity and smoothing control in the HUD, so slow machines and fast ones both feel right.
- [ ] Dwell click as an alternative to pinching, with a progress ring, for people who cannot pinch reliably.
- [ ] Handle a second hand entering frame without the cursor jumping.

Done when: hitting a 24px target works first time, most times.

## Phase 4: a gesture set with an API (about 8 hours)

- [ ] Recognisers for fist, open palm, pinch, and a two-finger swipe, each with confidence and a cooldown.
- [ ] Expose them as events: `touchar.on("pinch", handler)` and `touchar.on("swipe-left", handler)`, so a page can add its own gestures.
- [ ] A gesture lab page that shows the live landmark stream, the recognised gesture, and the numbers behind the decision. This is what makes tuning possible.
- [ ] Two-hand gestures: pinching both hands and pulling apart to zoom.

Done when: a demo page reacts to three distinct gestures without any code specific to the hand model.

## Phase 5: usable on any page (about 6 hours)

- [ ] Ship as one script: `<script src="touchar.js"></script>` then `TouchAR.start()`, with the cursor and HUD in a shadow root so host styles cannot break it.
- [ ] A settings panel stored in `localStorage`: sensitivity, smoothing, dominant hand, dwell on or off.
- [ ] A bookmarklet or extension path, so it can sit over a site I do not control.
- [ ] Document the event API and publish a small demo page per gesture.

Done when: dropping one script tag into an unrelated page gives working pointing and clicking.

## Phase 6: performance and access (about 6 hours)

- [ ] Run detection in a worker with `OffscreenCanvas` and ship frames as `ImageBitmap`, so the main thread stays free for the page.
- [ ] Benchmark the full and lite hand models; pick per device instead of always taking the heavier one.
- [ ] Keyboard parity: everything reachable by gesture is reachable by keyboard, and gesture clicks announce through a live region.
- [ ] Respect `prefers-reduced-motion` for the cursor trail and the dwell ring.
- [ ] Test on a low-end Android phone and an older laptop; record the fps in the README.

Done when: it holds 25 fps on a five-year-old laptop while the page underneath stays responsive.

## Later

- Sign-language-adjacent gestures, if the recognisers turn out to be good enough to be respectful of them rather than a party trick.
- The screen-in-a-room case: a fixed camera looking at a wall display, with the person standing two metres back. That is the version worth showing people.

## Known limits

- Webcam only, so it inherits bad lighting and cluttered backgrounds.
- Two hands are detected but only the first is used for pointing.
- No on-device fallback when the CDN is unreachable. Vendoring the WASM files locally is a possible next step if offline use matters.
