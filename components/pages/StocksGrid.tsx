"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { STOCKS } from "@/data/stocks";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "stock", label: "Stocks" },
  { id: "etf", label: "ETFs" },
];

export function StocksGrid() {
  const [filter, setFilter] = useState("all");
  const rows = filter === "all" ? STOCKS : STOCKS.filter((s) => s.kind === filter);

  return (
    <div>
      <Tabs items={FILTERS} value={filter} onChange={setFilter} idBase="stocks" label="Filter stock tokens" />
      <div
        role="tabpanel"
        id={`stocks-panel-${filter}`}
        aria-labelledby={`stocks-tab-${filter}`}
        className="mt-8"
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((s) => (
            <li
              key={s.ticker}
              className="card flex flex-col gap-4 p-5 transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-3">
                  <LetterAvatar text={s.ticker} size={32} />
                  <span className="mono-num text-ink-1">{s.ticker}</span>
                </span>
                <span className="text-mono-label text-ink-3">{s.kind}</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
                <dt className="text-ink-3">price</dt>
                <dd className="text-right text-ink-2">—</dd>
                <dt className="text-ink-3">24h</dt>
                <dd className="text-right text-ink-2">—</dd>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-ink-3">Live prices appear in the app. Listing shown is demo data.</p>
      </div>
    </div>
  );
}
