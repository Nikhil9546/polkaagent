"""XCM Cross-Chain Arbitrage Engine — monitors prices across parachains and executes arbitrage."""
import logging
import time
from decimal import Decimal
from dataclasses import dataclass
from typing import Optional
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class ParachainPrice:
    parachain: str
    para_id: int
    token: str
    price_usd: Decimal
    liquidity_usd: Decimal
    timestamp: int
    source: str


@dataclass
class ArbitrageOpportunity:
    token: str
    buy_chain: str
    buy_para_id: int
    buy_price: Decimal
    sell_chain: str
    sell_para_id: int
    sell_price: Decimal
    spread_pct: Decimal
    estimated_profit_usd: Decimal
    trade_size_usd: Decimal
    route: str
    timestamp: int


# Simulated cross-chain prices from known Polkadot DEXes
# In production, these would come from on-chain reads via XCM queries or indexers
PARACHAIN_DEXES = {
    "Polkadot Hub": {
        "para_id": 0,
        "dex": "PolkaSwap",
        "tokens": {
            "DOT": {"base_price": 5.0, "liquidity": 500000},
            "USDT": {"base_price": 1.0, "liquidity": 250000},
            "USDC": {"base_price": 1.0, "liquidity": 250000},
        },
    },
    "Hydration": {
        "para_id": 2034,
        "dex": "Omnipool",
        "tokens": {
            "DOT": {"base_price": 5.0, "liquidity": 2000000},
            "USDT": {"base_price": 1.0, "liquidity": 800000},
            "USDC": {"base_price": 1.0, "liquidity": 600000},
            "HDX": {"base_price": 0.012, "liquidity": 100000},
        },
    },
    "Moonbeam": {
        "para_id": 2004,
        "dex": "StellaSwap",
        "tokens": {
            "DOT": {"base_price": 5.0, "liquidity": 1500000},
            "USDT": {"base_price": 1.0, "liquidity": 500000},
            "USDC": {"base_price": 1.0, "liquidity": 400000},
            "GLMR": {"base_price": 0.25, "liquidity": 300000},
        },
    },
    "Acala": {
        "para_id": 2000,
        "dex": "Acala DEX",
        "tokens": {
            "DOT": {"base_price": 5.0, "liquidity": 1200000},
            "USDT": {"base_price": 1.0, "liquidity": 400000},
            "aUSD": {"base_price": 1.0, "liquidity": 300000},
            "ACA": {"base_price": 0.08, "liquidity": 200000},
        },
    },
    "Astar": {
        "para_id": 2006,
        "dex": "ArthSwap",
        "tokens": {
            "DOT": {"base_price": 5.0, "liquidity": 800000},
            "USDT": {"base_price": 1.0, "liquidity": 300000},
            "ASTR": {"base_price": 0.06, "liquidity": 150000},
        },
    },
    "Bifrost": {
        "para_id": 2030,
        "dex": "Bifrost DEX",
        "tokens": {
            "DOT": {"base_price": 5.0, "liquidity": 600000},
            "vDOT": {"base_price": 5.2, "liquidity": 400000},
            "BNC": {"base_price": 0.3, "liquidity": 100000},
        },
    },
}


def _apply_market_variance(base_price: float, chain: str, token: str) -> float:
    """Simulate realistic price variance across chains based on time."""
    import hashlib
    seed = hashlib.md5(f"{chain}{token}{int(time.time()) // 30}".encode()).hexdigest()
    variance = (int(seed[:4], 16) / 65535 - 0.5) * 0.08  # +/- 4%
    return base_price * (1 + variance)


def get_cross_chain_prices() -> dict:
    """Get current prices across all parachains."""
    prices = {}
    now = int(time.time())

    for chain, info in PARACHAIN_DEXES.items():
        chain_prices = {}
        for token, data in info["tokens"].items():
            price = _apply_market_variance(data["base_price"], chain, token)
            chain_prices[token] = {
                "price_usd": round(price, 6),
                "liquidity_usd": data["liquidity"],
                "source": info["dex"],
            }
        prices[chain] = {
            "para_id": info["para_id"],
            "dex": info["dex"],
            "tokens": chain_prices,
        }

    # Override Polkadot Hub prices with real DEX data
    from .signals import get_all_prices
    real_prices = get_all_prices()
    if real_prices:
        for token, data in real_prices.items():
            pas_price = float(data.get("price_in_pas", 0))
            if pas_price > 0:
                prices["Polkadot Hub"]["tokens"][token] = {
                    "price_usd": round(1.0 / pas_price * 5.0, 6),  # PAS = $5 assumed
                    "liquidity_usd": float(data.get("reserve_pas", 0)) * 5.0 * 2,
                    "source": "PolkaSwap (real)",
                }

    return prices


def detect_arbitrage_opportunities(min_spread_pct: float = 1.0) -> list[dict]:
    """Detect cross-chain arbitrage opportunities."""
    prices = get_cross_chain_prices()
    opportunities = []

    # Compare each token across all chains
    tokens_seen = set()
    for chain, info in prices.items():
        for token in info["tokens"]:
            tokens_seen.add(token)

    for token in tokens_seen:
        # Collect prices for this token across chains
        chain_prices = []
        for chain, info in prices.items():
            if token in info["tokens"]:
                chain_prices.append({
                    "chain": chain,
                    "para_id": info["para_id"],
                    "price": info["tokens"][token]["price_usd"],
                    "liquidity": info["tokens"][token]["liquidity_usd"],
                    "dex": info["dex"],
                })

        if len(chain_prices) < 2:
            continue

        # Find best buy and sell
        chain_prices.sort(key=lambda x: x["price"])
        cheapest = chain_prices[0]
        most_expensive = chain_prices[-1]

        spread = (most_expensive["price"] - cheapest["price"]) / cheapest["price"] * 100

        if spread >= min_spread_pct:
            # Estimate trade size (limited by smaller pool's liquidity)
            max_trade = min(cheapest["liquidity"], most_expensive["liquidity"]) * 0.02  # 2% of pool
            estimated_profit = max_trade * (spread / 100)

            opportunities.append({
                "token": token,
                "buy_chain": cheapest["chain"],
                "buy_para_id": cheapest["para_id"],
                "buy_price": cheapest["price"],
                "buy_dex": cheapest["dex"],
                "sell_chain": most_expensive["chain"],
                "sell_para_id": most_expensive["para_id"],
                "sell_price": most_expensive["price"],
                "sell_dex": most_expensive["dex"],
                "spread_pct": round(spread, 2),
                "estimated_profit_usd": round(estimated_profit, 2),
                "trade_size_usd": round(max_trade, 2),
                "route": f"Buy {token} on {cheapest['chain']} ({cheapest['dex']}) @ ${cheapest['price']:.4f} -> XCM transfer -> Sell on {most_expensive['chain']} ({most_expensive['dex']}) @ ${most_expensive['price']:.4f}",
                "timestamp": int(time.time()),
            })

    # Sort by profit
    opportunities.sort(key=lambda x: x["estimated_profit_usd"], reverse=True)
    return opportunities


def get_xcm_arbitrage_summary() -> dict:
    """Get a summary of cross-chain state for the AI."""
    prices = get_cross_chain_prices()
    opportunities = detect_arbitrage_opportunities(min_spread_pct=0.5)

    return {
        "chains_monitored": len(prices),
        "chains": {chain: {"para_id": info["para_id"], "dex": info["dex"], "tokens": len(info["tokens"])} for chain, info in prices.items()},
        "opportunities": opportunities[:5],
        "total_opportunities": len(opportunities),
        "best_opportunity": opportunities[0] if opportunities else None,
    }
