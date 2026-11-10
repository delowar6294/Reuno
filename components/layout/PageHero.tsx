import { Container } from "./Container";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Reveal, RevealItem } from "@/components/ui/Reveal";

export function PageHero({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-bg-0 pb-14 pt-28 md:pb-20 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grad-glow" />
      <Container className="relative">
        <Reveal className="flex flex-col gap-5">
          <RevealItem>
            <MonoLabel>{eyebrow}</MonoLabel>
          </RevealItem>
          <RevealItem>
            <h1 className="text-display-l max-w-[22ch] text-ink-1">{title}</h1>
          </RevealItem>
          {sub && (
            <RevealItem>
              <p className="text-body-l max-w-[62ch] text-ink-2">{sub}</p>
            </RevealItem>
          )}
          {children && <RevealItem>{children}</RevealItem>}
        </Reveal>
      </Container>
    </section>
  );
}
