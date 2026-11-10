import { Container } from "@/components/layout/Container";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { Tooltip } from "@/components/ui/Tooltip";
import { STOCKS } from "@/data/stocks";
import { Marquee } from "./Marquee";

export function StockTicker() {
  return (
    <section aria-label="Stock tokens on Robinhood Chain" className="border-y border-line-1 bg-bg-0 py-4">
      <Container>
        <Marquee label="stock tokens · robinhood chain">
          {STOCKS.map((s) => (
            <span key={s.ticker} className="inline-flex items-center gap-2 whitespace-nowrap">
              <LetterAvatar text={s.ticker} />
              <span className="mono-num text-sm text-ink-1">{s.ticker}</span>
              <Tooltip content="live prices in app">
                <span tabIndex={0} className="mono-num rounded-sm text-sm text-ink-3">
                  —
                </span>
              </Tooltip>
            </span>
          ))}
        </Marquee>
      </Container>
    </section>
  );
}
