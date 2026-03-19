import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    deepseek_api_key: str = ""
    agent_private_key: str = ""
    rpc_url: str = "https://eth-rpc-testnet.polkadot.io/"
    chain_id: int = 420420417

    # Contract addresses
    wallet_factory_address: str = ""
    intent_executor_address: str = ""
    wpas_address: str = ""
    usdt_address: str = ""
    usdc_address: str = ""
    router_address: str = ""
    factory_address: str = ""

    # DeepSeek
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"


@lru_cache()
def get_settings():
    s = Settings()
    # Log what we got (helps debug Railway)
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Config loaded: wallet_factory={s.wallet_factory_address[:10] if s.wallet_factory_address else 'EMPTY'}...")
    logger.info(f"Config loaded: router={s.router_address[:10] if s.router_address else 'EMPTY'}...")
    logger.info(f"Config loaded: rpc={s.rpc_url}")
    return s


# Token metadata
TOKENS = {
    "PAS": {"symbol": "PAS", "decimals": 18, "is_native": True},
    "WPAS": {"symbol": "WPAS", "decimals": 18, "is_native": False},
    "USDT": {"symbol": "USDT", "decimals": 6, "is_native": False},
    "USDC": {"symbol": "USDC", "decimals": 6, "is_native": False},
}
