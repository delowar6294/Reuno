"use client";

import { Container } from "@/components/layout/Container";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { STOCK_TOKENS } from "@/config/tokens";
import { formatPct, formatUsd } from "@/lib/format";
import { usePrices } from "@/lib/use-market";
import { cn } from "@/lib/cn";
import { Marquee } from "./Marquee";

export function StockTicker() {
  const { data } = usePrices();
  const byTicker = new Map((data?.prices ?? []).map((p) => [p.ticker, p]));

  return (
    <section aria-label="Stock tokens on Robinhood Chain" className="border-y border-line-1 bg-bg-0 py-4">
      <Container>
        <Marquee label={data ? "live · robinhood chain" : "stock tokens · robinhood chain"}>
          {STOCK_TOKENS.map((s) => {
            const p = byTicker.get(s.ticker);
            return (
              <span key={s.ticker} className="inline-flex items-center gap-2 whitespace-nowrap">
                <LetterAvatar text={s.ticker} />
                <span className="mono-num text-sm text-ink-1">{s.ticker}</span>
                {p ? (
                  <>
                    <span className="mono-num text-sm text-ink-2">{formatUsd(p.priceUsd)}</span>
                    <span
                      className={cn(
                        "mono-num text-xs",
                        p.changePct24h > 0 ? "text-ok" : p.changePct24h < 0 ? "text-bad" : "text-ink-3",
                      )}
                    >
                      {p.changePct24h > 0 ? "▲" : p.changePct24h < 0 ? "▼" : ""} {formatPct(p.changePct24h)}
                    </span>
                  </>
                ) : (
                  <span className="block h-3 w-12 rounded-sm bg-surface-3" aria-hidden="true" />
                )}
              </span>
            );
          })}
        </Marquee>
      </Container>
    </section>
  );
}
