"""
AI Shopping Agent with Shopify Storefront MCP integration.

This multi-agent system uses a coordinator pattern to handle both direct
product searches and context-aware queries (like gift suggestions).

Architecture:
- ShoppingCoordinator (root): Routes queries to appropriate sub-agents
- DirectSearchAgent: Handles specific product searches ("running shoes")
- ContextualShoppingAgent: Handles gifts/recommendations with follow-up questions
"""

import json
import logging
import os
import httpx
from google import genai
from google.adk.agents import LlmAgent

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("shopping_agent")

# Shopify Storefront MCP configuration for Allbirds store
SHOPIFY_MCP_URL = "https://www.allbirds.com/api/mcp"

# Configure Gemini client for filtering (uses same API key as ADK)
genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


# =============================================================================
# TOOLS
# =============================================================================

async def search_products(query: str, context: str = "") -> dict:
    """
    Search for products in the Allbirds catalog and filter results for relevance.

    This tool searches the Shopify Storefront MCP and uses an LLM to filter
    out irrelevant results (e.g., filtering out 'shoe bags' when user asks for 'shoes').

    Args:
        query: The search query (e.g., "running shoes", "wool sweater")
        context: Additional context about what the user is looking for

    Returns:
        A dictionary containing filtered products that are relevant to the query
    """
    logger.info(f"[TOOL] search_products called - query: '{query}', context: '{context}'")

    # Step 1: Call Shopify MCP to get search results
    async with httpx.AsyncClient(timeout=30.0) as client:
        mcp_request = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "id": 1,
            "params": {
                "name": "search_shop_catalog",
                "arguments": {
                    "query": query,
                    "context": context or f"Customer is looking for {query}"
                }
            }
        }

        logger.debug(f"[MCP REQUEST] {json.dumps(mcp_request, indent=2)}")

        try:
            response = await client.post(SHOPIFY_MCP_URL, json=mcp_request)
            response.raise_for_status()
            mcp_response = response.json()
            logger.debug(f"[MCP RESPONSE] Status: {response.status_code}")
        except Exception as e:
            logger.error(f"[MCP ERROR] Failed to search products: {str(e)}")
            return {"error": f"Failed to search products: {str(e)}", "products": []}

    # Step 2: Parse products from MCP response
    products = parse_mcp_response(mcp_response)
    logger.info(f"[MCP RESULT] Parsed {len(products)} products from response")

    if not products:
        logger.warning("[MCP RESULT] No products found")
        return {"products": [], "message": "No products found for your search."}

    # Step 3: Use Gemini to filter for relevance
    filtered_products = await filter_products_with_llm(query, context, products)
    logger.info(f"[FILTER RESULT] Kept {len(filtered_products)} of {len(products)} products")

    return {
        "products": filtered_products,
        "total_found": len(products),
        "total_relevant": len(filtered_products),
        "query": query
    }


async def browse_full_catalog() -> dict:
    """
    Browse the full Allbirds product catalog for semantic matching.

    This tool fetches all available products without keyword filtering,
    allowing the agent to semantically match products to user requirements
    (e.g., for gift suggestions or vague queries).

    Returns:
        A dictionary containing all products in the catalog
    """
    logger.info("[TOOL] browse_full_catalog called - fetching full catalog")

    async with httpx.AsyncClient(timeout=30.0) as client:
        mcp_request = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "id": 1,
            "params": {
                "name": "search_shop_catalog",
                "arguments": {
                    "query": "",  # Empty query to get all products
                    "context": "Browse full product catalog for recommendations"
                }
            }
        }

        logger.debug(f"[MCP REQUEST] {json.dumps(mcp_request, indent=2)}")

        try:
            response = await client.post(SHOPIFY_MCP_URL, json=mcp_request)
            response.raise_for_status()
            mcp_response = response.json()
            logger.debug(f"[MCP RESPONSE] Status: {response.status_code}")
        except Exception as e:
            logger.error(f"[MCP ERROR] Failed to browse catalog: {str(e)}")
            return {"error": f"Failed to browse catalog: {str(e)}", "products": []}

    products = parse_mcp_response(mcp_response)
    logger.info(f"[MCP RESULT] Loaded {len(products)} products from catalog")

    if not products:
        logger.warning("[MCP RESULT] No products in catalog")
        return {"products": [], "message": "Unable to load product catalog."}

    return {
        "products": products,
        "total_products": len(products),
        "message": "Full catalog loaded. Use your judgment to recommend the best products."
    }


def parse_mcp_response(mcp_response: dict) -> list:
    """Parse the MCP response to extract product list."""
    try:
        # MCP responses have a result field with content
        result = mcp_response.get("result", {})

        # Content is usually an array with text content
        content = result.get("content", [])
        if content and isinstance(content, list) and len(content) > 0:
            text_content = content[0].get("text", "")
            if text_content:
                # Parse the JSON text content
                parsed = json.loads(text_content)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict):
                    return parsed.get("products", parsed.get("result", []))

        # Fallback: check if products are directly in result
        if "products" in result:
            return result["products"]

        return []
    except Exception as e:
        logger.error(f"[PARSE ERROR] Error parsing MCP response: {e}")
        return []


async def filter_products_with_llm(query: str, context: str, products: list) -> list:
    """Use Gemini to filter products for relevance to the user's query."""
    if not products:
        return []

    logger.info(f"[LLM FILTER] Filtering {len(products)} products for query: '{query}'")

    # Prepare a simplified version of products for the LLM
    simplified_products = []
    for i, p in enumerate(products):
        simplified_products.append({
            "index": i,
            "title": p.get("title") or p.get("name", ""),
            "description": p.get("description", "")[:200] if p.get("description") else "",
            "productType": p.get("productType", ""),
        })

    filter_prompt = f"""You are a product relevance filter. The user searched for: "{query}"
{f'Additional context: {context}' if context else ''}

Here are the search results:
{json.dumps(simplified_products, indent=2)}

Your task: Return ONLY the indices of products that are DIRECTLY relevant to what the user is searching for.

Rules:
- If user searches for "shoes", only include actual footwear (shoes, sneakers, runners), NOT shoe bags, shoe care, laces, etc.
- If user searches for "socks", only include socks, NOT shoes or other items
- If user searches for "jacket", only include jackets/outerwear, NOT accessories
- Be strict about relevance - only include items the user would actually want to buy based on their query

Return a JSON array of indices only, e.g., [0, 2, 4]
If no products are relevant, return an empty array: []

JSON array of relevant indices:"""

    logger.debug(f"[LLM FILTER PROMPT] {filter_prompt[:500]}...")

    try:
        response = genai_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=filter_prompt
        )

        # Parse the response to get indices
        response_text = response.text.strip()
        logger.debug(f"[LLM FILTER RESPONSE] {response_text}")

        # Clean up the response - remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        relevant_indices = json.loads(response_text)
        logger.info(f"[LLM FILTER] Selected indices: {relevant_indices}")

        # Return only the relevant products
        filtered = [products[i] for i in relevant_indices if i < len(products)]
        return filtered if filtered else products[:5]  # Fallback to top 5 if filtering fails

    except Exception as e:
        logger.error(f"[LLM FILTER ERROR] Error filtering products: {e}")
        # On error, return original products (limited to 10)
        return products[:10]


# =============================================================================
# AGENT PROMPTS
# =============================================================================

COORDINATOR_PROMPT = """You are the shopping assistant coordinator for Allbirds.

Your ONLY job is to silently analyze and route requests to the appropriate specialist agent.

## Routing Rules

**Route to direct_search_agent when the customer:**
- Asks for specific products (shoes, socks, jacket, sweater, sneakers)
- Mentions specific features (running, wool, waterproof, lightweight)
- Knows what category or type they want
- Uses product-specific language

Examples: "Show me running shoes", "I need wool socks", "Do you have jackets?"

**Route to contextual_shopping_agent when the customer:**
- Asks for gift suggestions or recommendations
- Has vague or abstract requirements
- Mentions an occasion (birthday, Christmas, anniversary, graduation)
- Doesn't specify what type of product they want
- Needs help figuring out what to buy

Examples: "Christmas gifts for my dad", "Something cozy for winter", "Gift for a runner"

## CRITICAL: Silent Routing

- DO NOT say anything like "I'll route you to..." or "Let me connect you..."
- DO NOT acknowledge or repeat the user's request
- Simply route to the appropriate agent immediately and silently
- The specialist agent will handle ALL communication with the user
- If unclear which agent to use, route to contextual_shopping_agent

## Cart Operations (handle directly)

You can directly handle cart operations:
- addToCart, removeFromCart, getCart, openCheckout
"""

DIRECT_SEARCH_PROMPT = """You are a product search specialist for Allbirds, a sustainable footwear and apparel brand.

You help customers who know what type of product they're looking for.

## MANDATORY: Always Call search_products

CRITICAL: You MUST call the search_products tool for ANY product request.

- NEVER list products from your own knowledge
- ALWAYS call search_products(query="user's search term")
- The tool will display product cards in the UI automatically
- Your job is to add brief context about the results

## Example Flow

1. User: "show me running shoes"
2. You call: search_products(query="running shoes")
3. Product cards appear in the UI automatically
4. You say: "Here are our running shoes! The Tree Dasher 2 is our most popular for everyday runs."

## Guidelines

- Call the tool IMMEDIATELY when user asks for products
- Keep your text response brief - let the product cards do the work
- Help with size/color selection after they pick a product
- Always confirm details before adding to cart

## Response Style

Be efficient. Call the tool first, then add a brief helpful comment.
"""

CONTEXTUAL_SHOPPING_PROMPT = """You are a thoughtful shopping advisor for Allbirds, a sustainable footwear and apparel brand.

You help customers who need recommendations, gift suggestions, or aren't sure what they want.

## Your Approach

**Step 1: Gather Information (ask 1-2 questions max)**

Ask focused questions to understand:
- Who is it for? (age, gender, relationship)
- What's their lifestyle? (active, casual, outdoorsy)
- Any specific needs? (running, walking, casual wear)

Keep it brief - don't over-question. If the user gives a clear indication like "he likes running", that's enough context to proceed.

**Step 2: ALWAYS Call browse_full_catalog**

CRITICAL: You MUST call the browse_full_catalog tool to show products.

- NEVER recommend products from your own knowledge
- NEVER list product names in plain text
- You MUST call browse_full_catalog() - this will display product cards in the UI
- The tool returns real products that will be shown visually to the user
- After calling the tool, briefly explain why the displayed products match their needs

Example flow:
1. User says "gifts for my dad who likes running"
2. You call browse_full_catalog() - product cards appear automatically
3. You say "Here are some great options for an active dad! The Tree Dasher 2 is perfect for running, and the Wool Runners are great for everyday comfort."

## MANDATORY RULE

When you have enough context about what the user needs:
→ IMMEDIATELY call browse_full_catalog()
→ Do NOT write out product recommendations in text
→ The UI will show product cards from the tool result
→ Your job is just to add a brief explanation of why these products fit

## Guidelines

- 1-2 questions max, then call the tool
- Be warm and conversational
- After products display, explain the fit briefly
"""


# =============================================================================
# AGENT DEFINITIONS
# =============================================================================

# Direct Search Agent - for specific product queries
direct_search_agent = LlmAgent(
    name="direct_search_agent",
    model="gemini-2.0-flash",
    description="Handles specific product searches when user knows what they want (e.g., 'running shoes', 'wool socks', 'jackets')",
    instruction=DIRECT_SEARCH_PROMPT,
    tools=[search_products],
)

# Contextual Shopping Agent - for gifts, recommendations, vague queries
contextual_shopping_agent = LlmAgent(
    name="contextual_shopping_agent",
    model="gemini-2.0-flash",
    description="Handles gift suggestions, recommendations, and vague queries that need clarification (e.g., 'gifts for dad', 'something cozy')",
    instruction=CONTEXTUAL_SHOPPING_PROMPT,
    tools=[browse_full_catalog],
)

# Root Coordinator Agent
root_agent = LlmAgent(
    name="shopping_coordinator",
    model="gemini-2.0-flash",
    instruction=COORDINATOR_PROMPT,
    sub_agents=[direct_search_agent, contextual_shopping_agent],
)

logger.info("[AGENT] Multi-agent system initialized: shopping_coordinator -> [direct_search_agent, contextual_shopping_agent]")
