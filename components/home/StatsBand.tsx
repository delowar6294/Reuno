import { Section } from "@/components/layout/Section";
import { RollingDigits } from "@/components/ui/RollingDigits";
import { getModelCatalog, getStockTokenCount } from "@/lib/server/catalog";

/** Round down to a tidy "N+" so the claim is always true. */
const floorPlus = (n: number, step: number) => `${Math.floor(n / step) * step}+`;

export async function StatsBand() {
  const [models, tokens] = await Promise.all([getModelCatalog(), getStockTokenCount()]);

  const stats = [
    models ? { value: floorPlus(models.length, 10), label: "AI models" } : null,
    tokens ? { value: floorPlus(tokens, 10), label: "stock tokens & ETFs" } : null,
    { value: "5", label: "privacy layers" },
    { value: "3", label: "Tor hops" },
  ].filter((s): s is { value: string; label: string } => s !== null);

  return (
    <Section tone="even" className="py-16 md:py-20">
      <h2 className="sr-only">Reuno in numbers</h2>
      <dl className={stats.length === 4 ? "grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4" : "grid grid-cols-2 gap-x-6 gap-y-10"}>
        {stats.map((s) => (
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
      <p className="mt-10 text-center text-xs text-ink-3">
        Model count from OpenRouter&apos;s live catalog; token count from Robinhood&apos;s official Stock Token registry.
      </p>
    </Section>
  );
}
