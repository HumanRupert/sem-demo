# Semantic Pay Demo - AI Shopping Assistant

An AI-powered conversational commerce demo showcasing natural language shopping with Allbirds products.

## Architecture

```
Frontend (Next.js + CopilotKit)  →  Backend (Google ADK Agent)  →  Shopify Storefront MCP
```

- **Frontend**: Next.js with CopilotKit for chat UI, cart management, and checkout
- **Backend**: Google ADK Python agent with Gemini 2.0 Flash
- **Data**: Shopify Storefront MCP for real Allbirds product catalog

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- pip

### Installation

```bash
# Install root dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..

# Install Python agent dependencies
cd agent && pip install -e . && cd ..
```

### Running the App

**Option 1: Run both together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Agent:
```bash
cd agent
python3 server.py
```

Terminal 2 - UI:
```bash
cd ui
npm run dev
```

### Access the App

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Natural Language Search**: "Show me running shoes" or "I need comfortable sneakers"
- **Cart Management**: Add and remove items through conversation
- **Checkout Flow**: Multi-step checkout with shipping and payment forms
- **Real Products**: Connected to Allbirds' real product catalog via Shopify MCP

## Project Structure

```
sem-demo/
├── agent/                    # Python ADK Agent
│   ├── shopping_agent/
│   │   ├── __init__.py
│   │   └── agent.py          # Main agent with MCP integration
│   ├── server.py             # FastAPI server with AG-UI protocol
│   ├── .env                  # Environment variables (gitignored)
│   ├── .env.example          # Environment template
│   └── pyproject.toml        # Python dependencies
├── ui/                       # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/copilotkit/ # CopilotKit API route
│   │   │   └── ...           # Next.js app router
│   │   ├── components/       # React components
│   │   ├── context/          # Cart context
│   │   └── lib/              # Utilities
│   └── package.json
├── package.json              # Root package.json
└── README.md
```

## Environment Variables

The agent requires a Google API key (already configured in `agent/.env`):

```env
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=your_api_key_here
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, CopilotKit, Framer Motion, Tailwind CSS
- **Backend**: Google ADK, Python 3.10+
- **AI Model**: Gemini 2.0 Flash
- **Data Source**: Shopify Storefront MCP (allbirds.com)

## Demo Flow

1. User opens app and sees chat interface
2. User asks: "I'm looking for running shoes"
3. Agent searches catalog and displays product cards
4. User: "Add the Tree Runners in size 10"
5. Agent confirms and adds to cart
6. User: "Checkout"
7. Agent opens checkout modal
8. User completes shipping → payment → confirmation

## Credits

Built with:
- [CopilotKit](https://copilotkit.ai/) - React SDK for AI copilots
- [Google ADK](https://google.github.io/adk-docs/) - Agent Development Kit
- [Shopify MCP](https://shopify.dev/docs/apps/build/storefront-mcp) - Storefront API
