import React from "react";

function uid() {
  const a = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(a);
    return `${a[0].toString(16)}${a[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}

function createNote() {
  const tones = ["yellow", "sky", "emerald", "amber", "rose", "violet", "lime"];
  const tone = tones[Math.floor(Math.random() * tones.length)];
  return { id: uid(), tone };
}

export function useBoardsDomain() {
  const [boards, setBoards] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);

  const createBoard = React.useCallback(() => {
    const b = { id: uid(), name: "New board", rows: [[createNote()]] };
    setBoards((prev) => [...prev, b]);
    setSelectedId(b.id);
    setEditingId(b.id);
    return b.id;
  }, []);

  const commitCreateName = React.useCallback((id, name) => {
    const finalName = (name || "").trim() || "Untitled";
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name: finalName } : b)));
    setEditingId(null);
  }, []);

  const startRenameBoard = React.useCallback((id) => {
    setEditingId(id);
  }, []);

  const deleteBoard = React.useCallback((id) => {
    setBoards((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setEditingId((cur) => (cur === id ? null : cur));
  }, []);

  const openBoard = React.useCallback((id) => setSelectedId(id), []);

  const addNoteToRow = React.useCallback((boardId, rowIdx) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id !== boardId
          ? b
          : { ...b, rows: b.rows.map((r, i) => (i === rowIdx ? [...r, createNote()] : r)) }
      )
    );
  }, []);

  const addNewRow = React.useCallback((boardId) => {
    setBoards((prev) =>
      prev.map((b) => (b.id !== boardId ? b : { ...b, rows: [...b.rows, [createNote()]] }))
    );
  }, []);

  const selectedBoard = boards.find((b) => b.id === selectedId) || null;

  function moveNoteWithinRow(boardId, sectionIndex, fromIndex, toIndex) {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        const rows = b.rows.map((row, i) => {
          if (i !== sectionIndex) return row;
          const next = row.slice();
          const [item] = next.splice(fromIndex, 1);
          // toIndex is in the shorter array after removal
          next.splice(toIndex, 0, item);
          return next;
        });
        return { ...b, rows };
      })
    );
  }

  function moveNoteBetweenRows(boardId, fromSection, fromIndex, toSection, toIndex) {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        const rows = b.rows.map((r) => r.slice());
        const [item] = rows[fromSection].splice(fromIndex, 1);
        rows[toSection].splice(toIndex, 0, item);
        return { ...b, rows };
      })
    );
  }

  return {
    // state
    boards,
    selectedId,
    editingId,
    selectedBoard,
    // actions
    createBoard,
    commitCreateName,
    startRenameBoard,
    deleteBoard,
    openBoard,
    addNoteToRow,
    addNewRow,
    moveNoteWithinRow,
    moveNoteBetweenRows,
  };
}