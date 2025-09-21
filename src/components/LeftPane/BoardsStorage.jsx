import React from "react";
import Board from "./Board";

/**
 * BoardsStorage
 * - Title with subtle separator
 * - Scrollable list with custom scrollbar
 * - Integrated bottom "New board" action (rounded + inner shadow)
 */

export default function BoardsStorage({
  boards,
  selectedId,
  editingId,
  onCreateBoard,
  onCommitCreateName,
  onOpenBoard,
  onBoardContextMenu, // NEW
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5">
      <div className="px-3 pt-2">
        <h2 className="text-sm font-medium text-neutral-700">Boards</h2>
      </div>

      {/* Separator bar under the title */}
      <div className="mx-2 mt-2 h-px bg-neutral-200" />

      {/* Scroll area with custom scrollbar */}
      <div className="flex-1 overflow-auto px-3 pb-3 scrollbar-yellow">
        <div className="space-y-2 my-2">
          {boards.map((b) => (
            <Board
              key={b.id}
              active={b.id === selectedId}
              isNew={b.id === editingId}
              isEditing={b.id === editingId}
              defaultName={b.name}
              onActivate={() => onOpenBoard(b.id)}
              onFinish={(name) => onCommitCreateName(b.id, name)}
              onContextMenu={(e) => onBoardContextMenu?.(e, b.id)}
            />
          ))}
        </div>
      </div>

      {/* Integrated bottom action */}
      <button
        onClick={onCreateBoard}
        className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-b-md bg-yellow-100 text-sm font-medium text-yellow-900 shadow-inner transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        <PlusIcon />
        New board
      </button>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}