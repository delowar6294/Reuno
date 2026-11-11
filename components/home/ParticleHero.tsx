"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Container } from "@/components/layout/Container";
import { ModalButton } from "@/components/modals/ModalButton";
import { Button } from "@/components/ui/Button";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { ContractAddress } from "@/components/ui/ContractAddress";
import { REUNO_TOKEN_ADDRESS } from "@/config/reuno-token";
import { LAYERS } from "@/data/layers";
import { SUPPORTING_LINE } from "@/data/site";
import type { LiveQuote } from "@/lib/market-types";
import { formatPct, formatUsd } from "@/lib/format";
import { usePrices, useQuotes } from "@/lib/use-market";
import { cn } from "@/lib/cn";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "stock", label: "Stocks" },
  { id: "etf", label: "ETFs" },
  { id: "up", label: "Up 24h" },
  { id: "down", label: "Down 24h" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

const pass = (q: LiveQuote, f: Filter) =>
  f === "all" ||
  (f === "stock" && q.kind === "Stock token") ||
  (f === "etf" && q.kind === "ETF token") ||
  (f === "up" && q.changePct24h > 0) ||
  (f === "down" && q.changePct24h < 0);

function ChangeText({ pct }: { pct: number }) {
  if (pct > 0) return <span className="text-ok">▲ {formatPct(pct)}</span>;
  if (pct < 0) return <span className="text-bad">▼ {formatPct(pct)}</span>;
  return <span className="text-ink-3">0.00%</span>;
}

/** Static 24h close chart (real hourly closes from the quotes API). */
function MiniChart({ series, ticker }: { series: number[]; ticker: string }) {
  const W = 300;
  const H = 96;
  const pts = useMemo(() => {
    if (series.length < 2) return null;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    return series.map((v, i) => [(i / (series.length - 1)) * W, H - 10 - ((v - min) / span) * (H - 24)] as const);
  }, [series]);
  if (!pts) {
    return <span className="text-mono-label absolute inset-0 flex items-center justify-center text-ink-3">collecting price history</span>;
  }
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const id = `hero-grad-${ticker}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-300)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand-300)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="var(--brand-300)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Home hero, laid out on the site's own grid, type and card styles over the page-wide particle backdrop
 * (components/home/ParticleBackdrop). Every number shown is live.
 */
export function ParticleHero() {
  const [filter, setFilter] = useState<Filter>("all");
  const quotes = useQuotes();
  const prices = usePrices();

  const cards = (quotes.data?.quotes ?? []).filter((q) => pass(q, filter));
  const tokenCount = prices.data?.prices.length;

  return (
    <section aria-labelledby="hero-title" className="relative h-[100svh] min-h-[680px] overflow-hidden">
      <div aria-hidden="true" className="grid-texture pointer-events-none absolute inset-0 opacity-60" />
      {/* Soft scrims behind the copy so text stays readable over bright particles. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[78%] bg-bg-0 opacity-90 [mask-image:linear-gradient(to_left,black_50%,transparent)] md:block lg:w-[58%] lg:opacity-80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[38%] bg-bg-0 opacity-70 [mask-image:linear-gradient(to_right,black_40%,transparent)] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-bg-0 opacity-85 [mask-image:linear-gradient(to_top,black_55%,transparent)] md:hidden"
      />

      <Container className="pointer-events-none relative h-full">
        <div className="relative h-full">
          {/* Left column: live quotes */}
          <div className="pointer-events-auto absolute bottom-28 left-0 top-[104px] hidden w-[300px] flex-col gap-4 lg:flex">
            <div className="flex items-center gap-3">
              <span
                className="mono-num flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-2 bg-surface-1 text-sm text-brand-200"
                title="Live stock tokens"
              >
                {tokenCount !== undefined ? (
                  <span aria-hidden="true">{String(tokenCount).padStart(2, "0")}</span>
                ) : (
                  <span className="block h-2 w-4 rounded-sm bg-surface-3 motion-safe:animate-pulse" aria-hidden="true" />
                )}
              </span>
              <span className="flex flex-col gap-1">
                <MonoLabel>live quotes</MonoLabel>
                <span className="text-mono-label text-ink-3">{tokenCount !== undefined ? "stock tokens · 24h" : "loading live prices"}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter live quotes">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "mono-num h-7 rounded-full border px-2.5 text-xs transition-colors duration-[180ms]",
                    filter === f.id ? "border-brand-400 bg-surface-1 text-brand-200" : "border-line-2 text-ink-2 hover:text-ink-1",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <ul
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-6 [mask-image:linear-gradient(to_bottom,black_88%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Live stock token quotes"
            >
              {quotes.error && !quotes.data ? (
                <li className="card p-4 text-sm text-ink-2">Live prices are unavailable right now</li>
              ) : !quotes.data ? (
                [0, 1].map((i) => (
                  <li key={i} className="card p-4">
                    <span className="block h-24 rounded-lg bg-surface-1 motion-safe:animate-pulse" />
                    <span className="mt-3 block h-3 w-2/3 rounded-sm bg-surface-2" />
                  </li>
                ))
              ) : cards.length === 0 ? (
                <li className="card p-4 text-sm text-ink-2">No live quote matches this filter</li>
              ) : (
                cards.map((q) => (
                  <li key={q.ticker}>
                    <Link
                      href="/stocks"
                      className="card block p-4 transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="inline-flex min-w-0 items-center gap-2.5">
                          <LetterAvatar text={q.ticker} size={28} />
                          <span className="flex min-w-0 flex-col">
                            <span className="mono-num text-sm text-ink-1">{q.ticker}</span>
                            <span className="truncate text-xs text-ink-3">{q.name}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end font-mono text-xs">
                          <span className="text-ink-1">{formatUsd(q.priceUsd)}</span>
                          <ChangeText pct={q.changePct24h} />
                        </span>
                      </span>
                      <span className="relative mt-3 block h-24 overflow-hidden rounded-lg bg-surface-1">
                        <MiniChart series={q.series} ticker={q.ticker} />
                        <span className="text-mono-label absolute left-2 top-1.5 text-ink-3">24h</span>
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Right column: headline and actions (bottom-aligned on phones, centred from md up) */}
          <div className="pointer-events-auto absolute bottom-10 left-0 right-0 top-[96px] flex flex-col overflow-y-auto [scrollbar-width:none] md:left-auto md:w-[420px] lg:bottom-28 [&::-webkit-scrollbar]:hidden">
            <div className="mt-auto flex flex-col gap-6 md:my-auto">
              <ContractAddress address={REUNO_TOKEN_ADDRESS} className="-my-1.5 self-start" />
              <h1 id="hero-title" className="text-display-l text-ink-1">
                Private rails for people and their <span className="text-grad-brand">agents.</span>
              </h1>
              <p className="text-ink-2 md:text-body-l">{SUPPORTING_LINE}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button href="/app" size="lg">
                  Open app
                </Button>
                <ModalButton modal="connect" variant="secondary" size="lg">
                  Get an agent key
                </ModalButton>
                <ModalButton modal="tor" variant="ghost" size="lg" className="px-1">
                  Open in Tor →
                </ModalButton>
              </div>
              <a href="#layers" className="group hidden flex-col gap-3 md:flex" aria-label="The five privacy layers">
                <MonoLabel>five privacy layers</MonoLabel>
                <span className="flex flex-wrap gap-2">
                  {LAYERS.map((l) => (
                    <span
                      key={l.code}
                      title={l.name}
                      className="mono-num flex h-10 w-10 items-center justify-center rounded-full border border-line-2 bg-surface-1 text-[11px] text-brand-200 transition-colors duration-[180ms] group-hover:border-brand-400"
                    >
                      {l.code}
                    </span>
                  ))}
                </span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
