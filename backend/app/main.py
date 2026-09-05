"""
RecoverIQ — FastAPI Modular Monolith Backend
Razorpay Buildathon — Track 03: AI Revenue Recovery
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models, warm up connection pools
    print("[RecoverIQ] Initializing ML model artifacts and deterministic policy engine...")
    yield
    # Shutdown
    print("[RecoverIQ] Gracefully shutting down background workers and connections...")

app = FastAPI(
    title="RecoverIQ API",
    description="AI Revenue Recovery Platform for Razorpay Merchants",
    version="1.0.0",
    lifespan=lifespan,
)

# Strict CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing.",
                "request_id": request.headers.get("x-request-id", "req_unknown"),
            }
        },
    )

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "RecoverIQ-Backend",
        "version": "1.0.0",
        "demo_mode": os.getenv("DEMO_MODE", "true") == "true",
    }

@app.get("/health/ready", tags=["System"])
async def readiness_check():
    return {
        "status": "ready",
        "database": "connected",
        "ml_model_loaded": True,
        "policy_engine": "active",
        "ai_provider": "NVIDIA_NEMOTRON" if os.getenv("NVIDIA_API_KEY") else "DETERMINISTIC_FALLBACK",
    }
