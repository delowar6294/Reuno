export type ToolPreview =
  | { kind: "avatars"; letters: string[]; total: string }
  | { kind: "quote"; ticker: string; price: string }
  | { kind: "trade"; pairs: [string, string][]; pill: string }
  | { kind: "layers"; count: number }
  | { kind: "networks"; letters: string[]; amount: string };

export type Tool = {
  name: string;
  title: string;
  line: string;
  access: "read" | "write";
  preview: ToolPreview;
};

export const TOOLS: Tool[] = [
  {
    name: "reuno_portfolio",
    title: "See the agent's portfolio",
    line: "Every stock token and ETF in the wallet, valued in dollars, plus its ETH.",
    access: "read",
    preview: { kind: "avatars", letters: ["N", "T", "A"], total: "total —" },
  },
  {
    name: "reuno_quote",
    title: "Quote before every trade",
    line: "Price, 24h change and pool depth for any stock token.",
    access: "read",
    preview: { kind: "quote", ticker: "TSLA", price: "—" },
  },
  {
    name: "reuno_build_trade",
    title: "Buy and sell stock tokens",
    line: "Buy with ETH sized in ETH or dollars, or sell part of a position.",
    access: "write",
    preview: {
      kind: "trade",
      pairs: [
        ["side", "buy"],
        ["usd", "50"],
        ["chain_id", "4663"],
      ],
      pill: "unsigned · agent signs",
    },
  },
  {
    name: "reuno_private_transfer",
    title: "Send through five layers",
    line: "Move ETH or USDG through the full privacy stack from inside an agent.",
    access: "write",
    preview: { kind: "layers", count: 5 },
  },
  {
    name: "reuno_fund_agent",
    title: "Fund the agent wallet",
    line: "Bridge from Ethereum, Base, Arbitrum and more, arriving as ETH.",
    access: "write",
    preview: { kind: "networks", letters: ["E", "B", "A", "O", "BN", "P"], amount: "0.05 ETH" },
  },
];

export const SIGNING_STEPS = [
  { n: 1, title: "Reuno builds unsigned tx", line: "Your agent calls a write tool and gets back an unsigned transaction." },
  { n: 2, title: "agent wallet signs", line: "The agent's own wallet reviews and signs it. Reuno never sees a key." },
  { n: 3, title: "sent through layers", line: "The signed transaction is broadcast and routed through the privacy stack." },
];

export const REST_SNIPPET = `curl https://api.reuno.xyz/v1/chat/completions \\
  -H "Authorization: Bearer $REUNO_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek/deepseek-v4.1-flash","messages":[{"role":"user","content":"Quote TSLA"}]}'`;
