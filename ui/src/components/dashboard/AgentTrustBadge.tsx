"use client";

import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentTrustBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function AgentTrustBadge({
  level,
  size = "md",
  showLabel = true,
}: AgentTrustBadgeProps) {
  const config = {
    trusted: {
      icon: ShieldCheck,
      label: "Trusted",
      className: "bg-green-100 text-green-700 border-green-200",
      iconClassName: "text-green-600",
    },
    probation: {
      icon: ShieldAlert,
      label: "Probation",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      iconClassName: "text-yellow-600",
    },
    blocked: {
      icon: ShieldX,
      label: "Blocked",
      className: "bg-red-100 text-red-700 border-red-200",
      iconClassName: "text-red-600",
    },
  };

  const { icon: Icon, label, className, iconClassName } =
    config[level as keyof typeof config] || config.probation;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        className,
        sizeStyles[size]
      )}
    >
      <Icon className={cn(iconSizes[size], iconClassName)} />
      {showLabel && label}
    </span>
  );
}
