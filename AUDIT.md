# Audit

## Mainnet tx

Reproduced on Robinhood Chain mainnet (chain id 4663) on 2026-11-11, driving the swap, approve, standard transfer and gas-bridge flows up to the wallet signature prompt with a test EIP-1193 wallet in the browser. That wallet answers every signing request with error 4001, so **no transaction was sent**. Calldata was additionally checked with `eth_call` and `eth_estimateGas` against the official RPC.

### Errors found and fixes

| # | What happened (exact message) | Where | Fix |
|---|---|---|---|
| 1 | Connecting a wallet that was on another chain, or that did not have Robinhood Chain yet, failed with **"User rejected the request."** — `connect({ chainId: 4663 })` forces a network switch during connect, and wagmi treats a declined or incomplete switch as a rejection of the whole connection. | `components/trade/ConnectWalletModal.tsx` | Connect first without forcing a chain; the button then shows **Switch to Robinhood Chain**, which runs `addRobinhoodChain()` (add → switch, 4001/4902 handled). |
| 2 | The **Get ETH on Robinhood Chain** dialog vanished mid-bridge: switching the wallet to the source chain made the trade panel hide its gas notice, which unmounted the dialog it hosted. | `components/wallet/GasNotice.tsx`, `components/trade/TradePanel.tsx` | The dialog now lives in `components/wallet/BridgeProvider.tsx`, mounted once inside `Web3Provider`, so chain switches can't unmount it. |
| 3 | `GET https://li.quest/v1/status?txHash=<unknown hash>` returned **`"status":"DONE"`** for an unrelated transfer (its `sending.txHash` was a different hash). The tracker would have shown a finished bridge that never happened. | `lib/server/lifi.ts` (`getBridgeStatus`) | Only trust the status when `sending.txHash` (and `sending.chainId`) match the user's own transaction; otherwise report `NOT_FOUND` and keep polling. |
| 4 | Bridging with an empty source-chain wallet showed **"Not enough ETH on Robinhood Chain to cover this transaction and gas."** — wrong chain in the message. | `components/wallet/BridgeModal.tsx` | Check the source-chain balance before simulating and say e.g. "Your wallet has 0 ETH on Ethereum; this needs about … ETH including gas." |
| 5 | A reverting stock-token transfer showed **"The transaction would fail: custom error 0xec442f05"**. | `lib/wallet/revert.ts` | Decode the raw revert data against known OpenZeppelin v5 errors (`0xec442f05` = `ERC20InvalidReceiver`) and map to plain words: "TSLA token can't be sent to that address." Pause / restriction errors map to "TSLA token trading is paused right now" / "…transfers are restricted for this wallet right now". |
| 6 | After switching accounts in the wallet, the open quote (LI.FI calldata built for the previous address) stayed signable. | `components/trade/TradePanel.tsx` | Any account change closes the open quote. |
| 7 | `eth_call` on Robinhood Chain accepted a value-carrying swap from an address holding **0 ETH** (simulation "passed"), so simulation alone can't detect missing funds. | `lib/wallet/tx.ts` | Preflight reads the ETH balance first and compares it with `value + gas × maxFeePerGas × 1.2`. |
| 8 | With balance < value, `eth_estimateGas` can't run, so the gas notice could not say how much ETH was needed. | `lib/wallet/tx.ts` | Estimate with a state override (balance set high for the estimate only; the official RPC supports this) → "You need about 0.0245 ETH on Robinhood Chain (0.02442 for the swap plus gas)". |
| 9 | Previous trade flow (before this step) sent LI.FI's `transactionRequest` straight to the wallet: no simulation, no gas/balance check, no explicit EIP-1559 fees, chain switch via wagmi only. | `components/trade/TradePanel.tsx` | Every approve / swap / transfer / bridge now goes through `useTxRunner` / the bridge flow: ensure chain 4663 → simulate (`simulateContract` for ERC-20 writes, `publicClient.call` for raw requests; a revert never opens the wallet) → `estimateGas` + 20% → `estimateFeesPerGas` → wallet signs → `waitForTransactionReceipt` (1 confirmation) → success or decoded revert → balances refreshed. |
| 10 | `tsc`: **TS2737 BigInt literals are not available when targeting lower than ES2020.** | `tsconfig.json` | `target` raised from ES2017 to ES2020 (Next compiles with SWC; no runtime change). |

### Verified on-chain behaviour

- `wallet_addEthereumChain` params sent: `{ chainId: "0x1237", chainName: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://rpc.mainnet.chain.robinhood.com/"], blockExplorerUrls: ["https://robinhoodchain.blockscout.com"] }`, followed by `wallet_switchEthereumChain`.
- `wallet_watchAsset` params sent for NVDA: `{ type: "ERC20", options: { address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", symbol: "NVDA", decimals: 18 } }` (decimals read from the contract).
- Swap reaching the wallet: `to` = LI.FI diamond `0xB477751B76CF82d00a686A1232f5fCD772414Af3`, `gas` = estimate + 20%, `maxFeePerGas` ≈ 0.024 gwei, `maxPriorityFeePerGas` = 0, value = quoted ETH.
- `eth_call` + `eth_estimateGas` (balance override) on the official RPC: LI.FI buy NVDA ✓ (359,302 gas), direct Uniswap v3 buy GLD ✓ (196,441), direct buy TSLA ✓ (197,362).
- A TSLA transfer from an address that holds TSLA simulates fine (no transfer restriction observed for that holder).

### Not verified

- A real signed transaction (by rule). The owner runs the checklist in `README.md`.
- WalletConnect (no project id configured yet).
- The direct Uniswap v3 **sell** calldata (`multicall(deadline, [exactInputSingle → router, unwrapWETH9])`) was not simulated: that needs a holder with an allowance to the router. Buys were simulated.
- The bridge status tracker against a real bridge transaction (the endpoint and the mismatch guard were tested).
