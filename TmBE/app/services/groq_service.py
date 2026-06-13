"""
Groq AI Service Module
Handles communication with Groq's API using the official Groq SDK.
"""

from collections.abc import Generator

from groq import Groq

from app.config import settings

# Shared client instance
_client = None


def _get_client():
    """Get or create the Groq client."""
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def get_groq_response(message: str) -> str:
    """
    Send a message to Groq and return the generated response.

    Args:
        message: The user's input message.

    Returns:
        The AI-generated response text.
    """
    client = _get_client()
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "user", "content": message}
        ],
        model="llama-3.3-70b-versatile",
    )
    return chat_completion.choices[0].message.content


def stream_groq_response(message: str) -> Generator[dict, None, None]:
    """
    Stream a response from Groq chunk by chunk, yielding status and content events.

    Args:
        message: The user's input message.

    Yields:
        Dicts with either {"status": "..."} or {"content": "..."} keys.
    """
    client = _get_client()

    yield {"status": "thinking"}

    stream = client.chat.completions.create(
        messages=[
            {"role": "user", "content": message}
        ],
        model="llama-3.3-70b-versatile",
        stream=True,
    )

    first_chunk = True

    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            if first_chunk:
                yield {"status": "generating"}
                first_chunk = False
            yield {"content": content}
