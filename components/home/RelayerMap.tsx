import { Section, SectionHeading } from "@/components/layout/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { FLAGS } from "@/config/flags";
import { LAND_DOTS, MAP_COLS, MAP_ROWS, RELAYERS, project } from "@/data/relayers";

export function RelayerMap() {
  const live = FLAGS.relayerMap;
  return (
    <Section tone="even" labelledBy="map-title">
      <SectionHeading
        id="map-title"
        eyebrow="where relayers run"
        title="No single country sees every exit."
        sub={live ? undefined : "Relayers run in independent jurisdictions. Their live locations appear on this map when the relayer network launches."}
      />
      <Card className="mt-12">
        <CardHeader
          left={live ? "relayer regions · demo" : "relayer network"}
          right={live ? <span className="text-mono-label text-brand-300">5 regions</span> : <Pill dot="brand">map at launch</Pill>}
        />
        {live && (
          <p className="sr-only">
            World map with relayers in Frankfurt, Amsterdam, Ashburn, Singapore and Sydney. Demo data.
          </p>
        )}
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`}
          className="mt-6 h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <g className="fill-line-2">
            {LAND_DOTS.map((d) => (
              <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={0.28} />
            ))}
          </g>
          {/* Relayer markers render only when FLAGS.relayerMap is on — wire to the relayer registry first. */}
          {live &&
            RELAYERS.map((r) => {
              const p = project(r.lat, r.lon);
              const tx = r.labelSide === "right" ? p.x + 1.1 : p.x - 1.1;
              return (
                <g key={r.code}>
                  <circle cx={p.x} cy={p.y} r={0.6} className="fill-brand-300 opacity-30 motion-safe:animate-pulse-ring" style={{ transformOrigin: "center", transformBox: "fill-box" }} />
                  <circle cx={p.x} cy={p.y} r={1.2} className="fill-brand-300 opacity-15" />
                  <circle cx={p.x} cy={p.y} r={0.45} className="fill-brand-200" />
                  <text
                    x={tx}
                    y={p.y + r.labelDy + 0.35}
                    textAnchor={r.labelSide === "right" ? "start" : "end"}
                    className="fill-brand-200 font-mono"
                    style={{ fontSize: 1.05, letterSpacing: "0.06em" }}
                  >
                    {r.code}
                  </text>
                </g>
              );
            })}
        </svg>
      </Card>
    </Section>
  );
}
