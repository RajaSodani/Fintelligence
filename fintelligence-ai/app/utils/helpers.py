from typing import Any


def format_inr(amount: float) -> str:
    return f"₹{amount:,.2f}"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    return numerator / denominator if denominator != 0 else default


def clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def truncate_context(data: list[Any], max_items: int = 30) -> list[Any]:
    return data[-max_items:] if len(data) > max_items else data
