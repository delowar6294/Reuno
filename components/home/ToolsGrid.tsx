import { Section, SectionHeading } from "@/components/layout/Section";
import { Divider } from "@/components/ui/Card";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { Pill } from "@/components/ui/Pill";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { StatusDot } from "@/components/ui/StatusDot";
import { TOOLS, type Tool } from "@/data/tools";
import { cn } from "@/lib/cn";

function Preview({ p }: { p: Tool["preview"] }) {
  switch (p.kind) {
    case "avatars":
      return (
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {p.letters.map((l) => (
              <LetterAvatar key={l} text={l} className="ring-2 ring-surface-1" />
            ))}
          </div>
          <span className="mono-num text-sm text-ink-2">{p.total}</span>
        </div>
      );
    case "quote":
      return (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <LetterAvatar text={p.ticker} />
            <span className="mono-num text-sm text-ink-1">{p.ticker}</span>
          </span>
          <span className="mono-num text-sm text-ink-3">{p.price}</span>
        </div>
      );
    case "trade":
      return (
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs text-ink-2">
            {p.pairs.map(([k, v], i) => (
              <span key={k}>
                {i > 0 && <span className="text-ink-3"> · </span>}
                <span className="text-ink-3">{k}</span> {v}
              </span>
            ))}
          </span>
          <Pill dot="warn" className="self-start">
            {p.pill}
          </Pill>
        </div>
      );
    case "layers":
      return (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: p.count }, (_, i) => (
            <span key={i} className="flex flex-1 items-center gap-1.5">
              <StatusDot tone="brand" pulse={i === p.count - 1} />
              {i < p.count - 1 && <span className="h-px flex-1 bg-line-2" />}
            </span>
          ))}
        </div>
      );
    case "networks":
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {p.letters.map((l) => (
              <LetterAvatar key={l} text={l} size={26} />
            ))}
          </div>
          <span className="mono-num shrink-0 text-sm text-ink-1">{p.amount}</span>
        </div>
      );
  }
}

export function ToolsGrid({ tone = "odd" }: { tone?: "odd" | "even" }) {
  return (
    <Section tone={tone} labelledBy="tools-title">
      <SectionHeading
        id="tools-title"
        eyebrow="agent tools"
        title="Five tools over MCP and REST."
        sub="Read tools work without a key. Write tools return unsigned transactions."
      />
      <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
        {TOOLS.map((t, i) => (
          <RevealItem
            as="li"
            key={t.name}
            className={cn(
              "card flex flex-col gap-4 p-5 transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2 md:p-6 lg:col-span-2",
              i === 3 && "lg:col-start-2",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <code className="truncate rounded-full border border-line-1 bg-surface-3 px-2.5 py-1 font-mono text-xs text-brand-300">
                {t.name}
              </code>
              <span className="text-mono-label text-ink-3">{t.access}</span>
            </div>
            <h3 className="text-h3 text-ink-1">{t.title}</h3>
            <p className="flex-1 text-sm text-ink-2">{t.line}</p>
            <Divider />
            <Preview p={t.preview} />
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  );
}
