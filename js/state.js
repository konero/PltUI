/**
 * STATE MANAGEMENT
 * Centralized application state
 */

// Palette metadata
export let paletteData = null;

// Array of color objects
export let colors = [];

// Last filtered result for clipboard operations
export let lastFilteredColors = [];

// Currently selected color index (-1 = none)
export let selectedColorIndex = -1;

// Currently selected frame in timeline
export let selectedFrame = 0;

// Timeline end frame
export let endFrame = 100;

/**
 * State setters - use these to modify state
 */
export function setPaletteData(data) {
  paletteData = data;
}

export function setColors(newColors) {
  colors = newColors;
}

export function setLastFilteredColors(filtered) {
  lastFilteredColors = filtered;
}

export function setSelectedColorIndex(index) {
  selectedColorIndex = index;
}

export function setSelectedFrame(frame) {
  selectedFrame = frame;
}

export function setEndFrame(frame) {
  endFrame = frame;
}

/**
 * Color array manipulation helpers
 */
export function addColor(color) {
  colors.push(color);
}

export function removeColor(index) {
  colors.splice(index, 1);
}

export function updateColorAt(index, updates) {
  Object.assign(colors[index], updates);
}
