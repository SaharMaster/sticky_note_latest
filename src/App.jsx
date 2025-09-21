import React from "react";

import LeftPane from "./components/LeftPane/LeftPane";
import ShortcutIsland from "./components/LeftPane/ShortcutIsland";
import BoardsStorage from "./components/LeftPane/BoardsStorage";

import RightPane from "./components/RightPane/RightPane";
import Nav from "./components/RightPane/Nav";
import BoardView from "./components/RightPane/BoardView";

/* Menu system */
import MenuWindow from "./components/Menu/MenuWindow";
import MenuContent from "./components/Menu/MenuContent";
import ConfirmBox from "./components/Menu/ConfirmBox";

export default function App() {
  const [boards, setBoards] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);

  // Global menu layer
  const [menus, setMenus] = React.useState([]);
  const zRef = React.useRef(50);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);

  const createNote = () => {
    const tones = ["yellow", "sky", "emerald", "amber", "rose", "violet", "lime"];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    return { id: uid(), tone };
  };

  const createBoard = () => {
    const b = { id: uid(), name: "New board", rows: [[createNote()]] };
    setBoards((prev) => [...prev, b]);
    setSelectedId(b.id);
    setEditingId(b.id);
  };

  const commitCreateName = (id, name) => {
    const finalName = (name || "").trim() || "Untitled";
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name: finalName } : b)));
    setEditingId(null);
  };

  const startRenameBoard = (id) => setEditingId(id);
  const deleteBoard = (id) => {
    setBoards((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
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

  /* -------- Global Menu actions -------- */

  const openMenu = (kind, clientX, clientY, extra = {}) => {
    const id = uid();
    const z = ++zRef.current;
    // Keep only locked menus; replace the rest
    setMenus((prev) => {
      const locked = prev.filter((m) => m.locked);
      return [...locked, { id, x: clientX, y: clientY, z, locked: false, kind, extra }];
    });
  };

  const closeMenu = (id) => setMenus((prev) => prev.filter((m) => m.id !== id));
  const toggleLock = (id) =>
    setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m)));
  const onDragTo = (id, { clientX, clientY, offsetX, offsetY }) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, x: clientX - offsetX, y: clientY - offsetY } : m))
    );
  };
  const bringToFront = (id) => {
    const z = ++zRef.current;
    setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, z } : m)));
  };

  // Context menu triggers
  const handleRightPaneContext = (e) => {
    e.preventDefault();
    openMenu("hello", e.clientX, e.clientY);
  };
  const handleBoardContext = (e, boardId) => {
    e.preventDefault();
    openMenu("board", e.clientX, e.clientY, { boardId });
  };

  // Delete confirmation
  const askDeleteBoard = (boardId) => setConfirmDeleteId(boardId);
  const confirmYes = () => {
    if (confirmDeleteId) deleteBoard(confirmDeleteId);
    setConfirmDeleteId(null);
    setMenus((prev) => prev.filter((m) => m.locked));
  };
  const confirmNo = () => setConfirmDeleteId(null);

  // Menu schemas
  const helloItems = [
    { type: "action", label: "Regular parameter", onClick: () => {} },
    { type: "toggle", label: "Enabled/disabled parameter" },
    {
      type: "submenu",
      label: "Submenu parameter",
      items: [
        { type: "action", label: "Parameter", onClick: () => {} },
        { type: "action", label: "Parameter", onClick: () => {} },
        { type: "action", label: "Parameter", onClick: () => {} },
      ],
    },
    { type: "separator" },
  ];

  const renderMenuContent = (m) => {
    if (m.kind === "hello") return <MenuContent items={helloItems} />;

    if (m.kind === "board") {
      const id = m.extra.boardId;
      const items = [
        {
          type: "action",
          label: "Rename board",
          onClick: () => {
            startRenameBoard(id);
            closeMenu(m.id);
          },
        },
        {
          type: "action",
          label: "Delete board",
          danger: true,
          onClick: () => {
            askDeleteBoard(id);
            closeMenu(m.id);
          },
        },
      ];
      return <MenuContent items={items} />;
    }
    return null;
  };

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
            onBoardContextMenu={handleBoardContext}
          />
        </LeftPane>

        {/* RIGHT PANE */}
        <RightPane onContextMenu={handleRightPaneContext}>
          <Nav title={selectedBoard ? selectedBoard.name : ""} />
          <BoardView
            board={selectedBoard}
            onAddNoteToRow={(i) => selectedBoard && addNoteToRow(selectedBoard.id, i)}
            onAddRow={() => selectedBoard && addNewRow(selectedBoard.id)}
          />
        </RightPane>
      </div>

      {/* Global menu overlay */}
      <div className="pointer-events-none fixed inset-0">
        {menus.map((m) => (
          <MenuWindow
            key={m.id}
            id={m.id}
            x={m.x}
            y={m.y}
            z={m.z}
            locked={m.locked}
            onClose={() => closeMenu(m.id)}
            onToggleLock={() => toggleLock(m.id)}
            onDragTo={(payload) => onDragTo(m.id, payload)}
            onFocus={() => bringToFront(m.id)}
          >
            {renderMenuContent(m)}
          </MenuWindow>
        ))}
      </div>

      {confirmDeleteId && (
        <ConfirmBox text="Are you sure?" onYes={confirmYes} onNo={confirmNo} />
      )}
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