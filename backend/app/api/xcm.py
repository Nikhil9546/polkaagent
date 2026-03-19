"""XCM Cross-Chain API — prices, arbitrage detection, and cross-chain execution."""
import logging
from fastapi import APIRouter, HTTPException
from ..chain.xcm import get_cross_chain_prices, detect_arbitrage_opportunities, get_xcm_arbitrage_summary

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/xcm/prices")
async def xcm_prices():
    """Get token prices across all monitored parachains."""
    try:
        return get_cross_chain_prices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/xcm/arbitrage")
async def xcm_arbitrage(min_spread: float = 1.0):
    """Detect cross-chain arbitrage opportunities."""
    try:
        opportunities = detect_arbitrage_opportunities(min_spread)
        return {
            "opportunities": opportunities,
            "total": len(opportunities),
            "min_spread_filter": min_spread,
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
