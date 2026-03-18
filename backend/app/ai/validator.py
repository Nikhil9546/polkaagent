"""Validates AI-generated actions against on-chain state before execution."""
import logging
from decimal import Decimal
from web3 import Web3
from ..config import get_settings, TOKENS
from ..chain.reader import get_all_balances, get_agent_wallet_balances, get_agent_wallet_address, get_token_address

logger = logging.getLogger(__name__)
settings = get_settings()


class ValidationError(Exception):
    pass


def validate_address(address: str) -> str:
    """Validate and checksum an Ethereum address."""
    if not address or not address.startswith("0x") or len(address) != 42:
        raise ValidationError(f"Invalid address: {address}")
    try:
        return Web3.to_checksum_address(address)
    except Exception:
        raise ValidationError(f"Invalid address format: {address}")


def validate_amount(amount: str, token: str) -> Decimal:
    """Validate amount is positive and parseable."""
    try:
        value = Decimal(amount)
    except Exception:
        raise ValidationError(f"Invalid amount: {amount}")
    if value <= 0:
        raise ValidationError(f"Amount must be positive, got {amount}")
    return value


def validate_token(token: str) -> str:
    """Validate token symbol is supported."""
    token = token.upper()
    if token not in TOKENS:
        raise ValidationError(f"Unsupported token: {token}. Supported: {', '.join(TOKENS.keys())}")
    return token


def validate_transfer(params: dict, wallet_address: str) -> dict:
    """Validate a transfer action."""
    token = validate_token(params.get("token", ""))
    to = validate_address(params.get("to", ""))
    amount = validate_amount(params.get("amount", "0"), token)

    # Check sender != recipient
    if to.lower() == wallet_address.lower():
        raise ValidationError("Cannot transfer to yourself")

    # Check balance
    agent_wallet = get_agent_wallet_address(wallet_address)
    if agent_wallet:
        balances = get_agent_wallet_balances(agent_wallet)
    else:
        balances = get_all_balances(wallet_address)

    available = Decimal(balances.get(token, "0"))
    if amount > available:
        raise ValidationError(
            f"Insufficient {token} balance. Have {available}, need {amount}"
        )

    return {"token": token, "to": to, "amount": str(amount)}


def validate_swap(params: dict, wallet_address: str) -> dict:
    """Validate a swap action."""
    from_token = validate_token(params.get("from_token", ""))
    to_token = validate_token(params.get("to_token", ""))
    amount = validate_amount(params.get("amount", "0"), from_token)
    slippage = params.get("slippage", "0.5")

    if from_token == to_token:
        raise ValidationError("Cannot swap a token for itself")

    # Validate slippage
    try:
        slip = Decimal(slippage)
        if slip < 0 or slip > 50:
            raise ValidationError("Slippage must be between 0 and 50%")
    except Exception:
        slippage = "0.5"

    # Check balance
    agent_wallet = get_agent_wallet_address(wallet_address)
    if agent_wallet:
        balances = get_agent_wallet_balances(agent_wallet)
    else:
        balances = get_all_balances(wallet_address)

    available = Decimal(balances.get(from_token, "0"))
    if amount > available:
        raise ValidationError(
            f"Insufficient {from_token} balance. Have {available}, need {amount}"
        )

    return {
        "from_token": from_token,
        "to_token": to_token,
        "amount": str(amount),
        "slippage": slippage,
    }


def validate_add_liquidity(params: dict, wallet_address: str) -> dict:
    """Validate an add_liquidity action."""
    token_a = validate_token(params.get("token_a", ""))
    token_b = validate_token(params.get("token_b", ""))
    amount_a = validate_amount(params.get("amount_a", "0"), token_a)
    amount_b = validate_amount(params.get("amount_b", "0"), token_b)

    if token_a == token_b:
        raise ValidationError("Liquidity pair must have two different tokens")

    if "PAS" not in (token_a, token_b):
        raise ValidationError("One token in the pair must be PAS")

    return {
        "token_a": token_a,
        "token_b": token_b,
        "amount_a": str(amount_a),
        "amount_b": str(amount_b),
    }


def validate_action(action: str, params: dict, wallet_address: str) -> dict:
    """Validate an action and its parameters."""
    validators = {
        "transfer": validate_transfer,
        "swap": validate_swap,
        "add_liquidity": validate_add_liquidity,
    }

    validator = validators.get(action)
    if validator:
        return validator(params, wallet_address)

    # Read-only actions don't need validation
    if action in ("check_balance", "get_quote", "portfolio"):
        return params

    raise ValidationError(f"Unknown action: {action}")
