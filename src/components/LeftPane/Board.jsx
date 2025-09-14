import React from "react";

/**
 * Board (a single board row inside BoardsStorage)
 * - Active state highlight
 * - Inline name input only when the board is first created (isNew)
 */

export default function Board({ active, isNew, defaultName, onActivate, onFinish }) {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [isNew]);

  return (
    <div
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active ? "bg-neutral-100 ring-1 ring-neutral-300" : "border border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      <span className="inline-block size-3 rounded-full bg-white ring-1 ring-neutral-300" />
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