import type { Metadata } from "next";
import { Eye, FileSignature, Gauge, KeyRound, MessageSquareOff, Network, ScanSearch, ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Reveal, RevealItem } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Reuno protects users: unsigned transactions, hashed keys, no prompt storage, daily caps, Tor with no IP logs, viewing keys and deposit screening.",
};

const ITEMS = [
  { icon: FileSignature, title: "Unsigned transactions", line: "Every transaction is returned unsigned. Your wallet, or your agent's, is the only thing that can sign it." },
  { icon: KeyRound, title: "Keys shown once", line: "API keys are shown a single time. We store only a salted SHA-256 hash, so a leaked database leaks no keys." },
  { icon: MessageSquareOff, title: "No prompt storage", line: "Prompts and replies pass through and are never written to disk. Usage logs hold only metadata." },
  { icon: Gauge, title: "Daily caps", line: "Allowances and beta transfer caps limit the damage of a stolen key or a runaway agent." },
  { icon: Network, title: "Tor, no IP logs", line: "The .onion service keeps no IP logs, and each session rides its own isolated circuit." },
  { icon: Eye, title: "Viewing keys", line: "Share a read-only viewing key for any transfer with an auditor or exchange, and nobody else." },
  { icon: ScanSearch, title: "Deposit screening", line: "Deposits are screened against public sanctions lists before they enter the pool." },
  // TODO: replace security@reuno.xyz with the real disclosure address before launch
  { icon: ShieldAlert, title: "Report a vulnerability", line: "Found something? Write to security@reuno.xyz. We reply within two business days." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="security"
        title="Built so we can't lose what we never hold."
        sub="Reuno never holds funds or private keys. Everything else is designed to keep what it does see to a minimum."
      />
      <Section tone="even" className="pt-12 md:pt-16">
        <Reveal as="ul" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, line }) => (
            <RevealItem
              as="li"
              key={title}
              className="card flex flex-col gap-4 p-5 transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2 md:p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line-2 bg-surface-3 text-brand-300">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="text-h3 text-ink-1">{title}</h2>
              <p className="text-sm text-ink-2">{line}</p>
            </RevealItem>
          ))}
        </Reveal>
      </Section>
    </>
  );
}
