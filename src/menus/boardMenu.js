/**
 * Board menu builder (schema only)
 * - Uses command IDs; logic runs through the executor
 */
export function buildBoardMenu({ extra }) {
    const id = extra?.boardId;
    return [
      {
        type: "action",
        label: "Rename board",
        command: "boards.rename.start",
        args: { id },
        closeOnRun: true,
      },
      {
        type: "action",
        label: "Delete board",
        command: "boards.delete",
        args: { id },
        danger: true,
        closeOnRun: true,
      },
    ];
  }