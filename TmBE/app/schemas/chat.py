"""
Request and Response schemas for the Chat API.
"""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Schema for incoming chat messages."""
    message: str


class ChatResponse(BaseModel):
    """Schema for outgoing chat responses."""
    response: str
