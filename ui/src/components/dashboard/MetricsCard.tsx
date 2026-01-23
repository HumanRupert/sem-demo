"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant = "default",
}: MetricsCardProps) {
  const variantStyles = {
    default: "bg-white",
    success: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100",
    warning: "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100",
    danger: "bg-gradient-to-br from-red-50 to-rose-50 border-red-100",
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4" />;
    return trend > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-gray-500";
    return trend > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gray-100 rounded-xl">{icon}</div>
        )}
      </div>

      {trend !== undefined && (
        <div className={cn("mt-4 flex items-center gap-2", getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-sm text-gray-500">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
