import json
from typing import AsyncIterator, List
from openai import AsyncOpenAI
from app.config import settings
from app.models.schemas import ChatMessage

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are Fintelligence, an elite AI financial advisor with access to the user's real transaction data.

Guidelines:
- Only reply for finance or related topics otherwise reply regargind you are supposed to only talk about finance
- Be concise, insightful, and specific with numbers
- Format currency in Indian Rupees (₹) unless told otherwise
- Identify spending patterns, anomalies, and opportunities proactively
- Give actionable recommendations, not generic advice
- Keep responses under 150 words unless detailed analysis is requested"""


def _build_messages(messages: List[ChatMessage], transactions_context: List[dict]) -> list:
    context_str = json.dumps(transactions_context, default=str) if transactions_context else "No transaction data available yet."
    system_content = f"{SYSTEM_PROMPT}\n\nCurrent transaction context:\n{context_str}"

    return [
        {"role": "system", "content": system_content},
        *[{"role": m.role, "content": m.content} for m in messages],
    ]


async def chat(messages: List[ChatMessage], transactions_context: List[dict]) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=_build_messages(messages, transactions_context),
        max_tokens=500,
        temperature=0.7,
    )

    return {
        "message": response.choices[0].message.content or "",
        "tokens_used": response.usage.total_tokens if response.usage else 0,
    }


async def stream_chat(
    messages: List[ChatMessage], transactions_context: List[dict]
) -> AsyncIterator[str]:
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=_build_messages(messages, transactions_context),
        max_tokens=500,
        temperature=0.7,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
