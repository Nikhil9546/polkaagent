import logging
from decimal import Decimal
from web3 import Web3
from ..config import get_settings, TOKENS
from .client import w3, get_contract, AGENT_WALLET_ABI, INTENT_EXECUTOR_ABI, ROUTER_ABI
from .reader import get_token_address, get_swap_quote

logger = logging.getLogger(__name__)
settings = get_settings()


def to_wei_amount(amount: str, decimals: int) -> int:
    return int(Decimal(amount) * Decimal(10**decimals))


def _encode_function(contract, fn_name: str, args: list) -> str:
    """Encode a function call to hex data."""
    func = contract.functions[fn_name](*args)
    return func._encode_transaction_data()


def build_transfer_tx(wallet_address: str, params: dict) -> dict:
    """Build a transfer transaction."""
    token = params["token"]
    to = Web3.to_checksum_address(params["to"])
    amount = params["amount"]

    wallet = get_contract(wallet_address, AGENT_WALLET_ABI)

    if token == "PAS":
        amount_wei = to_wei_amount(amount, 18)
        data = _encode_function(wallet, "executeCall", [to, amount_wei, b""])
        return {
            "to": wallet_address,
            "data": data,
            "value": "0",
            "gas_estimate": "100000",
            "description": f"Transfer {amount} PAS to {to[:10]}...",
        }
    else:
        token_addr = get_token_address(token)
        decimals = TOKENS[token]["decimals"]
        amount_raw = to_wei_amount(amount, decimals)
        data = _encode_function(
            wallet, "executeTokenTransfer",
            [Web3.to_checksum_address(token_addr), to, amount_raw],
        )
        return {
            "to": wallet_address,
            "data": data,
            "value": "0",
            "gas_estimate": "120000",
            "description": f"Transfer {amount} {token} to {to[:10]}...",
        }


def build_swap_tx(wallet_address: str, params: dict) -> dict:
    """Build a swap transaction directly via DEX Router."""
    from_token = params["from_token"]
    to_token = params["to_token"]
    amount = params["amount"]
    slippage = Decimal(params.get("slippage", "0.5"))

    quote = get_swap_quote(from_token, to_token, amount)
    if "error" in quote:
        return {"error": quote["error"]}

    router_addr = settings.router_address
    router = get_contract(router_addr, ROUTER_ABI)

    from_decimals = TOKENS[from_token]["decimals"]
    to_decimals = TOKENS[to_token]["decimals"]
    amount_in = to_wei_amount(amount, from_decimals)
    min_out_raw = int(
        Decimal(quote["amount_out"]) * (1 - slippage / 100) * Decimal(10**to_decimals)
    )

    deadline = w3.eth.get_block("latest")["timestamp"] + 300
    user = Web3.to_checksum_address(wallet_address)
    wpas = Web3.to_checksum_address(settings.wpas_address)

    if from_token == "PAS":
        # swapExactETHForTokens — user sends PAS as msg.value
        to_addr = Web3.to_checksum_address(get_token_address(to_token))
        path = [wpas, to_addr]
        data = _encode_function(router, "swapExactETHForTokens", [
            min_out_raw, path, user, deadline,
        ])
        return {
            "to": router_addr,
            "data": data,
            "value": str(amount_in),
            "gas_estimate": "200000",
            "description": f"Swap {amount} PAS for ~{quote['amount_out']} {to_token}",
            "quote": quote,
        }
    elif to_token == "PAS":
        from_addr = Web3.to_checksum_address(get_token_address(from_token))
        path = [from_addr, wpas]
        data = _encode_function(router, "swapExactTokensForETH", [
            amount_in, min_out_raw, path, user, deadline,
        ])
        return {
            "to": router_addr,
            "data": data,
            "value": "0",
            "gas_estimate": "200000",
            "description": f"Swap {amount} {from_token} for ~{quote['amount_out']} PAS",
            "quote": quote,
        }
    else:
        from_addr = Web3.to_checksum_address(get_token_address(from_token))
        to_addr = Web3.to_checksum_address(get_token_address(to_token))
        path = [from_addr, wpas, to_addr]
        data = _encode_function(router, "swapExactTokensForTokens", [
            amount_in, min_out_raw, path, user, deadline,
        ])
        return {
            "to": router_addr,
            "data": data,
            "value": "0",
            "gas_estimate": "250000",
            "description": f"Swap {amount} {from_token} for ~{quote['amount_out']} {to_token}",
            "quote": quote,
        }


def build_add_liquidity_tx(wallet_address: str, params: dict) -> dict:
    """Build an add liquidity transaction."""
    token_a = params["token_a"]
    token_b = params["token_b"]
    amount_a = params["amount_a"]
    amount_b = params["amount_b"]

    executor_addr = settings.intent_executor_address
    executor = get_contract(executor_addr, INTENT_EXECUTOR_ABI)

    # One of the tokens should be PAS
    if token_a == "PAS":
        token_symbol = token_b
        pas_amount = amount_a
        token_amount = amount_b
    elif token_b == "PAS":
        token_symbol = token_a
        pas_amount = amount_b
        token_amount = amount_a
    else:
        return {"error": "One token must be PAS for liquidity"}

    token_addr = Web3.to_checksum_address(get_token_address(token_symbol))
    token_decimals = TOKENS[token_symbol]["decimals"]

    amount_token_raw = to_wei_amount(token_amount, token_decimals)
    amount_pas_raw = to_wei_amount(pas_amount, 18)

    # 1% slippage for liquidity
    min_token = int(Decimal(amount_token_raw) * Decimal("0.99"))
    min_pas = int(Decimal(amount_pas_raw) * Decimal("0.99"))

    deadline = w3.eth.get_block("latest")["timestamp"] + 300

    data = _encode_function(executor, "executeAddLiquidityPAS", [
        Web3.to_checksum_address(wallet_address), token_addr,
        amount_token_raw, min_token, min_pas, amount_pas_raw, deadline,
    ])

    return {
        "to": executor_addr,
        "data": data,
        "value": "0",
        "gas_estimate": "350000",
        "description": f"Add liquidity: {pas_amount} PAS + {token_amount} {token_symbol}",
    }


def build_transaction(wallet_address: str, action: str, params: dict) -> dict:
    """Route action to appropriate transaction builder."""
    builders = {
        "transfer": build_transfer_tx,
        "swap": build_swap_tx,
        "add_liquidity": build_add_liquidity_tx,
    }

    builder = builders.get(action)
    if not builder:
        return {"error": f"Unknown action: {action}"}

    return builder(wallet_address, params)
