/**
 * Menu registry with dynamic imports + prefetch
 * - prefetchMenu(kind): loads builder for a given kind
 * - buildMenu(kind, ctx): returns items from the loaded builder (returns [] if not loaded)
 */
const builders = new Map();

/** Preload the menu builder for a given kind */
export async function prefetchMenu(kind) {
  if (builders.has(kind)) return;

  switch (kind) {
    case "board": {
      const mod = await import("../menus/boardMenu.js");
      builders.set("board", mod.buildBoardMenu);
      break;
    }
    case "section": {
      const mod = await import("../menus/sectionMenu.js");
      builders.set("section", mod.buildSectionMenu);
      break;
    }
    default:
      // Unknown kind; no-op
      break;
  }
}

/** Build items synchronously from a loaded builder */
export function buildMenu(kind, ctx = {}) {
  const builder = builders.get(kind);
  if (!builder) return [];
  return builder(ctx);
}