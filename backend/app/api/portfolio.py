import logging
from fastapi import APIRouter, HTTPException
from ..models.schemas import PortfolioResponse, QuoteResponse
from ..chain.reader import (
    get_all_balances,
    get_agent_wallet_address,
    get_agent_wallet_balances,
    get_swap_quote,
    get_pool_info,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/portfolio/{wallet_address}", response_model=PortfolioResponse)
async def get_portfolio(wallet_address: str):
    """Get complete portfolio for a wallet."""
    try:
        # Get direct wallet balances
        wallet_balances = get_all_balances(wallet_address)

        # Get agent wallet balances
        agent_wallet = get_agent_wallet_address(wallet_address)
        agent_balances = {}
        if agent_wallet:
            agent_balances = get_agent_wallet_balances(agent_wallet)

        # Merge balances (show agent wallet balances as primary)
        token_balances = {}
        for token in ["PAS", "USDT", "USDC"]:
            wallet_bal = wallet_balances.get(token, "0")
            agent_bal = agent_balances.get(token, "0")
            token_balances[token] = {
                "wallet": wallet_bal,
                "agent_wallet": agent_bal,
            }

        # Get LP positions
        lp_positions = []
        for token in ["USDT", "USDC"]:
            pool = get_pool_info(token)
            if "error" not in pool:
                lp_positions.append(
                    {
                        "pair": f"PAS/{token}",
                        "pair_address": pool.get("pair_address", ""),
                        "reserve_pas": pool.get("reserve_pas", "0"),
                        f"reserve_{token.lower()}": pool.get(
                            f"reserve_{token.lower()}", "0"
                        ),
                    }
                )

        return PortfolioResponse(
            native_balance=wallet_balances.get("PAS", "0"),
            token_balances=token_balances,
            lp_positions=lp_positions,
            agent_wallet_address=agent_wallet,
        )
    except Exception as e:
        logger.error(f"Portfolio error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quote/{from_token}/{to_token}/{amount}", response_model=QuoteResponse)
async def get_quote(from_token: str, to_token: str, amount: str):
    """Get a swap quote."""
    try:
        quote = get_swap_quote(from_token.upper(), to_token.upper(), amount)
        if "error" in quote:
            raise HTTPException(status_code=400, detail=quote["error"])
        return QuoteResponse(**quote)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quote error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pool/{token}")
async def get_pool(token: str):
    """Get liquidity pool info."""
    try:
        info = get_pool_info(token.upper())
        if "error" in info:
            raise HTTPException(status_code=400, detail=info["error"])
        return info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wallet/{user_address}")
async def get_wallet_info(user_address: str):
    """Get agent wallet info for a user."""
    try:
        agent_wallet = get_agent_wallet_address(user_address)
        return {
            "user_address": user_address,
            "agent_wallet": agent_wallet,
            "has_wallet": agent_wallet is not None,
        }
    except Exception as e:
        logger.error(f"Wallet info error: {e}", exc_info=True)
        return {
            "user_address": user_address,
            "agent_wallet": None,
            "has_wallet": False,
        }
