/**
 * TPL FILE PARSER
 * Handles parsing of OpenToonz palette files (TPL/XML)
 */

import { CONFIG } from './config.js';
import { getShortId } from './colorUtils.js';
import * as State from './state.js';

/**
 * Handle file input and read contents
 * @param {Event} event - File input change event
 */
export function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    parseTPL(e.target.result);
    // Enable UI buttons after parsing
    ["addBtn", "exportBtn", "exportJsonBtn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });
    // Trigger re-render
    import('./renderer.js').then(module => module.renderPalette());
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

/**
 * Parse TPL/XML string into palette data
 * @param {string} xmlString - Raw XML content
 * @param {Function} onComplete - Callback after parsing
 */
export function parseTPL(xmlString, onComplete) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const paletteNode = xmlDoc.querySelector('palette');
  
  if (!paletteNode) {
    alert("Error: Could not find <palette> node. Is this a valid TPL file?");
    return;
  }

  const paletteName = paletteNode.getAttribute('name');
  const paletteId = paletteNode.getAttribute('id');

  const paletteData = {
    name: paletteName || (paletteId ? `level_palette_${paletteId}` : "new_palette"),
    version: xmlDoc.querySelector('version')?.textContent.trim() || CONFIG.DEFAULT_TPL_VER,
    shortcuts: xmlDoc.querySelector('shortcuts')?.textContent.trim() || "",
    isStudioPalette: !!paletteName,
    originalId: paletteId
  };

  const colors = parseStyles(xmlDoc, paletteData.isStudioPalette);
  const maxFrame = parseAnimation(xmlDoc, colors);

  // Update state
  State.setPaletteData(paletteData);
  State.setColors(colors);
  State.setEndFrame(maxFrame > 0 ? maxFrame + 10 : 100);

  if (onComplete) onComplete();
}

/**
 * Parse style nodes from XML
 * @param {Document} xmlDoc - Parsed XML document
 * @param {boolean} isStudioPalette - Whether this is a studio palette
 * @returns {Array} Array of color objects
 */
function parseStyles(xmlDoc, isStudioPalette) {
  const colors = [];
  const styles = xmlDoc.querySelectorAll('styles > style');
  
  // Regex for studio palettes (with explicit quoted ID)
  const studioRegex = /^\s*(_1\s+)?("[^"]+")([^\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
  // Regex for level palettes (no explicit ID)
  const levelRegex = /^\s*(_1\s+)?([^\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;

  styles.forEach((style, index) => {
    const content = style.textContent.trim();
    let match;
    let colorData;

    if (isStudioPalette) {
      match = content.match(studioRegex);
      if (!match) {
        console.warn("Could not parse studio palette style content:", content);
        return;
      }
      colorData = {
        hasTrace: !!match[1],
        id: match[2],
        rawName: match[3],
        tagID: match[4],
        r: parseInt(match[5]),
        g: parseInt(match[6]),
        b: parseInt(match[7]),
        a: parseInt(match[8]),
      };
    } else {
      match = content.match(levelRegex);
      if (!match) {
        console.warn("Could not parse level palette style content:", content);
        return;
      }
      colorData = {
        hasTrace: !!match[1],
        id: `"${index}"`,
        rawName: match[2],
        tagID: match[3],
        r: parseInt(match[4]),
        g: parseInt(match[5]),
        b: parseInt(match[6]),
        a: parseInt(match[7]),
      };
    }

    if (!colorData) return;

    // Determine role and clean name
    let role = 'none';
    let cleanName = colorData.rawName;
    for (const [key, val] of Object.entries(CONFIG.ROLES)) {
      if (val.suffix && colorData.rawName.endsWith(val.suffix)) {
        role = key;
        cleanName = colorData.rawName.slice(0, -val.suffix.length);
        break;
      }
    }

    colors.push({
      hasTrace: colorData.hasTrace,
      id: colorData.id,
      name: cleanName,
      tagID: colorData.tagID,
      r: colorData.r, g: colorData.g, b: colorData.b, a: colorData.a,
      role: role,
      originalIndex: index,
      keyframes: []
    });
  });

  return colors;
}

/**
 * Parse animation/keyframe data from XML
 * @param {Document} xmlDoc - Parsed XML document
 * @param {Array} colors - Array of color objects to populate
 * @returns {number} Maximum frame number found
 */
function parseAnimation(xmlDoc, colors) {
  const animationNode = xmlDoc.querySelector('animation');
  let maxFrame = 0;

  if (animationNode) {
    animationNode.querySelectorAll('style').forEach(animStyleNode => {
      const targetColor = colors.find(c => getShortId(c.id) === animStyleNode.getAttribute('id'));
      
      if (targetColor) {
        targetColor.keyframes = [];
        animStyleNode.querySelectorAll('keyframe').forEach(keyframeNode => {
          const frame = parseInt(keyframeNode.getAttribute('frame'));
          if (frame > maxFrame) maxFrame = frame;
          
          const keyframeData = keyframeNode.textContent.trim().split(/\s+/);
          if (keyframeData.length >= 6) {
            targetColor.keyframes.push({
              frame: frame,
              r: parseInt(keyframeData[2]),
              g: parseInt(keyframeData[3]),
              b: parseInt(keyframeData[4]),
              a: parseInt(keyframeData[5])
            });
          }
        });
        targetColor.keyframes.sort((a, b) => a.frame - b.frame);
      }
    });
  }

  return maxFrame;
}
