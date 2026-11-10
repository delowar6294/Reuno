import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Reuno collects, what it never stores and how the .onion service handles your connection.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="trust · privacy"
      title="Privacy policy"
      sub="We built a privacy product, so we try hard to know as little about you as possible."
      sections={[
        {
          heading: "What we don't store",
          body: [
            "We don't store prompts or replies sent through the agent API. We never ask for or hold private keys.",
          ],
        },
        {
          heading: "What we log",
          body: [
            "For agent calls we log time, key, model or tool, tokens, cost and status, so we can bill allowances and stop abuse.",
            "API keys are stored only as a salted SHA-256 hash.",
          ],
        },
        {
          heading: "Tor and IP addresses",
          body: [
            "The .onion service keeps no IP logs. On clearnet, our hosting provider may see connection metadata; use Tor if that matters to you.",
          ],
        },
        {
          heading: "On-chain data",
          body: [
            "Blockchain transactions are public by nature. Reuno's layers are designed to break the links between them, but the transactions themselves remain on-chain.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about this policy can be sent to the address listed on the security page."],
        },
      ]}
    />
  );
}
