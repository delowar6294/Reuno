"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Banner } from "@/components/ui/Banner";
import { FLAGS } from "@/config/flags";
import { LAYERS } from "@/data/layers";
import { SwapPanel } from "./SwapPanel";
import { TransferPanel } from "./TransferPanel";

const TABS = [
  { id: "swap", label: "Swap" },
  { id: "transfer", label: "Transfer" },
];

function TransferComingSoon() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-ink-2">
        Private transfers open when the Reuno pool contracts and relayers go live on Robinhood Chain. Until then
        there is nothing to send through, so this tab stays closed rather than pretending.
      </p>
      <ol className="flex flex-col gap-3">
        {LAYERS.map((l) => (
          <li key={l.code} className="flex gap-3 text-sm">
            <span className="mono-num flex h-7 w-9 shrink-0 items-center justify-center rounded-full border border-line-2 text-[11px] text-brand-200">
              {l.code}
            </span>
            <span className="text-ink-2">
              <span className="text-ink-1">{l.name}.</span> {l.line}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AppShell() {
  const [tab, setTab] = useState("swap");
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <Banner>
        Beta · swaps route through LI.FI and settle publicly on Robinhood Chain. Private transfers open with the Reuno
        pool.
      </Banner>
      <div className="panel-highlight mt-6 rounded-xl border border-line-1 bg-grad-card p-5 md:p-8">
        <Tabs items={TABS} value={tab} onChange={setTab} idBase="app" label="Mode" />
        <TabPanel idBase="app" id="swap" active={tab === "swap"} className="pt-6">
          <SwapPanel />
        </TabPanel>
        <TabPanel idBase="app" id="transfer" active={tab === "transfer"} className="pt-6">
          {FLAGS.privateTransfers ? <TransferPanel /> : <TransferComingSoon />}
        </TabPanel>
      </div>
    </div>
  );
}
