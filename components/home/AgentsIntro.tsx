import { Section, SectionHeading, Highlight } from "@/components/layout/Section";
import { AgentDemoChat } from "./AgentDemoChat";

export function AgentsIntro({ tone = "odd" }: { tone?: "odd" | "even" }) {
  return (
    <Section tone={tone} labelledBy="agents-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeading
            id="agents-title"
            eyebrow="one key for your agent"
            title={
              <>
                300+ models and stock-token tools, <Highlight>one key.</Highlight>
              </>
            }
            sub="Plug Reuno into Claude, ChatGPT, Cursor or any OpenAI SDK. Your agent quotes, buys, sells and privately transfers stock tokens, and signs every trade with its own wallet."
          />
        </div>
        <div className="lg:col-span-6">
          <AgentDemoChat />
        </div>
      </div>
    </Section>
  );
}
