import { Section, SectionHeading } from "@/components/layout/Section";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { CardHeader, Divider } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { Tooltip } from "@/components/ui/Tooltip";

const ROWS: { k: string; v: string; ok?: boolean }[] = [
  { k: "circuit", v: "3 hops, isolated" },
  { k: "access", v: ".onion hidden service" },
  { k: "ip exposed", v: "none", ok: true },
];

export function TorSession() {
  return (
    <Section tone="even" labelledBy="tor-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <div className="card mx-auto max-w-[480px] p-5 md:p-6">
            <CardHeader left="#tor-session · today" right={<StatusDot tone="ok" label="Session online" />} />
            <div className="mt-5 flex gap-3">
              <Logo size={32} decorative />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-ink-1">Reuno</span>
                  <span className="mono-num text-xs text-ink-3">9:41</span>
                </div>
                <p className="mt-1.5 rounded-md rounded-tl-sm border border-line-1 bg-surface-2 px-4 py-3 text-sm text-ink-2">
                  Your session runs through 3 Tor relays. No server, ours included, sees your IP.
                </p>
              </div>
            </div>
            <dl className="mt-5 flex flex-col gap-2.5 rounded-sm border border-line-1 bg-surface-1 p-4">
              {ROWS.map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 font-mono text-[13px]">
                  <dt className="text-ink-3">{r.k}</dt>
                  <dd className="flex items-center gap-2 text-ink-1">
                    {r.ok && <StatusDot tone="ok" pulse={false} />}
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            <Divider className="mt-5" />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tooltip content="demo">
                  <Button variant="secondary" size="sm" disabled>
                    New circuit
                  </Button>
                </Tooltip>
                <Tooltip content="demo">
                  <Button variant="ghost" size="sm" disabled>
                    Close session
                  </Button>
                </Tooltip>
              </div>
              <span className="mono-num text-xs text-ink-3">session 26 min</span>
            </div>
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
