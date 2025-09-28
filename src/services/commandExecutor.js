/**
 * Command executor with dynamic imports + prefetch
 * - Namespaced commands (e.g., "boards.delete", "boards.rename.start")
 * - Support nested paths after namespace (e.g., rename.start)
 */
export function createCommandExecutor(deps) {
  const packs = {}; // ns -> command pack instance

  function resolvePath(obj, pathSegments) {
    return pathSegments.reduce(
      (acc, key) => (acc && acc[key] != null ? acc[key] : undefined),
      obj
    );
  }

  async function ensure(ns) {
    if (packs[ns]) return packs[ns];

    if (ns === "boards") {
      const mod = await import("../commands/boards.js");
      packs[ns] = mod.createBoardsCommands(deps);
      return packs[ns];
    }

    if (ns === "demo") {
      const mod = await import("../commands/demo.js");
      packs[ns] = mod.createDemoCommands(deps);
      return packs[ns];
    }

    if (ns === "ui") {
      const mod = await import("../commands/ui.js");
      packs[ns] = mod.createUiCommands(deps);
      return packs[ns];
    }

    packs[ns] = {};
    return packs[ns];
  }

  return {
    async run(commandId, args = {}) {
      const parts = String(commandId).split(".");
      const ns = parts.shift();
      const pack = await ensure(ns);
      const fn = resolvePath(pack, parts);
      if (typeof fn === "function") {
        return await fn(args);
      }
      // Unknown command -> no-op
      return undefined;
    },

    async prefetch(namespaces = []) {
      await Promise.all(namespaces.map((ns) => ensure(ns)));
    },
  };
}