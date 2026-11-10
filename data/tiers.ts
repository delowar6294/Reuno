export type Tier = { hold: string; allowance: string };

export const TIERS: Tier[] = [
  { hold: "$25", allowance: "$0.40/day" },
  { hold: "$100", allowance: "$1.25/day" },
  { hold: "$500", allowance: "$5/day" },
  { hold: "$2,500+", allowance: "$15/day" },
];

export type ChargeRow = { item: string; how: string };

export const CHARGES: ChargeRow[] = [
  { item: "Models", how: "Provider list price, no markup" },
  { item: "Tool calls", how: "Free" },
  { item: "Private transfers", how: "Network + relayer fees" },
  { item: "Trades / funding", how: "Route fees shown before signing" },
  { item: "Free allowance", how: "Low-cost models, replies up to 512 tokens" },
  { item: "Holder allowance", how: "$0.40–$15/day, resets 00:00 UTC" },
];

export const HOLDING_RULES = [
  "Your holding is the lowest balance in the last 24h.",
  "Tokens you received rather than bought count after 7 days.",
  "Only regular wallets count; contracts and pools do not.",
];
