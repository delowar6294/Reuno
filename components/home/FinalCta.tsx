import { Section } from "@/components/layout/Section";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ModalButton } from "@/components/modals/ModalButton";
import { ComplianceRow } from "@/components/layout/ComplianceRow";
import { Reveal, RevealItem } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <Section tone="odd" texture glow labelledBy="cta-title">
      <Reveal className="flex flex-col items-center gap-6 text-center">
        <RevealItem>
          <Logo size={120} decorative />
        </RevealItem>
        <RevealItem>
          <h2 id="cta-title" className="text-display-l text-ink-1">
            Move quietly.
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="text-body-l max-w-[52ch] text-ink-2">
            Reuno is live in beta on Robinhood Chain mainnet with capped transfers. Use it on clearnet
            or over Tor.
          </p>
        </RevealItem>
        <RevealItem className="flex flex-wrap justify-center gap-3">
          <Button href="/app" size="lg">
            Open app
          </Button>
          <ModalButton modal="connect" variant="secondary" size="lg">
            Get an agent key
          </ModalButton>
        </RevealItem>
        <RevealItem className="mt-4">
          <ComplianceRow center />
        </RevealItem>
      </Reveal>
    </Section>
  );
}
