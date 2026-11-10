# Reuno

Next.js 15 site for Reuno on Robinhood Chain. Read [CLAUDE.md](CLAUDE.md) first: nothing on the site is fake, and Reuno never holds keys or signs for users.

## Setup

1. Install and configure:

   ```bash
   npm install
   cp .env.example .env.local
   ```

2. Fill in `.env.local` (every variable is documented in `.env.example`).
3. **WalletConnect** (optional but recommended):
   - Create a project at <https://cloud.reown.com> and put its id in `NEXT_PUBLIC_WC_PROJECT_ID`.
   - Set `NEXT_PUBLIC_SITE_URL` to your production URL. It is used as the WalletConnect metadata `url`, so it must match.
   - In the Reown dashboard, add the production domain (and any preview domains) to the project's **domain allowlist**. Without it, mobile wallets reject the session.
   - If the id is missing, the WalletConnect option is hidden and a warning is logged in development. Browser wallets still work.
4. Run:

   ```bash
   npm run dev
   ```

5. Before every commit:

   ```bash
   npm run build && npm run lint && npx tsc --noEmit
   ```

Data sources and verified ids: [docs/LIVE_DATA.md](docs/LIVE_DATA.md). Transaction audit: [AUDIT.md](AUDIT.md).

## Mainnet test checklist

Run this yourself with a tiny amount. Claude Code stops at the wallet prompt and never sends.
Use a wallet you control, plus a **second address of your own** for the transfer step. Keep the explorer open: <https://robinhoodchain.blockscout.com>.

| # | Step | What success looks like |
|---|---|---|
| 1 | **Add network.** On `/app`, click **Add Robinhood Chain to wallet**. | Wallet shows an "Add network" prompt with chain id 4663, RPC `https://rpc.mainnet.chain.robinhood.com/`, currency ETH, explorer `robinhoodchain.blockscout.com`. After approving, the button reports "Robinhood Chain is ready" and the header shows your address and ETH balance. If the wallet blocks it, use **Add manually** and copy each field. |
| 2 | **Get ETH for gas.** Open the wallet menu → **Get ETH on Robinhood Chain** (or use the button in a gas notice). Pick the chain you hold ETH on, enter about $3, **Get bridge quote**, **Review & sign**. | The wallet asks you to sign on the source chain. The tracker shows **Sent on <chain>** with a source-explorer link, then **Bridging via <tool>**, then **Received on Robinhood Chain** with a `robinhoodchain.blockscout.com/tx/…` link. Your ETH balance on Robinhood Chain goes up by about the "you receive" amount. Click **Switch back to Robinhood Chain**. |
| 3 | **Swap $1 of ETH into one stock token.** Swap tab → pick e.g. NVDA → Buy → enter `1` → **Get buy quote**. | The quote shows the route, minimum received (0.5% slippage), and "Simulation passed. Ready to sign." **Review & sign** opens the wallet. After signing: "Buy sent. Waiting for 1 confirmation…" → "Buy confirmed on Robinhood Chain." with an explorer link. On the explorer the tx status is Success and NVDA arrives at your address. ETH balance drops by about $1 plus gas. |
| 4 | **Add that token to the wallet.** Click the **+** next to NVDA (quote card, swap selector, stocks grid or wallet menu). | Wallet shows a "Add suggested token" prompt for NVDA with 18 decimals. After approving, the button shows "Added" and the wallet lists your NVDA balance. |
| 5 | **Swap it back.** Same token → Sell → enter an amount below what you hold → **Get sell quote**. | First **Approve NVDA** (exact amount): wallet prompt → "Approval confirmed". Then **Review & sign** for the swap → "Sell confirmed on Robinhood Chain." with an explorer link. NVDA balance goes down; ETH goes up by about the quoted amount minus gas. |
| 6 | **Standard transfer to your second address.** Send tab → asset ETH (or NVDA) → paste your second address → a tiny amount (e.g. `0.00001`) → **Review & send**. | "Simulation passed · network gas ≈ …". The wallet shows a plain transfer to your second address. After signing: "Transfer confirmed on Robinhood Chain." with an explorer link; the second address's balance on the explorer goes up by exactly that amount. |

If any step shows a red message instead of opening the wallet, that is the simulation catching a failure (for example "TSLA token trading is paused right now"). Nothing was sent.
