"""
FastAPI server exposing the ADK agent via AG-UI protocol.

This server uses the ag-ui-adk middleware to make the ADK agent
accessible to CopilotKit frontends.
"""

import os
from dotenv import load_dotenv

# Load environment variables before importing agent
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

from shopping_agent.agent import root_agent

# Create FastAPI app
app = FastAPI(
    title="Shopping Assistant API",
    description="AI-powered shopping assistant with Shopify MCP integration",
    version="0.1.0",
)

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


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "shopping_assistant"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
