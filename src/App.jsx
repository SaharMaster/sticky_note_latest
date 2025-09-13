import React from "react";

function App() {
  const [boards, setBoards] = React.useState([
    { id: "b-1", name: "Personal" },
    { id: "b-2", name: "Team Roadmap" },
    { id: "b-3", name: "Q4 Planning" },
  ]);
  const [selectedBoardId, setSelectedBoardId] = React.useState(boards[0].id);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  function handleCreateBoard() {
    const name = prompt("Board name?");
    if (!name) return;
    const id = crypto.randomUUID();
    const next = { id, name };
    setBoards((prev) => [...prev, next]);
    setSelectedBoardId(id);
  }

  return (
    <div className="h-dvh w-dvw flex bg-neutral-50 text-slate-800">
      {/* Left: Control Panel */}
      <aside className="w-72 shrink-0 border-r border-yellow-300/70 bg-white/90 backdrop-blur-sm flex flex-col">
        <div className="px-4 py-3 border-b border-neutral-200/80">
          <h1 className="text-sm font-semibold tracking-wide text-neutral-700">
            Control Panel
          </h1>
        </div>

        <div className="p-3 flex flex-col gap-3 overflow-hidden h-full">
          {/* Shortcut Island (square) */}
          <ShortcutIsland
            onCreateBoard={handleCreateBoard}
            onOpenBoard={() => {
              if (boards.length) setSelectedBoardId(boards[0].id);
            }}
          />

          {/* Boards view (fills remaining space) */}
          <BoardsView
            boards={boards}
            selectedBoardId={selectedBoardId}
            onSelectBoard={setSelectedBoardId}
          />
        </div>
      </aside>

      {/* Right: Board View */}
      <main className="flex-1">
        <BoardView board={selectedBoard} />
      </main>
    </div>
  );
}

/* ---------------------------- Control Panel ---------------------------- */

function ShortcutIsland({ onCreateBoard, onOpenBoard }) {
  return (
    <section
      aria-label="Shortcut Island"
      className="aspect-square rounded-lg border-4 border-amber-300 bg-amber-50/70 p-3"
    >
      <div className="h-full w-full rounded-md bg-white/60 ring-1 ring-amber-200 p-3 grid grid-cols-2 gap-2">
        <ShortcutButton label="New Board" onClick={onCreateBoard} />
        <ShortcutButton label="Open First" onClick={onOpenBoard} />
        <ShortcutButton label="Today" />
        <ShortcutButton label="Templates" />
      </div>
    </section>
  );
}

function ShortcutButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-md bg-amber-100 text-amber-900 text-xs font-medium hover:bg-amber-200 transition-colors"
    >
      {label}
    </button>
  );
}

function BoardsView({ boards, selectedBoardId, onSelectBoard }) {
  const [q, setQ] = React.useState("");

  const filtered = boards.filter((b) =>
    b.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section
      aria-label="Boards"
      className="flex-1 min-h-0 rounded-lg border border-neutral-200 bg-white/80 flex flex-col"
    >
      <header className="p-3 border-b border-neutral-200">
        <p className="text-xs font-semibold text-neutral-600">Boards</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search boards…"
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
      </header>

      <ul className="flex-1 overflow-auto p-2">
        {filtered.length === 0 ? (
          <li className="text-xs text-neutral-500 px-2 py-3">
            No boards found.
          </li>
        ) : (
          filtered.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => onSelectBoard(b.id)}
                className={[
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  b.id === selectedBoardId
                    ? "bg-amber-100 text-amber-900"
                    : "hover:bg-neutral-100",
                ].join(" ")}
              >
                {b.name}
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

/* ------------------------------ Board Area ----------------------------- */

function BoardView({ board }) {
  return (
    <div className="h-full flex flex-col">
      {/* Top bar mimicking the reference separators/controls */}
      <div className="px-6 py-3 border-b border-neutral-300 flex items-center justify-between bg-white sticky top-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm text-neutral-500">Text placeholder</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-neutral-300 inline-block" />
          <span className="size-3 rounded-full bg-neutral-300 inline-block" />
          <span className="size-3 rounded-full bg-neutral-300 inline-block" />
        </div>
      </div>

      <div className="px-6 border-b border-neutral-300">
        <p className="text-xs text-neutral-500 py-2">Separator placeholder</p>
      </div>

      {/* Empty board canvas */}
      <div className="flex-1 bg-white">
        <div className="h-full w-full grid place-items-center text-neutral-300">
          <div className="text-center">
            <p className="text-sm">Board view</p>
            <p className="text-xs">This area is intentionally empty for now.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;