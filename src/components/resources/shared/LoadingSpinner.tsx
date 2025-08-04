/**
 * CONSOLIDATED: LoadingSpinner - Eliminates loading state duplication
 * 
 * Replaces identical loading components across resource tables
 * Provides consistent loading UI for all resource types
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/design-system";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

/**
 * Unified loading spinner for resource tables
 */
export function LoadingSpinner({ 
  message = "Loading...", 
  className 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}