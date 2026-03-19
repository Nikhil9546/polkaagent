"""XCM Cross-Chain API — real prices, arbitrage detection, and real XCM transfers."""
import logging
from fastapi import APIRouter, HTTPException
from ..chain.xcm import (
    get_cross_chain_prices,
    detect_arbitrage_opportunities,
    get_xcm_arbitrage_summary,
)
from ..chain.xcm_builder import execute_real_xcm_transfer
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


@router.post("/xcm/transfer")
async def xcm_transfer(
    amount: float = 0.1,
    beneficiary: str = "",
    dest_para_id: int = 1000,
):
    """
    Execute a real XCM transfer of PAS to another parachain.

    - amount: PAS to transfer (default 0.1)
    - beneficiary: EVM address on destination (default: agent address)
    - dest_para_id: Target parachain (default: 1000 = Asset Hub)
    """
    try:
        s = get_settings()
        if not s.agent_private_key:
            raise HTTPException(status_code=400, detail="Agent key not configured")

        if not beneficiary:
            beneficiary = w3_account_address(s.agent_private_key)

        result = execute_real_xcm_transfer(
            amount_pas=amount,
            beneficiary=beneficiary,
            dest_para_id=dest_para_id,
            private_key=s.agent_private_key,
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"XCM transfer error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def w3_account_address(private_key: str) -> str:
    from ..chain.client import w3
    return w3.eth.account.from_key(private_key).address
