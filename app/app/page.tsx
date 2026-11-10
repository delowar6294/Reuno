import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { AppShell } from "@/components/app/AppShell";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { AddChainButton } from "@/components/wallet/AddChainButton";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export const metadata: Metadata = {
  title: "Open app",
  description: "Buy and sell Robinhood Stock Tokens from your own wallet on Robinhood Chain.",
};

export default function AppPage() {
  return (
    <section className="relative bg-bg-0 pb-24 pt-28 md:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grad-glow" />
      </div>
      <Container className="relative">
        <Web3Provider>
          <div className="mx-auto mb-10 flex w-full max-w-[560px] flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <MonoLabel>reuno app · beta</MonoLabel>
              <ConnectButton />
            </div>
            <h1 className="text-display-l text-center text-ink-1">Trade stock tokens from your wallet.</h1>
            <div className="flex justify-center">
              <AddChainButton className="items-center" />
            </div>
          </div>
          <AppShell />
        </Web3Provider>
      </Container>
    </section>
  );
}
