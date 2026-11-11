// Wallets offered in the connect modal. All are EVM wallets that can add Robinhood Chain (4663).
//
// Logos: official files saved in public/wallets (never redrawn). Each `// source:` names where the file came from.
// Installed browser wallets use the icon they announce themselves via EIP-6963 instead.
// Install links: taken from each wallet's own website on 2026-11-11. Where the site links only to its own
// download page (no direct store links in the page), that official page is used.
// WalletConnect explorer ids: from Reown's official AppKit (`@reown/appkit-utils` PresetsUtil.ConnectorExplorerIds).
// Ids not published there are looked up at runtime by name from the Reown explorer when a project id is set.

export type WalletConfig = {
  id: string;
  name: string;
  /** EIP-6963 reverse-DNS id, used to match an installed extension. */
  rdns?: string;
  logo: string;
  install: { chrome?: string; ios?: string; android?: string; page: string };
  /** Reown/WalletConnect explorer id, for mobile deep links. */
  wcExplorerId?: string;
  /** Connect through the Coinbase Wallet SDK (extension, Smart Wallet or mobile) instead of an install page. */
  sdk?: "coinbase" | "metamask";
  /** Reachable only through WalletConnect (no browser extension). */
  walletConnectOnly?: boolean;
};

export const WALLETS: WalletConfig[] = [
  {
    id: "metamask",
    name: "MetaMask",
    rdns: "io.metamask",
    // source: https://metamask.com/favicons/default/favicon.svg (linked as icon from https://metamask.io/download)
    logo: "/wallets/metamask.svg",
    install: {
      // source: https://metamask.io/download
      chrome: "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
      ios: "https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202",
      android: "https://play.google.com/store/apps/details?id=io.metamask",
      page: "https://metamask.io/download",
    },
    wcExplorerId: "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    sdk: "metamask",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    rdns: "com.coinbase.wallet",
    // source: Coinbase's own SDK, @coinbase/wallet-sdk dist/assets/wallet-logo.js walletLogo("standard")
    logo: "/wallets/coinbase.svg",
    install: { page: "https://www.coinbase.com/wallet/downloads" },
    wcExplorerId: "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
    sdk: "coinbase",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    rdns: "com.trustwallet.app",
    // source: https://trustwallet.com/icon.svg (linked as icon from https://trustwallet.com/download)
    logo: "/wallets/trust.svg",
    install: {
      // source: https://trustwallet.com/download
      chrome: "https://chrome.google.com/webstore/detail/trust-wallet/egjidjbpglichdcondbcbdnbeeppgdph",
      ios: "https://apps.apple.com/app/apple-store/id1288339409?mt=8",
      android: "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
      page: "https://trustwallet.com/download",
    },
    wcExplorerId: "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
  },
  {
    id: "rabby",
    name: "Rabby",
    rdns: "io.rabby",
    // source: https://rabby.io/assets/images/favicon.png (linked as icon from https://rabby.io/)
    logo: "/wallets/rabby.png",
    install: {
      // source: https://rabby.io/
      chrome: "https://chrome.google.com/webstore/detail/rabby/acmacodkjbdgmoleebolmdjonilkdbch",
      ios: "https://apps.apple.com/us/app/rabby-wallet-crypto-evm/id6474381673",
      android: "https://play.google.com/store/apps/details?id=com.debank.rabbymobile",
      page: "https://rabby.io/",
    },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    rdns: "com.okex.wallet",
    // source: https://web3.okx.com/cdn/assets/imgs/441/655A924890DB43CDA7E79F6A9CA93434.png (icon of https://web3.okx.com/download)
    logo: "/wallets/okx.png",
    install: { page: "https://web3.okx.com/download" },
    wcExplorerId: "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    rdns: "me.rainbow",
    // source: https://rainbow.me/assets/favicon.png (linked as icon from https://rainbow.me/download)
    logo: "/wallets/rainbow.png",
    install: {
      // source: https://rainbow.me/download
      chrome: "https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama",
      page: "https://rainbow.me/download",
    },
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    rdns: "com.bitget.web3",
    // source: https://web3.bitget.com/favicon-48x48.png (linked as icon from https://web3.bitget.com/en/wallet-download)
    logo: "/wallets/bitget.png",
    install: {
      // source: https://web3.bitget.com/en/wallet-download
      chrome: "https://chromewebstore.google.com/detail/bitget-wallet/jiidiaalihmmhddjgbnbgdfflelocpak",
      ios: "https://apps.apple.com/app/id1395301115",
      android: "https://play.google.com/store/apps/details?id=com.bitkeep.wallet",
      page: "https://web3.bitget.com/en/wallet-download",
    },
    wcExplorerId: "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662",
  },
  {
    id: "phantom",
    name: "Phantom",
    rdns: "app.phantom",
    // source: https://phantom.com/_web_platform_assets/favicon.svg (linked as icon from https://phantom.com/download)
    logo: "/wallets/phantom.svg",
    install: {
      // source: https://phantom.com/download
      chrome: "https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa",
      ios: "https://apps.apple.com/app/phantom-solana-wallet/1598432977",
      android: "https://play.google.com/store/apps/details?id=app.phantom",
      page: "https://phantom.com/download",
    },
    wcExplorerId: "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
  },
  {
    id: "zerion",
    name: "Zerion",
    rdns: "io.zerion.wallet",
    // source: https://zerion.io/favicon-mark.png (linked as icon from https://zerion.io/download)
    logo: "/wallets/zerion.png",
    install: { page: "https://zerion.io/download" },
  },
  {
    id: "uniswap",
    name: "Uniswap Wallet",
    rdns: "org.uniswap.app",
    // source: https://cdn.app.uniswap.org/images/512x512_App_Icon.png (icon of https://wallet.uniswap.org/), downscaled to 128px
    logo: "/wallets/uniswap.png",
    install: {
      // source: https://wallet.uniswap.org/ and https://uniswap.org/mobile
      chrome: "https://chromewebstore.google.com/detail/uniswap-extension/nnpmfplkfogfpmcngplhnbdnnilmcdcg",
      ios: "https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476",
      android: "https://play.google.com/store/apps/details?id=com.uniswap.mobile",
      page: "https://wallet.uniswap.org/",
    },
  },
  {
    id: "ledger",
    name: "Ledger Live",
    // source: Ledger Live's App Store icon (app id 1361671700, linked from https://www.ledger.com/ledger-live/download),
    // via https://itunes.apple.com/lookup?id=1361671700 artworkUrl512, converted to a 128px PNG
    logo: "/wallets/ledger.png",
    install: {
      // source: https://www.ledger.com/ledger-live/download
      ios: "https://apps.apple.com/app/ledger-live-app-crypto-nft/id1361671700",
      android: "https://play.google.com/store/apps/details?id=com.ledger.live",
      page: "https://www.ledger.com/ledger-live/download",
    },
    wcExplorerId: "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927",
    walletConnectOnly: true,
  },
];

// source: https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/Blue%20(Default)/Icon.svg
export const WALLETCONNECT_LOGO = "/wallets/walletconnect.svg";

/** Mobile wallets shown under the QR code (all four connect over WalletConnect). */
export const QR_WALLET_IDS = ["metamask", "trust", "rainbow", "zerion"] as const;

export const walletById = (id: string) => WALLETS.find((w) => w.id === id);
export const walletByRdns = (rdns: string) => WALLETS.find((w) => w.rdns === rdns);
