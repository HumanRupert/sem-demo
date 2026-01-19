"""
AI Shopping Agent with Shopify Storefront MCP integration.

This agent connects to the Shopify Storefront MCP server to provide
product search and browsing capabilities through natural conversation.

Search results are filtered by an LLM to ensure only relevant products
are shown to the user.
"""

import json
import os
import httpx
from google import genai
from google.adk.agents import LlmAgent

# Shopify Storefront MCP configuration for Allbirds store
SHOPIFY_MCP_URL = "https://www.allbirds.com/api/mcp"

# Configure Gemini client for filtering (uses same API key as ADK)
genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


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

        try:
            response = await client.post(SHOPIFY_MCP_URL, json=mcp_request)
            response.raise_for_status()
            mcp_response = response.json()
        except Exception as e:
            return {"error": f"Failed to search products: {str(e)}", "products": []}

    # Step 2: Parse products from MCP response
    products = parse_mcp_response(mcp_response)

    if not products:
        return {"products": [], "message": "No products found for your search."}

    # Step 3: Use Gemini to filter for relevance
    filtered_products = await filter_products_with_llm(query, context, products)

    return {
        "products": filtered_products,
        "total_found": len(products),
        "total_relevant": len(filtered_products),
        "query": query
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
        print(f"Error parsing MCP response: {e}")
        return []


async def filter_products_with_llm(query: str, context: str, products: list) -> list:
    """Use Gemini to filter products for relevance to the user's query."""
    if not products:
        return []

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

    try:
        response = genai_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=filter_prompt
        )

        # Parse the response to get indices
        response_text = response.text.strip()
        # Clean up the response - remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        relevant_indices = json.loads(response_text)

        # Return only the relevant products
        filtered = [products[i] for i in relevant_indices if i < len(products)]
        return filtered if filtered else products[:5]  # Fallback to top 5 if filtering fails

    except Exception as e:
        print(f"Error filtering products with LLM: {e}")
        # On error, return original products (limited to 10)
        return products[:10]


SYSTEM_PROMPT = """You are a friendly and knowledgeable shopping assistant for Allbirds,
a sustainable footwear and apparel brand. Your role is to help customers discover products,
answer questions, and guide them through their shopping journey.

## Your Capabilities

1. **Product Search**: Use the search_products tool to find products.
   - This tool automatically filters results to show only relevant items
   - For example, searching "shoes" will only show actual footwear, not shoe accessories

2. **Cart Management**: Help customers manage their shopping cart.
   - Use addToCart to add items (include productId, variantId, title, price, quantity, image)
   - Use removeFromCart to remove items (by productId)
   - Use getCart to check what's in their cart

3. **Checkout**: When customers are ready to buy, use openCheckout to start the checkout flow.

## Guidelines

- Be conversational, helpful, and enthusiastic about Allbirds' sustainable products
- When showing products, highlight key features like materials, comfort, and sustainability
- Always confirm product details (size, color) before adding to cart
- Proactively offer to help with sizing or product recommendations
- Keep responses concise but informative
- When adding to cart, extract the correct variant based on customer's size/color preferences

## Response Format

When presenting search results, briefly describe each product. Let the UI handle the visual display.
When the user wants to add something to cart, confirm the specific variant (size, color) first.
"""


# Create the agent with the custom search tool
root_agent = LlmAgent(
    name="shopping_assistant",
    model="gemini-2.0-flash",
    instruction=SYSTEM_PROMPT,
    tools=[search_products],  # Use our custom filtered search tool
)
