# Reuno — permanent rules for every task

1. NOTHING FAKE. No demo data, no mock numbers, no placeholder prices, no invented contract/pool addresses, no simulated transactions, no "illustrative" charts. Every number shown comes from a live source (chain RPC, DexScreener, GeckoTerminal, LI.FI, OpenRouter, our own database).
2. If a real source is missing or fails: show a real loading state, an honest "unavailable" state, or hide the block behind a flag in config/flags.ts. Never fill the gap with invented values.
3. Addresses and chain config only from official sources (Robinhood docs at https://docs.robinhood.com/chain/ and the official explorer). Each address gets a `// source: <url>` comment. If it can't be verified, leave it out.
4. Design tokens only (globals.css). No raw hex/rgb/hsl in components, no default Tailwind color classes. Dark theme only. Keep the existing cyan + silver + navy system.
5. Reuno never holds private keys and never signs for the user. Every transaction is built unsigned and signed in the user's own wallet.
6. Secrets only in .env.local, never in client code. Every env var used must appear in .env.example with a comment. NEXT_PUBLIC_ only for values that are safe to expose.
7. Every step ends with: `npm run build`, `npm run lint`, `npx tsc --noEmit` all passing with zero errors and zero warnings, no hydration warnings in the browser console, and a short report of what changed. Fix all failures before reporting done.
8. Never send a real transaction during testing. Stop at the wallet confirmation prompt.
9. Respect prefers-reduced-motion, keyboard access and 360px mobile width (no horizontal scroll) on everything you touch.
