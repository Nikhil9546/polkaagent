"""Generate PolkaAgent project documentation PDF."""
from fpdf import FPDF


class ProjectPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(230, 0, 122)
        self.cell(0, 8, "PolkaAgent - Autonomous AI DeFi Agent", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(230, 0, 122)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.ln(4)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(230, 0, 122)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(230, 0, 122)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.ln(2)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(109, 58, 238)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        x = self.get_x()
        self.cell(6, 6, "  -")
        self.multi_cell(170, 6, text)
        self.set_x(x)

    def code_block(self, text):
        self.set_font("Courier", "", 9)
        self.set_fill_color(245, 245, 250)
        self.set_text_color(50, 50, 50)
        x = self.get_x()
        self.set_x(15)
        self.multi_cell(180, 5, text, fill=True)
        self.ln(2)

    def table_row(self, col1, col2, header=False):
        self.set_font("Helvetica", "B" if header else "", 9)
        if header:
            self.set_fill_color(230, 0, 122)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(250, 250, 255)
            self.set_text_color(40, 40, 40)
        self.cell(60, 7, col1, border=1, fill=True)
        self.cell(0, 7, col2, border=1, fill=not header, new_x="LMARGIN", new_y="NEXT")

    def table_row3(self, c1, c2, c3, header=False):
        self.set_font("Helvetica", "B" if header else "", 9)
        if header:
            self.set_fill_color(230, 0, 122)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(250, 250, 255)
            self.set_text_color(40, 40, 40)
        self.cell(40, 7, c1, border=1, fill=True)
        self.cell(60, 7, c2, border=1, fill=not header)
        self.cell(0, 7, c3, border=1, fill=not header, new_x="LMARGIN", new_y="NEXT")


def generate():
    pdf = ProjectPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ─── COVER PAGE ───
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font("Helvetica", "B", 36)
    pdf.set_text_color(230, 0, 122)
    pdf.cell(0, 15, "PolkaAgent", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 18)
    pdf.set_text_color(109, 58, 238)
    pdf.cell(0, 12, "Autonomous AI DeFi Agent on Polkadot Hub", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Polkadot Solidity Hackathon 2026", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Track 1: AI-Powered DeFi", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(15)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6,
        "An autonomous AI agent that monitors DEX trading signals, analyzes market\n"
        "conditions using DeepSeek AI, and executes trades on Polkadot Hub without\n"
        "manual user intervention. Secured by on-chain smart contract guardrails.",
        align="C")
    pdf.ln(20)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 8, "Live: https://awake-wholeness-production-b7c8.up.railway.app", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "API: https://polkaagent-production.up.railway.app", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Network: Polkadot Hub TestNet (Chain ID: 420420417)", align="C", new_x="LMARGIN", new_y="NEXT")

    # ─── PROBLEM & SOLUTION ───
    pdf.add_page()
    pdf.section_title("1. Problem Statement")
    pdf.body_text(
        "DeFi on Polkadot is powerful but too complex for everyday users. Users must manually "
        "navigate DEX interfaces, approve tokens, monitor prices, and execute trades one at a time. "
        "They miss opportunities while sleeping, have no automated risk management, and must "
        "understand parachains, XCM, gas tokens, and multiple interfaces just to perform simple actions.")
    pdf.body_text(
        "There is currently no autonomous agent layer for Polkadot that can manage assets, "
        "detect trading opportunities, and execute trades without human intervention.")

    pdf.section_title("2. Solution: PolkaAgent")
    pdf.body_text(
        "PolkaAgent introduces an Autonomous AI DeFi Agent on Polkadot Hub. Instead of users "
        "navigating complex interfaces, the AI agent:")
    pdf.bullet("Monitors DEX pools 24/7 for trading signals (arbitrage, price movements, imbalances)")
    pdf.bullet("Analyzes market conditions using DeepSeek V3 AI with function calling")
    pdf.bullet("Executes trades autonomously by signing transactions through the user's Agent Wallet")
    pdf.bullet("Enforces on-chain guardrails: daily spending limits, contract allowlists, emergency pause")
    pdf.ln(4)
    pdf.body_text(
        "Users simply connect their wallet, create an Agent Wallet (one click), toggle auto-trade ON, "
        "and the AI handles everything. No MetaMask popups. No manual approvals. Just results.")

    # ─── KEY FEATURES ───
    pdf.add_page()
    pdf.section_title("3. Key Features")

    pdf.sub_title("3.1 Autonomous Execution")
    pdf.body_text(
        "The AI agent has its own private key and signs transactions through the user's AgentWallet "
        "smart contract. No MetaMask popups. The agent calls AgentWallet.executeCall() to route "
        "swaps through the DEX router. All transactions are real on-chain executions on Polkadot Hub.")

    pdf.sub_title("3.2 Trading Signals Engine")
    pdf.body_text("Real-time analysis of DEX pool state generates four types of signals:")
    pdf.bullet("Stablecoin Arbitrage: Detects USDT/USDC price discrepancies across pools")
    pdf.bullet("Price Movements: Flags significant (>2%) price changes in trading pairs")
    pdf.bullet("Pool Imbalance: Identifies mispriced tokens when AMM reserves are skewed")
    pdf.bullet("Liquidity Alerts: Warns about low liquidity pools with high slippage risk")

    pdf.sub_title("3.3 Continuous Auto-Trading")
    pdf.body_text(
        "Toggle a switch on the dashboard. The agent runs a background loop every 60 seconds: "
        "fetch signals, analyze, and execute trades when strong opportunities appear. Configurable "
        "parameters: max trade size (% of balance), minimum signal strength, check interval.")

    pdf.sub_title("3.4 Multi-Step Strategies")
    pdf.body_text(
        'Users can type "Swap 50 PAS for USDT and 50 PAS for USDC" and the AI executes both '
        "swaps autonomously in one request. The DeepSeek AI parses multi-step intents and calls "
        "multiple tools in sequence.")

    pdf.sub_title("3.5 On-Chain Guardrails (AgentWallet.sol)")
    pdf.body_text("The smart contract enforces security even when the AI trades autonomously:")
    pdf.bullet("Daily spending limits (e.g., max 500 PAS/day)")
    pdf.bullet("Contract allowlist: agent can only call Router, IntentExecutor, approved tokens")
    pdf.bullet("Owner can pause or revoke agent access instantly")
    pdf.bullet("All actions emit events for full transparency and auditability")

    pdf.sub_title("3.6 One-Click Dashboard Actions")
    pdf.body_text(
        "Pre-built strategies: Quick Swap (10 PAS to USDT), Diversify (split across stablecoins), "
        "Trade Now (execute on current signals). Plus a custom command input for any DeFi action.")

    # ─── ARCHITECTURE ───
    pdf.add_page()
    pdf.section_title("4. System Architecture")

    pdf.sub_title("4.1 Architecture Overview")
    pdf.code_block(
        "Frontend (Next.js 14)\n"
        "  Dashboard + Signals + Swap + Portfolio + Settings\n"
        "            |\n"
        "            v\n"
        "Backend (FastAPI + Python)\n"
        "  DeepSeek AI Engine --> Validation --> Autonomous Tx Execution\n"
        "            |\n"
        "            | Agent signs transactions\n"
        "            v\n"
        "Polkadot Hub EVM (TestNet, Chain ID: 420420417)\n"
        "  AgentWallet.sol    <-- spending limits, allowlists\n"
        "  PolkaSwap DEX      <-- real AMM (x*y=k), 0.3% fee\n"
        "  IntentExecutor.sol <-- action routing\n"
        "  WPAS + USDT/USDC   <-- real tokens with liquidity")

    pdf.sub_title("4.2 Execution Flow")
    pdf.body_text("How autonomous trading works:")
    pdf.code_block(
        "1. Signal Detected    --> DEX pool reserves analyzed on-chain\n"
        "2. AI Analyzes        --> DeepSeek V3 evaluates opportunity\n"
        "3. Validates          --> Check balance, daily limits, allowlist\n"
        "4. Agent Signs Tx     --> Private key signs via AgentWallet\n"
        "5. Tx Broadcast       --> Sent to Polkadot Hub RPC\n"
        "6. Confirmed On-Chain --> Swap executes in PolkaSwap DEX\n"
        "7. Logged             --> Result shown in dashboard with tx hash")

    pdf.sub_title("4.3 Auto-Trade Loop")
    pdf.code_block(
        "Every 60 seconds:\n"
        "  1. Fetch DEX pool reserves (on-chain read)\n"
        "  2. Generate trading signals (arbitrage, imbalance, momentum)\n"
        "  3. Filter by minimum strength (MODERATE or STRONG)\n"
        "  4. If BUY signal found:\n"
        "     a. Calculate trade size (max 10% of PAS balance)\n"
        "     b. Agent signs tx via AgentWallet.executeCall()\n"
        "     c. Swap executes on PolkaSwap DEX\n"
        "     d. Log trade with tx hash\n"
        "  5. If no signal: HOLD, wait for next cycle")

    # ─── TECH STACK ───
    pdf.add_page()
    pdf.section_title("5. Technology Stack")

    pdf.table_row("Component", "Technology", header=True)
    pdf.table_row("Frontend", "Next.js 14, TypeScript, TailwindCSS, wagmi v2, viem")
    pdf.table_row("Backend", "Python 3.11, FastAPI, web3.py, openai SDK")
    pdf.table_row("AI Engine", "DeepSeek V3 with function calling / tool-use")
    pdf.table_row("Smart Contracts", "Solidity 0.8.24, Foundry, OpenZeppelin")
    pdf.table_row("DEX", "PolkaSwap (custom Uniswap V2 fork with real AMM)")
    pdf.table_row("Network", "Polkadot Hub TestNet (Chain ID: 420420417)")
    pdf.table_row("Deployment", "Railway (frontend + backend)")

    # ─── SMART CONTRACTS ───
    pdf.ln(6)
    pdf.section_title("6. Smart Contracts")

    pdf.sub_title("6.1 Deployed Contracts")
    pdf.table_row("Contract", "Address", header=True)
    pdf.table_row("WPAS (Wrapped PAS)", "0xff3e0Bf3b2441eC987a8aCDeD8D972cf0BAEBec3")
    pdf.table_row("USDT", "0x9e04b45593c985EDB023998a3CcBADFDfe652E69")
    pdf.table_row("USDC", "0xFfed23d5033Bf3e8b2AeBeeB0361DB5A85f471F3")
    pdf.table_row("PolkaSwap Factory", "0x75d6e9C5bb2091C76Da4c7Eb309fA4867e91a499")
    pdf.table_row("PolkaSwap Router", "0x411d974D4502Dd74552A24DccCc0865F20840930")
    pdf.table_row("WalletFactory", "0x7e654a111fb2356c7A9113ffDbf6BF307499AdC7")
    pdf.table_row("IntentExecutor", "0x16418cEbDC0e97Bec84320A472578E524210D3E7")

    pdf.ln(4)
    pdf.sub_title("6.2 Liquidity Pools (Seeded)")
    pdf.table_row("Pool", "Liquidity", header=True)
    pdf.table_row("PAS / USDT", "~500 PAS + ~2,500 USDT (1 PAS = 5 USDT)")
    pdf.table_row("PAS / USDC", "~500 PAS + ~2,500 USDC (1 PAS = 5 USDC)")

    pdf.ln(4)
    pdf.sub_title("6.3 Contract Details")

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 7, "AgentWallet.sol", new_x="LMARGIN", new_y="NEXT")
    pdf.body_text(
        "Per-user smart contract wallet with delegated agent execution. Key functions: "
        "deposit(), withdraw(), authorizeAgent(), revokeAgent(), executeCall() (guarded by "
        "daily limits and allowlist), setDailyLimit(), setTargetAllowlist(), setPaused(). "
        "Uses ReentrancyGuard and SafeERC20.")

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "PolkaSwap DEX (Uniswap V2 Fork)", new_x="LMARGIN", new_y="NEXT")
    pdf.body_text(
        "Full AMM implementation: PolkaSwapFactory (creates pairs), PolkaSwapPair (constant "
        "product formula x*y=k, 0.3% fee, LP token minting/burning), PolkaSwapRouter (swap, "
        "addLiquidity, removeLiquidity, getAmountsOut/In). All real on-chain math.")

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "IntentExecutor.sol", new_x="LMARGIN", new_y="NEXT")
    pdf.body_text(
        "Routes AI-parsed intents to real on-chain actions. Supports swap (PAS/token, "
        "token/PAS, token/token), transfer (native + ERC-20), add/remove liquidity. "
        "Token registry maps symbols to contract addresses.")

    # ─── API ENDPOINTS ───
    pdf.add_page()
    pdf.section_title("7. API Endpoints")

    pdf.table_row3("Method", "Endpoint", "Description", header=True)
    pdf.table_row3("GET", "/health", "Health check")
    pdf.table_row3("POST", "/api/chat", "AI chat + autonomous execution")
    pdf.table_row3("POST", "/api/chat/stream", "SSE streaming AI responses")
    pdf.table_row3("POST", "/api/execute", "Build unsigned transactions")
    pdf.table_row3("GET", "/api/portfolio/{addr}", "Real on-chain balances")
    pdf.table_row3("GET", "/api/quote/{from}/{to}/{amt}", "Real DEX swap quotes")
    pdf.table_row3("GET", "/api/pool/{token}", "Pool reserves and info")
    pdf.table_row3("GET", "/api/wallet/{addr}", "Agent wallet lookup")
    pdf.table_row3("GET", "/api/signals", "Live trading signals")
    pdf.table_row3("GET", "/api/signals/prices", "Current token prices")
    pdf.table_row3("POST", "/api/autotrade/start", "Start continuous auto-trading")
    pdf.table_row3("POST", "/api/autotrade/stop", "Stop auto-trading")
    pdf.table_row3("GET", "/api/autotrade/status", "Auto-trade status + log")

    # ─── TESTING ───
    pdf.ln(6)
    pdf.section_title("8. Testing")

    pdf.sub_title("8.1 Smart Contract Tests (18/18 Passing)")
    pdf.body_text("AgentWallet tests (13):")
    pdf.bullet("Authorization, daily limits, limit reset after 24h, pause, revoke")
    pdf.bullet("Native + token transfers, non-agent rejection, non-allowlisted rejection")
    pdf.bullet("Factory creation, duplicate prevention, view functions")
    pdf.ln(2)
    pdf.body_text("DEX tests (5):")
    pdf.bullet("AddLiquidityETH, SwapExactETHForTokens, SwapExactTokensForETH")
    pdf.bullet("GetAmountsOut, RemoveLiquidityETH")

    pdf.sub_title("8.2 API Tests (27/27 Passing)")
    pdf.body_text(
        "Full end-to-end test suite covering: health check, wallet info, portfolio, "
        "swap quotes (PAS/USDT, USDT/PAS, PAS/USDC), pool info, AI chat (balance, quote, "
        "swap, transfer, portfolio, signals, auto-trade, conversational, price check), "
        "execute API (transfer + swap), validation (insufficient balance, invalid address, "
        "swap same token), on-chain verification (all 7 contracts), frontend pages (5 routes).")

    # ─── FRONTEND PAGES ───
    pdf.add_page()
    pdf.section_title("9. Frontend Pages")

    pdf.table_row("Page", "Description", header=True)
    pdf.table_row("/ (Dashboard)", "Landing page + auto-trade toggle + one-click actions + signals + execution log")
    pdf.table_row("/signals", "Trading signals with prices, auto-trade button, signal cards")
    pdf.table_row("/swap", "Direct swap UI with live quotes from DEX")
    pdf.table_row("/portfolio", "Token balances (wallet + agent), LP positions, tx history link")
    pdf.table_row("/settings", "Create agent wallet, set limits, allowlist, pause/revoke")

    # ─── WHAT MAKES US DIFFERENT ───
    pdf.ln(6)
    pdf.section_title("10. What Makes PolkaAgent Different")

    pdf.table_row3("Feature", "Traditional DeFi", "PolkaAgent", header=True)
    pdf.table_row3("Execution", "User signs every tx", "AI executes autonomously")
    pdf.table_row3("Monitoring", "Manual price checking", "24/7 signal detection")
    pdf.table_row3("Trading", "One action at a time", "Multi-step strategies")
    pdf.table_row3("Safety", "No limits", "On-chain spending limits")
    pdf.table_row3("Opportunities", "Miss while sleeping", "Auto-trades on signals")
    pdf.table_row3("Complexity", "Navigate DEX UIs", "One-click dashboard")

    pdf.ln(4)
    pdf.body_text(
        "Core differentiator: Other AI DeFi projects are translators (convert text to transactions). "
        "PolkaAgent is an autonomous agent that thinks, decides, and acts on its own. The AI "
        "is the trader, not the user.")

    # ─── POLKADOT INTEGRATION ───
    pdf.add_page()
    pdf.section_title("11. Polkadot Integration")
    pdf.bullet("Deployed on Polkadot Hub - first-class EVM chain in the Polkadot ecosystem")
    pdf.bullet("XCM precompile interface included (IXcm.sol) at 0x...0a0000 for cross-chain transfers")
    pdf.bullet("System precompile support for Polkadot-native operations (sr25519, account mapping)")
    pdf.bullet("ERC-20 precompile support for native assets (USDT asset ID 1984)")
    pdf.bullet("Real PolkaSwap DEX deployed specifically for Polkadot Hub with seeded liquidity")
    pdf.bullet("All contracts compiled with evm_version=paris for Polkadot Hub compatibility")

    # ─── NETWORK CONFIG ───
    pdf.ln(4)
    pdf.section_title("12. Network Configuration")
    pdf.code_block(
        "Network:     Polkadot Hub TestNet\n"
        "Chain ID:    420420417\n"
        "RPC:         https://eth-rpc-testnet.polkadot.io/\n"
        "Currency:    PAS\n"
        "Faucet:      https://faucet.polkadot.io/\n"
        "Explorer:    https://blockscout-testnet.polkadot.io/")

    # ─── ROADMAP ───
    pdf.section_title("13. Future Roadmap")
    pdf.bullet("XCM cross-chain asset transfers between parachains")
    pdf.bullet("Stop-loss and take-profit automation")
    pdf.bullet("Multi-pair liquidity provision strategies")
    pdf.bullet("External price feed integration (oracles)")
    pdf.bullet("Gas relayer so users don't need to fund the agent")
    pdf.bullet("Agent marketplace - share and copy trading strategies")
    pdf.bullet("Voice input for accessibility")

    # ─── SUMMARY ───
    pdf.add_page()
    pdf.section_title("14. Summary")
    pdf.body_text(
        "PolkaAgent is the first autonomous AI DeFi agent on Polkadot Hub. It combines "
        "DeepSeek V3 AI reasoning with real on-chain execution through smart contract "
        "guardrails. The system monitors markets 24/7, detects trading opportunities, "
        "and executes trades autonomously - all while keeping the user in control through "
        "on-chain spending limits and one-click emergency controls.")
    pdf.ln(4)
    pdf.body_text(
        "Every transaction is real. Every contract is deployed. Nothing is simulated. "
        "8 smart contracts on Polkadot Hub TestNet, 18 passing contract tests, 27 passing "
        "API tests, 5 frontend pages, live trading signals, and continuous auto-trading.")
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(230, 0, 122)
    pdf.cell(0, 10, "Built for the Polkadot Solidity Hackathon 2026", align="C")

    # Save
    pdf.output("/Users/nikhilkumar/claude/polkaagent/PolkaAgent_Documentation.pdf")
    print("PDF generated: PolkaAgent_Documentation.pdf")


if __name__ == "__main__":
    generate()
