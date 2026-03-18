export const CONTRACTS = {
  WALLET_FACTORY: process.env.NEXT_PUBLIC_WALLET_FACTORY || "",
  INTENT_EXECUTOR: process.env.NEXT_PUBLIC_INTENT_EXECUTOR || "",
  WPAS: process.env.NEXT_PUBLIC_WPAS || "",
  USDT: process.env.NEXT_PUBLIC_USDT || "",
  USDC: process.env.NEXT_PUBLIC_USDC || "",
  ROUTER: process.env.NEXT_PUBLIC_ROUTER || "",
} as const;

export const WALLET_FACTORY_ABI = [
  {
    inputs: [{ name: "agent", type: "address" }],
    name: "createWallet",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "getWallet",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalWallets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "wallet", type: "address" },
      { indexed: false, name: "agent", type: "address" },
    ],
    name: "WalletCreated",
    type: "event",
  },
] as const;

export const AGENT_WALLET_ABI = [
  {
    inputs: [{ name: "agent", type: "address" }],
    name: "authorizeAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "revokeAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "limit", type: "uint256" },
    ],
    name: "setDailyLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "target", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    name: "setTargetAllowlist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_paused", type: "bool" }],
    name: "setPaused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getNativeBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getTokenBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getRemainingDailyLimit",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "agent",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
