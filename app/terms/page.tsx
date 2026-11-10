import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the Reuno app, API and MCP server.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="trust · terms"
      title="Terms of use"
      sub="The rules for using the Reuno app, API and MCP server."
      sections={[
        {
          heading: "Lawful use only",
          body: [
            "Reuno is a privacy tool for lawful use. You may not use it to launder funds, evade sanctions or hide the proceeds of crime. Deposits are screened and viewing keys are available.",
          ],
        },
        {
          heading: "Eligibility",
          body: [
            "Stock tokens are not available to US persons and are restricted in other countries. You are responsible for following the laws where you live.",
          ],
        },
        {
          heading: "Non-custodial service",
          body: [
            "Reuno builds unsigned transactions. You, or your agent, sign them with your own wallet. Reuno never holds your assets or keys.",
          ],
        },
        {
          heading: "API keys",
          body: [
            "Your key works like a password. Keep it secret. You are responsible for activity on your key.",
          ],
        },
        {
          heading: "No warranty",
          body: [
            "The service is provided as is, during a public beta, without warranties of any kind.",
          ],
        },
        {
          heading: "Not affiliated with Robinhood",
          body: ["Reuno is an independent project built on Robinhood Chain and is not affiliated with Robinhood."],
        },
      ]}
    />
  );
}
