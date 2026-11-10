import { Section } from "@/components/layout/Section";
import { RollingDigits } from "@/components/ui/RollingDigits";
import { STATS } from "@/data/site";

export function StatsBand() {
  return (
    <Section tone="even" className="py-16 md:py-20">
      <h2 className="sr-only">Reuno in numbers</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2 text-center">
            <dt className="text-mono-label order-2 text-ink-3">{s.label}</dt>
            <dd className="order-1">
              <RollingDigits
                value={s.value}
                glyphClassName="text-grad-silver"
                className="text-[clamp(48px,6vw,76px)] leading-none tracking-[-0.03em]"
              />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
