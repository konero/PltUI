/**
 * APP ENTRY POINT
 * Main application initialization and global bindings
 */

import { CONFIG } from './config.js';
import { handleFile, parseTPL } from './parser.js';
import { renderPalette } from './renderer.js';
import * as Timeline from './timeline.js';
import * as Exporter from './exporter.js';
import * as UI from './ui.js';
import * as WheelManager from './wheelManager.js';
import * as Eyedropper from './eyedropper.js';

/**
 * Initialize the application
 */
function init() {
  setupHeader();
  setupFooter();
  setupHuePreview();
  
  // Initialize the color wheel
  WheelManager.initWheel();
  
  // Expose functions to window for HTML onclick handlers
  exposeGlobalFunctions();
  
  // Initialize context menu
  UI.initContextMenu();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // 'E' or 'I' key for eyedropper (I is common for "pick" in graphics software)
    if (e.key === 'e' || e.key === 'E' || e.key === 'i' || e.key === 'I') {
      Eyedropper.activateEyedropper();
    }
  });
}

/**
 * Setup header HTML
 */
function setupHeader() {
  document.getElementById('main-header').innerHTML = `
    <h1>
      <img src="images/favicon-48.png" alt="" class="header-logo" onerror="this.style.display='none'">
      ${CONFIG.APP_NAME} <span class="version-tag">${CONFIG.VERSION}</span>
    </h1>
    <div class="toolbar">
      <button class="secondary" onclick="window.AppUI.newPalette()">New TPL</button>
      <button class="secondary" onclick="document.getElementById('fileInput').click()">Load TPL</button>
      <button class="secondary" onclick="window.Exporter.exportPalette()" id="exportBtn" disabled>Export TPL</button>
      <button class="secondary" onclick="window.Exporter.exportJson()" id="exportJsonBtn" class="secondary" disabled>Export JSON</button>
      <input type="file" id="fileInput" style="display:none" accept=".tpl,.xml,.txt" onchange="window.AppParser.handleFileEvent(event)">
    </div>`;
}

/**
 * Setup footer HTML
 */
function setupFooter() {
  document.getElementById('main-footer').innerHTML = `
    <span>Created by <strong>${CONFIG.AUTHOR}</strong></span>
    <span style="margin: 0 10px; opacity:0.3">|</span>
    <span><a href="https://github.com/konero/PltUI" target="_blank">Contribute</a></span>
    <span style="margin: 0 10px; opacity:0.3">|</span>
    <span><a href="">Offline</a></span>
    <span style="margin: 0 10px; opacity:0.3">|</span>
    <span><a href="">Help</a></span>`;
}

/**
 * Setup initial hue preview color
 */
function setupHuePreview() {
  const hueSlider = document.getElementById('hueSlider');
  if (hueSlider) {
    const h = hueSlider.value;
    document.getElementById('huePreview').style.backgroundColor = `hsl(${h}, 100%, 50%)`;
  }
}

/**
 * Expose functions to window for HTML onclick handlers
 * This is necessary because ES modules don't expose to global scope
 */
function exposeGlobalFunctions() {
  // UI functions
  window.AppUI = {
    selectColor: UI.selectColor,
    showContextMenu: UI.showContextMenu,
    hideContextMenu: UI.hideContextMenu,
    deleteColor: UI.deleteColor,
    addColor: UI.addColor,
    newPalette: UI.newPalette,
    toggleHueControls: UI.toggleHueControls,
    updateHueUI: UI.updateHueUI,
    copyIdsToClipboard: UI.copyIdsToClipboard,
    renderPalette: renderPalette,
    activateEyedropper: Eyedropper.activateEyedropper,
    activateEyedropperForCard: Eyedropper.activateEyedropperForCard
  };
  
  // Timeline functions
  window.Timeline = {
    selectFrame: Timeline.selectFrame,
    updateEndFrame: Timeline.updateEndFrame,
    jumpToKeyframe: Timeline.jumpToKeyframe,
    toggleKeyframe: Timeline.toggleKeyframe,
    showHoverTick: Timeline.showHoverTick,
    hideHoverTick: Timeline.hideHoverTick
  };
  
  // Export functions
  window.Exporter = {
    exportPalette: Exporter.exportPalette,
    exportJson: Exporter.exportJson
  };
  
  // Parser functions
  window.AppParser = {
    handleFileEvent: handleFile
  };
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);
