import React from "react";

export default function RightPane({ children, onContextMenu }) {
  // Main content area; delegates contextmenu to parent handler
  return (
    <main
      className="relative flex min-w-0 flex-1 flex-col"
      onContextMenu={onContextMenu}
    >
      {children}
    </main>
  );
}