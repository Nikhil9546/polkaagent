"""Trading signals API — fetch signals and auto-trade based on them."""
import logging
from fastapi import APIRouter, HTTPException
from ..chain.signals import get_all_prices, generate_signals
from ..chain.executor import execute_swap_autonomous
from ..chain.reader import get_agent_wallet_address, get_agent_wallet_balances
from ..ai.engine import DeepSeekEngine

logger = logging.getLogger(__name__)
router = APIRouter()
engine = DeepSeekEngine()

SIGNAL_ANALYSIS_PROMPT = """You are PolkaAgent's trading signal analyzer. Given the current market signals and the user's portfolio, decide what action to take.

RULES:
1. Only recommend actions that make financial sense.
2. Never risk more than 20% of any single token balance on one trade.
3. If signals are weak or conflicting, recommend HOLD.
4. Be specific: "Swap 5 PAS for USDT" not "consider buying USDT".
5. Return your response as JSON with this format:
{
  "decision": "EXECUTE" or "HOLD",
  "actions": [{"action": "swap", "from_token": "PAS", "to_token": "USDT", "amount": "5"}],
  "reasoning": "brief explanation"
}
If decision is HOLD, actions should be empty.
"""


@router.get("/signals")
async def get_signals():
    """Get current trading signals from DEX pools."""
    try:
        prices = get_all_prices()
        signals = generate_signals()
        return {
            "prices": prices,
            "signals": signals,
            "total_signals": len(signals),
        }
    except Exception as e:
        logger.error(f"Signal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signals/prices")
async def get_prices():
    """Get current token prices from DEX."""
    return get_all_prices()


@router.post("/signals/auto-trade")
async def auto_trade(wallet_address: str):
    """Analyze signals and auto-execute trades via AI."""
    try:
        # Get signals
        signals = generate_signals()
        prices = get_all_prices()

        # Get portfolio
        agent_wallet = get_agent_wallet_address(wallet_address)
        if not agent_wallet:
            return {"error": "No agent wallet. Create one in Settings."}

        balances = get_agent_wallet_balances(agent_wallet)

        # Ask AI to analyze signals and decide
        context = f"""
CURRENT PORTFOLIO (Agent Wallet):
- PAS: {balances.get('PAS', '0')}
- USDT: {balances.get('USDT', '0')}
- USDC: {balances.get('USDC', '0')}

CURRENT PRICES:
{_format_prices(prices)}

TRADING SIGNALS:
{_format_signals(signals)}

Based on these signals and portfolio, what trades should be executed?
"""
        result = await engine.parse_intent(
            context,
            wallet_address,
            context=[{"role": "system", "content": SIGNAL_ANALYSIS_PROMPT}],
        )

        ai_message = result.get("message", "")
        executed_trades = []

        # Try to parse AI decision and execute
        import json as json_module
        try:
            # Extract JSON from AI response
            json_str = ai_message
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0]
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0]

            decision = json_module.loads(json_str)

            if decision.get("decision") == "EXECUTE":
                for trade in decision.get("actions", []):
                    if trade.get("action") == "swap":
                        trade_result = execute_swap_autonomous(
                            wallet_address,
                            trade["from_token"],
                            trade["to_token"],
                            trade["amount"],
                        )
                        executed_trades.append({
                            "trade": trade,
                            "result": trade_result,
                        })
        except (json_module.JSONDecodeError, KeyError):
            pass

        return {
            "signals": signals,
            "prices": prices,
            "portfolio": balances,
            "ai_analysis": ai_message,
            "decision": "EXECUTE" if executed_trades else "HOLD",
            "executed_trades": executed_trades,
        }

    except Exception as e:
        logger.error(f"Auto-trade error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _format_prices(prices: dict) -> str:
    lines = []
    for token, data in prices.items():
        lines.append(f"- {token}: {data['price_in_pas']} PAS per token, reserves: {data['reserve_pas']} PAS / {data['reserve_token']} {token}")
    return "\n".join(lines) if lines else "No price data available"


def _format_signals(signals: list) -> str:
    if not signals:
        return "No active signals"
    lines = []
    for s in signals:
        lines.append(f"- [{s['signal_type']}] {s['token']} ({s['strength']}): {s['reason']}")
    return "\n".join(lines)
