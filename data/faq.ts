export type Faq = { q: string; a: string };

export const FAQ: Faq[] = [
  {
    q: "Who holds the private keys?",
    a: "You do, or your agent does. Every transaction comes back unsigned and is signed by your own wallet. No Reuno API or MCP tool ever asks for a private key.",
  },
  {
    q: "Is Reuno a custodian?",
    a: "No. Funds move through smart contracts and independent relayers. Reuno never holds your assets.",
  },
  {
    q: "How is this accountable?",
    a: "You can share a viewing key for any transfer with an auditor or exchange, deposits are screened against public sanctions lists, and reserves of the pool are provable on-chain.",
  },
  {
    q: "Why Tor?",
    a: "On-chain privacy fails if your connection gives you away. The .onion address keeps your IP out of every server log, including ours.",
  },
  {
    q: "What do you log?",
    a: "We don't store prompts or replies. For agent calls we log time, key, model or tool, tokens, cost and status. The .onion service keeps no IP logs.",
  },
  {
    q: "Do I need to buy credits?",
    a: "No. Tools are free and model calls run on a daily allowance that resets at 00:00 UTC.",
  },
  {
    q: "Is Reuno part of Robinhood?",
    a: "No. Reuno is an independent project built on Robinhood Chain and is not affiliated with Robinhood.",
  },
  {
    q: "Can anyone use stock tokens?",
    a: "No. Stock tokens are not available to US persons and are restricted in several other countries. Reuno shows data and builds transactions; it does not sell stock tokens.",
  },
];
