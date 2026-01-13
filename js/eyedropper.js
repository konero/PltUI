/**
 * EYEDROPPER / SCREEN COLOR PICKER
 * Allows picking colors from anywhere on the screen
 */

import * as State from './state.js';
import { renderPalette } from './renderer.js';
import { renderTimeline, getInterpolatedColor, updateUIForCurrentFrame } from './timeline.js';
import { updateWheelFromSelection } from './wheelManager.js';
import { selectColor, ensureCardSelected } from './ui.js';

// Track if eyedropper is currently active
let isEyedropperActive = false;
let targetColorIndex = -1;

/**
 * Check if the EyeDropper API is supported
 * @returns {boolean}
 */
export function isEyeDropperSupported() {
  return 'EyeDropper' in window;
}

/**
 * Activate the eyedropper for the currently selected color
 */
export function activateEyedropper() {
  if (State.selectedColorIndex < 0) {
    console.warn('No color selected for eyedropper');
    return;
  }
  
  // Don't allow picking for bg color (index 0)
  if (State.selectedColorIndex === 0) {
    console.warn('Cannot change background color');
    return;
  }
  
  activateEyedropperForCard(State.selectedColorIndex);
}

/**
 * Activate the eyedropper for a specific color card
 * @param {number} idx - Index of the color to update
 */
export function activateEyedropperForCard(idx) {
  if (idx < 0 || idx >= State.colors.length) {
    console.warn('Invalid color index for eyedropper');
    return;
  }
  
  // Don't allow picking for bg color (index 0)
  if (idx === 0) {
    console.warn('Cannot change background color');
    return;
  }
  
  // Check for API support
  if (!isEyeDropperSupported()) {
    showFallbackPicker(idx);
    return;
  }
  
  // Set target index first
  targetColorIndex = idx;
  isEyedropperActive = true;
  
  // Add visual indicator that eyedropper is active
  document.body.classList.add('eyedropper-active');
  
  // Open eyedropper immediately without selecting card first
  // This prevents re-render from disrupting the picker
  const eyeDropper = new EyeDropper();
  
  eyeDropper.open()
    .then(result => {
      // Parse the hex color result
      const color = parseHexColor(result.sRGBHex);
      applyPickedColor(color);
    })
    .catch(err => {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('EyeDropper error:', err);
      }
    })
    .finally(() => {
      isEyedropperActive = false;
      targetColorIndex = -1;
      document.body.classList.remove('eyedropper-active');
    });
}

/**
 * Parse a hex color string to RGB values
 * @param {string} hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns {Object} { r, g, b }
 */
function parseHexColor(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle shorthand hex (e.g., "f00" -> "ff0000")
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

/**
 * Apply the picked color to the target color card
 * @param {Object} color - { r, g, b } color object
 */
function applyPickedColor(color) {
  const idx = targetColorIndex;
  if (idx < 0 || idx >= State.colors.length) return;
  
  const colorObj = State.colors[idx];
  
  // Get current alpha (preserve it)
  let currentAlpha = colorObj.a;
  
  // Check if we're on a keyframe
  const existingKf = colorObj.keyframes?.find(kf => kf.frame === State.selectedFrame);
  
  if (existingKf) {
    // Update existing keyframe
    currentAlpha = existingKf.a;
    existingKf.r = color.r;
    existingKf.g = color.g;
    existingKf.b = color.b;
  } else if (colorObj.keyframes && colorObj.keyframes.length > 0) {
    // Has keyframes but we're not on one - create a new keyframe
    const frameColor = getInterpolatedColor(State.selectedFrame, colorObj);
    currentAlpha = frameColor.a;
    colorObj.keyframes.push({ 
      frame: State.selectedFrame, 
      r: color.r, 
      g: color.g, 
      b: color.b, 
      a: currentAlpha 
    });
    colorObj.keyframes.sort((a, b) => a.frame - b.frame);
  } else {
    // No keyframes exist, just update base color
    colorObj.r = color.r;
    colorObj.g = color.g;
    colorObj.b = color.b;
  }
  
  // Select the card so the wheel/sliders reflect the updated color
  ensureCardSelected(idx);
  
  // Re-render everything
  renderPalette();
  renderTimeline();
  updateUIForCurrentFrame();
  updateWheelFromSelection();
}

/**
 * Show fallback color picker for browsers that don't support EyeDropper
 * @param {number} idx - Index of the color to update
 */
function showFallbackPicker(idx) {
  // Create a temporary color input
  const input = document.createElement('input');
  input.type = 'color';
  input.style.position = 'fixed';
  input.style.top = '-100px';
  input.style.left = '-100px';
  
  // Get current color for the input
  const colorObj = State.colors[idx];
  const frameColor = getInterpolatedColor(State.selectedFrame, colorObj);
  const hex = rgbToHex(frameColor.r, frameColor.g, frameColor.b);
  input.value = hex;
  
  document.body.appendChild(input);
  
  input.addEventListener('change', () => {
    targetColorIndex = idx;
    const color = parseHexColor(input.value);
    applyPickedColor(color);
    document.body.removeChild(input);
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 100);
  });
  
  input.click();
}

/**
 * Convert RGB to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Check if eyedropper is currently active
 * @returns {boolean}
 */
export function isActive() {
  return isEyedropperActive;
}
