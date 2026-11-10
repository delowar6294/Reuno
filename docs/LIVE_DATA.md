# Live data sources

Every number on the `/stocks` hero, the stocks grid, the stock ticker, the models table and the stats band comes from one of the sources below. All were verified with real requests on 2026-11-10.

## Robinhood Chain

| Item | Value | Source |
|---|---|---|
| Chain id | `4663` (testnet `46630`) | https://docs.robinhood.com/chain/connecting |
| Public RPC | `https://rpc.mainnet.chain.robinhood.com/` | https://docs.robinhood.com/chain/add-network-to-wallet |
| Explorer | `https://robinhoodchain.blockscout.com` | same pages |

`eth_chainId` on the RPC returns `0x1237` (4663).

## Token addresses — `config/tokens.ts`

Source: Robinhood's official Stock Token registry `GET https://api.robinhood.com/rhj/assets` (documented at https://docs.robinhood.com/chain/stock-token-apis; the canonical table is https://docs.robinhood.com/chain/contracts). It listed 203 active tokens on chain 4663. Each address used here was also confirmed on-chain: an ERC-20 `symbol()` call through the official RPC returned the expected ticker, and `decimals()` returned 18.

| Ticker | Address |
|---|---|
| NVDA | `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` |
| TSLA | `0x322F0929c4625eD5bAd873c95208D54E1c003b2d` |
| AAPL | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` |
| MSFT | `0xe93237C50D904957Cf27E7B1133b510C669c2e74` |
| AMZN | `0x12f190a9F9d7D37a250758b26824B97CE941bF54` |
| GOOGL | `0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3` |
| GLD | `0xC9a981FEE1F9DEc688bb123ccDeCc63D0deBFC4e` |
| QQQ | `0xD5f3879160bc7c32ebb4dC785F8a4F505888de68` |
| AMD, SPY, SLV, COST, CRCL, HIMS, MU, USO, SGOV, TTWO | see `config/tokens.ts` |

WETH `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` and USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` come from the static table on https://docs.robinhood.com/chain/contracts.

## Prices — DexScreener

- Chain id: `robinhood` (`robinhoodchain` and `robinhood-chain` return `[]`).
- `GET https://api.dexscreener.com/tokens/v1/robinhood/{up to 30 comma-separated addresses}`
- Fields used: `baseToken.address`, `priceUsd`, `priceChange.h24`, `liquidity.usd`, `pairAddress`, `url`. For each token we take the pair with the highest `liquidity.usd` where it is the base token.
- Sample (NVDA): `{"dexId":"uniswap","pairAddress":"0x62AB521f71431f78ac374CdbadC6cda3c8916b6C","quoteToken":{"symbol":"WETH"},"priceUsd":"167.17","priceChange":{"h24":-5.9},"liquidity":{"usd":1319658.93}}`
- Server cache: 30 s.

## Chart — GeckoTerminal

- Network id: `robinhood` (page 3 of `GET https://api.geckoterminal.com/api/v2/networks`).
- `GET /api/v2/networks/robinhood/pools/{pairAddress lowercased}/ohlcv/hour?aggregate=1&limit=24&currency=usd`
- Returns `data.attributes.ohlcv_list = [[unix, open, high, low, close, volume], …]`, newest first, plus `meta.base.address`, which is checked against the token. Works for Uniswap v3 pools and v4 pool ids.
- Free tier allows about 30 calls/min and rejects bursts with `429`. Candles are fetched one at a time and cached 5 min. After a 429 the server backs off for 60 s and serves the last good series.
- Fallback: if candles are unavailable, the chart uses DexScreener prices this server actually recorded, one point per 5 min, last 24 h. The chart starts short; no point is invented.

## Trades — LI.FI

- `GET https://li.quest/v1/chains` lists `{ id: 4663, key: "out", name: "Robinhood Chain" }`.
- `GET https://li.quest/v1/token?chain=4663&token=<addr>` → `priceUSD`, `decimals` (used to size the USD amount).
- `GET https://li.quest/v1/quote?fromChain=4663&toChain=4663&fromToken=…&toToken=…&fromAmount=…&fromAddress=…`
- Sample buy (0.01 ETH → NVDA): `tool: sushiswap`, `estimate.toAmount: 120416666611529904`, `feeCosts: [LIFI Fixed Fee $0.0504]`, `gasCosts: [$0.0234]`, `approvalAddress: 0xB477751B76CF82d00a686A1232f5fCD772414Af3`, `transactionRequest.chainId: 4663`.
- Sell quotes and GLD quotes also return routes (GLD is not in LI.FI's token list but routes anyway).
- Swaps settle publicly on Robinhood Chain. They do not go through Reuno's privacy layers, which are not live yet, and the UI says so.

## Models — OpenRouter

- `GET https://openrouter.ai/api/v1/models` → `data[].id`, `name`, `pricing.prompt` / `pricing.completion` (USD per token).
- `:batch` and `:free` variants are excluded. Server cache and page revalidate: 1 h.

## Feature flags — `config/flags.ts`

Blocks that need Reuno's own pool, relayers, .onion service or API are off. While off, they render a static explanation with no numbers.
