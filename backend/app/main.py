import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.chat import router as chat_router
from .api.portfolio import router as portfolio_router
from .api.execute import router as execute_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="PolkaAgent API",
    description="AI-powered DeFi agent for Polkadot Hub",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(portfolio_router, prefix="/api", tags=["Portfolio"])
app.include_router(execute_router, prefix="/api", tags=["Execute"])


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
