import React from "react";
import MenuItem from "./MenuItem";
import ToggleMenuItem from "./ToggleMenuItem";
import MenuSeparator from "./MenuSeparator";

/**
 * MenuContent (command-driven)
 * - Theming knobs: density, tone
 * - Submenus inherit the same density/tone
 */
export default function MenuContent({ items = [], onAction, density = "regular", tone = "yellow" }) {
  const itemRefs = React.useRef([]);
  const [openIndex, setOpenIndex] = React.useState(null);
  const [submenuTop, setSubmenuTop] = React.useState(0);

  const ringByTone = {
    yellow: "ring-yellow-300",
    neutral: "ring-neutral-200",
    emerald: "ring-emerald-300",
    rose: "ring-rose-300",
    violet: "ring-violet-300",
    sky: "ring-sky-300",
    lime: "ring-lime-300",
  };
  const submenuRing = ringByTone[tone] ?? ringByTone.yellow;

  const toggleSubmenuAt = (idx) => {
    setOpenIndex((cur) => {
      if (cur === idx) return null;
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
          return <MenuSeparator key={`sep-${i}`} density={density} />;
        }

        if (it.type === "action") {
          const danger = it.danger;
          return (
            <MenuItem
              key={`a-${i}`}
              label={it.label}
              onClick={() => onAction?.(it)}
              rightSlot={it.rightSlot}
              className={danger ? "text-red-600 hover:bg-red-50" : ""}
              ref={setRefAt(i)}
              density={density}
            />
          );
        }

        if (it.type === "toggle") {
          return <ToggleMenuItem key={`t-${i}`} label={it.label} ref={setRefAt(i)} density={density} />;
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
                density={density}
              />
              {isOpen && (
                <div
                  className={`absolute left-full z-10 ml-2 w-[220px] rounded-sm bg-white shadow-sm ring-1 ${submenuRing}`}
                  style={{ top: submenuTop }}
                >
                  <MenuContent items={it.items || []} onAction={onAction} density={density} tone={tone} />
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