import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionHeading, Highlight } from "@/components/layout/Section";
import { PricingCards } from "@/components/home/PricingTeaser";
import { Table, type Column } from "@/components/ui/Table";
import { CHARGES, type ChargeRow } from "@/data/tiers";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free daily allowance for low-cost models, more for $REUNO holders. Tool calls are free; private transfers pay only network and relayer fees.",
};

const COLUMNS: Column<ChargeRow>[] = [
  { key: "item", header: "what", cell: (r) => <span className="text-ink-1">{r.item}</span> },
  { key: "how", header: "how you're charged", cell: (r) => <span className="text-ink-2">{r.how}</span> },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="pricing"
        title={
          <>
            Try it free. <Highlight>Holders get more.</Highlight>
          </>
        }
        sub="No credits to buy. Tool calls are free and model calls run on a daily allowance that resets at 00:00 UTC."
      />
      <Section tone="even" className="pt-12 md:pt-16">
        <PricingCards />
        <p className="mt-6 text-sm text-ink-3">
          Tool calls are free. Privacy transfers pay only network and relayer fees, shown before you sign.
        </p>
      </Section>
      <Section tone="odd" labelledBy="charges-title">
        <SectionHeading id="charges-title" eyebrow="the details" title="How you're charged." />
        <Table className="mt-10" columns={COLUMNS} rows={CHARGES} rowKey={(r) => r.item} caption="How Reuno charges" />
      </Section>
    </>
  );
}
