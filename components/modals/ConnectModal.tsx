"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
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

/** Demo only: random string generated in the browser, never sent anywhere. */
function makeTrialKey(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
  return `rn_trial_${body}`;
}

export function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("claude");
  const [key, setKey] = useState<string | null>(null);

  const mcpUrl = `https://mcp.reuno.xyz/v1?key=${key ?? "…"}`;

  return (
    <Modal open={open} onClose={onClose} title="Get an agent key">
      <Tabs items={TABS} value={tab} onChange={setTab} idBase="connect" label="Client" />

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-mono-label text-ink-3">step 1 · trial key · demo</span>
          {key ? (
            <>
              <CopyField value={key} label="your key" />
              <p className="flex items-start gap-2 text-sm text-warn">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Your key works like a password. Don&apos;t share it.</span>
              </p>
            </>
          ) : (
            <Button onClick={() => setKey(makeTrialKey())} className="self-start">
              Generate trial key
            </Button>
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
              <CopyField value={mcpUrl} label="mcp url" note="example" max={40} />
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
