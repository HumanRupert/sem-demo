"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  ShieldQuestion,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "checkout" | "payment" | "dispute" | "verification";
}

const statusConfig: Record<string, Record<string, { icon: React.ElementType; className: string; label: string }>> = {
  checkout: {
    pending: { icon: Clock, className: "bg-gray-100 text-gray-700", label: "Pending" },
    completed: { icon: CheckCircle, className: "bg-green-100 text-green-700", label: "Completed" },
    declined: { icon: XCircle, className: "bg-red-100 text-red-700", label: "Declined" },
    challenged: { icon: ShieldQuestion, className: "bg-yellow-100 text-yellow-700", label: "Challenged" },
    abandoned: { icon: Ban, className: "bg-gray-100 text-gray-500", label: "Abandoned" },
    disputed: { icon: AlertTriangle, className: "bg-orange-100 text-orange-700", label: "Disputed" },
  },
  payment: {
    pending: { icon: Clock, className: "bg-gray-100 text-gray-700", label: "Pending" },
    authorized: { icon: CheckCircle, className: "bg-blue-100 text-blue-700", label: "Authorized" },
    captured: { icon: CheckCircle, className: "bg-green-100 text-green-700", label: "Captured" },
    failed: { icon: XCircle, className: "bg-red-100 text-red-700", label: "Failed" },
    refunded: { icon: AlertTriangle, className: "bg-orange-100 text-orange-700", label: "Refunded" },
  },
  dispute: {
    none: { icon: CheckCircle, className: "bg-gray-100 text-gray-500", label: "None" },
    opened: { icon: AlertTriangle, className: "bg-red-100 text-red-700", label: "Opened" },
    represented: { icon: Clock, className: "bg-yellow-100 text-yellow-700", label: "Represented" },
    won: { icon: CheckCircle, className: "bg-green-100 text-green-700", label: "Won" },
    lost: { icon: XCircle, className: "bg-red-100 text-red-700", label: "Lost" },
  },
  verification: {
    verified: { icon: CheckCircle, className: "bg-green-100 text-green-700", label: "Verified" },
    failed: { icon: XCircle, className: "bg-red-100 text-red-700", label: "Failed" },
    skipped: { icon: Ban, className: "bg-gray-100 text-gray-500", label: "Skipped" },
    pending: { icon: Clock, className: "bg-gray-100 text-gray-700", label: "Pending" },
  },
};

export function StatusBadge({ status, type = "checkout" }: StatusBadgeProps) {
  const config = statusConfig[type]?.[status] || statusConfig.checkout.pending;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
