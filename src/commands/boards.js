/**
 * Boards commands
 * - Requires boardsDomain and confirm from deps
 */
export function createBoardsCommands({ boardsDomain, confirm }) {
  return {
    // Supports "boards.rename.start"
    rename: {
      start: async ({ id }) => {
        boardsDomain.startRenameBoard(id);
      },
    },

    // "boards.delete"
    delete: async ({ id }) => {
      const ok = await confirm("Are you sure?");
      if (ok) boardsDomain.deleteBoard(id);
    },

    // "boards.create"
    create: async () => {
      boardsDomain.createBoard();
    },

    // Section-level commands (rows)
    // "boards.section.addNote"
    section: {
      addNote: async ({ boardId, rowIdx }) => {
        if (!boardId || rowIdx == null) return;
        boardsDomain.addNoteToRow(boardId, rowIdx);
      },
    },
  };
}