"use client";

import { getAccount } from "@wagmi/core";
import { useContext, useState } from "react";
import { WagmiContext } from "wagmi";
import { Button } from "@/components/ui/Button";
import { WalletModal } from "@/components/trade/ConnectWalletModal";
import { addRobinhoodChain, type WalletResult } from "@/lib/wallet/addNetwork";
import { injectedProvider, isUserRejection } from "@/lib/wallet/provider";
import { useWalletProvider } from "@/lib/wallet/useWalletProvider";
import { cn } from "@/lib/cn";
import { AddNetworkManual } from "./AddNetworkManual";

/**
 * "Add Robinhood Chain to wallet" with inline result and an optional manual-settings block.
 * Adding needs a connected wallet, so when none is connected it connects first, then adds the network.
 */
export function AddChainButton({
  manual = true,
  size = "sm",
  variant = "secondary",
  className,
}: {
  manual?: boolean;
  size?: "sm" | "md";
  variant?: "secondary" | "primary";
  className?: string;
}) {
  const config = useContext(WagmiContext);
  const getProvider = useWalletProvider();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WalletResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const run = async () => {
    setResult(null);
    // Inside the trading pages: connect through the wallet picker first, which then adds the network.
    if (config && getAccount(config).status !== "connected") {
      setModalOpen(true);
      return;
    }
    setBusy(true);
    try {
      const provider = await getProvider();
      if (!config && provider) {
        // Pages without the wallet context: ask the browser wallet to connect first.
        try {
          await provider.request({ method: "eth_requestAccounts" });
        } catch (e) {
          setResult({ ok: false, cancelled: isUserRejection(e), message: isUserRejection(e) ? "Cancelled in wallet" : "Your wallet did not connect." });
          return;
        }
      }
      setResult(await addRobinhoodChain(provider ?? injectedProvider()));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <Button size={size} variant={variant} loading={busy} onClick={run}>
        Add Robinhood Chain to wallet
      </Button>
      <p role="status" className={cn("text-xs empty:hidden", result?.ok ? "text-ok" : result?.cancelled ? "text-ink-3" : "text-bad")}>
        {result?.message ?? ""}
      </p>
      {manual && <AddNetworkManual />}
      {config && <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} addChainAfterConnect />}
    </div>
  );
}
