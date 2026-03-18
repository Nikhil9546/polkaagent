import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

export const polkadotHub = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://eth-rpc-testnet.polkadot.io/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io",
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [polkadotHub],
  transports: {
    [polkadotHub.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
