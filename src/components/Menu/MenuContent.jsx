import React from "react";
import MenuItem from "./MenuItem";
import ToggleMenuItem from "./ToggleMenuItem";
import MenuSeparator from "./MenuSeparator";

/**
 * MenuContent
 * - Renders menu items from a schema
 * - Supports: action, toggle, submenu, separator
 * - Submenus are positioned relative to the parent container (which must be relative)
 */

export default function MenuContent({ items = [] }) {
  const itemRefs = React.useRef([]);
  const [openIndex, setOpenIndex] = React.useState(null);
  const [submenuTop, setSubmenuTop] = React.useState(0);

  const toggleSubmenuAt = (idx) => {
    setOpenIndex((cur) => {
      if (cur === idx) return null;
      // opening a new one -> measure anchor top
      const el = itemRefs.current[idx];
      if (el) setSubmenuTop(el.offsetTop);
      return idx;
    });
  };

  const setRefAt = (i) => (el) => {
    itemRefs.current[i] = el;
  };

  return (
    <div className="relative">
      {items.map((it, i) => {
        if (it.type === "separator") {
          // We'll render separators after list, but allow inline too if provided
          return <MenuSeparator key={`sep-${i}`} />;
        }

        if (it.type === "action") {
          const danger = it.danger;
          return (
            <MenuItem
              key={`a-${i}`}
              label={it.label}
              onClick={it.onClick}
              rightSlot={it.rightSlot}
              className={danger ? "text-red-600 hover:bg-red-50" : ""}
              ref={setRefAt(i)}
            />
          );
        }

        if (it.type === "toggle") {
          return <ToggleMenuItem key={`t-${i}`} label={it.label} ref={setRefAt(i)} />;
        }

        if (it.type === "submenu") {
          const isOpen = openIndex === i;
          return (
            <React.Fragment key={`s-${i}`}>
              <MenuItem
                ref={setRefAt(i)}
                label={it.label}
                onClick={() => toggleSubmenuAt(i)}
                active={isOpen}
                rightSlot={
                  <span
                    className={`ml-2 shrink-0 ${
                      isOpen ? "text-neutral-700 rotate-180" : "text-neutral-500"
                    } transition-transform`}
                  >
                    <ChevronRight />
                  </span>
                }
              />
              {isOpen && (
                <div
                  className="absolute left-full z-10 ml-2 w-[220px] rounded-sm bg-white shadow-sm ring-1 ring-yellow-300"
                  style={{ top: submenuTop }}
                >
                  <MenuContent items={it.items || []} />
                </div>
              )}
            </React.Fragment>
          );
        }

        return null;
      })}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}