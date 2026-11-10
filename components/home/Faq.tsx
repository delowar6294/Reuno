import { Section, SectionHeading } from "@/components/layout/Section";
import { Accordion } from "@/components/ui/Accordion";
import { FAQ } from "@/data/faq";

export function Faq() {
  return (
    <Section tone="even" labelledBy="faq-title">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-title" eyebrow="questions" title="Straight answers." />
        </div>
        <div className="lg:col-span-8">
          <Accordion items={FAQ} />
        </div>
      </div>
    </Section>
  );
}
