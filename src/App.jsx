import React from "react";

import LeftPane from "./components/LeftPane/LeftPane";
import ShortcutIsland from "./components/LeftPane/ShortcutIsland";
import BoardsStorage from "./components/LeftPane/BoardsStorage";

import RightPane from "./components/RightPane/RightPane";
import Nav from "./components/RightPane/Nav";
import BoardView from "./components/RightPane/BoardView";

/**
 * App (state + composition)
 * - Manages boards, selection, and create/insert actions
 * - All UI pieces are split into focused, reusable components
 */

export default function App() {
  const [boards, setBoards] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null); // only during creation

  // Helpers
  const createNote = () => {
    const tones = ["yellow", "sky", "emerald", "amber", "rose", "violet", "lime"];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    return { id: uid(), tone };
  };

  const createBoard = () => {
    const b = { id: uid(), name: "New board", rows: [[createNote()]] };
    setBoards((prev) => [...prev, b]);
    setSelectedId(b.id);
    setEditingId(b.id); // inline naming only right after creation
  };

  const commitCreateName = (id, name) => {
    const finalName = (name || "").trim() || "Untitled";
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name: finalName } : b)));
    setEditingId(null);
  };

  const openBoard = (id) => setSelectedId(id);

  const addNoteToRow = (boardId, rowIdx) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id !== boardId
          ? b
          : { ...b, rows: b.rows.map((r, i) => (i === rowIdx ? [...r, createNote()] : r)) }
      )
    );
  };

  const addNewRow = (boardId) => {
    setBoards((prev) =>
      prev.map((b) => (b.id !== boardId ? b : { ...b, rows: [...b.rows, [createNote()]] }))
    );
  };

  const selectedBoard = boards.find((b) => b.id === selectedId) || null;

  return (
    <div className="h-screen w-screen bg-white text-neutral-800">
      <div className="flex h-full">
        {/* LEFT PANE */}
        <LeftPane>
          <ShortcutIsland />
          <BoardsStorage
            boards={boards}
            selectedId={selectedId}
            editingId={editingId}
            onCreateBoard={createBoard}
            onCommitCreateName={commitCreateName}
            onOpenBoard={openBoard}
          />
        </LeftPane>

        {/* RIGHT PANE */}
        <RightPane>
          <Nav title={selectedBoard ? selectedBoard.name : ""} />
          <BoardView
            board={selectedBoard}
            onAddNoteToRow={(i) => selectedBoard && addNoteToRow(selectedBoard.id, i)}
            onAddRow={() => selectedBoard && addNewRow(selectedBoard.id)}
          />
        </RightPane>
      </div>
    </div>
  );
}

/* --- Utils --- */
function uid() {
  const a = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(a);
    return `${a[0].toString(16)}${a[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}