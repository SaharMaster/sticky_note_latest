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
  const boards = useBoardsDomain();
  const confirm = useConfirm();

  // Board-wide edit mode: Set of boardIds that are in edit mode
  const [boardEditSet, setBoardEditSet] = React.useState(() => new Set());

  const isBoardEditing = React.useCallback(
    (boardId) => boardEditSet.has(boardId),
    [boardEditSet]
  );

  // "ui.section.toggleEdit" toggles board-wide edit mode
  const toggleSectionEdit = React.useCallback((boardId, _rowIdx) => {
    setBoardEditSet((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }, []);

  const executor = React.useMemo(
    () =>
      createCommandExecutor({
        boardsDomain: boards,
        confirm,
        ui: {
          isSectionEditing: (_boardId, _rowIdx) => isBoardEditing(_boardId),
          toggleSectionEdit,
        },
      }),
    [boards, confirm, isBoardEditing, toggleSectionEdit]
  );

  // Menus overlay
  const [menus, setMenus] = React.useState([]);
  const zRef = React.useRef(50);

  const getMenuKey = (kind, extra = {}) => {
    switch (kind) {
      case "board":
        return `board:${extra.boardId ?? "none"}`;
      case "section":
        return `section:${extra.boardId ?? "none"}`;
      default:
        return String(kind);
    }
  };

  const clampPosition = (clientX, clientY) => {
    const margin = 8;
    const estW = 260;
    const estH = 220;
    const vw =
      window.innerWidth || document.documentElement.clientWidth || 0;
    const vh =
      window.innerHeight || document.documentElement.clientHeight || 0;

    let x = clientX;
    let y = clientY;

    if (x > vw - estW - margin)
      x = Math.max(margin, vw - estW - margin);
    if (y > vh - estH - margin)
      y = Math.max(margin, vh - estH - margin);
    if (x < margin) x = margin;
    if (y < margin) y = margin;

    return { x, y };
  };

  const openMenu = (kind, clientX, clientY, extra = {}) => {
    const id = uid();
    const z = ++zRef.current;
    const { x, y } = clampPosition(clientX, clientY);
    const key = getMenuKey(kind, extra);

    setMenus((prev) => {
      const locked = prev.filter((m) => m.locked);
      const all = prev;
      const existing = all.find((m) => m.key === key);
      if (existing) {
        return all.map((m) =>
          m.key === key ? { ...m, x, y, z: ++zRef.current } : m
        );
      }
      return [...locked, { id, key, x, y, z, locked: false, kind, extra }];
    });
  };

  const closeMenu = (id) =>
    setMenus((prev) => prev.filter((m) => m.id !== id));
  const toggleLock = (id) =>
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
    );
  const onDragTo = (id, { clientX, clientY, offsetX, offsetY }) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, x: clientX - offsetX, y: clientY - offsetY }
          : m
      )
    );
  };
  const bringToFront = (id) => {
    const z = ++zRef.current;
    setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, z } : m)));
  };

  const getMenuTheme = (kind) => {
    switch (kind) {
      case "board":
      case "section":
      default:
        return { tone: "yellow", size: "md", density: "regular" };
    }
  };

  const prefetchForKind = async (kind) => {
    switch (kind) {
      case "board":
        await Promise.all([
          prefetchMenu("board"),
          executor.prefetch(["boards"]),
        ]);
        break;
      case "section":
        await Promise.all([
          prefetchMenu("section"),
          executor.prefetch(["boards", "ui"]),
        ]);
        break;
      default:
        break;
    }
  };

  // Section menu opener (used by BoardCanvas)
  const handleSectionContext = async (e, boardId, rowIdx) => {
    e.preventDefault?.();
    await prefetchForKind("section");
    openMenu("section", e.clientX, e.clientY, { boardId, rowIdx });
  };

  React.useEffect(() => {
    const isInsideMenuEvent = (e) => {
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
      return !!(
        t &&
        typeof t.closest === "function" &&
        t.closest('[data-menu-window="true"]')
      );
    };

    const onPointerDownCapture = (e) => {
      if (menus.length === 0) return;
      if (isInsideMenuEvent(e)) return;
      setMenus((prev) => prev.filter((m) => m.locked));
    };

    const onContextMenuCapture = (e) => {
      if (menus.length === 0) return;
      if (isInsideMenuEvent(e)) return;
      setMenus((prev) => prev.filter((m) => m.locked));
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("contextmenu", onContextMenuCapture, true);
    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDownCapture,
        true
      );
      document.removeEventListener(
        "contextmenu",
        onContextMenuCapture,
        true
      );
    };
  }, [menus.length]);

  const selectedBoard = boards.selectedBoard;
  const isEditing =
    !!selectedBoard && isBoardEditing(selectedBoard.id);

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
            onBoardContextMenu={(e, id) => {
              e.preventDefault?.();
              prefetchForKind("board").then(() =>
                openMenu("board", e.clientX, e.clientY, { boardId: id })
              );
            }}
          />
        </LeftPane>

        {/* RIGHT PANE */}
        <RightPane>
          <Nav title={selectedBoard ? selectedBoard.name : ""} />
          <BoardView
            board={selectedBoard}
            isEditing={isEditing}
            onAddRow={() =>
              selectedBoard && boards.addNewRow(selectedBoard.id)
            }
            onAddNoteToRow={(rowIdx) =>
              selectedBoard && boards.addNoteToRow(selectedBoard.id, rowIdx)
            }
            onSectionContextMenu={(e, rowIdx) =>
              selectedBoard &&
              handleSectionContext(e, selectedBoard.id, rowIdx)
            }
            onMoveWithinRow={(sectionIndex, fromIndex, toIndex) =>
              selectedBoard &&
              boards.moveNoteWithinRow(
                selectedBoard.id,
                sectionIndex,
                fromIndex,
                toIndex
              )
            }
            onMoveBetweenRows={(fromSection, fromIndex, toSection, toIndex) =>
              selectedBoard &&
              boards.moveNoteBetweenRows(
                selectedBoard.id,
                fromSection,
                fromIndex,
                toSection,
                toIndex
              )
            }
            />
        </RightPane>
      </div>

      {/* Global menu overlay */}
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
              <MenuContent
                items={buildMenu(m.kind, {
                  extra: m.extra,
                  state:
                    m.kind === "section" && m.extra?.boardId != null
                      ? { editing: isBoardEditing(m.extra.boardId) }
                      : undefined,
                })}
                onAction={async (item) => {
                  if (item?.type !== "action" || !item.command) return;
                  await executor.run(item.command, item.args || {});
                  if (item.closeOnRun !== false) closeMenu(m.id);
                }}
                onToggle={async (item) => {
                  if (!item?.command) return;
                  await executor.run(item.command, item.args || {});
                  if (item.closeOnRun === true) closeMenu(m.id);
                }}
                density={theme.density}
                tone={theme.tone}
              />
            </MenuWindow>
          );
        })}
      </div>
    </div>
  );
}

function uid() {
  const a = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(a);
    return `${a[0].toString(16)}${a[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}