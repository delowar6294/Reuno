"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import { useAccount, useReadContract, useSignTypedData } from "wagmi";
import { Button } from "@/components/ui/Button";
import { GasNotice } from "@/components/wallet/GasNotice";
import { TxStatus } from "@/components/wallet/TxStatus";
import { CHAIN } from "@/config/chain";
import { tokenByTicker } from "@/config/tokens";
import { STOCK_TOKEN_NOTICE_SHORT } from "@/data/stocks";
import type { TradeQuote, TradeSide } from "@/lib/market-types";
import { formatEth, formatUsd } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { usePrices } from "@/lib/use-market";
import { addRobinhoodChain } from "@/lib/wallet/addNetwork";
import { isUserRejection, type Eip1193Provider } from "@/lib/wallet/provider";
import type { TxCall } from "@/lib/wallet/tx";
import { usePreflight, useTxRunner } from "@/lib/wallet/useTx";
import { cn } from "@/lib/cn";
import { WalletModal } from "./ConnectWalletModal";
import { SideToggle } from "./SideToggle";
import { SlippageSettings, useSlippage } from "./SlippageSettings";

const CHIPS = ["25", "50", "100"];
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const REFRESH_MS = 15_000;
const DEBOUNCE_MS = 500;

type TxRequest = NonNullable<TradeQuote["transactionRequest"]>;
type QuoteState =
  | { status: "idle" }
  | { status: "loading"; prev?: TradeQuote }
  | { status: "ready"; quote: TradeQuote }
  | { status: "noroute"; message: string }
  | { status: "error"; message: string };

const PERMIT_TYPES = {
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" },
  ],
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" },
  ],
} as const;

function amountError(v: string): string | null {
  if (v.trim() === "") return "Enter an amount in USD.";
  if (!AMOUNT_RE.test(v)) return "Use a positive number with at most 2 decimals.";
  if (Number(v) < 0.01) return "Minimum is $0.01.";
  if (Number(v) > 100_000) return "Amount is above the beta cap.";
  return null;
}

function units(raw: string, decimals: number): number {
  return Number(formatUnits(BigInt(raw), decimals));
}

function fmtNum(n: number): string {
  if (n === 0) return "0";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumSignificantDigits: 4 });
}

const fmtToken = (raw: string, decimals: number) => fmtNum(units(raw, decimals));

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
  const { signTypedDataAsync } = useSignTypedData();
  const prices = usePrices();
  const ethUsd = prices.data?.ethUsd ?? null;
  const [slippageBps, setSlippageBps] = useSlippage();

  const [connectOpen, setConnectOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [quote, setQuote] = useState<QuoteState>({ status: "idle" });
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [approveMax, setApproveMax] = useState(false);
  const [signedTx, setSignedTx] = useState<TxRequest | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const err = amountError(amount);
  const showErr = touched && err;
  const wrongChain = isConnected && chainId !== CHAIN.id;
  const ready = quote.status === "ready" ? quote.quote : quote.status === "loading" ? (quote.prev ?? null) : null;

  // Real decimals, read from the token contract.
  const decimals = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: CHAIN.id,
    query: { enabled: !!token, staleTime: Infinity },
  });

  // Holdings check for sells.
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

  // ERC-20 allowance for sells (to the contract the quote names).
  const needsAllowance = !!ready && ready.side === "sell" && !!ready.approvalAddress && !!address;
  const allowance = useReadContract({
    address: ready?.fromToken.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: needsAllowance ? [address!, ready!.approvalAddress!] : undefined,
    chainId: CHAIN.id,
    query: { enabled: needsAllowance },
  });
  const hasAllowance = !needsAllowance || (allowance.data !== undefined && allowance.data >= BigInt(ready!.fromAmount));
  const needsPermit = !!ready?.permit && !signedTx;

  type Step = "approve" | "permit" | "swap";
  const step: Step | null = !ready ? null : needsAllowance && !hasAllowance ? "approve" : needsPermit ? "permit" : "swap";

  // The next transaction: exact (or unlimited) approval, or the swap itself.
  const call: TxCall | null = useMemo(() => {
    if (!ready || runner.state.phase === "success" || shortHoldings) return null;
    if (step === "approve") {
      if (allowance.data === undefined) return null;
      return {
        kind: "erc20",
        token: ready.fromToken.address,
        functionName: "approve",
        args: [ready.approvalAddress!, approveMax ? maxUint256 : BigInt(ready.fromAmount)],
      };
    }
    if (step === "permit") return null;
    const tr = signedTx ?? ready.transactionRequest;
    if (!tr) return null;
    return { kind: "raw", to: tr.to, data: tr.data, value: BigInt(tr.value) };
  }, [ready, step, allowance.data, approveMax, signedTx, runner.state.phase, shortHoldings]);
  const isApproval = call?.kind === "erc20";

  const { preflight } = usePreflight(wrongChain ? null : call, ticker);

  const busy = panelOpen || quote.status === "loading" || switching || runner.busy || signing || connectOpen;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const resetRunner = runner.reset;
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setQuote({ status: "idle" });
    setSignedTx(null);
    setSignError(null);
    resetRunner();
  }, [resetRunner]);

  // Fetch a quote. Keeps the previous one on screen while refreshing.
  const reqId = useRef(0);
  const fetchQuote = useCallback(async () => {
    if (amountError(amount) || !address) return;
    const id = ++reqId.current;
    setQuote((q) => ({ status: "loading", prev: q.status === "ready" ? q.quote : q.status === "loading" ? q.prev : undefined }));
    try {
      const params = new URLSearchParams({ side, ticker, usd: amount, from: address, slippageBps: String(slippageBps) });
      const res = await fetch(`/api/trade-quote?${params}`);
      const body = (await res.json()) as TradeQuote | { error: string; code?: string };
      if (id !== reqId.current) return;
      if (res.status === 404 && "code" in body && body.code === "NO_ROUTE") {
        setQuote({ status: "noroute", message: `${ticker} can't be swapped at this size right now` });
        return;
      }
      if (!res.ok || "error" in body) {
        setQuote({ status: "error", message: "error" in body ? body.error : "Could not get a quote right now." });
        return;
      }
      if (process.env.NODE_ENV === "development") console.info(`[reuno] ${ticker} ${side} quote via ${body.route} (${body.tool})`);
      setSignedTx(null);
      setQuote({ status: "ready", quote: body });
    } catch {
      if (id === reqId.current) setQuote({ status: "error", message: "Could not reach the quote service. Check your connection." });
    }
  }, [amount, address, side, ticker, slippageBps]);

  // While the panel is open: re-quote 500 ms after the amount or slippage changes…
  const frozen = runner.busy || signing || !!signedTx || runner.state.phase === "success";
  useEffect(() => {
    if (!panelOpen || frozen || amountError(amount)) return;
    const t = setTimeout(() => void fetchQuote(), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // fetchQuote changes with amount / slippage / side; that is the trigger.
  }, [panelOpen, fetchQuote, frozen, amount]);

  // …and refresh every 15 s, unless a signature or transaction is in progress.
  useEffect(() => {
    if (!panelOpen || frozen) return;
    const t = setInterval(() => void fetchQuote(), REFRESH_MS);
    return () => clearInterval(t);
  }, [panelOpen, frozen, fetchQuote]);

  // Escape closes the quote panel (not while a transaction is in flight or a dialog is open).
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !runner.busy && !signing && !document.querySelector('[role="dialog"]')) closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, runner.busy, signing, closePanel]);

  // A side or account change invalidates an open quote (calldata is built for one address).
  useEffect(() => {
    closePanel();
  }, [side, address, closePanel]);

  // After an approval confirms, re-read the allowance and continue with the next step.
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

  const openPanel = () => {
    setTouched(true);
    if (err || !address) return;
    resetRunner();
    setQuote({ status: "loading" });
    // The debounced effect below fetches the first quote and keeps it fresh.
    setPanelOpen(true);
  };

  /** Free off-chain signature that lets the swap spend exactly this amount for 30 minutes. */
  const signPermit = async () => {
    if (!ready?.permit || !ready.v4Plan) return;
    setSigning(true);
    setSignError(null);
    try {
      const v = ready.permit.values;
      const signature = await signTypedDataAsync({
        domain: ready.permit.domain,
        types: PERMIT_TYPES,
        primaryType: "PermitSingle",
        message: {
          details: { token: v.details.token, amount: BigInt(v.details.amount), expiration: Number(v.details.expiration), nonce: Number(v.details.nonce) },
          spender: v.spender,
          sigDeadline: BigInt(v.sigDeadline),
        },
      });
      const res = await fetch("/api/trade-build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: ready.v4Plan, permit: v, signature }),
      });
      const body = (await res.json()) as TxRequest | { error: string };
      if (!res.ok || "error" in body) throw new Error("error" in body ? body.error : "Could not prepare the swap.");
      setSignedTx(body);
    } catch (e) {
      setSignError(isUserRejection(e) ? "Cancelled in wallet" : ((e as Error).message ?? "Could not sign."));
    } finally {
      setSigning(false);
    }
  };

  const panelMotion = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.3, ease: EASE } };

  const swapDone = runner.state.phase === "success" && !isApproval;
  const showRunnerStatus = runner.state.phase !== "idle" && !(runner.state.phase === "success" && isApproval);
  const refreshing = quote.status === "loading" && !!quote.prev;

  // Derived display values (all from the live quote and live prices).
  const view = ready
    ? (() => {
        const fromN = units(ready.fromAmount, ready.fromToken.decimals);
        const toN = units(ready.toAmount, ready.toToken.decimals);
        const tokenN = ready.side === "buy" ? toN : fromN;
        const ethN = ready.side === "buy" ? fromN : toN;
        const feeEth = preflight.status === "ok" ? Number(preflight.gasCostWei) / 1e18 : null;
        return {
          rate: tokenN > 0 ? `1 ${ticker} = ${fmtNum(ethN / tokenN)} ETH` : "—",
          rateUsd: ready.fromAmountUsd !== null && tokenN > 0 ? formatUsd((ready.side === "buy" ? ready.fromAmountUsd : ready.toAmountUsd ?? 0) / tokenN) : undefined,
          feeEth,
          feeUsd: feeEth !== null && ethUsd ? formatUsd(feeEth * ethUsd) : undefined,
        };
      })()
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SideToggle value={side} onChange={onSideChange} />
        </div>
        <SlippageSettings bps={slippageBps} onChange={setSlippageBps} disabled={frozen} />
      </div>

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
            disabled={frozen}
            onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ""))}
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
                disabled={frozen}
                onClick={() => {
                  onAmountChange(c);
                  setTouched(true);
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
        {!panelOpen ? (
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
              <Button size="lg" className="w-full" onClick={openPanel}>
                {`Get ${side} quote · ${ticker}`}
              </Button>
            )}
            {switchError && (
              <p className={cn("text-sm", switchError === "Cancelled in wallet" ? "text-ink-2" : "text-bad")} role="alert">
                {switchError}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="quote"
            className="flex flex-col gap-3 rounded-lg border border-line-2 bg-surface-2 p-4"
            role="region"
            aria-label={`${side} quote for ${ticker}`}
            {...panelMotion}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-mono-label flex items-center gap-2 text-brand-300">
                {side} quote
                {(refreshing || quote.status === "loading") && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.75} aria-label="Refreshing quote" />}
              </span>
              {ready && (
                <span className="mono-num shrink-0 text-xs text-ink-3">
                  {new Date(ready.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>

            {!ready && quote.status === "loading" && (
              <div className="flex flex-col gap-2" aria-label="Loading quote">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="block h-3.5 rounded-sm bg-surface-3 motion-safe:animate-pulse" />
                ))}
              </div>
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

            {ready && view && (
              <>
                <dl className="flex flex-col gap-2 font-mono text-[13px]">
                  <Row k="rate" v={view.rate} sub={view.rateUsd} />
                  <Row
                    k="you receive (est.)"
                    v={`${fmtToken(ready.toAmount, ready.toToken.decimals)} ${ready.toToken.symbol}`}
                    sub={ready.toAmountUsd !== null ? formatUsd(ready.toAmountUsd) : undefined}
                  />
                  <Row k="minimum received" v={`${fmtToken(ready.toAmountMin, ready.toToken.decimals)} ${ready.toToken.symbol}`} />
                  <Row
                    k="price impact"
                    v={ready.priceImpactPct !== null ? `${ready.priceImpactPct < 0.01 ? "<0.01" : ready.priceImpactPct.toFixed(2)}%` : "—"}
                    sub="vs market"
                    tone={ready.priceImpactPct !== null && ready.priceImpactPct > 3 ? "bad" : ready.priceImpactPct !== null && ready.priceImpactPct > 1 ? "warn" : undefined}
                  />
                  <Row
                    k={isApproval ? "network fee (approval)" : "network fee"}
                    v={view.feeEth !== null ? `≈ ${formatEth(BigInt(Math.round(view.feeEth * 1e18)))} ETH` : preflight.status === "checking" ? "estimating…" : "—"}
                    sub={view.feeUsd}
                  />
                  <Row k="slippage" v={`${ready.slippageBps / 100}%`} />
                  {decimals.data !== undefined && <Row k={`${ticker} decimals`} v={`${decimals.data} · on-chain`} />}
                </dl>
                <p className="text-xs text-ink-3">
                  Settles publicly on Robinhood Chain. Private swaps through the five privacy layers launch with the Reuno pool.
                </p>

                {shortHoldings && holdings.data !== undefined && decimals.data !== undefined && (
                  <p className="text-sm text-bad" role="alert">
                    {`You hold ${fmtToken(holdings.data.toString(), decimals.data)} ${ticker}. Lower the amount to sell.`}
                  </p>
                )}

                {/* Sell step 1: approval amount choice. */}
                {step === "approve" && !shortHoldings && runner.state.phase === "idle" && (
                  <fieldset className="flex flex-col gap-1.5 text-xs text-ink-2">
                    <legend className="mb-1 text-ink-3">{`Approve ${ticker} once so it can be sold`}</legend>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name={`${inputId}-approve`} checked={!approveMax} onChange={() => setApproveMax(false)} className="accent-brand-400" />
                      Exact amount ({fmtToken(ready.fromAmount, ready.fromToken.decimals)} {ticker})
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name={`${inputId}-approve`} checked={approveMax} onChange={() => setApproveMax(true)} className="accent-brand-400" />
                      Unlimited (no approval next time)
                    </label>
                  </fieldset>
                )}

                {/* Sell step 2: free signature. */}
                {step === "permit" && !shortHoldings && (
                  <p className="text-xs text-ink-3">
                    {`Next: a free signature (no gas) that lets this swap spend exactly ${fmtToken(ready.fromAmount, ready.fromToken.decimals)} ${ticker} for 30 minutes.`}
                  </p>
                )}
                {signError && (
                  <p className={cn("text-sm", signError === "Cancelled in wallet" ? "text-ink-2" : "text-bad")} role="alert">
                    {signError}
                  </p>
                )}

                {/* Preflight: simulation + gas readiness. The wallet only opens when this is ok. */}
                {!swapDone && !shortHoldings && step !== "permit" && runner.state.phase === "idle" && (
                  <>
                    {preflight.status === "checking" && (
                      <p className="flex items-center gap-2 text-xs text-ink-3" role="status">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                        Simulating {isApproval ? "the approval" : "the swap"} on Robinhood Chain…
                      </p>
                    )}
                    {(preflight.status === "revert" || preflight.status === "error") && (
                      <p className="text-sm text-bad" role="alert">
                        {preflight.message}
                      </p>
                    )}
                    {preflight.status === "funds" && <GasNotice result={preflight} />}
                    {preflight.status === "ok" && (
                      <p className="text-xs text-ok" role="status">
                        {isApproval ? "Simulation passed. Approve first, then sign the swap." : "Simulation passed. Ready to sign."}
                      </p>
                    )}
                  </>
                )}

                {showRunnerStatus && <TxStatus state={runner.state} label={isApproval ? "Approval" : ready.side === "buy" ? "Buy" : "Sell"} />}

                {swapDone ? (
                  <Button variant="secondary" size="sm" className="self-start" onClick={closePanel}>
                    Done
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {step === "permit" ? (
                      <Button size="md" loading={signing} disabled={shortHoldings || wrongChain} onClick={signPermit}>
                        Sign to allow swap
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        loading={runner.busy || (needsAllowance && allowance.isLoading)}
                        disabled={!call || preflight.status !== "ok"}
                        onClick={() => call && runner.run(call)}
                      >
                        {isApproval ? `Approve ${ticker}` : "Review & sign"}
                      </Button>
                    )}
                    <Button size="md" variant="secondary" onClick={closePanel} disabled={runner.busy || signing}>
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
            {!ready && quote.status !== "loading" && (
              <Button size="md" variant="secondary" onClick={closePanel}>
                Close
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <WalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}

function Row({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: "warn" | "bad" }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-3">{k}</dt>
      <dd className={cn("text-right", tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-ink-1")}>
        {v}
        {sub && <span className="ml-2 text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}
