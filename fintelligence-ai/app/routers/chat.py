from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.services import openai_service
from app.middleware.auth import verify_clerk_token

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    _user_id: str = Depends(verify_clerk_token),
):
    result = await openai_service.chat(request.messages, request.transactions_context)
    return ChatResponse(message=result["message"], tokens_used=result["tokens_used"])


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    _user_id: str = Depends(verify_clerk_token),
):
    async def generate():
        async for chunk in openai_service.stream_chat(request.messages, request.transactions_context):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
