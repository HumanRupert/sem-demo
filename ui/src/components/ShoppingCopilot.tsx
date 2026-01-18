"use client";

import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
  useRenderToolCall,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCart } from "@/context/CartContext";
import { ProductGrid, ProductCard, Product } from "./ProductCard";
import { motion } from "framer-motion";

function CopilotActions() {
  const { items, addItem, removeItem, openCart, openCheckout, totalPrice } =
    useCart();

  // Make cart state readable by the agent
  useCopilotReadable({
    description: "Current shopping cart contents",
    value: {
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        variantTitle: item.variantTitle,
        price: item.price,
        quantity: item.quantity,
      })),
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: totalPrice,
    },
  });

  // Add to cart action
  useCopilotAction({
    name: "addToCart",
    description:
      "Add a product to the shopping cart. Use this when the user wants to add an item to their cart.",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "The unique ID of the product",
        required: true,
      },
      {
        name: "variantId",
        type: "string",
        description:
          "The unique ID of the product variant (for size/color selection)",
        required: true,
      },
      {
        name: "title",
        type: "string",
        description: "The product title",
        required: true,
      },
      {
        name: "variantTitle",
        type: "string",
        description: "The variant title (e.g., 'Size 10 / Black')",
        required: false,
      },
      {
        name: "price",
        type: "number",
        description: "The product price in dollars",
        required: true,
      },
      {
        name: "quantity",
        type: "number",
        description: "The quantity to add (defaults to 1)",
        required: false,
      },
      {
        name: "image",
        type: "string",
        description: "URL of the product image",
        required: false,
      },
    ],
    handler: async ({
      productId,
      variantId,
      title,
      variantTitle,
      price,
      quantity,
      image,
    }) => {
      addItem({
        productId,
        variantId,
        title,
        variantTitle,
        price,
        quantity: quantity || 1,
        image,
      });
      return `Added ${title} to cart`;
    },
  });

  // Remove from cart action
  useCopilotAction({
    name: "removeFromCart",
    description:
      "Remove a product from the shopping cart by its product ID",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "The product ID to remove",
        required: true,
      },
    ],
    handler: async ({ productId }) => {
      removeItem(productId);
      return `Removed item from cart`;
    },
  });

  // Open cart action
  useCopilotAction({
    name: "openCart",
    description: "Open the cart drawer to show the user their cart contents",
    parameters: [],
    handler: async () => {
      openCart();
      return "Cart opened";
    },
  });

  // Get cart action
  useCopilotAction({
    name: "getCart",
    description: "Get the current contents of the shopping cart",
    parameters: [],
    handler: async () => {
      return {
        items: items.map((item) => ({
          productId: item.productId,
          title: item.title,
          variantTitle: item.variantTitle,
          price: item.price,
          quantity: item.quantity,
        })),
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: totalPrice,
      };
    },
  });

  // Open checkout action
  useCopilotAction({
    name: "openCheckout",
    description:
      "Open the checkout modal to let the user complete their purchase",
    parameters: [],
    handler: async () => {
      if (items.length === 0) {
        return "Cannot checkout - cart is empty";
      }
      openCheckout();
      return "Checkout opened";
    },
  });

  return null;
}

// Generative UI hooks for MCP tools
function GenerativeUI() {
  // Render search_shop_catalog tool results as a product grid
  useRenderToolCall({
    name: "search_shop_catalog",
    render: ({ status, result }) => {
      // Debug log to see what we're getting
      console.log("[GenerativeUI] search_shop_catalog status:", status, "result:", result);

      // Check for loading state - handle various status values
      const isLoading = status === "executing" || status === "inProgress" || status === "pending";
      const isComplete = status === "complete" || status === "completed" || status === "success" || result !== undefined;

      if (isLoading && !result) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl my-2"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black" />
            <span className="text-gray-600">Searching products...</span>
          </motion.div>
        );
      }

      // Parse the result to extract products
      const products = parseSearchResults(result);

      if (!products || products.length === 0) {
        // If no result yet and not explicitly complete, show loading
        if (!isComplete && !result) {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl my-2"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black" />
              <span className="text-gray-600">Searching products...</span>
            </motion.div>
          );
        }
        return (
          <div className="p-4 bg-gray-50 rounded-xl my-2 text-gray-500">
            No products found. Try a different search term.
          </div>
        );
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4"
        >
          <ProductGrid products={products} />
        </motion.div>
      );
    },
  });

  // Render get_product_details tool results as a single product card
  useRenderToolCall({
    name: "get_product_details",
    render: ({ status, result }) => {
      console.log("[GenerativeUI] get_product_details status:", status, "result:", result);

      const isLoading = status === "executing" || status === "inProgress" || status === "pending";
      const isComplete = status === "complete" || status === "completed" || status === "success" || result !== undefined;

      if (isLoading && !result) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl my-2"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black" />
            <span className="text-gray-600">Loading product details...</span>
          </motion.div>
        );
      }

      const product = parseProductDetails(result);

      if (!product) {
        if (!isComplete && !result) {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl my-2"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black" />
              <span className="text-gray-600">Loading product details...</span>
            </motion.div>
          );
        }
        return (
          <div className="p-4 bg-gray-50 rounded-xl my-2 text-gray-500">
            Could not load product details.
          </div>
        );
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4 max-w-sm"
        >
          <ProductCard product={product} />
        </motion.div>
      );
    },
  });

  return null;
}

// Helper function to extract image URL from various formats
function extractImageUrl(imageData: unknown): string | undefined {
  if (!imageData) return undefined;

  if (typeof imageData === "string") {
    return imageData;
  }

  if (typeof imageData === "object" && imageData !== null) {
    const img = imageData as Record<string, unknown>;
    return (img.src || img.url || img.originalSrc || img.transformedSrc) as string | undefined;
  }

  return undefined;
}

// Helper function to parse search results from MCP response
function parseSearchResults(result: unknown): Product[] {
  console.log("[parseSearchResults] Raw result:", result);

  try {
    // Handle various response formats from Shopify MCP
    let data = result;

    // If result is a string, try to parse it as JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // If it's not JSON, it might be a plain text response
        console.log("[parseSearchResults] Could not parse string as JSON");
        return [];
      }
    }

    // Handle the response structure
    const response = data as Record<string, unknown>;

    // Try to find products array in various possible locations
    let products: unknown[] = [];

    if (Array.isArray(response)) {
      products = response;
    } else if (response?.products && Array.isArray(response.products)) {
      products = response.products;
    } else if (response?.data?.products && Array.isArray(response.data.products)) {
      products = response.data.products;
    } else if (response?.result && Array.isArray(response.result)) {
      products = response.result;
    } else if (response?.content) {
      // MCP tool responses often have a content array
      const content = response.content as unknown[];
      if (Array.isArray(content) && content[0]) {
        const textContent = content[0] as Record<string, unknown>;
        if (textContent.text && typeof textContent.text === "string") {
          try {
            const parsed = JSON.parse(textContent.text);
            if (Array.isArray(parsed)) {
              products = parsed;
            } else if (parsed?.products) {
              products = parsed.products;
            } else if (parsed?.data?.products) {
              products = parsed.data.products;
            }
          } catch {
            console.log("[parseSearchResults] Could not parse content text as JSON");
            return [];
          }
        }
      }
    }

    console.log("[parseSearchResults] Found products array:", products.length);

    // Map products to our Product interface
    return products.map((p: unknown) => {
      const product = p as Record<string, unknown>;

      // Extract price from various formats
      let price: string | undefined;
      if (product.price) {
        price = String(product.price);
      } else if (product.priceRange) {
        const priceRange = product.priceRange as Record<string, unknown>;
        const minPrice = priceRange.minVariantPrice as Record<string, unknown> | undefined;
        if (minPrice?.amount) {
          price = String(minPrice.amount);
        }
      } else if (product.variants && Array.isArray(product.variants) && product.variants[0]) {
        const firstVariant = product.variants[0] as Record<string, unknown>;
        if (firstVariant.price) {
          const variantPrice = firstVariant.price;
          if (typeof variantPrice === "object" && variantPrice !== null) {
            price = String((variantPrice as Record<string, unknown>).amount || variantPrice);
          } else {
            price = String(variantPrice);
          }
        }
      }

      // Extract image from various formats
      let image: string | undefined;
      if (product.image) {
        image = extractImageUrl(product.image);
      } else if (product.featuredImage) {
        image = extractImageUrl(product.featuredImage);
      } else if (product.images) {
        if (Array.isArray(product.images) && product.images.length > 0) {
          const firstImage = product.images[0];
          if (typeof firstImage === "object" && firstImage !== null) {
            const imgObj = firstImage as Record<string, unknown>;
            // Handle edges/node structure from GraphQL
            if (imgObj.edges && Array.isArray(imgObj.edges)) {
              const firstEdge = imgObj.edges[0] as Record<string, unknown>;
              image = extractImageUrl(firstEdge?.node);
            } else {
              image = extractImageUrl(firstImage);
            }
          } else {
            image = extractImageUrl(firstImage);
          }
        } else if (typeof product.images === "object") {
          const imagesObj = product.images as Record<string, unknown>;
          if (imagesObj.edges && Array.isArray(imagesObj.edges) && imagesObj.edges[0]) {
            const firstEdge = imagesObj.edges[0] as Record<string, unknown>;
            image = extractImageUrl(firstEdge?.node);
          }
        }
      }

      const mapped = {
        id: String(product.id || product.product_id || ""),
        title: String(product.title || product.name || ""),
        description: product.description ? String(product.description) : undefined,
        handle: product.handle ? String(product.handle) : undefined,
        vendor: product.vendor ? String(product.vendor) : "Allbirds",
        productType: (product.productType || product.product_type) ? String(product.productType || product.product_type) : undefined,
        price,
        image,
        variants: product.variants && Array.isArray(product.variants) ? (product.variants as unknown[]).map((v: unknown) => {
          const variant = v as Record<string, unknown>;
          let variantPrice = "";
          if (variant.price) {
            if (typeof variant.price === "object" && variant.price !== null) {
              variantPrice = String((variant.price as Record<string, unknown>).amount || "");
            } else {
              variantPrice = String(variant.price);
            }
          }
          return {
            id: String(variant.id || ""),
            title: String(variant.title || ""),
            price: variantPrice,
            available: Boolean(variant.available ?? variant.availableForSale ?? true),
          };
        }) : undefined,
      };

      console.log("[parseSearchResults] Mapped product:", mapped.title, "image:", mapped.image);
      return mapped;
    }).filter((p) => p.id && p.title);
  } catch (e) {
    console.error("Error parsing search results:", e, result);
    return [];
  }
}

// Helper function to parse single product details from MCP response
function parseProductDetails(result: unknown): Product | null {
  console.log("[parseProductDetails] Raw result:", result);

  try {
    let data = result;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return null;
      }
    }

    const response = data as Record<string, unknown>;
    let product: Record<string, unknown> | null = null;

    // Handle various response formats
    if (response?.product) {
      product = response.product as Record<string, unknown>;
    } else if (response?.data?.product) {
      product = response.data.product as Record<string, unknown>;
    } else if (response?.content) {
      const content = response.content as unknown[];
      if (Array.isArray(content) && content[0]) {
        const textContent = content[0] as Record<string, unknown>;
        if (textContent.text && typeof textContent.text === "string") {
          try {
            const parsed = JSON.parse(textContent.text);
            product = parsed.product || parsed;
          } catch {
            return null;
          }
        }
      }
    } else if (response?.id || response?.title) {
      product = response;
    }

    if (!product) return null;

    // Extract price
    let price: string | undefined;
    if (product.price) {
      price = String(product.price);
    } else if (product.priceRange) {
      const priceRange = product.priceRange as Record<string, unknown>;
      const minPrice = priceRange.minVariantPrice as Record<string, unknown> | undefined;
      if (minPrice?.amount) {
        price = String(minPrice.amount);
      }
    }

    // Extract image
    let image: string | undefined;
    if (product.image) {
      image = extractImageUrl(product.image);
    } else if (product.featuredImage) {
      image = extractImageUrl(product.featuredImage);
    } else if (product.images && Array.isArray(product.images) && product.images[0]) {
      image = extractImageUrl(product.images[0]);
    }

    const mapped = {
      id: String(product.id || ""),
      title: String(product.title || ""),
      description: product.description ? String(product.description) : undefined,
      handle: product.handle ? String(product.handle) : undefined,
      vendor: product.vendor ? String(product.vendor) : "Allbirds",
      productType: (product.productType || product.product_type) ? String(product.productType || product.product_type) : undefined,
      price,
      image,
      variants: product.variants && Array.isArray(product.variants) ? (product.variants as unknown[]).map((v: unknown) => {
        const variant = v as Record<string, unknown>;
        let variantPrice = "";
        if (variant.price) {
          if (typeof variant.price === "object" && variant.price !== null) {
            variantPrice = String((variant.price as Record<string, unknown>).amount || "");
          } else {
            variantPrice = String(variant.price);
          }
        }
        return {
          id: String(variant.id || ""),
          title: String(variant.title || ""),
          price: variantPrice,
          available: Boolean(variant.available ?? variant.availableForSale ?? true),
        };
      }) : undefined,
    };

    console.log("[parseProductDetails] Mapped product:", mapped.title, "image:", mapped.image);
    return mapped;
  } catch (e) {
    console.error("Error parsing product details:", e, result);
    return null;
  }
}

interface ShoppingCopilotProps {
  children: React.ReactNode;
}

export function ShoppingCopilot({ children }: ShoppingCopilotProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="shopping_assistant"
    >
      <CopilotActions />
      {children}
    </CopilotKit>
  );
}

export function ChatInterface() {
  return (
    <div className="h-full flex flex-col">
      <GenerativeUI />
      <CopilotChat
        className="flex-1"
        labels={{
          title: "Allbirds Shopping Assistant",
          initial:
            "Hi! I'm your Allbirds shopping assistant. I can help you find sustainable footwear and apparel. What are you looking for today?",
          placeholder: "Ask about products, add to cart, or checkout...",
        }}
      />
    </div>
  );
}
