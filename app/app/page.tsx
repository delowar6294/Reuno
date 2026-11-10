import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { AppShell } from "@/components/app/AppShell";
import { Web3Provider } from "@/components/providers/Web3Provider";

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
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <MonoLabel>reuno app · beta</MonoLabel>
          <h1 className="text-display-l text-ink-1">Trade stock tokens from your wallet.</h1>
        </div>
        <Web3Provider>
          <AppShell />
        </Web3Provider>
      </Container>
    </section>
  );
}
