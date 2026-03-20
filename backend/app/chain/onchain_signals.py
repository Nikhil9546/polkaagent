"""On-chain signal classifier — reads signals computed ON Polkadot Hub's execution environment.

This is architecturally unique to Polkadot because:
1. Signal classification runs ON-CHAIN (not just off-chain AI)
2. The contract can be compiled to PVM via Revive for PolkaVM execution
3. Uses Polkadot Hub's dual EVM+PVM environment
4. Can access cross-chain state via XCM precompiles
"""
import logging
from web3 import Web3
from ..config import get_settings
from .client import w3, load_abi

logger = logging.getLogger(__name__)
settings = get_settings()

# Load ABI from backend/abi/ (works on Railway)
_SIGNAL_CLASSIFIER_ABI_LOADED = load_abi("SignalClassifier")

SIGNAL_CLASSIFIER_ADDRESS = "0xA13d5b9A1676a9f630A593B1f45A369765622934"

SIGNAL_CLASSIFIER_ABI = _SIGNAL_CLASSIFIER_ABI_LOADED if _SIGNAL_CLASSIFIER_ABI_LOADED else [
    {"inputs": [{"name": "pair", "type": "address"}], "name": "analyzePair", "outputs": [{"components": [{"name": "signalType", "type": "uint8"}, {"name": "strength", "type": "uint8"}, {"name": "score", "type": "uint256"}, {"name": "timestamp", "type": "uint256"}], "name": "", "type": "tuple"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"name": "pairs", "type": "address[]"}], "name": "analyzeMultiplePairs", "outputs": [{"components": [{"name": "signalType", "type": "uint8"}, {"name": "strength", "type": "uint8"}, {"name": "score", "type": "uint256"}, {"name": "timestamp", "type": "uint256"}], "name": "", "type": "tuple[]"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"name": "pair", "type": "address"}], "name": "getLatestSignal", "outputs": [{"components": [{"name": "signalType", "type": "uint8"}, {"name": "strength", "type": "uint8"}, {"name": "score", "type": "uint256"}, {"name": "timestamp", "type": "uint256"}], "name": "", "type": "tuple"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"name": "pairA", "type": "address"}, {"name": "pairB", "type": "address"}], "name": "detectArbitrage", "outputs": [{"name": "hasArbitrage", "type": "bool"}, {"name": "spreadBps", "type": "uint256"}, {"name": "buyA", "type": "bool"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"name": "pair", "type": "address"}], "name": "getSignalCount", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"name": "pair", "type": "address"}], "name": "lastPoolState", "outputs": [{"name": "reserve0", "type": "uint112"}, {"name": "reserve1", "type": "uint112"}, {"name": "totalSupply", "type": "uint256"}, {"name": "price0", "type": "uint256"}, {"name": "price1", "type": "uint256"}, {"name": "imbalanceRatio", "type": "uint256"}], "stateMutability": "view", "type": "function"},
]

SIGNAL_TYPES = {0: "HOLD", 1: "BUY", 2: "SELL", 3: "ALERT"}
STRENGTH_LEVELS = {0: "WEAK", 1: "MODERATE", 2: "STRONG"}

# Known pairs
PAIRS = {
    "PAS/USDT": "0x4C2aDfFbC22A4ab243D7D51b873f0b1A3444D70A",
    "PAS/USDC": "0x59f814Ac2964f353177E0199Ab9dfc499543bcEE",
}


def get_classifier():
    return w3.eth.contract(
        address=Web3.to_checksum_address(SIGNAL_CLASSIFIER_ADDRESS),
        abi=SIGNAL_CLASSIFIER_ABI,
    )


def run_onchain_analysis(private_key: str = "") -> dict:
    """Run on-chain signal analysis by calling the SignalClassifier contract."""
    if not private_key:
        private_key = settings.agent_private_key

    classifier = get_classifier()
    account = w3.eth.account.from_key(private_key)
    results = {}

    for pair_name, pair_addr in PAIRS.items():
        try:
            # Send transaction to analyze pair on-chain
            tx = classifier.functions.analyzePair(
                Web3.to_checksum_address(pair_addr)
            ).build_transaction({
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address),
                "gas": 300000,
                "maxFeePerGas": w3.eth.gas_price * 2,
                "maxPriorityFeePerGas": w3.eth.gas_price,
                "chainId": settings.chain_id,
            })

            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

            # Read the signal
            signal = classifier.functions.getLatestSignal(
                Web3.to_checksum_address(pair_addr)
            ).call()

            results[pair_name] = {
                "signal_type": SIGNAL_TYPES.get(signal[0], "UNKNOWN"),
                "strength": STRENGTH_LEVELS.get(signal[1], "UNKNOWN"),
                "score": signal[2],
                "timestamp": signal[3],
                "tx_hash": tx_hash.hex(),
                "gas_used": receipt["gasUsed"],
                "computed_on_chain": True,
                "contract": SIGNAL_CLASSIFIER_ADDRESS,
            }
        except Exception as e:
            logger.error(f"On-chain analysis failed for {pair_name}: {e}")
            results[pair_name] = {"error": str(e)}

    # Check arbitrage between pairs
    try:
        arb = classifier.functions.detectArbitrage(
            Web3.to_checksum_address(PAIRS["PAS/USDT"]),
            Web3.to_checksum_address(PAIRS["PAS/USDC"]),
        ).call()
        results["arbitrage"] = {
            "detected": arb[0],
            "spread_bps": arb[1],
            "buy_first_pair": arb[2],
            "computed_on_chain": True,
        }
    except Exception as e:
        results["arbitrage"] = {"error": str(e)}

    return {
        "classifier_contract": SIGNAL_CLASSIFIER_ADDRESS,
        "execution_environment": "Polkadot Hub EVM (PVM-compatible)",
        "pairs_analyzed": len(PAIRS),
        "results": results,
    }


def read_onchain_signals() -> dict:
    """Read the latest on-chain signals without triggering new analysis."""
    classifier = get_classifier()
    results = {}

    for pair_name, pair_addr in PAIRS.items():
        try:
            signal = classifier.functions.getLatestSignal(
                Web3.to_checksum_address(pair_addr)
            ).call()
            count = classifier.functions.getSignalCount(
                Web3.to_checksum_address(pair_addr)
            ).call()
            state = classifier.functions.lastPoolState(
                Web3.to_checksum_address(pair_addr)
            ).call()

            results[pair_name] = {
                "signal_type": SIGNAL_TYPES.get(signal[0], "UNKNOWN"),
                "strength": STRENGTH_LEVELS.get(signal[1], "UNKNOWN"),
                "score": signal[2],
                "timestamp": signal[3],
                "total_signals": count,
                "pool_state": {
                    "reserve0": str(state[0]),
                    "reserve1": str(state[1]),
                    "price": str(state[3]),
                    "imbalance_bps": str(state[5]),
                },
                "computed_on_chain": True,
            }
        except Exception as e:
            results[pair_name] = {"error": str(e)}

    return {
        "classifier_contract": SIGNAL_CLASSIFIER_ADDRESS,
        "results": results,
    }
