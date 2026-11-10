import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/layout/Container";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Banner } from "@/components/ui/Banner";
import { AddChainButton } from "@/components/wallet/AddChainButton";
import { CHAIN } from "@/config/chain";
import { DocsNav, type DocSection } from "@/components/pages/DocsLayout";
import { LAYERS } from "@/data/layers";
import { REST_SNIPPET, TOOLS } from "@/data/tools";

export const metadata: Metadata = {
  title: "Docs",
  description: "Quickstart, API, MCP, tools reference, privacy layers and viewing keys for Reuno.",
};

const SECTIONS: DocSection[] = [
  { id: "wallet", title: "Wallet" },
  { id: "quickstart", title: "Quickstart" },
  { id: "api", title: "API" },
  { id: "mcp", title: "MCP" },
  { id: "tools", title: "Tools reference" },
  { id: "layers", title: "Privacy layers" },
  { id: "viewing-keys", title: "Viewing keys" },
];

const MCP_CONFIG = `{
  "mcpServers": {
    "reuno": {
      "url": "https://mcp.reuno.xyz/v1?key=$REUNO_KEY"
    }
  }
}`;

function DocSectionBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-b border-line-1 pb-12 last:border-b-0">
      <h2 id={`${id}-h`} className="text-h3 text-ink-1">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-ink-2">{children}</div>
    </section>
  );
}

function Todo({ children }: { children: React.ReactNode }) {
  return <p className="text-mono-label text-warn">todo: write · {children}</p>;
}

export default function DocsPage() {
  return (
    <>
      <PageHero eyebrow="docs" title="Documentation" sub="Everything you need to plug Reuno into an app or an agent." />
      <section className="bg-bg-1 py-12 md:py-16">
        <Container>
          <Banner className="mb-10">Draft docs — sections marked TODO are still being written. The Reuno API and MCP endpoints go live at launch.</Banner>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
            <div>
              <DocsNav sections={SECTIONS} />
            </div>
            <div className="flex min-w-0 max-w-[760px] flex-col gap-12">
              <DocSectionBlock id="wallet" title="Wallet">
                <p>
                  Reuno works with any EVM wallet (MetaMask, Rabby, Coinbase Wallet, and others through WalletConnect).
                  Add Robinhood Chain (chain id {CHAIN.id}) once; the button below asks your wallet to add and switch to it.
                  If your wallet blocks that, open &ldquo;Add manually&rdquo; and copy each field.
                </p>
                <AddChainButton />
                <p>
                  Every transaction is built unsigned and signed in your own wallet. Before your wallet opens, Reuno
                  simulates the transaction on Robinhood Chain and checks you have enough ETH for gas. If you don&apos;t,
                  &ldquo;Get ETH on Robinhood Chain&rdquo; bridges it from Ethereum, Base, Arbitrum, Optimism, BNB Chain or
                  Polygon through LI.FI.
                </p>
              </DocSectionBlock>
              <DocSectionBlock id="quickstart" title="Quickstart">
                <p>Get a trial key, then call any model through the OpenAI-compatible endpoint.</p>
                <CodeBlock code={REST_SNIPPET} label="available at launch" />
                <Todo>authentication, rate limits and error codes</Todo>
              </DocSectionBlock>
              <DocSectionBlock id="api" title="API">
                <p>
                  The REST API mirrors the OpenAI chat completions shape. Use any SDK by changing the base
                  URL and key.
                </p>
                <Todo>full endpoint list and request/response schemas</Todo>
              </DocSectionBlock>
              <DocSectionBlock id="mcp" title="MCP">
                <p>Add the Reuno MCP server to any client that supports remote MCP.</p>
                <CodeBlock code={MCP_CONFIG} label="mcp config · available at launch" />
                <Todo>client-specific setup guides</Todo>
              </DocSectionBlock>
              <DocSectionBlock id="tools" title="Tools reference">
                <ul className="flex flex-col gap-3">
                  {TOOLS.map((t) => (
                    <li key={t.name} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                      <code className="shrink-0 font-mono text-sm text-brand-300 sm:w-[220px]">{t.name}</code>
                      <span className="text-sm">{t.line}</span>
                    </li>
                  ))}
                </ul>
                <Todo>parameters and example responses for each tool</Todo>
              </DocSectionBlock>
              <DocSectionBlock id="layers" title="Privacy layers">
                <ol className="flex flex-col gap-3">
                  {LAYERS.map((l) => (
                    <li key={l.code} className="flex gap-4 text-sm">
                      <span className="mono-num w-8 shrink-0 text-brand-300">{l.code}</span>
                      <span>
                        <span className="text-ink-1">{l.name}.</span> {l.line}
                      </span>
                    </li>
                  ))}
                </ol>
                <Todo>threat model and parameters per layer</Todo>
              </DocSectionBlock>
              <DocSectionBlock id="viewing-keys" title="Viewing keys">
                <p>
                  A viewing key gives read-only access to one transfer&apos;s trace. Share it with an auditor or
                  exchange when you need to show where funds came from.
                </p>
                <Todo>how to create, share and revoke viewing keys</Todo>
              </DocSectionBlock>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
