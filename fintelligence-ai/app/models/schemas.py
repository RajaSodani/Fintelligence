from pydantic import BaseModel
from typing import Any, Dict, List, Literal, Optional


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


# ── Research ────────────────────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    ticker: str


class NewsHeadline(BaseModel):
    title: str
    source: str
    sentiment: Literal["green", "amber", "red", "blue"]
    time: str
    url: Optional[str] = None
    description: Optional[str] = None


class NewsData(BaseModel):
    headlines: List[NewsHeadline]
    summary: str
    result_label: str


class FinancialMetric(BaseModel):
    label: str
    value: str


class FinancialsData(BaseModel):
    company_name: str
    sector: str
    exchange: str
    snapshot: List[FinancialMetric]
    result_label: str


class SentimentScore(BaseModel):
    label: str
    score: int


class SentimentData(BaseModel):
    scores: List[SentimentScore]
    overall: Literal["bullish", "bearish", "neutral"]
    summary: str
    result_label: str


class RiskItem(BaseModel):
    text: str
    severity: Literal["amber", "red"]


class ThesisData(BaseModel):
    rating: str
    target_price: str
    summary: str
    risks: List[RiskItem]
    verdict: str
    result_label: str


class ResearchReport(BaseModel):
    ticker: str
    news_data: Optional[NewsData] = None
    financials_data: Optional[FinancialsData] = None
    sentiment_data: Optional[SentimentData] = None
    thesis_data: Optional[ThesisData] = None
