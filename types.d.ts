declare module "*.css";

// Aliased in next.config.mjs to single connector files in @wagmi/connectors/dist/esm (see comment there).
declare module "reuno-walletconnect-connector" {
  export { walletConnect } from "@wagmi/connectors";
}
declare module "reuno-coinbase-connector" {
  export { coinbaseWallet } from "@wagmi/connectors";
}
declare module "reuno-metamask-connector" {
  export { metaMask } from "@wagmi/connectors";
}
