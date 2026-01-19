"""
FastAPI server exposing the ADK agent via AG-UI protocol.

This server uses the ag-ui-adk middleware to make the ADK agent
accessible to CopilotKit frontends.

Also includes Merchant Control Dashboard API for agentic commerce visibility.
"""

import logging
import os
import time
from dotenv import load_dotenv

# Load environment variables before importing agent
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

from shopping_agent.agent import root_agent

# Import merchant dashboard components
from merchant.database import init_db
from merchant.routes import router as merchant_router
from merchant.seed import seed_database

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("agent_server")

# Create FastAPI app
app = FastAPI(
    title="Shopping Assistant API",
    description="AI-powered shopping assistant with Shopify MCP integration",
    version="0.1.0",
)


# =============================================================================
# REQUEST/RESPONSE LOGGING MIDDLEWARE
# =============================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses."""
    start_time = time.time()

    # Log request
    logger.info(f"[REQUEST] {request.method} {request.url.path}")

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = (time.time() - start_time) * 1000

    # Log response
    logger.info(f"[RESPONSE] {response.status_code} ({duration:.0f}ms)")

    return response


# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap the LlmAgent in ADKAgent for AG-UI compatibility
adk_agent = ADKAgent(
    adk_agent=root_agent,
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)

# Add AG-UI endpoint for the ADK agent
add_adk_fastapi_endpoint(app, adk_agent, path="/")

# =============================================================================
# MERCHANT DASHBOARD
# =============================================================================

# Include merchant dashboard routes
app.include_router(merchant_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed with demo data on startup."""
    logger.info("[STARTUP] Initializing merchant database...")
    init_db()
    logger.info("[STARTUP] Seeding database with demo data...")
    seed_database()
    logger.info("[STARTUP] Merchant dashboard ready")

logger.info("[SERVER] Shopping Assistant API initialized")
logger.info("[SERVER] Merchant Dashboard API available at /merchant/*")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.info("[HEALTH] Health check requested")
    return {"status": "healthy", "agent": "shopping_assistant"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    logger.info(f"[SERVER] Starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
