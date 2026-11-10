"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { BridgeModal } from "./BridgeModal";

type BridgeCtx = { openBridge: (shortfallWei?: bigint | null) => void };
const Ctx = createContext<BridgeCtx | null>(null);

/**
 * Hosts the "Get ETH on Robinhood Chain" dialog once per page, above everything that can unmount
 * when the wallet switches chains mid-bridge.
 */
export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ open: boolean; shortfallWei: bigint | null; session: number }>({
    open: false,
    shortfallWei: null,
    session: 0,
  });
  const openBridge = useCallback(
    (shortfallWei?: bigint | null) => setState((s) => ({ open: true, shortfallWei: shortfallWei ?? null, session: s.session + 1 })),
    [],
  );
  const value = useMemo(() => ({ openBridge }), [openBridge]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <BridgeModal
        key={state.session}
        open={state.open}
        shortfallWei={state.shortfallWei}
        onClose={() => setState((s) => ({ ...s, open: false }))}
      />
    </Ctx.Provider>
  );
}

export const useBridge = () => useContext(Ctx);
