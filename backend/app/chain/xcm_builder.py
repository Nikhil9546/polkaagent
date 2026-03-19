"""Build SCALE-encoded XCM messages for real cross-chain transfers.

Tested and verified on Polkadot Hub TestNet:
- TX 0xed038b52... — 0.15 PAS transfer confirmed on-chain
- Minimum amount: ~0.1074 PAS (execution fee requirement)
"""
import logging
from web3 import Web3
from ..config import get_settings
from .client import w3

logger = logging.getLogger(__name__)
settings = get_settings()

XCM_PRECOMPILE = "0x00000000000000000000000000000000000a0000"

XCM_ABI = [
    {"inputs": [{"name": "message", "type": "bytes"}, {"name": "weight", "type": "tuple", "components": [{"name": "refTime", "type": "uint64"}, {"name": "proofSize", "type": "uint64"}]}], "name": "execute", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"name": "message", "type": "bytes"}], "name": "weighMessage", "outputs": [{"name": "weight", "type": "tuple", "components": [{"name": "refTime", "type": "uint64"}, {"name": "proofSize", "type": "uint64"}]}], "stateMutability": "view", "type": "function"},
]

# Working template from Polkadot docs (verified on-chain)
WORKING_TEMPLATE = bytes.fromhex(
    "050c000401000003008c86471301000003008c8647"
    "000d010101000000010100"
    "368e8759910dab756d344995f1d3c79374ca8f70066d3a709e48029f6bf0ee7e"
)

# Minimum XCM transfer: ~0.1074 PAS (execution fee requirement)
MIN_AMOUNT_PLANCK = 1_080_000_000


def _evm_to_account32(evm_address: str) -> bytes:
    """Convert EVM address to 32-byte account ID."""
    return b'\x00' * 12 + bytes.fromhex(evm_address.replace("0x", ""))


def build_xcm_transfer(amount_planck: int, beneficiary_evm: str) -> bytes:
    """
    Build XCM V5 message by modifying the verified working template.

    Replaces:
    - bytes [8:12]  — WithdrawAsset amount (LE u32)
    - bytes [17:21] — BuyExecution amount (LE u32, same as withdraw to meet minimum)
    - bytes [32:64] — Beneficiary account (32 bytes)
    """
    if amount_planck < MIN_AMOUNT_PLANCK:
        raise ValueError(f"Amount {amount_planck} below minimum {MIN_AMOUNT_PLANCK} planck (~0.108 PAS)")

    account_id = _evm_to_account32(beneficiary_evm)
    le_amount = amount_planck.to_bytes(4, 'little')

    msg = bytearray(WORKING_TEMPLATE)
    msg[8:12] = le_amount    # WithdrawAsset amount
    msg[17:21] = le_amount   # BuyExecution amount (same to meet minimum)
    msg[32:64] = account_id  # Beneficiary

    return bytes(msg)


def execute_real_xcm_transfer(
    amount_pas: float,
    beneficiary: str,
    dest_para_id: int = 1000,
    private_key: str = "",
) -> dict:
    """Execute a real XCM transfer with custom amount and beneficiary."""
    if not private_key:
        private_key = settings.agent_private_key

    # Convert to planck (10 decimals for XCM)
    amount_planck = int(amount_pas * 10**10)

    # Enforce minimum
    if amount_planck < MIN_AMOUNT_PLANCK:
        return {"error": f"Minimum XCM transfer is ~0.108 PAS. You requested {amount_pas} PAS."}

    if not beneficiary:
        beneficiary = w3.eth.account.from_key(private_key).address

    logger.info(f"XCM Transfer: {amount_pas} PAS ({amount_planck} planck) to {beneficiary}")

    # Build message
    try:
        xcm_message = build_xcm_transfer(amount_planck, beneficiary)
    except ValueError as e:
        return {"error": str(e)}

    logger.info(f"XCM message ({len(xcm_message)} bytes): 0x{xcm_message.hex()}")

    # Verify with weighMessage
    xcm_contract = w3.eth.contract(
        address=Web3.to_checksum_address(XCM_PRECOMPILE),
        abi=XCM_ABI,
    )

    try:
        weight = xcm_contract.functions.weighMessage(xcm_message).call()
        ref_time, proof_size = weight[0], weight[1]
        logger.info(f"Weight OK: refTime={ref_time}, proofSize={proof_size}")
    except Exception as e:
        return {"error": f"XCM message validation failed: {str(e)}"}

    # Execute
    try:
        account = w3.eth.account.from_key(private_key)
        tx = xcm_contract.functions.execute(
            xcm_message, (ref_time, proof_size)
        ).build_transaction({
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 500000,
            "maxFeePerGas": w3.eth.gas_price * 2,
            "maxPriorityFeePerGas": w3.eth.gas_price,
            "chainId": settings.chain_id,
        })

        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

        return {
            "success": receipt["status"] == 1,
            "tx_hash": tx_hash.hex(),
            "block_number": receipt["blockNumber"],
            "gas_used": receipt["gasUsed"],
            "xcm_weight": {"ref_time": ref_time, "proof_size": proof_size},
            "transfer": {
                "amount_pas": amount_pas,
                "amount_planck": amount_planck,
                "beneficiary": beneficiary,
                "dest_parachain": dest_para_id,
            },
            "description": f"XCM: Transferred {amount_pas} PAS to {beneficiary[:10]}... via cross-chain message",
        }
    except Exception as e:
        logger.error(f"XCM execute failed: {e}", exc_info=True)
        return {"error": str(e)}
