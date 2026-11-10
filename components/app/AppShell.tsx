"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Banner } from "@/components/ui/Banner";
import { SwapPanel } from "./SwapPanel";
import { TransferPanel } from "./TransferPanel";

const TABS = [
  { id: "swap", label: "Swap" },
  { id: "transfer", label: "Transfer" },
];

export function AppShell() {
  const [tab, setTab] = useState("swap");
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <Banner>Beta · capped transfers · demo interface, no wallet connected</Banner>
      <div className="panel-highlight mt-6 rounded-xl border border-line-1 bg-grad-card p-5 md:p-8">
        <Tabs items={TABS} value={tab} onChange={setTab} idBase="app" label="Mode" />
        <TabPanel idBase="app" id="swap" active={tab === "swap"} className="pt-6">
          <SwapPanel />
        </TabPanel>
        <TabPanel idBase="app" id="transfer" active={tab === "transfer"} className="pt-6">
          <TransferPanel />
        </TabPanel>
      </div>
    </div>
  );
}
