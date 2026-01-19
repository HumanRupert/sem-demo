import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  const priceStr = String(price);

  // Handle price ranges like "98.0-120.0"
  if (priceStr.includes('-')) {
    const [min, max] = priceStr.split('-');
    const minFormatted = formatSinglePrice(min);
    const maxFormatted = formatSinglePrice(max);
    return `${minFormatted} - ${maxFormatted}`;
  }

  return formatSinglePrice(priceStr);
}

function formatSinglePrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numPrice);
}
