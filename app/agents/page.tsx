import type { Metadata } from "next";
import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionHeading, Highlight } from "@/components/layout/Section";
import { AgentsIntro } from "@/components/home/AgentsIntro";
import { ToolsGrid } from "@/components/home/ToolsGrid";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ModalButton } from "@/components/modals/ModalButton";
import { REST_SNIPPET, SIGNING_STEPS } from "@/data/tools";

export const metadata: Metadata = {
  title: "Agents",
  description:
    "One Reuno key gives your AI agent 300+ models and MCP tools to quote, trade and privately transfer stock tokens. Every transaction is signed by the agent's own wallet.",
};

export default function AgentsPage() {
  return (
    <>
      <PageHero
        eyebrow="reuno for agents"
        title={
          <>
            One key for your <Highlight>agent.</Highlight>
          </>
        }
        sub="An OpenAI-compatible API and an MCP server, behind one key. Reuno builds every transaction unsigned; your agent's wallet signs it."
      >
        <ModalButton modal="connect" size="lg">
          Get an agent key
        </ModalButton>
      </PageHero>
      <AgentsIntro tone="even" />
      <ToolsGrid tone="odd" />

      <Section tone="even" labelledBy="signing-title">
        <SectionHeading
          id="signing-title"
          eyebrow="how signing works"
          title="Reuno never touches a key."
          sub="Write tools stop at an unsigned transaction. Only your agent's own wallet can sign and send it."
        />
        <ol className="mt-12 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {SIGNING_STEPS.map((s, i) => (
            <Fragment key={s.n}>
              <li className="flex-1">
                <Card className="h-full">
                  <span className="text-mono-label text-ink-3">step 0{s.n}</span>
                  <h3 className="text-h3 mt-3 text-ink-1">{s.title}</h3>
                  <p className="mt-2 text-sm text-ink-2">{s.line}</p>
                </Card>
              </li>
              {i < SIGNING_STEPS.length - 1 && (
                <li aria-hidden="true" className="flex justify-center text-brand-300">
                  <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" strokeWidth={1.75} />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </Section>

      <Section tone="odd" labelledBy="rest-title">
        <SectionHeading
          id="rest-title"
          eyebrow="rest api"
          title="Any OpenAI SDK works."
          sub="Change the base URL and the key. Switch models by changing one ID."
        />
        <CodeBlock className="mt-10" code={REST_SNIPPET} label="example endpoint" />
      </Section>
    </>
  );
}
