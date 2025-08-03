/**
 * CONSOLIDATED: ProjectTabCard - Eliminates Card layout duplication
 * 
 * Replaces identical Card patterns across 4+ project tabs
 * Provides consistent tab card UX with header actions and content areas
 */

import { ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface ProjectTabCardProps {
  // Header configuration
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  
  // Action button (optional)
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  actionDisabled?: boolean;
  
  // Additional header content
  headerExtra?: ReactNode;
  
  // Content
  children: ReactNode;
  
  // Styling variants
  variant?: 'default' | 'flex' | 'compact';
  className?: string;
  contentClassName?: string;
  
  // Size variants
  height?: string | number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Unified Card component for all project tabs
 */
export function ProjectTabCard({
  title,
  icon: IconComponent,
  iconColor = '',
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actionDisabled = false,
  headerExtra,
  children,
  variant = 'default',
  className = '',
  contentClassName = '',
  height,
  padding = 'lg'
}: ProjectTabCardProps) {
  
  // Variant-specific styling
  const variantClasses = {
    default: 'rounded-lg bg-zinc-800/45',
    flex: 'flex-[8] bg-zinc-800/45 rounded-lg border border-zinc-700/50 transition-colors',
    compact: 'rounded-lg bg-zinc-800/45 border border-zinc-700/50'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };

  const cardStyle = height ? { height } : {};

  return (
    <Card 
      className={`${variantClasses[variant]} ${className}`}
      style={cardStyle}
    >
      {/* Card Header */}
      {(title || actionLabel || headerExtra) && (
        <div className={`
          flex items-center justify-between 
          ${variant === 'flex' ? 'px-4 py-3 border-b border-zinc-700/50' : 'mb-6'}
          ${padding === 'none' ? 'p-4' : ''}
        `}>
          <div className="flex items-center gap-4">
            {/* Title with optional icon */}
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className={`h-5 w-5 ${iconColor || 'text-primary'}`} />
              )}
              <h2 className={`font-semibold ${variant === 'flex' ? 'text-lg' : 'text-xl'}`}>
                {title}
              </h2>
            </div>
            
            {/* Extra header content */}
            {headerExtra}
          </div>
          
          {/* Action button */}
          {actionLabel && onAction && (
            <Button 
              onClick={onAction}
              disabled={actionDisabled}
              className="gap-2"
              size={variant === 'flex' ? 'sm' : 'default'}
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {actionLabel}
            </Button>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className={`
        ${variant === 'flex' ? '' : paddingClasses[padding]}
        ${contentClassName}
      `}>
        {children}
      </div>
    </Card>
  );
}

/**
 * Specialized card for equipment tabs with price display
 */
export function ProjectEquipmentCard({
  title = "Project Equipment",
  totalPrice,
  formatPrice,
  children,
  ...props
}: Omit<ProjectTabCardProps, 'headerExtra'> & {
  totalPrice?: number;
  formatPrice?: (price: number) => string;
}) {
  const headerExtra = totalPrice !== undefined && formatPrice ? (
    <span className="text-sm text-muted-foreground">
      Total: {formatPrice(totalPrice)}
    </span>
  ) : null;

  return (
    <ProjectTabCard
      title={title}
      variant="flex"
      headerExtra={headerExtra}
      contentClassName="h-[600px] overflow-hidden"
      padding="none"
      {...props}
    >
      {children}
    </ProjectTabCard>
  );
}