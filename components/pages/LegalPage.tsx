import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/layout/Container";
import { Banner } from "@/components/ui/Banner";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  eyebrow,
  title,
  sub,
  sections,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} sub={sub} />
      <section className="bg-bg-1 py-12 md:py-16">
        <Container>
          <article className="mx-auto max-w-[720px]">
            <Banner>Draft — to be reviewed by counsel before launch.</Banner>
            <div className="mt-10 flex flex-col gap-10">
              {sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="text-h3 text-ink-1">{s.heading}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {s.body.map((p) => (
                      <p key={p} className="max-w-[62ch] text-ink-2">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <p className="text-mono-label mt-12 text-ink-3">last updated · draft</p>
          </article>
        </Container>
      </section>
    </>
  );
}
