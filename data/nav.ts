export type NavLink = { label: string; href: string; soon?: boolean; external?: boolean };

export const NAV_LINKS: NavLink[] = [
  { label: "Layers", href: "/#layers" },
  { label: "Agents", href: "/agents" },
  { label: "Models", href: "/models" },
  { label: "Stocks", href: "/stocks" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export type FooterColumn = { title: string; links: NavLink[] };

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Open app", href: "/app" },
      { label: "Agents", href: "/agents" },
      { label: "Models", href: "/models" },
      { label: "Stocks", href: "/stocks" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Status", href: "#", soon: true },
      { label: "Changelog", href: "#", soon: true },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Risks", href: "/risks" },
    ],
  },
  {
    title: "Community",
    links: [
      // TODO: replace with the real Reuno X profile URL before launch
      { label: "X", href: "https://x.com/", external: true },
      // TODO: replace with the real Reuno Telegram URL before launch
      { label: "Telegram", href: "https://t.me/", external: true },
    ],
  },
];
