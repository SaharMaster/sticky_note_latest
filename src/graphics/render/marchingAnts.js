// src/graphics/render/marchingAnts.js

// Default, tweak as needed per call-site
export const defaultAntsConfig = {
    color: "#d1d5db",        // stroke color
    lineWidth: 2,            // px
    dash: [6, 3],            // [dashLen, gapLen] in px
    speedPxPerFrame: 0.35,   // dash offset advance per frame (lower = slower)
    offsetPx: 6,             // how far OUTSIDE the rect to draw the path
  };
  
  /**
   * Draws a rounded marching-ants stroke outside a tile rect.
   * - rect: { x, y, w, h }
   * - cornerRadius: number (px)
   * - offset: number (current dash offset in px; increase over time)
   * - cfg: partial or full config override
   */
  export function drawMarchingAnts(ctx, rect, cornerRadius, offset, cfg = {}) {
    const c = { ...defaultAntsConfig, ...cfg };
  
    // Expand rect outward so path is outside the tile
    const x = rect.x - c.offsetPx;
    const y = rect.y - c.offsetPx;
    const w = rect.w + c.offsetPx * 2;
    const h = rect.h + c.offsetPx * 2;
    const r = Math.max(0, Math.min(cornerRadius + c.offsetPx, Math.min(w, h) / 2));
  
    ctx.save();
    ctx.setLineDash(c.dash);
    ctx.lineDashOffset = -offset;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = c.lineWidth;
  
    roundRectPath(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }
  
  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }
  
  /**
   * Utility to increment a dash offset ref each frame using speed.
   * - antsRef: React ref object with { offset: number }
   * - speedPxPerFrame: number
   */
  export function advanceAntsOffset(antsRef, speedPxPerFrame) {
    antsRef.current.offset = (antsRef.current.offset + speedPxPerFrame) % 10000;
  }