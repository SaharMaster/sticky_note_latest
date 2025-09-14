import React from "react";

export default function RightPane({ children }) {
  // Thin wrapper for the right side; keeps layout future-proof
  return <main className="relative flex min-w-0 flex-1 flex-col">{children}</main>;
}