import React from "react";

/**
 * MenuItem
 * - Density-aware row
 * - 'active' keeps the hover background while true (used for open submenu)
 * - ForwardRef for submenu anchoring
 */
const MenuItem = React.forwardRef(function MenuItem(
  { label, onClick, rightSlot = null, active = false, className = "", density = "regular" },
  ref
) {
  const pad = density === "compact" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between border-b border-neutral-200 ${pad} text-left text-neutral-700 hover:bg-neutral-100 last:border-b-0 ${
        active ? "bg-neutral-100" : ""
      } ${className}`}
    >
      <span className="truncate">{label}</span>
      {rightSlot ? rightSlot : null}
    </button>
  );
});

export default MenuItem;