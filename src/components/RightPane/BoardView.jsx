import React from "react";
import BoardCanvas from "./BoardCanvas";

/**
 * BoardView
 * - Owns the scroll container
 * - Uses the shared custom scrollbar utility
 */

export default function BoardView({ board, onAddNoteToRow, onAddRow }) {
  return (
    <div className="relative flex-1 overflow-auto scrollbar-yellow">
      {board ? (
        <BoardCanvas board={board} onAddNoteToRow={onAddNoteToRow} onAddRow={onAddRow} />
      ) : null}
    </div>
  );
}