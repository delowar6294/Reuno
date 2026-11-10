/**
 * Robinhood Stock Tokens on Robinhood Chain (chain id 4663).
 *
 * Every address below comes from Robinhood's official asset registry API and was
 * confirmed on-chain (ERC-20 symbol() call) through the official public RPC.
 * Canonical list: https://docs.robinhood.com/chain/contracts
 * Never add an address that has not been verified the same way.
 */

export type TokenKind = "Stock token" | "ETF token";

export type StockTokenConfig = {
  ticker: string;
  name: string;
  kind: TokenKind;
  address: `0x${string}`;
};

export const STOCK_TOKENS: StockTokenConfig[] = [
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "NVDA",
    name: "NVIDIA",
    kind: "Stock token",
    address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "TSLA",
    name: "Tesla",
    kind: "Stock token",
    address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "AAPL",
    name: "Apple",
    kind: "Stock token",
    address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "MSFT",
    name: "Microsoft",
    kind: "Stock token",
    address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "AMZN",
    name: "Amazon",
    kind: "Stock token",
    address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "GOOGL",
    name: "Alphabet Class A",
    kind: "Stock token",
    address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "GLD",
    name: "SPDR Gold Trust",
    kind: "ETF token",
    address: "0xC9a981FEE1F9DEc688bb123ccDeCc63D0deBFC4e",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "QQQ",
    name: "Invesco QQQ",
    kind: "ETF token",
    address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "AMD",
    name: "AMD",
    kind: "Stock token",
    address: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    kind: "ETF token",
    address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "SLV",
    name: "iShares Silver Trust",
    kind: "ETF token",
    address: "0x411eFb0E7f985935DAec3D4C3ebaEa0d0AD7D89f",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "COST",
    name: "Costco",
    kind: "Stock token",
    address: "0x4EA005168D7F09a7A0Ba9D1DEf21a479950E44C2",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "CRCL",
    name: "Circle Internet Group",
    kind: "Stock token",
    address: "0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "HIMS",
    name: "Hims & Hers Health",
    kind: "Stock token",
    address: "0xCceE82fE024c36fA15E1005edE3E9e4787e23D09",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "MU",
    name: "Micron Technology",
    kind: "Stock token",
    address: "0xfF080c8ce2E5feadaCa0Da81314Ae59D232d4afD",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "USO",
    name: "United States Oil Fund",
    kind: "ETF token",
    address: "0xa30FA36Db767ad9eD3f7a60fC79526fB4d56D344",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "SGOV",
    name: "iShares 0-3 Month Treasury Bond",
    kind: "ETF token",
    address: "0x92FD66527192E3e61d4DDd13322Aa222DE86F9B5",
  },
  {
    // source: https://api.robinhood.com/rhj/assets (official Robinhood Stock Token API, documented at
    // https://docs.robinhood.com/chain/stock-token-apis); symbol() confirmed on the official RPC 2026-11-10
    ticker: "TTWO",
    name: "Take-Two Interactive Software",
    kind: "Stock token",
    address: "0x5e81213613b6B86EaB4c6c50d718d34359459786",
  },
];

/** Tickers eligible for the /stocks hero carousel, in priority order (spec section 1.5). */
export const FEATURED_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "GLD", "QQQ"] as const;

/** Native ETH as LI.FI expects it. */
export const NATIVE_ETH = "0x0000000000000000000000000000000000000000" as const;

// source: https://docs.robinhood.com/chain/contracts
export const WETH_ADDRESS = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as const;
// source: https://docs.robinhood.com/chain/contracts
export const USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;

export function tokenByTicker(ticker: string): StockTokenConfig | undefined {
  return STOCK_TOKENS.find((t) => t.ticker === ticker);
}
