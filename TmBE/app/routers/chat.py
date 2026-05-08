"""
Chat Router
Handles chat-related API endpoints with SSE streaming support.
"""

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_service import get_gemini_response, stream_gemini_response

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message and get a response from Gemini AI.

    Args:
        request: ChatRequest containing the user's message.

    Returns:
        ChatResponse with the AI-generated response.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response_text = get_gemini_response(request.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


@router.post("/stream")
async def stream_message(request: ChatRequest):
    """
    Send a message and stream the response from Gemini AI via SSE.

    Args:
        request: ChatRequest containing the user's message.

    Returns:
        StreamingResponse with text/event-stream content type.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    def event_generator():
        try:
            for event in stream_gemini_response(request.message):
                data = json.dumps(event)
                yield f"data: {data}\n\n"
            # Signal stream completion
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
