import React from "react";
import ConfirmBox from "../components/Menu/ConfirmBox";

const ConfirmContext = React.createContext(null);

export function ConfirmProvider({ children }) {
  const [pending, setPending] = React.useState(null); // { text, resolve }

  const confirm = React.useCallback((text, options = {}) => {
    return new Promise((resolve) => {
      setPending({ text, options, resolve });
    });
  }, []);

  const handleYes = React.useCallback(() => {
    if (pending?.resolve) pending.resolve(true);
    setPending(null);
  }, [pending]);

  const handleNo = React.useCallback(() => {
    if (pending?.resolve) pending.resolve(false);
    setPending(null);
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmBox text={pending.text} onYes={handleYes} onNo={handleNo} />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within <ConfirmProvider>");
  }
  return ctx;
}