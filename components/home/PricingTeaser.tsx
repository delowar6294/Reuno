import { Section, SectionHeading, Highlight } from "@/components/layout/Section";
import { Card, CardHeader, Divider } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { ModalButton } from "@/components/modals/ModalButton";
import { TIERS } from "@/data/tiers";

export function TierTable() {
  return (
    <dl className="flex flex-col">
      {TIERS.map((t) => (
        <div key={t.hold} className="flex items-center justify-between border-b border-line-1 py-3 last:border-b-0">
          <dt className="text-sm text-ink-2">
            hold <span className="mono-num text-silver-200">{t.hold}</span>
          </dt>
          <dd className="mono-num text-silver-200">{t.allowance}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <CardHeader left="free tier" right={<Pill dot="ok">no sign-in</Pill>} />
        <h3 className="text-h3 text-ink-1">Try it now</h3>
        <p className="text-ink-2">A free daily allowance for low-cost models. No wallet needed.</p>
        <div className="mt-auto pt-4">
          <ModalButton modal="connect">Get a trial key</ModalButton>
        </div>
      </Card>
      <Card className="flex flex-col gap-4">
        <CardHeader left="holder tier" right={<Pill dot="warn">soon</Pill>} />
        <h3 className="text-h3 text-ink-1">
          Hold <span className="font-mono">$REUNO</span>
        </h3>
        <p className="text-ink-2">$0.40 to $15 of model calls a day, by the value you hold.</p>
        <Divider />
        <TierTable />
        <div className="mt-auto pt-2">
          <Tooltip content="Token not launched yet">
            <Button variant="secondary" disabled>
              Buy $REUNO — soon
            </Button>
          </Tooltip>
        </div>
      </Card>
    </div>
  );
}

export function PricingTeaser() {
  return (
    <Section tone="odd" labelledBy="pricing-title">
      <SectionHeading
        id="pricing-title"
        eyebrow="pricing"
        title={
          <>
            Try it free. <Highlight>Holders get more.</Highlight>
          </>
        }
      />
      <div className="mt-12">
        <PricingCards />
      </div>
      <p className="mt-6 text-sm text-ink-3">
        Tool calls are free. Privacy transfers pay only network and relayer fees, shown before you sign.
      </p>
    </Section>
  );
}
