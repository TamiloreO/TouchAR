// Thin wrapper around MediaPipe's Hand Landmarker.
//
// The library, its WASM build and the model are all fetched from pinned URLs so
// a version bump is a single edit. Nothing is bundled, which keeps the repo a
// plain static site you can serve with any file server.

const TASKS_VERSION = "0.10.14";
const BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/vision_bundle.mjs`;
const WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/**
 * Loads the landmarker. Tries the GPU delegate first and falls back to CPU,
 * which is slower but works on machines where WebGL2 is unavailable.
 */
export async function createHandTracker({ numHands = 1 } = {}) {
  const { FilesetResolver, HandLandmarker } = await import(BUNDLE_URL);
  const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);

  const options = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO",
    numHands,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });

  let tracker;
  try {
    tracker = await HandLandmarker.createFromOptions(fileset, options("GPU"));
  } catch (error) {
    console.warn("TouchAR: GPU delegate unavailable, using CPU.", error);
    tracker = await HandLandmarker.createFromOptions(fileset, options("CPU"));
  }

  return tracker;
}

// Landmark indices used by the pointer, from the 21-point hand model.
export const INDEX_TIP = 8;
export const THUMB_TIP = 4;
export const INDEX_PIP = 6;
export const WRIST = 0;
export const MIDDLE_MCP = 9;

// Bones drawn in the camera preview. Keeping them explicit beats guessing.
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
