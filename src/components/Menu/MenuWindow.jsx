import React from "react";

/**
 * Generic MenuWindow shell
 * - Draggable, closable, lockable
 * - Children render inside a relative container so submenus can anchor
 * - Corners are less rounded (rounded-sm)
 */
export default function MenuWindow({
  id,
  x,
  y,
  z,
  locked,
  onClose,
  onToggleLock,
  onDragTo,
  onFocus,
  children,
}) {
  const containerRef = React.useRef(null);
  const anchorRef = React.useRef({ offsetX: 0, offsetY: 0 });

  const onHandlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus?.();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      anchorRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
    }

    const move = (ev) => {
      onDragTo?.({
        clientX: ev.clientX,
        clientY: ev.clientY,
        offsetX: anchorRef.current.offsetX,
        offsetY: anchorRef.current.offsetY,
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute select-none"
      style={{ left: x, top: y, zIndex: z }}
      onMouseDown={onFocus}
      onContextMenu={(e) => e.stopPropagation()}
    >
      <div className="min-w-[240px] rounded-sm bg-white shadow-sm ring-1 ring-yellow-300">
        {/* Title bar */}
        <div className="flex items-center justify-between rounded-t-sm border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
          <div className="flex items-center gap-1">
            <button
              aria-label="Move"
              title="Move"
              onPointerDown={onHandlePointerDown}
              className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-neutral-500 hover:text-neutral-700 active:cursor-grabbing cursor-grab"
            >
              <BarsIcon />
            </button>
            <button
              aria-label={locked ? "Unlock" : "Lock"}
              title={locked ? "Unlock" : "Lock"}
              onClick={onToggleLock}
              className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 ${
                locked
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {locked ? <LockClosedIcon /> : <LockOpenIcon />}
            </button>
          </div>

          <button
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="inline-flex size-5 items-center justify-center rounded text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content area (relative for submenus) */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

function BarsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 11V8a5 5 0 0 1 9.8-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function LockClosedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}