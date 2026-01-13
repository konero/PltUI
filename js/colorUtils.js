/**
 * COLOR UTILITIES
 * Color conversion and manipulation functions
 */

import { CONFIG } from './config.js';

/**
 * Get the full export name with role suffix
 * @param {Object} color - Color object with name and role
 * @returns {string} Full name with suffix
 */
export function getFullExportName(color) {
  return color.name + (CONFIG.ROLES[color.role]?.suffix || '');
}

/**
 * Extract short ID from full quoted ID
 * @param {string} fullId - Full ID like "prefix-123"
 * @returns {string} Short ID like "123"
 */
export function getShortId(fullId) {
  const clean = fullId.replace(/"/g, '');
  const parts = clean.split('-');
  return parts[parts.length - 1];
}

/**
 * Get contrasting text color (black or white) based on background
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} '#000' or '#fff'
 */
export function getContrastColor(r, g, b) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Object} { h: 0-360, s: 0-1, l: 0-1 }
 */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max, l = (max + min) / 2;
  if (max !== min) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s, l };
}

/**
 * Convert RGB to hex color string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color like "#ff0000"
 */
export function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex color string to RGB object
 * @param {string} hex - Hex color like "#ff0000"
 * @returns {Object} { r, g, b }
 */
export function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

/**
 * Generate a unique palette prefix (timestamp-based)
 * @returns {string} Prefix like "1611507682_2814"
 */
export function generatePalettePrefix() {
  return `${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * 90000) + 1000}`;
}
