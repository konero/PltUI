/**
 * UI HANDLERS
 * Event handlers for user interactions
 */

import { CONFIG } from './config.js';
import * as State from './state.js';
import { getShortId, generatePalettePrefix } from './colorUtils.js';
import { renderPalette } from './renderer.js';
import { renderTimeline, getInterpolatedColor } from './timeline.js';
import { updateWheelFromSelection } from './wheelManager.js';

// Context menu state
let contextMenuTarget = -1;

/**
 * Select a color card
 * @param {number} idx - Index of the color to select
 * @param {boolean} forceSelect - If true, don't toggle off when clicking same card
 */
export function selectColor(idx, forceSelect = false) {
  const previousIdx = State.selectedColorIndex;
  
  // If clicking same card and not forcing selection, toggle off
  if (previousIdx === idx && !forceSelect) {
    State.setSelectedColorIndex(-1);
  } else {
    State.setSelectedColorIndex(idx);
    State.setSelectedFrame(0);
    
    // Calculate appropriate endFrame based on new card's keyframes
    const color = State.colors[idx];
    if (color && color.keyframes && color.keyframes.length > 0) {
      const lastKeyframe = Math.max(...color.keyframes.map(k => k.frame));
      State.setEndFrame(lastKeyframe + 10);
    } else {
      State.setEndFrame(100); // Default end frame
    }
  }
  
  // Re-render palette - this regenerates all cards with frame 0 color
  renderPalette();
  renderTimeline(true);  // Scroll to frame when selecting a new color
  
  // Update the color wheel to reflect current selection
  updateWheelFromSelection();
  
  // Update sidebar eyedropper button state (do this after wheel update)
  // Use a small delay to ensure all state updates have propagated
  setTimeout(() => {
    const eyedropperBtn = document.getElementById('sidebar-eyedropper-btn');
    if (eyedropperBtn) {
      // Enable for idx >= 1 (ink and user colors), disable for bg (0) or no selection (-1)
      const idx = State.selectedColorIndex;
      eyedropperBtn.disabled = idx < 1;
    }
  }, 0);
  
  // Update the selected card to show current frame's color
  import('./timeline.js').then(module => {
    module.updateUIForCurrentFrame();
  });
}

/**
 * Ensure a card is selected (without toggling off if already selected)
 * Used by interactive elements that need their card to be the active context
 */
export function ensureCardSelected(idx) {
  if (State.selectedColorIndex !== idx) {
    selectColor(idx, true);
  }
}

// ==========================================================================
// Context Menu Functions
// ==========================================================================

/**
 * Show context menu at mouse position
 */
export function showContextMenu(event, idx) {
  event.preventDefault();
  contextMenuTarget = idx;
  
  // Select the card when right-clicking
  ensureCardSelected(idx);
  
  const menu = document.getElementById('context-menu');
  const color = State.colors[idx];
  
  // Update menu items based on context
  const items = menu.querySelectorAll('.context-menu-item');
  items.forEach(item => {
    const action = item.dataset.action;
    
    // Reset disabled state
    item.classList.remove('disabled');
    
    // Disable actions for first two colors (bg/ink - special OpenToonz colors)
    // idx 0 (bg): no color change, no alpha change, no role change, no delete, no autopaint
    // idx 1 (ink): no alpha change, no role change, no delete, no autopaint
    if (idx < 2) {
      if (['delete', 'toggle-autopaint', 'change-alpha', 'mark-base', 'mark-shadow', 'mark-highlight', 'mark-ao'].includes(action)) {
        item.classList.add('disabled');
      }
    }
    
    // Disable color change for bg (idx 0) only
    if (idx === 0 && action === 'change-color') {
      item.classList.add('disabled');
    }
    
    // Disable rename for bg (idx 0) - it must stay as 'bg'
    if (idx === 0 && action === 'rename') {
      item.classList.add('disabled');
    }
    
    // Update autopaint label
    if (action === 'toggle-autopaint') {
      item.textContent = color.hasTrace ? 'Disable Autopaint' : 'Enable Autopaint';
    }
  });
  
  // Position menu
  menu.style.display = 'block';
  
  // Ensure menu stays within viewport
  const menuRect = menu.getBoundingClientRect();
  let x = event.clientX;
  let y = event.clientY;
  
  if (x + menuRect.width > window.innerWidth) {
    x = window.innerWidth - menuRect.width - 5;
  }
  if (y + menuRect.height > window.innerHeight) {
    y = window.innerHeight - menuRect.height - 5;
  }
  
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

/**
 * Hide context menu
 */
export function hideContextMenu() {
  document.getElementById('context-menu').style.display = 'none';
  contextMenuTarget = -1;
}

/**
 * Handle context menu action
 */
export function handleContextMenuAction(action) {
  const idx = contextMenuTarget;
  if (idx < 0) return;
  
  const color = State.colors[idx];
  
  switch (action) {
    case 'rename':
      const newName = prompt('Enter new name:', color.name);
      if (newName !== null && newName.trim()) {
        color.name = newName.trim();
        renderPalette();
      }
      break;
      
    case 'toggle-autopaint':
      if (idx >= 2) {
        color.hasTrace = !color.hasTrace;
        renderPalette();
      }
      break;
      
    case 'mark-base':
      color.role = 'none';
      renderPalette();
      break;
      
    case 'mark-shadow':
      if (idx >= 2) {
        color.role = 'shadow';
        renderPalette();
      }
      break;
      
    case 'mark-highlight':
      if (idx >= 2) {
        color.role = 'highlight';
        renderPalette();
      }
      break;
      
    case 'mark-ao':
      if (idx >= 2) {
        color.role = 'ao';
        renderPalette();
      }
      break;
      
    case 'delete':
      if (idx >= 2) {
        deleteColor(idx);
      }
      break;
  }
  
  hideContextMenu();
}

/**
 * Initialize context menu event listeners
 */
export function initContextMenu() {
  // Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu')) {
      hideContextMenu();
    }
  });
  
  // Handle menu item clicks
  document.getElementById('context-menu').addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (item && !item.classList.contains('disabled')) {
      handleContextMenuAction(item.dataset.action);
    }
  });
  
  // Hide on scroll
  document.getElementById('content').addEventListener('scroll', hideContextMenu);
}

// ==========================================================================
// Color Modification Functions (used by context menu)
// ==========================================================================

/**
 * Update color name
 */
export function updateColorName(idx, name) {
  State.colors[idx].name = name;
}

/**
 * Update color role
 */
export function updateRole(idx, role) {
  State.colors[idx].role = role;
  renderPalette();
}

/**
 * Update trace/autopaint setting
 */
export function updateTrace(idx, hasTrace) {
  State.colors[idx].hasTrace = hasTrace;
}

/**
 * Delete a color
 */
export function deleteColor(idx) {
  if (idx < 2) return;
  State.removeColor(idx);
  renderPalette();
}

/**
 * Add a new color
 */
export function addColor() {
  const ids = State.colors.map(c => parseInt(getShortId(c.id))).filter(n => !isNaN(n));
  const nextId = (ids.length ? Math.max(...ids) : 0) + 1;
  
  const firstId = State.colors[0]?.id || "";
  const prefix = State.paletteData?.prefix 
    ? '|-' + State.paletteData.prefix + '-' 
    : (firstId.includes('-') ? firstId.split('-')[0].replace(/"/g, '') + '-' : '');
  
  // Clone color from current selection if available, otherwise use default gray
  let newR = 120, newG = 120, newB = 120, newA = 255;
  if (State.selectedColorIndex >= 0) {
    const selectedColor = State.colors[State.selectedColorIndex];
    // Get the first keyframe color (frame 0)
    const frameColor = getInterpolatedColor(0, selectedColor);
    newR = frameColor.r;
    newG = frameColor.g;
    newB = frameColor.b;
    newA = frameColor.a;
  }
  
  const newColorIndex = State.colors.length;
  
  State.addColor({
    hasTrace: false, 
    id: `"${prefix}${nextId}"`,
    name: 'new_color',
    tagID: '3', 
    r: newR, g: newG, b: newB, a: newA, 
    role: 'none',
    originalIndex: newColorIndex,
    keyframes: []
  });
  
  renderPalette();
  
  // Select the newly created color
  selectColor(newColorIndex, true);
  
  // Auto-scroll to bottom
  setTimeout(() => {
    const content = document.getElementById('content');
    content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
  }, 50);
}

/**
 * Create a new empty palette
 */
export function newPalette() {
  const name = prompt("Enter a name for the new palette:", "new_palette");
  if (!name) return;
  
  const prefix = generatePalettePrefix();
  State.setPaletteData({ 
    name, 
    version: CONFIG.DEFAULT_TPL_VER, 
    shortcuts: "0 1 -1 -1 -1 -1 -1 -1 -1 -1 ", 
    prefix,
    isStudioPalette: true
  });
  
  State.setColors([
    { hasTrace: false, id: `"|-${prefix}-0"`, name: 'bg',  tagID: '3', r: 255, g: 255, b: 255, a: 0,   role: 'none', originalIndex: 0 },
    { hasTrace: false, id: `"|-${prefix}-1"`, name: 'ink', tagID: '3', r: 0,   g: 0,   b: 0,   a: 255, role: 'none', originalIndex: 1 }
  ]);
  
  ["addBtn", "exportBtn", "exportJsonBtn"].forEach(id => document.getElementById(id).disabled = false);
  renderPalette();
}

/**
 * Toggle hue filter controls visibility
 */
export function toggleHueControls() {
  const isVisible = document.getElementById('hueFilterCheck').checked;
  document.querySelector('.hue-controls').style.display = isVisible ? 'flex' : 'none';
  renderPalette();
}

/**
 * Update hue filter UI and re-render
 */
export function updateHueUI() {
  const h = document.getElementById('hueSlider').value;
  const t = document.getElementById('hueThresholdSlider').value;
  document.getElementById('hue-val').textContent = h + "°";
  document.getElementById('hue-threshold-val').textContent = "±" + t + "°";
  document.getElementById('huePreview').style.backgroundColor = `hsl(${h}, 100%, 50%)`;
  renderPalette();
}

/**
 * Copy filtered color IDs to clipboard
 */
export async function copyIdsToClipboard() {
  const ids = State.lastFilteredColors.map(c => getShortId(c.id)).join(',');
  try {
    await navigator.clipboard.writeText(ids);
    const btn = document.querySelector('#id-copier-container button');
    const oldText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = 'var(--success-color)';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.background = '';
    }, 1500);
  } catch (err) {
    console.error('Failed to copy!', err);
  }
}
