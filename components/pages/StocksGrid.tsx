"use client";

import { ExternalLink, RotateCw } from "lucide-react";
import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { STOCK_TOKENS } from "@/config/tokens";
import { explorerTokenUrl } from "@/config/chain";
import { formatCompactUsd, formatPct, formatUsd, shortAddress } from "@/lib/format";
import { usePrices } from "@/lib/use-market";
import { cn } from "@/lib/cn";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Stock token", label: "Stocks" },
  { id: "ETF token", label: "ETFs" },
];

function ChangeText({ pct }: { pct: number }) {
  if (pct > 0) return <span className="text-ok">▲ {formatPct(pct)}</span>;
  if (pct < 0) return <span className="text-bad">▼ {formatPct(pct)}</span>;
  return <span className="text-ink-3">0.00%</span>;
}

export function StocksGrid() {
  const [filter, setFilter] = useState("all");
  const { data, error, isLoading, mutate, isValidating } = usePrices();
  const byTicker = new Map((data?.prices ?? []).map((p) => [p.ticker, p]));
  const rows = filter === "all" ? STOCK_TOKENS : STOCK_TOKENS.filter((s) => s.kind === filter);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Tabs items={FILTERS} value={filter} onChange={setFilter} idBase="stocks" label="Filter stock tokens" />
        <p className="text-mono-label flex items-center gap-2 text-ink-3" aria-live="polite">
          <StatusDot tone={error ? "warn" : "ok"} />
          {error ? "reconnecting" : isLoading ? "loading live prices" : "live · dexscreener · 30s"}
        </p>
      </div>
      <div role="tabpanel" id={`stocks-panel-${filter}`} aria-labelledby={`stocks-tab-${filter}`} className="mt-8">
        {error && !data ? (
          <div className="card flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-ink-1">Live prices are unavailable right now</p>
            <Button variant="secondary" size="sm" loading={isValidating} onClick={() => void mutate()}>
              <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((s) => {
              const p = byTicker.get(s.ticker);
              return (
                <li
                  key={s.ticker}
                  className="card flex flex-col gap-4 p-5 transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex min-w-0 items-center gap-3">
                      <LetterAvatar text={s.ticker} size={32} />
                      <span className="flex min-w-0 flex-col">
                        <span className="mono-num text-ink-1">{s.ticker}</span>
                        <span className="truncate text-xs text-ink-3">{s.name}</span>
                      </span>
                    </span>
                    <span className="text-mono-label shrink-0 text-ink-3">{s.kind === "ETF token" ? "etf" : "stock"}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-y-2 font-mono text-xs">
                    <dt className="text-ink-3">price</dt>
                    <dd className="text-right text-ink-1">
                      {p ? formatUsd(p.priceUsd) : <Placeholder loading={isLoading} />}
                    </dd>
                    <dt className="text-ink-3">24h</dt>
                    <dd className="text-right">{p ? <ChangeText pct={p.changePct24h} /> : <Placeholder loading={isLoading} />}</dd>
                    <dt className="text-ink-3">pool depth</dt>
                    <dd className="text-right text-ink-2">
                      {p ? formatCompactUsd(p.liquidityUsd) : <Placeholder loading={isLoading} />}
                    </dd>
                  </dl>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-1 pt-3 text-xs">
                    <a
                      href={explorerTokenUrl(s.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-ink-3 underline-offset-4 hover:text-ink-1 hover:underline"
                      aria-label={`${s.ticker} contract on the explorer`}
                    >
                      {shortAddress(s.address)}
                    </a>
                    {p && (
                      <a
                        href={p.poolUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline"
                      >
                        pool
                        <ExternalLink className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-6 text-xs text-ink-3">
          Prices from each token&apos;s deepest DexScreener pool on Robinhood Chain, refreshed every 30 seconds. Contracts
          verified against Robinhood&apos;s official token registry.
        </p>
      </div>
    </div>
  );
}

function Placeholder({ loading }: { loading: boolean }) {
  return loading ? (
    <span className={cn("ml-auto block h-3 w-14 rounded-sm bg-surface-3 motion-safe:animate-pulse")} aria-label="Loading" />
  ) : (
    <span className="text-ink-3" title="No live pool found">
      unavailable
    </span>
  );
}
