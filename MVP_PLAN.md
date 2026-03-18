# PolkaAgent MVP Plan — Production-Grade Build

## Target Track & Strategy

**Primary: Track 1 — EVM Smart Contract Track (AI-powered dApp)**
**Secondary consideration: Track 2 — PVM Smart Contracts (native assets + precompiles)**

We use both AI (Track 1 fit) AND Polkadot-native precompiles for real assets (Track 2 fit).
Decide final track based on submission strength — potentially submit to both if rules allow.

Prize pool: $15,000 per track | Submission: March 20, 2026 | Demo Day: March 24-25

---

## What Makes This a Real Product, Not a Hackathon Toy

| Hackathon-only approach | Our approach (production-grade) |
|------------------------|-------------------------------|
| Simulated staking | Real token transfers via ERC-20 precompile (USDT ID:1984, USDC) |
| Fake swap | Deploy real Uniswap V2 AMM on Polkadot Hub, do real swaps |
| Mock cross-chain | Real XCM precompile calls at `0x...0a0000` for cross-chain messaging |
| Hardcoded AI responses | DeepSeek API with structured tool-use, validation, real tx building |
| No real assets | Real PAS tokens on testnet, real native asset interaction |
| Single-action demo | Multi-step strategies: swap → transfer → provide liquidity |

---

## Real On-Chain Capabilities We Will Use

### 1. Native Asset Interaction (ERC-20 Precompile)
- **USDT** — Asset ID 1984 → Precompile: `0x000007C000000000000000000000000001200000`
- **USDC** — Native on Asset Hub (need to confirm asset ID on testnet)
- **DOT/PAS** — Native currency, standard ETH-style transfers
- Full ERC-20 interface: `transfer`, `approve`, `transferFrom`, `balanceOf`

### 2. Real DEX (Uniswap V2 Deployment)
- Deploy Factory + Pair contracts on Polkadot Hub TestNet
- Create real liquidity pools (PAS/USDT, PAS/USDC)
- AI agent can execute real swaps through the router
- Polkadot docs officially support this: https://docs.polkadot.com/smart-contracts/cookbook/eth-dapps/uniswap-v2/

### 3. Cross-Chain Messaging (XCM Precompile)
- Address: `0x00000000000000000000000000000000000a0000`
- Interface: `IXcm { execute(), send(), weighMessage() }`
- Real cross-chain asset transfers to parachains
- SCALE-encoded XCM instructions (WithdrawAsset, BuyExecution, DepositAsset)

### 4. System Precompile
- Address: `0x0000000000000000000000000000000000000900`
- `sr25519Verify` — verify Polkadot-native signatures
- `toAccountId` — map EVM ↔ Polkadot addresses

---

## Testnet Setup & Faucet Plan

### Step 1: Get PAS Tokens
```
1. Go to https://faucet.polkadot.io/
2. Select "Polkadot Hub TestNet" from network dropdown
3. Paste your wallet address (Substrate or EVM format)
4. Complete captcha → click "Get Some PASs"
5. Receive ~5000 PAS per request
6. Repeat if needed (rate limited, wait between requests)
```

### Step 2: Configure MetaMask
```
Network Name:    Polkadot Hub TestNet
RPC URL:         https://eth-rpc-testnet.polkadot.io/
Chain ID:        420420417
Currency Symbol: PAS
Block Explorer:  Blockscout (testnet)
```

### Step 3: Fund Multiple Wallets
We need separate funded wallets for:
- **Deployer wallet** — for contract deployments (needs ~500+ PAS)
- **Agent wallet** — backend hot wallet for executing AI actions
- **Test user wallet** — for demo purposes
- **Liquidity provider wallet** — to seed DEX pools

### Step 4: Deploy Contracts (Order Matters)
```
1. Deploy AgentWallet factory
2. Deploy IntentExecutor
3. Deploy Uniswap V2 Factory
4. Deploy Uniswap V2 Router
5. Create test ERC-20 tokens (or use native asset precompiles if available on testnet)
6. Create liquidity pools
7. Seed pools with initial liquidity
8. Verify all contracts on Blockscout
```

### Step 5: Verify Native Assets on TestNet
```
- Check if USDT (1984) and USDC exist on Paseo testnet
- If not, deploy our own test ERC-20 tokens as standin
- Test ERC-20 precompile addresses work on testnet
- Query: cast call 0x000007C0...01200000 "totalSupply()" --rpc-url https://eth-rpc-testnet.polkadot.io/
```

---

## Technical Architecture (Production-Grade)

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│                                                      │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Chat UI  │ │ Wallet       │ │ Portfolio        │  │
│  │ + Stream │ │ Connect      │ │ Dashboard        │  │
│  │ Response │ │ (MetaMask)   │ │ (real balances)  │  │
│  └────┬─────┘ └──────┬───────┘ └────────┬─────────┘  │
│       │              │                  │            │
│  ┌────▼──────────────▼──────────────────▼─────────┐  │
│  │         wagmi + viem (Polkadot Hub chain)       │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │      Backend (FastAPI)      │
         │                             │
         │  ┌───────────────────────┐  │
         │  │  DeepSeek AI Engine   │  │
         │  │  - Intent parsing     │  │
         │  │  - Tool-use reasoning │  │
         │  │  - Strategy planning  │  │
         │  └──────────┬────────────┘  │
         │             │               │
         │  ┌──────────▼────────────┐  │
         │  │  Validation Layer     │  │
         │  │  - Schema check       │  │
         │  │  - Balance check      │  │
         │  │  - Limit enforcement  │  │
         │  │  - Tx simulation      │  │
         │  └──────────┬────────────┘  │
         │             │               │
         │  ┌──────────▼────────────┐  │
         │  │  Transaction Builder  │  │
         │  │  - ABI encoding       │  │
         │  │  - Gas estimation     │  │
         │  │  - Calldata building  │  │
         │  └──────────┬────────────┘  │
         └─────────────┼───────────────┘
                       │
         ┌─────────────▼───────────────────────────┐
         │      Polkadot Hub TestNet (EVM)         │
         │      Chain ID: 420420417                │
         │                                         │
         │  ┌─────────────┐  ┌──────────────────┐  │
         │  │AgentWallet  │  │IntentExecutor    │  │
         │  │(per user)   │  │(action router)   │  │
         │  └──────┬──────┘  └────────┬─────────┘  │
         │         │                  │             │
         │  ┌──────▼──────────────────▼─────────┐  │
         │  │     Uniswap V2 (our deployment)   │  │
         │  │     Factory + Router + Pairs      │  │
         │  └───────────────┬───────────────────┘  │
         │                  │                      │
         │  ┌───────────────▼───────────────────┐  │
         │  │  Precompiles (native Polkadot)    │  │
         │  │  - ERC-20: 0x...01200000 (USDT)  │  │
         │  │  - XCM:    0x...000a0000          │  │
         │  │  - System: 0x...00000900          │  │
         │  └───────────────────────────────────┘  │
         └─────────────────────────────────────────┘
```

---

## Smart Contracts (All Real, No Simulation)

### Contract 1: AgentWallet.sol
User-owned smart contract wallet with delegated agent execution.

```solidity
// Key features:
- deposit() / withdraw()              → Real PAS/token deposits
- authorizeAgent(address, uint256)    → Grant agent with spending limit
- revokeAgent(address)                → Remove agent access
- executeCall(to, value, calldata)    → Agent executes real txs (guarded)
- setSpendingLimit(token, amount)     → Per-token daily limits
- getBalance(token)                   → Real balance queries

// Security:
- ReentrancyGuard on all state-changing functions
- Daily spending limit tracking (resets every 24h)
- Allowlist of approved contract targets
- Owner can emergency pause agent execution
- All actions emit events for frontend tracking
```

### Contract 2: IntentExecutor.sol
Routes validated AI intents to real on-chain actions.

```solidity
// Supported real actions:
- TRANSFER  → Calls AgentWallet.executeCall → real token transfer
- SWAP      → Calls Uniswap V2 Router → real swap through AMM
- ADD_LIQ   → Adds real liquidity to Uniswap V2 pool
- REM_LIQ   → Removes real liquidity
- WRAP      → Wraps native PAS to WPAS (WETH equivalent)
- XCM_SEND  → Calls XCM precompile → real cross-chain message

// Each action:
- Validates parameters on-chain
- Checks wallet authorization
- Executes real contract calls
- Emits IntentExecuted event with full details
```

### Contract 3: WPAS.sol (Wrapped PAS)
Standard WETH-style wrapper for native PAS token — needed for Uniswap V2.

### Contract 4: Uniswap V2 (Fork Deploy)
Deploy official Uniswap V2 contracts:
- UniswapV2Factory.sol
- UniswapV2Router02.sol
- UniswapV2Pair.sol (created by factory)

### Contract 5: TestTokens.sol (if native assets unavailable on testnet)
Simple ERC-20 tokens (MockUSDT, MockUSDC) with mint function for testing.
Only used if USDT/USDC precompiles don't exist on Paseo testnet.

---

## AI Layer — DeepSeek Integration (Real, Not Mock)

### Configuration
```python
# DeepSeek is OpenAI-compatible
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

# Use deepseek-chat for fast responses, deepseek-reasoner for complex strategies
MODEL_FAST = "deepseek-chat"       # V3 — fast, cheap
MODEL_REASON = "deepseek-reasoner" # R1 — better reasoning for complex intents
```

### DeepSeek Challenges & Real Solutions

| Challenge | Real Solution |
|-----------|--------------|
| Output inconsistency | Use function calling / tool-use mode (DeepSeek supports OpenAI function calling format). Define strict JSON schema for each action type. |
| Hallucinated addresses | Never trust AI for addresses. User provides addresses, AI only selects action type + amounts. Cross-reference against on-chain state. |
| Latency (2-5s) | Stream responses via SSE. Show AI "thinking" with intermediate tokens. Use `deepseek-chat` for simple intents, `deepseek-reasoner` only for multi-step strategies. |
| Rate limits | Implement request queue with Redis. Cache parsed intents for identical queries. Batch similar operations. |
| Cost management | deepseek-chat at $0.27/1M tokens = ~3700 intents per $1. More than enough. |
| Security — AI shouldn't control keys | AI ONLY generates action parameters. Backend validates and builds tx. User signs in frontend via MetaMask. AI never touches private keys. |

### Intent Flow (Real Implementation)

```
User: "Swap 50 PAS for USDT and send 20 USDT to 0xBob"

Step 1: DeepSeek parses → [
  { "action": "SWAP", "params": { "from": "PAS", "to": "USDT", "amount": "50" }},
  { "action": "TRANSFER", "params": { "token": "USDT", "to": "0xBob", "amount": "20" }}
]

Step 2: Backend validates each action:
  - Check wallet has ≥50 PAS
  - Query Uniswap V2 for real swap quote (getAmountsOut)
  - Verify 0xBob is valid address
  - Check daily spending limit not exceeded

Step 3: Build real transactions:
  - Tx1: Router.swapExactETHForTokens(amountOutMin, [WPAS, USDT], wallet, deadline)
  - Tx2: USDT.transfer(0xBob, 20e6)

Step 4: Return preview to user with:
  - Exact amounts (from real on-chain quote)
  - Gas estimates
  - Slippage info
  - Total cost breakdown

Step 5: User confirms in frontend → MetaMask signs → tx broadcast → real execution
```

### Tool-Use Schema for DeepSeek

```python
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "transfer",
            "description": "Transfer tokens to an address",
            "parameters": {
                "type": "object",
                "properties": {
                    "token": {"type": "string", "enum": ["PAS", "USDT", "USDC"]},
                    "to": {"type": "string", "description": "Recipient address"},
                    "amount": {"type": "string", "description": "Amount to transfer"}
                },
                "required": ["token", "to", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "swap",
            "description": "Swap one token for another using DEX",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_token": {"type": "string", "enum": ["PAS", "USDT", "USDC"]},
                    "to_token": {"type": "string", "enum": ["PAS", "USDT", "USDC"]},
                    "amount": {"type": "string"},
                    "slippage": {"type": "string", "default": "0.5"}
                },
                "required": ["from_token", "to_token", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_liquidity",
            "description": "Add liquidity to a DEX pool",
            "parameters": {
                "type": "object",
                "properties": {
                    "token_a": {"type": "string"},
                    "token_b": {"type": "string"},
                    "amount_a": {"type": "string"},
                    "amount_b": {"type": "string"}
                },
                "required": ["token_a", "token_b", "amount_a", "amount_b"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_balance",
            "description": "Check token balance of the wallet",
            "parameters": {
                "type": "object",
                "properties": {
                    "token": {"type": "string", "enum": ["PAS", "USDT", "USDC", "ALL"]}
                },
                "required": ["token"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_swap_quote",
            "description": "Get a price quote for a swap without executing",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_token": {"type": "string"},
                    "to_token": {"type": "string"},
                    "amount": {"type": "string"}
                },
                "required": ["from_token", "to_token", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "portfolio_summary",
            "description": "Get full portfolio breakdown with values",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]
```

---

## Frontend — Real Product Feel

### Design Principles
- Clean, minimal UI (not "hackathon bootstrap")
- Real-time data from chain (not cached/mocked)
- Proper loading states, error handling, toast notifications
- Mobile responsive

### Pages

**1. Chat Interface (Main Page)**
- MetaMask wallet connect (wagmi)
- Chat input with suggestions ("Try: Swap 10 PAS for USDT")
- Streaming AI response (SSE from backend)
- Action preview cards showing REAL quotes from chain
- Confirm/Reject buttons
- Live transaction status with block explorer links
- Transaction history in chat context

**2. Portfolio Dashboard**
- Real-time balances from chain (PAS, USDT, USDC, LP tokens)
- Token prices (from DEX pool ratios)
- Liquidity positions with real pool data
- Transaction history (from on-chain events)
- Wallet health (spending limits, agent authorization status)

**3. Agent Settings**
- Authorize/revoke AI agent with on-chain tx
- Set spending limits per token (on-chain enforcement)
- Allowed actions toggle
- View agent execution log

### Tech Stack
```
- Next.js 14 (App Router)
- wagmi v2 + viem (Polkadot Hub chain config)
- TailwindCSS + shadcn/ui (polished components)
- react-query (real-time data fetching)
- Server-Sent Events (streaming AI responses)
```

---

## Backend API (FastAPI)

### Endpoints

```
POST /api/chat
  Body: { "message": "swap 50 PAS for USDT", "wallet": "0x..." }
  Response: SSE stream with AI reasoning + action plan
  → Streams: thinking tokens, then final action JSON

POST /api/execute
  Body: { "actions": [...], "wallet": "0x..." }
  Response: { "transactions": [{ "to": "0x...", "data": "0x...", "value": "..." }] }
  → Returns unsigned tx calldata for MetaMask signing

GET /api/quote/{from}/{to}/{amount}
  Response: { "amountOut": "...", "priceImpact": "...", "route": [...] }
  → Real quote from Uniswap V2 Router.getAmountsOut()

GET /api/portfolio/{wallet}
  Response: { "balances": {...}, "positions": [...], "history": [...] }
  → Real on-chain reads via web3.py

GET /api/pool/{tokenA}/{tokenB}
  Response: { "reserves": [...], "totalSupply": "...", "userShare": "..." }
  → Real pool data

WS /api/events/{wallet}
  → WebSocket stream of real-time on-chain events for the wallet
```

### Key Backend Modules

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, CORS, middleware
│   ├── config.py                  # Chain RPC, contract addresses, DeepSeek config
│   ├── ai/
│   │   ├── engine.py              # DeepSeek client with tool-use
│   │   ├── prompts.py             # System prompts + tool definitions
│   │   └── validator.py           # Validate AI output against on-chain state
│   ├── chain/
│   │   ├── client.py              # web3.py connection to Polkadot Hub
│   │   ├── contracts.py           # ABI loading + contract instances
│   │   ├── tx_builder.py          # Build real unsigned transactions
│   │   ├── reader.py              # Read balances, pool data, events
│   │   └── quotes.py              # Get real swap quotes from Uniswap
│   ├── api/
│   │   ├── chat.py                # /api/chat SSE endpoint
│   │   ├── execute.py             # /api/execute tx builder
│   │   ├── portfolio.py           # /api/portfolio reader
│   │   └── quotes.py              # /api/quote endpoint
│   └── models/
│       └── schemas.py             # Pydantic models for all requests/responses
├── requirements.txt
└── .env.example
```

---

## Development Plan (12 Days — Aggressive but Achievable)

### Phase 1: Contracts + Infra (Days 1-3, Mar 8-10)

**Day 1: Setup + Core Contracts**
- [ ] Init Foundry project
- [ ] Write AgentWallet.sol with real access control + spending limits
- [ ] Write IntentExecutor.sol with action routing
- [ ] Write WPAS.sol (WETH equivalent)
- [ ] Unit tests for all contracts locally (forge test)

**Day 2: DEX + Deployment**
- [ ] Fork Uniswap V2 contracts (Factory, Router, Pair)
- [ ] Adapt init code hash for Polkadot Hub
- [ ] Get PAS from faucet (https://faucet.polkadot.io/) — fund deployer + agent + test wallets
- [ ] Deploy ALL contracts to Polkadot Hub TestNet
- [ ] Verify contracts on Blockscout

**Day 3: Seed & Validate**
- [ ] Deploy test ERC-20 tokens (if native USDT/USDC not on testnet)
- [ ] Check if ERC-20 precompile works for USDT (1984) on Paseo testnet
- [ ] Create liquidity pools (PAS/USDT, PAS/USDC)
- [ ] Seed pools with initial liquidity (~1000 PAS each side)
- [ ] Test real swaps via cast (CLI): `cast send $ROUTER "swapExactETHForTokens(...)"`
- [ ] Document all deployed addresses in config

### Phase 2: Backend + AI (Days 4-6, Mar 11-13)

**Day 4: Chain Integration**
- [ ] Set up FastAPI project
- [ ] web3.py client connecting to Polkadot Hub TestNet RPC
- [ ] Load all contract ABIs + create contract instances
- [ ] Build balance reader (real on-chain PAS + token balances)
- [ ] Build swap quote fetcher (real Router.getAmountsOut)

**Day 5: DeepSeek AI Engine**
- [ ] Get DeepSeek API key (https://platform.deepseek.com/)
- [ ] Implement intent parser with function calling / tool-use
- [ ] Define all tool schemas (transfer, swap, add_liquidity, etc.)
- [ ] Build validation layer: check balances, limits, addresses before returning plan
- [ ] Test with 20+ diverse natural language prompts

**Day 6: Transaction Builder**
- [ ] Build tx_builder.py — convert validated actions to real unsigned txs
- [ ] Handle multi-step intents (swap then transfer = 2 txs)
- [ ] ABI encode all calldata correctly
- [ ] Gas estimation with 20% buffer
- [ ] End-to-end test: prompt → AI → validate → build tx → execute on testnet
- [ ] SSE streaming endpoint for chat

### Phase 3: Frontend (Days 7-9, Mar 14-16)

**Day 7: Wallet + Core UI**
- [ ] Next.js app with wagmi + Polkadot Hub TestNet chain config
- [ ] MetaMask connect/disconnect
- [ ] Chat input component
- [ ] API integration hooks (useChat, usePortfolio)

**Day 8: Chat + Action Flow**
- [ ] Streaming AI response display
- [ ] Action preview cards (show real amounts, gas, slippage)
- [ ] Confirm → MetaMask popup → sign → broadcast → track status
- [ ] Transaction result display with explorer link
- [ ] Chat history persistence (localStorage)

**Day 9: Portfolio + Settings**
- [ ] Portfolio dashboard with real balances (query chain)
- [ ] Liquidity positions display
- [ ] Agent authorization UI (on-chain tx)
- [ ] Spending limit configuration UI
- [ ] Transaction history from on-chain events

### Phase 4: Production Polish (Days 10-12, Mar 17-19)

**Day 10: Integration Testing**
- [ ] Full end-to-end flows on testnet:
  - Deposit PAS → Swap for USDT → Transfer USDT → Check portfolio
  - Add liquidity → Check position → Remove liquidity
  - Multi-step: "Swap half my PAS for USDT and add the rest as liquidity"
- [ ] Edge cases: insufficient balance, invalid address, network errors
- [ ] Fix all bugs found

**Day 11: UI Polish + Demo Prep**
- [ ] Loading skeletons, error toasts, success animations
- [ ] Mobile responsive check
- [ ] Pre-fund demo wallets with PAS and tokens
- [ ] Write demo script (exact steps for Demo Day)
- [ ] Record backup demo video (in case live demo fails)

**Day 12: Submission**
- [ ] Write comprehensive README with:
  - Architecture diagram
  - Contract addresses on testnet
  - How to run locally
  - Demo video link
- [ ] Prepare pitch deck (6 slides max)
- [ ] Submit on DoraHacks
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render

---

## Project Structure

```
polkaagent/
├── contracts/                          # Foundry
│   ├── src/
│   │   ├── AgentWallet.sol             # User wallet with agent delegation
│   │   ├── IntentExecutor.sol          # Action routing
│   │   ├── WPAS.sol                    # Wrapped PAS (WETH-style)
│   │   ├── interfaces/
│   │   │   ├── IXcm.sol               # XCM precompile interface
│   │   │   ├── ISystem.sol            # System precompile interface
│   │   │   └── IERC20Precompile.sol   # Native asset ERC-20 interface
│   │   └── test-tokens/
│   │       └── MockToken.sol           # Fallback if native assets unavailable
│   ├── lib/
│   │   ├── openzeppelin-contracts/
│   │   └── v2-core/ + v2-periphery/   # Uniswap V2 fork
│   ├── test/
│   │   ├── AgentWallet.t.sol
│   │   ├── IntentExecutor.t.sol
│   │   └── Integration.t.sol
│   ├── script/
│   │   ├── Deploy.s.sol               # Full deployment script
│   │   └── SeedPools.s.sol            # Liquidity seeding
│   └── foundry.toml
│
├── backend/                            # FastAPI + DeepSeek
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py                   # All addresses, RPC, API keys
│   │   ├── ai/
│   │   │   ├── engine.py               # DeepSeek tool-use client
│   │   │   ├── prompts.py              # System prompts
│   │   │   └── validator.py            # On-chain validation
│   │   ├── chain/
│   │   │   ├── client.py               # web3.py client
│   │   │   ├── contracts.py            # Contract instances
│   │   │   ├── tx_builder.py           # Real tx construction
│   │   │   ├── reader.py               # Balance/pool/event reader
│   │   │   └── quotes.py              # DEX quote engine
│   │   ├── api/
│   │   │   ├── chat.py                 # SSE streaming chat
│   │   │   ├── execute.py              # Tx building endpoint
│   │   │   ├── portfolio.py
│   │   │   └── quotes.py
│   │   └── models/
│   │       └── schemas.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                           # Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                # Chat interface
│   │   │   ├── portfolio/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── ActionPreview.tsx
│   │   │   ├── wallet/
│   │   │   │   └── ConnectButton.tsx
│   │   │   ├── portfolio/
│   │   │   │   ├── BalanceCard.tsx
│   │   │   │   └── TxHistory.tsx
│   │   │   └── ui/                     # shadcn components
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── usePortfolio.ts
│   │   │   └── useAgentWallet.ts
│   │   ├── lib/
│   │   │   ├── api.ts                  # Backend API client
│   │   │   ├── contracts.ts            # ABI + addresses
│   │   │   └── chains.ts              # Polkadot Hub chain def
│   │   └── config/
│   │       └── wagmi.ts
│   ├── package.json
│   └── tailwind.config.ts
│
├── polkaagent_prd.md
├── MVP_PLAN.md
└── README.md
```

---

## Key Dependencies

### Contracts
- Solidity ^0.8.20, Foundry, OpenZeppelin v5
- Uniswap V2 Core + Periphery (fork)

### Backend
- Python 3.11+, FastAPI, uvicorn
- openai SDK (for DeepSeek — compatible API)
- web3.py ≥7.0 (Polkadot Hub EVM interaction)
- pydantic v2, sse-starlette (streaming)

### Frontend
- Next.js 14+, React 18, TypeScript
- wagmi v2 + viem + @tanstack/react-query
- tailwindcss + shadcn/ui
- eventsource-parser (SSE client)

---

## Network Config Reference

```
═══════════════════════════════════════════════
  Polkadot Hub TestNet (Paseo)
═══════════════════════════════════════════════
  Chain ID:      420420417
  Currency:      PAS
  RPC (HTTP):    https://eth-rpc-testnet.polkadot.io/
  RPC (WSS):     wss://asset-hub-paseo-rpc.n.dwellir.com
  Faucet:        https://faucet.polkadot.io/
  Explorer:      Blockscout / Routescan

═══════════════════════════════════════════════
  Polkadot Hub Mainnet (for reference only)
═══════════════════════════════════════════════
  Chain ID:      420420419
  Currency:      DOT
  RPC (HTTP):    https://eth-rpc.polkadot.io/

═══════════════════════════════════════════════
  Key Precompile Addresses
═══════════════════════════════════════════════
  XCM:           0x00000000000000000000000000000000000a0000
  System:        0x0000000000000000000000000000000000000900
  ERC-20 (USDT): 0x000007C000000000000000000000000001200000
                 (Asset ID 1984, confirm on testnet)

═══════════════════════════════════════════════
  DeepSeek API
═══════════════════════════════════════════════
  Base URL:      https://api.deepseek.com
  Models:        deepseek-chat (fast), deepseek-reasoner (complex)
  SDK:           openai Python SDK (compatible)
  Pricing:       ~$0.27 / 1M input tokens
  Signup:        https://platform.deepseek.com/
```

---

## Demo Day Script (2-3 min)

```
1. HOOK (15s)
   "What if you could manage your entire DeFi portfolio just by talking to it?"

2. PROBLEM (20s)
   "Polkadot Hub just launched with EVM support. But using DeFi still means
    navigating complex UIs, understanding contract calls, managing approvals.
    Most users give up."

3. SOLUTION (20s)
   "PolkaAgent is your AI-powered DeFi copilot on Polkadot Hub.
    Type what you want in plain English. The AI figures out the rest."

4. LIVE DEMO (90s)
   → Connect MetaMask to Polkadot Hub TestNet
   → Show portfolio: "I have 100 PAS, let me put it to work"
   → Type: "Swap 50 PAS for USDT"
   → AI shows real quote from our DEX, gas estimate
   → Confirm → MetaMask signs → real tx on chain
   → Type: "Add 25 PAS and 25 USDT as liquidity"
   → AI builds the liquidity tx → confirm → real LP tokens minted
   → Show portfolio: updated balances, LP position, tx history

5. TECH (20s)
   "Built with Solidity on Polkadot Hub EVM, real Uniswap V2 DEX,
    DeepSeek AI for intent parsing, all real on-chain execution.
    Uses Polkadot precompiles for native asset access."

6. VISION (15s)
   "Next: XCM cross-chain strategies, autonomous yield farming,
    agent marketplace. DeFi should be as easy as a conversation."
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Faucet rate limited / out of tokens | Can't deploy | Request early, fund multiple wallets, ask in OpenGuild Discord for help |
| TestNet RPC unstable | Can't demo | Use alternative RPC: https://services.polkadothub-rpc.com/testnet/ |
| Uniswap V2 init code hash mismatch | Pairs don't work | Compute correct hash from Polkadot Hub bytecode, update Router |
| DeepSeek API downtime | AI broken | Cache common intents locally, fallback to template matching |
| Native assets (USDT/USDC) not on Paseo testnet | Can't use precompile | Deploy our own ERC-20 test tokens as fallback |
| Gas behavior differs from standard EVM | Txs fail | Test every tx type individually, add generous gas buffers |
| Demo day live demo fails | Bad impression | Pre-record backup video, have pre-signed txs ready |

---

## References

- [Polkadot Smart Contracts Docs](https://docs.polkadot.com/smart-contracts/overview/)
- [Polkadot Hub Precompiles](https://docs.polkadot.com/smart-contracts/precompiles/)
- [XCM Precompile Guide](https://docs.polkadot.com/smart-contracts/precompiles/xcm/)
- [ERC-20 Precompile for Native Assets](https://docs.polkadot.com/smart-contracts/precompiles/erc20/)
- [Deploy Uniswap V2 on Polkadot Hub](https://docs.polkadot.com/smart-contracts/cookbook/eth-dapps/uniswap-v2/)
- [Polkadot Testnet Faucet](https://faucet.polkadot.io/)
- [Connect to Polkadot Hub](https://docs.polkadot.com/smart-contracts/connect/)
- [DeepSeek API Docs](https://api-docs.deepseek.com/)
- [DeepSeek Platform](https://platform.deepseek.com/)
- [Hackathon Page (DoraHacks)](https://dorahacks.io/hackathon/polkadot-solidity-hackathon/detail)
- [OpenGuild Builders Hub](https://build.openguild.wtf/hackathon-resources)
- [Polkadot Solidity CodeCamp](https://codecamp.openguild.wtf/)
- [Kheopswap DEX](https://github.com/kheopswap/kheopswap)
- [Scaffold-DOT Toolkit](https://forum.polkadot.network/t/scaffold-dot-toolkit-for-solidity-development-testing-and-deployment/17197)
