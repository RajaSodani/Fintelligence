from pydantic import BaseModel
from typing import List, Literal


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    transactions_context: List[dict] = []


class ChatResponse(BaseModel):
    message: str
    tokens_used: int


class MonthlyData(BaseModel):
    month: str
    income: float
    expenses: float


class CashflowRequest(BaseModel):
    monthly_data: List[MonthlyData]


class PredictedMonth(BaseModel):
    month: str
    income: float
    expenses: float
    net: float


class CashflowResponse(BaseModel):
    prediction: List[PredictedMonth]
    confidence: float
    trend: Literal["improving", "declining", "stable"]
