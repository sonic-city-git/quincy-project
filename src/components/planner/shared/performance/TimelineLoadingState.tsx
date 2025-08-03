/**
 * CONSOLIDATED: TimelineLoadingState - Eliminates loading UI duplication
 * 
 * Replaces custom loading states across planner components
 * Provides consistent loading UX for timeline operations
 */

import { ReactNode } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/resources/shared/LoadingSpinner";

export interface TimelineLoadingProps {
  // Loading state
  isLoading: boolean;
  
  // Content
  children: ReactNode;
  
  // Loading customization
  resourceType?: 'equipment' | 'crew';
  loadingTitle?: string;
  loadingSubtitle?: string;
  variant?: 'spinner' | 'skeleton' | 'timeline';
  
  // Size
  height?: string | number;
  className?: string;
}

/**
 * Unified loading state component for timeline components
 */
export function TimelineLoadingState({
  isLoading,
  children,
  resourceType = 'equipment',
  loadingTitle,
  loadingSubtitle,
  variant = 'spinner',
  height = '24rem',
  className = ''
}: TimelineLoadingProps) {
  
  if (!isLoading) {
    return <>{children}</>;
  }

  const defaultTitle = loadingTitle || `Loading ${resourceType} timeline...`;
  const defaultSubtitle = loadingSubtitle || 'Loading booking data and availability...';

  // Render based on variant
  switch (variant) {
    case 'skeleton':
      return (
        <div className={`border border-border rounded-lg overflow-hidden bg-background ${className}`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-64" />
                  <div className="flex gap-1">
                    {Array.from({ length: 14 }).map((_, j) => (
                      <Skeleton key={j} className="h-12 w-8" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className={`border border-border rounded-lg overflow-hidden bg-background ${className}`}>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 text-lg font-medium">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                {defaultTitle}
              </div>
              <p className="text-sm text-muted-foreground">
                {defaultSubtitle}
              </p>
              <div className="flex justify-center gap-1 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'spinner':
    default:
      return (
        <div className={`border border-border rounded-lg overflow-hidden bg-background ${className}`}>
          <div className="flex items-center justify-center" style={{ height }}>
            <LoadingSpinner 
              message={defaultTitle}
              size="lg"
            />
          </div>
        </div>
      );
  }
}

/**
 * Specialized loading state for timeline sections
 */
export function TimelineSectionLoading({
  resourceType = 'equipment',
  className = ''
}: {
  resourceType?: 'equipment' | 'crew';
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-6 w-48" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2 ml-6">
          <Skeleton className="h-10 w-40" />
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-12" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading state for individual timeline cells
 */
export function TimelineCellLoading({
  width = 48,
  height = 48,
  className = ''
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div 
      className={`animate-pulse bg-muted/30 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Hook for managing timeline loading states
 */
export function useTimelineLoading(
  isDataLoading: boolean,
  isBookingsLoading: boolean,
  additionalLoading: boolean[] = []
) {
  const isLoading = isDataLoading || isBookingsLoading || additionalLoading.some(Boolean);
  
  const loadingStates = {
    isLoading,
    isDataLoading,
    isBookingsLoading,
    isReady: !isLoading,
    
    // Helper for determining loading variant
    getLoadingVariant: () => {
      if (isDataLoading && isBookingsLoading) return 'timeline';
      if (isDataLoading) return 'skeleton'; 
      if (isBookingsLoading) return 'spinner';
      return 'spinner';
    }
  };
  
  return loadingStates;
}