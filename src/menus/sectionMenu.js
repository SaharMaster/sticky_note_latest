/**
 * Section (board row) menu builder
 * - Create note (action)
 * - Section edit mode (toggle with green indicator)
 */
export function buildSectionMenu({ extra, state }) {
    const boardId = extra?.boardId;
    const rowIdx = extra?.rowIdx;
    const isEditing = !!state?.editing;
  
    return [
      {
        type: "action",
        label: "Create note",
        command: "boards.section.addNote",
        args: { boardId, rowIdx },
        closeOnRun: true,
      },
      {
        type: "toggle",
        label: "Section edit mode",
        enabled: isEditing,
        command: "ui.section.toggleEdit",
        args: { boardId, rowIdx },
        closeOnRun: false,
      },
    ];
  }