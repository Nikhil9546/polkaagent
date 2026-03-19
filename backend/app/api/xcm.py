"""XCM Cross-Chain API — real prices, arbitrage detection, and XCM execution."""
import logging
from fastapi import APIRouter, HTTPException
from ..chain.xcm import (
    get_cross_chain_prices,
    detect_arbitrage_opportunities,
    get_xcm_arbitrage_summary,
    execute_xcm_transfer,
)
from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/xcm/prices")
async def xcm_prices():
    """Get real token prices across all monitored parachains (CoinGecko)."""
    try:
        return get_cross_chain_prices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/xcm/arbitrage")
async def xcm_arbitrage(min_spread: float = 0.5):
    """Detect cross-chain arbitrage opportunities using real prices."""
    try:
        opportunities = detect_arbitrage_opportunities(min_spread)
        return {
            "opportunities": opportunities,
            "total": len(opportunities),
            "min_spread_filter": min_spread,
            "price_source": "CoinGecko (real)",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/xcm/summary")
async def xcm_summary():
    """Get complete cross-chain overview for AI analysis."""
    try:
        return get_xcm_arbitrage_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/xcm/execute")
async def xcm_execute():
    """Execute a real XCM transfer via the precompile on Polkadot Hub."""
    try:
        settings = get_settings()
        if not settings.agent_private_key:
            raise HTTPException(status_code=400, detail="Agent key not configured")

        result = execute_xcm_transfer(settings.agent_private_key)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"XCM execute error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
