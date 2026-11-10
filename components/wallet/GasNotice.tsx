"use client";

import { Fuel } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatEth, formatEthCeil } from "@/lib/format";
import type { PreflightResult } from "@/lib/wallet/tx";
import { cn } from "@/lib/cn";
import { useBridge } from "./BridgeProvider";

type Funds = Extract<PreflightResult, { status: "funds" }>;

/** Shown instead of the action when the wallet can't cover value + gas on Robinhood Chain. */
export function GasNotice({ result, className }: { result: Funds; className?: string }) {
  const bridge = useBridge();
  const { neededWei, balanceWei, valueWei } = result;
  const zero = BigInt(0);

  let message: string;
  if (neededWei !== null && valueWei === zero) {
    message = `You need about ${formatEthCeil(neededWei - balanceWei)} ETH more on Robinhood Chain for gas.`;
  } else if (neededWei !== null) {
    message = `You need about ${formatEthCeil(neededWei)} ETH on Robinhood Chain (${formatEth(valueWei)} for the swap plus gas). Your wallet has ${formatEth(balanceWei)} ETH.`;
  } else if (valueWei > zero) {
    message = `This needs ${formatEth(valueWei)} ETH plus gas on Robinhood Chain. Your wallet has ${formatEth(balanceWei)} ETH.`;
  } else {
    message = `You need some ETH on Robinhood Chain for gas. Your wallet has ${formatEth(balanceWei)} ETH.`;
  }
  const shortfall = neededWei !== null ? neededWei - balanceWei : valueWei > balanceWei ? valueWei - balanceWei : null;

  return (
    <div className={cn("flex flex-col gap-3 rounded-sm border border-line-2 bg-surface-1 p-3", className)} role="alert">
      <p className="flex items-start gap-2 text-sm text-ink-1">
        <Fuel className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" strokeWidth={1.75} aria-hidden="true" />
        {message}
      </p>
      {bridge && (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => bridge.openBridge(shortfall)}>
          Get ETH on Robinhood Chain
        </Button>
      )}
    </div>
  );
}
