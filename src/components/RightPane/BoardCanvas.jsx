// src/components/RightPane/BoardCanvas.jsx
import React from "react";
import { computeBoardLayout, hitTestLayout } from "../../graphics/layout/boardLayout";

/**
 * BoardCanvas (Canvas host) — plus button redesign + context menu forwarding
 *
 * - Notes: dimmed colors, rounded squares (drawn on canvas).
 * - Separators: extra spacing; right-side line gap (doesn't touch scrollbar).
 * - Plus buttons:
 *    • Default: transparent tile; a circular '+' button centered inside.
 *    • Hovered: tile shades light grey; circular '+' remains visible.
 *    • Click: adds a note (or a row for the bottom plus). Layout shifts plus naturally.
 * - Context menu:
 *    • The canvas intercepts right-click (preventDefault) and forwards the event
 *      to the provided onContextMenu prop so your demo menu opens over canvas.
 */

export default function BoardCanvas({
  board,
  onAddNoteToRow,
  onAddRow,
  scrollEl,
  onContextMenu, // <- forward menu open here
}) {
  const canvasRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  // Hover state for plus tiles only
  // { type: "plus-note" | "plus-row", rect } | null
  const [hoverPlus, setHoverPlus] = React.useState(null);

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

  // Draw
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = Math.max(1, containerWidth);
    const cssH = Math.max(1, layout.totalHeight);

    if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
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

    drawBoard(ctx, layout, metrics, viewRect, hoverPlus);

    ctx.restore();
  }, [layout, metrics, hoverPlus, scrollTop, containerWidth, scrollEl]);

  // Helpers
  const toLocal = React.useCallback((evt) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }, []);

  // Interactions
  const onMouseMove = React.useCallback(
    (evt) => {
      const { x, y } = toLocal(evt);
      const hit = hitTestLayout(layout, x, y);

      if (!hit) {
        if (hoverPlus) setHoverPlus(null);
        return;
      }
      if (hit.type === "plus-note") {
        const cur = hoverPlus;
        if (!cur || cur.type !== "plus-note" || cur.rect !== hit.rect) {
          setHoverPlus({ type: "plus-note", rect: hit.rect });
        }
      } else if (hit.type === "plus-row") {
        const cur = hoverPlus;
        if (!cur || cur.type !== "plus-row" || cur.rect !== hit.rect) {
          setHoverPlus({ type: "plus-row", rect: hit.rect });
        }
      } else {
        if (hoverPlus) setHoverPlus(null);
      }
    },
    [layout, hoverPlus, toLocal]
  );

  const onMouseLeave = React.useCallback(() => {
    if (hoverPlus) setHoverPlus(null);
  }, [hoverPlus]);

  const onClick = React.useCallback(
    (evt) => {
      const { x, y } = toLocal(evt);
      const hit = hitTestLayout(layout, x, y);
      if (!hit) return;

      if (hit.type === "plus-note") {
        onAddNoteToRow?.(hit.rowIndex);
      } else if (hit.type === "plus-row") {
        onAddRow?.();
      }
    },
    [layout, toLocal, onAddNoteToRow, onAddRow]
  );

  // Context menu: suppress native and forward to parent handler so the demo menu opens
  const onCanvasContextMenu = React.useCallback(
    (e) => {
      e.preventDefault(); // stop native browser menu
      e.stopPropagation(); // don't duplicate handling at the parent
      onContextMenu?.(e); // forward to App's handler (opens "hello" menu)
    },
    [onContextMenu]
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onContextMenu={onCanvasContextMenu}
    />
  );
}

/* ========================= Drawing ========================= */

function drawBoard(ctx, layout, metrics, viewRect, hoverPlus) {
  if (!layout) return;

  const margin = 200; // small extra range for smooth scrolling
  ctx.font = metrics.labelFont;
  ctx.textBaseline = "alphabetic";

  for (const r of layout.rows) {
    if (r.y > viewRect.bottom + margin) break;
    if (r.y + r.height < viewRect.top - margin) continue;

    if (r.kind === "separator") {
      drawSeparator(ctx, r, metrics, layout.geometry);
    } else if (r.kind === "grid") {
      // Notes
      for (const it of r.items) {
        drawNote(ctx, it.rect, it.note?.tone || "yellow", metrics);
      }

      // Row plus (transparent by default, shaded on hover)
      const hovered =
        hoverPlus && hoverPlus.type === "plus-note" && hoverPlus.rect === r.plusRect;
      drawPlus(ctx, r.plusRect, metrics, hovered);
    }
  }

  // Bottom add-row plus
  if (layout.plusRow) {
    const hovered =
      hoverPlus && hoverPlus.type === "plus-row" && hoverPlus.rect === layout.plusRow;
    drawPlus(ctx, layout.plusRow, metrics, hovered);
  }
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
  const lineEndX = geometry.contentOffsetX + geometry.contentWidth - metrics.rightGapForScrollbar;
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
  // Slightly dimmed for a calmer UI
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