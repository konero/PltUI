/**
 * HexaColorWheel - Hexagon Color Wheel Library
 * A reusable HSV color picker with hexagonal hue wheel and SV triangle
 * 
 * @author HexaColorWheel
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  /* ========================================
   * Color Conversion Utilities
   * ======================================== */

  /**
   * Convert HSV to RGB
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-1)
   * @param {number} v - Value (0-1)
   * @returns {{r: number, g: number, b: number}} RGB values (0-255)
   */
  function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  /**
   * Convert RGB to HSV
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {{h: number, s: number, v: number}} HSV values (h: 0-360, s: 0-1, v: 0-1)
   */
  function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }

    return { h, s, v };
  }

  /**
   * Convert RGB to Hex string
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} Hex color string (e.g., "#ff0000")
   */
  function rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  /**
   * Parse hex string to RGB
   * @param {string} hex - Hex color string (e.g., "#ff0000" or "ff0000")
   * @returns {{r: number, g: number, b: number}|null} RGB values or null if invalid
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /* ========================================
   * HexaColor Class - Color representation with getters/setters
   * ======================================== */

  /**
   * HexaColor - Represents a color with HSV and RGB access
   */
  class HexaColor {
    constructor() {
      this._h = 0;   // 0-360
      this._s = 1;   // 0-1
      this._v = 1;   // 0-1
      this._listeners = [];
    }

    /* --- HSV Getters/Setters --- */

    /** @returns {number} Hue (0-360) */
    get h() { return this._h; }
    set h(value) {
      this._h = ((value % 360) + 360) % 360;
      this._notify();
    }

    /** @returns {number} Hue (alias) */
    get hue() { return this._h; }
    set hue(value) { this.h = value; }

    /** @returns {number} Saturation (0-1) */
    get s() { return this._s; }
    set s(value) {
      this._s = Math.max(0, Math.min(1, value));
      this._notify();
    }

    /** @returns {number} Saturation (alias) */
    get saturation() { return this._s; }
    set saturation(value) { this.s = value; }

    /** @returns {number} Value/Brightness (0-1) */
    get v() { return this._v; }
    set v(value) {
      this._v = Math.max(0, Math.min(1, value));
      this._notify();
    }

    /** @returns {number} Value (alias) */
    get value() { return this._v; }
    set value(value) { this.v = value; }

    /** @returns {number} Brightness (alias for value) */
    get brightness() { return this._v; }
    set brightness(value) { this.v = value; }

    /* --- RGB Getters/Setters --- */

    /** @returns {{r: number, g: number, b: number}} RGB object */
    get rgb() {
      return hsvToRgb(this._h, this._s, this._v);
    }

    set rgb(value) {
      const hsv = rgbToHsv(value.r, value.g, value.b);
      this._h = hsv.h;
      this._s = hsv.s;
      this._v = hsv.v;
      this._notify();
    }

    /** @returns {number} Red (0-255) */
    get r() { return this.rgb.r; }
    set r(value) {
      const current = this.rgb;
      this.rgb = { r: value, g: current.g, b: current.b };
    }

    /** @returns {number} Red (alias) */
    get red() { return this.r; }
    set red(value) { this.r = value; }

    /** @returns {number} Green (0-255) */
    get g() { return this.rgb.g; }
    set g(value) {
      const current = this.rgb;
      this.rgb = { r: current.r, g: value, b: current.b };
    }

    /** @returns {number} Green (alias) */
    get green() { return this.g; }
    set green(value) { this.g = value; }

    /** @returns {number} Blue (0-255) */
    get b() { return this.rgb.b; }
    set b(value) {
      const current = this.rgb;
      this.rgb = { r: current.r, g: current.g, b: value };
    }

    /** @returns {number} Blue (alias) */
    get blue() { return this.b; }
    set blue(value) { this.b = value; }

    /* --- Hex Getters/Setters --- */

    /** @returns {string} Hex string (e.g., "#ff0000") */
    get hex() {
      const rgb = this.rgb;
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    set hex(value) {
      const rgb = hexToRgb(value);
      if (rgb) {
        this.rgb = rgb;
      }
    }

    /* --- HSV Object Getter/Setter --- */

    /** @returns {{h: number, s: number, v: number}} HSV object */
    get hsv() {
      return { h: this._h, s: this._s, v: this._v };
    }

    set hsv(value) {
      if (value.h !== undefined) this._h = ((value.h % 360) + 360) % 360;
      if (value.s !== undefined) this._s = Math.max(0, Math.min(1, value.s));
      if (value.v !== undefined) this._v = Math.max(0, Math.min(1, value.v));
      this._notify();
    }

    /* --- CSS String Getter --- */

    /** @returns {string} CSS rgb() string */
    get cssRgb() {
      const rgb = this.rgb;
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    /* --- Batch Update (no intermediate notifications) --- */

    /**
     * Set multiple HSV values at once
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-1)
     * @param {number} v - Value (0-1)
     */
    setHSV(h, s, v) {
      this._h = ((h % 360) + 360) % 360;
      this._s = Math.max(0, Math.min(1, s));
      this._v = Math.max(0, Math.min(1, v));
      this._notify();
    }

    /**
     * Set RGB values at once
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     */
    setRGB(r, g, b) {
      const hsv = rgbToHsv(r, g, b);
      this._h = hsv.h;
      this._s = hsv.s;
      this._v = hsv.v;
      this._notify();
    }

    /* --- Change Listeners --- */

    /**
     * Add a change listener
     * @param {Function} callback - Called when color changes, receives this HexaColor
     * @returns {Function} Unsubscribe function
     */
    onChange(callback) {
      this._listeners.push(callback);
      return () => {
        const idx = this._listeners.indexOf(callback);
        if (idx > -1) this._listeners.splice(idx, 1);
      };
    }

    /** @private */
    _notify() {
      for (const listener of this._listeners) {
        try {
          listener(this);
        } catch (e) {
          console.error('HexaColor listener error:', e);
        }
      }
    }

    /**
     * Clone this color
     * @returns {HexaColor} New HexaColor instance with same values
     */
    clone() {
      const c = new HexaColor();
      c._h = this._h;
      c._s = this._s;
      c._v = this._v;
      return c;
    }

    /**
     * Copy values from another HexaColor
     * @param {HexaColor} other - Color to copy from
     */
    copyFrom(other) {
      this._h = other._h;
      this._s = other._s;
      this._v = other._v;
      this._notify();
    }

    toString() {
      return `HexaColor(h=${this._h.toFixed(1)}, s=${this._s.toFixed(2)}, v=${this._v.toFixed(2)})`;
    }
  }

  /* ========================================
   * HexaColorWheel Class - The Color Wheel Widget
   * ======================================== */

  /**
   * HexaColorWheel - Hexagon HSV Color Wheel
   */
  class HexaColorWheel {
    /**
     * Create a new HexaColorWheel
     * @param {Object} options - Configuration options
     * @param {HTMLElement|string} options.container - Container element or selector
     * @param {number} [options.hexRadius=115] - Radius of the hexagon
     * @param {number} [options.triWidth=130] - Width of the SV triangle
     * @param {number} [options.triHeight=200] - Height of the SV triangle
     * @param {number} [options.gap=20] - Gap between hexagon and triangle
     * @param {HexaColor} [options.color] - Initial color (creates new if not provided)
     */
    constructor(options = {}) {
      // Get container
      if (typeof options.container === 'string') {
        this._container = document.querySelector(options.container);
      } else {
        this._container = options.container;
      }

      if (!this._container) {
        throw new Error('HexaColorWheel: container element required');
      }

      // Configuration
      this._hexRadius = options.hexRadius || 115;
      this._triWidth = options.triWidth || 130;
      this._triHeight = options.triHeight || 200;
      this._gap = options.gap !== undefined ? options.gap : 10;
      this._backgroundColor = options.backgroundColor !== undefined ? options.backgroundColor : '#444';

      // Calculate layout
      // Hexagon vertices are at 0°, 60°, 120°, etc. - top vertices at 60°/120° are at sin(60°) = ~0.866 of radius
      const hexTopOffset = this._hexRadius * Math.sin(60 * Math.PI / 180); // ~0.866 * radius
      
      this._hexCx = this._hexRadius + 15;
      this._hexCy = hexTopOffset + 15; // Center positioned so top vertices have 15px padding
      // Position triangle from the actual hexagon right edge (vertex at 0°)
      // The rightmost point of hexagon is at hexCx + hexRadius
      this._triLeft = this._hexCx + this._hexRadius + this._gap;
      // Align triangle top with hexagon top vertices (at y = hexCy - hexTopOffset)
      this._triTop = this._hexCy - hexTopOffset;

      // Canvas size
      const hexBottom = this._hexCy + hexTopOffset; // Bottom vertices at sin(60°) below center
      this._width = this._triLeft + this._triWidth + 20;
      this._height = Math.max(hexBottom + 15, this._triTop + this._triHeight + 15);

      // Color state
      this._color = options.color || new HexaColor();

      // Dragging state
      this._dragging = null;

      // Event listeners for cleanup
      this._boundHandlers = {};

      // Create canvas
      this._createCanvas();
      this._setupEvents();

      // Listen to color changes for external updates
      this._color.onChange(() => this.render());

      // Initial render
      this.render();
    }

    /* --- Public Getters/Setters --- */

    /** @returns {HexaColor} The current color */
    get color() { return this._color; }

    set color(value) {
      if (value instanceof HexaColor) {
        this._color = value;
        this._color.onChange(() => this.render());
        this.render();
      } else {
        throw new Error('HexaColorWheel: color must be a HexaColor instance');
      }
    }

    /** @returns {HTMLCanvasElement} The canvas element */
    get canvas() { return this._canvas; }

    /** @returns {number} Canvas width */
    get width() { return this._width; }

    /** @returns {number} Canvas height */
    get height() { return this._height; }

    /* --- Private: Canvas Creation --- */

    /** @private */
    _createCanvas() {
      this._canvas = document.createElement('canvas');
      this._canvas.width = this._width;
      this._canvas.height = this._height;
      this._ctx = this._canvas.getContext('2d');
      this._container.appendChild(this._canvas);
    }

    /* --- Private: Event Handling --- */

    /** @private */
    _setupEvents() {
      this._boundHandlers.mousedown = this._onMouseDown.bind(this);
      this._boundHandlers.documentMousemove = this._onMouseMove.bind(this);
      this._boundHandlers.documentMouseup = this._onMouseUp.bind(this);

      // Only mousedown on canvas - move/up tracked on document for dragging outside
      this._canvas.addEventListener('mousedown', this._boundHandlers.mousedown);
    }

    /** @private */
    _onMouseDown(e) {
      const { x, y } = this._getCanvasCoords(e);

      if (this._handleHexClick(x, y)) {
        this._dragging = 'hex';
        this._startDocumentTracking();
        this.render();
      } else if (this._handleTriClick(x, y)) {
        this._dragging = 'tri';
        this._startDocumentTracking();
        this.render();
      }
    }

    /** @private */
    _startDocumentTracking() {
      document.addEventListener('mousemove', this._boundHandlers.documentMousemove);
      document.addEventListener('mouseup', this._boundHandlers.documentMouseup);
    }

    /** @private */
    _stopDocumentTracking() {
      document.removeEventListener('mousemove', this._boundHandlers.documentMousemove);
      document.removeEventListener('mouseup', this._boundHandlers.documentMouseup);
    }

    /** @private */
    _onMouseMove(e) {
      if (!this._dragging) return;

      const { x, y } = this._getCanvasCoords(e);

      if (this._dragging === 'hex') {
        const { h, s } = this._hexToHueSat(x, y);
        this._color._h = h;
        this._color._s = Math.min(s, 1);
        this._color._notify();
      } else if (this._dragging === 'tri') {
        const py = Math.max(0, Math.min(this._triHeight, y - this._triTop));
        const leftEdge = this._triLeft + py * this._triWidth / this._triHeight;
        const rightEdge = this._triLeft + this._triWidth;
        const clampedX = Math.max(leftEdge, Math.min(rightEdge, x));

        const newVal = 1 - py / this._triHeight;
        const rowWidth = rightEdge - leftEdge;
        const newSat = rowWidth > 0 ? 1 - (clampedX - leftEdge) / rowWidth : 0;

        this._color._v = newVal;
        this._color._s = Math.max(0, Math.min(1, newSat));
        this._color._notify();
      }
    }

    /** @private */
    _onMouseUp() {
      if (this._dragging) {
        this._dragging = null;
        this._stopDocumentTracking();
      }
    }

    /** @private */
    _getCanvasCoords(e) {
      const rect = this._canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    /* --- Private: Hexagon Geometry --- */

    /** @private */
    _getHexVertices() {
      const vertices = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        vertices.push({
          x: this._hexCx + this._hexRadius * Math.cos(angle),
          y: this._hexCy - this._hexRadius * Math.sin(angle)
        });
      }
      return vertices;
    }

    /** @private */
    _isInsideHexagon(px, py) {
      const vertices = this._getHexVertices();
      let inside = false;
      for (let i = 0, j = 5; i < 6; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    }

    /** @private */
    _getHexEdgeDistance(angleDeg) {
      const a = ((angleDeg % 60) + 60) % 60;
      const angleFromMid = Math.abs(a - 30);
      return this._hexRadius * Math.cos(30 * Math.PI / 180) / Math.cos(angleFromMid * Math.PI / 180);
    }

    /** @private */
    _hexToHueSat(px, py) {
      const dx = px - this._hexCx;
      const dy = -(py - this._hexCy);

      let angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const h = ((angle % 360) + 360) % 360;

      const dist = Math.hypot(dx, dy);
      const edgeDist = this._getHexEdgeDistance(angle);
      const s = Math.min(dist / edgeDist, 1);

      return { h, s };
    }

    /** @private */
    _handleHexClick(x, y) {
      if (this._isInsideHexagon(x, y)) {
        const { h, s } = this._hexToHueSat(x, y);
        this._color._h = h;
        this._color._s = s;
        this._color._notify();
        return true;
      }
      return false;
    }

    /* --- Private: Triangle Geometry --- */

    /** @private */
    _handleTriClick(x, y) {
      if (x < this._triLeft || x > this._triLeft + this._triWidth ||
          y < this._triTop || y > this._triTop + this._triHeight) {
        return false;
      }

      const py = y - this._triTop;
      const minX = this._triLeft + py * this._triWidth / this._triHeight;

      if (x < minX) return false;

      const newVal = 1 - py / this._triHeight;
      const leftEdge = this._triLeft + py * this._triWidth / this._triHeight;
      const rightEdge = this._triLeft + this._triWidth;
      const rowWidth = rightEdge - leftEdge;
      const newSat = rowWidth > 0 ? 1 - (x - leftEdge) / rowWidth : 0;

      this._color._v = Math.max(0, Math.min(1, newVal));
      this._color._s = Math.max(0, Math.min(1, newSat));
      this._color._notify();

      return true;
    }

    /* --- Rendering --- */

    /** Render the color wheel */
    render() {
      const ctx = this._ctx;

      // Clear canvas - use transparent if no background color set
      if (this._backgroundColor) {
        ctx.fillStyle = this._backgroundColor;
        ctx.fillRect(0, 0, this._width, this._height);
      } else {
        ctx.clearRect(0, 0, this._width, this._height);
      }

      this._drawHexagon();
      this._drawTriangle();
    }

    /** @private */
    _drawHexagon() {
      const ctx = this._ctx;
      const imgWidth = this._hexRadius * 2 + 4;
      const imgHeight = this._hexRadius * 2 + 4;
      const imgData = ctx.createImageData(imgWidth, imgHeight);
      const ox = this._hexCx - this._hexRadius - 2;
      const oy = this._hexCy - this._hexRadius - 2;

      for (let py = 0; py < imgHeight; py++) {
        for (let px = 0; px < imgWidth; px++) {
          const worldX = ox + px;
          const worldY = oy + py;

          if (!this._isInsideHexagon(worldX, worldY)) continue;

          const { h, s } = this._hexToHueSat(worldX, worldY);
          const rgb = hsvToRgb(h, s, this._color.v);

          const idx = (py * imgWidth + px) * 4;
          imgData.data[idx] = rgb.r;
          imgData.data[idx + 1] = rgb.g;
          imgData.data[idx + 2] = rgb.b;
          imgData.data[idx + 3] = 255;
        }
      }

      // Use a temporary canvas to composite properly (respects alpha)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgWidth;
      tempCanvas.height = imgHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(tempCanvas, ox, oy);

      // Indicator
      const indicatorAngle = this._color.h * Math.PI / 180;
      const indicatorDist = this._color.s * this._getHexEdgeDistance(this._color.h);
      const indX = this._hexCx + indicatorDist * Math.cos(indicatorAngle);
      const indY = this._hexCy - indicatorDist * Math.sin(indicatorAngle);

      this._drawIndicator(indX, indY);
    }

    /** @private */
    _drawTriangle() {
      const ctx = this._ctx;
      const imgWidth = this._triWidth + 2;
      const imgHeight = this._triHeight + 2;
      const imgData = ctx.createImageData(imgWidth, imgHeight);

      for (let py = 0; py < this._triHeight; py++) {
        for (let px = 0; px < this._triWidth; px++) {
          const worldX = this._triLeft + px;
          const minX = this._triLeft + py * this._triWidth / this._triHeight;
          if (worldX < minX) continue;

          const v = 1 - py / this._triHeight;
          const leftEdge = this._triLeft + py * this._triWidth / this._triHeight;
          const rightEdge = this._triLeft + this._triWidth;
          const rowWidth = rightEdge - leftEdge;
          const s = rowWidth > 0 ? 1 - (worldX - leftEdge) / rowWidth : 0;

          const rgb = hsvToRgb(this._color.h, s, v);

          const idx = (py * imgWidth + px) * 4;
          imgData.data[idx] = rgb.r;
          imgData.data[idx + 1] = rgb.g;
          imgData.data[idx + 2] = rgb.b;
          imgData.data[idx + 3] = 255;
        }
      }

      // Use a temporary canvas to composite properly (respects alpha)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgWidth;
      tempCanvas.height = imgHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(tempCanvas, this._triLeft, this._triTop);

      // Indicator
      const indicatorY = this._triTop + (1 - this._color.v) * this._triHeight;
      const leftEdge = this._triLeft + (1 - this._color.v) * this._triWidth;
      const rightEdge = this._triLeft + this._triWidth;
      const rowWidth = rightEdge - leftEdge;
      const indicatorX = leftEdge + (1 - this._color.s) * rowWidth;

      this._drawIndicator(indicatorX, indicatorY);
    }

    /** @private */
    _drawIndicator(x, y) {
      const ctx = this._ctx;

      // Outer ring (black)
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner ring (white)
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* --- Cleanup --- */

    /** Destroy the wheel and clean up event listeners */
    destroy() {
      this._canvas.removeEventListener('mousedown', this._boundHandlers.mousedown);
      this._stopDocumentTracking();

      if (this._canvas.parentNode) {
        this._canvas.parentNode.removeChild(this._canvas);
      }

      this._canvas = null;
      this._ctx = null;
    }
  }

  /* ========================================
   * HexaSlider Class - Color Slider Widget
   * ======================================== */

  /**
   * HexaSlider - Hexagon-style color slider
   */
  class HexaSlider {
    /**
     * Create a new HexaSlider
     * @param {Object} options - Configuration options
     * @param {HTMLElement|string} options.container - Container element or selector
     * @param {string} options.channel - Channel: 'h', 's', 'v', 'a', 'r', 'g', 'b'
     * @param {HexaColor} options.color - Color to bind to
     * @param {number} [options.width=200] - Slider bar width
     * @param {number} [options.height=20] - Slider bar height
     * @param {boolean} [options.showLabel=true] - Show channel label
     * @param {boolean} [options.showInput=true] - Show numeric input
     * @param {boolean} [options.showArrows=true] - Show increment/decrement arrows
     */
    constructor(options = {}) {
      // Get container
      if (typeof options.container === 'string') {
        this._container = document.querySelector(options.container);
      } else {
        this._container = options.container;
      }

      if (!this._container) {
        throw new Error('HexaSlider: container element required');
      }

      if (!options.color) {
        throw new Error('HexaSlider: color (HexaColor instance) required');
      }

      // Configuration
      this._channel = (options.channel || 'h').toLowerCase();
      this._color = options.color;
      this._width = options.width || 200;
      this._height = options.height || 20;
      this._showLabel = options.showLabel !== false;
      this._showInput = options.showInput !== false;
      this._showArrows = options.showArrows !== false;

      // Channel configuration
      this._channelConfig = {
        h: { label: 'H', min: 0, max: 360, step: 1 },
        s: { label: 'S', min: 0, max: 100, step: 1 },
        v: { label: 'V', min: 0, max: 100, step: 1 },
        a: { label: 'A', min: 0, max: 255, step: 1 },
        r: { label: 'R', min: 0, max: 255, step: 1 },
        g: { label: 'G', min: 0, max: 255, step: 1 },
        b: { label: 'B', min: 0, max: 255, step: 1 }
      };

      if (!this._channelConfig[this._channel]) {
        throw new Error(`HexaSlider: invalid channel "${this._channel}"`);
      }

      this._config = this._channelConfig[this._channel];

      // Alpha value (stored separately since HexaColor doesn't have alpha)
      this._alpha = 255;
      
      // Alpha change callback
      this._onAlphaChange = options.onAlphaChange || null;

      // Dragging state
      this._dragging = false;
      this._boundHandlers = {};

      // Build UI
      this._buildUI();
      this._setupEvents();

      // Listen to color changes
      this._unsubscribe = this._color.onChange(() => this._update());

      // Initial render
      this._update();
    }

    /* --- Public Getters/Setters --- */

    /** @returns {number} Alpha value (0-255) for alpha slider */
    get alpha() { return this._alpha; }
    set alpha(value) {
      this._alpha = Math.max(0, Math.min(255, Math.round(value)));
      if (this._channel === 'a') {
        this._update();
      }
    }

    /** @returns {HexaColor} The bound color */
    get color() { return this._color; }

    /* --- Private: Build UI --- */

    /** @private */
    _buildUI() {
      // Create wrapper - no gap, we'll use margin on individual elements for precise control
      this._wrapper = document.createElement('div');
      this._wrapper.className = 'ot-slider';
      this._wrapper.style.cssText = 'display:flex;align-items:flex-start;font-family:sans-serif;font-size:14px;margin-bottom:-3px;width:100%;';

      // Label
      if (this._showLabel) {
        this._label = document.createElement('span');
        this._label.className = 'ot-slider-label';
        this._label.textContent = this._config.label;
        this._label.style.cssText = 'width:16px;min-width:16px;height:24px;line-height:24px;color:#ddd;font-weight:bold;text-align:center;margin-right:4px;flex-shrink:0;';
        this._wrapper.appendChild(this._label);
      }

      // Input field
      if (this._showInput) {
        this._input = document.createElement('input');
        this._input.type = 'text';
        this._input.className = 'ot-slider-input';
        this._input.style.cssText = 'width:36px;min-width:36px;height:24px;padding:0 2px;background:#222;color:#fff;border:1px solid #555;border-radius:3px;text-align:center;font-family:monospace;font-size:11px;box-sizing:border-box;margin-right:4px;flex-shrink:0;';
        this._wrapper.appendChild(this._input);
      }

      // Left arrow
      if (this._showArrows) {
        this._leftArrow = document.createElement('button');
        this._leftArrow.className = 'ot-slider-arrow ot-slider-arrow-left';
        this._leftArrow.innerHTML = '◀';
        this._leftArrow.style.cssText = 'width:18px;min-width:18px;height:24px;padding:0;background:#333;color:#aaa;border:1px solid #555;cursor:pointer;font-size:8px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;margin-right:2px;flex-shrink:0;';
        this._wrapper.appendChild(this._leftArrow);
      }

      // Slider bar container
      this._barContainer = document.createElement('div');
      this._barContainer.className = 'ot-slider-bar-container';
      this._barContainer.style.cssText = `position:relative;flex:1;min-width:50px;height:${this._height + 8}px;margin-left:3px;margin-right:3px;`;

      // Canvas for gradient - will be resized on first render
      this._canvas = document.createElement('canvas');
      this._canvas.height = this._height;
      this._canvas.style.cssText = 'display:block;box-sizing:border-box;margin-top:2px;width:100%;';
      this._ctx = this._canvas.getContext('2d');
      this._barContainer.appendChild(this._canvas);

      // Triangle indicator
      this._indicator = document.createElement('div');
      this._indicator.className = 'ot-slider-indicator';
      this._indicator.style.cssText = 'position:absolute;bottom:0;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:6px solid white;transform:translateX(-5px);pointer-events:none;';
      this._barContainer.appendChild(this._indicator);

      this._wrapper.appendChild(this._barContainer);

      // Right arrow
      if (this._showArrows) {
        this._rightArrow = document.createElement('button');
        this._rightArrow.className = 'ot-slider-arrow ot-slider-arrow-right';
        this._rightArrow.innerHTML = '▶';
        this._rightArrow.style.cssText = 'width:18px;min-width:18px;height:24px;padding:0;background:#333;color:#aaa;border:1px solid #555;cursor:pointer;font-size:8px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;margin-left:2px;flex-shrink:0;';
        this._wrapper.appendChild(this._rightArrow);
      }

      this._container.appendChild(this._wrapper);
    }

    /* --- Private: Event Handling --- */

    /** @private */
    _setupEvents() {
      // Canvas mouse events
      this._boundHandlers.mousedown = this._onMouseDown.bind(this);
      this._boundHandlers.documentMousemove = this._onMouseMove.bind(this);
      this._boundHandlers.documentMouseup = this._onMouseUp.bind(this);

      this._canvas.addEventListener('mousedown', this._boundHandlers.mousedown);

      // Input events
      if (this._input) {
        this._boundHandlers.inputChange = this._onInputChange.bind(this);
        this._boundHandlers.inputKeydown = this._onInputKeydown.bind(this);
        this._input.addEventListener('change', this._boundHandlers.inputChange);
        this._input.addEventListener('keydown', this._boundHandlers.inputKeydown);
      }

      // Arrow events
      if (this._leftArrow) {
        this._boundHandlers.leftClick = () => this._adjustValue(-this._config.step);
        this._leftArrow.addEventListener('click', this._boundHandlers.leftClick);
      }
      if (this._rightArrow) {
        this._boundHandlers.rightClick = () => this._adjustValue(this._config.step);
        this._rightArrow.addEventListener('click', this._boundHandlers.rightClick);
      }
    }

    /** @private */
    _onMouseDown(e) {
      this._dragging = true;
      document.addEventListener('mousemove', this._boundHandlers.documentMousemove);
      document.addEventListener('mouseup', this._boundHandlers.documentMouseup);
      this._updateFromMouse(e);
    }

    /** @private */
    _onMouseMove(e) {
      if (!this._dragging) return;
      this._updateFromMouse(e);
    }

    /** @private */
    _onMouseUp() {
      this._dragging = false;
      document.removeEventListener('mousemove', this._boundHandlers.documentMousemove);
      document.removeEventListener('mouseup', this._boundHandlers.documentMouseup);
    }

    /** @private */
    _updateFromMouse(e) {
      const rect = this._canvas.getBoundingClientRect();
      const w = this._getBarWidth();
      const x = Math.max(0, Math.min(w, e.clientX - rect.left));
      const ratio = x / w;
      const value = this._config.min + ratio * (this._config.max - this._config.min);
      this._setValue(Math.round(value));
    }

    /** @private */
    _onInputChange() {
      const value = parseInt(this._input.value, 10);
      if (!isNaN(value)) {
        this._setValue(Math.max(this._config.min, Math.min(this._config.max, value)));
      }
    }

    /** @private */
    _onInputKeydown(e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._adjustValue(this._config.step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._adjustValue(-this._config.step);
      }
    }

    /** @private */
    _adjustValue(delta) {
      const current = this._getValue();
      this._setValue(Math.max(this._config.min, Math.min(this._config.max, current + delta)));
    }

    /* --- Private: Value Management --- */

    /** @private */
    _getValue() {
      switch (this._channel) {
        case 'h': return Math.round(this._color.h);
        case 's': return Math.round(this._color.s * 100);
        case 'v': return Math.round(this._color.v * 100);
        case 'a': return this._alpha;
        case 'r': return this._color.r;
        case 'g': return this._color.g;
        case 'b': return this._color.b;
      }
      return 0;
    }

    /** @private */
    _setValue(value) {
      switch (this._channel) {
        // Clamp hue to 359 max to prevent 360 wrapping to 0
        case 'h': this._color.h = Math.min(359, value); break;
        case 's': this._color.s = value / 100; break;
        case 'v': this._color.v = value / 100; break;
        case 'a': 
          this._alpha = value; 
          this._update();
          if (this._onAlphaChange) {
            this._onAlphaChange(value);
          }
          break;
        case 'r': this._color.r = value; break;
        case 'g': this._color.g = value; break;
        case 'b': this._color.b = value; break;
      }
    }

    /* --- Private: Rendering --- */

    /** @private - Get the actual bar width from the container */
    _getBarWidth() {
      return this._barContainer.clientWidth || this._width;
    }

    /** @private */
    _update() {
      // Update canvas size to match container
      const w = this._getBarWidth();
      if (this._canvas.width !== w) {
        this._canvas.width = w;
      }
      this._drawGradient();
      this._updateIndicator();
      this._updateInput();
    }

    /** @private */
    _drawGradient() {
      const ctx = this._ctx;
      const w = this._getBarWidth();
      const h = this._height;

      // Create gradient based on channel
      const gradient = ctx.createLinearGradient(0, 0, w, 0);

      switch (this._channel) {
        case 'h':
          // Hue rainbow
          for (let i = 0; i <= 6; i++) {
            const rgb = hsvToRgb(i * 60, 1, 1);
            gradient.addColorStop(i / 6, `rgb(${rgb.r},${rgb.g},${rgb.b})`);
          }
          break;

        case 's':
          // Saturation: gray to current hue at full sat
          const grayRgb = hsvToRgb(this._color.h, 0, this._color.v);
          const fullSatRgb = hsvToRgb(this._color.h, 1, this._color.v);
          gradient.addColorStop(0, `rgb(${grayRgb.r},${grayRgb.g},${grayRgb.b})`);
          gradient.addColorStop(1, `rgb(${fullSatRgb.r},${fullSatRgb.g},${fullSatRgb.b})`);
          break;

        case 'v':
          // Value: black to current color at full value
          const darkRgb = hsvToRgb(this._color.h, this._color.s, 0);
          const brightRgb = hsvToRgb(this._color.h, this._color.s, 1);
          gradient.addColorStop(0, `rgb(${darkRgb.r},${darkRgb.g},${darkRgb.b})`);
          gradient.addColorStop(1, `rgb(${brightRgb.r},${brightRgb.g},${brightRgb.b})`);
          break;

        case 'a':
          // Alpha: checkerboard then color with transparency
          this._drawCheckerboard();
          const aRgb = this._color.rgb;
          const alphaGradient = ctx.createLinearGradient(0, 0, w, 0);
          alphaGradient.addColorStop(0, `rgba(${aRgb.r},${aRgb.g},${aRgb.b},0)`);
          alphaGradient.addColorStop(1, `rgba(${aRgb.r},${aRgb.g},${aRgb.b},1)`);
          ctx.fillStyle = alphaGradient;
          ctx.fillRect(0, 0, w, h);
          return;

        case 'r':
          // Red channel
          const rLow = { r: 0, g: this._color.g, b: this._color.b };
          const rHigh = { r: 255, g: this._color.g, b: this._color.b };
          gradient.addColorStop(0, `rgb(${rLow.r},${rLow.g},${rLow.b})`);
          gradient.addColorStop(1, `rgb(${rHigh.r},${rHigh.g},${rHigh.b})`);
          break;

        case 'g':
          // Green channel
          const gLow = { r: this._color.r, g: 0, b: this._color.b };
          const gHigh = { r: this._color.r, g: 255, b: this._color.b };
          gradient.addColorStop(0, `rgb(${gLow.r},${gLow.g},${gLow.b})`);
          gradient.addColorStop(1, `rgb(${gHigh.r},${gHigh.g},${gHigh.b})`);
          break;

        case 'b':
          // Blue channel
          const bLow = { r: this._color.r, g: this._color.g, b: 0 };
          const bHigh = { r: this._color.r, g: this._color.g, b: 255 };
          gradient.addColorStop(0, `rgb(${bLow.r},${bLow.g},${bLow.b})`);
          gradient.addColorStop(1, `rgb(${bHigh.r},${bHigh.g},${bHigh.b})`);
          break;
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    /** @private */
    _drawCheckerboard() {
      const ctx = this._ctx;
      const size = 8;
      const w = this._getBarWidth();
      const h = this._height;

      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          const isLight = ((x / size) + (y / size)) % 2 === 0;
          ctx.fillStyle = isLight ? '#ccc' : '#888';
          ctx.fillRect(x, y, size, size);
        }
      }
    }

    /** @private */
    _updateIndicator() {
      const value = this._getValue();
      const ratio = (value - this._config.min) / (this._config.max - this._config.min);
      const x = ratio * this._getBarWidth();
      this._indicator.style.left = x + 'px';
    }

    /** @private */
    _updateInput() {
      if (this._input) {
        this._input.value = this._getValue();
      }
    }

    /* --- Cleanup --- */

    /** Destroy the slider and clean up */
    destroy() {
      this._unsubscribe();
      this._canvas.removeEventListener('mousedown', this._boundHandlers.mousedown);
      document.removeEventListener('mousemove', this._boundHandlers.documentMousemove);
      document.removeEventListener('mouseup', this._boundHandlers.documentMouseup);

      if (this._input) {
        this._input.removeEventListener('change', this._boundHandlers.inputChange);
        this._input.removeEventListener('keydown', this._boundHandlers.inputKeydown);
      }
      if (this._leftArrow) {
        this._leftArrow.removeEventListener('click', this._boundHandlers.leftClick);
      }
      if (this._rightArrow) {
        this._rightArrow.removeEventListener('click', this._boundHandlers.rightClick);
      }

      if (this._wrapper.parentNode) {
        this._wrapper.parentNode.removeChild(this._wrapper);
      }

      this._wrapper = null;
      this._canvas = null;
      this._ctx = null;
    }
  }

  /* ========================================
   * Export
   * ======================================== */

  // Static utility functions
  HexaColorWheel.hsvToRgb = hsvToRgb;
  HexaColorWheel.rgbToHsv = rgbToHsv;
  HexaColorWheel.rgbToHex = rgbToHex;
  HexaColorWheel.hexToRgb = hexToRgb;

  // Export classes
  HexaColorWheel.Color = HexaColor;
  HexaColorWheel.Slider = HexaSlider;

  // Export to global/module
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HexaColorWheel, HexaColor, HexaSlider };
  } else {
    global.HexaColorWheel = HexaColorWheel;
    global.HexaColor = HexaColor;
    global.HexaSlider = HexaSlider;
  }

})(typeof window !== 'undefined' ? window : this);
