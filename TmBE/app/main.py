"""
TMLearning Backend - FastAPI Application
Main entry point for the API server with Gemini AI integration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat

app = FastAPI(
    title=settings.APP_NAME,
    description="TMLearning API with Gemini AI chat integration",
    version="1.0.0",
)

# CORS configuration to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "running", "app": settings.APP_NAME}
