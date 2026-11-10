// DEMO DATA — replace with live source

export type StockToken = { ticker: string; kind: "stock" | "etf" };

export const STOCKS: StockToken[] = [
  { ticker: "TSLA", kind: "stock" },
  { ticker: "NVDA", kind: "stock" },
  { ticker: "AAPL", kind: "stock" },
  { ticker: "MSFT", kind: "stock" },
  { ticker: "GOOGL", kind: "stock" },
  { ticker: "AMZN", kind: "stock" },
  { ticker: "AMD", kind: "stock" },
  { ticker: "SPY", kind: "etf" },
  { ticker: "QQQ", kind: "etf" },
  { ticker: "GLD", kind: "etf" },
  { ticker: "SLV", kind: "etf" },
  { ticker: "COST", kind: "stock" },
  { ticker: "CRCL", kind: "stock" },
  { ticker: "HIMS", kind: "stock" },
  { ticker: "MU", kind: "stock" },
  { ticker: "USO", kind: "etf" },
  { ticker: "SGOV", kind: "etf" },
  { ticker: "TTWO", kind: "stock" },
];

/** Tickers cycled in the /stocks hero preview card. Labels are descriptive only. */
export const HERO_TICKERS = [
  { ticker: "TSLA", label: "stock token" },
  { ticker: "NVDA", label: "stock token" },
  { ticker: "SPY", label: "ETF token" },
  { ticker: "GLD", label: "ETF token" },
];

export const STOCK_FACTS = [
  { value: "60+", label: "stock tokens & ETFs" },
  { value: "4663", label: "robinhood chain id" },
  { value: "5", label: "privacy layers" },
];

export const US_PERSONS_NOTICE =
  "Stock tokens are not available to US persons and are restricted in several other countries. Reuno shows data and builds transactions; it does not sell stock tokens.";
