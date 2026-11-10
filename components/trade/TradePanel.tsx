"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/Button";
import { CHAIN, explorerTxUrl } from "@/config/chain";
import type { TradeQuote, TradeSide } from "@/lib/market-types";
import { formatUsd, shortAddress } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { SideToggle } from "./SideToggle";

const CHIPS = ["25", "50", "100"];
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quote: TradeQuote }
  | { status: "noroute" }
  | { status: "error"; message: string };

function amountError(v: string): string | null {
  if (v.trim() === "") return "Enter an amount in USD.";
  if (!AMOUNT_RE.test(v)) return "Use a positive number with at most 2 decimals.";
  if (Number(v) <= 0) return "Amount must be more than $0.";
  if (Number(v) > 100_000) return "Amount is above the beta cap.";
  return null;
}

function fmtToken(raw: string, decimals: number): string {
  const n = Number(formatUnits(BigInt(raw), decimals));
  if (n === 0) return "0";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toPrecision(4);
}

function walletError(err: unknown): string {
  const e = err as { shortMessage?: string; message?: string; name?: string };
  if (e?.name === "UserRejectedRequestError" || /reject|denied/i.test(e?.message ?? "")) {
    return "Request cancelled in your wallet.";
  }
  return e?.shortMessage ?? e?.message ?? "Something went wrong.";
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
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: switching, error: switchError } = useSwitchChain();
  const { sendTransactionAsync, isPending: sending } = useSendTransaction();
  const { writeContractAsync, isPending: approving } = useWriteContract();

  const [connectOpen, setConnectOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [quote, setQuote] = useState<QuoteState>({ status: "idle" });
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [approveHash, setApproveHash] = useState<`0x${string}` | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const err = amountError(amount);
  const showErr = touched && err;
  const wrongChain = isConnected && chainId !== CHAIN.id;
  const ready = quote.status === "ready" ? quote.quote : null;

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
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash ?? undefined, chainId: CHAIN.id });
  const txReceipt = useWaitForTransactionReceipt({ hash: txHash ?? undefined, chainId: CHAIN.id });

  const refetchAllowance = allowance.refetch;
  useEffect(() => {
    if (approveReceipt.isSuccess) void refetchAllowance();
  }, [approveReceipt.isSuccess, refetchAllowance]);

  const hasAllowance =
    !needsAllowance || (allowance.data !== undefined && allowance.data >= BigInt(ready!.fromAmount));

  const quoteOpen = quote.status === "ready" || txHash !== null;
  const busy = quoteOpen || quote.status === "loading" || switching || sending || approving || connectOpen;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const closeQuote = useCallback(() => {
    setQuote({ status: "idle" });
    setTxHash(null);
    setApproveHash(null);
    setActionError(null);
  }, []);

  // Escape closes the quote panel.
  useEffect(() => {
    if (!quoteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending && !approving) closeQuote();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [quoteOpen, sending, approving, closeQuote]);

  // Side change invalidates an open quote.
  useEffect(() => {
    closeQuote();
  }, [side, closeQuote]);

  const getQuote = async () => {
    setTouched(true);
    if (err || !address) return;
    setActionError(null);
    setQuote({ status: "loading" });
    try {
      const params = new URLSearchParams({ side, ticker, usd: amount, from: address });
      const res = await fetch(`/api/trade-quote?${params}`);
      const body = (await res.json()) as TradeQuote | { error: string; code?: string };
      if (res.status === 404 && "code" in body && body.code === "NO_ROUTE") {
        setQuote({ status: "noroute" });
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

  const approve = async () => {
    if (!ready?.approvalAddress) return;
    setActionError(null);
    try {
      const hash = await writeContractAsync({
        address: ready.fromToken.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ready.approvalAddress, BigInt(ready.fromAmount)],
        chainId: CHAIN.id,
      });
      setApproveHash(hash);
    } catch (e) {
      setActionError(walletError(e));
    }
  };

  const sign = async () => {
    if (!ready) return;
    setActionError(null);
    const tr = ready.transactionRequest;
    try {
      // The user's own wallet reviews and signs. Reuno never signs anything.
      const hash = await sendTransactionAsync({
        to: tr.to,
        data: tr.data,
        value: BigInt(tr.value),
        gas: tr.gasLimit ? BigInt(tr.gasLimit) : undefined,
        chainId: CHAIN.id,
      });
      setTxHash(hash);
    } catch (e) {
      setActionError(walletError(e));
    }
  };

  const panelMotion = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.3, ease: EASE } };

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

      <AnimatePresence mode="wait" initial={false}>
        {!quoteOpen ? (
          <motion.div key="action" className="flex flex-col gap-2" {...panelMotion}>
            {!isConnected ? (
              <Button size="lg" className="w-full" onClick={() => setConnectOpen(true)}>
                Connect wallet
              </Button>
            ) : wrongChain ? (
              <Button size="lg" className="w-full" loading={switching} onClick={() => switchChain({ chainId: CHAIN.id })}>
                Switch to Robinhood Chain
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                loading={quote.status === "loading"}
                disabled={quote.status === "noroute"}
                onClick={getQuote}
              >
                {`Get ${side} quote · ${ticker}`}
              </Button>
            )}
            {quote.status === "noroute" && (
              <p className="text-sm text-ink-2" role="status">
                Route not available yet for this pair and size.
              </p>
            )}
            {quote.status === "error" && (
              <p className="text-sm text-bad" role="alert">
                {quote.message}
              </p>
            )}
            {switchError && (
              <p className="text-sm text-bad" role="alert">
                {walletError(switchError)}
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
            <div className="flex items-center justify-between">
              <span className="text-mono-label text-brand-300">li.fi quote · {ready.tool.toLowerCase()}</span>
              <span className="mono-num text-xs text-ink-3">
                {new Date(ready.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <dl className="flex flex-col gap-2 font-mono text-[13px]">
              <Row k="you pay" v={`${fmtToken(ready.fromAmount, ready.fromToken.decimals)} ${ready.fromToken.symbol}`} sub={ready.fromAmountUsd !== null ? formatUsd(ready.fromAmountUsd) : undefined} />
              <Row k="you receive" v={`${fmtToken(ready.toAmount, ready.toToken.decimals)} ${ready.toToken.symbol}`} sub={ready.toAmountUsd !== null ? formatUsd(ready.toAmountUsd) : undefined} />
              <Row k="minimum received" v={`${fmtToken(ready.toAmountMin, ready.toToken.decimals)} ${ready.toToken.symbol}`} />
              <Row k="route fees" v={formatUsd(ready.feesUsd)} />
              <Row k="network gas" v={formatUsd(ready.gasUsd)} />
            </dl>
            <p className="text-xs text-ink-3">
              Settles publicly on Robinhood Chain through LI.FI. Private routing through the five layers launches with the Reuno pool.
            </p>

            {txHash ? (
              <div className="flex flex-col gap-2 rounded-sm border border-line-1 bg-surface-1 p-3" role="status">
                <span className="text-sm text-ink-1">
                  {txReceipt.isSuccess
                    ? txReceipt.data.status === "success"
                      ? "Confirmed on Robinhood Chain."
                      : "Transaction reverted."
                    : "Sent. Waiting for confirmation…"}
                </span>
                <a
                  href={explorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline"
                >
                  {shortAddress(txHash, 10, 8)}
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </a>
                <Button variant="secondary" size="sm" className="self-start" onClick={closeQuote}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {needsAllowance && !hasAllowance ? (
                  <Button size="md" loading={approving || (approveHash !== null && approveReceipt.isLoading) || allowance.isLoading} onClick={approve}>
                    {`Approve ${ready.fromToken.symbol}`}
                  </Button>
                ) : (
                  <Button size="md" loading={sending} onClick={sign}>
                    Review &amp; sign
                  </Button>
                )}
                <Button size="md" variant="secondary" onClick={closeQuote} disabled={sending || approving}>
                  Cancel
                </Button>
              </div>
            )}
            {approveHash && !approveReceipt.isSuccess && (
              <p className="flex items-center gap-2 text-xs text-ink-3" role="status">
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                Waiting for the approval to confirm…
              </p>
            )}
            {actionError && (
              <p className="text-sm text-bad" role="alert">
                {actionError}
              </p>
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
