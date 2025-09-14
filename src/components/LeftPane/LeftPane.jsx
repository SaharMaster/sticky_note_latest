import React from "react";

export default function LeftPane({ children }) {
  return (
    <aside className="relative h-full w-[260px] shrink-0 bg-yellow-300/80">
      <div className="flex h-full flex-col gap-3 p-3">{children}</div>
    </aside>
  );
}