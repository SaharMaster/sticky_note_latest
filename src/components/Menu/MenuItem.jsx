import React from "react";

/**
 * MenuItem
 * - Basic menu row with hover style and optional right-side slot
 * - 'active' keeps the hover background while true (used for open submenu)
 * - ForwardRef so a parent can measure its position to anchor submenus
 */
const MenuItem = React.forwardRef(function MenuItem(
  { label, onClick, rightSlot = null, active = false, className = "" },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between border-b border-neutral-200 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 last:border-b-0 ${
        active ? "bg-neutral-100" : ""
      } ${className}`}
    >
      <span className="truncate">{label}</span>
      {rightSlot ? rightSlot : null}
    </button>
  );
});

export default MenuItem;