// src/graphics/render/boardRender.js

/**
 * Board Renderer (2D Canvas)
 * Stateless draw functions for the computed layout.
 *
 * drawBoard(ctx, layout, metrics, viewRect):
 * - Culls drawing outside of the viewport.
 * - Renders: separators, notes (dim colors, rounded), plus tiles.
 * - Separator line leaves a small right gap (doesn't touch scrollbar).
 */

export function drawBoard(ctx, layout, metrics, viewRect) {
    if (!layout) return;
  
    const margin = 200; // small extra draw margin for smooth scroll
  
    ctx.font = metrics.labelFont;
    ctx.textBaseline = "alphabetic";
  
    for (const r of layout.rows) {
      if (r.y > viewRect.bottom + margin) break;
      if (r.y + r.height < viewRect.top - margin) continue;
  
      if (r.kind === "separator") {
        drawSeparator(ctx, r, metrics, layout.geometry);
      } else if (r.kind === "grid") {
        for (const it of r.items) {
          drawNote(ctx, it.rect, it.note?.tone || "yellow", metrics);
        }
        drawPlusTile(ctx, r.plusRect, metrics, false);
      }
    }
  
    if (layout.plusRow) {
      drawPlusTile(ctx, layout.plusRow, metrics, true);
    }
  }
  
  /* ---------- Primitives ---------- */
  
  function drawSeparator(ctx, sep, metrics, geometry) {
    // Label
    ctx.fillStyle = "#6b7280"; // neutral-500
    ctx.fillText(sep.label || "", sep.xLabel, sep.y + 14);
  
    // Line to the right of the label; leave a small gap at far right
    ctx.strokeStyle = "#d4d4d4"; // neutral-300
    ctx.lineWidth = 1;
    ctx.beginPath();
    const lineStartX = sep.xLabel + 84; // a bit more space after label
    const lineEndX =
      geometry.contentOffsetX +
      geometry.contentWidth -
      metrics.rightGapForScrollbar;
    const lineY = sep.y + 12;
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();
  }
  
  function drawNote(ctx, rect, tone, metrics) {
    const [fill, ring] = toneColors(tone);
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, metrics.corner);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
  
  function drawPlusTile(ctx, rect, metrics, prominent) {
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, metrics.corner);
    ctx.fillStyle = "#e5e7eb"; // neutral-200
    ctx.fill();
    ctx.strokeStyle = "#9ca3af"; // neutral-400
    ctx.lineWidth = 1;
    ctx.stroke();
  
    // plus icon
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.strokeStyle = "#374151"; // neutral-700
    ctx.lineWidth = prominent ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();
  }
  
  /* ---------- Utilities ---------- */
  
  function roundRect(ctx, x, y, w, h, r) {
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
  
  function toneColors(tone) {
    // Slightly dimmed to keep a calmer UI style
    const map = {
      yellow: ["#fde68a", "#f5d35a"], // fill, ring
      sky:    ["#b6e0fb", "#74c9f8"],
      emerald:["#a1f0cc", "#66e3b3"],
      amber:  ["#f5cc55", "#e69a0a"],
      rose:   ["#f9c6ce", "#f395a2"],
      violet: ["#d8d0fd", "#bdaafc"],
      lime:   ["#d4f493", "#b9ee5a"],
    };
    return map[tone] || map.yellow;
  }