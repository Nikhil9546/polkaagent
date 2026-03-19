import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.chat import router as chat_router
from .api.portfolio import router as portfolio_router
from .api.execute import router as execute_router
from .api.signals import router as signals_router
from .api.autotrade import router as autotrade_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="PolkaAgent API",
    description="AI-powered DeFi agent for Polkadot Hub",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(portfolio_router, prefix="/api", tags=["Portfolio"])
app.include_router(execute_router, prefix="/api", tags=["Execute"])
app.include_router(signals_router, prefix="/api", tags=["Signals"])
app.include_router(autotrade_router, prefix="/api", tags=["AutoTrade"])


@app.get("/")
async def root():
    return {
        "name": "PolkaAgent API",
        "version": "1.0.0",
        "network": "Polkadot Hub TestNet",
        "chain_id": 420420417,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/debug/config")
async def debug_config():
    from .config import get_settings
    from .chain.client import WALLET_FACTORY_ABI, AGENT_WALLET_ABI, ROUTER_ABI
    s = get_settings()
    return {
        "wallet_factory": s.wallet_factory_address,
        "router": s.router_address,
        "wpas": s.wpas_address,
        "usdt": s.usdt_address,
        "usdc": s.usdc_address,
        "factory": s.factory_address,
        "intent_executor": s.intent_executor_address,
        "rpc": s.rpc_url,
        "chain_id": s.chain_id,
        "has_deepseek": bool(s.deepseek_api_key),
        "has_agent_key": bool(s.agent_private_key),
        "abi_sizes": {
            "wallet_factory": len(WALLET_FACTORY_ABI),
            "agent_wallet": len(AGENT_WALLET_ABI),
            "router": len(ROUTER_ABI),
        },
    }
