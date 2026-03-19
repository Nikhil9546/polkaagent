import json
import logging
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse
from ..models.schemas import ChatRequest, ChatResponse, ActionPlan, ActionType
from ..ai.engine import DeepSeekEngine
from ..chain.reader import (
    get_all_balances,
    get_agent_wallet_address,
    get_agent_wallet_balances,
    get_swap_quote,
    get_pool_info,
)
from ..chain.tx_builder import build_transaction
from ..chain.executor import execute_swap_autonomous, execute_transfer_autonomous
from ..chain.signals import get_all_prices, generate_signals
from ..chain.xcm import get_xcm_arbitrage_summary

logger = logging.getLogger(__name__)
router = APIRouter()
engine = DeepSeekEngine()


def execute_tool(action: str, params: dict, wallet_address: str) -> dict:
    """Execute a tool call and return results."""
    try:
        if action == "check_balance":
            token = params.get("token", "ALL")
            agent_wallet = get_agent_wallet_address(wallet_address)
            if agent_wallet:
                balances = get_agent_wallet_balances(agent_wallet)
            else:
                balances = get_all_balances(wallet_address)

            if token != "ALL":
                return {"balance": balances.get(token, "0"), "token": token}
            return {"balances": balances}

        elif action == "portfolio":
            agent_wallet = get_agent_wallet_address(wallet_address)
            wallet_balances = get_all_balances(wallet_address)
            agent_balances = (
                get_agent_wallet_balances(agent_wallet) if agent_wallet else {}
            )

            return {
                "wallet_address": wallet_address,
                "agent_wallet": agent_wallet,
                "wallet_balances": wallet_balances,
                "agent_wallet_balances": agent_balances,
            }

        elif action == "get_quote":
            return get_swap_quote(
                params["from_token"], params["to_token"], params["amount"]
            )

        elif action == "swap":
            # Autonomous swap — AI signs and broadcasts via Agent Wallet
            result = execute_swap_autonomous(
                wallet_address,
                params["from_token"],
                params["to_token"],
                params["amount"],
                params.get("slippage", "0.5"),
            )
            return result

        elif action == "transfer":
            # Autonomous transfer via Agent Wallet
            result = execute_transfer_autonomous(
                wallet_address,
                params["token"],
                params["to"],
                params["amount"],
            )
            return result

        elif action in ("add_liquidity", "remove_liquidity"):
            return {"error": f"{action} autonomous execution coming soon"}

        elif action == "get_signals":
            prices = get_all_prices()
            signals = generate_signals()
            return {
                "prices": prices,
                "signals": signals,
                "total_signals": len(signals),
            }

        elif action == "auto_trade":
            # Get signals and portfolio, then execute best trades
            signals = generate_signals()
            prices = get_all_prices()
            agent_wallet = get_agent_wallet_address(wallet_address)
            balances = get_agent_wallet_balances(agent_wallet) if agent_wallet else get_all_balances(wallet_address)

            executed = []
            buy_signals = [s for s in signals if s["signal_type"] == "BUY" and s["strength"] in ("STRONG", "MODERATE")]

            for signal in buy_signals[:2]:  # max 2 trades per auto-trade
                token = signal["token"]
                # Trade 10% of PAS balance
                pas_bal = float(balances.get("PAS", "0"))
                trade_amount = str(round(pas_bal * 0.1, 2))
                if float(trade_amount) > 1:
                    result = execute_swap_autonomous(wallet_address, "PAS", token, trade_amount)
                    executed.append({
                        "signal": signal,
                        "trade": {"from": "PAS", "to": token, "amount": trade_amount},
                        "result": result,
                    })

            return {
                "signals": signals,
                "prices": prices,
                "portfolio": balances,
                "executed_trades": executed,
                "total_signals": len(signals),
                "trades_executed": len(executed),
            }

        elif action == "xcm_arbitrage":
            return get_xcm_arbitrage_summary()

        else:
            return {"error": f"Unknown action: {action}"}

    except Exception as e:
        logger.error(f"Tool execution failed for {action}: {e}")
        return {"error": str(e)}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message and return AI response with actions."""
    try:
        result = await engine.parse_intent(request.message, request.wallet_address)

        actions = []
        tool_results = []

        for action_data in result.get("actions", []):
            action_name = action_data["action"]
            params = action_data["params"]

            # Execute the tool
            tool_result = execute_tool(action_name, params, request.wallet_address)

            tool_results.append(
                {
                    "action": action_name,
                    "params": params,
                    "result": tool_result,
                    "tool_call_id": action_data.get("tool_call_id", ""),
                }
            )

            # Create action plan for frontend
            try:
                action_type = ActionType(action_name)
            except ValueError:
                action_type = ActionType.CHECK_BALANCE

            explanation = tool_result.get("description", f"Execute {action_name}")
            actions.append(
                ActionPlan(
                    action=action_type,
                    params={**params, **tool_result},
                    explanation=explanation,
                )
            )

        # Generate response with tool results
        if tool_results:
            message = await engine.generate_response_with_results(
                request.message,
                request.wallet_address,
                tool_results,
            )
        else:
            message = result.get("message", "I'm not sure how to help with that. Try asking me to check your balance, swap tokens, or transfer funds.")

        return ChatResponse(message=message, actions=actions)

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat response via SSE for real-time UI updates."""

    async def event_generator():
        try:
            async for chunk in engine.stream_intent(
                request.message, request.wallet_address
            ):
                data = json.loads(chunk)

                if data["type"] == "content":
                    yield {"event": "message", "data": chunk}

                elif data["type"] == "action":
                    action_data = data["data"]
                    tool_result = execute_tool(
                        action_data["action"],
                        action_data["params"],
                        request.wallet_address,
                    )
                    yield {
                        "event": "action",
                        "data": json.dumps(
                            {
                                "action": action_data["action"],
                                "params": action_data["params"],
                                "result": tool_result,
                            }
                        ),
                    }

                elif data["type"] == "done":
                    yield {"event": "done", "data": "{}"}

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield {"event": "error", "data": json.dumps({"error": str(e)})}

    return EventSourceResponse(event_generator())
