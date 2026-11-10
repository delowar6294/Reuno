import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Banner } from "@/components/ui/Banner";
import { StocksGrid } from "@/components/pages/StocksGrid";
import { US_PERSONS_NOTICE } from "@/data/stocks";

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
      >
        <Banner className="max-w-[720px]">{US_PERSONS_NOTICE}</Banner>
      </PageHero>
      <Section tone="even" className="pt-12 md:pt-16">
        <StocksGrid />
      </Section>
    </>
  );
}
