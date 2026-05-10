import numpy as np
from sklearn.linear_model import LinearRegression
from typing import List
from app.models.schemas import MonthlyData, PredictedMonth, CashflowResponse
from datetime import datetime
from dateutil.relativedelta import relativedelta


def predict_cashflow(monthly_data: List[MonthlyData]) -> CashflowResponse:
    if len(monthly_data) < 2:
        # Not enough data — return flat prediction
        last = monthly_data[-1] if monthly_data else MonthlyData(month="Unknown", income=0, expenses=0)
        predictions = [
            PredictedMonth(month=f"Month +{i+1}", income=last.income, expenses=last.expenses, net=last.income - last.expenses)
            for i in range(3)
        ]
        return CashflowResponse(prediction=predictions, confidence=0.0, trend="stable")

    X = np.arange(len(monthly_data)).reshape(-1, 1)
    incomes = np.array([m.income for m in monthly_data])
    expenses = np.array([m.expenses for m in monthly_data])

    income_model = LinearRegression().fit(X, incomes)
    expense_model = LinearRegression().fit(X, expenses)

    income_r2 = float(income_model.score(X, incomes))
    expense_r2 = float(expense_model.score(X, expenses))
    confidence = round(max(0.0, min(1.0, (income_r2 + expense_r2) / 2)), 3)

    # Predict next 3 months
    next_indices = np.arange(len(monthly_data), len(monthly_data) + 3).reshape(-1, 1)
    predicted_incomes = income_model.predict(next_indices)
    predicted_expenses = expense_model.predict(next_indices)

    # Generate month labels
    try:
        last_month = datetime.strptime(monthly_data[-1].month, "%b %Y")
    except ValueError:
        last_month = datetime.now()

    predictions: List[PredictedMonth] = []
    for i in range(3):
        future = last_month + relativedelta(months=i + 1)
        inc = max(0.0, float(predicted_incomes[i]))
        exp = max(0.0, float(predicted_expenses[i]))
        predictions.append(
            PredictedMonth(
                month=future.strftime("%b %Y"),
                income=round(inc, 2),
                expenses=round(exp, 2),
                net=round(inc - exp, 2),
            )
        )

    # Trend: compare avg of last 2 months net vs previous months net
    nets = [m.income - m.expenses for m in monthly_data]
    recent_avg = np.mean(nets[-2:]) if len(nets) >= 2 else nets[-1]
    prior_avg = np.mean(nets[:-2]) if len(nets) > 2 else recent_avg

    delta = recent_avg - prior_avg
    if delta > prior_avg * 0.05:
        trend = "improving"
    elif delta < -prior_avg * 0.05:
        trend = "declining"
    else:
        trend = "stable"

    return CashflowResponse(prediction=predictions, confidence=confidence, trend=trend)
