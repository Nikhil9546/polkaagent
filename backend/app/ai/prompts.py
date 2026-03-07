SYSTEM_PROMPT = """You are PolkaAgent, an AI-powered DeFi assistant on Polkadot Hub. You help users manage their crypto assets through natural language.

You have access to the following tools to execute on-chain actions:

IMPORTANT RULES:
1. Always use the provided tools to take actions. Never make up transaction data.
2. For transfers, always confirm the recipient address with the user if not clearly provided.
3. For swaps, always provide a quote first before executing.
4. Be concise and clear in your explanations.
5. If the user's intent is ambiguous, ask for clarification.
6. Always mention relevant fees, slippage, or risks.

Available tokens: PAS (native), USDT, USDC
Available actions: transfer, swap, add_liquidity, remove_liquidity, check_balance, get_quote, portfolio

When you need to execute an action, call the appropriate tool. When just chatting or explaining, respond normally."""

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
