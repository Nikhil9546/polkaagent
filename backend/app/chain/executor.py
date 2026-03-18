"""Autonomous executor — AI agent signs and broadcasts txs through AgentWallet."""
import logging
from web3 import Web3
from decimal import Decimal
from ..config import get_settings, TOKENS
from .client import (
    w3,
    get_contract,
    AGENT_WALLET_ABI,
    ROUTER_ABI,
    MINIMAL_ERC20_ABI,
)
from .reader import get_token_address, get_swap_quote, get_agent_wallet_address

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_agent_account():
    """Get the agent's account for signing."""
    return w3.eth.account.from_key(settings.agent_private_key)


def _send_tx(tx: dict) -> str:
    """Sign and broadcast a transaction, return tx hash."""
    account = _get_agent_account()
    tx["from"] = account.address
    tx["nonce"] = w3.eth.get_transaction_count(account.address)
    tx["chainId"] = settings.chain_id

    if "gas" not in tx:
        try:
            tx["gas"] = w3.eth.estimate_gas(tx)
        except Exception:
            tx["gas"] = 300000

    tx["maxFeePerGas"] = w3.eth.gas_price * 2
    tx["maxPriorityFeePerGas"] = w3.eth.gas_price

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()


def _wait_for_receipt(tx_hash: str, timeout: int = 60) -> dict:
    """Wait for transaction receipt."""
    try:
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
        return {
            "tx_hash": tx_hash,
            "status": "confirmed" if receipt["status"] == 1 else "failed",
            "block_number": receipt["blockNumber"],
            "gas_used": receipt["gasUsed"],
        }
    except Exception as e:
        return {"tx_hash": tx_hash, "status": "pending", "error": str(e)}


def execute_swap_autonomous(
    user_address: str, from_token: str, to_token: str, amount: str, slippage: str = "0.5"
) -> dict:
    """Execute a swap autonomously through the Agent Wallet."""
    agent_wallet = get_agent_wallet_address(user_address)
    if not agent_wallet:
        return {"error": "No agent wallet found. Create one in Settings first."}

    # Get quote
    quote = get_swap_quote(from_token, to_token, amount)
    if "error" in quote:
        return {"error": quote["error"]}

    from_decimals = TOKENS[from_token]["decimals"]
    to_decimals = TOKENS[to_token]["decimals"]
    amount_in = int(Decimal(amount) * Decimal(10**from_decimals))
    min_out = int(
        Decimal(quote["amount_out"]) * (1 - Decimal(slippage) / 100) * Decimal(10**to_decimals)
    )
    deadline = w3.eth.get_block("latest")["timestamp"] + 300

    wallet = get_contract(agent_wallet, AGENT_WALLET_ABI)
    router_addr = Web3.to_checksum_address(settings.router_address)
    wpas = Web3.to_checksum_address(settings.wpas_address)

    if from_token == "PAS":
        # AgentWallet.executeCall(router, amountIn, swapExactETHForTokens calldata)
        to_addr = Web3.to_checksum_address(get_token_address(to_token))
        path = [wpas, to_addr]

        router = get_contract(router_addr, ROUTER_ABI)
        swap_data = router.functions.swapExactETHForTokens(
            min_out, path, Web3.to_checksum_address(agent_wallet), deadline
        )._encode_transaction_data()

        tx = wallet.functions.executeCall(
            router_addr, amount_in, bytes.fromhex(swap_data[2:])
        ).build_transaction({
            "from": _get_agent_account().address,
            "value": 0,
        })

    elif to_token == "PAS":
        from_addr = Web3.to_checksum_address(get_token_address(from_token))
        path = [from_addr, wpas]

        # First approve router
        approve_result = _approve_token_via_wallet(agent_wallet, from_addr, router_addr, amount_in)
        if "error" in approve_result:
            return approve_result

        router = get_contract(router_addr, ROUTER_ABI)
        swap_data = router.functions.swapExactTokensForETH(
            amount_in, min_out, path, Web3.to_checksum_address(agent_wallet), deadline
        )._encode_transaction_data()

        tx = wallet.functions.executeCall(
            router_addr, 0, bytes.fromhex(swap_data[2:])
        ).build_transaction({
            "from": _get_agent_account().address,
            "value": 0,
        })

    else:
        from_addr = Web3.to_checksum_address(get_token_address(from_token))
        to_addr = Web3.to_checksum_address(get_token_address(to_token))
        path = [from_addr, wpas, to_addr]

        approve_result = _approve_token_via_wallet(agent_wallet, from_addr, router_addr, amount_in)
        if "error" in approve_result:
            return approve_result

        router = get_contract(router_addr, ROUTER_ABI)
        swap_data = router.functions.swapExactTokensForTokens(
            amount_in, min_out, path, Web3.to_checksum_address(agent_wallet), deadline
        )._encode_transaction_data()

        tx = wallet.functions.executeCall(
            router_addr, 0, bytes.fromhex(swap_data[2:])
        ).build_transaction({
            "from": _get_agent_account().address,
            "value": 0,
        })

    try:
        tx_hash = _send_tx(tx)
        receipt = _wait_for_receipt(tx_hash)
        return {
            "success": receipt["status"] == "confirmed",
            "tx_hash": tx_hash,
            "description": f"Swapped {amount} {from_token} for ~{quote['amount_out']} {to_token}",
            "quote": quote,
            **receipt,
        }
    except Exception as e:
        logger.error(f"Autonomous swap failed: {e}", exc_info=True)
        return {"error": str(e)}


def execute_transfer_autonomous(
    user_address: str, token: str, to: str, amount: str
) -> dict:
    """Execute a transfer autonomously through the Agent Wallet."""
    agent_wallet = get_agent_wallet_address(user_address)
    if not agent_wallet:
        return {"error": "No agent wallet found. Create one in Settings first."}

    wallet = get_contract(agent_wallet, AGENT_WALLET_ABI)
    to_addr = Web3.to_checksum_address(to)

    if token == "PAS":
        amount_wei = int(Decimal(amount) * Decimal(10**18))
        tx = wallet.functions.executeCall(
            to_addr, amount_wei, b""
        ).build_transaction({
            "from": _get_agent_account().address,
            "value": 0,
        })
    else:
        token_addr = Web3.to_checksum_address(get_token_address(token))
        decimals = TOKENS[token]["decimals"]
        amount_raw = int(Decimal(amount) * Decimal(10**decimals))
        tx = wallet.functions.executeTokenTransfer(
            token_addr, to_addr, amount_raw
        ).build_transaction({
            "from": _get_agent_account().address,
            "value": 0,
        })

    try:
        tx_hash = _send_tx(tx)
        receipt = _wait_for_receipt(tx_hash)
        return {
            "success": receipt["status"] == "confirmed",
            "tx_hash": tx_hash,
            "description": f"Transferred {amount} {token} to {to[:10]}...",
            **receipt,
        }
    except Exception as e:
        logger.error(f"Autonomous transfer failed: {e}", exc_info=True)
        return {"error": str(e)}


def _approve_token_via_wallet(agent_wallet: str, token: str, spender: str, amount: int) -> dict:
    """Approve token spending via AgentWallet."""
    wallet = get_contract(agent_wallet, AGENT_WALLET_ABI)
    try:
        tx = wallet.functions.executeTokenApprove(
            Web3.to_checksum_address(token),
            Web3.to_checksum_address(spender),
            amount,
        ).build_transaction({
            "from": _get_agent_account().address,
            "value": 0,
        })
        tx_hash = _send_tx(tx)
        _wait_for_receipt(tx_hash)
        return {"success": True}
    except Exception as e:
        return {"error": f"Approval failed: {e}"}
