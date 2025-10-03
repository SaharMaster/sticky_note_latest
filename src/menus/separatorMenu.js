/**
 * Separator menu builder
 * Items:
 *  - Rename section (inline UI)
 *  - Delete section (with confirm)
 */
export function buildSeparatorMenu({ extra }) {
    const boardId = extra?.boardId;
    const rowIdx = extra?.rowIdx; // the section (row) index associated with this separator
  
    return [
      {
        type: "action",
        label: "Rename section",
        command: "ui.section.startRename",
        args: { boardId, rowIdx },
        closeOnRun: true,
      },
      {
        type: "action",
        label: "Delete section",
        command: "boards.section.delete",
        args: { boardId, rowIdx },
        danger: true,
        closeOnRun: true,
      },
    ];
  }