"use client";

import { useState } from "react";
import { TradePanel } from "@/components/trade/TradePanel";
import { AddTokenButton } from "@/components/wallet/AddTokenButton";
import { STOCK_TOKENS } from "@/config/tokens";
import type { TradeSide } from "@/lib/market-types";
import { formatPct, formatUsd } from "@/lib/format";
import { usePrices } from "@/lib/use-market";
import { cn } from "@/lib/cn";
import { Field, TokenSelect } from "./fields";

export function SwapPanel() {
  const [ticker, setTicker] = useState(STOCK_TOKENS[0].ticker);
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("50");
  const { data } = usePrices();
  const live = data?.prices.find((p) => p.ticker === ticker);
  const token = STOCK_TOKENS.find((t) => t.ticker === ticker)!;

  return (
    <div className="flex flex-col gap-6">
      <Field label="stock token" htmlFor="swap-token" hint={side === "buy" ? "Paid with ETH from your wallet." : "Sold for ETH to your wallet."}>
        <div className="flex items-center gap-2">
          <TokenSelect
            id="swap-token"
            value={ticker}
            onChange={(t) => {
              setTicker(t);
              setAmount("50");
            }}
            options={STOCK_TOKENS.map((t) => t.ticker)}
            className="flex-1"
          />
          <AddTokenButton address={token.address} symbol={token.ticker} />
        </div>
      </Field>

      <div className="flex items-center justify-between rounded-sm border border-line-1 bg-surface-1 px-4 py-3 text-sm">
        <span className="text-ink-3">live price</span>
        {live ? (
          <span className="mono-num flex items-center gap-3 text-ink-1">
            {formatUsd(live.priceUsd)}
            <span className={cn("text-xs", live.changePct24h > 0 ? "text-ok" : live.changePct24h < 0 ? "text-bad" : "text-ink-3")}>
              {live.changePct24h > 0 ? "▲" : live.changePct24h < 0 ? "▼" : ""} {formatPct(live.changePct24h)}
            </span>
          </span>
        ) : (
          <span className="block h-3 w-20 rounded-sm bg-surface-3 motion-safe:animate-pulse" aria-label="Loading" />
        )}
      </div>

      <TradePanel
        key={ticker}
        ticker={ticker}
        side={side}
        onSideChange={setSide}
        amount={amount}
        onAmountChange={setAmount}
      />
    </div>
  );
}
