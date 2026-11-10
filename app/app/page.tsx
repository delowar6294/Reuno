import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "Open app",
  description: "Swap and privately transfer on Robinhood Chain through five privacy layers. Demo interface.",
};

export default function AppPage() {
  return (
    <section className="relative overflow-hidden bg-bg-0 pb-24 pt-28 md:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grad-glow" />
      <Container className="relative">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <MonoLabel>reuno app · beta</MonoLabel>
          <h1 className="text-display-l text-ink-1">Swap or send, quietly.</h1>
        </div>
        <AppShell />
      </Container>
    </section>
  );
}
