"use client";

import { getPublicClient, sendTransaction, switchChain } from "@wagmi/core";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import useSWR from "swr";
import { formatUnits } from "viem";
import { useAccount, useBalance, useConfig } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { inputClass } from "@/components/app/fields";
import { BRIDGE_SOURCE_CHAINS, bridgeChainById } from "@/config/bridge";
import { CHAIN, explorerTxUrl } from "@/config/chain";
import type { BridgeQuote, BridgeStatus } from "@/lib/market-types";
import { formatEthCeil, formatUsd, shortAddress } from "@/lib/format";
import { usePrices } from "@/lib/use-market";
import { addRobinhoodChain } from "@/lib/wallet/addNetwork";
import { isUserRejection, type Eip1193Provider } from "@/lib/wallet/provider";
import { explainRevert } from "@/lib/wallet/revert";
import { cn } from "@/lib/cn";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

type Phase =
  | { k: "idle" }
  | { k: "quoting" }
  | { k: "quoted"; quote: BridgeQuote }
  | { k: "switching"; quote: BridgeQuote }
  | { k: "simulating"; quote: BridgeQuote }
  | { k: "wallet"; quote: BridgeQuote }
  | { k: "sent"; quote: BridgeQuote; hash: `0x${string}` }
  | { k: "error"; message: string; quote?: BridgeQuote };

const fmt = (raw: string, decimals: number) =>
  Number(formatUnits(BigInt(raw), decimals)).toLocaleString("en-US", { maximumSignificantDigits: 5 });

const statusFetcher = async (url: string): Promise<BridgeStatus> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("status unavailable");
  return res.json();
};

/** Bridge native gas from the user's current chain to ETH on Robinhood Chain (LI.FI internally), signed in their wallet. */
export function BridgeModal({
  open,
  onClose,
  shortfallWei = null,
}: {
  open: boolean;
  onClose: () => void;
  /** How much ETH the wallet is short on Robinhood Chain, used to pre-fill the amount. */
  shortfallWei?: bigint | null;
}) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address, chainId, isConnected, connector } = useAccount();
  const ids = useId();
  const supported = chainId !== undefined && !!bridgeChainById(chainId);
  const [src, setSrc] = useState<number>(supported ? chainId! : BRIDGE_SOURCE_CHAINS[0].id);
  const [usd, setUsd] = useState("5");
  const [edited, setEdited] = useState(false);
  const prices = usePrices();
  const ethUsd = prices.data?.ethUsd ?? null;
  const shortfallUsd = shortfallWei !== null && ethUsd ? (Number(shortfallWei) / 1e18) * ethUsd : null;

  // Pre-fill with the live shortfall plus 10% headroom for price moves and bridge fees, rounded up to whole dollars.
  useEffect(() => {
    if (!edited && shortfallUsd !== null) setUsd(String(Math.max(2, Math.ceil(shortfallUsd * 1.1))));
  }, [edited, shortfallUsd]);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const srcChain = bridgeChainById(src)!;

  // Default to the wallet's current chain when it is one of the supported sources.
  useEffect(() => {
    if (open && supported && phase.k === "idle") setSrc(chainId!);
  }, [open, supported, chainId, phase.k]);

  const srcBalance = useBalance({ address, chainId: src, query: { enabled: open && !!address } });
  const amountErr = !AMOUNT_RE.test(usd) ? "Use a number with at most 2 decimals." : Number(usd) < 1 ? "Minimum is $1." : Number(usd) > 10_000 ? "Maximum is $10,000." : null;

  const sent = phase.k === "sent" ? phase : null;
  const status = useSWR<BridgeStatus>(
    sent ? `/api/bridge-status?txHash=${sent.hash}&fromChain=${sent.quote.fromChainId}&bridge=${encodeURIComponent(sent.quote.tool.toLowerCase())}` : null,
    statusFetcher,
    {
      refreshInterval: (d) => (d && (d.status === "DONE" || d.status === "FAILED") ? 0 : 10_000),
      revalidateOnFocus: false,
    },
  );
  const done = status.data?.status === "DONE";
  const failed = status.data?.status === "FAILED";

  useEffect(() => {
    if (done) void queryClient.invalidateQueries();
  }, [done, queryClient]);

  const reset = () => setPhase({ k: "idle" });

  const getQuote = async () => {
    if (!address || amountErr) return;
    setPhase({ k: "quoting" });
    try {
      const res = await fetch(`/api/bridge-quote?${new URLSearchParams({ fromChain: String(src), usd, from: address })}`);
      const body = (await res.json()) as BridgeQuote | { error: string };
      if (!res.ok || "error" in body) {
        setPhase({ k: "error", message: "error" in body ? body.error : "Could not get a bridge quote." });
        return;
      }
      setPhase({ k: "quoted", quote: body });
    } catch {
      setPhase({ k: "error", message: "Could not reach the quote service." });
    }
  };

  const sign = async (quote: BridgeQuote) => {
    if (!address) return;
    const tr = quote.transactionRequest;
    try {
      if (chainId !== quote.fromChainId) {
        setPhase({ k: "switching", quote });
        await switchChain(config, { chainId: quote.fromChainId as (typeof BRIDGE_SOURCE_CHAINS)[number]["id"] });
      }
      setPhase({ k: "simulating", quote });
      const pc = getPublicClient(config, { chainId: quote.fromChainId as (typeof BRIDGE_SOURCE_CHAINS)[number]["id"] });
      if (!pc) throw new Error("No RPC for the source chain");
      const value = BigInt(tr.value);
      const from = bridgeChainById(quote.fromChainId)!;
      const balance = await pc.getBalance({ address });
      const shortMsg = (need: bigint) =>
        `Your wallet has ${fmt(balance.toString(), 18)} ${from.nativeCurrency.symbol} on ${from.name}; this needs about ${fmt(need.toString(), 18)} ${from.nativeCurrency.symbol} including gas. Lower the amount or pick another chain.`;
      if (balance < value) {
        setPhase({ k: "error", quote, message: shortMsg(value) });
        return;
      }
      try {
        await pc.call({ account: address, to: tr.to, data: tr.data, value });
      } catch (e) {
        const msg = /insufficient funds/i.test((e as { message?: string }).message ?? "") ? shortMsg(value) : explainRevert(e);
        setPhase({ k: "error", quote, message: msg });
        return;
      }
      const gas = ((await pc.estimateGas({ account: address, to: tr.to, data: tr.data, value })) * BigInt(120)) / BigInt(100);
      let fees: { maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint } = {};
      try {
        fees = await pc.estimateFeesPerGas();
      } catch {
        // Chain without EIP-1559 fee data: let the wallet price gas.
      }
      const gasCost = gas * (fees.maxFeePerGas ?? (await pc.getGasPrice()));
      if (balance < value + gasCost) {
        setPhase({ k: "error", quote, message: shortMsg(value + gasCost) });
        return;
      }
      setPhase({ k: "wallet", quote });
      const hash = await sendTransaction(config, {
        account: address,
        chainId: quote.fromChainId as (typeof BRIDGE_SOURCE_CHAINS)[number]["id"],
        to: tr.to,
        data: tr.data,
        value,
        gas,
        ...(fees.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
      });
      setPhase({ k: "sent", quote, hash });
    } catch (e) {
      setPhase({
        k: "error",
        quote,
        message: isUserRejection(e) ? "Cancelled in wallet" : ((e as { shortMessage?: string }).shortMessage ?? "Could not send the bridge transaction."),
      });
    }
  };

  const switchBack = async () => {
    const provider = connector ? ((await connector.getProvider()) as Eip1193Provider) : null;
    await addRobinhoodChain(provider);
  };

  const quote = "quote" in phase ? phase.quote : undefined;
  const working = phase.k === "quoting" || phase.k === "switching" || phase.k === "simulating" || phase.k === "wallet";
  const srcExplorer = srcChain.blockExplorers?.default.url;

  return (
    <Modal open={open} onClose={onClose} title="Get ETH on Robinhood Chain">
      <p className="text-sm text-ink-2">
        Bridge your chain&apos;s gas token to ETH on Robinhood Chain. You sign on the source chain; the ETH
        arrives at the same address.
      </p>

      {shortfallWei !== null && shortfallWei > BigInt(0) && (
        <p className="mt-3 text-sm text-ink-1">
          You need about {formatEthCeil(shortfallWei)} ETH more on Robinhood Chain
          {shortfallUsd !== null ? ` (≈ ${formatUsd(shortfallUsd)})` : ""}.
        </p>
      )}

      {!isConnected || !address ? (
        <p className="mt-6 text-sm text-ink-2">Connect a wallet first.</p>
      ) : sent ? (
        <div className="mt-6 flex flex-col gap-4" role="status" aria-live="polite">
          <ol className="flex flex-col gap-3 text-sm">
            <Step state="done" label={`Sent on ${srcChain.name}`}>
              {srcExplorer && (
                <TxLink href={`${srcExplorer}/tx/${sent.hash}`} hash={sent.hash} />
              )}
            </Step>
            <Step
              state={failed ? "failed" : done ? "done" : "active"}
              label={
                failed
                  ? `Bridge failed${status.data?.substatusMessage ? `: ${status.data.substatusMessage}` : ""}`
                  : done
                    ? "Bridged"
                    : `Bridging${status.data?.substatusMessage ? ` · ${status.data.substatusMessage}` : "…"}`
              }
            />
            <Step state={done ? "done" : failed ? "failed" : "todo"} label="Received on Robinhood Chain">
              {done && status.data?.receivingTxHash && (
                <TxLink href={explorerTxUrl(status.data.receivingTxHash)} hash={status.data.receivingTxHash} />
              )}
            </Step>
          </ol>
          {status.error && <p className="text-xs text-ink-3">Status check failed; retrying every 10 seconds.</p>}
          {done && chainId !== CHAIN.id && (
            <Button size="md" onClick={switchBack}>
              Switch back to Robinhood Chain
            </Button>
          )}
          {(done || failed) && (
            <Button size="md" variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${ids}-chain`} className="text-mono-label text-ink-3">
                from chain
              </label>
              <select
                id={`${ids}-chain`}
                value={src}
                disabled={working}
                onChange={(e) => {
                  setSrc(Number(e.target.value));
                  reset();
                }}
                className={cn(inputClass, "appearance-none")}
              >
                {BRIDGE_SOURCE_CHAINS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface-1">
                    {c.name} · {c.nativeCurrency.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`${ids}-usd`} className="text-mono-label text-ink-3">
                amount in usd
              </label>
              <input
                id={`${ids}-usd`}
                inputMode="decimal"
                autoComplete="off"
                value={usd}
                disabled={working}
                onChange={(e) => {
                  setUsd(e.target.value.replace(/[^0-9.]/g, ""));
                  setEdited(true);
                  if (phase.k !== "idle") reset();
                }}
                aria-invalid={amountErr ? true : undefined}
                className={cn(inputClass, "mono-num", amountErr && "border-bad")}
              />
            </div>
          </div>
          <p className="text-xs text-ink-3">
            {srcBalance.data
              ? `Your balance on ${srcChain.name}: ${fmt(srcBalance.data.value.toString(), srcBalance.data.decimals)} ${srcBalance.data.symbol}`
              : srcBalance.isLoading
                ? `Reading your balance on ${srcChain.name}…`
                : `Balance on ${srcChain.name} unavailable.`}
          </p>
          {amountErr && <p className="text-sm text-bad">{amountErr}</p>}

          {quote && (
            <dl className="flex flex-col gap-2 rounded-sm border border-line-1 bg-surface-1 p-3 font-mono text-[13px]">
              <Row k="you send" v={`${fmt(quote.fromAmount, quote.fromToken.decimals)} ${quote.fromToken.symbol}`} sub={quote.fromAmountUsd !== null ? formatUsd(quote.fromAmountUsd) : undefined} />
              <Row k="you receive" v={`${fmt(quote.toAmount, quote.toToken.decimals)} ETH`} sub="Robinhood Chain" />
              <Row k="minimum" v={`${fmt(quote.toAmountMin, quote.toToken.decimals)} ETH`} />
              <Row k="fees" v={formatUsd(quote.feesUsd)} />
              {quote.durationSec !== null && <Row k="est. time" v={quote.durationSec < 90 ? `${quote.durationSec}s` : `${Math.round(quote.durationSec / 60)} min`} />}
            </dl>
          )}

          {phase.k === "error" && (
            <p className={cn("text-sm", phase.message === "Cancelled in wallet" ? "text-ink-2" : "text-bad")} role="alert">
              {phase.message}
            </p>
          )}
          {(phase.k === "switching" || phase.k === "simulating" || phase.k === "wallet") && (
            <p className="flex items-center gap-2 text-sm text-ink-2" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />
              {phase.k === "switching" ? `Switching your wallet to ${srcChain.name}…` : phase.k === "simulating" ? "Simulating…" : "Confirm in your wallet…"}
            </p>
          )}

          {quote ? (
            <div className="grid grid-cols-2 gap-3">
              <Button size="md" loading={working} onClick={() => sign(quote)}>
                Review &amp; sign
              </Button>
              <Button size="md" variant="secondary" disabled={working} onClick={reset}>
                New quote
              </Button>
            </div>
          ) : (
            <Button size="md" loading={phase.k === "quoting"} disabled={!!amountErr} onClick={getQuote}>
              Get bridge quote
            </Button>
          )}
        </div>
      )}
    </Modal>
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

function Step({ state, label, children }: { state: "done" | "active" | "todo" | "failed"; label: string; children?: React.ReactNode }) {
  const Icon = state === "done" ? CheckCircle2 : state === "failed" ? XCircle : state === "active" ? Loader2 : Circle;
  return (
    <li className="flex items-start gap-3">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          state === "done" ? "text-ok" : state === "failed" ? "text-bad" : state === "active" ? "animate-spin text-brand-300" : "text-ink-3",
        )}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="flex flex-col gap-1">
        <span className={state === "todo" ? "text-ink-3" : "text-ink-1"}>{label}</span>
        {children}
      </span>
    </li>
  );
}

function TxLink({ href, hash }: { href: string; hash: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-xs text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline"
    >
      {shortAddress(hash, 10, 8)}
      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
    </a>
  );
}
