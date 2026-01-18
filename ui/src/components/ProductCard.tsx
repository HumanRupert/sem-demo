"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";

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
  compareAtPrice?: string;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = product.price || product.variants?.[0]?.price || "0";
  const imageUrl =
    product.image ||
    product.images?.[0] ||
    "https://cdn.shopify.com/s/files/1/0018/0819/6657/files/placeholder.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300"
    >
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.compareAtPrice && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Sale
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        {product.vendor && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.vendor}
          </p>
        )}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
        {product.variants && product.variants.length > 1 && (
          <p className="text-xs text-gray-400 mt-2">
            {product.variants.length} options available
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
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
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </motion.div>
      ))}
    </motion.div>
  );
}
