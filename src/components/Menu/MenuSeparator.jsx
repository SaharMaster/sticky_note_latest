import React from "react";

/**
 * MenuSeparator
 * - Density-aware divider with rounded ends
 */
export default function MenuSeparator({ density = "regular" }) {
  const pad = density === "compact" ? "px-2 py-1" : "px-3 py-2";
  return (
    <div className={pad}>
      <div className="h-1 rounded-full bg-neutral-200" />
    </div>
  );
}