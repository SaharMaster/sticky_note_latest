import React from "react";
import BoardCanvas from "./BoardCanvas";

/**
 * BoardView
 * - Owns the scroll container (for width + scroll culling)
 * - Hosts the canvas renderer
 * - Forwards onContextMenu to BoardCanvas so right-click opens the demo menu over canvas
 */
export default function BoardView({ board, onAddNoteToRow, onAddRow, onContextMenu }) {
  const scrollRef = React.useRef(null);

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-auto scrollbar-yellow"
      onContextMenu={onContextMenu}
    >
      <BoardCanvas
        board={board}
        onAddNoteToRow={onAddNoteToRow}
        onAddRow={onAddRow}
        scrollEl={scrollRef}
        onContextMenu={onContextMenu} // forward handler so canvas can invoke it directly
      />
    </div>
  );
}