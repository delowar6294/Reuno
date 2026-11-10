import { Section, SectionHeading } from "@/components/layout/Section";
import { Logo } from "@/components/brand/Logo";
import { CardHeader, Divider } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { StatusDot } from "@/components/ui/StatusDot";

/** How a Reuno Tor session is built. Design facts only — no session numbers until the .onion service is live. */
const ROWS: { k: string; v: string }[] = [
  { k: "circuit", v: "3 hops, isolated per session" },
  { k: "access", v: ".onion hidden service" },
  { k: "ip logs", v: "none kept by the service" },
];

export function TorSession() {
  return (
    <Section tone="even" labelledBy="tor-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <div className="card mx-auto max-w-[480px] p-5 md:p-6">
            <CardHeader left="#tor-session" right={<Pill dot="brand">address at launch</Pill>} />
            <div className="mt-5 flex gap-3">
              <Logo size={32} decorative />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-ink-1">Reuno</span>
                <p className="mt-1.5 rounded-md rounded-tl-sm border border-line-1 bg-surface-2 px-4 py-3 text-sm text-ink-2">
                  Your session runs through 3 Tor relays. No server, ours included, sees your IP.
                </p>
              </div>
            </div>
            <dl className="mt-5 flex flex-col gap-2.5 rounded-sm border border-line-1 bg-surface-1 p-4">
              {ROWS.map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 font-mono text-[13px]">
                  <dt className="text-ink-3">{r.k}</dt>
                  <dd className="flex items-center gap-2 text-right text-ink-1">
                    <StatusDot tone="brand" pulse={false} />
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            <Divider className="mt-5" />
            <p className="mt-4 text-xs text-ink-3">
              The .onion address is published here and in the Tor dialog when the service goes live.
            </p>
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-6">
          <SectionHeading
            id="tor-title"
            eyebrow="tor from the first click"
            title="Invisible on the network too."
            sub="Open Reuno through its .onion address and every call, from signing to withdrawal, rides its own isolated Tor circuit."
          />
        </div>
      </div>
    </Section>
  );
}
