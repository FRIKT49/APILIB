/**
 * API Library - bgDotsCanvas.js
 * Bridges and initializes the Google Antigravity Particle Field
 */

import { initAntigravityCanvas } from "./antigravityCanvas.js";

export function initBgDotsCanvas(canvasId = "bgDotsCanvas") {
  return initAntigravityCanvas(canvasId);
}

export { initAntigravityCanvas };
