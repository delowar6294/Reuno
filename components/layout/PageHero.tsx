import { Container } from "./Container";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

/**
 * Shared page hero. Pass `aside` to get a two-column layout on desktop
 * (text 7 cols, visual 5 cols); it stacks below the text on mobile.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  children,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const text = (
    <Reveal className={cn("flex flex-col gap-5", aside && "lg:col-span-7")}>
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
  );

  return (
    <section className="relative overflow-hidden bg-bg-0 pb-14 pt-28 md:pb-20 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grad-glow" />
      {aside && <div aria-hidden="true" className="grid-texture pointer-events-none absolute inset-0" />}
      <Container className="relative">
        {aside ? (
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {text}
            <div className="lg:col-span-5">{aside}</div>
          </div>
        ) : (
          text
        )}
      </Container>
    </section>
  );
}
