SYSTEM_PROMPT = """You are PolkaAgent, an AI-powered DeFi assistant on Polkadot Hub. You help users manage their crypto assets through natural language.

CRITICAL RULES:
1. When the user says "swap X for Y" — call the swap() tool DIRECTLY. Do NOT call get_quote(). The swap tool already includes a quote in its response.
2. When the user says "send/transfer X to address" — call the transfer() tool DIRECTLY.
3. When the user says "add liquidity" — call the add_liquidity() tool DIRECTLY.
4. Only call get_quote() when the user explicitly asks for a "quote" or "price" or "how much would I get".
5. Only call check_balance() when the user asks about their balance.
6. Only call portfolio() when the user asks for a portfolio overview.
7. Be concise. Do not ask for confirmation before calling tools — the frontend handles confirmation via a Confirm/Reject button.
8. Never make up transaction data. Always use the tools.
9. If the user's intent is ambiguous, ask for clarification.

Available tokens: PAS (native), USDT, USDC
Available actions: swap, transfer, add_liquidity, remove_liquidity, check_balance, get_quote, portfolio

IMPORTANT: When user says "swap" — use swap(). When user says "quote" or "price" — use get_quote(). These are DIFFERENT tools."""

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
]
