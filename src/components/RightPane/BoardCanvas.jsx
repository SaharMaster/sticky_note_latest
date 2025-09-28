// src/components/RightPane/BoardCanvas.jsx
import React from "react";
import { computeBoardLayout, hitTestLayout } from "../../graphics/layout/boardLayout";
import { drawMarchingAnts, defaultAntsConfig, advanceAntsOffset } from "../../graphics/render/marchingAnts";

/**
 * BoardCanvas (Canvas host) with Edit Mode + DnD
 *
 * - Right-click inside a section (grid OR on a note) opens the Section menu (kept).
 * - Edit mode (board-wide):
 *    • All notes dimmed.
 *    • Hover note shows reusable marching-ants dashed ring (outside the tile).
 *    • Long-press on a note to start dragging; ghost follows cursor with slight scale + shadow.
 *    • Nearby tiles smoothly shift to create a gap; drop snaps into nearest slot.
 *    • Cross-row drag supported; commits via provided callbacks.
 * - Empty section handling:
 *    • If a section is (or becomes) empty while dragging out the last note, show a per-row '+'
 *      inside the first slot so the row remains usable; clicking adds a note to that row.
 * - Bottom plus-row remains to add a new section.
 */

export default function BoardCanvas({
  board,
  isEditing = false,
  onAddRow,                 // add new section (row)
  onAddNoteToRow,          // (rowIdx) => void
  scrollEl,
  onSectionContextMenu,    // (evt, rowIdx) => void
  onMoveWithinRow,         // (sectionIndex, fromIndex, toIndex)
  onMoveBetweenRows,       // (fromSection, fromIndex, toSection, toIndex)
}) {
  const canvasRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  // Hover states
  const [hoverPlus, setHoverPlus] = React.useState(null); // { type: "plus-row", rect } | null
  const [hoverNoteId, setHoverNoteId] = React.useState(null);
  const [hoverEmptyRowPlus, setHoverEmptyRowPlus] = React.useState(null); // { rowIndex, rect } | null

  // Marching ants animation
  const antsCfg = React.useMemo(() => ({
    ...defaultAntsConfig,
    // Tweakables exposed here:
    color: "#d1d5db",
    lineWidth: 2,
    dash: [6, 4],
    speedPxPerFrame: 0.25, // slower
    offsetPx: 6,           // draw outside by 6px
  }), []);
  const antsRef = React.useRef({ offset: 0 });

  // Drag state
  const dragRef = React.useRef({
    active: false,
    pending: false,
    startX: 0,
    startY: 0,
    note: null, // { id, tone }
    fromRow: -1,
    fromIndex: -1,
    offsetX: 0,
    offsetY: 0,
    overRow: -1,
    overIndex: -1,
    pointerX: 0,
    pointerY: 0,
    longPressTimer: null,
  });

  // Animated positions map for smooth shifting: id -> {x,y}
  const posRef = React.useRef(new Map());

  // Simple animation ticker
  const [tick, setTick] = React.useState(0);

  // Metrics (single source of truth)
  const metrics = React.useMemo(
    () => ({
      // grid geometry
      tile: 180,
      gutter: 16,

      // spacing + separators
      rowGap: 28,
      sepHeight: 28,
      corner: 8,

      // centered frame
      contentMaxWidth: 1600,
      contentPadX: 24,
      topPadY: 10,
      bottomPadY: 24,
      rightGapForScrollbar: 12,

      // text
      labelFont: "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif",

      // plus visuals
      plusCircleRadius: 16,
      plusCircleStroke: 2,
      plusIconStroke: 2,
      plusHoverTileFill: "rgba(229, 231, 235, 0.6)", // neutral-200 @ 70%
      plusCircleColor: "#6e7c8f", // neutral-600
      plusCircleOutline: "#9ca3af", // neutral-400
    }),
    []
  );

  // Observe width from the scroll container
  React.useEffect(() => {
    const el = scrollEl?.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth || 0);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollEl]);

  // Track scroll position for culling
  React.useEffect(() => {
    const el = scrollEl?.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop || 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollEl]);

  // Compute layout
  const layout = React.useMemo(() => {
    return computeBoardLayout(board, containerWidth, metrics);
  }, [board, containerWidth, metrics]);

  // Animation loop: run while editing/dragging/hovering to animate ants + easing
  React.useEffect(() => {
    let raf;
    const loop = () => {
      advanceAntsOffset(antsRef, antsCfg.speedPxPerFrame);
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };

    const shouldRun =
      isEditing || dragRef.current.active || dragRef.current.pending || hoverNoteId != null;

    if (shouldRun) {
      raf = requestAnimationFrame(loop);
    }
    return () => raf && cancelAnimationFrame(raf);
  }, [isEditing, hoverNoteId, antsCfg.speedPxPerFrame]);

  // Draw
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = Math.max(1, containerWidth);
    const cssH = Math.max(1, layout.totalHeight);

    if (
      canvas.width !== Math.floor(cssW * dpr) ||
      canvas.height !== Math.floor(cssH * dpr)
    ) {
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
    }

    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, cssW, cssH);

    // Viewport culling range
    const viewRect = {
      top: scrollTop,
      bottom: scrollTop + (scrollEl?.current?.clientHeight || 0),
    };

    drawBoard({
      ctx,
      layout,
      metrics,
      viewRect,
      hoverPlus,
      hoverNoteId,
      hoverEmptyRowPlus,
      isEditing,
      antsOffset: antsRef.current.offset,
      antsCfg,
      dragState: dragRef.current,
      posRef,
    });

    ctx.restore();
  }, [
    layout,
    metrics,
    hoverPlus,
    hoverNoteId,
    hoverEmptyRowPlus,
    scrollTop,
    containerWidth,
    scrollEl,
    isEditing,
    tick,
    antsCfg,
  ]);

  // Helpers
  const toLocal = React.useCallback((evt) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }, []);

  const xPad = React.useMemo(
    () => layout.geometry.contentOffsetX + metrics.contentPadX,
    [layout.geometry.contentOffsetX, metrics.contentPadX]
  );
  const cols = React.useMemo(() => {
    const { innerWidth } = layout.geometry;
    return Math.max(
      1,
      Math.floor((innerWidth + metrics.gutter) / (metrics.tile + metrics.gutter))
    );
  }, [layout.geometry, metrics.gutter, metrics.tile]);

  const pointToRowAndIndex = React.useCallback(
    (x, y) => {
      // Find target row by y within grid area (extend min height)
      for (const r of layout.rows) {
        if (r.kind !== "grid") continue;
        const minH = Math.max(r.height, metrics.tile);
        if (y < r.y || y > r.y + minH) continue;

        // Project to slot index
        const relX = Math.max(0, x - xPad);
        const relY = Math.max(0, y - r.y);
        const col = Math.max(
          0,
          Math.min(cols - 1, Math.floor(relX / (metrics.tile + metrics.gutter)))
        );
        const line = Math.max(0, Math.floor(relY / (metrics.tile + metrics.gutter)));

        // Clamp to end of row
        const count = r.items.length;
        const idx = Math.max(0, Math.min(line * cols + col, Math.max(0, count)));
        return { rowIndex: r.rowIndex, index: idx };
      }
      return null;
    },
    [layout.rows, xPad, cols, metrics.tile, metrics.gutter]
  );

  const pointInRect = (x, y, rect) =>
    rect && x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;

  const firstSlotRectForRow = React.useCallback(
    (row) => slotRectForIndex(0, row.y, layout.geometry, metrics),
    [layout.geometry, metrics]
  );

  // Interactions (hover and DnD)
  const onMouseMove = React.useCallback(
    (evt) => {
      const { x, y } = toLocal(evt);
      const hit = hitTestLayout(layout, x, y);

      const d = dragRef.current;

      if (d.active) {
        // dragging
        d.pointerX = x;
        d.pointerY = y;

        const target = pointToRowAndIndex(x, y);
        if (target) {
          d.overRow = target.rowIndex;
          d.overIndex = target.index;
        }

        // While dragging, compute empty-source-row plus hover zone
        let hovered = null;
        for (const r of layout.rows) {
          if (r.kind !== "grid") continue;
          // Source row would be empty when dragging last note out
          const wouldBeEmpty = d.fromRow === r.rowIndex && r.items.length === 1;
          const isActuallyEmpty = r.items.length === 0;
          if (wouldBeEmpty || isActuallyEmpty) {
            const rect = firstSlotRectForRow(r);
            if (pointInRect(x, y, rect)) {
              hovered = { rowIndex: r.rowIndex, rect };
              break;
            }
          }
        }
        setHoverEmptyRowPlus(hovered);
        return;
      }

      // Not dragging — manage hover states
      setHoverEmptyRowPlus(null); // not shown except in empty rows (still handle below)

      if (!hit) {
        if (hoverPlus) setHoverPlus(null);
        if (hoverNoteId) setHoverNoteId(null);
      } else {
        if (hit.type === "note") {
          setHoverNoteId(hit.note?.id || null);
        } else if (hoverNoteId) {
          setHoverNoteId(null);
        }

        if (hit.type === "plus-row") {
          const cur = hoverPlus;
          if (!cur || cur.type !== "plus-row" || cur.rect !== hit.rect) {
            setHoverPlus({ type: "plus-row", rect: hit.rect });
          }
        } else if (hoverPlus) {
          setHoverPlus(null);
        }
      }

      // Also detect per-row empty plus hover when not dragging
      for (const r of layout.rows) {
        if (r.kind !== "grid") continue;
        if (r.items.length === 0) {
          const rect = firstSlotRectForRow(r);
          if (pointInRect(x, y, rect)) {
            setHoverEmptyRowPlus({ rowIndex: r.rowIndex, rect });
            return;
          }
        }
      }
      // Clear if not hovering over any empty-row plus
      setHoverEmptyRowPlus(null);
    },
    [layout, hoverPlus, hoverNoteId, toLocal, pointToRowAndIndex, firstSlotRectForRow]
  );

  const onMouseLeave = React.useCallback(() => {
    if (hoverPlus) setHoverPlus(null);
    if (hoverNoteId) setHoverNoteId(null);
    if (hoverEmptyRowPlus) setHoverEmptyRowPlus(null);
  }, [hoverPlus, hoverNoteId, hoverEmptyRowPlus]);

  // Long-press to start drag
  const onPointerDown = React.useCallback(
    (evt) => {
      if (!isEditing) return;

      const { x, y } = toLocal(evt);
      const hit = hitTestLayout(layout, x, y);
      if (!hit || hit.type !== "note") return;

      const d = dragRef.current;
      const rect = hit.rect;

      d.pending = true;
      d.active = false;
      d.startX = x;
      d.startY = y;
      d.pointerX = x;
      d.pointerY = y;
      d.note = hit.note;
      d.fromRow = hit.rowIndex;
      d.fromIndex =
        layout.rows.find((r) => r.kind === "grid" && r.rowIndex === hit.rowIndex)
          ?.items.findIndex((it) => it.note?.id === hit.note?.id) ?? -1;
      d.offsetX = x - rect.x;
      d.offsetY = y - rect.y;
      d.overRow = hit.rowIndex;
      d.overIndex = d.fromIndex;

      // Start long-press timer (200ms)
      if (d.longPressTimer) {
        clearTimeout(d.longPressTimer);
        d.longPressTimer = null;
      }
      d.longPressTimer = setTimeout(() => {
        d.active = true;
        d.pending = false;
      }, 200);
    },
    [isEditing, layout, toLocal]
  );

  const onPointerMove = React.useCallback(
    (evt) => {
      const d = dragRef.current;
      if (!d.pending && !d.active) return;

      const { x, y } = toLocal(evt);
      d.pointerX = x;
      d.pointerY = y;
    },
    [toLocal]
  );

  const onPointerUp = React.useCallback(() => {
    const d = dragRef.current;

    // Cancel pending long-press
    if (d.pending) {
      d.pending = false;
      if (d.longPressTimer) {
        clearTimeout(d.longPressTimer);
        d.longPressTimer = null;
      }
      return;
    }

    if (!d.active) return;

    // Commit reorder
    const fromRow = d.fromRow;
    const fromIndex = d.fromIndex;
    const toRow = d.overRow;
    let toIndex = d.overIndex;

    if (fromRow === toRow) {
      if (toIndex > fromIndex) toIndex = Math.max(0, toIndex - 1);
      const rowLen =
        layout.rows.find((r) => r.kind === "grid" && r.rowIndex === fromRow)
          ?.items.length ?? 0;
      const maxIdx = Math.max(0, rowLen - 1);
      toIndex = Math.max(0, Math.min(toIndex, maxIdx));
      onMoveWithinRow?.(fromRow, fromIndex, toIndex);
    } else if (toRow >= 0) {
      onMoveBetweenRows?.(fromRow, fromIndex, toRow, Math.max(0, toIndex));
    }

    // Reset drag
    d.active = false;
    d.pending = false;
    d.note = null;
    d.fromRow = -1;
    d.fromIndex = -1;
    d.overRow = -1;
    d.overIndex = -1;
    d.longPressTimer && clearTimeout(d.longPressTimer);
    d.longPressTimer = null;
  }, [layout.rows, onMoveWithinRow, onMoveBetweenRows]);

  // Left-click: handle bottom plus-row OR empty-row plus
  const onClick = React.useCallback(
    (evt) => {
      const d = dragRef.current;
      if (d.active || d.pending) return; // ignore click after drag gesture

      const { x, y } = toLocal(evt);
      const hit = hitTestLayout(layout, x, y);

      // Empty row plus
      if (hoverEmptyRowPlus?.rect && pointInRect(x, y, hoverEmptyRowPlus.rect)) {
        onAddNoteToRow?.(hoverEmptyRowPlus.rowIndex);
        return;
      }

      if (!hit) return;

      if (hit.type === "plus-row") {
        onAddRow?.();
      }
    },
    [layout, toLocal, onAddRow, hoverEmptyRowPlus, onAddNoteToRow]
  );

  const onCanvasContextMenu = React.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      const { x, y } = toLocal(e);
      const hit = hitTestLayout(layout, x, y);
      if (!hit) return;
  
      // Do nothing on notes
      if (hit.type === "note") return;
  
      // Open menu on section background or row plus
      if (hit.type === "grid" || hit.type === "plus-note") {
        onSectionContextMenu?.(e, hit.rowIndex);
      }
    },
    [layout, toLocal, onSectionContextMenu]
  );
  
  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onContextMenu={onCanvasContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}

/* ========================= Drawing ========================= */

function drawBoard({
  ctx,
  layout,
  metrics,
  viewRect,
  hoverPlus,
  hoverNoteId,
  hoverEmptyRowPlus,
  isEditing,
  antsOffset,
  antsCfg,
  dragState,
  posRef,
}) {
  if (!layout) return;

  const margin = 200; // small extra range for smooth scrolling
  ctx.font = metrics.labelFont;
  ctx.textBaseline = "alphabetic";

  // Build virtual order per row when dragging
  const virtualByRow = new Map();
  for (const r of layout.rows) {
    if (r.kind !== "grid") continue;
    const items = r.items.slice();

    if (dragState.active && dragState.note) {
      const fromRow = dragState.fromRow;
      const toRow = dragState.overRow;
      let toIdx = dragState.overIndex;

      // Remove dragged from its source row list
      if (r.rowIndex === fromRow) {
        const idx = items.findIndex((it) => it.note?.id === dragState.note.id);
        if (idx >= 0) items.splice(idx, 1);
      }

      // Insert placeholder into target row list
      if (r.rowIndex === toRow) {
        toIdx = Math.max(0, Math.min(toIdx, items.length));
        items.splice(toIdx, 0, { rect: null, note: { id: "__placeholder__" } });
      }
    }

    virtualByRow.set(r.rowIndex, items);
  }

  // Animate positions for non-dragged items
  const idToTarget = new Map(); // id -> {x,y,w,h}
  for (const r of layout.rows) {
    if (r.kind !== "grid") continue;
    const arr = virtualByRow.get(r.rowIndex) || [];
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      if (!it.note) continue;
      if (dragState.active && it.note.id === dragState.note?.id) continue; // skip dragged

      const rect = slotRectForIndex(i, r.y, layout.geometry, metrics);
      idToTarget.set(it.note.id, rect);
    }
  }

  // Smoothly move positions toward targets
  const pos = posRef.current;
  const alpha = 0.2;
  for (const [id, target] of idToTarget.entries()) {
    const cur = pos.get(id);
    if (!cur) {
      pos.set(id, { x: target.x, y: target.y });
    } else {
      cur.x += (target.x - cur.x) * alpha;
      cur.y += (target.y - cur.y) * alpha;
    }
  }
  // Drop stale ids
  for (const id of Array.from(pos.keys())) {
    if (!idToTarget.has(id)) pos.delete(id);
  }

  // Draw rows
  for (const r of layout.rows) {
    if (r.y > viewRect.bottom + margin) break;
    if (r.y + r.height < viewRect.top - margin) continue;

    if (r.kind === "separator") {
      drawSeparator(ctx, r, metrics, layout.geometry);
    } else if (r.kind === "grid") {
      const arr = virtualByRow.get(r.rowIndex) || [];

      // Render empty-row plus if row is empty in this virtual projection
      if (arr.length === 0) {
        const rect = slotRectForIndex(0, r.y, layout.geometry, metrics);
        const hovered =
          hoverEmptyRowPlus &&
          hoverEmptyRowPlus.rowIndex === r.rowIndex &&
          rectEquals(hoverEmptyRowPlus.rect, rect);
        drawPlus(ctx, rect, metrics, hovered);
        continue; // nothing else to draw in this row
      }

      // Notes (non-dragged)
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i];
        const note = it.note;
        if (!note || note.id === "__placeholder__") continue;
        if (dragState.active && note.id === dragState.note?.id) continue;

        // Use animated position if available; otherwise fall back to slot rect
        const animated = pos.get(note.id);
        const targetRect =
          animated != null
            ? { x: animated.x, y: animated.y, w: metrics.tile, h: metrics.tile }
            : slotRectForIndex(i, r.y, layout.geometry, metrics);

        drawNote(ctx, targetRect, note?.tone || "yellow", metrics, isEditing);

        // Hover marching ants (only when editing and not dragging)
        if (isEditing && !dragState.active && hoverNoteId === note.id) {
          drawMarchingAnts(ctx, targetRect, metrics.corner, antsOffset, antsCfg);
        }
      }
    }
  }

  // Dragged note ghost
  if (dragState.active && dragState.note) {
    const gx = dragState.pointerX - dragState.offsetX;
    const gy = dragState.pointerY - dragState.offsetY;
    const rect = { x: gx, y: gy, w: metrics.tile, h: metrics.tile };

    // Shadow + slight scale for emphasis
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    const scale = 1.06;
    ctx.scale(scale, scale);
    ctx.translate(-rect.w / 2, -rect.h / 2);

    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    drawNote(
      ctx,
      { x: 0, y: 0, w: rect.w, h: rect.h },
      dragState.note.tone || "yellow",
      metrics,
      false // dragged one not dimmed
    );
    ctx.restore();
  }

  // Bottom add-row plus
  if (layout.plusRow) {
    const hovered =
      hoverPlus && hoverPlus.type === "plus-row" && hoverPlus.rect === layout.plusRow;
    drawPlus(ctx, layout.plusRow, metrics, hovered);
  }
}

function slotRectForIndex(index, rowY, geometry, metrics) {
  const cols = Math.max(
    1,
    Math.floor((geometry.innerWidth + metrics.gutter) / (metrics.tile + metrics.gutter))
  );
  const line = Math.floor(index / cols);
  const col = index % cols;
  const xPad = geometry.contentOffsetX + metrics.contentPadX;
  return {
    x: xPad + col * (metrics.tile + metrics.gutter),
    y: rowY + line * (metrics.tile + metrics.gutter),
    w: metrics.tile,
    h: metrics.tile,
  };
}

function rectEquals(a, b) {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

function drawSeparator(ctx, sep, metrics, geometry) {
  // Label
  ctx.fillStyle = "#6b7280"; // neutral-500
  ctx.fillText(sep.label || "", sep.xLabel, sep.y + 14);

  // Right-side line with a gap near scrollbar
  ctx.strokeStyle = "#d4d4d4"; // neutral-300
  ctx.lineWidth = 1;
  ctx.beginPath();
  const lineStartX = sep.xLabel + 84;
  const lineEndX =
    geometry.contentOffsetX + geometry.contentWidth - metrics.rightGapForScrollbar;
  const lineY = sep.y + 12;
  ctx.moveTo(lineStartX, lineY);
  ctx.lineTo(lineEndX, lineY);
  ctx.stroke();
}

function drawNote(ctx, rect, tone, metrics, dim = false) {
  const [fill, ring] = toneColors(tone);
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, metrics.corner);
  if (dim) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#d1d5db"; // neutral-300 ring when dimmed
    ctx.stroke();
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
}

/**
 * Plus rendering (transparent tile by default):
 * - Unhovered: transparent tile; a circular '+' button centered inside.
 * - Hovered: shaded tile + the same circular '+' button.
 */
function drawPlus(ctx, rect, metrics, hovered) {
  if (hovered) {
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, metrics.corner);
    ctx.fillStyle = metrics.plusHoverTileFill;
    ctx.fill();
    ctx.restore();
  }

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = metrics.plusCircleRadius;

  // Circle outline
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = metrics.plusCircleOutline;
  ctx.lineWidth = metrics.plusCircleStroke;
  ctx.stroke();

  // Plus symbol
  ctx.strokeStyle = metrics.plusCircleColor;
  ctx.lineWidth = metrics.plusIconStroke;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy);
  ctx.lineTo(cx + 8, cy);
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  ctx.restore();
}

/* ========================= Utils ========================= */

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
  // Slightly dimmed palette baseline
  const map = {
    yellow: ["#fde68a", "#f5d35a"],
    sky: ["#b6e0fb", "#74c9f8"],
    emerald: ["#a1f0cc", "#66e3b3"],
    amber: ["#f5cc55", "#e69a0a"],
    rose: ["#f9c6ce", "#f395a2"],
    violet: ["#d8d0fd", "#bdaafc"],
    lime: ["#d4f493", "#b9ee5a"],
  };
  return map[tone] || map.yellow;
}