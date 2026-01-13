/**
 * EXPORT FUNCTIONS
 * TPL and JSON export functionality
 */

import { paletteData, colors } from './state.js';
import { getFullExportName, getShortId } from './colorUtils.js';

/**
 * Export palette as TPL file
 */
export function exportPalette() {
  if (!paletteData) return;

  let rootTag;
  if (paletteData.isStudioPalette) {
    rootTag = `<palette name="${paletteData.prefix}">`;
  } else {
    rootTag = `<palette id="${paletteData.originalId || '1'}">`;
  }

  let xml = `${rootTag}\n  <version>\n    ${paletteData.version}\n  </version>\n  <styles>\n`;
  
  colors.forEach(c => {
    const trace = c.hasTrace ? '_1 ' : '';
    let exportName = getFullExportName(c);
    let styleContent;

    if (paletteData.isStudioPalette) {
      styleContent = `${trace}${c.id}${exportName} ${c.tagID} ${c.r} ${c.g} ${c.b} ${c.a}`;
    } else {
      styleContent = `${trace}${exportName} ${c.tagID} ${c.r} ${c.g} ${c.b} ${c.a}`;
    }
    xml += `    <style>\n      ${styleContent} \n    </style>\n`;
  });
  
  xml += `  </styles>\n`;

  // Animation data
  const animatedColors = colors.filter(c => c.keyframes && c.keyframes.length > 0);
  if (animatedColors.length > 0) {
    xml += `  <animation>\n`;
    animatedColors.forEach(c => {
      const shortId = getShortId(c.id);
      xml += `    <style id="${shortId}">\n`;
      c.keyframes.forEach(kf => {
        xml += `      <keyframe frame="${kf.frame}">\n        ${getFullExportName(c)} ${c.tagID} ${kf.r} ${kf.g} ${kf.b} ${kf.a} \n      </keyframe>\n`;
      });
      xml += `    </style>\n`;
    });
    xml += `  </animation>\n`;
  }

  xml += `  <stylepages>\n    <page>\n      <name>\n        colors \n      </name>\n      <indices>\n        ${colors.map((_, i) => i).join(' ')} \n      </indices>\n    </page>\n  </stylepages>\n  <shortcuts>\n    ${paletteData.shortcuts}\n  </shortcuts>\n</palette>`;
  
  downloadFile(xml, `${paletteData.name}.tpl`, 'text/plain');
}

/**
 * Export palette as JSON file
 */
export function exportJson() {
  if (!paletteData) return;
  
  const data = colors.map(c => ({
    id: getShortId(c.id), 
    name: c.name, 
    role: c.role, 
    color: { r: c.r, g: c.g, b: c.b, a: c.a },
    keyframes: c.keyframes
  }));
  
  downloadFile(JSON.stringify(data, null, 2), `${paletteData.name}.json`, 'application/json');
}

/**
 * Generic file download helper
 */
export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; 
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
