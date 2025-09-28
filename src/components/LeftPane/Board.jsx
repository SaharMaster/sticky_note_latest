import React from "react";

/**
 * Board row
 * - Active highlight
 * - Inline name input when creating or editing
 * - Right-click propagates to open context menu
 */

export default function Board({
  active,
  isNew,
  isEditing,
  defaultName,
  onActivate,
  onFinish,
  onContextMenu,
}) {
  const inputRef = React.useRef(null);
  const showInput = isNew || isEditing;

  React.useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [showInput]);

  return (
    <div
      onClick={onActivate}
      onContextMenu={onContextMenu}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active ? "bg-neutral-100 ring-1 ring-neutral-300" : "border border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      <span className="inline-block size-3 rounded-full bg-white ring-1 ring-neutral-300" />
      {showInput ? (
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
        <button onClick={onActivate} className="flex-1 text-left">
          {defaultName}
        </button>
      )}
    </div>
  );
}