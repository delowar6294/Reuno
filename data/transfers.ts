// DEMO DATA — replace with live source

export type TransferRow = { time: string; text: string; status: "unlinked" | "signed by agent" };

export const TRANSFERS: TransferRow[] = [
  { time: "09:41:02", text: "10 ETH · 7 shards", status: "unlinked" },
  { time: "09:38:57", text: "2,400 USDG · 4 shards", status: "unlinked" },
  { time: "09:31:14", text: "swap ETH→USDG · 5 shards", status: "unlinked" },
  { time: "09:24:40", text: "agent buy TSLA $50", status: "signed by agent" },
  { time: "09:19:08", text: "0.5 ETH · 3 shards", status: "unlinked" },
];

export type LiveStep = { label: string; tone: "ok" | "warn"; right?: string };

export const LIVE_TRANSFER = {
  header: "transfer · demo data",
  meta: "5 layers / tor",
  amount: "10.00 ETH",
  steps: [
    { label: "fresh vault — single use", tone: "ok" },
    { label: "shard split — 7 shards", tone: "ok" },
    { label: "relay exit — waiting on delay", tone: "warn", right: "14 min" },
  ] satisfies LiveStep[],
};
