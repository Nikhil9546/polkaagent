import logging
from decimal import Decimal
from web3 import Web3
from ..config import get_settings, TOKENS
from .client import (
    w3,
    get_contract,
    get_token_contract,
    AGENT_WALLET_ABI,
    WALLET_FACTORY_ABI,
    ROUTER_ABI,
    FACTORY_ABI,
    PAIR_ABI,
)

logger = logging.getLogger(__name__)
settings = get_settings()


def get_token_address(symbol: str) -> str:
    """Get token contract address by symbol."""
    mapping = {
        "WPAS": settings.wpas_address,
        "USDT": settings.usdt_address,
        "USDC": settings.usdc_address,
    }
    return mapping.get(symbol, "")


def get_native_balance(address: str) -> str:
    """Get native PAS balance in human units."""
    balance_wei = w3.eth.get_balance(Web3.to_checksum_address(address))
    return str(Web3.from_wei(balance_wei, "ether"))


def get_token_balance(token_address: str, wallet_address: str) -> tuple[str, int]:
    """Get ERC-20 token balance. Returns (balance_human, decimals)."""
    contract = get_token_contract(token_address)
    try:
        balance = contract.functions.balanceOf(
            Web3.to_checksum_address(wallet_address)
        ).call()
        decimals = contract.functions.decimals().call()
        human_balance = str(Decimal(balance) / Decimal(10**decimals))
        return human_balance, decimals
    except Exception as e:
        logger.error(f"Failed to get balance for {token_address}: {e}")
        return "0", 18


def get_all_balances(wallet_address: str) -> dict:
    """Get all token balances for a wallet."""
    balances = {"PAS": get_native_balance(wallet_address)}

    for symbol in ["USDT", "USDC"]:
        addr = get_token_address(symbol)
        if addr and addr != "0x":
            balance, _ = get_token_balance(addr, wallet_address)
            balances[symbol] = balance
        else:
            balances[symbol] = "0"

    return balances


def get_agent_wallet_address(user_address: str) -> str | None:
    """Get the AgentWallet address for a user from the factory."""
    if not settings.wallet_factory_address or settings.wallet_factory_address == "0x":
        return None
    try:
        factory = get_contract(settings.wallet_factory_address, WALLET_FACTORY_ABI)
        wallet_addr = factory.functions.getWallet(
            Web3.to_checksum_address(user_address)
        ).call()
        if wallet_addr == "0x0000000000000000000000000000000000000000":
            return None
        return wallet_addr
    except Exception as e:
        logger.error(f"Failed to get agent wallet: {e}")
        return None


def get_agent_wallet_balances(wallet_address: str) -> dict:
    """Get balances held in an AgentWallet contract."""
    wallet = get_contract(wallet_address, AGENT_WALLET_ABI)

    balances = {}
    try:
        balances["PAS"] = str(
            Web3.from_wei(wallet.functions.getNativeBalance().call(), "ether")
        )
    except Exception:
        balances["PAS"] = "0"

    for symbol in ["USDT", "USDC"]:
        addr = get_token_address(symbol)
        if addr and addr != "0x":
            try:
                raw = wallet.functions.getTokenBalance(
                    Web3.to_checksum_address(addr)
                ).call()
                decimals = TOKENS[symbol]["decimals"]
                balances[symbol] = str(Decimal(raw) / Decimal(10**decimals))
            except Exception:
                balances[symbol] = "0"
        else:
            balances[symbol] = "0"

    return balances


def get_swap_quote(
    from_token: str, to_token: str, amount: str
) -> dict:
    """Get a real swap quote from Uniswap V2 Router."""
    if not settings.router_address:
        return {"error": "DEX not configured"}

    router = get_contract(settings.router_address, ROUTER_ABI)

    # Determine path
    from_addr = (
        settings.wpas_address
        if from_token == "PAS"
        else get_token_address(from_token)
    )
    to_addr = (
        settings.wpas_address if to_token == "PAS" else get_token_address(to_token)
    )

    from_decimals = TOKENS[from_token]["decimals"]
    to_decimals = TOKENS[to_token]["decimals"]
    amount_raw = int(Decimal(amount) * Decimal(10**from_decimals))

    # Build path
    if from_token == "PAS" or to_token == "PAS":
        path = [Web3.to_checksum_address(from_addr), Web3.to_checksum_address(to_addr)]
    else:
        path = [
            Web3.to_checksum_address(from_addr),
            Web3.to_checksum_address(settings.wpas_address),
            Web3.to_checksum_address(to_addr),
        ]

    try:
        amounts = router.functions.getAmountsOut(amount_raw, path).call()
        amount_out_raw = amounts[-1]
        amount_out = str(Decimal(amount_out_raw) / Decimal(10**to_decimals))

        # Calculate price impact (simplified)
        if len(amounts) >= 2:
            price_impact = "< 0.1%"  # Simplified for MVP
        else:
            price_impact = "unknown"

        # Minimum received with 0.5% slippage
        min_out = Decimal(amount_out_raw) * Decimal("0.995")
        min_received = str(min_out / Decimal(10**to_decimals))

        return {
            "amount_in": amount,
            "amount_out": amount_out,
            "price_impact": price_impact,
            "route": [from_token] + (["WPAS"] if len(path) == 3 else []) + [to_token],
            "minimum_received": min_received,
            "from_token": from_token,
            "to_token": to_token,
        }
    except Exception as e:
        logger.error(f"Swap quote failed: {e}")
        return {"error": f"Could not get quote: {str(e)}"}


def get_pool_info(token_symbol: str) -> dict:
    """Get liquidity pool info for a PAS/token pair."""
    if not settings.factory_address:
        return {"error": "DEX not configured"}

    token_addr = get_token_address(token_symbol)
    if not token_addr:
        return {"error": f"Token {token_symbol} not found"}

    factory = get_contract(settings.factory_address, FACTORY_ABI)

    try:
        pair_addr = factory.functions.getPair(
            Web3.to_checksum_address(settings.wpas_address),
            Web3.to_checksum_address(token_addr),
        ).call()

        if pair_addr == "0x0000000000000000000000000000000000000000":
            return {"error": "Pool does not exist"}

        pair = get_contract(pair_addr, PAIR_ABI)
        reserves = pair.functions.getReserves().call()
        token0 = pair.functions.token0().call()
        total_supply = pair.functions.totalSupply().call()

        token_decimals = TOKENS[token_symbol]["decimals"]

        # Determine which reserve is which
        if token0.lower() == settings.wpas_address.lower():
            reserve_pas = Decimal(reserves[0]) / Decimal(10**18)
            reserve_token = Decimal(reserves[1]) / Decimal(10**token_decimals)
        else:
            reserve_pas = Decimal(reserves[1]) / Decimal(10**18)
            reserve_token = Decimal(reserves[0]) / Decimal(10**token_decimals)

        return {
            "pair_address": pair_addr,
            "reserve_pas": str(reserve_pas),
            f"reserve_{token_symbol.lower()}": str(reserve_token),
            "total_supply": str(Decimal(total_supply) / Decimal(10**18)),
            "price_pas_per_token": str(reserve_pas / reserve_token) if reserve_token > 0 else "0",
        }
    except Exception as e:
        logger.error(f"Pool info failed: {e}")
        return {"error": str(e)}
