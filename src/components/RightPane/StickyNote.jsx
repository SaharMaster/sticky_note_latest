import React from "react";

/**
 * StickyNote
 * - Visual-only note; no dates/months (to be implemented later)
 */

export default function StickyNote({ tone = "yellow" }) {
  const tones = {
    yellow: "bg-yellow-200 ring-yellow-300",
    sky: "bg-sky-200 ring-sky-300",
    emerald: "bg-emerald-200 ring-emerald-300",
    amber: "bg-amber-200 ring-amber-300",
    rose: "bg-rose-200 ring-rose-300",
    violet: "bg-violet-200 ring-violet-300",
    lime: "bg-lime-200 ring-lime-300",
  };
  return (
    <div
      className={`w-[180px] rounded-md p-3 shadow-sm ring-1 ${tones[tone] ?? tones.yellow}`}
      style={{ aspectRatio: "1 / 1" }}
    />
  );
}