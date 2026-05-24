import json
from typing import AsyncIterator, List
from openai import AsyncOpenAI
from app.config import settings
from app.models.schemas import ChatMessage

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

TRANSACTIONS_SYSTEM_PROMPT = """You are Fintelligence, an elite AI financial advisor with access to the user's real transaction data.

Guidelines:
- Only reply for finance or related topics; for anything else, remind the user you are a financial AI
- Be concise, insightful, and specific with numbers
- Format currency in Indian Rupees (₹) unless told otherwise
- Identify spending patterns, anomalies, and opportunities proactively
- Give actionable recommendations, not generic advice
- Keep responses under 150 words unless detailed analysis is requested"""

STOCK_RESEARCH_SYSTEM_PROMPT = """You are Fintelligence Research AI, a senior equity analyst specializing in Indian and global stocks.

You have just completed a deep research report on a specific stock. Your role is to answer questions about:
- The stock's financials, valuation, and fundamental quality
- Technical levels, support/resistance, and price targets
- Recent news, catalysts, and risk factors
- Entry/exit strategies, position sizing, and risk management

Guidelines:
- Be specific — always reference actual numbers from the research data provided
- Use ₹ for INR-denominated stocks, $ for USD
- Keep responses concise (under 200 words) unless a detailed breakdown is requested
- Do not give advice on unrelated topics
- If asked about something not in the research data, clearly state you don't have that information"""


def _build_messages(messages: List[ChatMessage], context: List[dict], context_type: str = "transactions") -> list:
    system_prompt = STOCK_RESEARCH_SYSTEM_PROMPT if context_type == "stock_research" else TRANSACTIONS_SYSTEM_PROMPT
    context_str = json.dumps(context, default=str) if context else "No context data available."
    label = "Research data" if context_type == "stock_research" else "Transaction context"
    system_content = f"{system_prompt}\n\n{label}:\n{context_str}"

    return [
        {"role": "system", "content": system_content},
        *[{"role": m.role, "content": m.content} for m in messages],
    ]


async def chat(messages: List[ChatMessage], transactions_context: List[dict], context_type: str = "transactions") -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=_build_messages(messages, transactions_context, context_type),
        max_tokens=500,
        temperature=0.7,
    )

    return {
        "message": response.choices[0].message.content or "",
        "tokens_used": response.usage.total_tokens if response.usage else 0,
    }


async def stream_chat(
    messages: List[ChatMessage], transactions_context: List[dict], context_type: str = "transactions"
) -> AsyncIterator[str]:
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=_build_messages(messages, transactions_context, context_type),
        max_tokens=500,
        temperature=0.7,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
