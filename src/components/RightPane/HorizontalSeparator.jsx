import React from "react";

/**
 * HorizontalSeparator
 * - Label on the left, subtle line continuing to the right
 */

export default function HorizontalSeparator({ label }) {
  return (
    <div className="my-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-medium text-neutral-500">{label}</h3>
        <div className="h-px flex-1 bg-neutral-300" />
      </div>
    </div>
  );
}