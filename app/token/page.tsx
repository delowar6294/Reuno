import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { CopyField } from "@/components/ui/CopyField";
import { Banner } from "@/components/ui/Banner";
import { TierTable } from "@/components/home/PricingTeaser";
import { HOLDING_RULES } from "@/data/tiers";

export const metadata: Metadata = {
  title: "$REUNO token",
  description: "$REUNO holders get a daily allowance of model calls. The token has not launched; contract coming soon.",
};

export default function TokenPage() {
  return (
    <>
      <PageHero
        eyebrow="token"
        title={<span className="font-mono">$REUNO</span>}
        sub="Holding $REUNO unlocks a bigger daily allowance of model calls. The token has not launched yet."
      >
        <Pill dot="warn">not launched</Pill>
      </PageHero>
      <Section tone="even" className="pt-12 md:pt-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="flex flex-col gap-5">
            <CardHeader left="contract" right={<Pill dot="warn">soon</Pill>} />
            <CopyField value="CA coming soon" label="contract address" note="not launched" />
            <p className="text-sm text-ink-2">
              The contract address will be published here and on our official channels at launch. Any
              address shared before then is not ours.
            </p>
          </Card>
          <Card className="flex flex-col gap-4">
            <CardHeader left="holder allowance" />
            <TierTable />
          </Card>
          <Card className="flex flex-col gap-4 lg:col-span-2">
            <CardHeader left="what counts as holding" />
            <ul className="flex flex-col gap-3">
              {HOLDING_RULES.map((r) => (
                <li key={r} className="flex gap-3 text-ink-2">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Banner className="mt-8">
          $REUNO is not an investment and nothing here promises its price.{" "}
          <Link href="/risks" className="text-brand-300 underline underline-offset-4 hover:text-brand-200">
            Read the risks
          </Link>
          .
        </Banner>
      </Section>
    </>
  );
}
