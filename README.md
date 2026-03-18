# PolkaAgent — Autonomous AI DeFi Agent on Polkadot Hub

> **Polkadot Solidity Hackathon 2026 | Track 1: AI-Powered DeFi**

PolkaAgent is an autonomous AI agent that monitors DEX trading signals, analyzes market conditions using DeepSeek AI, and executes trades on Polkadot Hub — all without manual user intervention. Secured by on-chain smart contract guardrails with daily spending limits, contract allowlists, and emergency controls.

---

## Demo

**Live on Polkadot Hub TestNet** (Chain ID: 420420417)

```
1. Connect MetaMask to Polkadot Hub TestNet
2. Create Agent Wallet (one-click)
3. Deposit PAS
4. Toggle Auto-Trade ON — AI trades autonomously
```

---

## What Makes This Different

| Traditional DeFi | PolkaAgent |
|---|---|
| Navigate to DEX manually | One-click autonomous execution |
| Approve token, wait, swap, wait | AI handles everything in < 2s |
| Check prices yourself | Real-time signal detection from DEX pools |
| Miss opportunities while sleeping | 24/7 continuous auto-trading |
| One action at a time | Multi-step strategies in one command |
| No risk management | On-chain spending limits + guardrails |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                 Frontend (Next.js)                   │
│  Dashboard + Signals + Swap + Portfolio + Settings   │
└──────────────────────┬───────────────────────────────┘
                       │
         ┌─────────────▼───────────────┐
         │      Backend (FastAPI)      │
         │  DeepSeek AI → Validation   │
         │  → Autonomous Tx Execution  │
         └─────────────┬───────────────┘
                       │ Agent signs txs
         ┌─────────────▼───────────────────────────┐
         │      Polkadot Hub EVM (TestNet)         │
         │                                         │
         │  AgentWallet.sol  ← spending limits     │
         │  PolkaSwap DEX    ← real AMM (x*y=k)   │
         │  IntentExecutor   ← action routing      │
         │  WPAS + USDT/USDC ← real tokens         │
         └─────────────────────────────────────────┘
```

---

## Features

### Autonomous Execution
The AI agent signs and broadcasts transactions through the user's AgentWallet smart contract. No MetaMask popups. No manual approvals.

### Trading Signals
Real-time analysis of DEX pool state:
- **Stablecoin arbitrage** — detects USDT/USDC price discrepancies
- **Price movements** — flags >2% changes
- **Pool imbalance** — identifies mispriced tokens in AMM pools
- **Liquidity alerts** — warns about low liquidity / high slippage

### Continuous Auto-Trading
Toggle a switch. The agent checks signals every 60 seconds and trades automatically when strong opportunities appear. Configurable risk parameters (max trade %, min signal strength).

### Multi-Step Strategies
"Swap 50 PAS for USDT and 50 PAS for USDC" — the AI executes both swaps autonomously in one request.

### On-Chain Guardrails (AgentWallet.sol)
- Daily spending limits enforced on-chain
- Contract allowlist — agent can only call approved contracts
- Owner can pause or revoke agent access instantly
- All actions emit events for transparency

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, wagmi v2, viem |
| **Backend** | Python, FastAPI, web3.py, openai SDK (DeepSeek compatible) |
| **AI** | DeepSeek V3 with function calling / tool-use |
| **Smart Contracts** | Solidity 0.8.24, Foundry, OpenZeppelin |
| **DEX** | Custom Uniswap V2 fork (PolkaSwap) — real AMM |
| **Network** | Polkadot Hub TestNet (Chain ID: 420420417) |

---

## Deployed Contracts

All contracts are live on Polkadot Hub TestNet:

| Contract | Address |
|---|---|
| WPAS (Wrapped PAS) | `0xff3e0Bf3b2441eC987a8aCDeD8D972cf0BAEBec3` |
| USDT | `0x9e04b45593c985EDB023998a3CcBADFDfe652E69` |
| USDC | `0xFfed23d5033Bf3e8b2AeBeeB0361DB5A85f471F3` |
| PolkaSwap Factory | `0x75d6e9C5bb2091C76Da4c7Eb309fA4867e91a499` |
| PolkaSwap Router | `0x411d974D4502Dd74552A24DccCc0865F20840930` |
| WalletFactory | `0x7e654a111fb2356c7A9113ffDbf6BF307499AdC7` |
| IntentExecutor | `0x16418cEbDC0e97Bec84320A472578E524210D3E7` |

Liquidity pools seeded:
- **PAS/USDT** — 500 PAS + 2,500 USDT
- **PAS/USDC** — 500 PAS + 2,500 USDC

---

## Smart Contracts

### AgentWallet.sol
Per-user smart contract wallet with delegated agent execution.
- `deposit()` / `withdraw()` — manage funds
- `authorizeAgent()` / `revokeAgent()` — control agent access
- `executeCall()` — agent executes transactions (guarded by limits)
- `setDailyLimit()` — on-chain spending cap
- `setTargetAllowlist()` — restrict callable contracts
- `setPaused()` — emergency stop

### AgentWalletFactory.sol
Deploys one AgentWallet per user.

### IntentExecutor.sol
Routes validated AI actions to DEX swaps, transfers, and liquidity operations.

### PolkaSwap (Uniswap V2 Fork)
- **PolkaSwapFactory.sol** — creates trading pairs
- **PolkaSwapPair.sol** — AMM with constant product formula (x*y=k), 0.3% fee
- **PolkaSwapRouter.sol** — swap, addLiquidity, removeLiquidity, quotes

### WPAS.sol
WETH-equivalent wrapper for native PAS token.

---

## Project Structure

```
polkaagent/
├── contracts/                     # Foundry — Solidity smart contracts
│   ├── src/
│   │   ├── AgentWallet.sol        # User wallet with agent delegation
│   │   ├── AgentWalletFactory.sol # Wallet deployer
│   │   ├── IntentExecutor.sol     # Action routing
│   │   ├── WPAS.sol               # Wrapped PAS
│   │   ├── MockToken.sol          # Test USDT/USDC
│   │   ├── dex/
│   │   │   ├── PolkaSwapFactory.sol
│   │   │   ├── PolkaSwapPair.sol
│   │   │   └── PolkaSwapRouter.sol
│   │   └── interfaces/
│   │       ├── IXcm.sol           # XCM precompile interface
│   │       └── IUniswapV2.sol
│   ├── test/                      # 18 tests (all passing)
│   └── script/Deploy.s.sol       # Full deployment script
│
├── backend/                       # FastAPI + DeepSeek AI
│   └── app/
│       ├── ai/
│       │   ├── engine.py          # DeepSeek with function calling
│       │   ├── prompts.py         # System prompt + tool definitions
│       │   └── validator.py       # On-chain validation
│       ├── chain/
│       │   ├── client.py          # web3.py connection
│       │   ├── reader.py          # Balance, pool, quote reads
│       │   ├── tx_builder.py      # Transaction construction
│       │   ├── executor.py        # Autonomous tx signing + broadcast
│       │   └── signals.py         # Trading signal engine
│       └── api/
│           ├── chat.py            # AI chat + autonomous execution
│           ├── portfolio.py       # Portfolio + quotes
│           ├── signals.py         # Signal API
│           └── autotrade.py       # Continuous auto-trading
│
├── frontend/                      # Next.js dashboard
│   └── src/app/
│       ├── page.tsx               # Landing page + Dashboard
│       ├── signals/page.tsx       # Trading signals
│       ├── swap/page.tsx          # Direct swap UI
│       ├── portfolio/page.tsx     # Portfolio view
│       └── settings/page.tsx      # Agent wallet management
│
└── README.md
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- Python 3.11+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- MetaMask browser extension

### 1. Clone & Install

```bash
git clone <repo-url>
cd polkaagent

# Contracts
cd contracts && forge install && forge build

# Backend
cd ../backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend — create backend/.env
DEEPSEEK_API_KEY=sk-your-key          # Get from platform.deepseek.com
AGENT_PRIVATE_KEY=0xYourAgentKey      # Generate: cast wallet new
RPC_URL=https://eth-rpc-testnet.polkadot.io/
CHAIN_ID=420420417
WALLET_FACTORY_ADDRESS=0x7e654a111fb2356c7A9113ffDbf6BF307499AdC7
INTENT_EXECUTOR_ADDRESS=0x16418cEbDC0e97Bec84320A472578E524210D3E7
WPAS_ADDRESS=0xff3e0Bf3b2441eC987a8aCDeD8D972cf0BAEBec3
USDT_ADDRESS=0x9e04b45593c985EDB023998a3CcBADFDfe652E69
USDC_ADDRESS=0xFfed23d5033Bf3e8b2AeBeeB0361DB5A85f471F3
ROUTER_ADDRESS=0x411d974D4502Dd74552A24DccCc0865F20840930
FACTORY_ADDRESS=0x75d6e9C5bb2091C76Da4c7Eb309fA4867e91a499

# Frontend — create frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WALLET_FACTORY=0x7e654a111fb2356c7A9113ffDbf6BF307499AdC7
```

### 3. Get TestNet Tokens

```bash
# Get PAS from faucet
# Visit: https://faucet.polkadot.io/

# Fund the agent address with PAS (for gas)
cast send <AGENT_ADDRESS> --value 50ether \
  --rpc-url https://eth-rpc-testnet.polkadot.io/ \
  --private-key <DEPLOYER_KEY>
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:3000

---

## Testing

### Smart Contract Tests (18/18 passing)
```bash
cd contracts && forge test -v
```
- AgentWallet: authorization, limits, pause, revoke, factory
- DEX: addLiquidity, swap PAS<>tokens, quotes, removeLiquidity

### API Tests
```bash
# Health
curl http://localhost:8000/health

# Portfolio
curl http://localhost:8000/api/portfolio/<WALLET>

# Swap quote
curl http://localhost:8000/api/quote/PAS/USDT/10

# Trading signals
curl http://localhost:8000/api/signals

# Autonomous swap
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Swap 1 PAS for USDT","wallet_address":"<WALLET>"}'
```

---

## Network Configuration

```
Polkadot Hub TestNet:
  Chain ID:    420420417
  RPC:         https://eth-rpc-testnet.polkadot.io/
  Currency:    PAS
  Faucet:      https://faucet.polkadot.io/
  Explorer:    https://blockscout-testnet.polkadot.io/
```

Add to MetaMask:
```
Network Name:     Polkadot Hub TestNet
RPC URL:          https://eth-rpc-testnet.polkadot.io/
Chain ID:         420420417
Currency Symbol:  PAS
```

---

## How Auto-Trading Works

```
Every 60 seconds:
  1. Fetch DEX pool reserves (on-chain)
  2. Generate trading signals (arbitrage, imbalance, momentum)
  3. Filter by minimum strength (MODERATE or STRONG)
  4. If buy signal found:
     a. Calculate trade size (max 10% of PAS balance)
     b. Agent signs tx via AgentWallet.executeCall()
     c. Swap executes on PolkaSwap DEX
     d. Log trade with tx hash
  5. If no signal: HOLD, wait for next cycle
```

On-chain safety:
- AgentWallet enforces daily spending limit
- Only allowlisted contracts can be called
- Owner can pause agent at any time

---

## Polkadot Integration

- **Deployed on Polkadot Hub** — first-class EVM chain in the Polkadot ecosystem
- **XCM precompile interface** included (`IXcm.sol`) for future cross-chain transfers
- **System precompile** for Polkadot-native operations
- **ERC-20 precompile** support for native assets (USDT asset ID 1984)
- **Real Uniswap V2 DEX** deployed specifically for Polkadot Hub

---

## Future Roadmap

- [ ] XCM cross-chain asset transfers
- [ ] Stop-loss and take-profit automation
- [ ] Multi-pair liquidity provision strategies
- [ ] External price feed integration (oracles)
- [ ] Gas relayer (users don't need to fund agent)
- [ ] Agent marketplace — share and copy strategies

---

## Team

Built for the Polkadot Solidity Hackathon 2026.

---

## License

MIT
