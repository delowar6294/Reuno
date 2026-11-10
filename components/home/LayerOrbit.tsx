import { Section, SectionHeading, Highlight } from "@/components/layout/Section";
import { Logo } from "@/components/brand/Logo";
import { Divider } from "@/components/ui/Card";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { LAYERS, ORBIT_NODES } from "@/data/layers";

const R = 220; // desktop radius
const SIZE = 560;

function Chip({ code, caption }: { code: string; caption: string }) {
  return (
    <div className="group flex flex-col items-center gap-2">
      <span className="mono-num flex h-14 w-14 items-center justify-center rounded-full border border-line-2 bg-surface-1 text-xs text-brand-200 transition-[transform,border-color] duration-[180ms] ease-reuno group-hover:scale-[1.08] group-hover:border-brand-400">
        {code}
      </span>
      <span className="text-mono-label text-ink-3">{caption}</span>
    </div>
  );
}

export function LayerOrbit() {
  const n = ORBIT_NODES.length;
  return (
    <Section id="layers" tone="even" labelledBy="layers-title">
      <SectionHeading
        id="layers-title"
        eyebrow="the five layers"
        title={
          <>
            Every transfer goes <Highlight>five layers deep.</Highlight>
          </>
        }
        sub="A fresh vault, random shards, batched timing, a zero-knowledge pool and a relayer exit. Each one breaks a different way of tracing you."
      />

      {/* Desktop orbit */}
      <div className="relative mx-auto mt-16 hidden md:block" style={{ width: SIZE, height: SIZE }}>
        <svg
          aria-hidden="true"
          className="absolute inset-0 text-line-2"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 6"
            className="motion-safe:animate-dash"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R - 70}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 6"
            opacity={0.6}
            className="motion-safe:animate-dash [animation-direction:reverse]"
          />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo size={160} decorative />
        </div>
        <ul aria-label="Privacy stack components">
          {ORBIT_NODES.map((node, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = SIZE / 2 + Math.cos(a) * R;
            const y = SIZE / 2 + Math.sin(a) * R;
            return (
              <li
                key={node.code}
                className="absolute"
                style={{ left: x, top: y, transform: "translate(-50%, -28px)" }}
              >
                <Chip {...node} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile grid */}
      <ul className="mt-12 grid grid-cols-4 gap-y-6 md:hidden" aria-label="Privacy stack components">
        {ORBIT_NODES.map((node) => (
          <li key={node.code} className="flex justify-center">
            <Chip {...node} />
          </li>
        ))}
      </ul>

      <Reveal as="ul" className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {LAYERS.map((l) => (
          <RevealItem
            as="li"
            key={l.code}
            className="card flex flex-col gap-3 p-5 transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-mono-label text-ink-3">layer 0{l.n}</span>
              <span className="mono-num flex h-8 w-8 items-center justify-center rounded-full border border-line-2 text-[11px] text-brand-200">
                {l.code}
              </span>
            </div>
            <h3 className="text-h3 text-ink-1">{l.name}</h3>
            <p className="flex-1 text-sm text-ink-2">{l.line}</p>
            <Divider />
            <p className="text-mono-label text-ink-3">defeats: {l.defeats}</p>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  );
}
