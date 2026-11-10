import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ModalButton } from "@/components/modals/ModalButton";
import { StocksGrid } from "@/components/pages/StocksGrid";
import { StocksHeroVisual } from "@/components/pages/StocksHeroVisual";
import { STOCK_FACTS, US_PERSONS_NOTICE } from "@/data/stocks";

export const metadata: Metadata = {
  title: "Stocks",
  description: "Stock tokens and ETFs on Robinhood Chain that Reuno agents can quote, buy, sell and privately transfer.",
};

export default function StocksPage() {
  return (
    <>
      <PageHero
        eyebrow="stock tokens · robinhood chain"
        title="Stock tokens"
        sub="Quote, buy, sell and privately transfer stock tokens and ETFs on Robinhood Chain, from the app or from your agent."
        aside={<StocksHeroVisual />}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/app" size="lg">
              Open app
            </Button>
            <ModalButton modal="connect" variant="secondary" size="lg">
              Trade from an agent
            </ModalButton>
          </div>

          <dl className="grid max-w-[560px] grid-cols-3 gap-4 border-y border-line-1 py-5">
            {STOCK_FACTS.map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <dt className="text-mono-label order-2 text-ink-3">{f.label}</dt>
                <dd className="mono-num text-grad-silver order-1 text-[28px] leading-none md:text-[32px]">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <Banner className="max-w-[640px]">{US_PERSONS_NOTICE}</Banner>
        </div>
      </PageHero>
      <Section tone="even" className="pt-12 md:pt-16">
        <StocksGrid />
      </Section>
    </>
  );
}
