import json
import os
from pathlib import Path
from web3 import Web3, AsyncWeb3
from web3.middleware import ExtraDataToPOAMiddleware
from ..config import get_settings

settings = get_settings()

# Synchronous client
w3 = Web3(Web3.HTTPProvider(settings.rpc_url))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

# Load ABIs from compiled contracts
CONTRACTS_DIR = Path(__file__).parent.parent.parent.parent / "contracts" / "out"


def load_abi(contract_name: str) -> list:
    abi_path = CONTRACTS_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    if abi_path.exists():
        with open(abi_path) as f:
            artifact = json.load(f)
            return artifact["abi"]
    return []


# Contract ABIs
AGENT_WALLET_ABI = load_abi("AgentWallet")
WALLET_FACTORY_ABI = load_abi("AgentWalletFactory")
INTENT_EXECUTOR_ABI = load_abi("IntentExecutor")
ERC20_ABI = load_abi("MockToken")
WPAS_ABI = load_abi("WPAS")

# Minimal ERC20 ABI fallback
MINIMAL_ERC20_ABI = [
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"},
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]

# Uniswap V2 Router ABI (minimal)
ROUTER_ABI = [
    {
        "inputs": [
            {"name": "amountIn", "type": "uint256"},
            {"name": "path", "type": "address[]"},
        ],
        "name": "getAmountsOut",
        "outputs": [{"name": "amounts", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "WETH",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "pure",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "factory",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "pure",
        "type": "function",
    },
]

FACTORY_ABI = [
    {
        "inputs": [
            {"name": "tokenA", "type": "address"},
            {"name": "tokenB", "type": "address"},
        ],
        "name": "getPair",
        "outputs": [{"name": "pair", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
]

PAIR_ABI = [
    {
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            {"name": "reserve0", "type": "uint112"},
            {"name": "reserve1", "type": "uint112"},
            {"name": "blockTimestampLast", "type": "uint32"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "token0",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "token1",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]


def get_contract(address: str, abi: list):
    return w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)


def get_token_contract(address: str):
    abi = ERC20_ABI if ERC20_ABI else MINIMAL_ERC20_ABI
    return get_contract(address, abi)
