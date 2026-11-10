import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { ModelsSearch } from "@/components/pages/ModelsSearch";

export const metadata: Metadata = {
  title: "Models",
  description: "300+ AI models behind one OpenAI-compatible Reuno key. Switch models by changing one ID.",
};

export default function ModelsPage() {
  return (
    <>
      <PageHero
        eyebrow="any model, same key"
        title="Models"
        sub="Every model runs on the same key and the same endpoint. Billed at provider list price with no markup."
      />
      <Section tone="even" className="pt-12 md:pt-16">
        <ModelsSearch />
      </Section>
    </>
  );
}
