import React from "react";

/**
 * ToggleMenuItem
 * - Density-aware enabled/disabled row
 * - Status dot on the RIGHT side; turns green when enabled
 */
export default function ToggleMenuItem({ label, density = "regular" }) {
  const [enabled, setEnabled] = React.useState(false);
  const pad = density === "compact" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  return (
    <button
      type="button"
      onClick={() => setEnabled((v) => !v)}
      className={`flex w-full items-center justify-between border-b border-neutral-200 ${pad} text-left text-neutral-700 hover:bg-neutral-100`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`ml-3 inline-block size-2 rounded-full ring-1 ring-neutral-300 transition-colors ${
          enabled ? "bg-emerald-500 ring-emerald-400" : "bg-transparent"
        }`}
      />
    </button>
  );
}