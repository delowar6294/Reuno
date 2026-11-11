import Link from "next/link";
import { Lockup } from "@/components/brand/Wordmark";
import { Tooltip } from "@/components/ui/Tooltip";
import { XLink } from "@/components/ui/XLink";
import { FOOTER_COLUMNS } from "@/data/nav";
import { Container } from "./Container";
import { ComplianceRow } from "./ComplianceRow";

const linkClass =
  "rounded-sm text-sm text-ink-2 transition-colors duration-[180ms] hover:text-ink-1";

export function Footer() {
  return (
    <footer className="border-t border-line-1 bg-bg-1 pb-10 pt-16 md:pt-20">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Lockup size="footer" />
            <p className="max-w-[32ch] text-ink-2">Private rails for people and their agents.</p>
            <ComplianceRow />
            <XLink label className="self-start border border-line-1" />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-mono-label mb-4 text-ink-3">{col.title.toLowerCase()}</h2>
                <ul className="flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.soon ? (
                        <Tooltip content="soon">
                          <a href={l.href} className={linkClass} aria-disabled="true">
                            {l.label}
                          </a>
                        </Tooltip>
                      ) : l.external ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className={linkClass}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-line-1 pt-8">
          <span className="text-sm text-ink-3">© 2026 Reuno</span>
        </div>

        <p className="mt-6 max-w-[110ch] text-xs leading-relaxed text-ink-3">
          Independent project, not affiliated with Robinhood. Stock tokens are not available to US
          persons and are restricted in other countries. Reuno is a privacy tool for lawful use;
          deposits are screened and viewing keys are available. Nothing here is investment advice.
        </p>
      </Container>
    </footer>
  );
}
