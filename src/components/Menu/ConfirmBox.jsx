import React from "react";

/**
 * ConfirmBox
 * - Wider window
 * - Centered "Confirm" title and centered body text
 * - No danger icon
 * - Visuals consistent with MenuWindow
 */
export default function ConfirmBox({ text, onYes, onNo }) {
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/5">
      <div className="pointer-events-auto w-[200px] rounded-sm bg-white shadow-sm ring-1 ring-yellow-300">
        {/* Header (centered title; close button absolutely positioned) */}
        <div className="relative rounded-t-sm border-b border-neutral-200 bg-neutral-50 px-3 py-2">
          <div className="text-center text-sm font-medium text-neutral-700">Confirm</div>
          <button
            aria-label="Close"
            onClick={onNo}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body (centered message) */}
        <div className="px-6 py-4 text-center">
          <p className="text-base text-neutral-800">{text}</p>
        </div>

        {/* Footer (actions) */}
        <div className="flex justify-center gap-2 px-3 pb-4">
          <button
            onClick={onNo}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            No
          </button>
          <button
            onClick={onYes}
            className="rounded bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}