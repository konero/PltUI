/**
 * WHEEL MANAGER
 * Manages the HexaColorWheel color picker integration with the palette manager
 */

import * as State from './state.js';
import { renderPalette } from './renderer.js';
import { renderTimeline, getInterpolatedColor, updateUIForCurrentFrame } from './timeline.js';

// Wheel and slider instances
let wheel = null;
let sliders = {};
let alphaSlider = null;
let isUpdatingFromExternal = false;
let currentAlpha = 255;

// Track the unsubscribe function for the color listener
let colorUnsubscribe = null;

/**
 * Initialize the color wheel and sliders
 */
export function initWheel() {
  const wheelContainer = document.getElementById('wheel-container');
  const slidersContainer = document.getElementById('sliders-container');
  
  if (!wheelContainer || !slidersContainer || typeof HexaColorWheel === 'undefined') {
    console.warn('HexaColorWheel not available or containers not found');
    return;
  }

  // Create the wheel with a smaller size for the sidebar
  wheel = new HexaColorWheel({
    container: wheelContainer,
    hexRadius: 90,
    triWidth: 92,
    triHeight: 160,
    gap: -33,
    backgroundColor: null // Transparent background
  });

  // Create HSV sliders
  const hsvChannels = ['h', 's', 'v'];
  const hsvContainer = document.getElementById('hsv-sliders');
  
  hsvChannels.forEach(channel => {
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-row';
    sliderDiv.id = `slider-${channel}`;
    hsvContainer.appendChild(sliderDiv);
    
    sliders[channel] = new HexaSlider({
      container: sliderDiv,
      channel: channel,
      color: wheel.color,
      width: 160,
      height: 16,
      showLabel: true,
      showInput: true,
      showArrows: true
    });
  });

  // Create Alpha slider (separate since it's not part of HexaColor)
  const alphaContainer = document.getElementById('alpha-slider');
  alphaSlider = new HexaSlider({
    container: alphaContainer,
    channel: 'a',
    color: wheel.color,
    width: 160,
    height: 16,
    showLabel: true,
    showInput: true,
    showArrows: true,
    onAlphaChange: onAlphaChange
  });

  // Create RGB sliders
  const rgbChannels = ['r', 'g', 'b'];
  const rgbContainer = document.getElementById('rgb-sliders');
  
  rgbChannels.forEach(channel => {
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-row';
    sliderDiv.id = `slider-${channel}`;
    rgbContainer.appendChild(sliderDiv);
    
    sliders[channel] = new HexaSlider({
      container: sliderDiv,
      channel: channel,
      color: wheel.color,
      width: 160,
      height: 16,
      showLabel: true,
      showInput: true,
      showArrows: true
    });
  });

  // Listen for color changes from the wheel
  colorUnsubscribe = wheel.color.onChange(onWheelColorChange);
  
  // Initial preview update
  updateColorPreview();
}

/**
 * Update the color preview swatch and hex display
 */
function updateColorPreview() {
  const swatch = document.getElementById('color-preview-swatch');
  const hexDisplay = document.getElementById('color-preview-hex');
  const eyedropperBtn = document.getElementById('sidebar-eyedropper-btn');
  
  if (!swatch || !hexDisplay) return;
  
  const idx = State.selectedColorIndex;
  
  if (idx < 0 || !wheel) {
    swatch.style.setProperty('--preview-color', 'transparent');
    hexDisplay.textContent = 'No color selected';
    if (eyedropperBtn) eyedropperBtn.disabled = true;
    return;
  }
  
  const rgb = wheel.color.rgb;
  const alpha = alphaSlider ? alphaSlider.alpha : 255;
  const hex = wheel.color.hex.toUpperCase();
  
  swatch.style.setProperty('--preview-color', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 255})`);
  hexDisplay.textContent = `${hex} (A: ${alpha})`;
  
  // Enable/disable eyedropper button based on selection
  // idx 0 is bg color which cannot be changed, idx >= 1 can be edited
  if (eyedropperBtn) {
    eyedropperBtn.disabled = idx < 1;
  }
}

/**
 * Handle alpha slider changes
 * @param {number} alpha - The new alpha value (0-255)
 */
function onAlphaChange(alpha) {
  // Skip if we're updating from an external source
  if (isUpdatingFromExternal) return;
  
  const idx = State.selectedColorIndex;
  if (idx < 0) return;
  
  // Don't allow changing bg color (index 0)
  if (idx === 0) return;
  
  currentAlpha = alpha;
  const colorObj = State.colors[idx];
  const rgb = wheel.color.rgb;
  
  // Check if we're on a keyframe
  const existingKf = colorObj.keyframes?.find(kf => kf.frame === State.selectedFrame);
  
  if (existingKf) {
    // Update existing keyframe alpha
    existingKf.a = alpha;
  } else if (colorObj.keyframes && colorObj.keyframes.length > 0) {
    // Has keyframes but we're not on one - create a new keyframe
    colorObj.keyframes.push({ 
      frame: State.selectedFrame, 
      r: rgb.r, 
      g: rgb.g, 
      b: rgb.b, 
      a: alpha 
    });
    colorObj.keyframes.sort((a, b) => a.frame - b.frame);
  } else {
    // No keyframes exist, just update base alpha
    colorObj.a = alpha;
  }
  
  // Re-render palette and timeline
  renderPalette();
  renderTimeline();
  updateUIForCurrentFrame();
  updateColorPreview();
}

/**
 * Handle color changes from the wheel/sliders
 * @param {HexaColor} color - The HexaColor instance
 */
function onWheelColorChange(color) {
  // Skip if we're updating from an external source (card/timeline selection)
  if (isUpdatingFromExternal) return;
  
  const idx = State.selectedColorIndex;
  if (idx < 0) return;
  
  // Don't allow changing bg color (index 0)
  if (idx === 0) return;
  
  const rgb = color.rgb;
  const colorObj = State.colors[idx];
  
  // Get current alpha from the slider
  const alpha = alphaSlider ? alphaSlider.alpha : 255;
  
  // Check if we're on a keyframe
  const existingKf = colorObj.keyframes?.find(kf => kf.frame === State.selectedFrame);
  
  if (existingKf) {
    // Update existing keyframe
    existingKf.r = rgb.r;
    existingKf.g = rgb.g;
    existingKf.b = rgb.b;
    existingKf.a = alpha;
  } else if (colorObj.keyframes && colorObj.keyframes.length > 0) {
    // Has keyframes but we're not on one - create a new keyframe
    const frameColor = getInterpolatedColor(State.selectedFrame, colorObj);
    colorObj.keyframes.push({ 
      frame: State.selectedFrame, 
      r: rgb.r, 
      g: rgb.g, 
      b: rgb.b, 
      a: alpha 
    });
    colorObj.keyframes.sort((a, b) => a.frame - b.frame);
  } else {
    // No keyframes exist, just update base color
    colorObj.r = rgb.r;
    colorObj.g = rgb.g;
    colorObj.b = rgb.b;
    colorObj.a = alpha;
  }
  
  // Re-render palette and timeline
  renderPalette();
  renderTimeline();
  updateUIForCurrentFrame();
  updateColorPreview();
}

/**
 * Update the wheel to reflect the currently selected color
 * Called when selecting a color card or timeline frame
 */
export function updateWheelFromSelection() {
  if (!wheel) return;
  
  const idx = State.selectedColorIndex;
  
  if (idx < 0) {
    // No selection - could optionally disable the wheel here
    return;
  }
  
  const colorObj = State.colors[idx];
  const frameColor = getInterpolatedColor(State.selectedFrame, colorObj);
  
  // Set flag to prevent the onChange from triggering updates back
  isUpdatingFromExternal = true;
  
  // Update the wheel's color
  wheel.color.setRGB(frameColor.r, frameColor.g, frameColor.b);
  
  // Update alpha slider
  if (alphaSlider) {
    alphaSlider.alpha = frameColor.a;
  }
  currentAlpha = frameColor.a;
  
  isUpdatingFromExternal = false;
  
  // Update the preview
  updateColorPreview();
}

/**
 * Get the current wheel color as RGB + Alpha
 * @returns {Object} { r, g, b, a }
 */
export function getWheelColor() {
  if (!wheel) return { r: 128, g: 128, b: 128, a: 255 };
  
  const rgb = wheel.color.rgb;
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    a: alphaSlider ? alphaSlider.alpha : 255
  };
}

/**
 * Check if wheel is initialized
 * @returns {boolean}
 */
export function isWheelReady() {
  return wheel !== null;
}

/**
 * Destroy the wheel and clean up
 */
export function destroyWheel() {
  if (colorUnsubscribe) {
    colorUnsubscribe();
    colorUnsubscribe = null;
  }
  
  if (wheel) {
    wheel.destroy();
    wheel = null;
  }
  
  Object.values(sliders).forEach(slider => slider.destroy());
  sliders = {};
  
  if (alphaSlider) {
    alphaSlider.destroy();
    alphaSlider = null;
  }
}
