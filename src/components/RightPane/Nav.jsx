import React from "react";

/**
 * Nav
 * - Board title (text-lg)
 * - Subtle shadow and divider under nav so scrollbar feels natural
 */

export default function Nav({ title }) {
  return (
    <div className="sticky top-0 z-10 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-lg font-medium text-neutral-700">{title}</div>
        <div className="flex items-center gap-3">
          <Dot />
          <Dot />
          <Dot />
        </div>
      </div>
      <div className="h-px w-full bg-neutral-200 shadow-sm" />
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="inline-block size-3 rounded-full bg-neutral-300" />;
}