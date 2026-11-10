"use client";

import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { explorerTxUrl } from "@/config/chain";
import { shortAddress } from "@/lib/format";
import type { TxPhase } from "@/lib/wallet/useTx";
import { cn } from "@/lib/cn";
import { GasNotice } from "./GasNotice";

const LABELS: Partial<Record<TxPhase["phase"], string>> = {
  switching: "Switching your wallet to Robinhood Chain…",
  simulating: "Simulating on Robinhood Chain…",
  wallet: "Confirm in your wallet…",
};

/** Inline status for a transaction run by useTxRunner. */
export function TxStatus({ state, label, className }: { state: TxPhase; label: string; className?: string }) {
  if (state.phase === "idle") return null;

  if (state.phase === "blocked") {
    const r = state.result;
    if (r.status === "funds") return <GasNotice result={r} className={className} />;
    return (
      <p className={cn("text-sm text-bad", className)} role="alert">
        {r.status === "revert" || r.status === "error" ? r.message : "Not ready to send."}
      </p>
    );
  }

  if (state.phase === "error") {
    return (
      <p className={cn("text-sm", state.message === "Cancelled in wallet" ? "text-ink-2" : "text-bad", className)} role="alert">
        {state.message}
      </p>
    );
  }

  if (state.phase in LABELS) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-ink-2", className)} role="status">
        <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />
        {LABELS[state.phase]}
      </p>
    );
  }

  const hash = "hash" in state ? state.hash : null;
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-sm border border-line-1 bg-surface-1 p-3", className)} role="status">
      <span className="flex items-center gap-2 text-sm text-ink-1">
        {state.phase === "pending" && <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />}
        {state.phase === "success" && <CheckCircle2 className="h-4 w-4 text-ok" strokeWidth={1.75} aria-hidden="true" />}
        {state.phase === "reverted" && <XCircle className="h-4 w-4 text-bad" strokeWidth={1.75} aria-hidden="true" />}
        {state.phase === "pending"
          ? `${label} sent. Waiting for 1 confirmation…`
          : state.phase === "success"
            ? `${label} confirmed on Robinhood Chain.`
            : `${label} failed.`}
      </span>
      {state.phase === "reverted" && <span className="text-sm text-bad">{state.message}</span>}
      {hash && (
        <a
          href={explorerTxUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start font-mono text-xs text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline"
        >
          {shortAddress(hash, 10, 8)}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">View on the Robinhood Chain explorer</span>
        </a>
      )}
    </div>
  );
}
