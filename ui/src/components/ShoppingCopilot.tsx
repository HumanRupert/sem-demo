"use client";

import { useEffect, useRef } from "react";
import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
  useRenderToolCall,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCart } from "@/context/CartContext";
import { ProductCard, Product } from "./ProductCard";
import { ProductCarousel } from "./ProductCarousel";
import { AvailabilityOption, InlineSizeSelector } from "./SizeSelector";
import { motion } from "framer-motion";

// =============================================================================
// LOGGING
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development' || true; // Enable for debugging

function log(category: string, message: string, data?: unknown) {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`[${timestamp}] [${category}]`, message, data !== undefined ? data : '');
  }
}

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

  // Show size selector action - renders a UI for user to select size
  useCopilotAction({
    name: "showSizeSelector",
    description:
      "Show a size selection UI for products that have multiple sizes. Use this instead of addToCart when the product has an availabilityMatrix with sizes. After the user selects a size, the item will be added to cart automatically.",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "The unique ID of the product",
        required: true,
      },
      {
        name: "title",
        type: "string",
        description: "The product title",
        required: true,
      },
      {
        name: "price",
        type: "string",
        description: "The product price",
        required: true,
      },
      {
        name: "image",
        type: "string",
        description: "URL of the product image",
        required: false,
      },
      {
        name: "availabilityMatrix",
        type: "object[]",
        description:
          "Array of size options: [{variantId, size, color, available, price}]",
        required: true,
      },
    ],
    render: ({ args, status }) => {
      if (status === "executing" || status === "complete") {
        const { productId, title, price, image, availabilityMatrix } = args as {
          productId: string;
          title: string;
          price: string;
          image?: string;
          availabilityMatrix: AvailabilityOption[];
        };

        const handleSizeSelect = (option: AvailabilityOption) => {
          const priceNum = parseFloat(option.price || price || "0") || 0;
          addItem({
            productId,
            variantId: option.variantId,
            title,
            variantTitle: option.size || option.color,
            price: priceNum,
            image,
          });
        };

        return (
          <InlineSizeSelector
            productTitle={title}
            productImage={image}
            productPrice={price}
            availabilityMatrix={availabilityMatrix}
            onSelect={handleSizeSelect}
          />
        );
      }
      return <></>;
    },
    handler: async () => {
      return "Size selector shown. Please select a size to add the item to cart.";
    },
  });

  return null;
}

// Generative UI hooks for agent tools
function GenerativeUI() {
  const { addItem } = useCart();

  // Handle add to cart from product cards (no size selection)
  const handleAddToCart = (product: Product) => {
    // Parse price from string (handle ranges like "98-120")
    const priceStr = product.price || "0";
    const price = parseFloat(priceStr.split("-")[0]) || 0;

    log('CART', 'Adding to cart (no size)', { productId: product.id, title: product.title, price });

    addItem({
      productId: product.id,
      variantId: product.variantId || product.id,
      title: product.title,
      variantTitle: product.productType,
      price,
      image: product.imageUrl || product.image,
    });
  };

  // Handle add to cart with size selection
  const handleAddToCartWithSize = (product: Product, option: AvailabilityOption) => {
    const priceStr = option.price || product.price || "0";
    const price = parseFloat(priceStr.split("-")[0]) || 0;

    log('CART', 'Adding to cart with size', {
      productId: product.id,
      title: product.title,
      size: option.size,
      color: option.color,
      variantId: option.variantId,
      price
    });

    addItem({
      productId: product.id,
      variantId: option.variantId,
      title: product.title,
      variantTitle: option.size || option.color || product.productType,
      price,
      image: product.imageUrl || product.image,
    });
  };

  // Render search_products tool results as a product grid
  // This tool returns LLM-filtered results for relevance
  useRenderToolCall({
    name: "search_products",
    render: ({ status, result }) => {
      log('TOOL', `search_products - status: ${status}`, { resultType: typeof result, hasResult: !!result });

      // Only show our custom UI when we have results
      // This prevents the duplicate spinner issue - let CopilotChat handle loading
      if (!result) {
        return <></>; // Let CopilotChat show default loading
      }

      // Parse the result to extract products
      const products = parseSearchResults(result);

      if (!products || products.length === 0) {
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
          <ProductCarousel
            products={products}
            onAddToCart={handleAddToCart}
            onAddToCartWithSize={handleAddToCartWithSize}
          />
        </motion.div>
      );
    },
  });

  // Render get_product_details tool results as a single product card
  useRenderToolCall({
    name: "get_product_details",
    render: ({ status, result }) => {
      log('TOOL', `get_product_details - status: ${status}`, { hasResult: !!result });

      // Only show our custom UI when we have results
      if (!result) {
        return <></>; // Let CopilotChat show default loading
      }

      const product = parseProductDetails(result);

      if (!product) {
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
          <ProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onAddToCartWithSize={handleAddToCartWithSize}
          />
        </motion.div>
      );
    },
  });

  // Render browse_full_catalog tool results as a product carousel
  // This tool is used by contextual_shopping_agent for gift/recommendation queries
  useRenderToolCall({
    name: "browse_full_catalog",
    render: ({ status, result }) => {
      log('TOOL', `browse_full_catalog - status: ${status}`, { hasResult: !!result });

      // Only show our custom UI when we have results
      if (!result) {
        return <></>; // Let CopilotChat show default loading
      }

      // Parse using the same function as search_products
      const products = parseSearchResults(result);
      log('TOOL', `browse_full_catalog parsed ${products.length} products`);

      if (!products || products.length === 0) {
        return (
          <div className="p-4 bg-gray-50 rounded-xl my-2 text-gray-500">
            No products available in catalog.
          </div>
        );
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4"
        >
          <ProductCarousel
            products={products}
            onAddToCart={handleAddToCart}
            onAddToCartWithSize={handleAddToCartWithSize}
          />
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
    // Try various common field names for image URLs
    return (img.url || img.src || img.originalSrc || img.transformedSrc ||
            img.imageUrl || img.image_url) as string | undefined;
  }

  return undefined;
}

// Helper function to parse search results from search_products tool
// The custom search_products tool returns:
// - products: array of filtered products
// - total_found: total products from MCP
// - total_relevant: filtered count
// - query: the search query
function parseSearchResults(result: unknown): Product[] {
  log('PARSE', 'parseSearchResults input', { type: typeof result });

  try {
    let data = result;

    // If result is a string, try to parse it as JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        log('PARSE', 'Could not parse string as JSON');
        return [];
      }
    }

    const response = data as Record<string, unknown>;

    // Try to find products array in various possible locations
    let products: unknown[] = [];

    // First check for our custom search_products tool response format
    if (response?.products && Array.isArray(response.products)) {
      products = response.products;
      log('PARSE', `Found ${products.length} relevant products out of ${response.total_found || 'unknown'} total`);
    } else if (Array.isArray(response)) {
      products = response;
    } else if (response?.data && typeof response.data === 'object') {
      const dataObj = response.data as Record<string, unknown>;
      if (dataObj.products && Array.isArray(dataObj.products)) {
        products = dataObj.products;
      }
    } else if (response?.result && Array.isArray(response.result)) {
      products = response.result;
    } else if (response?.content) {
      // MCP tool responses have a content array with text
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
            } else if (parsed?.result && Array.isArray(parsed.result)) {
              products = parsed.result;
            }
          } catch {
            log('PARSE', 'Could not parse content text as JSON');
            return [];
          }
        }
      }
    }

    log('PARSE', `Found products array: ${products.length}`);
    // Log first product structure for debugging
    if (products.length > 0) {
      const firstProduct = products[0] as Record<string, unknown>;
      log('PARSE', 'First product keys', Object.keys(firstProduct));
      log('PARSE', 'First product structure', { availabilityMatrix: firstProduct.availabilityMatrix, variants: firstProduct.variants });
    }

    // Map products to our Product interface
    // Shopify Storefront MCP response fields:
    // - product_id, title, description, url, image_url
    // - price_range: { min, max, currency }
    // - product_type, availabilityMatrix, options, tags
    return products.map((p: unknown) => {
      const product = p as Record<string, unknown>;

      // Extract price - Shopify MCP uses price_range object
      let price: string | undefined;
      if (product.price_range) {
        const priceRange = product.price_range as Record<string, unknown>;
        const minPrice = priceRange.min ? String(priceRange.min) : undefined;
        const maxPrice = priceRange.max ? String(priceRange.max) : undefined;
        if (minPrice && maxPrice && minPrice !== maxPrice) {
          // Show price range if different
          price = `${minPrice}-${maxPrice}`;
        } else {
          price = minPrice;
        }
      } else if (product.price !== undefined) {
        price = String(product.price);
      } else if (product.priceRange) {
        // Fallback for different format
        const priceRange = product.priceRange as Record<string, unknown>;
        const minPrice = priceRange.minVariantPrice as Record<string, unknown> | undefined;
        if (minPrice?.amount) {
          price = String(minPrice.amount);
        }
      }

      // Extract currency
      let currency: string | undefined;
      if (product.price_range) {
        const priceRange = product.price_range as Record<string, unknown>;
        currency = priceRange.currency ? String(priceRange.currency) : undefined;
      } else if (product.currency) {
        currency = String(product.currency);
      }

      // Extract image URL - Shopify MCP uses image_url
      let imageUrl: string | undefined;
      if (product.image_url) {
        imageUrl = String(product.image_url);
      } else if (product.imageUrl) {
        imageUrl = String(product.imageUrl);
      } else if (product.image) {
        imageUrl = extractImageUrl(product.image);
      } else if (product.featuredImage) {
        imageUrl = extractImageUrl(product.featuredImage);
      } else if (product.images && Array.isArray(product.images) && product.images[0]) {
        imageUrl = extractImageUrl(product.images[0]);
      }

      // Extract product URL - Shopify MCP uses url
      let productUrl: string | undefined;
      if (product.url) {
        productUrl = String(product.url);
      } else if (product.productUrl) {
        productUrl = String(product.productUrl);
      } else if (product.product_url) {
        productUrl = String(product.product_url);
      }

      // Extract variant ID
      let variantId: string | undefined;
      if (product.variantId) {
        variantId = String(product.variantId);
      } else if (product.variant_id) {
        variantId = String(product.variant_id);
      }

      // Extract availability matrix for size selection
      let availabilityMatrix: AvailabilityOption[] | undefined;

      // First check for direct availabilityMatrix from MCP
      // Note: MCP returns availabilityMatrix as array of SIZE STRINGS for shoes (e.g., ["8", "8.5", "9"])
      // or as array of objects for other products
      if (product.availabilityMatrix && Array.isArray(product.availabilityMatrix)) {
        const firstItem = product.availabilityMatrix[0];

        if (typeof firstItem === 'string') {
          // Array of size strings - convert to AvailabilityOption format
          availabilityMatrix = (product.availabilityMatrix as string[]).map((size: string, idx: number) => ({
            variantId: `size-${idx}-${size}`,
            size: size,
            color: undefined,
            available: true, // Assume available if in the list
            price: price, // Use product price
          }));
        } else {
          // Array of objects
          availabilityMatrix = (product.availabilityMatrix as unknown[]).map((item: unknown) => {
            const opt = item as Record<string, unknown>;
            return {
              variantId: String(opt.variantId || opt.variant_id || ""),
              size: opt.size ? String(opt.size) : undefined,
              color: opt.color ? String(opt.color) : undefined,
              available: Boolean(opt.available ?? true),
              price: opt.price ? String(opt.price) : undefined,
            };
          });
        }
      }

      // If no availabilityMatrix, try to extract from various possible field names
      // Check: variants, available_sizes, size_options, options
      const variantsData = product.variants || product.available_variants || product.variant_options;

      if (!availabilityMatrix && variantsData && Array.isArray(variantsData)) {
        availabilityMatrix = (variantsData as unknown[]).map((v: unknown) => {
          const variant = v as Record<string, unknown>;

          // Parse size/color from variant title (e.g., "10 / Natural Black", "M", "Large / Blue")
          const title = String(variant.title || variant.name || "");
          let size: string | undefined;
          let color: string | undefined;

          if (title.includes("/") || title.includes(" - ")) {
            // Format: "Size / Color" or "Size - Color"
            const parts = title.split(/\s*[\/\-]\s*/);
            size = parts[0]?.trim();
            color = parts[1]?.trim();
          } else if (title.trim()) {
            // Single value - treat as size (most common for footwear)
            size = title.trim();
          }

          // Also check for explicit size/color fields
          if (!size && variant.size) size = String(variant.size);
          if (!color && variant.color) color = String(variant.color);

          // Extract price
          let variantPrice: string | undefined;
          if (variant.price !== undefined) {
            variantPrice = String(variant.price);
          }

          return {
            variantId: String(variant.id || variant.variantId || variant.variant_id || ""),
            size,
            color,
            available: Boolean(variant.available ?? variant.availableForSale ?? variant.in_stock ?? true),
            price: variantPrice,
          };
        }).filter(opt => opt.variantId); // Filter out invalid entries
      }

      // Also try to build from available_sizes array (simple string array of sizes)
      if (!availabilityMatrix || availabilityMatrix.length === 0) {
        const availableSizes = product.available_sizes || product.sizes || product.size_options;
        if (availableSizes && Array.isArray(availableSizes)) {
          availabilityMatrix = (availableSizes as unknown[]).map((s: unknown, idx: number): AvailabilityOption | null => {
            if (typeof s === 'string') {
              return {
                variantId: `size-${idx}`,
                size: s,
                available: true,
              };
            } else if (typeof s === 'object' && s !== null) {
              const sizeObj = s as Record<string, unknown>;
              const opt: AvailabilityOption = {
                variantId: String(sizeObj.id || sizeObj.variant_id || `size-${idx}`),
                available: Boolean(sizeObj.available ?? sizeObj.in_stock ?? true),
              };
              if (sizeObj.size) opt.size = String(sizeObj.size);
              else if (sizeObj.value) opt.size = String(sizeObj.value);
              if (sizeObj.color) opt.color = String(sizeObj.color);
              if (sizeObj.price) opt.price = String(sizeObj.price);
              return opt;
            }
            return null;
          }).filter((opt): opt is AvailabilityOption => opt !== null && (!!opt.size || !!opt.color));
        }
      }

      const mapped: Product = {
        id: String(product.product_id || product.id || product.variantId || ""),
        title: String(product.title || product.name || ""),
        description: product.description ? String(product.description) : undefined,
        handle: product.handle ? String(product.handle) : undefined,
        vendor: product.vendor ? String(product.vendor) : undefined,
        productType: (product.productType || product.product_type) ? String(product.productType || product.product_type) : undefined,
        price,
        currency: product.currency ? String(product.currency) : undefined,
        imageUrl, // Direct image URL from Storefront MCP
        productUrl, // Direct product URL from Storefront MCP
        variantId, // Variant ID for cart operations
        availabilityMatrix, // Size/color availability for selection
        variants: product.variants && Array.isArray(product.variants) ? (product.variants as unknown[]).map((v: unknown) => {
          const variant = v as Record<string, unknown>;
          let variantPrice = "";
          if (variant.price !== undefined) {
            variantPrice = String(variant.price);
          }
          return {
            id: String(variant.id || variant.variantId || ""),
            title: String(variant.title || ""),
            price: variantPrice,
            available: Boolean(variant.available ?? variant.availableForSale ?? true),
          };
        }) : undefined,
      };

      log('PARSE', `Mapped: ${mapped.title}`, { sizes: mapped.availabilityMatrix?.length || 0 });
      return mapped;
    }).filter((p) => p.id || p.title);
  } catch (e) {
    log('ERROR', 'Error parsing search results', e);
    return [];
  }
}

// Helper function to parse single product details from Storefront MCP response
function parseProductDetails(result: unknown): Product | null {
  log('PARSE', 'parseProductDetails input', { type: typeof result });

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
    } else if (response?.data && typeof response.data === 'object') {
      const dataObj = response.data as Record<string, unknown>;
      if (dataObj.product) {
        product = dataObj.product as Record<string, unknown>;
      }
    }

    if (!product && response?.content) {
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
    } else if (response?.id || response?.title || response?.name) {
      product = response;
    }

    if (!product) return null;

    // Extract price - Storefront MCP provides price directly
    let price: string | undefined;
    if (product.price !== undefined) {
      price = String(product.price);
    } else if (product.priceRange) {
      const priceRange = product.priceRange as Record<string, unknown>;
      const minPrice = priceRange.minVariantPrice as Record<string, unknown> | undefined;
      if (minPrice?.amount) {
        price = String(minPrice.amount);
      }
    }

    // Extract image URL - Storefront MCP provides imageUrl directly
    let imageUrl: string | undefined;
    if (product.imageUrl) {
      imageUrl = String(product.imageUrl);
    } else if (product.image_url) {
      imageUrl = String(product.image_url);
    } else if (product.image) {
      imageUrl = extractImageUrl(product.image);
    } else if (product.featuredImage) {
      imageUrl = extractImageUrl(product.featuredImage);
    } else if (product.images && Array.isArray(product.images) && product.images[0]) {
      imageUrl = extractImageUrl(product.images[0]);
    }

    // Extract product URL - Storefront MCP provides productUrl directly
    let productUrl: string | undefined;
    if (product.productUrl) {
      productUrl = String(product.productUrl);
    } else if (product.product_url) {
      productUrl = String(product.product_url);
    } else if (product.url) {
      productUrl = String(product.url);
    }

    // Extract variant ID
    let variantId: string | undefined;
    if (product.variantId) {
      variantId = String(product.variantId);
    } else if (product.variant_id) {
      variantId = String(product.variant_id);
    }

    // Extract availability matrix for size selection
    let availabilityMatrix: AvailabilityOption[] | undefined;

    // First check for direct availabilityMatrix from MCP
    // Note: MCP returns availabilityMatrix as array of SIZE STRINGS for shoes (e.g., ["8", "8.5", "9"])
    // or as array of objects for other products
    if (product.availabilityMatrix && Array.isArray(product.availabilityMatrix)) {
      const firstItem = product.availabilityMatrix[0];

      if (typeof firstItem === 'string') {
        // Array of size strings - convert to AvailabilityOption format
        availabilityMatrix = (product.availabilityMatrix as string[]).map((size: string, idx: number) => ({
          variantId: `size-${idx}-${size}`,
          size: size,
          color: undefined,
          available: true, // Assume available if in the list
          price: price, // Use product price
        }));
      } else {
        // Array of objects
        availabilityMatrix = (product.availabilityMatrix as unknown[]).map((item: unknown) => {
          const opt = item as Record<string, unknown>;
          return {
            variantId: String(opt.variantId || opt.variant_id || ""),
            size: opt.size ? String(opt.size) : undefined,
            color: opt.color ? String(opt.color) : undefined,
            available: Boolean(opt.available ?? true),
            price: opt.price ? String(opt.price) : undefined,
          };
        });
      }
    }

    // If no availabilityMatrix, try to extract from various possible field names
    const variantsData = product.variants || product.available_variants || product.variant_options;

    if (!availabilityMatrix && variantsData && Array.isArray(variantsData)) {
      availabilityMatrix = (variantsData as unknown[]).map((v: unknown) => {
        const variant = v as Record<string, unknown>;

        // Parse size/color from variant title (e.g., "10 / Natural Black", "M", "Large / Blue")
        const title = String(variant.title || variant.name || "");
        let size: string | undefined;
        let color: string | undefined;

        if (title.includes("/") || title.includes(" - ")) {
          // Format: "Size / Color" or "Size - Color"
          const parts = title.split(/\s*[\/\-]\s*/);
          size = parts[0]?.trim();
          color = parts[1]?.trim();
        } else if (title.trim()) {
          // Single value - treat as size (most common for footwear)
          size = title.trim();
        }

        // Also check for explicit size/color fields
        if (!size && variant.size) size = String(variant.size);
        if (!color && variant.color) color = String(variant.color);

        // Extract price
        let variantPrice: string | undefined;
        if (variant.price !== undefined) {
          variantPrice = String(variant.price);
        }

        return {
          variantId: String(variant.id || variant.variantId || variant.variant_id || ""),
          size,
          color,
          available: Boolean(variant.available ?? variant.availableForSale ?? variant.in_stock ?? true),
          price: variantPrice,
        };
      }).filter(opt => opt.variantId); // Filter out invalid entries
    }

    // Also try to build from available_sizes array (simple string array of sizes)
    if (!availabilityMatrix || availabilityMatrix.length === 0) {
      const availableSizes = product.available_sizes || product.sizes || product.size_options;
      if (availableSizes && Array.isArray(availableSizes)) {
        availabilityMatrix = (availableSizes as unknown[]).map((s: unknown, idx: number): AvailabilityOption | null => {
          if (typeof s === 'string') {
            return {
              variantId: `size-${idx}`,
              size: s,
              available: true,
            };
          } else if (typeof s === 'object' && s !== null) {
            const sizeObj = s as Record<string, unknown>;
            const opt: AvailabilityOption = {
              variantId: String(sizeObj.id || sizeObj.variant_id || `size-${idx}`),
              available: Boolean(sizeObj.available ?? sizeObj.in_stock ?? true),
            };
            if (sizeObj.size) opt.size = String(sizeObj.size);
            else if (sizeObj.value) opt.size = String(sizeObj.value);
            if (sizeObj.color) opt.color = String(sizeObj.color);
            if (sizeObj.price) opt.price = String(sizeObj.price);
            return opt;
          }
          return null;
        }).filter((opt): opt is AvailabilityOption => opt !== null && (!!opt.size || !!opt.color));
      }
    }

    const mapped: Product = {
      id: String(product.id || product.variantId || ""),
      title: String(product.title || product.name || ""),
      description: product.description ? String(product.description) : undefined,
      handle: product.handle ? String(product.handle) : undefined,
      vendor: product.vendor ? String(product.vendor) : undefined,
      productType: (product.productType || product.product_type) ? String(product.productType || product.product_type) : undefined,
      price,
      currency: product.currency ? String(product.currency) : undefined,
      imageUrl,
      productUrl,
      variantId,
      availabilityMatrix,
      variants: product.variants && Array.isArray(product.variants) ? (product.variants as unknown[]).map((v: unknown) => {
        const variant = v as Record<string, unknown>;
        let variantPrice = "";
        if (variant.price !== undefined) {
          variantPrice = String(variant.price);
        }
        return {
          id: String(variant.id || variant.variantId || ""),
          title: String(variant.title || ""),
          price: variantPrice,
          available: Boolean(variant.available ?? variant.availableForSale ?? true),
        };
      }) : undefined,
    };

    log('PARSE', `Mapped product: ${mapped.title}`, { imageUrl: !!mapped.imageUrl, productUrl: !!mapped.productUrl });
    return mapped;
  } catch (e) {
    log('ERROR', 'Error parsing product details', e);
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Find the messages container within CopilotChat
    const findMessagesContainer = (): HTMLElement | null => {
      // CopilotChat renders messages in a scrollable container
      // We look for common patterns in the DOM structure
      const possibleContainers = container.querySelectorAll('[class*="messages"], [class*="Messages"], [class*="chat"], [class*="Chat"]');
      for (const el of possibleContainers) {
        if (el.scrollHeight > el.clientHeight || el.children.length > 0) {
          return el as HTMLElement;
        }
      }
      // Fallback: find any scrollable element
      const allDivs = container.querySelectorAll('div');
      for (const div of allDivs) {
        const style = window.getComputedStyle(div);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return div as HTMLElement;
        }
      }
      return null;
    };

    const scrollToBottom = (element: HTMLElement) => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    };

    // Set up MutationObserver to watch for new messages
    const observer = new MutationObserver((mutations) => {
      const messagesContainer = findMessagesContainer();
      if (messagesContainer) {
        // Small delay to ensure content is rendered
        requestAnimationFrame(() => {
          scrollToBottom(messagesContainer);
        });
      }
    });

    // Start observing
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial scroll to bottom
    setTimeout(() => {
      const messagesContainer = findMessagesContainer();
      if (messagesContainer) {
        scrollToBottom(messagesContainer);
      }
    }, 500);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={chatContainerRef} className="h-full flex flex-col chat-auto-scroll">
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
