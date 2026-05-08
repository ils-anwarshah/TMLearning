"""
Gemini AI Service Module
Handles communication with Google's Gemini API using the modern google-genai SDK.
"""

from collections.abc import Generator

from google import genai
from google.genai import types

from app.config import settings

# Shared client instance
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Get or create the Gemini API client."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# Shared config with Google Search enabled
_CONFIG = types.GenerateContentConfig(
    tools=[types.Tool(google_search=types.GoogleSearch())],
)


def get_gemini_response(message: str) -> str:
    """
    Send a message to Gemini and return the generated response.

    Args:
        message: The user's input message.

    Returns:
        The AI-generated response text.
    """
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=message,
        config=_CONFIG,
    )
    return response.text


def stream_gemini_response(message: str) -> Generator[dict, None, None]:
    """
    Stream a response from Gemini chunk by chunk, yielding status and content events.

    Args:
        message: The user's input message.

    Yields:
        Dicts with either {"status": "..."} or {"content": "..."} keys.
    """
    client = _get_client()

    yield {"status": "thinking"}

    first_chunk = True
    search_detected = False

    for chunk in client.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=message,
        config=_CONFIG,
    ):
        # Detect web search grounding from candidates metadata
        if not search_detected and chunk.candidates:
            candidate = chunk.candidates[0]
            if candidate.grounding_metadata and candidate.grounding_metadata.grounding_chunks:
                search_detected = True
                yield {"status": "web_searching"}

        if chunk.text:
            if first_chunk:
                yield {"status": "generating"}
                first_chunk = False
            yield {"content": chunk.text}
