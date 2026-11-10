import { Hero } from "@/components/home/Hero";
import { RecentTransfers } from "@/components/home/RecentTransfers";
import { LayerOrbit } from "@/components/home/LayerOrbit";
import { PrivateTrace } from "@/components/home/PrivateTrace";
import { TorSession } from "@/components/home/TorSession";
import { CircuitPath } from "@/components/home/CircuitPath";
import { CrowdChart } from "@/components/home/CrowdChart";
import { ManifestoQuote } from "@/components/home/ManifestoQuote";
import { TraceOdds } from "@/components/home/TraceOdds";
import { PoolActivity } from "@/components/home/PoolActivity";
import { RelayerMap } from "@/components/home/RelayerMap";
import { AgentsIntro } from "@/components/home/AgentsIntro";
import { StockTicker } from "@/components/home/StockTicker";
import { ModelsTable } from "@/components/home/ModelsTable";
import { ToolsGrid } from "@/components/home/ToolsGrid";
import { StatsBand } from "@/components/home/StatsBand";
import { PricingTeaser } from "@/components/home/PricingTeaser";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { FLAGS } from "@/config/flags";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      {FLAGS.recentTransfers && <RecentTransfers />}
      <LayerOrbit />
      <PrivateTrace />
      <TorSession />
      <CircuitPath />
      <CrowdChart />
      <ManifestoQuote />
      <TraceOdds />
      <PoolActivity />
      <RelayerMap />
      <AgentsIntro />
      <StockTicker />
      <ModelsTable />
      <ToolsGrid />
      <StatsBand />
      <PricingTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
