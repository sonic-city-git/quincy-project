/**
 * STANDARDIZED CARD COMPONENT
 * 
 * Extends StatusCard pattern to work with any content type
 * Provides consistent styling across projects, resources, and dashboard
 */

import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from 'lucide-react';
import { STATUS_COLORS, StatusType } from "@/components/dashboard/shared/StatusCard";

export type CardVariant = 'default' | 'compact' | 'list' | 'table-row';

export interface StandardizedCardProps {
  // Content
  title?: string;
  subtitle?: string;
  children: ReactNode;
  icon?: LucideIcon;
  
  // Appearance
  variant?: CardVariant;
  status?: StatusType;
  loading?: boolean;
  highlighted?: boolean;
  
  // Interactions
  onClick?: () => void;
  onDoubleClick?: () => void;
  href?: string;
  
  // Custom styling
  className?: string;
}

/**
 * Standardized card component that can be used for projects, resources, etc.
 * Uses the same color system as StatusCard for consistency
 */
export function StandardizedCard({
  title,
  subtitle,
  children,
  icon: Icon,
  variant = 'default',
  status = 'operational',
  loading = false,
  highlighted = false,
  onClick,
  onDoubleClick,
  href,
  className = ''
}: StandardizedCardProps) {
  const colors = STATUS_COLORS[status];
  
  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          card: 'border-0 shadow-sm relative overflow-hidden transition-all hover:shadow-md',
          content: 'p-3',
          layout: 'space-y-2'
        };
      case 'list':
        return {
          card: 'border-0 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:bg-zinc-800/30',
          content: 'p-4',
          layout: 'space-y-3'
        };
      case 'table-row':
        return {
          card: 'border-0 border-b border-zinc-800 rounded-none transition-all hover:bg-zinc-800/30',
          content: 'p-4',
          layout: 'flex items-center gap-4'
        };
      default:
        return {
          card: 'border border-zinc-800 transition-all hover:shadow-md hover:border-zinc-700',
          content: 'p-4',
          layout: 'space-y-3'
        };
    }
  };

  const classes = getVariantClasses();
  
  const CardComponent = href ? 'a' : 'div';
  const cardProps = href ? { href } : {};
  
  return (
    <Card 
      as={CardComponent}
      {...cardProps}
      className={`
        ${classes.card}
        bg-gradient-to-br ${colors.bg} 
        ${highlighted ? `ring-2 ${colors.ring}` : ''}
        ${onClick || href ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <CardContent className={classes.content}>
        <div className={classes.layout}>
          {/* Header */}
          {(title || Icon) && (
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`w-8 h-8 rounded-lg bg-background/20 flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className="text-sm font-medium truncate">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Standardized grid layout for cards
 */
export function StandardizedCardGrid({ 
  children, 
  variant = 'default',
  className = ''
}: { 
  children: ReactNode;
  variant?: 'compact' | 'default' | 'list';
  className?: string;
}) {
  const gridClasses = {
    compact: 'grid grid-cols-2 md:grid-cols-4 gap-3',
    default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    list: 'space-y-2'
  };
  
  return (
    <div className={`${gridClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}