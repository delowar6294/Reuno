"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Banner } from "@/components/ui/Banner";
import { FLAGS } from "@/config/flags";
import { CopyField } from "@/components/ui/CopyField";

const TABS = [
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "code", label: "Code" },
];

const STEPS: Record<string, string[]> = {
  claude: [
    "Open Claude and go to Settings, then Connectors.",
    "Choose Add custom connector and paste the MCP URL below.",
    "Start a new chat and ask your first question.",
  ],
  chatgpt: [
    "Open ChatGPT and go to Settings, then Connectors.",
    "Add a new MCP connector and paste the MCP URL below.",
    "Enable the connector in a new chat.",
  ],
  code: [
    "Export your key as $REUNO_KEY in your environment.",
    "Point any OpenAI SDK at the Reuno base URL, or add the MCP URL to your client.",
    "Call a model or a reuno_ tool with the same key.",
  ],
};

export function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("claude");
  // Keys are issued by the Reuno API. Until it is live (FLAGS.agentKeys) no key is shown or generated.
  const mcpUrl = "https://mcp.reuno.xyz/v1?key=YOUR_KEY";

  return (
    <Modal open={open} onClose={onClose} title="Get an agent key">
      <Tabs items={TABS} value={tab} onChange={setTab} idBase="connect" label="Client" />

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-mono-label text-ink-3">step 1 · your key</span>
          {FLAGS.agentKeys ? (
            <p className="flex items-start gap-2 text-sm text-warn">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Your key works like a password. Don&apos;t share it.</span>
            </p>
          ) : (
            <Banner tone="info">
              Agent keys open when the Reuno API launches. Below is exactly how you&apos;ll connect once you have one.
            </Banner>
          )}
        </div>

        {TABS.map((t) => (
          <TabPanel key={t.id} idBase="connect" id={t.id} active={tab === t.id}>
            <div className="flex flex-col gap-4">
              <span className="text-mono-label text-ink-3">step 2 · connect {t.label.toLowerCase()}</span>
              <ol className="flex flex-col gap-2.5">
                {STEPS[t.id].map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm text-ink-2">
                    <span className="mono-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-2 text-xs text-brand-300">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
              <CopyField value={mcpUrl} label="mcp url" note="available at launch" max={40} />
            </div>
          </TabPanel>
        ))}

        <div className="rounded-sm border border-line-1 bg-surface-2 p-4">
          <span className="text-mono-label text-ink-3">try asking</span>
          <p className="mt-1.5 text-sm text-ink-1">What is NVDA trading at on Robinhood Chain?</p>
        </div>
      </div>
    </Modal>
  );
}
