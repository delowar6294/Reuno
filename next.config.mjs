import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
// wagmi's `wagmi/connectors` barrel bundles every wallet SDK (Coinbase CDP, Base, Porto, Gemini…),
// some of which import optional packages that aren't installed. We point private specifiers straight
// at the three connector files we use.
const connectorsDir = join(dirname(require.resolve("@wagmi/connectors/package.json")), "dist", "esm");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "reuno-walletconnect-connector$": join(connectorsDir, "walletConnect.js"),
      "reuno-coinbase-connector$": join(connectorsDir, "coinbaseWallet.js"),
      "reuno-metamask-connector$": join(connectorsDir, "metaMask.js"),
      // coinbaseWallet's legacy v3 path imports `cbw-sdk`; we only use v4 (@coinbase/wallet-sdk).
      "cbw-sdk": false,
      // MetaMask SDK optionally imports React Native storage; not used on the web.
      "@react-native-async-storage/async-storage": false,
    };
    // Optional Node-only peers of the WalletConnect provider, not needed in the browser.
    config.externals = [...(Array.isArray(config.externals) ? config.externals : []), "pino-pretty", "lokijs", "encoding"];
    return config;
  },
};

export default nextConfig;
