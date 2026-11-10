"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "@/components/ui/Button";
import { GasNotice } from "@/components/wallet/GasNotice";
import { TxStatus } from "@/components/wallet/TxStatus";
import { CHAIN } from "@/config/chain";
import { tokenByTicker } from "@/config/tokens";
import { STOCK_TOKEN_NOTICE_SHORT } from "@/data/stocks";
import type { TradeQuote, TradeSide } from "@/lib/market-types";
import { formatEth, formatUsd } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { addRobinhoodChain } from "@/lib/wallet/addNetwork";
import type { Eip1193Provider } from "@/lib/wallet/provider";
import type { TxCall } from "@/lib/wallet/tx";
import { usePreflight, useTxRunner } from "@/lib/wallet/useTx";
import { cn } from "@/lib/cn";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideToggle } from "./SideToggle";

const CHIPS = ["25", "50", "100"];
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quote: TradeQuote }
  | { status: "noroute"; message: string }
  | { status: "error"; message: string };

function amountError(v: string): string | null {
  if (v.trim() === "") return "Enter an amount in USD.";
  if (!AMOUNT_RE.test(v)) return "Use a positive number with at most 2 decimals.";
  if (Number(v) < 0.01) return "Minimum is $0.01.";
  if (Number(v) > 100_000) return "Amount is above the beta cap.";
  return null;
}

function fmtToken(raw: string, decimals: number): string {
  const n = Number(formatUnits(BigInt(raw), decimals));
  if (n === 0) return "0";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumSignificantDigits: 4 });
}

export function TradePanel({
  ticker,
  side,
  onSideChange,
  amount,
  onAmountChange,
  onBusyChange,
}: {
  ticker: string;
  side: TradeSide;
  onSideChange: (s: TradeSide) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const reduce = useReducedMotion();
  const token = tokenByTicker(ticker);
  const { address, isConnected, chainId, connector } = useAccount();
  const runner = useTxRunner(ticker);

  const [connectOpen, setConnectOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [quote, setQuote] = useState<QuoteState>({ status: "idle" });
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const err = amountError(amount);
  const showErr = touched && err;
  const wrongChain = isConnected && chainId !== CHAIN.id;
  const ready = quote.status === "ready" ? quote.quote : null;

  // Real decimals, read from the token contract.
  const decimals = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: CHAIN.id,
    query: { enabled: !!token, staleTime: Infinity },
  });

  // Holdings check for sells: the quote's input amount must not exceed what the wallet holds.
  const holdings = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN.id,
    query: { enabled: !!token && !!address && side === "sell" },
  });
  const shortHoldings =
    !!ready && ready.side === "sell" && holdings.data !== undefined && holdings.data < BigInt(ready.fromAmount);

  // Allowance check for ERC-20 sells.
  const needsAllowance = !!ready && ready.side === "sell" && !!ready.approvalAddress && !!address;
  const allowance = useReadContract({
    address: ready?.fromToken.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: needsAllowance ? [address!, ready!.approvalAddress!] : undefined,
    chainId: CHAIN.id,
    query: { enabled: needsAllowance },
  });
  const hasAllowance =
    !needsAllowance || (allowance.data !== undefined && allowance.data >= BigInt(ready!.fromAmount));

  // The next transaction to send: an exact-amount approval first if needed, otherwise the swap.
  const call: TxCall | null = useMemo(() => {
    if (!ready || runner.state.phase === "success" || shortHoldings) return null;
    if (needsAllowance) {
      if (allowance.data === undefined) return null;
      if (!hasAllowance) {
        return { kind: "erc20", token: ready.fromToken.address, functionName: "approve", args: [ready.approvalAddress!, BigInt(ready.fromAmount)] };
      }
    }
    const tr = ready.transactionRequest;
    return { kind: "raw", to: tr.to, data: tr.data, value: BigInt(tr.value) };
  }, [ready, needsAllowance, allowance.data, hasAllowance, runner.state.phase, shortHoldings]);
  const isApproval = call?.kind === "erc20";

  const { preflight } = usePreflight(wrongChain ? null : call, ticker);

  const quoteOpen = quote.status === "ready";
  const busy = quoteOpen || quote.status === "loading" || switching || runner.busy || connectOpen;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const resetRunner = runner.reset;
  const closeQuote = useCallback(() => {
    setQuote({ status: "idle" });
    resetRunner();
  }, [resetRunner]);

  // Escape closes the quote panel (not while a transaction is in flight).
  useEffect(() => {
    if (!quoteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !runner.busy && !document.querySelector('[role="dialog"][aria-modal="true"]')) closeQuote();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [quoteOpen, runner.busy, closeQuote]);

  // A side or account change invalidates an open quote (LI.FI builds the calldata for one address).
  useEffect(() => {
    closeQuote();
  }, [side, address, closeQuote]);

  // After an approval confirms, re-read the allowance and clear its status so the swap step shows.
  const refetchAllowance = allowance.refetch;
  useEffect(() => {
    if (runner.state.phase === "success" && isApproval) {
      void refetchAllowance().then(() => resetRunner());
    }
  }, [runner.state.phase, isApproval, refetchAllowance, resetRunner]);

  const switchToRh = async () => {
    setSwitching(true);
    setSwitchError(null);
    const provider = connector ? ((await connector.getProvider()) as Eip1193Provider) : null;
    const r = await addRobinhoodChain(provider);
    setSwitching(false);
    if (!r.ok) setSwitchError(r.message);
  };

  const getQuote = async () => {
    setTouched(true);
    if (err || !address) return;
    resetRunner();
    setQuote({ status: "loading" });
    try {
      const params = new URLSearchParams({ side, ticker, usd: amount, from: address });
      const res = await fetch(`/api/trade-quote?${params}`);
      const body = (await res.json()) as TradeQuote | { error: string; code?: string };
      if (res.status === 404 && "code" in body && body.code === "NO_ROUTE") {
        setQuote({ status: "noroute", message: body.error });
        return;
      }
      if (!res.ok || "error" in body) {
        setQuote({ status: "error", message: "error" in body ? body.error : "Could not get a quote right now." });
        return;
      }
      setQuote({ status: "ready", quote: body });
    } catch {
      setQuote({ status: "error", message: "Could not reach the quote service. Check your connection." });
    }
  };

  const panelMotion = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.3, ease: EASE } };

  const swapDone = runner.state.phase === "success" && !isApproval;
  const showRunnerStatus = runner.state.phase !== "idle" && !(runner.state.phase === "success" && isApproval);

  return (
    <div className="flex flex-col gap-4">
      <SideToggle value={side} onChange={onSideChange} />

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-mono-label text-ink-3">
          amount in usd
        </label>
        <div
          className={cn(
            "flex h-12 items-center gap-2 rounded-sm border bg-surface-3 px-3 transition-colors duration-[180ms] focus-within:border-line-3",
            showErr ? "border-bad" : "border-line-1 hover:border-line-2",
          )}
        >
          <span className="mono-num text-ink-3" aria-hidden="true">
            $
          </span>
          <input
            id={inputId}
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            disabled={quoteOpen}
            onChange={(e) => {
              onAmountChange(e.target.value.replace(/[^0-9.]/g, ""));
              if (quote.status !== "idle" && !quoteOpen) setQuote({ status: "idle" });
            }}
            onBlur={() => setTouched(true)}
            aria-invalid={showErr ? true : undefined}
            aria-describedby={showErr ? `${inputId}-err` : undefined}
            className="mono-num h-full min-w-0 flex-1 bg-transparent text-lg text-ink-1 outline-none placeholder:text-ink-3 disabled:opacity-70"
            placeholder="50.00"
          />
          <div className="flex gap-1.5">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                disabled={quoteOpen}
                onClick={() => {
                  onAmountChange(c);
                  setTouched(true);
                  if (!quoteOpen) setQuote({ status: "idle" });
                }}
                className={cn(
                  "mono-num h-7 rounded-full border px-2.5 text-xs transition-colors duration-[180ms] disabled:opacity-50",
                  amount === c ? "border-brand-400 text-brand-200" : "border-line-2 text-ink-2 hover:text-ink-1",
                )}
              >
                ${c}
              </button>
            ))}
          </div>
        </div>
        {showErr && (
          <p id={`${inputId}-err`} className="text-sm text-bad">
            {err}
          </p>
        )}
      </div>

      <p className="text-xs text-ink-3">{STOCK_TOKEN_NOTICE_SHORT}</p>

      <AnimatePresence mode="wait" initial={false}>
        {!quoteOpen ? (
          <motion.div key="action" className="flex flex-col gap-2" {...panelMotion}>
            {!isConnected ? (
              <Button size="lg" className="w-full" onClick={() => setConnectOpen(true)}>
                Connect wallet
              </Button>
            ) : wrongChain ? (
              <Button size="lg" className="w-full" loading={switching} onClick={switchToRh}>
                Switch to Robinhood Chain
              </Button>
            ) : (
              <Button size="lg" className="w-full" loading={quote.status === "loading"} onClick={getQuote}>
                {`Get ${side} quote · ${ticker}`}
              </Button>
            )}
            {quote.status === "noroute" && (
              <p className="text-sm text-ink-2" role="status">
                {quote.message}. Try a different amount later.
              </p>
            )}
            {quote.status === "error" && (
              <p className="text-sm text-bad" role="alert">
                {quote.message}
              </p>
            )}
            {switchError && (
              <p className={cn("text-sm", switchError === "Cancelled in wallet" ? "text-ink-2" : "text-bad")} role="alert">
                {switchError}
              </p>
            )}
          </motion.div>
        ) : ready ? (
          <motion.div
            key="quote"
            className="flex flex-col gap-3 rounded-lg border border-line-2 bg-surface-2 p-4"
            role="region"
            aria-label={`${side} quote for ${ticker}`}
            {...panelMotion}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-mono-label truncate text-brand-300">
                {ready.route === "lifi" ? `li.fi quote · ${ready.tool.toLowerCase()}` : `direct · ${ready.tool.toLowerCase()}`}
              </span>
              <span className="mono-num shrink-0 text-xs text-ink-3">
                {new Date(ready.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <dl className="flex flex-col gap-2 font-mono text-[13px]">
              <Row k="you pay" v={`${fmtToken(ready.fromAmount, ready.fromToken.decimals)} ${ready.fromToken.symbol}`} sub={ready.fromAmountUsd !== null ? formatUsd(ready.fromAmountUsd) : undefined} />
              <Row k="you receive" v={`${fmtToken(ready.toAmount, ready.toToken.decimals)} ${ready.toToken.symbol}`} sub={ready.toAmountUsd !== null ? formatUsd(ready.toAmountUsd) : undefined} />
              <Row k={`minimum (${ready.slippageBps / 100}% slippage)`} v={`${fmtToken(ready.toAmountMin, ready.toToken.decimals)} ${ready.toToken.symbol}`} />
              <Row k="route fees" v={formatUsd(ready.feesUsd)} />
              <Row
                k="network gas"
                v={
                  preflight.status === "ok"
                    ? `≈ ${formatEth(preflight.gasCostWei)} ETH`
                    : ready.gasUsd !== null
                      ? formatUsd(ready.gasUsd)
                      : "estimating…"
                }
                sub={preflight.status === "ok" ? "max, +20% buffer" : undefined}
              />
              {decimals.data !== undefined && (
                <Row k={`${ticker} decimals`} v={`${decimals.data} · on-chain`} sub={`min 1e-${decimals.data}`} />
              )}
            </dl>
            <p className="text-xs text-ink-3">
              {ready.route === "lifi" ? "Routed by LI.FI" : "Routed directly through Uniswap v3's official router"}; settles publicly on
              Robinhood Chain. Private routing through the five layers launches with the Reuno pool.
            </p>

            {shortHoldings && holdings.data !== undefined && decimals.data !== undefined && (
              <p className="text-sm text-bad" role="alert">
                {`You hold ${fmtToken(holdings.data.toString(), decimals.data)} ${ticker}. Lower the amount to sell.`}
              </p>
            )}

            {/* Preflight: simulation + gas readiness. The wallet only opens when this is ok. */}
            {!swapDone && !shortHoldings && runner.state.phase === "idle" && (
              <>
                {preflight.status === "checking" && (
                  <p className="flex items-center gap-2 text-xs text-ink-3" role="status">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    Simulating {isApproval ? "the approval" : "the swap"} on Robinhood Chain…
                  </p>
                )}
                {preflight.status === "revert" && (
                  <p className="text-sm text-bad" role="alert">
                    {preflight.message}
                  </p>
                )}
                {preflight.status === "error" && (
                  <p className="text-sm text-bad" role="alert">
                    {preflight.message}
                  </p>
                )}
                {preflight.status === "funds" && <GasNotice result={preflight} />}
                {preflight.status === "ok" && (
                  <p className="text-xs text-ok" role="status">
                    Simulation passed. {isApproval ? "Approve the exact amount first, then sign the swap." : "Ready to sign."}
                  </p>
                )}
              </>
            )}

            {showRunnerStatus && <TxStatus state={runner.state} label={isApproval ? "Approval" : ready.side === "buy" ? "Buy" : "Sell"} />}

            {swapDone ? (
              <Button variant="secondary" size="sm" className="self-start" onClick={closeQuote}>
                Done
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="md"
                  loading={runner.busy || (needsAllowance && allowance.isLoading)}
                  disabled={!call || preflight.status !== "ok"}
                  onClick={() => call && runner.run(call)}
                >
                  {isApproval ? `Approve ${ready.fromToken.symbol}` : "Review & sign"}
                </Button>
                <Button size="md" variant="secondary" onClick={closeQuote} disabled={runner.busy}>
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConnectWalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}

function Row({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-right text-ink-1">
        {v}
        {sub && <span className="ml-2 text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}
