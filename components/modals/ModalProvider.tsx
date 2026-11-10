"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ConnectModal } from "./ConnectModal";
import { TorModal } from "./TorModal";

type ModalName = "connect" | "tor";

type Ctx = { openModal: (name: ModalName) => void };

const ModalContext = createContext<Ctx | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ModalName | null>(null);
  const openModal = useCallback((name: ModalName) => setActive(name), []);
  const close = useCallback(() => setActive(null), []);
  const value = useMemo(() => ({ openModal }), [openModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ConnectModal open={active === "connect"} onClose={close} />
      <TorModal open={active === "tor"} onClose={close} />
    </ModalContext.Provider>
  );
}

export function useModal(): Ctx {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}
