export type Layer = {
  n: 1 | 2 | 3 | 4 | 5;
  code: "FV" | "SS" | "TB" | "ZK" | "RX";
  name: string;
  line: string;
  defeats: string;
};

export const LAYERS: Layer[] = [
  { n: 1, code: "FV", name: "Fresh vault", line: "A brand-new, single-use wallet receives your deposit.", defeats: "address reuse" },
  { n: 2, code: "SS", name: "Shard split", line: "The amount is split into random shards that never sum in one place.", defeats: "amount matching" },
  { n: 3, code: "TB", name: "Tide batch", line: "Shards wait and move in batches with everyone else's.", defeats: "timing analysis" },
  { n: 4, code: "ZK", name: "ZK pool", line: "A zero-knowledge proof releases funds without revealing the deposit.", defeats: "deposit linking" },
  { n: 5, code: "RX", name: "Relay exit", line: "An independent relayer pays gas and sends funds out on a delay.", defeats: "gas-payer linking" },
];

export type OrbitNode = { code: string; caption: string };

export const ORBIT_NODES: OrbitNode[] = [
  { code: "TR", caption: "tor" },
  { code: "FV", caption: "vault" },
  { code: "SS", caption: "shards" },
  { code: "TB", caption: "batch" },
  { code: "ZK", caption: "zk pool" },
  { code: "RX", caption: "relay" },
  { code: "ETH", caption: "eth" },
  { code: "USDG", caption: "usdg" },
];

export type TraceOdd = { n: number; name: string; value: string; pct: number };

/** Design targets from an illustrative model — not measured figures. */
export const TRACE_ODDS: TraceOdd[] = [
  { n: 1, name: "fresh vault", value: "100%", pct: 100 },
  { n: 2, name: "shard split", value: "12%", pct: 12 },
  { n: 3, name: "tide batch", value: "1.5%", pct: 4 },
  { n: 4, name: "zk pool", value: "0.02%", pct: 1.5 },
  { n: 5, name: "relay exit", value: "0.0001%", pct: 0.6 },
];

export type TraceStep = { label: string; start: number; end: number; range: string };

// DEMO DATA — replace with live source
export const TRACE_DEMO = {
  title: "transfer #41982 · demo",
  status: "unlinked in 14 min",
  total: 16,
  ticks: [0, 4, 8, 12, 16],
  steps: [
    { label: "fresh vault", start: 0, end: 1, range: "0–1 min" },
    { label: "shard split (7)", start: 1, end: 2, range: "1–2 min" },
    { label: "batch + zk pool", start: 2, end: 11, range: "2–11 min" },
    { label: "relay exit", start: 11, end: 14, range: "11–14 min (delay)" },
  ] satisfies TraceStep[],
};
