"""Execute endpoint — builds real unsigned transactions for frontend signing."""
import logging
from fastapi import APIRouter, HTTPException
from ..models.schemas import TransactionRequest, ExecuteResponse, TransactionResponse
from ..ai.validator import validate_action, ValidationError
from ..chain.tx_builder import build_transaction
from ..chain.reader import get_agent_wallet_address

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/execute", response_model=ExecuteResponse)
async def execute_action(request: TransactionRequest):
    """Build unsigned transaction(s) for a validated action."""
    try:
        # Validate action parameters
        validated_params = validate_action(
            request.action.value, request.params, request.wallet_address
        )

        # Get agent wallet
        agent_wallet = get_agent_wallet_address(request.wallet_address)
        target_wallet = agent_wallet or request.wallet_address

        # Build transaction
        tx = build_transaction(target_wallet, request.action.value, validated_params)

        if "error" in tx:
            raise HTTPException(status_code=400, detail=tx["error"])

        transactions = [
            TransactionResponse(
                to=tx["to"],
                data=tx["data"],
                value=tx["value"],
                gas_estimate=tx["gas_estimate"],
                description=tx.get("description", f"Execute {request.action.value}"),
            )
        ]

        total_gas = str(sum(int(t.gas_estimate) for t in transactions))

        return ExecuteResponse(transactions=transactions, total_gas=total_gas)

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Execute error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
