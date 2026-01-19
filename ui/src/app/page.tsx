"use client";

import { ShoppingBag, MessageCircle, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ChatInterface } from "@/components/ShoppingCopilot";
import { motion } from "framer-motion";

export default function Home() {
  const { totalItems, toggleCart } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Allbirds</h1>
                <p className="text-xs text-gray-500 font-medium">AI Shopping Assistant</p>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg"
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-emerald-100 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Shopping Experience
            </motion.div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Shop with your personal AI assistant
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-base">
              Search for products, get recommendations, add items to your cart,
              and checkout — all through natural conversation.
            </p>
          </motion.div>

          {/* Chat Interface */}
          <div className="flex-1 px-4 pb-6 min-h-[500px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 h-full overflow-hidden"
            >
              <ChatInterface />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1">
            <span className="text-sm text-gray-400">Powered by</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-default">Semantic Pay</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-default">Google ADK</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-default">CopilotKit</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-default">Shopify MCP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
