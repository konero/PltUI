/**
 * FILTERING & SORTING
 * Color list filtering and sorting logic
 */

import { colors } from './state.js';
import { getFullExportName, rgbToHsl } from './colorUtils.js';

/**
 * Get filtered list of colors based on current UI settings
 * @returns {Array} Filtered array of color objects
 */
export function getFilteredList() {
  const term = document.getElementById('searchInput').value;
  const matchCase = document.getElementById('matchCaseCheck').checked;
  const matchWhole = document.getElementById('matchWholeWordCheck').checked;
  const hueOn = document.getElementById('hueFilterCheck').checked;
  const animatedOnly = document.getElementById('animatedFilterCheck').checked;
  
  let results = [...colors];

  // Animated filter
  if (animatedOnly) {
    results = results.filter(c => c.keyframes && c.keyframes.length > 0);
  }

  // Text filter
  if (term) {
    const pattern = term.replace(/[.*+?^${}()|[\\]/g, '\\$&').replace(/\\\*/g, '.*');
    const regex = new RegExp(matchWhole ? `^${pattern}$` : pattern, matchCase ? '' : 'i');
    results = results.filter(c => regex.test(getFullExportName(c)));
  }

  // Hue filter
  if (hueOn) {
    const targetHue = parseInt(document.getElementById('hueSlider').value);
    const threshold = parseInt(document.getElementById('hueThresholdSlider').value);
    results = results.filter(c => {
      const hsl = rgbToHsl(c.r, c.g, c.b);
      if (hsl.s < 0.1) return false; // Ignore desaturated colors
      const diff = Math.abs(hsl.h - targetHue);
      return Math.min(diff, 360 - diff) <= threshold;
    });
  }

  return results;
}

/**
 * Sort color array based on current UI settings
 * @param {Array} colorArray - Array of colors to sort
 * @returns {Array} Sorted array (mutates original)
 */
export function applySorting(colorArray) {
  const sortType = document.getElementById('sortSelect').value;
  const sortDir = document.getElementById('sortDir').value === 'asc' ? 1 : -1;

  colorArray.sort((a, b) => {
    let result = 0;

    if (sortType === 'name') {
      result = getFullExportName(a).localeCompare(getFullExportName(b), undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      });
    } else if (sortType === 'color') {
      result = rgbToHsl(a.r, a.g, a.b).h - rgbToHsl(b.r, b.g, b.b).h;
    } else {
      result = a.originalIndex - b.originalIndex;
    }

    return result * sortDir;
  });

  return colorArray;
}
