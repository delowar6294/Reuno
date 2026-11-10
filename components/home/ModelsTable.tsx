import { Section, SectionHeading } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { FEATURED_MODEL_IDS, MODELS_CAPTION } from "@/data/models";
import { getModelCatalog } from "@/lib/server/catalog";
import { ModelsTableView } from "./ModelsTableView";

export async function ModelsTable() {
  const catalog = await getModelCatalog();
  const rows = catalog
    ? FEATURED_MODEL_IDS.flatMap((id) => catalog.filter((m) => m.id === id))
    : [];

  return (
    <Section tone="even" labelledBy="models-title">
      <SectionHeading id="models-title" eyebrow="any model, same key" title="Switch models by changing one ID." />
      {rows.length ? (
        <ModelsTableView className="mt-12" rows={rows} />
      ) : (
        <div className="card mt-12 p-8 text-center text-ink-2">Live model prices are unavailable right now.</div>
      )}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-3">{MODELS_CAPTION}</p>
        <Button href="/models" variant="ghost" size="sm">
          See all models →
        </Button>
      </div>
    </Section>
  );
}
