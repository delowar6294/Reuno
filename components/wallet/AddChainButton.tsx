"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { addRobinhoodChain, type WalletResult } from "@/lib/wallet/addNetwork";
import { useWalletProvider } from "@/lib/wallet/useWalletProvider";
import { cn } from "@/lib/cn";
import { AddNetworkManual } from "./AddNetworkManual";

/** "Add Robinhood Chain to wallet" with inline result and an optional manual-settings block. */
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
  const getProvider = useWalletProvider();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WalletResult | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      setResult(await addRobinhoodChain(await getProvider()));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <Button size={size} variant={variant} loading={busy} onClick={run}>
        Add Robinhood Chain to wallet
      </Button>
      <p
        role="status"
        className={cn(
          "min-h-0 text-xs empty:hidden",
          result?.ok ? "text-ok" : result?.cancelled ? "text-ink-3" : "text-bad",
        )}
      >
        {result?.message ?? ""}
      </p>
      {manual && <AddNetworkManual />}
    </div>
  );
}
