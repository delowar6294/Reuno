import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ModalButton } from "@/components/modals/ModalButton";
import { StocksGrid } from "@/components/pages/StocksGrid";
import { LiveQuoteCard } from "@/components/stocks/LiveQuoteCard";
import { LiveStats } from "@/components/stocks/LiveStats";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { STOCK_TOKEN_NOTICE } from "@/data/stocks";

export const metadata: Metadata = {
  title: "Stocks",
  description:
    "Live Robinhood Stock Token prices on Robinhood Chain. Quote, buy and sell from your own wallet, or from your agent.",
};

export default function StocksPage() {
  return (
    <Web3Provider>
      <PageHero
        eyebrow="stock tokens · robinhood chain"
        title="Stock tokens"
        sub="Quote, buy, sell and privately transfer stock tokens and ETFs on Robinhood Chain, from the app or from your agent."
        aside={<LiveQuoteCard />}
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
          <div>
            <LiveStats />
            <Banner tone="info" className="mt-6 max-w-[62ch]">
              {STOCK_TOKEN_NOTICE}
            </Banner>
          </div>
        </div>
      </PageHero>
      <Section tone="even" className="pt-12 md:pt-16">
        <StocksGrid />
      </Section>
    </Web3Provider>
  );
}
