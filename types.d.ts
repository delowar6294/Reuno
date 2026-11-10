declare module "*.css";

// Aliased in next.config.mjs to @wagmi/connectors/dist/esm/walletConnect.js (see comment there).
declare module "reuno-walletconnect-connector" {
  export { walletConnect } from "@wagmi/connectors";
}
