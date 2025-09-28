import React from "react";
import BoardCanvas from "./BoardCanvas";

/**
 * BoardView
 * - Owns the scroll container (for width + scroll culling)
 * - Hosts the canvas renderer
 * - Right-click opens section menu via onSectionContextMenu
 */
export default function BoardView({
  board,
  isEditing = false,
  onAddRow,
  onAddNoteToRow,       // NEW: add note into a specific row
  onSectionContextMenu,
  onMoveWithinRow,
  onMoveBetweenRows,
}) {
  const scrollRef = React.useRef(null);

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-auto scrollbar-yellow"
    >
      <BoardCanvas
        board={board}
        isEditing={isEditing}
        onAddRow={onAddRow}
        onAddNoteToRow={onAddNoteToRow}
        scrollEl={scrollRef}
        onSectionContextMenu={onSectionContextMenu}
        onMoveWithinRow={onMoveWithinRow}
        onMoveBetweenRows={onMoveBetweenRows}
      />
    </div>
  );
}