"""
Gemini AI Service Module
Handles communication with Google's Gemini API using LangChain's google-genai integration.
"""

from collections.abc import Generator

from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings

# Shared model instance
_model = None


def _get_model():
    """Get or create the LangChain Gemini model."""
    global _model
    if _model is None:
        _model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
        )
    return _model


def get_gemini_response(message: str) -> str:
    """
    Send a message to Gemini and return the generated response.

    Args:
        message: The user's input message.

    Returns:
        The AI-generated response text.
    """
    model = _get_model()
    response = model.invoke(message)
    return response.text


def stream_gemini_response(message: str) -> Generator[dict, None, None]:
    """
    Stream a response from Gemini chunk by chunk, yielding status and content events.

    Args:
        message: The user's input message.

    Yields:
        Dicts with either {"status": "..."} or {"content": "..."} keys.
    """
    model = _get_model()

    yield {"status": "thinking"}

    first_chunk = True

    for chunk in model.stream(message):
        if chunk.text:
            if first_chunk:
                yield {"status": "generating"}
                first_chunk = False
            yield {"content": chunk.text}
