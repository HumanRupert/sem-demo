"use client";

import { ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ChatInterface } from "@/components/ShoppingCopilot";
import { motion } from "framer-motion";

export default function Home() {
  const { totalItems, toggleCart } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">Allbirds</h1>
                <p className="text-xs text-gray-500">AI Shopping Assistant</p>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              AI-Powered Shopping
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              Shop with your personal AI assistant
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Search for products, get recommendations, add items to your cart,
              and checkout — all through natural conversation.
            </p>
          </motion.div>

          {/* Chat Interface */}
          <div className="flex-1 px-4 pb-4 min-h-[500px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border h-full overflow-hidden"
            >
              <ChatInterface />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Demo powered by{" "}
            <span className="font-medium">Semantic Pay</span> ·{" "}
            <span className="font-medium">Google ADK</span> ·{" "}
            <span className="font-medium">CopilotKit</span> ·{" "}
            <span className="font-medium">Shopify MCP</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
