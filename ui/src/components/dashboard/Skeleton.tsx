'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const baseClasses = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

  const variantClasses = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
    />
  );
}

// Preset skeleton layouts
export function MetricsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${height}`}>
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="h-[calc(100%-2rem)] flex items-end gap-2 pt-4">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton key={i} className={`flex-1`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
