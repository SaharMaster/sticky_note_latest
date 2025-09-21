import React from "react";
import StickyNote from "./StickyNote";
import HorizontalSeparator from "./HorizontalSeparator";

/**
 * BoardCanvas
 * - Renders rows as responsive grids, so notes wrap onto new lines
 *   within the same row group (sharing one separator).
 * - Keeps the plus bubble as a grid item at the end.
 */

export default function BoardCanvas({ board, onAddNoteToRow, onAddRow }) {
  const sepLabel = (i) => (i === 0 ? "New" : i === 1 ? "Second block" : "Next block");

  // Shared hover/focus styles for the parent “tile” that contains the plus bubble
  const plusTileClass =
    "relative grid place-items-center rounded-md transition " +
    "[&:has(button:hover)]:bg-neutral-100 " +
    "[&:has(button:focus-visible)]:bg-neutral-100 ";

  // Grid: fixed 180px columns, auto-wrap; gap matches previous spacing
  const gridClass =
    "mb-6 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,180px))]";

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-16">
      {board.rows.map((row, i) => (
        <React.Fragment key={`row-${i}`}>
          <HorizontalSeparator label={sepLabel(i)} />

          {/* Row group as a grid; notes will wrap to new lines within the same group */}
          <div className={gridClass}>
            {row.map((n) => (
              <StickyNote key={n.id} tone={n.tone} />
            ))}

            {/* Plus tile participates in the grid; moves to next line as needed */}
            <div className={`${plusTileClass} w-full`} style={{ aspectRatio: "1 / 1" }}>
              <PlusButton onClick={() => onAddNoteToRow(i)} />
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* Trailing separator and the bottom plus bubble to create a new row */}
      <HorizontalSeparator label={sepLabel(board.rows.length)} />
      <div className={`${plusTileClass} w-[180px] h-[180px]`}>
        <PlusButton onClick={onAddRow} title="Add row" />
      </div>
    </div>
  );
}

function PlusButton({ onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-full
                 bg-neutral-200 text-neutral-700 transition
                 hover:bg-neutral-300 hover:ring-1 ring-neutral-400
                 focus:outline-none"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}