/**
 * UI commands (pure UI state toggles wired from App via deps.ui)
 */
export function createUiCommands({ ui }) {
    return {
      section: {
        // "ui.section.toggleEdit"
        toggleEdit: async ({ boardId, rowIdx }) => {
          if (!ui?.toggleSectionEdit) return;
          ui.toggleSectionEdit(boardId, rowIdx);
        },
        // "ui.section.startRename"
        startRename: async ({ boardId, rowIdx }) => {
          if (!ui?.startSectionRename) return;
          ui.startSectionRename(boardId, rowIdx);
        },
      },
    };
  }