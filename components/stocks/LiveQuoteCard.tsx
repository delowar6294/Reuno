"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { Check, Copy, ExternalLink, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { RollingDigits } from "@/components/ui/RollingDigits";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatusDot } from "@/components/ui/StatusDot";
import { TradePanel } from "@/components/trade/TradePanel";
import { AddTokenButton } from "@/components/wallet/AddTokenButton";
import { CHAIN, explorerTokenUrl } from "@/config/chain";
import type { LiveQuote, TradeSide } from "@/lib/market-types";
import { changeWords, formatCompactUsd, formatPct, formatUsd, shortAddress } from "@/lib/format";
import { useQuotes } from "@/lib/use-market";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

const CARD = "panel-highlight rounded-xl border border-line-1 bg-grad-card p-5 md:p-6";

function Change({ pct, className }: { pct: number; className?: string }) {
  if (pct > 0) return <span className={cn("mono-num text-sm text-ok", className)}>▲ {formatPct(pct)}</span>;
  if (pct < 0) return <span className={cn("mono-num text-sm text-bad", className)}>▼ {formatPct(pct)}</span>;
  return <span className={cn("mono-num text-sm text-ink-3", className)}>0.00%</span>;
}

function Avatar({ ticker, size = 44 }: { ticker: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="mono-num inline-flex shrink-0 items-center justify-center rounded-full border border-line-2 bg-surface-3 text-ink-1"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {ticker[0]}
    </span>
  );
}

function CopyAddress({ address }: { address: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          setDone(false);
        }
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-ink-3 transition-colors duration-[180ms] hover:bg-surface-3 hover:text-ink-1"
      aria-label={done ? "Copied" : "Copy contract address"}
    >
      {done ? (
        <Check className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}

function Skeleton() {
  const block = "rounded-sm bg-surface-3 motion-safe:animate-pulse";
  return (
    <div className={CARD} aria-busy="true" aria-label="Loading live prices">
      <div className="flex justify-between">
        <span className={cn(block, "h-3 w-32")} />
        <span className={cn(block, "h-3 w-24")} />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-surface-3 motion-safe:animate-pulse" />
          <div className="flex flex-col gap-2">
            <span className={cn(block, "h-5 w-16")} />
            <span className={cn(block, "h-3 w-28 bg-surface-2")} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={cn(block, "h-7 w-28")} />
          <span className={cn(block, "h-3 w-14 bg-surface-2")} />
        </div>
      </div>
      <span className={cn(block, "mt-6 block h-[140px] w-full bg-surface-2")} />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn(block, "h-3 w-full bg-surface-2")} />
        ))}
      </div>
      <span className={cn(block, "mt-6 block h-11 w-full")} />
    </div>
  );
}

function Unavailable({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <span className="text-mono-label flex items-center gap-2 text-ink-3">
          <StatusDot tone="warn" />
          reuno_quote · offline
        </span>
        <span className="text-mono-label text-brand-300">chain_id {CHAIN.id}</span>
      </div>
      <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-ink-1">Live prices are unavailable right now</p>
        <Button variant="secondary" size="sm" loading={retrying} onClick={onRetry}>
          <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Retry
        </Button>
      </div>
    </div>
  );
}

function BackCard({ q }: { q: LiveQuote }) {
  return (
    <div className={cn(CARD, "flex h-full items-end justify-between")}>
      <span className="mono-num text-ink-2">{q.ticker}</span>
      <span className="mono-num text-ink-2">{formatUsd(q.priceUsd)}</span>
    </div>
  );
}

export function LiveQuoteCard() {
  const { data, error, isLoading, mutate, isValidating } = useQuotes();
  const reduce = useReducedMotion();
  const quotes = useMemo(() => data?.quotes ?? [], [data]);

  const [active, setActive] = useState<string | null>(null);
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("50");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const idx = Math.max(0, quotes.findIndex((q) => q.ticker === active));
  const q = quotes[idx];

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (quotes.length < 2) return;
      const next = quotes[(idx + delta + quotes.length) % quotes.length];
      setActive(next.ticker);
      setAmount("50");
    },
    [quotes, idx],
  );

  const select = (ticker: string) => {
    if (ticker === q?.ticker) return;
    setActive(ticker);
    setAmount("50");
  };

  const paused = reduce || hovered || focused || busy || hidden || quotes.length < 2;
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(1), 5000);
    return () => clearInterval(id);
  }, [paused, go]);

  if (isLoading && !data) return <Skeleton />;
  if (!q) return <Unavailable onRetry={() => void mutate()} retrying={isValidating} />;

  const reconnecting = !!error;
  const nextTwo = quotes.length > 1 ? [1, 2].filter((n) => n < quotes.length).map((n) => quotes[(idx + n) % quotes.length]) : [];

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x <= -60) go(1);
    else if (info.offset.x >= 60) go(-1);
  };

  const swap = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.3, ease: EASE } };

  return (
    <div className="relative mx-auto w-full max-w-[460px] lg:ml-auto lg:mr-0">
      {/* Intentional stack: the next live tickers peek out below the card. */}
      {nextTwo.map((n, i) => (
        <div
          key={n.ticker}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 hidden origin-bottom sm:block",
            i === 0 ? "translate-y-3 scale-[0.96] opacity-[0.55]" : "translate-y-6 scale-[0.92] opacity-30",
          )}
          style={{ zIndex: 2 - i }}
        >
          <BackCard q={n} />
        </div>
      ))}

      <div
        className={cn(CARD, "relative z-10")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        onKeyDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.tagName === "INPUT" || t.getAttribute("role") === "tab") return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          }
        }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Live stock token quotes"
      >
        <span className="sr-only" aria-live="polite">
          {`${q.ticker}, ${formatUsd(q.priceUsd)}, ${changeWords(q.changePct24h)}`}
        </span>

        {/* 3.1 header */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-mono-label flex items-center gap-2 text-ink-3">
            <StatusDot tone={reconnecting ? "warn" : "ok"} />
            {reconnecting ? "reuno_quote · reconnecting" : "reuno_quote · live"}
          </span>
          <span className="text-mono-label text-brand-300">chain_id {CHAIN.id}</span>
        </div>

        <motion.div
          drag={coarse && quotes.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
          className="touch-pan-y"
        >
          {/* 3.2 token row */}
          <div className="mt-5 flex items-start justify-between gap-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={q.ticker} className="flex min-w-0 items-center gap-3" {...swap}>
                <Avatar ticker={q.ticker} />
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-2xl font-semibold leading-tight text-ink-1">{q.ticker}</span>
                    <AddTokenButton address={q.address} symbol={q.ticker} />
                  </span>
                  <span className="truncate text-sm text-ink-3">
                    {q.name} · {q.kind}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <RollingDigits
                value={formatUsd(q.priceUsd)}
                className="text-[28px] leading-none text-silver-100 sm:text-[32px]"
                duration={0.8}
              />
              <Change pct={q.changePct24h} />
            </div>
          </div>

          {/* 3.3 chart */}
          <Sparkline
            className="mt-5"
            series={q.series}
            times={q.seriesTimes}
            ticker={q.ticker}
            changePct={q.changePct24h}
            updatedAt={q.updatedAt}
            hourly={q.source === "dexscreener+geckoterminal"}
          />
        </motion.div>

        {/* 3.4 detail rows */}
        <dl className="mt-5 divide-y divide-line-1 font-mono text-[13px]">
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-ink-3">pool depth</dt>
            <dd className="text-ink-1">{formatCompactUsd(q.liquidityUsd)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-ink-3">contract</dt>
            <dd className="flex items-center gap-1 text-ink-1">
              <a
                href={explorerTokenUrl(q.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm underline-offset-4 hover:text-brand-200 hover:underline"
                aria-label={`${q.ticker} contract ${q.address} on the Robinhood Chain explorer`}
              >
                {shortAddress(q.address)}
              </a>
              <CopyAddress address={q.address} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-ink-3">route</dt>
            <dd className="text-ink-1">LI.FI · public swap</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-ink-3">signed by</dt>
            <dd className="text-ink-1">your wallet</dd>
          </div>
        </dl>
        <a
          href={q.poolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-brand-300 underline-offset-4 transition-colors duration-[180ms] hover:text-brand-200 hover:underline"
        >
          View pool →
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        </a>

        {/* 3.5 trade */}
        <div className="mt-5">
          <TradePanel
            key={q.ticker}
            ticker={q.ticker}
            side={side}
            onSideChange={setSide}
            amount={amount}
            onAmountChange={setAmount}
            onBusyChange={setBusy}
          />
        </div>

        {/* 3.6 footer */}
        <div className="mt-5 flex items-center justify-between gap-3">
          {quotes.length > 1 ? (
            <div className="flex items-center gap-1" aria-label="Choose a ticker">
              {quotes.map((x) => {
                const on = x.ticker === q.ticker;
                return (
                  <button
                    key={x.ticker}
                    type="button"
                    onClick={() => select(x.ticker)}
                    aria-label={`Show ${x.ticker}`}
                    aria-current={on ? "true" : undefined}
                    className="flex h-6 items-center justify-center rounded-full px-1"
                  >
                    <span
                      className={cn(
                        "block h-1.5 rounded-full transition-all duration-[180ms]",
                        on ? "w-5 bg-brand-400" : "w-1.5 bg-surface-3 hover:bg-line-3",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          <Pill dot="brand">unsigned · you sign</Pill>
        </div>
      </div>
    </div>
  );
}
