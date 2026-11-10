import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { ModelsSearch } from "@/components/pages/ModelsSearch";
import { getModelCatalog } from "@/lib/server/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Models",
  description: "Every model on one OpenAI-compatible Reuno key, with live list prices. Switch models by changing one ID.",
};

export default async function ModelsPage() {
  const models = await getModelCatalog();
  return (
    <>
      <PageHero
        eyebrow="any model, same key"
        title="Models"
        sub="Every model runs on the same key and the same endpoint. Billed at provider list price with no markup."
      />
      <Section tone="even" className="pt-12 md:pt-16">
        {models ? (
          <ModelsSearch models={models} />
        ) : (
          <div className="card p-8 text-center text-ink-2">The live model list is unavailable right now. Try again shortly.</div>
        )}
      </Section>
    </>
  );
}
