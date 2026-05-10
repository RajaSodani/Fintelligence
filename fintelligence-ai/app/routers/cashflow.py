from fastapi import APIRouter, Depends
from app.models.schemas import CashflowRequest, CashflowResponse
from app.services.cashflow_service import predict_cashflow
from app.middleware.auth import verify_clerk_token

router = APIRouter()


@router.post("/cashflow/predict", response_model=CashflowResponse)
async def predict(
    request: CashflowRequest,
    _user_id: str = Depends(verify_clerk_token),
):
    return predict_cashflow(request.monthly_data)
