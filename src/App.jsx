import React from "react";

/**
 * Planning App — UX tweaks (single file).
 * - Boards storage: integrated bottom action "New board" (full width, feels like part of the pane)
 * - New board: inline naming only at creation time (preselected), no renaming afterwards
 * - Clicking a board opens it in the board view
 * - Removed gray divider under "Boards" title
 * - Removed decorative yellow rail; native scrollbar appears only when needed
 * - Board canvas: Separator("New") → row 0 (+ to add notes into row)
 *                 trailing Separator("Second block")
 *                 bottom plus → adds a new row with one note,
 *                 subsequent trailing separators named "Next block"
 */

export default function App() {
  const [boards, setBoards] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null); // used only right after create

  // Note factory
  const createNote = () => {
    const tones = ["yellow", "sky", "emerald", "amber", "rose", "violet", "lime"];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    return { id: rid(), day: "10", month: "April", tone };
  };

  // Create a new board and immediately start inline naming
  const createBoard = () => {
    const b = {
      id: rid(),
      name: "New board",
      rows: [[createNote()]], // first row with one note
    };
    setBoards((prev) => [...prev, b]);
    setSelectedId(b.id);
    setEditingId(b.id); // enable inline naming only once
  };

  // Commit name typed during creation
  const commitCreateName = (id, name) => {
    const finalName = (name || "").trim() || "Untitled";
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name: finalName } : b)));
    setEditingId(null);
  };

  const openBoard = (id) => setSelectedId(id);

  const addNoteToRow = (boardId, rowIndex) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id !== boardId
          ? b
          : { ...b, rows: b.rows.map((row, i) => (i === rowIndex ? [...row, createNote()] : row)) }
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
        {/* LEFT: Controls Pane */}
        <ControlsPane>
          <ShortcutIsland />
          <BoardsStorage
            boards={boards}
            selectedId={selectedId}
            editingId={editingId}
            onCreateBoard={createBoard}
            onCommitCreateName={commitCreateName}
            onOpenBoard={openBoard}
          />
        </ControlsPane>

        {/* RIGHT: Board View */}
        <BoardView
          board={selectedBoard}
          onAddNoteToRow={(rowIdx) => selectedBoard && addNoteToRow(selectedBoard.id, rowIdx)}
          onAddRow={() => selectedBoard && addNewRow(selectedBoard.id)}
        />
      </div>
    </div>
  );
}

/* ---------------------- Left Side ---------------------- */

function ControlsPane({ children }) {
  return (
    <aside className="relative h-full w-[260px] shrink-0 bg-yellow-300/80">
      <div className="flex h-full flex-col gap-3 p-3">{children}</div>
    </aside>
  );
}

function ShortcutIsland() {
  return (
    <section
      aria-label="Shortcut island"
      className="w-full rounded-md bg-white shadow-sm ring-1 ring-black/5"
      style={{ aspectRatio: "1 / 1" }}
    />
  );
}

function BoardsStorage({
  boards,
  selectedId,
  editingId,
  onCreateBoard,
  onCommitCreateName,
  onOpenBoard,
}) {
  return (
    <section className="min-h-0 flex-1 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5">
      {/* Header without gray underline */}
      <div className="px-3 py-2">
        <h2 className="text-sm font-medium text-neutral-700">Boards</h2>
      </div>

      {/* List + integrated footer button at the very bottom */}
      <div className="flex h-[calc(100%-40px)] flex-col">
        <div className="flex-1 overflow-auto px-3 pb-2">
          <div className="space-y-2">
            {boards.map((b) => (
              <BoardRow
                key={b.id}
                active={b.id === selectedId}
                isNew={b.id === editingId}
                defaultName={b.name}
                onActivate={() => onOpenBoard(b.id)}
                onFinish={(name) => onCommitCreateName(b.id, name)}
              />
            ))}
          </div>
        </div>

        {/* Bottom action - integrated as the card's footer (flush, full width) */}
        <button
          onClick={onCreateBoard}
          className="inline-flex h-8 w-full items-center justify-center rounded-b-md bg-yellow-300 text-sm font-medium text-yellow-950 transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          New board
        </button>
      </div>
    </section>
  );
}

function BoardRow({ active, isNew, defaultName, onActivate, onFinish }) {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [isNew]);

  return (
    <div
      className={`my-2 flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition ${
        active ? "bg-neutral-100 ring-1 ring-neutral-300" : "border border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      <span className="inline-block size-3 rounded-full ring-1 ring-neutral-300 bg-white" />
      {isNew ? (
        <input
          ref={inputRef}
          defaultValue={defaultName}
          onBlur={(e) => onFinish(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onFinish(e.currentTarget.value);
            if (e.key === "Escape") onFinish(defaultName);
          }}
          className="ml-2 w-full rounded-sm border border-neutral-300 px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      ) : (
        <button onClick={onActivate} className="ml-2 flex-1 truncate text-left">
          {defaultName}
        </button>
      )}
    </div>
  );
}

/* ---------------------- Right Side ---------------------- */

function BoardView({ board, onAddNoteToRow, onAddRow }) {
  return (
    <main className="relative flex min-w-0 flex-1 flex-col">
      {/* Top bar with current board name */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm font-medium text-neutral-700">{board ? board.name : ""}</div>
        <SettingsAndProfile />
      </div>

      {/* Native scrollbar only when needed */}
      <div className="relative flex-1 overflow-auto">
        {board ? <BoardCanvas board={board} onAddNoteToRow={onAddNoteToRow} onAddRow={onAddRow} /> : null}
      </div>
    </main>
  );
}

function BoardCanvas({ board, onAddNoteToRow, onAddRow }) {
  const sepLabel = (i) => (i === 0 ? "New" : i === 1 ? "Second block" : "Next block");

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-16">
      {board.rows.map((row, i) => (
        <React.Fragment key={`row-${i}`}>
          <Separator label={sepLabel(i)} />
          <Row>
            {row.map((n) => (
              <StickyNote key={n.id} day={n.day} month={n.month} tone={n.tone} />
            ))}
            {/* plus near the row - add notes in this row */}
            <PlusBubble onClick={() => onAddNoteToRow(i)} />
          </Row>
        </React.Fragment>
      ))}

      {/* Trailing separator and the bottom plus bubble to create a new row */}
      <Separator label={sepLabel(board.rows.length)} />
      <div className="pl-1">
        <PlusBubble onClick={onAddRow} title="Add row" />
      </div>
    </div>
  );
}

/* --- Small pieces --- */

function SettingsAndProfile() {
  return (
    <div className="flex items-center gap-3">
      <Dot />
      <Dot />
      <Dot />
    </div>
  );
}
function Dot() {
  return <span aria-hidden className="inline-block size-3 rounded-full bg-neutral-300" />;
}

function Row({ children }) {
  return <div className="mb-6 flex flex-wrap items-start gap-4">{children}</div>;
}

function StickyNote({ day = "10", month = "April", tone = "yellow" }) {
  const tones = {
    yellow: "bg-yellow-200 ring-yellow-300 text-yellow-900",
    sky: "bg-sky-200 ring-sky-300 text-sky-900",
    emerald: "bg-emerald-200 ring-emerald-300 text-emerald-900",
    amber: "bg-amber-200 ring-amber-300 text-amber-900",
    rose: "bg-rose-200 ring-rose-300 text-rose-900",
    violet: "bg-violet-200 ring-violet-300 text-violet-900",
    lime: "bg-lime-200 ring-lime-300 text-lime-900",
  };
  return (
    <div
      className={`w-[180px] rounded-md p-3 shadow-sm ring-1 ${tones[tone] ?? tones.yellow}`}
      style={{ aspectRatio: "1 / 1" }}
    >
      <div className="flex items-start justify-between text-xs/4">
        <span className="font-semibold opacity-80">{day}</span>
        <span className="opacity-70">{month}</span>
      </div>
    </div>
  );
}

function Separator({ label }) {
  return (
    <div className="my-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-medium text-neutral-500">{label}</h3>
        <div className="h-px flex-1 bg-neutral-300" />
      </div>
    </div>
  );
}

function PlusBubble({ onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 ring-1 ring-neutral-300 transition hover:bg-neutral-200"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* --- Utils --- */
function rid() {
  const a = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(a);
    return `${a[0].toString(16)}${a[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}