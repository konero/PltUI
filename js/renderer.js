/**
 * PALETTE RENDERER
 * Handles rendering of color cards and palette grid
 */

import { CONFIG } from './config.js';
import { colors, selectedColorIndex, setLastFilteredColors } from './state.js';
import { getShortId, getContrastColor } from './colorUtils.js';
import { getFilteredList, applySorting } from './filters.js';

/**
 * Get the color at frame 0 for display purposes
 * This matches the interpolation logic: use first keyframe's color for frames before/at it
 * @param {Object} color - Color object
 * @returns {Object} { r, g, b, a }
 */
function getFrame0Color(color) {
  if (!color.keyframes || color.keyframes.length === 0) {
    return { r: color.r, g: color.g, b: color.b, a: color.a };
  }
  
  // Sort keyframes by frame to ensure we get the earliest one
  const sortedKeyframes = [...color.keyframes].sort((a, b) => a.frame - b.frame);
  const firstKeyframe = sortedKeyframes[0];
  
  // For frame 0, if no keyframe exists at 0, use the first available keyframe
  // (matches getInterpolatedColor behavior - no interpolation before first keyframe)
  return { r: firstKeyframe.r, g: firstKeyframe.g, b: firstKeyframe.b, a: firstKeyframe.a };
}

/**
 * Render the entire palette grid
 */
export function renderPalette() {
  const container = document.getElementById('content');
  const filtered = getFilteredList();
  
  // Apply sorting
  applySorting(filtered);
  
  // Store for clipboard operations
  setLastFilteredColors(filtered);
  
  // Toggle ID copier visibility
  document.getElementById('id-copier-container').style.display = colors.length ? 'flex' : 'none';

  // Empty state
  if (!colors.length) {
    container.innerHTML = `<div class="empty-state">Import a file to begin</div>`;
    return;
  }
  
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">No colors match your current filters.</div>`;
    return;
  }

  const isGrouped = document.getElementById('pairedViewCheck').checked;

  if (isGrouped) {
    const groups = filtered.reduce((acc, c) => {
      (acc[c.name] = acc[c.name] || []).push(c);
      return acc;
    }, {});
    
    container.innerHTML = `<div style="display:grid;gap:20px">${Object.entries(groups).map(([name, group]) => `
      <div style="background:rgba(0,0,0,0.15); padding:16px; border-radius:10px; border:1px solid var(--border-color)">
        <div style="margin-bottom:12px; font-family:var(--font-family-code); font-weight:bold; color:var(--accent-color); font-size:14px">${name}</div>
        <div class="palette-grid">${group.map(c => generateCardHTML(c)).join('')}</div>
      </div>`).join('')}</div>`;
  } else {
    container.innerHTML = `<div class="palette-grid">${filtered.map(c => generateCardHTML(c)).join('')}</div>`;
  }
}

/**
 * Generate HTML for a color card (preview style with context menu support)
 * @param {Object} color - Color object
 * @returns {string} HTML string
 */
export function generateCardHTML(color) {
  const idx = colors.indexOf(color);
  // Always display the frame 0 color (first keyframe) on cards
  const displayColor = getFrame0Color(color);
  const rgba = `rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, ${displayColor.a / 255})`;
  const textColor = getContrastColor(displayColor.r, displayColor.g, displayColor.b);
  const roleCfg = CONFIG.ROLES[color.role];
  
  const checkeredPattern = `repeating-conic-gradient(#fff 0% 25%, #ccc 0% 50%)`;
  
  // Check if color has keyframes (is animated)
  const isAnimated = color.keyframes && color.keyframes.length > 0;
  
  // Eyedropper button (only show for colors that can be edited, idx >= 1)
  const eyedropperBtn = idx >= 1 ? `
    <button class="eyedropper-btn" 
            onclick="event.stopPropagation(); window.AppUI.activateEyedropperForCard(${idx})" 
            title="Pick color from screen (E/I)">Pick</button>` : '';
  
  return `
    <div class="color-card-preview ${roleCfg.cssClass} ${idx === selectedColorIndex ? 'selected' : ''}" 
         id="card-${idx}"
         data-idx="${idx}" 
         onclick="window.AppUI.selectColor(${idx})" 
         oncontextmenu="window.AppUI.showContextMenu(event, ${idx})"
         style="background-image: linear-gradient(${rgba}, ${rgba}), ${checkeredPattern}; background-size: auto, 20px 20px;">
      <div class="preview-name" style="color: ${textColor};">${color.name}</div>
      ${eyedropperBtn}
      ${isAnimated ? '<div class="preview-badge top-left"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2 L2 12 L12 22 L22 12 Z"/></svg></div>' : ''}
      ${color.hasTrace && idx >= 2 ? '<div class="preview-badge bottom-left">A</div>' : ''}
      <div class="preview-badge bottom-right">#${getShortId(color.id)}</div>
      ${roleCfg.suffix ? `<div class="preview-badge top-right">${roleCfg.suffix}</div>` : ''}
    </div>`;
}
