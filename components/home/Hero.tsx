import { Copy } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ComplianceRow } from "@/components/layout/ComplianceRow";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Tooltip } from "@/components/ui/Tooltip";
import { ModalButton } from "@/components/modals/ModalButton";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SUPPORTING_LINE } from "@/data/site";
import { HeroVisual } from "./HeroVisual";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg-0 pb-20 pt-28 md:pt-36" aria-labelledby="hero-title">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grad-glow" />
      <div aria-hidden="true" className="grid-texture pointer-events-none absolute inset-0" />
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-6">
          <Reveal className="flex flex-col gap-7 lg:col-span-7">
            <RevealItem>
              <Pill dot="ok">live on robinhood chain · beta</Pill>
            </RevealItem>
            <RevealItem>
              <h1 id="hero-title" className="text-display-xl text-ink-1">
                Private rails for
                <br />
                people and their <span className="text-grad-brand">agents.</span>
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="text-body-l max-w-[62ch] text-ink-2">{SUPPORTING_LINE}</p>
            </RevealItem>
            <RevealItem className="flex flex-wrap items-center gap-3">
              <Button href="/app" size="lg">
                Open app
              </Button>
              <ModalButton modal="connect" variant="secondary" size="lg">
                Get an agent key
              </ModalButton>
              <ModalButton modal="tor" variant="ghost" size="lg" className="px-1">
                Open in Tor Browser →
              </ModalButton>
            </RevealItem>
            <RevealItem className="flex items-center gap-2">
              <span className="text-mono-label normal-case text-ink-2">$REUNO · CA coming soon</span>
              <Tooltip content="Contract not launched yet">
                <button
                  type="button"
                  aria-disabled="true"
                  aria-label="Copy contract address (not launched yet)"
                  className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-sm text-ink-3 opacity-60"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </Tooltip>
            </RevealItem>
            <RevealItem>
              <ComplianceRow />
            </RevealItem>
          </Reveal>

          <div className="lg:col-span-5">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
