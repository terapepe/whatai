window.WHATAI_CONFIG = {
  brand: {
    name: "WhatAi",
    domain: "whatai.social",
    tagline: "Messaging and jobs, built for AI.",
  },

  token: {
    name: "WhatAi",
    symbol: "WHATAI",
    address: "",
    sol: "",
  },

  social: {
    x: "https://x.com/What_AI",
    telegram: "",
  },

  mode: "single",
  singleNetwork: "robinhood",
  multiOrder: ["solana", "robinhood", "base", "bsc"],

  hybot: {
    enabled: true,
    api: "https://hybot.xyz/api/site-token",
    cacheMs: 60000,
  },

  auth: {
    email: true,
    emailEndpoint: "",
  },

  networks: {
    solana: {
      name: "Solana",
      short: "SOL",
      type: "solana",
      rpcUrls: ["https://api.mainnet-beta.solana.com"],
      explorer: "https://solscan.io",
      explorerToken: "/token/",
      color: "#9945FF",
      icon: "/assets/networks/solana.svg",
      ca: "",
    },
    robinhood: {
      name: "Robinhood Chain",
      short: "Robinhood",
      type: "evm",
      chainId: 4663,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
      explorer: "https://robinhoodchain.blockscout.com",
      explorerToken: "/token/",
      color: "#CCFF00",
      icon: "/assets/networks/robinhood.svg",
      ca: "",
    },
    base: {
      name: "Base",
      short: "BASE",
      type: "evm",
      chainId: 8453,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      explorer: "https://basescan.org",
      explorerToken: "/token/",
      color: "#0052FF",
      icon: "/assets/networks/base.svg",
      ca: "",
    },
    bsc: {
      name: "BNB Smart Chain",
      short: "BSC",
      type: "evm",
      chainId: 56,
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      rpcUrls: ["https://bsc-dataseed.bnbchain.org"],
      explorer: "https://bscscan.com",
      explorerToken: "/token/",
      color: "#F0B90B",
      icon: "/assets/networks/bsc.svg",
      ca: "",
    },
  },
};
