/**
 * TIMELINE / ANIMATION
 * Keyframe timeline rendering and manipulation
 */

import { colors, selectedColorIndex, selectedFrame, endFrame, setSelectedFrame, setEndFrame } from './state.js';
import { renderPalette } from './renderer.js';
import { getContrastColor } from './colorUtils.js';

// Import wheel manager dynamically to avoid circular dependency
let wheelManagerPromise = null;
function getWheelManager() {
  if (!wheelManagerPromise) {
    wheelManagerPromise = import('./wheelManager.js');
  }
  return wheelManagerPromise;
}

/**
 * Render the timeline for the selected color
 * @param {boolean} scrollToFrame - If true, scroll to center the selected frame. Default false.
 */
export function renderTimeline(scrollToFrame = false) {
  const container = document.getElementById('timeline-container');
  
  if (selectedColorIndex < 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';

  const color = colors[selectedColorIndex];
  const lastKeyframe = color.keyframes && color.keyframes.length > 0 
    ? Math.max(...color.keyframes.map(k => k.frame)) 
    : 0;
  
  // Use the current endFrame from state (set by selectColor or updateEndFrame)
  // Ensure it's at least lastKeyframe + 1 to show all keyframes
  const currentEndFrame = Math.max(endFrame, lastKeyframe + 1);

  let rulerHTML = '';
  let trackHTML = '';
  let keyframesHTML = '';

  for (let i = 0; i < currentEndFrame; i++) {
    // Show label at start and every 12th frame
    if (i === 0 || (i + 1) % 12 === 0) {
      rulerHTML += `<div class="frame-tick" style="left: ${i * 20}px;">${i + 1}</div>`;
    }

    const frameColor = getInterpolatedColor(i, color);
    trackHTML += `<div class="frame-cell ${i === selectedFrame ? 'selected' : ''}" 
                  style="background-color: rgba(${frameColor.r}, ${frameColor.g}, ${frameColor.b}, ${frameColor.a / 255});" 
                  onclick="window.Timeline.selectFrame(${i})"
                  onmouseenter="window.Timeline.showHoverTick(${i + 1}, ${i * 20})"
                  onmouseleave="window.Timeline.hideHoverTick()"></div>`;
  }

  color.keyframes.forEach(kf => {
    const visualPos = (kf.frame * 20) + 10;
    keyframesHTML += `<div class="keyframe-marker ${kf.frame === selectedFrame ? 'active' : ''}" style="left: ${visualPos}px;" onclick="window.Timeline.selectFrame(${kf.frame})"></div>`;
  });

  container.innerHTML = `
    <div class="timeline-controls">
        <div class="control-row">
            <label for="endFrameInput">End:</label>
            <input type="number" id="endFrameInput" min="1" value="${currentEndFrame}" onchange="window.Timeline.updateEndFrame(this.value)">
        </div>
        <div class="control-row">
            <button id="prevKeyBtn" title="Previous Keyframe" onclick="window.Timeline.jumpToKeyframe(-1)">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
            </button>
            <button id="toggleKeyBtn" title="Add/Remove Keyframe" onclick="window.Timeline.toggleKeyframe()">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M12 2 L2 12 L12 22 L22 12 Z"/>
                </svg>
            </button>
            <button id="nextKeyBtn" title="Next Keyframe" onclick="window.Timeline.jumpToKeyframe(1)">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" fill="currentColor"/></svg>
            </button>
        </div>
    </div>
    <div class="timeline-content">
        <div class="timeline-scroll-area" id="timeline-scroll">
            <div style="width: ${currentEndFrame * 20}px;">
                <div class="timeline-ruler">${rulerHTML}<div id="hover-tick" class="hover-tick" style="display:none;"></div></div>
                <div class="timeline-tracks">
                    <div class="timeline-keyframes">${keyframesHTML}</div>
                    <div class="timeline-track">${trackHTML}</div>
                </div>
            </div>
        </div>
    </div>`;
  
  // Update toggle button state
  const keyBtn = container.querySelector('#toggleKeyBtn');
  if (color.keyframes.some(kf => kf.frame === selectedFrame)) {
    keyBtn.classList.add('active');
  }

  // Scroll to current frame only when explicitly requested (e.g., when selecting a new color)
  if (scrollToFrame) {
    const scrollArea = document.getElementById('timeline-scroll');
    if (scrollArea) {
      scrollArea.scrollLeft = Math.max(0, selectedFrame * 20 - scrollArea.offsetWidth / 2);
    }
  }
}

/**
 * Show hover tick on timeline
 */
export function showHoverTick(frameNum, leftPos) {
  const tick = document.getElementById('hover-tick');
  if (tick) {
    tick.textContent = frameNum;
    tick.style.left = leftPos + 'px';
    tick.style.display = 'block';
  }
}

/**
 * Hide hover tick
 */
export function hideHoverTick() {
  const tick = document.getElementById('hover-tick');
  if (tick) tick.style.display = 'none';
}

/**
 * Select a frame on the timeline
 * @param {boolean} scrollToFrame - If true, scroll to center the selected frame. Default false.
 */
export function selectFrame(frame, scrollToFrame = false) {
  setSelectedFrame(frame);
  updateUIForCurrentFrame();
  renderTimeline(scrollToFrame);
  
  // Update the color wheel to reflect the selected frame's color
  getWheelManager().then(wm => wm.updateWheelFromSelection());
}

/**
 * Update the timeline end frame
 */
export function updateEndFrame(value) {
  const newEndFrame = parseInt(value) || 100;
  
  // Ensure end frame is at least past the last keyframe
  if (selectedColorIndex >= 0) {
    const color = colors[selectedColorIndex];
    const lastKeyframe = color.keyframes && color.keyframes.length > 0 
      ? Math.max(...color.keyframes.map(k => k.frame)) 
      : 0;
    setEndFrame(Math.max(newEndFrame, lastKeyframe + 1));
  } else {
    setEndFrame(newEndFrame);
  }
  
  renderTimeline();
}

/**
 * Jump to next/previous keyframe
 */
export function jumpToKeyframe(direction) {
  if (selectedColorIndex < 0) return;
  const keyframes = colors[selectedColorIndex].keyframes.map(k => k.frame);
  if (keyframes.length === 0) return;

  let nextFrame;
  if (direction > 0) {
    nextFrame = keyframes.find(f => f > selectedFrame);
    if (nextFrame === undefined) nextFrame = keyframes[0];
  } else {
    const reversedKeys = [...keyframes].reverse();
    nextFrame = reversedKeys.find(f => f < selectedFrame);
    if (nextFrame === undefined) nextFrame = keyframes[keyframes.length - 1];
  }
  selectFrame(nextFrame, true);  // Scroll to the keyframe when using navigation buttons
}

/**
 * Toggle keyframe at current frame
 */
export function toggleKeyframe() {
  if (selectedColorIndex < 0) return;
  const color = colors[selectedColorIndex];
  const existingKeyIndex = color.keyframes.findIndex(kf => kf.frame === selectedFrame);

  if (existingKeyIndex > -1) {
    color.keyframes.splice(existingKeyIndex, 1);
  } else {
    const frameColor = getInterpolatedColor(selectedFrame, color);
    color.keyframes.push({ frame: selectedFrame, ...frameColor });
    color.keyframes.sort((a, b) => a.frame - b.frame);
  }
  renderTimeline();
}

/**
 * Get interpolated color at a specific frame
 */
export function getInterpolatedColor(frame, color) {
  if (!color.keyframes || color.keyframes.length === 0) {
    return { r: color.r, g: color.g, b: color.b, a: color.a };
  }
  
  let prevKey = color.keyframes.filter(k => k.frame <= frame).pop();
  let nextKey = color.keyframes.find(k => k.frame >= frame);

  if (!prevKey) prevKey = nextKey || { frame: 0, r: color.r, g: color.g, b: color.b, a: color.a };
  if (!nextKey) nextKey = prevKey;

  const frameDiff = nextKey.frame - prevKey.frame;
  if (frameDiff === 0) return { r: prevKey.r, g: prevKey.g, b: prevKey.b, a: prevKey.a };
  
  const factor = (frame - prevKey.frame) / frameDiff;
  return {
    r: Math.round(prevKey.r + (nextKey.r - prevKey.r) * factor),
    g: Math.round(prevKey.g + (nextKey.g - prevKey.g) * factor),
    b: Math.round(prevKey.b + (nextKey.b - prevKey.b) * factor),
    a: Math.round(prevKey.a + (nextKey.a - prevKey.a) * factor),
  };
}

/**
 * Update the selected card's visual appearance to reflect current frame's color
 */
export function updateUIForCurrentFrame() {
  if (selectedColorIndex < 0) return;
  const color = colors[selectedColorIndex];
  const currentColor = getInterpolatedColor(selectedFrame, color);
  
  const card = document.getElementById(`card-${selectedColorIndex}`);
  if (card) {
    // Update the card's background to show the interpolated color at this frame
    const rgba = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${currentColor.a / 255})`;
    const checkeredPattern = `repeating-conic-gradient(#fff 0% 25%, #ccc 0% 50%)`;
    card.style.backgroundImage = `linear-gradient(${rgba}, ${rgba}), ${checkeredPattern}`;
    
    // Update the text color for contrast
    const textColor = getContrastColor(currentColor.r, currentColor.g, currentColor.b);
    const nameEl = card.querySelector('.preview-name');
    if (nameEl) {
      nameEl.style.color = textColor;
    }
  }
}
