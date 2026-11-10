"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CardHeader, Divider } from "@/components/ui/Card";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { Pill } from "@/components/ui/Pill";
import { StatusDot } from "@/components/ui/StatusDot";
import { Tooltip } from "@/components/ui/Tooltip";
import { HERO_TICKERS } from "@/data/stocks";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

const W = 280;
const H = 72;

/** Deterministic illustrative curve per ticker (not price data). */
function curve(seed: number): string {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const y =
      0.5 +
      Math.sin(t * Math.PI * (1.6 + seed * 0.35) + seed) * 0.22 +
      Math.sin(t * Math.PI * 7 + seed * 2) * 0.07 -
      t * 0.18;
    return [t * W, Math.min(0.92, Math.max(0.08, y)) * H] as const;
  });
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

export function StocksHeroVisual() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const active = HERO_TICKERS[i];

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % HERO_TICKERS.length), 3200);
    return () => clearInterval(id);
  }, [reduce]);

  const path = curve(i + 1);

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      {/* stacked card behind, for depth */}
      <div
        aria-hidden="true"
        className="card absolute inset-x-6 -bottom-4 top-6 opacity-60 lg:inset-x-8"
      />

      <div className="card panel-highlight relative p-5 md:p-6">
        <CardHeader
          left="reuno_quote · demo"
          right={<span className="text-mono-label text-brand-300">chain_id 4663</span>}
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.ticker}
              className="flex items-center gap-3"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <LetterAvatar text={active.ticker} size={40} />
              <div className="flex flex-col">
                <span className="mono-num text-xl text-ink-1">{active.ticker}</span>
                <span className="text-xs text-ink-3">{active.label}</span>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex flex-col items-end">
            <Tooltip content="live prices in app">
              <span tabIndex={0} className="mono-num rounded-sm text-[28px] leading-none text-silver-100">
                $—
              </span>
            </Tooltip>
            <span className="mono-num mt-1 text-xs text-ink-3">24h —</span>
          </div>
        </div>

        <div className="relative mt-5">
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${W} ${H}`}
            className="h-[72px] w-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="stock-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-400)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--brand-400)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              key={`a-${i}`}
              d={`${path} L${W} ${H} L0 ${H} Z`}
              fill="url(#stock-area)"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
            />
            <motion.path
              key={`l-${i}`}
              d={path}
              fill="none"
              className="stroke-brand-400"
              strokeWidth={1.75}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: EASE }}
            />
          </svg>
          <span className="text-mono-label absolute right-0 top-0 text-ink-3">illustrative</span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
          {[
            ["pool depth", "—"],
            ["settles in", "ETH"],
            ["route", "LI.FI → 5 layers"],
            ["signed by", "your wallet"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-ink-3">{k}</dt>
              <dd className="text-right text-ink-1">{v}</dd>
            </div>
          ))}
        </dl>

        <Divider className="mt-5" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Tooltip content="demo" className="w-full">
            <Button size="sm" disabled className="w-full">
              Buy
            </Button>
          </Tooltip>
          <Tooltip content="demo" className="w-full">
            <Button size="sm" variant="secondary" disabled className="w-full">
              Sell
            </Button>
          </Tooltip>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {HERO_TICKERS.map((t, n) => (
              <span
                key={t.ticker}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-[180ms]",
                  n === i ? "w-5 bg-brand-400" : "w-1.5 bg-surface-3",
                )}
              />
            ))}
          </span>
          <Pill dot="warn" className="h-6 text-[11px]">
            unsigned · you sign
          </Pill>
        </div>
      </div>

      {/* floating chip */}
      <div className="absolute -left-2 -top-5 hidden items-center gap-2 rounded-full border border-line-2 bg-surface-2 px-3 py-1.5 shadow-glow-soft sm:flex lg:-left-6">
        <StatusDot tone="ok" />
        <span className="text-mono-label text-ink-2">private by default</span>
      </div>
    </div>
  );
}
