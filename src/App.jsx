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

/* Services */
import { ConfirmProvider, useConfirm } from "./services/confirmService";
import { useBoardsDomain } from "./domain/boards";
import { createCommandExecutor } from "./services/commandExecutor";
import { buildMenu, prefetchMenu } from "./services/menuRegistry";

export default function App() {
  return (
    <ConfirmProvider>
      <AppInner />
    </ConfirmProvider>
  );
}

function AppInner() {
  // Boards domain (state + pure actions)
  const boards = useBoardsDomain();
  const confirm = useConfirm();

  // Menu overlay state
  const [menus, setMenus] = React.useState([]);
  const zRef = React.useRef(50);

  const executor = React.useMemo(
    () => createCommandExecutor({ boardsDomain: boards, confirm }),
    [boards, confirm]
  );

  // Unique key per menu "component" to prevent duplicates
  const getMenuKey = (kind, extra = {}) => {
    switch (kind) {
      case "board":
        return `board:${extra.boardId ?? "none"}`; // one per board
      case "hello":
        return "hello"; // singleton
      default:
        return String(kind);
    }
  };

  // Keep menus within viewport and slightly away from edges
  const clampPosition = (clientX, clientY) => {
    const margin = 8;
    const estW = 260; // conservative default min width
    const estH = 220; // conservative default height
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    let x = clientX;
    let y = clientY;

    if (x > vw - estW - margin) x = Math.max(margin, vw - estW - margin);
    if (y > vh - estH - margin) y = Math.max(margin, vh - estH - margin);
    if (x < margin) x = margin;
    if (y < margin) y = margin;

    return { x, y };
  };

  // Open menu with de-dup (bring to front and move if already open)
  const openMenu = (kind, clientX, clientY, extra = {}) => {
    const id = uid();
    const z = ++zRef.current;
    const { x, y } = clampPosition(clientX, clientY);
    const key = getMenuKey(kind, extra);

    setMenus((prev) => {
      // Keep only locked menus from previous batch
      const locked = prev.filter((m) => m.locked);

      // Try to find existing menu with the same key (locked or unlocked)
      const all = prev;
      const existing = all.find((m) => m.key === key);
      if (existing) {
        // Update position and z of existing; keep lock state as-is
        return all.map((m) =>
          m.key === key ? { ...m, x, y, z: ++zRef.current } : m
        );
      }

      // Otherwise, create a new one
      return [
        ...locked,
        { id, key, x, y, z, locked: false, kind, extra },
      ];
    });
  };

  const closeMenu = (id) => setMenus((prev) => prev.filter((m) => m.id !== id));
  const closeUnlockedMenus = () => setMenus((prev) => prev.filter((m) => m.locked));

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

  // Theme per menu kind
  const getMenuTheme = (kind) => {
    switch (kind) {
      case "hello":
        return { tone: "neutral", size: "md", density: "regular" };
      case "board":
      default:
        return { tone: "yellow", size: "md", density: "regular" };
    }
  };

  // Prefetch menus and commands before opening
  const prefetchForKind = async (kind) => {
    switch (kind) {
      case "board":
        await Promise.all([prefetchMenu("board"), executor.prefetch(["boards"])]);
        break;
      case "hello":
        await Promise.all([prefetchMenu("hello"), executor.prefetch(["demo"])]);
        break;
      default:
        break;
    }
  };

  // Context menu triggers (hello menu only from canvas area, not Nav)
  const handleCanvasContext = async (e) => {
    e.preventDefault();
    await prefetchForKind("hello");
    openMenu("hello", e.clientX, e.clientY);
  };

  // Board row context menu
  const handleBoardContext = async (e, boardId) => {
    e.preventDefault();
    await prefetchForKind("board");
    openMenu("board", e.clientX, e.clientY, { boardId });
  };

  // Command-driven content
  const renderMenuContent = (m) => {
    const items = buildMenu(m.kind, { extra: m.extra });
    const theme = getMenuTheme(m.kind);

    const handleAction = async (item) => {
      if (item?.type !== "action" || !item.command) return;
      await executor.run(item.command, item.args || {});
      if (item.closeOnRun !== false) closeMenu(m.id);
    };

    return (
      <MenuContent
        items={items}
        onAction={handleAction}
        density={theme.density}
        tone={theme.tone}
      />
    );
  };

  // Close unlocked menus on any outside left/right click via capture listeners
  React.useEffect(() => {
    const isInsideMenuEvent = (e) => {
      // Prefer composedPath for robust hit-testing (SVG, nested elements)
      if (typeof e.composedPath === "function") {
        const path = e.composedPath();
        for (const el of path) {
          if (
            el &&
            el.getAttribute &&
            el.getAttribute("data-menu-window") === "true"
          ) {
            return true;
          }
        }
      }
      const t = e.target;
      return !!(t && typeof t.closest === "function" && t.closest('[data-menu-window="true"]'));
    };

    const onPointerDownCapture = (e) => {
      if (menus.length === 0) return;
      if (isInsideMenuEvent(e)) return; // ignore clicks inside any menu
      // Close only unlocked, allow the event to continue (so a new menu can open)
      setMenus((prev) => prev.filter((m) => m.locked));
    };

    const onContextMenuCapture = (e) => {
      if (menus.length === 0) return;
      if (isInsideMenuEvent(e)) return; // ignore right-clicks inside menu
      setMenus((prev) => prev.filter((m) => m.locked));
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("contextmenu", onContextMenuCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      document.removeEventListener("contextmenu", onContextMenuCapture, true);
    };
  }, [menus.length]);

  return (
    <div className="h-screen w-screen bg-white text-neutral-800">
      <div className="flex h-full">
        {/* LEFT PANE */}
        <LeftPane>
          <ShortcutIsland />
          <BoardsStorage
            boards={boards.boards}
            selectedId={boards.selectedId}
            editingId={boards.editingId}
            onCreateBoard={boards.createBoard}
            onCommitCreateName={boards.commitCreateName}
            onOpenBoard={boards.openBoard}
            onBoardContextMenu={handleBoardContext}
          />
        </LeftPane>

        {/* RIGHT PANE */}
        <RightPane>
          <Nav title={boards.selectedBoard ? boards.selectedBoard.name : ""} />
          <BoardView
            board={boards.selectedBoard}
            onAddNoteToRow={(i) =>
              boards.selectedBoard && boards.addNoteToRow(boards.selectedBoard.id, i)
            }
            onAddRow={() => boards.selectedBoard && boards.addNewRow(boards.selectedBoard.id)}
            onContextMenu={handleCanvasContext} // only canvas area opens hello menu
          />
        </RightPane>
      </div>

      {/* Global menu overlay (high z-index so never "behind") */}
      <div className="pointer-events-none fixed inset-0 z-[1000]">
        {menus.map((m) => {
          const theme = getMenuTheme(m.kind);
          return (
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
              tone={theme.tone}
              size={theme.size}
              density={theme.density}
            >
              {renderMenuContent(m)}
            </MenuWindow>
          );
        })}
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