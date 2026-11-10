"use client";

import { Check, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { addTokenToWallet } from "@/lib/wallet/addToken";
import { useWalletProvider } from "@/lib/wallet/useWalletProvider";
import { cn } from "@/lib/cn";

type State = { kind: "idle" } | { kind: "busy" } | { kind: "ok" } | { kind: "cancel" } | { kind: "error"; message: string };

/** Small "+ Add to wallet" icon button (EIP-747 wallet_watchAsset). Shows success/cancel inline. */
export function AddTokenButton({
  address,
  symbol,
  label = false,
  className,
}: {
  address: `0x${string}`;
  symbol: string;
  /** Show the "Add to wallet" text next to the icon. */
  label?: boolean;
  className?: string;
}) {
  const getProvider = useWalletProvider();
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    if (state.kind === "idle" || state.kind === "busy") return;
    const t = setTimeout(() => setState({ kind: "idle" }), state.kind === "error" ? 5000 : 2500);
    return () => clearTimeout(t);
  }, [state]);

  const run = async () => {
    setState({ kind: "busy" });
    const r = await addTokenToWallet({ address, symbol }, await getProvider());
    setState(r.ok ? { kind: "ok" } : r.cancelled ? { kind: "cancel" } : { kind: "error", message: r.message });
  };

  const text =
    state.kind === "ok" ? "Added" : state.kind === "cancel" ? "Cancelled" : state.kind === "error" ? state.message : "Add to wallet";
  const Icon = state.kind === "busy" ? Loader2 : state.kind === "ok" ? Check : state.kind === "cancel" || state.kind === "error" ? X : Plus;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={run}
        disabled={state.kind === "busy"}
        aria-label={`Add ${symbol} to wallet`}
        title={state.kind === "idle" ? `Add ${symbol} to wallet` : text}
        className={cn(
          "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-line-2 text-ink-2 transition-colors duration-[180ms] hover:border-line-3 hover:text-ink-1 disabled:cursor-wait",
          label ? "px-2.5 text-xs" : "w-8",
          state.kind === "ok" && "border-ok text-ok hover:text-ok",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", state.kind === "busy" && "animate-spin")} strokeWidth={1.75} aria-hidden="true" />
        {label && <span>{state.kind === "idle" || state.kind === "busy" ? "Add to wallet" : text}</span>}
      </button>
      {!label && state.kind !== "idle" && state.kind !== "busy" && (
        <span className={cn("max-w-[16ch] truncate text-xs", state.kind === "ok" ? "text-ok" : state.kind === "error" ? "text-bad" : "text-ink-3")}>
          {text}
        </span>
      )}
      <span className="sr-only" role="status">
        {state.kind === "idle" || state.kind === "busy" ? "" : `${symbol}: ${text}`}
      </span>
    </span>
  );
}
