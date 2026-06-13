"""
Groq AI Service Module
Handles communication with Groq's API using LangChain's langchain-groq integration.
"""

from collections.abc import AsyncGenerator

from langchain_groq import ChatGroq

from app.config import settings

# Shared model instance
_model = None

SYSTEM_PROMPT = (
    "You are a helpful AI assistant specialised in task and project management. "
    "Help users create, organise, and track their stories and subtasks clearly and concisely."
)


def _get_model() -> ChatGroq:
    """Get or create the LangChain ChatGroq model."""
    global _model
    if _model is None:
        _model = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )
    return _model


async def get_groq_response(message: str) -> str:
    """
    Send a message to Groq and return the generated response.

    Args:
        message: The user's input message.

    Returns:
        The AI-generated response text.
    """
    model = _get_model()
    messages = [
        ("system", SYSTEM_PROMPT),
        ("human", message),
    ]
    response = await model.ainvoke(messages)
    return response.content


async def stream_groq_response(message: str) -> AsyncGenerator[dict, None]:
    """
    Stream a response from Groq chunk by chunk, yielding status and content events.

    Args:
        message: The user's input message.

    Yields:
        Dicts with either {"status": "..."} or {"content": "..."} keys.
    """
    model = _get_model()
    messages = [
        ("system", SYSTEM_PROMPT),
        ("human", message),
    ]

    yield {"status": "thinking"}

    first_chunk = True

    async for chunk in model.astream(messages):
        if chunk.content:
            if first_chunk:
                yield {"status": "generating"}
                first_chunk = False
            yield {"content": chunk.content}
