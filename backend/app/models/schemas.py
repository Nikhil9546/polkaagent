from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ActionType(str, Enum):
    TRANSFER = "transfer"
    SWAP = "swap"
    ADD_LIQUIDITY = "add_liquidity"
    REMOVE_LIQUIDITY = "remove_liquidity"
    CHECK_BALANCE = "check_balance"
    GET_QUOTE = "get_quote"
    PORTFOLIO = "portfolio"
    GET_SIGNALS = "get_signals"
    AUTO_TRADE = "auto_trade"


class ChatRequest(BaseModel):
    message: str
    wallet_address: str


class TransferParams(BaseModel):
    token: str
    to: str
    amount: str


class SwapParams(BaseModel):
    from_token: str
    to_token: str
    amount: str
    slippage: str = "0.5"


class AddLiquidityParams(BaseModel):
    token_a: str
    token_b: str
    amount_a: str
    amount_b: str


class RemoveLiquidityParams(BaseModel):
    token: str
    liquidity_percent: str = "100"


class BalanceParams(BaseModel):
    token: str = "ALL"


class ActionPlan(BaseModel):
    action: ActionType
    params: dict
    explanation: str


class ChatResponse(BaseModel):
    message: str
    actions: list[ActionPlan] = []
    portfolio: Optional[dict] = None


class TransactionRequest(BaseModel):
    action: ActionType
    params: dict
    wallet_address: str


class TransactionResponse(BaseModel):
    to: str
    data: str
    value: str
    gas_estimate: str
    description: str


class ExecuteResponse(BaseModel):
    transactions: list[TransactionResponse]
    total_gas: str


class TokenBalance(BaseModel):
    wallet: str = "0"
    agent_wallet: str = "0"


class PortfolioResponse(BaseModel):
    native_balance: str
    token_balances: dict[str, TokenBalance]
    lp_positions: list[dict] = []
    total_value_usd: str = "0"
    agent_wallet_address: Optional[str] = None


class QuoteResponse(BaseModel):
    amount_in: str
    amount_out: str
    price_impact: str
    route: list[str]
    minimum_received: str
