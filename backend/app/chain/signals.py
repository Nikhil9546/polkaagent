"""Trading signals engine — monitors DEX pools and generates actionable signals."""
import logging
import time
from decimal import Decimal
from dataclasses import dataclass, field
from typing import Optional
from web3 import Web3
from ..config import get_settings, TOKENS
from .client import w3, get_contract, ROUTER_ABI, FACTORY_ABI, PAIR_ABI

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class PricePoint:
    token: str
    price_in_pas: Decimal
    price_in_usd: Decimal
    timestamp: int
    reserve_pas: Decimal
    reserve_token: Decimal


@dataclass
class Signal:
    signal_type: str  # "BUY", "SELL", "HOLD", "ALERT"
    token: str
    strength: str  # "STRONG", "MODERATE", "WEAK"
    reason: str
    current_price: str
    change_pct: str
    recommended_action: str
    timestamp: int = field(default_factory=lambda: int(time.time()))


# In-memory price history (resets on restart — fine for hackathon)
price_history: dict[str, list[PricePoint]] = {"USDT": [], "USDC": []}
ASSUMED_PAS_USD = Decimal("5.0")  # Assumed PAS price for USD conversion


def get_current_price(token: str) -> Optional[PricePoint]:
    """Get current price of a token from DEX pool."""
    try:
        wpas = Web3.to_checksum_address(settings.wpas_address)
        token_addr = _get_token_addr(token)
        if not token_addr:
            return None

        factory = get_contract(settings.factory_address, FACTORY_ABI)
        pair_addr = factory.functions.getPair(wpas, token_addr).call()
        if pair_addr == "0x0000000000000000000000000000000000000000":
            return None

        pair = get_contract(pair_addr, PAIR_ABI)
        reserves = pair.functions.getReserves().call()
        token0 = pair.functions.token0().call()

        token_decimals = TOKENS[token]["decimals"]

        if token0.lower() == wpas.lower():
            reserve_pas = Decimal(reserves[0]) / Decimal(10**18)
            reserve_token = Decimal(reserves[1]) / Decimal(10**token_decimals)
        else:
            reserve_pas = Decimal(reserves[1]) / Decimal(10**18)
            reserve_token = Decimal(reserves[0]) / Decimal(10**token_decimals)

        # Price: how much PAS per token
        price_in_pas = reserve_pas / reserve_token if reserve_token > 0 else Decimal(0)
        price_in_usd = price_in_pas * ASSUMED_PAS_USD

        point = PricePoint(
            token=token,
            price_in_pas=price_in_pas,
            price_in_usd=price_in_usd,
            timestamp=int(time.time()),
            reserve_pas=reserve_pas,
            reserve_token=reserve_token,
        )

        # Store in history
        if token in price_history:
            price_history[token].append(point)
            # Keep last 100 points
            if len(price_history[token]) > 100:
                price_history[token] = price_history[token][-100:]

        return point
    except Exception as e:
        logger.error(f"Price fetch failed for {token}: {e}")
        return None


def get_all_prices() -> dict:
    """Get current prices for all tokens."""
    prices = {}
    for token in ["USDT", "USDC"]:
        point = get_current_price(token)
        if point:
            prices[token] = {
                "price_in_pas": str(point.price_in_pas),
                "price_in_usd": str(point.price_in_usd),
                "reserve_pas": str(point.reserve_pas),
                "reserve_token": str(point.reserve_token),
                "timestamp": point.timestamp,
            }
    return prices


def generate_signals() -> list[dict]:
    """Generate trading signals based on pool state and price history."""
    signals = []

    for token in ["USDT", "USDC"]:
        current = get_current_price(token)
        if not current:
            continue

        history = price_history.get(token, [])

        # Signal 1: Liquidity depth analysis
        liquidity_signal = _analyze_liquidity(token, current)
        if liquidity_signal:
            signals.append(_signal_to_dict(liquidity_signal))

        # Signal 2: Price movement (if we have history)
        if len(history) >= 2:
            movement_signal = _analyze_price_movement(token, history, current)
            if movement_signal:
                signals.append(_signal_to_dict(movement_signal))

        # Signal 3: Arbitrage opportunity between USDT/USDC
        arb_signal = _check_stablecoin_arb()
        if arb_signal:
            signals.append(_signal_to_dict(arb_signal))

        # Signal 4: Pool imbalance
        imbalance_signal = _analyze_pool_imbalance(token, current)
        if imbalance_signal:
            signals.append(_signal_to_dict(imbalance_signal))

    return signals


def _analyze_liquidity(token: str, current: PricePoint) -> Optional[Signal]:
    """Check if pool has good liquidity for trading."""
    total_liquidity_usd = current.reserve_pas * ASSUMED_PAS_USD * 2
    if total_liquidity_usd < 100:
        return Signal(
            signal_type="ALERT",
            token=token,
            strength="STRONG",
            reason=f"Low liquidity in PAS/{token} pool (${total_liquidity_usd:.0f}). High slippage risk.",
            current_price=str(current.price_in_pas),
            change_pct="0",
            recommended_action=f"Avoid large swaps in PAS/{token}. Consider adding liquidity.",
        )
    return None


def _analyze_price_movement(
    token: str, history: list[PricePoint], current: PricePoint
) -> Optional[Signal]:
    """Detect significant price movements."""
    if len(history) < 2:
        return None

    prev = history[-2]
    change = (current.price_in_pas - prev.price_in_pas) / prev.price_in_pas * 100

    if abs(change) < Decimal("0.5"):
        return None

    if change > Decimal("2"):
        return Signal(
            signal_type="SELL",
            token=token,
            strength="MODERATE" if change < 5 else "STRONG",
            reason=f"PAS/{token} price increased {change:.2f}% — potential profit-taking opportunity.",
            current_price=str(current.price_in_pas),
            change_pct=f"+{change:.2f}%",
            recommended_action=f"Consider swapping {token} for PAS to lock in gains.",
        )
    elif change < Decimal("-2"):
        return Signal(
            signal_type="BUY",
            token=token,
            strength="MODERATE" if change > -5 else "STRONG",
            reason=f"PAS/{token} price dropped {change:.2f}% — potential buying opportunity.",
            current_price=str(current.price_in_pas),
            change_pct=f"{change:.2f}%",
            recommended_action=f"Consider swapping PAS for {token} at a discount.",
        )

    return None


def _check_stablecoin_arb() -> Optional[Signal]:
    """Check for USDT/USDC price discrepancy."""
    usdt = get_current_price("USDT")
    usdc = get_current_price("USDC")
    if not usdt or not usdc:
        return None

    # Both should be ~equal in PAS terms. If not, arbitrage exists.
    diff_pct = abs(usdt.price_in_pas - usdc.price_in_pas) / usdt.price_in_pas * 100

    if diff_pct > Decimal("1"):
        cheaper = "USDT" if usdt.price_in_pas < usdc.price_in_pas else "USDC"
        expensive = "USDC" if cheaper == "USDT" else "USDT"
        return Signal(
            signal_type="BUY",
            token=cheaper,
            strength="STRONG",
            reason=f"Stablecoin arbitrage: {cheaper} is {diff_pct:.2f}% cheaper than {expensive} in PAS terms.",
            current_price=str(usdt.price_in_pas if cheaper == "USDT" else usdc.price_in_pas),
            change_pct=f"{diff_pct:.2f}% spread",
            recommended_action=f"Swap PAS → {cheaper} → {expensive} → PAS for ~{diff_pct:.1f}% profit.",
        )
    return None


def _analyze_pool_imbalance(token: str, current: PricePoint) -> Optional[Signal]:
    """Detect if a pool is significantly imbalanced."""
    # In a balanced pool, reserve_pas * PAS_price ≈ reserve_token * token_price
    pas_value = current.reserve_pas * ASSUMED_PAS_USD
    token_value = current.reserve_token  # stablecoins are ~$1

    if pas_value == 0 or token_value == 0:
        return None

    ratio = pas_value / token_value
    if ratio > Decimal("1.15"):
        return Signal(
            signal_type="BUY",
            token=token,
            strength="MODERATE",
            reason=f"PAS/{token} pool imbalanced — PAS side is {((ratio-1)*100):.1f}% heavier. {token} is relatively cheap.",
            current_price=str(current.price_in_pas),
            change_pct=f"{((ratio-1)*100):.1f}% imbalance",
            recommended_action=f"Swap PAS for {token} to capture the discount.",
        )
    elif ratio < Decimal("0.85"):
        return Signal(
            signal_type="SELL",
            token=token,
            strength="MODERATE",
            reason=f"PAS/{token} pool imbalanced — {token} side is heavier. PAS is relatively cheap.",
            current_price=str(current.price_in_pas),
            change_pct=f"{((1-ratio)*100):.1f}% imbalance",
            recommended_action=f"Swap {token} for PAS to capture the discount.",
        )
    return None


def _get_token_addr(token: str) -> Optional[str]:
    mapping = {
        "USDT": settings.usdt_address,
        "USDC": settings.usdc_address,
    }
    addr = mapping.get(token)
    if addr and addr != "0x":
        return Web3.to_checksum_address(addr)
    return None


def _signal_to_dict(signal: Signal) -> dict:
    return {
        "signal_type": signal.signal_type,
        "token": signal.token,
        "strength": signal.strength,
        "reason": signal.reason,
        "current_price": signal.current_price,
        "change_pct": signal.change_pct,
        "recommended_action": signal.recommended_action,
        "timestamp": signal.timestamp,
    }
