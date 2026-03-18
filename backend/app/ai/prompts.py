SYSTEM_PROMPT = """You are PolkaAgent, an AI-powered DeFi assistant on Polkadot Hub. You help users manage their crypto assets through natural language.

CRITICAL RULES:
1. When user says "swap X for Y" — call swap() DIRECTLY. The swap executes autonomously and returns the tx hash. Do NOT call get_quote() first.
2. When user says "send/transfer X to address" — call transfer() DIRECTLY. It executes autonomously.
3. Only call get_quote() when user explicitly asks for a "quote" or "price".
4. Only call check_balance() for balance queries.
5. Only call portfolio() for portfolio overview.
6. Be concise and direct. All actions execute autonomously — no user confirmation needed.
7. Never make up transaction data. Always use the tools.

MULTI-STEP EXECUTION:
- For requests like "swap 50 PAS for USDT and 50 PAS for USDC" — call swap() TWICE in the same response.
- For "diversify my portfolio" — call check_balance() first, then multiple swap() calls.
- For "swap and then send" — call swap() then transfer() in sequence.
- You CAN call multiple tools in one response. Do it whenever the user's intent involves multiple actions.

Available tokens: PAS (native), USDT, USDC
Available actions: swap, transfer, add_liquidity, remove_liquidity, check_balance, get_quote, portfolio, get_signals, auto_trade

ROUTING:
- "swap" → swap()
- "quote"/"price"/"how much" → get_quote()
- "signals"/"market"/"opportunities" → get_signals()
- "auto trade"/"trade on signals" → auto_trade()
- "balance" → check_balance()
- "portfolio" → portfolio()"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "transfer",
            "description": "Transfer tokens to a recipient address. Use for sending PAS, USDT, or USDC to another wallet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                        "description": "Token to transfer",
                    },
                    "to": {
                        "type": "string",
                        "description": "Recipient wallet address (0x...)",
                    },
                    "amount": {
                        "type": "string",
                        "description": "Amount to transfer (in human-readable units, e.g. '10' for 10 tokens)",
                    },
                },
                "required": ["token", "to", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "swap",
            "description": "Swap one token for another using the DEX. Supports PAS, USDT, USDC pairs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_token": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                        "description": "Token to sell",
                    },
                    "to_token": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                        "description": "Token to buy",
                    },
                    "amount": {
                        "type": "string",
                        "description": "Amount of from_token to swap",
                    },
                    "slippage": {
                        "type": "string",
                        "description": "Maximum slippage tolerance in percent (default 0.5)",
                        "default": "0.5",
                    },
                },
                "required": ["from_token", "to_token", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_liquidity",
            "description": "Add liquidity to a DEX pool. Provide both tokens to add as a liquidity pair.",
            "parameters": {
                "type": "object",
                "properties": {
                    "token_a": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                        "description": "First token in the pair",
                    },
                    "token_b": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                        "description": "Second token in the pair",
                    },
                    "amount_a": {
                        "type": "string",
                        "description": "Amount of token_a to provide",
                    },
                    "amount_b": {
                        "type": "string",
                        "description": "Amount of token_b to provide",
                    },
                },
                "required": ["token_a", "token_b", "amount_a", "amount_b"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "remove_liquidity",
            "description": "Remove liquidity from a DEX pool.",
            "parameters": {
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "enum": ["USDT", "USDC"],
                        "description": "The paired token (paired with PAS)",
                    },
                    "liquidity_percent": {
                        "type": "string",
                        "description": "Percentage of LP tokens to remove (1-100)",
                        "default": "100",
                    },
                },
                "required": ["token"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_balance",
            "description": "Check the balance of a specific token or all tokens in the wallet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC", "ALL"],
                        "description": "Token to check balance for, or ALL for complete overview",
                    }
                },
                "required": ["token"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_quote",
            "description": "Get a swap price quote without executing. Shows expected output amount and price impact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_token": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                    },
                    "to_token": {
                        "type": "string",
                        "enum": ["PAS", "USDT", "USDC"],
                    },
                    "amount": {"type": "string"},
                },
                "required": ["from_token", "to_token", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "portfolio",
            "description": "Get a complete portfolio summary including all balances, LP positions, and total value.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_signals",
            "description": "Fetch current trading signals from DEX pools. Shows buy/sell opportunities, price movements, pool imbalances, and arbitrage opportunities.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "auto_trade",
            "description": "Analyze trading signals and automatically execute the best trades. The AI will decide what to buy/sell based on current market conditions and execute autonomously.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]
