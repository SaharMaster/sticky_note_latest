// src/graphics/layout/boardLayout.js

/**
 * Board Layout (pure)
 * Transforms board data -> positioned primitives, independent of React/Canvas.
 *
 * Design:
 * - computeBoardLayout: pure function to compute rows, items, plus tiles, total height
 * - hitTestLayout: pure function to find what is under a given point
 *
 * Coordinates are absolute in the canvas space (0,0 at canvas top-left).
 * We center the content area and apply horizontal padding via metrics.
 */

export function computeBoardLayout(board, containerWidth, metrics) {
    if (!board) {
      return {
        rows: [],
        totalHeight: metrics.topPadY + metrics.bottomPadY,
        plusRow: null,
        geometry: {
          contentOffsetX: 0,
          contentWidth: Math.min(containerWidth, metrics.contentMaxWidth),
          innerWidth: 0,
        },
      };
    }
  
    const contentWidth = Math.min(containerWidth, metrics.contentMaxWidth);
    const contentOffsetX = Math.floor((containerWidth - contentWidth) / 2);
    const innerWidth = Math.max(0, contentWidth - metrics.contentPadX * 2);
    const xPad = contentOffsetX + metrics.contentPadX;
  
    const tile = metrics.tile;
    const gutter = metrics.gutter;
    const cols = Math.max(1, Math.floor((innerWidth + gutter) / (tile + gutter)));
  
    let y = metrics.topPadY;
    const rows = [];
  
    const sepLabel = (i) => (i === 0 ? "New" : i === 1 ? "Second block" : "Next block");
  
    // Build rows: separator + grid for each row of notes
    board.rows.forEach((row, rowIndex) => {
      // Separator
      rows.push({
        kind: "separator",
        y,
        height: metrics.sepHeight,
        label: sepLabel(rowIndex),
        xLabel: xPad,
      });
      y += metrics.sepHeight;
  
      // Grid of tiles
      const items = [];
      let col = 0;
      let line = 0;
  
      for (const note of row) {
        const x = xPad + col * (tile + gutter);
        const rect = { x, y: y + line * (tile + gutter), w: tile, h: tile };
        items.push({ rect, note, rowIndex });
  
        col++;
        if (col >= cols) {
          col = 0;
          line++;
        }
      }
  
      // Plus tile at end of the row
      const plusRect = {
        x: xPad + col * (tile + gutter),
        y: y + line * (tile + gutter),
        w: tile,
        h: tile,
      };
  
      const linesUsed = line + 1; // includes line holding the plus tile
      const rowHeight = linesUsed * tile + (linesUsed - 1) * gutter;
  
      rows.push({
        kind: "grid",
        y,
        height: rowHeight,
        items,
        plusRect,
        rowIndex,
      });
  
      y += rowHeight + metrics.rowGap;
    });
  
    // Trailing separator and bottom plus (add row)
    rows.push({
      kind: "separator",
      y,
      height: metrics.sepHeight,
      label: sepLabel(board.rows.length),
      xLabel: xPad,
    });
    y += metrics.sepHeight;
  
    const plusRow = {
      x: xPad,
      y,
      w: tile,
      h: tile,
    };
    y += tile;
  
    return {
      rows,
      totalHeight: y + metrics.bottomPadY,
      plusRow,
      geometry: {
        contentOffsetX,
        contentWidth,
        innerWidth,
      },
    };
  }
  
  /**
   * Hit test
   * Returns:
   *  - { type: "note", rowIndex, note, rect }
   *  - { type: "plus-note", rowIndex, rect }
   *  - { type: "plus-row", rect }
   *  - null
   */
  export function hitTestLayout(layout, x, y) {
    if (!layout) return null;
  
    for (const r of layout.rows) {
      if (y < r.y || y > r.y + r.height) continue;
  
      if (r.kind === "grid") {
        // Notes first
        for (const it of r.items) {
          const { rect } = it;
          if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
            return { type: "note", rowIndex: it.rowIndex, note: it.note, rect };
          }
        }
        // Then row plus
        const p = r.plusRect;
        if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
          return { type: "plus-note", rowIndex: r.rowIndex, rect: p };
        }
      }
    }
  
    // Bottom plus for "Add row"
    const pr = layout.plusRow;
    if (pr && x >= pr.x && x <= pr.x + pr.w && y >= pr.y && y <= pr.y + pr.h) {
      return { type: "plus-row", rect: pr };
    }
  
    return null;
  }