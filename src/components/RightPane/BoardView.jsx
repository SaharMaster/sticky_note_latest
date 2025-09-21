import React from "react";
import BoardCanvas from "./BoardCanvas";

/**
 * BoardView
 * - Owns the scroll container
 * - Shows a centered hint when no board is selected
 * - Uses the shared custom scrollbar utility
 */

export default function BoardView({ board, onAddNoteToRow, onAddRow }) {
  return (
    <div className="relative flex-1 overflow-auto scrollbar-yellow">
      {board ? (
        <BoardCanvas board={board} onAddNoteToRow={onAddNoteToRow} onAddRow={onAddRow} />
      ) : (
        <div className="grid h-full place-items-center px-6 pb-16">
          <p className="text-sm text-neutral-500">
            Create new board or select an existing one
          </p>
        </div>
      )}
    </div>
  );
}