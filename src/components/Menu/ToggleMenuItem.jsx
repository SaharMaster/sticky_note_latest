import React from "react";

/**
 * ToggleMenuItem (controlled)
 * - Density-aware row with a right-side status dot
 * - Controlled: enabled + onToggle
 */
const ToggleMenuItem = React.forwardRef(function ToggleMenuItem(
  { label, enabled = false, onToggle, density = "regular" },
  ref
) {
  const pad = density === "compact" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onToggle?.(!enabled)}
      className={`flex w-full items-center justify-between border-b border-neutral-200 ${pad} text-left text-neutral-700 hover:bg-neutral-100 last:border-b-0`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`ml-3 inline-block size-2 rounded-full ring-1 transition-colors ${
          enabled ? "bg-emerald-500 ring-emerald-400" : "bg-transparent ring-neutral-300"
        }`}
      />
    </button>
  );
});

export default ToggleMenuItem;