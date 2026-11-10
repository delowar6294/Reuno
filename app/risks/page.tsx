import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Risks",
  description: "The risks of using Reuno, smart contracts, stock tokens and the $REUNO token.",
};

export default function RisksPage() {
  return (
    <LegalPage
      eyebrow="trust · risks"
      title="Risks"
      sub="Read this before you move funds through Reuno or hold $REUNO."
      sections={[
        {
          heading: "Beta software",
          body: [
            "Reuno is in beta. Transfers are capped while the system is tested in public. Bugs can cause delays or loss of funds.",
          ],
        },
        {
          heading: "Smart contract risk",
          body: [
            "Funds move through smart contracts and independent relayers. Contracts can contain flaws even after review, and on-chain transactions cannot be reversed.",
          ],
        },
        {
          heading: "Privacy is not absolute",
          body: [
            "The privacy layers reduce the odds of tracing a transfer; they do not make it impossible. Traceability figures will be published only after they have been measured and audited.",
          ],
        },
        {
          heading: "Stock tokens",
          body: [
            "Stock tokens are not available to US persons and are restricted in several other countries. Their prices can move sharply and they may not track the underlying share exactly.",
          ],
        },
        {
          heading: "The $REUNO token",
          body: [
            "$REUNO is not an investment and nothing here promises its price. It may lose all of its value.",
          ],
        },
        {
          heading: "No advice",
          body: ["Nothing on this site is investment, legal or tax advice."],
        },
      ]}
    />
  );
}
