"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { ExternalLink, Plus } from "lucide-react";
import { SizeSelector, AvailabilityOption } from "./SizeSelector";

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  available: boolean;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  handle?: string;
  vendor?: string;
  productType?: string;
  price?: string;
  currency?: string;
  compareAtPrice?: string;
  image?: string;
  imageUrl?: string; // Direct image URL from Storefront MCP
  images?: string[];
  productUrl?: string; // Direct product URL from Storefront MCP
  variantId?: string; // Variant ID for cart operations
  variants?: ProductVariant[];
  availabilityMatrix?: AvailabilityOption[]; // Size/color availability from MCP
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
  onAddToCartWithSize?: (product: Product, option: AvailabilityOption) => void;
}

export function ProductCard({ product, onAddToCart, onAddToCartWithSize }: ProductCardProps) {
  const [isSizeSelectorOpen, setIsSizeSelectorOpen] = useState(false);
  const price = product.price || product.variants?.[0]?.price || "0";

  // Use imageUrl from Storefront MCP first, then fallback to other image fields
  const imageUrl =
    product.imageUrl ||
    product.image ||
    product.images?.[0] ||
    "https://cdn.shopify.com/s/files/1/0018/0819/6657/files/placeholder.png";

  // Use productUrl from Storefront MCP directly, or construct from handle
  const productUrl = product.productUrl ||
    (product.handle ? `https://www.allbirds.com/products/${product.handle}` :
    `https://www.allbirds.com/search?q=${encodeURIComponent(product.title)}`);

  // Check if product has size options
  const hasAvailabilityMatrix = product.availabilityMatrix && product.availabilityMatrix.length > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasAvailabilityMatrix) {
      // Open size selector modal
      setIsSizeSelectorOpen(true);
    } else {
      // Add directly to cart
      onAddToCart?.(product);
    }
  };

  const handleSizeSelect = (option: AvailabilityOption) => {
    if (onAddToCartWithSize) {
      onAddToCartWithSize(product, option);
    } else if (onAddToCart) {
      // Fallback: create a variant-like object
      onAddToCart(product, {
        id: option.variantId,
        title: option.size || option.color || "Default",
        price: option.price || price,
        available: option.available,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300"
    >
      {/* Product type badge */}
      {product.productType && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {product.productType}
          </span>
        </div>
      )}

      {/* Sale badge */}
      {product.compareAtPrice && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            SALE
          </span>
        </div>
      )}

      {/* Clickable image area */}
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://cdn.shopify.com/s/files/1/0018/0819/6657/files/placeholder.png";
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </a>

      <div className="flex flex-col flex-1 p-4">
        {product.vendor && (
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
            {product.vendor}
          </p>
        )}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-tight">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price section */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Size/variant info */}
        {hasAvailabilityMatrix && (
          <p className="text-xs text-gray-400 mb-3">
            {product.availabilityMatrix!.filter(o => o.available).length} sizes available
          </p>
        )}
        {!hasAvailabilityMatrix && product.variants && product.variants.length > 1 && (
          <p className="text-xs text-gray-400 mb-3">
            {product.variants.length} options available
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </a>
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            {hasAvailabilityMatrix ? "Select Size" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Size Selector Modal */}
      {hasAvailabilityMatrix && (
        <SizeSelector
          isOpen={isSizeSelectorOpen}
          onClose={() => setIsSizeSelectorOpen(false)}
          onSelect={handleSizeSelect}
          productTitle={product.title}
          productImage={imageUrl}
          productPrice={price}
          availabilityMatrix={product.availabilityMatrix!}
        />
      )}
    </motion.div>
  );
}

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
  onAddToCartWithSize?: (product: Product, option: AvailabilityOption) => void;
}

export function ProductGrid({ products, onAddToCart, onAddToCartWithSize }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found. Try a different search.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onAddToCartWithSize={onAddToCartWithSize}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
