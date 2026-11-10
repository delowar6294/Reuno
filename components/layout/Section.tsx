import { cn } from "@/lib/cn";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { Container } from "./Container";

export function Section({
  id,
  tone = "odd",
  texture = false,
  glow = false,
  className,
  containerClassName,
  children,
  labelledBy,
}: {
  id?: string;
  tone?: "odd" | "even";
  texture?: boolean;
  glow?: boolean;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative overflow-hidden py-20 md:py-28",
        tone === "odd" ? "bg-bg-0" : "bg-bg-1",
        id && "scroll-mt-20",
        className,
      )}
    >
      {glow && <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grad-glow" />}
      {texture && <div aria-hidden="true" className="grid-texture pointer-events-none absolute inset-0" />}
      <Container className={cn("relative", containerClassName)}>{children}</Container>
    </section>
  );
}

/** Eyebrow + H2 + optional sub. Title may contain a highlighted node. */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  id,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  id?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <RevealItem>
        <MonoLabel>{eyebrow}</MonoLabel>
      </RevealItem>
      <RevealItem>
        <Tag id={id} className="text-display-l max-w-[20ch] text-ink-1">
          {title}
        </Tag>
      </RevealItem>
      {sub && (
        <RevealItem>
          <p className="text-body-l max-w-[62ch] text-ink-2">{sub}</p>
        </RevealItem>
      )}
    </Reveal>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="text-grad-brand">{children}</span>;
}
