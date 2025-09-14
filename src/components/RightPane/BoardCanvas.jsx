import React from "react";
import StickyNote from "./StickyNote";
import HorizontalSeparator from "./HorizontalSeparator";

/**
 * BoardCanvas
 * - Renders rows, sticky notes, and controls to add notes/rows
 * - Plus controls share the same design: no borders, white bg → hover grey
 */

export default function BoardCanvas({ board, onAddNoteToRow, onAddRow }) {
  const sepLabel = (i) => (i === 0 ? "New" : i === 1 ? "Second block" : "Next block");

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-16">
      {board.rows.map((row, i) => (
        <React.Fragment key={`row-${i}`}>
          <HorizontalSeparator label={sepLabel(i)} />
          <div className="mb-6 flex flex-wrap items-start gap-4">
            {row.map((n) => (
              <StickyNote key={n.id} tone={n.tone} />
            ))}

            {/* Plus "tile" for adding a note in this row:
                occupies the next slot and centers the bubble */}
            <div
              className="grid w-[180px] place-items-center"
              style={{ aspectRatio: "1 / 1" }}
            >
              <PlusButton onClick={() => onAddNoteToRow(i)} />
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* Trailing separator and the bottom plus bubble to create a new row */}
      <HorizontalSeparator label={sepLabel(board.rows.length)} />
      <div className="peer grid w-[180px] h-[180px] place-items-center">
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
      className="peer-hover:bg-neutral-300 inline-flex size-9 items-center justify-center rounded-full bg-neutral-200 hover:ring-1 ring-neutral-400 text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-300 focus:outline-none"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}