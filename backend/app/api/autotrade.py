"""Background auto-trader — continuously monitors signals and executes trades."""
import asyncio
import logging
import time
from fastapi import APIRouter
from ..chain.signals import generate_signals, get_all_prices
from ..chain.executor import execute_swap_autonomous
from ..chain.reader import get_agent_wallet_address, get_agent_wallet_balances

logger = logging.getLogger(__name__)
router = APIRouter()

# Auto-trade state per wallet
auto_trade_state: dict[str, dict] = {}


def get_state(wallet: str) -> dict:
    if wallet not in auto_trade_state:
        auto_trade_state[wallet] = {
            "enabled": False,
            "interval_seconds": 60,
            "max_trade_pct": 10,  # max % of balance per trade
            "min_signal_strength": "MODERATE",  # MODERATE or STRONG
            "last_run": 0,
            "total_trades": 0,
            "trade_log": [],
            "task": None,
        }
    return auto_trade_state[wallet]


@router.post("/autotrade/start")
async def start_autotrade(
    wallet_address: str,
    interval: int = 60,
    max_trade_pct: int = 10,
    min_strength: str = "MODERATE",
):
    """Start continuous auto-trading for a wallet."""
    state = get_state(wallet_address)

    agent_wallet = get_agent_wallet_address(wallet_address)
    if not agent_wallet:
        return {"error": "No agent wallet found. Create one in Settings."}

    state["enabled"] = True
    state["interval_seconds"] = max(30, min(300, interval))
    state["max_trade_pct"] = max(1, min(25, max_trade_pct))
    state["min_signal_strength"] = min_strength

    # Start background loop
    if state.get("task") is None or state["task"].done():
        state["task"] = asyncio.create_task(_auto_trade_loop(wallet_address))

    return {
        "status": "started",
        "interval": state["interval_seconds"],
        "max_trade_pct": state["max_trade_pct"],
        "min_strength": state["min_signal_strength"],
    }


@router.post("/autotrade/stop")
async def stop_autotrade(wallet_address: str):
    """Stop auto-trading for a wallet."""
    state = get_state(wallet_address)
    state["enabled"] = False

    if state.get("task") and not state["task"].done():
        state["task"].cancel()
        state["task"] = None

    return {
        "status": "stopped",
        "total_trades": state["total_trades"],
    }


@router.get("/autotrade/status")
async def get_autotrade_status(wallet_address: str):
    """Get auto-trade status for a wallet."""
    state = get_state(wallet_address)
    return {
        "enabled": state["enabled"],
        "interval_seconds": state["interval_seconds"],
        "max_trade_pct": state["max_trade_pct"],
        "min_strength": state["min_signal_strength"],
        "total_trades": state["total_trades"],
        "last_run": state["last_run"],
        "recent_trades": state["trade_log"][-10:],
    }


@router.post("/autotrade/run-once")
async def run_once(wallet_address: str):
    """Run one cycle of signal analysis + trade execution."""
    result = _execute_cycle(wallet_address)
    return result


def _execute_cycle(wallet_address: str) -> dict:
    """Execute one auto-trade cycle."""
    state = get_state(wallet_address)
    state["last_run"] = int(time.time())

    signals = generate_signals()
    prices = get_all_prices()

    # Filter by strength
    valid_strengths = ["STRONG"] if state["min_signal_strength"] == "STRONG" else ["STRONG", "MODERATE"]
    buy_signals = [
        s for s in signals
        if s["signal_type"] == "BUY" and s["strength"] in valid_strengths
    ]

    if not buy_signals:
        return {
            "action": "HOLD",
            "reason": "No strong enough buy signals",
            "signals_checked": len(signals),
            "prices": prices,
        }

    # Get portfolio
    agent_wallet = get_agent_wallet_address(wallet_address)
    if not agent_wallet:
        return {"action": "SKIP", "reason": "No agent wallet"}

    balances = get_agent_wallet_balances(agent_wallet)
    pas_balance = float(balances.get("PAS", "0"))

    if pas_balance < 1:
        return {"action": "SKIP", "reason": f"Insufficient PAS balance ({pas_balance})"}

    # Trade max_trade_pct of PAS balance
    trade_pct = state["max_trade_pct"] / 100
    trade_amount = round(pas_balance * trade_pct, 2)

    if trade_amount < 0.5:
        return {"action": "SKIP", "reason": "Trade amount too small"}

    # Execute on first buy signal
    signal = buy_signals[0]
    token = signal["token"]

    result = execute_swap_autonomous(
        wallet_address, "PAS", token, str(trade_amount)
    )

    trade_record = {
        "timestamp": int(time.time()),
        "signal": signal,
        "trade": {"from": "PAS", "to": token, "amount": str(trade_amount)},
        "result": {
            "success": result.get("success", False),
            "tx_hash": result.get("tx_hash", ""),
            "description": result.get("description", ""),
        },
    }

    state["trade_log"].append(trade_record)
    if len(state["trade_log"]) > 50:
        state["trade_log"] = state["trade_log"][-50:]

    if result.get("success"):
        state["total_trades"] += 1

    return {
        "action": "EXECUTED",
        "trade": trade_record,
        "portfolio_before": balances,
        "signals_checked": len(signals),
    }


async def _auto_trade_loop(wallet_address: str):
    """Background loop that runs auto-trading."""
    state = get_state(wallet_address)
    logger.info(f"Auto-trade loop started for {wallet_address}")

    while state["enabled"]:
        try:
            result = _execute_cycle(wallet_address)
            action = result.get("action", "SKIP")
            logger.info(f"Auto-trade cycle for {wallet_address}: {action}")
        except Exception as e:
            logger.error(f"Auto-trade error: {e}")

        await asyncio.sleep(state["interval_seconds"])

    logger.info(f"Auto-trade loop stopped for {wallet_address}")
