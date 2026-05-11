from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.models.schemas import ResearchRequest
from app.services.research_service import stream_research
from app.middleware.auth import verify_clerk_token

router = APIRouter()


@router.post("/research/stream")
async def research_stream(
    request: ResearchRequest,
    _user_id: str = Depends(verify_clerk_token),
):
    return StreamingResponse(
        stream_research(request.ticker),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
