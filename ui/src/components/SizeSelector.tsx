"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface AvailabilityOption {
  variantId: string;
  size?: string;
  color?: string;
  available: boolean;
  price?: string;
}

interface SizeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: AvailabilityOption) => void;
  productTitle: string;
  productImage?: string;
  productPrice?: string;
  availabilityMatrix: AvailabilityOption[];
}

export function SizeSelector({
  isOpen,
  onClose,
  onSelect,
  productTitle,
  productImage,
  productPrice,
  availabilityMatrix,
}: SizeSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<AvailabilityOption | null>(null);

  // Group by size if sizes exist
  const sizes = [...new Set(availabilityMatrix.map((o) => o.size).filter(Boolean))];
  const colors = [...new Set(availabilityMatrix.map((o) => o.color).filter(Boolean))];

  const handleConfirm = () => {
    if (selectedOption) {
      onSelect(selectedOption);
      onClose();
      setSelectedOption(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedOption(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Select Size</h3>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product info */}
            <div className="px-6 py-4 border-b flex gap-4 items-center">
              {productImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productImage}
                  alt={productTitle}
                  className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{productTitle}</h4>
                {productPrice && (
                  <p className="text-lg font-bold text-gray-900">{formatPrice(productPrice)}</p>
                )}
              </div>
            </div>

            {/* Size options */}
            <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
              {sizes.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">Available Sizes</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availabilityMatrix.map((option) => {
                      const isSelected = selectedOption?.variantId === option.variantId;
                      const label = option.size || option.color || "Default";

                      return (
                        <button
                          key={option.variantId}
                          onClick={() => option.available && setSelectedOption(option)}
                          disabled={!option.available}
                          className={`
                            relative px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                            ${
                              isSelected
                                ? "bg-black text-white ring-2 ring-black ring-offset-2"
                                : option.available
                                ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                : "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                            }
                          `}
                        >
                          {label}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No size options available
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={handleConfirm}
                disabled={!selectedOption}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
              >
                <ShoppingCart className="w-5 h-5" />
                {selectedOption ? `Add Size ${selectedOption.size || selectedOption.color || ""} to Cart` : "Select a Size"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline size selector for agent chat UI
interface InlineSizeSelectorProps {
  productTitle: string;
  productImage?: string;
  productPrice?: string;
  availabilityMatrix: AvailabilityOption[];
  onSelect: (option: AvailabilityOption) => void;
}

export function InlineSizeSelector({
  productTitle,
  productImage,
  productPrice,
  availabilityMatrix,
  onSelect,
}: InlineSizeSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<AvailabilityOption | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const handleSelect = (option: AvailabilityOption) => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onSelect(selectedOption);
      setIsAdded(true);
    }
  };

  if (isAdded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-xl p-4 my-2"
      >
        <div className="flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span className="font-medium">
            Added {productTitle} (Size {selectedOption?.size || selectedOption?.color}) to cart!
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 my-2 shadow-sm"
    >
      {/* Product info */}
      <div className="flex gap-3 items-center mb-4">
        {productImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImage}
            alt={productTitle}
            className="w-14 h-14 object-cover rounded-lg bg-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{productTitle}</h4>
          {productPrice && (
            <p className="text-base font-bold text-gray-900">{formatPrice(productPrice)}</p>
          )}
        </div>
      </div>

      {/* Size selection */}
      <p className="text-sm font-medium text-gray-700 mb-2">Select your size:</p>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {availabilityMatrix.map((option) => {
          const isSelected = selectedOption?.variantId === option.variantId;
          const label = option.size || option.color || "Default";

          return (
            <button
              key={option.variantId}
              onClick={() => option.available && handleSelect(option)}
              disabled={!option.available}
              className={`
                px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? "bg-black text-white"
                    : option.available
                    ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedOption}
        className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedOption ? `Add to Cart` : "Select a size first"}
      </button>
    </motion.div>
  );
}
