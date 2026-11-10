import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
// wagmi's `wagmi/connectors` barrel bundles every wallet SDK (Coinbase CDP, Base, MetaMask SDK…),
// some of which import optional packages that aren't installed. We only use WalletConnect, so we
// point a private specifier straight at that one connector file.
const connectorsDir = join(dirname(require.resolve("@wagmi/connectors/package.json")), "dist", "esm");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "reuno-walletconnect-connector$": join(connectorsDir, "walletConnect.js"),
    };
    // Optional Node-only peers of the WalletConnect provider, not needed in the browser.
    config.externals = [...(Array.isArray(config.externals) ? config.externals : []), "pino-pretty", "lokijs", "encoding"];
    return config;
  },
};

export default nextConfig;
