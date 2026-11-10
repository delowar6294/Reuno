"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { ConnectWalletModal } from "@/components/trade/ConnectWalletModal";
import { CHAIN } from "@/config/chain";
import { addRobinhoodChain } from "@/lib/wallet/addNetwork";
import type { Eip1193Provider } from "@/lib/wallet/provider";
import { cn } from "@/lib/cn";

/** Renders children only when a wallet is connected on Robinhood Chain; otherwise the Connect / Switch action. */
export function WalletGate({ children }: { children: React.ReactNode }) {
  const { isConnected, chainId, connector } = useAccount();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <>
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          Connect wallet
        </Button>
        <ConnectWalletModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }
  if (chainId !== CHAIN.id) {
    const run = async () => {
      setBusy(true);
      setMsg(null);
      const provider = connector ? ((await connector.getProvider()) as Eip1193Provider) : null;
      const r = await addRobinhoodChain(provider);
      setBusy(false);
      if (!r.ok) setMsg(r.message);
    };
    return (
      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" loading={busy} onClick={run}>
          Switch to Robinhood Chain
        </Button>
        {msg && (
          <p className={cn("text-sm", msg === "Cancelled in wallet" ? "text-ink-2" : "text-bad")} role="alert">
            {msg}
          </p>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
