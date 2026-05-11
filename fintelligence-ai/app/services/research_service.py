import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Annotated, AsyncGenerator, List, Optional, TypedDict
import operator

import yfinance as yf
from openai import AsyncOpenAI
from langgraph.graph import StateGraph, START, END

from app.config import settings

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
_executor = ThreadPoolExecutor(max_workers=6)


# ── State ────────────────────────────────────────────────────────────────────

class ResearchState(TypedDict):
    ticker: str
    news_data: Optional[dict]
    financials_data: Optional[dict]
    sentiment_data: Optional[dict]
    thesis_data: Optional[dict]
    errors: Annotated[List[str], operator.add]


# ── Ticker resolution ─────────────────────────────────────────────────────────

def _resolve_ticker_sync(raw: str) -> tuple[str, object]:
    """Try <RAW>.NS → <RAW>.BO → <RAW> bare. Returns (resolved, Ticker)."""
    upper = raw.upper()
    if "." in upper:
        return upper, yf.Ticker(upper)

    for candidate in (upper + ".NS", upper + ".BO", upper):
        t = yf.Ticker(candidate)
        info = t.info
        if info.get("currentPrice") or info.get("regularMarketPrice"):
            return candidate, t

    return upper, yf.Ticker(upper)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _relative_time(utc_str: str) -> str:
    if not utc_str:
        return "recently"
    try:
        dt = datetime.fromisoformat(utc_str.replace("Z", "+00:00"))
        diff = datetime.now(timezone.utc) - dt
        hours = int(diff.total_seconds() / 3600)
        if hours < 1:
            return "just now"
        if hours < 24:
            return f"{hours}h ago"
        return f"{hours // 24}d ago"
    except Exception:
        return "recently"


def _fmt_price(value: float, currency: str) -> str:
    symbol = "₹" if currency == "INR" else "$"
    return f"{symbol}{value:,.2f}"


def _fmt_market_cap(value: float, currency: str) -> str:
    if currency == "INR":
        crore = value / 1e7
        if crore >= 1e5:
            return f"₹{crore / 1e5:.1f}L Cr"
        if crore >= 1e3:
            return f"₹{crore / 1e3:.0f}K Cr"
        return f"₹{crore:.0f} Cr"
    if value >= 1e12:
        return f"${value / 1e12:.1f}T"
    if value >= 1e9:
        return f"${value / 1e9:.1f}B"
    return f"${value / 1e6:.0f}M"


def _fmt_pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def _fmt_ratio(value: float) -> str:
    return f"{value:.1f}×"


def _news_sentiment(title: str) -> str:
    title_lower = title.lower()
    bullish = {"surge", "beat", "profit", "growth", "rise", "gain", "strong",
               "upgrade", "record", "rally", "buy", "soar", "jump", "boost"}
    bearish = {"fall", "drop", "loss", "decline", "risk", "warn", "cut",
               "downgrade", "miss", "slump", "sell", "plunge", "crash", "concern"}
    if any(w in title_lower for w in bullish):
        return "green"
    if any(w in title_lower for w in bearish):
        return "red"
    return "blue"


def _parse_json_safe(text: str) -> dict:
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return {}


# ── Agent implementations ─────────────────────────────────────────────────────

def _fetch_news_sync(raw: str) -> dict:
    resolved, ticker_obj = _resolve_ticker_sync(raw)
    raw_news = ticker_obj.news or []

    headlines = []
    for article in raw_news[:10]:
        content = article.get("content", {})
        title = content.get("title", "")
        pub_date = content.get("pubDate", "")
        publisher = content.get("provider", {}).get("displayName", "")
        url = content.get("canonicalUrl", {}).get("url", "") if isinstance(content.get("canonicalUrl"), dict) else ""

        if not title:
            continue

        headlines.append({
            "title": title,
            "source": publisher,
            "sentiment": _news_sentiment(title),
            "time": _relative_time(pub_date),
            "url": url,
            "description": content.get("summary", ""),
        })

    count = len(headlines)
    result_label = f"{count} articles fetched · Awaiting sentiment analysis"

    return {
        "headlines": headlines,
        "summary": " | ".join(h["title"] for h in headlines[:3]) or "No recent news.",
        "result_label": result_label,
        "resolved_ticker": resolved,
    }


def _fetch_financials_sync(raw: str) -> dict:
    resolved, ticker_obj = _resolve_ticker_sync(raw)
    info = ticker_obj.info or {}

    currency = info.get("currency", "USD")
    current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
    market_cap = info.get("marketCap") or 0
    trailing_pe = info.get("trailingPE")
    price_to_book = info.get("priceToBook")
    roe = info.get("returnOnEquity")
    gross_margins = info.get("grossMargins")
    revenue_growth = info.get("revenueGrowth")
    week_high = info.get("fiftyTwoWeekHigh")
    week_low = info.get("fiftyTwoWeekLow")
    volume = info.get("volume") or 0
    day_high = info.get("dayHigh") or 0
    day_low = info.get("dayLow") or 0

    def _val(v, formatter):
        return formatter(v) if v is not None else "N/A"

    snapshot = [
        {"label": "Price",      "value": _fmt_price(current_price, currency) if current_price else "N/A"},
        {"label": "Market Cap", "value": _fmt_market_cap(market_cap, currency) if market_cap else "N/A"},
        {"label": "P/E Ratio",  "value": _val(trailing_pe, _fmt_ratio)},
        {"label": "P/B Ratio",  "value": _val(price_to_book, _fmt_ratio)},
        {"label": "ROE",        "value": _val(roe, _fmt_pct)},
        {"label": "Gross Margin","value": _val(gross_margins, _fmt_pct)},
    ]

    price_label = _fmt_price(current_price, currency) if current_price else "N/A"
    cap_label = _fmt_market_cap(market_cap, currency) if market_cap else "N/A"

    raw_summary = (
        f"Ticker: {resolved}, Company: {info.get('longName', raw)}, "
        f"Sector: {info.get('sector', 'N/A')}, Industry: {info.get('industry', 'N/A')}, "
        f"Currency: {currency}, Price: {current_price}, Market Cap: {market_cap}, "
        f"PE: {trailing_pe}, PB: {price_to_book}, ROE: {roe}, "
        f"Gross Margin: {gross_margins}, Revenue Growth: {revenue_growth}, "
        f"52w High: {week_high}, 52w Low: {week_low}, "
        f"Volume: {volume}, Day High: {day_high}, Day Low: {day_low}"
    )

    return {
        "company_name": info.get("longName") or info.get("shortName") or raw,
        "sector": info.get("sector") or info.get("industry") or "Equity",
        "exchange": info.get("exchange") or (resolved.split(".")[-1] if "." in resolved else "N/A"),
        "snapshot": snapshot,
        "result_label": f"Price {price_label} · Mkt Cap {cap_label}",
        "raw_summary": raw_summary,
        "resolved_ticker": resolved,
    }


async def _run_news_agent(ticker: str) -> dict:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, _fetch_news_sync, ticker)


async def _run_financials_agent(ticker: str) -> dict:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, _fetch_financials_sync, ticker)


async def _run_sentiment_agent(ticker: str, news_data: dict, financials_data: dict) -> dict:
    news_headlines = "\n".join(
        f"- {h['title']} ({h['source']})"
        for h in (news_data.get("headlines") or [])[:6]
    ) or "No news available."

    fin_summary = financials_data.get("raw_summary", "No financial data.")

    prompt = (
        f"Analyze market sentiment for {ticker}.\n\n"
        f"Recent news:\n{news_headlines}\n\n"
        f"Financial data: {fin_summary}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '  "scores": [\n'
        '    {"label": "News Sentiment", "score": <0-100>},\n'
        '    {"label": "Social Sentiment", "score": <0-100>},\n'
        '    {"label": "Analyst Consensus", "score": <0-100>},\n'
        '    {"label": "Options Flow", "score": <0-100>}\n'
        "  ],\n"
        '  "overall": "<bullish|bearish|neutral>",\n'
        '  "summary": "<one concise sentence summarising the sentiment>"\n'
        "}"
    )

    response = await _client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a financial sentiment analyst. Respond only with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=256,
    )

    parsed = _parse_json_safe(response.choices[0].message.content or "{}")

    scores = parsed.get("scores") or [
        {"label": "News Sentiment",    "score": 50},
        {"label": "Social Sentiment",  "score": 50},
        {"label": "Analyst Consensus", "score": 50},
        {"label": "Options Flow",      "score": 50},
    ]
    overall = parsed.get("overall", "neutral")
    summary = parsed.get("summary", "Sentiment analysis complete.")

    top_score = max((s.get("score", 0) for s in scores), default=50)

    return {
        "scores": scores,
        "overall": overall,
        "summary": summary,
        "result_label": f"Overall: {overall.capitalize()} · Top score: {top_score}/100",
    }


async def _run_thesis_agent(
    ticker: str,
    news_data: dict,
    financials_data: dict,
    sentiment_data: dict,
) -> dict:
    news_headlines = "\n".join(
        f"- {h['title']}"
        for h in (news_data.get("headlines") or [])[:6]
    ) or "No news."

    fin_summary = financials_data.get("raw_summary", "No financials.")
    sentiment_summary = (
        f"Overall: {sentiment_data.get('overall', 'neutral')}. "
        f"{sentiment_data.get('summary', '')}"
    )

    prompt = (
        f"Generate a concise investment thesis for {ticker}.\n\n"
        f"News:\n{news_headlines}\n\n"
        f"Financials: {fin_summary}\n\n"
        f"Sentiment: {sentiment_summary}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '  "rating": "<STRONG BUY|BUY|HOLD|SELL|STRONG SELL>",\n'
        '  "target_price": "<e.g. ₹900 or $195>",\n'
        '  "summary": "<2-3 sentence executive summary>",\n'
        '  "risks": [\n'
        '    {"text": "<risk description>", "severity": "<amber|red>"}\n'
        "  ],\n"
        '  "verdict": "<1-2 sentence actionable verdict with entry, target, and stop-loss>"\n'
        "}\n"
        "Use ₹ for INR stocks and $ for USD. Generate 2-4 risks."
    )

    response = await _client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a senior equity analyst. Respond only with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=512,
    )

    parsed = _parse_json_safe(response.choices[0].message.content or "{}")

    rating = parsed.get("rating", "HOLD")
    target_price = parsed.get("target_price", "N/A")
    summary = parsed.get("summary", "Analysis complete.")
    risks = parsed.get("risks") or [{"text": "Market uncertainty", "severity": "amber"}]
    verdict = parsed.get("verdict", "Exercise caution and monitor closely.")

    return {
        "rating": rating,
        "target_price": target_price,
        "summary": summary,
        "risks": risks,
        "verdict": verdict,
        "result_label": f"{rating} · Target {target_price}",
    }


# ── LangGraph nodes ───────────────────────────────────────────────────────────

def _make_news_node(queue: asyncio.Queue):
    async def node(state: ResearchState) -> dict:
        await queue.put({"type": "agent_start", "agent": "news"})
        try:
            result = await _run_news_agent(state["ticker"])
            await queue.put({"type": "agent_done", "agent": "news", "data": result})
            return {"news_data": result, "errors": []}
        except Exception as exc:
            err = f"News agent: {exc}"
            await queue.put({"type": "agent_error", "agent": "news", "error": err})
            return {"news_data": {"headlines": [], "summary": err, "result_label": "Failed"}, "errors": [err]}
    return node


def _make_financials_node(queue: asyncio.Queue):
    async def node(state: ResearchState) -> dict:
        await queue.put({"type": "agent_start", "agent": "financials"})
        try:
            result = await _run_financials_agent(state["ticker"])
            await queue.put({"type": "agent_done", "agent": "financials", "data": result})
            return {"financials_data": result, "errors": []}
        except Exception as exc:
            err = f"Financials agent: {exc}"
            await queue.put({"type": "agent_error", "agent": "financials", "error": err})
            return {
                "financials_data": {
                    "company_name": state["ticker"], "sector": "N/A", "exchange": "N/A",
                    "snapshot": [], "result_label": "Failed", "raw_summary": err,
                },
                "errors": [err],
            }
    return node


def _make_sentiment_node(queue: asyncio.Queue):
    async def node(state: ResearchState) -> dict:
        await queue.put({"type": "agent_start", "agent": "sentiment"})
        try:
            result = await _run_sentiment_agent(
                state["ticker"],
                state.get("news_data") or {},
                state.get("financials_data") or {},
            )
            await queue.put({"type": "agent_done", "agent": "sentiment", "data": result})
            return {"sentiment_data": result, "errors": []}
        except Exception as exc:
            err = f"Sentiment agent: {exc}"
            await queue.put({"type": "agent_error", "agent": "sentiment", "error": err})
            return {
                "sentiment_data": {
                    "scores": [], "overall": "neutral",
                    "summary": err, "result_label": "Failed",
                },
                "errors": [err],
            }
    return node


def _make_thesis_node(queue: asyncio.Queue):
    async def node(state: ResearchState) -> dict:
        await queue.put({"type": "agent_start", "agent": "thesis"})
        try:
            result = await _run_thesis_agent(
                state["ticker"],
                state.get("news_data") or {},
                state.get("financials_data") or {},
                state.get("sentiment_data") or {},
            )
            await queue.put({"type": "agent_done", "agent": "thesis", "data": result})
            return {"thesis_data": result, "errors": []}
        except Exception as exc:
            err = f"Thesis agent: {exc}"
            await queue.put({"type": "agent_error", "agent": "thesis", "error": err})
            return {
                "thesis_data": {
                    "rating": "HOLD", "target_price": "N/A",
                    "summary": err, "risks": [], "verdict": err, "result_label": "Failed",
                },
                "errors": [err],
            }
    return node


def _build_graph(queue: asyncio.Queue):
    workflow = StateGraph(ResearchState)

    workflow.add_node("news_agent",       _make_news_node(queue))
    workflow.add_node("financials_agent", _make_financials_node(queue))
    workflow.add_node("sentiment_agent",  _make_sentiment_node(queue))
    workflow.add_node("thesis_agent",     _make_thesis_node(queue))

    # News + Financials run in parallel from START
    workflow.add_edge(START, "news_agent")
    workflow.add_edge(START, "financials_agent")

    # Sentiment fans-in after both complete
    workflow.add_edge("news_agent",       "sentiment_agent")
    workflow.add_edge("financials_agent", "sentiment_agent")

    workflow.add_edge("sentiment_agent", "thesis_agent")
    workflow.add_edge("thesis_agent", END)

    return workflow.compile()


# ── Public streaming entry point ──────────────────────────────────────────────

async def stream_research(ticker: str) -> AsyncGenerator[str, None]:
    queue: asyncio.Queue = asyncio.Queue()
    final_state: dict = {}

    async def _run():
        try:
            graph = _build_graph(queue)
            result = await graph.ainvoke({
                "ticker": ticker.upper(),
                "news_data": None,
                "financials_data": None,
                "sentiment_data": None,
                "thesis_data": None,
                "errors": [],
            })
            final_state.update(result)
        except Exception as exc:
            await queue.put({"type": "error", "message": str(exc)})
        finally:
            await queue.put(None)

    task = asyncio.create_task(_run())

    try:
        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"

        if final_state.get("thesis_data"):
            yield f"data: {json.dumps({'type': 'complete', 'data': {'ticker': ticker.upper(), 'news_data': final_state.get('news_data'), 'financials_data': final_state.get('financials_data'), 'sentiment_data': final_state.get('sentiment_data'), 'thesis_data': final_state.get('thesis_data')}})}\n\n"
    finally:
        task.cancel()

    yield "data: [DONE]\n\n"
