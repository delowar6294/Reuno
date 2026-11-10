import { Section, SectionHeading } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { MODELS, MODELS_CAPTION } from "@/data/models";
import { ModelsTableView } from "./ModelsTableView";

export function ModelsTable() {
  return (
    <Section tone="even" labelledBy="models-title">
      <SectionHeading id="models-title" eyebrow="any model, same key" title="Switch models by changing one ID." />
      <ModelsTableView className="mt-12" rows={MODELS.filter((m) => m.featured)} />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-3">{MODELS_CAPTION}</p>
        <Button href="/models" variant="ghost" size="sm">
          See all models →
        </Button>
      </div>
    </Section>
  );
}
