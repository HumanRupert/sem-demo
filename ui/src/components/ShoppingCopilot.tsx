"use client";

import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCart } from "@/context/CartContext";
import { ProductGrid, Product } from "./ProductCard";

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

// Component to render product search results
function ProductSearchResults({ products }: { products: Product[] }) {
  return (
    <div className="my-4">
      <ProductGrid products={products} />
    </div>
  );
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
