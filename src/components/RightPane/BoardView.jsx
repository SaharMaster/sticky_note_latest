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
  onAddNoteToRow,           // add note into a specific row
  onSectionContextMenu,
  onSeparatorContextMenu,   // new: separator menu opener
  onMoveWithinRow,
  onMoveBetweenRows,
  // inline rename wiring
  renamingSection = null,   // { rowIdx, name } | null
  onCommitSectionName,      // (rowIdx, newName)
  onCancelSectionRename,    // () => void
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
        onSeparatorContextMenu={onSeparatorContextMenu}
        onMoveWithinRow={onMoveWithinRow}
        onMoveBetweenRows={onMoveBetweenRows}
        renamingSection={renamingSection}
        onCommitSectionName={onCommitSectionName}
        onCancelSectionRename={onCancelSectionRename}
      />
    </div>
  );
}